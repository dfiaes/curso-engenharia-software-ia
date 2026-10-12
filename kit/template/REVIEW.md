# REVIEW.md — como revisar (humano ou agente revisor)

<!-- O revisor deve ser uma sessão/agente SEPARADO de quem escreveu. Quem escreveu não aprova. -->

## Ordem de leitura
1. Ticket e `docs/specs/` do ticket: o PR cumpre os critérios? Algum critério ficou sem teste?
2. Testes: falham sem a mudança? Cobrem borda e erro, ou só o caminho feliz?
3. Código: corretude, concorrência, erros engolidos, nulos, dinheiro/datas/fuso, SQL e injeção.
4. Segurança: segredos, autorização por recurso, entrada não confiável, logs com dado pessoal.
5. Operação: migração reversível? Feature flag? Observabilidade (log/métrica)? Rollback descrito?
6. Documentação: o mesmo PR atualizou spec/runbook/README/CHANGELOG? ADR se houve decisão cara?
7. Escopo: há mudança fora do ticket? Peça para separar.

## Formato do parecer
Liste achados como `[bloqueante]`, `[importante]` ou `[sugestão]`, com arquivo:linha e o motivo.
Termine com: APROVAR, PEDIR MUDANÇAS ou BLOQUEAR, e uma frase de justificativa.

## Não é achado
Estilo que o linter já cobre; preferência pessoal sem consequência.
