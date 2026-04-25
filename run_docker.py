"""Build and run the Aegis Notice frontend in Docker locally."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

IMAGE = "aegis-frontend:latest"
CONTAINER = "aegis-frontend"
PORT = "8080"


def run(cmd: list[str]) -> None:
    print("$", " ".join(cmd), flush=True)
    if subprocess.run(cmd).returncode != 0:
        sys.exit(1)


def main() -> None:
    if shutil.which("docker") is None:
        sys.exit("Error: docker not found in PATH.")

    here = Path(__file__).resolve().parent
    run(["docker", "buildx", "build", "-t", IMAGE, "--load", str(here)])

    subprocess.run(
        ["docker", "rm", "-f", CONTAINER],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    print(f"\n→ http://localhost:{PORT}\n")
    run([
        "docker", "run", "--rm", "--name", CONTAINER,
        "-p", f"{PORT}:8080", IMAGE,
    ])


if __name__ == "__main__":
    main()
