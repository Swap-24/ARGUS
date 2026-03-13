"""
main.py
FastAPI entry point for the Argus ML engine.
Models are preloaded on startup so the first request isn't slow.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers.analyze import router as analyze_router

# Preload all models on startup
from models.sentiment import get_sentiment_pipeline
from models.relevance import get_embedding_model
from models.argument_scorer import get_zero_shot_pipeline


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all models into memory before accepting requests."""
    print("Loading ML models...")
    get_sentiment_pipeline()
    print("  ✓ Sentiment model (DistilBERT)")
    get_embedding_model()
    print("  ✓ Relevance model (Sentence-BERT)")
    get_zero_shot_pipeline()
    print("  ✓ Argument scorer (BART)")
    print("All models loaded. Ready.")
    yield
    # Cleanup on shutdown (nothing needed for now)


app = FastAPI(
    title="Argus ML Engine",
    description="Real-time debate argument scoring API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)


@app.get("/")
def root():
    return {"status": "Argus ML engine running"}