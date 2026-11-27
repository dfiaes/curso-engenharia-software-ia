"""Utilidades compartilhadas pelos hooks (pre-commit e CI). Só biblioteca padrão."""
from __future__ import annotations

import argparse
import subprocess
import sys
from typing import Sequence


def run_git(args: Sequence[str]) -> str:
    result = subprocess.run(["git", *args], capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise SystemExit(f"git {' '.join(args)} falhou: {result.stderr.strip()}")
    return result.stdout


def add_range_args(parser: argparse.ArgumentParser) -> None:
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--staged", action="store_true", help="usa o índice (pre-commit)")
    group.add_argument("--base", default=None, help="compara BASE...HEAD (CI)")


def diff_args(staged: bool, base: str | None) -> list[str]:
    if staged:
        return ["--cached"]
    return [f"{base or 'origin/main'}...HEAD"]


def changed_files(staged: bool, base: str | None) -> list[str]:
    out = run_git(["diff", "--name-only", *diff_args(staged, base)])
    return [line for line in out.splitlines() if line]


def name_status(staged: bool, base: str | None) -> list[str]:
    out = run_git(["diff", "--name-status", *diff_args(staged, base)])
    return [line for line in out.splitlines() if line]


def current_branch(env: dict[str, str]) -> str:
    # No CI de PR, o HEAD é detached: use as variáveis do provedor.
    for key in ("GITHUB_HEAD_REF", "SYSTEM_PULLREQUEST_SOURCEBRANCH", "BUILD_SOURCEBRANCHNAME"):
        value = env.get(key)
        if value:
            return value.removeprefix("refs/heads/")
    return run_git(["rev-parse", "--abbrev-ref", "HEAD"]).strip()


def fail(title: str, lines: Sequence[str]) -> int:
    print(f"ERRO: {title}", file=sys.stderr)
    for line in lines:
        print(f"  - {line}", file=sys.stderr)
    return 1
