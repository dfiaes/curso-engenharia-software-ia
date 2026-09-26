# FIX-03 — validação substantiva das evidências do PRR M13

**Estado:** REVISADO
**Sessão de autoria:** 01a0d6a8-d38d-78b1-bd51-e9b122837b56
**Sessão de revisão:** 01a0d6ad-6777-73f0-8ebd-0122a237fe6d
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador
**Data:** 25/09/2026
**Trilha:** principal · **Bloco em foco:** M13 B18
**ATs/gates:** nenhum AT ou gate promovido; correção atual aguarda revisão independente.

## Objetivo e baseline focal

Impedir que caminhos existentes sejam confundidos com evidência de prontidão e que um game day com eventos registrados, mas sem recuperação, resulte em GO.

Baseline real, antes da alteração, no cwd `modulos/M13-capstone/lab`:

```text
./.venv/bin/pytest -q
125 passed in 0.21s
```

Reproduzi o defeito histórico em `TemporaryDirectory` próprio: criei os dez diretórios apontados pelo checklist sem arquivos e passei ao game day um callback com `applied=False, recovered=False`. A função antiga retornou `aprovados=10`, `total=10`, veredito `GO`.

## Alterações focais

- `modulos/M13-capstone/lab/src/capstone_lab/prr.py`: PRR lê manifesto JSON versionado em `evidence/m13/prr-manifest.json`; exige os dez requisitos; valida vínculo do digest esperado e revisão, status, campos de contexto, hash calculado de artefato não vazio, arquivo regular e confinamento do caminho à raiz do módulo. Entradas ausentes ou inválidas viram pendências por requisito. GO exige relatório estruturalmente completo, todas as dez áreas aprovadas e game day com cinco eventos, falha injetada, recuperação e rollback observados.
- `modulos/M13-capstone/lab/tests/test_prr.py`: fixture positiva sintética e controles para diretórios sem manifesto, manifesto vazio/JSON inválido, requisito ausente, FAIL/BLOCKED, digest divergente, hash inválido/divergente, caminho relativo/symlink para fora da raiz, artefato vazio, relatório incompleto e recuperação não observada. O teste positivo executa o par local de deploy/rollback de B17.
- `modulos/M13-capstone/lab/docs/prr-manifest.schema.json` e `prr-manifest.md`: contrato, localização, interpretação dos estados, vínculo de revisão e limites do hash.

O digest da revisão-alvo é parâmetro explícito do chamador. Hash confirma identidade dos bytes, não a verdade ou suficiência do documento; revisão humana ainda precisa conferir conteúdo e alcance. Dados históricos não foram convertidos automaticamente.

## Fontes

- JSON Schema Draft 2020-12, vocabulário de validação estrutural (`required`, `enum`, `pattern`, `additionalProperties`), consultado em 25/09/2026: https://json-schema.org/draft/2020-12/json-schema-validation. A checagem do repositório complementa o schema com regras semânticas próprias, hash em tempo de execução, comparação do digest esperado e confinamento de caminhos.

## Validações executadas

`uv run --locked --offline` foi tentado conforme o cartão, mas o uv não conseguiu inicializar cache em `/Users/denisson/.cache/uv` devido a `Operation not permitted`. Para executar o mesmo conjunto com o ambiente já existente, usei diretamente os binários de `.venv`.

**Ambiente:** CPython 3.14.7; uv 0.12.7; macOS 27.0.0 arm64. CWD: `modulos/M13-capstone/lab`.

```text
./.venv/bin/pytest -q
139 passed in 0.26s

./.venv/bin/ruff check .
All checks passed!

./.venv/bin/mypy
Success: no issues found in 38 source files
```

## Limites e próxima ação

