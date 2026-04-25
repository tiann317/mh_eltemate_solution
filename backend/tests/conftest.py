"""Pytest fixtures: in-memory SQLite app + TestClient."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import JSON, create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture()
def client():
    # Make Postgres JSONB compile on SQLite by aliasing it to JSON.
    # Must be done before importing models.
    from sqlalchemy.dialects.postgresql import base as pg_base
    pg_base.ischema_names["jsonb"] = JSON
    import sqlalchemy.dialects.postgresql as pg
    pg.JSONB = JSON  # type: ignore[assignment]

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
