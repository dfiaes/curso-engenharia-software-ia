# M12-B09-L · evidência (exemplo variável, não medição)

- python: 3.14.7 via `uv run python --version`
- comandos: `uv sync --frozen` OK · `ruff check .` OK · `ruff format --check .` OK
  · `mypy --strict src` OK (10 arquivos, 0 issues) · `pytest`
- resultado: 94 passed, 1 skipped (`test_tenancy_postgres.py`: grupo postgres
  não instalado / Docker ausente — BLOCKED, não conta como verde)
- src: sem alteração; `tenancy.py` já cobre os contratos congelados B09
  (`TenantDataPlanes.delete_tenant(context, *, now, backup_retention)`
  removendo cache, objetos, vetores, grafo e fila, com `DeletionReport`
  por store, `active_records_remaining` zero e `backups_expire_at` igual
  ao instante somado à retenção; `count_tenant_records(context)`
  confirmando zero restante)
- AT-060: `tests/test_b09_bridge.py::test_at060_coordinated_deletion_clears_five_stores`
  (5 stores removidos 1/1/1/1/1, tenant B preservado com 5 registros,
  `backups_expire_at` = now + 30d, contagens exemplo variável)
- regressão: AT-001..052 reexecutados na suíte inteira (B01–B08 oráculos
  verdes, sem duplicação de implementação — ponte só importa superfícies)
- contrato: `test_b09_frozen_contract_surface` (assinaturas exatas
  `delete_tenant`/`count_tenant_records` com keyword-only e campos de
  `DeletionReport`) + `test_b09_prior_surfaces_still_importable`
- limites: PostgreSQL real com RLS, coordenação distribuída, adapter
  Stripe em test-mode, telemetria do Capstone, Capstone E2E, game day com
  timeline/postmortem, restore de backup e reintrodução indevida — todos
  nas evidências seguintes (PG = BLOCKED, nunca skip verde); sem
  rede/Docker; dados sintéticos; valores de exemplo variável
- junit bruto: `junit.xml` neste diretório
