# FIX-01 — validação do relatório de entrada do gate M06

**Estado:** REVISADO
**Sessão de autoria:** 01a0d671-e469-7ca1-80a1-ef1ab571ec87
**Sessão de revisão:** 01a0d688-c810-7050-9280-d87bcaaf28e8
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador
**Data:** 25/09/2026  
**Tipo da amostra do piloto:** correção de código  
**Modelo/esforço efetivamente usados:** o runtime desta sessão não expõe o identificador exato do modelo nem o esforço. Não consigo atestar GPT-6 Luna / medium, configuração prescrita pelo piloto; a revisão deve considerar essa limitação.  
**Revisão independente anterior:** AJUSTES_NECESSARIOS (24/09/2026); revisão da correção registrada abaixo.
**Gate do módulo:** inalterado.

## Objetivo e baseline focal

Impedir que relatório vazio ou incompleto seja tratado como evidência aprovada pelo gate, e manter o relatório produzido pelo runner compatível com um contrato verificável.

Antes da alteração, `gate.py` lia `atual.get("por_categoria", {})` e iterava somente sobre as categorias fornecidas. A inspeção confirma que `{}` não produzia falha e que taxas eram convertidas com `float()` sem validação de campos, limites ou valores não finitos. A auditoria de 21/09 registrou execução real do contraexemplo `decidir({'por_categoria': {}}, {'por_categoria': {'injection': 100, 'vazamento': 100}})`, que devolveu `([], [])`; essa é evidência histórica reproduzida no diagnóstico, não uma execução pré-mudança desta sessão. O runner anterior emitia taxas sem contagens, versão de schema, dataset ou versão do SUT.

No começo desta sessão, os comandos prescritos tentados antes das mudanças não puderam estabelecer uma baseline de suíte: o Python global não tinha pytest e o `uv` offline foi impedido pelo sandbox de ler o cache do usuário. A inspeção do código acima e a evidência histórica são as referências de baseline; não atribuo uma execução local inexistente ao estado anterior.

## Alterações

- `modulos/M06-evals-observabilidade/lab/src/eval_lab/gate.py`: valida schema versão 1 antes da comparação; exige `dataset_id`, `sut_version`, amostra total, custo e seis categorias obrigatórias. Cada categoria exige contagem aprovada, amostra positiva e taxa finita entre 0 e 100, coerente com as contagens. A soma das amostras deve corresponder ao total. Dataset da execução e da baseline precisam coincidir. Entrada inválida produz diagnóstico e código CLI 2; regressões válidas continuam com código 1; aprovação válida retorna 0.
- `modulos/M06-evals-observabilidade/lab/src/eval_lab/runner.py`: o produtor agora inclui contagens por categoria, taxa derivada, versão de schema e identificadores explícitos do dataset/SUT. `agregar` e `salvar_relatorio` exigem os identificadores, sem defaults que inventem identidade.
- `modulos/M06-evals-observabilidade/lab/tests/test_gate.py`: positivos, limite de tolerância, campos ausentes/errados, categorias ausentes, NaN/inf, taxa fora do intervalo, taxa divergente, amostra zero, dataset incompatível e códigos/diagnósticos do CLI.
- `modulos/M06-evals-observabilidade/lab/tests/test_gate_tracing.py` e `tests/test_runner.py`: fixtures e chamadas migradas ao contrato novo; mantêm cobertura de tolerância, piso de segurança e aviso de custo, além da emissão pelo produtor.

**Ajuste de escopo necessário:** o cartão permite escrita focal em gate/teste e schema opcional, mas seu passo 2 exige preservar o produtor e fixtures ao introduzir o novo formato. Antes da mudança do produtor, informei essa dependência no andamento da tarefa. A extensão ficou limitada ao runner e aos dois arquivos de teste que chamavam/representavam seu formato anterior; sem isso, relatórios gerados deixariam de ser aceitos ou testes existentes deixariam de refletir o contrato real.

## Cenários e evidências

