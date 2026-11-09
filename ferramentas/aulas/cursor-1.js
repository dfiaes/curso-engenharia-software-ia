/* Ferramentas · Cursor 1. Fatos verificados em 09/11/2026 na documentação oficial (cursor.com/docs); tabela em ferramentas/fontes/cursor.md. Saídas de terminal são exemplos. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tabela(cab, linhas) {
    return { tipo: 'texto', largo: true, html: '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' };
  }

  TrilhaAula.registrar({
    id: 'fer-cursor-1',
    titulo: 'Cursor do zero ao dia a dia',
    minutos: 40,
    resumo: 'O Cursor tem duas portas para o mesmo agente: o editor e o CLI agent. Veja como instalar, entrar, escrever as regras do projeto, controlar permissões e fechar o ciclo plano, implementação e revisão.',
    objetivo: 'Instalar o Cursor CLI e autenticar, escrever uma regra .mdc e um AGENTS.md que a ferramenta lê, escolher o modo e o run mode certos para a tarefa e conduzir um ciclo plano, implementação e revisão sem confundir checkpoint com Git.',
    revisao: [
      { id: 'cur1-ext', pergunta: 'Você criou <code>.cursor/rules/testes.md</code> com frontmatter correto e a regra nunca aparece. Qual a causa mais provável?',
        opcoes: [
          opc('a', 'Regras de projeto precisam da extensão <code>.mdc</code>; um <code>.md</code> em <code>.cursor/rules</code> é ignorado', true, 'é o que a página de regras diz (verificado em 09/11/2026). O <code>AGENTS.md</code>, ao contrário, é markdown puro sem frontmatter.'),
          opc('b', 'O frontmatter só vale com <code>alwaysApply: true</code>', false, 'com <code>alwaysApply: true</code> a regra entra sempre; com <code>false</code> entram <code>globs</code> ou <code>description</code>.'),
          opc('c', 'O Cursor só lê regras do painel do time', false, 'regras de projeto, de usuário e de time existem juntas.')] },
      { id: 'cur1-prec', pergunta: 'Duas regras dão ordens conflitantes: uma de Team Rules, outra de Project Rules. Qual prevalece?',
        opcoes: [
          opc('a', 'A de Team Rules', true, 'a precedência é Team, depois Project, depois User; as regras aplicáveis são mescladas e a fonte anterior vence o conflito.'),
          opc('b', 'A de Project Rules, por estar no repositório', false, 'o repositório fica no meio da ordem, não no topo.'),
          opc('c', 'A mais recente por data de edição', false, 'data de edição não entra na precedência.')] },
      { id: 'cur1-check', pergunta: 'O que o checkpoint do Cursor restaura ao ser aplicado?',
        opcoes: [
          opc('a', 'Os arquivos modificados; as mensagens da conversa continuam', true, 'o checkpoint reverte só arquivos e vive localmente, separado do Git.'),
          opc('b', 'Arquivos e histórico de commits', false, 'o checkpoint não toca o Git: use Git para versionamento permanente.'),
          opc('c', 'A conversa inteira, como se nada tivesse sido dito', false, 'restaurar não remove mensagens.')] },
      { id: 'cur1-auto', pergunta: 'O que a documentação diz sobre o run mode Auto-review?',
        opcoes: [
          opc('a', 'É recomendado, mas não é uma fronteira de segurança: o classificador erra nos dois sentidos', true, 'por isso regras de negação e hooks continuam necessários para o que não pode acontecer.'),
          opc('b', 'É uma fronteira de segurança completa para comandos de shell', false, 'a página afirma o contrário.'),
          opc('c', 'Roda todo comando sem pedir nada', false, 'quem faz isso é o Run Everything.')] },
      { id: 'cur1-modo', pergunta: 'Você quer que o agente apenas responda perguntas sobre o código, sem editar. Qual modo?',
        opcoes: [
          opc('a', 'Ask (<code>/ask</code> ou <code>--mode=ask</code>)', true, 'Ask é somente leitura. Plan também não edita antes da aprovação, mas produz um plano para construir depois.'),
          opc('b', 'Agent', false, 'Agent tem acesso total às ferramentas.'),
          opc('c', 'Plan', false, 'Plan serve para planejar uma construção, não só responder.')] }
    ],
    abas: [
      { rotulo: 'Instalar e entrar', blocos: [
        { tipo: 'texto', html:
          '<p>O Cursor é um editor com um agente embutido. O mesmo agente roda também no terminal pelo <strong>Cursor CLI</strong>, cujo binário se chama <code>agent</code>. Você já conhece o ciclo (pedir, ler o diff, rodar a verificação); aqui o que muda é o endereço de cada peça. Tudo abaixo foi conferido na documentação oficial em <strong>09/11/2026</strong>.</p>' +
          '<h3>Duas portas</h3>' +
          '<ul><li><strong>Editor.</strong> Baixe o instalador (macOS 12+, Windows 10+ ou Linux), entre com a conta, abra uma pasta e pressione <kbd>Cmd</kbd>+<kbd>I</kbd> (macOS) ou <kbd>Ctrl</kbd>+<kbd>I</kbd> para abrir o Agent.</li>' +
          '<li><strong>CLI.</strong> Útil quando você já está no terminal, em SSH ou em script. Instala-se com um comando:</li></ul>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# macOS, Linux e WSL', 'curl https://cursor.com/install -fsS | bash', '',
          '# o instalador coloca o binário em ~/.local/bin; confira o PATH', 'echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.zshrc && source ~/.zshrc',
          'agent --version'].join('\n') },
        { tipo: 'codigo', linguagem: 'powershell', texto: ['# Windows nativo (PowerShell)', "irm 'https://cursor.com/install?win32=true' | iex", 'agent --version'].join('\n') },
        { tipo: 'texto', html:
          '<h3>Autenticação</h3>' +
          '<p>Há dois caminhos. O <strong>login pelo navegador</strong> é o recomendado para uso pessoal. A <strong>chave de API</strong>, gerada no painel (Dashboard, API Keys), serve para scripts e CI e entra pela variável <code>CURSOR_API_KEY</code> (ou pelo flag <code>--api-key</code>, que deixa a chave no histórico do shell; prefira a variável).</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          'agent login        # abre o navegador', 'NO_OPEN_BROWSER=1 agent login   # só imprime a URL (útil em servidor)', 'agent status       # conta e endpoint em uso', 'agent logout       # apaga as credenciais salvas', '',
          '# alternativa para scripts', 'export CURSOR_API_KEY=...   # nunca versionar'].join('\n') },
        { tipo: 'rode', id: 'cur1-rode', titulo: 'Instale e confirme a conta',
          enunciado: 'Rode a sequência de instalação e login. A saída é um <strong>exemplo</strong>: o texto exato varia por versão e conta.',
          prefixo: '$', entrada: 'curl https://cursor.com/install -fsS | bash', unidade: 'ms', terminalTitulo: 'terminal (exemplo)',
          etapas: [
            { id: 'inst', nome: 'Instalar', descricao: 'Baixa o binário e coloca em ~/.local/bin', tom: 'dns', ms: 900, linhas: [
              L('cmd', 'curl https://cursor.com/install -fsS | bash'), L('info', 'Instalando o Cursor CLI em ~/.local/bin/agent'), L('hint', 'Exemplo. Se "agent: command not found" aparecer, o PATH não inclui ~/.local/bin.')] },
            { id: 'ver', nome: 'Conferir a versão', descricao: 'Prova que o binário está no PATH', tom: 'tcp', ms: 40, linhas: [
              L('cmd', 'agent --version'), L('out', '<versão instalada>')] },
            { id: 'login', nome: 'Entrar', descricao: 'Autenticação pelo navegador', tom: 'tls', ms: 1500, linhas: [
              L('cmd', 'agent login'), L('info', 'Abrindo o navegador para concluir a autenticação...'), L('out', 'Autenticado.')] },
            { id: 'status', nome: 'Confirmar o estado', descricao: 'Conta e endpoint sem abrir uma sessão', tom: 'response', ms: 80, linhas: [
              L('cmd', 'agent status'), L('out', 'Autenticado como <seu e-mail>'), L('out', 'Endpoint: <padrão>')] }
          ],
          prever: { pergunta: 'Você já fez <code>agent login</code> e quer ver a conta e o endpoint em uso sem abrir uma conversa. Qual comando?', opcoes: [
            { id: 'a', texto: '<code>agent --version</code>', correta: false, porque: 'mostra a versão do binário, não a conta.' },
            { id: 'b', texto: '<code>agent status</code> (alias <code>whoami</code>)', correta: true, porque: 'a página de autenticação descreve status como a forma de ver se você está autenticado, a conta e o endpoint.' },
            { id: 'c', texto: '<code>agent ls</code>', correta: false, porque: 'lista conversas anteriores.' }
          ] },
          tutorDepois: 'Instalar, conferir o PATH, entrar e confirmar. O <code>agent update</code> existe, mas o CLI se atualiza sozinho por padrão.',
          callout: 'Você viu a sequência instalar, versão, login e status.' },
        { tipo: 'takeaway', html: 'Duas portas, <mark>um agente</mark>: editor para o dia a dia, <mark>agent</mark> no terminal, e <mark>CURSOR_API_KEY</mark> para automação.' }
      ] },

      { rotulo: 'Instruções do projeto', blocos: [
        { tipo: 'texto', html:
          '<p>Todo agente precisa saber os comandos de verificação e as convenções do repositório. No Cursor isso mora em dois lugares que convivem.</p>' +
          '<h3>AGENTS.md e regras .mdc</h3>' +
          '<ul><li><strong><code>AGENTS.md</code></strong> na raiz (e em subpastas): markdown puro, sem frontmatter. O CLI lê também o <code>CLAUDE.md</code> da raiz.</li>' +
          '<li><strong>Project Rules</strong> em <code>.cursor/rules/</code>, versionadas. O arquivo precisa terminar em <code>.mdc</code>; um <code>.md</code> nessa pasta é ignorado.</li>' +
          '<li><strong>User Rules</strong> (Customize, Rules) valem para todos os seus projetos. <strong>Team Rules</strong> vêm do painel, nos planos Teams e Enterprise.</li></ul>' +
          '<p>O frontmatter de uma regra tem três campos e quatro comportamentos:</p>' },
        tabela(['Combinação', 'Quando a regra entra', 'Tipo na interface'], [
          ['<code>alwaysApply: true</code>', 'Em toda conversa (<code>globs</code> e <code>description</code> são ignorados)', 'Always Apply'],
          ['<code>alwaysApply: false</code> + <code>globs</code>', 'Quando um arquivo que casa com o glob está no contexto', 'Apply to Specific Files'],
          ['<code>alwaysApply: false</code> + <code>description</code>', 'Quando o agente julga relevante pela descrição', 'Apply Intelligently'],
          ['<code>alwaysApply: false</code> sem os dois', 'Só quando você faz @-menção da regra', 'Apply Manually']]),
        { tipo: 'texto', html:
          '<p>Precedência: <strong>Team, depois Project, depois User</strong>; as regras aplicáveis são mescladas e, em conflito, a fonte mais acima vence. A documentação recomenda manter cada regra abaixo de 500 linhas, dividir regras grandes e referenciar arquivos em vez de copiar o conteúdo.</p>' +
          '<p>A regra de ouro do curso continua valendo: escreva o conteúdo uma vez no <code>AGENTS.md</code> e deixe o <code>.cursor/rules</code> só para o que é específico do Cursor (por exemplo, uma regra por <code>glob</code>).</p>' },
        { tipo: 'complete', id: 'cur1-complete', titulo: 'Monte uma regra por glob', linguagem: 'markdown',
          enunciado: 'A regra deve valer só quando um teste Python estiver no contexto. Escolha, em cada lacuna, a peça certa.',
          partes: [
            '# .cursor/rules/testes.', { lacuna: 'ext', opcoes: ['mdc', 'md', 'yaml'], correta: 'mdc' },
            '\n---\ndescription: Convenções dos testes pytest\nglobs: tests/**/*.py\nalwaysApply: ', { lacuna: 'always', opcoes: ['false', 'true'], correta: 'false' },
            '\n---\n- Use fixtures em vez de setUp.\n- Um comportamento por teste; nome diz o cenário.\n\n# Se esta regra conflitar com uma de outra origem, vence a ordem: ',
            { lacuna: 'prec', opcoes: ['Team, Project, User', 'User, Project, Team', 'Project, User, Team'], correta: 'Team, Project, User' }
          ],
          explicacao: 'A extensão <code>.mdc</code> é obrigatória nas regras de projeto. Com <code>alwaysApply: true</code>, o <code>globs</code> seria ignorado e a regra entraria em toda conversa; por isso o valor é <code>false</code>. A precedência é Team, Project, User.',
          callout: 'Regra por glob montada: extensão certa, escopo estreito e precedência conhecida.' },
        { tipo: 'callout', tom: 'info', titulo: 'Comece com o que o agente erra', html: '<p>Rode <code>/rules</code> no CLI para ver as regras carregadas (há também <code>/commands</code> e <code>/skills</code>). Regra nova nasce do segundo erro repetido, não de uma lista de desejos.</p>' },
        { tipo: 'takeaway', html: '<mark>AGENTS.md</mark> é a fonte; <mark>.cursor/rules/*.mdc</mark> guarda o que é do Cursor; extensão errada vira regra <mark>ignorada</mark>.' }
      ] },

      { rotulo: 'Modos, permissões e ciclo', blocos: [
        { tipo: 'texto', html:
          '<h3>Três modos</h3>' +
          '<p>Pressione <kbd>Shift</kbd>+<kbd>Tab</kbd> para alternar entre <strong>Agent</strong> (acesso total às ferramentas), <strong>Plan</strong> (pergunta, pesquisa o código e entrega um plano em markdown antes de qualquer edição) e <strong>Ask</strong> (somente leitura, responde sem editar). No CLI também existem <code>/plan</code>, <code>/ask</code>, <code>--plan</code> e <code>--mode=</code>.</p>' +
          '<p>O plano fica por padrão no seu diretório home. Para versionar, use <strong>Save to workspace</strong>; você pode editar o markdown do plano antes de mandar construir.</p>' +
          '<h3>Run modes: quem aprova o quê</h3>' +
          '<p>Em Settings, Agents, Approvals &amp; Execution há três modos para comandos de shell, MCP e fetch:</p>' },
        tabela(['Run mode', 'O que roda sem perguntar', 'Sandbox / classificador'], [
          ['Auto-review (recomendado)', 'Itens da allowlist; outros comandos de shell rodam no sandbox quando possível', 'Sandbox sim; classificador sim, para o que precisa de mais acesso'],
          ['Allowlist', 'Só o que está na allowlist', 'Sandbox opcional; sem classificador'],
          ['Run Everything', 'Toda chamada de ferramenta', 'Sem sandbox, sem classificador']]),
        { tipo: 'texto', html:
          '<p>O sandbox usa Seatbelt no macOS e Landlock ou Bubblewrap no Linux. Dentro dele, o agente lê e escreve no workspace, a rede fica bloqueada por padrão e caminhos como <code>.git/config</code> e <code>.git/hooks</code> são protegidos. A própria página avisa: <strong>Auto-review não é uma fronteira de segurança</strong>. Você pode orientar o classificador com <code>allow_instructions</code> e <code>block_instructions</code> em <code>permissions.json</code> (global em <code>~/.cursor/</code> ou por projeto em <code>.cursor/</code>). Cloud Agents não perguntam nada: Run Modes valem só para agentes locais.</p>' +
          '<p>No CLI, a negação explícita é arquivo: <code>~/.cursor/cli-config.json</code> (global) ou <code>&lt;projeto&gt;/.cursor/cli.json</code>, com tokens <code>Shell(base)</code>, <code>Read(glob)</code>, <code>Write(glob)</code>, <code>WebFetch(domínio)</code> e <code>Mcp(servidor:ferramenta)</code>. <strong>Negar vence permitir.</strong></p>' },
        { tipo: 'codigo', linguagem: 'json', texto: [
          '{', '  "permissions": {', '    "allow": ["Shell(npm)", "Shell(git)", "Read(**/*.md)", "Write(src/**)"],',
          '    "deny":  ["Shell(rm)", "Read(.env*)", "Write(**/*.key)", "Write(.github/workflows/**)"]', '  }', '}'].join('\n') },
        { tipo: 'texto', html:
          '<h3>Checkpoints não são Git</h3>' +
          '<p>Antes de mudanças significativas o Cursor cria um <strong>checkpoint</strong>. Restaurá-lo reverte arquivos, <em>não remove mensagens</em> da conversa, e ele fica no seu disco, separado do Git. Commit continua sendo a única memória confiável.</p>' },
        { tipo: 'ordene', id: 'cur1-ordene', titulo: 'Ordene o ciclo de uma tarefa',
          enunciado: 'Ponha os passos na ordem do fluxo plano, implementação e revisão.',
          itens: [
            { id: 'commit', texto: 'Commitar no Git o que passou na verificação' },
            { id: 'build', texto: 'Mandar construir o plano no modo Agent (o checkpoint é criado antes das edições)' },
            { id: 'plano', texto: '<kbd>Shift</kbd>+<kbd>Tab</kbd> até Plan e descrever a tarefa' },
            { id: 'revisar', texto: 'Pedir ao agente que rode testes, lint e tipos e revisar o diff (no CLI, <kbd>Ctrl</kbd>+<kbd>R</kbd>)' },
            { id: 'refinar', texto: 'Responder as perguntas, editar o plano e salvá-lo no workspace se for versionar' }
          ], solucao: ['plano', 'refinar', 'build', 'revisar', 'commit'],
          dica: 'Nada é construído antes de o plano ser aprovado; commit só depois da verificação.',
          tutorDepois: 'Plano, ajuste, construção, verificação e commit. O plano salvo no workspace passa a ser documento do PR.' },
        { tipo: 'transcript', id: 'cur1-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'sessão (exemplo)',
          enunciado: 'Leia a sessão. Uma das falas do agente contradiz a documentação. Clique nela e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'A tentativa 2 quebrou o módulo de relatórios. Restaure o checkpoint anterior.' },
            { quem: 'agente', texto: 'Restaurando o checkpoint anterior ao início da tentativa 2.' },
            { quem: 'ferramenta', texto: 'Checkpoint restaurado: 4 arquivos revertidos.' },
            { quem: 'agente', texto: 'Pronto. Como o checkpoint é guardado no Git, seu histórico de commits também está garantido e posso apagar a branch de backup.' },
            { quem: 'voce', texto: 'Antes disso, rode git log --oneline -3.' }
          ],
          erradas: [3],
          explicacao: { 3: 'o checkpoint é armazenado localmente e separado do Git; reverte arquivos, não protege commits. Apagar a branch de backup com base nessa frase perderia a única cópia versionada.' },
          tutorDepois: 'Checkpoint é desfazer local. O que precisa sobreviver vai para o Git.' },
        { tipo: 'takeaway', html: 'Plan <mark>antes</mark> de Agent, Auto-review <mark>não é fronteira</mark>, e <mark>negar vence permitir</mark> no cli-config.json.' }
      ] },

      { rotulo: 'Atalhos e conferir', blocos: [
        { tipo: 'texto', html: '<h3>Atalhos que pagam o aprendizado</h3>' },
        tabela(['Ação', 'Editor', 'CLI'], [
          ['Abrir o agente', '<kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>I</kbd>', '<code>agent</code> ou <code>agent "prompt"</code>'],
          ['Alternar Agent, Plan e Ask', '<kbd>Shift</kbd>+<kbd>Tab</kbd>', '<kbd>Shift</kbd>+<kbd>Tab</kbd>, <code>/plan</code>, <code>/ask</code>'],
          ['Enfileirar ou enviar já', '<kbd>Enter</kbd> enfileira; <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd> envia na hora', '<kbd>Enter</kbd> orienta a execução ativa; de novo, interrompe'],
          ['Revisar mudanças', 'Diff na conversa', '<kbd>Ctrl</kbd>+<kbd>R</kbd>; <kbd>i</kbd> para pedir ajuste'],
          ['Retomar conversa', '<kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>K</kbd> busca conversas', '<code>agent resume</code>, <code>agent ls</code>, <code>--continue</code>, <code>/resume</code>'],
          ['Liberar contexto', '-', '<code>/summarize</code> (alias <code>/compress</code>)'],
          ['Mandar para a nuvem', 'Cloud no seletor', 'prefixo <code>&amp;</code> na mensagem'],
          ['Sair', '-', '<kbd>Ctrl</kbd>+<kbd>D</kbd> duas vezes']]),
        { tipo: 'texto', html: '<p>Para trabalhar em duas tarefas sem pisar em arquivos, use <code>-w</code> ou <code>--worktree [nome]</code>: o CLI edita numa nova <code>git worktree</code>.</p>' },
        { tipo: 'escolha', id: 'cur1-esc-auto', titulo: 'Confira: o que o run mode não garante',
          pergunta: 'O time deixa o run mode em Auto-review e conclui que o agente nunca fará um <code>rm -rf</code> fora do workspace. O que está errado?',
          opcoes: [
            { id: 'a', texto: 'Nada: Auto-review é a fronteira de segurança do Cursor.', correta: false, porque: 'a documentação diz o contrário: não é uma fronteira de segurança.' },
            { id: 'b', texto: 'O classificador pode errar; o que não pode acontecer precisa de negação explícita (<code>Shell(rm)</code> em <code>deny</code>) e de hook.', correta: true, porque: 'negar vence permitir, e o hook <code>beforeShellExecution</code> roda antes do comando. As proteções de exclusão de arquivos e de escrita fora do workspace ajudam, mas são camada adicional, não garantia.' },
            { id: 'c', texto: 'Só vale em Cloud Agents.', correta: false, porque: 'Cloud Agents nem pedem aprovação; Run Modes valem para agentes locais.' }
          ], tutorDepois: 'Classificador reduz atrito; negação e hook garantem.' },
        { tipo: 'escolha', id: 'cur1-esc-instr', titulo: 'Confira: onde escrever a regra',
          pergunta: 'O time usa Cursor e outras ferramentas e quer a regra "rode <code>make verify</code> antes de dizer pronto". Onde ela vive?',
          opcoes: [
            { id: 'a', texto: 'Só em <code>.cursor/rules/verify.md</code>.', correta: false, porque: 'além de ficar presa ao Cursor, a extensão <code>.md</code> é ignorada nessa pasta.' },
            { id: 'b', texto: 'No <code>AGENTS.md</code>, uma vez; o Cursor o lê na raiz e em subpastas.', correta: true, porque: 'AGENTS.md é a fonte única; regras <code>.mdc</code> ficam para o que é específico do Cursor.' },
            { id: 'c', texto: 'Em User Rules de cada pessoa.', correta: false, porque: 'User Rules são pessoais e não versionadas com o projeto.' }
          ], tutorDepois: 'Uma fonte no repositório; regras do Cursor só para o que é do Cursor.' },
        { tipo: 'texto', html: '<h3>Equivalente nas outras ferramentas</h3><p class="ta-nota">Colunas de Claude Code e Codex conforme a aula "Onde fica cada coisa" (verificada em 12/10/2026); confira na sua versão. Copilot: aula fer-copilot-1.</p>' },
        tabela(['Recurso', 'Cursor', 'Copilot', 'Claude Code', 'Codex'], [
          ['Instruções', '<code>AGENTS.md</code>, <code>.cursor/rules/*.mdc</code>', '<code>.github/copilot-instructions.md</code>, <code>AGENTS.md</code>', '<code>CLAUDE.md</code> (pode importar <code>@AGENTS.md</code>)', '<code>AGENTS.md</code>'],
          ['Plano sem editar', 'Plan (<kbd>Shift</kbd>+<kbd>Tab</kbd>)', 'Plan (agentes no IDE), <kbd>Shift</kbd>+<kbd>Tab</kbd> no CLI', 'Plan mode', '<code>/plan</code>'],
          ['Negar comandos', '<code>cli-config.json</code> deny, hooks', '<code>--deny-tool</code>', 'permissões em settings', '<code>approval_policy</code> e sandbox'],
          ['Sem tela', '<code>agent -p</code>', '<code>copilot -p</code>', '<code>claude -p</code>', '<code>codex exec</code>']]),
        { tipo: 'takeaway', html: 'O endereço muda; o método fica: <mark>regra no repositório</mark>, plano antes de editar e <mark>negação explícita</mark> para o que não pode falhar.' }
      ] }
    ]
  });
})();
