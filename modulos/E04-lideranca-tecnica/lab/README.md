# Lab E04 — leadkit

Three small tools for technical leads, plus Markdown templates. Python 3.14,
managed with `uv`. No network, no services, no third-party runtime dependencies.

## Quality gates

    uv sync --frozen
    uv run pytest -q
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests

## What each part covers

| Piece | File | Shows |
|---|---|---|
| `leadkit estimate` | `src/leadkit/estimate.py` | Monte Carlo forecast from min/likely/max estimates (PERT or triangular), P50/P85/P95, discrete risks, fixed seed |
| `leadkit dora` | `src/leadkit/dora.py` | deploy frequency, lead time, change failure rate and recovery time from two CSV files |
| `leadkit check` | `src/leadkit/doccheck.py` | structure lint for `rfc`, `sbi` and `postmortem` documents |
| templates | `templates/` | RFC, design review, 1:1, SBI feedback, AI-generated code review checklist, postmortem |
| sample data | `data/`, `exemplos/` | a project to estimate, a month of deploys and incidents, good and bad documents |

Exit codes: 0 ok, 1 findings from `check`, 2 invalid input.

The reference copy is read-only. Run `python3 create_working_copy.py` and work
in the printed directory.
