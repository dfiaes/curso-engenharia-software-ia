/* S01 · Bloco 4: SOLID com critério. Fonte: S01.html#b04 (exemplos/b04_solid.py do lab). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 's01-b4',
    titulo: 'SOLID com critério: violação, correção e custo',
    minutos: 45,
    resumo: 'Cinco heurísticas lidas como sintomas e remédios, não como mandamentos. Para cada letra: a violação concreta, a correção em Python e o ponto em que a correção custa mais do que rende.',
    objetivo: 'Aplicar SOLID apontando a violação concreta e o custo da correção, inclusive recusando a correção.',
    revisao: [
      { id: 's01b4-srp', pergunta: 'Qual é a formulação útil do SRP, e como você confirma a violação?',
        opcoes: [
          opc('a', 'Um motivo para mudar, isto é, um único ator; o histórico do Git mostra commits com motivos diferentes.', true, 'dividir sem atores distintos produz dezenas de classes de um método.'),
          opc('b', 'Uma classe faz uma coisa só, com um método.', false, 'é a leitura que gera a explosão de classes.'),
          opc('c', 'Um arquivo por classe.', false, 'organização de arquivos não é o princípio.')] },
      { id: 's01b4-ocp', pergunta: 'Qual é o remédio idiomático para um if/elif sobre tipo que cresce a cada requisito, e quando ele não compensa?',
        opcoes: [
          opc('a', 'Tabela de despacho (dicionário de funções); com três variantes estáveis a cadeia é mais fácil de ler.', true, 'o registro por import ainda cria dependência de ordem de import e esconde a ordem das regras.'),
          opc('b', 'Uma hierarquia de classes com uma subclasse por tipo.', false, 'cerimônia sem ganho quando a variante é uma função.'),
          opc('c', 'Mover o if para outro arquivo.', false, 'não muda o fato de editar código existente a cada variante.')] },
      { id: 's01b4-lsp', pergunta: 'Uma subclasse lança ValueError para valores acima de 1000 onde a base aceitava qualquer valor. Quais são as duas saídas?',
        opcoes: [
          opc('a', 'Tornar a recusa parte do contrato da base (retorno str | Recusado) ou deixar de ser subtipo (composição).', true, 'o mypy não acusa: as assinaturas são iguais; o contrato quebrado é semântico.'),
          opc('b', 'Capturar ValueError em todo chamador.', false, 'espalha o conhecimento da subclasse por todo o código cliente.'),
          opc('c', 'Trocar ValueError por AssertionError.', false, 'a pré-condição continua mais forte que a da base.')] },
      { id: 's01b4-dip', pergunta: 'No DIP, quem é dono da interface que o caso de uso consome?',
        opcoes: [
          opc('a', 'A política (alto nível), no vocabulário do domínio; o adapter se adapta a ela.', true, 'DIP é sobre quem define a interface; injeção de dependência é a técnica.'),
          opc('b', 'A biblioteca de baixo nível.', false, 'o domínio passaria a importar a biblioteca.'),
          opc('c', 'Um módulo utils compartilhado.', false, 'sem dono, sem direção de dependência.')] },
      { id: 's01b4-precaucao', pergunta: 'Qual é a pergunta de revisão para SOLID aplicado "por precaução"?',
        opcoes: [
          opc('a', 'Qual mudança concreta, que já aconteceu ou está no roadmap, esta abstração torna barata?', true, '"Talvez um dia" não conta: abstraia na segunda ou terceira variante, com testes.'),
          opc('b', 'Esta classe tem uma interface?', false, 'a existência de interface não é o critério.'),
          opc('c', 'Quantas linhas tem a classe?', false, 'tamanho não responde à pergunta de custo e benefício.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p><strong>SOLID</strong> (Robert C. Martin, nos anos 2000) é um conjunto de cinco heurísticas sobre acoplamento e mudança. Lidas como sintomas e remédios ("este código muda por dois motivos; separe"), são úteis. Lidas como mandamentos ("toda classe precisa de uma interface"), são nocivas. Em Python, três delas ficam muito mais baratas porque a linguagem tem funções de primeira classe e tipagem estrutural. Para cada letra: uma violação concreta, a correção e o ponto em que a correção custa mais do que rende (código em <code>exemplos/b04_solid.py</code>).</p>' +
          '<h3>S · Responsabilidade única: um motivo para mudar</h3>' +
          '<p>A formulação útil de Martin não é "faz uma coisa", é "tem um motivo para mudar": serve a um único <strong>ator</strong> (quem pede a mudança). A classe abaixo calcula, formata e grava; três atores diferentes (financeiro, produto, infraestrutura) podem forçá-la a mudar, e cada mudança arrisca as outras duas.</p>' },
        { tipo: 'abas', rotulo: 'Versão', itens: [
          { rotulo: 'Tudo junto', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: [
              'class RelatorioTudoJunto:',
              '    def gerar(self, destino: Path) -> str:',
              '        total = sum(v.valor for v in self.vendas)                       # regra de negócio',
              '        texto = "\\n".join(f"{v.produto}: {v.valor / 100:.2f}" ...)       # apresentação',
              '        texto += f"\\nTOTAL: {total / 100:.2f}"',
              '        destino.write_text(texto, encoding="utf-8")                      # I/O',
              '        return texto'].join('\n') },
            { tipo: 'texto', html: '<p>Para testar o total é preciso um arquivo; para mudar o formato é preciso entender a soma.</p>' }
          ] },
          { rotulo: 'Funções de módulo', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: [
              'def total_vendas(vendas: Sequence[Venda]) -> int:',
              '    return sum(v.valor for v in vendas)',
              '',
              'def formatar_relatorio(vendas: Sequence[Venda]) -> str:',
              '    linhas = [f"{v.produto}: {v.valor / 100:.2f}" for v in vendas]',
              '    return "\\n".join([*linhas, f"TOTAL: {total_vendas(vendas) / 100:.2f}"])',
              '',
              '# quem chama decide gravar: Path.write_text(formatar_relatorio(vendas))'].join('\n') },
            { tipo: 'texto', html: '<p>A correção em Python é quase sempre funções de módulo, não três classes.</p>' }
          ] }
        ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Quando piora', html:
          '<p>Dividir por "responsabilidades" sem atores distintos produz dezenas de classes de um método, com o fluxo espalhado e o leitor obrigado a abrir sete arquivos. Se o relatório só tem um consumidor e nunca muda de formato, a classe original é aceitável. <strong>Medida:</strong> o histórico do Git. Se os commits que tocam o arquivo têm motivos diferentes, divida; se não, deixe.</p>' },
        { tipo: 'texto', html:
          '<h3>O · Aberto/fechado: estender sem editar</h3>' +
          '<p>O módulo deve ser aberto para extensão e fechado para modificação: uma nova variante entra sem editar código que já funciona (e já foi testado). O sintoma é a cadeia de <code>if/elif</code> sobre um tipo que cresce a cada requisito:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'def taxa_com_cadeia(tipo: str, valor: int) -> int:',
          '    if tipo == "pix":     return 0',
          '    elif tipo == "cartao": return valor * 3 // 100',
          '    elif tipo == "boleto": return 350',
          '    raise ValueError(f"tipo desconhecido: {tipo}")'].join('\n') },
        { tipo: 'texto', html:
          '<p>A correção idiomática é uma <strong>tabela de despacho</strong> (dicionário de funções), aqui alimentada por um decorador de registro: adicionar "débito" é adicionar uma função, e nada do que existe é editado. No lab, os cupons usam a mesma tabela (<code>CUPONS</code>, um <code>MappingProxyType</code> imutável, sem registro dinâmico: a lista fecha onde está e é testável).</p>' +
          '<p><strong>Quando piora:</strong> com três variantes estáveis, a cadeia é mais fácil de ler que o registro (indireção sem retorno); registro em estado global de módulo cria dependência de ordem de <em>import</em> (se o módulo que registra "débito" não foi importado, o tipo "não existe"); e a ordem das regras às vezes importa, o que um dicionário esconde.</p>' },
        { tipo: 'takeaway', html: 'SRP: <mark>um ator, um motivo de mudança</mark>, confirmado no histórico do Git. OCP: a <mark>tabela de despacho</mark> resolve a cadeia que cresce.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>L · Substituição de Liskov: o subtipo honra o contrato</h3>' +
          '<p>Onde a base promete algo, o subtipo deve aceitar o mesmo conjunto de entradas (ou mais) e garantir as mesmas saídas (ou mais fortes). Em termos de contrato (Liskov e Wing, 1994): pré-condições não podem ser reforçadas, pós-condições não podem ser enfraquecidas, invariantes devem ser preservadas. A violação típica é o subtipo que "rejeita o que o pai aceitava":</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'class Pagamento:',
          '    def pagar(self, valor: int) -> str:',
          '        return f"pago {valor}"',
          '',
          'class PagamentoComLimite(Pagamento):',
          '    def pagar(self, valor: int) -> str:',
          '        if valor > 1000:',
          '            raise ValueError("acima do limite")     # pré-condição mais forte',
          '        return super().pagar(valor)',
          '',
          'def fechar_compra(pagamento: Pagamento, valor: int) -> str:',
          '    return pagamento.pagar(valor)       # escrita contra a base: não espera ValueError'].join('\n') },
        { tipo: 'rode', id: 'b4-rode', titulo: 'Passe o subtipo onde a base é esperada', enunciado: 'Chame <code>fechar_compra</code> com a base e com o subtipo. O mypy aceita as duas chamadas: as assinaturas são iguais.',
          prefixo: 'Prompt', entrada: 'fechar_compra(PagamentoComLimite(), 5000)', unidade: 'chamadas', terminalTitulo: 'sessão Python',
          etapas: [
            { id: 'base', nome: 'Com a base', descricao: 'Pagamento aceita qualquer valor', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'fechar_compra(Pagamento(), 5000)'),
              L('out', "'pago 5000'")] },
            { id: 'subtipo', nome: 'Com o subtipo', descricao: 'PagamentoComLimite recusa acima de 1000', tom: 'request', ms: 1, linhas: [
              L('cmd', 'fechar_compra(PagamentoComLimite(), 5000)'),
              L('out', 'ValueError: acima do limite'),
              L('hint', 'o código escrito contra a base quebra; o checker de tipos não viu nada')] }
          ],
          prever: { pergunta: 'O mypy aceita <code>fechar_compra(PagamentoComLimite(), 5000)</code>? E a execução?', opcoes: [
            { id: 'a', texto: 'O mypy aceita (assinaturas iguais) e a execução lança ValueError.', correta: true, porque: 'o contrato quebrado é semântico: a pré-condição ficou mais forte que a da base.' },
            { id: 'b', texto: 'O mypy recusa, porque o subtipo lança uma exceção que a base não lança.', correta: false, porque: 'mypy não checa exceções: Python não as declara na assinatura.' },
            { id: 'c', texto: 'Os dois aceitam: o subtipo só acrescenta uma validação.', correta: false, porque: 'acrescentar validação restritiva é exatamente reforçar a pré-condição.' }
          ] },
          tutorAntes: 'Aperte Enter e abra as duas etapas: com a base e com o subtipo.',
          tutorDepois: 'Duas correções legítimas: (1) tornar a recusa parte do contrato da base (o retorno declara <code>str | Recusado</code> e o verificador de tipos obriga todo chamador a tratar os dois casos); (2) deixar de ser subtipo (<code>PagamentoComLimite</code> contém um <code>Pagamento</code> e expõe a própria interface). O caso clássico "quadrado é um retângulo" (mutável) é o mesmo problema: <code>set_largura</code> do quadrado viola a pós-condição "a altura não muda".',
          callout: 'Você viu o contrato semântico quebrar sem que o verificador de tipos acuse.' },
        { tipo: 'callout', tom: 'info', titulo: 'Sinais de alerta em revisão', html:
          '<p><code>raise NotImplementedError</code> em método herdado, <code>isinstance</code> no código cliente para tratar uma subclasse de forma diferente, método que ignora silenciosamente o argumento.</p>' },
        { tipo: 'texto', html:
          '<h3>I · Segregação de interfaces: dependa da fatia que usa</h3>' +
          '<p>Interfaces largas forçam clientes e testes a conhecer métodos que nunca usam. Se uma função só precisa ler, não deve exigir um repositório com seis operações. Com Protocol isso é barato e acontece <em>no consumidor</em>: ele declara o que precisa e qualquer repositório que tenha <code>obter</code> serve, sem herdar nada. O teste ganha um <code>LeitorFalso</code> de 5 linhas em vez de implementar seis métodos.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'class RepositorioGordo(Protocol):          # obter, salvar, remover, listar, contar, limpar',
          '    ...',
          '',
          'class Leitor(Protocol):',
          '    def obter(self, chave: str) -> int | None: ...',
          '',
          'def saldo_ou_zero(leitor: Leitor, chave: str) -> int:',
          '    valor = leitor.obter(chave)',
          '    return 0 if valor is None else valor'].join('\n') },
        { tipo: 'texto', html:
          '<p><strong>Quando piora:</strong> um Protocol por função, com nomes como <code>ObtemEOuListaEOuConta</code>, vira ruído; agrupe por papel (leitura, escrita) e pare aí. Em Python, <code>Callable[[str], int | None]</code> também é uma interface de um método.</p>' },
        { tipo: 'takeaway', html: 'LSP: o subtipo <mark>não rejeita o que a base aceitava</mark>; o mypy não vê, o contrato sim. ISP: o <mark>consumidor</mark> declara a fatia que usa.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>D · Inversão de dependência: a política é dona da interface</h3>' +
          '<p>Módulos de alto nível (política, regra de negócio) não devem depender de módulos de baixo nível (SMTP, banco, HTTP); ambos dependem de uma abstração, e a abstração <strong>pertence ao alto nível</strong>. A violação é a classe criar sua própria dependência, o que a torna impossível de testar sem rede.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'class AlertaAcoplado:',
          '    def __init__(self) -> None:',
          '        self._smtp = SmtpClient()           # impossível testar sem rede',
          '    def disparar(self, to: str) -> None:',
          '        self._smtp.send(to, "limite excedido")',
          '',
          'class Enviador(Protocol):                      # definido pelo alto nível, com o vocabulário dele',
          '    def enviar(self, destino: str, texto: str) -> None: ...',
          '',
          'class Alerta:',
          '    def __init__(self, enviador: Enviador) -> None:    # dependência recebida',
          '        self._enviador = enviador',
          '    def disparar(self, destino: str) -> None:',
          '        self._enviador.enviar(destino, "limite excedido")',
          '',
          'class AdaptadorSmtp:                           # baixo nível se adapta à porta (send -> enviar)',
          '    def __init__(self, cliente: SmtpClient) -> None: self._cliente = cliente',
          '    def enviar(self, destino: str, texto: str) -> None:',
          '        self._cliente.send(destino, texto)'].join('\n') },
        { tipo: 'texto', html:
          '<p>Note a direção: o Protocol fala <code>enviar(destino, texto)</code>, o vocabulário do negócio; o cliente SMTP fala <code>send(to, body)</code>; quem se adapta é o adapter. O código de domínio não importa nada da biblioteca de e-mail. DIP é o princípio com maior retorno em testabilidade e o mais mal-entendido: <strong>não é "injeção de dependência"</strong> (que é uma técnica, bloco 5), é a decisão sobre quem define a interface.</p>' +
          '<p><strong>Quando piora:</strong> para uma dependência que nunca será trocada e é barata de usar em teste (<code>pathlib</code>, <code>json</code>, <code>datetime</code>), a abstração é cerimônia. Abstraia fronteiras que você precisa trocar em teste ou produção (rede, relógio, banco, filesystem em volume), não a biblioteca padrão pura.</p>' },
        { tipo: 'python', id: 'b4-python', titulo: 'Abra a taxa para extensão sem editar', obrigatorio: false,
          enunciado: 'Implemente o registro de taxas: o decorador <code>taxa(tipo)</code> guarda a função em <code>_TAXAS</code>, e <code>calcular_taxa</code> converte o tipo ausente em <code>ValueError("tipo desconhecido: ...")</code> <em>sem encadear o KeyError</em>. Um novo tipo ("débito") entra nos testes sem editar nada que existe, e um <code>KeyError</code> interno de uma taxa não pode virar "tipo desconhecido".',
          codigo: [
      "_TAXAS = {}",
      "",
      "",
      "def taxa(tipo):",
      "    \"\"\"Decorador de registro: acrescentar um tipo não edita código existente.\"\"\"",
      "",
      "    def registrar(f):",
      "        # lacuna: guarde f em _TAXAS sob a chave tipo e devolva f",
      "        return f",
      "",
      "    return registrar",
      "",
      "",
      "@taxa(\"pix\")",
      "def _pix(valor):",
      "    return 0",
      "",
      "",
      "@taxa(\"cartao\")",
      "def _cartao(valor):",
      "    return valor * 3 // 100",
      "",
      "",
      "@taxa(\"boleto\")",
      "def _boleto(valor):",
      "    return 350",
      "",
      "",
      "def calcular_taxa(tipo, valor):",
      "    # lacuna: tipo ausente deve virar ValueError(\"tipo desconhecido: ...\"), sem o KeyError encadeado",
      "    return _TAXAS[tipo](valor)",
      "",
      "",
      "print(sorted(_TAXAS))"
    ].join('\n'),
          testes: [
      "def test_taxas_existentes():",
      "    assert calcular_taxa(\"pix\", 5000) == 0",
      "    assert calcular_taxa(\"cartao\", 10000) == 300",
      "    assert calcular_taxa(\"boleto\", 5000) == 350",
      "",
      "",
      "def test_tipo_desconhecido_vira_value_error_com_mensagem():",
      "    try:",
      "        calcular_taxa(\"cheque\", 100)",
      "    except ValueError as e:",
      "        assert str(e) == \"tipo desconhecido: cheque\"",
      "        assert e.__suppress_context__ and e.__cause__ is None",
      "        return",
      "    raise AssertionError(\"deveria lançar ValueError\")",
      "",
      "",
      "def test_novo_tipo_entra_sem_editar_o_que_existe():",
      "    @taxa(\"debito\")",
      "    def _debito(valor):",
      "        return valor // 100",
      "",
      "    assert calcular_taxa(\"debito\", 20000) == 200",
      "    assert calcular_taxa(\"pix\", 20000) == 0",
      "",
      "",
      "def test_borda_cartao_arredonda_para_baixo():",
      "    assert calcular_taxa(\"cartao\", 99) == 2",
      "    assert calcular_taxa(\"cartao\", 0) == 0",
      "",
      "",
      "def test_erro_da_propria_taxa_nao_e_mascarado_como_desconhecido():",
      "    @taxa(\"quebrada\")",
      "    def _quebrada(valor):",
      "        raise KeyError(\"bug interno\")",
      "",
      "    try:",
      "        calcular_taxa(\"quebrada\", 1)",
      "    except KeyError:",
      "        return",
      "    except ValueError:",
      "        raise AssertionError(\"um KeyError interno não deve virar tipo desconhecido\")",
      "    raise AssertionError(\"deveria propagar\")"
    ].join('\n'),
          dica: 'Em <code>registrar</code>: <code>_TAXAS[tipo] = f</code> e <code>return f</code>. Em <code>calcular_taxa</code>, envolva só a <em>busca</em> no dicionário em <code>try/except KeyError</code> e use <code>raise ... from None</code>; chame a função depois, fora do <code>try</code>.',
          solucao: [
      "_TAXAS = {}",
      "",
      "",
      "def taxa(tipo):",
      "    \"\"\"Decorador de registro: acrescentar um tipo não edita código existente.\"\"\"",
      "",
      "    def registrar(f):",
      "        _TAXAS[tipo] = f",
      "        return f",
      "",
      "    return registrar",
      "",
      "",
      "@taxa(\"pix\")",
      "def _pix(valor):",
      "    return 0",
      "",
      "",
      "@taxa(\"cartao\")",
      "def _cartao(valor):",
      "    return valor * 3 // 100",
      "",
      "",
      "@taxa(\"boleto\")",
      "def _boleto(valor):",
      "    return 350",
      "",
      "",
      "def calcular_taxa(tipo, valor):",
      "    try:",
      "        f = _TAXAS[tipo]",
      "    except KeyError:",
      "        raise ValueError(f\"tipo desconhecido: {tipo}\") from None",
      "    return f(valor)"
    ].join('\n'),
          tutorDepois: 'O último teste é o que separa uma tabela de despacho correta de uma que mascara bugs: o <code>try</code> cobre a busca, não a chamada da taxa.',
          callout: 'Novo tipo de taxa é uma função nova: nada do que já funciona foi editado.' },
        { tipo: 'cenario', id: 'b4-cenario', titulo: 'Interface, implementação, factory e container para uma classe', obrigatorio: false,
          enunciado: 'Um colega propõe <code>IRepositorio</code>, <code>RepositorioImpl</code>, <code>RepositorioFactory</code> e um container de DI para uma classe que tem uma só implementação. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A classe acessa um arquivo local e nenhuma segunda implementação está no roadmap. Qual a sua resposta na revisão?', opcoes: [
              { texto: 'Aceitar: abstração nunca é demais.', vai: 'f-precaucao', tom: 'ruim', consequencia: 'o preço é pago em cada leitura, para uma mudança que ninguém pediu.' },
              { texto: 'Perguntar que mudança concreta a abstração torna barata e escrever o código direto até a segunda variante.', vai: 'meio', tom: 'ok', consequencia: 'a pergunta separa fronteira que se troca de cerimônia.' },
              { texto: 'Recusar toda abstração, em qualquer caso.', vai: 'f-radical', tom: 'ruim', consequencia: 'fronteiras que você troca em teste (rede, relógio, banco) continuam pedindo porta.' }
            ] },
            meio: { texto: 'O colega responde: "o teste precisa rodar sem tocar o disco". O que muda sua opinião?', opcoes: [
              { texto: 'Um Protocol de dois métodos, definido pelo consumidor, mais um fake em memória; sem factory nem container.', vai: 'f-bom', tom: 'ok', consequencia: 'a mudança concreta (teste sem disco) justifica uma porta, na menor forma possível.' },
              { texto: 'Manter a proposta inteira: interface, implementação, factory e container.', vai: 'f-precaucao', tom: 'ruim', consequencia: 'a necessidade era uma porta; o resto continua sem retorno.' }
            ] }
          },
          finais: {
            'f-precaucao': { bom: false, texto: 'SOLID por precaução é a violação mais comum: <code>IRepositorio</code>, <code>RepositorioImpl</code>, <code>RepositorioFactory</code> e um container para uma implementação que nunca terá outra. Abstrair cedo fixa a forma errada; extrair depois, com testes, é barato (a regra dos três: duplique uma vez, abstraia na terceira).' },
            'f-radical': { bom: false, texto: 'Recusar toda abstração também reprova. A régua é a fronteira que você precisa trocar em teste ou produção: rede, relógio, banco, filesystem em volume.' },
            'f-bom': { bom: true, texto: 'Pergunta pela mudança concreta, abstrai a fronteira que se troca (o disco, no teste) e para aí. O composition root do bloco 5 monta as peças sem container.' }
          } },
        { tipo: 'takeaway', html: 'DIP: a <mark>política define a interface</mark> no vocabulário dela; abstraia <mark>fronteiras que você troca</mark>, não a biblioteca padrão.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b4-esc-liskov', titulo: 'Quadrado e retângulo',
          pergunta: '<code>Rectangle.set_width</code> funciona em qualquer retângulo. Alguém cria <code>Square(Rectangle)</code> cujo <code>set_width</code> também altera a altura. O que está violado?',
          opcoes: [
            { id: 'a', texto: 'Liskov: o subtipo não honra o contrato da base (largura e altura independentes); código que usava Rectangle quebra com Square.', correta: true, porque: 'substituibilidade é sobre contrato (pré e pós-condições, invariantes), não sobre assinatura. Teste de contrato compartilhado vê; o checker não.' },
            { id: 'b', texto: 'Aberto/fechado, porque foi preciso editar a classe base.', correta: false, porque: 'ninguém editou a base.' },
            { id: 'c', texto: 'Responsabilidade única, porque Square tem dois métodos.', correta: false, porque: 'o número de métodos não é o critério do SRP.' },
            { id: 'd', texto: 'Nada: o mypy aceita, então o desenho está correto.', correta: false, porque: 'o mypy não vê pós-condições.' }
          ] },
        { tipo: 'escolha', id: 'b4-esc-dip', titulo: 'Dono da interface',
          pergunta: 'Na inversão de dependência, quem deve ser dono da interface <code>EnviaNotificacao</code> que o caso de uso consome?',
          opcoes: [
            { id: 'a', texto: 'A biblioteca de e-mail, para que o domínio importe a interface dela.', correta: false, porque: 'o domínio passaria a depender do detalhe.' },
            { id: 'b', texto: 'Um módulo <code>utils</code> compartilhado por todos.', correta: false, porque: 'sem dono nem direção de dependência.' },
            { id: 'c', texto: 'A política (o caso de uso, a camada de alto nível), no vocabulário do domínio; o adapter de e-mail ou SMS se adapta a ela.', correta: true, porque: 'DIP inverte a direção do código-fonte: o detalhe depende da política.' },
            { id: 'd', texto: 'Ninguém: interfaces são dispensáveis em Python.', correta: false, porque: 'o Protocol é barato; o erro é abstrair o que não se troca.' }
          ] },
        { tipo: 'texto', largo: true, html:
          '<h3>Mapa de sintomas</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Princípio</th><th>Remédio em Python</th><th>Custo da correção</th></tr></thead><tbody>' +
          '<tr><td>Arquivo muda por motivos de atores distintos</td><td>SRP</td><td>Funções ou módulos separados</td><td>Mais arquivos; fluxo espalhado</td></tr>' +
          '<tr><td><code>if/elif</code> sobre tipo que cresce</td><td>OCP</td><td>Dicionário de funções, <code>match</code>, <code>singledispatch</code></td><td>Indireção; ordem implícita</td></tr>' +
          '<tr><td>Subclasse lança onde o pai aceitava</td><td>LSP</td><td>Recusa no contrato, ou composição</td><td>Tipo de retorno mais rico</td></tr>' +
          '<tr><td>Fake precisa implementar 6 métodos</td><td>ISP</td><td>Protocol por papel, no consumidor</td><td>Mais nomes de interface</td></tr>' +
          '<tr><td>Teste exige rede, relógio ou banco</td><td>DIP</td><td>Porta (Protocol) + injeção + adapter</td><td>Um nível a mais; composition root</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'Cada letra vem com <mark>sintoma, remédio e custo</mark>; se a correção custa mais que a mudança que ela barateia, <mark>não corrija</mark>.' }
      ] }
    ]
  });
})();
