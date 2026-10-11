# M00 · Harness engineering e trabalho seguro com IA

**Fase 2** · 5 blocos / 10h · Pré-requisito: Fase 1 (M04). Estado: [STATUS](../../STATUS.md).

## Ordem de estudo

1. Leia [`M00.html`](M00.html), que é o material didático canônico.
2. Ao chegar ao fim do HTML, execute o **Laboratório guiado M00**. Ele cria uma cópia temporária, reconstrói as partes centrais do código com blocos copiáveis e explica cada validação.
3. Só depois faça o checkpoint no seu repositório de estudo.
4. Consulte a [especificação](../../docs/especificacoes/M00-ESPECIFICACAO.md) para competências e cenários de aceitação.

O arquivo `bloco-4-mcp-e-hooks.html` e os PDFs associados são históricos. Não use seus imports, comandos ou descrição do ciclo de vida MCP como referência atual.

## Referência executável

O código final e os testes ficam em `lab/`. Não pratique diretamente nessa pasta. No PowerShell, a partir dela:

```powershell
python .\create_working_copy.py
```

O HTML explica como entrar no diretório impresso, preparar o ambiente, colar o código, observar os casos negativos e executar as validações. `python .\create_working_copy.py --reference` produz uma cópia completa para consulta, sem limpar os arquivos guiados.

Baseline da referência, verificada em 14/08/2026:

```text
Python 3.14.7
Ruff: All checks passed!
mypy: Success: no issues found in 13 source files
unittest: Ran 18 tests — OK
contract: VALID
context: 950/1000
policy: ALLOW_READ / DENY_UNTRUSTED_CAPABILITY / DENY_PATH_ESCAPE
```

## O que o módulo ensina

- separar modelo, cliente, harness, agente, workflow, tool e ambiente;
- escrever `AGENTS.md` canônico e adapters pequenos por fornecedor;
- usar Agent Skills como padrão aberto para procedimentos sob demanda;
- distinguir slash command, comando embutido, skill, prompt reutilizável e prompt MCP, com adapters por produto;
- selecionar contexto sob orçamento e registrar omissões;
- separar instrução, capability, aprovação e identidade;
- conter prompt injection indireta por menor privilégio;
- testar a lógica de uma capability antes de publicá-la por MCP;
- executar inspect → plan → change → verify → review → evidence;
- comparar harnesses por tarefas repetidas, não por demonstração.

## Entregáveis do aluno

- [ ] `AGENTS.md` curto, específico e com comandos confirmados;
- [ ] adapters mínimos para dois harnesses;
- [ ] Agent Skill `review-python-transition`;
- [ ] task contract de uma mudança real pequena;
- [ ] três testes negativos de policy explicados;
- [ ] capability MCP validada sem LLM e, se disponível, no Inspector;
- [ ] scorecard A/B com três repetições por tarefa;
- [ ] ADR de escolha de harness com data de revisão.

## Fontes de autoridade

O núcleo usa [Agent Skills](https://agentskills.io/specification), [MCP 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28), [OWASP LLM01:2025](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) e [DORA 2025](https://dora.dev/research/2025/dora-report/). Documentações de Codex, Claude Code e GitHub Copilot sustentam apenas os respectivos adapters.
