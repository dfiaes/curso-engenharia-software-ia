/* F05 · Bloco 5: transações: ACID, isolamento e anomalias, locks, MVCC e deadlock. Fonte: F05.html#b05. Saídas do lab: SQLite 3.53.1 (11/10/2026); comportamentos do PostgreSQL vêm da documentação oficial (verificada em 11/10/2026), sem execução local. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasConcorrencia = function () {
    return [
      { id: 'snapshot', nome: 'Snapshot do leitor', descricao: 'Outra conexão confirma enquanto o leitor lê', tom: 'dns', ms: 2, linhas: [
        L('cmd', 'uv run python -m sqllab.cli concurrency'),
        L('out', '...'),
        L('out', 'snapshot: first=1 same-txn=1 after-commit=2'),
        L('hint', 'o leitor contou 1, outra conexão inseriu e confirmou o segundo livro, o leitor continuou contando 1 (seu snapshot); só depois do seu COMMIT viu 2')] },
      { id: 'lost', nome: 'Lost update', descricao: 'Duas retiradas de um estoque de 3', tom: 'tcp', ms: 3, linhas: [
        L('out', 'lost update: read-modify-write -> 2, atomic UPDATE -> 1 (expected 1)'),
        L('hint', 'o read-modify-write perdeu uma retirada; o UPDATE com expressão atômica não')] },
      { id: 'skew', nome: 'Write skew no SQLite', descricao: 'Dois médicos de plantão, dois escritores', tom: 'tls', ms: 1, linhas: [
        L('out', "write skew: second writer -> 'database is locked', on call = 1"),
        L('out', "two writers: 'database is locked'"),
        L('hint', 'o SQLite evita o write skew por ser mais restritivo (um escritor por vez), não por ter um mecanismo sofisticado. No PostgreSQL em REPEATABLE READ as duas confirmam e sobra zero')] }
    ];
  };

  var CHECKOUT =
    'def checkout(self, member_id, book_id, on, days=14) -> int:\n' +
    '    with transaction(self._conn, immediate=True):          # BEGIN IMMEDIATE ... COMMIT/ROLLBACK\n' +
    '        loan = self._conn.execute(\n' +
    '            "INSERT INTO loan (book_id, member_id, loaned_on, due_on) VALUES (?, ?, ?, ?) RETURNING id",\n' +
    '            (book_id, member_id, on.isoformat(), (on + timedelta(days=days)).isoformat())).fetchone()\n' +
    '        stock = self._conn.execute(\n' +
    '            "UPDATE book SET copies = copies - 1 WHERE id = ? AND copies > 0", (book_id,))\n' +
    '        if stock.rowcount == 0:\n' +
    '            raise OutOfStock(f"book {book_id} has no copy available")   # desfaz o INSERT também\n' +
    '    return int(loan["id"])';

  var BANCO =
    'class Banco:\n' +
    '    def __init__(self, copies):\n' +
    '        self.copies = copies\n\n\n' +
    'def rmw_intercalado(banco):\n' +
    '    """Duas requisições leem antes de qualquer uma gravar (read-modify-write)."""\n' +
    '    lido_a = banco.copies\n' +
    '    lido_b = banco.copies\n' +
    '    banco.copies = lido_a - 1\n' +
    '    banco.copies = lido_b - 1\n' +
    '    return banco.copies\n\n\n';

  TrilhaAula.registrar({
    id: 'f05-b5',
    titulo: 'Transações: ACID, isolamento, locks e deadlock',
    minutos: 50,
    resumo: 'Com dois usuários, cada instrução correta isoladamente pode produzir um estado impossível. Entender o que a transação promete, e o que não promete por padrão, é o que mais pesa em produção.',
    objetivo: 'Raciocinar sobre ACID, níveis de isolamento, lost update, write skew, locks, MVCC e deadlock, e escolher a defesa certa.',
    revisao: [
      { id: 'f05b5-lost', pergunta: 'Duas transações leem copies = 3 e cada uma grava 3 - 1: o estoque final é 2. Que anomalia é e qual a correção mais simples?',
        opcoes: [
          opc('a', 'Lost update (read-modify-write no aplicativo); UPDATE book SET copies = copies - 1 WHERE id = ? AND copies > 0, que é atômico', true, 'alternativas: SELECT ... FOR UPDATE, coluna de versão (otimista) ou isolamento mais forte com retry.'),
          opc('b', 'Dirty read; use READ COMMITTED', false, 'ninguém leu dado não confirmado.'),
          opc('c', 'Deadlock; o banco aborta uma transação', false, 'ninguém ficou esperando em ciclo.')] },
      { id: 'f05b5-skew', pergunta: 'Duas transações em REPEATABLE READ verificam "há pelo menos 2 médicos de plantão" e cada uma tira um médico diferente; ambas confirmam. O REPEATABLE READ do PostgreSQL impede?',
        opcoes: [
          opc('a', 'Não: é write skew. SERIALIZABLE (SSI) impede, abortando uma com 40001, e o aplicativo repete a transação', true, 'outras defesas: lock do conjunto lido (FOR UPDATE) ou materializar o conflito numa linha.'),
          opc('b', 'Sim: o snapshot detecta conflito entre linhas diferentes', false, 'o snapshot só detecta escrita concorrente na mesma linha.'),
          opc('c', 'Sim, com um índice único', false, 'não há unicidade a violar entre linhas diferentes.')] },
      { id: 'f05b5-retry', pergunta: 'Ao receber 40001 (serialização) ou 40P01 (deadlock), o que o aplicativo deve fazer?',
        opcoes: [
          opc('a', 'Repetir a transação inteira, leituras incluídas, com limite de tentativas e backoff com jitter; as operações precisam ser seguras para repetir', true, 'são falhas esperadas, não bugs. Nada de e-mail ou cobrança antes do COMMIT.'),
          opc('b', 'Repetir só o último comando', false, 'as leituras que fundamentaram a escrita podem ter ficado obsoletas.'),
          opc('c', 'Ignorar o erro e seguir', false, 'no PostgreSQL a transação fica abortada e rejeita toda instrução até o ROLLBACK.')] },
      { id: 'f05b5-mvcc', pergunta: 'Por que uma transação aberta por horas ("idle in transaction") prejudica o PostgreSQL?',
        opcoes: [
          opc('a', 'Segura o horizonte do snapshot e impede o VACUUM de limpar versões antigas: a tabela incha e tudo fica lento; também segura locks', true, 'transação curta é requisito operacional; nunca deixe uma aberta durante chamada externa ou espera do usuário.'),
          opc('b', 'Bloqueia todas as leituras', false, 'no MVCC leitores não bloqueiam escritores.'),
          opc('c', 'Corrompe o log de transações', false, 'não há corrupção; o custo é bloat e locks.')] },
      { id: 'f05b5-acid', pergunta: 'O que o banco garante com o "C" de ACID?',
        opcoes: [
          opc('a', 'Só o que você declarou: CHECK, FOREIGN KEY, UNIQUE. Invariantes que só existem na sua cabeça são problema seu', true, 'este C é diferente do C do teorema CAP.'),
          opc('b', 'Que o aplicativo nunca lê dado antigo', false, 'isso é isolamento.'),
          opc('c', 'Que todas as réplicas estejam iguais', false, 'esse é o C do CAP, outra coisa.')] }
    ],
    abas: [
      { rotulo: 'ACID, anomalias e isolamento', blocos: [
        { tipo: 'texto', html:
          '<h3>O que a transação promete</h3>' +
          '<p>Com um único usuário, uma consulta lê e escreve sem surpresa. Com dois, cada instrução correta isoladamente pode produzir um estado impossível: estoque negativo, saldo duplicado, plantão vazio, pedido cobrado duas vezes. Esses bugs só aparecem sob concorrência, não repetem em teste, somem quando você olha e custam dinheiro. A transação é a abstração do banco para raciocinar sobre isso. O M02A (bloco 5) retoma o tema em nível de arquitetura: fronteiras transacionais, sagas e consistência entre serviços. Aqui você fica com o mecanismo dentro de um banco.</p>' +
          '<h3>ACID, letra por letra</h3>' },
        { tipo: 'abas', rotulo: 'ACID', itens: [
          { rotulo: 'Atomicidade', blocos: [{ tipo: 'texto', html: '<p>Todas as operações da transação acontecem ou nenhuma. Se a instrução 3 de 5 falha, as duas primeiras são desfeitas (<code>ROLLBACK</code>). É implementada por log de desfazer/refazer (<em>write-ahead log</em>). No lab, <code>checkout</code> insere o empréstimo e decrementa o estoque; se não há cópia, a exceção <code>OutOfStock</code> desfaz o <code>INSERT</code> também (teste <code>test_checkout_without_stock_rolls_back_the_loan</code>).</p>' }] },
          { rotulo: 'Consistência', blocos: [{ tipo: 'texto', html: '<p>A transação leva o banco de um estado válido a outro, <em>segundo as restrições declaradas</em>. O banco garante o que você declarou (<code>CHECK</code>, <code>FOREIGN KEY</code>, <code>UNIQUE</code>); invariantes que só existem na sua cabeça ("pelo menos um médico de plantão") são problema seu. Este "C" é diferente do "C" do teorema CAP.</p>' }] },
          { rotulo: 'Isolamento', blocos: [{ tipo: 'texto', html: '<p>Transações concorrentes não enxergam os estados intermediários umas das outras, ao grau definido pelo nível de isolamento. É a propriedade negociável, e quase todo o resto do bloco trata dela.</p>' }] },
          { rotulo: 'Durabilidade', blocos: [{ tipo: 'texto', html: '<p>Depois do <code>COMMIT</code> confirmado, o dado sobrevive a falha do processo e queda de energia. Implementada por gravar o log em disco (<code>fsync</code>) antes de confirmar. Desligar isso (<code>synchronous_commit = off</code> no PostgreSQL, <code>PRAGMA synchronous = OFF</code> no SQLite) troca durabilidade por velocidade, com risco explícito de perder as últimas transações.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<p>Duas ressalvas operacionais. DDL é transacional no PostgreSQL e no SQLite (uma migration que falha no meio desfaz tudo) e <em>não</em> no MySQL (cada <code>ALTER</code> confirma implicitamente). E "autocommit" significa que cada instrução é sua própria transação: duas instruções relacionadas em autocommit <em>não são atômicas</em>. O módulo abre a conexão com <code>autocommit=True</code> (Python 3.12+) e abre transações explícitas com <code>BEGIN</code>/<code>COMMIT</code>, em vez de depender do comportamento legado do <code>sqlite3</code> de abrir transações implicitamente antes de <code>INSERT/UPDATE/DELETE</code>.</p>' +
          '<h3>Anomalias de concorrência</h3>' +
          '<p>Isolamento total (serializável) significa que o resultado equivale a executar as transações uma após a outra, em alguma ordem. Níveis mais fracos permitem anomalias, e cada uma é um bug que você aceita ou precisa evitar à mão.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Anomalia</th><th>O que acontece</th><th>Exemplo</th></tr></thead><tbody>' +
          '<tr><td><strong>Leitura suja</strong> (dirty read)</td><td>Lê dado não confirmado de outra transação, que depois sofre rollback.</td><td>Mostra saldo de um depósito que foi desfeito.</td></tr>' +
          '<tr><td><strong>Leitura não repetível</strong></td><td>Lê a mesma linha duas vezes na transação e obtém valores diferentes (outra confirmou entre as leituras).</td><td>Relatório de duas somas que não batem.</td></tr>' +
          '<tr><td><strong>Fantasma</strong> (phantom)</td><td>Repete uma consulta por predicado e aparecem linhas novas ou sumidas.</td><td><code>COUNT(*)</code> muda dentro da transação.</td></tr>' +
          '<tr><td><strong>Lost update</strong></td><td>Duas transações leem, calculam e gravam; a segunda sobrescreve a primeira.</td><td>Dois checkouts leem <code>copies = 3</code> e gravam 2.</td></tr>' +
          '<tr><td><strong>Write skew</strong></td><td>Duas transações leem um conjunto sobreposto, cada uma grava em linhas <em>diferentes</em>; cada uma é válida sozinha, a soma viola a invariante.</td><td>Dois médicos saem de plantão, ficando zero.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p>O padrão SQL define os níveis pelas três primeiras anomalias. É uma definição incompleta (lost update e write skew não estão lá), e as implementações divergem: o nome do nível não garante o comportamento entre bancos.</p>' },
        { tipo: 'abas', rotulo: 'Níveis por banco', itens: [
          { rotulo: 'READ UNCOMMITTED', blocos: [{ tipo: 'texto', html: '<ul><li><strong>PostgreSQL:</strong> comporta-se como <code>READ COMMITTED</code> (nunca há leitura suja).</li><li><strong>MySQL/InnoDB:</strong> permite leitura suja.</li><li><strong>SQLite:</strong> só com cache compartilhado e o pragma <code>read_uncommitted</code>; raramente usado.</li></ul>' }] },
          { rotulo: 'READ COMMITTED', blocos: [{ tipo: 'texto', html: '<ul><li><strong>PostgreSQL:</strong> <strong>padrão</strong>. Cada <em>instrução</em> vê um snapshot dos dados confirmados até o início dessa instrução. Permite não repetível e fantasma, lost update (no read-modify-write do aplicativo) e write skew.</li><li><strong>MySQL/InnoDB:</strong> disponível.</li><li><strong>SQLite:</strong> não se aplica.</li></ul>' }] },
          { rotulo: 'REPEATABLE READ', blocos: [{ tipo: 'texto', html: '<ul><li><strong>PostgreSQL:</strong> snapshot único por <em>transação</em> (isolamento por snapshot). Sem não repetível, <strong>sem fantasma</strong>; um <code>UPDATE</code> em linha alterada por outra transação aborta (40001). <strong>Write skew continua possível.</strong></li><li><strong>MySQL/InnoDB:</strong> <strong>padrão</strong>. Leituras consistentes por snapshot; <code>locking reads</code> usam <em>gap locks</em>.</li><li><strong>SQLite:</strong> não se aplica.</li></ul>' }] },
          { rotulo: 'SERIALIZABLE', blocos: [{ tipo: 'texto', html: '<ul><li><strong>PostgreSQL:</strong> Serializable Snapshot Isolation (SSI): detecta dependências perigosas e aborta uma transação (40001). Exige <strong>retry</strong>.</li><li><strong>MySQL/InnoDB:</strong> transforma leituras em leituras com lock compartilhado.</li><li><strong>SQLite:</strong> efetivamente o único modo: um escritor por vez no banco todo.</li></ul>' }] }
        ] },
        { tipo: 'escolha', id: 'f05b5-escolha-niveis', titulo: 'Confira: o nível do PostgreSQL', obrigatorio: false,
          pergunta: 'No PostgreSQL, qual anomalia continua possível em <code>REPEATABLE READ</code>?',
          opcoes: [
            { id: 'a', texto: 'Leitura suja.', correta: false, porque: 'o PostgreSQL nunca permite leitura suja.' },
            { id: 'b', texto: 'Fantasma.', correta: false, porque: 'no PostgreSQL o REPEATABLE READ é snapshot por transação e impede o fantasma (o padrão SQL permitiria).' },
            { id: 'c', texto: 'Write skew.', correta: true, porque: 'linhas diferentes escritas, sem conflito de escrita detectável pelo snapshot. Só SERIALIZABLE (ou lock do conjunto lido) impede.' }
          ], tutorDepois: 'Nome do nível não garante comportamento entre bancos.' },
        { tipo: 'takeaway', html: 'Atomicidade e durabilidade vêm do log; consistência é o que você <mark>declarou</mark>; o <mark>isolamento</mark> é negociável e o padrão do PostgreSQL admite lost update e write skew.' }
      ] },

      { rotulo: 'MVCC, lost update e write skew', blocos: [
        { tipo: 'texto', html:
          '<h3>MVCC, conceitualmente</h3>' +
          '<p><em>Multi-Version Concurrency Control</em> é a razão de leitores não bloquearem escritores no PostgreSQL, no Oracle e no InnoDB. Em vez de modificar uma linha no lugar, o <code>UPDATE</code> cria uma <strong>nova versão</strong> e marca a antiga como substituída. No PostgreSQL, cada versão carrega <code>xmin</code> (transação que a criou) e <code>xmax</code> (a que a removeu ou substituiu); cada transação enxerga o snapshot de "quais transações já tinham confirmado quando comecei" e escolhe, por linha, a versão visível.</p>' +
          '<ul><li>Leitura não bloqueia escrita e escrita não bloqueia leitura. <strong>Escrita bloqueia escrita</strong> na mesma linha: o segundo <code>UPDATE</code> espera o primeiro confirmar ou desfazer.</li>' +
          '<li>Versões antigas acumulam; o <code>VACUUM</code> as remove. Uma transação aberta por horas (ou "idle in transaction") segura o horizonte do snapshot e impede a limpeza: a tabela incha (<em>bloat</em>) e tudo fica lento. <strong>Transação curta é requisito operacional</strong>: nunca deixe uma aberta enquanto chama uma API externa ou espera o usuário.</li>' +
          '<li>O InnoDB guarda a versão antiga num <em>undo log</em>; o PostgreSQL, na própria tabela. O efeito conceitual é o mesmo, o custo operacional não.</li></ul>' +
          '<p>O SQLite no modo WAL oferece um modelo parecido: leitores enxergam um snapshot fixado ao início da leitura e não bloqueiam o escritor, mas só existe <strong>um escritor por vez</strong> no arquivo inteiro. Preveja o que o lab mostra.</p>' },
        { tipo: 'rode', id: 'f05b5-rode', titulo: 'Snapshot, lost update e write skew', enunciado: 'Rode a demonstração de concorrência do lab. A barra mostra o valor final observado em cada etapa.',
          prefixo: '$', entrada: 'uv run python -m sqllab.cli concurrency', unidade: 'linhas/cópias', terminalTitulo: 'sqllab', etapas: etapasConcorrencia(),
          prever: { pergunta: 'O leitor abre uma transação e conta 1 livro. Outra conexão insere um segundo livro e confirma. O leitor, ainda na mesma transação, conta de novo. Quanto vê?', opcoes: [
            { id: 'a', texto: '2: o dado confirmado aparece na hora.', correta: false, porque: 'o snapshot do leitor foi fixado ao início da leitura.' },
            { id: 'b', texto: '1: continua no seu snapshot; só vê 2 depois do seu próprio COMMIT.', correta: true, porque: 'leitores não bloqueiam o escritor e enxergam uma foto estável.' },
            { id: 'c', texto: 'Erro: o banco bloqueia.', correta: false, porque: 'em WAL o leitor não bloqueia o escritor.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em cada etapa. Na terceira, repare no que o SQLite faz no lugar do PostgreSQL.',
          tutorDepois: 'Snapshot estável para o leitor, lost update real no read-modify-write e, no write skew, o SQLite recusa o segundo escritor porque serializa escritores. Não conclua que write skew não acontece: no PostgreSQL em REPEATABLE READ as duas confirmam e sobra zero. O lab não consegue reproduzir isso sem um servidor.',
          callout: 'Você viu o snapshot do leitor, o estoque perdido e a ressalva sobre o SQLite.' },
        { tipo: 'texto', html:
          '<h3>Lost update: a anomalia cotidiana</h3>' +
          '<p>O padrão mais comum de bug transacional é ler no aplicativo, calcular e gravar de volta. Duas retiradas de um estoque de 3 deveriam deixar 1; o read-modify-write deixa 2.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '# ERRADO: duas requisições leem 3, ambas gravam 2\n' +
          'copies = db.execute("SELECT copies FROM book WHERE id = 1").fetchone()[0]\n' +
          'db.execute("UPDATE book SET copies = ? WHERE id = 1", (copies - 1,))' },
        { tipo: 'texto', html:
          '<p>Honestidade sobre o laboratório: o SQLite não tem como "fazer" o lost update acontecer em isolamento <em>serializável</em> porque a unidade de bloqueio é o banco todo. O demo intercala duas conexões em autocommit, ou seja, sem transação envolvendo a leitura e a escrita, que é exatamente como o bug nasce em aplicações reais. As defesas, da mais simples à mais pesada:</p>' },
        { tipo: 'abas', rotulo: 'Escada de defesas', itens: [
          { rotulo: '1 · Expressão atômica', blocos: [{ tipo: 'texto', html: '<p>Empurre a conta para o banco: <code>UPDATE book SET copies = copies - 1 WHERE id = ? AND copies &gt; 0</code>. A instrução é atômica por linha (o segundo <code>UPDATE</code> espera o primeiro e reavalia a condição). Confira <code>rowcount</code>: zero linhas afetadas significa "sem estoque". É a solução do <code>checkout</code> do lab. Quando a regra cabe numa expressão, esta é a melhor.</p>' }] },
          { rotulo: '2 · Lock pessimista', blocos: [{ tipo: 'texto', html: '<p><code>SELECT ... FOR UPDATE</code> bloqueia as linhas lidas até o fim da transação; os concorrentes esperam. Variantes: <code>NOWAIT</code> (erro imediato) e <code>SKIP LOCKED</code> (pula linhas travadas: ótimo para filas de trabalho no banco, em que cada worker pega uma tarefa diferente).</p>' }] },
          { rotulo: '3 · Lock otimista', blocos: [{ tipo: 'texto', html: '<p>Coluna <code>version</code>; <code>UPDATE ... SET ..., version = version + 1 WHERE id = ? AND version = ?</code> e <code>rowcount = 0</code> significa "alguém mudou antes de você": releia e tente de novo (ou mostre o conflito ao usuário). Bom quando conflitos são raros e a "transação" atravessa a interação humana: a tela de edição ficou aberta dez minutos e você não segura lock por isso.</p>' }] },
          { rotulo: '4 · Isolamento + retry', blocos: [{ tipo: 'texto', html: '<p><code>REPEATABLE READ</code> faz o PostgreSQL abortar o segundo <code>UPDATE</code> de uma linha alterada concorrentemente (erro 40001); o aplicativo repete a transação inteira.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Write skew: o que o snapshot não pega</h3>' +
          '<p>Regra de negócio: sempre pelo menos um médico de plantão. Duas transações, cada uma lê "2 de plantão" e tira um médico <em>diferente</em>. As escritas não colidem (linhas distintas), então nenhum lock de linha as serializa: ambas confirmam e o resultado, em snapshot isolation, é 0 médicos de plantão. Cada transação, sozinha, estava correta. A invariante "≥ 1 de plantão" vive só na cabeça do programador.</p>' +
          '<p><strong>Defesas:</strong></p>' +
          '<ol><li><code>SERIALIZABLE</code> (PostgreSQL SSI) com retry.</li>' +
          '<li>Bloquear o <em>conjunto lido</em>: <code>SELECT ... FROM doctor WHERE on_call = 1 FOR UPDATE</code> trava as linhas que formam a invariante e serializa as duas transações.</li>' +
          '<li>Materializar o conflito: uma linha única "escala do dia" que ambas atualizam, e então o conflito escrita-escrita aparece.</li>' +
          '<li>Restrição declarativa, quando possível (constraint de exclusão, <code>CHECK</code> em tabela agregadora, índice único parcial).</li></ol>' +
          '<p><strong>O que o SQLite faz no lugar</strong>, demonstrado pelo lab: as duas conexões leem 2 de plantão, T1 remove a Ana e confirma; T2, com snapshot agora obsoleto, tenta remover a Bia e é recusada, porque num banco de um escritor só a conexão cujo snapshot ficou velho não consegue passar a escrever. A segunda linha do resultado mostra a outra face: com <code>BEGIN IMMEDIATE</code>, o segundo escritor é recusado já no início da transação, não no <code>COMMIT</code>. Em aplicativos, trate esse erro como "ocupado" e use <code>timeout</code> (espera) e retry.</p>' },
        { tipo: 'takeaway', html: 'Para cada leitura que fundamenta uma escrita, pergunte o que impede alguém de mudá-la entre as duas instruções: a resposta é um <mark>mecanismo concreto</mark>, nunca "é improvável".' }
      ] },

      { rotulo: 'Locks, deadlock e checkout', blocos: [
        { tipo: 'texto', html:
          '<h3>Locks, deadlock e retry</h3>' +
          '<p>Tipos que você precisa distinguir: lock de <em>linha</em> (<code>FOR UPDATE</code>, <code>UPDATE</code>), de <em>tabela</em> (DDL, <code>LOCK TABLE</code>), <em>advisory</em> (PostgreSQL: lock cooperativo por número, útil para "só um job por vez") e, no InnoDB, de <em>intervalo</em>. Locks são retidos até o fim da transação, e é por isso que transação longa é perigosa.</p>' +
          '<p><strong>Deadlock:</strong> T1 trava a linha A e pede a B; T2 travou B e pede A; ninguém avança. O PostgreSQL detecta o ciclo (após <code>deadlock_timeout</code>, 1 s por padrão), aborta uma delas com <code>40P01</code> e deixa a outra seguir.</p>' +
          '<ul><li><strong>Ordem global de aquisição:</strong> sempre travar recursos na mesma ordem (por <code>id</code> crescente). Uma transferência A→B e outra B→A devem ordenar as duas contas antes de travar.</li>' +
          '<li><strong>Transações curtas e com poucas linhas:</strong> toque o mínimo possível.</li>' +
          '<li><strong>Retry com a transação inteira:</strong> <code>40001</code> (serialização) e <code>40P01</code> (deadlock) são falhas esperadas, não bugs. O aplicativo repete a transação <em>inteira</em> (inclusive as leituras), com limite de tentativas e <em>backoff</em> com jitter, e as operações dentro dela devem ser seguras para repetir: nada de enviar e-mail antes do <code>COMMIT</code> (veja outbox no M02A).</li></ul>' +
          '<h3>Exemplo trabalhado: o checkout do lab</h3>' },
        { tipo: 'codigo', linguagem: 'python', texto: CHECKOUT },
        { tipo: 'texto', html:
          '<p>Quatro decisões, todas deste bloco:</p>' +
          '<ol><li><strong>Atomicidade:</strong> empréstimo e estoque juntos.</li>' +
          '<li><strong>Decremento atômico no banco:</strong> sem lost update.</li>' +
          '<li><strong>Verificação por <code>rowcount</code>.</strong></li>' +
          '<li><strong><code>BEGIN IMMEDIATE</code></strong> para pegar o lock de escrita no início. No PostgreSQL o equivalente é deixar o <code>UPDATE</code> fazer o trabalho; não há "immediate".</li></ol>' +
          '<p>Defesa em profundidade: se alguém remover o <code>AND copies &gt; 0</code>, o <code>CHECK (copies &gt;= 0)</code> do esquema ainda barra o estoque negativo, e o teste continua falhando (você fará essa mutação no laboratório).</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: achar que "usar transação" resolve concorrência', html:
          '<p>Uma transação em <code>READ COMMITTED</code> (o padrão do PostgreSQL) que faz <code>SELECT</code>, decide no aplicativo e faz <code>UPDATE</code> continua com lost update e write skew: a transação garante atomicidade, não que o que você <em>leu</em> continue verdadeiro quando você escrever. A resposta para "o que impede alguém de mudar isso entre as duas instruções?" tem de ser um mecanismo concreto (expressão atômica, <code>FOR UPDATE</code>, versão, <code>SERIALIZABLE</code> com retry, restrição).</p>' },
        { tipo: 'takeaway', html: 'Deadlock se previne com <mark>ordem global de locks</mark>; 40001 e 40P01 pedem <mark>retry da transação inteira</mark>, com operações seguras para repetir.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'f05b5-python-lost', titulo: 'Troque o read-modify-write por UPDATE atômico', obrigatorio: false,
          enunciado: '<code>rmw_intercalado(banco)</code> reproduz o bug: duas requisições leem antes de gravar e o estoque 3 termina em 2. Complete <code>update_atomico(banco)</code>, que se comporta como <code>UPDATE book SET copies = copies - 1 WHERE copies &gt; 0</code>: decrementa se houver estoque e devolve o <code>rowcount</code> (1 ou 0).',
          codigo: BANCO + 'def update_atomico(banco):\n    """UPDATE book SET copies = copies - 1 WHERE copies > 0. Devolve o rowcount."""\n    # só decrementa quando copies > 0; devolva 1 se alterou, 0 se não\n    return 0\n\n\nprint(rmw_intercalado(Banco(3)))\n',
          testes: 'def test_o_bug_existe():\n    assert rmw_intercalado(Banco(3)) == 2\n\n\ndef test_duas_retiradas_atomicas():\n    b = Banco(3)\n    assert update_atomico(b) == 1\n    assert update_atomico(b) == 1\n    assert b.copies == 1\n\n\ndef test_borda_sem_estoque_nao_vai_a_negativo():\n    b = Banco(0)\n    assert update_atomico(b) == 0\n    assert b.copies == 0\n\n\ndef test_ultima_copia():\n    b = Banco(1)\n    assert [update_atomico(b), update_atomico(b)] == [1, 0]\n    assert b.copies == 0\n',
          dica: 'Se <code>banco.copies &gt; 0</code>: <code>banco.copies -= 1</code> e <code>return 1</code>. Senão <code>return 0</code>.',
          solucao: BANCO + 'def update_atomico(banco):\n    if banco.copies > 0:\n        banco.copies -= 1\n        return 1\n    return 0\n',
          tutorDepois: 'O rowcount 0 é o sinal de "sem estoque", como no checkout do lab. Na vida real a atomicidade vem do banco; aqui você viu a semântica.',
          callout: 'Duas retiradas, estoque 1, e a última cópia não vai a negativo.' },
        { tipo: 'python', id: 'f05b5-python-retry', titulo: 'Retry da transação inteira', obrigatorio: false,
          enunciado: 'Complete <code>com_retry(operacao, max_tentativas, dormir)</code>: executa <code>operacao()</code> e, se levantar <code>ErroRetentavel</code> (40001 ou 40P01), espera e repete a operação inteira, até <code>max_tentativas</code>; na última tentativa deixa o erro subir. Outros erros não são repetidos. O backoff é <code>dormir(0.05 * 2 ** (tentativa - 1))</code> (sem jitter, para ser testável).',
          codigo: 'class ErroRetentavel(Exception):\n    """40001 (serialização) ou 40P01 (deadlock)."""\n\n\ndef com_retry(operacao, max_tentativas=3, dormir=lambda s: None):\n    for tentativa in range(1, max_tentativas + 1):\n        try:\n            return operacao()\n        except ErroRetentavel:\n            # na última tentativa, deixe o erro subir; senão espere e repita\n            pass\n\n\nprint(com_retry(lambda: "ok"))\n',
          testes: 'def fabrica(falhas):\n    estado = {"chamadas": 0}\n\n    def operacao():\n        estado["chamadas"] += 1\n        if estado["chamadas"] <= falhas:\n            raise ErroRetentavel("40001")\n        return "ok"\n\n    return operacao, estado\n\n\ndef test_sucesso_depois_de_duas_falhas():\n    op, st = fabrica(2)\n    esperas = []\n    assert com_retry(op, 3, esperas.append) == "ok"\n    assert st["chamadas"] == 3\n    assert esperas == [0.05, 0.1]\n\n\ndef test_desiste_na_ultima_tentativa():\n    op, st = fabrica(10)\n    try:\n        com_retry(op, 3)\n        assert False, "deveria levantar"\n    except ErroRetentavel:\n        pass\n    assert st["chamadas"] == 3\n\n\ndef test_sem_falha_chama_uma_vez():\n    op, st = fabrica(0)\n    assert com_retry(op) == "ok"\n    assert st["chamadas"] == 1\n\n\ndef test_controle_negativo_outros_erros_nao_sao_repetidos():\n    estado = {"n": 0}\n\n    def ruim():\n        estado["n"] += 1\n        raise ValueError("bug")\n\n    try:\n        com_retry(ruim, 3)\n    except ValueError:\n        pass\n    assert estado["n"] == 1\n',
          dica: 'No <code>except</code>: <code>if tentativa == max_tentativas: raise</code>; depois <code>dormir(0.05 * 2 ** (tentativa - 1))</code>.',
          solucao: 'class ErroRetentavel(Exception):\n    """40001 (serialização) ou 40P01 (deadlock)."""\n\n\ndef com_retry(operacao, max_tentativas=3, dormir=lambda s: None):\n    for tentativa in range(1, max_tentativas + 1):\n        try:\n            return operacao()\n        except ErroRetentavel:\n            if tentativa == max_tentativas:\n                raise\n            dormir(0.05 * 2 ** (tentativa - 1))\n',
          tutorDepois: 'A operação repetida é a transação inteira, leituras incluídas. Em produção acrescente jitter ao backoff e garanta que nada com efeito externo aconteça antes do COMMIT.',
          callout: 'Falha esperada tratada com retry limitado; bug real não é repetido.' },
        { tipo: 'cenario', id: 'f05b5-cenario', titulo: 'Escolha a defesa certa', obrigatorio: false,
          enunciado: 'O endpoint de retirada faz <code>SELECT copies</code>, valida em Python e faz <code>UPDATE copies = :novo</code>. Sob carga, o estoque fica errado. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Qual é o diagnóstico e o primeiro passo?', opcoes: [
              { texto: 'Lost update. Perguntar se a regra cabe numa expressão atômica (copies = copies - 1 WHERE copies > 0).', vai: 'expr', tom: 'ok', consequencia: 'a defesa mais simples é empurrar a conta para o banco.' },
              { texto: 'Basta envolver tudo em BEGIN ... COMMIT.', vai: 'f-transacao', tom: 'ruim', consequencia: 'em READ COMMITTED a transação garante atomicidade, não que o que você leu continue verdadeiro.' },
              { texto: 'Subir o sistema todo para SERIALIZABLE.', vai: 'f-ser', tom: 'ruim', consequencia: 'funciona por construção, mas gera abortos em todo ponto de entrada e a vazão cai sob contenção; não é o primeiro degrau.' }
            ] },
            expr: { texto: 'A nova regra exige conferir uma invariante sobre várias linhas (pelo menos um médico de plantão). A expressão atômica não cabe. O que usar?', opcoes: [
              { texto: 'SERIALIZABLE com retry em 40001, ou FOR UPDATE no conjunto lido, ou materializar o conflito em uma linha.', vai: 'f-bom', tom: 'ok', consequencia: 'cada uma torna o conflito visível; o aplicativo trata o 40001 repetindo a transação inteira.' },
              { texto: 'REPEATABLE READ no PostgreSQL: o snapshot protege.', vai: 'f-skew', tom: 'ruim', consequencia: 'write skew: linhas diferentes escritas, nenhum conflito detectado, plantão vazio.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Degrau mais barato que resolve em cada caso: expressão atômica onde cabe, serializável ou lock do conjunto onde a invariante é complexa.' },
            'f-transacao': { bom: false, texto: 'O estoque continuou errado sob carga: a transação não mudou o que foi lido.' },
            'f-ser': { bom: false, texto: 'Correto, porém caro: abortos por toda parte e a vazão caiu.' },
            'f-skew': { bom: false, texto: 'A noite terminou com zero médicos de plantão e nenhum erro nos logs.' }
          },
          callout: 'Você escolheu o degrau mais barato da escada que resolve cada caso.' },
        { tipo: 'escolha', id: 'f05b5-escolha-saldo', titulo: 'Confira: saldo 110 e 120',
          pergunta: 'Duas requisições leem <code>saldo = 100</code>, calculam no código e gravam 110 e 120. No <code>READ COMMITTED</code> o saldo final é 120. Qual é a defesa mais simples?',
          opcoes: [
            { id: 'a', texto: 'Subir direto para <code>SERIALIZABLE</code> em todo o sistema e esquecer o assunto.', correta: false, porque: 'caro e exige retry em todo ponto de entrada.' },
            { id: 'b', texto: 'Trocar o read-modify-write por uma expressão atômica: <code>UPDATE conta SET saldo = saldo + 10 WHERE id = 1</code>.', correta: true, porque: 'a escada vai do mais simples ao mais pesado: expressão atômica, restrição declarativa, FOR UPDATE, versão otimista, SERIALIZABLE com retry.' },
            { id: 'c', texto: 'Adicionar <code>sleep</code> entre a leitura e a escrita.', correta: false, porque: 'sleep só desloca a janela da corrida.' },
            { id: 'd', texto: 'Colocar um <code>COMMIT</code> logo após o <code>SELECT</code>.', correta: false, porque: 'isso encerra a transação sem proteger a escrita.' }
          ], tutorDepois: 'Comece pelo degrau mais barato que resolve.' },
        { tipo: 'escolha', id: 'f05b5-escolha-skew', titulo: 'Confira: plantão vazio',
          pergunta: 'Duas transações checam "há pelo menos 2 médicos de plantão?" e cada uma tira um médico diferente. Em <code>REPEATABLE READ</code> (snapshot) as duas confirmam e sobra zero. Que anomalia é e o que a impede?',
          opcoes: [
            { id: 'a', texto: 'Write skew; <code>SERIALIZABLE</code> (com retry em <code>40001</code>), ou um lock sobre o conjunto lido, a impede.', correta: true, porque: 'as escritas são em linhas diferentes, então o snapshot não vê conflito. Quando o banco devolve 40001, a transação inteira deve ser repetida.' },
            { id: 'b', texto: 'Dirty read; basta usar <code>READ COMMITTED</code>.', correta: false, porque: 'ninguém leu dado não confirmado.' },
            { id: 'c', texto: 'Deadlock; o banco aborta uma transação e o problema some.', correta: false, porque: 'não há espera em ciclo.' },
            { id: 'd', texto: 'Lost update; o snapshot sempre detecta escrita na mesma linha.', correta: false, porque: 'aqui as linhas são diferentes.' }
          ], tutorDepois: 'Invariante sobre um conjunto lido pede serializável ou lock do conjunto.' },
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs e erros comuns', html:
          '<ul><li><strong><code>SERIALIZABLE</code> em tudo:</strong> correto por construção, mas gera abortos que precisam de retry em todo ponto de entrada, e sob contenção a vazão cai. Use onde a invariante é complexa; use expressões atômicas e restrições onde der.</li>' +
          '<li><strong>Retry sem idempotência:</strong> repetir uma transação que já tinha efeito externo (cobrança, e-mail) duplica o efeito.</li>' +
          '<li><strong>Transação aberta ao redor de I/O externo</strong> (chamada de LLM, HTTP): segura locks e snapshot por segundos; sob carga, esgota conexões do pool.</li>' +
          '<li><strong>Engolir a exceção de transação</strong> e continuar: no PostgreSQL, após um erro a transação fica <em>abortada</em> e rejeita toda instrução até o <code>ROLLBACK</code> (ou <code>ROLLBACK TO SAVEPOINT</code>).</li>' +
          '<li><strong>Misturar o nível de isolamento de teste e produção:</strong> o SQLite em teste esconde lost update e write skew que o PostgreSQL permite. Testes de concorrência valem contra o banco real (M03, bloco 6).</li></ul>' },
        { tipo: 'takeaway', html: 'Defenda-se do degrau mais barato ao mais caro: <mark>expressão atômica</mark>, restrição, <mark>lock</mark>, versão, <mark>SERIALIZABLE com retry</mark>.' }
      ] }
    ]
  });
})();
