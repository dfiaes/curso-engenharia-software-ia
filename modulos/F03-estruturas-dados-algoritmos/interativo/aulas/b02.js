/* F03 · Bloco 2: Sequências lineares. Fonte: F03.html#b02. Saídas: execução real do laboratório em 11/10/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'class FilaCircular:',
    '    """Fila em anel. Capacidade sempre potência de dois (mínimo 4)."""',
    '',
    '    def __init__(self):',
    '        self._buf = [None] * 4',
    '        self._head = 0',
    '        self._size = 0',
    '        self.redimensionamentos = 0',
    '',
    '    def __len__(self):',
    '        return self._size',
    '',
    '    def _slot(self, offset):',
    '        # CORRIJA: o i-ésimo elemento está em (cabeça + i) mod capacidade.',
    '        # Capacidade potência de dois: o mod vira máscara de bits (cap - 1).',
    '        return offset',
    '',
    '    def lista(self):',
    '        return [self._buf[self._slot(i)] for i in range(self._size)]',
    '',
    '    def _redimensionar(self, nova_cap):',
    '        novo = [None] * nova_cap',
    '        for i in range(self._size):',
    '            novo[i] = self._buf[self._slot(i)]',
    '        self._buf = novo',
    '        self._head = 0',
    '        self.redimensionamentos += 1',
    '',
    '    def append(self, x):',
    '        if self._size == len(self._buf):',
    '            self._redimensionar(len(self._buf) * 2)',
    '        self._buf[self._slot(self._size)] = x',
    '        self._size += 1',
    '',
    '    def popleft(self):',
    '        if self._size == 0:',
    '            raise IndexError("fila vazia")',
    '        item = self._buf[self._head]',
    '        # CORRIJA 1: solte a referência na posição antiga (vazamento de memória)',
    '        self._head = (self._head + 1) & (len(self._buf) - 1)',
    '        self._size -= 1',
    '        # CORRIJA 2: encolher à metade só quando a ocupação cair a 1/4 (histerese)',
    '        if len(self._buf) > 4 and self._size <= len(self._buf) // 2:',
    '            self._redimensionar(len(self._buf) // 2)',
    '        return item',
    ''].join('\n');
  var testes = [
    'def test_fifo_com_volta_no_anel():',
    '    f = FilaCircular()',
    '    for i in range(1, 5):',
    '        f.append(i)',
    '    assert f.popleft() == 1 and f.popleft() == 2',
    '    f.append(5)',
    '    f.append(6)',
    '    assert f.lista() == [3, 4, 5, 6]',
    '',
    '',
    'def test_vazia_levanta():',
    '    f = FilaCircular()',
    '    try:',
    '        f.popleft()',
    '    except IndexError:',
    '        return',
    '    assert False, "deveria levantar IndexError"',
    '',
    '',
    'def test_solta_a_referencia():',
    '    f = FilaCircular()',
    '    f.append("a")',
    '    f.append("b")',
    '    antiga = f._head',
    '    f.popleft()',
    '    assert f._buf[antiga] is None',
    '',
    '',
    'def test_encolhe_a_um_quarto():',
    '    f = FilaCircular()',
    '    for i in range(64):',
    '        f.append(i)',
    '    for _ in range(48):',
    '        f.popleft()',
    '    assert len(f) == 16 and len(f._buf) == 32',
    '',
    '',
    'def test_sem_thrashing_na_fronteira():',
    '    f = FilaCircular()',
    '    for i in range(64):',
    '        f.append(i)',
    '    for _ in range(32):',
    '        f.popleft()',
    '    antes = f.redimensionamentos',
    '    for i in range(100):',
    '        f.append(i)',
    '        f.popleft()',
    '    assert f.redimensionamentos == antes',
    '',
    '',
    'def test_controle_muitas_operacoes_poucos_redimensionamentos():',
    '    f = FilaCircular()',
    '    for i in range(10_000):',
    '        f.append(i)',
    '    for i in range(10_000):',
    '        assert f.popleft() == i',
    '    assert f.redimensionamentos < 40',
    ''].join('\n');
  var solucao = codigo
    .replace('        return offset', '        return (self._head + offset) & (len(self._buf) - 1)')
    .replace('        # CORRIJA 1: solte a referência na posição antiga (vazamento de memória)\n', '        self._buf[self._head] = None\n')
    .replace('self._size <= len(self._buf) // 2', 'self._size <= len(self._buf) // 4');

  TrilhaAula.registrar({
    id: 'f03-b2',
    titulo: 'Sequências lineares: array, lista ligada, pilha, fila e deque',
    minutos: 40,
    resumo: 'Quase toda estrutura elaborada é uma sequência com uma regra de acesso. O contêiner por trás dela decide se a operação é O(1) ou O(n): usar list como fila funciona com cem itens e trava com cem mil.',
    objetivo: 'Escolher entre list, deque e lista ligada pelo padrão de acesso, explicar por que pop(0) é caro e implementar um buffer circular com redimensionamento amortizado.',
    revisao: [
      { id: 'f03b2-list', pergunta: 'Por que <code>fila.pop(0)</code> numa <code>list</code> é O(n)?',
        opcoes: [
          opc('a', 'A lista é um array de ponteiros; remover o primeiro desloca todos os outros (um memmove)', true, 'esvaziar a fila pela frente vira O(n²); a troca de uma linha é <code>deque.popleft()</code>.'),
          opc('b', 'Porque o Python reordena a lista a cada remoção', false, 'não há reordenação; há deslocamento de ponteiros.'),
          opc('c', 'Porque pop(0) percorre a lista procurando o valor', false, 'não busca por valor; o custo é o deslocamento.')] },
      { id: 'f03b2-deque', pergunta: 'Qual o custo de <code>d[i]</code> no meio de um <code>deque</code>?',
        opcoes: [
          opc('a', 'O(n): o deque é uma lista ligada de blocos de 64 ponteiros, e o acesso anda pelos blocos', true, 'O(1) vale só nas duas pontas.'),
          opc('b', 'O(1), como numa list', false, 'quem precisa de índice e pontas ao mesmo tempo precisa de outra estrutura.'),
          opc('c', 'O(log n)', false, 'não há árvore por baixo.')] },
      { id: 'f03b2-histerese', pergunta: 'Por que o anel dobra a 100% e só encolhe a 25%, não a 50%?',
        opcoes: [
          opc('a', 'Com 50%, push e pop alternados na fronteira redimensionariam a cada operação (thrashing)', true, 'depois de cada redimensionamento a estrutura fica em 50% e precisa de pelo menos n/2 operações antes do próximo.'),
          opc('b', 'Porque memória é mais cara que tempo', false, 'não é o argumento; é o custo amortizado.'),
          opc('c', 'Porque encolher exige ordenar', false, 'encolher só copia na ordem.')] },
      { id: 'f03b2-ligada', pergunta: 'Quando a lista ligada tem O(1) de inserção?',
        opcoes: [
          opc('a', 'Quando você já tem o ponteiro para a posição; achar a posição é O(n)', true, 'é o princípio do LRU: dict para o nó numa lista duplamente ligada (<code>OrderedDict</code>).'),
          opc('b', 'Sempre, em qualquer posição', false, 'achar a posição por índice ou valor é O(n).'),
          opc('c', 'Só no fim da lista', false, 'o ganho vem de já ter o nó em mãos.')] },
      { id: 'f03b2-maxlen', pergunta: 'Qual o risco de <code>deque(maxlen=N)</code> numa fila de mensagens?',
        opcoes: [
          opc('a', 'Descarta silenciosamente o item mais antigo ao inserir; se a perda é erro de domínio, use limite explícito com exceção ou contrapressão', true, 'é ótimo para "últimas N mensagens", ruim para fila que não pode perder.'),
          opc('b', 'Levanta exceção ao encher', false, 'não levanta; descarta.'),
          opc('c', 'Bloqueia até haver espaço', false, 'quem bloqueia é <code>queue.Queue</code>.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Quase toda estrutura mais elaborada é uma sequência com uma regra de acesso: <strong>pilha</strong> (último a entrar, primeiro a sair), <strong>fila</strong> (primeiro a entrar, primeiro a sair) e <strong>deque</strong> (as duas pontas). A escolha do contêiner por trás dessa regra decide se a operação é O(1) ou O(n). O erro típico, em código gerado e humano, é usar <code>list</code> para tudo, inclusive como fila de tarefas.</p>' +
          '<h3>O mecanismo: <code>list</code> é um array de ponteiros</h3>' +
          '<p>Uma <code>list</code> do CPython é um bloco contíguo de ponteiros para objetos (<code>PyObject **ob_item</code>), mais o tamanho usado e a capacidade alocada. Isso explica a tabela inteira de custos:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Operação</th><th>Custo</th><th>Por quê</th></tr></thead><tbody>' +
          '<tr><td><code>a[i]</code>, <code>a[i] = x</code></td><td>O(1)</td><td>endereço = base + i·8</td></tr>' +
          '<tr><td><code>a.append(x)</code></td><td>O(1) amortizado</td><td>escreve no fim; realoca raramente</td></tr>' +
          '<tr><td><code>a.pop()</code></td><td>O(1)</td><td>decrementa o tamanho</td></tr>' +
          '<tr><td><code>a.pop(0)</code>, <code>a.insert(0, x)</code></td><td>O(n)</td><td>desloca todos os ponteiros (um <code>memmove</code>)</td></tr>' +
          '<tr><td><code>x in a</code>, <code>a.index(x)</code>, <code>a.remove(x)</code></td><td>O(n)</td><td>varredura com <code>==</code></td></tr>' +
          '<tr><td><code>a[i:j]</code></td><td>O(j−i)</td><td>copia os ponteiros (e incrementa as contagens de referência)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'abas', rotulo: 'Estrutura', itens: [
          { rotulo: 'list', blocos: [{ tipo: 'texto', html: '<ul><li>Índice <code>a[i]</code>: O(1)</li><li><code>append</code> / <code>pop()</code> no fim: O(1) amortizado</li><li><code>insert(0, x)</code>, <code>pop(0)</code>, meio: O(n), desloca tudo</li><li><code>x in a</code>: O(n)</li></ul>' }] },
          { rotulo: 'deque', blocos: [{ tipo: 'texto', html: '<ul><li><code>append</code>, <code>appendleft</code>, <code>pop</code>, <code>popleft</code>: O(1) nas duas pontas</li><li>Acesso pelo meio <code>d[i]</code>: O(n)</li><li>Com <code>maxlen</code>, descarta do lado oposto: ótimo para janelas</li></ul>' }] },
          { rotulo: 'Lista ligada', blocos: [{ tipo: 'texto', html: '<ul><li>Inserir ou remover <em>dado o nó</em>: O(1)</li><li>Achar o nó por posição ou valor: O(n)</li><li>Em Python, cada nó é um objeto: pior localidade que <code>list</code> e <code>deque</code></li></ul>' }] }
        ] },
        { tipo: 'takeaway', html: 'A <mark>list</mark> é rápida no índice e no fim; <mark>frente e meio são O(n)</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>O <code>memmove</code> é rápido (copia memória em bloco), por isso o custo de <code>pop(0)</code> só aparece com tamanho. O laboratório esvazia um contêiner pela frente e mede o tempo total.</p>' },
        { tipo: 'rode', id: 'b2-pop0', titulo: 'Esvazie pela frente: list contra deque', prefixo: '$', entrada: 'uv run python -m algos.bench', unidade: 'x', terminalTitulo: 'medido nesta máquina',
          enunciado: 'Tempo total para esvaziar um contêiner pela frente (ms), com n dobrando. Observe o fator de crescimento de cada coluna.',
          prever: { pergunta: 'Quando n dobra de 40.000 para 80.000, por quanto o tempo total de <code>list.pop(0)</code> se multiplica?', opcoes: [
            { id: 'a', texto: 'Cerca de 2: linear', correta: false, porque: 'cada pop(0) já é O(n); o total é O(n²).' },
            { id: 'b', texto: 'Cerca de 4: quadrático', correta: true, porque: 'medido: ≈4,3 / 4,7 / 4,1 ao dobrar n; o deque multiplicou por ≈1,8 / 2,2 / 1,9.' },
            { id: 'c', texto: 'Cerca de 8: cúbico', correta: false, porque: 'o total é soma de n deslocamentos de até n ponteiros: n².' }
          ] },
          etapas: [
            { id: 'tab', nome: 'Tabela de tempos', descricao: 'ms para esvaziar pela frente', tom: 'request', ms: 4.1, linhas: [
              L('out', 'n=10.000   list.pop(0)   5,31   deque.popleft 0,14   CircularDeque 1,77   lista/deque  38x'),
              L('out', 'n=20.000   list.pop(0)  23,10   deque.popleft 0,25   CircularDeque 3,90   lista/deque  92x'),
              L('out', 'n=40.000   list.pop(0) 109,22   deque.popleft 0,54   CircularDeque 7,36   lista/deque 203x'),
              L('out', 'n=80.000   list.pop(0) 448,20   deque.popleft 1,03   CircularDeque 15,30  lista/deque 434x'),
              L('hint', 'o anel em Python puro do lab é linear, com constante ~7x a do deque em C')] },
            { id: 'anel', nome: 'Anel com redimensionamento', descricao: 'python -m algos.demo deque', tom: 'response', ms: 1, linhas: [
              L('cmd', 'uv run python -m algos.demo deque'),
              L('out', 'append 1: len=1 capacity=4'),
              L('out', '...'),
              L('out', 'append 5: len=5 capacity=8'),
              L('out', 'popleft -> 1: len=4 capacity=8'),
              L('out', 'popleft -> 2: len=3 capacity=8'),
              L('out', 'popleft -> 3: len=2 capacity=4'),
              L('out', 'after appendleft(0): [0, 4, 5]'),
              L('hint', 'dobra ao encher (4 → 8); encolhe a 1/4 (8 → 4 com len=2)')] }
          ],
          tutorDepois: 'A ordem vence a constante só a partir de certo n; o deque em C vence nos dois.',
          callout: 'Você viu list quadrática, deque linear e o anel dobrando e encolhendo.' },
        { tipo: 'texto', html:
          '<h3>Pilha, fila e deque na prática</h3>' +
          '<ul><li><strong>Pilha</strong>: <code>list</code> com <code>append</code>/<code>pop</code>. Chamadas de função, desfazer, parênteses, DFS iterativa, expressões.</li>' +
          '<li><strong>Fila</strong>: <code>collections.deque</code> com <code>append</code>/<code>popleft</code>. BFS, filas de tarefas em memória, buffers de eventos. Entre threads, <code>queue.Queue</code> (travas e bloqueio, custa mais); entre corrotinas, <code>asyncio.Queue</code>.</li>' +
          '<li><strong>Deque</strong>: as duas pontas em O(1). Com <code>maxlen</code> vira janela deslizante que descarta o mais antigo, útil para "últimas N mensagens" de uma conversa com o modelo.</li></ul>' +
          '<p>O <code>deque</code> do CPython é uma lista duplamente ligada de <em>blocos</em> de 64 ponteiros: O(1) nas pontas, mas <code>d[i]</code> no meio é O(n). Quem precisa de acesso aleatório e pontas ao mesmo tempo precisa de outra estrutura, e a resposta é perguntar de novo qual é o padrão de acesso.</p>' +
          '<h3>Lista ligada: ensina mais do que serve</h3>' +
          '<p>Cada nó guarda valor e ponteiro para o próximo. Inserir ou remover <em>numa posição já conhecida</em> é O(1), mas achar a posição é O(n). Em Python quase nunca vale: cada nó é um objeto com cabeçalho, cada passo é um salto de memória que derrota o cache (bloco 1) e o <code>deque</code> cobre o caso útil. A ideia que fica: <strong>O(1) de inserção exige já ter o ponteiro para a posição</strong>. É o princípio de um cache LRU: um <code>dict</code> guarda a chave e aponta para o nó numa lista duplamente ligada para mover-para-frente em O(1) (a <code>collections.OrderedDict</code> faz isso).</p>' },
        { tipo: 'takeaway', html: 'Fila é <mark>deque</mark>; lista ligada vale pela ideia do <mark>ponteiro na mão</mark>, não pela implementação em Python.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>O anel (ring buffer) com redimensionamento</h3>' +
          '<p>A forma clássica de fila O(1) em array: guarde o índice da <strong>cabeça</strong> e o tamanho; o i-ésimo elemento está em <code>(cabeça + i) mod capacidade</code>. Nada se desloca. A capacidade é potência de dois, então o módulo vira máscara de bits. Dobra quando enche e <em>reduz à metade quando fica com um quarto</em>.</p>' +
          '<p>Por que um quarto e não a metade? Com 50%, "um push, um pop" na fronteira redimensionaria a cada operação: O(n) por chamada, o <em>thrashing</em>. Dobrando em 100% e encolhendo em 25%, depois de cada redimensionamento a estrutura fica em 50% e precisa de pelo menos n/2 operações antes do próximo: o custo O(n) é pago por esse crédito. É o método do potencial em versão operacional.</p>' },
        { tipo: 'python', id: 'b2-python', titulo: 'Conserte o anel: posição, vazamento e histerese', obrigatorio: false,
          enunciado: 'A <code>FilaCircular</code> abaixo tem três defeitos marcados com <code>CORRIJA</code>: o cálculo da posição ignora a cabeça, <code>popleft</code> não solta a referência e o encolhimento acontece a 50%. Corrija e rode os testes.',
          codigo: codigo, testes: testes,
          dica: '<code>_slot</code>: <code>(self._head + offset) &amp; (len(self._buf) - 1)</code>. Em <code>popleft</code>: <code>self._buf[self._head] = None</code> antes de mover a cabeça, e a condição de encolher é <code>self._size &lt;= len(self._buf) // 4</code>.',
          solucao: solucao,
          tutorDepois: 'O teste de fronteira só passa com a histerese: é o controle negativo do thrashing.',
          callout: 'O anel passou com posição, liberação de referência e histerese corretas.' },
        { tipo: 'transcript', id: 'b2-transcript', titulo: 'Ache a afirmação que a sessão não sustenta', obrigatorio: false, terminalTitulo: 'sessão: fila de tarefas',
          enunciado: 'O agente trocou <code>pop(0)</code> por um índice de cabeça. Uma das afirmações dele esconde um problema. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'O worker trava com 500 mil tarefas. Corrija a fila.' },
            { quem: 'agente', texto: 'O pop(0) é O(n). Troquei por um índice: i += 1 e leio fila[i].' },
            { quem: 'ferramenta', texto: '$ python bench.py\nn=500000  concluído; a razão ao dobrar n caiu de ≈4 para ≈2' },
            { quem: 'agente', texto: 'Resolvido: tempo O(1) por tarefa e sem custo extra de memória.' }
          ],
          erradas: [3],
          explicacao: { 3: 'o tempo ficou O(1), mas os elementos consumidos continuam vivos na lista até alguém recortar: em fluxo longo a memória cresce sem limite. O anel do lab faz <code>self._buf[self._head] = None</code> justamente para soltar a referência; <code>deque.popleft()</code> resolve as duas coisas.' },
          tutorDepois: 'Tempo O(1) com vazamento não é correção: é troca de um problema por outro.' },
        { tipo: 'takeaway', html: 'Dobre em <mark>100%</mark>, encolha em <mark>25%</mark> e solte a <mark>referência</mark> do que saiu.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>Trade-offs</h3><table><thead><tr><th>Preciso de…</th><th>Use</th><th>Custo a saber</th></tr></thead><tbody>' +
          '<tr><td>acesso por índice, iteração rápida, cauda como pilha</td><td><code>list</code></td><td>frente e meio são O(n)</td></tr>' +
          '<tr><td>fila ou janela com as duas pontas</td><td><code>deque</code></td><td>índice no meio é O(n)</td></tr>' +
          '<tr><td>números densos, muita memória</td><td><code>array.array</code> / NumPy</td><td>tipo homogêneo; vetorizado só em NumPy</td></tr>' +
          '<tr><td>fila entre threads</td><td><code>queue.Queue</code></td><td>travas; bloqueia; <code>task_done</code>/<code>join</code></td></tr>' +
          '<tr><td>mover itens para a frente por uso (LRU)</td><td><code>OrderedDict</code> ou <code>dict</code> + lista ligada</td><td>memória extra por nó</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          '<p><strong>Fila com <code>list</code> e um índice de cabeça "para não deslocar".</strong> Resolve o tempo e cria vazamento: os consumidos ficam vivos até alguém recortar. E <code>deque</code> com <code>maxlen</code> descarta <em>silenciosamente</em> o mais antigo ao inserir; se a perda é erro de domínio, use um limite explícito que levante exceção ou aplique contrapressão.</p>' },
        { tipo: 'escolha', id: 'b2-esc-fila', titulo: 'Confira: 1 milhão de tarefas',
          pergunta: 'Você processa 1 milhão de tarefas com <code>fila.pop(0)</code> numa <code>list</code>. Qual o problema e a correção?',
          opcoes: [
            { id: 'a', texto: 'Nenhum: pop(0) é O(1).', correta: false, porque: 'desloca todos os ponteiros.' },
            { id: 'b', texto: 'Memória: trocar por tupla.', correta: false, porque: 'tupla é imutável; não resolve nem serve de fila.' },
            { id: 'c', texto: 'Cada pop(0) desloca tudo (O(n)) e o total vira O(n²); use <code>collections.deque</code> com <code>popleft()</code>.', correta: true, porque: 'medido: 448 ms contra 1 ms em 80 mil itens, e a diferença cresce com n.' },
            { id: 'd', texto: 'pop(0) falha com listas grandes; use try/except.', correta: false, porque: 'não falha: fica lento.' }
          ], tutorDepois: 'Causa, correção e a medição que prova (razão ≈4 contra ≈2 ao dobrar n).' },
        { tipo: 'escolha', id: 'b2-esc-histerese', titulo: 'Confira: encolher a 50%',
          pergunta: 'No anel, o que acontece se encolher a capacidade quando a ocupação cai a 50%?',
          opcoes: [
            { id: 'a', texto: 'Nada: o custo é o mesmo.', correta: false, porque: 'depois de dobrar, a estrutura fica em 50%.' },
            { id: 'b', texto: 'Um push/pop alternado na fronteira redimensiona a cada operação, e o O(1) amortizado se perde.', correta: true, porque: 'a histerese (dobra em 100%, encolhe em 25%) deixa um intervalo largo entre os gatilhos.' },
            { id: 'c', texto: 'Os elementos saem de ordem.', correta: false, porque: 'a cópia preserva a ordem; o problema é o custo.' }
          ], tutorDepois: 'Cada redimensionamento precisa ser pago por muitas operações baratas.' },
        { tipo: 'texto', html: '<p class="ta-nota">Medições e saídas do laboratório (<code>algos.bench</code>, <code>algos.demo deque</code>) em 11/10/2026, CPython 3.14.7 aarch64; os valores absolutos variam por máquina. Detalhes do <code>deque</code> (blocos de 64 ponteiros) são do CPython atual; revalide ao trocar de versão.</p>' },
        { tipo: 'takeaway', html: 'Escolha o contêiner pelo <mark>padrão de acesso</mark> e confirme a <mark>razão</mark> ao dobrar n.' }
      ] }
    ]
  });
})();
