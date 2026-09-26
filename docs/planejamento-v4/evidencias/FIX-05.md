# FIX-05 — inferência estatística no M06 B01

**Estado:** REVISADO  
**Sessão de autoria:** 01a0de17-9e64-7661-93f3-dba46b3a29d7  
**Sessão de revisão:** 01a0de29-ee55-7dd2-a199-a2126b1c1b10  
**Modelo/esforço:** `gpt-6-luna / high`; configuração do agendador  
**Data:** 25/09/2026  
**Trilha:** principal · **Unidade:** M06 B01  
**ATs/gates:** nenhum promovido.

## Correção editorial após revisão — 26/09/2026

**RUN autor da correção:** `01a0de17-9e64-7661-93f3-dba46b3a29d7` · `gpt-6-luna / high`, configuração do agendador.

A revisão identificou que, apesar da explicação correta no corpo do B01, o título, o sumário, o P3 do checkpoint e o rótulo de competência na especificação ainda diziam que testes unitários “não servem”. Atualizei essas formulações para explicitar que testes unitários cobrem invariantes determinísticas e evals complementam a avaliação de comportamento variável. A rastreabilidade registra a correção. FIX-05 retorna a AGUARDA_REVISAO para outro RUN; nenhum AT ou gate foi promovido.

O planejamento estatístico também foi recalculado nesta revisão em Python 3.9.6, reproduzindo `n′=237,82/315,37` e `n=n′+1/δ=257,82/335,37`, arredondados para `238/316` e `258/336`. O NIST/SEMATECH §7.2.4.2 confirma aproximação normal, definição de `δ`, fórmula bilateral/unilateral e a correção de continuidade atribuída a Fleiss, Levin e Paik; §7.2.4.1 apresenta Wilson. A matemática e os limites permanecem consistentes; a nova correção é apenas de redação editorial no escopo aprovado.

## Baseline focal

Antes das alterações, o B01 afirmava que 50 casos distinguiam cerca de 5
pontos e 200 cerca de 2, recomendava 50 por categoria como mínimo,
classificava abaixo de 30 como ruído e tratava ausência de significância
como equivalência. Também chamava concordância do juiz de margem de erro,
generalizava uma amostra de 85%, e dizia que 74% e 72% em 15 casos eram
“a mesma coisa”. O checkpoint P7 pedia promoção com 80%→87% sem exigir
análise do desenho e da incerteza. A especificação afirmava que teste
unitário não servia.

Verificações estruturais baseline, executadas no diretório raiz:

```text
python3 tools/check_course.py
Checked 108 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.

python3 tools/validate_backlog.py
699 tasks: 532 core + 167 optional ML; 26 units / 200 planned blocks; 0 errors.
```

## Alterações

- `modulos/M06-evals-observabilidade/M06.html`: define proporção e erro
  padrão; inclui fórmula Wilson de 95% e contas 45/50 e 180/200; explica
  efeito, taxa de base, α, poder, equivalência e resultado inconclusivo;
  separa desenho pareado/independente e inclui contagem discordante para
  A/B; esclarece dependência por caso, seleção e aleatoriedade do modelo.
- O checkpoint P7 exige identificar dados ausentes e justificar uma
  decisão sustentada, rejeitada ou inconclusiva. Exemplos de 50, 200 e
  15 casos deixaram de operar como limiares universais.
- Concordância do juiz foi separada da margem de erro da métrica do
  produto. 85% agora está identificado como limiar local do cenário
  roteirizado e não certifica juiz de produção. O exemplo de 30 rótulos
  foi delimitado como diagnóstico exploratório, sem garantia.
- Testes unitários foram descritos como necessários para invariantes do
  runtime e complementares aos evals de comportamento variável.
- `docs/especificacoes/M06-ESPECIFICACAO.md` registra os limites, fontes
  estatísticas e o caráter local do limiar AT-006.
- `modulos/M06-evals-observabilidade/RASTREABILIDADE.md` registra a
  correção e mantém a revisão independente pendente.

## Cálculo reproduzido

CPython 3.14.7, fórmula de Wilson com `z=1.96`, executada localmente:

```text
45/50: p=0.9000, Wilson95=[0.786395, 0.956525]
180/200: p=0.9000, Wilson95=[0.850593, 0.934330]
SE(p=.9,n=50)=0.042426
SE(p=.9,n=200)=0.021213
```

