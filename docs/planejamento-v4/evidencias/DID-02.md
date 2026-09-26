# DID-02 — pontes matemáticas internas ao principal

**Estado:** REVISADO
**Sessão de autoria:** 01a0dc04-f306-7f91-b0a4-1c24dcda5426
**Sessão de revisão:** 01a0de17-9e64-7661-93f3-dba46b3a29d7
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador
**Data:** 26/09/2026
**Trilha:** principal · **Escopo:** referência transversal e especificações S de M05/M06/M11
**ATs/gates:** nenhum AT ou gate promovido.

## Revisão independente — 26/09/2026

Conferi o contrato e seus deep links contra os trechos de M05 B01, M06 B01, M11 B01 e o companheiro B02; as contas ilustrativas e os limites registrados correspondem ao conteúdo em escopo. As especificações S de M05/M06/M11 apontam para a seção correta da ponte e declaram ML01/ML05 opcionais. Controle negativo executado nesta revisão: `rg -n 'ML01|ML05'` nos três HTMLs principais não encontrou dependências nem links (código de saída 1, resultado esperado). O controle positivo foi coberto pela execução atual do checker, que resolveu as referências estruturais.

Ambiente desta revisão: `python3 --version` → Python 3.9.6. Validações focais executadas da raiz do repositório: `python3 tools/check_course.py` → 112 documentos, zero erros estruturais/links e 14 referências legadas para revisão contextual; `python3 tools/validate_backlog.py` → 699 tarefas e zero erros. São validadores documentais, não prova de laboratório, compreensão de leitor, QA visual ou gates. O estado REVISADO cobre somente DID-02 e não promove AT/gate.

## Baseline focal

`docs/planejamento-v4/pontes-principal.md` não existia. As especificações S de M05, M06 e M11 não possuíam referência transversal para suas bases matemáticas. Busca focal em suas especificações, rastreabilidades e HTMLs não encontrou dependência textual de ML01/ML05; a execução não encontrou links para páginas ML ausentes. O M05 B01 já apresenta a amostragem sobre distribuição de tokens; o M06 B01 tem definições, fórmulas e contas de proporção/incerteza; o M11 B01 define vetores/tensores, logits e softmax e aponta para B02 no HTML companheiro.

## Entregas

- Criado `docs/planejamento-v4/pontes-principal.md` como contrato de inserção: ponto de uso, seção dona, deep link estável, definição mínima, exemplo numérico pequeno, limites e aprofundamento opcional.
- Inserida referência à seção específica da ponte em `docs/especificacoes/M05-ESPECIFICACAO.md`, `M06-ESPECIFICACAO.md` e `M11-ESPECIFICACAO.md`.
- Distribuição categórica usa o exemplo ilustrativo `0,7 + 0,2 + 0,1 = 1,0`; o passo de `top_p` mostra massa acumulada de 0,8. Para gradiente, `L(w)=(w−3)²`, `w=1`, `dL/dw=−4` e `η=0,1` produz um passo didático `w=1,4`. Não são resultados de modelo ou laboratório.
- M06 reutiliza suas contas vigentes `45/50` e `180/200`, sem duplicá-las ou redefini-las.
- Nenhum HTML principal foi alterado. O mapa referencia pontos existentes sem inserir dependência ou URL de HTML inexistente do apêndice. ML01/ML05 continuam aprofundamentos opcionais.

## Verificações e limites

Ambiente: CPython 3.14.7; cwd: raiz do repositório.

```text
/Users/denisson/.local/bin/python3.14 tools/check_course.py
Checked 111 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.
No lab execution, external-source verification or visual certification performed.

/Users/denisson/.local/bin/python3.14 tools/validate_backlog.py
699 tasks: 532 core + 167 optional ML; 26 units / 200 planned blocks; 0 errors.
Planning validation only: no source, lab, learning outcome or release certified.
```

A primeira execução do checker apontou uma âncora ausente em M06 porque o slug conserva o acento de “proporções”; a referência foi corrigida para o identificador real e a reexecução passou com zero erros estruturais/links. O relatório ainda não estava na árvore quando a saída acima foi capturada; a validação final após incluí-lo será registrada abaixo.

Controle negativo: `rg -n 'ML01|ML05'` nos três HTMLs principais não encontrou ocorrências (exit 1); não há requisito ou link a módulo opcional. Controle positivo: o checker resolveu os deep links M05 B01, M06 B01, M11 B01 e M11 companheiro B02. Casos de borda: o exemplo M05 soma probabilidades a 1; o exemplo de gradiente explicita o sinal negativo e o passo para `1,4`.

Não foi necessária consulta externa para aritmética elementar; as fontes e versões de APIs/produtos não foram alteradas. Os exemplos permanecem marcados como didáticos. Este cartão verifica o mapa e a integração das especificações; não executa os laboratórios, não valida compreensão com leitor e não certifica G1–G6.

## Verificação final após incluir este relatório

```text
/Users/denisson/.local/bin/python3.14 tools/check_course.py
Checked 112 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.
No lab execution, external-source verification or visual certification performed.

/Users/denisson/.local/bin/python3.14 tools/validate_backlog.py
699 tasks: 532 core + 167 optional ML; 26 units / 200 planned blocks; 0 errors.
Planning validation only: no source, lab, learning outcome or release certified.
```

## Rubrica editorial aplicada (0 ausente, 1 parcial, 2 suficiente)

| Critério | Nota | Evidência e limite |
|---|---:|---|
| Contexto/pré-requisitos | 2 | Cada ponte nomeia quando a matemática é necessária e mantém ML01/ML05 opcionais. |
| Mecanismo | 2 | Soma de distribuição, massa acumulada, proporção e passo de gradiente são mostrados com símbolos. |
| Exemplo trabalhado | 2 | Exemplo numérico categórico, contas M06 reaproveitadas e derivada/passos com `w`. |
| Decisão/limites | 2 | Incerteza não é equivalência; amostragem não é argmax; um passo não garante mínimo/globalização. |
| Falha/diagnóstico | 2 | Controles detectam dependência acidental de apêndice e links profundos inexistentes; limites de amostra e gradiente estão explícitos. |
| Transferência | 1 | Mapa permite localizar os pontos no principal, mas nenhum leitor foi observado nesta tarefa. |
| Fontes/evidência | 2 | Cálculos rotulados como didáticos; saídas reais do checker/backlog registradas sem alegar execução de módulo. |
| Navegabilidade | 2 | Links profundos foram conferidos pelo checker após corrigir o slug acentuado. |

Nenhum AT/gate foi promovido; `PROGRESSO.md` foi preservado.
