# Rastreabilidade da regeneração M13

**Achado de 21/09/2026, sem promoção de gates:** a [análise solicitada](../../docs/auditorias/STATUS-DIDATICA-PROFUNDIDADE-2026-09-21.md) reproduziu GO com diretórios vazios e recuperação malsucedida (A01/P1). Os PASS históricos de B18 não comprovam prontidão; correção e revalidação pendentes. Deploy/restore sobre dicionários demonstram mecanismo local, não integração de produção (A04).

**Atualizado em:** 21/09/2026 · **Estado:** EM PRODUÇÃO · **Gate:** G0 APROVADO

## Auditoria do artefato bloqueado

| Critério | Contrato | HTML antigo | Delta |
|---|---:|---:|---|
| blocos executáveis | 20 | 5 seções | substituir integralmente |
| palavras visíveis | 14.000–18.000 | 1.149 | ampliar com integração e diagnóstico |
| resultados observáveis | ≥30 | 0 | criar por bloco e acceptance |
| código integrado | executável/pseudocódigo marcado | 0 blocos | produzir com lab/Capstone |
| diagnóstico | ≥20 falhas | tabela não rastreada | reconstruir por falha real |
| acceptance suite | 30 cenários | ausente | implementar e ligar a evidências |

## Lotes de produção

| Lote | Blocos | Entrega | Estado |
|---|---|---|---|
| MEGA Tier 1 · épico 1/4 | B01–B05 | contrato, baseline uv, ingestão idempotente, parsers + corpus, SQLite/migrations | 20/09/2026: gates executados; ver tabela de blocos |
| MEGA Tier 1 · épico 2/4 (R2.2-B/C) | B06–B10 | retrieval/ACL, grafo, gateway, agente, contratos | 21/09/2026: gates executados; ver tabela de blocos |
| MEGA Tier 1 · épico 3/4 (R2.2-D + B15) | B11–B15 | evals, hardening, billing, observabilidade, experiência web | 21/09/2026: gates executados; ver tabela de blocos |
| R2.2-E | B16–B17 | performance, deploy e rollback | PENDENTE |
| R2.2-F | B18–B20 | PRR, game day, piloto, lançamento e defesa | PENDENTE |

## Tabela de blocos do épico 1/4 (artefatos → testes → gates → decisão)

Gates executados em `modulos/M13-capstone/lab` (Python 3.14.7, uv, ruff, mypy strict, pytest 9.1.1): `uv sync` ✔, `ruff check` ✔, `ruff format --check` ✔ (37 arquivos), `mypy` ✔ (28 arquivos, 0 issues), `pytest` ✔ (97 testes, 0 falhas). Evidências em `evidence/m13/BXX/`.

Blocos do épico 4/4 (B16–B20), gates em 21/09/2026 (ruff ✔, format ✔ 47 arquivos, mypy ✔ 38 arquivos, pytest ✔ 125 testes, 0 falhas):

| Bloco | Artefatos | Testes (n) | Gates | Decisão e causa |
|---|---|---|---|---|
| B16 performance/capacidade | `lab/src/capstone_lab/perf.py`, `evidence/m13/B16/capacity-report.json` | 7 (test_perf.py) | ruff/mypy/pytest ✔ | PASS (medição real, p50/p95/p99, saturação por regra, ambiente gravado); cloud BLOCKED declarada |
| B17 deploy/rollback | `lab/src/capstone_lab/deploy.py`, `evidence/m13/B17/restore-report.json` | 5 (test_deploy.py) | ruff/mypy/pytest ✔ | PASS (health gate, hash do estado idêntico pós-rollback, restore com integridade); Kubernetes/cloud BLOCKED (sem cluster/credenciais) |
| B18 PRR/game day | `lab/src/capstone_lab/prr.py`, `evidence/m13/B18/prr-e-game-day.json` | 5 (test_prr.py) | ruff/mypy/pytest ✔ | PASS com veredito GO (PRR 10/10 evidenciado no disco, game day com injeção real); NO-GO testado como resultado legítimo |
| B19 piloto | `lab/src/capstone_lab/pilot.py`, `evidence/m13/B19/decision-statement.txt` | 6 (test_pilot.py) | ruff/mypy/pytest ✔ | BLOCKED estrutural (sem humano; PilotBlocked impede validação fabricada); kit+scorecard prontos |
| B20 lançamento/defesa | `lab/src/capstone_lab/portfolio.py`, `evidence/m13/B20/release-dossier.md` | 5 (test_portfolio.py) | ruff/mypy/pytest ✔ | PASS (métricas só com evidência no disco, versão via git, scan de sigilo, demo+defesa honestos) |

