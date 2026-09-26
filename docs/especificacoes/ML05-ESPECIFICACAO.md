# ML05 — Deep learning e representação

**Versão:** 1.0 · **Data:** 21/09/2026 · **Estado:** APÊNDICE OPCIONAL, ESPECIFICADO PARA REVISÃO G0; não produzido.

Contrato transversal: [formação software/IA/ML](FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md). Execução pelo backlog único, nunca por este documento isolado.

## Resultado e limites

Este módulo é opcional. Sua ausência, seus gates ou dependências não bloqueiam leitura, estudo ou conclusão do curso principal. Possui certificação editorial separada. Não é pré-requisito de M00–M13/LT01–LT04.

Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados.

Pré-requisitos: ML03. Não pressupor matemática ainda não ensinada. Cada conceito deve atingir N4; operação e projeto integrado demonstram N5 com sistema local pequeno.

Material alvo: `modulos/ML05-deep-learning/ML05.html`; referência executável: `modulos/ML05-deep-learning/lab`. São saídas futuras, não arquivos existentes.

## Blocos e cenários planejados

### B01 — Tensores e autograd

Conceitos: shape/dtype/device; broadcasting; grafo computacional; derivadas; gradiente acumulado.
Exemplo resolvido: derivada de função de dois parâmetros à mão e PyTorch.
Falha: broadcast muda loss silenciosamente.
Decisão e limite: conferir unidades e dimensões antes de otimizar.

- ML05-B01-AT-01: demonstrar e explicar derivada de função de dois parâmetros à mão e PyTorch.
- ML05-B01-AT-02: provocar/detectar/corrigir broadcast muda loss silenciosamente.
- ML05-B01-AT-03: defender conferir unidades e dimensões antes de otimizar; aplicar a uma variante no checkpoint final.

### B02 — Loop de treinamento

Conceitos: forward/loss/backward/step/zero_grad; batches; train/eval; seed.
Exemplo resolvido: MLP minúscula CPU sobre dados tabulares não lineares.
Falha: esquecer zero_grad ou usar eval/train errado.
Decisão e limite: registrar comportamento observado sem prometer divergência universal.

- ML05-B02-AT-01: demonstrar e explicar MLP minúscula CPU sobre dados tabulares não lineares.
- ML05-B02-AT-02: provocar/detectar/corrigir esquecer zero_grad ou usar eval/train errado.
- ML05-B02-AT-03: defender registrar comportamento observado sem prometer divergência universal; aplicar a uma variante no checkpoint final.

### B03 — Otimização e regularização

Conceitos: SGD/Adam; learning rate; decay; dropout; normalização; early stopping.
Exemplo resolvido: duas configurações pequenas com curvas treino/validação.
Falha: escolher época pelo conjunto final.
Decisão e limite: trade-off ajuste/generalização; não atribuir ganho só ao otimizador.

- ML05-B03-AT-01: demonstrar e explicar duas configurações pequenas com curvas treino/validação.
- ML05-B03-AT-02: provocar/detectar/corrigir escolher época pelo conjunto final.
- ML05-B03-AT-03: defender trade-off ajuste/generalização; não atribuir ganho só ao otimizador; aplicar a uma variante no checkpoint final.

### B04 — Visão e convolução

Conceitos: imagem como tensor; convolução; canais; receptive field; pooling; augmentation.
Exemplo resolvido: reconhecer padrões geométricos gerados localmente com CNN pequena.
Falha: augmentation muda classe; split contém cópias da mesma imagem.
Decisão e limite: invariância desejada versus perda de informação; não promete visão de produção.

- ML05-B04-AT-01: demonstrar e explicar reconhecer padrões geométricos gerados localmente com CNN pequena.
- ML05-B04-AT-02: provocar/detectar/corrigir augmentation muda classe; split contém cópias da mesma imagem.
- ML05-B04-AT-03: defender invariância desejada versus perda de informação; não promete visão de produção; aplicar a uma variante no checkpoint final.

### B05 — Sequências e atenção

Conceitos: embedding; ordem; posição; RNN; atenção QKV; máscara; custo.
Exemplo resolvido: dependência em sequência curta; atenção manual comparada ao framework.
Falha: máscara permite olhar token futuro.
Decisão e limite: pré-requisito de M11; não duplicar transformer completo.

