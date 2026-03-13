"""
argument_scorer.py
Uses facebook/bart-large-mnli for two jobs:
  1. Argument strength — zero-shot classify against logical quality labels
  2. Fallacy detection — zero-shot classify against known fallacy patterns
"""

from transformers import pipeline
import torch

_zero_shot_pipe = None

# Strength labels — BART decides how well the argument matches these
STRENGTH_LABELS = [
    "a well-reasoned argument supported by evidence",
    "a clear and logical claim",
    "a weak or unsupported assertion",
    "an emotional appeal without logic",
]

# Fallacy patterns — if any score above threshold, it's flagged
FALLACY_LABELS = {
    "ad_hominem":           "attacking the person instead of their argument",
    "straw_man":            "misrepresenting the opponent's argument",
    "appeal_to_authority":  "citing authority without relevant evidence",
    "false_dichotomy":      "presenting only two options when more exist",
    "slippery_slope":       "claiming one event will lead to extreme consequences without justification",
    "hasty_generalization": "drawing broad conclusions from limited examples",
}

FALLACY_THRESHOLD = 0.55  # confidence needed to flag a fallacy


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
    """
    Classifies argument against strength labels.
    Returns a 0-1 score based on how strongly it matches positive labels.
    """
    pipe = get_zero_shot_pipeline()
    result = pipe(text[:1024], candidate_labels=STRENGTH_LABELS, multi_label=False)

    label_scores = dict(zip(result["labels"], result["scores"]))

    # Positive labels add to score, negative labels subtract
    score = (
        label_scores.get("a well-reasoned argument supported by evidence", 0) * 1.0 +
        label_scores.get("a clear and logical claim", 0) * 0.7 -
        label_scores.get("a weak or unsupported assertion", 0) * 0.5 -
        label_scores.get("an emotional appeal without logic", 0) * 0.3
    )

    # Clamp to [0, 1]
    return round(max(0.0, min(1.0, score)), 4)


def detect_fallacies(text: str) -> list[str]:
    """
    Checks argument against all known fallacy patterns.
    Returns list of fallacy keys that exceed the confidence threshold.
    """
    pipe = get_zero_shot_pipeline()
    labels = list(FALLACY_LABELS.values())
    keys = list(FALLACY_LABELS.keys())

    result = pipe(text[:1024], candidate_labels=labels, multi_label=True)
    label_scores = dict(zip(result["labels"], result["scores"]))

    detected = []
    for key, description in FALLACY_LABELS.items():
        if label_scores.get(description, 0) >= FALLACY_THRESHOLD:
            detected.append(key)

    return detected