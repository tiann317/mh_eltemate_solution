from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------- AI ----------
class AssessRequest(BaseModel):
    user_message: str = Field(..., alias="userMessage", min_length=1)
    model_config = ConfigDict(populate_by_name=True)


class AssessResponse(BaseModel):
    answer: str
    sources: list[dict[str, Any]] = []
    response_id: str | None = None


# ---------- Incidents ----------
class IncidentBase(BaseModel):
    title: str
    summary: str | None = None
    risk_rating: str | None = None
    payload: dict[str, Any] | None = None
    assessment: dict[str, Any] | None = None


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    title: str | None = None
    summary: str | None = None
    risk_rating: str | None = None
    payload: dict[str, Any] | None = None
    assessment: dict[str, Any] | None = None


class IncidentOut(IncidentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ---------- Notifications ----------
class NotificationBase(BaseModel):
    framework: str
    authority: str | None = None
    recipient_email: EmailStr | None = None
    subject: str
    body: str


class NotificationCreate(NotificationBase):
    incident_id: UUID


class NotificationUpdate(BaseModel):
    subject: str | None = None
    body: str | None = None
    recipient_email: EmailStr | None = None


class NotificationMarkSent(BaseModel):
    delivery_method: str = Field(..., pattern="^(email|manual)$")
    sent_by: str = "operator"


class NotificationOut(NotificationBase):
    id: UUID
    incident_id: UUID
    status: str
    sent_at: datetime | None
    sent_by: str | None
    delivery_method: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ---------- Audit ----------
class AuditLogCreate(BaseModel):
    incident_id: UUID
    message: str


class AuditLogOut(BaseModel):
    id: UUID
    incident_id: UUID
    message: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
