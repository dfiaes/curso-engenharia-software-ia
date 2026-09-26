# Formação em engenharia de software, IA e ML — especificação de aprofundamento

**Versão:** 1.0 · **Data:** 21/09/2026 · **Estado:** PLANEJADO; nenhum gate de conteúdo aprovado por este documento.

Decisões do usuário: preparar tarefas detalhadas para execução por LLM menor; priorizar conhecimento profundo e alta didática; laboratórios podem ser simples; ampliar a formação para dados tabulares, treinamento, validação e MLOps como apêndice opcional, sem bloquear o curso principal (esclarecimento do usuário em 21/09/2026). Esta especificação rege a ampliação e a revisão. O backlog operacional é o único catálogo de tarefas; o STATUS continua sendo o único placar e fila. As especificações locais conservam os detalhes técnicos, sujeitos à revisão explicitamente prevista aqui.

## 1. Resultado e fronteiras

Formar alguém capaz de explicar, escolher, implementar, diagnosticar e operar software e sistemas com modelos aprendidos. A pessoa deve saber quando uma regra basta, quando usar ML clássico, quando uma rede neural se justifica e quando LLM/RAG/agente ajuda. Deve fundamentar decisões com dados, custos, riscos e limites de validade.

Entrada: noções básicas de variável, condição, repetição e função. Não pressupor Python profissional, matemática universitária, cloud ou outra stack. Uma ponte de entrada explica sintaxe, terminal, arquivos, Git e notação matemática no ponto de uso; não é prova obrigatória. Matemática necessária é ensinada em ML01 antes de ser usada.

O escopo é uma formação profissional abrangente, não a promessa de cobrir toda pesquisa em IA. Robótica, controle, RL profundo, treinamento distribuído de modelos de fronteira, visão/áudio de grande escala e infraestrutura GPU multinó são extensões futuras. Visão, sequências, recomendação, séries temporais, causalidade e modelos generativos recebem fundamentos e limites explicitados nesta trilha, sem prometer especialização em cada domínio.

## 2. Organização e dependências de aprendizagem

Preservar os 152 blocos existentes. Acrescentar 48 blocos opcionais em ML01–ML07: 152 blocos principais em 19 unidades + apêndice de 48 blocos em sete unidades. Os 200 blocos descrevem o acervo total, nunca a obrigação de concluir o percurso principal. As 304h antigas descrevem somente a baseline anterior; não multiplicar automaticamente blocos por duas horas. Reestimar carga depois de produzir e observar a leitura, sem impor duração ao aluno.

| Unidade nova | Blocos | Saída e papel |
|---|---:|---|
| ML01 — Matemática e estatística para decisões | 6 | caderno executável de vetores, derivadas, probabilidade e inferência; base de M06/M11 |
| ML02 — Dados e formulação de problemas | 6 | dataset pequeno com contrato, proveniência, split e pipeline sem leakage |
| ML03 — Aprendizado supervisionado e validação | 8 | baseline, modelos comparados, calibração e escolha por custo/risco |
| ML04 — Estrutura, tempo e recomendação | 6 | clustering/PCA/anomalia, backtest temporal, ranking e limites causais |
| ML05 — Deep learning e representação | 8 | treino CPU pequeno, gradientes, regularização, sequências/visão e transferência |
| ML06 — MLOps e operação de modelos | 8 | pipeline local versionado, serving, monitoramento, drift e rollback |
| ML07 — Projeto integrado de ML | 6 | produto tabular pequeno com defesa, evidência e integração opcional ao Cartógrafo |

Percurso conceitual: M00/M01 → M02 → M02A; ML01 depois de M02, ML02 depois de ML01, ML03 depois de ML02; ML04/ML05 depois de ML03; ML06 depois de ML03 e M03; ML07 depois de ML04/ML05/ML06. M05, M06 e M11 ensinam no próprio material os fundamentos matemáticos necessários, por pontes curtas e completas. Links para ML01/ML05 oferecem aprofundamento opcional: nunca pré-requisito. Não há dependência de M00–M13/LTs para aprovação de um módulo ML no sentido inverso; somente o apêndice pode exigir fundamentos do principal.

O DAG de execução editorial pode antecipar correções urgentes de M06/M13 sem concluir esses percursos; dependência pedagógica e pré-condição de uma correção são coisas distintas. Uma tarefa de autoria só fecha a referência cruzada depois de o destino existir.

## 3. Profundidade didática obrigatória

Cada conceito central deve ter: problema concreto; definição; pré-requisitos explicados; mecanismo passo a passo; exemplo resolvido; alternativa e trade-off; falha observável; diagnóstico; limite; aplicação em contexto diferente. N1–N4 são obrigatórios nos fundamentos; N5 nos assuntos de operação. N5 pode ser demonstrado num sistema pequeno real: tamanho do software não mede profundidade.

