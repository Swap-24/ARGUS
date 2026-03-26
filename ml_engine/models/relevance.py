"""
relevance.py
Uses Sentence-BERT to compute cosine similarity between
the argument and the debate topic.
High similarity = the argument is on-topic.
"""

from sentence_transformers import SentenceTransformer, util


_model = None

def get_embedding_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _model


def score_relevance(argument: str, topic: str) -> float:
    """
    Returns cosine similarity (0-1) between argument and topic embeddings.
    Scores below 0.2 are floored — even tangential arguments have some relevance.
    """
    model = get_embedding_model()
    embeddings = model.encode([argument, topic], convert_to_tensor=True)
    similarity = util.cos_sim(embeddings[0], embeddings[1]).item()

    # Normalize from [-1,1] cosine range to [0,1]
    normalized = (similarity + 1) / 2

    # Floor at 0.2 so no argument is completely penalized for topic drift
    return round(max(0.1, normalized), 4)