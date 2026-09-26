# Rastreabilidade do LT02

**Data-base:** 14/09/2026 · **Especificação:** [`docs/especificacoes/LT02-ESPECIFICACAO.md`](../../docs/especificacoes/LT02-ESPECIFICACAO.md) · **Estado:** G0 aprovado; B01 produzido (C+L+D)

Um cenário `ESPECIFICADO` possui oráculo planejado; não significa prova.
Só execução reproduzível, revisada pelo orquestrador, promove a `VERIFICADO`.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 12 h (6 blocos) | especificação §2 |
| blocos | 6 (B01 produzido; B02–B06 em scaffolding) | LT02.html |
| cenários B01 | 3 (`LT02-AT-001`–`003`) | especificação §5 |
| execução externa obrigatória | 0 (broker real = demonstração externa) | especificação §1 |

## Cobertura por bloco

| Bloco | Cenários | Estado |
|---|---|---|
| B01 · falha parcial | AT-001–003 | CONTEÚDO PRODUZIDO; LAB VERDE (18 passed, 1 skip); DIAGNÓSTICO + CHECKPOINT + ROTEIRO |
| B02–B06 | AT-010–015, 020–024, 030–033, 040–043, 050, 060–061 | ESPECIFICADO (scaffolding no HTML) |

## Matriz de cenários B01

| Cenário | Estado | Evidência |
|---|---|---|
| AT-001 | VERIFICADO | partição controlada com ledger por intenção |
| AT-002 | VERIFICADO | timeout como estado desconhecido, nunca veredito |
| AT-003 | VERIFICADO | decisão CAP/PACELC por requisito reproduzível |

## Estado dos gates

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0 |
| G1 | **APROVADO** | B01–B06 no padrão, revisados pelo orquestrador |
| G2 | PARCIAL (B01–B06 verdes) | ruff, mypy strict, 87 passed + 1 skip, stdlib; broker/PG BLOCKED |
| G3 | **APROVADO** | checkpoints B01–B06 com rubrica + oráculos executados |
| G4 | PARCIAL | portas/protocolos separados; CPU-only portável; broker/PG live bloqueados |
| G5 | PARCIAL | cleanup/timeout/recursos possuídos com oráculos; live bloqueado |
| G6 | PENDENTE | tags/âncoras/links/CSS/print verificados; serve 200; visual interativo pendente |

## Lote LT02-B01 — 14/09/2026 (C+L+D, protocolo econômico)
HTML novo com B01 + scaffolding B02–B06; lab com 3 módulos + 18 testes + 1 skip BLOCKED; bug @dataclass corrigido com registro + import duplicado removido (3/3 VERBATIM programático); roteiro publicado. Correção do orquestrador com registro. PROGRESSO intacto.

## Lote LT02-B02 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria B02 + 3 módulos + 23 testes (gate 41 passed, 1 skip); roteiro estendido; sem ignores. Sem gate. PROGRESSO intacto.

## Lote LT02-B03 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria B03 + 4 módulos + 11 testes (gate 52 passed, 1 skip); roteiro estendido. Correção do orquestrador: SIM117 sem ignores — 4 `with` combinados em lab e HTML (VERBATIM programático 4/4). Sem gate. PROGRESSO intacto.

## Lote LT02-B04 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria B04 + 4 módulos + 8 testes (gate 60 passed, 1 skip); roteiro estendido. Correção do orquestrador: no-any-return com anotação em lab e HTML (4/4 VERBATIM programático). Sem gate. PROGRESSO intacto.

## Lote LT02-B05 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria B05 + 4 módulos + 10 testes (gate 70 passed, 1 skip); roteiro estendido. Correção do orquestrador: F841/SIM117/format sem ignores — código + HTML espelhados (4/4 VERBATIM programático). Sem gate. PROGRESSO intacto.

## Lote LT02-B06 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria B06 + 4 módulos verbatim + 17 testes (gate 87 passed, 1 skip); roteiro estendido. Zero divergência. Sem gate. PROGRESSO intacto.

## Lote LT02-E — 14/09/2026 (QA + gates, direto)
QA: 7/7 h2 com id, 10 âncoras, foco/tabelas/print/lang verificados, serve 200 (241 KB), 0 erros. Decisão: **G1/G3 APROVADOS; G2/G4/G5 PARCIAIS; G6 PENDENTE**. PROGRESSO intacto.
