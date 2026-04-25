from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import engine
from .models import Base
from .routers import ai, audit, incidents, notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup. Replace with Alembic migrations for prod.
    Base.metadata.create_all(bind=engine)
    yield


settings = get_settings()
app = FastAPI(title="Aegis Notice API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(ai.router)
app.include_router(incidents.router)
app.include_router(notifications.router)
app.include_router(audit.router)
