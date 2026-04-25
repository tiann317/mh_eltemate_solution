"""Pytest fixtures: in-memory SQLite app + TestClient."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import db as db_module
from app.db import get_db
from app.main import app
from app.models import Base


@pytest.fixture()
def client():
    # Fresh in-memory SQLite per test. We swap PG JSONB for generic JSON
    # so the same models work on SQLite.
    from sqlalchemy.dialects.postgresql import JSONB
    from sqlalchemy import JSON
    JSONB.__visit_name__ = JSON.__visit_name__  # type: ignore[attr-defined]

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    # SQLite has no UUID type; SQLAlchemy will fall back to CHAR(32).
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        s = TestingSession()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = override_get_db
    db_module.engine = engine  # so lifespan create_all is harmless
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
