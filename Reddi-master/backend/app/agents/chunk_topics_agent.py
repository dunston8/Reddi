import json
import logging
from app.services.llm import send_prompt, create_embeddings
from app.services.fileParser import Chunk

logger = logging.getLogger(__name__)


def add_tags_to_chunks(chunks: list[Chunk]) -> list[Chunk]:
    generate_tags(chunks)
    generate_embeddings(chunks)
    return chunks


def generate_tags(chunks: list[Chunk]) -> None:
    formatted_chunks = "\n\n".join(
        f"[ID:{c.id}] {c.title} ({c.type})\n\"\"\"\n{c.content[:800]}\n\"\"\""
        for c in chunks
    )

    system_prompt = """Du er en ekspert på norsk læreplankunnskap.

    For hvert tekstutdrag nedenfor, generer 3–6 korte faglige nøkkelord på norsk.
    Bruk korte substantivfraser som dekker fagbegreper, tema og fagområde.
    Ignorer utdrag som er for korte eller uforståelige.
    Svar KUN med gyldig JSON (ingen formatering, ingen ```json):

    [
        {"id": <chunk_id>, "tags": ["tag1", "tag2", "tag3"]}
    ]"""

    user_prompt = f"Tekstutdrag:\n{formatted_chunks}"

    try:
        raw = send_prompt(system_prompt + "\n" + user_prompt).strip()
        # Strip accidental markdown fences from the LLM response
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        parsed = json.loads(raw)
        tags_by_id = {item["id"]: item["tags"] for item in parsed}
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.warning(f"Tag generation failed: {e} — chunks will have empty tags.")
        tags_by_id = {}

    for chunk in chunks:
        chunk.tags = tags_by_id.get(chunk.id, [])


def generate_embeddings(chunks: list[Chunk]) -> None:
    # Embed title + tags + content excerpt so vectors capture both topic and substance
    texts = [
        f"{c.title}\n{' '.join(c.tags)}\n{c.content[:1000]}"
        for c in chunks
    ]
    embeddings = create_embeddings(texts)
    for chunk, embedding in zip(chunks, embeddings):
        chunk.embedding = embedding
