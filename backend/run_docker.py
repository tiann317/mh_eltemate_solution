"""Build and run the Aegis Notice FastAPI backend in Docker locally.

Defaults assume Postgres on the host at 0.0.0.0:5432. Override via env vars
if needed:

    DB_USER=tianna DB_NAME=Hackathon2026 python run_docker.py
"""

from __future__ import annotations

import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

IMAGE = "aegis-api:latest"
CONTAINER = "aegis-api"
PORT = "8000"

DB_USER = os.getenv("DB_USER", "tianna")
DB_NAME = os.getenv("DB_NAME", "Hackathon2026")
DB_PORT = os.getenv("DB_PORT", "5432")
# Inside the container, talk to the host machine.
DB_HOST = "host.docker.internal"

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+psycopg://{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
)


def run(cmd: list[str]) -> None:
    print("$", " ".join(cmd), flush=True)
    if subprocess.run(cmd).returncode != 0:
        sys.exit(1)


def main() -> None:
    if shutil.which("docker") is None:
        sys.exit("Error: docker not found in PATH.")

    backend = Path(__file__).resolve().parent
    run(["docker", "buildx", "build", "-t", IMAGE, "--load", str(backend)])

    subprocess.run(
        ["docker", "rm", "-f", CONTAINER],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    cmd = [
        "docker", "run", "--rm", "--name", CONTAINER,
        "-p", f"{PORT}:8000",
        "-e", f"DATABASE_URL={DATABASE_URL}",
        "-e", f"CORS_ORIGINS={CORS_ORIGINS}",
    ]
    if platform.system() == "Linux":
        cmd += ["--add-host", "host.docker.internal:host-gateway"]
    cmd.append(IMAGE)

    print(f"\n→ http://localhost:{PORT}/docs\n")
    run(cmd)


if __name__ == "__main__":
    main()
