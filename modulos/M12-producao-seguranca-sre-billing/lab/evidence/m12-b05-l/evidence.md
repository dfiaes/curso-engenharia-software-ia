# M12-B05-L · evidência (exemplo variável, não medição)

- python: 3.14.7 via `uv run python --version`
- comandos: `uv sync --frozen` · `ruff check .` OK · `ruff format --check .` OK
  · `mypy --strict src` OK (10 arquivos, 0 issues) · `pytest`
- resultado: 80 passed, 1 skipped (`test_tenancy_postgres.py`: grupo postgres
  não instalado / Docker ausente — BLOCKED, não conta como verde)
- src: sem alteração; `models.py` + `reliability.py` já cobrem os contratos
  congelados B05 (`ToolRequest` com `request_id` + `intent_hash` de tenant/tool/
  argumentos canonicalizados, `IdempotencyConflict`, `ExecutionState`
  STARTED/SUCCEEDED/UNKNOWN, `ExecutionRecord(intent_hash, state, result)`,
  `execute_once(tenant_id, key, request, effect)` com reuso/conflict/efeito único
  e `UNKNOWN` em falha ambígua, `reconcile_unknown(tenant_id, key, request,
  lookup)` com recibo sem novo efeito ou retry liberado após ausência
  confirmada); migração `001_security_ledgers.sql` com `idempotency_ledger`
  (`intent_hash`, 5 estados, PK tenant + chave) como referência durável
- AT-020: `tests/test_b05_bridge.py::test_at020_same_key_same_intent_reuses_single_execution`
  (replay devolve resposta gravada, efeito executa 1 vez)
- AT-021: `test_at021_same_key_divergent_intent_conflicts_without_effect`
  (`IDEMPOTENCY_INTENT_MISMATCH`, nenhum efeito adicional)
- AT-022: `test_at022_concurrent_instances_produce_one_external_effect`
  (duas coroutines, contador externo igual a 1)
- AT-023: `test_at023_ambiguous_crash_reconciles_never_blind_retries` (timeout
  vira `UNKNOWN`, retry nega com `IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN`,
  `reconcile_unknown` confirma recibo sem novo efeito) +
  `test_at023_confirmed_absence_frees_safe_retry` (ausência confirmada libera
  nova tentativa segura); reforço em `tests/test_reliability.py` (8 testes)
- contrato: `test_b05_frozen_contract_surface` (assinaturas e valores exatos) +
  `test_b05_migration_holds_durable_ledger_reference` (estático, sem banco)
- limites: repositório durável PG com unique constraint, concorrência entre
  conexões/processos distintos, matriz de crashes real, repasse de chave ao
  provedor e outbox — todos nas evidências seguintes (PG = BLOCKED, nunca skip
  verde); sem rede; fake determinístico em memória; valores de exemplo variável
- junit bruto: `junit.xml` neste diretório
