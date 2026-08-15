# Especificação do M00 — Harness engineering e trabalho seguro com IA

**Versão:** 1.0 · **Data-base:** 14/08/2026 · **Estado:** G0 APROVADO · **Carga:** 5 blocos / 10h

## 1. Resultado do módulo

Ao concluir o M00, o aluno deve configurar e defender um ambiente de engenharia assistida por IA que seja portável, observável e seguro. A aprovação exige evidência de que ele:

- distingue modelo, cliente, harness, workflow, agente, tool, skill, delegate e protocolo;
- escreve instruções de repositório curtas, executáveis e verificadas;
- escolhe contexto por relevância e orçamento, registrando o que foi incluído e omitido;
- concede apenas as capacidades necessárias e contém conteúdo não confiável;
- empacota um procedimento como Agent Skill aberta, sem prender o conhecimento a um fornecedor;
- expõe uma capability mínima por MCP 2026-07-28 e a testa antes de ligá-la a um modelo;
- executa uma mudança pelo ciclo inspect-plan-change-verify-review-evidence;
- compara duas configurações de harness por tarefas e critérios repetíveis.

## 2. Pré-requisitos e fora de escopo

Não há pré-requisito técnico. Python aparece apenas no laboratório orientado; o aprofundamento da linguagem é M02.

Ficam fora de escopo: construir agentes de produção, OAuth MCP remoto, orchestration multiagente, eval estatística de modelos e segurança completa. Esses temas pertencem a M06, M08, M09 e M12. O módulo também não promete produtividade por adoção de uma ferramenta.

## 3. Princípios inegociáveis

1. O padrão mental é agnóstico; convenção de produto é adapter documentado.
2. Instrução orienta. Sandbox e política de ferramentas impõem limites.
3. Conteúdo recuperado é dado não confiável, mesmo quando parece documentação.
4. Modelo propõe; comandos, testes, schemas e policies verificam.
5. “Funcionou uma vez” não é avaliação: a tarefa precisa de critério e repetição.
6. Contexto tem custo e risco, mas o comportamento deve ser medido no harness usado.
7. Automação determinística não deve ser substituída por decisão probabilística sem razão.
8. Nenhum comando de instalação, alteração externa ou efeito destrutivo é executado implicitamente.

## 4. Roteiro

### Bloco 1 · Sistema de trabalho: modelo, harness, workflow e agente

**Competências:** `M00-B01-C01..04`.

- desenhar as camadas entre usuário, harness, modelo, tools e ambiente;
- explicar o limite do modelo mental “requisição sem memória implícita”;
- escolher workflow determinístico ou autonomia por incerteza e custo de erro;
- decompor uma tarefa em contrato, contexto, autoridade e evidência.

**Prática:** classificar oito cenários e escrever um task contract com escopo, fora de escopo, comandos e critérios de parada.

**Resultado esperado:** nenhuma decisão usa “porque é mais moderno”; cada agente possui incerteza real que impede fluxo pré-definido.

### Bloco 2 · Instruções e contexto portáveis

**Competências:** `M00-B02-C01..05`.

- criar `AGENTS.md` como contrato canônico e adapters mínimos por produto;
- separar informação sempre necessária de procedimento sob demanda;
- aplicar progressive disclosure segundo Agent Skills;
- selecionar contexto por relevância, confiança, atualidade e orçamento;
- diagnosticar conflito e precedência sem assumir regra universal.

**Prática:** construir `AGENTS.md`, uma skill de revisão Python e um relatório de seleção de contexto.

**Resultado esperado:** comandos documentados são executáveis; arquivos específicos de fornecedor não duplicam o núcleo; contexto omitido é explicitado.

### Bloco 3 · Tools, delegação, permissões e conteúdo não confiável

**Competências:** `M00-B03-C01..05`.

- separar instrução, capacidade, aprovação e identidade;
- desenhar capabilities de leitura, escrita, processo e rede;
- aplicar menor privilégio a delegates e ferramentas;
- impedir path escape e combinação de leitura de segredo com egress;
- tratar prompt injection indireta como problema de autoridade, não apenas de texto.

