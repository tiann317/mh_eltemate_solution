"""Generic CRUD layer used by the supabase-compatible /api/db router.

The frontend uses a thin wrapper that mimics the Supabase JS API
(`from(table).select(...).eq(col, val).insert(rows)...`). We translate
those calls into HTTP requests and execute them here.
"""
from __future__ import annotations

from typing import Any, Iterable
from uuid import UUID

from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from backend.database.models import MODEL_BY_TABLE


class UnknownTableError(Exception):
    pass


def _model(table: str):
    model = MODEL_BY_TABLE.get(table)
    if model is None:
        raise UnknownTableError(f"Unknown table: {table}")
    return model


def _row_to_dict(row: Any) -> dict:
    out: dict[str, Any] = {}
    for col in row.__table__.columns:
        val = getattr(row, col.name)
        if isinstance(val, UUID):
            val = str(val)
        elif hasattr(val, "isoformat"):
            val = val.isoformat()
        out[col.name] = val
    return out


def _coerce_value(model, column: str, value: Any) -> Any:
    """Best-effort: turn JSON booleans into the integer flag columns we use."""
    if value is None:
        return None
    if column == "available" and isinstance(value, bool):
        return 1 if value else 0
    return value


def select_rows(
    db: Session,
    table: str,
    *,
    filters: dict[str, Any] | None = None,
    order_by: str | None = None,
    ascending: bool = True,
    limit: int | None = None,
) -> list[dict]:
    model = _model(table)
    q = db.query(model)
    for col, val in (filters or {}).items():
        if not hasattr(model, col):
            continue
        q = q.filter(getattr(model, col) == _coerce_value(model, col, val))
    if order_by and hasattr(model, order_by):
        q = q.order_by(asc(getattr(model, order_by)) if ascending else desc(getattr(model, order_by)))
    if limit:
        q = q.limit(limit)
    return [_row_to_dict(r) for r in q.all()]


def insert_rows(db: Session, table: str, rows: Iterable[dict]) -> list[dict]:
    model = _model(table)
    created: list[Any] = []
    for raw in rows:
        clean = {k: _coerce_value(model, k, v) for k, v in raw.items() if hasattr(model, k)}
        instance = model(**clean)
        db.add(instance)
        created.append(instance)
    db.commit()
    for c in created:
        db.refresh(c)
    return [_row_to_dict(c) for c in created]


def update_rows(
    db: Session,
    table: str,
    *,
    filters: dict[str, Any],
    patch: dict[str, Any],
) -> list[dict]:
    model = _model(table)
    q = db.query(model)
    for col, val in filters.items():
        if hasattr(model, col):
            q = q.filter(getattr(model, col) == _coerce_value(model, col, val))
    rows = q.all()
    for row in rows:
        for k, v in patch.items():
            if hasattr(model, k):
                setattr(row, k, _coerce_value(model, k, v))
    db.commit()
    for r in rows:
        db.refresh(r)
    return [_row_to_dict(r) for r in rows]


def delete_rows(db: Session, table: str, *, filters: dict[str, Any]) -> int:
    model = _model(table)
    q = db.query(model)
    for col, val in filters.items():
        if hasattr(model, col):
            q = q.filter(getattr(model, col) == _coerce_value(model, col, val))
    count = q.count()
    q.delete(synchronize_session=False)
    db.commit()
    return count
