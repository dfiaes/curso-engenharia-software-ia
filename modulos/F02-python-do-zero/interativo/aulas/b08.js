/* F02 · Bloco 8: classes básicas e testes. Fonte: F02.html#b08. Saídas de execução real em 11/10/2026 (Python 3.14.7, pytest 9.1.1). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var J = function (a) { return a.join('\n') + '\n'; };

  TrilhaAula.registrar({
    id: 'f02-b8',
    titulo: 'Classes básicas e testes',
    minutos: 45,
    resumo: 'Uma classe agrupa dados e comportamento; um teste prova que o comportamento continua o mesmo. Dunders ligam a sintaxe ao seu objeto, dataclass elimina a repetição e pytest torna a prova barata.',
    objetivo: 'Explicar atributo de classe versus de instância e método ligado, usar dunders e dataclass (frozen, slots, default_factory), escrever testes pytest com parametrize, raises e fixtures, e julgar se um teste consegue falhar.',
    revisao: [
      { id: 'f02b8-eqhash', pergunta: 'Você define __eq__ numa classe e não define __hash__. O que acontece ao usar {obj} ou d[obj]?',
        opcoes: [
          opc('a', 'TypeError: unhashable type; o Python zera __hash__ ao definir __eq__ para não quebrar o contrato a == b implica hash(a) == hash(b)', true, 'defina __hash__ coerente (sobre campos imutáveis) ou use @dataclass(frozen=True).'),
          opc('b', 'Funciona, usando o id do objeto', false, 'valores iguais teriam hashes diferentes, quebrando set e dict.'),
          opc('c', 'Funciona, mas lento', false, 'o problema é de contrato, não de velocidade.')] },
      { id: 'f02b8-atributo', pergunta: 'Com class C: n = 0 e c = C(), o que valem c.n e C.n depois de c.n += 1?',
        opcoes: [
          opc('a', 'c.n == 1 e C.n == 0: nasce um atributo de instância que sombreia o da classe', true, 'a atribuição sempre cria ou atualiza na instância; uma lista na classe seria compartilhada por todas.'),
          opc('b', 'Os dois valem 1', false, 'o atributo da classe segue em 0.'),
          opc('c', 'Erro: n é somente leitura', false, 'não existe tal proteção.')] },
      { id: 'f02b8-dataclass', pergunta: 'O que @dataclass gera, e por que tags: list = [] é recusado?',
        opcoes: [
          opc('a', '__init__, __repr__ e __eq__ a partir dos campos anotados (e __hash__ se frozen); o default mutável compartilhado seria a armadilha do bloco 3 por instância, então exige field(default_factory=list)', true, 'a classe levanta ValueError: mutable default <class list> for field tags is not allowed.'),
          opc('b', 'Só __init__; o resto é manual', false, 'repr e eq também são gerados.'),
          opc('c', 'Valida tipos em execução e recusa list por isso', false, 'dataclass não valida tipos; a recusa é do default mutável.')] },
      { id: 'f02b8-teste', pergunta: 'Um agente entrega 20 testes verdes. Como descobrir se eles protegem alguma coisa?',
        opcoes: [
          opc('a', 'Estragar o código de propósito (mutação manual) e confirmar que o teste correspondente fica vermelho; exigir controle negativo e valores esperados escritos à mão', true, 'a pergunta de revisão é "esse teste falharia se o bug existisse?"; cobertura de 100% não responde isso.'),
          opc('b', 'Conferir que a cobertura está em 100%', false, 'linhas executadas sem asserção significativa valem zero.'),
          opc('c', 'Contar quantos testes existem', false, 'quantidade não mede proteção.')] },
      { id: 'f02b8-quatro', pergunta: 'Quais os quatro papéis que um conjunto de testes deve cobrir?',
        opcoes: [
          opc('a', 'Caminho feliz, borda, falha injetada e controle negativo', true, 'o controle negativo prova que o teste consegue falhar.'),
          opc('b', 'Unidade, integração, ponta a ponta e carga', false, 'esses são níveis da pirâmide, não papéis do teste.'),
          opc('c', 'Arrange, Act, Assert e Cleanup', false, 'essa é a estrutura de um teste, não a cobertura de papéis.')] }
    ],
    abas: [
      { rotulo: 'Classes e dunders', blocos: [
        { tipo: 'texto', html:
          '<h3>Dados com comportamento, e a prova de que continuam certos</h3>' +
          '<p>Uma classe agrupa dados e o comportamento que os acompanha; um teste automatizado prova, repetidamente e sem custo humano, que esse comportamento continua o mesmo. Juntos são o que torna possível mudar código sem medo, e o que faz um agente de código ser útil em vez de perigoso: sem testes, nem você nem ele sabem se a alteração quebrou algo. Este bloco cobre o mínimo sólido; princípios de design (herança versus composição, SOLID, padrões, TDD) são o S01.</p>' +
          '<h3>O que o <code>class</code> realmente faz</h3>' +
          '<p>Uma classe é um <strong>objeto</strong> (instância de <code>type</code>) criado pela execução do bloco <code>class</code>; chamá-la cria instâncias. Cada instância tem seu <code>__dict__</code> de atributos; a classe guarda o que é compartilhado. A busca de atributo vai da instância para a classe (e suas bases), e a <strong>atribuição sempre cria ou atualiza na instância</strong>:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'class Conta:\n    taxa = 0.1                 # atributo de CLASSE (compartilhado)\n    def __init__(self):\n        self.saldo = 0         # atributo de INSTÂNCIA\n\n>>> c1, c2 = Conta(), Conta(); c1.taxa = 0.5\n>>> Conta.taxa, c1.taxa, c2.taxa, c1.__dict__\n(0.1, 0.5, 0.1, {\'saldo\': 0, \'taxa\': 0.5})' },
        { tipo: 'texto', html:
          '<p>A atribuição <code>c1.taxa = 0.5</code> não mudou a classe: criou um atributo na instância que <em>sombreia</em> o da classe. Um <strong>método</strong> é uma função comum guardada na classe; o acesso por instância produz um <em>método ligado</em> (a instância vira o primeiro argumento, <code>self</code>, por convenção, não por palavra reservada): <code>type(Conta.__init__)</code> é <code>function</code>, <code>type(c1.__init__)</code> é <code>method</code>, e <code>c1.__init__.__self__ is c1</code>. Atenção ao problema do bloco 3 em forma de classe: um atributo de classe mutável (<code>itens = []</code> no corpo) é <strong>compartilhado por todas as instâncias</strong>. Estado por instância se cria no <code>__init__</code>.</p>' },
        { tipo: 'escolha', id: 'f02b8-esc-attr', titulo: 'Confira: o atributo que sombreia',
          pergunta: 'Dado class C: n = 0 e c = C(), o que valem c.n e C.n depois de c.n += 1?',
          opcoes: [
            { id: 'a', texto: 'c.n == 1 e C.n == 0: nasce um atributo de instância que sombreia o da classe', correta: true, porque: 'c.n += 1 lê c.n (achado na classe, 0), soma e atribui no objeto da instância. Uma lista na classe seria compartilhada: c.lista.append muta o objeto único da classe.' },
            { id: 'b', texto: 'Os dois valem 1', correta: false, porque: 'a atribuição vai para a instância, não para a classe.' },
            { id: 'c', texto: 'Os dois valem 0', correta: false, porque: 'a instância passa a ter n = 1.' },
            { id: 'd', texto: 'Erro: n é somente leitura', correta: false, porque: 'não há proteção; há sombreamento.' }
          ], tutorDepois: 'Atribuição cria na instância; a classe guarda só o que é compartilhado.' },
        { tipo: 'texto', html:
          '<h3>Métodos especiais (dunders): o protocolo de dados do Python</h3>' +
          '<p>Os métodos de nome <code>__x__</code> são os ganchos pelos quais a sintaxe da linguagem chama o seu objeto. Você não os chama; implementa-os, e o resto funciona.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Construção</th><th>Chama</th><th>Observação</th></tr></thead><tbody>' +
          '<tr><td><code>repr(x)</code>, depuração, REPL</td><td><code>__repr__</code></td><td>para o desenvolvedor, idealmente reconstruível</td></tr>' +
          '<tr><td><code>str(x)</code>, <code>print(x)</code></td><td><code>__str__</code> (cai em <code>__repr__</code>)</td><td>para o usuário</td></tr>' +
          '<tr><td><code>a == b</code></td><td><code>__eq__</code></td><td>padrão: identidade</td></tr>' +
          '<tr><td><code>hash(x)</code>, chave de <code>dict</code></td><td><code>__hash__</code></td><td>obrigatório coerente com <code>__eq__</code></td></tr>' +
          '<tr><td><code>len(x)</code>, <code>bool(x)</code></td><td><code>__len__</code>, <code>__bool__</code></td><td>sem <code>__bool__</code>, vazio (<code>len==0</code>) é falso</td></tr>' +
          '<tr><td><code>x[i]</code>, <code>for</code>, <code>in</code></td><td><code>__getitem__</code>, <code>__iter__</code>, <code>__contains__</code></td><td>só <code>__getitem__</code> já basta para iterar</td></tr>' +
          '<tr><td><code>with x</code></td><td><code>__enter__</code>/<code>__exit__</code></td><td>bloco 6</td></tr>' +
          '<tr><td><code>x(...)</code></td><td><code>__call__</code></td><td>objetos "função"</td></tr>' +
          '<tr><td><code>a &lt; b</code>, <code>a + b</code></td><td><code>__lt__</code>, <code>__add__</code></td><td>devolva <code>NotImplemented</code> para tipos desconhecidos</td></tr></tbody></table>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'class V:\n    def __init__(self, x): self.x = x\n    def __repr__(self): return f"V({self.x!r})"\n    def __eq__(self, o): return isinstance(o, V) and self.x == o.x\n\n>>> V(1) == V(1), V.__hash__\n(True, None)\n\nclass W:\n    def __init__(self, items): self.items = list(items)\n    def __len__(self): return len(self.items)\n    def __getitem__(self, i): return self.items[i]\n\n>>> w = W("abc"); len(w), w[1], list(w), "b" in w, bool(W([]))\n(3, \'b\', [\'a\', \'b\', \'c\'], True, False)' },
        { tipo: 'texto', html:
          '<p>Dois fatos aparecem nessa saída. <strong>Definir <code>__eq__</code> sem <code>__hash__</code> torna a classe não hashable</strong> (<code>__hash__</code> vira <code>None</code>), exatamente para impedir o par incoerente "iguais com hashes diferentes" do bloco 4. E a classe <code>W</code>, com só <code>__len__</code> e <code>__getitem__</code>, ganhou iteração, <code>in</code> e truthiness, porque o Python recorre a esses protocolos de fallback: é a <em>tipagem estrutural</em> em ação ("se anda como sequência..."), tema do <code>Protocol</code> no M02.</p>' },
        { tipo: 'takeaway', html: 'Atributo de instância <mark>sombreia</mark> o de classe; método é função <mark>ligada</mark> à instância; <code>__eq__</code> sem <code>__hash__</code> <mark>desliga o hash</mark>.' }
      ] },

      { rotulo: 'dataclass', blocos: [
        { tipo: 'texto', html:
          '<h3><code>dataclass</code>: classes de dados sem repetição</h3>' +
          '<p>Escrever <code>__init__</code>, <code>__repr__</code> e <code>__eq__</code> à mão para cada registro é repetitivo e fonte de desalinhamento (um campo novo, esquecido no <code>__eq__</code>). O decorador <code>@dataclass</code> gera esses métodos a partir dos <strong>campos anotados</strong> no corpo. Preveja o que acontece com cada definição do script.</p>' },
        { tipo: 'rode', id: 'f02b8-rode', titulo: 'O que o dataclass gera e o que recusa', enunciado: 'Rode o script e compare a classe comum, o dataclass comum, o default mutável e o <code>Expense</code> congelado do laboratório.',
          prefixo: '$', entrada: 'python dc.py', unidade: 'linha', terminalTitulo: 'terminal',
          etapas: [
            { id: 'fonte', nome: 'O script', descricao: 'dc.py', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'cat dc.py'),
              L('out', '@dataclass'), L('out', 'class P:'), L('out', '    x: int'), L('out', '    tags: list[str] = field(default_factory=list)'),
              L('out', '@dataclass'), L('out', 'class Q:'), L('out', '    tags: list = []'),
              L('out', '@dataclass(frozen=True, slots=True)'), L('out', 'class Expense: date; category; amount; description=""')] },
            { id: 'p', nome: 'P', descricao: 'repr, eq e hash', tom: 'tcp', ms: 2, linhas: [
              L('in', 'P(x=1, tags=[]) True None'),
              L('hint', 'repr e == gerados; __hash__ é None porque o dataclass tem eq e é mutável')] },
            { id: 'q', nome: 'Q', descricao: 'Default mutável', tom: 'tls', ms: 3, linhas: [
              L('in', 'ValueError: mutable default <class \'list\'> for field tags is not allowed: use default_factory'),
              L('hint', 'o mesmo mecanismo do bloco 3, recusado na definição da classe')] },
            { id: 'e', nome: 'Expense (frozen)', descricao: 'Imutável e hashable', tom: 'response', ms: 4, linhas: [
              L('out', "Expense(date=datetime.date(2026, 1, 5), category='x', amount=Decimal('1.00'), description='')"),
              L('in', "dataclasses.FrozenInstanceError: cannot assign to field 'amount'"),
              L('in', 'hash igual depois de replace: True'),
              L('hint', 'um Expense validado nunca "deriva" depois: quem o recebe confia nele')] }
          ],
          prever: { pergunta: 'O que o Python faz ao definir @dataclass class Q com tags: list = []?', opcoes: [
            { id: 'a', texto: 'Aceita, e todas as instâncias compartilham a mesma lista.', correta: false, porque: 'o dataclass recusa justamente para evitar a armadilha do default mutável.' },
            { id: 'b', texto: 'Levanta ValueError na definição da classe e exige field(default_factory=list).', correta: true, porque: 'o default seria compartilhado entre instâncias, como em def f(x, acc=[]).' },
            { id: 'c', texto: 'Aceita, mas converte o default em tupla.', correta: false, porque: 'nenhuma conversão silenciosa acontece.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Clique em "Q" para ver o erro.',
          tutorDepois: 'Opções que importam: frozen=True (atribuir levanta FrozenInstanceError e o __hash__ é gerado), slots=True (sem __dict__ por instância: menos memória e atributos novos proibidos, o que apanha erros de digitação), order=True (gera <, <= comparando campo a campo), kw_only=True (campos só por nome).',
          callout: 'Você viu o dataclass gerar o óbvio e recusar o default mutável.' },
        { tipo: 'texto', html:
          '<p><code>dataclasses.replace(obj, campo=novo)</code> cria uma cópia modificada: é como se "altera" um objeto imutável. Para validação ou campos derivados, <code>__post_init__</code> roda logo após o <code>__init__</code> gerado. Dataclass não valida tipos em execução (as anotações são metadados); para validação de fronteira há o Pydantic (M02). O modelo do laboratório usa o conjunto defensivo:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '@dataclass(frozen=True, slots=True)\nclass Expense:\n    """One validated expense. Frozen: instances are hashable and cannot drift."""\n    date: dt.date\n    category: str\n    amount: Decimal\n    description: str = ""' },
        { tipo: 'texto', html:
          '<p>É a transposição do princípio do bloco 6 (validar na borda) para a modelagem: <em>parse, don\'t validate</em>. A borda converte texto bruto em tipos de domínio e, daí em diante, o sistema trabalha com valores que já não podem ser inválidos. Alternativas: <code>NamedTuple</code>/<code>tuple</code> (leves, desempacotáveis), <code>dict</code> (sem contrato), classe comum (quando há invariantes e comportamento próprios).</p>' },
        { tipo: 'abas', rotulo: 'Manual contra gerado', itens: [
          { rotulo: 'Classe manual', blocos: [{ tipo: 'codigo', linguagem: 'python', texto: 'class Ponto:\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n    def __repr__(self):\n        return f"Ponto(x={self.x!r}, y={self.y!r})"\n    def __eq__(self, o):\n        return isinstance(o, Ponto) and (self.x, self.y) == (o.x, o.y)\n    # sem __hash__: definir __eq__ desliga o hash' }] },
          { rotulo: '@dataclass', blocos: [{ tipo: 'codigo', linguagem: 'python', texto: 'from dataclasses import dataclass\n\n@dataclass(frozen=True, slots=True)\nclass Ponto:\n    x: float\n    y: float\n# __init__, __repr__, __eq__ e __hash__ (por causa do frozen) vêm prontos' }] }
        ] },
        { tipo: 'python', id: 'f02b8-python', titulo: 'Modele um item imutável e validado', obrigatorio: false,
          enunciado: 'Complete <code>Item</code>: dataclass <strong>congelada e com slots</strong>, campos <code>nome</code>, <code>valor</code> (<code>Decimal</code>) e <code>tags</code> (tupla, padrão vazia). Em <code>__post_init__</code>, <code>valor &lt;= 0</code> levanta <code>ValueError</code>. <code>com_desconto(pct)</code> devolve <strong>outro</strong> item com o valor reduzido em <code>pct</code> por cento, arredondado a dois decimais (<code>dataclasses.replace</code>); o original não muda.',
          codigo: J([
            'from dataclasses import FrozenInstanceError, dataclass, replace',
            'from decimal import Decimal',
            '',
            '',
            '@dataclass  # 1. torne congelada e com slots',
            'class Item:',
            '    nome: str',
            '    valor: Decimal',
            '    tags: tuple = ()',
            '',
            '    def __post_init__(self):',
            '        # 2. valor <= 0 levanta ValueError',
            '        pass',
            '',
            '    def com_desconto(self, pct):',
            '        # 3. valor * (100 - pct) / 100, com 2 casas; devolva uma COPIA (replace)',
            '        return self',
            '',
            '',
            'print(Item("a", Decimal("10.00")).com_desconto(10))'
          ]),
          testes: J([
            'def test_desconto_devolve_nova_instancia():',
            '    i = Item("a", Decimal("10.00"))',
            '    n = i.com_desconto(10)',
            '    assert n.valor == Decimal("9.00") and n is not i',
            '    assert i.valor == Decimal("10.00")',
            '',
            '',
            'def test_e_imutavel():',
            '    i = Item("a", Decimal("1.00"))',
            '    try:',
            '        i.valor = Decimal("2.00")',
            '    except FrozenInstanceError:',
            '        return',
            '    raise AssertionError("esperava FrozenInstanceError")',
            '',
            '',
            'def test_e_hashable_e_igual_por_valor():',
            '    a = Item("a", Decimal("1.00"))',
            '    b = Item("a", Decimal("1.00"))',
            '    assert a == b and hash(a) == hash(b)',
            '    assert {a: 1}[b] == 1',
            '',
            '',
            'def test_valor_invalido_falha_na_construcao():',
            '    for ruim in (Decimal("0"), Decimal("-1.00")):',
            '        try:',
            '            Item("x", ruim)',
            '        except ValueError:',
            '            continue',
            '        raise AssertionError("esperava ValueError para " + str(ruim))',
            '',
            '',
            'def test_borda_desconto_zero_mantem_o_valor():',
            '    assert Item("a", Decimal("3.00")).com_desconto(0).valor == Decimal("3.00")',
            '',
            '',
            'def test_controle_negativo_default_mutavel_e_recusado():',
            '    try:',
            '        @dataclass',
            '        class Q:',
            '            tags: list = []',
            '    except ValueError:',
            '        return',
            '    raise AssertionError("esperava ValueError")'
          ]),
          dica: 'Use <code>@dataclass(frozen=True, slots=True)</code>. Em <code>com_desconto</code>: <code>novo = (self.valor * (Decimal(100) - Decimal(pct)) / Decimal(100)).quantize(Decimal("0.01"))</code> e <code>return replace(self, valor=novo)</code>.',
          solucao: J([
            'from dataclasses import FrozenInstanceError, dataclass, replace',
            'from decimal import Decimal',
            '',
            '',
            '@dataclass(frozen=True, slots=True)',
            'class Item:',
            '    nome: str',
            '    valor: Decimal',
            '    tags: tuple = ()',
            '',
            '    def __post_init__(self):',
            '        if self.valor <= 0:',
            '            raise ValueError(self.valor)',
            '',
            '    def com_desconto(self, pct):',
            '        novo = (self.valor * (Decimal(100) - Decimal(pct)) / Decimal(100)).quantize(Decimal("0.01"))',
            '        return replace(self, valor=novo)'
          ]),
          tutorDepois: 'O controle negativo confirma que a recusa do default mutável existe de verdade. Um Item validado na construção nunca deriva depois: quem o recebe confia nele.',
          callout: 'Congelar, validar na borda e "alterar" com replace.' },
        { tipo: 'takeaway', html: '<code>@dataclass</code> gera <code>__init__</code>/<code>__repr__</code>/<code>__eq__</code>; <mark>frozen</mark> e <mark>slots</mark> dão imutabilidade e economia; default mutável exige <mark>default_factory</mark>.' }
      ] },

      { rotulo: 'Testes com pytest', blocos: [
        { tipo: 'texto', html:
          '<h3>Testes com <code>pytest</code></h3>' +
          '<p>Um teste é uma função cujo nome começa com <code>test_</code> em um arquivo <code>test_*.py</code>; o <code>pytest</code> as descobre, executa e reporta. A ferramenta central é o <code>assert</code> simples: o <code>pytest</code> <em>reescreve</em> o AST dos testes para mostrar, na falha, os valores intermediários.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ python -m pytest -q test_x.py\n..FF..                                                                   [100%]\n___ test_soma[2-2-5] ___\na = 2, b = 2, esperado = 5\n>   def test_soma(a,b,esperado): assert a+b == esperado\nE   assert (2 + 2) == 5\n___ test_lista ___\n>   def test_lista(): assert [1,2,3] == [1,2,4]\nE   assert [1, 2, 3] == [1, 2, 4]\nE     At index 2 diff: 3 != 4\nFAILED test_x.py::test_soma[2-2-5] - assert (2 + 2) == 5\nFAILED test_x.py::test_lista - assert [1, 2, 3] == [1, 2, 4]\n2 failed, 4 passed in 0.01s' },
        { tipo: 'texto', html:
          '<p>Os quatro recursos que bastam para quase tudo:</p>' +
          '<ul><li><strong><code>pytest.mark.parametrize</code></strong>: o mesmo teste sobre uma tabela de casos; cada linha vira um teste independente com id próprio (<code>test_soma[2-2-5]</code>), então um caso vermelho não esconde os outros. No laboratório, <code>test_parse_amount_rejects_ambiguous_or_exotic_input</code> varre dez entradas (<code>""</code>, <code>"-5"</code>, <code>"1e3"</code>, <code>"NaN"</code>, <code>"1.234,50"</code>, <code>"٣٤"</code>...) com um corpo só.</li>' +
          '<li><strong><code>pytest.raises(Tipo, match="regex")</code></strong>: afirma que o código levanta; <code>as info</code> expõe a exceção para checar atributos (<code>info.value.line == 7</code>) e a causa (<code>__cause__</code>). Sem <code>raises</code>, um teste que "espera erro" passa quando nada falha.</li>' +
          '<li><strong>Fixtures</strong>: funções com <code>@pytest.fixture</code> que preparam (e, com <code>yield</code>, desmontam) o contexto; o teste as recebe <em>pelo nome do parâmetro</em>. As embutidas mais úteis: <code>tmp_path</code> (diretório temporário único por teste), <code>monkeypatch</code> (altera variável de ambiente, atributo ou <code>cwd</code> e desfaz sozinho), <code>capsys</code> (captura <code>stdout</code>/<code>stderr</code>). Fixtures compartilhadas vão em <code>conftest.py</code>; o escopo (<code>function</code> por padrão, <code>module</code>, <code>session</code>) controla o custo de montagem.</li>' +
          '<li><strong>Marcadores e configuração</strong>: <code>--strict-markers</code> e <code>--strict-config</code> (usados no <code>pyproject.toml</code> do lab) transformam marcador ou opção com typo em erro, em vez de ser ignorado.</li></ul>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '@pytest.fixture\ndef make_csv(tmp_path: Path) -> CsvFactory:\n    """Write a CSV file with the given data lines; encoding is explicit and overridable."""\n    def factory(*lines: str, name: str = "d.csv", encoding: str = "utf-8", header: str = HEADER) -> Path:\n        path = tmp_path / name\n        path.write_bytes((header + "".join(line + "\\n" for line in lines)).encode(encoding))\n        return path\n    return factory' },
        { tipo: 'texto', html:
          '<p>Esta fixture é uma <em>fábrica</em>: devolve uma função, de modo que cada teste gera o arquivo que quer, no encoding que quer (<code>make_csv("x,a,1.00,", encoding="latin-1")</code>), dentro do <code>tmp_path</code> que o <code>pytest</code> descarta depois. Os testes ficam curtos e à vista do cenário.</p>' },
        { tipo: 'complete', id: 'f02b8-complete', titulo: 'Afirme o erro, não só a ausência de sucesso', obrigatorio: false,
          enunciado: 'Complete o teste de que um valor inválido é recusado com o tipo certo e a mensagem certa.',
          linguagem: 'python',
          partes: [
            'import pytest\n\n@pytest.mark.',
            { lacuna: 'marca', opcoes: ['parametrize("texto", ["", "-5", "1e3", "NaN"])', 'skip("texto")', 'fixture("texto")'], correta: 0 },
            '\ndef test_valor_invalido_e_recusado(texto):\n    with pytest.',
            { lacuna: 'raises', opcoes: ['raises(InvalidRowError, match="valor inválido")', 'raises(Exception)', 'raises(BaseException)'], correta: 0 },
            ' as info:\n        parse_amount(7, texto)\n    assert info.value.line == 7\n'
          ],
          explicacao: 'parametrize gera um teste por entrada, e um caso vermelho não esconde os outros. raises com o tipo preciso e match falha se o código levanta outra coisa (um NameError no seu próprio teste, por exemplo); raises(Exception) passaria por motivo errado. as info expõe os atributos estruturados.' },
        { tipo: 'takeaway', html: '<code>assert</code> simples, <mark>parametrize</mark>, <mark>raises</mark> com tipo e <code>match</code>, e fixtures (<code>tmp_path</code>, <code>capsys</code>) cobrem quase tudo.' }
      ] },

      { rotulo: 'Bons testes e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>O que torna um teste bom</h3>' +
          '<ul><li><strong>Estrutura Arrange–Act–Assert</strong>: prepara, executa uma coisa, afirma. Um comportamento por teste; nome que diz o comportamento (<code>test_wrong_encoding_is_reported_not_garbled</code>), não a função.</li>' +
          '<li><strong>Cobrir quatro papéis</strong>: <em>caminho feliz</em> (funciona), <em>borda</em> (vazio, limite, Unicode), <em>falha injetada</em> (o recurso quebra no meio) e <em>controle negativo</em> (prova que o teste consegue falhar). Um teste que nunca falha não prova nada.</li>' +
          '<li><strong>Determinismo</strong>: nenhum teste depende de relógio, rede, ordem de execução, <code>set</code> ou diretório corrente. Datas e arquivos entram por parâmetro ou fixture.</li>' +
          '<li><strong>Isolamento</strong>: nada de estado global entre testes (bloco 7); <code>tmp_path</code> em vez de caminhos fixos.</li>' +
          '<li><strong>Testar comportamento observável</strong>, não o jeito de implementar: um teste acoplado a detalhes internos quebra a cada refatoração sem ter achado bug.</li>' +
          '<li><strong>Cobertura (%) é consequência, não objetivo</strong>: 100% de linhas executadas sem asserção significativa vale zero. A pergunta útil é "se eu estragar esta linha, algum teste fica vermelho?" (mutação, passo 6 do laboratório).</li></ul>' +
          '<p>Na pirâmide de testes, a maioria é de <strong>unidade</strong> (rápidos, isolados, como estes); poucos de <strong>integração</strong> (vários módulos, arquivo real, como os testes de CLI do lab); pouquíssimos <strong>ponta a ponta</strong>. A estratégia completa, com contrato, propriedade e testes de aceitação, fica no M02 e no M02A.</p>' +
          '<h3>Exemplo trabalhado: o teste da CLI como contrato</h3>' +
          '<p>A CLI é a única parte com interface externa: argumentos, <code>stdout</code>, <code>stderr</code> e exit code (F01). O teste a trata como caixa-preta:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'def test_cli_strict_stops_with_1_and_writes_no_json(make_csv, capsys, tmp_path):\n    path = make_csv("2026-01-05,a,1.00,", "xx,a,1.00,")\n    out = tmp_path / "r.json"\n    assert main(["report", str(path), "--json", str(out)]) == 1\n    assert "linha 3" in capsys.readouterr().err\n    assert not out.exists()' },
        { tipo: 'texto', html:
          '<p>Chama <code>main(argv)</code> como função (não precisa subprocesso, porque <code>main</code> recebe <code>argv</code> e <em>devolve</em> o código em vez de chamar <code>sys.exit</code>), afirma o exit code, afirma que o JSON <em>não</em> foi escrito no modo estrito e que a mensagem de erro, com o número da linha, foi para o <code>stderr</code>. Essa testabilidade foi decidida no bloco 1 (<code>raise SystemExit(main())</code> só no <code>__main__</code>); projetar para testar é, em grande parte, não esconder efeitos colaterais no corpo do módulo. A única exceção é o erro de uso, em que o <code>argparse</code> chama <code>sys.exit(2)</code> por conta própria; <code>test_cli_usage_error_exits_2_via_argparse</code> o captura com <code>pytest.raises(SystemExit)</code> e confere <code>info.value.code == 2</code>.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: teste que não pode falhar', html:
          '<p>Três formas comuns: (1) <code>assert</code> sobre tupla não vazia (<code>assert (x, "mensagem")</code> é sempre verdadeiro; o CPython avisa); (2) <code>pytest.raises</code> largo demais (<code>Exception</code>) que passa por causa de um <code>NameError</code> no seu próprio teste; (3) parametrização cujos ids ou valores são calculados a partir do código sob teste. A defesa é o hábito do <em>controle negativo</em> e da <em>mutação manual</em>: estrague de propósito o código de produção e confirme que o teste correspondente fica vermelho (passos 6 e 7 do laboratório). Um agente de código produz testes que passam com facilidade espantosa; a pergunta de revisão é sempre "esse teste falharia se o bug existisse?".</p>' },
        { tipo: 'transcript', id: 'f02b8-transcript', titulo: 'Os vinte testes verdes', obrigatorio: false,
          enunciado: 'Um agente entregou testes para a função arredondar_centavos e descreveu o que fez. Marque as linhas que indicam testes que não protegem nada.',
          linhas: [
            { quem: 'voce', texto: 'Escreva testes para arredondar_centavos(valor: str) -> Decimal.' },
            { quem: 'agente', texto: 'Adicionei 20 testes. Em todos, o valor esperado é calculado chamando arredondar_centavos de novo e comparando com o resultado.' },
            { quem: 'agente', texto: 'Para os erros usei pytest.raises(Exception), assim cobre qualquer falha.' },
            { quem: 'agente', texto: 'Parametrizei as entradas "", "-5", "1e3" e "NaN" com pytest.mark.parametrize e afirmei ValueError com match.' },
            { quem: 'agente', texto: 'Escrevi assert (resultado, "deve arredondar para cima").' },
            { quem: 'ferramenta', texto: 'pytest: 20 passed. Cobertura: 100%' },
            { quem: 'agente', texto: 'Mutação manual: troquei ROUND_HALF_UP por ROUND_DOWN e o teste de 2.665 ficou vermelho; revertido.' }
          ],
          erradas: [1, 2, 4],
          explicacao: {
            1: 'Valor esperado calculado pelo próprio código é tautologia: use valores escritos à mão (2.665 deve virar 2.67).',
            2: 'raises(Exception) passa por qualquer erro, inclusive um NameError no teste. Use o tipo preciso e match.',
            4: 'assert sobre tupla não vazia é sempre verdadeiro: o teste nunca falha, e o CPython avisa disso.'
          },
          callout: 'As linhas 3 e 6 mostram o hábito certo: parametrize com raises preciso e mutação manual.' },
        { tipo: 'texto', html:
          '<h3>Decisões e erros comuns</h3>' +
          '<ul><li><strong>Classe ou função?</strong> Sem estado compartilhado e sem várias operações sobre o mesmo dado: função. Dados puros: <code>dataclass</code>. Estado mais invariantes mais comportamento: classe.</li>' +
          '<li><strong><code>@dataclass</code> mutável com <code>__hash__</code> manual</strong> é perigoso: use <code>frozen=True</code> ou não use como chave.</li>' +
          '<li><strong>Atributo de classe mutável</strong> é compartilhado; <strong><code>__eq__</code> sem <code>__hash__</code></strong> (ou o inverso) quebra <code>set</code>/<code>dict</code>.</li>' +
          '<li><strong>Herança por reuso de código</strong> costuma ser má ideia; composição primeiro (S01).</li>' +
          '<li><strong>Teste que replica a implementação</strong> (calcula o esperado com o mesmo código) é tautologia: use valores esperados escritos à mão.</li>' +
          '<li><strong>Testes dependentes de ordem</strong> e de <code>print</code>: use <code>capsys</code> e asserções.</li></ul>' },
        { tipo: 'escolha', id: 'f02b8-esc-hash', titulo: 'Confira: eq sem hash',
          pergunta: 'Você define __eq__ numa classe e não define __hash__. O que acontece ao usar {obj} (um set) ou d[obj]?',
          opcoes: [
            { id: 'a', texto: 'Funciona, usando o id do objeto', correta: false, porque: 'dois objetos iguais por valor teriam hashes diferentes.' },
            { id: 'b', texto: 'Funciona, usando o hash dos atributos', correta: false, porque: 'o Python não deriva o hash dos atributos sozinho; o dataclass frozen o gera.' },
            { id: 'c', texto: 'Funciona, mas lento', correta: false, porque: 'não é questão de velocidade.' },
            { id: 'd', texto: 'TypeError: unhashable type; o Python zera __hash__ ao definir __eq__', correta: true, porque: 'para não quebrar o contrato a == b implica hash(a) == hash(b). Defina __hash__ coerente sobre campos imutáveis ou use @dataclass(frozen=True).' }
          ], tutorDepois: 'Igualdade por valor e hash caminham juntos.' },
        { tipo: 'escolha', id: 'f02b8-esc-teste', titulo: 'Confira: o teste que pode falhar',
          pergunta: 'Qual hábito mostra que um teste realmente protege o comportamento?',
          opcoes: [
            { id: 'a', texto: 'Cobertura de linhas em 100%', correta: false, porque: 'linhas executadas sem asserção significativa valem zero.' },
            { id: 'b', texto: 'Estragar o código de propósito (mutação manual) e ver o teste correspondente ficar vermelho, além de um controle negativo', correta: true, porque: 'a pergunta útil é "se eu estragar esta linha, algum teste fica vermelho?".' },
            { id: 'c', texto: 'Ter muitos testes parametrizados', correta: false, porque: 'parametrize multiplica casos; não prova que algum consegue falhar.' }
          ], tutorDepois: 'Um teste que nunca falha não prova nada.' },
        { tipo: 'texto', html: '<p class="ta-nota">Saídas de execução real em 11/10/2026 com Python 3.14.7 e pytest 9.1.1 (Linux). Os nomes de testes citados (test_bom_breaks_utf8_header_but_utf8_sig_reads_it, test_cli_strict_stops_with_1_and_writes_no_json e outros) pertencem ao laboratório guiado do F02, que tem 52 testes.</p>' },
        { tipo: 'takeaway', html: 'Cubra <mark>feliz, borda, falha injetada e controle negativo</mark>; cobertura é consequência; a pergunta de revisão é se o teste <mark>falharia</mark> com o bug.' }
      ] }
    ]
  });
})();
