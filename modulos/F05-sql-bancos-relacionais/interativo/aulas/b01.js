/* F05 · Bloco 1: modelo relacional, chaves, restrições, normalização e desnormalização consciente. Fonte: F05.html#b01. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var ESQUEMA =
    'CREATE TABLE author (\n' +
    '    id        INTEGER PRIMARY KEY,\n' +
    '    name      TEXT NOT NULL UNIQUE,\n' +
    '    born_year INTEGER CHECK (born_year BETWEEN 1000 AND 2100)\n' +
    ');\n' +
    'CREATE TABLE category (\n' +
    '    id        INTEGER PRIMARY KEY,\n' +
    '    name      TEXT NOT NULL,\n' +
    '    parent_id INTEGER REFERENCES category (id)       -- hierarquia (bloco 3)\n' +
    ');\n' +
    'CREATE TABLE book (\n' +
    '    id             INTEGER PRIMARY KEY,\n' +
    '    isbn           TEXT NOT NULL UNIQUE,\n' +
    '    title          TEXT NOT NULL,\n' +
    '    author_id      INTEGER NOT NULL REFERENCES author (id),\n' +
    '    category_id    INTEGER REFERENCES category (id),  -- livro sem categoria é permitido\n' +
    '    published_year INTEGER,\n' +
    '    copies         INTEGER NOT NULL DEFAULT 1 CHECK (copies >= 0)\n' +
    ');\n' +
    'CREATE TABLE member (\n' +
    '    id          INTEGER PRIMARY KEY,\n' +
    '    email       TEXT NOT NULL UNIQUE,\n' +
    '    name        TEXT NOT NULL,\n' +
    '    joined_on   TEXT NOT NULL,\n' +
    '    referred_by INTEGER REFERENCES member (id)        -- auto-relacionamento\n' +
    ');\n' +
    'CREATE TABLE loan (\n' +
    '    id          INTEGER PRIMARY KEY,\n' +
    '    book_id     INTEGER NOT NULL REFERENCES book (id),\n' +
    '    member_id   INTEGER NOT NULL REFERENCES member (id),\n' +
    '    loaned_on   TEXT NOT NULL,\n' +
    '    due_on      TEXT NOT NULL,\n' +
    '    returned_on TEXT,                                 -- NULL = ainda emprestado\n' +
    '    CHECK (due_on >= loaned_on)\n' +
    ');';

  var etapasAnomalia = function () {
    return [
      { id: 'plana', nome: 'Tabela plana', descricao: 'Dois empréstimos do mesmo livro', tom: 'dns', ms: 4, linhas: [
        L('info', 'loan_flat(loan_id, member_name, member_email, book_title, author_name, author_born, loaned_on)'),
        L('out', 'loan_id 1 | Dom Casmurro | Machado de Assis'),
        L('out', 'loan_id 2 | Dom Casmurro | Machado de Assis'),
        L('hint', 'o nome do autor está repetido: um fato guardado duas vezes')] },
      { id: 'parcial', nome: 'UPDATE parcial', descricao: 'Muda o nome só no loan_id = 1', tom: 'tcp', ms: 6, linhas: [
        L('cmd', "UPDATE loan_flat SET author_name = 'M. de Assis' WHERE loan_id = 1;"),
        L('cmd', "SELECT COUNT(DISTINCT author_name) FROM loan_flat WHERE book_title = 'Dom Casmurro';"),
        L('out', '2'),
        L('hint', 'o mesmo livro agora tem dois autores: anomalia de atualização')] },
      { id: 'normalizado', nome: 'Esquema normalizado', descricao: 'O mesmo UPDATE em author', tom: 'tls', ms: 3, linhas: [
        L('cmd', "UPDATE author SET name = 'M. de Assis' WHERE id = 1;"),
        L('out', '1 linha alterada'),
        L('cmd', 'SELECT COUNT(DISTINCT a.name) FROM loan l JOIN book b ON b.id = l.book_id JOIN author a ON a.id = b.author_id WHERE b.title = \'Dom Casmurro\';'),
        L('out', '1'),
        L('hint', 'a fonte da verdade é única: uma linha tocada, um nome visto')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'f05-b1',
    titulo: 'Modelo relacional: chaves, restrições e normalização',
    minutos: 35,
    resumo: 'O esquema é a única parte do sistema que sobrevive a todas as versões do código. Chaves e restrições declaram o que vale para todo cliente; a normalização até a 3FN impede as três anomalias.',
    objetivo: 'Declarar chaves e restrições no banco, reconhecer a violação de 1FN, 2FN e 3FN, dizer qual anomalia cada uma abre e decidir quando desnormalizar.',
    revisao: [
      { id: 'f05b1-restricao', pergunta: 'Por que declarar UNIQUE (email) no banco vale mais que conferir "já existe?" no código da aplicação?',
        opcoes: [
          opc('a', 'A restrição vale para todo cliente e é atômica; a checagem na aplicação tem corrida entre o SELECT e o INSERT', true, 'duas requisições simultâneas passam pela checagem e ambas inserem; só a restrição é atômica e vale para outro serviço, script ou console.'),
          opc('b', 'O banco valida mais rápido que o Python', false, 'velocidade não é o ponto: o ponto é a garantia que vale para qualquer cliente.'),
          opc('c', 'UNIQUE dispensa o índice', false, 'a unicidade é implementada por índice.')] },
      { id: 'f05b1-3fn', pergunta: 'pedido(id, produto_id, nome_produto, preco_produto): que forma normal é violada e qual anomalia aparece?',
        opcoes: [
          opc('a', '3FN, por dependência transitiva; anomalia de atualização ao renomear o produto', true, 'nome_produto depende de produto_id, que não é a chave (id). A correção é uma tabela produto.'),
          opc('b', '1FN, porque há mais de uma coluna', false, '1FN trata de valores atômicos e grupos repetidos, não de número de colunas.'),
          opc('c', 'Nenhuma: repetir o nome sempre acelera a leitura', false, 'redundância derivável é a causa das anomalias; desnormalizar exige medição e dono da consistência.')] },
      { id: 'f05b1-snapshot', pergunta: 'Copiar o preço do produto para order_item no momento da compra viola a 3FN?',
        opcoes: [
          opc('a', 'Não: é snapshot histórico, o fato é "quanto custou naquele dia"', true, 'a cópia não é redundância; juntar com o preço atual falsificaria a história.'),
          opc('b', 'Sim, e deve ser trocada por um join com o preço atual', false, 'o join com o preço atual reescreve o passado.'),
          opc('c', 'Sim, mas só se o preço for decimal', false, 'o tipo da coluna não muda a natureza do fato.')] },
      { id: 'f05b1-sqlite', pergunta: 'No SQLite, o que acontece com chaves estrangeiras se a conexão não executar PRAGMA foreign_keys = ON?',
        opcoes: [
          opc('a', 'Órfãos entram sem erro: a verificação é por conexão e vem desligada por herança histórica', true, 'no PostgreSQL a verificação é sempre ativa; o connect() do lab liga o pragma.'),
          opc('b', 'O SQLite rejeita qualquer INSERT com chave estrangeira', false, 'sem o pragma, a restrição é ignorada.'),
          opc('c', 'O SQLite liga o pragma sozinho no primeiro INSERT', false, 'ele precisa ser ligado em toda conexão.')] },
      { id: 'f05b1-desnorm', pergunta: 'Qual destas é uma pergunta obrigatória antes de desnormalizar?',
        opcoes: [
          opc('a', 'Quem mantém a cópia consistente e como detectar divergência?', true, 'junto com: qual consulta medida é lenta e não se resolve com índice, e qual a defasagem aceitável.'),
          opc('b', 'Qual é o nome do SGBD?', false, 'a decisão é sobre consistência e medição, não sobre o produto.'),
          opc('c', 'Quantas colunas a tabela terá?', false, 'o número de colunas não responde às quatro perguntas.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>O esquema sobrevive ao código</h3>' +
          '<p>Cada aplicativo, script, notebook e job de ETL que tocar o banco passa pelas mesmas tabelas. As regras que você declara ali valem para todos, inclusive para o código que ainda não foi escrito e para o <code>UPDATE</code> manual de madrugada. Regra que vive só no aplicativo vale para o aplicativo.</p>' +
          '<p>Quem modela bem gasta menos em consultas, migrations e correção de dados. Quem modela mal paga juros em cada módulo seguinte. Em sistemas com IA o banco guarda usuários, conversas, execuções de agentes, custos e avaliações: as falhas caras ali são linhas órfãs, relatórios que perdem registros e estados impossíveis, não erros de sintaxe.</p>' },
        { tipo: 'texto', html:
          '<h3>Relação, chave, restrição</h3>' +
          '<p>No modelo de Codd (1970), uma <strong>relação</strong> é um conjunto de tuplas com os mesmos atributos. Duas consequências que o SQL implementa só pela metade: conjuntos não têm ordem (sem <code>ORDER BY</code>, nenhuma ordem é garantida) e não têm duplicatas. O SQL admite duplicatas em tabelas sem chave e em resultados sem <code>DISTINCT</code>; por isso toda tabela precisa de chave. O resultado de uma consulta é outra relação, o que torna as operações composáveis.</p>' },
        { tipo: 'abas', rotulo: 'Peças do contrato', itens: [
          { rotulo: 'Chaves', blocos: [{ tipo: 'texto', html:
            '<p>Uma <strong>chave candidata</strong> é um conjunto <em>mínimo</em> de atributos que identifica cada linha. Você escolhe uma como <strong>chave primária</strong>; as demais viram <code>UNIQUE NOT NULL</code>. No lab, <code>book.isbn</code> e <code>member.email</code> são chaves candidatas além do <code>id</code>.</p>' +
            '<p><strong>Natural</strong> vem do domínio (ISBN, CPF); <strong>substituta</strong> é gerada (<code>id</code> inteiro, UUID). A natural muda (e-mail, razão social), tem formato que o mundo corrige e vaza para chaves estrangeiras que você terá de reescrever. A substituta é estável e barata de referenciar, mas não impede duplicata do mundo real.</p>' +
            '<p><strong>Coloque a substituta como primária e declare a natural como <code>UNIQUE</code>.</strong> As duas, não uma delas. No PostgreSQL, prefira <code>GENERATED ALWAYS AS IDENTITY</code> a <code>SERIAL</code> (padrão SQL, sem o acoplamento com uma sequence solta); no SQLite, <code>INTEGER PRIMARY KEY</code> é apelido do <code>rowid</code>.</p>' }] },
          { rotulo: 'Chave estrangeira', blocos: [{ tipo: 'texto', html:
            '<p><code>REFERENCES author (id)</code> garante integridade referencial: não existe livro de autor inexistente, e não se apaga autor com livros (ação padrão <code>NO ACTION</code>/<code>RESTRICT</code>).</p>' +
            '<ul><li><code>ON DELETE CASCADE</code> apaga os filhos junto: útil para dependentes que não fazem sentido sozinhos (itens de um pedido), perigoso em dados com valor próprio (apagar um autor levando os empréstimos junto).</li>' +
            '<li><code>ON DELETE SET NULL</code> exige coluna anulável.</li>' +
            '<li><strong>O PostgreSQL não cria índice na coluna da chave estrangeira.</strong> Sem ele, apagar um pai varre a tabela filha e os joins por essa coluna ficam lentos (bloco 4).</li></ul>' }] },
          { rotulo: 'NOT NULL, CHECK, UNIQUE, DEFAULT', blocos: [{ tipo: 'texto', html:
            '<p>São o contrato da coluna. <code>CHECK (copies &gt;= 0)</code> rejeita o estado impossível em qualquer caminho de escrita.</p>' +
            '<ul><li><code>CHECK</code> rejeita só o que avalia para <code>FALSE</code>; <code>NULL</code> passa (bloco 2).</li>' +
            '<li><code>UNIQUE</code> trata cada <code>NULL</code> como distinto na maior parte dos bancos; o PostgreSQL 15 adicionou <code>UNIQUE NULLS NOT DISTINCT</code>.</li></ul>' }] }
        ] },
        { tipo: 'takeaway', html: 'Declare no banco o que é <mark>invariante</mark>: vale para <mark>todo cliente</mark>, não só para o seu código.' }
      ] },

      { rotulo: 'Esquema e normalização', blocos: [
        { tipo: 'texto', html:
          '<p>Este é o esquema da migration <code>001_initial.sql</code> do laboratório, na forma final (3FN). Leia as decisões, não só a sintaxe.</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto: ESQUEMA },
        { tipo: 'texto', html:
          '<ul>' +
          '<li><code>loan</code> é uma relação <strong>muitos-para-muitos</strong> entre <code>book</code> e <code>member</code>, resolvida por tabela associativa. Como carrega atributos próprios (datas), é entidade, não só "tabela de junção".</li>' +
          '<li><code>returned_on IS NULL</code> codifica "empréstimo aberto": <code>NULL</code> significa "ainda não aconteceu", um uso legítimo.</li>' +
          '<li><code>category_id</code> e <code>referred_by</code> anuláveis significam "não se aplica".</li>' +
          '<li>Cada <code>NULL</code> deve ter um significado único e documentado. "Desconhecido", "não se aplica" e "ainda não" misturados na mesma coluna são o início de bugs de relatório.</li></ul>' +
          '<p>Os testes do lab provam que as restrições mordem: linha válida entra; <code>copies = -1</code>, <code>due_on</code> anterior a <code>loaned_on</code>, ISBN duplicado e autor inexistente são rejeitados; apagar um autor referenciado é bloqueado. Há também um <strong>controle negativo</strong>: sem <code>PRAGMA foreign_keys = ON</code> na conexão, órfãos entram sem erro. No SQLite a verificação de chave estrangeira é <em>por conexão</em> e vem desligada por herança histórica; no PostgreSQL é sempre ativa. O <code>connect()</code> do lab liga o pragma.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: a tipagem flexível do SQLite', html:
          '<p>Um <code>INTEGER</code> aceita <code>\'abc\'</code> sem reclamar (afinidade, não tipo estrito), e datas são <code>TEXT</code> sem validação. O lab guarda ISO-8601 e depende de a comparação lexicográfica coincidir com a cronológica. Isso funciona <em>só</em> porque o formato é fixo.</p>' +
          '<p>No PostgreSQL use <code>DATE</code>/<code>TIMESTAMPTZ</code> e deixe o tipo rejeitar lixo. Se precisar de rigor no SQLite, use tabelas <code>STRICT</code> (3.37+). Quem testa o schema no SQLite e implanta no PostgreSQL descobre, na migração, as linhas inválidas que o primeiro aceitava.</p>' },
        { tipo: 'texto', html:
          '<h3>Dependências, anomalias e as três formas</h3>' +
          '<p>Normalizar é eliminar redundância <em>derivável</em> de dependências funcionais: "X determina Y" quando não existem duas linhas com o mesmo X e Y diferente. Redundância não é só desperdício de espaço: é a causa das três <strong>anomalias</strong>.</p>' +
          '<ul><li><strong>Atualização:</strong> o mesmo fato aparece em N linhas; mudar em N−1 deixa o dado se contradizendo.</li>' +
          '<li><strong>Inserção:</strong> não dá para registrar um fato sem outro (um autor sem livros não cabe numa tabela que só tem linhas de empréstimo).</li>' +
          '<li><strong>Remoção:</strong> apagar um fato leva outro junto (apagar o último empréstimo de um livro apaga o único registro de que o livro existe).</li></ul>' +
          '<p>Comece da planilha, a tabela plana que todo mundo constrói primeiro: <code>loan_flat(loan_id, member_name, member_email, book_title, author_name, author_born, loaned_on)</code>.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Forma</th><th>Regra</th><th>Violação em <code>loan_flat</code></th><th>Correção</th></tr></thead><tbody>' +
          '<tr><td><strong>1FN</strong></td><td>Valores atômicos, sem grupos repetidos, linhas identificáveis por chave.</td><td>Uma coluna <code>autores = "Ana, Bia"</code> ou <code>tel1, tel2, tel3</code>: não dá para consultar, indexar nem restringir cada valor.</td><td>Uma linha por fato; tabela filha para o grupo repetido.</td></tr>' +
          '<tr><td><strong>2FN</strong></td><td>1FN + todo atributo não-chave depende da chave <em>inteira</em> (só importa com chave composta).</td><td>Chave composta <code>(loan_id, book_title)</code> e <code>author_born</code> depende só do livro.</td><td>Separar o que depende de parte da chave.</td></tr>' +
          '<tr><td><strong>3FN</strong></td><td>2FN + nenhum atributo não-chave depende de outro não-chave (sem dependência transitiva).</td><td><code>loan_id → book_title → author_name → author_born</code>: o nascimento depende do autor, que depende do livro, que depende do empréstimo.</td><td>Uma tabela por entidade: <code>author</code>, <code>book</code>, <code>member</code>, <code>loan</code>.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O mnemônico clássico: cada atributo depende "da chave, de toda a chave e de nada além da chave". A <strong>forma normal de Boyce-Codd</strong> (BCNF) fecha uma brecha da 3FN quando há várias chaves candidatas sobrepostas; na prática, quem chega à 3FN com chaves bem identificadas quase sempre já está em BCNF. A 4FN e a 5FN tratam dependências multivaloradas e de junção, que aparecem raramente fora de relacionamentos ternários.</p>' },
        { tipo: 'takeaway', html: 'Cada atributo depende da <mark>chave</mark>, de <mark>toda a chave</mark> e de nada além da chave.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>O lab demonstra a anomalia de atualização com dois empréstimos de <em>Dom Casmurro</em> na tabela plana. Antes de rodar, preveja o que acontece quando o nome do autor muda só em um deles.</p>' },
        { tipo: 'rode', id: 'f05b1-rode', titulo: 'A anomalia de atualização', enunciado: 'Rode as três etapas na ordem. A barra mostra a quantidade de linhas tocadas ou vistas. (Resumo do teste do lab, não a saída literal.)',
          prefixo: '$', entrada: 'sqlite3 biblioteca.db', unidade: 'linhas', terminalTitulo: 'sqlite', etapas: etapasAnomalia(),
          prever: { pergunta: 'Depois do UPDATE só no loan_id = 1 da tabela plana, quantos nomes distintos de autor o Dom Casmurro tem?', opcoes: [
            { id: 'a', texto: '1: o UPDATE vale para o livro todo.', correta: false, porque: 'o UPDATE tocou uma linha; o nome também está repetido na outra.' },
            { id: 'b', texto: '2: o mesmo livro ficou com dois autores.', correta: true, porque: 'o fato "autor do livro" existia em duas linhas, e só uma mudou.' },
            { id: 'c', texto: 'O banco recusa o UPDATE.', correta: false, porque: 'nenhuma restrição declarada impede a contradição entre linhas.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em cada etapa para ler só as linhas dela.',
          tutorDepois: 'No esquema normalizado, o mesmo UPDATE toca uma linha de <code>author</code> e a consulta pelos empréstimos enxerga um nome só: COUNT(DISTINCT) = 1. A fonte da verdade é única.',
          callout: 'Você viu a tabela plana se contradizer e o esquema normalizado não.' },
        { tipo: 'texto', html:
          '<h3>Desnormalização consciente</h3>' +
          '<p>Normalização é o ponto de partida, não a religião. Desnormalizar é aceitar redundância em troca de leitura mais barata, e só é "consciente" se você responde a quatro perguntas:</p>' +
          '<ol><li>Qual consulta <em>medida</em> é lenta e não se resolve com índice ou reescrita?</li><li>Quem mantém a cópia consistente: trigger, a mesma transação, job de reconciliação?</li><li>Qual a defasagem aceitável?</li><li>Como detectar e corrigir divergência?</li></ol>' +
          '<p>Padrões legítimos:</p>' +
          '<ul><li><strong>Contadores e totais pré-calculados</strong> (<code>order.total</code>, <code>book.copies</code>), mantidos na mesma transação que altera as filhas. O <code>copies</code> do lab é desnormalização do tipo "estoque derivável de entradas e saídas".</li>' +
          '<li><strong>Snapshot histórico:</strong> copiar o preço e o nome do produto para <code>order_item</code> na compra. A cópia <em>não é redundância</em>: o fato é "quanto custou naquele dia". Tratar isso como violação da 3FN e juntar com o preço atual falsifica a história.</li>' +
          '<li><strong>Tabelas de leitura / views materializadas</strong> para relatórios: o dado normalizado continua sendo a fonte; a cópia é recriável.</li>' +
          '<li><strong>Colunas JSON</strong> para atributos esparsos e sem consulta relacional (bloco 6).</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: desnormalizar antes de medir', html:
          '<p>A leitura "cara" que justificou a cópia muitas vezes some com um índice (bloco 4) ou com a reescrita de um join. A cópia, porém, fica: cada escrita futura carrega o custo de mantê-la, e cada bug de consistência é de um tipo que a 3FN tornaria impossível.</p>' +
          '<p>O inverso também morde: normalizar o que é <em>fato histórico</em> (preço da venda, endereço de entrega no pedido) e perder a capacidade de reproduzir o passado.</p>' },
        { tipo: 'takeaway', html: 'Desnormalize só com <mark>medição</mark>, <mark>dono da consistência</mark> e plano de reconciliação; snapshot histórico não é cópia redundante.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'complete', id: 'f05b1-complete', titulo: 'Complete a tabela loan', obrigatorio: false,
          enunciado: 'Escolha, em cada lacuna, a declaração que faz a tabela <code>loan</code> proteger a integridade em qualquer caminho de escrita.',
          linguagem: 'sql',
          partes: [
            'CREATE TABLE loan (\n    id          INTEGER PRIMARY KEY,\n    book_id     INTEGER ',
            { lacuna: 'fk', opcoes: ['NOT NULL REFERENCES book (id)', 'UNIQUE', 'DEFAULT 0'], correta: 'NOT NULL REFERENCES book (id)' },
            ',\n    member_id   INTEGER NOT NULL REFERENCES member (id),\n    loaned_on   TEXT NOT NULL,\n    due_on      TEXT NOT NULL,\n    returned_on TEXT ',
            { lacuna: 'ret', opcoes: ['NOT NULL', '-- NULL = ainda emprestado', 'DEFAULT \'\''], correta: '-- NULL = ainda emprestado' },
            ',\n    ',
            { lacuna: 'chk', opcoes: ['CHECK (due_on >= loaned_on)', 'CHECK (due_on IS NULL)', 'UNIQUE (due_on)'], correta: 'CHECK (due_on >= loaned_on)' },
            '\n);'
          ],
          explicacao: 'A chave estrangeira com NOT NULL impede empréstimo sem livro e livro inexistente; returned_on fica anulável porque NULL significa "ainda não aconteceu"; o CHECK barra vencimento anterior ao empréstimo.' },
        { tipo: 'python', id: 'f05b1-python', titulo: 'Detecte a dependência violada', obrigatorio: false,
          enunciado: 'Complete <code>viola_dependencia(linhas, determinante, dependente)</code>: <code>linhas</code> é uma lista de dicts. Devolva <code>True</code> se existirem duas linhas com o mesmo valor em <code>determinante</code> e valores diferentes em <code>dependente</code> (a dependência funcional "X determina Y" é falsa nos dados), e <code>False</code> caso contrário.',
          codigo: 'def viola_dependencia(linhas, determinante, dependente):\n    vistos = {}\n    for linha in linhas:\n        chave = linha[determinante]\n        valor = linha[dependente]\n        # 1. se a chave já foi vista com outro valor, a dependência é violada\n        # 2. guarde o valor visto para essa chave\n    return False\n\n\nplana = [\n    {"loan_id": 1, "book_title": "Dom Casmurro", "author_name": "Machado de Assis"},\n    {"loan_id": 2, "book_title": "Dom Casmurro", "author_name": "M. de Assis"},\n]\nprint(viola_dependencia(plana, "book_title", "author_name"))\n',
          testes: 'PLANA = [\n    {"loan_id": 1, "book_title": "Dom Casmurro", "author_name": "Machado de Assis"},\n    {"loan_id": 2, "book_title": "Dom Casmurro", "author_name": "M. de Assis"},\n    {"loan_id": 3, "book_title": "Vidas Secas", "author_name": "Graciliano Ramos"},\n]\n\n\ndef test_anomalia_de_atualizacao_detectada():\n    assert viola_dependencia(PLANA, "book_title", "author_name") is True\n\n\ndef test_dados_consistentes():\n    ok = [PLANA[0], dict(PLANA[1], author_name="Machado de Assis"), PLANA[2]]\n    assert viola_dependencia(ok, "book_title", "author_name") is False\n\n\ndef test_borda_vazia_e_linha_unica():\n    assert viola_dependencia([], "book_title", "author_name") is False\n    assert viola_dependencia(PLANA[:1], "book_title", "author_name") is False\n\n\ndef test_controle_negativo_chaves_diferentes_nao_violam():\n    assert viola_dependencia(PLANA, "loan_id", "author_name") is False\n',
          dica: 'Se <code>chave in vistos</code> e <code>vistos[chave] != valor</code>, devolva <code>True</code> na hora. Senão, grave <code>vistos[chave] = valor</code>.',
          solucao: 'def viola_dependencia(linhas, determinante, dependente):\n    vistos = {}\n    for linha in linhas:\n        chave = linha[determinante]\n        valor = linha[dependente]\n        if chave in vistos and vistos[chave] != valor:\n            return True\n        vistos[chave] = valor\n    return False\n',
          tutorDepois: 'Esta é a definição do texto em código: X determina Y quando não existem duas linhas com o mesmo X e Y diferente. Quando a função devolve True para uma coluna que não é chave, a tabela guarda o mesmo fato duas vezes.',
          callout: 'A dependência funcional agora é um teste que você executa.' },
        { tipo: 'cenario', id: 'f05b1-cenario', titulo: 'Desnormalizar ou não', obrigatorio: false,
          enunciado: 'O relatório "empréstimos por autor" está lento. Alguém propõe copiar <code>author_name</code> para dentro de <code>loan</code>. Escolha como reagir.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A proposta é guardar o nome do autor em cada linha de <code>loan</code> para evitar dois joins. Ninguém mediu a consulta. O que você faz primeiro?', opcoes: [
              { texto: 'Aprovar: menos joins sempre é mais rápido.', vai: 'f-cego', tom: 'ruim', consequencia: 'a cópia nasce sem medição e sem dono da consistência.' },
              { texto: 'Medir a consulta e ver se um índice ou uma reescrita resolve.', vai: 'medir', tom: 'ok', consequencia: 'você descobre se a lentidão existe e se a cópia é necessária.' }
            ] },
            medir: { texto: 'Com índice nas chaves estrangeiras e a consulta reescrita, o relatório ainda custa 40 segundos num volume realista. Para copiar, o que precisa estar respondido?', opcoes: [
              { texto: 'Quem mantém a cópia, qual a defasagem aceitável e como detectar divergência. Melhor ainda: uma view materializada recriável.', vai: 'f-bom', tom: 'ok', consequencia: 'o dado normalizado segue como fonte e a cópia pode ser reconstruída.' },
              { texto: 'Nada: o nome do autor quase nunca muda.', vai: 'f-diverge', tom: 'ruim', consequencia: 'o "quase nunca" é a anomalia de atualização esperando acontecer.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'A leitura ficou barata, o dado normalizado continua sendo a fonte e a divergência é detectável.' },
            'f-cego': { bom: false, texto: 'A cópia entrou antes da medição; um índice teria bastado e a escrita agora paga o custo para sempre.' },
            'f-diverge': { bom: false, texto: 'Um autor foi renomeado em parte das linhas e o relatório passou a contradizer o cadastro.' }
          },
          callout: 'Você mediu primeiro e desnormalizou com dono e plano de reconciliação.' },
        { tipo: 'escolha', id: 'f05b1-escolha-unique', titulo: 'Confira: onde mora a garantia',
          pergunta: 'Por que declarar <code>UNIQUE (email)</code> no banco é mais forte do que apenas conferir "já existe?" no código da aplicação?',
          opcoes: [
            { id: 'a', texto: 'Porque o banco valida mais rápido que o Python.', correta: false, porque: 'velocidade não é o ponto.' },
            { id: 'b', texto: 'A restrição vale para todo cliente e continua valendo quando duas requisições conferem ao mesmo tempo; a checagem na aplicação tem corrida entre o SELECT e o INSERT.', correta: true, porque: 'só a restrição é atômica e vale para outro serviço, script de manutenção ou console. A aplicação ainda pode checar para dar mensagem amigável, mas a garantia mora no banco.' },
            { id: 'c', texto: 'Porque UNIQUE dispensa o índice, o que economiza espaço.', correta: false, porque: 'não dispensa.' },
            { id: 'd', texto: 'Porque a aplicação nunca consegue consultar o banco antes de inserir.', correta: false, porque: 'ela consegue, e justamente aí está a corrida.' }
          ], tutorDepois: 'Checar antes não basta; declare.' },
        { tipo: 'escolha', id: 'f05b1-escolha-2fn', titulo: 'Confira: a chave composta',
          pergunta: 'A tabela <code>item_pedido(pedido_id, produto_id, produto_nome, qtd)</code> tem chave primária <code>(pedido_id, produto_id)</code>. Qual é o problema de modelagem?',
          opcoes: [
            { id: 'a', texto: '<code>produto_nome</code> depende só de <code>produto_id</code> (parte da chave): o mesmo fato fica repetido e abre anomalia de atualização.', correta: true, porque: 'dependência parcial da chave (2FN). Atenção: o <em>preço</em> cobrado na venda é snapshot histórico legítimo; o nome atual do produto não é.' },
            { id: 'b', texto: 'Não há problema: repetir o nome do produto em cada linha sempre acelera a leitura.', correta: false, porque: 'a redundância derivável abre a anomalia de atualização.' },
            { id: 'c', texto: '<code>qtd</code> deveria estar em outra tabela, porque números não podem ficar numa tabela de junção.', correta: false, porque: 'a quantidade é atributo da relação pedido-produto e pertence à tabela.' },
            { id: 'd', texto: 'A chave composta é proibida; toda tabela precisa de um <code>id</code> substituto sozinho.', correta: false, porque: 'chave composta natural em tabela de junção pura é ótima.' }
          ], tutorDepois: 'Pergunte de que cada atributo depende.' },
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs e erros comuns', html:
          '<ul><li><strong>Tabela EAV</strong> (<code>entidade, atributo, valor</code>) para fugir de migrations: perde tipo, restrição, índice útil e legibilidade. Use colunas, ou <code>JSONB</code> deliberado.</li>' +
          '<li><strong>Tabela com 80 colunas e metade <code>NULL</code></strong>: normalmente é herança mal modelada (subtipos). Considere tabelas por subtipo ou uma tabela de atributos específicos com chave compartilhada.</li>' +
          '<li><strong>Soft delete (<code>deleted_at</code>) em tudo:</strong> toda consulta passa a precisar do filtro e o <code>UNIQUE</code> deixa de valer (o e-mail "apagado" continua ocupando o lugar). Se precisar, use índice único parcial (<code>WHERE deleted_at IS NULL</code>) e uma view.</li>' +
          '<li><strong>Chave composta em tudo vs <code>id</code> substituto:</strong> composta natural em junção pura é ótima; propagar chaves de três colunas por seis níveis de filhos é doloroso.</li>' +
          '<li><strong>Cascade como atalho:</strong> <code>ON DELETE CASCADE</code> "para facilitar a limpeza de testes" põe em produção a capacidade de apagar o histórico inteiro com um comando.</li></ul>' },
        { tipo: 'takeaway', html: 'Relação é conjunto de fatos; a <mark>chave</mark> diz o que é um fato, e a <mark>3FN</mark> garante que cada fato exista uma vez.' }
      ] }
    ]
  });
})();
