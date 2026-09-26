# FIX-06 — calibração humana e juiz no M06 B03

**Estado:** AGUARDA_REVISAO
**Sessão de autoria:** 01a0dea7-003e-7262-8bbd-4ed3faf5d5e2
**Sessão de revisão:** pendente
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador
**Data:** 26/09/2026
**Trilha:** principal · **Unidade:** M06 B03
**ATs/gates:** nenhum promovido.

## Baseline focal

Antes da mudança, o B03 descrevia concordância como calibração, dizia que o avaliador deveria medir acordo com “o humano (você)” e citava kappa como equivalente simples a inspecionar acerto por classe. O exemplo roteirizado com dez itens e o nome interno `sustentada_humano` não deixavam explícito que nenhum humano rotulou esses casos. O limiar 85% já havia sido delimitado como política local após FIX-05, mas a seção não mostrava quanto a composição de classes afeta o acordo total nem separava calibração de probabilidades.

## Alterações

- `modulos/M06-evals-observabilidade/M06.html`: separa confiabilidade, concordância total/por classe, correção por acaso, calibração probabilística e validade. Declara que as dez linhas do laboratório são fixture roteirizada, não anotação humana; o juiz determinístico retorna booleano e não produz probabilidades. Explica ajuste da rubrica e confirmação em casos separados.
- Incluído exemplo variável com 100 casos (80 sustentadas, 20 não sustentadas): juízes A e B têm 90% de acordo agregado, mas sensibilidades/especificidades e erros distintos. O juiz sempre-sim tem 80% de acordo e especificidade zero; um corte local de 80% o aceitaria, mostrando por que custo/prevalência precisam participar da decisão. Abstenção/revisão humana aparece como resultado possível.
- `modulos/M06-evals-observabilidade/lab/tests/test_judge.py`: documenta que `_rotulos()` é fixture, não dado humano. Novo controle usa classe majoritária para provar o acordo de 80% e zero acerto na classe negativa; chama `calibrar(..., limiar=0.8)` para tornar observável o efeito de um corte local escolhido sem análise de classe.
- `docs/especificacoes/M06-ESPECIFICACAO.md` e rastreabilidade registram as distinções e limites. Adicionadas fontes primárias de Cohen (1960) para kappa e Guo et al. (2017) para calibração de probabilidades; artigo de Zheng et al. foi revalidado.

## Contas e controles

Exemplo reproduzido com Python:

```text
A: 90% total; sensibilidade 95%; especificidade 70%.
B: 90% total; sensibilidade 87,5%; especificidade 100%.
Sempre “sustentada”: 80% total; sensibilidade 100%; especificidade 0%.
```

Comando focal, cwd `modulos/M06-evals-observabilidade/lab`, CPython 3.14.7 obtido via uv e lock existente:

```text
uv run --locked --offline pytest -q tests/test_judge.py
3 passed, 1 warning in 0.04s
DeprecationWarning do pytest-asyncio: get_event_loop_policy será removido em Python 3.16.

UV_CACHE_DIR=/private/tmp/uv-course-01a0de29 uv run --locked --offline python --version
Python 3.14.7
UV_CACHE_DIR=/private/tmp/uv-course-01a0de29 uv run --locked --offline ruff check tests/test_judge.py
All checks passed!
```

A primeira consulta usando `python3 -m pytest` encontrou o Python de sistema 3.9.6 sem pytest. Em seguida executei as verificações pelo ambiente local gerenciado por uv, sem atualizar o lock; não usei aquele primeiro resultado como teste. Na raiz do repositório, após as edições: `python3 tools/check_course.py` → 115 documentos, 0 erros estruturais/links; `python3 tools/validate_backlog.py` → 699 tarefas, 0 erros; `git diff --check` focal → exit 0. Nenhuma coleta com pessoas, chamada de juiz real ou execução integral do laboratório foi feita.

## Fontes e evidência

Consultadas em 26/09/2026: Zheng et al., versão v4 do preprint (posição, verbosidade, auto-preferência e limites de raciocínio); Cohen (1960), artigo original sobre coeficiente kappa; Guo et al. (2017), calibração de probabilidades. As fontes são registradas na especificação e ligadas aos claims no HTML. A evidência sustenta as definições e o exemplo didático, não a validade de um juiz de produto.

## Rubrica editorial (0 ausente, 1 parcial, 2 suficiente)

| Critério | Nota | Evidência e limite |
|---|---:|---|
| Contexto/pré-requisitos | 2 | Diferencia rótulo, classe, concordância, kappa e probabilidade prevista. |
| Mecanismo | 2 | Matriz por classe e exemplo numérico com totais verificáveis. |
| Exemplo trabalhado | 2 | Dois juízes empatam no total; sempre-sim expõe viés de classe majoritária. |
| Decisão/limites | 2 | Limiar depende de custo/prevalência; abstinência é possível; 85% local. |
| Falha/diagnóstico | 2 | Classe negativa com especificidade zero é visível apesar do acordo agregado. |
| Transferência | 1 | Há critério para conjunto de confirmação; nenhum leitor ou juiz humano foi observado. |
| Fontes/evidência | 2 | Artigos originais consultados; cálculos e teste executados. |
| Navegabilidade | 1 | Âncoras/estrutura passam; QA visual permanece fora desta edição. |

