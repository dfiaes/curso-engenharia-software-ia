# Lab F05 — sqllab

Relational modeling, SQL, indexes, transactions and safe DB-API access, using only
`sqlite3` from the standard library. Python 3.14, managed with `uv`. No server,
no network.

## Quality gates

    uv sync --frozen
    uv run pytest -q
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests

## What each part covers

| Piece | File | Shows |
|---|---|---|
| migrations | `src/sqllab/migrations/*.sql`, `db.py` | versioned schema via `PRAGMA user_version`, transactional DDL |
| queries | `src/sqllab/queries/*.sql` | joins, anti-joins, GROUP BY/HAVING, recursive CTEs, window functions |
| plans | `plans.py`, `nplus1.py` | `EXPLAIN QUERY PLAN` before/after an index; N+1 counted |
| repository | `repository.py` | parameters, UPSERT, RETURNING, atomic checkout |
| injection | `unsafe.py` (deliberately vulnerable) | concatenation vs parameters |
| concurrency | `concurrency.py` | lost update, snapshot reads, write conflicts on SQLite |
| CLI | `python -m sqllab.cli` | `queries`, `run`, `plan`, `injection`, `nplus1`, `concurrency` |

The reference copy is read-only. Run `python3 create_working_copy.py` and work in the
printed directory.