Blocos do épico 3/4 (B11–B15), mesmos gates (97 testes ao final, 0 falhas):

| Bloco | Artefatos | Testes (n) | Gates | Decisão e causa |
|---|---|---|---|---|
| B11 evals | `lab/src/capstone_lab/evals.py`, `lab/fixtures/evals/*` (3 datasets + baseline) | 8 (test_evals.py) | ruff/mypy/pytest ✔ | PASS (veredito derivado; regressão semeada reprova; flag `passed` ignorada) |
| B12 hardening | `lab/src/capstone_lab/security.py`, `lab/docs/threat-model.md` | 7 (test_security.py) | ruff/mypy/pytest ✔ | PASS (zero P0/P1 aberto; controles em código); scanner SAST/DAST BLOCKED ambiental |
| B13 billing | `lab/src/capstone_lab/billing.py`, `lab/fixtures/billing/webhook_events.json` | 7 (test_billing.py) | ruff/mypy/pytest ✔ | PASS (ledger idempotente, convergência sob duplicado/desordem); Stripe real/test-mode BLOCKED (sem credenciais/rede) |
| B14 observabilidade | `lab/src/capstone_lab/observability.py` | 6 (test_observability.py) | ruff/mypy/pytest ✔ | PASS (traces pai/filho, p95 real, log sanitizado, burn-rate derivado; failure injection dispara alerta) |
| B15 experiência | `lab/src/capstone_lab/webexp.py`, `lab/docs/diataxis/*` | 6 (test_webexp.py) | ruff/mypy/pytest ✔ | PASS (render determinístico, escape, a11y estrutural, Diátaxis 4 tipos); piloto humano fora do ambiente |

Blocos do épico 2/4 (B06–B10), mesmos gates:

| Bloco | Artefatos | Testes (n) | Gates | Decisão e causa |
|---|---|---|---|---|
| B06 retrieval/ACL | `lab/src/capstone_lab/retrieval.py`, `lab/fixtures/retrieval/dataset_v1.json` | 8 (test_retrieval.py) | ruff/mypy/pytest ✔ | PASS (híbrido BM25+tf, ACL antes do scoring, abstenção, Recall/MRR pré-registrados) |
| B07 grafo/métricas | `lab/src/capstone_lab/graph.py` | 9 (test_graph.py) | ruff/mypy/pytest ✔ | PASS (proveniência total, extracted≠inferred, update incremental, golden) |
| B08 model gateway | `lab/src/capstone_lab/models.py` | 7 (test_gateway.py) | ruff/mypy/pytest ✔ | PASS com fake declarado; adapters reais (OpenAI/Anthropic/locais) BLOCKED — sem rede/credenciais |
| B09 agente durável | `lab/src/capstone_lab/agent.py` | 7 (test_agent.py) | ruff/mypy/pytest ✔ | PASS nos mecanismos (estado/budget/checkpoint/resume); LLM real BLOCKED — planner scripted rotulado |
| B10 OpenAPI/MCP/A2A | `lab/src/capstone_lab/contracts.py`, `lab/fixtures/contracts/openapi.v1.golden.json` | 9 (test_contracts.py) + 63 suite | ruff/mypy/pytest ✔ | PASS (spec congelada, RFC 9457, MCP local em processo, A2A mínimo) — sem rede simulada |

Bloqueios adicionais do épico 2/4: adapters de LLM reais (B08) e LLM planner real (B09) — BLOCKED ambiental, causa registrada, fakes/planner explicitamente rotulados.

