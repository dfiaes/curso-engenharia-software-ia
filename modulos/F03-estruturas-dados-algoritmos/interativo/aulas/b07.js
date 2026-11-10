/* F03 · Bloco 7: Técnicas. Fonte: F03.html#b07. Saídas e medições: execução real do laboratório em 11/10/2026 (CPython 3.14.7, aarch64). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var comum = [
    'def troco_guloso(moedas, valor):',
    '    """Sempre a maior moeda que cabe. Devolve o número de moedas ou None se travar."""',
    '    n = 0',
    '    for c in sorted(moedas, reverse=True):',
    '        n += valor // c',
    '        valor %= c',
    '    return n if valor == 0 else None',
    '',
    '',
    'def troco_dp(moedas, valor):',
    '    """Menor número de moedas (programação dinâmica bottom-up) ou None."""',
    '    INF = float("inf")',
    '    dp = [0] + [INF] * valor',
    '    for v in range(1, valor + 1):',
    '___DP___',
    '    return None if dp[valor] == INF else dp[valor]',
    '',
    '',
    'def edit_distance(a, b):',
    '    """Distância de edição (inserir, remover, substituir), memória O(min(m, n))."""',
    '    if len(a) < len(b):',
    '        a, b = b, a',
    '    prev = list(range(len(b) + 1))',
    '    for i, ca in enumerate(a, 1):',
    '        cur = [i] + [0] * len(b)',
    '        for j, cb in enumerate(b, 1):',
    '___ED___',
    '        prev = cur',
    '    return prev[-1]',
    '',
    '',
    'def n_rainhas(n):',
    '    """Conta as soluções do problema das N rainhas (backtracking com poda)."""',
    '    cols, diag, anti = set(), set(), set()',
    '',
    '    def colocar(lin):',
    '        if lin == n:',
    '            return 1',
    '        total = 0',
    '        for col in range(n):',
    '            if col in cols or lin - col in diag or lin + col in anti:',
    '                continue                      # poda: este ramo já é inválido',
    '            cols.add(col)',
    '            diag.add(lin - col)',
    '            anti.add(lin + col)               # escolhe',
    '            total += colocar(lin + 1)         # recursa',
    '            cols.remove(col)',
    '            diag.remove(lin - col)',
    '___UNDO___',
    '        return total',
    '',
    '    return colocar(0)',
    ''].join('\n');
  var codigo = comum
    .replace('___DP___', ['        # CORRIJA: teste TODAS as moedas que cabem e fique com o mínimo de 1 + dp[v - c]',
      '        c = max((c for c in moedas if c <= v), default=None)',
      '        if c is not None:',
      '            dp[v] = 1 + dp[v - c]'].join('\n'))
    .replace('___ED___', ['            # CORRIJA: se os caracteres coincidem, a diagonal não custa nada',
      '            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + 1)'].join('\n'))
    .replace('___UNDO___', '            # CORRIJA: falta desfazer uma das três escolhas');
  var solucao = comum
    .replace('___DP___', '        dp[v] = min((1 + dp[v - c] for c in moedas if c <= v), default=INF)')
    .replace('___ED___', '            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))')
    .replace('___UNDO___', '            anti.remove(lin + col)                # desfaz');
  var testes = [
    'def test_guloso_acerta_no_sistema_canonico():',
    '    assert troco_guloso([1, 5, 10, 25], 63) == 6',
    '    assert troco_dp([1, 5, 10, 25], 63) == 6',
    '',
    '',
    'def test_guloso_erra_com_1_3_4():',
    '    assert troco_guloso([1, 3, 4], 6) == 3',
    '    assert troco_dp([1, 3, 4], 6) == 2',
    '',
    '',
    'def test_guloso_trava_com_4_3():',
    '    assert troco_guloso([4, 3], 6) is None',
    '    assert troco_dp([4, 3], 6) == 2',
    '',
    '',
    'def test_dp_sem_solucao_e_valor_zero():',
    '    assert troco_dp([5, 10], 3) is None',
    '    assert troco_dp([1], 0) == 0',
    '',
    '',
    'def test_dp_contra_forca_bruta_em_entradas_pequenas():',
    '    import itertools',
    '    def bruta(moedas, valor):',
    '        melhor = None',
    '        for k in range(valor + 1):',
    '            for comb in itertools.combinations_with_replacement(moedas, k):',
    '                if sum(comb) == valor:',
    '                    return k',
    '        return melhor',
    '    for moedas in ([1, 3, 4], [2, 5], [3, 7, 8]):',
    '        for v in range(0, 16):',
    '            assert troco_dp(moedas, v) == bruta(moedas, v)',
    '',
    '',
    'def test_edit_distance():',
    '    assert edit_distance("kitten", "sitting") == 3',
    '    assert edit_distance("", "abc") == 3',
    '    assert edit_distance("abc", "abc") == 0',
    '    assert edit_distance("sitting", "kitten") == 3',
    '',
    '',
    'def test_n_rainhas():',
    '    assert [n_rainhas(n) for n in (1, 2, 3, 4, 6, 8)] == [1, 0, 0, 2, 4, 92]',
    ''].join('\n');

  TrilhaAula.registrar({
    id: 'f03-b7',
    titulo: 'Técnicas: recursão, divisão e conquista, programação dinâmica, guloso e backtracking',
    minutos: 55,
    resumo: 'Problemas novos não vêm com rótulo: "quais mensagens cabem no orçamento de tokens", "menor sequência de edições entre dois textos", "todas as combinações válidas". Cinco técnicas e um roteiro para escolher entre elas.',
    objetivo: 'Reconhecer quando um problema pede recursão, divisão e conquista, programação dinâmica, guloso ou backtracking, e seguir um roteiro de revisão quando o problema é novo.',
    revisao: [
      { id: 'f03b7-recursao', pergunta: 'Em CPython padrão, <code>soma(5000)</code> com <code>soma(n) = n + soma(n-1)</code> faz o quê, e qual a correção robusta?',
        opcoes: [
          opc('a', '<code>RecursionError</code> (limite ≈1000 quadros); converta em laço com acumulador ou pilha explícita', true, 'o CPython não faz otimização de chamada em cauda; <code>setrecursionlimit</code> é paliativo e pode derrubar o processo.'),
          opc('b', 'Devolve 12502500', false, 'estoura antes: cada chamada ocupa um quadro de pilha.'),
          opc('c', 'Devolve 0', false, 'não há truncamento silencioso.')] },
      { id: 'f03b7-dp', pergunta: 'Quais duas propriedades um problema precisa ter para a programação dinâmica valer?',
        opcoes: [
          opc('a', 'Subestrutura ótima e subproblemas sobrepostos', true, 'guarda cada estado uma vez: fib(30) vai de 2.692.537 chamadas a 31 com <code>@cache</code>.'),
          opc('b', 'Subproblemas independentes e escolha local segura', false, 'independentes é divisão e conquista; escolha local segura é guloso.'),
          opc('c', 'Entrada ordenada e pesos não negativos', false, 'são condições de outros algoritmos.')] },
      { id: 'f03b7-guloso', pergunta: 'Moedas {1, 3, 4} e troco de 6: o que o guloso devolve e por que isso importa?',
        opcoes: [
          opc('a', '4+1+1 (3 moedas) contra o ótimo 3+3 (2): só vale com a propriedade de escolha gulosa, provada ou testada contra DP ou força bruta', true, 'com {4,3} e valor 6 o guloso nem acha solução (devolve falha, mas existe 3+3).'),
          opc('b', '3+3: o guloso sempre acha o ótimo', false, 'ele pega a maior moeda possível primeiro.'),
          opc('c', 'Nada, porque 6 não tem solução', false, '3+3 existe.')] },
      { id: 'f03b7-backtrack', pergunta: 'Qual o padrão do backtracking e qual o bug clássico?',
        opcoes: [
          opc('a', 'Escolher, recursar, desfazer, com poda; o bug é guardar a mesma lista mutável em vez de uma cópia ou esquecer um dos "desfaz"', true, 'teste contra a força bruta em entradas pequenas e compare contagens.'),
          opc('b', 'Gerar todas as possibilidades e filtrar no fim', false, 'isso é força bruta, sem poda.'),
          opc('c', 'Recursar sempre pelo menor candidato', false, 'a ordem de escolha é decisão de poda, não o padrão.')] },
      { id: 'f03b7-roteiro', pergunta: 'Qual a ordem do roteiro para um problema novo?',
        opcoes: [
          opc('a', 'Reformular, fazer a bruta e correta, achar o gargalo, reconhecer o padrão, declarar o custo, testar contra a bruta, medir se importa', true, 'a bruta é o oráculo para a versão rápida; é também o prompt de revisão de código de IA.'),
          opc('b', 'Escolher a técnica, otimizar, depois escrever testes', false, 'sem bruta não há oráculo.'),
          opc('c', 'Medir primeiro, depois reformular', false, 'medir vem por último, e só se o trecho for quente.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Os blocos anteriores deram estruturas e algoritmos prontos. Problemas novos chegam como "dado este histórico de conversa, escolha quais mensagens manter no contexto dentro de um orçamento de tokens" (mochila), "qual a menor sequência de edições entre dois textos" (programação dinâmica), "gere todas as combinações válidas de configuração" (backtracking).</p>' +
          '<h3>Recursão e o limite do Python</h3>' +
          '<p><strong>Recursão</strong> é definir a solução em termos de instâncias menores do mesmo problema: um caso base e um passo que reduz. Cada chamada ocupa um <em>quadro</em> de pilha, então a profundidade é memória. O CPython limita a profundidade (<code>sys.getrecursionlimit()</code>, padrão 1000) e levanta <code>RecursionError</code>; não faz otimização de chamada em cauda, por decisão de design (rastros de pilha legíveis). Três saídas, em ordem de preferência: (1) <strong>laço com pilha explícita</strong> (como a DFS iterativa do bloco 6); (2) <strong>reformular de baixo para cima</strong> (DP iterativa); (3) <code>sys.setrecursionlimit</code>, um paliativo que troca o <code>RecursionError</code> limpo por consumo de memória e, em chamadas que passam por C (<code>__eq__</code> recursivo, <code>repr</code>, <code>json</code>), por falha do processo. Com dados controlados por terceiros é uma negação de serviço pronta: um JSON muito aninhado derruba o parser recursivo.</p>' +
          '<h3>Divisão e conquista</h3>' +
          '<p>Divida em subproblemas <em>independentes</em> do mesmo tipo, resolva, combine. O custo vem da recorrência <code>T(n) = a·T(n/b) + f(n)</code>; o Teorema Mestre compara f(n) com n^(log_b a): se a combinação domina, T = Θ(f); se as folhas dominam, T = Θ(n^(log_b a)); se empatam, multiplica-se por log n. Se os subproblemas se <em>sobrepõem</em>, a versão ingênua recalcula exponencialmente: é a fronteira com a programação dinâmica.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Algoritmo</th><th>Recorrência</th><th>Custo</th></tr></thead><tbody>' +
          '<tr><td>busca binária</td><td>T(n) = T(n/2) + O(1)</td><td>O(log n)</td></tr>' +
          '<tr><td>potência por quadrados</td><td>T(n) = T(n/2) + O(1)</td><td>O(log n) multiplicações</td></tr>' +
          '<tr><td>merge sort</td><td>T(n) = 2T(n/2) + O(n)</td><td>O(n log n)</td></tr>' +
          '<tr><td>soma de lista por metades</td><td>T(n) = 2T(n/2) + O(1)</td><td>O(n)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'Cada nível de recursão custa um <mark>quadro de pilha</mark>; divisão e conquista exige subproblemas <mark>independentes</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'b7-demo', titulo: 'Recursão, DP, guloso e potência modular', prefixo: '$', entrada: 'uv run python -m algos.demo recursion && uv run python -m algos.demo dp', unidade: 'x', terminalTitulo: 'saída real do laboratório',
          enunciado: 'O limite de recursão, o ganho da memoização em <code>fib(30)</code>, o guloso contra a DP no troco e a potência modular por quadrados.',
          prever: { pergunta: '<code>fib(30)</code> recursivo ingênuo faz 2.692.537 chamadas. Quantas faz a versão com <code>@functools.cache</code>?', opcoes: [
            { id: 'a', texto: 'Cerca de 1,3 milhão: metade', correta: false, porque: 'a memoização elimina a repetição, não a divide por 2.' },
            { id: 'b', texto: '31: uma chamada por valor de n (0 a 30)', correta: true, porque: 'medido: 85 ms contra 14 µs; a ingênua cresce com φⁿ (≈1,6ⁿ), com fib(40) seriam 330 milhões de chamadas.' },
            { id: 'c', texto: 'Cerca de 30 mil', correta: false, porque: 'cada subproblema é calculado uma vez, então o total é linear em n.' }
          ] },
          etapas: [
            { id: 'rec', nome: 'Limite de recursão', descricao: 'recursion', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'uv run python -m algos.demo recursion'),
              L('out', 'recursion limit: 1000'),
              L('out', 'depth reached by a trivial function (varies by interpreter state): 994'),
              L('out', 'RecursionError: maximum recursion depth exceeded'),
              L('hint', '994 e não 1000: o interpretador e as chamadas anteriores já ocupam quadros')] },
            { id: 'fib', nome: 'fib(30)', descricao: 'ingênua contra memoizada', tom: 'request', ms: 3, linhas: [
              L('out', 'recursiva ingênua      2.692.537 chamadas   85 ms'),
              L('out', '@functools.cache               31 chamadas   14 µs'),
              L('hint', 'medido nesta máquina, CPython 3.14.7')] },
            { id: 'troco', nome: 'Guloso contra DP no troco', descricao: 'demo dp', tom: 'response', ms: 3, linhas: [
              L('cmd', 'uv run python -m algos.demo dp'),
              L('out', 'coins=[1, 5, 10, 25] amount=63: greedy=6 dp=6'),
              L('out', 'coins=[1, 3, 4] amount=6: greedy=3 dp=2'),
              L('out', 'coins=[4, 3] amount=6: greedy=None dp=2'),
              L('out', 'fast_power(7, 2026, 1000) = 649 | pow: 649'),
              L('hint', 'potência modular por quadrados: ≈11 multiplicações em vez de 2026, sem formar o número de ~1700 dígitos')] }
          ],
          tutorDepois: 'Com {4,3} e valor 6 o guloso pega o 4, sobra 2 e devolve falha, embora 3+3 exista.',
          callout: 'Você viu o limite de pilha, o ganho da memoização e o guloso errando.' },
        { tipo: 'texto', html:
          '<h3>Programação dinâmica</h3>' +
          '<p>A <strong>programação dinâmica</strong> (DP) resolve problemas com <strong>subestrutura ótima</strong> (a solução ótima contém soluções ótimas de subproblemas) e <strong>subproblemas sobrepostos</strong>: calcula cada subproblema uma vez e guarda. Receita em quatro passos: (1) <strong>defina o estado</strong> (<code>d[i][j]</code> = custo de transformar <code>a[:i]</code> em <code>b[:j]</code>); (2) <strong>escreva a recorrência</strong> com os casos base; (3) <strong>conte estados × custo por estado</strong> (edit distance: m·n estados, O(1) cada → O(m·n)); (4) <strong>escolha a ordem</strong>: top-down (recursão com memo) ou bottom-up (tabela por ordem de dependência).</p>' +
          '<p><strong>Distância de edição</strong>: menor número de inserções, remoções e substituições que transformam <code>a</code> em <code>b</code>. Se os últimos caracteres coincidem, <code>d(i,j) = d(i-1,j-1)</code>; senão, <code>1 + min(d(i-1,j), d(i,j-1), d(i-1,j-1))</code>. Casos base: <code>d(i,0) = i</code>, <code>d(0,j) = j</code>. Cada célula depende da de cima, da esquerda e da diagonal, então só a linha anterior fica na memória: tempo O(m·n), memória O(min(m, n)); <code>edit_distance("kitten", "sitting") = 3</code>. Medido: duas strings de 400 caracteres passam na versão top-down (54 ms); com 600, ela levanta <code>RecursionError</code>, enquanto a bottom-up resolve 1000 × 1000 em 74 ms. Critério prático: <strong>top-down para escrever e verificar rápido; bottom-up quando o tamanho pode exceder a pilha ou quando se quer reduzir memória</strong>. Usos: diff de texto, correção ortográfica, alinhamento de sequências, WER de transcrição e a mochila para escolher o que cabe no orçamento de contexto.</p>' },
        { tipo: 'takeaway', html: 'DP guarda cada <mark>estado</mark> uma vez; <mark>bottom-up</mark> não estoura a pilha.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Guloso</h3>' +
          '<p>A estratégia <strong>gulosa</strong> faz a melhor escolha local a cada passo e nunca volta atrás. Só é correta com a <strong>propriedade de escolha gulosa</strong> (existe uma solução ótima que contém a escolha local) mais subestrutura ótima. Casos comprovados: seleção de intervalos por menor tempo de término, Huffman, Dijkstra, Prim/Kruskal e troco com moedas "canônicas". A técnica de prova é o <em>argumento de troca</em>: tome uma solução ótima qualquer e mostre que trocar a primeira escolha pela gulosa não a piora. Sem prova nem contraexemplo exaustivo (compare com força bruta em entradas pequenas ou com a DP), use DP.</p>' +
          '<h3>Backtracking</h3>' +
          '<p>Construa a solução passo a passo; se uma escolha não pode levar a solução válida, <em>desfaça</em> e tente a próxima. É DFS sobre o espaço de decisões, com <strong>poda</strong>: cortar o ramo assim que uma restrição é violada. Sem poda é força bruta (2ⁿ subconjuntos, n! permutações). O padrão é sempre <strong>escolher, recursar, desfazer</strong>. As N rainhas, com conjuntos de colunas e diagonais ocupadas, dão 4 soluções para n = 6, 92 para n = 8 e 724 para n = 10 (medido: 22 ms, em vez dos 10¹⁰ posicionamentos da força bruta). A qualidade da poda decide tudo, e testar primeiro a restrição mais restritiva também. Aplicações: sudoku, configuração, geração de combinações com regras e resolvedores de dependência de versão.</p>' },
        { tipo: 'python', id: 'b7-python', titulo: 'DP do troco, distância de edição e N rainhas', obrigatorio: false,
          enunciado: 'Três defeitos marcados com <code>CORRIJA</code>: a DP do troco só testa a maior moeda (vira guloso), a distância de edição cobra a diagonal mesmo quando os caracteres coincidem, e as N rainhas esquecem de desfazer uma das escolhas. O teste de força bruta é o oráculo da DP.',
          codigo: codigo, testes: testes,
          dica: 'Troco: <code>dp[v] = min((1 + dp[v - c] for c in moedas if c &lt;= v), default=INF)</code>. Edição: <code>prev[j - 1] + (ca != cb)</code>. Rainhas: <code>anti.remove(lin + col)</code> junto aos outros dois "desfaz".',
          solucao: solucao,
          tutorDepois: 'O guloso fica no código como contraexemplo: os testes mostram onde ele erra e onde a DP acerta.',
          callout: 'A DP bateu com a força bruta, a edição deu 3 e as rainhas contaram 92.' },
        { tipo: 'ordene', id: 'b7-ordene', titulo: 'Monte o roteiro para um problema novo', obrigatorio: false,
          enunciado: 'Ordene os passos de modo que evitem retrabalho.',
          itens: [
            { id: 'd', texto: 'Reconhecer o padrão (dois ponteiros, DP, grafo, heap…)' },
            { id: 'b', texto: 'Escrever a solução bruta, simples e correta' },
            { id: 'f', texto: 'Testar a versão otimizada contra a bruta em entradas aleatórias pequenas' },
            { id: 'a', texto: 'Reformular: entrada, saída, restrições de tamanho e exemplos pequenos (vazio e um elemento)' },
            { id: 'c', texto: 'Achar o gargalo: o que se repete ou cresce demais' },
            { id: 'e', texto: 'Declarar o custo de tempo e memória da versão nova' }
          ],
          solucao: ['a', 'b', 'c', 'd', 'e', 'f'], dica: 'A bruta vem antes do gargalo porque é nela que você o enxerga; o teste contra a bruta fecha.',
          callout: 'Reformular, bruta, gargalo, padrão, custo, teste contra a bruta.' },
        { tipo: 'takeaway', html: 'Guloso <mark>sem prova</mark> é aposta; DP e <mark>força bruta pequena</mark> são o seu oráculo.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'transcript', id: 'b7-transcript', titulo: 'A mochila do contexto', obrigatorio: false, terminalTitulo: 'revisão de código gerado por IA',
          enunciado: 'O agente implementou a escolha de mensagens para um orçamento de 8.000 tokens. Uma afirmação dele não é sustentada. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Escolha mensagens para caber em 8.000 tokens maximizando a relevância somada.' },
            { quem: 'agente', texto: 'Ordenei por pontuação/custo e fui pegando até encher o orçamento.' },
            { quem: 'ferramenta', texto: '$ pytest tests/test_contexto.py\n3 passed (entradas de 4 mensagens)' },
            { quem: 'agente', texto: 'O guloso por razão pontuação/custo é ótimo, os testes confirmam.' }
          ],
          erradas: [3],
          explicacao: { 3: 'é uma mochila 0/1; o guloso por razão não é ótimo em geral (pode desperdiçar espaço com um item grande e valioso), e 3 testes pequenos não provam a propriedade de escolha gulosa. Peça a DP pseudo-polinomial O(n·W) com W = 8.000 como oráculo, ou declare o guloso como aproximação e compare com a DP em amostras. Mensagens contíguas e recência mudam o modelo.' },
          tutorDepois: 'Sem prova nem contraexemplo exaustivo, use DP ou declare a aproximação.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: estado compartilhado e não desfeito', html:
          '<p>O bug clássico de backtracking é anexar a <em>mesma lista mutável</em> (<code>found.append(chosen)</code>) em vez de uma cópia (<code>list(chosen)</code>): no fim todos os resultados apontam para a mesma lista, já vazia. O outro é esquecer um dos "desfaz": funciona nos primeiros ramos e erra depois. Teste sempre contra a força bruta e compare contagens.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: @cache sem limite', html:
          '<p><code>functools.cache</code> guarda todo resultado para sempre: num serviço de longa duração com argumentos variados, a memória cresce sem fim. Use <code>lru_cache(maxsize=N)</code> e meça a taxa de acerto (<code>cache_info()</code>). Em métodos, o cache referencia <code>self</code> e impede a coleta do objeto; prefira um cache no módulo ou por instância. A memoização exige argumentos hasheáveis e funções puras: uma função que lê relógio, arquivo ou banco devolve resultado velho.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'O roteiro como prompt de revisão', html:
          '<p>Peça ao agente a <strong>solução bruta</strong>, o <strong>custo declarado</strong>, o <strong>teste contra o oráculo</strong> e as <strong>bordas</strong> (vazio, um elemento, tudo igual, já ordenado, ordenado ao contrário, ciclo, desconexo, entrada máxima). Um modelo costuma entregar o custo e as bordas sem pedir; é você quem exige a bruta e a medição. Padrões: "menor número de passos" → BFS; "ordem com dependências" → topológica; "menor custo com pesos" → Dijkstra; "melhor entre trechos contíguos" → janela; "todas as soluções válidas" → backtracking; "subproblemas repetidos" → DP; "resposta monótona" → busca binária sobre a resposta; "escolha local óbvia" → guloso, com prova ou contraexemplo testado.</p>' },
        { tipo: 'escolha', id: 'b7-esc-troco', titulo: 'Confira: o troco de 6',
          pergunta: 'Moedas {1, 3, 4} e troco de 6. O guloso (sempre a maior moeda possível) e a melhor resposta são:',
          opcoes: [
            { id: 'a', texto: 'Os dois dão 4 + 1 + 1.', correta: false, porque: 'o ótimo é 3 + 3.' },
            { id: 'b', texto: 'O guloso dá 3 + 3; o ótimo é 4 + 1 + 1.', correta: false, porque: 'está invertido.' },
            { id: 'c', texto: 'O guloso dá 4 + 1 + 1 (3 moedas); o ótimo é 3 + 3 (2 moedas), e só a DP acha.', correta: true, porque: 'para sistemas canônicos (1, 5, 10, 25) o guloso serve; para {1, 3, 4} não. Sem prova, DP sobre "menor número de moedas para cada valor até 6".' }
          ], tutorDepois: 'Propriedade de escolha gulosa: a escolha local nunca impede o ótimo global.' },
        { tipo: 'escolha', id: 'b7-esc-pilha', titulo: 'Confira: DP top-down com 600 caracteres',
          pergunta: 'A edit distance top-down com <code>@cache</code> passa com strings de 400 caracteres e levanta <code>RecursionError</code> com 600. Qual a correção?',
          opcoes: [
            { id: 'a', texto: 'Aumentar o limite com <code>sys.setrecursionlimit</code> para 10⁶.', correta: false, porque: 'paliativo: troca o erro limpo por consumo de memória e risco de falha do processo.' },
            { id: 'b', texto: 'Reescrever bottom-up com a linha anterior (O(m·n) tempo, O(min(m, n)) memória).', correta: true, porque: 'a bottom-up resolveu 1000 × 1000 em 74 ms no lab e não depende da pilha.' },
            { id: 'c', texto: 'Capturar o RecursionError e devolver o último valor.', correta: false, porque: 'devolveria um resultado parcial e errado.' }
          ], tutorDepois: 'Top-down para escrever e verificar; bottom-up quando o tamanho pode exceder a pilha.' },
        { tipo: 'texto', html: '<p class="ta-nota">Saídas e medições do laboratório (<code>algos.demo recursion|dp</code>, <code>algos.bench</code>) de 11/10/2026, CPython 3.14.7 aarch64; os valores absolutos variam por máquina. O limite padrão de recursão (1000) e a profundidade atingível (994) dependem do estado do interpretador. Revalide em até 90 dias ou ao trocar a versão.</p>' },
        { tipo: 'takeaway', html: 'Para um problema novo: <mark>reformule</mark>, faça a <mark>bruta</mark>, ache o gargalo, declare o custo e <mark>teste contra a bruta</mark>.' }
      ] }
    ]
  });
})();
