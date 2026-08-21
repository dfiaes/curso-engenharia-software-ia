# Rastreabilidade do M02

**Data-base:** 15/08/2026 · **Especificação:** `docs/especificacoes/M02-ESPECIFICACAO.md` · **Estado:** VERIFICADO / G0–G6 APROVADOS

## Regra de leitura do estado

Este documento separa intenção de evidência. `ESPECIFICADO` significa que competência, cenário, fonte e oráculo foram definidos no G0; não significa que o HTML, o laboratório ou a avaliação já os implementem. Um item só muda para `VERIFICADO` depois de execução reproduzível e revisão do artefato pelo orquestrador.

O baseline anterior (seis blocos/12h, sem laboratório) foi substituído. O HTML atual comprova G1/G3; execução parcial, evidência Windows e revisão desktop sustentam apenas os estados explicitamente promovidos abaixo.

## Escopo aprovado

- **Carga:** oito blocos de 2h, total de 16h;
- **Linguagem/runtime canônicos:** Python 3.14;
- **Ponte de transição:** .NET/C# apenas para localizar analogias úteis e seus limites;
- **Produto didático:** CLI instalável `csv-cleaner`, sem dependência obrigatória de rede;
- **Profundidade:** conceito, decisão/trade-off, implementação, falha/diagnóstico e evidência/transferência;
- **Inventário:** 43 competências, 38 cenários de aceitação e 20 fontes primárias/versionáveis.

## Competências por bloco

### Bloco 1 · Projeto, ambientes, dependências e distribuição

| ID | Resultado observável | Cenários | Fontes | Estado |
|---|---|---|---|---|
| M02-B01-C01 | distinguir distribuição, import package, módulo, script, aplicação e library | AT-003–006 | SRC-02, SRC-03, SRC-09 | ESPECIFICADO |
| M02-B01-C02 | configurar build system, metadata e entry point em `pyproject.toml` | AT-003, AT-004, AT-006 | SRC-09, SRC-13 | ESPECIFICADO |
| M02-B01-C03 | explicar ambiente, resolução, lock e sync sem acoplar conceito ao uv | AT-001, AT-002 | SRC-09–12 | ESPECIFICADO |
| M02-B01-C04 | comparar `uv.lock`, requirements exportado e `pylock.toml` com seus limites | AT-002, AT-003 | SRC-10–13 | ESPECIFICADO |
| M02-B01-C05 | produzir sdist/wheel e executar a CLI instalada fora do checkout | AT-003, AT-004, AT-006 | SRC-09, SRC-13 | ESPECIFICADO |

### Bloco 2 · Modelo de objetos, imports, recursos e exceções

| ID | Resultado observável | Cenários | Fontes | Estado |
|---|---|---|---|---|
| M02-B02-C01 | raciocinar sobre nome, binding, objeto, identidade, igualdade e hash | AT-007, AT-008 | SRC-02 | ESPECIFICADO |
| M02-B02-C02 | prever mutabilidade, aliasing e default mutável | AT-007, AT-008 | SRC-02 | ESPECIFICADO |
| M02-B02-C03 | diagnosticar import path, cache, `__main__` e imports relativos | AT-009 | SRC-03 | ESPECIFICADO |
| M02-B02-C04 | implementar context manager síncrono/assíncrono com cleanup em falha | AT-010, AT-023, AT-024 | SRC-04, SRC-20 | ESPECIFICADO |
| M02-B02-C05 | preservar causa por exception chaining e produzir diagnóstico acionável | AT-010, AT-033 | SRC-02, SRC-20 | ESPECIFICADO |

### Bloco 3 · Typing gradual, Protocols e APIs verificáveis

| ID | Resultado observável | Cenários | Fontes | Estado |
|---|---|---|---|---|
| M02-B03-C01 | separar linguagem, typing specification, annotation runtime e checker | AT-011, AT-015 | SRC-01, SRC-08, SRC-14 | ESPECIFICADO |
| M02-B03-C02 | controlar `Any` e justificar `object` ou Protocol | AT-011, AT-014 | SRC-08, SRC-14 | ESPECIFICADO |
| M02-B03-C03 | aplicar tipos modernos e narrowing sem alegar prova inexistente | AT-014, AT-015 | SRC-01, SRC-08 | ESPECIFICADO |
| M02-B03-C04 | provar substituibilidade estrutural com dois adapters | AT-012 | SRC-08 | ESPECIFICADO |
| M02-B03-C05 | explicar invariância, covariância e contravariância em uma API genérica | AT-013 | SRC-08 | ESPECIFICADO |
| M02-B03-C06 | introspectar annotations diferidas do Python 3.14 com API apropriada | AT-015 | SRC-01, SRC-08 | ESPECIFICADO |

