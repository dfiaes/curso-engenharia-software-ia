# Rastreabilidade do M06

**Achado de 21/09/2026, sem promoção de gates:** a [análise solicitada](../../docs/auditorias/STATUS-DIDATICA-PROFUNDIDADE-2026-09-21.md) reproduziu aprovação sem categorias de segurança em `gate.decidir()` (A02/P1) e identificou correções estatísticas no HTML (A03). Correção e revalidação pendentes; lab verde não encerra esses requisitos.

## Correção focal FIX-05 — inferência estatística

## Correção focal FIX-06 — juiz e calibração humana

O B03 separa concordância observada (total e por classe), kappa corrigido
por chance e calibração probabilística. Explicita que a fixture com dez
rótulos é escrita/roteirizada, não coleta humana, e que o juiz determinístico
retorna booleano sem probabilidades. O exemplo variável de 100 casos mostra
dois juízes com 90% de acordo e erros por classe diferentes, além do juiz
sempre-sim numa classe majoritária; custo de erro, incerteza e abstenção
orientam a decisão. Fontes primárias Cohen (1960) e Guo et al. (2017)
registradas na especificação/HTML. A revisão independente de 26/09/2026 corrigiu
o helper: usa `rotulo_referencia` sem afirmar origem humana, exige `limiar`
explícito e rejeita entrada vazia ou limiar inválido. A fixture não é evidência
de coleta humana; a função não verifica proveniência, acordo por classe ou
incerteza. Testes negativos cobrem o corte de classe majoritária e os limites
da API. M06-AT-006 requer dados humanos com proveniência e rubrica
documentadas; a fixture não o verifica. Nenhum AT/gate promovido; nova
revisão independente pendente.

Na revisão independente de 26/09/2026, a abertura da especificação ainda
chamava o juiz de “calibrado contra humano” e o fechamento/checkpoint do HTML
mantinha “concordância medida com você”, sem condicionar isso à existência e
proveniência de rótulos humanos. A redação foi alinhada à distinção entre
concordância observada e calibração probabilística e deixa claro que a fixture
não comprova coleta humana. A alteração reabre FIX-06 para revisão distinta;
nenhum AT/gate foi promovido.

O título do B01, sua entrada no sumário e o P3 do checkpoint também foram alinhados à complementaridade entre testes unitários e evals: testes unitários continuam verificando invariantes determinísticas do runtime; evals cobrem comportamento variável do modelo. A formulação anterior dizia que testes unitários “não servem”, em contradição com o corpo corrigido.

Na revisão independente seguinte, foi encontrado texto legado nas tabelas do HTML que tratava avaliação humana como referência absoluta e dizia que o juiz deveria se alinhar “com você”. O comparador agora descreve referências humanas com rubrica e proveniência registradas e reconhece que revisores também discordam. A especificação delimita M06-AT-006: a fixture exercita a função, mas não satisfaz o aceite que requer referências humanas documentadas; 85% é corte local, não validade universal. Esta revisão fez alterações e tornou-se autoria; FIX-06 volta a AGUARDA_REVISAO, sem promoção de AT/gate.

Na revisão independente do RUN `01a0dea7-003e-7262-8bbd-4ed3faf5d5e2`, a API `calibrar()` e o passo “Juiz calibrado” ainda confundiam acordo observado com calibração probabilística, e o README dizia que o juiz era calibrado contra rótulos humanos. Com necessidade registrada antes da ampliação focal, a API passou a `medir_acordo()`, e texto de laboratório, README e especificação foram alinhados. O helper apenas mede acordo agregado; nenhuma origem humana é inferida. A correção aguarda nova revisão independente; nenhum AT/gate foi promovido.

Em 25/09/2026, o HTML B01 passou a definir proporção, erro padrão,
intervalo Wilson, efeito mínimo, α, poder e resultado inconclusivo; inclui
as contas 45/50 e 180/200, comparação pareada e a distinção entre
“não rejeitar diferença” e demonstrar equivalência. O conjunto escrito à
mão não autoriza inferência sobre população sem amostragem representativa;
repetições estocásticas e dependência por caso também precisam entrar no
desenho. Números 50/200 deixaram de ser regras universais. O critério de
85% foi delimitado ao juiz roteirizado do laboratório e não certifica uso
real. Testes unitários foram reposicionados como complementares aos evals.
O checkpoint P7 pede decisão sob incerteza e explicitação da evidência
faltante. Fórmula e exemplos foram conferidos em CPython 3.14.7; fontes
NIST e artigo original de McNemar registrados na especificação e no HTML.
Foi acrescentada conta didática de planejamento de uma proporção: p0=0,90,
p1=0,95, α=0,05 e poder=0,80 resultam em n′≈238 sem correção de continuidade
e n≈258 com a correção de continuidade relatada pelo NIST/SEMATECH como recomendação de Fleiss, Levin e Paik (`n = n′ + 1/δ`); para p1=0,85, n′≈316 e n≈336,
respectivamente. O cenário 12/15→13/15 torna explícita a borda de um
único caso e a necessidade de resultado inconclusivo. Nenhum AT ou gate
foi promovido; esta atualização aguarda revisão independente.

**Data-base:** 14/09/2026 · **Especificação:** [`docs/especificacoes/M06-ESPECIFICACAO.md`](../../docs/especificacoes/M06-ESPECIFICACAO.md) · **Estado:** G0 aprovado; G1 em produção

