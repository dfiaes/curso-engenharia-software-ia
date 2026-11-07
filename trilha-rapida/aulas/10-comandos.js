/* Aula 10 · Comandos reutilizáveis. Fonte: TR-texto.html, Passo 8 (caminhos verificados em 12/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  var nota = '<p class="ta-nota">Verificado em 12/10/2026 nas páginas oficiais de comandos e prompts do Claude Code, Cursor, OpenCode e Codex. † Não confirmado: se o Codex passou a aceitar comandos de projeto fora de <code>~/.codex/prompts</code> numa versão mais nova. Confira na versão em uso.</p>';

  function linha(r) { return '<tr><td>' + r.join('</td><td>') + '</td></tr>'; }
  function tabela(cab, linhas) {
    return '<table><thead><tr><th>' + cab.join('</th><th>') + '</th></tr></thead><tbody>' + linhas.map(linha).join('') + '</tbody></table>';
  }
  function onde(linhas) { return { tipo: 'texto', largo: true, html: tabela(['Pasta no repositório', 'Como chamar', 'Observações'], [linhas]) }; }

  var cmdCorrigir = [
    '---',
    'description: Corrigir bug reproduzindo primeiro com um teste que falha',
    'argument-hint: PROJ-456',
    '---',
    'Ticket de bug: $ARGUMENTS. Branch fix/<TICKET>-<slug>. NÃO altere testes existentes; apenas ADICIONE.',
    '1. Reproduza: o teste mais baixo possível que FALHA pelo motivo do ticket. Mostre a saída da falha.',
    '   Se não reproduzir, pare e diga o que falta.',
    '2. Diagnostique: 2 a 3 hipóteses com evidência a favor e contra. Escolha a causa raiz.',
    '3. Corrija com a menor mudança que resolve a causa. Rode `make check` e mostre o teste passando.',
    '4. Procure o mesmo padrão em outros lugares; liste, não corrija sem pedir.',
    '5. Nota para o PR: causa raiz, correção, risco, validação em cert, rollback.'
  ].join('\n');

  var cmdNova = [
    '---',
    'description: Nova feature em etapas (spec, plano, implementação, fechamento) a partir de um ticket',
    'argument-hint: PROJ-123',
    '---',
    'Ticket: $ARGUMENTS (se houver servidor MCP de Jira/GitHub conectado, leia a história por ele; senão peça o texto).',
    'Leia AGENTS.md e os docs relevantes. Siga prompts/nova-feature.md, em etapas, e PARE ao fim de cada uma:',
    '1. Intenção e spec em modo leitura: no máximo 7 perguntas; depois docs/specs/<TICKET>-<slug>.md.',
    '2. Plano em docs/plans/<TICKET>-<slug>.md: arquivos, passos pequenos com `make check`, riscos, rollback.',
    '3. Implementação (só após aprovação do plano): branch feat/<TICKET>-<slug>; teste primeiro; commit "<TICKET>: ...".',
    '4. Fechamento: docs, CHANGELOG, descrição do PR citando cada critério e o teste que o cobre.',
    'Nada fora do escopo da spec. Não toque em caminhos protegidos.'
  ].join('\n');

  var cmdDocs = [
    '---',
    'description: Comparar o diff da branch com a documentação e propor as edições (anti-drift)',
    'argument-hint: "[branch-base, padrão origin/main]"',
    '---',
    'Base de comparação: $ARGUMENTS (se vazio, use origin/main). Rode `git diff <base>...HEAD` e compare com',
    'docs/specs, docs/plans, docs/runbooks, docs/architecture.md, README, CHANGELOG e AGENTS.md.',
    '1. Liste cada afirmação da doc que o diff tornou falsa, incompleta ou obsoleta.',
    '2. Liste comportamentos novos do diff que não estão documentados.',
    '3. Proponha as edições exatas; para decisão estrutural, rascunhe uma ADR.',
    '4. Entrada no CHANGELOG com a chave do ticket.',
    'Não invente: o que não puder verificar no código, marque "precisa de confirmação humana".'
  ].join('\n');

  /* /corrigir-bug PROJ-77: etapas reutilizadas pelo rode e pelo quebre. */
  var entrada = '/corrigir-bug PROJ-77';
  var etapas = function () {
    return [
      { id: 'repro', nome: 'Reproduzir', descricao: 'Um teste que falha pelo motivo do ticket', tom: 'dns', ms: 40, linhas: [
        L('info', 'comando: .agents/commands/corrigir-bug.md  ($ARGUMENTS = PROJ-77)'),
        L('info', 'ticket PROJ-77: "cupom de 100% gera total negativo no pedido"'),
        L('cmd', 'git switch -c fix/PROJ-77-cupom-total-negativo'),
        L('in', 'tests/PedidoServiceTests.cs: teste novo Cupom100PorCento_TotalNaoFicaNegativo'),
        L('cmd', 'dotnet test --filter Cupom100PorCento'),
        L('out', 'Failed Cupom100PorCento_TotalNaoFicaNegativo'),
        L('out', 'Assert.Equal() Failure: Expected: 0.00  Actual: -3.50'),
        L('hint', 'parada: o teste vermelho tem o motivo do ticket? Se sim, siga.')] },
      { id: 'diag', nome: 'Diagnosticar', descricao: 'Hipóteses com evidência, uma causa raiz', tom: 'tcp', ms: 35, linhas: [
        L('info', 'hipótese 1: desconto arredonda para cima (evidência contra: -3.50 não é arredondamento)'),
        L('info', 'hipótese 2: frete somado depois do desconto (evidência a favor: 3.50 é o frete)'),
        L('body', 'causa raiz: o total = itens - desconto + frete, mas o desconto é aplicado sobre itens e frete'),
        L('hint', 'decisão humana: a causa raiz explica o sintoma?')] },
      { id: 'fix', nome: 'Corrigir', descricao: 'A menor mudança que resolve a causa', tom: 'tls', ms: 60, linhas: [
        L('info', 'edit src/Pedidos/CalculadoraTotal.cs (+2 -1): desconto limitado ao subtotal dos itens'),
        L('cmd', 'make check'),
        L('out', 'dotnet format --verify-no-changes   ok'),
        L('out', 'dotnet test   124 passed, 0 failed'),
        L('in', 'Cupom100PorCento_TotalNaoFicaNegativo: Passed'),
        L('hint', 'o teste que estava vermelho agora passa, e nenhum teste antigo foi alterado')] },
      { id: 'padrao', nome: 'Procurar o padrão', descricao: 'Lista, sem corrigir sem pedir', tom: 'request', ms: 12, linhas: [
        L('cmd', 'grep -rn "Desconto" src/ --include=*.cs'),
        L('out', 'src/Pedidos/CalculadoraTotal.cs:41  (corrigido)'),
        L('out', 'src/Assinaturas/CalculadoraMensalidade.cs:27  mesmo padrão, não corrigido'),
        L('hint', 'decisão humana: abrir ticket para a mensalidade?')] },
      { id: 'nota', nome: 'Nota para o PR', descricao: 'Causa, correção, risco, validação e rollback', tom: 'response', ms: 8, linhas: [
        L('body', 'Causa raiz: desconto aplicado sobre itens e frete.'),
        L('body', 'Correção: desconto limitado ao subtotal dos itens.'),
        L('body', 'Risco: baixo, uma função.  Validação em cert: pedido com cupom de 100%.'),
        L('body', 'Rollback: reverter o commit PROJ-77.')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'comandos',
    titulo: 'Comandos reutilizáveis',
    minutos: 15,
    resumo: 'Um prompt versionado no repositório e chamado pelo nome, com argumentos: o jeito mais barato de transformar o método do time em hábito.',
    revisao: [
      {
        "id": "onde-escrever-comando",
        "pergunta": "Como manter o <code>/corrigir-bug</code> para Cursor, Claude Code e Codex?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Escrever uma vez em <code>.agents/commands/</code> e gerar a cópia de cada ferramenta com o bootstrap",
            "correta": true,
            "porque": "uma fonte, várias cópias geradas."
          },
          {
            "id": "b",
            "texto": "Manter um arquivo por ferramenta, editados à mão",
            "correta": false,
            "porque": "em semanas os três divergem."
          },
          {
            "id": "c",
            "texto": "Colar o texto no chat de cada sessão",
            "correta": false,
            "porque": "não é versionado nem revisável."
          }
        ]
      },
      {
        "id": "comando-falhou",
        "pergunta": "O agente rodou <code>/nova-feature PROJ-123</code> e pulou a aprovação da spec. Onde corrigir?",
        "opcoes": [
          {
            "id": "a",
            "texto": "No arquivo do comando, que é código do time",
            "correta": true,
            "porque": "se o fluxo falha, corrija o arquivo, não o chat."
          },
          {
            "id": "b",
            "texto": "Na conversa, pedindo desculpas ao agente",
            "correta": false,
            "porque": "a correção some com a sessão."
          },
          {
            "id": "c",
            "texto": "No Jira, mudando o estado do ticket",
            "correta": false,
            "porque": "o estado do ticket não controla o que o agente faz."
          }
        ]
      },
      {
        "id": "teste-primeiro",
        "pergunta": "No <code>/corrigir-bug</code>, o que vem primeiro?",
        "opcoes": [
          {
            "id": "a",
            "texto": "O teste vermelho, que falha pelo motivo do ticket",
            "correta": true,
            "porque": "sem ele a correção é palpite."
          },
          {
            "id": "b",
            "texto": "A correção mínima",
            "correta": false,
            "porque": "corrigir antes de reproduzir esconde se o diagnóstico estava certo."
          },
          {
            "id": "c",
            "texto": "A atualização da documentação",
            "correta": false,
            "porque": "doc fecha o ciclo; não é o começo."
          }
        ]
      },
      {
        "id": "virar-hook",
        "pergunta": "O que \"não pode acontecer\" deve virar o quê?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Um hook",
            "correta": true,
            "porque": "comando pede; hook impede."
          },
          {
            "id": "b",
            "texto": "Uma linha em negrito no comando",
            "correta": false,
            "porque": "texto no comando ainda pode ser ignorado."
          },
          {
            "id": "c",
            "texto": "Um item no checklist do PR",
            "correta": false,
            "porque": "checklist avisa depois do fato; o hook barra antes."
          }
        ]
      }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Nas aulas anteriores você usou prompts longos, como <code>prompts/nova-feature.md</code> e <code>corrigir-bug.md</code>. Colar vinte linhas toda vez é lento, e cada pessoa cola uma versão diferente. É a receita do caderno, copiada de memória por cada cozinheiro.</p>' +
          '<p>Um <strong>comando</strong> é um prompt versionado no repositório e acionado pelo nome, com argumentos: <code>/nova-feature PROJ-123</code>.</p>' +
          '<h3>Anatomia</h3>' +
          '<ul>' +
          '<li><strong>Um arquivo Markdown por comando.</strong> O nome do arquivo é o nome do comando. Frontmatter opcional com <code>description</code> (aparece na lista ao digitar <code>/</code>) e <code>argument-hint</code>.</li>' +
          '<li><strong>Corpo = o prompt.</strong> Escreva como instrução ao agente, com etapas e pontos de parada, referenciando os artefatos do repositório (<code>AGENTS.md</code>, <code>docs/specs/</code>, <code>make check</code>).</li>' +
          '<li><strong>Argumentos.</strong> <code>$ARGUMENTS</code> recebe tudo o que vem depois do nome. Claude Code, OpenCode e os prompts do Codex também aceitam posicionais (<code>$1</code>, <code>$2</code>). Para o Cursor, a documentação consultada não descreve argumentos †: o texto digitado depois do comando acompanha a conversa.</li>' +
          '<li><strong>Comando não é regra.</strong> Ele roda quando <em>você</em> chama. O que precisa valer sempre mora no <code>AGENTS.md</code> e em hooks.</li>' +
          '</ul>' },
        { tipo: 'texto', html: '<h3>Onde cada ferramenta procura</h3><p>O conceito é o mesmo; a pasta muda. Escolha a ferramenta do seu time.</p>' },
        { tipo: 'abas', rotulo: 'Ferramenta', itens: [
          { rotulo: 'Cursor', blocos: [onde(['<code>.cursor/commands/nome.md</code>', '<code>/nome</code> no chat', 'Markdown simples, sem frontmatter documentado.'])] },
          { rotulo: 'Codex', blocos: [onde(['Sem pasta de repositório para comandos: "prompts personalizados" ficam em <code>~/.codex/prompts/</code> (do usuário) e estão <em>obsoletos</em>', '<code>/prompts:nome</code>; ou, como skill, <code>$nome</code>', 'A recomendação oficial é usar skills. O kit converte cada comando em uma skill para o Codex.'])] },
          { rotulo: 'OpenCode', blocos: [onde(['<code>.opencode/commands/nome.md</code>', '<code>/nome args</code>', 'Frontmatter: <code>description</code>, <code>agent</code>, <code>model</code>, <code>subtask</code>. Aceita <code>$ARGUMENTS</code>, <code>$1</code>. Também pode ser definido na chave <code>command</code> do <code>opencode.json</code>.'])] },
          { rotulo: 'Claude Code', blocos: [onde(['<code>.claude/commands/nome.md</code>', '<code>/nome args</code>', 'Comandos foram unificados com skills: <code>.claude/commands/x.md</code> e <code>.claude/skills/x/SKILL.md</code> criam o mesmo <code>/x</code>. Aceita <code>$ARGUMENTS</code>, <code>$1</code>.'])] }
        ] },
        { tipo: 'texto', html: '<p><strong>Agente próprio:</strong> a mesma pasta <code>.agents/commands/</code>, lida por uma função <code>carregar_comando(nome, args)</code>: leia o arquivo, substitua <code>$ARGUMENTS</code> e envie como mensagem do usuário.</p>' + nota },
        { tipo: 'texto', html:
          '<h3>Fonte única e cópia por ferramenta</h3>' +
          '<p>Não mantenha quatro cópias à mão: na primeira edição elas divergem. O kit guarda os comandos em <code>.agents/commands/</code> e o <code>bootstrap.py</code> distribui:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          'python3 kit/bootstrap.py . --tools cursor,claude,codex,opencode --dry-run   # veja o que será criado\n' +
          'python3 kit/bootstrap.py . --tools claude,opencode' },
        { tipo: 'texto', html: '<p>Se o time padroniza em uma ferramenta, rode só com ela. Quando outra chegar, rode de novo: o script nunca sobrescreve o que já existe.</p>' },
        { tipo: 'takeaway', html: 'Escreva <mark>uma vez</mark> em <code>.agents/commands/</code> e deixe o <mark>bootstrap</mark> gerar a cópia de cada ferramenta.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>O kit traz três comandos. Leia cada um e repare no padrão: etapas numeradas, <strong>pontos de parada</strong> e um critério de pronto.</p>' },
        { tipo: 'abas', rotulo: 'Comando', itens: [
          { rotulo: '/nova-feature', blocos: [
            { tipo: 'texto', html: '<p>Arquivo <code>.agents/commands/nova-feature.md</code>. Conduz o fluxo de feature pequena em quatro etapas, com parada para aprovação.</p>' },
            { tipo: 'codigo', linguagem: 'markdown', texto: cmdNova },
            { tipo: 'texto', html: '<p><strong>Uso:</strong> <code>/nova-feature PROJ-123</code>. <strong>Esperado:</strong> o agente faz até 7 perguntas e para; só depois de você aprovar a spec ele escreve o plano. Se ele pular direto para o código, o comando falhou, e a correção vai para o arquivo do comando.</p>' }] },
          { rotulo: '/corrigir-bug', blocos: [
            { tipo: 'texto', html: '<p>Arquivo <code>.agents/commands/corrigir-bug.md</code>. Implementa a regra do fluxo de bug: <strong>o teste que falha vem primeiro</strong>.</p>' },
            { tipo: 'codigo', linguagem: 'markdown', texto: cmdCorrigir },
            { tipo: 'texto', html: '<p><strong>Uso:</strong> <code>/corrigir-bug PROJ-456</code>. <strong>Esperado:</strong> primeiro aparece um teste vermelho com o motivo certo; só então o diff de correção. O hook de <code>fix/</code> do kit garante a parte "não altere testes existentes".</p>' }] },
          { rotulo: '/atualizar-docs', blocos: [
            { tipo: 'texto', html: '<p>Arquivo <code>.agents/commands/atualizar-docs.md</code>. Executa o anti-drift (documentação que não desvia do código) antes de abrir o PR.</p>' },
            { tipo: 'codigo', linguagem: 'markdown', texto: cmdDocs },
            { tipo: 'texto', html: '<p><strong>Uso:</strong> <code>/atualizar-docs</code> ou <code>/atualizar-docs origin/develop</code>. <strong>Esperado:</strong> uma lista de trechos de doc afetados, com arquivo e edição proposta, e itens marcados como "precisa de confirmação humana" quando o código não prova.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<p>Agora rode o <code>/corrigir-bug</code> num bug do pedido (API .NET). Depois de rodar, clique em cada etapa: a primeira mostra o teste falhando antes de qualquer correção.</p>' },
        { tipo: 'rode', id: 'cmd-rode', titulo: 'Rode /corrigir-bug PROJ-77', enunciado: 'Chame o comando com a chave do ticket e acompanhe as cinco etapas. A saída é um exemplo ilustrativo (os tempos variam).',
          prefixo: 'Prompt', entrada: entrada, unidade: 's', etapas: etapas(), terminalTitulo: 'agente',
          tutorAntes: 'Aperte Enter. Depois clique em "Reproduzir" e leia a saída do teste vermelho.',
          tutorDepois: 'Repare na ordem: teste vermelho, causa raiz, correção mínima, teste verde. O diff de correção só existe depois da evidência da falha.',
          callout: 'O comando fez o time inteiro rodar o mesmo método: a ordem está no arquivo, não na memória de cada pessoa.' },
        { tipo: 'texto', html:
          '<p>Um comando é só texto, então o agente pode desviar dele. Quebre de propósito o <code>/corrigir-bug</code> e veja onde cada desvio é pego.</p>' },
        { tipo: 'quebre', id: 'cmd-quebre', titulo: 'Quebre o /corrigir-bug', enunciado: 'Escolha um desvio, rode o mesmo comando e veja o que o impede. Depois rode sem falha.',
          prefixo: 'Prompt', entrada: entrada, unidade: 's', etapas: etapas(), terminalTitulo: 'agente',
          tutorAntes: 'Escolha "Pular a reprodução", aperte Enter e leia. Depois teste o outro desvio e, por fim, rode sem falha.',
          tutorDepois: 'O comando descreve o método; o hook do kit impede o desvio que não pode acontecer. Um não substitui o outro.',
          callout: 'Você viu os dois desvios e o fluxo correto.',
          falhas: [
            { id: 'sem-repro', rotulo: 'Pular a reprodução', efeito: { etapaFalha: 'repro', linhasErro: [
              'reprodução pulada: "a causa é óbvia, vou direto à correção"',
              { kind: 'info', text: 'agente: o total negativo deve ser arredondamento; edit CalculadoraTotal.cs (+1 -1)' },
              { kind: 'cmd', text: 'make check' },
              { kind: 'in', text: '123 passed (nenhum teste cobre o cupom de 100%)' },
              { kind: 'in', text: 'pull request #88 aberto: "corrige arredondamento"' },
              'em cert o pedido com cupom de 100% continua com total negativo'
            ], tutor: 'sem o teste vermelho, ninguém prova que o bug foi reproduzido, nem que a correção o resolve. O agente tratou o sintoma errado e os testes continuaram verdes. Se isso aconteceu, a correção vai no arquivo do comando: a etapa 1 diz "pare se não reproduzir".' } },
            { id: 'edita-teste', rotulo: 'Alterar um teste existente', efeito: { etapaFalha: 'fix', linhasErro: [
              { kind: 'info', text: 'agente: o teste TotalComFreteTests falha com a correção; vou ajustar o valor esperado' },
              { kind: 'cmd', text: 'edit tests/TotalComFreteTests.cs' },
              { kind: 'out', text: 'hook fix/: edição de teste existente em branch fix/ bloqueada' },
              { kind: 'out', text: 'exit 2: apenas ADICIONE testes em branch fix/' },
              'o agente tentou fazer o teste concordar com o código, em vez do contrário'
            ], tutor: 'o comando já dizia "NÃO altere testes existentes", mas texto é orientação. Quem impediu foi o hook de fix/ do kit. Comando conduz o fluxo; hook garante o que não pode acontecer.' } }
          ] },
        { tipo: 'takeaway', html: 'No <mark>/corrigir-bug</mark>, o <mark>teste vermelho vem primeiro</mark>; o que não pode acontecer vira <mark>hook</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'cmd-fonte', titulo: 'Confira: manter o comando',
          pergunta: 'O time usa Cursor, Claude Code e Codex. Qual é a forma mais sustentável de manter o comando <code>/corrigir-bug</code>?',
          opcoes: [
            { id: 'a', texto: 'Um arquivo em <code>.agents/commands/</code> como fonte única e <code>bootstrap.py --tools</code> para gerar as cópias de cada ferramenta.', correta: true, porque: 'fonte única evita divergência entre ferramentas, e a cópia gerada nunca sobrescreve o que já existe.' },
            { id: 'b', texto: 'Escrever e editar à mão uma cópia em cada pasta de ferramenta.', correta: false, porque: 'funciona no primeiro dia e diverge na primeira edição.' },
            { id: 'c', texto: 'Guardar o texto no chat de cada pessoa.', correta: false, porque: 'não é versionado nem revisável, e volta ao problema de cada um colar uma versão.' }
          ], tutorDepois: 'Fonte única no repositório, cópia gerada por ferramenta.' },
        { tipo: 'escolha', id: 'cmd-falha', titulo: 'Confira: o comando falhou',
          pergunta: 'O agente rodou <code>/nova-feature PROJ-123</code> e pulou direto para o código, sem pedir aprovação da spec. Onde você corrige?',
          opcoes: [
            { id: 'a', texto: 'No chat: peço desculpa ao agente e explico de novo.', correta: false, porque: 'o chat acaba com a sessão. Amanhã outra pessoa chama o comando e o desvio volta.' },
            { id: 'b', texto: 'No arquivo do comando, deixando a parada ao fim de cada etapa mais explícita, e commitando a mudança.', correta: true, porque: 'o comando é código do time. Corrigir o arquivo corrige para todo mundo e fica revisável.' },
            { id: 'c', texto: 'Em lugar nenhum: é comportamento do modelo.', correta: false, porque: 'o texto do comando é a parte que você controla. Se o comportamento se repete, o arquivo precisa mudar.' }
          ], tutorDepois: 'Fluxo falhou: corrija o arquivo, não o chat.' },
        { tipo: 'takeaway', html: 'Comando é <mark>código do time</mark>: se o fluxo falha, <mark>corrija o arquivo</mark>, não o chat.' }
      ] }
    ]
  });
})();