| Bloco | Artefatos | Testes (n) | Gates | Decisão e causa |
|---|---|---|---|---|
| B01 release contract | `lab/docs/release-contract.md`, `lab/docs/risk-register.md` | 3 (test_release_contract.py) | ruff/mypy/pytest ✔ | PASS (escopo documental + oráculo) |
| B02 baseline | `lab/pyproject.toml`, `lab/uv.lock`, `lab/README.md`, `lab/docker-compose.yml` | 23 (suite completa) | uv sync, ruff, format, mypy, pytest ✔ | PASS no baseline Python; BLOCKED ambiental no Compose (`docker` inexistente, evidência B02) |
| B03 ingestão/job | `lab/src/capstone_lab/ingest.py` | 6 (test_ingest.py) | ruff/mypy/pytest ✔ | PASS (idempotência, cancel, crash-retry, limites) |
| B04 parsers | `lab/src/capstone_lab/parsers.py`, `lab/fixtures/golden/*` (4 fixtures + 4 golden) | 8 (test_parsers.py) | ruff/mypy/pytest ✔ | PASS parcial (AST + MiniLang, corpus 100%, erros medidos); Tree-sitter BLOCKED (binários indisponíveis) |
| B05 dados/migrations | `lab/src/capstone_lab/db.py`, `lab/docs/migrations-design.md` | 6 (test_db.py) | ruff/mypy/pytest ✔ | PASS em SQLite local (forward/rollback, FK, check, escopo tenant); Postgres/RLS BLOCKED (sem Docker/PG) |

Bloqueios honestos: Compose/Docker (B02), Tree-sitter (B04), Postgres/RLS (B05) — causa registrada, nada simulado; blockage entries no risk register (R-01, R-02, R-03).

## Blocos e evidências

| Bloco | Competências | Evidence path | Estado |
|---|---|---|---|
| B01 · release contract | M13-B01-C01..05 | `lab/docs/release-contract.md`, `lab/docs/risk-register.md`, `evidence/m13/B01/` | PASS (20/09/2026) |
| B02 · baseline reproduzível | M13-B02-C01..04 | `lab/`, `uv.lock`, `evidence/m13/B02/` | PASS baseline; Compose BLOCKED ambiental |
| B03 · ingestão/job | M13-B03-C01..05 | `lab/src/capstone_lab/ingest.py`, `evidence/m13/B03/` | PASS (6 testes) |
| B04 · parsing multi-language | M13-B04-C01..06 | `lab/src/capstone_lab/parsers.py`, `lab/fixtures/golden/`, `evidence/m13/B04/` | PASS parcial; Tree-sitter BLOCKED |
| B05 · dados/RLS | M13-B05-C01..05 | `lab/src/capstone_lab/db.py`, `lab/docs/migrations-design.md`, `evidence/m13/B05/` | PASS local; Postgres/RLS BLOCKED |
| B06 · retrieval/ACL | M13-B06-C01..06 | `lab/src/capstone_lab/retrieval.py`, `evidence/m13/B06/` | PASS (21/09/2026, 8 testes) |
| B07 · grafo/métricas | M13-B07-C01..05 | `lab/src/capstone_lab/graph.py`, `evidence/m13/B07/` | PASS (21/09/2026, 9 testes) |
| B08 · model gateway | M13-B08-C01..05 | `lab/src/capstone_lab/models.py`, `evidence/m13/B08/` | PASS parcial (7 testes); adapters reais BLOCKED (sem rede/credenciais) |
| B09 · workflow durável | M13-B09-C01..06 | `lab/src/capstone_lab/agent.py`, `evidence/m13/B09/` | PASS parcial (7 testes); LLM real BLOCKED (planner scripted rotulado) |
| B10 · OpenAPI/MCP/A2A | M13-B10-C01..05 | `lab/src/capstone_lab/contracts.py`, `evidence/m13/B10/` | PASS (21/09/2026, 9 testes + suite 63) |
| B11 · evals | M13-B11-C01..06 | `lab/src/capstone_lab/evals.py`, `lab/fixtures/evals/`, `evidence/m13/B11/` | PASS (21/09/2026, 8 testes) |
| B12 · hardening | M13-B12-C01..06 | `lab/src/capstone_lab/security.py`, `lab/docs/threat-model.md`, `evidence/m13/B12/` | PASS (21/09/2026, 7 testes); scanner externo BLOCKED |
| B13 · billing | M13-B13-C01..05 | `lab/src/capstone_lab/billing.py`, `lab/fixtures/billing/`, `evidence/m13/B13/` | PASS (21/09/2026, 7 testes); Stripe BLOCKED |
| B14 · SRE | M13-B14-C01..06 | `lab/src/capstone_lab/observability.py`, `evidence/m13/B14/` | PASS (21/09/2026, 6 testes) |
| B15 · UX/documentação | M13-B15-C01..06 | `lab/src/capstone_lab/webexp.py`, `lab/docs/diataxis/`, `evidence/m13/B15/` | PASS (21/09/2026, 6 testes) |
| B16 · performance/capacidade | M13-B16-C01..06 | `lab/src/capstone_lab/perf.py`, `evidence/m13/B16/` | PASS (21/09/2026, 7 testes); cloud BLOCKED declarada |
| B17 · deploy/rollback | M13-B17-C01..06 | `lab/src/capstone_lab/deploy.py`, `evidence/m13/B17/` | PASS (21/09/2026, 5 testes); Kubernetes/cloud BLOCKED |
| B18 · PRR/game day | M13-B18-C01..06 | `lab/src/capstone_lab/prr.py`, `evidence/m13/B18/` | PASS (21/09/2026, 5 testes) — veredito GO com NO-GO legítimo |
| B19 · piloto/valor | M13-B19-C01..06 | `lab/src/capstone_lab/pilot.py`, `evidence/m13/B19/` | BLOCKED (sem humano real; estrutural) — kit+scorecard prontos |
| B20 · lançamento/defesa | M13-B20-C01..07 | `lab/src/capstone_lab/portfolio.py`, `evidence/m13/B20/` | PASS (21/09/2026, 5 testes) |

