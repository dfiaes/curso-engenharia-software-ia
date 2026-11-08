/* M09 · Bloco 3: Transportes. Fonte: M09.html#b03. Especificação MCP revisão 2026-07-28, verificada em 14/09/2026 (revalidar em até 90 dias). Códigos -32000/-32001/-32002 são convenção do proto_lab; -32020 (HeaderMismatch) vem da fonte. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var RESP = '{"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"CalcularJuros em services/juros.py:42"}]}}';

  var codigoHttp = String.raw`import json

ORIGENS = {"http://localhost:3000"}
MRTR_COM_NOME = {"tools/call", "prompts/get"}  # métodos cujo Mcp-Name espelha params.name


def validar_http(metodo_http, headers, corpo, origens=ORIGENS):
    """Valida uma requisição ao endpoint /mcp. Devolve (status, codigo_jsonrpc_ou_None).

    Ordem: GET/DELETE -> 405; Origin presente e fora de origens -> 403;
    MCP-Protocol-Version ausente -> 400 (-32000);
    Mcp-Method (e Mcp-Name em tools/call e prompts/get) diferente do corpo -> 400 (-32020).
    Nomes de header não diferenciam maiúsculas de minúsculas.
    """
    return 200, None


h = {"Mcp-Method": "tools/call", "Mcp-Name": "repo_buscar_simbolo", "MCP-Protocol-Version": "2026-07-28"}
c = {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "repo_buscar_simbolo"}}
print(validar_http("POST", h, c))
`;
  var testesHttp = String.raw`H = {"Mcp-Method": "tools/call", "Mcp-Name": "repo_buscar_simbolo", "MCP-Protocol-Version": "2026-07-28"}
C = {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "repo_buscar_simbolo", "arguments": {}}}


def test_requisicao_valida():
    assert validar_http("POST", H, C) == (200, None)


def test_get_e_delete_sao_405():
    assert validar_http("GET", H, C)[0] == 405
    assert validar_http("DELETE", H, C)[0] == 405


def test_origin_invalido_e_403():
    assert validar_http("POST", {**H, "Origin": "https://site-malicioso.example"}, C)[0] == 403
    assert validar_http("POST", {**H, "Origin": "http://localhost:3000"}, C) == (200, None)


def test_header_diferente_do_corpo_e_header_mismatch():
    assert validar_http("POST", {**H, "Mcp-Method": "tools/list"}, C) == (400, -32020)
    assert validar_http("POST", {**H, "Mcp-Name": "outra_tool"}, C) == (400, -32020)


def test_nome_de_header_sem_diferenca_de_caixa():
    h = {k.lower(): v for k, v in H.items()}
    assert validar_http("POST", h, C) == (200, None)


def test_versao_ausente_e_400():
    h = {k: v for k, v in H.items() if k != "MCP-Protocol-Version"}
    assert validar_http("POST", h, C) == (400, -32000)


def test_list_nao_exige_mcp_name():
    h = {"Mcp-Method": "tools/list", "MCP-Protocol-Version": "2026-07-28"}
    assert validar_http("POST", h, {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}) == (200, None)
`;
  var solucaoHttp = String.raw`import json

ORIGENS = {"http://localhost:3000"}
MRTR_COM_NOME = {"tools/call", "prompts/get"}


def validar_http(metodo_http, headers, corpo, origens=ORIGENS):
    h = {k.lower(): v for k, v in headers.items()}
    if metodo_http in ("GET", "DELETE"):
        return 405, None
    if "origin" in h and h["origin"] not in origens:
        return 403, None
    if "mcp-protocol-version" not in h:
        return 400, -32000
    metodo = corpo.get("method")
    if h.get("mcp-method") != metodo:
        return 400, -32020
    if metodo in MRTR_COM_NOME:
        if h.get("mcp-name") != corpo.get("params", {}).get("name"):
            return 400, -32020
    return 200, None
`;

  var codigoEstado = String.raw`import hashlib
import hmac


def assinar(payload, principal, chave, agora, ttl=300):
    """requestState: 'MAC.principal|expira|payload'. O MAC cobre tudo depois do ponto."""
    exp = int(agora) + ttl
    corpo = f"{principal}|{exp}|{payload}"
    mac = hmac.new(chave, corpo.encode(), hashlib.sha256).hexdigest()
    return f"{mac}.{corpo}"


def verificar(token, chave, principal, agora):
    """Devolve o payload se o estado for íntegro, do mesmo principal e dentro do TTL; senão None.

    Trate o token como entrada controlada por atacante: nunca confie sem verificar.
    """
    mac, _, corpo = token.partition(".")
    quem, exp, payload = corpo.split("|", 2)
    return payload


K = b"chave-so-do-servidor"
t = assinar("escolher_repo:PagamentoService", "ana", K, agora=1000)
print(verificar(t, K, "ana", agora=1010))
`;
  var testesEstado = String.raw`K = b"chave-so-do-servidor"


def test_ida_e_volta():
    t = assinar("escolher_repo:PagamentoService", "ana", K, agora=1000)
    assert verificar(t, K, "ana", agora=1010) == "escolher_repo:PagamentoService"


def test_payload_adulterado_e_rejeitado():
    t = assinar("repo=A", "ana", K, agora=1000)
    assert verificar(t.replace("repo=A", "repo=B"), K, "ana", agora=1010) is None


def test_expirado_e_rejeitado():
    t = assinar("x", "ana", K, agora=1000, ttl=60)
    assert verificar(t, K, "ana", agora=1060) == "x"
    assert verificar(t, K, "ana", agora=1061) is None


def test_outro_principal_e_rejeitado():
    t = assinar("x", "ana", K, agora=1000)
    assert verificar(t, K, "beto", agora=1010) is None


def test_chave_errada_e_rejeitada():
    t = assinar("x", "ana", K, agora=1000)
    assert verificar(t, b"outra", "ana", agora=1010) is None


def test_lixo_nao_levanta_excecao():
    for ruim in ("", "abc", "....", "zz.a|b|c"):
        assert verificar(ruim, K, "ana", agora=1000) is None


def test_payload_pode_conter_barra_e_ponto():
    t = assinar("a|b.c", "ana", K, agora=1000)
    assert verificar(t, K, "ana", agora=1000) == "a|b.c"
`;
  var solucaoEstado = String.raw`import hashlib
import hmac


def assinar(payload, principal, chave, agora, ttl=300):
    exp = int(agora) + ttl
    corpo = f"{principal}|{exp}|{payload}"
    mac = hmac.new(chave, corpo.encode(), hashlib.sha256).hexdigest()
    return f"{mac}.{corpo}"


def verificar(token, chave, principal, agora):
    mac, _, corpo = token.partition(".")
    esperado = hmac.new(chave, corpo.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(esperado.encode(), mac.encode()):
        return None
    try:
        quem, exp, payload = corpo.split("|", 2)
        expira = int(exp)
    except ValueError:
        return None
    if quem != principal or agora > expira:
        return None
    return payload
`;

  TrilhaAula.registrar({
    id: 'm09-b3',
    titulo: 'Transportes: stdio e Streamable HTTP',
    minutos: 40,
    resumo: 'Transporte é só um binding: a semântica do protocolo é a mesma. stdio roda local e não tolera nada em stdout além do protocolo; Streamable HTTP é remoto, valida headers e Origin, e o MRTR devolve o estado pelas mãos do cliente.',
    objetivo: 'Escolher o transporte pelo critério certo, diagnosticar um servidor stdio que não conecta, validar uma requisição HTTP (headers, Origin) e proteger o requestState do MRTR.',
    revisao: [
      { id: 'm09b3-stdout', pergunta: 'Seu servidor stdio "simplesmente não conecta", com erro genérico de protocolo. Qual a primeira hipótese?',
        opcoes: [
          opc('a', 'Algo escreveu em stdout (print de debug ou aviso de biblioteca) e corrompeu o JSON-RPC; logs vão para stderr ou arquivo', true, 'cada linha de stdout é uma mensagem JSON-RPC; linha que não é JSON vira "mensagem malformada" e o cliente desconecta.'),
          opc('b', 'A porta está ocupada', false, 'porta é assunto do transporte HTTP.'),
          opc('c', 'Falta certificado TLS', false, 'TLS também é assunto do transporte HTTP.')] },
      { id: 'm09b3-origin', pergunta: 'Por que o servidor HTTP local deve validar o header Origin e ligar em 127.0.0.1?',
        opcoes: [
          opc('a', 'Para impedir que um site aberto no navegador fale com o servidor local via DNS rebinding e use as permissões do usuário', true, 'sem Origin validado (403 se inválido) e sem bind em loopback, uma página maliciosa vira cliente.'),
          opc('b', 'Para acelerar o handshake', false, 'não existe mais handshake nesta revisão e o objetivo é segurança.'),
          opc('c', 'Porque o Origin substitui a autenticação', false, 'para tudo que não for local, autenticação é obrigatória.')] },
      { id: 'm09b3-mismatch', pergunta: 'O header Mcp-Method diz tools/list, mas o corpo diz tools/call. O que o servidor faz?',
        opcoes: [
          opc('a', 'Rejeita com 400 e o erro HeaderMismatch (-32020)', true, 'se o balanceador roteia por header e o servidor executa pelo corpo, um atacante que os faça divergir passa por cima da política; é o raciocínio do request smuggling.'),
          opc('b', 'Executa o que está no corpo, que é a fonte de verdade', false, 'é exatamente a divergência que o atacante explora.'),
          opc('c', 'Executa o que está no header', false, 'os dois precisam bater; a regra é rejeitar a divergência.')] },
      { id: 'm09b3-state', pergunta: 'Como tratar o requestState que o MRTR devolve ao servidor pelas mãos do cliente?',
        opcoes: [
          opc('a', 'Como entrada controlada por atacante: HMAC/AEAD, TTL curto, principal autenticado e identificador da requisição de origem', true, 'estado que atravessa a fronteira volta contaminado; assine, cifre se for confidencial e nunca confie sem verificar.'),
          opc('b', 'Como dado confiável, porque o servidor o gerou', false, 'ele passou pelas mãos do cliente.'),
          opc('c', 'Descartar: MRTR não precisa de estado', false, 'o estado é como o servidor recupera o contexto sem guardar sessão.')] },
      { id: 'm09b3-removido', pergunta: 'O que não existe mais no Streamable HTTP da revisão 2026-07-28?',
        opcoes: [
          opc('a', 'GET abrindo stream permanente, sessão via Mcp-Session-Id e requisições iniciadas pelo servidor', true, 'GET/DELETE devem responder 405; o header de sessão deve ser ignorado; notificações vêm de subscriptions/listen.'),
          opc('b', 'O POST com resposta JSON ou SSE', false, 'o POST continua sendo a unidade do transporte.'),
          opc('c', 'O header MCP-Protocol-Version', false, 'continua obrigatório.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Transporte parece detalhe até você precisar publicar o servidor para o time; aí ele vira a decisão de arquitetura. É também a parte da especificação que mais mudou, o que significa que a maior parte do material disponível está desatualizada. A boa notícia: <strong>a semântica do protocolo é idêntica nos dois transportes</strong>. Transporte é só um <strong>binding</strong>: define como a mensagem é enquadrada e entregue, não o que ela significa.</p>' +
          '<h3>stdio: o transporte local</h3>' +
          '<p>O cliente <strong>inicia o servidor como subprocesso</strong> e conversa por entrada e saída padrão, com mensagens JSON-RPC delimitadas por quebra de linha. O cliente escreve em <code>stdin</code> e lê de <code>stdout</code>; <code>stderr</code> é para logs.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto:
          'Cliente (host)                      Servidor (subprocesso)\n' +
          '  escreve em stdin  -----------------> lê de stdin\n' +
          '  {"jsonrpc":"2.0","id":1,...}\\n\n' +
          '  lê de stdout      <----------------- escreve em stdout\n' +
          '  {"jsonrpc":"2.0","id":1,"result":...}\\n\n' +
          '  stderr <--------------------------- LOGS vão aqui (nunca em stdout!)' },
        { tipo: 'callout', tom: 'danger', titulo: 'A armadilha nº 1 do stdio', html:
          '<p>Qualquer coisa impressa em <strong>stdout</strong> corrompe o protocolo: um <code>print("debug")</code> esquecido, um aviso de biblioteca, um <code>warning</code> do Python. Vira "mensagem JSON-RPC malformada" e o cliente desconecta com um erro que não diz nada. <strong>Logs vão para stderr, sempre</strong>, ou para arquivo. Servidor stdio que "simplesmente não conecta": esta é a primeira hipótese.</p>' },
        { tipo: 'texto', html:
          '<p><strong>Quando usar stdio:</strong> ferramenta local para o dev (filesystem, git, banco local, índice do repositório na máquina). Vantagens: sem rede, sem autenticação a implementar (o processo herda as permissões do usuário), latência mínima, ciclo de vida do cliente. Desvantagens: um processo por cliente, nada compartilhado, atualizar exige redistribuir o binário ou script.</p>' +
          '<h3>Streamable HTTP: o transporte remoto</h3>' +
          '<p>Um <strong>único endpoint HTTP</strong> que aceita <code>POST</code>. Cada mensagem JSON-RPC é um POST; a resposta vem como JSON simples <em>ou</em> como stream SSE daquela requisição, quando o servidor quer mandar progresso antes do resultado final.</p>' },
        { tipo: 'codigo', linguagem: 'http', texto:
          'POST /mcp HTTP/1.1\n' +
          'Content-Type: application/json\n' +
          'Accept: application/json, text/event-stream     <- o cliente precisa aceitar os dois\n' +
          'MCP-Protocol-Version: 2026-07-28                <- obrigatório\n' +
          'Mcp-Method: tools/call                          <- obrigatório (espelha o body)\n' +
          'Mcp-Name: repo_buscar_simbolo                   <- obrigatório em tools/call, resources/read, prompts/get\n\n' +
          '{ "jsonrpc":"2.0", "id":1, "method":"tools/call",\n' +
          '  "params": { "name":"repo_buscar_simbolo", "arguments":{...},\n' +
          '              "_meta": { "io.modelcontextprotocol/protocolVersion":"2026-07-28", ... } } }' },
        { tipo: 'texto', html:
          '<p>Os headers espelham campos do corpo <strong>de propósito</strong>: load balancers, gateways e observabilidade roteiam e inspecionam sem parsear o JSON. Em troca, o servidor precisa <strong>validar que header e corpo batem</strong>, rejeitando com <code>400</code> e o erro <code>HeaderMismatch</code> (<code>-32020</code>). Se o balanceador roteia por header e o servidor executa pelo corpo, um atacante que os faça divergir passa por cima da política de roteamento: o mesmo raciocínio do <em>request smuggling</em>.</p>' },
        { tipo: 'takeaway', html: 'Transporte é <mark>binding</mark>, a semântica não muda; em stdio <mark>stdout só carrega protocolo</mark>, e em HTTP <mark>header e corpo têm de bater</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'quebre', id: 'stdout-quebre', titulo: 'O stdout que quebra o protocolo', terminalTitulo: 'servidor stdio',
          enunciado: 'O cliente stdio lê cada linha de stdout como uma mensagem JSON-RPC. Rode sem falha e depois com o log de debug indo para stdout. O terminal aplica um <code>JSON.parse</code> por linha, como o cliente faria (cenário didático, sem processo real).',
          prefixo: '$', entrada: 'echo \'{"jsonrpc":"2.0","id":1,"method":"tools/call"}\' | python server.py', unidade: 'linhas',
          etapas: [
            { id: 'srv', nome: 'Servidor escreve', descricao: 'o que vai para stdout', tom: 'request', ms: 1, linhas: [
              L('out', RESP.slice(0, 66) + '…'),
              L('hint', 'log de debug em stderr: visível no terminal, fora do protocolo')] },
            { id: 'cli', nome: 'Cliente lê linha a linha', descricao: 'JSON.parse por linha', tom: 'response', ms: 1, linhas: [
              L('in', 'linha 1: JSON-RPC válido (id 1, result)'),
              L('out', 'tudo certo: stdout só carrega protocolo')] }
          ],
          falhas: [
            { id: 'print', rotulo: 'print("debug") em stdout', efeito: { etapaFalha: 'cli', linhasErro: [
              L('out', 'linha 1: debug: recebi tools/call repo_buscar_simbolo'),
              L('hint', '-> NÃO é JSON: mensagem malformada'),
              L('out', 'o cliente desconecta com um erro genérico de protocolo')],
              tutor: 'A primeira linha de stdout não é JSON. Em servidor stdio que "não conecta", a primeira hipótese é algo escrevendo em stdout: print, aviso de biblioteca ou warning. Mova o log para stderr ou arquivo.' } }
          ],
          prever: { pergunta: 'Com o print de debug indo para stdout, o que o cliente faz ao ler a primeira linha?', opcoes: [
            { id: 'a', texto: 'Ignora a linha e segue com as seguintes.', correta: false, porque: 'cada linha é uma mensagem JSON-RPC; não há "linha de log" tolerada.' },
            { id: 'b', texto: 'Falha ao parsear, considera a mensagem malformada e desconecta, com erro genérico.', correta: true, porque: 'é por isso que o sintoma é um erro que "não diz nada".' },
            { id: 'c', texto: 'Mostra o debug ao usuário.', correta: false, porque: 'o canal de debug é stderr, não stdout.' }
          ] },
          tutorAntes: 'Rode sem falha primeiro; depois escolha a falha, faça a previsão e rode de novo.',
          tutorDepois: 'Sem falha, stdout carrega só JSON-RPC. Com o debug em stdout, o cliente cai.',
          callout: 'Você viu um print de debug derrubar o servidor stdio e a correção: logs em stderr.' },
        { tipo: 'texto', html:
          '<h3>O que sumiu nesta revisão</h3>' +
          '<p>Como reconhecer material desatualizado em três segundos: se fala de <code>Mcp-Session-Id</code>, de "abrir uma conexão SSE" com GET ou de <code>initialize</code>, é de outra era. Não está errado <em>para aquela revisão</em>, mas não é o que implementar hoje.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Antes (2025-03-26 a 2025-11-25)</th><th>Agora (2026-07-28)</th></tr></thead><tbody>' +
          '<tr><td>GET no endpoint abria um stream permanente para mensagens do servidor</td><td><strong>removido</strong>: GET/DELETE devem responder <code>405</code>; notificações de mudança vêm de <code>subscriptions/listen</code>, cuja resposta é o stream</td></tr>' +
          '<tr><td>Sessão via header <code>Mcp-Session-Id</code>, encerrada com DELETE</td><td><strong>removida</strong>: sem sessão de protocolo; o header deve ser ignorado</td></tr>' +
          '<tr><td>Servidor podia enviar requisições pelo stream SSE</td><td><strong>proibido</strong>: usa-se MRTR</td></tr>' +
          '<tr><td>Streams retomáveis com <code>Last-Event-ID</code></td><td>não suportado</td></tr>' +
          '<tr><td>Transporte "HTTP+SSE" com dois endpoints (2024-11-05)</td><td>depreciado desde 2025-03-26</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Duas exigências de segurança do transporte HTTP que você <strong>não</strong> pode pular:</p>' +
          '<ul><li><strong>Validar o header <code>Origin</code></strong> em toda requisição, respondendo <code>403</code> se inválido. Sem isso, um site malicioso aberto no navegador pode falar com o seu servidor MCP local via <strong>DNS rebinding</strong>, e ele roda com as permissões do usuário.</li>' +
          '<li><strong>Ligar em <code>127.0.0.1</code></strong>, não em <code>0.0.0.0</code>, quando local. E autenticação para tudo que não for local.</li></ul>' +
          '<p>Detalhe operacional (M05 bloco 4): ao abrir stream SSE, mande <code>X-Accel-Buffering: no</code>, senão o proxy reverso segura os eventos. Em streams longos (<code>subscriptions/listen</code>), emita comentários SSE periódicos (<code>:\\r\\n</code>) como keep-alive.</p>' },
        { tipo: 'takeaway', html: 'Sem <mark>sessão</mark> e sem <mark>GET</mark>; <mark>Origin validado</mark> e bind em <mark>127.0.0.1</mark> quando local.' }
      ] },

      { rotulo: 'MRTR e estado', blocos: [
        { tipo: 'texto', html:
          '<h3>MRTR: o servidor pede algo sem iniciar requisição</h3>' +
          '<p>O padrão que substituiu as requisições servidor para cliente, com <code>tools/call</code>:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto:
          '1. Cliente  -> tools/call (id: 1, argumentos)\n' +
          '2. Servidor <- InputRequiredResult:\n' +
          '              { "resultType": "input_required",\n' +
          '                "inputRequests": {\n' +
          '                   "escolher_repo": { "method": "elicitation/create",\n' +
          '                                      "params": { "mode": "form", "message": "Qual repositório?",\n' +
          '                                                  "requestedSchema": { ... } } } },\n' +
          '                "requestState": "<blob opaco, protegido por AEAD>" }\n' +
          '   a requisição 1 TERMINA aqui. Não há conexão pendurada.\n' +
          '3. Cliente pergunta ao usuário, obtém a resposta\n' +
          '4. Cliente  -> tools/call (id: 2, MESMOS argumentos + inputResponses + requestState)\n' +
          '5. Servidor <- Resultado final' },
        { tipo: 'texto', html:
          '<ul><li><strong><code>requestState</code> é opaco para o cliente e atacável pelo servidor.</strong> É como o servidor recupera o contexto sem guardar estado, mas volta pelas mãos do cliente: trate como <strong>entrada controlada por atacante</strong>, proteja a integridade (HMAC/AEAD) e rejeite o que não verificar. Se influencia autorização, isso não é opcional.</li>' +
          '<li><strong>Contra replay:</strong> inclua no blob o principal autenticado (rejeite se vier de outro), um TTL curto e um identificador da requisição de origem (método + digest dos parâmetros). Isso limita a janela; se a operação precisa ser de uso único (resgate, cobrança), o servidor tem que garanti-lo do lado dele.</li>' +
          '<li>O <code>id</code> do JSON-RPC <strong>muda</strong> entre a tentativa e a retomada: são requisições independentes, o que permite outra instância atender a segunda.</li>' +
          '<li>Só três métodos aceitam MRTR: <code>tools/call</code>, <code>resources/read</code> e <code>prompts/get</code>.</li></ul>' +
          '<p>MRTR é <strong>continuação por token autocontido</strong>, o mesmo padrão do token de paginação ou do estado de um fluxo de autorização: servidor sem estado escala horizontalmente e sobrevive a restart; sessão em memória exige afinidade e morre com a instância.</p>' },
        { tipo: 'ordene', id: 'mrtr-ordene', titulo: 'Ordene o ciclo MRTR', obrigatorio: false,
          enunciado: 'Monte o ciclo de uma operação que precisa de entrada do usuário no meio.',
          itens: [
            { id: 'retoma', texto: 'Cliente envia nova <code>tools/call</code> com os mesmos argumentos + <code>inputResponses</code> + <code>requestState</code>' },
            { id: 'ir', texto: 'Servidor responde <code>InputRequiredResult</code> com <code>inputRequests</code> e <code>requestState</code>; a requisição termina' },
            { id: 'final', texto: 'Servidor verifica a integridade do estado e devolve o resultado final' },
            { id: 'call', texto: 'Cliente envia <code>tools/call</code> com os argumentos' },
            { id: 'pergunta', texto: 'O cliente (host) pergunta ao usuário e obtém a resposta' }
          ], solucao: ['call', 'ir', 'pergunta', 'retoma', 'final'],
          callout: 'Você montou o ciclo: a requisição 1 termina e a retomada traz tudo de que o servidor precisa.' },
        { tipo: 'python', id: 'estado-python', titulo: 'Proteja o requestState', obrigatorio: false,
          enunciado: 'Complete <code>verificar</code>: o estado volta pelas mãos do cliente, então só devolve o payload se o MAC bater, o principal for o mesmo e o TTL não tiver vencido. Use <code>hmac.compare_digest</code>. Qualquer lixo devolve <code>None</code>, nunca exceção. (Subconjunto de estudo; o formato real do blob pertence ao SDK.)',
          codigo: codigoEstado, testes: testesEstado,
          dica: 'Recalcule o MAC sobre o <code>corpo</code> inteiro e compare com <code>mac</code>. Só depois separe <code>quem|exp|payload</code> (com <code>ValueError</code> tratado) e confira <code>quem == principal</code> e <code>agora &lt;= exp</code>.',
          solucao: solucaoEstado,
          tutorDepois: 'O principal e o TTL dentro do MAC limitam o replay. Operação de uso único ainda exige garantia no servidor.',
          callout: 'O estado adulterado, expirado ou de outro principal foi rejeitado nos testes.' },
        { tipo: 'takeaway', html: 'O <mark>requestState</mark> volta como <mark>entrada de atacante</mark>: MAC, TTL e principal; o que não verifica, rejeita.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html: '<h3>Configurar e escolher</h3><p>O formato do arquivo varia por cliente; a ideia é esta.</p>' },
        { tipo: 'abas', rotulo: 'Transporte', itens: [
          { rotulo: 'stdio', blocos: [
            { tipo: 'codigo', linguagem: 'json', texto:
              '{\n  "mcpServers": {\n    "cartografo": {\n      "command": "uvx",\n      "args": ["cartografo-mcp"],\n      "env": { "CARTOGRAFO_REPO": "/srv/repo" }\n    }\n  }\n}' },
            { tipo: 'texto', html: '<p>O cliente inicia o servidor como subprocesso. Sem rede e sem autenticação a implementar: o processo herda o usuário. Ciclo de vida do cliente; um processo por cliente; atualizar exige redistribuir. Logs só em stderr.</p>' }] },
          { rotulo: 'Streamable HTTP', blocos: [
            { tipo: 'codigo', linguagem: 'json', texto:
              '{\n  "mcpServers": {\n    "cartografo": {\n      "type": "http",\n      "url": "https://mcp.exemplo.com/mcp",\n      "headers": { "Authorization": "Bearer ${CARTOGRAFO_TOKEN}" }\n    }\n  }\n}' },
            { tipo: 'texto', html: '<p>Um endpoint HTTP, autenticação obrigatória, escala horizontal por ser sem estado. Segredo por variável de ambiente, <strong>nunca literal no JSON</strong> (que costuma ir para o git). O servidor valida <code>Origin</code>, confere header × corpo (<code>HeaderMismatch</code>, <code>-32020</code>) e o token define o escopo.</p>' }] }
        ] },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Critério</th><th>stdio</th><th>Streamable HTTP</th></tr></thead><tbody>' +
          '<tr><td>Onde roda</td><td>máquina do usuário, como subprocesso</td><td>servidor, acessível pela rede</td></tr>' +
          '<tr><td>Autenticação</td><td>herda o usuário</td><td><strong>obrigatória</strong>: OAuth, chave, mTLS</td></tr>' +
          '<tr><td>Escala</td><td>1 processo por cliente</td><td>N clientes, horizontal (sem estado)</td></tr>' +
          '<tr><td>Atualização</td><td>redistribuir para cada máquina</td><td>deploy central</td></tr>' +
          '<tr><td>Acesso a recurso local</td><td>natural (filesystem, git local)</td><td>impossível</td></tr>' +
          '<tr><td>Melhor para</td><td>ferramenta de dev individual</td><td>servidor corporativo compartilhado, produto SaaS</td></tr>' +
          '</tbody></table>' },
        { tipo: 'python', id: 'http-python', titulo: 'Valide a requisição HTTP', obrigatorio: false,
          enunciado: 'Escreva <code>validar_http(metodo_http, headers, corpo)</code>, que devolve <code>(status, código)</code>. A ordem é GET/DELETE (405), Origin inválido (403), versão ausente (400, <code>-32000</code>, convenção do laboratório) e header diferente do corpo (400, <code>-32020</code>). Nomes de header não diferenciam caixa.',
          codigo: codigoHttp, testes: testesHttp,
          dica: 'Normalize os headers com <code>{k.lower(): v ...}</code>. <code>Origin</code> só é checado se vier. <code>Mcp-Name</code> espelha <code>params.name</code> apenas em <code>tools/call</code> e <code>prompts/get</code> (conjunto <code>MRTR_COM_NOME</code>).',
          solucao: solucaoHttp,
          tutorDepois: 'O roteador olha o header e o servidor executa o corpo: por isso a divergência é recusada antes de qualquer execução.',
          callout: 'Origin, versão e HeaderMismatch passaram nos testes, incluindo a caixa dos headers.' },
        { tipo: 'cenario', id: 'transporte-cenario', titulo: 'Qual transporte para este cliente?', obrigatorio: false,
          enunciado: 'Um cliente do Cartógrafo exige que o código não saia da rede dele, mas outro quer um serviço compartilhado pelo time inteiro. Decida o desenho.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Você tem uma só lógica (buscar símbolo, consultar grafo). Como organiza o código?', opcoes: [
              { texto: 'Duas bases de código: uma para stdio e outra para HTTP.', vai: 'f-duas', tom: 'ruim', consequencia: 'duplica a lógica e abre divergência de comportamento entre os dois modos.' },
              { texto: 'Um núcleo com a lógica e o transporte como casca.', vai: 'casca', tom: 'ok', consequencia: 'transporte não muda semântica: testa em stdio, publica em HTTP.' }
            ] },
            casca: { texto: 'Para o cliente que exige o código dentro da rede, qual é o modo?', opcoes: [
              { texto: 'stdio apontando para um índice local.', vai: 'saas', tom: 'ok', consequencia: 'o processo roda na máquina dele, herda as permissões do usuário e nada sai da rede.' },
              { texto: 'HTTP em 0.0.0.0, sem autenticação, para facilitar.', vai: 'f-aberto', tom: 'ruim', consequencia: 'sem Origin, sem bind em loopback e sem autenticação, qualquer um fala com o servidor.' }
            ] },
            saas: { texto: 'E o serviço compartilhado do time?', opcoes: [
              { texto: 'Streamable HTTP autenticado, multi-tenant, com o mesmo núcleo.', vai: 'f-bom', tom: 'ok', consequencia: 'deploy central, escala horizontal por ser sem estado, e o token define o escopo.' },
              { texto: 'stdio em cada máquina, com cada pessoa atualizando o script.', vai: 'f-stdio', tom: 'ruim', consequencia: 'um processo por cliente e atualização manual em cada máquina.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Um núcleo, dois transportes: stdio para o modo local e HTTP autenticado para o SaaS, com o mesmo código de domínio.' },
            'f-duas': { bom: false, texto: 'Duas bases de código divergindo: o transporte virou parte do domínio.' },
            'f-aberto': { bom: false, texto: 'Servidor exposto: DNS rebinding e acesso sem autenticação.' },
            'f-stdio': { bom: false, texto: 'Time inteiro com versões diferentes e sem ponto único de deploy.' }
          },
          callout: 'Você deu um núcleo só, stdio para o modo local e HTTP autenticado para o compartilhado.' },
        { tipo: 'escolha', id: 'mismatch-escolha', titulo: 'Confira: header contra corpo',
          pergunta: 'Por que o servidor precisa rejeitar uma requisição cujo Mcp-Method diverge do method do corpo?',
          opcoes: [
            opc('a', 'Porque o balanceador pode rotear pelo header enquanto o servidor executa pelo corpo; a divergência burla a política de roteamento.', true, 'mesmo raciocínio do request smuggling.'),
            opc('b', 'Porque o corpo é sempre mais lento de parsear.', false, 'o motivo é segurança, não desempenho.'),
            opc('c', 'Porque o header é opcional e o corpo obrigatório.', false, 'o header é obrigatório e espelha o corpo de propósito.'),
            opc('d', 'Não precisa: basta confiar no header.', false, 'confiar em um dos dois sem conferir é a brecha.')],
          tutorDepois: 'Header e corpo são duas fontes: a regra é que elas batam.' },
        { tipo: 'escolha', id: 'stdout-escolha', titulo: 'Confira: onde vai o log',
          pergunta: 'Você precisa depurar um servidor stdio. Onde registrar o log sem quebrar o protocolo?',
          opcoes: [
            opc('a', 'Em stdout, uma linha por mensagem, para o cliente exibir.', false, 'cada linha de stdout é lida como JSON-RPC.'),
            opc('b', 'Em stderr ou em arquivo.', true, 'stderr é o canal de logs do subprocesso; stdout só carrega protocolo.'),
            opc('c', 'Em stdin, antes da resposta.', false, 'stdin é a entrada que o cliente escreve.')],
          tutorDepois: 'Logs em stderr, sempre.' },
        { tipo: 'takeaway', html: '<mark>stdio</mark> para o dev local, <mark>HTTP autenticado</mark> para o compartilhado; o <mark>núcleo</mark> é o mesmo.' }
      ] }
    ]
  });
})();
