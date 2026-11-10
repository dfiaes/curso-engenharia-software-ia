/* F01 · Checkpoint: sete cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada, com o "Reprova" da fonte (F01.html#checkpoint). */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'f01-checkpoint',
    titulo: 'Checkpoint F01',
    minutos: 40,
    resumo: 'Sete cenários sobre terminal, processos e Git, sem consulta. Responda com as suas palavras; a rubrica diz o que basta e o que reprova.',
    objetivo: 'Verificar, sem consulta, se você explica pipelines e descritores, diagnostica o ambiente, descreve o que o Git grava em cada comando, escolhe a integração certa, investiga uma regressão e sabe o que se recupera e até quando.',
    revisao: [
      { id: 'f01cp-126-127', pergunta: 'Qual a diferença entre os exit codes 126 e 127 do shell?',
        opcoes: [
          opc('a', '126: achou o arquivo, mas ele não é executável; 127: comando não encontrado (não está no PATH deste shell)', true, 'são códigos do shell, não do programa. 127 quase nunca é "não instalado": cron, systemd, IDE e container têm PATH próprio.'),
          opc('b', '126: comando não encontrado; 127: sem permissão', false, 'está invertido.'),
          opc('c', 'Os dois significam "morto por sinal"', false, 'sinais são 128+n (130, 137, 141, 143).')] },
      { id: 'f01cp-rebase', pergunta: 'O que acontece com os hashes dos seus commits depois de um <code>git rebase main</code>?',
        opcoes: [
          opc('a', 'Ganham hashes novos (são cópias sobre a nova base); os antigos ficam órfãos, alcançáveis pelo reflog', true, 'por isso reescrever o que já foi publicado obriga os colegas a reconciliar versões duplicadas.'),
          opc('b', 'Nada muda; só a ordem dos commits', false, 'o pai do primeiro commit muda e, em cadeia, o hash de todos os seguintes.'),
          opc('c', 'Os commits são apagados do armazém', false, 'objetos são imutáveis e permanecem até o gc.')] },
      { id: 'f01cp-lease', pergunta: 'Seu push foi rejeitado como "non-fast-forward". Qual é o caminho seguro?',
        opcoes: [
          opc('a', 'Fetch, olhar <code>git log HEAD..origin/main</code>, integrar (merge ou pull --rebase) e só então enviar', true, 'o servidor só move a ref por fast-forward; <code>--force</code> apagaria o que o colega enviou.'),
          opc('b', '<code>git push --force</code>', false, 'sobrescreve a ref remota sem olhar.'),
          opc('c', 'Clonar de novo', false, 'o commit local que só existe no clone antigo se perderia.')] },
      { id: 'f01cp-reflog', pergunta: 'Por quanto tempo o reflog costuma guardar um commit "perdido" por um reset?',
        opcoes: [
          opc('a', '30 dias para entradas inalcançáveis e 90 para as alcançáveis (padrões), e só no clone local', true, '<code>gc.reflogExpire</code> e <code>gc.reflogExpireUnreachable</code>; depois disso o gc pode apagar os objetos.'),
          opc('b', 'Para sempre, e vai junto com o push', false, 'o reflog é local e expira.'),
          opc('c', 'Uma hora, até a próxima sessão do terminal', false, 'não depende da sessão do terminal.')] },
      { id: 'f01cp-pickaxe', pergunta: 'Você quer saber quando o valor de uma constante mudou de 0.10 para 0.15 num arquivo. Qual busca pega a mudança?',
        opcoes: [
          opc('a', '<code>git log -G"TAXA = 0\\.[0-9]+"</code> ou <code>git log -S"0.10"</code>', true, 'o <code>-S"TAXA"</code> só conta ocorrências do nome e perderia a mudança de valor.'),
          opc('b', '<code>git log -S"TAXA"</code> apenas', false, 'a contagem de ocorrências de TAXA não muda quando só o valor muda.'),
          opc('c', '<code>git blame</code> apenas', false, 'blame mostra a última mudança por linha, não o histórico da constante.')] }
    ],
    abas: [
      { rotulo: 'Terminal e processos', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que <strong>basta</strong>, e o modelo traz o que <strong>reprova</strong>. Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: o pipeline que mente',
          pergunta: '<code>./build.sh | tee build.log</code> mostra verde no CI, mas o build falhou. Qual a causa?',
          opcoes: [
            { id: 'a', texto: 'O status do pipeline é o do último comando (o <code>tee</code>, que sai com 0).', correta: true, porque: 'a falha do build (1) some; <code>set -o pipefail</code> ou <code>PIPESTATUS</code> a recuperam.' },
            { id: 'b', texto: 'O <code>tee</code> tem um bug que engole o erro.', correta: false, porque: 'o <code>tee</code> faz o que deve; o contrato do shell é que explica.' },
            { id: 'c', texto: 'O build rodou depois do <code>tee</code>.', correta: false, porque: 'os processos de um pipeline rodam ao mesmo tempo.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Pipeline que mente', obrigatorio: false,
          enunciado: '<code>./build.sh | tee build.log</code> reporta sucesso com o build quebrado. Explique o mecanismo e dê duas correções, com o efeito colateral de cada. <em>Bloco 1.</em>',
          placeholder: 'O status do pipeline é… Correção 1… Efeito colateral… Correção 2…',
          rubrica: [
            'O status do pipeline é o do <strong>último comando</strong> (o <code>tee</code>, que sai com 0).',
            '<code>set -o pipefail</code> <strong>ou</strong> <code>PIPESTATUS</code> como correção.',
            'Efeitos colaterais: com <code>pipefail</code>, um produtor encerrado por <code>head</code> (<strong>141</strong>, SIGPIPE) passa a contar como falha; <code>PIPESTATUS</code> é do bash e vale só até o próximo comando.',
            'Menciona o <strong>141</strong>.'
          ],
          modelo: '<p>Em <code>cmd | tee log</code> os processos rodam em paralelo e o shell devolve o status do <em>último</em> comando. O <code>tee</code> sai com 0, então o 1 do build desaparece. Correção 1: <code>set -o pipefail</code> (bash, zsh), que faz o status ser o do último comando que falhou; o custo é que o 141 de um produtor encerrado por <code>head</code> (SIGPIPE, 128+13) também passa a contar como falha. Correção 2: ler <code>${PIPESTATUS[@]}</code> logo depois do pipeline, em bash, e salvar com <code>rc=$?</code> se precisar de mais de uma leitura; é específico do bash e some no comando seguinte. Em CI, <code>set -euo pipefail</code> mais teste explícito.</p>' + reprova('"o tee tem bug".') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Quem é esse comando?', obrigatorio: false,
          enunciado: 'O <code>pip install</code> funciona e o <code>import</code> falha. Diagnostique usando só o shell. <em>Bloco 1.</em>',
          placeholder: 'Eu verificaria… Isso mostra… O conserto é…',
          rubrica: [
            '<code>type -a</code> ou <code>command -v</code> para ver quem o PATH escolheu para <code>python</code> e <code>pip</code>.',
            'Concluir que são <strong>dois ambientes</strong> (por exemplo, <code>pip</code> de <code>/usr/bin</code> e <code>python</code> do <code>.venv</code>).',
            '<code>python -m pip</code> como conserto (o par certo); <code>$VIRTUAL_ENV</code>, <code>sys.executable</code> e a ordem do <code>$PATH</code> como evidência.'
          ],
          modelo: '<p>Rodo <code>command -v python python3 pip</code> e <code>type -a pip</code> para ver quem o PATH escolheu, <code>python -c "import sys; print(sys.executable)"</code> para ver o interpretador, <code>echo "$PATH" | tr \':\' \'\\n\'</code> para a ordem de busca e <code>echo "$VIRTUAL_ENV"</code> para saber se há venv ativo. Se o <code>pip</code> vem de <code>/usr/bin</code> e o <code>python</code> de <code>.venv/bin</code>, são dois ambientes, e a correção é chamar o par certo: <code>python -m pip install ...</code>. Com <code>uv run</code>, o ambiente do projeto é resolvido sem ativação.</p>' + reprova('"reinstale tudo".') },

        { tipo: 'escolha', id: 'cp-esc-p3', titulo: 'P3 · Aquecimento: a ordem do 2>&1',
          pergunta: 'Qual a diferença entre <code>cmd &gt; log 2&gt;&amp;1</code> e <code>cmd 2&gt;&amp;1 &gt; log</code>?',
          opcoes: [
            { id: 'a', texto: 'No primeiro, stdout e stderr vão para o arquivo; no segundo, o stderr continua na tela e só o stdout vai para o arquivo.', correta: true, porque: 'os redirecionamentos são lidos da esquerda para a direita; <code>2&gt;&amp;1</code> copia o destino que o fd 1 tem naquele momento.' },
            { id: 'b', texto: 'São equivalentes.', correta: false, porque: 'a ordem muda o destino do fd 2.' },
            { id: 'c', texto: 'O segundo descarta o stderr.', correta: false, porque: 'quem descarta é <code>2&gt;/dev/null</code>.' }
          ] },
        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Redirecionamento', obrigatorio: false,
          enunciado: 'Prediga o conteúdo de <code>log</code> e da tela para <code>cmd &gt; log 2&gt;&amp;1</code> e para <code>cmd 2&gt;&amp;1 &gt; log</code>, e explique por quê. <em>Blocos 1 e 2.</em>',
          placeholder: 'No primeiro caso o log… No segundo… Porque…',
          rubrica: [
            'Primeiro: <strong>stdout e stderr no log</strong>; a tela fica vazia.',
            'Segundo: <strong>só o stdout no log</strong>; o stderr aparece na tela.',
            'Explica que o <code>2&gt;&amp;1</code> <strong>copia o destino do fd 1 no momento em que é lido</strong>, da esquerda para a direita.'
          ],
          modelo: '<p>Em <code>cmd &gt; log 2&gt;&amp;1</code> o fd 1 vai para o arquivo e depois o fd 2 copia o fd 1 (o arquivo): o log recebe stdout e stderr, intercalados, e a tela fica vazia. Em <code>cmd 2&gt;&amp;1 &gt; log</code> o fd 2 copia o fd 1 ainda apontando para o terminal, e só então o fd 1 vai para o arquivo: o log tem só o stdout e as mensagens de erro aparecem na tela. Cada redirecionamento altera a tabela de descritores antes do <code>exec</code>, na ordem em que aparece.</p>' + reprova('"são equivalentes".') },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>mecanismo</mark> primeiro (descritores, status, PATH) e só depois o comando.' }
      ] },

      { rotulo: 'Git por dentro e integração', blocos: [
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Do add ao commit', obrigatorio: false,
          enunciado: 'Liste, em ordem, o que muda em <code>.git</code> com <code>git add</code>, <code>git commit</code> e <code>git switch</code>. Prove por que dois arquivos iguais ocupam um só objeto. <em>Bloco 3.</em>',
          placeholder: 'git add… git commit… git switch… Dois arquivos iguais…',
          rubrica: [
            '<code>git add</code>: grava o <strong>blob</strong> em <code>objects</code> e atualiza o <strong>índice</strong> (<code>.git/index</code>).',
            '<code>git commit</code>: <strong>trees</strong> a partir do índice, objeto <strong>commit</strong> (pai = HEAD) e <strong>ref do branch</strong> reescrita.',
            '<code>git switch</code>: <strong>HEAD</strong> aponta para outro branch e <strong>índice e diretório de trabalho</strong> são reescritos para a tree de destino.',
            'O hash é o SHA-1 de <code>blob &lt;tamanho&gt;\\0conteúdo</code>: conteúdo igual dá chave igual, e o <strong>nome vive na tree</strong>.'
          ],
          modelo: '<p><code>git add</code> grava o blob do conteúdo atual em <code>.git/objects</code> e atualiza a entrada do arquivo em <code>.git/index</code>; ainda não há tree nem commit. <code>git commit</code> faz <code>write-tree</code> a partir do índice, cria o objeto commit apontando para a tree raiz e para o pai (o HEAD atual) e reescreve a ref do branch (por exemplo, <code>refs/heads/main</code>); o commit nasce do índice, não do diretório de trabalho. <code>git switch</code> não cria objetos: muda o HEAD (<code>ref: refs/heads/outro</code>) e reescreve o índice e o diretório de trabalho para casar com a tree do destino. Dois arquivos iguais compartilham um blob porque a chave é o SHA-1 de <code>blob N\\0conteúdo</code>, sem nome: o <code>git hash-object</code> e o <code>sha1sum</code> da mesma sequência coincidem, e o nome só existe na tree.</p>' + reprova('"o commit guarda o diff".') },

        { tipo: 'escolha', id: 'cp-esc-p5', titulo: 'P5 · Aquecimento: o branch que o colega baixou',
          pergunta: 'Seu branch de feature (5 commits) já foi empurrado e um colega fez checkout dele. A main andou. O que evitar?',
          opcoes: [
            { id: 'a', texto: '<code>git rebase main</code> seguido de <code>git push --force</code>, sem avisar.', correta: true, porque: 'os 5 commits ganham hashes novos; o colega ainda tem os antigos e vai divergir.' },
            { id: 'b', texto: '<code>git merge main</code> no feature.', correta: false, porque: 'merge preserva os hashes existentes.' },
            { id: 'c', texto: 'Combinar com o colega e usar <code>--force-with-lease</code> após o rebase.', correta: false, porque: 'é a forma segura de reescrever o publicado.' }
          ] },
        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Escolha de integração', obrigatorio: false,
          enunciado: 'Seu branch de feature tem 5 commits, a main andou, o branch já foi empurrado e um colega o baixou. Escolha e justifique merge, rebase ou squash, e diga o que acontece com os hashes. <em>Blocos 4 e 5.</em>',
          placeholder: 'Eu escolheria… porque… Os hashes…',
          rubrica: [
            'Não reescrever o branch compartilhado sem aviso: <strong>merge</strong> da main no feature preserva os hashes.',
            'Se preferir história linear: <strong>combinar</strong> com o colega e usar <code>--force-with-lease</code>.',
            'Hashes: o <strong>rebase cria hashes novos</strong> (os antigos ficam órfãos); o merge preserva; o squash colapsa tudo em um commit de hash diferente.',
            'Na entrada na main, escolher a estratégia do repositório (merge commit, squash ou rebase and merge).'
          ],
          modelo: '<p>Como o branch já está publicado e um colega o baixou, não faço rebase com <code>--force</code> sem aviso: os 5 commits ganhariam hashes novos e o colega, que ainda tem os antigos, voltaria a trazê-los e divergiria o histórico. Faço <code>git merge main</code> no feature: o commit de merge tem dois pais e os hashes existentes são preservados. Se o time quer história linear, combino antes com o colega, reescrevo e publico com <code>--force-with-lease</code>, que recusa se alguém empurrou algo que eu não vi. Na entrada na main uso a estratégia do repositório: merge commit preserva os hashes; squash colapsa o branch em um commit de hash diferente; rebase and merge recria os commits com hashes novos.</p>' + reprova('rebase + <code>--force</code> sem aviso.') },
        { tipo: 'takeaway', html: 'Reescreva <mark>só o que é seu</mark>; o que é compartilhado entra por <mark>merge</mark> ou por combinação explícita.' }
      ] },

      { rotulo: 'Investigação e recuperação', blocos: [
        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Regressão', obrigatorio: false,
          enunciado: 'A suíte passou há 60 commits e falha hoje. Descreva a investigação com <code>bisect run</code>: como escreve o script, o que significam 0, 1, 125 e 128 ou mais, e onde o script vive. <em>Bloco 6.</em>',
          placeholder: 'Começo com… O script… Os códigos… O script vive em…',
          rubrica: [
            '<strong>Busca binária</strong>: marca um commit bom e um ruim e roda <code>git bisect run</code> (cerca de 6 testes para 60 commits).',
            'O script <strong>falha na presença do bug</strong> e é <strong>determinístico</strong>.',
            'Códigos: <strong>0</strong> bom, <strong>1 a 127</strong> (exceto 125) ruim, <strong>125</strong> pular, <strong>128 ou mais</strong> aborta.',
            'O script <strong>vive fora da árvore</strong> (por exemplo, <code>/tmp/teste.sh</code>, caminho absoluto).'
          ],
          modelo: '<p>Faço <code>git bisect start</code>, marco <code>bad HEAD</code> e <code>good &lt;commit de 60 atrás&gt;</code> e rodo <code>git bisect run /tmp/teste.sh</code>. É uma busca binária: 60 commits cabem em cerca de 6 testes. O script é qualquer comando que falha quando o bug está presente e que é determinístico (sem rede, sem relógio, sem sorteio). O exit code é o veredito: 0 é bom, 1 a 127 (exceto 125) é ruim, 125 diz "não dá para testar este commit" (por exemplo, não compila) e manda pular, e 128 ou mais aborta a busca. O script fica fora do repositório, em caminho absoluto, porque o bisect faz checkout de commits antigos em que ele não existiria ou seria diferente. Ao final, o Git informa "first bad commit".</p>' + reprova('testar commit a commit.') },

        { tipo: 'escolha', id: 'cp-esc-p7', titulo: 'P7 · Aquecimento: o que o reset --hard apaga',
          pergunta: 'Depois de <code>git reset --hard HEAD~3</code>, o que o Git <strong>não</strong> consegue devolver?',
          opcoes: [
            { id: 'a', texto: 'Edições do diretório de trabalho que nunca passaram por <code>git add</code> nem commit.', correta: true, porque: 'sem objeto, não há o que recuperar; os 3 commits, em contrapartida, estão no reflog.' },
            { id: 'b', texto: 'Os 3 commits desfeitos.', correta: false, porque: 'o reset só moveu o ponteiro; <code>git reflog</code> mostra onde estavam.' },
            { id: 'c', texto: 'Nada: o Git recupera tudo.', correta: false, porque: 'edição nunca adicionada é irrecuperável pelo Git.' }
          ] },
        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Recuperação', obrigatorio: false,
          enunciado: 'Depois de um <code>git reset --hard HEAD~3</code> e de um <code>git stash drop</code>, o que ainda pode ser recuperado, como e até quando? Quais edições nunca voltam? <em>Bloco 6.</em>',
          placeholder: 'Os commits… O stash… O prazo… Nunca voltam…',
          rubrica: [
            '<strong>Reflog</strong> (<code>git reflog</code>) para achar o hash e um <strong>branch de resgate</strong> (<code>git branch rescue &lt;hash&gt;</code>).',
            '<code>git fsck --lost-found</code> para objetos <strong>dangling</strong>, inclusive o stash descartado.',
            'Prazos: <strong>90 dias</strong> (alcançáveis) e <strong>30 dias</strong> (inalcançáveis); o reflog é <strong>local</strong>, e o gc pode apagar depois.',
            'Edições <strong>nunca adicionadas</strong> (sem <code>git add</code> nem commit) são <strong>irrecuperáveis</strong> pelo Git.'
          ],
          modelo: '<p>Os 3 commits: o reset só moveu o branch, os objetos seguem no armazém. Rodo <code>git reflog</code>, acho o hash de antes do reset e crio <code>git branch rescue &lt;hash&gt;</code> para dar a ele uma ref. O stash descartado: <code>git fsck --lost-found</code> lista o commit "dangling" e eu o reaplico a partir do hash. Os prazos: o reflog guarda por padrão 90 dias para entradas alcançáveis e 30 para as inalcançáveis (<code>gc.reflogExpire</code>, <code>gc.reflogExpireUnreachable</code>); depois, o <code>git gc</code> pode apagar os objetos. Também é local: não vem com o clone nem vai com o push. O que nunca volta é a edição que ficou só no diretório de trabalho, sem <code>git add</code> nem commit: não há objeto, e só o histórico do editor pode ajudar.</p>' + reprova('"o Git apaga na hora".') },
        { tipo: 'texto', html: '<p class="ta-nota">Estado verificado em 11/10/2026 com Git 2.34.1 (fonte do módulo); comportamento de Git, uv e plataformas (PR, "Verified") é de alto risco de obsolescência: revalidar em até 90 dias. Padrões do reflog (90/30 dias) e <code>merge.conflictStyle=zdiff3</code> (Git 2.35+) conforme a documentação consultada nessa data.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>comando</mark>, o <mark>prazo</mark> e o que <mark>nunca volta</mark>.' }
      ] }
    ]
  });
})();
