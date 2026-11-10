/* F01 · Bloco 6: investigação e recuperação. Fonte: F01.html#b06. Saídas: execução real de 11/10/2026 com Git 2.34.1 (fonte); expiração do reflog (90/30 dias) conforme a documentação consultada em 11/10/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function py(linhas) { return linhas.join('\n') + '\n'; }

  var etapasPickaxe = function () {
    return [
      { id: 's-taxa', nome: '-S"TAXA"', descricao: 'Muda a contagem de ocorrências', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'git log --oneline -S"TAXA" -- pricing.py'),
        L('out', '499c9b9 pricing: aplica taxa'),
        L('hint', 'só a criação: no commit que mudou 0.10 para 0.15 o número de ocorrências de TAXA não mudou')] },
      { id: 'g-taxa', nome: '-G regex', descricao: 'Linha adicionada ou removida casando', tom: 'tcp', ms: 1, linhas: [
        L('cmd', 'git log --oneline -G"TAXA = 0\\.[0-9]+" -- pricing.py'),
        L('out', '541c8e5 pricing: taxa sobe para 15%'),
        L('out', '499c9b9 pricing: aplica taxa'),
        L('hint', 'o -G vê as duas alterações, inclusive a mudança de valor')] },
      { id: 's-valor', nome: '-S"0.10"', descricao: 'Quem introduziu e quem retirou o valor', tom: 'tls', ms: 1, linhas: [
        L('cmd', 'git log --format="%h %s" -S"0.10"'),
        L('out', '541c8e5 pricing: taxa sobe para 15%'),
        L('out', '499c9b9 pricing: aplica taxa')] },
      { id: 'blame', nome: 'git blame', descricao: 'Último commit que alterou cada linha', tom: 'request', ms: 1, linhas: [
        L('cmd', 'git blame -L1,4 pricing.py'),
        L('out', '541c8e5e (Ada Lovelace 1) TAXA = 0.15'),
        L('out', '499c9b98 (Ada Lovelace 2)'),
        L('out', '^aded484 (Ada Lovelace 3) def total(items):'),
        L('out', '499c9b98 (Ada Lovelace 4)     return sum(i["price"] for i in items) * (1 + TAXA)'),
        L('hint', '^aded484 marca o commit raiz. Blame aponta a última mudança, não a causa')] }
    ];
  };

  var etapasReset = function () {
    return [
      { id: 'cenario', nome: 'Cenário', descricao: 'c1, c2, c3 e uma edição não commitada', tom: 'ink', ms: 1, linhas: [
        L('info', 'o c3 acrescentou g.txt; além disso, o arquivo f tem uma linha "extra" que só existe no diretório de trabalho'),
        L('hint', 'nos três modos o HEAD volta para c2 (3158ca7)')] },
      { id: 'soft', nome: '--soft', descricao: 'Move só a ref do branch', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'git reset --soft HEAD~1; git status -sb; git log --oneline -1; cat f'),
        L('out', '## main'),
        L('out', 'MM f'),
        L('out', 'A  g.txt'),
        L('out', '3158ca7 c2'),
        L('hint', 'o commit desfeito vira "alterações preparadas" (staged): g.txt continua no índice')] },
      { id: 'mixed', nome: '--mixed (padrão)', descricao: 'Move a ref e zera o índice', tom: 'tcp', ms: 1, linhas: [
        L('cmd', 'git reset --mixed HEAD~1; git status -sb; git log --oneline -1; cat f'),
        L('out', '## main'),
        L('out', ' M f'),
        L('out', '?? g.txt'),
        L('out', '3158ca7 c2'),
        L('hint', 'os arquivos continuam como estavam; as alterações voltam a "não preparadas" (g.txt vira não rastreado)')] },
      { id: 'hard', nome: '--hard', descricao: 'Move a ref, zera o índice e sobrescreve o trabalho', tom: 'tls', ms: 1, linhas: [
        L('cmd', 'git reset --hard HEAD~1; git status -sb; git log --oneline -1; cat f'),
        L('out', '## main'),
        L('out', '3158ca7 c2'),
        L('out', 'a'),
        L('out', 'b'),
        L('hint', 'a linha "extra" sumiu do disco: edições não commitadas são perdidas para sempre; os commits ainda aparecem no reflog')] }
    ];
  };

  var codigoBisect = py([
    'def classificar(code):',
    '    """Exit code do script do `git bisect run` -> "bom", "ruim", "pular" ou "abortar".',
    '    0 = bom; 1 a 127 (exceto 125) = ruim; 125 = pular; 128 ou mais = abortar."""',
    '    if code == 0:',
    '        return "bom"',
    '    return "ruim"',
    '',
    '',
    'def primeiro_ruim(commits, rodar):',
    '    """commits: do mais antigo (bom) ao mais novo (ruim); rodar(commit) devolve o exit code.',
    '    Busca binária. Devolve (primeiro_commit_ruim, testes_executados).',
    '    "abortar" levanta RuntimeError; "pular" levanta ValueError (esta versão não pula)."""',
    '    lo, hi = 0, len(commits) - 1      # commits[lo] é bom; commits[hi] é ruim',
    '    testes = 0',
    '    # enquanto houver commits entre lo e hi: teste o do meio e mova lo ou hi',
    '    return commits[hi], testes',
    '',
    '',
    'commits = ["c%d" % i for i in range(8)]',
    'print(primeiro_ruim(commits, lambda c: 0 if int(c[1:]) < 4 else 1))'
  ]);
  var testesBisect = py([
    'COMMITS = ["c%d" % i for i in range(8)]',
    '',
    'def quebra_em(n):',
    '    return lambda c: 0 if int(c[1:]) < n else 1',
    '',
    'def test_classificar_codigos():',
    '    assert classificar(0) == "bom"',
    '    assert classificar(1) == "ruim"',
    '    assert classificar(127) == "ruim"',
    '    assert classificar(125) == "pular"',
    '    assert classificar(128) == "abortar"',
    '    assert classificar(130) == "abortar"',
    '',
    'def test_acha_o_primeiro_ruim():',
    '    commit, testes = primeiro_ruim(COMMITS, quebra_em(4))',
    '    assert commit == "c4"',
    '    assert testes <= 3',
    '',
    'def test_borda_o_ultimo_e_o_culpado():',
    '    commit, testes = primeiro_ruim(COMMITS, quebra_em(7))',
    '    assert commit == "c7"',
    '    assert testes == 3',
    '',
    'def test_quarenta_commits_cabem_em_seis_testes():',
    '    commits = ["c%d" % i for i in range(40)]',
    '    commit, testes = primeiro_ruim(commits, quebra_em(33))',
    '    assert commit == "c33"',
    '    assert testes <= 6',
    '',
    'def test_falha_injetada_codigo_alto_aborta():',
    '    try:',
    '        primeiro_ruim(COMMITS, lambda c: 130)',
    '    except RuntimeError:',
    '        return',
    '    assert False, "devia abortar"',
    '',
    'def test_controle_negativo_125_nao_marca_ruim():',
    '    try:',
    '        primeiro_ruim(COMMITS, lambda c: 125)',
    '    except ValueError:',
    '        return',
    '    assert False, "125 devia pular, não classificar"'
  ]);
  var solucaoBisect = py([
    'def classificar(code):',
    '    if code == 0:',
    '        return "bom"',
    '    if code == 125:',
    '        return "pular"',
    '    if code >= 128:',
    '        return "abortar"',
    '    return "ruim"',
    '',
    '',
    'def primeiro_ruim(commits, rodar):',
    '    lo, hi = 0, len(commits) - 1',
    '    testes = 0',
    '    while hi - lo > 1:',
    '        mid = (lo + hi) // 2',
    '        resultado = classificar(rodar(commits[mid]))',
    '        testes += 1',
    '        if resultado == "abortar":',
    '            raise RuntimeError("bisect abortado")',
    '        if resultado == "pular":',
    '            raise ValueError("commit nao testavel")',
    '        if resultado == "bom":',
    '            lo = mid',
    '        else:',
    '            hi = mid',
    '    return commits[hi], testes'
  ]);

  TrilhaAula.registrar({
    id: 'f01-b6',
    titulo: 'Investigação e recuperação',
    minutos: 35,
    resumo: 'Investigar é fazer perguntas ao grafo de commits; recuperar é lembrar que objetos são imutáveis e que só os ponteiros andaram.',
    objetivo: 'Achar quando uma linha entrou (log -S/-G, blame), localizar um commit culpado com bisect run, desfazer com reset, revert e restore, e recuperar commits "perdidos" pelo reflog, sabendo os limites.',
    revisao: [
      { id: 'f01b6-pickaxe', pergunta: 'Qual a diferença entre <code>git log -S&lt;texto&gt;</code> e <code>-G&lt;regex&gt;</code>?',
        opcoes: [
          opc('a', '-S lista commits em que o número de ocorrências do texto mudou (introdução ou remoção); -G lista commits cujo diff tem linha adicionada ou removida casando a regex, o que pega alterações de valor', true, 'no exemplo da TAXA, o -S só vê a criação; o -G vê a criação e a mudança de 0.10 para 0.15.'),
          opc('b', 'São sinônimos', false, 'diferem justamente na mudança de valor sem mudar a contagem.'),
          opc('c', '-S busca no código e -G, nas mensagens de commit', false, 'ambos olham o diff; para mensagens existe <code>--grep</code>.')] },
      { id: 'f01b6-bisect', pergunta: 'Num <code>git bisect run</code>, o projeto nem compila em alguns commits antigos. Que exit code o script deve devolver neles?',
        opcoes: [
          opc('a', '125: pular este commit, que não dá para testar', true, '0 marca bom, 1 a 127 (exceto 125) marca ruim, e 128 ou mais aborta a busca. Marcar como "ruim" um commit que só não compila aponta o culpado errado.'),
          opc('b', '1: o commit é ruim', false, 'não compilar não é o bug que você procura.'),
          opc('c', '0: o commit é bom', false, 'esconderia o bug e enviesaria a busca.')] },
      { id: 'f01b6-reset', pergunta: 'O que diferencia <code>reset --soft</code>, <code>--mixed</code> e <code>--hard</code>?',
        opcoes: [
          opc('a', 'Todos movem a ref do branch; o mixed também zera o índice; o hard também sobrescreve o diretório de trabalho (e destrói edições não commitadas)', true, 'o reset desce pelas três árvores: HEAD, índice e trabalho.'),
          opc('b', 'Só o --hard move a ref do branch', false, 'os três movem a ref.'),
          opc('c', 'O --soft apaga os arquivos novos', false, 'o --soft não toca em índice nem em trabalho.')] },
      { id: 'f01b6-revert', pergunta: 'Um commit ruim já está em <code>origin/main</code> e outras pessoas baseiam trabalho nele. Qual a forma segura de desfazer o efeito?',
        opcoes: [
          opc('a', '<code>git revert &lt;hash&gt;</code>: cria um commit novo que inverte a mudança, sem reescrever o histórico', true, 'revert é aditivo. Para reverter um commit de merge, diga o pai principal: <code>git revert -m 1 &lt;merge&gt;</code>.'),
          opc('b', '<code>git reset --hard HEAD~1</code> e push forçado', false, 'reescreve o que outros já usam.'),
          opc('c', '<code>git restore .</code>', false, 'só mexe nos arquivos locais.')] },
      { id: 'f01b6-reflog', pergunta: 'Depois de um <code>git reset --hard HEAD~2</code>, os dois commits "perdidos" ainda podem ser recuperados?',
        opcoes: [
          opc('a', 'Sim, pelo reflog (<code>git reflog</code>, depois <code>git branch rescue &lt;hash&gt;</code>), até o gc descartá-los; edições nunca adicionadas ao índice não voltam', true, 'o reflog é local (não vai com o clone nem com o push) e expira: 90 dias para entradas alcançáveis e 30 para as inalcançáveis.'),
          opc('b', 'Não: o reset apaga os objetos na hora', false, 'o reset só move ponteiros; os objetos ficam no armazém até o gc.'),
          opc('c', 'Sim, mas só no servidor', false, 'o reflog é local.')] }
    ],
    abas: [
      { rotulo: 'Perguntar ao histórico', blocos: [
        { tipo: 'texto', html:
          '<h3>Produção quebrou e o último deploy juntou 40 commits</h3>' +
          '<p>Ou alguém rodou o comando errado e o trabalho de dois dias "sumiu". Nos dois casos o histórico é a ferramenta: investigar é fazer perguntas ao grafo de commits; recuperar é lembrar que objetos são imutáveis e que só os ponteiros andaram.</p>' +
          '<h3>log -S, log -G e blame</h3>' +
          '<p><code>git log -S&lt;texto&gt;</code> (o <strong>pickaxe</strong>) lista os commits em que o <em>número de ocorrências</em> de um texto mudou: ou seja, quando ele foi introduzido ou removido. <code>-G&lt;regex&gt;</code> lista os commits cujo diff tem uma linha adicionada ou removida casando a regex, o que também pega alterações de valor. A diferença aparece num caso simples: a constante <code>TAXA</code> nasce com <code>0.10</code> e depois muda para <code>0.15</code>.</p>' },
        { tipo: 'rode', id: 'b6-rode-pickaxe', titulo: 'Quando a TAXA entrou e mudou', enunciado: 'Rode o pickaxe e compare com o <code>-G</code>, com o valor antigo e com o <code>blame</code>.',
          prefixo: '$', entrada: 'git log --oneline -S"TAXA" -- pricing.py', unidade: 'passo', terminalTitulo: 'pricing', etapas: etapasPickaxe(),
          prever: { pergunta: '<code>TAXA</code> nasce com 0.10 e depois muda para 0.15. O que <code>git log -S"TAXA"</code> lista?', opcoes: [
            { id: 'a', texto: 'Os dois commits: a criação e a mudança de valor.', correta: false, porque: 'no commit que só trocou o valor, o número de ocorrências de "TAXA" não mudou.' },
            { id: 'b', texto: 'Só o commit que criou a constante.', correta: true, porque: 'o -S conta ocorrências do texto; para ver a mudança de valor use -G ou -S com o valor.' },
            { id: 'c', texto: 'Nenhum: o -S procura só nas mensagens.', correta: false, porque: 'o pickaxe olha o conteúdo dos diffs.' }
          ] },
          tutorAntes: 'Aperte Enter e clique nas quatro etapas: -S, -G, -S com o valor antigo e blame.',
          tutorDepois: 'O <code>-S"TAXA"</code> só viu a criação. O <code>-G</code> viu as duas alterações, e o <code>-S"0.10"</code> acusa quem introduziu o valor e quem o retirou. Para uma função específica há <code>git log -L :nome:arquivo</code>, e <code>--follow</code> acompanha renomeações.',
          callout: 'Você viu a diferença entre contar ocorrências (-S) e casar o diff (-G).' },
        { tipo: 'texto', html:
          '<p><code>git blame</code> mostra, para cada linha, o último commit que a alterou. Aponta a última mudança, não a causa: para reformatações use <code>-w</code>, <code>-M</code>/<code>-C</code> (linhas movidas) e <code>--ignore-revs-file</code>.</p>' +
          '<h3>git bisect: busca binária no histórico</h3>' +
          '<p>Você diz um commit bom e um ruim, o Git faz checkout do meio, você declara bom ou ruim, e a cada passo o intervalo cai pela metade. Com N commits, são ~log₂ N testes (40 commits: 6). Com <code>git bisect run</code>, um script faz o julgamento; o exit code do script é a resposta:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Exit code do script</th><th>Significado para o bisect</th></tr></thead><tbody>' +
          '<tr><td>0</td><td>commit bom</td></tr>' +
          '<tr><td>1 a 127, exceto 125</td><td>commit ruim</td></tr>' +
          '<tr><td>125</td><td>não dá para testar este commit (não compila): pular</td></tr>' +
          '<tr><td>128 ou mais</td><td>erro: aborta a busca</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p>É a tabela de exit codes do bloco 1, agora usada por uma ferramenta. Na prática, o script de teste é qualquer comando que falha na presença do bug:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git bisect start; git bisect bad HEAD; git bisect good HEAD~7\nBisecting: 3 revisions left to test after this (roughly 2 steps)\n[ecb51edd2c47cd8d3933faef5eca1a777c08661d] mudança 3\n$ git bisect run python3 check.py | head -10\nrunning  \'python3\' \'check.py\'\nBisecting: 1 revision left to test after this (roughly 1 step)\n[5f1a749791fa0dcb2af2ea6ca019347a0ce00dc6] mudança 5\nrunning  \'python3\' \'check.py\'\nBisecting: 0 revisions left to test after this (roughly 0 steps)\n[6a6a49bda158d9e9cb26433b228652b91833db0b] mudança 4\nrunning  \'python3\' \'check.py\'\n6a6a49bda158d9e9cb26433b228652b91833db0b is the first bad commit\ncommit 6a6a49bda158d9e9cb26433b228652b91833db0b\nAuthor: Ada Lovelace <ada@example.com>' },
        { tipo: 'texto', html: '<p>De 8 commits, 3 testes. O mesmo cenário está no laboratório, com o commit culpado conhecido, para você comparar com o que o bisect encontra.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o script do bisect precisa viver fora da árvore que muda', html:
          '<p>O bisect faz checkout de commits antigos. Se o script de teste é um arquivo rastreado criado depois do bug, ele não existe nos commits mais antigos; se existe mas mudou, cada commit testa uma coisa diferente. No laboratório, <code>check.py</code> é commitado desde o primeiro commit para evitar isso; em casos reais, copie o script para fora do repositório (<code>/tmp/teste.sh</code>) e chame-o por caminho absoluto. E o ambiente: dependência instalada hoje pode não existir para o código de seis meses atrás; use 125 para "este commit não é testável".</p>' },
        { tipo: 'takeaway', html: '<mark>-S conta ocorrências</mark>, <mark>-G casa o diff</mark>; no bisect, o <mark>exit code</mark> do script é a resposta.' }
      ] },

      { rotulo: 'Desfazer', blocos: [
        { tipo: 'texto', html:
          '<h3>reset, revert e restore</h3>' +
          '<p>O <code>reset</code> opera sobre as três árvores do bloco 3 (HEAD, índice, diretório de trabalho). A diferença entre os modos é até onde ele desce:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Modo</th><th>Move a ref do branch</th><th>Reescreve o índice</th><th>Reescreve o trabalho</th></tr></thead><tbody>' +
          '<tr><td><code>--soft</code></td><td>sim</td><td>não</td><td>não</td></tr>' +
          '<tr><td><code>--mixed</code> (padrão)</td><td>sim</td><td>sim</td><td>não</td></tr>' +
          '<tr><td><code>--hard</code></td><td>sim</td><td>sim</td><td>sim (destrói edições não commitadas)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'rode', id: 'b6-rode-reset', titulo: 'Três resets, três destinos', enunciado: 'Rode o reset e percorra os três modos. No cenário, além do commit c3, o arquivo <code>f</code> tem uma edição que só existe no trabalho.',
          prefixo: '$', entrada: 'git reset --hard HEAD~1', unidade: 'passo', terminalTitulo: 'reset', etapas: etapasReset(),
          prever: { pergunta: 'Com <code>git reset --hard HEAD~1</code>, o que acontece com a linha "extra", editada em <code>f</code> e nunca adicionada nem commitada?', opcoes: [
            { id: 'a', texto: 'Fica como modificação não preparada, como no --mixed.', correta: false, porque: 'o --hard também reescreve o diretório de trabalho.' },
            { id: 'b', texto: 'Some do disco, e o Git não consegue recuperá-la.', correta: true, porque: 'o que nunca passou por <code>git add</code> ou commit não tem objeto; só o reflog de commits ajuda, e ela nunca foi commit.' },
            { id: 'c', texto: 'Vai para o stash automaticamente.', correta: false, porque: 'o reset não cria stash.' }
          ] },
          tutorAntes: 'Aperte Enter, depois clique em --soft, --mixed e --hard e compare o que sobra no status e em cat f.',
          tutorDepois: 'Em todos o HEAD voltou para c2. No <code>--soft</code>, a mudança do c3 segue staged (refazer o commit); no <code>--mixed</code>, vira edição não staged; no <code>--hard</code>, some do disco, junto com a edição extra que só existia no trabalho.',
          callout: 'Você viu até onde cada modo do reset desce.' },
        { tipo: 'abas', rotulo: 'O que cada modo faz', itens: [
          { rotulo: '--soft', blocos: [{ tipo: 'texto', html: '<p><code>git reset --soft HEAD~1</code>: move só a ref do branch. O índice e os arquivos ficam como estavam; o commit desfeito vira "alterações preparadas".</p>' }] },
          { rotulo: '--mixed', blocos: [{ tipo: 'texto', html: '<p><code>git reset HEAD~1</code>: move a ref e zera o índice. Os arquivos continuam como estavam; as alterações voltam a "não preparadas".</p>' }] },
          { rotulo: '--hard', blocos: [{ tipo: 'texto', html: '<p><code>git reset --hard HEAD~1</code>: move a ref, zera o índice e sobrescreve o diretório de trabalho. Edições não commitadas são perdidas para sempre; os commits ainda aparecem no reflog.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<p><code>git revert &lt;commit&gt;</code> não reescreve nada: cria um commit <em>novo</em> que desfaz o patch do alvo. É o desfazer para o histórico já publicado:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git revert --no-edit HEAD~1; git log --oneline; ls; cat f\n[main f6e60a5] Revert "c2 introduz g"\n Date: Thu Jan 1 12:11:00 2026 +0000\n 1 file changed, 1 deletion(-)\n delete mode 100644 g\nf6e60a5 Revert "c2 introduz g"\nee94771 c3 muda f\ne45860d c2 introduz g\naac8a0e c1\nf\na\nb' },
        { tipo: 'texto', html:
          '<p>Reverter um commit de merge exige dizer qual pai é a linha principal (<code>git revert -m 1 &lt;merge&gt;</code>); para reintroduzir o trabalho depois, reverta o revert. Para arquivos, o par moderno (Git 2.23+) é <code>git restore &lt;arq&gt;</code> (descarta a edição) e <code>git restore --staged &lt;arq&gt;</code> (tira do índice). <code>git clean -n</code> lista o que removeria dos não rastreados; <code>-f</code> remove sem volta.</p>' },
        { tipo: 'escolha', id: 'b6-escolha-revert', titulo: 'Confira: desfazer o publicado',
          pergunta: 'O commit ruim já foi para <code>origin/main</code> e colegas baseiam trabalho nele. Qual comando?',
          opcoes: [
            { id: 'a', texto: '<code>git revert &lt;hash&gt;</code>, que cria um commit inverso e mantém o histórico válido.', correta: true, porque: 'é aditivo: o histórico publicado continua válido e o efeito é anulado por um commit novo.' },
            { id: 'b', texto: '<code>git reset --hard HEAD~1</code> e <code>git push --force</code>.', correta: false, porque: 'reescreve o que outros já usam.' },
            { id: 'c', texto: '<code>git commit --amend</code> e push forçado.', correta: false, porque: 'mesmo problema: reescreve o publicado.' }
          ], tutorDepois: 'Revert para o publicado; reset/amend para o que ainda é só seu.' },
        { tipo: 'takeaway', html: '<mark>reset</mark> desce por três árvores; <mark>revert</mark> desfaz sem reescrever; <mark>restore</mark> cuida de arquivos.' }
      ] },

      { rotulo: 'Reflog, worktree e decisão', blocos: [
        { tipo: 'texto', html:
          '<h3>Reflog: o diário dos ponteiros</h3>' +
          '<p>Cada vez que HEAD ou um branch se move, o Git anota no <strong>reflog</strong> (<code>.git/logs/</code>) de onde e para onde. O <code>reset --hard</code> que "perdeu" dois commits apenas moveu o branch; os objetos continuam lá, alcançáveis pelo reflog:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git reset --hard HEAD~2; git reflog --format="%h %gd %gs"\nHEAD is now at d15a064 c1\nd15a064 HEAD@{0} reset: moving to HEAD~2\nea3a018 HEAD@{1} commit: c3 precioso\ne02ea3e HEAD@{2} commit: c2\nd15a064 HEAD@{3} commit (initial): c1\n$ git fsck --lost-found 2>&1 | head -3\ndangling commit ea3a018c686d5014eb9710c15c739fecf5e668f3' },
        { tipo: 'texto', html:
          '<p>O <code>git fsck --lost-found</code> acha objetos que nenhuma ref alcança ("dangling"), inclusive blobs que foram para o índice via <code>git add</code> e nunca viraram commit. É a rede de segurança para o <code>stash drop</code> acidental também.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Limites da recuperação', html:
          '<ol><li>O reflog é <strong>local</strong>: não vem com o clone nem vai com o push.</li>' +
          '<li>Ele <strong>expira</strong>: padrão de 90 dias para entradas ainda alcançáveis e 30 dias para as inalcançáveis (<code>gc.reflogExpire</code>, <code>gc.reflogExpireUnreachable</code>); depois o <code>git gc</code> pode apagar os objetos.</li>' +
          '<li>O que <strong>nunca passou por <code>git add</code> ou commit</strong> não tem objeto: um <code>reset --hard</code> ou <code>git checkout -- .</code> em arquivo só editado é irrecuperável pelo Git (o editor pode ter histórico local).</li></ol>' +
          '<p>A suíte do laboratório prova o item 2: após <code>reflog expire</code> e <code>gc --prune=now</code> o commit desaparece de fato.</p>' },
        { tipo: 'texto', html:
          '<h3>Worktree: vários diretórios, um repositório</h3>' +
          '<p><code>git worktree add</code> cria outro diretório de trabalho ligado ao <em>mesmo</em> banco de objetos, com HEAD e índice próprios. Serve para atender um hotfix sem stash nem clone, ou para rodar duas tarefas em paralelo (o bloco 4 do M01 usa isso para agentes concorrentes).</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git worktree add -q -b hotfix ../W-hotfix; git worktree list | sed -E "s/ +[0-9a-f]{7} / <hash> /"; cat ../W-hotfix/.git; ls .git/worktrees\n/tmp/demo-b6/W <hash> [main]\n/tmp/demo-b6/W-hotfix <hash> [hotfix]\ngitdir: /tmp/demo-b6/W/.git/worktrees/W-hotfix\nW-hotfix\n$ git worktree add ../W-outra main 2>&1 | grep fatal\nfatal: \'main\' is already checked out at \'/tmp/demo-b6/W\'' },
        { tipo: 'texto', html:
          '<p>Num worktree ligado, <code>.git</code> é um <em>arquivo</em> com o texto <code>gitdir: ...</code>, apontando para <code>.git/worktrees/&lt;nome&gt;</code> no repositório principal. Por isso o leitor do laboratório precisa seguir <code>gitdir</code> e <code>commondir</code>. A recusa do segundo comando é regra: o mesmo branch não pode estar em dois worktrees, porque cada um mexeria na mesma ref por baixo do outro.</p>' +
          '<h3>Qual comando para qual situação</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Situação</th><th>Comando</th></tr></thead><tbody>' +
          '<tr><td>Editei e quero descartar (não commitado)</td><td><code>git restore &lt;arq&gt;</code> (sem volta)</td></tr>' +
          '<tr><td>Commitei errado, ainda não publiquei</td><td><code>git reset --soft HEAD~1</code> (refazer) ou <code>git commit --amend</code></td></tr>' +
          '<tr><td>Commit ruim já em main compartilhada</td><td><code>git revert &lt;hash&gt;</code></td></tr>' +
          '<tr><td>Perdi commits após reset/rebase</td><td><code>git reflog</code>, depois <code>git branch rescue &lt;hash&gt;</code></td></tr>' +
          '<tr><td>Quebrou, não sei onde</td><td><code>git bisect run &lt;teste&gt;</code></td></tr>' +
          '<tr><td>Quando esta linha entrou?</td><td><code>git log -S</code> / <code>-G</code>, <code>git blame</code></td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'O reflog é um diário <mark>local</mark> que <mark>expira</mark>; o que nunca foi adicionado ao índice <mark>não volta</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Escreva a busca binária do bisect</h3>' +
          '<p>O <code>bisect run</code> é uma busca binária cujo veredito vem do exit code. Escreva as duas peças: a tabela de códigos e a busca.</p>' },
        { tipo: 'python', id: 'b6-python-bisect', titulo: 'Bisect com exit codes', obrigatorio: false,
          enunciado: 'Complete <code>classificar(code)</code> (0 bom; 125 pular; 128 ou mais abortar; demais ruim) e <code>primeiro_ruim(commits, rodar)</code>: busca binária entre <code>commits[0]</code> (bom) e <code>commits[-1]</code> (ruim), devolvendo o primeiro commit ruim e quantos testes foram executados.',
          codigo: codigoBisect, testes: testesBisect,
          dica: 'Em <code>classificar</code>, teste 0, depois 125, depois <code>&gt;= 128</code>; o resto é "ruim". Na busca: <code>while hi - lo &gt; 1:</code>, <code>mid = (lo + hi) // 2</code>; "bom" move <code>lo = mid</code>, "ruim" move <code>hi = mid</code>; conte cada teste.',
          solucao: solucaoBisect,
          tutorDepois: 'Repare no controle negativo: 125 não é "ruim". Se o script marcasse como ruim um commit que só não compila, o bisect apontaria o culpado errado. E 40 commits cabem em, no máximo, 6 testes.',
          callout: 'Sua busca binária reproduz o bisect e respeita a tabela de exit codes.' },
        { tipo: 'cenario', id: 'b6-cenario-reflog', titulo: 'O commit precioso que sumiu', obrigatorio: false,
          enunciado: 'Você rodou <code>git reset --hard HEAD~2</code> e perdeu dois commits, um deles o "c3 precioso". Ninguém mais tem esse trabalho. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O <code>git log</code> não mostra mais o c3. O que faz?', opcoes: [
              { texto: 'Refazer o trabalho do zero: o reset apagou os commits.', vai: 'f-refez', tom: 'ruim', consequencia: 'o reset só moveu o ponteiro; os objetos seguem no armazém, e dois dias de trabalho foram refeitos sem necessidade.' },
              { texto: 'git reflog para achar onde o branch estava.', vai: 'achou', tom: 'ok', consequencia: 'o reflog anota cada movimento de HEAD: "HEAD@{1} commit: c3 precioso".' },
              { texto: 'git gc --prune=now para "limpar" e recomeçar.', vai: 'f-gc', tom: 'ruim', consequencia: 'o gc descarta objetos inalcançáveis: é o comando que torna a perda definitiva.' }
            ] },
            achou: { texto: 'O reflog mostra <code>ea3a018 HEAD@{1} commit: c3 precioso</code>. Como resgatar?', opcoes: [
              { texto: 'git branch rescue ea3a018, para dar uma ref ao commit.', vai: 'f-bom', tom: 'ok', consequencia: 'com um branch apontando para ele, o commit volta a ser alcançável e o gc deixa de ser ameaça.' },
              { texto: 'Anotar o hash e voltar depois, sem criar ref.', vai: 'f-expira', tom: 'ruim', consequencia: 'sem ref, o commit continua só no reflog, que expira (30 dias para inalcançáveis) e é local.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Commit recuperado em um branch de resgate. O reflog é local e expira, então a recuperação deve ser feita logo.' },
            'f-refez': { bom: false, texto: 'O trabalho foi refeito do zero, embora o commit estivesse no armazém, alcançável pelo reflog.' },
            'f-gc': { bom: false, texto: 'Depois do gc, o commit desapareceu de fato: a perda passou de aparente a definitiva.' },
            'f-expira': { bom: false, texto: 'Semanas depois, a entrada do reflog expirou e o gc levou o commit.' }
          },
          callout: 'Você recuperou o commit pelo reflog e deu a ele uma ref.' },
        { tipo: 'complete', id: 'b6-complete-situacao', titulo: 'Qual comando para qual situação', linguagem: 'bash', obrigatorio: false,
          enunciado: 'Escolha o comando certo para cada situação do quadro.',
          partes: [
            '# commitei errado, ainda não publiquei, e quero refazer o commit\ngit reset ', { lacuna: 'modo', opcoes: ['--soft', '--hard', 'push --force'], correta: '--soft' },
            ' HEAD~1\n\n# o commit ruim já está na main compartilhada\ngit ', { lacuna: 'desfaz', opcoes: ['revert', 'reset --hard', 'restore'], correta: 'revert' },
            ' <hash>\n\n# perdi commits depois de um reset: onde estavam?\ngit ', { lacuna: 'diario', opcoes: ['reflog', 'log', 'stash list'], correta: 'reflog' },
            '\n\n# achar o commit que quebrou, com um teste automático\ngit bisect ', { lacuna: 'busca', opcoes: ['run', 'skip', 'reset'], correta: 'run' },
            ' /tmp/teste.sh\n'
          ],
          explicacao: '<code>--soft</code> refaz o commit sem tocar em índice nem trabalho; <code>--hard</code> destruiria edições. <code>revert</code> é aditivo e serve para o histórico já publicado. O <code>reflog</code> é o diário dos ponteiros (<code>git log</code> só mostra o que o branch alcança). E o script de teste do <code>bisect run</code> vive fora do repositório (<code>/tmp/teste.sh</code>), por caminho absoluto.',
          callout: 'Quadro de situações montado.' },
        { tipo: 'escolha', id: 'b6-escolha-hard', titulo: 'Confira: o que o Git não devolve',
          pergunta: 'Você editou <code>relatorio.py</code> por duas horas, sem nunca rodar <code>git add</code>, e então rodou <code>git checkout -- .</code>. É possível recuperar a edição pelo Git?',
          opcoes: [
            { id: 'a', texto: 'Não: o que nunca passou por <code>git add</code> ou commit não tem objeto; o editor pode ter histórico local.', correta: true, porque: 'o reflog e o <code>fsck --lost-found</code> só alcançam objetos; um blob só existe depois do <code>git add</code>.' },
            { id: 'b', texto: 'Sim, pelo reflog.', correta: false, porque: 'o reflog registra movimento de ponteiros, não edições soltas.' },
            { id: 'c', texto: 'Sim, com <code>git fsck --lost-found</code>.', correta: false, porque: 'o fsck acha objetos pendentes; sem add, não houve objeto.' }
          ], tutorDepois: 'Se tivesse rodado <code>git add</code> uma vez, haveria um blob "dangling" a recuperar.' },
        { tipo: 'escolha', id: 'b6-escolha-bisect-script', titulo: 'Confira: onde mora o script do bisect',
          pergunta: 'Você criou <code>teste.sh</code> dentro do repositório e o commitou depois do bug. Por que o <code>bisect run</code> vai se comportar de forma estranha?',
          opcoes: [
            { id: 'a', texto: 'O bisect faz checkout de commits antigos; o script não existe neles, ou muda a cada commit. Copie-o para fora (<code>/tmp/teste.sh</code>) e chame por caminho absoluto.', correta: true, porque: 'cada commit deve ser julgado pelo mesmo teste; para commits não testáveis use o código 125.' },
            { id: 'b', texto: 'O bisect só aceita scripts em Python.', correta: false, porque: 'qualquer comando serve; o que importa é o exit code.' },
            { id: 'c', texto: 'O bisect ignora scripts rastreados.', correta: false, porque: 'não ignora; o problema é o script sumir ou mudar no checkout.' }
          ], tutorDepois: 'Determinismo: o mesmo teste, em todos os commits.' },
        { tipo: 'takeaway', html: 'Para <mark>investigar</mark>: -S/-G, blame, bisect run. Para <mark>recuperar</mark>: reflog primeiro, <mark>gc nunca</mark>.' }
      ] }
    ]
  });
})();