### Bloco 4 · Pydantic e contratos de trust boundary

| ID | Resultado observável | Cenários | Fontes | Estado |
|---|---|---|---|---|
| M02-B04-C01 | escolher coerção ou strictness conforme origem e risco | AT-016 | SRC-15, SRC-16 | ESPECIFICADO |
| M02-B04-C02 | negar extras e normalizar antes de aplicar invariantes | AT-017, AT-020 | SRC-15 | ESPECIFICADO |
| M02-B04-C03 | projetar validators sem efeitos ocultos | AT-016, AT-020 | SRC-15, SRC-16 | ESPECIFICADO |
| M02-B04-C04 | separar JSON Schema, validação Pydantic e regra de domínio | AT-016–020 | SRC-15, SRC-16 | ESPECIFICADO |
| M02-B04-C05 | demonstrar caminhos que contornam ou não repetem validação | AT-018, AT-019 | SRC-15 | ESPECIFICADO |

### Bloco 5 · `asyncio` estruturado, cancelamento e backpressure

| ID | Resultado observável | Cenários | Fontes | Estado |
|---|---|---|---|---|
| M02-B05-C01 | explicar coroutine, Task, Future e scheduling cooperativo | AT-021, AT-026 | SRC-04 | ESPECIFICADO |
| M02-B05-C02 | comparar `gather` e `TaskGroup` pela semântica de falha | AT-022 | SRC-04 | ESPECIFICADO |
| M02-B05-C03 | propagar cancelamento e garantir cleanup com `try/finally` | AT-023 | SRC-04, SRC-20 | ESPECIFICADO |
| M02-B05-C04 | aplicar timeout sem deixar tarefa ou efeito órfão | AT-024, AT-026 | SRC-04 | ESPECIFICADO |
| M02-B05-C05 | impor e observar backpressure com fila ou semaphore limitada | AT-025 | SRC-05 | ESPECIFICADO |
| M02-B05-C06 | diagnosticar loop bloqueado e tarefas sem ownership | AT-021, AT-026 | SRC-01, SRC-04 | ESPECIFICADO |

### Bloco 6 · Threads, processos, subinterpreters e free-threading

| ID | Resultado observável | Cenários | Fontes | Estado |
|---|---|---|---|---|
| M02-B06-C01 | separar concorrência, paralelismo, I/O-bound e CPU-bound | AT-028 | SRC-07 | ESPECIFICADO |
| M02-B06-C02 | executar chamada síncrona em thread com contexto e limite | AT-027 | SRC-04, SRC-07 | ESPECIFICADO |
| M02-B06-C03 | escolher processo ou interpreter considerando serialização e isolamento | AT-028 | SRC-01, SRC-07 | ESPECIFICADO |
| M02-B06-C04 | detectar build free-threaded e estado efetivo do GIL | AT-029 | SRC-01, SRC-06 | ESPECIFICADO |
| M02-B06-C05 | medir compatibilidade, sincronização e custo antes de recomendar paralelismo | AT-028–030 | SRC-06, SRC-07 | ESPECIFICADO |

### Bloco 7 · Python idiomático com operabilidade

| ID | Resultado observável | Cenários | Fontes | Estado |
|---|---|---|---|---|
| M02-B07-C01 | processar iterables, iterators e generators com memória limitada | AT-031 | SRC-02 | ESPECIFICADO |
| M02-B07-C02 | escolher dataclass, Pydantic model, mapping ou classe por responsabilidade | AT-008, AT-020, AT-031 | SRC-02, SRC-15 | ESPECIFICADO |
| M02-B07-C03 | usar comprehension e pattern matching sem esconder controle ou erro | AT-031, AT-033 | SRC-02 | ESPECIFICADO |
| M02-B07-C04 | produzir logging, encoding e exit codes operáveis | AT-032, AT-033 | SRC-02 | ESPECIFICADO |
| M02-B07-C05 | medir tempo/memória e investigar traceback antes de otimizar | AT-028, AT-031, AT-033 | SRC-02, SRC-07 | ESPECIFICADO |

### Bloco 8 · Estratégia de testes, CLI e entrega para o Capstone

