/* F04 · Bloco 3: HTTP a fundo. Fonte: F04.html#b03. Saídas de request/ETag são as do laboratório (GET /notes/1, ETag "0996f450b0c7959c"). Referências: RFC 9110, 9111, 9112, 9113, 9114. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var CLI = 'uv run python -m web_http_lab.cli request GET http://127.0.0.1:8765/notes/1';

  var etapasCache = function () {
    return [
      { id: 'primeira', nome: '1. Primeira leitura', descricao: 'Sem validador: 200 com ETag', tom: 'request', ms: 1, linhas: [
        L('cmd', CLI),
        L('out', '< HTTP/1.1 200 OK'),
        L('out', '< ETag: "0996f450b0c7959c"'),
        L('out', '< Cache-Control: no-cache'),
        L('body', '{"id":1,"title":"redes","body":"tcp","href":"/notes/1"}'),
        L('hint', 'no-cache: o cache pode guardar, mas precisa revalidar antes de usar')] },
      { id: 'condicional', nome: '2. Leitura condicional', descricao: 'If-None-Match com o ETag: 304', tom: 'response', ms: 1, linhas: [
        L('cmd', CLI + " -H 'If-None-Match: \"0996f450b0c7959c\"'"),
        L('out', '< HTTP/1.1 304 Not Modified'),
        L('out', '< ETag: "0996f450b0c7959c"'),
        L('out', '< Cache-Control: no-cache'),
        L('hint', 'sem Content-Length e sem corpo: o RTT foi gasto, só a banda foi poupada')] }
    ];
  };

  var codigoCorpo = String.raw`def corpo_da_mensagem(metodo, status, headers):
    """Diz onde o corpo termina. headers: lista de (nome, valor).

    Devolve ("nenhum", None), ("tamanho", n), ("chunked", None) ou ("ate_fechar", None).
    Levanta ValueError diante de ambiguidade.
    """
    h = [(k.lower(), v.strip()) for k, v in headers]
    if metodo == "HEAD" or status in (204, 304):
        return ("nenhum", None)
    tamanhos = [v for k, v in h if k == "content-length"]
    codificacoes = [v.lower() for k, v in h if k == "transfer-encoding"]
    # recuse ambiguidade: Content-Length junto com Transfer-Encoding;
    # Content-Length repetido com valores diferentes; valor não numérico
    if codificacoes:
        return ("chunked", None)
    if tamanhos:
        return ("tamanho", int(tamanhos[0]))
    return ("ate_fechar", None)


print(corpo_da_mensagem("GET", 200, [("Content-Length", "30")]))
`;
  var testesCorpo = String.raw`def levanta(f):
    try:
        f()
    except ValueError:
        return True
    return False


def test_content_length_define_o_tamanho():
    assert corpo_da_mensagem("GET", 200, [("Content-Length", "30")]) == ("tamanho", 30)
    assert corpo_da_mensagem("GET", 200, [("content-length", " 30 ")]) == ("tamanho", 30)


def test_chunked_e_sem_nada():
    assert corpo_da_mensagem("GET", 200, [("Transfer-Encoding", "chunked")]) == ("chunked", None)
    assert corpo_da_mensagem("GET", 200, []) == ("ate_fechar", None)


def test_head_204_e_304_nunca_tem_corpo():
    assert corpo_da_mensagem("HEAD", 200, [("Content-Length", "30")]) == ("nenhum", None)
    assert corpo_da_mensagem("GET", 204, []) == ("nenhum", None)
    assert corpo_da_mensagem("GET", 304, [("Content-Length", "30")]) == ("nenhum", None)


def test_content_length_e_transfer_encoding_juntos_sao_recusados():
    assert levanta(lambda: corpo_da_mensagem("POST", 200, [("Content-Length", "5"), ("Transfer-Encoding", "chunked")]))


def test_content_length_repetido_diferente_e_recusado():
    assert levanta(lambda: corpo_da_mensagem("GET", 200, [("Content-Length", "30"), ("Content-Length", "31")]))
    assert corpo_da_mensagem("GET", 200, [("Content-Length", "30"), ("Content-Length", "30")]) == ("tamanho", 30)


def test_valor_nao_numerico_e_recusado():
    assert levanta(lambda: corpo_da_mensagem("GET", 200, [("Content-Length", "abc")]))
    assert levanta(lambda: corpo_da_mensagem("GET", 200, [("Content-Length", "-5")]))
`;
  var solucaoCorpo = String.raw`def corpo_da_mensagem(metodo, status, headers):
    """Diz onde o corpo termina. headers: lista de (nome, valor).

    Devolve ("nenhum", None), ("tamanho", n), ("chunked", None) ou ("ate_fechar", None).
    Levanta ValueError diante de ambiguidade.
    """
    h = [(k.lower(), v.strip()) for k, v in headers]
    if metodo == "HEAD" or status in (204, 304):
        return ("nenhum", None)
    tamanhos = [v for k, v in h if k == "content-length"]
    codificacoes = [v.lower() for k, v in h if k == "transfer-encoding"]
    if tamanhos and codificacoes:
        raise ValueError("Content-Length e Transfer-Encoding juntos")
    if codificacoes:
        if codificacoes[-1] != "chunked":
            raise ValueError("Transfer-Encoding desconhecido")
        return ("chunked", None)
    if tamanhos:
        if any(not t.isdigit() for t in tamanhos):
            raise ValueError("Content-Length não numérico")
        if len(set(tamanhos)) > 1:
            raise ValueError("Content-Length repetido com valores diferentes")
        return ("tamanho", int(tamanhos[0]))
    return ("ate_fechar", None)


print(corpo_da_mensagem("GET", 200, [("Content-Length", "30")]))
`;

  TrilhaAula.registrar({
    id: 'f04-b3',
    titulo: 'HTTP a fundo: mensagens, métodos, status, cache, cookies e CORS',
    minutos: 50,
    resumo: 'A maior parte dos bugs de API está em semântica mal usada: GET que altera estado, POST reenviado que cobra duas vezes, erro cacheado, 401 onde cabia 403.',
    objetivo: 'Ler e escrever uma mensagem HTTP/1.1 à mão, dizer onde o corpo termina, escolher método e status pela semântica, montar cabeçalhos de cache e cookie e explicar CORS como política do navegador.',
    revisao: [
      { id: 'f04b3-retry', pergunta: 'Um POST deu timeout de leitura. Reenviar é seguro? E um PUT?',
        opcoes: [
          opc('a', 'PUT é idempotente por definição; POST não é, e só fica seguro com uma idempotency key que o servidor honre', true, 'idempotente significa que N chamadas idênticas deixam o servidor no mesmo estado que uma só.'),
          opc('b', 'Os dois são seguros, pois um timeout nunca chega ao servidor', false, 'o timeout é do cliente: a requisição pode ter sido processada.'),
          opc('c', 'Nenhum dos dois pode ser repetido', false, 'PUT, GET e DELETE são idempotentes e podem ser repetidos.')] },
      { id: 'f04b3-cors', pergunta: 'O navegador acusa erro de CORS, mas o curl funciona. O que isso demonstra?',
        opcoes: [
          opc('a', 'CORS é uma regra do navegador sobre a leitura da resposta; a requisição pode até ter chegado ao servidor', true, 'o servidor não bloqueou nada; o curl não aplica a política. Autorização precisa ser verificada no servidor.'),
          opc('b', 'O servidor é seguro, pois bloqueou a requisição', false, 'CORS não protege o servidor.'),
          opc('c', 'O curl contorna a autenticação', false, 'o curl só não implementa a política de mesma origem.')] },
      { id: 'f04b3-nocache', pergunta: 'O que significa Cache-Control: no-cache?',
        opcoes: [
          opc('a', 'Pode guardar, mas é preciso revalidar com o servidor antes de reutilizar', true, 'com ETag, a revalidação pode ser um 304 barato. Quem proíbe guardar é no-store.'),
          opc('b', 'Não guarde a resposta em nenhum cache', false, 'esse é o no-store, indicado para dados sensíveis.'),
          opc('c', 'Guarde por zero segundos e apague', false, 'o nome engana: no-cache permite armazenar.')] },
      { id: 'f04b3-status', pergunta: 'Qual a diferença entre 401 e 403?',
        opcoes: [
          opc('a', '401: não sei quem você é (exige WWW-Authenticate); 403: sei quem é e não pode', true, 'para esconder a existência de um recurso de quem não pode vê-lo, 404 é uma escolha legítima.'),
          opc('b', '401 é erro do servidor e 403 é erro do cliente', false, 'ambos são 4xx, erro do cliente.'),
          opc('c', 'São sinônimos', false, 'misturá-los quebra clientes que decidem o que fazer pelo código.')] },
      { id: 'f04b3-corpo', pergunta: 'Content-Length e Transfer-Encoding chegam juntos numa requisição. O que o parser deve fazer?',
        opcoes: [
          opc('a', 'Recusar a mensagem: ambiguidade sobre onde o corpo termina é a base do request smuggling', true, 'se proxy e servidor discordam, o excedente vira o início da próxima requisição de outro usuário.'),
          opc('b', 'Usar sempre o Content-Length', false, 'um componente que escolhe diferente do outro cria exatamente a brecha.'),
          opc('c', 'Ler até a conexão fechar', false, 'isso só vale em resposta sem nenhum dos dois cabeçalhos.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Semântica mal usada, bug garantido</h3>' +
          '<p>HTTP é o protocolo de todo serviço que você vai construir ou consumir, de uma API REST a uma chamada a provedor de modelo com resposta em <em>streaming</em>. Os bugs típicos: um <code>GET</code> que altera estado e é repetido por um <em>prefetch</em>; um <code>POST</code> reenviado pelo <em>retry</em> do cliente que cobra duas vezes; uma resposta de erro cacheada por um proxy; um <code>401</code> usado onde cabia <code>403</code>. A referência é a RFC 9110 (semântica), 9111 (cache) e 9112 (HTTP/1.1 no fio).</p>' +
          '<h3>A mensagem, byte a byte</h3>' +
          '<p>HTTP/1.1 é texto sobre um fluxo TCP. Uma requisição é: linha de requisição, cabeçalhos, linha em branco, corpo opcional. Cada linha termina em CRLF (<code>\\r\\n</code>).</p>' },
        { tipo: 'codigo', linguagem: 'text', texto:
          'POST /notes HTTP/1.1\\r\\n\n' +
          'Host: 127.0.0.1:8765\\r\\n\n' +
          'Content-Type: application/json\\r\\n\n' +
          'Content-Length: 30\\r\\n\n' +
          '\\r\\n\n' +
          '{"title":"redes","body":"tcp"}\n\n' +
          'HTTP/1.1 201 Created\\r\\n\n' +
          'Content-Type: application/json; charset=utf-8\\r\\n\n' +
          'Location: /notes/1\\r\\n\n' +
          'Content-Length: 55\\r\\n\n' +
          '\\r\\n\n' +
          '{"id":1,"title":"redes","body":"tcp","href":"/notes/1"}' },
        { tipo: 'texto', html:
          '<p>O cabeçalho <code>Host</code> é obrigatório no HTTP/1.1: é o que permite hospedagem virtual (o IP identifica a máquina, o <code>Host</code> escolhe o site). Nomes de cabeçalho não diferenciam maiúsculas; valores podem se repetir (<code>Set-Cookie</code> é a exceção que não pode ser combinada com vírgula). Injeção de cabeçalho (CRLF dentro de um valor vindo do usuário) permite forjar cabeçalhos e respostas inteiras; por isso <code>build_request</code> recusa CR, LF e NUL.</p>' +
          '<h4>Onde o corpo termina</h4>' +
          '<p>É o ponto onde o protocolo falha de modos graves. Quatro regras, nesta ordem:</p>' +
          '<ol><li>Se há <code>Content-Length</code>, são esses bytes.</li><li>Se há <code>Transfer-Encoding: chunked</code>, o corpo vem em blocos <code>tamanho-em-hex CRLF dados CRLF</code>, terminando em bloco de tamanho 0.</li><li>Em resposta sem nenhum dos dois, vale até a conexão fechar.</li><li>Respostas a <code>HEAD</code>, <code>204</code> e <code>304</code> nunca têm corpo, mesmo que declarem <code>Content-Length</code>.</li></ol>' +
          '<p>Quando dois componentes na cadeia (proxy e servidor) discordam sobre onde uma mensagem termina, o excedente vira o início da &quot;próxima requisição&quot; de outro usuário: é o <strong>HTTP request smuggling</strong>. A defesa no parser é recusar ambiguidade: <code>Content-Length</code> e <code>Transfer-Encoding</code> juntos, <code>Content-Length</code> repetido com valores diferentes, valor não numérico. O <code>httpclient.py</code> e o servidor de <code>api.py</code> do laboratório fazem essas recusas, com testes.</p>' },
        { tipo: 'texto', html:
          '<h3>Métodos: o que cada um promete</h3>' +
          '<table><tr><th>Método</th><th>Seguro</th><th>Idempotente</th><th>Uso</th></tr>' +
          '<tr><td><code>GET</code>, <code>HEAD</code>, <code>OPTIONS</code></td><td>sim</td><td>sim</td><td>ler; <code>HEAD</code> = só cabeçalhos; <code>OPTIONS</code> = capacidades / preflight de CORS</td></tr>' +
          '<tr><td><code>PUT</code></td><td>não</td><td>sim</td><td>substituir o recurso inteiro</td></tr>' +
          '<tr><td><code>DELETE</code></td><td>não</td><td>sim</td><td>remover</td></tr>' +
          '<tr><td><code>POST</code></td><td>não</td><td><strong>não</strong></td><td>criar em coleção, ações, qualquer processamento</td></tr>' +
          '<tr><td><code>PATCH</code></td><td>não</td><td>não (depende)</td><td>alteração parcial (RFC 5789)</td></tr></table>', largo: true },
        { tipo: 'texto', html:
          '<p><strong>Seguro</strong> significa que o cliente não pede nem espera efeito de estado; por isso crawlers, prefetchers e caches podem chamar <code>GET</code> livremente. <strong>Idempotente</strong> significa que N chamadas idênticas deixam o servidor no mesmo estado que uma só; é a propriedade que torna <em>retry</em> automático legítimo. Um <code>DELETE</code> repetido pode devolver <code>204</code> e depois <code>404</code>: a resposta muda, o estado final não, e isso é idempotência. <code>POST</code> não é idempotente, e por isso bibliotecas sérias não repetem <code>POST</code> automaticamente; como torná-lo seguro para retry é assunto do bloco 4.</p>' +
          '<h3>Status: a família diz o que o cliente deve fazer</h3>' +
          '<table><tr><th>Faixa</th><th>Significa</th><th>Os que você precisa saber de cor</th></tr>' +
          '<tr><td>2xx</td><td>funcionou</td><td><code>200</code>, <code>201</code> (+<code>Location</code>), <code>202</code> (aceito, processa depois), <code>204</code> (sem corpo)</td></tr>' +
          '<tr><td>3xx</td><td>vá a outro lugar / use o cache</td><td><code>301</code>/<code>308</code> permanente, <code>302</code>/<code>307</code> temporário (307/308 preservam método e corpo; 301/302 historicamente trocam POST por GET), <code>304</code> não modificado</td></tr>' +
          '<tr><td>4xx</td><td>o cliente errou; mudar a requisição</td><td><code>400</code>, <code>401</code> (não autenticado; exige <code>WWW-Authenticate</code>), <code>403</code> (autenticado, sem permissão), <code>404</code>, <code>405</code> (+<code>Allow</code>), <code>409</code> (conflito de estado), <code>412</code> (pré-condição falhou), <code>415</code>, <code>422</code>, <code>428</code> (pré-condição exigida), <code>429</code> (+<code>Retry-After</code>)</td></tr>' +
          '<tr><td>5xx</td><td>o servidor falhou; repetir pode funcionar</td><td><code>500</code>, <code>502</code> (resposta inválida do upstream), <code>503</code> (indisponível, +<code>Retry-After</code>), <code>504</code> (upstream não respondeu a tempo)</td></tr></table>', largo: true },
        { tipo: 'texto', html:
          '<p>A distinção 4xx × 5xx decide o comportamento de retry de todo cliente: 4xx não se repete sem mudar algo (exceto <code>429</code> e <code>408</code>); 5xx pode ser transitório. Devolver <code>200</code> com <code>{&quot;error&quot;: ...}</code> no corpo quebra monitoramento, caches e clientes genéricos. <code>401</code> vs <code>403</code>: &quot;não sei quem você é&quot; vs &quot;sei quem é e não pode&quot;. Para esconder a existência de um recurso de quem não pode vê-lo, <code>404</code> é uma escolha legítima.</p>' },
        { tipo: 'takeaway', html: 'Ambiguidade sobre onde o corpo termina é <mark>vulnerabilidade</mark>; método e faixa do status decidem o que pode ser <mark>repetido</mark> e <mark>cacheado</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Cache e validação condicional</h3>' +
          '<p>Dois mecanismos, frequentemente confundidos. <strong>Frescor</strong>: <code>Cache-Control: max-age=N</code> autoriza reutilizar a resposta por N segundos sem perguntar nada ao servidor. <strong>Validação</strong>: depois de velha (ou com <code>no-cache</code>), o cache pergunta &quot;mudou?&quot; enviando o validador que guardou, e o servidor responde <code>304</code> sem corpo se não mudou. O validador mais comum é o <code>ETag</code>, um identificador opaco da versão da representação.</p>' },
        { tipo: 'rode', id: 'cache-rode', titulo: 'Leia o ETag e peça de novo',
          enunciado: 'Com a API do laboratório no ar, leia a nota 1 e repita com <code>If-None-Match</code>. Rode e clique em cada etapa.',
          prefixo: '$', entrada: 'uv run python -m web_http_lab.cli request GET http://127.0.0.1:8765/notes/1', unidade: 'req', terminalTitulo: 'cliente cru', etapas: etapasCache(),
          prever: { pergunta: 'Na segunda requisição, com If-None-Match igual ao ETag recebido, o que o servidor responde?', opcoes: [
            { id: 'a', texto: '200 OK com o corpo inteiro de novo.', correta: false, porque: 'isso aconteceria se o validador não casasse (por exemplo, sem as aspas do ETag).' },
            { id: 'b', texto: '304 Not Modified, sem corpo.', correta: true, porque: 'a representação não mudou; o servidor devolve só os cabeçalhos e o cliente reutiliza a cópia.' },
            { id: 'c', texto: '412 Precondition Failed.', correta: false, porque: '412 é a resposta de If-Match com versão desatualizada, outro mecanismo (concorrência otimista).' }
          ] },
          tutorAntes: 'Aperte Enter. Depois clique em 2. Leitura condicional para ver só o 304.',
          tutorDepois: 'O 304 economiza banda, não RTT: a viagem foi gasta. As aspas fazem parte do ETag e precisam ir no cabeçalho; sem elas o validador não casa e volta 200 com corpo.',
          callout: 'Você viu o par ETag e 304: validação sem retransmitir o corpo.' },
        { tipo: 'texto', html:
          '<h4>Diretivas que você vai usar</h4>' +
          '<table><tr><th>Diretiva</th><th>Efeito</th></tr>' +
          '<tr><td><code>no-store</code></td><td>não guarde em lugar nenhum (dados sensíveis, respostas de erro)</td></tr>' +
          '<tr><td><code>no-cache</code></td><td>pode guardar, mas <strong>revalide</strong> antes de usar (nome enganoso)</td></tr>' +
          '<tr><td><code>max-age=N</code></td><td>fresco por N s; <code>s-maxage</code> vale só para caches compartilhados</td></tr>' +
          '<tr><td><code>private</code> / <code>public</code></td><td>só o navegador do usuário / também proxies e CDNs</td></tr>' +
          '<tr><td><code>immutable</code></td><td>nunca mudará durante o frescor: assets com hash no nome (<code>app.3fa9.js</code>) com <code>max-age=31536000</code></td></tr>' +
          '<tr><td><code>stale-while-revalidate=N</code></td><td>serve o velho enquanto busca o novo em segundo plano (RFC 5861)</td></tr></table>', largo: true },
        { tipo: 'texto', html:
          '<p>Também <code>Vary</code>: se a resposta depende de um cabeçalho de requisição (<code>Accept-Encoding</code>, <code>Accept-Language</code>, <code>Origin</code>), o cache precisa saber disso, ou entrega a versão em português para quem pediu inglês. O mesmo ETag serve à <em>concorrência otimista</em>: <code>If-Match</code> num <code>PUT</code> faz o servidor recusar com <code>412</code> se a versão mudou desde a leitura, evitando o <em>lost update</em>. <code>If-None-Match</code> usa comparação fraca (ignora o prefixo <code>W/</code>); <code>If-Match</code> exige comparação forte; o laboratório implementa e testa as duas.</p>' +
          '<h3>Cookies: estado que o navegador carrega por você</h3>' +
          '<p>O servidor envia <code>Set-Cookie: sid=abc; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600</code>; dali em diante o navegador envia <code>Cookie: sid=abc</code> em toda requisição que case com o escopo. Os atributos são o controle de segurança:</p>' +
          '<ul><li><code>Secure</code>: só sobre HTTPS.</li><li><code>HttpOnly</code>: JavaScript não lê (mitiga roubo de sessão por XSS).</li><li><code>SameSite</code> (<code>Strict</code>/<code>Lax</code>/<code>None</code>): se vai em requisições originadas em outro site (mitiga CSRF).</li><li><code>Domain</code>/<code>Path</code> (escopo) e <code>Max-Age</code>/<code>Expires</code> (vida).</li><li>Prefixo <code>__Host-</code>: obriga <code>Secure</code>, <code>Path=/</code> e proíbe <code>Domain</code>, impedindo que um subdomínio comprometido sobrescreva o cookie.</li></ul>' +
          '<p>A assimetria que dá origem ao <strong>CSRF</strong>: o navegador anexa o cookie <em>automaticamente</em>, também quando a requisição foi disparada por outra página. Autenticação por cookie exige <code>SameSite</code> e/ou token anti-CSRF; autenticação por cabeçalho <code>Authorization</code> posto explicitamente pelo código não tem esse problema.</p>' },
        { tipo: 'texto', html: '<h3>HTTP/1.1, HTTP/2 e HTTP/3</h3>' },
        { tipo: 'abas', rotulo: 'Versões', itens: [
          { rotulo: 'HTTP/1.1', blocos: [{ tipo: 'texto', html: '<ul><li>Formato texto; sobre TCP; uma requisição por conexão por vez (navegadores abrem cerca de 6 conexões).</li><li>Bloqueio de cabeça de fila na aplicação (pipeline não é usado).</li><li>Handshake: TCP + TLS, 2 RTT com TLS 1.3.</li></ul>' }] },
          { rotulo: 'HTTP/2 (RFC 9113)', blocos: [{ tipo: 'texto', html: '<ul><li>Binário, em quadros, com cabeçalhos comprimidos (HPACK); TCP + TLS.</li><li>Muitos <em>streams</em> multiplexados numa conexão.</li><li>O bloqueio de cabeça de fila some na aplicação, mas <strong>persiste no TCP</strong>: um pacote perdido para todos os streams.</li></ul>' }] },
          { rotulo: 'HTTP/3 (RFC 9114)', blocos: [{ tipo: 'texto', html: '<ul><li>Binário, com QPACK; sobre QUIC (UDP) com TLS 1.3 embutido.</li><li>A perda só atrasa o stream afetado.</li><li>Handshake de 1 RTT (0-RTT em retomada); a conexão migra de rede sem recomeçar.</li></ul>' }] }
        ] },
        { tipo: 'texto', html:
          '<p>A semântica (métodos, status, cabeçalhos) é a mesma nas três; muda a forma de transportar. Seu código de aplicação quase nunca vê a diferença. Ela aparece em desempenho (menos conexões, menos cabeçalho repetido) e em operação: o navegador descobre HTTP/3 por <code>Alt-Svc</code> ou pelo registro DNS <code>HTTPS</code>, e cai para h2 se UDP estiver bloqueado. Para <em>streaming</em> de respostas (SSE, tokens de um LLM), HTTP/1.1 com <code>chunked</code> e HTTP/2 funcionam; proxies que fazem buffer da resposta inteira são o inimigo conhecido.</p>' },
        { tipo: 'takeaway', html: 'Cache é <mark>frescor</mark> (<code>max-age</code>) mais <mark>validação</mark> (ETag e 304); HTTP/2 e 3 mudam o <mark>transporte</mark>, não a semântica.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'corpo-python', titulo: 'Decida onde o corpo termina', obrigatorio: false,
          enunciado: 'Implemente <code>corpo_da_mensagem(metodo, status, headers)</code> com as quatro regras do bloco e a recusa de ambiguidade: <code>Content-Length</code> junto com <code>Transfer-Encoding</code>, <code>Content-Length</code> repetido com valores diferentes e valor não numérico levantam <code>ValueError</code>.',
          codigo: codigoCorpo, testes: testesCorpo,
          dica: 'Junte os valores de <code>content-length</code> numa lista. Se há tamanhos e codificações, levante o erro; se algum tamanho não é <code>isdigit()</code> ou há mais de um valor distinto (<code>set(tamanhos)</code>), também.',
          solucao: solucaoCorpo,
          tutorDepois: 'É a função que decide o destino de cada byte do fluxo. Um componente que escolhe diferente do vizinho abre o request smuggling; por isso a saída segura para o caso ambíguo é recusar.',
          callout: 'A regra do corpo passou nos testes: HEAD, 204 e 304, chunked, tamanho e as três ambiguidades recusadas.' },
        { tipo: 'complete', id: 'cache-complete', titulo: 'Monte os cabeçalhos de cache', obrigatorio: false,
          enunciado: 'Complete a resposta de <code>app.3fa9.js</code>, um asset com hash no nome que nunca muda, e a de <code>GET /me</code>, dado privado do usuário.',
          linguagem: 'text',
          partes: [
            '# GET /static/app.3fa9.js\nCache-Control: ',
            { lacuna: 'asset', opcoes: ['public, max-age=31536000, immutable', 'no-cache', 'private, no-store'], correta: 0 },
            '\n\n# GET /me\nCache-Control: ',
            { lacuna: 'me', opcoes: ['private, no-store', 'public, max-age=31536000', 'public, immutable'], correta: 0 },
            '\n'
          ],
          explicacao: 'O nome com hash muda quando o conteúdo muda, então pode ficar um ano em qualquer cache (immutable). /me é dado do usuário: private mantém fora de proxies e CDNs, e no-store impede guardar. Para GET /notes/1 a combinação é no-cache mais ETag, com resposta 304.' },
        { tipo: 'takeaway', html: 'O parser seguro <mark>recusa ambiguidade</mark>; o cabeçalho de cache certo depende de o recurso ser <mark>imutável</mark>, <mark>privado</mark> ou <mark>revalidável</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>CORS: uma regra do navegador, não do servidor</h3>' +
          '<p>A <em>same-origin policy</em> impede que o JavaScript de <code>https://app.com</code> leia respostas de <code>https://api.com</code> (origem = esquema + host + porta). <strong>CORS</strong> é o mecanismo pelo qual a API <em>autoriza</em> certas origens a ler. Requisições &quot;simples&quot; (GET/HEAD/POST com tipos de conteúdo de formulário) saem direto, e o navegador decide se entrega a resposta ao JavaScript conforme o <code>Access-Control-Allow-Origin</code>. Qualquer coisa fora disso (<code>PUT</code>, <code>DELETE</code>, <code>Content-Type: application/json</code>, <code>Authorization</code>) dispara antes um <em>preflight</em>:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto:
          'OPTIONS /notes/1\n' +
          'Origin: https://app.com\n' +
          'Access-Control-Request-Method: PUT\n' +
          'Access-Control-Request-Headers: content-type, if-match\n\n' +
          '-> 204\n' +
          'Access-Control-Allow-Origin: https://app.com\n' +
          'Access-Control-Allow-Methods: PUT\n' +
          'Access-Control-Allow-Headers: content-type, if-match\n' +
          'Access-Control-Max-Age: 600\n' +
          'Vary: Origin' },
        { tipo: 'texto', html: '<p>Com cookies (<code>credentials: &quot;include&quot;</code>), o servidor deve responder com a origem exata (nunca <code>*</code>) e <code>Access-Control-Allow-Credentials: true</code>. Responda <code>Vary: Origin</code> sempre que o valor depender da origem.</p>' },
        { tipo: 'cenario', id: 'cors-cenario', titulo: 'A SPA com cookie recebe erro de CORS', obrigatorio: false,
          enunciado: 'A SPA em <code>https://app.com</code> chama sua API com cookie e o navegador acusa erro de CORS. O colega propõe uma saída. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Ele sugere responder <code>Access-Control-Allow-Origin: *</code> e, se não funcionar, refletir o cabeçalho <code>Origin</code> recebido. Qual a sua resposta?', opcoes: [
              { texto: 'Refletir o Origin recebido, sem checar: assim qualquer cliente legítimo funciona.', vai: 'f-reflete', tom: 'ruim', consequencia: 'refletir Origin sem checar equivale a * com credenciais: qualquer site lê a resposta autenticada do seu usuário.' },
              { texto: '* resolve, e CORS protege o servidor mesmo assim.', vai: 'f-estrela', tom: 'ruim', consequencia: 'com credenciais o navegador rejeita *; e CORS nunca protegeu o servidor: a requisição chega e é executada.' },
              { texto: 'Allowlist de origens exatas, Allow-Credentials: true, Vary: Origin e preflight respondido.', vai: 'n2', tom: 'ok', consequencia: 'é a única forma segura de liberar leitura com cookie.' }
            ] },
            n2: { texto: 'Um POST simples com cookie vindo de uma página maliciosa ainda executa no servidor, mesmo sem CORS liberado. O que fecha essa brecha?', opcoes: [
              { texto: 'SameSite no cookie e/ou token anti-CSRF; autorização verificada no servidor.', vai: 'f-bom', tom: 'ok', consequencia: 'CORS controla a leitura da resposta; a execução da requisição é problema de CSRF.' },
              { texto: 'Nada: o navegador bloqueia a requisição inteira.', vai: 'f-estrela', tom: 'ruim', consequencia: 'o navegador bloqueia a leitura da resposta, não o envio da requisição simples.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Você separou as duas coisas: CORS libera a leitura por origem explícita; SameSite e anti-CSRF impedem a execução indevida. Autorização é sempre no servidor.' },
            'f-reflete': { bom: false, texto: 'Refletir o Origin sem checar abre a leitura das respostas autenticadas a qualquer site.' },
            'f-estrela': { bom: false, texto: 'CORS é regra do navegador sobre a leitura da resposta, não controle de acesso ao servidor.' }
          } },
        { tipo: 'escolha', id: 'b3-escolha-retry', titulo: 'Confira: o retry que cobrou duas vezes',
          pergunta: 'Um cliente repete automaticamente toda requisição que dá timeout. Qual repetição é segura sem nenhuma proteção adicional?',
          opcoes: [
            { id: 'a', texto: '<code>PUT /notes/1</code> com o recurso inteiro.', correta: true, porque: 'PUT é idempotente por definição: reenviar converge para o mesmo estado.' },
            { id: 'b', texto: '<code>POST /payments</code>.', correta: false, porque: 'POST não é idempotente: a primeira tentativa pode ter sido processada.' },
            { id: 'c', texto: '<code>POST /notes</code>, pois só cria uma nota.', correta: false, porque: 'cria duas notas se a primeira tiver chegado; só uma Idempotency-Key honrada pelo servidor torna isso seguro.' }
          ], tutorDepois: 'O bloco 4 mostra como a chave de idempotência torna o POST repetível.' },
        { tipo: 'escolha', id: 'b3-escolha-status', titulo: 'Confira: o status do erro',
          pergunta: 'A API devolve <code>200</code> com <code>{"error": "não encontrado"}</code> para um recurso inexistente. Qual o problema?',
          opcoes: [
            { id: 'a', texto: 'Nenhum: o corpo explica o erro.', correta: false, porque: 'clientes genéricos, caches e monitoramento decidem pelo código, não pelo corpo.' },
            { id: 'b', texto: 'Monitoramento, caches e clientes genéricos tratam como sucesso; deveria ser 404 (4xx não se repete, 5xx sim).', correta: true, porque: 'a faixa do status decide o comportamento de retry e de cache.' },
            { id: 'c', texto: 'O correto seria 500, porque o servidor falhou.', correta: false, porque: 'o servidor não falhou: o cliente pediu um recurso que não existe, um 4xx.' }
          ], tutorDepois: 'Lista vazia é 200 com [], não 404.' },
        { tipo: 'takeaway', html: 'CORS é política do navegador sobre <mark>leitura da resposta</mark>, não <mark>controle de acesso</mark>: autorização é sempre do servidor.' }
      ] }
    ]
  });
})();