Um cenário `ESPECIFICADO` possui oráculo planejado; não significa prova.
Só execução reproduzível, revisada pelo orquestrador, promove a `VERIFICADO`.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 12 h | especificação §2 |
| blocos | 6 | especificação §4 |
| cenários | 14 (`M06-AT-001`–`014`) | especificação §5 |
| fontes | 4 | especificação §6 |
| produto | runner + datasets + registry + gate | especificação §1 e §3 |
| execução externa obrigatória | 0 | especificação §1 |

## Cobertura por bloco

| Bloco | Competência verificável | Cenários | Saída planejada | Estado |
|---|---|---|---|---|
| B01 · fundamento | propriedades, anatomia, níveis | AT-001–002 | casos rotulados | CONTEÚDO PRODUZIDO; LAB VERDE |
| B02 · datasets | 6 categorias, versionamento | AT-003–004 | 6 arquivos | CONTEÚDO PRODUZIDO; LAB VERDE |
| B03 · graders | escada, runner, calibração | AT-005–007 | runner + acordo | CONTEÚDO PRODUZIDO; LAB VERDE |
| B04 · prompts | registry, matriz, experimento | AT-008–009 | matriz + baseline | CONTEÚDO PRODUZIDO; LAB VERDE |
| B05 · observabilidade | tracing sanitizado, painéis | AT-012–013 | spans sem vazamento | CONTEÚDO PRODUZIDO; LAB VERDE |
| B06 · gate | tolerância, pisos, relatório | AT-010–011,014 | gate + relatório | CONTEÚDO PRODUZIDO; LAB VERDE |

## Matriz de cenários

| Família | Cenários | Estado atual | Condição para promoção |
|---|---|---|---|
| fundamento | AT-001–002 | ORÁCULOS VERDES | anatomia + análise de erro |
| datasets | AT-003–004 | ORÁCULOS VERDES | 6 categorias + deprecated excluído |
| graders e juiz | AT-005–007 | ORÁCULOS VERDES | mutante pego + acordo/desalinhado |
| prompts | AT-008–009 | ORÁCULOS VERDES | registry + regressão v1→v2 visível |
| observabilidade | AT-012–013 | ORÁCULOS VERDES | leakage bloqueado + hash |
| gate e relatório | AT-010–011,014 | ORÁCULOS VERDES | exit code + negócio |

## Estado dos gates

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0, 14 ATs, fontes, lab local e limites |
| G1 | EM PRODUÇÃO (revisão aplicada, avaliação pendente) | B01–B06 sem stack prévia, sem relógios, práticas no lab guiado, fontes por bloco |
| G2 | PARCIAL (offline completo) | `lab/` verde: ruff, mypy strict, 17 passed; sem dependência externa por desenho |
| G3 | PENDENTE (material pronto) | checkpoint P1–P9 por cenário; sem execução de avaliação |
| G4 | PENDENTE | invariantes separados; portabilidade não exercitada além do local |
| G5 | PENDENTE | PII/segredo com oráculo de leakage; sem rede por desenho |
| G6 | PENDENTE | estrutura/links validados; QA visual 390px/impressão pendente |

## Auditoria do artefato anterior

| Achado | Impacto | Tratamento planejado |
|---|---|---|
| 6 caixas "Tradução .NET" + exemplos C# | pré-requisito indevido | explicação direta |
| 6 `clock` + 6 práticas com tempo no corpo | ritual, leitura interrompida | remover; prática só no lab guiado |
| refs a PROGRESSO/Capstone/`.cs` do trabalho | obrigação/recorte indevido | remover; Capstone via spec própria |
| zero seção de fontes | claims sem auditabilidade | fontes por bloco + matriz |
| exemplos com `Any` sem tipo (`resposta`) | diverge do strict | tipar |

## Próximo lote

**M06 fechado no executável.** Falta, fora do alcance deste ambiente:
QA visual G6, revisão do orquestrador para G1–G6 e trilha live opcional
(conta e crédito próprios). Pela fila do status, a próxima unidade é
**M07-S** (escopo e rastreabilidade do M07).

## Lote M06 — 14/09/2026 (M06-S/C/L/D/E)

Execução real (CPython 3.14.7, `uv sync --frozen`): `ruff check` e
`ruff format --check` aprovados; `mypy --strict` sem achados (12 arquivos);
`pytest -q`: **17 passed**, zero dependência externa. O carregador de
casos acusou metadados além do schema durante a construção (corrigido com
campos explícitos). Evidência em `lab/evidence/m06-gates.txt`. Nenhum
cenário promovido a VERIFICADO; nenhum gate promovido. Revisão do
orquestrador pendente; `STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md`
não alterados.

## Revisão E — 14/09/2026 (orquestrador, protocolo econômico)
Lab re-executado: ruff/format/mypy-strict (12 arqs) verdes; pytest 17 passed; Python 3.14.7. HTML: 0 erros, 0 legadas; TOC convertido para 6 âncoras (#b01–b06) nesta revisão; Fontes global com 4 fontes (sem seção por bloco — lacuna G1); Checkpoint + Diagnóstico presentes. Serve 200. Limites: sem QA visual device, sem portabilidade além do local, live opcional fora do obrigatório. G2 re-verificado; demais gates inalterados.

E-QA complementar (orquestrador): regra `:focus-visible` explícita + rolagem horizontal de tabelas ≤640px aplicadas no CSS (padrão M00/M11); sem `outline:none` em nenhum módulo (foco visível por padrão). M06 TOC convertido para âncoras; ids diagnostico/checkpoint/fontes adicionados.
