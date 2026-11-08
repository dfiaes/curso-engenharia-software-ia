/* M09 · Bloco 2: MCP por dentro. Fonte: M09.html#b02. Especificação MCP revisão 2026-07-28, verificada em 14/09/2026 (revalidar em até 90 dias). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var toolJson = [
    '{',
    '  "name": "repo_buscar_simbolo",',
    '  "title": "Buscar símbolo",                  // rótulo para humano (UI do host)',
    '  "description": "Localiza onde um identificador aparece...\\n\\nUse quando: ...\\nNÃO use quando: ...",',
    '  "inputSchema": {                            // JSON Schema: o contrato de entrada',
    '    "type": "object",',
    '    "properties": {',
    '      "simbolo": {"type": "string", "description": "Nome EXATO de classe, método..."},',
    '      "limite":  {"type": "integer", "minimum": 1, "maximum": 50, "default": 20}',
    '    },',
    '    "required": ["simbolo"]',
    '  },',
    '  "outputSchema": { ... },                    // opcional: contrato da SAÍDA estruturada',
    '  "annotations": {                            // dicas de comportamento para o host',
    '    "readOnlyHint": true,                     // não modifica nada',
    '    "destructiveHint": false,',
    '    "idempotentHint": true,',
    '    "openWorldHint": false                    // não acessa a internet',
    '  }',
    '}'].join('\n');

  var metaJson = [
    '{',
    '  "jsonrpc": "2.0",',
    '  "id": 1,',
    '  "method": "tools/call",',
    '  "params": {',
    '    "name": "repo_buscar_simbolo",',
    '    "arguments": { "simbolo": "CalcularJuros" },',
    '    "_meta": {',
    '      "io.modelcontextprotocol/protocolVersion": "2026-07-28",',
    '      "io.modelcontextprotocol/clientInfo": { "name": "ClaudeCode", "version": "…" },',
    '      "io.modelcontextprotocol/clientCapabilities": { "elicitation": {} }',
    '    }',
    '  }',
    '}'].join('\n');

  var codigo = String.raw`VERSAO = "2026-07-28"
P = "io.modelcontextprotocol/"
METHOD_NOT_FOUND, VERSION_MISMATCH = -32601, -32000


def ler_meta(params):
    """Devolve (versao, capacidades) lidos de params["_meta"].

    As chaves têm o prefixo P ("protocolVersion", "clientCapabilities").
    ValueError se a versão não vier: cada requisição se declara sozinha.
    """
    return None, {}


def pode_elicitar(params):
    """True só se ESTA requisição declarou a capacidade "elicitation"."""
    return True


def erro(mid, code, msg):
    return {"jsonrpc": "2.0", "id": mid, "error": {"code": code, "message": msg}}


def despachar(msg, tools):
    """Servidor sem estado: sem initialize e sem sessão. tools = {nome: função(args)}."""
    mid, params = msg.get("id"), msg.get("params", {})
    try:
        versao, _ = ler_meta(params)
    except ValueError:
        return erro(mid, VERSION_MISMATCH, "versão ausente")
    if versao != VERSAO:
        return erro(mid, VERSION_MISMATCH, "versão não suportada")
    metodo = msg.get("method")
    if metodo == "tools/list":
        return {"jsonrpc": "2.0", "id": mid, "result": {"tools": [{"name": n} for n in tools]}}
    if metodo == "tools/call":
        fn = tools.get(params.get("name"))
        if fn is None:
            return erro(mid, METHOD_NOT_FOUND, "tool desconhecida")
        texto = str(fn(params.get("arguments", {})))
        return {"jsonrpc": "2.0", "id": mid, "result": {"content": [{"type": "text", "text": texto}]}}
    return erro(mid, METHOD_NOT_FOUND, "método desconhecido: " + str(metodo))


def meta(versao=VERSAO, caps=None):
    return {"_meta": {P + "protocolVersion": versao, P + "clientCapabilities": caps or {}}}


tools = {"repo_buscar_simbolo": lambda a: "CalcularJuros em services/juros.py:42"}
r = despachar({"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": meta()}, tools)
print(r)
`;
  var testes = String.raw`def chamada(metodo, mid=1, **params):
    return {"jsonrpc": "2.0", "id": mid, "method": metodo, "params": params}


def test_lista_sem_initialize():
    r = despachar(chamada("tools/list", **meta()), tools)
    assert r["result"]["tools"] == [{"name": "repo_buscar_simbolo"}]


def test_chamada_devolve_conteudo_correlacionado():
    r = despachar(chamada("tools/call", mid=7, name="repo_buscar_simbolo", arguments={"simbolo": "X"}, **meta()), tools)
    assert r["id"] == 7 and "services/juros.py" in r["result"]["content"][0]["text"]


def test_initialize_nao_existe_mais():
    r = despachar(chamada("initialize", **meta()), tools)
    assert r["error"]["code"] == METHOD_NOT_FOUND


def test_versao_diferente_ou_ausente_e_recusada():
    assert despachar(chamada("tools/list", **meta("2025-11-25")), tools)["error"]["code"] == VERSION_MISMATCH
    assert despachar(chamada("tools/list"), tools)["error"]["code"] == VERSION_MISMATCH


def test_tool_desconhecida():
    r = despachar(chamada("tools/call", name="nao_existe", **meta()), tools)
    assert r["error"]["code"] == METHOD_NOT_FOUND


def test_ler_meta_devolve_versao_e_capacidades():
    versao, caps = ler_meta(meta(caps={"elicitation": {}}))
    assert versao == VERSAO and "elicitation" in caps


def test_elicitacao_so_com_capacidade_declarada():
    assert pode_elicitar(meta(caps={"elicitation": {}})) is True
    assert pode_elicitar(meta(caps={})) is False
    assert pode_elicitar({}) is False
`;
  var solucao = codigo
    .replace('    return None, {}\n', '    m = params.get("_meta", {}) if isinstance(params, dict) else {}\n    versao = m.get(P + "protocolVersion")\n    if versao is None:\n        raise ValueError("protocolVersion ausente")\n    return versao, m.get(P + "clientCapabilities", {})\n')
    .replace('    return True\n', '    try:\n        _, caps = ler_meta(params)\n    except ValueError:\n        return False\n    return "elicitation" in caps\n');

  var etapasAntiga = function () {
    return [
      { id: 'init', nome: 'initialize', descricao: 'protocolVersion + capabilities', tom: 'dns', ms: 1, linhas: [
        L('in', '-> initialize {protocolVersion, capabilities}'),
        L('out', '<- resultado + Mcp-Session-Id (capacidades negociadas UMA vez)'),
        L('hint', 'estado na instância do servidor: afinidade de sessão')] },
      { id: 'ini', nome: 'initialized', descricao: 'notificação, sem resposta', tom: 'tcp', ms: 1, linhas: [
        L('in', '-> notifications/initialized'),
        L('hint', 'sessão aberta; só agora o cliente pode listar')] },
      { id: 'list', nome: 'tools/list', descricao: 'descoberta', tom: 'request', ms: 1, linhas: [
        L('in', '-> tools/list'),
        L('out', '<- lista de ferramentas')] },
      { id: 'call', nome: 'tools/call', descricao: 'repo_buscar_simbolo', tom: 'response', ms: 1, linhas: [
        L('in', '-> tools/call repo_buscar_simbolo'),
        L('out', '<- resultado'),
        L('hint', 'o servidor guarda a sessão em memória; outra instância não a conhece')] }
    ];
  };
  var etapasNova = function () {
    return [
      { id: 'list', nome: 'tools/list', descricao: 'com _meta', tom: 'request', ms: 1, linhas: [
        L('in', '-> tools/list + _meta {protocolVersion, clientInfo, clientCapabilities}'),
        L('out', '<- lista de ferramentas'),
        L('hint', 'qualquer instância pode responder')] },
      { id: 'call', nome: 'tools/call', descricao: 'com _meta', tom: 'response', ms: 1, linhas: [
        L('in', '-> tools/call + _meta (headers Mcp-Method e Mcp-Name espelham o corpo)'),
        L('out', '<- resultado'),
        L('hint', 'sem initialize, sem sessão: escala atrás de um load balancer comum')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm09-b2',
    titulo: 'MCP por dentro: primitivas e o modelo sem estado',
    minutos: 35,
    resumo: 'Três primitivas, três donos (tool é do modelo, resource é da aplicação/usuário, prompt é do usuário). Na revisão 2026-07-28 não há initialize nem sessão, e o servidor não inicia requisições.',
    objetivo: 'Classificar capacidades como tool, resource ou prompt pela regra do controle, ler a anatomia de uma tool, desconfiar das annotations e explicar o modelo sem estado e o MRTR.',
    revisao: [
      { id: 'm09b2-prim', pergunta: 'O usuário quer anexar o mapa de arquitetura ao contexto quando decidir, sem gastar tokens quando não usar. Qual primitiva?',
        opcoes: [
          opc('a', 'Resource: controlada pela aplicação/usuário, endereçada por URI', true, 'regra do controle: modelo decide = tool; usuário/aplicação anexa = resource; usuário dispara = prompt.'),
          opc('b', 'Tool: controlada pelo modelo', false, 'tool custa tokens em toda chamada e o modelo decidiria quando usar.'),
          opc('c', 'Prompt: modelo de interação do usuário', false, 'prompt dispara um fluxo pronto (slash command), não anexa dado.')] },
      { id: 'm09b2-anot', pergunta: 'Um servidor declara readOnlyHint: true numa ferramenta. Posso dispensar o consentimento?',
        opcoes: [
          opc('a', 'Não: annotations são dicas, não garantias; um servidor malicioso pode declarar leitura numa ferramenta destrutiva', true, 'a especificação manda tratar descrições e annotations como não confiáveis, a menos que o servidor seja confiável.'),
          opc('b', 'Sim: o protocolo valida a annotation', false, 'o protocolo não valida o comportamento real.'),
          opc('c', 'Sim, se tiver outputSchema', false, 'outputSchema é contrato de saída, não de comportamento.')] },
      { id: 'm09b2-semestado', pergunta: 'O que mudou no modelo de conversa da revisão 2026-07-28?',
        opcoes: [
          opc('a', 'Sem handshake initialize e sem sessão; cada requisição carrega _meta e o servidor não inicia requisições', true, 'o fluxo é sempre cliente para servidor; qualquer instância pode atender qualquer requisição.'),
          opc('b', 'O initialize passou a ser obrigatório em toda chamada', false, 'o initialize deixou de existir nesta revisão.'),
          opc('c', 'A sessão passou a morar no cliente via Mcp-Session-Id', false, 'sem sessão de protocolo; o header deve ser ignorado.')] },
      { id: 'm09b2-cap', pergunta: 'O que o servidor não pode fazer, segundo a regra de ouro do modelo sem estado?',
        opcoes: [
          opc('a', 'Pedir ao cliente algo que ele não declarou suportar naquela requisição', true, 'mandar elicitation/create para um cliente sem a capacidade elicitation é violação de protocolo.'),
          opc('b', 'Responder sem ter guardado a sessão em memória', false, 'é exatamente o que o modelo sem estado permite.'),
          opc('c', 'Ler o _meta', false, 'ler o _meta é como o servidor sabe o que o cliente suporta.')] },
      { id: 'm09b2-roots', pergunta: 'Qual feature de cliente está depreciada na revisão 2026-07-28?',
        opcoes: [
          opc('a', 'Roots: migre para caminhos por parâmetro de ferramenta, URI de resource ou configuração do servidor', true, 'elicitation e sampling continuam ativas.'),
          opc('b', 'Elicitation', false, 'elicitation é o mecanismo recomendado de interação.'),
          opc('c', 'Sampling', false, 'sampling continua ativa.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Um servidor MCP oferece três tipos de capacidade, e a diferença entre elas é <strong>quem está no controle</strong>. Esse critério decide onde cada coisa sua deve entrar.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Primitiva</th><th>Controlada por</th><th>O que é</th><th>Métodos</th><th>Exemplo</th></tr></thead><tbody>' +
          '<tr><td><strong>Tools</strong></td><td>o modelo</td><td>funções que o modelo decide chamar</td><td><code>tools/list</code>, <code>tools/call</code></td><td>buscar símbolo, ler trecho, consultar grafo</td></tr>' +
          '<tr><td><strong>Resources</strong></td><td>a aplicação/usuário</td><td>dados endereçáveis por URI que o host pode anexar ao contexto</td><td><code>resources/list</code>, <code>resources/read</code>, <code>resources/templates/list</code></td><td><code>repo://acme/arquitetura.md</code>, <code>repo://acme/metricas.json</code></td></tr>' +
          '<tr><td><strong>Prompts</strong></td><td>o usuário</td><td>modelos de interação que o usuário invoca (viram slash commands)</td><td><code>prompts/list</code>, <code>prompts/get</code></td><td><code>/analisar-impacto</code>, <code>/revisar-modernizacao</code></td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'O erro nº 1 de design: transformar tudo em tool', html:
          '<p>Se o modelo deve decidir quando usar, é tool. Se o usuário quer trazer algo específico para o contexto ("anexe o mapa de arquitetura"), é resource: não polui a lista de ferramentas nem gasta tokens quando não é usado. Se o usuário quer disparar um fluxo pronto, é prompt. Colocar tudo em tools é expor toda a API como POST: funciona e joga fora a semântica. Cada tool custa tokens em toda chamada; resources e prompts, não. As três interfaces têm três públicos: uma API que o sistema chama, um arquivo que o usuário anexa e um comando que o usuário digita.</p>' },
        { tipo: 'texto', html: '<h3>Anatomia de uma tool</h3>' },
        { tipo: 'codigo', linguagem: 'json', texto: toolJson },
        { tipo: 'texto', html:
          '<p><code>outputSchema</code> permite saída <strong>estruturada e validável</strong>: o raciocínio do M05 bloco 2, agora na fronteira do protocolo. Para segurança, o mais importante: as <code>annotations</code> são <strong>dicas, não garantias</strong>. A especificação manda tratar descrições e annotations como <strong>não confiáveis</strong> a menos que venham de servidor confiável; um servidor malicioso pode declarar <code>readOnlyHint: true</code> numa ferramenta destrutiva. A annotation orienta a UI do host; não substitui autorização (bloco 7).</p>' },
        { tipo: 'takeaway', html: 'Quem controla decide a primitiva: <mark>modelo = tool</mark>, <mark>usuário/aplicação anexa = resource</mark>, <mark>usuário dispara = prompt</mark>; annotation é <mark>dica</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Features do cliente: o caminho inverso</h3>' +
          '<p>O servidor pode precisar de algo do cliente durante uma chamada. Estado em 2026-07-28:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Feature</th><th>Para quê</th><th>Estado</th></tr></thead><tbody>' +
          '<tr><td><strong>Elicitation</strong></td><td>pedir informação ao usuário no meio da execução ("qual repositório?")</td><td>ativa; é o mecanismo recomendado de interação</td></tr>' +
          '<tr><td><strong>Sampling</strong></td><td>pedir uma completude do modelo do cliente, sem o servidor ter chave de API própria</td><td>ativa</td></tr>' +
          '<tr><td><strong>Roots</strong></td><td>o cliente informa quais diretórios são relevantes</td><td><strong>depreciada</strong> nesta revisão: passe caminhos por parâmetro de ferramenta, URI de resource ou configuração do servidor</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>A mudança estrutural</h3>' +
          '<p>Nas revisões anteriores o servidor podia <em>enviar</em> uma requisição ao cliente no meio de uma operação (um <code>elicitation/create</code>). Isso acabou. Na revisão 2026-07-28 o fluxo é sempre cliente para servidor: quando o servidor precisa de algo, responde com um <code>InputRequiredResult</code> e o cliente <strong>refaz a chamada</strong> trazendo as respostas. O padrão se chama <strong>MRTR (Multi Round-Trip Requests)</strong> e o bloco 3 o detalha.</p>' +
          '<p>Por quê: requisições iniciadas pelo servidor exigiam conexão com estado e <strong>afinidade de sessão</strong>, o que impede escalar atrás de um load balancer comum e obriga armazenamento compartilhado entre instâncias. Com MRTR cada requisição é autossuficiente. É REST stateless com JWT aplicado a protocolo de agente.</p>' +
          '<p>Compare as duas eras. O material de 2024-11-05 a 2025-11-25 não está errado para aquela revisão, mas não é o que se implementa hoje.</p>' },
        { tipo: 'rode', id: 'eras-rode', titulo: 'Sessão antiga × fluxo atual', terminalTitulo: 'tráfego',
          enunciado: 'Rode o tráfego da era anterior e conte as mensagens antes de a primeira ferramenta rodar. O fluxo atual está na aba logo abaixo.',
          prefixo: '$', entrada: 'mcp-trace --era 2025-11-25', unidade: 'msg', etapas: etapasAntiga(),
          prever: { pergunta: 'Na era anterior, quantas mensagens o cliente envia antes do primeiro tools/call?', opcoes: [
            { id: 'a', texto: 'Três: initialize, notifications/initialized e tools/list.', correta: true, porque: 'o handshake abre a sessão (initialize + initialized) e a descoberta (tools/list) vem antes de chamar.' },
            { id: 'b', texto: 'Nenhuma: tools/call é sempre a primeira.', correta: false, porque: 'isso descreve a era atual, em que a negociação virou por requisição.' },
            { id: 'c', texto: 'Uma: só o initialize.', correta: false, porque: 'depois do initialize ainda há a notificação initialized.' }
          ] },
          tutorAntes: 'Aperte Enter, faça a previsão e clique em "tools/call" para ler a dica sobre afinidade de sessão.',
          tutorDepois: 'Na era anterior o estado de sessão ficava na instância do servidor. Na atual, o mesmo objetivo se resolve em requisições independentes, com a negociação dentro de cada uma (veja o bloco "Modelo sem estado" abaixo).',
          callout: 'Você viu o custo do handshake com sessão: afinidade de instância.' },
        { tipo: 'abas', rotulo: 'Era', itens: [
          { rotulo: 'Fluxo atual (2026-07-28)', blocos: [
            { tipo: 'codigo', linguagem: 'text', texto:
              '-> tools/list + _meta {protocolVersion, clientInfo, clientCapabilities}\n' +
              '<- lista de ferramentas              (qualquer instância pode responder)\n' +
              '-> tools/call + _meta               (headers Mcp-Method e Mcp-Name espelham o corpo)\n' +
              '<- resultado                         (sem initialize, sem sessão)' },
            { tipo: 'texto', html: '<p>Sem handshake e sem sessão de protocolo: a negociação virou <strong>por requisição</strong>, via <code>_meta</code>. Escala atrás de um load balancer comum.</p>' }] },
          { rotulo: 'Sessão antiga (2024-11-05 a 2025-11-25)', blocos: [
            { tipo: 'codigo', linguagem: 'text', texto:
              '-> initialize {protocolVersion, capabilities}\n' +
              '<- resultado + Mcp-Session-Id        (capacidades negociadas UMA vez)\n' +
              '-> notifications/initialized\n' +
              '-> tools/list\n' +
              '<- lista de ferramentas\n' +
              '-> tools/call repo_buscar_simbolo\n' +
              '<- resultado                         (o servidor guarda a sessão em memória)' },
            { tipo: 'texto', html: '<p>Estado na instância do servidor, com afinidade de sessão. Se um tutorial fala de <code>initialize</code> ou <code>Mcp-Session-Id</code>, é de outra era.</p>' }] }
        ] },
        { tipo: 'texto', html: '<h3>O modelo sem estado</h3><p>Não existe mais o <code>initialize</code> que abria uma sessão e negociava capacidades uma vez. Agora <strong>cada requisição</strong> carrega os próprios metadados:</p>' },
        { tipo: 'codigo', linguagem: 'json', texto: metaJson },
        { tipo: 'texto', html:
          '<p>Repare em <code>clientCapabilities</code> em toda requisição. Dela decorre a regra de ouro: <strong>o servidor não pode pedir ao cliente algo que ele não declarou suportar naquela requisição</strong>. Mandar um <code>elicitation/create</code> a um cliente sem a capacidade <code>elicitation</code> é violação de protocolo.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'E o servidor que você escreveu no M00?', html:
          '<p>Seguia o modelo antigo (<code>initialize</code>, sessão, transporte "HTTP+SSE"). Não está "errado": está numa revisão anterior, e a especificação define compatibilidade retroativa (clientes modernos detectam a era do servidor e caem para o modelo antigo). Três consequências: (1) ao ler um tutorial, verifique a revisão; (2) os SDKs abstraem boa parte disso, então mantenha o seu atualizado e leia o changelog; (3) em prova de conceito local com stdio a diferença mal aparece, e dói quando você vai para HTTP e escala.</p>' },
        { tipo: 'texto', html:
          '<h3>Utilidades e extensões</h3>' +
          '<p>Além das primitivas, o protocolo define utilidades: <strong>progresso</strong>, <strong>cancelamento</strong>, <strong>logging</strong>, <strong>paginação</strong> e <strong>subscriptions</strong> (avisos de mudança, como "a lista de ferramentas mudou"). E <strong>extensões opcionais</strong>, negociadas explicitamente:</p>' +
          '<ul><li><strong>Tasks</strong>: execução assíncrona de operações longas, com polling, entrada no meio do caminho e identificadores duráveis; é o padrão 202+job do M05 bloco 4 padronizado no protocolo (ingerir um repositório leva minutos).</li>' +
          '<li><strong>Skills over MCP</strong>: instruções estruturadas para fluxos de trabalho, descobertas e consumidas via MCP; parente das skills do M00.</li>' +
          '<li><strong>MCP Apps</strong>: elementos de UI interativos (gráficos, formulários) renderizados dentro da conversa.</li></ul>' },
        { tipo: 'takeaway', html: 'Sem <mark>initialize</mark>, sem <mark>sessão</mark>: cada requisição traz seu <mark>_meta</mark>, e o servidor não pede o que o cliente não declarou.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'complete', id: 'prim-complete', titulo: 'Classifique as capacidades do Cartógrafo', obrigatorio: false,
          enunciado: 'Para cada capacidade, escolha a primitiva pela regra do controle.',
          linguagem: 'text',
          partes: [
            'buscar um símbolo, quando o modelo decidir        -> ', { lacuna: 'p1', opcoes: ['tool', 'resource', 'prompt'], correta: 'tool' },
            '\nanexar o mapa de arquitetura quando o usuário pedir -> ', { lacuna: 'p2', opcoes: ['tool', 'resource', 'prompt'], correta: 'resource' },
            '\ncomando /analisar-impacto digitado pelo usuário      -> ', { lacuna: 'p3', opcoes: ['tool', 'resource', 'prompt'], correta: 'prompt' },
            '\nconsultar o grafo de dependências a partir de um nó  -> ', { lacuna: 'p4', opcoes: ['tool', 'resource', 'prompt'], correta: 'tool' },
            '\nmétricas de acoplamento em JSON, endereçadas por URI -> ', { lacuna: 'p5', opcoes: ['tool', 'resource', 'prompt'], correta: 'resource' },
            '\nfluxo pronto /revisar-modernizacao                   -> ', { lacuna: 'p6', opcoes: ['tool', 'resource', 'prompt'], correta: 'prompt' },
            '\n'
          ],
          explicacao: 'Modelo decide = tool; usuário/aplicação anexa = resource (não gasta tokens quando não usado); usuário dispara um fluxo pronto = prompt.',
          callout: 'Você classificou as seis capacidades pela regra do controle.' },
        { tipo: 'python', id: 'sem-estado-python', titulo: 'Despache sem sessão', obrigatorio: false,
          enunciado: 'O servidor abaixo não guarda sessão. Complete <code>ler_meta(params)</code> (versão e capacidades vêm do <code>_meta</code> de <em>cada</em> requisição) e <code>pode_elicitar(params)</code> (só com a capacidade <code>elicitation</code> declarada naquela requisição). Neste núcleo de estudo, <code>initialize</code> cai em método desconhecido e versão ausente também é recusada. Os códigos <code>-32601</code> (método desconhecido) e <code>-32000</code> (versão, convenção do laboratório) são os do <code>proto_lab</code>.',
          codigo: codigo, testes: testes,
          dica: 'As chaves têm o prefixo <code>P</code>: <code>m.get(P + "protocolVersion")</code>. Sem versão, levante <code>ValueError</code>. Em <code>pode_elicitar</code>, capture esse <code>ValueError</code> e devolva <code>False</code>.',
          solucao: solucao,
          tutorDepois: 'Nada ficou guardado entre uma chamada e outra: por isso qualquer instância atende qualquer requisição.',
          callout: 'O despacho sem sessão e a regra de capacidade por requisição passaram nos testes.' },
        { tipo: 'transcript', id: 'eras-transcript', titulo: 'Qual afirmação do tutorial está desatualizada?', obrigatorio: false, terminalTitulo: 'tutorial encontrado na web',
          enunciado: 'Você lê um tutorial sobre MCP e confere cada afirmação contra a revisão 2026-07-28. Clique nas linhas que descrevem a era anterior ou que contradizem a especificação e aperte Conferir.',
          linhas: [
            { quem: 'agente', texto: 'Tools são controladas pelo modelo; resources pelo usuário/aplicação; prompts pelo usuário.' },
            { quem: 'agente', texto: 'Todo cliente começa com initialize e guarda o Mcp-Session-Id para as chamadas seguintes.' },
            { quem: 'agente', texto: 'Cada requisição carrega a versão do protocolo e as capacidades do cliente em _meta.' },
            { quem: 'agente', texto: 'Quando precisa de dado do usuário, o servidor envia um elicitation/create pelo stream SSE aberto com GET.' },
            { quem: 'agente', texto: 'Se a tool declara readOnlyHint: true, o host pode dispensar o consentimento.' }
          ],
          erradas: [1, 3, 4],
          explicacao: {
            1: 'era anterior: na revisão 2026-07-28 não há handshake initialize nem sessão de protocolo; o Mcp-Session-Id deve ser ignorado.',
            3: 'era anterior: servidor não inicia requisições. Usa-se MRTR (InputRequiredResult e nova chamada do cliente), e GET no endpoint responde 405.',
            4: 'annotations são dicas, não garantias; um servidor malicioso pode declarar leitura numa ferramenta destrutiva. Annotation orienta a UI, não substitui autorização.'
          },
          tutorDepois: 'Reconhecimento em três segundos: initialize, Mcp-Session-Id ou GET abrindo SSE são sinais de outra era.' },
        { tipo: 'takeaway', html: 'O servidor <mark>sem estado</mark> lê tudo do <mark>_meta</mark> da requisição, e <mark>pedir capacidade não declarada</mark> é violação.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'prim-escolha', titulo: 'Confira: onde entra o mapa de arquitetura',
          pergunta: 'O Cartógrafo gera um mapa de arquitetura em Mermaid que o usuário às vezes quer anexar à conversa. Como expor?',
          opcoes: [
            opc('a', 'Como resource repo://{repo}/arquitetura: o usuário anexa quando quer e não gasta tokens quando não usa.', true, 'a aplicação/usuário controla a anexação, e resource não ocupa a lista de ferramentas.'),
            opc('b', 'Como tool, para o modelo ler sempre que quiser.', false, 'tool custa tokens em toda chamada e o caso é de dado endereçável.'),
            opc('c', 'Como prompt, porque é texto.', false, 'prompt dispara um fluxo; não é dado anexável.'),
            opc('d', 'Tanto faz: a escolha é estética.', false, 'a escolha é decisão de arquitetura pelo controle.')],
          tutorDepois: 'Tudo-como-tool joga fora semântica e tokens.' },
        { tipo: 'escolha', id: 'meta-escolha', titulo: 'Confira: capacidade não declarada',
          pergunta: 'Uma requisição tools/call chega com clientCapabilities vazio e a ferramenta precisaria perguntar o repositório ao usuário. O que o servidor faz?',
          opcoes: [
            opc('a', 'Envia um elicitation/create mesmo assim e espera.', false, 'é violação de protocolo e, nesta revisão, o servidor nem inicia requisições.'),
            opc('b', 'Não pede elicitation; devolve erro acionável ou usa um parâmetro explícito da ferramenta.', true, 'o servidor não pode pedir o que o cliente não declarou suportar naquela requisição.'),
            opc('c', 'Assume que o cliente suporta, pois suportou na requisição anterior.', false, 'não há sessão: a negociação é por requisição.')],
          tutorDepois: 'Cada requisição se declara sozinha.' },
        { tipo: 'takeaway', html: 'Três primitivas, três donos; <mark>annotation não é garantia</mark>; capacidade vale <mark>por requisição</mark>.' }
      ] }
    ]
  });
})();
