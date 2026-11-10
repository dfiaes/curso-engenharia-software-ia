/* M03 · Bloco 6: integração honesta com PostgreSQL descartável. Fonte: M03.html#b06. Fontes consultadas em 13/09/2026 (Testcontainers) e 21/08/2026 (demais); revalidar em até 90 dias. Execução real exige Docker Engine; o python usa sqlite3 só para modelar o isolamento por transação-envelope. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var b6Codigo = [
    "import re",
    "import sqlite3",
    "from contextlib import contextmanager",
    "",
    "",
    "def novo_banco():",
    "    conn = sqlite3.connect(\":memory:\", isolation_level=None)",
    "    conn.execute(\"CREATE TABLE links (id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, url TEXT NOT NULL)\")",
    "    return conn",
    "",
    "",
    "@contextmanager",
    "def envelope(conn):",
    "    \"\"\"O teste roda dentro de uma transação que SEMPRE sofre rollback, passe ou falhe.\"\"\"",
    "    yield conn",
    "",
    "",
    "def post_links(conn, corpo):",
    "    \"\"\"O contrato HTTP contra o banco real. O slug vem no corpo (entrada explícita, sem sorteio).",
    "    Devolve (status, corpo): 201 criado, 409 slug em uso (vindo da constraint), 422 corpo inválido",
    "    (slug ausente ou url fora de ^https?://). Não faz commit: quem transaciona é o envelope.\"\"\"",
    "    conn.execute(\"INSERT INTO links (slug, url) VALUES (?, ?)\", (corpo[\"slug\"], corpo[\"url\"]))",
    "    return 201, {\"slug\": corpo[\"slug\"], \"url\": corpo[\"url\"]}",
    "",
    "",
    "def total(conn):",
    "    return conn.execute(\"SELECT COUNT(*) FROM links\").fetchone()[0]",
    "",
    "",
    "db = novo_banco()",
    "with envelope(db):",
    "    print(post_links(db, {\"slug\": \"abc\", \"url\": \"https://exemplo.dev\"}))",
    "print(total(db))"
  ].join('\n');
  var b6Testes = [
    "CORPO = {\"slug\": \"fixo\", \"url\": \"https://exemplo.dev\"}",
    "",
    "",
    "def test_criacao_e_duplicata():",
    "    db = novo_banco()",
    "    with envelope(db):",
    "        assert post_links(db, CORPO)[0] == 201",
    "        status, erro = post_links(db, CORPO)",
    "        assert status == 409",
    "",
    "",
    "def test_corpo_invalido_e_422_sem_tocar_o_banco():",
    "    db = novo_banco()",
    "    with envelope(db):",
    "        assert post_links(db, {\"url\": \"https://x.dev\"})[0] == 422",
    "        assert post_links(db, {\"slug\": \"a\", \"url\": \"ftp://x.dev\"})[0] == 422",
    "        assert post_links(db, {\"slug\": \"a\", \"url\": \"x\"})[0] == 422",
    "        assert total(db) == 0",
    "",
    "",
    "def test_isolamento_o_mesmo_slug_fixo_passa_em_dois_testes_seguidos():",
    "    db = novo_banco()",
    "    with envelope(db):",
    "        assert post_links(db, CORPO)[0] == 201",
    "    assert total(db) == 0",
    "    with envelope(db):",
    "        assert post_links(db, CORPO)[0] == 201",
    "",
    "",
    "def test_ordem_nao_importa():",
    "    def a(db):",
    "        assert post_links(db, CORPO)[0] == 201",
    "",
    "    def b(db):",
    "        assert total(db) == 0",
    "        assert post_links(db, CORPO)[0] == 201",
    "",
    "    for ordem in ((a, b), (b, a)):",
    "        db = novo_banco()",
    "        for teste in ordem:",
    "            with envelope(db):",
    "                teste(db)",
    "",
    "",
    "def test_rollback_tambem_quando_o_teste_falha():",
    "    db = novo_banco()",
    "    try:",
    "        with envelope(db):",
    "            post_links(db, CORPO)",
    "            raise AssertionError(\"teste que falha\")",
    "    except AssertionError:",
    "        pass",
    "    assert total(db) == 0",
    "    assert not db.in_transaction"
  ].join('\n');
  var b6Solucao = [
    "import re",
    "import sqlite3",
    "from contextlib import contextmanager",
    "",
    "",
    "def novo_banco():",
    "    conn = sqlite3.connect(\":memory:\", isolation_level=None)",
    "    conn.execute(\"CREATE TABLE links (id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, url TEXT NOT NULL)\")",
    "    return conn",
    "",
    "",
    "@contextmanager",
    "def envelope(conn):",
    "    conn.execute(\"BEGIN\")",
    "    try:",
    "        yield conn",
    "    finally:",
    "        conn.execute(\"ROLLBACK\")",
    "",
    "",
    "def post_links(conn, corpo):",
    "    slug, url = corpo.get(\"slug\"), corpo.get(\"url\")",
    "    if not slug or not url or not re.match(r\"^https?://\", url):",
    "        return 422, {\"detail\": \"corpo inválido\"}",
    "    try:",
    "        conn.execute(\"INSERT INTO links (slug, url) VALUES (?, ?)\", (slug, url))",
    "    except sqlite3.IntegrityError:",
    "        return 409, {\"detail\": \"slug em uso\"}",
    "    return 201, {\"slug\": slug, \"url\": url}",
    "",
    "",
    "def total(conn):",
    "    return conn.execute(\"SELECT COUNT(*) FROM links\").fetchone()[0]"
  ].join('\n');

  /* Modelo do envelope: não é saída do pytest. */
  var etapasEnvelope = function () {
    return [
      { id: 'a', nome: 'Teste A', descricao: 'Cria o slug fixo', tom: 'dns', ms: 2, linhas: [
        L('cmd', 'teste_criacao_e_busca'),
        L('info', 'BEGIN  (envelope)'),
        L('out', 'POST /links {"slug": "fixo", ...} -> 201'),
        L('info', 'ROLLBACK  (teardown, passe ou falhe)'),
        L('hint', 'o slug "fixo" deixou de existir no banco')] },
      { id: 'b', nome: 'Teste B', descricao: 'Cria o mesmo slug fixo', tom: 'tcp', ms: 2, linhas: [
        L('cmd', 'teste_duplicata'),
        L('info', 'BEGIN  (envelope)'),
        L('out', 'POST /links {"slug": "fixo", ...} -> 201'),
        L('out', 'POST /links {"slug": "fixo", ...} -> 409  (a constraint recusou o segundo)'),
        L('info', 'ROLLBACK'),
        L('hint', 'o mesmo slug passou nos dois testes, em qualquer ordem: isolamento')] },
      { id: 'sem', nome: 'Sem envelope', descricao: 'Resíduo de um teste no outro', tom: 'request', ms: 3, linhas: [
        L('cmd', 'mesmos testes, sem rollback'),
        L('out', 'Teste A: POST /links {"slug": "fixo"} -> 201 (a linha fica no banco)'),
        L('out', 'Teste B: POST /links {"slug": "fixo"} -> 409 (esperava 201)'),
        L('hint', 'passa sozinho, falha na suíte inteira: teste que depende de ordem é dívida')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm03-b6',
    titulo: 'Integração honesta: PostgreSQL descartável',
    minutos: 40,
    resumo: 'Constraint, transação, migration e JSON só existem no banco. Simular o ORM aprova o mock e deixa a constraint que faltava explodir em produção.',
    objetivo: 'Separar o que testa em unitário do que atravessa o banco, montar as três fixtures em camadas e provar isolamento por transação-envelope com determinismo por construção.',
    revisao: [
      { id: 'm03b6-honesta', pergunta: 'Qual é a regra do módulo para escolher entre teste unitário e teste de integração?',
        opcoes: [
          opc('a', 'Lógica pura em unitário; tudo que atravessa a fronteira do banco, contra PostgreSQL real, descartável e criado dentro do teste', true, 'simular o SQLAlchemy aprova o mock e deixa a constraint que faltava explodir em produção.'),
          opc('b', 'Tudo mockado, para a suíte ser rápida', false, 'mock de ORM não prova constraint, transação nem migration.'),
          opc('c', 'Tudo em integração, inclusive a combinatória de regras', false, 'a combinatória fica nos unitários; a pirâmide é de custo.')] },
      { id: 'm03b6-fixtures', pergunta: 'Quais são as três fixtures em camadas e o que cada uma entrega?',
        opcoes: [
          opc('a', '<code>pg_url</code> (container, 1x por sessão), <code>pg_factory</code> (schema por migration, engine descartado) e <code>pg_client</code> (API real com override de dependência)', true, 'o isolamento entre testes vem da transação-envelope, sem recriar schema a cada teste.'),
          opc('b', 'Uma fixture global com <code>create_all</code>', false, 'o schema nasce de migration, nunca de <code>create_all</code>.'),
          opc('c', 'Um banco novo por teste, sempre', false, 'subir custa segundos; sobe uma vez.')] },
      { id: 'm03b6-isolamento', pergunta: 'Um teste passa sozinho, mas falha com a suíte inteira porque outro deixou uma linha com o mesmo slug. Qual prática evita isso?',
        opcoes: [
          opc('a', 'Rodar cada teste dentro de uma transação-envelope com rollback no teardown, sobre PostgreSQL descartável com schema vindo de migration', true, 'isolamento é não depender de ordem nem de resíduo.'),
          opc('b', 'Rodar os testes em ordem alfabética', false, 'depender de ordem é o próprio defeito.'),
          opc('c', 'Usar slug aleatório em cada teste', false, 'aleatoriedade introduz instabilidade; o módulo prefere entrada explícita.')] },
      { id: 'm03b6-determinismo', pergunta: 'Quais são as três fontes de teste instável, e como o laboratório elimina duas?',
        opcoes: [
          opc('a', 'Relógio, aleatoriedade e rede; o slug é entrada explícita e nenhum teste depende da hora atual', true, 'teste instável é pior que ausência de teste, porque ensina a ignorar vermelho.'),
          opc('b', 'CPU, memória e disco', false, 'não são as fontes de instabilidade citadas.'),
          opc('c', 'Banco, API e fila', false, 'são componentes, não fontes de instabilidade.')] },
      { id: 'm03b6-interface', pergunta: 'Por que testar pela interface pública (o client HTTP) e não pelo repository por dentro?',
        opcoes: [
          opc('a', 'Refatoração interna (bloco 4) não deve quebrar teste; teste acoplado à implementação é âncora, não rede', true, 'o contrato testado é o da API.'),
          opc('b', 'Porque o repository não é testável', false, 'é testável; o ponto é o acoplamento.'),
          opc('c', 'Porque é mais rápido', false, 'o motivo é estabilidade sob refatoração.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O teste unitário prova a lógica pura. Mas constraint de unicidade, transação, migration e JSON no banco só existem <em>no banco</em>: simular o SQLAlchemy para "testá-los" aprova o mock e deixa a constraint que faltava explodir em produção. A regra do módulo: <strong>lógica pura testa com unitário; tudo que atravessa a fronteira do banco testa contra PostgreSQL de verdade, descartável e criado dentro do teste.</strong> O bloco 7 mostra que o CI executa a mesma suíte; este bloco define como ela é escrita.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Referência do conceito', html: '<p>O cliente ASGI exercita a aplicação sem abrir uma porta HTTP. O PostgreSQL descartável permite verificar SQL, constraints e concorrência no banco real. O primeiro mecanismo testa a fronteira da aplicação; o segundo verifica a integração com a persistência. <strong>Um não substitui o outro.</strong></p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Pré-requisitos e limite', html: '<p>Blocos 2 a 5 (migrations, constraints, Compose). A execução exige Docker Engine; sem ele, o contrato dos testes existe no lab e a execução fica bloqueada. A indisponibilidade do banco (erro observável com cleanup) tem oráculo parcial executável sem Docker.</p>' },
        { tipo: 'texto', html: '<h3>O que faz um teste de integração ser bom</h3>' },
        { tipo: 'abas', rotulo: 'Princípio', itens: [
          { rotulo: 'Isolamento', blocos: [{ tipo: 'texto', html: '<p>Teste não depende de ordem nem de resíduo de outro teste. Teste que só passa rodando a suíte inteira é dívida.</p>' }] },
          { rotulo: 'Determinismo', blocos: [{ tipo: 'texto', html: '<p><strong>Relógio, aleatoriedade e rede</strong> são as três fontes de teste instável. O laboratório elimina duas por construção: o slug é entrada explícita (nenhum gerador aleatório no caminho) e nenhum teste depende da hora atual. Teste instável é pior que ausência de teste, porque ensina a ignorar vermelho.</p>' }] },
          { rotulo: 'Interface pública', blocos: [{ tipo: 'texto', html: '<p>Chame a API (o client), não o repository por dentro: refatoração interna (bloco 4) não deve quebrar teste. Teste acoplado à implementação é âncora, não rede.</p>' }] },
          { rotulo: 'Pirâmide', blocos: [{ tipo: 'texto', html: '<p>Integração cobre fluxos e fronteiras; a combinatória de regras fica nos unitários. Uma suíte de integração que ninguém roda porque demora protege menos que uma rápida que roda em todo commit.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'Lógica pura vai para o <mark>unitário</mark>; o que atravessa o banco vai para <mark>PostgreSQL real e descartável</mark>; <mark>mock de ORM</mark> não prova integração.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>A fundação: três fixtures em camadas</h3>' +
          '<p>Exemplo de referência; a cópia executável vive em <code>tests/conftest.py</code> do laboratório e exige Docker Engine.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '# tests/conftest.py (referência; execução exige Docker Engine)',
          'import pytest',
          'from testcontainers.postgres import PostgresContainer',
          'from link_shortener.db import create_engine, session_factory',
          '',
          '@pytest.fixture(scope="session")',
          'def pg_url():',
          '    """Um Postgres para a SESSÃO inteira (subir custa segundos; sobe 1x)."""',
          '    with PostgresContainer("postgres:16") as pg:',
          '        yield pg.get_connection_url().replace("psycopg2", "asyncpg")',
          '',
          '@pytest.fixture',
          'async def pg_factory(pg_url):',
          '    """Schema via MIGRATION (nunca create_all), engine descartado no teardown."""',
          '    from alembic.config import Config',
          '    from alembic import command',
          '    cfg = Config("alembic.ini")',
          '    command.upgrade(cfg, "head")          # APP_DATABASE_URL aponta ao container',
          '    engine = create_engine(pg_url)',
          '    try:',
          '        yield session_factory(engine)',
          '    finally:',
          '        await engine.dispose()',
          '',
          '@pytest.fixture',
          'async def pg_client(pg_factory):',
          '    """API real com o banco de teste injetado via dependency_overrides."""',
          '    from httpx import ASGITransport, AsyncClient',
          '    from link_shortener.api.app import create_app',
          '    from link_shortener.api.deps import get_request_session',
          '    app = create_app(pg_factory)',
          '    async def override():',
          '        async with pg_factory() as session:',
          '            yield session',
          '            await session.commit()',
          '    app.dependency_overrides[get_request_session] = override',
          '    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:',
          '        yield c',
          '    app.dependency_overrides.clear()'].join('\n') },
        { tipo: 'texto', html: '<p>A arquitetura: <code>pg_url</code> é caro e compartilhado pela sessão; o schema é criado uma vez por migration; cada teste recebe fábrica e cliente sobre o banco descartável; o teardown descarta o engine. O isolamento entre testes vem da <strong>transação-envelope</strong>: o teste roda dentro de uma transação que sofre rollback no teardown, sem recriar schema a cada teste. O cliente injeta a sessão de teste na API real via <code>dependency_overrides</code>.</p>' },
        { tipo: 'ordene', id: 'b6-ordene-fixtures', titulo: 'Ponha o ciclo de vida das fixtures na ordem', obrigatorio: false,
          enunciado: 'Ordene do que acontece primeiro ao último numa suíte com PostgreSQL descartável.',
          itens: [
            { id: 'client', texto: 'O cliente ASGI recebe o override de dependência e atende o teste' },
            { id: 'container', texto: 'O container PostgreSQL sobe (uma vez, escopo de sessão)' },
            { id: 'dispose', texto: 'Teardown: o envelope sofre rollback e o engine é descartado' },
            { id: 'migrar', texto: 'O schema nasce por <code>alembic upgrade head</code>' },
            { id: 'engine', texto: 'O engine e a fábrica de sessões são criados sobre a URL do container' }
          ], solucao: ['container', 'migrar', 'engine', 'client', 'dispose'],
          tutorDepois: 'O caro (container) sobe uma vez; o barato (envelope e cliente) se refaz por teste. É isso que permite isolar sem lentidão.',
          callout: 'Ciclo na ordem: container, migration, engine, cliente com override, teardown.' },
        { tipo: 'rode', id: 'b6-rode-envelope', titulo: 'Dois testes, o mesmo slug fixo',
          enunciado: 'Modelo do bloco (não é saída do pytest). Rode e clique em cada etapa, inclusive na que roda sem envelope.',
          prefixo: '$', entrada: 'pytest -q -m postgres', unidade: 'u', terminalTitulo: 'isolamento por envelope', etapas: etapasEnvelope(),
          prever: { pergunta: 'Dois testes criam o mesmo slug fixo, um depois do outro, cada um dentro do envelope. O segundo recebe qual status na primeira criação?', opcoes: [
            { id: 'a', texto: '201: o rollback do envelope apagou a linha do primeiro teste.', correta: true, porque: 'cada teste começa com o banco como o schema o deixou, sem resíduo.' },
            { id: 'b', texto: '409: a linha do primeiro teste continua lá.', correta: false, porque: 'isso é o que acontece sem envelope, e é o defeito que ele evita.' },
            { id: 'c', texto: '422: o slug é reservado.', correta: false, porque: '422 é de validação de representação.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em "Teste B" e em "Sem envelope".',
          tutorDepois: 'Com envelope o mesmo slug passa nos dois testes, em qualquer ordem. Sem ele, o segundo falha por resíduo: passa sozinho, quebra na suíte inteira.',
          callout: 'Você viu o envelope dar isolamento e a falta dele dar dependência de ordem.' },
        { tipo: 'texto', html:
          '<h3>O que cada teste de integração prova</h3>' +
          '<ul><li><strong>Contrato HTTP contra persistência real:</strong> criação e busca pela API (201/200), inexistente (404), URL inválida (422), duplicata (409).</li>' +
          '<li><strong>Isolamento:</strong> dois testes criam o mesmo slug fixo em sequência e ambos passam, porque o rollback do envelope apagou o primeiro antes do segundo.</li>' +
          '<li><strong>Lost update resolvido:</strong> N increments concorrentes, com sessões próprias, totalizam exatamente N no update atômico.</li>' +
          '<li><strong>Migration como setup:</strong> o schema do banco de teste nasce de <code>alembic upgrade head</code>, então a suíte quebra se uma revision estiver inconsistente.</li></ul>' },
        { tipo: 'takeaway', html: 'Container <mark>uma vez por sessão</mark>, schema por <mark>migration</mark>, isolamento por <mark>transação-envelope</mark> e cliente com <mark>override</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b6-python', titulo: 'Escreva o envelope e o contrato de criação', obrigatorio: false,
          enunciado: 'Com <code>sqlite3</code> como equivalente didático, implemente <code>envelope(conn)</code> (BEGIN; rollback sempre no fim, passe ou falhe) e <code>post_links(conn, corpo)</code> (201, 409 vindo da constraint ou 422 para corpo inválido, sem commit). O teste de ordem roda os mesmos passos nas duas ordens.',
          codigo: b6Codigo, testes: b6Testes,
          dica: 'Envelope: <code>BEGIN</code>, <code>try: yield conn</code>, <code>finally: ROLLBACK</code>. Em <code>post_links</code>: valide antes (slug e url presentes, <code>re.match(r"^https?://", url)</code>), depois <code>try</code> no INSERT e <code>except sqlite3.IntegrityError</code> devolve 409.',
          solucao: b6Solucao,
          tutorDepois: 'O 409 vem da constraint, não de um SELECT prévio, e o envelope garante que o mesmo slug fixo passe em qualquer ordem. Sem aleatoriedade nem relógio no caminho, o resultado é o mesmo toda vez.',
          callout: 'Envelope e contrato de criação passaram, nas duas ordens de execução.' },
        { tipo: 'cenario', id: 'b6-cenario', titulo: 'Passa sozinho, falha na suíte', obrigatorio: false,
          enunciado: 'Um teste de integração passa sozinho, mas falha quando a suíte inteira roda: outro teste deixou uma linha com o mesmo slug. A suíte está lenta, e alguém sugere mockar o SQLAlchemy. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Como você remove o resíduo entre testes?', opcoes: [
              { texto: 'Rodar os testes em ordem alfabética.', vai: 'f-ordem', tom: 'ruim', consequencia: 'a suíte passa a depender de ordem, que é o defeito.' },
              { texto: 'Usar slug aleatório em cada teste.', vai: 'f-random', tom: 'ruim', consequencia: 'o resíduo some, e entra uma fonte de instabilidade que o módulo evita.' },
              { texto: 'Envelope: cada teste roda numa transação com rollback no teardown, sobre o PostgreSQL descartável.', vai: 'mock', tom: 'ok', consequencia: 'isolamento sem recriar o schema a cada teste.' }
            ] },
            mock: { texto: 'A suíte continua lenta. A proposta é mockar o SQLAlchemy nos testes que tocam o banco. O que você decide?', opcoes: [
              { texto: 'Mockar: o mock é mais rápido e passa igual.', vai: 'f-mock', tom: 'ruim', consequencia: 'o mock aprova a si mesmo; a constraint que faltava só aparece em produção.' },
              { texto: 'Manter lógica pura em unitário e deixar em integração só o que atravessa o banco; subir o container uma vez por sessão.', vai: 'f-bom', tom: 'ok', consequencia: 'a suíte fica rápida sem mentir sobre o banco.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Isolamento por envelope, pirâmide respeitada e prova no banco real onde ele importa.' },
            'f-ordem': { bom: false, texto: 'Um teste novo fora de ordem quebrou a suíte inteira, e ninguém soube por quê.' },
            'f-random': { bom: false, texto: 'Uma colisão aleatória ocasional passou a derrubar o CI, e o time aprendeu a ignorar vermelho.' },
            'f-mock': { bom: false, texto: 'A suíte ficou verde e a duplicata de slug explodiu em produção: o mock não tinha constraint.' }
          },
          callout: 'Você isolou por envelope e manteve a prova no banco real.' },
        { tipo: 'escolha', id: 'b6-esc-isolamento', titulo: 'Confira: o resíduo entre testes',
          pergunta: 'Um teste de integração passa sozinho, mas falha quando a suíte inteira roda, porque outro teste deixou uma linha com o mesmo slug. Qual prática do módulo evita isso?',
          opcoes: [
            { id: 'a', texto: 'Rodar sempre os testes em ordem alfabética.', correta: false, porque: 'depender de ordem é o próprio defeito.' },
            { id: 'b', texto: 'Mockar o SQLAlchemy para não tocar o banco.', correta: false, porque: 'o mock aprova o mock e deixa a constraint real sem prova.' },
            { id: 'c', texto: 'Usar um slug aleatório com <code>random</code> em cada teste.', correta: false, porque: 'aleatoriedade introduz instabilidade; o módulo prefere entrada explícita.' },
            { id: 'd', texto: 'Rodar cada teste dentro de uma transação-envelope que sofre rollback no teardown, sobre PostgreSQL descartável com schema vindo de migration.', correta: true, porque: 'isolamento significa não depender de ordem nem de resíduo; o envelope desfaz tudo ao final de cada teste.' }
          ], tutorDepois: 'Isolamento é propriedade do desenho do teste, não da ordem.' },
        { tipo: 'escolha', id: 'b6-esc-fronteira', titulo: 'Confira: o que vai para integração',
          pergunta: 'Qual destes comportamentos <strong>precisa</strong> de teste de integração contra o PostgreSQL, em vez de unitário?',
          opcoes: [
            { id: 'a', texto: 'A validação de que a URL começa com <code>http://</code> ou <code>https://</code>.', correta: false, porque: 'é lógica pura de fronteira; testa em unitário.' },
            { id: 'b', texto: 'Que o slug duplicado vira 409 por causa da constraint UNIQUE.', correta: true, porque: 'constraint, transação, migration e JSON só existem no banco; simular o ORM aprova o mock.' },
            { id: 'c', texto: 'Que o mapa de situações para status HTTP devolve 422 para schema inválido.', correta: false, porque: 'também é lógica pura, sem fronteira de banco.' }
          ], tutorDepois: 'A pergunta que decide: isto atravessa a fronteira do banco?' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes deste bloco: Testcontainers for Python (consultado em 13/09/2026), documentação do SQLAlchemy asyncio e Alembic cookbook (21/08/2026). Documentação de ferramenta deve ser revalidada em até 90 dias.</p>' },
        { tipo: 'takeaway', html: 'Concorrência se testa com <mark>sessões próprias</mark> e <mark>total exato</mark>; determinismo por construção: <mark>entradas explícitas</mark>, sem relógio nem aleatoriedade.' }
      ] }
    ]
  });
})();
