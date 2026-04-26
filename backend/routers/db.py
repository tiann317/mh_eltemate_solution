"""Generic database router — supabase-shim endpoints.

The frontend posts a structured query to /api/db/{table}; we run it through the
generic CRUD layer. This avoids needing a bespoke endpoint per table while
keeping the API explicit (no SQL injection — column names are validated).
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.crud.generic import (
    UnknownTableError,
    delete_rows,
    insert_rows,
    select_rows,
    update_rows,
)
from backend.database.session import get_db

router = APIRouter(prefix="/api/db", tags=["db"])


class SelectBody(BaseModel):
    filters: dict[str, Any] = {}
    order_by: str | None = None
    ascending: bool = True
    limit: int | None = None


class InsertBody(BaseModel):
    rows: list[dict[str, Any]]


class UpdateBody(BaseModel):
    filters: dict[str, Any]
    patch: dict[str, Any]


class DeleteBody(BaseModel):
    filters: dict[str, Any]


@router.post("/{table}/select")
def select_(table: str, body: SelectBody, db: Session = Depends(get_db)):
    try:
        return {"data": select_rows(
            db, table,
            filters=body.filters,
            order_by=body.order_by,
            ascending=body.ascending,
            limit=body.limit,
        )}
    except UnknownTableError as e:
        raise HTTPException(404, str(e))


@router.post("/{table}/insert")
def insert_(table: str, body: InsertBody, db: Session = Depends(get_db)):
    try:
        return {"data": insert_rows(db, table, body.rows)}
    except UnknownTableError as e:
        raise HTTPException(404, str(e))


@router.post("/{table}/update")
def update_(table: str, body: UpdateBody, db: Session = Depends(get_db)):
    try:
        return {"data": update_rows(db, table, filters=body.filters, patch=body.patch)}
    except UnknownTableError as e:
        raise HTTPException(404, str(e))


@router.post("/{table}/delete")
def delete_(table: str, body: DeleteBody, db: Session = Depends(get_db)):
    try:
        return {"deleted": delete_rows(db, table, filters=body.filters)}
    except UnknownTableError as e:
        raise HTTPException(404, str(e))
