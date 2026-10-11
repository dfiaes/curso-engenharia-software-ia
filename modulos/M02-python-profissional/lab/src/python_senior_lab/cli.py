"""CLI instalada por entry point, com stdout/stderr e exit codes estáveis."""

from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence
from pathlib import Path

from python_senior_lab.diagnostics import diagnose
from python_senior_lab.evidence import EvidenceTimer, write_evidence
from python_senior_lab.parsing import (
    InputContractError,
    InputOperationalError,
    iter_file,
    write_file,
)

EXIT_OK = 0
EXIT_CONTRACT = 2
EXIT_OPERATIONAL = 3
EXIT_INTERNAL = 70


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="csv-cleaner",
        description="Valida e normaliza transações CSV sem depender de rede.",
    )
    parser.add_argument("input", type=Path, help="CSV UTF-8 de entrada")
    parser.add_argument("output", type=Path, help="CSV normalizado de saída")
    parser.add_argument(
        "--evidence",
        type=Path,
        help="grava evidência JSON com versões, hashes e duração",
    )
    return parser


def run(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    timer = EvidenceTimer()
    try:
        rows = write_file(args.output, iter_file(args.input))
        if args.evidence is not None:
            write_evidence(
                args.evidence,
                timer.finish(input_path=args.input, output_path=args.output, rows=rows),
            )
        print(f"ok: {rows} transações normalizadas", file=sys.stdout)
        return EXIT_OK
    except InputContractError as exc:
        diagnostic = diagnose(exc)
        print(f"entrada inválida: {diagnostic.message}", file=sys.stderr)
        if diagnostic.cause_type:
            print(f"causa: {diagnostic.cause_type}", file=sys.stderr)
        return EXIT_CONTRACT
    except (InputOperationalError, UnicodeError) as exc:
        print(f"falha operacional: {exc}", file=sys.stderr)
        return EXIT_OPERATIONAL
    except Exception as exc:  # pragma: no cover - boundary defensiva
        print(f"falha interna: {type(exc).__name__}: {exc}", file=sys.stderr)
        return EXIT_INTERNAL


def main() -> None:
    raise SystemExit(run())


if __name__ == "__main__":
    main()
