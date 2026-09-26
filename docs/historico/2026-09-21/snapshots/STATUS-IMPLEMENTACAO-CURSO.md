# Status da implementação do curso

**Atualizado em:** 14/09/2026 · **Release-alvo:** v4.0 · **Escopo estimado:** 152 blocos / 304h

Este é o único placar de implementação e de prioridade operacional. Blocos são unidades de conteúdo, não sessões obrigatórias. O histórico de aprendizagem permanece em `PROGRESSO.md`; seus números antigos não representam o currículo vigente.

## Decisões permanentes aplicáveis

- Público independente de stack de origem; ensinar Python com problema, definição, mecanismo, exemplo e limite, sem analogias recorrentes com .NET.
- Ritmo livre, sem método de estudo, duração de sessão, aquecimento, diário, commit ou quota obrigatórios.
- Laboratório guiado reunido no final, retomável e separado do checkpoint; autor implementa e verifica o exemplo junto com a teoria.
- Prontidão explícita e evidência real. Mudar escopo ou apresentação não promove gates e pode exigir revalidação.
- Regras em `CLAUDE.md`, fluxo/régua em `PADRAO-QUALIDADE-TECNICA-DIDATICA.md`, fontes na política, escopo no currículo/especificações e evidência nas rastreabilidades. Não criar planos concorrentes.
- O detalhamento executável único está em [`BACKLOG-OPERACIONAL-V4.md`](BACKLOG-OPERACIONAL-V4.md). Ele define tarefas, dependências e aceite, mas não altera o estado desta tabela nem aprova gates.

## Estado por módulo e laboratório

| Item | Horas estimadas | Estado | Próxima ação |
|---|---:|---|---|
| M00 | 10h | EM REVISÃO; G0–G5 históricos aprovados, G6 parcial | concluir QA visual da revisão didática e verificar companion legado |
| M01 | 10h | EM REVISÃO EDITORIAL; baseline G0–G6 de agosto preservado | revalidar G6 após revisão de setembro; lab não alterado |
| M02 | 16h | EM REVISÃO EDITORIAL; baseline técnico preservado | revalidar apresentação G6 e checkpoint revisado; 38 ATs técnicos preservados |
| M02A | 30h | G0 v1.2; G1 aprovado; G2/G4/G5 parciais; G3/G6 pendentes | trilha live (PG/.NET/Windows) e QA visual; próxima unidade M12 |
| M03 | 16h | G0 aprovado; B01 produzido; G1 em produção | produzir B02 com laboratório executável e evidência PostgreSQL |
| M04 | 8h | LEGADO EM REVISÃO | fechar escopo/rastreabilidade e construir depois de M03 |
| M05 | 14h | LEGADO EM REVISÃO | construir depois de M04; integrar LT02 |
| M06 | 12h | LEGADO EM REVISÃO | construir depois de M05; estatística/calibração |
| M07 | 16h | LEGADO EM REVISÃO | construir depois de M06; autorização/evals |
| M08 | 16h | LEGADO EM REVISÃO | construir depois de M07; contratos e adapters |
| M09 | 14h | LEGADO EM REVISÃO | construir depois de M08; MCP/A2A |
| M10 | 20h | LEGADO EM REVISÃO | construir depois de M09; durabilidade/grafos |
| M11 | 16h | G0/G1/G3/G4 aprovados; G2/G5 parciais; G6 pendente | revalidar QA visual G6 e executar trilha live (Ollama/PG) quando houver Docker |
| M12 | 18h | EM PRODUÇÃO / BLOQUEADO PARA ESTUDO | G1/G4 históricos aprovados; PostgreSQL, E2E, game day e G6 pendentes |
| M13 | 40h | EM PRODUÇÃO / BLOQUEADO PARA ESTUDO | R2.2-A produzido; Docker/PostgreSQL e integração restantes |
| LT01–LT04 | 48h | ESPECIFICADOS / G0 aprovado | produzir material e laboratórios conforme dependências |

Resultados de execução registrados: M00, 18 testes; M01, 27 testes; M02, 51 testes; M02A, 40 testes no slice local. São evidências históricas descritas nas rastreabilidades, não execuções de setembro. A release v4.0 não está pronta.

