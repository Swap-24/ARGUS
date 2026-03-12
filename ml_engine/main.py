from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---
class ArgumentRequest(BaseModel):
    argument_text: str
    topic: str
    debate_history: List[str] = []
    speaker: str

class ScoreResponse(BaseModel):
    scores: dict
    final_score: int
    fallacies_detected: List[str]
    feedback: str

@app.get("/")
def root():
    return {"status": "Argus ML engine running"}

@app.post("/analyze", response_model=ScoreResponse)
def analyze_argument(req: ArgumentRequest):
    return ScoreResponse(
        scores={
            "sentiment": 0.75,
            "argument_strength": 0.70,
            "relevance": 0.85,
            "fallacy_penalty": 0.0
        },
        final_score=75,
        fallacies_detected=[],
        feedback="Solid argument. Consider adding supporting evidence."
    )