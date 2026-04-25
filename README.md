# Aegis Notice

AI-supported EU data breach response assistant for legal and compliance teams. Built for the ELTEMATE Munich Hacking Legal 2026 hackathon.

Aegis Notice helps organisations intake, assess, and manage suspected data breaches against EU regulatory obligations (GDPR, NIS2, DORA, CER) in the critical first hour.

## Setup

```bash
git clone <repo>
cd aegis-notice
npm install
npm run dev
```

## Environment variables

| Key | Source |
|---|---|
| `LDA_CLIENT_ID` | LDA Legal Data Analytics GmbH — legal-data-analytics.com |
| `LDA_CLIENT_SECRET` | LDA Legal Data Analytics GmbH — legal-data-analytics.com |
| `VITE_SUPABASE_URL` | Lovable Cloud project settings |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Lovable Cloud project settings |

## Deployment — Google Cloud Run

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project <YOUR_PROJECT_ID>
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com containerregistry.googleapis.com
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_LDA_CLIENT_ID='<YOUR_LDA_CLIENT_ID>',_LDA_CLIENT_SECRET='<YOUR_LDA_CLIENT_SECRET>',_VITE_SUPABASE_URL='<YOUR_LOVABLE_CLOUD_URL>',_VITE_SUPABASE_PUBLISHABLE_KEY='<YOUR_LOVABLE_CLOUD_PUBLISHABLE_KEY>'
```

The container is built from the included `Dockerfile`, pushed to GCR, and deployed to Cloud Run in `europe-west1` on port 8080.

If `gcloud builds submit` still opens a browser page about Google Sign-In or returns `CloudBuild.GetBuild` with `CREDENTIALS_MISSING`, the local Google Cloud CLI is not using your login for the selected project. Run `gcloud auth list`, confirm the active account, then run `gcloud config set account <YOUR_EMAIL>` and retry.

## Notes

- All state is session-only — no backend database.
- LDA legal guidance is sourced from curated EU legal commentary via the Legal Data Hub QnA API.
- AI risk assessment uses the LDA Legal Data Hub `chat` endpoint — every assessment is grounded in the same curated EU legal sources.
- Aegis Notice provides structured guidance only — it does not constitute legal advice.
