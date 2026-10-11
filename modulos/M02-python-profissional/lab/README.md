# Laboratório M02 — referência executável

Este README orienta a cópia descartável e os gates locais. O conteúdo e os exemplos completos estão no [Laboratório guiado M02](../M02.html#lab). As instruções abaixo não registram uma execução atual nem promovem ATs ou gates.

## Criar e preparar uma cópia

Abra PowerShell na raiz do curso. Guarde a raiz para voltar depois e crie uma cópia nova da referência:

```powershell
$courseRoot = (Get-Location).Path
Set-Location .\modulos\M02-python-profissional\lab
$workdir = python .\create_working_copy.py
Set-Location $workdir
Get-Content -Raw -LiteralPath .\.course-lab-workspace
```

O último comando deve mostrar `M02`. A cópia nasce em uma pasta temporária `tutor-ia-codex-labs`, recebe esse marcador e ignora `.venv` e caches. O modo padrão deixa `src/python_senior_lab/models.py` preparado para reconstrução pelo roteiro. Para inspecionar uma cópia intacta, crie outra com `python .\create_working_copy.py --reference` a partir do diretório da referência.

## Dependências e comandos

Os comandos desta seção usam como `cwd` o caminho impresso em `$workdir`. O projeto requer Python 3.14. `uv sync --python 3.14 --locked` instala as dependências do projeto e o grupo `dev` padrão: build, Hypothesis, mypy, pytest e Ruff. O `pyproject.toml` não declara extras opcionais. Não substitua a sincronização por `pip install` nem altere versões para contornar falha de rede/cache.

```powershell
uv sync --python 3.14 --locked
uv run ruff format --check .
uv run ruff check .
uv run mypy --strict src tests
uv run pytest -q
uv build
uv run python -m python_senior_lab.cli --help
```

O mypy também configura `strict = true` e `files = ["src", "tests"]` no projeto; os caminhos explícitos no comando tornam o escopo do gate visível. `uv.lock` é o formato de lock do uv; `pylock.toml` é um padrão separado. A matriz free-threaded e de subinterpreters é diagnóstica, não dependência obrigatória do gate local.

Para exercitar a CLI na cópia, ainda com `cwd=$workdir`:

```powershell
uv run csv-cleaner fixtures/csv/valid.csv output.csv --evidence evidence/run.json
```

O contrato de entrada e os códigos de saída estão explicados no laboratório HTML. O arquivo de evidência descreve apenas a execução que o aluno realizar naquela cópia.

## Diagnóstico e retomada

| Sintoma | Primeira verificação | Retomada segura |
|---|---|---|
| `uv sync` não consegue baixar dependência | confirme Python 3.14, mensagem do uv e `uv.lock` | mantenha `$workdir`; quando os pacotes estiverem disponíveis, volte à cópia e repita `uv sync --python 3.14 --locked` |
| `No module named python_senior_lab` | confirme `Get-Location` e se está em `$workdir` | execute `uv sync` e o comando por `uv run`; não instale a partir do checkout original |
| mypy ou pytest falha depois da reconstrução | leia o primeiro arquivo/linha e compare com a referência intacta | corrija a cópia guiada e repita o gate correspondente; não altere o teste para esconder o erro |
| perdeu a sessão ou quer recomeçar | a referência permanece no repositório; `$workdir` identifica a tentativa | retome com `Set-Location $workdir` ou crie outra cópia nova pelo script |

Se o terminal fechar, abra PowerShell, recupere `$courseRoot` pelo caminho da raiz do curso e `$workdir` pelo diretório impresso pelo script; então execute `Set-Location $workdir`. A cópia anterior pode continuar no temporário até deixar de ser útil.

## Limpeza opcional da cópia possuída

Volte à raiz do curso antes de apagar. O bloco remove somente uma subpasta do diretório temporário esperado cujo marcador confirma propriedade M02:

```powershell
Set-Location $courseRoot
$allowed = [IO.Path]::GetFullPath((Join-Path ([IO.Path]::GetTempPath()) 'tutor-ia-codex-labs'))
$target = (Resolve-Path -LiteralPath $workdir).Path
$marker = Join-Path $target '.course-lab-workspace'
$owned = $target.StartsWith(
    $allowed + [IO.Path]::DirectorySeparatorChar,
    [StringComparison]::OrdinalIgnoreCase
) -and (Test-Path -LiteralPath $marker) -and
    (Get-Content -Raw -LiteralPath $marker).Trim() -eq 'M02'
if ($owned) {
    Remove-Item -LiteralPath $target -Recurse
} else {
    throw 'Recusa de limpeza: o caminho não é uma cópia temporária marcada do M02.'
}
```

Não substitua `$workdir` por caminho digitado. A limpeza é opcional e não afeta a referência, outras cópias ou `PROGRESSO.md`.
