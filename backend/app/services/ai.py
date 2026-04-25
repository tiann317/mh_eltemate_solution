"""Legal reasoning via LDA (Legal Data Hub) QnA endpoint.

Credentials are read from the environment:
  LDA_CLIENT_ID, LDA_CLIENT_SECRET

Docs: https://docs.legal-data-analytics.com/api-specification/qna
"""

from __future__ import annotations

import os

import httpx

TOKEN_URL = "https://online.otto-schmidt.de/token"
QNA_URL = "https://otto-schmidt.legal-data-hub.com/api/qna"
DATA_ASSET = "Beratermodul Datenschutzrecht"


def _get_token() -> str:
    client_id = os.getenv("LDA_CLIENT_ID", "")
    client_secret = os.getenv("LDA_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        raise RuntimeError("LDA_CLIENT_ID / LDA_CLIENT_SECRET not configured")

    r = httpx.post(
        TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
        },
        timeout=30,
    )
    r.raise_for_status()
    token = r.json().get("access_token")
    if not token:
        raise RuntimeError("LDA token endpoint returned no access_token")
    return token


def assess_breach(user_message: str) -> dict:
    """Ask the LDA QnA endpoint for a legal assessment of the incident."""
    prompt = (
        "You are a GDPR/NIS2/DORA compliance assistant. Assess the following "
        "personal-data incident and explain the obligations, deadlines and "
        "next steps under EU law. Cite the relevant articles.\n\n"
        f"Incident description: {user_message}"
    )

    token = _get_token()
    r = httpx.post(
        QNA_URL,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        json={
            "data_asset": DATA_ASSET,
            "filter": [{}],
            "mode": "attribution",
            "prompt": prompt,
        },
        timeout=120,
    )
    r.raise_for_status()
    data = r.json()
    return {
        "answer": data.get("answer", ""),
        "sources": data.get("sourcedocuments", []),
        "response_id": data.get("response_id"),
    }