Ambas as proporções observadas são 90%; a amostra maior reduz a largura
do intervalo neste exemplo. Isso não prova que 200 seja suficiente,
define diferença detectável ou determina promoção. O intervalo pressupõe
observações binomiais independentes para a interpretação usual; conjunto
de casos fixo, seleção, repetição estocástica e agrupamento exigem análise
adicional. Para versões avaliadas nos mesmos casos, a covariação importa;
teste de McNemar é uma opção para resposta binária pareada, não regra para
toda métrica.

## Verificações após edição

Executadas no diretório raiz:

```text
python3 tools/check_course.py
Checked 108 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.

python3 tools/validate_backlog.py
699 tasks: 532 core + 167 optional ML; 26 units / 200 planned blocks; 0 errors.

git diff --check -- modulos/M06-evals-observabilidade/M06.html docs/especificacoes/M06-ESPECIFICACAO.md modulos/M06-evals-observabilidade/RASTREABILIDADE.md
passed
```

Uma execução geral de `git diff --check` apontou trailing whitespace em
diversos outros arquivos previamente modificados no checkout; esses
arquivos não foram alterados por FIX-05. O checker estrutural não avalia
correção estatística nem visual, e a validação do backlog não certifica
conteúdo. Nenhum laboratório foi alterado ou executado para este cartão.

## Fontes e limites

Consultadas em 25/09/2026: NIST/SEMATECH e-Handbook, Wilson intervals,
sample-size planning e tests of hypotheses; McNemar (1947), registro do
artigo original sobre proporções correlacionadas. Referências e uso foram
adicionados ao HTML e à especificação. Os tamanhos de amostra devem ser
planejados com efeito mínimo relevante, taxa de base, α, poder, desenho,
variabilidade e multiplicidade pertinentes; o cartão não certifica
inferência em produção, distribuição representativa, estabilidade do
modelo ou decisão do gate. Revisão técnica/didática independente pendente.


## Revisão independente — 25/09/2026

**RUN revisor:** `01a0d6c4-4b1a-7482-9c37-d3608215101e` · **Configuração:** `gpt-6-luna / high`, origem `automation.toml`.

**Resultado:** AJUSTES_NECESSARIOS. A explicação de proporção, erro padrão, Wilson, equivalência, pareamento e inconclusivo está coerente com o escopo; os dois intervalos Wilson foram reproduzidos em CPython 3.14.7, e as fontes consultadas confirmam a fórmula, o papel de α/poder e o uso de McNemar para proporções correlacionadas. Para atender o cartão, incluir uma conta pequena que mostre como efeito mínimo, taxa de base, α e poder entram no planejamento de n; identificar no relatório e no texto um caso de borda distinto dos controles negativos (por exemplo, resultado cuja incerteza ainda atravessa a margem prática); e registrar a rubrica aplicável da especificação geral com evidência por critério. O P7 é um cenário de decisão, mas o relatório não o classifica como controle de borda nem documenta a saída esperada.

**Verificação do revisor:** CPython 3.14.7 reproduziu 45/50 → Wilson95 [0.786395, 0.956525], 180/200 → [0.850593, 0.934330], e SE 0.042426/0.021213. NIST/SEMATECH §7.2.4.1–.2 e §7.1.3, e o registro bibliográfico do artigo de McNemar (1947), consultados nesta execução. Nenhum AT/gate promovido.


## Complemento de autoria após revisão — 25/09/2026

**RUN autor do complemento:** `01a0d6c4-4b1a-7482-9c37-d3608215101e` · `gpt-6-luna / high`, configuração do agendador.

O B01 agora inclui planejamento de uma proporção pela aproximação normal publicada no NIST: `p0=0,90`, `p1=0,95`, `δ=0,05`, `α=0,05` bilateral e poder `0,80` dão `n≈237,82`, arredondado para 238; usando `p1=0,85`, n≈315,37, arredondado para 316. Conta e fórmula foram executadas em CPython 3.14.7. O texto declara independência/aproximação, correção de continuidade, limites para pareamento e ausência de universalidade. O caso de borda agora é explicitamente `12/15 → 13/15`: diferença observada de 6,7 pontos por um caso, com incerteza larga e decisão inconclusiva sem dados de pareamento. Alterações focalizadas também foram registradas na especificação e rastreabilidade. Fontes oficiais NIST e artigo original de McNemar foram verificados no registro desta execução.

