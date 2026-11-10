/* F02 · Bloco 4: coleções por dentro. Fonte: F02.html#b04. Medições de 11/10/2026 (Python 3.14.7, ilustrativas: o valor absoluto varia com a máquina; a razão é o ponto). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var J = function (a) { return a.join('\n') + '\n'; };

  TrilhaAula.registrar({
    id: 'f02-b4',
    titulo: 'Coleções por dentro',
    minutos: 40,
    resumo: 'list é um vetor de referências; dict e set são tabelas de hash. Conhecer o mecanismo de cada estrutura permite prever custo e comportamento, em vez de decorar API.',
    objetivo: 'Escolher list, dict, set, deque, Counter ou defaultdict pelo custo de cada operação; ordenar com key; copiar sabendo o que é compartilhado; agrupar com groupby sem cair na armadilha da ordenação.',
    revisao: [
      { id: 'f02b4-custo', pergunta: 'Qual o custo de x in lista, de x in conjunto e de lista.pop(0)?',
        opcoes: [
          opc('a', 'Linear na lista, O(1) médio no conjunto, e pop(0) é O(n); para fila use collections.deque', true, 'pop(0) desloca todos os elementos; deque.popleft é O(1).'),
          opc('b', 'O(1) nos dois, e pop(0) é O(1)', false, 'a lista busca por varredura e desloca elementos ao tirar do início.'),
          opc('c', 'O(log n) nos dois', false, 'nem lista nem set usam busca binária para pertinência.')] },
      { id: 'f02b4-hash', pergunta: 'Qual contrato une dict, set e hash, e por que só imutáveis servem de chave?',
        opcoes: [
          opc('a', 'Se a == b então hash(a) == hash(b), e o hash não pode mudar durante a vida do objeto', true, 'por isso {1: "a", 1.0: "b", True: "c"} vira {1: "c"}: as três chaves são a mesma.'),
          opc('b', 'O hash é a identidade (id) do objeto', false, 'valores iguais precisam do mesmo hash, e ids de objetos distintos diferem.'),
          opc('c', 'Chaves são ordenadas por hash', false, 'desde o 3.7 o dict preserva a ordem de inserção.')] },
      { id: 'f02b4-copia', pergunta: 'Depois de g = [[0] * 2] * 3 e g[0][0] = 1, quanto vale g?',
        opcoes: [
          opc('a', '[[1, 0], [1, 0], [1, 0]]: o * repete a referência, as três posições são a mesma sublista', true, 'o idioma correto é [[0] * 2 for _ in range(3)].'),
          opc('b', '[[1, 0], [0, 0], [0, 0]]', false, 'só a comprehension cria três sublistas independentes.'),
          opc('c', 'Erro: não se multiplica lista de listas', false, 'a operação é válida e enganosa.')] },
      { id: 'f02b4-groupby', pergunta: 'Para itertools.groupby(["a", "b", "a"]), quantos grupos saem e o que isso exige?',
        opcoes: [
          opc('a', '3 grupos: groupby junta só corridas consecutivas, então a entrada deve vir ordenada pela mesma chave', true, 'diferente do GROUP BY do SQL; para contar sem ordenar use Counter ou dict.'),
          opc('b', '2 grupos: a e b', false, 'groupby não olha o resto da sequência.'),
          opc('c', '1 grupo', false, 'não há agrupamento global.')] },
      { id: 'f02b4-sort', pergunta: 'O que há de certo sobre sorted e list.sort?',
        opcoes: [
          opc('a', 'sorted devolve nova lista; sort ordena no lugar e devolve None; o Timsort é estável e o key é chamado uma vez por elemento', true, 'x = x.sort() apaga x; a estabilidade permite ordenar por vários critérios em passadas.'),
          opc('b', 'Os dois devolvem a lista ordenada', false, 'sort devolve None.'),
          opc('c', 'A ordenação é instável, então empates ficam em ordem aleatória', false, 'o Timsort é estável.')] }
    ],
    abas: [
      { rotulo: 'Listas, dicts e sets', blocos: [
        { tipo: 'texto', html:
          '<h3>O erro de desempenho mais comum</h3>' +
          '<p>Escolher a coleção errada é o erro de desempenho mais comum em código Python de produção: um <code>if x in lista</code> dentro de laço transforma O(n) em O(n²); um <code>pop(0)</code> em "fila" faz cada retirada custar o tamanho da fila; uma lista usada como chave de cache lança <code>TypeError</code> só em execução. Conhecer o <em>mecanismo</em> permite prever custo. A análise formal de complexidade e as implementações à mão (array dinâmico, tabela de hash, colisões) ficam no F03; aqui o objetivo é o que o CPython faz com as estruturas embutidas.</p>' +
          '<h3><code>list</code>: um vetor dinâmico de referências</h3>' +
          '<p>Uma <code>list</code> é um array contíguo de <strong>ponteiros</strong> para objetos (nunca os valores em linha), com capacidade reservada além do tamanho. <code>append</code> usa a folga; quando acaba, aloca um bloco maior e copia os ponteiros. O custo é O(1) <em>amortizado</em>: raras cópias grandes diluídas em muitos <code>append</code> baratos.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> import sys\n>>> l = []; prev = -1\n>>> for i in range(40):\n...     l.append(i); s = sys.getsizeof(l)\n...     if s != prev: print(len(l), s, end=" | "); prev = s\n1 88 | 5 120 | 9 184 | 17 248 | 25 312 | 33 376 |' },
        { tipo: 'texto', html:
          '<p>Em vez de crescer 1 a 1, a capacidade salta (4, 8, 16, 24, 32, 40 posições nesta versão; a fórmula exata é detalhe de implementação). O tamanho em bytes inclui só os ponteiros (8 bytes cada), não os objetos apontados.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Operação</th><th><code>list</code></th><th><code>deque</code></th><th><code>dict</code> / <code>set</code></th></tr></thead><tbody>' +
          '<tr><td>acesso por índice / chave</td><td>O(1)</td><td>O(n) no meio</td><td>O(1) médio</td></tr>' +
          '<tr><td><code>x in c</code></td><td>O(n)</td><td>O(n)</td><td>O(1) médio</td></tr>' +
          '<tr><td>inserir/remover no fim</td><td>O(1) amortizado</td><td>O(1)</td><td>-</td></tr>' +
          '<tr><td>inserir/remover no início</td><td>O(n)</td><td>O(1)</td><td>-</td></tr>' +
          '<tr><td>inserir/remover no meio</td><td>O(n)</td><td>O(n)</td><td>-</td></tr>' +
          '<tr><td>ordenar</td><td>O(n log n)</td><td>-</td><td>-</td></tr></tbody></table>' },
        { tipo: 'texto', html:
          '<h3><code>dict</code> e <code>set</code>: tabelas de hash</h3>' +
          '<p>Um <code>dict</code> guarda pares chave→valor numa tabela de hash: <code>hash(chave)</code> escolhe uma posição; se há colisão, a sonda segue a sequência de endereçamento aberto; ao achar um slot com hash igual, confirma com <code>==</code>. Daí o contrato que une tudo: <strong>se <code>a == b</code>, então <code>hash(a) == hash(b)</code></strong>, e o hash não pode mudar durante a vida do objeto, razão pela qual só imutáveis (e objetos com <code>__hash__</code> estável) servem como chave.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> {1: "a", 1.0: "b", True: "c"}\n{1: \'c\'}\n>>> 1 in {1.0}, hash(1) == hash(1.0)\n(True, True)\n>>> d = {"b": 1, "a": 2}; d["c"] = 3; del d["b"]; d["b"] = 9; list(d)\n[\'a\', \'c\', \'b\']\n>>> for k in d: d[k + "x"] = 1\nRuntimeError: dictionary changed size during iteration' },
        { tipo: 'texto', html:
          '<p><code>1</code>, <code>1.0</code> e <code>True</code> são iguais e têm o mesmo hash, logo são <em>a mesma chave</em>; a primeira chave é mantida e o último valor vence. Desde o Python 3.7, o <code>dict</code> <strong>preserva a ordem de inserção</strong> (garantia da linguagem): re-inserir uma chave removida a coloca no fim. Alterar o tamanho enquanto se itera é erro detectado; alterar <em>valores</em> de chaves existentes é permitido; para modificar a estrutura, itere sobre uma cópia (<code>list(d)</code>). Atualização e mescla: <code>d.update(...)</code> muta; <code>d1 | d2</code> cria novo, com o da direita vencendo (<code>{"a": 1} | {"a": 3, "b": 2}</code> → <code>{\'a\': 3, \'b\': 2}</code>).</p>' +
          '<p>O <code>set</code> é um <code>dict</code> sem valores: pertinência O(1), álgebra de conjuntos (<code>&amp;</code>, <code>|</code>, <code>-</code>, <code>^</code>) e <em>sem ordem garantida</em>. Não use <code>set</code> para deduplicar quando a ordem importa; use <code>dict.fromkeys(itens)</code>, que deduplica preservando a ordem. Um <code>dict</code> de 1000 itens ocupa cerca de 37 KB neste CPython, bem mais que uma lista: troca-se espaço por tempo. A ordem de iteração de um <code>set</code> de <code>str</code> varia entre execuções (hash randomization de texto): nunca dependa dela.</p>' +
          '<p>A biblioteca padrão acrescenta, em <code>collections</code>: <code>deque</code> (fila de duas pontas), <code>Counter</code> (<code>Counter("abracadabra").most_common(2)</code> → <code>[(\'a\', 5), (\'b\', 2)]</code>), <code>defaultdict</code> (valor padrão por chave ausente: <code>defaultdict(list)</code>) e <code>OrderedDict</code> (raro hoje). <code>tuple</code> é a sequência imutável: ideal para registros curtos e chaves compostas.</p>' },
        { tipo: 'takeaway', html: '<code>list</code> é vetor de referências com <mark>append amortizado</mark>; <code>dict</code> e <code>set</code> são <mark>tabelas de hash</mark>: pertinência O(1) médio, chaves imutáveis, <code>dict</code> ordenado por inserção.' }
      ] },

      { rotulo: 'Custo na prática', blocos: [
        { tipo: 'texto', html:
          '<p>Medição ilustrativa (o valor absoluto varia com a máquina; a razão é o ponto), 2000 repetições. Preveja a diferença entre a busca em lista e em conjunto antes de rodar.</p>' },
        { tipo: 'rode', id: 'f02b4-rode', titulo: 'Lista, conjunto e fila', enunciado: 'Rode o benchmark. As barras mostram o tempo total de cada medição, em ms.',
          prefixo: '$', entrada: 'python -m timeit bench.py', unidade: 'ms', terminalTitulo: 'terminal',
          etapas: [
            { id: 'lista', nome: '9999 in lista', descricao: 'Lista de 10 000', tom: 'dns', ms: 88.7, linhas: [
              L('cmd', '"9999 in l"  (lista de 10 000)'), L('out', '0.0887 s'),
              L('hint', 'busca linear: percorre até achar')] },
            { id: 'set', nome: '9999 in conjunto', descricao: 'Set com os mesmos itens', tom: 'tcp', ms: 0.026, linhas: [
              L('cmd', '"9999 in s"  (set)'), L('out', '0.000026 s'),
              L('hint', 'busca por hash: O(1) médio')] },
            { id: 'pop0', nome: 'lista.pop(0)', descricao: 'Fila feita com lista de 100 000', tom: 'tls', ms: 256.1, linhas: [
              L('cmd', '"l.pop(0)"   (lista de 100 000)'), L('out', '0.2561 s'),
              L('hint', 'cada retirada desloca todos os elementos')] },
            { id: 'popleft', nome: 'deque.popleft()', descricao: 'Fila de verdade', tom: 'response', ms: 0.25, linhas: [
              L('cmd', '"q.popleft()" (deque)'), L('out', '0.00025 s'),
              L('hint', 'O(1): a deque é feita para as duas pontas')] },
            { id: 'regra', nome: 'A razão', descricao: 'Ordens de grandeza', tom: 'ink', ms: 3, linhas: [
              L('in', 'três ordens de grandeza: não é micro-otimização, é a diferença entre estruturas'),
              L('hint', 'muitas buscas de pertinência: converta uma vez para set/dict; fila: collections.deque')] }
          ],
          prever: { pergunta: 'Quantas vezes a busca 9999 in conjunto é mais rápida que 9999 in lista (10 000 itens)?', opcoes: [
            { id: 'a', texto: 'Cerca de 2 vezes: a diferença é só de constante.', correta: false, porque: 'a diferença é de complexidade (O(n) contra O(1) médio), não de constante.' },
            { id: 'b', texto: 'Cerca de 10 vezes.', correta: false, porque: 'o ganho cresce com n; com 10 000 itens a razão é muito maior.' },
            { id: 'c', texto: 'Mais de mil vezes (aqui, ordem de 3 mil).', correta: true, porque: '0,0887 s contra 0,000026 s: três ordens de grandeza.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Depois clique em "A razão".',
          tutorDepois: 'Os números variam por máquina, a razão não. Regra de ouro: se você faz muitas buscas de pertinência, converta uma vez para set/dict; se faz fila, use collections.deque.',
          callout: 'Você viu três ordens de grandeza vindas só da escolha da estrutura.' },
        { tipo: 'cenario', id: 'f02b4-cenario', titulo: 'A fila que engasga', obrigatorio: false,
          enunciado: 'Um processador de pedidos mantém a fila numa list e retira com pop(0). Em 100 000 pedidos o tempo explode. Decida o que fazer.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A latência cresce com o tamanho da fila. O que você faz primeiro?', opcoes: [
              { texto: 'Trocar a lista por collections.deque e usar popleft().', vai: 'f-bom', tom: 'ok', consequencia: 'cada retirada passa de O(n) para O(1).' },
              { texto: 'Adicionar mais um worker para tirar itens em paralelo da mesma lista.', vai: 'f-paralelo', tom: 'ruim', consequencia: 'cada pop(0) continua caro e agora há disputa pela estrutura.' },
              { texto: 'Converter a lista em set para tirar itens mais rápido.', vai: 'f-set', tom: 'ruim', consequencia: 'o set não tem ordem garantida: a fila deixa de ser fila.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'A fila fica linear no total. Se você também faz buscas de pertinência, mantenha um set à parte, convertido uma vez.' },
            'f-paralelo': { bom: false, texto: 'O custo por retirada não mudou; paralelizar um algoritmo O(n) por item só espalha o gargalo.' },
            'f-set': { bom: false, texto: 'A ordem de chegada se perdeu: pedidos passam a ser atendidos fora de ordem.' }
          },
          callout: 'Você trocou a estrutura em vez de paralelizar o custo.' },
        { tipo: 'takeaway', html: 'Mede-se a <mark>razão</mark>, não o valor absoluto: busca repetida pede <mark>set/dict</mark>; fila pede <mark>deque</mark>.' }
      ] },

      { rotulo: 'Ordenar, copiar, comprimir', blocos: [
        { tipo: 'texto', html:
          '<h3>Ordenação</h3>' +
          '<p><code>sorted(iterável, key=..., reverse=...)</code> devolve nova lista; <code>lista.sort()</code> ordena no lugar e devolve <code>None</code> (confundir os dois é bug clássico: <code>x = x.sort()</code> apaga <code>x</code>). O algoritmo é o Timsort: O(n log n), <strong>estável</strong> (elementos de chave igual mantêm a ordem relativa) e rápido em dados parcialmente ordenados. O <code>key</code> é chamado <em>uma vez por elemento</em> e as chaves é que são comparadas; a estabilidade permite ordenar por vários critérios em passadas, ou usar tupla como chave.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> sorted(["b", "A", "a", "B"])\n[\'A\', \'B\', \'a\', \'b\']\n>>> sorted(["b", "A", "a", "B"], key=str.casefold)\n[\'A\', \'a\', \'b\', \'B\']\n>>> sorted([("x", 2), ("y", 1), ("z", 2)], key=lambda t: -t[1])\n[(\'x\', 2), (\'z\', 2), (\'y\', 1)]' },
        { tipo: 'texto', html:
          '<p>Texto é ordenado por ponto de código (maiúsculas antes de minúsculas, acentuadas depois de <code>z</code>); ordem alfabética "humana" exige <code>locale</code> ou ICU. Veja o uso real em <code>total_by_category</code>, que ordena por <code>(-total, nome)</code>: maior total primeiro, e o nome desempata de forma determinística.</p>' +
          '<h3>Comprehensions, unpacking e geradores de coleção</h3>' +
          '<p>Comprehensions constroem coleções a partir de iteráveis numa expressão: <code>[f(x) for x in xs if p(x)]</code>, <code>{k: v for ...}</code>, <code>{x for ...}</code>. Têm <strong>escopo próprio</strong> (a variável não vaza) e, quando o resultado é consumido de uma vez, uma <em>expressão geradora</em> <code>(f(x) for x in xs)</code> evita materializar a lista: <code>sum(x*x for x in xs)</code>. Em memória, a diferença é de 208 bytes (o gerador) contra 8856 bytes (lista de 1000 quadrados). Legibilidade manda: dois <code>for</code> aninhados na mesma comprehension já são o limite.</p>' +
          '<p>O <strong>desempacotamento</strong> generaliza a atribuição: <code>primeiro, *meio, ultimo = range(5)</code> → <code>0, [1, 2, 3], 4</code>; troca sem temporária <code>a, b = b, a</code>; e em chamadas e literais <code>[*xs, *ys]</code>, <code>{**d1, **d2}</code>.</p>' +
          '<h3>Cópia: rasa versus profunda</h3>' +
          '<p>Como contêineres guardam <em>referências</em>, copiar "a lista" copia os ponteiros, não os objetos apontados. <code>lista.copy()</code>, <code>list(lista)</code>, <code>lista[:]</code> e <code>copy.copy</code> são cópias <strong>rasas</strong>; <code>copy.deepcopy</code> percorre recursivamente (e trata ciclos), com custo proporcional ao grafo inteiro.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> import copy\n>>> n = [[1, 2], [3]]; s = n.copy(); d = copy.deepcopy(n)\n>>> n[0].append(9); s, d\n([[1, 2, 9], [3]], [[1, 2], [3]])\n>>> a = [[0] * 2] * 3; a[0][0] = 1; a\n[[1, 0], [1, 0], [1, 0]]\n>>> b = [[0] * 2 for _ in range(3)]; b[0][0] = 1; b\n[[1, 0], [0, 0], [0, 0]]' },
        { tipo: 'texto', html:
          '<p>A cópia rasa <code>s</code> compartilha a sublista com <code>n</code>; a profunda <code>d</code> não. E <code>[[0]*2]*3</code> repete a <em>mesma</em> sublista três vezes (o <code>*</code> copia a referência): o idioma correto para matriz é a comprehension. O laboratório tem o caso fixado em <code>test_shallow_vs_deep_copy</code>.</p>' },
        { tipo: 'abas', rotulo: 'Três jeitos de "copiar"', itens: [
          { rotulo: 'Atribuição', blocos: [{ tipo: 'texto', html: '<p><code>b = a</code>: nenhum objeto novo. <code>b is a</code> é <code>True</code>.</p>' }] },
          { rotulo: 'Cópia rasa', blocos: [{ tipo: 'texto', html: '<p><code>a.copy()</code>, <code>a[:]</code>, <code>list(a)</code>, <code>copy.copy(a)</code>: contêiner novo, elementos compartilhados. Seguro se os elementos são imutáveis (números, strings).</p>' }] },
          { rotulo: 'Cópia profunda', blocos: [{ tipo: 'texto', html: '<p><code>copy.deepcopy(a)</code>: duplica todo o grafo de objetos alcançável (e preserva ciclos). Mais lenta; use quando há mutáveis aninhados que você vai alterar.</p>' }] }
        ] },
        { tipo: 'escolha', id: 'f02b4-esc-matriz', titulo: 'Confira: a matriz que se repete',
          pergunta: 'Depois de g = [[0] * 2] * 3 e g[0][0] = 1, quanto vale g?',
          opcoes: [
            { id: 'a', texto: '[[1, 0], [0, 0], [0, 0]]', correta: false, porque: 'só a comprehension cria três sublistas independentes.' },
            { id: 'b', texto: '[[1, 0]]', correta: false, porque: 'a lista externa continua com três posições.' },
            { id: 'c', texto: '[[1, 0], [1, 0], [1, 0]]: as três posições são a mesma sublista', correta: true, porque: 'o * repete a referência. Use [[0] * 2 for _ in range(3)], que avalia [0] * 2 a cada volta.' },
            { id: 'd', texto: 'Erro: não se pode multiplicar lista de listas', correta: false, porque: 'a operação é válida; o problema é de modelo.' }
          ], tutorDepois: 'Contêiner guarda referências: copiar ou repetir não duplica o que está dentro.' },
        { tipo: 'takeaway', html: '<code>sorted</code> é <mark>estável</mark> e usa <code>key</code>; comprehension tem <mark>escopo próprio</mark>; cópia rasa <mark>compartilha o interior</mark>.' }
      ] },

      { rotulo: 'Aplicar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Exemplo trabalhado: agregação do laboratório</h3>' +
          '<p>O núcleo do relatório é uma agregação por categoria. Decisões visíveis em <code>aggregate.py</code>: o acumulador é um <code>dict</code> com <code>get(chave, 0)</code> (poderia ser <code>defaultdict(Decimal)</code>; o <code>get</code> explícito deixa o valor inicial à vista); a função recebe qualquer <code>Iterable</code> (uma lista ou o gerador do bloco 5), consumido <em>uma vez</em>; <code>sum(..., start=Decimal(0))</code> evita o <code>0</code> inteiro como ponto de partida; e o <code>sorted</code> antes do <code>groupby</code> é obrigatório, porque o <code>groupby</code> só junta chaves <em>adjacentes</em>. O retorno é <code>dict(sorted(...))</code>: como o <code>dict</code> mantém a inserção, a ordem do resultado é o contrato que a CLI exibe. O teste <code>test_groupby_without_sorting_splits_groups</code> prova a falha sem o sort.</p>' },
        { tipo: 'python', id: 'f02b4-python', titulo: 'Reescreva a agregação', obrigatorio: false,
          enunciado: 'Cada despesa é uma tupla <code>(data_iso, categoria, valor)</code> com <code>valor</code> em <code>Decimal</code>. Complete <code>totais_por_categoria</code> (soma por categoria; resultado ordenado por total decrescente e, no empate, por nome) e <code>totais_por_mes</code> (soma por <code>"AAAA-MM"</code>, usando <code>groupby</code>; a entrada pode vir fora de ordem).',
          codigo: J([
            'import itertools',
            'from decimal import Decimal',
            '',
            '',
            'def totais_por_categoria(despesas):',
            '    totais = {}',
            '    # 1. acumule com totais.get(categoria, Decimal(0))',
            '    # 2. devolva dict ordenado por (-total, nome)',
            '    return totais',
            '',
            '',
            'def totais_por_mes(despesas):',
            '    def mes(d):',
            '        return d[0][:7]',
            '',
            '    # 3. ordene pela mesma chave ANTES do groupby',
            '    # 4. some cada grupo com start=Decimal(0)',
            '    return {}',
            '',
            '',
            'dados = [("2026-02-01", "a", Decimal("1.00")), ("2026-01-05", "b", Decimal("2.50"))]',
            'print(totais_por_categoria(dados), totais_por_mes(dados))'
          ]),
          testes: J([
            'D = Decimal',
            'DADOS = [',
            '    ("2026-01-05", "cafe", D("10.00")),',
            '    ("2026-02-01", "agua", D("10.00")),',
            '    ("2026-01-20", "cafe", D("5.50")),',
            '    ("2026-02-10", "pao", D("3.00")),',
            ']',
            '',
            '',
            'def test_categoria_ordena_por_total_e_desempata_por_nome():',
            '    r = totais_por_categoria(DADOS)',
            '    assert list(r) == ["cafe", "agua", "pao"]',
            '    assert r["cafe"] == D("15.50")',
            '',
            '',
            'def test_empate_usa_o_nome():',
            '    r = totais_por_categoria([("2026-01-01", "b", D("1")), ("2026-01-02", "a", D("1"))])',
            '    assert list(r) == ["a", "b"]',
            '',
            '',
            'def test_mes_com_entrada_fora_de_ordem():',
            '    r = totais_por_mes(DADOS)',
            '    assert r == {"2026-01": D("15.50"), "2026-02": D("13.00")}',
            '',
            '',
            'def test_vazio():',
            '    assert totais_por_categoria([]) == {} and totais_por_mes([]) == {}',
            '',
            '',
            'def test_nao_altera_a_entrada():',
            '    antes = list(DADOS)',
            '    totais_por_mes(DADOS)',
            '    assert DADOS == antes',
            '',
            '',
            'def test_controle_negativo_groupby_sem_ordenar_fragmenta():',
            '    chaves = [k for k, _ in itertools.groupby(DADOS, key=lambda d: d[0][:7])]',
            '    assert chaves == ["2026-01", "2026-02", "2026-01", "2026-02"]'
          ]),
          dica: 'Categoria: <code>totais[categoria] = totais.get(categoria, Decimal(0)) + valor</code> e <code>dict(sorted(totais.items(), key=lambda item: (-item[1], item[0])))</code>. Mês: <code>sorted(despesas, key=mes)</code> e uma comprehension sobre <code>itertools.groupby(ordenadas, key=mes)</code>.',
          solucao: J([
            'import itertools',
            'from decimal import Decimal',
            '',
            '',
            'def totais_por_categoria(despesas):',
            '    totais = {}',
            '    for _, categoria, valor in despesas:',
            '        totais[categoria] = totais.get(categoria, Decimal(0)) + valor',
            '    return dict(sorted(totais.items(), key=lambda item: (-item[1], item[0])))',
            '',
            '',
            'def totais_por_mes(despesas):',
            '    def mes(d):',
            '        return d[0][:7]',
            '',
            '    ordenadas = sorted(despesas, key=mes)',
            '    return {',
            '        chave: sum((d[2] for d in grupo), start=Decimal(0))',
            '        for chave, grupo in itertools.groupby(ordenadas, key=mes)',
            '    }'
          ]),
          tutorDepois: 'O controle negativo prova o ponto do groupby: com a entrada na ordem original, o mesmo mês aparece em dois grupos e o total sai fragmentado, sem erro nenhum.',
          callout: 'Dict acumula, sorted decide a ordem do contrato e groupby só funciona depois de ordenar.' },
        { tipo: 'texto', html:
          '<h3>Decisões e erros comuns</h3>' +
          '<ul><li><strong>Pertinência repetida</strong> → <code>set</code> ou <code>dict</code>. <strong>Fila</strong> → <code>deque</code>. <strong>Contagem</strong> → <code>Counter</code>. <strong>Agrupar</strong> → <code>defaultdict(list)</code>.</li>' +
          '<li><strong>Chave composta</strong> → <code>tuple</code> (ou <code>dataclass(frozen=True)</code>), nunca <code>list</code>.</li>' +
          '<li><strong>Mutar enquanto itera</strong> (<code>for v in lst: lst.remove(v)</code>) pula elementos: removendo pares, <code>[1, 2, 3, 4]</code> dá <code>[1, 3]</code> (certo por acaso), mas <code>[2, 4, 1]</code> dá <code>[4, 1]</code> (errado); filtre numa nova lista.</li>' +
          '<li><strong>Retornar o contêiner interno</strong> de um objeto expõe o estado a mutação externa: devolva cópia, tupla ou iterador.</li>' +
          '<li><strong><code>if lista:</code></strong> versus <code>if len(lista) &gt; 0</code>: o primeiro é idiomático e vale para qualquer contêiner.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: groupby sem ordenar, e o iterador que o groupby entrega', html:
          '<p>Dois defeitos com a mesma origem. (1) <code>groupby("aabbaa")</code> produz <em>três</em> grupos (<code>a</code>, <code>b</code>, <code>a</code>), porque agrupa corridas adjacentes, ao contrário do <code>GROUP BY</code> do SQL; sem ordenar, o total por mês sai fragmentado e não dá erro nenhum. (2) Cada <code>grupo</code> é um iterador <em>compartilhado</em> com o <code>groupby</code>: avançar para a próxima chave o invalida. Por isso a comprehension consome o grupo imediatamente (<code>sum(... for e in group)</code>); guardar <code>group</code> numa lista de "grupos" para usar depois dá grupos vazios.</p>' },
        { tipo: 'escolha', id: 'f02b4-esc-groupby', titulo: 'Confira: quantos grupos',
          pergunta: 'Para itertools.groupby(["a", "b", "a"]), quantos grupos saem?',
          opcoes: [
            { id: 'a', texto: '2 grupos: a e b', correta: false, porque: 'groupby não olha o resto da sequência.' },
            { id: 'b', texto: '3 grupos: groupby só junta elementos consecutivos iguais', correta: true, porque: 'por isso a entrada deve vir ordenada pela mesma chave. Para contar sem ordenar, use collections.Counter ou um dict.' },
            { id: 'c', texto: '1 grupo', correta: false, porque: 'não há agrupamento global.' },
            { id: 'd', texto: 'Erro: strings não são agrupáveis', correta: false, porque: 'qualquer iterável serve.' }
          ], tutorDepois: 'groupby agrupa corridas, não valores.' },
        { tipo: 'takeaway', html: '<code>groupby</code> exige entrada <mark>ordenada pela mesma chave</mark>; o grupo é um iterador <mark>compartilhado</mark> e deve ser consumido na hora.' }
      ] }
    ]
  });
})();
