"""Command line. Exit codes: 0 clean, 1 findings, 2 usage or load error."""

import argparse
import os
import sys
from collections.abc import Sequence
from datetime import date
from pathlib import Path

from aigov import pii
from aigov.loader import LoadError, load_record
from aigov.rules import Finding, Severity, validate

EXIT_OK, EXIT_FINDINGS, EXIT_ERROR = 0, 1, 2


def _format(path: Path, f: Finding, style: str) -> str:
    if style == "github":
        level = "error" if f.severity is Severity.ERROR else "warning"
        return f"::{level} file={path},title={f.rule}::{f.field}: {f.message}"
    return f"  {f.severity.value.upper():5} {f.rule} {f.field}: {f.message}"


def _validate(args: argparse.Namespace) -> int:
    today = date.fromisoformat(args.today) if args.today else date.today()
    worst = EXIT_OK
    for path in args.paths:
        try:
            record = load_record(path)
        except LoadError as exc:
            print(exc, file=sys.stderr)
            return EXIT_ERROR
        findings = validate(record, today)
        errors = sum(f.severity is Severity.ERROR for f in findings)
        warns = len(findings) - errors
        if args.format == "text":
            print(f"{path.name}: {errors} error(s), {warns} warning(s)")
        for f in findings:
            print(_format(path, f, args.format))
        if errors or (args.strict and warns):
            worst = EXIT_FINDINGS
    return worst


def _key() -> bytes | None:
    raw = os.environ.get("AIGOV_PII_KEY")
    return raw.encode() if raw else None


def _redact(args: argparse.Namespace) -> int:
    key = _key()
    for line in sys.stdin:
        sys.stdout.write(pii.redact(line, key=key))
    return EXIT_OK


def _scan(args: argparse.Namespace) -> int:
    counts: dict[str, int] = {}
    try:
        text = sys.stdin.read() if str(args.path) == "-" else args.path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"{args.path}: {exc.strerror or exc}", file=sys.stderr)
        return EXIT_ERROR
    for lineno, line in enumerate(text.splitlines(keepends=True), start=1):
        for m in pii.scan(line):
            counts[m.kind.value] = counts.get(m.kind.value, 0) + 1
            print(f"line {lineno}: {m.kind.value} (col {m.start + 1})")
    total = sum(counts.values())
    print(f"total: {total} " + " ".join(f"{k}={v}" for k, v in sorted(counts.items())))
    return EXIT_FINDINGS if total else EXIT_OK


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="aigov")
    sub = parser.add_subparsers(dest="cmd", required=True)
    v = sub.add_parser("validate", help="check register files against the gap rules")
    v.add_argument("paths", nargs="+", type=Path)
    v.add_argument("--today", help="YYYY-MM-DD, fixes the clock for reproducible output")
    v.add_argument("--format", choices=["text", "github"], default="text")
    v.add_argument("--strict", action="store_true", help="warnings also fail the run")
    v.set_defaults(func=_validate)
    r = sub.add_parser("redact", help="stdin to stdout with PII replaced (key: AIGOV_PII_KEY)")
    r.set_defaults(func=_redact)
    s = sub.add_parser("scan", help="report PII positions without printing values")
    s.add_argument("path", type=Path, help="file or - for stdin")
    s.set_defaults(func=_scan)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return int(args.func(args))
    except ValueError as exc:  # bad --today
        print(f"error: {exc}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    raise SystemExit(main())
