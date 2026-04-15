import os
import requests
import random

UNSPLASH_KEY = os.getenv("UNSPLASH_KEY")

def search_image(query: str) -> dict:
    url = "https://api.unsplash.com/search/photos"
    params = {
        "query": query,
        "per_page": 10,
        "orientation": "landscape"
    }
    headers = {
        "Authorization": f"Client-ID {UNSPLASH_KEY}"
    }

    res = requests.get(url, params=params, headers=headers)
    res.raise_for_status()

    results = res.json()["results"]
    if not results:
        raise ValueError("No images found")

    image = random.choice(results)

    return {
        "url": image["urls"]["regular"],
        "alt": image["alt_description"] or query,
        "credit": image["user"]["name"]
    }