- ML05-B05-AT-01: demonstrar e explicar dependência em sequência curta; atenção manual comparada ao framework.
- ML05-B05-AT-02: provocar/detectar/corrigir máscara permite olhar token futuro.
- ML05-B05-AT-03: defender pré-requisito de M11; não duplicar transformer completo; aplicar a uma variante no checkpoint final.

### B06 — Representação e transferência

Conceitos: embeddings; pré-treino; congelar/fine-tune; domínio; linear probe; LoRA conceitual.
Exemplo resolvido: pré-treinar encoder minúsculo em tarefa sintética e transferir localmente.
Falha: transferência negativa e avaliação em dados do pré-treino.
Decisão e limite: quando adaptar é justificável; sem download obrigatório de pesos.

- ML05-B06-AT-01: demonstrar e explicar pré-treinar encoder minúsculo em tarefa sintética e transferir localmente.
- ML05-B06-AT-02: provocar/detectar/corrigir transferência negativa e avaliação em dados do pré-treino.
- ML05-B06-AT-03: defender quando adaptar é justificável; sem download obrigatório de pesos; aplicar a uma variante no checkpoint final.

### B07 — Modelos generativos e multimodalidade

Conceitos: autoregressivo; autoencoder/VAE; difusão conceitual; alinhamento texto/imagem; avaliação.
Exemplo resolvido: autoencoder pequeno com erro de reconstrução; diagrama de denoising e contraste.
Falha: reconstrução baixa é tratada como utilidade ou segurança.
Decisão e limite: distinguir mecanismo, demonstração e capacidade; modelos grandes opcionais.

- ML05-B07-AT-01: demonstrar e explicar autoencoder pequeno com erro de reconstrução; diagrama de denoising e contraste.
- ML05-B07-AT-02: provocar/detectar/corrigir reconstrução baixa é tratada como utilidade ou segurança.
- ML05-B07-AT-03: defender distinguir mecanismo, demonstração e capacidade; modelos grandes opcionais; aplicar a uma variante no checkpoint final.

### B08 — Diagnóstico e eficiência

Conceitos: gradiente; NaN; profiling; checkpoint; memória; batching; precision; ablação.
Exemplo resolvido: salvar/retomar treino CPU e investigar batch com NaN.
Falha: retomar pesos sem estado do otimizador.
Decisão e limite: comparar qualidade/custo; quantização/serving LLM aprofundados em M11.

- ML05-B08-AT-01: demonstrar e explicar salvar/retomar treino CPU e investigar batch com NaN.
- ML05-B08-AT-02: provocar/detectar/corrigir retomar pesos sem estado do otimizador.
- ML05-B08-AT-03: defender comparar qualidade/custo; quantização/serving LLM aprofundados em M11; aplicar a uma variante no checkpoint final.

## Laboratório e revisão

Aplicar laboratório guiado final, cópia temporária marcada, passos cumulativos, positivo/negativo e diagnóstico. Reaproveitar código entre blocos. Fixtures sem dados pessoais; registrar gerador, licença e seed. Instalação de dependências é bootstrap separado; execução obrigatória offline. NumPy/scikit-learn/PyTorch são adapters, introduzidos somente quando necessários ao bloco. Registrar compatibilidade real com Python 3.14 antes de fixar versões.

Checkpoint único final com rubrica de explicação, decisão, execução, diagnóstico e transferência. Não publicar números de qualidade antes de executar. Não aprovar apenas porque loss caiu. Validar split, baseline e uso do conjunto final.

## Fontes iniciais, ainda sujeitas à consulta por tarefa

- https://docs.pytorch.org/tutorials/beginner/basics/
- https://arxiv.org/abs/1706.03762
- https://arxiv.org/abs/2106.09685
- https://arxiv.org/abs/1312.6114
- https://arxiv.org/abs/2006.11239

Registrar claim, seção consultada, versão, data real de consulta e risco na tarefa S. Nenhuma data de validação técnica é inferida da criação deste arquivo.

## Gates

G0 candidato à revisão; G1–G6 PENDENTES. Planejamento e cenários não são evidência executada.
