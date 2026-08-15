# Laboratório M02 — `csv-cleaner`

Produto didático local e instalável para praticar Python 3.14 como linguagem de
engenharia, não como tradução literal de C#. O laboratório cobre contratos de
distribuição, modelo de objetos, typing estrutural, trust boundaries, concorrência
estruturada, diagnóstico e evidência reproduzível.

## Gates

```powershell
uv sync --python 3.14 --locked
uv run ruff format --check .
uv run ruff check .
uv run mypy --strict src tests
uv run pytest -q
uv build
uv run python -m python_senior_lab.cli --help
```

O `uv.lock` é uma implementação de lock do uv, não o padrão `pylock.toml`.
Nenhum teste obrigatório usa rede. A matriz free-threaded/subinterpreters é
diagnóstica e nunca transforma indisponibilidade local em sucesso fictício.

## Uso

```powershell
uv run csv-cleaner fixtures/csv/valid.csv output.csv --evidence evidence/run.json
```

Contrato de entrada: CSV UTF-8 com `id,amount,currency,category,occurred_at`.
Valores monetários usam `Decimal`; campos extras são rejeitados. Códigos de saída:

- `0`: execução concluída;
- `2`: entrada viola o contrato;
- `3`: falha operacional de arquivo/encoding;
- `70`: falha interna inesperada.

O arquivo de evidência registra runtime, versões das ferramentas, duração, hashes e
contagens. Ele é prova sobre aquela execução, não uma afirmação universal de desempenho.

## Evidência reproduzida pelo orquestrador — 15/08/2026

- CPython 3.14.7 em Windows;
- `uv lock --check`, sync locked, Ruff format/lint e mypy strict aprovados;
- 51 testes unitários, integração, propriedade e negativos aprovados nos runtimes CPython 3.14 e 3.14t;
- sdist/wheel construídos para a distribuição `csv-cleaner==0.1.0`;
- wheel instalado em ambiente separado; import confirmado em `site-packages` e CLI executada fora do checkout.

A matriz 3.14t/extensão foi executada: os 51 testes passaram com GIL desativado e o import de `pydantic-core` preservou esse modo. No WSL2/Ubuntu, o uv 0.12.3 teve o checksum oficial validado, CPython 3.14.7 foi instalado em diretório temporário, os 51 testes e a CLI passaram e a saída foi confirmada em UTF-8/LF. G2, G4 e G5 estão aprovados. A revisão visual mobile/impressão permanece no gate editorial G6.

## Mapa de cenários

- `tests/unit`: objetos, typing, Pydantic, parsing, diagnóstico;
- `tests/integration`: CLI/subprocesso, UTF-8, exit codes e evidência;
- `tests/property`: propriedades de normalização e round-trip;
- `tests/negative`: controles negativos que demonstram bypass e oráculos;
- `fixtures/generated_defects`: defeitos deliberados, fora do gate de tipos.
