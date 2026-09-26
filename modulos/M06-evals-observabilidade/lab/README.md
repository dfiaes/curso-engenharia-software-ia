# Lab M06 — eval_lab

Runner de evals offline: datasets versionados, graders determinísticos,
juiz roteirizado com calibração, registry de prompts, gate com exit code
e tracing sanitizado. Python 3.14 canônico, gerenciado com `uv`.
**Sem rede, conta ou crédito** — sistema sob teste e juiz são falsos
determinísticos; a trilha live é opcional e externa ao lab.

## Comandos de qualidade (oráculos do programa)

    uv sync --frozen
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy src tests
    uv run pytest -q

## O que cada parte prova

| Arquivo | Cenários | Ambiente |
|---|---|---|
| `test_graders.py` | anatomia, mutante pego (AT-001/005) | sem serviços |
| `test_judge.py` | acordo medido, desalinhado rejeitado (AT-006/007) | sem serviços |
| `test_runner.py` | regressão v1→v2 visível por categoria (AT-002/003/009) | sem serviços |
| `test_gate_tracing.py` | registry, gate, sanitização (AT-008/010/011/012/013) | sem serviços |
| `datasets/` | 6 categorias + caso deprecated (AT-003/004) | fixture |
| `prompts/analista/` | registry v1/v2 + CHANGELOG (AT-008) | fixture |

## Cópia de trabalho

Não edite esta referência diretamente:

    python3 create_working_copy.py
