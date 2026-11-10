/* F05 · Bloco 4: índices e desempenho: B-tree, índice composto, seletividade, cobertura, EXPLAIN e N+1. Fonte: F05.html#b04. Planos medidos no lab: SQLite 3.53.1 (11/10/2026); PostgreSQL por documentação oficial. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasPlano = function () {
    return [
      { id: 'antes', nome: 'Antes da 002', descricao: 'Sem índice em loan', tom: 'dns', ms: 20000, linhas: [
        L('cmd', 'uv run python -m sqllab.cli plan'),
        L('info', 'SELECT id, book_id, loaned_on FROM loan WHERE member_id = ? ORDER BY loaned_on DESC;'),
        L('out', '-- before migration 002'),
        L('out', 'SCAN loan'),
        L('out', 'USE TEMP B-TREE FOR ORDER BY'),
        L('hint', 'lê as 20 mil linhas e ainda ordena num B-tree temporário')] },
      { id: 'depois', nome: 'Depois da 002', descricao: 'Índice (member_id, loaned_on)', tom: 'tcp', ms: 1, linhas: [
        L('out', '-- after migration 002'),
        L('out', 'SEARCH loan USING INDEX idx_loan_member_loaned (member_id=?)'),
        L('hint', 'a linha de ordenação desapareceu: o índice ordenado por (member_id, loaned_on) é percorrido de trás para frente para o DESC')] },
      { id: 'nplus1', nome: 'N+1', descricao: 'Instruções que chegam ao SQLite', tom: 'tls', ms: 9, linhas: [
        L('cmd', 'uv run python -m sqllab.cli nplus1'),
        L('out', 'N+1: 9 statements'),
        L('out', 'JOIN: 1 statement'),
        L('hint', '8 livros: 1 consulta para a lista + 8 para os autores = 9')] }
    ];
  };

  var FAKE =
    'class FakeDb:\n' +
    '    """Banco falso: conta quantas instruções chegam a ele."""\n' +
    '    def __init__(self):\n' +
    '        self.autores = {1: "Machado de Assis", 2: "Jorge Amado", 3: "Clarice Lispector"}\n' +
    '        self.livros = [(f"livro {i}", 1 + i % 3) for i in range(8)]\n' +
    '        self.instrucoes = 0\n\n' +
    '    def listar_livros(self):\n' +
    '        self.instrucoes += 1\n' +
    '        return list(self.livros)\n\n' +
    '    def buscar_autor(self, autor_id):\n' +
    '        self.instrucoes += 1\n' +
    '        return self.autores[autor_id]\n\n' +
    '    def livros_com_autor(self):\n' +
    '        """Equivale a um JOIN: uma única instrução."""\n' +
    '        self.instrucoes += 1\n' +
    '        return [(titulo, self.autores[a]) for titulo, a in self.livros]\n\n\n' +
    'def n_mais_1(db):\n' +
    '    return [(t, db.buscar_autor(a)) for t, a in db.listar_livros()]\n\n\n';

  TrilhaAula.registrar({
    id: 'f05-b4',
    titulo: 'Índices e desempenho: B-tree, EXPLAIN e N+1',
    minutos: 40,
    resumo: 'Com 100 linhas qualquer consulta é rápida. Com 50 milhões, a diferença entre busca por índice e varredura completa é a diferença entre milissegundos e minutos. Índice é a ferramenta; plano é o instrumento; N+1 é o erro que nenhum índice conserta.',
    objetivo: 'Ler um plano de execução, escolher a ordem das colunas de um índice composto, saber quando um índice não será usado e detectar N+1.',
    revisao: [
      { id: 'f05b4-prefixo', pergunta: 'Existe um índice em (member_id, loaned_on). Ele ajuda em WHERE loaned_on = ? sozinho? E em WHERE member_id = ?',
        opcoes: [
          opc('a', 'Não no primeiro (sem o prefixo, SCAN); sim no segundo (member_id é o prefixo à esquerda)', true, 'as entradas com essa data estão espalhadas por todos os membros.'),
          opc('b', 'Sim nos dois, porque o índice contém as duas colunas', false, 'o índice composto só serve a prefixos à esquerda.'),
          opc('c', 'Não nos dois', false, 'o prefixo member_id é navegável.')] },
      { id: 'f05b4-sargavel', pergunta: 'Por que WHERE strftime(\'%Y\', loaned_on) = \'2025\' faz SCAN mesmo com índice em loaned_on?',
        opcoes: [
          opc('a', 'Função sobre a coluna: o índice guarda loaned_on, não o ano. Reescreva como intervalo ou crie índice de expressão', true, 'predicado não-sargável.'),
          opc('b', 'strftime é lenta demais para usar índice', false, 'o problema é a expressão não coincidir com o que está indexado.'),
          opc('c', 'O índice só aceita igualdade', false, 'a B-tree serve intervalo.')] },
      { id: 'f05b4-seletividade', pergunta: 'Um índice em returned_on (95% fechadas, 5% nulas) ajuda em returned_on IS NOT NULL?',
        opcoes: [
          opc('a', 'Pouco: ler 95% da tabela por índice, com salto aleatório por linha, custa mais que a varredura sequencial; o otimizador acerta ao ignorá-lo', true, 'desde que as estatísticas (ANALYZE) estejam atualizadas.'),
          opc('b', 'Sim: índice sempre vence varredura', false, 'depende da seletividade.'),
          opc('c', 'Não, porque índice não indexa NULL', false, 'o motivo é a seletividade baixa do predicado.')] },
      { id: 'f05b4-n1', pergunta: 'Um endpoint é rápido com 10 itens e lento com 10 mil, e cada consulta isolada é rápida. O que é e qual a defesa?',
        opcoes: [
          opc('a', 'N+1: 1 + N viagens ao banco. Cure com JOIN / selectinload / IN em lote e um teste que conta instruções', true, 'nenhum índice resolve, porque cada consulta individual já é rápida.'),
          opc('b', 'Falta de índice na chave primária', false, 'a PK já é indexada e as consultas são rápidas.'),
          opc('c', 'Deadlock', false, 'deadlock trava, não degrada com N.')] },
      { id: 'f05b4-concurrently', pergunta: 'Qual o risco de um CREATE INDEX comum numa tabela grande em produção no PostgreSQL e como evitá-lo?',
        opcoes: [
          opc('a', 'Bloqueia escritas na tabela durante a construção; use CREATE INDEX CONCURRENTLY (fora de transação; se falhar deixa índice INVALID para remover e refazer)', true, 'mais lento, mas não bloqueia escritas.'),
          opc('b', 'Apaga a tabela se falhar', false, 'não apaga; o risco é o lock.'),
          opc('c', 'Nenhum: índice é sempre online', false, 'a forma comum toma lock que bloqueia escritas.')] }
    ],
    abas: [
      { rotulo: 'B-tree e índice composto', blocos: [
        { tipo: 'texto', html:
          '<h3>Desempenho é caminho de acesso</h3>' +
          '<p>Com 100 linhas, nenhum erro de modelagem aparece. Com 50 milhões, uma busca por índice e uma varredura completa separam milissegundos de minutos, e um serviço de pé de um banco saturado. Desempenho de banco é, em grande parte, quantas páginas o banco precisa ler para responder.</p>' +
          '<h3>O mecanismo: a B-tree</h3>' +
          '<p>O banco guarda a tabela em páginas (blocos de 4 a 16 KB). Sem índice, achar as linhas com <code>member_id = 7</code> exige ler todas as páginas (<em>full scan</em>, custo O(N)). Um índice <strong>B-tree</strong> mantém as chaves <strong>ordenadas</strong> numa árvore balanceada de páginas com poucos níveis (três ou quatro cobrem bilhões de entradas, porque cada página guarda centenas de chaves). A busca desce da raiz às folhas em O(log N) leituras; as folhas, encadeadas, permitem percorrer um intervalo em ordem. Esquema: buscar 250 vai da raiz (400 | 800) ao ramo 200..299, à folha e ao ponteiro para a linha.</p>' +
          '<ul><li><strong>Entrega:</strong> igualdade (<code>=</code>), intervalo (<code>&lt;</code>, <code>&gt;</code>, <code>BETWEEN</code>), ordenação (<code>ORDER BY</code> sem passo extra de sort), prefixo de texto (<code>LIKE \'abc%\'</code>, sob certas regras de collation), <code>MIN/MAX</code>.</li>' +
          '<li><strong>Não entrega:</strong> sufixo ou substring (<code>LIKE \'%abc\'</code>), texto livre, JSON interno, vetores. Para isso há outros tipos (PostgreSQL: GIN, GiST, BRIN, hash; e <code>pgvector</code> com HNSW/IVFFlat no M07).</li></ul>' +
          '<p><strong>Custos, sempre:</strong> cada índice ocupa espaço, é atualizado em <strong>toda</strong> escrita que toque suas colunas (um <code>INSERT</code> numa tabela com 6 índices faz 7 escritas) e disputa memória de cache. Índice troca custo de escrita por custo de leitura. No PostgreSQL, atualizações também geram versões novas de linha (MVCC, bloco 5) que o <code>VACUUM</code> precisa limpar, e um índice a mais pode impedir a otimização <em>HOT update</em>.</p>' },
        { tipo: 'texto', html:
          '<h3>Índice composto e a regra do prefixo à esquerda</h3>' +
          '<p>Um índice em <code>(member_id, loaned_on)</code> ordena primeiro por <code>member_id</code> e, dentro de cada membro, por <code>loaned_on</code>, como uma agenda telefônica (sobrenome, depois nome).</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Consulta</th><th>Plano medido no lab (SQLite)</th><th>Por quê</th></tr></thead><tbody>' +
          '<tr><td><code>WHERE member_id = 7</code></td><td><code>SEARCH ... USING INDEX (member_id=?)</code></td><td>prefixo à esquerda</td></tr>' +
          '<tr><td><code>WHERE member_id = 7 AND loaned_on &gt;= \'2025-06-01\'</code></td><td><code>SEARCH ... (member_id=? AND loaned_on&gt;?)</code></td><td>igualdade no 1º, intervalo no 2º: usa as duas colunas</td></tr>' +
          '<tr><td><code>WHERE loaned_on = \'2025-06-01\'</code></td><td><code>SCAN loan</code></td><td>sem o prefixo, as entradas com essa data estão espalhadas por todos os membros</td></tr>' +
          '<tr><td><code>WHERE strftime(\'%Y\', loaned_on) = \'2025\'</code></td><td><code>SCAN loan</code></td><td>função sobre a coluna: o índice guarda <code>loaned_on</code>, não o ano</td></tr>' +
          '<tr><td><code>WHERE loaned_on LIKE \'2025-06%\'</code></td><td><code>SCAN loan</code></td><td>sem o prefixo <code>member_id</code> (e o <code>LIKE</code> no SQLite exige collation compatível)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p><strong>Como ordenar as colunas.</strong> Regra prática, com exceções: primeiro as colunas comparadas por <em>igualdade</em>, depois a coluna de <em>intervalo</em> ou de <em>ordenação</em>. Entre colunas de igualdade, a mais seletiva primeiro ajuda quando a consulta usa só o prefixo, mas a consulta mais frequente manda: um índice <code>(status, created_at)</code> serve a "todos os pendentes por data", enquanto <code>(created_at, status)</code> não. Depois de uma coluna com intervalo, as seguintes deixam de posicionar a busca (podem ainda filtrar dentro do índice). Um índice composto <code>(a, b)</code> torna redundante um índice isolado em <code>(a)</code>.</p>' },
        { tipo: 'takeaway', html: 'Igualdades da esquerda para a direita; o <mark>primeiro intervalo ou buraco</mark> encerra a navegação. Sem a <mark>coluna líder</mark>, a B-tree não ajuda.' }
      ] },

      { rotulo: 'Seletividade e cobertura', blocos: [
        { tipo: 'texto', html:
          '<h3>Quando o otimizador ignora o índice</h3>' +
          '<p><strong>Seletividade</strong> é a fração de linhas que um predicado seleciona: fração baixa = muito seletivo = bom candidato. Um índice em <code>returned_on</code> (95% das linhas fechadas, 5% nulas) é pouco útil para <code>returned_on IS NOT NULL</code>: ler 95% da tabela via índice, com salto aleatório a cada linha, custa mais que a varredura sequencial. O otimizador sabe disso <em>se tiver estatísticas atualizadas</em> (<code>ANALYZE</code>; no PostgreSQL o autovacuum faz isso, mas após cargas grandes vale rodar manualmente) e escolhe a varredura por conta própria. Três consequências:</p>' +
          '<ul><li>"O índice existe e não é usado" muitas vezes não é bug: é decisão correta por custo. Ou estatísticas desatualizadas. Ou predicado não-sargável.</li>' +
          '<li><strong>Predicados não-sargáveis</strong> (que o índice não consegue usar): função sobre a coluna, conversão implícita de tipo (<code>WHERE phone = 5511...</code> comparando texto com inteiro), <code>LIKE \'%x\'</code>, <code>OR</code> entre colunas diferentes, negações. Conserto: reescrever (comparar intervalos de datas em vez de extrair o ano) ou criar <strong>índice de expressão</strong> (<code>CREATE INDEX ON t (lower(email))</code>, no PostgreSQL e no SQLite).</li>' +
          '<li><strong>Índice parcial</strong> indexa só o subconjunto que importa. O lab tem <code>idx_loan_open ON loan (due_on) WHERE returned_on IS NULL</code>: guarda só os empréstimos abertos (cerca de 6% dos 20 mil), é pequeno, barato de manter e atende "o que está vencido?".</li></ul>' },
        { tipo: 'texto', largo: true, html:
          '<p>Medido sobre os 20 mil empréstimos, com o índice parcial:</p>' +
          '<table><thead><tr><th>Consulta</th><th>Plano</th></tr></thead><tbody>' +
          '<tr><td><code>WHERE returned_on IS NULL AND due_on &lt; \'2025-06-01\'</code></td><td><code>SEARCH ... USING INDEX idx_loan_open (due_on&lt;?)</code></td></tr>' +
          '<tr><td><code>WHERE returned_on IS NULL</code> sozinho</td><td><code>SCAN loan USING INDEX idx_loan_open</code>: percorre só as entradas dos abertos</td></tr>' +
          '<tr><td><code>WHERE due_on &lt; \'2025-06-01\'</code> sem o predicado de abertos</td><td><code>SCAN loan</code>: o índice parcial não contém os fechados e usá-lo perderia linhas</td></tr>' +
          '</tbody></table>' +
          '<p>O otimizador só emprega um índice parcial quando consegue provar que o filtro da consulta implica o filtro do índice.</p>' },
        { tipo: 'texto', html:
          '<h3>Índice de cobertura</h3>' +
          '<p>Quando todas as colunas de que a consulta precisa estão no próprio índice, o banco responde sem tocar na tabela. No SQLite o plano mostra <code>USING COVERING INDEX</code>; no PostgreSQL, <code>Index Only Scan</code>, que ainda consulta o mapa de visibilidade e só é realmente "sem acesso à tabela" para páginas marcadas como visíveis, mantido pelo <code>VACUUM</code>.</p>' +
          '<p>Medido: com o índice <code>(member_id, loaned_on)</code>, <code>SELECT loaned_on FROM loan WHERE member_id = 7</code> usa <code>COVERING INDEX</code>; <code>SELECT *</code> com o mesmo filtro usa o índice mas precisa ir à tabela buscar as demais colunas. O PostgreSQL permite incluir colunas só de carga com <code>CREATE INDEX ... INCLUDE (col)</code> (11+), sem ordená-las nem exigir unicidade sobre elas. O preço: índices largos custam espaço e escrita. Cubra as consultas quentes, não todas.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: indexar e esquecer o bloqueio', html:
          '<ul><li>No PostgreSQL, <code>CREATE INDEX</code> comum toma um lock que bloqueia escritas durante toda a construção; em tabela grande, é indisponibilidade de escrita. Use <code>CREATE INDEX CONCURRENTLY</code> (mais lento, não bloqueia escritas, não roda dentro de transação, e deixa um índice <code>INVALID</code> se falhar, que precisa ser removido e refeito).</li>' +
          '<li>Índice que ninguém usa cobra escrita: <code>pg_stat_user_indexes.idx_scan = 0</code> por semanas é candidato a remoção.</li>' +
          '<li><code>EXPLAIN</code> em banco de desenvolvimento pequeno recomenda <code>Seq Scan</code> e engana: planos só valem com volume e distribuição parecidos com os de produção.</li></ul>' },
        { tipo: 'takeaway', html: 'Índice não usado nem sempre é bug: pode ser <mark>seletividade baixa</mark>, <mark>predicado não-sargável</mark> ou estatística velha. Teste com <mark>volume realista</mark>.' }
      ] },

      { rotulo: 'Planos e N+1', blocos: [
        { tipo: 'texto', html:
          '<h3>Ler um plano: EXPLAIN</h3>' +
          '<p>Plano é a árvore de operações que o banco escolheu. Ler planos é a competência central de tuning, e o que muda entre bancos é o vocabulário, não a ideia.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Ideia</th><th>SQLite <code>EXPLAIN QUERY PLAN</code></th><th>PostgreSQL <code>EXPLAIN</code></th></tr></thead><tbody>' +
          '<tr><td>varredura completa</td><td><code>SCAN loan</code></td><td><code>Seq Scan on loan</code></td></tr>' +
          '<tr><td>busca por índice</td><td><code>SEARCH loan USING INDEX i (member_id=?)</code></td><td><code>Index Scan</code> / <code>Bitmap Index Scan</code> + <code>Bitmap Heap Scan</code></td></tr>' +
          '<tr><td>só índice</td><td><code>USING COVERING INDEX</code></td><td><code>Index Only Scan</code></td></tr>' +
          '<tr><td>ordenação extra</td><td><code>USE TEMP B-TREE FOR ORDER BY</code></td><td><code>Sort</code> (com <code>Sort Method: external merge</code> se transbordar para disco)</td></tr>' +
          '<tr><td>custo e linhas estimados</td><td>não mostra</td><td><code>cost=0.29..8.31 rows=1 width=...</code></td></tr>' +
          '<tr><td>execução real</td><td>não há</td><td><code>EXPLAIN (ANALYZE, BUFFERS)</code>: tempo, linhas reais, páginas lidas</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p><code>EXPLAIN ANALYZE</code> do PostgreSQL <strong>executa a consulta de verdade</strong> (inclusive <code>INSERT/UPDATE/DELETE</code>: envolva em <code>BEGIN; ... ROLLBACK;</code>). A leitura útil é comparar as linhas estimadas com as reais em cada nó: uma estimativa 1000 vezes menor que a real indica estatística ruim, e é a origem de quase todo plano catastrófico (nested loop escolhido para milhões de linhas).</p>' +
          '<p>O lab mede o antes e o depois da migration <code>002</code> sobre 20 mil empréstimos (gerados de forma determinística), e conta as instruções do N+1. Preveja antes de rodar o plano.</p>' },
        { tipo: 'rode', id: 'f05b4-rode', titulo: 'Antes e depois do índice, e o N+1', enunciado: 'Rode as três etapas. A barra da primeira mostra o tamanho da varredura (20 mil linhas); a da segunda, uma busca por índice.',
          prefixo: '$', entrada: 'uv run python -m sqllab.cli plan', unidade: 'linhas lidas', terminalTitulo: 'sqllab', etapas: etapasPlano(),
          prever: { pergunta: 'Depois da migration 002, que cria o índice (member_id, loaned_on), o que acontece com a linha "USE TEMP B-TREE FOR ORDER BY" do plano?', opcoes: [
            { id: 'a', texto: 'Continua: o ORDER BY sempre precisa de uma ordenação.', correta: false, porque: 'o índice já entrega as linhas ordenadas por loaned_on dentro de cada membro.' },
            { id: 'b', texto: 'Desaparece: o índice é percorrido de trás para frente para o DESC.', correta: true, porque: 'um índice bem escolhido elimina trabalho, não só acelera.' },
            { id: 'c', texto: 'Vira um segundo SCAN.', correta: false, porque: 'o plano passa a ser um único SEARCH pelo índice.' }
          ] },
          tutorAntes: 'Aperte Enter e compare o antes e o depois.',
          tutorDepois: 'Antes: SCAN de 20 mil linhas mais ordenação temporária. Depois: SEARCH pelo índice, sem ordenação. E o N+1 mostra 9 instruções contra 1: nenhum índice resolveria isso.',
          callout: 'Você viu o SCAN virar SEARCH e a linha de ordenação sumir.' },
        { tipo: 'texto', html:
          '<h3>O problema N+1</h3>' +
          '<p>Uma consulta traz N itens; um laço executa uma consulta extra por item para buscar dados relacionados. São 1 + N viagens ao banco, cada uma com latência de rede, parse, planejamento e bloqueio de conexão. Em desenvolvimento (10 linhas, banco local) parece instantâneo; em produção (10 mil linhas, banco em outra zona) são 10 mil idas e voltas. Nenhum índice resolve, porque cada consulta já é rápida. O lab conta as instruções que chegam ao SQLite com <code>set_trace_callback</code>.</p>' +
          '<p>Em ORMs (SQLAlchemy no M03), o N+1 nasce do <em>lazy loading</em>: acessar <code>livro.autor</code> dentro de um laço dispara uma consulta por iteração, sem que o código pareça fazer consulta. Curas:</p>' +
          '<ul><li><code>JOIN</code> / <code>joinedload</code> para um-para-um e muitos-para-um.</li>' +
          '<li><code>selectinload</code> ou <code>WHERE id IN (...)</code> em lote para um-para-muitos (evita a explosão cartesiana).</li>' +
          '<li><strong>Um teste que conta as consultas:</strong> afirme "no máximo 3 instruções" para o endpoint. Sem teste, o N+1 volta no primeiro refactor.</li></ul>' },
        { tipo: 'takeaway', html: 'Leia o plano <mark>antes e depois</mark>, com volume realista. N+1 é erro de aplicação: <mark>conte as instruções</mark> em teste e traga os dados em lote.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'f05b4-python', titulo: 'Até onde a B-tree navega', obrigatorio: false,
          enunciado: 'Complete <code>colunas_navegaveis(indice, predicados)</code>. <code>indice</code> é a lista de colunas na ordem do índice; <code>predicados</code> mapeia coluna para <code>"="</code> ou <code>"intervalo"</code> (coluna ausente = sem filtro). Devolva a lista das colunas que a B-tree usa para descer, da esquerda para a direita: cada igualdade continua, o primeiro intervalo entra e encerra, e uma coluna sem filtro encerra sem entrar.',
          codigo: 'def colunas_navegaveis(indice, predicados):\n    usadas = []\n    for coluna in indice:\n        tipo = predicados.get(coluna)\n        # sem filtro: encerra; "=": usa e continua; "intervalo": usa e encerra\n        break\n    return usadas\n\n\nprint(colunas_navegaveis(["estado", "cidade", "nome"], {"estado": "=", "cidade": "="}))\n',
          testes: 'IDX = ["estado", "cidade", "nome"]\n\n\ndef test_prefixo_de_igualdades():\n    assert colunas_navegaveis(IDX, {"estado": "="}) == ["estado"]\n    assert colunas_navegaveis(IDX, {"estado": "=", "cidade": "=", "nome": "="}) == IDX\n\n\ndef test_intervalo_encerra_a_navegacao():\n    assert colunas_navegaveis(IDX, {"estado": "=", "cidade": "intervalo", "nome": "="}) == ["estado", "cidade"]\n\n\ndef test_buraco_encerra():\n    assert colunas_navegaveis(IDX, {"estado": "=", "nome": "="}) == ["estado"]\n\n\ndef test_borda_sem_coluna_lider():\n    assert colunas_navegaveis(IDX, {"cidade": "=", "nome": "="}) == []\n    assert colunas_navegaveis(IDX, {}) == []\n\n\ndef test_controle_negativo_ordem_das_colunas_importa():\n    assert colunas_navegaveis(["criado_em", "status"], {"status": "="}) == []\n    assert colunas_navegaveis(["status", "criado_em"], {"status": "="}) == ["status"]\n',
          dica: 'Se <code>tipo is None</code>, <code>break</code>. Se <code>"="</code>, <code>append</code> e siga. Se <code>"intervalo"</code>, <code>append</code> e <code>break</code>.',
          solucao: 'def colunas_navegaveis(indice, predicados):\n    usadas = []\n    for coluna in indice:\n        tipo = predicados.get(coluna)\n        if tipo is None:\n            break\n        usadas.append(coluna)\n        if tipo == "intervalo":\n            break\n    return usadas\n',
          tutorDepois: 'É a mesma regra do plano: o índice (status, criado_em) serve a "pendentes por data"; o (criado_em, status) não serve a status sozinho.',
          callout: 'O prefixo à esquerda agora é uma função que você testou.' },
        { tipo: 'python', id: 'f05b4-python-n1', titulo: 'Troque o N+1 por uma instrução', obrigatorio: false,
          enunciado: 'O <code>FakeDb</code> conta instruções. <code>n_mais_1(db)</code> faz 1 + 8 = 9. Complete <code>com_join(db)</code> para devolver a mesma lista de <code>(titulo, autor)</code> com uma única instrução, usando <code>db.livros_com_autor()</code>.',
          codigo: FAKE + 'def com_join(db):\n    # uma única instrução: use db.livros_com_autor()\n    return []\n\n\ndb = FakeDb()\nn_mais_1(db)\nprint("N+1:", db.instrucoes, "statements")\n',
          testes: 'def test_n_mais_1_custa_9():\n    db = FakeDb()\n    n_mais_1(db)\n    assert db.instrucoes == 9\n\n\ndef test_join_custa_1_e_devolve_o_mesmo():\n    a, b = FakeDb(), FakeDb()\n    assert com_join(a) == n_mais_1(b)\n    assert a.instrucoes == 1\n\n\ndef test_borda_sem_livros():\n    db = FakeDb()\n    db.livros = []\n    assert com_join(db) == []\n    assert db.instrucoes == 1\n\n\ndef test_controle_negativo_o_teste_pega_o_laco():\n    db = FakeDb()\n    n_mais_1(db)\n    assert db.instrucoes > 3\n',
          dica: 'A função é uma linha: <code>return db.livros_com_autor()</code>.',
          solucao: FAKE + 'def com_join(db):\n    return db.livros_com_autor()\n',
          tutorDepois: 'O teste que afirma db.instrucoes == 1 é o que impede o N+1 de voltar no próximo refactor.',
          callout: 'Você trocou 9 instruções por 1 e deixou um teste que conta.' },
        { tipo: 'cenario', id: 'f05b4-cenario', titulo: 'Rápido com 10, lento com 10 mil', obrigatorio: false,
          enunciado: 'Um endpoint que lista livros com autor responde bem em desenvolvimento e leva segundos em produção. Cada consulta isolada leva 2 ms. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O que você faz primeiro?', opcoes: [
              { texto: 'Criar índices em todas as colunas do endpoint.', vai: 'f-indices', tom: 'ruim', consequencia: 'cada consulta já era rápida; os índices só encarecem as escritas.' },
              { texto: 'Logar ou contar as instruções que o endpoint emite.', vai: 'contar', tom: 'ok', consequencia: 'você descobre 10 001 instruções para 10 mil livros: N+1.' }
            ] },
            contar: { texto: 'São 1 + N instruções. Como corrigir e como impedir que volte?', opcoes: [
              { texto: 'Trazer autores com JOIN / joinedload / selectinload e escrever um teste que afirma "no máximo 3 instruções".', vai: 'f-bom', tom: 'ok', consequencia: 'o custo cai de N viagens para uma ou duas, e o teste protege contra o próximo refactor.' },
              { texto: 'Aumentar o cache do banco.', vai: 'f-cache', tom: 'ruim', consequencia: 'o tempo está nas idas e voltas, não na leitura de páginas.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O endpoint faz 1 a 2 instruções e um teste de contagem de instruções impede a regressão.' },
            'f-indices': { bom: false, texto: 'O endpoint continua lento e a escrita ficou mais cara.' },
            'f-cache': { bom: false, texto: 'Nada mudou: as 10 001 viagens continuam.' }
          },
          callout: 'Você contou as instruções, corrigiu em lote e protegeu com um teste.' },
        { tipo: 'escolha', id: 'f05b4-escolha-prefixo', titulo: 'Confira: o índice (estado, cidade, nome)',
          pergunta: 'Existe o índice <code>(estado, cidade, nome)</code>. Qual consulta aproveita MENOS o índice para navegar?',
          opcoes: [
            { id: 'a', texto: '<code>WHERE estado = ?</code>', correta: false, porque: 'é o prefixo à esquerda.' },
            { id: 'b', texto: '<code>WHERE estado = ? AND cidade = ?</code>', correta: false, porque: 'dois prefixos de igualdade.' },
            { id: 'c', texto: '<code>WHERE cidade = ? AND nome = ?</code> (sem a coluna líder <code>estado</code>).', correta: true, porque: 'sem a coluna líder, as cidades iguais estão espalhadas por toda a árvore e não há por onde descer.' },
            { id: 'd', texto: '<code>WHERE estado = ? AND cidade = ? AND nome = ?</code>', correta: false, porque: 'usa as três colunas.' }
          ], tutorDepois: 'Prefixo à esquerda.' },
        { tipo: 'escolha', id: 'f05b4-escolha-lower', titulo: 'Confira: a função sobre a coluna',
          pergunta: 'Há um índice em <code>cliente(email)</code>, mas <code>WHERE lower(email) = \'ana@x.com\'</code> faz varredura completa. Qual é a solução mais direta?',
          opcoes: [
            { id: 'a', texto: 'Criar um índice de expressão em <code>lower(email)</code> (ou normalizar o e-mail ao gravar).', correta: true, porque: 'a B-tree está ordenada pelo valor cru; o índice de expressão precisa bater exatamente com a expressão da consulta. Confirme com EXPLAIN antes e depois.' },
            { id: 'b', texto: 'Criar mais um índice em <code>email</code>, desta vez com <code>DESC</code>.', correta: false, porque: 'a função continua inutilizando a busca.' },
            { id: 'c', texto: 'Trocar <code>=</code> por <code>LIKE</code>, que sempre usa índice.', correta: false, porque: 'LIKE nem sempre usa índice (por exemplo, LIKE \'%x\').' },
            { id: 'd', texto: 'Aumentar a memória do servidor.', correta: false, porque: 'o problema é o caminho de acesso.' }
          ], tutorDepois: 'Índice de expressão ou valor já normalizado.' },
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs e erros comuns', html:
          '<ul><li><strong>Indexar tudo "por garantia":</strong> cada índice taxa as escritas. Indexe a partir das consultas medidas.</li>' +
          '<li><strong>Esquecer o índice da chave estrangeira:</strong> join e <code>DELETE</code> no pai varrem a tabela filha. O lab cria <code>idx_loan_book</code> e <code>idx_loan_member_loaned</code> exatamente para as chaves de <code>loan</code>.</li>' +
          '<li><strong>Medir uma vez:</strong> a primeira execução paga cache frio; meça várias e compare planos, não só tempos.</li>' +
          '<li><strong>Otimizar a consulta errada:</strong> ache as mais custosas no agregado (<code>pg_stat_statements</code>): uma de 5 ms executada 2 mil vezes por segundo pesa mais que uma de 2 s executada uma vez por dia.</li>' +
          '<li><strong><code>OFFSET</code> grande e <code>COUNT(*)</code> exato em tabelas gigantes:</strong> ambos leem muito; use paginação por chave e contagens aproximadas quando o negócio aceitar.</li></ul>' },
        { tipo: 'takeaway', html: 'B-tree serve igualdade, intervalo e ordenação; <mark>índice é troca de escrita por leitura</mark> e se mede com o plano.' }
      ] }
    ]
  });
})();
