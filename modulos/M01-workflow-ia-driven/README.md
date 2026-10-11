# M01 · SDD, harness e execução paralela segura

**Fase 2** · 5 blocos / 10h · Pré-requisito: M00. Estado: [STATUS](../../STATUS.md).

## Resultado do módulo

O M01 ensina a transformar intenção em mudanças pequenas, rastreáveis e verificáveis. O agente executa sob contrato, capabilities e gates; não é tratado como autoridade do processo. Conceitos permanecem agnósticos, Python 3.14 é a linguagem canônica sem pressupor conhecimento de outra stack.

## Materiais

- [`M01.html`](M01.html): material principal, cinco blocos/10h;
- [`lab/README.md`](lab/README.md): referência executável; o roteiro de ambiente, código e diagnóstico fica no laboratório ao fim do HTML;
- `lab/contracts/feature-contract.schema.json`: contrato estrutural Draft 2020-12;
- `lab/src/sdd_lab/`: parser, drift, runner, workflow, policy, adapters, Git e Capstone;
- `lab/skills/`: três Agent Skills portáteis;
- `lab/fixtures/`: falhas e cenários descartáveis.

## Blocos

1. intenção, requisitos, rastreabilidade e drift bidirecional;
2. runner cross-platform, gates, evidência e controles negativos;
3. estado externalizado, pause/resume, orçamento e 12-Factor Agents sob crítica;
4. DAG, read/write sets, recursos, worktrees descartáveis e integração por waves;
5. kit portátil, revisão de workflow externo e primeira fatia do Capstone.

## Cópia de trabalho e baseline

Não execute a prática na pasta `lab/` versionada. A partir dela, use:

```powershell
python .\create_working_copy.py
```

O comando cria uma cópia marcada em diretório temporário. O **Laboratório guiado M01** em `M01.html` explica o código a reconstruir, os comandos, os resultados e a recuperação de falhas. `--reference` mantém a cópia completa apenas para comparação.

## Baseline executada

```text
uv sync --python 3.14 --extra dev
uv run ruff format --check .
uv run ruff check .
uv run mypy --strict src tests
uv run python -m unittest discover -s tests -v
```

Resultado técnico registrado em 14/08/2026 e apresentação revalidada em 15/08/2026:

```text
Python 3.14.7
Ruff: 33 arquivos formatados; lint aprovado
mypy strict: 21 arquivos sem issues
unittest: 27 testes — OK
HTML: 9.167 palavras visíveis por métrica editorial, 18 blocos de código,
      21 resultados esperados, 20 links externos e zero overflow horizontal
```

Os testes Git criam repositório e worktrees somente em `TemporaryDirectory`. Falta de Git bloqueia o gate; não há `skip`, `git add -A`, remoção forçada nem operação no repositório do curso.

