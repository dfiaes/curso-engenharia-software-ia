/* F03 · Checkpoint: sete cenários, avaliação sem consulta. Fonte: F03.html#checkpoint. Rubrica = "Basta"; modelo = resposta esperada. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'f03-checkpoint',
    titulo: 'Checkpoint F03',
    minutos: 50,
    resumo: 'Sete cenários sobre custo, estruturas, grafos e técnicas, sem consulta. Responda por escrito, em poucas linhas, e confira com a rubrica "Basta".',
    objetivo: 'Verificar, sem consulta, se você estima custo, escolhe a estrutura pelo padrão de acesso, escreve busca binária com invariante, modela grafos e escolhe a técnica certa para um problema novo.',
    revisao: [
      { id: 'f03cp-popzero', pergunta: 'Um worker consome tarefas com <code>fila.pop(0)</code>. Com 500 mil tarefas passa de minutos. Causa e correção?',
        opcoes: [
          opc('a', '<code>pop(0)</code> desloca todos os ponteiros (O(n)), esvaziar é O(n²); troque por <code>deque.popleft()</code> e meça n e 2n (razão ≈4 contra ≈2)', true, 'um índice de cabeça sem tratar a retenção de memória e sem medir reprova.'),
          opc('b', 'O Python é lento; use threads', false, 'não ataca a ordem de crescimento.'),
          opc('c', 'Use uma tupla', false, 'tupla é imutável.')] },
      { id: 'f03cp-hash', pergunta: '<code>__eq__</code> compara <code>id</code> e <code>itens</code>, <code>__hash__</code> usa só <code>hash(self.id)</code>. O contrato hash/eq está violado quando alguém adiciona itens?',
        opcoes: [
          opc('a', 'Não: iguais continuam com o mesmo hash, porque o hash usa só o <code>id</code> imutável; o problema é a igualdade mutável sob o contêiner', true, 'melhor: chave pelo <code>id</code> e o pedido como valor, ou dataclass congelada.'),
          opc('b', 'Sim: o hash precisa incluir todos os campos', false, 'incluir campos mutáveis é que perderia a chave.'),
          opc('c', 'Sim: o dict se reorganiza sozinho ao mutar', false, 'o dict não reexecuta o hash.')] },
      { id: 'f03cp-top20', pergunta: 'Como achar os 20 IPs mais frequentes de um log de 80 GB com 16 GB de memória?',
        opcoes: [
          opc('a', 'Contar em passada única com <code>Counter</code> (se os distintos couberem) e <code>heapq.nlargest(20, …)</code>; senão particionar por hash do IP, contar cada partição e mesclar os top-20 locais', true, 'IPs disjuntos entre partições: o top global está na união dos top-20 locais.'),
          opc('b', 'Carregar o arquivo inteiro e ordenar', false, 'não cabe e é O(n log n).'),
          opc('c', 'Amostrar sem dizer o erro', false, 'amostragem exige declarar o erro.')] },
      { id: 'f03cp-topo', pergunta: 'Para um monorepo de 400 pacotes, como calcular a ordem de build e reconstruir só o que mudou?',
        opcoes: [
          opc('a', 'Kahn em O(V+E) sobre pré-requisito → dependente, com um ciclo concreto no erro; para o incremental, BFS/DFS nas arestas inversas a partir dos pacotes alterados', true, 'ordenar por nome ou profundidade sem tratar ciclos reprova.'),
          opc('b', 'Ordenar os pacotes por nome', false, 'ignora as dependências.'),
          opc('c', 'Rodar tudo em paralelo', false, 'não respeita pré-requisitos.')] },
      { id: 'f03cp-mochila', pergunta: 'Escolher mensagens para caber em 8.000 tokens maximizando a relevância somada: o guloso por pontuação/custo resolve?',
        opcoes: [
          opc('a', 'Não em geral: é mochila 0/1; use DP O(n·W) para o exato, ou o guloso declarado como aproximação e comparado com a DP em amostras', true, 'afirmar que o guloso é ótimo sem prova, ou forçar 2ⁿ subconjuntos, reprova.'),
          opc('b', 'Sim: o guloso por razão é sempre ótimo', false, 'pode desperdiçar espaço com um item grande e valioso.'),
          opc('c', 'Força bruta sobre os 2ⁿ subconjuntos', false, 'inviável.')] }
    ],
    abas: [
      { rotulo: 'Custo, hash e top-k', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que <strong>basta</strong>. "Reprova" é a resposta que indica que o bloco precisa ser relido; reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: a medição',
          pergunta: 'Para provar que o <code>pop(0)</code> é a causa da lentidão, qual medição basta?',
          opcoes: [
            { id: 'a', texto: 'Medir uma vez com 500 mil tarefas.', correta: false, porque: 'uma execução não distingue classes.' },
            { id: 'b', texto: 'Medir o tempo para n e 2n (várias repetições, mínimo) e comparar a razão: ≈4 indica quadrático, ≈2 linear.', correta: true, porque: 'é a razão entre tamanhos que revela a ordem de crescimento.' },
            { id: 'c', texto: 'Trocar o servidor por um mais rápido.', correta: false, porque: 'não altera a ordem de crescimento.' }
          ], tutorDepois: 'Meça com mínimo de repetições e pelo menos três tamanhos.' },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Fila de tarefas lenta', obrigatorio: false,
          enunciado: 'Um worker consome tarefas de uma <code>list</code> com <code>fila.pop(0)</code>. Com 5 mil tarefas está ótimo; com 500 mil, passa de minutos. Explique a causa, dê a correção e diga que medição provaria a hipótese. <em>Blocos 1–2.</em>',
          placeholder: 'A causa é… A correção é… Eu mediria…',
          rubrica: [
            '<code>pop(0)</code> é <strong>O(n)</strong> (desloca todos os ponteiros); esvaziar a fila é <strong>O(n²)</strong>.',
            'Trocar por <code>deque.popleft()</code>.',
            'Medir o tempo para <strong>n e 2n</strong> e ver a razão ≈4 contra ≈2.'
          ],
          modelo: '<p><code>pop(0)</code> numa <code>list</code> desloca todos os ponteiros restantes, então cada chamada é O(n) e esvaziar a fila é O(n²): com 100x mais tarefas, 10.000x mais trabalho. A correção é <code>collections.deque</code> com <code>popleft()</code>, O(1). Para provar, meço o tempo de esvaziar com n e 2n (mínimo de várias repetições): a lista deve multiplicar por ≈4 e o deque por ≈2.</p>' + reprova('"o Python é lento", "usar threads", ou propor um índice de cabeça sem tratar a retenção de memória e sem medir.') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Chave de dicionário', obrigatorio: false,
          enunciado: 'Uma classe <code>Pedido</code> define <code>__eq__</code> comparando <code>id</code> e <code>itens</code>, e <code>__hash__</code> como <code>hash(self.id)</code>. Alguém adiciona itens a um pedido já inserido num dict. O que acontece, o contrato está violado e como desenhar melhor? <em>Bloco 3.</em>',
          placeholder: 'O contrato… O que muda é… Eu desenharia…',
          rubrica: [
            'O contrato (iguais ⇒ mesmo hash) <strong>não</strong> é violado, porque o hash usa só o <code>id</code>, imutável.',
            'O problema é a <strong>igualdade mutável</strong>: dois pedidos "iguais" deixam de ser, sem mudar de lugar no contêiner.',
            'Melhor: chave pelo <code>id</code> e o pedido como valor, ou <strong>dataclass congelada</strong>.'
          ],
          modelo: '<p>O contrato não é violado: o hash vem só do <code>id</code>, que não muda, então a chave continua no slot certo e o dict segue funcionando. O defeito é outro: o <code>__eq__</code> depende de <code>itens</code>, que muda, e a semântica de igualdade muda sob os pés do contêiner. Eu usaria o <code>id</code> (imutável) como chave e o pedido como valor, ou uma dataclass congelada.</p>' + reprova('dizer que o hash precisa incluir todos os campos, ou que o dict "se reorganiza sozinho" ao mutar.') },

        { tipo: 'escolha', id: 'cp-esc-p3', titulo: 'P3 · Aquecimento: onde está o limite',
          pergunta: 'No log de 80 GB, o que precisa caber em 16 GB de memória na estratégia de passada única?',
          opcoes: [
            { id: 'a', texto: 'O arquivo inteiro.', correta: false, porque: 'lê-se em fluxo; o arquivo não precisa caber.' },
            { id: 'b', texto: 'O contador de IPs <em>distintos</em> (se não couber, particionar por hash do IP).', correta: true, porque: 'depois, <code>heapq.nlargest(20, …)</code> sobre os contadores em O(d log 20).' },
            { id: 'c', texto: 'Uma cópia ordenada de todas as linhas.', correta: false, porque: 'ordenar tudo é O(n log n) e exige O(n) de memória.' }
          ], tutorDepois: 'O gargalo de memória é o número de chaves distintas, não o tamanho do arquivo.' },
        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Os 20 mais frequentes', obrigatorio: false,
          enunciado: 'Há um arquivo de log de 80 GB. Você precisa dos 20 IPs mais frequentes, com uma máquina de 16 GB. Descreva a estratégia e o custo. <em>Blocos 3–4.</em>',
          placeholder: 'Eu contaria… Depois… Se não couber…',
          rubrica: [
            'Contar em <strong>passada única</strong> com <code>Counter</code> se os IPs <strong>distintos</strong> couberem (o arquivo não precisa caber).',
            '<code>heapq.nlargest(20, …)</code>, <strong>O(d log 20)</strong>.',
            'Se os distintos não couberem: <strong>particionar por hash do IP</strong>, contar cada partição e mesclar os top-20 locais (os IPs são disjuntos entre partições).'
          ],
          modelo: '<p>Leio o arquivo em fluxo e conto com <code>Counter</code> em uma passada, se o número de IPs distintos d couber em memória; o arquivo não precisa caber. Depois pego os 20 maiores com <code>heapq.nlargest(20, ...)</code>, um min-heap de tamanho 20, em O(d log 20). Se os distintos não couberem, particiono os IPs por hash em N arquivos, conto cada partição e mesclo os top-20 locais: como os IPs são disjuntos entre partições, o top global está na união dos top-20 de cada uma. Para hash de partição entre processos uso <code>hashlib</code>, não <code>hash()</code>.</p>' + reprova('carregar o arquivo inteiro ou ordenar tudo sem justificar; ou propor top-20 por amostragem sem dizer o erro.') },
        { tipo: 'takeaway', html: 'Meça a <mark>razão</mark>, respeite o <mark>contrato hash/eq</mark> e use <mark>min-heap de tamanho k</mark> para o top-k.' }
      ] },

      { rotulo: 'Busca, grafos e técnicas', blocos: [
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Busca binária sem erro', obrigatorio: false,
          enunciado: 'Escreva (ou descreva) a busca do primeiro índice com <code>a[i] &gt;= x</code> em array ordenado, com o invariante, e diga como contar as ocorrências de x. <em>Bloco 5.</em>',
          placeholder: 'Intervalo… Invariante… Atualizações… Contagem…',
          rubrica: [
            'Intervalo <code>[lo, hi)</code>; invariante <code>a[:lo] &lt; x</code> e <code>a[hi:] &gt;= x</code>.',
            '<code>lo = mid + 1</code> se <code>a[mid] &lt; x</code>, senão <code>hi = mid</code>; devolve <code>lo</code>.',
            'Contagem = <code>upper_bound(x) − lower_bound(x)</code>.',
            'Bordas tratadas: vazio, um elemento, x menor que tudo, maior que tudo.'
          ],
          modelo: '<p>Uso o intervalo semiaberto <code>[lo, hi)</code> com <code>lo, hi = 0, len(a)</code> e o invariante <code>a[:lo] &lt; x</code> e <code>a[hi:] &gt;= x</code>, que vale por vacuidade no início. Enquanto <code>lo &lt; hi</code>, <code>mid = (lo + hi) // 2</code>; se <code>a[mid] &lt; x</code>, <code>lo = mid + 1</code> (a[:mid+1] é menor que x); senão <code>hi = mid</code>. Ao sair com <code>lo == hi</code>, devolvo <code>lo</code>, o ponto de inserção. A distância <code>hi − lo</code> diminui a cada passo, então termina. A contagem de x é <code>upper_bound(x) − lower_bound(x)</code>. Vazio devolve 0, x menor que tudo devolve 0 e maior que tudo devolve <code>len(a)</code>.</p>' + reprova('código sem justificativa de cada atualização, ou que funcione só em entradas "normais".') },

        { tipo: 'escolha', id: 'cp-esc-p5', titulo: 'P5 · Aquecimento: o ciclo',
          pergunta: 'Ao rodar o algoritmo de Kahn, sobraram 3 nós sem processar. O que isso significa e o que reportar?',
          opcoes: [
            { id: 'a', texto: 'Há ciclo; reportar um ciclo concreto entre os restantes (cada restante tem um pré-requisito que também restou).', correta: true, porque: 'uma mensagem acionável indica qual dependência remover.' },
            { id: 'b', texto: 'Esses 3 nós não têm dependências; processe-os no fim.', correta: false, porque: 'sobraram justamente porque nunca chegaram a zero pré-requisitos pendentes.' },
            { id: 'c', texto: 'O grafo está desconexo; ignore os 3.', correta: false, porque: 'desconexo não impede a ordenação; ciclo sim.' }
          ], tutorDepois: 'Kahn detecta ciclo pelas sobras.' },
        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Ordem de build', obrigatorio: false,
          enunciado: 'Um monorepo tem 400 pacotes com dependências declaradas. Diga como calcular a ordem de build, como reportar um ciclo de forma útil e como reconstruir só o que mudou. <em>Bloco 6.</em>',
          placeholder: 'Modelo… Algoritmo… Ciclo… Incremental…',
          rubrica: [
            'Grafo direcionado <strong>pré-requisito → dependente</strong>; <strong>Kahn em O(V+E)</strong>.',
            'Ao falhar, extrair e mostrar <strong>um ciclo concreto</strong> entre os nós remanescentes.',
            'Incremental: BFS/DFS sobre as <strong>arestas inversas</strong> a partir dos pacotes alterados, para achar os dependentes transitivos.'
          ],
          modelo: '<p>Modelo os pacotes como um grafo direcionado de pré-requisito para dependente e uso o algoritmo de Kahn, O(V+E): enfileiro os de zero pré-requisitos pendentes e vou decrementando os dependentes. Se sobrarem nós, há ciclo; sigo de cada remanescente um pré-requisito que também restou até repetir um nó e mostro esse ciclo ("a -> b -> c -> a"), para que se saiba qual dependência remover. Para reconstruir só o que mudou, faço BFS/DFS sobre as arestas inversas a partir dos pacotes alterados e obtenho os dependentes transitivos, reconstruindo-os na ordem topológica.</p>' + reprova('tentar ordenar por nome ou profundidade sem tratar ciclos, ou "rodar tudo em paralelo".') },

        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Escolha de técnica', obrigatorio: false,
          enunciado: 'Você precisa escolher mensagens para caber num contexto de 8.000 tokens maximizando a relevância somada, onde cada mensagem tem custo em tokens e uma pontuação. Guloso por pontuação/custo resolve? O que fazer? <em>Bloco 7.</em>',
          placeholder: 'O problema é… O guloso… Eu faria…',
          rubrica: [
            'É <strong>mochila 0/1</strong>.',
            'O guloso por razão pontuação/custo <strong>não é ótimo em geral</strong> (um item grande e valioso pode desperdiçar espaço).',
            '<strong>DP pseudo-polinomial O(n·W)</strong> (W = 8.000) para o exato, ou guloso como aproximação declarada e comparada com a DP em amostras.',
            'Menciona que mensagens contíguas e a recência mudam o modelo.'
          ],
          modelo: '<p>É uma mochila 0/1: cada mensagem entra inteira ou não. O guloso por razão pontuação/custo não é ótimo em geral: pode deixar espaço sobrando por causa de um item grande e valioso. Para a solução exata uso DP pseudo-polinomial, O(n·W) com W = 8.000. Se o custo da DP for um problema, uso o guloso como aproximação declarada e comparo com a DP em amostras. Mensagens contíguas e a recência mudam o modelo (por exemplo, exigir a última mensagem ou blocos contíguos), e eu validaria a escolha final contra uma força bruta em entradas pequenas.</p>' + reprova('afirmar que o guloso é ótimo sem prova, ou força bruta sobre 2ⁿ subconjuntos.') },

        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Revisão de código de IA', obrigatorio: false,
          enunciado: 'Um agente gerou uma função que "encontra os documentos duplicados" com dois laços aninhados sobre uma lista de 200 mil documentos e testes com 10 itens. Faça o roteiro de revisão do bloco 7. <em>Todo o módulo.</em>',
          placeholder: 'O custo é… Eu proporia… Testaria contra… Mediria…',
          rubrica: [
            'Declarar o <strong>O(n²)</strong> (≈ 2·10¹⁰ comparações).',
            'Propor chave de igualdade (<strong>hash do conteúdo normalizado</strong>) e agrupamento em dict em <strong>O(n)</strong>.',
            'Manter a versão de dois laços como <strong>oráculo</strong> em testes com entradas aleatórias pequenas.',
            'Testar bordas (vazio, todos iguais, quase iguais) e <strong>medir com n crescente</strong>.'
          ],
          modelo: '<p>Dois laços sobre 200 mil documentos são O(n²), cerca de 2·10¹⁰ comparações, e os testes de 10 itens nunca mostrariam isso. Proponho uma chave de igualdade, como o hash do conteúdo normalizado (SHA-256 por <code>hashlib</code>, não <code>hash()</code>), e agrupo em um dict em O(n). Mantenho a versão de dois laços como oráculo e comparo as duas em entradas aleatórias pequenas; testo as bordas (vazio, todos iguais, quase iguais) e meço com n crescente para ver a razão ≈2 em vez de ≈4.</p>' + reprova('aceitar porque os testes passam, ou "otimizar" trocando a lista por um array NumPy sem mudar a ordem de crescimento.') },
        { tipo: 'texto', html: '<p class="ta-nota">Estado verificado em 11/10/2026 (CPython 3.14.7). Detalhes internos do CPython (fator de crescimento da lista, layout do dict, política de fusão do Timsort) mudam entre versões menores; revalide em até 90 dias ou ao trocar o interpretador.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>custo</mark> primeiro, depois a <mark>estrutura ou técnica</mark> e a <mark>medição</mark> que a confirma.' }
      ] }
    ]
  });
})();
