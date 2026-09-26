# ML06 — MLOps e operação de modelos

**Versão:** 1.0 · **Data:** 21/09/2026 · **Estado:** APÊNDICE OPCIONAL, ESPECIFICADO PARA REVISÃO G0; não produzido.

Contrato transversal: [formação software/IA/ML](FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md). Execução pelo backlog único, nunca por este documento isolado.

## Resultado e limites

Este módulo é opcional. Sua ausência, seus gates ou dependências não bloqueiam leitura, estudo ou conclusão do curso principal. Possui certificação editorial separada. Não é pré-requisito de M00–M13/LT01–LT04.

Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados.

Pré-requisitos: ML03, M03. Não pressupor matemática ainda não ensinada. Cada conceito deve atingir N4; operação e projeto integrado demonstram N5 com sistema local pequeno.

Material alvo: `modulos/ML06-mlops/ML06.html`; referência executável: `modulos/ML06-mlops/lab`. São saídas futuras, não arquivos existentes.

## Blocos e cenários planejados

### B01 — Ciclo de vida e contratos

Conceitos: treino/validação/inferência; batch/online; schema; determinismo; fronteiras.
Exemplo resolvido: CLI predict usa pipeline treinado e rejeita schema incompatível.
Falha: coluna fora de ordem altera resposta.
Decisão e limite: manter transformação idêntica e definir unidade de negócio.

- ML06-B01-AT-01: demonstrar e explicar CLI predict usa pipeline treinado e rejeita schema incompatível.
- ML06-B01-AT-02: provocar/detectar/corrigir coluna fora de ordem altera resposta.
- ML06-B01-AT-03: defender manter transformação idêntica e definir unidade de negócio; aplicar a uma variante no checkpoint final.

### B02 — Pipelines reprodutíveis

Conceitos: etapas; DAG; cache; idempotência; configuração; seed; ambiente; falha.
Exemplo resolvido: ingest/train/evaluate executados por comandos locais com manifests.
Falha: falha após gravar artefato parcial; cache stale.
Decisão e limite: refazer só quando identidade de entrada muda; não precisa orquestrador distribuído.

- ML06-B02-AT-01: demonstrar e explicar ingest/train/evaluate executados por comandos locais com manifests.
- ML06-B02-AT-02: provocar/detectar/corrigir falha após gravar artefato parcial; cache stale.
- ML06-B02-AT-03: defender refazer só quando identidade de entrada muda; não precisa orquestrador distribuído; aplicar a uma variante no checkpoint final.

### B03 — Experimentos e registro

Conceitos: params/metrics/artifacts; run ID; dataset/model version; registry; promoção.
Exemplo resolvido: registro JSON local com hashes e ponte opcional MLflow.
Falha: promover modelo com métrica de outro split ou artefato.
Decisão e limite: registry não é pasta com nome production; identidade rastreável.

- ML06-B03-AT-01: demonstrar e explicar registro JSON local com hashes e ponte opcional MLflow.
- ML06-B03-AT-02: provocar/detectar/corrigir promover modelo com métrica de outro split ou artefato.
- ML06-B03-AT-03: defender registry não é pasta com nome production; identidade rastreável; aplicar a uma variante no checkpoint final.

### B04 — Serving e desempenho

Conceitos: contrato HTTP; batch; serialização; dependências; latência; throughput; fallback.
Exemplo resolvido: FastAPI local carrega artefato confiável e compara batch/online.
Falha: desserializar pickle não confiável; schema inválido.
Decisão e limite: verificar origem/integridade; HMAC/hash não dá confiança por si só.

- ML06-B04-AT-01: demonstrar e explicar FastAPI local carrega artefato confiável e compara batch/online.
- ML06-B04-AT-02: provocar/detectar/corrigir desserializar pickle não confiável; schema inválido.
- ML06-B04-AT-03: defender verificar origem/integridade; HMAC/hash não dá confiança por si só; aplicar a uma variante no checkpoint final.

### B05 — Observabilidade e feedback

