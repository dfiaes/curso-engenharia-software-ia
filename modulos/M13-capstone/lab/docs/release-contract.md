# Release contract — Cartógrafo (M13 B2/B1, Tier 1 épico 1/4)

**Congelado em:** 20/09/2026 · **Base:** `docs/especificacoes/M13-ESPECIFICACAO.md` v1.0 (§§1–5)

## Persona e problema

Persona: engenheira responsável por assumir manutenção de uma base legada que não escreveu.
Problema: o custo de entender estrutura, dependências e risco antes do primeiro incidente ou
mudança. Três jornadas críticas: (1) ingestão autorizada de um snapshot → mapa estrutural;
(2) pergunta com resposta citando arquivo/linha ou abstenção; (3) relatório de risco com
proveniência. Não-objetivos: refatoração automática, suporte universal a linguagens,
promessas de precisão percentual antes do piloto.

## Claims e métodos de medição (nenhuma claim sem medição)

| # | Claim planejada | Método de medição | Fonte da evidência |
|---|---|---|---|
| C1 | Setup do baseline em clone limpo | tempo e passos do fluxo `uv sync`→`pytest`, registrado em evidence | B02 |
| C2 | Ingestão não duplica snapshot em cancel/retry/crash | testes de idempotência + hash do snapshot | B03 |
| C3 | 2 linguagens parseadas com 100% do corpus contratual | corpus dourado + divergências medidas | B04 |
| C4 | Erros de parse são medidos e não silenciados | fixtures inválidas com erros esperados | B04 |
| C5 | Migrations fazem forward e rollback íntegros | runner SQLite + verificação de esquema | B05 |
| C6 | Isolamento por tenant no data plane local | consultas escopadas + teste cruzado A/B | B05 |

## Orçamento preliminar (Tier 1)

| Item | Limite | Observação |
|---|---|---|
| Custo de infra local | R$ 0 | SQLite/filesystem; sem serviços pagos |
| Latência de ingestão do corpus de teste | sem SLO formal antes do B16 | medir, não prometer |
| Linguagens suportadas | 2 (python, minilang) | Tree-sitter como adapter futuro |

## Critérios go/no-go deste épico

- GO parcial: blocos 1–5 com gates reais registrados por evidência.
- NO-GO: qualquer `passed=True`, número inventado, erro de parse silenciado
  ou etapa documentada sem comando executável.

## Regra de não-relaxamento silencioso

Meta só muda via edição datada neste arquivo, com motivo; relaxar nos bastidores
inviabiliza a claim e vira item do risk register.
