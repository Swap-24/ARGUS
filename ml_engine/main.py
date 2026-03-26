"""
main.py
FastAPI entry point for the Argus ML engine.
Only local models are preloaded (relevance + argument scorer).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers.analyze import router as analyze_router

# Preload only the models we still use
from models.relevance import get_embedding_model
from models.argument_scorer import get_zero_shot_pipeline


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load required models into memory before accepting requests."""
    print("Loading ML models...")

    # ❌ REMOVED sentiment model (now using API)

    get_embedding_model()
    print("  ✓ Relevance model (Sentence-BERT)")

    get_zero_shot_pipeline()
    print("  ✓ Argument scorer (BART)")

    print("All models loaded. Ready.")
    yield
    # Cleanup on shutdown (nothing needed)


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