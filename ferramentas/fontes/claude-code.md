# Fontes · Claude Code

Verificado em 09/11/2026 na documentação oficial (code.claude.com/docs/en, páginas `.md`; índice em `llms.txt`) e no changelog. Prazos: 30 dias para preço, modelo e recurso beta; 90 dias para comandos e arquivos de configuração. Próxima revalidação: 09/12/2026 (volátil) e 09/02/2027 (comandos e config).

| Afirmação | Aula | Fonte | Revalidar |
|---|---|---|---|
| Instalação nativa, PowerShell, Homebrew e WinGet; primeira execução abre o login | fer-claude-code-1 | https://code.claude.com/docs/en/setup | 90 dias |
| Autenticação por conta (assinatura) ou chave de API; `/login` | fer-claude-code-1 | https://code.claude.com/docs/en/authentication | 90 dias |
| `CLAUDE.md` por escopo (usuário, projeto, local) e `.claude/rules/` | fer-claude-code-1 | https://code.claude.com/docs/en/memory | 90 dias |
| `AGENTS.md` só é lido quando não há `CLAUDE.md` nem `CLAUDE.local.md` | fer-claude-code-1 | https://code.claude.com/docs/en/memory | 90 dias |
| Modos de permissão (default, plan, acceptEdits etc.) e `defaultMode` | fer-claude-code-1 | https://code.claude.com/docs/en/permission-modes | 90 dias |
| Regras `allow`, `ask`, `deny` em `settings.json`; precedência deny > ask > allow | fer-claude-code-1 | https://code.claude.com/docs/en/permissions | 90 dias |
| Atalhos e comandos de sessão (`/clear`, `/compact`, `/rewind`, `/hooks`) | fer-claude-code-1, 2 | https://code.claude.com/docs/en/interactive-mode e https://code.claude.com/docs/en/commands | 90 dias |
| Subagentes em `.claude/agents/*.md`, frontmatter, built-ins; campo inválido ignorado em silêncio | fer-claude-code-2 | https://code.claude.com/docs/en/sub-agents | 90 dias |
| Worktrees para sessões paralelas | fer-claude-code-2 | https://code.claude.com/docs/en/worktrees | 90 dias |
| Hooks: eventos, exit 2 bloqueia, JSON de decisão (saída da aula executada de verdade em 09/11/2026) | fer-claude-code-2 | https://code.claude.com/docs/en/hooks e https://code.claude.com/docs/en/hooks-guide | 90 dias |
| MCP: `claude mcp add`, escopos local/project/user, `.mcp.json`, transporte `http` | fer-claude-code-2 | https://code.claude.com/docs/en/mcp | 90 dias |
| Skills em `.claude/skills/<nome>/SKILL.md` | fer-claude-code-2 | https://code.claude.com/docs/en/skills | 90 dias |
| Plugins e `.claude-plugin/plugin.json` | fer-claude-code-2 | https://code.claude.com/docs/en/plugins | 90 dias |
| Modo sem tela `claude -p` e flags (`--max-turns`, `--max-budget-usd`, formatos de saída) | fer-claude-code-2 | https://code.claude.com/docs/en/headless e https://code.claude.com/docs/en/cli-reference | 90 dias |
| GitHub Action `anthropics/claude-code-action@v1` | fer-claude-code-2 | https://code.claude.com/docs/en/github-actions | 90 dias |
| Modelos, esforço (`effort`) e aliases | fer-claude-code-2 | https://code.claude.com/docs/en/model-config | 30 dias |
| Custo, planos e `/cost` | fer-claude-code-2 | https://code.claude.com/docs/en/costs | 30 dias |
| Checkpoints e `/rewind` restauram edições de arquivo feitas pelo agente | fer-claude-code-1, 2 | https://code.claude.com/docs/en/checkpointing | 90 dias |

## Não confirmado

- Colunas Cursor e OpenCode das tabelas "equivalente nas outras ferramentas": vêm da aula 13 da Trilha rápida (12/10/2026) e não foram reverificadas nesta rodada.
- Valores exatos de preço de plano: a aula remete à página oficial em vez de afirmar números.