Nenhum AT ou gate promovido. G3/G6 e validação humana real permanecem pendentes conforme a fila. `PROGRESSO.md` foi preservado. O pacote aguarda revisão em RUN distinto.

## Revisão independente — 26/09/2026

**Sessão de revisão:** 01a0de37-aaa8-72e0-9b2a-11c0acc4e297 · **Resultado:** AJUSTES_NECESSARIOS.

A revisão confirmou que as contas da tabela estão corretas, que a fixture é explicitamente roteirizada no HTML e no teste, que o juiz sempre-sim obtém 80% na classe majoritária com zero acerto na classe negativa, e que o texto delimita 85% como política local. O exemplo de dois juízes também demonstra corretamente 90% agregado com erros por classe diferentes. Consultei os artigos originais de Cohen (1960), Guo et al. (2017) e Zheng et al. (2023); Cohen fundamenta o kappa para concordância nominal, enquanto Guo trata de probabilidades previstas e correção observada, sem transferir a validade para um juiz LLM.

**Achado que impede aprovação:** `lab/src/eval_lab/judge.py` permanece fora do write set, mas seu contrato público contradiz a correção didática: a docstring de `calibrar()` afirma “Acordo juiz x humano” mesmo quando recebe a fixture; `Rotulo.sustentada_humano` dá o mesmo nome humano ao alvo roteirizado; e `limiar=0.85` é um default publicado sem contexto. A prosa explica esses limites, mas a API continua ensinando/permitindo tratar a fixture como referência humana e aplicar 85% como regra geral. O teste de 80% confirma precisamente que um corte agregado pode aceitar o juiz sempre-sim; não prova proveniência humana nem corrige o default.

O cartão autoriza escrita em `M06.html`, `lab/tests/test_judge.py`, spec e trace, mas não em `lab/src/eval_lab/judge.py`. Para corrigir completamente, o escopo precisa incluir esse arquivo: nomear os rótulos como referência sem pressupor origem humana, exigir limiar explícito (ou declarar o default como política exclusiva do exemplo), e alinhar chamadas/testes. Nenhum arquivo fora do write set foi alterado.

Verificações reproduzidas: em `modulos/M06-evals-observabilidade/lab`, `uv run --locked --offline pytest -q tests/test_judge.py` → 3 passed, 1 aviso de depreciação do pytest-asyncio em Python 3.16; na raiz, `python3 tools/check_course.py` → 115 documentos, 0 erros estruturais/links; `python3 tools/validate_backlog.py` → 699 tarefas, 0 erros; `git diff --check` focal → exit 0. Os testes verificam o comportamento local descrito, não a origem dos rótulos. Nenhum AT/gate foi promovido; `PROGRESSO.md` preservado.


## Correção após revisão — autoria 26/09/2026

**Sessão de autoria:** 01a0de37-aaa8-72e0-9b2a-11c0acc4e297 · **Estado:** AGUARDA_REVISAO. A ampliação necessária foi registrada na revisão acima antes de tocar em `lab/src/eval_lab/judge.py`; esse arquivo e suas chamadas/testes passam a compor o write set focal para corrigir a mesma incongruência.

`Rotulo.sustentada_humano` foi renomeado para `rotulo_referencia`, sem presumir proveniência. `calibrar()` agora exige o limiar por argumento nomeado, valida `[0, 1]` e recusa conjunto vazio; testes e prosa apontam que a função só calcula acordo agregado e não certifica coleta humana. O HTML, a especificação e a rastreabilidade foram alinhados. Nenhum AT/gate foi promovido.

Verificações pós-correção, cwd `modulos/M06-evals-observabilidade/lab`, CPython 3.14.7 do ambiente uv: `uv run --locked --offline pytest -q tests/test_judge.py` → 4 passed, 1 aviso de depreciação do pytest-asyncio; `UV_CACHE_DIR=/private/tmp/uv-course-01a0de37 uv run --locked --offline ruff check src/eval_lab/judge.py tests/test_judge.py` → All checks passed; `ruff format --check` nos dois arquivos → 2 files already formatted; `uv run --locked --offline mypy --strict src tests` → success, 13 arquivos. Na raiz: `python3 tools/check_course.py` → 115 documentos, 0 erros estruturais/links; `python3 tools/validate_backlog.py` → 699 tarefas, 0 erros; `git diff --check` focal → exit 0. A suite não prova proveniência humana, validade do juiz real, QA visual nem gate editorial. Aguarda revisão em execução distinta.

## Revisão independente e correção focal — 26/09/2026