Conceitos: qualidade com rótulo atrasado; feature health; SLI/SLO; slices; privacidade.
Exemplo resolvido: simular chegada posterior de rótulos e ligar previsões pelo ID.
Falha: reportar acurácia antes dos rótulos; logar dados sensíveis.
Decisão e limite: distinguir saúde de serviço e qualidade preditiva.

- ML06-B05-AT-01: demonstrar e explicar simular chegada posterior de rótulos e ligar previsões pelo ID.
- ML06-B05-AT-02: provocar/detectar/corrigir reportar acurácia antes dos rótulos; logar dados sensíveis.
- ML06-B05-AT-03: defender distinguir saúde de serviço e qualidade preditiva; aplicar a uma variante no checkpoint final.

### B06 — Drift e retreino

Conceitos: covariate/label/concept drift; teste de distribuição; base rate; delayed labels.
Exemplo resolvido: alterar gerador e comparar distribuições/qualidade com baseline.
Falha: drift dispara promoção automática sem avaliar.
Decisão e limite: drift é sinal, não prova de degradação nem ordem de retreino.

- ML06-B06-AT-01: demonstrar e explicar alterar gerador e comparar distribuições/qualidade com baseline.
- ML06-B06-AT-02: provocar/detectar/corrigir drift dispara promoção automática sem avaliar.
- ML06-B06-AT-03: defender drift é sinal, não prova de degradação nem ordem de retreino; aplicar a uma variante no checkpoint final.

### B07 — Entrega e rollback

Conceitos: shadow; canary; champion/challenger; compatibilidade; promoção; rollback.
Exemplo resolvido: duas versões locais com roteamento e candidato ruim barrado.
Falha: shadow escreve efeito real; rollback usa feature incompatível.
Decisão e limite: critérios de promoção pré-definidos; rollback inclui pipeline e contrato.

- ML06-B07-AT-01: demonstrar e explicar duas versões locais com roteamento e candidato ruim barrado.
- ML06-B07-AT-02: provocar/detectar/corrigir shadow escreve efeito real; rollback usa feature incompatível.
- ML06-B07-AT-03: defender critérios de promoção pré-definidos; rollback inclui pipeline e contrato; aplicar a uma variante no checkpoint final.

### B08 — Governança e incidente

Conceitos: model/data card; ownership; lineage; fairness; retenção; risco; decommission.
Exemplo resolvido: dossiê liga dataset, código, modelo, métricas, decisão e incidente.
Falha: modelo sem evidência ou versão expirada tenta servir.
Decisão e limite: controles mínimos suficientes; normas não substituem aconselhamento jurídico.

- ML06-B08-AT-01: demonstrar e explicar dossiê liga dataset, código, modelo, métricas, decisão e incidente.
- ML06-B08-AT-02: provocar/detectar/corrigir modelo sem evidência ou versão expirada tenta servir.
- ML06-B08-AT-03: defender controles mínimos suficientes; normas não substituem aconselhamento jurídico; aplicar a uma variante no checkpoint final.

## Laboratório e revisão

Aplicar laboratório guiado final, cópia temporária marcada, passos cumulativos, positivo/negativo e diagnóstico. Reaproveitar código entre blocos. Fixtures sem dados pessoais; registrar gerador, licença e seed. Instalação de dependências é bootstrap separado; execução obrigatória offline. NumPy/scikit-learn/PyTorch são adapters, introduzidos somente quando necessários ao bloco. Registrar compatibilidade real com Python 3.14 antes de fixar versões.

Checkpoint único final com rubrica de explicação, decisão, execução, diagnóstico e transferência. Não publicar números de qualidade antes de executar. Não aprovar apenas porque loss caiu. Validar split, baseline e uso do conjunto final.

## Fontes iniciais, ainda sujeitas à consulta por tarefa

- https://mlflow.org/docs/latest/ml/tracking
- https://developers.google.com/machine-learning/guides/rules-of-ml
- https://www.nist.gov/itl/ai-risk-management-framework
- https://scikit-learn.org/stable/model_persistence.html

Registrar claim, seção consultada, versão, data real de consulta e risco na tarefa S. Nenhuma data de validação técnica é inferida da criação deste arquivo.

## Gates

G0 candidato à revisão; G1–G6 PENDENTES. Planejamento e cenários não são evidência executada.
