# Especificação do M02 — Python 3.14 para engenharia profissional

**Versão:** 1.1 · **Data-base:** 15/08/2026 · **Estado:** G0 APROVADO · **Carga:** 8 blocos / 16h

**Baseline de execução de 15/08/2026:** o orquestrador aprovou G0–G6 e os 38 cenários daquela edição; os comandos e saídas são evidência histórica em `modulos/M02-python-para-dev-dotnet/RASTREABILIDADE.md`. A edição editorial de setembro requer revalidação, especialmente G6; consulte `docs/STATUS-IMPLEMENTACAO-CURSO.md` para o estado operacional atual. Esta especificação preserva o registro de agosto e não promove gate.

## 1. Decisão de escopo

O M02 cresce de seis para oito blocos, de 12h para 16h. A versão anterior mistura sintaxe, runtime, typing, validação, concorrência, paralelismo, packaging e testes em uma carga que permite repetir exemplos, mas não formar julgamento sênior. A ampliação separa responsabilidades sem transformar o módulo em enciclopédia.

Python 3.14 é a linguagem e o runtime canônicos. A explicação independe de outra stack e ensina a semântica no ponto de uso. `uv`, mypy, Pydantic, pytest e Hypothesis são implementações usadas no laboratório; padrões Python, typing specification, PyPA e contratos observáveis são o núcleo transferível.

## 2. Resultado do módulo

Ao concluir o M02, o aluno deve construir, empacotar, testar, medir e diagnosticar um CLI Python 3.14 profissional, explicando mecanismos, decisões e limites com exemplos Python. A aprovação exige demonstrar que ele:

- explica nomes, objetos, referências, mutabilidade, identidade, igualdade e hash;
- diagnostica import/path/package sem depender de “funcionou no editor”;
- distingue metadata, build backend, wheel/sdist, ambiente e lockfile;
- usa typing gradual sem confundir anotação, checker e validação runtime;
- projeta Protocols e genéricos com variance/narrowing conscientes;
- valida trust boundaries com Pydantic sem prometer invariantes inexistentes;
- implementa concorrência estruturada, cancelamento, timeout e backpressure;
- escolhe entre event loop, threads, processos, subinterpreters e free-threading por medição;
- gerencia recursos, exceções, encoding, logging e exit codes de forma cross-platform;
- executa testes unitários, integração, propriedade e mutação/controle negativo;
- produz wheel instalável em ambiente limpo e evidência reproduzível;
- usa IA para acelerar hipóteses e diffs sem aceitar código plausível como prova.

## 3. Pré-requisitos e fora de escopo

### Pré-requisitos

- M00: harness, capabilities, tool safety e evidência.
- M01: spec, task contract, gates, casos negativos e handoff.
- Git básico e terminal em Windows ou Linux.

### Fora de escopo

- ensinar FastAPI, SQLAlchemy, containers e CI completos — M03;
- arquitetura distribuída, filas duráveis e sagas — LT02;
- internals completos de CPython/C API ou autoria de extensão nativa — M11/M02A;
- escolher um único type checker, build backend ou package manager como padrão universal;
- publicar pacote real em PyPI ou usar credencial de registry;
- benchmark de hardware como ranking universal;
- afirmar equivalência semântica entre `Task`, coroutine, thread e process;
- tratar tipagem como substituta de testes ou Pydantic como substituto de regra de negócio.

## 4. Arquitetura do laboratório

```text
modulos/M02-python-para-dev-dotnet/
├── M02.html
├── README.md
├── RASTREABILIDADE.md
└── lab/
    ├── pyproject.toml
    ├── uv.lock
    ├── README.md
    ├── contracts/
    │   ├── transaction.schema.json
    │   └── evidence.schema.json
    ├── src/python_senior_lab/
    │   ├── __init__.py
    │   ├── cli.py
    │   ├── domain.py
    │   ├── parsing.py
    │   ├── ports.py
    │   ├── async_pipeline.py
    │   ├── parallelism.py
    │   ├── diagnostics.py
    │   └── evidence.py
    ├── tests/
    │   ├── unit/
    │   ├── integration/
    │   ├── property/
    │   └── negative/
    ├── fixtures/
    │   ├── csv/
    │   ├── packages/
    │   └── generated_defects/
    └── evidence/
        └── .gitkeep
```

