# Lab A01 — sdlc_kit

Tool-agnostic building blocks for an AI-native SDLC. Python 3.14, managed with `uv`.
No network at runtime; the only dependency is PyYAML (for `bands.yaml`).

## Quality gates

    uv sync --frozen
    uv run pytest -q
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests

## What each part covers

| Piece | File | Shows |
|---|---|---|
| artifact validators | `src/sdlc_kit/artifacts.py` | required sections and the intent -> spec -> plan trace |
| guardrail policy | `src/sdlc_kit/policy.py` | protected paths, test-edit block on `fix/*`, secrets in added lines |
| git adapters | `src/sdlc_kit/gitio.py` | the same checks as a pre-commit hook and as a CI step |
| agent hook shim | `src/sdlc_kit/agent_hook.py` | one exit-code-2 shim for tools that call hooks with JSON |
| detector | `src/sdlc_kit/anomaly.py`, `bands.py` | Western Electric rules, sigma tiers from `bands.yaml` |
| diagnosis | `src/sdlc_kit/diagnosis.py` | a breach becomes a draft `intent.md` |
| CLI | `python -m sdlc_kit` | `validate`, `hook`, `agent-hook`, `detect`, `demo-series` |

Examples live in `examples/`. The reference copy is read-only: run
`python3 create_working_copy.py` and work in the printed directory.
