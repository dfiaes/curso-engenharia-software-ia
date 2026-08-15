# Status da implementação do curso

**Atualizado em:** 15/08/2026 · **Release-alvo:** v4.0 · **Carga-base aprovada:** 152 blocos / 304h

Este é o placar editorial e técnico do curso. O progresso de aprendizagem do aluno permanece em `PROGRESSO.md`.

## Resumo executivo

| Dimensão | Estado |
|---|---|
| Arquitetura curricular ampliada | DEFINIDA |
| Política de fontes e agnosticismo | DEFINIDA |
| Padrão composto técnico/didático | DEFINIDO — M00 é referência visual, não autoridade única |
| Matriz de rastreabilidade de alto nível | CRIADA |
| Rastreabilidade detalhada por bloco | EM ANDAMENTO — M00, M01, M02, M02A, M12, M13 e LT01–LT04 registrados |
| M02–M11 | triagem concluída; M02 verificado, M03–M11 pendentes |
| M00 | REGENERADO / EM REVISÃO; G0–G5 aprovados no escopo, G6 parcial |
| M01 | VERIFICADO; G0–G6 aprovados, 27 testes e apresentação alinhada ao M00 |
| M02 | VERIFICADO; G0–G6, 38 cenários e 51 testes em Windows/3.14t/Linux aprovados |
| M12 | EM PRODUÇÃO; G1/G4 aprovados; G2/G3/G5 bloqueantes e G6 parcial |
| M13 | EM PRODUÇÃO; baseline auditado e rastreabilidade criada; HTML ainda bloqueado |
| LT01–LT04 | G0 aprovado; material e laboratórios ainda não produzidos |
| Automação de qualidade | pendente |
| Release v4.0 | não pronta |

## Legenda de implementação

- `NÃO INICIADO`: escopo ainda não detalhado.
- `ESPECIFICADO`: roteiro, competências, fontes e critérios definidos.
- `EM PRODUÇÃO`: escrita ou implementação em andamento.
- `EM REVISÃO`: conteúdo completo aguardando gates.
- `VERIFICADO`: gates G0–G6 aprovados.
- `REFAZER`: artefato existente não pode ser promovido por revisão incremental.
- `BLOQUEADO PARA ESTUDO`: não deve ser usado como material confiável.

## Status por módulo/laboratório

| Item | Horas | Estado | Próxima ação | Prioridade |
|---|---:|---|---|---|
| M00 | 10h | EM REVISÃO (G0–G5 OK) | revisar visualmente a correção de interfaces slash e fechar G6 | P0 |
| M01 | 10h | VERIFICADO (G0–G6) | manter fontes de alto risco versionadas | P0 concluído |
| M02 | 16h | VERIFICADO (G0–G6) | revalidar por mudança relevante | P0 concluído |
| M02A | 30h | G0 APROVADO / G1 EM PRODUÇÃO | produzir material e laboratório Python 3.14; .NET 10 somente como ponte comparativa | P0 |
| M03 | 16h | EM REVISÃO | aprofundar contratos API e preparar encaixe do LT01 | P1 |
| M04 | 8h | EM REVISÃO | validar fontes, práticas e fitness functions | P2 |
| M05 | 14h | EM REVISÃO | neutralizar exemplos e preparar encaixe do LT02 | P1 |
| M06 | 12h | EM REVISÃO | fortalecer estatística e calibração humana | P1 |
| M07 | 16h | EM REVISÃO | verificar autorização, evals e ameaças | P1 |
| M08 | 16h | EM REVISÃO | verificar portabilidade entre frameworks | P1 |
| M09 | 14h | EM REVISÃO | versionar fontes MCP/A2A e testar interoperabilidade | P1 |
| M10 | 20h | EM REVISÃO | validar durabilidade, CAP e preparar LT03 | P1 |
| M11 | 16h | EM REVISÃO | ampliar serving e benchmark de inferência | P1 |
| M12 | 18h | EM PRODUÇÃO (G1/G4 OK) | executar PostgreSQL 18, boundaries E2E, game day e revisão visual | P0 |
| M13 | 40h | EM PRODUÇÃO / PAUSAR APÓS R2.2-A | B01 produzido; B02 Python verde e Docker pendente | P1 |
| LT01 | 12h | G0 APROVADO | produzir material e lab após fechar R1 | P1 |
| LT02 | 12h | G0 APROVADO | produzir material e lab após fechar R1 | P1 |
| LT03 | 12h | G0 APROVADO | produzir material e lab após fechar R1 | P1 |
| LT04 | 12h | G0 APROVADO | produzir material e lab após M12/M13 | P1 |

## Backlog de estruturação

### P0 · Antes de continuar a regeneração

