"""Small command line to see each lab piece working."""

from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

from sqllab import concurrency
from sqllab.db import connect, migrate
from sqllab.nplus1 import StatementCounter, titles_with_authors_join, titles_with_authors_n_plus_1
from sqllab.plans import explain
from sqllab.queries import list_queries, run_query
from sqllab.repository import LibraryRepository
from sqllab.seed import TODAY, seed_bulk, seed_small
from sqllab.unsafe import find_member_unsafe

PLAN_SQL = "SELECT id, book_id, loaned_on FROM loan WHERE member_id = ? ORDER BY loaned_on DESC"


def _print_table(rows: list[dict[str, object]]) -> None:
    if not rows:
        print("(0 rows)")
        return
    headers = list(rows[0])
    cells = [[str(row[h]) for h in headers] for row in rows]
    widths = [max(len(h), *(len(r[i]) for r in cells)) for i, h in enumerate(headers)]
    print("  ".join(h.ljust(w) for h, w in zip(headers, widths, strict=True)))
    print("  ".join("-" * w for w in widths))
    for line in cells:
        print("  ".join(c.ljust(w) for c, w in zip(line, widths, strict=True)))
    print(f"({len(rows)} row(s))")


def cmd_queries(args: argparse.Namespace) -> int:
    print("\n".join(list_queries()))
    return 0


def cmd_run(args: argparse.Namespace) -> int:
    conn = connect()
    migrate(conn)
    seed_small(conn)
    try:
        rows = run_query(conn, args.name, {"today": TODAY, "member_id": args.member_id})
    except KeyError as exc:
        print(exc, file=sys.stderr)
        return 2
    _print_table(rows)
    return 0


def cmd_plan(args: argparse.Namespace) -> int:
    conn = connect()
    migrate(conn, target=1)
    seed_bulk(conn)
    print("-- before migration 002")
    for step in explain(conn, PLAN_SQL, (7,)):
        print(step)
    migrate(conn)
    print("-- after migration 002")
    for step in explain(conn, PLAN_SQL, (7,)):
        print(step)
    return 0


def cmd_injection(args: argparse.Namespace) -> int:
    conn = connect()
    migrate(conn)
    seed_small(conn)
    payload = "' OR '1'='1"
    print(f"payload: {payload}")
    print(f"unsafe rows: {len(find_member_unsafe(conn, payload))}")
    print(f"safe member: {LibraryRepository(conn).get_member_by_email(payload)}")
    return 0


def cmd_nplus1(args: argparse.Namespace) -> int:
    conn = connect()
    migrate(conn)
    seed_small(conn)
    with StatementCounter(conn) as bad:
        titles_with_authors_n_plus_1(conn)
    with StatementCounter(conn) as good:
        titles_with_authors_join(conn)
    print(f"N+1: {bad.count} statements")
    print(f"JOIN: {good.count} statement")
    return 0


def cmd_concurrency(args: argparse.Namespace) -> int:
    with tempfile.TemporaryDirectory(prefix="f05-") as tmp:
        root = Path(tmp)
        unsafe, safe = concurrency.lost_update(root / "lost.db")
        print(f"lost update: read-modify-write -> {unsafe}, atomic UPDATE -> {safe} (expected 1)")
        snap = concurrency.snapshot_read(root / "snap.db")
        print(
            f"snapshot: first={snap.first_read} same-txn={snap.second_read_same_txn}"
            f" after-commit={snap.read_after_commit}"
        )
        skew = concurrency.write_skew_blocked(root / "skew.db")
        print(
            f"write skew: second writer -> {skew.second_writer_error!r},"
            f" on call = {skew.on_call_after}"
        )
        print(f"two writers: {concurrency.writer_blocks_writer(root / 'w.db')!r}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="sqllab")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("queries").set_defaults(func=cmd_queries)
    run = sub.add_parser("run")
    run.add_argument("name")
    run.add_argument("--member-id", type=int, default=5)
    run.set_defaults(func=cmd_run)
    sub.add_parser("plan").set_defaults(func=cmd_plan)
    sub.add_parser("injection").set_defaults(func=cmd_injection)
    sub.add_parser("nplus1").set_defaults(func=cmd_nplus1)
    sub.add_parser("concurrency").set_defaults(func=cmd_concurrency)
    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
