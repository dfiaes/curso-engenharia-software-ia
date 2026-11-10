/* F04 · Checkpoint: dez cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada. Porta F04.html#checkpoint. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'f04-checkpoint',
    titulo: 'Checkpoint F04',
    minutos: 60,
    resumo: 'Dez cenários sobre redes, DNS, TLS, HTTP, APIs REST e segurança web, sem consulta. Responda com as suas palavras; a rubrica diz o que basta.',
    objetivo: 'Verificar, sem consulta, se você estima o custo em round trips, localiza a camada de uma falha, planeja uma troca de DNS, escolhe cache e CORS com segurança, projeta paginação e idempotência e verifica JWT, autorização e SSRF.',
    revisao: [
      { id: 'f04cp-latencia', pergunta: 'Cliente a 100 ms de RTT, primeira chamada a https (TLS 1.3, sem cache), ignorando DNS e processamento. Qual o tempo mínimo até o primeiro byte?',
        opcoes: [
          opc('a', 'Cerca de 300 ms: TCP, TLS 1.3 e requisição, um RTT cada', true, 'na segunda chamada pela mesma conexão cai para cerca de 100 ms; no HTTP/3 transporte e TLS se juntam e a primeira fica em cerca de 200 ms.'),
          opc('b', 'Cerca de 100 ms: só a requisição', false, 'isso vale só para conexão reutilizada.'),
          opc('c', 'Depende só da banda', false, 'dobrar a banda não resolve; o custo está em viagens.')] },
      { id: 'f04cp-camada', pergunta: 'ECONNREFUSED em 2 ms, timeout após 30 s e "certificate has expired". Quem você aciona em cada caso?',
        opcoes: [
          opc('a', 'Recusa: dono do serviço; timeout: rede/infra; certificado: dono do certificado e da renovação', true, 'transporte, rede/rota e TLS são camadas e donos diferentes.'),
          opc('b', 'Rede nos três casos', false, 'tratar as três como "rede fora" devolve o chamado ao time errado.'),
          opc('c', 'DNS nos três casos', false, 'nenhuma das três mensagens é de DNS.')] },
      { id: 'f04cp-cache', pergunta: 'Qual a diferença entre no-cache e no-store?',
        opcoes: [
          opc('a', 'no-cache guarda e revalida antes de usar; no-store não guarda', true, 'para app.3fa9.js: public, max-age=31536000, immutable; para GET /me: private, no-store.'),
          opc('b', 'São sinônimos', false, 'o nome de no-cache engana, mas o efeito é diferente.'),
          opc('c', 'no-cache não guarda e no-store revalida', false, 'está invertido.')] },
      { id: 'f04cp-jwt', pergunta: 'Uma API aceita qualquer JWT com assinatura válida. Qual conjunto de verificações falta?',
        opcoes: [
          opc('a', 'Algoritmo fixo, exp/nbf, iss, aud, recusa de jwk/jku e comparação em tempo constante', true, 'cada ausência tem um ataque: alg none, token expirado, token de outra API, chave do atacante.'),
          opc('b', 'Nenhuma: a assinatura basta', false, 'assinatura válida só prova a origem.'),
          opc('c', 'Somente o tamanho do token', false, 'tamanho não é verificação de segurança.')] },
      { id: 'f04cp-ssrf', pergunta: 'Qual defesa contra SSRF numa pré-visualização de links resiste a IP em decimal, IPv6 mapeado e DNS rebinding?',
        opcoes: [
          opc('a', 'Esquema permitido, resolver uma vez, validar todos os IPs como públicos, conectar neles, sem redirects automáticos, limite de tamanho e tempo e isolamento de rede', true, 'lista negra por texto falha em todos esses casos.'),
          opc('b', 'Filtrar localhost e 127.0.0.1 como strings', false, 'http://2130706433 e http://[::ffff:127.0.0.1] passam.'),
          opc('c', 'Só exigir HTTPS', false, 'HTTPS não impede que o destino seja interno.')] }
    ],
    abas: [
      { rotulo: 'Rede, DNS, TLS e HTTP', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que <strong>basta</strong>. <strong>Reprova</strong> indica uma lacuna que volta a morder nos módulos de serviço (M03) e de produção (M12). Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: o primeiro byte',
          pergunta: 'Cliente a 100 ms de RTT, conexão nova, TLS 1.3, sem cache, ignorando DNS e processamento. Quanto custa chegar ao primeiro byte da resposta?',
          opcoes: [
            { id: 'a', texto: 'Cerca de 300 ms: TCP, TLS e requisição, um RTT cada.', correta: true, porque: 'três idas e voltas em série; a segunda chamada na mesma conexão custa só a última.' },
            { id: 'b', texto: 'Cerca de 100 ms, o RTT.', correta: false, porque: 'esquece o handshake TCP e o TLS.' },
            { id: 'c', texto: 'Cerca de 500 ms: TLS 1.3 gasta duas voltas.', correta: false, porque: 'duas voltas eram o TLS 1.2; o 1.3 fecha em uma.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Latência', obrigatorio: false,
          enunciado: 'Um cliente a 100 ms de RTT chama <code>https://api.exemplo.com</code> pela primeira vez (TLS 1.3, sem cache). Quanto tempo mínimo até o primeiro byte da resposta, ignorando DNS e processamento? O que muda na segunda chamada pela mesma conexão e com HTTP/3? <em>Bloco 1.</em>',
          placeholder: 'A primeira chamada paga… A segunda… Com HTTP/3…',
          rubrica: [
            '≈ <strong>300 ms</strong>: TCP 1 RTT + TLS 1.3 1 RTT + requisição 1 RTT.',
            'Segunda chamada na mesma conexão: ≈ <strong>100 ms</strong> (só a requisição).',
            'HTTP/3 junta transporte e TLS: ≈ <strong>200 ms</strong> na primeira.',
            'O custo é em <strong>viagens</strong>, não em banda.'
          ],
          modelo: '<p>Numa conexão nova são três idas e voltas em série: TCP (1 RTT), TLS 1.3 (1 RTT) e a requisição (1 RTT), cerca de 300 ms até o primeiro byte, sem contar DNS nem processamento. A segunda chamada pela mesma conexão paga só a requisição, cerca de 100 ms. Com HTTP/3 sobre QUIC, transporte e TLS se negociam juntos, e a primeira chamada cai para cerca de 200 ms. O custo é dominado por viagens, não por banda.</p>' + reprova('contar só a requisição, ou dizer que dobrar a banda resolve.') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Camada', obrigatorio: false,
          enunciado: 'Três falhas: <code>ECONNREFUSED</code> em 2 ms, timeout após 30 s e <code>certificate has expired</code>. Em que camada nasce cada uma e quem você aciona? <em>Blocos 1 e 2.</em>',
          placeholder: 'Recusa: … Timeout: … Certificado: …',
          rubrica: [
            'Recusa (<strong>transporte</strong>: ninguém escuta, ou RST) &rarr; dono do serviço.',
            'Timeout (<strong>rede/rota/firewall</strong>, ou serviço travado) &rarr; rede/infra, e timeouts definidos.',
            'Certificado (<strong>TLS/aplicação</strong>) &rarr; dono do certificado e da renovação.',
            'A <strong>diferença no tempo de falha</strong> já aponta a camada.'
          ],
          modelo: '<p>A recusa em 2 ms vem do transporte: o host respondeu com RST porque nada escuta naquela porta, então aciono o dono do serviço. O timeout é silêncio, com pacotes descartados por firewall ou rota, ou serviço travado; aciono rede e infra e garanto timeouts de conexão e leitura. O certificado expirado nasce no TLS: o dono do certificado e do job de renovação. O tempo de falha já distingue as camadas.</p>' + reprova('tratar as três como "rede fora".') },

        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · DNS', obrigatorio: false,
          enunciado: 'Você vai trocar o IP de <code>api.exemplo.com</code>, hoje com TTL de 1 h. Descreva o plano e o que acontece se pular o primeiro passo. <em>Bloco 2.</em>',
          placeholder: 'Primeiro… Depois… Se eu pular…',
          rubrica: [
            '<strong>Baixar o TTL</strong> pelo menos 1 h antes (um TTL antigo).',
            'Trocar o IP; <strong>observar o tráfego nos dois destinos</strong>.',
            'Manter o servidor antigo vivo até esgotar.',
            '<strong>Subir o TTL</strong> depois.',
            'Sem o primeiro passo, parte dos clientes vai ao IP velho por <strong>até 1 h</strong>.'
          ],
          modelo: '<p>Baixo o TTL (por exemplo, 60 s) pelo menos uma hora antes da troca, para que o valor baixo esteja publicado em todos os caches. Troco o IP, observo o tráfego nos dois destinos e mantenho o servidor antigo vivo até esgotar. Só então subo o TTL de volta. Se pular o primeiro passo, cada resolvedor guarda a resposta pelo TTL antigo, e parte dos clientes vai ao IP velho por até uma hora.</p>' + reprova('"trocar de madrugada e pronto".') },

        { tipo: 'escolha', id: 'cp-esc-p4', titulo: 'P4 · Aquecimento: o retry',
          pergunta: 'Um cliente repete automaticamente <code>PUT /notes/1</code> e <code>POST /payments</code> após timeout. Qual repetição é segura sem proteção extra?',
          opcoes: [
            { id: 'a', texto: 'O PUT: é idempotente por definição.', correta: true, porque: 'reenviar converge para o mesmo estado; o POST precisa de Idempotency-Key.' },
            { id: 'b', texto: 'O POST, pois cria um recurso novo e isso é seguro.', correta: false, porque: 'pode cobrar duas vezes.' },
            { id: 'c', texto: 'Nenhum dos dois.', correta: false, porque: 'PUT, GET e DELETE são idempotentes.' }
          ] },
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · HTTP', obrigatorio: false,
          enunciado: 'Um cliente repete automaticamente <code>PUT /notes/1</code> e <code>POST /payments</code> após timeout. Qual repetição é segura, por quê, e o que torna a outra segura? <em>Blocos 3 e 4.</em>',
          placeholder: 'O PUT… O POST…',
          rubrica: [
            '<code>PUT</code> é <strong>idempotente</strong> por definição: reenviar converge para o mesmo estado.',
            '<code>POST</code> não é: precisa de <strong><code>Idempotency-Key</code></strong>.',
            'O servidor guarda a <strong>impressão do corpo</strong> e devolve a resposta guardada.',
            '<strong>Gravação atômica</strong> da chave com o efeito (mesma transação), fechando a janela entre executar e registrar.'
          ],
          modelo: '<p>O PUT é seguro de repetir: é idempotente, N chamadas idênticas deixam o mesmo estado. O POST não é, porque a primeira tentativa pode ter sido processada. Ele fica seguro com uma Idempotency-Key gerada por intenção: o servidor guarda (chave, impressão do corpo, resposta), devolve a resposta guardada na repetição e responde 422 se o corpo mudar. A chave e o efeito são gravados na mesma transação, para não haver janela entre executar e registrar.</p>' + reprova('"POST nunca deve ser repetido" sem oferecer solução, ou ignorar a janela entre executar e registrar.') },

        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Cache', obrigatorio: false,
          enunciado: 'Explique a diferença entre <code>no-cache</code> e <code>no-store</code> e desenhe os cabeçalhos para (a) <code>app.3fa9.js</code>, (b) <code>GET /me</code>, (c) <code>GET /notes/1</code>. <em>Bloco 3.</em>',
          placeholder: 'no-cache… no-store… (a)… (b)… (c)…',
          rubrica: [
            '<code>no-cache</code> <strong>guarda e revalida</strong>; <code>no-store</code> <strong>não guarda</strong>.',
            '(a) <code>public, max-age=31536000, immutable</code>.',
            '(b) <code>private, no-store</code> (ou <code>private, no-cache</code>).',
            '(c) <code>no-cache</code> + <code>ETag</code>, resposta <strong>304</strong>.'
          ],
          modelo: '<p>no-cache permite guardar, mas exige revalidar antes de usar; no-store proíbe guardar. O asset com hash no nome nunca muda, então recebe <code>public, max-age=31536000, immutable</code>. <code>GET /me</code> é dado do usuário: <code>private, no-store</code>. <code>GET /notes/1</code> usa <code>no-cache</code> com <code>ETag</code>, e a revalidação vira um 304 sem corpo quando nada mudou.</p>' + reprova('trocar as duas diretivas, ou cachear <code>/me</code> em cache compartilhado.') },
        { tipo: 'takeaway', html: 'Custo em <mark>viagens</mark>, falha pela <mark>camada</mark>, DNS pelo <mark>TTL</mark>, retry pela <mark>idempotência</mark> e cache pela <mark>revalidação</mark>.' }
      ] },

      { rotulo: 'API e segurança', blocos: [
        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · CORS', obrigatorio: false,
          enunciado: 'A SPA em <code>https://app.com</code> recebe erro de CORS ao chamar sua API com cookie. O colega propõe responder <code>Access-Control-Allow-Origin: *</code>. Avalie. <em>Bloco 3.</em>',
          placeholder: 'Com credenciais… Eu faria… CORS não…',
          rubrica: [
            'Com credenciais o navegador <strong>rejeita <code>*</code></strong>.',
            '<strong>Allowlist de origens exatas</strong>, <code>Allow-Credentials: true</code>, <code>Vary: Origin</code>, preflight respondido.',
            'CORS <strong>não protege o servidor</strong>: a requisição chega e é executada.',
            'O cookie exige <strong><code>SameSite</code>/anti-CSRF</strong>.'
          ],
          modelo: '<p>Com cookies, o navegador não aceita <code>*</code>; refletir o Origin sem checar seria o mesmo que liberar tudo. A saída é uma allowlist de origens exatas, <code>Access-Control-Allow-Credentials: true</code>, <code>Vary: Origin</code> e o preflight respondido. CORS é política do navegador sobre a leitura da resposta, não protege o servidor: um POST simples com cookie chega mesmo assim, então o cookie precisa de SameSite e/ou token anti-CSRF.</p>' + reprova('refletir <code>Origin</code> sem checar, ou achar que CORS impede a requisição de chegar.') },

        { tipo: 'escolha', id: 'cp-esc-p7', titulo: 'P7 · Aquecimento: a lista de 50 milhões',
          pergunta: 'A listagem de <code>/orders</code> tem 50 milhões de linhas com inserções constantes. Qual paginação?',
          opcoes: [
            { id: 'a', texto: 'Cursor (keyset) sobre chave única e estável, com limit máximo e LIMIT n+1.', correta: true, porque: 'ancora no valor, usa o índice e descobre a próxima página sem COUNT(*).' },
            { id: 'b', texto: 'OFFSET com COUNT(*) a cada página.', correta: false, porque: 'custo crescente, COUNT(*) caro e lista que desloca sob inserção.' },
            { id: 'c', texto: 'Sem paginação, com compressão.', correta: false, porque: 'nunca devolva coleção sem limite.' }
          ] },
        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · API', obrigatorio: false,
          enunciado: 'Projete a listagem de <code>/orders</code> para 50 milhões de linhas com inserções constantes e o formato de erro. Que paginação, que limite, que corpo de erro? <em>Bloco 4.</em>',
          placeholder: 'Paginação… Limite… Erros…',
          rubrica: [
            '<strong>Cursor/keyset</strong> sobre chave única e estável (par <code>(data, id)</code> se ordenar por campo não único).',
            '<code>limit</code> com <strong>máximo</strong> imposto, <strong><code>LIMIT n+1</code></strong> e link <code>next</code>.',
            'Erros em <strong><code>application/problem+json</code></strong> com <code>type</code> estável e lista de campos inválidos.'
          ],
          modelo: '<p>Cursor sobre uma chave única e estável (o par data e id, se a ordem for por data), com <code>limit</code> de máximo imposto pelo servidor, busca de <code>limit + 1</code> para saber se há próxima página e um link <code>next</code> na resposta. Os erros saem em <code>application/problem+json</code>, com <code>type</code> estável, <code>title</code>, <code>status</code> e a lista de campos inválidos em <code>errors</code>, nunca 200 com erro no corpo.</p>' + reprova('<code>OFFSET</code>, <code>COUNT(*)</code> a cada página, ou 200 com erro no corpo.') },

        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · JWT', obrigatorio: false,
          enunciado: 'Uma API aceita qualquer JWT com assinatura válida. Liste ao menos quatro verificações que faltam e um ataque possível para cada duas. <em>Bloco 5.</em>',
          placeholder: 'Faltam… Ataques…',
          rubrica: [
            '<strong>Algoritmo fixo</strong> (ataques: <code>alg: none</code>, confusão RS/HS).',
            '<code>exp</code>/<code>nbf</code> (token expirado ou ainda não válido aceito).',
            '<code>iss</code> e <strong><code>aud</code></strong> (token de outra API aceito: confused deputy).',
            'Recusar <code>jwk</code>/<code>jku</code> (chave do atacante) e <strong>comparação em tempo constante</strong>.'
          ],
          modelo: '<p>Faltam: fixar o algoritmo no verificador (ataque: <code>alg: none</code> ou confusão entre RS256 e HS256); checar <code>exp</code> e <code>nbf</code> (token expirado aceito); checar <code>iss</code> e <code>aud</code> (um token válido emitido para outra API passa na minha); recusar cabeçalhos que apontam a chave, como <code>jwk</code> e <code>jku</code> (o atacante usa a própria chave); e comparar a assinatura em tempo constante.</p>' + reprova('"a assinatura basta".') },

        { tipo: 'escolha', id: 'cp-esc-p9', titulo: 'P9 · Aquecimento: a fatura do vizinho',
          pergunta: '<code>GET /invoices/77</code> retorna a fatura de qualquer usuário logado. Qual o nome da falha?',
          opcoes: [
            { id: 'a', texto: 'BOLA/IDOR, uma falha de controle de acesso.', correta: true, porque: 'autentica e esquece de conferir o dono do objeto.' },
            { id: 'b', texto: 'Injeção de SQL.', correta: false, porque: 'a falha não está na consulta parametrizada, está na falta de filtro por dono.' },
            { id: 'c', texto: 'CORS mal configurado.', correta: false, porque: 'CORS não é controle de acesso.' }
          ] },
        { tipo: 'escreva', id: 'cp-p9', titulo: 'P9 · Autorização', obrigatorio: false,
          enunciado: '<code>GET /invoices/77</code> retorna a fatura de qualquer usuário logado. Nomeie a falha, corrija a consulta e diga o status ao acessar fatura alheia. <em>Bloco 5.</em>',
          placeholder: 'A falha é… A consulta fica… O status…',
          rubrica: [
            '<strong>BOLA/IDOR</strong> (controle de acesso quebrado).',
            '<code>WHERE id = :id AND owner_id = :uid</code>.',
            'Status <strong>404</strong> (ou 403 se a existência não for segredo).',
            '<strong>UUID não resolve</strong>; a checagem é no servidor, não no front-end.'
          ],
          modelo: '<p>É BOLA/IDOR, controle de acesso quebrado: o endpoint autentica, mas não confere que a fatura é do usuário. A consulta passa a filtrar pelo dono: <code>WHERE id = :id AND owner_id = :uid</code>, e fatura alheia devolve 404, de modo que &quot;não existe&quot; e &quot;não é seu&quot; são a mesma resposta (403 se a existência não for segredo). UUID dificulta a enumeração, mas não substitui a checagem, que é sempre do servidor.</p>' + reprova('propor só IDs aleatórios, ou checar no front-end.') },

        { tipo: 'escreva', id: 'cp-p10', titulo: 'P10 · SSRF', obrigatorio: false,
          enunciado: 'Seu serviço gera pré-visualização de links. Descreva três bypasses de uma lista negra por texto e a defesa correta. <em>Bloco 5.</em>',
          placeholder: 'Bypasses: … Defesa: …',
          rubrica: [
            'Três entre: <strong>IP em decimal/hex/IPv6 mapeado</strong>, nome DNS que resolve para interno, redirecionamento 302, <strong>DNS rebinding</strong>.',
            'Esquema permitido; <strong>resolver uma vez</strong>, validar <strong>todos</strong> os IPs como públicos e <strong>conectar neles</strong>.',
            '<strong>Sem redirects automáticos</strong> (ou revalidar cada salto); limite de tamanho e tempo.',
            '<strong>Isolamento de rede</strong> (sem rota para a rede interna e para os metadados).'
          ],
          modelo: '<p>Uma lista negra por texto cai com <code>http://2130706433</code> ou <code>http://[::ffff:127.0.0.1]</code> (formas alternativas do IP), com um nome DNS que resolve para um endereço interno, com um redirecionamento 302 para dentro e com DNS rebinding. A defesa: permitir só o esquema https; resolver o nome uma vez, validar todos os IPs como públicos e conectar neles diretamente; não seguir redirects automaticamente, ou revalidar cada salto; limitar tamanho e tempo da resposta; e rodar o serviço sem rota para a rede interna e para o endereço de metadados.</p>' + reprova('filtrar <code>localhost</code> e <code>127.0.0.1</code> como strings.') },
        { tipo: 'takeaway', html: 'CORS não protege o <mark>servidor</mark>, a assinatura não prova o <mark>destinatário</mark> e a lista negra não vence o <mark>SSRF</mark>: valide <mark>no servidor</mark>, a cada requisição.' }
      ] }
    ]
  });
})();