- Os arquivos válidos usados para GO são fixtures sintéticas em diretório temporário de teste; não certificam o produto nem geram evidência de release.
- O módulo não possui ainda manifesto de produção construído a partir de evidências revisadas. Sem ele, `prr_report` retorna NO-GO; o M13 continua sem prontidão certificada.
- O digest correto precisa ser fornecido pelo processo chamador e não é derivado automaticamente do git. O hash não autentica o revisor nem demonstra correção do conteúdo.
- O cartão foi implementado sem editar `PROGRESSO.md`, rastreabilidade curricular, evidências históricas, publicar ou fazer deploy.
- Próximo passo: revisão independente do diff, do schema, dos controles negativos e das saídas executadas. Só essa revisão poderá considerar a correção do achado A01; gates permanecem inalterados.

## Revisão independente e correções — 25/09/2026

**RUN:** `01a0d671-e469-7ca1-80a1-ef1ab571ec87`. **Modelo/esforço:** `gpt-6-luna / high`, conforme configuração consultada em `automation.toml`; origem é o agendador, sem introspecção do runtime. Como o revisor alterou código e testes, esta sessão tornou-se autora da correção e FIX-03 permanece `AGUARDA_REVISAO` para nova revisão distinta.

### Achados reproduzidos

- O schema declara `schema_version` constante 1 e `additionalProperties: false`; a implementação aceitava o booleano JSON `true` como 1 (regra de igualdade de Python), e aceitava chaves extras na raiz e nos itens. Reproduzi `schema_version: true` aprovando dez requisitos (`GO`).
- O manifesto fixo podia ser um symlink para fora da raiz. Reproduzi um arquivo externo que referenciava artefatos íntegros dentro da raiz e obteve `GO`, contrariando o confinamento descrito no contrato.

### Correções implementadas

- `prr_report` agora exige versão que seja `int` e rejeita explicitamente `bool`; também rejeita propriedades adicionais da raiz. `_validar_item` rejeita propriedades extras em cada registro.
- O manifesto é resolvido estritamente e precisa permanecer dentro da raiz do módulo antes da leitura; falha produz NO-GO com motivo por requisito.
- `test_prr.py` cobre versão booleana, symlink externo com artefatos internos e propriedades adicionais na raiz/no item.

### Verificações atuais

CWD `modulos/M13-capstone/lab`, CPython 3.14.7 e `.venv` já existente:

```text
.venv/bin/python -m pytest -q
143 passed in 0.32s
.venv/bin/ruff check .
All checks passed!
.venv/bin/mypy
Success: no issues found in 38 source files
```

O teste para symlink reproduz o escape que aprovava antes; agora os dez requisitos ficam pendentes. Fixture sintética válida continua demonstrando o fluxo mecânico somente. Nenhum AT, gate, rastreabilidade curricular ou readiness de produção foi promovido. Próxima ação: revisão independente deste novo diff; preservar NO-GO do M13 e `PROGRESSO.md`.

## Revisão independente da correção — 25/09/2026

**Resultado:** AJUSTES_NECESSARIOS. O RUN `01a0d688-c810-7050-9280-d87bcaaf28e8` revisou código, schema, testes e evidência. A configuração do agendador foi confirmada em `automation.toml`: `gpt-6-luna / high`; isso registra a configuração, não introspecção do runtime.

### Achado P1 — `GameDay` construído sem execução pode produzir GO

`decide_go_no_go()` confia em `len(game_day.timeline) >= 5` e no booleano público `game_day.recovery_observed`. A classe `GameDay` pode ser instanciada diretamente e ambos os campos podem ser preenchidos sem chamar `game_day_release_ruim()` nem executar o callback de deploy/rollback. Reproduzi em `modulos/M13-capstone/lab`, com manifesto-fixture completo: criei `GameDay("nao-executado", recovery_observed=True)`, acrescentei cinco eventos arbitrários e recebi `veredito: GO`. A correção atual evita o callback que retorna recuperação falsa, mas ainda permite afirmar recuperação sem evidência de execução.

Corrigir o contrato para que a decisão derive de um resultado de execução produzido pelo fluxo de game day, e não de campos afirmativos que qualquer chamador pode preencher. Acrescentar controle negativo para `GameDay` construído manualmente/eventos arbitrários; preservar o positivo que executa o par local de deploy e rollback e os controles atuais. A revisão não alterou código nem testes.

