from pydantic import BaseModel
from typing import List, Optional


class ArgumentRequest(BaseModel):
    argument_text: str
    topic: str
    debate_history: List[str] = []
    speaker: str


class ScoreBreakdown(BaseModel):
    sentiment: float        # 0-1, tone/confidence
    argument_strength: float # 0-1, logical quality
    relevance: float         # 0-1, on-topic score
    fallacy_penalty: float   # 0-1, how fallacious


class ScoreResponse(BaseModel):
    scores: ScoreBreakdown
    final_score: int         # 0-100 weighted aggregate
    fallacies_detected: List[str]
    feedback: str