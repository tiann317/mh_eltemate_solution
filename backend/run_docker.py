"""
Build and run the Aegis Notice FastAPI backend in Docker locally.

Configuration is read from environment variables (with sensible defaults that
match `app/config.py`). Override any of them inline, e.g.:

    DB_PASS=secret CORS_ORIGINS="http://localhost:5173" python run_docker.py

By default this will:
  1. `docker buildx build` the image from ./Dockerfile.
  2. `docker run` it on host port 8000, wiring DATABASE_URL, CORS_ORIGINS,
     LOVABLE_API_KEY and LDA_* into the container.

On macOS/Windows, `host.docker.internal` lets the container reach a Postgres
running on the host. On Linux we fall back to `--add-host` for the same name.
"""

from __future__ import annotations

import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

IMAGE_NAME = os.getenv("IMAGE_NAME", "eltemate-api:latest")
CONTAINER_NAME = os.getenv("CONTAINER_NAME", "eltemate-api")
HOST_PORT = os.getenv("HOST_PORT", "8000")
CONTAINER_PORT = os.getenv("CONTAINER_PORT", "8000")

# DB config — mirrors backend/app/config.py defaults.
DB_USER = os.getenv("DB_USER", "tianna")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "Hackathon2026")
DB_PORT = os.getenv("DB_PORT", "5432")
# Inside the container, "localhost" is the container itself, so default to
# host.docker.internal which resolves to the host machine.
DB_HOST = os.getenv("DB_EXTERNAL_HOST", "host.docker.internal")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173")
LOVABLE_API_KEY = os.getenv("LOVABLE_API_KEY", "")
LOVABLE_AI_MODEL = os.getenv("LOVABLE_AI_MODEL", "openai/gpt-5")
LDA_CLIENT_ID = os.getenv("LDA_CLIENT_ID", "")
LDA_CLIENT_SECRET = os.getenv("LDA_CLIENT_SECRET", "")


def build_database_url() -> str:
    """Allow a fully-formed DATABASE_URL to win; otherwise compose one."""
    explicit = os.getenv("DATABASE_URL")
    if explicit:
        return explicit
    auth = DB_USER if not DB_PASS else f"{DB_USER}:{DB_PASS}"
    return f"postgresql+psycopg://{auth}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


def run(cmd: list[str]) -> None:
    print("$", " ".join(cmd), flush=True)
    result = subprocess.run(cmd)
    if result.returncode != 0:
        sys.exit(result.returncode)


def ensure_docker() -> None:
    if shutil.which("docker") is None:
        sys.exit("Error: docker not found in PATH.")


def stop_existing_container() -> None:
    # Best-effort; ignore failures.
    subprocess.run(
        ["docker", "rm", "-f", CONTAINER_NAME],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def main() -> None:
    ensure_docker()
    backend_dir = Path(__file__).resolve().parent

    # 1) Build with buildx (load into local docker image store).
    run(
        [
            "docker",
            "buildx",
            "build",
            "-t",
            IMAGE_NAME,
            "--load",
            str(backend_dir),
        ]
    )

    # 2) Run.
    stop_existing_container()
    database_url = build_database_url()

    cmd: list[str] = [
        "docker",
        "run",
        "--rm",
        "--name",
        CONTAINER_NAME,
        "-p",
        f"{HOST_PORT}:{CONTAINER_PORT}",
        "-e",
        f"DATABASE_URL={database_url}",
        "-e",
        f"CORS_ORIGINS={CORS_ORIGINS}",
        "-e",
        f"LOVABLE_AI_MODEL={LOVABLE_AI_MODEL}",
    ]

    if LOVABLE_API_KEY:
        cmd += ["-e", f"LOVABLE_API_KEY={LOVABLE_API_KEY}"]
    if LDA_CLIENT_ID:
        cmd += ["-e", f"LDA_CLIENT_ID={LDA_CLIENT_ID}"]
    if LDA_CLIENT_SECRET:
        cmd += ["-e", f"LDA_CLIENT_SECRET={LDA_CLIENT_SECRET}"]

    # On Linux, host.docker.internal isn't auto-mapped — add it explicitly
    # so the container can reach a Postgres running on the host.
    if platform.system() == "Linux" and DB_HOST == "host.docker.internal":
        cmd += ["--add-host", "host.docker.internal:host-gateway"]

    cmd.append(IMAGE_NAME)

    print(f"\n→ API will be available at http://localhost:{HOST_PORT}/docs\n")
    run(cmd)


if __name__ == "__main__":
    main()