| Cenário | Resultado observado |
|---|---|
| Relatório válido emitido pelo runner com categorias e contagens | Passa pelo gate no teste de integração; campos de identificação e versão conferidos. |
| Relatório válido comparado no gate | CLI retorna 0 e imprime a tabela `Eval gate`. |
| Relatório vazio | Rejeitado antes da decisão por campos obrigatórios; CLI retorna 2. |
| `por_categoria` ausente ou chave alternativa (`categories`) | Rejeitado; nenhum default vazio é aceito. |
| Categoria obrigatória ausente | Rejeitada com lista das categorias faltantes. |
| `NaN` ou infinito em taxa | Rejeitado como não finito. |
| Taxa acima de 100 | Rejeitada por intervalo; taxa também precisa corresponder às contagens. |
| Amostra total ou amostra de categoria igual a zero | Rejeitada; zero não vira uma taxa aceitável. |
| Segurança e regressão | Fixture válida preserva piso de 100% e queda acima da tolerância como reprovação. |
| Custo | Fixture válida preserva o aviso de aumento sem converter custo em reprovação. |

Os testes são a execução real dos cenários deste cartão. Não foram criados relatórios de produção nem alegada execução contra um SUT externo. O suite do M06 continua determinístico e offline.

## Validações executadas

**CWD:** `modulos/M06-evals-observabilidade/lab`  
**Ambiente:** CPython 3.14.7; uv 0.12.7; macOS arm64 (indicado pela distribuição local do uv).  
**Modo:** locked e offline, com `.venv` existente. Após autorização para o uv ler o cache fora do sandbox:

```text
uv run --locked --offline pytest -q
33 passed, 28 warnings in 0.08s

uv run --locked --offline ruff check .
All checks passed!

uv run --locked --offline mypy
Success: no issues found in 13 source files
```

Os 28 avisos são `DeprecationWarning` do `pytest-asyncio` sobre `asyncio.get_event_loop_policy`, não falhas do cartão. O primeiro mypy desta sessão apontou problemas de narrowing nos dados dinâmicos e no helper de teste; foram corrigidos e a execução final acima passou. A primeira execução do Ruff indicou quatro linhas acima do limite; foram ajustadas antes da execução final.

## Fontes consultadas

- JSON Schema Draft 2020-12, vocabulário de validação — `type`, requisitos estruturais e limites numéricos; consultado em 24/09/2026: https://json-schema.org/draft/2020-12/json-schema-validation. O código implementa validação local em Python sem adicionar dependência JSON Schema; as verificações relacionais (soma de amostras e taxa derivada) são regras semânticas próprias do contrato do M06.
- Documentação Python 3.14, `math.isfinite` — rejeita NaN e infinitos; consultada em 24/09/2026: https://docs.python.org/pt-br/3.14/library/math.html.

## Rubrica editorial aplicável

O cartão corrige um contrato de entrada; não altera explicações HTML ou laboratório guiado. Dimensões didáticas sem artefato editorial neste escopo ficam justificadas como não aplicáveis, não pontuadas como aprovação de conteúdo.

| Dimensão da rubrica da especificação geral | Estado / evidência |
|---|---|
| Contexto e pré-requisitos | N/A: correção focal de código, sem novo bloco didático. O relatório explica o defeito reproduzido e o contrato. |
| Mecanismo | 2 para o mecanismo do gate: validação ocorre antes da comparação, demonstrada por controles negativos e suíte aprovada. Não certifica a explicação pedagógica do M06. |
| Exemplo trabalhado | N/A: sem alteração de HTML ou material de estudo. |
| Decisão e limites | 2 para o contrato: seis categorias, identidade comparável, taxa derivada, amostra positiva; custo e piso mantêm semântica anterior. |
| Falha e diagnóstico | 2 para o oráculo de entrada: casos negativos e saída CLI não zero com diagnóstico acionável. |
| Transferência | N/A neste cartão; não verifica portabilidade do módulo nem transferência do aluno. |
| Fontes e evidência | 2 para o contrato implementado: fontes primárias consultadas e execução local registrada. Revisão independente pendente. |
| Navegabilidade | N/A: sem mudança de apresentação. |

## Limitações e próximo passo

- Revisão independente obrigatória, em sessão separada, contra este relatório, diff e cartão `FIX-01 --bundle`.
- O piloto prescreve GPT-6 Luna / medium; a configuração real não é exposta nesta sessão e fica pendente de avaliação pelo orquestrador. Nenhuma alegação de conformidade com o modelo foi inventada.
- Não foram promovidos ATs ou gates. Após os ajustes, FIX-01 precisa de nova revisão independente; FIX-02 e os demais cartões não foram iniciados.
- O validator permite campos adicionais para evolução compatível; a versão/schema é validada e desconhecidos não mudam a decisão. Se consumidores precisarem rejeitar extensões, isso deve ser decidido em revisão de contrato.

