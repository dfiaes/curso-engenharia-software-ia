# M12-B06-L · evidência (exemplo variável, não medição)

- python: 3.14.7 via `uv run python --version`
- comandos: `uv sync --frozen` · `ruff check .` OK · `ruff format --check .` OK
  · `mypy --strict src` OK (10 arquivos, 0 issues) · `pytest`
- resultado: 84 passed, 1 skipped (`test_tenancy_postgres.py`: grupo postgres
  não instalado / Docker ausente — BLOCKED, não conta como verde)
- src: sem alteração; `reliability.py` já cobre os contratos congelados B06
  (`LimitExceeded` como erro de negação, `QuotaPolicy(limit, window)` com
  `consume(tenant_id, *, now)` em janela deslizante por tenant com relógio
  injetado, restante inteiro, `QUOTA_EXCEEDED` além do teto, isolamento entre
  tenants e reset após a janela, `Reservation(maximum, committed)` como linha,
  `BudgetLedger(limit)` com `reserve` negando `BUDGET_EXCEEDED` quando gasto
  confirmado mais exposição aberta mais novo máximo supera o teto,
  `commit` negando `ACTUAL_COST_EXCEEDS_RESERVATION` quando o real supera o
  reservado, `release` liberando sem custo, `spent` somando confirmados)
- AT-040: `tests/test_b06_bridge.py::test_at040_burst_denies_at_ceiling_isolated_and_windowed`
  (burst nega com `QUOTA_EXCEEDED`, restante 1/0, segundo tenant isolado,
  janela restaura o teto); reforço em `tests/test_reliability.py`
  (isolamento por tenant e reset após janela)
- AT-041: `test_at041_reserve_commit_release_close_consistently` (reserva do
  máximo, `BUDGET_EXCEEDED` antes do efeito, commit do real libera espaço,
  `spent` soma confirmados) +
  `test_at041_actual_above_reservation_and_cancelled_release` (real acima do
  reservado nega com `ACTUAL_COST_EXCEEDS_RESERVATION`, cancelada libera sem
  cobrança fantasma); reforço em `tests/test_reliability.py` (2 testes)
- contrato: `test_b06_frozen_contract_surface` (assinaturas e valores exatos,
  `now` keyword-only, `spent` como property, `committed` default None)
- limites: limites distribuídos de request/token/concorrência entre processos,
  token budget por chamada e por fluxo no adapter, circuit breaker, deadline
  e retry budget no Capstone, cancelamento com uso medido do provedor e
  reconciliação com o ledger — todos nas evidências seguintes (PG = BLOCKED,
  nunca skip verde); sem rede/Docker; quotas determinísticas com relógio
  injetado; valores de exemplo variável
- junit bruto: `junit.xml` neste diretório
