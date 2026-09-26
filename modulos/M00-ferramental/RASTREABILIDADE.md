# Rastreabilidade do M00

**Data-base:** 14/08/2026 · **Especificação:** `docs/especificacoes/M00-ESPECIFICACAO.md`

## Competências por bloco

| ID | Resultado observável | Evidência | Estado |
|---|---|---|---|
| M00-B01-C01 | separar modelo, cliente, harness, tool, ambiente e processo | diagrama/explicação no HTML | PRODUZIDO |
| M00-B01-C02 | explicar limites do modelo mental sem memória implícita | checkpoint 2 | PRODUZIDO |
| M00-B01-C03 | decidir workflow ou autonomia por risco | matriz + tabela guiada de oito cenários em `M00.html` §1.3 | PRODUZIDO |
| M00-B01-C04 | escrever task contract | exemplo resolvido + artefato do aluno no checkpoint | PRÁTICA GUIADA |
| M00-B02-C01 | criar instrução canônica portátil | `AGENTS.md` do aluno | PRÁTICA GUIADA |
| M00-B02-C02 | manter adapters mínimos por produto | tabela Codex/Claude/Copilot | PRODUZIDO |
| M00-B02-C03 | aplicar Agent Skills/progressive disclosure | skill do aluno | PRÁTICA GUIADA |
| M00-B02-C04 | selecionar contexto sob orçamento | `context.py` + testes | VERIFICADO |
| M00-B02-C05 | registrar inclusão e omissão | `context-demo` | VERIFICADO |
| M00-B03-C01 | separar instrução, capability, aprovação e identidade | tabela + checkpoint | PRODUZIDO |
| M00-B03-C02 | aplicar menor privilégio | `policy.py` | VERIFICADO |
| M00-B03-C03 | conter conteúdo não confiável | testes negativos | VERIFICADO |
| M00-B03-C04 | impedir path escape | canonicalização + teste | VERIFICADO |
| M00-B03-C05 | restringir processo por allowlist | comparação de argv + testes | VERIFICADO |
| M00-B04-C01 | escolher instruction/skill/hook/delegate/MCP | matriz de responsabilidade | PRODUZIDO |
| M00-B04-C02 | validar formato aberto de skill | especificação e prática | PRÁTICA GUIADA |
| M00-B04-C03 | distinguir tool/resource/prompt | tabela MCP | PRODUZIDO |
| M00-B04-C04 | implementar capability MCP v2 | função pura + cliente oficial in-memory | VERIFICADO |
| M00-B04-C05 | versionar integração | contrato `MCP 2026-07-28`, `mcp>=2,<3` | VERIFICADO |
| M00-B04-C06 | distinguir slash/UI de skill, prompt e comando embutido | matriz Claude/Codex/Copilot + ACP | PRODUZIDO |
| M00-B04-C07 | mapear ação portátil para dois adapters | contrato `finish-study-block` + prática | PRÁTICA GUIADA |
| M00-B05-C06 | diagnosticar descoberta, argumentos e efeitos divergentes | diagnóstico + checkpoint | PRODUZIDO |
| M00-B05-C01 | executar loop operacional completo | checklist inspect-plan-change-verify-review-evidence | PRODUZIDO |
| M00-B05-C02 | reconhecer condição de parada | seção 5.2 | PRODUZIDO |
| M00-B05-C03 | avaliar harness por repetição | scorecard | PRÁTICA GUIADA |
| M00-B05-C04 | controlar variáveis da comparação | seção 5.3 | PRODUZIDO |
| M00-B05-C05 | produzir handoff com evidência | entregáveis/checkpoint | PRÁTICA GUIADA |

## Cenários de aceitação

