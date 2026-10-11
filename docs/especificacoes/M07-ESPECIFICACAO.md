# M07 — especificação de escopo e evidência

> Referência de escopo da versão anterior do módulo. A sequência e o estado atuais estão em [CURRICULO.md](../../CURRICULO.md) e [STATUS.md](../../STATUS.md).

**Versão:** 1.0 · **Data-base:** 14/09/2026 · **Estado:** G0 aprovado; G1 em produção

## 1. Decisão curricular

O M07 ensina RAG como pipeline de 18 etapas, não como "embedar e
buscar": chunking que preserva sentido, armazenamento com metadados,
busca híbrida com fusão, reranking, filtro de permissão antes da
relevância e abstenção calibrada. Similaridade é candidato barato, nunca
veredito — a arquitetura é funil.

O corpus do laboratório é código Python com origem declarada (autoria do
curso, licença MIT no fixture) — sem pré-requisito de outra linguagem e
sem conta, rede ou banco externo. Embeddings e rerank usam falsos
determinísticos locais; pgvector/HNSW e modelos reais são retratados na
teoria com SQL de referência, e a execução contra PostgreSQL real fica
marcada como bloqueada sem Docker. A integração no Capstone
(`services/retrieval/`) só ocorre após spec própria.

## 2. Resultado, limites e integração

| Aspecto | Definição |
|---|---|
| Carga | oito blocos de duas horas, total de 16 h |
| Entrada | M02 (Python/AST), M03 (PostgreSQL), M05 (custo/cache), M06 (evals) |
| Saída | pipeline local com chunking, híbrida, rerank, ACL, abstenção e eval |
| Peça do capstone | camada `services/retrieval/`; integração só após spec própria |
| Não cobre | grafos (M10), agentes (M08), produção multi-tenant (M12) |
| Evidência mínima | comandos, versões e saída executada; recall só com corpus e queries declarados |

## 3. Arquitetura do laboratório

```text
corpus Python (fixture) ──► chunking estrutural (AST) ──► metadados
        │                            │
        ▼                            ▼
 fake embeddings ──► store ──► ACL primeiro ──► híbrida (léxico+vetor, RRF)
                                                     │
                                                     ▼
                                              rerank falso ──► limiar ──► contexto/abstenção
                                                     │
                                                     ▼
                                              eval (recall/MRR/citação) + ablação
```

A referência fica em `modulos/M07-rag-de-verdade/lab/`. O roteiro
`Laboratório guiado M07`, no final do HTML, cria cópia de trabalho em
diretório temporário possuído pelo laboratório.

## 4. Blocos, competências e evidência

| Bloco | Competências observáveis | Evidência planejada |
|---|---|---|
| B01 · embeddings | limites, métricas, migração | sondas de negação/identificador |
| B02 · chunking | estratégias, metadados, id estável | chunker AST + fixo comparado |
| B03 · pgvector | schema, HNSW, over-filtering | SQL de referência; execução PG bloqueada |
| B04 · híbrida | léxico, RRF, funil | tabela léxico×vetor×híbrido |
| B05 · rerank | cross-encoder, limiar, routing | ganho medido + limiar calibrado |
| B06 · ACL | ordem do pipeline, defesa, abstenção | leak test + abstenção |
| B07 · pipeline+eval | 18 etapas, métricas, ablação | tabela de ablação |
| B08 · mini-projeto | pipeline completo, 3 perguntas | corpus + `tres-perguntas` |

## 5. Cenários de aceitação

| ID | Oráculo e caso relevante | Bloco |
|---|---|---|
| M07-AT-001 | sonda de negação: embedding falso ordena sem distinguir (limite) | B01 |
| M07-AT-002 | identificador exato perde no vetorial e vence no léxico | B01/B04 |
| M07-AT-003 | chunker estrutural não corta unidade sintática; fixo corta | B02 |
| M07-AT-004 | `id_estavel` sobrevive a mudança de linha | B02 |
| M07-AT-005 | schema de referência com metadados, índices e modelo gravado | B03 |
| M07-AT-006 | comparar RRF e métodos isolados por tipo de query; registrar ganhos, empates e perdas | B04 |
| M07-AT-007 | medir delta de recall@5 do rerank nos mesmos candidatos; explicar ganho nulo ou negativo | B05 |
| M07-AT-008 | limiar calibrado separa bons/ruins; cópia de blog reprovaria | B05 |
| M07-AT-009 | roteamento determinístico classifica sem LLM | B05 |
| M07-AT-010 | tenant sem filtro obrigatório é erro de construção | B06 |
| M07-AT-011 | cross-tenant retorna vazio; verificação de saída acusa | B06 |
| M07-AT-012 | abaixo do limiar abstém com motivo; acima responde | B06 |
| M07-AT-013 | recall@k/MRR/citação calculados deterministicamente | B07 |
| M07-AT-014 | ablação mostra custo de cada etapa omitida | B07 |
| M07-AT-015 | modelo de embedding distinto invalida comparação (migração) | B01 |
| M07-AT-016 | 3 perguntas estruturais marcadas `esperado_falhar` com diagnóstico | B08 |

## 6. Fontes e versões

| ID | Fonte e uso | Tipo | Risco |
|---|---|---|---|
| SRC-M07-01 | [Anthropic — contextual retrieval](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — chunk contextualizado | fornecedor | alto |
| SRC-M07-02 | [pgvector docs](https://github.com/pgvector/pgvector) — tipos, operadores, HNSW | documentação oficial | alto |
| SRC-M07-03 | [PostgreSQL — full text search](https://www.postgresql.org/docs/current/textsearch.html) — tsvector/ranking | documentação oficial | médio |
| SRC-M07-04 | [Cormack et al. — RRF (SIGIR 2009)](https://doi.org/10.1145/1571941.1572114) — fusão por posição | científica | baixo |
| SRC-M07-05 | [Python — ast](https://docs.python.org/3/library/ast.html) — chunking estrutural | normativa | baixo |

Consultadas em 14/09/2026. Versões de modelo, dimensões, preços e
capacidades de produto: revalidar em até 90 dias.

## 7. Panorama de prática vigente

pgvector, Mermaid/C4 e arquivos de instrução de repositório são prática
observável — sustentam decisões didáticas sem definir fundamentos.

## 8. Gates e decisão G0

| Gate | Estado | Critério |
|---|---|---|
| G0 · escopo | **APROVADO** | oito blocos, 16 cenários, fontes classificadas, corpus Python e limites definidos |
| G1–G6 | EM PRODUÇÃO/PENDENTE | HTML legado em revisão; lab e avaliação em construção neste ciclo |

**Decisão de G0:** aprovada em 14/09/2026 pelo orquestrador. Define o
trabalho; não certifica HTML legado ou lab inexistente.
