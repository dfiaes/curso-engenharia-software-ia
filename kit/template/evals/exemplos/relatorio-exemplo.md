<!-- Saída REAL do exemplo com o agente fake (sem custo). Gerada com:
  python3 evals/run_evals.py --config evals/exemplos/variantes.toml --casos-dir evals/exemplos/casos \
      --variantes modelo-grande,modelo-pequeno --repeticoes 3 --paralelo 4
  python3 evals/run_evals.py --config evals/exemplos/variantes.toml --casos-dir evals/exemplos/casos \
      --variantes modelo-grande --skill-ab corrigir-bug --repeticoes 3 --paralelo 4
Os preços e os modelos são fictícios. O relatório do 1º comando vem primeiro; do 2º, só o resumo e o "Modo skill". -->

# Relatório de evals

- Data: 2026-10-12 17:11:42
- Casos: 8 | repetições (k): 3 | tentativas: 48
- Tolerância de pass^k: 5.0%

## Resumo por variante

| Variante | Modelo | pass@1 médio | pass^k | pass@k | Custo total | Custo/sucesso | Latência p50 | p95 |
|---|---|---|---|---|---|---|---|---|
| modelo-grande | modelo-grande (fake) | 83% | 75% | 100% | US$ 0.3359 | US$ 0.0168 | 0.06s | 0.07s |
| modelo-pequeno | modelo-pequeno (fake) | 62% | 38% | 75% | US$ 0.0356 | US$ 0.0024 | 0.05s | 0.08s |

Legenda: **pass@1 médio** = taxa média de acerto por tentativa; **pass^k** = fração de casos em que TODAS as k tentativas acertaram (confiabilidade); **pass@k** = fração de casos em que ALGUMA tentativa acertou (capacidade); custo/sucesso = custo total / tentativas bem-sucedidas (n/d se faltar uso de tokens ou preço).

## Falhas por motivo

| Variante | Motivo | Ocorrências |
|---|---|---|
| modelo-grande | verificar.comando | 4 |
| modelo-pequeno | verificar.comando | 9 |

## Detalhe por caso (pass^k: tentativas ok/total)

| Caso | modelo-grande | modelo-pequeno |
|---|---|---|
| ano-bissexto | 3/3 | 3/3 |
| dedup-ordem | 3/3 | 3/3 |
| media-vazia | 3/3 | 2/3 |
| mesclar-intervalos | 1/3 | 0/3 |
| ola-mundo | 3/3 | 3/3 |
| paginar | 3/3 | 2/3 |
| parse-duracao | 3/3 | 2/3 |
| slugify | 1/3 | 0/3 |

## Comparação pareada

Regras (fixas, para a decisão ser reprodutível): (1) perda = pass^k(A) - pass^k(B); (2) só se recomenda trocar A por B se a perda for <= tolerância (5.0%) **e** o custo por sucesso de B for menor que o de A; (3) sem custo medido, mantém-se A; (4) o McNemar exato avalia se os casos que mudaram de resultado excedem o acaso (p < 0.05); (5) menos de 20 casos = decisão frágil.

### A = modelo-grande  vs  B = modelo-pequeno

| Caso | A (modelo-grande) | B (modelo-pequeno) |
|---|---|---|
| media-vazia | ok | falha |
| paginar | ok | falha |
| parse-duracao | ok | falha |

- A ok / B falha: 3 | A falha / B ok: 0
- McNemar exato (pass^k por caso): p = 0.2500: diferença não distinguível de ruído com 8 casos.
- **Recomendação:** MANTER modelo-grande: modelo-pequeno perde 37.5% de pass^k, acima da tolerância de 5.0%. Atenção: só 8 casos; com menos de 20 a decisão é frágil.


---

# Execução 2: modo skill (--skill-ab corrigir-bug)

### Resumo por variante

| Variante | Modelo | pass@1 médio | pass^k | pass@k | Custo total | Custo/sucesso | Latência p50 | p95 |
|---|---|---|---|---|---|---|---|---|
| modelo-grande+com-skill | modelo-grande (fake) | 79% | 75% | 88% | US$ 0.3359 | US$ 0.0177 | 0.07s | 0.07s |
| modelo-grande+sem-skill | modelo-grande (fake) | 83% | 75% | 100% | US$ 0.3359 | US$ 0.0168 | 0.06s | 0.08s |

## Modo skill

### Skill `corrigir-bug` (modelo-grande+com-skill vs modelo-grande+sem-skill)

- Ganho de pass^k (com - sem): +0 pontos percentuais
- Acionamento nos casos com `deve_acionar_skill` (24 tentativas): corretos 14, falsos positivos 10, falsos negativos 0
- **Veredito: neutra**: sem ganho além da tolerância: candidata a enxugar (menos texto, menos contexto) ou a aposentar.

