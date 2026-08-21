"""Gate offline único do primeiro vertical slice M02A."""

from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
import zipfile
from collections.abc import Sequence
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _run(label: str, command: Sequence[str]) -> int:
    print(f"\n== {label} ==", flush=True)
    completed = subprocess.run(command, cwd=ROOT, check=False)
    if completed.returncode != 0:
        print(f"gate interrompido: {label} retornou {completed.returncode}", flush=True)
    return completed.returncode


def _build_and_verify() -> int:
    with tempfile.TemporaryDirectory(prefix="m02a-wheel-") as directory:
        destination = Path(directory)
        code = _run(
            "wheel",
            [
                sys.executable,
                "-m",
                "build",
                "--wheel",
                "--no-isolation",
                "--outdir",
                str(destination),
            ],
        )
        if code != 0:
            return code
        wheels = tuple(destination.glob("*.whl"))
        if len(wheels) != 1:
            print("gate interrompido: build não gerou exatamente um wheel", flush=True)
            return 1
        with zipfile.ZipFile(wheels[0]) as wheel:
            names = set(wheel.namelist())
            required_suffixes = (
                "work_intake/cli.py",
                "work_intake/py.typed",
                "work_intake/adapters/sqlite/001_initial.sql",
                ".dist-info/entry_points.txt",
            )
            missing = [
                suffix
                for suffix in required_suffixes
                if not any(name.endswith(suffix) for name in names)
            ]
        if missing:
            print(f"gate interrompido: wheel sem {missing}", flush=True)
            return 1
        print("wheel contém CLI, typing marker, migração e entry point", flush=True)
        return 0


def run_all() -> int:
    commands: tuple[tuple[str, Sequence[str]], ...] = (
        ("format", (sys.executable, "-m", "ruff", "format", "--check", ".")),
        ("lint", (sys.executable, "-m", "ruff", "check", ".")),
        (
            "types",
            (sys.executable, "-m", "mypy", "--strict", "python/src", "python/tests", "tools"),
        ),
        ("tests", (sys.executable, "-m", "pytest", "-q")),
    )
    for label, command in commands:
        code = _run(label, command)
        if code != 0:
            return code
    return _build_and_verify()


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("gate", choices=("all",))
    args = parser.parse_args(argv)
    if args.gate == "all":
        return run_all()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
