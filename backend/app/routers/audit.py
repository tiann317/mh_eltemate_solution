from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import AuditLog
from ..schemas import AuditLogCreate, AuditLogOut

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("", response_model=list[AuditLogOut])
def list_logs(incident_id: UUID, db: Session = Depends(get_db)) -> list[AuditLog]:
    stmt = (
        select(AuditLog)
        .where(AuditLog.incident_id == incident_id)
        .order_by(AuditLog.created_at.desc())
    )
    return list(db.scalars(stmt))


@router.post("", response_model=AuditLogOut, status_code=201)
def create_log(body: AuditLogCreate, db: Session = Depends(get_db)) -> AuditLog:
    log = AuditLog(**body.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
