/* F01 · Bloco 2: sistema de arquivos e composição de ferramentas. Fonte: F01.html#b02. Saídas: execução real de 11/10/2026 (fonte); inodes, datas e donos variam. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function py(linhas) { return linhas.join('\n') + '\n'; }

  var etapasLinks = function () {
    return [
      { id: 'antes', nome: 'Dois nomes, um inode', descricao: 'Estado depois de ln e ln -s', tom: 'dns', ms: 1, linhas: [
        L('info', 'ln src/app.py src/hard.py; ln -s app.py src/soft.py'),
        L('out', '1655 -rwxr--r-- 2 ada ada 9 Oct 11 17:16 app.py'),
        L('out', '1655 -rwxr--r-- 2 ada ada 9 Oct 11 17:16 hard.py'),
        L('out', '1676 lrwxrwxrwx 1 ada ada 6 Oct 11 17:16 soft.py -> app.py'),
        L('hint', 'app.py e hard.py têm o mesmo inode (1655) e contagem de links 2; o symlink é outro inode que guarda o texto "app.py"')] },
      { id: 'rm', nome: 'rm src/app.py', descricao: 'Remove um nome, não "o arquivo"', tom: 'tcp', ms: 1, linhas: [
        L('cmd', 'rm src/app.py'),
        L('hint', 'rm é unlink: decrementa a contagem de links do inode 1655 de 2 para 1')] },
      { id: 'hard', nome: 'cat src/hard.py', descricao: 'O inode ainda tem um nome', tom: 'tls', ms: 1, linhas: [
        L('cmd', 'cat src/hard.py'),
        L('out', 'trocado'),
        L('hint', 'o dado só é liberado quando a contagem chega a zero e nenhum processo o mantém aberto')] },
      { id: 'soft', nome: 'cat src/soft.py', descricao: 'O symlink aponta para um nome que sumiu', tom: 'request', ms: 1, linhas: [
        L('cmd', 'cat src/soft.py'),
        L('out', 'cat: src/soft.py: No such file or directory'),
        L('out', 'lrwxrwxrwx 1 ada ada 6 Oct 11 17:16 src/soft.py -> app.py'),
        L('hint', 'o symlink continua existindo, mas o caminho "app.py" é resolvido a cada acesso e não existe mais')] }
    ];
  };

  var etapasCrlf = function () {
    return [
      { id: 'prep', nome: 'Criar o script', descricao: 'Shebang e chmod +x', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'printf "#!/bin/sh\\r\\necho oi\\r\\n" > crlf.sh; chmod +x crlf.sh'),
        L('hint', 'o arquivo foi gravado com fim de linha CRLF (\\r\\n), como no Windows clássico')] },
      { id: 'exec', nome: 'Executar', descricao: 'O kernel lê a linha #!', tom: 'tcp', ms: 1, linhas: [
        L('cmd', './crlf.sh; echo "exit=$?"'),
        L('out', 'oi'),
        L('out', 'exit=0')] },
      { id: 'fim', nome: 'Defesa de repositório', descricao: '.gitattributes', tom: 'ink', ms: 1, linhas: [
        L('info', '.gitattributes: * text=auto eol=lf   (ou *.sh text eol=lf)'),
        L('hint', 'a escolha de fim de linha fica no repositório, independente do core.autocrlf de cada máquina')] }
    ];
  };

  var codigoRedir = py([
    'def redirecionar(redirs):',
    '    """redirs: redirecionamentos na ordem em que aparecem, ex.: [">log", "2>&1"].',
    '    Devolve {1: destino do stdout, 2: destino do stderr}."""',
    '    fd = {1: "terminal", 2: "terminal"}',
    '    for r in redirs:',
    '        if r.startswith("&>"):',
    '            fd[1] = fd[2] = r[2:]',
    '        elif r == "2>&1":',
    '            pass  # o fd 2 passa a apontar para onde o fd 1 aponta AGORA',
    '        elif r.startswith("2>"):',
    '            fd[2] = r[2:]',
    '        elif r.startswith(">"):',
    '            fd[1] = r[1:]',
    '    return fd',
    '',
    '',
    'print(redirecionar([">log", "2>&1"]))',
    'print(redirecionar(["2>&1", ">log"]))'
  ]);
  var testesRedir = py([
    'def test_ordem_certa_junta_tudo_no_arquivo():',
    '    assert redirecionar([">log", "2>&1"]) == {1: "log", 2: "log"}',
    '',
    'def test_ordem_invertida_erro_fica_no_terminal():',
    '    assert redirecionar(["2>&1", ">log"]) == {1: "log", 2: "terminal"}',
    '',
    'def test_so_stderr():',
    '    assert redirecionar(["2>erros.txt"]) == {1: "terminal", 2: "erros.txt"}',
    '',
    'def test_atalho_bash():',
    '    assert redirecionar(["&>log"]) == {1: "log", 2: "log"}',
    '',
    'def test_controle_negativo_sem_redirecionamento():',
    '    assert redirecionar([]) == {1: "terminal", 2: "terminal"}',
    '',
    'def test_borda_copia_nao_e_alias():',
    '    # 2>&1 copia o destino de agora; mudar o fd 1 depois não move o fd 2',
    '    r = redirecionar([">a", "2>&1", ">b"])',
    '    assert r == {1: "b", 2: "a"}'
  ]);
  var solucaoRedir = py([
    'def redirecionar(redirs):',
    '    fd = {1: "terminal", 2: "terminal"}',
    '    for r in redirs:',
    '        if r.startswith("&>"):',
    '            fd[1] = fd[2] = r[2:]',
    '        elif r == "2>&1":',
    '            fd[2] = fd[1]',
    '        elif r.startswith("2>"):',
    '            fd[2] = r[2:]',
    '        elif r.startswith(">"):',
    '            fd[1] = r[1:]',
    '    return fd'
  ]);

  var codigoPerm = py([
    'def modo_simbolico(modo):',
    '    """Ex.: 0o644 -> "rw-r--r--"."""',
    '    texto = ""',
    '    for deslocamento in (6, 3, 0):          # dono, grupo, outros',
    '        bits = (modo >> deslocamento) & 0o7',
    '        # acrescente "r" se o bit 4 está ligado, "w" se o 2, "x" se o 1; senão "-"',
    '    return texto',
    '',
    '',
    'def aplicar_umask(modo, umask):',
    '    """A umask só remove bits; nunca acrescenta."""',
    '    return modo',
    '',
    '',
    'print(modo_simbolico(0o755), oct(aplicar_umask(0o666, 0o022)))'
  ]);
  var testesPerm = py([
    'def test_modos_comuns():',
    '    assert modo_simbolico(0o644) == "rw-r--r--"',
    '    assert modo_simbolico(0o755) == "rwxr-xr-x"',
    '    assert modo_simbolico(0o600) == "rw-------"',
    '',
    'def test_borda_zero_e_tudo():',
    '    assert modo_simbolico(0o000) == "---------"',
    '    assert modo_simbolico(0o777) == "rwxrwxrwx"',
    '',
    'def test_umask_022_da_644():',
    '    assert aplicar_umask(0o666, 0o022) == 0o644',
    '    assert aplicar_umask(0o777, 0o022) == 0o755',
    '',
    'def test_umask_077_so_dono():',
    '    assert aplicar_umask(0o666, 0o077) == 0o600',
    '',
    'def test_controle_negativo_umask_nunca_acrescenta():',
    '    assert aplicar_umask(0o600, 0o000) == 0o600',
    '    assert aplicar_umask(0o600, 0o022) == 0o600'
  ]);
  var solucaoPerm = py([
    'def modo_simbolico(modo):',
    '    texto = ""',
    '    for deslocamento in (6, 3, 0):',
    '        bits = (modo >> deslocamento) & 0o7',
    '        texto += "r" if bits & 4 else "-"',
    '        texto += "w" if bits & 2 else "-"',
    '        texto += "x" if bits & 1 else "-"',
    '    return texto',
    '',
    '',
    'def aplicar_umask(modo, umask):',
    '    return modo & ~umask'
  ]);

  TrilhaAula.registrar({
    id: 'f01-b2',
    titulo: 'Sistema de arquivos e composição de ferramentas',
    minutos: 35,
    resumo: 'Nome de arquivo não é o arquivo: é uma entrada que aponta para um inode. O resto (permissões, texto, pipes) vem daí.',
    objetivo: 'Distinguir hard link de symlink, ler permissões em octal, evitar os acidentes de nome e de variável vazia e compor ferramentas com redirecionamentos na ordem certa.',
    revisao: [
      { id: 'f01b2-links', pergunta: 'Depois de <code>ln -s alvo.txt atalho</code> e <code>rm alvo.txt</code>, o que faz <code>cat atalho</code>? E se fosse um hard link?',
        opcoes: [
          opc('a', 'Symlink: erro "No such file or directory"; hard link: continua mostrando o conteúdo', true, 'o symlink guarda um caminho, resolvido a cada acesso; o hard link é outro nome para o mesmo inode, que só é liberado quando a contagem chega a zero.'),
          opc('b', 'Os dois continuam mostrando o conteúdo', false, 'o symlink depende do nome que foi removido.'),
          opc('c', 'Symlink: mostra o conteúdo; hard link: erro', false, 'é o contrário: rm remove um nome, não "o arquivo".')] },
      { id: 'f01b2-redir', pergunta: 'Qual é o resultado de <code>ls /nao/existe 2&gt;&amp;1 &gt; log.txt</code>?',
        opcoes: [
          opc('a', 'A mensagem de erro aparece na tela e o arquivo fica vazio', true, 'os redirecionamentos são lidos da esquerda para a direita: o fd 2 copiou o fd 1 ainda apontando para o terminal; só depois o fd 1 foi para o arquivo.'),
          opc('b', 'A mensagem vai para o arquivo', false, 'essa é a ordem <code>&gt; log.txt 2&gt;&amp;1</code>.'),
          opc('c', 'Os dois streams se perdem', false, 'nada foi enviado para /dev/null.')] },
      { id: 'f01b2-xargs', pergunta: 'Por que <code>find . -name "*.tmp" | xargs rm</code> é perigoso com nomes que têm espaço?',
        opcoes: [
          opc('a', 'O xargs separa a entrada por espaço em branco: <code>meu relatorio.tmp</code> vira dois argumentos', true, 'use <code>find -print0 | xargs -0 rm</code> ou <code>find -exec rm {} +</code>.'),
          opc('b', 'O find não imprime nomes com espaço', false, 'imprime; o problema está em como o xargs lê.'),
          opc('c', 'O rm recusa nomes com espaço', false, 'o rm recebe nomes quebrados em dois.')] },
      { id: 'f01b2-dir', pergunta: 'Em um diretório, o que permitem os bits r, w e x?',
        opcoes: [
          opc('a', 'r lista os nomes, w cria/remove entradas (com x), x permite atravessar', true, 'sem x você não alcança nem um arquivo cujo nome conhece.'),
          opc('b', 'x permite executar os arquivos dentro dele', false, 'em arquivo, x executa; em diretório, atravessa.'),
          opc('c', 'w permite editar o conteúdo dos arquivos dentro', false, 'quem decide isso é a permissão de cada arquivo; o w do diretório é sobre entradas.')] },
      { id: 'f01b2-vazia', pergunta: 'O que impede que <code>rm -rf "$D/"</code> vire <code>rm -rf /</code> quando <code>D</code> está vazia?',
        opcoes: [
          opc('a', '<code>"${D:?mensagem}/"</code> ou <code>set -u</code>, que abortam com variável vazia ou não definida', true, 'custam uma linha e transformam o desastre em erro.'),
          opc('b', 'Aspas simples em volta da variável', false, 'aspas simples impedem a expansão e o comando deixa de fazer o que você queria.'),
          opc('c', 'Nada: o rm se recusa a apagar a raiz', false, 'não conte com isso: o alvo seria tudo que o usuário alcança.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Três acidentes, uma causa</h3>' +
          '<p>Um script de limpeza roda <code>rm -rf "$BUILD_DIR/"</code> com a variável vazia e apaga a raiz do que o usuário alcança. Um <code>.sh</code> editado no Windows falha no Linux com <code>bad interpreter</code>. Um <code>find | xargs</code> funciona por meses e quebra no dia em que alguém cria um arquivo com espaço no nome. Em todos, o erro é tratar nome de arquivo como texto simples e ignorar o que o sistema de arquivos e o shell realmente fazem.</p>' },
        { tipo: 'texto', html:
          '<h3>Caminhos: absoluto, relativo e o diretório corrente</h3>' +
          '<p>Um caminho <strong>absoluto</strong> começa em <code>/</code> (raiz) e aponta para um lugar inequívoco. Um caminho <strong>relativo</strong> é resolvido a partir do cwd do processo. <code>.</code> é o diretório corrente, <code>..</code> o pai. Dois pontos importam na prática.</p>' +
          '<ul><li>O cwd pertence ao processo, então o mesmo script com o mesmo argumento relativo faz coisas diferentes conforme quem o chamou (cron, CI e IDE têm cwd diferentes).</li>' +
          '<li><code>a/../b</code> não equivale a <code>b</code> quando <code>a</code> é symlink: o kernel resolve <code>..</code> depois de seguir o link. <code>realpath</code> devolve o caminho canônico, com links resolvidos.</li></ul>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ mkdir -p proj/src proj/docs; cd proj; echo "print(1)" > src/app.py; pwd; cd src; pwd; cd ..; ls ./src/../docs; realpath src/../src/app.py\n/tmp/demo-b2/proj\n/tmp/demo-b2/proj/src\n/tmp/demo-b2/proj/src/app.py' },
        { tipo: 'texto', html: '<p>Em scripts, ancore em algo estável (<code>cd "$(dirname "$0")"</code>; em Python, <code>Path(__file__).resolve().parent</code>) em vez de confiar no cwd herdado.</p>' +
          '<h3>Nome, inode e link</h3>' +
          '<p>No Unix, o nome de um arquivo não é o arquivo. Um diretório é uma tabela que mapeia <strong>nomes para inodes</strong>; o <strong>inode</strong> guarda o dono, as permissões, os tempos, o tamanho e a localização dos blocos de dados. Um <strong>hard link</strong> é outra entrada de diretório apontando para o mesmo inode; o inode mantém uma contagem de links. Remover um nome (<code>rm</code> é <em>unlink</em>) decrementa a contagem, e o dado só é liberado quando chega a zero e nenhum processo mantém o arquivo aberto. Um <strong>symlink</strong> é um arquivo à parte, cujo conteúdo é um caminho em texto, resolvido a cada acesso.</p>' },
        { tipo: 'texto', html:
          '<p>No exemplo do módulo, <code>src/app.py</code> e <code>src/hard.py</code> são dois nomes do inode 1655 (links = 2), e <code>src/soft.py</code> é outro inode (1676) cujo conteúdo é o texto <code>app.py</code>. Apagar <code>app.py</code> baixa os links para 1: <code>hard.py</code> segue lendo os blocos; <code>soft.py</code> aponta para um nome que não existe mais.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Escrever no mesmo inode × escrever em outro', html:
          '<p><code>echo trocado &gt; src/app.py</code> truncou e reescreveu o <em>mesmo</em> inode, por isso o hard link viu a mudança. Muitos editores gravam salvando num arquivo novo e renomeando por cima (escrita atômica): o nome passa a apontar para outro inode, e hard links antigos continuam com o conteúdo velho. O rename atômico e o que o <code>fsync</code> garante estão no LT01, bloco 2.</p>' },
        { tipo: 'takeaway', html: 'Nome é <mark>entrada de diretório que aponta para um inode</mark>; <code>rm</code> remove um nome, não "o arquivo".' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html: '<p>Hard link e symlink apontam para o mesmo arquivo, mas de jeitos diferentes. Preveja o que acontece quando o nome original some.</p>' },
        { tipo: 'rode', id: 'b2-rode-links', titulo: 'Apague o nome original', enunciado: 'Há três nomes: <code>app.py</code>, um hard link <code>hard.py</code> e um symlink <code>soft.py</code>. Rode a remoção e leia cada <code>cat</code>.',
          prefixo: '$', entrada: 'rm src/app.py; cat src/hard.py; cat src/soft.py', unidade: 'passo', terminalTitulo: 'proj', etapas: etapasLinks(),
          prever: { pergunta: 'Depois de <code>rm src/app.py</code>, o que fazem <code>cat src/hard.py</code> e <code>cat src/soft.py</code>?', opcoes: [
            { id: 'a', texto: 'Os dois mostram o conteúdo.', correta: false, porque: 'o symlink guarda o texto "app.py" e o resolve a cada acesso: sem o nome, falha.' },
            { id: 'b', texto: 'O hard link mostra o conteúdo; o symlink dá "No such file or directory".', correta: true, porque: 'o inode ainda tem um nome (links = 1); o symlink aponta para um caminho que não existe mais.' },
            { id: 'c', texto: 'Os dois dão erro, pois o original sumiu.', correta: false, porque: 'o conteúdo mora no inode, e o hard link ainda o referencia.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em cada etapa. Compare o número do inode nas duas primeiras linhas.',
          tutorDepois: 'Hard link é outro nome para o mesmo inode; o conteúdo só é liberado quando a contagem de links chega a zero e ninguém mais o mantém aberto. Symlink é um texto, e texto pode apontar para o nada.',
          callout: 'Você viu o hard link sobreviver e o symlink quebrar.' },
        { tipo: 'texto', html:
          '<h3>Permissões e dono</h3>' +
          '<p>Cada inode tem um dono (usuário), um grupo e nove bits: <code>r</code>, <code>w</code>, <code>x</code> para dono, grupo e outros. Em octal, r=4 w=2 x=1, então <code>644</code> é <code>rw-r--r--</code> e <code>755</code> é <code>rwxr-xr-x</code>. Em arquivo, <code>x</code> permite executar. Em diretório, <code>r</code> permite listar os nomes e <code>x</code> permite atravessar (acessar entradas dentro dele); sem <code>x</code> você nem abre um arquivo cujo nome conhece.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ ls -l src/app.py; stat -c "%n modo=%a (%A) dono=%U inode=%i links=%h tamanho=%s" src/app.py\n-rw-r--r-- 1 ada ada 9 Oct 11 17:16 src/app.py\nsrc/app.py modo=644 (-rw-r--r--) dono=ada inode=1655 links=1 tamanho=9\n$ chmod 000 src; ls src; echo "ls=$?"; chmod 755 src\nls: cannot open directory \'src\': Permission denied\nls=2' },
        { tipo: 'texto', html:
          '<p>A <strong>umask</strong> é uma máscara subtraída das permissões de criação: com <code>0022</code>, arquivos novos nascem 644; com <code>077</code>, 600. Valores comuns: 644 para arquivos, 755 para programas e diretórios, 600 para segredos. O <code>chmod</code> simbólico altera só o que você diz: <code>chmod u+x script.sh</code>, <code>chmod go-w arquivo</code>, <code>chmod a=r arquivo</code>.</p>' +
          '<p>Duas ressalvas sobre o Git: ele registra só um bit de permissão (modos <code>100644</code> e <code>100755</code>) e nenhum dono. E <code>chmod 777</code> como "conserto" esconde que o dono ou o grupo estava errado.</p>' },
        { tipo: 'texto', html:
          '<h3>Codificação e fim de linha</h3>' +
          '<p>Um arquivo é uma sequência de bytes. <strong>Texto</strong> é uma interpretação desses bytes por uma <strong>codificação</strong>. A palavra <em>café</em> ocupa 5 bytes em UTF-8 (o <em>é</em> vale 2) e 4 em Latin-1. Abrir um com a codificação do outro gera mojibake (<code>cafÃ©</code>) ou erro de decodificação.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ printf "caf\\xc3\\xa9\\n" > utf8.txt; printf "caf\\xe9\\n" > latin1.txt; file utf8.txt latin1.txt; wc -c utf8.txt latin1.txt; iconv -f latin1 -t utf-8 latin1.txt | cmp - utf8.txt && echo iguais\nutf8.txt:   Unicode text, UTF-8 text\nlatin1.txt: ISO-8859 text\n 6 utf8.txt\n 5 latin1.txt\n11 total\niguais' },
        { tipo: 'texto', html:
          '<p>Padrão do curso: <strong>UTF-8, sem BOM, sempre explícito</strong> (em Python, <code>open(..., encoding="utf-8")</code>; o padrão do Windows historicamente não era UTF-8). O segundo vilão é o fim de linha: Unix usa LF (<code>\\n</code>), Windows clássico usa CRLF (<code>\\r\\n</code>). O kernel lê a linha <code>#!/bin/sh\\r</code> e procura um interpretador chamado literalmente <code>/bin/sh^M</code>.</p>' },
        { tipo: 'quebre', id: 'b2-quebre-crlf', titulo: 'Quando o fim de linha quebra o script', obrigatorio: false,
          enunciado: 'Escolha a falha, rode, e depois rode "Sem falha" para fechar o exercício. Saídas do módulo.',
          prefixo: '$', entrada: './crlf.sh; echo "exit=$?"', unidade: 'passo', terminalTitulo: 'proj', etapas: etapasCrlf(),
          falhas: [
            { id: 'crlf', rotulo: 'Script salvo com CRLF', efeito: { etapaFalha: 'exec', linhasErro: [
              L('cmd', './crlf.sh; echo "exit=$?"'),
              L('out', 'bash: ./crlf.sh: /bin/sh^M: bad interpreter: No such file or directory'),
              L('out', 'exit=126')],
              tutor: 'O kernel leu a linha #!/bin/sh\\r e procurou um interpretador chamado literalmente /bin/sh^M. O conserto imediato é sed -i "s/\\r$//" crlf.sh; o definitivo é um .gitattributes com * text=auto eol=lf (ou *.sh text eol=lf).' } }
          ],
          tutorDepois: 'A defesa é de repositório, não de memória. No lab, o <code>pgrep</code> preserva o <code>\\r</code> de propósito: um padrão <code>fim$</code> não casa com <code>fim\\r\\n</code>, o que faz o mesmo <code>grep</code> "falhar" em arquivos do Windows.',
          callout: 'Você viu o CRLF derrubar o shebang e o .gitattributes impedir isso.' },
        { tipo: 'takeaway', html: 'Em diretório, <mark>x é atravessar</mark>; texto é bytes mais codificação: <mark>UTF-8 e LF</mark>, explícitos.' }
      ] },

      { rotulo: 'Compor ferramentas', blocos: [
        { tipo: 'texto', html:
          '<h3>Achar e filtrar: find e grep</h3>' +
          '<p><code>find</code> percorre uma árvore e avalia uma expressão por entrada: <code>-type f</code>, <code>-name \'*.md\'</code> (glob entre aspas, para o shell não expandir antes), <code>-mtime -7</code>, <code>-size +1M</code>, e ações como <code>-exec cmd {} +</code> e <code>-delete</code>. <code>grep</code> filtra linhas por regex: <code>-r</code> recursivo, <code>-n</code> número da linha, <code>-i</code> sem distinção de caixa, <code>-l</code> só nomes, <code>-c</code> contagem, <code>-E</code> regex estendida, <code>-F</code> literal, <code>-v</code> inverte.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ grep -rn "TODO" --include="*.md" . | sort\n./docs/com espaco.md:1:TODO c\n./docs/notas.md:1:TODO: a\n./docs/notas.md:3:TODO: b' },
        { tipo: 'texto', html:
          '<p>Ferramentas modernas (ripgrep, fd) são mais rápidas e respeitam <code>.gitignore</code>, mas não são padrão em todo lugar: scripts com <code>find</code>/<code>grep</code>, dia a dia com as modernas.</p>' +
          '<h3>Redirecionamento, pipes e a filosofia Unix</h3>' +
          '<p>Redirecionar religa um descritor: <code>&gt; arq</code> (fd 1 para o arquivo, truncando), <code>&gt;&gt; arq</code> (anexa), <code>&lt; arq</code> (fd 0 vem do arquivo), <code>2&gt; arq</code> (fd 2), <code>2&gt;&amp;1</code> ("fd 2 passa a apontar para onde o fd 1 aponta <em>agora</em>"). Um pipe <code>a | b</code> cria um canal em memória com buffer limitado (64 KiB por padrão no Linux): se o leitor é lento, o escritor bloqueia, o que dá contrapressão de graça. Os processos de um pipeline rodam <em>ao mesmo tempo</em>, não um após o outro.</p>' +
          '<p>A ordem dos redirecionamentos é lida da esquerda para a direita, e é aí que veteranos tropeçam:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ ls /nao/existe > log.txt 2>&1; echo "--- log.txt:"; cat log.txt\n--- log.txt:\nls: cannot access \'/nao/existe\': No such file or directory\n$ ls /nao/existe 2>&1 > log2.txt; echo "--- log2.txt:"; cat log2.txt\nls: cannot access \'/nao/existe\': No such file or directory\n--- log2.txt:' },
        { tipo: 'texto', html:
          '<p>Em <code>&gt; log.txt 2&gt;&amp;1</code>, o fd 1 vai para o arquivo e depois o fd 2 copia o fd 1 (também o arquivo). Em <code>2&gt;&amp;1 &gt; log2.txt</code>, o fd 2 copia o fd 1 ainda apontando para o terminal, e só então o fd 1 vai para o arquivo: a mensagem de erro aparece na tela e o arquivo fica vazio.</p>' +
          '<p>A filosofia Unix (Doug McIlroy, <em>Bell System Technical Journal</em>, 1978): programas que fazem uma coisa bem, que trabalham juntos, com texto como interface universal. Daí <code>sort | uniq -c | sort -rn | head</code>: quatro ferramentas triviais, um ranking de frequência.</p>' +
          '<p>A regra de projeto para qualquer ferramenta que você escreva: <strong>dados no stdout, diagnóstico no stderr, resultado no exit code</strong>. É o contrato que permite compor programas, e é a interface pela qual um agente de código decide se o comando funcionou.</p>' },
        { tipo: 'python', id: 'b2-python-redir', titulo: 'Simule a tabela de descritores', obrigatorio: false,
          enunciado: 'Complete <code>redirecionar(redirs)</code>: percorra os redirecionamentos <strong>na ordem</strong> e devolva o destino final de stdout (1) e stderr (2). O <code>2&gt;&amp;1</code> copia o destino que o fd 1 tem <em>naquele momento</em>.',
          codigo: codigoRedir, testes: testesRedir,
          dica: 'No ramo <code>2&gt;&amp;1</code>, escreva <code>fd[2] = fd[1]</code>. É uma cópia do valor atual, não um alias: por isso a ordem muda o resultado.',
          solucao: solucaoRedir,
          tutorDepois: 'O teste da borda mostra o ponto: <code>&gt;a 2&gt;&amp;1 &gt;b</code> deixa o stderr em <code>a</code> e o stdout em <code>b</code>.',
          callout: 'A ordem dos redirecionamentos agora é código que você controla.' },
        { tipo: 'python', id: 'b2-python-perm', titulo: 'Octal, símbolos e umask', obrigatorio: false,
          enunciado: 'Complete <code>modo_simbolico(modo)</code> (por exemplo, <code>0o644</code> vira <code>"rw-r--r--"</code>) e <code>aplicar_umask(modo, umask)</code>: a umask só remove bits.',
          codigo: codigoPerm, testes: testesPerm,
          dica: 'Para cada grupo de três bits, teste <code>bits &amp; 4</code>, <code>bits &amp; 2</code> e <code>bits &amp; 1</code>. A umask remove com <code>modo &amp; ~umask</code>.',
          solucao: solucaoPerm,
          tutorDepois: 'Com 0022, o arquivo novo (base 666) nasce 644 e o diretório (base 777) nasce 755. A umask nunca acrescenta bits.',
          callout: 'Você calculou permissões e umask sem decorar tabela.' },
        { tipo: 'texto', html:
          '<h3>Exemplo trabalhado: espaços em nomes e o xargs</h3>' +
          '<p>O <code>xargs</code> lê itens da entrada e monta a linha de comando de outro programa. Por padrão separa por qualquer espaço em branco, e é aí que quebra:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ find . -name "*.md" | xargs wc -l 2>&1 | tail -3\nwc: ./docs/com: No such file or directory\nwc: espaco.md: No such file or directory\n 3 total\n$ find . -name "*.md" -print0 | xargs -0 wc -l\n 3 ./docs/notas.md\n 1 ./docs/com espaco.md\n 4 total\n$ find . -name "*.md" -exec grep -c TODO {} +\n./docs/notas.md:2\n./docs/com espaco.md:1' },
        { tipo: 'texto', html:
          '<p>O primeiro caso viu <code>./docs/com</code> e <code>espaco.md</code> como dois arquivos. As saídas corretas: separar por byte nulo (<code>find -print0 | xargs -0</code>) ou dispensar o <code>xargs</code> com <code>find -exec ... {} +</code>. O mesmo erro aparece em <code>for f in $(ls)</code>: itere sobre globs (<code>for f in *.md</code>) ou use <code>while IFS= read -r f</code>, e aspas duplas em toda expansão: <code>"$f"</code>.</p>' },
        { tipo: 'complete', id: 'b2-complete-seguro', titulo: 'Monte a limpeza segura', linguagem: 'bash', obrigatorio: false,
          enunciado: 'Escolha, em cada lacuna, o trecho que impede os dois acidentes do bloco: variável vazia em caminho destrutivo e nome com espaço.',
          partes: [
            'set -u\nD=build\nrm -rf "${D', { lacuna: 'guarda', opcoes: [':?D vazio', ':-', ''], correta: ':?D vazio' },
            '}/"\nfind . -name ', { lacuna: 'glob', opcoes: ['\'*.tmp\'', '*.tmp', '$*.tmp'], correta: '\'*.tmp\'' },
            ' -print0 | xargs ', { lacuna: 'flag', opcoes: ['-0', '-n', '-p'], correta: '-0' },
            ' rm\n'
          ],
          explicacao: '<code>${D:?mensagem}</code> aborta se a variável está vazia ou não definida (com <code>:-</code> ela viraria vazio e o caminho, <code>/</code>). O glob entre aspas simples faz o <code>find</code>, e não o shell, interpretar o padrão. E <code>-print0</code> casa com <code>xargs -0</code>: separador nulo, que não aparece em nome de arquivo.',
          callout: 'Limpeza montada: aborta com variável vazia e sobrevive a espaços.' },
        { tipo: 'takeaway', html: 'A ordem de <code>2&gt;&amp;1</code> importa, e <mark>-print0 | xargs -0</mark> ou <mark>-exec {} +</mark> substituem o xargs cego.' }
      ] },

      { rotulo: 'Erros comuns e conferir', blocos: [
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li><strong>Variável vazia em caminho destrutivo.</strong> O shell expande <code>"$D/"</code> para <code>/</code>. A defesa é <code>${D:?mensagem}</code> (aborta se vazia ou não definida) e <code>set -u</code> (aborta em variável não definida). Ambos custam uma linha.</li>' +
          '<li><strong>Esquecer que <code>&gt;</code> trunca antes do comando rodar.</strong> <code>sort arq &gt; arq</code> deixa o arquivo vazio. Use arquivo temporário e <code>mv</code>, ou <code>sort -o arq arq</code>.</li></ul>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ D=; echo rm -rf "$D/"\nrm -rf /\n$ D=; echo rm -rf "${D:?D vazio}/"; echo "exit=$?"\nbash: line 1: D: D vazio' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o glob é expandido pelo shell, não pelo comando', html:
          '<p><code>find . -name *.md</code> sem aspas funciona até o dia em que existe um <code>.md</code> no diretório corrente: o shell expande o glob antes do <code>find</code> rodar, que recebe <code>-name README.md</code> e silenciosamente procura só esse nome. O erro não aparece como erro; aparece como "faltou resultado". Em contrapartida, <code>grep "TODO" *.py</code> precisa da expansão do shell.</p>' +
          '<p>A pergunta que resolve qualquer caso: <strong>"quem deve interpretar este padrão, o shell ou o programa?"</strong> Se for o programa, use aspas simples.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Trade-off: quando sair do shell', html:
          '<p>O texto é interface universal, mas perde estrutura: tudo vira "linhas separadas por espaço" e cada ferramenta reinterpreta. O shell é ótimo para compor programas existentes e ruim para modelar dados. Quando precisar de estrutura aninhada, tratamento de erro por caso ou testes, passe para Python (F02) e mantenha o contrato de exit code e stdout/stderr, que é o que torna seu programa composível de volta.</p>' },
        { tipo: 'escolha', id: 'b2-escolha-glob', titulo: 'Confira: o glob sem aspas',
          pergunta: 'Existe um <code>README.md</code> no diretório corrente. O que faz <code>find . -name *.md</code> (sem aspas)?',
          opcoes: [
            { id: 'a', texto: 'Procura só arquivos chamados <code>README.md</code>, porque o shell expandiu o glob antes do find.', correta: true, porque: 'o find recebe <code>-name README.md</code>; o resultado é um "faltou arquivo" silencioso. Com aspas simples o find interpreta o padrão.' },
            { id: 'b', texto: 'Procura todos os <code>.md</code> da árvore, como esperado.', correta: false, porque: 'só funciona quando não há .md no diretório corrente.' },
            { id: 'c', texto: 'Dá erro de sintaxe.', correta: false, porque: 'o comando é válido; é isso que o torna traiçoeiro.' }
          ], tutorDepois: 'Pergunte sempre: quem deve interpretar este padrão, o shell ou o programa?' },
        { tipo: 'escolha', id: 'b2-escolha-sort', titulo: 'Confira: o arquivo que ficou vazio',
          pergunta: 'Você roda <code>sort dados.txt &gt; dados.txt</code> para ordenar o arquivo no lugar. O que acontece?',
          opcoes: [
            { id: 'a', texto: 'O arquivo fica vazio, porque o shell trunca o destino antes de o sort rodar.', correta: true, porque: 'o redirecionamento acontece entre o fork e o exec. Use <code>sort -o dados.txt dados.txt</code> ou um temporário seguido de <code>mv</code>.' },
            { id: 'b', texto: 'O arquivo é ordenado, pois o sort lê tudo antes de escrever.', correta: false, porque: 'quando o sort começa, o arquivo já foi truncado.' },
            { id: 'c', texto: 'O sort recusa, porque entrada e saída são o mesmo arquivo.', correta: false, porque: 'o sort nem chega a saber: o shell já trocou o fd 1.' }
          ], tutorDepois: '<code>&gt;</code> trunca antes do comando rodar.' },
        { tipo: 'takeaway', html: 'Aspas em tudo, <mark>${VAR:?}</mark> antes de <code>rm</code>, e pergunte <mark>quem interpreta o padrão</mark>: o shell ou o programa.' }
      ] }
    ]
  });
})();
