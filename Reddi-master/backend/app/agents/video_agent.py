from app.services.llm import send_prompt
import json

SYSTEM_PROMPT = """
You are a Norwegian teacher assistant.

Your task:
1. Find a relevant video on the internet for the subject. 
2. Retrieve URL and duration 
3. Be creative.
4. ONLY return publicly available, educational YouTube videos.
5. DO NOT invent URLs. If unsure, return null.


    Return STRICT JSON in this format. No formating or text before or after the JSON (no ```json), just text that follows JSON format:

    {
        "video_url": ""
    }

Here is some relevant information for you;
"""

def generate_video_plan(topic: str, subject: str, grade: int, duration: int) -> dict:
    user_prompt = f"""
        Topic: {topic}
        Subject: {subject}
        Grade: {grade}
        Duration: {duration}

        Focus on conceptual understanding and discussion.
        """

    # response = send_prompt(SYSTEM_PROMPT+"\n"+user_prompt)

    return json.loads('{"video_url": "https://youtu.be/dQw4w9WgXcQ?si=nbXcnTUkuURMY-QQ"}')



def create_forklaringsvideo_activity(topic, subject, grade, id, mode, duration, position):
    plan = generate_video_plan(topic, subject, grade, duration)

    return {
        "id": id,
        "type": "Forklaringsvideo",
        "mode": mode,
        "duration": duration,
        "position": position,
        "video_url": plan["video_url"]
    }