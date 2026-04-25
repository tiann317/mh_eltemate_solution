from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import AuditLog, Notification
from ..schemas import (
    NotificationCreate,
    NotificationMarkSent,
    NotificationOut,
    NotificationUpdate,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    incident_id: UUID, db: Session = Depends(get_db)
) -> list[Notification]:
    stmt = (
        select(Notification)
        .where(Notification.incident_id == incident_id)
        .order_by(Notification.framework.asc())
    )
    return list(db.scalars(stmt))


@router.post("", response_model=NotificationOut, status_code=201)
def create_notification(
    body: NotificationCreate, db: Session = Depends(get_db)
) -> Notification:
    n = Notification(**body.model_dump())
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


@router.patch("/{notification_id}", response_model=NotificationOut)
def update_notification(
    notification_id: UUID, body: NotificationUpdate, db: Session = Depends(get_db)
) -> Notification:
    n = db.get(Notification, notification_id)
    if not n:
        raise HTTPException(404, "Notification not found")
    if n.status == "sent":
        raise HTTPException(409, "Notification already sent; cannot edit.")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(n, k, v)
    db.commit()
    db.refresh(n)
    return n


@router.post("/{notification_id}/mark-sent", response_model=NotificationOut)
def mark_sent(
    notification_id: UUID, body: NotificationMarkSent, db: Session = Depends(get_db)
) -> Notification:
    n = db.get(Notification, notification_id)
    if not n:
        raise HTTPException(404, "Notification not found")
    if body.delivery_method == "email" and not n.recipient_email:
        raise HTTPException(400, "Add a recipient email before sending.")

    now = datetime.now(timezone.utc)
    n.status = "sent"
    n.sent_at = now
    n.sent_by = body.sent_by
    n.delivery_method = body.delivery_method

    db.add(
        AuditLog(
            incident_id=n.incident_id,
            message=(
                f"[{now.isoformat()}] Notification {n.framework} marked as sent "
                f"({body.delivery_method}) to {n.recipient_email or n.authority or '—'}"
            ),
        )
    )
    db.commit()
    db.refresh(n)
    return n


@router.delete("/{notification_id}", status_code=204)
def delete_notification(notification_id: UUID, db: Session = Depends(get_db)) -> None:
    n = db.get(Notification, notification_id)
    if not n:
        raise HTTPException(404, "Notification not found")
    db.delete(n)
    db.commit()
