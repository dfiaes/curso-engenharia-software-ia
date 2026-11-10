/* F03 · Bloco 3: Hashing. Fonte: F03.html#b03. Saídas: execução real do laboratório em 11/10/2026 (CPython 3.14.7). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'MASCARA64 = (1 << 64) - 1',
    'LAPIDE = object()',
    '',
    '',
    'def sondagem(h, mascara, passos):',
    '    """Primeiros `passos` índices que o dict do CPython visita para o hash h."""',
    '    perturb = h & MASCARA64',
    '    i = perturb & mascara',
    '    for _ in range(passos):',
    '        yield i',
    '        # CORRIJA: a recorrência do CPython injeta os bits altos do hash:',
    '        #   perturb >>= 5 ; i = (i * 5 + perturb + 1) & mascara',
    '        i = (i + 1) & mascara',
    '',
    '',
    'class Tabela:',
    '    """Endereçamento aberto, capacidade fixa (potência de dois), com lápides."""',
    '',
    '    def __init__(self, cap=16):',
    '        self._m = cap - 1',
    '        self._s = [None] * cap',
    '',
    '    def _indices(self, chave):',
    '        return sondagem(hash(chave), self._m, len(self._s))',
    '',
    '    def _achar(self, chave):',
    '        for i in self._indices(chave):',
    '            e = self._s[i]',
    '            if e is None:',
    '                return None',
    '            if e is not LAPIDE and (e[1] is chave or e[1] == chave):',
    '                return i',
    '        return None',
    '',
    '    def buscar(self, chave, padrao=None):',
    '        i = self._achar(chave)',
    '        return padrao if i is None else self._s[i][2]',
    '',
    '    def inserir(self, chave, valor):',
    '        i = self._achar(chave)',
    '        if i is not None:',
    '            self._s[i] = (hash(chave), chave, valor)',
    '            return',
    '        for i in self._indices(chave):',
    '            if self._s[i] is None or self._s[i] is LAPIDE:',
    '                self._s[i] = (hash(chave), chave, valor)',
    '                return',
    '        raise RuntimeError("tabela cheia")',
    '',
    '    def remover(self, chave):',
    '        i = self._achar(chave)',
    '        if i is None:',
    '            raise KeyError(chave)',
    '        # CORRIJA: o slot não pode voltar a "vazio" (cortaria a cadeia de sondagem)',
    '        self._s[i] = None',
    '',
    '    def ocupados(self):',
    '        return sum(1 for e in self._s if e is not None)',
    ''].join('\n');
  var testes = [
    'class K:',
    '    """Chave com hash constante: força colisão de propósito."""',
    '    def __init__(self, nome):',
    '        self.nome = nome',
    '    def __eq__(self, o):',
    '        return isinstance(o, K) and o.nome == self.nome',
    '    def __hash__(self):',
    '        return 5',
    '',
    '',
    'class Ponto:',
    '    def __init__(self, x, y):',
    '        self.x, self.y = x, y',
    '    def __eq__(self, o):',
    '        return isinstance(o, Ponto) and (self.x, self.y) == (o.x, o.y)',
    '    def __hash__(self):',
    '        return hash((self.x, self.y))',
    '',
    '',
    'def test_periodo_completo():',
    '    idx = list(sondagem(0, 7, 8))',
    '    assert idx == [0, 1, 6, 7, 4, 5, 2, 3] and set(idx) == set(range(8))',
    '',
    '',
    'def test_bits_altos_separam_a_sondagem():',
    '    assert list(sondagem(8, 7, 2)) == [0, 1]',
    '    assert list(sondagem(40, 7, 2)) == [0, 2]',
    '',
    '',
    'def test_inserir_buscar_atualizar():',
    '    t = Tabela()',
    '    t.inserir("a", 1)',
    '    t.inserir("b", 2)',
    '    t.inserir("a", 9)',
    '    assert t.buscar("a") == 9 and t.buscar("b") == 2 and t.ocupados() == 2',
    '    assert t.buscar("z", "nada") == "nada"',
    '',
    '',
    'def test_colisao_total_ainda_acha_todas():',
    '    t = Tabela()',
    '    for n in "abcde":',
    '        t.inserir(K(n), n.upper())',
    '    assert [t.buscar(K(n)) for n in "abcde"] == list("ABCDE")',
    '',
    '',
    'def test_remover_no_meio_da_cadeia_nao_perde_o_resto():',
    '    t = Tabela()',
    '    for n in "abc":',
    '        t.inserir(K(n), n)',
    '    t.remover(K("b"))',
    '    assert t.buscar(K("b")) is None',
    '    assert t.buscar(K("c")) == "c"',
    '',
    '',
    'def test_lapide_e_reaproveitada():',
    '    t = Tabela()',
    '    for n in "abc":',
    '        t.inserir(K(n), n)',
    '    t.remover(K("b"))',
    '    antes = t.ocupados()',
    '    t.inserir(K("d"), "d")',
    '    assert t.ocupados() == antes',
    '',
    '',
    'def test_remover_inexistente_levanta():',
    '    t = Tabela()',
    '    try:',
    '        t.remover("x")',
    '    except KeyError:',
    '        return',
    '    assert False, "deveria levantar KeyError"',
    '',
    '',
    'def test_controle_chave_mutada_some():',
    '    t = Tabela()',
    '    p = Ponto(1, 2)',
    '    t.inserir(p, "a")',
    '    p.x = 99',
    '    assert t.buscar(p) is None and t.ocupados() == 1',
    ''].join('\n');
  var solucao = codigo
    .replace('        i = (i + 1) & mascara', '        perturb >>= 5\n        i = (i * 5 + perturb + 1) & mascara')
    .replace('        self._s[i] = None\n\n    def ocupados', '        self._s[i] = LAPIDE\n\n    def ocupados');

  TrilhaAula.registrar({
    id: 'f03-b3',
    titulo: 'Hashing: tabelas, colisões e o dict do CPython',
    minutos: 40,
    resumo: 'Dicionários e conjuntos são a estrutura mais usada de Python. Entender o mecanismo diz quando o O(1) é verdadeiro, quando degenera e por que chaves mutáveis são proibidas.',
    objetivo: 'Explicar colisão, endereçamento aberto, fator de carga e lápides; aplicar o contrato hash/eq; e implementar a sondagem do CPython numa tabela com remoção correta.',
    revisao: [
      { id: 'f03b3-contrato', pergunta: 'Duas chaves têm <code>__eq__</code> igual mas <code>__hash__</code> diferente. O que quebra?',
        opcoes: [
          opc('a', 'O contrato a == b ⇒ hash(a) == hash(b): a busca da chave "igual" cai em outra sequência de sondagem e o conjunto passa a ter duplicatas silenciosas', true, 'violar o contrato produz bugs silenciosos, não exceções.'),
          opc('b', 'Levanta TypeError ao inserir', false, 'só chaves não-hasheáveis levantam TypeError.'),
          opc('c', 'Nada: o dict compara só por ==', false, 'o dict só compara chaves que caem na mesma sondagem.')] },
      { id: 'f03b3-carga', pergunta: 'Por que o dict cresce antes de encher (máximo de 2/3 dos slots)?',
        opcoes: [
          opc('a', 'Com sondagem uniforme, uma busca sem sucesso inspeciona ≈ 1/(1−α) slots: 2 com α=0,5, 10 com 0,9, 100 com 0,99', true, 'a reconstrução é O(n) numa inserção, amortizada O(1) como no array dinâmico.'),
          opc('b', 'Para economizar memória', false, 'crescer gasta mais memória; é pelo tempo de sondagem.'),
          opc('c', 'Porque o hash exige tamanho primo', false, 'o CPython usa potência de dois.')] },
      { id: 'f03b3-lapide', pergunta: 'Por que remover uma chave deixa uma lápide e não um slot vazio?',
        opcoes: [
          opc('a', 'Um slot vazio cortaria a cadeia de sondagem das outras chaves que passaram por ali', true, 'a lápide só é consumida quando uma nova chave a reaproveita ou numa reconstrução.'),
          opc('b', 'Porque o slot guarda o histórico para auditoria', false, 'não há histórico.'),
          opc('c', 'Para não precisar liberar a chave', false, 'a razão é a integridade da busca.')] },
      { id: 'f03b3-seed', pergunta: 'Por que nunca gravar <code>hash("usuario@exemplo.com")</code> no banco?',
        opcoes: [
          opc('a', 'O hash de str e bytes é aleatorizado por processo (PYTHONHASHSEED): o valor muda entre execuções', true, 'para identidade persistente use <code>hashlib</code> sobre bytes com codificação definida.'),
          opc('b', 'Porque o hash é sempre negativo', false, 'o sinal não é o problema.'),
          opc('c', 'Porque strings não têm hash', false, 'têm, mas só valem dentro do processo.')] },
      { id: 'f03b3-mutavel', pergunta: 'O que acontece com <code>d[(1, [2, 3])] = "x"</code>?',
        opcoes: [
          opc('a', '<code>TypeError: unhashable type: \'list\'</code>: o hash da tupla depende do hash dos elementos', true, 'o hash não pode mudar enquanto o objeto está na tabela.'),
          opc('b', 'Funciona e a lista é copiada', false, 'não há cópia.'),
          opc('c', 'Funciona se a lista não mudar depois', false, 'a lista é não-hasheável por ser mutável, mudando ou não.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Dicionários e conjuntos são a base de memoização, deduplicação, índices invertidos, contagem, cache e junções em memória. Em IA, são também a estrutura do pré-processamento (vocabulário de tokens, deduplicação de corpus) e dos caches de resposta de LLM, onde a chave é um hash do prompt.</p>' +
          '<h3>O mecanismo</h3>' +
          '<p>Uma <strong>tabela hash</strong> guarda pares chave/valor num array de <em>slots</em>. Uma função hash transforma a chave num inteiro; o índice inicial é o inteiro reduzido ao tamanho do array. Duas chaves diferentes podem cair no mesmo slot: a <strong>colisão</strong> é inevitável (princípio da casa dos pombos). Há duas famílias de solução:</p>' +
          '<ul><li><strong>Encadeamento (chaining)</strong>: cada slot guarda uma lista (ou árvore) das entradas que caíram nele. Simples, tolera fator de carga &gt; 1, mas cada entrada é um nó separado (ponteiros, cache ruim). É o que o <code>HashMap</code> do Java faz, com árvores nos baldes longos.</li>' +
          '<li><strong>Endereçamento aberto (open addressing)</strong>: a entrada fica <em>dentro</em> do array; se o slot está ocupado, anda-se por uma sequência de sondagem determinística até achar um livre. Melhor localidade, sem alocação por entrada, mas exige fator de carga &lt; 1 e a remoção é sutil (lápides). É o que o CPython faz.</li></ul>' +
          '<p>O <strong>fator de carga</strong> α = ocupados / capacidade controla o custo: o número esperado de slots inspecionados numa busca <em>sem sucesso</em> é cerca de 1/(1−α). O dict do CPython mantém no máximo 2/3 dos slots usados; o crescimento reconstrói a tabela inteira (O(n) numa inserção, amortizado O(1)).</p>' },
        { tipo: 'abas', rotulo: 'Detalhes', itens: [
          { rotulo: 'Layout (3.6+)', blocos: [{ tipo: 'texto', html:
            '<p>Desde o CPython 3.6 o dict é <em>compacto</em>: um array pequeno de <strong>índices</strong> (bytes, depois inteiros de 16/32/64 bits) é a tabela de hash propriamente dita e aponta para um array denso de <strong>entradas</strong> <code>(hash, chave, valor)</code> em <em>ordem de inserção</em>. Economizou memória e deu de brinde a ordem de iteração garantida pela linguagem desde o 3.7.</p>' }] },
          { rotulo: 'Sondagem', blocos: [
            { tipo: 'texto', html: '<p>A sondagem não é linear:</p>' },
            { tipo: 'codigo', linguagem: 'text', texto: ['perturb = hash', 'i = perturb & mask', 'repita:', '    inspeciona slot i', '    perturb >>= 5', '    i = (i * 5 + perturb + 1) & mask'].join('\n') },
            { tipo: 'texto', html: '<p>O termo <code>5*i + 1</code> percorre todos os slots de uma tabela de tamanho potência de dois (período completo) e <code>perturb</code> injeta os bits altos do hash nos primeiros passos, separando hashes que diferem só nos bits altos. A comparação em cada slot é escalonada: primeiro o hash armazenado (inteiro, barato), depois identidade (<code>is</code>) e só por último <code>__eq__</code>, que pode ser caro ou ter efeitos colaterais.</p>' }] },
          { rotulo: 'Lab', blocos: [{ tipo: 'texto', html:
            '<p>O <code>OpenAddressingTable</code> do laboratório usa <strong>a mesma recorrência</strong> e a mesma comparação escalonada, mas guarda tudo num único array de tuplas <code>(hash, chave, valor)</code>: a iteração sai em ordem de slot, não de inserção, e o limiar é 2/3 de ocupação contando lápides. O layout de dois arrays do CPython é otimização de memória e de ordem; a lógica de colisão é a do lab.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'Colisão é <mark>inevitável</mark>; o <mark>fator de carga</mark> mantém o custo esperado constante.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'b3-demo', titulo: 'Colisões, lápides e hash constante', prefixo: '$', entrada: 'uv run python -m algos.demo table', unidade: 'x', terminalTitulo: 'saída real do laboratório',
          enunciado: 'A tabela do lab cresce, remove com lápides e degrada quando todas as chaves têm o mesmo hash.',
          prever: { pergunta: 'Num dict, 300 chaves com o <strong>mesmo hash</strong>: quantos slots a última busca inspeciona, em comparação com 300 hashes distintos (pior busca = 1)?', opcoes: [
            { id: 'a', texto: 'Cerca de 2: o dict reorganiza sozinho', correta: false, porque: 'o dict não reorganiza chaves de hash igual; a sondagem é a mesma para todas.' },
            { id: 'b', texto: 'Cerca de 300: vira varredura linear', correta: true, porque: 'todas caem na mesma sequência de sondagem; o custo O(1) esperado vira O(n).' },
            { id: 'c', texto: 'Levanta exceção', correta: false, porque: 'o contrato é cumprido por um hash constante; só fica lento.' }
          ] },
          etapas: [
            { id: 'cresce', nome: 'Crescimento', descricao: 'capacidade 8 → 64', tom: 'request', ms: 8, linhas: [
              L('out', 'start: capacity=8'), L('out', 'insert #6: capacity 8 -> 16 (rebuild)'),
              L('out', 'insert #11: capacity 16 -> 32 (rebuild)'), L('out', 'insert #22: capacity 32 -> 64 (rebuild)'),
              L('out', '24 keys: capacity=64 load=0.375'),
              L('hint', 'reconstrói no sexto elemento (limite 2/3 de 8 = 5,33) e escolhe capacidade com no máximo metade de ocupação')] },
            { id: 'lapide', nome: 'Lápides', descricao: 'remover 10 chaves', tom: 'response', ms: 10, linhas: [
              L('out', 'deleted 10: live=14 tombstones=10'), L('out', 'after one insert: live=15 tombstones=10'),
              L('hint', 'o slot não volta a vazio: cortaria a cadeia de sondagem de outras chaves')] },
            { id: 'colide', nome: 'Hash constante', descricao: '300 chaves com o mesmo hash', tom: 'tls', ms: 300, linhas: [
              L('out', '300 distinct hashes: worst lookup inspects 1'), L('out', '300 equal hashes:    last key inspects    300'),
              L('hint', 'varredura linear de 300 passos')] }
          ],
          tutorDepois: 'Construir o dict com hash constante também é quadrático: dobrar n multiplica o tempo por ≈4 (medido: 4,40 ms com 500 chaves, 288,70 ms com 4.000, contra 0,01 e 0,05 ms com hashes distintos).',
          callout: 'Você viu a tabela crescer, as lápides segurarem a cadeia e o hash constante degradar o dict.' },
        { tipo: 'texto', html:
          '<h3>O contrato <code>__hash__</code> / <code>__eq__</code></h3>' +
          '<ol><li><code>a == b</code> implica <code>hash(a) == hash(b)</code>. A volta não vale: colisões são permitidas.</li>' +
          '<li>O hash <strong>não pode mudar</strong> enquanto o objeto estiver numa tabela. Por isso <code>list</code>, <code>dict</code> e <code>set</code> são não-hasheáveis e <code>tuple</code> só é hasheável se todos os componentes forem.</li>' +
          '<li>Definir <code>__eq__</code> sem <code>__hash__</code> numa classe torna a instância não-hasheável (<code>__hash__ = None</code> implícito), para você não quebrar a regra 1 sem querer. <code>@dataclass(frozen=True)</code> gera os dois de forma consistente.</li></ol>' +
          '<p>Mutar um campo que entra no hash perde o item: <code>p = Ponto(1, 2); d = {p: "a"}; p.x = 99; p in d</code> dá <code>False</code>, e a entrada continua ocupando memória. O lab tem os controles negativos <code>test_control_mutating_a_key_after_insertion_loses_it</code> e <code>test_control_same_hash_degrades_to_linear_probing_cost</code>.</p>' },
        { tipo: 'takeaway', html: 'Iguais têm o <mark>mesmo hash</mark> e o hash <mark>não muda</mark> com o objeto na tabela.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'ordene', id: 'b3-ordene', titulo: 'A comparação escalonada em cada slot', obrigatorio: false,
          enunciado: 'Ao inspecionar um slot ocupado, o dict do CPython tenta a comparação mais barata primeiro. Coloque os passos na ordem.',
          itens: [
            { id: 'c', texto: 'Chamar <code>__eq__</code> (pode ser caro ou ter efeitos colaterais)' },
            { id: 'a', texto: 'Comparar o hash armazenado com o hash da chave buscada (inteiros)' },
            { id: 'd', texto: 'Se não coincidir, seguir a recorrência de sondagem para o próximo slot' },
            { id: 'b', texto: 'Comparar identidade (<code>is</code>)' }
          ],
          solucao: ['a', 'b', 'c', 'd'], dica: 'Do mais barato ao mais caro, e só então o próximo slot.',
          callout: 'Hash, identidade, <code>__eq__</code>, próximo slot.' },
        { tipo: 'python', id: 'b3-python', titulo: 'Conserte a sondagem e a remoção', obrigatorio: false,
          enunciado: 'A <code>Tabela</code> abaixo usa endereçamento aberto de capacidade fixa. Dois defeitos marcados com <code>CORRIJA</code>: a sondagem é linear (ignora os bits altos) e <code>remover</code> deixa o slot vazio em vez de lápide.',
          codigo: codigo, testes: testes,
          dica: 'Sondagem: <code>perturb &gt;&gt;= 5</code> e depois <code>i = (i * 5 + perturb + 1) &amp; mascara</code>. Em <code>remover</code> grave <code>LAPIDE</code>.',
          solucao: solucao,
          tutorDepois: 'O teste "remover no meio da cadeia" é o controle negativo: com slot vazio, a chave seguinte some.',
          callout: 'A tabela achou todas as chaves em colisão total, mesmo após remover do meio.' },
        { tipo: 'escolha', id: 'b3-esc-hashconst', titulo: 'Hash constante',
          pergunta: 'Você define <code>def __hash__(self): return 1</code> numa classe com <code>__eq__</code> correto. O que acontece com um <code>set</code> de 100 mil desses objetos?',
          opcoes: [
            { id: 'a', texto: 'Funciona corretamente, porém lento: todos colidem e cada operação vira O(n).', correta: true, porque: 'o contrato só exige hash igual para objetos iguais. É também a base do hash flooding, mitigado com hash aleatorizado de strings.' },
            { id: 'b', texto: 'Levanta TypeError.', correta: false, porque: 'hash constante é válido.' },
            { id: 'c', texto: 'Perde elementos, pois iguais deixam de ser detectados.', correta: false, porque: 'a igualdade continua sendo checada por <code>__eq__</code>.' }
          ], tutorDepois: 'Correto e lento: os dois adjetivos importam.' },
        { tipo: 'takeaway', html: 'Lápide <mark>mantém a cadeia</mark>; hash constante transforma o dict em <mark>varredura linear</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Aplicações que valem reconhecer</h3>' +
          '<ul><li><strong>Contagem e agrupamento</strong>: <code>Counter</code>, <code>defaultdict(list)</code>. Um passe O(n) substitui um laço aninhado O(n²).</li>' +
          '<li><strong>Deduplicação</strong>: <code>set</code> de chaves normalizadas; sem caber em memória, hash do conteúdo (SHA-256) como chave de arquivo ou chunk.</li>' +
          '<li><strong>Memoização</strong>: <code>functools.cache</code>, com argumentos hasheáveis.</li>' +
          '<li><strong>Índice invertido</strong>: dict de termo para lista de documentos, núcleo da busca lexical (BM25) que complementa a vetorial (M07).</li>' +
          '<li><strong>Complemento em uma passada</strong>: "dois números somam o alvo?" em O(n) com dict dos valores já vistos (<code>two_sum_hash</code> do lab).</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o hash de str é aleatorizado por processo', html:
          '<p><code>PYTHONHASHSEED</code> defende contra HashDoS (chaves escolhidas para degradar o dict a O(n²)). Consequências: (1) nunca use <code>hash()</code> como identificador persistente ou entre processos (cache em disco, particionamento, chave em banco); use <code>hashlib</code>; (2) a ordem de iteração de um <code>set</code> de strings varia entre execuções, então teste que dependa dela é instável; (3) <code>hash(-1) == hash(-2) == -2</code> em CPython (o -1 sinaliza erro em C): o hash é detalhe de implementação.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: igualdade numérica atravessa tipos', html:
          '<p><code>1 == 1.0 == True</code>, e os hashes coincidem de propósito: <code>{1: "a", True: "b", 1.0: "c"}</code> tem <em>uma</em> chave (a primeira inserida, com o último valor). <code>float("nan") != float("nan")</code>, mas no dict a identidade vem primeiro: um <code>nan</code> reaproveitado é achado e dois <code>nan</code> distintos são chaves diferentes. Desconfie de float como chave.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Trade-off', html:
          '<p>Tabela hash vence na <em>igualdade exata</em>. Não ordena e não responde "menor chave maior que x" nem "tudo em [a, b]": para isso, árvore ou array ordenado com busca binária (blocos 4 e 5). O dict gasta bem mais memória que uma lista de pares; para milhões de pequenos registros, dataclasses com <code>slots=True</code>, tuplas nomeadas ou colunas em arrays reduzem muito.</p>' },
        { tipo: 'escolha', id: 'b3-esc-persist', titulo: 'Confira: o hash no banco',
          pergunta: 'Você grava <code>hash("usuario@exemplo.com")</code> no banco para localizar o registro depois. Qual o risco?',
          opcoes: [
            { id: 'a', texto: 'Nenhum: o hash de string é determinístico.', correta: false, porque: 'não é, por causa da semente por processo.' },
            { id: 'b', texto: 'O valor muda entre execuções (hash de str aleatorizado por processo); use SHA-256 via <code>hashlib</code> sobre bytes com codificação definida.', correta: true, porque: 'desde o Python 3.3 a semente é aleatória por processo.' },
            { id: 'c', texto: 'O hash é negativo e não cabe no banco.', correta: false, porque: 'não é o problema.' }
          ], tutorDepois: 'hash() serve só para dicts e sets dentro daquela execução.' },
        { tipo: 'escolha', id: 'b3-esc-pedido', titulo: 'Confira: a chave mutada',
          pergunta: 'Uma classe <code>Ponto</code> tem <code>__hash__</code> sobre (x, y). Depois de inserida num dict, alguém faz <code>p.x = 99</code>. O que acontece?',
          opcoes: [
            { id: 'a', texto: 'O dict se reorganiza sozinho e continua achando p.', correta: false, porque: 'o dict não reexecuta o hash das chaves guardadas.' },
            { id: 'b', texto: 'A busca por p procura no slot errado e devolve False; o item "sumiu" mas continua ocupando memória.', correta: true, porque: 'o hash mudou com o objeto na tabela, violando a regra 2 do contrato.' },
            { id: 'c', texto: 'Levanta RuntimeError na mutação.', correta: false, porque: 'Python não vigia a mutação.' }
          ], tutorDepois: 'Chave imutável (ou dataclass congelada) evita o problema por construção.' },
        { tipo: 'texto', html: '<p class="ta-nota">Saídas do laboratório (<code>algos.demo table</code>, <code>algos.bench</code>) de 11/10/2026, CPython 3.14.7. Layout do dict e fator de crescimento mudam entre versões menores; revalide em até 90 dias ou ao trocar o interpretador.</p>' },
        { tipo: 'takeaway', html: 'Hash dá <mark>igualdade exata</mark> em O(1) esperado; nunca <mark>persista hash()</mark> de str.' }
      ] }
    ]
  });
})();
