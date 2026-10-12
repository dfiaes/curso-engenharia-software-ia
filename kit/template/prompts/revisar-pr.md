# Prompt: revisar PR (agente revisor, sessão SEPARADA de quem escreveu)

```
Você é o revisor. NÃO escreveu este código e não deve corrigi-lo, apenas avaliar.
Siga REVIEW.md. Entradas: ticket PROJ-123, docs/specs/PROJ-123-*.md e git diff origin/main...HEAD.

1. Verifique critério por critério da spec: coberto por teste? O teste falharia sem a mudança?
2. Rode make check e relate o resultado. Se algum teste parecer frágil, explique.
3. Procure ativamente: bordas, erros engolidos, concorrência, dinheiro/datas, SQL/injeção,
   autorização, logs com dado pessoal, migração irreversível, dependência nova.
4. Confira documentação e CHANGELOG no mesmo PR, e ADR se houve decisão cara.
5. Entregue achados como [bloqueante] / [importante] / [sugestão] com arquivo:linha,
   e o veredito APROVAR / PEDIR MUDANÇAS / BLOQUEAR.
Se algo estiver fora do que você pode verificar, diga explicitamente.
```
