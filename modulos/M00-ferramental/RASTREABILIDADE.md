# Rastreabilidade do M00

**Data-base:** 14/08/2026 · **Especificação:** `docs/especificacoes/M00-ESPECIFICACAO.md`

## Competências por bloco

| ID | Resultado observável | Evidência | Estado |
|---|---|---|---|
| M00-B01-C01 | separar modelo, cliente, harness, tool, ambiente e processo | diagrama/explicação no HTML | PRODUZIDO |
| M00-B01-C02 | explicar limites do modelo mental sem memória implícita | checkpoint 2 | PRODUZIDO |
| M00-B01-C03 | decidir workflow ou autonomia por risco | matriz + exercício de oito tarefas | PRODUZIDO |
| M00-B01-C04 | escrever task contract | artefato do aluno | PRÁTICA GUIADA |
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

## Execução registrada

```text
Python 3.14.7
Ruff: All checks passed!
mypy: Success: no issues found in 13 source files
unittest: Ran 18 tests in 4.793s — OK
HTML após a correção focal de slash: 4.595 palavras visíveis; 70 ocorrências de `code`; 36 links, sendo 30 externos para 18 destinos distintos; 20 aberturas e 20 fechamentos de `div`; seção de slash e contrato `finish-study-block` presentes. A revisão visual permanece pendente porque a política do navegador bloqueou `file://`.
```

M00 permanece `EM REVISÃO`, não `VERIFICADO`, até fechar G6 visual. O Inspector é prática do aluno; a interoperabilidade programática do adapter já foi verificada com o cliente oficial in-memory. As práticas marcadas como “do aluno” são critérios de aprendizagem, não bloqueios editoriais do curso.
