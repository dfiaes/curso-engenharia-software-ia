# REL-04 — Frescor (freshness) de afirmações temporais (21/09/2026)

Varredura mecânica (`grep` sobre `modulos/**/*.html` e
`docs/especificacoes/*.md`) por versões, modelos de IA, preços e
ferramentas citadas. Janela da política: ≤ 90 dias (revalidar até
20/12/2026). Ambiente sem fetch de rede aqui: tudo que depende de rede
está marcado **REVALIDAR-EM-DEVICE**. Datas de "última validação" são as
das produções históricas registradas em STATUS (ago–set/2026) — fora da
janela de 90 dias apenas se a data de produção for anterior a 23/06/2026.

## Itens de alto risco temporal identificados

| # | Afirmação | Local | Última validação conhecida | Ação |
|---|---|---|---|---|
| 1 | **Python 3.14** como linguagem canônica (~81 citações em todos os HTMLs; `requires-python >= 3.14`, `target-version = py314`) | todos os módulos; especificações | set/2026 (revisões do slice) | REVALIDAR-EM-DEVICE (python.org / PEP 745 bugfix mais recente) — versão estável, risco baixo |
| 2 | **Janelas de contexto por modelo**: `512 (Opus 5), 1.024 (Sonnet 5), 4.096 (Haiku 4.5)` saída máxima | `M05-llm-pratica-gateway-cache/M05.html` (~L666) | produção M05 (legado, sem data explícita) | **REVALIDAR-EM-DEVICE** — números mudam por geração de modelo; alto risco |
| 3 | **Preços de API**: `US$4.24/Mtok` local vs `API 3.00` (45 tok/s, util 0.25); `US$ 0,05 mediana / 0,80 p99` | `M11.html` (L1414, L1538, L1246-48); `M00/bloco-4-mcp-e-hooks.html` (L204) | produção histórica | **REVALIDAR-EM-DEVICE** — preços de API e GPU mudam; checar pricing oficial dos provedores citados |
| 4 | **Famílias open-weights citadas**: Qwen, Llama, DeepSeek, Mistral, Kimi, gpt-oss | `M05.html` (~L611) | produção M05 | REVALIDAR-EM-DEVICE — catálogo de modelos evolui rápido |
| 5 | **`torch==2.9.1`** (pin do lab M11) | `M11.html` bloco de setup | ago/2026 (M11 G0/G1 aprovados) | REVALIDAR-EM-DEVICE (pypi.org/project/torch) — pin didático, basta confirmar que instala na 3.14 |
| 6 | **`uv 0.9`** citado como versão de referência | `M00/bloco-4-mcp-e-hooks.html` | produção M00 (mais antiga) | **REVALIDAR-EM-DEVICE** — ambiente atual usa uv 0.12.7 e locks pinam ruff 0.16.3; número didático pode estar defasado |
| 7 | **`uv 0.16.3`? não — `ruff==0.16.3`, `mypy>=1.17,<2`, `pytest>=8,<9`** pins de labs | `*/lab/pyproject.toml`, `uv.lock` | 21/09/2026 (REL-02, locks verificados) | OK — verificado neste lote; próxima checagem ≤ 20/12/2026 |
| 8 | **`mcp>=2,<3` (MCP SDK 2.0.0 lockado)** | M00 `pyproject.toml`/`uv.lock` | 21/09/2026 | OK; protocol heterogêneo — revalidar CHANGELOG do SDK até dez/2026 |
| 9 | **Claude Code / Claude Sonnet 5 / Opus 5 / Haiku 4.5** como modelos-harness | M00/M01 (ferramental) | set/2026 | REVALIDAR-EM-DEVICE (docs.anthropic.com) — nomes de modelos mudam |
| 10 | **PostgreSQL / Docker como requisito ambiental** (sem versão pinnada no texto) | M03, M12, M02A trilha live | — | Risco baixo; sem número de versão exposto, sem ação |

## Contagens

- Itens de alto risco temporal listados: **10** (linhas da tabela).
- Requerendo revalidação em device com rede: **7** (itens 1–6, 9).
- Verificados neste lote (locks de labs, REL-02): **2** (itens 7–8).
- Sem ação: **1** (item 10).

## Procedimento sugerido quando houver rede

1. `python.org/downloads` + PEP 745 → confirmar Python 3.14 estável.
2. Pricing oficial (Anthropic/OpenAI e marketplace de GPU) → itens 2 e 3.
3. docs.anthropic.com + blog de modelos → itens 2 e 9 (janelas/nomes).
4. pypi.org (torch, uv, mcp-sdk, ruff, mypy) → itens 5–8; atualizar
   número didático apenas se o pin atual não instalar mais na 3.14.

Nenhuma reescrita de conteúdo feita neste lote: relatório apenas inventaria
o risco; a decisão de atualizar texto pertence ao fluxo editorial normal.
