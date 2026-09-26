# ML01 — Matemática e estatística para decisões

**Versão:** 1.0 · **Data:** 21/09/2026 · **Estado:** APÊNDICE OPCIONAL, ESPECIFICADO PARA REVISÃO G0; não produzido.

Contrato transversal: [formação software/IA/ML](FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md). Execução pelo backlog único, nunca por este documento isolado.

## Resultado e limites

Este módulo é opcional. Sua ausência, seus gates ou dependências não bloqueiam leitura, estudo ou conclusão do curso principal. Possui certificação editorial separada. Não é pré-requisito de M00–M13/LT01–LT04.

Um laboratório CPU incremental por módulo; fixture de solicitações sintéticas reutilizada. Subexperimentos de matemática/imagem/sequência isolados e rotulados.

Pré-requisitos: M02. Não pressupor matemática ainda não ensinada. Cada conceito deve atingir N4; operação e projeto integrado demonstram N5 com sistema local pequeno.

Material alvo: `modulos/ML01-matematica-estatistica/ML01.html`; referência executável: `modulos/ML01-matematica-estatistica/lab`. São saídas futuras, não arquivos existentes.

## Blocos e cenários planejados

### B01 — Vetores, matrizes e unidades

Conceitos: escalar/vetor/matriz; shape; produto interno; norma; distância; projeção; escala.
Exemplo resolvido: calcular à mão e em NumPy similaridade de três vetores de duas dimensões.
Falha: vetor de norma zero e coluna em unidade diferente.
Decisão e limite: escolher distância pela semântica e explicar por que similaridade não é verdade.

- ML01-B01-AT-01: demonstrar e explicar calcular à mão e em NumPy similaridade de três vetores de duas dimensões.
- ML01-B01-AT-02: provocar/detectar/corrigir vetor de norma zero e coluna em unidade diferente.
- ML01-B01-AT-03: defender escolher distância pela semântica e explicar por que similaridade não é verdade; aplicar a uma variante no checkpoint final.

### B02 — Funções, derivadas e otimização

Conceitos: função; taxa de variação; derivada parcial; gradiente; regra da cadeia; passo de otimização.
Exemplo resolvido: minimizar erro quadrático de uma reta em cinco pontos; comparar gradiente analítico e diferenças finitas.
Falha: passo muito grande e sinal invertido do gradiente.
Decisão e limite: explicar convergência local, escala e limites de diferenças finitas.

- ML01-B02-AT-01: demonstrar e explicar minimizar erro quadrático de uma reta em cinco pontos; comparar gradiente analítico e diferenças finitas.
- ML01-B02-AT-02: provocar/detectar/corrigir passo muito grande e sinal invertido do gradiente.
- ML01-B02-AT-03: defender explicar convergência local, escala e limites de diferenças finitas; aplicar a uma variante no checkpoint final.

### B03 — Probabilidade e informação

Conceitos: variável aleatória; distribuição; condicional; independência; Bayes; esperança; variância; log; entropia; cross-entropy.
Exemplo resolvido: tabela de teste com prevalência baixa e cálculo de posterior; distribuição categórica com três saídas.
Falha: confundir P(A dado B) com P(B dado A); log de zero.
Decisão e limite: diferenciar confiança, probabilidade prevista e frequência observada.

- ML01-B03-AT-01: demonstrar e explicar tabela de teste com prevalência baixa e cálculo de posterior; distribuição categórica com três saídas.
- ML01-B03-AT-02: provocar/detectar/corrigir confundir P(A dado B) com P(B dado A); log de zero.
- ML01-B03-AT-03: defender diferenciar confiança, probabilidade prevista e frequência observada; aplicar a uma variante no checkpoint final.

### B04 — Amostragem e intervalos

Conceitos: população/amostra; viés; iid; erro padrão; intervalo Wilson; bootstrap; dependência.
Exemplo resolvido: 45 acertos em 50 casos: calcular intervalo Wilson à mão/stdlib e comparar com 180 em 200.
Falha: reamostrar linhas de um mesmo usuário como independentes.
Decisão e limite: interpretar cobertura e escolher unidade de reamostragem; concordância não é margem de erro.

- ML01-B04-AT-01: demonstrar e explicar 45 acertos em 50 casos: calcular intervalo Wilson à mão/stdlib e comparar com 180 em 200.
- ML01-B04-AT-02: provocar/detectar/corrigir reamostrar linhas de um mesmo usuário como independentes.
- ML01-B04-AT-03: defender interpretar cobertura e escolher unidade de reamostragem; concordância não é margem de erro; aplicar a uma variante no checkpoint final.

### B05 — Comparar experimentos

Conceitos: hipótese; tamanho de efeito; poder; pareamento; teste múltiplo; equivalência; parada pré-definida.
Exemplo resolvido: comparar duas listas de acerto nos mesmos exemplos; bootstrap pareado do delta.
Falha: comparar grupos diferentes e parar quando p fica favorável.
Decisão e limite: inconclusivo não significa equivalente; limiar pré-registrado e custo do erro.

- ML01-B05-AT-01: demonstrar e explicar comparar duas listas de acerto nos mesmos exemplos; bootstrap pareado do delta.
- ML01-B05-AT-02: provocar/detectar/corrigir comparar grupos diferentes e parar quando p fica favorável.
- ML01-B05-AT-03: defender inconclusivo não significa equivalente; limiar pré-registrado e custo do erro; aplicar a uma variante no checkpoint final.

### B06 — Métricas, decisão e comunicação

Conceitos: matriz de confusão; precisão/recall; especificidade; prevalência; custo esperado; calibração; incerteza.
Exemplo resolvido: variar limiar em dez probabilidades rotuladas e apresentar contagens, custo e limites.
Falha: acurácia alta ao prever sempre a classe majoritária.
Decisão e limite: selecionar métrica/limiar pelo uso e abster quando a evidência não permite decidir.

- ML01-B06-AT-01: demonstrar e explicar variar limiar em dez probabilidades rotuladas e apresentar contagens, custo e limites.
- ML01-B06-AT-02: provocar/detectar/corrigir acurácia alta ao prever sempre a classe majoritária.
- ML01-B06-AT-03: defender selecionar métrica/limiar pelo uso e abster quando a evidência não permite decidir; aplicar a uma variante no checkpoint final.

## Laboratório e revisão

Aplicar laboratório guiado final, cópia temporária marcada, passos cumulativos, positivo/negativo e diagnóstico. Reaproveitar código entre blocos. Fixtures sem dados pessoais; registrar gerador, licença e seed. Instalação de dependências é bootstrap separado; execução obrigatória offline. NumPy/scikit-learn/PyTorch são adapters, introduzidos somente quando necessários ao bloco. Registrar compatibilidade real com Python 3.14 antes de fixar versões.

Checkpoint único final com rubrica de explicação, decisão, execução, diagnóstico e transferência. Não publicar números de qualidade antes de executar. Não aprovar apenas porque loss caiu. Validar split, baseline e uso do conjunto final.

## Fontes iniciais, ainda sujeitas à consulta por tarefa

- https://numpy.org/doc/stable/
- https://www.itl.nist.gov/div898/handbook/
- https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm

Registrar claim, seção consultada, versão, data real de consulta e risco na tarefa S. Nenhuma data de validação técnica é inferida da criação deste arquivo.

## Gates

G0 candidato à revisão; G1–G6 PENDENTES. Planejamento e cenários não são evidência executada.