## Unidade ativa e sequência

**Diagnóstico solicitado em 21/09/2026:** [análise de completude, didática e profundidade](../../../auditorias/STATUS-DIDATICA-PROFUNDIDADE-2026-09-21.md) reproduziu dois achados P1: PRR M13 aceita diretórios vazios/recuperação malsucedida; gate M06 aceita categorias de segurança ausentes. Há correções estatísticas e divergências nos relatórios REL. Release não pronta; nenhum gate promovido; esta análise não constitui REL-06. Tratar no backlog vigente antes do fechamento.

**REL-01 CONCLUÍDO (21/09/2026):** auditoria de cobertura em [`REL-01-auditoria-cobertura.md`](../relatorios/REL-01-auditoria-cobertura.md) — 19 specs G0 ✓, check_course 0 erros nos 19 HTMLs, labs executados (M01 com 1 falha; M12/M13 BLOQUEADOS; M02 único COMPLETO).

**MEGA-LOTE Tier 1 (21/09/2026):** [`REL-02`](../relatorios/REL-02-execucao-limpa.md) (19/19 labs limpos, 1.092 testes, 0 falhas; correções triviais justificadas em M00/M01), [`REL-04`](../relatorios/REL-04-freshness.md) (10 itens de frescor, 7 REVALIDAR-EM-DEVICE) e [`REL-05`](../relatorios/REL-05-revisao-integrada.md) (consolidação G0–G5; resíduo = Docker/rede/humano/G6/Astra) concluídos.

**Unidade ativa: revisão E de M03/M05–M10 concluída (14/09/2026: labs
re-executados e verdes no slice, QA estático — links, âncoras, foco,
tabelas, print, fontes — sem erros; G1/G3–G6 seguem pendentes de revisão
profunda; visual em device pendente).** LT03 concluído B01–B06+E
(14/09/2026, protocolo Tier 1: 81 testes verdes, ruff+mypy limpos,
verbatim 8/8, check_course 0 erros; G1/G3 APROVADOS, G2/G4/G5
PARCIAIS, G6 PENDENTE).** LT04 concluído B01–B06+E
(14/09/2026, protocolo Tier 1: 28 testes verdes, ruff+mypy limpos,
verbatim 6/6, check_course 0 erros; 10 pontes parciais + 23 spec-ATs
ESPECIFICADOS registrados na trace; G1/G3 APROVADOS, G2/G4/G5
PARCIAIS, G6 PENDENTE).** M04 verify-only + E-QA fechados
(14/09/2026: 15 testes, gates limpos, verbatins OK; gates formais
guardam revisão final).** M13-capstone executado (4 épicos, 20/20
blocos, 125 testes verdes, verbatims conferidos, TOC/CSS/serve OK;
B19 piloto BLOCKED honesto sem humano; E GO com travas honestas;
G6 final pendente).** REL-01..05 executados (21/09/2026: auditoria,
execução limpa 1.092 testes, freshness, revisão integrada, G6-a11y
automatizado).** Restam: **QA visual em device + REL-06 (Astra)**
(liberado pelo DAG via M03-E; Docker ausente: broker/PG como BLOCKED).

Fila: **M02A B07–B15 → M12 → M13 → LTs → REL-01..05 → REL-06**. M12/M13
e LT01–LT04 mantêm seus bloqueios e dependências próprios. Docker ausente:
testes PG/container registram BLOCKED, nunca skip verde nem SQLite
fingindo ser PG.

## Migração didática e automação

