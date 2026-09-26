# FIX-04 — game day exige recuperação observada

**Estado:** BLOQUEADO
**Sessão de autoria:** 01a0d6c4-4b1a-7482-9c37-d3608215101e
**Sessão de revisão:** pendente
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador
**Data:** 25/09/2026
**Trilha:** principal · **Bloco:** M13 B18
**ATs/gates:** nenhum AT/gate/readiness promovido; revisão independente pendente.

## Baseline e decisão focal

Antes da mudança, `modulos/M13-capstone/lab` tinha 145 testes passando, Ruff sem achados e mypy sem issues. A leitura do código mostrou que a correção de FIX-03 já removeu o callback de recuperação: `game_day_release_ruim()` conduz diretamente o cenário local B17 e cria o recibo somente depois dos eventos da timeline. Por isso, FIX-04 não deve recolocar callbacks nem criar outro simulador.

Os controles existentes já cobriam cinco eventos manuais sem recibo → NO-GO, execução local completa + fixture PRR válida → GO no escopo do mecanismo simulado, evento fora de ordem e relatório PRR incompleto. A lacuna restante era um teste explícito de que a API rejeita callbacks antigos capazes de retornar recuperação falsa ou lançar exceção.

## Alteração

- `modulos/M13-capstone/lab/tests/test_prr.py`: adicionados dois callbacks negativos (um retornaria `recovered=False`; outro lançaria `RuntimeError`) e teste parametrizado que confirma que `game_day_release_ruim(callback=...)` é rejeitado na fronteira da API com `TypeError`; o corpo dos callbacks não serve como evidência nem é executado.
- `prr.py` e `test_prr.py` foram formatados com Ruff. Não houve alteração no mecanismo local de recuperação.

## Verificação real

CWD: `modulos/M13-capstone/lab`; CPython 3.14.7 existente em `.venv`. O cache padrão do uv não era acessível, então foi usado cache temporário próprio em `/private/tmp`. `--no-sync` evita alterar ou instalar dependências.

```text
UV_CACHE_DIR=/private/tmp/ops03-uv-cache uv run --locked --offline --no-sync pytest -q
147 passed in 0.28s

UV_CACHE_DIR=/private/tmp/ops03-uv-cache uv run --locked --offline --no-sync ruff check .
All checks passed!

UV_CACHE_DIR=/private/tmp/ops03-uv-cache uv run --locked --offline --no-sync ruff format --check .
48 files already formatted

UV_CACHE_DIR=/private/tmp/ops03-uv-cache uv run --locked --offline --no-sync mypy
Success: no issues found in 38 source files
```

## Limites

O GO positivo prova apenas o contrato e a simulação determinística local de B17. Não aprova piloto, integração do serviço ou release de produção. M13 permanece NO-GO; seu manifesto de produção e CAP-* continuam pendentes. `PROGRESSO.md` não foi alterado. Esta entrega requer revisão em RUN separado.


## Revisão independente — 25/09/2026

**RUN revisor:** `01a0d6c4-4b1a-7482-9c37-d3608215101e` · **Configuração:** `gpt-6-luna / high`, origem `automation.toml`.

**Resultado:** AJUSTES_NECESSARIOS. Os callbacks antigos com `recovered=False` e exceção são rejeitados, timeline manual de cinco eventos dá NO-GO, ordem inválida é rejeitada, PRR incompleto dá NO-GO, e o caso fixture completo dá GO. Porém, o cenário positivo não comprova a recuperação alegada: `deploy()` recusa `Release(healthy=False)` antes de aplicar qualquer migration; em seguida, o fluxo aplica a release boa e faz rollback dessa release até schema 0. A timeline chama isso de recuperação da release ruim, embora ela nunca tenha alterado o estado. Ajustar o cenário/evidência para injetar uma falha depois de uma mudança observável e restaurar o estado anterior, ou limitar as afirmações para corresponder ao que o fluxo prova e rever o critério B18 correspondente. Acrescentar também a rubrica solicitada no cartão e explicitar qual teste cobre o caso de borda.

**Verificação do revisor:** `UV_CACHE_DIR=/private/tmp/ops03-review-uv-cache uv run --locked --offline --no-sync pytest -q` → 147 passed; Ruff check → All checks passed; Ruff format → 48 arquivos já formatados; mypy → 38 arquivos sem issues. Nenhum gate/AT/readiness promovido.


## Bloqueio encontrado após revisão — 25/09/2026

A tentativa de ajustar o cenário para aplicar uma release e revertê-la exige verificar o ponteiro da versão ativa. Reproduzi em memória, no lab M13, com `ClusterState(data={'cfg':'v1'})`, `Release('9.9.9', Migration(1, up={'cfg':'v2'}, down_restores={'cfg':'v1'}))`: `deploy()` aplicou `9.9.9`; `rollback(..., target_schema=0)` restaurou `schema_version=0` e `data={'cfg':'v1'}`, mas deixou `state.released='9.9.9'` e histórico `['deploy:9.9.9', 'rollback:->0']`. A mesma regressão invalida chamar esse fluxo de recuperação integral.

**Condição para retomada:** corrigir e testar o ponteiro `ClusterState.released` em `lab/src/capstone_lab/deploy.py` e `lab/tests/test_deploy.py`, depois alterar o game day para aplicar a release candidata, observar falha pós-deploy e confirmar dados, schema e release anterior restaurados. Esses dois arquivos ficam fora do write set explícito de FIX-04 (`prr.py`, `test_prr.py` e contrato de callback); não os editei. A implementação permanece BLOQUEADA e não pode gerar GO de recuperação.

**RUN desta análise:** `01a0d6c4-4b1a-7482-9c37-d3608215101e`, `gpt-6-luna / high`, configuração do agendador. A suíte previamente reproduzida ainda passa (147 testes), mas não cobre o ponteiro de release após rollback. Nenhum AT/gate/readiness promovido.

### Rubrica atual (0 ausente, 1 parcial, 2 suficiente)

| Critério | Nota | Evidência e limite |
|---|---:|---|
| Contexto e pré-requisitos | 2 | Simulador local e integração não certificada estão separados. |
| Mecanismo | 1 | Rollback reverte dados/schema, mas ponteiro da release ativa fica incorreto. |
| Exemplo trabalhado | 2 | Cenário e execução reprodutíveis; resultado expõe o defeito. |
| Decisão e limites | 1 | NO-GO correto para esta falha; não há recuperação integral. |
| Falha e diagnóstico | 2 | Controle positivo anterior não exercitava estado pós-release aplicado; regressão agora é explícita. |
| Transferência | 1 | A correção do estado de release precisa ser validada no adapter real fora deste cartão. |
| Fontes/evidência | 2 | Evidência local reproduzida; sem alegação de operação de produção. |
| Navegabilidade | 2 | Relatório liga cenário, arquivos bloqueadores e condição de retomada. |

Mecanismo e decisão, dimensões centrais, não atingem 2; o cartão não pode ser aceito.
