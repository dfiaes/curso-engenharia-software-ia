# Rastreabilidade do M07

**Data-base:** 14/09/2026 · **Especificação:** [`docs/especificacoes/M07-ESPECIFICACAO.md`](../../docs/especificacoes/M07-ESPECIFICACAO.md) · **Estado:** G0 aprovado; G1 em produção

Um cenário `ESPECIFICADO` possui oráculo planejado; não significa prova.
Só execução reproduzível, revisada pelo orquestrador, promove a `VERIFICADO`.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 16 h | especificação §2 |
| blocos | 8 | especificação §4 |
| cenários | 16 (`M07-AT-001`–`016`) | especificação §5 |
| fontes | 5 | especificação §6 |
| produto | pipeline local + corpus Python | especificação §1 e §3 |
| execução externa obrigatória | 0 | especificação §1 |

## Cobertura por bloco

| Bloco | Competência verificável | Cenários | Saída planejada | Estado |
|---|---|---|---|---|
| B01 · embeddings | limites, métricas, migração | AT-001/002/015 | sondas | CONTEÚDO PRODUZIDO; LAB VERDE |
| B02 · chunking | estratégias, id estável | AT-003–004 | chunker AST | CONTEÚDO PRODUZIDO; LAB VERDE |
| B03 · pgvector | schema, HNSW, over-filtering | AT-005 | SQL de referência | CONTEÚDO PRODUZIDO; EXEC PG BLOCKED |
| B04 · híbrida | léxico, RRF, funil | AT-002/006 | comparação por tipo de query | CONTEÚDO PRODUZIDO; LAB VERDE |
| B05 · rerank | delta, limiar, routing | AT-007–009 | ganho, empate ou perda nos mesmos candidatos | CONTEÚDO PRODUZIDO; LAB VERDE |
| B06 · ACL | ordem, leak, abstenção | AT-010–012 | leak test | CONTEÚDO PRODUZIDO; LAB VERDE |
| B07 · pipeline | métricas, ablação | AT-013–014 | tabela ablação | CONTEÚDO PRODUZIDO; LAB VERDE |
| B08 · mini-projeto | pipeline, 3 perguntas | AT-016 | tres-perguntas | CONTEÚDO PRODUZIDO; LAB VERDE |

## Matriz de cenários

| Família | Cenários | Estado atual | Condição para promoção |
|---|---|---|---|
| embeddings | AT-001/002/015 | ORÁCULOS VERDES | sondas + migração |
| chunking | AT-003–004 | ORÁCULOS VERDES | estrutural vs fixo + id |
| armazenamento | AT-005 | REFERÊNCIA DOCUMENTADA; EXEC BLOCKED | schema + PG real (Docker) |
| híbrida | AT-002/006 | ORÁCULOS VERDES | comparar métodos por tipo de query; resultado pode variar |
| rerank | AT-007–009 | ORÁCULOS VERDES | delta de recall@5 + limiar + routing; sem ganho garantido |
| segurança | AT-010–012 | ORÁCULOS VERDES | leak + abstenção (RLS real é M12) |
| eval | AT-013–014 | ORÁCULOS VERDES | métricas + ablação |
| transferência | AT-016 | ORÁCULOS VERDES | 3 perguntas estruturais |

## Estado dos gates

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0, 16 ATs, fontes, corpus e limites |
| G1 | EM PRODUÇÃO (revisão aplicada, avaliação pendente) | B01–B08 sem stack prévia, sem relógios, práticas no lab guiado, fontes por bloco |
| G2 | PARCIAL (local completo; PG bloqueado) | `lab/` verde: ruff, mypy strict, 23 passed; SQL PG como referência não executada |
| G3 | PENDENTE (material pronto) | checkpoint P1–P9 por cenário; sem execução de avaliação |
| G4 | PENDENTE | invariantes/adapters separados; portabilidade não exercitada além do local |
| G5 | PENDENTE | segredo com fixture de exemplo; mascaramento completo é M12 |
| G6 | PENDENTE | estrutura/links validados; QA visual 390px/impressão pendente |

## Auditoria do artefato anterior

| Achado | Impacto | Tratamento planejado |
|---|---|---|
| 7 caixas "Tradução .NET" + código C# | pré-requisito indevido | explicação direta + chunker Python via AST |
| 8 `clock` + 7 práticas com tempo no corpo | ritual, leitura interrompida | remover; prática só no lab guiado |
| corpus ".NET do trabalho" como núcleo | exige outra linguagem | corpus Python com origem no lab |
| refs a PROGRESSO/Capstone-no-ar | obrigação indevida | remover; capstone via spec própria |
| zero seção de fontes | claims sem auditabilidade | fontes por bloco + matriz |

## Próximo lote

**M07 fechado no executável.** Falta, fora do alcance deste ambiente:
execução pgvector/PostgreSQL (Docker), QA visual G6, revisão do
orquestrador para G1–G6 e trilha com modelos reais. Pela fila do status,
a próxima unidade é **M08-S** (escopo e rastreabilidade do M08).

## Lote M07 — 14/09/2026 (M07-S/C/L/D/E)

Execução real (CPython 3.14.7, `uv sync --frozen`): `ruff check` e
`ruff format --check` aprovados; `mypy --strict` sem achados (16 arquivos);
`pytest -q`: **23 passed**, zero dependência externa. Os oráculos
acusaram fixture e teste defeituosos na construção (linhas erradas,
stopwords dominando o vetor, tenant sem filtro), todos corrigidos com
registro. Evidência em `lab/evidence/m07-gates.txt`. Nenhum cenário
promovido a VERIFICADO; nenhum gate promovido. Revisão do orquestrador
pendente; `STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md` não alterados.

## Revisão E — 14/09/2026 (orquestrador, protocolo econômico)
Lab re-executado: ruff/format/mypy-strict (16 arqs) verdes; pytest 23 passed; Python 3.14.7. PG vetorial BLOCKED (porta 5432 fechada, declarado); slice offline total. HTML: 0 erros, 0 clocks; 9 h2 com id + TOC 9 âncoras; Fontes global com 5 fontes (sem IDs SRC-M07 e sem seção por bloco — lacuna G1). Serve 200. Âncoras diagnostico/checkpoint/fontes adicionadas. Limites: sem QA visual device, modelos reais bloqueados. G2 re-verificado no slice; demais gates inalterados.

E-QA complementar (orquestrador): regra `:focus-visible` explícita + rolagem horizontal de tabelas ≤640px aplicadas no CSS (padrão M00/M11); sem `outline:none` em nenhum módulo (foco visível por padrão). M06 TOC convertido para âncoras; ids diagnostico/checkpoint/fontes adicionados.