O produto didático tem nome de distribuição/comando `csv-cleaner` e import package `python_senior_lab`. A diferença é intencional e torna executável o cenário M02-AT-005: distribution package, import package e comando instalado são namespaces distintos. O domínio exige parsing, validação, números decimais, encoding, streaming, concorrência opcional, arquivos e exit codes sem banco ou rede externa. Um servidor local descartável simula I/O no bloco de `asyncio`.

### Gates canônicos

```text
uv sync --python 3.14 --locked
uv run ruff format --check .
uv run ruff check .
uv run mypy --strict src tests
uv run pytest -q
uv build
uv run python -m python_senior_lab.cli --help
```

O gate de distribuição instala o wheel produzido em ambiente temporário sem usar o checkout como import path. O gate de benchmark registra ambiente, warm-up, amostras, mediana e percentis; não compara com número fixo universal.

## 5. Regras inegociáveis

1. Todo comando usa Python 3.14 e é confirmado em Windows; comandos POSIX possuem alternativa portátil.
2. Saída “esperada” descreve propriedades e intervalos locais, nunca um número fabricado de desempenho.
3. Nenhum teste obrigatório depende de internet, relógio de parede remoto ou serviço de terceiros.
4. `uv.lock` é lock específico do uv; `pylock.toml` é formato padronizado distinto. O módulo ensina ambos sem prometer equivalência total.
5. `requirements.txt` não é declarado morto: é um formato ainda suportado, com usos e limites próprios.
6. Ambiente virtual isola instalação/imports; não é definido como “cópia integral do interpretador”.
7. Hints são parte do sistema de typing gradual; checker e configuração determinam diagnósticos. `--strict` é conveniência versionada do mypy, não norma estável.
8. Pydantic valida nos caminhos que realmente executam validação. `model_construct()`, mutação sem `validate_assignment` e invariantes externas demonstram limites.
9. Um event loop executa tarefas cooperativamente em sua thread; aplicações podem possuir múltiplos processos, threads ou interpreters. A simplificação “Python tem um único loop” é proibida.
10. Cancelamento é parte do contrato. Cleanup usa `try/finally`; `CancelledError` não é engolido sem decisão explícita.
11. Backpressure é demonstrado com fila limitada ou semaphore e métrica de espera; “disparar tudo com gather” não é solução universal.
12. Free-threading oficialmente suportado não implica compatibilidade de extensões, ausência de sincronização ou ganho automático.
13. `frozen=True` e `slots=True` não são vendidos como imutabilidade profunda nem segurança de concorrência.
14. Código gerado por IA recebe ao menos type check, caso negativo e revisão de contrato antes de promoção.

## 6. Roteiro de oito blocos

### Bloco 1 · Projeto, ambientes, dependências e distribuição

**Competências:** `M02-B01-C01..05`.

- distinguir distribuição, import package, módulo, script, aplicação e library;
- configurar `pyproject.toml`, `[build-system]`, `[project]` e `[project.scripts]`;
- explicar ambiente, resolução, lock, sync e instalação sem acoplar o conceito ao uv;
- comparar `uv.lock`, export de requirements e `pylock.toml`;
- construir sdist/wheel e instalar o wheel em ambiente limpo.

**Prática:** inicializar pacote Python 3.14 com layout `src`, CLI instalada por entry point e lock versionado. Gerar wheel, inspecionar conteúdo e testar import/execução fora do checkout.

**Falhas semeadas:** build system ausente, package name diferente do import name, lock desatualizado, arquivo de dados ausente no wheel e execução acidental contra o source tree.

**Resultado esperado:** o aluno explica cada falha usando metadata, import path e artefato distribuído; não resolve com `sys.path.append()`.

### Bloco 2 · Modelo de objetos, imports, recursos e exceções

**Competências:** `M02-B02-C01..05`.

