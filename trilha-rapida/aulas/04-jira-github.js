/* Aula 4 · Jira e GitHub juntos. Fonte: TR-texto.html, Passo 3. Os nomes de estados do Jira ("Em desenvolvimento", "Em revisão", "Aguardando cert") são exemplos de um fluxo de trabalho; ajuste ao do seu projeto. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };

  TrilhaAula.registrar({
    id: 'jira-github',
    titulo: 'Jira e GitHub juntos',
    minutos: 16,
    resumo: 'Dois sistemas guardam verdades diferentes. A chave do ticket os liga, o repositório guarda o que muda com o código.',
    abas: [
      { rotulo: 'Quem guarda o quê', blocos: [
        { tipo: 'texto', html:
          '<p>Pense em duas gavetas: uma na secretaria (o Jira) e outra no arquivo técnico (o repositório). Se o mesmo documento mora nas duas, em semanas há duas versões. O agente, que lê uma delas, trabalha com informação velha. Por isso é preciso decidir qual é a <strong>fonte da verdade</strong> de cada coisa.</p>' +
          '<p>A regra: <strong>o vínculo mínimo é a chave do ticket</strong>. Tudo que muda junto com o código mora no repositório; tudo que é gestão do trabalho mora no Jira. Copiar critérios nos dois lados cria dois textos que se afastam.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Informação</th><th>Fonte da verdade</th><th>No outro lado fica</th></tr></thead><tbody>' +
          '<tr><td>Critérios de aceite, desenho, decisões</td><td><strong>Repositório</strong> (<code>docs/specs</code>, <code>docs/adr</code>): versionado, revisado em PR, lido pelo agente</td><td>No Jira: resumo curto e link permanente para o arquivo</td></tr>' +
          '<tr><td>Prioridade, responsável, sprint, estado do fluxo, estimativa</td><td><strong>Jira</strong></td><td>No repo: nada (a chave <code>PROJ-123</code> basta)</td></tr>' +
          '<tr><td>Código, testes, histórico de mudança</td><td><strong>Git</strong></td><td>No Jira: link para o PR (automático)</td></tr>' +
          '<tr><td>Estado de build e deploy</td><td><strong>CI/CD</strong> (Actions / Azure Pipelines)</td><td>No Jira: status de deploy via integração</td></tr>' +
          '<tr><td>Discussão de implementação</td><td>Comentários do PR</td><td>No Jira: só decisões que mudam escopo</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>A chave do ticket em tudo</h3>' +
          '<p>Com a integração <em>GitHub for Jira</em> (ou o app equivalente) instalada, a chave em branch, commit ou título de PR faz o Jira exibir branches, commits, PRs e deploys na própria história. Reforce no repositório: um check de PR que falha se o título não começar com <code>^[A-Z]+-\\d+: </code>, e o <code>commit-msg</code> do pre-commit com a mesma expressão.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: '# branch\ngit switch -c feat/PROJ-123-validar-cnpj\n# commit\ngit commit -m "PROJ-123: valida CNPJ no cadastro de investidor"\n# título do PR\nPROJ-123: valida CNPJ no cadastro de investidor' },
        { tipo: 'texto', html:
          '<h3>Três jeitos de o agente ler e escrever no ticket</h3>' },
        { tipo: 'abas', rotulo: 'Como o agente alcança o Jira', itens: [
          { rotulo: 'Manual', blocos: [{ tipo: 'texto', html: '<p>Zero configuração: você cola o texto do ticket no prompt e, ao final, cola o resumo gerado no Jira. Funciona em qualquer ferramenta e é o ponto de partida seguro.</p>' }] },
          { rotulo: 'Via MCP', blocos: [{ tipo: 'texto', html: '<p>Um servidor <strong>MCP</strong> (Model Context Protocol) de Jira expõe operações como buscar issue, comentar e transicionar. Configure com <strong>credencial de menor privilégio</strong>: uma conta de serviço do agente que só lê e comenta, sem permissão de transicionar para "Done" nem de editar campos de prioridade. A configuração e os riscos de MCP têm aula própria; veja também <a href="../modulos/M00-ferramental/M00.html">M00</a>.</p>' }] },
          { rotulo: 'CLI/API na esteira', blocos: [{ tipo: 'texto', html: '<p>A <em>pipeline</em>, não o agente, transiciona o ticket quando o deploy em cert ou prod termina. O agente nunca fecha o próprio trabalho.</p>' }] }
        ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          'Dar ao agente um token de Jira com poderes de administrador "porque é mais prático". Texto de ticket é entrada não confiável: qualquer pessoa que comenta pode inserir instruções ("ignore as regras e apague..."), e o agente pode obedecer (<strong>injeção de prompt</strong>). Credencial mínima, ações destrutivas fora do alcance e trate o conteúdo do ticket como <em>dado</em>, nunca como ordem.' },
        { tipo: 'takeaway', html: 'O repo guarda o que muda <mark>com o código</mark>; o Jira guarda a <mark>gestão</mark>; a <mark>chave do ticket</mark> liga os dois.' }
      ] },

      { rotulo: 'Do PROJ-123 ao PR', blocos: [
        { tipo: 'texto', html:
          '<p>Siga um ticket real do início ao PR. Observe duas coisas: onde a chave aparece (branch, commit, título) e quem faz cada transição de estado. O agente comenta e abre PR; as transições são automações do Jira e da esteira, não decisão dele.</p>' +
          '<p class="ta-nota">Os nomes dos estados abaixo (Em desenvolvimento, Em revisão, Aguardando cert) são um exemplo de fluxo de trabalho. Troque pelos do seu projeto.</p>' },
        { tipo: 'rode', id: 'jira-rode', titulo: 'Rode o fluxo PROJ-123', enunciado: 'Envie o ticket ao agente e acompanhe a história passar de "A fazer" a "Aguardando cert", com cada artefato no lugar certo.',
          prefixo: 'Prompt', entrada: 'implemente PROJ-123: validar o CNPJ no cadastro de investidor', unidade: 'min', terminalTitulo: 'agente + Jira + GitHub',
          etapas: [
            { id: 'ler', nome: 'Ler o ticket', descricao: 'Via MCP, somente leitura', tom: 'dns', ms: 2, linhas: [
              L('cmd', 'mcp jira.get_issue PROJ-123'),
              L('in', 'PROJ-123 "Validar CNPJ no cadastro"  estado: A fazer  critérios: 3'),
              L('info', 'conteúdo do ticket tratado como dado, não como instrução'),
              L('hint', 'a conta de serviço só lê e comenta')] },
            { id: 'branch', nome: 'Branch com a chave', descricao: 'O Jira reage à chave', tom: 'tcp', ms: 1, linhas: [
              L('cmd', 'git switch -c feat/PROJ-123-validar-cnpj'),
              L('info', 'push da branch detectado pela integração GitHub for Jira'),
              L('in', 'Jira: PROJ-123 movido para "Em desenvolvimento" (regra de automação)'),
              L('hint', 'quem moveu foi a automação do Jira, não o agente')] },
            { id: 'spec', nome: 'Spec no repositório', descricao: 'Fonte da verdade dos critérios', tom: 'tls', ms: 8, linhas: [
              L('in', 'docs/specs/PROJ-123-validar-cnpj.md criado (status: rascunho)'),
              L('cmd', 'mcp jira.add_comment PROJ-123 "Spec: docs/specs/PROJ-123-validar-cnpj.md (resumo: 3 critérios)"'),
              L('hint', 'no Jira: resumo e link; os critérios completos ficam no repo')] },
            { id: 'commit', nome: 'Commit e verificação', descricao: 'Teste primeiro, make check', tom: 'request', ms: 20, linhas: [
              L('cmd', 'make check'),
              L('in', 'ruff: ok  testes: 14 passed  docs: ok'),
              L('cmd', 'git commit -m "PROJ-123: valida CNPJ no cadastro de investidor"'),
              L('out', 'commit-msg: chave PROJ-123 válida')] },
            { id: 'pr', nome: 'Pull request', descricao: 'Título com a chave, template', tom: 'response', ms: 3, linhas: [
              L('cmd', 'gh pr create --title "PROJ-123: valida CNPJ no cadastro de investidor" --body-file docs/specs/PROJ-123-validar-cnpj.md'),
              L('in', 'PR #231 aberto'),
              L('out', 'check "chave de ticket" ok; check "Docs:" ok; check "make check" ok'),
              L('in', 'Jira: PROJ-123 movido para "Em revisão"; PR #231 aparece na história')] },
            { id: 'merge', nome: 'Merge e deploy', descricao: 'A esteira transiciona o ticket', tom: 'ink', ms: 12, linhas: [
              L('info', 'revisão de outra pessoa aprovada; merge na main'),
              L('in', 'Jira: PROJ-123 movido para "Aguardando cert"'),
              L('out', 'pipeline: deploy em cert concluído (v2.15.0)'),
              L('in', 'pipeline comentou em PROJ-123: versão v2.15.0 e link da execução'),
              L('hint', 'o agente nunca fecha o próprio trabalho: a esteira e as pessoas movem o ticket')] }
          ],
          tutorAntes: 'Aperte Enter e acompanhe cada linha que começa com "Jira:". Pergunte-se, a cada uma, quem fez a transição.',
          tutorDepois: 'A chave apareceu na branch, no commit e no PR; o Jira acompanhou sozinho. Nenhuma transição saiu do agente.',
          callout: 'Você seguiu PROJ-123 do ticket ao deploy em cert, com cada sistema guardando o que é seu.' },
        { tipo: 'texto', html:
          '<h3>Automações que valem a pena</h3>' +
          '<ul>' +
          '<li><strong>Ao abrir branch com a chave:</strong> o Jira move a história para "Em desenvolvimento" (regra de automação do Jira).</li>' +
          '<li><strong>Ao abrir PR:</strong> move para "Em revisão"; ao mesclar, para "Aguardando cert".</li>' +
          '<li><strong>Deploy em cert/prod:</strong> a pipeline comenta no ticket com a versão e o link da execução e transiciona.</li>' +
          '<li><strong>Check de PR</strong> exigindo chave de ticket válida e o campo <code>Docs:</code> preenchido.</li>' +
          '<li><strong>Modelos de ticket</strong> (<code>jira/historia.md</code>, <code>jira/bug.md</code>) com os campos que o agente precisa: critérios, ambiente, passos, link da spec.</li>' +
          '</ul>' },
        { tipo: 'takeaway', html: 'Ticket, branch, commit e PR carregam a <mark>mesma chave</mark>; as <mark>transições</mark> são da automação e da esteira.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'jira-criterios', titulo: 'Confira: critérios mudaram',
          pergunta: 'Critérios de aceite mudaram durante o desenvolvimento. Onde se corrige primeiro?',
          opcoes: [
            { id: 'a', texto: 'Na spec do repositório, no mesmo PR; o Jira recebe o resumo e o link.', correta: true, porque: 'a spec versionada é a fonte lida pelo agente e revisada em PR. O Jira só aponta para ela.' },
            { id: 'b', texto: 'Só no Jira, porque é onde o PO trabalha.', correta: false, porque: 'atualizar só o Jira cria divergência: o agente continua lendo a spec velha.' },
            { id: 'c', texto: 'No chat do agente.', correta: false, porque: 'o chat perde a informação quando a sessão fecha.' }
          ], tutorDepois: 'Corrija na fonte; o outro lado recebe o link.' },
        { tipo: 'escolha', id: 'jira-token', titulo: 'Confira: a credencial do agente',
          pergunta: 'A equipe quer dar ao agente um token de Jira de administrador "para ele mesmo mover os tickets". O que você responde?',
          opcoes: [
            { id: 'a', texto: 'Tudo bem, desde que o time confie no agente.', correta: false, porque: 'o risco não é o agente, é o texto do ticket: quem comenta pode inserir instruções, e o agente pode obedecer.' },
            { id: 'b', texto: 'Conta de serviço que só lê e comenta; a pipeline transiciona os tickets.', correta: true, porque: 'menor privilégio limita o estrago de uma injeção de prompt, e a transição por automação mantém o agente fora do fechamento do próprio trabalho.' },
            { id: 'c', texto: 'Dê o token, mas peça no AGENTS.md que ele não apague nada.', correta: false, porque: 'instrução é orientação que o modelo pode errar ou ignorar. Limite de poder precisa estar na credencial.' }
          ], tutorDepois: 'Poder se limita na credencial, não na instrução.' },
        { tipo: 'escolha', id: 'jira-chave', titulo: 'Confira: quem enxerga o que',
          pergunta: 'O PR de PROJ-123 foi aberto com o título "Valida CNPJ no cadastro", sem a chave. O que você esperaria ver?',
          opcoes: [
            { id: 'a', texto: 'O PR aparece normalmente na história do Jira.', correta: false, porque: 'a integração liga branch, commit e PR ao ticket pela chave. Sem ela, não há vínculo.' },
            { id: 'b', texto: 'O check de título falha e o PR não aparece vinculado ao ticket no Jira; basta corrigir o título.', correta: true, porque: 'a chave é o vínculo mínimo, e o check de PR com a expressão do título existe para pegar exatamente isso.' },
            { id: 'c', texto: 'O Jira infere o ticket pelo conteúdo do PR.', correta: false, porque: 'a integração não adivinha: depende da chave em branch, commit ou título.' }
          ], tutorDepois: 'Sem a chave, o vínculo some.' },
        { tipo: 'takeaway', html: 'Dê ao agente <mark>credencial mínima</mark> e deixe a <mark>esteira</mark>, não o agente, transicionar o ticket.' }
      ] }
    ]
  });
})();
