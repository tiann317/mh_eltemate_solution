"""Pytest fixtures: in-memory SQLite app + TestClient."""

from __future__ import annotations

import os

# Point the app at SQLite BEFORE it's imported anywhere.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Make Postgres-specific types compile on SQLite for tests.
@compiles(JSONB, "sqlite")
def _jsonb_sqlite(type_, compiler, **kw):  # noqa: ANN001
    return "JSON"


@compiles(PG_UUID, "sqlite")
def _uuid_sqlite(type_, compiler, **kw):  # noqa: ANN001
    return "CHAR(36)"


@pytest.fixture()
def client():
    from app import db as db_module
    from app.db import get_db
    from app.main import app
    from app.models import Base

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        s = TestingSession()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = override_get_db
    db_module.engine = engine
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
