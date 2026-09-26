# Lab M03/B02 — sessão, transação e migration

Referência versionada do lote B02. Python 3.14 canônico, gerenciado com `uv`.

## Comandos de qualidade (oráculos do programa, não avaliação)

    uv sync --frozen
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests
    uv run pytest -q

## O que cada teste prova

| Arquivo | Cenários | Ambiente |
|---|---|---|
| `test_domain.py` | validação de slug/URL | sem serviços |
| `test_conflict_mapping.py` | 23505 -> conflito; controle negativo | sem serviços |
| `test_migration_pairing.py` | cadeia upgrade/downgrade íntegra | sem serviços |
| `test_session_scope.py` | commit confirma, exceção desfaz (AT-003), sessão por fluxo (AT-007) | SQLite transacional local — prova a MECÂNICA, não garantias do PostgreSQL |
| `test_counters.py` | ler-somar-gravar perde com intercalamento; atômico preserva total concorrente (AT-010) | SQLite local — a corrida real com 50 tarefas no PostgreSQL é BLOCKED |
| `test_data.py` | índices no schema (AT-009), `meta` é JSONB no PG + persiste/filtra (AT-011), banco isolado por teste (AT-012) | sem serviços / SQLite — EXPLAIN, GIN e `@>` reais são BLOCKED |
| `test_layers.py` | guardrail AST: imports ilegais quebram a suíte (AT-013/014), com controle negativo | sem serviços |
| `test_service_override.py` | mesma regra contra SQLAlchemy e fake; HTTP via `dependency_overrides` (AT-015) | SQLite local + cliente ASGI — sem porta, sem Docker |
| `test_packaging.py` | multi-stage, não-root, contexto sem segredo, Compose saudável (AT-017..020) | estático — build/subida BLOCKED sem Docker |
| `test_resilience.py` | porta fechada levanta, falha não é conflito, dispose limpo (AT-024 parcial) | sem serviços |
| `test_operation.py` | fluxo final com correlação, `/health` 200/503 (AT-024/029/030) | SQLite local + cliente ASGI |
| `test_release.py` | workflow, paridade local, SHA, startup, fail-fast (AT-025..029) | estático + `serve` |
| `scripts/check.sh` | equivalente local do CI (AT-025) | todos os gates |
| `RELEASE.md` | contrato de release + trilha opcional (AT-028/032) | documento |
| `tests/conftest.py` + `test_postgres_integration.py` | migration como setup, CRUD, envelope, concorrência, GIN (AT-005/006/009/010/011/012/021/022) | **BLOCKED** sem Docker Engine/Compose ou `M03_PG_URL` |

## Configuração

Copie `.env.example` para `.env` (nunca commitado). `APP_DATABASE_URL` usa o
driver async (`postgresql+asyncpg://...`) no app e é convertida para
síncrona no Alembic.

## Cópia de trabalho

Não edite esta referência diretamente. Crie uma cópia descartável:

    python3 create_working_copy.py
