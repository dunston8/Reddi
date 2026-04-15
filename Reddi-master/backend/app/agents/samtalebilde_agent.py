from app.services.llm import send_prompt
from app.services.image_search import search_image
import json

SYSTEM_PROMPT = """
You are a Norwegian teacher assistant.

I want you to generate three different options for the following:

Your task:
1. Create an image prompt for a search in Unsplash. This prompt needs to be SHORT and specific. Instead of "Cat roaming outside on green field", try "cat outside"
2. Be creative with the image. This is an image for discussion, not just for a presentation background. Example: "thermometer" when discussing "negative numbers"
3. Create 4–6 open-ended discussion questions based on the image and topic.
4. The image must NOT contain text or labels.
5. The image must be suitable for children/teens.

Return STRICT JSON in this format. No formating or text before or after the JSON (no ```json), just text that follows JSON format:

[
    {
    "image_prompt": "...",
    "questions": ["...", "..."]
    },
    {
    "image_prompt": "...",
    "questions": ["...", "..."]
    },
    {
    "image_prompt": "...",
    "questions": ["...", "..."]
    }
]

Here is some relevant information for you to generate these questions with. Write image prompt in English, and questions in Norwegian;
"""

def generate_samtalebilde_plan(topic: str, subject: str, grade: int) -> dict:
    user_prompt = f"""
        Topic: {topic}
        Subject: {subject}
        Grade: {grade}

        Focus on conceptual understanding and discussion.
        """

    response = send_prompt(SYSTEM_PROMPT+"\n"+user_prompt)

    return json.loads(response)



def create_samtalebilde_activity(topic, subject, grade, id, mode, duration, position):
    plan = generate_samtalebilde_plan(topic, subject, grade)

    image1 = search_image(plan[0]["image_prompt"])
    image2 = search_image(plan[1]["image_prompt"])
    image3 = search_image(plan[2]["image_prompt"])

    p1 = plan[0]
    p2 = plan[1]
    p3 = plan[2]

    return {
        "id": id,
        "type": "Samtalebilde",
        "mode": mode,
        "duration": duration,
        "position": position,
        "selected_variant_index": 0,
        "variants": [
        {
            "image": {
                "url": image1["url"],
                "prompt": p1["image_prompt"]
            },
            "questions": p1["questions"]
        },
        {
            "image": {
                "url": image2["url"],
                "prompt": p2["image_prompt"]
            },
            "questions": p2["questions"]
        },
        {
            "image": {
                "url": image3["url"],
                "prompt": p3["image_prompt"]
            },
            "questions": p3["questions"]
        }
        ]
    }
        
     