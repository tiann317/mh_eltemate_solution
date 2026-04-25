from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Postgres
    database_url: str = "postgresql+psycopg://tianna:postgres@localhost:5432/Hackathon2026"

    # CORS
    cors_origins: str = "http://localhost:5173"

    # Lovable AI Gateway
    lovable_api_key: str | None = None
    lovable_ai_model: str = "openai/gpt-5"
    lovable_ai_url: str = "https://ai.gateway.lovable.dev/v1/chat/completions"

    # LDA Legal Data Hub (optional)
    lda_client_id: str | None = None
    lda_client_secret: str | None = None
    lda_token_url: str = "https://online.otto-schmidt.de/token"
    lda_qna_url: str = "https://otto-schmidt.legal-data-hub.com/api/qna"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