**Prática:** executar a suíte do laboratório com casos negativos e justificar cada negação.

**Resultado esperado:** tarefa sobre conteúdo não confiável não recebe escrita, shell ou rede; path fora do workspace é negado deterministicamente.

### Bloco 4 · Skills, hooks e MCP sem aprisionamento

**Competências:** `M00-B04-C01..05`.

- diferenciar conhecimento/procedimento, evento determinístico e acesso externo;
- validar uma Agent Skill pelo padrão aberto;
- distinguir slash command como interface de invocação de skill, comando embutido, prompt reutilizável e prompt MCP;
- mapear uma ação portátil para dois adapters sem ampliar autoridade ou efeitos;
- mapear tool, resource e prompt pela primitiva que controla sua utilização;
- implementar servidor local com MCP Python SDK v2 e testá-lo in-memory/Inspector;
- versionar protocolo e dependência, registrando risco de obsolescência.

**Prática:** skill `review-python-transition`, hook local de lint e servidor MCP de progresso somente leitura.

**Resultado esperado:** testes da capability passam sem modelo; integração em um cliente é evidência adicional, não substituta.

### Bloco 5 · Loop operacional, avaliação e checkpoint

**Competências:** `M00-B05-C01..05`.

- executar inspect → plan → change → verify → review → evidence;
- interromper quando falta autoridade, dependência ou critério;
- montar conjunto mínimo de tarefas de avaliação de harness;
- comparar qualidade, intervenção, tempo, custo e violações;
- produzir um handoff que permita continuação sem reconstruir o contexto inteiro.
- diagnosticar descoberta, colisão de nomes, argumentos inválidos e divergência de efeitos entre adapters.

**Prática:** executar a mesma correção pequena em dois harnesses ou duas configurações isoladas e preencher scorecard.

**Resultado esperado:** comparação contém evidência e limitações; preferência pessoal não é apresentada como resultado experimental.

## 5. Cenários de aceitação

| ID | Cenário | Evidência |
|---|---|---|
| M00-AT-001 | contrato válido | `python -m harness_lab validate examples/harness.safe.json` retorna `VALID` |
| M00-AT-002 | path fora do workspace | policy retorna `DENY_PATH_ESCAPE` |
| M00-AT-003 | conteúdo não confiável com escrita | policy retorna `DENY_UNTRUSTED_CAPABILITY` |
| M00-AT-004 | comando fora da allowlist | policy retorna `DENY_COMMAND` |
| M00-AT-005 | orçamento de contexto | seleção não excede o limite e informa omissões |
| M00-AT-006 | instrução portátil ausente | validação falha sem `AGENTS.md` |
| M00-AT-007 | evidência ausente | validação falha sem comandos de verificação |
| M00-AT-008 | integração versionável | contrato exige revisão MCP e faixa do SDK |
| M00-AT-009 | skill aberta válida | frontmatter possui nome e descrição verificáveis |
| M00-AT-010 | MCP isolado | tool `course_progress` é testada sem LLM |
| M00-AT-011 | tarefa determinística | classificação recomenda workflow/hook e explica por quê |
| M00-AT-012 | tarefa aberta e limitada | delegação recebe escopo, ferramentas, limite e formato de retorno |
| M00-AT-013 | prompt injection indireta | conteúdo é tratado como dado; capability proibida permanece indisponível |
| M00-AT-014 | comparação de harness | scorecard possui pelo menos três repetições e registra intervenções |
| M00-AT-015 | checkpoint | aluno explica, roda, provoca falha e interpreta a evidência |
| M00-AT-016 | contrato portátil | `finish-study-block` declara invocador, inputs, reads, writes, aprovação, outputs e evidência |
| M00-AT-017 | dois adapters | dois hosts preservam intenção, inputs, outputs e política de efeitos |
| M00-AT-018 | argumento/fonte ausente | ação falha explicitamente sem inventar diário, estado Git ou próximo passo |
| M00-AT-019 | efeito sujeito a aprovação | adapter não escreve diário, não faz stage e não cria commit automaticamente |
| M00-AT-020 | taxonomia de invocação | aluno distingue built-in slash, prompt file, skill, hook, tool e prompt MCP por mecanismo e autoridade |

