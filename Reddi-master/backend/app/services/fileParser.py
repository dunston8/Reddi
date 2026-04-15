import io
import re
import pdfplumber
import logging
from dataclasses import dataclass, field
from typing import List, Optional
from app.services.supabase_client import supabase


@dataclass
class Line:
    text: str
    font_size: float
    bold: bool
    page: int


@dataclass
class Chunk:
    id: Optional[int]
    document_id: int
    type: str
    title: Optional[str]
    content: str
    page_start: int
    page_end: int
    token_count: int
    tags: List[str] = field(default_factory=list)
    is_tagged: bool = False
    embedding: Optional[List[float]] = None
    is_exercise: bool = False


logging.getLogger("pdfminer").setLevel(logging.ERROR)

# --- Tunable constants ---
BODY_FONT_SIZE = 10.5       # Approximate body font size for the curriculum
LINE_Y_TOLERANCE = 3.0      # Points: words within this vertical gap are on the same line
MAX_CHUNK_WORDS = 400       # Split chunks that exceed this word count
OVERLAP_LINES = 2           # Lines carried over to next chunk for context continuity

# Structural heading patterns for Norwegian school textbooks
HEADING_PATTERNS = [
    re.compile(r"^kapittel\s+\d+", re.IGNORECASE),          # "Kapittel 3"
    re.compile(r"^\d+[\.,]\d*\s+\S"),                        # "1.1 Tittel"
    re.compile(r"^\d+[\.,]\d+[\.,]\d+\s+\S"),               # "1.1.2 Tittel"
    re.compile(r"^(oppgave|eksempel|sammendrag|definisjon|refleksjon|aktivitet|læringsmål)\w*\b", re.IGNORECASE),
]

INSTRUCTION_VERBS = {
    "regn", "forklar", "diskuter", "vis", "beskriv",
    "tegn", "finn", "skriv", "sammenlikn", "vurder",
    "drøft", "analyser", "lag", "sett opp",
}


def parse_book_from_supabase(file_path: str, document_id: int) -> List[Chunk]:
    pdf_file = load_pdf_from_supabase(bucket="uploads", file_path=file_path)
    lines = extract_lines_from_pdf(pdf_file)
    chunks = chunk_lines(lines, document_id)
    return chunks


def extract_lines_from_pdf(pdf_file: io.BytesIO) -> List[Line]:
    lines: List[Line] = []

    with pdfplumber.open(pdf_file) as pdf:
        for page_index, page in enumerate(pdf.pages):
            words = page.extract_words(
                extra_attrs=["size", "fontname"],
                use_text_flow=True,
                keep_blank_chars=False,
            )
            if not words:
                continue
            page_lines = group_words_into_lines(words, page_index + 1)
            lines.extend(page_lines)

    return lines


def group_words_into_lines(words: list, page_num: int) -> List[Line]:
    """Group extracted words into visual text lines using their y-coordinates."""
    words_sorted = sorted(words, key=lambda w: (round(w["top"] / LINE_Y_TOLERANCE), w["x0"]))

    result: List[Line] = []
    current_group = [words_sorted[0]]

    for w in words_sorted[1:]:
        if abs(w["top"] - current_group[-1]["top"]) <= LINE_Y_TOLERANCE:
            current_group.append(w)
        else:
            result.append(build_line_from_words(current_group, page_num))
            current_group = [w]

    if current_group:
        result.append(build_line_from_words(current_group, page_num))

    return result


def build_line_from_words(words: list, page_num: int) -> Line:
    text = " ".join(w["text"] for w in words).strip()
    font_size = max(w["size"] for w in words)
    # A line is bold if ALL its words are bold (avoids inline bold terms triggering heading)
    bold = all("Bold" in w["fontname"] for w in words)
    return Line(text=text, font_size=font_size, bold=bold, page=page_num)


def is_heading(line: Line) -> bool:
    text = line.text.strip()
    if not text or len(text) < 2:
        return False

    # Structural pattern match (chapter, section numbers, exercise blocks, etc.)
    if any(p.match(text) for p in HEADING_PATTERNS):
        return True

    # Significantly larger font than body text
    if line.font_size >= BODY_FONT_SIZE * 1.35:
        return True

    # Uniformly bold, short, looks like a standalone heading label
    if (
        line.bold
        and len(text) < 60
        and not text[-1] in ".,:;"   # Headings don't trail off mid-sentence
        and not text[0].islower()    # Headings start with a capital letter
    ):
        return True

    return False


def chunk_lines(lines: List[Line], document_id: int) -> List[Chunk]:
    chunks: List[Chunk] = []
    current_lines: List[Line] = []
    current_title: Optional[str] = None

    for line in lines:
        if not line.text.strip():
            continue

        if is_heading(line):
            if current_lines:
                chunks.extend(split_if_needed(document_id, current_title, current_lines))
            current_title = line.text
            current_lines = []
            continue

        current_lines.append(line)

    if current_lines:
        chunks.extend(split_if_needed(document_id, current_title, current_lines))

    return chunks


def split_if_needed(document_id: int, title: Optional[str], lines: List[Line]) -> List[Chunk]:
    """Split a chunk at word-count boundaries if it exceeds MAX_CHUNK_WORDS."""
    word_count = sum(len(l.text.split()) for l in lines)

    if word_count <= MAX_CHUNK_WORDS:
        return [build_chunk(document_id, title, lines)]

    chunks = []
    part_lines: List[Line] = []
    part_words = 0
    part_index = 0

    for line in lines:
        part_lines.append(line)
        part_words += len(line.text.split())

        if part_words >= MAX_CHUNK_WORDS:
            sub_title = f"{title} ({part_index + 1})" if title else f"Del {part_index + 1}"
            chunks.append(build_chunk(document_id, sub_title, part_lines))
            part_lines = part_lines[-OVERLAP_LINES:] if OVERLAP_LINES > 0 else []
            part_words = sum(len(l.text.split()) for l in part_lines)
            part_index += 1

    if part_lines:
        sub_title = f"{title} ({part_index + 1})" if (title and part_index > 0) else title
        chunks.append(build_chunk(document_id, sub_title, part_lines))

    return chunks


def build_chunk(document_id: int, title: Optional[str], lines: List[Line]) -> Chunk:
    # Preserve line breaks so paragraph structure survives into the database
    text = "\n".join(l.text for l in lines)
    word_count = len(text.split())

    return Chunk(
        id=-1,
        document_id=document_id,
        type=classify_chunk(text),
        title=title or "Uten tittel",
        content=text,
        page_start=lines[0].page,
        page_end=lines[-1].page,
        token_count=word_count,
    )


def classify_chunk(text: str) -> str:
    text_lower = text.lower()
    score = {"exercise": 0, "question": 0, "theory": 0, "summary": 0}

    if text_lower.startswith("sammendrag"):
        score["summary"] += 3

    q_count = text.count("?")
    if q_count >= 3:
        score["question"] += 2
    elif q_count >= 1:
        score["question"] += 1

    verb_hits = sum(1 for v in INSTRUCTION_VERBS if v in text_lower)
    if verb_hits >= 2:
        score["exercise"] += 3
    elif verb_hits == 1:
        score["exercise"] += 1

    word_count = len(text.split())
    if word_count > 200:
        score["theory"] += 1
    if word_count > 400:
        score["theory"] += 1

    return max(score, key=score.get)


def load_pdf_from_supabase(bucket: str, file_path: str) -> io.BytesIO:
    response = supabase.storage.from_(bucket).download(file_path)
    return io.BytesIO(response)
