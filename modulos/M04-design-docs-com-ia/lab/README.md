# Lab M04 — design_guard

Verificador determinístico de documentação com exit code. Python 3.14
canônico, gerenciado com `uv`. Sem LLM, sem rede.

## Comandos de qualidade (oráculos do programa)

    uv sync --frozen
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy src tests
    uv run pytest -q

## O que cada parte prova

| Arquivo | Cenários | Ambiente |
|---|---|---|
| `test_rules.py` | ADR, referências, mermaid, obsolescência (AT-010) | sem serviços |
| `test_cli.py` | fitness de cobertura, CLI reprova/aprova, mutante (AT-010/011) | sem serviços |
| `demo_docs/` | suíte de demonstração com 1 ADR bom, 1 ADR ruim, runbook e arquitetura | fixture |
| `demo_src/` | código descrito pela demo (`billing` coberto, `notify` sem decisão de propósito) | fixture |
| `prompts/doc-drift.md` | revisor semântico com restrições (bloco 4) | documento versionado |

## Cópia de trabalho

Não edite esta referência diretamente:

    python3 create_working_copy.py
