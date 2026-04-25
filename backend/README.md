# Aegis Notice — FastAPI backend

Fully local Python 3.14 + FastAPI backend. No external API calls.

## Run locally

```bash
cd backend
python3.14 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Postgres is expected at `postgresql+psycopg://tianna@0.0.0.0:5432/Hackathon2026`
(override via `DATABASE_URL` in `.env`). Open http://localhost:8000/docs.

## Run with Docker

```bash
cd backend
python run_docker.py
```

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET    | /health | liveness |
| POST   | /ai/assess-breach | `{ userMessage }` → local breach assessment |
| GET    | /incidents | list |
| POST   | /incidents | create |
| GET    | /incidents/{id} | detail |
| PATCH  | /incidents/{id} | update |
| DELETE | /incidents/{id} | delete |
| GET    | /notifications?incident_id=... | list |
| POST   | /notifications | create |
| PATCH  | /notifications/{id} | edit draft |
| POST   | /notifications/{id}/mark-sent | `{ delivery_method }` |
| DELETE | /notifications/{id} | delete |
| GET    | /audit-logs?incident_id=... | list |
| POST   | /audit-logs | create |

DB tables are auto-created on startup via SQLAlchemy `create_all`.
