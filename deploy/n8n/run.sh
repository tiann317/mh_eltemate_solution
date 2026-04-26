#!/usr/bin/env bash
# Run n8n locally with Docker Compose v2 (`docker compose`, no `-f` quirk).
# Usage: ./run.sh [up|down|logs|reset|import]

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${HERE}"

writeEnvIfMissing() {
  if [[ -f .env ]]; then return; fi
  cat > .env <<EOF
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=$(openssl rand -hex 12)
N8N_ENCRYPTION_KEY=$(openssl rand -hex 16)
LOVABLE_WEBHOOK_SECRET=$(openssl rand -hex 24)
GENERIC_TIMEZONE=Europe/Vilnius
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/
GITHUB_TOKEN=
EOF
  echo "Created .env with random credentials."
}

writeComposeIfMissing() {
  if [[ -f docker-compose.yml ]]; then return; fi
  cat > docker-compose.yml <<'YAML'
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
}

action="${1:-up}"
writeEnvIfMissing
writeComposeIfMissing

case "${action}" in
  up)
    docker compose up -d
    user=$(grep N8N_BASIC_AUTH_USER .env | cut -d= -f2)
    pass=$(grep N8N_BASIC_AUTH_PASSWORD .env | cut -d= -f2)
    echo
    echo "n8n running at http://localhost:5678"
    echo "Login:    ${user}"
    echo "Password: ${pass}"
    echo "Webhook:  http://localhost:5678/webhook/lovable-deploy"
    ;;
  down)
    docker compose down
    ;;
  logs)
    docker compose logs -f n8n
    ;;
  reset)
    docker compose down -v
    echo "Wiped n8n_data volume."
    ;;
  import)
    docker compose exec n8n n8n import:workflow --separate --input=/workflows
    ;;
  *)
    echo "Usage: $0 [up|down|logs|reset|import]"
    exit 1
    ;;
esac
