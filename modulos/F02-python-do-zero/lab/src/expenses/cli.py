"""Command line: ``python -m expenses report FILE``.

Exit codes: 0 all rows valid; 1 at least one invalid row; 2 usage, missing file,
wrong encoding, missing column or unwritable output.
"""

from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence
from pathlib import Path

from expenses.aggregate import monthly_totals, top, total_by_category
from expenses.errors import ExpensesError, InvalidRowError
from expenses.export import report_payload, write_report
from expenses.model import Expense
from expenses.reader import scan

EXIT_OK = 0
EXIT_INVALID_DATA = 1
EXIT_PROBLEM = 2


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="expenses", description="Relatório de despesas")
    sub = parser.add_subparsers(dest="command", required=True)
    report = sub.add_parser("report", help="agrega um CSV por categoria")
    report.add_argument("file", type=Path)
    report.add_argument("--encoding", default="utf-8")
    report.add_argument("--json", type=Path, dest="json_out", help="grava o relatório em JSON")
    report.add_argument("--top", type=int, default=5, help="quantas categorias mostrar")
    report.add_argument(
        "--lenient", action="store_true", help="segue após linhas inválidas e as lista no stderr"
    )
    return parser


def run_report(args: argparse.Namespace) -> int:
    good: list[Expense] = []
    bad: list[InvalidRowError] = []
    for item in scan(args.file, encoding=args.encoding):
        if isinstance(item, InvalidRowError):
            print(f"rejeitada: {item}", file=sys.stderr)
            bad.append(item)
            if not args.lenient:
                return EXIT_INVALID_DATA
        else:
            good.append(item)

    totals = total_by_category(good)
    for name, value in top(totals, args.top):
        print(f"{name:<20}{value:>12}")
    print(f"{'total':<20}{sum(totals.values()):>12}")
    if args.json_out is not None:
        write_report(args.json_out, report_payload(totals, monthly_totals(good), len(bad)))
    return EXIT_INVALID_DATA if bad else EXIT_OK


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return run_report(args)
    except FileNotFoundError:
        print(f"expenses: {args.file}: arquivo não encontrado", file=sys.stderr)
        return EXIT_PROBLEM
    except ExpensesError as err:
        print(f"expenses: {err}", file=sys.stderr)
        return EXIT_PROBLEM