Para matemática: definir cada símbolo e unidade; fazer uma conta pequena à mão; mostrar o mesmo cálculo em Python; relacionar à decisão; explicar pressupostos e quando deixam de valer. Não exigir que uma fórmula seja decorada. Para código: explicar entrada, transformação de estado, saída e efeito, junto ao trecho correspondente; indicar o arquivo executável. Não ensinar API sem o mecanismo que ela encapsula.

Exemplo de padrão: ao ensinar precisão/recall, começar com 100 solicitações e uma matriz de confusão concreta; identificar TP/FP/FN/TN; calcular as duas frações; mostrar como o limiar muda os erros; associar custo de falso positivo/negativo ao uso; depois nomear a API que calcula. A matriz é exemplo ilustrativo, não desempenho medido. Comparar com baseline e explicar por que acurácia pode enganar. Esse padrão vale também para cache, transação, atenção, drift e rollback.

Não aceitar: definição em uma frase seguida de lista de bibliotecas; texto telegráfico; siglas anteriores à explicação; metáfora no lugar de mecanismo; demonstração cujo resultado foi escolhido para confirmar a tese; saída sintética apresentada como medida; bibliografia sem ligação às afirmações; mais palavras como critério de qualidade.

## 4. Laboratório mínimo suficiente

Preferir estender o laboratório existente. Um módulo tem um laboratório coeso, com subexperimentos pequenos quando necessário, não um projeto novo por bloco. Usar fixtures pequenas, CPU e arquivos locais; conta, crédito, download de dataset/pesos e GPU não são requisitos de execução obrigatória. O bootstrap de dependências deve ser separado da execução offline e documentar cache/lock.

Não criar Kubernetes, broker, frontend, feature store ou registry só para ensinar uma função ou uma métrica. Ensinar primeiro com o menor experimento que exponha a propriedade. Quando a propriedade for específica de PostgreSQL, isolamento entre processos, protocolo ou container, usar esse componente real em sandbox pequeno. Um dict pode explicar transição de estado, mas não aprova restore de banco. Fake de modelo testa o runtime, não a qualidade de um modelo real.

Classificar cada evidência como: (a) exemplo ilustrativo; (b) experimento local executado; (c) integração local com componente real; (d) trilha externa opcional. A passagem de (b) para (c) exige execução própria, não renomear a evidência. Ausência de infraestrutura obrigatória é BLOCKED. Ausência de uma trilha externa opcional não bloqueia o núcleo aprovado; sua optionalidade precisa ser declarada antes de observar falhas.

Para ML: dados sintéticos de autoria própria ou datasets pequenos redistribuíveis, com origem/licença/gerador e limites registrados; seed para reprodução, mas conclusão não depende de uma seed favorável. Nada de PII real. Baseline simples, split antes de aprender transformações, amostras de avaliação separadas e resultado permitido de 'não melhorou'. Não exigir download durante o estudo.

Roteiro final: resultado e limite → pré-requisitos → cópia temporária marcada → arquivos → passos cumulativos com motivo/código/comando/observação/diagnóstico → validação → encerramento → retomada. Windows/PowerShell canônico. Não limpar caminho arbitrário, repositório ou dados do usuário.

## 5. Avaliação e revisão

Há um checkpoint final por módulo. As tarefas D acrescentam cenários a esse checkpoint; não criam provas obrigatórias dentro dos blocos. Avaliar explicação do mecanismo, escolha justificada, execução, diagnóstico e transferência. Entregar rubrica ao autor/revisor, separada do roteiro guiado, com respostas esperadas, erros críticos e alternativas aceitáveis.

Rubrica editorial por conceito (0 ausente; 1 parcial; 2 suficiente): contexto/pré-requisitos, mecanismo, exemplo trabalhado, decisão/limites, falha/diagnóstico, transferência, fontes/evidência e navegabilidade. Nenhuma dimensão central pode ficar 0; mecanismo, exemplo, decisão e diagnóstico precisam de 2 para fechar o bloco. Não usar apenas soma para compensar uma lacuna crítica. Revisor deve citar trechos e evidências, não só dar nota. O escore é instrumento editorial, não teste do aluno nem medida científica de aprendizagem.

Teste de compreensão com leitor consentido: pedir que localize o ponto de retomada, explique uma decisão e diagnostique uma variante. Registrar dúvidas e revisões, sem coleta silenciosa, sem inventar participante. O piloto do produto e o piloto didático são evidências diferentes.

## 6. Correções conhecidas que precedem o fechamento

