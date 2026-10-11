"""Linha de comando: `deploycheck --dockerfile Dockerfile --bicep infra/main.bicep ...`."""

import argparse
import json
from dataclasses import asdict
from pathlib import Path

from deploycheck.model import Severity
from deploycheck.runner import check_files
from llm_service.config import KNOWN_ENV


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="deploycheck", description="Valida artefatos de deploy")
    parser.add_argument("--dockerfile", type=Path, default=None)
    parser.add_argument("--bicep", type=Path, default=None)
    parser.add_argument("--workflow", type=Path, default=None)
    parser.add_argument("--json", action="store_true", help="saída em JSON")
    parser.add_argument("--strict", action="store_true", help="avisos também reprovam")
    args = parser.parse_args(argv)
    if not (args.dockerfile or args.bicep or args.workflow):
        parser.error("informe ao menos um de --dockerfile, --bicep, --workflow")

    findings = check_files(
        known_env=KNOWN_ENV,
        dockerfile=args.dockerfile,
        bicep=args.bicep,
        workflow=args.workflow,
    )
    if args.json:
        print(json.dumps([asdict(f) for f in findings], ensure_ascii=False, indent=2))
    else:
        for f in findings:
            print(f.render())
        errors = sum(f.severity is Severity.ERROR for f in findings)
        print(f"{errors} erro(s), {len(findings) - errors} aviso(s)")
    failed = any(f.severity is Severity.ERROR or args.strict for f in findings)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
