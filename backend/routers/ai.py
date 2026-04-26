"""Calls OpenAI directly using the server-side OPENAI_API_KEY."""
from __future__ import annotations

import json
import re

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.config import settings

router = APIRouter(prefix="/api", tags=["ai"])

SYSTEM_PROMPT = """You are a GDPR and EU data protection law expert assistant helping legal and compliance teams respond to personal data breaches. You have deep knowledge of GDPR, NIS2 Directive (2022/2555), DORA (2022/2554), the CER Directive (2022/2557), and EDPB personal data breach notification guidelines (WP250 rev.01).

Your role is to:
1. Provide a structured risk assessment for the breach described
2. Draft an initial Art.33 GDPR supervisory authority notification letter
3. Draft a short internal escalation alert for senior leadership (CISO / CEO)
4. For EVERY recommended technical action, attach the specific statutory legal basis that justifies and/or compels that action.
5. Build a structured lawyer handoff packet for outside counsel.
6. Provide a SECURITY PLAYBOOK: concrete defensive / containment measures, each anchored to a legal basis.

Return ONLY valid JSON:
{
  "risk_assessment": "3-4 sentences",
  "risk_rating": "low | medium | high | critical",
  "key_gaps": ["..."],
  "notification_draft": "Full Art.33 notification letter text",
  "internal_alert": "5-6 line internal escalation alert",
  "lawyer_handoff": "6-8 line handoff summary",
  "recommended_actions": [{"action":"...","legal_basis":"GDPR Art.32(1)(b)","rationale":"..."}],
  "security_playbook": [{"measure":"...","legal_basis":"...","priority":"P0|P1|P2","rationale":"..."}],
  "lawyer_packet": {
    "incident_summary": "...",
    "frameworks_triggered": ["GDPR"],
    "active_deadlines": [{"framework":"GDPR Art.33","deadline":"72h","status":"running"}],
    "decisions_needed": ["..."],
    "privilege_note": "...",
    "open_questions": ["..."]
  }
}"""


class AssessBody(BaseModel):
    userMessage: str


@router.post("/assess-breach")
async def assess_breach(body: AssessBody):
    if not settings.openai_api_key:
        raise HTTPException(500, "OPENAI_API_KEY not configured on the backend.")

    payload = {
        "model": "gpt-4o",
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": body.userMessage},
        ],
    }
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
                headers=headers,
            )
    except httpx.HTTPError as e:
        raise HTTPException(504, f"OpenAI request failed: {e}")

    if r.status_code != 200:
        raise HTTPException(502, f"OpenAI error {r.status_code}: {r.text[:300]}")

    data = r.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", content)
        if not m:
            raise HTTPException(502, "OpenAI returned non-JSON content.")
        parsed = json.loads(m.group(0))

    return {"assessment": parsed, "provider": "openai", "model": "gpt-4o"}
