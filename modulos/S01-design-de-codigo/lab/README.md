# Lab S01 — design_lab

Characterization tests, a strategy-based refactoring and a small TDD kata.
Python 3.14, managed with `uv`. No network, no services.

## Quality gates

    uv sync --frozen
    uv run pytest -q
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests

## What each part covers

| Piece | Where | Shows |
|---|---|---|
| legacy pricing | `src/design_lab/legado.py` | one ~100-line function full of `if`/`elif`; frozen on purpose |
| characterization | `tests/golden/saidas.json`, `tests/test_caracterizacao.py` | outputs observed from the legacy code, checked against both versions |
| refactored pricing | `src/design_lab/pedidos/` | frozen models, pure rules, strategy table, repository port + fake, thin service |
| differential test | `python -m design_lab.cli diferencial` | random inputs, two implementations, one answer |
| complexity meter | `python -m design_lab.cli complexidade FILE...` | cyclomatic complexity and nesting per function |
| block examples | `src/design_lab/exemplos/` | runnable snippets used in the lesson, each pinned by a test |
| TDD kata | `src/design_lab/kata/duration.py`, `tests/test_kata_duration.py` | tests written first, one behavior at a time |

The reference copy is read-only. Run `python3 create_working_copy.py` and work in
the printed directory.
