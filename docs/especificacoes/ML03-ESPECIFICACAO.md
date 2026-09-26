# ML03 — Aprendizado supervisionado e validação

**Versão:** 1.0 · **Data:** 21/09/2026 · **Estado:** APÊNDICE OPCIONAL, ESPECIFICADO PARA REVISÃO G0; não produzido.

Contrato transversal: [formação software/IA/ML](FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md). Execução pelo backlog único, nunca por este documento isolado.

## Resultado e limites

Este módulo é opcional. Sua ausência, seus gates ou dependências não bloqueiam leitura, estudo ou conclusão do curso principal. Possui certificação editorial separada. Não é pré-requisito de M00–M13/LT01–LT04.

Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados.

Pré-requisitos: ML02. Não pressupor matemática ainda não ensinada. Cada conceito deve atingir N4; operação e projeto integrado demonstram N5 com sistema local pequeno.

Material alvo: `modulos/ML03-supervisionado-validacao/ML03.html`; referência executável: `modulos/ML03-supervisionado-validacao/lab`. São saídas futuras, não arquivos existentes.

## Blocos e cenários planejados

### B01 — Regressão e baselines

Conceitos: loss; residual; MAE/MSE/RMSE; R2; baseline média/mediana; regressão linear.
Exemplo resolvido: ajustar duração sintética com duas features e comparar baseline.
Falha: outlier muda MSE e regra de avaliação.
Decisão e limite: escolher loss pela consequência do erro; R2 pode ser negativo.

- ML03-B01-AT-01: demonstrar e explicar ajustar duração sintética com duas features e comparar baseline.
- ML03-B01-AT-02: provocar/detectar/corrigir outlier muda MSE e regra de avaliação.
- ML03-B01-AT-03: defender escolher loss pela consequência do erro; R2 pode ser negativo; aplicar a uma variante no checkpoint final.

### B02 — Classificação linear

Conceitos: logits; sigmoide; log loss; separação; regularização L1/L2.
Exemplo resolvido: regressão logística num dataset tabular pequeno com Pipeline.
Falha: feature vazada gera resultado irreal.
Decisão e limite: separar score, probabilidade e classe; escala/regularização.

- ML03-B02-AT-01: demonstrar e explicar regressão logística num dataset tabular pequeno com Pipeline.
- ML03-B02-AT-02: provocar/detectar/corrigir feature vazada gera resultado irreal.
- ML03-B02-AT-03: defender separar score, probabilidade e classe; escala/regularização; aplicar a uma variante no checkpoint final.

### B03 — Vizinhos, kernels e Naive Bayes

Conceitos: distância; dimensionalidade; margem; kernel; independência condicional.
Exemplo resolvido: comparar kNN, SVM e Naive Bayes em fixture com duas features.
Falha: escala desigual altera vizinhos; independência falha.
Decisão e limite: explicar hipóteses e custo de predição, não escolher por ranking universal.

- ML03-B03-AT-01: demonstrar e explicar comparar kNN, SVM e Naive Bayes em fixture com duas features.
- ML03-B03-AT-02: provocar/detectar/corrigir escala desigual altera vizinhos; independência falha.
- ML03-B03-AT-03: defender explicar hipóteses e custo de predição, não escolher por ranking universal; aplicar a uma variante no checkpoint final.

### B04 — Árvores e ensembles

Conceitos: partição; impureza; profundidade; bagging; random forest; boosting.
Exemplo resolvido: árvore rasa versus floresta/boosting pequeno no mesmo split.
Falha: árvore memoriza treino e piora holdout.
Decisão e limite: relacionar viés/variância, tamanho de dados e interpretabilidade.

- ML03-B04-AT-01: demonstrar e explicar árvore rasa versus floresta/boosting pequeno no mesmo split.
- ML03-B04-AT-02: provocar/detectar/corrigir árvore memoriza treino e piora holdout.
- ML03-B04-AT-03: defender relacionar viés/variância, tamanho de dados e interpretabilidade; aplicar a uma variante no checkpoint final.

### B05 — Validação e seleção

