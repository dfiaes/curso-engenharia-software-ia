/* M02A · Bloco 5: dados, transações e evolução de schema. Fonte: M02A.html#b5. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var base = [
    'import sqlite3', '', '',
    'class ConflitoIdempotencia(Exception):', '    pass', '', '',
    'def abrir():', '    conn = sqlite3.connect(":memory:")',
    '    conn.execute("CREATE TABLE avaliacoes (tenant TEXT NOT NULL, chave TEXT NOT NULL, hash TEXT NOT NULL, decisao TEXT NOT NULL, UNIQUE (tenant, chave))")',
    '    return conn', '', ''].join('\n');
  var codigo = base + [
    'def registrar(conn, tenant, chave, hash_intencao, advisor):',
    '    # mesma chave + mesmo hash: devolve (decisao, True) sem chamar o advisor',
    '    # mesma chave + outro hash: levanta ConflitoIdempotencia',
    '    # chave nova: chama o advisor e grava; devolve (decisao, False)',
    '    # se o advisor falhar, nada pode ficar gravado',
    '    return ("?", False)', ''].join('\n');
  var testes = [
    'def test_primeira_chamada_grava():',
    '    c = abrir(); chamadas = []',
    '    r = registrar(c, "t1", "k1", "h1", lambda: chamadas.append(1) or "aceitar")',
    '    assert r == ("aceitar", False) and len(chamadas) == 1', '', '',
    'def test_repeticao_compativel_reutiliza_sem_advisor():',
    '    c = abrir(); chamadas = []',
    '    f = lambda: chamadas.append(1) or "aceitar"',
    '    registrar(c, "t1", "k1", "h1", f)',
    '    assert registrar(c, "t1", "k1", "h1", f) == ("aceitar", True) and len(chamadas) == 1', '', '',
    'def test_mesma_chave_outra_intencao_e_conflito():',
    '    c = abrir(); registrar(c, "t1", "k1", "h1", lambda: "aceitar")',
    '    try:', '        registrar(c, "t1", "k1", "h2", lambda: "recusar")', '    except ConflitoIdempotencia:', '        return',
    '    raise AssertionError("conflito esperado")', '', '',
    'def test_outro_tenant_e_outro_namespace():',
    '    c = abrir(); registrar(c, "t1", "k1", "h1", lambda: "aceitar")',
    '    assert registrar(c, "t2", "k1", "h9", lambda: "recusar") == ("recusar", False)', '', '',
    'def test_falha_do_advisor_nao_deixa_rastro():',
    '    c = abrir()', '    def quebra():', '        raise RuntimeError("provider fora")',
    '    try:', '        registrar(c, "t1", "k1", "h1", quebra)', '    except RuntimeError:', '        pass',
    '    assert c.execute("SELECT COUNT(*) FROM avaliacoes").fetchone()[0] == 0', ''].join('\n');
  var solucao = base + [
    'def registrar(conn, tenant, chave, hash_intencao, advisor):',
    '    row = conn.execute("SELECT hash, decisao FROM avaliacoes WHERE tenant=? AND chave=?", (tenant, chave)).fetchone()',
    '    if row:', '        if row[0] != hash_intencao:', '            raise ConflitoIdempotencia(chave)', '        return row[1], True',
    '    decisao = advisor()', '    with conn:',
    '        conn.execute("INSERT INTO avaliacoes VALUES (?, ?, ?, ?)", (tenant, chave, hash_intencao, decisao))',
    '    return decisao, False', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b5',
    titulo: 'Dados, transações e evolução de schema',
    minutos: 35,
    resumo: 'Persistir não é gravar uma linha: transação fecha efeitos locais, idempotência decide a repetição, índice é hipótese e migração é protocolo.',
    objetivo: 'Usar transação, chave idempotente e plano de consulta como evidência local, sem generalizar o que o SQLite mostra para outros motores.',
    revisao: [
      { id: 'm02ab5-acid', pergunta: 'O que distingue atomicidade, isolamento e durabilidade?',
        opcoes: [
          opc('a', 'Atomicidade: efeitos aplicados ou desfeitos; isolamento: o que cada transação observa; durabilidade: o que persiste após confirmação e falha de processo.', true, 'a garantia depende do motor, configuração, instrução e topologia; "o banco resolve concorrência" é frase vaga.'),
          opc('b', 'São sinônimos de ACID.', false, 'são propriedades distintas.'),
          opc('c', 'Só atomicidade importa.', false, 'concorrência e persistência exigem as outras duas.')] },
      { id: 'm02ab5-rollback', pergunta: 'O que o rollback não desfaz?',
        opcoes: [
          opc('a', 'E-mail enviado, chamada ao provider, mensagem publicada: para esses efeitos entram idempotência, outbox e compensação.', true, 'a transação local não abrange o mundo externo.'),
          opc('b', 'Inserts feitos na própria transação.', false, 'esses ele desfaz.'),
          opc('c', 'Nada: desfaz tudo.', false, 'só os efeitos dentro da transação aberta.')] },
      { id: 'm02ab5-idem', pergunta: 'Mesma chave idempotente com intenção diferente (hash diferente). O que fazer?',
        opcoes: [
          opc('a', 'Conflito explícito de idempotência.', true, 'devolver a decisão antiga faria uma solicitação nova herdar o resultado de outra; reprocessar duplicaria efeito.'),
          opc('b', 'Reutilizar a decisão anterior.', false, 'esconde um bug do cliente.'),
          opc('c', 'Ignorar a chave.', false, 'perde a garantia.')] },
      { id: 'm02ab5-indice', pergunta: 'Como tratar "o índice deve acelerar a consulta"?',
        opcoes: [
          opc('a', 'Como hipótese: registrar o plano (EXPLAIN QUERY PLAN) e medir; o plano é evidência local, não universal.', true, 'estatísticas, distribuição e versão do otimizador mudam o plano; todo índice cobra escrita e espaço.'),
          opc('b', 'Como fato: índice sempre acelera.', false, 'nem sempre atende o predicado.'),
          opc('c', 'Medir o tempo uma vez na máquina do dev.', false, 'cache e tamanho de tabela podem esconder varredura inteira.')] },
      { id: 'm02ab5-migr', pergunta: 'Por que migração não é "editar o DDL e subir"?',
        opcoes: [
          opc('a', 'Define pré-condições, ordem, compatibilidade entre versões da aplicação, rollback ou forward-fix, backfill e critério de conclusão.', true, 'nullable pode vir antes dos produtores; obrigatória exige etapas; remover pode quebrar readers antigos.'),
          opc('b', 'Porque DDL não é SQL.', false, 'é SQL.'),
          opc('c', 'Porque SQLite não aceita DDL.', false, 'aceita.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Dados carregam decisões que precisam sobreviver a processo, reinício e falha parcial. No <code>work-intake</code>, uma avaliação relaciona solicitação, advisory, decisão e auditoria. Gravar a solicitação e falhar antes da decisão cria um estado que parece processado e não tem resultado confiável: é isso que a <strong>transação</strong> resolve.</p>' +
          '<p>O modelo começa por ownership. <code>work_requests</code> possui identidade, tenant, intenção e chave de idempotência. <code>advisories</code> e <code>decisions</code> pertencem a uma solicitação (chave estrangeira). <code>audit_events</code> registra a consequência sem duplicar texto sensível da intenção.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Invariante</th><th>Onde é protegida</th><th>Falha que evita</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>avaliação completa ou inexistente</td><td><code>BEGIN IMMEDIATE</code>, inserts e commit únicos</td><td>request sem decision/auditoria</td><td>não prova atomicidade entre bancos ou fila</td></tr>' +
          '<tr><td>chave idempotente pertence a um tenant</td><td><code>UNIQUE (tenant_id, idempotency_key)</code></td><td>repetição cria duas avaliações</td><td>não resolve retries distribuídos</td></tr>' +
          '<tr><td>tenant não lê registro de outro</td><td>predicado com <code>tenant_id</code> no repositório</td><td>leitura cruzada acidental</td><td>não substitui autenticação/autorização</td></tr>' +
          '<tr><td>filhos não sobrevivem ao pai</td><td>foreign keys e rollback</td><td>advisory ou decision órfã</td><td>depende de foreign keys habilitadas na conexão</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Atomicidade, isolamento e locking</h3>' +
          '<p><strong>Atomicidade</strong>: o conjunto de efeitos é aplicado ou desfeito. <strong>Isolamento</strong>: quais efeitos intermediários ou concorrentes cada transação observa. <strong>Durabilidade</strong>: o que persiste após confirmação e falha de processo. A garantia depende de motor, configuração, instrução, topologia e acesso.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: '# Trecho conceitual do adapter SQLite: uma única fronteira transacional.\nconnection.execute("BEGIN IMMEDIATE")\ntry:\n    insert_request(...)\n    insert_advisory(...)\n    insert_decision(...)\n    insert_audit_event(...)\n    connection.commit()\nexcept BaseException:\n    connection.rollback()\n    raise\nfinally:\n    connection.close()' },
        { tipo: 'texto', html:
          '<p><code>BEGIN IMMEDIATE</code> pede a intenção de escrita cedo no SQLite, tornando a disputa observável: uma escrita prossegue, a outra espera o lock e, quando a primeira confirma uma chave única, encontra conflito. Não é receita universal: PostgreSQL usa MVCC e locks com semântica e diagnósticos próprios, e broker, API externa e outro banco não entram na transação local. <strong>Rollback</strong> corrige efeitos dentro da transação aberta; não desfaz e-mail enviado, chamada de provider nem mensagem publicada (idempotência, outbox e compensação vêm depois).</p>' },
        { tipo: 'takeaway', html: '<mark>Transação local</mark> fecha efeitos locais; não desfaz o <mark>mundo externo</mark>.' }
      ] },

      { rotulo: 'Idempotência, índice e schema', blocos: [
        { tipo: 'texto', html:
          '<h3>Idempotência transforma repetição em decisão explícita</h3>' +
          '<p>Uma operação é <strong>idempotente</strong> quando repetir uma intenção reconhecida produz o mesmo efeito observável, não quando "não dá erro". O laboratório combina <code>tenant_id</code>, <code>idempotency_key</code> e hash da intenção.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Chegada</th><th>Estado persistido</th><th>Resultado</th></tr></thead><tbody>' +
          '<tr><td>primeira chave + intenção</td><td>nenhuma avaliação</td><td>executa, grava, devolve <code>reused=false</code></td></tr>' +
          '<tr><td>mesma chave + mesmo hash</td><td>avaliação compatível</td><td>reutiliza e evita nova chamada ao advisor</td></tr>' +
          '<tr><td>mesma chave + outro hash</td><td>avaliação incompatível</td><td>conflito de idempotência</td></tr>' +
          '<tr><td>mesma chave em outro tenant</td><td>namespace diferente</td><td>não encontra nem altera o registro anterior</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>A chave não é identificador universal de evento e não prova exactly-once em rede: é contrato de aplicação sobre um namespace e uma janela de retenção ainda por definir em produção. O oráculo local mostra duas coisas menores: repetição compatível não duplica efeito e colisão semântica não é mascarada.</p>' +
          '<h3>Concorrência local</h3>' +
          '<p>Duas requisições idênticas podem passar pela leitura inicial antes de qualquer gravação. O teste força a janela com barreira entre duas threads e dois repositórios no mesmo arquivo SQLite: um confirma, o outro recebe <code>sqlite3.IntegrityError</code> da restrição única. Prova o vencedor e o conflito no modelo local, não "alta concorrência". Produção pode transformar o conflito em releitura, retry limitado ou outro mecanismo, alterando latência, carga e semântica de falha; o adapter preserva o conflito para o retry não esconder a decisão.</p>' +
          '<h3>Índice é hipótese; plano é evidência local</h3>' +
          '<p>A consulta crítica busca por <code>tenant_id</code> e <code>idempotency_key</code>; a restrição única cria um índice adequado. O teste usa <code>EXPLAIN QUERY PLAN</code> e exige busca indexada em <code>work_requests</code>; tempo sozinho não basta (cache e tamanho de tabela escondem varredura). O plano não vale para todo volume ou motor (PostgreSQL tem comandos e operadores próprios): declare a consulta crítica, crie o índice do predicado e registre um plano antes de dizer "otimizada".</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto: 'EXPLAIN QUERY PLAN\nSELECT request_id\n  FROM work_requests\n WHERE tenant_id = ? AND idempotency_key = ?;' },
        { tipo: 'texto', html:
          '<h3>Evolução de schema é protocolo</h3>' +
          '<p>Migração define pré-condições, ordem, compatibilidade entre versões da aplicação, rollback ou forward-fix, backfill, observabilidade e critério de conclusão. O laboratório tem só uma migração inicial idempotente; não ensina histórico de versões nem zero-downtime. Campo nullable pode ser adicionado antes de os produtores escreverem; coluna obrigatória com backfill exige etapas; remover ou renomear pode quebrar readers antigos. O M03 trata isso com PostgreSQL e Alembic; aqui o SQLite expõe atomicidade, locking, integridade e plano local sem alegar as garantias do banco de produção.</p>' +
          '<p><strong>Panorama:</strong> a Developer Survey 2025 do Stack Overflow aponta PostgreSQL como o banco mais desejado e admirado entre os respondentes; é pesquisa auto-selecionada que não mede custo, regulação, volume ou adequação. Orienta o que vale conhecer, não escolhe banco. SQLite aqui não é mini-PostgreSQL.</p>' },
        { tipo: 'takeaway', html: 'Idempotência declara como <mark>repetição</mark> e <mark>colisão</mark> se comportam; <mark>índice</mark> é hipótese, <mark>plano</mark> é evidência local.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'rode', id: 'b5-rode', titulo: 'Repetição por timeout', obrigatorio: false,
          enunciado: 'Um cliente repete a mesma chamada. Saída ilustrativa (exemplo).',
          prefixo: '$', entrada: 'work-intake submit --key k1 req.json  # exemplo', unidade: 'ms', terminalTitulo: 'exemplo (saída variável)',
          prever: { pergunta: 'Segunda chamada, mesma chave e mesmo hash. O advisor é chamado de novo?', opcoes: [
            { id: 'a', texto: 'Sim: cada chamada reprocessa.', correta: false, porque: 'duplicaria o efeito.' },
            { id: 'b', texto: 'Não: reutiliza a decisão e devolve reused=true.', correta: true, porque: 'repetição compatível não duplica efeito.' }] },
          etapas: [
            { id: '1', nome: '1ª chamada', descricao: 'chave nova', tom: 'dns', ms: 1, linhas: [L('out', 'decision=review reused=false advisor_calls=1')] },
            { id: '2', nome: '2ª chamada', descricao: 'mesma chave e hash', tom: 'request', ms: 1, linhas: [L('out', 'decision=review reused=true advisor_calls=1')] },
            { id: '3', nome: '3ª chamada', descricao: 'mesma chave, outro hash', tom: 'response', ms: 1, linhas: [L('out', 'IdempotencyConflict key=k1'), L('hint', 'colisão semântica não é mascarada')] }
          ] },
        { tipo: 'python', id: 'b5-python', titulo: 'Avaliação idempotente com SQLite', obrigatorio: false,
          enunciado: 'Complete <code>registrar</code>: reutiliza a decisão (sem chamar o advisor) para mesma chave e mesmo hash, levanta <code>ConflitoIdempotencia</code> para outro hash, e não deixa rastro se o advisor falhar. O namespace é (tenant, chave).',
          codigo: codigo, testes: testes,
          dica: 'SELECT por (tenant, chave) primeiro; chame o advisor antes de qualquer escrita e grave dentro de <code>with conn:</code>.',
          solucao: solucao, callout: 'Idempotência, conflito e atomicidade verificados em SQLite em memória.' },
        { tipo: 'ordene', id: 'b5-ordene', titulo: 'Ordene o protocolo de coluna obrigatória', obrigatorio: false,
          itens: [{ id: 'c', texto: 'Tornar a coluna NOT NULL' }, { id: 'a', texto: 'Adicionar a coluna como nullable' }, { id: 'p', texto: 'Produtores passam a escrever o campo' }, { id: 'b', texto: 'Backfill dos registros antigos' }],
          solucao: ['a', 'p', 'b', 'c'], dica: 'Nada de restrição forte antes de todos escreverem e o legado estar preenchido.' },
        { tipo: 'escolha', id: 'b5-esc1', titulo: 'Confira: teste local', pergunta: 'O teste passa em SQLite e quebra em produção (outro motor). Qual a hipótese?',
          opcoes: [
            { id: 'a', texto: 'Garantia local foi generalizada: lock, isolamento e DDL diferem; reproduza no motor alvo antes de promover o claim.', correta: true, porque: 'SQLite local não prova o comportamento do banco canônico.' },
            { id: 'b', texto: 'O teste está errado por definição.', correta: false, porque: 'o teste vale para o que mediu.' }] },
        { tipo: 'escolha', id: 'b5-esc2', titulo: 'Confira: request sem decision', pergunta: 'Existe request sem decision. Qual a hipótese e a evidência?',
          opcoes: [
            { id: 'a', texto: 'Efeitos não compartilharam transação; contar as quatro tabelas após falha injetada.', correta: true, porque: 'delimite a transação ou redesenhe os efeitos externos.' },
            { id: 'b', texto: 'O índice está faltando.', correta: false, porque: 'índice não afeta atomicidade.' }] },
        { tipo: 'takeaway', html: 'O modelo de dados protege <mark>ownership</mark> e <mark>invariantes</mark>, não só armazenamento.' }
      ] }
    ]
  });
})();
