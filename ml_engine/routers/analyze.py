from fastapi import APIRouter
from schemas.argument import ArgumentRequest, ScoreResponse, ScoreBreakdown
from models.sentiment import score_sentiment
from models.relevance import score_relevance
from models.argument_scorer import score_argument_strength, detect_fallacies

import asyncio

router = APIRouter()

# ── Scoring weights ──────────────────────────────────────────────
WEIGHTS = {
    "argument_strength": 0.20,
    "relevance":         0.20,
    "sentiment":         0.30,
    "no_fallacy":        0.30,
}


# ── Feedback generator (clean UX) ────────────────────────────────
def generate_feedback(scores: ScoreBreakdown, fallacies: list[dict], final: int, sentiment_justification: str = "") -> str:
    if fallacies:
        return f"{fallacies[0]['explanation']} {_strength_comment(scores.argument_strength)}"

    # Use Gemini's own justification — it's already tailored to the argument
    if sentiment_justification:
        return f"{sentiment_justification} {_strength_comment(scores.argument_strength)}"

    # Fallback only if Gemini failed entirely
    if final >= 80:
        return "Excellent argument. Strong logic and solid reasoning."
    if final >= 65:
        return f"Good argument. {_relevance_comment(scores.relevance)}"
    if final >= 45:
        return f"Weak argument. {_strength_comment(scores.argument_strength)}"
    return "Very weak — try backing your claim with evidence or reasoning."

def _strength_comment(strength: float) -> str:
    if strength >= 0.7: return "Logic is sound."
    if strength >= 0.4: return "Argument needs stronger support."
    return "Consider adding evidence or examples."


def _relevance_comment(relevance: float) -> str:
    if relevance >= 0.7: return "Well focused on the topic."
    if relevance >= 0.4: return "Slightly off topic."
    return "Try to stay closer to the debate topic."


# ── Main endpoint ────────────────────────────────────────────────
@router.post("/analyze", response_model=ScoreResponse)
async def analyze_argument(req: ArgumentRequest):
    text = req.argument_text.strip()
    topic = req.topic.strip()

    word_count = len(text.split())
    if word_count < 5:
        return ScoreResponse(
            scores=ScoreBreakdown(sentiment=0, argument_strength=0, relevance=0, fallacy_penalty=0),
            final_score=5,
            fallacies_detected=[],
            fallacy_explanations=[],
            feedback="Too short to evaluate. Make an actual argument.",
            sentiment_justification="Input too short."
        )

    # 🔥 Run async for all heavy tasks
    sentiment_task = asyncio.to_thread(score_sentiment, text)
    sentiment_data = await sentiment_task

# Local models first
    strength = score_argument_strength(text)
    relevance = score_relevance(text, topic)

# 🔥 NOW pass strength (IMPORTANT)
    fallacies = detect_fallacies(text, strength)

    sentiment = sentiment_data["score"]

    # Local models
    strength = score_argument_strength(text)
    relevance = score_relevance(text, topic)

    # Extract fallacy types + explanations
    fallacy_types = [f["type"] for f in fallacies]
    fallacy_explanations = [f["explanation"] for f in fallacies]

    fallacy_penalty = min(1.0, len(fallacy_types) * 0.4)

    # ── Final score ──────────────────────────────────────────────
    raw_score = (
        strength  * WEIGHTS["argument_strength"] +
        relevance * WEIGHTS["relevance"] +
        sentiment * WEIGHTS["sentiment"] +
        (1 - fallacy_penalty) * WEIGHTS["no_fallacy"]
    )

    final_score = round(raw_score * 100)

    scores = ScoreBreakdown(
        sentiment=sentiment,
        argument_strength=strength,
        relevance=relevance,
        fallacy_penalty=fallacy_penalty,
    )

    feedback = generate_feedback(scores, fallacies, final_score, sentiment_data["justification"])

    return ScoreResponse(
        scores=scores,
        final_score=final_score,

        # 🔥 Clean outputs for frontend
        fallacies_detected=fallacy_types,
        fallacy_explanations=fallacy_explanations,

        feedback=feedback,
        sentiment_justification=sentiment_data["justification"],
    )