**Revisão da entrega anterior:** RUN `01a0de52-170e-7f60-9719-5a38b3d6734a`. A revisão confirmou a API atual (`rotulo_referencia`, limiar explícito, rejeição de entrada vazia/inválida), os cenários de classe majoritária e a separação entre concordância observada e calibração probabilística. Identificou, porém, resíduo editorial: a abertura da especificação ainda descrevia o juiz como “calibrado contra humano”, enquanto o laboratório não contém qualquer rótulo humano; o P5 e a conclusão do HTML ainda pediam concordância “com você” sem delimitar proveniência.

Esta execução corrigiu a especificação para exigir referências humanas documentadas quando disponíveis e declarar que a fixture apenas exercita concordância, não calibra probabilidades. O P5 e a conclusão agora condicionam a afirmação à referência de origem documentada. Como o revisor alterou conteúdo, este RUN é também a nova sessão de autoria; a sessão de revisão volta a pendente e FIX-06 permanece AGUARDA_REVISAO. Nenhum AT/gate foi promovido.

Verificação deste RUN: cwd `modulos/M06-evals-observabilidade/lab`, CPython 3.14.7 do ambiente uv, `UV_CACHE_DIR=/private/tmp/uv-course-01a0de52 uv run --locked --offline pytest -q tests/test_judge.py` → 4 passed, 1 aviso de depreciação do pytest-asyncio sobre Python 3.16. Na raiz: `python3 tools/check_course.py` → 115 documentos, 0 erros estruturais/links, 14 referências legadas/contextuais; `python3 tools/validate_backlog.py` → 699 tarefas, 0 erros; `git diff --check` focal → exit 0. PMLR confirmou que Guo et al. define calibração de confiança como estimativas de probabilidade representativas da chance real de correção. SAGE confirmou autor, título, periódico, páginas e data do artigo de Cohen; o texto integral não carregou nesta revisão, então a consulta bibliográfica não é apresentada como verificação do artigo completo. Limites: nenhuma anotação humana, execução integral do lab, QA visual ou gate foi produzido.


## Revisão independente — RUN `01a0de8b-ffd8-72d2-800e-ffb966485ed6`

**Resultado:** AJUSTES_NECESSARIOS. As contas por classe, a fixture roteirizada, os testes de entrada/limiar e a distinção entre acordo observado e calibração probabilística estão corretos. Os checks estruturais/backlog passaram antes desta correção; a evidência executável do autor registra quatro testes focais aprovados.

**Achado corrigido nesta revisão:** tabelas iniciais ainda apresentavam seres humanos como referência absoluta e descreviam o juiz como “alinhado com você”. O texto agora exige referências humanas registradas e reconhece discordância/erro entre revisores. Também explicitei na especificação e rastreabilidade que M06-AT-006 requer conjunto humano documentado e não é verificado pela fixture roteirizada; o corte de 85% é local.

Como houve alteração de conteúdo, esta execução passa a ser a sessão de autoria corrente e a sessão de revisão retorna a pendente. A entrega aguarda revisão independente. Nenhum AT/gate foi promovido; sem anotação humana, execução integral do laboratório ou QA visual.

## Revisão independente e correção terminológica — RUN `01a0dea7-003e-7262-8bbd-4ed3faf5d5e2`

**Achado:** embora HTML e especificação distinguissem concordância observada de calibração probabilística, a API `calibrar()` e o título “Juiz calibrado” voltavam a sugerir que o helper calculava calibração. O `README.md` do módulo também afirmava que a suíte calibrava o juiz contra rótulos humanos, apesar da fixture ser roteirizada.

**Escopo:** o write set original não incluía o `README.md`, mas sua frase de abertura fazia uma afirmação explícita sobre a natureza da evidência do mesmo cartão. Registrei essa necessidade antes de ampliar o escopo focal e corrigi somente a frase; nenhum outro artefato fora do write set foi alterado.

**Correção/autoria deste RUN:** renomeei `calibrar()` para `medir_acordo()`, alinhei docstrings e mensagem de erro, testes, heading do laboratório, README e especificação. A função segue medindo somente concordância agregada contra rótulos de referência cuja proveniência fica com o chamador; não estima calibração probabilística nem certifica anotação humana. Este RUN tornou-se autor corrente; a revisão volta a pendente e FIX-06 aguarda execução distinta. Nenhum AT/gate foi promovido.

Verificação, cwd `modulos/M06-evals-observabilidade/lab`, CPython 3.14.7: `PYTHONPATH=src ./.venv/bin/python -m pytest -q tests/test_judge.py` → 4 passed, 1 aviso de depreciação do pytest-asyncio referente ao Python 3.16; Ruff check passou; `ruff format --check` → 2 arquivos formatados; `mypy --strict src tests` → sucesso em 13 arquivos. `check_course.py` no HTML → 1 documento/0 erros; `validate_backlog.py` → 699 tarefas/0 erros; `git diff --check` focal passou. Limites: sem anotação humana, juiz LLM real, QA visual ou gate. `PROGRESSO.md` preservado.