| ID | Resultado observável | Cenários | Fontes | Estado |
|---|---|---|---|---|
| M02-B08-C01 | separar testes unitários, integração, processo e contrato | AT-003, AT-004, AT-032, AT-033 | SRC-17, SRC-18 | ESPECIFICADO |
| M02-B08-C02 | compor fixtures com teardown e parametrização legível | AT-010, AT-023, AT-032 | SRC-17, SRC-18 | ESPECIFICADO |
| M02-B08-C03 | definir propriedades e gerar entradas com Hypothesis | AT-034, AT-035 | SRC-19 | ESPECIFICADO |
| M02-B08-C04 | usar mutação/controle negativo para revelar oráculo fraco | AT-035, AT-036 | SRC-17–19 | ESPECIFICADO |
| M02-B08-C05 | testar CLI instalada, streams, encoding e exit codes em subprocesso | AT-004, AT-032, AT-033 | SRC-07, SRC-17 | ESPECIFICADO |
| M02-B08-C06 | revisar defeitos plausíveis gerados por IA e entregar evidência reproduzível | AT-036–038 | fontes correspondentes ao defeito | ESPECIFICADO |

## Cenários de aceitação

| ID | Foco e oráculo obrigatório | Bloco | Estado |
|---|---|---|---|
| M02-AT-001 | bootstrap registra Python 3.14 real e não depende de global implícito | B1 | VERIFICADO — 3.14.7 em ambiente limpo |
| M02-AT-002 | lock desatualizado faz gate locked equivalente falhar sem mutação | B1 | VERIFICADO — offline/temp, lock byte a byte intacto |
| M02-AT-003 | sdist e wheel são produzidos e inspecionados | B1/B8 | VERIFICADO — ambos construídos; wheel instalado |
| M02-AT-004 | CLI instalada executa fora do checkout | B1/B8 | VERIFICADO — ambiente separado/site-packages |
| M02-AT-005 | diagnóstico separa package de distribuição e import package | B1 | VERIFICADO — `csv-cleaner` / `python_senior_lab` |
| M02-AT-006 | teste detecta arquivo ausente no wheel | B1 | VERIFICADO — wheel sintético + inspeção do wheel real |
| M02-AT-007 | caso negativo expõe default mutável/aliasing e correção elimina compartilhamento | B2 | VERIFICADO |
| M02-AT-008 | testes distinguem identidade, igualdade, hashable e não-hashable | B2 | VERIFICADO — igualdade/hash estável e lista não-hashable explícita |
| M02-AT-009 | import circular/path falha e é corrigido sem `sys.path.append()` | B2 | VERIFICADO — pacote temporário/subprocesso |
| M02-AT-010 | context manager limpa recurso e preserva exception chain | B2/B8 | VERIFICADO |
| M02-AT-011 | gate identifica vazamento de `Any` em fronteira | B3 | VERIFICADO — `--disallow-any-expr` |
| M02-AT-012 | dois adapters passam a mesma suíte via Protocol | B3 | VERIFICADO |
| M02-AT-013 | checker rejeita variance insegura | B3 | VERIFICADO |
| M02-AT-014 | caso negativo derruba narrowing alegado incorretamente | B3 | VERIFICADO |
| M02-AT-015 | introspecção de annotation diferida evita avaliação acidental | B3 | VERIFICADO |
| M02-AT-016 | testes documentam política lax versus strict por trust boundary | B4 | VERIFICADO |
| M02-AT-017 | contrato externo rejeita campo extra | B4 | VERIFICADO |
| M02-AT-018 | teste prova que `model_construct()` contorna validação | B4 | VERIFICADO |
| M02-AT-019 | mutação pós-criação tem comportamento explícito com/sem `validate_assignment` | B4 | VERIFICADO |
| M02-AT-020 | regra de domínio rejeita payload que passou pelo schema | B4 | VERIFICADO |
| M02-AT-021 | diagnóstico detecta starvation causado por chamada bloqueante | B5 | VERIFICADO — servidor local/oráculo causal |
| M02-AT-022 | falha em `TaskGroup` cancela siblings e trata `ExceptionGroup` conscientemente | B5 | VERIFICADO |
| M02-AT-023 | cancelamento externo executa cleanup e propaga `CancelledError` | B5 | VERIFICADO |
| M02-AT-024 | timeout não deixa tarefa ou efeito órfão | B5 | VERIFICADO |
| M02-AT-025 | remoção de backpressure piora sinais observáveis e falha o gate | B5 | VERIFICADO — cenário causal compara admissão bounded (2) e unbounded (20) |
| M02-AT-026 | inspeção encontra task pendente/exception não recuperada | B5 | VERIFICADO — `asyncio.all_tasks()` encontra task nomeada sem ownership e o teste garante cleanup |
| M02-AT-027 | I/O síncrono inevitável roda em thread com limite/contexto | B6 | VERIFICADO |
| M02-AT-028 | workload CPU-bound é medido em loop/thread/process/interpreter | B6 | VERIFICADO — hashes iguais/amostras locais |
| M02-AT-029 | GIL reabilitado ou extensão incompatível é detectada | B6 | VERIFICADO — 51 testes passam no CPython 3.14t; `pydantic-core` mantém o GIL desativado e o gate automatizado detecta mudança de modo |
| M02-AT-030 | lock/message passing corrige corrida sem confiar em atomicidade acidental | B6 | VERIFICADO — corrida forçada por barrier |
| M02-AT-031 | generator limita memória no processamento de arquivo grande | B7 | VERIFICADO — `tracemalloc` confirma pico limitado ao processar 10.000 linhas em streaming |
| M02-AT-032 | CLI mantém UTF-8/newline estáveis em Windows e Linux | B7/B8 | VERIFICADO — 51 testes e CLI real passam no WSL2/Ubuntu com CPython 3.14.7; saída UTF-8 usa LF sem CRLF |
| M02-AT-033 | stderr, exit code e exception chain são acionáveis | B7/B8 | VERIFICADO — Windows |
| M02-AT-034 | property test encontra borda ausente nos exemplos | B8 | VERIFICADO — round-trip e limite de domínio |
| M02-AT-035 | suíte falha quando uma regra crítica é removida | B8 | VERIFICADO — controle passa e mutante que remove a invariável de valor positivo é morto em subprocesso isolado |
| M02-AT-036 | revisão de defeito de IA identifica tipo, semântica e risco operacional | B8 | VERIFICADO — catálogo versionado + oráculos |
| M02-AT-037 | Ruff, mypy, pytest e build passam com versões/durações registradas | B8 | VERIFICADO — 34 testes; CPython 3.14.7/Windows |
| M02-AT-038 | `core/` entrega contratos/ports sem framework web ou provedor de IA | B8 | VERIFICADO |