### Rubrica da especificação geral (0 ausente, 1 parcial, 2 suficiente)

| Critério | Nota | Evidência e limite |
|---|---:|---|
| Contexto/pré-requisitos | 2 | Proporção binária, amostra, taxa de base e hipótese são definidos junto ao uso. |
| Mecanismo | 2 | Erro padrão, Wilson, α, β/poder, diferença de taxa e pareamento são explicados; fórmulas/contas reproduzíveis. |
| Exemplo trabalhado | 2 | Wilson 45/50 e 180/200; planejamento 0,90→0,95; discordâncias pareadas 2 contra 4. |
| Decisão/limites | 2 | Margem prática, equivalência, desenho e saída inconclusiva; sem regra universal de n. |
| Falha/diagnóstico | 2 | Incerteza que atravessa a margem prática e a borda 12/15→13/15 pedem mais evidência; α/poder não escondidos. |
| Transferência | 2 | P7 aplica o método a decisão de gate e pede evidência adicional; limites de amostra fixa e modelo estocástico explicitados. |
| Fontes/evidência | 2 | NIST/SEMATECH e McNemar original registrados; contas reproduzidas em Python 3.14.7. |
| Navegabilidade | 2 | B01 e P7 preservam links/âncoras; spec e rastreabilidade apontam o conteúdo e as limitações. |

Este complemento aguarda revisão independente em outro RUN. Nenhum AT ou gate foi promovido; a suíte do lab não foi alterada nem executada para este cartão.


## Correção editorial após revisão — 25/09/2026

**RUN autor da correção:** `01a0d6d2-06df-7fa1-a6e2-0c11bf34be2e` · `gpt-6-luna / high`, configuração do agendador.

Ao revisar o cálculo, confirmei que `n≈238` e `n≈316` são os resultados sem correção de continuidade. O NIST/SEMATECH relata a correção `n = n′ + 1/δ` como recomendação de Fleiss, Levin e Paik; com `δ=0,05`, isso soma 20 e produz `n≈258` e `n≈336`. A primeira versão mencionava que a correção altera o cálculo, mas não identificava os valores corrigidos nem rotulava os originais como não corrigidos. Atualizei HTML, especificação e rastreabilidade para expor as duas variantes. Conferi em CPython 3.14 com os quantis arredondados apresentados (`zα/2=1,96`, `zβ=0,84`): sem correção 237,82/315,37; com correção 257,82/335,37; arredondamento para cima: 238/316 e 258/336. Esta execução passa a autoria do complemento; revisão independente pendente. Nenhum AT ou gate foi promovido.

**Checks após a correção:** `python3 tools/check_course.py` → 109 documentos, zero erros estruturais/links; `python3 tools/validate_backlog.py` → 699 tarefas, zero erros; `git diff --check -- modulos/M06-evals-observabilidade/M06.html docs/especificacoes/M06-ESPECIFICACAO.md modulos/M06-evals-observabilidade/RASTREABILIDADE.md docs/planejamento-v4/evidencias/FIX-05.md` → exit 0. Nenhum laboratório foi alterado ou executado.

## Revisão independente — 26/09/2026

**RUN revisor:** `01a0dd74-b016-7c80-af17-c3fb2528c094` · **Configuração:** `gpt-6-luna / high`, origem `automation.toml`.

**Resultado:** AJUSTES_NECESSARIOS com correção feita nesta execução; FIX-05 retorna a AGUARDA_REVISAO para revisão por outro RUN. A fórmula e os números estão corretos, mas a notação da correção de continuidade estava invertida em relação à fonte citada: o NIST denomina `N′` o tamanho calculado sem correção e `N = N′ + 1/δ` o tamanho corrigido. HTML, especificação e rastreabilidade agora identificam a convenção da fonte. A fórmula publicada pelo NIST e a orientação de continuidade foram consultadas diretamente em 26/09/2026. CPython 3.14 reproduziu os valores sem correção 237,82/315,37 e corrigidos 257,82/335,37 (`δ=0,05`); os arredondamentos para cima são 238/316 e 258/336. Wilson, escopo dos controles, caso de borda, limites, rubrica e fontes foram revisados. Nenhum AT ou gate foi promovido; revisão independente desta correção permanece pendente.

