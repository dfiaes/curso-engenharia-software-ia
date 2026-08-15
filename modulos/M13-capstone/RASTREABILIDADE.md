# Rastreabilidade da regeneração M13

**Atualizado em:** 14/08/2026 · **Estado:** EM PRODUÇÃO · **Gate:** G0 APROVADO

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
| R2.2-A | B01–B02 | release contract, trace matrix, risk register e baseline reproduzível | PARCIAL: gates Python OK; Docker bloqueia B02 |
| R2.2-B | B03–B07 | ingestão, parsers, dados/RLS, retrieval e grafo | PENDENTE |
| R2.2-C | B08–B10 | gateway de modelos, workflow e OpenAPI/MCP/A2A | PENDENTE |
| R2.2-D | B11–B14 | evals, segurança, billing e SRE | PENDENTE |
| R2.2-E | B15–B17 | experiência, performance, deploy e rollback | PENDENTE |
| R2.2-F | B18–B20 | PRR, game day, piloto, lançamento e defesa | PENDENTE |

## Blocos e evidências

| Bloco | Competências | Evidence path | Estado |
|---|---|---|---|
| B01 · release contract | M13-B01-C01..05 | `capstone/docs/release-contract.md`, trace CSV e risk register | PRODUZIDO / revisão final pendente |
| B02 · baseline reproduzível | M13-B02-C01..04 | workspace, lockfile, Compose, Dockerfile, migration e seed | PARCIAL: 6 testes/Ruff/mypy OK; container pendente |
| B03 · ingestão/job | M13-B03-C01..05 | `capstone/evidence/m13/B03/` | PENDENTE |
| B04 · parsing multi-language | M13-B04-C01..06 | `capstone/evidence/m13/B04/` | PENDENTE |
| B05 · dados/RLS | M13-B05-C01..05 | `capstone/evidence/m13/B05/` | PENDENTE |
| B06 · retrieval/ACL | M13-B06-C01..06 | `capstone/evidence/m13/B06/` | PENDENTE |
| B07 · grafo/métricas | M13-B07-C01..05 | `capstone/evidence/m13/B07/` | PENDENTE |
| B08 · model gateway | M13-B08-C01..05 | `capstone/evidence/m13/B08/` | PENDENTE |
| B09 · workflow durável | M13-B09-C01..06 | `capstone/evidence/m13/B09/` | PENDENTE |
| B10 · OpenAPI/MCP/A2A | M13-B10-C01..05 | `capstone/evidence/m13/B10/` | PENDENTE |
| B11 · evals | M13-B11-C01..06 | `capstone/evidence/m13/B11/` | PENDENTE |
| B12 · hardening | M13-B12-C01..06 | `capstone/evidence/m13/B12/` | PENDENTE |
| B13 · billing | M13-B13-C01..05 | `capstone/evidence/m13/B13/` | PENDENTE |
| B14 · SRE | M13-B14-C01..06 | `capstone/evidence/m13/B14/` | PENDENTE |
| B15 · UX/documentação | M13-B15-C01..06 | `capstone/evidence/m13/B15/` | PENDENTE |
| B16 · performance/capacidade | M13-B16-C01..06 | `capstone/evidence/m13/B16/` | PENDENTE |
| B17 · deploy/rollback | M13-B17-C01..06 | `capstone/evidence/m13/B17/` | PENDENTE |
| B18 · PRR/game day | M13-B18-C01..06 | `capstone/evidence/m13/B18/` | PENDENTE |
| B19 · piloto/valor | M13-B19-C01..06 | `capstone/evidence/m13/B19/` | PENDENTE |
| B20 · lançamento/defesa | M13-B20-C01..07 | `capstone/evidence/m13/B20/` | PENDENTE |

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
