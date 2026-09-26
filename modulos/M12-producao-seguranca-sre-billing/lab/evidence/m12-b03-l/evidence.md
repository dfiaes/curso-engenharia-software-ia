# M12-B03-L · evidência (exemplo variável, não medição)

- python: 3.14.7 via `uv run python --version`
- comandos: `uv sync --frozen` · `ruff check .` OK · `ruff format --check .` OK
  · `mypy --strict src` OK (10 arquivos, 0 issues) · `pytest -q`
- resultado: 68 passed, 1 skipped (`test_tenancy_postgres.py`: grupo postgres
  não instalado / Docker ausente — BLOCKED, não conta como verde)
- src: sem alteração; `authorization.py` já cobre contratos congelados B03
  (`Principal`/`ToolRequest`+`intent_hash`, `ActionRisk`, `LocalPolicy`
  `AUTH_TENANT_MATCH`/`AUTH_TOOL_SCOPE`/`AUTH_ALLOW_SCOPED`,
  `ApprovalStore.issue/consume` com `APPROVAL_NOT_FOUND`/`ALREADY_USED`/
  `EXPIRED`/`BINDING_MISMATCH`, `APPROVAL_EXACT_INTENT` + `correlation_id`,
  `audit_policy_decision` só com nome da tool)
- AT-005: `tests/test_b03_bridge.py::test_at005_denies_replay_with_single_use`
  (`APPROVAL_ALREADY_USED`, sucesso correlacionado uma vez) +
  `test_at005_denies_tampered_arguments` (`APPROVAL_BINDING_MISMATCH`) +
  `test_at005_denies_expired_approval` (`APPROVAL_EXPIRED`) +
  `test_at005_denies_unknown_approval` (`APPROVAL_NOT_FOUND`); reforço em
  `tests/test_authorization.py` (7 testes)
- AT-006: `test_at006_denies_divergent_tenant_with_content_free_audit`
  (`AUTH_TENANT_MATCH`, `denied`, `metadata=={"tool":...}`, dump sem
  `amount`/`BRL`) + `test_at006_denies_divergent_actor_and_tenant_on_consume`
  (ator e tenant divergentes no `consume` → `APPROVAL_BINDING_MISMATCH`)
- limites: persistência/consumo atômico no Capstone, identity/audit store do
  Capstone, suíte PostgreSQL 18 e E2E pendentes (PG = BLOCKED, nunca skip
  verde); sem rede; fake determinístico; valores de exemplo variável
- junit bruto: `junit.xml` neste diretório
