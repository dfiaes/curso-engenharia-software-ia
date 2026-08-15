# M13 · Capstone Cartógrafo

> **EM PRODUÇÃO / BLOQUEADO PARA ESTUDO:** o HTML existente possui somente cinco seções resumidas e será substituído por vinte blocos executáveis. Não use `M13.html` como referência até G1–G6.

## Resultado esperado

O M13 integra os módulos anteriores em um produto Python 3.14: um serviço multi-tenant que ingere snapshots autorizados de código, extrai estrutura deterministicamente, cria retrieval e grafo, responde com evidências, conduz workflows controlados e produz documentação útil.

- [Especificação aprovada](../../docs/especificacoes/M13-ESPECIFICACAO.md)
- [Rastreabilidade da regeneração](RASTREABILIDADE.md)
- `M13.html`: artefato antigo bloqueado, ainda não regenerado

O produto é agnóstico de fornecedor. Modelos, embeddings, billing, storage e deployment usam portas e fakes determinísticos. SDKs proprietários permanecem dentro de adapters opcionais.

## Carga e sequência

- 20 blocos de 2h, total de 40h;
- cada bloco produz evidência em `capstone/evidence/m13/BXX/`;
- cada saída recebe `PASS`, `FAIL` ou `BLOCKED` derivado de comando/artefato;
- a acceptance suite possui 30 cenários de produto;
- `NO-GO` fundamentado é um resultado válido; lançar com bloqueador não é.

## Estado atual

- G0 aprovado na especificação;
- baseline antigo medido: 1.149 palavras, 5 seções, 0 blocos de código e 0 resultados observáveis;
- rastreabilidade e lotes de produção criados;
- regeneração do HTML e construção do Capstone ainda pendentes.

## Próximo lote

Produzir os blocos 1–2 e o scaffold do Capstone: release contract, matriz requisito→teste→evidência, risk register, workspace Python 3.14, configuração tipada, lockfile e gates de qualidade. Nenhuma métrica de marketing será preenchida antes das execuções e do piloto.
