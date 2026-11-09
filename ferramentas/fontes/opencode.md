# Fontes · OpenCode

Verificado em 09/11/2026. Documentação lida: V2 (`opencode.ai/docs`, "V2 (latest)"; a V1 fica em `opencode.ai/v1/docs`). Prazos: 30 dias para preço, modelo e recurso beta; 90 dias para comando e arquivo de configuração. Comunidade: nenhuma fonte usada.

| Afirmação | Aula | Fonte | Revalidar em |
|---|---|---|---|
| Versão estável 2.2.6 do pacote `@opencode/cli`, licença MIT | opencode-1 | https://registry.npmjs.org/@opencode%2fcli ; https://opencode.ai/changelog | 30 dias |
| Instalação: script `opencode.ai/v2/install`, `brew install anomalyco/tap/opencode-v2`, `npm install -g @opencode/cli`; `mise` >= 2026.10.9; Windows só binários; imagem `ghcr.io/anomalyco/opencode:2.0.0` | opencode-1 | https://opencode.ai/docs/ | 90 dias |
| Superfícies (`opencode`, `mini`, `pair`, `serve`), `opencode service`, `--standalone`, `--server`, caminho do log | opencode-1 | https://opencode.ai/docs/cli/ ; https://opencode.ai/docs/cli/commands/ | 90 dias |
| `/connect`, `/models`, `opencode auth login/list/logout/switch`, login ChatGPT Plus/Pro, formato `provedor/modelo#variante` | opencode-1, 2 | https://opencode.ai/docs/providers/ ; https://opencode.ai/docs/models/ | 30 dias |
| OpenCode Go a US$ 10 por mês; modelos gratuitos e `OPENCODE_DISABLE_FREE_MODELS=1` | opencode-1, 2 | https://opencode.ai/docs/ (introdução) ; https://opencode.ai/docs/providers/ | 30 dias |
| Atalhos da TUI (`@arquivo#a-b`, `!`, Ctrl+P, líder Ctrl+X, Shift+Tab, F2, /undo, /redo, /editor, Esc, Enter) | opencode-1 | https://opencode.ai/docs/cli/tui/ ; https://opencode.ai/docs/cli/keybinds/ | 90 dias |
| Precedência de configuração (global < projeto < `.opencode/` < sistema), chaves, `{env:NOME}` | opencode-1 | https://opencode.ai/docs/config/ | 90 dias |
| Apenas `AGENTS.md`; sem fallback para `CLAUDE.md`; carregamento global e aninhado; campo `instructions` | opencode-1 | https://opencode.ai/docs/instructions/ ; https://opencode.ai/docs/migrate-v1/ | 90 dias |
| `permissions` como lista ordenada, última regra vence, política-base `* * allow`, `external_directory` permitido, renomes V1 para V2 | opencode-1, 2 | https://opencode.ai/docs/permissions/ ; https://opencode.ai/docs/migrate-v1/ | 90 dias |
| `policies` (ações, só restringe, mensagem "Blocked by configuration policy", precedência sistema > global > projeto) | opencode-2 | https://opencode.ai/docs/policies/ | 90 dias |
| Agentes embutidos (`build`, `plan`, `general`, `explore`), frontmatter, `mode`, `permissions` próprias do subagente | opencode-1, 2 | https://opencode.ai/docs/agents/ | 90 dias |
| Comandos em `.opencode/commands`, `$ARGUMENTS`, bloco com `!` fora do fluxo de permissão | opencode-2 | https://opencode.ai/docs/commands/ | 90 dias |
| Skills: caminhos, ID pelo caminho, `autoinvoke`, `@id`, ação `skill` | opencode-2 | https://opencode.ai/docs/skills/ | 90 dias |
| MCP: `opencode mcp add/list/auth/logout`, `mcp.servers`, OAuth padrão, nome `<servidor>_<ferramenta>`, tempos, substituição por precedência | opencode-2 | https://opencode.ai/docs/mcp-servers/ | 90 dias |
| Plugins V2 (`Plugin.define`, ganchos `tool.hook`, `permission.hook("evaluate")`), plugins V1 não rodam, CLI `opencode plugin` | opencode-2 | https://opencode.ai/docs/plugins/ ; https://opencode.ai/docs/build/plugins/server/ | 90 dias |
| `opencode run` e suas flags, `--auto`, `--standalone`, código 143, espera por tarefas de fundo desde 2.2.6 | opencode-2 | https://opencode.ai/docs/cli/commands/ ; https://opencode.ai/changelog | 90 dias |
| `opencode stats`, `compaction`, `opencode api get /api/info`, `opencode debug paths` | opencode-2 | https://opencode.ai/docs/cli/commands/ ; https://opencode.ai/docs/config/ ; https://opencode.ai/docs/troubleshooting/ | 90 dias |
| Modelo `anthropic/claude-sonnet-5-5` nos exemplos | opencode-1, 2 | https://opencode.ai/docs/cli/commands/ (exemplo de CI) | 30 dias |

## Não confirmado (fora dos exercícios ou marcado na aula)

- `/init` na V2 (documentado só na página da TUI da V1).
- Semântica da GitHub Action (`opencode github install`, `anomalyco/opencode/github`) na V2: a página servida parece ser da V1.
- Se `ctx.tool.hook("execute.before")` consegue bloquear a chamada na V2; forma exata dos campos do evento `evaluate`. O plugin da aula 2 é rotulado como exemplo.
- Pré-requisito do `/undo` e `/redo` na V2 (git ou `snapshots`).
- Forma exata da saída de `--format json` e do texto de `opencode mcp list`; os terminais das aulas são "exemplo".
- Invocação de subagente por `@nome` na V2.
- Repositório `github.com/anomalyco/opencode`: acesso direto retornou 403 nesta verificação; versão e licença vieram do registro npm.

## Material do curso desatualizado em relação à V2

- `trilha-rapida/aulas/13-onde-fica-cada-coisa.js`: diz que o plano alterna com Tab e cita `/init`.
- `modulos/A01-sdlc-nativo-ia/interativo/aulas/b03.js`: chaves `permission`, `bash`, `task`, fallback `CLAUDE.md`, agente `scout` e plugin `tool.execute.before` são da V1.
