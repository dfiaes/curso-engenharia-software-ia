# Rastreabilidade do LT04 — Prévia Editorial Tier 1

**Data-base:** 26/09/2026 · **Especificação:** [`docs/especificacoes/LT04-ESPECIFICACAO.md`](../../docs/especificacoes/LT04-ESPECIFICACAO.md) · **Estado:** PRÉVIA_EDITORIAL para B01–B06 Tier 1; certificação v4 permanece separada

Um cenário `ESPECIFICADO` possui oráculo planejado; não significa prova.
Só execução reproduzível, revisada pelo orquestrador, promove a `VERIFICADO`.

## Divergência registrada (escopo Tier 1 vs spec §4)

A spec §4 define B01 estratégia de testes, B02 performance/IA, B03 SBOM/provenance,
B04 secure SDLC, B05 governança e B06 readiness (34 cenários LT04-AT-001..061).
Este recorte executa a fatia de engenharia de release — versionamento, gates,
rollback, sinais, comunicação, pós-mortem — a mais próxima do spec B06 e dos
gates Q1–Q7. Os 34 cenários da spec permanecem ESPECIFICADOS salvo pontes
parciais abaixo; nenhum gate da spec é promovido além do declarado aqui.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| blocos Tier 1 | 6 (B01–B06 produzidos; E final executado) | LT04.html |
| cenários Tier 1 | 18 (`LT04-T1-AT-001`–`003`, `010`–`012`, `020`–`022`, `030`–`032`, `040`–`042`, `050`–`052`) | lab/tests + evidence |
| linhas por bloco HTML | 134/130/120/126/119/125 (teto 200) | LT04.html |
| verbatim HTML↔lab | 6/6 byte-idênticos (diff via html.unescape) | folhas B01-L–B06-L |
| execução externa obrigatória | release/deploy real, registry, carga, cloud, GPU | spec §1 (BLOCKED) |

## Cobertura por bloco

| Bloco | Cenários | Estado |
|---|---|---|
| B01 · versionamento/changelog | AT-001–003 | CONTEÚDO PRODUZIDO; LAB VERDE (5 passed); DIAGNÓSTICO 4 + CHECKPOINT 3 + ROTEIRO |
| B02 · gates de release | AT-010–012 | CONTEÚDO PRODUZIDO; LAB VERDE (7 passed); DIAGNÓSTICO 4 + CHECKPOINT 3 + ROTEIRO; mypy-invariância e format CORRIGIDOS código+HTML |
| B03 · rollback/restauração | AT-020–022 | CONTEÚDO PRODUZIDO; LAB VERDE (5 passed); DIAGNÓSTICO 4 + CHECKPOINT 3 + ROTEIRO; format+typo CORRIGIDOS código+HTML |
| B04 · observabilidade | AT-030–032 | CONTEÚDO PRODUZIDO; LAB VERDE (4 passed); DIAGNÓSTICO 4 + CHECKPOINT 3 + ROTEIRO |
| B05 · comunicação | AT-040–042 | CONTEÚDO PRODUZIDO; LAB VERDE (4 passed); DIAGNÓSTICO 4 + CHECKPOINT 3 + ROTEIRO; format+invariância CORRIGIDOS código+HTML |
| B06 · pós-mortem | AT-050–052 | CONTEÚDO PRODUZIDO; LAB VERDE (3 passed); DIAGNÓSTICO 4 + CHECKPOINT 3 + ROTEIRO; format CORRIGIDO código+HTML |

## Matriz de cenários Tier 1 (com pontes à spec)

| Cenário | Estado | Evidência | Ponte spec |
|---|---|---|---|
| AT-001 SemVer/ordem | VERIFICADO | pytest 5 passed; 6 recusas | — |
| AT-002 changelog | VERIFICADO | data/ordem acusadas por posição | — |
| AT-003 digest | VERIFICADO | tag/digest ruins → ValueError | parcial LT04-AT-023 |
| AT-010 gate fechado | VERIFICADO | sem evidência → reprovado nomeado | parcial LT04-AT-050 |
| AT-011 veto P0/P1 | VERIFICADO | NO-GO com motivo | parcial LT04-AT-051 |
| AT-012 condicional | VERIFICADO | 3 ausências vetam; completo → CONDITIONAL | parcial LT04-AT-052 |
| AT-020 stop | VERIFICADO | violações em ordem; vazio segue | parcial LT04-AT-012 |
| AT-021 rollback | VERIFICADO | anterior por digest; sem anterior → erro | parcial LT04-AT-053 |
| AT-022 restore | VERIFICADO | 3 eixos, cada um isolado | parcial LT04-AT-061 |
| AT-030 cauda | VERIFICADO | media 54.5 vs p99 900, n=100 | parcial LT04-AT-010 |
| AT-031 dado ausente | VERIFICADO | vazio/total-zero → ValueError | — |
| AT-032 slices | VERIFICADO | busca acusada; agregado não absolve | parcial LT04-AT-013 |
| AT-040 tiers | VERIFICADO | matriz exata; desconhecido → erro | — |
| AT-041 bloqueio | VERIFICADO | ausência veta | parcial LT04-AT-051 |
| AT-042 reprodução | VERIFICADO | digest/brutos/claims, 3 negações | parcial LT04-AT-054 |
| AT-050 registro | VERIFICADO | ausências acusadas nominalmente | — |
| AT-051 ação | VERIFICADO | 4 variantes acusadas | — |
| AT-052 waiver | VERIFICADO | vencida/sem dono bloqueiam | parcial LT04-AT-033 |

