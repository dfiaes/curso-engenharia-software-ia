/* F04 · Bloco 2: DNS e TLS. Fonte: F04.html#b02. A saída de dns-query é a do laboratório (29 bytes). Datas de validade de certificado: calendário do CA/Browser Forum verificado em 11/10/2026, alto risco de mudança. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasDns = function () {
    return [
      { id: 'cab', nome: 'Cabeçalho', descricao: 'id, flags, contagens: 12 bytes', tom: 'dns', ms: 12, linhas: [
        L('cmd', 'uv run python -m web_http_lab.cli dns-query example.com A'),
        L('out', '29 bytes'),
        L('out', '0000  12 34 01 00 00 01 00 00 00 00 00 00 07 65 78 61'),
        L('info', '12 34 = id da transação | 01 00 = flags, RD=1 | 00 01 = 1 pergunta | 00 00 x3 = 0 resposta, autoridade, adicionais'),
        L('hint', 'o cliente casa a resposta com a pergunta pelo id')] },
      { id: 'nome', nome: 'Nome em rótulos', descricao: '07 example 03 com 00: 13 bytes', tom: 'tcp', ms: 13, linhas: [
        L('out', '0010  6d 70 6c 65 03 63 6f 6d 00 00 01 00 01'),
        L('info', '07 "example" | 03 "com" | 00 = fim do nome'),
        L('hint', 'cada rótulo leva um byte de tamanho na frente; o nome termina em 00')] },
      { id: 'tipo', nome: 'Tipo e classe', descricao: 'QTYPE A, QCLASS IN: 4 bytes', tom: 'request', ms: 4, linhas: [
        L('info', '00 01 = QTYPE A | 00 01 = QCLASS IN'),
        L('in', '12 + 13 + 4 = 29 bytes, um único datagrama UDP para a porta 53'),
        L('hint', 'na resposta, o nome volta como c0 0c: ponteiro de compressão para o byte 12')] }
    ];
  };

  var codigoDns = String.raw`import struct


def montar_consulta(nome, tipo=1, id_=0x1234):
    """Consulta DNS (RFC 1035): cabeçalho de 12 bytes + pergunta."""
    cab = struct.pack("!HHHHHH", id_, 0x0100, 1, 0, 0, 0)
    qname = b""
    # cada rótulo vira 1 byte de tamanho + os bytes; recuse rótulo vazio ou com mais de 63 bytes
    qname += b"\x00"
    return cab + qname + struct.pack("!HH", tipo, 1)


print(montar_consulta("example.com").hex())
`;
  var testesDns = String.raw`def test_consulta_de_example_com_tem_29_bytes():
    q = montar_consulta("example.com")
    assert len(q) == 29
    assert q.hex() == "123401000001000000000000076578616d706c6503636f6d0000010001"


def test_ponto_final_nao_muda_o_pacote():
    assert montar_consulta("example.com.") == montar_consulta("example.com")


def test_tipo_aaaa():
    assert montar_consulta("example.com", tipo=28)[-4:] == b"\x00\x1c\x00\x01"


def test_rotulo_vazio_falha():
    try:
        montar_consulta("a..com")
    except ValueError:
        return
    assert False, "rotulo vazio deveria levantar ValueError"


def test_rotulo_maior_que_63_falha():
    try:
        montar_consulta("a" * 64 + ".com")
    except ValueError:
        return
    assert False, "rotulo de 64 bytes deveria levantar ValueError"
`;
  var solucaoDns = String.raw`import struct


def montar_consulta(nome, tipo=1, id_=0x1234):
    """Consulta DNS (RFC 1035): cabeçalho de 12 bytes + pergunta."""
    cab = struct.pack("!HHHHHH", id_, 0x0100, 1, 0, 0, 0)
    qname = b""
    for rotulo in nome.rstrip(".").split("."):
        dados = rotulo.encode("ascii")
        if not 1 <= len(dados) <= 63:
            raise ValueError("rotulo deve ter de 1 a 63 bytes")
        qname += bytes([len(dados)]) + dados
    qname += b"\x00"
    return cab + qname + struct.pack("!HH", tipo, 1)


print(montar_consulta("example.com").hex())
`;

  var codigoSan = String.raw`def nome_casa(san, host):
    """True se o nome pedido (host) casa com uma entrada SAN do certificado."""
    san = san.lower()
    host = host.lower()
    if san.startswith("*."):
        # o curinga cobre exatamente um rótulo: api.exemplo.com sim; exemplo.com e a.b.exemplo.com não
        return False
    return san == host


print(nome_casa("*.exemplo.com", "api.exemplo.com"))
`;
  var testesSan = String.raw`def test_nome_exato():
    assert nome_casa("api.exemplo.com", "api.exemplo.com")
    assert nome_casa("API.exemplo.com", "api.EXEMPLO.com")


def test_curinga_cobre_um_nivel():
    assert nome_casa("*.exemplo.com", "api.exemplo.com")


def test_curinga_nao_cobre_dois_niveis():
    assert not nome_casa("*.exemplo.com", "a.b.exemplo.com")


def test_curinga_nao_cobre_o_apex():
    assert not nome_casa("*.exemplo.com", "exemplo.com")


def test_nome_diferente_nao_casa():
    assert not nome_casa("api.exemplo.com", "www.exemplo.com")
    assert not nome_casa("*.exemplo.com", "api.outro.com")
`;
  var solucaoSan = String.raw`def nome_casa(san, host):
    """True se o nome pedido (host) casa com uma entrada SAN do certificado."""
    san = san.lower()
    host = host.lower()
    if san.startswith("*."):
        rotulo, _, dominio = host.partition(".")
        return bool(rotulo) and dominio == san[2:]
    return san == host


print(nome_casa("*.exemplo.com", "api.exemplo.com"))
`;

  TrilhaAula.registrar({
    id: 'f04-b2',
    titulo: 'DNS e TLS: cache por TTL e a cadeia de confiança',
    minutos: 40,
    resumo: 'Dois incidentes que se repetem em toda empresa: tráfego que continua indo ao servidor velho (DNS e TTL) e clientes que falham de madrugada com erro de certificado (expiração, cadeia incompleta).',
    objetivo: 'Planejar uma troca de IP pelo TTL, ler um pacote DNS byte a byte, descrever o handshake TLS 1.3 e diagnosticar os erros de certificado mais comuns pela causa, sem desligar a verificação.',
    revisao: [
      { id: 'f04b2-ttl', pergunta: 'Você trocou o IP de um registro A cujo TTL era 86400. Por quanto tempo clientes ainda podem usar o IP antigo?',
        opcoes: [
          opc('a', 'Até 24 h depois da troca, no pior caso, porque cada resolvedor guarda a resposta pelo TTL que viu', true, 'a migração correta baixa o TTL com antecedência igual ao TTL antigo, troca e só então sobe o TTL de novo.'),
          opc('b', 'Só alguns segundos: o DNS propaga na hora', false, 'não há propagação: há caches expirando cada um no seu momento.'),
          opc('c', 'Até 24 h antes da troca', false, 'o cache só guarda respostas já dadas; o risco é depois da troca.')] },
      { id: 'f04b2-cadeia', pergunta: 'O navegador abre o site sem aviso, mas um script Python falha com "unable to get local issuer certificate". Qual a causa mais provável?',
        opcoes: [
          opc('a', 'O servidor envia só a folha, sem o intermediário; navegadores buscam o intermediário (AIA), a biblioteca TLS do Python não', true, 'o conserto é no servidor: enviar a cadeia completa, folha mais intermediárias.'),
          opc('b', 'O certificado expirou', false, 'expiração tem outra mensagem (certificate has expired) e quebraria o navegador também.'),
          opc('c', 'O script deveria usar verify=False', false, 'isso desliga a autenticação do servidor, justamente a garantia que o TLS dá.')] },
      { id: 'f04b2-tls', pergunta: 'O que o TLS garante além de confidencialidade e integridade?',
        opcoes: [
          opc('a', 'Autenticação do servidor: você fala com o dono do nome que pediu', true, 'sem ela, as duas primeiras valem pouco: criptografar para o atacante é perfeitamente possível.'),
          opc('b', 'Que o servidor é confiável e não tem vulnerabilidades', false, 'o certificado prova a posse do nome, não a qualidade do serviço.'),
          opc('c', 'Anonimato do cliente', false, 'o SNI vai em claro no ClientHello; o ECH ainda tem adoção parcial.')] },
      { id: 'f04b2-0rtt', pergunta: 'Por que 0-RTT só deve aceitar requisições idempotentes?',
        opcoes: [
          opc('a', 'Os dados enviados no primeiro voo podem ser repetidos por um atacante', true, 'repetir um GET é inofensivo; repetir um POST de pagamento não é.'),
          opc('b', 'Porque 0-RTT não é cifrado', false, 'é cifrado; o risco é o replay, não a leitura.'),
          opc('c', 'Porque o servidor não pode usar tickets de sessão', false, 'os tickets são justamente o que permite a retomada.')] },
      { id: 'f04b2-cname', pergunta: 'Como se evita um subdomain takeover num CNAME para um SaaS?',
        opcoes: [
          opc('a', 'Remover o registro DNS antes de apagar o recurso no provedor e auditar CNAMEs pendentes', true, 'com o CNAME pendente, quem registrar o recurso no provedor passa a servir conteúdo sob o seu domínio.'),
          opc('b', 'Subir o TTL do CNAME', false, 'TTL não tem relação com quem controla o destino.'),
          opc('c', 'Trocar o CNAME por um registro TXT', false, 'TXT não resolve endereço; o problema é o apontamento órfão.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Dois incidentes previsíveis</h3>' +
          '<p>&quot;O deploy foi para o servidor novo mas metade do tráfego continua indo para o velho&quot; (DNS e TTL) e &quot;às 3 h da manhã todos os clientes passaram a falhar com erro de certificado&quot; (expiração, cadeia incompleta). Ambos são previsíveis se você sabe o que o sistema guarda, por quanto tempo, e quem confere o quê.</p>' +
          '<h3>DNS: o que é e como uma consulta anda</h3>' +
          '<p>O <strong>DNS</strong> é um banco de dados hierárquico e distribuído que mapeia nomes para registros. Três papéis: o <em>stub resolver</em> (a biblioteca no seu processo, via <code>getaddrinfo</code>), o <em>resolvedor recursivo</em> (o do provedor, da empresa ou público, que faz o trabalho e guarda cache) e os servidores <em>autoritativos</em> (que de fato possuem a zona).</p>' +
          '<p>Para <code>api.exemplo.com</code> sem nada em cache, o recursivo pergunta a um servidor raiz, que indica os servidores de <code>.com</code>; estes indicam os autoritativos de <code>exemplo.com</code>; estes respondem com o registro. O resultado fica em cache no recursivo (e no sistema operacional, e em alguns runtimes) pelo <strong>TTL</strong> do registro.</p>' +
          '<p>Na maioria das vezes a consulta vai por UDP, porta 53, num único datagrama. Se a resposta não cabe, o servidor marca o bit TC (<em>truncated</em>) e o cliente refaz por TCP; extensões (EDNS0) elevam o limite UDP para algo em torno de 1232 bytes.</p>' },
        { tipo: 'texto', html:
          '<h4>Registros que você realmente usa</h4>' +
          '<table><tr><th>Tipo</th><th>Faz</th><th>Detalhe que morde</th></tr>' +
          '<tr><td><code>A</code> / <code>AAAA</code></td><td>nome &rarr; IPv4 / IPv6</td><td>vários registros = balanceamento rudimentar por rodízio; o cliente escolhe</td></tr>' +
          '<tr><td><code>CNAME</code></td><td>apelido para outro nome</td><td>não pode coexistir com outros registros no mesmo nome, logo não vale no apex (<code>exemplo.com</code>); provedores oferecem &quot;ALIAS/ANAME&quot; proprietário</td></tr>' +
          '<tr><td><code>MX</code></td><td>servidor de e-mail, com prioridade</td><td>menor número = preferido; aponta para nome, nunca para CNAME</td></tr>' +
          '<tr><td><code>TXT</code></td><td>texto livre</td><td>SPF, DKIM, DMARC e provas de posse de domínio vivem aqui</td></tr>' +
          '<tr><td><code>NS</code> / <code>SOA</code></td><td>delegação / metadados da zona</td><td>o último campo do SOA governa por quanto tempo uma resposta <em>negativa</em> (NXDOMAIN) fica em cache (RFC 2308)</td></tr>' +
          '<tr><td><code>CAA</code></td><td>quais CAs podem emitir certificado para o domínio</td><td>CAs são obrigadas a consultá-lo antes de emitir</td></tr>' +
          '<tr><td><code>SRV</code>, <code>HTTPS</code>/<code>SVCB</code></td><td>serviço, porta e parâmetros (p. ex. suporte a HTTP/3)</td><td>o tipo HTTPS permite ao cliente descobrir h3 antes de conectar</td></tr></table>', largo: true },
        { tipo: 'texto', html:
          '<h4>TTL: a mudança que não acontece quando você quer</h4>' +
          '<p>O TTL é um contrato de cache: &quot;pode reutilizar esta resposta por N segundos&quot;. Trocar o IP de um registro com TTL 3600 significa que, na pior hipótese, clientes vão ao IP antigo por até uma hora <em>depois</em> da mudança, e cada recursivo expira num instante diferente, daí a migração &quot;meio a meio&quot;.</p>' +
          '<p>A prática: baixar o TTL (p. ex. 60 s) <em>pelo menos um TTL antigo antes</em> da mudança, trocar, observar, e só depois subir o TTL de novo. Cache negativo é o espelho: consultar um nome que ainda não existe (NXDOMAIN) pode grudar por minutos mesmo depois de você criá-lo.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o CNAME esquecido', html:
          '<p>Colocar um nome de produção atrás de um CNAME de terceiros (um SaaS, um CDN) e depois remover o recurso no provedor, deixando o CNAME no seu DNS, abre <em>subdomain takeover</em>: qualquer pessoa que registre aquele recurso no provedor passa a servir conteúdo sob o seu domínio, com seu cookie de domínio e, para muitos fluxos, até certificado válido. Remova o registro DNS <em>antes</em> de apagar o recurso, e audite CNAMEs pendentes.</p>' },
        { tipo: 'takeaway', html: 'DNS é <mark>cache hierárquico regido por TTL</mark>: planeje migrações <mark>baixando o TTL antes</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>O pacote DNS por dentro</h3>' +
          '<p>O comando <code>dns-query example.com A</code> do laboratório imprime os 29 bytes da consulta. Rode e leia o dump etapa por etapa. O laboratório constrói esse pacote em <code>dnswire.py</code> para que o formato deixe de ser mágico.</p>' },
        { tipo: 'rode', id: 'dns-rode', titulo: 'Decodifique a consulta à mão',
          enunciado: 'Rode o comando do laboratório e clique em cada etapa para ver quais bytes pertencem a ela.',
          prefixo: '$', entrada: 'uv run python -m web_http_lab.cli dns-query example.com A', unidade: 'bytes', terminalTitulo: 'dns-query', etapas: etapasDns(),
          prever: { pergunta: 'Quantos bytes tem a consulta para example.com, tipo A?', opcoes: [
            { id: 'a', texto: '29 bytes: 12 de cabeçalho, 13 de nome em rótulos e 4 de tipo e classe.', correta: true, porque: '07 example 03 com 00 ocupa 1+7+1+3+1 = 13 bytes; tipo e classe são 2+2.' },
            { id: 'b', texto: '11 bytes: só o texto example.com.', correta: false, porque: 'o nome vem em rótulos com byte de tamanho e terminador, e a consulta tem cabeçalho de 12 bytes.' },
            { id: 'c', texto: 'Mais de 512 bytes: DNS sempre precisa de TCP.', correta: false, porque: 'a consulta cabe com folga num datagrama UDP; o TCP entra quando a resposta é truncada (bit TC).' }
          ] },
          tutorAntes: 'Aperte Enter e clique em Nome em rótulos para ver os 13 bytes do nome.',
          tutorDepois: 'Na resposta, o nome do registro volta como c0 0c: os bits 11 seguidos de um deslocamento (12) significam "o nome está no byte 12 da mensagem" (compressão de nomes). O decodificador precisa recusar ponteiros que apontam para frente ou formam laço, senão um pacote malicioso o prende num loop infinito; o teste correspondente está em test_dnswire.py.',
          callout: 'Você leu a consulta DNS byte a byte: cabeçalho, nome em rótulos, tipo e classe.' },
        { tipo: 'texto', html:
          '<h3>TLS: o que ele garante e como</h3>' +
          '<p>O <strong>TLS</strong> entrega ao TCP (ou ao QUIC) três propriedades: <strong>confidencialidade</strong> (terceiros não leem), <strong>integridade</strong> (ninguém altera sem ser detectado) e <strong>autenticação do servidor</strong> (você fala com o dono do nome que pediu). A terceira é a que a maioria esquece, e sem ela as duas primeiras valem pouco.</p>' +
          '<h4>Handshake do TLS 1.3 (RFC 8446), em uma volta</h4>' },
        { tipo: 'codigo', linguagem: 'text', texto:
          'cliente                                         servidor\n' +
          'ClientHello  (versões, cifras, SNI, ALPN,\n' +
          '              key_share = chave pública ECDHE)  ----->\n' +
          '                                           ServerHello (key_share)\n' +
          '                              {EncryptedExtensions, Certificate,\n' +
          '                               CertificateVerify, Finished}\n' +
          '             <-----------------------------------------\n' +
          '{Finished}   ----->\n' +
          '[dados da aplicação]  <----------------------->  [dados da aplicação]' },
        { tipo: 'texto', html:
          '<p>O cliente já manda no primeiro voo sua metade do acordo de chaves (Diffie-Hellman de curva elíptica). Com a resposta, ambos derivam as mesmas chaves de sessão sem tê-las transmitido. O resto da conversa do servidor, inclusive o certificado, já vai cifrado. O servidor prova que possui a chave privada do certificado assinando o histórico do handshake (<code>CertificateVerify</code>). Como a chave de sessão vem de troca efêmera, vazar a chave privada <em>depois</em> não decifra tráfego gravado antes: é a <strong>forward secrecy</strong>. TLS 1.2 gastava duas voltas e permitia suítes sem essa propriedade; hoje 1.3 é o padrão e 1.2 o piso aceitável.</p>' },
        { tipo: 'abas', rotulo: 'Três extensões que você vai ver em logs', itens: [
          { rotulo: 'SNI', blocos: [{ tipo: 'texto', html: '<p><em>Server Name Indication</em>: o cliente informa o nome desejado no ClientHello, em claro, para que um IP único hospede muitos certificados. O ECH (<em>Encrypted Client Hello</em>) cifra isso, mas a adoção ainda é parcial.</p>' }] },
          { rotulo: 'ALPN', blocos: [{ tipo: 'texto', html: '<p>Negocia o protocolo de aplicação (<code>h2</code>, <code>http/1.1</code>) dentro do próprio handshake, sem volta extra.</p>' }] },
          { rotulo: 'Retomada e 0-RTT', blocos: [{ tipo: 'texto', html: '<p>Um ticket de sessão permite handshake abreviado. Com <em>0-RTT</em> o cliente envia dados já no primeiro voo; esses dados <strong>podem ser repetidos por um atacante</strong>, então só requisições idempotentes devem ser aceitas assim (ligação direta com o bloco 4).</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h4>Certificados e cadeia de confiança</h4>' +
          '<p>Um certificado X.509 liga um nome (e uma chave pública) a uma assinatura de uma CA. O nome que vale é o do campo <em>Subject Alternative Name</em> (SAN); o antigo <em>Common Name</em> é ignorado por clientes modernos. O cliente valida: (1) a assinatura sobe por uma <strong>cadeia</strong> (folha &rarr; intermediária(s) &rarr; raiz) até uma raiz presente no <em>trust store</em> do sistema; (2) o nome pedido casa com um SAN (o curinga <code>*.exemplo.com</code> cobre um nível só); (3) a data está dentro da validade; (4) o uso da chave permite autenticar servidor; (5) opcionalmente, o certificado não foi revogado (OCSP/CRL, na prática pouco confiável).</p>' +
          '<p>Raízes não ficam online; assinam intermediárias, e estas assinam as folhas. O servidor deve <strong>enviar a folha e as intermediárias</strong>; a raiz o cliente já tem.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Vida curta, renovação automática (verificado em 11/10/2026)', html:
          '<p>A tendência é encurtar a vida dos certificados para reduzir a janela de dano de uma chave vazada: o CA/Browser Forum aprovou redução gradual do máximo permitido para certificados públicos (200 dias em 2026, 100 em 2027, 47 em 2029), o que torna a renovação automática (ACME, o protocolo do Let&#39;s Encrypt) obrigatória, não opcional. É um calendário de alto risco de mudança: confirme a versão vigente dos Baseline Requirements antes de planejar.</p>' },
        { tipo: 'texto', html:
          '<h4>Erros de certificado: sintoma, causa, onde olhar</h4>' +
          '<table><tr><th>Erro visto pelo cliente</th><th>Causa típica</th><th>Onde olhar</th></tr>' +
          '<tr><td><code>certificate has expired</code></td><td>renovação automática falhou</td><td>data de validade; job de renovação</td></tr>' +
          '<tr><td><code>unable to get local issuer certificate</code></td><td>servidor não enviou a intermediária (o navegador &quot;funciona&quot; porque a tem em cache, o cliente de linha de comando não)</td><td>cadeia enviada pelo servidor</td></tr>' +
          '<tr><td><code>hostname mismatch</code> / <code>no alternative names match</code></td><td>acessou por IP, ou nome fora dos SANs</td><td>SANs do certificado</td></tr>' +
          '<tr><td><code>self-signed certificate</code></td><td>CA interna que o cliente não conhece</td><td>trust store do cliente (contêiner minimalista sem <code>ca-certificates</code>)</td></tr>' +
          '<tr><td><code>handshake failure</code> / <code>protocol version</code></td><td>sem versão ou cifra em comum</td><td>versões mínimas de cliente e servidor</td></tr></table>', largo: true },
        { tipo: 'codigo', linguagem: 'bash', texto:
          'openssl s_client -connect exemplo.com:443 -servername exemplo.com -showcerts </dev/null\n' +
          '# -servername envia o SNI; sem ele, um IP com vários sites devolve o certificado "padrão"\n' +
          'openssl x509 -noout -subject -issuer -dates -ext subjectAltName   # lê um certificado PEM' },
        { tipo: 'takeaway', html: 'O pacote DNS é <mark>pequeno, em UDP, com nomes em rótulos</mark>; o TLS 1.3 negocia chaves em <mark>1 RTT</mark> e autentica o servidor pelo certificado.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'ordene', id: 'ttl-ordene', titulo: 'Ordene a migração de IP', obrigatorio: false,
          enunciado: 'O registro <code>api.exemplo.com</code> tem TTL de 1 hora e você vai trocar o IP. Ponha os passos na ordem correta e confira.',
          itens: [
            { id: 'troca', texto: 'Trocar o IP do registro' },
            { id: 'sobe', texto: 'Subir o TTL de volta ao valor normal' },
            { id: 'baixa', texto: 'Baixar o TTL (por exemplo, 60 s)' },
            { id: 'observa', texto: 'Observar o tráfego nos dois destinos e manter o servidor antigo vivo até esgotar' },
            { id: 'espera', texto: 'Esperar pelo menos o TTL antigo (1 hora) para o TTL baixo valer em todos os caches' }
          ], solucao: ['baixa', 'espera', 'troca', 'observa', 'sobe'],
          dica: 'Pergunte primeiro: o que precisa estar publicado, e por quanto tempo, para que a troca valha em minutos?',
          tutorDepois: 'Sem o primeiro passo, parte dos clientes vai ao IP velho por até uma hora: cada resolvedor guarda a resposta pelo TTL que existia quando consultou.' },
        { tipo: 'python', id: 'dns-python', titulo: 'Monte a consulta DNS', obrigatorio: false,
          enunciado: 'Complete <code>montar_consulta(nome, tipo)</code> para gerar exatamente os 29 bytes do exemplo. Cada rótulo vira um byte de tamanho mais os bytes; rótulo vazio ou com mais de 63 bytes levanta <code>ValueError</code>.',
          codigo: codigoDns, testes: testesDns,
          dica: 'Separe o nome em <code>nome.rstrip(".").split(".")</code>, codifique cada rótulo em ASCII e acrescente <code>bytes([len(dados)]) + dados</code>.',
          solucao: solucaoDns,
          tutorDepois: 'É o que o dnswire.py faz no lab. O formato é pequeno o bastante para caber numa tela, e por isso o decodificador de respostas é que exige cuidado (ponteiros de compressão).',
          callout: 'A consulta bate com o dump do laboratório, incluindo o ponto final e os limites de rótulo.' },
        { tipo: 'python', id: 'san-python', titulo: 'Valide o nome contra o SAN', obrigatorio: false,
          enunciado: 'Implemente <code>nome_casa(san, host)</code>: comparação sem diferenciar maiúsculas; o curinga <code>*.exemplo.com</code> cobre exatamente um rótulo (nem o apex, nem dois níveis).',
          codigo: codigoSan, testes: testesSan,
          dica: 'Com <code>host.partition(".")</code> você separa o primeiro rótulo; o resto precisa ser igual a <code>san[2:]</code>, e o rótulo não pode ser vazio.',
          solucao: solucaoSan,
          tutorDepois: 'É um dos cinco testes que o cliente faz (nome nos SANs). Os outros quatro, cadeia, validade, uso da chave e revogação, são o que uma biblioteca TLS faz por você, desde que a verificação esteja ligada.',
          callout: 'O casamento de nomes passou: exato, curinga de um nível, apex e dois níveis.' },
        { tipo: 'takeaway', html: 'Migração segura é <mark>TTL baixo, espera, troca, observação</mark>; o nome do certificado vem dos <mark>SANs</mark>, e o curinga cobre um nível só.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'transcript', id: 'cert-transcript', titulo: 'Ache o conserto que remove a garantia', obrigatorio: false, terminalTitulo: 'sessão: erro de certificado',
          enunciado: 'O agente investiga uma falha de TLS num script e diz que resolveu. Uma das afirmações dele não é sustentada pela sessão. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'O script de integração falha com "unable to get local issuer certificate", mas o navegador abre o site sem aviso. Resolva.' },
            { quem: 'ferramenta', texto: '$ openssl s_client -connect parceiro.exemplo:443 -servername parceiro.exemplo -showcerts </dev/null\nCertificate chain\n 0 s:CN = parceiro.exemplo\n   i:CN = CA Intermediaria 2' },
            { quem: 'agente', texto: 'O servidor envia só o certificado do próprio domínio; falta a intermediária na cadeia.' },
            { quem: 'agente', texto: 'Mudei o script para requests.get(url, verify=False) e a chamada funcionou.' },
            { quem: 'agente', texto: 'Problema resolvido: o certificado agora é aceito pelo cliente.' }
          ],
          erradas: [3, 4],
          explicacao: {
            3: 'verify=False desliga a autenticação do servidor: qualquer um no caminho poderia se passar por ele. O TLS vira cifra para um interlocutor desconhecido.',
            4: 'a causa real é cadeia incompleta no servidor. O conserto é o parceiro enviar folha mais intermediárias (ou, se a CA for interna, instalar a CA correta no trust store); nada disso foi feito.' },
          tutorDepois: 'Navegadores buscam o intermediário sozinhos (AIA); bibliotecas não. Resolva no servidor, não desligando a verificação.' },
        { tipo: 'escolha', id: 'b2-escolha-ttl', titulo: 'Confira: a migração de amanhã',
          pergunta: 'Você vai migrar <code>api.exemplo.com</code> para outro IP amanhã às 10h. O TTL atual é 86400 (24 h). O que fazer?',
          opcoes: [
            { id: 'a', texto: 'Baixar o TTL (por exemplo, 300) com pelo menos 24 h de antecedência, migrar e depois subir o TTL de novo.', correta: true, porque: 'resolvedores guardam a resposta pelo TTL que existia quando consultaram; o TTL baixo precisa estar publicado pelo menos um TTL antigo antes.' },
            { id: 'b', texto: 'Trocar o IP às 10h e esperar: o DNS propaga na hora.', correta: false, porque: 'não há propagação instantânea: há caches expirando cada um no seu tempo, por até 24 h.' },
            { id: 'c', texto: 'Aumentar o TTL para garantir que todos vejam a mudança.', correta: false, porque: 'TTL maior prolonga o cache do IP antigo.' },
            { id: 'd', texto: 'Apagar o registro por alguns minutos para forçar a limpeza do cache.', correta: false, porque: 'cria cache negativo (NXDOMAIN) e falhas, sem limpar o cache dos outros.' }
          ], tutorDepois: 'Subir ou apagar o registro piora a transição.' },
        { tipo: 'escolha', id: 'b2-escolha-tls', titulo: 'Confira: onde termina o TLS',
          pergunta: 'O balanceador termina o TLS e fala em HTTP puro com os serviços internos. O que isso troca?',
          opcoes: [
            { id: 'a', texto: 'Certificado em um lugar só e inspeção de HTTP, ao custo de o trecho interno trafegar em claro, a menos que você recifre (mTLS).', correta: true, porque: 'é o trade-off clássico; terminar no serviço dá ponta a ponta, com mais certificados para operar.' },
            { id: 'b', texto: 'Nada: o TLS vale ponta a ponta de qualquer jeito.', correta: false, porque: 'o TLS acaba onde a conexão é terminada.' },
            { id: 'c', texto: 'Os certificados deixam de expirar.', correta: false, porque: 'o certificado do balanceador continua expirando e precisa de renovação automática.' }
          ], tutorDepois: 'mTLS autentica serviços entre si sem segredos em cabeçalho, ao custo de uma PKI interna e rotação automatizada.' },
        { tipo: 'takeaway', html: 'Nunca desligue a verificação para <mark>fazer funcionar</mark>: conserte a <mark>cadeia</mark>, o nome ou a CA no trust store.' }
      ] }
    ]
  });
})();
