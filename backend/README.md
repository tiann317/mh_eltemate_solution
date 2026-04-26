# Aegis Notice — Backend (FastAPI)

Local FastAPI server backing the Aegis Notice frontend. Connects to a local
PostgreSQL database (`Hackathon2026`) and proxies AI / LDA calls so the API
keys never leave the server.

## Structure

```
backend/
├── config.py             # pydantic-settings (.env loader)
├── main.py               # FastAPI app + startup table creation
├── database/
│   ├── session.py        # SQLAlchemy engine + Session factory
│   ├── models.py         # ORM models (incidents, audit_logs, ...)
│   └── crud/
│       └── generic.py    # Generic select/insert/update/delete used by /api/db
├── routers/
│   ├── db.py             # /api/db/{table}/{select|insert|update|delete}
│   ├── ai.py             # /api/assess-breach (OpenAI gpt-4o)
│   ├── lda.py            # /api/query-lda (LDA Legal Data Hub)
│   └── escalation.py     # /api/escalate-incident
└── tests/
    └── test_health.py
```

## Setup

```bash
# 1. Create the database (one-time)
createdb -h localhost -U tianna Hackathon2026

# 2. Configure environment
cp backend/.env.example backend/.env
# edit backend/.env and fill OPENAI_API_KEY, LDA_CLIENT_ID, LDA_CLIENT_SECRET

# 3. Install dependencies
python -m pip install -r backend/requirements.txt

# 4. Run
uvicorn backend.main:app --reload --port 8000
```

Tables are auto-created on startup via `Base.metadata.create_all`.

## Tests

```bash
python -m pytest backend/tests
```
