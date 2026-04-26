"""FastAPI entrypoint.

Run with:
    uvicorn backend.main:app --reload --port 8000
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database.models import Base  # noqa: F401  (register models)
from backend.database.session import engine
from backend.routers import ai, db as db_router, escalation, lda

app = FastAPI(title="Aegis Notice API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # Auto-create tables on startup (per user request).
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


app.include_router(db_router.router)
app.include_router(ai.router)
app.include_router(lda.router)
app.include_router(escalation.router)
