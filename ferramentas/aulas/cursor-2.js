/* Ferramentas · Cursor 2. Fatos verificados em 09/11/2026 na documentação oficial (cursor.com/docs); tabela em ferramentas/fontes/cursor.md. Preços, planos e modelos mudam: não decore. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tabela(cab, linhas) {
    return { tipo: 'texto', largo: true, html: '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' };
  }

  TrilhaAula.registrar({
    id: 'fer-cursor-2',
    titulo: 'Cursor avançado',
    minutos: 45,
    resumo: 'Subagentes, skills e plugins para dividir o trabalho; hooks e MCP para controlar e estender o agente; agent -p e Cloud Agents para rodar sem você; e as armadilhas de custo e de permissão que só aparecem em equipe.',
    objetivo: 'Definir um subagente somente leitura, escrever um hook que nega comando perigoso (e achar o bug de casamento), configurar MCP com segredo por variável, escolher entre CLI headless e Cloud Agent e decidir plano e modelo sem decorar tabelas que expiram.',
    revisao: [
      { id: 'cur2-subdir', pergunta: 'Onde ficam os subagentes de projeto do Cursor e como se marca um como somente leitura?',
        opcoes: [
          opc('a', '<code>.cursor/agents/*.md</code>, com <code>readonly: true</code> no frontmatter', true, 'a pasta aceita também <code>.claude/agents</code> e <code>.codex/agents</code> por compatibilidade.'),
          opc('b', '<code>.cursor/subagents/*.json</code>, com <code>"mode": "read"</code>', false, 'esse caminho e esse campo não existem na documentação.'),
          opc('c', '<code>AGENTS.md</code>, numa seção "Subagentes"', false, 'o <code>AGENTS.md</code> é instrução, não define agentes.')] },
      { id: 'cur2-skillnome', pergunta: 'Qual restrição o campo <code>name</code> de um <code>SKILL.md</code> tem no Cursor?',
        opcoes: [
          opc('a', 'Só minúsculas, números e hífens, e deve ser igual ao nome da pasta que contém o <code>SKILL.md</code>', true, 'pasta <code>deploy-app/</code>, <code>name: deploy-app</code>.'),
          opc('b', 'Qualquer texto; o nome da pasta é ignorado', false, 'a página exige a correspondência.'),
          opc('c', 'Deve começar com <code>cursor-</code>', false, 'não há prefixo obrigatório.')] },
      { id: 'cur2-exit2', pergunta: 'Um hook do Cursor termina com exit 1 e <code>failClosed</code> ausente. O que acontece com a ação?',
        opcoes: [
          opc('a', 'A ação prossegue: qualquer código diferente de 0 e 2 é falha do hook e, por padrão, fail-open', true, 'só o exit 2 (ou <code>permission: "deny"</code>) bloqueia; <code>failClosed: true</code> inverte o padrão.'),
          opc('b', 'A ação é bloqueada, como em qualquer erro', false, 'esse é o efeito de <code>failClosed: true</code>.'),
          opc('c', 'O Cursor fecha a sessão', false, 'não há esse comportamento.')] },
      { id: 'cur2-p', pergunta: 'Para um job de CI que só comenta achados de revisão, qual postura é a mais segura com <code>agent -p</code>?',
        opcoes: [
          opc('a', 'Sem <code>--force</code>, sandbox ligado, negações em <code>cli.json</code>, token mínimo e saída em <code>json</code>', true, 'e, como as páginas da documentação divergem sobre o acesso de escrita em <code>-p</code>, trate a escrita como possível e limite por negação e sandbox.'),
          opc('b', '<code>--force</code> para o agente poder corrigir o que achar', false, '<code>--force</code> edita arquivos sem confirmação.'),
          opc('c', '<code>--approve-mcps</code> para evitar travar o job', false, 'aprova todo servidor MCP sem olhar.')] },
      { id: 'cur2-preco', pergunta: 'Por que esta aula não pede para decorar planos e modelos do Cursor?',
        opcoes: [
          opc('a', 'Preço, pool de uso e lista de modelos mudam em semanas; a decisão fica no método e a consulta na página oficial', true, 'no registro de fontes eles têm prazo de revalidação de 30 dias.'),
          opc('b', 'Porque o Cursor não tem planos pagos', false, 'tem.'),
          opc('c', 'Porque o modelo não afeta o custo', false, 'afeta: modelos de terceiros consomem crédito pré-pago em planos atuais.')] }
    ],
    abas: [
      { rotulo: 'Subagentes, skills e plugins', blocos: [
        { tipo: 'texto', html:
          '<p>Quando uma tarefa suja o contexto (ler 40 arquivos para achar um símbolo) ou precisa de um papel isolado (um revisor que não edita), delegue. Tudo abaixo vale para o Cursor em <strong>09/11/2026</strong>.</p>' +
          '<h3>Subagentes</h3>' +
          '<p>Cada subagente é um arquivo markdown com frontmatter em <code>.cursor/agents/</code> (projeto) ou <code>~/.cursor/agents/</code> (usuário); o Cursor aceita também <code>.claude/agents/</code> e <code>.codex/agents/</code>. Em conflito de nomes, o de projeto vence. Campos: <code>name</code> (padrão: nome do arquivo), <code>description</code> (o que o agente principal usa para decidir quando delegar), <code>model</code> (padrão <code>inherit</code>), <code>readonly</code> (padrão <code>false</code>) e <code>is_background</code> (padrão <code>false</code>).</p>' +
          '<ul><li><strong>Foreground</strong> bloqueia até terminar e devolve o resultado; <strong>background</strong> volta na hora e trabalha em paralelo.</li>' +
          '<li>Built-ins: <strong>Explore</strong> (busca e análise, modelo mais rápido) e <strong>Browser</strong> (controla o navegador por MCP e filtra a saída).</li>' +
          '<li>Invoque com <code>/nome tarefa</code> ou citando o subagente em linguagem natural.</li>' +
          '<li>Um subagente pode lançar filhos, mas o filho <strong>não pode lançar outros</strong>: um nível de aninhamento.</li></ul>' },
        { tipo: 'complete', id: 'cur2-complete-sub', titulo: 'Monte um revisor somente leitura', linguagem: 'markdown',
          enunciado: 'O revisor de segurança deve ler tudo, nunca editar, e herdar o modelo da conversa.',
          partes: [
            '# ', { lacuna: 'dir', opcoes: ['.cursor/agents/', '.cursor/subagents/', '.cursor/skills/'], correta: '.cursor/agents/' }, 'revisor-seguranca.md\n---\nname: revisor-seguranca\ndescription: Especialista em segurança. Use ao mexer em auth, pagamentos ou dados sensíveis.\nmodel: ',
            { lacuna: 'model', opcoes: ['inherit', 'fast', 'auto'], correta: 'inherit' }, '\nreadonly: ', { lacuna: 'ro', opcoes: ['true', 'false'], correta: 'true' },
            '\nis_background: false\n---\nVocê audita código procurando falhas de autorização, injeção e vazamento de segredo. Liste achados com arquivo e linha; não edite.\n\n# invocação no chat: ', { lacuna: 'inv', opcoes: ['/revisor-seguranca revise src/auth', '@revisor-seguranca revise src/auth', 'run subagent revisor-seguranca'], correta: '/revisor-seguranca revise src/auth' }
          ],
          explicacao: 'O caminho é <code>.cursor/agents/</code>, <code>inherit</code> é o valor que usa o modelo da conversa e <code>readonly: true</code> restringe a escrita. A página documenta a sintaxe <code>/nome</code>; um <code>@</code> para subagentes não está documentado.',
          callout: 'Revisor montado: papel isolado, sem escrita e com invocação documentada.' },
        { tipo: 'texto', html:
          '<h3>Skills</h3>' +
          '<p>Uma skill é uma pasta com <code>SKILL.md</code> e, opcionalmente, <code>scripts/</code>, <code>references/</code> e <code>assets/</code>. Fica em <code>.cursor/skills/</code> ou <code>.agents/skills/</code> (projeto) e nas mesmas pastas sob <code>~</code> (usuário); o Cursor também carrega <code>.claude/skills/</code> e <code>.codex/skills/</code>. Frontmatter: <code>name</code> (minúsculas, números e hífens; igual ao nome da pasta) e <code>description</code> (obrigatórios), além de <code>paths</code> (globs que escopam a skill), <code>disable-model-invocation</code> (só entra se você chamar <code>/nome</code>), <code>icon</code>, <code>color</code> e <code>metadata</code>. No CLI, <kbd>Enter</kbd> sobre uma skill a anexa a uma mensagem e <kbd>Option</kbd>+<kbd>Enter</kbd> a mantém como Custom Mode até você sair.</p>' +
          '<h3>Plugins e comandos</h3>' +
          '<p>Um <strong>plugin</strong> empacota rules, skills, agents, commands, hooks e servidores MCP. O formato "Cursor Plugin" tem manifesto em <code>.cursor-plugin/plugin.json</code>; o "Agent Plugin" é um <code>plugin.json</code> na raiz com skills e MCP. Instala-se pelo Marketplace (Customize, Install, escopo de projeto ou usuário). Em Teams e Enterprise, o admin cria marketplaces do time e define o modo de cada plugin: Default Off, Default On ou Required.</p>' +
          '<p>Comandos de uma pasta <code>.cursor/commands/*.md</code> aparecem em páginas antigas como recurso beta; nas páginas atuais há uma skill de migração (<code>/migrate-to-skills</code>). Para conteúdo novo, prefira skills.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Skills ensinam, hooks garantem', html: '<p>Uma skill é consultiva: o agente decide usá-la. O que não pode falhar vai para hook, permissão ou check de CI. É a mesma regra do bloco Build do A01.</p>' },
        { tipo: 'takeaway', html: 'Subagente <mark>isola contexto e papel</mark>; skill <mark>carrega conhecimento sob demanda</mark>; plugin <mark>distribui</mark> os dois com hooks e MCP.' }
      ] },

      { rotulo: 'Hooks e MCP', blocos: [
        { tipo: 'texto', html:
          '<h3>Hooks</h3>' +
          '<p>Hook é um processo que o Cursor dispara em eventos do ciclo do agente; ele recebe um JSON no stdin e responde por stdout e código de saída. Arquivo: <code>.cursor/hooks.json</code> (projeto) ou <code>~/.cursor/hooks.json</code> (usuário), com <code>"version": 1</code> obrigatório; em Enterprise há também a pasta do sistema (MDM) e a configuração no painel, que têm prioridade.</p>' +
          '<ul><li><strong>Eventos de agente:</strong> <code>sessionStart</code>, <code>preToolUse</code>, <code>postToolUse</code>, <code>beforeShellExecution</code>, <code>afterShellExecution</code>, <code>beforeMCPExecution</code>, <code>beforeReadFile</code>, <code>afterFileEdit</code>, <code>beforeSubmitPrompt</code>, <code>subagentStart</code>, <code>subagentStop</code>, <code>stop</code> e outros.</li>' +
          '<li><strong>Resposta de permissão:</strong> <code>permission</code> com <code>allow</code>, <code>deny</code> ou <code>ask</code>, mais <code>user_message</code> (para você) e <code>agent_message</code> (para o modelo agir). Em <code>preToolUse</code>, <code>ask</code> não é aplicado.</li>' +
          '<li><strong>Códigos de saída:</strong> 0 usa o JSON; <strong>2 bloqueia</strong>; qualquer outro é falha do hook e a ação prossegue (<em>fail-open</em>), a menos que o hook tenha <code>failClosed: true</code>.</li>' +
          '<li><strong>Escopo:</strong> <code>matcher</code> (regex; para hooks de shell, testada contra o comando inteiro), <code>timeout</code> em segundos e <code>loop_limit</code> nos hooks <code>stop</code> e <code>subagentStop</code> (padrão 5).</li></ul>' },
        { tipo: 'codigo', linguagem: 'json', texto: [
          '{', '  "version": 1,', '  "hooks": {', '    "beforeShellExecution": [', '      {', '        "command": ".cursor/hooks/guard.sh",',
          '        "matcher": "git push",', '        "timeout": 10,', '        "failClosed": true', '      }', '    ]', '  }', '}'].join('\n') },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '#!/bin/bash', '# .cursor/hooks/guard.sh  (chmod +x)', 'input=$(cat)', 'if echo "$input" | grep -q \'push --force\'; then',
          '  echo \'{"permission":"deny","user_message":"Push forçado bloqueado.","agent_message":"Use --force-with-lease numa branch própria e peça aprovação."}\'',
          '  exit 0', 'fi', 'echo \'{"permission":"allow"}\''].join('\n') },
        { tipo: 'rode', id: 'cur2-rode', titulo: 'Teste o hook antes de confiar nele',
          enunciado: 'Alimente o script com três comandos, como o Cursor faria. As saídas vieram de uma execução local do script acima; o nome exato dos campos do JSON de entrada varia por evento, por isso o teste usa só o campo de comando.',
          prefixo: '$', entrada: 'echo \'{"command":"git push --force origin main"}\' | .cursor/hooks/guard.sh', unidade: 'ms', terminalTitulo: 'teste do hook',
          etapas: [
            { id: 'forca', nome: 'Push forçado', descricao: 'Deve ser negado', tom: 'request', ms: 12, linhas: [
              L('cmd', 'echo \'{"command":"git push --force origin main"}\' | .cursor/hooks/guard.sh'),
              L('out', '{"permission":"deny","user_message":"Push forçado bloqueado.","agent_message":"Use --force-with-lease numa branch própria e peça aprovação."}')] },
            { id: 'lease', nome: 'Push com lease', descricao: 'Alternativa segura que o hook mesmo recomenda', tom: 'response', ms: 12, linhas: [
              L('cmd', 'echo \'{"command":"git push --force-with-lease origin feature/x"}\' | .cursor/hooks/guard.sh'),
              L('out', '{"permission":"deny","user_message":"Push forçado bloqueado.","agent_message":"Use --force-with-lease numa branch própria e peça aprovação."}'),
              L('hint', 'Negado. O casamento por substring pegou "push --force" dentro de "push --force-with-lease".')] },
            { id: 'normal', nome: 'Push comum', descricao: 'Deve passar', tom: 'tls', ms: 12, linhas: [
              L('cmd', 'echo \'{"command":"git push origin feature/x"}\' | .cursor/hooks/guard.sh'),
              L('out', '{"permission":"allow"}')] }
          ],
          prever: { pergunta: 'O hook manda o agente usar <code>--force-with-lease</code>. O que o script faz quando o agente obedece e roda <code>git push --force-with-lease</code>?', opcoes: [
            { id: 'a', texto: 'Permite, porque o texto é diferente de <code>--force</code>.', correta: false, porque: 'o <code>grep</code> procura a substring <code>push --force</code>, que também está em <code>push --force-with-lease</code>.' },
            { id: 'b', texto: 'Nega de novo: a substring casa, e o agente fica num beco sem saída.', correta: true, porque: 'o bug é de casamento, não de intenção. Corrija com expressão que exija fim de palavra, por exemplo <code>grep -Eq \'push --force( |$)\'</code>, e teste os dois casos.' },
            { id: 'c', texto: 'Falha com exit 2 e fecha a sessão.', correta: false, porque: 'o script sempre sai com 0; quem nega é o JSON.' }
          ] },
          tutorDepois: 'Hook testado só no caminho feliz esconde bug de casamento. Teste um comando que deva passar parecido com o que deve ser negado. E com <code>failClosed: true</code>, um script quebrado bloquearia tudo; sem ele, deixaria passar tudo.',
          callout: 'Você viu o hook negar o certo, negar o errado e liberar o comum.' },
        { tipo: 'texto', html:
          '<h3>MCP</h3>' +
          '<p>Servidores MCP ficam em <code>.cursor/mcp.json</code> (projeto) ou <code>~/.cursor/mcp.json</code> (global), sob a chave <code>mcpServers</code>. Servidor local usa <code>command</code>, <code>args</code>, <code>env</code> e <code>envFile</code> (só para stdio); remoto usa <code>url</code> e <code>headers</code>. O Cursor interpola <code>${env:NOME}</code>, <code>${userHome}</code>, <code>${workspaceFolder}</code> e outras variáveis em <code>command</code>, <code>args</code>, <code>env</code>, <code>url</code> e <code>headers</code>; use isso para segredos. Remotos aceitam OAuth com PKCE (redirects documentados na página). Por padrão o Cursor pede aprovação antes de executar uma ferramenta MCP, no mesmo run mode dos comandos.</p>' +
          '<p>No CLI: <code>agent mcp list</code>, <code>agent mcp list-tools &lt;servidor&gt;</code>, <code>agent mcp login &lt;servidor&gt;</code>, <code>agent mcp enable|disable &lt;servidor&gt;</code>, e <code>/mcp list</code> dentro da sessão. <code>--approve-mcps</code> aprova todos de uma vez: não use em CI com configuração que você não controla.</p>' },
        { tipo: 'complete', id: 'cur2-complete-mcp', titulo: 'Configure um servidor remoto sem vazar o token', linguagem: 'json',
          enunciado: 'O token vem de uma variável de ambiente, nunca do arquivo versionado.',
          partes: [
            '// ', { lacuna: 'arq', opcoes: ['.cursor/mcp.json', '.cursor/mcp-servers.yml', 'AGENTS.md'], correta: '.cursor/mcp.json' }, '\n{\n  "', { lacuna: 'raiz', opcoes: ['mcpServers', 'servers', 'tools'], correta: 'mcpServers' },
            '": {\n    "tracker": {\n      "url": "https://api.exemplo.dev/mcp",\n      "headers": {\n        "Authorization": "Bearer ', { lacuna: 'seg', opcoes: ['${env:TRACKER_TOKEN}', 'TRACKER_TOKEN', 'ghp_exemplo123'], correta: '${env:TRACKER_TOKEN}' }, '"\n      }\n    }\n  }\n}'
          ],
          explicacao: 'A chave do Cursor é <code>mcpServers</code> (diferente do <code>servers</code> do VS Code). A interpolação <code>${env:NOME}</code> lê a variável na hora de conectar; um valor literal acabaria no Git.',
          callout: 'Servidor remoto configurado com segredo por variável.' },
        { tipo: 'takeaway', html: 'Hook <mark>só vale se testado</mark> nos dois sentidos; MCP <mark>segredo vai por ${env:}</mark>, nunca no arquivo.' }
      ] },

      { rotulo: 'Headless, nuvem e custo', blocos: [
        { tipo: 'texto', html:
          '<h3>Sem tela: agent -p</h3>' +
          '<p><code>agent -p "prompt"</code> (ou <code>--print</code>) roda uma vez e sai. <code>--output-format</code> aceita <code>text</code> (padrão), <code>json</code> e <code>stream-json</code> (com <code>--stream-partial-output</code> para deltas); a chave entra por <code>CURSOR_API_KEY</code>. Outros flags úteis: <code>--model</code>, <code>--workspace</code>, <code>--sandbox enabled|disabled</code>, <code>-w</code> para worktree e <code>--force</code> (ou <code>--yolo</code>), que permite comandos e edições sem confirmação.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# revisão somente para leitura em CI (exemplo)', 'export CURSOR_API_KEY="$SECRETO_DO_CI"',
          'agent -p --sandbox enabled --output-format json \\', '  "Revise as mudanças da branch contra main. Liste achados com arquivo e linha." | jq -r .result'].join('\n') },
        { tipo: 'callout', tom: 'danger', titulo: 'As páginas divergem: trate a escrita em -p como possível', html:
          '<p>A página de uso do CLI diz que, no modo não interativo, o Cursor tem acesso total de escrita; a página de headless diz que sem <code>--force</code> as mudanças são só propostas. Não consegui reconciliar as duas em 09/11/2026. Como o dever de casa do engenheiro é não depender do que é ambíguo, o job de revisão deve: rodar em checkout descartável, usar <code>--sandbox enabled</code>, negar em <code>deny</code>, no <code>.cursor/cli.json</code> do job, a escrita (<code>Write(...)</code>) nos caminhos que a revisão não deve tocar e usar um token de menor privilégio. Se a documentação mudar, revalide este bloco.</p>' },
        { tipo: 'texto', html:
          '<h3>Cloud Agents</h3>' +
          '<p>Um Cloud Agent roda numa VM isolada com o repositório clonado, dependências, segredos e rede, e devolve uma branch e um PR com artefatos (screenshots, vídeos, logs). Você o inicia por cursor.com/agents, pelo app móvel, pelo seletor <strong>Cloud</strong> no editor, por <code>@cursor</code> no Slack, GitHub, Bitbucket ou Linear, pela API e, no CLI, com o prefixo <code>&amp;</code> numa mensagem. O ambiente se configura por snapshot, por setup guiado ou por um Dockerfile referenciado em <code>.cursor/environment.json</code>; segredos entram no painel, não no repositório. Hooks de projeto (<code>.cursor/hooks.json</code>) rodam na nuvem; os do usuário (<code>~/.cursor/hooks.json</code>) não. Cloud Agents não pedem aprovação: as proteções precisam estar no ambiente e nos hooks. Exige plano Premium ou superior, Teams, Enterprise ou plano legado pago.</p>' +
          '<h3>Custo e modelo</h3>' +
          '<p>Em 09/11/2026 os planos individuais listados eram Free ($0), Plus ($8), Premium ($30), Super ($100) e Ultra ($200) por mês; Premium, Super e Ultra dão 4x, 15x e 50x o uso do Plus. Há um <strong>pool semanal</strong> para os modelos do próprio Cursor e <strong>crédito pré-pago</strong> para modelos de terceiros nos planos de Premium para cima; planos antigos (Hobby, Pro, Pro+) continuam para quem já os tem. O Auto tem modo Cost nos planos individuais, e Balance e Intelligence só em Teams e Enterprise com o roteador ligado. A página não informa o modelo padrão. <strong>Esses números expiram em 30 dias</strong>; consulte a página de preços antes de decidir.</p>' +
          '<p>O que não expira é o método: modelo forte para planejar e revisar, modelo rápido para busca e tarefas mecânicas (é por isso que o subagente Explore usa um modelo mais rápido), contexto curto com <code>/summarize</code> e tarefas pequenas.</p>' },
        { tipo: 'cenario', id: 'cur2-cenario', titulo: 'Quem revisa o PR às 3 da manhã?', obrigatorio: false,
          enunciado: 'Seu time quer uma revisão automática em todo PR. Escolha como montar.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O primeiro rascunho do job é <code>agent -p --force "Revise e corrija o PR"</code> com uma chave de API de administrador. O que você muda?', opcoes: [
              { texto: 'Troco para revisão somente leitura: sem <code>--force</code>, <code>--sandbox enabled</code>, saída <code>json</code>, negações em <code>cli.json</code> e uma chave de menor privilégio num checkout descartável.', vai: 'f-bom', tom: 'ok', consequencia: 'a revisão comenta, não escreve, e um prompt malicioso num diff não alcança segredos nem o repositório.' },
              { texto: 'Mantenho <code>--force</code>, porque corrigir sozinho economiza tempo.', vai: 'f-force', tom: 'ruim', consequencia: 'o job edita arquivos sem confirmação, com a chave do administrador, em cima de texto escrito por terceiros.' },
              { texto: 'Mando para um Cloud Agent, que não pede aprovação, e uso a chave de administrador para ele abrir PRs.', vai: 'f-nuvem', tom: 'ruim', consequencia: 'Cloud Agents não perguntam nada; sem hooks e ambiente restritos, você só trocou o lugar onde o risco roda.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Revisão em leitura, com menor privilégio e checks de CI como árbitro. Correção fica para um segundo job com aprovação humana.' },
            'f-force': { bom: false, texto: 'Um comentário malicioso no PR vira instrução e o job commita algo que ninguém pediu.' },
            'f-nuvem': { bom: false, texto: 'A VM isolada protege sua máquina, mas a chave de administrador continuou ampla demais.' }
          },
          callout: 'Você escolheu leitura, menor privilégio e árbitro determinístico.' },
        { tipo: 'takeaway', html: '<mark>Revise em leitura</mark>, corrija com aprovação, e <mark>não decore preços</mark>: consulte e anote a data.' }
      ] },

      { rotulo: 'Armadilhas e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Armadilhas conhecidas (verificadas na documentação)</h3>' +
          '<ul><li><strong>Regra <code>.md</code> em <code>.cursor/rules</code>:</strong> ignorada em silêncio.</li>' +
          '<li><strong>Hook fail-open:</strong> script que quebra deixa a ação passar; use <code>failClosed: true</code> nos que protegem.</li>' +
          '<li><strong><code>ask</code> em <code>preToolUse</code>:</strong> não é aplicado; use <code>deny</code> ou <code>allow</code>.</li>' +
          '<li><strong>Hooks do usuário não rodam na nuvem:</strong> o que precisa valer para Cloud Agents vai em <code>.cursor/hooks.json</code> do projeto.</li>' +
          '<li><strong>Allowlist e Auto-review não são fronteira:</strong> a documentação avisa; fronteira é sandbox, negação e CI.</li>' +
          '<li><strong>Fóruns:</strong> há relatos da comunidade de allowlist ignorada quando "Auto-Run in Sandbox" está ligado. É sinal, não fato: teste na sua versão.</li></ul>' },
        { tipo: 'transcript', id: 'cur2-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'sessão (exemplo)',
          enunciado: 'Leia a sessão. Uma fala do agente contradiz o que o hook mostrou. Clique nela e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Faça o deploy da correção. Lembre que push forçado é proibido aqui.' },
            { quem: 'agente', texto: 'Vou enviar com git push --force-with-lease.' },
            { quem: 'ferramenta', texto: 'hook beforeShellExecution: negado ("Push forçado bloqueado.")\nexit=0' },
            { quem: 'agente', texto: 'O push foi feito sem forçar, então está tudo publicado em origin.' },
            { quem: 'ferramenta', texto: '$ git status -sb\n## fix/relatorio...origin/fix/relatorio [ahead 1]' }
          ],
          erradas: [3],
          explicacao: { 3: 'o hook negou o comando, e o <code>git status</code> mostra <code>ahead 1</code>: o commit não foi publicado. Relato do agente não substitui a saída da ferramenta.' },
          tutorDepois: 'Leia o que a ferramenta devolveu, não o resumo do agente.' },
        { tipo: 'escolha', id: 'cur2-esc-hook', titulo: 'Confira: o hook que quebra',
          pergunta: 'Seu hook de proteção de <code>migrations/</code> usa um script que depende de <code>jq</code>, e o runner do Cloud Agent não o tem. O que acontece com <code>failClosed</code> ausente, e qual o conserto?',
          opcoes: [
            { id: 'a', texto: 'O script falha com código diferente de 0 e 2, a ação prossegue; marque <code>failClosed: true</code> e instale o <code>jq</code> no ambiente.', correta: true, porque: 'fail-open é o padrão. Com <code>failClosed: true</code>, crash, timeout, saída vazia ou código não zero bloqueiam, e o problema aparece em vez de se esconder.' },
            { id: 'b', texto: 'O Cursor bloqueia por padrão qualquer hook que falha.', correta: false, porque: 'o padrão é deixar passar.' },
            { id: 'c', texto: 'Nada muda, porque hooks não rodam na nuvem.', correta: false, porque: 'hooks de projeto de <code>.cursor/hooks.json</code> rodam na nuvem; só os do usuário não.' }
          ], tutorDepois: 'Guardrail que quebra em silêncio é pior do que nenhum.' },
        { tipo: 'escolha', id: 'cur2-esc-ci', titulo: 'Confira: rodar sem você',
          pergunta: 'Qual combinação mantém a revisão automática de PR segura em <code>agent -p</code>?',
          opcoes: [
            { id: 'a', texto: '<code>--force</code> e <code>--approve-mcps</code>, para o job nunca travar.', correta: false, porque: 'ambos removem a aprovação humana.' },
            { id: 'b', texto: 'Sandbox, negações em <code>cli.json</code>, <code>CURSOR_API_KEY</code> de menor privilégio e saída <code>json</code> lida por outro passo.', correta: true, porque: 'camadas independentes do modelo: a postura vem das negações, do sandbox e do privilégio do token, não de o modelo obedecer.' },
            { id: 'c', texto: 'Só um prompt dizendo "não escreva arquivos".', correta: false, porque: 'prompt é consultivo.' }
          ], tutorDepois: 'Rodar sem você exige que a barreira não dependa de o modelo obedecer.' },
        { tipo: 'texto', html: '<h3>Equivalente nas outras ferramentas</h3>' },
        tabela(['Recurso', 'Cursor', 'Copilot', 'Claude Code', 'Codex'], [
          ['Subagente', '<code>.cursor/agents/*.md</code>', 'Agentes customizados <code>.github/agents/*.agent.md</code>', '<code>.claude/agents/</code>', '<code>.codex/agents/*.toml</code>'],
          ['Skill', '<code>.cursor/skills/&lt;n&gt;/SKILL.md</code>', '<code>.github/skills/&lt;n&gt;/SKILL.md</code>', '<code>.claude/skills/&lt;n&gt;/SKILL.md</code>', '<code>.agents/skills</code>'],
          ['Hook', '<code>.cursor/hooks.json</code>, exit 2 nega', '<code>.github/hooks/*.json</code>', '<code>.claude/settings.json</code>', '<code>hooks.json</code> ou <code>[hooks]</code>'],
          ['MCP', '<code>.cursor/mcp.json</code> (<code>mcpServers</code>)', '<code>.vscode/mcp.json</code> (<code>servers</code>), <code>~/.copilot/mcp-config.json</code>', 'servidores MCP em settings', '<code>config.toml</code>'],
          ['Nuvem', 'Cloud Agents', 'Cloud agent', 'não coberto aqui', 'não coberto aqui']]),
        { tipo: 'takeaway', html: 'Guardrail bom <mark>falha fechado</mark>, é <mark>testado nos dois sentidos</mark> e vale onde o agente roda.' }
      ] }
    ]
  });
})();
