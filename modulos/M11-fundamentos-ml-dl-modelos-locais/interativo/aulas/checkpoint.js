/* M11 · Checkpoint: treze cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada. Fonte: M11.html, seção "Checkpoint M11". As perguntas 1 a 5 cobrem os Blocos 2 a 4 (laboratório do transformer) e usam só o que o módulo afirma sobre eles. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm11-checkpoint',
    titulo: 'Checkpoint M11',
    minutos: 50,
    resumo: 'Treze cenários sobre fundamentos de ML/DL e modelos locais, sem consulta. Responda com as suas palavras, justifique pelo mecanismo e cite a conta quando houver.',
    objetivo: 'Verificar, sem consulta, se você explica o erro de aritmética por tokenização e amostragem, o custo quadrático, a alucinação, a conta de VRAM, a escada de diagnóstico do modo agente e a decisão entre local, API e fine-tuning.',
    revisao: [
      { id: 'm11cp-aritmetica', pergunta: 'Por que um LLM erra 4871 × 39 e mais dados de aritmética não conserta?',
        opcoes: [
          opc('a', 'A tokenização corta os números em pedaços irregulares e a geração é amostragem token a token, não cálculo; a conta exata sai de código determinístico', true, 'tokenização explica a aritmética errada e amostragem explica a alucinação; nenhuma das duas se conserta com mais dados.'),
          opc('b', 'Porque o modelo tem poucos parâmetros', false, 'o mecanismo é tokenização mais amostragem, não tamanho.'),
          opc('c', 'Porque a temperatura estava alta', false, 'T=0 só torna o erro reprodutível.')] },
      { id: 'm11cp-quadratico', pergunta: 'Por que FlashAttention não elimina o custo quadrático?',
        opcoes: [
          opc('a', 'Ela economiza memória, não computação: a matriz T×T continua sendo calculada', true, 'por isso cortar 30% do contexto corta cerca de 51% do trabalho (0,7² = 0,49).'),
          opc('b', 'Porque só funciona em GPU', false, 'o motivo é o que ela reduz, não onde roda.'),
          opc('c', 'Ela torna a atenção linear', false, 'ela economiza memória, não computação.')] },
      { id: 'm11cp-vram', pergunta: 'Qual parcela da memória de serving multiplica com contexto e concorrência?',
        opcoes: [
          opc('a', 'O cache de KV; os pesos e o overhead não se movem', true, 'KV = 2 · camadas · n_kv · dim_cabeça · ctx · batch · bytes.'),
          opc('b', 'Os pesos', false, 'pesos são fixos por modelo e quant.'),
          opc('c', 'O overhead', false, 'overhead é folga de 1 a 2 GB.')] },
      { id: 'm11cp-escada', pergunta: 'Qual a ordem dos primeiros degraus antes de considerar trocar de modelo?',
        opcoes: [
          opc('a', 'Template, contexto truncado, suporte nativo a tools, formato da documentação das tools, stop tokens', true, 'integração antes de modelo; "o modelo é ruim" é o degrau 8, com número.'),
          opc('b', 'Modelo maior, fine-tuning, outro modelo, outro provedor', false, 'é a ordem da intuição, oposta à da escada.'),
          opc('c', 'Temperatura, top-p, top-k, seed', false, 'amostragem não conserta serialização.')] },
      { id: 'm11cp-local', pergunta: 'Em que condições local sai mais caro que API, e quais motivos o justificam mesmo assim?',
        opcoes: [
          opc('a', 'Em baixo volume e baixa utilização (hardware amortizado domina); justifica dados que não podem sair, volume alto e custo previsível', true, 'nunca por ser "de graça".'),
          opc('b', 'Nunca sai mais caro: energia é barata', false, 'a energia é pequena, mas o hardware amortizado domina com utilização baixa.'),
          opc('c', 'Sempre sai mais caro e nunca se justifica', false, 'há três motivos legítimos.')] }
    ],
    abas: [
      { rotulo: 'Fundamento, amostragem e comportamento', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que basta. Reprovar é permitido: volte ao bloco indicado e tente de novo. As perguntas 1 a 5 cobrem também o laboratório do transformer (Blocos 2 a 4, no arquivo companheiro do módulo).</p>' },

        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · O clássico: 4871 × 39', obrigatorio: false,
          enunciado: 'Explique em 3 minutos, sem jargão, por que um LLM erra <code>4871 × 39</code> e por que treinar com mais dados de aritmética não conserta. Cite tokenização e amostragem. <em>Blocos 4 e 5.</em>',
          placeholder: 'Para o modelo, o número é… A resposta sai de… O que resolve é…',
          rubrica: [
            '<strong>Tokenização:</strong> o texto vira pedaços de vocabulário (BPE) que ignoram a estrutura de dígitos; dígitos vizinhos podem cair em pedaços distintos.',
            '<strong>Amostragem:</strong> a resposta é gerada token a token por sorteio, não calculada por um algoritmo de multiplicação.',
            'Explica por que <strong>mais dados não conserta</strong> as duas causas.',
            'Propõe <strong>código ou ferramenta determinística</strong> para a conta, com o LLM redigindo o texto em volta.'
          ],
          modelo: '<p>O modelo não enxerga o número como quantidade: o tokenizador corta "4871" e "39" em pedaços de vocabulário que não respeitam as casas, e a resposta é gerada token a token, sorteando o próximo pedaço mais plausível, não executando uma multiplicação. Por isso ele acerta contas parecidas com o que viu e erra as demais. Mais dados de aritmética não mudam nem o corte do tokenizador nem o fato de que gerar é amostrar. A conta exata (<code>189969</code>) deve sair de código determinístico, e o LLM redige o texto em volta.</p>' + reprova('"o modelo é fraco em matemática" ou "é só treinar mais".') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Contexto dobrado, latência quadruplicada', obrigatorio: false,
          enunciado: 'Você dobrou a janela de contexto e o tempo até o primeiro token quadruplicou, mas o preço por token não mudou. Explique a mecânica e diga em que ponto do gateway isso deveria virar um alerta. <em>Bloco 3.</em>',
          placeholder: 'A atenção calcula… O preço não muda porque… No gateway eu alertaria…',
          rubrica: [
            'A atenção forma uma matriz <strong>T×T</strong>: o trabalho cresce com o <strong>quadrado</strong> do contexto (O(n²)).',
            'O preço por token é linear e <strong>não reflete</strong> o custo de computação, que aparece como latência.',
            'Alerta no registro por chamada do <strong>gateway do M05</strong>: relação entre tokens de entrada e latência (tempo até o primeiro token).'
          ],
          modelo: '<p>Cada token compara-se com todos os anteriores, formando uma matriz T×T; dobrar o contexto quadruplica o trabalho de atenção, e o primeiro token só sai depois dele. O preço por token é uma tarifa linear por token e não muda, então o custo extra aparece como latência, não na fatura. Eu alertaria no registro por chamada do gateway, acompanhando a latência até o primeiro token por faixa de tokens de entrada, de modo que um salto acima do linear dispare o alerta. Cortar 30% do contexto corta cerca de 51% do trabalho.</p>' + reprova('"o preço subiu" ou "a atenção é linear".') },

        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · FlashAttention', obrigatorio: false,
          enunciado: 'Por que FlashAttention não elimina o custo quadrático? O que exatamente ela reduz? <em>Bloco 3.</em>',
          placeholder: 'Ela reduz… Continua quadrático porque…',
          rubrica: [
            'Ela economiza <strong>memória</strong>, não computação (SRC-M11-08).',
            'A computação sobre os pares de posições continua <strong>O(n²)</strong>.'
          ],
          modelo: '<p>FlashAttention reorganiza o cálculo para economizar memória: não é preciso materializar a matriz T×T inteira. A quantidade de comparações entre posições é a mesma, então a computação continua quadrática no contexto. Por isso ela ajuda a caber no hardware, mas não torna contexto longo barato em tempo.</p>' + reprova('"ela torna a atenção linear".') },

        { tipo: 'escolha', id: 'cp-esc-p4', titulo: 'P4 · Aquecimento: duas camadas lineares',
          pergunta: 'Sem uma função de ativação entre duas camadas lineares, o que acontece com a capacidade do modelo?',
          opcoes: [
            { id: 'a', texto: 'Dobra, porque há o dobro de parâmetros.', correta: false, porque: 'mais parâmetros sem não linearidade não adicionam poder.' },
            { id: 'b', texto: 'Colapsa em uma única camada linear: W2·(W1·x) = (W2·W1)·x.', correta: true, porque: 'o produto de duas matrizes é uma matriz, então empilhar sem ativação não adiciona poder.' },
            { id: 'c', texto: 'Nada muda, porque a ativação é só normalização.', correta: false, porque: 'a ativação introduz a não linearidade que torna o empilhamento útil.' }
          ] },
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Sem ativação, algebricamente', obrigatorio: false,
          enunciado: 'Sem uma função de ativação entre duas camadas lineares, o que acontece com a capacidade do modelo, e por quê, algebricamente? <em>Bloco 2.</em>',
          placeholder: 'A composição de duas camadas lineares é…',
          rubrica: [
            'A composição <code>W2·(W1·x)</code> é igual a <code>(W2·W1)·x</code>: <strong>uma única transformação linear</strong>.',
            'A capacidade <strong>não aumenta</strong> com a profundidade; falta a não linearidade.'
          ],
          modelo: '<p>Duas camadas lineares em sequência calculam <code>W2·(W1·x)</code>, que é igual a <code>(W2·W1)·x</code>: a multiplicação das duas matrizes é uma só matriz. O modelo tem a mesma capacidade de uma camada linear única, por mais camadas que empilhe. A função de ativação entre elas quebra essa equivalência.</p>' + reprova('"fica mais lento" ou "fica instável" sem a álgebra.') },

        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Embedding para gerar o relatório', obrigatorio: false,
          enunciado: 'Um colega quer usar o modelo de embedding do M07 para gerar o texto do relatório, "para economizar uma dependência". Dê a resposta arquitetural. <em>Bloco 4.</em>',
          placeholder: 'O embedding produz… A geração exige…',
          rubrica: [
            'O modelo de embedding mapeia texto a <strong>vetores</strong> para similaridade; não foi treinado para <strong>gerar o próximo token</strong>.',
            'Geração e embedding são <strong>componentes distintos</strong>, com papéis e portas distintas.',
            'Reconhece que a economia é falsa: o relatório é o <strong>entregável que o cliente lê</strong>.'
          ],
          modelo: '<p>Um modelo de embedding devolve um vetor por texto, útil para busca por similaridade, e não aprendeu a prever o próximo token; não há o que gerar com ele. Geração de texto e embeddings são dois componentes com objetivos diferentes, e cada um fica atrás da sua própria porta. Tentar unificar para economizar uma dependência piora o entregável que o cliente lê, e nenhuma dependência é de fato evitada.</p>' + reprova('"dá para ajustar o embedding para gerar texto".') },

        { tipo: 'escolha', id: 'cp-esc-p6', titulo: 'P6 · Aquecimento: temperatura 0',
          pergunta: 'Temperatura 0 elimina alucinação? E garante que duas chamadas idênticas retornem o mesmo texto?',
          opcoes: [
            { id: 'a', texto: 'Sim para as duas: sem sorteio, o modelo diz só o que sabe e a saída é idêntica.', correta: false, porque: 'remover o sorteio não adiciona conhecimento nem garante bit a bit.' },
            { id: 'b', texto: 'Não para as duas: fixa o token mais provável (o erro passa a se repetir) e batching, empates e versão do modelo ainda mudam a saída em API.', correta: true, porque: 'T=0 troca alucinação variável por reprodutível, sem curar; teste que exige saída idêntica pisca.' },
            { id: 'c', texto: 'Sim para a primeira e não para a segunda.', correta: false, porque: 'T=0 não cura alucinação.' }
          ] },
        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Temperatura 0, duas respostas', obrigatorio: false,
          enunciado: 'Temperatura 0 elimina alucinação? E garante que duas chamadas idênticas retornem exatamente o mesmo texto? Justifique as duas respostas. <em>Bloco 5.</em>',
          placeholder: 'Não elimina porque… Não garante porque…',
          rubrica: [
            'Não elimina: remove o sorteio e fixa o <strong>token mais provável</strong>; se ele está errado, o erro se <strong>repete</strong>.',
            'Não garante igualdade: <strong>batching</strong> muda a ordem de redução em ponto flutuante, empates se resolvem de modo distinto e a <strong>versão do modelo</strong> muda sem aviso.',
            'Conclui que o teste usa <strong>grader semântico</strong> (M06), não saída idêntica.'
          ],
          modelo: '<p>Não. T=0 remove o sorteio e escolhe sempre o token mais provável; se o mais provável é um fato inventado, o erro passa a se repetir com constância, o que é útil para depurar mas não cura. Também não garante o mesmo texto: o batching altera a ordem das somas em ponto flutuante, empates se resolvem de modo diferente e a versão do modelo muda sem aviso. Por isso o teste do M06 usa um grader semântico em vez de exigir saída idêntica.</p>' + reprova('"T=0 é determinístico e correto".') },

        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Dois modelos, uma rubrica', obrigatorio: false,
          enunciado: 'Dois modelos avaliados: um com 22% de acurácia e 26% de erro, outro com 24% de acurácia e 75% de erro (números do legado, a confirmar em SRC-M11-19). Qual você coloca em produção, e o que isso implica para a rubrica dos <em>seus</em> evals? <em>Bloco 5.</em>',
          placeholder: 'Eu colocaria… porque… A rubrica deve…',
          rubrica: [
            'Escolhe o de <strong>menor taxa de erro</strong> (o que mais se abstém), apesar da acurácia ligeiramente menor.',
            'Explica o <strong>incentivo</strong>: acurácia pura premia chutar; erro confiante custa mais que calar.',
            'A rubrica deve ser <strong>assimétrica</strong> (+1 certo, +0,5 abstenção, -1 erro confiante), com casos em que abster-se é a resposta correta.',
            'Registra que os números são <strong>a confirmar</strong>, não evidência.'
          ],
          modelo: '<p>Eu colocaria o primeiro, com 26% de erro, porque o segundo erra quase três vezes mais: ele chuta onde o primeiro se abstém, e a acurácia de 24% contra 22% esconde isso. Um grader de acurácia pura premia o chute, e é assim que o gate de CI acaba selecionando o modelo ou o prompt que mais inventa. Na minha rubrica, resposta certa vale +1, abstenção correta +0,5 e erro confiante -1, com casos no fixture em que não há resposta no contexto. Os números do enunciado vêm do legado e ficam a confirmar.</p>' + reprova('escolher pela maior acurácia sem olhar a taxa de erro.') }
      ] },

      { rotulo: 'Memória, servidor e custo', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p8', titulo: 'P8 · Aquecimento: cabe em 24 GB?',
          pergunta: 'Você tem 24 GB de VRAM. Cabe um modelo de 27B em Q4_K_M (0,58 byte por parâmetro) com 32k de contexto e 4 requisições simultâneas? Suponha 32 camadas, 8 cabeças KV, dimensão 128, KV a 2 bytes e 1,5 GB de overhead.',
          opcoes: [
            { id: 'a', texto: 'Cabe: 27B em Q4 ocupa uns 15 GB, e sobra folga.', correta: false, porque: 'só os pesos têm ~14,6 GB; falta somar o KV e o overhead.' },
            { id: 'b', texto: 'Não cabe: pesos ≈ 14,6 GB + KV = 16 GB + overhead 1,5 GB ≈ 32,1 GB.', correta: true, porque: 'KV = 2 · 32 · 8 · 128 · 32768 · 4 · 2 bytes = 16 GiB. A arquitetura é ilustrativa; a do modelo real muda os números, não o método.' },
            { id: 'c', texto: 'Cabe, porque o KV só depende de um usuário.', correta: false, porque: 'o KV multiplica pela concorrência.' }
          ] },
        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · A conta, por escrito', obrigatorio: false,
          enunciado: 'Você tem 24 GB de VRAM. Cabe um modelo de 27B em Q4_K_M com 32k de contexto e 4 requisições simultâneas? Mostre a conta. <em>Bloco 6.</em>',
          placeholder: 'Pesos = … KV = … Overhead = … Total = …',
          rubrica: [
            'Pesos: <code>27e9 × 0,58 / 1024³</code> ≈ 14,6 GB.',
            'KV pela fórmula, com a <strong>arquitetura declarada</strong> como suposição, multiplicando por <strong>contexto e concorrência</strong>.',
            'Soma com o <strong>overhead</strong> (1 a 2 GB) e compara com 24 GB.',
            'Conclui e propõe: reduzir contexto, concorrência ou subir de hardware; ou manter a etapa em API.'
          ],
          modelo: '<p>Pesos: 27e9 × 0,58 / 1024³ ≈ 14,6 GB. Supondo 32 camadas, 8 cabeças KV, dimensão 128 e KV a 2 bytes, o KV por token e por sequência é 2 · 32 · 8 · 128 · 2 = 131072 bytes; com 32768 tokens e 4 sequências são 16 GB. Somando 1,5 GB de overhead, o total é cerca de 32,1 GB, acima dos 24 GB: não cabe. Eu reduziria a concorrência ou o contexto, ou usaria uma GPU maior, e se isso não fechar manteria a etapa em API. A arquitetura real do modelo altera os números, mas o método é este.</p>' + reprova('contar só os pesos.') },

        { tipo: 'escreva', id: 'cp-p9', titulo: 'P9 · Perplexidade estável, quant agressivo', obrigatorio: false,
          enunciado: 'Por que perplexidade quase inalterada não autoriza quantização agressiva num produto que faz análise de código? Cite o número que sustenta a resposta e diga qual é o seu estatuto. <em>Bloco 6.</em>',
          placeholder: 'A perplexidade mede… A tarefa encadeada… O número é…',
          rubrica: [
            'A perplexidade mede <strong>surpresa média por token</strong> em texto corrido.',
            'Raciocínio encadeado <strong>amplifica o desvio</strong> a cada passo e quebra primeiro; senso comum decide por token e absorve o ruído.',
            'Cita o número ilustrativo (Q3 com queda próxima de 9 pontos em GSM8K, senso comum quase intacto) e diz que é <strong>exemplo variável, fonte a confirmar</strong> (SRC-M11-20).',
            'Manda <strong>medir com os evals próprios, por categoria</strong>, no quant específico.'
          ],
          modelo: '<p>A perplexidade resume a surpresa média por token em texto corrido; análise de código é uma cadeia de decisões dependentes, em que cada passo desvia um pouco e o desvio se propaga. Um quant pode manter a perplexidade quase igual e destruir a cadeia. O número que ilustra isso, Q3 com queda perto de 9 pontos em GSM8K enquanto senso comum fica quase intacto, é exemplo do formato da curva, de fonte a confirmar (SRC-M11-20), e não evidência: eu mediria com os evals próprios do M06, por categoria, no quant específico.</p>' + reprova('citar o número como fato estabelecido, ou aprovar o quant pela perplexidade.') },

        { tipo: 'escolha', id: 'cp-esc-p10', titulo: 'P10 · Aquecimento: por onde começar',
          pergunta: 'O modelo local "não funciona em modo agente". Qual é o melhor primeiro passo?',
          opcoes: [
            { id: 'a', texto: 'Trocar por um modelo maior.', correta: false, porque: 'só depois dos degraus de integração, com número.' },
            { id: 'b', texto: 'Verificar o chat template contra o cartão do Hub e o contexto contra o num_ctx.', correta: true, porque: 'são os degraus 1 e 2: os mais baratos e prováveis, e degradam sem erro.' },
            { id: 'c', texto: 'Fazer fine-tuning de tool calling.', correta: false, porque: 'é o degrau 6 de 6 da escada de decisão.' }
          ] },
        { tipo: 'escreva', id: 'cp-p10', titulo: 'P10 · As cinco primeiras hipóteses', obrigatorio: false,
          enunciado: 'O modelo local "não funciona em modo agente". Liste, em ordem, as cinco primeiras hipóteses que você testa antes de considerar trocar de modelo, com a verificação de cada uma. <em>Bloco 8.</em>',
          placeholder: '1) … 2) … 3) … 4) … 5) …',
          rubrica: [
            '1) <strong>Chat template</strong> errado ou ausente (comparar com o cartão no Hub).',
            '2) <strong>Contexto truncado</strong> em silêncio (tokens do prompt contra <code>num_ctx</code>).',
            '3) Modelo <strong>sem suporte nativo a tools</strong> (chamada trivial com <code>tools</code>).',
            '4) <strong>Formato da documentação</strong> das tools (JSON Schema e reexecutar o eval).',
            '5) <strong>Stop tokens</strong> errados (saída crua).',
            'Sabe que quant, tamanho do prompt e "o modelo é ruim" vêm depois, com número.'
          ],
          modelo: '<p>1) Template: comparo o template do servidor com o cartão do modelo e uso a tag instruct. 2) Contexto: conto os tokens do prompt contra o <code>num_ctx</code>. 3) Suporte a tools: testo uma chamada trivial e vejo o cartão. 4) Formato: troco a documentação para JSON Schema e reexecuto o eval. 5) Stop tokens: olho a saída crua para ver se ele simula o turno do usuário. Só depois vêm a quantização (rodar em Q8_0), o tamanho do prompt e dos schemas e, por último, "o modelo é ruim nisto", com número.</p>' + reprova('começar por trocar de modelo ou por fine-tuning.') },

        { tipo: 'escreva', id: 'cp-p11', titulo: 'P11 · Sensibilidade a formato', obrigatorio: false,
          enunciado: 'O que o BFCL V4 mediu sob o nome de "sensibilidade a formato", e qual mudança concreta isso provoca nas descrições das suas tools do M08/M09? <em>Bloco 8.</em>',
          placeholder: 'O mesmo modelo… Eu mudaria…',
          rubrica: [
            'O <strong>mesmo modelo</strong>, na mesma tarefa, muda de acurácia conforme o <strong>formato de apresentação</strong> (26 configurações em 5 dimensões).',
            'Documentação: tendência <strong>JSON &gt; XML &gt; Python</strong>; retorno em Python ou JSON supera XML.',
            'Mudança: padronizar as tools em <strong>JSON Schema</strong> e pedir retorno em JSON.',
            'Corolário: eval de um só formato mede o <strong>par (modelo, formato)</strong>; detalhes do BFCL <strong>a confirmar</strong>.'
          ],
          modelo: '<p>O BFCL V4 mostrou que o mesmo modelo, com a mesma informação, muda de acurácia só pela forma de apresentá-la: formato de retorno, formato da documentação das funções, tags de tool call, entre 26 configurações. Na documentação a tendência foi JSON acima de XML acima de Python, e retorno em XML foi pior. Na prática eu padronizaria as descrições de tool do M08 e do M09 em JSON Schema e pediria retorno em JSON. E meu eval passa a medir o par (modelo, formato). Os detalhes de versão e contagens ficam a confirmar contra o repositório.</p>' + reprova('"o formato é estético".') },

        { tipo: 'escolha', id: 'cp-esc-p12', titulo: 'P12 · Aquecimento: a base de conhecimento',
          pergunta: 'Um cliente pede fine-tuning para "o modelo aprender a nossa base de conhecimento". Qual é a resposta de consultor?',
          opcoes: [
            { id: 'a', texto: 'Fine-tuning com LoRA, que é barato.', correta: false, porque: 'LoRA ajusta distribuição, não insere fatos de forma confiável.' },
            { id: 'b', texto: 'RAG para o conhecimento; fine-tuning só para comportamento ou formato, e depois de medir os degraus anteriores.', correta: true, porque: 'conhecimento novo entra por RAG; o degrau 6 de 6 exige volume, dados de qualidade e manutenção.' },
            { id: 'c', texto: 'Um modelo maior, que já sabe tudo.', correta: false, porque: 'não conhece a base interna do cliente.' }
          ] },
        { tipo: 'escreva', id: 'cp-p12', titulo: 'P12 · Fine-tuning como ferramenta errada', obrigatorio: false,
          enunciado: 'Um cliente pede fine-tuning para "o modelo aprender a nossa base de conhecimento". Responda como consultor: por que isso é a ferramenta errada, e o que você propõe no lugar? <em>Bloco 8.</em>',
          placeholder: 'Fine-tuning ajusta… Eu proporia…',
          rubrica: [
            'Fine-tuning é <strong>ajuste de distribuição</strong>, não inserção de fatos; produz um modelo que alucina com o <strong>estilo</strong> dos dados.',
            'Propõe <strong>RAG</strong> (degrau 3): conhecimento por recuperação, reversível trocando o índice.',
            'Cita custos do degrau 6: <strong>esquecimento catastrófico</strong>, <strong>manutenção</strong> acoplada à versão do modelo-base e <strong>dados</strong> (milhares de exemplos de qualidade).',
            'Diz quando o fine-tuning é certo: <strong>comportamento ou formato</strong> em altíssimo volume, após medir os degraus anteriores.'
          ],
          modelo: '<p>Fine-tuning ajusta a distribuição do modelo e não insere fatos de forma confiável: o resultado tende a alucinar com o estilo da base do cliente. Eu proporia RAG, que leva o conhecimento por recuperação e se corrige trocando o índice, em dias. Fine-tuning é o degrau 6 de 6: pede milhares de exemplos de qualidade, pode degradar o que o modelo já fazia bem e vira manutenção, porque o adaptador acompanha uma versão do modelo-base. Ele só entra para comportamento ou formato muito específico em alto volume, depois de medir os degraus anteriores.</p>' + reprova('"treina o modelo com a base e pronto".') },

        { tipo: 'escreva', id: 'cp-p13', titulo: 'P13 · Quando local é mais caro', obrigatorio: false,
          enunciado: 'Em que condições local sai <em>mais caro</em> que API, e quais são os três motivos legítimos para escolher local mesmo assim? <em>Bloco 8.</em>',
          placeholder: 'Sai mais caro quando… Escolho local por…',
          rubrica: [
            'Custo local = <strong>hardware amortizado + energia</strong> por Mtok, com <strong>utilização</strong> declarada.',
            'Baixo volume e baixa utilização deixam o hardware dominar: local <strong>perde</strong> da API.',
            'Três motivos: <strong>dados que não podem sair</strong>, <strong>volume alto</strong> que dilui o hardware, <strong>custo previsível</strong>.',
            'Usa o <strong>break-even</strong> em relatórios por mês para decidir.'
          ],
          modelo: '<p>O custo local é o hardware amortizado mais a energia, por milhão de tokens, na utilização declarada. Com pouco volume e o hardware parado quase sempre, o hardware amortizado domina e o local sai mais caro que a API; a energia é a parte pequena. Escolho local mesmo assim quando os dados não podem sair da rede do cliente, quando o volume é alto o bastante para diluir o hardware ou quando o custo previsível importa. A decisão fecha no ponto de equilíbrio em relatórios por mês, nunca por ser "de graça".</p>' + reprova('"local é grátis".') },

        { tipo: 'texto', html:
          '<h3>Entregáveis verificáveis</h3>' +
          '<p>No <code>lab/</code> ou na trilha externa: atenção manual equivalente a SDPA, GPT mínimo com trajetória treino/val impressa e <code>uv run pytest -q</code> verde (oráculos executáveis; PostgreSQL e servidor live como BLOCKED registrado); <code>metrics.py</code> e <code>pct_incerto.sql</code> com logprobs resumidos (o SQL roda só no PostgreSQL do Capstone); <code>orcamento_vram.py</code>, <code>custo_local.py</code> e <code>dimensionar_local.py</code> rodando com números da <em>sua</em> máquina; servidor local (trilha externa, BLOCKED sem Ollama ou Docker) com <code>num_ctx</code>, <code>parallel</code> e <code>keep_alive</code> configurados e o <code>OllamaProvider</code> atrás da porta com <code>usage</code> preservado e custo 0.0; categoria <code>abstencao</code> com a rubrica assimétrica e o antes/depois da pontuação; tabela comparativa API × local por categoria, com p50, p95 e custo sobre mesma carga e fronteira declaradas; seção de diagnóstico com os 8 degraus testados na categoria de pior desempenho, cada um com o delta observado; <code>docs/adr/0005-modelos-locais.md</code> completo, com quadro por etapa, ponto de equilíbrio e gatilho de revisão; <code>compose --profile local</code> (trilha externa, BLOCKED sem Docker).</p>' },
        { tipo: 'texto', html: '<p class="ta-nota">Números de legado marcados como "a confirmar" (SRC-M11-19, SRC-M11-20 e os detalhes do BFCL em SRC-M11-18) não são evidência. Fontes e riscos estão nas notas de cada bloco; comportamentos de produto (Ollama, llama.cpp, vLLM, cartões do Hub) têm risco alto e revalidação em até 90 dias.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>mecanismo</mark> primeiro, a <mark>conta</mark> quando houver, e o que está <mark>a confirmar</mark> dito como tal.' }
      ] }
    ]
  });
})();