## Revisão independente — 24/09/2026

**Resultado:** AJUSTES_NECESSARIOS. Revisão feita em sessão independente do registro de implementação, sem alteração de código, testes, fixtures ou HTML. FIX-01 permanece ativa; nenhum AT ou gate foi promovido.

### Critérios conferidos

- O defeito do relatório vazio e os controles para campo ausente/alternativo, categorias obrigatórias, NaN/inf, taxa fora de faixa/incoerente e amostra zero estão cobertos por testes. A taxa é recalculada das contagens; custo e contagens também recebem validação finita/tipada.
- A identidade inclui `dataset_id` e `sut_version`; a comparação exige o mesmo dataset. O runner foi atualizado para emitir o contrato, evitando incompatibilidade deliberada entre consumidor e produtor.
- O CLI separa entrada inválida (código 2), regressão válida (código 1) e aprovação (código 0). A fronteira da revisão é o FIX-01; não certifica o conteúdo didático do M06 nem G0–G6.
- A rubrica editorial justifica como N/A as dimensões que dependem de edição de conteúdo, mas o item “Fontes e evidência” deve ser lido restrito ao contrato de código, não como validação das fontes de todo o módulo.

### Ajuste P2 — categoria extra pode escapar como exceção interna

`validar_relatorio` exige as seis categorias, mas aceita outras. `decidir` percorre todas as categorias de `atual` e indexa a baseline pela mesma chave sem validar que os conjuntos são iguais. Reproduzi com dois relatórios válidos e `categoria_nova` somente no atual: `.venv/bin/python` produziu `KeyError: 'categoria_nova'`. Isso viola o aceite de erro acionável para entrada inválida e deixa o CLI imprimir traceback em vez de diagnóstico do gate.

Corrigir validando que `por_categoria` contém exatamente as categorias permitidas ou, se extensões forem intencionais, validando compatibilidade explícita dos conjuntos entre atual e baseline antes da comparação. Acrescentar teste para categoria extra em apenas um lado e verificar mensagem clara/código CLI não-zero. Não confundir esse ajuste com a decisão separada de permitir campos adicionais no objeto raiz.

### Fontes e evidência da revisão

As referências do relatório correspondem ao uso descrito: a documentação oficial Python 3.14 de `math.isfinite` sustenta a rejeição de NaN/infinito; a especificação JSON Schema Draft 2020-12 descreve validação estrutural, enquanto a consistência entre contagens e taxa é regra semântica própria. Consultei as páginas originais em 24/09/2026. Elas não provam que o contrato local cobre todos os casos; a lacuna acima foi encontrada por revisão do código e reprodução.

Verificação executada na revisão, em `modulos/M06-evals-observabilidade/lab`:

```text
uv run --locked --offline pytest -q
33 passed, 28 warnings in 0.08s
uv run --locked --offline ruff check .
All checks passed!
uv run --locked --offline mypy
Success: no issues found in 13 source files
```

Também executei a reprodução isolada da categoria extra via `.venv/bin/python`; resultado real: `KeyError: 'categoria_nova'`. Os avisos continuam sendo `DeprecationWarning` de `pytest-asyncio` registrado acima. Os checks verdes não removem o ajuste pendente.

**Próxima unidade elegível após corrigir e aprovar FIX-01:** FIX-02 — entrada e decisão do gate M06, conforme a sequência do STATUS. Ela ainda não pode começar; esta revisão mantém FIX-01 como unidade ativa.

## Correção do achado P2 — 24/09/2026

**Estado da entrega:** AGUARDA_REVISAO. O resultado independente acima é histórico e motivou esta correção; uma nova revisão independente ainda é necessária. Nenhum AT ou gate foi promovido.

### Alteração focal

- `modulos/M06-evals-observabilidade/lab/src/eval_lab/gate.py`: antes de comparar taxas, `decidir()` agora verifica os conjuntos de chaves de `por_categoria`. Categorias extras continuam permitidas como extensão do contrato quando os conjuntos do atual e da baseline coincidem. Se uma categoria extra existir só de um lado, a entrada é rejeitada por `ValueError` com o lado e os nomes incompatíveis, antes do acesso à métrica da baseline; o CLI converte o erro em diagnóstico `ERRO DE ENTRADA` e código 2.
- `modulos/M06-evals-observabilidade/lab/tests/test_gate.py`: adicionados casos para categoria extra apenas no atual, apenas na baseline, extensão igual nos dois relatórios e saída do CLI sem traceback para a categoria exclusiva do atual.

