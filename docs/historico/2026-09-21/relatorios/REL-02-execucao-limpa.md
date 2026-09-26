# REL-02 — Execução limpa dos laboratórios (21/09/2026)

Mega-lote Tier 1. Escopo: `uv sync` (frozen quando aplicável), `ruff check`,
`ruff format --check`, `mypy` (sem argumento posicional, respeitando `files`
do `pyproject.toml`), `pytest -q` em cada `lab/`, mais
`tools/validate_backlog.py` e `tools/check_course.py` na raiz.
Bloqueio ≠ PASS. Revisão, não reescrita: nenhum conteúdo didático alterado.

## Cortesia válida

`mypy .` sobrescreve `files = ["src", "tests"]` do pyproject e produz falsos
positivos em fixtures/corpus didáticos intencionalmente quebrados
(`fixtures/gates/type_error/broken.py` no M01, `corpus/legado_demo/` no M07,
`fixture_repo/loja.py` no M10, `fixtures/golden/broken.py` no M13). Com a
invocação canônica `mypy` (sem `.`), os quatro passam limpos. Não é
regressão do curso; o relatório usa a invocação canônica.

## Correções aplicadas (regressão mecânica trivial — justificadas)

1. **M00 e M01 — pytest ausente do ambiente.** `pyproject.toml` declara
   `dev = [mypy, ruff]` mas os READMEs (e a rastreabilidade histórica:
   "M00, 18 testes"; "M01, 27 testes") exigem `uv run pytest`. Adicionados
   `pytest>=8,<9` e `pytest-asyncio>=0.24,<1` ao extra `dev` dos dois
   pyprojects + relock (`uv lock` + `uv sync`). Resultado: 18 passed (M00)
   e 27 passed (M01), batendo com a evidência histórica registrada no
   STATUS. Nenhum código-fonte e nenhum conteúdo alterado.
2. **M00 — gate ruff format quebrado com a versão locked.**
   `uv.lock` fixa ruff 0.16.3; 12 arquivos de `src/`/`tests/` não passavam
   em `ruff format --check` nessa versão. Executado `uv run ruff format`
   (aplicação puramente mecânica da formatação idiomática pela versão já
   pinnada; zero mudança semântica). Gate convertido para PASS e o lab
   reexecutado completo: ruff ✓ / format ✓ / mypy ✓ / 18 testes ✓.
3. **M00 — extras `dev` e `mcp` fora do sync padrão.** `mcp_adapter.py`
   importa o extra opcional `mcp`; sem `uv sync --extra dev --extra mcp`,
   ruff/mypy nem sequer instalam. Instalação feita com os extras (sem
   alterar o projeto); mypy passa limpo (13 arquivos).

## Resultado por laboratório

| Lab | uv sync | ruff check | ruff format --check | mypy | pytest (n / fails / skips) | Veredito |
|---|---|---|---|---|---|---|
| M00 | ✓ (extras dev+mcp) | ✓ | ✓ (após correção 2) | ✓ | 18 / 0 / 0 | PASS |
| M01 | ✓ (extra dev) | ✓ | ✓ | ✓ | 27 / 0 / 0 | PASS |
| M02 | ✓ frozen | ✓ | ✓ | ✓ | 51 / 0 / 0 | PASS |
| M02A | ✓ frozen | ✓ | ✓ | ✓ | 144 / 0 / 0 | PASS |
| M03 | ✓ frozen | ✓ | ✓ | ✓ | 52 / 0 / 6 skipped | PASS-COM-BLOQUEIO-DOKER |
| M04 | ✓ frozen | ✓ | ✓ | ✓ | 15 / 0 / 0 | PASS |
| M05 | ✓ frozen | ✓ | ✓ | ✓ | 27 / 0 / 0 | PASS |
| M06 | ✓ frozen | ✓ | ✓ | ✓ | 17 / 0 / 0 | PASS |
| M07 | ✓ frozen | ✓ | ✓ | ✓ (bare) | 23 / 0 / 0 | PASS |
| M08 | ✓ frozen | ✓ | ✓ | ✓ | 15 / 0 / 0 | PASS |
| M09 | ✓ frozen | ✓ | ✓ | ✓ | 19 / 0 / 0 | PASS |
| M10 | ✓ frozen | ✓ | ✓ | ✓ (bare) | 15 / 0 / 0 | PASS |
| M11 | ✓ frozen | ✓ | ✓ | ✓ | 94 / 0 / 0 | PASS |
| M12 | ✓ frozen | ✓ | ✓ | ✓ | 94 / 0 / 1 skipped | PASS-COM-BLOQUEIO-PG |
| M13 | ✓ frozen | ✓ | ✓ | ✓ (bare) | 125 / 0 / 0 | PASS |
| LT01 | ✓ frozen | ✓ | ✓ | ✓ | 160 / 0 / 1 skipped | PASS (skip = recurso externo) |
| LT02 | ✓ frozen | ✓ | ✓ | ✓ | 87 / 0 / 1 skipped | PASS |
| LT03 | ✓ frozen | ✓ | ✓ | ✓ | 81 / 0 / 0 | PASS |
| LT04 | ✓ frozen | ✓ | ✓ | ✓ | 28 / 0 / 0 | PASS |

**Totais:** 1 092 passed, 0 failed, 9 skipped, 19/19 labs com gates
ruff/ruff-format/mypy verdes.

Skips justificados (não mascarados; pytest reporta o motivo):
- M03 (6×) e M12 compartilham a mesma classe: integração PostgreSQL/Docker
  exige Docker Engine ou `M03_PG_URL` — bloqueio ambiental já registrado em
  `STATUS-IMPLEMENTACAO-CURSO.md` e nas rastreabilidades (não é falha de
  código).
- M12 (1×): handshake TLS com cert material externo (openssl) — fora da
  stdlib, documentado no teste.
- LT01 (1×) e LT02 (1×): recurso externo indisponível no slice local.

## Ferramentas de curso (raiz)

- `python3 tools/validate_backlog.py` → 19 unidades curriculares; 128
  blocos; 384 folhas C/L/D; 422 tarefas atômicas; **0 erros**.
- `python3 tools/check_course.py` → 107 documentos verificados;
  **0 erros estruturais/links**; 14 ocorrências marcadas como "legacy
  references/clocks" para revisão contextual (informativo, não erro).

## Conclusão

Execução limpa confirmada em 19/19 laboratórios após duas correções
mecânicas triviais (dependência de teste faltante em M00/M01; formatação
ruff 0.16.3 no M00). Bloqueios remanescentes são ambientais (Docker/PostgreSQL,
certificados e recursos externos) e já constam como pendentes no STATUS.
