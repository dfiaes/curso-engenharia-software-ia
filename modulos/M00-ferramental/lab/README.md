# Lab M00 — contrato de harness, contexto e menor privilégio

Este laboratório não chama nenhum modelo. Ele verifica as partes que não devem depender de um modelo: contrato de trabalho, seleção de contexto, escopo de path, capabilities e allowlist de comandos.

## Execução sem instalar dependências

No diretório `lab/`:

```powershell
$env:PYTHONPATH = "src"
python -m unittest discover -s tests -v
python -m harness_lab validate examples/harness.safe.json
python -m harness_lab context-demo
python -m harness_lab policy-demo --workspace .
```

Resultado mínimo:

```text
Ran 18 tests
OK
VALID examples/harness.safe.json
ALLOW_READ
DENY_UNTRUSTED_CAPABILITY
DENY_PATH_ESCAPE
```

O número exato de milissegundos não é critério. Códigos de decisão, testes e ausência de exceção são.

## Gate opcional de qualidade

```powershell
uv sync --extra dev
uv run ruff check .
uv run mypy
uv run python -m unittest discover -s tests -v
```

## MCP opcional, testado por camadas

Primeiro teste `course_progress()` como função Python. Só depois instale o adapter:

```powershell
uv sync --extra mcp
uv run mcp dev examples/mcp_progress_server.py
```

No Inspector, chame `course_progress` com o caminho de um `PROGRESSO.md` descartável. O exemplo usa o MCP Python SDK v2 (`mcp>=2,<3`) e a API documentada em 14/08/2026. Consulte a documentação antes de executar no futuro: MCP tem alto risco de obsolescência.

## Experimentos obrigatórios

1. Retire `AGENTS.md` de `instruction_files` e explique a falha.
2. Troque `trusted_input` para `false` e peça `write`; observe a negação.
3. Use `../fora.txt` como alvo; observe `DENY_PATH_ESCAPE`.
4. Reduza `context_budget` para menos do que o item obrigatório; observe a exceção explícita.
5. Acrescente um comando como string única em vez de lista de argumentos; a validação deve rejeitar porque isso incentiva shell implícito.

Não “conserte” um teste negativo afrouxando a policy. Explique qual requisito mudou e altere contrato, implementação e teste juntos.