- [x] Autorizar ampliação da carga horária.
- [x] Definir arquitetura de 270h.
- [x] Criar política de fontes e neutralidade.
- [x] Criar matriz de rastreabilidade de alto nível.
- [x] Separar status editorial de progresso de estudo.
- [x] Alinhar números e links nos documentos públicos.
- [x] Definir template detalhado de rastreabilidade por bloco.
- [x] Especificar M12 pelos IDs SEC/TEN/SRE/FIN.
- [x] Especificar M13 pelos IDs CAP/SEN e dependências anteriores.

### P1 · Conteúdo necessário para v4.0

- [x] Especificar LT01.
- [x] Especificar LT02.
- [x] Especificar LT03.
- [x] Especificar LT04.
- [ ] Regenerar M12.
- [ ] Regenerar M13.
- [ ] Auditar M00–M11 pelos gates G0–G6 (M00 regenerado/G6 parcial; M01 e M02 verificados).
- [ ] Criar `docs/fundamentos-de-engenharia.md` com links, não duplicação.
- [ ] Criar registro versionado de fontes por módulo.
- [ ] Corrigir contradições pedagógicas e metadados de fases.

### P2 · Industrialização editorial

- [ ] Extrair e validar snippets Python automaticamente.
- [ ] Adicionar lint/type checking/testes dos exemplos.
- [ ] Validar HTML, links, acessibilidade e impressão.
- [ ] Criar verificador de cobertura dos checkpoints.
- [ ] Criar verificador de placeholders/resultados hardcoded.
- [ ] Criar teste de contrato dos adapters de modelo.
- [ ] Executar release readiness review do curso.
- [ ] Após revisar o código existente, entrevistar o aluno e especificar a plataforma integrada registrada em `docs/INICIATIVA-PLATAFORMA-ESTUDOS.md`.

## Marcos

| Marco | Saída | Critério de conclusão | Estado |
|---|---|---|---|
| R0 · Fundação | plano + política + matriz + status | documentos coerentes e ligados | VERIFICADO |
| R1 · Especificações | M12, M13 e LT01–LT04 detalhados | G0 aprovado para seis itens | VERIFICADO |
| R2 · Produção crítica | M12 + M13 novos | G1–G6 aprovados | EM PRODUÇÃO (R2.1) |
| R3 · Fundamentos | LT01–LT04 + guia | competências ausentes cobertas | NÃO INICIADO |
| R4 · Auditoria do legado | M00–M11 revisados | zero P0/P1 de conteúdo | EM ANDAMENTO — M00/M01/M02 priorizados |
| R5 · Automação | pipeline editorial/técnico | verificações reproduzíveis | NÃO INICIADO |
| R6 · Curso v4.0 | release candidate validada | 152 blocos-base rastreados; zero bloqueadores | NÃO INICIADO |

## Próxima unidade de trabalho recomendada

**Nova prioridade — M00 → M01 → M02 → fundamentos sênior 2026.** M01 e M02 estão verificados; o M00 mantém G6 parcial. O M02A foi especificado como módulo Python-first, com .NET apenas como ponte comparativa, e entrou em produção. M12/M13 mantêm seus bloqueios registrados e serão retomados depois deste ciclo prioritário.

**Unidade ativa:** fechar a correção focal do M00 sobre slash como interface de invocação e produzir/regenerar o M02A em G1–G6 sob o padrão composto de qualidade. O G0 do M02A foi aprovado com 15 blocos/30h, 60 competências, 45 cenários, produto local `work-intake`, Python 3.14 canônico e fronteiras explícitas com M03/LT01–LT04. A futura plataforma integrada está somente em descoberta; PRD/arquitetura dependem da revisão do código e entrevista.

O M01 está verificado em G0–G6: 27 testes/22 cenários, HTML com 9.167 palavras visíveis, 14 fontes distintas e apresentação padronizada pelo M00. Header, mapa, seções, callouts, diagnóstico e fechamento por fontes foram revisados em localhost, sem overflow horizontal.

Depois de verificar o M02A: auditar M03–M11 pela prioridade registrada; então retomar M12/M13 e produzir LT01–LT04 conforme suas dependências.

## Riscos ativos

| Risco | Impacto | Mitigação |
|---|---|---|
| densidade virar enciclopédia sem prática | alto | cada competência exige evidência e checkpoint |
| dependência excessiva de fornecedor | alto | contrato de neutralidade e suíte de adapters |
| exemplos não executáveis | alto | gates G2/G3 e extração automática |
| fontes envelhecerem rapidamente | alto | versão, data e risco de obsolescência |
| capstone virar demonstração simulada | crítico | proibir métricas/testes hardcoded e exigir operação real |
| carga inviável em ritmo irregular | médio | blocos fechados, retomada explícita e trilhas não bloqueantes |

