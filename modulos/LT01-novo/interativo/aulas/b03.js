/* LT01 · Bloco 3: DNS, endereços, TCP, TLS e o caminho da conexão. Fonte: LT01.html#b03. Saídas do diagrama de camadas são ilustrativas (a medição pertence ao lab/). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var refResolucao = `"""Resolução local: nome vira endereço sem rede externa.
Referencia executavel do Bloco 3. So STDLIB (socket, time).
Opera sobre localhost e nomes .invalid; nenhum DNS externo.
"""
from __future__ import annotations
import socket
import time

class NomeInexistente(ValueError):
    """Hostname sem registro: equivalente local de NXDOMAIN."""

class ResolucaoExpirada(TimeoutError):
    """Resposta local mais lenta que o prazo contratado."""

def resolver_local(hostname: str, prazo: float) -> list[str]:
    """Resolve usando só recursos locais e publica os endereços.
    "localhost" resolve via getaddrinfo sem sair da máquina.
    Qualquer outro nome fora do contrato rende NomeInexistente
    sem tocar na rede. O prazo é validado na entrada.
    """
    if not prazo > 0:
        raise ValueError("prazo precisa ser positivo")
    nome = hostname.strip().lower()
    if not nome:
        raise ValueError("hostname vazio não resolve")
    if nome != "localhost" and not nome.endswith(".localhost"):
        raise NomeInexistente(f"sem registro: {hostname!r}")
    try:
        infos = socket.getaddrinfo(nome, None, type=socket.SOCK_STREAM)
    except socket.gaierror as erro:
        raise NomeInexistente(f"sem registro: {hostname!r}") from erro
    enderecos: list[str] = []
    for _, _, _, _, sockaddr in infos:
        ip = str(sockaddr[0])
        if ip not in enderecos:
            enderecos.append(ip)
    return enderecos

def resolver_com_atraso(hostname: str, prazo: float, atraso: float) -> list[str]:
    """Lado do timeout: atraso local excede o prazo e vira ResolucaoExpirada.
    O atraso acontece na máquina, nunca na rede: prova que o
    chamador respeita o prazo antes de qualquer resposta.
    """
    if not prazo > 0 or atraso < 0:
        raise ValueError("prazo positivo e atraso não negativo")
    inicio = time.monotonic()
    time.sleep(atraso)
    if time.monotonic() - inicio > prazo:
        raise ResolucaoExpirada(f"{hostname!r} excedeu {prazo}s")
    return resolver_local(hostname, prazo)`;

  var refTcp = `"""Conexão TCP local: refused nasce no connect, reset nasce na leitura.
Referencia executavel do Bloco 3. So STDLIB (socket, struct, threading).
Servidores só em 127.0.0.1 com porta efêmera; nenhum tráfego externo.
"""
from __future__ import annotations
import socket
import struct
import threading

class ConexaoRecusada(ConnectionError):
    """Porta fechada: o sistema recusou no connect."""

class ConexaoResetada(ConnectionError):
    """Conversa abortada: RST após o aceite, visível na leitura."""

def porta_livre_fechada() -> int:
    """Reserva uma porta efêmera e a libera: o próximo connect recusa."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sonda:
        sonda.bind(("127.0.0.1", 0))
        return int(sonda.getsockname()[1])

def servir_reset_uma_vez() -> int:
    """Aceita uma conexão em 127.0.0.1 e a aborta com RST; devolve a porta.
    O RST é forçado com SO_LINGER zerado: a leitura do cliente falha
    em vez de receber EOF limpo. Thread daemon; morre sozinha.
    """
    escuta = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    escuta.bind(("127.0.0.1", 0))
    escuta.listen(1)
    porta = int(escuta.getsockname()[1])

    def atender() -> None:
        with escuta:
            conn, _ = escuta.accept()
            with conn:
                conn.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack("ii", 1, 0))
                # Sair do with fecha: com linger zero, o fechamento vira RST.

    processo = threading.Thread(target=atender, daemon=True)
    processo.start()
    return porta

def conectar(host: str, porta: int, prazo: float) -> socket.socket:
    """Conecta em host:porta; porta fechada vira ConexaoRecusada.
    O socket devolvido pertence ao chamador: feche após o uso.
    Reset pós-aceite não aparece aqui; aparece na leitura.
    """
    try:
        return socket.create_connection((host, porta), timeout=prazo)
    except ConnectionRefusedError as erro:
        raise ConexaoRecusada(f"{host}:{porta} recusou") from erro

def ler_ate_reset(conexao: socket.socket, prazo: float) -> None:
    """Lê até o abort: RST vira ConexaoResetada; EOF limpo retorna.
    Distingue o fim negociado (bytes vazios) do abort (reset).
    """
    conexao.settimeout(prazo)
    try:
        while True:
            parte = conexao.recv(4096)
            if not parte:
                return
    except ConnectionResetError as erro:
        raise ConexaoResetada("par abortou a conversa (RST)") from erro`;

  var refTls = `"""TLS local: hostname e validade verificados, verificação nunca desligada.
Referencia executavel do Bloco 3. So STDLIB (socket, ssl, time).
Handshake só contra 127.0.0.1 com material da folha L; sem rede externa.
"""
from __future__ import annotations
import socket
import ssl
import time

class HostnameInvalido(ValueError):
    """Certificado não cobre o hostname pedido."""

class CertificadoExpirado(ValueError):
    """Certificado fora da janela notBefore/notAfter."""

def _casa(padrao: str, nome: str) -> bool:
    """Curinga só no rótulo mais à esquerda; o resto é igualdade exata."""
    texto = padrao.strip().lower()
    alvo = nome.strip().lower()
    if texto.startswith("*."):
        sufixo = texto[1:]
        return alvo.endswith(sufixo) and "." in alvo[: -len(sufixo)]
    return texto == alvo

def verificar_hostname(cert: dict[str, object], hostname: str) -> None:
    """Confere SAN dNSName e recorre ao CN; divergência vira HostnameInvalido."""
    if not hostname.strip():
        raise ValueError("hostname vazio não verifica")
    nomes: list[str] = []
    alternativa = cert.get("subjectAltName", ())
    if isinstance(alternativa, tuple):
        for tipo, valor in alternativa:
            if tipo == "DNS" and isinstance(valor, str):
                nomes.append(valor)
    if not nomes:
        sujeito = cert.get("subject", ())
        if isinstance(sujeito, tuple):
            for bloco in sujeito:
                if not isinstance(bloco, tuple):
                    continue
                for chave, valor in bloco:
                    if chave == "commonName" and isinstance(valor, str):
                        nomes.append(valor)
    for candidato in nomes:
        if _casa(candidato, hostname):
            return
    raise HostnameInvalido(f"certificado não cobre {hostname!r}")

def verificar_validade(cert: dict[str, object], agora: float) -> None:
    """Confere notBefore/notAfter contra o relógio dado."""
    antes = cert.get("notBefore")
    depois = cert.get("notAfter")
    if not isinstance(antes, str) or not isinstance(depois, str):
        raise ValueError("certificado sem janela de validade legível")
    inicio = ssl.cert_time_to_seconds(antes)
    fim = ssl.cert_time_to_seconds(depois)
    _ = time.gmtime(0)
    if agora < inicio:
        raise CertificadoExpirado("certificado ainda não válido para este relógio")
    if agora > fim:
        raise CertificadoExpirado("certificado expirado para este relógio")

def apertar_mao(host: str, porta: int, cafile: str, hostname: str, prazo: float) -> dict[str, object]:
    """Executa o handshake TLS e publica o certificado do par.
    Contexto com check_hostname ligado e âncora da folha L: hostname
    divergente, expirado ou cadeia desconhecida falha aqui via
    ssl.CertificateError/SSLError e a conversa nunca segue adiante.
    """
    contexto = ssl.create_default_context(cafile=cafile)
    contexto.check_hostname = True
    contexto.verify_mode = ssl.CERT_REQUIRED
    with (
        socket.create_connection((host, porta), timeout=prazo) as bruto,
        contexto.wrap_socket(bruto, server_hostname=hostname) as tunel,
    ):
        tunel.settimeout(prazo)
        par = tunel.getpeercert()
        if not isinstance(par, dict):
            return {}
        return dict(par)`;

  var etapasCamadas = function () {
    return [
      { id: 'nome', nome: 'Nome', descricao: 'Resolver: hostname vira endereço', tom: 'dns', ms: 1, linhas: [
        L('info', 'resolver_local("localhost") publica os endereços locais, como 127.0.0.1 e ::1 (a lista depende da pilha local)'),
        L('hint', 'só com endereços publicados faz sentido falar em conexão')] },
      { id: 'tcp', nome: 'TCP', descricao: 'Handshake de três passos: SYN, SYN-ACK, ACK', tom: 'tcp', ms: 1, linhas: [
        L('info', 'connect passa: SYN, SYN-ACK, ACK'),
        L('hint', 'a partir daqui existem bytes de aplicação')] },
      { id: 'tls', nome: 'TLS', descricao: 'Cadeia, hostname (SNI/SAN) e validade', tom: 'tls', ms: 3, linhas: [
        L('info', 'SNI enviado em claro; certificado do servidor verificado: cadeia, hostname e validade'),
        L('hint', 'verificação ligada; canal cifrado e servidor autenticado')] },
      { id: 'http', nome: 'Aplicação', descricao: 'Leitura da resposta HTTP', tom: 'response', ms: 2, linhas: [
        L('out', 'bytes da resposta lidos até o fim negociado (EOF sem erro)'),
        L('hint', 'close limpo é o fim saudável, não uma falha')] }
    ];
  };
  var falhasCamadas = [
    { id: 'nx', rotulo: 'NXDOMAIN ao resolver o nome', efeito: { etapaFalha: 'nome', linhasErro: [
      L('out', "NomeInexistente: sem registro: 'api.invalid'"),
      L('hint', 'resposta imediata de ausência: camada de resolução, antes de qualquer pacote')],
      tutor: 'NXDOMAIN afirma que o nome não existe. Primeiro oráculo: grafia e zona; para nome recém-criado, lembre do TTL negativo.' } },
    { id: 'ref', rotulo: 'Falha instantânea no connect', efeito: { etapaFalha: 'tcp', linhasErro: [
      L('out', 'ConexaoRecusada: 127.0.0.1:PORTA recusou'),
      L('hint', 'sem bytes trocados: porta sem escuta')],
      tutor: 'Refused é o reset do primeiro passo: o endereço respondeu e nenhum programa escuta naquela porta. Confira o programa e a porta, não o nome.' } },
    { id: 'tmo', rotulo: 'Silêncio até o timeout, no connect', efeito: { etapaFalha: 'tcp', linhasErro: [
      L('out', 'TimeoutError: sem resposta até o prazo'),
      L('hint', 'falha lenta: silêncio no caminho (filtro, rota ou perda sustentada)')],
      tutor: 'Timeout é ausência de resposta, ao contrário de recusa, que responde na hora. Investigue o caminho, não a porta.' } },
    { id: 'host', rotulo: 'Certificado não cobre o hostname', efeito: { etapaFalha: 'tls', linhasErro: [
      L('out', "HostnameInvalido: certificado não cobre 'api.localhost'"),
      L('hint', 'cadeia íntegra, nome divergente: a camada de confiança recusou antes da aplicação falar')],
      tutor: 'O canal seria cifrado com o servidor errado. Conserte o nome, o SNI ou o certificado; nunca desligue a verificação.' } },
    { id: 'rst', rotulo: 'Connect passa e a leitura levanta erro (RST)', efeito: { etapaFalha: 'http', linhasErro: [
      L('out', 'ConexaoResetada: par abortou a conversa (RST)'),
      L('hint', 'o connect passou; o erro está na leitura, não é EOF')],
      tutor: 'Reset pós-aceite aponta para abort do outro lado (crash, descarte, backlog estourado). Registre a chamada que falhou e os bytes já lidos.' } }
  ];

  var codigoCache = [
    'class Cache:',
    '    """Cache de resolução com TTL positivo e negativo (relógio injetado)."""',
    '',
    '    def __init__(self, autoritativo, ttl_negativo=30):',
    '        self.autoritativo = autoritativo  # nome -> (ip, ttl) ou None (NXDOMAIN)',
    '        self.ttl_negativo = ttl_negativo',
    '        self.itens = {}  # nome -> (ip ou None, expira_em)',
    '',
    '    def consultar(self, nome, agora):',
    '        # 1. resposta guardada e ainda dentro do prazo (agora < expira_em): devolva',
    '        #    (vale também para a ausência memorizada: None)',
    '        # 2. senão, pergunte ao autoritativo e guarde pelo TTL certo:',
    '        #    ip -> ttl do record; ausência -> self.ttl_negativo',
    '        return self.autoritativo(nome)',
    '',
    '',
    'zona = {"api.exemplo": ("10.0.0.1", 60)}',
    'c = Cache(lambda n: zona.get(n))',
    'print(c.consultar("api.exemplo", 0), c.consultar("novo.exemplo", 0))'
  ].join("\n");
  var testesCache = [
    'def montar():',
    '    zona = {"api.exemplo": ("10.0.0.1", 60)}',
    '    chamadas = []',
    '',
    '    def autoritativo(nome):',
    '        chamadas.append(nome)',
    '        return zona.get(nome)',
    '',
    '    return zona, chamadas, Cache(autoritativo, ttl_negativo=30)',
    '',
    '',
    'def test_resposta_dentro_do_ttl_vem_do_cache():',
    '    zona, chamadas, c = montar()',
    '    assert c.consultar("api.exemplo", 0) == "10.0.0.1"',
    '    assert c.consultar("api.exemplo", 59) == "10.0.0.1"',
    '    assert chamadas == ["api.exemplo"]',
    '',
    '',
    'def test_mudanca_so_pega_depois_do_ttl():',
    '    zona, chamadas, c = montar()',
    '    c.consultar("api.exemplo", 0)',
    '    zona["api.exemplo"] = ("10.0.0.2", 60)',
    '    assert c.consultar("api.exemplo", 30) == "10.0.0.1"',
    '    assert c.consultar("api.exemplo", 60) == "10.0.0.2"',
    '',
    '',
    'def test_negative_caching_esconde_nome_recem_criado():',
    '    zona, chamadas, c = montar()',
    '    assert c.consultar("novo.exemplo", 0) is None',
    '    zona["novo.exemplo"] = ("10.0.0.9", 60)',
    '    assert c.consultar("novo.exemplo", 29) is None',
    '    assert c.consultar("novo.exemplo", 30) == "10.0.0.9"',
    '',
    '',
    'def test_ausencia_memorizada_nao_repete_a_pergunta():',
    '    zona, chamadas, c = montar()',
    '    c.consultar("x.exemplo", 0)',
    '    c.consultar("x.exemplo", 10)',
    '    assert chamadas == ["x.exemplo"]',
    '',
    '',
    'def test_controle_negativo_outro_nome_nao_e_afetado():',
    '    zona, chamadas, c = montar()',
    '    c.consultar("novo.exemplo", 0)',
    '    assert c.consultar("api.exemplo", 1) == "10.0.0.1"'
  ].join("\n");
  var solucaoCache = [
    'class Cache:',
    '    def __init__(self, autoritativo, ttl_negativo=30):',
    '        self.autoritativo = autoritativo',
    '        self.ttl_negativo = ttl_negativo',
    '        self.itens = {}',
    '',
    '    def consultar(self, nome, agora):',
    '        item = self.itens.get(nome)',
    '        if item is not None and agora < item[1]:',
    '            return item[0]',
    '        resposta = self.autoritativo(nome)',
    '        if resposta is None:',
    '            self.itens[nome] = (None, agora + self.ttl_negativo)',
    '            return None',
    '        ip, ttl = resposta',
    '        self.itens[nome] = (ip, agora + ttl)',
    '        return ip'
  ].join("\n");
  var codigoCert = [
    'class HostnameInvalido(ValueError):',
    '    pass',
    '',
    '',
    'class CertificadoExpirado(ValueError):',
    '    pass',
    '',
    '',
    'def casa(padrao, nome):',
    '    # igualdade exata, ignorando maiúsculas; curinga "*." vale só no rótulo mais',
    '    # à esquerda: "*.exemplo.com" cobre "api.exemplo.com", mas nem "exemplo.com"',
    '    # nem "a.b.exemplo.com"',
    '    return padrao == nome',
    '',
    '',
    'def verificar_hostname(cert, hostname):',
    '    # SAN (lista cert["san"]) primeiro; o CN (cert["cn"]) só se não houver SAN',
    '    nomes = []',
    '    for candidato in nomes:',
    '        if casa(candidato, hostname):',
    '            return',
    '    raise HostnameInvalido(hostname)',
    '',
    '',
    'def verificar_validade(cert, agora):',
    '    # cert["nao_antes"] e cert["nao_depois"]: segundos; fora da janela -> CertificadoExpirado',
    '    pass',
    '',
    '',
    'print(casa("*.exemplo.com", "api.exemplo.com"))'
  ].join("\n");
  var testesCert = [
    'CERT = {"san": ["*.exemplo.com", "exemplo.com"], "cn": "legado.com", "nao_antes": 100, "nao_depois": 200}',
    '',
    '',
    'def erra(f, *args):',
    '    try:',
    '        f(*args)',
    '    except (HostnameInvalido, CertificadoExpirado):',
    '        return True',
    '    return False',
    '',
    '',
    'def test_curinga_cobre_um_rotulo():',
    '    verificar_hostname(CERT, "api.exemplo.com")',
    '    verificar_hostname(CERT, "API.exemplo.com")',
    '    verificar_hostname(CERT, "exemplo.com")',
    '',
    '',
    'def test_curinga_nao_cobre_dois_rotulos_nem_o_apex():',
    '    so_curinga = dict(CERT, san=["*.exemplo.com"])',
    '    assert erra(verificar_hostname, so_curinga, "a.b.exemplo.com")',
    '    assert erra(verificar_hostname, so_curinga, "exemplo.com")',
    '',
    '',
    'def test_san_tem_prioridade_sobre_cn():',
    '    assert erra(verificar_hostname, CERT, "legado.com")',
    '    sem_san = dict(CERT, san=[])',
    '    verificar_hostname(sem_san, "legado.com")',
    '',
    '',
    'def test_validade_nas_bordas():',
    '    verificar_validade(CERT, 100)',
    '    verificar_validade(CERT, 200)',
    '    assert erra(verificar_validade, CERT, 99)',
    '    assert erra(verificar_validade, CERT, 201)',
    '',
    '',
    'def test_controle_negativo_relogio_errado_reprova_cert_certo():',
    '    assert erra(verificar_validade, CERT, 50)'
  ].join("\n");
  var solucaoCert = [
    'class HostnameInvalido(ValueError):',
    '    pass',
    '',
    '',
    'class CertificadoExpirado(ValueError):',
    '    pass',
    '',
    '',
    'def casa(padrao, nome):',
    '    padrao = padrao.strip().lower()',
    '    nome = nome.strip().lower()',
    '    if padrao.startswith("*."):',
    '        sufixo = padrao[1:]',
    '        return nome.endswith(sufixo) and "." not in nome[: -len(sufixo)] and len(nome) > len(sufixo)',
    '    return padrao == nome',
    '',
    '',
    'def verificar_hostname(cert, hostname):',
    '    nomes = list(cert.get("san", []))',
    '    if not nomes and cert.get("cn"):',
    '        nomes = [cert["cn"]]',
    '    for candidato in nomes:',
    '        if casa(candidato, hostname):',
    '            return',
    '    raise HostnameInvalido(hostname)',
    '',
    '',
    'def verificar_validade(cert, agora):',
    '    if agora < cert["nao_antes"]:',
    '        raise CertificadoExpirado("ainda não válido")',
    '    if agora > cert["nao_depois"]:',
    '        raise CertificadoExpirado("expirado")'
  ].join("\n");

  TrilhaAula.registrar({
    id: 'lt01-b3',
    titulo: 'DNS, endereços, TCP, TLS e o caminho da conexão',
    minutos: 55,
    resumo: 'Trocar "erro de rede" por camada nomeada: resolução, transporte, TLS ou aplicação, cada uma com sintoma, mecanismo e evidência própria. O caminho é nome, IP, conexão, TLS e só então HTTP.',
    objetivo: 'Localizar uma falha no caminho nome, IP, conexão, TLS e HTTP pelo sintoma, distinguir refused de reset de EOF e verificar hostname e validade sem nunca desligar a verificação.',
    revisao: [
      { id: 'lt01b3-nxdomain', pergunta: 'O registro DNS foi criado agora, mas o cliente segue recebendo NXDOMAIN por minutos. Qual mecanismo explica?',
        opcoes: [
          opc('a', 'Negative caching: a resposta "não existe" também tem TTL e fica memorizada até expirar', true, 'cache é promessa com prazo, inclusive a ausência; NXDOMAIN é resposta, timeout é falta de resposta.'),
          opc('b', 'O servidor DNS está quebrado', false, 'resposta velha dentro do prazo é comportamento, não defeito.'),
          opc('c', 'O TLS está falhando', false, 'TLS só entra depois de nome e TCP.')] },
      { id: 'lt01b3-refused', pergunta: 'connect() falha de imediato, sem bytes trocados. Camada e causa provável?',
        opcoes: [
          opc('a', 'Transporte: o endereço respondeu, mas nenhum programa escuta naquela porta (ou a porta está errada)', true, 'refused é o reset do primeiro passo; aponta para programa ausente ou porta errada, nunca para nome.'),
          opc('b', 'DNS: o nome não existe', false, 'o connect só acontece depois de endereços publicados.'),
          opc('c', 'TLS: certificado inválido', false, 'TLS vem depois do aceite TCP.')] },
      { id: 'lt01b3-eof', pergunta: 'A leitura devolve bytes e depois o fim, sem erro. O que isso declara?',
        opcoes: [
          opc('a', 'Close limpo (FIN): fim negociado e saudável; tratá-lo como falha é o falso positivo do bloco', true, 'reset levanta erro de conexão na leitura; EOF sem erro é fim saudável.'),
          opc('b', 'Reset pós-aceite', false, 'reset levanta erro em vez de EOF.'),
          opc('c', 'Timeout de transporte', false, 'timeout é silêncio, sem bytes e sem fim.')] },
      { id: 'lt01b3-verify', pergunta: 'O certificado falha na verificação e alguém sugere <code>verify=False</code> "só para passar". Por que não?',
        opcoes: [
          opc('a', 'A cifra continua, mas a autenticação some: o teste passa contra impostor, expirado ou de outro nome', true, 'falha de certificado se conserta no certificado, no nome ou no relógio, nunca no cliente que verifica.'),
          opc('b', 'Só aumenta a latência do handshake', false, 'o custo é a garantia de com quem se fala.'),
          opc('c', 'Só afeta HTTP/2', false, 'vale para todo handshake TLS.')] },
      { id: 'lt01b3-ordem', pergunta: 'Em que ordem acontecem os eventos ao abrir <code>https://api.exemplo/</code> pela primeira vez?',
        opcoes: [
          opc('a', 'Resolver o nome, handshake TCP, handshake TLS (com SNI) e só então a requisição HTTP', true, 'saber a ordem permite localizar a camada da falha pelo sintoma.'),
          opc('b', 'TLS, DNS, TCP, HTTP', false, 'TLS roda sobre uma conversa TCP já aberta, que exige um endereço.'),
          opc('c', 'HTTP, TCP, DNS, TLS', false, 'HTTP é a última camada a falar.')] }
    ],
    abas: [
      { rotulo: 'Do nome ao endereço', blocos: [
        { tipo: 'texto', html:
          '<p>Os Blocos 1 e 2 mostraram onde o programa mora (o processo) e onde pisa (nomes, permissões, descritores). Este mostra <strong>por onde ele chega</strong>: o caminho entre o nome digitado e o socket atendido. Pré-requisitos: M02, M03 e Blocos 1 e 2. Todo exemplo é Python 3.14 só com stdlib (<code>socket</code>, <code>ssl</code>), e todo experimento acontece contra <code>localhost</code>.</p>' +
          '<h3>O nome precisa virar número</h3>' +
          '<p><strong>Hostname</strong> é o nome legível que precisa virar endereço antes de qualquer byte viajar. Quem traduz é o <strong>resolver</strong>, a rotina do sistema que consulta fontes locais primeiro e a rede de nomes depois. A confusão a desfazer: <em>resolver não é conectar</em>. Um nome pode resolver perfeitamente para um endereço onde nada escuta; uma conexão pode recusar num endereço que resolveu sem erro.</p>' +
          '<p>A rede de nomes guarda <strong>records</strong> tipados: <strong>A</strong> responde com IPv4, <strong>AAAA</strong> com IPv6, <strong>CNAME</strong> com outro nome (um apelido que exige nova resolução até alcançar um A ou AAAA). Cada resposta carrega um <strong>TTL</strong>, o prazo em segundos em que pode ser reutilizada. <strong>Cache</strong> é essa reutilização; <strong>negative caching</strong> aplica o mesmo mecanismo à resposta "este nome não existe", memorizada pelo TTL negativo.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Termo</th><th>Definição e mecanismo</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>Hostname</td><td>Nome a resolver. Vira endereço por consulta; nunca é endereço por si.</td><td>Nome que resolve não declara serviço saudável.</td></tr>' +
          '<tr><td>Resolver</td><td>Rotina que traduz nome em endereços, com cache local e prazo próprio.</td><td>Resolver lento ou ausente trava a chamada antes do primeiro pacote: o sintoma mora na fase de nome.</td></tr>' +
          '<tr><td>A / AAAA / CNAME</td><td>IPv4, IPv6 ou outro nome. Uma resolução completa pode encadear os três.</td><td>Cada elo de CNAME é uma nova resolução com cache e erro próprios.</td></tr>' +
          '<tr><td>TTL e cache</td><td>O TTL declara por quanto tempo a resposta vale. Resposta velha dentro do TTL é comportamento, não defeito.</td><td>Mudança de endereço demora até o TTL expirar em cada cache do caminho.</td></tr>' +
          '<tr><td>NXDOMAIN / timeout</td><td>NXDOMAIN é resposta: o nome não existe. Timeout é ausência de resposta no prazo. Um afirma, o outro desiste.</td><td>Nome criado agora pode continuar "inexistente" até o TTL negativo expirar.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Cache é promessa com prazo', html:
          '<p>Endereço errado após mudança aponta para cache dentro do prazo; nome novo que "não existe" aponta para negativo memorizado; lentidão antes do primeiro pacote aponta para resolver sem resposta, <em>não</em> para rede lenta. Ordem que localiza: (1) perguntar o nome e aguardar até o prazo; (2) "não existe" é camada de resolução, com o nome registrado; (3) sem resposta no prazo é camada de resolução, com o prazo registrado; (4) só com endereços publicados faz sentido falar em conexão.</p>' },
        { tipo: 'python', id: 'cache-python', titulo: 'Cache com TTL positivo e negativo', obrigatorio: false,
          enunciado: 'Complete <code>Cache.consultar(nome, agora)</code>. O relógio é injetado (<code>agora</code>, em segundos). Dentro do prazo (<code>agora &lt; expira_em</code>) devolva o guardado, inclusive a ausência (<code>None</code>); fora dele, pergunte ao <code>autoritativo</code>: um <code>(ip, ttl)</code> é guardado pelo TTL do record, <code>None</code> (NXDOMAIN) pelo <code>ttl_negativo</code>.',
          codigo: codigoCache, testes: testesCache,
          dica: 'Guarde <code>(resposta, expira_em)</code> em <code>self.itens[nome]</code>. A ausência também é guardada, com <code>agora + self.ttl_negativo</code>.',
          solucao: solucaoCache,
          tutorDepois: 'Os testes de borda contam a história: o endereço antigo continua valendo dentro do TTL, e o nome recém-criado continua inexistente até o TTL negativo expirar. Nenhum dos dois é defeito.',
          callout: 'O cache respeita o TTL nos dois sentidos, com o negativo memorizado.' },
        { tipo: 'texto', html:
          '<h3>O endereço precisa virar conversa: IP, porta e socket</h3>' +
          '<p><strong>IP</strong> identifica a máquina, não o programa. <strong>Porta</strong> identifica o programa dentro da máquina; o par IP mais porta identifica a conversa. <strong>Socket</strong> é o descritor que o processo segura para essa conversa: um FD como os do Bloco 2, com o mesmo teto e o mesmo vazamento. <strong>Localhost</strong> é o nome contratado deste bloco: resolve para a própria máquina, o que dá determinismo (sem DNS externo, rota ou firewall) e segurança do laboratório (nenhum byte de teste alcança serviço alheio). IPv6 aparece como segundo endereço do mesmo nome quando a pilha local o oferece; a referência publica a lista completa.</p>' +
          '<p>Limites: IP alcançável não implica serviço escutando (roteamento certo com porta fechada recusa, e isso é transporte, não nome); número de porta não carrega semântica de protocolo; sucesso contra localhost prova as camadas locais, nunca a rede externa.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: refResolucao },
        { tipo: 'takeaway', html: 'Resolver <mark>não é conectar</mark>: NXDOMAIN afirma ausência, timeout desiste no prazo, e o cache vale pelo <mark>TTL</mark>, inclusive o negativo.' }
      ] },

      { rotulo: 'Transporte: TCP', blocos: [
        { tipo: 'texto', html:
          '<h3>O transporte precisa virar acordo</h3>' +
          '<p>O <strong>handshake TCP</strong> abre a conversa em três passos: o cliente propõe com SYN, o servidor aceita com SYN-ACK, o cliente confirma com ACK. Só depois do terceiro passo existem bytes de aplicação, e só a partir daí faz sentido falar em TLS ou HTTP. Falha antes do acordo completo pertence ao transporte; falha depois, à camada que assumiu a conversa.</p>' +
          '<p><strong>Retransmissão</strong> é o reenvio do segmento sem confirmação após um prazo (RTO): o remetente espera, reenvia e dobra a espera. Perda isolada vira latência; perda sustentada vira desistência, e o erro sobe como timeout de transporte. Perda silencia e demora; recusa responde de imediato.</p>' +
          '<p>Encerrar tem duas formas. <strong>Close (FIN)</strong> é o encerramento negociado: cada lado declara "terminei de enviar" e os dados entregues permanecem válidos; a leitura devolve os bytes restantes e depois EOF, sem erro. <strong>Reset (RST)</strong> é o abort sem negociação (porta fechada que recebe tentativa, programa que morre com dados por ler): a leitura levanta erro de conexão, não EOF. <strong>Refused</strong> é o reset do primeiro passo, respondido na hora.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sinal</th><th>Onde nasce</th><th>Evidência que distingue</th></tr></thead><tbody>' +
          '<tr><td>Refused</td><td>No connect: porta sem escuta recusa de imediato</td><td>Falha rápida no connect, sem bytes trocados. Programa ausente ou porta errada, nunca nome.</td></tr>' +
          '<tr><td>Reset pós-aceite</td><td>Na leitura: aceita e depois abortada (RST)</td><td>O connect passa e a leitura levanta erro em vez de EOF. Crash, abort ou backlog estourado do outro lado.</td></tr>' +
          '<tr><td>Timeout de transporte</td><td>Na espera: SYN sem resposta ou confirmação que nunca chega</td><td>Falha lenta, sem resposta. Silêncio no caminho (filtro, rota, perda sustentada): investigue o caminho, não a porta.</td></tr>' +
          '<tr><td>Close limpo</td><td>Na despedida: FIN negociado após os dados</td><td>A leitura devolve bytes e depois EOF, sem erro. É o fim saudável; tratá-lo como falha é o falso positivo do bloco.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: '"Recusou, resetou, expirou: tudo é erro de conexão"', html:
          '<p>Não. Cada sinal nasce num ponto distinto do acordo e prescreve conserto distinto: refused manda conferir programa e porta; reset manda investigar o abort após o aceite; timeout manda investigar silêncio no caminho; EOF manda aceitar o fim negociado. Colapsar os quatro num "erro de rede" prescreve o conserto errado com confiança total: reiniciar serviço para problema de rota, conferir DNS para porta fechada, aumentar timeout para abort.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          '# refused: o connect falha de imediato; nada foi aceito, nada foi lido;',
          '# reset: o connect passa, a leitura levanta erro em vez de EOF;',
          '# close: o connect passa, a leitura devolve bytes e depois o fim, sem erro;',
          '# timeout: nenhuma resposta até o prazo; o erro registra silêncio, não recusa.'].join('\n') },
        { tipo: 'escolha', id: 'tcp-escolha', titulo: 'Confira: três connects diferentes', obrigatorio: false,
          pergunta: 'Três tentativas: (1) o connect falha na hora, sem bytes; (2) o connect passa e a leitura levanta erro; (3) o connect passa e a leitura devolve bytes e depois o fim, sem erro. O que cada uma declara, nessa ordem?',
          opcoes: [
            { id: 'a', texto: 'Refused (porta sem escuta), reset pós-aceite (abort do par), close limpo (fim saudável).', correta: true, porque: 'a chamada que falha e o erro separam os três: connect, leitura com erro, leitura com EOF.' },
            { id: 'b', texto: 'Timeout, refused, reset.', correta: false, porque: 'timeout é silêncio; a primeira tentativa respondeu na hora.' },
            { id: 'c', texto: 'Os três são "erro de conexão" e se corrigem aumentando o prazo.', correta: false, porque: 'a terceira nem é falha, e prazo maior não consertaria as outras.' }
          ], tutorDepois: 'O diagnóstico lê a evidência: em qual chamada falhou, após quantos bytes, com que erro.' },
        { tipo: 'codigo', linguagem: 'python', texto: refTcp },
        { tipo: 'takeaway', html: 'Refused falha no <mark>connect</mark>, reset falha na <mark>leitura</mark>, EOF sem erro é <mark>fim saudável</mark> e silêncio até o prazo é caminho: cada sinal prescreve seu conserto.' }
      ] },

      { rotulo: 'TLS e a camada que falhou', blocos: [
        { tipo: 'texto', html:
          '<h3>O canal precisa virar confiança</h3>' +
          '<p><strong>TLS 1.3</strong> transforma a conversa TCP em canal autenticado e cifrado e roda antes de qualquer byte de aplicação: o TCP acorda, o TLS confia, só então o HTTP fala. Negocia versão, cifras e chaves efêmeras, com sigilo futuro (<em>forward secrecy</em>): chaves de sessão descartadas não revelam o passado se o material de longo prazo vazar depois.</p>' +
          '<p>O cliente informa o nome que procura antes de ver o certificado: o <strong>SNI</strong>, enviado em claro no início do handshake para o servidor escolher o certificado certo. <strong>Certificado</strong> é a declaração assinada que liga um nome a uma chave pública, com janela de validade. <strong>Cadeia</strong> é a sequência de assinaturas do certificado do servidor até uma raiz confiável; cadeia quebrada (raiz desconhecida, elo ausente, assinatura inválida) reprova antes de qualquer checagem de conteúdo.</p>' +
          '<p>Com a cadeia íntegra, duas perguntas decidem a confiança. <strong>Hostname</strong>: o certificado cobre o nome pedido? Lê-se o SAN e recorre-se ao nome comum (CN) como legado; curinga vale só no rótulo mais à esquerda. <strong>Validade</strong>: o agora está na janela do certificado? Relógio local errado reprova certificado certo, então o diagnóstico confere o relógio antes de culpar a autoridade.</p>' },
        { tipo: 'python', id: 'cert-python', titulo: 'Verifique hostname e validade', obrigatorio: false,
          enunciado: 'Complete <code>casa</code>, <code>verificar_hostname</code> e <code>verificar_validade</code> sobre um certificado simplificado (<code>san</code>, <code>cn</code>, <code>nao_antes</code>, <code>nao_depois</code>). O curinga <code>*.</code> cobre exatamente um rótulo à esquerda: <code>*.exemplo.com</code> cobre <code>api.exemplo.com</code>, mas nem <code>exemplo.com</code> nem <code>a.b.exemplo.com</code>. O SAN vence o CN, que só vale sem SAN. A janela é inclusiva nas duas pontas.',
          codigo: codigoCert, testes: testesCert,
          dica: 'Para o curinga, o sufixo é <code>padrao[1:]</code> (inclui o ponto). O nome casa se termina nele, se sobra algo antes dele e se esse resto não tem ponto.',
          solucao: solucaoCert,
          tutorDepois: 'Repare no controle negativo: com o relógio atrasado, o certificado certo é reprovado. Por isso o diagnóstico confere o relógio antes de culpar a autoridade.',
          callout: 'Hostname e validade conferidos, sem nenhum atalho que desligue a verificação.' },
        { tipo: 'callout', tom: 'danger', titulo: '"O certificado atrapalha o teste, desligo a verificação"', html:
          '<p>Nunca. Desativar a verificação converte o handshake em teatro: a cifra continua, a autenticação some, e o teste passa contra impostor, expirado ou interceptador sem registrar diferença. A suíte fica verde no laboratório e o incidente chega em produção. A conduta é fixa: verificação sempre ligada, cadeia contra âncora declarada, hostname e validade a cada handshake. Falha de certificado se conserta no certificado, no nome ou no relógio.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'O que TLS autentica e o que não autentica', html:
          '<p>Handshake verde declara três coisas: o par possui a chave do nome pedido, a conversa está cifrada com chaves efêmeras, e ninguém no meio lê ou altera sem detecção. Nada declara sobre autorização, correção dos dados ou saúde do serviço: essas camadas moram acima, nos Blocos 4 a 6.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: refTls },
        { tipo: 'callout', tom: 'neutral', titulo: 'Leia a referência com ceticismo', html:
          '<p>Compare o <code>_casa</code> acima com a regra escrita: o curinga cobre um rótulo. A linha <code>"." in alvo[: -len(sufixo)]</code> exige que o resto contenha um ponto, o que aceita <code>a.b.exemplo.com</code> e rejeita <code>api.exemplo.com</code>. Se o seu exercício passou com a regra escrita, o seu código está certo e a referência precisa de revisão (<code>not in</code>). Revisar código de referência também é parte do ofício.</p>' },
        { tipo: 'quebre', id: 'camadas-quebre', titulo: 'Qual camada falhou?', obrigatorio: false,
          enunciado: 'Escolha um sintoma, rode e leia a camada, a causa provável e o primeiro oráculo. Depois rode "Sem falha". As linhas de saída são ilustrativas.',
          prefixo: 'URL', entrada: 'https://localhost:8443/', unidade: 'ms', terminalTitulo: 'caminho da conexão', etapas: etapasCamadas(), falhas: falhasCamadas,
          prever: { pergunta: 'O programa não está rodando e a porta está fechada, mas o nome resolve. Em qual etapa o caminho para?', opcoes: [
            { id: 'a', texto: 'Nome: o resolver não achou o endereço.', correta: false, porque: 'o nome resolveu; resolver não é conectar.' },
            { id: 'b', texto: 'TCP: o connect é recusado de imediato.', correta: true, porque: 'refused é o reset do primeiro passo, sem bytes trocados.' },
            { id: 'c', texto: 'TLS: certificado inválido.', correta: false, porque: 'o TLS só começa depois do aceite TCP.' }
          ] },
          tutorAntes: 'Escolha "Falha instantânea no connect", aperte Enter e depois teste os outros sintomas.',
          tutorDepois: 'Cada falha parou numa etapa diferente, e as etapas seguintes nem acenderam: é assim que o caminho localiza a camada.',
          callout: 'Você localizou cada falha numa camada, sem usar "erro de rede" como diagnóstico.' },
        { tipo: 'texto', html:
          '<h3>O atalho tem limite honesto: QUIC</h3>' +
          '<p><strong>QUIC</strong> é o transporte do HTTP/3: roda sobre UDP, integra o handshake TLS 1.3 na abertura e multiplexa fluxos independentes. O problema que o tornou necessário está no TCP: numa conexão com várias requisições, a perda de um pacote trava todas até a retransmissão (bloqueio de cabeça de fila). QUIC move a recuperação para cada fluxo, e a migração de conexão sobrevive à troca de endereço sem novo handshake completo.</p>' +
          '<p>Limite deste bloco: a stdlib Python <strong>não implementa QUIC</strong>, e nenhuma referência abre conexão QUIC. Diante de HTTP/3, "handshake", "reset" e "retransmissão" mudam de número de pacote sem mudar de significado, e o raciocínio por camadas transfere.</p>' },
        { tipo: 'takeaway', html: 'TLS autentica o <mark>servidor</mark> pelo nome e pela janela, sobre cadeia íntegra; verificação desligada é <mark>teatro</mark>, nunca correção.' }
      ] },

      { rotulo: 'Conferir e diagnosticar', blocos: [
        { tipo: 'ordene', id: 'ordem-ordene', titulo: 'A ordem do caminho', obrigatorio: false,
          enunciado: 'Ordene o que acontece ao abrir <code>https://api.exemplo/</code> pela primeira vez.',
          itens: [
            { id: 'tls', texto: 'Handshake TLS: SNI em claro, certificado, cadeia, hostname e validade verificados' },
            { id: 'http', texto: 'Requisição HTTP sobre o canal cifrado' },
            { id: 'tcp', texto: 'Handshake TCP: SYN, SYN-ACK, ACK' },
            { id: 'dns', texto: 'Resolver o nome e publicar os endereços (A/AAAA, com TTL)' }
          ], solucao: ['dns', 'tcp', 'tls', 'http'],
          tutorDepois: 'Cada etapa depende da anterior: não se afirma nada sobre conexão antes de haver endereços publicados.' },
        { tipo: 'cenario', id: 'tls-cenario', titulo: 'Três handshakes recusados', obrigatorio: false,
          enunciado: 'Três clientes falham no handshake contra o mesmo servidor: um com certificado de outro nome e cadeia íntegra, um com certificado certo mas "expirado" para o relógio local (adiantado em dois dias) e um com raiz desconhecida. Alguém propõe desligar a verificação para a suíte passar.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A suíte está vermelha. Qual a primeira conduta?', opcoes: [
              { texto: 'Desligar a verificação só no ambiente de teste.', vai: 'f-teatro', tom: 'ruim', consequencia: 'a suíte fica verde contra impostor e a diferença some do registro.' },
              { texto: 'Separar os três pelo sinal: nome, validade contra relógio e âncora desconhecida.', vai: 'relogio', tom: 'ok', consequencia: 'cada um aponta para um conserto diferente.' }
            ] },
            relogio: { texto: 'O de certificado "expirado" tem o relógio local dois dias adiantado. O que você confere antes de culpar a autoridade?', opcoes: [
              { texto: 'O relógio local e a janela notBefore/notAfter.', vai: 'ancora', tom: 'ok', consequencia: 'o relógio errado reprova certificado certo; corrigi-lo resolve sem tocar na verificação.' },
              { texto: 'Pedir um certificado novo à autoridade.', vai: 'f-troca', tom: 'ruim', consequencia: 'um certificado novo não conserta um relógio errado.' }
            ] },
            ancora: { texto: 'Falta o cliente da raiz desconhecida. Qual o conserto?', opcoes: [
              { texto: 'Declarar a âncora correta (cafile) e corrigir o nome ou o certificado onde divergir, com a verificação ligada.', vai: 'f-bom', tom: 'ok', consequencia: 'a confiança volta a ser verificada, sem nenhum atalho.' },
              { texto: 'Aceitar qualquer cadeia neste cliente, só por ora.', vai: 'f-teatro', tom: 'ruim', consequencia: 'o "por ora" costuma sobreviver até produção.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Nome, relógio e âncora corrigidos nos lugares certos, verificação sempre ligada e registro de qual camada de confiança recusou cada um.' },
            'f-teatro': { bom: false, texto: 'A suíte ficou verde e o incidente chegou em produção, onde o adversário existe.' },
            'f-troca': { bom: false, texto: 'O certificado novo chegou e o relógio continuou errado: o mesmo erro, com custo.' }
          },
          callout: 'Você separou os três pelo sinal, conferiu o relógio primeiro e manteve a verificação ligada.' },
        { tipo: 'escolha', id: 'b3-escolha-ttl', titulo: 'Confira: mudei o endereço e não pegou',
          pergunta: 'O endereço do serviço mudou, mas parte dos clientes ainda chega ao antigo. O record tem TTL de 3600 s e a mudança foi feita há 10 minutos. Qual a conduta?',
          opcoes: [
            { id: 'a', texto: 'Esperar o TTL publicado expirar em cada cache e só então declarar erro: resposta velha dentro do prazo é comportamento.', correta: true, porque: 'cache vale pelo TTL; o mesmo vale para um nome novo e o negativo memorizado.' },
            { id: 'b', texto: 'Declarar defeito de propagação e abrir incidente de DNS.', correta: false, porque: 'ainda estamos dentro do prazo prometido pelo próprio record.' },
            { id: 'c', texto: 'Limpar os caches dos clientes como primeira conduta.', correta: false, porque: 'cache alheio não é seu para limpar, e o prazo vai expirar sozinho.' }
          ], tutorDepois: 'Resposta velha dentro do TTL é comportamento, não defeito.' },
        { tipo: 'escolha', id: 'b3-escolha-camada', titulo: 'Confira: duas camadas, um "erro de rede"',
          pergunta: 'Caso A: o nome resolve, mas o connect recusa de imediato. Caso B: o TCP passa, e o handshake TLS recusa por hostname. Qual a localização correta?',
          opcoes: [
            { id: 'a', texto: 'A no transporte (programa ou porta, com a resolução saudável); B na confiança (nome, SNI ou certificado, com o transporte saudável).', correta: true, porque: 'o próximo passo difere: conferir o destino num, o nome contra o SAN no outro.' },
            { id: 'b', texto: 'Os dois são "erro de rede": reiniciar o serviço.', correta: false, porque: '"erro de rede" nunca é o diagnóstico final.' },
            { id: 'c', texto: 'A no DNS; B no transporte.', correta: false, porque: 'o nome resolveu em A, e o TCP passou em B.' }
          ], tutorDepois: 'Localizar a camada é o que torna o próximo passo óbvio.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Tabela de diagnóstico</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Nome inexistente respondido de imediato, antes de qualquer pacote</td><td>NXDOMAIN para nome sem registro</td><td>Registrar nome e resposta como resolução; conferir grafia e zona; respeitar o TTL negativo</td></tr>' +
          '<tr><td>Primeiro pacote demora e desiste sem resposta</td><td>Resolver sem resposta no prazo</td><td>Registrar prazo e fase (nome, não conexão); investigar o resolver antes do timeout de transporte</td></tr>' +
          '<tr><td>Endereço errado persiste após a mudança</td><td>Cache dentro do TTL, ou negativo memorizado</td><td>Aguardar o TTL publicado, confirmar a expiração e só então declarar erro</td></tr>' +
          '<tr><td>Connect falha de imediato, sem bytes</td><td>Porta sem escuta: refused</td><td>Conferir programa e porta; não aumentar prazo nem investigar rota</td></tr>' +
          '<tr><td>Connect passa e a leitura levanta erro em vez de EOF</td><td>Abort pós-aceite (RST)</td><td>Investigar crash, descarte ou limite estourado, registrando a chamada e os bytes lidos</td></tr>' +
          '<tr><td>Leitura devolve bytes e o fim, tratada como falha</td><td>Close limpo lido como erro</td><td>Aceitar EOF como fim saudável; corrigir o leitor</td></tr>' +
          '<tr><td>Handshake TLS falha com nome divergente</td><td>Hostname fora da cobertura, com cadeia íntegra</td><td>Corrigir nome, SNI ou certificado; SAN antes do CN; nunca desligar a verificação</td></tr>' +
          '<tr><td>Handshake TLS falha com certificado fora da janela</td><td>Expirado, ainda não válido, ou relógio local errado</td><td>Conferir o relógio local primeiro, depois a janela; manter a verificação ligada</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fontes e versões', html:
          '<p>DNS, TCP, TLS 1.3 e QUIC: fontes normativas, consultadas em 14/08/2026 (risco baixo). Documentação do Python 3.14 (<code>socket</code>, <code>ssl</code>): oficial. O breakdown nome, IP, conexão, TLS e os tempos por fase são construção da trilha, medidos na folha B03-L (risco médio, revalidar em até 90 dias). Latências, prazos e contagens citados são exemplo variável, não evidência.</p>' },
        { tipo: 'takeaway', html: 'Localize a <mark>camada</mark> pelo sintoma e pela chamada que falhou; <mark>"erro de rede"</mark> nunca é o diagnóstico final.' }
      ] }
    ]
  });
})();
