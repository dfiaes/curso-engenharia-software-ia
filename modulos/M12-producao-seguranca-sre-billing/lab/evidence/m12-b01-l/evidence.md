# M12-B01-L · evidência (exemplo variável, não medição)

- python: 3.14.7 via `uv run python --version`
- comandos: `uv sync --frozen` · `ruff check .` OK · `ruff format --check .` OK
  · `mypy --strict src` OK (10 arquivos, 0 issues) · `pytest -q`
- resultado: 46 passed, 1 skipped (`test_tenancy_postgres.py`: grupo postgres
  não instalado / Docker ausente — BLOCKED, não conta como verde)
- AT-001: `tests/test_threat_model.py` (5 testes) — README injetado negado com
  `TOOL_OUTSIDE_SESSION_AUTHORITY`, 0 eventos de auditoria, schema divergente
  negado com `TOOL_ARGUMENTS_INVALID`
- catálogo: `threat-catalog.yaml` — 20 ameaças TM-001..TM-020, 11 campos cada,
  TM-001 ligada a ASI01/ASI02/ASI03 + M12-AT-001
- limites: AT-002..AT-006 só catalogados (executáveis em B02/B03);
  AT-010+ exige PostgreSQL 18 real (BLOCKED sem Docker, sem skip verde)
- junit bruto: `junit.xml` neste diretório
