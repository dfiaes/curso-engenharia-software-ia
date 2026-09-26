# Rastreabilidade do M09

**Data-base:** 14/09/2026 · **Especificação:** [`docs/especificacoes/M09-ESPECIFICACAO.md`](../../docs/especificacoes/M09-ESPECIFICACAO.md) · **Estado:** G0 aprovado; G1 em produção

Um cenário `ESPECIFICADO` possui oráculo planejado; não significa prova.
Só execução reproduzível, revisada pelo orquestrador, promove a `VERIFICADO`.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 14 h | especificação §2 |
| blocos | 7 | especificação §4 |
| cenários | 14 (`M09-AT-001`–`014`) | especificação §5 |
| fontes | 4 | especificação §6 |
| produto | servidor + cliente + agente A2A locais | especificação §1 e §3 |
| execução externa obrigatória | 0 | especificação §1 |

## Cobertura por bloco

| Bloco | Competência verificável | Cenários | Saída planejada | Estado |
|---|---|---|---|---|
| B01 · por que protocolo | N×M, arquitetura | — (contexto) | conta + diagrama | CONTEÚDO PRODUZIDO |
| B02 · primitivas | discovery, schema, capability | AT-001–006,008,010 | primitivas | CONTEÚDO PRODUZIDO; LAB VERDE |
| B03 · transportes | 3 bindings, MRTR, replay | AT-009–012 | paridade | CONTEÚDO PRODUZIDO; LAB VERDE |
| B04 · servidor | granularidade, escopo, erro | AT-002/004/007 | servidor | CONTEÚDO PRODUZIDO; LAB VERDE |
| B05 · distribuição | empacotar, consumir, auth | AT-012 | cliente B | CONTEÚDO PRODUZIDO; LAB VERDE |
| B06 · A2A | card, task, estados | AT-013–014 | ciclo de vida | CONTEÚDO PRODUZIDO; LAB VERDE |
| B07 · segurança | ataques, checklist | AT-007/008/011 | negações | CONTEÚDO PRODUZIDO; LAB VERDE |

## Matriz de cenários

| Família | Cenários | Estado atual | Condição para promoção |
|---|---|---|---|
| descoberta e schema | AT-001–006 | ORÁCULOS VERDES | lista + call + erros |
| autorização | AT-007–008 | ORÁCULOS VERDES | deny por escopo/capability |
| robustez | AT-009–011 | ORÁCULOS VERDES | timeout/replay/MRTR |
| transportes | AT-010/012 | ORÁCULOS VERDES | versão + 3 bindings reais |
| A2A | AT-013–014 | ORÁCULOS VERDES | ciclo + recusa |

## Estado dos gates

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0, 14 ATs, fontes, lab local e limites |
| G1 | EM PRODUÇÃO (revisão aplicada, avaliação pendente) | B01–B07 sem stack prévia, sem relógios, práticas no lab guiado, fontes por bloco |
| G2 | PARCIAL (local completo) | `lab/` verde: ruff, mypy strict, 19 passed, com subprocesso e HTTP reais |
| G3 | PENDENTE (material pronto) | checkpoint P1–P9 por cenário; sem execução de avaliação |
| G4 | PENDENTE | invariantes/adapters separados; portabilidade não exercitada além do local |
| G5 | PENDENTE | token/Origin/escopo com oráculos; sem rede pública por desenho |
| G6 | PENDENTE | estrutura/links validados; QA visual 390px/impressão pendente |

## Auditoria do artefato anterior

| Achado | Impacto | Tratamento planejado |
|---|---|---|
| 7 caixas "Tradução .NET" + exemplos C#/Azure | pré-requisito indevido | explicação direta |
| 7 `clock` + 7 práticas com tempo no corpo | ritual, leitura interrompida | remover; prática só no lab guiado |
| refs a trabalho/Capstone-no-ar/conta externa | obrigação/recorte indevido | remover; capstone e SDK via trilhas próprias |
| zero seção de fontes | claims sem auditabilidade | fontes por bloco + matriz |

## Próximo lote

**M09 fechado no executável.** Falta, fora do alcance deste ambiente:
QA visual G6, revisão do orquestrador para G1–G6 e trilha externa
(SDKs, Docker, hospedagem). Pela fila do status, a próxima unidade é
**M10-S** (escopo e rastreabilidade do M10).

## Lote M09 — 14/09/2026 (M09-S/C/L/D/E)

Execução real (CPython 3.14.7, `uv sync --frozen`): `ruff check` e
`ruff format --check` aprovados; `mypy --strict` sem achados (12 arquivos);
`pytest -q`: **19 passed**, com subprocesso stdio e HTTP localhost reais.
Evidência em `lab/evidence/m09-gates.txt`. Nenhum cenário promovido a
VERIFICADO; nenhum gate promovido. Revisão do orquestrador pendente;
`STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md` não alterados.

## Revisão E — 14/09/2026 (orquestrador, protocolo econômico)
Lab re-executado: ruff/format/mypy-strict (12 arqs) verdes; pytest 19 passed (transports reais locais: stdio + HTTP stdlib, sem rede pública); Python 3.14.7. HTML: 0 erros, 0 legadas; 11 h2 (8 com id); TOC 8 âncoras; Fontes global (sem seção por bloco — lacuna G1). Serve 200. Âncoras diagnostico/checkpoint/fontes adicionadas. Limites: sem QA visual device, sem portabilidade além do local, conformidade total/SDK na trilha externa. G2 re-verificado; demais gates inalterados.

E-QA complementar (orquestrador): regra `:focus-visible` explícita + rolagem horizontal de tabelas ≤640px aplicadas no CSS (padrão M00/M11); sem `outline:none` em nenhum módulo (foco visível por padrão). M06 TOC convertido para âncoras; ids diagnostico/checkpoint/fontes adicionados.
