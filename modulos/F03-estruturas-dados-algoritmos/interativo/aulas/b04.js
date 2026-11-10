/* F03 · Bloco 4: Árvores e heaps. Fonte: F03.html#b04. Saídas: execução real do laboratório em 11/10/2026 (CPython 3.14.7). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'class BinaryHeap:',
    '    """Min-heap num array: filhos de i em 2i+1 e 2i+2, pai em (i-1)//2."""',
    '',
    '    def __init__(self):',
    '        self._a = []',
    '        self.comparacoes = 0',
    '',
    '    def __len__(self):',
    '        return len(self._a)',
    '',
    '    def _lt(self, x, y):',
    '        self.comparacoes += 1',
    '        return x < y',
    '',
    '    def peek(self):',
    '        if not self._a:',
    '            raise IndexError("heap vazio")',
    '        return self._a[0]',
    '',
    '    def push(self, x):',
    '        self._a.append(x)',
    '        self._subir(len(self._a) - 1)',
    '',
    '    def pop(self):',
    '        if not self._a:',
    '            raise IndexError("heap vazio")',
    '        a = self._a',
    '        topo = a[0]',
    '        ultimo = a.pop()',
    '        if a:',
    '            a[0] = ultimo',
    '            self._descer(0)',
    '        return topo',
    '',
    '    def _subir(self, i):',
    '        # CORRIJA: enquanto o elemento for menor que o pai, troque com ele',
    '        pass',
    '',
    '    def _descer(self, i):',
    '        # CORRIJA: troque com o MENOR dos filhos enquanto ele for menor que a[i]',
    '        pass',
    '',
    '',
    'def top_k(itens, k, heap=None):',
    '    """Os k maiores, do maior para o menor: min-heap de tamanho k, O(n log k)."""',
    '    if k <= 0:',
    '        return []',
    '    heap = heap if heap is not None else BinaryHeap()',
    '    for item in itens:',
    '        if len(heap) < k:',
    '            heap.push(item)',
    '        elif heap._lt(heap.peek(), item):   # bate o pior dos k melhores',
    '            heap.pop()',
    '            heap.push(item)',
    '    resultado = []',
    '    while len(heap):',
    '        resultado.append(heap.pop())',
    '    resultado.reverse()',
    '    return resultado',
    ''].join('\n');
  var testes = [
    'import random',
    '',
    '',
    'def test_pops_saem_em_ordem():',
    '    h = BinaryHeap()',
    '    for x in (5, 3, 8, 1, 9, 2):',
    '        h.push(x)',
    '    assert [h.pop() for _ in range(6)] == [1, 2, 3, 5, 8, 9]',
    '',
    '',
    'def test_estado_do_array_apos_seis_pushes():',
    '    h = BinaryHeap()',
    '    for x in (5, 3, 8, 1, 9, 2):',
    '        h.push(x)',
    '    assert h._a == [1, 3, 2, 5, 9, 8]',
    '',
    '',
    'def test_invariante_apos_operacoes_aleatorias():',
    '    r = random.Random(7)',
    '    h = BinaryHeap()',
    '    for _ in range(500):',
    '        h.push(r.randint(0, 1000))',
    '    for _ in range(100):',
    '        h.pop()',
    '    a = h._a',
    '    assert all(a[(i - 1) // 2] <= a[i] for i in range(1, len(a)))',
    '',
    '',
    'def test_top_k_exemplo():',
    '    assert top_k([31, 4, 15, 92, 6, 53, 58, 97, 93, 23], 3) == [97, 93, 92]',
    '',
    '',
    'def test_bordas_k_maior_que_n_k_zero_e_empates():',
    '    assert top_k([3, 1, 2], 10) == [3, 2, 1]',
    '    assert top_k([3, 1, 2], 0) == []',
    '    assert top_k([2, 2, 2, 1], 2) == [2, 2]',
    '',
    '',
    'def test_vazio_levanta():',
    '    try:',
    '        BinaryHeap().pop()',
    '    except IndexError:',
    '        return',
    '    assert False, "pop em heap vazio deve levantar IndexError"',
    '',
    '',
    'def test_custo_n_log_k_e_nao_n_log_n():',
    '    r = random.Random(1)',
    '    dados = [r.random() for _ in range(20_000)]',
    '    h = BinaryHeap()',
    '    res = top_k(dados, 10, h)',
    '    assert res == sorted(dados, reverse=True)[:10]',
    '    assert h.comparacoes < 1.5 * len(dados)',
    ''].join('\n');
  var solucao = codigo
    .replace('        # CORRIJA: enquanto o elemento for menor que o pai, troque com ele\n        pass',
      '        a = self._a\n        while i > 0:\n            p = (i - 1) // 2\n            if self._lt(a[i], a[p]):\n                a[i], a[p] = a[p], a[i]\n                i = p\n            else:\n                break')
    .replace('        # CORRIJA: troque com o MENOR dos filhos enquanto ele for menor que a[i]\n        pass',
      '        a = self._a\n        n = len(a)\n        while True:\n            m = i\n            for c in (2 * i + 1, 2 * i + 2):\n                if c < n and self._lt(a[c], a[m]):\n                    m = c\n            if m == i:\n                break\n            a[i], a[m] = a[m], a[i]\n            i = m');

  TrilhaAula.registrar({
    id: 'f03-b4',
    titulo: 'Árvores e heaps: ordem, balanceamento, bancos, top-k e trie',
    minutos: 45,
    resumo: 'A tabela hash responde igualdade. Quase toda pergunta de dados reais tem ordem: o menor, os 10 maiores, tudo entre 10h e 11h, tudo que começa com "pre". Árvores e heaps respondem em tempo logarítmico.',
    objetivo: 'Explicar por que a altura da BST depende da ordem de inserção, por que bancos usam B-trees, e implementar um min-heap e o top-k em fluxo com O(n log k).',
    revisao: [
      { id: 'f03b4-bst', pergunta: 'Você insere 1, 2, …, 1000 em ordem numa BST sem balanceamento. Qual a altura e o custo de buscar o 1000?',
        opcoes: [
          opc('a', '1000 níveis e O(n): a árvore vira uma lista ligada', true, 'medido no lab: altura 1000 em ordem crescente e 20 embaralhada. Ids e timestamps chegam ordenados: o pior caso é o comum.'),
          opc('b', 'Cerca de 10 níveis, O(log n)', false, 'só vale com inserção aleatória ou árvore balanceada.'),
          opc('c', 'Cerca de 500 níveis, ainda logarítmico', false, '500 níveis é linear.')] },
      { id: 'f03b4-btree', pergunta: 'Por que bancos de dados usam B-tree e não árvore binária?',
        opcoes: [
          opc('a', 'O disco lê em páginas de 4–16 KB; centenas de chaves por nó reduzem 27 leituras a 3–4 (500³ ≈ 125 milhões)', true, 'as duas primeiras camadas ficam em cache: uma busca custa 1–2 leituras de disco.'),
          opc('b', 'Porque B-tree é mais simples de implementar', false, 'não é; o ganho é de leituras de página.'),
          opc('c', 'Porque a árvore binária não suporta intervalo', false, 'suporta; o problema é o número de páginas lidas.')] },
      { id: 'f03b4-heap', pergunta: 'Como é guardado um heap binário, e qual o custo de <code>heapify</code> de n elementos?',
        opcoes: [
          opc('a', 'Num array, sem ponteiros (filhos em 2i+1 e 2i+2, pai em (i-1)//2); heapify custa O(n)', true, 'a maioria dos nós está perto das folhas e desce pouco; push e pop são O(log n).'),
          opc('b', 'Em nós com ponteiros; heapify custa O(n log n)', false, 'não há ponteiros e o custo é O(n).'),
          opc('c', 'Num array ordenado; pop custa O(1)', false, 'o heap não é ordenado; só a raiz é garantida.')] },
      { id: 'f03b4-topk', pergunta: 'Para manter os 3 maiores de um fluxo infinito com memória O(k), qual heap e o que comparar?',
        opcoes: [
          opc('a', 'Min-heap de tamanho 3; se o valor novo for maior que a raiz (o menor dos 3), troca a raiz por ele', true, 'O(n log k) e O(k) de memória; o max-heap enterra o elemento que você quer descartar.'),
          opc('b', 'Max-heap de tamanho 3; descarta o novo se for menor que a raiz', false, 'a raiz do max-heap é o maior, não o candidato a sair.'),
          opc('c', 'Heap com todos os valores já vistos', false, 'memória O(n) e sem necessidade.')] },
      { id: 'f03b4-heapq', pergunta: 'Quais as duas ressalvas de <code>heapq</code> a saber?',
        opcoes: [
          opc('a', 'É só min-heap (negue as chaves para max-heap) e empates comparam o elemento seguinte da tupla; use contador de desempate', true, 'e não há "atualizar prioridade": use remoção preguiçosa.'),
          opc('b', 'É thread-safe e estável por padrão', false, 'não é nenhum dos dois.'),
          opc('c', 'Mantém a lista interna sempre ordenada', false, 'só <code>heappop</code> dá ordem; iterar a lista não.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Árvores e heaps estão por trás de índices de banco, filas de prioridade em escalonadores e agentes (próxima tarefa a executar) e do top-k que a busca aproximada de vizinhos em vetores devolve.</p>' +
          '<h3>Árvore binária de busca (BST)</h3>' +
          '<p>Cada nó tem uma chave, um filho esquerdo com chaves menores e um direito com chaves maiores. Buscar, inserir e remover descem um caminho da raiz: custo proporcional à <strong>altura</strong> h. Equilibrada, h ≈ log₂ n; degenerada, h = n (uma lista ligada disfarçada). A altura depende da <em>ordem de inserção</em>, então "BST é O(log n)" é verdade só <em>em média, sob inserção aleatória</em>. Dados reais chegam ordenados (ids sequenciais, timestamps). A BST do lab é iterativa de propósito: uma árvore degenerada de 100 mil nós custa tempo, mas com recursão estouraria o limite de profundidade (bloco 7).</p>' +
          '<h3>Balanceamento sem decorar rotações</h3>' +
          '<p>Árvores balanceadas (AVL, rubro-negra, treap, skip list) garantem h = O(log n) mantendo um invariante local corrigido por <em>rotações</em>, que reorganizam três ponteiros preservando a ordem. <strong>AVL</strong>: alturas dos dois filhos diferem em no máximo 1 (busca mais rápida, mais rotações). <strong>Rubro-negra</strong>: coloração que limita o caminho mais longo a 2x o mais curto (menos rotações na escrita; usada em <code>std::map</code> e no TreeMap do Java). Você não as implementa no trabalho, mas precisa saber que (1) existem para fechar o pior caso da BST; (2) custam constante e ponteiros; (3) a biblioteca padrão do Python não traz nenhuma: o substituto é <strong>array ordenado + <code>bisect</code></strong> (leitura O(log n), inserção O(n) por <code>memmove</code>, ótimo até centenas de milhares de itens) ou o pacote de terceiros <code>sortedcontainers</code> quando há muita escrita.</p>' },
        { tipo: 'takeaway', html: 'A BST custa a <mark>altura</mark>, e a altura depende da <mark>ordem de inserção</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'b4-demo', titulo: 'Altura da BST e o heap em movimento', prefixo: '$', entrada: 'uv run python -m algos.demo heap', unidade: 'x', terminalTitulo: 'saída real do laboratório',
          enunciado: 'Primeiro os seis pushes e os pops do heap; depois a altura da BST com a mesma quantidade de chaves em duas ordens.',
          prever: { pergunta: 'Mil chaves inseridas em ordem crescente numa BST simples: qual a altura? E embaralhadas?', opcoes: [
            { id: 'a', texto: '≈10 nas duas: BST é logarítmica', correta: false, porque: 'só a embaralhada se aproxima disso.' },
            { id: 'b', texto: '1000 em ordem crescente; 20 embaralhadas', correta: true, porque: 'o mínimo teórico seria 10; o esperado numa BST aleatória fica em 20–25.' },
            { id: 'c', texto: '500 e 100', correta: false, porque: 'a espinha em ordem crescente tem altura n.' }
          ] },
          etapas: [
            { id: 'heap', nome: 'Heap: push e pop', descricao: 'seis pushes, pops em ordem', tom: 'request', ms: 6, linhas: [
              L('out', 'push 5: [5]'), L('out', 'push 3: [3, 5]'), L('out', 'push 8: [3, 5, 8]'), L('out', 'push 1: [1, 3, 8, 5]'),
              L('out', 'push 9: [1, 3, 8, 5, 9]'), L('out', 'push 2: [1, 3, 2, 5, 9, 8]'), L('out', 'pops: [1, 2, 3, 5, 8, 9]'),
              L('hint', 'o array [1, 3, 2, 5, 9, 8] é o heap: o pai do índice 4 (valor 9) é o índice 1 (valor 3)')] },
            { id: 'bst', nome: 'Altura da BST', descricao: 'resultado determinístico (semente fixa)', tom: 'response', ms: 1000, linhas: [
              L('out', 'BST height, 1000 keys inserted in order:    1000'), L('out', 'BST height, 1000 keys inserted shuffled:    20'),
              L('hint', 'ordenado é o pior caso, e é o caso comum quando as chaves são ids crescentes')] }
          ],
          tutorDepois: 'Só a raiz do heap é garantidamente o menor; os irmãos não têm ordem entre si, e é isso que torna push e pop baratos.',
          callout: 'Você viu a espinha da BST ordenada e o heap vivendo num array.' },
        { tipo: 'texto', html:
          '<h3>Heap: a árvore que mora num array</h3>' +
          '<p>Um <strong>min-heap</strong> é uma árvore binária <em>completa</em> em que cada pai é menor ou igual aos filhos. Sem ponteiros: com índices a partir de 0, os filhos de <code>i</code> estão em <code>2i+1</code> e <code>2i+2</code>, e o pai em <code>(i-1)//2</code>.</p>' +
          '<ul><li><code>push</code>: coloca no fim e <em>sobe</em> trocando com o pai enquanto for menor: O(log n).</li>' +
          '<li><code>pop</code>: tira a raiz, move o último elemento para o topo e o <em>desce</em> trocando com o menor filho: O(log n).</li>' +
          '<li><code>heapify</code> de n elementos: O(n), não O(n log n), porque a maioria dos nós está perto das folhas e desce pouco.</li></ul>' +
          '<h3>B-tree: por que bancos não usam árvore binária</h3>' +
          '<p>Um disco lê em páginas de 4–16 KB; ler 1 byte custa o mesmo que a página. Uma árvore binária de 100 milhões de chaves tem altura ≈ 27: 27 leituras de página por busca. A B-tree põe <em>centenas de chaves por nó</em>, ajustado à página: com 500 filhos por nó, 100 milhões de chaves cabem em altura 3 ou 4 (500³ = 125 milhões). As duas primeiras camadas ficam em cache, então uma busca custa 1–2 leituras de disco. Nos bancos (B+tree) os valores ficam nas folhas, e as folhas são encadeadas: uma consulta por intervalo desce uma vez e depois anda pela lista.</p>' },
        { tipo: 'takeaway', html: 'Heap é <mark>árvore completa em array</mark>; B-tree é <mark>nó do tamanho da página</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Exemplo condutor: top-k em fluxo</h3>' +
          '<p>"Os k maiores de n itens" tem três soluções: ordenar tudo (O(n log n) tempo, O(n) memória), quickselect (O(n) esperado, destrói a ordem, exige tudo em memória) ou um <strong>min-heap de tamanho k</strong> (O(n log k) tempo, O(k) memória, uma passada, funciona em fluxo). O heap guarda os k melhores vistos; a raiz é o <em>pior dos melhores</em>, o item a ser batido. Em produção use <code>heapq.nlargest(k, it)</code>, o mesmo algoritmo em C. Complete o heap e confirme que o custo é de comparações próximo de n, não de n log n.</p>' },
        { tipo: 'python', id: 'b4-python', titulo: 'Escreva subir e descer do heap', obrigatorio: false,
          enunciado: 'O <code>BinaryHeap</code> abaixo já tem <code>push</code>, <code>pop</code> e <code>top_k</code>. Implemente <code>_subir</code> e <code>_descer</code> (marcados com <code>CORRIJA</code>). O último teste conta as comparações do <code>top_k</code> sobre 20 mil itens.',
          codigo: codigo, testes: testes,
          dica: '<code>_subir</code>: <code>p = (i-1)//2</code>; troque enquanto <code>a[i] &lt; a[p]</code>. <code>_descer</code>: escolha o menor entre <code>a[i]</code>, <code>a[2i+1]</code> e <code>a[2i+2]</code> (respeitando <code>c &lt; n</code>); se for outro, troque e continue nele.',
          solucao: solucao,
          tutorDepois: 'Cada item novo custa uma comparação com a raiz; só os raros que entram pagam O(log k).',
          callout: 'O heap ordenou os pops, o top-k acertou o exemplo e o custo ficou perto de n comparações.' },
        { tipo: 'texto', html:
          '<h3>Trie: árvore sobre o prefixo</h3>' +
          '<p>Uma <strong>trie</strong> guarda strings pelo caminho de caracteres: cada nó tem filhos indexados por caractere e uma marca de "fim de palavra". Inserir ou buscar uma palavra de comprimento L custa O(L), independentemente de quantas palavras existem; listar tudo com um prefixo desce o prefixo (O(L)) e enumera a subárvore. Aplicações: autocompletar, roteamento por prefixo (rotas de URL, tabelas de IP com a variante Patricia) e dicionários de tokenização por maior prefixo conhecido. O preço é memória (um nó por caractere, cada um com um dict); árvores radix comprimem cadeias sem ramificação.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: ['t = Trie()', 'for w in ("casa", "caso", "cacau", "cesta"): t.add(w)', "t.with_prefix(\"cas\")   # ['casa', 'caso']"].join('\n') },
        { tipo: 'takeaway', html: 'O <mark>min-heap de tamanho k</mark> faz o top-k em <mark>O(n log k)</mark> e O(k) de memória.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'cenario', id: 'b4-cenario', titulo: 'Chave primária e escrita lenta', obrigatorio: false,
          enunciado: 'Uma tabela de eventos com 200 milhões de linhas usa UUID v4 como chave primária. As escritas ficaram lentas e o índice, fragmentado.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Pelo modelo da B+tree, qual é a causa mais provável?', opcoes: [
              { texto: 'IDs aleatórios espalham as escritas por páginas arbitrárias do índice, que fragmentam e saem do cache.', vai: 'solucao', tom: 'ok', consequencia: 'a B+tree se organiza em páginas ordenadas; inserir fora do fim toca páginas frias.' },
              { texto: 'A B-tree é binária e tem altura 27.', vai: 'f-erro', tom: 'ruim', consequencia: 'B-trees têm centenas de chaves por nó: altura 3–4.' },
              { texto: 'Falta um índice hash.', vai: 'f-hash', tom: 'ruim', consequencia: 'um índice hash não ordena nem atende intervalos (<code>BETWEEN</code>, <code>ORDER BY</code>).' }
            ] },
            solucao: { texto: 'Qual a mudança que ataca a causa?', opcoes: [
              { texto: 'Usar ids ordenados no tempo (UUID v7 ou sequência): as inserções anexam na página da direita.', vai: 'f-bom', tom: 'ok', consequencia: 'escrita sequencial no fim do índice; intervalos continuam baratos pelas folhas encadeadas.' },
              { texto: 'Aumentar a memória do servidor e manter UUID v4.', vai: 'f-caro', tom: 'ruim', consequencia: 'esconde o sintoma por um tempo; a fragmentação continua.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Escritas anexam no fim da B+tree; o índice deixa de fragmentar e as consultas por intervalo continuam baratas.' },
            'f-erro': { bom: false, texto: 'A conclusão veio de um modelo errado de árvore, e a medição não bateria com a hipótese.' },
            'f-hash': { bom: false, texto: 'As consultas por intervalo e ordenação perderam o índice.' },
            'f-caro': { bom: false, texto: 'A conta de infraestrutura subiu e o problema voltou com o próximo crescimento.' }
          },
          callout: 'Você ligou a fragmentação ao formato da B+tree e escolheu ids ordenados.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Trade-offs: qual estrutura para qual pergunta</h3><table><thead><tr><th>Pergunta</th><th>Estrutura</th><th>Custo</th></tr></thead><tbody>' +
          '<tr><td>igualdade exata</td><td>dict / set</td><td>O(1) esperado</td></tr>' +
          '<tr><td>menor/maior, extração repetida</td><td>heap</td><td>pop O(log n), peek O(1)</td></tr>' +
          '<tr><td>vizinho mais próximo, intervalo, ordem</td><td>árvore balanceada ou array ordenado + bisect</td><td>O(log n) + saída</td></tr>' +
          '<tr><td>dados maiores que a memória, intervalos</td><td>B+tree (índice de banco)</td><td>poucas leituras de página</td></tr>' +
          '<tr><td>prefixo</td><td>trie / radix / índice de texto</td><td>O(L)</td></tr>' +
          '</tbody></table>' +
          '<p>Em bancos: <code>CREATE INDEX</code> no PostgreSQL ou SQL Server cria uma B+tree; consulta por intervalo é barata porque as folhas estão em ordem; índice em coluna de baixa seletividade, ou com função aplicada (<code>WHERE lower(nome) = ...</code> sem índice funcional), não é usado. Planos de execução ficam no F05. Bancos LSM (RocksDB, Cassandra) trocam a B-tree por escritas sequenciais em arquivos ordenados mesclados depois: melhor escrita, leitura mais cara.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: heap não é lista ordenada', html:
          '<p>Iterar sobre <code>heapq</code> ou imprimir a lista interna não dá ordem; só <code>heappop</code> dá. A "atualização de prioridade" não existe: a técnica é <em>remoção preguiçosa</em> (insira a nova entrada, marque a antiga como inválida por um dicionário de versões e descarte ao dar pop). Dijkstra (bloco 6) usa esse truque; esquecê-lo torna a versão incorreta ou lenta. E "a busca é O(log n)" só vale com a árvore balanceada e a comparação barata: chaves de string comparam em O(L) no pior caso.</p>' },
        { tipo: 'escolha', id: 'b4-esc-maxheap', titulo: 'Confira: o max-heap no top-k',
          pergunta: 'Alguém implementa o top-3 maiores com um <em>max-heap</em> de tamanho 3. Qual o defeito?',
          opcoes: [
            { id: 'a', texto: 'Nenhum: a raiz é o maior, que é o que importa.', correta: false, porque: 'o que precisa sair primeiro é o menor dos 3.' },
            { id: 'b', texto: 'A raiz é o maior dos 3, então o elemento a descartar fica enterrado dentro do heap; o correto é um min-heap de tamanho k.', correta: true, porque: 'no min-heap a raiz é o "pior dos melhores", o item a ser batido: O(log k) por troca.' },
            { id: 'c', texto: 'O max-heap não existe em Python.', correta: false, porque: 'existe por negação de chaves; o problema é de projeto, não de disponibilidade.' }
          ], tutorDepois: 'Min-heap para os k maiores; max-heap (ou chave negada) para os k menores.' },
        { tipo: 'escolha', id: 'b4-esc-heapq', titulo: 'Confira: empates no heapq',
          pergunta: 'Você empurra <code>(prioridade, tarefa)</code> num <code>heapq</code> e duas tarefas têm a mesma prioridade, sendo objetos sem ordem definida. O que ocorre e como evitar?',
          opcoes: [
            { id: 'a', texto: '<code>TypeError</code> ao comparar as tarefas; empacote <code>(prioridade, contador, tarefa)</code> para desempatar e ganhar ordem FIFO.', correta: true, porque: 'a tupla compara o elemento seguinte quando o primeiro empata.' },
            { id: 'b', texto: 'Nada: o heapq ignora empates.', correta: false, porque: 'ele compara o próximo campo da tupla.' },
            { id: 'c', texto: 'O heap vira estável automaticamente.', correta: false, porque: 'o contador é que dá a ordem FIFO.' }
          ], tutorDepois: 'O contador de desempate também evita comparar objetos que não são comparáveis.' },
        { tipo: 'texto', html: '<p class="ta-nota">Saídas do laboratório (<code>algos.demo heap</code>) de 11/10/2026, CPython 3.14.7. Alturas e o esperado da BST aleatória são resultado determinístico (semente fixa). Detalhes de B-tree em PostgreSQL e SQL Server seguem a documentação dos bancos; revalide ao trocar de versão.</p>' },
        { tipo: 'takeaway', html: 'Escolha pela <mark>pergunta</mark>: igualdade é hash, ordem é <mark>árvore</mark>, extremo repetido é <mark>heap</mark>.' }
      ] }
    ]
  });
})();
