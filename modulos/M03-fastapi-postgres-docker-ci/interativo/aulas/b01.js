/* M03 · Bloco 1: fronteira HTTP. Fonte: M03.html#b01. Exemplo condutor: encurtador de links. Fontes consultadas em 21/08/2026 (revalidar em até 90 dias). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var b1Codigo = [
    "import uuid",
    "",
    "# situação do request -> status HTTP deliberado",
    "STATUS = {\"criada\": 201}",
    "",
    "",
    "def status_para(situacao):",
    "    \"\"\"Falha inesperada (ou situação desconhecida) vira 500 e nunca vaza detalhe.\"\"\"",
    "    return 200",
    "",
    "",
    "def normalizar_request_id(recebido, gerar):",
    "    \"\"\"Preserva um UUID válido (em minúsculas); qualquer outra coisa vira gerar().\"\"\"",
    "    return recebido",
    "",
    "",
    "print(status_para(\"colisao\"), normalizar_request_id(\"lixo\\nX-Evil: 1\", lambda: \"novo\"))"
  ].join('\n');
  var b1Testes = [
    "def test_status_deliberados():",
    "    assert status_para(\"criada\") == 201",
    "    assert status_para(\"schema_invalido\") == 422",
    "    assert status_para(\"json_malformado\") == 400",
    "    assert status_para(\"ausente\") == 404",
    "    assert status_para(\"colisao\") == 409",
    "",
    "",
    "def test_situacao_desconhecida_e_500():",
    "    assert status_para(\"explodiu\") == 500",
    "    assert status_para(\"inesperada\") == 500",
    "",
    "",
    "def test_uuid_valido_e_preservado_em_minusculas():",
    "    rid = \"123E4567-E89B-12D3-A456-426614174000\"",
    "    assert normalizar_request_id(rid, lambda: \"novo\") == rid.lower()",
    "",
    "",
    "def test_ausente_gera_novo():",
    "    assert normalizar_request_id(None, lambda: \"novo\") == \"novo\"",
    "    assert normalizar_request_id(\"\", lambda: \"novo\") == \"novo\"",
    "",
    "",
    "def test_header_hostil_nao_chega_ao_log():",
    "    assert normalizar_request_id(\"abc\\nX-Evil: 1\", lambda: \"novo\") == \"novo\"",
    "    assert normalizar_request_id(\"<script>\", lambda: \"novo\") == \"novo\""
  ].join('\n');
  var b1Solucao = [
    "import uuid",
    "",
    "# situação do request -> status HTTP deliberado",
    "STATUS = {",
    "    \"criada\": 201,",
    "    \"schema_invalido\": 422,",
    "    \"json_malformado\": 400,",
    "    \"ausente\": 404,",
    "    \"colisao\": 409,",
    "}",
    "",
    "",
    "def status_para(situacao):",
    "    return STATUS.get(situacao, 500)",
    "",
    "",
    "def normalizar_request_id(recebido, gerar):",
    "    if not recebido:",
    "        return gerar()",
    "    try:",
    "        return str(uuid.UUID(recebido))",
    "    except ValueError:",
    "        return gerar()"
  ].join('\n');
  var CMD = 'curl -s -i -X POST localhost:8000/links -H "content-type: application/json" -d \'{"url":"https://exemplo.dev/docs"}\'';

  var etapas = function () {
    return [
      { id: 'ida', nome: 'Middleware (ida)', descricao: 'Uvicorn entrega o escopo ASGI', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'POST /links'),
        L('info', 'x-request-id ausente: o middleware gera um UUID novo'),
        L('hint', 'o que vem antes do call_next roda na ida')] },
      { id: 'schema', nome: 'Schema', descricao: 'FastAPI constrói LinkIn', tom: 'tcp', ms: 1, linhas: [
        L('info', 'LinkIn(url="https://exemplo.dev/docs") ok: min_length=8 e pattern ^https?://'),
        L('hint', 'validação de representação, não decisão de negócio')] },
      { id: 'rota', nome: 'Rota e dependência', descricao: 'get_repo entrega o repositório', tom: 'tls', ms: 2, linhas: [
        L('info', 'Depends(get_repo) resolvido; criar_link grava demo-1'),
        L('hint', 'o dicionário em memória só visualiza o fluxo; persistência é o bloco 2')] },
      { id: 'volta', nome: 'Resposta', descricao: 'LinkOut + headers do middleware', tom: 'response', ms: 1, linhas: [
        L('out', 'HTTP/1.1 201 Created'),
        L('out', 'x-request-id: <uuid gerado>'),
        L('out', 'x-elapsed-ms: <tempo medido>'),
        L('body', '{"slug":"demo-1","url":"https://exemplo.dev/docs"}'),
        L('hint', 'o que vem depois do call_next roda na volta')] }
    ];
  };

  var etapasFalha = function () {
    return [
      { id: 'ida', nome: 'Middleware (ida)', descricao: 'Gera ou normaliza o request id', tom: 'dns', ms: 1, linhas: [L('cmd', 'POST /links'), L('info', 'request id definido')] },
      { id: 'schema', nome: 'Schema', descricao: 'Valida LinkIn', tom: 'tcp', ms: 1, linhas: [L('info', 'LinkIn aceito')] },
      { id: 'rota', nome: 'Rota', descricao: 'Chama a aplicação', tom: 'tls', ms: 2, linhas: [L('info', 'rota executada')] },
      { id: 'volta', nome: 'Resposta', descricao: 'Status, headers e corpo', tom: 'response', ms: 1, linhas: [L('out', 'HTTP/1.1 201 Created')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm03-b1',
    titulo: 'Fronteira HTTP: rotas, Depends, middleware e lifespan',
    minutos: 40,
    resumo: 'A API existe para estabilizar o acordo entre cliente e aplicação. O FastAPI traduz HTTP; status, erro, idempotência e autorização continuam sendo decisões suas.',
    objetivo: 'Explicar o que ASGI, Uvicorn e FastAPI fazem, ler a assinatura de uma rota como contrato, escolher o status deliberado por situação e dizer onde o middleware e o Depends entram no caminho de uma requisição.',
    revisao: [
      { id: 'm03b1-contrato', pergunta: 'Por que a assinatura de uma rota FastAPI é tratada como o contrato?',
        opcoes: [
          opc('a', 'Parâmetros e modelos Pydantic definem de onde a entrada vem, como é validada e o que entra no OpenAPI', true, 'mudar a assinatura muda binding, validação e documentação ao mesmo tempo.'),
          opc('b', 'Porque o FastAPI escolhe sozinho status, autorização e formato de erro', false, 'a inferência reduz configuração repetida, mas não elimina decisão do autor da API.'),
          opc('c', 'Porque o OpenAPI impõe quem pode chamar o endpoint', false, 'OpenAPI descreve a rota; autorização, quota e auditoria são outro controle (M12).')] },
      { id: 'm03b1-asgi', pergunta: 'Um handler <code>async def</code> chama <code>requests.get()</code> (síncrono, 2 s) com um worker Uvicorn. O que acontece com as outras requisições?',
        opcoes: [
          opc('a', 'Esperam: a chamada bloqueante segura o event loop daquele worker', true, 'ASGI descreve a interface, não cria paralelismo; só handlers <code>def</code> comuns vão para threadpool.'),
          opc('b', 'São atendidas em paralelo, porque ASGI é assíncrono', false, 'em <code>async def</code> você roda dentro do loop.'),
          opc('c', 'O FastAPI move a chamada para um pool de processos', false, 'ele não detecta nem desvia chamada bloqueante.')] },
      { id: 'm03b1-status', pergunta: 'JSON bem-formado, mas <code>url</code> viola o pattern do schema. Qual resposta é a deliberada?',
        opcoes: [
          opc('a', '422 com corpo de erro estruturado', true, 'sintaxe válida, representação que não satisfaz o schema; é o que o Pydantic devolve.'),
          opc('b', '400 Bad Request', false, '400 fica para requisição malformada de fato.'),
          opc('c', '409 Conflict', false, '409 é conflito com o estado do recurso, como slug repetido.')] },
      { id: 'm03b1-idem', pergunta: 'Por que a idempotência dos verbos importa para quem faz retry (gateway, load balancer, agente)?',
        opcoes: [
          opc('a', 'Retry automático só é seguro sobre operação idempotente; POST sem chave de idempotência pode duplicar o efeito', true, 'GET, PUT e DELETE são idempotentes; POST não é.'),
          opc('b', 'Porque verbos idempotentes são mais rápidos', false, 'o critério é o efeito de repetir, não a velocidade.'),
          opc('c', 'Porque o FastAPI repete POST sozinho', false, 'quem repete é o cliente ou a infraestrutura.')] },
      { id: 'm03b1-reqid', pergunta: 'Por que o middleware do exemplo só preserva o <code>x-request-id</code> do cliente se for um UUID válido?',
        opcoes: [
          opc('a', 'Confiar em qualquer header deixaria o cliente escrever conteúdo arbitrário no log', true, 'num edge com gateway confiável a política de confiança precisa ser declarada.'),
          opc('b', 'Porque UUID é obrigatório pelo HTTP', false, 'é uma política do exemplo, não do protocolo.'),
          opc('c', 'Porque o Uvicorn rejeita outros formatos', false, 'o servidor entrega o header como veio.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Uma API não começa na rota</h3>' +
          '<p>Um cliente precisa criar um link e recuperá-lo depois. Ele não deveria saber se o serviço usa um dicionário, PostgreSQL ou outro processo. Também não deveria receber uma exceção Python, uma página HTML ou uma resposta cujo formato muda a cada endpoint. A <strong>fronteira HTTP</strong> existe para estabilizar esse acordo.</p>' +
          '<p>Ela recebe bytes e metadados de HTTP, valida uma representação, chama a aplicação e devolve uma representação com status, headers e corpo. Isso é <em>transporte</em>. A regra que decide se um link pode existir pertence à aplicação, e a persistência só aparece no bloco 2.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Pré-requisitos', html: '<p>Pydantic e testes do M02 (modelo de validação na borda, caminho feliz e falha) e o modelo de concorrência cooperativa do M02, bloco 5. Este bloco é leitura com exemplos rotulados; o roteiro executável fica no laboratório guiado, depois do bloco 8.</p>' },
        { tipo: 'texto', html: '<h3>ASGI, Uvicorn e FastAPI fazem trabalhos diferentes</h3><p>Escolha uma peça para ver o que ela faz e o que não faz.</p>' },
        { tipo: 'abas', rotulo: 'Peça', itens: [
          { rotulo: 'ASGI', blocos: [{ tipo: 'texto', html: '<p><strong>ASGI</strong> é uma interface Python entre servidor e aplicação assíncrona. Ela descreve como uma conexão HTTP, WebSocket ou lifecycle chega à aplicação. É um contrato, não um programa.</p><p>Por causa dele você testa o app em memória por um transporte ASGI e troca o servidor sem reescrever endpoints.</p>' }] },
          { rotulo: 'Uvicorn', blocos: [{ tipo: 'texto', html: '<p><strong>Uvicorn</strong> é um servidor que aceita conexões e chama uma aplicação ASGI. Ele não conhece rotas nem schemas.</p><p>Ser assíncrono não transforma cada handler em paralelismo: um <code>async def</code> continua sujeito às regras de I/O cooperativo do M02, e uma operação bloqueante no handler bloqueia o trabalho daquele loop.</p>' }] },
          { rotulo: 'FastAPI', blocos: [{ tipo: 'texto', html: '<p><strong>FastAPI</strong> é o adapter que interpreta rotas, tipos, dependências e respostas sobre a interface ASGI.</p><p>Ele lê parâmetros e modelos Pydantic para decidir de onde cada entrada vem e como documentá-la: parâmetro presente no caminho da rota é <em>path parameter</em>, modelo Pydantic normalmente é o corpo, e a anotação de retorno com <code>response_model</code> delimita a forma exposta. O resultado alimenta o <strong>OpenAPI</strong>, uma descrição interoperável usada por documentação e geradores de cliente.</p>' }] },
          { rotulo: 'O que ficou com você', blocos: [{ tipo: 'texto', html: '<p>Inferência reduz configuração repetida, não elimina decisão. Aceitar campo extra, escolher o status de conflito ou publicar uma entidade do banco continuam sendo escolhas do autor da API.</p><p><strong>O framework acelera a tradução HTTP. Ele não decide semântica, autorização, transação ou desenho de dados.</strong></p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Depends: a DI que é função, não container</h3>' +
          '<p><code>Depends</code> não é um contêiner genérico de injeção de dependências. É uma instrução para o FastAPI resolver uma <em>callable</em> para a operação e suas subdependências, de modo que o grafo fica ao lado do endpoint. A dependência pode ser síncrona ou assíncrona; a escolha segue o trabalho realizado.</p>' +
          '<ul><li><strong>Alias reutilizável.</strong> <code>Repo = Annotated[dict[str, str], Depends(get_repo)]</code> preserva o tipo que o endpoint recebe sem repetir a declaração. Não torna o dicionário seguro entre requests.</li>' +
          '<li><strong>Escopo por request com <code>yield</code>.</strong> Preparo antes da operação e teardown depois. No bloco 2 ela abre, confirma ou reverte e fecha a sessão de banco; a limpeza precisa de oráculo, não de confiança no framework.</li>' +
          '<li><strong>Override em teste.</strong> <code>app.dependency_overrides[get_repo] = get_repo_fake</code>, sem container de teste nem builder (o bloco 6 usa).</li>' +
          '<li><strong>Autenticação e autorização também são dependências:</strong> uma função lê o header, valida o token e devolve o usuário ou levanta 401. O M12 constrói isso com a mesma mecânica.</li></ul>' },
        { tipo: 'takeaway', html: 'O FastAPI <mark>traduz HTTP</mark> e lê a <mark>assinatura como contrato</mark>; semântica, autorização e transação continuam sendo <mark>decisões suas</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Exemplo trabalhado: a fronteira antes do banco</h3>' +
          '<p>Exemplo conceitual completo. Guarda links em memória para tornar visíveis a rota, o schema, a dependência e o erro. <strong>Não é o código do laboratório</strong> e não prova persistência, colisão concorrente nem segurança de slug.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'from contextlib import asynccontextmanager',
          'from collections.abc import AsyncIterator',
          'from typing import Annotated',
          'from fastapi import Depends, FastAPI, HTTPException, status',
          'from pydantic import BaseModel, Field',
          '',
          'class LinkIn(BaseModel):',
          '    url: str = Field(min_length=8, pattern=r"^https?://")',
          '',
          'class LinkOut(BaseModel):',
          '    slug: str',
          '    url: str',
          '',
          '@asynccontextmanager',
          'async def lifespan(app: FastAPI) -> AsyncIterator[None]:',
          '    # startup: abrir pool de conexões, aquecer cache... (o bloco 2 usa de verdade)',
          '    print("subindo")',
          '    yield',
          '    # shutdown: fechar pool, drenar filas',
          '    print("descendo")',
          '',
          'app = FastAPI(title="Shortener", lifespan=lifespan)',
          '_fake_db: dict[str, str] = {}          # até o bloco 2 chegar com Postgres',
          '',
          'def get_repo() -> dict[str, str]:      # a "dependência"; vira sessão de banco depois',
          '    return _fake_db',
          '',
          'Repo = Annotated[dict[str, str], Depends(get_repo)]   # alias reutilizável',
          '',
          '@app.post("/links", response_model=LinkOut, status_code=status.HTTP_201_CREATED)',
          'async def criar_link(body: LinkIn, repo: Repo) -> LinkOut:',
          '    slug = f"demo-{len(repo) + 1}"  # só para visualizar; o bloco 2 troca por constraint',
          '    repo[slug] = body.url',
          '    return LinkOut(slug=slug, url=body.url)',
          '',
          '@app.get("/links/{slug}", response_model=LinkOut)',
          'async def obter_link(slug: str, repo: Repo) -> LinkOut:',
          '    if slug not in repo:',
          '        raise HTTPException(status_code=404, detail="slug não encontrado")',
          '    return LinkOut(slug=slug, url=repo[slug])'].join('\n') },
        { tipo: 'texto', html:
          '<p>Uma dependência com <code>yield</code> modela preparo e teardown. O valor alterado no <code>finally</code> abaixo só visualiza o ciclo de vida: o <code>yield</code> não torna uma sessão segura para várias tarefas concorrentes, não escolhe commit e não recupera falha remota. Quem abriu o recurso responde pelo protocolo de encerramento.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'from collections.abc import AsyncIterator',
          '',
          'async def get_request_resource() -> AsyncIterator[str]:',
          '    resource = "aberto"',
          '    try:',
          '        yield resource',
          '    finally:',
          '        # o bloco 2 prova cleanup e rollback com PostgreSQL real',
          '        resource = "fechado"'].join('\n') },
        { tipo: 'texto', html:
          '<h3>Middleware e o pipeline</h3>' +
          '<p>O middleware envolve o processamento: o que vem antes de <code>call_next</code> roda na ida, o que vem depois roda na volta, e a ordem de registro importa. Este preserva o id do cliente só se for um UUID válido; confiar em qualquer header permitiria conteúdo arbitrário no log. Com um gateway confiável, a política de confiança precisa ser declarada. O <code>x-request-id</code> é a semente da observabilidade do M06: um request rastreável da borda ao banco.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'import time',
          'import uuid',
          'from fastapi import Request, Response',
          '',
          '@app.middleware("http")',
          'async def request_id_e_tempo(request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]',
          '    received = request.headers.get("x-request-id")',
          '    try:',
          '        rid = str(uuid.UUID(received)) if received else str(uuid.uuid4())',
          '    except ValueError:',
          '        rid = str(uuid.uuid4())',
          '    inicio = time.perf_counter()',
          '    response = await call_next(request)            # o resto da cebola',
          '    response.headers["x-request-id"] = rid',
          '    response.headers["x-elapsed-ms"] = f"{(time.perf_counter() - inicio) * 1000:.1f}"',
          '    return response'].join('\n') },
        { tipo: 'rode', id: 'b1-rode', titulo: 'Acompanhe um POST /links',
          enunciado: 'Rode a requisição e clique em cada etapa para ler só as linhas dela. Saída ilustrativa do fluxo do exemplo conceitual (as durações são só proporcionais).',
          prefixo: '$', entrada: CMD, unidade: 'u', terminalTitulo: 'POST /links', etapas: etapas(),
          prever: { pergunta: 'A URL é válida e o cliente não manda <code>x-request-id</code>. O que volta?', opcoes: [
            { id: 'a', texto: '201 com o LinkOut e os headers x-request-id e x-elapsed-ms.', correta: true, porque: 'a rota cria o recurso (201), response_model entrega só slug e url, e o middleware acrescenta os headers na volta.' },
            { id: 'b', texto: '200 com o dicionário interno inteiro.', correta: false, porque: 'o status é 201 por declaração, e o response_model impede que chave interna vaze.' },
            { id: 'c', texto: '201 sem headers: o middleware só atua quando há erro.', correta: false, porque: 'o middleware envolve toda requisição, na ida e na volta.' }
          ] },
          tutorAntes: 'Aperte Enter e depois clique em Schema e em Resposta para comparar o que cada etapa acrescenta.',
          tutorDepois: 'Quatro responsabilidades, em ordem: middleware (contexto), schema (representação), rota com dependência (aplicação) e resposta (contrato de saída). A conversão para <code>LinkOut</code> impede que uma chave interna do dicionário vaze por acidente.',
          callout: 'Você seguiu uma requisição da ida do middleware até a resposta.' },
        { tipo: 'takeaway', html: 'O <mark>middleware</mark> envolve a requisição; o <mark>schema</mark> barra antes da rota; a <mark>dependência</mark> entrega o recurso e a resposta sai pelo <mark>response_model</mark>.' }
      ] },

      { rotulo: 'Contrato HTTP', blocos: [
        { tipo: 'texto', html:
          '<h3>HTTP e REST: a reciclagem que o Swagger não faz por você</h3>' +
          '<p>O framework automatiza o transporte, não o <em>design</em>. Quatro pontos separam API sênior de API que funciona por acaso:</p>' +
          '<ul><li><strong>Verbos e idempotência.</strong> GET, PUT e DELETE são idempotentes (repetir dá o mesmo efeito); POST não. Retry automático do seu gateway (M05), do load balancer ou do agente (M08) só é seguro sobre operação idempotente. POST não idempotente sem chave de idempotência é a fonte da dupla cobrança do M12.</li>' +
          '<li><strong>Status como contrato.</strong> 400 (request malformado), 404 (não existe), 409 (conflito de estado), 422 (bem-formado, semanticamente inválido, o que o Pydantic devolve) e 500 (culpa sua) são coisas diferentes. Cliente e agente decidem retry e fallback pelo código; errar o código é quebrar o contrato de erro.</li>' +
          '<li><strong>Erro num formato só.</strong> Padronize com <code>exception_handler</code>, por exemplo RFC 9457 (Problem Details). É o fator 9 do M01 aplicado a HTTP.</li>' +
          '<li><strong>Versionamento.</strong> Campo novo opcional é seguro; remover ou renomear quebra. Somado ao <code>extra="forbid"</code> do M02, o contrato evolui sem sustos.</li></ul>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Semântica HTTP que o framework não escolhe</h3>' +
          '<table><thead><tr><th>Situação</th><th>Resposta deliberada</th><th>Decisão e limite</th></tr></thead><tbody>' +
          '<tr><td>criação aceita</td><td><code>201 Created</code> + representação</td><td>o recurso existe; a URL final pode entrar depois, quando o slug for estável</td></tr>' +
          '<tr><td>schema inválido</td><td><code>422 Unprocessable Content</code></td><td>a representação não atende ao schema; a forma do erro precisa ser documentada</td></tr>' +
          '<tr><td>slug ausente</td><td><code>404 Not Found</code> + Problem Detail</td><td>o endpoint é válido, aquele recurso não existe</td></tr>' +
          '<tr><td>colisão de slug</td><td><code>409 Conflict</code></td><td>o bloco 2 prova que a constraint do banco, não um <code>if</code> prévio, fecha a corrida</td></tr>' +
          '<tr><td>falha inesperada</td><td><code>5xx</code>, correlação e log seguro</td><td>não vazar stack trace nem segredo ao cliente; o diagnóstico detalhado fica do lado do operador</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: '422 não é política de negócio, e documentação não é autorização', html:
          '<p>O FastAPI devolve por padrão uma resposta estruturada quando a entrada não satisfaz o schema, mas isso não torna todo erro aderente à RFC 9457. Se a API adota Problem Details, defina esse formato explicitamente para erros de domínio e, quando necessário, de validação. Não prometa um contrato que o framework não foi configurado para entregar.</p>' +
          '<p>OpenAPI descreve que existe <code>POST /links</code>; não diz quem pode criá-lo, quanto pode criar nem se a URL é segura para o domínio. Autenticação, autorização, quota e auditoria entram no M12. Misturar esses controles ao schema produz uma API aparentemente validada que ainda aceita ação indevida.</p>' },
        { tipo: 'python', id: 'b1-python', titulo: 'Escreva o contrato de status e o request id', obrigatorio: false,
          enunciado: 'Complete <code>STATUS</code> e <code>status_para(situacao)</code> (situação desconhecida vira 500, sem detalhe) e <code>normalizar_request_id(recebido, gerar)</code>: preserva um UUID válido em minúsculas e chama <code>gerar()</code> para ausente, vazio ou inválido. Python puro, sem FastAPI.',
          codigo: b1Codigo, testes: b1Testes,
          dica: 'Use <code>STATUS.get(situacao, 500)</code>. Para o id: <code>str(uuid.UUID(recebido))</code> dentro de <code>try</code>, e <code>except ValueError</code> chama <code>gerar()</code>.',
          solucao: b1Solucao,
          tutorDepois: 'O mapa de status é uma tabela, não espalhada em ifs; e o header do cliente é entrada não confiável, como qualquer outra.',
          callout: 'Contrato de status e request id validados nos testes.' },
        { tipo: 'takeaway', html: 'O status é <mark>contrato</mark>: cada situação tem um código deliberado, e o header do cliente <mark>nunca chega ao log</mark> sem validação.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'complete', id: 'b1-complete-rota', titulo: 'Monte a rota de criação', obrigatorio: false, linguagem: 'python',
          enunciado: 'Escolha, em cada lacuna, a peça que faz o contrato dizer o que o bloco descreve: criação devolve 201, só slug e url saem, o corpo é o schema de entrada e o repositório vem por dependência.',
          partes: [
            '@app.post("/links", response_model=', { lacuna: 'rm', opcoes: ['LinkOut', 'LinkIn', 'dict'], correta: 'LinkOut' },
            ', status_code=', { lacuna: 'st', opcoes: ['status.HTTP_201_CREATED', 'status.HTTP_200_OK', 'status.HTTP_204_NO_CONTENT'], correta: 'status.HTTP_201_CREATED' },
            ')\nasync def criar_link(body: ', { lacuna: 'body', opcoes: ['LinkIn', 'LinkOut', 'Repo'], correta: 'LinkIn' },
            ', repo: ', { lacuna: 'repo', opcoes: ['Repo', 'get_repo', 'dict'], correta: 'Repo' },
            ') -> LinkOut:\n    ...\n\n@app.get("/links/{slug}", response_model=LinkOut)\nasync def obter_link(slug: str, repo: Repo) -> LinkOut:\n    if slug not in repo:\n        raise HTTPException(status_code=', { lacuna: 'nf', opcoes: ['404', '409', '500'], correta: '404' }, ', detail="slug não encontrado")\n    ...\n'
          ],
          explicacao: '<code>response_model=LinkOut</code> delimita a forma exposta; <code>LinkIn</code> no corpo faz o schema barrar antes da rota (422). O alias <code>Repo</code> carrega o <code>Depends</code>; passar <code>get_repo</code> como tipo seria entregar a função, não o repositório. Slug inexistente é 404: o endpoint é válido, o recurso não existe.',
          callout: 'Rota montada: 201, response_model de saída, schema de entrada e dependência por alias.' },
        { tipo: 'transcript', id: 'b1-transcript', titulo: 'Ache o que o relato não sustenta', obrigatorio: false, terminalTitulo: 'revisão da fronteira',
          enunciado: 'O agente revisa a fronteira HTTP do encurtador. Duas afirmações dele contradizem o que o bloco ensina. Clique nas linhas e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Revise a fronteira HTTP do encurtador antes de começarmos o banco.' },
            { quem: 'agente', texto: 'A rota devolve LinkOut e não a entidade interna; isso impede que uma chave interna vaze por acidente.' },
            { quem: 'ferramenta', texto: '$ curl -s -i -X POST localhost:8000/links -d \'{"url":"ftp://x.dev"}\'\nHTTP/1.1 422 Unprocessable Entity\nx-request-id: 9b1d6c0e-4c1c-4b8e-9a53-0d3f2a7c11aa' },
            { quem: 'agente', texto: 'O 422 sai antes de a função de rota rodar: é validação de representação, não decisão de negócio.' },
            { quem: 'agente', texto: 'O handler usa requests.get() dentro de async def para checar a URL. Como o FastAPI roda tudo em threads, as outras requisições não esperam.' },
            { quem: 'agente', texto: 'Repasso o x-request-id do cliente ao log exatamente como chegou, para o rastreio ficar fiel.' },
            { quem: 'agente', texto: 'Colisão de slug deve virar 409; a garantia real virá da constraint no bloco 2, não de um if.' }
          ],
          erradas: [4, 5],
          explicacao: {
            4: 'em <code>async def</code> o handler roda dentro do event loop; uma chamada bloqueante segura o loop inteiro daquele worker. Só handlers <code>def</code> comuns vão para threadpool. A saída é cliente assíncrono ou <code>def</code> síncrono.',
            5: 'confiar em qualquer header deixa o cliente escrever conteúdo arbitrário no log. O middleware do exemplo preserva o id só se for UUID válido e gera outro nos demais casos.'
          },
          tutorDepois: 'Os dois erros têm a mesma raiz: confiar no framework ou no cliente em vez de decidir.' },
        { tipo: 'escolha', id: 'b1-esc-bloqueio', titulo: 'Confira: a chamada bloqueante',
          pergunta: 'Um handler <code>async def</code> chama <code>requests.get()</code> (síncrono, 2 s) dentro do endpoint, com um único worker Uvicorn. O que acontece com as outras requisições?',
          opcoes: [
            { id: 'a', texto: 'Nada: o FastAPI roda cada handler em sua própria thread.', correta: false, porque: 'só vale para handlers <code>def</code> comuns, que o FastAPI roda em threadpool.' },
            { id: 'b', texto: 'São atendidas em paralelo, porque ASGI é assíncrono por definição.', correta: false, porque: 'ASGI descreve a interface e não cria paralelismo.' },
            { id: 'c', texto: 'Ficam esperando: a chamada bloqueante trava o event loop daquele worker durante os 2 s.', correta: true, porque: 'em <code>async def</code> você roda dentro do loop. A solução é cliente assíncrono ou <code>def</code> síncrono.' },
            { id: 'd', texto: 'O FastAPI detecta a chamada e a move para um pool de processos.', correta: false, porque: 'não existe detecção nem desvio automático.' }
          ], tutorDepois: 'Concorrência cooperativa: quem bloqueia, bloqueia todos no mesmo loop.' },
        { tipo: 'escolha', id: 'b1-esc-422', titulo: 'Confira: o status do schema inválido',
          pergunta: 'Um cliente envia <code>POST /links</code> com JSON bem-formado, mas <code>url</code> não respeita o pattern do schema. Qual resposta é a deliberada e por quê?',
          opcoes: [
            { id: 'a', texto: '400 Bad Request, porque o cliente errou o formato.', correta: false, porque: '400 fica para requisição malformada de fato.' },
            { id: 'b', texto: '422 com corpo de erro estruturado, porque a sintaxe é válida mas a representação não satisfaz o schema.', correta: true, porque: '422 é o que o Pydantic devolve; documente a forma do erro.' },
            { id: 'c', texto: '500, porque a validação falhou dentro do servidor.', correta: false, porque: 'validação de entrada nunca deve cair em 5xx.' },
            { id: 'd', texto: '409 Conflict, porque o estado enviado conflita com o contrato.', correta: false, porque: '409 é conflito com o estado do recurso, como slug repetido.' }
          ], tutorDepois: '4xx diz que o cliente pode corrigir; 5xx diz que a culpa é do servidor.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes deste bloco: documentação do FastAPI (dependencies, dependencies with yield, lifespan, async, OpenAPI), RFC 9110 e RFC 9457. Consultadas em 21/08/2026; documentação de framework deve ser revalidada em até 90 dias.</p>' },
        { tipo: 'takeaway', html: 'Valide a <mark>representação</mark> na borda, escolha o <mark>status</mark> de propósito e não deixe o <mark>event loop</mark> esperando I/O bloqueante.' }
      ] }
    ]
  });
})();