| ID | Trabalho | Estado / evidência |
|---|---|---|
| DID-01 | independência de stack e ritmo livre nas regras/tutoria | APLICADO em AGENTS, CLAUDE, padrão, política, currículo, README e skill tutor-ia |
| DID-02 | simplificar documentos concorrentes | APLICADO; sete documentos removidos após consolidação; histórico e evidências preservados |
| DID-03 | substituir exigência .NET do M02A | ESCOPO APLICADO em v1.2; B14/AT-006/010/022/040 requerem execução revisada, sem promoção automática |
| DID-04 | adequar M00/M01/M02/M02A/M03 | explicações comparativas substituídas, clocks removidos e links de retomada/prontidão adicionados; QA G6 pendente |
| DID-05 | adequar M04–M11 e material complementar legado | PENDENTE na fila curricular; substituir analogias por explicações completas, remover rituais, rever práticas e checkpoints |
| DID-06 | corrigir exemplo e laboratório simultaneamente | REGRA APLICADA; próxima execução em M03 B02, sem declarar lab inexistente como pronto |
| DID-07 | verificar links, anchors e padrões legados automaticamente | APLICADO: 6 testes aprovados; 80 documentos sem erros estruturais/links; 175 ocorrências legadas para revisão contextual. `tools/check_course.py` não substitui G1–G6 |
| DID-08 | verificar correspondência HTML/código e cobertura de checkpoint | revisão manual exigida; extração/ligação automática por exemplo ainda PENDENTE |
| DID-09 | coletar feedback sobre compreensão e retomada | disponível quando houver estudo real e solicitação/relato; nenhum dado ou ganho inventado |

O relatório do verificador expõe problemas do legado. Não há baseline de erros suprimidos para simular um curso pronto. M01/M02 guardam a aprovação histórica, mas a edição atual exige revalidação editorial. A ausência de .NET no texto não comprova sozinha didática suficiente.

## Governança documental e limpeza de setembro

| Documentos removidos | Destino do que permanece necessário |
|---|---|
| `implementation_plan.md`, `PLANO-ESTRUTURACAO-CURSO-2026.md`, `PRIORIDADE-M00-M02-ENG-SENIOR-2026.md` | escopo no currículo/especificações; fila, marcos e decisões neste status |
| `GUIA-REGENERACAO-MODULOS.md` | contrato e fluxo no padrão composto; fontes na política/especificações; eliminadas quotas de palavras e analogias |
| `comparativo-fullcycle.md`, `gaps-e-projetos.md`, `ideias-fora-da-caixinha.md` | conteúdo comercial/pessoal fora do escopo; produto curricular mantido em `projeto-final.md` |

`como-estudar.md` permanece curto para compatibilidade com links do diário, sem método prescritivo. Auditorias, especificações, rastreabilidade, ADRs, fixtures, labs e trabalho pessoal em `.claude/` permanecem úteis. A skill de tutoria foi atualizada por orientar futuras respostas; a skill pessoal de revisão e os hooks não foram substituídos.

## Marcos de entrega

| Marco | Estado |
|---|---|
| R0 — fundação documental | definida; consolidada em setembro |
| R1 — especificações M12/M13/LT01–LT04 | G0 histórico aprovado |
| R2 — M12/M13 e integração crítica | em produção, com bloqueios |
| R3 — laboratórios transversais | material e execução pendentes |
| R4 — atualização do acervo | em andamento; fila M03–M11 |
| R5 — automação | verificador editorial inicial; pipeline integral pendente |
| R6 — release v4.0 | pendente: zero bloqueadores e G0–G6 completos |

Riscos ativos: conteúdo extenso sem prática, fontes mutáveis, exemplos sem execução, divergência entre documentos, esforço de retomada e validação parcial interpretada como release pronta. A mitigação é produzir por competência e evidência, manter uma fonte por decisão e corrigir o material com feedback observado.

## Decisão de 12/09/2026

Mudança autorizada pelo usuário: ampliar o público além da origem .NET; substituir método rígido por material acessível no tempo disponível; consolidar memória, especificações e andamento; excluir documentos desnecessários. As evidências históricas abaixo não são regras vigentes nem novas execuções. Resultados de estudo não foram alterados.

## Verificação da revisão de setembro

- `python3 -m unittest discover -s tools -p 'test_*.py'`: seis testes aprovados.
- `python3 tools/check_course.py`: 80 documentos, zero erros estruturais/de links; 175 ocorrências para revisão contextual, incluindo registros históricos.
- `PROGRESSO.md` preservado byte a byte em relação ao início da revisão.
- Laboratórios não reexecutados; QA visual permanece pendente.
- Validação automática da skill `tutor-ia` pendente: `quick_validate.py` exige PyYAML, ausente nos runtimes e no cache offline.

