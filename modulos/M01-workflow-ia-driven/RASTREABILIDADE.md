# Rastreabilidade do M01

**Data-base:** 15/08/2026 · **Especificação:** `docs/especificacoes/M01-ESPECIFICACAO.md` · **Estado:** EM REVISÃO EDITORIAL em 12/09/2026; baseline técnico de agosto preservado

## Competências por bloco

| ID | Resultado observável | Evidência atual | Estado |
|---|---|---|---|
| M01-B01-C01 | separar problema, outcome, requisito, qualidade, não-objetivo, design e plano | contrato canônico + especificação | PRODUZIDO NO LAB |
| M01-B01-C02 | escrever critério com exemplo, contraexemplo e propriedade verificável | `contract.py` + fixture válida/inválida | VERIFICADO |
| M01-B01-C03 | pesquisar o sistema antes de especificar | ciclo + prática do HTML | PRODUZIDO / PRÁTICA DO ALUNO |
| M01-B01-C04 | rastrear requisito até tarefa e teste | `test_untraced_requirement_is_rejected` | VERIFICADO |
| M01-B01-C05 | detectar drift bidirecional sem escolher verdade automaticamente | `drift.py` + quatro casos | VERIFICADO |
| M01-B02-C01 | distinguir prompt, contexto, policy, gate e runner | camadas e diagnóstico do HTML | PRODUZIDO |
| M01-B02-C02 | executar processo por argv, sem shell implícito | `runner.py` | VERIFICADO |
| M01-B02-C03 | validar artefato por schema e invariantes semânticos | schema 2020-12 + parser tipado | VERIFICADO |
| M01-B02-C04 | injetar falha e provar bloqueio | timeout, path, shell, mypy e mutante negativos | VERIFICADO |
| M01-B02-C05 | registrar versão, duração, argv, saída e código reais | `evidence/run.json` | VERIFICADO |
| M01-B03-C01 | tratar 12-Factor Agents como practitioner guidance | revisão de fontes + especificação | PRODUZIDO PARA HTML |
| M01-B03-C02 | mapear fator a evidência, lacuna e controle | tabela + auditoria guiada | PRODUZIDO / PRÁTICA DO ALUNO |
| M01-B03-C03 | equilibrar prefetch pequeno com retrieval sob demanda | análise crítica no bloco 3 | PRODUZIDO |
| M01-B03-C04 | modelar launch/pause/resume como reducer | `workflow.py` + checkpoint | VERIFICADO |
| M01-B03-C05 | impor orçamento e escalonamento humano | teste de limite de iteração | VERIFICADO |
| M01-B04-C01 | diferenciar concorrência, paralelismo e independência | `assess_parallelism` | PRODUZIDO NO LAB |
| M01-B04-C02 | avaliar arquivos, contratos, recursos e dependências | `WorkUnit` + teste de contrato compartilhado | VERIFICADO |
| M01-B04-C03 | criar e remover worktrees somente em sandbox possuído | `GitWorktreeSandbox` + Git real | VERIFICADO |
| M01-B04-C04 | executar gate local e global após merge | branches passam isoladas; merge real alimenta gate 120/110 | VERIFICADO NO LAB |
| M01-B04-C05 | detectar conflito textual e semântico | merge limpo + incompatibilidade 120/110 | VERIFICADO NO NÚCLEO |
| M01-B04-C06 | medir speedup, coordenação, retrabalho e revisão | exercício e baseline definidos | PRODUZIDO / PRÁTICA DO ALUNO |
| M01-B05-C01 | produzir skills portáteis | três `skills/*/SKILL.md` | PRODUZIDO |
| M01-B05-C02 | comparar kit próprio com Spec Kit atual | bloco 1, bloco 5 e fonte versionável | PRODUZIDO |
| M01-B05-C03 | validar artefatos, proveniência e links | schema + hash de workflow + trace do Capstone | VERIFICADO NO LAB |
| M01-B05-C04 | negar workflow externo não revisado | `policy.py` + teste de hash/allowlist | VERIFICADO |
| M01-B05-C05 | produzir primeira fatia vertical do Capstone | fixture com intent, requisitos, design, plano e trace | VERIFICADO NO LAB |
| M01-B05-C06 | produzir handoff retomável | checkpoint + handoff com verificação, próxima ação e pendências | VERIFICADO NO LAB |

## Cenários de aceitação

