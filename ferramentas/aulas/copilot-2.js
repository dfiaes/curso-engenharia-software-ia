/* Ferramentas · GitHub Copilot 2. Fatos verificados em 09/11/2026 em docs.github.com e code.visualstudio.com; tabela em ferramentas/fontes/copilot.md. Preços, créditos, modelos e recursos em prévia expiram em 30 dias. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tabela(cab, linhas) {
    return { tipo: 'texto', largo: true, html: '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' };
  }

  TrilhaAula.registrar({
    id: 'fer-copilot-2',
    titulo: 'GitHub Copilot avançado',
    minutos: 45,
    resumo: 'Agentes customizados, skills e subagentes; hooks e MCP em cada superfície; o agente de nuvem com copilot-setup-steps.yml; copilot -p e autopilot sem tela; e as armadilhas de aprovação, créditos e prévias.',
    objetivo: 'Definir um agente customizado e um hook de bloqueio, configurar MCP no lugar certo de cada superfície, preparar o ambiente do agente de nuvem, rodar o CLI sem tela com permissões estreitas e decidir quando o autopilot é seguro.',
    revisao: [
      { id: 'cop2-agent', pergunta: 'Onde fica um agente customizado de repositório e qual campo do frontmatter é obrigatório?',
        opcoes: [
          opc('a', '<code>.github/agents/NOME.agent.md</code>; <code>description</code> é obrigatório', true, 'sem <code>tools</code>, o agente tem acesso a todas as ferramentas disponíveis; o corpo pode ter até 30.000 caracteres.'),
          opc('b', '<code>.copilot/agents.json</code>; <code>name</code> é obrigatório', false, 'esse caminho não existe na documentação.'),
          opc('c', '<code>AGENTS.md</code>, numa seção por agente', false, 'o <code>AGENTS.md</code> é instrução, não define agentes.')] },
      { id: 'cop2-failclosed', pergunta: 'Um hook <code>preToolUse</code> do Copilot imprime <code>{"permissionDecision":"allow"}</code> e sai com código 1. O que acontece com a ferramenta?',
        opcoes: [
          opc('a', 'É negada: crash ou saída não zero de um <code>preToolUse</code> de comando nega a chamada, mesmo com allow no stdout', true, 'já o <em>timeout</em> do hook é fail-open: a chamada segue o fluxo normal de permissão.'),
          opc('b', 'Roda, porque o JSON diz allow', false, 'o código de saída vale mais.'),
          opc('c', 'Pede aprovação ao usuário', false, 'no agente de nuvem, <code>ask</code> é tratado como <code>deny</code>.')] },
      { id: 'cop2-mcpnuvem', pergunta: 'Qual a restrição documentada de MCP para o agente de nuvem e a revisão de código?',
        opcoes: [
          opc('a', 'Só ferramentas (não recursos nem prompts) e sem servidores remotos que usem OAuth nas configurações do repositório', true, 'e o campo <code>tools</code> é obrigatório; a recomendação é listar só ferramentas de leitura.'),
          opc('b', 'Só servidores locais, sem limites de ferramentas', false, 'servidores remotos funcionam, exceto os com OAuth.'),
          opc('c', 'Nenhuma restrição', false, 'há as restrições citadas.')] },
      { id: 'cop2-setup', pergunta: 'Você criou <code>.github/workflows/copilot-setup-steps.yml</code> numa branch de feature e o agente não usa os passos. Por quê?',
        opcoes: [
          opc('a', 'O workflow só dispara quando o arquivo está na branch padrão, e o job deve se chamar <code>copilot-setup-steps</code>', true, 'também só <code>steps</code>, <code>permissions</code>, <code>runs-on</code>, <code>services</code>, <code>snapshot</code> e <code>timeout-minutes</code> são lidos, e o limite do timeout é 59 minutos.'),
          opc('b', 'O Copilot só aceita Dockerfile', false, 'esse é o mecanismo do Cursor.'),
          opc('c', 'O arquivo precisa estar em <code>.copilot/</code>', false, 'o caminho é <code>.github/workflows/</code>.')] },
      { id: 'cop2-ci', pergunta: 'O agente de nuvem empurra um commit para um PR e os workflows do Actions não rodam. Qual a explicação padrão?',
        opcoes: [
          opc('a', 'Workflows não rodam sozinhos em pushes do Copilot; alguém aprova a execução na caixa de merge do PR', true, 'desligar "Require approval for workflow runs" dá a código não revisado acesso de escrita e a segredos do Actions.'),
          opc('b', 'O Copilot desativou o Actions do repositório', false, 'não desativa.'),
          opc('c', 'O PR precisa estar fora de rascunho', false, 'não é essa a regra descrita.')] }
    ],
    abas: [
      { rotulo: 'Agentes, skills e subagentes', blocos: [
        { tipo: 'texto', html:
          '<p>Os blocos abaixo valem para o Copilot em <strong>09/11/2026</strong>. Onde o recurso estava em prévia, a aula diz.</p>' +
          '<h3>Agentes customizados</h3>' +
          '<p>Um agente customizado é um perfil em <code>.github/agents/NOME.agent.md</code>. Para organização, o arquivo vai para o repositório <code>.github</code> ou <code>.github-private</code>, numa pasta <code>agents</code> na raiz. Frontmatter: <code>description</code> (obrigatório), <code>name</code> (padrão: nome do arquivo), <code>tools</code> (lista de ferramentas ou aliases, incluindo as de MCP; se omitido, todas), <code>mcp-servers</code> (servidores só deste agente), <code>model</code> (para IDEs) e <code>target</code> (<code>vscode</code> ou <code>github-copilot</code>). O corpo aceita até 30.000 caracteres. Use no agente de nuvem pelo seletor do painel ou ao atribuir uma issue; no CLI, por <code>/agent</code>, <code>--agent</code> ou citando-o no prompt.</p>' },
        { tipo: 'complete', id: 'cop2-complete-agent', titulo: 'Monte um agente de testes sem escrita em produção', linguagem: 'markdown',
          enunciado: 'O agente deve ler e escrever só testes. A primeira linha é a legenda do exercício; o arquivo começa em <code>---</code>.',
          partes: [
            '// arquivo: ', { lacuna: 'arq', opcoes: ['.github/agents/test-specialist.agent.md', '.github/copilot/agents.yml', 'AGENTS.md'], correta: '.github/agents/test-specialist.agent.md' },
            '\n\n---\nname: test-specialist\ndescription: ', { lacuna: 'desc', opcoes: ['Melhora cobertura e qualidade dos testes sem alterar código de produção', 'Faz tudo', ''], correta: 'Melhora cobertura e qualidade dos testes sem alterar código de produção' },
            '\ntools: ["read", "search", "edit"]\ntarget: ', { lacuna: 'target', opcoes: ['github-copilot', 'cursor', 'terminal'], correta: 'github-copilot' },
            '\n---\nVocê é especialista em testes. Analise lacunas de cobertura, escreva testes determinísticos e isolados e não altere código de produção, a menos que seja pedido.'
          ],
          explicacao: 'O perfil vive em <code>.github/agents/</code> e termina em <code>.agent.md</code>. A <code>description</code> é obrigatória e é o que guia a escolha automática. <code>target</code> aceita <code>vscode</code> ou <code>github-copilot</code>; sem ele o agente vale nos dois. Os nomes exatos dos aliases em <code>tools</code> variam; confira a lista na página de agentes customizados antes de commitar.',
          callout: 'Agente de testes montado: local certo, descrição e escopo.' },
        { tipo: 'texto', html:
          '<h3>Skills</h3>' +
          '<p>Uma skill é uma pasta com <code>SKILL.md</code>. Fica em <code>.github/skills</code>, <code>.claude/skills</code> ou <code>.agents/skills</code> (projeto) e em <code>~/.copilot/skills</code> ou <code>~/.agents/skills</code> (pessoal). Frontmatter: <code>name</code> (minúsculas e hífens) e <code>description</code> (o que faz e <em>quando</em> usar) obrigatórios; <code>license</code> e <code>allowed-tools</code> opcionais. Aviso da própria página: só pré-aprove <code>shell</code> ou <code>bash</code> em <code>allowed-tools</code> se você revisou a skill e os scripts que ela chama. No CLI: <code>/skills list</code>, <code>/skills info NOME</code>, <code>/skills reload</code> e, fora da sessão, <code>copilot skill list|add|enable|disable</code>. Chame explicitamente com <code>/nome</code> no prompt.</p>' +
          '<h3>Prompt files (VS Code)</h3>' +
          '<p>Arquivos <code>.github/prompts/*.prompt.md</code> viram comandos <code>/nome</code> no chat <em>local</em> do VS Code, com frontmatter opcional (<code>description</code>, <code>name</code>, <code>argument-hint</code>, <code>agent</code>, <code>model</code>, <code>tools</code>) e variáveis como <code>${selection}</code> e <code>${input:nome}</code>. Valem só em sessões locais.</p>' +
          '<h3>Subagentes no IDE</h3>' +
          '<p>No VS Code, um subagente roda em janela de contexto própria, sem pausar para perguntar, e devolve só o resultado ao chat. Habilite a ferramenta <code>runSubagent</code> (ícone de ferramentas); em prompt files e agentes customizados, liste <code>runSubagent</code> em <code>tools</code>. Eles exigem agentes customizados configurados, usam as mesmas ferramentas e o mesmo modelo da sessão e <strong>não podem criar outros subagentes</strong>; a página os lista como não disponíveis no Visual Studio.</p>' +
          '<h3>Plugins no CLI</h3>' +
          '<p>Plugins se instalam de marketplaces: <code>copilot plugin marketplace add OWNER/REPO</code> e <code>copilot plugin install PLUGIN@MARKETPLACE</code> (dentro da sessão, <code>/plugin ...</code>). Dois marketplaces vêm registrados: <code>copilot-plugins</code> e <code>awesome-copilot</code>. Para o agente de nuvem, marketplace e plugin entram em <code>.github/copilot/settings.json</code> do repositório.</p>' },
        { tipo: 'takeaway', html: 'Agente customizado <mark>define o papel</mark>, skill <mark>carrega o procedimento</mark> e subagente <mark>isola o contexto</mark>; nenhum deles substitui <mark>hook e CI</mark> para o que é obrigatório.' }
      ] },

      { rotulo: 'Hooks e MCP', blocos: [
        { tipo: 'texto', html:
          '<h3>Hooks</h3>' +
          '<p>Hooks são comandos que rodam em eventos do ciclo da sessão. Ficam em arquivos <code>.github/hooks/*.json</code> do repositório (única fonte lida pelo agente de nuvem), em <code>~/.copilot/hooks/</code> (só no CLI) ou em plugins. Cada arquivo tem <code>"version": 1</code> e um objeto <code>hooks</code> com eventos como <code>sessionStart</code>, <code>userPromptSubmitted</code>, <code>preToolUse</code>, <code>postToolUse</code>, <code>agentStop</code>, <code>subagentStop</code>, <code>sessionEnd</code> e <code>errorOccurred</code>; o agente de nuvem suporta um subconjunto, e no VS Code os hooks estavam em <strong>prévia pública</strong>. Cada entrada de comando tem <code>type: "command"</code>, <code>bash</code> (Unix), <code>powershell</code> (ignorado na nuvem), <code>cwd</code>, <code>env</code> e <code>timeoutSec</code> (padrão 30).</p>' +
          '<p>O <code>preToolUse</code> é o hook que bloqueia: roda antes de ferramentas como bash, edit e view e pode permitir, negar ou modificar. A entrada chega em JSON (campos como <code>sessionId</code>, <code>cwd</code>, <code>toolName</code> e <code>toolArgs</code>) e a decisão sai como um único objeto JSON no stdout, por exemplo <code>{"permissionDecision": "allow"}</code>. Na nuvem, <code>ask</code> vira <code>deny</code>, porque não há ninguém para responder. <strong>Falhas:</strong> crash ou código não zero de um <code>preToolUse</code> de comando <em>nega</em> a chamada (fail-closed), mesmo que o stdout diga allow; <em>timeout</em> é fail-open. O nome do campo de motivo da negação não foi confirmado nesta verificação: consulte a referência de hooks antes de usá-lo.</p>' },
        { tipo: 'codigo', linguagem: 'json', texto: [
          '{', '  "version": 1,', '  "hooks": {', '    "preToolUse": [', '      {', '        "type": "command",', '        "bash": ".github/hooks/guard.sh",', '        "timeoutSec": 10', '      }', '    ]', '  }', '}'].join('\n') },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '#!/bin/bash', '# .github/hooks/guard.sh  (chmod +x; uma única linha de JSON no stdout)', 'input=$(cat)',
          'if echo "$input" | grep -Eq \'rm -rf|git push --force([^-[:alnum:]]|$)\'; then', '  echo \'{"permissionDecision":"deny"}\'', '  exit 0', 'fi', 'echo \'{"permissionDecision":"allow"}\''].join('\n') },
        { tipo: 'rode', id: 'cop2-rode', titulo: 'Teste o hook como a documentação manda: pipe e código de saída',
          enunciado: 'A página de hooks sugere testar com um JSON no pipe e conferir <code>echo $?</code>. As três primeiras saídas vêm de execução local do script acima com um JSON de entrada reduzido (<code>toolName</code> e <code>toolArgs</code>); a quarta é uma variação defeituosa.',
          prefixo: '$', entrada: 'cat entrada-rm.json | .github/hooks/guard.sh; echo $?', unidade: 'ms', terminalTitulo: 'teste do hook',
          etapas: [
            { id: 'rm', nome: 'rm -rf', descricao: 'Deve ser negado', tom: 'request', ms: 15, linhas: [
              L('cmd', 'cat entrada-rm.json | .github/hooks/guard.sh; echo $?'), L('out', '{"permissionDecision":"deny"}'), L('out', '0')] },
            { id: 'lease', nome: 'push --force-with-lease', descricao: 'Alternativa mais segura; deve passar', tom: 'response', ms: 15, linhas: [
              L('cmd', 'cat entrada-lease.json | .github/hooks/guard.sh; echo $?'), L('out', '{"permissionDecision":"allow"}'), L('out', '0'),
              L('hint', 'A expressão exige que depois de --force não venha hífen nem letra; por isso --force-with-lease passa.')] },
            { id: 'ok', nome: 'npm test', descricao: 'Deve passar', tom: 'tls', ms: 15, linhas: [
              L('cmd', 'cat entrada-test.json | .github/hooks/guard.sh; echo $?'), L('out', '{"permissionDecision":"allow"}'), L('out', '0')] },
            { id: 'quebrado', nome: 'Versão defeituosa', descricao: 'Imprime allow, mas termina com erro', tom: 'ink', ms: 15, linhas: [
              L('cmd', 'echo {} | ./guard-quebrado.sh; echo $?'), L('out', '{"permissionDecision":"allow"}'), L('out', '1'),
              L('hint', 'Segundo a referência, um preToolUse de comando com código não zero nega a chamada, mesmo com allow no stdout.')] }
          ],
          prever: { pergunta: 'O script quebrado imprime <code>allow</code> e sai com código 1. O Copilot deixa a ferramenta rodar?', opcoes: [
            { id: 'a', texto: 'Sim: a decisão no stdout é a que vale.', correta: false, porque: 'a referência diz o contrário para preToolUse de comando.' },
            { id: 'b', texto: 'Não: crash ou código não zero nega a chamada (fail-closed), então um hook com bug bloqueia o trabalho em vez de liberar.', correta: true, porque: 'bom para segurança, ruim para produtividade: teste o hook antes de commitar. Timeout, ao contrário, é fail-open.' },
            { id: 'c', texto: 'Pergunta ao usuário.', correta: false, porque: 'não há esse fluxo; na nuvem <code>ask</code> vira <code>deny</code>.' }
          ] },
          tutorDepois: 'Teste o hook nos dois sentidos e com um defeito deliberado. Hook que falha fechado protege, mas também para o time inteiro se quebrar.',
          callout: 'Você viu negar, permitir e a falha fechada de um preToolUse.' },
        { tipo: 'texto', html:
          '<h3>MCP: cada superfície tem seu arquivo</h3>' },
        tabela(['Superfície', 'Onde configurar', 'Observações'], [
          ['Copilot CLI', '<code>~/.copilot/mcp-config.json</code>, chave <code>mcpServers</code>; no projeto, <code>.github/mcp.json</code> (compartilhado) e <code>.mcp.json</code> (local)', '<code>type</code> <code>local</code> ou <code>http</code>; <code>tools</code> lista ou <code>"*"</code>. O servidor do GitHub já vem embutido. Projeto só carrega após confiar na pasta; com <code>-p</code>, pasta não confiável é ignorada salvo <code>GITHUB_COPILOT_PROMPT_MODE_WORKSPACE_MCP=true</code>. <code>/mcp add</code> abre o formulário'],
          ['VS Code', '<code>.vscode/mcp.json</code>, chave <code>servers</code>, com <code>inputs</code> do tipo <code>promptString</code> para segredos; ou <code>settings.json</code> do usuário', 'Botão Start no arquivo; "MCP: List Servers" na paleta. Use um só local por servidor'],
          ['Agente de nuvem e revisão', 'Repositório: Settings, Copilot, MCP servers; JSON com <code>mcpServers</code>', '<code>tools</code> obrigatório; segredos com prefixo <code>COPILOT_MCP_</code> no ambiente <code>copilot</code>, referenciados por <code>$VAR</code>, <code>${VAR}</code> ou <code>${VAR:-padrão}</code>. Só ferramentas, sem OAuth remoto. O agente usa as ferramentas sem pedir aprovação']]),
        { tipo: 'complete', id: 'cop2-complete-mcp', titulo: 'Configure MCP para o agente de nuvem', linguagem: 'json',
          enunciado: 'O servidor precisa de uma chave de API. Só ferramentas de leitura devem ficar disponíveis.',
          partes: [
            '{\n  "', { lacuna: 'raiz', opcoes: ['mcpServers', 'servers', 'mcp'], correta: 'mcpServers' },
            '": {\n    "tracker": {\n      "type": "local",\n      "command": "npx",\n      "args": ["-y", "tracker-mcp"],\n      "env": {\n        "API_KEY": "', { lacuna: 'seg', opcoes: ['$COPILOT_MCP_TRACKER_KEY', '$TRACKER_KEY', 'sk-exemplo-123'], correta: '$COPILOT_MCP_TRACKER_KEY' },
            '"\n      },\n      "tools": ', { lacuna: 'tools', opcoes: ['["list_issues", "get_issue"]', '["*"]', '[]'], correta: '["list_issues", "get_issue"]' }, '\n    }\n  }\n}'
          ],
          explicacao: 'No agente de nuvem a chave é <code>mcpServers</code> (no VS Code é <code>servers</code>). Só variáveis com prefixo <code>COPILOT_MCP_</code> chegam à configuração, então o segredo se chama <code>COPILOT_MCP_TRACKER_KEY</code> no ambiente <code>copilot</code>. A página recomenda listar apenas ferramentas de leitura, porque o agente usa as ferramentas sem pedir aprovação.',
          callout: 'MCP do agente de nuvem com segredo por variável e ferramentas restritas.' },
        { tipo: 'takeaway', html: 'O hook <mark>falha fechado</mark> no <code>preToolUse</code>; cada superfície <mark>tem seu arquivo de MCP</mark> e o da nuvem exige <mark>tools</mark> e <mark>segredo com prefixo</mark>.' }
      ] },

      { rotulo: 'Nuvem, sem tela e custo', blocos: [
        { tipo: 'texto', html:
          '<h3>Agente de nuvem</h3>' +
          '<p>É o Copilot trabalhando em segundo plano numa branch e entregando um PR. Pode ser iniciado a partir de issues, da aba de agentes, do painel, do Copilot Chat, de execuções do Actions que falharam, do GitHub Mobile, de IDEs (VS Code, JetBrains, Eclipse, Visual Studio 2026), da API REST, do GitHub CLI e do servidor MCP do GitHub, de integrações (Jira, Slack, Teams, Azure Boards, Linear, Raycast) e de automações agendadas ou por evento. Exige plano pago. Do CLI, <code>/delegate TAREFA</code> ou o prefixo <code>&amp;</code> pedem ao Copilot para commitar suas mudanças não commitadas como checkpoint numa branch nova, abrir um PR em rascunho e continuar mesmo que você desligue a máquina.</p>' +
          '<p>O ambiente se prepara em <code>.github/workflows/copilot-setup-steps.yml</code>, um workflow comum cujo job <strong>precisa se chamar <code>copilot-setup-steps</code></strong>. Só valem <code>steps</code>, <code>permissions</code>, <code>runs-on</code>, <code>services</code>, <code>snapshot</code> e <code>timeout-minutes</code> (máximo 59). O arquivo só dispara na branch padrão; se um passo falhar, os seguintes são pulados e o agente começa do estado atual. Só Ubuntu x64 e Windows 64-bit são suportados (macOS não). Dois padrões de segurança: <strong>workflows do Actions não rodam sozinhos em pushes do Copilot</strong> (alguém aprova no PR) e o agente roda verificações de segurança e a revisão de código do Copilot no que gerou, desligáveis pelos administradores.</p>' },
        { tipo: 'complete', id: 'cop2-complete-setup', titulo: 'Monte o copilot-setup-steps.yml', linguagem: 'yaml',
          enunciado: 'Prepare Node 20 e instale dependências antes de o agente começar.',
          partes: [
            'name: "Copilot Setup Steps"\non:\n  workflow_dispatch:\n\njobs:\n  ', { lacuna: 'job', opcoes: ['copilot-setup-steps', 'setup', 'build'], correta: 'copilot-setup-steps' },
            ':\n    runs-on: ', { lacuna: 'runner', opcoes: ['ubuntu-latest', 'macos-latest'], correta: 'ubuntu-latest' },
            '\n    timeout-minutes: ', { lacuna: 'tempo', opcoes: ['30', '120'], correta: '30' },
            '\n    permissions:\n      contents: read\n    steps:\n      - uses: actions/checkout@v6\n      - uses: actions/setup-node@v7\n        with:\n          node-version: "20"\n          cache: "npm"\n      - run: ', { lacuna: 'cmd', opcoes: ['npm ci', 'npm publish'], correta: 'npm ci' }
          ],
          explicacao: 'O nome do job é fixo; macOS não é suportado; o teto de <code>timeout-minutes</code> é 59, então 120 seria inválido; <code>npm ci</code> é a instalação reprodutível. Lembre que o arquivo só vale quando está na branch padrão.',
          callout: 'Ambiente do agente de nuvem montado com os limites certos.' },
        { tipo: 'texto', html:
          '<h3>Sem tela: copilot -p</h3>' +
          '<p><code>copilot -p "prompt"</code> roda uma vez e sai; um prompt vindo de pipe é ignorado se houver <code>-p</code>. Flags: <code>--allow-tool</code>, <code>--deny-tool</code>, <code>--allow-url</code>, <code>-s</code> (só a resposta, ideal para capturar saída), <code>--no-ask-user</code> (o agente não pergunta), <code>--model</code>, <code>--share ./arquivo.md</code> (transcrição) e <code>--share-gist</code>. No Actions, o token vai em <code>COPILOT_GITHUB_TOKEN</code> (PAT com Copilot Requests, ou <code>GITHUB_TOKEN</code> onde a organização permitir). A documentação sugere GitHub Agentic Workflows para a maior parte da automação, por usarem <code>GITHUB_TOKEN</code> e trazerem proteções extras.</p>' },
        { tipo: 'codigo', linguagem: 'yaml', texto: [
          '- name: Resumo de cobertura', '  env:', '    COPILOT_GITHUB_TOKEN: ${{ secrets.COPILOT_PAT }}', '  run: |',
          '    copilot -p "Rode os testes e resuma a cobertura" \\', "      -s --allow-tool='shell(npm:*), write' --deny-tool='shell(git push)' --no-ask-user"].join('\n') },
        { tipo: 'texto', html:
          '<h3>Autopilot e custo</h3>' +
          '<p>O <strong>autopilot</strong> (<kbd>Shift</kbd>+<kbd>Tab</kbd>, <code>/autopilot</code> ou <code>--autopilot</code> com <code>-p</code>) deixa o agente seguir até chamar <code>task_complete</code>. Ao entrar, o CLI oferece conceder todas as permissões; com aprovação manual, ele <em>nega sozinho</em> o que exigiria aprovação, e a tarefa pode não terminar. Limite: <code>--max-autopilot-continues=N</code>, e a documentação cita <code>--max-ai-credits</code> (limite suave de créditos em modo programático) e <code>/limits</code>. A recomendação oficial antes de permissões amplas é usar sandbox local (<code>/sandbox enable</code>) ou de nuvem (<code>copilot --cloud</code>), e revisar com <code>/diff</code> antes de commitar. A página não rotula o autopilot como prévia ou GA: trate como recurso que muda.</p>' +
          '<p>Em custo: cada prompt consome AI Credits em função de tokens e modelo; a revisão de código do Copilot escolhe o modelo sozinha e também consome minutos do Actions. Modelos têm preços por milhão de tokens muito diferentes (da faixa "leve" à "poderosa"); a tabela está na página de preços e <strong>expira em 30 dias</strong>. O método é o mesmo de qualquer ferramenta: modelo forte para planejar, leve para mecânico (<code>--model</code> ou Auto), contexto curto com <code>/compact</code> e <code>/context</code>, e <code>/usage</code> para acompanhar.</p>' },
        { tipo: 'cenario', id: 'cop2-cenario', titulo: 'Autopilot numa migração grande', obrigatorio: false,
          enunciado: 'Você precisa migrar 200 arquivos de um padrão para outro, com testes de caracterização já existentes.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Você quer usar o autopilot. O que faz antes de apertar Enter?', opcoes: [
              { texto: 'Abro a sessão em sandbox (<code>/sandbox enable</code> ou <code>copilot --cloud</code>), com <code>--allow-tool</code> estreito, <code>--deny-tool=\'shell(git push)\'</code> e <code>--max-autopilot-continues</code>; reviso com <code>/diff</code> e rodo os testes.', vai: 'f-bom', tom: 'ok', consequencia: 'o raio de dano é pequeno, o limite impede deriva longa e a verificação é determinística.' },
              { texto: 'Inicio com <code>--yolo</code> no meu notebook, que tem credenciais de produção no ambiente.', vai: 'f-yolo', tom: 'ruim', consequencia: 'a documentação recomenda isolamento justamente para isso: o agente herda o que seu usuário alcança.' },
              { texto: 'Uso autopilot sem permissões, porque com aprovação manual ele nega sozinho o que precisa de aprovação.', vai: 'f-nega', tom: 'ruim', consequencia: 'a tarefa para no meio, com metade dos arquivos migrados e nenhum sinal claro de por quê.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Migração em lotes verificados, sem acesso a credenciais, parada controlada e revisão do diff antes do commit.' },
            'f-yolo': { bom: false, texto: 'Um comando inesperado rodou com seus tokens de produção no ambiente. Sem isolamento, o ganho de velocidade não compensa.' },
            'f-nega': { bom: false, texto: 'O autopilot negou a primeira gravação fora da lista e encerrou o trabalho incompleto.' }
          },
          callout: 'Você deu autonomia dentro de um perímetro, com limite e verificação.' },
        { tipo: 'takeaway', html: 'Nuvem e sem tela <mark>dependem de ambiente e flags</mark>: <mark>sandbox, permissão estreita, limite e revisão do diff</mark>.' }
      ] },

      { rotulo: 'Armadilhas e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Armadilhas conhecidas (verificadas na documentação)</h3>' +
          '<ul><li><strong>Superfícies leem arquivos diferentes.</strong> Confira a matriz antes de confiar em uma regra (VS Code Chat só lê <code>AGENTS.md</code> entre os arquivos de agente).</li>' +
          '<li><strong>MCP na nuvem não pede aprovação.</strong> Liste só ferramentas de leitura em <code>tools</code> e não use <code>"*"</code> por comodidade.</li>' +
          '<li><strong>OAuth remoto não funciona</strong> em MCP configurado no repositório ou em perfis de agente customizado.</li>' +
          '<li><strong>Setup steps na branch errada</strong> ou com nome de job diferente: ignorados em silêncio.</li>' +
          '<li><strong>Desligar a aprovação de workflows</strong> dá a código não revisado acesso de escrita e a segredos do Actions.</li>' +
          '<li><strong>Hooks: fail-closed em crash, fail-open em timeout.</strong> Teste os dois e deixe o timeout curto o bastante para não travar o time.</li>' +
          '<li><strong>Prévias.</strong> Plan no IDE, hooks no VS Code e agentes customizados em JetBrains, Eclipse e Xcode estavam em prévia pública em 09/11/2026 e podem mudar.</li>' +
          '<li><strong>Nomes que variam entre fontes.</strong> A página de subagentes cita a ferramenta <code>runSubagent</code>; o VS Code evolui rápido, então confirme o nome na sua versão.</li></ul>' },
        { tipo: 'transcript', id: 'cop2-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'sessão do agente de nuvem (exemplo)',
          enunciado: 'O agente de nuvem abriu um PR e a conversa abaixo ocorreu. Uma fala do agente não bate com o que a ferramenta mostra. Clique nela e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Corrija o bug do relatório e confirme que o CI está verde.' },
            { quem: 'agente', texto: 'Corrigi em src/relatorio.py e abri o PR #482 em rascunho.' },
            { quem: 'ferramenta', texto: 'PR #482 (rascunho): 1 arquivo alterado\nChecks: aguardando aprovação para executar workflows' },
            { quem: 'agente', texto: 'O CI está verde: todos os testes passaram.' },
            { quem: 'voce', texto: 'Mostre a lista de checks.' }
          ],
          erradas: [3],
          explicacao: { 3: 'workflows do Actions não rodam automaticamente em pushes do Copilot; o status é "aguardando aprovação", não verde. Alguém precisa aprovar a execução na caixa de merge, depois de olhar o diff.' },
          tutorDepois: 'Check que nunca rodou não está verde.' },
        { tipo: 'escolha', id: 'cop2-esc-mcp', titulo: 'Confira: ferramentas do agente de nuvem',
          pergunta: 'Ao ligar um servidor de issues ao agente de nuvem, o time pergunta: <code>"tools": ["*"]</code> está bom?',
          opcoes: [
            { id: 'a', texto: 'Sim: o agente pede aprovação a cada uso.', correta: false, porque: 'na nuvem o agente usa as ferramentas autonomamente, sem pedir aprovação.' },
            { id: 'b', texto: 'Não: liste só as ferramentas de leitura de que a tarefa precisa; o agente usará o que estiver na lista sozinho.', correta: true, porque: 'é a recomendação explícita da página. Segredo em variável com prefixo <code>COPILOT_MCP_</code>.' },
            { id: 'c', texto: 'Sim, desde que o servidor use OAuth.', correta: false, porque: 'servidores remotos com OAuth não são suportados nessas configurações.' }
          ], tutorDepois: 'Autonomia na nuvem pede lista curta de ferramentas.' },
        { tipo: 'escolha', id: 'cop2-esc-hook', titulo: 'Confira: o hook que decide por você',
          pergunta: 'Qual combinação protege <code>migrations/</code> de forma que o agente de nuvem não consiga contornar mudando de ferramenta?',
          opcoes: [
            { id: 'a', texto: 'Só uma skill dizendo "não edite migrations".', correta: false, porque: 'skill é consultiva.' },
            { id: 'b', texto: 'Um hook <code>preToolUse</code> em <code>.github/hooks/</code> mais um check obrigatório no CI sobre o diff, com proteção de branch.', correta: true, porque: 'o hook é o primeiro obstáculo; o check sobre o diff olha o efeito mesmo que o agente use outro caminho (por exemplo, um comando de shell).' },
            { id: 'c', texto: 'Um hook em <code>~/.copilot/hooks/</code>.', correta: false, porque: 'o agente de nuvem só carrega hooks de <code>.github/hooks/*.json</code> do repositório.' }
          ], tutorDepois: 'Hook no repositório, check no CI, aprovação humana no merge.' },
        { tipo: 'texto', html: '<h3>Equivalente nas outras ferramentas</h3>' },
        tabela(['Recurso', 'Copilot', 'Cursor', 'Claude Code', 'Codex'], [
          ['Agente customizado', '<code>.github/agents/*.agent.md</code>', '<code>.cursor/agents/*.md</code>', '<code>.claude/agents/</code>', '<code>.codex/agents/*.toml</code>'],
          ['Skill', '<code>.github/skills/</code>, <code>.agents/skills</code>', '<code>.cursor/skills/</code>, <code>.agents/skills</code>', '<code>.claude/skills/</code>', '<code>.agents/skills</code>'],
          ['Hook que bloqueia', '<code>preToolUse</code> em <code>.github/hooks/*.json</code>', '<code>.cursor/hooks.json</code>, exit 2 ou <code>permission: deny</code>', '<code>.claude/settings.json</code>', '<code>PreToolUse</code> em <code>hooks.json</code>'],
          ['Falha do hook', 'crash ou não zero nega; timeout passa', 'passa, salvo <code>failClosed: true</code>', 'não coberto aqui', 'não coberto aqui'],
          ['MCP (chave)', '<code>mcpServers</code> (CLI e nuvem); <code>servers</code> (VS Code)', '<code>mcpServers</code>', 'servidores MCP em settings', '<code>config.toml</code>'],
          ['Nuvem', 'agente de nuvem, <code>/delegate</code>', 'Cloud Agents, <code>&amp;</code>', 'não coberto aqui', 'não coberto aqui'],
          ['Sem tela', '<code>copilot -p</code>', '<code>agent -p</code>', '<code>claude -p</code>', '<code>codex exec</code>']]),
        { tipo: 'takeaway', html: 'Em equipe, o que vale é <mark>hook no repositório</mark>, <mark>check no CI</mark> e <mark>lista curta de ferramentas</mark>; prévias <mark>mudam</mark>.' }
      ] }
    ]
  });
})();
