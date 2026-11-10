/* F01 · Bloco 3: Git por dentro. Fonte: F01.html#b03. Saídas: execução real de 11/10/2026 com Git 2.34.1 (fonte); hashes dependem de autor e relógio fixados no laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function py(linhas) { return linhas.join('\n') + '\n'; }

  var H = '9c07bea4318031a0450fd0e7eb55acde9f12fede';

  var etapasObjetos = function () {
    return [
      { id: 'hash', nome: 'Hash de conteúdo', descricao: 'SHA-1 de "blob 10\\0conteúdo"', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'printf "olá, git\\n" | git hash-object --stdin'),
        L('out', H),
        L('cmd', 'printf "blob 10\\0olá, git\\n" | sha1sum'),
        L('out', H + '  -'),
        L('hint', 'sem mágica: o cabeçalho é "tipo tamanho\\0"; nome de arquivo não entra no hash')] },
      { id: 'add', nome: 'git add', descricao: 'Grava o blob e a entrada do índice', tom: 'tcp', ms: 1, linhas: [
        L('cmd', 'find .git/objects -type f'),
        L('out', '.git/objects/9c/07bea4318031a0450fd0e7eb55acde9f12fede'),
        L('cmd', 'git ls-files -s; git log 2>&1 | head -1'),
        L('out', '100644 ' + H + ' 0\ta.txt'),
        L('out', "fatal: your current branch 'main' does not have any commits yet"),
        L('hint', 'só o blob e o índice existem: nenhuma tree e nenhum commit ainda')] },
      { id: 'commit', nome: 'git commit', descricao: 'O commit aponta para uma tree', tom: 'tls', ms: 1, linhas: [
        L('cmd', 'git cat-file -p HEAD'),
        L('out', 'tree c113a9c706cf719ef32284642e0b6231ff5f0fab'),
        L('out', 'author Ada Lovelace <ada@example.com> 1767268920 +0000'),
        L('out', 'committer Ada Lovelace <ada@example.com> 1767268920 +0000'),
        L('out', 'primeiro'),
        L('hint', 'o commit não menciona arquivo nenhum: aponta para a tree raiz')] },
      { id: 'tree', nome: 'A tree', descricao: 'Nomes, modos e hashes', tom: 'request', ms: 1, linhas: [
        L('cmd', 'git cat-file -p HEAD^{tree}'),
        L('out', '100644 blob ' + H + '\ta.txt'),
        L('out', '100644 blob ' + H + '\tb.txt'),
        L('out', '040000 tree 50e024742aaa4cdeb6f960c9be8586abe92aee3c\tlib'),
        L('hint', 'a.txt e b.txt têm o mesmo conteúdo, logo o mesmo blob: o nome vive na tree, não no blob. lib é uma tree própria')] },
      { id: 'snap', nome: 'Segundo commit', descricao: 'Só lib/m.py mudou', tom: 'response', ms: 1, linhas: [
        L('cmd', 'git ls-tree -r HEAD; echo; git ls-tree -r HEAD~1'),
        L('out', '100644 blob ' + H + '\ta.txt'),
        L('out', '100644 blob ' + H + '\tb.txt'),
        L('out', '100644 blob 407de3068e7b5950585d5abed9776d104235a85d\tlib/m.py'),
        L('out', ''),
        L('out', '100644 blob ' + H + '\ta.txt'),
        L('out', '100644 blob ' + H + '\tb.txt'),
        L('out', '100644 blob 7d4290a117a4ddcc11daae7ea675841033830c8f\tlib/m.py'),
        L('hint', 'três nomes de arquivo com o mesmo blob nos dois commits; só m.py ganhou blob novo (407de30), e por consequência a tree lib e a tree raiz também')] }
    ];
  };

  var codigoBlob = py([
    'import hashlib',
    '',
    '',
    'def hash_blob(conteudo):',
    '    """conteudo: bytes. Devolve o SHA-1 (40 hex) que o Git daria ao blob."""',
    '    cabecalho = b""   # monte b"blob <tamanho em BYTES>\\0"',
    '    return hashlib.sha1(cabecalho + conteudo).hexdigest()',
    '',
    '',
    'print(hash_blob("olá, git\\n".encode("utf-8")))'
  ]);
  var testesBlob = py([
    'def test_blob_do_modulo():',
    '    assert hash_blob("olá, git\\n".encode("utf-8")) == "' + H + '"',
    '',
    'def test_borda_arquivo_vazio():',
    '    assert hash_blob(b"") == "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"',
    '',
    'def test_mesmo_conteudo_mesma_chave():',
    '    assert hash_blob(b"x\\n") == hash_blob(b"x\\n")',
    '',
    'def test_controle_negativo_um_byte_muda_tudo():',
    '    assert hash_blob(b"x\\n") != hash_blob(b"y\\n")',
    '',
    'def test_tamanho_conta_bytes_nao_caracteres():',
    '    # "é" ocupa 2 bytes em UTF-8: o cabeçalho de "é" é "blob 2"',
    '    import hashlib',
    '    esperado = hashlib.sha1(b"blob 2\\0" + "é".encode("utf-8")).hexdigest()',
    '    assert hash_blob("é".encode("utf-8")) == esperado'
  ]);
  var solucaoBlob = py([
    'import hashlib',
    '',
    '',
    'def hash_blob(conteudo):',
    '    cabecalho = b"blob " + str(len(conteudo)).encode() + b"\\0"',
    '    return hashlib.sha1(cabecalho + conteudo).hexdigest()'
  ]);

  var codigoRepo = py([
    'class Repo:',
    '    def __init__(self):',
    '        self.trabalho = {}   # diretório de trabalho: nome -> conteúdo',
    '        self.indice = {}     # índice (staging): nome -> conteúdo no momento do add',
    '        self.commits = []    # cada commit é um snapshot completo (dict)',
    '',
    '    def editar(self, nome, texto):',
    '        self.trabalho[nome] = texto',
    '',
    '    def add(self, nome):',
    '        self.indice[nome] = self.trabalho[nome]',
    '',
    '    def commit(self):',
    '        # o commit é feito a partir do ÍNDICE, e guarda uma cópia',
    '        self.commits.append(dict(self.trabalho))',
    '',
    '    def nao_preparado(self):',
    '        """Nomes cujo conteúdo no trabalho difere do índice."""',
    '        return [n for n in self.trabalho if self.indice.get(n) != self.trabalho[n]]',
    '',
    '',
    'r = Repo()',
    'r.editar("a.txt", "v2"); r.add("a.txt"); r.editar("a.txt", "v3"); r.commit()',
    'print(r.commits[-1], r.nao_preparado())'
  ]);
  var testesRepo = py([
    'def test_commit_leva_o_que_foi_adicionado():',
    '    r = Repo()',
    '    r.editar("a.txt", "v2"); r.add("a.txt"); r.editar("a.txt", "v3"); r.commit()',
    '    assert r.commits[-1] == {"a.txt": "v2"}',
    '',
    'def test_v3_sobra_como_nao_preparado():',
    '    r = Repo()',
    '    r.editar("a.txt", "v2"); r.add("a.txt"); r.editar("a.txt", "v3"); r.commit()',
    '    assert r.nao_preparado() == ["a.txt"]',
    '',
    'def test_arquivo_editado_e_nunca_adicionado_nao_entra():',
    '    r = Repo()',
    '    r.editar("a.txt", "1"); r.add("a.txt")',
    '    r.editar("b.txt", "2")',
    '    r.commit()',
    '    assert "b.txt" not in r.commits[-1]',
    '',
    'def test_commit_e_snapshot_independente_do_indice():',
    '    r = Repo()',
    '    r.editar("a.txt", "1"); r.add("a.txt"); r.commit()',
    '    r.editar("a.txt", "2"); r.add("a.txt")',
    '    assert r.commits[-1] == {"a.txt": "1"}',
    '',
    'def test_controle_negativo_add_sem_edicao_posterior():',
    '    r = Repo()',
    '    r.editar("a.txt", "1"); r.add("a.txt"); r.commit()',
    '    assert r.nao_preparado() == []'
  ]);
  var solucaoRepo = codigoRepo.replace('self.commits.append(dict(self.trabalho))', 'self.commits.append(dict(self.indice))');

  TrilhaAula.registrar({
    id: 'f01-b3',
    titulo: 'Git por dentro: objetos, hash de conteúdo, refs e índice',
    minutos: 35,
    resumo: 'O Git é um armazém de objetos imutáveis endereçados por conteúdo, mais alguns arquivos de texto com ponteiros.',
    objetivo: 'Explicar blob, tree, commit e tag, por que commit é snapshot e não diff, o que são refs e HEAD e o que cada comando altera entre diretório de trabalho, índice e histórico.',
    revisao: [
      { id: 'f01b3-snapshot', pergunta: 'O que um objeto <code>commit</code> guarda?',
        opcoes: [
          opc('a', 'O hash da tree raiz, o(s) pai(s), autor, committer e mensagem; diferença alguma', true, 'o que parece diff é calculado sob demanda, comparando duas trees. Por isso o checkout de qualquer commit é rápido.'),
          opc('b', 'O diff em relação ao commit anterior', false, 'o modelo "commit = diff" explicaria mal o checkout rápido e por que o hash depende de tudo abaixo dele.'),
          opc('c', 'Uma cópia compactada de todos os arquivos', false, 'ele aponta para uma tree; arquivos iguais são o mesmo blob, compartilhado.')] },
      { id: 'f01b3-branch', pergunta: 'Você roda <code>git branch ideia</code> num repositório com 5 mil arquivos. O que o Git grava?',
        opcoes: [
          opc('a', 'Um arquivo pequeno em <code>refs/heads/ideia</code> com o hash do commit atual', true, 'um branch tem 41 bytes (40 hex mais quebra de linha); criar é instantâneo e independe do tamanho do projeto.'),
          opc('b', 'Uma cópia dos 5 mil arquivos', false, 'os objetos já existem e são compartilhados.'),
          opc('c', 'Um novo commit vazio chamado ideia', false, 'nenhum objeto novo é criado; só a ref.')] },
      { id: 'f01b3-index', pergunta: 'Você edita <code>a.txt</code> (v2), roda <code>git add</code>, edita de novo (v3) e roda <code>git commit</code> sem <code>-a</code>. O que entra no commit?',
        opcoes: [
          opc('a', 'v2 entra; v3 continua como modificação não preparada', true, 'o commit nasce do índice, que guarda o blob gravado no momento do add.'),
          opc('b', 'v3 entra e nada sobra', false, 'v3 só existe no diretório de trabalho.'),
          opc('c', 'v2 e v3 entram como dois blobs', false, 'um commit tem uma tree; só o que está no índice vira tree.')] },
      { id: 'f01b3-hash', pergunta: 'Dois commits com árvore e mensagem idênticas podem ter hashes diferentes?',
        opcoes: [
          opc('a', 'Sim: autor, committer, horário e pai entram no hash do commit', true, 'por isso cherry-pick e rebase geram novos hashes mesmo com o mesmo conteúdo; para saber se um patch já entrou, use <code>git cherry</code> ou <code>git log --cherry-pick</code>.'),
          opc('b', 'Não: o hash depende só do conteúdo da árvore', false, 'o commit é um objeto com cabeçalho próprio, e esse cabeçalho entra no hash.'),
          opc('c', 'Só se os arquivos tiverem permissões diferentes', false, 'permissões estão na tree; o ponto aqui são os metadados do commit.')] },
      { id: 'f01b3-segredo', pergunta: 'Um segredo foi commitado e removido no commit seguinte. Ele ainda está acessível?',
        opcoes: [
          opc('a', 'Sim: o blob segue acessível por qualquer commit anterior; a resposta é revogar a credencial', true, 'reescrever histórico (<code>git filter-repo</code>) é limpeza complementar, não remédio.'),
          opc('b', 'Não: o commit seguinte apagou o blob', false, 'objetos são imutáveis; a nova tree só deixa de listar o blob.'),
          opc('c', 'Só até o próximo <code>git gc</code>', false, 'o gc só descarta objetos inalcançáveis; o commit antigo continua alcançável pelo histórico.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Por que olhar dentro do Git</h3>' +
          '<p>Quem aprende Git por receitas acumula crenças erradas: que commit é uma diferença, que branch é uma pasta, que apagar um arquivo o remove do histórico. Cada uma gera um incidente típico: segredo "removido" que continua baixável, commit "perdido" dado como morto, rebase que parece magia. O Git é, por baixo, uma pequena base de <strong>objetos imutáveis endereçados por conteúdo</strong>, mais alguns arquivos de texto com ponteiros. Lendo esses arquivos à mão, o resto do módulo deixa de ser receita.</p>' +
          '<h3>Um armazém endereçado por conteúdo</h3>' +
          '<p>O núcleo é um mapa chave-valor em <code>.git/objects</code>. A chave de cada objeto é o hash do conteúdo: <strong>SHA-1</strong> da sequência <code>&lt;tipo&gt; &lt;tamanho&gt;\\0&lt;conteúdo&gt;</code>. O valor é essa mesma sequência comprimida com zlib. Duas consequências estruturais: o mesmo conteúdo sempre gera a mesma chave (deduplicação automática), e um objeto nunca muda (mudar o conteúdo muda a chave, ou seja, cria outro objeto).</p>' },
        { tipo: 'texto', html:
          '<p>O Git moderno usa uma variante de SHA-1 que detecta ataques de colisão conhecidos e tem suporte experimental a SHA-256 (<code>hash-function-transition</code>, nas fontes); neste módulo e no leitor do laboratório, SHA-1.</p>' +
          '<h3>Os quatro tipos de objeto</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Tipo</th><th>Guarda</th><th>Não guarda</th></tr></thead><tbody>' +
          '<tr><td><strong>blob</strong></td><td>os bytes de um arquivo</td><td>nome, permissão, data</td></tr>' +
          '<tr><td><strong>tree</strong></td><td>lista de entradas <code>modo nome → hash</code> (de blobs e de outras trees)</td><td>conteúdo dos arquivos</td></tr>' +
          '<tr><td><strong>commit</strong></td><td>hash da tree raiz, hash(es) do(s) pai(s), autor, committer, mensagem</td><td>diferença alguma</td></tr>' +
          '<tr><td><strong>tag</strong> (anotada)</td><td>hash do objeto marcado, tipo, nome, tagger, mensagem (opcionalmente assinatura)</td><td>—</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Commit é snapshot, não diff</h3>' +
          '<p>Cada commit referencia a árvore <em>completa</em> do projeto naquele instante. O que parece diff é calculado sob demanda, comparando duas trees. Custo de um commit = objetos dos arquivos alterados + trees ao longo dos caminhos + o commit. O modelo "commit = diff" explicaria mal por que <code>git checkout</code> de qualquer commit é rápido (basta ler uma tree) e por que o hash do commit depende de tudo abaixo dele: mudar um byte em um blob muda a tree, o commit e, em cadeia, todos os descendentes.</p>' +
          '<p>Armazenamento é outra camada. Objetos novos ficam soltos (um arquivo por objeto); o <code>git gc</code> (ou o envio/recebimento via rede) os agrupa em <strong>packfiles</strong>, guardando objetos parecidos como delta. É otimização física: o modelo lógico segue sendo "snapshot por commit". O leitor do laboratório lê só objetos soltos e, depois de um <code>git gc</code>, acusa o que não encontra, de propósito.</p>' },
        { tipo: 'takeaway', html: 'Objetos são <mark>imutáveis e endereçados pelo conteúdo</mark>; um commit é uma <mark>tree completa</mark>, não uma diferença.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Siga um arquivo de 10 bytes, <code>olá, git\\n</code>, do hash até o segundo commit. Os repositórios do exemplo têm <code>a.txt</code> e <code>b.txt</code> com esse mesmo conteúdo e uma pasta <code>lib/</code>.</p>' },
        { tipo: 'rode', id: 'b3-rode-objetos', titulo: 'Do blob ao snapshot', enunciado: 'Rode a sequência e leia cada etapa: o hash, o <code>add</code>, o commit, a tree e o segundo commit.',
          prefixo: '$', entrada: 'git cat-file -p HEAD^{tree}', unidade: 'passo', terminalTitulo: 'repositório de exemplo', etapas: etapasObjetos(),
          prever: { pergunta: '<code>a.txt</code> e <code>b.txt</code> têm exatamente o mesmo conteúdo. Quantos blobs o Git guarda para os dois?', opcoes: [
            { id: 'a', texto: 'Dois: um por arquivo.', correta: false, porque: 'o nome não entra no hash do blob; conteúdo igual dá chave igual.' },
            { id: 'b', texto: 'Um só: o nome vive na tree e o blob é compartilhado.', correta: true, porque: 'a chave é o hash do conteúdo, então os dois nomes apontam para o mesmo objeto.' },
            { id: 'c', texto: 'Nenhum: arquivos pequenos ficam dentro da tree.', correta: false, porque: 'a tree só lista modo, nome e hash.' }
          ] },
          tutorAntes: 'Aperte Enter e clique nas etapas na ordem. Na etapa "A tree", compare os hashes de a.txt e b.txt.',
          tutorDepois: 'Os dois nomes apontam para o blob 9c07bea. No segundo commit só <code>lib/m.py</code> ganhou blob novo (407de30), e por consequência a tree <code>lib</code> e a tree raiz. O resto foi reaproveitado por hash.',
          callout: 'Você viu um blob compartilhado por dois nomes e dois commits.' },
        { tipo: 'texto', html:
          '<h3>O que o git add e o git commit fazem de verdade</h3>' +
          '<p>O <code>add</code> gravou o blob (arquivo solto em <code>objects/9c/07bea...</code>: os dois primeiros hex viram diretório) e uma entrada no <strong>índice</strong>, o arquivo binário <code>.git/index</code> (assinatura <code>DIRC</code>, de <em>dircache</em>). Nenhuma tree e nenhum commit existem ainda. Só o commit cria as trees a partir do índice e o objeto commit.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git cat-file -t ' + H + '; git cat-file -s ' + H + '; git cat-file -p ' + H + '\nblob\n10\nolá, git\n$ python3 -c "import zlib,sys; print(zlib.decompress(open(\'.git/objects/9c/07bea4318031a0450fd0e7eb55acde9f12fede\',\'rb\').read()))"\nb\'blob 10\\x00ol\\xc3\\xa1, git\\n\'' },
        { tipo: 'texto', html:
          '<p>O <code>zlib.decompress</code> devolve exatamente a sequência <code>blob 10\\0olá, git\\n</code> que gerou o hash. É o que o leitor do laboratório (<code>gitobjects.py</code>, pouco mais de 200 linhas, só biblioteca padrão) faz: descomprime, separa cabeçalho e corpo no primeiro <code>\\0</code>, confere que o SHA-1 do conteúdo bate com o nome e interpreta tree e commit. Resolve HEAD, branches e tags soltos ou em <code>packed-refs</code>, e os testes comparam cada leitura com a saída do próprio <code>git</code>.</p>' },
        { tipo: 'ordene', id: 'b3-ordene-commit', titulo: 'Ordene do add ao commit',
          enunciado: 'Ponha na ordem o que acontece, em <code>.git</code>, desde o <code>git add a.txt</code> até o commit concluído.',
          itens: [
            { id: 'ref', texto: 'A ref do branch é reescrita para apontar para o novo commit' },
            { id: 'add', texto: '<code>git add</code>: o blob é gravado em <code>objects</code> e o índice passa a apontar para ele' },
            { id: 'commit', texto: 'Nasce o objeto commit, com a tree raiz e o pai (o HEAD atual)' },
            { id: 'tree', texto: '<code>git commit</code> começa: o índice vira trees (<code>write-tree</code>)' }
          ], solucao: ['add', 'tree', 'commit', 'ref'],
          dica: 'Quem aponta para quem: o commit precisa da tree, a tree vem do índice, e a ref só anda por último.',
          tutorDepois: 'Fazer um commit é criar o objeto commit e reescrever a ref à qual o HEAD aponta. Os objetos são imutáveis; o que anda é o ponteiro.',
          callout: 'A sequência add, trees, commit, ref está fixada.' },
        { tipo: 'takeaway', html: '<code>add</code> grava o <mark>blob e o índice</mark>; <code>commit</code> transforma o índice em <mark>trees e commit</mark> e move a ref.' }
      ] },

      { rotulo: 'Refs, HEAD e índice', blocos: [
        { tipo: 'texto', html:
          '<h3>Refs e HEAD: os únicos arquivos mutáveis</h3>' +
          '<p>Objetos são imutáveis; o que muda é o ponteiro. Uma <strong>ref</strong> é um arquivo de texto com um hash. Um branch é <code>refs/heads/&lt;nome&gt;</code>; tag leve é <code>refs/tags/&lt;nome&gt;</code>; branch remoto rastreado é <code>refs/remotes/origin/&lt;nome&gt;</code>. O <strong>HEAD</strong> é uma ref especial: normalmente simbólica (<code>ref: refs/heads/main</code>, "estou no main"); se contém um hash cru, estamos em <strong>detached HEAD</strong>.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ cat .git/HEAD; cat .git/refs/heads/main; git rev-parse HEAD\nref: refs/heads/main\n66a25a9bf0f2c7aab8e0f1c11d722790d8472cd0\n66a25a9bf0f2c7aab8e0f1c11d722790d8472cd0\n$ git tag leve; git tag -a v1 -m "versão 1"; ls .git/refs/tags; cat .git/refs/tags/leve; git cat-file -t v1; git cat-file -p v1\nleve\nv1\n66a25a9bf0f2c7aab8e0f1c11d722790d8472cd0\ntag\nobject 66a25a9bf0f2c7aab8e0f1c11d722790d8472cd0\ntype commit\ntag v1\ntagger Ada Lovelace <ada@example.com> 1767268980 +0000\nversão 1' },
        { tipo: 'texto', html:
          '<p>Um branch tem 41 bytes (40 hex mais <code>\\n</code>). Criar, mover e apagar branches é barato por isso. Tag leve é só uma ref; tag anotada é um objeto próprio (com tagger, mensagem e opcionalmente assinatura), e a ref aponta para ele. Com muitas refs, o Git as agrupa no arquivo <code>packed-refs</code>; o leitor do laboratório resolve ambos.</p>' +
          '<h3>O índice e as três árvores</h3>' +
          '<p>Entre o diretório de trabalho e o histórico existe o <strong>índice</strong> (staging area): a tree que será o próximo commit, já materializada como lista de modo, hash, estágio, caminho. Isso dá três "versões" de cada arquivo ao mesmo tempo: a do HEAD (último commit), a do índice e a do diretório de trabalho.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Comando</th><th>O que faz nos arquivos de <code>.git</code></th></tr></thead><tbody>' +
          '<tr><td><code>git add f</code></td><td>grava o blob com o conteúdo atual de <code>f</code> e atualiza a entrada em <code>.git/index</code></td></tr>' +
          '<tr><td><code>git commit</code></td><td><code>write-tree</code> (cria trees a partir do índice) → cria o objeto commit (pai = HEAD atual) → reescreve a ref do branch</td></tr>' +
          '<tr><td><code>git status</code></td><td>compara HEAD×índice ("staged") e índice×trabalho ("unstaged")</td></tr>' +
          '<tr><td><code>git diff</code> / <code>--cached</code></td><td>trabalho×índice / índice×HEAD</td></tr>' +
          '</tbody></table>' },
        { tipo: 'abas', rotulo: 'Do add ao commit, passo a passo', itens: [
          { rotulo: '1. Editar', blocos: [{ tipo: 'texto', html: '<p>Você editou <code>a.txt</code> para "v2". Só o <strong>diretório de trabalho</strong> mudou. O índice ainda aponta para o blob v1 e o repositório tem o commit C1 com a tree T1; <code>main</code> aponta para C1.</p>' }] },
          { rotulo: '2. git add', blocos: [{ tipo: 'texto', html: '<p>O blob v2 é gravado em <code>objects</code> e o <strong>índice</strong> passa a apontar para ele. O repositório agora tem os blobs v1 e v2, mas o histórico (C1, <code>main</code>) não mudou.</p>' }] },
          { rotulo: '3. git commit', blocos: [{ tipo: 'texto', html: '<p>O índice vira a tree T2, nasce o commit C2 (pai C1, tree T2) e o arquivo <code>main</code> avança: <code>main -&gt; C2</code>. A ref foi movida; nenhum objeto antigo foi tocado.</p>' }] }
        ] },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git status -sb; git diff --cached | tail -2; git diff | tail -2\n## main\nMM f\n-v1\n+v2\n-v2\n+v3\n$ git show HEAD:f; cat f; git status -sb\nv2\nv3\n## main\n M f' },
        { tipo: 'texto', html:
          '<p>O <code>MM</code> é o efeito prático: o <code>add</code> tirou uma "foto" do arquivo naquele instante (v2); a edição posterior (v3) ficou só no trabalho; o commit seguinte levou v2 e deixou v3 de fora. É o motivo de rodar <code>git add</code> de novo, ou <code>git add -p</code>, antes de commitar.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o hash do commit inclui data e autor', html:
          '<p>Dois commits com árvore idêntica e mensagem idêntica têm hashes diferentes se o autor, o committer ou o horário diferirem. Por isso <code>cherry-pick</code> e <code>rebase</code> geram novos hashes mesmo quando o conteúdo é igual, e por isso comparar "este commit já entrou?" pelo hash falha. O laboratório fixa autor e relógio justamente para tornar os hashes reproduzíveis. Para saber se um patch equivalente já foi aplicado, use <code>git cherry</code> ou <code>git log --cherry-pick</code>, que comparam o patch.</p>' },
        { tipo: 'takeaway', html: 'Branch é um <mark>arquivo de 41 bytes</mark>; o commit nasce do <mark>índice</mark>, não do diretório de trabalho.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Reproduza o hash que o Git calcula</h3>' +
          '<p>Você viu <code>sha1sum</code> reproduzir o <code>git hash-object</code>. Faça o mesmo em Python, sem Git.</p>' },
        { tipo: 'python', id: 'b3-python-blob', titulo: 'Calcule o hash de um blob', obrigatorio: false,
          enunciado: 'Complete <code>hash_blob(conteudo)</code>: o Git calcula o SHA-1 de <code>b"blob " + tamanho em bytes + b"\\0" + conteúdo</code>.',
          codigo: codigoBlob, testes: testesBlob,
          dica: 'O cabeçalho é <code>b"blob " + str(len(conteudo)).encode() + b"\\0"</code>. O tamanho conta <em>bytes</em>: "é" vale 2 em UTF-8.',
          solucao: solucaoBlob,
          tutorDepois: 'Nem o nome do arquivo nem a data entram no hash do blob: por isso a.txt e b.txt compartilham o objeto e a deduplicação é automática.',
          callout: 'Seu hash_blob bate com o git hash-object.' },
        { tipo: 'python', id: 'b3-python-indice', titulo: 'Modele o índice', obrigatorio: false,
          enunciado: 'O <code>Repo</code> abaixo modela diretório de trabalho, índice e commits. O <code>commit</code> está lendo da fonte errada: corrija-o para que o v2 do exemplo entre no commit e o v3 sobre como "não preparado".',
          codigo: codigoRepo, testes: testesRepo,
          dica: 'O commit é feito a partir do <strong>índice</strong>, não do diretório de trabalho. A cópia (<code>dict(...)</code>) torna o commit um snapshot imutável.',
          solucao: solucaoRepo,
          tutorDepois: 'O controle do último teste mostra o estado limpo: depois do commit, sem edições novas, não sobra nada não preparado.',
          callout: 'O commit agora nasce do índice, como no Git de verdade.' },
        { tipo: 'cenario', id: 'b3-cenario-segredo', titulo: 'O segredo que sumiu do commit seguinte', obrigatorio: false,
          enunciado: 'Alguém commitou um arquivo <code>.env</code> com a chave de um provedor e já fez push. No commit seguinte, o arquivo foi removido. Decida o que fazer.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O <code>.env</code> não aparece mais na árvore do HEAD. A chave é real e vale em produção. Qual é o primeiro passo?', opcoes: [
              { texto: 'Nada: o arquivo foi removido e o último commit está limpo.', vai: 'f-vazou', tom: 'ruim', consequencia: 'a tree do commit novo só deixa de listar o blob; ele segue acessível por qualquer commit anterior.' },
              { texto: 'Reescrever o histórico com filter-repo e considerar resolvido.', vai: 'f-parcial', tom: 'ruim', consequencia: 'a reescrita não alcança clones, forks nem caches de CI; a chave continua válida para quem a copiou.' },
              { texto: 'Revogar e trocar a credencial primeiro.', vai: 'limpa', tom: 'ok', consequencia: 'segredo commitado é segredo vazado: o remédio é invalidar a chave, não esconder o commit.' }
            ] },
            limpa: { texto: 'A chave nova está em uso. E o histórico, com a chave velha?', opcoes: [
              { texto: 'Limpar com git filter-repo como higiene complementar e avisar a equipe, que terá de reconciliar seus clones.', vai: 'f-bom', tom: 'ok', consequencia: 'a limpeza é complementar e reescreve hashes; avisar evita divergência.' },
              { texto: 'Reescrever e fazer push --force sem avisar ninguém.', vai: 'f-forca', tom: 'ruim', consequencia: 'cada colega volta a trazer os commits antigos e o histórico duplica ou diverge.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Credencial revogada, histórico limpo por higiene e equipe avisada: a ordem certa é revogar primeiro, limpar depois.' },
            'f-vazou': { bom: false, texto: 'A chave seguiu válida e baixável por qualquer clone: o incidente só apareceu quando alguém a usou.' },
            'f-parcial': { bom: false, texto: 'O histórico do servidor ficou limpo, mas a chave antiga continuava válida nos clones e nos caches.' },
            'f-forca': { bom: false, texto: 'A chave foi trocada, mas a equipe passou a semana reconciliando históricos divergentes.' }
          },
          callout: 'Você revogou primeiro e limpou depois, com a equipe avisada.' },
        { tipo: 'callout', tom: 'info', titulo: 'Decisões, limites e consequências', html:
          '<ul><li><strong>Imutabilidade é a regra do jogo.</strong> "Reescrever histórico" (rebase, amend) nunca altera objetos: cria objetos novos e move a ref. Os antigos continuam no armazém até o <code>gc</code> descartá-los por inalcançáveis. É isso que torna a recuperação do bloco 6 possível.</li>' +
          '<li><strong>Segredo commitado é segredo vazado.</strong> Remover o arquivo no commit seguinte cria uma tree sem ele, mas o blob segue acessível por qualquer commit anterior. A resposta é revogar a credencial; reescrever histórico é limpeza complementar.</li></ul>' },
        { tipo: 'escolha', id: 'b3-escolha-branch', titulo: 'Confira: o custo de um branch',
          pergunta: 'Por que criar um branch num repositório gigante é instantâneo?',
          opcoes: [
            { id: 'a', texto: 'Um branch é só uma ref: um arquivo de texto com o hash de um commit; nenhum objeto é copiado.', correta: true, porque: 'os objetos já existem e são compartilhados. Só quando você faz commits com o branch ativo é que a ref anda.' },
            { id: 'b', texto: 'O Git copia só os arquivos modificados.', correta: false, porque: 'nada é copiado na criação do branch.' },
            { id: 'c', texto: 'O Git cria um commit vazio e compartilha a tree.', correta: false, porque: 'não nasce commit algum.' }
          ], tutorDepois: 'Criar, mover e apagar branches é barato porque são 41 bytes.' },
        { tipo: 'escolha', id: 'b3-escolha-tag', titulo: 'Confira: tag leve × anotada',
          pergunta: 'Qual a diferença entre uma tag leve e uma tag anotada?',
          opcoes: [
            { id: 'a', texto: 'A leve é só uma ref para o commit; a anotada é um objeto próprio (tagger, mensagem, assinatura opcional) para o qual a ref aponta.', correta: true, porque: 'no exemplo, <code>git cat-file -t v1</code> devolveu <code>tag</code>, enquanto a ref leve apontava direto para o commit.' },
            { id: 'b', texto: 'A anotada é um commit com mensagem.', correta: false, porque: 'é um objeto do tipo tag, distinto do commit.' },
            { id: 'c', texto: 'A leve é local e a anotada vai ao servidor.', correta: false, porque: 'ambas podem ser enviadas; a diferença é o objeto, não o destino.' }
          ], tutorDepois: 'Os quatro tipos de objeto são blob, tree, commit e tag.' },
        { tipo: 'takeaway', html: '<mark>Revogue primeiro</mark>: o histórico é imutável, e reescrevê-lo é <mark>higiene</mark>, não remédio.' }
      ] }
    ]
  });
})();
