# Runbook — cobrança duplicada

## Sintoma: cliente cobrado duas vezes
1. Buscar o `idempotency_key` em `demo_src/billing/ledger.py`.
2. Se a chave repetiu com efeito duplicado, reembolsar e registrar.
3. Ver `demo_docs/adr/0001-banco-unico.md` para o contexto da decisão.
