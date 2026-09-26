# Rastreabilidade do M05

**Data-base:** 14/09/2026 · **Especificação:** [`docs/especificacoes/M05-ESPECIFICACAO.md`](../../docs/especificacoes/M05-ESPECIFICACAO.md) · **Estado:** G0 aprovado; G1 em produção

Um cenário `ESPECIFICADO` possui oráculo planejado; não significa prova.
Só execução reproduzível, revisada pelo orquestrador, promove a `VERIFICADO`.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 14 h | especificação §2 |
| blocos | 7 | especificação §4 |
| cenários | 17 (`M05-AT-001`–`017`) | especificação §5 |
| fontes | 6 | especificação §6 |
| produto | gateway + cache + ledger locais | especificação §1 e §3 |
| execução externa obrigatória | 0 | especificação §1 |

## Cobertura por bloco

| Bloco | Competência verificável | Cenários | Saída planejada | Estado |
|---|---|---|---|---|
| B01 · contrato | tokens, janela, amostragem, finish | AT-001–003 | contrato + fakes | CONTEÚDO PRODUZIDO; LAB VERDE |
| B02 · structured | schema, validação, abstenção | AT-004–006 | extrator Pydantic | CONTEÚDO PRODUZIDO; LAB VERDE |
| B03 · tools | loop, orçamento, erro acionável | AT-007–008 | tool loop | CONTEÚDO PRODUZIDO; LAB VERDE |
| B04 · streaming | SSE, parcial, backpressure | AT-009–010 | assembler | CONTEÚDO PRODUZIDO; LAB VERDE |
| B05 · cache | camadas, TTL, prefixo, stats | AT-011–012 | cache + stats | CONTEÚDO PRODUZIDO; LAB VERDE |
| B06 · gateway | fallback, timeout, retry, telemetria | AT-013–015 | gateway | CONTEÚDO PRODUZIDO; LAB VERDE |
| B07 · custo | ledger, alavancas, relatório | AT-016–017 | relatório R$ | CONTEÚDO PRODUZIDO; LAB VERDE |

## Matriz de cenários

| Família | Cenários | Estado atual | Condição para promoção |
|---|---|---|---|
| contrato e adapters | AT-001–003 | ORÁCULOS VERDES | suíte única, dois fakes |
| saída estruturada | AT-004–006 | ORÁCULOS VERDES | parse + rejeição + abstenção |
| tools | AT-007–008 | ORÁCULOS VERDES | loop com teto + erro acionável |
| streaming | AT-009–010 | ORÁCULOS VERDES | parcial detectado + backpressure |
| cache | AT-011–012 | ORÁCULOS VERDES | hit/TTL/invalidação |
| resiliência | AT-013–015 | ORÁCULOS VERDES | fallback + teto + telemetria |
| custo | AT-016–017 | ORÁCULOS VERDES | ledger + relatório |

## Estado dos gates

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0, 17 ATs, fontes, lab local e limites |
| G1 | EM PRODUÇÃO (revisão aplicada, avaliação pendente) | B01–B07 sem stack prévia, sem relógios, práticas no lab guiado, fontes por bloco |
| G2 | PARCIAL (offline completo) | `lab/` verde: ruff, mypy strict, 27 passed; sem dependência externa por desenho |
| G3 | PENDENTE (material pronto) | checkpoint P1–P7 por cenário com rubrica; sem execução de avaliação |
| G4 | PENDENTE | invariantes/adapters separados; portabilidade não exercitada além do local |
| G5 | PENDENTE | timeout/retry/segredo com oráculos; sem rede real por desenho |
| G6 | PENDENTE | estrutura/links validados; QA visual 390px/impressão pendente |

## Auditoria do artefato anterior

| Achado | Impacto | Tratamento planejado |
|---|---|---|
| 7 caixas "Tradução .NET" + exemplos C# | pré-requisito indevido | explicação direta, sem eixo de comparação |
| 7 `clock` + 7 práticas com tempo no corpo | ritual, leitura interrompida | remover; prática só no lab guiado |
| práticas exigem API key e chamadas pagas | bloqueia estudo sem conta/crédito | núcleo com fakes; live vira trilha opcional |
| preços/modelos como fato sem data visível | risco de obsolescência | retrato datado + revalidação 90 dias |
| refs a PROGRESSO/Capstone-no-ar como requisito | obrigação indevida | remover; capstone via spec própria |
| zero seção de fontes | claims sem auditabilidade | fontes por bloco + matriz |

## Próximo lote

**M05 fechado no executável.** Falta, fora do alcance deste ambiente:
QA visual G6, revisão do orquestrador para G1–G6 e trilha live opcional
(conta e crédito próprios). Pela fila do status, a próxima unidade é
**M06-S** (escopo e rastreabilidade do M06).

## Lote M05 — 14/09/2026 (M05-S/C/L/D/E)

Execução real (CPython 3.14.7, `uv sync --frozen`): `ruff check` e
`ruff format --check` aprovados; `mypy --strict` sem achados (16 arquivos);
`pytest -q`: **27 passed**, zero dependência externa. Os oráculos
acusaram 3 defeitos de teste durante a construção (relógio fake para
trás, ferramenta que sempre falha no teste de teto, asserção em vez de
`ValueError`), todos corrigidos. Evidência em `lab/evidence/m05-gates.txt`.
Nenhum cenário promovido a VERIFICADO; nenhum gate promovido. Revisão do
orquestrador pendente; `STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md`
não alterados.

## Revisão E — 14/09/2026 (orquestrador, protocolo econômico)
Lab re-executado: ruff/format/mypy verdes; pytest 27 passed; Python 3.14.7; 100% local. HTML: 0 erros, 0 legadas; 11 h2 (8 com id); TOC 8 âncoras; Fontes global (sem seção por bloco — lacuna G1); checkpoint único (sem checkpoint por bloco — lacuna G3). Serve 200. Âncoras diagnostico/checkpoint/fontes adicionadas. Limites: sem QA visual device, sem portabilidade além do local, sem rede real. G2 re-verificado; demais gates inalterados.

E-QA complementar (orquestrador): regra `:focus-visible` explícita + rolagem horizontal de tabelas ≤640px aplicadas no CSS (padrão M00/M11); sem `outline:none` em nenhum módulo (foco visível por padrão). M06 TOC convertido para âncoras; ids diagnostico/checkpoint/fontes adicionados.
