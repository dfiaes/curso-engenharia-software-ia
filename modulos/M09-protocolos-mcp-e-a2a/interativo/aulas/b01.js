/* M09 · Bloco 1: Por que protocolo. Fonte: M09.html#b01. Especificação MCP revisão 2026-07-28, verificada em 14/09/2026 (revalidar em até 90 dias). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = String.raw`def integracoes(n, m):
    """Devolve (sem_protocolo, com_protocolo, economia) para n aplicações e m sistemas."""
    return 0, 0, 0


def classificar(msg):
    """Classifica uma mensagem JSON-RPC 2.0 (dict).

    'request' (method + id), 'notification' (method sem id),
    'response' (result + id) ou 'error' (error + id).
    ValueError se jsonrpc != "2.0" ou se faltar method/result/error.
    """
    return "request"


print(integracoes(5, 10))
print(classificar({"jsonrpc": "2.0", "id": 1, "method": "tools/list"}))
`;
  var testes = String.raw`def test_cinco_por_dez():
    assert integracoes(5, 10) == (50, 15, 35)


def test_cliente_novo_custa_um():
    sem1, com1, _ = integracoes(5, 10)
    sem2, com2, _ = integracoes(6, 10)
    assert sem2 - sem1 == 10 and com2 - com1 == 1


def test_borda_um_por_um():
    assert integracoes(1, 1) == (1, 2, -1)


def test_requisicao_e_notificacao():
    assert classificar({"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {}}) == "request"
    assert classificar({"jsonrpc": "2.0", "method": "notifications/initialized"}) == "notification"


def test_resposta_e_erro():
    assert classificar({"jsonrpc": "2.0", "id": 1, "result": {}}) == "response"
    assert classificar({"jsonrpc": "2.0", "id": 1, "error": {"code": -32601, "message": "x"}}) == "error"


def test_id_zero_ainda_e_requisicao():
    assert classificar({"jsonrpc": "2.0", "id": 0, "method": "tools/list"}) == "request"


def test_rejeita_envelope_invalido():
    for ruim in ({"id": 1, "method": "x"}, {"jsonrpc": "1.0", "id": 1, "method": "x"}, {"jsonrpc": "2.0", "id": 1}):
        try:
            classificar(ruim)
        except ValueError:
            continue
        raise AssertionError("deveria rejeitar " + repr(ruim))
`;
  var solucao = String.raw`def integracoes(n, m):
    sem = n * m
    com = n + m
    return sem, com, sem - com


def classificar(msg):
    if not isinstance(msg, dict) or msg.get("jsonrpc") != "2.0":
        raise ValueError("jsonrpc deve ser '2.0'")
    if "method" in msg:
        return "request" if "id" in msg else "notification"
    if "error" in msg and "id" in msg:
        return "error"
    if "result" in msg and "id" in msg:
        return "response"
    raise ValueError("mensagem sem method, result ou error")
`;

  TrilhaAula.registrar({
    id: 'm09-b1',
    titulo: 'Por que protocolo: N×M e a arquitetura',
    minutos: 30,
    resumo: 'Sem protocolo, N aplicações de IA e M sistemas exigem N×M integrações; com um protocolo no meio, N+M. MCP padroniza de onde vêm as ferramentas, não substitui o tool calling.',
    objetivo: 'Calcular o custo de integração com e sem protocolo, distinguir MCP de tool calling, nomear host, cliente e servidor com a responsabilidade de cada um e ler uma mensagem JSON-RPC 2.0.',
    revisao: [
      { id: 'm09b1-nm', pergunta: 'Você tem 5 aplicações de IA e 10 sistemas internos. Quantas integrações são necessárias sem protocolo e com um protocolo no meio?',
        opcoes: [
          opc('a', '50 sem protocolo (N×M) e 15 com protocolo (N+M)', true, 'cada aplicação fala o protocolo e cada sistema expõe o protocolo; o custo marginal de conectar mais um ator cai para perto de zero.'),
          opc('b', '15 sem protocolo e 50 com protocolo', false, 'inverteu: o protocolo reduz o número de integrações.'),
          opc('c', '50 nos dois casos; o protocolo só padroniza o formato', false, 'o ganho está justamente em trocar produto por soma.')] },
      { id: 'm09b1-tc', pergunta: 'Qual afirmação descreve a relação entre MCP e tool calling?',
        opcoes: [
          opc('a', 'MCP padroniza de onde vêm as ferramentas e como são executadas; por baixo, o cliente ainda faz tool calling com o modelo', true, 'tool calling é capacidade do modelo; MCP é protocolo de integração entre processos.'),
          opc('b', 'MCP substitui o tool calling e dispensa schemas', false, 'confunde camadas: o modelo continua emitindo JSON conforme um schema.'),
          opc('c', 'São a mesma coisa com nomes diferentes', false, 'um é recurso do modelo, o outro é protocolo de integração.')] },
      { id: 'm09b1-papeis', pergunta: 'Onde mora o consentimento do usuário e a política de segurança do usuário na arquitetura do MCP?',
        opcoes: [
          opc('a', 'No host, a aplicação de IA que conversa com o modelo', true, 'o host decide o que mostrar, pede consentimento, aplica permissões e auditoria.'),
          opc('b', 'No servidor, que decide tudo sozinho', false, 'o servidor é a sua fronteira de acesso ao sistema, não a política do usuário.'),
          opc('c', 'No protocolo, que autoriza as chamadas', false, 'o MCP não é mecanismo de autorização: carrega a chamada.')] },
      { id: 'm09b1-jsonrpc', pergunta: 'Numa mensagem JSON-RPC 2.0, o que faz dela uma notificação?',
        opcoes: [
          opc('a', 'Ter method mas não ter id: não espera resposta', true, 'o id correlaciona pedido e resposta; sem ele, ninguém responde.'),
          opc('b', 'Ter um objeto error com code e message', false, 'isso é uma resposta de erro, correlacionada por id.'),
          opc('c', 'Usar o method notifications/ no começo, sempre com id', false, 'o que define a notificação é a ausência de id.')] },
      { id: 'm09b1-naoe', pergunta: 'Expor 60 endpoints do backend como 60 ferramentas MCP produz qual problema?',
        opcoes: [
          opc('a', 'Servidor inutilizável: cada ferramenta listada ocupa tokens em toda chamada e o modelo se perde; vale poucas ferramentas de alto impacto', true, 'MCP não é RPC genérico para o backend e não elimina o custo de contexto.'),
          opc('b', 'Nenhum, porque o protocolo comprime as definições', false, 'o protocolo não elimina o custo de contexto.'),
          opc('c', 'O servidor deixa de funcionar em stdio', false, 'o transporte não tem relação com a quantidade de ferramentas.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Você já sabe fazer <strong>tool calling</strong> (M05 bloco 3) e já desenhou boas ferramentas (M08 bloco 3). Se o seu agente já recebe ferramentas, para que serve um protocolo? A resposta é a que justifica qualquer padrão de integração, e é aritmética.</p>' +
          '<p>Sem protocolo, <strong>N</strong> aplicações de IA integradas a <strong>M</strong> sistemas exigem <strong>N×M</strong> integrações, cada uma com formato próprio. Com um protocolo no meio, são <strong>N+M</strong>: cada aplicação fala o protocolo, cada sistema expõe o protocolo. Com 5 clientes de IA e 10 sistemas internos, a diferença é 50 integrações contra 15.</p>' +
          '<p>O paralelo mais próximo é o <strong>Language Server Protocol (LSP)</strong>: antes dele, cada editor implementava suporte a cada linguagem; depois, quem escreve a linguagem escreve um servidor e todos os editores ganham. O <strong>MCP (Model Context Protocol)</strong> é o LSP dos agentes: quem tem o sistema escreve um servidor, e todos os assistentes ganham acesso. É o argumento de um driver por banco em vez de cada aplicação falar o protocolo nativo.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Revisão da especificação', html:
          '<p>Este módulo ensina a revisão <strong>2026-07-28</strong> do MCP, verificada em 14/09/2026. Versão de protocolo e comportamento de produto são informação de alto risco: revalide em até 90 dias e confira a revisão vigente em modelcontextprotocol.io antes de implementar. Muito tutorial ainda mostra a era anterior (com <code>initialize</code> e sessão); o bloco 2 mostra a diferença.</p>' },
        { tipo: 'texto', html: '<h3>Protocolo × tool calling</h3><p>A frase que resolve a confusão: <strong>MCP não substitui tool calling; ele padroniza de onde vêm as ferramentas</strong>. Por baixo, o cliente ainda faz tool calling com o modelo. O que muda é que a lista de ferramentas e a execução vêm de um servidor externo padronizado.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th></th><th>Tool calling (M05)</th><th>MCP</th></tr></thead><tbody>' +
          '<tr><td>O que é</td><td>recurso do modelo: emitir JSON conforme um schema</td><td>protocolo de integração: como um processo expõe capacidades a outro</td></tr>' +
          '<tr><td>Quem implementa</td><td>o provedor do modelo</td><td>quem tem o sistema (você) e quem tem o cliente (o editor)</td></tr>' +
          '<tr><td>Acoplamento</td><td>as ferramentas vivem no código do seu agente</td><td>as ferramentas vivem num processo separado, reutilizável</td></tr>' +
          '<tr><td>Reuso</td><td>zero: outro agente reimplementa</td><td>qualquer cliente MCP usa o mesmo servidor</td></tr>' +
          '<tr><td>Descoberta</td><td>você escreve as definições à mão</td><td><code>tools/list</code>: o cliente descobre em runtime</td></tr>' +
          '<tr><td>Governança</td><td>sua</td><td>do host: consentimento, permissões e auditoria num lugar só</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Host, cliente, servidor</h3>' +
          '<ul><li><strong>Host</strong>: a aplicação de IA (Claude Code, uma IDE, o seu agente do M08). Conversa com o modelo, decide o que mostrar ao usuário e pede consentimento. Toda a política de segurança do usuário mora aqui.</li>' +
          '<li><strong>Cliente</strong>: o conector dentro do host, <strong>um por servidor</strong>. O isolamento é intencional: um servidor comprometido não enxerga o tráfego de outro.</li>' +
          '<li><strong>Servidor</strong>: o processo que expõe capacidades, local (um binário que o host inicia, ex.: índice de código via stdio) ou remoto (serviço HTTP autenticado, ex.: trackers e docs). É a sua fronteira de acesso ao sistema, e portanto onde mora a sua autorização.</li></ul>' +
          '<p>Cliente e servidor falam <strong>JSON-RPC 2.0</strong>.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'JSON-RPC 2.0 em um parágrafo', html:
          '<p>Um objeto JSON com <code>jsonrpc: "2.0"</code>, um <code>method</code> (o nome da operação, ex.: <code>tools/call</code>), <code>params</code> e um <code>id</code> para correlacionar pedido e resposta. Quem não tem <code>id</code> é <strong>notificação</strong> (não espera resposta). Erros vêm num objeto <code>error</code> com <code>code</code> e <code>message</code>, com faixas reservadas (<code>-32601</code> = método não encontrado). É mais simples que SOAP e mais estruturado que REST (o "recurso" não está na URL, está no <code>method</code>), e funciona igual sobre qualquer transporte, que é o que um protocolo de integração precisa. É o mesmo formato do LSP e do protocolo do depurador do VS Code.</p>' },
        { tipo: 'texto', html:
          '<h3>O que o MCP não é</h3>' +
          '<ul><li><strong>Não é framework de agentes.</strong> Não tem loop nem orquestração e não decide nada; quem faz isso é o host (M08).</li>' +
          '<li><strong>Não é mecanismo de autorização.</strong> O protocolo carrega a chamada; quem pode chamar o quê é decisão do servidor e do host com o usuário (bloco 7).</li>' +
          '<li><strong>Não é RPC genérico para o backend.</strong> Expor 60 endpoints como 60 ferramentas produz um servidor inutilizável (M08 bloco 3: poucas ferramentas de alto impacto).</li>' +
          '<li><strong>Não elimina o custo de contexto.</strong> Cada ferramenta listada ocupa tokens em toda chamada; conectar cinco servidores grandes pode consumir milhares de tokens antes da primeira pergunta (M08 bloco 4).</li></ul>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Engenharia por trás: padrão, descoberta e fronteira', html:
          '<ul><li><strong>Padrão é economia, não superioridade técnica.</strong> O custo marginal de conectar mais um ator cai para perto de zero (USB, ODBC, HTTP).</li>' +
          '<li><strong>Runtime × build time.</strong> OpenAPI gera cliente em build; MCP descobre em runtime (<code>tools/list</code>). Mais flexível (o servidor evolui sem recompilar o cliente) e mais perigoso: o conjunto de ferramentas pode mudar embaixo de você, inclusive de forma maliciosa (bloco 7).</li>' +
          '<li><strong>Fronteira de processo é fronteira de segurança.</strong> Servidor em processo separado permite sandbox, limite de recursos e permissões próprias, como o navegador isola abas.</li>' +
          '<li><strong>Padronizar cedo tem custo.</strong> O MCP mudou de forma três vezes em dois anos. A mitigação é a fronteira fina (M08 bloco 7): seu domínio isolado da versão do protocolo.</li></ul>' },
        { tipo: 'takeaway', html: 'Protocolo transforma <mark>N×M em N+M</mark>; o MCP padroniza <mark>de onde vêm as ferramentas</mark> e não substitui o tool calling.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html: '<p>A conta é simples, mas vale ver o efeito do <strong>cliente novo</strong>: é nele que o protocolo compensa. Rode o cálculo para 5 aplicações e 10 sistemas (valores calculados, sem execução do laboratório) e clique em cada etapa.</p>' },
        { tipo: 'rode', id: 'nm-rode', titulo: 'Conte as integrações', terminalTitulo: 'calculadora',
          enunciado: 'Rode o comando e leia as três etapas: sem protocolo, com protocolo e o custo de mais um cliente.',
          prefixo: '$', entrada: 'python nxm.py 5 10', unidade: 'integrações',
          etapas: [
            { id: 'sem', nome: 'Sem protocolo', descricao: 'N × M', tom: 'request', ms: 50, linhas: [
              L('out', '5 aplicações x 10 sistemas = 50 integrações sob medida'),
              L('hint', 'cada par aplicação-sistema tem formato próprio')] },
            { id: 'com', nome: 'Com protocolo', descricao: 'N + M', tom: 'response', ms: 15, linhas: [
              L('out', '5 + 10 = 15: cada aplicação fala MCP, cada sistema expõe MCP'),
              L('out', 'economia: 35 integrações (70%)')] },
            { id: 'novo', nome: 'Cliente novo', descricao: 'o custo marginal', tom: 'ink', ms: 1, linhas: [
              L('out', 'um 6º cliente de IA: +10 integrações sem protocolo, +1 com protocolo'),
              L('hint', 'um 11º sistema: +5 sem protocolo, +1 com protocolo')] }
          ],
          prever: { pergunta: 'Com 5 aplicações de IA e 10 sistemas, quantas integrações o protocolo exige?', opcoes: [
            { id: 'a', texto: '50: o protocolo só padroniza o formato.', correta: false, porque: '50 é o N×M do caso sem protocolo.' },
            { id: 'b', texto: '15: cada aplicação e cada sistema implementam o protocolo uma vez.', correta: true, porque: 'N+M = 5+10; o custo cresce com a soma, não com o produto.' },
            { id: 'c', texto: '10: só os sistemas precisam mudar.', correta: false, porque: 'as aplicações também precisam falar o protocolo.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido, faça a previsão e aperte Enter. Depois clique em "Cliente novo".',
          tutorDepois: 'Com o protocolo, cada cliente novo custa 1 integração em vez de M, e cada sistema novo, 1 em vez de N.',
          callout: 'Você viu 50 contra 15 e o custo marginal de um cliente novo cair para 1.' },
        { tipo: 'takeaway', html: 'O ganho do protocolo aparece no <mark>cliente novo</mark>: custa <mark>1</mark> em vez de M.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'nm-python', titulo: 'Conte integrações e classifique mensagens', obrigatorio: false,
          enunciado: 'Implemente <code>integracoes(n, m)</code>, que devolve <code>(sem, com, economia)</code>, e <code>classificar(msg)</code>, que lê um envelope JSON-RPC 2.0 e devolve <code>request</code>, <code>notification</code>, <code>response</code> ou <code>error</code>. Envelope sem <code>jsonrpc: "2.0"</code> ou sem <code>method</code>/<code>result</code>/<code>error</code> levanta <code>ValueError</code>. Sem SDK: só dicts.',
          codigo: codigo, testes: testes,
          dica: 'Pedido e notificação têm <code>method</code>; só o pedido tem <code>id</code>. Cuidado com <code>id: 0</code>: use <code>"id" in msg</code>, não a veracidade do valor. Resposta e erro precisam de <code>id</code>.',
          solucao: solucao,
          tutorDepois: 'É este envelope, e só ele, que o MCP carrega por qualquer transporte. O cliente novo do exercício custou +1 no total com protocolo.',
          callout: 'Contas e envelope JSON-RPC passaram nos testes, incluindo id 0 e envelope inválido.' },
        { tipo: 'cenario', id: 'nm-cenario', titulo: 'Sessenta endpoints, sessenta ferramentas?', obrigatorio: false,
          enunciado: 'Um colega propõe "transformar o MCP numa camada de RPC": expor os 60 endpoints do backend legado como 60 ferramentas, para dar liberdade ao modelo. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O servidor ficaria "completo". Cada ferramenta listada ocupa tokens em toda chamada, e o modelo precisa escolher entre 60 nomes parecidos. O que você responde?', opcoes: [
              { texto: 'Concordo: protocolo bom expõe tudo.', vai: 'f-tudo', tom: 'ruim', consequencia: 'o contexto enche antes da primeira pergunta e a escolha de ferramenta degrada.' },
              { texto: 'Não é o papel do MCP: escolho poucas ferramentas de alto impacto, por fluxo.', vai: 'fluxo', tom: 'ok', consequencia: 'menos tokens por chamada e menos passos para o modelo.' }
            ] },
            fluxo: { texto: 'Falta decidir quem é dono de cada coisa. O colega pergunta: "e quem garante que o usuário pode chamar isso?"', opcoes: [
              { texto: 'O protocolo: o MCP autoriza a chamada.', vai: 'f-autz', tom: 'ruim', consequencia: 'o MCP carrega a chamada; não autoriza. Quem pode chamar o quê é decisão do servidor e do host.' },
              { texto: 'O servidor, na fronteira de acesso, e o host, com consentimento do usuário.', vai: 'f-bom', tom: 'ok', consequencia: 'a autorização mora onde o dado mora.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Poucas ferramentas por fluxo, autorização no servidor e consentimento no host: o desenho que o módulo constrói.' },
            'f-tudo': { bom: false, texto: 'Servidor inutilizável: custo de contexto alto e modelo errando a ferramenta.' },
            'f-autz': { bom: false, texto: 'Nenhuma autorização de verdade: o protocolo só transportou a chamada.' }
          },
          callout: 'Você manteve o servidor enxuto e pôs a autorização no servidor e no host.' },
        { tipo: 'takeaway', html: 'Ferramentas <mark>poucas e de alto impacto</mark>; a <mark>autorização</mark> é do servidor e do host, não do protocolo.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'nm-escolha-tc', titulo: 'Confira: MCP e tool calling',
          pergunta: 'Um colega diz que "MCP substitui o tool calling". Qual correção está certa?',
          opcoes: [
            opc('a', 'Tool calling é capacidade do modelo; MCP padroniza de onde vêm as ferramentas e como são executadas, e por baixo o cliente ainda faz tool calling.', true, 'camadas diferentes: o modelo emite JSON conforme um schema; o protocolo conecta processos.'),
            opc('b', 'Está certo: com MCP o modelo deixa de precisar de schema.', false, 'o schema continua sendo o contrato de entrada.'),
            opc('c', 'MCP é um recurso do modelo e tool calling é o protocolo.', false, 'inverteu os papéis.'),
            opc('d', 'São sinônimos.', false, 'um é recurso do modelo, o outro é protocolo de integração.')],
          tutorDepois: 'Quem diz que "MCP substitui" confunde camadas.' },
        { tipo: 'escolha', id: 'nm-escolha-host', titulo: 'Confira: quem faz o quê',
          pergunta: 'Um servidor MCP de terceiros fica comprometido. Que propriedade da arquitetura limita o estrago em relação aos outros servidores conectados ao mesmo host?',
          opcoes: [
            opc('a', 'Um cliente por servidor, isolados: o servidor comprometido não enxerga o tráfego dos outros.', true, 'o isolamento entre clientes dentro do host é intencional.'),
            opc('b', 'O JSON-RPC criptografa cada mensagem.', false, 'o formato não cifra nada; o isolamento vem do desenho host-cliente-servidor.'),
            opc('c', 'O servidor local é sempre confiável.', false, 'confiança no servidor não é garantida pelo protocolo; o consentimento mora no host.')],
          tutorDepois: 'A confiança e o consentimento moram no host.' },
        { tipo: 'takeaway', html: '<mark>Host</mark> decide e pede consentimento, <mark>cliente</mark> isola, <mark>servidor</mark> é a fronteira de acesso.' }
      ] }
    ]
  });
})();
