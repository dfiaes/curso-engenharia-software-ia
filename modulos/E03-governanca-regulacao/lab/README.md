# Lab E03 - aigov

Governance as code in two small pieces. Python 3.14, managed with `uv`. No network,
no services, no credentials.

## Quality gates

    uv sync --frozen
    uv run pytest -q
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests

## What each part covers

| Piece | File | Shows |
|---|---|---|
| register | `src/aigov/models.py` | closed Pydantic schema for one AI system (purpose, data, legal basis, stores, provider, assessments) |
| loader | `src/aigov/loader.py` | YAML/JSON to a validated record, readable load errors |
| rules | `src/aigov/rules.py` | 15 gap rules (AIG-001..015), pure functions with an injected clock |
| PII | `src/aigov/pii.py` | CPF (check digits), e-mail and phone detection, redaction, keyed pseudonyms, logging filter |
| CLI | `python -m aigov` | `validate`, `scan`, `redact`; exit codes 0 clean, 1 findings, 2 error |

Examples live in `examples/` (`good.yaml`, `bad.yaml`, `sample.log`). The reference
copy is read-only: run `python3 create_working_copy.py` and work in the printed directory.