Validação executada antes do achado, cwd `modulos/M13-capstone/lab`, CPython 3.14.7: `.venv/bin/python -m pytest -q` → 143 passed; `.venv/bin/ruff check .` → All checks passed; `.venv/bin/mypy` → Success, 38 source files. A reprodução adicional do achado foi real e retornou GO. Esses checks verdes não removem a falha.

M13 permanece NO-GO; nenhum AT, gate, readiness de produção ou status curricular foi promovido. Após o ajuste, FIX-03 exige outra revisão em RUN distinto. `PROGRESSO.md` permanece preservado.

## Correção do falso GO por `GameDay` manual — 25/09/2026

**Estado da entrega:** AGUARDA_REVISAO. O RUN `01a0d688-c810-7050-9280-d87bcaaf28e8` tornou-se autor desta correção; a revisão independente acima permanece no histórico e não aprova esta alteração. Configuração registrada pelo agendador: `gpt-6-luna / high`.

- `src/capstone_lab/prr.py`: `recovery_observed` agora é uma propriedade derivada de um recibo interno registrado somente depois que `game_day_release_ruim()` executa o callback e confere `failure_injected`, `recovered` e `rollback_verified`. O construtor de `GameDay` não aceita mais um booleano de recuperação afirmado pelo chamador. Eventos continuam sendo uma timeline, mas não contam como prova de execução.
- `tests/test_prr.py`: novo controle negativo constrói manualmente um `GameDay`, acrescenta cinco eventos arbitrários com manifesto-fixture positivo e confirma NO-GO, mantendo o positivo que executa o par local de deploy/rollback e os demais controles existentes.

Baseline focal imediatamente antes desta alteração: `.venv/bin/python -m pytest -q` → 143 passed. Validação após a alteração, cwd `modulos/M13-capstone/lab`, CPython 3.14.7, ambiente `.venv` existente:

```text
.venv/bin/python -m pytest -q
144 passed in 0.28s
.venv/bin/ruff check .
All checks passed!
.venv/bin/mypy
Success: no issues found in 38 source files
```

O positivo continua sendo uma fixture sintética que exercita o mecanismo local; não certifica produto ou operação de produção. O controle negativo agora rejeita a tentativa de construir somente eventos. A revisão independente deve inspecionar o contrato de recibo e reexecutar o teste. Nenhum AT, gate ou readiness foi promovido; M13 permanece NO-GO; `PROGRESSO.md` não foi alterado.

## Revisão da entrega e fechamento da via de afirmação manual — 25/09/2026

**Resultado da revisão:** AJUSTES_NECESSARIOS. RUN revisor: `01a0d696-83dc-77b0-89b8-cf0e6394992f`. Configuração confirmada em `automation.toml`: `gpt-6-luna / high`, origem agendador; sem alegar introspecção do runtime.

### Achado

A inspeção identificou que `_record_execution()` ainda aceitava um dicionário de três booleanos `True`, e `game_day_release_ruim()` aceitava callback substituível. Assim, o fluxo podia produzir o recibo a partir de resultados afirmados pelo próprio chamador. O cenário manual de cinco eventos continuava NO-GO, mas o mecanismo que gerava o recibo ainda era declarativo.

### Correção implementada nesta execução

- `prr.py` executa diretamente o cenário local B17: deploy de release ruim recusado pelo health gate, deploy da versão boa e rollback até o estado inicial. O game day não aceita callback ou resultado fornecido pelo chamador.
- `GameDay` é congelado e o recibo fica em campo não inicializável pelo construtor; eventos acrescentados manualmente seguem sem comprovar execução.
- `test_prr.py` conserva a fixture positiva executável, o controle de eventos arbitrários e verifica que a instância não permite atribuição ordinária ao recibo. O teste anterior de callback falso foi removido porque esse ponto de injeção deixou de existir.
- `prr-manifest.md` explica que o resultado comprova somente o mecanismo simulado local, não operação de produção.

### Verificações desta execução

