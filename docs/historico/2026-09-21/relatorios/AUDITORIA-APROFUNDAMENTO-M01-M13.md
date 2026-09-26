# Auditoria de aprofundamento técnico — M01 a M13

**Data-base:** 15/08/2026 · **Objetivo:** impedir que densidade textual seja confundida com formação sênior · **Estado:** TRIAGEM COMPLETA; M01 e M02 verificados

## Régua obrigatória de profundidade

Todo assunto relevante passa a ser avaliado em cinco níveis. Contagem de palavras, quantidade de snippets e aparência não aprovam um módulo.

| Nível | Pergunta que o material precisa responder | Evidência mínima |
|---|---|---|
| N1 · Conceito | o aluno explica o vocabulário e o modelo mental? | explicação, limites e exemplo |
| N2 · Decisão | ele escolhe entre alternativas e defende o trade-off? | matriz de decisão, hipótese e restrições |
| N3 · Implementação | ele constrói e executa a solução? | código real, ambiente reproduzível e saída observada |
| N4 · Falha e diagnóstico | ele prevê, injeta, detecta e corrige falhas? | caso negativo, oráculo, diagnóstico e recuperação |
| N5 · Produção e transferência | ele opera, mede e transfere o princípio entre stacks? | telemetria, carga/custo/segurança, ponte .NET e defesa técnica |

**Contrato do curso:** módulos fundamentais devem atingir N4 nas competências centrais; módulos de produção, integração e Capstone devem atingir N5. Uma prática descrita, mas não presente em laboratório executável, não comprova N3.

## Resultado da triagem

| Módulo | Sinal atual | Nível comprovado | Decisão e prioridade |
|---|---|---:|---|
| M01 | 9.167 palavras visíveis, 18 códigos, 21 resultados, 14 fontes distintas, lab com 27 testes | N4; N5 em contratos, retomada e Git | **VERIFICADO.** Preservar 10h e aprofundar assuntos derivados nos módulos próprios. |
| M02 | 9.060 palavras, 36 códigos, 20 fontes; lab com 51 testes em Windows/3.14t/Linux e wheel limpo | N4 comprovado; N5 em distribuição, portabilidade e transferência | **VERIFICADO.** 38 AT e G0–G6 aprovados; manter revalidação por mudança. |
| M03 | 9.312 palavras, 21 códigos, 27 resultados; zero fonte no HTML e zero lab | N2; N3 alegado | **P1 — AUDITAR.** API, PostgreSQL, containers e CI exigem execução E2E e contratos. |
| M04 | 9.833 palavras, 15 códigos, 14 resultados; zero fonte no HTML e zero lab | N2 | **P2 — AUDITAR.** Validar ADR/C4/Mermaid e transformar drift em fitness functions executáveis. |
| M05 | 12.490 palavras, 13 códigos, 28 resultados; zero fonte no HTML e zero lab | N2 | **P1 — AUDITAR.** Gateway, cache e custo precisam de adapters, falhas e medições reais. |
| M06 | 10.603 palavras, 16 códigos, 23 resultados; zero fonte no HTML e zero lab | N2 | **P1 — AUDITAR.** Evals precisam de estatística, calibração humana e CI reproduzível. |
| M07 | 13.570 palavras, 19 códigos, 33 resultados; zero fonte no HTML e zero lab | N2 | **P1 — AUDITAR.** RAG exige corpus versionado, autorização antes do retrieval e métricas executadas. |
| M08 | 12.669 palavras, 12 códigos, 29 resultados; zero fonte no HTML e zero lab | N2 | **P1 — AUDITAR.** Comparar workflow/agente por eval, budget e falhas, sem framework canônico. |
| M09 | 13.573 palavras, 14 códigos, 26 resultados; zero fonte no HTML e zero lab | N2 | **P1 — AUDITAR.** Versionar MCP/A2A e provar interoperabilidade e controles de confiança. |
| M10 | 17.681 palavras, 20 códigos, 40 resultados; zero fonte no HTML e zero lab | N2 | **P1 — AUDITAR.** Durabilidade, HITL, grafo e métricas precisam de crash/restart e banco reais. |
| M11 | 7.293 palavras, começa no bloco 2, 15 códigos, 13 resultados; zero fonte e zero lab | N1/N2 | **P0 — REFAZER.** Falta fundação, serving/benchmark e execução reproduzível. |
| M12 | 13.018 palavras, 28 códigos, 27 resultados, 30 links/14 domínios, lab com gates locais | N4 parcial | **P0 BLOQUEADO.** Falta PostgreSQL E2E, boundaries, game day e G6 final. |
| M13 | 1.151 palavras, 3 códigos e zero resultado observável | N1 | **P0 — REFAZER.** Não atende ao formato de roteiro executável do Capstone. |

