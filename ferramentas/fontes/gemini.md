# Fontes · Gemini CLI e Antigravity

Verificado em 09/11/2026. Dois produtos: Gemini CLI (`geminicli.com`, repositório `google-gemini/gemini-cli`) e Antigravity (`antigravity.google`). Prazos: 30 dias para preço, plano, modelo e recurso beta; 90 dias para comando e arquivo de configuração. Comunidade: nenhuma fonte usada.

| Afirmação | Aula | Fonte | Revalidar em |
|---|---|---|---|
| Transição: Antigravity CLI disponível em 19/05/2026; em 18/06/2026 o Gemini CLI e extensões Code Assist deixam de atender gratuitos individuais e Google AI Pro/Ultra; Gemini CLI segue para Code Assist Standard/Enterprise e chaves pagas | gemini-1 | https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/ ; https://raw.githubusercontent.com/google-gemini/gemini-cli/main/README.md | 30 dias |
| Gemini CLI 0.67.0 (04/11/2026), Apache-2.0, lançamentos semanais | gemini-1 | https://registry.npmjs.org/@google%2fgemini-cli | 30 dias |
| Instalação e autenticação do Gemini CLI (npm, brew, npx; Node 20+; login Google, `GEMINI_API_KEY`, Vertex) | gemini-1 | https://geminicli.com/docs/ (README e páginas de autenticação) | 90 dias |
| Instruções do Gemini CLI: `GEMINI.md`, varredura por diretório, `/memory`, `context.fileName` | gemini-1 | https://geminicli.com/docs/cli/gemini-md.md | 90 dias |
| Modos de aprovação do Gemini CLI, `/plan`, checkpoints e pastas confiáveis desligados por padrão, sandbox | gemini-1, 2 | https://geminicli.com/docs/ (páginas de plan mode, checkpointing, trusted folders, sandbox) | 90 dias |
| Motor de políticas TOML (campos, prioridades, camadas), camada de workspace não funcional (issue 18186), obsolescência de `--allowed-tools` | gemini-1, 2 | https://geminicli.com/docs/ (página de policy engine) ; issue 18186 em github.com/google-gemini/gemini-cli | 30 dias |
| Hooks do Gemini CLI (eventos, saída 2, JSON, stdout puro) | gemini-2 | https://geminicli.com/docs/ (página de hooks) | 90 dias |
| Subagentes, skills, comandos TOML, extensões e MCP do Gemini CLI | gemini-2 | https://geminicli.com/docs/ (páginas de subagents, skills, custom commands, extensions, MCP) | 90 dias |
| Headless do Gemini CLI: `-p`, formatos, códigos 0/1/42/53, `-r latest`, `--model` | gemini-2 | https://geminicli.com/docs/ (páginas de headless e configuração) | 90 dias |
| Superfícies do Antigravity e versões (App 2.29.1, CLI 1.5.1), SDK Python | gemini-1 | https://antigravity.google/docs/overview ; https://antigravity.google/docs/changelog | 30 dias |
| Instalação, primeiro uso e login do `agy`; modo de chave de API com `modelProvider` + `GEMINI_API_KEY`; ADC; login empresarial; países | gemini-1, 2 | https://antigravity.google/docs/install ; https://antigravity.google/docs/getting-started ; https://antigravity.google/docs/faq | 90 dias |
| Modos do `agy` (`default`, `accept-edits`, `auto`, `plan`), `--sandbox`, `--dangerously-skip-permissions`, versões mínimas do `auto` | gemini-1, 2 | https://antigravity.google/docs/cli/modes ; https://antigravity.google/docs/sandbox | 90 dias |
| Permissões do `agy` (ações, precedência Deny > Ask > Allow, regex, workspace permitida) e schema de settings | gemini-1 | https://antigravity.google/docs/permissions ; https://antigravity.google/schemas/v1/settings.json | 90 dias |
| Regras: `AGENTS.md`/`GEMINI.md`, `.agents/rules`, frontmatter `trigger`, limites de 24.000 bytes e 20.000 tokens, sem subpastas | gemini-1 | https://antigravity.google/docs/rules | 90 dias |
| Skills, subagentes, plugins e importação (`agy plugin import gemini`) | gemini-2 | https://antigravity.google/docs/skills ; https://antigravity.google/docs/subagents ; https://antigravity.google/docs/plugins ; https://antigravity.google/docs/cli/gcli-migration | 90 dias |
| Hooks do `agy` (`hooks.json`, eventos, decisões, timeout) | gemini-2 | https://antigravity.google/docs/hooks | 90 dias |
| MCP do `agy` (`mcp_config.json`, `serverUrl`, só Streamable HTTP, timeouts, carregamento sob demanda) | gemini-2 | https://antigravity.google/docs/mcp | 90 dias |
| `agy -p`, formatos, `--json-schema`, `--print-timeout`, código 3, envelope JSON, `agy acp` | gemini-2 | https://antigravity.google/docs/cli/headless ; https://antigravity.google/docs/cli/reference | 90 dias |
| Modelos por plano, remoção em 18/11/2026 (Claude 4.6 e GPT-OSS 120B), cotas por janela, créditos | gemini-2 | https://antigravity.google/docs/models ; https://antigravity.google/docs/plans ; https://antigravity.google/docs/cli/credits | 30 dias |
| Plano gratuito US$ 0; Standard/Plus empresarial a partir de US$ 30 por assento por mês | gemini-2 | https://antigravity.google/pricing | 30 dias |

## Não confirmado (fora dos exercícios ou marcado na aula)

- Preços de Google AI Pro e Ultra: não aparecem como texto na página consultada; as aulas não os afirmam.
- Formato exato do `hooks.json` do Antigravity e dos campos do JSON de entrada dos hooks; o script da aula 2 não depende de nomes de campo.
- Nome da ferramenta de shell do Gemini CLI (`run_shell_command`) usado no TOML da aula 1; confirmar com `/tools`.
- Formato do item `read_url(...)` em `permissions` do `agy`; confirmar no schema.
- Saída exata de `agy --version` e do texto de pausa de revisão; terminais das aulas são "exemplo".
- Data de lançamento do Antigravity IDE e modelo padrão real do Gemini CLI (a documentação está defasada).
- Repositório `github.com/google-gemini/gemini-cli`: acesso direto retornou 403; usei o README bruto e o registro npm.
