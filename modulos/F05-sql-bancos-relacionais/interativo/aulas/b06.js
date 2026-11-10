/* F05 · Bloco 6: do modelo ao código: domínio, migrations, sqlite3 com parâmetros, injection e quando não usar relacional. Fonte: F05.html#b06. Saídas do lab: SQLite 3.53.1, Python 3.14.7 (11/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var UNSAFE =
    'def find_member_unsafe(conn, email):\n' +
    '    sql = "SELECT id, email, name FROM member WHERE email = \'" + email + "\'"\n' +
    '    return [tuple(row) for row in conn.execute(sql).fetchall()]';

  var CONEXAO =
    'conn = sqlite3.connect(path, autocommit=True)          # Python 3.12+: você controla BEGIN/COMMIT\n' +
    'conn.row_factory = sqlite3.Row                         # acesso por nome: row["email"]\n' +
    'conn.execute("PRAGMA foreign_keys = ON")               # por conexão!\n\n' +
    'conn.execute("SELECT id, email FROM member WHERE email = ?", (email,))            # posicional\n' +
    'conn.execute("SELECT ... WHERE l.due_on < :today AND l.member_id = :m",\n' +
    '             {"today": "2026-06-30", "m": 5})                                      # nomeado\n' +
    'conn.executemany("INSERT INTO loan (book_id, member_id, loaned_on, due_on) VALUES (?, ?, ?, ?)", rows)';

  var etapasInjecao = function () {
    return [
      { id: 'entrada', nome: 'Entrada', descricao: 'O e-mail que chega ao repositório', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'uv run python -m sqllab.cli injection'),
        L('info', 'e-mail comum: ana@example.com')] },
      { id: 'montagem', nome: 'Montagem do SQL', descricao: 'Concatenação (unsafe.py) vs parâmetro', tom: 'tcp', ms: 2, linhas: [
        L('out', "unsafe: SELECT id, email, name FROM member WHERE email = 'ana@example.com'"),
        L('out', 'safe:   SELECT id, email, name FROM member WHERE email = ?    -- valor viaja à parte')] },
      { id: 'execucao', nome: 'Execução', descricao: 'O banco compila o texto SQL', tom: 'tls', ms: 1, linhas: [
        L('out', 'unsafe rows: 1'),
        L('out', 'safe member: (1, ana@example.com, Ana)'),
        L('hint', 'com entrada comum as duas versões se comportam igual; o defeito só aparece com entrada hostil ou só diferente')] }
    ];
  };

  var BOOK_ORDER =
    'BOOK_ORDER_COLUMNS = {"titulo": "title", "ano": "published_year", "copias": "copies"}\n' +
    'DIRECOES = {"asc": "ASC", "desc": "DESC"}\n\n\n';

  TrilhaAula.registrar({
    id: 'f05-b6',
    titulo: 'Do modelo ao código: migrations, injection e escolha do armazenamento',
    minutos: 45,
    resumo: 'Fecha o ciclo de todo projeto real: do domínio ao esquema, evolução sem perder dados, acesso pelo Python sem abrir uma vulnerabilidade e saber quando o relacional não é a ferramenta.',
    objetivo: 'Modelar um domínio em passos, versionar o schema com migrations, usar parâmetros e lista de permissão contra SQL injection e decidir quando outro armazenamento é necessário.',
    revisao: [
      { id: 'f05b6-param', pergunta: 'Qual a diferença, no nível do protocolo, entre cursor.execute(f"... WHERE email = \'{email}\'") e cursor.execute("... WHERE email = ?", (email,))?',
        opcoes: [
          opc('a', 'Na primeira a entrada vira parte do texto SQL e é analisada como programa; na segunda o texto SQL é fixo e o valor viaja separado como dado', true, 'parâmetro é separação de canais, não "escape melhor".'),
          opc('b', 'A segunda escapa as aspas automaticamente', false, 'não é escape: o banco compila a instrução antes de ver o valor.'),
          opc('c', 'Nenhuma, só estilo', false, 'a diferença é estrutural e de segurança.')] },
      { id: 'f05b6-ident', pergunta: 'cursor.execute("SELECT * FROM livro ORDER BY " + coluna): parâmetros ? resolvem a injeção?',
        opcoes: [
          opc('a', 'Não: parâmetros valem para valores, não para identificadores; use lista de permissão de nomes de coluna', true, 'ORDER BY ? ordenaria por uma constante textual.'),
          opc('b', 'Sim, com ORDER BY ?', false, 'ordena por constante, não pela coluna.'),
          opc('c', 'Sim, escapando com aspas simples', false, 'escapar à mão é o caminho do próximo bypass.')] },
      { id: 'f05b6-migration', pergunta: 'A migration 002 já foi aplicada em produção e esqueceu um índice. O que fazer?',
        opcoes: [
          opc('a', 'Criar a migration 003 com o índice; nunca editar uma migration já aplicada', true, 'ambientes diferentes ficariam em estados que o arquivo não descreve mais.'),
          opc('b', 'Editar a 002 e reaplicar', false, 'cria bancos que divergem em silêncio.'),
          opc('c', 'Criar o índice na mão no servidor, sem registro', false, 'quebra a reprodutibilidade.')] },
      { id: 'f05b6-expand', pergunta: 'Por que renomear uma coluna numa única migration quebra um deploy sem parada?',
        opcoes: [
          opc('a', 'A versão antiga do aplicativo ainda está rodando durante o deploy e usa o nome antigo; por isso o padrão expand/contract em etapas', true, 'expand (coluna nova anulável), escrever nos dois, backfill em lotes, ler só do novo, contract.'),
          opc('b', 'O SQL não permite renomear', false, 'permite; o problema é o aplicativo antigo.'),
          opc('c', 'Migrations não podem alterar colunas', false, 'podem.')] },
      { id: 'f05b6-armazenamento', pergunta: 'Qual a regra de partida para escolher o armazenamento em um sistema novo?',
        opcoes: [
          opc('a', 'Comece no PostgreSQL (JSONB, busca textual, pgvector, mesma transação) e só some outro armazenamento por necessidade medida, declarando uma fonte única da verdade', true, 'cada sistema adicional é fonte de inconsistência; os demais são derivados recriáveis.'),
          opc('b', 'NoSQL escala melhor, então comece por ele', false, 'abre mão de joins, transações e consistência para particionar.'),
          opc('c', 'Use um banco por tipo de dado desde o início', false, 'multiplica fontes de inconsistência sem necessidade medida.')] }
    ],
    abas: [
      { rotulo: 'Do domínio às migrations', blocos: [
        { tipo: 'texto', html:
          '<h3>Modelar um domínio, em passos</h3>' +
          '<p>Procedimento que funciona em qualquer domínio, aplicado à biblioteca do lab. Este bloco liga o módulo ao M03 (SQLAlchemy, Alembic, PostgreSQL) e ao M07 (busca vetorial).</p>' },
        { tipo: 'abas', rotulo: 'Sete passos', itens: [
          { rotulo: '1 · Substantivos e verbos', blocos: [{ tipo: 'texto', html: '<p>Liste os substantivos e verbos do requisito: "Membros pegam livros emprestados; livros têm autor e categoria; categorias formam uma hierarquia; membros podem ser indicados por outros". Substantivos viram candidatos a entidade; verbos viram relacionamentos.</p>' }] },
          { rotulo: '2 · Cardinalidade', blocos: [{ tipo: 'texto', html: '<p>Para cada relacionamento, defina cardinalidade e opcionalidade: autor 1—N livro (todo livro tem um autor: <code>NOT NULL</code>); livro N—M membro (via <code>loan</code>); categoria 0..1 pai (auto-relacionamento anulável); livro 0..1 categoria. A opcionalidade vira <code>NULL</code>/<code>NOT NULL</code>; a cardinalidade decide onde fica a chave estrangeira (no lado "N") ou se precisa de tabela associativa (N—M).</p>' }] },
          { rotulo: '3 · Chaves', blocos: [{ tipo: 'texto', html: '<p>Substituta como primária, natural como <code>UNIQUE</code> (ISBN, e-mail).</p>' }] },
          { rotulo: '4 · Invariantes', blocos: [{ tipo: 'texto', html: '<p>Declare no banco: estoque não negativo, vencimento não anterior ao empréstimo, e-mail único.</p>' }] },
          { rotulo: '5 · Normalização', blocos: [{ tipo: 'texto', html: '<p>Para cada coluna: "depende da chave, de toda a chave e de nada além da chave?".</p>' }] },
          { rotulo: '6 · Consultas e índices', blocos: [{ tipo: 'texto', html: '<p>Liste as consultas que o sistema fará (acessos por membro, por livro, empréstimos abertos) e crie os índices que elas pedem. Modelo e padrões de acesso se influenciam: é aqui, e não antes, que se decide uma desnormalização.</p>' }] },
          { rotulo: '7 · E o histórico?', blocos: [{ tipo: 'texto', html: '<p>O que precisa ser congelado no momento do evento (preço, endereço, nome do autor na edição) em vez de referenciado ao valor corrente?</p>' }] }
        ] },
        { tipo: 'texto', html: '<p>Teste de qualidade do modelo: se uma regra de negócio nova exige mudar o esquema em mais de um lugar, ou se uma pergunta razoável do negócio só se responde com um <code>CASE</code> gigante, o modelo está contando a história errada.</p>' +
          '<h3>Migrations: o esquema também é código</h3>' +
          '<p>A mudança de esquema precisa ser reprodutível (qualquer ambiente chega ao mesmo estado), versionada (revisada em PR, com histórico) e aplicada em ordem. Uma <strong>migration</strong> é um script numerado; o banco guarda a versão atual (no lab, <code>PRAGMA user_version</code>; em Alembic/Flyway, uma tabela de controle) e aplica as pendentes. O <code>db.py</code> do lab faz isso em cerca de 25 linhas; os dois arquivos reais são <code>001_initial.sql</code> (o esquema) e <code>002_loan_indexes.sql</code> (os três índices). Cada script roda numa transação junto com o aumento da versão:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'script = f"BEGIN;\\n{sql}\\nPRAGMA user_version = {version};\\nCOMMIT;"\n' +
          'conn.executescript(script)' },
        { tipo: 'texto', html:
          '<p>Como o DDL é transacional no SQLite (e no PostgreSQL), uma migration que falha no meio deixa o banco na versão anterior, inteiro. O lab prova com falha injetada: uma migration 003 com um <code>CREATE TABLE</code> válido seguido de uma instrução quebrada. O teste confirma que a versão continua 2 e que <code>half_done</code> não existe. No MySQL isso não vale: o primeiro <code>CREATE</code> já foi confirmado, e você tem um banco meio migrado.</p>' },
        { tipo: 'abas', rotulo: 'Regras de processo', itens: [
          { rotulo: 'Nunca editar', blocos: [{ tipo: 'texto', html: '<p><strong>Nunca edite uma migration já aplicada em outro ambiente.</strong> Crie outra. Editar a antiga cria bancos que divergem em silêncio.</p><p>Migração "só para frente" é o padrão realista: rollback de dados raramente é possível (uma coluna apagada não volta). Em vez de confiar no <code>downgrade</code>, planeje a reversibilidade pelo desenho em etapas.</p>' }] },
          { rotulo: 'Expand/contract', blocos: [{ tipo: 'texto', html: '<ol><li><em>Expand:</em> adicione a coluna nova anulável, sem quebrar o código antigo.</li><li>O código passa a escrever nos dois lugares.</li><li><em>Backfill</em> dos dados antigos em lotes.</li><li>O código passa a ler só do novo.</li><li><em>Contract:</em> remova o antigo numa migration posterior.</li></ol><p>Renomear coluna numa única migration quebra a versão antiga do aplicativo que ainda roda durante o deploy.</p>' }] },
          { rotulo: 'PostgreSQL, tabelas grandes', blocos: [{ tipo: 'texto', html: '<p><code>ALTER TABLE ... ADD COLUMN</code> com <code>DEFAULT</code> constante é rápido desde a versão 11, mas adicionar <code>NOT NULL</code> ou uma chave estrangeira varre a tabela com lock. Adicione a restrição como <code>NOT VALID</code> (não valida as linhas existentes, vale para as novas) e depois <code>VALIDATE CONSTRAINT</code> (lock mais leve). Índices com <code>CREATE INDEX CONCURRENTLY</code>, fora de transação (bloco 4). Defina <code>lock_timeout</code> na migration para que ela falhe rápido em vez de enfileirar todo o tráfego atrás de um lock.</p><p>Mantenha migração de dados e de esquema em scripts separados: têm perfis de risco e duração diferentes. Em projetos Python reais você usará o Alembic com SQLAlchemy (M03): a ideia é a mesma; a ferramenta gera o esqueleto e mantém a tabela de versões.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'Migration aplicada é <mark>história</mark>: corrija para frente, em etapas <mark>expand/contract</mark>, e deixe cada script <mark>transacional</mark>.' }
      ] },

      { rotulo: 'sqlite3, parâmetros e injection', blocos: [
        { tipo: 'texto', html:
          '<h3>O contrato do driver</h3>' +
          '<p>O módulo <code>sqlite3</code> implementa a DB-API 2.0 (PEP 249), que o <code>psycopg</code> do PostgreSQL também implementa: <code>connect()</code>, <code>cursor()</code>, <code>execute(sql, params)</code>, <code>fetchone/fetchall</code>, <code>commit/rollback</code>. O que muda é o estilo do marcador (<code>paramstyle</code>): o <code>sqlite3</code> usa <code>?</code> (qmark) e <code>:nome</code> (named); o <code>psycopg</code>, <code>%s</code> e <code>%(nome)s</code>. A ideia é idêntica.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: CONEXAO },
        { tipo: 'texto', html:
          '<p>Pontos que não aparecem em tutoriais: o contexto <code>with conn:</code> do <code>sqlite3</code> confirma ou desfaz a transação mas <strong>não fecha</strong> a conexão (use <code>contextlib.closing</code> ou o seu gerenciador). A tupla de um só parâmetro precisa da vírgula: <code>(email,)</code>; <code>(email)</code> é uma string, e o driver tentaria ligar cada caractere. E o resultado de <code>execute</code> é um cursor <em>preguiçoso</em>: se você alterar a tabela enquanto itera, o comportamento depende do banco; materialize com <code>fetchall()</code> quando for escrever no mesmo laço.</p>' +
          '<h3>SQL injection: demonstração e defesa</h3>' +
          '<p>Quando você monta o SQL por concatenação ou <code>f-string</code>, a entrada do usuário deixa de ser <em>dado</em> e passa a fazer parte do <em>programa</em>. O módulo <code>unsafe.py</code> do lab é vulnerável de propósito:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: UNSAFE },
        { tipo: 'texto', html: '<p>Rode com um e-mail comum, depois provoque as falhas. Preveja primeiro: com o payload <code>\' OR \'1\'=\'1</code>, quantos membros a versão concatenada devolve (o lab tem 6)?</p>' },
        { tipo: 'quebre', id: 'f05b6-quebre', titulo: 'Quebre a consulta concatenada', enunciado: 'Escolha uma entrada hostil (ou legítima, mas estranha) e veja o que a versão concatenada faz e o que a parametrizada faz. (Ilustração a partir dos testes do lab; o e-mail comum é exemplo e a saída literal varia.)',
          prefixo: '$', entrada: 'uv run python -m sqllab.cli injection', unidade: 'linhas', terminalTitulo: 'sqllab', etapas: etapasInjecao(),
          prever: { pergunta: 'Com o payload \' OR \'1\'=\'1, o texto executado é ... WHERE email = \'\' OR \'1\'=\'1\'. Quantos membros a versão concatenada devolve, e a parametrizada?', opcoes: [
            { id: 'a', texto: 'Concatenada: 0; parametrizada: 0.', correta: false, porque: 'a tautologia é verdadeira para todas as linhas.' },
            { id: 'b', texto: 'Concatenada: 6 (todos); parametrizada: nenhum (None).', correta: true, porque: 'o parâmetro viaja como dado: o banco procura um e-mail literalmente estranho, que não existe.' },
            { id: 'c', texto: 'Concatenada: 1; parametrizada: 1.', correta: false, porque: 'a entrada deixa de ser comum.' }
          ] },
          falhas: [
            { id: 'tautologia', rotulo: "Payload ' OR '1'='1", efeito: { etapaFalha: 'montagem', linhasErro: [
              { kind: 'out', text: "unsafe: SELECT id, email, name FROM member WHERE email = '' OR '1'='1'" },
              { kind: 'out', text: 'safe:   SELECT id, email, name FROM member WHERE email = ?    -- valor: \' OR \'1\'=\'1' },
              { kind: 'out', text: 'unsafe rows: 6' },
              { kind: 'out', text: 'safe member: None' }],
              tutor: 'a tautologia fechou a aspa do literal e acrescentou um OR verdadeiro para todas as linhas. A versão parametrizada compila o texto antes de ver o valor, que será sempre dado.' } },
            { id: 'union', rotulo: 'UNION SELECT em outra tabela', efeito: { etapaFalha: 'montagem', linhasErro: [
              { kind: 'out', text: "unsafe: ... WHERE email = 'x' UNION SELECT id, isbn, title FROM book --'" },
              { kind: 'out', text: 'unsafe rows: linhas de book aparecem no resultado da consulta de membros' },
              { kind: 'out', text: 'safe member: None' }],
              tutor: 'este é o ataque que realmente interessa: ler o que não é seu pela mesma consulta. Não precisa de segunda instrução.' } },
            { id: 'apostrofo', rotulo: "Apóstrofo legítimo: o'brien@example.com", efeito: { etapaFalha: 'execucao', linhasErro: [
              { kind: 'out', text: "unsafe: ... WHERE email = 'o'brien@example.com'" },
              { kind: 'out', text: 'erro de sintaxe na versão concatenada (sem nenhum atacante)' },
              { kind: 'out', text: 'safe member: None  -- consulta executa; o e-mail simplesmente não existe' }],
              tutor: 'um nome com apóstrofo, totalmente legítimo, já quebra a concatenação com erro de sintaxe.' } },
            { id: 'drop', rotulo: "x'; DROP TABLE member; --", efeito: { etapaFalha: 'execucao', linhasErro: [
              { kind: 'out', text: "unsafe: ... WHERE email = 'x'; DROP TABLE member; --'" },
              { kind: 'out', text: 'barrado pelo sqlite3: o driver executa uma instrução por chamada' },
              { kind: 'hint', text: 'isso é acaso do driver, não defesa' }],
              tutor: 'drivers de outros bancos podem aceitar várias instruções, e a injeção por UNION nem precisa de uma segunda.' } }
          ],
          tutorAntes: 'Aperte Enter com o e-mail comum ("Sem falha"), depois escolha uma entrada hostil e rode de novo.',
          tutorDepois: 'Parâmetro não é "uma forma mais bem escapada": é uma separação de canais, estrutural, que dispensa raciocinar sobre o conteúdo.',
          callout: 'Você viu a concatenação ceder e o parâmetro segurar.' },
        { tipo: 'texto', html: '<h3>O que parâmetros protegem, e o que não</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Situação</th><th>Parâmetro resolve?</th><th>O que fazer</th></tr></thead><tbody>' +
          '<tr><td>Valor em <code>WHERE</code>, <code>VALUES</code>, <code>SET</code>, <code>LIMIT</code></td><td>Sim</td><td><code>?</code> / <code>:nome</code> sempre</td></tr>' +
          '<tr><td>Nome de tabela ou coluna, direção do <code>ORDER BY</code></td><td><strong>Não</strong>: identificador não é valor</td><td>Lista de permissão (mapa do nome externo para o identificador real). No lab: <code>BOOK_ORDER_COLUMNS</code>; entrada fora do mapa levanta <code>ValueError</code></td></tr>' +
          '<tr><td><code>IN (?, ?, ?)</code> com tamanho variável</td><td>Sim, mas o <em>número</em> de marcadores é texto</td><td>Gere só <code>?</code> (<code>",".join("?" * n)</code>), nunca os valores. PostgreSQL: <code>= ANY(%s)</code> com uma lista</td></tr>' +
          '<tr><td><code>LIKE</code> com entrada do usuário</td><td>Protege contra injeção, mas <code>%</code> e <code>_</code> do usuário continuam curingas</td><td>Escape os curingas (<code>ESCAPE \'\\\'</code>) se a busca deve ser literal</td></tr>' +
          '<tr><td>Conteúdo salvo e reutilizado depois ("injeção de segunda ordem")</td><td>Só se <em>toda</em> consulta que o reutiliza também parametrizar</td><td>Nunca confie em "já está no meu banco, então é seguro"</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p><strong>Defesas em camadas:</strong></p>' +
          '<ol><li>Parâmetros sempre.</li><li>Lista de permissão para identificadores.</li><li><em>Menor privilégio</em>: a conta do aplicativo não precisa de <code>DROP</code>, <code>CREATE</code> nem acesso a tabelas alheias, de modo que uma injeção bem-sucedida alcance pouco.</li><li>Validação de formato na borda (Pydantic, M02) como higiene, nunca como a defesa principal.</li><li>Revisão e análise estática que sinalizem <code>execute(f"...")</code>.</li></ol>' +
          '<p>ORMs parametrizam por construção, mas todo ORM tem uma saída de "texto cru" (<code>text()</code> no SQLAlchemy), e é ali que a injeção reaparece. Isso importa em sistemas com LLM: texto gerado por modelo é entrada não confiável, e um agente que monta SQL por concatenação a partir do que o modelo produz herda exatamente este defeito. O padrão seguro é o modelo escolher uma consulta ou ferramenta de um conjunto fixo e os argumentos viajarem como parâmetros (os módulos de agentes e de segurança retomam).</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: higienizar em vez de parametrizar', html:
          '<p>Trocar <code>\'</code> por <code>\'\'</code> ou filtrar palavras como <code>DROP</code> depende de conhecer as regras do banco, da codificação e do contexto (dentro de string, de número, de identificador), e falha em casos de borda: aspas de outro charset, barras invertidas no MySQL, concatenações que reintroduzem o caractere filtrado.</p>' +
          '<p>A segunda armadilha: uma <code>f-string</code> "só com valores internos" (<code>f"... WHERE id = {user_id}"</code> com <code>user_id</code> vindo de <code>int(request...)</code>) funciona até alguém reutilizar a função com outro tipo. O hábito sem exceções é mais barato do que auditar exceções.</p>' },
        { tipo: 'takeaway', html: '<mark>Parâmetros</mark> para valores, <mark>lista de permissão</mark> para identificadores, <mark>menor privilégio</mark> como camada extra; escapar à mão não é defesa.' }
      ] },

      { rotulo: 'Quando não usar relacional', blocos: [
        { tipo: 'texto', html:
          '<h3>Decida pelo padrão de acesso</h3>' +
          '<p>O relacional é o padrão sensato: modelo flexível para consultas que você ainda não imaginou, integridade declarativa e transações. Os outros modelos otimizam um eixo específico, trocando algo em contrapartida. Decida pelo <strong>padrão de acesso</strong> e pelos requisitos de consistência, não pela moda.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Modelo</th><th>Bom para</th><th>Você abre mão de</th><th>Exemplos</th></tr></thead><tbody>' +
          '<tr><td>Relacional</td><td>Dados estruturados com relacionamentos, integridade, consultas ad hoc, transações multi-linha</td><td>Escala horizontal de escrita simples; esquema rígido exige migrations</td><td>PostgreSQL, MySQL, SQLite</td></tr>' +
          '<tr><td>Chave-valor</td><td>Cache, sessões, filas leves, contadores; acesso apenas por chave, latência mínima</td><td>Consulta por outros atributos, joins</td><td>Redis, DynamoDB (também documento)</td></tr>' +
          '<tr><td>Documento</td><td>Agregados hierárquicos lidos/escritos como um todo; esquema que varia por registro</td><td>Joins e integridade entre documentos; análises transversais</td><td>MongoDB, Firestore; <code>JSONB</code> no PostgreSQL cobre muitos casos</td></tr>' +
          '<tr><td>Colunar / wide-column</td><td>Analítica sobre muitas linhas e poucas colunas; séries temporais em escala enorme</td><td>Escritas pontuais e transações</td><td>ClickHouse, BigQuery, Cassandra, Parquet</td></tr>' +
          '<tr><td>Grafo</td><td>Travessias profundas e padrões de relacionamento (recomendação, fraude)</td><td>Agregações tabulares gerais</td><td>Neo4j; CTE recursiva atende muitos casos pequenos</td></tr>' +
          '<tr><td>Busca de texto</td><td>Relevância, filtros facetados, texto livre</td><td>Ser fonte da verdade transacional</td><td>Elasticsearch/OpenSearch; <code>tsvector</code> no PostgreSQL</td></tr>' +
          '<tr><td>Vetorial</td><td>Vizinhos mais próximos por similaridade de embeddings (RAG, recomendação)</td><td>Resultado exato (a busca é aproximada: recall &lt; 100%), igualdade/ordem clássicas</td><td>pgvector, Qdrant, Pinecone</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p><strong>Três regras de decisão.</strong></p>' +
          '<ol><li><strong>Comece no PostgreSQL</strong> e só adicione outro armazenamento quando uma necessidade medida (latência, volume, tipo de consulta) não couber. Ele guarda JSON indexável (<code>JSONB</code> + GIN), busca textual, séries temporais razoáveis e vetores (<code>pgvector</code>), tudo na mesma transação.</li>' +
          '<li><strong>Cada sistema adicional é uma fonte de inconsistência.</strong> Dois armazenamentos sem transação comum exigem estratégia de sincronização (outbox, reconstrução a partir da fonte da verdade). Declare qual é a fonte da verdade e trate os demais como derivados recriáveis.</li>' +
          '<li><strong>"NoSQL escala" é meia verdade:</strong> abre mão de garantias (joins, transações, consistência) para particionar. Um PostgreSQL bem indexado e com réplicas de leitura atende, em geral, uma ordem de grandeza maior do que o produto médio alcança.</li></ol>' +
          '<p>No M07, o <code>pgvector</code> aparece exatamente por isso: os embeddings ficam numa coluna <code>vector</code> da mesma tabela e transação dos metadados, e a consulta de similaridade combina com <code>WHERE</code> relacional (tenant, permissão, data). O que você aprendeu sobre índices vale ali: um índice aproximado (HNSW/IVFFlat) é, como qualquer índice, uma troca de custo de escrita e de exatidão por velocidade de leitura, e precisa ser medido com o <code>EXPLAIN</code>.</p>' },
        { tipo: 'takeaway', html: 'Comece no <mark>relacional</mark>; some outro armazenamento por <mark>necessidade medida</mark> e com <mark>fonte única da verdade</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'f05b6-python-allow', titulo: 'Lista de permissão para ORDER BY', obrigatorio: false,
          enunciado: 'Identificadores não são parametrizáveis. Complete <code>consulta_livros(ordem, direcao)</code>: devolve <code>SELECT id, title FROM book ORDER BY &lt;coluna&gt; &lt;direção&gt;</code> usando só os mapas <code>BOOK_ORDER_COLUMNS</code> e <code>DIRECOES</code>. Entrada fora dos mapas levanta <code>ValueError</code>.',
          codigo: BOOK_ORDER + 'def consulta_livros(ordem, direcao="asc"):\n    # busque nos mapas; se faltar, levante ValueError\n    coluna = ordem\n    sentido = direcao\n    return f"SELECT id, title FROM book ORDER BY {coluna} {sentido}"\n\n\nprint(consulta_livros("titulo", "desc"))\n',
          testes: 'def test_caminho_feliz():\n    assert consulta_livros("titulo", "desc") == "SELECT id, title FROM book ORDER BY title DESC"\n    assert consulta_livros("ano") == "SELECT id, title FROM book ORDER BY published_year ASC"\n\n\ndef test_injecao_em_identificador_rejeitada():\n    for ruim in ["title; DROP TABLE book", "title--", "1", ""]:\n        try:\n            consulta_livros(ruim)\n            assert False, "deveria rejeitar " + repr(ruim)\n        except ValueError:\n            pass\n\n\ndef test_direcao_fora_do_mapa():\n    try:\n        consulta_livros("titulo", "desc; DROP TABLE book")\n        assert False, "deveria rejeitar"\n    except ValueError:\n        pass\n\n\ndef test_controle_negativo_nome_do_banco_nao_vale():\n    # "title" é o nome real da coluna, mas não é uma chave externa válida\n    try:\n        consulta_livros("title")\n        assert False, "deveria rejeitar"\n    except ValueError:\n        pass\n',
          dica: 'Troque as duas linhas por <code>coluna = BOOK_ORDER_COLUMNS[ordem]</code> dentro de um <code>try/except KeyError</code> que levanta <code>ValueError</code>; o mesmo para <code>DIRECOES</code>.',
          solucao: BOOK_ORDER + 'def consulta_livros(ordem, direcao="asc"):\n    try:\n        coluna = BOOK_ORDER_COLUMNS[ordem]\n        sentido = DIRECOES[direcao]\n    except KeyError:\n        raise ValueError("ordenação não permitida")\n    return f"SELECT id, title FROM book ORDER BY {coluna} {sentido}"\n',
          tutorDepois: 'O que entra no texto SQL nunca é a entrada do usuário: é um valor do mapa. A entrada só escolhe qual valor do mapa.',
          callout: 'Identificadores agora passam por lista de permissão.' },
        { tipo: 'python', id: 'f05b6-python-migr', titulo: 'Migration transacional', obrigatorio: false,
          enunciado: 'Complete <code>aplicar_migrations(estado, migrations)</code>. <code>estado</code> tem <code>"versao"</code> e <code>"tabelas"</code> (um conjunto). Cada migration é <code>(versao, passos)</code>, com passos que mutam o conjunto de tabelas. Aplique só as pendentes, cada uma como transação: se um passo falhar, nada daquela migration pode ficar (versão e tabelas voltam ao que eram) e o erro sobe.',
          codigo: 'def aplicar_migrations(estado, migrations):\n    for versao, passos in sorted(migrations, key=lambda m: m[0]):\n        if versao <= estado["versao"]:\n            continue\n        # 1. trabalhe numa cópia (a transação)\n        # 2. se um passo falhar, o estado original não muda: deixe a exceção subir\n        # 3. se todos passarem, confirme: copie para o estado e avance a versão\n        for passo in passos:\n            passo(estado["tabelas"])\n        estado["versao"] = versao\n    return estado\n\n\nprint(aplicar_migrations({"versao": 0, "tabelas": set()}, [(1, [lambda t: t.add("author")])]))\n',
          testes: 'def add(nome):\n    return lambda tabelas: tabelas.add(nome)\n\n\ndef quebra(tabelas):\n    raise RuntimeError("instrução quebrada")\n\n\ndef test_aplica_pendentes_em_ordem():\n    e = {"versao": 0, "tabelas": set()}\n    aplicar_migrations(e, [(2, [add("idx")]), (1, [add("author")])])\n    assert e["versao"] == 2\n    assert e["tabelas"] == {"author", "idx"}\n\n\ndef test_ja_aplicada_nao_roda_de_novo():\n    chamadas = []\n    e = {"versao": 1, "tabelas": {"author"}}\n    aplicar_migrations(e, [(1, [lambda t: chamadas.append(1)])])\n    assert chamadas == []\n    assert e["versao"] == 1\n\n\ndef test_falha_injetada_desfaz_a_migration_inteira():\n    e = {"versao": 0, "tabelas": set()}\n    try:\n        aplicar_migrations(e, [(1, [add("a")]), (2, [add("b")]), (3, [add("half_done"), quebra])])\n        assert False, "deveria levantar"\n    except RuntimeError:\n        pass\n    assert e["versao"] == 2\n    assert "half_done" not in e["tabelas"]\n    assert e["tabelas"] == {"a", "b"}\n\n\ndef test_controle_negativo_sem_migrations():\n    e = {"versao": 3, "tabelas": {"x"}}\n    aplicar_migrations(e, [])\n    assert e == {"versao": 3, "tabelas": {"x"}}\n',
          dica: 'Crie <code>copia = set(estado["tabelas"])</code>, rode os passos nela e só no fim faça <code>estado["tabelas"] = copia</code> e <code>estado["versao"] = versao</code>.',
          solucao: 'def aplicar_migrations(estado, migrations):\n    for versao, passos in sorted(migrations, key=lambda m: m[0]):\n        if versao <= estado["versao"]:\n            continue\n        copia = set(estado["tabelas"])\n        for passo in passos:\n            passo(copia)\n        estado["tabelas"] = copia\n        estado["versao"] = versao\n    return estado\n',
          tutorDepois: 'É o teste do lab em miniatura: a migration 003 quebrada deixa a versão em 2 e half_done não existe. No MySQL, onde o DDL não é transacional, o equivalente deixaria o primeiro CREATE confirmado.',
          callout: 'A migration agora é tudo-ou-nada.' },
        { tipo: 'ordene', id: 'f05b6-ordene', titulo: 'Renomeie uma coluna sem parada', obrigatorio: false,
          enunciado: 'Ordene as etapas do padrão expand/contract para trocar <code>nome</code> por <code>full_name</code> sem derrubar a versão antiga do aplicativo.',
          itens: [
            { id: 'contract', texto: 'Contract: remover a coluna antiga numa migration posterior' },
            { id: 'ler', texto: 'O código passa a ler só da coluna nova' },
            { id: 'expand', texto: 'Expand: adicionar full_name anulável, sem quebrar o código antigo' },
            { id: 'backfill', texto: 'Backfill dos dados antigos em lotes' },
            { id: 'escrever', texto: 'O código passa a escrever nas duas colunas' }
          ],
          solucao: ['expand', 'escrever', 'backfill', 'ler', 'contract'],
          dica: 'Começa adicionando sem remover nada e termina removendo o que ninguém mais lê.',
          tutorDepois: 'Em cada passo, tanto a versão antiga quanto a nova do aplicativo funcionam: por isso não há parada.' },
        { tipo: 'cenario', id: 'f05b6-cenario', titulo: 'Onde guardar os embeddings', obrigatorio: false,
          enunciado: 'A equipe de RAG quer guardar embeddings e metadados (tenant, permissão, data) dos documentos. Decida onde.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O volume é moderado e as consultas combinam similaridade com filtro por tenant e permissão. Qual a primeira proposta que você defende?', opcoes: [
              { texto: 'Um banco vetorial dedicado, separado do relacional, "porque é o certo para vetores".', vai: 'f-dois', tom: 'ruim', consequencia: 'dois armazenamentos sem transação comum: você precisa de estratégia de sincronização e de uma fonte da verdade declarada.' },
              { texto: 'PostgreSQL com pgvector: coluna vector na mesma tabela e transação dos metadados.', vai: 'pg', tom: 'ok', consequencia: 'a consulta de similaridade combina com WHERE relacional e tudo fica na mesma transação.' }
            ] },
            pg: { texto: 'A latência medida de busca ficou aceitável, mas um índice aproximado (HNSW/IVFFlat) vai ser criado. O que você lembra?', opcoes: [
              { texto: 'É uma troca de custo de escrita e de exatidão (recall < 100%) por velocidade de leitura, e precisa ser medida com EXPLAIN.', vai: 'f-bom', tom: 'ok', consequencia: 'o mesmo raciocínio dos índices do bloco 4.' },
              { texto: 'Índice vetorial é exato, então dispensa medição.', vai: 'f-exato', tom: 'ruim', consequencia: 'a busca aproximada pode perder vizinhos: o recall é menor que 100%.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Uma fonte da verdade, consulta relacional + vetorial na mesma transação, índice aproximado medido.' },
            'f-dois': { bom: false, texto: 'Dois sistemas a sincronizar e divergências difíceis de detectar, sem necessidade medida.' },
            'f-exato': { bom: false, texto: 'Resultados sutilmente incompletos em produção, sem medição para perceber.' }
          },
          callout: 'Você começou no PostgreSQL e tratou o índice aproximado como mais uma troca a medir.' },
        { tipo: 'escolha', id: 'f05b6-escolha-orderby', titulo: 'Confira: ORDER BY com a coluna do usuário',
          pergunta: 'A consulta usa <code>cursor.execute("SELECT * FROM livro ORDER BY " + coluna)</code>. Parâmetros <code>?</code> resolvem a injeção neste caso?',
          opcoes: [
            { id: 'a', texto: 'Não: parâmetros valem para <em>valores</em>, não para identificadores; use lista de permissão de nomes de coluna.', correta: true, porque: '<code>ORDER BY ?</code> ordenaria por uma constante textual. Valide contra um dicionário fixo e rejeite o resto.' },
            { id: 'b', texto: 'Sim: basta trocar por <code>ORDER BY ?</code> e passar a coluna como parâmetro.', correta: false, porque: 'ordena por uma constante, não pela coluna.' },
            { id: 'c', texto: 'Sim, desde que a coluna seja escapada com aspas simples.', correta: false, porque: 'escapar à mão é o caminho clássico para o próximo bypass.' },
            { id: 'd', texto: 'Não há risco, porque <code>ORDER BY</code> não executa comandos.', correta: false, porque: 'a injeção em identificador existe.' }
          ], tutorDepois: 'Identificador não é valor.' },
        { tipo: 'escolha', id: 'f05b6-escolha-mig', titulo: 'Confira: a migration esquecida',
          pergunta: 'A migration 002 já foi aplicada em produção e esqueceu um índice. O que fazer?',
          opcoes: [
            { id: 'a', texto: 'Editar a 002 e reaplicar, já que o histórico é só documentação.', correta: false, porque: 'ambientes divergem em silêncio.' },
            { id: 'b', texto: 'Criar a migration 003 com o índice; nunca editar uma migration já aplicada.', correta: true, porque: 'corrigir para frente mantém todos os bancos reprodutíveis a partir do mesmo histórico; a etapa expand/contract evita parar o serviço.' },
            { id: 'c', texto: 'Criar o índice manualmente no servidor e não registrar em lugar nenhum.', correta: false, porque: 'quebra a reprodutibilidade.' },
            { id: 'd', texto: 'Apagar a tabela de controle de versões para o runner rodar tudo de novo.', correta: false, porque: 'reaplicar tudo sobre um banco existente é destrutivo.' }
          ], tutorDepois: 'Migration aplicada é história.' },
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs e erros comuns', html:
          '<ul><li><strong>ORM como substituto de entender SQL:</strong> o ORM gera o SQL; a lentidão, o N+1 e o bloqueio continuam sendo seus. Leia o SQL que ele emite (log de statements) e os planos.</li>' +
          '<li><strong>Repositório que expõe a conexão por toda parte</strong> e deixa cada chamador decidir a fronteira de transação. O dono da transação deve ser claro (no lab, cada método público do repositório abre a sua; não aninhe).</li>' +
          '<li><strong>Esquema só no ORM, sem restrições no banco:</strong> as invariantes passam a valer só para o código que usa o ORM.</li>' +
          '<li><strong>Guardar tudo como <code>TEXT</code>/JSON "para ser flexível":</strong> flexibilidade que se paga com validação espalhada e relatórios impossíveis.</li>' +
          '<li><strong>SQLite em teste e PostgreSQL em produção sem camada de integração real:</strong> tipos, isolamento, <code>ORDER BY</code> de <code>NULL</code>, agrupamento permissivo e planos divergem. Para testes unitários de lógica, ok; para o que toca o banco, rode contra o banco real.</li></ul>' },
        { tipo: 'texto', html: '<p class="ta-nota">Estado verificado em 11/10/2026 (saídas do lab: SQLite 3.53.1, Python 3.14.7). Comportamentos do PostgreSQL valem para as versões 12 a 17 (<code>MERGE</code>: 15+; <code>CYCLE</code>: 14+; <code>UNIQUE NULLS NOT DISTINCT</code>: 15+) e devem ser revalidados em até 90 dias. Sem servidor PostgreSQL no laboratório, as afirmações sobre ele vêm da documentação oficial, não de execução local.</p>' },
        { tipo: 'takeaway', html: 'Do domínio ao esquema, do esquema à <mark>migration</mark>, da migration ao código com <mark>parâmetros</mark>: relacional é o padrão e a exceção precisa ser <mark>medida</mark>.' }
      ] }
    ]
  });
})();
