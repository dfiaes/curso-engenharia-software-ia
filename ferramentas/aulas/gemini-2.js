/* Ferramentas · Gemini CLI e Antigravity 2. Fatos verificados em 09/11/2026 (geminicli.com, antigravity.google). Fontes: ferramentas/fontes/gemini.md */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tabela(cab, linhas) {
    return { tipo: 'texto', largo: true, html: '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' };
  }

  TrilhaAula.registrar({
    id: 'fer-gemini-2',
    titulo: 'Gemini CLI e Antigravity avançado',
    minutos: 35,
    resumo: 'Subagentes, skills e plugins em pastas .agents; hooks com contratos de saída diferentes nos dois produtos; MCP só por HTTP em streaming no Antigravity; execução em CI com autenticação em duas partes; cotas e modelos que mudam por plano.',
    objetivo: 'Definir subagentes e skills de projeto, escrever um hook que bloqueia um comando, configurar MCP no formato certo de cada produto, rodar o agente em CI de forma previsível e prever o custo pelo plano e pelo modelo.',
    revisao: [
      { id: 'g2-hookfile', pergunta: 'Você pôs <code>hooks</code> no <code>settings.json</code> do <code>agy</code>. Eles rodam?',
        opcoes: [
          opc('a', 'Não: o Antigravity lê hooks de <code>.agents/hooks.json</code> ou <code>~/.gemini/config/hooks.json</code>; os do settings do CLI não são carregados', true, 'o Gemini CLI, ao contrário, lê hooks do <code>settings.json</code>.'),
          opc('b', 'Sim, o formato é o mesmo do Gemini CLI', false, 'os eventos, o arquivo e o contrato de saída diferem.'),
          opc('c', 'Só com <code>--hooks</code>', false, 'não há essa flag documentada.')] },
      { id: 'g2-block', pergunta: 'Como um hook do Gemini CLI bloqueia uma chamada?',
        opcoes: [
          opc('a', 'Saindo com código 2 (o stderr vira o motivo) ou saindo com 0 e imprimindo JSON com <code>decision: "deny"</code> e <code>reason</code>', true, 'o stdout precisa ser JSON puro: qualquer texto extra quebra a leitura.'),
          opc('b', 'Saindo com 1', false, 'outros códigos que não 0 e 2 viram aviso, a chamada segue.'),
          opc('c', 'Imprimindo "BLOCK" no stdout', false, 'o stdout é interpretado como JSON.')] },
      { id: 'g2-mcp', pergunta: 'Um servidor MCP remoto usava <code>httpUrl</code> no Gemini CLI. Como fica no Antigravity?',
        opcoes: [
          opc('a', '<code>serverUrl</code> em <code>mcp_config.json</code>, e só Streamable HTTP; SSE e <code>httpUrl</code> não são suportados', true, 'a migração troca o arquivo (de <code>~/.gemini/settings.json</code> para <code>mcp_config.json</code>) e o campo.'),
          opc('b', 'Igual: <code>httpUrl</code> em <code>settings.json</code>', false, 'o arquivo de MCP do Antigravity é outro.'),
          opc('c', 'Não há MCP remoto no Antigravity', false, 'há, por Streamable HTTP.')] },
      { id: 'g2-auth', pergunta: 'Um job de CI roda <code>agy -p</code> com <code>GEMINI_API_KEY</code> definida e falha com "authentication required". O que falta?',
        opcoes: [
          opc('a', '<code>"modelProvider": "gemini"</code> em <code>~/.gemini/antigravity-cli/settings.json</code>: a variável sozinha não ativa o modo de chave', true, 'e o <code>.env</code> não é lido.'),
          opc('b', 'Instalar o app desktop no runner', false, 'não é requisito.'),
          opc('c', 'Rodar <code>agy</code> uma vez de forma interativa e reaproveitar o login', false, 'o login interativo usa o chaveiro/navegador; não é um desenho de CI.')] },
      { id: 'g2-saida', pergunta: 'O que significa o código de saída 3 em um <code>agy -p</code>?',
        opcoes: [
          opc('a', 'Estourou o tempo (<code>--print-timeout</code>)', true, 'desde a 1.5.0, sem timeout a execução espera as tarefas de segundo plano.'),
          opc('b', 'Erro de autenticação', false, 'a falta de autenticação tem mensagem própria.'),
          opc('c', 'Limite de turnos do Gemini CLI', false, 'esse é o 53 do Gemini CLI.')] }
    ],
    abas: [
      { rotulo: 'Subagentes, skills, plugins', blocos: [
        { tipo: 'texto', html:
          '<h3>Subagentes</h3>' +
          '<p><strong>Antigravity</strong>: arquivos <code>.agents/agents/&lt;nome&gt;.md</code> ou <code>&lt;nome&gt;/agent.md</code> (global em <code>~/.gemini/config/agents</code>). Frontmatter: <code>name</code>, <code>description</code>, <code>tools[]</code>, <code>mainAgent</code>, <code>subagent</code>, <code>model</code> (<code>inherit</code>, <code>flash</code>, <code>pro</code>), <code>commandExecutionPolicy</code> (<code>off</code>, <code>auto</code>, <code>eager</code>, <code>sandbox</code>), <code>mcpServers</code>, <code>skills</code>, <code>plugins</code>. Embutidos: <code>research</code>, <code>browser</code> (só por <code>/browser</code>) e <code>self</code>. Subagentes <strong>herdam permissões e sandbox</strong> do pai; a profundidade de aninhamento chega a 10. <code>/agents</code> lista; <kbd>Alt</kbd>+<kbd>J</kbd> salta ao que está esperando você. Problema conhecido: um nome de ferramenta digitado errado em <code>tools</code> pode travar o subagente.</p>' +
          '<p><strong>Gemini CLI</strong>: <code>.gemini/agents/*.md</code> com <code>name</code>, <code>description</code>, <code>kind</code>, <code>tools</code>, <code>mcpServers</code>, <code>model</code>, <code>temperature</code>, <code>max_turns</code>, <code>timeout_mins</code>. Embutidos: <code>codebase_investigator</code>, <code>cli_help</code>, <code>generalist</code> e <code>browser_agent</code> (desligado por padrão; exige Chrome 144+). Subagentes <strong>não chamam subagentes</strong>. <code>@agente</code> força o uso de um.</p>' },
        { tipo: 'complete', id: 'g2-complete-agent', titulo: 'Subagente revisor no Antigravity', obrigatorio: false, linguagem: 'markdown',
          enunciado: 'Arquivo <code>.agents/agents/revisor.md</code>: revisor de diff que só lê, usa o modelo rápido e herda o sandbox.',
          partes: [
            '---\nname: revisor\ndescription: Revisa o diff atual e lista bugs, riscos e testes ausentes\ntools: [',
            { lacuna: 'tools', opcoes: ['view_file, run_command', 'read, shell', 'view_file, write_to_file'], correta: 'view_file, run_command' },
            ']\nmodel: ',
            { lacuna: 'model', opcoes: ['flash', 'rapido', 'gemini-flash-latest'], correta: 'flash' },
            '\ncommandExecutionPolicy: ',
            { lacuna: 'cep', opcoes: ['sandbox', 'eager', 'yolo'], correta: 'sandbox' },
            '\n---\nVocê revisa código Python. Leia o diff com `git diff` e aponte correção, tipos e testes que faltam. Não edite arquivos.\n'
          ],
          explicacao: 'Os nomes das ferramentas (<code>view_file</code>, <code>run_command</code>, <code>write_to_file</code>) são os que o Antigravity usa; um nome errado pode travar o subagente, então copie da documentação. <code>model</code> aceita <code>inherit</code>, <code>flash</code> e <code>pro</code>; <code>commandExecutionPolicy: sandbox</code> mantém os comandos no sandbox. Como <code>run_command</code> é amplo, o limite real vem das <code>permissions</code> do <code>agy</code> (aula anterior), que o subagente herda.' },
        { tipo: 'texto', html:
          '<h3>Skills, comandos e plugins</h3>' +
          '<p><strong>Antigravity</strong>: skill em <code>.agents/skills/&lt;nome&gt;/SKILL.md</code> (<code>description</code> obrigatória, <code>name</code> opcional); global em <code>~/.gemini/config/skills</code>; o CLI lê também <code>~/.gemini/skills</code> e <code>~/.gemini/antigravity-cli/skills</code>. Cada skill vira um comando <code>/nome</code>; <code>/skills reload</code> recarrega. Se você tinha skills em <code>.gemini/skills/</code> na workspace, renomeie a pasta para <code>.agents/skills/</code>.</p>' +
          '<p><strong>Gemini CLI</strong>: skills em <code>.gemini/skills</code> ou <code>.agents/skills</code> (o alias vence), usuário em <code>~/.gemini/skills</code> ou <code>~/.agents/skills</code>; <code>gemini skills list|install|link|uninstall|enable|disable</code>; a ferramenta <code>activate_skill</code> pede consentimento. Comandos customizados são TOML em <code>.gemini/commands</code> (<code>prompt</code>, <code>description</code>, <code>{{args}}</code>, <code>!{...}</code> para shell, <code>@{...}</code> para arquivo), com subpastas virando <code>/git:commit</code>; <code>/commands reload</code>. O Antigravity não tem esse formato TOML: os comandos legados viram skills.</p>' +
          '<p><strong>Plugins</strong>: no Antigravity um plugin agrupa skills, MCP, agentes, regras e hooks. <code>agy plugin list|install|import gemini|import claude|validate --strict</code>, <code>/plugin</code>, mercado padrão <code>@antigravity-plugins-official</code>, instalados em <code>.agents/plugins/</code> ou <code>~/.gemini/config/plugins/</code>. <code>agy plugin import gemini</code> converte extensões do Gemini CLI. No Gemini CLI a unidade equivalente é a <em>extensão</em> (<code>gemini extensions install|list|update|enable|disable|link|new|validate</code>, manifesto <code>gemini-extension.json</code>; não instala dentro da sessão interativa), renomeada "plugins do Antigravity" no aviso de transição.</p>' },
        { tipo: 'takeaway', html: 'No Antigravity tudo vive em <mark>.agents/</mark>; o que era <mark>.gemini/</mark> da workspace precisa ser <mark>migrado</mark>.' }
      ] },

      { rotulo: 'Hooks, MCP, sandbox', blocos: [
        { tipo: 'texto', html:
          '<h3>Hooks: dois contratos</h3>' },
        tabela(['', 'Antigravity', 'Gemini CLI'], [
          ['Onde', '<code>.agents/hooks.json</code> ou <code>~/.gemini/config/hooks.json</code> (hooks no settings do CLI <strong>não</strong> carregam)', 'Chave <code>hooks</code> do <code>settings.json</code>; hooks de projeto têm impressão digital para confirmar mudanças'],
          ['Eventos', '<code>SessionStart</code>, <code>PreToolUse</code>, <code>PostToolUse</code>, <code>PreInvocation</code>, <code>PostInvocation</code>, <code>Stop</code>', '<code>SessionStart</code>, <code>SessionEnd</code>, <code>BeforeAgent</code>, <code>AfterAgent</code>, <code>BeforeModel</code>, <code>AfterModel</code>, <code>BeforeToolSelection</code>, <code>BeforeTool</code>, <code>AfterTool</code>, <code>PreCompress</code>, <code>Notification</code>'],
          ['Entrada / saída', 'JSON no stdin; JSON no stdout; manipulador <code>{type:"command", command, timeout}</code> (30 s por padrão)', 'JSON no stdin; stdout <strong>só JSON</strong>'],
          ['Bloquear', 'PreToolUse devolve <code>decision</code> (<code>allow</code>, <code>auto_approve</code>, <code>deny</code>, <code>ask</code>, <code>force_ask</code>, <code>deny_unless_prior_grant</code>) e <code>reason</code>', 'Saída 2 com o motivo no stderr, ou saída 0 com JSON <code>decision: "deny"</code> e <code>reason</code>; outros códigos viram aviso'],
          ['Casamento', 'Regex sobre o nome da ferramenta (<code>run_command</code>, <code>write_to_file</code>, <code>replace_file_content</code>, <code>view_file</code>)', 'Regex para ferramentas'],
          ['Ver', '<code>/hooks</code>', '<code>/hooks</code>']]),
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '#!/usr/bin/env bash',
          '# .agents/hooks/sem-push.sh  (Antigravity, PreToolUse)',
          '# Não dependa de nomes de campo: procure o texto no JSON bruto.',
          'entrada=$(cat)',
          'if echo "$entrada" | grep -q "git push"; then',
          '  echo \'{"decision":"deny","reason":"git push é feito por humano; abra o PR."}\'',
          'else',
          '  echo \'{"decision":"allow"}\'',
          'fi'].join('\n') },
        { tipo: 'texto', html: '<p class="ta-nota">O layout do <code>hooks.json</code> que registra o script (campo do matcher, lista de manipuladores) segue o schema da página de hooks do Antigravity; copie dali em vez de escrever de memória. O contrato de saída acima é o documentado.</p>' },
        { tipo: 'rode', id: 'g2-rode-hook', titulo: 'Testar o hook sem o agente', enunciado: 'Dê ao script a entrada que o agente enviaria e veja a decisão. Exemplo variável: o JSON real tem mais campos.',
          prefixo: '$', entrada: 'echo \'{"tool":"run_command","command":"git push origin main"}\' | .agents/hooks/sem-push.sh', unidade: 's', terminalTitulo: 'teste do hook (exemplo)', etapas: [
            { id: 'push', nome: 'Comando que deve ser bloqueado', descricao: 'entrada com git push', tom: 'tcp', ms: 1, linhas: [
              L('cmd', 'echo \'{"tool":"run_command","command":"git push origin main"}\' | .agents/hooks/sem-push.sh'),
              L('out', '{"decision":"deny","reason":"git push é feito por humano; abra o PR."}')] },
            { id: 'ok', nome: 'Comando que deve passar', descricao: 'controle negativo', tom: 'tls', ms: 1, linhas: [
              L('cmd', 'echo \'{"tool":"run_command","command":"git status"}\' | .agents/hooks/sem-push.sh'),
              L('out', '{"decision":"allow"}')] }
          ],
          prever: { pergunta: 'Esse mesmo script, com o mesmo JSON, serve num hook <code>BeforeTool</code> do Gemini CLI?', opcoes: [
            { id: 'a', texto: 'Serve sem mudança: o contrato é idêntico.', correta: false, porque: 'os eventos têm outros nomes e o arquivo de registro é outro.' },
            { id: 'b', texto: 'A lógica serve; muda o registro (settings.json, evento BeforeTool) e o campo que o script lê, e a saída <code>deny</code> em JSON é aceita (ou o código de saída 2).', correta: true, porque: 'no Gemini CLI, saída 0 com JSON <code>decision: "deny"</code> ou saída 2 bloqueiam; o stdout não pode ter texto extra.' },
            { id: 'c', texto: 'Não serve: o Gemini CLI não tem hooks.', correta: false, porque: 'tem, com onze eventos.' }
          ] },
          tutorDepois: 'Teste sempre o caminho que bloqueia e o que deixa passar. Hook que bloqueia tudo é tão ruim quanto o que não bloqueia nada.' },
        { tipo: 'texto', html:
          '<h3>MCP</h3>' +
          '<p><strong>Antigravity</strong>: <code>~/.gemini/config/mcp_config.json</code> (global) e <code>.agents/mcp_config.json</code> (workspace), raiz <code>mcpServers</code>. Stdio: <code>command</code>, <code>args</code>, <code>env</code>, <code>cwd</code>. Remoto: <code>serverUrl</code> (ou <code>url</code>), <strong>só Streamable HTTP</strong>; SSE e <code>httpUrl</code> não funcionam. Outros campos: <code>headers</code>, <code>authProviderType: "google_credentials"</code>, <code>oauth</code>, <code>disabled</code>, <code>enabledTools</code>, <code>disabledTools</code>, <code>tools.&lt;ferramenta&gt;.eager</code>, <code>timeoutSeconds</code> (180 s por chamada, 300 s para conectar). As ferramentas carregam sob demanda (os esquemas ficam em cache em <code>~/.gemini/antigravity-cli/mcp/</code>). <code>/mcp</code> abre o gerenciador.</p>' +
          '<p><strong>Gemini CLI</strong>: <code>gemini mcp add|remove|list</code> (<code>--transport http</code>, <code>--scope user</code>, <code>--env</code>, <code>--include-tools</code>) e <code>mcpServers</code> no <code>settings.json</code> com <code>command</code>/<code>args</code>/<code>env</code>/<code>cwd</code>, <code>url</code> (SSE), <code>httpUrl</code>, <code>headers</code>, <code>timeout</code>, <code>trust</code>, <code>includeTools</code>, <code>excludeTools</code>; filtros globais <code>mcp.allowed</code> e <code>mcp.excluded</code>.</p>' },
        { tipo: 'complete', id: 'g2-complete-mcp', titulo: 'Mova um MCP do Gemini CLI para o Antigravity', obrigatorio: false, linguagem: 'json',
          enunciado: 'No Gemini CLI o servidor estava em <code>~/.gemini/settings.json</code> com <code>httpUrl</code>. Complete o arquivo do Antigravity.',
          partes: [
            '// ',
            { lacuna: 'arquivo', opcoes: ['.agents/mcp_config.json', '.gemini/settings.json', '.agents/hooks.json'], correta: '.agents/mcp_config.json' },
            '\n{\n  "mcpServers": {\n    "docs": {\n      "',
            { lacuna: 'campo', opcoes: ['serverUrl', 'httpUrl', 'sseUrl'], correta: 'serverUrl' },
            '": "https://mcp.exemplo.dev/mcp",\n      "disabledTools": ["apagar_tudo"],\n      "timeoutSeconds": ',
            { lacuna: 'timeout', opcoes: ['60', '"60s"', '60000'], correta: '60' },
            '\n    }\n  }\n}\n'
          ],
          explicacao: 'O arquivo é o <code>mcp_config.json</code> (aqui o da workspace, versionável), o campo remoto é <code>serverUrl</code> e o tempo é um número em segundos (<code>timeoutSeconds</code>). A URL e o nome <code>docs</code> são fictícios. Não coloque token no arquivo versionado: use <code>headers</code> lidos de ambiente do seu jeito ou <code>oauth</code>.' },
        { tipo: 'callout', tom: 'info', titulo: 'Sandbox do Antigravity', html:
          '<p>O sandbox de terminal (<code>enableTerminalSandbox</code>, <code>--sandbox</code>) bloqueia arquivos sensíveis (<code>~/.ssh</code>, <code>.env</code>) e a rede por padrão. Para o app, o preset padrão é "Default". O modo <code>auto</code> depende dele. No Gemini CLI, o sandbox é <code>-s</code>, <code>GEMINI_SANDBOX</code> ou <code>tools.sandbox</code>.</p>' },
        { tipo: 'takeaway', html: 'Hook do Antigravity <mark>responde em JSON</mark>; o do Gemini CLI também aceita o <mark>código 2</mark>; e MCP remoto do Antigravity é <mark>serverUrl</mark>.' }
      ] },

      { rotulo: 'Headless, CI e custo', blocos: [
        tabela(['', 'Antigravity <code>agy -p</code>', 'Gemini CLI <code>gemini -p</code>'], [
          ['Formato de saída', '<code>--output-format text|json|stream-json</code>; <code>--json-schema</code> para saída estruturada; <code>--input-format stream-json</code>', '<code>--output-format text|json|stream-json</code>; stdin por pipe'],
          ['Continuar', '<code>-c</code> / <code>--conversation ID</code>', '<code>-r latest</code>'],
          ['Controle', '<code>--model</code>, <code>--effort</code>, <code>--agent</code>, <code>--mode</code>, <code>--print-timeout</code>', '<code>--model auto|pro|flash|flash-lite</code>, <code>--approval-mode</code>'],
          ['Códigos de saída', '<code>3</code> = tempo esgotado; sem login: mensagem "authentication required"', '<code>0</code>, <code>1</code>, <code>42</code> (entrada inválida), <code>53</code> (limite de turnos)'],
          ['Outros', '<code>agy acp</code> (servidor do Agent Client Protocol), <code>agy agents</code>, <code>agy models</code>', '<code>gemini update</code>']]),
        { tipo: 'texto', html: '<p>O envelope JSON do <code>agy</code> traz <code>conversation_id</code>, <code>status</code>, <code>response</code>, <code>error</code>, <code>duration_seconds</code>, <code>num_turns</code>, <code>structured_output</code>, <code>usage</code> e <code>finished_reason</code>. Desde a 1.5.0, um <code>-p</code> sem timeout espera as tarefas de segundo plano; com timeout estourado, sai com 3.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# CI (Antigravity): duas partes, ambas obrigatórias',
          '# 1) settings do CLI',
          'mkdir -p ~/.gemini/antigravity-cli',
          'echo \'{"modelProvider":"gemini"}\' > ~/.gemini/antigravity-cli/settings.json',
          '# 2) GEMINI_API_KEY vem dos secrets do job (não de .env)',
          'agy -p "Revise o diff de origin/main" \\',
          '  --mode plan --output-format json --print-timeout 600 > revisao.json',
          'echo "saída: $?"'].join('\n') },
        { tipo: 'cenario', id: 'g2-cenario', titulo: 'O job de CI diz "authentication required"', obrigatorio: false,
          enunciado: 'Seu workflow instalou o <code>agy</code>, exporta <code>GEMINI_API_KEY</code> a partir de um secret e roda <code>agy -p</code>. A primeira execução falha.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O que você tenta primeiro?', opcoes: [
              { texto: 'Criar o <code>settings.json</code> do CLI com <code>"modelProvider":"gemini"</code> antes do <code>agy -p</code>.', vai: 'mode', tom: 'ok', consequencia: 'as duas condições do modo de chave passam a existir; a chave é validada na primeira conversa.' },
              { texto: 'Gravar a chave num <code>.env</code> no repositório.', vai: 'f-env', tom: 'ruim', consequencia: 'o <code>agy</code> não lê <code>.env</code>, e a chave agora está no repositório.' },
              { texto: 'Copiar o login do seu notebook (chaveiro) para o runner.', vai: 'f-copia', tom: 'ruim', consequencia: 'credencial pessoal em máquina compartilhada, e o chaveiro não existe no runner.' }
            ] },
            mode: { texto: 'Agora roda. O PR é de fork e o agente poderia executar comandos. Qual modo e qual saída usar?', opcoes: [
              { texto: '<code>--mode plan</code> (somente análise), <code>--output-format json</code> e <code>--print-timeout</code>; checar o código de saída.', vai: 'f-bom', tom: 'ok', consequencia: 'o job não edita nada, tem limite de tempo e produz uma saída que você consegue validar.' },
              { texto: '<code>--dangerously-skip-permissions</code> para não travar a pipeline.', vai: 'f-skip', tom: 'ruim', consequencia: 'aprova tudo, inclusive o que um diff malicioso pedir.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'CI em modo de plano, com tempo máximo e saída estruturada. A falha de autenticação virou uma configuração versionada.' },
            'f-env': { bom: false, texto: 'A autenticação continua falhando e o segredo vazou no repositório.' },
            'f-copia': { bom: false, texto: 'O runner não tem chaveiro; o job falhou de novo e a credencial pessoal ficou exposta.' },
            'f-skip': { bom: false, texto: 'Um PR de fork fez o agente executar comandos arbitrários com a chave do job no ambiente.' }
          },
          callout: 'Você resolveu a autenticação nas duas partes e restringiu o que o agente pode fazer.' },
        { tipo: 'texto', html:
          '<h3>Modelos, cotas e custo</h3>' +
          '<p><strong>Antigravity</strong> (verificado em 09/11/2026; dados de alto risco, revalide em 30 dias): Gemini 4 Argon nos planos pagos Pro e Ultra; Gemini 3.8 Flash a partir do gratuito; Gemini 3.7 e 3.6 Flash e 3.1 Pro para empresas; Claude Sonnet 5.5 e Opus 5.5 (raciocínio) no Pro sem teste, Ultra e Enterprise. <strong>Claude Sonnet e Opus 4.6 e GPT-OSS 120B serão removidos em 18/11/2026.</strong> Há limites por janela de cinco horas e semanal por grupo de modelos; o plano gratuito renova semanalmente. O excedente usa créditos de IA (<code>useG1Credits</code>, <code>/credits</code>); <code>/usage</code> (ou <code>/quota</code>) mostra o consumo. Não há como trazer sua própria chave para ampliar a cota do plano (o modo de chave de API é um caminho separado). O esforço de raciocínio se ajusta com <code>/effort</code> ou <code>--effort</code>. A página de preços mostra o plano gratuito a US$ 0 e planos empresariais a partir de US$ 30 por assento por mês; os preços de Pro e Ultra não aparecem como texto na página consultada, então <strong>não os afirmo aqui</strong>.</p>' +
          '<p><strong>Gemini CLI</strong>: a conta define o acesso (licença Code Assist, chave de API ou Vertex AI) e o faturamento vem dela. A documentação de modelos ainda cita gerações antigas, o que mostra defasagem em relação ao Antigravity; confirme com <code>/model</code>.</p>' },
        { tipo: 'takeaway', html: 'Em CI: <mark>modelProvider</mark> no settings, chave em <mark>secret</mark>, modo <mark>plan</mark>, tempo máximo e <mark>código de saída</mark> checado.' }
      ] },

      { rotulo: 'Armadilhas e conferir', blocos: [
        { tipo: 'texto', html: '<h3>Tabela de diagnóstico</h3>' },
        tabela(['Sintoma', 'Causa provável', 'Conserto'], [
          ['Hooks no settings do <code>agy</code> não rodam', 'O Antigravity só lê <code>hooks.json</code>', 'Mover para <code>.agents/hooks.json</code>'],
          ['Hook do Gemini CLI parece ignorado', 'Texto extra no stdout quebra o JSON', 'Imprimir só JSON; logs em stderr'],
          ['Regra de projeto não é carregada no <code>agy</code>', 'Subpasta, ou frontmatter inválido em <code>.agents/rules/</code>', 'Pôr na raiz ou corrigir o <code>trigger</code>'],
          ['Subagente trava', 'Nome de ferramenta digitado errado em <code>tools</code>', 'Copiar o nome da documentação'],
          ['MCP remoto não conecta no <code>agy</code>', 'Campo <code>httpUrl</code> ou servidor só SSE', 'Usar <code>serverUrl</code> com Streamable HTTP'],
          ['Política de workspace do Gemini CLI não atua', 'Camada reportada como não funcional (issue 18186)', 'Usar política de usuário ou de admin'],
          ['Modo <code>auto</code> indisponível', 'Conta business/enterprise ou sandbox desligado', 'Usar <code>accept-edits</code> ou ligar o sandbox'],
          ['Skills antigas sumiram', 'Moradia antiga <code>.gemini/skills/</code> na workspace', 'Renomear para <code>.agents/skills/</code>'],
          ['Modelo some do seletor', 'Remoção programada em 18/11/2026', 'Migrar para Sonnet 5.5, Opus 5.5 ou Gemini']]),
        { tipo: 'escolha', id: 'g2-esc-hook', titulo: 'Confira: hook que não bloqueia',
          pergunta: 'Seu hook do Gemini CLI imprime "Bloqueado: git push" com <code>echo</code> e sai com 0. O push acontece. Por quê?',
          opcoes: [
            { id: 'a', texto: 'Saída 0 faz o stdout ser lido como JSON, e o texto solto não é uma decisão; para bloquear, saia com 2 (motivo no stderr) ou imprima JSON com <code>decision: "deny"</code>.', correta: true, porque: 'o contrato do Gemini CLI: 0 interpreta JSON, 2 bloqueia, outros códigos viram aviso.' },
            { id: 'b', texto: 'Hooks do Gemini CLI só observam; nunca bloqueiam.', correta: false, porque: 'bloqueiam, pelo contrato descrito.' },
            { id: 'c', texto: 'O hook precisa estar em <code>.agents/hooks.json</code>.', correta: false, porque: 'esse é o arquivo do Antigravity.' },
            { id: 'd', texto: 'Falta ligar <code>--approval-mode yolo</code>.', correta: false, porque: 'o modo <code>yolo</code> aprova tudo, o contrário do que você quer.' }
          ], tutorDepois: 'Sem JSON válido ou código 2, o hook é só um aviso.' },
        { tipo: 'escolha', id: 'g2-esc-migra', titulo: 'Confira: migração do Gemini CLI para o Antigravity',
          pergunta: 'Você migra um projeto do Gemini CLI para o <code>agy</code>. Qual conjunto de ações cobre o que quebra por padrão?',
          opcoes: [
            { id: 'a', texto: 'Manter <code>GEMINI.md</code>/<code>AGENTS.md</code> (continuam valendo), mover MCP de <code>~/.gemini/settings.json</code> para <code>mcp_config.json</code> trocando <code>url</code>/<code>httpUrl</code> por <code>serverUrl</code>, mover hooks para <code>hooks.json</code>, renomear <code>.gemini/skills</code> para <code>.agents/skills</code> e converter extensões com <code>agy plugin import gemini</code>.', correta: true, porque: 'cada item corresponde a um arquivo ou campo que mudou, conforme a página de migração e as de hooks, MCP e skills.' },
            { id: 'b', texto: 'Nada: o <code>agy</code> lê a mesma configuração do Gemini CLI.', correta: false, porque: 'os arquivos de MCP, hooks e skills são outros.' },
            { id: 'c', texto: 'Apagar o <code>GEMINI.md</code>, porque o Antigravity só lê <code>AGENTS.md</code>.', correta: false, porque: 'os dois nomes valem.' },
            { id: 'd', texto: 'Copiar o <code>settings.json</code> do Gemini CLI para <code>~/.gemini/antigravity-cli/</code>.', correta: false, porque: 'os esquemas diferem; hooks e MCP daquele arquivo não são carregados.' }
          ], tutorDepois: 'A migração é por arquivo: instruções ficam, o resto muda de lugar.' },
        { tipo: 'texto', html: '<h3>Equivalente nas outras ferramentas</h3>' },
        tabela(['Recurso', 'Antigravity CLI', 'Gemini CLI', 'OpenCode V2', 'Claude Code'], [
          ['Subagentes', '<code>.agents/agents/*.md</code>', '<code>.gemini/agents/*.md</code>', '<code>.opencode/agents/*.md</code>', '<code>.claude/agents/</code>'],
          ['Skills', '<code>.agents/skills/</code>', '<code>.gemini/skills</code> ou <code>.agents/skills</code>', '<code>.opencode/skills/</code>', '<code>.claude/skills/</code>'],
          ['Hooks', '<code>.agents/hooks.json</code>, saída JSON', '<code>settings.json</code>, saída 2 ou JSON', 'política; hook de permissão em plugin', 'hooks em settings'],
          ['MCP', '<code>mcp_config.json</code>, <code>serverUrl</code>', '<code>mcpServers</code> no settings', '<code>mcp.servers</code>', 'servidores MCP'],
          ['Não interativo', '<code>agy -p</code>, saída 3 = tempo', '<code>gemini -p</code>, 42 e 53', '<code>opencode run</code>', '<code>claude -p</code>']]),
        { tipo: 'texto', html: '<p class="ta-nota">Colunas Antigravity, Gemini CLI e OpenCode: 09/11/2026. A coluna Claude Code vem de outras aulas do curso (12/10/2026) e não foi revalidada.</p>' },
        { tipo: 'takeaway', html: 'Na migração, <mark>instruções ficam</mark> e <mark>MCP, hooks, skills e plugins</mark> mudam de arquivo e de campo.' }
      ] }
    ]
  });
})();