- raciocinar sobre nome, binding, objeto, identidade, igualdade e hash;
- prever efeitos de mutabilidade, aliasing e default mutável;
- explicar busca/import, `sys.modules`, `__main__` e imports relativos;
- implementar context manager síncrono/assíncrono com cleanup em falha;
- preservar causa por exception chaining e produzir diagnóstico acionável.

**Prática:** corrigir um parser com aliasing, chave mutável, import circular, arquivo não fechado e exceção que perde a causa. Explicar referências, identidade e igualdade diretamente em Python.

**Resultado esperado:** os cinco defeitos falham antes da correção; testes verificam identidade/igualdade, cleanup e cadeia de exceções.

### Bloco 3 · Typing gradual, Protocols e APIs verificáveis

**Competências:** `M02-B03-C01..06`.

- separar linguagem, typing specification, annotations runtime e checker;
- controlar `Any` e justificar quando `object`/Protocol é mais seguro;
- usar `TypedDict`, `Literal`, `Self`, `Never`, `TypeGuard`/`TypeIs` e narrowing;
- projetar Protocol estrutural e provar substituibilidade por dois adapters;
- usar genéricos modernos e explicar invariância/covariância/contravariância;
- lidar com annotations diferidas do Python 3.14 e introspecção por `annotationlib`/APIs adequadas.

**Prática:** uma porta `RateProvider` recebe fake determinístico e adapter local; defeitos incluem `Any` vazando, variance incorreta, narrowing inseguro, `cast` que mente e introspecção antiga de annotation.

**Resultado esperado:** mypy estrito bloqueia os defeitos estáticos; um teste runtime demonstra que hint válido não impede valor inválido quando a fronteira não valida.

### Bloco 4 · Pydantic e contratos de trust boundary

**Competências:** `M02-B04-C01..05`.

- escolher coerção ou strictness por risco e origem do dado;
- negar extras e normalizar antes de aplicar invariantes;
- projetar field/model validators sem efeitos ocultos;
- diferenciar JSON Schema, validação Pydantic e invariantes de domínio;
- demonstrar caminhos que contornam ou não repetem validação.

**Prática:** validar transações CSV/webhook com moeda, timestamp, decimal, categoria e origem. Comparar lax/strict, `extra`, `model_construct()`, mutação e serialização.

**Resultado esperado:** fixture adversarial não vira objeto confiável silenciosamente; o relatório mostra qual camada rejeitou e por quê.

### Bloco 5 · `asyncio` estruturado, cancelamento e backpressure

**Competências:** `M02-B05-C01..06`.

- explicar coroutine, Task, Future e scheduling cooperativo;
- comparar `gather` e `TaskGroup` por semântica de falha;
- propagar cancelamento e garantir cleanup com `try/finally`;
- aplicar timeout sem deixar tarefa/efeito órfão;
- limitar concorrência com semaphore/fila bounded e observar espera;
- diagnosticar loop bloqueado com debug e introspecção do Python 3.14.

**Prática:** servidor local descartável simula latência, erro e resposta lenta. Pipeline ingere N transações com TaskGroup e fila limitada. Casos negativos bloqueiam o loop, engolem `CancelledError`, criam task sem ownership e removem backpressure.

**Resultado esperado:** testes provam cancelamento de siblings, cleanup, fila limitada e ausência de tarefa pendente; benchmark registra distribuição local em vez de prometer “40x”.

### Bloco 6 · Threads, processos, subinterpreters e free-threading

**Competências:** `M02-B06-C01..05`.

- separar concorrência de paralelismo e I/O-bound de CPU-bound;
- usar `to_thread`/executor para chamada síncrona com contexto e limite;
- escolher processo ou `InterpreterPoolExecutor` considerando serialização/isolamento;
- detectar build free-threaded e estado real do GIL;
- medir compatibilidade, sincronização e custo antes de recomendar threads paralelas.

**Prática:** executar a mesma transformação CPU-bound pequena em loop, thread, processo e interpreter quando disponível. Free-threaded é matriz opcional: o gate obrigatório não depende do build 3.14t.

