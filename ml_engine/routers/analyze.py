"""
analyze.py
POST /analyze — runs the full ML pipeline on an argument.
All four models run, scores are aggregated into a final 0-100 score.
"""

from fastapi import APIRouter
from schemas.argument import ArgumentRequest, ScoreResponse, ScoreBreakdown
from models.sentiment import score_sentiment
from models.relevance import score_relevance
from models.argument_scorer import score_argument_strength, detect_fallacies

router = APIRouter()

# ── Scoring weights (must sum to 1.0) ────────────────────────────────────────
WEIGHTS = {
    "argument_strength": 0.40,  # most important — is the logic sound?
    "relevance":         0.30,  # is it on topic?
    "sentiment":         0.20,  # is the framing confident?
    "no_fallacy":        0.10,  # bonus for clean argumentation
}


def generate_feedback(scores: ScoreBreakdown, fallacies: list[str], final: int) -> str:
    """Generate a short human-readable feedback string based on scores."""
    if fallacies:
        fallacy_label = fallacies[0].replace("_", " ").title()
        return f"Flagged for {fallacy_label}. {_strength_comment(scores.argument_strength)}"
    if final >= 80:
        return "Excellent argument. Strong logic and solid evidence."
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


@router.post("/analyze", response_model=ScoreResponse)
async def analyze_argument(req: ArgumentRequest):
    text = req.argument_text.strip()
    topic = req.topic.strip()

    # ── Run all four models ───────────────────────────────────────────────────
    sentiment       = score_sentiment(text)
    strength        = score_argument_strength(text)
    relevance       = score_relevance(text, topic)
    fallacies       = detect_fallacies(text)
    fallacy_penalty = min(1.0, len(fallacies) * 0.4)  # 0 fallacies = 0, 1 = 0.4, 2+ = capped at 1.0

    # ── Weighted aggregate ────────────────────────────────────────────────────
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

    feedback = generate_feedback(scores, fallacies, final_score)

    return ScoreResponse(
        scores=scores,
        final_score=final_score,
        fallacies_detected=fallacies,
        feedback=feedback,
    )