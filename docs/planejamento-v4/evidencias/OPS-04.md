# OPS-04 — QA estrutural com limites honestos

**Estado:** REVISADO
**Sessão de autoria:** 01a0de17-9e64-7661-93f3-dba46b3a29d7
**Sessão de revisão:** 01a0de29-ee55-7dd2-a199-a2126b1c1b10
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador
**Data:** 26/09/2026
**Trilha:** principal · **Escopo:** `tools/check_course.py` e testes focais
**ATs/gates:** nenhum AT ou gate promovido; G6 continua pendente.

## Baseline focal

No início desta execução, `tools/check_course.py` e `tools/test_check_course.py` já existiam no checkout como arquivos não rastreados por Git, sem relatório OPS-04 que identificasse autoria anterior. Preservei o código e acrescentei verificações sobre a implementação presente, sem atribuir autoria/modelo à parte preexistente.

O checker já validava links locais, âncoras Markdown/HTML, IDs duplicados, containers HTML e referências legadas. Sua própria saída declarava que não executa laboratórios, verifica fontes externas ou certifica apresentação visual. Antes desta alteração, a suíte focal tinha 7 testes aprovados; `check_course.py` encontrou 109 documentos, zero erros estruturais/de links e 14 referências/relógios para revisão contextual. `validate_backlog.py` reportou 699 tarefas sem erros.

## Mudanças

- `tools/check_course.py`: SVG não decorativo precisa declarar `role="img"` e um nome acessível via `aria-label`, `aria-labelledby` ou texto em `<title>`. `aria-labelledby` também precisa apontar para IDs existentes no mesmo documento. SVG decorativo pode ser identificado por `aria-hidden="true"`, `role="none"` ou `role="presentation"`.
- A regra só verifica estrutura. Ela não determina se o nome descreve com fidelidade o conteúdo do diagrama, se leitores de tela anunciam o resultado em navegadores reais ou se contraste, foco, reflow, zoom e impressão estão adequados.
- `tools/test_check_course.py`: controles para SVG sem alternativa, nomes por `<title>` e `aria-labelledby`, alvo referenciado ausente e a regressão já coberta de âncora quebrada.
- Nenhum HTML de módulo foi modificado. Busca focal por `<svg` no material encontrou os onze diagramas existentes com `role="img"` e nome ARIA explícito; o M03 usa referências de título/descrição, agora verificadas pelo checker.

## Controles, comandos e resultados

Ambiente: CPython 3.14.7, macOS arm64; cwd: raiz do repositório.

Baseline anterior à mudança:

```text
python3.14 -m unittest discover -s tools -p 'test_check_course.py' -v
Ran 7 tests ... OK

python3.14 tools/check_course.py
Checked 109 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.
No lab execution, external-source verification or visual certification performed.
```

Após a mudança:

```text
python3.14 -m unittest discover -s tools -p 'test_check_course.py' -v
Ran 11 tests ... OK

python3.14 tools/check_course.py
Checked 110 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.
No lab execution, external-source verification or visual certification performed.

python3.14 tools/validate_backlog.py
699 tasks: 532 core + 167 optional ML; 26 units / 200 planned blocks; 0 errors.
Planning validation only: no source, lab, learning outcome or release certified.

git diff --check -- tools/check_course.py tools/test_check_course.py docs/planejamento-v4/evidencias/OPS-04.md docs/STATUS-IMPLEMENTACAO-CURSO.md
exit 0
```

Controles negativos observados na suíte: âncora profunda ausente é erro; SVG com `role="img"` mas sem nome é erro; `aria-labelledby` com alvo ausente é erro. Controle positivo: `<title>` não vazio e referências existentes são aceitos. SVG explicitamente decorativo (`aria-hidden="true"` ou `role="presentation"`) permanece aceito como caso de borda. Controle de limite: o comando real sai verde e imprime que não houve certificação visual; isso não fornece evidência de contraste, teclado ou impressão.

## Roteiro manual de navegador — definido, não executado

1. Servir o repositório localmente (`python3.14 -m http.server 8000` na raiz) e abrir a página por HTTP para que referências relativas funcionem. Registrar navegador e versão usados no futuro resultado.
2. Em viewport desktop de 1280 CSS px, percorrer cada página em escopo. Identificar pares reais de texto/fundo, controles e gráficos; medir contraste conforme WCAG 2.2 SC 1.4.3 e 1.4.11. Uma regra no CSS não prova a cor computada nem o contraste renderizado.
3. Usar somente Tab, Shift+Tab, Enter e teclas direcionais aplicáveis. Registrar ordem, destinos, armadilhas e se cada foco permanece visível e desobstruído (SC 2.1.1, 2.4.7 e 2.4.11). Conferir no navegador se a árvore de acessibilidade anuncia nome que descreve o conteúdo do SVG; presença de atributo não prova equivalência textual.
4. Repetir em 390 CSS px e 320 CSS px, além de zoom de 200% e 400%. Observar perda de informação, sobreposição e rolagem horizontal da página; distinguir qualquer tabela/código bidimensional com rolagem própria e ainda utilizável. A referência normativa para reflow é WCAG 2.2 SC 1.4.10.
5. Abrir impressão/preview e salvar uma cópia temporária fora do checkout. Inspecionar começo, transições e fim: títulos, links, código, tabelas, cortes, sobreposições, cabeçalhos e páginas em branco. Registrar navegador, destino, escala e páginas observadas; CSS `@media print` isolado não é resultado de QA.
6. Repetir para a página alterada por cada cartão editorial; anexar capturas/folhas de contato e achados ao cartão correspondente. Até observação registrada e revisada, G6 permanece pendente.

