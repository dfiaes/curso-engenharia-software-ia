/* F01 · Bloco 4: fluxo do dia a dia (branches, merge, rebase e conflitos). Fonte: F01.html#b04. Saídas: execução real de 11/10/2026 com Git 2.34.1 (fonte); zdiff3 exige Git 2.35+. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function py(linhas) { return linhas.join('\n') + '\n'; }

  var etapasConflito = function () {
    return [
      { id: 'merge', nome: 'git merge ana', descricao: 'O Git para no meio da operação', tom: 'dns', ms: 1, linhas: [
        L('out', 'Auto-merging greet.txt'),
        L('out', 'CONFLICT (content): Merge conflict in greet.txt'),
        L('out', 'Automatic merge failed; fix conflicts and then commit the result.'),
        L('hint', 'os dois lados mudaram a mesma região de forma diferente; o estado "merge em andamento" fica registrado')] },
      { id: 'marcadores', nome: 'Marcadores no arquivo', descricao: 'cat greet.txt', tom: 'tcp', ms: 1, linhas: [
        L('cmd', 'cat greet.txt'),
        L('out', '<<<<<<< HEAD'),
        L('out', 'olá, Brasil'),
        L('out', '======='),
        L('out', 'olá, mundo'),
        L('out', '>>>>>>> ana')] },
      { id: 'estagios', nome: 'Estágios 1, 2 e 3', descricao: 'Três versões no índice', tom: 'tls', ms: 1, linhas: [
        L('cmd', 'git ls-files -u'),
        L('out', '100644 b30aa6deda68a4ddeadc2449be9025cbe409881c 1\tgreet.txt'),
        L('out', '100644 5b8c6ac58a85074a3cc99b74501e05fd46acf4b4 2\tgreet.txt'),
        L('out', '100644 2b3f4de1a27c4e2c35faf1c35187c82504d115d4 3\tgreet.txt'),
        L('cmd', 'git show :1:greet.txt; git show :2:greet.txt; git show :3:greet.txt'),
        L('out', 'olá'),
        L('out', 'olá, Brasil'),
        L('out', 'olá, mundo'),
        L('hint', 'estágio 1 = base, 2 = "nossa", 3 = "deles"')] },
      { id: 'resolver', nome: 'Resolver e commitar', descricao: 'Decidir o conteúdo final', tom: 'request', ms: 1, linhas: [
        L('cmd', 'git add greet.txt && git commit -m "merge ana" && git log --oneline --graph'),
        L('out', '[main 112dc97] merge ana'),
        L('out', '*   112dc97 merge ana'),
        L('out', '|\\'),
        L('out', '| * 1f34502 ana: mundo'),
        L('out', '* | b7e4fec main: Brasil'),
        L('out', '|/'),
        L('out', '* a0b88cd base'),
        L('hint', 'o add limpa os estágios; o commit de merge tem dois pais')] },
      { id: 'abort', nome: 'Se fugir do controle', descricao: 'git merge --abort', tom: 'response', ms: 1, linhas: [
        L('cmd', 'git merge --abort; git status -sb; cat greet.txt'),
        L('out', '## main'),
        L('out', 'olá, Brasil'),
        L('hint', '--abort devolve tudo ao estado anterior ao merge')] }
    ];
  };

  var codigoGrafo = py([
    'def ancestrais(grafo, c):',
    '    """grafo: {commit: [pais]}. Devolve c e todos os seus ancestrais."""',
    '    vistos = {c}',
    '    pilha = list(grafo[c])',
    '    # enquanto houver commits na pilha: tire um; se ainda não foi visto,',
    '    # marque-o como visto e empilhe os pais dele',
    '    return vistos',
    '',
    '',
    'def merge_base(grafo, a, b):',
    '    comuns = ancestrais(grafo, a) & ancestrais(grafo, b)',
    '    melhores = [c for c in comuns',
    '                if not any(c in ancestrais(grafo, d) for d in comuns if d != c)]',
    '    return melhores[0] if melhores else None',
    '',
    '',
    'def tipo_merge(grafo, atual, outro):',
    '    """Merge de `outro` no branch cuja ponta é `atual`:',
    '    "ja-integrado", "fast-forward" ou "three-way"."""',
    '    return "three-way"',
    '',
    '',
    'G = {"C1": [], "M1": ["C1"], "F1": ["C1"], "F2": ["F1"]}',
    'print(tipo_merge(G, "M1", "F2"))'
  ]);
  var testesGrafo = py([
    'G = {"C1": [], "M1": ["C1"], "F1": ["C1"], "F2": ["F1"]}',
    'LINEAR = {"C1": [], "F1": ["C1"], "F2": ["F1"]}',
    'COM_MERGE = {"C1": [], "M1": ["C1"], "F1": ["C1"], "MG": ["M1", "F1"]}',
    '',
    'def test_ancestrais_seguem_os_pais():',
    '    assert ancestrais(G, "F2") == {"F2", "F1", "C1"}',
    '    assert ancestrais(G, "C1") == {"C1"}',
    '',
    'def test_ancestrais_com_dois_pais():',
    '    assert ancestrais(COM_MERGE, "MG") == {"MG", "M1", "F1", "C1"}',
    '',
    'def test_fast_forward_quando_a_ponta_e_ancestral():',
    '    assert tipo_merge(LINEAR, "C1", "F2") == "fast-forward"',
    '',
    'def test_three_way_quando_os_dois_andaram():',
    '    assert tipo_merge(G, "M1", "F2") == "three-way"',
    '    assert merge_base(G, "M1", "F2") == "C1"',
    '',
    'def test_ja_integrado():',
    '    assert tipo_merge(LINEAR, "F2", "C1") == "ja-integrado"',
    '    assert tipo_merge(COM_MERGE, "MG", "F1") == "ja-integrado"',
    '',
    'def test_borda_mesmo_commit():',
    '    assert tipo_merge(LINEAR, "F1", "F1") == "ja-integrado"',
    '',
    'def test_merge_base_depois_de_um_merge():',
    '    assert merge_base(COM_MERGE, "MG", "F1") == "F1"'
  ]);
  var solucaoGrafo = py([
    'def ancestrais(grafo, c):',
    '    vistos = {c}',
    '    pilha = list(grafo[c])',
    '    while pilha:',
    '        x = pilha.pop()',
    '        if x not in vistos:',
    '            vistos.add(x)',
    '            pilha.extend(grafo[x])',
    '    return vistos',
    '',
    '',
    'def merge_base(grafo, a, b):',
    '    comuns = ancestrais(grafo, a) & ancestrais(grafo, b)',
    '    melhores = [c for c in comuns',
    '                if not any(c in ancestrais(grafo, d) for d in comuns if d != c)]',
    '    return melhores[0] if melhores else None',
    '',
    '',
    'def tipo_merge(grafo, atual, outro):',
    '    if outro in ancestrais(grafo, atual):',
    '        return "ja-integrado"',
    '    if atual in ancestrais(grafo, outro):',
    '        return "fast-forward"',
    '    return "three-way"'
  ]);

  TrilhaAula.registrar({
    id: 'f01-b4',
    titulo: 'Fluxo do dia a dia: branches, merge, rebase e conflitos',
    minutos: 35,
    resumo: 'Branch é um ponteiro; merge é uma operação sobre três árvores; rebase copia commits. Saber qual usar e quando não reescrever evita a maior parte da dor.',
    objetivo: 'Distinguir fast-forward de three-way, resolver um conflito lendo os estágios do índice, explicar o que o rebase faz com os hashes e escolher entre merge, rebase, cherry-pick e stash.',
    revisao: [
      { id: 'f01b4-ff', pergunta: 'A <code>main</code> não recebeu commits desde que você criou <code>feature</code> (com 3 commits). O que faz <code>git merge feature</code> na main, por padrão?',
        opcoes: [
          opc('a', 'Fast-forward: a ref da main só avança, sem commit de merge', true, 'se um branch é ancestral direto do outro, não há trabalho paralelo a combinar. <code>--no-ff</code> força o commit de merge.'),
          opc('b', 'Cria um commit de merge com dois pais', false, 'o commit de merge só aparece no three-way, quando as duas pontas têm commits próprios.'),
          opc('c', 'Conflito, porque os dois branches mudaram', false, 'a main não mudou; não há o que conflitar.')] },
      { id: 'f01b4-estagios', pergunta: 'Num conflito, o que o índice guarda para o arquivo conflitante?',
        opcoes: [
          opc('a', 'Três versões: estágio 1 (base), 2 ("nossa") e 3 ("deles")', true, '<code>git show :1:arq</code>, <code>:2:arq</code> e <code>:3:arq</code> leem cada uma; o <code>git add</code> do arquivo resolvido limpa os estágios.'),
          opc('b', 'Só a versão do outro branch', false, 'o Git não escolhe por você.'),
          opc('c', 'Nada: o conflito vive só nos marcadores do arquivo', false, 'os marcadores estão no diretório de trabalho; o índice guarda os três estágios.')] },
      { id: 'f01b4-rebase', pergunta: 'O que o rebase faz com os commits do seu branch?',
        opcoes: [
          opc('a', 'Copia-os sobre a nova base: o conteúdo é parecido, mas os hashes são novos e os antigos ficam órfãos', true, 'o pai do primeiro commit muda e, em cadeia, o hash de todos os seguintes. Os antigos seguem no armazém, alcançáveis pelo reflog e por <code>ORIG_HEAD</code>.'),
          opc('b', 'Move os commits sem mudar nenhum hash', false, 'mudar o pai muda o hash.'),
          opc('c', 'Cria um commit de merge com dois pais', false, 'isso é o merge three-way.')] },
      { id: 'f01b4-regra', pergunta: 'Qual é a regra operacional entre merge e rebase?',
        opcoes: [
          opc('a', 'Rebase para limpar o seu trabalho local antes de publicar; merge (ou squash) para integrar trabalho compartilhado', true, 'reescrever commits que já estão em <code>origin</code> obriga cada colega a reconciliar versões duplicadas.'),
          opc('b', 'Sempre rebase, porque o histórico fica linear', false, 'em branch compartilhado, o rebase com push forçado diverge o histórico dos colegas.'),
          opc('c', 'Sempre merge, porque o rebase é perigoso', false, 'no que é só seu e ainda não foi usado por outros, o rebase é seguro e limpa o histórico.')] },
      { id: 'f01b4-limpo', pergunta: 'O merge terminou sem conflito. Isso significa que o código está correto?',
        opcoes: [
          opc('a', 'Não: o Git detecta conflito textual; renomear uma função num lado e chamar o nome antigo no outro passa sem aviso', true, 'por isso o fluxo saudável tem teste e CI depois do merge (ou melhor, sobre o resultado da integração, com merge queue).'),
          opc('b', 'Sim: sem conflito, o merge é sempre semanticamente correto', false, 'conflito textual não é o mesmo que erro de compilação ou de lógica.'),
          opc('c', 'Sim, se o merge foi fast-forward ou usou ort', false, 'a estratégia não verifica semântica.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Sexta, 18h: dois branches tocaram o mesmo arquivo</h3>' +
          '<p>O merge acusa conflito. Quem vê branch como "pasta de código" entra em pânico; quem sabe que branch é um ponteiro e que merge é uma operação sobre três árvores resolve em minutos e, mais importante, sabe quando <em>não</em> reescrever o que os colegas já têm.</p>' +
          '<h3>Branch é ponteiro; trocar de branch é mover HEAD</h3>' +
          '<p>No bloco 3, um branch era um arquivo com um hash. Criar um branch escreve esse arquivo; <code>git switch</code> aponta o HEAD para outro branch e reescreve o diretório de trabalho e o índice para casar com a tree do commit de destino. Nada é copiado.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git switch -q -c feature; echo F1 > f.txt; git add f.txt; git commit -qm "F1"; git log --oneline --graph --all\n* f386880 F1\n* f337fba C1 base' },
        { tipo: 'texto', html:
          '<h3>Merge: fast-forward e three-way</h3>' +
          '<p><strong>Fast-forward:</strong> se o branch que recebe é ancestral direto do que chega, não há nada a combinar. O Git só avança o ponteiro e não cria commit.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git switch -q main; cat .git/refs/heads/main | cut -c1-7; git merge feature; cat .git/refs/heads/main | cut -c1-7; git log --oneline --graph\nf337fba\nUpdating f337fba..f386880\nFast-forward\n f.txt | 1 +\n 1 file changed, 1 insertion(+)\n create mode 100644 f.txt\nf386880\n* f386880 F1\n* f337fba C1 base' },
        { tipo: 'texto', html:
          '<p>O <code>f337fba</code> virou <code>f386880</code> no arquivo da ref, e só isso.</p>' +
          '<p><strong>Three-way merge:</strong> se os dois lados andaram, o Git acha o ancestral comum (<strong>merge base</strong>) e compara três trees: a base, a sua ponta e a do outro lado. Em cada caminho: só um lado mudou, vale o que mudou; nenhum mudou, fica; os dois mudaram a mesma região de forma diferente, <strong>conflito</strong>. O resultado é um commit de merge com <em>dois pais</em>.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git merge-base main feature | cut -c1-7\n0d89db3\n$ git merge feature\nMerge made by the \'ort\' strategy.\n f.txt | 1 +\n 1 file changed, 1 insertion(+)\n create mode 100644 f.txt\n$ git log --oneline --graph; git cat-file -p HEAD | sed -n 1,4p\n*   0e7a565 Merge branch \'feature\'\n|\\\n| * 9f68d5a F1\n* | d295e97 M1\n|/\n* 0d89db3 C1 base\ntree e9af6182b8bcce4f4f77f62181367f9f00c0be32\nparent d295e977edff419ce93d6d3133475a454773ab71\nparent 9f68d5a7e7364b4fdf0e2f37abdcd0da63bd9caa\nauthor Ada Lovelace <ada@example.com> 1767269100 +0000' },
        { tipo: 'texto', html:
          '<p>O merge usa a estratégia <strong>ort</strong> (padrão desde o Git 2.34, mais rápida e mais correta com renomeações que a antiga <code>recursive</code>). Duas opções definem a política: <code>--ff-only</code> (recusa se precisar de commit de merge) e <code>--no-ff</code> (força o commit de merge, preservando no grafo o fato de que existiu um branch).</p>' },
        { tipo: 'takeaway', html: 'Fast-forward só <mark>move a ref</mark>; three-way compara <mark>base, minha e deles</mark> e cria um commit com dois pais.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Conflitos: o que o Git entrega e como resolver</h3>' +
          '<p>Num conflito o Git para no meio da operação e deixa três coisas: o diretório de trabalho com <strong>marcadores</strong> no arquivo, o <strong>índice com três versões</strong> (estágios 1 = base, 2 = "nossa", 3 = "deles") e o estado "merge em andamento". Duas pessoas mudaram a mesma linha de <code>greet.txt</code>: a base diz "olá", a main diz "olá, Brasil" e o branch <code>ana</code> diz "olá, mundo".</p>' },
        { tipo: 'rode', id: 'b4-rode-conflito', titulo: 'Provoque e resolva um conflito', enunciado: 'Rode o merge e percorra cada etapa: o aviso, os marcadores, os estágios, a resolução e o <code>--abort</code>.',
          prefixo: '$', entrada: 'git merge ana', unidade: 'passo', terminalTitulo: 'repositório de exemplo', etapas: etapasConflito(),
          prever: { pergunta: 'Além dos marcadores no arquivo, o que o Git deixa no <strong>índice</strong> para <code>greet.txt</code>?', opcoes: [
            { id: 'a', texto: 'Só a versão da main; a outra fica guardada em um stash.', correta: false, porque: 'o Git não escolhe lado nem usa stash para isso.' },
            { id: 'b', texto: 'Três versões, em estágios 1 (base), 2 (nossa) e 3 (deles).', correta: true, porque: 'é o que <code>git ls-files -u</code> lista e o que <code>git show :1:arq</code> a <code>:3:arq</code> lê.' },
            { id: 'c', texto: 'Nada: o arquivo sai do índice até ser resolvido.', correta: false, porque: 'ele fica no índice, em três estágios, até o <code>git add</code>.' }
          ] },
          tutorAntes: 'Aperte Enter e clique nas etapas na ordem. Na terceira, compare o que cada estágio contém.',
          tutorDepois: 'Resolver é decidir o conteúdo final (aqui, "olá, mundo e Brasil"), remover os marcadores, dar <code>git add</code> (isso limpa os estágios) e <code>git commit</code>. Duas configurações ajudam: <code>merge.conflictStyle=zdiff3</code> (Git 2.35+) mostra também o texto da base entre os marcadores, e <code>rerere</code> memoriza como você resolveu para reaplicar em rebases repetidos.',
          callout: 'Você leu os três estágios e viu o abort devolver o estado anterior.' },
        { tipo: 'ordene', id: 'b4-ordene-conflito', titulo: 'Ordene a resolução de um conflito',
          enunciado: 'Monte a sequência típica de resolução de um conflito de merge.',
          itens: [
            { id: 'add', texto: '<code>git add arquivo</code> marca o conflito como resolvido' },
            { id: 'merge', texto: '<code>git merge feature</code> para no meio e avisa do conflito' },
            { id: 'testes', texto: 'Rodar os testes: um merge limpo (ou resolvido) ainda pode estar quebrado' },
            { id: 'status', texto: '<code>git status</code> lista os arquivos "both modified"' },
            { id: 'commit', texto: '<code>git commit</code> conclui o merge (ou <code>git merge --abort</code> teria desfeito tudo)' },
            { id: 'editar', texto: 'Editar o arquivo, escolher o resultado e remover os marcadores <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code>, <code>=======</code>, <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code>' }
          ], solucao: ['merge', 'status', 'editar', 'testes', 'add', 'commit'],
          dica: 'Primeiro o Git avisa, depois você descobre onde, decide o conteúdo, valida, marca como resolvido e só então conclui.',
          tutorDepois: 'Os testes entram antes de fechar o merge porque o Git só detecta conflito textual.',
          callout: 'Sequência de resolução fixada, com os testes antes do commit.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: merge limpo não é merge correto', html:
          '<p>O Git detecta conflito <em>textual</em>. Se um lado renomeia uma função e o outro adiciona uma chamada ao nome antigo em outro arquivo, o merge passa sem aviso e o build quebra. Por isso o fluxo saudável tem teste e CI depois do merge (ou, melhor, antes: "merge queue" e CI sobre o resultado da integração, não só sobre o branch). A mesma lógica vale para rebase: reaplicar com sucesso não garante que o código compile.</p>' },
        { tipo: 'takeaway', html: 'O conflito deixa <mark>marcadores, três estágios e um merge em andamento</mark>; <code>--abort</code> desfaz tudo.' }
      ] },

      { rotulo: 'Rebase, cherry-pick e stash', blocos: [
        { tipo: 'texto', html:
          '<h3>Rebase: reescrever sobre uma base nova</h3>' +
          '<p>O <strong>rebase</strong> pega os commits do seu branch que não estão na base nova, guarda o patch de cada um e o reaplica, em ordem, sobre a nova ponta. Como o pai do primeiro commit muda, seu hash muda, e em cadeia o de todos os seguintes.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git log --format="%h %s" --graph --all\n* 60e9b43 M1\n| * 2695a97 F2\n| * e7505f4 F1\n|/\n* 2ab0acc C1 base\n$ git rebase main\nRebasing (1/2)\nRebasing (2/2)\nSuccessfully rebased and updated refs/heads/feature.\n$ git log --format="%h %s" --graph --all\n* 1069229 F2\n* 914dd78 F1\n* 60e9b43 M1\n* 2ab0acc C1 base' },
        { tipo: 'texto', html:
          '<p>Os commits <code>e7505f4</code> e <code>2695a97</code> (F1, F2 originais) viraram <code>914dd78</code> e <code>1069229</code>. Os antigos seguem no armazém, alcançáveis pelo reflog e por <code>ORIG_HEAD</code>:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git reflog -6 --format="%h %gd %gs"\n1069229 HEAD@{0} rebase (finish): returning to refs/heads/feature\n1069229 HEAD@{1} rebase (pick): F2\n914dd78 HEAD@{2} rebase (pick): F1\n60e9b43 HEAD@{3} rebase (start): checkout main\n2695a97 HEAD@{4} checkout: moving from main to feature\n60e9b43 HEAD@{5} commit: M1' },
        { tipo: 'texto', html:
          '<p>O <code>rebase -i</code> permite <code>reword</code>, <code>squash</code>, <code>fixup</code>, <code>drop</code> e reordenar antes de compartilhar; com <code>git commit --fixup=&lt;hash&gt;</code> e <code>--autosquash</code>, correções pequenas se encaixam nos commits certos. Depois, o branch entra na principal por fast-forward (<code>merge --ff-only</code>), em história linear.</p>' },
        { tipo: 'abas', rotulo: 'O mesmo trabalho, integrado de dois jeitos', itens: [
          { rotulo: 'Antes', blocos: [{ tipo: 'texto', html: '<p><code>feature</code> saiu de B; depois disso a <code>main</code> ganhou o commit C. O grafo tem dois históricos divergentes: A-B-C (main) e B-D-E (feature). Nada foi reescrito ainda.</p>' }] },
          { rotulo: 'git merge main', blocos: [{ tipo: 'texto', html: '<p>Nasce o commit <strong>M com dois pais</strong> (C e E). D e E mantêm hashes e continuam iguais para quem já os baixou. O histórico preserva a forma real do trabalho em paralelo.</p>' }] },
          { rotulo: 'git rebase main', blocos: [{ tipo: 'texto', html: '<p>D e E são <strong>copiados</strong> sobre C e viram D\' e E\' com hashes novos. O histórico fica linear, mas D e E ficam órfãos (só o reflog os acha). Quem tinha D e E vai divergir se você já os publicou: use só no que é seu.</p>' }] }
        ] },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th></th><th>Merge</th><th>Rebase</th></tr></thead><tbody>' +
          '<tr><td><strong>Histórico</strong></td><td>fiel: mostra quando os branches divergiram e se juntaram</td><td>linear: parece que o trabalho foi feito em sequência</td></tr>' +
          '<tr><td><strong>Hashes</strong></td><td>preserva os existentes</td><td>cria novos (os antigos ficam órfãos)</td></tr>' +
          '<tr><td><strong>Conflitos</strong></td><td>resolvidos uma vez, no commit de merge</td><td>potencialmente a cada commit reaplicado</td></tr>' +
          '<tr><td><strong>Segurança</strong></td><td>seguro em branch compartilhado</td><td>só em commits que ninguém mais tem</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p><strong>Regra operacional:</strong> rebase para limpar o seu trabalho local antes de publicar; merge (ou squash) para integrar trabalho compartilhado. Reescrever commits que já estão em <code>origin</code> obriga cada colega a reconciliar versões duplicadas.</p>' +
          '<h3>Cherry-pick e stash</h3>' +
          '<p><code>git cherry-pick &lt;commit&gt;</code> recalcula o patch daquele commit e o aplica sobre o HEAD atual, criando um commit novo com a mesma mensagem e autor. É a ferramenta de <em>backport</em> (levar um hotfix para um branch de release). Duplica a mudança no histórico, então prefira merge para integrar um branch inteiro; use <code>-x</code> para anotar a origem na mensagem.</p>' +
          '<p><code>git stash</code> guarda o trabalho em andamento para trocar de contexto. Por baixo, é um commit (ou melhor, dois: um para o índice, outro para o diretório de trabalho), apontado por <code>refs/stash</code>. Os dois pais são o HEAD e o commit do índice. Por padrão o stash <em>não</em> leva arquivos não rastreados (<code>-u</code> inclui-os). <code>stash pop</code> pode conflitar como um merge. Para mais que um dia de trabalho, prefira um branch, que tem nome e não some em <code>stash clear</code>.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git stash push -m "wip de a e b"; git status -sb; git stash list\nSaved working directory and index state On main: wip de a e b\n## main\nstash@{0}: On main: wip de a e b\n$ git cat-file -p stash@{0} | sed -E "s/ [0-9]+ \\+0000//" | head -6\ntree 1c132632379e4b22220018f3ae023c6de4a5be9c\nparent 88b99acf7fa93976f9cb7334c27d05e662baeba0\nparent 084a987c9f5d615fed0eec463f7e3dca44f344b9\nauthor Ada Lovelace <ada@example.com>\ncommitter Ada Lovelace <ada@example.com>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: git pull faz merge sem perguntar', html:
          '<p>Por padrão, <code>pull</code> é <code>fetch</code> seguido de <code>merge</code>. Quem puxa com commits locais ainda não publicados ganha um commit de merge "Merge branch \'main\' of origin/main" que ninguém quis. Defina a política explicitamente: <code>git config pull.rebase true</code> (ou <code>pull.ff only</code>) e o comportamento deixa de depender de humor.</p>' },
        { tipo: 'takeaway', html: 'Rebase <mark>copia commits com hashes novos</mark>: use no que é só seu e integre o compartilhado com <mark>merge</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Classifique um merge pelo grafo</h3>' +
          '<p>Fast-forward, three-way e "já integrado" são questões de ancestralidade no grafo de commits. Escreva a busca por ancestrais e a classificação.</p>' },
        { tipo: 'python', id: 'b4-python-grafo', titulo: 'Fast-forward ou three-way?', obrigatorio: false,
          enunciado: 'O grafo é um dicionário <code>{commit: [pais]}</code>. Complete <code>ancestrais</code> (o commit e todos os seus ancestrais) e <code>tipo_merge(grafo, atual, outro)</code>: <code>"ja-integrado"</code> se <code>outro</code> já é ancestral de <code>atual</code>, <code>"fast-forward"</code> se <code>atual</code> é ancestral de <code>outro</code>, <code>"three-way"</code> nos demais casos.',
          codigo: codigoGrafo, testes: testesGrafo,
          dica: 'Em <code>ancestrais</code>: <code>while pilha:</code>, tire um commit com <code>pilha.pop()</code>; se não está em <code>vistos</code>, adicione e faça <code>pilha.extend(grafo[x])</code>. Em <code>tipo_merge</code>, teste o "já integrado" primeiro (inclui o caso de commits iguais).',
          solucao: solucaoGrafo,
          tutorDepois: 'O merge base é o ancestral comum "mais novo": aquele que não é ancestral de nenhum outro ancestral comum. É a base do three-way. Depois de um merge, a base de MG e F1 é o próprio F1: tudo já foi integrado.',
          callout: 'Você classificou fast-forward, three-way e já integrado só pelo grafo.' },
        { tipo: 'cenario', id: 'b4-cenario-rebase', titulo: 'O branch que o colega já baixou', obrigatorio: false,
          enunciado: 'Seu branch <code>feature</code> tem 5 commits e já foi enviado ao remoto; um colega fez checkout dele. A <code>main</code> andou desde então. Decida como integrar.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Você quer o histórico linear. O que faz?', opcoes: [
              { texto: 'git rebase main e git push --force.', vai: 'f-diverge', tom: 'ruim', consequencia: 'os 5 commits ganham hashes novos; o colega ainda tem os antigos e vai trazê-los de volta, duplicando ou divergindo o histórico.' },
              { texto: 'git merge main no feature e seguir.', vai: 'f-merge', tom: 'ok', consequencia: 'merge preserva os hashes existentes: nada que o colega tem fica inválido.' },
              { texto: 'Combinar com o colega: ele publica o que tem, você faz rebase e usa --force-with-lease.', vai: 'f-combina', tom: 'ok', consequencia: 'a reescrita é feita sabendo quem tem o quê, e o lease recusa se alguém empurrou algo que você não viu.' }
            ] }
          },
          finais: {
            'f-merge': { bom: true, texto: 'Histórico fiel, hashes preservados, ninguém precisou reconciliar nada. O custo é um commit de merge.' },
            'f-combina': { bom: true, texto: 'Histórico linear sem surpresa: a reescrita foi combinada e protegida pelo lease.' },
            'f-diverge': { bom: false, texto: 'O colega empurrou os commits velhos de volta e o time perdeu a tarde reconciliando versões duplicadas.' }
          },
          callout: 'Você evitou reescrever o que outras pessoas já têm.' },
        { tipo: 'escolha', id: 'b4-escolha-cherry', titulo: 'Confira: backport',
          pergunta: 'Um hotfix já está na <code>main</code> e precisa ir também para o branch <code>release-1.2</code>, sem levar o resto da main. Qual ferramenta?',
          opcoes: [
            { id: 'a', texto: '<code>git cherry-pick -x &lt;hash&gt;</code> no release, que cria um commit novo com o mesmo patch e anota a origem.', correta: true, porque: 'é a ferramenta de backport. Duplica a mudança no histórico, por isso para integrar um branch inteiro prefira merge.' },
            { id: 'b', texto: '<code>git merge main</code> no release.', correta: false, porque: 'levaria todos os commits da main, não só o hotfix.' },
            { id: 'c', texto: '<code>git stash pop</code> no release.', correta: false, porque: 'o stash guarda trabalho não commitado; não transporta um commit.' }
          ], tutorDepois: 'O cherry-pick gera um hash novo, mesmo com o mesmo conteúdo.' },
        { tipo: 'escolha', id: 'b4-escolha-force', titulo: 'Confira: o push forçado',
          pergunta: 'Seu branch já foi enviado e um colega fez checkout dele. Você roda <code>git rebase main</code> e <code>git push --force</code>. Qual o problema central?',
          opcoes: [
            { id: 'a', texto: 'Os commits ganham hashes novos; o colega ainda tem os antigos e volta a trazê-los, duplicando ou divergindo o histórico.', correta: true, porque: 'rebase copia commits: o conteúdo é parecido, os hashes mudam. Reescreva só o que é seu e ainda não foi usado por outros.' },
            { id: 'b', texto: 'Nenhum: rebase é seguro se os testes passam.', correta: false, porque: 'os testes não dizem nada sobre quem já baixou os commits antigos.' },
            { id: 'c', texto: 'O rebase apaga os arquivos do colega.', correta: false, porque: 'não toca no clone dele; o problema é de histórico.' }
          ], tutorDepois: 'Para o resto, prefira merge ou combine antes.' },
        { tipo: 'takeaway', html: 'Classifique pelo <mark>grafo</mark> e reescreva <mark>só o que é seu</mark>; o que é compartilhado entra por merge.' }
      ] }
    ]
  });
})();
