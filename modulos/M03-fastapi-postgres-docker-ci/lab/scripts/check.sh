#!/bin/sh
# Equivalente local do job `quality` (AT-025). Mesmos comandos, mesma ordem.
# Uso: ./scripts/check.sh   (a partir de lab/)
set -eu
cd "$(dirname "$0")/.."
uv sync --frozen
uv run ruff check .
uv run ruff format --check .
uv run mypy src tests
uv run pytest -q