## Matriz de fontes

| Faixa | Autoridade | Assuntos | Política |
|---|---|---|---|
| SRC-M02-01–07 | documentação oficial Python 3.14 | runtime, linguagem, imports, asyncio, filas, free-threading e execução concorrente | revalidar mudança de minor/release; risco baixo a alto conforme tema |
| SRC-M02-08 | typing specification | semântica portável de typing | prevalece sobre peculiaridade de checker; revalidar em 90 dias |
| SRC-M02-09–10 | PyPA | `pyproject.toml`, build metadata e `pylock.toml` | distinguir padrão de implementação; revalidar em 90 dias |
| SRC-M02-11–13 | documentação oficial uv | projeto, lock/sync e build | implementação substituível; fixar versão na evidência |
| SRC-M02-14 | documentação oficial mypy | checker e perfil `--strict` | perfil versionado, não norma universal |
| SRC-M02-15–16 | documentação oficial Pydantic | models, construct, strictness e trust boundary | fixar versão e testar comportamento observado |
| SRC-M02-17–18 | documentação oficial pytest | fixtures, teardown e parametrização | revalidar em 90 dias |
| SRC-M02-19 | documentação oficial Hypothesis | property-based testing | fixar versão, seed/perfil e exemplos minimizados |
| SRC-M02-20 | documentação oficial Python `contextlib` | cleanup e gestão determinística de recursos | risco baixo; revalidar por release |

A lista de URLs, uso e risco de cada uma das 20 fontes está na seção 9 da especificação. Documentação Python 3.14 e PyPA foi revalidada em 15/08/2026; fontes de ferramentas devem ser revalidadas em até 90 dias e ter versões reais registradas na execução.

## Gates editoriais e técnicos

| Gate | Estado | Evidência existente / condição de promoção |
|---|---|---|
| G0 · Escopo | APROVADO | oito blocos/16h, 43 competências, 38 cenários, laboratório local especificado, fontes classificadas e limites curriculares explícitos |
| G1 · Conteúdo | APROVADO | HTML com oito blocos/16h, teoria→falha→evidência, vinte fontes e absolutos P0 corrigidos |
| G2 · Execução | APROVADO | lock/sync, Ruff em 35 arquivos, mypy strict em 29 arquivos, 51 testes nos runtimes 3.14 e 3.14t, build e wheel limpo aprovados |
| G3 · Avaliação | APROVADO | dez perguntas baseadas em cenários, oito entregáveis e rubrica 80%/100% nos itens críticos |
| G4 · Portabilidade | APROVADO | Windows e WSL2/Ubuntu verificados em CPython 3.14.7; UTF-8/newline e padrões separados dos adapters confirmados |
| G5 · Produção | APROVADO | cleanup, cancelamento, timeout, fila bounded, starvation local, comparação/race, ownership negativo, memória, subprocesso, mutação controlada e trust boundary cobertos |
| G6 · Editorial | APROVADO | tags/IDs/fontes e desktop verificados; viewport real de 390 px sem overflow; PDF de 52 páginas inspecionado por amostras e folha de contato integral, sem cortes, sobreposições ou páginas vazias |

