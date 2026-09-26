# capstone-lab — M13 B1–B5

Baseline executável do capstone Cartógrafo (Tier 1, épico 1/4).

## Baseline reproduzível (B2)

Pré-requisito: `uv` instalado e Python 3.14 disponível (o `uv` baixa/usa 3.14 automaticamente).

```bash
cd modulos/M13-capstone/lab
uv sync
uv run ruff check . && uv run ruff format --check .
uv run mypy
uv run pytest
```

Trilha Docker Compose: **BLOCKED** — `docker`/`docker compose` indisponíveis no ambiente de
produção deste lote (verificado em 20/09/2026: `command not found: docker`). O arquivo
`docker-compose.yml` documenta o alvo de integração (API + worker + Postgres/RLS) e fica
registrado como BLOCKED na rastreabilidade, nunca simulado.

## Estrutura

- `docs/release-contract.md`, `docs/risk-register.md` — B1
- `docker-compose.yml` — B2 (BLOCKED ambiental)
- `src/capstone_lab/ingest.py` — B3: snapshot store + job assíncrono idempotente
- `src/capstone_lab/parsers.py` — B4: `LanguageParser` + Python AST + MiniLang (regex/gramática local)
- `src/capstone_lab/db.py` — B5: SQLite, migrations com rollback, scoping por tenant
- `fixtures/golden/` — corpus dourado do B4
