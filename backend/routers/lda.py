"""LDA Legal Data Hub proxy."""
from __future__ import annotations

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

from backend.config import settings

router = APIRouter(prefix="/api", tags=["lda"])


class LDABody(BaseModel):
    prompt: str


@router.post("/query-lda")
async def query_lda(body: LDABody):
    if not settings.lda_client_id or not settings.lda_client_secret:
        return {"answer": "", "sources": [], "skipped": "LDA credentials not configured."}

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            tok = await client.post(
                "https://online.otto-schmidt.de/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": settings.lda_client_id,
                    "client_secret": settings.lda_client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        except httpx.HTTPError as e:
            return {"answer": "", "sources": [], "skipped": f"LDA token request failed: {e}"}

        if tok.status_code != 200:
            return {"answer": "", "sources": [], "skipped": f"LDA token status {tok.status_code}"}
        token = tok.json().get("access_token")
        if not token:
            return {"answer": "", "sources": [], "skipped": "LDA token missing."}

        try:
            qna = await client.post(
                "https://otto-schmidt.legal-data-hub.com/api/qna",
                json={
                    "data_asset": "Beratermodul Datenschutzrecht",
                    "mode": "attribution",
                    "filter": [{}],
                    "prompt": body.prompt,
                },
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
        except httpx.HTTPError as e:
            return {"answer": "", "sources": [], "skipped": f"LDA query failed: {e}"}

    if qna.status_code != 200:
        return {"answer": "", "sources": [], "skipped": f"LDA qna status {qna.status_code}"}
    d = qna.json()
    return {
        "answer": d.get("answer", ""),
        "sources": d.get("sourcedocuments") if isinstance(d.get("sourcedocuments"), list) else [],
    }
