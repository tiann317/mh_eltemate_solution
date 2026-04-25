# Eltemate Solution — FastAPI Backend

FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL. Standard CRUD starter (no auth yet).

## Stack
- **FastAPI** 0.115 (Python 3.12)
- **SQLAlchemy 2.0** (sync, typed `Mapped[...]`)
- **Alembic** for migrations
- **PostgreSQL 16** via `psycopg` v3
- **Pydantic v2** for schemas

## Project layout
```
app/
  api/routes/        # HTTP endpoints
  core/config.py     # Settings (env-driven)
  crud/              # DB operations
  db/                # Engine + session + Base
  models/            # SQLAlchemy ORM models
  schemas/           # Pydantic request/response models
  main.py            # FastAPI app + CORS
alembic/             # Migrations
```

## Run with Docker (recommended)
```bash
cp .env.example .env
docker compose up --build
```
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

The `api` service runs `alembic upgrade head` on startup.

## Run locally
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # edit DATABASE_URL
alembic upgrade head
uvicorn app.main:app --reload
```

## Migrations
```bash
# Create new revision after editing models
alembic revision --autogenerate -m "add new field"
alembic upgrade head
alembic downgrade -1
```

## Endpoints
Base: `/api/v1`

| Method | Path             | Description     |
|--------|------------------|-----------------|
| GET    | /items           | List items      |
| POST   | /items           | Create item     |
| GET    | /items/{id}      | Get item        |
| PATCH  | /items/{id}      | Update item     |
| DELETE | /items/{id}      | Delete item     |
| GET    | /health          | Health check    |

## Adding a new resource
1. Model in `app/models/<thing>.py` (import in `alembic/env.py`)
2. Schemas in `app/schemas/<thing>.py`
3. CRUD in `app/crud/<thing>.py`
4. Router in `app/api/routes/<thing>.py` and register in `app/api/router.py`
5. `alembic revision --autogenerate -m "add <thing>"` then `alembic upgrade head`

## Adding auth later
Drop in `fastapi-users` or roll your own JWT with `python-jose` + `passlib[bcrypt]`. Add a `User` model, an `auth` router, and a `get_current_user` dependency.

## Connecting from React
Set in your frontend `.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```
And ensure your frontend dev origin is listed in `CORS_ORIGINS`.

## Deploy
- **Render / Railway / Fly.io**: deploy the Dockerfile, set `DATABASE_URL` + `CORS_ORIGINS` env vars, attach a managed Postgres.
- Run `alembic upgrade head` as a release/predeploy step.