| ID | Evidência | Estado em 14/08/2026 |
|---|---|---|
| M01-AT-001 | contrato válido e RF coberto por tarefa | VERIFICADO |
| M01-AT-002 | requisito vago falha sem alterar arquivo | VERIFICADO |
| M01-AT-003 | não-objetivo ausente bloqueia | VERIFICADO |
| M01-AT-004 | estado `spec_stale` | VERIFICADO |
| M01-AT-005 | falha comportamental gera `code_incorrect` sem culpar spec automaticamente | VERIFICADO |
| M01-AT-006 | ambiguidade vira `decision_required`, sem mutação | VERIFICADO |
| M01-AT-007 | Ruff, mypy e testes verdes; runner registra versão, duração e argv | VERIFICADO |
| M01-AT-008 | type error semeado bloqueado pelo mypy com arquivo/linha | VERIFICADO |
| M01-AT-009 | mutante conhecido expõe oráculo fraco | VERIFICADO |
| M01-AT-010 | processo expirado retorna código 124 | VERIFICADO |
| M01-AT-011 | shell string rejeitada | VERIFICADO |
| M01-AT-012 | workflow externo com processo exige hash e allowlist | VERIFICADO |
| M01-AT-013 | pause/resume não repete `effect_id` | VERIFICADO |
| M01-AT-014 | limite de iteração escala com motivo | VERIFICADO |
| M01-AT-015 | worktrees resolvidas dentro de temp root possuído | VERIFICADO COM GIT REAL |
| M01-AT-016 | arquivo fora do write set detectado | VERIFICADO |
| M01-AT-017 | duas branches integram sem conflito textual | VERIFICADO COM GIT REAL |
| M01-AT-018 | valores dos arquivos integrados alimentam gate 120/110 e falham | VERIFICADO COM GIT REAL |
| M01-AT-019 | cleanup recusa dirty e remove somente worktrees próprias | VERIFICADO COM GIT REAL |
| M01-AT-020 | dois adapters preservam fingerprint canônico | VERIFICADO |
| M01-AT-021 | snapshot local descobre `/speckit.*` e `$speckit-*` sem executar | VERIFICADO |
| M01-AT-022 | fatia Capstone com intent→RF→teste e handoff validado | VERIFICADO |

## Gates editoriais e técnicos

| Gate | Estado | Evidência / bloqueio |
|---|---|---|
| G0 · Escopo | APROVADO | cinco blocos, 27 competências, 22 cenários e fontes classificadas |
| G1 · Conteúdo | APROVADO | HTML com 9.167 palavras visíveis, teoria, limites, fontes e práticas ligadas ao lab |
| G2 · Execução | APROVADO NO LAB | Python 3.14.7, Ruff, mypy e 27 testes verdes; 22 cenários possuem núcleo executável |
| G3 · Avaliação | APROVADO PARA OFERTA | oito questões por cenário, seis entregáveis e rubrica 80%/100% segurança |
| G4 · Portabilidade | APROVADO NO LAB | núcleo canônico + Agent Skills + dois adapters com mesmo fingerprint |
| G5 · Produção | APROVADO NO LAB | subprocess, UTF-8, hash/allowlist, paths, Git, dirty cleanup e falhas cobertos |
| G6 · Editorial | REVALIDAÇÃO PENDENTE | Evidência histórica de agosto:  estrutura visual padronizada pelo M00; tags balanceadas, fontes distintas acessíveis, CSS móvel, SVGs nomeados e revisão localhost sem overflow |

## Auditoria de profundidade sênior

O M01 foi confrontado com cinco níveis de domínio: conceito, decisão/trade-off, implementação, falha/diagnóstico e evidência/transferência. O escopo chega ao nível 4 de forma verificável e ao nível 5 nos contratos, no runner, no estado retomável e na integração Git. Não há lacuna P0 ou P1 que justifique aumentar as 10h agora.

| Tema | Profundidade comprovada | Continuação deliberada |
|---|---|---|
| requisitos, SDD e drift | contrato + parser + quatro estados + casos negativos | design/ADR no M04; governança no LT04 |
| harness e execução | argv seguro, timeout, UTF-8, policy, evidência e mutante | CI no M03/M06; sandbox e supply chain no M12/LT03 |
| estado retomável | reducer, pause/resume, `effect_id`, budget e handoff | durabilidade distribuída no M10/LT02 |
| trabalho paralelo | DAG, recursos, write sets, worktrees e gate global | concorrência Python no M02; sistemas distribuídos no LT02 |
| portabilidade | contrato canônico, Agent Skills e adapters equivalentes | protocolos no M09; avaliação cruzada no LT04 |

