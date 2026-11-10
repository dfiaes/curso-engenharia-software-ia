/* M03 · Bloco 2: sessão, transação e migration. Fonte: M03.html#b02. Fontes consultadas em 21/08/2026 (revalidar em até 90 dias). Exemplos SQLAlchemy/Alembic são conceituais; os python desta aula usam sqlite3 da biblioteca padrão. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var b2uCodigo = [
    "import sqlite3",
    "from contextlib import contextmanager",
    "",
    "",
    "class SlugEmUso(Exception):",
    "    pass",
    "",
    "",
    "def novo_banco(unico=True):",
    "    conn = sqlite3.connect(\":memory:\", isolation_level=None)  # transação só quando você pedir",
    "    coluna = \"slug TEXT NOT NULL UNIQUE\" if unico else \"slug TEXT NOT NULL\"",
    "    conn.execute(f\"CREATE TABLE links (id INTEGER PRIMARY KEY, {coluna}, url TEXT NOT NULL)\")",
    "    return conn",
    "",
    "",
    "@contextmanager",
    "def unidade_de_trabalho(conn):",
    "    \"\"\"Commit no sucesso, rollback no erro; a exceção continua subindo.\"\"\"",
    "    yield conn",
    "",
    "",
    "def criar_link(conn, slug, url):",
    "    \"\"\"Só INSERT: quem recusa o duplicado é a constraint; traduza o erro dela para SlugEmUso.\"\"\"",
    "    conn.execute(\"INSERT INTO links (slug, url) VALUES (?, ?)\", (slug, url))",
    "",
    "",
    "def criar_link_ingenuo(conn, slug, url, entre=lambda: None):",
    "    \"\"\"O 'if exists' do pior caso: checa, outro request escreve (entre), depois insere.\"\"\"",
    "    if conn.execute(\"SELECT 1 FROM links WHERE slug = ?\", (slug,)).fetchone():",
    "        raise SlugEmUso(slug)",
    "    entre()",
    "    conn.execute(\"INSERT INTO links (slug, url) VALUES (?, ?)\", (slug, url))",
    "",
    "",
    "def total(conn):",
    "    return conn.execute(\"SELECT COUNT(*) FROM links\").fetchone()[0]",
    "",
    "",
    "db = novo_banco()",
    "with unidade_de_trabalho(db):",
    "    criar_link(db, \"abc\", \"https://exemplo.dev\")",
    "print(total(db))"
  ].join('\n');
  var b2uTestes = [
    "def test_commit_no_sucesso():",
    "    db = novo_banco()",
    "    with unidade_de_trabalho(db):",
    "        criar_link(db, \"a\", \"https://x.dev\")",
    "        criar_link(db, \"b\", \"https://y.dev\")",
    "    assert total(db) == 2",
    "    assert not db.in_transaction",
    "",
    "",
    "def test_duplicata_vira_slug_em_uso_pela_constraint():",
    "    db = novo_banco()",
    "    criar_link(db, \"a\", \"https://x.dev\")",
    "    try:",
    "        criar_link(db, \"a\", \"https://z.dev\")",
    "    except SlugEmUso:",
    "        pass",
    "    else:",
    "        raise AssertionError(\"esperava SlugEmUso\")",
    "    assert total(db) == 1",
    "",
    "",
    "def test_erro_no_meio_desfaz_tudo_e_propaga():",
    "    db = novo_banco()",
    "    try:",
    "        with unidade_de_trabalho(db):",
    "            criar_link(db, \"a\", \"https://x.dev\")",
    "            criar_link(db, \"a\", \"https://dup.dev\")",
    "    except SlugEmUso:",
    "        pass",
    "    else:",
    "        raise AssertionError(\"a exceção deve continuar subindo\")",
    "    assert total(db) == 0",
    "    assert not db.in_transaction",
    "",
    "",
    "def test_excecao_qualquer_tambem_faz_rollback():",
    "    db = novo_banco()",
    "    try:",
    "        with unidade_de_trabalho(db):",
    "            criar_link(db, \"a\", \"https://x.dev\")",
    "            raise RuntimeError(\"falha do service\")",
    "    except RuntimeError:",
    "        pass",
    "    assert total(db) == 0",
    "",
    "",
    "def test_controle_negativo_checagem_previa_tem_janela():",
    "    # sem constraint, o if exists deixa as duas passarem: este é o defeito que a constraint fecha",
    "    db = novo_banco(unico=False)",
    "    criar_link_ingenuo(db, \"a\", \"https://1.dev\", entre=lambda: db.execute(",
    "        \"INSERT INTO links (slug, url) VALUES ('a', 'https://outro-request.dev')\"))",
    "    assert total(db) == 2"
  ].join('\n');
  var b2uSolucao = [
    "import sqlite3",
    "from contextlib import contextmanager",
    "",
    "",
    "class SlugEmUso(Exception):",
    "    pass",
    "",
    "",
    "def novo_banco(unico=True):",
    "    conn = sqlite3.connect(\":memory:\", isolation_level=None)  # transação só quando você pedir",
    "    coluna = \"slug TEXT NOT NULL UNIQUE\" if unico else \"slug TEXT NOT NULL\"",
    "    conn.execute(f\"CREATE TABLE links (id INTEGER PRIMARY KEY, {coluna}, url TEXT NOT NULL)\")",
    "    return conn",
    "",
    "",
    "@contextmanager",
    "def unidade_de_trabalho(conn):",
    "    conn.execute(\"BEGIN\")",
    "    try:",
    "        yield conn",
    "    except Exception:",
    "        conn.execute(\"ROLLBACK\")",
    "        raise",
    "    else:",
    "        conn.execute(\"COMMIT\")",
    "",
    "",
    "def criar_link(conn, slug, url):",
    "    try:",
    "        conn.execute(\"INSERT INTO links (slug, url) VALUES (?, ?)\", (slug, url))",
    "    except sqlite3.IntegrityError as exc:",
    "        raise SlugEmUso(slug) from exc",
    "",
    "",
    "def criar_link_ingenuo(conn, slug, url, entre=lambda: None):",
    "    if conn.execute(\"SELECT 1 FROM links WHERE slug = ?\", (slug,)).fetchone():",
    "        raise SlugEmUso(slug)",
    "    entre()",
    "    conn.execute(\"INSERT INTO links (slug, url) VALUES (?, ?)\", (slug, url))",
    "",
    "",
    "def total(conn):",
    "    return conn.execute(\"SELECT COUNT(*) FROM links\").fetchone()[0]"
  ].join('\n');
  var b2mCodigo = [
    "import sqlite3",
    "",
    "# (id, upgrade, downgrade): a cadeia de revisions, da mais antiga para a mais nova",
    "REVISOES = [",
    "    (\"0001\", \"CREATE TABLE links (id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, url TEXT NOT NULL)\",",
    "             \"DROP TABLE links\"),",
    "    (\"0002\", \"ALTER TABLE links ADD COLUMN hits INTEGER NOT NULL DEFAULT 0\",",
    "             \"ALTER TABLE links DROP COLUMN hits\"),",
    "]",
    "",
    "",
    "def versao_atual(conn):",
    "    conn.execute(\"CREATE TABLE IF NOT EXISTS alembic_version (v TEXT)\")",
    "    linha = conn.execute(\"SELECT v FROM alembic_version\").fetchone()",
    "    return linha[0] if linha else \"base\"",
    "",
    "",
    "def migrar(conn, destino):",
    "    \"\"\"destino: 'head', 'base' ou o id de uma revision. Sobe aplicando upgrade em ordem;",
    "    desce aplicando downgrade na ordem inversa; grava a versão atual em alembic_version.",
    "    Destino desconhecido: ValueError, sem tocar no banco.\"\"\"",
    "    atual = versao_atual(conn)",
    "",
    "",
    "def colunas(conn):",
    "    return [c[1] for c in conn.execute(\"PRAGMA table_info(links)\")]",
    "",
    "",
    "db = sqlite3.connect(\":memory:\", isolation_level=None)",
    "migrar(db, \"head\")",
    "print(versao_atual(db), colunas(db))"
  ].join('\n');
  var b2mTestes = [
    "def novo():",
    "    return sqlite3.connect(\":memory:\", isolation_level=None)",
    "",
    "",
    "def test_upgrade_head_cria_o_schema():",
    "    db = novo()",
    "    migrar(db, \"head\")",
    "    assert versao_atual(db) == \"0002\"",
    "    assert colunas(db) == [\"id\", \"slug\", \"url\", \"hits\"]",
    "",
    "",
    "def test_upgrade_preserva_os_dados_com_default():",
    "    db = novo()",
    "    migrar(db, \"0001\")",
    "    db.execute(\"INSERT INTO links (slug, url) VALUES ('a', 'https://x.dev')\")",
    "    migrar(db, \"head\")",
    "    assert db.execute(\"SELECT slug, hits FROM links\").fetchall() == [(\"a\", 0)]",
    "",
    "",
    "def test_downgrade_desfaz_na_ordem_inversa():",
    "    db = novo()",
    "    migrar(db, \"head\")",
    "    migrar(db, \"0001\")",
    "    assert versao_atual(db) == \"0001\"",
    "    assert colunas(db) == [\"id\", \"slug\", \"url\"]",
    "    migrar(db, \"base\")",
    "    assert versao_atual(db) == \"base\"",
    "    assert colunas(db) == []",
    "",
    "",
    "def test_ida_e_volta_completa():",
    "    db = novo()",
    "    migrar(db, \"head\")",
    "    migrar(db, \"base\")",
    "    migrar(db, \"head\")",
    "    assert versao_atual(db) == \"0002\"",
    "",
    "",
    "def test_head_duas_vezes_nao_repete_nada():",
    "    db = novo()",
    "    migrar(db, \"head\")",
    "    migrar(db, \"head\")",
    "    assert colunas(db) == [\"id\", \"slug\", \"url\", \"hits\"]",
    "",
    "",
    "def test_destino_desconhecido_nao_toca_o_banco():",
    "    db = novo()",
    "    migrar(db, \"0001\")",
    "    try:",
    "        migrar(db, \"9999\")",
    "    except ValueError:",
    "        pass",
    "    else:",
    "        raise AssertionError(\"esperava ValueError\")",
    "    assert versao_atual(db) == \"0001\""
  ].join('\n');
  var b2mSolucao = [
    "import sqlite3",
    "",
    "REVISOES = [",
    "    (\"0001\", \"CREATE TABLE links (id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, url TEXT NOT NULL)\",",
    "             \"DROP TABLE links\"),",
    "    (\"0002\", \"ALTER TABLE links ADD COLUMN hits INTEGER NOT NULL DEFAULT 0\",",
    "             \"ALTER TABLE links DROP COLUMN hits\"),",
    "]",
    "",
    "",
    "def versao_atual(conn):",
    "    conn.execute(\"CREATE TABLE IF NOT EXISTS alembic_version (v TEXT)\")",
    "    linha = conn.execute(\"SELECT v FROM alembic_version\").fetchone()",
    "    return linha[0] if linha else \"base\"",
    "",
    "",
    "def migrar(conn, destino):",
    "    ids = [\"base\"] + [r[0] for r in REVISOES]",
    "    alvo = ids[-1] if destino == \"head\" else destino",
    "    if alvo not in ids:",
    "        raise ValueError(f\"revision desconhecida: {destino}\")",
    "    atual = versao_atual(conn)",
    "    i, j = ids.index(atual), ids.index(alvo)",
    "    if i < j:",
    "        for _, up, _down in REVISOES[i:j]:",
    "            conn.execute(up)",
    "    else:",
    "        for _, _up, down in reversed(REVISOES[j:i]):",
    "            conn.execute(down)",
    "    conn.execute(\"DELETE FROM alembic_version\")",
    "    if alvo != \"base\":",
    "        conn.execute(\"INSERT INTO alembic_version (v) VALUES (?)\", (alvo,))",
    "",
    "",
    "def colunas(conn):",
    "    return [c[1] for c in conn.execute(\"PRAGMA table_info(links)\")]"
  ].join('\n');

  /* Fórmula do simulador de pool do módulo: ondas = ceil(n/c); espera do último = (ondas-1)*t; vazão = round(c/(t/1000)). */
  var etapasPool = function () {
    return [
      { id: 'base', nome: 'Pool saudável', descricao: '40 requests, 15 conexões, 50 ms cada', tom: 'dns', ms: 100, linhas: [
        L('out', 'Vazão máxima do pool: ~300 requests/s por worker.'),
        L('out', 'Espera do último da fila: ~100 ms (3 "ondas" de atendimento).'),
        L('out', 'Conexões abertas no total: 15 (1 workers x 15) contra max_connections=100.'),
        L('hint', 'conexão presa por pouco tempo: a fila se resolve em duas ondas curtas')] },
      { id: 'lenta', nome: 'Chamada lenta dentro da transação', descricao: '+8000 ms com a conexão presa', tom: 'tcp', ms: 8050, linhas: [
        L('cmd', 'simulador --n 40 --pool 15 --ms 50 --lenta-8000 --workers 1'),
        L('out', 'Vazão máxima do pool: ~2 requests/s por worker.'),
        L('out', 'Espera do último da fila: ~16100 ms (3 "ondas" de atendimento).'),
        L('out', 'Atenção: p99 de pelo menos 16100 ms só de espera por conexão.'),
        L('hint', 'Lição: a chamada lenta dentro da transação multiplicou o tempo de posse da conexão. Transacione só a gravação.')] },
      { id: 'workers', nome: 'Mais workers', descricao: '8 workers x 15 conexões', tom: 'tls', ms: 120, linhas: [
        L('cmd', 'simulador --n 40 --pool 15 --ms 50 --workers 8'),
        L('out', 'Conexões abertas no total: 120 (8 workers x 15) contra max_connections=100.'),
        L('out', 'ALERTA: 120 conexões ultrapassam o max_connections do Postgres; o banco recusa novas conexões.'),
        L('hint', 'o pool é por processo: workers multiplicam as conexões')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm03-b2',
    titulo: 'Sessão, transação e migration',
    minutos: 45,
    resumo: 'O dicionário em memória perde dado, aceita slug duplicado e não evolui. Transação, constraint e migration resolvem cada falha, e nenhuma delas mora no framework HTTP.',
    objetivo: 'Descrever o ciclo de vida de uma sessão por request, explicar por que a constraint e não um if fecha a corrida de slug, dimensionar o pool e conduzir uma migration com volta declarada.',
    revisao: [
      { id: 'm03b2-escopo', pergunta: 'Qual é o escopo correto de engine, pool e sessão numa API com SQLAlchemy assíncrono?',
        opcoes: [
          opc('a', 'Engine e pool por processo; uma <code>AsyncSession</code> curta por request, nunca compartilhada entre tarefas', true, 'compartilhar sessão entre tarefas concorrentes corrompe a unidade de trabalho.'),
          opc('b', 'Uma sessão global reutilizada por todos os requests', false, 'mistura unidades de trabalho de requests distintos e falha sob concorrência.'),
          opc('c', 'Um engine novo a cada request', false, 'abrir conexão TCP+TLS a cada request seria o custo dominante.')] },
      { id: 'm03b2-constraint', pergunta: 'Dois requests criam o mesmo slug ao mesmo tempo, e a rota faz SELECT e depois INSERT sem constraint. Qual é o resultado provável?',
        opcoes: [
          opc('a', 'Ambos passam pela checagem e ambos inserem; só a constraint UNIQUE fecha a janela', true, 'em READ COMMITTED nenhuma transação vê a escrita da outra antes do commit.'),
          opc('b', 'A segunda falha com 409 automaticamente', false, '409 só existe se você traduzir o <code>IntegrityError</code> de uma constraint.'),
          opc('c', 'O PostgreSQL serializa as duas sem precisar de constraint', false, 'o padrão é READ COMMITTED, que não serializa isso.')] },
      { id: 'm03b2-pool', pergunta: 'Uma rota abre transação, chama um modelo (8 s) e só então grava. Sob carga: <code>QueuePool limit reached</code>. Qual é a correção?',
        opcoes: [
          opc('a', 'Chamar o modelo fora da transação e transacionar só a gravação', true, 'a conexão fica presa durante I/O externo; transacione o banco, nunca o workflow.'),
          opc('b', 'Aumentar <code>max_connections</code> sempre', false, 'só adia a falha.'),
          opc('c', 'Usar uma sessão global', false, 'corrompe a unidade de trabalho.')] },
      { id: 'm03b2-greenlet', pergunta: 'O que o erro <code>MissingGreenlet</code> sinaliza num mapeamento assíncrono?',
        opcoes: [
          opc('a', 'Acesso a um relacionamento não carregado; a consulta deve declarar o carregamento, por exemplo com <code>selectinload</code>', true, 'o ORM não faz I/O bloqueante no meio do event loop, então o custo vira decisão escrita na query.'),
          opc('b', 'Falta de índice na tabela', false, 'o erro vem do carregamento, não do plano.'),
          opc('c', 'Pool esgotado', false, 'pool esgotado aparece como <code>QueuePool limit reached</code>.')] },
      { id: 'm03b2-alembic', pergunta: 'Quais regras separam uma migration revisada de um incidente futuro?',
        opcoes: [
          opc('a', 'Autogenerate é rascunho revisado, todo upgrade tem downgrade testado, destrutivo em duas releases e nunca <code>create_all</code> em produção', true, 'rollback de deploy depende do downgrade, e <code>create_all</code> cria schema sem histórico e sem volta.'),
          opc('b', 'Confiar no autogenerate sem revisar', false, 'ele erra rename (vê drop+add), não vê mudança de <code>server_default</code> e não escreve backfill.'),
          opc('c', 'Remover a coluna na mesma release em que o código para de usá-la', false, 'a remoção destrutiva fica numa segunda release.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Três falhas que só o banco resolve</h3>' +
          '<p>O dicionário em memória do bloco 1 perde tudo ao reiniciar, aceita o mesmo slug duas vezes se dois requests chegarem juntos e não tem resposta para "a tabela precisa de uma coluna nova sem apagar as linhas". Cada sintoma aponta para um mecanismo distinto: a <strong>transação</strong> delimita o que é confirmado junto e desfaz o que falhou no meio; a <strong>constraint</strong> proíbe o estado inválido mesmo sob concorrência; a <strong>migration</strong> versiona a evolução do schema com volta declarada. Nenhum dos três vive no framework HTTP; todos vivem entre a aplicação e o PostgreSQL, mediados pelo SQLAlchemy.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Pré-requisitos', html: '<p>Bloco 1 (Depends com yield, correlation id) e M02 (Pydantic na fronteira, asyncio cooperativo, testes com caminho feliz e falha). Este bloco é leitura com exemplos rotulados; os comandos executáveis estão no laboratório guiado, depois do bloco 8.</p>' },
        { tipo: 'texto', html: '<h3>Vocabulário mínimo</h3><p>Seis termos, definidos aqui porque são usados aqui.</p>' },
        { tipo: 'abas', rotulo: 'Termo', itens: [
          { rotulo: 'Engine', blocos: [{ tipo: 'texto', html: '<p>O objeto que guarda o <strong>pool</strong> de conexões com o banco. É um singleton do processo, criado uma vez no startup.</p>' }] },
          { rotulo: 'Pool', blocos: [{ tipo: 'texto', html: '<p>O conjunto de conexões abertas e reutilizáveis. Abrir conexão TCP+TLS a cada request seria o custo dominante da API.</p>' }] },
          { rotulo: 'Sessão', blocos: [{ tipo: 'texto', html: '<p><code>AsyncSession</code> é a unidade de trabalho de um fluxo: guarda os objetos tocados, acumula alterações e as envia dentro de uma transação. <code>session.add</code> registra um objeto; <code>flush</code> envia as alterações dentro da transação aberta sem confirmá-la. Nunca é compartilhada por tarefas concorrentes.</p>' }] },
          { rotulo: 'Transação', blocos: [{ tipo: 'texto', html: '<p>O bloco atômico: tudo confirma (<code>commit</code>) ou tudo desfaz (<code>rollback</code>).</p>' }] },
          { rotulo: 'Migration', blocos: [{ tipo: 'texto', html: '<p>Script versionado com <code>upgrade</code> e <code>downgrade</code>. O Alembic registra a evolução do schema em <em>revisions</em> encadeadas.</p>' }] },
          { rotulo: 'Constraint', blocos: [{ tipo: 'texto', html: '<p>Regra gravada no schema (<code>UNIQUE</code>, chave estrangeira) que o banco impõe a toda escrita, venha de onde vier.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Atomicidade, consistência e isolamento</h3>' +
          '<ul><li><strong>Atomicidade</strong> é o commit/rollback da dependência: ou todas as escritas do request confirmam, ou nenhuma. <strong>Durabilidade</strong> é garantia do PostgreSQL após o commit. As duas que exigem decisão sua são consistência e isolamento.</li>' +
          '<li><strong>Consistência mora em constraints.</strong> <code>unique=True</code> no slug é a única garantia real contra duplicata: uma checagem "existe?" em código tem uma janela entre o SELECT e o INSERT por onde um request concorrente passa. A constraint fecha a janela porque é verificada <em>dentro</em> da escrita.</li>' +
          '<li><strong>Isolamento.</strong> O padrão do PostgreSQL é <code>READ COMMITTED</code>: duas transações que fazem "ler, somar 1, gravar" sobre o mesmo contador perdem atualizações (<em>lost update</em>). Consertos, do mais simples ao mais forte: update atômico no banco (<code>UPDATE links SET hits = hits + 1</code>), <code>SELECT ... FOR UPDATE</code> (trava pessimista) ou coluna de versão (trava otimista). O bloco 6 prova o lost update com teste concorrente.</li>' +
          '<li><strong>Transação curta</strong> é regra de ouro: transação aberta atravessando uma chamada lenta (uma chamada de modelo no M05, por exemplo) segura uma conexão do pool pelo tempo da chamada. Pool esgotado é API morta. <strong>Transacione o banco, nunca o workflow.</strong></li></ul>' },
        { tipo: 'takeaway', html: '<mark>Transação</mark> desfaz o que falhou no meio, <mark>constraint</mark> fecha a corrida e <mark>migration</mark> versiona o schema; as três moram abaixo do HTTP.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Uma sessão por request, um pool por processo</h3>' +
          '<p>Exemplo conceitual e completo para leitura: engine, modelo, mapeamento e a dependência que delimita a transação. Não é o código do laboratório e não prova comportamento contra banco real.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '# shortener/db.py: exemplo conceitual; a referência executável fica no laboratório final',
          'from collections.abc import AsyncIterator',
          'from datetime import datetime',
          'from sqlalchemy import DateTime, String, func',
          'from sqlalchemy.ext.asyncio import (',
          '    AsyncSession, async_sessionmaker, create_async_engine,',
          ')',
          'from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column',
          'from shortener.settings import settings          # pydantic-settings do M02',
          '',
          'engine = create_async_engine(settings.database_url, pool_size=10, echo=False)',
          'SessionLocal = async_sessionmaker(engine, expire_on_commit=False)',
          '',
          'class Base(DeclarativeBase):',
          '    pass',
          '',
          'class Link(Base):',
          '    __tablename__ = "links"',
          '    id: Mapped[int] = mapped_column(primary_key=True)',
          '    slug: Mapped[str] = mapped_column(String(16), unique=True, index=True)',
          '    url: Mapped[str] = mapped_column(String(2048))',
          '    hits: Mapped[int] = mapped_column(default=0)',
          '    created_at: Mapped[datetime] = mapped_column(',
          '        DateTime(timezone=True), server_default=func.now()',
          '    )',
          '',
          'async def get_session() -> AsyncIterator[AsyncSession]:',
          '    """A dependência com yield: escopo de request, commit no sucesso, rollback no erro."""',
          '    async with SessionLocal() as session:',
          '        try:',
          '            yield session',
          '            await session.commit()',
          '        except Exception:',
          '            await session.rollback()',
          '            raise'].join('\n') },
        { tipo: 'texto', html: '<p>Três decisões que valem discussão de code review:</p>' },
        { tipo: 'abas', rotulo: 'Decisão', itens: [
          { rotulo: 'expire_on_commit=False', blocos: [{ tipo: 'texto', html: '<p>Por padrão o SQLAlchemy "expira" os atributos dos objetos após o commit, e o próximo acesso recarrega do banco: mais um round-trip assíncrono escondido. Numa API é comum devolver o objeto recém-salvo sem nova consulta, e por isso o laboratório desliga a expiração.</p>' }] },
          { rotulo: 'Pool no engine, sessão por request', blocos: [{ tipo: 'texto', html: '<p>O engine, com seu pool, é um singleton do processo criado no startup. A <code>AsyncSession</code> tem escopo curto: aberta na dependência, fechada no teardown. Compartilhar uma sessão entre tarefas concorrentes corrompe a unidade de trabalho; o laboratório prova isso com um oráculo negativo.</p>' }] },
          { rotulo: 'Commit na dependência', blocos: [{ tipo: 'texto', html: '<p>O endpoint declara a intenção (criar, buscar); a fronteira transaciona. É o padrão <strong>unidade de trabalho por request</strong>: a rota nunca chama <code>commit</code> diretamente, então nenhum caminho esquece de confirmar ou de reverter.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Carregamento explícito em async</h3>' +
          '<p>Neste mapeador, em contexto assíncrono, acessar um relacionamento não carregado não dispara uma consulta silenciosa: falha com <code>MissingGreenlet</code>, porque o ORM não pode fazer I/O bloqueante no meio do event loop. O antídoto é declarar o carregamento na consulta: <code>select(Link).options(selectinload(Link.clicks))</code>. O efeito colateral é didático, já que o custo de I/O deixa de ser invisível e vira uma decisão escrita na query. O laboratório provoca o erro de propósito uma vez, para o diagnóstico virar reflexo.</p>' },
        { tipo: 'texto', html:
          '<h3>Simulador: pool de conexões e concorrência</h3>' +
          '<p>Cada request mantém uma conexão ocupada por T ms; quando todas estão em uso, o request espera na fila. O comando abaixo reproduz a fórmula do simulador da página do módulo: ondas = ceil(n / c), espera do último = (ondas - 1) x T, vazão = c / (T / 1000). Antes de rodar, preveja o efeito de uma chamada lenta dentro da transação.</p>' },
        { tipo: 'rode', id: 'b2-rode-pool', titulo: 'Pool, chamada lenta e workers',
          enunciado: 'Rode as três situações e clique em cada etapa. Valores calculados pela fórmula acima, para 40 requests simultâneos e 15 conexões (pool_size + max_overflow).',
          prefixo: '$', entrada: 'simulador --n 40 --pool 15 --ms 50 --workers 1', unidade: 'ms', terminalTitulo: 'pool de conexões', etapas: etapasPool(),
          prever: { pergunta: 'A rota passa a chamar um modelo de 8 s <em>dentro</em> da transação. O que acontece com a vazão do pool (hoje ~300 requests/s por worker)?', opcoes: [
            { id: 'a', texto: 'Cai para cerca de 2 requests/s: a conexão fica presa pelo tempo da chamada.', correta: true, porque: 'vazão = conexões / tempo de posse = 15 / 8,05 s, com o banco ocioso.' },
            { id: 'b', texto: 'Continua ~300 requests/s, porque o banco não faz nada durante a espera.', correta: false, porque: 'o banco ocioso não ajuda: quem está esgotada é a conexão, presa pela transação aberta.' },
            { id: 'c', texto: 'Cai pela metade.', correta: false, porque: 'o tempo de posse foi multiplicado por mais de 100, não por 2.' }
          ] },
          tutorAntes: 'Aperte Enter e leia a etapa "Pool saudável". Depois clique na etapa da chamada lenta e na dos workers.',
          tutorDepois: 'Duas lições do mesmo simulador: a chamada lenta dentro da transação multiplica o tempo de posse da conexão (transacione só a gravação), e o pool é por processo, então workers multiplicam as conexões contra o <code>max_connections</code> do Postgres. O módulo define alerta de <code>QueuePool limit reached</code> quando a espera passa do <code>pool_timeout</code> (30 s).',
          callout: 'Você viu o pool saturar por tempo de posse e por excesso de workers.' },
        { tipo: 'takeaway', html: 'Engine e pool são do <mark>processo</mark>; a sessão é do <mark>request</mark>; commit e rollback moram na <mark>dependência</mark>, com a transação <mark>curta</mark>.' }
      ] },

      { rotulo: 'Alembic', blocos: [
        { tipo: 'texto', html:
          '<h3>Migrations com contrato</h3>' +
          '<p>O Alembic versiona o schema: cada mudança é uma <em>revision</em>, um arquivo Python numerado e encadeado com <code>upgrade</code> (aplica) e <code>downgrade</code> (desfaz). O comando <code>alembic init -t async migrations</code> cria o esqueleto para engine assíncrono; a configuração única é apontar <code>target_metadata = Base.metadata</code> no <code>env.py</code> e ler a URL do banco das settings do projeto. O ciclo é sempre o mesmo:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          'uv run alembic revision --autogenerate -m "create links table"',
          '# REVISE o arquivo gerado em migrations/versions/: autogenerate erra rename',
          '# (vê drop+add), não vê mudança de server_default e não escreve backfill.',
          'uv run alembic upgrade head'].join('\n') },
        { tipo: 'texto', html:
          '<p>Três regras separam migration revisada de incidente futuro:</p>' +
          '<ul><li><strong>Migration é código revisado.</strong> O <code>--autogenerate</code> escreve um rascunho comparando modelos e banco, e rascunho se revisa.</li>' +
          '<li><strong>Todo upgrade tem downgrade testado</strong>, porque o rollback de deploy depende dele (bloco 7).</li>' +
          '<li><strong>Migration destrutiva acontece em duas releases:</strong> primeiro o código para de usar a coluna, depois outra migration a remove.</li></ul>' +
          '<p>E a proibição que o laboratório verifica com oráculo: nenhum startup de produção cria schema com <code>create_all</code>; o schema nasce de migration, sempre.</p>' },
        { tipo: 'ordene', id: 'b2-ordene-ciclo', titulo: 'Ponha o ciclo da migration na ordem', obrigatorio: false,
          enunciado: 'Use os botões para ordenar os passos de uma mudança de schema, do primeiro ao último.',
          itens: [
            { id: 'upgrade', texto: 'Aplicar com <code>alembic upgrade head</code>' },
            { id: 'revisar', texto: 'Revisar e editar o arquivo gerado em <code>migrations/versions/</code>' },
            { id: 'modelo', texto: 'Alterar o modelo (<code>Base.metadata</code>)' },
            { id: 'down', texto: 'Testar o <code>downgrade</code> e subir de novo' },
            { id: 'gerar', texto: 'Gerar o rascunho com <code>alembic revision --autogenerate</code>' }
          ], solucao: ['modelo', 'gerar', 'revisar', 'upgrade', 'down'],
          tutorDepois: 'O autogenerate só compara modelo e banco: o passo de revisão é onde rename, default e backfill são corrigidos.',
          callout: 'Ciclo na ordem: modelo, rascunho, revisão, upgrade e downgrade testado.' },
        { tipo: 'python', id: 'b2-python-migrar', titulo: 'Escreva um mini-Alembic de ida e volta', obrigatorio: false,
          enunciado: 'Com <code>sqlite3</code> (equivalente didático, sem PostgreSQL), implemente <code>migrar(conn, destino)</code>: sobe aplicando o <code>upgrade</code> de cada revision em ordem, desce aplicando o <code>downgrade</code> na ordem inversa, grava a versão em <code>alembic_version</code> e rejeita destino desconhecido sem tocar no banco. Esta tabela de versão é uma simplificação do que o Alembic faz.',
          codigo: b2mCodigo, testes: b2mTestes,
          dica: 'Monte <code>ids = ["base"] + [r[0] for r in REVISOES]</code>. Sobe: <code>REVISOES[i:j]</code> na ordem. Desce: <code>reversed(REVISOES[j:i])</code>. Depois, <code>DELETE FROM alembic_version</code> e, se o alvo não for "base", um INSERT.',
          solucao: b2mSolucao,
          tutorDepois: 'Repare que o dado inserido na revision 0001 sobreviveu ao upgrade: a coluna nova nasce com <code>DEFAULT</code>. Sem isso, <code>NOT NULL</code> numa tabela com linhas é o incidente clássico.',
          callout: 'Migração de ida e volta testada, com destino inválido rejeitado.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Contraste: o que parece funcionar e quebra em produção', html:
          '<ul><li><strong><code>if exists</code> antes de inserir</strong> parece prevenir duplicata, mas duas tarefas passam pela checagem antes de qualquer escrita: ambas inserem, uma quebra sem tratamento ou, sem constraint, ambas passam. Só constraint mais tradução de <code>IntegrityError</code> fecha.</li>' +
          '<li><strong><code>create_all</code> no startup</strong> parece simplificar o deploy, mas cria schema sem histórico, sem revisão e sem volta, e diverge do banco real na primeira alteração manual.</li>' +
          '<li><strong>Sessão global reutilizada</strong> parece economizar objetos, mas mistura unidades de trabalho de requests distintos. Sessão nova por request, engine compartilhado.</li></ul>' },
        { tipo: 'takeaway', html: 'Autogenerate é <mark>rascunho</mark>; todo upgrade tem <mark>downgrade testado</mark>; destrutivo em <mark>duas releases</mark>; nunca <mark>create_all</mark> em produção.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html: '<p>Em <code>sqlite3</code> (biblioteca padrão), o mesmo princípio do bloco: a unidade de trabalho confirma ou desfaz, e a constraint, não um <code>if</code>, recusa o duplicado. As diferenças para PostgreSQL ficam por conta do laboratório; a lógica é a mesma.</p>' },
        { tipo: 'python', id: 'b2-python-uow', titulo: 'Unidade de trabalho e constraint', obrigatorio: false,
          enunciado: 'Implemente <code>unidade_de_trabalho(conn)</code> (BEGIN; commit no sucesso; rollback no erro; a exceção continua subindo) e <code>criar_link</code> (só INSERT, traduzindo o erro da constraint para <code>SlugEmUso</code>). O último teste é o controle negativo: mostra a janela do <code>if exists</code> sem constraint.',
          codigo: b2uCodigo, testes: b2uTestes,
          dica: 'Use <code>conn.execute("BEGIN")</code> antes do <code>yield</code>; <code>except Exception:</code> faz ROLLBACK e <code>raise</code>; <code>else:</code> faz COMMIT. Em <code>criar_link</code>: <code>except sqlite3.IntegrityError as exc: raise SlugEmUso(slug) from exc</code>.',
          solucao: b2uSolucao,
          tutorDepois: 'A rota nunca chama commit: quem confirma ou desfaz é a fronteira. E o 409 vem de uma exceção do banco, não de uma consulta prévia.',
          callout: 'Unidade de trabalho e constraint passaram nos testes, incluindo o controle negativo.' },
        { tipo: 'cenario', id: 'b2-cenario', titulo: 'A API travou com banco ocioso', obrigatorio: false,
          enunciado: 'Sob carga a API passa a responder com <code>QueuePool limit reached</code>, e o PostgreSQL está quase ocioso. A rota abre a transação, chama um modelo de linguagem (8 s) e só depois grava. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Os dashboards mostram CPU do banco baixa e todas as conexões do pool ocupadas. O que você faz primeiro?', opcoes: [
              { texto: 'Aumentar <code>max_connections</code> e o pool.', vai: 'f-adia', tom: 'ruim', consequencia: 'a carga seguinte esgota o novo limite; a causa continua lá.' },
              { texto: 'Trocar por uma sessão global compartilhada, para ter menos objetos.', vai: 'f-global', tom: 'ruim', consequencia: 'mistura unidades de trabalho de requests distintos e passa a falhar sob concorrência.' },
              { texto: 'Chamar o modelo fora da transação e transacionar só a gravação.', vai: 'prova', tom: 'ok', consequencia: 'a conexão volta a ficar presa por milissegundos, não por segundos.' }
            ] },
            prova: { texto: 'Como você garante que o defeito não volta?', opcoes: [
              { texto: 'Um teste com chamada lenta fake e N requests simultâneos, afirmando que o pool não esgota e que o commit só ocorre depois da chamada.', vai: 'f-bom', tom: 'ok', consequencia: 'o oráculo falha se alguém reintroduzir a transação longa.' },
              { texto: 'Um comentário no código dizendo "transação curta".', vai: 'f-comentario', tom: 'ruim', consequencia: 'convenção oral decai; o próximo refactor desfaz.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Transação curta, workflow fora dela e um oráculo que quebra a suíte se a regressão voltar.' },
            'f-adia': { bom: false, texto: 'A falha só mudou de data: com mais carga, o novo limite esgota igual.' },
            'f-global': { bom: false, texto: 'A API passou a corromper unidades de trabalho em requests concorrentes, e o sintoma ficou mais difícil de achar.' },
            'f-comentario': { bom: false, texto: 'Seis meses depois alguém moveu a chamada para dentro da transação, e o incidente voltou.' }
          },
          callout: 'Você tratou a causa (conexão presa) e deixou um oráculo para ela.' },
        { tipo: 'escolha', id: 'b2-esc-race', titulo: 'Confira: a corrida de slug',
          pergunta: 'Duas requisições criam o mesmo slug ao mesmo tempo. A rota faz SELECT para ver se existe e só então INSERT, sem constraint. Qual é o resultado provável?',
          opcoes: [
            { id: 'a', texto: 'Ambas passam pela checagem e ambas inserem: a janela entre checar e escrever é o problema; só a constraint UNIQUE a fecha.', correta: true, porque: 'em READ COMMITTED as duas transações não enxergam a escrita uma da outra antes do commit; o banco só rejeita o duplicado com UNIQUE, e a rota traduz o <code>IntegrityError</code> em 409.' },
            { id: 'b', texto: 'A segunda falha com 409 automaticamente, porque a transação é isolada.', correta: false, porque: 'isolamento não cria regra de unicidade.' },
            { id: 'c', texto: 'O PostgreSQL serializa as duas e rejeita a segunda sem precisar de constraint.', correta: false, porque: 'o padrão READ COMMITTED não serializa isso.' },
            { id: 'd', texto: 'Nada de errado: o <code>if</code> prévio é equivalente a uma constraint.', correta: false, porque: 'o <code>if</code> tem a janela; a constraint é verificada dentro da escrita.' }
          ], tutorDepois: 'Consistência sob concorrência mora na constraint.' },
        { tipo: 'escolha', id: 'b2-esc-commit', titulo: 'Confira: onde mora o commit',
          pergunta: 'Num code review, a rota <code>criar_link</code> chama <code>await session.commit()</code> no fim. O que o padrão do bloco pede?',
          opcoes: [
            { id: 'a', texto: 'Manter: quem escreve é quem confirma.', correta: false, porque: 'um caminho que esquece de confirmar ou de reverter vira bug difícil de achar.' },
            { id: 'b', texto: 'Tirar o commit da rota: a dependência com <code>yield</code> confirma no sucesso e faz rollback no erro.', correta: true, porque: 'unidade de trabalho por request: a rota declara a intenção, a fronteira transaciona.' },
            { id: 'c', texto: 'Trocar por <code>create_all</code> no startup.', correta: false, porque: '<code>create_all</code> trata de schema, não de transação.' }
          ], tutorDepois: 'Um lugar único para commit e rollback torna cada rota mais curta e mais segura.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes deste bloco: documentação do SQLAlchemy (asyncio, Session basics), Alembic cookbook, PostgreSQL MVCC e transações. Consultadas em 21/08/2026; documentação de framework e banco deve ser revalidada em até 90 dias.</p>' },
        { tipo: 'takeaway', html: 'A <mark>rota</mark> declara a intenção; a <mark>fronteira</mark> transaciona; a <mark>constraint</mark> decide quem ganha a corrida.' }
      ] }
    ]
  });
})();
