# M02A — lote B04 · contratos e interoperabilidade

**Data:** 21/08/2026 · **Escopo:** B04, schemas v1/v2, corpus golden e laboratório do recorte B01–B04.

## Mudanças aplicadas

- contrato sintático, semântico e operacional foi separado com exemplos e limites;
- JSON Schema, OpenAPI, AsyncAPI, RFC 9457 e policy de domínio foram delimitados por responsabilidade;
- a compatibilidade passou a ser explicada como relação dirigida entre mudança e consumidor;
- v1/v2, decimal, timezone, enum, UTF-8 e reason code foram ligados ao corpus já executável;
- o laboratório foi movido após B04 e ganhou a execução explícita de `test_contracts.py`.

## Evidência e limite

O corpus Python cobre AT-006–009 e AT-011 no slice. AT-010 continua pendente:
não existe ainda runtime .NET nem corpus diferencial para provar reason codes e
serialização canônica entre os dois runtimes. G2 continua parcial; G3–G6 não
foram promovidos.
