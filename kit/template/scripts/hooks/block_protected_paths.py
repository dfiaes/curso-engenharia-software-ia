#!/usr/bin/env python3
"""Falha se o diff tocar caminhos protegidos (pipelines de deploy, infra, segredos).

Humanos liberam conscientemente com ALLOW_PROTECTED=1 (e o CODEOWNERS exige revisão).
Padrões extras: arquivo .protected-paths na raiz (um glob por linha).
"""
from __future__ import annotations

import argparse
import fnmatch
import os
from pathlib import Path

from _common import add_range_args, changed_files, fail

DEFAULT_PATTERNS = [
    ".github/workflows/deploy.yml",
    "azure-pipelines.yml",
    "infra/*",
    ".env",
    ".env.*",
    ".github/CODEOWNERS",
    "*.pem",
    "*.pfx",
]


def load_patterns(root: Path) -> list[str]:
    patterns = list(DEFAULT_PATTERNS)
    extra = root / ".protected-paths"
    if extra.is_file():
        for line in extra.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                patterns.append(line)
    return patterns


def find_violations(files: list[str], patterns: list[str]) -> list[str]:
    return [f for f in files if any(fnmatch.fnmatch(f, p) for p in patterns)]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    add_range_args(parser)
    args = parser.parse_args()
    if os.environ.get("ALLOW_PROTECTED") == "1":
        print("aviso: ALLOW_PROTECTED=1, checagem de caminhos protegidos ignorada")
        return 0
    bad = find_violations(changed_files(args.staged, args.base), load_patterns(Path(".")))
    if bad:
        return fail("caminhos protegidos alterados (peça a um humano ou use ALLOW_PROTECTED=1)", bad)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
