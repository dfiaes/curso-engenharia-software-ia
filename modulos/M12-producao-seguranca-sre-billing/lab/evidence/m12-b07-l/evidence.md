# M12-B07-L · evidência (exemplo variável, não medição)

- python: 3.14.7 via `uv run python --version`
- comandos: `uv sync --frozen` · `ruff check .` OK · `ruff format --check .` OK
  · `mypy --strict src` OK (10 arquivos, 0 issues) · `pytest`
- resultado: 88 passed, 1 skipped (`test_tenancy_postgres.py`: grupo postgres
  não instalado / Docker ausente — BLOCKED, não conta como verde)
- src: sem alteração; `billing.py` já cobre os contratos congelados B07
  (`UsageEvent` com event_id/tenant_id/meter/quantity/occurred_at/source_id,
  `BillingProvider` como port com `report_usage`/`fetch_total`,
  `FakeBillingProvider` determinístico deduplicando por event_id,
  `UsageLedger.append` deduplicando, `total` somando quantidades,
  `unit_margin` como receita menos custo direto medido menos alocado,
  `EntitlementEvent` com subscription_id/version/status,
  `EntitlementProjection.apply` convergindo por version e `status`,
  `reconcile_usage` abrindo issue na divergência e fechando na convergência,
  `verify_webhook` com HMAC constante e janela de replay local)
- AT-030: `tests/test_b07_bridge.py::test_at030_webhook_rejects_bad_signature_and_replay_without_mutation`
  (assinatura válida aceita, `WEBHOOK_INVALID_SIGNATURE` e
  `WEBHOOK_OUTSIDE_REPLAY_WINDOW` rejeitados, ledger sem mutação)
- AT-031: `test_at031_duplicate_and_out_of_order_converge` (ledger deduplica e
  soma fora de ordem; projeção ignora duplicata e versão antiga, converge para
  `cancelled`); reforço em `tests/test_billing_sre.py` (2 testes)
- AT-032: `test_at032_divergence_detected_then_closed_and_margin_from_ledger`
  (issue `open` com expected/observed, fecha após convergência, margem do
  ledger); reforço em `tests/test_billing_sre.py` (reconciliação + margem)
- contrato: `test_b07_frozen_contract_surface` (campos dos modelos e
  assinaturas exatas de port/fake/ledger/projeção/reconciliação/webhook)
- limites: persistência do ledger/projeção em PostgreSQL, concorrência real
  entre conexões/processos, adapter Stripe em test-mode, job periódico de
  reconciliação, invoice state e dashboard de margem — todos nas evidências
  seguintes (PG = BLOCKED, nunca skip verde); sem rede/Docker; fake
  determinístico; webhook com janela+assinatura verificadas localmente;
  valores de exemplo variável
- junit bruto: `junit.xml` neste diretório
