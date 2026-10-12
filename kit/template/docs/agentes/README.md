# Agentes: MCP, comandos e skills

- Fonte única: `.agents/commands/*.md` (comandos) e `.agents/skills/<nome>/SKILL.md` (skills).
- Para copiar para o formato de cada ferramenta: `python3 kit/bootstrap.py . --tools cursor,claude,codex,opencode`.
- MCP: `.cursor/mcp.json` (Cursor), `.mcp.json` (Claude Code), `opencode.json` (OpenCode), `docs/agentes/codex-config.toml` (Codex, copiar para `~/.codex/config.toml`).
- Credenciais só por variável de ambiente ou OAuth. Nunca no arquivo versionado.
- Fixe a versão do pacote MCP (`@playwright/mcp@<versão>`) depois de validar; `@latest` é só para começar.
