# M02 · Python 3.14 para engenharia profissional

**Fase 0** · 8 blocos / 16h · Pré-requisito: F02. Estado: [STATUS](../../STATUS.md).

O laboratório Python 3.14 é executável e foi verificado nos runtimes CPython 3.14 e 3.14t.

## Resultado do módulo

Ao concluir o M02, o aluno deverá construir, empacotar, testar, medir e diagnosticar uma CLI Python 3.14 profissional. Python é a linguagem canônica; .NET/C# funciona como ponte comparativa para mostrar tanto analogias úteis quanto diferenças que produzem defeitos.

O aprofundamento cobre cinco níveis: fundamento conceitual, decisão e trade-off, implementação, falha e diagnóstico, evidência e transferência. Ferramentas como uv, mypy, Pydantic, pytest e Hypothesis são implementações substituíveis; Python, typing specification, PyPA e contratos observáveis formam o núcleo agnóstico.

## Materiais e estado

- [`M02.html`](M02.html): oito blocos/16h, checkpoint com dez perguntas, diagnóstico e vinte fontes primárias;
- `docs/especificacoes/M02-ESPECIFICACAO.md`: regras, arquitetura do lab e rubrica;
- [`lab/`](lab/): pacote instalável, 51 testes nos runtimes CPython 3.14/3.14t e Linux, build e prova limpa; evidências no README do laboratório.

## Estrutura aprovada — oito blocos/16h

1. **Projeto, ambientes, dependências e distribuição:** import package versus distribution, `pyproject.toml`, build backend, entry point, lock/sync, sdist/wheel e instalação limpa.
2. **Modelo de objetos, imports, recursos e exceções:** bindings, mutabilidade, identidade/igualdade/hash, import system, context managers, cleanup e exception chaining.
3. **Typing gradual, Protocols e APIs verificáveis:** `Any`, narrowing, tipos modernos, generics/variance, tipagem estrutural e annotations diferidas do Python 3.14.
4. **Pydantic e contratos de trust boundary:** coerção/strictness, extras, validators, schema versus domínio, `model_construct()` e mutação pós-criação.
5. **`asyncio` estruturado, cancelamento e backpressure:** `TaskGroup`, `ExceptionGroup`, timeout, ownership de tasks, cleanup, fila limitada e diagnóstico do loop.
6. **Threads, processos, subinterpreters e free-threading:** escolha por workload medido, serialização/isolamento, estado real do GIL, extensões e sincronização.
7. **Python idiomático com operabilidade:** generators/streaming, estruturas de dados por responsabilidade, encoding, logging, exit codes, traceback, tempo e memória.
8. **Testes, CLI e entrega para o Capstone:** unitário/integração/contrato, fixtures, property tests, mutação/controle negativo, subprocesso e wheel instalado.

## Produto didático implementado

O laboratório produz a distribuição/comando `csv-cleaner` com import package `python_senior_lab`. A diferença é intencional: nome publicado, namespace de importação e entry point não são o mesmo contrato. A CLI exercita parsing, validação, Decimal, encoding, streaming, concorrência, filesystem e exit codes sem banco ou rede externa obrigatórios.

Entregáveis existentes:

- pacote com layout `src`, wheel/sdist e entry point instalável;
- domínio e ports tipados, sem dependência de framework web ou provedor de IA;
- casos unitários, integração, property-based e controles negativos;
- benchmark com ambiente, warm-up, amostras, mediana/percentis e limitações;
- evidência estruturada com versões, duração, comandos e resultados reais;
- catálogo de defeitos plausíveis gerados por IA para revisão orientada a contrato.

## Baseline técnica (15/08/2026)

```text
uv sync --python 3.14 --locked
uv run ruff format --check .
uv run ruff check .
uv run mypy --strict src tests
uv run pytest -q
uv build
uv run python -m python_senior_lab.cli --help
```

Foram reproduzidos lock/sync, Ruff format/lint, mypy strict, **51 testes** nos runtimes CPython 3.14 e 3.14t, build/inspeção de sdist/wheel e instalação do wheel em ambiente separado. A distribuição `csv-cleaner==0.1.0` importou `python_senior_lab` de `site-packages` e processou duas linhas em CPython 3.14.7/Windows. No 3.14t, a suíte passou com GIL desativado e `pydantic-core` não alterou esse modo. No WSL2/Ubuntu, os 51 testes e a CLI passaram em CPython 3.14.7, com saída UTF-8/LF. Loop/thread/process/interpreter produziram o mesmo hash, sem ranking fixo.

## Critério de aprovação

- mínimo de 80% no checkpoint;
- 100% em cancelamento, trust boundary, encoding/path, distribuição limpa e casos negativos;
- execução ao vivo do gate final e de duas falhas semeadas;
- defesa baseada em evidência de uma escolha entre asyncio, thread, processo e interpreter;
- explicação de analogias .NET úteis e de pontos onde a equivalência quebra.

Saída copiada, teste ignorado, benchmark sem contexto, número hardcoded, execução apenas no checkout ou resposta de IA sem reprodução não são evidência.

## Fontes

A especificação registra 20 fontes primárias/versionáveis: documentação Python 3.14, typing specification, PyPA e documentação oficial de uv, mypy, Pydantic, pytest e Hypothesis. Afirmações sobre implementação devem ser testadas na versão fixada pelo laboratório; fontes de ferramentas devem ser revalidadas em até 90 dias.

Nenhuma tecnologia ou empresa define sozinha o conhecimento do módulo. O material distingue padrão, especificação, comportamento do runtime, implementação de ferramenta e decisão local de engenharia.

