"""SQLAlchemy ORM models for the Aegis Notice tables."""
from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from backend.database.session import Base


def _uuid() -> str:
    return str(uuid4())


class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class StaffMember(Base, TimestampMixin):
    __tablename__ = "staff_members"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    role = Column(String, nullable=True)
    available = Column(Integer, default=1, nullable=False)  # 1=true, 0=false


class PreIntake(Base, TimestampMixin):
    __tablename__ = "pre_intakes"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    reporter_name = Column(String)
    reporter_title = Column(String)
    reporter_department = Column(String)
    reporter_role = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
    self_check_1 = Column(String)
    self_check_2 = Column(String)
    self_check_3 = Column(String)
    severity_classification = Column(String)
    responsible_staff_id = Column(UUID(as_uuid=False), nullable=True)
    literacy = Column(String)
    incident_id = Column(UUID(as_uuid=False), nullable=True)
    recount = Column(Text, nullable=True)


class Incident(Base, TimestampMixin):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    discovery_time = Column(String, nullable=True)
    incident_type = Column(String, nullable=True)
    sector = Column(String, nullable=True)
    jurisdiction = Column(String, nullable=True)
    num_affected = Column(String, nullable=True)
    risk_rating = Column(String, nullable=True)
    status = Column(String, default="open")
    form_data = Column(JSONB, nullable=True)
    fired_alerts = Column(JSONB, nullable=True)
    ai_assessment = Column(JSONB, nullable=True)
    lda_gdpr = Column(JSONB, nullable=True)
    lda_nis2 = Column(JSONB, nullable=True)
    lda_dora = Column(JSONB, nullable=True)
    severity_classification = Column(String, nullable=True)
    reporter_pre_intake_id = Column(UUID(as_uuid=False), nullable=True)
    tech_escalation_state = Column(String, nullable=True)
    legal_escalation_state = Column(String, nullable=True)
    outstanding_actions_count = Column(Integer, default=0)


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    incident_id = Column(UUID(as_uuid=False), nullable=True)
    pre_intake_id = Column(UUID(as_uuid=False), nullable=True)
    message = Column(Text, nullable=False)


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    incident_id = Column(UUID(as_uuid=False), nullable=False)
    framework = Column(String)
    authority = Column(String)
    subject = Column(String)
    body = Column(Text)
    status = Column(String, default="draft")


class IncidentRole(Base, TimestampMixin):
    __tablename__ = "incident_roles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    incident_id = Column(UUID(as_uuid=False), nullable=False)
    role = Column(String)
    staff_id = Column(UUID(as_uuid=False), nullable=True)
    staff_name = Column(String)
    staff_email = Column(String)
    assigned_at = Column(DateTime, default=datetime.utcnow)


class ActionCompletion(Base, TimestampMixin):
    __tablename__ = "action_completions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    incident_id = Column(UUID(as_uuid=False), nullable=False)
    action_key = Column(String, nullable=False)
    completed_by = Column(String)
    completed_at = Column(DateTime, default=datetime.utcnow)
    note = Column(Text)


class OversightRequest(Base, TimestampMixin):
    __tablename__ = "oversight_requests"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    incident_id = Column(UUID(as_uuid=False), nullable=False)
    action_key = Column(String, nullable=False)
    reviewer_role = Column(String)
    status = Column(String, default="pending")
    reason = Column(Text)
    resolved_at = Column(DateTime, nullable=True)


class SubIncident(Base, TimestampMixin):
    __tablename__ = "sub_incidents"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    incident_id = Column(UUID(as_uuid=False), nullable=False)
    title = Column(String)
    note = Column(Text)
    status = Column(String, default="open")
    risk_to = Column(String)
    payload = Column(JSONB, nullable=True)


# Convenience: registry mapping table names to models for the generic CRUD layer.
MODEL_BY_TABLE = {
    "staff_members": StaffMember,
    "pre_intakes": PreIntake,
    "incidents": Incident,
    "audit_logs": AuditLog,
    "notifications": Notification,
    "incident_roles": IncidentRole,
    "action_completions": ActionCompletion,
    "oversight_requests": OversightRequest,
    "sub_incidents": SubIncident,
}
