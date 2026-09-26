# FIX-02 — gate M06 fechado por categoria e regressão

**Estado:** REVISADO
**Sessão de autoria:** 01a0d696-83dc-77b0-89b8-cf0e6394992f
**Sessão de revisão:** 01a0d6a8-d38d-78b1-bd51-e9b122837b56
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador
**Data:** 25/09/2026
**Trilha:** principal · **Bloco em foco:** M06 B06
**ATs/gates:** nenhum AT ou gate promovido; revisão independente concluída.

## Objetivo e baseline focal

Evitar que um relatório atual vazio pareça aprovação, impedir comparação de resultados incompatíveis e fazer a amostra abaixo da política gerar `INCONCLUSIVO`, sem tratá-la como regressão confirmada.

Baseline antes das alterações, cwd `modulos/M06-evals-observabilidade/lab`, CPython 3.14.7:

```text
./.venv/bin/python -m pytest -q
41 passed, 28 warnings in 0.20s
```

A auditoria anterior registrou que `decidir({'por_categoria': {}}, {'por_categoria': {'injection': 100, 'vazamento': 100}})` retornava `([], [])`. A implementação já presente rejeitava relatórios sem schema/categorias; a regressão nova conserva um relatório atual válido estruturalmente, mas com `por_categoria` vazio, contra uma baseline completa, e exige erro acionável.

## Alterações focais

- `modulos/M06-evals-observabilidade/lab/src/eval_lab/gate.py`: schema exige `metric_version`; atual e baseline precisam usar o mesmo `dataset_id`, `metric_version` e conjunto de categorias. O denominador de cada categoria precisa coincidir; para mudar a composição, versione o dataset e estabeleça baseline correspondente. Falta de categoria continua erro de entrada, não aprovação.
- O contrato do laboratório fixa `MIN_AMOSTRA_POR_CATEGORIA = 30`. Abaixo disso, `AmostraInsuficienteError` identifica o resultado como `INCONCLUSIVO`; o CLI imprime essa classificação e retorna código 2, bloqueando promoção sem declarar regressão nem falha do aluno. O limite é uma política operacional explícita deste gate offline, não afirmação de poder estatístico ou tamanho universalmente suficiente.
- `modulos/M06-evals-observabilidade/lab/src/eval_lab/runner.py` registra `metric_version` nos relatórios recém-produzidos.
- `tests/test_gate.py`, `test_gate_tracing.py` e `test_runner.py` cobrem relatório vazio, versão incompatível, denominador divergente, fronteira da tolerância com denominador compatível, amostra curta, saída CLI inconclusiva, piso de segurança e compatibilidade do agregador.

## Validações executadas

```text
./.venv/bin/python --version
Python 3.14.7

./.venv/bin/python -m pytest -q
46 passed, 28 warnings in 0.24s

./.venv/bin/ruff check .
All checks passed!

./.venv/bin/mypy src tests
Success: no issues found in 13 source files
```

As 28 advertências vêm do `pytest-asyncio` sobre APIs de política de event loop depreciadas no Python 3.14; não causaram falhas. A suíte é local e offline. O conjunto sintético pequeno do laboratório passa a `INCONCLUSIVO` no gate quando não atinge o mínimo; por isso ele prova o mecanismo, não sustenta decisão estatística sobre produto.

## Limites e próxima ação

- Alteração de `metric_version`, dataset ou denominador requer baseline revisada, não comparação automática entre populações diferentes.
- O mínimo 30 não estima poder, intervalo de confiança ou equivalência; a especificação do experimento real precisa pré-registrar desenho e incerteza apropriados antes de promover resultados.
- Nenhum AT, gate, rastreabilidade curricular ou prontidão do M06 foi promovido. `PROGRESSO.md` permaneceu intocado.
- A revisão independente do schema, cálculo, controles negativos e execução foi concluída nesta sessão. FIX-03 permanece em trilha separada, com correção aguardando revisão independente.

## Revisão independente — 25/09/2026

**Sessão de revisão:** `01a0d6a8-d38d-78b1-bd51-e9b122837b56` · **Modelo/esforço:** `gpt-6-luna / high`, configuração do agendador.

Revisados `gate.py`, `runner.py`, os testes focais e os critérios FIX-02. A validação exige as seis categorias obrigatórias, contagens coerentes e taxa derivada; compara `dataset_id`, `metric_version`, conjunto de categorias e denominadores antes da decisão. O caminho vazio não pode aprovar. A amostra abaixo do mínimo gera `INCONCLUSIVO` e código 2; o piso de segurança é exercitado abaixo do limite e a tolerância aceita a queda exatamente no limite. Os controles correspondem ao cartão.

Reexecução real, cwd `modulos/M06-evals-observabilidade/lab`, ambiente local Python 3.14.7:

```text
uv run --locked --offline pytest -q
46 passed, 28 warnings in 0.22s

uv run --locked --offline ruff check .
All checks passed!

uv run --locked --offline mypy
Success: no issues found in 13 source files
```

As advertências são de APIs de política de event loop depreciadas em `pytest-asyncio`; não afetam o resultado desta suíte. O limiar 30 está identificado como política local, sem alegação de poder, intervalo ou equivalência; portanto esta aprovação cobre o mecanismo do gate, não uma conclusão estatística de produto. FIX-02 fica REVISADO, sem promoção de AT ou gate.
