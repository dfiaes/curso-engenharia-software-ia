"""Run a module lab's pytest, ruff and mypy in a venv outside the repository."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GATES = (
    ("pytest", ["uv", "run", "pytest", "-q"]),
    ("ruff", ["uv", "run", "ruff", "check", "."]),
    ("mypy", ["uv", "run", "mypy", "--strict", "src"]),
)


def find_labs(code: str | None) -> list[Path]:
    labs = sorted(ROOT.glob("modulos/*/lab/pyproject.toml"))
    if code is None:
        return [p.parent for p in labs]
    return [p.parent for p in labs if p.parent.parent.name.split("-", 1)[0] == code]


def run_lab(lab: Path) -> dict[str, bool]:
    code = lab.parent.name.split("-", 1)[0]
    env = {**os.environ, "UV_PROJECT_ENVIRONMENT": str(Path.home() / ".venvs" / code)}
    print(f"== {code} ({lab.relative_to(ROOT)})", flush=True)
    sync = subprocess.run(["uv", "sync"], cwd=lab, env=env, text=True, capture_output=True)
    if sync.returncode:
        print(sync.stdout + sync.stderr)
        return {"sync": False}
    results = {}
    for name, cmd in GATES:
        r = subprocess.run(cmd, cwd=lab, env=env, text=True, capture_output=True)
        results[name] = r.returncode == 0
        if r.returncode:
            print(f"-- {name} failed\n{r.stdout}{r.stderr}")
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("code", nargs="?", help="module code, e.g. F01")
    parser.add_argument("--all", action="store_true", help="run every lab")
    args = parser.parse_args()
    if not args.code and not args.all:
        parser.error("give a module code or --all")
    labs = find_labs(None if args.all else args.code)
    if not labs:
        raise SystemExit(f"no lab found for {args.code}")
    summary = {lab.parent.name: run_lab(lab) for lab in labs}
    print("\nSummary")
    failed = False
    for name, res in summary.items():
        line = " ".join(f"{k}={'ok' if v else 'FAIL'}" for k, v in res.items())
        print(f"{name}: {line}")
        failed |= not all(res.values())
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
