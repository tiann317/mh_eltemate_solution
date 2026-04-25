import httpx
from fastapi import HTTPException

from ..config import get_settings


async def query_lda(prompt: str) -> dict:
    settings = get_settings()
    if not (settings.lda_client_id and settings.lda_client_secret):
        return {"answer": "", "sources": [], "skipped": "LDA credentials not configured."}

    async with httpx.AsyncClient(timeout=60.0) as client:
        tok = await client.post(
            settings.lda_token_url,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "grant_type": "authorization_code",
                "client_id": settings.lda_client_id,
                "client_secret": settings.lda_client_secret,
            },
        )
        if not tok.is_success:
            raise HTTPException(502, "LDA token request failed.")
        token = tok.json().get("access_token")
        if not token:
            raise HTTPException(502, "No LDA token returned.")

        qna = await client.post(
            settings.lda_qna_url,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
            json={
                "data_asset": "Beratermodul Datenschutzrecht",
                "mode": "attribution",
                "filter": [{}],
                "prompt": prompt,
            },
        )
        d = qna.json()

    return {
        "answer": d.get("answer", ""),
        "sources": d.get("sourcedocuments") if isinstance(d.get("sourcedocuments"), list) else [],
    }
