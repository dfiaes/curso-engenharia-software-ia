/* F01 · Bloco 5: colaboração (remotes, pull requests, convenções, hooks e assinatura). Fonte: F01.html#b05. Saídas: execução real de 11/10/2026 com Git 2.34.1 (fonte); comportamento de plataformas (PR, "Verified") é de alto risco: revalidar em até 90 dias. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function py(linhas) { return linhas.join('\n') + '\n'; }

  var etapasPush = function () {
    return [
      { id: 'status', nome: 'Antes', descricao: 'Ana tem 1 commit local', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'git status -sb'),
        L('out', '## main...origin/main [ahead 1]'),
        L('hint', 'esse "ahead" usa o cache origin/main do último contato com o servidor')] },
      { id: 'fetch', nome: 'git fetch origin', descricao: 'Baixa sem integrar', tom: 'tcp', ms: 1, linhas: [
        L('cmd', 'git fetch origin; git status -sb; git log --oneline --graph --all'),
        L('out', 'From /tmp/demo-b5/origin'),
        L('out', '   63444ae..0c9a943  main       -> origin/main'),
        L('out', '## main...origin/main [ahead 1, behind 1]'),
        L('out', '* b33d6e0 A1 da ana'),
        L('out', '| * 0c9a943 B1 do beto'),
        L('out', '|/'),
        L('out', '* 63444ae C1'),
        L('hint', 'depois do fetch o status mostra ahead 1 e behind 1: o Beto empurrou B1 enquanto a Ana fazia A1')] },
      { id: 'push', nome: 'git push origin main', descricao: 'O servidor só aceita fast-forward', tom: 'tls', ms: 1, linhas: [
        L('cmd', 'git push origin main 2>&1 | head -3'),
        L('out', 'To /tmp/demo-b5/origin.git'),
        L('out', ' ! [rejected]        main -> main (non-fast-forward)'),
        L('out', 'error: failed to push some refs to \'/tmp/demo-b5/origin.git\''),
        L('hint', 'a ponta do servidor (0c9a943) não está no histórico da Ana')] },
      { id: 'rebase', nome: 'git pull --rebase', descricao: 'Integrar antes de enviar', tom: 'request', ms: 1, linhas: [
        L('cmd', 'git pull --rebase origin main'),
        L('out', 'Successfully rebased and updated refs/heads/main.'),
        L('out', '* 61c1f14 A1 da ana'),
        L('out', '* 0c9a943 B1 do beto'),
        L('out', '* 63444ae C1'),
        L('hint', 'o A1 foi recriado (hash novo, 61c1f14) sobre o B1')] },
      { id: 'ok', nome: 'Push de novo', descricao: 'Agora é fast-forward', tom: 'response', ms: 1, linhas: [
        L('cmd', 'git push origin main'),
        L('out', 'To /tmp/demo-b5/origin.git'),
        L('out', '   0c9a943..61c1f14  main -> main')] }
    ];
  };

  var codigoPush = py([
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
    'def push(grafo, remoto, local, modo="normal", esperado=None):',
    '    """remoto: ponta atual no servidor; local: ponta que você envia;',
    '    esperado: o que o seu último fetch viu em origin/main (para o lease)."""',
    '    if modo == "force":',
    '        return "aceito"',
    '    if modo == "lease":',
    '        # só sobrescreve se o remoto ainda é o que você viu no último fetch',
    '        return "aceito"',
    '    if remoto in ancestrais(grafo, local):      # fast-forward',
    '        return "aceito"',
    '    return "rejeitado:non-fast-forward"',
    '',
    '',
    'G = {"C1": [], "B1": ["C1"], "A1": ["C1"], "A1r": ["B1"]}',
    'print(push(G, "B1", "A1"))'
  ]);
  var testesPush = py([
    'G = {"C1": [], "B1": ["C1"], "A1": ["C1"], "A1r": ["B1"]}',
    '',
    'def test_push_normal_rejeita_divergencia():',
    '    assert push(G, "B1", "A1") == "rejeitado:non-fast-forward"',
    '',
    'def test_push_normal_aceita_fast_forward():',
    '    assert push(G, "C1", "A1") == "aceito"',
    '    assert push(G, "B1", "A1r") == "aceito"',
    '',
    'def test_force_sobrescreve_sem_olhar():',
    '    assert push(G, "B1", "A1", modo="force") == "aceito"',
    '',
    'def test_lease_recusa_quando_o_remoto_mudou():',
    '    # a Ana viu C1 no último fetch, mas o Beto já empurrou B1',
    '    assert push(G, "B1", "A1", modo="lease", esperado="C1") == "rejeitado:stale"',
    '',
    'def test_lease_aceita_quando_o_remoto_e_o_esperado():',
    '    assert push(G, "B1", "A1", modo="lease", esperado="B1") == "aceito"',
    '',
    'def test_borda_lease_sem_esperado_recusa():',
    '    assert push(G, "B1", "A1", modo="lease") == "rejeitado:stale"'
  ]);
  var solucaoPush = codigoPush.replace(
    '        # só sobrescreve se o remoto ainda é o que você viu no último fetch\n        return "aceito"',
    '        if remoto != esperado:\n            return "rejeitado:stale"\n        return "aceito"');

  TrilhaAula.registrar({
    id: 'f01-b5',
    titulo: 'Colaboração: remotes, pull requests, convenções, hooks e assinatura',
    minutos: 35,
    resumo: 'Git é distribuído: cada clone tem o histórico inteiro. Quase todo incidente de colaboração vem de não saber o que fetch, pull e push movem.',
    objetivo: 'Explicar remote, refspec e branches de rastreamento, prever quando o push é rejeitado, usar --force-with-lease, escolher fluxo e integração de PR e saber o que hooks e assinatura garantem e o que não.',
    revisao: [
      { id: 'f01b5-fetch', pergunta: 'Qual comando nunca altera seu branch atual nem seus arquivos de trabalho?',
        opcoes: [
          opc('a', '<code>git fetch</code>', true, 'só baixa objetos e atualiza as refs <code>origin/*</code>, um cache local do estado remoto. O hábito seguro: fetch, olhar <code>git log HEAD..origin/main</code>, só então integrar.'),
          opc('b', '<code>git pull</code>', false, 'pull é fetch mais integração (merge ou rebase), e essa etapa mexe no seu branch.'),
          opc('c', '<code>git merge origin/main</code>', false, 'merge altera o branch atual.')] },
      { id: 'f01b5-push', pergunta: 'Por que o servidor rejeita um <code>git push</code> com "non-fast-forward"?',
        opcoes: [
          opc('a', 'A ponta do servidor não está no seu histórico: ele só aceita mover a ref por fast-forward', true, 'integre primeiro (<code>pull --rebase</code> ou merge) e envie de novo.'),
          opc('b', 'Você não tem permissão de escrita', false, 'seria outro erro, de autorização.'),
          opc('c', 'O branch remoto está protegido contra qualquer push', false, 'a rejeição non-fast-forward vem da regra da ref, não de proteção.')] },
      { id: 'f01b5-lease', pergunta: 'Por que <code>--force-with-lease</code> é preferível a <code>--force</code> ao publicar um branch reescrito?',
        opcoes: [
          opc('a', 'Só sobrescreve se a ref remota ainda é a que você viu no último fetch; um force puro apagaria o commit que um colega enviou no meio tempo', true, 'ressalva: um fetch automático (IDE, hook) antes do push dá ao lease o estado atualizado e tira a proteção; prefira <code>--force-with-lease=main:&lt;hash esperado&gt;</code>.'),
          opc('b', 'É mais rápido', false, 'a diferença é de segurança, não de velocidade.'),
          opc('c', 'Mantém os hashes originais dos commits', false, 'os hashes já mudaram no rebase; o lease só decide se o push sobrescreve.')] },
      { id: 'f01b5-hook', pergunta: 'Um hook <code>pre-commit</code> bloqueia commits com <code>.env</code>. Por que ele não basta como controle?',
        opcoes: [
          opc('a', '<code>--no-verify</code> o contorna e <code>.git/hooks</code> não é versionado; o controle que vale é o mesmo check no CI e a proteção de branch no servidor', true, 'hook local é conveniência. Para compartilhá-lo, use <code>core.hooksPath</code> com uma pasta no repositório, ou o projeto pre-commit.'),
          opc('b', 'Hooks só funcionam em Linux', false, 'funcionam onde há Git; o limite é outro.'),
          opc('c', 'Hooks rodam depois do commit', false, 'um <code>pre-commit</code> roda antes; se sai com código diferente de zero, a operação aborta.')] },
      { id: 'f01b5-segredo', pergunta: 'Um segredo foi enviado ao remoto. Qual é a ordem correta?',
        opcoes: [
          opc('a', 'Revogar e trocar a credencial primeiro; só depois limpar o histórico, por higiene', true, 'o segredo já está no servidor, nos clones, nos caches de CI e, em repositório público, em coletores automáticos; o filter-repo não alcança clones nem forks.'),
          opc('b', 'Remover o arquivo em outro commit e seguir', false, 'o blob continua acessível pelos commits anteriores.'),
          opc('c', 'Limpar o histórico e só então trocar a credencial', false, 'a janela de exposição fica aberta enquanto a chave antiga vale.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Git é distribuído</h3>' +
          '<p>Cada clone tem o histórico inteiro e é, tecnicamente, um repositório igual ao original. "Servidor central" é convenção humana. Quase todo incidente de colaboração (push rejeitado, histórico duplicado, trabalho do colega sobrescrito) vem de não saber o que <code>fetch</code>, <code>pull</code> e <code>push</code> realmente movem.</p>' +
          '<h3>Remotes, branches de rastreamento e os três verbos</h3>' +
          '<p>Um <strong>remote</strong> é um nome (<code>origin</code>) para uma URL mais um <strong>refspec</strong>, a regra que mapeia branches remotos para refs locais. O refspec padrão <code>+refs/heads/*:refs/remotes/origin/*</code> diz: "copie cada branch de lá para <code>origin/&lt;nome&gt;</code> aqui". Essas refs <code>origin/main</code> são um <em>cache local</em> do que o servidor tinha na última conversa. Você não commita nelas.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git remote -v; git branch -vv\norigin\t/tmp/demo-b5/origin.git (fetch)\norigin\t/tmp/demo-b5/origin.git (push)\n* main 63444ae [origin/main] C1\n$ cat .git/config | sed -n "/remote/,\\$p"\n[remote "origin"]\n\turl = /tmp/demo-b5/origin.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n[branch "main"]\n\tremote = origin\n\tmerge = refs/heads/main' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Verbo</th><th>O que faz</th></tr></thead><tbody>' +
          '<tr><td><code>fetch</code></td><td>baixa objetos novos e atualiza as refs <code>origin/*</code>. Não toca em seus branches nem no diretório de trabalho. É seguro sempre.</td></tr>' +
          '<tr><td><code>pull</code></td><td><code>fetch</code> mais integração (merge ou rebase) do branch rastreado no branch atual.</td></tr>' +
          '<tr><td><code>push</code></td><td>envia seus objetos e pede ao servidor que mova a ref remota. O servidor só aceita se for <strong>fast-forward</strong> (a nova ponta contém a antiga).</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Reescrever o que já foi publicado</h3>' +
          '<p>Quando é necessário reescrever um branch publicado (por exemplo, o seu branch de PR), o push precisa ser forçado. <code>--force</code> sobrescreve a ref remota sem olhar; <code>--force-with-lease</code> só sobrescreve se a ref remota ainda for a que você viu no último fetch.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git commit -q --amend -m "A1 reescrito"; git push --force-with-lease origin main\nTo /tmp/demo-b5/origin.git\n ! [rejected]        main -> main (stale info)\nerror: failed to push some refs to \'/tmp/demo-b5/origin.git\'' },
        { tipo: 'texto', html:
          '<p>Depois do último fetch da Ana, o Beto empurrou outro commit; o lease dela estava velho (<code>stale info</code>) e o servidor recusou, poupando o trabalho dele. Um <code>--force</code> puro teria apagado o commit do Beto. Observe a ressalva: se você rodar <code>git fetch</code> automaticamente (IDE, hook) antes do push, o lease passa a ser "o que acabou de baixar" e perde a proteção; prefira a forma explícita <code>--force-with-lease=main:&lt;hash esperado&gt;</code>.</p>' },
        { tipo: 'takeaway', html: '<code>origin/*</code> é <mark>cache do último fetch</mark>; o servidor só aceita <mark>fast-forward</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Uma colisão típica: Beto já empurrou o commit B1 para o servidor; Ana, sem saber, fez o A1 localmente. Veja a sequência inteira, da rejeição à integração.</p>' },
        { tipo: 'rode', id: 'b5-rode-push', titulo: 'Push rejeitado e como integrar', enunciado: 'Rode o <code>push</code> e leia cada etapa, do estado antes do fetch até o push aceito.',
          prefixo: '$', entrada: 'git push origin main', unidade: 'passo', terminalTitulo: 'clone da Ana', etapas: etapasPush(),
          prever: { pergunta: 'Ana tem um commit local; o Beto já empurrou outro para o servidor. O que acontece com <code>git push origin main</code>?', opcoes: [
            { id: 'a', texto: 'O servidor sobrescreve o commit do Beto com o da Ana.', correta: false, porque: 'o servidor só move a ref por fast-forward; sobrescrever exigiria force.' },
            { id: 'b', texto: 'O push é rejeitado (non-fast-forward): é preciso integrar antes.', correta: true, porque: 'a ponta do servidor não está no histórico da Ana.' },
            { id: 'c', texto: 'O servidor faz o merge automaticamente e aceita.', correta: false, porque: 'o servidor não integra por você; quem integra é o seu clone.' }
          ] },
          tutorAntes: 'Aperte Enter e clique nas etapas na ordem: antes, fetch, push, pull --rebase, push de novo.',
          tutorDepois: 'O status usa o cache: só depois do fetch aparece "ahead 1, behind 1". O push foi rejeitado porque a ponta do servidor (0c9a943) não está no histórico da Ana. Integrar com <code>pull --rebase</code> recria o A1 sobre o B1, e então o push vira fast-forward.',
          callout: 'Você viu a rejeição non-fast-forward e a integração que a resolve.' },
        { tipo: 'python', id: 'b5-python-push', titulo: 'Quando o servidor aceita o push', obrigatorio: false,
          enunciado: 'O <code>push</code> recebe o grafo, a ponta do servidor (<code>remoto</code>), a sua ponta (<code>local</code>), o <code>modo</code> (<code>"normal"</code>, <code>"force"</code> ou <code>"lease"</code>) e o que o último fetch viu (<code>esperado</code>). Implemente o ramo <code>"lease"</code>: recusa com <code>"rejeitado:stale"</code> se o remoto não é o esperado.',
          codigo: codigoPush, testes: testesPush,
          dica: 'No ramo <code>lease</code>: <code>if remoto != esperado: return "rejeitado:stale"</code>; senão, <code>"aceito"</code>. Repare que o lease aceita um push que não é fast-forward, desde que o remoto seja o que você viu.',
          solucao: solucaoPush,
          tutorDepois: 'Sem <code>esperado</code>, o lease recusa: ele precisa de uma referência do que você viu. Por isso um fetch automático antes do push enfraquece o lease: ele passa a "esperar" exatamente o que acabou de baixar.',
          callout: 'O lease agora é código: recusa quando o remoto mudou sem você ver.' },
        { tipo: 'cenario', id: 'b5-cenario-rejeitado', titulo: 'O push rejeitado', obrigatorio: false,
          enunciado: 'Seu <code>git push origin main</code> acaba de voltar com "rejected (non-fast-forward)". O colega diz que empurrou algo há pouco. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O que você faz?', opcoes: [
              { texto: 'git push --force, para vencer a rejeição.', vai: 'f-apagou', tom: 'ruim', consequencia: 'o force não olha o que o servidor tem: o commit do colega some da ref remota.' },
              { texto: 'git fetch, olhar git log HEAD..origin/main, integrar com pull --rebase e só então push.', vai: 'f-bom', tom: 'ok', consequencia: 'você viu o que chegou antes de integrar, e o push passa a ser fast-forward.' },
              { texto: 'Apagar o clone e clonar de novo.', vai: 'f-perde', tom: 'ruim', consequencia: 'o commit local que só existia no clone antigo se perde.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Integração feita com visibilidade; nada do colega nem seu foi perdido.' },
            'f-apagou': { bom: false, texto: 'O trabalho do colega foi sobrescrito no servidor; só o clone dele ainda o tem.' },
            'f-perde': { bom: false, texto: 'O commit que só existia no clone antigo foi perdido junto com ele.' }
          },
          callout: 'Você integrou com fetch e leitura do que chegou antes de enviar.' },
        { tipo: 'takeaway', html: 'Push rejeitado pede <mark>fetch, olhar, integrar</mark>; <mark>force-with-lease</mark> nunca <code>--force</code>.' }
      ] },

      { rotulo: 'PRs, fluxos e convenções', blocos: [
        { tipo: 'texto', html:
          '<h3>Pull requests e integração</h3>' +
          '<p><strong>Pull request</strong> (GitHub, Bitbucket) ou <strong>merge request</strong> (GitLab) não é recurso do Git: é da plataforma, que junta um branch, a revisão, o CI e uma ação de integração. Há três integrações, com efeitos distintos no histórico. Escolha uma por repositório. PRs pequenos são revisados; PRs enormes recebem "LGTM".</p>' },
        { tipo: 'abas', rotulo: 'Estratégia de integração', itens: [
          { rotulo: 'Merge commit', blocos: [{ tipo: 'texto', html: '<p>Mantém todos os commits do branch e acrescenta um commit de merge. Preserva a história real e os hashes; o histórico fica ramificado.</p>' }] },
          { rotulo: 'Squash', blocos: [{ tipo: 'texto', html: '<p>Colapsa o branch inteiro em um commit na main. Histórico limpo e fácil de reverter, mas perde a granularidade dos commits e o commit resultante tem hash diferente dos do branch.</p>' }] },
          { rotulo: 'Rebase and merge', blocos: [{ tipo: 'texto', html: '<p>Reaplica os commits do PR sobre a main sem commit de merge. Histórico linear, mas os commits ganham hashes novos (não são os do seu branch local).</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Mensagem de commit</h3>' +
          '<p>Resumo no imperativo com até ~50 caracteres ("Add retry to payment client"), linha em branco, corpo com o <em>porquê</em> (o diff já mostra o o quê). O <strong>Conventional Commits 1.0.0</strong> estrutura o resumo como <code>tipo(escopo): descrição</code> (<code>feat</code>, <code>fix</code>, ...), com <code>!</code> ou <code>BREAKING CHANGE:</code> para quebras; mapeia para versionamento semântico (<code>feat</code> → minor, <code>fix</code> → patch). Só rende se alguma ferramenta consome o formato.</p>' +
          '<h3>Fluxos de branch</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Fluxo</th><th>Como funciona</th><th>Quando serve</th></tr></thead><tbody>' +
          '<tr><td><strong>Trunk-based</strong></td><td>todos integram em <code>main</code> várias vezes por dia; branches vivem horas; recursos incompletos ficam atrás de feature flags</td><td>entrega contínua, equipes com CI confiável. É a prática associada a melhor desempenho de entrega nas pesquisas DORA</td></tr>' +
          '<tr><td><strong>GitHub flow</strong></td><td>branch curto por mudança, PR, merge em main, deploy</td><td>a maioria dos serviços web</td></tr>' +
          '<tr><td><strong>GitFlow</strong></td><td><code>develop</code>, <code>feature/*</code>, <code>release/*</code>, <code>hotfix/*</code>, <code>main</code></td><td>software com versões instaladas e várias releases mantidas em paralelo. O próprio autor (2020) recomenda algo mais simples para entrega contínua</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O que decide é o <strong>tempo de vida do branch</strong>: quanto mais ele vive, mais dor de integração. Escolha o fluxo mais simples que cabe no modelo de release.</p>' },
        { tipo: 'escolha', id: 'b5-escolha-fluxo', titulo: 'Confira: o fluxo certo',
          pergunta: 'Uma equipe entrega um serviço web continuamente, com CI confiável e feature flags. Qual fluxo tende a servir melhor, e qual critério decide?',
          opcoes: [
            { id: 'a', texto: 'Trunk-based ou GitHub flow: branches curtos; o tempo de vida do branch decide a dor de integração.', correta: true, porque: 'trunk-based é a prática associada a melhor desempenho de entrega nas pesquisas DORA; GitFlow serve a versões instaladas mantidas em paralelo.' },
            { id: 'b', texto: 'GitFlow, porque tem mais branches e portanto mais controle.', correta: false, porque: 'mais branches longos significam mais dor de integração; o próprio autor recomenda algo mais simples para entrega contínua.' },
            { id: 'c', texto: 'Qualquer um, desde que cada dev tenha um branch longo próprio.', correta: false, porque: 'branch longo é justamente o que aumenta o custo de integrar.' }
          ], tutorDepois: 'Escolha o fluxo mais simples que cabe no modelo de release.' },
        { tipo: 'takeaway', html: 'PR é recurso da <mark>plataforma</mark>; o que decide o fluxo é o <mark>tempo de vida do branch</mark>.' }
      ] },

      { rotulo: 'Hooks, assinatura e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>.gitignore</h3>' +
          '<p>O <code>.gitignore</code> lista padrões de arquivos não rastreados que o Git deve ignorar (<code>*.log</code>, <code>.env</code>, <code>__pycache__/</code>). A última regra que casa vence; <code>!padrão</code> reverte. Há três níveis: o <code>.gitignore</code> do repositório (versionado), <code>.git/info/exclude</code> (só seu) e <code>core.excludesFile</code> (global da máquina, bom para arquivos de editor). Não afeta o que já está rastreado:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git check-ignore -v a.log .env keep.log\n.gitignore:2:*.log\ta.log\n.gitignore:1:.env\t.env\n.gitignore:4:!keep.log\tkeep.log\n$ git status -sb | head -3; git check-ignore -v tracked.log; echo "check-ignore exit=$?"\n## main...origin/main [ahead 1]\n M tracked.log\n?? .gitignore\ncheck-ignore exit=1' },
        { tipo: 'texto', html:
          '<p>O <code>tracked.log</code> casa com <code>*.log</code> mas segue aparecendo como modificado, porque já estava no índice; <code>check-ignore</code> não o reporta como ignorado (exit 1). Para parar de rastrear: <code>git rm --cached tracked.log</code>.</p>' +
          '<h3>Hooks</h3>' +
          '<p><strong>Hooks</strong> são programas em <code>.git/hooks/</code> executados em eventos (<code>pre-commit</code>, <code>commit-msg</code>, <code>pre-push</code>); se um <code>pre-*</code> sai com código diferente de zero, a operação aborta. Como <code>.git/</code> não é versionado, hooks não viajam com o clone: use <code>git config core.hooksPath .githooks</code> com a pasta no repositório, ou o projeto <em>pre-commit</em>.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git commit -m "adiciona env"; echo "exit=$?"; git log --oneline -1\npre-commit: .env nunca entra no repositório\nexit=1\n47d9988 A1 reescrito\n$ git commit --no-verify -q -m "pulando o hook"; git log --oneline -1; git rm -q --cached .env; git commit -q -m "remove env (o segredo continua no histórico)"; git log --oneline -3\n37045c6 pulando o hook\n26f1916 remove env (o segredo continua no histórico)\n37045c6 pulando o hook\n47d9988 A1 reescrito' },
        { tipo: 'texto', html:
          '<p>O hook bloqueou o commit (exit 1). <code>--no-verify</code> o contorna, e é por isso que hook local é conveniência; o controle que vale é o mesmo teste no CI e a proteção de branch no servidor. Detalhe do hook acima: ele filtra com <code>--diff-filter=AM</code> (adicionado ou modificado). Sem o filtro, o commit que <em>remove</em> o <code>.env</code> também listaria o arquivo e seria bloqueado, impedindo o conserto. Monte um hook assim:</p>' },
        { tipo: 'complete', id: 'b5-complete-hook', titulo: 'Monte o hook pre-commit', linguagem: 'bash', obrigatorio: false,
          enunciado: 'Hook de exemplo (ilustrativo, no espírito do que o módulo descreve). Escolha o filtro de diff, o exit code que aborta e a configuração que o torna compartilhável.',
          partes: [
            '#!/bin/sh\nif git diff --cached --name-only --diff-filter=', { lacuna: 'filtro', opcoes: ['AM', 'ACDM', 'D'], correta: 'AM' },
            ' | grep -qx ".env"; then\n  echo "pre-commit: .env nunca entra no repositório"\n  exit ', { lacuna: 'saida', opcoes: ['1', '0', '127'], correta: '1' },
            '\nfi\n\n# para o hook viajar com o clone:\ngit config core.hooksPath ', { lacuna: 'pasta', opcoes: ['.githooks', '.git/hooks', '/tmp/hooks'], correta: '.githooks' },
            '\n'
          ],
          explicacao: 'Um <code>pre-*</code> aborta a operação quando sai com código diferente de zero (0 deixaria o commit passar). O filtro <code>AM</code> bloqueia adicionar ou modificar o <code>.env</code>, mas deixa passar o commit que o remove; com <code>D</code> ou <code>ACDM</code> o conserto seria impedido. E <code>.git/hooks</code> não é versionado: a pasta precisa estar no repositório.',
          callout: 'Hook montado: bloqueia o .env, deixa o conserto passar e viaja com o clone.' },
        { tipo: 'texto', html:
          '<h3>Commits assinados</h3>' +
          '<p>Assinar um commit adiciona um cabeçalho <code>gpgsig</code> ao objeto, com assinatura criptográfica sobre o conteúdo do commit. Desde o Git 2.34 a assinatura pode usar chave <strong>SSH</strong> (além de GPG), o que simplifica a vida de quem já tem uma.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ git commit -q -m "commit assinado"; git cat-file -p HEAD | sed -n 1,4p\ntree 4d593e935186bcc35450336864a1aad148210a14\nauthor Ada Lovelace <ada@example.com> 1767268920 +0000\ncommitter Ada Lovelace <ada@example.com> 1767268920 +0000\ngpgsig -----BEGIN SSH SIGNATURE-----\n$ git verify-commit HEAD; echo "exit=$?"\nGood "git" signature for ada@example.com with ED25519 key SHA256:74gPR+zfaoP6WrXarrNH+5b5rgHt0dvlMskYrNTimDw\nexit=0' },
        { tipo: 'texto', html:
          '<p>A verificação exige um arquivo de <em>allowed signers</em> (e-mail e chave pública autorizados) e prova que o detentor da chave criou o commit com aquele conteúdo, <strong>não que a pessoa é quem diz ser</strong>. Plataformas exibem "Verified" quando você cadastra a chave pública na conta.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: segredo que foi para o remoto já vazou', html:
          '<p>Após o push, o segredo está no servidor, nos clones dos colegas, em caches de CI e, em repositório público, em coletores automáticos que varrem commits em segundos. Remover o arquivo em outro commit (bloco 3) não remove o blob; reescrever histórico (<code>git filter-repo</code>) não alcança clones nem forks. A ordem correta: <strong>revogar e trocar a credencial primeiro</strong>; só depois, limpar o histórico por higiene. Hook de pre-commit com detector de segredos reduz a chance; o scanner no CI e o push protection da plataforma fecham a porta.</p>' },
        { tipo: 'escolha', id: 'b5-escolha-force', titulo: 'Confira: publicar um rebase',
          pergunta: 'Você reescreveu seu branch de PR com rebase. Qual a forma preferida de publicar, e por quê?',
          opcoes: [
            { id: 'a', texto: '<code>git push --force-with-lease</code>: recusa se o remoto tiver commits que você ainda não viu.', correta: true, porque: 'o <code>--force</code> sobrescreve cegamente e pode apagar o trabalho enviado entre o seu último fetch e o push. Atenção a fetch automático de IDE, que enfraquece o lease.' },
            { id: 'b', texto: '<code>git push --force</code>, porque é mais rápido.', correta: false, porque: 'rapidez não compensa apagar o commit de um colega.' },
            { id: 'c', texto: '<code>git push</code> simples; o Git resolve sozinho.', correta: false, porque: 'o servidor rejeita (non-fast-forward): o histórico foi reescrito.' }
          ], tutorDepois: 'Reescrever o publicado exige o lease; reescrever o compartilhado exige combinar antes.' },
        { tipo: 'escolha', id: 'b5-escolha-assinatura', titulo: 'Confira: o que a assinatura prova',
          pergunta: 'A plataforma mostra "Verified" num commit. O que isso garante?',
          opcoes: [
            { id: 'a', texto: 'Que o detentor da chave cadastrada criou o commit com aquele conteúdo; não que a pessoa é quem diz ser.', correta: true, porque: 'a assinatura (GPG ou, desde o Git 2.34, SSH) prova posse da chave sobre o conteúdo do commit, não identidade civil.' },
            { id: 'b', texto: 'Que o código foi revisado e é seguro.', correta: false, porque: 'assinatura não diz nada sobre revisão ou qualidade.' },
            { id: 'c', texto: 'Que a credencial do autor nunca vazou.', correta: false, porque: 'quem tiver a chave privada assina como o autor.' }
          ], tutorDepois: 'Assinatura é prova de chave; revisão e CI são outros controles.' },
        { tipo: 'takeaway', html: 'Hook local é <mark>conveniência</mark>; o controle que vale está no <mark>CI e no servidor</mark>. Segredo publicado <mark>se revoga</mark>.' }
      ] }
    ]
  });
})();
