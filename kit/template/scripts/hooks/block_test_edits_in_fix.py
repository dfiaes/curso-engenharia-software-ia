#!/usr/bin/env python3
"""Em branch fix/*, testes existentes não podem ser modificados, renomeados ou apagados.

Só é permitido ADICIONAR testes (o teste que reproduz o bug). Se um teste antigo estava
errado, isso é decisão de humano: use ALLOW_TEST_EDIT=1 e explique no PR.
"""
from __future__ import annotations

import argparse
import fnmatch
import os

from _common import add_range_args, current_branch, fail, name_status

TEST_PATTERNS = ["tests/*", "test/*", "*/tests/*", "*Tests/*", "*.Tests/*", "*_test.*", "test_*.py", "*Tests.cs", "*.spec.*", "*.test.*"]


def is_test(path: str) -> bool:
    return any(fnmatch.fnmatch(path, p) for p in TEST_PATTERNS)


def find_violations(branch: str, status_lines: list[str]) -> list[str]:
    if not branch.startswith("fix/"):
        return []
    bad: list[str] = []
    for line in status_lines:
        parts = line.split("\t")
        code = parts[0][:1]
        if code == "A":
            continue
        paths = parts[1:]
        if any(is_test(p) for p in paths):
            bad.append(f"{code} {' -> '.join(paths)}")
    return bad


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    add_range_args(parser)
    args = parser.parse_args()
    if os.environ.get("ALLOW_TEST_EDIT") == "1":
        return 0
    branch = current_branch(dict(os.environ))
    bad = find_violations(branch, name_status(args.staged, args.base))
    if bad:
        return fail(f"branch {branch}: testes existentes alterados (em fix/ só se adiciona teste)", bad)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