## Changelog

### 15/08/2026

- M01 alinhado ao padrão editorial e didático do M00 sem reduzir o conteúdo técnico: header de saída, mapa navegável, contrato pedagógico, seções identificadas, numeração progressiva, callouts semânticos, diagnóstico e fontes no fechamento;
- revisão visual comparativa M00/M01 em localhost confirmou largura de 1100 px, tipografia equivalente, seis âncoras válidas e zero overflow horizontal em 1280 px;
- auditoria de profundidade M01–M13 criada com régua N1–N5; M01 permanece verificado e os aprofundamentos derivados receberam owners curriculares;
- triagem detectou falta de laboratórios e fontes no HTML de M02–M11, com M11 e M13 classificados como P0 para refazer;
- auditoria detalhada do M02 iniciada: seis lacunas P0 e dez frentes P1 registradas, com fontes primárias de Python 3.14, typing, PyPA, uv, Pydantic, mypy e pytest;
- especificação M02 aprovada em G0: oito blocos/16h, 38 cenários, laboratório local/instalável e vinte fontes primárias; currículo-base atualizado para 137 blocos/274h;
- projeção com M02A ajustada para 152 blocos/304h; próxima unidade: regenerar HTML e construir o laboratório executável do M02.
- critérios de aceite foram persistidos em `CLAUDE.md` e no novo `AGENTS.md`: padrão M00, régua N1–N5, gates G0–G6, fontes primárias/agnosticismo, evidência real e revisão do orquestrador;
- M02 regenerado para oito blocos/16h no padrão M00/M01: 9.060 palavras visíveis, 36 blocos de código, 20 fontes distintas, 11 âncoras válidas e zero overflow horizontal em 1280 px;
- laboratório M02 revisado pelo orquestrador: distribuição `csv-cleaner`, import package `python_senior_lab`, dependency group alinhado, caso CSV excedente corrigido e 51 testes aprovados nos runtimes CPython 3.14/3.14t;
- Ruff, mypy strict, build e instalação limpa do wheel aprovados; import confirmado em `site-packages`; G0–G6 aprovados após revisão visual desktop, mobile e impressão.
- lote complementar M02 fechou lock stale, wheel incompleto, import circular, Any leak, starvation local, comparação loop/thread/process/interpreter, corrida por estado compartilhado, catálogo de defeitos de IA, não-hashable, backpressure ausente, task sem ownership, pico de memória, mutação controlada, matriz 3.14t/extensão e execução Linux; matriz passou a 38 cenários verificados/0 parciais/0 pendentes.
- overflow móvel causado por `code` inline foi corrigido; a viewport real de 390 px ficou sem rolagem horizontal e a impressão de 52 páginas foi revisada por amostras e folha de contato integral; M02 promovido a VERIFICADO.

### 14/08/2026

