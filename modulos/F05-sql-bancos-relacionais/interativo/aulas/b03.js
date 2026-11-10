/* F05 · Bloco 3: SQL avançado: CTE, CTE recursiva, window functions, UPSERT e RETURNING. Fonte: F05.html#b03. Saídas do lab: SQLite 3.53.1, Python 3.14.7 (11/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var ARVORE =
    'WITH RECURSIVE tree (id, name, depth, path) AS (\n' +
    '    SELECT id, name, 0, name                      -- âncora: as raízes\n' +
    '    FROM category WHERE parent_id IS NULL\n' +
    '    UNION ALL\n' +
    '    SELECT c.id, c.name, t.depth + 1, t.path || \' > \' || c.name   -- passo: filhos de quem já está em tree\n' +
    '    FROM category AS c JOIN tree AS t ON c.parent_id = t.id\n' +
    ')\n' +
    'SELECT id, depth, path FROM tree ORDER BY path;';

  var etapasRecursao = function () {
    return [
      { id: 'arvore', nome: 'Árvore (q05)', descricao: 'Âncora: raízes. Passo: filhos', tom: 'dns', ms: 7, linhas: [
        L('cmd', 'uv run python -m sqllab.cli run q05_category_tree'),
        L('out', 'id  depth  path'),
        L('out', '1   0      Literatura'),
        L('out', '3   1      Literatura > Conto'),
        L('out', '2   1      Literatura > Romance'),
        L('out', '4   2      Literatura > Romance > Romance histórico'),
        L('out', '5   0      Não ficção'),
        L('out', '6   1      Não ficção > Ciência'),
        L('out', '7   2      Não ficção > Ciência > Computação'),
        L('out', '(7 row(s))'),
        L('hint', 'duas raízes (depth 0); o ORDER BY path mantém cada ramo junto')] },
      { id: 'cadeia', nome: 'Cadeia para cima (q06)', descricao: 'Âncora: o membro 5. Passo: referred_by', tom: 'tcp', ms: 4, linhas: [
        L('cmd', 'uv run python -m sqllab.cli run q06_referral_chain --member-id 5'),
        L('out', 'depth  id  name'),
        L('out', '0      5   Elisa'),
        L('out', '1      4   Diego'),
        L('out', '2      2   Bruno'),
        L('out', '3      1   Ana'),
        L('out', '(4 row(s))'),
        L('hint', 'a recursão para sozinha quando o passo não produz linha nova: Ana não foi indicada por ninguém')] }
    ];
  };

  var RANKING =
    '$ uv run python -m sqllab.cli run q09_book_popularity\n' +
    'title                            loans  row_number  rank  dense_rank\n' +
    '-------------------------------  -----  ----------  ----  ----------\n' +
    'A Hora da Estrela                2      1           1     1\n' +
    'Dom Casmurro                     2      2           1     1\n' +
    'Gabriela, Cravo e Canela         2      3           1     1\n' +
    'Laços de Família                 1      4           4     2\n' +
    'Memórias Póstumas de Brás Cubas  1      5           4     2\n' +
    'Vidas Secas                      1      6           4     2\n' +
    'Capitães da Areia                0      7           7     3\n' +
    'O Alienista                      0      8           7     3';

  TrilhaAula.registrar({
    id: 'f05-b3',
    titulo: 'SQL avançado: CTE, recursão, janelas e UPSERT',
    minutos: 40,
    resumo: 'O que separa o SQL que busca linhas do SQL que responde perguntas de negócio em uma ida ao banco: passos nomeados, hierarquias, agregados sem colapso e gravação atômica.',
    objetivo: 'Usar CTE, CTE recursiva (com defesa contra ciclos), funções de janela, UPSERT e RETURNING onde elas simplificam de verdade.',
    revisao: [
      { id: 'f05b3-janela-where', pergunta: 'Por que não se pode escrever WHERE ROW_NUMBER() OVER (...) = 1?',
        opcoes: [
          opc('a', 'Janelas são avaliadas depois de WHERE, GROUP BY e HAVING; o filtro precisa de subquery ou CTE que materialize a janela antes', true, 'o padrão é uma CTE com ROW_NUMBER() ... AS rn e, fora, WHERE rn = 1.'),
          opc('b', 'ROW_NUMBER só funciona com GROUP BY', false, 'janelas existem justamente para não colapsar linhas.'),
          opc('c', 'O WHERE só aceita colunas indexadas', false, 'não existe tal regra.')] },
      { id: 'f05b3-rank', pergunta: 'Três livros empatam em 2 empréstimos e o próximo tem 1. Quais ranks recebe o próximo com RANK e com DENSE_RANK?',
        opcoes: [
          opc('a', 'RANK = 4 (salta), DENSE_RANK = 2 (sem lacunas)', true, 'ROW_NUMBER numeraria 1, 2, 3, 4 e quebraria o empate arbitrariamente.'),
          opc('b', 'RANK = 2 e DENSE_RANK = 4', false, 'é o contrário.'),
          opc('c', 'Os dois dão 4', false, 'DENSE_RANK não deixa lacunas.')] },
      { id: 'f05b3-recursiva', pergunta: 'Quais são as duas partes de uma CTE recursiva e qual o maior risco?',
        opcoes: [
          opc('a', 'Membro âncora (semente) e membro recursivo, ligados por UNION ALL; o risco é ciclo nos dados, que impede a recursão de terminar', true, 'defesas: acumular o caminho e rejeitar o já visitado, limitar depth, UNION sem ALL ou CYCLE (PostgreSQL 14).'),
          opc('b', 'Um SELECT e um INSERT; o risco é duplicar linhas', false, 'não é essa a estrutura.'),
          opc('c', 'Um índice e uma view; o risco é espaço em disco', false, 'não é essa a estrutura.')] },
      { id: 'f05b3-upsert', pergunta: 'No ON CONFLICT (isbn) DO UPDATE SET copies = copies + excluded.copies, o que é excluded.copies?',
        opcoes: [
          opc('a', 'O valor que se tentou inserir; copies à esquerda é o valor atual da linha existente', true, 'a soma é feita no banco, o que também evita o lost update do bloco 5.'),
          opc('b', 'O valor atual da linha existente', false, 'esse é copies sem prefixo.'),
          opc('c', 'O número de linhas excluídas', false, 'excluded é a linha proposta para inserção.')] },
      { id: 'f05b3-moldura', pergunta: 'Por que LAST_VALUE(id) OVER (ORDER BY loaned_on) devolve a própria linha?',
        opcoes: [
          opc('a', 'A moldura padrão com ORDER BY vai até a linha atual e seus pares; para o último da partição use ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING', true, 'medido no lab com o membro 1: [(1, 1), (2, 2), (7, 7), (9, 9)] contra [(1, 9), (2, 9), (7, 9), (9, 9)].'),
          opc('b', 'LAST_VALUE está quebrado no SQLite', false, 'o comportamento é do padrão SQL.'),
          opc('c', 'A janela ignora o ORDER BY', false, 'o ORDER BY define a moldura padrão.')] }
    ],
    abas: [
      { rotulo: 'CTE e recursão', blocos: [
        { tipo: 'texto', html:
          '<h3>Perguntas de negócio em uma instrução</h3>' +
          '<p>"O último empréstimo de cada membro", "o acumulado por mês", "a cadeia de indicações até a raiz", "grave ou atualize, e me devolva o id". Feita no aplicativo, cada uma vira laço com N consultas (bloco 4), estado compartilhado entre requisições (bloco 5) ou os dois. Feita no banco, é uma instrução, atômica e otimizável.</p>' +
          '<h3>CTE: nomear uma consulta</h3>' +
          '<p>Uma <em>Common Table Expression</em> (<code>WITH nome AS (...)</code>) dá nome a um resultado intermediário que a consulta principal usa como tabela. O ganho principal é legibilidade: a consulta lê de cima para baixo em passos nomeados, em vez de subqueries aninhadas de dentro para fora. O ganho técnico: uma CTE referenciada várias vezes é escrita uma vez.</p>' +
          '<p>Em desempenho, o que importa é a fronteira de otimização. Até o PostgreSQL 11, toda CTE era uma <em>barreira</em>: executada isoladamente, materializada, sem que filtros da consulta externa descessem para dentro. Desde o PostgreSQL 12, uma CTE não recursiva, sem efeitos colaterais e referenciada uma única vez é <em>inlined</em> como subquery; se referenciada mais de uma vez, é materializada. Você controla com <code>AS MATERIALIZED</code> / <code>AS NOT MATERIALIZED</code>. O SQLite também decide por inlining. "CTE é mais lenta" e "CTE é mais rápida" são afirmações sem versão: meça com o plano.</p>' },
        { tipo: 'texto', html:
          '<h3>CTE recursiva: hierarquias e grafos</h3>' +
          '<p>Uma CTE recursiva tem duas partes ligadas por <code>UNION ALL</code>: o <strong>membro âncora</strong> (a semente, executada uma vez) e o <strong>membro recursivo</strong>, que referencia a própria CTE e é reexecutado sobre as linhas novas da iteração anterior até não produzir nenhuma. O resultado é a união de todas as iterações. É o mecanismo para árvores de categorias, organogramas, cadeias de indicação, grafos de dependência e listas de materiais.</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto: ARVORE },
        { tipo: 'texto', html: '<p>A mesma ideia para cima (<code>q06</code>): a âncora é um membro específico e o passo segue <code>referred_by</code> até a raiz. Rode as duas e preveja a cadeia da Elisa (id 5).</p>' },
        { tipo: 'rode', id: 'f05b3-rode', titulo: 'Árvore para baixo, cadeia para cima', enunciado: 'Rode q05 e q06. A barra mostra a quantidade de linhas devolvidas.',
          prefixo: '$', entrada: 'uv run python -m sqllab.cli run q06_referral_chain --member-id 5', unidade: 'linhas', terminalTitulo: 'sqllab', etapas: etapasRecursao(),
          prever: { pergunta: 'A Elisa (id 5) foi indicada pelo Diego, que foi indicado pelo Bruno, que foi indicado pela Ana. Quantas linhas q06 devolve?', opcoes: [
            { id: 'a', texto: '3: só os indicadores.', correta: false, porque: 'a âncora (depth 0) é o próprio membro 5 e também aparece.' },
            { id: 'b', texto: '4: Elisa, Diego, Bruno e Ana.', correta: true, porque: 'a âncora mais três passos; a recursão para quando Ana, sem referred_by, não gera linha nova.' },
            { id: 'c', texto: 'Não termina: toda recursão entra em laço.', correta: false, porque: 'termina quando o passo não produz linhas; só dados com ciclo travariam.' }
          ] },
          tutorAntes: 'Aperte Enter. Clique em q05 para ver a árvore e em q06 para ver a cadeia.',
          tutorDepois: 'A mesma estrutura serve para os dois sentidos: muda só a âncora e a condição de ligação do passo.',
          callout: 'Você viu a recursão descer a árvore e subir a cadeia de indicações.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Riscos que você precisa conhecer', html:
          '<ul><li><strong>Ciclos:</strong> se os dados têm um ciclo (A indicou B, B indicou A), a recursão nunca termina. Defesas: acumular o caminho e rejeitar quem já visitou (<code>WHERE NOT instr(path, ...)</code>, ou array com <code>ANY</code> no PostgreSQL), limitar <code>depth &lt; 20</code>, usar <code>UNION</code> (sem <code>ALL</code>, que descarta linhas já vistas) ou a cláusula <code>CYCLE</code> do PostgreSQL 14.</li>' +
          '<li><strong>Custo:</strong> recursão em tabela grande sem índice na coluna de ligação (<code>parent_id</code>) faz uma varredura por iteração.</li>' +
          '<li><strong>Modelagem:</strong> se a hierarquia é lida muito mais do que escrita, considere caminho materializado, conjuntos aninhados ou tabela de fechamento transitivo, que trocam custo de escrita por leitura simples. No PostgreSQL existem ainda o tipo <code>ltree</code> e <code>WITH RECURSIVE ... SEARCH</code> para ordenar por profundidade ou largura.</li></ul>' },
        { tipo: 'takeaway', html: 'Âncora mais passo, ligados por <code>UNION ALL</code>: percorre árvores e grafos, mas exige <mark>proteção contra ciclos</mark> e <mark>índice</mark> na coluna de ligação.' }
      ] },

      { rotulo: 'Janelas', blocos: [
        { tipo: 'texto', html:
          '<h3>Agregar sem colapsar</h3>' +
          '<p><code>GROUP BY</code> colapsa N linhas em uma. Uma <strong>função de janela</strong> calcula sobre um conjunto de linhas relacionadas à linha atual <em>sem remover nenhuma</em>. A cláusula <code>OVER (...)</code> tem três partes:</p>' +
          '<ul><li><code>PARTITION BY</code>: divide em grupos independentes (um <code>GROUP BY</code> que não colapsa). Omitido, a tabela inteira é uma partição.</li>' +
          '<li><code>ORDER BY</code>: ordena dentro da partição; define "anterior", "próximo" e acumulados.</li>' +
          '<li><strong>Moldura</strong> (<code>ROWS|RANGE|GROUPS BETWEEN ...</code>): o subconjunto da partição que a função enxerga para a linha atual.</li></ul>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Família</th><th>Funções</th><th>Uso típico</th></tr></thead><tbody>' +
          '<tr><td>Ranking</td><td><code>ROW_NUMBER</code>, <code>RANK</code>, <code>DENSE_RANK</code>, <code>NTILE</code></td><td>"top N por grupo", deduplicação, quartis</td></tr>' +
          '<tr><td>Deslocamento</td><td><code>LAG</code>, <code>LEAD</code>, <code>FIRST_VALUE</code>, <code>LAST_VALUE</code></td><td>comparar com a linha anterior ou seguinte</td></tr>' +
          '<tr><td>Agregado como janela</td><td><code>SUM</code>, <code>AVG</code>, <code>COUNT</code>, <code>MAX</code> com <code>OVER</code></td><td>acumulados, médias móveis, % do total</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p>A consulta <code>q07</code> do lab calcula, por membro, quantos empréstimos até aquela data e quantos dias desde o anterior:</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto:
          'SELECT member_id, id AS loan_id, loaned_on,\n' +
          '       COUNT(*) OVER (PARTITION BY member_id ORDER BY loaned_on, id) AS loans_so_far,\n' +
          '       CAST(julianday(loaned_on) - julianday(\n' +
          '           LAG(loaned_on) OVER (PARTITION BY member_id ORDER BY loaned_on, id)) AS INTEGER) AS days_since_previous\n' +
          'FROM loan ORDER BY member_id, loaned_on, id;' },
        { tipo: 'codigo', linguagem: 'text', texto:
          'member_id  loan_id  loaned_on   loans_so_far  days_since_previous\n' +
          '---------  -------  ----------  ------------  -------------------\n' +
          '1          1        2026-05-01  1             None\n' +
          '1          2        2026-05-12  2             11\n' +
          '1          7        2026-06-15  3             34\n' +
          '1          9        2026-06-26  4             11\n' +
          '2          3        2026-05-20  1             None\n' +
          '3          4        2026-06-01  1             None\n' +
          '3          5        2026-06-10  2             9\n' +
          '...' },
        { tipo: 'texto', html: '<p>A primeira linha de cada partição não tem "anterior": <code>LAG</code> devolve <code>NULL</code> (aqui impresso como <code>None</code>), que se propaga para a subtração. <code>LAG(col, n, padrão)</code> aceita deslocamento e valor default.</p>' +
          '<h3>ROW_NUMBER, RANK e DENSE_RANK nos empates</h3>' },
        { tipo: 'codigo', linguagem: 'text', texto: RANKING },
        { tipo: 'texto', html:
          '<p>Três livros empatam com 2 empréstimos. <code>ROW_NUMBER</code> numera 1, 2, 3 e quebra o empate arbitrariamente (por isso a consulta inclui <code>title</code> como desempate: sem isso o resultado não é determinístico). <code>RANK</code> dá 1, 1, 1 e <strong>salta</strong> para 4. <code>DENSE_RANK</code> dá 1, 1, 1 e continua em 2, sem lacunas. Escolha pela pergunta: "exatamente um por grupo" é <code>ROW_NUMBER</code>; "todos os empatados no topo" é <code>RANK</code> = 1.</p>' +
          '<h3>Top-1 por grupo: a janela dentro de uma CTE</h3>' },
        { tipo: 'codigo', linguagem: 'sql', texto:
          '-- q08: o empréstimo mais recente de cada membro\n' +
          'WITH ranked AS (\n' +
          '    SELECT member_id, id AS loan_id, book_id, loaned_on,\n' +
          '           ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY loaned_on DESC, id DESC) AS rn\n' +
          '    FROM loan\n' +
          ')\n' +
          'SELECT member_id, loan_id, book_id, loaned_on FROM ranked WHERE rn = 1 ORDER BY member_id;' },
        { tipo: 'texto', html:
          '<p>O resultado da janela só existe depois da fase <code>SELECT</code>, por isso o filtro <code>rn = 1</code> fica fora, na consulta que lê a CTE (o PostgreSQL ainda oferece <code>DISTINCT ON</code> e <code>LATERAL</code>). O lab devolve 5 linhas: membros 1 a 5, empréstimos 9, 3, 5, 6 e 8. A alternativa ingênua, <code>WHERE loaned_on = (SELECT MAX(loaned_on) ...)</code> correlacionada, é mais lenta e devolve duas linhas se houver empate de data.</p>' +
          '<h3>A moldura padrão que engana</h3>' +
          '<p>Com <code>ORDER BY</code> e sem moldura explícita, o padrão é <code>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code>: da primeira linha da partição até a atual <em>e todos os seus pares</em> (mesmo valor de ordenação). Funciona para somas acumuladas e quebra em <code>LAST_VALUE</code>. Medido no lab com os empréstimos do membro 1:</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto:
          'LAST_VALUE(id) OVER (ORDER BY loaned_on)\n' +
          '  -> [(1, 1), (2, 2), (7, 7), (9, 9)]            -- "último" = a própria linha: inútil\n' +
          'LAST_VALUE(id) OVER (ORDER BY loaned_on ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)\n' +
          '  -> [(1, 9), (2, 9), (7, 9), (9, 9)]            -- agora sim: o último da partição' },
        { tipo: 'takeaway', html: 'Janelas calculam <mark>sem colapsar</mark> e só podem ser filtradas por quem as enxerga depois: <mark>CTE ou subquery</mark>. Desempate sempre.' }
      ] },

      { rotulo: 'UPSERT e RETURNING', blocos: [
        { tipo: 'texto', html:
          '<h3>Grava ou atualiza, atomicamente</h3>' +
          '<p>"Insira; se já existir, atualize" em duas instruções (<code>SELECT</code>, depois <code>INSERT</code> ou <code>UPDATE</code>) tem uma janela de corrida: duas requisições veem "não existe" e ambas inserem, e uma falha com violação de unicidade. O <strong>UPSERT</strong> resolve no banco, atomicamente, apoiado numa restrição única:</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto:
          'INSERT INTO book (isbn, title, author_id, copies) VALUES (?, ?, ?, ?)\n' +
          'ON CONFLICT (isbn) DO UPDATE SET copies = copies + excluded.copies\n' +
          'RETURNING id, copies;' },
        { tipo: 'texto', html:
          '<ul><li><code>ON CONFLICT (isbn)</code> declara <em>qual</em> restrição única é o alvo (exige índice ou constraint única nessa coluna).</li>' +
          '<li>No <code>DO UPDATE</code>, <code>copies</code> é o valor atual da linha existente e <code>excluded.copies</code> é o valor que se tentou inserir. A soma é feita no banco, sem ler o valor no aplicativo, o que também evita o <em>lost update</em> do bloco 5.</li>' +
          '<li><code>DO NOTHING</code> ignora o conflito (idempotência de importações).</li>' +
          '<li><code>RETURNING</code> devolve as colunas da linha afetada (inserida ou atualizada), evitando um segundo <code>SELECT</code> para descobrir o <code>id</code> gerado ou o valor final.</li></ul>' +
          '<p>No lab, o <code>upsert_book</code> do repositório faz assim: a primeira chamada insere e devolve o estoque inicial; a segunda, com o mesmo ISBN, soma as cópias, e o teste confirma o par <code>(id, copies)</code> devolvido. Em um ensaio manual sobre os dados pequenos, o ISBN do <em>Dom Casmurro</em> com 2 cópias + 2 resultou em <code>(1, 4)</code>.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Recurso</th><th>PostgreSQL</th><th>SQLite</th><th>Outros</th></tr></thead><tbody>' +
          '<tr><td>UPSERT</td><td><code>ON CONFLICT (...) DO UPDATE/NOTHING</code> (9.5+)</td><td>mesma sintaxe (3.24+)</td><td>MySQL: <code>ON DUPLICATE KEY UPDATE</code>; padrão SQL: <code>MERGE</code> (PostgreSQL 15+, SQL Server, Oracle)</td></tr>' +
          '<tr><td><code>RETURNING</code></td><td>desde sempre, em <code>INSERT/UPDATE/DELETE</code></td><td>3.35+</td><td>SQL Server usa <code>OUTPUT</code>; MySQL não tem (até MariaDB 10.5 em <code>INSERT/DELETE</code>)</td></tr>' +
          '<tr><td><code>FULL JOIN</code></td><td>sim</td><td>3.39+</td><td>MySQL não tem</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: UPSERT não é "grátis de corrida" para qualquer lógica', html:
          '<p>A atomicidade é da linha-alvo e da restrição única declarada. Se o <code>DO UPDATE</code> tem um <code>WHERE</code> que impede a atualização, a linha existente permanece e o <code>RETURNING</code> não devolve nada (zero linhas), o que quebra código que assume sempre uma linha.</p>' +
          '<p>No PostgreSQL, cada tentativa de inserção que conflita consome um valor da sequence (lacunas em <code>id</code> são normais e inofensivas, mas assustam quem as usa como contador). E <code>ON CONFLICT</code> trata um alvo só: conflito em <em>outra</em> restrição única continua sendo erro.</p>' },
        { tipo: 'takeaway', html: '<mark>UPSERT + RETURNING</mark> fazem o grava-ou-atualiza de forma atômica, em uma ida ao banco; confira se <mark>zero linhas</mark> pode voltar.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'f05b3-python', titulo: 'Calcule row_number, rank e dense_rank', obrigatorio: false,
          enunciado: 'Complete <code>classificar(contagens)</code>: recebe uma lista de <code>(titulo, emprestimos)</code>, ordena por empréstimos decrescente com <code>titulo</code> como desempate, e devolve uma lista de <code>(titulo, row_number, rank, dense_rank)</code>. <code>rank</code> salta nos empates; <code>dense_rank</code> não deixa lacunas.',
          codigo: 'def classificar(contagens):\n    ordenado = sorted(contagens, key=lambda t: (-t[1], t[0]))\n    resultado = []\n    rank = 0\n    dense = 0\n    anterior = None\n    for pos, (titulo, n) in enumerate(ordenado, start=1):\n        # quando n muda: rank salta para pos e dense avança 1\n        resultado.append((titulo, pos, pos, pos))\n    return resultado\n\n\nprint(classificar([("Dom Casmurro", 2), ("O Alienista", 0), ("Vidas Secas", 1)]))\n',
          testes: 'LIVROS = [\n    ("Dom Casmurro", 2), ("A Hora da Estrela", 2), ("Gabriela, Cravo e Canela", 2),\n    ("Vidas Secas", 1), ("Laços de Família", 1), ("Memórias Póstumas de Brás Cubas", 1),\n    ("O Alienista", 0), ("Capitães da Areia", 0),\n]\n\n\ndef test_lab_q09():\n    r = classificar(LIVROS)\n    assert [x[0] for x in r][:3] == ["A Hora da Estrela", "Dom Casmurro", "Gabriela, Cravo e Canela"]\n    assert [x[1] for x in r] == [1, 2, 3, 4, 5, 6, 7, 8]\n    assert [x[2] for x in r] == [1, 1, 1, 4, 4, 4, 7, 7]\n    assert [x[3] for x in r] == [1, 1, 1, 2, 2, 2, 3, 3]\n\n\ndef test_borda_vazia_e_um_item():\n    assert classificar([]) == []\n    assert classificar([("A", 5)]) == [("A", 1, 1, 1)]\n\n\ndef test_todos_empatados():\n    assert classificar([("B", 1), ("A", 1)]) == [("A", 1, 1, 1), ("B", 2, 1, 1)]\n\n\ndef test_controle_negativo_row_number_nunca_repete():\n    r = classificar(LIVROS)\n    assert len({x[1] for x in r}) == len(r)\n    assert len({x[2] for x in r}) < len(r)\n',
          dica: 'Se <code>n != anterior</code>: <code>rank = pos</code>, <code>dense += 1</code> e <code>anterior = n</code>. Depois acrescente <code>(titulo, pos, rank, dense)</code>.',
          solucao: 'def classificar(contagens):\n    ordenado = sorted(contagens, key=lambda t: (-t[1], t[0]))\n    resultado = []\n    rank = 0\n    dense = 0\n    anterior = None\n    for pos, (titulo, n) in enumerate(ordenado, start=1):\n        if n != anterior:\n            rank = pos\n            dense += 1\n            anterior = n\n        resultado.append((titulo, pos, rank, dense))\n    return resultado\n',
          tutorDepois: 'O título como desempate é o que torna o ROW_NUMBER determinístico. Troque a ordenação e o row_number muda; rank e dense_rank, não.',
          callout: 'Você reproduziu a tabela do q09 com as três funções de ranking.' },
        { tipo: 'complete', id: 'f05b3-complete', titulo: 'Complete o UPSERT', obrigatorio: false,
          enunciado: 'Importar livros repetidos deve somar as cópias e devolver o par final. Escolha as peças.',
          linguagem: 'sql',
          partes: [
            'INSERT INTO book (isbn, title, author_id, copies) VALUES (?, ?, ?, ?)\n',
            { lacuna: 'alvo', opcoes: ['ON CONFLICT (isbn)', 'ON CONFLICT (title)', 'WHEN MATCHED'], correta: 'ON CONFLICT (isbn)' },
            ' DO UPDATE SET copies = ',
            { lacuna: 'soma', opcoes: ['copies + excluded.copies', 'excluded.copies', 'copies'], correta: 'copies + excluded.copies' },
            '\n',
            { lacuna: 'ret', opcoes: ['RETURNING id, copies;', 'SELECT id, copies;', 'OUTPUT id, copies;'], correta: 'RETURNING id, copies;' }
          ],
          explicacao: 'O alvo precisa ser a restrição única (isbn). A soma usa o valor atual mais o proposto, sem ler no aplicativo. RETURNING devolve o par sem segundo SELECT (SQLite 3.35+, PostgreSQL desde sempre).' },
        { tipo: 'escolha', id: 'f05b3-escolha-janela', titulo: 'Confira: a janela no WHERE',
          pergunta: 'Você quer só a linha mais recente de cada cliente e escreve <code>WHERE ROW_NUMBER() OVER (PARTITION BY cliente_id ORDER BY criado_em DESC) = 1</code>. O que acontece e qual é a correção?',
          opcoes: [
            { id: 'a', texto: 'Erro: janelas são calculadas depois do <code>WHERE</code>; calcule numa subquery/CTE e filtre <code>rn = 1</code> por fora.', correta: true, porque: 'a ordem lógica é FROM, WHERE, GROUP BY, HAVING, janelas, SELECT. Se empates devem trazer todas as linhas, troque por RANK().' },
            { id: 'b', texto: 'Funciona, mas é lento; basta adicionar um índice em <code>criado_em</code>.', correta: false, porque: 'não funciona: a janela ainda não existe no WHERE.' },
            { id: 'c', texto: 'Funciona e devolve a linha mais antiga, porque o <code>DESC</code> é ignorado no <code>WHERE</code>.', correta: false, porque: 'a consulta nem executa.' },
            { id: 'd', texto: 'Funciona só se trocar <code>ROW_NUMBER</code> por <code>COUNT(*)</code>.', correta: false, porque: 'o problema é a fase, não a função.' }
          ], tutorDepois: 'CTE por dentro, filtro por fora.' },
        { tipo: 'escolha', id: 'f05b3-escolha-cte', titulo: 'Confira: CTE e desempenho',
          pergunta: 'Qual afirmação sobre CTEs é correta e depende de versão?',
          opcoes: [
            { id: 'a', texto: 'CTE é sempre mais lenta que subquery, porque é sempre materializada.', correta: false, porque: 'desde o PostgreSQL 12 uma CTE não recursiva referenciada uma vez é inlined.' },
            { id: 'b', texto: 'Desde o PostgreSQL 12, uma CTE não recursiva, sem efeitos colaterais e referenciada uma vez é inlined; referenciada mais de uma vez, é materializada. AS MATERIALIZED / NOT MATERIALIZED controlam.', correta: true, porque: 'por isso "CTE é mais rápida/lenta" não tem sentido sem versão: meça com o plano.' },
            { id: 'c', texto: 'CTE sempre é mais rápida, porque o resultado fica em cache.', correta: false, porque: 'não há garantia de cache; depende do inlining e do plano.' }
          ], tutorDepois: 'Meça com o plano.' },
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs e erros comuns', html:
          '<ul><li><strong>Encadear dez CTEs</strong> deixa a consulta legível e o plano ilegível; depure testando cada CTE isoladamente. Se uma CTE é reutilizada por várias consultas, é uma <code>VIEW</code> esperando para nascer.</li>' +
          '<li><strong>Janela sem determinismo:</strong> <code>ROW_NUMBER() OVER (ORDER BY created_at)</code> com timestamps iguais escolhe uma linha arbitrária. Acrescente o desempate (<code>, id</code>).</li>' +
          '<li><strong>Janela onde um <code>GROUP BY</code> bastava</strong> custa ordenação e memória; use janela quando precisar manter o detalhe ao lado do agregado.</li>' +
          '<li><strong>Recursão para profundidade fixa e pequena</strong> (dois níveis): um self join resolve, com plano mais simples.</li>' +
          '<li><strong>UPSERT em lote:</strong> uma instrução com muitas linhas pode conter duas vezes a mesma chave (PostgreSQL: "ON CONFLICT DO UPDATE command cannot affect row a second time"). Deduplique antes.</li></ul>' },
        { tipo: 'takeaway', html: 'CTE nomeia passos, a recursiva percorre hierarquias, janelas mantêm o detalhe e <mark>UPSERT</mark> grava <mark>atomicamente</mark>.' }
      ] }
    ]
  });
})();
