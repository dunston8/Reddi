from app.services.llm import send_prompt, create_embeddings
from app.services.supabase_client import supabase
from typing import List
import json



def generate_oppgaver(topic: str, subject: str, grade: int) -> dict:
    user_prompt = f"""
        Topic: {topic}
        Subject: {subject}
        """
    
    query_embedding = create_embeddings([user_prompt])[0]
    filter_tags = generate_prompt_tags(topic, subject, grade)

    response = supabase.rpc(
        "match_document_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": 5,
            "filter_tags": None,          # or None
            "filter_document_id": None           # or specific id
        }
    ).execute()

    chunks = response.data
    oppgaver = [
    {
        "question": chunk.get("content", ""),
        "difficulty": "Lett",
        "page_start": chunk.get("page_start"),
        "page_end": chunk.get("page_end"),
    }
    for chunk in chunks or []
    ]
    return oppgaver



def generate_prompt_tags(topic: str, subject: str, grade: int):
    prompt = """
    You are an expert Norwegian curriculum analyzer.

    For this lesson plan, generate 3–6 concise academic concept tags.
    Use short noun phrases.
    Return STRICT JSON in this format. No formating or text before or after the JSON (no ```json), just text that follows JSON format:

    [
        {"tags": ["tag1", "tag2"]}
    ]

    Example:
    [
        {"tags": ["økologi", "næringskjede", "produsenter"]}
    ]

    
    Here is some relevant information for you to generate these tags:
    """

    user_prompt = f"""
    Topic: {topic}
    Subject: {subject}
    Grade: {grade}
    """

    response = send_prompt(prompt + "\n" + user_prompt)
    return json.loads(response)


def create_oppgaver_activity(topic, subject, grade, id, mode, duration, position):
    oppgaver = generate_oppgaver(topic, subject, grade)
    return {
        "id": id,
        "type": "Oppgaver",
        "mode": mode,
        "duration": duration,
        "position": position,
        "selected_variant_index": 0,
        "variants": [
        {
            "tasks": oppgaver
        },
        {
            "tasks": oppgaver 
        },
        {
            "tasks": oppgaver
        }
        ]
    }