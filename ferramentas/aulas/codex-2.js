/* Ferramentas · Codex 2 · "Codex CLI avançado". Fatos de produto verificados em 09/11/2026 na documentação oficial (learn.chatgpt.com/docs) e no repositório openai/codex; tabela de fontes e prazos em ferramentas/fontes/codex.md. A saída do hook na aba 2 foi executada de verdade (script Python escrito para esta aula, com python3 -I); o restante das sessões é rotulado "exemplo". */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tab(cab, linhas) {
    return '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  var VERIF = '<p class="ta-nota">Verificado em 09/11/2026 na documentação oficial do Codex. Vários recursos aqui têm rótulo de maturidade (regras são "experimentais"; autenticação por código de dispositivo é "beta"): a página de maturidade da documentação diz como ler cada um. Confira com <code>/hooks</code>, <code>/mcp</code> e <code>codex --help</code> na sua versão.</p>';

  TrilhaAula.registrar({
    id: 'fer-codex-2',
    titulo: 'Codex CLI avançado',
    minutos: 40,
    resumo: 'Subagentes em TOML, hooks com confiança por hash, regras de comando, MCP em config.toml, skills, plugins, codex exec em CI, escolha de modelo, custo e as armadilhas da documentação.',
    objetivo: 'Definir um agente personalizado sabendo o que ele não consegue mudar, escrever um hook que bloqueia de verdade, configurar MCP e regras de comando, rodar o codex exec em CI com o mínimo de permissão e escolher modelo e esforço com custo em mente.',
    revisao: [
      { id: 'cx2-agent-sandbox', pergunta: 'Você pôs <code>sandbox_mode = "read-only"</code> em <code>.codex/agents/revisor.toml</code>. O que acontece?',
        opcoes: [
          opc('a', 'Nada: <code>sandbox_mode</code>, <code>approval_policy</code>, <code>model_provider</code> e <code>mcp_servers</code> num arquivo de agente não sobrescrevem a sessão pai', true, 'subagentes herdam o sandbox e a aprovação do turno pai; instrução no agente pode pedir "não edite", mas não cria um sandbox separado.'),
          opc('b', 'O agente roda em read-only e o pai continua em Auto', false, 'é o que muita gente assume; a documentação diz o contrário.'),
          opc('c', 'O Codex recusa iniciar', false, 'não há erro; o campo simplesmente não vale.')] },
      { id: 'cx2-hook-trust', pergunta: 'Você adicionou um hook novo a <code>.codex/hooks.json</code>. Na próxima sessão, o que o Codex faz?',
        opcoes: [
          opc('a', 'Marca o hook para revisão e o ignora até você confiar nele em <code>/hooks</code>; a confiança é gravada contra o hash da definição', true, 'um hook alterado volta a precisar de revisão; hooks gerenciados por política são confiáveis por padrão.'),
          opc('b', 'Executa na hora, como o Claude Code', false, 'o Codex exige revisão de hooks não gerenciados.'),
          opc('c', 'Bloqueia a sessão até o hook ser aprovado por um admin', false, 'a confiança é sua, por definição de hook.')] },
      { id: 'cx2-continue', pergunta: 'Um hook <code>PreToolUse</code> devolve <code>{"continue": false}</code> para impedir um comando. O que o Codex faz com a chamada?',
        opcoes: [
          opc('a', 'Marca o hook como falho, reporta o erro e <strong>continua</strong> a chamada: <code>continue</code> não é suportado em <code>PreToolUse</code>', true, 'para negar, use <code>permissionDecision: "deny"</code> (ou o formato antigo <code>decision: "block"</code>), ou exit 2 com a razão no stderr.'),
          opc('b', 'Bloqueia a chamada e encerra o turno', false, 'esse campo não vale para PreToolUse.'),
          opc('c', 'Pergunta ao usuário', false, 'não há esse caminho.')] },
      { id: 'cx2-exec', pergunta: 'Qual o sandbox padrão do <code>codex exec</code> e o que ficou do antigo <code>--full-auto</code>?',
        opcoes: [
          opc('a', 'Padrão read-only; <code>--full-auto</code> não é mais suportado: use <code>--sandbox workspace-write</code>', true, 'em automação conceda o mínimo necessário e só aumente se o trabalho exigir.'),
          opc('b', 'Padrão workspace-write; <code>--full-auto</code> continua válido', false, 'o padrão é leitura e a flag foi removida.'),
          opc('c', 'Padrão danger-full-access', false, 'nunca.')] },
      { id: 'cx2-prompts', pergunta: 'Onde ficam os comandos reutilizáveis hoje no Codex?',
        opcoes: [
          opc('a', 'Em skills (<code>.agents/skills/&lt;nome&gt;/SKILL.md</code>), invocadas com <code>$nome</code>; os prompts customizados em <code>~/.codex/prompts</code> estão obsoletos', true, 'skills podem ser versionadas no repositório e invocadas implicitamente; prompts customizados ficam só na sua máquina.'),
          opc('b', 'Em <code>~/.codex/prompts</code>, o formato recomendado', false, 'a documentação os marca como obsoletos.'),
          opc('c', 'Em <code>.codex/commands</code>', false, 'essa pasta não existe na documentação.')] }
    ],
    abas: [

      /* ---------------- Aba 1 ---------------- */
      { rotulo: 'Subagentes', blocos: [
        { tipo: 'texto', html:
          '<p>Pré-requisito: o conceito de subagente está na Trilha rápida, aula 07. Aqui, como o Codex o aciona, o define e o limita.</p>' + VERIF +
          '<h3>Acionar e acompanhar</h3>' +
          '<p>Nas versões atuais do Codex o fluxo de subagentes vem ligado. Ele delega quando você pede diretamente ou quando um <code>AGENTS.md</code> ou skill aplicável pede. Um bom prompt diz como dividir o trabalho, se deve esperar todos e o que devolver:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'Revise esta branch com subagentes em paralelo. Abra um para riscos de segurança,',
          'um para lacunas de teste e um para manutenibilidade. Espere os três e resuma',
          'os achados por categoria, com referência de arquivo.'
        ].join('\n') },
        { tipo: 'texto', html:
          '<p>Na CLI, <code>/subagents</code> troca entre as threads de agentes ativas para inspecionar; você também pode pedir ao Codex que oriente, pare ou feche um subagente. Pedidos de aprovação podem vir de uma thread inativa: o aviso mostra a origem e a tecla <kbd>o</kbd> abre a thread antes de você decidir. Em execução não interativa, uma ação que exigisse aprovação nova <strong>falha</strong> e o erro volta ao fluxo pai.</p>' +
          '<p>Cada subagente faz seu próprio trabalho de modelo e de ferramentas, então esses fluxos <strong>consomem mais tokens</strong> que uma execução de agente único. A orientação da documentação: comece por tarefas de leitura intensiva em paralelo (exploração, testes, triagem, resumo) e tenha cuidado com escrita paralela, que gera conflito e custo de coordenação.</p>' +
          '<h3>Agentes personalizados em TOML</h3>' +
          '<p>Há três built-ins: <code>default</code>, <code>worker</code> (execução e correções) e <code>explorer</code> (exploração de leitura). Os seus são arquivos TOML em <code>~/.codex/agents/</code> (pessoais) ou <code>.codex/agents/</code> (do projeto). Obrigatórios: <code>name</code>, <code>description</code> e <code>developer_instructions</code>; opcionais: <code>model</code>, <code>model_reasoning_effort</code>, <code>model_reasoning_summary</code> e <code>model_verbosity</code>. O <code>name</code> é a identidade (o nome do arquivo é só convenção), e um agente seu com o nome de um built-in vence. Sem <code>model</code> ou esforço configurados, o subagente herda os do pai.</p>' +
          tab(['Chave em <code>[agents]</code> (config.toml)', 'Efeito'], [
            ['<code>agents.enabled</code>', 'Liga ou desliga as ferramentas multiagente (padrão <code>true</code>)'],
            ['<code>agents.max_concurrent_threads_per_session</code>', 'Teto de threads de agentes abertas ao mesmo tempo (<code>agents.max_threads</code> é alias antigo)'],
            ['<code>agents.default_subagent_model</code>, <code>agents.default_subagent_reasoning_effort</code>', 'Modelo e esforço padrão dos agentes lançados'],
            ['<code>agents.interrupt_message</code>', 'Registra mensagem visível ao modelo quando um turno é interrompido (padrão <code>true</code>)']
          ]) },
        { tipo: 'callout', tom: 'danger', titulo: 'O arquivo do agente não muda o sandbox', html:
          '<p>A documentação é direta: <code>sandbox_mode</code>, <code>approval_policy</code>, <code>model_provider</code> e <code>mcp_servers</code> colocados no arquivo de um agente <strong>não sobrescrevem</strong> a sessão pai; o nível de serviço segue a preferência da sessão raiz; e subagentes herdam sandbox e aprovação do turno pai, inclusive mudanças feitas com <code>/permissions</code> ou <code>--yolo</code>. Instruções como "não edite arquivos" orientam o agente, mas <em>não criam um sandbox somente leitura separado</em>. Se você precisa de revisores que não possam editar, rode a sessão pai em <code>read-only</code>. Servidores MCP do agente se configuram na sessão pai. (Isso corrige uma suposição fácil: a tabela da aula A01 · Build dizia que o agente podia ter o próprio <code>sandbox_mode</code>.)</p>' },
        { tipo: 'complete', id: 'cx2-complete-agent', titulo: 'Monte um agente revisor', obrigatorio: false, linguagem: 'toml',
          enunciado: 'Complete o <code>.codex/agents/revisor.toml</code>: ele precisa ser descoberto pelo Codex, ter as instruções no campo exigido e usar esforço alto, como a documentação recomenda para revisão e segurança.',
          partes: [
            'name = "revisor"\ndescription = "', { lacuna: 'desc', opcoes: ['Revisa o diff em busca de falhas de segurança, regressões e testes ausentes. Use antes de abrir o PR.', 'Agente bom para tudo.', 'revisor'], correta: 'Revisa o diff em busca de falhas de segurança, regressões e testes ausentes. Use antes de abrir o PR.' },
            '"\nmodel_reasoning_effort = "', { lacuna: 'esforco', opcoes: ['high', 'low', 'extreme'], correta: 'high' },
            '"\n', { lacuna: 'campo', opcoes: ['developer_instructions', 'instructions', 'prompt'], correta: 'developer_instructions' },
            ' = """\nRevise como dono do código. Priorize correção, segurança, regressões e testes ausentes.\nNão edite arquivos. Comece pelos achados concretos, com passos para reproduzir.\n"""\n'
          ],
          explicacao: 'O campo exigido é <code>developer_instructions</code>; sem ele, o arquivo não define um agente válido. A documentação recomenda <code>high</code> para agentes que traçam lógica complexa, como revisores e agentes de segurança, e <code>low</code> para tarefas simples em que a velocidade pesa. "Não edite arquivos" no texto é orientação: o impedimento técnico vem do sandbox da sessão pai.',
          callout: 'Agente montado: gatilho claro, esforço adequado, campo exigido no lugar.' },
        { tipo: 'texto', html:
          '<h3>Isolar com worktrees</h3>' +
          '<p>Para sessões paralelas que escrevem, isole as edições. Na TUI, <code>/worktree</code> inicia ou continua um chat num worktree Git gerenciado; em automação, <code>codex exec --worktree "prompt"</code> (e <code>codex exec fork &lt;SESSION_ID&gt; --worktree "outra abordagem"</code>) faz o mesmo, exigindo execução local e sem combinar com <code>resume</code>, <code>review</code> ou <code>--ephemeral</code>. Lembre-se de que o Git só permite um branch em um lugar por vez. Teto prático: a sua capacidade de revisão (Trilha rápida, aula 07).</p>' },
        { tipo: 'takeaway', html: 'Subagente do Codex é um <mark>TOML com três campos obrigatórios</mark>, e <mark>sandbox e aprovação vêm sempre do pai</mark>: para revisor que não edita, a sessão pai é <mark>read-only</mark>.' }
      ] },

      /* ---------------- Aba 2 ---------------- */
      { rotulo: 'Hooks, regras e MCP', blocos: [
        { tipo: 'texto', html:
          '<h3>Hooks: onde ficam, quando rodam, quem confia</h3>' +
          '<p>O Codex descobre hooks ao lado das camadas de configuração ativas, em <code>hooks.json</code> ou em tabelas <code>[hooks]</code> dentro do <code>config.toml</code>. Os quatro lugares úteis: <code>~/.codex/hooks.json</code>, <code>~/.codex/config.toml</code>, <code>&lt;repo&gt;/.codex/hooks.json</code> e <code>&lt;repo&gt;/.codex/config.toml</code>. Todos os que casam rodam (os de uma camada de maior precedência não substituem os de baixo), e hooks de comando para o mesmo evento partem <strong>concorrentemente</strong>. Hooks do projeto só carregam se a camada <code>.codex/</code> for confiável; plugins também podem trazer hooks.</p>' +
          '<p>Antes de um hook não gerenciado rodar, o Codex exige que você <strong>revise e confie</strong> na definição exata: a confiança é gravada contra o hash dela, então hook novo ou alterado fica marcado e é <em>pulado</em> até você confiar. <code>/hooks</code> mostra as fontes, deixa confiar, e desativa hooks não gerenciados. Hooks de política (sistema, MDM, nuvem, <code>requirements.toml</code>) são confiáveis por padrão e o usuário não os desliga. Para automação que já vetou as fontes, <code>--dangerously-bypass-hook-trust</code> dispensa a confiança persistida naquela execução.</p>' +
          tab(['Quando', 'Eventos'], [
            ['Durante um turno', '<code>PreToolUse</code>, <code>PermissionRequest</code>, <code>PostToolUse</code>, <code>PreCompact</code>, <code>PostCompact</code>, <code>UserPromptSubmit</code>, <code>SubagentStop</code>, <code>Stop</code>'],
            ['A cada tentativa de requisição ao modelo', '<code>PreModelRequest</code>, <code>PostModelRequest</code>'],
            ['Início de sessão ou subagente', '<code>SessionStart</code>, <code>SubagentStart</code>'],
            ['Fim da sessão, interrupção', '<code>SessionEnd</code> (não roda em subagentes), <code>Interrupt</code> (idem)']
          ]) +
          '<p>O <code>matcher</code> casa o nome canônico da ferramenta: <code>Bash</code> para shell, <code>apply_patch</code> (também com os apelidos <code>Edit</code> e <code>Write</code>) para edição de arquivos e <code>mcp__servidor__ferramenta</code> para MCP. Para negar, devolva o JSON abaixo no <code>stdout</code> (ou use exit 2 com a razão no <code>stderr</code>). Se vários hooks decidem, qualquer <code>deny</code> vence. Texto simples no <code>stdout</code> é ignorado. Ferramentas hospedadas, como a busca na web, não passam pelo caminho de hooks locais.</p>' },
        { tipo: 'codigo', linguagem: 'json', texto: [
          '{',
          '  "hooks": {',
          '    "PreToolUse": [',
          '      {',
          '        "matcher": "Bash",',
          '        "hooks": [',
          '          { "type": "command",',
          '            "command": "python3 \\"$(git rev-parse --show-toplevel)/.codex/hooks/pre_tool_use_policy.py\\"",',
          '            "statusMessage": "Checando o comando" }',
          '        ]',
          '      }',
          '    ]',
          '  }',
          '}'
        ].join('\n') },
        { tipo: 'rode', id: 'cx2-rode-hook', titulo: 'O hook que nega, e dois jeitos de errar',
          enunciado: 'As duas primeiras saídas vêm de execução real do script <code>pre_tool_use_policy.py</code> em 09/11/2026. Salve o script em <code>.codex/hooks/</code>. As etapas 3 e 4 descrevem comportamento documentado.',
          prefixo: '$', entrada: 'echo \'{"tool_name":"Bash","tool_input":{"command":"rm -rf build"}}\' | python3 .codex/hooks/pre_tool_use_policy.py', unidade: 's', terminalTitulo: 'hook',
          prever: { pergunta: 'Seu hook <code>PreToolUse</code> imprime <code>{"continue": false, "stopReason": "bloqueado"}</code> ao ver <code>rm -rf</code>. O que o Codex faz com o comando?', opcoes: [
            opc('a', 'Bloqueia o comando e interrompe o turno', false, 'esses campos não são suportados em PreToolUse.'),
            opc('b', 'Marca o hook como falho, reporta o erro e <strong>executa</strong> o comando', true, 'é o contrato documentado: para bloquear use <code>permissionDecision: "deny"</code> no <code>hookSpecificOutput</code>, o formato antigo <code>decision: "block"</code>, ou exit 2 com a razão no stderr.'),
            opc('c', 'Pede sua aprovação antes de rodar', false, 'isso seria uma decisão <code>ask</code>, não suportada nesse formato.')
          ] },
          etapas: [
            { id: 'nega', nome: 'Hook nega', descricao: 'JSON de negação no stdout', tom: 'request', ms: 1, linhas: [
              L('cmd', 'echo \'{"tool_name":"Bash","tool_input":{"command":"rm -rf build"}}\' | python3 .codex/hooks/pre_tool_use_policy.py'),
              L('out', '{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "rm -rf bloqueado pela política do repositório"}}'),
              L('hint', 'exit=0: o bloqueio vem do JSON, não do código de saída') ] },
            { id: 'livre', nome: 'Comando permitido', descricao: 'Sem saída: segue o fluxo normal', tom: 'response', ms: 1, linhas: [
              L('cmd', 'echo \'{"tool_name":"Bash","tool_input":{"command":"uv run pytest -q"}}\' | python3 .codex/hooks/pre_tool_use_policy.py'),
              L('hint', 'sem saída e exit=0: o Codex trata como sucesso e continua') ] },
            { id: 'continue', nome: 'Erro: campos não suportados', descricao: 'continue/stopReason não valem em PreToolUse', tom: 'tls', ms: 1, linhas: [
              L('info', 'o script passa a imprimir {"continue": false, "stopReason": "bloqueado"}'),
              L('out', 'hook marcado como falho; erro reportado; a chamada de ferramenta continua'),
              L('hint', 'documentado: PreToolUse e PermissionRequest só suportam systemMessage entre os campos comuns') ] },
            { id: 'novo', nome: 'Erro: hook sem confiança', descricao: 'Hook novo ou alterado é pulado', tom: 'tcp', ms: 1, linhas: [
              L('info', 'você edita o script ou o hooks.json; o hash muda'),
              L('out', 'aviso na partida: hooks precisam de revisão; abra /hooks'),
              L('hint', 'até confiar em /hooks, o hook alterado não roda e a política deixa de valer sem você notar') ] }
          ],
          tutorDepois: 'Negar é <code>permissionDecision: "deny"</code> (ou exit 2). Dois jeitos de ficar sem proteção: campos de JSON que o evento não suporta e hook alterado que voltou a precisar de confiança. Teste a política com um comando que deve ser barrado, em sessão nova, depois de cada edição.',
          callout: 'Você viu o hook negar, liberar e dois jeitos silenciosos de falhar.' },
        { tipo: 'callout', tom: 'info', titulo: 'A documentação do Codex diz isto sobre hooks', html:
          '<p>"Treat tool hooks as a useful guardrail, not a complete enforcement boundary": alguns caminhos de ferramenta especializados podem sair do caminho padrão de hooks. Combine com sandbox, regras de comando e um check de CI sobre o <code>git diff</code>.</p>' },
        { tipo: 'texto', html:
          '<h3>Regras de comando (.rules)</h3>' +
          '<p>As <strong>regras</strong> controlam quais comandos o Codex pode rodar <em>fora do sandbox</em>. Elas são marcadas como experimentais. Crie um arquivo <code>.rules</code> em <code>rules/</code> ao lado de uma camada de configuração (por exemplo <code>~/.codex/rules/default.rules</code>; as de projeto em <code>.codex/rules/</code> só carregam se o projeto for confiável) e reinicie o Codex. A sintaxe é Starlark com <code>prefix_rule</code>:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '# ~/.codex/rules/default.rules  (Starlark)',
          'prefix_rule(',
          '    pattern = ["gh", "pr", "view"],',
          '    decision = "prompt",   # allow | prompt | forbidden',
          '    justification = "Ver PR sai do sandbox: confirme",',
          '    match = ["gh pr view 7888", "gh pr view --repo openai/codex"],',
          '    not_match = ["gh pr --repo openai/codex view 7888"],',
          ')'
        ].join('\n') },
        { tipo: 'texto', html:
          '<p>Quando várias regras casam, vale a mais restritiva (<code>forbidden</code> sobre <code>prompt</code> sobre <code>allow</code>). Os exemplos <code>match</code> e <code>not_match</code> são testes embutidos validados ao carregar. Scripts <code>bash -lc "a && b"</code> compostos só de palavras simples e operadores seguros são divididos e cada comando é avaliado; com redirecionamento, substituição, variáveis, curingas ou fluxo de controle o Codex avalia o script inteiro como um único comando. <code>codex execpolicy check --pretty</code> testa suas regras.</p>' +
          '<h3>MCP em config.toml</h3>' +
          '<p>Pré-requisito: a Trilha rápida, aula 09. A configuração fica no mesmo <code>config.toml</code> da CLI, do app e da extensão de IDE, em <code>~/.codex/config.toml</code> ou, por projeto, em <code>.codex/config.toml</code> (projetos confiáveis). Servidores aceitos: <strong>STDIO</strong> (processo local) e <strong>Streamable HTTP</strong> (com token Bearer ou OAuth).</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# adicionar um servidor STDIO (exemplo da documentação)',
          'codex mcp add context7 -- npx -y @upstash/context7-mcp',
          '',
          'codex mcp list                      # servidores configurados',
          'codex mcp login <nome>              # OAuth; --no-browser em máquina sem navegador',
          '# dentro da sessão: /mcp  (ferramentas disponíveis; "verbose" mostra detalhes)'
        ].join('\n') },
        { tipo: 'texto', html:
          '<p>Em <code>config.toml</code>, cada servidor é uma tabela <code>[mcp_servers.nome]</code>. STDIO: <code>command</code>, <code>args</code>, <code>env</code>, <code>env_vars</code>, <code>cwd</code>. HTTP: <code>url</code>, <code>bearer_token_env_var</code>, <code>http_headers</code>, <code>env_http_headers</code>. Comuns: <code>startup_timeout_sec</code> (padrão 10), <code>tool_timeout_sec</code> (padrão 60), <code>enabled</code>, <code>required</code> (a partida falha se o servidor não estiver pronto), <code>enabled_tools</code>/<code>disabled_tools</code>, <code>default_tools_approval_mode</code> (<code>auto</code>, <code>prompt</code>, <code>writes</code>, <code>approve</code>) e <code>tools.&lt;ferramenta&gt;.approval_mode</code>. Ferramentas destrutivas anunciadas pelo servidor sempre pedem aprovação. Num <code>codex exec</code>, um servidor <code>required = true</code> que falha ao iniciar derruba a execução com erro. Se você cadastra um cliente OAuth com segredo, o Codex grava o segredo em texto no <code>config.toml</code>: mantenha o arquivo privado e fora do Git.</p>' },
        { tipo: 'complete', id: 'cx2-complete-mcp', titulo: 'Complete o servidor MCP de documentação', obrigatorio: false, linguagem: 'toml',
          enunciado: 'Servidor HTTP no <code>.codex/config.toml</code>: token só por variável de ambiente, falha na partida se não conectar e confirmação para ferramentas que não sejam somente leitura.',
          partes: [
            '[mcp_servers.docs]\nurl = "https://example.com/mcp"\n', { lacuna: 'token', opcoes: ['bearer_token_env_var', 'bearer_token', 'token'], correta: 'bearer_token_env_var' },
            ' = "DOCS_TOKEN"\n', { lacuna: 'req', opcoes: ['required', 'mandatory', 'fail_on_missing'], correta: 'required' },
            ' = true\ndefault_tools_approval_mode = "', { lacuna: 'modo', opcoes: ['writes', 'auto', 'approve'], correta: 'writes' }, '"\n'
          ],
          explicacao: '<code>bearer_token_env_var</code> guarda o <em>nome</em> da variável: o segredo nunca entra no arquivo versionado. <code>required = true</code> faz a partida falhar se o servidor não estiver pronto (e derruba o <code>codex exec</code>). No modo <code>writes</code> o Codex pede aprovação para ferramentas que não estão marcadas como somente leitura.',
          callout: 'config.toml do MCP montado: token por ambiente, servidor obrigatório, aprovação para escrita.' },
        { tipo: 'takeaway', html: 'Hook novo exige <mark>confiança por hash</mark>, nega com <mark>permissionDecision deny</mark> e, mesmo assim, é <mark>guardrail, não fronteira</mark>; MCP e regras fecham o resto.' }
      ] },

      /* ---------------- Aba 3 ---------------- */
      { rotulo: 'Skills, plugins e CI', blocos: [
        { tipo: 'texto', html:
          '<h3>Skills no Codex</h3>' +
          '<p>Pré-requisitos: Trilha rápida, aulas 10 e 11. Uma skill é uma pasta com <code>SKILL.md</code> (obrigatórios <code>name</code> e <code>description</code>), com <code>scripts/</code>, <code>references/</code>, <code>assets/</code> e, opcionalmente, <code>agents/openai.yaml</code>. Há descoberta progressiva: o Codex começa com nome, descrição e caminho de cada skill e só lê o <code>SKILL.md</code> inteiro ao escolher uma. Essa lista inicial usa no máximo 2% da janela de contexto (ou 8.000 caracteres se ela for desconhecida), encurta as descrições primeiro e pode omitir skills com um aviso; <code>skills.max_context_tokens</code> sobe o teto até 10.000 tokens.</p>' +
          tab(['Escopo', 'Local', 'Uso'], [
            ['REPO', '<code>$CWD/.agents/skills</code>, e as pastas acima até a raiz do repositório', 'Skills do time, versionadas'],
            ['USER', '<code>$HOME/.agents/skills</code>', 'Suas, em qualquer repositório'],
            ['ADMIN', '<code>/etc/codex/skills</code>', 'Padrões da máquina ou contêiner'],
            ['SYSTEM', 'Embutidas (incluem <code>skill-creator</code> e <code>skill-installer</code>)', 'Ativas por padrão']
          ]) +
          '<p>Invocação explícita: <code>/skills</code> ou o prefixo <code>$</code> (<code>$skill-creator</code> cria uma por conversa). Implícita: quando a tarefa casa com a <code>description</code>. Skills com o mesmo <code>name</code> não se fundem: as duas aparecem. O Codex detecta mudanças sozinho; se não aparecer, reinicie. Um detalhe de sandbox: <code>.agents</code> é pasta protegida (somente leitura) dentro da raiz gravável, então criar skills no repositório é trabalho seu ou de uma aprovação, não do agente em modo Auto.</p>' +
          '<p><strong>Comandos próprios.</strong> Os prompts customizados (<code>~/.codex/prompts/*.md</code>, invocados como <code>/prompts:nome</code>) estão <strong>obsoletos</strong>: a documentação manda usar skills, que podem ser versionadas e invocadas implicitamente.</p>' +
          '<h3>Plugins</h3>' +
          '<p>Um plugin empacota skills e servidores MCP e é descoberto por um diretório universal compartilhado com o ChatGPT. Na CLI: <code>/plugins</code> abre o navegador de plugins; <code>codex plugin add</code>, <code>list</code> e <code>remove</code> (com <code>--json</code> para automação) instalam a partir de marketplaces, e <code>codex plugin marketplace add dono/repo</code> registra uma fonte (aceita <code>dono/repo@ref</code>, URLs Git e pastas locais). A extensão de IDE não suporta plugins. Vindo do Claude Code ou do Cursor, <code>/import</code> migra configuração, projetos e chats suportados.</p>' },
        { tipo: 'texto', html:
          '<h3>codex exec: sem tela e em CI</h3>' +
          '<p><code>codex exec</code> (forma curta <code>codex e</code>) roda uma tarefa e sai. O progresso vai para o <code>stderr</code> e só a mensagem final do agente vai para o <code>stdout</code>, o que facilita <code>|</code> e <code>&gt;</code>. O sandbox padrão é <strong>somente leitura</strong>; conceda o mínimo: <code>--sandbox workspace-write</code> para editar, <code>danger-full-access</code> só em runner isolado. A flag <code>--full-auto</code> <strong>não é mais suportada</strong>.</p>' +
          tab(['Flag', 'Efeito'], [
            ['<code>--json</code>', 'JSONL no stdout, um evento por mudança de estado (<code>thread.started</code>, <code>turn.completed</code>, <code>item.*</code>, <code>error</code>)'],
            ['<code>-o ARQ</code> / <code>--output-last-message ARQ</code>', 'Grava a mensagem final no arquivo e ainda imprime'],
            ['<code>--output-schema schema.json</code>', 'Resposta final conforme um JSON Schema'],
            ['<code>--ephemeral</code>', 'Não persiste os arquivos de sessão'],
            ['<code>--skip-git-repo-check</code>', 'Permite rodar fora de repositório Git (por padrão exige Git)'],
            ['<code>--ignore-user-config</code>, <code>--ignore-rules</code>', 'Ignora o <code>config.toml</code> do usuário; ignora arquivos <code>.rules</code>'],
            ['<code>--profile ci</code>', 'Aplica <code>~/.codex/ci.config.toml</code> por cima da configuração base'],
            ['<code>codex exec resume --last</code>', 'Continua a execução anterior (pipeline em duas etapas)']
          ]) },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# revisão somente leitura, com chave só nesta invocação',
          'CODEX_API_KEY="$CHAVE" codex exec --sandbox read-only --json \\',
          '  -o revisao.md "Revise o diff de origin/main..HEAD e liste riscos por arquivo."'
        ].join('\n') },
        { tipo: 'texto', html:
          '<p>No GitHub, a documentação manda usar <code>openai/codex-action@v1</code> em vez de instalar e autenticar a CLI à mão: a ação instala o Codex, sobe um proxy para a API de Responses quando você passa a chave e roda o <code>codex exec</code> com as permissões que você definir (entradas <code>openai-api-key</code>, <code>prompt</code> ou <code>prompt-file</code>, <code>sandbox</code>, <code>output-file</code>, <code>codex-args</code>, <code>codex-version</code>). Roda em runner Linux ou macOS; no Windows exige <code>safety-strategy: unsafe</code>. No checkout use <code>persist-credentials: false</code> e <code>permissions: contents: read</code> no job do Codex. O aviso de segurança da própria documentação: <strong>não</strong> defina <code>OPENAI_API_KEY</code> ou <code>CODEX_API_KEY</code> como variável de ambiente do job inteiro em workflows que fazem checkout ou executam código do repositório, pois scripts de build, testes e dependências leem o ambiente. E não use <code>~/.codex/auth.json</code> de conta pessoal em repositório público.</p>' },
        { tipo: 'cenario', id: 'cx2-cenario-ci', titulo: 'Revisão automática de PR com o Codex', obrigatorio: false,
          enunciado: 'Seu time quer que cada PR do <code>pedidos-api</code> receba uma revisão do Codex como comentário. O repositório é público e aceita PRs de forks. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Como você autentica e executa?', opcoes: [
              { texto: 'Definir <code>OPENAI_API_KEY</code> no <code>env</code> do job, depois instalar dependências, rodar os testes e chamar <code>codex exec</code>.', vai: 'f-env', tom: 'ruim', consequencia: 'build, testes e scripts de dependência rodam no mesmo ambiente e leem a chave.' },
              { texto: 'Usar o <code>auth.json</code> da sua conta pessoal do ChatGPT no runner, para aproveitar o plano.', vai: 'f-auth', tom: 'ruim', consequencia: 'a documentação desaconselha esse fluxo em repositório público.' },
              { texto: 'Usar <code>openai/codex-action@v1</code> com a chave em <em>secrets</em>, checkout sem credenciais persistidas e <code>contents: read</code>.', vai: 'no2', tom: 'ok', consequencia: 'a ação isola a chave atrás de um proxy e roda o <code>exec</code> sob a permissão que você definir.' }
            ] },
            no2: { texto: 'A revisão só precisa ler o diff e comentar. Que sandbox você configura na ação?', opcoes: [
              { texto: '<code>read-only</code>; o comentário sai por um passo separado, com permissão mínima.', vai: 'f-bom', tom: 'ok', consequencia: 'o menor privilégio que cumpre a tarefa.' },
              { texto: '<code>workspace-write</code>, para o Codex poder corrigir o que achar.', vai: 'f-meio', tom: 'ruim', consequencia: 'funciona, mas concede escrita a uma tarefa que é só leitura.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Ação oficial, chave em secret, checkout sem credenciais, <code>read-only</code>, comentário em job separado com <code>pull-requests: write</code>. A chave nunca fica no ambiente de código do PR.' },
            'f-env': { bom: false, texto: 'Um PR de fork alterou um script de teste e leu <code>OPENAI_API_KEY</code> do ambiente do job. Chave de CI no ambiente que executa código de terceiros é exatamente o que a documentação proíbe.' },
            'f-auth': { bom: false, texto: 'Um token de conta pessoal foi parar num runner de repositório público. A documentação manda usar chave de API nesse caso e reserva o <code>auth.json</code> para runners confiáveis e privados.' },
            'f-meio': { bom: false, texto: 'Nada quebrou, mas você abriu escrita sem necessidade. Em automação, comece em <code>read-only</code> e suba só se o trabalho pedir.' }
          },
          callout: 'Você montou o job com chave isolada, checkout sem credenciais e sandbox mínimo.' },
        { tipo: 'takeaway', html: 'Skills ficam em <mark>.agents/skills</mark>; em CI, <mark>codex exec</mark> começa <mark>read-only</mark> e a <mark>chave nunca</mark> entra no ambiente que roda o <mark>código do PR</mark>.' }
      ] },

      /* ---------------- Aba 4 ---------------- */
      { rotulo: 'Custo, armadilhas e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Modelo e esforço</h3>' +
          '<p class="ta-nota">Seção com validade de 30 dias: nomes de modelo, planos e preços mudam depressa. Estado em 09/11/2026, na documentação de modelos e de preços do Codex.</p>' +
          '<p>Se você não define <code>model</code>, a CLI usa um modelo recomendado. Para fixar, <code>model = "gpt-6.1-sol"</code> no <code>config.toml</code>, ou <code>/model</code> na sessão (que também ajusta o esforço). A documentação orienta: <code>gpt-6.1-sol</code> como ponto de partida para trabalho exigente, de longa duração e repetido (quando sua conta ou workspace tem acesso); <code>gpt-6-luna</code> como opção mais rápida e barata para agentes leves, de tarefas claras e volumosas; Astra para o trabalho de ponta a ponta mais difícil. O esforço de raciocínio (<code>model_reasoning_effort</code>: <code>low</code>, <code>medium</code>, <code>high</code> e, conforme o modelo, <code>xhigh</code>, <code>max</code>, <code>ultra</code>) troca latência e tokens por qualidade. <code>/fast</code> alterna uma camada de serviço mais rápida quando o catálogo do modelo oferece uma. Em subagentes, defina modelo e esforço no arquivo do agente ou em <code>[agents]</code>.</p>' +
          '<h3>Planos e custo</h3>' +
          '<p>A CLI vem com os planos do ChatGPT; a página de preços listava em 09/11/2026: Go a US$ 8/mês (GPT-6 Luna, sujeito a liberação), Plus a US$ 20/mês (CLI, IDE, web, revisão de código na nuvem, GPT-6.1 Sol e GPT-6 Luna) e Pro a partir de US$ 100/mês (planos de US$ 100, US$ 200 e US$ 500). Com chave de API a cobrança é por uso, indicada para automação em CI. Quem atinge o limite pode comprar créditos. Dentro da sessão, <code>/status</code> mostra modelo, aprovação, <em>writable roots</em> e uso de tokens, e <code>/usage</code> mostra o consumo da conta. Alavancas de custo: modelo e esforço menores em tarefas simples, <code>/compact</code> em chats longos, usar subagentes só onde há paralelismo real (cada um consome tokens por conta própria) e lembrar que o revisor automático (<code>approvals_reviewer = "auto_review"</code>) faz chamadas extras de modelo.</p>' +
          '<h3>Armadilhas, em uma lista</h3>' +
          '<ul>' +
          '<li><strong>Política <code>untrusted</code> aposentada</strong>: mantê-la pode impedir o Codex de iniciar.</li>' +
          '<li><strong><code>--full-auto</code> removida</strong> do <code>exec</code>; <strong><code>codex mcp-server</code> removido</strong> (use o app server); <strong>prompts customizados obsoletos</strong>.</li>' +
          '<li><strong>Hook novo ou editado é pulado</strong> até a confiança; <strong><code>continue: false</code> em PreToolUse não bloqueia</strong>.</li>' +
          '<li><strong>Arquivo de agente não muda sandbox</strong>; "não edite" no texto não é barreira.</li>' +
          '<li><strong>Projeto marcado como não confiável</strong> perde config, hooks e regras de <code>.codex/</code>.</li>' +
          '<li><strong>Pastas <code>.git</code>, <code>.agents</code>, <code>.codex</code>, <code>.aws</code></strong> são somente leitura mesmo no <code>workspace-write</code>.</li>' +
          '<li><strong>Chave de API no ambiente do job</strong> que executa código do repositório.</li>' +
          '<li><strong>Lista de skills com orçamento</strong>: com muitas instaladas, algumas somem com um aviso; encurte descrições ou suba <code>skills.max_context_tokens</code>.</li>' +
          '</ul>' },
        { tipo: 'escolha', id: 'cx2-escolha-agente', titulo: 'Confira: o revisor "somente leitura"',
          pergunta: 'Você configurou três agentes de revisão com <code>sandbox_mode = "read-only"</code> nos arquivos TOML e a sessão pai está no preset Auto. Um deles editou um arquivo. Qual a explicação e o conserto?',
          opcoes: [
            opc('a', 'O campo do agente não vale: subagentes herdam o sandbox do pai. Para revisores que não editam, rode a sessão pai em <code>read-only</code> (<code>/permissions</code>)', true, 'a documentação diz que sandbox e aprovação do arquivo de agente não sobrescrevem a sessão pai.'),
            opc('b', 'O Codex ignorou o TOML por erro de sintaxe; reescreva com mais aspas', false, 'o campo é ignorado por regra, não por sintaxe.'),
            opc('c', 'Troque o <code>sandbox_mode</code> para <code>workspace-write</code> no TOML', false, 'também seria ignorado.'),
            opc('d', 'Use <code>--yolo</code> no pai para o agente ficar mais cuidadoso', false, 'remove o sandbox de todos.')
          ], tutorDepois: 'Quem manda no sandbox é o turno pai.' },
        { tipo: 'escolha', id: 'cx2-escolha-fullauto', titulo: 'Confira: o script legado do CI',
          pergunta: 'Um workflow antigo roda <code>codex exec --full-auto "corrija os testes que falham"</code> e agora falha. O que a documentação manda fazer?',
          opcoes: [
            opc('a', 'Trocar por <code>--sandbox workspace-write</code> (e, se quiser revisão automática de aprovações, usar o mecanismo documentado para isso), mantendo o mínimo de permissão', true, 'a flag foi removida; <code>exec</code> começa em leitura e o que edita precisa de <code>workspace-write</code>.'),
            opc('b', 'Trocar por <code>--yolo</code>', false, 'remove sandbox e aprovação: só em VM descartável.'),
            opc('c', 'Voltar a versão antiga do Codex indefinidamente', false, 'a flag não é mais suportada nas versões atuais.'),
            opc('d', 'Adicionar <code>--skip-git-repo-check</code>', false, 'resolve a verificação de Git, não o argumento removido.')
          ], tutorDepois: 'Leitura por padrão, escrita de workspace por escolha explícita.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Equivalente nas outras ferramentas</h3>' +
          '<p class="ta-nota">Codex CLI e Claude Code verificados em 09/11/2026. Para Cursor e OpenCode, a aula "Onde fica cada coisa" da Trilha rápida (12/10/2026; revalide).</p>' +
          tab(['Recurso', 'Codex CLI', 'Claude Code'], [
            ['Subagentes', '<code>.codex/agents/*.toml</code>; default, worker, explorer; herdam o sandbox do pai', '<code>.claude/agents/*.md</code>; Explore, Plan, general-purpose; <code>permissionMode</code> e <code>tools</code> no agente'],
            ['Hooks', '<code>hooks.json</code> ou <code>[hooks]</code>; confiança por hash em <code>/hooks</code>', '<code>settings.json</code> chave <code>hooks</code>; exit 2 ou JSON <code>deny</code>; <code>/hooks</code> só lista'],
            ['Regras de comando', '<code>.rules</code> com <code>prefix_rule</code> (experimental)', 'Regras <code>allow</code>, <code>ask</code>, <code>deny</code> em <code>settings.json</code>'],
            ['MCP', '<code>codex mcp add</code>; <code>[mcp_servers.nome]</code>', '<code>claude mcp add</code>; <code>.mcp.json</code>; escopos'],
            ['Skills e comandos', '<code>.agents/skills</code>; <code>$nome</code>; prompts obsoletos', '<code>.claude/skills</code>; <code>/nome</code>; <code>.claude/commands</code> legado'],
            ['Plugins', '<code>codex plugin</code>; <code>/plugins</code>; <code>/import</code> do Claude Code', '<code>/plugin</code>; <code>.claude-plugin/plugin.json</code>'],
            ['Sem tela e CI', '<code>codex exec</code>; <code>openai/codex-action@v1</code>', '<code>claude -p</code>; <code>anthropics/claude-code-action@v1</code>'],
            ['Teto de custo', 'Esforço, modelo e uso de subagentes; sem flag de orçamento documentada nesta rodada', '<code>--max-turns</code>, <code>--max-budget-usd</code>']
          ]) },
        { tipo: 'takeaway', html: 'No Codex avançado, <mark>o pai manda</mark> (sandbox e aprovação), <mark>hook exige confiança</mark> e <mark>CI começa em read-only</mark> com a chave <mark>isolada</mark>.' }
      ] }
    ]
  });
})();
