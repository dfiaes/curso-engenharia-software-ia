# Prompt: corrigir bug (reproduzir antes de consertar)

```
Ticket de bug: PROJ-456 (sintoma, ambiente, passos, logs).
Branch: fix/PROJ-456-<slug>. Regra: NÃO altere testes existentes; apenas ADICIONE testes.

1. Reproduza: escreva o teste mais baixo possível que FALHA pelo motivo descrito no ticket.
   Mostre a saída da falha. Se não conseguir reproduzir, pare e diga o que falta (dados, versão, config).
2. Diagnostique: liste 2-3 hipóteses de causa raiz, a evidência a favor/contra cada uma
   (código, git log/blame, logs). Escolha a causa raiz; não trate só o sintoma.
3. Corrija com a menor mudança que resolve a causa. Rode make check.
4. Pense no entorno: o mesmo defeito pode existir em outro lugar? (busque o padrão). Liste, não corrija sem pedir.
5. Documente: nota no PR com causa raiz, correção, risco e como validar em cert.
   Se o bug revelou regra implícita, proponha ajuste em docs/specs ou AGENTS.md.
6. Para produção: descreva o plano de rollback e se precisa de hotfix fora do ciclo normal.
```
