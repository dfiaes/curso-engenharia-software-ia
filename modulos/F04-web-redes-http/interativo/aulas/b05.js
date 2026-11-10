/* F04 · Bloco 5: autenticação e segurança web. Fonte: F04.html#b05. A saída do rode é a do demo_auth.py do laboratório (passo 8). Parâmetros de senha (Argon2id, scrypt, bcrypt) do OWASP Password Storage Cheat Sheet, verificados em 11/10/2026, alto risco de mudança. Referências: RFC 6749, 7636, 7519, 8725, 9700; OIDC Core 1.0. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasAuth = function () {
    return [
      { id: 'senha', nome: 'Senha com scrypt', descricao: 'Hash lento, sal e parâmetros no texto', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'uv run python demo_auth.py'),
        L('out', "['scrypt', '131072', '8', '1'] True False"),
        L('hint', 'o hash carrega os parâmetros (N=2^17, r=8, p=1): dá para subir o custo depois')] },
      { id: 'jwt-ok', nome: 'JWT válido', descricao: 'Assinatura, iss, aud e exp conferem', tom: 'tcp', ms: 1, linhas: [
        L('out', "{'iss': 'a', 'aud': 'api', 'exp': 2000, 'sub': 'u1'}")] },
      { id: 'jwt-no', nome: 'JWT recusado', descricao: 'Expirado; audiência errada', tom: 'tls', ms: 1, linhas: [
        L('out', 'recusado: token expirado'),
        L('out', 'recusado: audiência inesperada'),
        L('hint', 'now é injetado: dá para testar expiração sem sleep. Ao cliente, devolva só 401')] },
      { id: 'pkce', nome: 'Challenge PKCE', descricao: 'Vetor do Apêndice B da RFC 7636', tom: 'request', ms: 1, linhas: [
        L('out', 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'),
        L('hint', 'BASE64URL(SHA256(code_verifier)): o verifier nunca saiu do cliente')] },
      { id: 'ssrf', nome: 'Guarda de SSRF', descricao: 'Bloqueia internos, esquema e credenciais', tom: 'response', ms: 1, linhas: [
        L('out', 'bloqueado: 169.254.169.254 resolve para endereço não público: 169.254.169.254'),
        L('out', 'bloqueado: ::ffff:127.0.0.1 resolve para endereço não público: 127.0.0.1'),
        L('out', "bloqueado: esquema não permitido: 'http'"),
        L('out', 'bloqueado: credenciais na URL (userinfo) não são aceitas'),
        L('out', 'bloqueado: 10.0.0.5 resolve para endereço não público: 10.0.0.5'),
        L('in', "['93.184.216.34']"),
        L('hint', 'o IPv4 mapeado em IPv6 é desembrulhado antes de testar')] }
    ];
  };

  var codigoJwt = String.raw`import base64
import hashlib
import hmac
import json


class TokenError(Exception):
    pass


def _b64e(dados):
    return base64.urlsafe_b64encode(dados).rstrip(b"=").decode()


def _b64d(texto):
    return base64.urlsafe_b64decode(texto + "=" * (-len(texto) % 4))


def _hs256(chave, entrada):
    return _b64e(hmac.new(chave, entrada.encode(), hashlib.sha256).digest())


def assinar(payload, chave, alg="HS256"):
    cab = _b64e(json.dumps({"alg": alg, "typ": "JWT"}).encode())
    corpo = _b64e(json.dumps(payload).encode())
    return cab + "." + corpo + "." + _hs256(chave, cab + "." + corpo)


def verificar(token, chave, issuer, audience, now):
    partes = token.split(".")
    if len(partes) != 3:
        raise TokenError("formato inválido")
    cab = json.loads(_b64d(partes[0]))
    # fixe o algoritmo esperado (HS256): o cabeçalho do token não escolhe
    esperada = _hs256(chave, partes[0] + "." + partes[1])
    if not hmac.compare_digest(esperada, partes[2]):
        raise TokenError("assinatura inválida")
    p = json.loads(_b64d(partes[1]))
    # confira exp (obrigatório), nbf, iss e aud
    return p


CHAVE = b"k" * 32
print(verificar(assinar({"iss": "a", "aud": "api", "exp": 2000}, CHAVE), CHAVE, "a", "api", 1000))
`;
  var testesJwt = String.raw`BASE = {"iss": "a", "aud": "api", "exp": 2000, "sub": "u1"}


def erro(token, **kw):
    args = {"issuer": "a", "audience": "api", "now": 1000}
    args.update(kw)
    try:
        verificar(token, CHAVE, **args)
    except TokenError as e:
        return str(e)
    return None


def test_token_valido_devolve_o_payload():
    assert verificar(assinar(BASE, CHAVE), CHAVE, issuer="a", audience="api", now=1000) == BASE


def test_token_expirado():
    assert "expirado" in (erro(assinar(BASE, CHAVE), now=3000) or "")
    assert "expirado" in (erro(assinar(BASE, CHAVE), now=2000) or "")


def test_nbf_no_futuro():
    token = assinar(dict(BASE, nbf=1500), CHAVE)
    assert "ainda não" in (erro(token) or "")


def test_audiencia_e_emissor_inesperados():
    assert "audiência" in (erro(assinar(BASE, CHAVE), audience="outra") or "")
    assert "emissor" in (erro(assinar(BASE, CHAVE), issuer="b") or "")


def test_alg_none_e_recusado_pelo_algoritmo():
    cab = _b64e(json.dumps({"alg": "none"}).encode())
    corpo = _b64e(json.dumps(BASE).encode())
    assert "algoritmo" in (erro(cab + "." + corpo + ".") or "")


def test_assinatura_adulterada():
    token = assinar(BASE, b"outra-chave-qualquer-com-32-bytes!")
    assert "assinatura" in (erro(token) or "")


def test_token_sem_exp_e_recusado():
    sem_exp = {k: v for k, v in BASE.items() if k != "exp"}
    assert "exp" in (erro(assinar(sem_exp, CHAVE)) or "")
`;
  var solucaoJwt = String.raw`import base64
import hashlib
import hmac
import json


class TokenError(Exception):
    pass


def _b64e(dados):
    return base64.urlsafe_b64encode(dados).rstrip(b"=").decode()


def _b64d(texto):
    return base64.urlsafe_b64decode(texto + "=" * (-len(texto) % 4))


def _hs256(chave, entrada):
    return _b64e(hmac.new(chave, entrada.encode(), hashlib.sha256).digest())


def assinar(payload, chave, alg="HS256"):
    cab = _b64e(json.dumps({"alg": alg, "typ": "JWT"}).encode())
    corpo = _b64e(json.dumps(payload).encode())
    return cab + "." + corpo + "." + _hs256(chave, cab + "." + corpo)


def verificar(token, chave, issuer, audience, now):
    partes = token.split(".")
    if len(partes) != 3:
        raise TokenError("formato inválido")
    cab = json.loads(_b64d(partes[0]))
    if cab.get("alg") != "HS256":
        raise TokenError("algoritmo não permitido: %r" % cab.get("alg"))
    esperada = _hs256(chave, partes[0] + "." + partes[1])
    if not hmac.compare_digest(esperada, partes[2]):
        raise TokenError("assinatura inválida")
    p = json.loads(_b64d(partes[1]))
    if "exp" not in p:
        raise TokenError("token sem exp")
    if now >= p["exp"]:
        raise TokenError("token expirado")
    if "nbf" in p and now < p["nbf"]:
        raise TokenError("token ainda não válido")
    if p.get("iss") != issuer:
        raise TokenError("emissor inesperado")
    aud = p.get("aud")
    if audience not in (aud if isinstance(aud, list) else [aud]):
        raise TokenError("audiência inesperada")
    return p


CHAVE = b"k" * 32
print(verificar(assinar({"iss": "a", "aud": "api", "exp": 2000}, CHAVE), CHAVE, "a", "api", 1000))
`;

  var codigoSsrf = String.raw`import ipaddress
from urllib.parse import urlsplit


def ip_publico(texto):
    """True se o endereço é público (roteável na internet)."""
    ip = ipaddress.ip_address(texto)
    # IPv4 mapeado em IPv6 (::ffff:127.0.0.1): desembrulhe antes de testar
    return ip.is_global


def validar_destino(url, resolver):
    """Devolve os IPs validados para o chamador conectar neles; ValueError se algo for inseguro."""
    u = urlsplit(url)
    if u.scheme != "https":
        raise ValueError("esquema não permitido: %r" % u.scheme)
    if u.username or u.password:
        raise ValueError("credenciais na URL")
    ips = resolver(u.hostname)
    # nome sem nenhum IP não serve; basta UM IP não público para bloquear o nome inteiro
    return ips


print(validar_destino("https://exemplo.test/", lambda host: ["93.184.216.34"]))
`;
  var testesSsrf = String.raw`TABELA = {
    "exemplo.test": ["93.184.216.34"],
    "interno.test": ["10.0.0.5"],
    "rebind.test": ["93.184.216.34", "127.0.0.1"],
    "decimal": ["127.0.0.1"],
    "vazio.test": [],
}


def resolver(host):
    return TABELA.get(host, [host])


def bloqueia(url):
    try:
        validar_destino(url, resolver)
    except ValueError:
        return True
    return False


def test_destino_publico_devolve_os_ips_validados():
    assert validar_destino("https://exemplo.test/", resolver) == ["93.184.216.34"]


def test_metadados_e_rede_privada_sao_bloqueados():
    assert bloqueia("https://169.254.169.254/latest/meta-data/")
    assert bloqueia("https://10.0.0.5/")
    assert bloqueia("https://interno.test/")


def test_ipv4_mapeado_em_ipv6_e_bloqueado():
    assert bloqueia("https://[::ffff:127.0.0.1]/")


def test_um_ip_interno_entre_varios_bloqueia_o_nome():
    assert bloqueia("https://rebind.test/")


def test_ip_em_decimal_resolvido_para_loopback_e_bloqueado():
    assert bloqueia("https://decimal/")


def test_esquema_credenciais_e_nome_sem_ip():
    assert bloqueia("http://exemplo.test/")
    assert bloqueia("https://user:senha@exemplo.test/")
    assert bloqueia("https://vazio.test/")
`;
  var solucaoSsrf = String.raw`import ipaddress
from urllib.parse import urlsplit


def ip_publico(texto):
    """True se o endereço é público (roteável na internet)."""
    ip = ipaddress.ip_address(texto)
    if ip.version == 6 and ip.ipv4_mapped is not None:
        ip = ip.ipv4_mapped
    return ip.is_global


def validar_destino(url, resolver):
    """Devolve os IPs validados para o chamador conectar neles; ValueError se algo for inseguro."""
    u = urlsplit(url)
    if u.scheme != "https":
        raise ValueError("esquema não permitido: %r" % u.scheme)
    if u.username or u.password:
        raise ValueError("credenciais na URL")
    ips = resolver(u.hostname)
    if not ips:
        raise ValueError("o nome não resolve")
    for ip in ips:
        if not ip_publico(ip):
            raise ValueError("%s resolve para endereço não público: %s" % (u.hostname, ip))
    return ips


print(validar_destino("https://exemplo.test/", lambda host: ["93.184.216.34"]))
`;

  TrilhaAula.registrar({
    id: 'f04-b5',
    titulo: 'Autenticação e segurança web: sessão, OAuth, JWT, senhas e OWASP',
    minutos: 60,
    resumo: 'Autenticação responde "quem é você?"; autorização, "o que você pode fazer?". Quase todo vazamento relevante vem da segunda.',
    objetivo: 'Escolher entre sessão e token, descrever o authorization code com PKCE, verificar um JWT sem confiar no cabeçalho, guardar senhas com hash lento e reconhecer controle de acesso quebrado, injeção e SSRF.',
    revisao: [
      { id: 'f04b5-jwt', pergunta: 'Um JWT chega com assinatura válida. Isso basta para aceitá-lo?',
        opcoes: [
          opc('a', 'Não: é preciso fixar o algoritmo no verificador e checar exp, nbf, iss e aud', true, 'assinatura válida só prova que alguém com a chave emitiu o token, não que ele é para esta API, agora.'),
          opc('b', 'Sim: a assinatura garante tudo', false, 'um token válido emitido para outra API, ou expirado, passaria.'),
          opc('c', 'Sim, se o alg do cabeçalho for HS256', false, 'o cabeçalho é dado do atacante; quem decide o algoritmo é o servidor.')] },
      { id: 'f04b5-bola', pergunta: 'GET /pedidos/123 exige login. O usuário A troca 123 por 124 (pedido do B) e vê os dados. Qual a falha e a correção?',
        opcoes: [
          opc('a', 'BOLA/IDOR: checar em toda consulta que o objeto pertence ao usuário (WHERE id = :id AND owner_id = :uid)', true, 'UUID atrapalha a enumeração, mas não substitui a checagem; "não existe" e "não é seu" podem ser a mesma resposta (404).'),
          opc('b', 'Injeção de SQL: usar consultas parametrizadas', false, 'a consulta pode até estar parametrizada; a falha é de autorização.'),
          opc('c', 'CORS: restringir origens', false, 'CORS não controla acesso no servidor.')] },
      { id: 'f04b5-pkce', pergunta: 'Por que o PKCE impede que quem intercepta o code o troque por token?',
        opcoes: [
          opc('a', 'Sem o code_verifier, que nunca saiu do cliente, o servidor não confere o challenge', true, 'o servidor recalcula SHA256(code_verifier) e compara com o challenge guardado no passo 2.'),
          opc('b', 'Porque o code é cifrado na URL', false, 'o code viaja pelo navegador; é o verifier que o torna inútil sozinho.'),
          opc('c', 'Porque o state é secreto', false, 'o state amarra a resposta à sessão (anti-CSRF no callback), outra proteção.')] },
      { id: 'f04b5-senha', pergunta: 'Como guardar uma senha?',
        opcoes: [
          opc('a', 'Hash lento e com sal (Argon2id, scrypt ou bcrypt), num formato autodescritivo que permite subir o custo', true, 'SHA-256 é rápido demais para isso; cifrar é pior, porque quem rouba o banco costuma roubar a chave.'),
          opc('b', 'SHA-256 da senha', false, 'a velocidade é o defeito: GPUs testam bilhões por segundo.'),
          opc('c', 'Cifrada com AES, com a chave no mesmo servidor', false, 'nunca guarde a senha, nem cifrada.')] },
      { id: 'f04b5-ssrf', pergunta: 'Qual a defesa correta contra SSRF em um serviço que busca URLs fornecidas pelo usuário?',
        opcoes: [
          opc('a', 'Resolver o nome uma vez, validar todos os IPs como públicos e conectar neles, sem seguir redirects automaticamente', true, 'lista negra por texto falha por IP em decimal ou hex, IPv6 mapeado, redirecionamento e DNS rebinding.'),
          opc('b', 'Filtrar "localhost" e "127.0.0.1" como strings', false, 'http://2130706433 e http://[::ffff:127.0.0.1] passam.'),
          opc('c', 'Validar a URL e deixar a biblioteca resolver de novo', false, 'check e use enxergam respostas DNS diferentes (TOCTOU).')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Quem é você × o que você pode</h3>' +
          '<p><strong>Autenticação</strong> responde &quot;quem é você?&quot;; <strong>autorização</strong> responde &quot;o que você pode fazer?&quot;. Quase todo vazamento relevante vem da segunda: o sistema sabia quem era o usuário e deixou-o ler o dado de outro. Este bloco dá o vocabulário e os mecanismos para as duas, além das três falhas que mais aparecem em revisão de código de API: acesso quebrado, injeção e SSRF. Segurança de produção (WAF, gestão de segredos, auditoria) fica no M12.</p>' +
          '<h3>Sessão de servidor × token autocontido</h3>' +
          '<table><tr><th></th><th>Sessão (cookie com ID opaco)</th><th>Token autocontido (JWT no cabeçalho)</th></tr>' +
          '<tr><td>Estado</td><td>no servidor (memória, Redis, banco)</td><td>dentro do token, assinado</td></tr>' +
          '<tr><td>Revogar</td><td>apaga a sessão: efeito imediato</td><td>difícil: vale até expirar (lista de revogação reintroduz estado)</td></tr>' +
          '<tr><td>Escala</td><td>exige armazenamento compartilhado</td><td>qualquer instância valida sem consultar</td></tr>' +
          '<tr><td>Riscos</td><td>CSRF (cookie automático), fixação de sessão</td><td>XSS se guardado em JS acessível; tokens longos vazam</td></tr>' +
          '<tr><td>Bom para</td><td>aplicação web própria, mesma origem</td><td>entre serviços, APIs consumidas por terceiros</td></tr></table>', largo: true },
        { tipo: 'texto', html:
          '<p>A pergunta que decide: <em>preciso revogar já?</em> Se sim (conta comprometida, demissão, logout real), sessão com ID opaco é mais simples e mais segura. Quando usar token, mantenha o <em>access token</em> curto (minutos) e use um <em>refresh token</em> de vida longa, guardado com mais cuidado e rotacionado a cada uso. Em navegador, a combinação mais defensável é sessão em cookie <code>__Host-</code>, <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite=Lax</code>.</p>' +
          '<h3>OAuth 2 e OpenID Connect</h3>' +
          '<p><strong>OAuth 2</strong> (RFC 6749) é um protocolo de <em>delegação de autorização</em>: o usuário (<em>resource owner</em>) permite que um aplicativo (<em>client</em>) acesse recursos dele em uma API (<em>resource server</em>) sem entregar a senha, via um <em>authorization server</em> que emite tokens com <em>escopos</em>. Ele diz o que o app pode fazer, <strong>não quem é o usuário</strong>. <strong>OpenID Connect (OIDC)</strong> é a camada de identidade sobre OAuth: acrescenta o <em>ID token</em> (um JWT que afirma &quot;este é o usuário X, autenticado agora por este emissor, para este client&quot;) e o endpoint <code>userinfo</code>. &quot;Login com Google/Microsoft&quot; é OIDC.</p>' +
          '<h4>Authorization code com PKCE</h4>' +
          '<p>É o fluxo para aplicativos web, móveis e de página única (a BCP atual, RFC 9700, o torna o padrão e deprecia o <em>implicit</em> e o <em>password grant</em>).</p>' },
        { tipo: 'codigo', linguagem: 'text', texto:
          '1. cliente gera code_verifier (aleatório, 43-128 car.) e\n' +
          '   code_challenge = BASE64URL( SHA256(code_verifier) ), method S256, e também um `state`\n' +
          '2. navegador -> servidor de autorização:\n' +
          '   /authorize?response_type=code&client_id=...&redirect_uri=...&scope=openid%20profile\n' +
          '              &state=...&code_challenge=...&code_challenge_method=S256\n' +
          '3. usuário autentica e consente; redireciona para redirect_uri?code=...&state=...\n' +
          '4. cliente confere `state`; POST /token { code, code_verifier, redirect_uri, client_id }\n' +
          '5. servidor recalcula SHA256(code_verifier) e compara com o challenge guardado no passo 2\n' +
          '   -> só então emite access token (e ID token, se openid)' },
        { tipo: 'texto', html:
          '<p>Por que o PKCE existe: o <code>code</code> viaja pelo navegador (URL, histórico, logs, apps maliciosos que registram o mesmo esquema de URL no celular). Quem o interceptar não consegue trocá-lo por token sem o <code>code_verifier</code>, que nunca saiu do cliente. O <code>state</code> amarra a resposta à sessão que a iniciou (anti-CSRF no <em>callback</em>); o <code>redirect_uri</code> precisa casar <em>exatamente</em> com o cadastrado. No OIDC, o <code>nonce</code> amarra o ID token à requisição. O laboratório implementa o cálculo e a verificação do PKCE e valida contra o vetor do Apêndice B da RFC 7636.</p>' },
        { tipo: 'ordene', id: 'pkce-ordene', titulo: 'Ordene o authorization code com PKCE', obrigatorio: false,
          enunciado: 'Ponha o fluxo na ordem correta. Repare por que interceptar o <code>code</code> sozinho não basta ao atacante.',
          itens: [
            { id: 'f', texto: 'O app troca o <code>code</code> em <code>/token</code>, enviando o <code>code_verifier</code>' },
            { id: 'b', texto: 'O app redireciona o usuário a <code>/authorize</code> com <code>client_id</code>, <code>redirect_uri</code>, <code>state</code> e <code>code_challenge</code>' },
            { id: 'g', texto: 'O provedor confere SHA-256(verifier) = challenge e devolve os tokens' },
            { id: 'a', texto: 'O app gera o <code>code_verifier</code> aleatório e calcula o <code>code_challenge</code> = SHA-256 dele' },
            { id: 'd', texto: 'O provedor redireciona de volta ao <code>redirect_uri</code> com <code>code</code> e <code>state</code>' },
            { id: 'c', texto: 'O usuário autentica e consente no provedor de identidade' },
            { id: 'e', texto: 'O app confere se o <code>state</code> é o mesmo que enviou (protege contra CSRF)' }
          ], solucao: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
          dica: 'O verifier nasce antes de tudo e só reaparece no passo da troca; o state é conferido antes de tocar no code.',
          tutorDepois: 'Quem intercepta o code no redirecionamento não tem o verifier, que nunca saiu do cliente: o servidor não consegue conferir o challenge e recusa a troca.' },
        { tipo: 'takeaway', html: '<mark>Sessão</mark> serve à revogação imediata; <mark>token</mark> serve à distribuição, com vida curta; <mark>PKCE</mark> torna o <code>code</code> interceptado inútil.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>JWT: o que é e onde falha</h3>' +
          '<p>JWT (RFC 7519) são três partes base64url separadas por ponto: <code>cabeçalho.payload.assinatura</code>. O payload é <strong>apenas codificado, não cifrado</strong>: qualquer um lê. A assinatura (HMAC com segredo compartilhado, HS256; ou RSA/ECDSA com chave privada, RS256/ES256) só garante integridade e origem. Claims padrão: <code>iss</code> (emissor), <code>sub</code> (sujeito), <code>aud</code> (destinatário), <code>exp</code>/<code>nbf</code>/<code>iat</code> (tempos) e <code>jti</code> (identificador).</p>' +
          '<p>As falhas conhecidas (RFC 8725) são todas de <em>verificação</em>, não de criptografia:</p>' +
          '<ul>' +
          '<li><strong><code>alg: none</code></strong> e confusão de algoritmo: o verificador lê o <code>alg</code> do cabeçalho do próprio token e aceita <code>none</code>, ou trata a chave pública RSA como segredo HMAC. Regra: o servidor <em>fixa</em> o algoritmo esperado; o cabeçalho não escolhe.</li>' +
          '<li>Cabeçalhos que apontam a chave (<code>jwk</code>, <code>jku</code>, <code>x5u</code>, <code>x5c</code>): o atacante inclui a própria chave. Ignore ou recuse; resolva a chave por <code>kid</code> numa lista que você controla.</li>' +
          '<li>Não checar <code>exp</code>, <code>iss</code>, <code>aud</code>: um token válido emitido para <em>outra</em> API aceito na sua (<em>confused deputy</em>).</li>' +
          '<li>Comparar assinatura com <code>==</code>: use comparação em tempo constante (<code>hmac.compare_digest</code>).</li>' +
          '<li>Segredo HS256 curto ou previsível: quebrável offline; use 256 bits aleatórios.</li>' +
          '<li>Dados sensíveis no payload, ou tokens de vida longa sem como revogar.</li></ul>' },
        { tipo: 'rode', id: 'auth-rode', titulo: 'Rode as primitivas de autenticação do laboratório',
          enunciado: 'O <code>demo_auth.py</code> do laboratório usa scrypt, JWT HS256, PKCE e a guarda de SSRF. Rode e clique em cada etapa.',
          prefixo: '$', entrada: 'uv run python demo_auth.py', unidade: 'etapa', terminalTitulo: 'demo_auth.py', etapas: etapasAuth(),
          prever: { pergunta: 'O mesmo JWT é verificado com audience="outra", embora a assinatura esteja correta. Qual o resultado?', opcoes: [
            { id: 'a', texto: 'Aceito: a assinatura válida prova que o token é legítimo.', correta: false, porque: 'a assinatura prova a origem, não o destinatário. Token emitido para outra API não deve valer na sua.' },
            { id: 'b', texto: 'Recusado com "audiência inesperada".', correta: true, porque: 'o verificador confere aud, além de exp e iss; sem isso, um token válido de outra API seria aceito (confused deputy).' },
            { id: 'c', texto: 'Recusado com "assinatura inválida".', correta: false, porque: 'a assinatura está correta; a falha está numa claim.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em JWT recusado para ler as duas linhas.',
          tutorDepois: 'Note que verify_jwt recebe now explicitamente: relógio injetado é o que permite testar expiração sem sleep, e o motivo de leeway existir (pequena tolerância para relógios dessincronizados). A mensagem do TokenError serve ao log; ao cliente, devolva só 401, sem dizer qual verificação falhou.',
          callout: 'Você viu as primitivas funcionando: hash com parâmetros no texto, JWT recusado por claim, o vetor do PKCE e a guarda de SSRF.' },
        { tipo: 'python', id: 'jwt-python', titulo: 'Verifique o JWT sem confiar no cabeçalho', obrigatorio: false,
          enunciado: 'A assinatura já é conferida em tempo constante. Complete <code>verificar</code>: fixe o algoritmo HS256 (<code>alg: none</code> é recusado <em>por causa do algoritmo</em>) e confira <code>exp</code> (obrigatório), <code>nbf</code>, <code>iss</code> e <code>aud</code>, com <code>now</code> injetado.',
          codigo: codigoJwt, testes: testesJwt,
          dica: 'Antes da assinatura: <code>if cab.get("alg") != "HS256": raise TokenError(...)</code>. Depois do payload: <code>now &gt;= p["exp"]</code> é expirado; <code>aud</code> pode ser string ou lista.',
          solucao: solucaoJwt,
          tutorDepois: 'Repare no teste do alg none: ele confere a mensagem, não só a exceção. Sem a fixação do algoritmo, o token cai na segunda linha de defesa (assinatura inválida), e o defeito fica escondido.',
          callout: 'O verificador passou: algoritmo fixo, expiração, nbf, emissor, audiência, assinatura e ausência de exp.' },
        { tipo: 'texto', html:
          '<h3>Senhas: hash lento, com sal, nunca criptografia</h3>' +
          '<p>Nunca guarde a senha, nem cifrada (quem rouba o banco costuma roubar a chave). Guarde um <strong>hash lento e com sal</strong>: o sal (16+ bytes aleatórios por usuário) impede que a mesma senha produza o mesmo hash e inutiliza tabelas pré-computadas; a lentidão (e, em scrypt e Argon2, o consumo de memória) torna cara a tentativa em massa com GPUs. Funções gerais como SHA-256 são rápidas demais para isso, justamente o defeito.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Parâmetros aceitos hoje (OWASP Password Storage Cheat Sheet, verificado em 11/10/2026)', html:
          '<ul><li><strong>Argon2id</strong> (primeira escolha): mínimo de 19 MiB de memória, 2 iterações, paralelismo 1.</li><li><strong>scrypt</strong>: N=2<sup>17</sup>, r=8, p=1, o padrão do laboratório, que vem na biblioteca padrão.</li><li><strong>bcrypt</strong>: custo ≥ 10; trunca a senha em 72 bytes.</li></ul>' +
          '<p>São parâmetros de alto risco de mudança: revalide no cheat sheet vigente antes de adotá-los.</p>' },
        { tipo: 'texto', html:
          '<p>O resultado é guardado num formato autodescritivo, <code>scrypt$131072$8$1$sal$hash</code>, que carrega os parâmetros. Isso permite <em>subir o custo</em> depois: no login bem-sucedido, se <code>needs_rehash</code> indica parâmetros fracos, recalcule e grave o hash novo. Compare em tempo constante. Parâmetro de custo vindo de dentro do hash armazenado é entrada não confiável: o laboratório recusa valores que consumiriam memória absurda.</p>' },
        { tipo: 'takeaway', html: 'JWT: <mark>fixe o algoritmo</mark> e confira <mark>exp, iss e aud</mark>; senha: <mark>hash lento com sal</mark> e custo ajustável.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>OWASP essencial</h3>' +
          '<p>O OWASP Top 10 é uma lista de categorias de risco, atualizada a cada poucos anos; use como roteiro de revisão, não como checklist de conformidade. Três categorias dão a maior parte do retorno para quem escreve APIs.</p>' +
          '<h4>1. Controle de acesso quebrado</h4>' +
          '<p>A categoria nº 1 há anos. A forma típica é o <strong>BOLA/IDOR</strong> (<em>broken object level authorization</em>): <code>GET /orders/1042</code> verifica que o usuário está logado, mas não que o pedido 1042 é <em>dele</em>. Trocar o número no URL entrega dado alheio. IDs não adivinháveis (UUID) atrapalham a enumeração, mas não substituem a checagem. Correções estruturais:</p>' +
          '<ol><li>toda consulta a dado de usuário filtra pelo dono (<code>WHERE id = :id AND owner_id = :uid</code>), de modo que &quot;não existe&quot; e &quot;não é seu&quot; são a mesma resposta (<code>404</code>);</li><li>autorização no servidor, a cada requisição, nunca confiando em campo oculto, cabeçalho ou papel enviados pelo cliente;</li><li>negar por padrão;</li><li>checar também <em>propriedades</em>: o usuário pode editar o próprio perfil, mas não o campo <code>is_admin</code> (<em>mass assignment</em>: aceite apenas os campos que o endpoint declara).</li></ol>' +
          '<h4>2. Injeção</h4>' +
          '<p>Dados do usuário interpretados como código: SQL, shell, LDAP, templates, JSON/HTML. A causa é sempre a mesma, concatenar entrada na linguagem de destino; a correção também: <strong>separar código de dado</strong> com consultas parametrizadas, argumentos em lista (sem shell) e escape contextual na saída. Em saída HTML, o equivalente é o <em>XSS</em> (autoescape ligado, <code>Content-Security-Policy</code> como defesa em profundidade). Para integrações com LLM, o paralelo é a injeção de prompt, tratada nos módulos de segurança de IA: dado e instrução não podem compartilhar canal sem fronteira.</p>' },
        { tipo: 'complete', id: 'injecao-complete', titulo: 'Separe código de dado', obrigatorio: false,
          enunciado: 'Complete as duas chamadas para que a entrada do usuário nunca seja interpretada como SQL nem como shell.',
          linguagem: 'python',
          partes: [
            '# SQL\ncur.execute(',
            { lacuna: 'sql', opcoes: ['"SELECT * FROM notes WHERE title = ?", (title,)', 'f"SELECT * FROM notes WHERE title = \'{title}\'"', '"SELECT * FROM notes WHERE title = \'" + title + "\'"'], correta: 0 },
            ')\n\n# shell\nsubprocess.run(',
            { lacuna: 'argv', opcoes: ['["convert", name, "out.png"], check=True', 'f"convert {name} out.png", shell=True', '"convert " + name + " out.png", shell=True'], correta: 0 },
            ')\n'
          ],
          explicacao: 'O driver envia consulta e valores separados, então title = "x\' OR \'1\'=\'1" é só um texto. Sem shell, os argumentos são uma lista: a; rm -rf ~ vira um nome de arquivo estranho, não um comando.' },
        { tipo: 'texto', html:
          '<h4>3. SSRF (<em>server-side request forgery</em>)</h4>' +
          '<p>Seu servidor busca uma URL fornecida pelo usuário (pré-visualização de link, <em>webhook</em>, importação, e agora ferramentas de agente que &quot;navegam&quot;). O atacante informa <code>http://169.254.169.254/latest/meta-data/</code> (serviço de metadados da nuvem, que entrega credenciais da instância) ou <code>http://localhost:6379</code> (Redis interno) e o seu servidor, dentro da rede confiável, faz a requisição por ele. A defesa ingênua, comparar o texto da URL com uma lista negra, falha por variações: <code>http://0x7f000001</code>, <code>http://2130706433</code>, <code>http://[::ffff:127.0.0.1]</code>, nome DNS que resolve para IP interno, redirecionamento <code>302</code> para endereço interno e <em>DNS rebinding</em> (o nome resolve para IP público na checagem e para interno na conexão). A defesa em camadas:</p>' +
          '<ol><li>Allowlist de esquemas (<code>https</code>) e, quando possível, de destinos.</li><li>Resolver o nome <em>uma vez</em>, validar <strong>todos</strong> os IPs obtidos (público = <code>is_global</code>) e conectar neles diretamente (com <code>Host</code>/SNI do nome original), sem nova resolução.</li><li>Não seguir redirecionamentos automaticamente, ou revalidar cada salto.</li><li>Limitar tamanho e tempo da resposta; não devolver o corpo bruto ao usuário.</li><li>Camada de rede: o serviço que busca URLs roda sem rota para a rede interna e para o endereço de metadados (na AWS há ainda o IMDSv2, que exige token de sessão).</li></ol>' },
        { tipo: 'python', id: 'ssrf-python', titulo: 'Valide todos os IPs antes de conectar', obrigatorio: false,
          enunciado: 'Implemente o passo 2: <code>validar_destino(url, resolver)</code> devolve os IPs validados (o chamador conecta neles). Desembrulhe IPv4 mapeado em IPv6, bloqueie o nome inteiro se <em>um</em> IP for interno e recuse esquema fora de <code>https</code>, credenciais e nome sem IP. O resolvedor é fake e determinístico.',
          codigo: codigoSsrf, testes: testesSsrf,
          dica: 'Em <code>ip_publico</code>: se <code>ip.version == 6 and ip.ipv4_mapped is not None</code>, troque <code>ip</code> por <code>ip.ipv4_mapped</code>. Em <code>validar_destino</code>: um laço <code>for ip in ips</code> que levanta <code>ValueError</code> ao primeiro não público.',
          solucao: solucaoSsrf,
          tutorDepois: 'A função devolve os IPs de propósito: o conector precisa usá-los. Validar o host e deixar a biblioteca resolver de novo reabre o TOCTOU, e seguir redirect automático leva a requisição a 169.254.169.254 sem passar pela checagem.',
          callout: 'A guarda de SSRF passou: metadados, rede privada, IPv6 mapeado, rebinding por múltiplos registros, esquema, credenciais e nome sem IP.' },
        { tipo: 'takeaway', html: 'Cheque o <mark>dono do objeto</mark> em toda consulta, <mark>parametrize</mark> tudo que vira código e valide <mark>todos os IPs</mark> antes de buscar URL externa.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'cenario', id: 'sessao-cenario', titulo: 'Sessão ou token?', obrigatorio: false,
          enunciado: 'Você desenha a autenticação de uma aplicação web própria, mesma origem, e de uma API consumida por parceiros. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Para a aplicação web própria, que precisa de logout real e de derrubar uma conta comprometida na hora, qual a base?', opcoes: [
              { texto: 'JWT de longa duração guardado em localStorage.', vai: 'f-xss', tom: 'ruim', consequencia: 'vale até expirar, não revoga e qualquer script injetado por XSS o lê.' },
              { texto: 'Sessão com ID opaco em cookie __Host-, HttpOnly, Secure e SameSite=Lax.', vai: 'n2', tom: 'ok', consequencia: 'revogação imediata apagando a sessão; cookie fora do alcance de JavaScript.' }
            ] },
            n2: { texto: 'Para a API consumida por parceiros e por vários serviços, que validam sem consultar um estado central, o que muda?', opcoes: [
              { texto: 'Access token curto (minutos), refresh token rotacionado e verificação de algoritmo fixo, exp, iss e aud.', vai: 'f-bom', tom: 'ok', consequencia: 'token autocontido distribui a validação; vida curta limita o dano de um vazamento.' },
              { texto: 'O mesmo cookie de sessão, repassado entre os serviços.', vai: 'f-cookie', tom: 'ruim', consequencia: 'exige armazenamento compartilhado e traz CSRF para chamadas entre serviços.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Cada mecanismo no seu lugar: sessão onde a revogação imediata importa, token curto onde a distribuição importa. A pergunta que decidiu foi "preciso revogar já?".' },
            'f-xss': { bom: false, texto: 'Token longo em JS acessível junta os dois piores riscos do token: não revoga e vaza por XSS.' },
            'f-cookie': { bom: false, texto: 'Cookie de sessão entre serviços acopla todos a um estado central e a um risco de CSRF que não existe com Authorization explícito.' }
          } },
        { tipo: 'transcript', id: 'jwt-transcript', titulo: 'Ache a revisão que deixa o token passar', obrigatorio: false, terminalTitulo: 'revisão do middleware de auth',
          enunciado: 'O agente revisa o verificador de JWT de uma API e dá o parecer. Uma das afirmações dele não é sustentada pelo código mostrado. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Revise o middleware: a API só deve aceitar tokens emitidos para ela.' },
            { quem: 'ferramenta', texto: '$ cat auth.py\nh = jwt.get_unverified_header(token)\nclaims = jwt.decode(token, SECRET, algorithms=[h["alg"]])\nif claims["exp"] < now: raise Unauthorized()' },
            { quem: 'agente', texto: 'A assinatura é verificada com SECRET e a expiração é conferida.' },
            { quem: 'agente', texto: 'O algoritmo vem do cabeçalho do próprio token, o que é flexível e seguro.' },
            { quem: 'agente', texto: 'Como a assinatura é válida e não expirou, o token é sempre destinado a esta API.' }
          ],
          erradas: [3, 4],
          explicacao: {
            3: 'o cabeçalho é dado do atacante: algorithms=[h["alg"]] aceita alg none ou confusão RS256/HS256. O servidor deve fixar o algoritmo esperado.',
            4: 'o código não confere aud nem iss: um token válido emitido para outra API passaria (confused deputy). Assinatura e exp não dizem para quem o token é.' },
          tutorDepois: 'Assinatura válida só prova que alguém com a chave emitiu o token, não que ele é para esta API, agora.' },
        { tipo: 'escolha', id: 'b5-escolha-bola', titulo: 'Confira: o pedido do vizinho',
          pergunta: 'A rota <code>GET /invoices/77</code> devolve a fatura de qualquer usuário logado. Como corrigir, e que status devolver ao acessar fatura alheia?',
          opcoes: [
            { id: 'a', texto: 'Trocar o id por UUID e manter a consulta.', correta: false, porque: 'UUID atrapalha a enumeração, mas não substitui a checagem de dono.' },
            { id: 'b', texto: 'Filtrar a consulta pelo dono (<code>WHERE id = :id AND owner_id = :uid</code>) e devolver 404 (ou 403 se a existência não for segredo).', correta: true, porque: 'a autorização é do servidor, a cada requisição; "não existe" e "não é seu" podem ser a mesma resposta.' },
            { id: 'c', texto: 'Esconder o link da fatura alheia no front-end.', correta: false, porque: 'o cliente é do atacante: checagem no front-end não é controle de acesso.' }
          ], tutorDepois: 'É BOLA/IDOR, a forma mais comum de controle de acesso quebrado.' },
        { tipo: 'escolha', id: 'b5-escolha-habitos', titulo: 'Confira: o login que vaza usuários',
          pergunta: 'Qual destas práticas de login reduz o vazamento de quais contas existem?',
          opcoes: [
            { id: 'a', texto: 'Mensagem igual para "usuário não existe" e "senha errada", fazendo o hash mesmo quando o usuário não existe.', correta: true, porque: 'iguala a mensagem e o tempo de resposta; o limite de taxa por usuário e IP, com 429 e Retry-After, completa.' },
            { id: 'b', texto: 'Dizer "usuário não encontrado" para ajudar quem errou o e-mail.', correta: false, porque: 'permite enumerar contas válidas.' },
            { id: 'c', texto: 'Bloquear a conta permanentemente após 5 erros.', correta: false, porque: 'bloqueio permanente vira ataque de negação de serviço contra a vítima; prefira bloqueio progressivo.' }
          ], tutorDepois: 'Outros hábitos de baixo custo: cabeçalhos de segurança (HSTS, nosniff, CSP, Referrer-Policy), segredos fora do código e da URL, e dependências com arquivo de travamento e varredura.' },
        { tipo: 'takeaway', html: 'Autenticação é <mark>quem</mark>, autorização é <mark>o quê</mark>, e a segunda <mark>falha mais</mark>.' }
      ] }
    ]
  });
})();
