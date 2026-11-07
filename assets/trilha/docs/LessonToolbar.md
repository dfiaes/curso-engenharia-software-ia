# LessonToolbar

Barra fixa no topo da aula, em material translúcido (`material-bar` com desfoque): voltar à esquerda, etapas da aula com progresso no centro, dica e "Continuar →" à direita.

**O consumidor fornece:** `steps` (strings ou `{label, progress}`), `current` (índice da etapa aberta; as anteriores ficam cheias), `onStep(i)` para permitir voltar a uma etapa, `onBack`, `hint` (o que falta para continuar; some em telas estreitas), `canContinue`, `onContinue`, `continueLabel`, ou `action` para trocar o botão inteiro.

**Faça:** mantenha o "Continuar" desabilitado até a etapa ser concluída, e explique por quê no `hint`.
