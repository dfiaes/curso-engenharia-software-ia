# Lab E05 — interview_prep

Career tooling in three small pieces. Python 3.14, managed with `uv`. No network,
no services, no accounts.

## Quality gates

    uv sync --frozen
    uv run pytest -q
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests

## What each part covers

| Piece | File | Shows |
|---|---|---|
| question bank | `src/interview_prep/models.py`, `data/questions.json` | Pydantic validation at the boundary, bank-level coverage rules |
| spaced repetition | `src/interview_prep/leitner.py` | Leitner boxes, injectable clock, atomic JSON state |
| portfolio checklist | `src/interview_prep/checklist.py` | required README sections, "numbers or it is weak" rule |
| CLI | `python -m interview_prep.cli` | `validate-bank`, `practice`, `status`, `checklist` |

Exit codes: 0 ok, 1 negative result (bank problems, incomplete README), 2 usage or I/O error.

The reference copy is read-only. Run `python3 create_working_copy.py` and work in the
printed directory.
