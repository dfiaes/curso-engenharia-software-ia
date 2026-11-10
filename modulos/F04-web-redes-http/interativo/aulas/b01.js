/* F04 · Bloco 1: redes do zero. Fonte: F04.html#b01. Exemplo condutor: GET /notes no servidor do laboratório (127.0.0.1:8765). Números do exemplo (RTT 80 ms, DNS 20 ms) são os da fonte. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasTtfb = function () {
    return [
      { id: 'dns', nome: 'DNS', descricao: 'Resolvedor próximo, sem cache', tom: 'dns', ms: 20, linhas: [
        L('cmd', 'python3 -c "print(20 + 80 + 80 + 80)"'),
        L('info', 'api.exemplo.com -> resolvedor recursivo a 20 ms (sem cache)'),
        L('out', 'dns   20 ms   (acumulado 20 ms)')] },
      { id: 'tcp', nome: 'TCP', descricao: 'SYN, SYN+ACK: 1 RTT', tom: 'tcp', ms: 80, linhas: [
        L('out', 'tcp   80 ms   (acumulado 100 ms)'),
        L('hint', 'o ACK final já pode levar dados, mas o cliente só começa depois do SYN+ACK')] },
      { id: 'tls', nome: 'TLS 1.3', descricao: 'ClientHello até Finished: 1 RTT', tom: 'tls', ms: 80, linhas: [
        L('out', 'tls   80 ms   (acumulado 180 ms)'),
        L('hint', 'com TLS 1.2 seriam 2 RTTs aqui (acumulado 260 ms só até o fim do TLS)')] },
      { id: 'http', nome: 'Requisição', descricao: 'GET /notes até o primeiro byte', tom: 'request', ms: 80, linhas: [
        L('out', 'http  80 ms   (acumulado 260 ms)'),
        L('in', '260  (primeiro byte da resposta em 260 ms + tempo do servidor)'),
        L('hint', 'uma segunda requisição na mesma conexão custa só este último passo: 80 ms')] }
    ];
  };

  var codigoTtfb = String.raw`def ttfb_ms(rtt, dns_ms=0, tls_rtts=1, reutilizada=False):
    """Tempo até o primeiro byte da resposta, em ms (modelo de viagens)."""
    if rtt <= 0:
        raise ValueError("rtt deve ser positivo")
    # conexão nova: DNS + TCP (1 RTT) + TLS (tls_rtts RTTs) + requisição (1 RTT)
    # conexão reutilizada: só a requisição (1 RTT)
    return rtt


print(ttfb_ms(80, dns_ms=20))
`;
  var testesTtfb = String.raw`def test_conexao_nova_tls13():
    assert ttfb_ms(80, dns_ms=20) == 260


def test_tls12_custa_uma_viagem_a_mais():
    assert ttfb_ms(80, dns_ms=20, tls_rtts=2) == 340


def test_conexao_reutilizada_so_paga_a_requisicao():
    assert ttfb_ms(80, dns_ms=20, reutilizada=True) == 80


def test_sem_tls_borda():
    assert ttfb_ms(80, tls_rtts=0) == 160


def test_rtt_invalido_falha():
    try:
        ttfb_ms(0)
    except ValueError:
        return
    assert False, "rtt 0 deveria levantar ValueError"
`;
  var solucaoTtfb = String.raw`def ttfb_ms(rtt, dns_ms=0, tls_rtts=1, reutilizada=False):
    """Tempo até o primeiro byte da resposta, em ms (modelo de viagens)."""
    if rtt <= 0:
        raise ValueError("rtt deve ser positivo")
    if reutilizada:
        return rtt
    return dns_ms + rtt + tls_rtts * rtt + rtt


print(ttfb_ms(80, dns_ms=20))
`;

  var codigoLeitor = String.raw`class Leitor:
    """Reassembla mensagens terminadas em b"\n" a partir dos pedaços que recv() devolve."""

    def __init__(self, limite=1024):
        self.buf = b""
        self.limite = limite

    def alimentar(self, pedaco):
        """Recebe os bytes de um recv() e devolve a lista de mensagens completas (sem o \n)."""
        self.buf += pedaco
        mensagens = []
        # extraia do buffer cada mensagem que já terminou; o resto espera o próximo pedaço
        if len(self.buf) > self.limite:
            raise ValueError("mensagem sem fim acima do limite")
        return mensagens


leitor = Leitor()
print(leitor.alimentar(b"OLA\nMUN"), leitor.alimentar(b"DO\n"))
`;
  var testesLeitor = String.raw`def test_mensagem_partida_em_dois_pedacos():
    r = Leitor()
    assert r.alimentar(b"OLA\nMUN") == [b"OLA"]
    assert r.alimentar(b"DO\n") == [b"MUNDO"]


def test_duas_mensagens_no_mesmo_pedaco():
    r = Leitor()
    assert r.alimentar(b"A\nB\n") == [b"A", b"B"]


def test_pedaco_sem_fim_nao_entrega_nada():
    r = Leitor()
    assert r.alimentar(b"INCOMPLETA") == []
    assert r.alimentar(b"\n") == [b"INCOMPLETA"]


def test_mensagem_sem_fim_acima_do_limite_falha():
    r = Leitor(limite=8)
    try:
        r.alimentar(b"x" * 20)
    except ValueError:
        return
    assert False, "deveria recusar buffer sem fim acima do limite"
`;
  var solucaoLeitor = String.raw`class Leitor:
    """Reassembla mensagens terminadas em b"\n" a partir dos pedaços que recv() devolve."""

    def __init__(self, limite=1024):
        self.buf = b""
        self.limite = limite

    def alimentar(self, pedaco):
        """Recebe os bytes de um recv() e devolve a lista de mensagens completas (sem o \n)."""
        self.buf += pedaco
        mensagens = []
        while b"\n" in self.buf:
            linha, self.buf = self.buf.split(b"\n", 1)
            mensagens.append(linha)
        if len(self.buf) > self.limite:
            raise ValueError("mensagem sem fim acima do limite")
        return mensagens


leitor = Leitor()
print(leitor.alimentar(b"OLA\nMUN"), leitor.alimentar(b"DO\n"))
`;

  TrilhaAula.registrar({
    id: 'f04-b1',
    titulo: 'Redes do zero: camadas, IP, portas, TCP e latência',
    minutos: 40,
    resumo: 'Refused, timeout e reset são três falhas em três lugares. O modelo mínimo: quem endereça o quê, o que o TCP garante e quanto custa cada ida e volta.',
    objetivo: 'Distinguir refused, timeout e reset pela camada onde nascem, explicar por que o TCP não preserva fronteiras de mensagem e estimar em round trips o tempo até o primeiro byte.',
    revisao: [
      { id: 'f04b1-tcp', pergunta: 'O cliente faz dois send() seguidos ("OLA" e "MUNDO") numa conexão TCP. O que um recv() na outra ponta pode devolver?',
        opcoes: [
          opc('a', 'Sempre "OLA" e depois "MUNDO", uma escrita por leitura', false, 'o TCP entrega um fluxo de bytes: os limites das escritas não são preservados.'),
          opc('b', '"OLAMUNDO" de uma vez, ou "OLAMU" e depois "NDO"', true, 'o protocolo de cima precisa delimitar (tamanho, linha, Content-Length) e o receptor lê em laço até ter a mensagem inteira.'),
          opc('c', 'Um erro, pois cada mensagem exige uma conexão', false, 'uma conexão carrega quantas mensagens o protocolo quiser; o problema é saber onde cada uma termina.')] },
      { id: 'f04b1-falhas', pergunta: 'Connection refused em 2 ms e timeout depois de 30 s. Qual a leitura mais provável?',
        opcoes: [
          opc('a', 'Refused: a máquina respondeu que nada escuta na porta (RST); timeout: silêncio, pacotes descartados ou host fora do ar', true, 'a diferença no tempo de falha já aponta a camada: recusa ativa volta rápido, silêncio espera o prazo inteiro.'),
          opc('b', 'Os dois são o mesmo problema: o servidor caiu', false, 'servidor caído sem host responde com silêncio, não com recusa em 2 ms.'),
          opc('c', 'Refused: DNS errado; timeout: certificado inválido', false, 'DNS e certificado são outras camadas e outros erros.')] },
      { id: 'f04b1-rtt', pergunta: 'Cliente a 80 ms de RTT, conexão nova, TLS 1.3, sem DNS. Quanto falta até o primeiro byte da resposta?',
        opcoes: [
          opc('a', 'Cerca de 240 ms: TCP, TLS e requisição, um RTT cada', true, 'sem DNS são três idas e voltas antes de o servidor executar uma linha; uma segunda requisição na mesma conexão custa só 80 ms.'),
          opc('b', 'Cerca de 80 ms: só a requisição', false, 'isso vale só para conexão reutilizada.'),
          opc('c', 'Depende só da banda', false, 'resposta pequena é dominada por latência, não por banda.')] },
      { id: 'f04b1-remedio', pergunta: 'Uma resposta pequena demora 300 ms por causa do RTT. Qual remédio ataca a causa?',
        opcoes: [
          opc('a', 'Reutilizar a conexão e reduzir chamadas em série', true, 'latência pede menos viagens: keep-alive, cache, CDN perto do usuário.'),
          opc('b', 'Dobrar a banda do enlace', false, 'banda quase não muda o tempo de uma resposta pequena.'),
          opc('c', 'Comprimir o corpo', false, 'compressão reduz bytes, que é o remédio de banda, não de latência.')] },
      { id: 'f04b1-porta', pergunta: 'Como um servidor na porta 443 atende milhares de clientes ao mesmo tempo?',
        opcoes: [
          opc('a', 'Cada conexão é identificada pela quíntupla; cada cliente chega com uma porta de origem efêmera diferente', true, 'a conexão é (protocolo, IP origem, porta origem, IP destino, porta destino); portas efêmeras esgotadas dão erro de connect sem falha de rede real.'),
          opc('b', 'O servidor abre uma porta nova por cliente', false, 'a porta de destino é sempre a mesma; o que varia é o par do cliente.'),
          opc('c', 'O IP do servidor muda a cada conexão', false, 'o IP é o mesmo; quem identifica a conversa é a quíntupla.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Três falhas que parecem a mesma</h3>' +
          '<p>Seu código chama um serviço e falha. A mensagem pode ser <code>Connection refused</code> (chegou ao host, ninguém escuta naquela porta), <code>timed out</code> (os pacotes sumiram no caminho, ou o outro lado parou de responder) ou <code>Connection reset by peer</code> (a conexão existia e o outro lado a derrubou). Quem não distingue os três abre chamado para a equipe errada.</p>' +
          '<p>Este bloco dá o modelo mínimo para distinguir: quem endereça o quê, o que o TCP garante e não garante, e quanto tempo cada ida e volta custa. Todo exemplo usa o mesmo cenário: um cliente chamando <code>GET /notes</code> numa API.</p>' },
        { tipo: 'texto', html:
          '<h3>O modelo em camadas, sem folclore</h3>' +
          '<p>Uma <strong>camada</strong> oferece um serviço à de cima e consome o da de baixo. Para uma aplicação importam quatro, a pilha TCP/IP:</p>' +
          '<table><tr><th>Camada</th><th>Identifica</th><th>Unidade</th><th>Exemplo</th></tr>' +
          '<tr><td>Aplicação</td><td>mensagem com significado</td><td>requisição, resposta</td><td>HTTP, DNS, TLS (entre aplicação e transporte)</td></tr>' +
          '<tr><td>Transporte</td><td>processo ou conexão no host (porta)</td><td>segmento TCP, datagrama UDP</td><td>TCP, UDP, QUIC (sobre UDP)</td></tr>' +
          '<tr><td>Internet</td><td>host (endereço IP)</td><td>pacote</td><td>IPv4, IPv6, ICMP</td></tr>' +
          '<tr><td>Enlace</td><td>interface no mesmo segmento (MAC)</td><td>quadro</td><td>Ethernet, Wi-Fi</td></tr></table>', largo: true },
        { tipo: 'texto', html:
          '<p>A requisição <code>GET /notes</code> vira bytes; o TCP os corta em segmentos, o IP embrulha em pacotes, o enlace embrulha em quadros. Cada camada acrescenta um cabeçalho (<strong>encapsulamento</strong>) e o receptor desfaz na ordem inversa. O roteador no meio olha só até o cabeçalho IP: ele não sabe que aquilo é HTTP, e por isso não consegue &quot;consertar&quot; nada do protocolo de aplicação.</p>' },
        { tipo: 'texto', html:
          '<h3>IP e porta: dois endereços para duas perguntas</h3>' +
          '<p>O endereço IP responde &quot;qual máquina (interface)?&quot;; a <strong>porta</strong> (16 bits, 0 a 65535) responde &quot;qual conversa dentro dela?&quot;. Uma conexão TCP é identificada pela <strong>quíntupla</strong> <code>(protocolo, IP origem, porta origem, IP destino, porta destino)</code>. O servidor usa sempre a porta 443 e atende milhares de clientes porque cada cliente chega com uma porta de origem <em>efêmera</em> diferente (no Linux, por padrão, de 32768 a 60999; veja <code>net.ipv4.ip_local_port_range</code>).</p>' +
          '<p>Consequência prática: um cliente que abre conexões demais contra o mesmo destino esgota portas efêmeras, e o sintoma é erro de <code>bind</code>/<code>connect</code> sem nenhuma falha de rede de verdade. O remédio é reutilizar conexões (<em>keep-alive</em>, <em>pool</em>).</p>' },
        { tipo: 'abas', rotulo: 'Endereços que você vai reconhecer', itens: [
          { rotulo: 'IPv4 e IPv6', blocos: [{ tipo: 'texto', html: '<p>IPv4 tem 32 bits (≈4,3 bilhões de endereços); IPv6 tem 128. A notação CIDR <code>/24</code> diz quantos bits iniciais identificam a rede: <code>192.168.1.0/24</code> tem 256 endereços.</p>' }] },
          { rotulo: 'Privados e NAT', blocos: [{ tipo: 'texto', html: '<p>Faixas privadas (<code>10.0.0.0/8</code>, <code>172.16.0.0/12</code>, <code>192.168.0.0/16</code>; no IPv6, <code>fc00::/7</code>) não são roteadas na internet pública. O NAT traduz o par privado para um público.</p>' }] },
          { rotulo: 'Loopback e link-local', blocos: [{ tipo: 'texto', html: '<p><code>127.0.0.0/8</code> é loopback (a própria máquina). <code>169.254.0.0/16</code> é <em>link-local</em>, onde nuvens costumam expor o serviço de metadados; o detalhe volta no bloco 5 (SSRF).</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>TCP e UDP: o que cada um promete</h3>' +
          '<p><strong>UDP</strong> entrega datagramas independentes, sem conexão: pode perder, duplicar e reordenar, e só preserva as fronteiras da mensagem. <strong>TCP</strong> entrega um <em>fluxo de bytes</em> confiável e ordenado, com controle de fluxo (não afogar o receptor) e de congestionamento (não afogar a rede).</p>' +
          '<p>A palavra decisiva é &quot;fluxo&quot;: o TCP <strong>não preserva fronteiras de mensagem</strong>. Se você envia 100 bytes e depois 50, o outro lado pode ler 150 de uma vez, ou 30 e 120. Todo protocolo sobre TCP precisa dizer onde a mensagem termina: o HTTP faz isso com <code>Content-Length</code> ou <code>Transfer-Encoding: chunked</code>, e é exatamente isso que o cliente do laboratório implementa.</p>' +
          '<p><strong>Escolha:</strong> precisa de ordem e entrega garantida (quase tudo na web) &rarr; TCP. Tolera perda e prefere frescor a completude (voz, jogos, DNS com consulta pequena) ou quer controlar a recuperação de perdas por conta própria (QUIC, a base do HTTP/3) &rarr; UDP.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Handshake de três vias', html:
          '<p>O cliente envia <code>SYN seq=x</code>; o servidor responde <code>SYN+ACK seq=y ack=x+1</code>; o cliente envia <code>ACK ack=y+1</code>. O cliente só pode mandar dados depois de receber o SYN+ACK (o ACK final já pode levar dados). O custo de abrir uma conexão é <strong>uma ida e volta (RTT)</strong> antes do primeiro byte de aplicação. É por isso que reutilizar conexões importa tanto.</p>' +
          '<p>O encerramento usa <code>FIN</code> de cada lado, e quem fecha primeiro fica em <code>TIME_WAIT</code> (tipicamente 60 s no Linux) para absorver pacotes atrasados; acumular <code>TIME_WAIT</code> é normal e só vira problema combinado com esgotamento de portas efêmeras no cliente. Um <code>RST</code> aborta a conexão sem cerimônia: é o que um host devolve ao receber um SYN para porta fechada (<em>refused</em>) e o que um balanceador envia ao derrubar uma conexão ociosa (<em>reset</em>).</p>' },
        { tipo: 'takeaway', html: 'Camadas <mark>encapsulam</mark>; IP acha o host, a porta acha a conversa; o TCP dá um <mark>fluxo sem fronteiras</mark> de mensagem.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Sockets: a fronteira com o seu código</h3>' +
          '<p>Um <strong>socket</strong> é o objeto do sistema operacional que representa uma ponta de comunicação. O servidor faz <code>bind</code> (reserva IP:porta), <code>listen</code> (aceita pedidos de conexão numa fila de tamanho limitado, o <em>backlog</em>) e <code>accept</code> (devolve um novo socket para cada cliente). O cliente faz <code>connect</code>. Depois, <code>send</code>/<code>recv</code>. Duas armadilhas sempre presentes: <code>recv(n)</code> devolve <em>até</em> n bytes (nunca &quot;a mensagem&quot;), e <code>send</code> pode escrever só parte, por isso <code>sendall</code>.</p>' +
          '<p>O laboratório isola isso em três funções: <code>build_request</code> monta os bytes, <code>fetch</code> abre o socket e envia, <code>parse_response</code> lê da conexão até o limite da mensagem.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'import socket\n\n' +
          'with socket.create_connection(("127.0.0.1", 8765), timeout=5) as sock:   # connect (+ DNS, se nome)\n' +
          '    sock.sendall(b"GET /health HTTP/1.1\\r\\nHost: 127.0.0.1\\r\\nConnection: close\\r\\n\\r\\n")\n' +
          '    chunks = []\n' +
          '    while data := sock.recv(4096):          # b"" = o outro lado fechou (FIN)\n' +
          '        chunks.append(data)\n' +
          'print(b"".join(chunks).split(b"\\r\\n", 1)[0])    # b\'HTTP/1.1 200 OK\'' },
        { tipo: 'texto', html:
          '<p>Dois detalhes: o <code>timeout</code> vale para cada operação de socket (não para o total), e ler até receber <code>b&quot;&quot;</code> só funciona porque pedimos <code>Connection: close</code>. Em conexão persistente não há fim de fluxo; é preciso saber o tamanho da resposta pelo cabeçalho.</p>' +
          '<h3>Latência e banda: duas grandezas, dois remédios</h3>' +
          '<p><strong>Latência</strong> é quanto leva um bit para ir e voltar (RTT); é limitada pela velocidade da luz na fibra (≈200 000 km/s) mais filas e processamento. São Paulo–Virgínia dá no mínimo ~120 ms de RTT por física e rota, sem nenhum erro de configuração. <strong>Banda</strong> é quantos bits por segundo cabem no canal. O produto banda × RTT (<em>bandwidth-delay product</em>) é quanto dado precisa estar &quot;no ar&quot; para encher o canal: 100 Mbit/s × 100 ms = 1,25 MB.</p>' +
          '<p>O TCP começa devagar (<em>slow start</em>): a janela inicial é de 10 segmentos, ≈14 KB (RFC 6928), e dobra a cada RTT enquanto não há perda. Uma resposta de 50 KB num canal de 1 Gbit/s ainda leva alguns RTTs, e dobrar a banda não muda quase nada. Resposta pequena é dominada por latência; transferência grande, por banda. Os remédios são distintos: para <strong>latência</strong>, menos viagens (reutilizar conexão, cache, CDN perto do usuário, menos chamadas em sequência); para <strong>banda</strong>, menos bytes (compressão, paginação, formatos compactos).</p>' },
        { tipo: 'rode', id: 'ttfb-rode', titulo: 'Quantas viagens até o primeiro byte?',
          enunciado: 'Cliente a 80 ms de RTT, nada em cache, <code>https://api.exemplo.com/notes</code>, resolvedor DNS próximo a 20 ms. Rode e clique em cada etapa.',
          prefixo: '$', entrada: 'python3 -c "print(20 + 80 + 80 + 80)"', unidade: 'ms', terminalTitulo: 'tempo até o primeiro byte', etapas: etapasTtfb(),
          prever: { pergunta: 'Com TLS 1.3 e conexão nova, quanto tempo passa até o primeiro byte da resposta chegar?', opcoes: [
            { id: 'a', texto: '80 ms: uma ida e volta, a da requisição.', correta: false, porque: 'isso só vale numa conexão reutilizada. Numa conexão nova há DNS, TCP e TLS antes da requisição.' },
            { id: 'b', texto: '180 ms: TCP, TLS e requisição, sem contar o DNS.', correta: false, porque: 'TCP (80) mais TLS (80) dá 160, e a requisição soma mais 80: 240 sem DNS. Com os 20 ms de DNS o total sobe.' },
            { id: 'c', texto: '260 ms: DNS 20 + TCP 80 + TLS 80 + requisição 80.', correta: true, porque: 'são quatro etapas em série, e três delas custam um RTT inteiro cada.' }
          ] },
          tutorAntes: 'Aperte Enter no comando já preenchido e clique em TLS 1.3 depois para ler só as linhas dele.',
          tutorDepois: 'Mais de 250 ms antes de o código do servidor executar uma linha. Com TLS 1.2 seriam 2 RTTs de TLS (340 ms). Com HTTP/3 sobre QUIC, transporte e criptografia se negociam juntos (1 RTT em vez de 2), e numa conexão retomada o cliente pode enviar dados já no primeiro voo (0-RTT, com risco de repetição, bloco 2).',
          callout: 'Você viu o custo em round trips, não em banda: três das quatro etapas pagam um RTT cada.' },
        { tipo: 'python', id: 'ttfb-python', titulo: 'Escreva a conta das viagens', obrigatorio: false,
          enunciado: 'Implemente <code>ttfb_ms(rtt, dns_ms, tls_rtts, reutilizada)</code>: conexão nova soma DNS, 1 RTT de TCP, <code>tls_rtts</code> RTTs de TLS e 1 RTT da requisição; conexão reutilizada paga só a requisição. RTT não positivo deve levantar <code>ValueError</code>.',
          codigo: codigoTtfb, testes: testesTtfb,
          dica: 'Conexão nova: <code>dns_ms + rtt + tls_rtts * rtt + rtt</code>. Trate <code>reutilizada</code> antes e devolva só <code>rtt</code>.',
          solucao: solucaoTtfb,
          tutorDepois: 'O mesmo código explica por que keep-alive e HTTP/3 aparecem em todo guia de desempenho: eles removem termos da soma.',
          callout: 'A conta das viagens passou nos testes, incluindo TLS 1.2, conexão reutilizada e RTT inválido.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: localhost tem duas famílias', html:
          '<p><code>localhost</code> resolve para <code>::1</code> (IPv6) e <code>127.0.0.1</code>. Um servidor que escuta só em <code>127.0.0.1</code> recusa a tentativa em <code>::1</code>. Com recusa (RST) o cliente cai para IPv4 em milissegundos; a lentidão aparece quando o pacote é <em>descartado</em> (regra de firewall, proxy mal configurado) e o cliente espera o timeout da primeira família antes de tentar a segunda. É o clássico &quot;lento só na minha máquina&quot;. Confira para quais famílias o nome resolve, quais o servidor atende e qual o cliente tenta primeiro. O laboratório fixa <code>127.0.0.1</code> de propósito.</p>' },
        { tipo: 'takeaway', html: 'Abrir conexão custa <mark>um RTT</mark> por etapa; latência pede <mark>menos viagens</mark>, banda pede <mark>menos bytes</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Delimitar mensagem num fluxo de bytes</h3>' +
          '<p>Como o TCP é um fluxo, quem lê precisa de um buffer e de uma regra de fim. Aqui a regra é a mais simples: uma mensagem termina em <code>\\n</code>. O leitor acumula o que chega e entrega só o que já terminou. O limite de buffer evita que um par que nunca manda o fim prenda memória sem teto.</p>' },
        { tipo: 'python', id: 'leitor-python', titulo: 'Reassemble mensagens de um fluxo', obrigatorio: false,
          enunciado: 'Complete <code>Leitor.alimentar</code>: devolva a lista de mensagens que ficaram completas (sem o <code>\\n</code>) e deixe o resto no buffer para o próximo pedaço.',
          codigo: codigoLeitor, testes: testesLeitor,
          dica: 'Enquanto houver <code>b"\\n"</code> no buffer, use <code>self.buf.split(b"\\n", 1)</code>: a primeira parte é a mensagem, a segunda volta para o buffer.',
          solucao: solucaoLeitor,
          tutorDepois: 'Esse laço é o que um parser HTTP faz com Content-Length: ler até ter a mensagem inteira, e recusar o que não tem fim dentro de um limite.',
          callout: 'O leitor passou nos testes: mensagem partida, duas no mesmo pedaço, pedaço sem fim e limite excedido.' },
        { tipo: 'complete', id: 'socket-complete', titulo: 'Monte o cliente de socket', obrigatorio: false,
          enunciado: 'Complete o cliente que pede <code>/health</code> e lê a resposta inteira, sabendo que o servidor fecha a conexão ao terminar.',
          linguagem: 'python',
          partes: [
            'import socket\n\nwith socket.create_connection(("127.0.0.1", 8765), ',
            { lacuna: 'timeout', opcoes: ['timeout=5', 'backlog=5', 'port=5'], correta: 0 },
            ') as sock:\n    ',
            { lacuna: 'envio', opcoes: ['sock.sendall(pedido)', 'sock.send(pedido)', 'sock.listen(pedido)'], correta: 0 },
            '\n    chunks = []\n    while ',
            { lacuna: 'laco', opcoes: ['data := sock.recv(4096)', 'sock.recv(4096) == 1', 'sock.accept()'], correta: 0 },
            ':\n        chunks.append(data)\n'
          ],
          explicacao: 'create_connection aceita timeout (vale para cada operação), sendall repete até enviar tudo (send pode escrever só parte), e recv devolve b"" quando o outro lado fecha, o que encerra o laço. listen e accept são do servidor.' },
        { tipo: 'takeaway', html: 'Quem lê um socket <mark>acumula num buffer</mark> e só entrega o que a regra de fim <mark>declarou completo</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'cenario', id: 'falhas-cenario', titulo: 'Três erros, três times', obrigatorio: false,
          enunciado: 'Três chamados chegam ao mesmo tempo. Decida a quem cada um vai e o que perguntar primeiro.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O serviço de pedidos chamou o de estoque. Os logs mostram: (1) <code>Connection refused</code> em 2 ms; (2) <code>timed out</code> depois de 30 s; (3) <code>Connection reset by peer</code> no meio de uma resposta, de um cliente com conexão ociosa. Por onde começa o chamado (1)?', opcoes: [
              { texto: 'Para o dono do serviço de estoque: o host respondeu, mas nenhum processo escuta naquela porta.', vai: 'n2', tom: 'ok', consequencia: 'o RST imediato prova que o host está de pé e a porta não tem serviço (ou recusou ativamente).' },
              { texto: 'Para a equipe de rede: pacotes sumiram no caminho.', vai: 'f-rede', tom: 'ruim', consequencia: 'pacote que some dá silêncio, não resposta em 2 ms.' }
            ] },
            n2: { texto: 'O (2) demorou 30 s e não deu resposta nenhuma. O que isso sugere?', opcoes: [
              { texto: 'Silêncio: firewall descartando, host fora do ar ou rota ruim. Investigar rede/infra e definir timeouts de conexão e leitura.', vai: 'n3', tom: 'ok', consequencia: 'sem timeout, um servidor mudo prende a thread por minutos; o timeout curto de conexão falha rápido.' },
              { texto: 'A mesma causa do (1): ninguém escuta na porta.', vai: 'f-igual', tom: 'ruim', consequencia: 'recusa ativa volta rápido; esperar o prazo inteiro é outro sintoma.' }
            ] },
            n3: { texto: 'O (3) foi um reset no meio da resposta, e a conexão estava ociosa havia minutos. Qual a hipótese mais forte?', opcoes: [
              { texto: 'Um balanceador derrubou a conexão ociosa; configurar o keep-alive do cliente abaixo do idle timeout dele.', vai: 'f-bom', tom: 'ok', consequencia: 'RST sobre conexão existente é queda, não recusa; o ajuste está no cliente ou no balanceador, não no serviço.' },
              { texto: 'DNS resolveu para o IP errado.', vai: 'f-dns', tom: 'ruim', consequencia: 'com IP errado a conexão nem teria sido estabelecida.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Três falhas, três lugares: recusa ativa (dono do serviço), silêncio (rede e timeouts) e queda de conexão existente (balanceador e keep-alive). O tempo de falha já indicava a camada.' },
            'f-rede': { bom: false, texto: 'Você acionou a equipe errada: uma resposta imediata não é pacote perdido.' },
            'f-igual': { bom: false, texto: 'Tratar tudo como &quot;rede fora&quot; faz cada time devolver o chamado ao outro.' },
            'f-dns': { bom: false, texto: 'Reset acontece em conexão que já existia; DNS e endereço já tinham dado certo.' }
          } },
        { tipo: 'escolha', id: 'b1-escolha-tcp', titulo: 'Confira: o recv que devolve pedaços',
          pergunta: 'Um protocolo caseiro sobre TCP funciona nos testes locais com payload pequeno e falha em produção com mensagens maiores. Qual a causa mais provável?',
          opcoes: [
            { id: 'a', texto: 'O código trata cada recv() como uma mensagem; em rede real o fluxo chega em pedaços de tamanho qualquer.', correta: true, porque: 'o TCP não preserva fronteiras; na rede local e com payload pequeno o recv() costuma devolver tudo de uma vez e o erro fica escondido.' },
            { id: 'b', texto: 'O TCP perdeu bytes no caminho.', correta: false, porque: 'o TCP retransmite e entrega em ordem; perder bytes sem avisar não é o comportamento dele.' },
            { id: 'c', texto: 'Falta trocar TCP por UDP.', correta: false, porque: 'UDP perde e reordena; resolveria uma coisa e criaria muitas outras.' }
          ], tutorDepois: 'Defina onde a mensagem termina e leia em laço até ter a mensagem inteira.' },
        { tipo: 'escolha', id: 'b1-escolha-remedio', titulo: 'Confira: latência ou banda',
          pergunta: 'Um painel faz 12 chamadas em série a uma API a 150 ms de RTT, cada uma com 2 KB. A tela demora vários segundos. O que mais ajuda?',
          opcoes: [
            { id: 'a', texto: 'Contratar um enlace com o dobro de banda.', correta: false, porque: 'são respostas de 2 KB: o tempo é dominado por viagens, não por bytes.' },
            { id: 'b', texto: 'Reaproveitar a conexão e reduzir as chamadas em série (agrupar ou paralelizar).', correta: true, porque: 'cada chamada em conexão nova paga vários RTTs; menos viagens é o remédio de latência.' },
            { id: 'c', texto: 'Comprimir os 2 KB com um formato binário.', correta: false, porque: 'economizaria bytes, que não são o gargalo aqui.' }
          ], tutorDepois: 'Resposta pequena é dominada por latência; transferência grande, por banda.' },
        { tipo: 'takeaway', html: '<mark>Refused</mark> é recusa ativa, <mark>timeout</mark> é silêncio, <mark>reset</mark> é queda de conexão existente; defina sempre <mark>timeouts</mark> de conexão e leitura.' }
      ] }
    ]
  });
})();
