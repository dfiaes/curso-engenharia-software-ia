# Pontes matemáticas internas ao principal

Este documento é o contrato editorial para ensinar no percurso principal a matemática indispensável que aparece em M05, M06 e M11. Ele liga cada conceito ao ponto de uso e a um exemplo pequeno. Não cria uma dependência curricular de ML01 ou ML05: os módulos do apêndice são aprofundamentos opcionais, e seus HTMLs ainda não existem.

## Contrato de inserção

1. Ensinar definição, símbolos, mecanismo e exemplo no bloco principal antes de usar o conceito numa decisão ou API.
2. O laboratório principal mostra a execução própria da competência; este mapa não substitui implementação, resultado nem diagnóstico.
3. Ligar a explicação a âncoras estáveis do próprio percurso principal. Nomear ML01/ML05 apenas como aprofundamento futuro, sem criar links para páginas inexistentes.
4. Teste de dependência negativa: remover mentalmente ou tornar indisponível o apêndice não pode tornar o bloco principal ilegível, incompleto para o objetivo declarado ou impossível de executar.

## Probabilidade e amostragem no M05

**Ponto de uso:** [M05, Bloco 1 — contrato da chamada e amostragem](../../modulos/M05-llm-pratica-gateway-cache/M05.html#b01). O bloco apresenta a distribuição de probabilidade sobre tokens, temperatura, `top_p` e `top_k`.

**Definição mínima:** uma distribuição categórica atribui probabilidade não negativa a cada resultado possível; a soma sobre todos os resultados é 1. Amostrar é sortear um resultado conforme esses pesos, não escolher sempre o maior.

**Conta ilustrativa:** para três próximos tokens com pesos `0,7`, `0,2` e `0,1`, as chances somam `1,0`. O token de peso `0,7` é mais provável, mas uma única amostra ainda pode selecionar qualquer resultado com peso positivo. Esses pesos são exemplo didático, não saída de um modelo executado. `top_p=0,8` retém os tokens de maior probabilidade até cobrir a massa acumulada de 0,8, respeitando o algoritmo e a ordem descritos no bloco.

**Limite e extensão:** a variabilidade do sorteio não explica, por si só, a qualidade factual; versões, infraestrutura e avaliação também importam. ML01 pode aprofundar variável aleatória, esperança e distribuição; nada disso é pré-requisito para usar o contrato do M05.

## Proporções e incerteza no M06

**Ponto de uso:** [M06, Bloco 1 — estatística mínima](../../modulos/M06-evals-observabilidade/M06.html#b01). O bloco define `p̂=x/n`, erro padrão, intervalo Wilson, taxa de base, efeito mínimo, `α`, poder e resultado inconclusivo.

**Conta ilustrativa já trabalhada no bloco:** `45/50 = 0,90`; o intervalo Wilson de 95% registrado é aproximadamente `78,6%–95,7%`. Com `180/200 = 0,90`, o intervalo fica aproximadamente `85,1%–93,4%`. A amostra maior estreita o intervalo sob o modelo binomial; não demonstra representatividade nem suficiência para detectar qualquer efeito escolhido.

**Decisão e limite:** não rejeitar diferença não demonstra equivalência. Para versões avaliadas nos mesmos casos, conservar os pares e analisar os resultados discordantes; as margens e o desenho precisam vir antes do resultado. ML01 pode aprofundar inferência e desenho amostral, mas não substitui nem antecede esta explicação do M06.

## Vetores e gradientes no M11

**Ponto de uso:** [M11, Bloco 1 — vocabulário e distribuição](../../modulos/M11-fundamentos-ml-dl-modelos-locais/M11.html#b01) e [arquivo companheiro, Bloco 2 — tensor, gradiente e treino](../../modulos/M11-fundamentos-ml-dl-modelos-locais/lab-transformer-do-zero.html#b02). O primeiro já define embedding/logit, softmax e tensor; o segundo desenvolve o loop de treino executável.

**Definição mínima:** um vetor é uma sequência ordenada de números; a ordem identifica a coordenada. Um gradiente reúne derivadas parciais que indicam como a função muda em cada parâmetro. O otimizador usa essa direção e a taxa de aprendizado para escolher uma atualização.

**Conta ilustrativa:** para `L(w)=(w−3)²`, em `w=1`, a derivada é `2(w−3)=−4`. Com taxa `η=0,1`, um passo de descida é `w novo = 1−η(−4)=1,4`. É exemplo algébrico, não resultado do laboratório M11; o lab registra a execução sobre seus próprios tensores e parâmetros.

**Decisão e limite:** o sinal local do gradiente explica o sentido de um passo, mas não garante que a sequência inteira encontrará um mínimo global ou generalize para dados novos. ML01 aprofunda vetores e derivadas; ML05 aprofunda representação e redes. Ambos seguem opcionais, depois da base ensinada em M11.

## Controles de dependência

| Módulo principal | Positivo | Controle negativo | Estado após esta tarefa |
|---|---|---|---|
| M05 | B01 explica distribuição e decisões de amostragem; exemplo pequeno soma 1 | M05 não pode exigir leitura de ML01/ML05 ou link HTML ainda inexistente | referência interna com aprofundamento opcional nomeado |
| M06 | B01 possui definições, fórmulas, contas, decisão e limite próprios | M06 não pode exigir ML01 para interpretar a incerteza do checkpoint | referência interna; estatística fundamental permanece no principal |
| M11 | B01 define vocabulário; B02 companheiro implementa o gradiente | M11 não pode exigir ML01/ML05 para ler vetores, softmax ou executar o laboratório | referência interna; apêndice é aprofundamento posterior |

A aceitação editorial desta tarefa verifica o mapa e as dependências declaradas; não promove conteúdo, laboratório, gate ou módulo. Revisão visual e execução dos labs permanecem nos respectivos cartões.