Spec LT04-AT-001..009, 011, 014, 015, 020..022, 024, 025, 030..032, 034, 040..044, 060: NÃO COBERTOS (ESPECIFICADOS).

## Estado dos gates (recorte Tier 1)

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0 (spec) |
| G1 | **APROVADO** | teoria B01–B06 no padrão Tier 1 (N1–N4 + diagnóstico + checkpoint + fontes) |
| G2 | PARCIAL | ruff+format+mypy strict+28 passed stdlib; release/deploy/carga/cloud/GPU BLOCKED |
| G3 | **APROVADO** | checkpoint por cenário (3+3+3+3+3+3 perguntas), casos negativos, rubricas 0–2 |
| G4 | PARCIAL | Python canônico stdlib, dicts puros, adapters rotulados; sem stack externa |
| G5 | PARCIAL | stop/rollback/restore/waiver cobertos no escopo; sem produção real |
| G6 | PENDENTE | TOC/âncoras, CSS foco+tabelas, serve 200; falta revisão visual comparativa com M00 |

## Lote LT04-T1-B01 — 21/09/2026 (C+L+D, Tier 1)

HTML novo (head+CSS+TOC+B01, 134 linhas) + `versao_release.py` + 5 testes;
suite 5 passed; verbatim 1/1. Fora de modulos/LT04-novo/: nada tocado.

## Lote LT04-T1-B02 — 21/09/2026 (C+L+D, Tier 1)

Teoria B02 (130 linhas) + `gates_release.py` + 7 testes (gate 12 passed);
verbatim 2/2. Correções sem ignores: format (retorno/_invalido/assinatura) e
mypy-invariância espelhados código+HTML. Sem gate. Fora: nada tocado.

## Lote LT04-T1-B03 — 21/09/2026 (C+L+D, Tier 1)

Teoria B03 (120 linhas) + `rollback_release.py` + 5 testes (gate 17 passed);
verbatim 3/3. Correções: format (reverter/restauracao_ok) e typo espelhados.
Sem gate. Fora: nada tocado.

## Lote LT04-T1-B04 — 21/09/2026 (C+L+D, Tier 1)

Teoria B04 (126 linhas) + `sinais_release.py` + 4 testes (gate 21 passed);
verbatim 4/4. Melhoria: percentil via math.ceil (stdlib). Sem gate. Fora: nada.

## Lote LT04-T1-B05 — 21/09/2026 (C+L+D, Tier 1)

Teoria B05 (119 linhas) + `comunicar_release.py` + 4 testes (gate 25 passed);
verbatim 5/5. Correções: format (reproducao_ok) e invariância espelhados.
Sem gate. Fora: nada tocado.

## Lote LT04-T1-B06 — 21/09/2026 (C+L+D, Tier 1)

Teoria B06 (125 linhas) + `posmortem_release.py` + 3 testes (gate 28 passed);
verbatim 6/6. Correção: format (waiver_valida) espelhado. Sem gate. Fora: nada.

## E final — 21/09/2026 (QA + gates)

TOC com diagnósticos/checkpoints/fontes por bloco; CSS foco + tabelas ≤640px;
serve 200; âncoras sem quebra; lab-guiado B01-L–B06-L; evidence/b01–b06-gates.txt.
BLOCKEDs: release/deploy real, registry, carga/tráfego, cloud, GPU — registrados,
nada simulado. Fora de modulos/LT04-novo/: nada tocado (sem spec/STATUS/PROGRESSO).
Decisão: **G1/G3 APROVADOS; G2/G4/G5 PARCIAIS; G6 PENDENTE** (falta visual vs M00).
