# Aegis Notice — FastAPI backend

Python 3.14.3 + FastAPI 0.136 backend that mirrors the Supabase edge functions
(`assess-breach`, `query-lda`) and adds incident / notification / audit-log CRUD
against a Postgres database.

## Run locally

```bash
cd backend
python3.14 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, LOVABLE_API_KEY, LDA_*
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for the OpenAPI UI.

## Run with Docker

```bash
cd backend
docker buildx build -t eltemate-api:latest --load .

docker run --rm -p 8000:8000 \
  -e DATABASE_URL="postgresql+psycopg://tianna:PASS@HOST:5432/Hackathon2026" \
  -e CORS_ORIGINS="http://localhost:5173" \
  -e LOVABLE_API_KEY="..." \
  eltemate-api:latest
```

(Or use `python run_docker.py` from the helper script.)

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET    | /health | liveness |
| POST   | /ai/assess-breach | `{ userMessage }` → AI assessment JSON |
| POST   | /ai/query-lda | `{ prompt }` → LDA QnA result |
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

## Notes

- DB tables are auto-created on startup via SQLAlchemy `create_all`.
  For production, switch to Alembic migrations.
- `psycopg` v3 is used; the URL scheme must be `postgresql+psycopg://...`.
- LDA is optional: if `LDA_CLIENT_ID/SECRET` are missing, `/ai/query-lda`
  responds with a `skipped` field instead of erroring.
