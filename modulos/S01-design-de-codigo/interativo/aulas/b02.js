/* S01 · Bloco 2: Orientação a objetos em Python. Fonte: S01.html#b02. Saídas do exemplo b02_poo.py reproduzidas do módulo (execução real do lab em 11/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var CMD = 'uv run python src/design_lab/exemplos/b02_poo.py';

  TrilhaAula.registrar({
    id: 's01-b2',
    titulo: 'Orientação a objetos: composição, Protocol e MRO',
    minutos: 45,
    resumo: 'Herança é o acoplamento mais forte que a linguagem oferece. Composição quando o objetivo é reuso, Protocol para contratos do consumidor, ABC para gabaritos da sua hierarquia e o MRO para prever super().',
    objetivo: 'Escolher entre composição e herança, Protocol e ABC, e prever a ordem de super() lendo o MRO.',
    revisao: [
      { id: 's01b2-frag', pergunta: 'Por que uma subclasse que conta itens sobrescrevendo adicionar e adicionar_varios quebra quando a base é otimizada?',
        opcoes: [
          opc('a', 'Ela depende de qual método do pai chama qual, o que a interface pública não promete.', true, 'na V1 o total sai dobrado (6 para 3 itens); na V2, certo por acidente.'),
          opc('b', 'Porque Python não permite sobrescrever dois métodos.', false, 'permite; o problema é o acoplamento ao detalhe interno.'),
          opc('c', 'Porque a V2 mudou a assinatura pública.', false, 'a interface pública é a mesma: é esse o ponto da classe base frágil.')] },
      { id: 's01b2-protocol', pergunta: 'Qual a diferença de quando a conformidade é decidida em Protocol e em ABC?',
        opcoes: [
          opc('a', 'ABC: ao instanciar, por herança explícita. Protocol: estrutural, no verificador de tipos (mypy).', true, 'em runtime, @runtime_checkable só confere a presença dos nomes, não a assinatura.'),
          opc('b', 'Protocol falha ao instanciar; ABC só no mypy.', false, 'é o contrário.'),
          opc('c', 'Não há diferença prática.', false, 'quem define o contrato e quando o erro aparece são diferentes.')] },
      { id: 's01b2-super', pergunta: 'O que super() significa em herança múltipla?',
        opcoes: [
          opc('a', 'O próximo na MRO da instância, depois da classe atual.', true, 'por isso um elo que esquece de chamar super() corta o resto da cadeia, inclusive classes que ele nem conhece.'),
          opc('b', 'O pai direto da classe onde o método está escrito.', false, 'em Auditoria, o próximo é Cache, que não é pai dela.'),
          opc('c', 'A classe base raiz (object).', false, 'a raiz é o último elo da MRO, não o próximo.')] },
      { id: 's01b2-mangling', pergunta: 'O que faz self.__historico dentro de Conta?',
        opcoes: [
          opc('a', 'Vira self._Conta__historico: evita colisão com subclasses, não é privacidade.', true, 'a subclasse que atribui self.__historico cria um segundo atributo, _ContaPoupanca__historico.'),
          opc('b', 'Torna o atributo inacessível de fora.', false, 'qualquer um acessa pelo nome expandido.'),
          opc('c', 'Marca o atributo como somente leitura.', false, 'para leitura sem escrita use @property.')] },
      { id: 's01b2-quando', pergunta: 'Quando herdar é uma boa escolha?',
        opcoes: [
          opc('a', 'Substituibilidade total, pai projetado para extensão ou pai e filhos sob seu controle evoluindo juntos.', true, 'Exception, unittest.TestCase e ABC com método de gabarito são exemplos de pai projetado para isso.'),
          opc('b', 'Sempre que você quer reaproveitar código.', false, 'reuso sozinho pede composição.'),
          opc('c', 'Nunca: herança é sempre ruim.', false, 'a regra é contextual; o checkpoint reprova o "sempre".')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Em Python tudo é objeto, mas isso não obriga a modelar tudo como hierarquia de classes. O erro de design mais caro em orientação a objetos é a <strong>herança usada para reaproveitar código</strong>: ela cria o acoplamento mais forte que a linguagem oferece (a subclasse depende dos detalhes internos do pai) e só aparece quando alguém muda o pai. Este bloco dá o critério para escolher entre composição e herança, mostra o mecanismo que o Python usa para resolver métodos (MRO e <code>super()</code>) e compara as duas formas de declarar um contrato: Protocol (estrutural) e ABC (nominal).</p>' +
          '<h3>Composição vs herança: a classe base frágil</h3>' +
          '<p>Herança expressa "é um" e dá três coisas ao mesmo tempo: reuso de implementação, polimorfismo de subtipo e acoplamento ao pai. Quase sempre você quer só uma das duas primeiras. O problema da <strong>classe base frágil</strong> (<em>fragile base class</em>) é que mudanças compatíveis na interface pública do pai quebram subclasses, porque elas dependem de qual método chama qual. O lab reproduz o caso clássico (<code>exemplos/b02_poo.py</code>): uma coleção cuja <code>adicionar_varios</code> chama <code>adicionar</code>, e uma subclasse que conta itens sobrescrevendo os dois.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'class ColecaoV1:',
          '    def adicionar(self, x): self.itens.append(x)',
          '    def adicionar_varios(self, xs):',
          '        for x in xs:',
          '            self.adicionar(x)          # V1 chama adicionar',
          '',
          'class ColecaoV2:                        # mesmo comportamento público',
          '    def adicionar(self, x): self.itens.append(x)',
          '    def adicionar_varios(self, xs):',
          '        self.itens.extend(xs)          # V2 otimizou: não chama mais adicionar',
          '',
          'class ContadaPorHeranca(ColecaoVn):',
          '    def adicionar(self, x):',
          '        self.total += 1',
          '        super().adicionar(x)',
          '    def adicionar_varios(self, xs):',
          '        self.total += len(xs)           # conta aqui...',
          '        super().adicionar_varios(xs)    # ...e o pai V1 conta de novo via adicionar'].join('\n') },
        { tipo: 'texto', html:
          '<p>A subclasse estava errada desde o início (contava duas vezes) e o código "passava" em um dos pais por sorte. Nenhuma regra da interface pública diz "<code>adicionar_varios</code> chama <code>adicionar</code>": é detalhe de implementação, e a herança o torna parte do contrato. A versão por composição guarda a coleção como atributo e delega, dependendo só do que a interface promete:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'class ContadaPorComposicao:',
          '    def __init__(self, interna: Armazem) -> None:   # Armazem é um Protocol',
          '        self._interna = interna',
          '        self.total = 0',
          '    def adicionar(self, x: str) -> None:',
          '        self.total += 1',
          '        self._interna.adicionar(x)',
          '    def adicionar_varios(self, xs: Sequence[str]) -> None:',
          '        self.total += len(xs)',
          '        self._interna.adicionar_varios(xs)'].join('\n') },
        { tipo: 'texto', html:
          '<p>Funciona com qualquer implementação (V1, V2, uma que escreva em disco). O custo é o boilerplate de delegação e a perda do polimorfismo de subtipo nominal (a classe não "é uma" <code>Colecao</code>; ela satisfaz o Protocol). Em Python o segundo custo quase não existe.</p>' +
          '<p><strong>Quando herdar é bom:</strong> (1) a relação é "é um" no sentido de substituibilidade total (bloco 4, LSP); (2) o pai foi projetado para extensão e documenta o que as subclasses podem sobrescrever (<code>Exception</code>, <code>unittest.TestCase</code>, ABC com método de gabarito); (3) você controla pai e filhos e eles evoluem juntos. Fora disso, composição. A fórmula do <em>Design Patterns</em> (GoF, 1994) continua a mais útil: "prefira composição de objetos a herança de classe".</p>' },
        { tipo: 'takeaway', html: 'Herança é o <mark>acoplamento mais forte</mark>; reuso sozinho pede <mark>composição</mark>, e subtipo exige substituibilidade total.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'b2-rode', titulo: 'Rode a base frágil e a MRO', enunciado: 'Rode o exemplo do lab e leia cada etapa: a contagem em três variantes, a MRO do losango, o elo que esquece de chamar <code>super()</code> e a hierarquia que o C3 recusa. Saídas reproduzidas do módulo (execução real em 11/10/2026).',
          prefixo: '$', entrada: CMD, unidade: 'itens', terminalTitulo: 'b02_poo',
          etapas: [
            { id: 'contagem', nome: 'Contagem de itens', descricao: 'Herança em V1 e V2, composição', tom: 'dns', ms: 6, linhas: [
              L('cmd', CMD),
              L('out', 'ContadaPorHerancaV1 6 3      # total=6 para 3 itens: contagem dobrada'),
              L('out', 'ContadaPorHerancaV2 3 3      # certo, mas por acidente'),
              L('out', 'comp 3 3                     # composição: certo nas duas versões')] },
            { id: 'mro', nome: 'MRO do losango', descricao: 'Servico(Auditoria, Cache), ambos sobre Base', tom: 'tcp', ms: 5, linhas: [
              L('out', "['Servico', 'Auditoria', 'Cache', 'Base', 'object']          # MRO de Servico"),
              L('out', "['Servico', 'Auditoria', 'Cache', 'Base']                    # Servico().passos(): a cadeia inteira"),
              L('hint', 'em Auditoria, o próximo é Cache, que não é pai dela')] },
            { id: 'quebrado', nome: 'Elo sem super()', descricao: 'Quebrado não chama super()', tom: 'request', ms: 3, linhas: [
              L('out', "['ServicoComEloQuebrado', 'Auditoria', 'Quebrado', 'Cache', 'Base', 'object']"),
              L('out', "['ServicoComEloQuebrado', 'Auditoria', 'Quebrado']           # Cache e Base não rodam"),
              L('hint', 'um único elo que esquece super() silencia tudo que vem depois na MRO')] },
            { id: 'c3', nome: 'C3 recusa', descricao: 'class X(Base, Auditoria)', tom: 'response', ms: 1, linhas: [
              L('out', 'Cannot create a consistent method resolution order (MRO) for bases Base, Auditoria'),
              L('hint', 'X(Base, Auditoria) exige Base antes de Auditoria, mas Auditoria herda de Base')] }
          ],
          prever: { pergunta: 'No losango, Servico().passos() chama super() em cada elo. Quais classes aparecem na cadeia e em que ordem?', opcoes: [
            { id: 'a', texto: 'Servico, Auditoria, Cache, Base: a MRO inteira, uma vez cada.', correta: true, porque: 'super() segue a MRO da instância (C3), então Base roda uma só vez, depois dos dois pais.' },
            { id: 'b', texto: 'Servico, Auditoria, Base: super() vai ao pai direto de cada classe.', correta: false, porque: 'super() é o próximo na MRO, não o pai: Cache entra entre Auditoria e Base.' },
            { id: 'c', texto: 'Servico, Auditoria, Base, Cache, Base: cada pai chama a base.', correta: false, porque: 'C3 linearizou a hierarquia: cada classe aparece uma só vez.' }
          ] },
          tutorAntes: 'Aperte Enter e abra as etapas na ordem: contagem, MRO, elo sem super() e C3.',
          tutorDepois: 'Regras que mantêm a herança múltipla sob controle: só para mixins pequenos sem estado próprio; todo método cooperativo chama <code>super()</code>; aceite <code>*args, **kwargs</code> no <code>__init__</code> cooperativo; inspecione <code>Classe.__mro__</code> quando duvidar. Se precisa desenhar o MRO para entender o código, considere composição.',
          callout: 'Você viu a contagem dobrada, a MRO e o elo que corta a cadeia.' },
        { tipo: 'texto', html:
          '<h3>MRO e super()</h3>' +
          '<p>Em herança múltipla, o Python calcula uma única ordem linear de busca por classe, o <strong>MRO</strong> (<em>method resolution order</em>), com o algoritmo <strong>C3</strong>: cada classe aparece antes de seus pais e a ordem declarada das bases é preservada. <code>super()</code> não significa "meu pai": significa "o próximo na MRO da instância, depois de mim". Esse detalhe permite a herança cooperativa (mixins) e é a fonte de surpresa. No losango, <code>Servico</code> herda de <code>Auditoria</code> e <code>Cache</code>, ambos herdam de <code>Base</code>; o MRO é <code>Servico &rarr; Auditoria &rarr; Cache &rarr; Base &rarr; object</code>.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          '<p><strong>Mixin que depende da ordem das bases.</strong> <code>class A(MixinCache, MixinAuditoria, Base)</code> e <code>class B(MixinAuditoria, MixinCache, Base)</code> se comportam de forma diferente quando os mixins interceptam o mesmo método; o erro não é de sintaxe nem de tipo. Teste a ordem que você publica e documente-a. Segunda armadilha: <code>super().__init__()</code> omitido em um mixin, que deixa o atributo de outro mixin sem inicializar apenas em certas combinações.</p>' },
        { tipo: 'takeaway', html: '<mark>super()</mark> segue a MRO da instância; um elo sem <code>super()</code> <mark>corta o resto da cadeia</mark> sem aviso.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b2-python', titulo: 'Troque a herança por composição', obrigatorio: false,
          enunciado: 'Implemente <code>ContadaPorComposicao</code> sobre uma coleção interna: <code>adicionar</code> conta 1 e delega; <code>adicionar_varios</code> conta <code>len(xs)</code> e delega <em>uma vez</em>. O total tem de sair certo com a V1 (que chama <code>adicionar</code> por dentro), com a V2 e com um espião que registra as chamadas. Um teste de controle negativo mostra a herança dobrando a contagem.',
          codigo: [
      "class ColecaoV1:",
      "    def __init__(self):",
      "        self.itens = []",
      "",
      "    def adicionar(self, x):",
      "        self.itens.append(x)",
      "",
      "    def adicionar_varios(self, xs):",
      "        for x in xs:",
      "            self.adicionar(x)  # V1 chama adicionar",
      "",
      "",
      "class ColecaoV2:",
      "    def __init__(self):",
      "        self.itens = []",
      "",
      "    def adicionar(self, x):",
      "        self.itens.append(x)",
      "",
      "    def adicionar_varios(self, xs):",
      "        self.itens.extend(xs)  # V2 otimizou: não chama adicionar",
      "",
      "",
      "class ContadaPorComposicao:",
      "    def __init__(self, interna):",
      "        self._interna = interna",
      "        self.total = 0",
      "",
      "    def adicionar(self, x):",
      "        # conte 1 item e delegue à coleção interna",
      "        ...",
      "",
      "    def adicionar_varios(self, xs):",
      "        # conte len(xs) e delegue UMA vez a adicionar_varios da interna",
      "        # (cuidado: xs pode ser um gerador)",
      "        ...",
      "",
      "",
      "c = ContadaPorComposicao(ColecaoV1())",
      "c.adicionar_varios([\"a\", \"b\", \"c\"])",
      "print(c.total, c._interna.itens)"
    ].join('\n'),
          testes: [
      "class Espiao:",
      "    \"\"\"Coleção que registra as chamadas e não chama adicionar dentro de adicionar_varios.\"\"\"",
      "",
      "    def __init__(self):",
      "        self.itens = []",
      "        self.chamadas = []",
      "",
      "    def adicionar(self, x):",
      "        self.chamadas.append(\"adicionar\")",
      "        self.itens.append(x)",
      "",
      "    def adicionar_varios(self, xs):",
      "        self.chamadas.append(\"adicionar_varios\")",
      "        self.itens.extend(xs)",
      "",
      "",
      "def test_total_certo_nas_duas_versoes_da_base():",
      "    for Base in (ColecaoV1, ColecaoV2):",
      "        c = ContadaPorComposicao(Base())",
      "        c.adicionar_varios([\"a\", \"b\", \"c\"])",
      "        assert c.total == 3",
      "        assert c._interna.itens == [\"a\", \"b\", \"c\"]",
      "",
      "",
      "def test_adicionar_um_item():",
      "    c = ContadaPorComposicao(ColecaoV2())",
      "    c.adicionar(\"x\")",
      "    assert c.total == 1 and c._interna.itens == [\"x\"]",
      "",
      "",
      "def test_so_usa_a_interface_publica_e_delega_uma_vez():",
      "    esp = Espiao()",
      "    c = ContadaPorComposicao(esp)",
      "    c.adicionar_varios([\"a\", \"b\"])",
      "    assert esp.chamadas == [\"adicionar_varios\"]",
      "    assert c.total == 2",
      "",
      "",
      "def test_borda_lista_vazia_e_gerador():",
      "    c = ContadaPorComposicao(ColecaoV1())",
      "    c.adicionar_varios([])",
      "    assert c.total == 0",
      "    c.adicionar_varios(x for x in \"ab\")",
      "    assert c.total == 2 and c._interna.itens == [\"a\", \"b\"]",
      "",
      "",
      "def test_controle_negativo_a_heranca_dobra_a_contagem_em_v1():",
      "    class ContadaPorHeranca(ColecaoV1):",
      "        total = 0",
      "",
      "        def adicionar(self, x):",
      "            self.total += 1",
      "            super().adicionar(x)",
      "",
      "        def adicionar_varios(self, xs):",
      "            self.total += len(xs)",
      "            super().adicionar_varios(xs)",
      "",
      "    h = ContadaPorHeranca()",
      "    h.adicionar_varios([\"a\", \"b\", \"c\"])",
      "    assert h.total == 6"
    ].join('\n'),
          dica: 'Conte antes de delegar. Para <code>adicionar_varios</code>, transforme <code>xs</code> em lista primeiro: um gerador só pode ser lido uma vez, e <code>len()</code> não existe nele.',
          solucao: [
      "class ColecaoV1:",
      "    def __init__(self):",
      "        self.itens = []",
      "",
      "    def adicionar(self, x):",
      "        self.itens.append(x)",
      "",
      "    def adicionar_varios(self, xs):",
      "        for x in xs:",
      "            self.adicionar(x)  # V1 chama adicionar",
      "",
      "",
      "class ColecaoV2:",
      "    def __init__(self):",
      "        self.itens = []",
      "",
      "    def adicionar(self, x):",
      "        self.itens.append(x)",
      "",
      "    def adicionar_varios(self, xs):",
      "        self.itens.extend(xs)  # V2 otimizou: não chama adicionar",
      "",
      "",
      "class ContadaPorComposicao:",
      "    def __init__(self, interna):",
      "        self._interna = interna",
      "        self.total = 0",
      "",
      "    def adicionar(self, x):",
      "        self.total += 1",
      "        self._interna.adicionar(x)",
      "",
      "    def adicionar_varios(self, xs):",
      "        xs = list(xs)  # um gerador só pode ser lido uma vez",
      "        self.total += len(xs)",
      "        self._interna.adicionar_varios(xs)"
    ].join('\n'),
          tutorDepois: 'A composição só usa a interface pública da coleção. O teste do espião prova isso: o wrapper faz uma chamada a <code>adicionar_varios</code> e nenhuma a <code>adicionar</code>, e o total continua certo.',
          callout: 'A composição ficou certa nas duas versões da base, sem depender de como o pai se chama por dentro.' },
        { tipo: 'cenario', id: 'b2-cenario', titulo: 'CacheRedis herda de ClienteHttp?', obrigatorio: false,
          enunciado: 'O time quer <code>class CacheRedis(ClienteHttp)</code> só para reaproveitar o método <code>get()</code>. Decida e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A relação "um cache <em>é um</em> cliente HTTP" não é verdade em nenhum sentido de substituibilidade, e o <code>ClienteHttp</code> pertence a outro time. O que você propõe?', opcoes: [
              { texto: 'Herdar e sobrescrever <code>get()</code>: é o menor diff.', vai: 'f-frag', tom: 'ruim', consequencia: 'a subclasse passa a depender de qual método do cliente chama qual.' },
              { texto: 'Guardar o cliente como atributo, delegar e declarar a porta que o cache precisa num Protocol.', vai: 'f-bom', tom: 'ok', consequencia: 'o cache depende só da interface pública do cliente e aceita outro cliente em teste.' },
              { texto: 'Copiar o código de <code>get()</code> para o cache.', vai: 'f-copia', tom: 'ruim', consequencia: 'tira o acoplamento, mas duplica a lógica e perde correções futuras.' }
            ] }
          },
          finais: {
            'f-frag': { bom: false, texto: 'Quando o <code>ClienteHttp</code> mudar (por exemplo, <code>get()</code> passar a chamar um novo método interno, ou ganhar retry por dentro), o cache muda de comportamento sem que a interface pública tenha mudado: a classe base frágil. Volte e escolha composição.' },
            'f-copia': { bom: false, texto: 'Sem herança não há acoplamento, mas a cópia não recebe as correções do cliente. Delegar a um objeto injetado dá o reuso sem a duplicação.' },
            'f-bom': { bom: true, texto: 'Composição com Protocol. A exceção legítima seria um pai projetado para extensão (como <code>Exception</code>) ou hierarquia sob seu controle em que a substituibilidade vale. Aqui nenhuma das duas vale.' }
          } },
        { tipo: 'texto', html:
          '<h3>Polimorfismo, duck typing e Protocol vs ABC</h3>' +
          '<p>Polimorfismo é tratar objetos diferentes pela mesma interface. Python o resolve em tempo de execução por <strong>duck typing</strong>: o chamador usa <code>obj.enviar(...)</code> e funciona com qualquer objeto que tenha <code>enviar</code>, sem herança comum. O custo é que o erro só aparece na chamada. Por isso a prática moderna combina duck typing com <strong>tipagem estrutural</strong> verificada em análise: o <code>Protocol</code> descreve a forma esperada e o mypy checa. Em execução nada muda; o ganho é feedback antes do deploy.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th></th><th>ABC (nominal)</th><th>Protocol (estrutural)</th></tr></thead><tbody>' +
          '<tr><td>Quem se conforma</td><td>Quem herda explicitamente (ou é registrado com <code>register</code>)</td><td>Qualquer classe com os membros certos, sem importar o contrato</td></tr>' +
          '<tr><td>Implementação incompleta</td><td>Falha em execução, ao instanciar</td><td>No verificador de tipos; em execução só com <code>isinstance</code> e <code>@runtime_checkable</code></td></tr>' +
          '<tr><td>Código compartilhado</td><td>Pode ter métodos concretos (template method)</td><td>Só a forma; métodos com corpo viram herança disfarçada</td></tr>' +
          '<tr><td>Quando usar</td><td>Você é dono da hierarquia e quer reuso de gabarito e erro cedo</td><td>O contrato pertence ao consumidor; as implementações vêm de fora (bibliotecas, adapters)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O lab mostra os dois comportamentos de execução. Com ABC, a subclasse incompleta nem instancia: <code>Can\'t instantiate abstract class IncompletoABC without an implementation for abstract method \'enviar\'</code>. Já <code>@runtime_checkable</code> num Protocol faz o <code>isinstance</code> verificar apenas a presença dos nomes, não a assinatura: a classe <code>AssinaturaErrada</code>, cujo <code>enviar</code> não aceita argumentos, devolve <code>True</code> em <code>isinstance(AssinaturaErrada(), NotificadorProtocol)</code>. O mypy a recusaria na análise estática, o <code>isinstance</code> não. Moral: <code>runtime_checkable</code> serve para despacho grosseiro, nunca como validação de contrato. O curso adota <strong>Protocol</strong> para portas definidas pelo consumidor (o serviço declara o que precisa de um repositório; adapters satisfazem sem importar o serviço) e <strong>ABC</strong> quando há gabarito compartilhado e a hierarquia é sua.</p>' +
          '<h3>Encapsulamento por convenção</h3>' +
          '<p>Python não tem <code>private</code>. <code>_atributo</code> diz "interno, não dependa". <code>__atributo</code> (dois sublinhados, sem sublinhado final) dispara <em>name mangling</em>: dentro de <code>Conta</code>, <code>self.__historico</code> vira <code>self._Conta__historico</code>. Evita colisão acidental com subclasses; não é segurança. No lab, a subclasse atribuiu <code>self.__historico = [-1]</code> achando que sobrescrevia o do pai e criou um segundo atributo: <code>sorted(vars(cp))</code> mostra <code>[\'_ContaPoupanca__historico\', \'_Conta__historico\', \'_saldo\']</code>. Use <code>__x</code> só quando a colisão com subclasses for risco real (bibliotecas feitas para herdar); no resto, <code>_x</code> e <code>@property</code> para expor leitura sem permitir escrita.</p>' },
        { tipo: 'takeaway', html: '<mark>Protocol</mark> é contrato do consumidor, verificado no mypy; <mark>ABC</mark> é gabarito da sua hierarquia, verificado ao instanciar.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b2-esc-reuso', titulo: 'Reusar o código de uma classe existente',
          pergunta: 'Reusar o código de uma classe existente é o único motivo para criar a nova classe. Qual relação costuma ser mais segura?',
          opcoes: [
            { id: 'a', texto: 'Herança, porque é o acoplamento mais fraco entre classes.', correta: false, porque: 'é o mais forte: a subclasse depende de detalhes internos da base.' },
            { id: 'b', texto: 'Herança múltipla, para reaproveitar o máximo possível.', correta: false, porque: 'acrescenta a dependência da ordem do MRO.' },
            { id: 'c', texto: 'Composição: guardar a classe como atributo e delegar. Herança só se o novo tipo puder substituir o antigo em todo lugar.', correta: true, porque: 'a composição expõe só o que você escolhe delegar e permite trocar a peça depois.' },
            { id: 'd', texto: 'Copiar e colar o código para não criar dependência.', correta: false, porque: 'duplica a lógica e perde as correções futuras.' }
          ] },
        { tipo: 'escolha', id: 'b2-esc-mro', titulo: 'Elo sem super() no losango',
          pergunta: 'Em <code>class D(B, C)</code>, com B e C herdando de A, o <code>B.__init__</code> não chama <code>super().__init__()</code>. O que acontece com C e A ao criar um D?',
          opcoes: [
            { id: 'a', texto: 'Rodam normalmente, porque o Python chama todos os pais automaticamente.', correta: false, porque: 'o Python não chama pais por conta própria; quem encadeia é super().' },
            { id: 'b', texto: 'Seus <code>__init__</code> não rodam: a cadeia da MRO (D, B, C, A) é cortada no elo que não chama super().', correta: true, porque: 'um elo que não coopera interrompe o resto da cadeia sem aviso.' },
            { id: 'c', texto: 'O Python levanta TypeError ao definir a classe.', correta: false, porque: 'a hierarquia é linearizável; o erro de definição só ocorre quando o C3 falha.' },
            { id: 'd', texto: 'Só o A.__init__ roda, porque é a raiz.', correta: false, porque: 'a raiz também fica depois do elo cortado.' }
          ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Trade-offs', html:
          '<p>Composição custa delegação explícita e mais objetos para montar (o bloco 5 trata de injeção); herança custa acoplamento. Protocol troca a garantia em execução por flexibilidade e exige rodar o verificador de tipos no CI. <code>dataclass</code> não altera nada disso: é uma forma de escrever classes de dados, e <code>frozen=True</code> as torna imutáveis (bloco 3). Para interfaces de uma só operação, uma função (<code>Callable</code>) é o contrato mais leve de todos.</p>' },
        { tipo: 'takeaway', html: '<mark>__x</mark> é name mangling para evitar colisão, não privacidade; <code>runtime_checkable</code> só <mark>confere nomes</mark>.' }
      ] }
    ]
  });
})();
