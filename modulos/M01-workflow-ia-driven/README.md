# M01 · SDD, harness e execução paralela segura

## Resultado do módulo

O M01 ensina a transformar intenção em mudanças pequenas, rastreáveis e verificáveis. O agente executa sob contrato, capabilities e gates; não é tratado como autoridade do processo. Conceitos permanecem agnósticos, Python 3.14 é a linguagem canônica e .NET aparece como ponte para conhecimento transferível.

## Materiais

- [`M01.html`](M01.html): material principal, cinco blocos/10h;
- [`lab/README.md`](lab/README.md): ambiente, comandos e limites do laboratório;
- [`RASTREABILIDADE.md`](RASTREABILIDADE.md): 27 competências, 22 cenários e gates;
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

## Estado editorial

G0–G6 estão aprovados. Em 15/08/2026, a apresentação foi alinhada ao contrato visual e didático do M00: header de saída, mapa navegável, contrato pedagógico, seções identificadas, numeração progressiva, callouts semânticos, diagnóstico e fontes como fechamento. A revisão visual em localhost confirmou tipografia equivalente, largura de 1100 px, seis âncoras válidas e ausência de overflow horizontal.