## Gates de execução planejados

```text
uv sync --python 3.14 --locked
uv run ruff format --check .
uv run ruff check .
uv run mypy --strict src tests
uv run pytest -q
uv build
uv run python -m python_senior_lab.cli --help
```

Em 15/08/2026, o orquestrador executou esses comandos em CPython 3.14.7/Windows: Ruff aprovou 35 arquivos, mypy aprovou 29 arquivos de código-fonte e pytest aprovou 51 testes. Os mesmos 51 testes passaram no CPython 3.14.7 free-threaded com GIL desativado; após importar `pydantic-core==2.46.4`, o GIL continuou desativado. Sdist/wheel foram construídos e inspecionados e `csv-cleaner==0.1.0` foi instalado em ambiente separado, com import vindo de `site-packages`. No WSL2/Ubuntu, o checksum oficial do uv 0.12.3 foi validado, CPython 3.14.7 foi instalado em `/tmp`, os 51 testes passaram e a CLI produziu UTF-8/LF; todo o ambiente temporário foi removido. G2, G4 e G5 estão aprovados e os 38 cenários estão verificados.

## Checkpoint e promoção

A aprovação exige no mínimo 80% das perguntas e 100% nos itens de cancelamento, trust boundary, encoding/path, instalação limpa e casos negativos. O aluno deverá executar o gate final, reproduzir duas falhas semeadas, defender uma escolha entre asyncio/thread/process/interpreter com medições locais e explicar analogias .NET que ajudam ou quebram.

Não contam como evidência: saída copiada do material, benchmark sem ambiente/warm-up/amostras, teste com `skip`, número hardcoded, execução somente no source tree ou resposta de IA sem reprodução. Nenhum cenário está aprovado enquanto seu oráculo não tiver sido executado e revisado.

## Integração curricular

- **Entrada do M00/M01:** harness, capabilities, task contract, gates, evidence e casos negativos;
- **Saída para M03:** wheel/CLI, domínio tipado, settings e ports; HTTP/banco permanecem fora do M02;
- **Saída para M05/M08/M09:** Protocols e modelos de fronteira agnósticos de provider;
- **Saída para M06:** property/mutation tests e evidência reproduzível;
- **Saída para M10/LT02:** cancelamento, backpressure e concorrência estruturada, sem confundi-los com durabilidade distribuída;
- **Limite com M02A:** este módulo consolida Python profissional; M02A amplia arquitetura, dados, segurança, entrega e liderança em sistema maior.

## Revisão didática de 20/08/2026

| ID | Mudança aplicada no HTML | Evidência editorial | Estado |
|---|---|---|---|
| DID-M02-001 | panorama de prática vigente liga Python, packaging, gates e concorrência a um sinal industrial datado, com limite metodológico | bloco 1 e fonte Octoverse 2025 | APLICADO |
| DID-M02-002 | trecho de `asyncio` ganhou leitura de sintaxe e lifecycle por ownership | bloco 5.2 | APLICADO |
| DID-M02-003 | probe de free-threading explica build, execução e formato de retorno antes da interpretação | bloco 6.1 | APLICADO |
| DID-M02-004 | exemplos pytest e Hypothesis receberam o import de `Decimal` que utilizam | blocos 8.1 e 8.3 | APLICADO |
| DID-M02-005 | instalação do uv passou a declarar a alteração de ambiente e a necessidade de inspeção da fonte oficial | prática 1.3 | APLICADO |

Auditoria de suporte: `docs/auditorias/M02-DIDATICA-2026-08.md`. A revisão não modifica os 38 cenários, a execução do laboratório ou as decisões G0–G6.

## Próxima promoção permitida

G0–G6 estão aprovados por especificação, material, execução, avaliação, portabilidade, casos negativos e inspeção editorial/visual revisados. O módulo só deverá voltar a revisão por mudança relevante de fonte, runtime, dependência, contrato ou material.
