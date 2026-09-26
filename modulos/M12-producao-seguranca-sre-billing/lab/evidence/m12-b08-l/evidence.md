# M12-B08-L · evidência (exemplo variável, não medição)

- python: 3.14.7 via `uv run python --version`
- comandos: `uv sync --frozen` · `ruff check .` OK · `ruff format --check .` OK
  · `mypy --strict src` OK (10 arquivos, 0 issues) · `pytest`
- resultado: 91 passed, 1 skipped (`test_tenancy_postgres.py`: grupo postgres
  não instalado / Docker ausente — BLOCKED, não conta como verde)
- src: sem alteração; `sre.py` já cobre os contratos congelados B08
  (`burn_rate` com erro observado dividido pelo erro permitido e `ValueError`
  em entradas inválidas, `MultiWindowBurnAlert.should_page` paginando só com
  queima curta e longa acima dos limiares no mesmo objetivo,
  `ReadOnlyIncidentCopilot.summarize` redigindo via `ContentPolicy` com prefixo
  de não-ação, zero ações e sem tool de escrita ao alcance)
- AT-050: `tests/test_b08_bridge.py::test_at050_burn_normalized_and_multiwindow_confirms`
  (10x/0.1x normalizados, page com confirmação longa, sem page sem confirmação,
  `ValueError` em entradas inválidas); reforço em `tests/test_billing_sre.py`
  (2 testes)
- AT-051: `test_at051_copilot_read_only_redacts_and_never_acts` (prefixo
  `Untrusted operational evidence; no action executed`, PII redigida, texto
  operacional preservado, zero ações); reforço em `tests/test_billing_sre.py`
  (1 teste)
- AT-052: PENDENTE — game day com timeline, mitigação, comunicação, decisão de
  rollback e postmortem pertence às evidências seguintes; nenhum teste verde
  alega game day aqui
- contrato: `test_b08_frozen_contract_surface` (assinaturas exatas de
  `burn_rate`/`should_page`/`summarize` com parâmetros keyword-only e ausência
  de atributos de escrita no copiloto)
- limites: métricas reais, regras de alerta e runbooks do Capstone, telemetria
  OpenTelemetry do Capstone e game day com timeline/postmortem — todos nas
  evidências seguintes (PG = BLOCKED, nunca skip verde); sem rede/Docker; dados
  sintéticos; valores de exemplo variável
- junit bruto: `junit.xml` neste diretório
