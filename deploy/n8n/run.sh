#!/usr/bin/env bash
# Run n8n locally for development.
# Usage: ./deploy/n8n/run.sh [up|down|logs|reset|import]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
ENV_FILE="${SCRIPT_DIR}/.env"

ensure_env() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    echo "Creating ${ENV_FILE} with defaults — edit it before exposing publicly."
    cat > "${ENV_FILE}" <<EOF
# n8n local config — DO NOT commit
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=$(openssl rand -hex 12)
N8N_ENCRYPTION_KEY=$(openssl rand -hex 16)
LOVABLE_WEBHOOK_SECRET=$(openssl rand -hex 24)
GENERIC_TIMEZONE=Europe/Vilnius
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/
LDA_CLIENT_ID=
LDA_CLIENT_SECRET=
GITHUB_TOKEN=
EOF
    echo "Generated credentials written to ${ENV_FILE}"
  fi
}

ensure_compose() {
  if [[ ! -f "${COMPOSE_FILE}" ]]; then
    cat > "${COMPOSE_FILE}" <<'YAML'
services:
  n8n:
    image: n8nio/n8n:latest
    restart: unless-stopped
    ports:
      - "5678:5678"
    env_file:
      - .env
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_RUNNERS_ENABLED=true
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_HIRING_BANNER_ENABLED=false
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/workflows:ro

volumes:
  n8n_data:
YAML
  fi
}

cmd="${1:-up}"
ensure_env
ensure_compose

case "${cmd}" in
  up)
    docker compose -f "${COMPOSE_FILE}" up -d
    echo
    echo "n8n running at http://localhost:5678"
    echo "Login:    $(grep N8N_BASIC_AUTH_USER "${ENV_FILE}" | cut -d= -f2)"
    echo "Password: $(grep N8N_BASIC_AUTH_PASSWORD "${ENV_FILE}" | cut -d= -f2)"
    echo "Webhook:  http://localhost:5678/webhook/lovable-deploy"
    ;;
  down)
    docker compose -f "${COMPOSE_FILE}" down
    ;;
  logs)
    docker compose -f "${COMPOSE_FILE}" logs -f n8n
    ;;
  reset)
    docker compose -f "${COMPOSE_FILE}" down -v
    echo "Wiped n8n_data volume."
    ;;
  import)
    docker compose -f "${COMPOSE_FILE}" exec n8n \
      n8n import:workflow --separate --input=/workflows
    echo "Imported workflows from ./workflows"
    ;;
  *)
    echo "Usage: $0 [up|down|logs|reset|import]"
    exit 1
    ;;
esac
