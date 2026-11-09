# Fontes · OpenAI Codex CLI

Verificado em 09/11/2026 na documentação oficial (learn.chatgpt.com/docs, páginas `.md`; índice em `llms.txt`) e no repositório https://github.com/openai/codex. Prazos: 30 dias para preço, modelo e recurso beta; 90 dias para comandos e arquivos de configuração. Próxima revalidação: 09/12/2026 (volátil) e 09/02/2027 (comandos e config).

| Afirmação | Aula | Fonte | Revalidar |
|---|---|---|---|
| Instalação da CLI e primeiro login (conta ChatGPT ou chave de API) | fer-codex-1 | https://learn.chatgpt.com/docs/codex_cli.md e https://learn.chatgpt.com/docs/auth.md | 90 dias |
| Cadeia de `AGENTS.md` (global, raiz do repositório até o diretório atual) | fer-codex-1 | https://learn.chatgpt.com/docs/agent-configuration/agents-md.md | 90 dias |
| Sandbox (read-only, workspace-write, danger-full-access) x política de aprovação; `.git`, `.agents`, `.codex` protegidos | fer-codex-1, 2 | https://learn.chatgpt.com/docs/agent-approvals-security.md | 90 dias |
| Precedência de configuração e `config.toml`; projeto não confiável perde `.codex/` | fer-codex-1, 2 | https://learn.chatgpt.com/docs/config-file/config-basic.md e config-advanced.md | 90 dias |
| Política `untrusted` aposentada; `--full-auto` removida do exec; `codex mcp-server` removido; prompts customizados obsoletos | fer-codex-1, 2 | https://learn.chatgpt.com/docs/config-file/config-reference.md, https://learn.chatgpt.com/docs/custom-prompts.md e https://github.com/openai/codex (changelog) | 30 dias |
| Atalhos e comandos de barra (`/permissions`, `/status`, `/subagents`, `/hooks`, `/mcp`, `/skills`, `/plugins`, `/import`, `/worktree`) | fer-codex-1, 2 | https://learn.chatgpt.com/docs/reference/commands.md, https://learn.chatgpt.com/docs/developer-commands.md e https://learn.chatgpt.com/docs/cli-customization.md | 90 dias |
| Subagentes: built-ins default, worker, explorer; TOML com `name`, `description`, `developer_instructions`; `[agents]`; herdam sandbox e aprovação do pai | fer-codex-2 | https://learn.chatgpt.com/docs/agent-configuration/subagents.md | 90 dias |
| Hooks: locais, confiança por hash em `/hooks`, `permissionDecision: deny`, `continue`/`stopReason` não suportados em PreToolUse (saída do script executada de verdade em 09/11/2026) | fer-codex-2 | https://learn.chatgpt.com/docs/hooks.md | 90 dias |
| Regras `.rules` com `prefix_rule`, forbidden > prompt > allow, `codex execpolicy check` (experimental) | fer-codex-2 | https://learn.chatgpt.com/docs/agent-configuration/rules.md e https://learn.chatgpt.com/docs/feature-maturity.md | 30 dias |
| MCP: `codex mcp add/list/login`, chaves `[mcp_servers.*]` | fer-codex-2 | https://learn.chatgpt.com/docs/extend/mcp.md | 90 dias |
| Skills em `.agents/skills`, `$nome`, `/skills`, `skill-creator`, orçamento da lista | fer-codex-2 | https://learn.chatgpt.com/docs/build-skills.md | 90 dias |
| Plugins (`codex plugin`, `/plugins`) | fer-codex-2 | https://learn.chatgpt.com/docs/build-plugins.md e https://learn.chatgpt.com/docs/plugins.md | 90 dias |
| `codex exec`: read-only por padrão, `--json`, `-o`, `--output-schema`, `--skip-git-repo-check`, `CODEX_API_KEY` | fer-codex-2 | https://learn.chatgpt.com/docs/non-interactive-mode.md | 90 dias |
| `openai/codex-action@v1` e avisos sobre chave no ambiente do job | fer-codex-2 | https://learn.chatgpt.com/docs/github-action.md | 90 dias |
| Modelos (gpt-6.1-sol, gpt-6-luna, Astra) e níveis de esforço | fer-codex-2 | https://learn.chatgpt.com/docs/models.md e https://learn.chatgpt.com/docs/model-selection.md | 30 dias |
| Planos e preços (Go US$ 8, Plus US$ 20, Pro a partir de US$ 100) | fer-codex-2 | https://learn.chatgpt.com/docs/pricing.md | 30 dias |

## Não confirmado

- Equivalente do `/rewind` de arquivos no Codex: a documentação não descreve um; as aulas dizem isso e recomendam Git como ponto de retorno.
- Lista completa de flags da CLI: as tabelas interativas da página de referência não renderizaram na extração; as aulas usam apenas flags confirmadas em texto.
- Colunas Cursor e OpenCode das tabelas "equivalente nas outras ferramentas": não reverificadas nesta rodada.
- Correção a sinalizar na aula A01 · Build (b03): a tabela diz que o agente do Codex pode ter `sandbox_mode` próprio; a documentação diz que ele é ignorado.
