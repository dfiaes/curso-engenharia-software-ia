# ML02 — Dados e formulação de problemas

**Versão:** 1.0 · **Data:** 21/09/2026 · **Estado:** APÊNDICE OPCIONAL, ESPECIFICADO PARA REVISÃO G0; não produzido.

Contrato transversal: [formação software/IA/ML](FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md). Execução pelo backlog único, nunca por este documento isolado.

## Resultado e limites

Este módulo é opcional. Sua ausência, seus gates ou dependências não bloqueiam leitura, estudo ou conclusão do curso principal. Possui certificação editorial separada. Não é pré-requisito de M00–M13/LT01–LT04.

Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados.

Pré-requisitos: ML01. Não pressupor matemática ainda não ensinada. Cada conceito deve atingir N4; operação e projeto integrado demonstram N5 com sistema local pequeno.

Material alvo: `modulos/ML02-dados-problemas/ML02.html`; referência executável: `modulos/ML02-dados-problemas/lab`. São saídas futuras, não arquivos existentes.

## Blocos e cenários planejados

### B01 — Problema, alvo e baseline

Conceitos: unidade de previsão; target; horizonte; momento da decisão; rótulo disponível; baseline de regra.
Exemplo resolvido: prever atraso de uma solicitação usando somente atributos conhecidos na abertura.
Falha: usar data de resolução como feature.
Decisão e limite: decidir se há problema preditivo e se uma regra simples basta.

- ML02-B01-AT-01: demonstrar e explicar prever atraso de uma solicitação usando somente atributos conhecidos na abertura.
- ML02-B01-AT-02: provocar/detectar/corrigir usar data de resolução como feature.
- ML02-B01-AT-03: defender decidir se há problema preditivo e se uma regra simples basta; aplicar a uma variante no checkpoint final.

### B02 — Origem e contrato de dados

Conceitos: schema; unidade; licença; proveniência; consentimento; missing; duplicata; validade.
Exemplo resolvido: gerar CSV sintético de solicitações com IDs, timestamps, categoria e alvo; documentar gerador.
Falha: timestamp invertido, ID duplicado e categoria inesperada.
Decisão e limite: erro versus ausência legítima; dados sintéticos não demonstram valor real.

- ML02-B02-AT-01: demonstrar e explicar gerar CSV sintético de solicitações com IDs, timestamps, categoria e alvo; documentar gerador.
- ML02-B02-AT-02: provocar/detectar/corrigir timestamp invertido, ID duplicado e categoria inesperada.
- ML02-B02-AT-03: defender erro versus ausência legítima; dados sintéticos não demonstram valor real; aplicar a uma variante no checkpoint final.

### B03 — Exploração e qualidade

Conceitos: distribuição; outlier; missingness; associação; viés de seleção; gráficos legíveis.
Exemplo resolvido: relatório com contagens, histogramas e dados faltantes do treino.
Falha: investigar todo o teste para escolher features.
Decisão e limite: descrever sem inferir causalidade; preservar conjunto final.

- ML02-B03-AT-01: demonstrar e explicar relatório com contagens, histogramas e dados faltantes do treino.
- ML02-B03-AT-02: provocar/detectar/corrigir investigar todo o teste para escolher features.
- ML02-B03-AT-03: defender descrever sem inferir causalidade; preservar conjunto final; aplicar a uma variante no checkpoint final.

### B04 — Separação e leakage

Conceitos: treino/validação/teste; estratificação; grupos; tempo; duplicata; disponibilidade point-in-time.
Exemplo resolvido: criar splits por usuário e tempo; testar disjunção e datas.
Falha: mesmo usuário em treino e teste; dado futuro agregado.
Decisão e limite: escolher split conforme generalização prometida.

- ML02-B04-AT-01: demonstrar e explicar criar splits por usuário e tempo; testar disjunção e datas.
- ML02-B04-AT-02: provocar/detectar/corrigir mesmo usuário em treino e teste; dado futuro agregado.
- ML02-B04-AT-03: defender escolher split conforme generalização prometida; aplicar a uma variante no checkpoint final.

### B05 — Transformações e features

Conceitos: imputação; normalização; encoding; categoria desconhecida; ColumnTransformer/Pipeline.
Exemplo resolvido: fit só no treino, transformar validação com os parâmetros aprendidos.
Falha: normalizar antes do split e target encoding sem separação.
Decisão e limite: distinguir fit de transform e feature útil de vazamento.

- ML02-B05-AT-01: demonstrar e explicar fit só no treino, transformar validação com os parâmetros aprendidos.
- ML02-B05-AT-02: provocar/detectar/corrigir normalizar antes do split e target encoding sem separação.
- ML02-B05-AT-03: defender distinguir fit de transform e feature útil de vazamento; aplicar a uma variante no checkpoint final.

### B06 — Datasets versionados

Conceitos: schema/data version; hash; lineage; validação; reprodução; exclusão/derivados.
Exemplo resolvido: manifest liga gerador, seed, arquivo, split e contrato.
Falha: alterar um byte ou usar split de outra versão.
Decisão e limite: identificar dataset sem tratar hash como licença ou anonimização.

- ML02-B06-AT-01: demonstrar e explicar manifest liga gerador, seed, arquivo, split e contrato.
- ML02-B06-AT-02: provocar/detectar/corrigir alterar um byte ou usar split de outra versão.
- ML02-B06-AT-03: defender identificar dataset sem tratar hash como licença ou anonimização; aplicar a uma variante no checkpoint final.

## Laboratório e revisão

Aplicar laboratório guiado final, cópia temporária marcada, passos cumulativos, positivo/negativo e diagnóstico. Reaproveitar código entre blocos. Fixtures sem dados pessoais; registrar gerador, licença e seed. Instalação de dependências é bootstrap separado; execução obrigatória offline. NumPy/scikit-learn/PyTorch são adapters, introduzidos somente quando necessários ao bloco. Registrar compatibilidade real com Python 3.14 antes de fixar versões.

Checkpoint único final com rubrica de explicação, decisão, execução, diagnóstico e transferência. Não publicar números de qualidade antes de executar. Não aprovar apenas porque loss caiu. Validar split, baseline e uso do conjunto final.

## Fontes iniciais, ainda sujeitas à consulta por tarefa

- https://scikit-learn.org/stable/common_pitfalls.html
- https://scikit-learn.org/stable/modules/compose.html
- https://pandas.pydata.org/docs/user_guide/

Registrar claim, seção consultada, versão, data real de consulta e risco na tarefa S. Nenhuma data de validação técnica é inferida da criação deste arquivo.

## Gates

G0 candidato à revisão; G1–G6 PENDENTES. Planejamento e cenários não são evidência executada.