## 6. Fontes e risco de obsolescência

| ID | Fonte | Versão/data | Uso | Risco |
|---|---|---|---|---|
| SRC-M00-01 | [Agent Skills Specification](https://agentskills.io/specification) | consultada 14/08/2026 | formato portátil de skills | médio |
| SRC-M00-02 | [MCP Specification](https://modelcontextprotocol.io/specification/2026-07-28) | 2026-07-28 | protocolo normativo | alto |
| SRC-M00-03 | [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) | v2 estável | implementação Python | alto |
| SRC-M00-04 | [OWASP LLM01:2025](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) | 2025 | prompt injection/least privilege | médio |
| SRC-M00-05 | [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) | 1.0 + perfil GenAI | governança e risco | baixo |
| SRC-M00-06 | [DORA 2025](https://dora.dev/research/2025/dora-report/) | 2025 | impacto sociotécnico | médio |
| SRC-M00-07 | [Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md) | consultada 14/08/2026 | adapter Codex | alto |
| SRC-M00-08 | [Codex skills](https://developers.openai.com/codex/skills) | consultada 14/08/2026 | adapter Codex | alto |
| SRC-M00-09 | [Codex MCP](https://developers.openai.com/codex/mcp) | consultada 14/08/2026 | adapter Codex | alto |
| SRC-M00-10 | [Codex approvals](https://learn.chatgpt.com/docs/agent-approvals-security) | consultada 14/08/2026 | sandbox/approval Codex | alto |
| SRC-M00-11 | [Claude Code memory](https://code.claude.com/docs/en/memory) | consultada 14/08/2026 | adapter Claude | alto |
| SRC-M00-12 | [Claude Code features](https://code.claude.com/docs/en/features-overview) | consultada 14/08/2026 | skills/delegates/hooks | alto |
| SRC-M00-13 | [GitHub Copilot instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions) | consultada 14/08/2026 | adapter Copilot | alto |
| SRC-M00-14 | [Claude Code skills e custom commands](https://code.claude.com/docs/en/slash-commands) | consultada 15/08/2026 | slash como invocação; `.claude/commands` legado | alto |
| SRC-M00-15 | [Codex slash commands](https://learn.chatgpt.com/docs/reference/slash-commands) e [custom prompts deprecated](https://learn.chatgpt.com/docs/custom-prompts) | consultada 15/08/2026 | adapter Codex e migração para skills | alto |
| SRC-M00-16 | [GitHub Copilot customization](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/comparing-cli-features) | consultada 15/08/2026 | skills, prompt files e comandos por superfície | alto |
| SRC-M00-17 | [ACP v1 slash commands](https://agentclientprotocol.com/protocol/v1/slash-commands) | v1 consultada 15/08/2026 | transporte de comandos cliente↔agente, não formato de skill | alto |

Fontes de fornecedor sustentam apenas comportamento do respectivo produto. Conceitos gerais dependem do padrão aberto, de OWASP/NIST, de resultados executados ou de afirmação explicitamente marcada como heurística.

## 7. Gate G0

- [x] objetivos observáveis definidos;
- [x] cinco blocos e carga preservados;
- [x] práticas e evidências ligadas a cada bloco;
- [x] cenários positivos e negativos definidos;
- [x] fontes primárias/canônicas versionadas;
- [x] adapters de fornecedor separados do núcleo;
- [x] limites e temas posteriores explicitados.

**Decisão:** G0 aprovado. O material pode ser regenerado. G1–G6 permanecem independentes e só serão aprovados com conteúdo, execução, avaliação, portabilidade, segurança e revisão editorial.
