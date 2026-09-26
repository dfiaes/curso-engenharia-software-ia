# Laboratório M01 — referência executável

O roteiro está em [`../M01.html#lab`](../M01.html#lab). Este README localiza o cwd e resume a instalação, os comandos de verificação, a retomada e a limpeza segura. Os comandos são instruções, não registro de execução desta tarefa.

## Criar a cópia e iniciar

No PowerShell, a partir da raiz do curso:

```powershell
Set-Location .\modulos\M01-workflow-ia-driven\lab
$workdir = python .\create_working_copy.py
Set-Location $workdir
Get-Content -Raw -LiteralPath .\.course-lab-workspace
```

O marcador deve conter `M01`. A cópia nova é criada em `%TEMP%\tutor-ia-codex-labs\`; no modo guiado, somente `src/sdd_lab/drift.py` é esvaziado para reconstrução. `--reference` preserva esse arquivo. O laboratório requer Python 3.14 e Git instalado para o cenário que cria repositórios e worktrees reais. Os testes Git usam `TemporaryDirectory`; não alteram o repositório do curso.

## Ambiente e oráculos

Os comandos abaixo usam como cwd a pasta impressa em `$workdir`. O `uv.lock` fixa as dependências. O extra `dev` inclui mypy, pytest, pytest-asyncio e Ruff.

```powershell
uv sync --locked --python 3.14 --extra dev
uv run python -m sdd_lab validate examples/feature.valid.json
uv run python -m sdd_lab validate examples/feature.invalid.json
uv run python -m unittest discover -s tests -v
uv run ruff format --check .
uv run ruff check .
uv run mypy --strict src tests
```

O arquivo `pyproject.toml` configura mypy em modo estrito para `src` e `tests`; o comando os explicita para deixar claro o escopo. As verificações negativas detalhadas, arquivos a reconstruir e resultados esperados estão no laboratório guiado. Se `uv sync` pedir rede para algo ausente no cache, registre a mensagem e retome quando a dependência estiver disponível; não altere o lock nem use `pip` para contornar o bloqueio.

## Retomada e limpeza

Para retomar do zero, volte à referência e execute `python .\create_working_copy.py` outra vez; ela cria uma pasta nova e não substitui cópias anteriores. A cópia pode ficar em `%TEMP%` enquanto for útil. Se optar por removê-la, confirme que o caminho está dentro de `tutor-ia-codex-labs` e que o marcador continua com `M01`; só então remova essa pasta:

```powershell
$allowed = (Resolve-Path -LiteralPath (Join-Path $env:TEMP 'tutor-ia-codex-labs')).Path
$target = (Resolve-Path -LiteralPath $workdir).Path
$marker = Join-Path $target '.course-lab-workspace'
$isOwnedCopy = $target.StartsWith(
    $allowed + [IO.Path]::DirectorySeparatorChar,
    [StringComparison]::OrdinalIgnoreCase
) -and (Get-Content -Raw -LiteralPath $marker).Trim() -eq 'M01'
if ($isOwnedCopy) {
    Remove-Item -LiteralPath $target -Recurse
} else {
    throw 'Recusa de limpeza: o caminho não é uma cópia marcada do M01.'
}
```

Não substitua `$workdir` por um caminho de outra origem. A remoção é opcional e não toca na referência nem em arquivos pessoais.
