/* M10 · Bloco 8: Grafo como memória e fatos com validade. Fonte: M10.html#b08. O exercício usa sqlite3 e commits numerados (c1, c2...) no lugar de hashes. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoFatos = `import sqlite3


def criar(con):
    con.execute("""CREATE TABLE fatos (
        id INTEGER PRIMARY KEY,
        sujeito TEXT NOT NULL, predicado TEXT NOT NULL, objeto TEXT NOT NULL,
        valido_de INTEGER NOT NULL, valido_ate INTEGER,
        UNIQUE (sujeito, predicado, objeto, valido_de))""")


def registrar(con, sujeito, predicado, objeto, commit):
    con.execute("INSERT OR IGNORE INTO fatos (sujeito, predicado, objeto, valido_de) VALUES (?, ?, ?, ?)",
                (sujeito, predicado, objeto, commit))


def invalidar_por_mudanca(con, fqns, commit):
    """Fecha o intervalo (valido_ate = commit) dos fatos VIGENTES cujo sujeito
    ou objeto mudou. Idempotente. Devolve quantos fechou. Nunca apaga."""
    return 0


def vigentes(con, sujeito):
    """[(predicado, objeto)] do que vale AGORA para o sujeito, em ordem."""
    return []


def em_commit(con, c):
    """Fatos que valiam no commit c: valido_de <= c < valido_ate (NULL = vigente).
    Devolve [(sujeito, predicado, objeto)] em ordem."""
    return []
`;
  var solucaoFatos = `import sqlite3


def criar(con):
    con.execute("""CREATE TABLE fatos (
        id INTEGER PRIMARY KEY,
        sujeito TEXT NOT NULL, predicado TEXT NOT NULL, objeto TEXT NOT NULL,
        valido_de INTEGER NOT NULL, valido_ate INTEGER,
        UNIQUE (sujeito, predicado, objeto, valido_de))""")


def registrar(con, sujeito, predicado, objeto, commit):
    con.execute("INSERT OR IGNORE INTO fatos (sujeito, predicado, objeto, valido_de) VALUES (?, ?, ?, ?)",
                (sujeito, predicado, objeto, commit))


def invalidar_por_mudanca(con, fqns, commit):
    fqns = list(fqns)
    if not fqns:
        return 0
    marcas = ",".join("?" * len(fqns))
    cur = con.execute(
        "UPDATE fatos SET valido_ate = ? WHERE valido_ate IS NULL "
        "AND (sujeito IN (" + marcas + ") OR objeto IN (" + marcas + "))",
        [commit] + fqns + fqns)
    return cur.rowcount


def vigentes(con, sujeito):
    return con.execute(
        "SELECT predicado, objeto FROM fatos WHERE sujeito = ? AND valido_ate IS NULL "
        "ORDER BY predicado, objeto", (sujeito,)).fetchall()


def em_commit(con, c):
    return con.execute(
        "SELECT sujeito, predicado, objeto FROM fatos "
        "WHERE valido_de <= ? AND (valido_ate IS NULL OR ? < valido_ate) "
        "ORDER BY sujeito, predicado, objeto", (c, c)).fetchall()
`;
  var testesFatos = `def banco():
    con = sqlite3.connect(":memory:")
    criar(con)
    return con


def historia():
    con = banco()
    linhas = [
        ("Tela.Pagar", "CHAMA", "Pagamento.Processar", 1, None),
        ("Pagamento.Processar", "CHAMA", "Juros.Calcular", 1, 5),
        ("Pagamento.Processar", "CHAMA", "Juros.CalcularV2", 5, None),
        ("Legado.Relatorio", "CHAMA", "Juros.Calcular", 1, 4),
        ("Fatura.Gerar", "CHAMA", "Imposto.Somar", 2, None),
        ("Fatura.Gerar", "CHAMA", "Desconto.Aplicar", 3, 7),
    ]
    con.executemany("INSERT INTO fatos (sujeito, predicado, objeto, valido_de, valido_ate) VALUES (?,?,?,?,?)", linhas)
    return con


def test_consulta_ao_passado():
    con = historia()
    assert len(em_commit(con, 1)) == 3
    assert len(em_commit(con, 3)) == 5
    assert len(em_commit(con, 6)) == 4
    assert len(em_commit(con, 8)) == 3


def test_intervalo_e_aberto_no_fim():
    con = historia()
    assert ("Pagamento.Processar", "CHAMA", "Juros.Calcular") in em_commit(con, 4)
    assert ("Pagamento.Processar", "CHAMA", "Juros.Calcular") not in em_commit(con, 5)


def test_invalidar_fecha_por_sujeito_ou_objeto_sem_apagar():
    con = banco()
    registrar(con, "A", "CHAMA", "B", 1)
    registrar(con, "C", "CHAMA", "B", 1)
    registrar(con, "D", "CHAMA", "E", 1)
    assert invalidar_por_mudanca(con, {"B"}, 4) == 2
    assert vigentes(con, "A") == []
    assert vigentes(con, "D") == [("CHAMA", "E")]
    assert con.execute("SELECT COUNT(*) FROM fatos").fetchone()[0] == 3


def test_invalidar_e_idempotente():
    con = banco()
    registrar(con, "A", "CHAMA", "B", 1)
    assert invalidar_por_mudanca(con, {"A"}, 4) == 1
    assert invalidar_por_mudanca(con, {"A"}, 9) == 0
    assert con.execute("SELECT valido_ate FROM fatos").fetchone()[0] == 4


def test_invalidar_sem_mudanca_nao_faz_nada():
    con = banco()
    registrar(con, "A", "CHAMA", "B", 1)
    assert invalidar_por_mudanca(con, set(), 4) == 0
    assert vigentes(con, "A") == [("CHAMA", "B")]


def test_o_passado_continua_consultavel_apos_fechar():
    con = banco()
    registrar(con, "A", "CHAMA", "B", 1)
    invalidar_por_mudanca(con, {"A"}, 4)
    assert em_commit(con, 3) == [("A", "CHAMA", "B")]
    assert em_commit(con, 4) == []
`;

  TrilhaAula.registrar({
    id: 'm10-b8',
    titulo: 'Grafo como memória e fatos com validade',
    minutos: 40,
    resumo: 'Memória de agente é relacional, invalida em cascata e tem proveniência: tudo isso é grafo. Fatos carregam o intervalo em que valem; quando o código muda, fecha-se o intervalo, nunca se apaga, e toda resposta declara o commit de referência.',
    objetivo: 'Modelar fatos com validade e proveniência, invalidar por símbolo de forma idempotente, consultar o passado e declarar a desatualização em vez de servir fato velho.',
    revisao: [
      { id: 'm10b8-fechar', pergunta: 'O arquivo PagamentoService.cs mudou no commit abc. O que fazer com os fatos derivados dele?',
        opcoes: [
          opc('a', 'Fechar o intervalo (UPDATE ... SET valido_ate = :commit, com WHERE valido_ate IS NULL) e nunca apagar', true, 'apagar destrói auditoria, depuração e consulta ao passado; fechar duas vezes é inofensivo.'),
          opc('b', 'DELETE dos fatos', false, 'histórico é o produto.'),
          opc('c', 'Recriar toda a memória a cada commit', false, 'joga fora trabalho caro; a granularidade certa é a do símbolo.')] },
      { id: 'm10b8-eixos', pergunta: 'Qual a diferença entre tempo do fato e tempo do registro?',
        opcoes: [
          opc('a', 'Fato: quando foi verdade no sistema (intervalo de commits). Registro: quando o sistema descobriu. Guardar os dois permite responder sobre o passado e auditar', true, 'confundir os eixos é o erro comum.'),
          opc('b', 'São o mesmo dado em duas colunas', false, 'respondem perguntas diferentes.'),
          opc('c', 'O tempo do registro é quando o fato deixou de valer', false, 'isso é valido_ate.')] },
      { id: 'm10b8-fato', pergunta: 'O que é fato de memória e o que é só observação?',
        opcoes: [
          opc('a', 'Fato preenche sujeito/predicado/objeto + evidência + valido_de; o resto é observação e morre com a execução', true, '"a busca devolveu 12 resultados" ou "o arquivo tem 400 linhas" não entram.'),
          opc('b', 'Tudo que o agente viu na sessão', false, 'seria uma tabela de tudo, sem custo-benefício.'),
          opc('c', 'Só o que o usuário digitou', false, 'fatos podem vir do parser, do LLM ou do usuário (origem).')] },
      { id: 'm10b8-cascata', pergunta: 'Por que o grafo ajuda na invalidação em cascata?',
        opcoes: [
          opc('a', 'Tudo que deriva de um nó é achado por travessia; um fato que dependia de três símbolos, dois dos quais mudaram, é identificável estruturalmente', true, 'na tabela exigiria uma consulta por padrão de evidência.'),
          opc('b', 'Porque o grafo apaga sozinho o que ficou velho', false, 'nada se apaga: fecha-se o intervalo.'),
          opc('c', 'Porque grafos não têm cache', false, 'é o padrão cache com invalidação por dependência.')] },
      { id: 'm10b8-decl', pergunta: 'O grafo está sendo reconstruído e o cliente pergunta algo. Qual a postura certa para uma ferramenta de análise?',
        opcoes: [
          opc('a', 'Servir o grafo antigo marcado, com commit de referência e idade, e registrar a escolha no ADR', true, 'consistência eventual: o erro não é ter atraso, é não declará-lo.'),
          opc('b', 'Recusar todas as consultas até terminar', false, 'é uma escolha possível, mas não a recomendada aqui.'),
          opc('c', 'Servir o antigo sem avisar', false, 'é afirmação confiante e errada.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>No M08 bloco 6 você construiu a tabela <code>fatos_agente</code> e a regra: <strong>fato durável precisa de evidência e de gatilho de invalidação</strong>. Era a versão relacional, deliberadamente simples. Com o grafo, vale perguntar se a memória ganha algo sendo grafo. Ganha, por três motivos.</p>' +
          '<ul><li><strong>Memória é relacional.</strong> "O método X é chamado por Y" é uma aresta, não uma frase. Guardar como frase obriga a reparsear na leitura; como aresta, "que fatos eu já sei sobre este módulo?" vira uma travessia de um salto.</li>' +
          '<li><strong>Invalidação em cascata</strong> (o motivo forte). Quando <code>PagamentoService.cs</code> muda, quais fatos morrem? Na tabela, uma consulta por padrão de evidência; no grafo, travessia: <em>tudo que deriva daquele nó</em>. Um fato que dependia de três símbolos, dois dos quais mudaram, é identificável estruturalmente.</li>' +
          '<li><strong>Proveniência é aresta.</strong> "Estabelecido a partir destas evidências, por esta execução, neste commit" é um subgrafo, e responde "por que você acha isso?" com o caminho, não com uma string.</li></ul>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Padrão conhecido: cache com invalidação por dependência', html:
          '<p>Sabe-se de quais inputs cada output depende, e quando um input muda, o que dependia dele é refeito. A memória do agente é isso, com "fato" no lugar de "artefato" e "commit" no lugar de "timestamp". A diferença cruel: servir artefato velho dá erro visível; servir fato velho dá <em>afirmação confiante e errada</em>, que ninguém percebe.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Grafo temporal: dois eixos de tempo</h3>' +
          '<p>Em um <strong>grafo temporal</strong>, arestas e nós carregam <em>quando valem</em>, em vez de serem apenas verdadeiros ou apagados. Confundir os dois eixos é erro comum:</p>' +
          '<table><thead><tr><th>Eixo</th><th>Pergunta</th><th>No Capstone</th></tr></thead><tbody>' +
          '<tr><td><strong>Tempo do fato</strong> (validade no mundo)</td><td>"quando isso foi verdade no sistema?"</td><td>intervalo de commits em que a chamada existiu</td></tr>' +
          '<tr><td><strong>Tempo do registro</strong> (quando soubemos)</td><td>"quando nós descobrimos isso?"</td><td>data da execução que estabeleceu o fato</td></tr>' +
          '</tbody></table>' +
          '<p>Guardar os dois permite <strong>não mentir</strong> ("isso era verdade no commit abc, pode ter mudado"), <strong>responder sobre o passado</strong> ("como era a arquitetura antes da refatoração de junho?") e <strong>auditar</strong> ("por que o relatório de maio dizia outra coisa?"). E admitir obsolescência em vez de silenciosamente servir o velho.</p>' },
        { tipo: 'takeaway', html: 'Fato tem <mark>intervalo de validade</mark> e <mark>proveniência</mark>; servir fato velho é <mark>afirmação confiante e errada</mark>.' }
      ] },

      { rotulo: 'Validade e invalidação', blocos: [
        { tipo: 'codigo', linguagem: 'sql', texto: [
          '-- migration: fatos como grafo temporal (evolui a tabela do M08 bloco 6)',
          'CREATE TABLE fatos_agente (',
          '    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
          '    tenant_id     bigint NOT NULL,',
          '    repo_id       bigint NOT NULL,',
          '',
          '    -- o fato, estruturado (não é frase solta)',
          '    sujeito_fqn   text   NOT NULL,          -- nó de origem no grafo',
          '    predicado     text   NOT NULL,          -- CHAMA | ACESSA | RESPONSABILIDADE | RISCO',
          '    objeto        text   NOT NULL,          -- nó de destino, ou valor',
          '    confianca     numeric(3,2) NOT NULL,    -- 1.00 = determinístico; < 1 = inferido',
          '',
          '    -- proveniência',
          '    evidencia     jsonb  NOT NULL,          -- [{caminho, linha_ini, linha_fim}]',
          '    origem        text   NOT NULL,          -- parser | llm | usuario',
          '    execucao_id   text,                     -- thread_id do LangGraph que o produziu',
          '',
          '    -- os dois eixos de tempo',
          '    valido_de     text   NOT NULL,          -- commit em que passou a valer',
          '    valido_ate    text,                     -- commit em que deixou (NULL = vigente)',
          '    registrado_em timestamptz NOT NULL DEFAULT now(),',
          '',
          '    UNIQUE (tenant_id, repo_id, sujeito_fqn, predicado, objeto, valido_de)',
          ');',
          '',
          '-- índice parcial: a consulta quente é "o que vale AGORA"',
          'CREATE INDEX ix_fatos_vigentes ON fatos_agente (tenant_id, repo_id, sujeito_fqn)',
          '    WHERE valido_ate IS NULL;'].join('\n') },
        { tipo: 'callout', tom: 'danger', titulo: 'Invalidação: nunca delete, feche o intervalo', html:
          '<p>Quando um fato deixa de valer, a operação é <code>UPDATE ... SET valido_ate = :commit</code>, não <code>DELETE</code>. Três razões: <strong>auditoria</strong> (explicar um relatório antigo), <strong>depuração</strong> ("quando isso mudou?") e a regra do M04 bloco 3: histórico é o produto. É o mesmo princípio do ADR substituído e do dataset de eval com <code>deprecated</code> em vez de edição (M06 bloco 2). <strong>Três vezes o mesmo padrão em módulos diferentes é sinal de fundamento, não de convenção.</strong></p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'async def invalidar_por_mudanca(session, escopo, fqns_alterados: set[str], commit: str) -> int:',
          '    """Fecha os fatos cujo SUJEITO ou OBJETO mudou. Chamado na ingestão incremental."""',
          '    resultado = await session.execute(text("""',
          '        UPDATE fatos_agente',
          '           SET valido_ate = :commit',
          '         WHERE tenant_id = :t AND repo_id = :r',
          '           AND valido_ate IS NULL',
          '           AND (sujeito_fqn = ANY(:fqns) OR objeto = ANY(:fqns))',
          '        RETURNING id"""), {...})',
          '    return len(resultado.fetchall())',
          '',
          'async def fatos_vigentes(session, escopo, sujeito: str):',
          '    """O que o agente já sabe sobre este símbolo: vira contexto inicial (M08 bloco 6)."""',
          '    # SELECT predicado, objeto, confianca, evidencia, valido_de',
          '    #   FROM fatos_agente WHERE ... AND sujeito_fqn = :s AND valido_ate IS NULL',
          '    #  ORDER BY confianca DESC'].join('\n') },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'ingestão incremental (M07)  ->  detecta arquivos alterados pelo hash',
          '        |',
          'extração (bloco 5)          ->  fqns que mudaram',
          '        |',
          'invalidar_por_mudanca()     ->  fecha os fatos afetados (valido_ate = commit)',
          '        |',
          'agente (M08) na próxima     ->  lê só fatos vigentes; redescobre o que morreu',
          '        |',
          'notas_registrar()           ->  grava fatos novos com evidência e valido_de'].join('\n') },
        { tipo: 'callout', tom: 'info', titulo: 'Consistência eventual e honestidade sobre o que você sabe', html:
          '<ul><li><strong>Sua memória é sempre uma réplica atrasada da realidade.</strong> O erro não é <em>ter</em> atraso, é <strong>não declará-lo</strong>. Toda resposta carrega o commit de referência: "analisado em <code>a1b2c3d</code>, há 4 horas".</li>' +
          '<li><strong>CAP na prática:</strong> com o grafo em reconstrução, servir o antigo (disponibilidade, com aviso) ou recusar (consistência)? Para uma ferramenta de análise, servir o antigo <em>marcado</em>; mas é uma escolha e vai no ADR.</li>' +
          '<li><strong>Idempotência da invalidação.</strong> Fechar duas vezes o mesmo intervalo é inofensivo (o <code>WHERE valido_ate IS NULL</code> garante). Como o pipeline retoma por replay (bloco 3), isso não é opcional.</li>' +
          '<li><strong>Custo do esquecimento seletivo.</strong> Invalidar demais joga fora trabalho caro; de menos, serve mentira. A granularidade certa é a do <em>símbolo</em>, não a do arquivo, e por isso o <code>fqn</code> estável do bloco 5 importa tanto.</li></ul>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Onde parar: memória não é banco de tudo', html:
          '<p>Se você não consegue preencher <code>sujeito/predicado/objeto</code> + <code>evidencia</code> + <code>valido_de</code>, <strong>não é fato, é observação</strong>, e observação morre com a execução. Não entram: "a busca devolveu 12 resultados", "o arquivo tem 400 linhas" (propriedade do nó) e "o usuário perguntou sobre pagamentos" (histórico episódico, outra tabela, outro propósito).</p>' +
          '<p>Sintoma: o agente afirma algo que era verdade e não é mais. Causa: fato sem <code>valido_ate</code> ou invalidação por arquivo em vez de por símbolo. Conserto: fechar intervalo na ingestão incremental, granularidade de símbolo e commit de referência na resposta.</p>' },
        { tipo: 'takeaway', html: 'Nunca <mark>delete</mark>: feche o <mark>intervalo</mark>, por símbolo e de forma idempotente.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Seis fatos <code>CHAMA</code> de exemplo, os mesmos do simulador do módulo. Um fato vale no commit <code>c</code> se <code>valido_de ≤ c &lt; valido_ate</code> (<code>valido_ate</code> vazio é vigente). Invalidar é fechar o intervalo; a linha nunca sai da tabela.</p>' },
        { tipo: 'rode', id: 'b8-rode', titulo: 'Como era no commit N?', enunciado: 'Consulte a mesma tabela em três commits. A saída vem da solução do exercício.',
          prefixo: '$', entrada: 'python3 historia.py', unidade: 'ms', terminalTitulo: 'sqlite3 :memory: (6 fatos)',
          prever: { pergunta: 'Quantos fatos valem no commit c6?', opcoes: [
            { id: 'a', texto: '6, pois nenhuma linha foi apagada', correta: false, porque: 'existir na tabela não é valer: o intervalo decide.' },
            { id: 'b', texto: '4', correta: true, porque: 'Juros.Calcular (até c5) e Legado.Relatorio (até c4) já foram encerrados; os demais valem em c6.' },
            { id: 'c', texto: '2', correta: false, porque: 'só dois seriam vigentes se quatro estivessem fechados.' }
          ] },
          etapas: [
            { id: 'c3', nome: 'em_commit(3)', descricao: 'Passado', tom: 'dns', ms: 1, linhas: [
              L('out', '5 fatos valem em c3'),
              L('hint', 'inclui Legado.Relatorio -> Juros.Calcular, ainda aberto')] },
            { id: 'c6', nome: 'em_commit(6)', descricao: 'Meio', tom: 'request', ms: 1, linhas: [
              L('out', '4 fatos valem em c6'),
              L('out', 'Pagamento.Processar -> Juros.CalcularV2 vale (de c5); Juros.Calcular não'),
              L('hint', '2 fatos encerrados continuam na tabela')] },
            { id: 'c8', nome: 'em_commit(8)', descricao: 'Presente', tom: 'response', ms: 1, linhas: [
              L('out', '3 fatos valem em c8'),
              L('hint', 'Fatura.Gerar -> Desconto.Aplicar fechou em c7; 6 linhas na tabela, 3 vigentes')] }
          ],
          tutorDepois: 'A resposta honesta é "isso era verdade no commit c6, pode ter mudado depois". Só é possível porque o intervalo é separado da execução que o estabeleceu.',
          callout: 'Você consultou o passado sem perder nenhuma linha.' },
        { tipo: 'python', id: 'b8-python', titulo: 'Memória temporal em sqlite3', obrigatorio: false,
          enunciado: 'Implemente <code>invalidar_por_mudanca</code> (fecha só os fatos vigentes cujo sujeito ou objeto está em <code>fqns</code>; idempotente; devolve quantos fechou; nunca apaga), <code>vigentes</code> e <code>em_commit</code>.',
          codigo: codigoFatos, testes: testesFatos,
          dica: 'Use <code>UPDATE fatos SET valido_ate = ? WHERE valido_ate IS NULL AND (sujeito IN (...) OR objeto IN (...))</code> com tantos <code>?</code> quantos fqns, e <code>cur.rowcount</code>. A consulta histórica é <code>valido_de &lt;= ? AND (valido_ate IS NULL OR ? &lt; valido_ate)</code>. Sem fqns, devolva 0.',
          solucao: solucaoFatos,
          tutorDepois: 'O <code>WHERE valido_ate IS NULL</code> é o que torna a invalidação idempotente, e a retomada por replay do bloco 3 depende disso.',
          callout: 'Invalidação idempotente e consulta ao passado passaram nos testes.' },
        { tipo: 'takeaway', html: 'O <mark>WHERE valido_ate IS NULL</mark> torna a invalidação <mark>idempotente</mark>; o passado continua consultável.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'complete', id: 'b8-sql', titulo: 'Esquema e invalidação', obrigatorio: false,
          enunciado: 'Complete a migration e o fechamento do intervalo.',
          linguagem: 'sql',
          partes: [
            'valido_ate    text,        -- NULL = ',
            { lacuna: 'nulo', opcoes: ['vigente', 'apagado', 'desconhecido'], correta: 'vigente' },
            '\n\nCREATE INDEX ix_fatos_vigentes ON fatos_agente (tenant_id, repo_id, sujeito_fqn)\n    WHERE ',
            { lacuna: 'idx', opcoes: ['valido_ate IS NULL', 'valido_de IS NULL', 'confianca = 1'], correta: 'valido_ate IS NULL' },
            ';\n\n',
            { lacuna: 'op', opcoes: ['UPDATE', 'DELETE FROM', 'TRUNCATE'], correta: 'UPDATE' },
            ' fatos_agente SET valido_ate = :commit\n WHERE valido_ate IS NULL AND (sujeito_fqn = ANY(:fqns) OR objeto = ANY(:fqns));'
          ],
          explicacao: 'A consulta quente é "o que vale agora", então o índice parcial cobre só os vigentes. Fechar o intervalo preserva auditoria e histórico.' },
        { tipo: 'cenario', id: 'b8-cenario', titulo: 'O arquivo mudou', obrigatorio: false,
          enunciado: '<code>PagamentoService.cs</code> mudou no commit abc. A ingestão incremental detectou pelo hash. O que acontece com a memória?',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Há 40 fatos que citam símbolos desse arquivo. Qual a operação?', opcoes: [
              { texto: 'DELETE dos fatos para o grafo não mentir.', vai: 'f-apaga', tom: 'ruim', consequencia: 'o relatório de maio não pode mais ser explicado.' },
              { texto: 'Recriar toda a memória do zero.', vai: 'f-caro', tom: 'ruim', consequencia: 'o agente redescobre o que não mudou, pagando de novo.' },
              { texto: 'Fechar o intervalo (valido_ate = abc) dos fatos vigentes afetados.', vai: 'gran', tom: 'ok', consequencia: 'o histórico fica e o vigente deixa de afirmar o velho.' }
            ] },
            gran: { texto: 'Dos 40 fatos, só 6 envolvem o método que realmente mudou. Qual a granularidade?', opcoes: [
              { texto: 'Por arquivo: fecha os 40.', vai: 'f-arquivo', tom: 'ruim', consequencia: 'invalida demais e joga fora trabalho caro.' },
              { texto: 'Por símbolo (fqn): fecha os 6 cujo sujeito ou objeto mudou.', vai: 'f-bom', tom: 'ok', consequencia: 'o fqn estável do bloco 5 sustenta a precisão.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Memória honesta: histórico preservado, vigente atualizado, esquecimento seletivo.' },
            'f-apaga': { bom: false, texto: 'Sem auditoria, sem depuração e sem consulta ao passado.' },
            'f-caro': { bom: false, texto: 'A conta da redescoberta repetiu trabalho que não mudou.' },
            'f-arquivo': { bom: false, texto: 'O agente redescobre 34 fatos que continuavam verdadeiros.' }
          },
          callout: 'Você fechou intervalos por símbolo, sem apagar nada.' },
        { tipo: 'escolha', id: 'b8-esc-eixos', titulo: 'Confira: os dois eixos',
          pergunta: 'Qual é a diferença entre tempo do fato e tempo do registro?',
          opcoes: [
            { id: 'a', texto: 'Fato: quando aquilo foi verdade no sistema. Registro: quando o sistema descobriu. Guardar os dois permite responder sobre o passado e auditar.', correta: true, porque: 'o intervalo de validade fica separado da data da execução.' },
            { id: 'b', texto: 'São o mesmo dado em duas colunas, por conveniência.', correta: false, porque: 'respondem perguntas diferentes.' },
            { id: 'c', texto: 'O tempo do registro é quando o fato deixou de valer.', correta: false, porque: 'isso é valido_ate.' },
            { id: 'd', texto: 'O tempo do fato é a data em que o relatório foi gerado.', correta: false, porque: 'isso é tempo do registro.' }
          ], tutorDepois: 'Veja no rode: o histórico continua na tabela mesmo depois do fechamento.' },
        { tipo: 'escolha', id: 'b8-esc-fato', titulo: 'Confira: isso é fato?',
          pergunta: 'Qual destes itens deve entrar na tabela de fatos de memória?',
          opcoes: [
            { id: 'a', texto: '"A busca devolveu 12 resultados."', correta: false, porque: 'observação: morre com a execução.' },
            { id: 'b', texto: '"O arquivo tem 400 linhas."', correta: false, porque: 'propriedade do nó, não fato de memória.' },
            { id: 'c', texto: 'Pagamento.Processar CHAMA Juros.Calcular, com evidência (arquivo e linhas), origem parser e valido_de.', correta: true, porque: 'preenche sujeito/predicado/objeto + evidência + valido_de.' },
            { id: 'd', texto: '"O usuário perguntou sobre pagamentos."', correta: false, porque: 'histórico episódico, outra tabela e outro propósito.' }
          ], tutorDepois: 'Se não consegue preencher os campos, é observação.' },
        { tipo: 'takeaway', html: 'Toda resposta declara o <mark>commit de referência</mark>; a memória é uma <mark>réplica atrasada</mark> e honesta.' }
      ] }
    ]
  });
})();