| ID | Evidência | Estado em 14/08/2026 |
|---|---|---|
| M00-AT-001 | contrato válido | VERIFICADO |
| M00-AT-002 | path escape negado | VERIFICADO |
| M00-AT-003 | untrusted + write negado | VERIFICADO |
| M00-AT-004 | comando fora da allowlist negado | VERIFICADO |
| M00-AT-005 | orçamento não excedido e omissão registrada | VERIFICADO |
| M00-AT-006 | ausência de `AGENTS.md` detectada | VERIFICADO |
| M00-AT-007 | evidência ausente detectada | VERIFICADO |
| M00-AT-008 | protocolo/dependência versionados | VERIFICADO |
| M00-AT-009 | skill aberta válida | PENDENTE — artefato do aluno |
| M00-AT-010 | tool MCP testada sem LLM | VERIFICADO — cliente oficial v2 in-memory, sucesso e path escape |
| M00-AT-011 | tarefa determinística classificada | PENDENTE — exercício do aluno |
| M00-AT-012 | delegação limitada | PENDENTE — exercício do aluno |
| M00-AT-013 | prompt injection sem capability perigosa | VERIFICADO pela policy |
| M00-AT-014 | scorecard com repetições | PENDENTE — prática do aluno |
| M00-AT-015 | checkpoint explicado e demonstrado | PENDENTE — avaliação do aluno |
| M00-AT-016 | contrato `finish-study-block` completo | PRODUZIDO — exemplo trabalhado |
| M00-AT-017 | dois adapters preservam contrato | PENDENTE — artefato do aluno |
| M00-AT-018 | argumento/fonte ausente falha explicitamente | PRODUZIDO — diagnóstico/caso negativo |
| M00-AT-019 | escrita/stage/commit exigem aprovação | PRODUZIDO — contrato e checkpoint |
| M00-AT-020 | taxonomia por mecanismo e autoridade | PRODUZIDO — matriz 4.2 |

## Gates editoriais e técnicos

| Gate | Estado | Evidência / bloqueio |
|---|---|---|
| G0 · Escopo | APROVADO | especificação, fontes e 20 cenários |
| G1 · Conteúdo | APROVADO | HTML regenerado; teoria, trade-offs, anti-padrões e diagnóstico |
| G2 · Execução | APROVADO | Python 3.14.7, Ruff, mypy e 18 testes verdes; adapter testado pelo cliente MCP oficial |
| G3 · Avaliação | APROVADO PARA OFERTA | 12 questões cobertas + evidências; execução depende do aluno |
| G4 · Portabilidade | APROVADO | núcleo agnóstico, Agent Skills/MCP e três adapters comparados |
| G5 · Produção | APROVADO NO ESCOPO | menor privilégio, path, allowlist e falhas cobertos; MCP remoto é M09/M12 |
| G6 · Editorial | PARCIAL | parser e métricas aprovados; revisão visual/links HTTP ainda pendentes |

## Revisão didática de 20/08/2026

Esta revisão registra autoria e compreensão; ela não altera a aprovação dos gates acima nem transforma práticas do aluno em evidência executada.

| ID | Mudança aplicada no HTML | Evidência editorial | Estado |
|---|---|---|---|
| DID-M00-001 | exemplo de uma correção que atravessa cliente, harness, modelo, tool, ambiente e processo | seção 1.1 separa causas por camada antes de propor troca de modelo | APLICADO |
| DID-M00-002 | fluxo trabalhado de instrução de repositório, skill e descoberta, com diagnóstico | seção 2.1 liga arquivo, tarefa, sintoma, evidência e correção | APLICADO |
| DID-M00-003 | leitura inline de chamadas Python, argumentos nomeados, coleção imutável, path, decorador, anotações e comandos PowerShell | seções 2.4, 3.4, 4.4 e 5.4 | APLICADO |
| DID-M00-004 | cenário de conteúdo hostil e distinção entre instrução, capability, aprovação e identidade | seção 3.1 e caso negativo do laboratório | APLICADO |
| DID-M00-005 | trace host → schema → função → resposta para MCP e explicação do adapter Python | seções 4.3–4.4 | APLICADO |
| DID-M00-006 | diagnóstico adicional para instruções e execução do gate | seções 2.1 e 5.4 | APLICADO |
| DID-M00-007 | panorama datado de prática vigente, com limite metodológico e ferramentas separadas do núcleo | seção 1.5 e fonte industrial Octoverse 2025 | APLICADO |

Documento de auditoria: `docs/auditorias/M00-DIDATICA-2026-08.md`.

