#!/usr/bin/env python3
"""Procura padrões de segredo nas linhas ADICIONADAS do diff. Não substitui um scanner dedicado
(gitleaks, GitHub secret scanning); é a rede de segurança barata e local."""
from __future__ import annotations

import argparse
import re

from _common import add_range_args, diff_args, fail, run_git

PATTERNS: dict[str, re.Pattern[str]] = {
    "chave privada": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"),
    "AWS access key": re.compile(r"AKIA[0-9A-Z]{16}"),
    "token GitHub": re.compile(r"gh[pousr]_[A-Za-z0-9]{36,}"),
    "connection string com senha": re.compile(r"(?i)(?:password|pwd)\s*=\s*[^;\s'\"]{4,}"),
    "atribuição de segredo": re.compile(r"(?i)(?:secret|api[_-]?key|token)\s*[:=]\s*['\"][A-Za-z0-9+/_\-]{16,}['\"]"),
}
ALLOW_MARK = "pragma: allowlist secret"


def scan_added_lines(diff_text: str) -> list[str]:
    findings: list[str] = []
    current = "?"
    for line in diff_text.splitlines():
        if line.startswith("+++ b/"):
            current = line[6:]
            continue
        if not line.startswith("+") or line.startswith("+++"):
            continue
        if ALLOW_MARK in line:
            continue
        for name, pattern in PATTERNS.items():
            if pattern.search(line):
                findings.append(f"{current}: possível {name}")
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    add_range_args(parser)
    args = parser.parse_args()
    diff = run_git(["diff", "--unified=0", *diff_args(args.staged, args.base)])
    findings = scan_added_lines(diff)
    if findings:
        return fail("possíveis segredos no diff (se for falso positivo, marque a linha com '# pragma: allowlist secret')", findings)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
