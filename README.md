# Aegis Notice

AI-supported EU data breach response assistant for legal and compliance teams.
Built for the ELTEMATE Munich Hacking Legal 2026 hackathon.

This repository is a small monorepo:

```
.
├── backend/     # FastAPI (Python 3.14) + PostgreSQL
└── frontend/    # Vite + React 18 + Tailwind + shadcn/ui
```

## Prerequisites

- Node 20+ and bun (for the frontend)
- Python 3.14
- PostgreSQL running locally on `0.0.0.0:5432` with database `Hackathon2026`
  and user `tianna` (no password)

```bash
createdb -h localhost -U tianna Hackathon2026
```

## Backend (FastAPI)

```bash
cp backend/.env.example backend/.env
# Fill in OPENAI_API_KEY, LDA_CLIENT_ID, LDA_CLIENT_SECRET

python -m pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Tables are auto-created on startup. See [backend/README.md](backend/README.md).

## Frontend (Vite)

```bash
cp frontend/.env.example frontend/.env
# VITE_API_BASE_URL defaults to http://localhost:8000

cd frontend
bun install
bun run dev          # http://localhost:8080
```

## Environment variables

| Key                       | Where         | Source |
|---------------------------|---------------|--------|
| `OPENAI_API_KEY`          | `backend/.env`  | https://platform.openai.com |
| `LDA_CLIENT_ID`           | `backend/.env`  | LDA Legal Data Analytics GmbH |
| `LDA_CLIENT_SECRET`       | `backend/.env`  | LDA Legal Data Analytics GmbH |
| `DATABASE_URL`            | `backend/.env`  | local postgres |
| `VITE_API_BASE_URL`       | `frontend/.env` | URL of the FastAPI server (default `http://localhost:8000`) |

## Notes

- LDA legal guidance is sourced via the Legal Data Hub QnA API.
- AI risk assessment uses OpenAI `gpt-4o`.
- Aegis Notice provides structured guidance only — it does not constitute legal advice.
