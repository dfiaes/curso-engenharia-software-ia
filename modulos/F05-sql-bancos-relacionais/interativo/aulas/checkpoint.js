/* F05 · Checkpoint: nove cenários, avaliação sem consulta. Fonte: F05.html#checkpoint. Rubrica = "Basta"; modelo = resposta esperada. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'f05-checkpoint',
    titulo: 'Checkpoint F05',
    minutos: 60,
    resumo: 'Nove cenários sobre modelagem, SQL, índices, concorrência, injection e escolha do armazenamento, sem consulta. Responda com as suas palavras e confira com a rubrica.',
    objetivo: 'Verificar, sem consulta, se você modela e justifica, prevê o resultado de consultas, lê planos, escolhe a defesa contra anomalias de concorrência, revisa código contra injection e escolhe o armazenamento pelo padrão de acesso.',
    revisao: [
      { id: 'f05cp-lost', pergunta: 'Um endpoint faz SELECT saldo, valida no Python e faz UPDATE saldo = :novo. Qual a correção mais simples sob duas requisições simultâneas?',
        opcoes: [
          opc('a', 'UPDATE saldo = saldo - :v WHERE saldo >= :v, conferindo o rowcount', true, 'expressão atômica no banco; as alternativas mais pesadas são FOR UPDATE, versão otimista e SERIALIZABLE com retry.'),
          opc('b', 'Apenas envolver SELECT e UPDATE numa transação', false, 'em READ COMMITTED a transação não impede o lost update.'),
          opc('c', 'Trocar o saldo por FLOAT', false, 'o tipo não tem relação com a concorrência.')] },
      { id: 'f05cp-notin', pergunta: 'livro.categoria_id contém 1, 2 e NULL. O que devolve WHERE id NOT IN (SELECT categoria_id FROM livro) e o que devolve NOT EXISTS?',
        opcoes: [
          opc('a', 'NOT IN: zero linhas (lógica de três valores); NOT EXISTS: as categorias que de fato não têm livro', true, 'x NOT IN (..., NULL) nunca é TRUE.'),
          opc('b', 'As duas devolvem as mesmas categorias', false, 'NOT IN é o único dos três que muda de significado com NULL.'),
          opc('c', 'NOT IN devolve erro', false, 'executa e devolve vazio, sem erro.')] },
      { id: 'f05cp-indice', pergunta: 'WHERE status = \'pendente\' ORDER BY criado_em LIMIT 50, 98% das linhas são \'concluido\'. Qual índice e qual risco ao criá-lo em produção?',
        opcoes: [
          opc('a', 'Índice parcial (criado_em) WHERE status = \'pendente\' ou composto (status, criado_em); CREATE INDEX CONCURRENTLY para não bloquear escritas', true, 'o plano passa a ser Index Scan sem Sort.'),
          opc('b', 'Um índice em cada coluna da tabela', false, 'cada índice taxa as escritas; indexe a partir da consulta medida.'),
          opc('c', 'Um índice só em criado_em, com CREATE INDEX comum', false, 'o CREATE INDEX comum bloqueia escritas na tabela durante a construção.')] },
      { id: 'f05cp-ident', pergunta: 'Em cursor.execute(f"SELECT * FROM {tabela} WHERE nome = \'{nome}\' ORDER BY {coluna}"), como corrigir cada injeção?',
        opcoes: [
          opc('a', 'nome por parâmetro; tabela e coluna por lista de permissão; menor privilégio como camada extra', true, 'parâmetros valem para valores, não para identificadores.'),
          opc('b', 'Trocar aspas simples por duplas em tudo', false, 'higienizar à mão não é defesa.'),
          opc('c', 'Parametrizar os três com ?', false, 'identificadores não são parametrizáveis.')] },
      { id: 'f05cp-armazenamento', pergunta: 'Uma equipe quer adicionar um banco vetorial e um de documentos para "guardar tudo do RAG". Qual o padrão defensável?',
        opcoes: [
          opc('a', 'Perguntar padrão de acesso, volume, consistência e fonte da verdade; começar no PostgreSQL (JSONB, pgvector) e adicionar sistema só com necessidade medida', true, 'os demais armazenamentos são derivados recriáveis.'),
          opc('b', 'NoSQL escala melhor, então os dois', false, 'abre mão de garantias e multiplica fontes de inconsistência.'),
          opc('c', 'Guardar tudo em JSON em uma única coluna TEXT', false, 'flexibilidade paga com validação espalhada e relatórios impossíveis.')] }
    ],
    abas: [
      { rotulo: 'Modelo e consulta', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que basta. Reprovar é permitido: volte ao bloco indicado e tente de novo. Você pode dizer "Checkpoint F05" no chat do tutor para ser avaliado pergunta a pergunta.</p>' },

        { tipo: 'escreva', id: 'f05cp-p1', titulo: 'P1 · Modelar e justificar', obrigatorio: false,
          enunciado: 'Um sistema de agentes de IA guarda conversas, mensagens, chamadas de ferramenta e custo por chamada de modelo. Esboce as tabelas, chaves, cardinalidades e três restrições declarativas; diga o que você copiaria (snapshot) e o que referenciaria. <em>Bloco 1.</em>',
          placeholder: 'Tabelas… Chaves… Cardinalidades… Restrições… Copiaria… Referenciaria…',
          rubrica: [
            'Cardinalidades: <strong>conversa 1—N mensagem</strong> (e as chamadas de ferramenta e de modelo ligadas à mensagem).',
            '<strong>Chave substituta</strong> como primária e <strong>única natural</strong> onde houver.',
            'Restrições: <code>NOT NULL</code>, <code>CHECK</code> (custo &gt;= 0) e chave estrangeira.',
            '<strong>Congela o preço por token usado na chamada</strong> (snapshot histórico) em vez de referenciar o preço atual.'
          ],
          modelo: '<p>Conversa 1—N mensagem; mensagem 1—N chamada de ferramenta; cada chamada de modelo guarda tokens e custo. Cada tabela tem <code>id</code> substituto como primária, e o que tiver identificador natural estável (por exemplo, um id externo de execução) vira <code>UNIQUE</code>. Restrições: <code>NOT NULL</code> nas chaves estrangeiras, <code>CHECK (custo &gt;= 0)</code> e chaves estrangeiras com índice. Referencio o modelo, mas congelo na chamada o preço por token vigente: o fato é "quanto custou naquele dia", e juntar com o preço atual falsificaria o histórico.</p>' + reprova('uma tabela única com JSON de tudo, sem chaves.') },

        { tipo: 'escolha', id: 'f05cp-esc-p2', titulo: 'P2 · Aquecimento: prever o NOT IN',
          pergunta: '<code>categoria</code> tem 5 linhas; <code>livro.categoria_id</code> contém os valores 1, 2 e <code>NULL</code>. O que devolve <code>WHERE id NOT IN (SELECT categoria_id FROM livro)</code>?',
          opcoes: [
            { id: 'a', texto: 'As categorias 3, 4 e 5.', correta: false, porque: 'é o que devolveria o NOT EXISTS; o NOT IN tropeça no NULL.' },
            { id: 'b', texto: 'Zero linhas.', correta: true, porque: 'id <> 1 AND id <> 2 AND id <> NULL: o último termo é UNKNOWN e a conjunção nunca é TRUE.' },
            { id: 'c', texto: 'Um erro, porque a subquery tem NULL.', correta: false, porque: 'a consulta executa e devolve vazio, sem erro.' }
          ] },
        { tipo: 'escreva', id: 'f05cp-p2', titulo: 'P2 · Prever o resultado', obrigatorio: false,
          enunciado: 'Prediga o resultado de <code>WHERE id NOT IN (SELECT categoria_id FROM livro)</code> e da versão com <code>NOT EXISTS</code>, e o de <code>COUNT(*)</code> vs <code>COUNT(categoria_id)</code>. <em>Bloco 2.</em>',
          placeholder: 'NOT IN devolve… NOT EXISTS devolve… COUNT(*)… COUNT(categoria_id)…',
          rubrica: [
            '<strong>Zero linhas</strong> no <code>NOT IN</code>, explicado pela lógica de três valores.',
            'As categorias <strong>3, 4 e 5</strong> no <code>NOT EXISTS</code>.',
            '<code>COUNT(*)</code> conta linhas; <code>COUNT(col)</code> <strong>ignora <code>NULL</code></strong>.'
          ],
          modelo: '<p>O <code>NOT IN</code> devolve zero linhas: <code>id NOT IN (1, 2, NULL)</code> vira <code>id &lt;&gt; 1 AND id &lt;&gt; 2 AND id &lt;&gt; NULL</code>, o último termo é <code>UNKNOWN</code> e o <code>WHERE</code> só deixa passar <code>TRUE</code>. O <code>NOT EXISTS</code> devolve as categorias 3, 4 e 5. <code>COUNT(*)</code> conta todas as linhas de livro, inclusive a de <code>NULL</code>; <code>COUNT(categoria_id)</code> conta só as não nulas.</p>' + reprova('"as duas devolvem 3, 4, 5".') },

        { tipo: 'escreva', id: 'f05cp-p3', titulo: 'P3 · Reescrever', obrigatorio: false,
          enunciado: 'Dado um <code>LEFT JOIN</code> com <code>WHERE b.status = \'ativo\'</code> que "perde" autores sem livros, explique a causa e dê duas correções com a diferença semântica de cada. <em>Bloco 2.</em>',
          placeholder: 'A causa é… Correção 1… Correção 2…',
          rubrica: [
            'Causa: o filtro no <code>WHERE</code> roda depois do join; o <code>NULL</code> é rejeitado e o <strong>join externo vira interno</strong>.',
            'Correção 1: mover a condição para o <strong><code>ON</code></strong> (preserva os autores sem livros).',
            'Correção 2: assumir <strong><code>INNER JOIN</code></strong> de propósito (intenção explícita; autores sem livros saem).'
          ],
          modelo: '<p>Para o autor sem livro, <code>b.status</code> é <code>NULL</code>; <code>NULL = \'ativo\'</code> é <code>UNKNOWN</code> e o <code>WHERE</code> descarta a linha: o <code>LEFT JOIN</code> virou <code>INNER JOIN</code> sem aviso. Se quero manter todos os autores, movo <code>b.status = \'ativo\'</code> para o <code>ON</code>: o filtro só decide quem casa e os autores sem par aparecem com <code>NULL</code>. Se quero só autores com livro ativo, escrevo <code>INNER JOIN</code> e deixo a intenção explícita.</p>' + reprova('trocar por <code>FULL JOIN</code> "para garantir".') },

        { tipo: 'escolha', id: 'f05cp-esc-p4', titulo: 'P4 · Aquecimento: a janela no WHERE',
          pergunta: 'Para os 3 empréstimos mais recentes de cada membro, qual estrutura está certa?',
          opcoes: [
            { id: 'a', texto: '<code>WHERE ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY loaned_on DESC) &lt;= 3</code> na mesma consulta.', correta: false, porque: 'janelas rodam depois do WHERE.' },
            { id: 'b', texto: 'CTE com <code>ROW_NUMBER() ... AS rn</code> e, fora dela, <code>WHERE rn &lt;= 3</code>.', correta: true, porque: 'o resultado da janela só existe depois da fase SELECT; o filtro vai na consulta que lê a CTE.' },
            { id: 'c', texto: '<code>GROUP BY member_id LIMIT 3</code>.', correta: false, porque: 'LIMIT corta o resultado inteiro, não cada grupo.' }
          ] },
        { tipo: 'escreva', id: 'f05cp-p4', titulo: 'P4 · Top-N por grupo', obrigatorio: false,
          enunciado: 'Escreva (em SQL ou pseudo-SQL fiel) "os 3 empréstimos mais recentes de cada membro" e diga o que acontece com empates na data. <em>Bloco 3.</em>',
          placeholder: 'WITH ranked AS (...) SELECT ... WHERE rn <= 3. Empates: …',
          rubrica: [
            '<code>ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ... DESC, id)</code> numa <strong>CTE</strong>, com o filtro <code>rn &lt;= 3</code> <strong>fora</strong>.',
            'Menciona o <strong>desempate determinístico</strong> (<code>, id</code>).',
            'Diz que <code>RANK</code> mudaria o número de linhas (empatados no limite entram todos).'
          ],
          modelo: '<pre><code>WITH ranked AS (\n    SELECT member_id, id, loaned_on,\n           ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY loaned_on DESC, id DESC) AS rn\n    FROM loan\n)\nSELECT member_id, id, loaned_on FROM ranked WHERE rn &lt;= 3;</code></pre><p>O <code>id</code> como desempate torna o resultado determinístico; sem ele, empates na data escolhem linhas arbitrárias entre execuções. Com <code>RANK</code>, empatados na terceira posição entrariam todos e o número de linhas por membro passaria de 3.</p>' + reprova('filtrar a janela no <code>WHERE</code> da mesma consulta.') },
        { tipo: 'takeaway', html: 'Modele com <mark>chaves e restrições</mark>, preveja com <mark>três valores</mark> e filtre janelas <mark>por fora</mark>.' }
      ] },

      { rotulo: 'Índice e concorrência', blocos: [
        { tipo: 'escreva', id: 'f05cp-p5', titulo: 'P5 · Plano e índice', obrigatorio: false,
          enunciado: 'A consulta <code>WHERE status = \'pendente\' ORDER BY criado_em LIMIT 50</code> está lenta numa tabela de 40 milhões de linhas em que 98% são <code>\'concluido\'</code>. Proponha o índice, justifique a ordem das colunas, nomeie o nó do plano que prova a melhora e o risco de criar o índice em produção. <em>Bloco 4.</em>',
          placeholder: 'O índice é… A ordem das colunas… O plano mostrará… O risco é…',
          rubrica: [
            'Índice <strong>parcial</strong> <code>(criado_em) WHERE status = \'pendente\'</code> ou composto <code>(status, criado_em)</code>.',
            'Igualdade primeiro, ordenação depois: <strong>elimina o sort</strong>.',
            'Nó do plano: <strong><code>Index Scan</code> sem <code>Sort</code></strong>.',
            'Risco: <strong><code>CREATE INDEX CONCURRENTLY</code></strong> (o comum bloqueia escritas).'
          ],
          modelo: '<p>Índice parcial em <code>criado_em</code> com <code>WHERE status = \'pendente\'</code>, pequeno porque guarda só 2% das linhas, ou composto <code>(status, criado_em)</code>: a igualdade em <code>status</code> vem primeiro e a ordenação por <code>criado_em</code> depois, então as linhas já saem na ordem e o <code>Sort</code> some. O plano deve mostrar <code>Index Scan</code> sem nó <code>Sort</code>, confirmado com <code>EXPLAIN</code> em volume realista. Em produção, <code>CREATE INDEX CONCURRENTLY</code>: o comum bloqueia escritas durante a construção; o concorrente é mais lento, não roda em transação e, se falhar, deixa um índice <code>INVALID</code> para remover.</p>' + reprova('"indexar todas as colunas".') },

        { tipo: 'escolha', id: 'f05cp-esc-p6', titulo: 'P6 · Aquecimento: a transação não basta',
          pergunta: 'O endpoint faz <code>SELECT saldo</code>, valida no Python e faz <code>UPDATE saldo = :novo</code>, tudo dentro de uma transação em <code>READ COMMITTED</code>. Sob duas requisições simultâneas, o que acontece?',
          opcoes: [
            { id: 'a', texto: 'Nada: a transação isola as duas.', correta: false, porque: 'a transação dá atomicidade; o que foi lido pode mudar antes da escrita.' },
            { id: 'b', texto: 'Lost update: as duas leem o mesmo saldo e a segunda grava por cima da primeira.', correta: true, porque: 'a defesa mais simples é uma expressão atômica no UPDATE.' },
            { id: 'c', texto: 'Deadlock garantido.', correta: false, porque: 'não há espera em ciclo.' }
          ] },
        { tipo: 'escreva', id: 'f05cp-p6', titulo: 'P6 · Concorrência', obrigatorio: false,
          enunciado: 'Um endpoint faz <code>SELECT saldo</code>, valida no Python e faz <code>UPDATE saldo = :novo</code>. Sob duas requisições simultâneas, descreva a anomalia e dê três correções com o custo de cada. <em>Bloco 5.</em>',
          placeholder: 'A anomalia é… Correção 1 (custo)… Correção 2… Correção 3…',
          rubrica: [
            'Nomeia o <strong>lost update</strong> (read-modify-write no aplicativo).',
            '<code>UPDATE saldo = saldo - :v WHERE saldo &gt;= :v</code> mais <strong><code>rowcount</code></strong> (a mais simples).',
            '<strong><code>FOR UPDATE</code></strong> (lock pessimista; os concorrentes esperam).',
            '<strong>Versão otimista</strong> (<code>WHERE version = ?</code>) ou <strong><code>SERIALIZABLE</code> + retry</strong> (aborta e repete).'
          ],
          modelo: '<p>É lost update: as duas requisições leem o mesmo saldo, calculam no Python e a segunda grava por cima da primeira. Correções: (1) <code>UPDATE conta SET saldo = saldo - :v WHERE id = :id AND saldo &gt;= :v</code> conferindo o <code>rowcount</code>: atômico e barato, quando a regra cabe numa expressão; (2) <code>SELECT ... FOR UPDATE</code>: os concorrentes esperam, ao custo de locks retidos até o fim da transação; (3) coluna de versão (<code>UPDATE ... WHERE version = ?</code>, <code>rowcount = 0</code> significa releia e tente de novo), boa quando conflitos são raros, ou <code>SERIALIZABLE</code> com retry em <code>40001</code>, que exige repetir a transação inteira.</p>' + reprova('"colocar numa transação" sem mais.') },

        { tipo: 'escreva', id: 'f05cp-p7', titulo: 'P7 · Write skew e deadlock', obrigatorio: false,
          enunciado: 'Dê um exemplo de write skew que o <code>REPEATABLE READ</code> do PostgreSQL não impede e explique por que o SQLite do laboratório não o reproduz; depois, como evitar deadlock em transferências entre duas contas. <em>Bloco 5.</em>',
          placeholder: 'O exemplo é… O SQLite não reproduz porque… Para o deadlock…',
          rubrica: [
            'Invariante sobre um <strong>conjunto lido</strong> (plantão com pelo menos um médico), escritas em linhas diferentes.',
            'O SQLite <strong>serializa escritores</strong> (um por vez), e por isso recusa o segundo.',
            '<strong>Ordem global de locks</strong> e transação curta.',
            '<strong>Retry</strong> da transação inteira em <code>40P01</code>.'
          ],
          modelo: '<p>Duas transações verificam "há pelo menos 2 médicos de plantão" e cada uma tira um médico diferente; as escritas são em linhas distintas, o snapshot não vê conflito e as duas confirmam: sobra zero. O SQLite do lab não reproduz porque só admite um escritor por vez: o segundo, com snapshot obsoleto, é recusado (<code>database is locked</code>), o que é restrição, não mecanismo sofisticado. Para o deadlock em transferências A→B e B→A: travar sempre na mesma ordem global (por <code>id</code> crescente), manter transações curtas e repetir a transação inteira ao receber <code>40P01</code>, com limite de tentativas e backoff.</p>' + reprova('"o SQLite é mais seguro que o PostgreSQL".') },
        { tipo: 'takeaway', html: 'Para cada leitura que fundamenta uma escrita, nomeie o <mark>mecanismo concreto</mark>; 40001 e 40P01 pedem <mark>retry da transação inteira</mark>.' }
      ] },

      { rotulo: 'Código seguro e armazenamento', blocos: [
        { tipo: 'escreva', id: 'f05cp-p8', titulo: 'P8 · Código seguro', obrigatorio: false,
          enunciado: 'Revise <code>cursor.execute(f"SELECT * FROM {tabela} WHERE nome = \'{nome}\' ORDER BY {coluna}")</code>. Aponte as três injeções possíveis e corrija cada uma. <em>Bloco 6.</em>',
          placeholder: 'Injeção 1… Injeção 2… Injeção 3… Camada extra…',
          rubrica: [
            'Aponta as três: <strong>valor</strong> (<code>nome</code>), <strong>tabela</strong> e <strong>coluna</strong> concatenados.',
            'O valor vai por <strong>parâmetro</strong> (<code>?</code> / <code>:nome</code>).',
            'Tabela e coluna por <strong>lista de permissão</strong> (identificador não é valor).',
            '<strong>Menor privilégio</strong> da conta como camada extra.'
          ],
          modelo: '<p>As três entradas viram texto SQL: <code>tabela</code>, <code>nome</code> e <code>coluna</code>. O valor <code>nome</code> deve ir por parâmetro (<code>WHERE nome = ?</code>, com <code>(nome,)</code>). <code>tabela</code> e <code>coluna</code> são identificadores e não aceitam parâmetro: mapeio a entrada externa para o identificador real num dicionário fixo e levanto <code>ValueError</code> se não estiver lá (o mesmo vale para a direção do <code>ORDER BY</code>). Como camada extra, a conta do aplicativo tem menor privilégio (sem <code>DROP</code>, <code>CREATE</code> nem tabelas alheias), e a validação de formato na borda é higiene, nunca a defesa principal.</p>' + reprova('"trocar aspas simples por duplas".') },

        { tipo: 'escolha', id: 'f05cp-esc-p9', titulo: 'P9 · Aquecimento: por onde começar',
          pergunta: 'Uma equipe quer adicionar um banco vetorial e um de documentos para "guardar tudo do RAG". Qual é a primeira resposta defensável?',
          opcoes: [
            { id: 'a', texto: 'Aprovar: cada tipo de dado merece o seu armazenamento.', correta: false, porque: 'cada sistema adicional é uma fonte de inconsistência sem necessidade medida.' },
            { id: 'b', texto: 'Perguntar o padrão de acesso, o volume, a consistência e a fonte da verdade, e partir do PostgreSQL (<code>JSONB</code>, <code>pgvector</code>).', correta: true, porque: 'tudo na mesma transação; some outro sistema só com necessidade medida.' },
            { id: 'c', texto: 'Recusar qualquer banco que não seja relacional.', correta: false, porque: 'o critério é a necessidade medida, não a doutrina.' }
          ] },
        { tipo: 'escreva', id: 'f05cp-p9', titulo: 'P9 · Escolha do armazenamento', obrigatorio: false,
          enunciado: 'Quais perguntas você faz antes, e o que propõe como padrão? <em>Bloco 6.</em>',
          placeholder: 'Perguntas… Padrão… Fonte da verdade…',
          rubrica: [
            'Perguntas: <strong>padrão de acesso, volume, consistência, fonte da verdade</strong>.',
            'Começar no <strong>PostgreSQL</strong> (<code>JSONB</code>, <code>pgvector</code>).',
            'Só adicionar sistema com <strong>necessidade medida</strong>.',
            'Trata o resto como <strong>derivado recriável</strong>, com uma fonte única da verdade.'
          ],
          modelo: '<p>Antes de decidir, pergunto: como os dados são acessados (por chave, por similaridade com filtro de tenant, analítica)? Qual o volume e a latência medidos? Que consistência o negócio exige entre embeddings e metadados? Qual é a fonte da verdade? Como padrão, começo no PostgreSQL, que guarda <code>JSONB</code> e vetores (<code>pgvector</code>) na mesma transação, e só adiciono um banco vetorial ou de documentos quando uma necessidade medida não couber. Qualquer armazenamento adicional é tratado como derivado recriável a partir da fonte da verdade, com estratégia de sincronização (por exemplo, outbox).</p>' + reprova('"NoSQL escala melhor".') },

        { tipo: 'texto', html:
          '<h3>Entregáveis verificados (mostrar rodando)</h3>' +
          '<ol><li>Gates do lab verdes: <code>pytest</code> (79 testes), <code>ruff check</code>, <code>ruff format --check</code>, <code>mypy --strict</code>.</li>' +
          '<li>Plano antes/depois da migration 002 e a contagem N+1 (9 contra 1).</li>' +
          '<li>Demonstração de injection (6 linhas contra <code>None</code>) e a lista de permissão rejeitando <code>"title; DROP TABLE book"</code>.</li>' +
          '<li>Mutação do <code>checkout</code> rejeitada pela suíte e revertida; as quatro linhas do demo de concorrência explicadas, com a ressalva sobre o PostgreSQL.</li></ol>' },
        { tipo: 'texto', html: '<p class="ta-nota">Saídas do lab de 11/10/2026 (SQLite 3.53.1, Python 3.14.7). O comportamento do PostgreSQL citado vem da documentação oficial (verificada em 11/10/2026; revalidar em até 90 dias), não de execução local.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>mecanismo</mark> primeiro e, depois, o <mark>custo</mark> da defesa que você escolheu.' }
      ] }
    ]
  });
})();
