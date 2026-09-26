---
titulo: Arquitetura da demonstração
documenta: demo_src/billing
revisado_em: 2026-09-14
---

# Arquitetura

Texto de contexto antes do diagrama: cobrança em centavos via fila.
Os centavos passam por demo_src/payments antes do ledger.

```mermaid
flowchart LR
    A[API] --> B[Fila]
    B --> C[Worker]
```