Regra editorial: aprofundamentos acima pertencem ao módulo indicado e devem referenciar o M01, não duplicar seu conteúdo. A auditoria ampla está registrada em `docs/AUDITORIA-APROFUNDAMENTO-M01-M13.md`.

## Revisão didática de 20/08/2026

| ID | Mudança aplicada no HTML | Evidência editorial | Estado |
|---|---|---|---|
| DID-M01-001 | caso único percorre intenção, requisito, spec, plano, código e evidência; o mesmo caso demonstra classificação de drift | seção 1.1 | APLICADO |
| DID-M01-002 | linguagem sobre limite de contexto trocada por sinais verificáveis e decisões de diagnóstico | seção 2.2 | APLICADO |
| DID-M01-003 | tabela 12-Factor passa a orientar decisão por estado, efeito e contrato, sem exigir memorização de números | seção 3.2 | APLICADO |
| DID-M01-004 | panorama de prática vigente liga SDD, gates, worktrees e supply chain a sinal industrial datado, com limite metodológico | seção 1.4 e fontes | APLICADO |
| DID-M01-005 | paralelismo é definido por independência de tarefa, contrato e recurso, não por uma alegação sobre o host | seção 4.1 | APLICADO |

Auditoria de suporte: `docs/auditorias/M01-DIDATICA-2026-08.md`. A revisão não altera os resultados dos 22 cenários, o laboratório ou a aprovação G0–G6.

## Reestruturação do laboratório em 21/08/2026

Esta mudança reorganiza a experiência didática, sem promover gate ou substituir a execução do aluno por evidência editorial.

| ID | Mudança aplicada | Competências e cenários cobertos | Evidência | Estado |
|---|---|---|---|---|
| LAB-M01-001 | comandos e práticas intermediárias dos blocos 1–4 foram convertidos em leitura aplicada e cenário explicado | B01–B04 | não há `<div class="step">` antes do laboratório final | APLICADO |
| LAB-M01-002 | laboratório final percorre contrato, quatro estados de drift, runner, caso negativo, workflow e Git real | AT-001..021 | `M01.html#lab` | APLICADO |
| LAB-M01-003 | cópia temporária marcada preserva a referência e esvazia somente `drift.py` para reconstrução por código completo | AT-004..006, G2, G5 | `lab/create_working_copy.py` | VERIFICADO |
| LAB-M01-004 | lint, mypy, testes e gates são apresentados como oráculos do programa; checkpoint permanece posterior | AT-007..019, G3 | laboratório e checkpoint separados | APLICADO |
| LAB-M01-005 | bloco 5 mantém os artefatos como referência; a execução passa para o laboratório | B05 | aviso editorial e âncora `#lab` | APLICADO |

Execução da cópia de referência em 21/08/2026: CPython 3.14.7; `uv sync --locked --offline --extra dev`; Ruff format/lint aprovados; mypy estrito sem issues em 21 arquivos; 27 testes `OK`, incluindo worktrees e merges Git reais em diretório temporário.

## Execução registrada

```text
Python 3.14.7
Ruff format: 33 files already formatted
Ruff lint: All checks passed!
mypy strict: Success: no issues found in 21 source files
unittest: Ran 27 tests in 2.126s — OK
Git: duas worktrees reais, dois merges limpos e cleanup seguro em TemporaryDirectory
CLI negativa: contrato inválido retornou código 20 com oito diagnósticos esperados
Adapters: fingerprints SHA-256 idênticos
HTML: 9.167 palavras visíveis; 18 blocos de código; 21 resultados; 20 links externos (14 destinos distintos)
Visual: padrão M00; header, mapa com 6 âncoras válidas, 1 H1, 8 H2, zero overflow horizontal em 1280 px e 2 SVGs nomeados
```

O laboratório e o conteúdo foram revisados pelo orquestrador. M01 teve G0–G6 aprovados em agosto; a apresentação atual aguarda revalidação G6. Práticas marcadas como “do aluno” são critérios de aprendizagem, não bloqueios editoriais.

## Revisão editorial — 12/09/2026

O HTML principal recebeu explicações independentes de outra stack, remoção de duração obrigatória, links por seção e aviso de prontidão. A navegação permite leitura e prática no ritmo do aluno. O verificador editorial examinou estrutura, destinos locais e âncoras; não executou laboratórios nem certificou fontes externas ou apresentação visual. Os resultados técnicos anteriores permanecem históricos; G6 da apresentação revisada continua pendente.