## Reestruturação do laboratório em 21/08/2026

Esta mudança não promove gates nem transforma a execução do aluno em evidência editorial. Ela altera a forma de chegar à prática: leitura primeiro, laboratório único no fim e checkpoint somente depois da montagem.

| ID | Mudança aplicada | Competências e cenários cobertos | Evidência | Estado |
|---|---|---|---|---|
| LAB-M00-001 | comandos e práticas manuais removidos dos blocos 1–4; exemplos permanecem no texto como leitura aplicada | B01–B04 | `M00.html` só contém comandos de execução após `#lab` | APLICADO |
| LAB-M00-002 | seção final guiada reconstrói contrato, seleção de contexto e policy em ordem causal | AT-001..007, AT-013 | código copiável + saída esperada + diagnóstico por passo | APLICADO |
| LAB-M00-003 | script cria cópia temporária nova, marcada e sem ambientes/caches locais; o roteiro nunca altera a referência | G2, G5 | `lab/create_working_copy.py` | VERIFICADO |
| LAB-M00-004 | lint, tipagem e testes passam a ser oráculos de software, não perguntas de avaliação durante a prática | AT-001..010, AT-013 | texto do laboratório e checkpoint separado | APLICADO |
| LAB-M00-005 | adapter MCP fica depois da função de domínio e do contrato local; Inspector é extensão opcional | AT-008, AT-010 | sequência do laboratório e limite declarado | APLICADO |

Execução da cópia de referência em 21/08/2026: CPython 3.14.7; `uv sync --locked --offline --extra dev --extra mcp`; Ruff sem achados; mypy estrito sem issues em 13 arquivos; 18 testes `OK`, incluindo os dois testes MCP in-memory. A cópia foi criada em `%TEMP%/tutor-ia-codex-labs/` e possui marcador `.course-lab-workspace` com `M00`.

## Execução registrada

```text
Python 3.14.7
Ruff: All checks passed!
mypy: Success: no issues found in 13 source files
unittest: Ran 18 tests in 4.793s — OK
HTML após a correção focal de slash: 4.595 palavras visíveis; 70 ocorrências de `code`; 36 links, sendo 30 externos para 18 destinos distintos; 20 aberturas e 20 fechamentos de `div`; seção de slash e contrato `finish-study-block` presentes. A revisão visual permanece pendente porque a política do navegador bloqueou `file://`.
```

M00 permanece `EM REVISÃO`, não `VERIFICADO`, até fechar G6 visual. O Inspector é prática do aluno; a interoperabilidade programática do adapter já foi verificada com o cliente oficial in-memory. As práticas marcadas como “do aluno” são critérios de aprendizagem, não bloqueios editoriais do curso.

## Revisão editorial — 12/09/2026

O HTML principal recebeu explicações independentes de outra stack, remoção de duração obrigatória, links por seção e aviso de prontidão. A navegação permite leitura e prática no ritmo do aluno. O verificador editorial examinou estrutura, destinos locais e âncoras; não executou laboratórios nem certificou fontes externas ou apresentação visual. Os resultados técnicos anteriores permanecem históricos; G6 da apresentação revisada continua pendente.


## Execução focal M00-B01-L — autoria original `01a0de8b-ffd8-72d2-800e-ffb966485ed6`; correção `01a0dea7-003e-7262-8bbd-4ed3faf5d5e2`

Na revisão independente, foi encontrada divergência entre o resultado de task contract prometido no HTML e o contrato JSON, que não exigia objetivo, escopo, capacidades nem condições de parada. A correção adicionou esses campos à validação, fixture, teste e trecho copiável do laboratório. Reexecução com Python 3.14.7: contrato válido; inválido retorna dez violações/exit 1; 19 testes OK; Ruff check e mypy estrito aprovados; `ruff format --check src tests` aprovado; JSON válido; checker M00: 1 documento/0 erros; backlog: 699/0. A evidência anterior de bootstrap bloqueado por `mypy==1.20.2` ausente no cache segue válida como limitação, não como aprovação. Nenhum AT/gate promovido; a correção deste RUN aguarda revisão independente.
