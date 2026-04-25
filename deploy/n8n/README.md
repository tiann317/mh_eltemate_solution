# n8n Orchestrator on Cloud Run

Automates Lovable preview deploys → smoke tests → E2E suite → result reporting.

## What this is (and isn't)

n8n is a workflow engine. It can:
- Receive a webhook when Lovable publishes a build
- Run smoke tests against the preview URL
- Trigger an external test runner (GitHub Actions, Playwright Cloud, etc.)
- Post results back to Slack / GitHub / Lovable

n8n **cannot** finish the React component refactor for you — that work
(Screen1–4 → Tailwind sub-components) still needs to happen in Lovable. n8n
will, however, verify each new deploy passes tests before you promote it.

## One-time setup

1. **Cloud SQL (Postgres)** — n8n needs a persistent DB; Cloud Run is stateless.
   ```bash
   gcloud sql instances create n8n-db --database-version=POSTGRES_15 \
     --tier=db-f1-micro --region=europe-west1
   gcloud sql databases create n8n --instance=n8n-db
   gcloud sql users create n8n --instance=n8n-db --password='<DB_PASSWORD>'
   ```

2. **Generate an encryption key** (32 hex chars) — required, never change after first boot:
   ```bash
   openssl rand -hex 16
   ```

3. **Enable APIs**:
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
     sqladmin.googleapis.com containerregistry.googleapis.com
   ```

## Deploy

```bash
gcloud builds submit --config deploy/n8n/cloudbuild.yaml \
  --substitutions=\
_N8N_HOST='n8n-orchestrator-XXXX.a.run.app',\
_WEBHOOK_URL='https://n8n-orchestrator-XXXX.a.run.app/',\
_DB_HOST='/cloudsql/PROJECT:europe-west1:n8n-db',\
_DB_PASSWORD='<DB_PASSWORD>',\
_ENCRYPTION_KEY='<32-hex-key>',\
_BASIC_AUTH_PASSWORD='<choose-strong>',\
_LOVABLE_WEBHOOK_SECRET='<shared-secret>',\
_LDA_CLIENT_ID='<lda-id>',\
_LDA_CLIENT_SECRET='<lda-secret>'
```

After the first deploy, attach the Cloud SQL instance:
```bash
gcloud run services update n8n-orchestrator --region=europe-west1 \
  --add-cloudsql-instances=PROJECT:europe-west1:n8n-db
```

## Wire Lovable → n8n

1. Open n8n at the Cloud Run URL (basic auth user/password from substitutions).
2. Import `workflows/lovable-deploy-test.json`.
3. Activate the workflow — it exposes `POST /webhook/lovable-deploy`.
4. From your CI / Lovable post-publish hook, send:
   ```
   POST https://<n8n-host>/webhook/lovable-deploy
   X-Lovable-Signature: <hmac-sha256(body, LOVABLE_WEBHOOK_SECRET)>
   { "previewUrl": "https://...lovable.app", "repo": "owner/repo", "sha": "..." }
   ```

## Workflow flow

```
Lovable publish
    │
    ▼
[Webhook] → [Verify HMAC] → [Smoke /healthz] → [Trigger GH Actions E2E]
                                                        │
                                            [Wait 60s] ─┘
                                                        │
                                               [Fetch run conclusion]
                                                        │
                                            [Respond + Slack/email]
```

## Security notes

- Basic auth is enabled on the n8n UI — pick a strong password.
- Webhooks are HMAC-verified via `LOVABLE_WEBHOOK_SECRET`.
- Use Secret Manager for `_DB_PASSWORD`, `_ENCRYPTION_KEY`, `_BASIC_AUTH_PASSWORD`
  in production instead of inline substitutions.
- Set `--no-allow-unauthenticated` and front with IAP if you want zero public exposure.