**Resultado esperado:** relatório explica por que o vencedor depende de payload, overhead, hardware, build e extensões; nenhuma conclusão universal nasce de uma amostra.

### Bloco 7 · Python idiomático com operabilidade

**Competências:** `M02-B07-C01..05`.

- usar iterables, iterators e generators com memória limitada;
- escolher dataclass, model Pydantic, mapping ou classe por responsabilidade;
- usar comprehensions/pattern matching sem esconder controle ou erro;
- projetar logging estruturado, encoding explícito e exit codes;
- medir tempo/memória e investigar traceback antes de otimizar.

**Prática:** refatorar código Python com estado e abstrações desnecessários para pipeline simples, mantendo contrato. Rodar arquivo UTF-8 com newline distinto, input grande em streaming e falha com correlação preservada.

**Resultado esperado:** a refatoração reduz estado/acoplamento sem sacrificar observabilidade; memória cresce de forma compatível com streaming, não com o arquivo inteiro.

### Bloco 8 · Estratégia de testes, CLI e entrega para o Capstone

**Competências:** `M02-B08-C01..06`.

- separar teste unitário, integração de filesystem/processo e contrato;
- compor fixtures com teardown e parametrização legível;
- definir propriedades e gerar casos com Hypothesis;
- executar mutação/controle negativo e localizar oráculo fraco;
- testar CLI instalada, stdout/stderr, encoding e exit codes em subprocesso;
- revisar defeitos plausíveis gerados por IA com evidência.

**Prática:** concluir `csv-cleaner`, buildar wheel, instalar em temp, executar casos feliz/triste e produzir `evidence/run.json`. Um catálogo de defeitos gerados previamente por IA contém problemas de tipo, path, decimal, async, cleanup e teste tautológico.

**Resultado esperado:** Ruff, mypy e testes passam; wheel executa fora do checkout; pelo menos um mutante é morto por cada propriedade crítica; relatório separa evidência de risco residual.

## 7. Cenários de aceitação

| ID | Cenário | Resultado obrigatório |
|---|---|---|
| M02-AT-001 | bootstrap em Python 3.14 | versão real registrada; ambiente criado sem depender de Python global implícito |
| M02-AT-002 | lock desatualizado | `--locked`/gate equivalente falha sem alterar lock |
| M02-AT-003 | build de distribuição | sdist e wheel são produzidos e inspecionados |
| M02-AT-004 | instalação limpa | CLI instalada executa fora do checkout |
| M02-AT-005 | package/import name distintos | diagnóstico explica metadata versus import package |
| M02-AT-006 | arquivo ausente no wheel | teste de distribuição falha antes da publicação |
| M02-AT-007 | default mutável | duas chamadas expõem aliasing; correção elimina compartilhamento |
| M02-AT-008 | identidade, igualdade e hash | testes cobrem chave estável e objeto não-hashable |
| M02-AT-009 | import circular/path | erro é reproduzido e corrigido sem `sys.path.append()` |
| M02-AT-010 | recurso com exceção | context manager executa cleanup e preserva causa |
| M02-AT-011 | `Any` entra na fronteira | checker deixa de provar invariantes; gate identifica vazamento |
| M02-AT-012 | Protocol com dois adapters | ambos passam a mesma suíte sem herança nominal obrigatória |
| M02-AT-013 | variance incorreta | checker rejeita substituição insegura |
| M02-AT-014 | narrowing inseguro | caso negativo alcança branch impossível alegado e falha |
| M02-AT-015 | annotation diferida | introspecção funciona no Python 3.14 sem avaliar nome ausente por acidente |
| M02-AT-016 | Pydantic lax versus strict | política muda por trust boundary e teste documenta diferença |
| M02-AT-017 | campo extra | contrato externo nega dado não declarado |
| M02-AT-018 | `model_construct()` | teste prova que instância inválida pode ser construída sem validação |
| M02-AT-019 | mutação pós-criação | comportamento com/sem `validate_assignment` é explícito |
| M02-AT-020 | invariante de domínio | schema válido ainda falha regra de negócio no domínio |
| M02-AT-021 | chamada bloqueante no loop | diagnóstico detecta starvation e correção libera o loop |
| M02-AT-022 | falha em TaskGroup | siblings são cancelados e ExceptionGroup é tratado conscientemente |
| M02-AT-023 | cancelamento externo | cleanup ocorre e `CancelledError` é propagado |
| M02-AT-024 | timeout | tarefa/efeito não fica órfão após expiração |
| M02-AT-025 | backpressure removido | fila/latência/memória pioram e o gate detecta limite ausente |
| M02-AT-026 | task sem ownership | inspeção identifica pendência/exception não recuperada |
| M02-AT-027 | I/O síncrono inevitável | thread executa com limite e contexto esperado |
| M02-AT-028 | workload CPU-bound | loop/thread/process/interpreter são medidos no ambiente registrado |
| M02-AT-029 | free-thread extension incompatível | GIL reabilitado ou incompatibilidade é detectada, não ignorada |
| M02-AT-030 | corrida em estado compartilhado | lock/message passing corrige sem confiar em lock interno de `dict` |
| M02-AT-031 | arquivo grande | generator limita memória e preserva resultado |
| M02-AT-032 | UTF-8/newline | CLI produz saída estável em Windows e Linux |
| M02-AT-033 | erro operacional | stderr, exit code e exception chain são acionáveis |
| M02-AT-034 | property test | entradas geradas encontram caso de borda não coberto pelo exemplo |
| M02-AT-035 | mutante/controle negativo | suíte falha quando regra crítica é removida |
| M02-AT-036 | defeito gerado por IA | revisão identifica pelo menos tipo, semântica e risco operacional com evidência |
| M02-AT-037 | gate final | Ruff, mypy, pytest e build passam com versões e durações registradas |
| M02-AT-038 | entrega Capstone | `core/` expõe contratos/ports sem importar framework web ou provedor de IA |

