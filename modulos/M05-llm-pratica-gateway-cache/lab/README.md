# Lab M05 — llm_gateway

Gateway de LLM com contrato único, fakes determinísticos, cache, retry
com teto, timeout, contabilidade de custo e relatório. Python 3.14
canônico, gerenciado com `uv`. **Sem rede, conta ou crédito.**

## Comandos de qualidade (oráculos do programa)

    uv sync --frozen
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy src tests
    uv run pytest -q

## O que cada parte prova

| Arquivo | Cenários | Ambiente |
|---|---|---|
| `test_contract.py` | suíte única, dois fakes, truncamento (AT-001..003) | sem serviços |
| `test_structured.py` | parse, rejeição, abstenção (AT-004..006) | sem serviços |
| `test_tools.py` | loop com teto, erro acionável (AT-007/008) | sem serviços |
| `test_streaming.py` | montagem, corte, backpressure (AT-009/010) | sem serviços |
| `test_cache.py` | hit, TTL, invalidação (AT-011/012) | sem serviços |
| `test_gateway.py` | fallback, retry, timeout, custo (AT-013..017) | sem serviços |

Preços em `prices.py` são retrato ilustrativo datado — exercitar a conta,
não decidir compra.

## Cópia de trabalho

Não edite esta referência diretamente:

    python3 create_working_copy.py
