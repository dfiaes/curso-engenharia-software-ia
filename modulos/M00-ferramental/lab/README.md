# Laboratório M00 — referência executável

O roteiro de aprendizagem está em [`../M00.html#lab`](../M00.html#lab). Este README identifica os comandos, o diretório de execução e o limite entre cópia descartável e referência versionada. Os comandos abaixo são instruções; este documento não afirma que o laboratório foi executado nesta tarefa.

## Cópia e diretório de trabalho

No PowerShell, a partir da raiz do curso:

```powershell
Set-Location .\modulos\M00-ferramental\lab
$workdir = python .\create_working_copy.py
Set-Location $workdir
Get-Content -Raw -LiteralPath .\.course-lab-workspace
```

O marcador deve conter `M00`. O script cria uma pasta nova sob `%TEMP%\tutor-ia-codex-labs\`, ignora ambientes e caches, e no modo guiado esvazia somente `src/harness_lab/contract.py`, `context.py` e `policy.py`. Não execute a reconstrução na referência. Para consultar o código completo sem esvaziá-lo, rode `python .\create_working_copy.py --reference` no diretório `modulos/M00-ferramental/lab`.

## Ambiente e verificações

Todos os comandos seguintes usam como cwd a cópia impressa em `$workdir`. O projeto requer Python 3.14. `dev` instala Ruff, mypy, pytest e pytest-asyncio; `mcp` instala o adapter opcional. A sincronização usa o `uv.lock` incluído na cópia:

```powershell
uv sync --locked --python 3.14 --extra dev --extra mcp
$env:PYTHONPATH = "src"
uv run python -m harness_lab validate examples/harness.safe.json
uv run python -m harness_lab context-demo
uv run python -m harness_lab policy-demo --workspace .
uv run python -m unittest discover -s tests -v
uv run ruff check .
uv run mypy --strict src tests
```

O arquivo `pyproject.toml` também configura mypy com `strict = true` e `files = ["src", "tests"]`; o comando explícito mantém claros o escopo e o nível da verificação. Se `uv sync` pedir rede por uma dependência que não está em cache, registre a mensagem e retome quando o ambiente estiver disponível. Não troque versões nem use `pip` para esconder o bloqueio. Diagnósticos por sintoma e a ordem cumulativa da reconstrução estão no laboratório guiado.

## Retomada e limpeza segura

Para recomeçar, volte ao diretório de referência e execute novamente o script; cada chamada cria um novo diretório. A cópia anterior pode permanecer em `%TEMP%` enquanto for útil. Para removê-la, confirme primeiro que `$workdir` resolve para uma subpasta de `%TEMP%\tutor-ia-codex-labs\` e que `.course-lab-workspace` contém `M00`; remova somente essa cópia marcada:

```powershell
$allowed = (Resolve-Path -LiteralPath (Join-Path $env:TEMP 'tutor-ia-codex-labs')).Path
$target = (Resolve-Path -LiteralPath $workdir).Path
$marker = Join-Path $target '.course-lab-workspace'
$isOwnedCopy = $target.StartsWith(
    $allowed + [IO.Path]::DirectorySeparatorChar,
    [StringComparison]::OrdinalIgnoreCase
) -and (Get-Content -Raw -LiteralPath $marker).Trim() -eq 'M00'
if ($isOwnedCopy) {
    Remove-Item -LiteralPath $target -Recurse
} else {
    throw 'Recusa de limpeza: o caminho não é uma cópia marcada do M00.'
}
```

Não substitua `$workdir` por um caminho digitado de outra origem. A limpeza é opcional e não toca na referência do curso ou em arquivos pessoais.
