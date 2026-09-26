# Rastreabilidade do M04

**Data-base:** 14/09/2026 · **Especificação:** [`docs/especificacoes/M04-ESPECIFICACAO.md`](../../docs/especificacoes/M04-ESPECIFICACAO.md) · **Estado:** G0 aprovado; G1 em produção

Um cenário `ESPECIFICADO` possui oráculo planejado; não significa prova.
Só execução reproduzível, revisada pelo orquestrador, promove a `VERIFICADO`.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 8 h | especificação §2 |
| blocos | 4 | especificação §4 |
| cenários | 12 (`M04-AT-001`–`012`) | especificação §5 |
| fontes | 6 | especificação §6 |
| produto | gabarito + `design_guard` | especificação §1 e §3 |
| execução externa obrigatória | 0 | especificação §1 |

## Cobertura por bloco

| Bloco | Competência verificável | Cenários | Saída planejada | Estado |
|---|---|---|---|---|
| B01 · taxonomia | categorias, Diátaxis, camadas de contexto | AT-001–003 | auditoria + AGENTS | CONTEÚDO PRODUZIDO |
| B02 · diagramas | C4, Mermaid, alternativa textual | AT-004–006 | L1/L2 + sequence | CONTEÚDO PRODUZIDO |
| B03 · ADR/postmortem | anatomia, custo de reversão, blameless | AT-007–009 | ADR + postmortem | CONTEÚDO PRODUZIDO |
| B04 · manutenção | drift, linter, revisor, runbook | AT-010–012 | design_guard + prompt | CONTEÚDO PRODUZIDO; LAB VERDE |

## Matriz de cenários

| Família | Cenários | Estado atual | Condição para promoção |
|---|---|---|---|
| taxonomia e contexto | AT-001–003 | CONTEÚDO PRODUZIDO | auditoria + AGENTS demonstrados no lab guiado |
| diagramas | AT-004–006 | CONTEÚDO PRODUZIDO | C4 + sequence + contexto na demo |
| decisão e falha | AT-007–009 | CONTEÚDO PRODUZIDO; LINT VERDE | ADR bom passa, ADR ruim é acusado |
| manutenção | AT-010–012 | ORÁCULOS VERDES (15 passed) | linter + mutante + fitness + prompt versionado |

## Estado dos gates

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0, 12 ATs, fontes, lab local e limites |
| G1 | EM PRODUÇÃO (revisão aplicada, avaliação pendente) | B01–B04 sem stack prévia, sem relógios, com fontes; lab guiado + checkpoint por cenário |
| G2 | PARCIAL (offline completo) | `lab/` verde: ruff, mypy strict, 15 passed; sem dependência externa por desenho |
| G3 | PENDENTE (material pronto) | checkpoint P1–P7 por cenário com rubrica; sem execução de avaliação |
| G4 | PENDENTE | invariantes separados; portabilidade Windows/Docker não exercitada |
| G5 | PENDENTE | n/a em escopo local, salvo segredos (nenhum no lab) |
| G6 | PENDENTE | estrutura/links validados; QA visual 390px/impressão pendente |

## Auditoria do artefato anterior

| Achado | Impacto | Tratamento planejado |
|---|---|---|
| 4 caixas "Tradução .NET" + exemplos C# inline | pré-requisito indevido de outra stack | substituir por explicação direta em Python/geral |
| 4 `clock` + práticas com tempo no corpo | ritual obrigatório, leitura interrompida | remover clocks; prática só no lab guiado final |
| quota ("meta de 25 ADRs"), PROGRESSO/Capstone-no-ar como requisito | obrigação indevida ao aluno | remover; capstone vira trilha opcional com spec própria |
| exemplos pessoais ("seu trabalho", "@denisson", ".NET do cliente") | não transferível | anonimizar/generalizar |
| zero seção de fontes | claims sem auditabilidade | fontes por bloco + matriz |
| `Python 3.12+`, `lint-imports` no exemplo AGENTS | diverge do canônico (3.14, guardrail por teste) | corrigir |

## Próximo lote

**M04 fechado no executável.** Falta, fora do alcance deste ambiente:
QA visual G6 e revisão do orquestrador para G1–G6. Pela fila do status, a
próxima unidade é **M05-S** (escopo e rastreabilidade do M05).

## Lote M04 — 14/09/2026 (M04-S/C/L/D/E)

Execução real (CPython 3.14.7, `uv sync --frozen`): `ruff check` e
`ruff format --check` aprovados; `mypy --strict` sem achados (6 arquivos);
`pytest -q`: **15 passed**. CLI reprova a demo (`DOC LINT FALHOU`,
exit 1) e aprova a cópia limpa (`DOC LINT OK`, exit 0); mutante de
referência quebrada rejeitado e revertido. Evidência em
`lab/evidence/m04-gates.txt`. Nenhum cenário promovido a VERIFICADO;
nenhum gate promovido. Revisão do orquestrador pendente;
`STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md` não alterados.

## Lote M04 — 20/09/2026 (VERIFY-ONLY Tier 1)

Verificação sem escrita de conteúdo novo (CPython 3.14.7, uv 0.12.7,
`uv sync --frozen`): `ruff check` ok; `ruff format --check` ok
(16 arquivos); `mypy src tests` limpo (6 arquivos, strict);
`pytest -q`: **15 passed** (8 test_rules + 5 test_cli + 2 fitness).
`tools/check_course.py` no HTML: 0 erros estruturais/links.
Verbatim executado: `python -m design_guard.cli --raiz .` reprova a demo
(exit 1, `adr-estrutura` + `adr-sem-porque` no ADR 0002, defeito proposital);
mutante `` `src/app/inexistente.py` `` inserido na cópia é rejeitado
(exit 1, `[ref-quebrada]`), revertido volta ao verde — conforme Etapas 3–4.
Snippet `tools/doc_lint.py` do bloco 4 é exemplo de leitura rotulado, com
ponteiro explícito para `lab/src/design_guard/`; sem divergência.
E fechado: TOC com nav, 5/5 âncoras resolvem, CSS inline, serve HTTP 200.
Nenhuma lacuna comprovada; nenhum arquivo de conteúdo/lab alterado.
Nenhum cenário promovido a VERIFICADO; nenhum gate promovido.
Revisão do orquestrador (G1–G6, QA visual) segue pendente.

## Lote M04-E — 14/09/2026 (verify-only, Tier 1, Opção A confirmada)
E-QA fechado sem escrita de conteúdo: 15 testes verdes, ruff+mypy+check_course limpos, verbatim/mutante OK, TOC 5/5 âncoras, CSS inline, serve 200. Gates técnico-estruturais verificados; G1–G6 formais não promovidos (pendem revisão visual/orquestrador no G6 final).
