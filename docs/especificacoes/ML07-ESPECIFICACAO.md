# ML07 — Projeto integrado de ML

**Versão:** 1.0 · **Data:** 21/09/2026 · **Estado:** APÊNDICE OPCIONAL, ESPECIFICADO PARA REVISÃO G0; não produzido.

Contrato transversal: [formação software/IA/ML](FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md). Execução pelo backlog único, nunca por este documento isolado.

## Resultado e limites

Este módulo é opcional. Sua ausência, seus gates ou dependências não bloqueiam leitura, estudo ou conclusão do curso principal. Possui certificação editorial separada. Não é pré-requisito de M00–M13/LT01–LT04.

Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados.

Pré-requisitos: ML04, ML05, ML06. Não pressupor matemática ainda não ensinada. Cada conceito deve atingir N4; operação e projeto integrado demonstram N5 com sistema local pequeno.

Material alvo: `modulos/ML07-projeto-ml/ML07.html`; referência executável: `modulos/ML07-projeto-ml/lab`. São saídas futuras, não arquivos existentes.

## Blocos e cenários planejados

### B01 — Contrato do problema

Conceitos: resultado de negócio; alvo/horizonte; baseline; custo de erro; critérios de não implantação.
Exemplo resolvido: produto pequeno prevê atraso de solicitações sintéticas sem afetar pessoas reais.
Falha: objetivo é apenas acurácia sem consequência.
Decisão e limite: projeto demonstra engenharia, não valor real sem piloto.

- ML07-B01-AT-01: demonstrar e explicar produto pequeno prevê atraso de solicitações sintéticas sem afetar pessoas reais.
- ML07-B01-AT-02: provocar/detectar/corrigir objetivo é apenas acurácia sem consequência.
- ML07-B01-AT-03: defender projeto demonstra engenharia, não valor real sem piloto; aplicar a uma variante no checkpoint final.

### B02 — Dados e baseline integrada

Conceitos: contrato; gerador; grupos/tempo; pipeline; métricas.
Exemplo resolvido: gerar dados, separar, treinar baseline por único fluxo documentado.
Falha: feature pós-evento entra no pipeline.
Decisão e limite: dataset sintético não certifica generalização externa.

- ML07-B02-AT-01: demonstrar e explicar gerar dados, separar, treinar baseline por único fluxo documentado.
- ML07-B02-AT-02: provocar/detectar/corrigir feature pós-evento entra no pipeline.
- ML07-B02-AT-03: defender dataset sintético não certifica generalização externa; aplicar a uma variante no checkpoint final.

### B03 — Comparação e escolha

Conceitos: hipóteses; orçamento; tuning separado; calibração; erro por slice.
Exemplo resolvido: comparar regra, linear e árvore no mesmo protocolo.
Falha: insistir no modelo mais complexo mesmo sem ganho.
Decisão e limite: defender baseline vencedor ou decisão de não usar ML.

- ML07-B03-AT-01: demonstrar e explicar comparar regra, linear e árvore no mesmo protocolo.
- ML07-B03-AT-02: provocar/detectar/corrigir insistir no modelo mais complexo mesmo sem ganho.
- ML07-B03-AT-03: defender defender baseline vencedor ou decisão de não usar ML; aplicar a uma variante no checkpoint final.

### B04 — Serviço e operação mínima

Conceitos: CLI/API; schema; versão; lote; telemetry; fallback.
Exemplo resolvido: servir uma previsão, rejeitar entrada inválida e registrar versão sem PII.
Falha: carregar artefato incompatível e degradar com erro claro.
Decisão e limite: integração opcional Cartógrafo por porta; não acoplar produtos sem necessidade.

- ML07-B04-AT-01: demonstrar e explicar servir uma previsão, rejeitar entrada inválida e registrar versão sem PII.
- ML07-B04-AT-02: provocar/detectar/corrigir carregar artefato incompatível e degradar com erro claro.
- ML07-B04-AT-03: defender integração opcional Cartógrafo por porta; não acoplar produtos sem necessidade; aplicar a uma variante no checkpoint final.

### B05 — Falha e recuperação

Conceitos: drift; qualidade atrasada; rollback; reprodução; evidência.
Exemplo resolvido: candidato regressivo bloqueado; restaurar pipeline anterior e repetir previsões.
Falha: gate aceita relatório vazio ou dado de versão errada.
Decisão e limite: provar resultado observado, sem GO por existência de arquivo.

- ML07-B05-AT-01: demonstrar e explicar candidato regressivo bloqueado; restaurar pipeline anterior e repetir previsões.
- ML07-B05-AT-02: provocar/detectar/corrigir gate aceita relatório vazio ou dado de versão errada.
- ML07-B05-AT-03: defender provar resultado observado, sem GO por existência de arquivo; aplicar a uma variante no checkpoint final.

### B06 — Defesa e transferência

Conceitos: resultado/limites; model card; ameaça; custo; comunicação; variante inédita.
Exemplo resolvido: dossiê pequeno e mudança de horizonte que exige novo split/avaliação.
Falha: tratar demo sintética como case de mercado.
Decisão e limite: piloto real só com consentimento; revisão humana da explicação e próxima decisão.

- ML07-B06-AT-01: demonstrar e explicar dossiê pequeno e mudança de horizonte que exige novo split/avaliação.
- ML07-B06-AT-02: provocar/detectar/corrigir tratar demo sintética como case de mercado.
- ML07-B06-AT-03: defender piloto real só com consentimento; revisão humana da explicação e próxima decisão; aplicar a uma variante no checkpoint final.

## Laboratório e revisão

Aplicar laboratório guiado final, cópia temporária marcada, passos cumulativos, positivo/negativo e diagnóstico. Reaproveitar código entre blocos. Fixtures sem dados pessoais; registrar gerador, licença e seed. Instalação de dependências é bootstrap separado; execução obrigatória offline. NumPy/scikit-learn/PyTorch são adapters, introduzidos somente quando necessários ao bloco. Registrar compatibilidade real com Python 3.14 antes de fixar versões.

Checkpoint único final com rubrica de explicação, decisão, execução, diagnóstico e transferência. Não publicar números de qualidade antes de executar. Não aprovar apenas porque loss caiu. Validar split, baseline e uso do conjunto final.

## Fontes iniciais, ainda sujeitas à consulta por tarefa

- https://scikit-learn.org/stable/common_pitfalls.html
- https://arxiv.org/abs/1810.03993
- https://www.nist.gov/itl/ai-risk-management-framework

Registrar claim, seção consultada, versão, data real de consulta e risco na tarefa S. Nenhuma data de validação técnica é inferida da criação deste arquivo.

## Gates

G0 candidato à revisão; G1–G6 PENDENTES. Planejamento e cenários não são evidência executada.
