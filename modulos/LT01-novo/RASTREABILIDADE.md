# Rastreabilidade do LT01

**Data-base:** 14/09/2026 · **Especificação:** [`docs/especificacoes/LT01-ESPECIFICACAO.md`](../../docs/especificacoes/LT01-ESPECIFICACAO.md) · **Estado:** G0 aprovado; B01 produzido (C+L+D)

Um cenário `ESPECIFICADO` possui oráculo planejado; não significa prova.
Só execução reproduzível, revisada pelo orquestrador, promove a `VERIFICADO`.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 12 h (6 blocos) | especificação §2 |
| blocos | 6 (B01–B06 produzidos) | LT01.html |
| cenários B01 | 3 (`LT01-AT-001`–`003`) | especificação §5 |
| execução externa obrigatória | 0 | especificação §1 |

## Cobertura por bloco

| Bloco | Cenários | Estado |
|---|---|---|
| B01 · processo | AT-001–003 | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + CHECKPOINT + ROTEIRO |
| B02 · filesystem | AT-010–012 | CONTEÚDO PRODUZIDO; LAB VERDE (34 passed); DIAGNÓSTICO + CHECKPOINT + ROTEIRO |
| B03 · rede | AT-020–022 | CONTEÚDO PRODUZIDO; LAB VERDE (63 passed, 1 BLOCKED-TLS); DIAGNÓSTICO + CHECKPOINT + ROTEIRO |
| B04 · HTTP | AT-030–032 | CONTEÚDO PRODUZIDO; LAB VERDE (111 passed, 1 skip); DIAGNÓSTICO + CHECKPOINT + ROTEIRO |
| B05 · saturação | AT-040–042, AT-050 | CONTEÚDO PRODUZIDO; LAB VERDE (138 passed, 1 skip); DIAGNÓSTICO + CHECKPOINT + ROTEIRO |
| B06 · incidente | AT-060–061 | CONTEÚDO PRODUZIDO; LAB VERDE (160 passed, 1 skip); DIAGNÓSTICO + CHECKPOINT + ROTEIRO |

## Matriz de cenários B01

| Cenário | Estado | Evidência |
|---|---|---|
| AT-001 | VERIFICADO | lab pytest 4 passed; degrau reproduzido e corrigido |
| AT-002 | VERIFICADO | lab pytest 7 passed; shutdown no grace; bug de handler corrigido com registro |
| AT-003 | VERIFICADO (POSIX) | lab pytest 3 passed; fora de POSIX = BLOCKED registrado |

## Estado dos gates

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0 |
| G1 | **APROVADO** | B01–B06 no padrão, revisados pelo orquestrador |
| G2 | PARCIAL (B01–B06 verdes) | ruff, mypy strict, 160 passed + 1 skip, stdlib; além-localhost bloqueado por desenho |
| G3 | **APROVADO** | checkpoints B01–B06 com rubrica + oráculos executados |
| G4 | PARCIAL | CPU-only portável; Windows/POSIX com BLOCKED honesto |
| G5 | PARCIAL | cleanup/timeout/filhos possuídos com oráculos; produção além do recorte bloqueada |
| G6 | PENDENTE | tags/âncoras/links/CSS/print verificados; serve 200; visual interativo pendente |

## Lote LT01-B01 — 14/09/2026 (C+L+D, protocolo econômico)
HTML novo com B01 + scaffolding B02–B06; lab com 3 módulos + 14 testes; bug latente de handler corrigido com registro (override mypy removido); roteiro do lab guiado publicado. Correção do orquestrador com registro. `STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md`: PROGRESSO intacto.

## Lote LT01-B02 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria B02 + 3 módulos verbatim + 20 testes (gate 34 passed); roteiro estendido (FDs/paths/confinamento). Sem gate. PROGRESSO intacto.

## Lote LT01-B02 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria B02 + 3 módulos verbatim + 20 testes (gate 34 passed); roteiro estendido (FDs/paths/confinamento). Sem gate. PROGRESSO intacto.

## Lote LT01-B03 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria B03 + 3 módulos verbatim + 29 testes (gate 63 passed, 1 skip BLOCKED-TLS); roteiro estendido. Correção do orquestrador: E501/SIM117 sem ignores — assinatura e with-parentético emendados no lab e no HTML. Sem gate. PROGRESSO intacto.

## Lote LT01-B04 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria B04 + 3 módulos verbatim + 48 testes (gate 111 passed, 1 skip); roteiro estendido. Correção do orquestrador: sem ignores — TypeVar→PEP 695, import time removido, assinaturas no estilo do format, HTML espelhado (3/3 VERBATIM programático). Sem gate. PROGRESSO intacto.

## Lote LT01-B05 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria B05 + 3 módulos + 27 testes (gate 138 passed, 1 skip); roteiro estendido. Correção do orquestrador: RUF002 sem ignores (×→x no lab e no HTML). Sem gate. PROGRESSO intacto.

## Lote LT01-B06 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria B06 + 3 módulos + 22 testes (gate 160 passed, 1 skip); roteiro estendido. Correção do orquestrador: sem ignores — SIM102 combinado, assinaturas no estilo do format, HTML espelhado (3/3 VERBATIM programático). Sem gate. PROGRESSO intacto.

## Lote LT01-E — 14/09/2026 (QA + gates, direto)
TOC com âncoras; CSS foco + tabelas ≤640px; serve 200 (243 KB); 0 erros. Decisão: **G1/G3 APROVADOS; G2/G4/G5 PARCIAIS; G6 PENDENTE**. PROGRESSO intacto.
