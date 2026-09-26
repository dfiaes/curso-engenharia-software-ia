# M13 · Capstone Cartógrafo

> **EM PRODUÇÃO:** épico 1/4 (blocos 1–5) regenerado em 20/09/2026 com laboratório executável em `lab/` e evidências em `evidence/m13/B01..B05/`. Blocos 6–20 permanecem pendentes. Não usar até conclusão de G1–G6.

## Resultado esperado

O M13 integra os módulos anteriores em um produto Python 3.14: um serviço multi-tenant que ingere snapshots autorizados de código, extrai estrutura deterministicamente, cria retrieval e grafo, responde com evidências, conduz workflows controlados e produz documentação útil.

- [Especificação aprovada](../../docs/especificacoes/M13-ESPECIFICACAO.md)
- [Rastreabilidade da regeneração](RASTREABILIDADE.md)
- `M13.html`: blocos 1–5 regenerados (épico 1/4)

O produto é agnóstico de fornecedor. Modelos, embeddings, billing, storage e deployment usam portas e fakes determinísticos. SDKs proprietários permanecem dentro de adapters opcionais.

## Carga e sequência

- 20 blocos de 2h, total de 40h;
- cada bloco produz evidência em `capstone/evidence/m13/BXX/`;
- cada saída recebe `PASS`, `FAIL` ou `BLOCKED` derivado de comando/artefato;
- a acceptance suite possui 30 cenários de produto;
- `NO-GO` fundamentado é um resultado válido; lançar com bloqueador não é.

## Estado atual

- G0 aprovado na especificação;
- épicos 1–4 concluídos: B01–B20 com gates reais executados (uv, ruff, mypy strict, pytest — 125 testes, 0 falhas);
- B18 fecha com veredito GO (PRR 10/10 evidenciado, game day com injeção real);
- B19 (piloto humano) BLOCKED estrutural e honesto; kit de recrutamento e scorecard prontos;
- trilhas Docker Compose, Tree-sitter, Postgres/RLS, adapters LLM, Stripe, Kubernetes/cloud registradas como BLOCKED com causa.
