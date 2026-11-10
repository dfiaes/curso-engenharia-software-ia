/* M03 · Bloco 3: Postgres para valer (índices, planos, transações, JSONB). Fonte: M03.html#b03. Saídas de EXPLAIN são ilustrativas (exemplo variável), como na fonte. Fontes consultadas em 21/08/2026 (revalidar em até 90 dias). Os python usam sqlite3 (EXPLAIN QUERY PLAN) como equivalente didático. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var b3Codigo = [
    "import sqlite3",
    "",
    "",
    "def novo_banco():",
    "    conn = sqlite3.connect(\":memory:\", isolation_level=None)",
    "    conn.execute(",
    "        \"CREATE TABLE links (id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE,\"",
    "        \" url TEXT NOT NULL, hits INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)\"",
    "    )",
    "    conn.executemany(",
    "        \"INSERT INTO links (slug, url, created_at) VALUES (?, ?, ?)\",",
    "        [(f\"s{i}\", f\"https://exemplo.dev/{i}\", i) for i in range(1, 2001)],",
    "    )",
    "    return conn",
    "",
    "",
    "def plano(conn, sql, params=()):",
    "    \"\"\"O EXPLAIN do SQLite: texto de cada nó do plano.\"\"\"",
    "    return \" | \".join(r[3] for r in conn.execute(\"EXPLAIN QUERY PLAN \" + sql, params))",
    "",
    "",
    "def criar_indices(conn):",
    "    \"\"\"Crie ix_links_created_at para servir à listagem 'recentes' sem varrer e ordenar a tabela.\"\"\"",
    "",
    "",
    "def incrementar_atomico(conn, slug):",
    "    \"\"\"Some no banco (hits = hits + 1). Devolve True se a linha existe, False se não.\"\"\"",
    "    return False",
    "",
    "",
    "def incrementar_ingenuo_intercalado(conn, slug, n):",
    "    \"\"\"n requests leem o mesmo valor antes de qualquer escrita; cada um grava leitura + 1.\"\"\"",
    "    lidos = [conn.execute(\"SELECT hits FROM links WHERE slug = ?\", (slug,)).fetchone()[0] for _ in range(n)]",
    "    for lido in lidos:",
    "        conn.execute(\"UPDATE links SET hits = ? WHERE slug = ?\", (lido + 1, slug))",
    "",
    "",
    "RECENTES = \"SELECT slug FROM links ORDER BY created_at DESC LIMIT 20\"",
    "db = novo_banco()",
    "print(plano(db, RECENTES))"
  ].join('\n');
  var b3Testes = [
    "def test_sem_indice_o_plano_ordena_a_tabela_inteira():",
    "    db = novo_banco()",
    "    p = plano(db, RECENTES)",
    "    assert \"USING INDEX\" not in p and \"COVERING INDEX\" not in p",
    "    assert \"TEMP B-TREE\" in p",
    "",
    "",
    "def test_com_indice_a_listagem_deixa_de_ordenar():",
    "    db = novo_banco()",
    "    criar_indices(db)",
    "    p = plano(db, RECENTES)",
    "    assert \"ix_links_created_at\" in p",
    "    assert \"TEMP B-TREE\" not in p",
    "",
    "",
    "def test_busca_por_slug_usa_a_constraint_como_indice():",
    "    db = novo_banco()",
    "    criar_indices(db)",
    "    p = plano(db, \"SELECT url FROM links WHERE slug = ?\", (\"s77\",))",
    "    assert p.startswith(\"SEARCH\") and \"INDEX\" in p",
    "",
    "",
    "def test_atomico_fecha_exato():",
    "    db = novo_banco()",
    "    for _ in range(50):",
    "        assert incrementar_atomico(db, \"s1\") is True",
    "    assert db.execute(\"SELECT hits FROM links WHERE slug = 's1'\").fetchone()[0] == 50",
    "",
    "",
    "def test_slug_inexistente_devolve_false():",
    "    db = novo_banco()",
    "    assert incrementar_atomico(db, \"nao-existe\") is False",
    "",
    "",
    "def test_controle_negativo_ler_somar_gravar_perde_incrementos():",
    "    db = novo_banco()",
    "    incrementar_ingenuo_intercalado(db, \"s2\", 50)",
    "    assert db.execute(\"SELECT hits FROM links WHERE slug = 's2'\").fetchone()[0] < 50"
  ].join('\n');
  var b3Solucao = [
    "import sqlite3",
    "",
    "",
    "def novo_banco():",
    "    conn = sqlite3.connect(\":memory:\", isolation_level=None)",
    "    conn.execute(",
    "        \"CREATE TABLE links (id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE,\"",
    "        \" url TEXT NOT NULL, hits INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)\"",
    "    )",
    "    conn.executemany(",
    "        \"INSERT INTO links (slug, url, created_at) VALUES (?, ?, ?)\",",
    "        [(f\"s{i}\", f\"https://exemplo.dev/{i}\", i) for i in range(1, 2001)],",
    "    )",
    "    return conn",
    "",
    "",
    "def plano(conn, sql, params=()):",
    "    return \" | \".join(r[3] for r in conn.execute(\"EXPLAIN QUERY PLAN \" + sql, params))",
    "",
    "",
    "def criar_indices(conn):",
    "    conn.execute(\"CREATE INDEX ix_links_created_at ON links (created_at DESC)\")",
    "",
    "",
    "def incrementar_atomico(conn, slug):",
    "    cur = conn.execute(\"UPDATE links SET hits = hits + 1 WHERE slug = ?\", (slug,))",
    "    return cur.rowcount == 1",
    "",
    "",
    "def incrementar_ingenuo_intercalado(conn, slug, n):",
    "    lidos = [conn.execute(\"SELECT hits FROM links WHERE slug = ?\", (slug,)).fetchone()[0] for _ in range(n)]",
    "    for lido in lidos:",
    "        conn.execute(\"UPDATE links SET hits = ? WHERE slug = ?\", (lido + 1, slug))",
    "",
    "",
    "RECENTES = \"SELECT slug FROM links ORDER BY created_at DESC LIMIT 20\""
  ].join('\n');

  var SQL_RECENTES = 'EXPLAIN (ANALYZE) SELECT * FROM links ORDER BY created_at DESC LIMIT 20;';
  var etapasPlano = function () {
    return [
      { id: 'antes', nome: 'Sem índice', descricao: 'Seq Scan + Sort', tom: 'dns', ms: 412.7, linhas: [
        L('out', 'Limit  (cost=18334.1..18334.2 rows=20)'),
        L('out', '  ->  Sort  (cost=18334.1..19584.1 rows=500000)'),
        L('out', '        Sort Key: created_at DESC'),
        L('out', '        ->  Seq Scan on links  (cost=0.00..8334.00 rows=500000)'),
        L('out', 'Execution Time: 412.7 ms'),
        L('hint', 'saída ilustrativa: a tabela inteira é lida e ordenada para devolver 20 linhas; Seq Scan + Sort é o alarme')] },
      { id: 'indice', nome: 'Criar o índice', descricao: 'B-tree em created_at DESC', tom: 'tcp', ms: 1, linhas: [
        L('cmd', 'CREATE INDEX ix_links_created_at ON links (created_at DESC);'),
        L('hint', 'o preço: cada INSERT agora também mantém esse índice')] },
      { id: 'depois', nome: 'Com índice', descricao: 'Index Scan', tom: 'response', ms: 0.4, linhas: [
        L('cmd', SQL_RECENTES),
        L('out', 'Limit  (cost=0.42..1.95 rows=20)'),
        L('out', '  ->  Index Scan using ix_links_created_at on links'),
        L('out', '        (cost=0.42..38000.00 rows=500000)'),
        L('out', 'Execution Time: 0.4 ms'),
        L('hint', 'saída ilustrativa: o invariante é o nó certo sobre o índice certo, não os milissegundos')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm03-b3',
    titulo: 'Postgres para valer: índices, planos, transações e JSONB',
    minutos: 45,
    resumo: 'Com centenas de milhares de linhas, três perguntas decidem cada endpoint: existe índice para o predicado, o plano confirma que ele é usado e o dado variável tem um lar que não destrói o schema.',
    objetivo: 'Escolher índice pelo predicado sabendo que escrita paga cada um, ler um plano comparando estimativa e realidade, corrigir lost update somando no banco e decidir o que é coluna relacional e o que é JSONB.',
    revisao: [
      { id: 'm03b3-composto', pergunta: 'Existe um índice composto em <code>(user_id, created_at)</code>. Qual consulta ele não atende bem?',
        opcoes: [
          opc('a', '<code>WHERE created_at &gt; now() - interval \'1 day\'</code>, sem filtrar por <code>user_id</code>', true, 'índice composto vale pelo prefixo: serve a (a) e (a, b), não a (b) sozinho.'),
          opc('b', '<code>WHERE user_id = 7</code>', false, 'é o prefixo do índice.'),
          opc('c', '<code>WHERE user_id = 7 ORDER BY created_at DESC</code>', false, 'prefixo mais ordenação pela segunda coluna: o índice serve.')] },
      { id: 'm03b3-estimativa', pergunta: 'O <code>EXPLAIN ANALYZE</code> mostra <code>rows=1</code> estimado e 80.000 reais no mesmo nó. Qual é o diagnóstico mais provável?',
        opcoes: [
          opc('a', 'Estatísticas do planejador desatualizadas; o primeiro passo é <code>ANALYZE</code> na tabela', true, 'o planejador decide com um mapa velho; adicionar índice sem corrigir a estimativa pode nem ser usado.'),
          opc('b', 'Falta um índice B-tree em qualquer coluna', false, 'a divergência é de estimativa, não de índice.'),
          opc('c', 'O hardware está lento', false, 'tempo absoluto varia por máquina; o invariante é o nó e a estimativa.')] },
      { id: 'm03b3-lost', pergunta: 'Como se corrige o lost update de um contador sob READ COMMITTED, do mais simples ao mais forte?',
        opcoes: [
          opc('a', 'Update atômico no banco (<code>hits = hits + 1</code>), <code>SELECT ... FOR UPDATE</code> ou coluna de versão', true, 'o banco soma dentro do UPDATE, sem janela entre ler e gravar.'),
          opc('b', 'Ler, somar 1 em Python e gravar', false, 'duas transações leem o mesmo valor e uma sobrescreve a outra, sem erro algum.'),
          opc('c', 'Aumentar o pool de conexões', false, 'mais conexões só aumentam a concorrência sobre a mesma linha.')] },
      { id: 'm03b3-jsonb', pergunta: 'Como o módulo divide o que é coluna relacional e o que é JSONB?',
        opcoes: [
          opc('a', 'O que se consulta sempre vira coluna; a cauda variável vai em JSONB, com schema validado no Pydantic e índice GIN', true, 'JSONB sem validação e sem GIN troca uma migration por semana por consultas sem plano estável.'),
          opc('b', 'Tudo em JSONB, para evitar migrations', false, 'perde junções, transações e validação.'),
          opc('c', 'Tudo em colunas, uma por variação', false, 'significa uma migration por semana.')] },
      { id: 'm03b3-invariante', pergunta: 'O que é o invariante que um plano sustenta, em vez do tempo absoluto?',
        opcoes: [
          opc('a', 'O nó certo (por exemplo, <code>Index Scan</code>) sobre o índice certo para o predicado crítico', true, 'tempo varia por máquina; a presença do nó certo se lê no plano.'),
          opc('b', 'Um tempo de execução abaixo de 1 ms', false, 'depende de hardware, volume e estatísticas.'),
          opc('c', 'O custo estimado ser o menor possível', false, 'custo é uma unidade abstrata do planejador.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O encurtador funciona com poucos links. Com centenas de milhares de linhas, três perguntas passam a decidir cada endpoint: existe um índice que sirva ao predicado da consulta; o plano de execução confirma que ele é usado; e os atributos de formato variável têm um lar que não destrói o schema. Sem essas respostas, a API degrada em silêncio: latência que cresce com a tabela, contadores que perdem increments sob concorrência e uma coluna nova por semana. Esta aula ensina a prever o custo antes do deploy, ler o plano depois dele e separar coluna relacional de documento.</p>' +
          '<h3>Índices</h3><p>Escolha um tipo para ver quando serve.</p>' },
        { tipo: 'abas', rotulo: 'Índice', itens: [
          { rotulo: 'B-tree', blocos: [{ tipo: 'texto', html: '<p>É o padrão e serve a <code>=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>ORDER BY</code> e prefixo de <code>LIKE</code>. Pense numa árvore de busca: O(log n) para localizar, mas cada <code>INSERT</code> e <code>UPDATE</code> paga a manutenção de <em>todos</em> os índices da tabela. <strong>Índice não é grátis: é troca de escrita por leitura.</strong></p>' }] },
          { rotulo: 'Composto', blocos: [{ tipo: 'texto', html: '<p>O índice <code>(a, b)</code> serve a consultas por (a) e por (a, b), não por (b). A ordem das colunas segue a seletividade e o padrão de consulta: a coluna mais filtrada primeiro.</p>' }] },
          { rotulo: 'Parcial e de expressão', blocos: [{ tipo: 'texto', html: '<p>Índice parcial (<code>WHERE status = \'active\'</code>) e índice de expressão (<code>ON lower(email)</code>) indexam só o que se consulta e se mantêm pequenos.</p>' }] },
          { rotulo: 'Seletividade', blocos: [{ tipo: 'texto', html: '<p>Seletividade decide tudo: índice em coluna com pouquíssimos valores distintos raramente compensa (o planejador escolhe varredura sequencial mesmo assim); em coluna quase única, quase sempre. O planejador usa estatísticas (<code>ANALYZE</code>), e estatística desatualizada gera plano ruim.</p>' }] },
          { rotulo: 'GIN', blocos: [{ tipo: 'texto', html: '<p><strong>GIN</strong> é o índice para o conteúdo <em>dentro</em> da coluna: arrays, texto integral e JSONB. O B-tree localiza a <em>linha</em>; o GIN localiza <em>o que há nela</em>.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>EXPLAIN: o raio-X da consulta</h3>' +
          '<p><code>EXPLAIN</code> mostra o plano que o planejador escolheu, sem executar a consulta. Com <code>ANALYZE</code>, ele executa e acrescenta tempos reais. A leitura é sempre a mesma comparação: o que o planejador <em>estimou</em> contra o que <em>aconteceu</em>.</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto: 'EXPLAIN (ANALYZE, BUFFERS)\nSELECT * FROM links WHERE slug = \'abc123\';' },
        { tipo: 'texto', html: '<p>Saída ilustrativa (exemplo variável: tempos e custos dependem de hardware, volume e estatísticas; o formato dos campos é o estável). Leia de baixo para cima; nós internos consomem filhos.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'Index Scan using ix_links_slug on links  (cost=0.29..8.31 rows=1 width=64)',
          '                                          (actual time=0.041..0.043 rows=1 loops=1)',
          '  Index Cond: (slug = \'abc123\'::text)',
          'Planning Time: 0.180 ms',
          'Execution Time: 0.071 ms'].join('\n') },
        { tipo: 'texto', html:
          '<ul><li><code>cost=0.29..8.31</code> é a estimativa (custo de partida..custo total, em unidades abstratas); <code>actual time</code> é a realidade, em ms. Quando divergem muito (estimadas 1 linha, reais 80.000), o problema é estatística: <code>ANALYZE tabela;</code>.</li>' +
          '<li>Quatro nós resolvem a maioria das leituras: <strong>Seq Scan</strong> (leu a tabela inteira: aceitável em tabela pequena, alarme em grande), <strong>Index Scan</strong> (percorreu a árvore), <strong>Index Only Scan</strong> (respondeu só com o índice) e <strong>Nested Loop / Hash Join</strong> (estratégia de junção; nested loop com milhares de iterações denuncia um N+1 no plano).</li>' +
          '<li><code>BUFFERS</code> mostra páginas lidas de cache (<code>shared hit</code>) contra disco (<code>read</code>): a diferença entre milissegundos e centenas de milissegundos.</li></ul>' +
          '<p>A decisão que o plano sustenta: o predicado crítico (busca por slug, listagem recente por data) usa o índice escolhido, e isso se lê <em>no nó</em>, não no cronômetro.</p>' },
        { tipo: 'takeaway', html: 'O que o plano sustenta é o <mark>nó certo sobre o índice certo</mark>; <mark>estimativa x realidade</mark> divergentes apontam <mark>estatística</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Antes e depois de um índice</h3>' +
          '<p>A listagem "links recentes" ordena por <code>created_at</code>. Preveja o plano depois do índice e rode a sequência. Saídas ilustrativas, como na fonte.</p>' },
        { tipo: 'rode', id: 'b3-rode-plano', titulo: 'Seq Scan + Sort vira Index Scan',
          enunciado: 'Rode a sequência e clique em cada etapa. A barra mostra o tempo de execução ilustrativo em ms.',
          prefixo: 'Prompt', entrada: SQL_RECENTES, unidade: 'ms', terminalTitulo: 'psql', etapas: etapasPlano(),
          prever: { pergunta: 'Depois de criar o índice em <code>created_at DESC</code>, o que o plano de <code>ORDER BY created_at DESC LIMIT 20</code> deixa de fazer?', opcoes: [
            { id: 'a', texto: 'Ler a tabela inteira e ordenar tudo para devolver 20 linhas.', correta: true, porque: 'o índice já guarda a ordem: o plano percorre a árvore e para nas 20 primeiras.' },
            { id: 'b', texto: 'Nada: o planejador ignora índice em consulta com <code>LIMIT</code>.', correta: false, porque: 'justamente com <code>LIMIT</code> e <code>ORDER BY</code> o índice ordenado paga mais.' },
            { id: 'c', texto: 'Cobrar manutenção nas escritas.', correta: false, porque: 'o índice passa a cobrar manutenção; essa é a troca, não algo que deixa de existir.' }
          ] },
          tutorAntes: 'Aperte Enter, depois clique em "Sem índice" e em "Com índice" para comparar os nós.',
          tutorDepois: 'O alarme era o par Seq Scan + Sort. Depois do índice o nó é Index Scan sobre <code>ix_links_created_at</code>. O preço aparece do outro lado: cada índice novo torna cada escrita mensuravelmente mais lenta, e a troca é decidida por predicado, não por hábito.',
          callout: 'Você viu o nó do plano mudar com o índice e o custo de escrita que vem junto.' },
        { tipo: 'texto', html:
          '<h3>JSONB: relacional para o estável, documento para o variável</h3>' +
          '<p>Sistemas que consomem modelos produzem dado semiestruturado: respostas com campos que variam por versão, metadados de execução (modelo, tokens, custo, latência), configuração por tenant. Uma coluna por variação é uma migration por semana; despejar tudo num armazenamento sem schema perde junções, transações e validação. <strong>JSONB</strong> é a terceira via do PostgreSQL: colunas relacionais para o estável e consultado sempre, e uma coluna JSONB para a cauda variável, indexável com GIN.</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto: [
          '-- exemplo variável: o padrão núcleo relacional + cauda flexível',
          'CREATE TABLE analises (',
          '    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
          '    tenant_id   bigint NOT NULL REFERENCES tenants(id),',
          '    status      text   NOT NULL DEFAULT \'pending\',',
          '    custo_cents int    NOT NULL DEFAULT 0,',
          '    resultado   jsonb  NOT NULL DEFAULT \'{}\'::jsonb,   -- a cauda variável',
          '    created_at  timestamptz NOT NULL DEFAULT now()',
          ');',
          'CREATE INDEX ix_analises_resultado ON analises USING gin (resultado);',
          '',
          '-- operadores que você vai usar:',
          'SELECT resultado->>\'modelo\' FROM analises;                     -- extrai como texto',
          'SELECT * FROM analises WHERE resultado @> \'{"modelo": "gpt"}\'; -- contém (usa o GIN!)',
          'SELECT * FROM analises WHERE resultado ? \'warnings\';           -- tem a chave?'].join('\n') },
        { tipo: 'callout', tom: 'info', titulo: 'Referência do conceito', html:
          '<p>JSONB armazena documentos JSON em representação própria do PostgreSQL e oferece operadores de consulta. O formato não elimina a necessidade de schema, validação e índices: o que se consulta sempre vira coluna; o schema do documento mora no Pydantic; o acesso por chave usa índice GIN. JSONB como substituto do schema relacional, sem validação e sem índice, troca uma migration por semana por consultas sem plano estável.</p>' },
        { tipo: 'takeaway', html: 'Um <mark>índice</mark> troca escrita por leitura e o <mark>plano</mark> prova o uso; <mark>JSONB</mark> recebe a cauda variável, com <mark>schema validado</mark> e GIN.' }
      ] },

      { rotulo: 'Lost update', blocos: [
        { tipo: 'texto', html:
          '<h3>Simulador do módulo: lost update em READ COMMITTED</h3>' +
          '<p>N requests incrementam o contador <code>hits</code> ao mesmo tempo, e o valor final deveria ser exatamente N. Na página original você escolhe a estratégia e roda; aqui, o que cada uma garante:</p>' },
        { tipo: 'abas', rotulo: 'Estratégia', itens: [
          { rotulo: 'Ler, somar, gravar (Python)', blocos: [{ tipo: 'texto', html: '<p>Cada rodada de requests lê o mesmo valor antes de qualquer escrita, e todos gravam <em>base + 1</em>. O resultado final fica abaixo de N, <strong>sem nenhum erro</strong>: dois requests leram o mesmo valor e um sobrescreveu o outro.</p>' }] },
          { rotulo: 'UPDATE hits = hits + 1', blocos: [{ tipo: 'texto', html: '<p>O banco soma dentro do <code>UPDATE</code>; não há janela entre ler e gravar. <strong>É a correção mais simples e a mais barata.</strong></p>' }] },
          { rotulo: 'SELECT ... FOR UPDATE', blocos: [{ tipo: 'texto', html: '<p>Trava pessimista: serializa os requests naquela linha. Custa espera e traz risco de deadlock se a ordem de travas variar.</p>' }] },
          { rotulo: 'Coluna de versão', blocos: [{ tipo: 'texto', html: '<p>Trava otimista: quem perde a corrida de versão refaz a leitura (retry). Bom para baixa contenção.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Do sintoma ao conserto</h3>' +
          '<ul><li><strong>Listagem "recentes" lenta.</strong> Ordenar por <code>created_at</code> sem índice dá Seq Scan + Sort. O índice <code>(created_at DESC)</code> leva o plano a Index Scan; o preço é cada escrita ficar mais lenta.</li>' +
          '<li><strong>Contador <code>hits</code> incrementado em Python.</strong> Sob concorrência duas transações leem o mesmo valor e perdem updates. O conserto é somar no banco; o laboratório prova os dois comportamentos com teste concorrente.</li>' +
          '<li><strong>Metadados de origem e campanha que variam a cada trimestre.</strong> Viram coluna <code>meta</code> JSONB com índice GIN e consulta por contenção (<code>@&gt;</code>), adicionada por migration Alembic com downgrade, o ciclo do bloco 2 aplicado a um tipo novo.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Contraste: medir uma vez não é provar para sempre', html:
          '<ul><li><strong>Plano lido, estatística velha.</strong> Um <code>EXPLAIN</code> de hoje não garante o plano de amanhã; sem <code>ANALYZE</code> após carga relevante, o planejador decide com mapa desatualizado.</li>' +
          '<li><strong>Índice em tudo.</strong> Cada índice acelera uma leitura e taxa todas as escritas. Índice sem predicado que o use é custo puro.</li>' +
          '<li><strong>JSONB sem validação.</strong> Documento sem schema Pydantic e sem GIN acumula chaves inconsistentes e consultas sequenciais: o pântano sem schema que o tipo prometia evitar.</li></ul>' },
        { tipo: 'takeaway', html: 'Lost update se corrige <mark>somando no banco</mark>; concorrência se <mark>prova com teste</mark>, não com argumento.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html: '<p>Os dois python abaixo usam <code>sqlite3</code>: o <code>EXPLAIN QUERY PLAN</code> do SQLite tem outro formato que o do PostgreSQL, mas o invariante é o mesmo (o nó que usa o índice certo, em vez de varrer e ordenar).</p>' },
        { tipo: 'python', id: 'b3-python', titulo: 'Índice por predicado e incremento atômico', obrigatorio: false,
          enunciado: 'Implemente <code>criar_indices</code> (o índice <code>ix_links_created_at</code> que tira o <code>TEMP B-TREE</code> do plano da listagem) e <code>incrementar_atomico</code> (soma no banco e devolve se a linha existia). O último teste é o controle negativo: ler-somar-gravar perde incrementos.',
          codigo: b3Codigo, testes: b3Testes,
          dica: 'Índice: <code>CREATE INDEX ix_links_created_at ON links (created_at DESC)</code>. Incremento: <code>UPDATE links SET hits = hits + 1 WHERE slug = ?</code>; <code>cursor.rowcount</code> diz se alguma linha foi afetada.',
          solucao: b3Solucao,
          tutorDepois: 'Repare que a busca por slug já usava índice sem você criar nada: a constraint <code>UNIQUE</code> do bloco 2 cria o índice. E o atômico fecha exato porque a soma acontece dentro do UPDATE.',
          callout: 'Plano com índice e incremento atômico passaram, e o controle negativo perdeu incrementos como previsto.' },
        { tipo: 'complete', id: 'b3-complete-jsonb', titulo: 'Monte a consulta por contenção', obrigatorio: false, linguagem: 'sql',
          enunciado: 'Escolha, em cada lacuna, a peça que faz a consulta por chave do JSONB usar índice em vez de varrer a tabela.',
          partes: [
            'CREATE INDEX ix_links_meta ON links USING ', { lacuna: 'idx', opcoes: ['gin', 'btree'], correta: 'gin' },
            ' (meta);\n\nSELECT * FROM links WHERE meta ', { lacuna: 'op', opcoes: ['@>', '->>', '='], correta: '@>' },
            ' \'{"campanha": "black-friday"}\';\n'
          ],
          explicacao: 'O B-tree localiza a linha; o GIN localiza o que há dentro da coluna. O operador <code>@&gt;</code> (contém) é o que o índice GIN atende; <code>-&gt;&gt;</code> extrai texto e precisaria de índice de expressão próprio. E o documento ainda é validado no Pydantic, antes de chegar à coluna.',
          callout: 'Consulta por contenção montada: GIN mais o operador que ele atende.' },
        { tipo: 'cenario', id: 'b3-cenario', titulo: 'A listagem recente ficou lenta', obrigatorio: false,
          enunciado: 'A listagem de links recentes ordena por <code>created_at</code> em uma tabela de 500.000 linhas e leva 412,7 ms. O plano mostra Seq Scan + Sort. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O plano lê a tabela inteira e ordena tudo para devolver 20 linhas. O que você faz?', opcoes: [
              { texto: 'Criar um índice <code>(created_at DESC)</code>, o que serve ao predicado crítico.', vai: 'prova', tom: 'ok', consequencia: 'o índice atende ao ORDER BY ... LIMIT, e o preço (escrita mais cara) é conhecido.' },
              { texto: 'Indexar todas as colunas da tabela, por garantia.', vai: 'f-tudo', tom: 'ruim', consequencia: 'cada índice taxa todas as escritas, e índice sem predicado que o use é custo puro.' },
              { texto: 'Pedir uma máquina maior.', vai: 'f-hw', tom: 'ruim', consequencia: 'o tempo cai um pouco, e o plano continua lendo e ordenando a tabela inteira.' }
            ] },
            prova: { texto: 'Como você confirma que o índice resolveu?', opcoes: [
              { texto: 'Rodar <code>EXPLAIN (ANALYZE, BUFFERS)</code> e ver Index Scan sobre <code>ix_links_created_at</code>, sem o Sort.', vai: 'f-bom', tom: 'ok', consequencia: 'o invariante é o nó certo sobre o índice certo.' },
              { texto: 'Cronometrar na minha máquina: ficou rápido.', vai: 'f-cron', tom: 'ruim', consequencia: 'tempo absoluto varia por hardware, volume e cache.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Predicado atendido por índice, prova no nó do plano e custo de escrita aceito conscientemente.' },
            'f-tudo': { bom: false, texto: 'As escritas ficaram mais lentas sem que nenhuma leitura ganhasse com a maioria dos índices.' },
            'f-hw': { bom: false, texto: 'Gastou-se mais, e a latência continuou crescendo junto com a tabela.' },
            'f-cron': { bom: false, texto: 'Em produção, com outro volume e estatística velha, o plano voltou a varrer a tabela, e ninguém percebeu porque o cronômetro local estava bom.' }
          },
          callout: 'Você escolheu o índice pelo predicado e provou pelo nó do plano.' },
        { tipo: 'escolha', id: 'b3-esc-composto', titulo: 'Confira: o índice composto',
          pergunta: 'Existe um índice composto em <code>(user_id, created_at)</code>. Qual consulta <strong>não</strong> consegue usá-lo de forma eficiente?',
          opcoes: [
            { id: 'a', texto: '<code>WHERE user_id = 7</code>', correta: false, porque: 'é o prefixo do índice.' },
            { id: 'b', texto: '<code>WHERE created_at &gt; now() - interval \'1 day\'</code> (sem filtrar por <code>user_id</code>)', correta: true, porque: 'o índice composto vale pelo prefixo: filtrar só pela segunda coluna tende a cair em varredura sequencial. A ordem das colunas deve seguir o padrão de consulta.' },
            { id: 'c', texto: '<code>WHERE user_id = 7 ORDER BY created_at DESC</code>', correta: false, porque: 'prefixo mais ordenação pela segunda coluna: o índice serve.' },
            { id: 'd', texto: '<code>WHERE user_id = 7 AND created_at &gt; \'2026-01-01\'</code>', correta: false, porque: 'usa as duas colunas, na ordem do índice.' }
          ], tutorDepois: 'Índice composto vale pelo prefixo.' },
        { tipo: 'escolha', id: 'b3-esc-estimativa', titulo: 'Confira: estimativa contra realidade',
          pergunta: 'O <code>EXPLAIN ANALYZE</code> mostra <code>rows=1</code> estimado e <code>actual rows=80000</code> no mesmo nó. Qual é o diagnóstico mais provável?',
          opcoes: [
            { id: 'a', texto: 'Falta um índice B-tree em qualquer coluna da tabela.', correta: false, porque: 'adicionar índice sem corrigir a estimativa pode nem ser usado.' },
            { id: 'b', texto: 'O hardware está lento; os tempos absolutos explicam tudo.', correta: false, porque: 'tempo absoluto varia por máquina; o invariante é o nó e a estimativa.' },
            { id: 'c', texto: 'As estatísticas do planejador estão desatualizadas; o primeiro passo é <code>ANALYZE</code> na tabela.', correta: true, porque: 'divergência grande entre estimativa e realidade é sintoma de estatística velha: o planejador decide com um mapa desatualizado.' },
            { id: 'd', texto: 'O JSONB deveria virar texto simples.', correta: false, porque: 'não tem relação com a estimativa de linhas.' }
          ], tutorDepois: 'Reflexo novo: consulta nova em tabela grande passa por EXPLAIN antes do deploy, não depois do incidente.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes deste bloco: documentação do PostgreSQL (EXPLAIN, ANALYZE, JSON types, MVCC, transactions). Consultadas em 21/08/2026; documentação de banco deve ser revalidada em até 90 dias. Os planos mostrados são exemplos variáveis.</p>' },
        { tipo: 'takeaway', html: 'Consulta nova em tabela grande passa por <mark>EXPLAIN</mark> antes do deploy; o que se consulta sempre é <mark>coluna</mark>; contador se soma <mark>no banco</mark>.' }
      ] }
    ]
  });
})();
