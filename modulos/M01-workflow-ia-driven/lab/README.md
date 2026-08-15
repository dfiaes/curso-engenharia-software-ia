# Laboratório M01 — SDD e execução segura

Este laboratório transforma o M01 em evidência executável. Ele não chama modelo, não instala Spec Kit e nunca toca no repositório principal durante a prática de Git. As worktrees são criadas somente em `TemporaryDirectory`, marcadas como pertencentes ao lab, e a limpeza recusa árvores sujas.

## Ambiente

```text
uv sync --python 3.14 --extra dev
uv run ruff check .
uv run ruff format --check .
uv run mypy --strict src tests
uv run python -m unittest discover -s tests -v
```

Git é requisito obrigatório dos cenários de worktree. Falta de Git bloqueia o gate: não há aprovação por `skip`.

## Experimentos

```text
uv run python -m sdd_lab validate examples/feature.valid.json
uv run python -m sdd_lab validate examples/feature.invalid.json
uv run python -m sdd_lab adapters-demo examples/feature.valid.json
uv run python -m sdd_lab check examples/feature.valid.json --evidence evidence/run.json
```

O segundo comando deve falhar e citar requisito vago, não-objetivo ausente, path inseguro e string de shell. O arquivo original permanece inalterado. O `check` usa lista de argumentos, `shell=False`, allowlist, timeout e registra evidência real.

## O que cada suíte prova

| Suíte | Evidência curricular |
|---|---|
| `test_contract.py` | requisitos, contraexemplos, rastreabilidade e rejeição sem mutação |
| `test_drift.py` | quatro estados de drift sem escolher a correção automaticamente |
| `test_runner.py` | execução tokenizada, timeout e menor privilégio |
| `test_workflow.py` | pause/resume, idempotência e orçamento de iteração |
| `test_policy_adapters.py` | workflow externo revisado por hash e domínio portátil |
| `test_workspace.py` | write sets, contratos compartilhados, Git real, merge limpo, conflito semântico e cleanup seguro |

## Limites honestos

- `subprocess` controla o processo filho imediato; isto não é sandbox de sistema operacional.
- o parser implementa invariantes semânticos do curso; JSON Schema 2020-12 complementa, mas não substitui essas regras;
- worktree isola diretórios de trabalho, não serviços, banco, cache, porta, lockfile ou contrato;
- exit code zero prova que o gate executou conforme sua definição, não que o produto satisfaz necessidades não codificadas;
- os adapters mudam representação e entrada; nenhuma regra do domínio é duplicada neles.

## Baseline verificada em 14/08/2026

```text
Python 3.14.7
Ruff format: 33 files already formatted
Ruff lint: All checks passed!
mypy strict: Success: no issues found in 21 source files
unittest: Ran 27 tests — OK
```