- carga curricular ampliada de 222h para 270h;
- mantidos 14 módulos e adicionados LT01–LT04;
- Python confirmado como linguagem canônica;
- neutralidade tecnológica transformada em contrato verificável;
- M12 e M13 classificados como bloqueados para estudo;
- criada separação entre progresso editorial e progresso do aluno.
- M12 especificado em nove blocos, com 24 testes de aceitação e G0 aprovado;
- M13 especificado em vinte marcos, com 30 cenários de aceitação e G0 aprovado;
- LT01 especificado em seis blocos, com 18 cenários de aceitação e G0 aprovado;
- LT02 especificado em seis blocos, com 25 cenários de aceitação, agenda determinística de falhas e G0 aprovado;
- LT03 especificado em seis blocos, com 29 cenários de aceitação, sandbox local e G0 aprovado;
- LT04 especificado em seis blocos, com 34 cenários, sete gates de release e G0 aprovado;
- marco R1 verificado: M12, M13 e LT01–LT04 possuem especificação detalhada/G0;
- próxima unidade alterada para R2.1 — regeneração integral do M12.
- R2.1 iniciada: HTML M12 regenerado com cerca de 13 mil palavras, nove blocos, 28 exemplos, 27 resultados observáveis, 15 diagnósticos e 14 perguntas;
- laboratório M12 criado com contratos agnósticos para segurança, autorização, idempotência, quota, budget, billing e SRE;
- matriz M12-AT-001..060 criada com estados verificado/parcial/pendente e lacunas explícitas;
- gates determinísticos do lab aprovados em Python 3.14.7: Ruff, mypy strict e 41 testes; teste PostgreSQL está pendente por ausência de Docker no ambiente;
- runtime seguro, schemas fechados, telemetria sanitizada, data planes tenant-aware, reconciliação pós-timeout, projection de entitlement e exclusão coordenada adicionados ao lab M12;
- fontes primárias de M12 revalidadas; OpenTelemetry Semantic Conventions atualizada para 1.44.0;
- M12 permanece bloqueado para estudo até a execução PostgreSQL e decisão formal de G1–G6.
- R2.2 iniciada em paralelo ao bloqueio ambiental de M12: M13 antigo auditado (1.149 palavras, cinco seções, zero código/resultados observáveis);
- rastreabilidade M13 criada para vinte blocos, seis lotes e trinta cenários CAP-*; próximo lote R2.2-A cobre release contract e baseline reproduzível.
- R2.2-A produzido: release contract, risk register, trace CSV e scaffold Python 3.14; Ruff/mypy e 6 testes passam, PostgreSQL permanece bloqueado sem Docker;
- nova prioridade registrada em `docs/PRIORIDADE-M00-M02-ENG-SENIOR-2026.md`: M00 → M01 → M02 → M02A;
- G0 do M02A aprovado em 15/08/2026: 15 blocos/30h, 60 competências, 45 cenários, Python 3.14 canônico, .NET 10 como ponte limitada e produto `work-intake`; currículo-base consolidado em 152 blocos/304h.
- M02A planejado com 15 blocos/30h para engenharia de software sênior, Python 3.14, .NET 10 e sistemas com IA; após a ampliação aprovada do M02, a projeção curricular passa a 304h.
- M00 auditado e regenerado com núcleo agnóstico, Agent Skills, MCP 2026-07-28 e adapters Codex/Claude Code/Copilot;
- lab M00 aprovado em Python 3.14.7: Ruff, mypy estrito e 18 testes, incluindo cliente MCP v2 in-memory; HTML com 4.037 palavras e 13 fontes externas distintas;
- gates M00: G0–G5 aprovados no escopo; G6 parcial porque a política do navegador bloqueou a revisão de `file://`.
- M01 auditado: 10.316 palavras, 16 blocos de código, 21 resultados e zero links externos no HTML; estrutura será preservada, mas comandos Git, cross-platform, fontes e claims exigem regeneração.
- especificação M01 G0 aprovada: cinco blocos, 22 cenários e fontes primárias para Spec Kit, Git, tooling Python, SSDF e SLSA; 12-Factor Agents rotulado como practitioner guide.
- revisão independente de fontes do M01 concluída; afirmações foram separadas entre especificação/norma, documentação oficial de implementação e practitioner guidance;
- laboratório base do M01 produzido com contrato tipado, schema 2020-12, drift conservador, runner sem shell, workflow retomável, política por hash/allowlist, adapters portáteis e sandbox Git descartável;
- gates do lab M01 aprovados em Python 3.14.7: Ruff format/lint, mypy estrito em 21 arquivos e 27 testes, incluindo worktrees e merges Git reais;
- os 22 cenários do M01 receberam núcleo executável: type error, mutante, timeout, policy externa, pause/resume, Spec Kit snapshot e Capstone rastreado;
- rastreabilidade M01 criada; G0/G2/G4/G5 aprovados no lab e G1/G3/G6 dependentes da regeneração e revisão do HTML.
- HTML M01 regenerado com 9.049 palavras, 18 blocos de código, 21 resultados observáveis e 20 links externos (14 destinos distintos) classificados;
- práticas antigas inseguras removidas: `git add -A`, cleanup por paths relativos, Bash obrigatório, `.claude/skills` e spec como autoridade automática;
- G1/G3 aprovados após revisão do orquestrador; G6 aprovado com tags balanceadas, fontes acessíveis, CSS móvel, dois SVGs nomeados, zero overflow horizontal e revisão visual via localhost.
- padrão composto de qualidade técnica e didática criado: M00 permanece referência visual, mas não é autoridade única; especificação, rastreabilidade, N1–N5, G0–G6, evidência executada, acessibilidade, recuperação ativa e transferência governam cada módulo;
- correção focal do M00 restaurou slash como interface não portátil, separada de skill, prompt, comando embutido, MCP e ACP; o contrato portátil `finish-study-block`, seus adapters e cinco novos cenários foram registrados;
- M00 passou a 4.595 palavras visíveis, 70 ocorrências de `code` e 18 destinos externos distintos; Ruff, mypy e 18 testes continuam verdes, mas G6 permanece parcial porque a política do navegador bloqueou a inspeção de `file://`;
- iniciativa da futura plataforma integrada registrada somente em descoberta: o acervo atual não possui aplicação integrada e PRD/arquitetura ficam condicionados à revisão do código e entrevista do aluno.
