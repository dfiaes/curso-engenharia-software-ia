# M12-B04-L · evidência (exemplo variável, não medição)

- python: 3.14.7 via `uv run python --version`
- comandos: `uv sync --frozen` · `ruff check .` OK · `ruff format --check .` OK
  · `mypy --strict src` OK (10 arquivos, 0 issues) · `pytest -q`
- resultado: 73 passed, 1 skipped (`test_tenancy_postgres.py`: grupo postgres
  não instalado / Docker ausente — BLOCKED, não conta como verde)
- src: sem alteração; `tenancy.py` já cobre contratos congelados B04
  (`TenantContext(tenant_id)`, `VectorDocument`, `DeletionReport`,
  `TenantDataPlanes` cache/object/vector/graph/queue + `delete_tenant` +
  `count_tenant_records`, tenant só via `context`); migração
  `001_security_ledgers.sql` com `NOBYPASSRLS` ×2, `FORCE ROW LEVEL SECURITY`,
  `USING` + `WITH CHECK` para `course_m12_app` (referência, sem executar sem PG)
- AT-010: `tests/test_b04_bridge.py::test_at010_fake_read_is_scoped_and_fail_closed`
  (mesma chave em A/B isolada, tenant desconhecido vê nada) + PG real pendente
- AT-011: `test_at011_fake_write_cannot_cross_tenant` (escrita sob B não toca A)
  + `WITH CHECK` negando cross-tenant só na trilha PG
- contrato: `test_tenant_comes_from_context_only` (todo método público exige
  `context: TenantContext`, nenhum parâmetro `tenant_id`/`tenant`) +
  `test_b04_delete_and_count_cover_five_planes` (5 stores, `removed_by_store`,
  outro tenant intacto) + `test_migration_holds_rls_reference_without_executing_pg`
  (estático, sem banco); reforço em `tests/test_tenancy_fakes.py` (2 testes)
- limites: AT-012 catálogos `pg_roles`/`pg_class`, AT-013 pool reuse A→B com
  rollback, AT-014 filtros nativos por provedor real e AT-010/011 em PG 18 —
  todos na trilha com banco real (PG = BLOCKED, nunca skip verde); sem rede;
  fake determinístico; valores de exemplo variável
- junit bruto: `junit.xml` neste diretório
