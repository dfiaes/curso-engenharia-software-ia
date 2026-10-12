---
id: PLAN-001
status: accepted
spec: SPEC-001
---

# Plano: exportar extrato

## Passos

- S1 (R1, R2): criar o serviço de exportação com validação de período.
- S2 (R3): aplicar a checagem de titularidade no endpoint.

## Riscos

Extratos grandes em memória: gerar em streaming.

## Testes que provam

- R1: teste de contrato do CSV.
- R2: teste de período de 13 meses.
- R3: teste de acesso cruzado entre titulares.