Os números acima são sinais de triagem, não notas. M03–M10 podem conter bons trechos conceituais; permanecem sem promoção porque as saídas descritas não estão materializadas e verificadas no repositório.

## M01 — conclusão da auditoria detalhada

O M01 não precisa de expansão imediata. Ele já liga teoria a parser, schema, casos negativos, runner, evidência, máquina de estados, policy externa e Git real. Aumentá-lo agora duplicaria conteúdo que pertence a CI/evals, durabilidade distribuída, protocolos e segurança.

Continuações obrigatórias, com owner curricular:

- CI e regressão do harness: M03 e M06;
- durabilidade multi-instância e efeitos externos: M10, LT02 e M12;
- sandbox, proveniência e conteúdo hostil: LT03 e M12;
- protocolos e adapters: M09;
- avaliação empírica de produtividade, qualidade e governança: LT04.

## M02 — lacunas bloqueantes encontradas

### P0 · corrigir antes de regenerar

1. **Baseline incoerente:** exemplos fixam Python 3.12; o curso adotou Python 3.14. O módulo precisa ensinar também annotations diferidas, introspecção de `asyncio`, `InterpreterPoolExecutor` e o estado oficialmente suportado do free-threading, sem vender essas features como escolha universal.
2. **Laboratório inexistente:** o README promete CLI, benchmark, Ruff, mypy e pytest, mas só existem HTML e README. Criar pacote instalável, fixtures locais, casos negativos e execução Windows/Linux.
3. **Resultados fabricados:** “~40x”, “150+ req/s” e “18 passed” aparecem como previsão. O material deve registrar intervalos esperados, ambiente, seed/carga, saída real e proibir número hardcoded como evidência.
4. **Dependência de serviço externo:** o exercício usa `httpbin.org/delay/1`. Substituir por servidor/fixture local determinístico; rede externa pode ser trilha opcional.
5. **Fontes ausentes:** o HTML possui zero links externos. Cada claim de versão, runtime, typing, packaging, validação e testing precisa de fonte primária classificada e datada.
6. **Afirmações absolutas incorretas:** corrigir “venv é cópia do interpretador”, “requirements.txt é legado e nunca se cria”, “Pydantic torna instância inválida impossível”, “asyncio é um único loop/uma única thread” e “não existe equivalente a Task.Run”. Ensinar escopo e exceções.

### P1 · aprofundamento necessário para nível sênior

