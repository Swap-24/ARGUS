from google import genai
import json
import re

client = genai.Client(api_key="AIzaSyChUVZIVc7RxTf8LvLn3wNHEnAZtyAM2dE")


def extract_json(text: str) -> str:
    """
    Extract JSON safely from Gemini response.
    Handles markdown, extra text, and formatting issues.
    """
    # Remove markdown code blocks
    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text)

    # Find first JSON object
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)

    raise ValueError("No JSON found")


def score_sentiment(text: str) -> dict:
    prompt = f"""
You are an expert debate judge.

Evaluate this argument:

"{text}"

Return ONLY JSON (no markdown, no explanation outside JSON):
{{
  "confidence": 0.0,
  "persuasiveness": 0.0,
  "justification": "short explanation"
}}
"""

    try:
        response = client.models.generate_content(
            model="models/gemini-2.5-flash-lite",
            contents=prompt,
        )

        raw = response.text
        print("RAW:", raw)

        # 🔥 Extract clean JSON
        clean_json = extract_json(raw)

        data = json.loads(clean_json)

        score = (data["confidence"] + data["persuasiveness"]) / 2

        return {
            "score": round(score, 4),
            "justification": data["justification"]
        }

    except Exception as e:
        print("ERROR:", e)
        return {
            "score": 0.5,
            "justification": "Fallback due to Gemini error"
        }