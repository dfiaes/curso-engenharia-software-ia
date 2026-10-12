---
id: SPEC-001
status: accepted
intent: INT-001
---

# Spec: exportar extrato

## Requisitos

- R1: o endpoint devolve CSV com data, descrição e valor das transações do período pedido.
- R2: períodos acima de 12 meses são recusados com erro 422.
- R3: um cliente nunca baixa o extrato de outro titular.

## Critérios de aceite

- AC1 (R1): dado um período válido, o CSV tem cabeçalho e uma linha por transação.
- AC2 (R2): dado um período de 13 meses, a resposta é 422 e nenhum arquivo é gerado.
- AC3 (R3): dado o token do cliente A e a conta do cliente B, a resposta é 403.

## Políticas aplicadas

- Segurança: autorização por titular (skill de segurança v3).

## Fora de escopo

Exportar em PDF.
