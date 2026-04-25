FROM n8nio/n8n:latest

USER root

ENV N8N_PORT=5678 \
    N8N_PROTOCOL=https \
    N8N_LISTEN_ADDRESS=0.0.0.0 \
    GENERIC_TIMEZONE=Europe/Vilnius \
    N8N_DIAGNOSTICS_ENABLED=false \
    N8N_HIRING_BANNER_ENABLED=false \
    N8N_RUNNERS_ENABLED=true \
    DB_TYPE=postgresdb

EXPOSE 5678

USER node

CMD ["n8n", "start"]