Verificações após a correção, no diretório raiz:

```text
python3 tools/check_course.py
Checked 109 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.
No lab execution, external-source verification or visual certification performed.

python3 tools/validate_backlog.py
699 tasks: 532 core + 167 optional ML; 26 units / 200 planned blocks; 0 errors.
Planning validation only: no source, lab, learning outcome or release certified.

git diff --check -- modulos/M06-evals-observabilidade/M06.html docs/especificacoes/M06-ESPECIFICACAO.md modulos/M06-evals-observabilidade/RASTREABILIDADE.md docs/planejamento-v4/evidencias/FIX-05.md docs/STATUS-IMPLEMENTACAO-CURSO.md
exit 0
```

## Tentativa de revisão independente — 26/09/2026

**RUN revisor:** `01a0dc04-f306-7f91-b0a4-1c24dcda5426` · **Configuração:** `gpt-6-luna / high`, origem `automation.toml`.

A revisão dos artefatos e da fonte primária encontrou uma imprecisão de atribuição: o §7.2.4.2 do NIST/SEMATECH apresenta a correção de continuidade como recomendação de Fleiss, Levin e Paik. HTML, especificação e rastreabilidade chamavam-na de recomendação do próprio NIST. A redação foi corrigida nos três arquivos e no registro histórico deste relatório. A checagem oficial ao vivo confirmou a formulação do handbook; CPython 3.14.7 reproduziu `237,82/315,37` sem correção e `257,82/335,37` com correção, arredondados para `238/316` e `258/336`. Como este RUN alterou os artefatos durante a revisão, passa a ser autor desta correção; FIX-05 retorna a `AGUARDA_REVISAO` e precisa de outro RUN para conclusão. Nenhum AT ou gate foi promovido.

## Revisão independente — 26/09/2026

**RUN revisor:** `01a0de29-ee55-7dd2-a199-a2126b1c1b10` · **Configuração:** `gpt-6-luna / high`, origem `automation.toml`.

**Resultado:** REVISADO. Li o B01 completo na região alterada, P7, a especificação, a rastreabilidade e as evidências das correções anteriores. Os três controles negativos foram tratados: 50/200 casos não são tratados como tamanhos suficientes sem taxa de base/efeito/α/poder; não rejeitar diferença não é apresentado como equivalência; e comparações nos mesmos casos preservam o pareamento, enquanto a conta de planejamento é explicitamente para uma proporção independente. O caso 12/15→13/15 está marcado como borda e corretamente pede decisão inconclusiva se faltam desenho e discordâncias.

Consultei diretamente as seções atuais do NIST/SEMATECH: Wilson (§7.2.4.1), planejamento (§7.2.4.2) e hipóteses (§7.1.3). A fórmula, a notação `N′`/`N = N′ + 1/δ`, os valores corrigidos e a atribuição a Fleiss, Levin e Paik conferem. Reproduzi em Python 3.9.6 as contas de amostra `237,82/315,37` e `257,82/335,37` (arredondadas para `238/316` e `258/336`); os Wilson de 45/50 e 180/200 também foram reproduzidos e conferem. McNemar é descrito como opção para proporções binárias pareadas, sem universalização.

Rubrica revisora (0 ausente, 1 parcial, 2 suficiente): contexto/pré-requisitos 2; mecanismo 2; exemplo trabalhado 2; decisão/limites 2; falha/diagnóstico 2; transferência 2; fontes/evidência 2; navegabilidade 2. Evidência: conceitos e símbolos são definidos no B01, as fórmulas e números são reproduzíveis, P7 pede desenho/contagens/efeito e próxima evidência, e o texto liga cada claim estatístico às fontes primárias. Limite: esta revisão editorial não executa o laboratório, não observa aluno, não certifica qualidade visual e não promove AT ou gate. Validadores reais nesta execução: `python3 tools/validate_backlog.py` → 699 tarefas/0 erros; `python3 tools/check_course.py` → 114 documentos/0 erros estruturais ou links; `git diff --check` focal → exit 0. FIX-05 fica REVISADO, sem promoção de gate.
