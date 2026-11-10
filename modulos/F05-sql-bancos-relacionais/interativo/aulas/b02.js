/* F05 · Bloco 2: SQL de consulta: JOINs, agregação, subqueries, NULL e ordem lógica de execução. Fonte: F05.html#b02. Saídas do lab: SQLite 3.53.1, Python 3.14.7 (11/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasNulos = function () {
    return [
      { id: 'on', nome: 'Filtro no ON', descricao: 'LEFT JOIN com b.copies > 1 no ON', tom: 'dns', ms: 5, linhas: [
        L('cmd', 'SELECT COUNT(*) FROM author a LEFT JOIN book b ON b.author_id = a.id AND b.copies > 1;'),
        L('out', '5'),
        L('hint', 'o filtro só decide quem casa; todos os autores continuam')] },
      { id: 'where', nome: 'Filtro no WHERE', descricao: 'O mesmo filtro depois do join', tom: 'tcp', ms: 2, linhas: [
        L('cmd', 'SELECT COUNT(*) FROM author a LEFT JOIN book b ON b.author_id = a.id WHERE b.copies > 1;'),
        L('out', '2'),
        L('hint', 'as linhas preservadas têm b.copies = NULL; NULL > 1 é UNKNOWN; o WHERE descarta. O LEFT JOIN virou INNER JOIN')] },
      { id: 'notin', nome: 'NOT IN', descricao: 'Categorias sem livro, com um NULL na subquery', tom: 'tls', ms: 0, linhas: [
        L('cmd', 'SELECT name FROM category WHERE id NOT IN (SELECT category_id FROM book);'),
        L('out', '(0 linhas)'),
        L('hint', 'id NOT IN (2, 3, 2, NULL, ...) vira id<>2 AND id<>3 AND ... AND id<>NULL; o último termo é UNKNOWN')] },
      { id: 'notexists', nome: 'NOT EXISTS', descricao: 'A mesma pergunta, imune a NULL', tom: 'request', ms: 5, linhas: [
        L('cmd', 'SELECT c.id FROM category c WHERE NOT EXISTS (SELECT 1 FROM book b WHERE b.category_id = c.id) ORDER BY c.id;'),
        L('out', '1, 4, 5, 6, 7'),
        L('hint', 'as cinco categorias que de fato não têm livro')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'f05-b2',
    titulo: 'SQL de consulta: JOINs, agregação, subqueries e NULL',
    minutos: 40,
    resumo: 'SQL é declarativo e tem ordem lógica própria. Filtros no lugar errado de um LEFT JOIN, contagens infladas e comparações com NULL produzem resultado plausível e errado.',
    objetivo: 'Prever o resultado de consultas com todos os tipos de JOIN, agregação, subqueries e NULL, seguindo a ordem lógica de execução.',
    revisao: [
      { id: 'f05b2-onwhere', pergunta: 'Num LEFT JOIN, qual a diferença entre colocar o filtro da tabela da direita no ON ou no WHERE?',
        opcoes: [
          opc('a', 'No ON só decide quem casa e a esquerda sobrevive com NULL; no WHERE descarta as linhas com NULL e o join vira INNER', true, 'no lab: 5 linhas contra 2.'),
          opc('b', 'Nenhuma: o otimizador reescreve para o mesmo plano', false, 'o resultado é diferente, e o otimizador tem de preservar o resultado.'),
          opc('c', 'O WHERE é mais rápido e por isso mais seguro', false, 'a diferença é semântica, não de velocidade.')] },
      { id: 'f05b2-notin', pergunta: 'WHERE x NOT IN (SELECT y FROM u) devolve zero linhas embora existam x ausentes em u.y. Por quê?',
        opcoes: [
          opc('a', 'Há um NULL em u.y: x <> NULL é UNKNOWN, a conjunção nunca chega a TRUE e o WHERE só deixa passar TRUE', true, 'NOT EXISTS não sofre disso.'),
          opc('b', 'NOT IN só funciona com literais', false, 'funciona com subquery, desde que ela nunca produza NULL.'),
          opc('c', 'Falta DISTINCT na subquery', false, 'DISTINCT mantém o NULL.')] },
      { id: 'f05b2-count', pergunta: 'Contar empréstimos por livro com LEFT JOIN e COUNT(*) dá 1 para o livro nunca emprestado. Qual o conserto?',
        opcoes: [
          opc('a', 'COUNT(l.id): conta só as linhas da direita não nulas', true, 'agregados ignoram NULL; COUNT(*) conta a linha preservada.'),
          opc('b', 'Trocar por HAVING COUNT(*) > 0', false, 'sobre um join externo, isso nunca filtra nada.'),
          opc('c', 'Trocar o LEFT JOIN por RIGHT JOIN', false, 'só espelha as tabelas; o problema do COUNT(*) continua.')] },
      { id: 'f05b2-ordem', pergunta: 'Em que ponto da ordem lógica nasce o alias do SELECT, e quem o enxerga?',
        opcoes: [
          opc('a', 'Na fase SELECT; só ORDER BY (e o próprio SELECT) o enxerga, não o WHERE', true, 'no PostgreSQL alias no WHERE é erro; o SQLite deixa passar.'),
          opc('b', 'Em FROM; o WHERE o enxerga', false, 'o WHERE roda antes do SELECT.'),
          opc('c', 'Em GROUP BY; o HAVING o enxerga', false, 'o HAVING também roda antes do SELECT.')] },
      { id: 'f05b2-multiplica', pergunta: 'Por que SUM(book.copies) sobre book JOIN loan infla o total?',
        opcoes: [
          opc('a', 'O join um-para-muitos repete a linha do livro por cada empréstimo, e o estoque é somado uma vez por empréstimo', true, 'cure agregando o lado "muitos" numa subquery/CTE antes do join.'),
          opc('b', 'SUM conta NULL como zero', false, 'SUM ignora NULL; o problema é a multiplicação de linhas.'),
          opc('c', 'O índice de book está desatualizado', false, 'o erro é lógico, não de índice.')] }
    ],
    abas: [
      { rotulo: 'Ordem lógica e JOINs', blocos: [
        { tipo: 'texto', html:
          '<h3>Resultado plausível e errado</h3>' +
          '<p>SQL é declarativo: você descreve <em>o que</em> quer e o otimizador escolhe <em>como</em>. Escrever uma consulta correta exige um modelo mental do significado lógico, diferente da ordem em que o texto aparece. Quem não o tem erra de três maneiras previsíveis: filtros no lugar errado de um <code>LEFT JOIN</code>, contagens infladas por joins que multiplicam linhas e comparações com <code>NULL</code> que descartam dados em silêncio. As três dão resultado plausível e errado, o pior tipo de bug.</p>' +
          '<h3>A ordem lógica de execução</h3>' +
          '<p>O texto começa por <code>SELECT</code>, mas a semântica começa por <code>FROM</code>. Cada fase recebe uma relação e devolve outra, e só enxerga o que as anteriores produziram:</p>' +
          '<p><code>FROM/JOIN → WHERE → GROUP BY → HAVING → janelas → SELECT → DISTINCT → ORDER BY → LIMIT</code></p>' +
          '<ul><li><code>WHERE</code> não enxerga aliases criados no <code>SELECT</code>. No PostgreSQL é erro; o SQLite deixa passar, e por isso o lab usa subquery nos testes.</li>' +
          '<li><code>WHERE</code> não filtra agregados; para isso existe <code>HAVING</code>.</li>' +
          '<li>Funções de janela não aparecem em <code>WHERE</code> (rodam depois).</li>' +
          '<li><code>ORDER BY</code> é a única cláusula, além do <code>SELECT</code>, que enxerga aliases.</li></ul>' +
          '<p>O otimizador pode reordenar tudo, desde que o resultado seja o mesmo que a ordem lógica daria.</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto: 'SELECT dept, COUNT(*) AS n FROM emp\nWHERE ativo GROUP BY dept\nHAVING COUNT(*) > 1 ORDER BY n DESC LIMIT 2' },
        { tipo: 'abas', rotulo: 'Passo a passo da consulta acima', itens: [
          { rotulo: '1 · FROM', blocos: [{ tipo: 'texto', html: '<p><strong>8 linhas.</strong> FROM monta a tabela de trabalho (os joins entram aqui). Tudo começa pelas linhas de <code>emp</code>.</p>' }] },
          { rotulo: '2 · WHERE', blocos: [{ tipo: 'texto', html: '<p><strong>8 → 6 linhas.</strong> <code>WHERE ativo</code> descarta duas linhas inativas antes de agrupar. O alias do SELECT ainda não existe.</p>' }] },
          { rotulo: '3 · GROUP BY', blocos: [{ tipo: 'texto', html: '<p><strong>6 linhas → 3 grupos.</strong> Agora o objeto é o grupo, não a linha.</p>' }] },
          { rotulo: '4 · HAVING', blocos: [{ tipo: 'texto', html: '<p><strong>3 → 2 grupos.</strong> <code>HAVING COUNT(*) &gt; 1</code> derruba o grupo com uma pessoa. O WHERE não pode filtrar por agregado.</p>' }] },
          { rotulo: '5 · SELECT', blocos: [{ tipo: 'texto', html: '<p><strong>2 linhas (dept, n).</strong> <code>COUNT(*) AS n</code> é calculado agora; por isso <code>WHERE n &gt; 1</code> falha.</p>' }] },
          { rotulo: '6 · ORDER BY e LIMIT', blocos: [{ tipo: 'texto', html: '<p><strong>2 linhas finais.</strong> <code>ORDER BY n DESC</code> já enxerga o alias criado no passo 5; <code>LIMIT</code> vem por último.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Todos os JOINs, por conjuntos</h3>' +
          '<p>Um join começa pelo produto cartesiano (<code>CROSS JOIN</code>: |A| × |B| linhas; no lab, 5 autores × 7 categorias = 35) e o predicado <code>ON</code> escolhe as combinações. O tipo de join define o que acontece com as linhas sem par.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Join</th><th>Resultado</th><th>No lab (dados pequenos)</th></tr></thead><tbody>' +
          '<tr><td><code>INNER JOIN</code></td><td>Só pares que satisfazem o <code>ON</code>.</td><td><code>author JOIN book</code> = 8 linhas</td></tr>' +
          '<tr><td><code>LEFT [OUTER] JOIN</code></td><td>Todas da esquerda; sem par na direita, colunas da direita viram <code>NULL</code>.</td><td><code>author LEFT JOIN book</code> = 9 (o autor 5 não tem livro)</td></tr>' +
          '<tr><td><code>RIGHT [OUTER] JOIN</code></td><td>Espelho do <code>LEFT</code>. Raro: reescreva trocando a ordem das tabelas.</td><td><code>category RIGHT JOIN book</code> = 8 (todo livro, com ou sem categoria)</td></tr>' +
          '<tr><td><code>FULL [OUTER] JOIN</code></td><td>Todas de ambos os lados, <code>NULL</code> onde não houver par.</td><td><code>category FULL JOIN book</code> = 13 (7 pares + 1 livro sem categoria + 5 categorias sem livro)</td></tr>' +
          '<tr><td><code>CROSS JOIN</code></td><td>Produto cartesiano, sem <code>ON</code>.</td><td>35</td></tr>' +
          '<tr><td>Self join</td><td>A tabela contra ela mesma, com dois aliases.</td><td><code>member m LEFT JOIN member r ON r.id = m.referred_by</code></td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p><code>RIGHT</code> e <code>FULL JOIN</code> só existem no SQLite desde a 3.39; o lab marca esses testes como ignorados em versões anteriores. O MySQL não tem <code>FULL JOIN</code> (emula-se com <code>UNION</code>). <code>NATURAL JOIN</code> junta por <em>todas</em> as colunas de mesmo nome e quebra em silêncio quando alguém adiciona uma coluna: evite. <code>USING</code> também existe.</p>' +
          '<h3>O join que multiplica</h3>' +
          '<p>Um join um-para-muitos repete a linha do lado "um" por cada filho. Somar uma coluna do lado "um" depois do join conta o valor várias vezes: <code>SUM(book.copies)</code> sobre <code>book JOIN loan</code> soma o estoque de um livro <em>uma vez por empréstimo</em>. Cure agregando em subquery/CTE antes do join, ou calculando cada agregado separadamente. Dois joins um-para-muitos independentes na mesma consulta (livro → empréstimos e livro → avaliações) produzem o produto das contagens: 3 empréstimos × 4 avaliações = 12 linhas por livro.</p>' },
        { tipo: 'takeaway', html: 'Cada fase só vê o que a anterior produziu; <mark>filtro da tabela opcional no WHERE</mark> mata o LEFT JOIN, e join um-para-muitos <mark>multiplica</mark> linhas.' }
      ] },

      { rotulo: 'Agregação e subqueries', blocos: [
        { tipo: 'texto', html:
          '<h3>GROUP BY e HAVING</h3>' +
          '<p><code>GROUP BY</code> particiona as linhas em grupos; cada coluna do <code>SELECT</code> precisa ser do grupo ou um agregado. O PostgreSQL impõe; o MySQL antigo e o SQLite aceitam colunas "soltas" e devolvem uma linha arbitrária do grupo: outro motivo para rodar a CI contra o mesmo banco da produção. <code>HAVING</code> filtra <em>grupos</em> pelo resultado de agregados; filtros que não dependem de agregado pertencem ao <code>WHERE</code>, que roda antes e reduz o trabalho. A consulta <code>q04</code> do lab usa os dois:</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto:
          'SELECT m.name AS member,\n' +
          '       COUNT(*) AS overdue_loans,\n' +
          '       CAST(MAX(julianday(:today) - julianday(l.due_on)) AS INTEGER) AS max_days_late\n' +
          'FROM loan AS l\n' +
          'JOIN member AS m ON m.id = l.member_id\n' +
          'WHERE l.returned_on IS NULL AND l.due_on < :today       -- filtra linhas\n' +
          'GROUP BY m.id, m.name\n' +
          'HAVING COUNT(*) >= 1                                    -- filtra grupos\n' +
          'ORDER BY max_days_late DESC, m.name;' },
        { tipo: 'codigo', linguagem: 'text', texto:
          '$ uv run python -m sqllab.cli run q04_overdue_by_member\n' +
          'member  overdue_loans  max_days_late\n' +
          '------  -------------  -------------\n' +
          'Bruno   1              27\n' +
          'Carla   1              15\n' +
          'Diego   1              4\n' +
          '(3 row(s))' },
        { tipo: 'texto', html:
          '<p>Agrupa-se por <code>m.id, m.name</code>: a chave (<code>id</code>) evita fundir dois membros homônimos, e <code>name</code> entra só para o <code>SELECT</code> ser legal em bancos estritos (o PostgreSQL aceita apenas <code>m.id</code> quando <code>id</code> é chave primária, por dependência funcional). A data fixa <code>:today</code> (parâmetro nomeado) torna o resultado reprodutível: consulta que lê o relógio não pode ser verificada em teste.</p>' +
          '<h3>Subqueries, EXISTS e IN</h3>' +
          '<p>Uma subquery pode ser <em>escalar</em> (uma linha, uma coluna, usada como valor), de <em>lista</em> (<code>IN</code>), de <em>existência</em> (<code>EXISTS</code>) ou <em>derivada</em> (no <code>FROM</code>). Pode ser <strong>correlacionada</strong> (referencia a consulta externa) ou não. Para "livros que nunca foram emprestados" há três formulações, com semânticas diferentes:</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto:
          '-- 1) anti-join com LEFT JOIN ... IS NULL\n' +
          'SELECT b.id FROM book b LEFT JOIN loan l ON l.book_id = b.id WHERE l.id IS NULL;\n' +
          '-- 2) NOT EXISTS (q03 do lab)\n' +
          'SELECT b.id, b.title FROM book b\n' +
          'WHERE NOT EXISTS (SELECT 1 FROM loan l WHERE l.book_id = b.id);\n' +
          '-- 3) NOT IN: correto SÓ se a subquery nunca produz NULL\n' +
          'SELECT b.id FROM book b WHERE b.id NOT IN (SELECT book_id FROM loan);' },
        { tipo: 'codigo', linguagem: 'text', texto:
          '$ uv run python -m sqllab.cli run q03_books_never_loaned\n' +
          'id  title\n' +
          '--  -----------------\n' +
          '7   Capitães da Areia\n' +
          '8   O Alienista\n' +
          '(2 row(s))' },
        { tipo: 'texto', html:
          '<p><strong>EXISTS vs IN.</strong> <code>EXISTS</code> testa se a subquery produz alguma linha, sem se importar com o conteúdo (por isso <code>SELECT 1</code>); para e devolve verdadeiro na primeira correspondência, e é imune a <code>NULL</code> na lista. <code>IN</code> compara um valor com um conjunto. Os otimizadores modernos transformam os dois em semi-join e, nas formas positivas, o plano costuma ser idêntico: escolha pela clareza e pela segurança com <code>NULL</code>. Na forma negativa, <strong>prefira <code>NOT EXISTS</code></strong> (ou o anti-join): <code>NOT IN</code> é o único dos três que muda de significado quando surge um <code>NULL</code>.</p>' },
        { tipo: 'takeaway', html: 'Na forma negativa, prefira <mark>NOT EXISTS</mark>; <code>NOT IN</code> é o único que muda de significado com <mark>NULL</mark>.' }
      ] },

      { rotulo: 'NULL e três valores', blocos: [
        { tipo: 'texto', html:
          '<h3>NULL não é um valor</h3>' +
          '<p>Em SQL, <code>NULL</code> é "valor ausente ou desconhecido". Toda comparação com ele é <code>UNKNOWN</code>, o terceiro valor lógico. As tabelas-verdade seguem a regra "se o desconhecido pudesse ser qualquer coisa, o resultado ainda seria o mesmo?".</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Expressão</th><th>Resultado</th><th>Raciocínio</th></tr></thead><tbody>' +
          '<tr><td><code>NULL = NULL</code></td><td>UNKNOWN (<code>NULL</code>)</td><td>dois desconhecidos podem ou não ser iguais</td></tr>' +
          '<tr><td><code>NULL IS NULL</code></td><td>TRUE</td><td>o predicado específico para testar ausência</td></tr>' +
          '<tr><td><code>TRUE OR UNKNOWN</code></td><td>TRUE</td><td>qualquer valor do desconhecido dá TRUE</td></tr>' +
          '<tr><td><code>FALSE AND UNKNOWN</code></td><td>FALSE</td><td>idem</td></tr>' +
          '<tr><td><code>TRUE AND UNKNOWN</code></td><td>UNKNOWN</td><td>depende do desconhecido</td></tr>' +
          '<tr><td><code>NOT UNKNOWN</code></td><td>UNKNOWN</td><td>negar a dúvida não a resolve</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O ponto que decide tudo: <code>WHERE</code>, <code>ON</code>, <code>HAVING</code> e a cláusula <code>WHEN</code> do <code>CASE</code> só deixam passar <code>TRUE</code>. <code>FALSE</code> e <code>UNKNOWN</code> são ambos descartados, mas <code>CHECK</code> aceita <code>UNKNOWN</code> (rejeita só <code>FALSE</code>). Medido no lab (SQLite 3.53.1): <code>SELECT NULL = NULL</code> devolve <code>NULL</code>; <code>NOT NULL</code> devolve <code>NULL</code>; <code>NULL AND 0</code> devolve <code>0</code>; <code>1 IN (1, NULL)</code> devolve <code>1</code>; <code>5 IN (1, NULL)</code> e <code>5 NOT IN (1, NULL)</code> devolvem ambos <code>NULL</code>.</p>' +
          '<h3>Consequências no dia a dia</h3>' +
          '<ul><li><code>WHERE category_id = NULL</code> nunca retorna linha (0 no lab); use <code>IS NULL</code>. <code>WHERE category_id &lt;&gt; 2</code> também <strong>perde</strong> a linha nula: 7 livros têm categoria, 1 não tem, e a consulta devolve 2, não 3. Para incluir os nulos, <code>IS DISTINCT FROM</code> (PostgreSQL; no SQLite, <code>IS NOT</code>) ou <code>OR category_id IS NULL</code>.</li>' +
          '<li><strong>Agregados ignoram <code>NULL</code></strong>: <code>COUNT(*)</code> conta linhas (8), <code>COUNT(category_id)</code> conta não-nulos (7), <code>COUNT(DISTINCT category_id)</code> conta valores distintos não-nulos (2). <code>AVG(1, NULL, 3)</code> é 2.0, não 1.33. <code>SUM</code> de conjunto vazio é <code>NULL</code>, não 0: use <code>COALESCE(SUM(x), 0)</code>.</li>' +
          '<li><code>GROUP BY</code> e <code>DISTINCT</code> tratam todos os <code>NULL</code> como iguais entre si (exceção à regra do <code>=</code>); <code>UNIQUE</code> os trata como distintos (exceto <code>NULLS NOT DISTINCT</code>). Três regras para a mesma coisa, todas padronizadas.</li>' +
          '<li><code>ORDER BY</code> coloca <code>NULL</code> no começo ou no fim conforme o banco: o PostgreSQL o ordena como o maior valor (fim em <code>ASC</code>), o SQLite como o menor. Use <code>NULLS FIRST/LAST</code> quando importar.</li></ul>' },
        { tipo: 'texto', html:
          '<h3>Rode e observe</h3>' +
          '<p>Quatro consultas do lab, na ordem. Preveja primeiro: o filtro <code>b.copies &gt; 1</code> movido do <code>ON</code> para o <code>WHERE</code> muda a contagem?</p>' },
        { tipo: 'rode', id: 'f05b2-rode', titulo: 'ON, WHERE e NOT IN com NULL', enunciado: 'Rode as quatro consultas (resumo dos testes do lab sobre os dados pequenos). A barra mostra o número de linhas devolvidas.',
          prefixo: '$', entrada: 'sqlite3 biblioteca.db', unidade: 'linhas', terminalTitulo: 'sqlite', etapas: etapasNulos(),
          prever: { pergunta: 'A versão com o filtro no WHERE (b.copies > 1) devolve quantas linhas, contra 5 do filtro no ON?', opcoes: [
            { id: 'a', texto: '5: o LEFT JOIN garante todos os autores.', correta: false, porque: 'o WHERE roda depois do join e descarta as linhas preservadas, que têm NULL.' },
            { id: 'b', texto: '2: só sobram os autores com livro de mais de uma cópia.', correta: true, porque: 'o LEFT JOIN virou INNER JOIN sem aviso.' },
            { id: 'c', texto: '9: o join multiplica as linhas.', correta: false, porque: '9 é o COUNT do LEFT JOIN sem filtro; o WHERE ainda filtra.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em cada consulta para ler só as linhas dela.',
          tutorDepois: 'Duas armadilhas de uma vez: o filtro da tabela opcional no WHERE converte o join externo em interno, e um único NULL na subquery faz o NOT IN devolver nada. O bug do NOT IN é traiçoeiro porque a consulta funciona até alguém inserir o primeiro livro sem categoria; a partir daí o relatório mostra zero, sem erro nenhum.',
          callout: 'Você viu 5 contra 2 e 0 linhas contra cinco categorias.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: COUNT(*) depois de um LEFT JOIN', html:
          '<p>Para contar empréstimos por livro, <code>LEFT JOIN</code> + <code>COUNT(*)</code> dá 1 para o livro que nunca foi emprestado: a linha com <code>NULL</code> existe e é contada. O correto é <code>COUNT(l.id)</code>, que ignora o <code>NULL</code>. A consulta <code>q09</code> do lab faz isso, e "O Alienista" aparece com 0, não 1. Variante: <code>HAVING COUNT(*) &gt; 0</code> sobre um join externo nunca filtra nada.</p>' },
        { tipo: 'takeaway', html: '<mark>NULL</mark> é desconhecido e só <mark>TRUE</mark> passa; agregados ignoram NULL, <code>COUNT(*)</code> não.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'ordene', id: 'f05b2-ordene', titulo: 'Ordene as fases da consulta', obrigatorio: false,
          enunciado: 'Coloque as fases na ordem lógica de execução, da primeira à última.',
          itens: [
            { id: 'order', texto: 'ORDER BY' }, { id: 'where', texto: 'WHERE' }, { id: 'select', texto: 'SELECT' },
            { id: 'from', texto: 'FROM / JOIN' }, { id: 'having', texto: 'HAVING' }, { id: 'limit', texto: 'LIMIT' },
            { id: 'group', texto: 'GROUP BY' }, { id: 'janelas', texto: 'Funções de janela' }, { id: 'distinct', texto: 'DISTINCT' }
          ],
          solucao: ['from', 'where', 'group', 'having', 'janelas', 'select', 'distinct', 'order', 'limit'],
          dica: 'O texto começa por SELECT, mas a semântica começa por FROM. Janelas rodam depois do HAVING e antes do SELECT.',
          tutorDepois: 'Cada fase só vê o que a anterior produziu: é por isso que WHERE não enxerga alias nem janela.' },
        { tipo: 'python', id: 'f05b2-python', titulo: 'Implemente o NOT IN com NULL', obrigatorio: false,
          enunciado: 'Em Python, <code>None</code> faz o papel do <code>NULL</code>. Complete <code>nao_esta_em(x, lista)</code> com a lógica de três valores do SQL: devolva <code>False</code> se <code>x</code> aparece na lista; <code>True</code> se <code>x</code> difere de todos e não há <code>None</code> na lista (nem em <code>x</code>); e <code>None</code> (UNKNOWN) nos demais casos. Lista vazia dá <code>True</code>. Depois <code>filtrar</code> mantém só o que dá <code>True</code>, como o <code>WHERE</code>.',
          codigo: 'def nao_esta_em(x, lista):\n    resultado = True\n    for y in lista:\n        # 1. se x ou y for None, a comparação é UNKNOWN: o resultado vira None\n        # 2. se x == y, o NOT IN é False de vez\n        pass\n    return resultado\n\n\ndef filtrar(valores, lista):\n    return [v for v in valores if nao_esta_em(v, lista) is True]\n\n\nprint(nao_esta_em(5, [1, None]))\n',
          testes: 'def test_ausente_sem_null():\n    assert nao_esta_em(5, [1, 2]) is True\n\n\ndef test_presente_na_lista():\n    assert nao_esta_em(1, [1, 2]) is False\n    assert nao_esta_em(1, [1, None]) is False\n\n\ndef test_null_na_lista_deixa_unknown():\n    assert nao_esta_em(5, [1, None]) is None\n\n\ndef test_bordas():\n    assert nao_esta_em(5, []) is True\n    assert nao_esta_em(None, [1]) is None\n    assert nao_esta_em(None, []) is True\n\n\ndef test_where_so_deixa_passar_true():\n    assert filtrar([1, 2, 3], [2]) == [1, 3]\n    assert filtrar([1, 2, 3], [2, None]) == []\n\n\ndef test_controle_negativo_not_in_do_python_nao_e_sql():\n    assert (5 not in [1, None]) is True\n    assert nao_esta_em(5, [1, None]) is not True\n',
          dica: 'Dentro do laço: se <code>x is None or y is None</code>, faça <code>resultado = None</code>; senão, se <code>x == y</code>, <code>return False</code>. O <code>return False</code> vence o UNKNOWN (FALSE AND UNKNOWN = FALSE).',
          solucao: 'def nao_esta_em(x, lista):\n    resultado = True\n    for y in lista:\n        if x is None or y is None:\n            resultado = None\n        elif x == y:\n            return False\n    return resultado\n\n\ndef filtrar(valores, lista):\n    return [v for v in valores if nao_esta_em(v, lista) is True]\n',
          tutorDepois: 'O operador not in do Python diz True para 5 not in [1, None]; o SQL diz UNKNOWN, e o WHERE descarta. O controle negativo existe para você lembrar que a semântica é outra.',
          callout: 'A lógica de três valores agora é código que você testou.' },
        { tipo: 'transcript', id: 'f05b2-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'sessão relatório-categorias',
          enunciado: 'O relatório de categorias sem livros mostra zero desde ontem. Uma das afirmações do agente não se sustenta. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'O relatório de categorias sem livros mostra zero desde ontem. Ninguém mexeu na consulta.' },
            { quem: 'agente', texto: 'A consulta usa WHERE id NOT IN (SELECT category_id FROM book).' },
            { quem: 'ferramenta', texto: '$ SELECT COUNT(*) FROM book WHERE category_id IS NULL;\n1' },
            { quem: 'agente', texto: 'Ontem entrou o primeiro livro sem categoria: a subquery passou a produzir NULL e o NOT IN nunca chega a TRUE.' },
            { quem: 'agente', texto: 'Para resolver, coloque DISTINCT na subquery: o NULL deixa de contar e o relatório volta.' }
          ],
          erradas: [4],
          explicacao: { 4: 'DISTINCT mantém o NULL (ele só elimina repetições). O conserto é <code>NOT EXISTS</code>, ou filtrar <code>WHERE category_id IS NOT NULL</code> dentro da subquery.' },
          tutorDepois: 'O diagnóstico estava certo; o remédio, não. Teste a correção antes de aceitá-la.' },
        { tipo: 'escolha', id: 'f05b2-escolha-left', titulo: 'Confira: LEFT JOIN com WHERE',
          pergunta: '<code>FROM cliente c LEFT JOIN pedido p ON p.cliente_id = c.id WHERE p.status = \'PAGO\'</code> devolve clientes sem nenhum pedido?',
          opcoes: [
            { id: 'a', texto: 'Sim: o LEFT JOIN garante que todo cliente apareça, não importa o que vem depois.', correta: false, porque: 'o WHERE roda depois do join.' },
            { id: 'b', texto: 'Não: para o cliente sem pedido, <code>p.status</code> é NULL, o WHERE rejeita a linha e o LEFT JOIN vira, na prática, um INNER JOIN.', correta: true, porque: 'para manter os clientes sem pedido pago, mova a condição para o ON (<code>... AND p.status = \'PAGO\'</code>).' },
            { id: 'c', texto: 'Sim, mas só se houver um índice em <code>pedido.cliente_id</code>.', correta: false, porque: 'índice não muda o significado lógico.' },
            { id: 'd', texto: 'Depende do SGBD: o PostgreSQL devolve e o SQLite não.', correta: false, porque: 'a semântica é padrão e igual nos dois.' }
          ], tutorDepois: 'Predicado da tabela opcional vai no ON.' },
        { tipo: 'escolha', id: 'f05b2-escolha-notin', titulo: 'Confira: zero linhas',
          pergunta: '<code>SELECT * FROM livro WHERE id NOT IN (SELECT livro_id FROM emprestimo)</code> devolve zero linhas, embora existam livros nunca emprestados. Qual é a causa mais provável?',
          opcoes: [
            { id: 'a', texto: 'O otimizador descartou o índice e a consulta estourou o tempo limite silenciosamente.', correta: false, porque: 'estouro de tempo daria erro, não resultado vazio.' },
            { id: 'b', texto: '<code>NOT IN</code> só funciona com valores literais, nunca com subquery.', correta: false, porque: 'funciona, se a subquery nunca produz NULL.' },
            { id: 'c', texto: 'Há pelo menos um <code>livro_id</code> NULL na subquery: <code>x NOT IN (..., NULL)</code> nunca é TRUE.', correta: true, porque: 'em IN o NULL é inofensivo; em NOT IN ele contamina tudo. Use NOT EXISTS ou filtre IS NOT NULL na subquery.' },
            { id: 'd', texto: 'Falta um <code>DISTINCT</code> dentro da subquery.', correta: false, porque: 'DISTINCT não remove NULL.' }
          ], tutorDepois: 'Um NULL na lista basta.' },
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs e erros comuns', html:
          '<ul><li><strong><code>SELECT *</code> em código de aplicação</strong> acopla o código à ordem e ao conjunto de colunas, impede índices de cobertura (bloco 4) e transfere colunas grandes à toa. Em exploração, ok.</li>' +
          '<li><strong><code>DISTINCT</code> para "consertar" duplicatas</strong> quase sempre mascara um join que multiplica. Descubra por que há duplicata.</li>' +
          '<li><strong><code>LIMIT</code> sem <code>ORDER BY</code></strong> devolve linhas arbitrárias, e o conjunto muda entre execuções e versões. Paginação por <code>OFFSET</code> degrada linearmente (o banco gera e descarta as N primeiras); para páginas profundas use paginação por chave (<code>WHERE id &gt; :ultimo ORDER BY id LIMIT 50</code>).</li>' +
          '<li><strong>Funções sobre a coluna filtrada</strong> (<code>WHERE lower(email) = ?</code>, <code>WHERE strftime(\'%Y\', loaned_on) = \'2025\'</code>) impedem o uso do índice (bloco 4).</li>' +
          '<li><strong>Datas como texto em formatos mistos:</strong> <code>\'10/06/2026\'</code> ordena antes de <code>\'2/06/2026\'</code>. Padronize em ISO-8601 ou use tipos temporais.</li></ul>' },
        { tipo: 'takeaway', html: 'Ordem lógica, <mark>ON vs WHERE</mark>, <mark>NOT EXISTS</mark> e <code>COUNT(coluna_da_direita)</code>: jamais use DISTINCT para esconder multiplicação de linhas.' }
      ] }
    ]
  });
})();
