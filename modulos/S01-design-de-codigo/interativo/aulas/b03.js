/* S01 · Bloco 3: Estilo funcional. Fonte: S01.html#b03. Resultados dos exemplos reproduzidos do módulo (execução real do lab em 11/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 's01-b3',
    titulo: 'Estilo funcional: pureza, imutabilidade e núcleo/casca',
    minutos: 40,
    resumo: 'O ganho do estilo funcional em Python é testabilidade e raciocínio local: empurrar a lógica de decisão para funções puras e deixar os efeitos numa camada fina.',
    objetivo: 'Separar um núcleo funcional puro de uma casca imperativa e saber o que functools faz de bom e de perigoso.',
    revisao: [
      { id: 's01b3-pura', pergunta: 'Quando uma função é pura?',
        opcoes: [
          opc('a', 'Quando o resultado depende só dos argumentos e ela não deixa efeito observável.', true, 'relógio, estado global, I/O e mutação do argumento quebram a pureza; o remédio é passar a dependência como argumento.'),
          opc('b', 'Quando não tem laços.', false, 'laços são idiomáticos em Python; pureza é sobre dependências e efeitos.'),
          opc('c', 'Quando só usa funções da biblioteca padrão.', false, 'datetime.now() é da biblioteca padrão e é impura.')] },
      { id: 's01b3-cache', pergunta: 'Por que @cache num método é uma armadilha?',
        opcoes: [
          opc('a', 'self entra na chave, então o cache mantém a instância viva: vazamento (o lab mostra weakref ainda vivo depois do del).', true, 'use função de módulo que recebe valores, cache na instância ou functools.cached_property.'),
          opc('b', '@cache só funciona em funções de um argumento.', false, 'funciona com vários argumentos hashable.'),
          opc('c', 'O cache é apagado a cada chamada.', false, 'é o contrário: ele guarda para sempre.')] },
      { id: 's01b3-frozen', pergunta: 'Um dataclass(frozen=True) com um campo list é imutável?',
        opcoes: [
          opc('a', 'Não: frozen proíbe reatribuir o campo, não muda o conteúdo da lista (imutabilidade rasa).', true, 'por isso os modelos do lab usam tuple[Item, ...] para coleções.'),
          opc('b', 'Sim, frozen congela tudo recursivamente.', false, 'r.itens.append(2) funciona e o objeto "congelado" muda.'),
          opc('c', 'Sim, mas só com slots=True.', false, 'slots não muda a regra.')] },
      { id: 's01b3-nucleo', pergunta: 'No padrão núcleo funcional e casca imperativa, o que cada parte faz?',
        opcoes: [
          opc('a', 'O núcleo (funções puras) decide e devolve dados; a casca lê o relógio, faz I/O e executa as consequências.', true, 'as regras de negócio se testam sem banco, sem relógio e sem mock; a casca tem poucos testes de orquestração.'),
          opc('b', 'O núcleo faz I/O e a casca valida.', false, 'inverte as responsabilidades.'),
          opc('c', 'Núcleo e casca são a mesma classe com dois métodos.', false, 'o ponto é separar decisão de efeito.')] },
      { id: 's01b3-gerador', pergunta: 'O que acontece se você passa o mesmo gerador a duas funções?',
        opcoes: [
          opc('a', 'A segunda vê uma sequência vazia, sem erro: gerador é de uso único.', true, 'materialize com tuple(...) quando for reusar.'),
          opc('b', 'As duas recebem os mesmos itens.', false, 'o gerador é consumido na primeira.'),
          opc('c', 'O Python levanta RuntimeError.', false, 'nenhum erro: é isso que torna o bug silencioso.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O ganho do estilo funcional em Python não é ideológico: é <strong>testabilidade e raciocínio local</strong>. Uma <strong>função pura</strong> (mesma entrada, mesma saída, nenhum efeito observável) pode ser testada com uma chamada, executada em qualquer ordem, em paralelo, memoizada e depurada sem reproduzir o ambiente. A maior parte dos bugs "difíceis" em serviços vem de estado compartilhado mutável e de dependências escondidas (relógio, rede, variável global). Python não é uma linguagem funcional (sem otimização de cauda, sem estruturas persistentes na biblioteca padrão, laços são idiomáticos), então o objetivo é mais modesto e mais útil: empurrar a lógica de decisão para funções puras e deixar os efeitos numa camada fina.</p>' +
          '<h3>Pureza: o que é e o que quebra</h3>' +
          '<p>Uma função é pura quando (1) o resultado depende só dos argumentos e (2) ela não deixa efeito observável: não escreve em global, em disco, em tela; não muta o argumento. As dependências escondidas que mais quebram a pureza são três: <strong>estado global</strong>, <strong>relógio/aleatoriedade</strong> e <strong>I/O</strong>. O remédio é sempre o mesmo: passar a dependência como argumento.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '_total_global = 0',
          'def somar_impuro(valor):             # resultado depende de chamadas anteriores',
          '    global _total_global',
          '    _total_global += valor',
          '    return _total_global',
          'somar_impuro(1), somar_impuro(1)     # (1, 2): mesma entrada, saídas diferentes',
          '',
          'def somar_puro(total, valor):        # a dependência virou argumento',
          '    return total + valor',
          '',
          'def idade_impura(nascimento):        # lê o relógio: o teste de hoje quebra amanhã',
          '    hoje = date.today()',
          '    ...',
          'def idade(nascimento, hoje):         # hoje é argumento: determinística',
          '    ...'].join('\n') },
        { tipo: 'texto', html:
          '<p>É o mesmo movimento que o laboratório faz com o legado de preços: a função original chamava <code>_hoje()</code> no meio do cálculo (Black Friday é um desconto por data); a versão refatorada recebe <code>hoje: date</code> como parâmetro e o relógio é lido uma vez, na borda.</p>' +
          '<h3>Imutabilidade</h3>' +
          '<p>Dados imutáveis eliminam uma classe inteira de bugs: o objeto que você recebeu não muda debaixo de você, pode ser compartilhado entre threads sem lock e serve de chave de dicionário. Ferramentas: <code>@dataclass(frozen=True, slots=True)</code> (atribuição lança <code>FrozenInstanceError</code>), <code>tuple</code> em vez de <code>list</code>, <code>frozenset</code>, <code>MappingProxyType</code> para uma visão somente leitura de um <code>dict</code> e <code>dataclasses.replace</code> para criar uma cópia alterada.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '@dataclass(frozen=True, slots=True)',
          'class Ponto:',
          '    x: int',
          '    y: int',
          'Ponto(1, 2).x = 3        # FrozenInstanceError: cannot assign to field \'x\'',
          'deslocar(Ponto(1, 2), 5) # Ponto(x=6, y=2): novo objeto; o original fica intacto',
          '',
          '@dataclass(frozen=True)',
          'class Raso:',
          '    itens: list[int]',
          'r = Raso([1]); r.itens.append(2); print(r)    # Raso(itens=[1, 2])  <- "congelado" e mutado'].join('\n') },
        { tipo: 'texto', html:
          '<p>A armadilha é a <strong>imutabilidade rasa</strong>: <code>frozen</code> proíbe reatribuir o campo, não muda o conteúdo do que o campo aponta. Por isso os modelos do lab usam <code>tuple[Item, ...]</code> para a coleção. Imutabilidade tem custo: cada "alteração" aloca um objeto novo, irrelevante para modelos de domínio e relevante em laços quentes sobre estruturas grandes (aí, meça antes de decidir).</p>' },
        { tipo: 'takeaway', html: 'Pura é <mark>resultado só dos argumentos e nenhum efeito</mark>; relógio, global e I/O viram <mark>parâmetros</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Funções de ordem superior e functools</h3>' +
          '<p>Funções são valores: podem ser passadas, devolvidas e guardadas. Isso dá <code>map</code>/<code>filter</code> (em Python, prefira compreensões e geradores, mais legíveis), <code>sorted(key=...)</code> e as ferramentas de <code>functools</code> e <code>itertools</code> que valem conhecer a fundo:</p>' +
          '<ul>' +
          '<li><code>partial</code> fixa argumentos: <code>dez_por_cento = partial(percentual, 10)</code>, uma função de um argumento sem escrever <code>lambda</code>.</li>' +
          '<li><code>reduce</code> dobra uma sequência; bom para combinar valores de um monoide (soma de efeitos de desconto no lab: <code>reduce(Efeito.somar, efeitos, Efeito())</code>), ruim quando um laço <code>for</code> seria mais claro.</li>' +
          '<li><code>itertools.accumulate</code> devolve os parciais: <code>saldo_acumulado([100, -30, 50])</code> dá <code>[100, 70, 120]</code>.</li>' +
          '<li><code>singledispatch</code> despacha pelo tipo do primeiro argumento (polimorfismo <em>ad hoc</em> sem herança): <code>descrever(3)</code> dá <code>\'inteiro 3\'</code>, <code>descrever([1,2])</code> dá <code>\'lista de 2\'</code>, <code>descrever("x")</code> cai no genérico.</li>' +
          '<li><code>cache</code>/<code>lru_cache</code> memoizam: <code>fib(80) = 23416728348467685</code> instantaneamente, porque cada subproblema é calculado uma vez.</li>' +
          '<li><code>wraps</code> preserva nome e docstring em decoradores (bloco 5).</li></ul>' +
          '<p>Composição de funções é um <code>reduce</code> de aplicações: o lab traz um <code>compor</code> genérico (<code>compor(f, g, h)(x)</code> é <code>h(g(f(x)))</code>), e a versão com tipos usa a sintaxe de parâmetros de tipo do Python 3.12+ (<code>def compor[T](...)</code>).</p>' +
          '<h3>Memoização: onde o @cache morde</h3>' +
          '<p>Memoizar só é correto para função pura. Duas falhas reais, ambas reproduzidas no lab:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '@cache',
          'def cotacao_cacheada(moeda):          # impura: depende de um "mercado" que muda',
          '    ...',
          '',
          'class Calculadora:',
          '    @cache                            # a chave inclui self',
          '    def dobro(self, x): return 2 * x',
          'c = Calculadora(); c.dobro(21); r = weakref.ref(c); del c; gc.collect()'].join('\n') },
        { tipo: 'rode', id: 'b3-rode', titulo: 'Veja o cache congelar e segurar', enunciado: 'Rode a cotação cacheada e depois o método com <code>@cache</code>. Resultados reproduzidos do módulo (execução real do lab em 11/10/2026).',
          prefixo: 'Prompt', entrada: 'cotacao_cacheada("USD")', unidade: 'chamadas', terminalTitulo: 'sessão Python',
          etapas: [
            { id: 'funcao', nome: 'Função impura', descricao: 'O primeiro valor fica para sempre', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'cotacao_cacheada("USD")'),
              L('out', '501'),
              L('cmd', 'cotacao_cacheada("USD")'),
              L('out', '501  # sem nova consulta: a função foi chamada 1 vez'),
              L('hint', 'o mercado mudou, o cache não: valor que deveria expirar virou constante')] },
            { id: 'metodo', nome: '@cache em método', descricao: 'self na chave segura a instância', tom: 'request', ms: 1, linhas: [
              L('cmd', 'c = Calculadora(); c.dobro(21); r = weakref.ref(c); del c; gc.collect()'),
              L('cmd', 'r() is not None'),
              L('out', 'True'),
              L('hint', 'o cache global mantém a instância alcançável: vazamento de memória (o linter tenta pegar com B019)')] }
          ],
          prever: { pergunta: 'Depois do <code>del c</code> e do <code>gc.collect()</code>, o <code>weakref</code> da calculadora ainda aponta para o objeto?', opcoes: [
            { id: 'a', texto: 'Não: sem referências, o coletor libera a instância.', correta: false, porque: 'havia uma referência escondida: a chave do cache.' },
            { id: 'b', texto: 'Sim: o cache global guarda self na chave e mantém a instância viva.', correta: true, porque: 'enquanto a função decorada existir, o cache existe e a instância não é liberada.' },
            { id: 'c', texto: 'Depende da versão do Python.', correta: false, porque: 'é o comportamento documentado de functools.cache em métodos.' }
          ] },
          tutorAntes: 'Aperte Enter e abra as duas etapas: a função impura e o método.',
          tutorDepois: 'Se precisa de validade, é um cache com TTL e política de invalidação, não <code>@cache</code>. Soluções para o método: cachear uma função de módulo que recebe só os valores, guardar o cache na instância ou usar <code>functools.cached_property</code> para um valor calculado uma vez por objeto.',
          callout: 'Você viu os dois modos de falha do cache: o valor congelado e a instância presa.' },
        { tipo: 'texto', html:
          '<h3>Functional core, imperative shell</h3>' +
          '<p>O padrão que une tudo: divida o sistema em um <strong>núcleo</strong> de funções puras que decidem e uma <strong>casca</strong> fina que faz I/O, lê o relógio e orquestra. O núcleo recebe dados e devolve dados; a casca traz os dados e executa as consequências. No lab, o núcleo é <code>calcular(pedido, hoje) -&gt; Resultado</code> (<code>precificacao.py</code>: puro, sem relógio, sem banco) e a casca é o serviço (<code>servico.py</code>):</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'def fechar(self, pedido_id: str, pedido: Pedido) -> Resultado:',
          '    hoje = self._relogio.hoje()',
          '    resultado = calcular(pedido, hoje)',
          '    registro = PedidoCalculado(pedido_id, resultado, hoje)',
          '    self._repositorio.salvar(registro)',
          '    for ouvinte in self._ouvintes:',
          '        ouvinte(registro)',
          '    return resultado'].join('\n') },
        { tipo: 'texto', html:
          '<p>Todas as regras de negócio (34 casos de caracterização, dezenas de bordas) são testadas sem banco, sem relógio e sem mock. A casca tem poucos testes, que verificam a orquestração: calcula, grava, notifica, na ordem certa e sem notificar em caso de falha. Quando os testes ficam difíceis de escrever, a lógica provavelmente escorregou para a casca (bloco 7).</p>' },
        { tipo: 'takeaway', html: 'O <mark>núcleo decide</mark> e a <mark>casca executa</mark>: regras testadas sem mock, casca testada pela orquestração.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Pipelines com geradores</h3>' +
          '<p>Para dados em sequência, geradores dão o estilo de pipeline com memória constante: cada etapa é uma expressão <em>lazy</em>, e a função consome uma vez. Note o critério de desempate no <code>sorted</code>: sem ele, a ordem de itens empatados depende da ordem de inserção, o que torna a saída instável entre execuções com dados reordenados e o teste frágil. <strong>Determinismo faz parte da pureza.</strong></p>' },
        { tipo: 'python', id: 'b3-python', titulo: 'Faturamento determinístico e ponto imutável', obrigatorio: false,
          enunciado: 'Corrija duas lacunas. (1) <code>deslocar</code> não pode alterar o <code>Ponto</code> congelado: devolva uma cópia com <code>replace</code>. (2) <code>faturamento_por_produto</code> soma as vendas não canceladas por produto e ordena por valor decrescente, <em>desempatando pelo nome</em>, para a saída não depender da ordem de entrada.',
          codigo: [
      "from dataclasses import dataclass, replace",
      "",
      "",
      "@dataclass(frozen=True, slots=True)",
      "class Venda:",
      "    produto: str",
      "    valor: int",
      "    cancelada: bool = False",
      "",
      "",
      "@dataclass(frozen=True, slots=True)",
      "class Ponto:",
      "    x: int",
      "    y: int",
      "",
      "",
      "def deslocar(p, dx, dy):",
      "    \"\"\"Devolve um Ponto novo; o original não muda.\"\"\"",
      "    p.x += dx  # lacuna: Ponto é frozen; crie uma cópia alterada com replace",
      "    p.y += dy",
      "    return p",
      "",
      "",
      "def faturamento_por_produto(vendas):",
      "    validas = (v for v in vendas if not v.cancelada)",
      "    totais = {}",
      "    for v in validas:",
      "        totais[v.produto] = totais.get(v.produto, 0) + v.valor",
      "    # lacuna: maior valor primeiro, com desempate pelo nome",
      "    return dict(sorted(totais.items(), key=lambda kv: kv[1]))",
      "",
      "",
      "print(faturamento_por_produto([Venda(\"b\", 10), Venda(\"a\", 10)]))"
    ].join('\n'),
          testes: [
      "import dataclasses",
      "",
      "",
      "def test_deslocar_devolve_novo_e_preserva_o_original():",
      "    p = Ponto(1, 2)",
      "    q = deslocar(p, 5, 0)",
      "    assert q == Ponto(6, 2)",
      "    assert p == Ponto(1, 2)",
      "    assert q is not p",
      "",
      "",
      "def test_frozen_recusa_atribuicao():",
      "    p = Ponto(1, 2)",
      "    try:",
      "        p.x = 9",
      "    except dataclasses.FrozenInstanceError:",
      "        return",
      "    raise AssertionError(\"frozen deveria recusar a atribuição\")",
      "",
      "",
      "def test_soma_por_produto_e_ignora_cancelada():",
      "    vendas = [Venda(\"a\", 100), Venda(\"b\", 50), Venda(\"a\", 30), Venda(\"b\", 999, cancelada=True)]",
      "    assert faturamento_por_produto(vendas) == {\"a\": 130, \"b\": 50}",
      "",
      "",
      "def test_ordem_maior_valor_primeiro():",
      "    r = faturamento_por_produto([Venda(\"a\", 10), Venda(\"b\", 90)])",
      "    assert list(r) == [\"b\", \"a\"]",
      "",
      "",
      "def test_empate_desempata_pelo_nome_em_qualquer_ordem_de_entrada():",
      "    v = [Venda(\"z\", 10), Venda(\"m\", 10), Venda(\"a\", 10)]",
      "    esperado = [\"a\", \"m\", \"z\"]",
      "    assert list(faturamento_por_produto(v)) == esperado",
      "    assert list(faturamento_por_produto(reversed(v))) == esperado",
      "",
      "",
      "def test_borda_vazio_e_gerador_de_uso_unico():",
      "    assert faturamento_por_produto([]) == {}",
      "    assert faturamento_por_produto(Venda(\"a\", 1) for _ in range(3)) == {\"a\": 3}",
      "",
      "",
      "def test_nao_muta_a_entrada():",
      "    vendas = [Venda(\"b\", 1), Venda(\"a\", 2)]",
      "    copia = list(vendas)",
      "    faturamento_por_produto(vendas)",
      "    assert vendas == copia"
    ].join('\n'),
          dica: 'Para <code>deslocar</code>: <code>replace(p, x=p.x + dx, y=p.y + dy)</code>. Para a ordem: a chave do <code>sorted</code> pode ser uma tupla, <code>(-kv[1], kv[0])</code>.',
          solucao: [
      "from dataclasses import dataclass, replace",
      "",
      "",
      "@dataclass(frozen=True, slots=True)",
      "class Venda:",
      "    produto: str",
      "    valor: int",
      "    cancelada: bool = False",
      "",
      "",
      "@dataclass(frozen=True, slots=True)",
      "class Ponto:",
      "    x: int",
      "    y: int",
      "",
      "",
      "def deslocar(p, dx, dy):",
      "    \"\"\"Devolve um Ponto novo; o original não muda.\"\"\"",
      "    return replace(p, x=p.x + dx, y=p.y + dy)",
      "",
      "",
      "def faturamento_por_produto(vendas):",
      "    validas = (v for v in vendas if not v.cancelada)",
      "    totais = {}",
      "    for v in validas:",
      "        totais[v.produto] = totais.get(v.produto, 0) + v.valor",
      "    # maior valor primeiro; empate resolvido pelo nome, para a saída ser estável",
      "    return dict(sorted(totais.items(), key=lambda kv: (-kv[1], kv[0])))"
    ].join('\n'),
          tutorDepois: 'Os dois testes de borda dizem o essencial: o resultado não muda com a ordem de entrada e a função aceita um gerador de uso único porque o consome uma só vez.',
          callout: 'Função pura, saída determinística e dado imutável: tudo verificável com uma chamada.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          '<p><strong>Gerador consumido duas vezes.</strong> <code>validas = (v for v in vendas if ...)</code> é de uso único; passar <code>validas</code> a duas funções faz a segunda ver uma sequência vazia, sem erro. Materialize (<code>tuple(...)</code>) quando for reusar. Do mesmo grupo: <code>def f(x, acc=[])</code> (default mutável compartilhado entre chamadas) e <code>lambda</code> criada em laço capturando a variável por referência (todas veem o último valor; use <code>partial</code> ou default).</p>' },
        { tipo: 'complete', id: 'b3-complete', titulo: 'Monte a casca do serviço', linguagem: 'python', obrigatorio: false,
          enunciado: 'Escolha, em cada lacuna, o que mantém o núcleo puro e a casca fina.',
          partes: [
            'def fechar(self, pedido_id, pedido):\n    hoje = ', { lacuna: 'hoje', opcoes: ['self._relogio.hoje()', 'date.today()', 'pedido.data'], correta: 'self._relogio.hoje()' },
            '            # o relógio é lido na casca, injetado\n    resultado = ', { lacuna: 'calc', opcoes: ['calcular(pedido, hoje)', 'calcular(pedido)  # lê o relógio por dentro', 'self._repositorio.calcular(pedido)'], correta: 'calcular(pedido, hoje)' },
            '\n    registro = PedidoCalculado(pedido_id, resultado, hoje)\n    ', { lacuna: 'grava', opcoes: ['self._repositorio.salvar(registro)', 'print(registro)', 'global ULTIMO; ULTIMO = registro'], correta: 'self._repositorio.salvar(registro)' },
            '\n    for ouvinte in self._ouvintes:\n        ouvinte(registro)\n    return resultado\n'
          ],
          explicacao: 'O núcleo recebe <code>hoje</code> como argumento e devolve dados; a casca traz o relógio, grava e notifica. Se <code>calcular</code> lesse o relógio por dentro, a regra de Black Friday dependeria do dia em que o teste roda.',
          callout: 'Casca montada: relógio injetado, núcleo puro, efeitos na ordem certa.' },
        { tipo: 'takeaway', html: 'Preserve o <mark>determinismo</mark> (desempate explícito) e cuidado com <mark>geradores de uso único</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b3-esc-pura', titulo: 'Qual função é pura?',
          pergunta: 'Qual das funções é pura?',
          opcoes: [
            { id: 'a', texto: '<code>def hoje_formatado(): return datetime.now().strftime("%d/%m")</code>', correta: false, porque: 'depende do relógio.' },
            { id: 'b', texto: '<code>def proximo_id(): global n; n += 1; return n</code>', correta: false, porque: 'depende e altera estado global.' },
            { id: 'c', texto: '<code>def adiciona(xs, x): xs.append(x); return xs</code>', correta: false, porque: 'muta o argumento.' },
            { id: 'd', texto: '<code>def ordenada(xs): return sorted(xs)</code>', correta: true, porque: 'sorted devolve uma lista nova; resultado só dos argumentos e nenhum efeito.' }
          ] },
        { tipo: 'escolha', id: 'b3-esc-cache', titulo: '@cache em método',
          pergunta: 'Por que usar <code>@functools.cache</code> diretamente em um método é uma armadilha?',
          opcoes: [
            { id: 'a', texto: 'Porque @cache só funciona em funções com mais de um argumento.', correta: false, porque: 'não há essa restrição.' },
            { id: 'b', texto: 'O cache guarda self como parte da chave: mantém instâncias vivas (vazamento) e exige que self seja hashable.', correta: true, porque: 'o objeto inteiro fica referenciado pelo cache até o fim do processo; prefira cache por instância ou função pura de módulo.' },
            { id: 'c', texto: 'Porque o cache é apagado a cada chamada do método.', correta: false, porque: 'ele não é apagado.' },
            { id: 'd', texto: 'Não há armadilha: métodos e funções se comportam igual.', correta: false, porque: 'self entra na chave.' }
          ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Trade-offs', html:
          '<p>Reescrever laços como cadeias de <code>map</code>/<code>reduce</code> costuma reduzir a legibilidade em Python; compreensões e funções nomeadas ganham. Pureza total é impossível (todo programa útil tem efeito): o ganho vem de <em>localizar</em> os efeitos. Cópia constante de estruturas grandes pode custar; estruturas persistentes existem em bibliotecas, mas raramente compensam a dependência. A fronteira núcleo/casca conversa com portas e adapters do M02A, só que aplicada dentro do módulo.</p>' },
        { tipo: 'takeaway', html: '<mark>Memoize só o que é puro</mark>, e nunca métodos com <code>@cache</code>.' }
      ] }
    ]
  });
})();