## Changelog

### 21/08/2026

- lote B01 do M03 produzido: cabeçalho e mapa revisados; HTTP, ASGI, FastAPI, OpenAPI, `Depends`, lifecycle, erros e correlation id foram reescritos com exemplo conceitual, contraste, diagnóstico e fontes. As práticas manuais do bloco foram removidas e AT-001–004 continuam pendentes até o laboratório executável;
- G0 do M03 aprovado: especificação, 32 cenários, fontes, produto `link-shortener`, laboratório local com PostgreSQL/Docker e limite explícito para deploy externo foram registrados; B01 entra em produção, sem promoção de G1–G6;
- prioridade editorial redefinida por decisão do aluno: M03–M11 passam à frente. O M02A mantém B01–B06 produzidos; B07–B15, a ponte .NET e os gates remanescentes ficam para o ciclo de finalização;
- contrato permanente de laboratório guiado registrado em `CLAUDE.md` e na régua técnica-didática: leitura com exemplos primeiro, uma prática manual ao final, cópia de trabalho temporária e checkpoint separado;
- primeiro lote aplicado ao M00: práticas e comandos soltos foram concentrados no `Laboratório guiado M00`; contrato, seleção de contexto e policy são reconstruídos por blocos completos em cópia marcada fora do repositório;
- a referência M00 foi copiada para `%TEMP%`, sincronizada em modo locked/offline com os extras versionados e validada em CPython 3.14.7: Ruff e mypy verdes, 18 testes aprovados incluindo MCP in-memory;
- rastreabilidade e auditoria específicas da mudança foram registradas. G6 do M00 continua parcial; nenhum gate foi promovido por esta alteração didática.
- segundo lote aplicado ao M01: práticas intermediárias passaram a ser exemplos e cenários; o laboratório final agora cria cópia de trabalho, reconstrói a classificação de drift, executa contrato/runner/workflow/Git e deixa o checkpoint posterior;
- a cópia de referência M01 foi validada em CPython 3.14.7 no modo locked/offline: Ruff, mypy estrito e 27 testes, incluindo worktrees e merges Git reais, aprovados. G0–G6 mantêm sua classificação anterior.
- terceiro lote aplicado ao M02: `csv-cleaner` ganhou laboratório final com cópia de trabalho, reconstrução da boundary Pydantic, CLI feliz/negativa, evidência e gates; a arquitetura do bloco 8 permanece como referência de leitura;
- a cópia de referência M02 exclui artefatos de ambientes de wheel anteriores e foi validada em CPython 3.14.7 locked/offline: Ruff, mypy estrito e 51 testes aprovados; nenhum gate foi reclassificado.
- limpeza complementar do M02 concluída: blocos 1–7 agora apresentam leitura aplicada, cenários, código de referência e diagnósticos; a varredura estática confirmou zero passos executáveis e zero títulos de prática antes de `Laboratório guiado M02`, que continua antes do checkpoint.
- lote B03 do M02A produzido: modularidade, domínio, portas/adapters, composition root e custo de abstração foram ligados aos oráculos reais do `work-intake`; o contrato de adapter agora rejeita precondição fortalecida, e o panorama de prática vigente distingue sinal industrial de fundamento;
- as práticas intermediárias de B01–B02 foram convertidas em leitura aplicada; o `Laboratório guiado M02A · lote B01–B03` cria cópia temporária marcada, percorre arquitetura, contrato, CLI e evidência, e encerra no gate offline. Ruff, mypy estrito, 35 testes e wheel passaram; G2 permanece parcial e G3–G6 pendentes.
- lote B04 do M02A produzido: contratos sintáticos, semânticos e operacionais; trust boundary; matriz v1/v2; representação de tempo, decimal, enum, UTF-8 e erro; a prática final foi deslocada após o novo bloco e passou a executar o corpus de contratos. AT-010 continua pendente até a ponte .NET; os demais gates não foram reclassificados.
- lote B05 do M02A produzido: ownership, transação local, idempotência, isolamento por tenant, conflito concorrente e query plan foram conectados a oráculos SQLite. O laboratório foi deslocado após B05 e passou a executar esses testes; gate offline completo passou com Ruff, mypy estrito, 37 testes e wheel. AT-012–017 são fortes apenas no slice SQLite; G2 continua parcial e G3–G6 pendentes.
- lote B06 do M02A produzido: batch `asyncio` bounded, overload explícito, TaskGroup, timeout e cancelamento com cleanup foram adicionados ao laboratório final. O gate offline passou com Ruff, mypy estrito em 31 arquivos, 40 testes e wheel; AT-018–021 são fortes no slice local, enquanto AT-022 aguarda a ponte .NET.

