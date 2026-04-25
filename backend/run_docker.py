#!/usr/bin/env python3
"""Run the eltemate-api Docker container with env-driven configuration.

Usage:
    python run_docker.py

Override defaults with environment variables, e.g.:
    DB_USER=alice DB_PASS=secret DB_HOST=db.example.com python run_docker.py
"""
import os
import subprocess
import sys


def main() -> int:
    db_user = os.getenv("DB_USER", "tianna")
    db_pass = os.getenv("DB_PASS", "postgres")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "Hackathon2026")

    database_url = os.getenv(
        "DATABASE_URL",
        f"postgresql+psycopg://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}",
    )
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    image = os.getenv("IMAGE", "eltemate-api:latest")
    host_port = os.getenv("HOST_PORT", "8000")
    container_port = os.getenv("CONTAINER_PORT", "8000")

    cmd = [
        "docker", "run", "--rm",
        "-p", f"{host_port}:{container_port}",
        "-e", f"DATABASE_URL={database_url}",
        "-e", f"CORS_ORIGINS={cors_origins}",
        image,
    ]

    print("Running:", " ".join(cmd), flush=True)
    try:
        return subprocess.call(cmd)
    except FileNotFoundError:
        print("Error: docker is not installed or not in PATH.", file=sys.stderr)
        return 127
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
