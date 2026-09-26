# Rastreabilidade do LT03

**Data-base:** 14/09/2026 · **Especificação:** [`docs/especificacoes/LT03-ESPECIFICACAO.md`](../../docs/especificacoes/LT03-ESPECIFICACAO.md) · **Estado:** G0 aprovado; B01–B06 produzidos (C+L+D); E final executado 21/09/2026

Um cenário `ESPECIFICADO` possui oráculo planejado; não significa prova.
Só execução reproduzível, revisada pelo orquestrador, promove a `VERIFICADO`.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 12 h (6 blocos) | especificação §2 |
| blocos | 6 (B01–B06 produzidos; E final executado) | LT03.html |
| cenários B01 | 3 (`LT03-AT-001`–`003`) | especificação §5 |
| cenários B02 | 5 (`LT03-AT-010`–`014`) | especificação §5 |
| cenários B03 | 6 (`LT03-AT-020`–`025`) | especificação §5 |
| cenários B04 | 5 (`LT03-AT-030`–`034`) | especificação §5 |
| cenários B05 | 4 (`LT03-AT-040`–`043`) | especificação §5 |
| cenários B06 | 6 (`LT03-AT-050`–`053`, `060`–`061`) | especificação §5 |
| execução externa obrigatória | build/push/run (Docker), cluster (kind), binários IaC/GitOps | especificação §1 |

## Cobertura por bloco

| Bloco | Cenários | Estado |
|---|---|---|
| B01 · OCI | AT-001–003 | CONTEÚDO PRODUZIDO; LAB VERDE (14 passed); DIAGNÓSTICO + CHECKPOINT + ROTEIRO |
| B02 · Workloads/rede | AT-010–014 | CONTEÚDO PRODUZIDO; LAB VERDE (25 passed); DIAGNÓSTICO + CHECKPOINT + ROTEIRO; E501 verbatim CORRIGIDO código+HTML no lote Tier 1 |
| B03 · Probes/escala | AT-020–025 | CONTEÚDO PRODUZIDO; LAB VERDE (17 passed); DIAGNÓSTICO 4 + CHECKPOINT 3 + ROTEIRO; bloco HTML 182 linhas |
| B04 · IaC | AT-030–034 | CONTEÚDO PRODUZIDO; LAB VERDE (8 passed); DIAGNÓSTICO 4 + CHECKPOINT 3 + ROTEIRO; bloco HTML 166 linhas |
| B05 · GitOps | AT-040–043 | CONTEÚDO PRODUZIDO; LAB VERDE (8 passed); DIAGNÓSTICO 4 + CHECKPOINT 3 + ROTEIRO; bloco HTML 147 linhas |
| B06 · Canary | AT-050–053, 060–061 | CONTEÚDO PRODUZIDO; LAB VERDE (9 passed); DIAGNÓSTICO 4 + CHECKPOINT 3 + ROTEIRO; bloco HTML 146 linhas |

## Matriz de cenários B01

| Cenário | Estado | Evidência |
|---|---|---|
| AT-001 | VERIFICADO | Dockerfile validado (non-root, mínima, digest, sem segredo) |
| AT-002 | VERIFICADO | drenagem com grace e exit code |
| AT-003 | VERIFICADO | tabela de decisão |

## Estado dos gates

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0 |
| G1 | **APROVADO** | teoria B01–B06 + diagnósticos + checkpoints com rubrica + fontes |
| G2 | PARCIAL | ruff+format+mypy strict+81 passed stdlib; Docker/registry/cluster/kind BLOCKED |
| G3 | **APROVADO** | checkpoint por cenário (5+5+3+3+3+3 perguntas), casos negativos, rubricas 0–2 |
| G4 | PARCIAL | Python canônico stdlib, dicts puros, adapters rotulados; sem stack externa |
| G5 | PARCIAL | grace/cancelamento/TTL/guardas cobertos no escopo; sem cluster real |
| G6 | PENDENTE | TOC/âncoras (25 ids, 0 quebradas), CSS foco+tabelas, serve 200 OK; falta revisão visual comparativa com M00 |

## Lote LT03-B01 — 14/09/2026 (C+L+D, protocolo econômico)
HTML novo com B01 + scaffolding; lab com 2 módulos + 14 testes; roteiro publicado. Sem gate. PROGRESSO intacto.

## Lote LT03-B02 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria B02 + 2 módulos + 25 testes (gate 39 passed); roteiro estendido. Correção do orquestrador: E501 sem ignore (quebra de linha em lab e HTML; 2/2 VERBATIM). Sem gate. PROGRESSO intacto.

## MEGA-LOTE Tier 1 (B03, B04, B05, B06 + E) — 21/09/2026 (sequencial pelo DAG)
B03-C→L→D→B04-C→L→D→B05-C→L→D→B06-C→L→D→E em sessão única, ownership exclusivo de modulos/LT03-novo/. 4 módulos + 12 testes novos (81 passed totais); blocos HTML 182/166/147/146 linhas (≤200); verbatim byte-idêntico nos 4; E501 herdado do B02 eliminado por reestruturação código+HTML (tem_pedido/tem_teto; check+format verdes, verbatim preservado). E final: TOC com diagnósticos/checkpoints/fontes por bloco, CSS foco+tabelas presente, serve 200, 25 âncoras sem quebra, lab-guiado B01-L–B06-L, evidence/b03–b06-gates.txt. BLOCKEDs: Docker/registry (build/push/run), cluster/kind (converge observado, rede real, Flux, tráfego canary), binários IaC (tofu) — todos registrados, nada simulado. Fora de modulos/LT03-novo/: nada tocado (sem spec/trace-alheia/STATUS/PROGRESSO). Decisão de gates: G1/G3 APROVADOS, G2/G4/G5 PARCIAIS, G6 PENDENTE (falta revisão visual vs M00).