Isso trata somente a compatibilidade dos conjuntos de categorias identificada na revisão. A aceitação de outros campos no objeto raiz continua sendo uma decisão distinta e não foi alterada.

### Validação desta correção

**CWD:** `modulos/M06-evals-observabilidade/lab`  
**Ambiente:** `.venv` existente; CPython 3.14.7, uv 0.12.7, macOS arm64, conforme ambiente reportado nesta evidência.  
**Execuções reais em 24/09/2026:**

```text
uv run --locked --offline pytest -q
37 passed, 28 warnings in 0.11s

uv run --locked --offline ruff check .
All checks passed!

uv run --locked --offline mypy
Success: no issues found in 13 source files
```

Os 28 avisos continuam sendo `DeprecationWarning` do `pytest-asyncio` sobre a política do event loop; não falharam os comandos. Os testes de incompatibilidade exercitam ambos os sentidos da diferença de conjuntos; o teste CLI confirma código 2, mensagem acionável e ausência de traceback; a extensão compartilhada permanece aceita. Revisão independente da correção pendente.

### Limites e encaminhamento

- Escopo alterado nesta rodada: somente `gate.py`, `test_gate.py` e este relatório, conforme write set focal do cartão.
- Não houve alteração de status/rastreabilidade curricular, HTML, produtor, baseline de avaliação, ATs ou gates nesta rodada.
- A nova revisão deve conferir o diff focal, o diagnóstico/código CLI, os três cenários de conjunto e as validações registradas. FIX-02 não foi iniciado; FIX-01 permanece a unidade ativa até aceite do orquestrador.

## Revisão independente da correção — 24/09/2026

**Sessão de revisão:** `01a0d664-bcfc-7f81-8783-e16711e895fd` (RUN real da execução). **Modelo/esforço:** `gpt-6-luna / high`, conforme configuração lida em `automation.toml`; isso registra a configuração do agendador, não introspecção do runtime. A autoria desta correção está associada à tarefa `01a0d655-ccb1-7fd2-b9ea-9588bf6cf12c`; a configuração de modelo dessa sessão não foi exposta no registro consultado.

**Resultado:** AJUSTES_NECESSARIOS. A correção anterior cobre categorias extras exclusivas de cada lado e preserva extensão compartilhada. Os testes focais passaram (37), Ruff passou e mypy passou. Os 28 avisos de depreciação do `pytest-asyncio` não são falhas.

### Novo achado P2 — inteiro JSON fora do intervalo convertível causa traceback

`_numero_finito()` chama `math.isfinite(valor)` para inteiros Python sem limitar o intervalo convertível para `float`. Reproduzi pela CLI com dois relatórios válidos exceto por `custo_total = 10**1000`: o processo terminou com código 1 e traceback iniciado em `main()`, em vez de imprimir `ERRO DE ENTRADA` e retornar código 2. O mesmo helper é usado para taxas. O caso viola o aceite de erro acionável para entrada inválida e deixa uma falha interna escapar. Corrigir a validação numérica sem permitir que uma conversão de inteiro grande escape, acrescentar controles negativos de CLI para `custo_total` e `taxa_pct` e confirmar diagnóstico sem traceback/código não-zero.

**Evidência desta revisão:** execução real com `.venv/bin/python` no cwd `modulos/M06-evals-observabilidade/lab`; JSONs temporários criados em diretório temporário da revisão e CLI executado contra eles. Saída observada: `exit=1`; stderr contém traceback. Nenhum arquivo de código ou fixture foi alterado nesta revisão. FIX-01 continua ativa; FIX-02 não foi iniciado e nenhum AT/gate foi promovido.

## Correção do achado numérico — 24/09/2026

**Estado da entrega:** AGUARDA_REVISAO. O autor desta correção é o RUN `01a0d664-bcfc-7f81-8783-e16711e895fd`; configuração registrada pelo agendador: `gpt-6-luna / high`. A revisão independente acima é histórica para esta alteração; uma nova revisão independente é obrigatória.

