/* Ferramentas · Gemini CLI e Antigravity 1. Fatos verificados em 09/11/2026 (geminicli.com, antigravity.google, blog Google Developers de 19/05/2026). Fontes: ferramentas/fontes/gemini.md */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tabela(cab, linhas) {
    return { tipo: 'texto', largo: true, html: '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' };
  }

  TrilhaAula.registrar({
    id: 'fer-gemini-1',
    titulo: 'Gemini CLI e Antigravity do zero ao dia a dia',
    minutos: 35,
    resumo: 'A Google tem hoje duas famílias: o Gemini CLI (código aberto, agora voltado a licenças pagas e empresariais) e o Antigravity (app, CLI agy, IDE e extensões), que substituiu o Gemini CLI para usuários individuais em 18/06/2026. Esta aula separa o que é de cada um e ensina o dia a dia nos dois.',
    objetivo: 'Escolher entre Gemini CLI e Antigravity CLI conforme a conta, instalar e autenticar, escrever as instruções do projeto respeitando as regras de carregamento de cada um, configurar permissões e modos e conduzir um fluxo plano, execução e revisão.',
    revisao: [
      { id: 'g1-conta', pergunta: 'Uma pessoa com conta Google pessoal (plano gratuito ou Google AI Pro) quer um agente de terminal da Google. Qual ferramenta atende?',
        opcoes: [
          opc('a', 'Antigravity CLI (<code>agy</code>): o Gemini CLI deixou de atender esses planos em 18/06/2026', true, 'o Gemini CLI segue para licenças Code Assist Standard/Enterprise, Code Assist para GitHub e chaves pagas de API ou Vertex.'),
          opc('b', 'Gemini CLI, como sempre', false, 'a documentação mostra o aviso de substituição para usuários sem plano pago e do Google One.'),
          opc('c', 'Nenhuma: a Google descontinuou os agentes de terminal', false, 'o Antigravity CLI existe desde 19/05/2026.')] },
      { id: 'g1-modo', pergunta: 'No <code>agy</code> em modo padrão, o que acontece quando o agente quer editar um arquivo do projeto?',
        opcoes: [
          opc('a', 'Ele pausa e mostra o diff para você aceitar ou recusar', true, 'o modo padrão pede revisão de edições e de comandos; <code>accept-edits</code> aprova só edições na workspace.'),
          opc('b', 'Edita direto, como o build do OpenCode', false, 'o padrão do <code>agy</code> é <code>request-review</code>.'),
          opc('c', 'Edita num sandbox e descarta tudo', false, 'o sandbox de terminal vem desligado por padrão.')] },
      { id: 'g1-regras', pergunta: 'No Antigravity, um <code>AGENTS.md</code> existe só em <code>backend/</code> dentro do repositório. O agente aberto na raiz o carrega?',
        opcoes: [
          opc('a', 'Não: ele busca na workspace e nos pais até a raiz do repositório, e não desce a subpastas', true, 'regras de pastas filhas não são carregadas; coloque o essencial na raiz ou em <code>.agents/rules/</code>.'),
          opc('b', 'Sim, o Antigravity varre toda a árvore', false, 'esse é o carregamento sob demanda do Gemini CLI, não do Antigravity.'),
          opc('c', 'Só se o arquivo se chamar <code>GEMINI.md</code>', false, 'os dois nomes valem, na mesma regra de busca.')] },
      { id: 'g1-prec', pergunta: 'No <code>agy</code>, uma regra <code>allow</code> e uma <code>deny</code> casam o mesmo comando. O que vale?',
        opcoes: [
          opc('a', 'O <code>deny</code>: a precedência é Deny, depois Ask, depois Allow', true, 'diferente do OpenCode, a ordem das linhas não decide.'),
          opc('b', 'A última escrita', false, 'isso é o OpenCode.'),
          opc('c', 'A primeira escrita', false, 'a ordem das linhas não decide no Antigravity.')] },
      { id: 'g1-ws', pergunta: 'Você criou <code>.gemini/policies/regras.toml</code> no repositório para o Gemini CLI. Ele passa a valer?',
        opcoes: [
          opc('a', 'Não confie: a camada de workspace das políticas é reportada como não funcional (issue 18186); use a de usuário ou admin', true, 'verificado na documentação em 09/11/2026; revalide, pode ter sido corrigido.'),
          opc('b', 'Sim, a camada de workspace tem prioridade sobre a de usuário', false, 'a prioridade existe no papel (Workspace 3 abaixo de User 4), mas o carregamento falha.'),
          opc('c', 'Só se você usar <code>--allowed-tools</code>', false, 'esse parâmetro está obsoleto.')] }
    ],
    abas: [
      { rotulo: 'Qual Google, qual ferramenta', blocos: [
        { tipo: 'texto', html:
          '<p>Em 19/05/2026 a Google publicou o aviso "Transitioning Gemini CLI to Antigravity CLI". Em <strong>18/06/2026</strong>, o Gemini CLI e as extensões Code Assist para IDE deixaram de atender usuários individuais gratuitos e dos planos Google AI Pro e Ultra. O Gemini CLI continua para licenças Gemini Code Assist Standard e Enterprise, Code Assist para GitHub e chaves pagas de API ou Vertex. O README do repositório diz ainda que o Gemini CLI não é ajustado para o Gemini 4 em diante (use o Antigravity). Por isso esta trilha trata os dois, deixando claro de quem é cada coisa.</p>' },
        tabela(['Peça', 'O que é', 'Estado em 09/11/2026'], [
          ['Gemini CLI', 'Agente de terminal, código aberto (Apache-2.0), <code>@google/gemini-cli</code>', 'Versão 0.67.0; lançamentos semanais; para licenças empresariais e chaves pagas'],
          ['Antigravity CLI (<code>agy</code>)', 'Agente de terminal em Go, mesmo motor do app', 'Versão 1.5.1; disponível para todos desde 19/05/2026'],
          ['Antigravity App', 'Aplicativo desktop do agente (Antigravity 2.0)', 'Versão 2.29.1'],
          ['Antigravity IDE', 'IDE independente', 'Login empresarial não funciona nesta superfície'],
          ['Extensões de IDE', 'VS Code, JetBrains, Visual Studio, Zed, Xcode, Eclipse', 'Substituem as extensões Code Assist'],
          ['Antigravity SDK', 'Biblioteca Python <code>google-antigravity</code> (Python 3.10+)', 'Para construir agentes próprios']]),
        { tipo: 'callout', tom: 'info', titulo: 'Como ler o resto da trilha', html:
          '<p>Cada afirmação está marcada como <strong>Gemini CLI</strong> ou <strong>Antigravity</strong>. Os nomes se parecem (pasta <code>~/.gemini</code> nos dois, <code>GEMINI.md</code> nos dois) e os comportamentos divergem: o Gemini CLI guarda a configuração em <code>~/.gemini/settings.json</code>, o <code>agy</code> em <code>~/.gemini/antigravity-cli/settings.json</code>. O Antigravity ensina o caminho de migração em <code>antigravity.google/docs/cli/gcli-migration</code>. O Brasil consta na lista de países atendidos; menores de 18 anos não.</p>' },
        { tipo: 'escolha', id: 'g1-esc-conta', titulo: 'Qual ferramenta para qual conta?', obrigatorio: false,
          pergunta: 'Sua empresa paga licenças Gemini Code Assist Enterprise para o time e você quer um agente de terminal aberto e auditável. Qual caminho está dentro do suportado?',
          opcoes: [
            { id: 'a', texto: 'Gemini CLI com a licença Code Assist, ou Antigravity CLI com o login empresarial (Continue with Google Cloud).', correta: true, porque: 'a licença empresarial continua atendida pelo Gemini CLI, e o Antigravity aceita login empresarial no app, na CLI e nas extensões (não na IDE independente).' },
            { id: 'b', texto: 'Só o Gemini CLI, porque o Antigravity não aceita contas empresariais.', correta: false, porque: 'aceita, com restrições (por exemplo, o modo <code>auto</code> não vale para contas business e enterprise).' },
            { id: 'c', texto: 'Só o Antigravity IDE, com login empresarial.', correta: false, porque: 'o login empresarial não funciona na IDE independente.' }
          ], tutorDepois: 'A pergunta certa é qual licença paga, não qual produto parece mais novo.' },
        { tipo: 'takeaway', html: '<mark>Gemini CLI</mark> é para licenças empresariais e chaves pagas; para o restante do mundo, o agente de terminal da Google é o <mark>Antigravity CLI (agy)</mark>.' }
      ] },

      { rotulo: 'Instalar e primeiro uso', blocos: [
        { tipo: 'texto', html: '<h3>Antigravity CLI</h3><p>O instalador coloca o binário em <code>~/.local/bin/agy</code>. As flags <code>--skip-aliases</code> e <code>--skip-path</code> evitam alterações no shell.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# macOS / Linux',
          'curl -fsSL https://antigravity.google/cli/install.sh | bash',
          'agy --version',
          '',
          '# Windows (PowerShell)',
          'irm https://antigravity.google/cli/install.ps1 | iex'].join('\n') },
        { tipo: 'texto', html:
          '<p>Na primeira execução, o <code>agy</code> pergunta o esquema de cores, o modo de renderização (tela alternativa ou em linha) e se você confia na workspace. O login é compartilhado entre as superfícies: tenta o chaveiro do sistema e depois o navegador; por SSH imprime uma URL e aceita o código colado. <code>/logout</code> sai.</p>' +
          '<h3>Modo de chave de API no agy: duas condições</h3>' +
          '<p>Só a variável <code>GEMINI_API_KEY</code> <strong>não</strong> ativa o modo: também é preciso <code>"modelProvider": "gemini"</code> em <code>~/.gemini/antigravity-cli/settings.json</code>. Arquivos <code>.env</code> não são lidos, e a chave só é validada na primeira conversa. Para credenciais padrão de aplicativo (ADC), <code>AGY_ADC_AUTH=true</code>.</p>' +
          '<h3>Gemini CLI</h3>' },
        { tipo: 'abas', rotulo: 'Escolha o seu caminho', itens: [
          { rotulo: 'Gemini CLI', blocos: [
            { tipo: 'codigo', linguagem: 'bash', texto: [
              '# requer Node 20+',
              'npm install -g @google/gemini-cli',
              '# ou: brew install gemini-cli   |   npx @google/gemini-cli',
              'gemini',
              '',
              '# autenticação: login Google (org: GOOGLE_CLOUD_PROJECT),',
              '# GEMINI_API_KEY, ou Vertex AI (GOOGLE_API_KEY + GOOGLE_GENAI_USE_VERTEXAI,',
              '# ou ADC com GOOGLE_CLOUD_PROJECT e GOOGLE_CLOUD_LOCATION)'].join('\n') },
            { tipo: 'texto', html: '<p>Configuração: <code>~/.gemini/settings.json</code> (usuário), <code>.gemini/settings.json</code> (projeto), <code>/etc/gemini-cli/settings.json</code> (sistema). Atualização: <code>gemini update</code>. Modelos pelo <code>--model</code>: <code>auto</code>, <code>pro</code>, <code>flash</code>, <code>flash-lite</code>; a página de modelos da documentação lembra gerações antigas, então confirme o que sua conta oferece com <code>/model</code>.</p>' }
          ] },
          { rotulo: 'Antigravity CLI', blocos: [
            { tipo: 'texto', html: '<p>O que muda na prática ao entrar: modelos disponíveis dependem do plano (Gemini 3.8 Flash no gratuito; Gemini 4 e os modelos Claude de terceiros nos planos pagos), e as cotas são por janela de cinco horas e semanal por grupo de modelos. Detalhes de modelo e custo na aula 2.</p>' }
          ] }
        ] },
        { tipo: 'rode', id: 'g1-rode', titulo: 'Primeira edição no agy em modo padrão', enunciado: 'Sessão simulada (exemplo variável: o texto do agente muda a cada execução). Observe o que acontece antes da escrita no arquivo.',
          prefixo: '$', entrada: 'agy', unidade: 's', terminalTitulo: 'agy (exemplo)', etapas: [
            { id: 'pedir', nome: 'Pedir a mudança', descricao: 'modo default, com @ para o arquivo', tom: 'request', ms: 1, linhas: [
              L('cmd', 'agy'),
              L('in', 'Corrija o arredondamento em @src/precos.py'),
              L('info', 'Vou editar src/precos.py')] },
            { id: 'rev', nome: 'Pausa para revisão', descricao: 'o diff espera uma decisão sua', tom: 'tls', ms: 1, linhas: [
              L('out', '--- src/precos.py'),
              L('out', '+++ src/precos.py'),
              L('out', '-    return round(valor, 2)'),
              L('out', '+    return valor.quantize(Decimal("0.01"), ROUND_HALF_EVEN)'),
              L('hint', 'Accept this file edit?  1) Yes  2) No')] }
          ],
          prever: { pergunta: 'Sem nenhuma configuração sua, o que o <code>agy</code> faz antes de gravar a alteração?', opcoes: [
            { id: 'a', texto: 'Grava e mostra o diff depois.', correta: false, porque: 'esse é o comportamento permissivo do OpenCode V2 (aula anterior).' },
            { id: 'b', texto: 'Pausa e mostra o diff para você aceitar.', correta: true, porque: 'o modo padrão é <code>request-review</code>: edições de arquivo e comandos pedem decisão. O <code>accept-edits</code> libera só edições dentro da workspace.' },
            { id: 'c', texto: 'Grava dentro de um sandbox isolado e só depois copia.', correta: false, porque: '<code>enableTerminalSandbox</code> vem <code>false</code> por padrão.' }
          ] },
          tutorDepois: 'O padrão do Antigravity é perguntar, o oposto do OpenCode V2. Para trabalhar com menos interrupções sem abrir mão do controle, use <code>accept-edits</code> ou regras de permissão.' },
        { tipo: 'takeaway', html: 'O <mark>agy</mark> pergunta por padrão e a chave de API exige <mark>duas</mark> coisas: <mark>modelProvider</mark> no settings e a variável.' }
      ] },

      { rotulo: 'Instruções, permissões e modos', blocos: [
        { tipo: 'texto', html:
          '<h3>Instruções: regras de carregamento diferentes</h3>' },
        tabela(['', 'Gemini CLI', 'Antigravity'], [
          ['Arquivos', '<code>GEMINI.md</code> global em <code>~/.gemini/</code>, o da workspace e dos pais, e <strong>varredura por diretório</strong> quando o agente trabalha numa pasta', '<code>AGENTS.md</code> ou <code>GEMINI.md</code> na workspace e nos pais até a raiz do repositório; <code>.agents/AGENTS.md</code>; <code>.agents/rules/*.md</code>. <strong>Não desce</strong> a subpastas'],
          ['Nome alternativo', '<code>context.fileName: ["AGENTS.md", "GEMINI.md"]</code> em <code>settings.json</code>', 'Os dois nomes já valem'],
          ['Importar', '<code>@arquivo.md</code> dentro do arquivo', '<code>@[rótulo](caminho)</code>'],
          ['Ver o que carregou', '<code>/memory show</code>, <code>/memory reload</code>', 'Verifique a lista de regras na interface'],
          ['Limites', 'Não há tamanho documentado na página consultada', '24.000 bytes por arquivo e orçamento agregado de 20.000 tokens'],
          ['Regras condicionais', 'Não há equivalente documentado', 'Frontmatter em <code>.agents/rules/*.md</code>: <code>trigger</code> (<code>always_on</code>, <code>model_decision</code>, <code>glob</code>, <code>manual</code>), <code>description</code>, <code>globs</code>']]),
        { tipo: 'callout', tom: 'danger', titulo: 'Regra sem frontmatter válido some em silêncio', html:
          '<p>No Antigravity, um arquivo em <code>.agents/rules/</code> com frontmatter ausente ou inválido é descartado sem aviso, e a varredura é plana (sem subpastas). Se uma regra "não funciona", verifique primeiro o <code>trigger</code> e o caminho.</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          '---',
          'trigger: glob',
          'description: Convenções de migrations',
          'globs: ["migrations/**"]',
          '---',
          'Migrations só avançam: nunca edite uma já aplicada; crie a seguinte.'].join('\n') },
        { tipo: 'texto', html:
          '<h3>Modos de aprovação</h3>' +
          '<p><strong>Antigravity</strong>: <code>--mode</code> ou <kbd>Shift</kbd>+<kbd>Tab</kbd> percorre <code>default</code>, <code>accept-edits</code>, <code>auto</code> e <code>plan</code>. O <code>auto</code> (macOS e Linux desde a 1.3.5; Windows desde a 1.4.4) exige o sandbox de terminal e não vale para contas business e enterprise: executa comandos no sandbox e avalia automaticamente os de fora. <code>--sandbox</code> liga o isolamento do sistema (sandbox-exec no macOS, namespaces no Linux). <code>--dangerously-skip-permissions</code> aprova tudo.</p>' +
          '<p><strong>Gemini CLI</strong>: <code>--approval-mode</code> com <code>default</code>, <code>auto_edit</code>, <code>yolo</code> e <code>plan</code>; <kbd>Shift</kbd>+<kbd>Tab</kbd> percorre default, auto-edit e plan; <code>/plan [objetivo]</code> grava o plano em Markdown em <code>~/.gemini/tmp/&lt;projeto&gt;/&lt;sessão&gt;/plans</code> e <kbd>Ctrl</kbd>+<kbd>X</kbd> o edita. O <code>yolo</code> só existe pela linha de comando. Pontos de segurança desligados por padrão: checkpoints (<code>general.checkpointing.enabled</code> e <code>/restore</code>) e pastas confiáveis (<code>security.folderTrust.enabled</code>); <code>/rewind</code> ou <kbd>Esc</kbd> <kbd>Esc</kbd> desfazem a conversa.</p>' +
          '<h3>Permissões</h3>' +
          '<p><strong>Antigravity</strong>: <code>permissions</code> com <code>allow</code>, <code>ask</code> e <code>deny</code> no settings do CLI. Cada item é <code>ação(alvo)</code>; ações: <code>read_file</code>, <code>write_file</code>, <code>read_url</code>, <code>execute_url</code>, <code>command</code> (prefixo ou <code>regex:</code>), <code>mcp</code> e <code>unsandboxed</code> (só business). Precedência <strong>Deny, Ask, Allow</strong>; escrever implica ler; a workspace é permitida. Construções complexas de shell (<code>$()</code>, crases) forçam correspondência exata.</p>' },
        { tipo: 'complete', id: 'g1-complete-perm', titulo: 'Complete o permissions do agy', obrigatorio: false, linguagem: 'json',
          enunciado: 'Queremos liberar <code>git</code> e os scripts <code>npm run build|lint|test</code>, perguntar antes de baixar URL e negar <code>rm -rf</code> e escrita em <code>.git/</code>. Arquivo <code>~/.gemini/antigravity-cli/settings.json</code>.',
          partes: [
            '{\n  "permissions": {\n    "allow": [\n      "command(git)",\n      "command(',
            { lacuna: 'regex', opcoes: ['regex:npm run (build|lint|test)', 'npm run *', 'glob:npm run build'], correta: 'regex:npm run (build|lint|test)' },
            ')"\n    ],\n    "ask": [ "',
            { lacuna: 'ask', opcoes: ['read_url', 'command', 'unsandboxed'], correta: 'read_url' },
            '(*)" ],\n    "',
            { lacuna: 'deny', opcoes: ['deny', 'block', 'forbid'], correta: 'deny' },
            '": [\n      "command(rm -rf)",\n      "write_file(.git/)"\n    ]\n  }\n}\n'
          ],
          explicacao: 'Comandos aceitam prefixo ou <code>regex:</code>; não há curinga com asterisco para comandos nem prefixo <code>glob:</code>. As três listas são <code>allow</code>, <code>ask</code> e <code>deny</code>. Como o <code>deny</code> vence, a ordem do arquivo não importa. Confirme o formato de <code>read_url</code> no schema (<code>antigravity.google/schemas/v1/settings.json</code>) da sua versão.' },
        { tipo: 'texto', html:
          '<p><strong>Gemini CLI</strong>: o motor de políticas lê <code>~/.gemini/policies/*.toml</code> com blocos <code>[[rule]]</code> (<code>toolName</code>, <code>commandPrefix</code>, <code>argsPattern</code>, <code>decision</code> = <code>allow</code>, <code>deny</code> ou <code>ask_user</code>, <code>priority</code> de 0 a 999). Camadas: padrão 1, extensão 2, workspace 3, usuário 4, admin 5. A camada de <strong>workspace</strong> (<code>.gemini/policies</code>) é reportada como não funcional (issue 18186). <code>--allowed-tools</code> e <code>tools.exclude</code> estão obsoletos. Sandbox: <code>-s</code>, <code>GEMINI_SANDBOX</code> ou <code>tools.sandbox</code>.</p>' },
        { tipo: 'codigo', linguagem: 'toml', texto: [
          '# ~/.gemini/policies/seguro.toml  (Gemini CLI)',
          '[[rule]]',
          'toolName = "run_shell_command"',
          'commandPrefix = "git push"',
          'decision = "deny"',
          'priority = 900'].join('\n') },
        { tipo: 'texto', html: '<p class="ta-nota">O nome da ferramenta de shell (<code>run_shell_command</code>) vem do uso comum na documentação do Gemini CLI; confira com <code>/tools</code> na sua versão antes de depender dele.</p>' },
        { tipo: 'ordene', id: 'g1-ordene', titulo: 'Ordene uma tarefa no Antigravity', obrigatorio: false,
          enunciado: 'Ponha o fluxo na ordem.',
          itens: [
            { id: 'plan', texto: 'Entrar em <code>/plan</code> e pedir o plano' },
            { id: 'rev', texto: 'Revisar o artefato do plano (<kbd>Ctrl</kbd>+<kbd>R</kbd>) e ajustar' },
            { id: 'exe', texto: 'Sair do plano e pedir a execução, aceitando os diffs' },
            { id: 'diff', texto: 'Rodar <code>/diff</code> e a verificação do projeto' },
            { id: 'commit', texto: 'Commitar' }
          ], solucao: ['plan', 'rev', 'exe', 'diff', 'commit'],
          dica: 'A revisão do plano vem antes de qualquer execução.',
          tutorDepois: 'Plano, revisão do artefato, execução com diffs aceitos, verificação e commit.' },
        { tipo: 'takeaway', html: 'No Antigravity a precedência é <mark>Deny, Ask, Allow</mark> e a regra de subpasta <mark>não carrega</mark>; no Gemini CLI a pasta <mark>carrega sob demanda</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'transcript', id: 'g1-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'sessão agy (exemplo)',
          enunciado: 'Uma das afirmações do agente não é sustentada pelo que a ferramenta mostrou. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Corrija o desconto e garanta que todos os testes passam.' },
            { quem: 'agente', texto: 'Editei src/desconto.py e vou rodar a suíte.' },
            { quem: 'ferramenta', texto: '$ uv run pytest -q\n17 passed, 1 skipped in 0.42s' },
            { quem: 'agente', texto: 'Todos os 18 testes passam.' },
            { quem: 'voce', texto: 'Quem é o teste ignorado?' }
          ],
          erradas: [3],
          explicacao: { 3: 'o log mostra 17 aprovados e 1 ignorado: o agente somou o ignorado como aprovado. Um teste ignorado não prova nada; pergunte por que foi ignorado antes de aceitar.' },
          tutorDepois: 'Leia o resumo da ferramenta, não o do agente.' },
        { tipo: 'escolha', id: 'g1-esc-regras', titulo: 'Confira: regras em subpasta',
          pergunta: 'Seu monorepo tem <code>AGENTS.md</code> na raiz e outro em <code>backend/</code> com as convenções de Python. No Antigravity aberto na raiz, o agente ignora as convenções de <code>backend/</code>. O que fazer?',
          opcoes: [
            { id: 'a', texto: 'Mover o essencial para a raiz, ou criar uma regra <code>trigger: glob</code> em <code>.agents/rules/</code> com <code>globs: ["backend/**"]</code>.', correta: true, porque: 'o Antigravity não carrega regras de subpastas; a regra com glob dispara quando o agente toca esses arquivos.' },
            { id: 'b', texto: 'Renomear para <code>GEMINI.md</code>.', correta: false, porque: 'os dois nomes têm a mesma regra de busca.' },
            { id: 'c', texto: 'Aumentar o limite de 24.000 bytes.', correta: false, porque: 'o problema é onde o arquivo está, não o tamanho.' },
            { id: 'd', texto: 'Mudar para Gemini CLI, que sempre carrega tudo.', correta: false, porque: 'o Gemini CLI carrega a pasta sob demanda, não "tudo"; trocar de produto por isso é desproporcional.' }
          ], tutorDepois: 'Conheça a regra de busca da ferramenta antes de espalhar arquivos.' },
        { tipo: 'escolha', id: 'g1-esc-prec', titulo: 'Confira: precedência',
          pergunta: 'No <code>agy</code>, <code>allow</code> tem <code>command(git)</code> e <code>deny</code> tem <code>command(git push)</code>. O agente roda <code>git push origin main</code>. Resultado?',
          opcoes: [
            { id: 'a', texto: 'Negado: o <code>deny</code> tem precedência sobre o <code>allow</code>.', correta: true, porque: 'precedência Deny, Ask, Allow, independente da ordem.' },
            { id: 'b', texto: 'Permitido: <code>command(git)</code> cobre qualquer subcomando.', correta: false, porque: 'o prefixo mais amplo não vence o deny.' },
            { id: 'c', texto: 'Pergunta ao usuário, porque as regras se contradizem.', correta: false, porque: 'contradição se resolve pela precedência, não por pergunta.' },
            { id: 'd', texto: 'Depende da ordem em que as linhas aparecem.', correta: false, porque: 'no OpenCode depende; no Antigravity não.' }
          ], tutorDepois: 'Ferramentas diferentes resolvem conflito de formas diferentes: leia a regra de cada uma.' },
        { tipo: 'texto', html: '<h3>Equivalente nas outras ferramentas</h3>' },
        tabela(['Recurso', 'Antigravity CLI', 'Gemini CLI', 'OpenCode V2', 'Claude Code'], [
          ['Instruções', '<code>AGENTS.md</code> / <code>GEMINI.md</code>, sem subpastas', '<code>GEMINI.md</code> com varredura por pasta', '<code>AGENTS.md</code>', '<code>CLAUDE.md</code>'],
          ['Padrão de aprovação', 'pergunta', 'pergunta', 'permite', 'pergunta'],
          ['Conflito de regras', 'Deny, Ask, Allow', 'prioridade numérica por camada', 'última que casa', 'conforme as regras do Claude Code'],
          ['Modo de plano', '<code>/plan</code>, <kbd>Shift</kbd>+<kbd>Tab</kbd>', '<code>/plan</code>, <kbd>Shift</kbd>+<kbd>Tab</kbd>', 'agente <code>plan</code>', 'plan mode'],
          ['Não interativo', '<code>agy -p</code>', '<code>gemini -p</code>', '<code>opencode run</code>', '<code>claude -p</code>']]),
        { tipo: 'texto', html: '<p class="ta-nota">Colunas Antigravity, Gemini CLI e OpenCode: 09/11/2026. A coluna Claude Code vem de outras aulas do curso (12/10/2026) e não foi revalidada.</p>' },
        { tipo: 'takeaway', html: 'Dois produtos com <mark>nomes parecidos</mark> e <mark>regras diferentes</mark>: sempre diga qual deles você está configurando.' }
      ] }
    ]
  });
})();
