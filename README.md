# Aegis Notice

AI-supported EU data breach response assistant for legal and compliance teams. Built for the ELTEMATE Munich Hacking Legal 2026 hackathon.

Aegis Notice helps organisations intake, assess, and manage suspected data breaches against EU regulatory obligations (GDPR, NIS2, DORA, CER) in the critical first hour.

## Setup

```bash
git clone <repo>
cd aegis-notice
npm install
cp .env.example .env
# Fill in VITE_LDA_CLIENT_ID, VITE_LDA_CLIENT_SECRET
npm run dev
```

## Environment variables

| Key | Source |
|---|---|
| `VITE_LDA_CLIENT_ID` | LDA Legal Data Analytics GmbH — legal-data-analytics.com |
| `VITE_LDA_CLIENT_SECRET` | LDA Legal Data Analytics GmbH — legal-data-analytics.com |

## Deployment — Google Cloud Run

```bash
gcloud config set project <YOUR_PROJECT_ID>
gcloud builds submit --config cloudbuild.yaml
```

The container is built from the included `Dockerfile`, pushed to GCR, and deployed to Cloud Run in `europe-west1` on port 8080.

## Notes

- All state is session-only — no backend database.
- LDA legal guidance is sourced from curated EU legal commentary via the Legal Data Hub QnA API.
- AI risk assessment uses the LDA Legal Data Hub `chat` endpoint — every assessment is grounded in the same curated EU legal sources.
- Aegis Notice provides structured guidance only — it does not constitute legal advice.
