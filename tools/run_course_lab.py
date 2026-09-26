"""Run one lab's documented CI gates without accepting hidden skips."""

from __future__ import annotations

import argparse
import json
import re
import shlex
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MATRIX = ROOT / "docs/planejamento-v4/ambientes.json"
M03 = "M03-fastapi-postgres-docker-ci"


def run(command: list[str], cwd: Path, *, fail_on_skips: bool = False) -> None:
    print(f"$ {shlex.join(command)}\ncwd: {cwd.relative_to(ROOT)}", flush=True)
    try:
        result = subprocess.run(command, cwd=cwd, text=True, capture_output=True, check=False)
    except FileNotFoundError as exc:
        raise SystemExit(f"BLOCKED: required executable is unavailable: {command[0]}") from exc
    if result.stdout:
        print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
    if result.stderr:
        print(result.stderr, end="" if result.stderr.endswith("\n") else "\n", file=sys.stderr)
    if result.returncode:
        raise SystemExit(result.returncode)
    if fail_on_skips:
        output = f"{result.stdout}\n{result.stderr}"
        skipped = sum(int(n) for n in re.findall(r"\b(\d+) skipped\b", output))
        if skipped:
            raise SystemExit(f"BLOCKED: pytest reported {skipped} skipped tests")


def load_unit(unit_name: str) -> dict[str, object]:
    data = json.loads(MATRIX.read_text(encoding="utf-8"))
    for unit in data["units"]:
        if unit["unit"] == unit_name:
            return unit
    if re.fullmatch(r"ML0[1-7]", unit_name):
        candidates = sorted((ROOT / "modulos").glob(f"{unit_name}-*/lab"))
        if not candidates:
            raise SystemExit(
                f"BLOCKED: {unit_name} is optional and has no lab in the current checkout; "
                "no placeholder or skipped job is counted as success"
            )
        raise SystemExit(
            f"BLOCKED: {unit_name} lab exists but is absent from the reviewed environment matrix; "
            "add its lock and canonical commands through the normal review flow first"
        )
    raise SystemExit(f"Unknown course lab: {unit_name}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--unit", required=True, help="unit identifier from ambientes.json")
    parser.add_argument("--mode", choices=("offline", "integration"), default="offline")
    args = parser.parse_args()

    unit = load_unit(args.unit)
    cwd = (ROOT / str(unit["cwd"])).resolve()
    if ROOT not in cwd.parents or not cwd.is_dir():
        raise SystemExit(f"BLOCKED: invalid or missing lab cwd: {unit['cwd']}")
    for required in ("pyproject.toml", "uv.lock"):
        if not (cwd / required).is_file():
            raise SystemExit(f"BLOCKED: {unit['unit']} is missing {required}")

    if args.mode == "integration" and unit["unit"] != M03:
        raise SystemExit("BLOCKED: PostgreSQL integration mode is defined only for M03")
    if args.mode == "integration":
        run(["docker", "info", "--format", "{{.ServerVersion}}"], ROOT)

    try:
        revision = subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, capture_output=True, check=True
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        revision = "unavailable (checkout has no readable Git revision)"
    try:
        worktree = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=True,
        ).stdout
        worktree_state = "dirty" if worktree else "clean"
    except (OSError, subprocess.CalledProcessError):
        worktree_state = "unavailable"
    print(
        f"unit={unit['unit']} mode={args.mode} revision={revision} "
        f"worktree={worktree_state} python={sys.version.split()[0]}",
        flush=True,
    )
    run(["uv", "--version"], cwd)

    lock_check = shlex.split(str(unit["lock_check"]["command"]))
    run(lock_check, cwd)
    sync = shlex.split(str(unit["bootstrap"]["clean_environment_command"]))
    run(sync, cwd)

    commands = unit["commands"]
    names = ("lint", "format_check", "type_check")
    for name in names:
        run(shlex.split(str(commands[name])), cwd)

    if args.mode == "integration":
        test_command = ["uv", "run", "--locked", "--offline", "pytest", "-q", "-m", "postgres"]
        run(test_command, cwd, fail_on_skips=True)
    elif unit["unit"] == M03:
        test_command = [
            "uv", "run", "--locked", "--offline", "pytest", "-q", "-m", "not postgres"
        ]
        run(test_command, cwd, fail_on_skips=True)
    else:
        run(shlex.split(str(commands["tests"])), cwd, fail_on_skips=True)


if __name__ == "__main__":
    main()
