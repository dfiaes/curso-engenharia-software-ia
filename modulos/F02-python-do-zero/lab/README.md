# Lab F02 - expenses

A small expense-report CLI that reads a CSV with an explicit encoding, validates
each row with domain exceptions, aggregates with `dict` and `Decimal`, and
exports JSON atomically. Python 3.14, managed with `uv`. No network, no services.

## Quality gates

    uv sync --frozen
    uv run pytest -q
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests

## What each part covers

| Module | Shows |
|---|---|
| `expenses/errors.py` | exception hierarchy, `raise ... from` |
| `expenses/model.py` | frozen, slotted dataclass |
| `expenses/parsing.py` | `Decimal` from text, ISO dates, Unicode normalization, `match` |
| `expenses/reader.py` | lazy generators, explicit encoding, `csv` module |
| `expenses/aggregate.py` | `dict` accumulation, `sorted(key=...)`, `itertools.groupby` |
| `expenses/export.py` | `AtomicWriter` context manager, JSON with `Decimal` |
| `expenses/cli.py` | `argparse`, exit codes 0/1/2, `python -m expenses` |

Run: `uv run python -m expenses report sample/despesas.csv`.

The reference copy is read-only. Run `python3 create_working_copy.py` and work in
the printed directory.