## 8. Checkpoint e rubrica

O checkpoint possui dez perguntas no total, baseadas nos cenários, sem consulta, e demonstração de oito entregáveis. Aprovação:

- mínimo de 80% nas perguntas;
- 100% nos itens de cancelamento, trust boundary, encoding/path, distribuição limpa e casos negativos;
- execução ao vivo do gate final e de duas falhas semeadas;
- defesa de uma escolha entre asyncio/thread/process/interpreter com evidência do próprio ambiente;
- explicação de duas escolhas de implementação Python e de seus limites.

Não contam como evidência: saída copiada do HTML, benchmark sem ambiente/amostras, teste marcado `skip`, número hardcoded, execução só dentro do checkout ou resposta de IA sem reprodução.

## 9. Fontes e risco de obsolescência

| ID | Fonte primária | Uso | Risco |
|---|---|---|---|
| SRC-M02-01 | [Python 3.14 — What’s New](https://docs.python.org/3.14/whatsnew/3.14.html) | baseline, annotations, interpreters, asyncio e free-threading | médio |
| SRC-M02-02 | [Python Language Reference](https://docs.python.org/3.14/reference/) | modelo de objetos, execução, imports e linguagem | baixo |
| SRC-M02-03 | [Python import system](https://docs.python.org/3.14/reference/import.html) | busca, cache, loading e `__main__` | baixo |
| SRC-M02-04 | [Python asyncio tasks](https://docs.python.org/3.14/library/asyncio-task.html) | TaskGroup, gather, cancelamento e threads | médio |
| SRC-M02-05 | [Python asyncio queues](https://docs.python.org/3.14/library/asyncio-queue.html) | backpressure e shutdown | médio |
| SRC-M02-06 | [Python free-threading HOWTO](https://docs.python.org/3.14/howto/free-threading-python.html) | detecção, compatibilidade, sincronização e limites | alto |
| SRC-M02-07 | [Python concurrent execution](https://docs.python.org/3.14/library/concurrency.html) | threads, processos, interpreters e subprocess | médio |
| SRC-M02-08 | [Python typing specification](https://typing.python.org/en/latest/spec/) | semântica agnóstica de checker | médio |
| SRC-M02-09 | [PyPA — pyproject.toml](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/) | metadata, build backend e entry points | médio |
| SRC-M02-10 | [PyPA — pylock.toml](https://packaging.python.org/en/latest/specifications/pylock-toml/) | lockfile interoperável | alto |
| SRC-M02-11 | [uv projects](https://docs.astral.sh/uv/guides/projects/) | implementação de ambiente/projeto | alto |
| SRC-M02-12 | [uv locking and syncing](https://docs.astral.sh/uv/concepts/projects/sync/) | lock, sync, frozen e locked | alto |
| SRC-M02-13 | [uv package guide](https://docs.astral.sh/uv/guides/package/) | build, instalação limpa e publicação simulada | alto |
| SRC-M02-14 | [mypy command line](https://mypy.readthedocs.io/en/stable/command_line.html) | implementação do checker e `--strict` | alto |
| SRC-M02-15 | [Pydantic models](https://docs.pydantic.dev/latest/concepts/models/) | validação, construct e configuração | alto |
| SRC-M02-16 | [Pydantic strict mode](https://docs.pydantic.dev/latest/concepts/strict_mode/) | coerção e trust boundary | alto |
| SRC-M02-17 | [pytest fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html) | fixtures, teardown e scopes | médio |
| SRC-M02-18 | [pytest parametrization](https://docs.pytest.org/en/stable/how-to/parametrize.html) | matriz de casos | médio |
| SRC-M02-19 | [Hypothesis documentation](https://hypothesis.readthedocs.io/en/latest/) | property-based testing | médio |
| SRC-M02-20 | [Python contextlib](https://docs.python.org/3.14/library/contextlib.html) | gestão determinística de recursos | baixo |

Documentação Python 3.14 e PyPA foi revalidada em 15/08/2026. Fontes de implementação (`uv`, mypy, Pydantic, pytest, Hypothesis) devem ser revalidadas em até 90 dias e ter versões gravadas na evidência do lab.

## 10. Integração curricular

- **Entrada do M01:** task contract, gates, evidence e caso negativo definem como o M02 é construído.
- **Saída para M03:** wheel/CLI, settings/ports e domínio tipado; M03 adiciona HTTP/banco sem reensinar Python básico.
- **Saída para M05/M08/M09:** Protocols e Pydantic formam os contratos agnósticos de provider/tool/protocolo.
- **Saída para M06:** property/mutation tests e evidence runner tornam evals menos frágeis.
- **Saída para M10/LT02:** TaskGroup, cancelamento e backpressure sustentam durabilidade e sistemas distribuídos, sem substituí-los.
- **Limite com M02A:** M02 ensina domínio profissional da linguagem; M02A amplia arquitetura, dados, segurança, entrega, liderança e compatibilidade entre implementações Python em sistema maior.

## 11. Gate G0

- [x] oito blocos e ampliação para 16h justificados;
- [x] 38 cenários positivos, negativos, cross-platform e de falha;
- [x] laboratório local, instalável e sem dependência obrigatória de rede;
- [x] Python 3.14 e mudanças relevantes incluídos sem hype;
- [x] padrões separados de uv/mypy/Pydantic/pytest;
- [x] afirmações absolutas incorretas substituídas por contratos com limites;
- [x] testing, operação, distribuição e evidência fazem parte da conclusão;
- [x] explicação autossuficiente e Python mantido como linguagem canônica;
- [x] fontes primárias classificadas, datadas e com risco de obsolescência;
- [x] escopo não duplica M03, LT02, M11 ou M02A.

**Decisão em 15/08/2026:** G0–G6 aprovados. O HTML regenerado, o laboratório, a rastreabilidade, a portabilidade Windows/3.14t/Linux e a inspeção visual substituíram o artefato legado; o M02 está `VERIFICADO`.

## Revisão didática — 12/09/2026

Removida a exigência de analogias com outra stack na autoria e na rubrica. Os 38 cenários técnicos foram preservados. A evidência de agosto permanece histórica; a apresentação e o checkpoint revisados exigem revalidação editorial. As 16h são estimativa de escopo, sem duração obrigatória por sessão.
