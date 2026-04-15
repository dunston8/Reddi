import os
from openai import OpenAI
from app.services.supabase_client import supabase

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))



def send_prompt(prompt: str):
    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt
    )

    supabase.table("agent_runs").insert({
        "prompt_sent":prompt,
        "response":response.output_text
    }).execute()

    try:
        return response.output_text
    except AttributeError:
        return response.output[0].content[0].text



def create_embeddings(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    return [item.embedding for item in response.data]
