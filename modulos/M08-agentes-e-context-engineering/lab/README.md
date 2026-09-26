# Lab M08 — agent_lab

Agente investigador local: loop com 7 paradas, ferramentas com sandbox,
contexto com compactação, padrões compostáveis, memória com validade e
subagente como ferramenta. Python 3.14 canônico, gerenciado com `uv`.
**Sem rede, conta ou modelo real** — a política de decisão é roteirizada;
o loop e as ferramentas são código real.

## Comandos de qualidade (oráculos do programa)

    uv sync --frozen
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy src tests
    uv run pytest -q

## O que cada parte prova

| Arquivo | Cenários | Ambiente |
|---|---|---|
| `test_loop.py` | 7 paradas, parcial, HITL (AT-008/009/010) | sem serviços |
| `test_agent.py` | tools, contexto, padrões, memória, comparação (AT-002..007, AT-011/012/014) | sem serviços |
| `fixture_repo/` | repositório Python para investigar | fixture |

## Cópia de trabalho

Não edite esta referência diretamente:

    python3 create_working_copy.py
