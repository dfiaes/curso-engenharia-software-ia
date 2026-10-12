---
description: Corrigir bug reproduzindo primeiro com um teste que falha
argument-hint: PROJ-456
---
Ticket de bug: $ARGUMENTS. Branch fix/<TICKET>-<slug>. Regra: NÃO altere testes existentes; apenas ADICIONE testes.

1. Reproduza: o teste mais baixo possível que FALHA pelo motivo do ticket. Mostre a saída da falha. Se não reproduzir, pare e diga o que falta.
2. Diagnostique: 2 a 3 hipóteses com evidência a favor e contra (código, git log, logs). Escolha a causa raiz.
3. Corrija com a menor mudança que resolve a causa. Rode `make check` e mostre o teste passando.
4. Procure o mesmo padrão em outros lugares; liste, não corrija sem pedir.
5. Nota para o PR: causa raiz, correção, risco, como validar em cert, rollback.
Detalhes em prompts/corrigir-bug.md.
