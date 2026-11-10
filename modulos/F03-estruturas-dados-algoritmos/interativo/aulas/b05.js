/* F03 · Bloco 5: Ordenação e busca. Fonte: F03.html#b05. Medições: execução real do laboratório em 11/10/2026 (CPython 3.14.7, aarch64). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'def _merge(left, right):',
    '    """Funde duas listas de (chave, valor) ordenadas pela chave."""',
    '    out = []',
    '    i = j = 0',
    '    while i < len(left) and j < len(right):',
    '        # CORRIJA: o empate deve sair da metade ESQUERDA primeiro (estabilidade)',
    '        if right[j][0] <= left[i][0]:',
    '            out.append(right[j])',
    '            j += 1',
    '        else:',
    '            out.append(left[i])',
    '            i += 1',
    '    out.extend(left[i:])',
    '    out.extend(right[j:])',
    '    return out',
    '',
    '',
    'def merge_sort(a):',
    '    if len(a) <= 1:',
    '        return list(a)',
    '    mid = len(a) // 2',
    '    return _merge(merge_sort(a[:mid]), merge_sort(a[mid:]))',
    '',
    '',
    'def lower_bound(a, x):',
    '    """Primeira posição onde a[i] >= x. Invariante: a[:lo] < x  e  a[hi:] >= x."""',
    '    lo, hi = 0, len(a)',
    '    while lo < hi:',
    '        mid = (lo + hi) // 2',
    '        # CORRIJA: derive a condição do invariante',
    '        if a[mid] <= x:',
    '            lo = mid + 1',
    '        else:',
    '            hi = mid',
    '    return lo',
    '',
    '',
    'def upper_bound(a, x):',
    '    """Primeira posição onde a[i] > x. Invariante: a[:lo] <= x  e  a[hi:] > x."""',
    '    lo, hi = 0, len(a)',
    '    while lo < hi:',
    '        mid = (lo + hi) // 2',
    '        if a[mid] <= x:',
    '            lo = mid + 1',
    '        else:',
    '            hi = mid',
    '    return lo',
    '',
    '',
    'def contar(a, x):',
    '    return upper_bound(a, x) - lower_bound(a, x)',
    '',
    '',
    'def first_true(lo, hi, pred):',
    '    """Menor k em [lo, hi) com pred(k) verdadeiro (pred monótono: F..FV..V); hi se nenhum."""',
    '    while lo < hi:',
    '        mid = (lo + hi) // 2',
    '        # CORRIJA: se pred(mid) é verdadeiro, a resposta está em [lo, mid]',
    '        if pred(mid):',
    '            lo = mid + 1',
    '        else:',
    '            hi = mid',
    '    return lo',
    '',
    '',
    'def maior_sem_repeticao(texto):',
    '    """Tamanho do maior trecho sem caractere repetido (janela deslizante)."""',
    '    ultimo = {}',
    '    inicio = melhor = 0',
    '    for i, ch in enumerate(texto):',
    '        # CORRIJA: só empurre o início se a repetição está DENTRO da janela',
    '        if ch in ultimo:',
    '            inicio = ultimo[ch] + 1',
    '        ultimo[ch] = i',
    '        melhor = max(melhor, i - inicio + 1)',
    '    return melhor',
    ''].join('\n');
  var testes = [
    'import bisect',
    'import random',
    '',
    '',
    'def test_merge_sort_e_estavel():',
    '    dados = [(2, "a"), (1, "b"), (2, "c"), (1, "d"), (2, "e")]',
    '    assert merge_sort(dados) == [(1, "b"), (1, "d"), (2, "a"), (2, "c"), (2, "e")]',
    '',
    '',
    'def test_merge_sort_ordena_aleatorio():',
    '    r = random.Random(3)',
    '    a = [(r.randint(0, 20), i) for i in range(200)]',
    '    assert merge_sort(a) == sorted(a, key=lambda p: p[0])',
    '',
    '',
    'def test_lower_bound_bordas():',
    '    assert lower_bound([], 5) == 0',
    '    assert lower_bound([1, 2, 2, 2, 3], 2) == 1',
    '    assert lower_bound([1, 2, 2, 2, 3], 0) == 0',
    '    assert lower_bound([1, 2, 2, 2, 3], 9) == 5',
    '',
    '',
    'def test_contar_ocorrencias():',
    '    assert contar([1, 2, 2, 2, 3], 2) == 3',
    '    assert contar([1, 2, 2, 2, 3], 4) == 0',
    '',
    '',
    'def test_lower_bound_igual_ao_bisect():',
    '    r = random.Random(5)',
    '    a = sorted(r.randint(0, 50) for _ in range(300))',
    '    assert all(lower_bound(a, x) == bisect.bisect_left(a, x) for x in range(-2, 55))',
    '',
    '',
    'def test_first_true_busca_sobre_a_resposta():',
    '    assert first_true(0, 100, lambda k: k * k >= 50) == 8',
    '    assert first_true(0, 10, lambda k: False) == 10',
    '    assert first_true(0, 10, lambda k: True) == 0',
    '',
    '',
    'def test_janela_abba_e_outros():',
    '    assert maior_sem_repeticao("abba") == 2',
    '    assert maior_sem_repeticao("abcabcbb") == 3',
    '    assert maior_sem_repeticao("pwwkew") == 3',
    '    assert maior_sem_repeticao("") == 0',
    ''].join('\n');
  var solucao = codigo
    .replace('        # CORRIJA: o empate deve sair da metade ESQUERDA primeiro (estabilidade)\n        if right[j][0] <= left[i][0]:', '        if right[j][0] < left[i][0]:')
    .replace('        # CORRIJA: derive a condição do invariante\n        if a[mid] <= x:', '        if a[mid] < x:')
    .replace('        # CORRIJA: se pred(mid) é verdadeiro, a resposta está em [lo, mid]\n        if pred(mid):\n            lo = mid + 1\n        else:\n            hi = mid', '        if pred(mid):\n            hi = mid\n        else:\n            lo = mid + 1')
    .replace('        # CORRIJA: só empurre o início se a repetição está DENTRO da janela\n        if ch in ultimo:', '        if ch in ultimo and ultimo[ch] >= inicio:');

  TrilhaAula.registrar({
    id: 'f03-b5',
    titulo: 'Ordenação e busca: merge, quick, Timsort, busca binária, dois ponteiros e janela',
    minutos: 50,
    resumo: 'Ordenar transforma problemas O(n²) em O(n log n). Você quase nunca implementa um sort; precisa saber o que sorted garante e escrever busca binária, dois ponteiros e janela sem erro de borda.',
    objetivo: 'Explicar estabilidade, o pior caso do quicksort e o que o Timsort explora; escrever busca binária a partir do invariante; e aplicar dois ponteiros e janela deslizante com custo O(n).',
    revisao: [
      { id: 'f03b5-estavel', pergunta: 'O que torna o merge sort estável, e o que a troca de <code>&lt;</code> por <code>&lt;=</code> na fusão faz?',
        opcoes: [
          opc('a', 'Em empate, sai o elemento da metade esquerda; com <code>&lt;=</code> continua ordenando, mas destrói a estabilidade sem que "está ordenado?" perceba', true, 'só o teste de estabilidade pega a mutação.'),
          opc('b', 'O merge sort é estável por usar recursão; a troca não muda nada', false, 'a estabilidade vem do desempate à esquerda.'),
          opc('c', 'Com <code>&lt;=</code> o resultado deixa de estar ordenado', false, 'continua ordenado; perde só a ordem relativa dos iguais.')] },
      { id: 'f03b5-quick', pergunta: 'Quicksort com pivô = último elemento recebe uma lista já ordenada de 4.000 itens. O que esperar?',
        opcoes: [
          opc('a', 'Tempo quadrático: cada partição tira 1 elemento (medido: 268 ms contra 2,8 ms com pivô aleatório)', true, 'pivô aleatório, mediana de três ou o Timsort (O(n) em entrada ordenada) evitam isso.'),
          opc('b', 'O melhor caso, O(n log n)', false, 'a partição fica sempre desbalanceada.'),
          opc('c', 'Tempo linear', false, 'só o Timsort fica linear em entrada ordenada.')] },
      { id: 'f03b5-invariante', pergunta: 'Qual o invariante do <code>lower_bound</code> com intervalo semiaberto <code>[lo, hi)</code>?',
        opcoes: [
          opc('a', '<code>a[:lo] &lt; x</code> e <code>a[hi:] &gt;= x</code>; daí <code>lo = mid + 1</code> se <code>a[mid] &lt; x</code>, senão <code>hi = mid</code>', true, 'ao sair com <code>lo == hi</code>, é o ponto de inserção; contagem = upper_bound − lower_bound.'),
          opc('b', '<code>a[lo] == x</code> sempre', false, 'x pode não existir.'),
          opc('c', '<code>lo &lt;= hi</code> e <code>lo = mid</code>', false, '<code>lo = mid</code> pode não avançar e travar o laço.')] },
      { id: 'f03b5-nlogn', pergunta: 'Por que nenhum sort por comparação é melhor que n log n no pior caso?',
        opcoes: [
          opc('a', 'A árvore de decisão precisa de n! folhas e, sendo binária, tem altura ≥ log₂(n!) = n log₂ n − O(n)', true, 'o limite vale só para comparações; counting e radix escapam quando k ou d são pequenos.'),
          opc('b', 'Porque n log n é o que o Timsort consegue', false, 'o Timsort é caso particular, não o argumento.'),
          opc('c', 'Porque memória auxiliar é linear', false, 'o argumento é de contagem de permutações.')] },
      { id: 'f03b5-janela', pergunta: 'Na janela deslizante do maior trecho sem repetição, por que o teste <code>ultimo[ch] &gt;= inicio</code>?',
        opcoes: [
          opc('a', 'Uma repetição <em>fora</em> da janela (já descartada) não pode puxar o início para trás; "abba" quebraria no segundo "a"', true, 'o dict guarda posições que podem estar obsoletas: é um bug de invariante.'),
          opc('b', 'Para evitar KeyError', false, 'o <code>in</code> já evita KeyError.'),
          opc('c', 'Só por desempenho', false, 'sem ele a resposta fica errada.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Ordenar é a operação que transforma problemas O(n²) em O(n log n): depois de ordenado, duplicatas ficam adjacentes, intersecções viram uma varredura e "o mais próximo" vira busca binária. Um agente de código erra justamente os limites; por isso você precisa saber o que o <code>sorted</code> garante e escrever os padrões de busca sem erro de borda.</p>' +
          '<h3>Merge sort: dividir, ordenar, fundir</h3>' +
          '<p>Divida ao meio, ordene cada metade recursivamente, funda as duas em uma varredura. Recorrência <code>T(n) = 2T(n/2) + O(n)</code>: Θ(n log n) em <em>todos</em> os casos, O(n) de memória auxiliar. É <strong>estável</strong> por um detalhe: na fusão, em empate sai o elemento da metade <em>esquerda</em> (comparação estrita). <strong>Estabilidade</strong> significa que registros com a mesma chave mantêm a ordem relativa original; importa ao ordenar em várias passadas ("por nome, depois por departamento": o resultado final está ordenado por departamento e, dentro de cada um, por nome, <em>se</em> o segundo sort for estável). <code>sorted</code> e <code>list.sort</code> são estáveis por garantia da linguagem.</p>' +
          '<h3>Quicksort: o pior caso é decisão sua</h3>' +
          '<p>Escolha um pivô, particione em menores/iguais/maiores e ordene os lados. Tempo esperado O(n log n), memória O(log n) se recursar sempre no lado menor, não estável. Com pivô fixo (o último) e entrada <em>já ordenada</em> (caso comum), cada partição tira um elemento: Θ(n²). Dois detalhes do lab: <strong>partição em três vias</strong> (a bandeira holandesa: chaves repetidas deixam de ser quadráticas) e <strong>pilha explícita que adia o lado maior</strong> (a pilha nunca passa de O(log n) intervalos).</p>' },
        { tipo: 'takeaway', html: 'Merge sort é <mark>Θ(n log n)</mark> e estável pelo <mark>desempate à esquerda</mark>; quicksort depende do <mark>pivô</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'b5-sorts', titulo: 'Pivô, Timsort e o custo dos sorts em Python', prefixo: '$', entrada: 'uv run python -m algos.bench', unidade: 'x', terminalTitulo: 'medido nesta máquina',
          enunciado: 'Duas tabelas do bench: quicksort com dois pivôs em entrada ordenada, e três sorts em inteiros aleatórios.',
          prever: { pergunta: 'Entrada já ordenada, n dobrando de 2.000 para 4.000. Por quanto multiplica o tempo do quicksort com pivô = último?', opcoes: [
            { id: 'a', texto: 'Cerca de 2: n log n', correta: false, porque: 'esse é o pivô aleatório (≈2,1).' },
            { id: 'b', texto: 'Cerca de 4: quadrático', correta: true, porque: 'medido: 65,54 → 268,20 ms (≈4,1); aleatório 1,22 → 2,77 ms.' },
            { id: 'c', texto: 'Cerca de 1: já está ordenado', correta: false, porque: 'só o Timsort aproveita a ordem existente.' }
          ] },
          etapas: [
            { id: 'pivo', nome: 'Pivô na entrada ordenada', descricao: 'ms por n', tom: 'request', ms: 4.1, linhas: [
              L('out', 'n=1.000  pivô aleatório  0,58   pivô=último  15,99   sorted() 0,00'),
              L('out', 'n=2.000  pivô aleatório  1,22   pivô=último  65,54   sorted() 0,01'),
              L('out', 'n=4.000  pivô aleatório  2,77   pivô=último 268,20   sorted() 0,01'),
              L('hint', 'sorted() detecta uma única sequência crescente e termina em O(n)')] },
            { id: 'cvspy', nome: 'C contra Python', descricao: 'inteiros aleatórios, ms', tom: 'response', ms: 14, linhas: [
              L('out', 'n=10.000  sorted() 0,54   merge do lab  9,61   quick aleatório  8,14'),
              L('out', 'n=20.000  sorted() 1,29   merge do lab 20,60   quick aleatório 17,86'),
              L('out', 'n=40.000  sorted() 3,16   merge do lab 44,29   quick aleatório 37,32'),
              L('hint', 'as três curvas dobram um pouco acima de 2x (n log n); a lacuna de 14–18x entre C e Python é constante, não ordem')] }
          ],
          tutorDepois: 'Pivô fixo em entrada ordenada é o pior caso comum; o ganho de C sobre Python é constante.',
          callout: 'Você viu o quadrático do pivô fixo e a constante de C contra Python.' },
        { tipo: 'texto', html:
          '<h3>Timsort: o que o Python realmente faz</h3>' +
          '<p>O <code>list.sort</code> usa Timsort (Tim Peters, 2002), um merge sort adaptativo para dados reais, que raramente são aleatórios. Ele (1) procura <em>runs</em>, sequências já crescentes (ou estritamente decrescentes, que inverte); (2) estende runs curtos até <code>minrun</code> (32 a 64) com <em>insertion sort</em> binário; (3) funde runs adjacentes por uma política de pilha que mantém as fusões equilibradas (desde o CPython 3.11, <em>powersort</em>); (4) usa <em>galloping</em>: quando um lado vence várias vezes seguidas, troca a comparação linear por busca exponencial. Resultado: O(n) em entrada ordenada ou quase, Θ(n log n) no pior caso, estável, até n/2 de memória auxiliar. Consequências: reordenar dados "quase ordenados" é barato; <code>key=</code> é avaliada uma vez por elemento; <code>reverse=True</code> preserva a estabilidade; tipos incomparáveis levantam <code>TypeError</code>.</p>' +
          '<h3>O limite inferior n log n</h3>' +
          '<p>Um algoritmo que só descobre a ordem comparando pares é uma <em>árvore de decisão</em> binária: cada nó interno é uma comparação, cada folha uma permutação. Há n! permutações, então a altura é ≥ log₂(n!) = n·log₂ n − O(n) (Stirling): Ω(n log n) comparações no pior caso. Merge sort e heap sort são ótimos nesse modelo. O limite vale <em>só para comparações</em>: <strong>counting sort</strong> (chaves inteiras em faixa k: O(n + k)), <strong>radix sort</strong> (d dígitos: O(d·(n + base))) e <strong>bucket sort</strong> escapam, pagando em memória e em restrição de tipo. Em Python, <code>sorted</code> em C costuma vencer qualquer implementação em Python desses métodos.</p>' },
        { tipo: 'takeaway', html: 'O <mark>Timsort</mark> é O(n) em dados ordenados e estável; <mark>n log n</mark> é o piso por comparação.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Busca binária com invariante</h3>' +
          '<p>Busca binária é O(log n) e a fonte clássica de bugs: Knuth registra a primeira publicação em 1946 e a primeira versão sem erro de borda em 1962. A defesa é escrever o <strong>invariante</strong> antes do código. Para <code>lower_bound</code> (primeira posição onde o elemento não é menor que x, o <code>bisect_left</code>): intervalo semiaberto <code>[lo, hi)</code>, invariante <code>a[:lo] &lt; x</code> e <code>a[hi:] &gt;= x</code>. Se <code>a[mid] &lt; x</code>, <code>lo = mid + 1</code>; senão <code>hi = mid</code>. Ao sair com <code>lo == hi</code>, é o ponto de inserção. A terminação vem de <code>hi − lo</code> diminuir estritamente (<code>lo ≤ mid &lt; hi</code>). <code>upper_bound</code> é simétrico; "x existe?" é <code>i &lt; len(a) and a[i] == x</code>; a contagem é <code>upper_bound − lower_bound</code>.</p>' +
          '<p><strong>Busca binária sobre a resposta:</strong> quando "a resposta é ≤ k?" é <em>monótona</em> (F…FV…V), basta um predicado: o menor lote que processa a fila no prazo, a menor taxa que satura o serviço, a primeira versão que quebra (o <code>git bisect</code> do F01). Na prática use <code>bisect_left</code>/<code>bisect_right</code> (em C, <code>key=</code> desde o 3.10); com inteiros de largura fixa, escreva <code>lo + (hi - lo) // 2</code> (o estouro apareceu na biblioteca padrão do Java por anos).</p>' },
        { tipo: 'python', id: 'b5-python', titulo: 'Corrija a fusão, a busca, o predicado e a janela', obrigatorio: false,
          enunciado: 'Quatro defeitos marcados com <code>CORRIJA</code>: o empate na fusão (estabilidade), a condição do <code>lower_bound</code> derivada do invariante, o sentido do <code>first_true</code> e o teste de janela do maior trecho sem repetição.',
          codigo: codigo, testes: testes,
          dica: 'Fusão: use <code>&lt;</code> estrito. <code>lower_bound</code>: <code>a[mid] &lt; x</code>. <code>first_true</code>: se <code>pred(mid)</code>, <code>hi = mid</code>; senão <code>lo = mid + 1</code>. Janela: <code>ch in ultimo and ultimo[ch] &gt;= inicio</code>.',
          solucao: solucao,
          tutorDepois: 'Cada correção sai do invariante, não de tentativa e erro; o teste do "abba" é o controle negativo da janela.',
          callout: 'A fusão ficou estável, as buscas bateram com o <code>bisect</code> e a janela resistiu ao "abba".' },
        { tipo: 'abas', rotulo: 'Padrões', itens: [
          { rotulo: 'Dois ponteiros', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: ['def par_com_soma(a, alvo):          # a ordenado', '    i, j = 0, len(a) - 1', '    while i < j:', '        s = a[i] + a[j]', '        if s == alvo:', '            return i, j', '        if s < alvo:', '            i += 1                      # precisa de soma maior', '        else:', '            j -= 1                      # precisa de soma menor', '    return None'].join('\n') },
            { tipo: 'texto', html: '<p>Em dados <em>ordenados</em>, cada passo descarta um elemento que não pode fazer parte de nenhuma resposta: O(n) tempo, O(1) espaço, contra O(n²) da força bruta. Se a entrada não está ordenada, ordenar custa O(n log n); a alternativa é o dict de valores vistos (<code>two_sum_hash</code>: O(n) tempo e espaço). Outros usos: remover duplicatas in-loco, particionar, mesclar listas ordenadas, palíndromo.</p>' }] },
          { rotulo: 'Janela deslizante', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: ['def maior_soma_k(a, k):', '    s = sum(a[:k])', '    melhor = s', '    for i in range(k, len(a)):', '        s += a[i] - a[i - k]            # entra a[i], sai a[i-k]', '        melhor = max(melhor, s)', '    return melhor'].join('\n') },
            { tipo: 'texto', html: '<p>O(n) em vez de O(n·k). O argumento é de <em>amortização</em>: cada ponteiro só avança, nunca recua; 2n movimentos no total. Em fluxos (últimas N mensagens, taxa por minuto) a janela vira um <code>deque</code> ou uma estrutura monotônica (deque de candidatos a máximo).</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'Escreva o <mark>invariante</mark> primeiro; as atualizações do laço <mark>saem dele</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'cenario', id: 'b5-cenario', titulo: 'Ordenar dados externos', obrigatorio: false,
          enunciado: 'Um serviço ordena preços vindos de um parceiro com <code>sorted(precos, key=lambda p: p.valor)</code>. Alguns valores chegam como <code>NaN</code> e outros como <code>None</code>.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A ordenação não levantou erro para os NaN, mas a lista parece fora de ordem. O que você conclui?', opcoes: [
              { texto: 'O Timsort tem um bug com floats.', vai: 'f-bug', tom: 'ruim', consequencia: 'o algoritmo é correto; a premissa de ordem total é que foi violada.' },
              { texto: 'NaN faz toda comparação ser falsa: a relação não é uma ordem total, e o resultado pode variar com o tamanho da entrada. Normalize antes de ordenar.', vai: 'normaliza', tom: 'ok', consequencia: 'comparador inconsistente não levanta erro e produz ordem sem sentido.' }
            ] },
            normaliza: { texto: 'Como normalizar?', opcoes: [
              { texto: 'Remover ou isolar NaN e None, converter as chaves para um único tipo, e só então ordenar (com teste cobrindo esses casos).', vai: 'f-bom', tom: 'ok', consequencia: 'a ordem total é restaurada na entrada da função.' },
              { texto: 'Trocar sorted por list.sort.', vai: 'f-igual', tom: 'ruim', consequencia: 'usam o mesmo algoritmo; nada muda.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Dados externos validados antes de ordenar; a ordenação volta a ser determinística e testável.' },
            'f-bug': { bom: false, texto: 'Tempo perdido procurando um bug no interpretador, enquanto o dado inconsistente continuou entrando.' },
            'f-igual': { bom: false, texto: 'A ordem continuou sem sentido, só que agora com outro nome de método.' }
          },
          callout: 'Você restaurou a ordem total antes de ordenar.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o teste que separa certo de quase certo', html:
          '<p>Em <code>ultimo[ch] &gt;= inicio</code>, sem a condição uma repetição <em>fora</em> da janela puxa o início para trás e a janela volta a incluir repetidos. Em "abba" a versão sem ela devolve a resposta errada no segundo "a". Ordenar com <code>key</code> de tipos mistos (<code>None</code> e <code>int</code>) ou <code>__lt__</code> que não é ordem total (NaN) não levanta erro e dá ordem sem sentido: normalize antes (remova ou isole NaN, converta chaves para um tipo único).</p>' },
        { tipo: 'escolha', id: 'b5-esc-binaria', titulo: 'Confira: o laço que não termina',
          pergunta: 'Em <code>while lo &lt; hi: mid = (lo + hi) // 2; if a[mid] &lt; x: lo = mid else: hi = mid</code>, onde está o erro?',
          opcoes: [
            { id: 'a', texto: 'Nenhum: está correto.', correta: false, porque: 'com dois elementos e <code>a[lo] &lt; x</code>, <code>mid == lo</code> e o estado não muda.' },
            { id: 'b', texto: 'O laço deveria ser <code>while lo &lt;= hi</code>.', correta: false, porque: 'com intervalo semiaberto a condição correta é <code>lo &lt; hi</code>.' },
            { id: 'c', texto: '<code>lo = mid</code> pode não avançar e travar o laço; o invariante pede <code>lo = mid + 1</code>, porque <code>a[mid]</code> já foi descartado.', correta: true, porque: 'escreva o invariante primeiro e deduza as atualizações.' }
          ], tutorDepois: 'Terminação: <code>hi − lo</code> precisa diminuir a cada passo.' },
        { tipo: 'escolha', id: 'b5-esc-estavel', titulo: 'Confira: quando a estabilidade importa',
          pergunta: 'Você ordena registros por nome e depois por departamento. Para o resultado final ficar por departamento e, dentro de cada um, por nome, o que precisa valer?',
          opcoes: [
            { id: 'a', texto: 'O segundo sort ser estável (<code>sorted</code> e <code>list.sort</code> são, por garantia da linguagem).', correta: true, porque: 'a estabilidade preserva a ordem por nome entre registros do mesmo departamento.' },
            { id: 'b', texto: 'Ordenar com quicksort, que é mais rápido.', correta: false, porque: 'o quicksort não é estável.' },
            { id: 'c', texto: 'Usar <code>reverse=True</code> no segundo sort.', correta: false, porque: '<code>reverse=True</code> preserva a estabilidade, mas não é o que resolve aqui.' }
          ], tutorDepois: 'Estabilidade é o que permite compor ordenações em passadas.' },
        { tipo: 'texto', html: '<p class="ta-nota">Medições do laboratório (<code>algos.bench</code>) em 11/10/2026, CPython 3.14.7 aarch64; valores absolutos variam. A política de fusão do Timsort (powersort desde o 3.11) e o <code>key=</code> do <code>bisect</code> (3.10) são detalhes de versão; revalide em até 90 dias ou ao trocar o interpretador.</p>' },
        { tipo: 'takeaway', html: 'Dois ponteiros e janela são <mark>O(n)</mark> porque o ponteiro <mark>nunca recua</mark>.' }
      ] }
    ]
  });
})();
