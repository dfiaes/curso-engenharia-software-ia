/* F04 · Bloco 4: JSON e APIs REST. Fonte: F04.html#b04. O ciclo do rode é o do exemplo trabalhado do laboratório (notas, Idempotency-Key k1, ETag "0996f450b0c7959c"). Idempotency-Key segue como Internet-Draft do IETF (httpapi), verificado em 11/10/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasCiclo = function () {
    return [
      { id: 'post1', nome: 'POST com chave', descricao: 'Idempotency-Key: k1', tom: 'request', ms: 1, linhas: [
        L('info', 'requisição: POST /notes  (Idempotency-Key: k1, {"title":"redes","body":"tcp"})'),
        L('out', '201 Created   Location: /notes/1'),
        L('hint', 'chave nova: executa e guarda (chave, impressão do corpo, resposta)')] },
      { id: 'post2', nome: 'Repetição', descricao: 'Mesma chave, mesmo corpo', tom: 'response', ms: 1, linhas: [
        L('info', 'requisição: POST /notes  (mesma chave, mesmo corpo)'),
        L('out', '201 Created   Idempotency-Replayed: true'),
        L('hint', 'continua só a nota 1: a resposta guardada foi devolvida, sem executar de novo')] },
      { id: 'get', nome: 'GET com ETag', descricao: 'Leitura devolve o validador', tom: 'dns', ms: 1, linhas: [
        L('info', 'requisição: GET /notes/1'),
        L('out', '200 OK   ETag: "0996f450b0c7959c"')] },
      { id: 'cond', nome: 'GET condicional', descricao: 'If-None-Match: 304', tom: 'tcp', ms: 1, linhas: [
        L('info', 'requisição: GET /notes/1  (If-None-Match: "0996f450b0c7959c")'),
        L('out', '304 Not Modified')] },
      { id: 'put1', nome: 'PUT sem If-Match', descricao: 'Precondição exigida', tom: 'tls', ms: 1, linhas: [
        L('info', 'requisição: PUT /notes/1  (sem If-Match)'),
        L('out', '428 Precondition Required'),
        L('hint', 'Leia a nota, guarde o ETag e envie-o em If-Match')] },
      { id: 'put2', nome: 'PUT com versão velha', descricao: 'If-Match: "0000"', tom: 'ink', ms: 1, linhas: [
        L('info', 'requisição: PUT /notes/1  (If-Match: "0000")'),
        L('out', '412 Precondition Failed'),
        L('hint', 'a chave protege contra repetição da mesma intenção; o If-Match, contra concorrência de intenções diferentes')] }
    ];
  };

  var codigoPag = String.raw`def pagina(itens, after=None, limit=2, maximo=100):
    """Paginação por cursor (keyset). itens: lista de dicts com "id" crescente.

    Devolve {"items": [...], "next": url ou None}.
    """
    if not 1 <= limit <= maximo:
        raise ValueError("limit entre 1 e 100")
    candidatos = [i for i in itens if after is None or i["id"] > after]
    # busque limit + 1 para saber se há próxima página, sem COUNT(*)
    visiveis = candidatos[:limit]
    return {"items": visiveis, "next": None}


notas = [{"id": n} for n in range(1, 6)]
print(pagina(notas, limit=2))
`;
  var testesPag = String.raw`NOTAS = [{"id": n} for n in range(1, 6)]


def test_primeira_pagina_tem_link_next():
    p = pagina(NOTAS, limit=2)
    assert [i["id"] for i in p["items"]] == [1, 2]
    assert p["next"] == "/notes?limit=2&after=2"


def test_ultima_pagina_tem_next_nulo():
    p = pagina(NOTAS, after=4, limit=2)
    assert [i["id"] for i in p["items"]] == [5]
    assert p["next"] is None


def test_pagina_exata_nao_inventa_proxima():
    p = pagina(NOTAS, after=3, limit=2)
    assert [i["id"] for i in p["items"]] == [4, 5]
    assert p["next"] is None


def test_apagar_item_anterior_nao_desloca_a_leitura():
    sem_o_1 = [i for i in NOTAS if i["id"] != 1]
    p = pagina(sem_o_1, after=2, limit=2)
    assert [i["id"] for i in p["items"]] == [3, 4]


def test_limit_fora_da_faixa_falha():
    for ruim in (0, 101):
        try:
            pagina(NOTAS, limit=ruim)
        except ValueError:
            continue
        assert False, "limit %s deveria levantar ValueError" % ruim
`;
  var solucaoPag = String.raw`def pagina(itens, after=None, limit=2, maximo=100):
    """Paginação por cursor (keyset). itens: lista de dicts com "id" crescente.

    Devolve {"items": [...], "next": url ou None}.
    """
    if not 1 <= limit <= maximo:
        raise ValueError("limit entre 1 e 100")
    candidatos = [i for i in itens if after is None or i["id"] > after]
    janela = candidatos[: limit + 1]
    tem_mais = len(janela) > limit
    visiveis = janela[:limit]
    proximo = "/notes?limit=%d&after=%d" % (limit, visiveis[-1]["id"]) if tem_mais else None
    return {"items": visiveis, "next": proximo}


notas = [{"id": n} for n in range(1, 6)]
print(pagina(notas, limit=2))
`;

  var codigoIdem = String.raw`import hashlib
import json
import threading


class ChaveReusada(Exception):
    """Mesma Idempotency-Key com corpo diferente: bug do cliente (422)."""


class Idempotencia:
    def __init__(self):
        self.guardado = {}
        self.trava = threading.Lock()

    def processar(self, chave, corpo, executar):
        """Devolve (resposta, repetida). executar(corpo) roda o efeito uma única vez por chave."""
        impressao = hashlib.sha256(json.dumps(corpo, sort_keys=True).encode()).hexdigest()
        with self.trava:
            if chave in self.guardado:
                # mesma impressão: devolva a resposta guardada; impressão diferente: ChaveReusada
                return self.guardado[chave][1], True
            resposta = executar(corpo)
            self.guardado[chave] = (impressao, resposta)
            return resposta, False


idem = Idempotencia()
print(idem.processar("k1", {"title": "redes"}, lambda c: {"id": 1}))
`;
  var testesIdem = String.raw`def contador():
    chamadas = []

    def executar(corpo):
        chamadas.append(corpo)
        return {"id": len(chamadas)}

    return chamadas, executar


def test_chave_nova_executa():
    chamadas, executar = contador()
    resp, repetida = Idempotencia().processar("k1", {"title": "redes"}, executar)
    assert resp == {"id": 1} and repetida is False and len(chamadas) == 1


def test_mesma_chave_e_corpo_devolve_a_resposta_guardada():
    chamadas, executar = contador()
    idem = Idempotencia()
    idem.processar("k1", {"title": "redes"}, executar)
    resp, repetida = idem.processar("k1", {"title": "redes"}, executar)
    assert resp == {"id": 1} and repetida is True and len(chamadas) == 1


def test_ordem_das_chaves_do_corpo_nao_importa():
    chamadas, executar = contador()
    idem = Idempotencia()
    idem.processar("k1", {"a": 1, "b": 2}, executar)
    _, repetida = idem.processar("k1", {"b": 2, "a": 1}, executar)
    assert repetida is True and len(chamadas) == 1


def test_mesma_chave_com_corpo_diferente_e_recusada():
    chamadas, executar = contador()
    idem = Idempotencia()
    idem.processar("k1", {"title": "redes"}, executar)
    try:
        idem.processar("k1", {"title": "outro"}, executar)
    except ChaveReusada:
        assert len(chamadas) == 1
        return
    assert False, "deveria levantar ChaveReusada"


def test_chave_diferente_executa_de_novo():
    chamadas, executar = contador()
    idem = Idempotencia()
    idem.processar("k1", {"title": "redes"}, executar)
    idem.processar("k2", {"title": "redes"}, executar)
    assert len(chamadas) == 2


def test_concorrencia_executa_uma_unica_vez():
    chamadas, executar = contador()
    idem = Idempotencia()
    ts = [threading.Thread(target=idem.processar, args=("k1", {"t": 1}, executar)) for _ in range(8)]
    try:
        for t in ts:
            t.start()
        for t in ts:
            t.join()
    except RuntimeError:
        # No navegador (Pyodide) não há threads: as 8 requisições chegam em sequência.
        for _ in range(8):
            idem.processar("k1", {"t": 1}, executar)
    assert len(chamadas) == 1
`;
  var solucaoIdem = String.raw`import hashlib
import json
import threading


class ChaveReusada(Exception):
    """Mesma Idempotency-Key com corpo diferente: bug do cliente (422)."""


class Idempotencia:
    def __init__(self):
        self.guardado = {}
        self.trava = threading.Lock()

    def processar(self, chave, corpo, executar):
        """Devolve (resposta, repetida). executar(corpo) roda o efeito uma única vez por chave."""
        impressao = hashlib.sha256(json.dumps(corpo, sort_keys=True).encode()).hexdigest()
        with self.trava:
            if chave in self.guardado:
                antiga, resposta = self.guardado[chave]
                if antiga != impressao:
                    raise ChaveReusada(chave)
                return resposta, True
            resposta = executar(corpo)
            self.guardado[chave] = (impressao, resposta)
            return resposta, False


idem = Idempotencia()
print(idem.processar("k1", {"title": "redes"}, lambda c: {"id": 1}))
`;

  TrilhaAula.registrar({
    id: 'f04-b4',
    titulo: 'JSON e APIs REST: paginação, erros, idempotência e OpenAPI',
    minutos: 50,
    resumo: 'Uma API é um contrato que você não consegue recolher. Como nomear, paginar, errar e repetir são as decisões que mais custam caro depois.',
    objetivo: 'Modelar recursos e evoluir a API de forma aditiva, paginar por cursor, devolver erros em Problem Details e tornar um POST repetível com idempotency key sem confundi-la com o ETag.',
    revisao: [
      { id: 'f04b4-offset', pergunta: 'Por que paginação por offset duplica ou pula itens numa lista que recebe inserções, e o que a evita?',
        opcoes: [
          opc('a', 'O offset conta posições, que se deslocam quando linhas entram ou saem; o cursor (keyset) ancora a página num valor e ainda usa o índice', true, 'WHERE id > :ultimo ORDER BY id LIMIT n+1: custo constante e estável sob inserção e remoção.'),
          opc('b', 'O offset é lento só em tabelas pequenas', false, 'o custo do offset cresce com a página: o banco percorre e descarta as linhas puladas.'),
          opc('c', 'O cursor exige COUNT(*) a cada página', false, 'o truque do LIMIT n+1 descobre a próxima página sem COUNT(*), caro em tabelas grandes.')] },
      { id: 'f04b4-idem', pergunta: 'O cliente repete um POST /pagamentos com a mesma Idempotency-Key depois de um timeout. O que o servidor faz?',
        opcoes: [
          opc('a', 'Reconhece a chave e devolve o resultado da primeira execução, sem cobrar outra vez', true, 'a mesma chave com corpo diferente deve ser recusada (422).'),
          opc('b', 'Processa de novo: POST sempre cria um recurso novo', false, 'sem a chave honrada, é exatamente a cobrança duplicada.'),
          opc('c', 'Recusa com 405', false, '405 é método não permitido para o caminho.')] },
      { id: 'f04b4-json', pergunta: 'Uma API devolve {"id": 9007199254740993}. O que acontece com JSON.parse em JavaScript?',
        opcoes: [
          opc('a', 'O número vira o double mais próximo (9007199254740992): perde precisão acima de 2^53', true, 'IDs de 64 bits e dinheiro devem trafegar como string (ou centavos inteiros).'),
          opc('b', 'Lê o inteiro exato, pois JSON suporta inteiros grandes', false, 'a especificação não limita, mas os clientes usam double IEEE 754.'),
          opc('c', 'Erro de sintaxe', false, 'o JSON é válido; a perda é silenciosa.')] },
      { id: 'f04b4-problem', pergunta: 'Qual membro do Problem Details (RFC 9457) o cliente deve usar para decidir o que fazer com o erro?',
        opcoes: [
          opc('a', 'type: o URI estável que identifica a classe do problema', true, 'title é o resumo estável, detail explica esta ocorrência (e nunca deve vazar internals) e instance identifica a ocorrência.'),
          opc('b', 'detail: o texto da ocorrência', false, 'o texto muda de ocorrência para ocorrência; não serve para decidir.'),
          opc('c', 'status apenas', false, 'o status é a faixa; o type distingue problemas dentro dela.')] },
      { id: 'f04b4-etag', pergunta: 'O que o Idempotency-Key resolve que o ETag com If-Match não resolve?',
        opcoes: [
          opc('a', 'Repetição da mesma intenção; o If-Match protege contra concorrência de intenções diferentes', true, 'são problemas distintos: retry seguro de um POST contra atualização perdida num PUT.'),
          opc('b', 'Nada: são o mesmo mecanismo', false, 'resolvem problemas diferentes e usam estado diferente.'),
          opc('c', 'Cache de respostas GET', false, 'o cache é papel do ETag com If-None-Match e do Cache-Control.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Um contrato que você não consegue recolher</h3>' +
          '<p>Depois que um cliente depende de um campo, de um código de status ou da ordem de uma lista, mudar vira quebra. As decisões deste bloco (como nomear, paginar, errar, repetir) são as que mais custam caro depois, e as que mais se repetem quando você consome a API de um provedor de modelo e quando expõe a sua.</p>' +
          '<h3>JSON: simples, com cantos afiados</h3>' +
          '<p>JSON (RFC 8259) tem objetos, arrays, strings, números, <code>true</code>/<code>false</code> e <code>null</code>; texto em UTF-8; sem comentários, sem vírgula final. O formato é pequeno, mas cada linguagem o lê de um jeito.</p>' },
        { tipo: 'abas', rotulo: 'Cantos afiados', itens: [
          { rotulo: 'Números', blocos: [{ tipo: 'texto', html: '<p>A especificação não fixa precisão. JavaScript e muitos clientes usam <em>double</em> IEEE 754, que só representa inteiros exatos até 2<sup>53</sup> (9 007 199 254 740 992). IDs de 64 bits (Snowflake IDs, por exemplo) corrompem silenciosamente num cliente JavaScript: serialize-os como string. Dinheiro também: <code>&quot;19.90&quot;</code> como string decimal ou inteiro em centavos, nunca <code>float</code>.</p>' }] },
          { rotulo: 'Chaves duplicadas', blocos: [{ tipo: 'texto', html: '<p>São sintaticamente válidas e semanticamente indefinidas: Python fica com a última, outro parser com a primeira. Uma camada de validação que lê uma enquanto o backend lê outra é um vetor clássico de bypass.</p>' }] },
          { rotulo: 'null × ausente', blocos: [{ tipo: 'texto', html: '<p>&quot;Não enviei&quot; e &quot;enviei vazio&quot; são intenções diferentes em atualização parcial. Decida e documente.</p>' }] },
          { rotulo: 'Datas', blocos: [{ tipo: 'texto', html: '<p>Datas não existem em JSON: use strings RFC 3339 (<code>2026-10-11T14:30:00Z</code>) em UTC. Duração, em segundos inteiros ou ISO 8601, mas escolha um.</p>' }] },
          { rotulo: 'Python aceita mais', blocos: [{ tipo: 'texto', html: '<p><code>json.loads(&quot;NaN&quot;)</code> devolve <code>nan</code>, e <code>Infinity</code> também, embora não sejam JSON válido. Para entrada não confiável, passe um <code>parse_constant</code> que levante erro, ou valide com Pydantic (M03).</p>' },
            { tipo: 'codigo', linguagem: 'python', texto: '>>> import json\n>>> json.loads(\'{"a": 1, "a": 2}\')\n{\'a\': 2}\n>>> json.loads(\'[NaN]\')\n[nan]\n>>> json.loads(\'[NaN]\', parse_constant=lambda c: (_ for _ in ()).throw(ValueError(c)))\nValueError: NaN' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Recursos, não procedimentos</h3>' +
          '<p>&quot;REST&quot; no uso corrente significa: modelar o domínio como <strong>recursos</strong> identificados por URL (substantivos), manipulados pelos métodos HTTP com sua semântica, representados em JSON, sem estado de sessão no servidor entre requisições. A tabela do laboratório:</p>' +
          '<table><tr><th>Operação</th><th>Requisição</th><th>Sucesso</th><th>Falhas típicas</th></tr>' +
          '<tr><td>listar</td><td><code>GET /notes?limit=20&amp;after=40</code></td><td>200</td><td>400 (parâmetro inválido)</td></tr>' +
          '<tr><td>criar</td><td><code>POST /notes</code></td><td>201 + <code>Location</code></td><td>400, 415, 422</td></tr>' +
          '<tr><td>ler</td><td><code>GET /notes/1</code></td><td>200 / 304</td><td>404</td></tr>' +
          '<tr><td>substituir</td><td><code>PUT /notes/1</code> + <code>If-Match</code></td><td>200</td><td>404, 412, 428</td></tr>' +
          '<tr><td>remover</td><td><code>DELETE /notes/1</code></td><td>204</td><td>404</td></tr></table>', largo: true },
        { tipo: 'texto', html:
          '<p>Convenções que reduzem atrito: coleções no plural; hierarquia só quando o filho não existe sem o pai (<code>/orders/7/items</code>), nunca profunda além de dois níveis; ações que não cabem em CRUD viram sub-recurso criado por <code>POST</code> (<code>POST /payments/9/refunds</code>), não verbos soltos na URL; a resposta de criação traz o recurso e o <code>Location</code>. Para alterações parciais, <code>PATCH</code> com JSON Merge Patch (RFC 7396, <code>null</code> remove o campo) é o mais simples; JSON Patch (RFC 6902) é a operação-por-operação. O laboratório usa <code>PUT</code> com <code>If-Match</code> por ser o caso que ensina concorrência. REST puro (HATEOAS) é raro; o mínimo que vale adotar é o campo <code>href</code> ou <code>next</code> já pronto na resposta, para o cliente seguir links em vez de montar URLs.</p>' +
          '<h3>Versionamento: a regra é não precisar dele</h3>' +
          '<p>Evolua de forma <strong>aditiva</strong>: campos novos opcionais não quebram clientes que os ignoram (isto obriga clientes a tolerar campos desconhecidos, a regra de Postel aplicada com critério). Quebra de verdade é remover ou renomear campo, mudar tipo, tornar obrigatório o que era opcional, mudar a semântica de um status. Quando é inevitável, há três lugares para a versão:</p>' },
        { tipo: 'abas', rotulo: 'Onde pôr a versão', itens: [
          { rotulo: 'Caminho', blocos: [{ tipo: 'texto', html: '<p><code>/v2/notes</code>: visível, fácil de rotear e de cachear; versiona a API toda e multiplica manutenção.</p>' }] },
          { rotulo: 'Cabeçalho / mídia', blocos: [{ tipo: 'texto', html: '<p><code>Accept: application/vnd.exemplo.v2+json</code>: URL estável; invisível em logs e no navegador, mais difícil de testar.</p>' }] },
          { rotulo: 'Data', blocos: [{ tipo: 'texto', html: '<p><code>Api-Version: 2026-10-01</code> (estilo de alguns provedores): pequenas mudanças datadas por cliente; exige camada de compatibilidade no servidor.</p>' }] }
        ] },
        { tipo: 'texto', html: '<p>Seja qual for a escolha, anuncie descontinuação com antecedência (os cabeçalhos <code>Deprecation</code> e <code>Sunset</code> existem para isso) e meça quem ainda usa a versão velha antes de desligá-la.</p>' },
        { tipo: 'takeaway', html: 'JSON tem <mark>cantos afiados</mark> (precisão, chaves duplicadas, <code>NaN</code>); modele <mark>recursos</mark> e evolua de forma <mark>aditiva</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Paginação: offset × cursor</h3>' +
          '<p>Nunca devolva coleção sem limite. <strong>Offset</strong> (<code>?page=3&amp;size=20</code>, SQL <code>OFFSET 40</code>) é simples e permite &quot;ir à página 7&quot;, mas tem dois defeitos: o banco precisa percorrer e descartar as linhas puladas (o custo cresce com a página) e, se um item é inserido ou removido entre duas requisições, a lista desloca e o cliente <em>pula ou repete</em> itens.</p>' +
          '<p><strong>Cursor</strong> (<em>keyset</em>) usa o valor do último item visto como âncora: <code>?after=40&amp;limit=20</code> vira <code>WHERE id &gt; 40 ORDER BY id LIMIT 21</code>. Usa o índice, tem custo constante e é estável sob inserção e remoção. O truque do <code>LIMIT n+1</code> descobre se há próxima página sem fazer <code>COUNT(*)</code>. A chave de ordenação precisa ser única e estável; para ordenar por um campo não único (data de criação), o cursor vira o par <code>(data, id)</code>. Cursores opacos (codificados) deixam você mudar a implementação depois. O laboratório devolve <code>{&quot;items&quot;: [...], &quot;next&quot;: &quot;/notes?limit=2&amp;after=2&quot;}</code>, com <code>next: null</code> na última página.</p>' },
        { tipo: 'abas', rotulo: 'Offset ou cursor', itens: [
          { rotulo: 'Offset', blocos: [{ tipo: 'texto', html: '<ul><li>Simples: <code>?page=3</code> ou <code>?offset=40</code>; permite &quot;ir para a página 7&quot;.</li><li>Instável com dados mudando: repete ou pula itens.</li><li>Custo cresce com o offset.</li></ul>' }] },
          { rotulo: 'Cursor', blocos: [{ tipo: 'texto', html: '<ul><li>Estável: continua do último item visto.</li><li>Custo constante, usando índice.</li><li>Não pula para a página N; o cursor deve ser opaco e o <code>limit</code> máximo imposto pelo servidor.</li></ul>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Erros: Problem Details (RFC 9457)</h3>' +
          '<p>Um formato único de erro, legível por máquina, evita que cada cliente escreva um parser por endpoint. O RFC 9457 (que substitui o 7807) define o tipo de mídia <code>application/problem+json</code> com os membros <code>type</code> (URI que identifica a classe do problema), <code>title</code> (resumo estável), <code>status</code>, <code>detail</code> (explicação desta ocorrência) e <code>instance</code> (identifica esta ocorrência); extensões livres, como <code>errors</code>. Saída real do laboratório para um <code>limit=0</code>:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto:
          'HTTP/1.1 400 Bad Request\n' +
          'Content-Type: application/problem+json\n\n' +
          '{"type": "/problems/bad-query", "title": "Parâmetros inválidos", "status": 400,\n' +
          ' "instance": "/notes?limit=0",\n' +
          ' "errors": [{"field": "limit", "message": "inteiro entre 1 e 100"}]}' },
        { tipo: 'texto', html: '<p>O cliente decide por <code>type</code> (estável), mostra <code>title</code>, registra <code>detail</code>. Nunca vaze internals em <code>detail</code>: o teste <code>test_unexpected_exception_is_500_without_leaking</code> garante que uma exceção inesperada vira <code>500</code> genérico, com a stack só no log do servidor.</p>' +
          '<h3>Idempotency keys: retry seguro para <code>POST</code></h3>' +
          '<p>O problema: o cliente envia <code>POST /payments</code>, o servidor processa, a resposta se perde (timeout, queda de conexão). O cliente não sabe se funcionou. Repetir pode cobrar duas vezes; não repetir pode perder o pedido. A solução é o cliente gerar uma chave única por <em>intenção</em> (UUID) e enviá-la em <code>Idempotency-Key</code>; o servidor guarda <code>chave &rarr; (impressão do corpo, resposta)</code>:</p>' +
          '<ul><li>chave nova: executa e guarda a resposta;</li><li>mesma chave, mesmo corpo: devolve a resposta guardada, sem executar de novo (o laboratório marca <code>Idempotency-Replayed: true</code>);</li><li>mesma chave, corpo diferente: <code>422</code>, é bug do cliente;</li><li>mesma chave <em>em voo</em> em duas requisições simultâneas: só uma executa (o lock cobre checagem e escrita juntas; há teste com concorrência).</li></ul>' },
        { tipo: 'rode', id: 'ciclo-rode', titulo: 'O ciclo completo no laboratório',
          enunciado: 'Rode a sequência do exemplo trabalhado (cada etapa é uma chamada ao cliente cru do laboratório, abreviada): criação com chave, repetição, leitura condicional e as duas precondições do PUT. Clique em cada etapa.',
          prefixo: '$', entrada: "uv run python -m web_http_lab.cli request POST http://127.0.0.1:8765/notes -H 'Content-Type: application/json' -H 'Idempotency-Key: k1' --data '{\"title\":\"redes\",\"body\":\"tcp\"}'", unidade: 'req', terminalTitulo: 'API de notas', etapas: etapasCiclo(),
          prever: { pergunta: 'Você repete o POST /notes com a mesma Idempotency-Key e o mesmo corpo. O que acontece com a coleção?', opcoes: [
            { id: 'a', texto: 'Ganha uma segunda nota, com id 2.', correta: false, porque: 'isso é o que acontece sem chave, ou com uma chave nova por tentativa.' },
            { id: 'b', texto: 'Continua com a nota 1; a resposta repetida vem com Idempotency-Replayed: true.', correta: true, porque: 'o servidor reconheceu (chave, impressão do corpo) e devolveu a resposta guardada sem executar o efeito.' },
            { id: 'c', texto: 'O servidor responde 409 Conflict.', correta: false, porque: '409 não é a regra aqui: mesma chave e mesmo corpo é repetição legítima. Corpo diferente é que dá 422.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em Repetição para ver só essa etapa.',
          tutorDepois: 'A chave protege contra a repetição da mesma intenção; o If-Match (428 e 412 no fim) protege contra a concorrência de intenções diferentes. Cada linha corresponde a um passo do laboratório guiado, com a saída real do servidor.',
          callout: 'Você viu os dois mecanismos lado a lado: idempotency key para repetição, ETag e If-Match para concorrência.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o if key in cache', html:
          '<p>Idempotency key só protege se o servidor tratar o <em>fingerprint</em> do corpo e a concorrência. Implementações ingênuas fazem <code>if key in cache: return cache[key]</code> e depois executam: duas requisições simultâneas com a mesma chave passam ambas pelo <code>if</code> antes de qualquer uma gravar. Outra falha comum: guardar a resposta só em caso de sucesso, de modo que uma chave que falhou <em>depois</em> do efeito colateral executa o efeito duas vezes. A regra é gravar o início da operação e o efeito atomicamente: em produção, a chave e o efeito vão na <strong>mesma transação</strong> do banco, com expiração (24 h é comum). O cabeçalho ainda é rascunho do IETF (<code>draft-ietf-httpapi-idempotency-key-header</code>, verificado em 11/10/2026), mas é prática consolidada em provedores de pagamento.</p>' },
        { tipo: 'takeaway', html: 'Pagine por <mark>cursor</mark> com limite máximo; erros em <mark>Problem Details</mark> com <code>type</code> estável; <mark>Idempotency-Key</mark> torna o POST repetível.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'pagina-python', titulo: 'Pagine por cursor com LIMIT n+1', obrigatorio: false,
          enunciado: 'Complete <code>pagina(itens, after, limit)</code>: devolva até <code>limit</code> itens com id maior que <code>after</code> e um link <code>next</code> só se houver mais. Busque <code>limit + 1</code> em vez de contar tudo. Limite fora de 1 a 100 levanta <code>ValueError</code>.',
          codigo: codigoPag, testes: testesPag,
          dica: 'Pegue <code>janela = candidatos[:limit + 1]</code>. Há próxima página se <code>len(janela) &gt; limit</code>; o link usa o id do último item visível: <code>"/notes?limit=%d&amp;after=%d"</code>.',
          solucao: solucaoPag,
          tutorDepois: 'O LIMIT n+1 troca um COUNT(*) caro por uma linha a mais. E como a página ancora num id, apagar um item anterior não desloca a leitura, o que o teste de remoção prova.',
          callout: 'A paginação por cursor passou: link next, última página, página exata, remoção e limite inválido.' },
        { tipo: 'python', id: 'idem-python', titulo: 'Guarde a impressão do corpo', obrigatorio: false,
          enunciado: 'A classe já tem o lock cobrindo checagem e escrita. Complete o ramo da chave repetida: mesma impressão devolve a resposta guardada; impressão diferente levanta <code>ChaveReusada</code>.',
          codigo: codigoIdem, testes: testesIdem,
          dica: 'Desempacote <code>antiga, resposta = self.guardado[chave]</code>. Se <code>antiga != impressao</code>, levante <code>ChaveReusada(chave)</code>; senão devolva <code>(resposta, True)</code>.',
          solucao: solucaoIdem,
          tutorDepois: 'Sem a impressão, a mesma chave com outro corpo devolveria a resposta de uma intenção diferente em silêncio. Sem o lock em volta da checagem e da escrita, as duas requisições simultâneas executariam o efeito.',
          callout: 'A idempotência passou: repetição, ordem de chaves, corpo divergente, outra chave e concorrência.' },
        { tipo: 'takeaway', html: 'A chave guarda <mark>(impressão do corpo, resposta)</mark> sob um <mark>lock</mark> que cobre checagem e escrita juntas.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>OpenAPI: o contrato em forma de dado</h3>' +
          '<p>OpenAPI (3.1) descreve paths, métodos, parâmetros, corpos e respostas em YAML/JSON, com JSON Schema para os tipos. Rende três coisas: documentação navegável, geração de clientes e de testes de contrato, e validação automática. Há duas abordagens: <em>contract-first</em> (você escreve o contrato, revisa com os consumidores e gera o esqueleto) e <em>code-first</em> (o framework deduz do código; o FastAPI faz isso a partir dos tipos Pydantic, no M03). Code-first é mais rápido; contract-first força a discussão antes do código. Em qualquer caso, o arquivo OpenAPI entra no CI, e uma mudança que remove campo ou endurece validação deve ser detectada como <em>breaking change</em> por uma ferramenta de comparação, não por um cliente em produção.</p>' },
        { tipo: 'codigo', linguagem: 'yaml', texto:
          'paths:\n' +
          '  /notes/{id}:\n' +
          '    get:\n' +
          '      parameters: [{name: id, in: path, required: true, schema: {type: integer}}]\n' +
          '      responses:\n' +
          '        "200": {description: ok, content: {application/json: {schema: {$ref: "#/components/schemas/Note"}}}}\n' +
          '        "404": {description: não encontrada, content: {application/problem+json: {}}}' },
        { tipo: 'cenario', id: 'retry-cenario', titulo: 'A resposta do pagamento se perdeu', obrigatorio: false,
          enunciado: 'O cliente envia <code>POST /payments</code>, o servidor processa e a resposta se perde num timeout. Decida o que o cliente e o servidor fazem.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O cliente não sabe se o pagamento foi processado. O que ele faz?', opcoes: [
              { texto: 'Não repetir nunca: POST não é idempotente.', vai: 'f-perde', tom: 'ruim', consequencia: 'o pedido pode se perder, e o usuário fica sem saber se pagou.' },
              { texto: 'Repetir o POST com uma chave nova gerada a cada tentativa.', vai: 'f-duplica', tom: 'ruim', consequencia: 'a chave por tentativa deixa o servidor tratar cada retry como intenção nova: cobra duas vezes.' },
              { texto: 'Repetir o POST com a mesma Idempotency-Key, gerada uma vez por intenção.', vai: 'n2', tom: 'ok', consequencia: 'a chave identifica a intenção, não a tentativa.' }
            ] },
            n2: { texto: 'No servidor, como a chave e o efeito precisam ser gravados?', opcoes: [
              { texto: 'Executar o pagamento e, depois, registrar a chave num cache.', vai: 'f-janela', tom: 'ruim', consequencia: 'há uma janela entre executar e registrar; duas requisições simultâneas ou uma queda no meio executam o efeito duas vezes.' },
              { texto: 'Gravar a chave e o efeito na mesma transação, com impressão do corpo e expiração.', vai: 'f-bom', tom: 'ok', consequencia: 'a atomicidade fecha a janela e a impressão detecta corpo divergente (422).' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Retry seguro: a mesma chave por intenção, o servidor com impressão do corpo e gravação atômica. O cliente pode repetir sem medo de cobrar duas vezes.' },
            'f-perde': { bom: false, texto: 'Sem oferecer solução, "nunca repetir" só troca duplicação por perda de pedido.' },
            'f-duplica': { bom: false, texto: 'Uma chave por tentativa desfaz a proteção: cada retry vira uma intenção nova.' },
            'f-janela': { bom: false, texto: 'Registrar a chave depois do efeito deixa uma janela em que o efeito pode rodar duas vezes.' }
          } },
        { tipo: 'escolha', id: 'b4-escolha-pag', titulo: 'Confira: 50 milhões de linhas',
          pergunta: 'A listagem de <code>/orders</code> tem 50 milhões de linhas com inserções constantes. Qual desenho evita pular ou repetir itens e mantém o custo estável?',
          opcoes: [
            { id: 'a', texto: 'Cursor sobre chave única e estável, com limit máximo, LIMIT n+1 e link next.', correta: true, porque: 'ancora no valor, usa o índice e descobre a próxima página sem COUNT(*).' },
            { id: 'b', texto: 'OFFSET com COUNT(*) a cada página para mostrar o total.', correta: false, porque: 'o custo do offset cresce com a página, o COUNT(*) é caro e a lista desloca sob inserção.' },
            { id: 'c', texto: 'Devolver tudo e paginar no cliente.', correta: false, porque: 'nunca devolva coleção sem limite.' }
          ], tutorDepois: 'Para ordenar por um campo não único, o cursor vira o par (data, id).' },
        { tipo: 'escolha', id: 'b4-escolha-evolucao', titulo: 'Confira: a mudança que quebra',
          pergunta: 'Qual destas mudanças numa API já publicada NÃO quebra clientes existentes?',
          opcoes: [
            { id: 'a', texto: 'Renomear o campo <code>title</code> para <code>titulo</code>.', correta: false, porque: 'renomear ou remover campo é quebra.' },
            { id: 'b', texto: 'Acrescentar o campo opcional <code>tags</code> na resposta.', correta: true, porque: 'campo novo opcional é evolução aditiva; clientes tolerantes a campos desconhecidos o ignoram.' },
            { id: 'c', texto: 'Tornar obrigatório um parâmetro que era opcional.', correta: false, porque: 'quem não o enviava passa a receber 400.' },
            { id: 'd', texto: 'Mudar <code>id</code> de inteiro para string.', correta: false, porque: 'mudar o tipo é quebra, ainda que seja a direção recomendada para IDs de 64 bits.' }
          ], tutorDepois: 'Quando a quebra é inevitável, versione, anuncie com Deprecation e Sunset e meça quem usa a versão velha.' },
        { tipo: 'takeaway', html: 'A chave é por <mark>intenção</mark>, não por tentativa; OpenAPI no CI detecta <mark>breaking change</mark> antes do cliente.' }
      ] }
    ]
  });
})();
