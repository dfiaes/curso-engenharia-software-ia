/* Ferramentas · Claude Code 2 · "Claude Code avançado". Fatos de produto verificados em 09/11/2026 na documentação oficial (code.claude.com/docs); tabela de fontes e prazos em ferramentas/fontes/claude-code.md. A saída do hook na aba 2 foi executada de verdade (script do guia oficial de hooks, com jq); saídas de sessão são rotuladas "exemplo". */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tab(cab, linhas) {
    return '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  var VERIF = '<p class="ta-nota">Verificado em 09/11/2026 na documentação oficial do Claude Code. Eventos, campos e flags crescem a cada versão: trate esta aula como mapa e rode <code>/hooks</code>, <code>/mcp</code> e <code>claude --help</code> na sua versão.</p>';

  TrilhaAula.registrar({
    id: 'fer-claude-code-2',
    titulo: 'Claude Code avançado',
    minutos: 40,
    resumo: 'Subagentes, hooks, MCP, skills, plugins, uso sem tela em CI, escolha de modelo, custo e as armadilhas que a documentação registra.',
    objetivo: 'Definir um subagente com ferramentas restritas, impor uma regra com hook que bloqueia de verdade, configurar um servidor MCP por escopo, rodar o Claude Code em CI com o mínimo de permissão e escolher modelo e esforço com custo em mente.',
    revisao: [
      { id: 'cc2-exit', pergunta: 'Um hook <code>PreToolUse</code> de política encerra com <code>exit 1</code> ao achar a violação. O que o Claude Code faz?',
        opcoes: [
          opc('a', 'Trata como erro não bloqueante e a ferramenta roda; para bloquear use <code>exit 2</code> ou JSON com <code>permissionDecision: "deny"</code>', true, 'a documentação avisa que o 1, convenção Unix de falha, não bloqueia sem JSON válido.'),
          opc('b', 'Bloqueia a chamada, como qualquer código diferente de zero', false, 'só o 2 (ou o JSON de negação) bloqueia.'),
          opc('c', 'Encerra a sessão inteira', false, 'não há esse efeito.')] },
      { id: 'cc2-explore', pergunta: 'Por que o subagente Explore pode sugerir um comando que o seu CLAUDE.md proíbe?',
        opcoes: [
          opc('a', 'Explore e Plan começam sem os arquivos CLAUDE.md (e sem o git status) para a pesquisa ser rápida e barata', true, 'subagentes personalizados carregam o CLAUDE.md, a menos que o campo <code>omitClaudeMd</code> diga o contrário.'),
          opc('b', 'O Explore ignora regras de permissão', false, 'ele herda as regras de permissão do pai e roda só com ferramentas de leitura.'),
          opc('c', 'O CLAUDE.md só vale no modo auto', false, 'não há relação com o modo.')] },
      { id: 'cc2-mcp-escopo', pergunta: 'Qual escopo do <code>claude mcp add</code> grava em <code>.mcp.json</code> para o time inteiro?',
        opcoes: [
          opc('a', '<code>--scope project</code>', true, 'o padrão é <code>local</code> (só você, neste projeto); <code>user</code> vale para todos os seus projetos.'),
          opc('b', '<code>--scope local</code>', false, 'esse é o padrão e não é compartilhado.'),
          opc('c', '<code>--scope user</code>', false, 'vale só para você, em todos os projetos.')] },
      { id: 'cc2-headless', pergunta: 'Qual flag deixa um <code>claude -p</code> de CI independente do <code>~/.claude</code> e dos hooks e MCP do repositório?',
        opcoes: [
          opc('a', '<code>--bare</code>, que pula a descoberta automática e exige <code>ANTHROPIC_API_KEY</code> (não usa o login da assinatura)', true, 'sem ela o <code>-p</code> roda hooks e conecta servidores do projeto mesmo numa pasta nunca confiada.'),
          opc('b', '<code>--verbose</code>', false, 'só aumenta o log.'),
          opc('c', '<code>--continue</code>', false, 'retoma uma sessão; nada tem a ver com isolamento.')] },
      { id: 'cc2-plugin-custo', pergunta: 'Instalar um plugin com muitas skills encarece a sessão mesmo sem usá-las. Por quê?',
        opcoes: [
          opc('a', 'Nome e descrição de cada skill, agente e comando invocável entram no contexto a cada turno', true, 'por isso a documentação mostra uma estimativa de custo de contexto e lista plugins "não usados recentemente".'),
          opc('b', 'O plugin baixa o código da skill a cada mensagem', false, 'não é rede; é contexto.'),
          opc('c', 'Plugins desativam o cache de prompt', false, 'a documentação não diz isso.')] }
    ],
    abas: [

      /* ---------------- Aba 1 ---------------- */
      { rotulo: 'Subagentes e worktrees', blocos: [
        { tipo: 'texto', html:
          '<p>Pré-requisito: o conceito de subagente está na Trilha rápida, aula 07. Aqui, como o Claude Code o define e o limita.</p>' + VERIF +
          '<h3>Os built-ins</h3>' +
          tab(['Agente', 'Para que serve', 'Detalhe que importa'], [
            ['<code>Explore</code>', 'Busca e leitura do código, só leitura', 'Começa <strong>sem</strong> CLAUDE.md e sem o git status; Write e Edit negados'],
            ['<code>Plan</code>', 'Pesquisa para o plano, usado em plan mode', 'Também sem CLAUDE.md; herda o modelo da conversa'],
            ['<code>general-purpose</code>', 'Tarefas com exploração e modificação', 'Todas as ferramentas disponíveis a subagentes']
          ]) +
          '<p>O Claude delega sozinho conforme a <code>description</code> de cada subagente, ou você pede (digite <code>@</code> e escolha o agente na lista, ou peça em linguagem natural). Cada descrição fica no contexto: a documentação avisa na partida quando o total das descrições de agentes seus passa de 15.000 tokens. Subagentes lançados da conversa principal começam em segundo plano por padrão; <kbd>Ctrl</kbd>+<kbd>B</kbd> também manda tarefas para segundo plano e <code>/tasks</code> lista o que está rodando.</p>' +
          '<h3>Definir o seu</h3>' +
          '<p>Um arquivo Markdown com frontmatter YAML: só <code>name</code> e <code>description</code> são obrigatórios; o corpo vira o prompt de sistema (o subagente <em>não</em> recebe o prompt de sistema do Claude Code). Onde salvar, da maior para a menor prioridade: política gerenciada, flag <code>--agents</code>, <code>.claude/agents/</code> (projeto, versionado), <code>~/.claude/agents/</code> (pessoal) e a pasta <code>agents/</code> de um plugin. A pasta é vigiada: editar o arquivo vale em poucos segundos, sem reiniciar (exceto a primeira vez que a pasta <code>agents/</code> passa a existir).</p>' +
          tab(['Campo', 'Uso'], [
            ['<code>tools</code> / <code>disallowedTools</code>', 'Restringem as ferramentas; omitido, herda todas'],
            ['<code>model</code>', '<code>sonnet</code>, <code>opus</code>, <code>haiku</code>, <code>fable</code>, nome completo ou <code>inherit</code>'],
            ['<code>permissionMode</code>', 'Modo de permissão do subagente (ignorado em subagente de plugin)'],
            ['<code>maxTurns</code>', 'Teto de turnos; ao estourar devolve resultado parcial'],
            ['<code>isolation: worktree</code>', 'Roda numa cópia temporária do repositório (git worktree)'],
            ['<code>skills</code>, <code>mcpServers</code>, <code>hooks</code>, <code>memory</code>', 'Pré-carrega skills, escopa MCP e hooks, memória persistente']
          ]) },
        { tipo: 'callout', tom: 'danger', titulo: 'Campo errado não dá erro', html:
          '<p>A documentação é explícita: o Claude Code <strong>ignora sem avisar</strong> um campo de frontmatter que não reconhece (por exemplo <code>models:</code> no lugar de <code>model:</code>). O subagente carrega, só que sem a restrição que você achou ter posto. Para achar o erro, rode <code>claude --debug</code> e procure "does not recognize or apply" no log em <code>~/.claude/debug/</code>. Arquivos sem <code>name</code> ou sem <code>description</code> também são pulados sem aviso na sessão.</p>' },
        { tipo: 'complete', id: 'cc2-complete-agent', titulo: 'Monte um subagente revisor', obrigatorio: false, linguagem: 'markdown',
          enunciado: 'Complete o <code>.claude/agents/revisor-seguranca.md</code>: precisa disparar quando mudar código sensível, ser somente leitura e rodar num modelo mais barato.',
          partes: [
            '---\nname: revisor-seguranca\ndescription: ', { lacuna: 'desc', opcoes: ['Revisa o diff em busca de falhas de segurança. Use depois de mudar autenticação, SQL ou entrada de usuário.', 'Agente útil para tudo que envolve qualidade.', 'segurança'], correta: 'Revisa o diff em busca de falhas de segurança. Use depois de mudar autenticação, SQL ou entrada de usuário.' },
            '\ntools: ', { lacuna: 'tools', opcoes: ['Read, Glob, Grep', 'Read, Glob, Grep, Edit, Write, Bash', 'tudo'], correta: 'Read, Glob, Grep' },
            '\n', { lacuna: 'campo', opcoes: ['model', 'models', 'modelo'], correta: 'model' },
            ': haiku\n---\n\nVocê revisa mudanças em um serviço FastAPI. Aponte injeção de SQL, segredos no código e validação ausente, com arquivo e linha. Não edite nada.\n'
          ],
          explicacao: 'A <code>description</code> é o gatilho: diz o que o agente faz e quando usá-lo. <code>tools</code> sem Edit, Write e Bash garante somente leitura por construção, melhor que pedir "não edite" no prompt. O campo se chama <code>model</code>; <code>models</code> seria ignorado sem erro e o agente herdaria o modelo da conversa.',
          callout: 'Subagente montado: gatilho claro, somente leitura, modelo barato, campo escrito certo.' },
        { tipo: 'texto', html:
          '<h3>Isolar com worktrees</h3>' +
          '<p>Subagentes dividem trabalho <em>dentro</em> de uma sessão; <strong>worktrees</strong> isolam as edições de sessões paralelas. <code>claude --worktree correcao-1</code> (ou <code>-w</code>) cria um worktree em <code>.claude/worktrees/correcao-1/</code> num branch <code>worktree-correcao-1</code> e inicia a sessão nele. Num subagente, <code>isolation: worktree</code> faz o mesmo para aquela tarefa. Também aceita <code>#número</code> ou a URL de um PR/MR para buscar do <code>origin</code>. O comando <code>/batch</code> decompõe uma mudança grande em 5 a 30 unidades independentes e roda cada uma em seu próprio worktree depois da sua aprovação do plano. A regra da Trilha rápida (aula 07) continua valendo: o teto é a sua capacidade de revisão.</p>' },
        { tipo: 'takeaway', html: 'Subagente é um <mark>arquivo com frontmatter</mark>; o que o restringe é o campo <mark>tools</mark>, e um campo escrito errado é <mark>ignorado sem erro</mark>.' }
      ] },

      /* ---------------- Aba 2 ---------------- */
      { rotulo: 'Hooks e MCP', blocos: [
        { tipo: 'texto', html:
          '<h3>Hooks: três níveis e um contrato de saída</h3>' +
          '<p>Um hook é configurado em três níveis: o <strong>evento</strong> (quando), o <strong>matcher</strong> (para qual ferramenta) e o <strong>handler</strong> (o que roda). Fica em <code>settings.json</code> (de usuário, do projeto ou local), em um plugin (<code>hooks/hooks.json</code>) ou no frontmatter de uma skill ou subagente. Rode <code>/hooks</code> para ver o que está ativo.</p>' +
          tab(['Evento', 'Quando dispara', 'Uso típico'], [
            ['<code>SessionStart</code>', 'Sessão começa ou retoma', 'Injetar contexto'],
            ['<code>UserPromptSubmit</code>', 'Antes de processar o prompt', 'Filtrar segredos no prompt'],
            ['<code>PreToolUse</code>', 'Antes de a ferramenta executar; pode bloquear', 'Proteger caminhos, comandos'],
            ['<code>PermissionRequest</code>', 'Quando uma ação pediria permissão', 'Aprovar ou negar por política'],
            ['<code>PostToolUse</code>', 'Depois de a ferramenta ter sucesso', 'Formatar e lintar (não desfaz nada)'],
            ['<code>Stop</code> / <code>SubagentStop</code>', 'Claude termina de responder / subagente termina', 'Exigir teste verde antes de parar'],
            ['<code>PreCompact</code>, <code>PostCompact</code>', 'Em volta da compactação', 'Reinjetar contexto']
          ]) +
          '<p>Salve o JSON abaixo em <code>.claude/settings.json</code>. O handler é normalmente um comando que lê o JSON do evento no <code>stdin</code>. O contrato: <strong>exit 0</strong> segue o fluxo (e o <code>stdout</code> pode trazer JSON de decisão); <strong>exit 2</strong> é erro bloqueante e o <code>stderr</code> volta ao Claude como explicação; <strong>qualquer outro código</strong> é erro não bloqueante, e a ação segue. Para negar via JSON, devolva <code>hookSpecificOutput.permissionDecision = "deny"</code> com a razão. O <code>deny</code> de um hook vale em todos os modos de permissão, inclusive <code>bypassPermissions</code>. O matcher distingue maiúsculas de minúsculas, e o campo <code>if</code> (por exemplo <code>Bash(rm *)</code>) estreita ainda mais para o hook não iniciar à toa. Há também handlers do tipo <code>http</code>, <code>mcp_tool</code>, <code>prompt</code> e <code>agent</code> (este marcado como experimental).</p>' },
        { tipo: 'codigo', linguagem: 'json', texto: [
          '{',
          '  "hooks": {',
          '    "PreToolUse": [',
          '      {',
          '        "matcher": "Edit|Write",',
          '        "hooks": [',
          '          { "type": "command",',
          '            "command": "\\"$CLAUDE_PROJECT_DIR\\"/.claude/hooks/protect-files.sh" }',
          '        ]',
          '      }',
          '    ]',
          '  }',
          '}'
        ].join('\n') },
        { tipo: 'rode', id: 'cc2-rode-hook', titulo: 'O hook que bloqueia, executado',
          enunciado: 'O script é o <code>protect-files.sh</code> do guia oficial de hooks. As duas primeiras saídas vêm de uma execução real em 09/11/2026 (com <code>jq</code>); a terceira etapa descreve o comportamento documentado.',
          prefixo: '$', entrada: 'echo \'{"tool_name":"Edit","tool_input":{"file_path":".env"}}\' | .claude/hooks/protect-files.sh; echo "exit=$?"', unidade: 's', terminalTitulo: 'hook',
          prever: { pergunta: 'Seu hook detecta a violação e termina com <code>exit 1</code> (a convenção Unix de falha), sem imprimir JSON. A edição do <code>.env</code> acontece?', opcoes: [
            opc('a', 'Não: qualquer código de saída diferente de zero bloqueia', false, 'só o código 2 bloqueia; o 1 sem JSON é erro não bloqueante.'),
            opc('b', 'Acontece: exit 1 sem JSON vale como erro não bloqueante e a ferramenta roda', true, 'é a pegadinha que a documentação destaca: para política, use exit 2 (ou o JSON de negação).'),
            opc('c', 'A sessão pergunta a você se deve prosseguir', false, 'isso seria uma decisão "ask" em JSON, não um exit 1.')
          ] },
          etapas: [
            { id: 'bloq', nome: 'Caminho protegido', descricao: 'exit 2 e motivo no stderr', tom: 'request', ms: 1, linhas: [
              L('cmd', 'echo \'{"tool_name":"Edit","tool_input":{"file_path":".env"}}\' | .claude/hooks/protect-files.sh; echo "exit=$?"'),
              L('out', 'Blocked: .env matches protected pattern \'.env\''),
              L('hint', 'exit=2   (o Claude recebe o texto e ajusta o plano)') ] },
            { id: 'livre', nome: 'Caminho livre', descricao: 'exit 0, fluxo normal de permissão', tom: 'response', ms: 1, linhas: [
              L('cmd', 'echo \'{"tool_name":"Edit","tool_input":{"file_path":"src/app.py"}}\' | .claude/hooks/protect-files.sh; echo "exit=$?"'),
              L('hint', 'exit=0   (sem decisão: segue o fluxo normal de permissão)') ] },
            { id: 'um', nome: 'O erro clássico', descricao: 'exit 1 sem JSON: não bloqueia (comportamento documentado)', tom: 'tls', ms: 1, linhas: [
              L('info', 'troque "exit 2" por "exit 1" no script e repita o primeiro teste'),
              L('out', 'exit=1'),
              L('hint', 'erro não bloqueante: a edição seguiria. Política exige exit 2 ou JSON com permissionDecision "deny"') ] }
          ],
          tutorDepois: 'Bloqueio é exit 2 com a razão no stderr (ou JSON de negação). Teste o seu hook com um comando que deva ser barrado antes de confiar nele, como o guia oficial manda: pipe de JSON de amostra e <code>echo $?</code>.',
          callout: 'Você viu o hook barrar, liberar e viu por que exit 1 não é bloqueio.' },
        { tipo: 'callout', tom: 'danger', titulo: 'O hook só vê o que o matcher casa', html:
          '<p>Um matcher <code>Edit|Write</code> não observa um <code>sed -i</code> dentro de um comando <code>Bash</code>: são ferramentas diferentes. É o mesmo furo que a aula A01 · Build descreve (raciocínio, não citação da documentação do Claude Code). Duas defesas: um segundo hook com matcher <code>Bash</code> que inspeciona o comando, e um check sobre o <code>git diff</code> no pre-commit e no CI, que enxerga o efeito e não o caminho.</p>' },
        { tipo: 'texto', html:
          '<h3>MCP: adicionar, escopo e aprovação</h3>' +
          '<p>Pré-requisito: o protocolo está na Trilha rápida, aula 09. No Claude Code o servidor entra por linha de comando (ou editando JSON) e vive em um de três escopos:</p>' +
          tab(['Escopo', 'Flag', 'Onde guarda', 'Quem usa'], [
            ['local (padrão)', '<code>--scope local</code>', 'Config do usuário, por projeto', 'Só você, neste projeto'],
            ['project', '<code>--scope project</code>', '<code>.mcp.json</code> na raiz', 'O time (versionado)'],
            ['user', '<code>--scope user</code>', 'Config do usuário', 'Você, em todos os projetos']
          ]) },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# servidor remoto (HTTP é o recomendado; SSE está obsoleto)',
          'claude mcp add --transport http notion https://mcp.notion.com/mcp',
          '',
          '# servidor local (stdio): o "--" separa as opções do Claude do comando do servidor',
          'claude mcp add --transport stdio --env API_KEY=SEGREDO meu-db -- python server.py --port 8080',
          '',
          '# compartilhar com o time (grava .mcp.json)',
          'claude mcp add --transport http docs --scope project https://example.com/mcp',
          '',
          'claude mcp list        # lista e mostra status',
          'claude mcp get docs    # detalhe de um servidor',
          '# dentro da sessão: /mcp (conexões e login OAuth)'
        ].join('\n') },
        { tipo: 'texto', html:
          '<p>Em sessão interativa, um servidor de <code>.mcp.json</code> pede a sua <strong>aprovação</strong> antes de ser usado (<code>claude mcp reset-project-choices</code> zera as escolhas). Em <code>claude -p</code>, no SDK e em sessões na nuvem fora de um projeto do claude.ai esse aviso não existe e os servidores do projeto <strong>carregam sem perguntar</strong>; para impedir, use <code>disabledMcpjsonServers</code>, <code>--setting-sources</code> sem o projeto, ou <code>--strict-mcp-config</code> com <code>--mcp-config</code>. As definições das ferramentas MCP são adiadas por padrão (só nomes entram no contexto até o uso). O Claude avisa quando a saída de uma ferramenta passa de 10.000 tokens e limita a 25.000 por padrão (<code>MAX_MCP_OUTPUT_TOKENS</code> muda o teto); <code>MCP_TIMEOUT</code> controla a partida do servidor. Para ferramentas que já têm CLI (<code>gh</code>, <code>aws</code>), a documentação de custos lembra que o CLI gasta menos contexto que um servidor MCP.</p>' },
        { tipo: 'complete', id: 'cc2-complete-mcp', titulo: 'Complete o .mcp.json do projeto', obrigatorio: false, linguagem: 'json',
          enunciado: 'Servidor remoto de documentação compartilhado com o time. Complete o arquivo da raiz do repositório.',
          partes: [
            '{\n  "', { lacuna: 'chave', opcoes: ['mcpServers', 'servers', 'mcp'], correta: 'mcpServers' },
            '": {\n    "docs": {\n      "type": "', { lacuna: 'tipo', opcoes: ['http', 'url', 'remote'], correta: 'http' },
            '",\n      "url": "https://example.com/mcp"\n    }\n  }\n}\n'
          ],
          explicacao: 'O formato do Claude Code usa a chave <code>mcpServers</code> (outros clientes usam <code>servers</code>: copiar o bloco de lá é um erro comum). Uma entrada com <code>url</code> e sem <code>type</code> é erro de configuração: o Claude Code a lê como servidor stdio, pula o servidor e reporta que falta <code>"type": "http"</code>. <code>streamable-http</code> é aceito como apelido de <code>http</code>.',
          callout: '.mcp.json montado: chave certa, tipo explícito.' },
        { tipo: 'takeaway', html: '<mark>Exit 2</mark> bloqueia, <mark>exit 1</mark> não; e servidor MCP de projeto precisa de <mark>aprovação</mark> na sessão interativa, mas <mark>não no modo -p</mark>.' }
      ] },

      /* ---------------- Aba 3 ---------------- */
      { rotulo: 'Skills, plugins e CI', blocos: [
        { tipo: 'texto', html:
          '<h3>Skills e comandos próprios</h3>' +
          '<p>Pré-requisitos: Trilha rápida, aulas 10 e 11. Uma skill é uma pasta com <code>SKILL.md</code>; o nome da pasta (ou o campo <code>name</code>) vira o comando <code>/nome</code>, e o Claude também a carrega sozinho quando a <code>description</code> casa com o pedido.</p>' +
          tab(['Local', 'Caminho', 'Vale em'], [
            ['Pessoal', '<code>~/.claude/skills/&lt;nome&gt;/SKILL.md</code>', 'Todos os seus projetos'],
            ['Projeto', '<code>.claude/skills/&lt;nome&gt;/SKILL.md</code>', 'Este repositório (versione)'],
            ['Aninhado', '<code>&lt;subpasta&gt;/.claude/skills/...</code>', 'Sessões na subpasta ou trabalho nela'],
            ['Plugin', '<code>&lt;plugin&gt;/skills/&lt;nome&gt;/SKILL.md</code>', 'Onde o plugin está ativo, como <code>/plugin:nome</code>']
          ]) +
          '<p>Campos úteis do frontmatter: <code>description</code> (o gatilho; a descrição somada a <code>when_to_use</code> é truncada em 1.536 caracteres), <code>disable-model-invocation: true</code> (só você invoca) e <code>allowed-tools</code>. Salve o exemplo abaixo em <code>.claude/skills/resumir-mudancas/SKILL.md</code>; o frontmatter só vale se o <code>---</code> for a primeira linha do arquivo. A linha <code>!`comando`</code> no corpo executa o comando e injeta a saída antes de o Claude ler a skill. Arquivos antigos em <code>.claude/commands/</code> ainda funcionam, mas a documentação manda preferir skills em trabalho novo.</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          '---',
          'description: Resume mudanças não commitadas e aponta riscos. Use quando pedirem o que mudou, uma mensagem de commit ou revisão do diff.',
          '---',
          '',
          '## Mudanças atuais',
          '',
          '!`git diff HEAD`',
          '',
          '## Instruções',
          'Resuma o diff acima em até três itens e liste riscos: erro não tratado, valor fixo no código, teste a atualizar.'
        ].join('\n') },
        { tipo: 'texto', html:
          '<h3>Plugins</h3>' +
          '<p>Um <strong>plugin</strong> é uma pasta que empacota skills, subagentes, hooks e servidores MCP e se instala com um passo (<code>/plugin</code>, aba Discover; ou <code>claude plugin ...</code> no shell). A raiz leva <code>.claude-plugin/plugin.json</code> e as pastas <code>skills/</code>, <code>agents/</code>, <code>hooks/hooks.json</code> e <code>.mcp.json</code>. Skills de plugin ganham o prefixo do plugin. Dois cuidados: o plugin ativo entra em <em>toda</em> sessão (nome e descrição de tudo que o Claude puder invocar ficam no contexto) e roda com as suas permissões, então leia a página de segurança de plugins antes de instalar. Para testar o seu, <code>claude plugin eval</code> roda uma suíte de casos e compara com e sem o plugin.</p>' +
          '<h3>Sem tela: claude -p, flags e GitHub Actions</h3>' +
          '<p><code>claude -p "prompt"</code> roda uma vez e sai (código 0 em sucesso, diferente de zero em falha). A partir da versão 2.1.302, um <code>-p</code> sem modo definido começa em Manual e <strong>nega</strong> o que exigiria aprovação, a menos que uma regra <code>allow</code> o libere: por isso o CI precisa de <code>--allowedTools</code> explícito ou de <code>--permission-mode auto</code>.</p>' +
          tab(['Flag', 'Efeito'], [
            ['<code>--allowedTools "Read" "Bash(uv run pytest *)"</code>', 'Ferramentas que rodam sem perguntar'],
            ['<code>--permission-mode dontAsk</code>', 'Só o pré-aprovado; o resto é negado (CI travado)'],
            ['<code>--bare</code>', 'Sem descoberta automática (hooks, skills, MCP, plugins, CLAUDE.md, memória); exige <code>ANTHROPIC_API_KEY</code>'],
            ['<code>--output-format text|json|stream-json</code>', 'Formato da saída; <code>--json-schema</code> valida a resposta final'],
            ['<code>--max-turns N</code>, <code>--max-budget-usd X</code>', 'Tetos de turnos e de gasto estimado'],
            ['<code>--mcp-config</code>, <code>--settings</code>, <code>--agents</code>', 'Carregar MCP, configuração e subagentes explicitamente em <code>--bare</code>'],
            ['<code>--no-session-persistence</code>', 'Não grava a sessão em disco']
          ]) },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# revisão somente leitura em CI: determinística e com teto',
          'claude --bare -p "Revise o diff de origin/main..HEAD e liste riscos por arquivo." \\',
          '  --allowedTools "Read" --permission-mode dontAsk \\',
          '  --max-turns 8 --output-format json'
        ].join('\n') },
        { tipo: 'texto', html:
          '<p>No GitHub, o caminho oficial é a ação <code>anthropics/claude-code-action@v1</code>: guarde a chave em <em>secrets</em> (<code>anthropic_api_key</code>; ou <code>claude_code_oauth_token</code> para assinatura) e dê a permissão mínima ao workflow. Sem <code>prompt</code> ela espera a menção <code>@claude</code> em comentário de issue ou PR; com <code>prompt</code> roda em modo de automação em qualquer evento. O comando <code>/install-github-app</code> guia a instalação do app e dos workflows. Flags de CLI passam por <code>claude_args</code>, onde também ficam <code>--max-turns</code> e <code>--allowedTools</code>. Um aviso de segurança da própria documentação do <code>-p</code>: sem <code>--bare</code>, os hooks de <code>.claude/settings.json</code> do repositório e os servidores de <code>.mcp.json</code> rodam mesmo numa pasta nunca confiada, e num CI que roda PRs de terceiros isso é código do PR executando.</p>' },
        { tipo: 'cenario', id: 'cc2-cenario-ci', titulo: 'Revisão automática de PR no CI', obrigatorio: false,
          enunciado: 'Seu time quer um job que revisa cada PR do <code>pedidos-api</code> e comenta os riscos. O repositório aceita PRs de forks. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Como você monta o job?', opcoes: [
              { texto: 'Rodar <code>claude -p</code> no runner e deixar o Claude Code descobrir a configuração do repositório, como numa máquina de dev.', vai: 'f-descobre', tom: 'ruim', consequencia: 'o PR pode trazer um <code>.claude/settings.json</code> com hook e um <code>.mcp.json</code>; em <code>-p</code> eles rodam sem aviso.' },
              { texto: 'Rodar com <code>--dangerously-skip-permissions</code> para o revisor nunca travar em pergunta.', vai: 'f-bypass', tom: 'ruim', consequencia: 'esse modo só é indicado para contêiner ou VM isolados; num runner com segredos o raio de dano é grande.' },
              { texto: 'Rodar com <code>--bare</code> e liberar só a leitura, com tetos de turnos.', vai: 'no2', tom: 'ok', consequencia: 'sem descoberta automática, o resultado é o mesmo em toda máquina.' }
            ] },
            no2: { texto: 'Com <code>--bare</code>, o job falha com erro de autenticação. O que falta?', opcoes: [
              { texto: 'Definir <code>ANTHROPIC_API_KEY</code> como secret e passá-la ao job: o modo bare não usa o login da assinatura nem o chaveiro.', vai: 'f-bom', tom: 'ok', consequencia: 'a documentação diz que bare lê só a chave de API ou um <code>apiKeyHelper</code>.' },
              { texto: 'Tirar o <code>--bare</code> para usar o login do dev que configurou o runner.', vai: 'f-descobre', tom: 'ruim', consequencia: 'volta ao problema de descoberta automática.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: '<code>--bare -p</code> com <code>--allowedTools "Read"</code>, <code>--permission-mode dontAsk</code>, <code>--max-turns</code> e a chave em secret: leitura apenas, reprodutível, com teto. O comentário no PR sai por um passo separado com permissão mínima.' },
            'f-descobre': { bom: false, texto: 'Um PR de fork incluiu um hook em <code>.claude/settings.json</code> e ele executou no runner. A descoberta automática de configuração do repositório é o recurso certo na sua máquina e o risco errado no CI.' },
            'f-bypass': { bom: false, texto: 'Sem nenhuma verificação, qualquer instrução maliciosa dentro do diff virou ação no runner. Bypass exige isolamento, não só conveniência.' }
          },
          callout: 'Você montou o job com mínimo de permissão, sem descoberta automática e com teto.' },
        { tipo: 'takeaway', html: 'No CI, <mark>-p com --bare</mark>, <mark>permissão explícita</mark> e <mark>teto de turnos e gasto</mark>; a descoberta automática é conveniência de máquina de dev.' }
      ] },

      /* ---------------- Aba 4 ---------------- */
      { rotulo: 'Custo, armadilhas e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Escolha de modelo e esforço</h3>' +
          '<p>Os apelidos <code>sonnet</code>, <code>opus</code> e <code>haiku</code> resolvem para a versão mais nova do provedor e mudam com o tempo; <code>fable</code> aponta o modelo de topo (não é o padrão de nenhum plano e pode pedir créditos de uso). Em 09/11/2026, na API da Anthropic, a página de modelos listava <code>opus</code> como Opus 5.5, <code>sonnet</code> como Sonnet 5.5 e <code>haiku</code> como Haiku 5.5; em Bedrock e Foundry as versões podem ser anteriores. Para fixar uma versão, use o nome completo (por exemplo <code>claude-opus-5-5</code>) ou <code>ANTHROPIC_DEFAULT_OPUS_MODEL</code>.</p>' +
          tab(['Controle', 'Como', 'Observação'], [
            ['Modelo da sessão', '<code>/model</code> (salva como padrão), <kbd>Alt</kbd>/<kbd>Option</kbd>+<kbd>P</kbd>, <code>claude --model sonnet</code>', 'No seletor, <code>s</code> troca só para a sessão atual'],
            ['Plano com o forte, execução com o médio', '<code>opusplan</code>', 'Usa <code>opus</code> em plan mode e <code>sonnet</code> ao executar'],
            ['Esforço de raciocínio', '<code>/effort low|medium|high|xhigh|max|auto</code>', 'Níveis disponíveis dependem do modelo'],
            ['Modelo do subagente', 'Campo <code>model</code>; subagente <code>Explore</code> próprio com <code>haiku</code>', 'Sobrescreve o padrão do built-in'],
            ['Contexto longo', '<code>sonnet[1m]</code>, <code>opus[1m]</code>', 'Sem efeito quando o apelido já resolve para modelo com 1M nativo']
          ]) +
          '<h3>Custo</h3>' +
          '<p>O Claude Code cobra por token; com assinatura, o uso entra no plano e <code>/usage</code> mostra os limites. Para uso por API, a documentação de custos informava (09/11/2026) uma média de cerca de US$ 13 por desenvolvedor por dia ativo e US$ 150 a 250 por mês, com 90% dos usuários abaixo de US$ 30 por dia; é um retrato de empresas, não uma previsão sua. O valor em dólar de <code>/usage</code> é estimativa local por preço de lista, não a fatura. As alavancas que a documentação lista: <code>/clear</code> entre tarefas sem relação, <code>/compact</code> com instruções de foco, modelo menor para trabalho simples, desligar servidores MCP não usados, preferir CLIs a servidores MCP, e hooks que filtram dados grandes (como um log) antes de o modelo ler. Em automação, <code>--max-budget-usd</code> e <code>--max-turns</code> são o teto.</p>' +
          '<h3>Armadilhas, em uma lista</h3>' +
          '<ul>' +
          '<li><strong>CLAUDE.md não é cerca</strong> (aula 1) e editá-lo no meio da sessão não afeta a sessão corrente: a documentação de cache de prompt diz que a mudança só chega após <code>/clear</code>, <code>/compact</code> ou reinício.</li>' +
          '<li><strong>Regra Bash literal</strong>: <code>Bash(git push *)</code> não casa <code>git -C . push</code>.</li>' +
          '<li><strong>Hook com exit 1</strong> não bloqueia; hook <code>Edit|Write</code> não vê Bash.</li>' +
          '<li><strong>Frontmatter com campo errado</strong> é ignorado em silêncio.</li>' +
          '<li><strong>Explore e Plan sem CLAUDE.md</strong>: não espere deles as convenções do projeto.</li>' +
          '<li><strong>MCP de projeto sem aviso em <code>-p</code></strong> e <strong>plugin ativo gasta contexto em toda sessão</strong>.</li>' +
          '<li><strong><code>/agents</code></strong> mudou: a partir da v2.1.198 só imprime um lembrete para pedir ao Claude ou editar <code>.claude/agents/</code>; a interface interativa existia antes.</li>' +
          '</ul>' },
        { tipo: 'escolha', id: 'cc2-escolha-explore', titulo: 'Confira: a convenção que o Explore não conhecia',
          pergunta: 'O <code>CLAUDE.md</code> manda rodar testes com <code>uv run pytest -q</code>. Depois de uma pesquisa feita pelo subagente <code>Explore</code>, a conversa traz a sugestão de rodar <code>pytest</code> puro. Qual a explicação mais provável?',
          opcoes: [
            opc('a', 'Explore e Plan começam sem os arquivos CLAUDE.md, por isso não viram a convenção; a conversa principal precisa reafirmá-la', true, 'é o comportamento documentado para manter a pesquisa rápida e barata; subagentes personalizados carregam o CLAUDE.md, a menos que <code>omitClaudeMd</code> diga o contrário.'),
            opc('b', 'O Explore ignora o modo de permissão', false, 'ele herda as regras de permissão e é só leitura.'),
            opc('c', 'O CLAUDE.md foi apagado quando o contexto foi compactado', false, 'a compactação não apaga o CLAUDE.md; ele é recarregado do disco.'),
            opc('d', 'O Explore só entende comandos em inglês', false, 'não há essa limitação.')
          ], tutorDepois: 'Quem precisa da convenção a recebe no prompt de delegação ou usa um subagente seu, que carrega o CLAUDE.md.' },
        { tipo: 'escolha', id: 'cc2-escolha-plugin', titulo: 'Confira: o plugin que encareceu a sessão',
          pergunta: 'Depois de instalar um plugin com muitas skills e agentes, as sessões gastam mais tokens mesmo em tarefas que não usam nenhum deles. O que fazer?',
          opcoes: [
            opc('a', 'Medir o custo de contexto do plugin (estimativa na aba Marketplaces do <code>/plugin</code> e o grupo "Not used recently" em Installed) e desativá-lo com <code>claude plugin disable</code> se não compensar', true, 'a documentação descreve exatamente esses dois pontos de medição e o desligamento sem desinstalar.'),
            opc('b', 'Aceitar: plugins são sempre gratuitos em tokens', false, 'nome e descrição do que é invocável entram no contexto de cada turno.'),
            opc('c', 'Colocar as skills no CLAUDE.md', false, 'o CLAUDE.md carrega inteiro em toda sessão; é pior.'),
            opc('d', 'Trocar para o modo <code>bypassPermissions</code>', false, 'permissão não muda o contexto.')
          ], tutorDepois: 'Ativo significa presente em todo turno: mantenha só o que se paga.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Equivalente nas outras ferramentas</h3>' +
          '<p class="ta-nota">Claude Code e Codex CLI verificados em 09/11/2026. Para Cursor e OpenCode, a aula "Onde fica cada coisa" da Trilha rápida (12/10/2026; revalide).</p>' +
          tab(['Recurso', 'Claude Code', 'Codex CLI'], [
            ['Subagentes', '<code>.claude/agents/*.md</code>; Explore, Plan, general-purpose', '<code>.codex/agents/*.toml</code>; default, worker, explorer; herdam o sandbox do pai'],
            ['Hooks', '<code>settings.json</code> chave <code>hooks</code>; exit 2 ou JSON <code>deny</code>', '<code>hooks.json</code> ou <code>[hooks]</code> em <code>config.toml</code>; hook novo exige confiança em <code>/hooks</code>'],
            ['MCP', '<code>claude mcp add</code>; <code>.mcp.json</code>; escopos local, project, user', '<code>codex mcp add</code>; <code>[mcp_servers.nome]</code> em <code>config.toml</code>'],
            ['Skills', '<code>.claude/skills/&lt;nome&gt;/SKILL.md</code>; <code>/nome</code>', '<code>.agents/skills</code>; <code>$nome</code> ou <code>/skills</code>'],
            ['Comandos próprios', 'Skills (a pasta <code>.claude/commands</code> ainda funciona)', 'Skills (prompts customizados estão obsoletos)'],
            ['Plugins', '<code>/plugin</code>; <code>.claude-plugin/plugin.json</code>', '<code>codex plugin</code>; marketplaces'],
            ['Sem tela', '<code>claude -p</code>', '<code>codex exec</code>'],
            ['CI no GitHub', '<code>anthropics/claude-code-action@v1</code>', '<code>openai/codex-action@v1</code>'],
            ['Paralelo isolado', '<code>claude --worktree</code>; <code>isolation: worktree</code>', '<code>/worktree</code>; <code>codex exec --worktree</code>']
          ]) },
        { tipo: 'takeaway', html: 'Sênior no Claude Code é saber <mark>qual camada impõe</mark> (permissão, hook, CI) e <mark>medir o que fica no contexto</mark> (plugins, MCP, CLAUDE.md) antes de culpar o <mark>modelo</mark>.' }
      ] }
    ]
  });
})();