Fonte primária consultada em 26/09/2026: [W3C, Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) — critérios 1.4.3, 1.4.10, 1.4.11, 2.1.1, 2.4.7 e 2.4.11. A especificação admite combinação de avaliação automática e humana; este checker cobre apenas regras estruturais declaradas acima.

## Rubrica editorial aplicada (0 ausente, 1 parcial, 2 suficiente)

| Critério | Nota | Evidência e limite |
|---|---:|---|
| Contexto/pré-requisitos | 2 | Contrato do checker distingue navegação estrutural de execução e QA visual. |
| Mecanismo | 2 | Parser coleta `role`, nomes ARIA/`title` e referências locais; testes reproduzem as condições. |
| Exemplo trabalhado | 2 | SVG positivo com `title`/referências e três controles negativos exercitados. |
| Decisão/limites | 2 | Decoração pode ser explicitada; nome textual e apresentação real continuam avaliação humana. |
| Falha/diagnóstico | 2 | Mensagens identificam role ausente, nome vazio e IDs inexistentes. |
| Transferência | 1 | Roteiro cobre viewport, teclado, zoom e impressão, mas ainda não foi executado em páginas. |
| Fontes/evidência | 2 | WCAG 2.2 primária e saídas reais de Python 3.14.7 registradas. |
| Navegabilidade | 1 | Links/âncoras passam; foco visual, reflow e impressão permanecem pendentes. |

Sem promoção de gates: checker verde demonstra apenas que as regras estruturais implementadas não encontraram falhas nestes documentos. QA visual, leitor real e certificação G6 continuam pendentes. `PROGRESSO.md` não foi alterado.

## Revisão independente — 26/09/2026

**RUN revisor:** `01a0de17-9e64-7661-93f3-dba46b3a29d7` · **Configuração:** `gpt-6-luna / high`, origem `automation.toml`.

**Resultado:** AJUSTES_NECESSARIOS com correção nesta execução. Reproduzi um falso negativo: um SVG com `aria-labelledby="blank"` apontando para `<span id="blank"> </span>` passava sem erro, embora o nome calculado ficasse vazio. O algoritmo W3C de Accessible Name define o valor de `aria-labelledby` pelo texto computado dos nós referenciados e retorna o resultado somente se não estiver vazio. Acrescentei coleta estrutural do texto contido nos IDs e uma regra que rejeita referências cujo conjunto não fornece texto; isso verifica apenas estrutura, não se o nome descreve o diagrama.

O teste agora cobre alvo ausente, alvo vazio (negativo) e texto aninhado não vazio (positivo), além das alternativas anteriores. Execução desta revisão em Python 3.9.6: `python3 -m unittest discover -s tools -p 'test_check_course.py' -v` → 13 testes OK; `python3 tools/check_course.py` → 112 documentos, zero erros estruturais/links; `python3 tools/validate_backlog.py` → 699 tarefas, zero erros; `git diff --check` focal → exit 0. QA visual e G6 continuam pendentes.

Como alterei o checker e os testes durante a revisão, este RUN passa a ser autor da correção e OPS-04 retorna a AGUARDA_REVISAO para outro RUN. Autoria inicial `01a0dc04-f306-7f91-b0a4-1c24dcda5426`, a rubrica e o roteiro manual permanecem no histórico; nenhum gate foi promovido.

Fonte consultada: [W3C, Accessible Name and Description Computation 1.2, Working Draft de 23/09/2026](https://www.w3.org/TR/accname-1.2/), §§4.1 e 4.3.2. A fonte especifica o cálculo do nome; o checker não reproduz a árvore de acessibilidade do navegador.

## Revisão independente — 26/09/2026

**RUN revisor:** `01a0de29-ee55-7dd2-a199-a2126b1c1b10` · **Configuração:** `gpt-6-luna / high`, origem `automation.toml`.

**Resultado:** REVISADO. Inspecionei o checker, seus 13 testes e o roteiro manual. O controle negativo reproduz o alvo de `aria-labelledby` ausente e vazio; controles positivos aceitam texto aninhado e `<title>`. A condição para SVG decorativo é explícita. A saída e o roteiro deixam claro que contraste, foco, reflow, zoom, árvore de acessibilidade do navegador e impressão exigem observação humana. Confirmei diretamente WCAG 2.2 e Accessible Name and Description Computation 1.2; a última é Working Draft publicada em 23/09/2026, e foi rotulada como tal.

Limite adicional confirmado: o checker só verifica presença de texto não vazio nos nós referenciados; não calcula estilo computado, visibilidade nem toda a árvore de nomes acessíveis. Portanto pode aceitar uma estrutura cujo nome efetivo no browser ainda seja vazio ou inadequado. O roteiro manual exige conferir o nome anunciado por leitor de tela; G6 permanece pendente até observação registrada e revisada.

Execução real desta revisão, CPython 3.14.7/macOS arm64, cwd raiz: `python3 -m unittest discover -s tools -p 'test_check_course.py' -v` → 13 testes OK; `python3 tools/check_course.py` → 114 documentos, 0 erros estruturais/links; `python3 tools/validate_backlog.py` → 699 tarefas, 0 erros; `git diff --check` focal → exit 0. Rubrica revisora: contexto/pré-requisitos 2; mecanismo 2; exemplo trabalhado 2; decisão/limites 2; falha/diagnóstico 2; transferência 1 (roteiro não executado); fontes/evidência 2; navegabilidade 1 (QA visual e manual pendentes). Nenhum AT ou gate foi promovido. OPS-04 fica REVISADO; G6 segue pendente.
