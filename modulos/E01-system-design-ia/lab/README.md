# Lab E01 — capacity

Back-of-the-envelope capacity and cost estimates for LLM systems, plus a design
doc template. Python 3.14, managed with `uv`. No network, no services, no
credentials. Prices in the code are hypothetical round numbers, not a vendor
price list: replace them with the current table of your provider.

## Quality gates

    uv sync --frozen
    uv run pytest -q
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests

## What is here

| Piece | File | Shows |
|---|---|---|
| calculator | `src/capacity/core.py` | peak QPS, Little's law, TPM/RPM quota, cost with cache/batch/routing, sampling size |
| three cases | `src/capacity/cases.py` | RAG assistant, agent platform, batch document pipeline |
| report | `python -m capacity [1|2|3]` | prints the estimates quoted in module E01 |
| template | `template/DESIGN-DOC.md` | design doc skeleton to fill in |

The reference copy is read-only. Run `python3 create_working_copy.py` and work
in the printed directory.
