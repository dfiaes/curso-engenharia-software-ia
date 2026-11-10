/* S01 · Bloco 5: Padrões que valem em Python. Fonte: S01.html#b05 (exemplos/b05_padroes.py e pacote pedidos/). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 's01-b5',
    titulo: 'Padrões que valem em Python e o que a linguagem dispensa',
    minutos: 50,
    resumo: 'Padrões de projeto são vocabulário. Em Python, boa parte vira uma função, um dicionário ou um decorador: strategy, factory, adapter, decorator, observer, repository e injeção por construtor, e o que a linguagem dispensa.',
    objetivo: 'Usar strategy, factory, adapter, decorator, observer, repository e injeção por construtor sabendo o que o Python já dá de graça.',
    revisao: [
      { id: 's01b5-strategy', pergunta: 'Por que um dicionário de funções frequentemente substitui o Strategy em Python, e quando uma classe ainda vale?',
        opcoes: [
          opc('a', 'Funções são objetos de primeira classe; a classe volta quando a estratégia carrega estado ou configuração.', true, 'a tabela regional com base e preço por kg extra é uma dataclass imutável de um método.'),
          opc('b', 'Python não permite classes abstratas.', false, 'permite (ABC); o ponto é a cerimônia sem ganho.'),
          opc('c', 'Dicionários são mais rápidos que classes.', false, 'o argumento é de simplicidade, não de desempenho.')] },
      { id: 's01b5-decorator', pergunta: 'Em @a @b def f(), em que ordem os decoradores são aplicados e executados?',
        opcoes: [
          opc('a', 'Aplicados de baixo para cima (f = a(b(f))); na chamada, o wrapper de a roda primeiro.', true, 'para retry e cache, a ordem decide o comportamento.'),
          opc('b', 'Aplicados de cima para baixo: primeiro a, depois b.', false, 'é o contrário.'),
          opc('c', 'Em ordem alfabética.', false, 'a ordem é a da escrita.')] },
      { id: 's01b5-observer', pergunta: 'Qual é o ponto delicado do observer e como o barramento do lab o resolve?',
        opcoes: [
          opc('a', 'A falha de um assinante: o barramento isola cada assinante com try/except e registra em falhas.', true, 'sem isso, uma exceção interrompe o laço, os seguintes nunca são avisados e o publicador herda um erro que não é dele.'),
          opc('b', 'A velocidade de notificação.', false, 'o barramento é síncrono; o risco é de contrato, não de velocidade.'),
          opc('c', 'O número máximo de assinantes.', false, 'não é um limite do padrão.')] },
      { id: 's01b5-repo', pergunta: 'O que torna um fake em memória confiável como repositório nos testes?',
        opcoes: [
          opc('a', 'Um teste de contrato parametrizado que roda contra o fake e contra o adapter real (SQLite).', true, 'ida-e-volta, inexistente (None), id duplicado (PedidoJaExiste) e listagem ordenada.'),
          opc('b', 'Ser escrito pelo mesmo autor do adapter.', false, 'sem contrato executável o fake é uma hipótese.'),
          opc('c', 'Usar Mock() no lugar dele.', false, 'o Mock aceita qualquer atributo.')] },
      { id: 's01b5-di', pergunta: 'Qual é a relação entre DIP, injeção por construtor e composition root?',
        opcoes: [
          opc('a', 'DIP define quem é dono da interface; a injeção por construtor é a técnica; o composition root é o lugar que escolhe e monta as classes concretas.', true, 'em Python uma função montar_* explícita costuma bastar; o container vale quando o grafo é grande.'),
          opc('b', 'São três nomes para a mesma coisa.', false, 'o checkpoint reprova confundir DIP com injeção.'),
          opc('c', 'DI exige um container.', false, 'Python quase nunca precisa de um.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Padrões de projeto são <strong>vocabulário</strong>: nomes para soluções recorrentes que permitem dizer "isto é um adapter" em vez de explicar dez linhas. O catálogo GoF (1994) foi escrito para linguagens onde funções não são valores e não há tipagem estrutural; muitos padrões ali compensam limites de C++ e Smalltalk-80. Em Python, boa parte vira uma função, um dicionário ou um decorador. O que fica é a intenção. Este bloco cobre sete que aparecem todo dia, na forma que o Python favorece, e fecha com o que a linguagem dispensa.</p>' +
          '<h3>Strategy: variar o algoritmo atrás de uma interface</h3>' +
          '<p>Problema: um passo do algoritmo muda conforme o contexto (ordenação, tabela de frete, cálculo de taxa) e você não quer um <code>if</code> espalhado. Se a estratégia não tem estado, ela é uma função, e o "contexto" recebe um <code>Callable</code>:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'type Ordenacao = Callable[[str], Any]',
          'ESTRATEGIAS: dict[str, Ordenacao] = {"alfabetica": str.lower, "tamanho": len}',
          '',
          'def ordenar(nomes: Sequence[str], estrategia: str) -> list[str]:',
          '    return sorted(nomes, key=ESTRATEGIAS[estrategia])'].join('\n') },
        { tipo: 'texto', html:
          '<p>Quando a estratégia tem configuração, a classe pequena e imutável volta a valer. É o que o frete do lab faz: a política é um Protocol de um método e a tabela regional é uma dataclass com base e preço por quilo extra.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'class PoliticaFrete(Protocol):',
          '    def calcular(self, peso_g: int) -> Centavos: ...',
          '',
          '@dataclass(frozen=True, slots=True)',
          'class TabelaRegional:',
          '    base: Centavos',
          '    por_kg_extra: Centavos',
          '    def calcular(self, peso_g: int) -> Centavos:',
          '        kgs = (peso_g + 999) // 1000',
          '        extra = (kgs - 1) * self.por_kg_extra if kgs > 1 else 0',
          '        return self.base + extra',
          '',
          'TABELAS: Mapping[Regiao, PoliticaFrete] = MappingProxyType({',
          '    Regiao.SUDESTE: TabelaRegional(base=1500, por_kg_extra=500),',
          '    Regiao.SUL:     TabelaRegional(base=2000, por_kg_extra=700),',
          '    Regiao.OUTRAS:  TabelaRegional(base=3000, por_kg_extra=1200),',
          '})'].join('\n') },
        { tipo: 'texto', html:
          '<p>O ganho aparece no teste: <code>calcular_frete(..., tabelas=...)</code> aceita outra tabela, e o lab troca uma região por um stub de uma linha para provar a regra de isenção sem depender de números de tarifa. Evite a hierarquia <code>EstrategiaBase</code> + três subclasses para três funções de uma linha.</p>' +
          '<h3>Factory: criar sem o chamador conhecer a classe</h3>' +
          '<p>Em Python há três formas, em ordem crescente de cerimônia: um construtor alternativo (<code>@classmethod</code>), um registro (dicionário nome para criador) e, raramente, uma classe fábrica. O construtor alternativo é o mais comum e o mais subestimado:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '@dataclass(frozen=True, slots=True)',
          'class Periodo:',
          '    inicio: int',
          '    fim: int',
          '    @classmethod',
          '    def de_texto(cls, texto: str) -> Periodo:',
          '        a, _, b = texto.partition("-")',
          '        return cls(int(a), int(b))        # Periodo.de_texto("2024-2026")',
          '',
          '@formatador("csv")',
          'def _csv(dados): return "\\n".join(f"{k},{v}" for k, v in dados.items())',
          '',
          'def criar_formatador(nome: str) -> Formatador:',
          '    try:',
          '        return _FORMATADORES[nome]',
          '    except KeyError:',
          '        raise ValueError(f"formato desconhecido: {nome} (disponíveis: {sorted(_FORMATADORES)})") from None'].join('\n') },
        { tipo: 'texto', html:
          '<p>O registro com decorador permite plugar formatadores sem editar o módulo central, com mensagem de erro que lista os disponíveis. As classes são objetos: <code>tipo = Notificador; tipo()</code> já é uma fábrica. Uma <em>Abstract Factory</em> (família de objetos que combinam) quase nunca se justifica em Python.</p>' +
          '<h3>Adapter: traduzir uma interface que você não controla</h3>' +
          '<p>Uma biblioteca ou serviço externo fala um vocabulário que você não quer espalhar no seu domínio (<code>cobrar_centavos(cartao, cents)</code> devolvendo <code>{"status": "OK"}</code>). O adapter é uma classe pequena que implementa a porta do seu domínio e traduz:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'class Pagamentos(Protocol):',
          '    def pagar(self, cartao: str, valor: int) -> bool: ...',
          '',
          'class AdaptadorGateway:',
          '    def __init__(self, gateway: GatewayLegado) -> None:',
          '        self._gateway = gateway',
          '    def pagar(self, cartao: str, valor: int) -> bool:',
          '        return self._gateway.cobrar_centavos(cartao, valor)["status"] == "OK"'].join('\n') },
        { tipo: 'texto', html:
          '<p>É onde moram as traduções feias (strings mágicas, códigos de erro, unidades) e onde você converte falhas externas em exceções do domínio. O lab usa a ideia nas duas direções: <code>pedidos/compat.py</code> aceita o formato antigo (dicionários) e chama o núcleo tipado, e <code>RepositorioSqlite</code> adapta o <code>sqlite3</code> à porta <code>RepositorioPedidos</code>, convertendo <code>sqlite3.IntegrityError</code> em <code>PedidoJaExiste</code>. Em escala de sistema, portas e adapters são tema do M02A.</p>' },
        { tipo: 'takeaway', html: 'Strategy é uma <mark>função</mark> (sem estado) ou uma <mark>dataclass pequena</mark> (com configuração); factory é <code>classmethod</code> ou dicionário de criadores; o adapter é onde moram as <mark>traduções feias</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Decorator: dois sentidos, não os confunda</h3>' +
          '<p>O padrão <strong>Decorator</strong> envolve um objeto com outro da mesma interface para acrescentar comportamento (cache, log, retry, métricas). A sintaxe <code>@decorador</code> do Python aplica uma função a outra função na definição. Os dois se encontram, mas são diferentes.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'class ComCache:                          # padrão: mesma interface, envolve outro objeto',
          '    def __init__(self, interna: Leitura) -> None:',
          '        self._interna = interna',
          '        self._cache: dict[str, int] = {}',
          '    def obter(self, chave: str) -> int:',
          '        if chave not in self._cache:',
          '            self._cache[chave] = self._interna.obter(chave)',
          '        return self._cache[chave]',
          '',
          'def repetir(tentativas, excecoes):          # sintaxe: decorador com parâmetros',
          '    def decorador[**P, R](f: Callable[P, R]) -> Callable[P, R]:',
          '        @wraps(f)',
          '        def interna(*args: P.args, **kwargs: P.kwargs) -> R:',
          '            for tentativa in range(1, tentativas + 1):',
          '                try:',
          '                    return f(*args, **kwargs)',
          '                except excecoes:',
          '                    if tentativa == tentativas:',
          '                        raise',
          '            raise AssertionError("inalcançável")',
          '        return interna',
          '    return decorador'].join('\n') },
        { tipo: 'texto', html:
          '<p>Dois detalhes. <code>ParamSpec</code> (<code>**P</code>) preserva a assinatura para o verificador de tipos, e <code>wraps</code> preserva <code>__name__</code> e <code>__doc__</code>. E a ordem de aplicação: decoradores empilhados são aplicados de baixo para cima e executam de fora para dentro.</p>' },
        { tipo: 'rode', id: 'b5-rode', titulo: 'Empilhe dois decoradores', enunciado: 'Cada decorador do lab registra quando é aplicado e quando executa. Rode e compare as duas listas. Resultado reproduzido do módulo (execução real do lab em 11/10/2026).',
          prefixo: 'Prompt', entrada: 'base()', unidade: 'chamadas', terminalTitulo: 'sessão Python',
          etapas: [
            { id: 'definicao', nome: 'Definição', descricao: '@a sobre @b sobre def base', tom: 'dns', ms: 1, linhas: [
              L('info', '@a\n@b\ndef base(): return "base"'),
              L('out', "['b aplicado', 'a aplicado', 'a(b(base))']"),
              L('hint', 'b envolve base primeiro; depois a envolve o resultado')] }
          ],
          prever: { pergunta: 'Com @a acima de @b acima de def base(), qual decorador é aplicado primeiro?', opcoes: [
            { id: 'a', texto: 'O de cima, a, e depois b.', correta: false, porque: 'a aplicação vai de baixo para cima.' },
            { id: 'b', texto: 'O de baixo, b: base = a(b(base)).', correta: true, porque: 'b envolve a função primeiro, a envolve o resultado; na chamada, o wrapper de a roda antes.' },
            { id: 'c', texto: 'Em ordem alfabética.', correta: false, porque: 'a ordem é a posição na definição.' }
          ] },
          tutorAntes: 'Aperte Enter e leia a lista: aplicado de baixo para cima, executado de fora para dentro.',
          tutorDepois: 'Para retry e cache, a ordem decide o comportamento: com <code>@cache</code> por fora, uma falha após as tentativas não é guardada e o sucesso é; com <code>@repetir</code> por fora, cada tentativa passa pelo cache. E decorar com retry um efeito não idempotente (cobrar cartão) é bug de design: retry exige idempotência (M02A, blocos de falha parcial).',
          callout: 'Você viu a ordem de aplicação: de baixo para cima.' },
        { tipo: 'texto', html:
          '<h3>Observer: notificar sem acoplar</h3>' +
          '<p>Um assunto avisa interessados quando algo acontece, sem conhecê-los. Em Python o assinante é um <code>Callable</code> e o "assunto" é uma lista de funções. O ponto delicado é a <strong>falha de um assinante</strong>: se uma exceção interrompe o laço, os seguintes nunca são avisados, e o publicador herda um erro que não é dele.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '@dataclass',
          'class Barramento:',
          '    _assinantes: dict[str, list[Assinante]] = field(default_factory=dict)',
          '    falhas: list[str] = field(default_factory=list)',
          '    def assinar(self, evento: str, assinante: Assinante) -> None:',
          '        self._assinantes.setdefault(evento, []).append(assinante)',
          '    def publicar(self, evento: str, carga: object) -> None:',
          '        for assinante in self._assinantes.get(evento, []):',
          '            try:',
          '                assinante(evento, carga)',
          '            except Exception as erro:',
          '                self.falhas.append(f"{evento}: {erro!r}")',
          '                logging.getLogger(__name__).exception("assinante falhou")'].join('\n') },
        { tipo: 'texto', html:
          '<p>Decisões embutidas, para documentar: isolamento de falha por assinante, ordem de notificação = ordem de assinatura, execução síncrona. Se o assinante precisa sobreviver a quedas ou rodar depois, deixa de ser observer e vira mensageria (fila, outbox), assunto do módulo de sistemas distribuídos. No serviço do lab, os ouvintes recebem o registro <em>depois</em> de gravar; um teste prova que a falha de um ouvinte deixa o pedido gravado, e outro prova que a falha do repositório impede qualquer notificação.</p>' },
        { tipo: 'takeaway', html: '<code>@decorador</code> aplica-se <mark>de baixo para cima</mark>; observer precisa de <mark>política explícita</mark> para falha de assinante.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b5-python', titulo: 'Isole a falha do assinante', obrigatorio: false,
          enunciado: 'Complete <code>publicar</code> no <code>Barramento</code>: cada assinante roda dentro de <code>try/except Exception</code>; a falha vai para <code>falhas</code> no formato <code>f"{evento}: {erro!r}"</code>; os assinantes seguintes ainda recebem o evento; e a exceção não sobe ao publicador.',
          codigo: [
      "from dataclasses import dataclass, field",
      "",
      "",
      "@dataclass",
      "class Barramento:",
      "    _assinantes: dict = field(default_factory=dict)",
      "    falhas: list = field(default_factory=list)",
      "",
      "    def assinar(self, evento, assinante):",
      "        self._assinantes.setdefault(evento, []).append(assinante)",
      "",
      "    def publicar(self, evento, carga):",
      "        for assinante in self._assinantes.get(evento, []):",
      "            # lacuna: a falha de um assinante não pode impedir os seguintes",
      "            # nem subir para o publicador; registre em self.falhas como",
      "            # f\"{evento}: {erro!r}\"",
      "            assinante(evento, carga)",
      "",
      "",
      "b = Barramento()",
      "b.assinar(\"pedido.fechado\", lambda e, c: print(\"recebi\", c))",
      "b.publicar(\"pedido.fechado\", \"p1\")"
    ].join('\n'),
          testes: [
      "def test_notifica_na_ordem_de_assinatura():",
      "    vistos = []",
      "    b = Barramento()",
      "    b.assinar(\"e\", lambda ev, c: vistos.append((\"a\", c)))",
      "    b.assinar(\"e\", lambda ev, c: vistos.append((\"b\", c)))",
      "    b.publicar(\"e\", 1)",
      "    assert vistos == [(\"a\", 1), (\"b\", 1)]",
      "",
      "",
      "def test_falha_de_um_assinante_nao_impede_os_seguintes():",
      "    vistos = []",
      "",
      "    def quebra(ev, c):",
      "        raise RuntimeError(\"boom\")",
      "",
      "    b = Barramento()",
      "    b.assinar(\"pedido.fechado\", quebra)",
      "    b.assinar(\"pedido.fechado\", lambda ev, c: vistos.append(c))",
      "    b.publicar(\"pedido.fechado\", \"p1\")",
      "    assert vistos == [\"p1\"]",
      "",
      "",
      "def test_falha_fica_registrada_e_nao_sobe_ao_publicador():",
      "    def quebra(ev, c):",
      "        raise RuntimeError(\"boom\")",
      "",
      "    b = Barramento()",
      "    b.assinar(\"pedido.fechado\", quebra)",
      "    b.publicar(\"pedido.fechado\", \"p1\")",
      "    assert b.falhas == [\"pedido.fechado: RuntimeError('boom')\"]",
      "",
      "",
      "def test_evento_sem_assinante_e_eventos_isolados():",
      "    vistos = []",
      "    b = Barramento()",
      "    b.publicar(\"nada\", 0)",
      "    b.assinar(\"x\", lambda ev, c: vistos.append(c))",
      "    b.publicar(\"y\", 9)",
      "    assert vistos == [] and b.falhas == []",
      "",
      "",
      "def test_sem_falha_nao_registra_nada():",
      "    b = Barramento()",
      "    b.assinar(\"e\", lambda ev, c: None)",
      "    b.publicar(\"e\", 1)",
      "    assert b.falhas == []"
    ].join('\n'),
          dica: 'Envolva a chamada <code>assinante(evento, carga)</code> em <code>try</code> e capture <code>Exception as erro</code>; no <code>except</code>, <code>self.falhas.append(f"{evento}: {erro!r}")</code>. Não use <code>raise</code> nem <code>break</code>.',
          solucao: [
      "from dataclasses import dataclass, field",
      "",
      "",
      "@dataclass",
      "class Barramento:",
      "    _assinantes: dict = field(default_factory=dict)",
      "    falhas: list = field(default_factory=list)",
      "",
      "    def assinar(self, evento, assinante):",
      "        self._assinantes.setdefault(evento, []).append(assinante)",
      "",
      "    def publicar(self, evento, carga):",
      "        for assinante in self._assinantes.get(evento, []):",
      "            try:",
      "                assinante(evento, carga)",
      "            except Exception as erro:",
      "                self.falhas.append(f\"{evento}: {erro!r}\")"
    ].join('\n'),
          tutorDepois: 'O teste sem falha importa tanto quanto o com falha: o barramento não pode inventar registros. Em produção, junte o <code>logging.exception</code> do módulo para o diagnóstico.',
          callout: 'O publicador não herda o erro de ninguém, e os assinantes seguintes são avisados.' },
        { tipo: 'texto', html:
          '<h3>Repository: a coleção de agregados atrás de uma porta</h3>' +
          '<p>O <strong>repository</strong> apresenta o armazenamento como uma coleção de objetos de domínio (<code>salvar</code>, <code>obter</code>, <code>listar_do_dia</code>), escondendo SQL, tabelas e drivers. Duas implementações no lab, ambas verificadas pelo mesmo teste de contrato parametrizado: um fake em memória e um adapter SQLite.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'class RepositorioPedidos(Protocol):',
          '    def salvar(self, registro: PedidoCalculado) -> None: ...',
          '    def obter(self, pedido_id: str) -> PedidoCalculado | None: ...',
          '    def listar_do_dia(self, dia: date) -> list[PedidoCalculado]: ...'].join('\n') },
        { tipo: 'texto', html:
          '<p>O contrato inclui o que não está na assinatura: <code>salvar</code> com id repetido lança <code>PedidoJaExiste</code>; <code>obter</code> de id inexistente devolve <code>None</code>; <code>listar_do_dia</code> ordena por id. Se o fake e o adapter real passam nos mesmos quatro testes de contrato, o fake é confiável em todos os outros testes: o serviço é testado em milissegundos, e a lacuna entre fake e banco real é coberta pelo contrato (bloco 7).</p>' +
          '<h3>Injeção por construtor e composition root</h3>' +
          '<p>A técnica: um objeto recebe suas dependências no <code>__init__</code> em vez de criá-las ou buscá-las em global. É o DIP posto em prática. O lugar onde as classes concretas são escolhidas e montadas é o <strong>composition root</strong>, perto do ponto de entrada.</p>' },
        { tipo: 'complete', id: 'b5-complete', titulo: 'Monte o composition root', linguagem: 'python', obrigatorio: false,
          enunciado: 'Escolha, em cada lacuna, a peça que deixa a regra de negócio sem nenhuma importação da biblioteca de pagamento.',
          partes: [
            'class Cobranca:\n    def __init__(self, pagamentos: ', { lacuna: 'tipo', opcoes: ['Pagamentos', 'GatewayLegado', 'AdaptadorGateway'], correta: 'Pagamentos' },
            ') -> None:\n        self._pagamentos = pagamentos\n\n\ndef montar_cobranca() -> Cobranca:\n    """The only place that knows the concrete classes."""\n    return Cobranca(', { lacuna: 'concreto', opcoes: ['AdaptadorGateway(GatewayLegado())', 'GatewayLegado()', 'Pagamentos()'], correta: 'AdaptadorGateway(GatewayLegado())' },
            ')\n'
          ],
          explicacao: 'A classe de domínio recebe a <em>porta</em> (<code>Pagamentos</code>, um Protocol) e não conhece o gateway. Só o composition root sabe que a porta é satisfeita por <code>AdaptadorGateway(GatewayLegado())</code>. O serviço de pedidos do lab tem três dependências injetadas (repositório, relógio, ouvintes); nos testes, o relógio é uma classe de uma linha que devolve uma data fixa. Uma função <code>montar_*</code> explícita é mais legível que um container, é verificada pelo mypy e os erros aparecem na importação. Containers (e <code>FastAPI.Depends</code>, uma forma de DI por parâmetro) valem quando o grafo é grande e o ciclo de vida das instâncias precisa ser gerenciado; o M03 retoma isso.',
          callout: 'Composition root montado: o domínio só conhece a porta.' },
        { tipo: 'texto', largo: true, html:
          '<h3>O que o Python dispensa</h3>' +
          '<table><thead><tr><th>Padrão clássico</th><th>Em Python</th></tr></thead><tbody>' +
          '<tr><td>Singleton</td><td>Um módulo é um singleton (importado uma vez). Singleton com classe é estado global com cerimônia; prefira injeção.</td></tr>' +
          '<tr><td>Iterator</td><td><code>__iter__</code>/<code>__next__</code>, geradores com <code>yield</code>.</td></tr>' +
          '<tr><td>Command</td><td>Uma função (ou <code>partial</code>); classe só se precisa de undo ou serialização.</td></tr>' +
          '<tr><td>Template Method</td><td>Passe a função como argumento; herança só em hierarquias projetadas para isso.</td></tr>' +
          '<tr><td>Visitor</td><td><code>match</code> estrutural ou <code>singledispatch</code>.</td></tr>' +
          '<tr><td>Builder</td><td>Argumentos nomeados, valores padrão e <code>dataclasses.replace</code>.</td></tr>' +
          '<tr><td>Abstract Factory</td><td>Raramente; um módulo ou dicionário de criadores serve.</td></tr>' +
          '<tr><td>Prototype</td><td><code>copy.copy</code>/<code>deepcopy</code>, <code>replace</code>.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: '<mark>DI por construtor</mark> com <mark>composition root explícito</mark>; o Python raramente pede container.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b5-esc-ordem', titulo: 'Ordem dos decoradores',
          pergunta: 'Com <code>@a</code> acima de <code>@b</code> acima de <code>def f()</code>, em que ordem os decoradores são aplicados?',
          opcoes: [
            { id: 'a', texto: 'De cima para baixo: primeiro a, depois b.', correta: false, porque: 'é o contrário.' },
            { id: 'b', texto: 'De baixo para cima: <code>f = a(b(f))</code>. Primeiro b envolve f, depois a envolve o resultado; na chamada, o wrapper de a roda primeiro.', correta: true, porque: 'confundir isso gera bugs sutis (por exemplo, cache fora de autenticação ou o contrário). A aplicação sobe; a execução do wrapper desce de fora para dentro.' },
            { id: 'c', texto: 'Em ordem alfabética dos nomes.', correta: false, porque: 'a ordem é a posição.' },
            { id: 'd', texto: 'Em paralelo, sem ordem definida.', correta: false, porque: 'a ordem é determinística.' }
          ] },
        { tipo: 'escolha', id: 'b5-esc-strategy', titulo: 'Trocar o desconto em tempo de execução',
          pergunta: 'Você precisa trocar o algoritmo de desconto em tempo de execução, sem estado interno. Qual é a implementação mais idiomática em Python?',
          opcoes: [
            { id: 'a', texto: 'Uma hierarquia com classe abstrata, uma subclasse por algoritmo e uma fábrica.', correta: false, porque: 'cerimônia sem ganho para funções de uma linha.' },
            { id: 'b', texto: 'Um Singleton para guardar o algoritmo atual.', correta: false, porque: 'estado global com cerimônia.' },
            { id: 'c', texto: 'Herança múltipla combinando todos os descontos.', correta: false, porque: 'acrescenta a dependência do MRO.' },
            { id: 'd', texto: 'Uma função (ou um dict de funções): o Strategy sem estado é só um callable.', correta: true, porque: 'use classe quando houver configuração ou estado (uma dataclass pequena).' }
          ] },
        { tipo: 'escolha', id: 'b5-esc-frete', titulo: 'Confira a tabela regional',
          pergunta: 'Com <code>TabelaRegional(base=1500, por_kg_extra=500)</code> (Sudeste), quanto custa <code>calcular(2500)</code>, para 2500 g?',
          opcoes: [
            { id: 'a', texto: '2000: 1500 + 1 kg extra.', correta: false, porque: '2500 g arredondam para cima: (2500 + 999) // 1000 = 3 kg.' },
            { id: 'b', texto: '2500: 3 kg arredondados, 2 kg extras: 1500 + 2 × 500.', correta: true, porque: 'kgs = 3, extra = (3 - 1) × 500 = 1000, total 1500 + 1000.' },
            { id: 'c', texto: '3000: 1500 + 3 × 500.', correta: false, porque: 'o primeiro quilo está incluído na base.' }
          ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          '<p><strong>Padrão como meta, não como remédio.</strong> O código com <code>NotificadorFactory</code>, <code>NotificadorStrategy</code>, <code>NotificadorObserver</code> e um <code>NotificadorBuilder</code> para enviar um e-mail é a falha típica de quem decorou o catálogo. Um padrão entra quando há duas variantes reais ou um teste que o exige. Segunda armadilha: observer com estado compartilhado, em que a ordem dos assinantes passa a ser parte do comportamento sem documentação; e registro global preenchido por <em>import</em>, que funciona na sua máquina e falha no processo em que o módulo não foi importado.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Trade-offs', html:
          '<p>Cada indireção custa um salto na leitura e um nome a mais; paga-se com variação real ou testabilidade real. Fake mais teste de contrato dá mais trabalho inicial que um Mock, e compensa porque o contrato fica escrito e executável. DI manual cresce linearmente com o grafo; passada a casa das dezenas de dependências, avalie um container, não antes.</p>' },
        { tipo: 'takeaway', html: 'Um padrão entra com <mark>duas variantes reais</mark> ou com <mark>um teste que o exige</mark>.' }
      ] }
    ]
  });
})();
