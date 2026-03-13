"""
sentiment.py
Uses DistilBERT fine-tuned on SST-2 to score argument confidence and tone.
Returns a 0-1 float where 1 = highly positive/confident framing.
"""

from transformers import pipeline
import torch

_sentiment_pipe = None

def get_sentiment_pipeline():
    global _sentiment_pipe
    if _sentiment_pipe is None:
        device = 0 if torch.cuda.is_available() else -1
        _sentiment_pipe = pipeline(
            "text-classification",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            device=device,
        )
    return _sentiment_pipe


def score_sentiment(text: str) -> float:
    """
    Returns a 0-1 score.
    POSITIVE label → score as-is (confident, assertive framing)
    NEGATIVE label → 1 - score (penalize overly negative/aggressive tone)
    """
    pipe = get_sentiment_pipeline()
    result = pipe(text[:512])[0]  # truncate to model max

    if result["label"] == "POSITIVE":
        return round(result["score"], 4)
    else:
        # Negative framing gets penalized but not zeroed —
        # aggressive arguments can still be valid
        return round(1 - result["score"] * 0.5, 4)