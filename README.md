# Engenharia de Software e IA em Python

Curso em português que leva do nível júnior ao nível de especialista e líder técnico em sistemas com IA. Cinco fases, módulos HTML autossuficientes e laboratórios executáveis em Python 3.14, sem exigir conta paga ou API comercial.

## Por onde começar

1. Abra o [portal do curso](index.html): ele lista as fases e guarda seu progresso no navegador.
2. Faça o [nivelamento](docs/nivelamento.md) para saber onde entrar. Quem já trabalha na área pode passar rápido pela Fase 0 usando o diagnóstico de cada módulo.
3. Siga o [currículo](CURRICULO.md) em ordem.

| Fase | Foco | Módulos |
|---|---|---|
| 0 · Fundamentos | Terminal e Git, Python, algoritmos, web e HTTP, SQL | F01–F05, M02 |
| 1 · Engenharia de software | Design de código, engenharia sênior, serviço real, docs e decisões, runtime e redes | S01, M02A, M03, M04, LT01 |
| 2 · AI Engineering | Agentes de programação, LLM na prática, evals, RAG, agentes, MCP, grafos | M00, M01, M05–M10 |
| 3 · Produção | Segurança e SRE, sistemas distribuídos, plataforma, deploy em nuvem, release | M12, LT02, LT03, P01, LT04 |
| 4 · Especialista e líder | System design de IA, ML/DL, adaptação de modelos, governança, liderança, capstone, carreira | E01, M11, E02, E03, E04, M13, E05 |

## Como cada módulo funciona

Diagnóstico rápido → blocos de conteúdo (problema, mecanismo, exemplo, decisão, falha) → laboratório guiado → tabela de diagnóstico → checkpoint. O laboratório fica em `modulos/<módulo>/lab/` e sempre roda numa cópia temporária:

```bash
cd modulos/F02-python-do-zero/lab
python3 create_working_copy.py      # imprime o caminho da cópia
cd <caminho impresso>
uv sync && uv run pytest -q
```

Para estudar com um assistente de IA, as regras de tutoria estão em [`CLAUDE.md`](CLAUDE.md) (ex.: `Explique Y`, `Revise meu código`, `Checkpoint F03`, `Voltei`).

## Manutenção

| O quê | Onde |
|---|---|
| Regras de autoria e tutoria | [`CLAUDE.md`](CLAUDE.md) |
| Sequência e cargas | [`CURRICULO.md`](CURRICULO.md) |
| Estado de cada módulo | [`STATUS.md`](STATUS.md) |
| Padrão de qualidade e fontes | [`docs/PADRAO-QUALIDADE-TECNICA-DIDATICA.md`](docs/PADRAO-QUALIDADE-TECNICA-DIDATICA.md), [`docs/POLITICA-FONTES-E-AGNOSTICISMO.md`](docs/POLITICA-FONTES-E-AGNOSTICISMO.md) |
| Escopo detalhado dos módulos originais | `docs/especificacoes/` |
| Seu diário de estudo | [`PROGRESSO.md`](PROGRESSO.md) |

```bash
python3 tools/build_course_portal.py   # regenera index.html a partir de portal/course-source.json
python3 tools/check_course.py          # links e âncoras
```

O estado anterior à reestruturação em 5 fases está preservado na tag git `pre-reestruturacao-2026-10-11`.
