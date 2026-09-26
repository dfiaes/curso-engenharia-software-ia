# Lab M10 — graph_lab

Workflow durável com checkpoint em arquivo, grafo de código extraído por
AST, travessias das três perguntas, memória temporal e métricas I/A/D.
Python 3.14 canônico, gerenciado com `uv`. **Sem rede, banco, modelo ou
framework externo.**

O `sql/reference.sql` documenta a persistência PostgreSQL/AGE e NÃO é
executado (exige Docker).

## Comandos de qualidade (oráculos do programa)

    uv sync --frozen
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy src tests
    uv run pytest -q

## O que cada parte prova

| Arquivo | Cenários | Ambiente |
|---|---|---|
| `test_workflow.py` | checkpoint, resume, HITL, reducers (AT-002..006) | arquivo local |
| `test_graph.py` | extração, impacto, mortos, híbrido (AT-007..011,016) | sem serviços |
| `test_metrics.py` | I/A/D, zonas, ciclos, A indefinido (AT-013..015) | sem serviços |
| `test_memory.py` | validade, invalidação, passado (AT-012) | sem serviços |
| `fixture_repo/` | pacote Python para extrair e atravessar | fixture |

## Cópia de trabalho

Não edite esta referência diretamente:

    python3 create_working_copy.py