### 20/08/2026

- contrato de voz editorial e compreensão sem empobrecimento registrado em `CLAUDE.md` e no padrão técnico-didático: contexto antes de ferramenta, definição de terminologia no primeiro uso, mecanismo, decisão, limite, exemplo ou diagnóstico; não há teto de extensão para material necessário;
- política de fontes passou a exigir que panorama de prática vigente use sinal datado, método, população, limites e separação entre fundamento e adapter; adoção não é recomendação arquitetural;
- primeiro lote da revisão didática aplicado ao M00: exemplos trabalhados por camada, propósito operacional de instruções e skills, explicação inline da sintaxe Python pré-M02, cenário de segurança, trace MCP, diagnóstico de execução e panorama de mercado baseado no Octoverse 2025;
- auditoria `docs/auditorias/M00-DIDATICA-2026-08.md` e registro na rastreabilidade M00 criados; HTML estático permanece balanceado, âncoras resolvidas e a suíte local foi reexecutada com 18 testes aprovados. G6 continua parcial e nenhum gate técnico foi promovido.
- segundo lote da revisão didática aplicado ao M01: caso de SDD atravessa intenção, requisito, spec, plano, código e evidência; degradação de contexto agora exige sinais observáveis; 12-Factor é instrumento de decisão; paralelismo é delimitado por contrato e recursos; panorama industrial datado foi incluído;
- auditoria `docs/auditorias/M01-DIDATICA-2026-08.md` e rastreabilidade M01 atualizadas; HTML continua balanceado, com âncoras resolvidas e sem conectivos proibidos. Os 27 testes do laboratório foram reexecutados e aprovados; G0–G6 permanecem aprovados sem reclassificação.
- terceiro lote da revisão didática aplicado ao M02: panorama industrial datado para Python/packaging/qualidade, leitura guiada de `asyncio` e probe de free-threading, imports completos nos exemplos e contexto seguro antes de instalação remota;
- auditoria `docs/auditorias/M02-DIDATICA-2026-08.md` e rastreabilidade M02 atualizadas; HTML permanece balanceado, com âncoras resolvidas e sem conectivos proibidos. A suíte do laboratório foi reexecutada com 51 testes aprovados; G0–G6 permanecem aprovados sem reclassificação.

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
- nova prioridade registrada em documento de prioridade posteriormente consolidado neste status: M00 → M01 → M02 → M02A;
- G0 do M02A revisado para v1.1 em 15/08/2026: 15 blocos/30h, 60 competências e 60 cenários — quinze aceitações próprias para B01–B03 —, Python 3.14 canônico, .NET 10 como ponte limitada e produto `work-intake`; currículo-base consolidado em 152 blocos/304h.
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
- M02A G0 revisado para v1.1 após auditoria independente: quinze oráculos próprios foram adicionados para B01–B03, elevando a baseline a 60 competências e 60 cenários; AT-005 passou a afirmar somente propriedades verificáveis do manifesto;
- HTML inicial do M02A produzido para B01–B02: 4.564 palavras visíveis, 31 ocorrências de `code`, 14 fontes externas distintas, links internos íntegros e estrutura balanceada; QA visual/impressão permanece pendente;
- primeiro slice Python do `work-intake` aprovado pelo orquestrador em modo locked/offline: Ruff format/lint, mypy strict em 29 arquivos, 34 testes e wheel inspecionado; G2 permanece parcial porque o laboratório e o módulo ainda não cobrem todos os 60 cenários.