CWD `modulos/M13-capstone/lab`; CPython 3.14.7; `.venv` existente:

```text
./.venv/bin/python -m pytest -q
144 passed in 0.29s
./.venv/bin/ruff check .
All checks passed!
./.venv/bin/mypy
Success: no issues found in 38 source files
```

Nenhum AT, gate, readiness ou rastreabilidade curricular foi promovido. O GO fixture permanece evidência mecânica sintética; M13 continua NO-GO sem manifesto de produção revisado. Esta execução tornou-se autora da correção, portanto a entrega permanece `AGUARDA_REVISAO` e requer novo RUN revisor.

## Fechamento da timeline mutável — 25/09/2026

**Resultado da revisão deste RUN:** AJUSTES_NECESSARIOS, seguido de correção. RUN autor da correção: `01a0d6a8-d38d-78b1-bd51-e9b122837b56`. Configuração do agendador: `gpt-6-luna / high`.

### Achado reproduzido

Embora `GameDay` fosse congelado, `timeline` continha uma lista mutável. Depois de executar o cenário B17 real, substituí a lista por cinco eventos inventados; `decide_go_no_go()` retornou `GO` com `recovery_observed=True`. A timeline precisava preservar a sequência associada ao recibo.

### Correção e validação

- `prr.py`: timeline agora é tupla; `registrar()` acrescenta por substituição imutável antes do recibo e rejeita novos eventos depois de a execução ser registrada. O recibo só é atribuído após o encerramento dos cinco eventos.
- `test_prr.py`: o novo controle confirma que a timeline concluída não aceita `.append()` nem eventos adicionais por `registrar()` e mantém seu conteúdo original.
- `docs/prr-manifest.md`: contrato atualizado para declarar o encerramento e a imutabilidade da timeline.

Validação real, cwd `modulos/M13-capstone/lab`, CPython 3.14.7, `.venv` existente:

```text
./.venv/bin/python -m pytest -q
145 passed in 0.27s

./.venv/bin/ruff check .
All checks passed!

./.venv/bin/mypy
Success: no issues found in 38 source files
```

Esta sessão tornou-se autora da correção; FIX-03 permanece `AGUARDA_REVISAO` para novo revisor em RUN distinto. O PRR fixture continua sintético, nenhum AT/gate/readiness foi promovido e M13 permanece NO-GO.

## Revisão independente da correção da timeline — 25/09/2026

**Resultado:** REVISADO. RUN revisor: `01a0d6ad-6777-73f0-8ebd-0122a237fe6d`. Configuração consultada em `automation.toml`: `gpt-6-luna / high`, origem agendador; sem alegar introspecção do runtime.

### Conferência

- `game_day_release_ruim()` executa as transições locais do B17 e só depois registra o recibo com os três resultados booleanos. Não aceita callback ou resultado fornecido pelo chamador.
- Eventos manuais, sem recibo, continuam NO-GO. A timeline é uma tupla e `registrar()` recusa acréscimos após o fechamento; o postmortem é derivado dessa timeline.
- O controle novo tenta `.append()` e `registrar()` depois da execução, verificando que o histórico associado ao recibo não muda. Os demais testes cobrem manifesto vazio/inválido, requisito ausente, estados FAIL/BLOCKED, revisão/hash divergentes, caminhos externos e relatórios incompletos.
- `deploy.py` rotula explicitamente o health gate como simulador determinístico; a própria documentação limita o resultado ao mecanismo local e não a operação de produção. O manifesto sintético do teste não foi tratado como evidência de release.

Validação independente, cwd `modulos/M13-capstone/lab`, CPython 3.14.7 e `.venv` existente:

```text
./.venv/bin/pytest -q
145 passed in 0.24s

./.venv/bin/ruff check .
All checks passed!

./.venv/bin/mypy
Success: no issues found in 38 source files
```

Sem achados pendentes na correção revisada. FIX-03 fica `REVISADO`; isto não certifica o manifesto de produção nem promove AT, gate ou readiness. M13 continua NO-GO e `PROGRESSO.md` permanece intocado.
