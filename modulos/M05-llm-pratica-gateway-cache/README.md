# M05 · LLM na prática: contrato, custo, gateway, cache

## Visão geral

Início da segunda transformação do currículo: sair de "usar IA para construir software" e entrar em "construir software que tem IA dentro". A tese do módulo é que chamar o modelo é a parte pequena — o trabalho é o que vem em volta: contrato de saída, custo, resiliência, latência e mensuração. Todos os números de preço e detalhes de API foram conferidos na documentação oficial em **agosto de 2026** e estão datados no texto; o que o módulo ensina de permanente é **como fazer a conta**.

## Conteúdo do módulo

- **Material principal (HTML):** [`M05.html`](M05.html) — abra no navegador
- **Carga:** 7 blocos de 2h (14h)
- **Pré-requisito:** M04 (e o M02 inteiro: asyncio, Pydantic e fronteira de confiança são usados sem re-explicação)

## Estrutura dos blocos

1. **Bloco 1:** O contrato da chamada — token como unidade de custo/tempo/limite (PT custa ~20% mais que EN); janela e context rot; amostragem; por que `temperature=0` não é determinismo e por que a versão do modelo é dependência de produção.
2. **Bloco 2:** Structured output — as três fases históricas; Pydantic como fonte única do JSON Schema (`output_config.format`, fora de beta); o que o schema garante e o que **não** garante (forma ≠ verdade); abstenção como saída válida.
3. **Bloco 3:** Tool calling — o modelo emite JSON, seu código executa; loop completo em código com orçamento de passos, validação Pydantic, erro acionável e sandbox de caminho; design de ferramenta como API pública.
4. **Bloco 4:** Streaming e latência — TTFT/TPOT/total; SSE ponta a ponta em FastAPI com métricas; os quatro assassinos (buffering, erro pós-200, desconexão, JSON parcial); critério streaming × 202+job; filas, backpressure e Little's Law.
5. **Bloco 5:** Caching — teoria clássica reciclada; prompt caching com as regras reais (prefixo `tools→system→messages`, breakpoint no último bloco estável, mínimos por modelo, TTL, write 1,25x / read 0,1x); as quatro camadas de cache; cache de embeddings em Postgres.
6. **Bloco 6:** AI Gateway — LiteLLM com aliases semânticos, fallback que degrada, `context_window_fallbacks`, circuit breaker; resiliência com LLM (retry custa dinheiro, jitter, bulkhead); adaptador com telemetria incluindo `modelo_usado`.
7. **Bloco 7:** FinOps — a fórmula do custo, tabela de preços datada, as sete alavancas em ordem de retorno (com destaque para "isto precisa mesmo de um LLM?"); mini-projeto `services/llm/` com tabela `llm_calls` e circuit breaker de custo por tenant.

## Entregáveis

- `capstone/backend/src/app/services/llm/`: gateway com aliases e fallback, prompts versionados com prefixo cacheado, schemas Pydantic, `cost.py`.
- Tabela `llm_calls` + circuit breaker de custo por tenant + `GET /analises/{id}/custo`.
- Medições: TTFT/TPOT, economia real do prompt caching, comparação `rapido` × `raciocinio` (custo/latência/qualidade).
- ADR-0002 sobre o gateway; conta de guardanapo do custo mensal validada contra execução real, com o erro percentual explicado.

## Fundamentos reciclados neste módulo

Teoria de cache completa (localidade, cache-aside/write-through, invalidação, LRU/LFU, hit rate × custo do miss) · filas, backpressure e produtor-consumidor · Little's Law aplicada a workers de LLM · resiliência (timeout/retry/backoff+jitter/circuit breaker/bulkhead) com as diferenças que o LLM impõe · design de API pública aplicado a ferramentas · fronteira de confiança (saída de modelo é dado não-confiável).
