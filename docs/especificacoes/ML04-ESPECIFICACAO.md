# ML04 — Estrutura, tempo e recomendação

**Versão:** 1.0 · **Data:** 21/09/2026 · **Estado:** APÊNDICE OPCIONAL, ESPECIFICADO PARA REVISÃO G0; não produzido.

Contrato transversal: [formação software/IA/ML](FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md). Execução pelo backlog único, nunca por este documento isolado.

## Resultado e limites

Este módulo é opcional. Sua ausência, seus gates ou dependências não bloqueiam leitura, estudo ou conclusão do curso principal. Possui certificação editorial separada. Não é pré-requisito de M00–M13/LT01–LT04.

Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados.

Pré-requisitos: ML03. Não pressupor matemática ainda não ensinada. Cada conceito deve atingir N4; operação e projeto integrado demonstram N5 com sistema local pequeno.

Material alvo: `modulos/ML04-estrutura-tempo-recomendacao/ML04.html`; referência executável: `modulos/ML04-estrutura-tempo-recomendacao/lab`. São saídas futuras, não arquivos existentes.

## Blocos e cenários planejados

### B01 — Clustering

Conceitos: k-means; densidade/DBSCAN; escala; silhouette; estabilidade; ausência de rótulo.
Exemplo resolvido: agrupar pontos 2D e variar escala/semente.
Falha: clusters estáveis mas sem utilidade de negócio.
Decisão e limite: cluster não é classe real; escolher medida e verificar estabilidade.

- ML04-B01-AT-01: demonstrar e explicar agrupar pontos 2D e variar escala/semente.
- ML04-B01-AT-02: provocar/detectar/corrigir clusters estáveis mas sem utilidade de negócio.
- ML04-B01-AT-03: defender cluster não é classe real; escolher medida e verificar estabilidade; aplicar a uma variante no checkpoint final.

### B02 — PCA e representação

Conceitos: centragem; covariância; autovetores/SVD; variância explicada; reconstrução.
Exemplo resolvido: projetar três features correlacionadas em duas e reconstruir.
Falha: ajustar PCA antes do split; componente de baixa variância contém sinal.
Decisão e limite: compressão não garante melhor previsão; ligação com ML01.

- ML04-B02-AT-01: demonstrar e explicar projetar três features correlacionadas em duas e reconstruir.
- ML04-B02-AT-02: provocar/detectar/corrigir ajustar PCA antes do split; componente de baixa variância contém sinal.
- ML04-B02-AT-03: defender compressão não garante melhor previsão; ligação com ML01; aplicar a uma variante no checkpoint final.

### B03 — Anomalias

Conceitos: raridade; novidade; Isolation Forest; contaminação; alert budget.
Exemplo resolvido: pontuar outliers sintéticos e medir falsos alertas em dados rotulados de teste.
Falha: tratar todo ponto raro como fraude.
Decisão e limite: calibrar limiar conforme investigação disponível.

- ML04-B03-AT-01: demonstrar e explicar pontuar outliers sintéticos e medir falsos alertas em dados rotulados de teste.
- ML04-B03-AT-02: provocar/detectar/corrigir tratar todo ponto raro como fraude.
- ML04-B03-AT-03: defender calibrar limiar conforme investigação disponível; aplicar a uma variante no checkpoint final.

### B04 — Séries temporais

Conceitos: tendência/sazonalidade; lags; rolling features; backtest; gap; baseline sazonal.
Exemplo resolvido: prever demanda sintética com baseline e regressão de lags em rolling origin.
Falha: janela centrada usa futuro; split aleatório.
Decisão e limite: multi-step, intervalo e drift; não garantir superioridade de modelo complexo.

- ML04-B04-AT-01: demonstrar e explicar prever demanda sintética com baseline e regressão de lags em rolling origin.
- ML04-B04-AT-02: provocar/detectar/corrigir janela centrada usa futuro; split aleatório.
- ML04-B04-AT-03: defender multi-step, intervalo e drift; não garantir superioridade de modelo complexo; aplicar a uma variante no checkpoint final.

### B05 — Recomendação e ranking

Conceitos: feedback implícito; popularidade; candidatos/ranking; cold start; Recall/NDCG; exposição.
Exemplo resolvido: recomendar itens de interações sintéticas com popularidade e similaridade.
Falha: interação futura e negativos fáceis contaminam teste.
Decisão e limite: offline não prova satisfação; viés de exposição e diversidade.

- ML04-B05-AT-01: demonstrar e explicar recomendar itens de interações sintéticas com popularidade e similaridade.
- ML04-B05-AT-02: provocar/detectar/corrigir interação futura e negativos fáceis contaminam teste.
- ML04-B05-AT-03: defender offline não prova satisfação; viés de exposição e diversidade; aplicar a uma variante no checkpoint final.

### B06 — Predição, causalidade e decisão

Conceitos: correlação; confundimento; intervenção; contrafactual; A/B; interferência; limites observacionais.
Exemplo resolvido: Simpson em tabela pequena e desenho de experimento com randomização.
Falha: atribuir efeito causal à feature importante.
Decisão e limite: quando é permitido prever versus afirmar efeito; escopo introdutório de inferência causal.

- ML04-B06-AT-01: demonstrar e explicar Simpson em tabela pequena e desenho de experimento com randomização.
- ML04-B06-AT-02: provocar/detectar/corrigir atribuir efeito causal à feature importante.
- ML04-B06-AT-03: defender quando é permitido prever versus afirmar efeito; escopo introdutório de inferência causal; aplicar a uma variante no checkpoint final.

## Laboratório e revisão

Aplicar laboratório guiado final, cópia temporária marcada, passos cumulativos, positivo/negativo e diagnóstico. Reaproveitar código entre blocos. Fixtures sem dados pessoais; registrar gerador, licença e seed. Instalação de dependências é bootstrap separado; execução obrigatória offline. NumPy/scikit-learn/PyTorch são adapters, introduzidos somente quando necessários ao bloco. Registrar compatibilidade real com Python 3.14 antes de fixar versões.

Checkpoint único final com rubrica de explicação, decisão, execução, diagnóstico e transferência. Não publicar números de qualidade antes de executar. Não aprovar apenas porque loss caiu. Validar split, baseline e uso do conjunto final.

## Fontes iniciais, ainda sujeitas à consulta por tarefa

- https://scikit-learn.org/stable/unsupervised_learning.html
- https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html
- https://otexts.com/fpp3/
- https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/

Registrar claim, seção consultada, versão, data real de consulta e risco na tarefa S. Nenhuma data de validação técnica é inferida da criação deste arquivo.

## Gates

G0 candidato à revisão; G1–G6 PENDENTES. Planejamento e cenários não são evidência executada.
