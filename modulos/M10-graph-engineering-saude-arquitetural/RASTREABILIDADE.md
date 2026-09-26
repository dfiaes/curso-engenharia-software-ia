# Rastreabilidade do M10

**Data-base:** 14/09/2026 · **Especificação:** [`docs/especificacoes/M10-ESPECIFICACAO.md`](../../docs/especificacoes/M10-ESPECIFICACAO.md) · **Estado:** G0 aprovado; G1 em produção

Um cenário `ESPECIFICADO` possui oráculo planejado; não significa prova.
Só execução reproduzível, revisada pelo orquestrador, promove a `VERIFICADO`.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 20 h | especificação §2 |
| blocos | 10 | especificação §4 |
| cenários | 16 (`M10-AT-001`–`016`) | especificação §5 |
| fontes | 5 | especificação §6 |
| produto | workflow + grafo + memória + saúde locais | especificação §1 e §3 |
| execução externa obrigatória | 0 | especificação §1 |

## Cobertura por bloco

| Bloco | Competência verificável | Cenários | Saída planejada | Estado |
|---|---|---|---|---|
| B01 · dualidade | classificar por estrutura | AT-001 | roteamento | CONTEÚDO PRODUZIDO |
| B02 · execução | estado, reducers, fan-out | AT-002 | merge | CONTEÚDO PRODUZIDO; LAB VERDE |
| B03 · persistência | checkpoint, resume | AT-003–004 | kill simulado | CONTEÚDO PRODUZIDO; LAB VERDE |
| B04 · HITL | pausa, reexecução | AT-005–006 | efeito único | CONTEÚDO PRODUZIDO; LAB VERDE |
| B05 · extração | ontologia, fqn | AT-007–008 | censo | CONTEÚDO PRODUZIDO; LAB VERDE |
| B06 · PG | SQL referência, tenant | AT-009–010 | documento | CONTEÚDO PRODUZIDO; EXEC BLOCKED |
| B07 · GraphRAG | híbrido, comunidades | AT-011 | âncora→expansão | CONTEÚDO PRODUZIDO; LAB VERDE |
| B08 · memória | temporal, invalidação | AT-012 | ciclo | CONTEÚDO PRODUZIDO; LAB VERDE |
| B09 · saúde | I/A/D, zonas, ciclos | AT-013–015 | relatório | CONTEÚDO PRODUZIDO; LAB VERDE |
| B10 · integração | 3 perguntas | AT-016 | taxa | CONTEÚDO PRODUZIDO; LAB VERDE |

## Matriz de cenários

| Família | Cenários | Estado atual | Condição para promoção |
|---|---|---|---|
| dualidade | AT-001 | CONTEÚDO PRODUZIDO | classificação |
| execução | AT-002 | ORÁCULOS VERDES | reducer + mutante |
| durabilidade | AT-003–004 | ORÁCULOS VERDES | kill + thread estável |
| HITL | AT-005–006 | ORÁCULOS VERDES | pausa + efeito único |
| extração | AT-007–008 | ORÁCULOS VERDES | censo + fqn |
| travessia | AT-009–011 | ORÁCULOS VERDES | impacto/mortos/híbrido (PG real bloqueado) |
| memória | AT-012 | ORÁCULOS VERDES | validade |
| saúde | AT-013–015 | ORÁCULOS VERDES | zonas + honestidade |
| transferência | AT-016 | ORÁCULOS VERDES | 3 perguntas |

## Estado dos gates

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0, 16 ATs, fontes, lab local e limites |
| G1 | EM PRODUÇÃO (revisão aplicada, avaliação pendente) | B01–B10 sem stack prévia, sem relógios, práticas no lab guiado, fontes por bloco |
| G2 | PARCIAL (local completo; PG/framework bloqueados) | `lab/` verde: ruff, mypy strict, 15 passed, sem deps externas |
| G3 | PENDENTE (material pronto) | checkpoint P1–P10 por cenário; sem execução de avaliação |
| G4 | PENDENTE | invariantes/adapters separados; portabilidade não exercitada além do local |
| G5 | PENDENTE | idempotência e efeito único com oráculos; sem rede por desenho |
| G6 | PENDENTE | estrutura/links validados; QA visual 390px/impressão pendente |

## Auditoria do artefato anterior

| Achado | Impacto | Tratamento planejado |
|---|---|---|
| 7+ caixas "Tradução .NET" + Roslyn/NDepend/EF | pré-requisito indevido | explicação direta + AST Python |
| 10 `clock` + práticas com tempo no corpo | ritual, leitura interrompida | remover; prática só no lab guiado |
| corpus C#/tree-sitter-c-sharp/networkx como núcleo | exige outra linguagem/deps | fixture Python, grafo próprio sem deps |
| refs a PROGRESSO/Capstone-no-ar/conta | obrigação indevida | remover; capstone via spec própria |
| zero seção de fontes | claims sem auditabilidade | fontes por bloco + matriz |

## Próximo lote

**M10 fechado no executável.** Falta, fora do alcance deste ambiente:
execução AGE/PostgreSQL e LangGraph real (Docker/conta), QA visual G6 e
revisão do orquestrador para G1–G6. Pela fila do status, a próxima
unidade é **M11-S** (escopo e rastreabilidade do M11).

## Lote M10 — 14/09/2026 (M10-S/C/L/D/E)

Execução real (CPython 3.14.7, `uv sync --frozen`): `ruff check` e
`ruff format --check` aprovados; `mypy --strict` sem achados (11 arquivos);
`pytest -q`: **15 passed**, zero dependência externa. Evidência em
`lab/evidence/m10-gates.txt`. Nenhum cenário promovido a VERIFICADO;
nenhum gate promovido. Revisão do orquestrador pendente;
`STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md` não alterados.

## Revisão E — 14/09/2026 (orquestrador, protocolo econômico)
Lab re-executado: uv sync --frozen OK; ruff/format/mypy-strict (11 arqs) verdes; pytest 15 passed; Python 3.14.7. PG/AGE BLOCKED (pg_ctl/postgres/psql/docker ausentes, declarado); slice offline (5 passed no recorte grafo). HTML: 0 erros; 1 flag legada adjudicada (menção informativa a C# em enumeração de gramáticas, sem presuposto). 14 h2 (11 com id); TOC 11 âncoras; Fontes global + 19 menções (sem seção por bloco — lacuna G1). Serve 200. Âncoras diagnostico/checkpoint/fontes adicionadas. Limites: sem QA visual device, LangGraph real bloqueado. G2 re-verificado no slice; demais gates inalterados.

E-QA complementar (orquestrador): regra `:focus-visible` explícita + rolagem horizontal de tabelas ≤640px aplicadas no CSS (padrão M00/M11); sem `outline:none` em nenhum módulo (foco visível por padrão). M06 TOC convertido para âncoras; ids diagnostico/checkpoint/fontes adicionados.