## Acceptance suite

| ID | Área | Estado | Evidence ID planejado |
|---|---|---|---|
| CAP-REP-001 | reprodutibilidade | PENDENTE | EV-REP-001 |
| CAP-ING-001 | ingestão normal | PENDENTE | EV-ING-001 |
| CAP-ING-002 | cancel/retry/crash | PENDENTE | EV-ING-002 |
| CAP-PAR-001 | corpus de duas linguagens | PENDENTE | EV-PAR-001 |
| CAP-PAR-002 | parse parcial/inválido | PENDENTE | EV-PAR-002 |
| CAP-DAT-001 | migrations/rollback | PENDENTE | EV-DAT-001 |
| CAP-TEN-001 | isolamento em data planes | PENDENTE | EV-TEN-001 |
| CAP-RAG-001 | retrieval benchmark | PENDENTE | EV-RAG-001 |
| CAP-RAG-002 | abstenção | PENDENTE | EV-RAG-002 |
| CAP-GRA-001 | grafo/provenance | PENDENTE | EV-GRA-001 |
| CAP-LLM-001 | contract tests de adapters | PENDENTE | EV-LLM-001 |
| CAP-AGT-001 | kill/retomada | PENDENTE | EV-AGT-001 |
| CAP-API-001 | OpenAPI/Problem Details/job | PENDENTE | EV-API-001 |
| CAP-MCP-001 | cliente MCP independente | PENDENTE | EV-MCP-001 |
| CAP-A2A-001 | fluxo A2A delimitado | PENDENTE | EV-A2A-001 |
| CAP-EVL-001 | regressão semeada | PENDENTE | EV-EVL-001 |
| CAP-SEC-001 | catálogo M12 | PENDENTE | EV-SEC-001 |
| CAP-BIL-001 | billing convergente | PENDENTE | EV-BIL-001 |
| CAP-CST-001 | custo/margem | PENDENTE | EV-CST-001 |
| CAP-OBS-001 | correlação sem dado sensível | PENDENTE | EV-OBS-001 |
| CAP-SLO-001 | burn-rate/runbook | PENDENTE | EV-SLO-001 |
| CAP-PRF-001 | carga/capacidade | PENDENTE | EV-PRF-001 |
| CAP-DR-001 | backup/restore | PENDENTE | EV-DR-001 |
| CAP-RBK-001 | canary/rollback | PENDENTE | EV-RBK-001 |
| CAP-UX-001 | primeira jornada | PENDENTE | EV-UX-001 |
| CAP-VAL-001 | tarefa real/piloto | PENDENTE | EV-VAL-001 |
| CAP-DOC-001 | Diátaxis | PENDENTE | EV-DOC-001 |
| CAP-ACC-001 | WCAG 2.2 AA | PENDENTE | EV-ACC-001 |
| CAP-SUP-001 | SBOM/proveniência | PENDENTE | EV-SUP-001 |
| CAP-LCH-001 | claims do lançamento | PENDENTE | EV-LCH-001 |

## Stop conditions

M13 permanece `NO-GO` enquanto existir P0/P1, vazamento cross-tenant, restore/rollback não testado, regressão acima do budget, custo estruturalmente negativo, telemetria sensível, jornada central bloqueada ou claim pública sem evidence ID.
