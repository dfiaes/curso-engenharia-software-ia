-- Compara chamadas recentes por confianca.
SELECT
  substring(prompt_hash, 1, 8) AS chamada,
  round(logprob_medio::numeric, 3) AS lp_medio,
  round(exp(-logprob_medio)::numeric, 2) AS ppl,
  tokens_incertos,
  round(100.0 * tokens_incertos
    / nullif(tokens_saida, 0), 1) AS pct_incerto
FROM llm_calls
WHERE criado_em > now() - interval '10 minutes'
ORDER BY logprob_medio ASC;
