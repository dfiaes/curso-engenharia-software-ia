#!/usr/bin/env python3
"""Checagens de documentação para o CI.

1. Modelos existem em docs/*/_modelo.md.
2. Specs/planos (exceto _modelo) têm front-matter com 'ticket:' e 'status:'.
3. Drift: se código mudou e nenhuma doc mudou, exige 'Docs: não se aplica (motivo)' no corpo do PR
   (variável de ambiente PR_BODY).
"""
from __future__ import annotations

import argparse
import os
import re
from pathlib import Path

from _common import add_range_args, changed_files, fail

CODE_PREFIXES = ("src/", "app/", "lib/")
DOC_PREFIXES = ("docs/", "README", "CHANGELOG", "AGENTS.md", "REVIEW.md")
OPT_OUT = re.compile(r"Docs:\s*não se aplica\s*\(.+\)", re.IGNORECASE)


def drift_violation(files: list[str], pr_body: str) -> bool:
    code = [f for f in files if f.startswith(CODE_PREFIXES)]
    docs = [f for f in files if f.startswith(DOC_PREFIXES)]
    return bool(code) and not docs and not OPT_OUT.search(pr_body)


def front_matter_errors(root: Path) -> list[str]:
    errors: list[str] = []
    for sub in ("specs", "plans"):
        for path in sorted((root / "docs" / sub).glob("*.md")):
            if path.name.startswith("_"):
                continue
            head = path.read_text(encoding="utf-8").split("---")
            meta = head[1] if len(head) > 2 and head[0].strip() == "" else ""
            for key in ("ticket:", "status:"):
                if key not in meta:
                    errors.append(f"{path}: front-matter sem '{key}'")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    add_range_args(parser)
    args = parser.parse_args()
    root = Path(".")
    problems = [f"modelo ausente: docs/{d}/_modelo.md" for d in ("intent", "specs", "plans", "adr", "runbooks") if not (root / "docs" / d / "_modelo.md").is_file()]
    problems += front_matter_errors(root)
    if drift_violation(changed_files(args.staged, args.base), os.environ.get("PR_BODY", "")):
        problems.append("código mudou sem nenhuma doc; atualize a doc no mesmo PR ou escreva 'Docs: não se aplica (motivo)' no PR")
    if problems:
        return fail("checagem de documentação", problems)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