- **Runtime e modelo de objetos:** nomes/referências, mutabilidade, identidade/igualdade/hash, protocolo de dados, exceptions e traceback; não apenas sintaxe idiomática.
- **Imports e packaging:** import system, layout `src`, `[build-system]`, `[project.scripts]`, wheel/sdist, `uv build`, instalação em ambiente limpo, lock específico do uv versus `pylock.toml` interoperável.
- **Typing moderno:** gradual typing, `Any`/`object`/`Unknown` conforme checker, `Protocol`, variance, `Self`, `TypedDict`, `Literal`, `TypeGuard`/`TypeIs`, `ParamSpec`, type narrowing e limites entre checkers. Mypy é implementação; a typing specification é a referência.
- **Pydantic como trust boundary:** strictness por chamada/campo/modelo, `extra`, validadores, unions, errors, `model_construct()`, mutação/`validate_assignment`, serialization e invariantes de domínio fora do schema.
- **Concorrência estruturada:** `TaskGroup`, `ExceptionGroup`, timeout, cancelamento e propagação de `CancelledError`, backpressure, limite de concorrência, cleanup, context variables e diagnóstico com as ferramentas de introspecção do Python 3.14.
- **Escolha de paralelismo:** threads com GIL, free-threaded build, processos e subinterpreters; medir workload real e compatibilidade de extensões, nunca inferir ganho só pela ausência do GIL.
- **Testing profissional:** unitário, integração, property-based e mutation test no escopo do CLI; fixtures com teardown, parametrização, mocks só em fronteiras, cobertura como sinal e teste cross-platform.
- **Operabilidade:** logging estruturado, exit codes, encoding, sinais/cancelamento, profiling básico, memória e benchmark com warm-up/distribuição — média isolada não basta.
- **Transição .NET:** manter comparações, mas explicitar onde `Task`, DI, generics, records, exceptions e packaging têm semântica diferente. Python permanece a implementação canônica.
- **IA na engenharia:** usar agente para gerar hipótese/diff/teste, exigir type checker, casos negativos e revisão do contrato; incluir defeitos semeados em código plausível produzido por IA.

## Fontes primárias confirmadas para a especificação do M02

| Área | Fonte | Uso |
|---|---|---|
| Python 3.14 | [What’s New in Python 3.14](https://docs.python.org/3.14/whatsnew/3.14.html) | release, annotations diferidas, subinterpreters, introspecção asyncio e free-threading |
| concorrência | [Coroutines and Tasks](https://docs.python.org/3.14/library/asyncio-task.html) e [free-threading HOWTO](https://docs.python.org/3.14/howto/free-threading-python.html) | TaskGroup, gather, cancelamento, referências fortes, GIL e limitações |
| typing | [Python typing specification](https://typing.python.org/en/latest/spec/) | semântica agnóstica de checker; Protocol e generics |
| packaging | [PyPA — pyproject.toml](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/) e [pylock.toml](https://packaging.python.org/en/latest/specifications/pylock-toml/) | build system, metadata, entry points e lock interoperável |
| uv | [Working on projects](https://docs.astral.sh/uv/guides/projects/), [locking/syncing](https://docs.astral.sh/uv/concepts/projects/sync/) e [building packages](https://docs.astral.sh/uv/guides/package/) | implementação escolhida, sem confundi-la com padrão Python |
| validação | [Pydantic models](https://docs.pydantic.dev/latest/concepts/models/) e [strict mode](https://docs.pydantic.dev/latest/concepts/strict_mode/) | construção sem validação, coerção, strictness e limites |
| type checker | [mypy command line](https://mypy.readthedocs.io/en/stable/command_line.html) | comportamento da implementação e conteúdo mutável de `--strict` |
| testes | [pytest fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html) e [parametrization](https://docs.pytest.org/en/stable/how-to/parametrize.html) | fixtures, teardown, scopes e dados de teste |

## Sequência de execução

1. **Concluído:** alinhar apresentação, organização e contrato pedagógico do M01 ao M00.
2. **Concluído:** auditar profundidade do M01; zero lacuna P0/P1 interna ao escopo.
3. **Concluído:** produzir especificação G0 do M02 com oito blocos, 38 cenários, arquitetura do lab e fontes versionadas.
4. **Concluído:** regenerar HTML/README/rastreabilidade do M02 no padrão M00/M01 e aprovar G1/G3.
5. **Concluído:** revisão mobile a 390 px e impressão integral em 52 páginas; G6 aprovado e M02 verificado.
6. **Próxima unidade:** G0 do M02A concluído; produzir/regenerar M02A em G1–G6 e depois auditar M03–M10 em detalhe, priorizando M03/M05–M10 antes de M04.
7. **Já conhecido:** refazer M11 e M13; completar bloqueios de M12.

## Critério para alterar prioridade

Uma lacuna P0 que ensine comportamento incorreto, exiba evidência inventada, dependa de infraestrutura inexistente ou não possua oráculo executável interrompe a promoção do módulo. Lacunas P1 de aprofundamento entram na especificação antes da escrita. P2 editorial pode ser corrigida junto ao G6, sem mascarar falhas técnicas.
