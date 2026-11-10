/* F02 · Bloco 5: iteração, geradores e itertools. Fonte: F02.html#b05. Medições de memória de 11/10/2026 (Python 3.14.7, tracemalloc, 1 milhão de linhas); variam por máquina. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var J = function (a) { return a.join('\n') + '\n'; };

  TrilhaAula.registrar({
    id: 'f02-b5',
    titulo: 'Iteração: protocolo, geradores e itertools',
    minutos: 40,
    resumo: 'O for é iter() mais next() em laço. Um gerador é um iterador escrito como função: o corpo só roda sob demanda, suspende em cada yield e dá memória constante.',
    objetivo: 'Distinguir iterável de iterador, explicar quando o corpo de um gerador executa, compor pipelines preguiçosos com itertools e reconhecer os três defeitos do tema: iterador consumido duas vezes, gerador que falha só no consumo e recurso preso por gerador abandonado.',
    revisao: [
      { id: 'f02b5-protocolo', pergunta: 'Qual a diferença entre iterável e iterador?',
        opcoes: [
          opc('a', 'Iterável produz um iterador (__iter__) e é reutilizável; iterador entrega itens (__next__), é de passagem única e levanta StopIteration no fim', true, 'o estado do cursor mora no iterador; range é iterável, map devolve iterador.'),
          opc('b', 'São sinônimos: ambos podem ser percorridos quantas vezes quiser', false, 'iterador esgotado só levanta StopIteration; list(g) uma segunda vez devolve [].'),
          opc('c', 'Iterável só existe para listas', false, 'str, dict, range e arquivos são iteráveis.')] },
      { id: 'f02b5-corpo', pergunta: 'g = ler("nao_existe.csv"), em que ler é função geradora que abre o arquivo. O que acontece nessa linha?',
        opcoes: [
          opc('a', 'Nada: o corpo só roda no primeiro next(g) (ou no for), e é ali que o erro aparece', true, 'para falhar cedo, valide numa função comum que devolve o gerador, ou abra o arquivo fora e passe o objeto.'),
          opc('b', 'FileNotFoundError imediatamente', false, 'chamar função geradora só cria o objeto gerador.'),
          opc('c', 'O gerador devolve uma lista vazia', false, 'ele não devolve nada até ser consumido.')] },
      { id: 'f02b5-passagem', pergunta: 'Depois de g = (x * 2 for x in range(3)), list(g) e de novo list(g), o que a segunda chamada devolve?',
        opcoes: [
          opc('a', '[]: o gerador está esgotado', true, 'quem precisa percorrer de novo cria outro gerador ou materializa uma lista.'),
          opc('b', '[0, 2, 4]: o gerador reinicia', false, 'geradores não reiniciam.'),
          opc('c', 'StopIteration', false, 'list() trata o StopIteration e devolve vazio.')] },
      { id: 'f02b5-groupby', pergunta: 'Por que o itertools.groupby exige ordenar antes?',
        opcoes: [
          opc('a', 'Ele agrupa só corridas adjacentes e cada grupo é um iterador compartilhado, invalidado ao avançar', true, 'consuma o grupo na hora; guardar grupos numa lista dá grupos vazios.'),
          opc('b', 'Porque usa busca binária', false, 'não há busca; há comparação com a chave anterior.'),
          opc('c', 'Porque só aceita listas', false, 'aceita qualquer iterável.')] },
      { id: 'f02b5-memoria', pergunta: 'Por que contar as linhas de um arquivo com sum(1 for _ in open(p)) usa muito menos memória que read_text().splitlines()?',
        opcoes: [
          opc('a', 'O arquivo é um iterador de linhas: o dado flui um item por vez, sem materializar a lista (145 KiB contra 59 032 KiB na medição)', true, 'pipelines de geradores não criam lista intermediária.'),
          opc('b', 'Porque sum comprime os dados', false, 'não há compressão: não se guarda nada.'),
          opc('c', 'Porque splitlines é lento em UTF-8', false, 'o custo é de memória, não de decodificação.')] }
    ],
    abas: [
      { rotulo: 'Protocolo', blocos: [
        { tipo: 'texto', html:
          '<h3>O laço mais usado, o menos entendido</h3>' +
          '<p>O laço <code>for</code> é a construção mais usada da linguagem e raramente é entendido por dentro. Quem o entende escreve pipelines que processam arquivos maiores que a memória com poucos KiB, compõe transformações sem listas intermediárias e reconhece de longe os três defeitos do tema: o iterador consumido duas vezes, o gerador que falha só quando alguém o percorre, e o recurso aberto que um gerador abandonado segura. É também a base do que vem depois: <code>async for</code>, streaming de respostas de LLM e leitura de datasets são o mesmo protocolo.</p>' +
          '<h3>Iterável versus iterador</h3>' +
          '<ul><li>Um <strong>iterável</strong> sabe produzir um iterador: implementa <code>__iter__()</code>. Exemplos: <code>list</code>, <code>str</code>, <code>dict</code>, <code>range</code>, arquivos.</li>' +
          '<li>Um <strong>iterador</strong> entrega os itens um a um: implementa <code>__next__()</code> (devolve o próximo ou levanta <code>StopIteration</code>) e <code>__iter__()</code> devolvendo a si mesmo.</li></ul>' +
          '<p>O laço <code>for x in obj: corpo</code> é, em essência:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'it = iter(obj)            # chama obj.__iter__()\nwhile True:\n    try:\n        x = next(it)      # chama it.__next__()\n    except StopIteration:\n        break\n    corpo' },
        { tipo: 'texto', html:
          '<p>A diferença importa porque o iterável é <em>reutilizável</em> (cada <code>iter()</code> dá um cursor novo) e o iterador é <em>de passagem única</em> (o estado do cursor está nele).</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> r = iter(range(3)); list(r), list(r)\n([0, 1, 2], [])\n>>> list(range(3)), list(range(3))          # range é iterável: cada list() pede um cursor novo\n([0, 1, 2], [0, 1, 2])\n>>> m = map(str, [1, 2]); list(m), list(m)  # map devolve iterador\n([\'1\', \'2\'], [])\n>>> it = iter([1, 2, 3])\n>>> for x in it:\n...     if x == 2: break\n>>> list(it)\n[3]' },
        { tipo: 'texto', html:
          '<p>O último caso é o que pega: o <code>break</code> não "fecha" o iterador; ele já consumiu o 2, e o que sobra é <code>[3]</code>. Um iterador passado para duas funções é dividido entre elas. Um iterador próprio mínimo mostra o contrato (e a razão de <code>__iter__</code> devolver <code>self</code>):</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'class Cnt:\n    def __init__(self, n): self.n, self.i = n, 0\n    def __iter__(self): return self\n    def __next__(self):\n        if self.i >= self.n:\n            raise StopIteration\n        self.i += 1\n        return self.i\n\n>>> list(Cnt(3))\n[1, 2, 3]' },
        { tipo: 'escolha', id: 'f02b5-esc-passagem', titulo: 'Confira: a segunda passada',
          pergunta: 'Depois de g = (x * 2 for x in range(3)), list(g) e novamente list(g), o que a segunda chamada devolve?',
          opcoes: [
            { id: 'a', texto: '[]: o gerador está esgotado', correta: true, porque: 'iteradores e geradores são de passagem única; esgotados, só levantam StopIteration, e list() devolve vazio.' },
            { id: 'b', texto: '[0, 2, 4]: o gerador reinicia', correta: false, porque: 'geradores não reiniciam. Um iterável (range, lista) produz um iterador novo a cada iter().' },
            { id: 'c', texto: 'Erro StopIteration', correta: false, porque: 'list() consome o StopIteration e termina.' },
            { id: 'd', texto: 'None', correta: false, porque: 'list() sempre devolve uma lista.' }
          ], tutorDepois: 'Guarde a lista se precisar percorrer duas vezes.' },
        { tipo: 'takeaway', html: 'Iterável <mark>produz</mark> iterador; iterador é de <mark>passagem única</mark> e levanta <code>StopIteration</code> no fim; o <code>for</code> é <code>iter</code> mais <code>next</code>.' }
      ] },

      { rotulo: 'Geradores', blocos: [
        { tipo: 'texto', html:
          '<h3>Geradores: iteradores escritos como funções</h3>' +
          '<p>Escrever a classe acima à mão é verboso. Uma função com <code>yield</code> no corpo é uma <strong>função geradora</strong>: chamá-la <em>não executa o corpo</em>; devolve um objeto gerador, que implementa o protocolo de iterador. O corpo roda sob demanda, e em cada <code>yield</code> a função <strong>suspende</strong>, preservando variáveis locais e ponto de execução, até o próximo <code>next()</code>. Preveja a saída do script abaixo.</p>' },
        { tipo: 'rode', id: 'f02b5-rode', titulo: 'O corpo só roda sob demanda', enunciado: 'Rode o script e acompanhe em que momento cada <code>print</code> do gerador aparece.',
          prefixo: '$', entrada: 'python gerador.py', unidade: 'linha', terminalTitulo: 'terminal',
          etapas: [
            { id: 'fonte', nome: 'O script', descricao: 'gerador.py', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'cat gerador.py'),
              L('out', 'def gen():'), L('out', '    print("start")'), L('out', '    x = yield 1'),
              L('out', '    print("got", x)'), L('out', '    yield 2'), L('out', '    print("end")'),
              L('out', 'g = gen()'), L('out', 'print(next(g))'), L('out', 'print(g.send("oi"))'), L('out', 'next(g)')] },
            { id: 'cria', nome: 'g = gen()', descricao: 'Nada é impresso', tom: 'tcp', ms: 2, linhas: [
              L('hint', 'o corpo ainda não rodou: só nasceu o objeto gerador (estado criado)')] },
            { id: 'next1', nome: 'next(g)', descricao: 'Roda até o primeiro yield', tom: 'tls', ms: 3, linhas: [
              L('in', 'start'), L('in', '1'),
              L('hint', 'suspende no yield 1, com as locais preservadas')] },
            { id: 'send', nome: 'g.send("oi")', descricao: 'Retoma; "oi" vira o valor do yield', tom: 'request', ms: 4, linhas: [
              L('in', 'got oi'), L('in', '2')] },
            { id: 'fim', nome: 'next(g)', descricao: 'O corpo termina', tom: 'response', ms: 5, linhas: [
              L('in', 'end'),
              L('in', 'Traceback (most recent call last): ... StopIteration'),
              L('hint', 'o return do gerador encerra com StopIteration')] }
          ],
          prever: { pergunta: 'Logo depois de g = gen(), antes de qualquer next, o que o script já imprimiu?', opcoes: [
            { id: 'a', texto: '"start", porque o corpo roda até o primeiro yield ao criar o gerador.', correta: false, porque: 'criar não executa nada: o corpo só roda no primeiro next().' },
            { id: 'b', texto: 'Nada: chamar a função geradora só cria o objeto gerador.', correta: true, porque: 'o corpo executa sob demanda e suspende em cada yield, preservando o estado.' },
            { id: 'c', texto: '"start" e "end", porque a função roda inteira e guarda os valores.', correta: false, porque: 'isso seria uma função comum que devolve uma lista.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Clique em "g = gen()" para ver que nada foi impresso.',
          tutorDepois: 'O gerador passa por estados observáveis (inspect.getgeneratorstate): GEN_CREATED, GEN_SUSPENDED, GEN_RUNNING, GEN_CLOSED. Por desenho (PEP 479), um StopIteration levantado dentro do corpo vira RuntimeError ("generator raised StopIteration"), para que um bug interno não pareça fim normal.',
          callout: 'Você viu o corpo do gerador rodar só no consumo e suspender em cada yield.' },
        { tipo: 'ordene', id: 'f02b5-ordene', titulo: 'A vida de um gerador', obrigatorio: false,
          enunciado: 'Ordene o que acontece com g = contar(2), em que contar(n) faz i = 0, while i &lt; n: yield i; i += 1.',
          itens: [
            { id: 'c', texto: 'next(g) retoma logo depois do yield, com o estado preservado: i vira 1 e suspende de novo' },
            { id: 'e', texto: 'list(g) devolve [] agora: o gerador é de passagem única' },
            { id: 'a', texto: 'g = contar(2): a função não executa; só nasce o gerador, sem valor produzido' },
            { id: 'd', texto: 'next(g): i vira 2, o while termina, a função acaba e sai StopIteration' },
            { id: 'b', texto: 'next(g) roda até o primeiro yield e suspende com i = 0, devolvendo 0' }
          ],
          solucao: ['a', 'b', 'c', 'd', 'e'],
          dica: 'Comece pelo que acontece ao chamar a função, e termine pelo estado de esgotado.',
          callout: 'Criar, produzir, retomar, terminar e esgotar: cinco estados do mesmo objeto.' },
        { tipo: 'texto', html:
          '<p>Outros recursos: <code>yield from outro</code> delega a outro iterável (e propaga <code>send</code>/<code>close</code>), ideal para recursão sobre estruturas; <code>g.close()</code> injeta <code>GeneratorExit</code> no ponto suspenso para que blocos <code>finally</code>/<code>with</code> limpem. As <strong>expressões geradoras</strong> <code>(f(x) for x in xs)</code> são a forma curta, e <code>sum(1 for _ in range(10**6))</code> conta sem criar lista.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'def flat(xs):\n    for x in xs:\n        if isinstance(x, list):\n            yield from flat(x)\n        else:\n            yield x\n\n>>> list(flat([1, [2, [3]], 4]))\n[1, 2, 3, 4]\n\ndef fib():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b\n\n>>> list(itertools.takewhile(lambda v: v < 30, fib()))\n[0, 1, 1, 2, 3, 5, 8, 13, 21]' },
        { tipo: 'texto', html:
          '<p>Geradores podem ser <strong>infinitos</strong>, porque nada é produzido antes de ser pedido. O consumidor define quando parar.</p>' },
        { tipo: 'takeaway', html: 'Função com <code>yield</code> devolve gerador: o <mark>corpo só roda no consumo</mark>, suspende em cada <code>yield</code> e preserva o estado; fluxos podem ser <mark>infinitos</mark>.' }
      ] },

      { rotulo: 'Preguiça e itertools', blocos: [
        { tipo: 'texto', html:
          '<h3>Preguiça como ferramenta de memória</h3>' +
          '<p>A vantagem central é memória constante: o dado flui um item por vez. Medição real com <code>tracemalloc</code>, contando as linhas de um arquivo de 1 milhão de linhas:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'sum(1 for _ in open(p, encoding="utf-8"))          # pico: 145 KiB\nlen(p.read_text(encoding="utf-8").splitlines())    # pico: 59 032 KiB' },
        { tipo: 'texto', html:
          '<p>Mesmo resultado (1 000 000), com a diferença de ~400 vezes no pico. O arquivo é um iterador de linhas. Em pipelines, cada estágio é um gerador consumindo o anterior (<code>linhas → parse → filtro → agregação</code>), sem lista intermediária. É a forma do laboratório: <code>scan(path)</code> lê e valida linha a linha, e quem consome decide se agrega, imprime ou para no primeiro erro.</p>' +
          '<h3><code>itertools</code>: peças para compor iteração</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Função</th><th>O que faz</th><th>Exemplo</th></tr></thead><tbody>' +
          '<tr><td><code>islice(it, a, b, passo)</code></td><td>fatia sem materializar (não aceita negativos)</td><td><code>list(islice("abcdef", 1, 5, 2))</code> → <code>[\'b\', \'d\']</code></td></tr>' +
          '<tr><td><code>chain(*its)</code> / <code>chain.from_iterable</code></td><td>concatena iteráveis</td><td><code>list(chain([1], [2]))</code> → <code>[1, 2]</code></td></tr>' +
          '<tr><td><code>pairwise(it)</code></td><td>pares consecutivos</td><td><code>[(\'a\',\'b\'), (\'b\',\'c\')]</code></td></tr>' +
          '<tr><td><code>batched(it, n)</code> (3.12+)</td><td>lotes de tamanho n (o último pode ser menor)</td><td><code>list(batched("abcde", 2))</code> → <code>[(\'a\',\'b\'), (\'c\',\'d\'), (\'e\',)]</code></td></tr>' +
          '<tr><td><code>accumulate(it)</code></td><td>acumulados parciais</td><td><code>[1, 3, 6]</code> para <code>[1, 2, 3]</code></td></tr>' +
          '<tr><td><code>groupby(it, key)</code></td><td>agrupa corridas <em>adjacentes</em> (ordene antes)</td><td>bloco 4</td></tr>' +
          '<tr><td><code>takewhile</code> / <code>dropwhile</code></td><td>prefixo / resto por predicado</td><td>acima, com <code>fib()</code></td></tr>' +
          '<tr><td><code>product</code> / <code>permutations</code> / <code>combinations</code></td><td>combinatória</td><td><code>product("ab", repeat=2)</code></td></tr>' +
          '<tr><td><code>tee(it, n)</code></td><td>n iteradores independentes (bufferiza o que um consumiu e o outro não)</td><td>use com cuidado em fluxos longos</td></tr></tbody></table>' +
          '<p>O <code>batched</code> é o remédio para "processar em lotes de 500" (inserção em banco, chamadas de API com limite): <code>for lote in batched(linhas, 500): ...</code>. Antes dele, a solução caseira com fatias de lista falhava em fluxos.</p>' },
        { tipo: 'python', id: 'f02b5-python', titulo: 'Escreva o seu batched, preguiçoso e com falha cedo', obrigatorio: false,
          enunciado: 'Complete <code>em_lotes(iteravel, n)</code>: devolve um gerador de tuplas de até <code>n</code> itens, sem materializar a entrada (deve funcionar com um iterador infinito). <code>n &lt; 1</code> deve levantar <code>ValueError</code> <strong>na própria chamada</strong>, não só no primeiro <code>next()</code>: por isso a validação fica numa função comum que <em>devolve</em> o gerador.',
          codigo: J([
            'import itertools',
            '',
            '',
            'def em_lotes(iteravel, n):',
            '    # 1. valide n >= 1 AGORA, fora do gerador (ValueError)',
            '    def gerar():',
            '        it = iter(iteravel)',
            '        # 2. enquanto houver itens, de um lote com islice(it, n)',
            '        return',
            '        yield',
            '',
            '    return gerar()',
            '',
            '',
            'print(list(em_lotes("abcde", 2)))'
          ]),
          testes: J([
            'def test_lotes_com_resto():',
            '    assert list(em_lotes("abcde", 2)) == [("a", "b"), ("c", "d"), ("e",)]',
            '',
            '',
            'def test_vazio():',
            '    assert list(em_lotes([], 3)) == []',
            '',
            '',
            'def test_e_preguicoso_com_fonte_infinita():',
            '    g = em_lotes(itertools.count(), 3)',
            '    assert next(g) == (0, 1, 2)',
            '    assert next(g) == (3, 4, 5)',
            '',
            '',
            'def test_n_invalido_falha_na_chamada():',
            '    try:',
            '        em_lotes("abc", 0)',
            '    except ValueError:',
            '        return',
            '    raise AssertionError("esperava ValueError na chamada")',
            '',
            '',
            'def test_controle_negativo_gerador_e_de_passagem_unica():',
            '    g = em_lotes("abcd", 2)',
            '    assert list(g) == [("a", "b"), ("c", "d")]',
            '    assert list(g) == []'
          ]),
          dica: 'Use <code>if n &lt; 1: raise ValueError(n)</code> antes do <code>def gerar</code>. No corpo: <code>while lote := tuple(itertools.islice(it, n)): yield lote</code>.',
          solucao: J([
            'import itertools',
            '',
            '',
            'def em_lotes(iteravel, n):',
            '    if n < 1:',
            '        raise ValueError(n)',
            '',
            '    def gerar():',
            '        it = iter(iteravel)',
            '        while lote := tuple(itertools.islice(it, n)):',
            '            yield lote',
            '',
            '    return gerar()'
          ]),
          tutorDepois: 'Se a validação estivesse dentro do gerador, o ValueError só apareceria no primeiro next(), possivelmente num módulo distante. O controle negativo mostra o outro lado: a segunda passada vem vazia.',
          callout: 'Falhar cedo numa função comum e entregar a preguiça num gerador interno.' },
        { tipo: 'takeaway', html: 'A preguiça dá <mark>memória constante</mark> (145 KiB contra 59 MiB na medição); <code>itertools</code> compõe sem listas intermediárias, e <code>batched</code> faz <mark>lotes</mark>.' }
      ] },

      { rotulo: 'Aplicar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Exemplo trabalhado: o leitor do laboratório</h3>' +
          '<p>A função <code>scan</code> junta quase tudo deste bloco e do seguinte. Ela é um gerador que <em>devolve erros como valores</em> em vez de levantá-los, porque um erro de linha não deve matar a leitura do resto:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'def scan(path: Path, *, encoding: str = "utf-8") -> Iterator[Expense | InvalidRowError]:\n    try:\n        with path.open(encoding=encoding, newline="") as handle:\n            reader = csv.DictReader(handle)\n            missing = [c for c in REQUIRED_COLUMNS if c not in (reader.fieldnames or [])]\n            if missing:\n                raise MissingColumnError(missing)\n            for row in reader:\n                try:\n                    item: Expense | InvalidRowError = parse_row(reader.line_num, row)\n                except InvalidRowError as err:\n                    item = err\n                yield item\n    except UnicodeDecodeError as err:\n        raise EncodingMismatchError(...) from err\n\n>>> g = scan(Path("nao-existe.csv")); type(g).__name__\n\'generator\'\n>>> next(g)\nFileNotFoundError: [Errno 2] No such file or directory: \'nao-existe.csv\'   # só aqui, no primeiro next()' },
        { tipo: 'texto', html:
          '<p>Primeiro, <strong>criar o gerador não abre o arquivo</strong>; o erro de arquivo inexistente aparece no primeiro <code>next()</code>, longe de onde você chamou <code>scan(...)</code>. Isso é bom para memória e ruim para diagnóstico, e por isso a CLI trata <code>FileNotFoundError</code> no ponto em que consome. Segundo, o <code>with</code> está <em>dentro</em> do gerador: o arquivo fica aberto enquanto o gerador estiver suspenso e fecha quando ele termina, é fechado (<code>close()</code>) ou coletado. Os testes <code>test_scan_is_a_generator_and_does_not_open_the_file_early</code> e <code>test_strict_reader_is_lazy_and_stops_at_first_bad_row</code> fixam as duas propriedades. Terceiro, o <code>reader.line_num</code> (e não um contador manual) dá o número de linha <em>física</em> mesmo com campos multilinha entre aspas.</p>' },
        { tipo: 'cenario', id: 'f02b5-cenario', titulo: 'O erro que aparece longe', obrigatorio: false,
          enunciado: 'Um módulo chama scan(path) e passa o gerador adiante; o FileNotFoundError estoura num módulo de relatório, em outra thread. Decida o desenho.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O erro de arquivo ausente aparece longe de quem chamou scan. O que você faz?', opcoes: [
              { texto: 'Envolver o programa inteiro em try/except Exception e registrar.', vai: 'f-engole', tom: 'ruim', consequencia: 'o erro some do ponto de falha e o relatório sai vazio sem explicação.' },
              { texto: 'Validar o caminho numa função comum que devolve o gerador, ou tratar FileNotFoundError onde o gerador é consumido.', vai: 'f-bom', tom: 'ok', consequencia: 'a falha aparece perto de quem pode agir, com mensagem útil.' },
              { texto: 'Trocar o gerador por read_text().splitlines() para o erro vir na hora.', vai: 'f-memoria', tom: 'ruim', consequencia: 'o erro vem cedo, mas você pagou 400 vezes mais memória no arquivo de 1 milhão de linhas.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'É o que a CLI do laboratório faz: o consumo é onde o FileNotFoundError é tratado, e a leitura continua preguiçosa.' },
            'f-engole': { bom: false, texto: 'O except largo apagou a evidência. Capture o tipo específico no ponto em que sabe agir.' },
            'f-memoria': { bom: false, texto: 'Falhou cedo, mas abriu mão da memória constante que justificava o gerador.' }
          },
          callout: 'Você manteve a preguiça e falhou perto de quem sabe agir.' },
        { tipo: 'texto', html:
          '<h3>Decisões e erros comuns</h3>' +
          '<ul><li><strong>Quando materializar:</strong> se precisa de <code>len</code>, indexar, percorrer duas vezes ou ordenar, use <code>list</code>. Se só percorre uma vez, deixe preguiçoso.</li>' +
          '<li><strong>Funções que aceitam <code>Iterable</code></strong> (não <code>list</code>) funcionam com listas, geradores e arquivos; funções que percorrem duas vezes devem exigir <code>Sequence</code> ou materializar no início, documentando.</li>' +
          '<li><strong>Gerador como API pública:</strong> documente que é de passagem única e que erros podem aparecer no consumo.</li>' +
          '<li><strong><code>return</code> no gerador:</strong> o valor vai para o <code>StopIteration.value</code>; raro, e quase sempre sinal de que uma classe ou tupla final seria mais claro.</li>' +
          '<li><strong>Efeitos colaterais dentro de <code>map</code>/comprehension:</strong> <code>map(print, xs)</code> não imprime nada até alguém consumir.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o gerador abandonado segura o recurso e o erro vem tarde', html:
          '<p>Um gerador que abre arquivo ou conexão e é descartado antes de acabar só libera o recurso quando é coletado (imediato no CPython por contagem de referências, indeterminado em outras implementações e quando há referência em traceback ou lista). Em produção isso vira "too many open files" intermitente. Duas defesas: consumir dentro de <code>with contextlib.closing(gerador):</code> quando for possível abandonar no meio, e preferir passar o <code>Path</code> ao consumidor final a deixar um gerador aberto circulando. O defeito simétrico: como o corpo só roda no consumo, validações e erros de configuração (arquivo ausente, coluna faltando) aparecem no primeiro <code>next()</code>, possivelmente em outro módulo ou thread; para falhar cedo, valide numa função comum que <em>devolve</em> o gerador.</p>' },
        { tipo: 'escolha', id: 'f02b5-esc-corpo', titulo: 'Confira: quando o corpo roda',
          pergunta: 'Uma função geradora abre um arquivo e dá yield nas linhas. O que acontece ao rodar g = ler("nao_existe.csv")?',
          opcoes: [
            { id: 'a', texto: 'FileNotFoundError imediatamente', correta: false, porque: 'chamar uma função geradora só cria o objeto gerador.' },
            { id: 'b', texto: 'None, e o arquivo é aberto em segundo plano', correta: false, porque: 'não há segundo plano: nada executa até o consumo.' },
            { id: 'c', texto: 'O gerador devolve uma lista vazia', correta: false, porque: 'o gerador não devolve nada sem next().' },
            { id: 'd', texto: 'Nada: o corpo só roda no primeiro next(g) (ou no for), e é ali que o erro aparece', correta: true, porque: 'para falhar cedo, valide argumentos numa função normal que devolve o gerador, ou abra o arquivo fora e passe o objeto.' }
          ], tutorDepois: 'Erros e abertura de recurso dentro de gerador só ocorrem no consumo.' },
        { tipo: 'texto', html: '<p class="ta-nota">Medições de memória e tempo de 11/10/2026 (Python 3.14.7, tracemalloc, Linux); variam por máquina. <code>itertools.batched</code> exige Python 3.12 ou mais novo.</p>' },
        { tipo: 'takeaway', html: 'Gerador é <mark>passagem única</mark>; erro e abertura de recurso só ocorrem no <mark>consumo</mark>; para falhar cedo, valide numa função comum que <mark>devolve</mark> o gerador.' }
      ] }
    ]
  });
})();
