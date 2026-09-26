# Rastreabilidade do M08

**Data-base:** 14/09/2026 · **Especificação:** [`docs/especificacoes/M08-ESPECIFICACAO.md`](../../docs/especificacoes/M08-ESPECIFICACAO.md) · **Estado:** G0 aprovado; G1 em produção

Um cenário `ESPECIFICADO` possui oráculo planejado; não significa prova.
Só execução reproduzível, revisada pelo orquestrador, promove a `VERIFICADO`.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 16 h | especificação §2 |
| blocos | 8 | especificação §4 |
| cenários | 14 (`M08-AT-001`–`014`) | especificação §5 |
| fontes | 4 | especificação §6 |
| produto | agente investigador local | especificação §1 e §3 |
| execução externa obrigatória | 0 | especificação §1 |

## Cobertura por bloco

| Bloco | Competência verificável | Cenários | Saída planejada | Estado |
|---|---|---|---|---|
| B01 · critério | workflow×agente, 3 perguntas | AT-001 | classificação | CONTEÚDO PRODUZIDO; LAB VERDE |
| B02 · padrões | 5 padrões compostáveis | AT-002–003 | composição | CONTEÚDO PRODUZIDO; LAB VERDE |
| B03 · tools | design, erro, escopo | AT-004–005 | eval de tools | CONTEÚDO PRODUZIDO; LAB VERDE |
| B04 · contexto | orçamento, compactação | AT-006–007 | composição medida | CONTEÚDO PRODUZIDO; LAB VERDE |
| B05 · loop | 7 paradas, parcial, HITL | AT-008–010 | motivos demonstrados | CONTEÚDO PRODUZIDO; LAB VERDE |
| B06 · memória/multi | fato, invalidação, subagente | AT-011–012 | ciclo com validade | CONTEÚDO PRODUZIDO; LAB VERDE |
| B07 · frameworks | panorama, critério, ADR | AT-013 | ADR com gatilho | CONTEÚDO PRODUZIDO |
| B08 · investigador | pipeline, comparação | AT-014 | tabela com números | CONTEÚDO PRODUZIDO; LAB VERDE |

## Matriz de cenários

| Família | Cenários | Estado atual | Condição para promoção |
|---|---|---|---|
| critério | AT-001 | ORÁCULOS VERDES | classificação justificada |
| padrões | AT-002–003 | ORÁCULOS VERDES | composição executada |
| ferramentas | AT-004–005 | ORÁCULOS VERDES | recusa + truncamento |
| contexto | AT-006–007 | ORÁCULOS VERDES | medição + compactação |
| loop | AT-008–010 | ORÁCULOS VERDES | 7 motivos + parcial + HITL |
| memória | AT-011–012 | ORÁCULOS VERDES | validade + resumo |
| decisão | AT-013–014 | CONTEÚDO PRODUZIDO | ADR + comparação (modelo real externo) |

## Estado dos gates

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0, 14 ATs, fontes, lab local e limites |
| G1 | EM PRODUÇÃO (revisão aplicada, avaliação pendente) | B01–B08 sem stack prévia, sem relógios, práticas no lab guiado, fontes por bloco |
| G2 | PARCIAL (offline completo) | `lab/` verde: ruff, mypy strict, 15 passed; modelo real externo por desenho |
| G3 | PENDENTE (material pronto) | checkpoint P1–P9 por cenário; sem execução de avaliação |
| G4 | PENDENTE | invariantes/adapters separados; portabilidade não exercitada além do local |
| G5 | PENDENTE | custo/tempo como orçamento testável; sem rede por desenho |
| G6 | PENDENTE | estrutura/links validados; QA visual 390px/impressão pendente |

## Auditoria do artefato anterior

| Achado | Impacto | Tratamento planejado |
|---|---|---|
| 7 caixas "Tradução .NET" + ponte .NET/carreira | pré-requisito e desvio indevidos | explicação direta; panorama sem ponte |
| 8 `clock` + 7 práticas com tempo no corpo | ritual, leitura interrompida | remover; prática só no lab guiado |
| refs a trabalho .NET/PROGRESSO/Capstone-no-ar | obrigação/recorte indevido | remover; capstone via spec própria |
| zero seção de fontes | claims sem auditabilidade | fontes por bloco + matriz |

## Próximo lote

**M08 fechado no executável.** Falta, fora do alcance deste ambiente:
QA visual G6, revisão do orquestrador para G1–G6 e trilha com modelos
reais/frameworks. Pela fila do status, a próxima unidade é **M09-S**
(escopo e rastreabilidade do M09).

## Lote M08 — 14/09/2026 (M08-S/C/L/D/E)

Execução real (CPython 3.14.7, `uv sync --frozen`): `ruff check` e
`ruff format --check` aprovados; `mypy --strict` sem achados (10 arquivos);
`pytest -q`: **15 passed**, zero dependência externa. A construção
acusou e corrigiu erro de sintaxe, imports e assinaturas antes do verde.
Evidência em `lab/evidence/m08-gates.txt`. Nenhum cenário promovido a
VERIFICADO; nenhum gate promovido. Revisão do orquestrador pendente;
`STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md` não alterados.

## Revisão E — 14/09/2026 (orquestrador, protocolo econômico)
Lab re-executado: ruff/format/mypy-strict (10 arqs) verdes; pytest 15 passed (fake local, sem rede/modelo); Python 3.14.7. HTML: 0 erros, 0 legadas; 12 h2 (9 com id); TOC 9 âncoras; Fontes global (sem seção por bloco — lacuna G1); Checkpoint M08 + Diagnóstico presentes. Serve 200. Âncoras diagnostico/checkpoint/fontes adicionadas. Limites: sem QA visual device, sem rede real, modelo real/frameworks externos na trilha externa. G2 re-verificado; demais gates inalterados.

E-QA complementar (orquestrador): regra `:focus-visible` explícita + rolagem horizontal de tabelas ≤640px aplicadas no CSS (padrão M00/M11); sem `outline:none` em nenhum módulo (foco visível por padrão). M06 TOC convertido para âncoras; ids diagnostico/checkpoint/fontes adicionados.
