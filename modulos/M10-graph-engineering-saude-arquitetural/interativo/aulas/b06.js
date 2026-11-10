/* M10 · Bloco 6: Onde guardar o grafo, AGE, Neo4j ou SQL. Fonte: M10.html#b06. A execução real contra PostgreSQL/AGE exige Docker (trilha externa); o exercício usa sqlite3, que também tem CTE recursiva. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoCte = `import re
import sqlite3


def afetados(con, alvo, prof):
    """Chamadores transitivos de alvo, ate prof saltos: {fqn: menor distancia}.
    A tabela e chamadas(chamador, chamado). Controle manual de ciclo:
    guarde a rota percorrida e nao revisite quem ja esta nela."""
    sql = """
    WITH RECURSIVE afetados(fqn, distancia, rota) AS (
      SELECT chamador, 1, ',' || chamador || ',' || :alvo || ','
        FROM chamadas WHERE chamado = :alvo
      -- falta o passo recursivo: UNION ALL, JOIN com afetados,
      -- limite de distancia (:prof) e anti-ciclo (instr na rota)
    )
    SELECT fqn, MIN(distancia) FROM afetados GROUP BY fqn
    """
    return dict(con.execute(sql, {"alvo": alvo, "prof": prof}).fetchall())


IDENT = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")


def validar_fqn(fqn):
    """Valor que vai para dentro de $$ ... $$: valide antes de interpolar."""
    return fqn


def nome_grafo(tenant_id, repo_id):
    """Um grafo por tenant+repo, nome derivado do escopo autenticado."""
    return "grafo"


def profundidade_segura(p, maximo=6):
    """Sempre limitada: inteiro entre 1 e maximo."""
    return p
`;
  var solucaoCte = `import re
import sqlite3


def afetados(con, alvo, prof):
    sql = """
    WITH RECURSIVE afetados(fqn, distancia, rota) AS (
      SELECT chamador, 1, ',' || chamador || ',' || :alvo || ','
        FROM chamadas WHERE chamado = :alvo
      UNION ALL
      SELECT c.chamador, a.distancia + 1, ',' || c.chamador || a.rota
        FROM chamadas c JOIN afetados a ON c.chamado = a.fqn
       WHERE a.distancia < :prof
         AND instr(a.rota, ',' || c.chamador || ',') = 0
    )
    SELECT fqn, MIN(distancia) FROM afetados GROUP BY fqn
    """
    return dict(con.execute(sql, {"alvo": alvo, "prof": prof}).fetchall())


IDENT = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")


def validar_fqn(fqn):
    partes = fqn.split(".")
    if not partes or not all(IDENT.fullmatch(p) for p in partes):
        raise ValueError("fqn invalido: " + repr(fqn))
    return fqn


def nome_grafo(tenant_id, repo_id):
    return "t" + str(int(tenant_id)) + "_repo" + str(int(repo_id))


def profundidade_segura(p, maximo=6):
    p = int(p)
    if not 1 <= p <= maximo:
        raise ValueError("profundidade fora de 1.." + str(maximo))
    return p
`;
  var testesCte = `ARESTAS = [
    ("Tela.Pagar", "Pagamento.Processar"), ("Api.Fatura", "Fatura.Gerar"),
    ("Pagamento.Processar", "Juros.Calcular"), ("Pagamento.Processar", "Desconto.Aplicar"),
    ("Fatura.Gerar", "Juros.Calcular"), ("Fatura.Gerar", "Imposto.Somar"),
    ("Juros.Calcular", "Arredonda.Moeda"), ("Desconto.Aplicar", "Arredonda.Moeda"),
    ("Imposto.Somar", "Arredonda.Moeda"), ("Legado.Relatorio", "Juros.Calcular"),
]


def banco(arestas):
    con = sqlite3.connect(":memory:")
    con.execute("CREATE TABLE chamadas (chamador TEXT, chamado TEXT)")
    con.executemany("INSERT INTO chamadas VALUES (?, ?)", arestas)
    return con


def test_um_dois_e_tres_saltos():
    con = banco(ARESTAS)
    assert len(afetados(con, "Arredonda.Moeda", 1)) == 3
    assert len(afetados(con, "Arredonda.Moeda", 2)) == 6
    r = afetados(con, "Arredonda.Moeda", 3)
    assert len(r) == 8 and r["Tela.Pagar"] == 3


def test_alvo_sem_chamadores():
    assert afetados(banco(ARESTAS), "Tela.Pagar", 4) == {}


def test_ciclo_termina_sem_o_alvo_no_resultado():
    con = banco([("a", "b"), ("b", "a"), ("c", "a")])
    assert afetados(con, "a", 10) == {"b": 1, "c": 1}


def test_validar_fqn_aceita_identificador():
    assert validar_fqn("Acme.Pagamentos.PagamentoService.Processar") == "Acme.Pagamentos.PagamentoService.Processar"


def test_validar_fqn_rejeita_injecao():
    for ruim in ["x'}) RETURN 1 $$", "a..b", "", "a b", "a.b; DROP"]:
        try:
            validar_fqn(ruim)
        except ValueError:
            continue
        raise AssertionError("aceitou " + repr(ruim))


def test_nome_grafo_vem_do_escopo_inteiro():
    assert nome_grafo(42, 7) == "t42_repo7"
    try:
        nome_grafo("42; DROP", 7)
    except ValueError:
        return
    raise AssertionError("aceitou texto")


def test_profundidade_sempre_limitada():
    assert profundidade_segura(4) == 4
    for ruim in (0, 7, "*"):
        try:
            profundidade_segura(ruim)
        except ValueError:
            continue
        raise AssertionError("aceitou " + repr(ruim))
`;

  TrilhaAula.registrar({
    id: 'm10-b6',
    titulo: 'Onde guardar o grafo: tabelas, AGE ou Neo4j',
    minutos: 40,
    resumo: 'O grafo em memória morre com o processo. A decisão do ADR-0001 é Postgres único, com Apache AGE se preciso: Cypher dentro do Postgres, mesma transação do pgvector. Tabela com CTE recursiva basta enquanto os saltos são poucos; Neo4j quando o grafo é o produto.',
    objetivo: 'Escolher entre tabela, AGE e Neo4j, escrever a mesma travessia em SQL recursivo e em Cypher e aplicar os cuidados obrigatórios do AGE (sessão, tenant, injeção, profundidade).',
    revisao: [
      { id: 'm10b6-age', pergunta: 'Você quer travessia de profundidade variável, sem operar mais um banco e na mesma transação do pgvector. Qual a escolha e qual cuidado?',
        opcoes: [
          opc('a', 'Apache AGE no Postgres, com profundidade limitada (*1..4), um grafo por tenant do escopo autenticado e valores validados antes do $$ ... $$', true, 'RLS não cobre as tabelas internas de vértices; interpolação é superfície de injeção; travessia sem limite explode com ciclo.'),
          opc('b', 'Neo4j, porque o RLS do Postgres cobre as tabelas do grafo', false, 'o RLS não cobre as tabelas internas do AGE, e Neo4j tem mecanismo próprio.'),
          opc('c', 'AGE com travessia ilimitada (*)', false, 'o Postgres não trata ciclos sozinho nesse caso.')] },
      { id: 'm10b6-quando', pergunta: 'Quando o Neo4j compensa?',
        opcoes: [
          opc('a', 'Quando o grafo é o produto: dezenas de milhões de arestas, algoritmos de grafo em produção, visualização e equipe que aceita operar mais um banco', true, 'o curso adota AGE porque o gargalo do primeiro ano é custo operacional, não performance de travessia.'),
          opc('b', 'Sempre, por ser a referência', false, 'custa backup, upgrade, licença e consistência eventual entre dois bancos.'),
          opc('c', 'Quando há poucos saltos e poucas consultas', false, 'esse é o caso da tabela com CTE recursiva.')] },
      { id: 'm10b6-sessao', pergunta: 'Aparece "função cypher não existe" de forma intermitente. Causa e conserto?',
        opcoes: [
          opc('a', 'LOAD \'age\' e o search_path valem por sessão; o pool abriu conexão nova. Listener de connect no engine executando os dois', true, 'toda conexão nova precisa deles.'),
          opc('b', 'O índice vetorial está corrompido', false, 'não tem relação.'),
          opc('c', 'Falta um grafo por tenant', false, 'isso afeta isolamento, não a existência da função.')] },
      { id: 'm10b6-tenant', pergunta: 'Um tenant enxerga o grafo de outro. Causa provável?',
        opcoes: [
          opc('a', 'RLS não cobre as tabelas internas do AGE e/ou o nome do grafo veio de parâmetro; use um grafo por tenant+repo nomeado a partir do escopo do runtime', true, 'M09 bloco 4: nunca derive o escopo de parâmetro vindo do modelo.'),
          opc('b', 'O pool de conexões é pequeno', false, 'não vaza dados entre tenants.'),
          opc('c', 'A profundidade está ilimitada', false, 'isso causa explosão, não vazamento.')] },
      { id: 'm10b6-lote', pergunta: 'A ingestão do grafo leva minutos por causa da escrita. Conserto?',
        opcoes: [
          opc('a', 'Persistir em lotes (~500), não um CREATE por nó', true, 'mesma lição do insert em lote do M03.'),
          opc('b', 'Aumentar o limite de profundidade', false, 'não afeta a escrita.'),
          opc('c', 'Trocar por Neo4j', false, 'o gargalo é o padrão de escrita.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O grafo em memória do bloco 5 morre com o processo. Persistir permite consultar de outro serviço, isolar por tenant e responder em milissegundos sem reprocessar o repositório. A decisão de <em>onde</em> já está no ADR-0001 (M04 bloco 3): Postgres único, com pgvector e, se preciso, <strong>Apache AGE</strong>, extensão que adiciona grafo e Cypher dentro do Postgres e devolve linhas SQL que dão <code>JOIN</code> com suas tabelas.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>A decisão: tabelas, AGE ou Neo4j</h3>' +
          '<table><thead><tr><th></th><th>Tabela + CTE recursiva</th><th>Apache AGE</th><th>Neo4j</th></tr></thead><tbody>' +
          '<tr><td>Infra a operar</td><td>nenhuma a mais</td><td>nenhuma a mais (é o seu Postgres)</td><td><strong>mais um banco</strong>: backup, upgrade, licença</td></tr>' +
          '<tr><td>Travessia de profundidade variável</td><td>CTE recursiva, ciclo controlado à mão</td><td>Cypher, natural</td><td>Cypher, natural e mais rápido</td></tr>' +
          '<tr><td>Transação com o resto do sistema</td><td>sim</td><td>sim, mesma transação do pgvector</td><td>não: dois bancos, consistência eventual</td></tr>' +
          '<tr><td>Multi-tenant / RLS</td><td>RLS nativo</td><td>RLS não cobre as tabelas internas; um grafo por tenant</td><td>mecanismo próprio</td></tr>' +
          '<tr><td>Maturidade</td><td>total</td><td>menor; Cypher parcial</td><td>referência da categoria</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p><strong>Quando cada um compensa.</strong> Tabela com CTE recursiva basta enquanto as travessias têm poucos saltos e poucas consultas diferentes: é a escolha mais barata e a que você já sabe operar. AGE compensa quando as consultas viram caminhos de profundidade variável e você quer uma só transação e uma só infraestrutura. Neo4j compensa quando o grafo é o produto: dezenas de milhões de arestas, algoritmos de grafo em produção, ecossistema de visualização e uma equipe que aceita operar mais um banco.</p>' +
          '<p>O curso adota AGE porque o gargalo do primeiro ano é custo operacional, não performance de travessia. O gatilho de revisão do ADR continua valendo: se uma consulta não for expressável no AGE em tempo aceitável, reabra a decisão. Fonte: Apache AGE docs, verificada em 14/09/2026.</p>' },
        { tipo: 'cenario', id: 'b6-cenario', titulo: 'Qual armazenamento?', obrigatorio: false,
          enunciado: 'Três situações diferentes de produto. Escolha para cada uma o armazenamento do grafo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Primeiro ano do Cartógrafo: equipe pequena, Postgres com pgvector já em produção, consultas de impacto com 3 a 4 saltos. Qual armazenamento?', opcoes: [
              { texto: 'Neo4j, porque é a referência.', vai: 'f-pesado', tom: 'ruim', consequencia: 'você acabou de adicionar backup, upgrade, licença e consistência eventual entre dois bancos.' },
              { texto: 'AGE no Postgres, com profundidade limitada.', vai: 'depois', tom: 'ok', consequencia: 'uma infraestrutura, uma transação, Cypher para o caminho de profundidade variável.' },
              { texto: 'Tabelas com CTE recursiva (ainda mais simples).', vai: 'depois', tom: 'ok', consequencia: 'também defensável enquanto os saltos forem poucos e as consultas, poucas.' }
            ] },
            depois: { texto: 'Dois anos depois, o grafo é o produto: dezenas de milhões de arestas, algoritmos de grafo em produção e a equipe aceita operar mais um banco. E agora?', opcoes: [
              { texto: 'Manter o AGE a qualquer custo.', vai: 'f-teimoso', tom: 'ruim', consequencia: 'o gatilho de revisão do ADR existe para este caso.' },
              { texto: 'Reabrir o ADR e avaliar Neo4j.', vai: 'f-bom', tom: 'ok', consequencia: 'a decisão muda com o gatilho, registrada, e não por moda.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Começou barato e reabriu a decisão quando o gatilho do ADR disparou.' },
            'f-pesado': { bom: false, texto: 'Um banco a mais para operar antes de existir qualquer necessidade.' },
            'f-teimoso': { bom: false, texto: 'A decisão virou dogma e a consulta pesada não cabe no tempo aceitável.' }
          },
          callout: 'Você escolheu pelo gargalo do momento e deixou o gatilho do ADR decidir a mudança.' },
        { tipo: 'takeaway', html: 'O <mark>gargalo do primeiro ano</mark> é custo operacional: comece em <mark>Postgres</mark> e reabra o ADR pelo gatilho.' }
      ] },

      { rotulo: 'Travessia e cuidados', blocos: [
        { tipo: 'texto', html:
          '<h3>O que quebra se eu mudar este método?</h3>' +
          '<p>A mesma pergunta, nas duas formas. Em SQL puro, com a profundidade e o ciclo controlados à mão:</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto: [
          'WITH RECURSIVE afetados(fqn, distancia, rota) AS (',
          '  SELECT chamador, 1, ARRAY[chamador, :alvo]',
          '  FROM chamadas WHERE chamado = :alvo',
          '  UNION ALL',
          '  SELECT c.chamador, a.distancia + 1, c.chamador || a.rota',
          '  FROM chamadas c JOIN afetados a ON c.chamado = a.fqn',
          '  WHERE a.distancia < 4 AND NOT c.chamador = ANY(a.rota)   -- limite e anti-ciclo',
          ')',
          'SELECT fqn, MIN(distancia) AS distancia FROM afetados GROUP BY fqn ORDER BY distancia;'].join('\n') },
        { tipo: 'texto', html: '<p>Em Cypher no AGE, a profundidade variável é parte da linguagem (<code>*1..4</code>):</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto: [
          "LOAD 'age'; SET search_path = ag_catalog, \"$user\", public;   -- por sessão!",
          '',
          "SELECT * FROM cypher('t42_repo7', $$",
          "  MATCH caminho = (origem:Metodo)-[:CHAMA*1..4]->(alvo:Metodo {fqn: 'Acme.Pagamentos.PagamentoService.Processar'})",
          '  RETURN DISTINCT origem.fqn AS afetado, length(caminho) AS distancia',
          '  ORDER BY distancia',
          '$$) AS (afetado agtype, distancia agtype);'].join('\n') },
        { tipo: 'texto', html: '<p>A referência executável do SQL está em <code>lab/sql/reference.sql</code>; o laboratório prova a mesma mecânica em memória. O exercício desta aula roda a CTE em <code>sqlite3</code>, que também suporta <code>WITH RECURSIVE</code>.</p>' },
        { tipo: 'rode', id: 'b6-rode', titulo: 'A CTE recursiva, salto a salto', enunciado: 'A tabela <code>chamadas</code> do grafo de exemplo, alvo <code>Arredonda.Moeda</code> (usado por três métodos). A saída vem da solução do exercício.',
          prefixo: '$', entrada: 'python3 cte.py Arredonda.Moeda', unidade: 'ms', terminalTitulo: 'sqlite3 :memory:',
          prever: { pergunta: 'Quantos métodos são afetados a até 2 saltos de Arredonda.Moeda?', opcoes: [
            { id: 'a', texto: '3', correta: false, porque: 'são os chamadores diretos, a 1 salto.' },
            { id: 'b', texto: '6: três a 1 salto e três a 2 saltos', correta: true, porque: 'Juros.Calcular, Desconto.Aplicar e Imposto.Somar a 1; Pagamento.Processar, Fatura.Gerar e Legado.Relatorio a 2.' },
            { id: 'c', texto: '8, todos os chamadores possíveis', correta: false, porque: 'os 8 só aparecem com 3 saltos.' }
          ] },
          etapas: [
            { id: 'p1', nome: 'prof = 1', descricao: 'Chamadores diretos', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'afetados(con, "Arredonda.Moeda", 1)'),
              L('out', '3 métodos: Desconto.Aplicar, Imposto.Somar, Juros.Calcular (distância 1)')] },
            { id: 'p2', nome: 'prof = 2', descricao: 'Segundo salto', tom: 'tcp', ms: 2, linhas: [
              L('cmd', 'afetados(con, "Arredonda.Moeda", 2)'),
              L('out', '6 métodos: + Fatura.Gerar, Legado.Relatorio, Pagamento.Processar (distância 2)')] },
            { id: 'p3', nome: 'prof = 3', descricao: 'Chega às entradas', tom: 'request', ms: 2, linhas: [
              L('cmd', 'afetados(con, "Arredonda.Moeda", 3)'),
              L('out', '8 métodos: + Api.Fatura, Tela.Pagar (distância 3)'),
              L('hint', 'rota percorrida impede o ciclo; o limite impede a explosão')] }
          ],
          tutorDepois: 'O limite de profundidade é parte da consulta, não um detalhe: em grafo com ciclo e um hub muito chamado, a travessia ilimitada devolve o repositório inteiro ou explode.',
          callout: 'Você viu a vizinhança crescer salto a salto.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Cuidados com AGE', html:
          '<ol><li><strong><code>LOAD \'age\'</code> e o <code>search_path</code> valem por sessão.</strong> Com pool de conexões, toda conexão nova precisa deles (listener de <code>connect</code> no engine); senão aparece "função <code>cypher</code> não existe" de forma intermitente.</li>' +
          '<li><strong>Um grafo por tenant</strong> (<code>create_graph(\'t42_repo7\')</code>), com o nome derivado do escopo autenticado no servidor e nunca de parâmetro vindo do modelo (M09 bloco 4). Os vértices vivem em tabelas internas que a policy de RLS não cobre.</li>' +
          '<li><strong>Interpolação em <code>$$ ... $$</code> é superfície de injeção.</strong> Valide cada valor (fqn contra regex de identificador, profundidade como <code>int</code>) ou use passagem de parâmetro se o driver oferecer.</li>' +
          '<li><strong>Limite a profundidade, sempre</strong> (<code>*1..4</code>, não <code>*</code>): travessia ilimitada em grafo com ciclo explode. Para "tudo alcançável", carregue o subgrafo e resolva em networkx. "Código morto" é candidato, nunca veredito.</li></ol>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Sintomas e conserto', html:
          '<ul><li><strong>"função cypher não existe" intermitente:</strong> <code>LOAD</code> e <code>search_path</code> por sessão; listener de <code>connect</code>.</li>' +
          '<li><strong>Travessia trava ou explode em memória:</strong> profundidade ilimitada em grafo com ciclos; limite (<code>*1..4</code>) ou subgrafo em networkx.</li>' +
          '<li><strong>Grafo diz que o método não tem chamadores, mas é usado:</strong> reflexão, DI por convenção ou chamada por string; marque como candidato com confiança menor que 1.</li>' +
          '<li><strong>Um tenant enxerga o grafo de outro:</strong> um grafo por tenant+repo, nomeado pelo escopo do runtime.</li>' +
          '<li><strong>Ingestão demora minutos pela escrita:</strong> lotes de ~500, não um <code>CREATE</code> por nó.</li></ul>' },
        { tipo: 'takeaway', html: '<mark>LOAD e search_path</mark> por sessão, <mark>um grafo por tenant</mark>, valores validados e profundidade <mark>sempre limitada</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'complete', id: 'b6-cypher', titulo: 'A consulta em Cypher', obrigatorio: false,
          enunciado: 'Complete a consulta de impacto no AGE.',
          linguagem: 'sql',
          partes: [
            "SELECT * FROM cypher(",
            { lacuna: 'g', opcoes: ["'t42_repo7'  -- nome derivado do escopo autenticado", ":grafo_pedido_pelo_modelo", "'publico'"], correta: "'t42_repo7'  -- nome derivado do escopo autenticado" },
            ", $$\n  MATCH caminho = (origem:Metodo)-[:CHAMA",
            { lacuna: 'p', opcoes: ['*1..4', '*', '*0..'], correta: '*1..4' },
            "]->(alvo:Metodo {fqn: 'Acme.Pagamentos.PagamentoService.Processar'})\n  RETURN ",
            { lacuna: 'r', opcoes: ['DISTINCT origem.fqn AS afetado, length(caminho) AS distancia', 'origem', '*'], correta: 'DISTINCT origem.fqn AS afetado, length(caminho) AS distancia' },
            "\n$$) AS (afetado agtype, distancia agtype);"
          ],
          explicacao: 'O nome do grafo vem do runtime, a profundidade é <code>*1..4</code> e a resposta é um conjunto com distância, que dá para citar.' },
        { tipo: 'python', id: 'b6-python', titulo: 'CTE recursiva e entrada validada', obrigatorio: false,
          enunciado: 'Complete <code>afetados</code> (passo recursivo com limite de distância e anti-ciclo pela rota), <code>validar_fqn</code> (só identificadores separados por ponto), <code>nome_grafo</code> (a partir de inteiros do escopo) e <code>profundidade_segura</code> (inteiro de 1 a 6).',
          codigo: codigoCte, testes: testesCte,
          dica: 'Passo recursivo: <code>UNION ALL SELECT c.chamador, a.distancia + 1, \',\' || c.chamador || a.rota FROM chamadas c JOIN afetados a ON c.chamado = a.fqn WHERE a.distancia &lt; :prof AND instr(a.rota, \',\' || c.chamador || \',\') = 0</code>. <code>int()</code> rejeita texto com <code>ValueError</code>.',
          solucao: solucaoCte,
          tutorDepois: 'Valide o que entra no <code>$$</code>, derive o nome do grafo do escopo e nunca deixe a profundidade livre: as três defesas cabem em funções pequenas e testáveis.',
          callout: 'Travessia com anti-ciclo e entrada validada passaram nos testes.' },
        { tipo: 'escolha', id: 'b6-esc-pool', titulo: 'Confira: o pool e a sessão',
          pergunta: 'Com pool de conexões, a consulta Cypher falha de vez em quando com "função cypher não existe". Qual a causa e o conserto?',
          opcoes: [
            { id: 'a', texto: 'O AGE não está instalado; reinstale a extensão.', correta: false, porque: 'se não estivesse instalado, falharia sempre.' },
            { id: 'b', texto: '<code>LOAD \'age\'</code> e o <code>search_path</code> valem por sessão; as conexões novas do pool não os têm. Execute os dois num listener de <code>connect</code> do engine.', correta: true, porque: 'é intermitente porque depende de qual conexão o pool entrega.' },
            { id: 'c', texto: 'A profundidade está ilimitada.', correta: false, porque: 'isso gera travessia explosiva, não erro de função.' },
            { id: 'd', texto: 'Falta RLS nas tabelas do grafo.', correta: false, porque: 'RLS é isolamento, não existência da função.' }
          ], tutorDepois: 'Toda conexão nova precisa dos dois comandos.' },
        { tipo: 'escolha', id: 'b6-esc-tenant', titulo: 'Confira: isolamento por tenant',
          pergunta: 'Como isolar tenants no AGE?',
          opcoes: [
            { id: 'a', texto: 'Policy de RLS nas tabelas internas de vértices.', correta: false, porque: 'o RLS não cobre as tabelas internas do AGE.' },
            { id: 'b', texto: 'Um grafo por tenant (ou tenant+repo), com o nome derivado do escopo autenticado no servidor, não de parâmetro do modelo.', correta: true, porque: 'M09 bloco 4: o escopo vem do runtime autenticado.' },
            { id: 'c', texto: 'Um filtro tenant_id dentro do prompt.', correta: false, porque: 'prompt é consultivo.' },
            { id: 'd', texto: 'Compartilhar um grafo e confiar no LLM para filtrar.', correta: false, porque: 'o isolamento tem de ser mecânico.' }
          ], tutorDepois: 'Valide ainda cada valor interpolado no $$.' },
        { tipo: 'takeaway', html: 'A mesma travessia existe em <mark>SQL recursivo</mark> e em <mark>Cypher</mark>; os cuidados são <mark>de borda</mark>, não de algoritmo.' }
      ] }
    ]
  });
})();
