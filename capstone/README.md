# Cartógrafo reference Capstone

This is the executable workspace built by M13. Python 3.14 is canonical; analyzed source
code may include Python and C# fixtures. Provider-specific SDKs must remain behind ports.

## Local quality gates

```powershell
uv sync --group dev --python 3.14
uv run ruff check .
uv run mypy .
uv run pytest -m "not postgres"
```

## PostgreSQL boundary

```powershell
docker compose up -d postgres
uv run pytest -m postgres
```

Docker is mandatory for the PostgreSQL release gate. A skipped integration test is not a
passing result.

## Evidence policy

Files under `evidence/` are generated from commands and versioned inputs. Do not type
`PASS` manually. Public claims must reference an evidence ID from `docs/traceability.csv`.

Current baseline result: Ruff and mypy strict pass; `6 passed, 1 skipped`. The skipped test
is the PostgreSQL 18 migration/seed check and remains a B02 blocker until Docker exists.
