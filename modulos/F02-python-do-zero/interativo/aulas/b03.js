/* F02 · Bloco 3: controle de fluxo e funções. Fonte: F02.html#b03. Saídas de execução real em 11/10/2026 (Python 3.14.7). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var J = function (a) { return a.join('\n') + '\n'; };

  TrilhaAula.registrar({
    id: 'f02-b3',
    titulo: 'Controle de fluxo e funções',
    minutos: 40,
    resumo: 'O def executa uma vez e a chamada, a cada vez; cada nome é procurado por escopo. O default mutável e o lambda no laço são o mesmo problema visto de dois lados.',
    objetivo: 'Prever quando cada coisa é avaliada e onde cada nome é procurado; escrever assinaturas claras, evitar o default mutável e usar closures e decoradores com consciência.',
    revisao: [
      { id: 'f02b3-default', pergunta: 'def f(x, acc=[]): acc.append(x); return acc. O que f(1) e depois f(2) devolvem, e por quê?',
        opcoes: [
          opc('a', '[1] e depois [1, 2]: o default é avaliado uma vez, quando o def executa, e fica em f.__defaults__', true, 'todas as chamadas sem o argumento compartilham aquela lista; o idioma correto é acc=None e criar a lista dentro.'),
          opc('b', '[1] e [2]: cada chamada cria a sua lista', false, 'o default não é recriado a cada chamada.'),
          opc('c', 'Erro: default mutável é proibido pela linguagem', false, 'a linguagem aceita; é o dataclass que recusa tags: list = [].')] },
      { id: 'f02b3-legb', pergunta: 'x = 1 no módulo e def f(): print(x); x = 2. O que acontece ao chamar f()?',
        opcoes: [
          opc('a', 'UnboundLocalError: há atribuição a x no corpo, então x é local em toda a função', true, 'o compilador decide o escopo antes de executar; use global/nonlocal ou, melhor, passe e devolva valores.'),
          opc('b', 'Imprime 1', false, 'o print leria o global só se não houvesse atribuição local ao nome.'),
          opc('c', 'NameError, porque x não existe', false, 'o nome existe como local ainda sem valor, daí UnboundLocalError.')] },
      { id: 'f02b3-lambda', pergunta: 'fs = [lambda: i for i in range(3)]; [f() for f in fs]. O que sai e como travar o valor?',
        opcoes: [
          opc('a', '[2, 2, 2]: closures capturam a variável, não o valor; trave com lambda i=i: i ou functools.partial', true, 'é o espelho do default mutável: lá o valor era adiantado demais, aqui é tardio demais.'),
          opc('b', '[0, 1, 2]', false, 'só com i=i (default avaliado na criação) as lambdas travam cada valor.'),
          opc('c', '[0, 0, 0]', false, 'todas leem a mesma célula, que vale 2 ao fim do laço.')] },
      { id: 'f02b3-finally', pergunta: 'O que um return, break ou continue dentro de finally faz com a exceção em voo?',
        opcoes: [
          opc('a', 'Descarta a exceção e o return do try; no Python 3.14 o compilador avisa (PEP 765)', true, 'trate o SyntaxWarning como erro (-W error nos testes) e deixe o finally só limpar.'),
          opc('b', 'Relança a exceção depois do return', false, 'a exceção some em silêncio.'),
          opc('c', 'Nada: o finally ignora return e continue', false, 'ele os executa e engole o resto.')] },
      { id: 'f02b3-match', pergunta: 'Em match, o que faz case x: com um nome simples?',
        opcoes: [
          opc('a', 'Captura qualquer valor no nome x; não compara com uma variável x existente', true, 'para comparar com constante use nome pontilhado (Cor.VERMELHO) ou literal.'),
          opc('b', 'Compara o valor com a variável x', false, 'é o erro mais comum: o nome simples sempre captura.'),
          opc('c', 'Levanta erro de sintaxe', false, 'é válido e casa com tudo.')] }
    ],
    abas: [
      { rotulo: 'Fluxo e escopo', blocos: [
        { tipo: 'texto', html:
          '<h3>Quando e onde</h3>' +
          '<p>Funções são a unidade de reuso, de teste e de raciocínio do Python. Quase todo defeito sutil desta camada nasce de duas ideias mal absorvidas: <strong>quando</strong> cada coisa é avaliada (o <code>def</code> executa uma vez; a chamada, a cada vez) e <strong>onde</strong> cada nome é procurado (escopo). O default mutável e o <code>lambda</code> dentro de um laço são o mesmo problema visto de dois lados: avaliação adiantada versus avaliação tardia.</p>' +
          '<h3>Fluxo: o que tem de específico em Python</h3>' +
          '<p>Blocos são definidos por indentação, e <code>if</code>/<code>elif</code>/<code>else</code> avaliam <em>truthiness</em>: são falsos <code>None</code>, <code>False</code>, zeros numéricos e qualquer contêiner ou texto vazio; todo o resto é verdadeiro. Três recursos fogem do que um veterano de C ou Java espera:</p>' +
          '<ul><li><strong><code>for</code> percorre um iterável</strong> (bloco 5), não um contador: <code>for item in itens</code>, <code>for i, item in enumerate(itens)</code>, <code>for a, b in zip(xs, ys)</code>. Prefira <code>zip(xs, ys, strict=True)</code> quando os tamanhos devem ser iguais: sem <code>strict</code>, o mais longo é truncado em silêncio.</li>' +
          '<li><strong><code>for ... else</code> e <code>while ... else</code></strong>: o <code>else</code> roda se o laço terminou <em>sem</em> <code>break</code>. Útil para "procurei e não achei", e confuso para quem lê; comente quando usar.</li>' +
          '<li><strong>Operador morsa <code>:=</code></strong> atribui dentro de uma expressão: <code>if (n := len(dados)) &gt; 10: ...</code>. Use quando evita calcular duas vezes; não use para compactar linhas.</li></ul>' },
        { tipo: 'texto', html:
          '<h3><code>match</code>: casamento estrutural</h3>' +
          '<p>O <strong><code>match</code></strong> (Python 3.10+) não é um <code>switch</code> de igualdade: o padrão descreve a <em>forma</em> do dado e já extrai partes dele.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'def kind(cmd):\n    match cmd:\n        case ["go", ("north" | "south") as d]:\n            return f"go {d}"\n        case ["take", item, *rest] if rest:\n            return f"take {item} +{len(rest)}"\n        case {"type": "pt", "x": x}:\n            return f"pt {x}"\n        case int(n) if n > 0:\n            return "pos"\n        case _:\n            return "?"\n\n>>> kind(["go", "north"]), kind(["take", "a", "b"]), kind({"type": "pt", "x": 3, "y": 1}), kind(5), kind("x")\n(\'go north\', \'take a +1\', \'pt 3\', \'pos\', \'?\')' },
        { tipo: 'callout', tom: 'danger', titulo: 'Pontos que enganam no match', html:
          '<p>Um nome simples em <code>case</code> (<code>case x:</code>) <em>captura</em> qualquer valor, não compara com a variável <code>x</code>; para comparar com constante use nome pontilhado (<code>Cor.VERMELHO</code>) ou literal. Padrões de mapeamento casam com chaves <em>extras</em> (o <code>"y": 1</code> acima não atrapalhou); padrões de sequência não casam com <code>str</code>/<code>bytes</code>. Use <code>match</code> para despachar sobre dados estruturados (mensagens, ASTs, comandos); para uma comparação simples, <code>if</code>.</p>' },
        { tipo: 'texto', html:
          '<h3>Escopo: a regra LEGB</h3>' +
          '<p>Ao ler um nome, o Python procura em quatro escopos, nesta ordem: <strong>L</strong>ocal (a função atual), <strong>E</strong>nclosing (funções que a envolvem), <strong>G</strong>lobal (o módulo) e <strong>B</strong>uilt-in (<code>len</code>, <code>print</code>...). A decisão de qual escopo é <em>estática</em>: o compilador olha o corpo da função inteira e, se há <em>qualquer atribuição</em> ao nome, ele é local em <em>toda</em> a função.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'x = 10\ndef g():\n    print(x)     # lê x ... mas x é atribuído abaixo, logo é LOCAL aqui\n    x = 1\n\n>>> g()\nUnboundLocalError: cannot access local variable \'x\' where it is not associated with a value' },
        { tipo: 'texto', html:
          '<p>Para atribuir a um nome de escopo externo é preciso declarar <code>global x</code> (módulo) ou <code>nonlocal x</code> (função envolvente). Ler nunca precisa de declaração; <em>mutar</em> um objeto externo (<code>lista.append</code>) também não, porque não é atribuição ao nome. Variáveis de <code>for</code> e de <code>with</code> vazam para o escopo da função (<code>i</code> existe depois do laço); as de comprehension não (bloco 4).</p>' },
        { tipo: 'escolha', id: 'f02b3-esc-legb', titulo: 'Confira: o escopo decidido antes',
          pergunta: 'Com x = 1 no módulo e def f(): print(x); x = 2, o que ocorre ao chamar f()?',
          opcoes: [
            { id: 'a', texto: 'Imprime 1', correta: false, porque: 'a atribuição abaixo torna x local em toda a função, inclusive acima dela.' },
            { id: 'b', texto: 'UnboundLocalError: como há atribuição a x, ele é local em toda a função', correta: true, porque: 'o compilador decide o escopo de cada nome antes de executar; o print lê um local ainda sem valor.' },
            { id: 'c', texto: 'Imprime 2', correta: false, porque: 'o print roda antes da atribuição.' },
            { id: 'd', texto: 'NameError: x não existe', correta: false, porque: 'x existe, como local ainda sem valor.' }
          ], tutorDepois: 'Use global/nonlocal para alterar o externo, ou melhor, passe e devolva valores.' },
        { tipo: 'takeaway', html: 'O <mark>compilador</mark> decide o escopo de cada nome: qualquer atribuição o torna <mark>local em toda a função</mark>. <code>match</code> casa a <mark>forma</mark> do dado, e nome simples captura.' }
      ] },

      { rotulo: 'Parâmetros e defaults', blocos: [
        { tipo: 'texto', html:
          '<h3>O default mutável</h3>' +
          '<p>O <code>def</code> é uma instrução executada em tempo de carga: ela cria o objeto função e <strong>avalia os defaults naquele momento, uma vez</strong>, guardando-os em <code>f.__defaults__</code>. Preveja o que duas chamadas devolvem.</p>' },
        { tipo: 'rode', id: 'f02b3-rode', titulo: 'A lista que lembra a chamada anterior', enunciado: 'Rode o script e compare <code>add</code> com <code>add2</code>.',
          prefixo: '$', entrada: 'python defaults.py', unidade: 'linha', terminalTitulo: 'terminal',
          etapas: [
            { id: 'fonte', nome: 'O script', descricao: 'defaults.py', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'cat defaults.py'),
              L('out', 'def add(item, bag=[]):'), L('out', '    bag.append(item)'), L('out', '    return bag'),
              L('out', 'print(add(1), add(2), add.__defaults__)'),
              L('out', 'def add2(item, bag=None):'), L('out', '    if bag is None:'), L('out', '        bag = []'),
              L('out', '    bag.append(item)'), L('out', '    return bag'),
              L('out', 'print(add2(1), add2(2))')] },
            { id: 'add', nome: 'add (default mutável)', descricao: 'Uma lista só, criada no def', tom: 'tcp', ms: 2, linhas: [
              L('in', '[1, 2] [1, 2] ([1, 2],)'),
              L('hint', 'a tupla de retorno contém o MESMO objeto duas vezes, por isso ambos exibem [1, 2]; a lista só foi impressa depois das duas chamadas')] },
            { id: 'add2', nome: 'add2 (None)', descricao: 'Lista nova por chamada', tom: 'tls', ms: 3, linhas: [
              L('in', '[1] [2]'),
              L('hint', 'None como sentinela e a criação dentro da função: cada chamada tem a sua lista')] }
          ],
          prever: { pergunta: 'O que print(add(1), add(2), add.__defaults__) imprime para a versão com bag=[]?', opcoes: [
            { id: 'a', texto: '[1] [2] ([],): cada chamada começa com a lista vazia.', correta: false, porque: 'o default não é recriado: ele foi avaliado uma vez, no def.' },
            { id: 'b', texto: '[1] [1, 2] ([1, 2],): a segunda chamada vê o que a primeira guardou.', correta: false, porque: 'o print só roda depois das duas chamadas, e as duas primeiras posições são o mesmo objeto.' },
            { id: 'c', texto: '[1, 2] [1, 2] ([1, 2],): é a mesma lista nas três posições.', correta: true, porque: 'o objeto lista é um só, guardado em __defaults__, e foi impresso depois de receber o 1 e o 2.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Depois clique em "add2 (None)".',
          tutorDepois: 'Regra: default só imutável (None, número, string, tupla). Se None for um valor legítimo, use uma sentinela própria (_MISSING = object() e is _MISSING). O mesmo mecanismo faz o dataclass recusar tags: list = [] (bloco 8).',
          callout: 'Você viu o default ser avaliado uma vez e a lista sobreviver às chamadas.' },
        { tipo: 'abas', rotulo: 'Errado e certo', itens: [
          { rotulo: 'Errado', blocos: [{ tipo: 'codigo', linguagem: 'python', texto: 'def adicionar(item, lista=[]):\n    lista.append(item)\n    return lista\n\nadicionar(1)   # [1]\nadicionar(2)   # [1, 2]  <- surpresa: a mesma lista, criada uma vez no def' }] },
          { rotulo: 'Certo', blocos: [{ tipo: 'codigo', linguagem: 'python', texto: 'def adicionar(item, lista=None):\n    if lista is None:\n        lista = []\n    lista.append(item)\n    return lista\n\nadicionar(1)   # [1]\nadicionar(2)   # [2]' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Parâmetros: a assinatura completa</h3>' +
          '<p>A forma geral é <code>def f(a, b=2, /, c=3, *args, d, e=5, **kw)</code>. O que cada marca faz:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Parte</th><th>Significado</th></tr></thead><tbody>' +
          '<tr><td>antes de <code>/</code></td><td>só posicional (<code>a</code>, <code>b</code>): o nome do parâmetro não faz parte da API pública</td></tr>' +
          '<tr><td>entre <code>/</code> e <code>*</code></td><td>posicional ou por nome (<code>c</code>)</td></tr>' +
          '<tr><td><code>*args</code></td><td>coleta posicionais extras numa <code>tuple</code></td></tr>' +
          '<tr><td>depois de <code>*</code>/<code>*args</code></td><td>só por nome (<code>d</code> obrigatório, <code>e</code> opcional)</td></tr>' +
          '<tr><td><code>**kw</code></td><td>coleta nomeados extras num <code>dict</code></td></tr></tbody></table>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> import inspect; print(inspect.signature(h))\n(a, b=2, /, c=3, *args, d, e=5, **kw)\n>>> h(1, d=4)\n(1, 2, 3, (), 4, 5, {})\n>>> h(1, 2, 3, 4, 5, d=6, z=7)\n(1, 2, 3, (4, 5), 6, 5, {\'z\': 7})\n>>> g(1, 2, 3)     # def g(a, /, b, *, c)\nTypeError: g() takes 2 positional arguments but 3 were given' },
        { tipo: 'texto', html:
          '<p>Na chamada, <code>*</code> e <code>**</code> fazem o inverso: espalham um iterável e um mapeamento (<code>f(1, *[2, 3], **{"z": 1})</code>). Boa prática de API: parâmetros booleanos e de configuração como <strong>só-nomeados</strong> (<code>def ler(path, *, encoding="utf-8")</code>, como o <code>scan</code> do laboratório), porque <code>ler(p, True, False)</code> não diz nada ao leitor. Uma função sem <code>return</code> devolve <code>None</code>; uma que às vezes devolve valor e às vezes cai no fim é bug esperando acontecer.</p>' },
        { tipo: 'complete', id: 'f02b3-complete', titulo: 'Desenhe uma API legível', obrigatorio: false,
          enunciado: 'Complete a assinatura de <code>ler</code> para que <code>path</code> seja posicional e <code>encoding</code> e <code>strict</code> só possam ser passados por nome.',
          linguagem: 'python',
          partes: [
            'def ler(path, ',
            { lacuna: 'marca', opcoes: ['*,', '/,', '**kw,'], correta: 0 },
            ' encoding="utf-8", strict=True):\n    ...\n\nler("a.csv", ',
            { lacuna: 'chamada', opcoes: ['encoding="latin-1"', '"latin-1"', 'True, False'], correta: 0 },
            ')\n'
          ],
          explicacao: 'O * sozinho encerra os posicionais: tudo depois dele é só-nomeado. Assim ler(p, True, False) vira TypeError, e quem lê a chamada vê o que cada valor significa.' },
        { tipo: 'takeaway', html: 'O <code>def</code> avalia os defaults <mark>uma vez</mark>: só imutáveis, ou <mark>None</mark> mais criação interna. Parâmetros <mark>só-nomeados</mark> deixam a API legível.' }
      ] },

      { rotulo: 'Closures e decoradores', blocos: [
        { tipo: 'texto', html:
          '<h3>Closures e a ligação tardia</h3>' +
          '<p>Funções são objetos de primeira classe: podem ser atribuídas, passadas e devolvidas. Uma função definida dentro de outra <strong>captura os nomes</strong> da envolvente que usa (<em>variáveis livres</em>), guardados em "células". Capturam-se <em>variáveis</em>, não valores.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'def counter():\n    n = 0\n    def inc():\n        nonlocal n\n        n += 1\n        return n\n    return inc\n\n>>> c = counter(); c(), c(), c.__closure__[0].cell_contents, c.__code__.co_freevars\n(1, 2, 2, (\'n\',))\n\n>>> fs = [lambda: i for i in range(3)]; [f() for f in fs]\n[2, 2, 2]\n>>> fs = [lambda i=i: i for i in range(3)]; [f() for f in fs]\n[0, 1, 2]' },
        { tipo: 'texto', html:
          '<p>Todas as lambdas leem a mesma célula <code>i</code>, que vale 2 ao fim do laço. A correção trava o valor <em>agora</em> como default (<code>i=i</code>, avaliação adiantada) ou usa <code>functools.partial</code>. É o espelho do default mutável: lá o valor era adiantado demais; aqui, tardio demais.</p>' +
          '<p><code>lambda</code> é apenas uma função anônima de uma única <em>expressão</em>. Ótima como <code>key</code>: <code>sorted(xs, key=lambda t: t[1])</code>. Sem docstring e com nome <code>&lt;lambda&gt;</code> nos tracebacks, então qualquer coisa com mais de uma expressão merece um <code>def</code>.</p>' +
          '<h3>Exemplo trabalhado: um decorador que conta chamadas</h3>' +
          '<p>Um decorador é uma função que recebe uma função e devolve outra: o closure aplicado. O <code>@contar</code> mantém um contador na célula <code>n</code>, e <code>functools.wraps</code> copia nome, docstring e <code>__wrapped__</code> para que a função decorada continue identificável.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'import functools\n\ndef contar(fn):\n    n = 0\n    @functools.wraps(fn)\n    def wrapper(*args, **kwargs):\n        nonlocal n\n        n += 1\n        wrapper.chamadas = n\n        return fn(*args, **kwargs)\n    wrapper.chamadas = 0\n    return wrapper\n\n@contar\ndef dobro(x: int) -> int:\n    """Devolve o dobro."""\n    return 2 * x\n\n>>> dobro(2), dobro(5), dobro.chamadas, dobro.__name__, dobro.__doc__, dobro.__wrapped__.__name__\n(4, 10, 2, \'dobro\', \'Devolve o dobro.\', \'dobro\')\n>>> dobro.__code__.co_freevars\n(\'fn\', \'n\', \'wrapper\')' },
        { tipo: 'python', id: 'f02b3-python', titulo: 'Escreva o decorador @contar', obrigatorio: false,
          enunciado: 'Complete <code>contar</code>: o <code>wrapper</code> deve incrementar o contador <code>n</code> (use <code>nonlocal</code>), publicar o valor em <code>wrapper.chamadas</code>, repassar argumentos posicionais e nomeados, e preservar nome e docstring da função original com <code>functools.wraps</code>.',
          codigo: J([
            'import functools',
            '',
            '',
            'def contar(fn):',
            '    n = 0',
            '    # 1. aplique functools.wraps(fn) ao wrapper',
            '    def wrapper(*args, **kwargs):',
            '        # 2. incremente n (nonlocal) e guarde em wrapper.chamadas',
            '        return fn(*args, **kwargs)',
            '    wrapper.chamadas = 0',
            '    return wrapper',
            '',
            '',
            '@contar',
            'def dobro(x):',
            '    """Devolve o dobro."""',
            '    return 2 * x',
            '',
            '',
            'print(dobro(2), dobro.chamadas)'
          ]),
          testes: J([
            'def test_conta_chamadas():',
            '    @contar',
            '    def soma(a, b):',
            '        return a + b',
            '    assert soma(1, 2) == 3',
            '    assert soma(4, b=5) == 9',
            '    assert soma.chamadas == 2',
            '',
            '',
            'def test_preserva_nome_e_docstring():',
            '    @contar',
            '    def triplo(x):',
            '        """Devolve o triplo."""',
            '        return 3 * x',
            '    assert triplo.__name__ == "triplo"',
            '    assert triplo.__doc__ == "Devolve o triplo."',
            '    assert triplo.__wrapped__(2) == 6',
            '',
            '',
            'def test_contadores_sao_independentes():',
            '    @contar',
            '    def a():',
            '        return 1',
            '    @contar',
            '    def b():',
            '        return 2',
            '    a(); a(); b()',
            '    assert (a.chamadas, b.chamadas) == (2, 1)',
            '',
            '',
            'def test_comeca_em_zero():',
            '    @contar',
            '    def f():',
            '        return None',
            '    assert f.chamadas == 0',
            '',
            '',
            'def test_controle_negativo_sem_wraps_perde_o_nome():',
            '    def sem_wraps(fn):',
            '        def w(*args, **kwargs):',
            '            return fn(*args, **kwargs)',
            '        return w',
            '    @sem_wraps',
            '    def original():',
            '        """doc"""',
            '    assert original.__name__ != "original"',
            '    assert original.__doc__ is None'
          ]),
          dica: 'Acima do <code>def wrapper</code>, coloque <code>@functools.wraps(fn)</code>. Dentro dele: <code>nonlocal n</code>, <code>n += 1</code> e <code>wrapper.chamadas = n</code>.',
          solucao: J([
            'import functools',
            '',
            '',
            'def contar(fn):',
            '    n = 0',
            '',
            '    @functools.wraps(fn)',
            '    def wrapper(*args, **kwargs):',
            '        nonlocal n',
            '        n += 1',
            '        wrapper.chamadas = n',
            '        return fn(*args, **kwargs)',
            '',
            '    wrapper.chamadas = 0',
            '    return wrapper'
          ]),
          tutorDepois: 'O controle negativo prova que o teste de nome consegue falhar: sem wraps, original.__name__ vira "w" e a docstring some, e ferramentas de teste, logs e documentação passam a ver a função errada.',
          callout: 'O contador vive na célula do closure, e o wraps mantém a função identificável.' },
        { tipo: 'texto', html:
          '<p>A mesma técnica, com cache, já está pronta na biblioteca padrão: <code>functools.lru_cache</code> transforma o Fibonacci recursivo de exponencial em linear (<code>fib(80)</code> = 23416728348467685, <code>CacheInfo(hits=78, misses=81, ...)</code>). Atenção: o cache guarda referências aos argumentos, que precisam ser hashable, e vive tanto quanto a função (vazamento de memória em processos longos se a chave cresce sem limite; use <code>maxsize</code>).</p>' +
          '<h3>Recursão e anotações</h3>' +
          '<p>O CPython não faz otimização de chamada de cauda; o limite padrão é <code>sys.getrecursionlimit() == 1000</code> e estourá-lo levanta <code>RecursionError</code>. Para estruturas profundas, converta a recursão em laço com pilha explícita (F03). As <strong>anotações de tipo</strong> (<code>x: int</code>, <code>-&gt; int</code>) não são verificadas em execução: são metadados para ferramentas (mypy, editores, Pydantic). No Python 3.14 elas passaram a ser <em>avaliadas sob demanda</em> (PEP 649): uma anotação que nomeia algo ainda não definido não quebra o <code>def</code>.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> def fa(a: Undefined) -> None: ...\n>>> import annotationlib\n>>> annotationlib.get_annotations(fa, format=annotationlib.Format.STRING)\n{\'a\': \'Undefined\', \'return\': \'None\'}' },
        { tipo: 'texto', html:
          '<p>O curso usa <code>from __future__ import annotations</code> nos módulos do laboratório por compatibilidade com ferramentas e leitores; a tipagem de verdade (genéricos, <code>Protocol</code>, narrowing) é assunto do M02.</p>' },
        { tipo: 'takeaway', html: 'Closures capturam <mark>variáveis, não valores</mark>: o lambda no laço lê a última; trave com <code>i=i</code>. Decorador é closure aplicado, e <mark>functools.wraps</mark> mantém a identidade.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Decisões e erros comuns</h3>' +
          '<ul><li><strong>Funções pequenas e puras quando possível</strong>: entrada por parâmetro, saída por <code>return</code>, sem ler ou escrever globais. Testam-se sem preparar mundo (bloco 8).</li>' +
          '<li><strong>Retornar vários valores</strong> é devolver uma tupla; passou de três, devolva um <code>dataclass</code> ou <code>NamedTuple</code> com nomes.</li>' +
          '<li><strong>Não mute argumentos</strong> sem que o nome da função diga (<code>ordenar_no_lugar</code>); devolva objeto novo ou documente.</li>' +
          '<li><strong>Evite <code>global</code></strong>; estado compartilhado vira parâmetro, atributo de objeto ou closure explícita.</li>' +
          '<li><strong><code>*args</code>/<code>**kwargs</code> "por garantia"</strong> esconde a API: o erro de digitação num nome passa em silêncio. Use só em decoradores e delegação.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: finally com return ou continue engole a exceção', html:
          '<p>Um <code>return</code>, <code>break</code> ou <code>continue</code> dentro de <code>finally</code> descarta a exceção em voo e o <code>return</code> do <code>try</code>. No Python 3.14, o compilador avisa (PEP 765): <code>SyntaxWarning: \'continue\' in a \'finally\' block</code>. Em um teste real, uma função com <code>for i in range(2): try: return i finally: continue</code> devolveu <code>None</code>, não <code>0</code>. Código assim passa em revisão distraída e apaga erros de produção. Trate esse <code>SyntaxWarning</code> como erro (<code>-W error</code> nos testes) e deixe o <code>finally</code> só limpar.</p>' },
        { tipo: 'transcript', id: 'f02b3-transcript', titulo: 'Revisão de um diff escrito por agente', obrigatorio: false,
          enunciado: 'Um agente entregou uma refatoração e descreveu o que fez. Marque as linhas que escondem um defeito de avaliação ou de escopo.',
          linhas: [
            { quem: 'voce', texto: 'Refatore o módulo de eventos: filtros, callbacks e limpeza de recursos.' },
            { quem: 'agente', texto: 'Para guardar o histórico, defini def registrar(evento, historico=[]) e acrescento o evento a essa lista.' },
            { quem: 'agente', texto: 'Criei os callbacks com [lambda: nome for nome in nomes] e cada um imprime o seu nome.' },
            { quem: 'agente', texto: 'Os parâmetros de configuração viraram só-nomeados: def ler(path, *, encoding="utf-8").' },
            { quem: 'agente', texto: 'Na limpeza, coloquei um return False dentro do finally para sempre devolver um status.' },
            { quem: 'ferramenta', texto: 'pytest: 9 passed' },
            { quem: 'agente', texto: 'Usei functools.wraps no decorador de log para manter o nome das funções nos tracebacks.' }
          ],
          erradas: [1, 2, 4],
          explicacao: {
            1: 'O default [] é avaliado uma vez no def: todas as chamadas compartilham o mesmo histórico. Use historico=None e crie a lista dentro.',
            2: 'O closure captura a variável nome, não o valor: todos os callbacks imprimem o último nome. Trave com lambda nome=nome: nome ou functools.partial.',
            4: 'return dentro de finally descarta a exceção em voo e o retorno do try; o 3.14 avisa com SyntaxWarning (PEP 765). Testes verdes não pegam isso.'
          },
          callout: 'As linhas 3 e 6 mostram o desenho certo: só-nomeados na API e wraps no decorador.' },
        { tipo: 'escolha', id: 'f02b3-esc-lambda', titulo: 'Confira: o lambda no laço',
          pergunta: 'Qual o resultado de fs = [lambda: i for i in range(3)]; [f() for f in fs]?',
          opcoes: [
            { id: 'a', texto: '[2, 2, 2]: o closure captura a variável i, não o valor', correta: true, porque: 'todas as lambdas compartilham a mesma i, que vale 2 quando são chamadas. Para travar: lambda i=i: i ou functools.partial.' },
            { id: 'b', texto: '[0, 1, 2]', correta: false, porque: 'só acontece com i=i, que avalia o default na criação.' },
            { id: 'c', texto: '[0, 0, 0]', correta: false, porque: 'não há razão para o valor inicial ser retido.' },
            { id: 'd', texto: 'Erro, pois i não existe fora do laço', correta: false, porque: 'em comprehension o i não vaza, mas o closure mantém a célula viva.' }
          ], tutorDepois: 'Avaliação tardia do closure é o espelho da avaliação adiantada do default.' },
        { tipo: 'texto', html: '<p class="ta-nota">Saídas de execução real em 11/10/2026 com Python 3.14.7. PEP 649 (anotações sob demanda), PEP 765 (finally) e a sintaxe sem parênteses do PEP 758 são do Python 3.14; para versões anteriores, use o formato com parênteses.</p>' },
        { tipo: 'takeaway', html: 'Avaliação <mark>adiantada</mark> (default) e <mark>tardia</mark> (closure) são o mesmo problema visto de dois lados; <code>finally</code> serve para <mark>limpar</mark>, não para decidir o retorno.' }
      ] }
    ]
  });
})();
