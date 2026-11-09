/* Ferramentas · Claude Code 1 · "Claude Code do zero ao dia a dia". Fatos de produto verificados em 09/11/2026 na documentação oficial (code.claude.com/docs); tabela de fontes e prazos em ferramentas/fontes/claude-code.md. Saídas de sessão do Claude Code são rotuladas "exemplo": a ferramenta muda de versão e de texto. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tab(cab, linhas) {
    return '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  var VERIF = '<p class="ta-nota">Verificado em 09/11/2026 na documentação oficial do Claude Code. Comandos e nomes de arquivo mudam com a versão (a documentação consultada citava a série 2.1.x); confira com <code>claude --version</code> e <code>/help</code>.</p>';

  TrilhaAula.registrar({
    id: 'fer-claude-code-1',
    titulo: 'Claude Code do zero ao dia a dia',
    minutos: 35,
    resumo: 'Instalar, entrar, escrever o CLAUDE.md, escolher o modo de permissão e fechar o ciclo plano, implementação e revisão sem sair do terminal.',
    objetivo: 'Instalar e autenticar o Claude Code, manter um CLAUDE.md curto (ou usar o AGENTS.md que o repositório já tem), escolher o modo de permissão certo para cada tarefa e conduzir plano, implementação e revisão com os atalhos da ferramenta.',
    revisao: [
      { id: 'cc1-atualiza', pergunta: 'Você instalou o Claude Code com <code>brew install --cask claude-code</code>. Quem mantém a versão em dia?',
        opcoes: [
          opc('a', 'Você, com <code>brew upgrade claude-code</code>; a instalação por Homebrew não atualiza sozinha', true, 'só o instalador nativo atualiza em segundo plano; Homebrew, WinGet e gerenciadores de pacote Linux exigem atualização manual (ou a variável <code>CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE=1</code> para Homebrew e WinGet).'),
          opc('b', 'O próprio Claude Code, em segundo plano, como no instalador nativo', false, 'isso vale para o instalador nativo, não para Homebrew.'),
          opc('c', 'Ninguém: a versão fica fixa até reinstalar', false, 'há comando de atualização; só não é automático.')] },
      { id: 'cc1-regra', pergunta: 'Existem <code>allow: Bash(aws s3 ls)</code> e <code>deny: Bash(aws *)</code>. O que acontece com <code>aws s3 ls</code>?',
        opcoes: [
          opc('a', 'É negado: as regras são avaliadas na ordem deny, ask, allow, e a primeira que casa decide', true, 'uma regra allow mais específica não abre exceção dentro de um deny mais amplo.'),
          opc('b', 'É permitido, porque a regra mais específica vence', false, 'a especificidade não muda a ordem de avaliação.'),
          opc('c', 'Pergunta ao usuário', false, 'só uma regra ask produz pergunta.')] },
      { id: 'cc1-claudemd', pergunta: 'O que o CLAUDE.md garante sobre o comportamento do Claude?',
        opcoes: [
          opc('a', 'Nada de forma obrigatória: é contexto lido em toda sessão; para impedir uma ação use regra de permissão ou hook', true, 'a documentação diz que Claude trata o CLAUDE.md como contexto, não como configuração imposta.'),
          opc('b', 'Que as regras escritas nele serão sempre cumpridas', false, 'quem impõe é a permissão ou o hook <code>PreToolUse</code>.'),
          opc('c', 'Que o arquivo vira política obrigatória quando está em <code>.claude/</code>', false, 'a pasta não muda a natureza do arquivo.')] },
      { id: 'cc1-rewind', pergunta: 'Um <code>sed -i</code> rodado pelo Claude por Bash alterou <code>seed.sql</code>, que nenhuma ferramenta de edição tocou. O <code>/rewind</code> restaura o arquivo?',
        opcoes: [
          opc('a', 'Não: arquivo alterado só por comandos Bash não é rastreado; reverta com Git', true, 'o checkpoint acompanha as edições das ferramentas de edição, não efeitos de shell.'),
          opc('b', 'Sim, o <code>/rewind</code> desfaz qualquer mudança em disco', false, 'a documentação lista "mudanças por Bash não rastreadas" como limite.'),
          opc('c', 'Sim, mas só dentro da mesma hora', false, 'não há janela de tempo.')] },
      { id: 'cc1-agents', pergunta: 'O repositório tem <code>AGENTS.md</code> e você cria um <code>CLAUDE.local.md</code> só seu. O que o Claude passa a ler?',
        opcoes: [
          opc('a', 'Só os arquivos CLAUDE: o <code>AGENTS.md</code> deixa de ser lido, a menos que você importe ou mude a configuração "Project instructions"', true, 'a leitura direta do <code>AGENTS.md</code> só vale quando não há nenhum CLAUDE.md nem CLAUDE.local.md no diretório ou acima.'),
          opc('b', 'Os dois, nesta ordem', false, 'só com <code>claude-md-and-agents-md</code> ou um <code>@AGENTS.md</code> no CLAUDE.md.'),
          opc('c', 'Só o <code>AGENTS.md</code>', false, 'o arquivo local conta como CLAUDE.md para essa regra.')] }
    ],
    abas: [

      /* ---------------- Aba 1 ---------------- */
      { rotulo: 'Instalar e entrar', blocos: [
        { tipo: 'texto', html:
          '<p>Os conceitos (arquivo de instruções, modos, hooks, MCP) estão na Trilha rápida, aulas 01 e 10. Aqui o assunto é só como o <strong>Claude Code</strong> os implementa. Esta aula assume terminal, Git e um repositório seu para testar; os exemplos usam um projeto Python com <code>uv</code>, <code>pytest</code> e <code>ruff</code>.</p>' + VERIF +
          '<h3>Instalar</h3>' +
          '<p>O instalador nativo é o recomendado pela documentação e é o único que se atualiza sozinho em segundo plano. Os demais métodos funcionam, mas você assume a atualização.</p>' +
          tab(['Método', 'Comando', 'Atualização'], [
            ['Nativo (macOS, Linux, WSL)', '<code>curl -fsSL https://claude.ai/install.sh | bash</code>', 'Automática, em segundo plano'],
            ['Nativo (Windows PowerShell)', '<code>irm https://claude.ai/install.ps1 | iex</code>', 'Automática'],
            ['Homebrew', '<code>brew install --cask claude-code</code> (estável, cerca de uma semana atrás) ou <code>claude-code@latest</code>', 'Manual: <code>brew upgrade claude-code</code>'],
            ['WinGet', '<code>winget install Anthropic.ClaudeCode</code>', 'Manual: <code>winget upgrade Anthropic.ClaudeCode</code>']
          ]) },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# macOS / Linux / WSL',
          'curl -fsSL https://claude.ai/install.sh | bash',
          '',
          '# abra um terminal novo e confira',
          'claude --version',
          'claude doctor      # diagnóstico somente leitura de instalação e configuração'
        ].join('\n') },
        { tipo: 'codigo', linguagem: 'powershell', texto: [
          '# Windows PowerShell',
          'irm https://claude.ai/install.ps1 | iex',
          'claude --version'
        ].join('\n') },
        { tipo: 'texto', html:
          '<p>Se o shell responder que <code>claude</code> não existe, o diretório de instalação ainda não está no <code>PATH</code>: abra um terminal novo antes de investigar. No Windows nativo, o Git for Windows é recomendado para a ferramenta Bash; sem ele o Claude Code usa PowerShell como shell.</p>' +
          '<h3>Autenticar</h3>' +
          '<p>Na primeira execução (<code>claude</code> dentro do projeto) a ferramenta abre o fluxo de login no navegador. As contas aceitas segundo a documentação: planos Pro, Max, Ultra, Team ou Enterprise do Claude; conta do Claude Console (API com crédito pré-pago); Amazon Bedrock, Google Cloud (Agent Platform) ou Microsoft Foundry; ou um gateway da sua empresa. Se <code>ANTHROPIC_API_KEY</code> estiver definida, o Claude Code pergunta se pode usar a chave e, aprovada, pula o login. Para trocar de conta depois, digite <code>/login</code> na sessão.</p>' +
          '<p>Credenciais ficam guardadas; você não repete o login a cada sessão. O custo muda conforme a conta: assinatura embute o uso no plano, Console e provedores de nuvem cobram por token (aula 2, aba de custo).</p>' },
        { tipo: 'rode', id: 'cc1-rode-inicio', titulo: 'Da instalação à primeira pergunta',
          enunciado: 'Saída de exemplo: o texto exato muda com a versão e o terminal. Aperte Enter para percorrer a primeira sessão e clique numa etapa para ver só ela.',
          prefixo: '$', entrada: 'cd pedidos-api && claude', unidade: 's', terminalTitulo: 'claude (exemplo)',
          prever: { pergunta: 'Você acabou de instalar e abriu <code>claude</code> no projeto pela primeira vez, sem nenhuma credencial. O que a ferramenta faz?', opcoes: [
            opc('a', 'Abre o fluxo de login (navegador) e só depois mostra o prompt', true, 'a documentação do quickstart: o Claude Code pede login na primeira vez; com <code>ANTHROPIC_API_KEY</code> aprovada ele pula essa etapa.'),
            opc('b', 'Falha com "command not found" até você configurar uma chave de API', false, 'a chave de API é uma das opções, não um requisito; o login pelo navegador cobre assinatura e Console.'),
            opc('c', 'Abre direto o prompt e pede login só na primeira edição', false, 'o login vem antes de qualquer uso.')
          ] },
          etapas: [
            { id: 'inst', nome: 'Instalar e conferir', descricao: 'Instalador nativo e claude --version', tom: 'dns', ms: 18, linhas: [
              L('cmd', 'curl -fsSL https://claude.ai/install.sh | bash'),
              L('info', 'o instalador não mostra progresso durante o download'),
              L('cmd', 'claude --version'),
              L('out', '2.1.x (Claude Code)'),
              L('hint', 'a versão aparece seguida de "(Claude Code)"') ] },
            { id: 'login', nome: 'Primeiro login', descricao: 'Fluxo no navegador; credencial fica guardada', tom: 'tcp', ms: 25, linhas: [
              L('cmd', 'cd pedidos-api && claude'),
              L('info', 'primeira execução: escolha a conta (assinatura, Console ou nuvem)'),
              L('out', 'abre o navegador, você autoriza, a sessão volta ao terminal'),
              L('hint', '/login troca de conta depois') ] },
            { id: 'perg', nome: 'Primeira pergunta', descricao: 'Leitura do projeto, sem editar nada', tom: 'tls', ms: 20, linhas: [
              L('in', 'what does this project do?'),
              L('out', 'Lê README, pyproject.toml e src/; resume: API FastAPI de pedidos, Pydantic v2, SQLAlchemy 2, testes com pytest.'),
              L('hint', 'o Claude Code lê os arquivos conforme precisa; você não monta o contexto') ] },
            { id: 'modo', nome: 'Ver e trocar o modo', descricao: 'Shift+Tab percorre os modos de permissão', tom: 'request', ms: 6, linhas: [
              L('info', 'barra de status: ⏵⏵ auto mode on'),
              L('in', '[Shift+Tab]'),
              L('out', '⏸ manual mode on'),
              L('in', '[Shift+Tab]'),
              L('out', '⏵⏵ accept edits on'),
              L('hint', 'em versões recentes uma sessão de terminal já começa em auto; Shift+Tab cai primeiro em manual') ] }
          ],
          tutorDepois: 'Instalar, entrar, perguntar e ver o modo atual: quatro passos, nenhum deles edita arquivo. O modo em que a sessão começa depende da versão e da conta; aprenda a lê-lo na barra de status antes de pedir a primeira edição.',
          callout: 'Você percorreu a primeira sessão: instalação, login, pergunta e modos.' },
        { tipo: 'takeaway', html: 'Instale pelo <mark>instalador nativo</mark> para ter <mark>atualização automática</mark>, entre pelo navegador e leia o <mark>modo atual</mark> na barra de status antes de pedir edições.' }
      ] },

      /* ---------------- Aba 2 ---------------- */
      { rotulo: 'Instruções e permissões', blocos: [
        { tipo: 'texto', html:
          '<h3>CLAUDE.md: o que carrega e de onde</h3>' +
          '<p>Cada sessão começa com a janela de contexto vazia; o <code>CLAUDE.md</code> é o que entra de novo em toda sessão. Rode <code>/init</code> para gerar um ponto de partida a partir do código (se o arquivo já existe, ele sugere melhorias em vez de sobrescrever) e <code>/memory</code> para editar. A documentação trata o arquivo como contexto, não como configuração imposta, e recomenda menos de 200 linhas por arquivo.</p>' +
          tab(['Escopo', 'Local', 'Quem vê'], [
            ['Política gerenciada', 'Linux/WSL: <code>/etc/claude-code/CLAUDE.md</code>; macOS: <code>/Library/Application Support/ClaudeCode/CLAUDE.md</code>', 'Toda a organização'],
            ['Usuário', '<code>~/.claude/CLAUDE.md</code>', 'Só você, todos os projetos'],
            ['Projeto', '<code>./CLAUDE.md</code> ou <code>./.claude/CLAUDE.md</code>', 'O time, via Git'],
            ['Local', '<code>./CLAUDE.local.md</code> (ponha no <code>.gitignore</code>)', 'Só você, neste projeto']
          ]) +
          '<p>Os arquivos do diretório atual e de todos os de cima são concatenados na partida (do mais geral ao mais específico); os de subpastas entram sob demanda, quando o Claude lê ou edita algo ali. <code>@caminho</code> dentro do arquivo importa outro (até quatro níveis de profundidade) e comentários HTML em bloco são removidos antes de chegar ao modelo. Para confirmar o que carregou, rode <code>/context all</code> e olhe a lista "Memory files".</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          '# pedidos-api',
          '',
          '## Comandos',
          '- Testes: `uv run pytest -q`',
          '- Lint e tipos: `uv run ruff check . && uv run mypy --strict src`',
          '',
          '## Convenções',
          '- Pydantic v2 nas fronteiras; handlers FastAPI em `src/api/handlers/`.',
          '- Migrações só via `uv run alembic revision --autogenerate`; nunca editar `migrations/` à mão.',
          '',
          '<!-- nota para mantenedores: não é enviada ao modelo -->'
        ].join('\n') },
        { tipo: 'texto', html:
          '<h3>E se o repositório já usa AGENTS.md?</h3>' +
          '<p>Desde a versão 2.1.277 o Claude Code lê <code>AGENTS.md</code> como instruções do projeto, mas com uma regra fina: só quando <em>não existe nenhum</em> <code>CLAUDE.md</code>, <code>.claude/CLAUDE.md</code> ou <code>CLAUDE.local.md</code> no diretório de trabalho ou acima. Se existir um, o Claude lê apenas os arquivos CLAUDE. O arranjo estável é um <code>CLAUDE.md</code> de uma linha, <code>@AGENTS.md</code>, que importa a fonte única. A configuração "Project instructions" em <code>/config</code> também muda o padrão (<code>claude-md-and-agents-md</code> lê os dois). Não são lidos: <code>AGENTS.override.md</code>, <code>AGENTS.local.md</code> e qualquer coisa dentro de <code>.agents/</code>.</p>' +
          '<h3>Regras em .claude/rules/</h3>' +
          '<p>Para repositórios maiores, divida em <code>.claude/rules/*.md</code>. Arquivos sem <code>paths</code> no frontmatter carregam na partida; com <code>paths:</code> só entram quando o Claude trabalha em arquivos que casam (por exemplo, <code>src/api/**</code>). É o lugar de "regra que só importa numa pasta".</p>' },
        { tipo: 'texto', html:
          '<h3>Permissões: seis modos e regras por cima</h3>' +
          '<p>O <strong>modo</strong> define o que roda sem perguntar; as <strong>regras</strong> (<code>allow</code>, <code>ask</code>, <code>deny</code>) refinam por ferramenta. A tecla <kbd>Shift</kbd>+<kbd>Tab</kbd> alterna os modos na sessão, e <code>--permission-mode</code> escolhe o modo na partida.</p>' +
          tab(['Modo (valor)', 'Roda sem perguntar', 'Quando usar'], [
            ['Manual (<code>default</code>)', 'Só leituras', 'Código desconhecido, trabalho sensível'],
            ['<code>acceptEdits</code>', 'Leituras, edições e comandos de sistema de arquivos comuns (<code>mkdir</code>, <code>mv</code>, <code>cp</code>)', 'Iterar num código que você vai revisar'],
            ['<code>plan</code>', 'Leituras; edições bloqueadas até você aprovar o plano', 'Explorar antes de mudar'],
            ['<code>auto</code>', 'Tudo, com um classificador (segundo modelo) revisando as ações', 'Tarefas longas, menos interrupções'],
            ['<code>dontAsk</code>', 'Só leituras e o que a lista de permissões libera; o resto é negado', 'CI e scripts travados'],
            ['<code>bypassPermissions</code>', 'Tudo', 'Somente contêiner ou VM isolados']
          ]) +
          '<p>Nas versões recentes (2.1.283 ou mais nova) uma sessão de terminal começa em <code>auto</code> quando o modo está disponível para a conta; antes disso, o padrão podia ser Manual. Confira na barra de status. <code>claude -p</code> e o Agent SDK começam em <code>default</code>.</p>' +
          '<p>Regras seguem <code>Ferramenta</code> ou <code>Ferramenta(especificador)</code>, e a ordem de avaliação é <strong>deny, depois ask, depois allow</strong>: a primeira que casa decide, e um allow específico não abre exceção dentro de um deny amplo. Em Bash, o <code>*</code> casa qualquer texto, inclusive espaços, e o espaço antes do <code>*</code> final faz parte da regra: <code>Bash(ls *)</code> casa <code>ls -la</code> mas não <code>lsof</code>. Rode <code>/permissions</code> para ver e editar as regras e de qual arquivo cada uma vem. O exemplo abaixo vai em <code>.claude/settings.json</code>, versionado para o time.</p>' },
        { tipo: 'codigo', linguagem: 'json', texto: [
          '{',
          '  "permissions": {',
          '    "allow": ["Bash(uv run pytest *)", "Bash(git diff *)"],',
          '    "deny":  ["Read(./.env)", "Bash(git push *)"]',
          '  }',
          '}'
        ].join('\n') },
        { tipo: 'callout', tom: 'danger', titulo: 'Duas armadilhas que a própria documentação registra', html:
          '<ul><li><strong>CLAUDE.md não é cerca.</strong> "Nunca edite migrations/" no arquivo orienta o modelo, mas não muda o que o Claude Code permite. Para impedir, use regra de permissão ou um hook <code>PreToolUse</code> (aula 2).</li>' +
          '<li><strong>Regra Bash casa o texto do comando.</strong> A documentação avisa que <code>Bash(git push *)</code> não casa <code>git -C . push</code>. Regra de Bash reduz risco; fronteira de verdade é sandbox ou contêiner.</li></ul>' },
        { tipo: 'complete', id: 'cc1-complete-settings', titulo: 'Monte o settings.json do time', obrigatorio: false, linguagem: 'json',
          enunciado: 'Complete o arquivo para que o projeto rode os testes sem perguntar, nunca leia o <code>.env</code> e <strong>comece em modo de plano</strong>. Escolha o trecho certo em cada lacuna.',
          partes: [
            '{\n  "permissions": {\n    "defaultMode": "', { lacuna: 'modo', opcoes: ['plan', 'auto', 'bypassPermissions'], correta: 'plan' },
            '",\n    "allow": ["Bash(', { lacuna: 'allow', opcoes: ['uv run pytest *', '*', 'uv run pytest'], correta: 'uv run pytest *' },
            ')"],\n    "deny": ["Read(', { lacuna: 'deny', opcoes: ['./.env', 'env', '**'], correta: './.env' },
            ')"]\n  }\n}\n'
          ],
          explicacao: 'O <code>defaultMode</code> <code>plan</code> vale em <code>.claude/settings.json</code>; já <code>auto</code> e <code>bypassPermissions</code> nesse arquivo do projeto não têm efeito (a documentação diz que o valor é ignorado ali). Em <code>Bash(uv run pytest *)</code>, o <code>*</code> final com espaço casa também o comando sem argumentos; sem o <code>*</code>, só o comando exato roda sem perguntar. A regra de leitura usa o caminho do arquivo, <code>Read(./.env)</code>.',
          callout: 'settings.json montado: modo plan por padrão, testes liberados, .env fechado.' },
        { tipo: 'takeaway', html: '<mark>CLAUDE.md orienta</mark>; <mark>modo e regras</mark> decidem o que roda; e <mark>AGENTS.md só é lido</mark> quando não há nenhum arquivo CLAUDE por perto.' }
      ] },

      /* ---------------- Aba 3 ---------------- */
      { rotulo: 'Plano, implementar, revisar', blocos: [
        { tipo: 'texto', html:
          '<h3>O ciclo no Claude Code</h3>' +
          '<p><strong>Plano.</strong> Entre em plan mode com <kbd>Shift</kbd>+<kbd>Tab</kbd>, com <code>claude --permission-mode plan</code> ou com <code>/plan descrição da tarefa</code>. O Claude lê arquivos, roda comandos de exploração e escreve um plano, sem editar o código-fonte. Quando o plano está pronto ele pergunta como seguir: aprovar e entrar em auto, aprovar e revisar cada edição manualmente, ou continuar planejando. <kbd>Ctrl</kbd>+<kbd>G</kbd> abre o plano no seu editor para você alterá-lo antes de aprovar. Nesta etapa o bloqueio de edição vale para sessões de terminal comuns; numa sessão que você iniciou com bypass de permissões disponível, o plan mode não bloqueia as edições.</p>' +
          '<p><strong>Implementar.</strong> Aprovado o plano, o modo muda e as edições começam. Peça lotes pequenos e a execução dos testes a cada lote; o comando de verificação deve estar no CLAUDE.md.</p>' +
          '<p><strong>Revisar.</strong> <code>/diff</code> mostra as mudanças da árvore de trabalho, inclusive as do Claude. <code>/code-review</code> (alias <code>/review</code>) revisa o diff atual ou um PR (<code>/code-review high 1234</code>) e aceita <code>--fix</code>. <code>/security-review</code> analisa o branch atual contra o padrão do <code>origin</code>. Revisão é o ponto em que você lê, não o Claude.</p>' +
          '<h3>Desfazer</h3>' +
          '<p><kbd>Esc</kbd> duas vezes com o prompt vazio (ou <code>/rewind</code>, aliases <code>/checkpoint</code> e <code>/undo</code>) abre o menu de retorno do código e da conversa. O limite que pega gente sênior: arquivo alterado <em>apenas</em> por comandos Bash (um <code>sed -i</code>, um script) não é rastreado; Git continua sendo o desfazer de verdade.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Atalhos que pagam o investimento</h3>' +
          tab(['Atalho', 'O que faz', 'Observação'], [
            ['<kbd>Shift</kbd>+<kbd>Tab</kbd>', 'Alterna modo de permissão', 'De <code>auto</code>, o primeiro toque vai a manual'],
            ['<kbd>Esc</kbd>', 'Interrompe a resposta', 'Mantém o trabalho já feito; você redireciona'],
            ['<kbd>Esc</kbd> <kbd>Esc</kbd>', 'Limpa o rascunho ou abre o rewind', 'Rewind se o prompt estiver vazio'],
            ['<code>@</code>', 'Menciona arquivo com autocompletar', 'Ancora a conversa num arquivo'],
            ['<code>!</code> no início', 'Roda um comando de shell e põe a saída na sessão', 'Útil para colar um erro de teste'],
            ['<kbd>Ctrl</kbd>+<kbd>O</kbd>', 'Alterna o transcript detalhado', 'Mostra chamadas de ferramenta e modelo por mensagem'],
            ['<kbd>Ctrl</kbd>+<kbd>B</kbd>', 'Manda comando ou agente para segundo plano', 'Dois toques no tmux'],
            ['<kbd>Alt</kbd>+<kbd>P</kbd> / <kbd>Option</kbd>+<kbd>P</kbd>', 'Troca de modelo sem apagar o prompt', 'No macOS, a documentação pede Option configurada como Meta no terminal'],
            ['<code>/context</code>, <code>/compact</code>, <code>/clear</code>', 'Ver o uso da janela, resumir, recomeçar', 'Limpe entre tarefas sem relação'],
            ['<code>/btw</code>', 'Pergunta lateral sem entrar no histórico', 'Evita poluir o contexto'],
            ['<code>claude -c</code> / <code>claude -r</code>', 'Continua a última sessão / escolhe uma', 'Dentro da sessão: <code>/resume</code>']
          ]) },
        { tipo: 'ordene', id: 'cc1-ordene-fluxo', titulo: 'Ponha o fluxo na ordem',
          enunciado: 'Uma correção de bug no <code>pedidos-api</code>, do primeiro passo ao último. Ordene.',
          itens: [
            { id: 'diff', texto: 'Ler <code>/diff</code> e rodar <code>/code-review</code> no resultado' },
            { id: 'impl', texto: 'Implementar em lotes pequenos, com <code>uv run pytest -q</code> a cada lote' },
            { id: 'commit', texto: 'Commitar (você pede ou faz) com mensagem de uma linha' },
            { id: 'plano', texto: 'Entrar em plan mode e pedir plano com arquivos, ordem e testes' },
            { id: 'aprova', texto: 'Ler o plano, ajustar com <kbd>Ctrl</kbd>+<kbd>G</kbd> e aprovar' }
          ], solucao: ['plano', 'aprova', 'impl', 'diff', 'commit'],
          dica: 'Nada é editado antes de o plano ser aprovado; revisão antes de commit.',
          tutorDepois: 'Plano, aprovação, implementação em lotes, revisão e commit. A aprovação do plano é o ponto de maior alavancagem: custa uma leitura e evita uma implementação inteira na direção errada.' },
        { tipo: 'transcript', id: 'cc1-transcript', titulo: 'Ache as afirmações sem sustentação', obrigatorio: false, terminalTitulo: 'sessão (exemplo)',
          enunciado: 'Leia a sessão. <strong>Duas</strong> afirmações do agente contradizem o que a documentação diz sobre a ferramenta. Clique nas linhas e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: '/plan Corrigir o arredondamento de total() em src/pricing.py' },
            { quem: 'ferramenta', texto: '⏸ plan mode on' },
            { quem: 'agente', texto: 'Li pricing.py e test_pricing.py. Plano: trocar float por Decimal em total(), adicionar teste de borda para 0,005, rodar o pytest.' },
            { quem: 'agente', texto: 'Enquanto você revisa o plano, já apliquei a troca para Decimal em src/pricing.py.' },
            { quem: 'voce', texto: 'Aprovado. Siga e rode os testes.' },
            { quem: 'ferramenta', texto: '$ uv run pytest -q\n14 passed' },
            { quem: 'agente', texto: 'Ajustei scripts/seed.sql com sed -i. Se não gostar, o /rewind restaura o arquivo.' }
          ],
          erradas: [3, 6],
          explicacao: {
            3: 'em plan mode as edições ficam bloqueadas até você aprovar o plano (a exceção é a sessão iniciada com bypass de permissões disponível). Uma edição "já aplicada" antes da aprovação é sinal de que algo está errado com o modo ou com o relato.',
            6: 'um arquivo alterado só por comandos Bash não é rastreado pelo checkpoint: o <code>/rewind</code> não o restaura. Quem desfaz é o Git.'
          },
          tutorDepois: 'Plano bloqueia edição até a aprovação; rewind cobre edições das ferramentas de edição, não efeitos de shell.' },
        { tipo: 'takeaway', html: 'Plano <mark>antes</mark> de editar, revisão do <mark>diff</mark> antes de commitar, e <mark>Git</mark> como desfazer, porque o rewind não vê o que o <mark>Bash</mark> alterou.' }
      ] },

      /* ---------------- Aba 4 ---------------- */
      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'cc1-escolha-migrations', titulo: 'Confira: a regra que o modelo ignorou',
          pergunta: 'O <code>CLAUDE.md</code> diz "nunca edite <code>migrations/</code>", e numa sessão o Claude editou um arquivo ali. O que a documentação do Claude Code manda fazer para a regra valer sempre?',
          opcoes: [
            opc('a', 'Repetir a regra em maiúsculas e com mais exemplos no CLAUDE.md', false, 'continua sendo contexto: reduz a chance, não impede.'),
            opc('b', 'Impor a regra fora do modelo: regra de permissão que nega a edição ou um hook <code>PreToolUse</code> que bloqueia', true, 'a documentação separa as camadas: CLAUDE.md orienta; permissões e hooks são aplicados pelo Claude Code, não pelo modelo.'),
            opc('c', 'Mudar o arquivo para <code>CLAUDE.local.md</code>', false, 'mesmo tipo de arquivo, mesma natureza de contexto, e ainda desliga a leitura do AGENTS.md.'),
            opc('d', 'Rodar a sessão em <code>bypassPermissions</code> para o modelo ficar mais cuidadoso', false, 'o efeito é o oposto: nenhuma verificação.')
          ], tutorDepois: 'Orientação no arquivo, garantia na permissão ou no hook.' },
        { tipo: 'escolha', id: 'cc1-escolha-agents', titulo: 'Confira: o AGENTS.md que sumiu',
          pergunta: 'O repositório do time usa <code>AGENTS.md</code> como fonte de instruções e o Claude Code estava lendo-o. Você cria um <code>CLAUDE.local.md</code> com preferências pessoais e o Claude deixa de seguir o <code>AGENTS.md</code>. Qual é a causa e o conserto mais simples?',
          opcoes: [
            opc('a', 'O <code>CLAUDE.local.md</code> conta como arquivo CLAUDE; crie um <code>CLAUDE.md</code> com <code>@AGENTS.md</code> ou mude "Project instructions" para <code>claude-md-and-agents-md</code>', true, 'o AGENTS.md só é lido quando não há CLAUDE.md, .claude/CLAUDE.md nem CLAUDE.local.md; importar ou mudar a configuração restaura a leitura.'),
            opc('b', 'O <code>AGENTS.md</code> foi corrompido; rode <code>/init</code> de novo', false, 'o arquivo não mudou; mudou a regra de qual arquivo é lido.'),
            opc('c', 'O Claude Code só lê <code>AGENTS.md</code> em modo auto', false, 'não há relação com o modo de permissão.'),
            opc('d', 'Renomeie para <code>AGENTS.override.md</code>', false, 'o Claude Code não lê <code>AGENTS.override.md</code>.')
          ], tutorDepois: 'Um CLAUDE.md de uma linha com @AGENTS.md mantém a fonte única e funciona em qualquer versão.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Equivalente nas outras ferramentas</h3>' +
          '<p class="ta-nota">Colunas verificadas em 09/11/2026 (Claude Code e Codex CLI). Cursor e OpenCode: veja a aula "Onde fica cada coisa" da Trilha rápida (verificada em 12/10/2026, revalide).</p>' +
          tab(['Recurso', 'Claude Code', 'Codex CLI'], [
            ['Instalar', '<code>curl -fsSL https://claude.ai/install.sh | bash</code>; Homebrew e WinGet', '<code>curl -fsSL https://chatgpt.com/codex/install.sh | sh</code>; <code>npm install -g @openai/codex</code>; <code>brew install --cask codex</code>'],
            ['Instruções do projeto', '<code>CLAUDE.md</code> (lê <code>AGENTS.md</code> só se não houver CLAUDE.md); <code>.claude/rules/</code>', '<code>AGENTS.md</code> da raiz ao diretório atual, com <code>AGENTS.override.md</code>; limite de 32 KiB'],
            ['Permissões', 'Seis modos + regras allow, ask, deny; <code>/permissions</code>', '<code>sandbox_mode</code> × <code>approval_policy</code>; <code>/permissions</code>'],
            ['Modo de plano', '<kbd>Shift</kbd>+<kbd>Tab</kbd> ou <code>/plan</code>', '<code>/plan</code>'],
            ['Revisar', '<code>/diff</code>, <code>/code-review</code>, <code>/security-review</code>', '<code>/diff</code>, <code>/review</code>, <code>codex review</code>'],
            ['Desfazer', '<code>/rewind</code> (não vê efeitos de Bash) e Git', 'Git: a documentação recomenda checkpoints antes e depois da tarefa'],
            ['Retomar', '<code>claude -c</code>, <code>claude -r</code>, <code>/resume</code>', '<code>codex resume</code>, <code>/resume</code>']
          ]) },
        { tipo: 'takeaway', html: 'Troque de ferramenta sem reaprender o <mark>método</mark>: muda o <mark>endereço</mark> (arquivo e comando), não o ciclo <mark>plano, implementação, revisão</mark>.' }
      ] }
    ]
  });
})();
