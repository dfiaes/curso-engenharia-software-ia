# ADR 0001 — Postgres único para vetor e relacional

- **Data:** 2026-09-14 · **Módulo:** M04 · **Status:** aceita

## Contexto

A demonstração precisa de busca por vetor e de consultas relacionais com
orçamento de operação de uma peça só.

## Opções consideradas

### A — banco vetorial dedicado + Postgres
- A favor: melhor da categoria em cada tarefa.
- Contra: duas peças para operar e instalar.

### B — só Postgres relacional, sem vetor
- A favor: uma peça só.
- Contra: busca semântica vira LIKE, que não responde.

### C — Postgres + pgvector (escolhida)
- A favor: uma peça; transação única.
- Contra: teto de escala menor que banco dedicado.

## Decisão

Escolhi **C** porque o gargalo aqui é custo operacional, não escala de
vetores. Uma peça a menos vale mais que performance de busca.

## Consequências

**Ganhei:** operação única; instalação trivial.
**Perdi / aceitei como custo:** escala menor; extensões limitam o provedor.
**O que me faria mudar de ideia:** passar de volume que o índice IVFFlat
não atende em latência aceitável.