Conceitos: cross-validation; grupos/tempo; nested CV; tuning; orçamento; learning curve.
Exemplo resolvido: comparar duas configurações com pipeline dentro dos folds e teste final intocado.
Falha: escolher hiperparâmetro pelo teste final.
Decisão e limite: distinguir seleção e estimativa; permitir resultado inconclusivo.

- ML03-B05-AT-01: demonstrar e explicar comparar duas configurações com pipeline dentro dos folds e teste final intocado.
- ML03-B05-AT-02: provocar/detectar/corrigir escolher hiperparâmetro pelo teste final.
- ML03-B05-AT-03: defender distinguir seleção e estimativa; permitir resultado inconclusivo; aplicar a uma variante no checkpoint final.

### B06 — Desbalanceamento e custos

Conceitos: precision-recall; ROC; PR-AUC; pesos; reamostragem; limiar; custo.
Exemplo resolvido: comparar baseline majoritária, pesos e mudança de limiar.
Falha: fazer oversampling antes dos folds.
Decisão e limite: contagens por classe e custo; reamostragem não cria informação independente.

- ML03-B06-AT-01: demonstrar e explicar comparar baseline majoritária, pesos e mudança de limiar.
- ML03-B06-AT-02: provocar/detectar/corrigir fazer oversampling antes dos folds.
- ML03-B06-AT-03: defender contagens por classe e custo; reamostragem não cria informação independente; aplicar a uma variante no checkpoint final.

### B07 — Calibração e incerteza

Conceitos: reliability diagram; Brier/log loss; sigmoid/isotonic; separação de calibração; prediction interval.
Exemplo resolvido: calibrar em partição dedicada e avaliar em outra.
Falha: calibrar no teste; confiança alta em região sem dados.
Decisão e limite: não confundir ranking, calibração, intervalo e garantia individual.

- ML03-B07-AT-01: demonstrar e explicar calibrar em partição dedicada e avaliar em outra.
- ML03-B07-AT-02: provocar/detectar/corrigir calibrar no teste; confiança alta em região sem dados.
- ML03-B07-AT-03: defender não confundir ranking, calibração, intervalo e garantia individual; aplicar a uma variante no checkpoint final.

### B08 — Interpretar e decidir

Conceitos: permutation importance; dependência entre features; PDP/ICE; explicação local; slices; fairness.
Exemplo resolvido: comparar erro por grupo e importância em holdout com feature correlacionada.
Falha: concluir causa a partir de importância.
Decisão e limite: documentar utilidade, riscos, alternativa simples e critério de não implantação.

- ML03-B08-AT-01: demonstrar e explicar comparar erro por grupo e importância em holdout com feature correlacionada.
- ML03-B08-AT-02: provocar/detectar/corrigir concluir causa a partir de importância.
- ML03-B08-AT-03: defender documentar utilidade, riscos, alternativa simples e critério de não implantação; aplicar a uma variante no checkpoint final.

## Laboratório e revisão

Aplicar laboratório guiado final, cópia temporária marcada, passos cumulativos, positivo/negativo e diagnóstico. Reaproveitar código entre blocos. Fixtures sem dados pessoais; registrar gerador, licença e seed. Instalação de dependências é bootstrap separado; execução obrigatória offline. NumPy/scikit-learn/PyTorch são adapters, introduzidos somente quando necessários ao bloco. Registrar compatibilidade real com Python 3.14 antes de fixar versões.

Checkpoint único final com rubrica de explicação, decisão, execução, diagnóstico e transferência. Não publicar números de qualidade antes de executar. Não aprovar apenas porque loss caiu. Validar split, baseline e uso do conjunto final.

## Fontes iniciais, ainda sujeitas à consulta por tarefa

- https://scikit-learn.org/stable/supervised_learning.html
- https://scikit-learn.org/stable/modules/cross_validation.html
- https://scikit-learn.org/stable/modules/calibration.html
- https://scikit-learn.org/stable/modules/model_evaluation.html

Registrar claim, seção consultada, versão, data real de consulta e risco na tarefa S. Nenhuma data de validação técnica é inferida da criação deste arquivo.

## Gates

G0 candidato à revisão; G1–G6 PENDENTES. Planejamento e cenários não são evidência executada.
