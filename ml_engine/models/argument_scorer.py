"""
argument_scorer.py
Hybrid approach:
- Local model (BART) → argument strength
- Gemini → fallacy detection + explanation
"""

from transformers import pipeline
import torch
from google import genai
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("API_KEY")


# ✅ Use env variable instead of hardcoding
client = genai.Client(api_key=GEMINI_API_KEY)

_zero_shot_pipe = None

# ────────────────────────────────────────────────────────────────
# Argument Strength (Local Model)
# ────────────────────────────────────────────────────────────────

STRENGTH_LABELS = [
    "a well-reasoned argument supported by evidence",
    "a clear and logical claim",
    "a weak or unsupported assertion",
    "an emotional appeal without logic",
]


def get_zero_shot_pipeline():
    global _zero_shot_pipe
    if _zero_shot_pipe is None:
        device = 0 if torch.cuda.is_available() else -1
        _zero_shot_pipe = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
            device=device,
        )
    return _zero_shot_pipe


def score_argument_strength(text: str) -> float:
    pipe = get_zero_shot_pipeline()

    result = pipe(text[:1024], candidate_labels=STRENGTH_LABELS, multi_label=False)
    label_scores = dict(zip(result["labels"], result["scores"]))

    score = (
        label_scores.get("a well-reasoned argument supported by evidence", 0) * 1.0 +
        label_scores.get("a clear and logical claim", 0) * 0.7 -
        label_scores.get("a weak or unsupported assertion", 0) * 0.5 -
        label_scores.get("an emotional appeal without logic", 0) * 0.3
    )

    return round(max(0.0, min(1.0, score)), 4)


# ────────────────────────────────────────────────────────────────
# Gemini Fallacy Detection (🔥 upgraded)
# ────────────────────────────────────────────────────────────────

def extract_json(text: str) -> dict:
    """Safely extract JSON from Gemini response."""
    text = re.sub(r"```json|```", "", text).strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)

    if not match:
        raise ValueError("No JSON found in Gemini response")

    return json.loads(match.group(0))


def detect_fallacies(text: str, strength: float) -> list[dict]:
    """
    Smarter fallacy detection:
    - High-quality arguments → avoid nitpicking
    - Low-quality arguments → detect aggressively
    """

    prompt = f"""
You are an expert debate judge.

Argument:
"{text}"

Argument strength score: {strength}

Your task:
- Detect logical fallacies ONLY if they significantly weaken the argument.
- DO NOT nitpick minor issues in strong arguments.
- If strength > 0.7 → ONLY flag serious flaws.
- If strength < 0.4 → aggressively detect flaws.
- If argument is insulting/dismissive → MUST detect ad_hominem.

Important:
- A strong argument can still have minor flaws — IGNORE those.
- Only return fallacies if they meaningfully impact quality.

Fallacy definitions (be strict):
- ad_hominem: ONLY when the argument attacks a person's character, identity, or
  motives directly to dismiss them. Criticizing a methodology, framework, or
  tool is NOT ad hominem, even if it mentions the author.
- straw_man: misrepresenting an opponent's actual position
- appeal_to_authority: citing authority as sole proof with no supporting logic
- false_dichotomy: presenting only two options when more exist
- slippery_slope: assuming one event inevitably causes an extreme outcome
- hasty_generalization: broad conclusion from insufficient examples

When uncertain whether a fallacy applies, DO NOT include it.
Err heavily on the side of NOT flagging.
- "author desires" or similar phrasing critiquing a model/framework is NOT
  ad hominem unless it explicitly attacks the person's character or integrity.

Return ONLY JSON:
{{
  "fallacies": [
    {{
      "type": "fallacy_name",
      "explanation": "short explanation"
    }}
  ]
}}
"""

    try:
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt,
        )

        raw = response.text
        data = extract_json(raw)
        fallacies = data.get("fallacies", [])

        # 🔥 FINAL SAFETY FILTER (VERY IMPORTANT)

        # If strong argument → only allow serious fallacies
        if strength > 0.7:
            fallacies = [
                f for f in fallacies
                if f["type"] in ["ad_hominem", "straw_man"]
            ]

        # If VERY strong → remove everything
        if strength > 0.85:
            return []

        return fallacies

    except Exception as e:
        print("FALLACY ERROR:", e)
        return []