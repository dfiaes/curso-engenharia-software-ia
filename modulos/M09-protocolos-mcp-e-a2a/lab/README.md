# Lab M09 — proto_lab

MCP e A2A locais: núcleo com despacho, escopo e capabilities; três
transportes (memória, stdio com subprocesso real, HTTP em localhost via
stdlib); dois clientes independentes; agente A2A com ciclo de vida.
Python 3.14 canônico, gerenciado com `uv`. **Sem rede pública, conta ou
SDK externo.**

## Comandos de qualidade (oráculos do programa)

    uv sync --frozen
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy src tests
    uv run pytest -q

## O que cada parte prova

| Arquivo | Cenários | Ambiente |
|---|---|---|
| `test_mcp.py` | discovery, schema, erros, escopo, capability, versão (AT-001..008,010) | sem serviços |
| `test_transports.py` | 3 transportes, timeout, replay, cliente B (AT-009/011/012) | subprocesso + localhost |
| `test_a2a.py` | card, ciclo, recusa, opacidade (AT-013/014) | sem serviços |

Conformidade total com specs externas pertence à trilha externa com SDK.

## Cópia de trabalho

Não edite esta referência diretamente:

    python3 create_working_copy.py