`_numero_finito()` agora trata `OverflowError` de inteiros que não podem ser convertidos para float como entrada inválida. Foram adicionados testes de CLI para `10**1000` em `custo_total` e em `por_categoria.golden.taxa_pct`; ambos exigem código 2, mensagem `ERRO DE ENTRADA` e ausência de traceback.

Validações executadas em 24/09/2026, cwd `modulos/M06-evals-observabilidade/lab`, Python 3.14.7 / uv 0.12.7, locked e offline:

```text
uv run --locked --offline pytest -q
39 passed, 28 warnings in 0.18s

uv run --locked --offline ruff check .
All checks passed!

uv run --locked --offline mypy
Success: no issues found in 13 source files
```

Os avisos permanecem `DeprecationWarning` de `pytest-asyncio` relativos a `asyncio.get_event_loop_policy`. O diff atual limita-se a `gate.py`, `test_gate.py` e este relatório. A nova revisão deve reproduzir os dois cenários de inteiro grande e conferir que a alteração não enfraqueceu os casos prévios. Nenhum AT ou gate foi promovido; FIX-02 não foi iniciado.

## Correção do cálculo de taxas para contagens grandes — 25/09/2026

**Estado da entrega:** AGUARDA_REVISAO. A revisão desta execução detectou uma lacuna adicional: mesmo após tratar `OverflowError` em `_numero_finito`, contagens inteiras grandes eram aceitas e `100.0 * passou / total` lançava `OverflowError`. Reproduzi com `passou = total = 10**1000`; a validação escapou sem diagnóstico.

O RUN `01a0d671-e469-7ca1-80a1-ef1ab571ec87` substituiu o cálculo intermediário por `Decimal` e centralizou a conversão percentual em `_taxa_pct`, usada na validação, decisão e renderização Markdown. Foram adicionados controles positivo direto e CLI com amostras grandes; taxa de 100% permanece comparável e o CLI termina com código zero, sem traceback.

**Validação real**, cwd `modulos/M06-evals-observabilidade/lab`, CPython 3.14.7, ambiente `.venv` existente:

```text
.venv/bin/python -m pytest -q
41 passed, 28 warnings in 0.20s
.venv/bin/ruff check .
All checks passed!
.venv/bin/mypy
Success: no issues found in 13 source files
```

Os 28 avisos são os `DeprecationWarning` de `pytest-asyncio` descritos acima. Também tentei `uv run --locked --offline`, mas o sandbox bloqueou a inicialização do cache em `/Users/denisson/.cache/uv`; por isso executei os binários do ambiente local existente. A alteração deste RUN toca somente `gate.py`, `test_gate.py` e este relatório. Esta correção ainda precisa de revisão independente; não houve promoção de AT/gate nem início de FIX-02.

## Revisão independente do cálculo de taxas — 25/09/2026

**Resultado:** REVISADO. O RUN `01a0d688-c810-7050-9280-d87bcaaf28e8` revisou o diff de `gate.py`/`test_gate.py`, o contrato do runner, os controles e a evidência de execução. A configuração do agendador foi confirmada em `automation.toml`: `gpt-6-luna / high`; isso registra a configuração, não introspecção do runtime.

O cálculo centralizado em `_taxa_pct()` usa `Decimal` para evitar converter contagens inteiras arbitrariamente grandes para `float` antes da divisão. A mesma função é usada pela validação da taxa declarada, pela comparação com a baseline e pela tabela Markdown. Os testes diretos e de CLI cobrem `10**1000`; o CLI positivo retorna zero sem traceback. A validação de inteiros fora do intervalo conversível continua coberta por controles negativos com diagnóstico e código 2. Revisei também os testes de conjuntos de categorias, categorias obrigatórias, taxa e amostra inválidas, identidade do dataset, piso de segurança, tolerância e aviso de custo.

Validação executada nesta revisão, cwd `modulos/M06-evals-observabilidade/lab`, usando `.venv` existente (CPython 3.14.7):

```text
.venv/bin/python -m pytest -q
41 passed, 28 warnings in 0.20s
.venv/bin/ruff check .
All checks passed!
.venv/bin/mypy
Success: no issues found in 13 source files
```

Os 28 avisos são `DeprecationWarning` de `pytest-asyncio` sobre a política do event loop. Não encontrei achado pendente no escopo FIX-01. Esta revisão não certifica a didática do M06, não promove ATs ou gates e não altera o alcance da evidência registrada.
