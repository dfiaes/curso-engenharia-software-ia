# M07 · RAG de verdade

**Fase 2** · Pré-requisito: M06. Estado: [STATUS](../../STATUS.md).

## Visão geral

RAG é o padrão mais usado e o mais mal executado: a maioria para no "joguei tudo num vector DB". Este módulo constrói o outro — chunking estrutural com contextualização, armazenamento dimensionado e medido, busca híbrida com fusão de ranking, reranking, filtro de permissão antes da relevância e abstenção calibrada. O corpus da prática é código Python com origem declarada (fixture do laboratório).

O módulo termina com o entregável que o M10 consome: **três perguntas que o RAG erra sistematicamente**, documentadas com diagnóstico, porque exigem percorrer *relações* — e relação não está dentro de nenhum chunk, está entre eles.

## Conteúdo do módulo

- **Material principal (HTML):** [`M07.html`](M07.html) — abra no navegador
- **Especificação:** [`docs/especificacoes/M07-ESPECIFICACAO.md`](../../docs/especificacoes/M07-ESPECIFICACAO.md)
- **Laboratório:** [`lab/`](lab/) — pipeline local com fakes, sem rede/banco/modelo real
- **Carga:** 8 blocos de conteúdo (16h)
- **Pré-requisito:** M06

## Estrutura dos blocos

1. **Bloco 1:** Embeddings por dentro — métricas de distância (tabela completa de operadores pgvector); **as cinco coisas que o vetor não captura** com o antídoto de cada uma; similaridade ≠ relevância; escolha de modelo e a migração blue-green.
2. **Bloco 2:** Chunking é 60% do resultado — o dilema do tamanho e o desacoplamento small-to-big; as cinco estratégias (fixo, estrutural, semântico, **contextual retrieval**, late chunking); chunker Python via AST com `id_estavel`; tabela de metadados obrigatórios.
3. **Bloco 3:** pgvector — tipos (`vector`/`halfvec`/`bit`/`sparsevec`) com bytes por linha; HNSW × IVFFlat com todos os parâmetros; **over-filtering e iterative index scans**; tuning em ordem; medição de recall contra busca exata.
4. **Bloco 4:** Busca híbrida — o lado léxico (`tsvector`, `websearch_to_tsquery`, `ts_rank_cd`, `setweight`, dicionário `simple` para código); por que não somar scores; **RRF** com a query SQL completa; métricas de IR (precisão/recall@k/MRR/nDCG).
5. **Bloco 5:** Reranking e transformação de query — bi-encoder × cross-encoder; o funil; três formas de rerankear; as três armadilhas; HyDE, decomposição, roteamento (com regra determinística antes de LLM).
6. **Bloco 6:** ACL antes da relevância — RAG como mecanismo de vazamento; a ordem inegociável; a tensão real com o índice ANN e as quatro soluções; **defesa em profundidade em quatro camadas** (com RLS testado desligando a aplicação); abstenção mecânica e os dois erros de calibração.
7. **Bloco 7:** O pipeline de 18 etapas (9 de ingestão, 9 de consulta, com o que quebra sem cada uma); isolar recuperação de geração em 5 minutos; métricas de RAG e os graders determinísticos que o Capstone pode ter ("verdade verificável").
8. **Bloco 8:** Pipeline completo sobre o corpus — ingestão com filtro, pipeline ponta a ponta, eval, e o exercício das **três perguntas para o grafo**.

## Entregáveis

- Pipeline local: ingestão com filtro, chunker estrutural, híbrida com RRF, rerank com limiar, ACL e abstenção.
- Eval de recuperação com baseline + **tabela de ablação** mostrando o custo de omitir cada etapa.
- Leak test com tenants locais; SQL de referência para PostgreSQL real (Docker).
- Três perguntas estruturais com diagnóstico — o insumo do M10.

A aplicação ao Capstone (`services/retrieval/`) é trilha opcional com especificação própria.

## Fundamentos reciclados neste módulo

Information retrieval clássica (TF-IDF/BM25, precisão × recall@k, MRR, nDCG) · similaridade × relevância · least privilege, defense in depth e canais de confiança (dado × instrução) · índices aproximados e o trade-off exatidão/velocidade · granularidade de índice e covering index.
