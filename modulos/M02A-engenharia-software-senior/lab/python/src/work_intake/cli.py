"""CLI instalada do primeiro vertical slice."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections.abc import Sequence
from pathlib import Path

from work_intake.application.boundary import BoundaryError, parse_work_request_json
from work_intake.application.service import IdempotencyConflict
from work_intake.composition import build_evaluator
from work_intake.evidence import EvidenceTimer, write_evidence
from work_intake.ports.advisor import AdvisorError

EXIT_OK = 0
EXIT_BOUNDARY = 2
EXIT_IDEMPOTENCY = 3
EXIT_ADAPTER = 4
EXIT_OPERATIONAL = 5
EXIT_INTERNAL = 70


def _error(message: str) -> None:
    sys.stderr.buffer.write((message + "\n").encode("utf-8"))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="work-intake",
        description=(
            "Avalia uma solicitação local com policy determinística e advisor substituível."
        ),
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    evaluate = subparsers.add_parser("evaluate", help="valida, decide e persiste um WorkRequest")
    evaluate.add_argument("input", type=Path, help="arquivo JSON WorkRequest v1/v2")
    evaluate.add_argument("--database", type=Path, required=True, help="arquivo SQLite local")
    evaluate.add_argument("--advisor", choices=("fake", "replay"), default="fake")
    evaluate.add_argument("--recording", type=Path, help="recording JSON para --advisor replay")
    evaluate.add_argument("--evidence", type=Path, help="manifest JSON sanitizado")
    return parser


def run(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    timer = EvidenceTimer()
    try:
        input_bytes = args.input.read_bytes()
        request = parse_work_request_json(input_bytes.decode("utf-8"))
        service = build_evaluator(
            database=args.database,
            advisor_kind=args.advisor,
            recording=args.recording,
        )
        result = service.execute(request)
        output_bytes = (
            json.dumps(result.as_payload(), ensure_ascii=False, sort_keys=True) + "\n"
        ).encode("utf-8")
        sys.stdout.buffer.write(output_bytes)
        if args.evidence is not None:
            write_evidence(
                args.evidence,
                timer.finish(
                    input_bytes=input_bytes,
                    output_bytes=output_bytes,
                    request=request,
                    result=result,
                ),
            )
        return EXIT_OK
    except BoundaryError as exc:
        _error(f"entrada inválida: {exc}")
        return EXIT_BOUNDARY
    except IdempotencyConflict as exc:
        _error(f"conflito de idempotência: {exc}")
        return EXIT_IDEMPOTENCY
    except AdvisorError as exc:
        _error(f"adapter inválido: {exc}")
        return EXIT_ADAPTER
    except (OSError, UnicodeError, sqlite3.Error) as exc:
        _error(f"falha operacional: {type(exc).__name__}")
        return EXIT_OPERATIONAL
    except Exception as exc:  # pragma: no cover - boundary defensiva
        _error(f"falha interna: {type(exc).__name__}")
        return EXIT_INTERNAL


def main() -> None:
    raise SystemExit(run())


if __name__ == "__main__":
    main()