1. M06: gate reprova categorias ausentes, relatório vazio, métricas inválidas e amostra insuficiente segundo política explícita. Calibração e concordância não são margem de erro. Significância não prova equivalência. Corrigir os números universais de amostragem.
2. M13: PRR valida conteúdo e resultado das evidências, identidade/versão e bloqueios; diretório vazio não aprova. Game day depende de recuperação observada, não contagem de eventos. Separar simulador de operação integrada.
3. Reconciliar status/trace/REL e limites do checker; não apagar relatórios históricos. Freshness verifica a afirmação certa: tokens mínimos de cache não são janela nem saída máxima.
4. Revisar critérios enviesados nas specs: M07 não deve exigir que híbrido/rerank sempre ganhe; M08 não deve exigir economia de 3–8x; M11 não deve garantir divergência sem zero_grad, multiplicador de tempo, perda fixa com quantização, limite universal de parâmetros LoRA ou superioridade de um formato. Substituir por medir, comparar e explicar, com casos de não melhoria e limites.
5. Reconciliar ATs reais e IDs esparsos dos LTs; não inventar todos os inteiros entre 001 e 061. Preservar IDs existentes e documentar mudanças de interpretação.

## 7. Fontes, atualidade e honestidade

Specs locais e catálogo incluem pontos de partida. O executor consulta o original, registra seção, afirmação, versão/data, tipo e data real de consulta. Uma URL encontrada não significa fonte validada. Não preencher datas de leitura por suposição. High-risk: ≤90 dias ou revalidar; fundamentos estáveis não precisam perseguir versões novas.

Fontes iniciais de ML: [NumPy](https://numpy.org/doc/stable/), [scikit-learn](https://scikit-learn.org/stable/user_guide.html), [vazamento e pipelines](https://scikit-learn.org/stable/common_pitfalls.html), [validação](https://scikit-learn.org/stable/modules/cross_validation.html), [calibração](https://scikit-learn.org/stable/modules/calibration.html), [NIST estatística](https://www.itl.nist.gov/div898/handbook/), [PyTorch](https://docs.pytorch.org/tutorials/beginner/basics/), [MLflow](https://mlflow.org/docs/latest/ml/tracking), [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework), [Rules of ML](https://developers.google.com/machine-learning/guides/rules-of-ml) (guidance industrial). Livros canônicos e papers originais complementam, não substituem explicação autossuficiente.

A consulta inicial desta elaboração localizou documentação oficial; não certifica compatibilidade Python 3.14 de todos os pacotes. Tarefa de ambiente verifica wheels/locks/CPU antes de autorizar labs. Não baixar a versão canônica silenciosamente para contornar incompatibilidade.

## 8. Execução por modelo menor

Uma tarefa contém um bloco e uma etapa: C explicação/exemplo, L experimento mínimo, D diagnóstico/transferência/revisão. A tarefa S reconcilia escopo antes; E verifica apresentação ao final. Correções urgentes têm cartões próprios. Se uma tarefa ultrapassar uma intervenção segura, dividir por conceito mantendo IDs filhos no registro; não comprimir teoria para caber.

Antes de escrever: ler regras, spec, trace, cartão e predecessor; localizar trechos existentes; classificar conservar/corrigir/complementar; confirmar write set. Executar apenas o cartão pedido. Não reescrever o módulo todo por estilo. Se conteúdo já satisfaz o contrato, validar e registrar reutilização com evidência, sem alterações cosméticas.

Execução contínua autorizada em 24/09/2026: GPT-6 Luna high para autoria, revisão e fechamento terminal, sem troca para Sol/Astra. O protocolo do backlog permite avançar automaticamente com dependências revisadas e revisão em execução distinta da autoria. O agendador configura o modelo; o relatório registra a origem da configuração. Nenhuma automação autoriza deploy/publicação, conta paga ou contato com participantes.

Entrega por tarefa: objetivo, diff, conceitos/ATs cobertos, caminhos, comandos com cwd e saída, resultado PASS/FAIL/BLOCKED do experimento, rubrica editorial, limitações e próximo passo. Estado editorial distinto: PLANEJADO → EM_EXECUCAO → AGUARDA_REVISAO → REVISADO ou AJUSTES_NECESSARIOS/BLOQUEADO. Só revisão do orquestrador altera gates. Nunca alterar PROGRESSO.md.

## 9. Aceites separados do principal e do apêndice

REL-01–06 concluem somente o principal; ML-REL-01/02 concluem somente o apêndice. Nenhuma tarefa ML pertence ao caminho bloqueador de REL-06. Navegação/leitura do aluno permanece livre inclusive quando uma certificação editorial está pendente.

Cada bloco tem correspondência conceito/exemplo/falha/transferência; cada AT obrigatório liga teste e evidência atual; todos os G0–G6 aplicáveis foram revisados; integrações reais essenciais executadas; fontes de alto risco revalidadas; navegação/teclado/390px/impressão observados; piloto didático e de produto registrados quando exigidos; nenhum P1 do diagnóstico aberto. Relatórios gerados e quantidade de testes não bastam. Nenhuma limitação pode ser removida apenas para obter release verde.
