"""Escalation: assigns staff member, records audit log, returns email status.

Email sending is intentionally a no-op stub for the local dev setup — it
returns "skipped" so the UI shows a clean confirmation without needing SMTP.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.models import AuditLog, IncidentRole, StaffMember
from backend.database.session import get_db

router = APIRouter(prefix="/api", tags=["escalation"])


class EscalateBody(BaseModel):
    source: str
    pre_intake_id: Optional[str] = None
    incident_id: Optional[str] = None
    staff_id: str
    reason: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None


@router.post("/escalate-incident")
def escalate_incident(body: EscalateBody, db: Session = Depends(get_db)):
    staff = db.query(StaffMember).filter(StaffMember.id == body.staff_id).first()
    if not staff:
        raise HTTPException(404, "Staff member not found")

    if body.incident_id:
        db.add(IncidentRole(
            incident_id=body.incident_id,
            role="responsible",
            staff_id=staff.id,
            staff_name=staff.name,
            staff_email=staff.email,
        ))
        db.add(AuditLog(
            incident_id=body.incident_id,
            message=f"Escalated to {staff.name}{(' — ' + body.reason) if body.reason else ''}",
        ))
    elif body.pre_intake_id:
        db.add(AuditLog(
            pre_intake_id=body.pre_intake_id,
            message=f"Pre-intake escalated to {staff.name}{(' — ' + body.reason) if body.reason else ''}",
        ))

    db.commit()
    return {"ok": True, "staff_name": staff.name, "email_status": "skipped"}
