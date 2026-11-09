/* Ferramentas · Codex 1 · "Codex CLI do zero ao dia a dia". Fatos de produto verificados em 09/11/2026 na documentação oficial (learn.chatgpt.com/docs, que hospeda a documentação do Codex, e repositório openai/codex); tabela de fontes e prazos em ferramentas/fontes/codex.md. Saídas de sessão são rotuladas "exemplo": a ferramenta muda de versão e de texto. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tab(cab, linhas) {
    return '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  var VERIF = '<p class="ta-nota">Verificado em 09/11/2026 na documentação oficial do Codex (CLI, app do ChatGPT e extensão de IDE compartilham o mesmo <code>config.toml</code>). Esta aula trata do <strong>Codex CLI</strong>. Nomes de modelo e planos mudam depressa e ficam na aula 2.</p>';

  TrilhaAula.registrar({
    id: 'fer-codex-1',
    titulo: 'Codex CLI do zero ao dia a dia',
    minutos: 35,
    resumo: 'Instalar o Codex CLI, entrar, escrever o AGENTS.md, combinar sandbox e aprovação e fechar o ciclo plano, implementação e revisão no terminal.',
    objetivo: 'Instalar e autenticar o Codex CLI, estruturar o AGENTS.md (global, raiz e override por pasta), escolher a combinação de sandbox e aprovação para cada situação e conduzir plano, implementação e revisão com os comandos da ferramenta.',
    revisao: [
      { id: 'cx1-auto', pergunta: 'O que significa o preset "Auto" do Codex CLI?',
        opcoes: [
          opc('a', '<code>--sandbox workspace-write --ask-for-approval on-request</code>: lê, edita e roda comandos no diretório de trabalho; pede aprovação para editar fora dele ou usar rede', true, 'rede vem desligada por padrão no sandbox local.'),
          opc('b', 'Nenhum sandbox e nenhuma aprovação', false, 'isso é <code>--dangerously-bypass-approvals-and-sandbox</code> (alias <code>--yolo</code>).'),
          opc('c', 'Somente leitura com aprovação em tudo', false, 'esse é o <code>read-only</code>.')] },
      { id: 'cx1-agents', pergunta: 'Rodando o Codex dentro de <code>services/payments/</code>, que tem <code>AGENTS.md</code> e <code>AGENTS.override.md</code>, quais instruções entram?',
        opcoes: [
          opc('a', 'Global, <code>AGENTS.md</code> da raiz e o <code>AGENTS.override.md</code> da pasta (o <code>AGENTS.md</code> dessa pasta é ignorado), concatenados com o mais próximo por último', true, 'no máximo um arquivo por diretório; o override tem precedência sobre o AGENTS.md do mesmo diretório.'),
          opc('b', 'Só o da pasta atual', false, 'a cadeia vai da raiz do projeto até o diretório atual.'),
          opc('c', 'Os dois arquivos da pasta, porque o override soma', false, 'ele substitui, não soma.')] },
      { id: 'cx1-protegidos', pergunta: 'No sandbox <code>workspace-write</code> padrão, o Codex pode editar <code>.codex/</code> e <code>.git/</code> dentro do projeto?',
        opcoes: [
          opc('a', 'Não: <code>.git</code>, <code>.agents</code>, <code>.codex</code> e <code>.aws</code> são somente leitura mesmo dentro da raiz gravável', true, 'a proteção é recursiva.'),
          opc('b', 'Sim, tudo dentro do workspace é gravável', false, 'há exceções protegidas.'),
          opc('c', 'Só com <code>--yolo</code> no projeto', false, 'o caminho certo é você mesmo editar esses arquivos, fora da sessão do agente.')] },
      { id: 'cx1-plan', pergunta: 'Você quer que o Codex só leia e proponha, sem editar nada. O que garante isso?',
        opcoes: [
          opc('a', 'Trocar para <code>read-only</code> com <code>/permissions</code> (ou <code>--sandbox read-only</code>)', true, 'o sandbox é a garantia técnica; pedir "não edite" no prompt ou usar <code>/plan</code> orienta, mas não impede.'),
          opc('b', 'Usar <code>--ask-for-approval never</code>', false, '<code>never</code> corta as perguntas: com <code>workspace-write</code> ele edita sem pedir.'),
          opc('c', 'Escrever "não edite" no AGENTS.md', false, 'instrução não é barreira.')] },
      { id: 'cx1-semgit', pergunta: 'Você abre o Codex numa pasta que não está sob controle de versão. Que modo ele recomenda?',
        opcoes: [
          opc('a', '<code>read-only</code>; em repositório Git ele recomenda o preset Auto', true, 'sem Git você perde o desfazer barato, e a recomendação acompanha isso.'),
          opc('b', 'Auto, igual em qualquer pasta', false, 'a recomendação depende do controle de versão.'),
          opc('c', 'Acesso total', false, 'nunca é a recomendação padrão.')] }
    ],
    abas: [

      /* ---------------- Aba 1 ---------------- */
      { rotulo: 'Instalar e entrar', blocos: [
        { tipo: 'texto', html:
          '<p>Os conceitos (arquivo de instruções, sandbox, aprovação, hooks, MCP) estão na Trilha rápida, aulas 01 e 10. Aqui o assunto é como o <strong>Codex CLI</strong>, o agente de código da OpenAI que roda localmente no seu terminal, os implementa. Os exemplos usam um projeto Python (<code>uv</code>, <code>pytest</code>, <code>ruff</code>) dentro de um repositório Git.</p>' + VERIF +
          '<h3>Instalar</h3>' +
          tab(['Método', 'Instalar', 'Atualizar'], [
            ['Instalador (macOS, Linux)', '<code>curl -fsSL https://chatgpt.com/codex/install.sh | sh</code>', 'Rodar o mesmo comando'],
            ['Instalador (Windows PowerShell)', '<code>powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"</code>', 'Rodar o mesmo comando'],
            ['npm', '<code>npm install -g @openai/codex</code>', 'Mesmo comando'],
            ['Homebrew', '<code>brew install --cask codex</code>', '<code>brew upgrade --cask codex</code>']
          ]) +
          '<p>O instalador baixa de <code>releases.openai.com</code> e cai para o GitHub Releases se o download falhar; para forçar o GitHub, defina <code>CODEX_INSTALLER_USE_RELEASES_OPENAI_COM=false</code>. Também há binários em <code>github.com/openai/codex/releases</code>.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# macOS / Linux',
          'curl -fsSL https://chatgpt.com/codex/install.sh | sh',
          '',
          'cd pedidos-api   # dentro de um repositório Git',
          'codex            # primeira execução: escolha "Sign in with ChatGPT"'
        ].join('\n') },
        { tipo: 'codigo', linguagem: 'powershell', texto: [
          '# Windows PowerShell',
          'powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"',
          'cd pedidos-api',
          'codex'
        ].join('\n') },
        { tipo: 'texto', html:
          '<h3>Autenticar: dois caminhos, políticas diferentes</h3>' +
          '<p>Há duas formas de entrar: <strong>Sign in with ChatGPT</strong> (assinatura Plus, Pro, Business, Edu ou Enterprise; é a recomendada e a única aceita pelo Codex na nuvem) e <strong>API key</strong> (cobrança por uso). A escolha define as políticas aplicadas: com ChatGPT valem as permissões, retenção e residência do seu workspace; com API key valem as configurações da sua organização de API. Na CLI, <code>codex login</code> abre o fluxo no navegador, <code>printenv OPENAI_API_KEY | codex login --with-api-key</code> usa a chave e <code>codex login status</code> mostra o método ativo. Trate <code>~/.codex/auth.json</code> como senha. Em máquinas sem navegador a documentação descreve autenticação por código de dispositivo (marcada como beta) e alternativas.</p>' },
        { tipo: 'rode', id: 'cx1-rode-inicio', titulo: 'Da instalação ao modo recomendado',
          enunciado: 'Saída de exemplo: o texto exato muda com a versão. A última etapa mostra o que o Codex recomenda em cada tipo de pasta.',
          prefixo: '$', entrada: 'cd ~/tmp/rascunho && codex', unidade: 's', terminalTitulo: 'codex (exemplo)',
          prever: { pergunta: 'Você abre o <code>codex</code> numa pasta que <strong>não</strong> é repositório Git. Que modo de permissão ele recomenda?', opcoes: [
            opc('a', '<code>read-only</code>', true, 'na partida o Codex detecta se a pasta está sob controle de versão: recomenda Auto (workspace-write + on-request) em repositório Git e read-only fora dele.'),
            opc('b', 'Auto, como em qualquer pasta', false, 'a recomendação muda conforme o controle de versão.'),
            opc('c', 'Acesso total, porque não há nada a perder', false, 'o acesso total nunca é a recomendação padrão.')
          ] },
          etapas: [
            { id: 'inst', nome: 'Instalar', descricao: 'Instalador padrão', tom: 'dns', ms: 20, linhas: [
              L('cmd', 'curl -fsSL https://chatgpt.com/codex/install.sh | sh'),
              L('info', 'baixa de releases.openai.com; cai para GitHub Releases se falhar') ] },
            { id: 'login', nome: 'Primeiro login', descricao: 'Escolha o método de entrada', tom: 'tcp', ms: 25, linhas: [
              L('cmd', 'cd pedidos-api && codex'),
              L('out', 'Sign in with ChatGPT   |   outro método disponível'),
              L('hint', 'API key: printenv OPENAI_API_KEY | codex login --with-api-key') ] },
            { id: 'perg', nome: 'Primeira tarefa', descricao: 'Pergunta de leitura, nada é editado', tom: 'tls', ms: 20, linhas: [
              L('in', 'Tell me about this project'),
              L('out', 'Lê pyproject.toml, src/ e tests/; resume: API FastAPI de pedidos, Pydantic v2, SQLAlchemy 2, testes com pytest.'),
              L('hint', 'crie um checkpoint Git antes e depois de cada tarefa: é o seu desfazer') ] },
            { id: 'status', nome: 'Conferir o ambiente', descricao: '/status e /permissions', tom: 'request', ms: 4, linhas: [
              L('in', '/status'),
              L('out', 'modelo ativo, política de aprovação, writable roots, uso de tokens'),
              L('hint', 'o workspace inclui o diretório atual e temporários como /tmp') ] },
            { id: 'modo', nome: 'Modo recomendado por pasta', descricao: 'Git → Auto; sem Git → read-only', tom: 'response', ms: 3, linhas: [
              L('info', '~/pedidos-api (repositório Git)  →  recomenda Auto: workspace-write + on-request'),
              L('info', '~/tmp/rascunho (sem Git)         →  recomenda read-only'),
              L('hint', 'sem confiar no diretório, o Codex pode começar em read-only até você aprovar') ] }
          ],
          tutorDepois: 'Instalar, entrar, perguntar e ler o ambiente: nenhum passo edita arquivo. O modo recomendado depende de a pasta ter controle de versão, porque o desfazer barato é o Git.',
          callout: 'Você percorreu a primeira sessão e viu como o Codex escolhe o modo por pasta.' },
        { tipo: 'takeaway', html: 'Entre com <mark>ChatGPT</mark> ou <mark>API key</mark> sabendo que a escolha muda as <mark>políticas</mark>, e use o Codex em <mark>repositório Git</mark> para ter desfazer.' }
      ] },

      /* ---------------- Aba 2 ---------------- */
      { rotulo: 'AGENTS.md e permissões', blocos: [
        { tipo: 'texto', html:
          '<h3>AGENTS.md: a cadeia de instruções</h3>' +
          '<p>O Codex monta a cadeia de instruções <strong>uma vez por execução</strong> (na TUI, uma vez por sessão). A ordem:</p>' +
          '<ol><li><strong>Global.</strong> Em <code>~/.codex</code> (ou <code>CODEX_HOME</code>) lê <code>AGENTS.override.md</code> se existir; senão, <code>AGENTS.md</code>. Só o primeiro não vazio.</li>' +
          '<li><strong>Projeto.</strong> Da raiz do projeto (normalmente a raiz do Git) até o diretório atual, em cada pasta procura <code>AGENTS.override.md</code>, depois <code>AGENTS.md</code>, depois os nomes de <code>project_doc_fallback_filenames</code>. No máximo um arquivo por diretório.</li>' +
          '<li><strong>Junção.</strong> Concatena da raiz para baixo, separados por linha em branco; o mais próximo do diretório atual vem por último e por isso prevalece.</li></ol>' +
          '<p>Arquivos vazios são pulados, e a leitura para quando o total atinge <code>project_doc_max_bytes</code>, 32 KiB por padrão: ao bater no teto, suba o limite ou divida em pastas. <code>/init</code> gera um esqueleto de <code>AGENTS.md</code> no diretório atual. Para provar o que foi carregado, a documentação sugere um teste sem aprovações:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# do diretório do serviço, peça a lista das fontes carregadas',
          'codex --cd services/payments --ask-for-approval never "Liste as fontes de instrução que você carregou."',
          '# esperado: o global primeiro, o AGENTS.md da raiz depois, o override de payments por último'
        ].join('\n') },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          '# AGENTS.md  (raiz do repositório)',
          '',
          '## Comandos',
          '- Testes: `uv run pytest -q`',
          '- Lint e tipos: `uv run ruff check . && uv run mypy --strict src`',
          '',
          '## Convenções',
          '- Pydantic v2 nas fronteiras; handlers FastAPI em `src/api/handlers/`.',
          '- Migrações só via `uv run alembic revision --autogenerate`.'
        ].join('\n') },
        { tipo: 'texto', html:
          '<h3>Sandbox e aprovação: dois controles independentes</h3>' +
          '<p>O <strong>sandbox</strong> (aplicado pelo sistema operacional) diz o que o Codex consegue fazer tecnicamente: onde escreve, se alcança a rede. A <strong>política de aprovação</strong> diz quando ele para para perguntar. Mudar quem aprova não amplia o sandbox. Na CLI e na extensão de IDE o padrão é <strong>sem rede</strong> e escrita limitada ao workspace.</p>' +
          tab(['Intenção', 'Flags', 'Efeito'], [
            ['Auto (preset)', 'sem flags, ou <code>--sandbox workspace-write --ask-for-approval on-request</code>', 'Lê, edita e roda comandos no workspace; pede aprovação para editar fora ou usar rede'],
            ['Leitura segura', '<code>--sandbox read-only --ask-for-approval on-request</code>', 'Lê e roda comandos dentro do sandbox somente leitura; o que sair dele pode pedir aprovação'],
            ['Leitura em CI', '<code>--sandbox read-only --ask-for-approval never</code>', 'Nunca pergunta'],
            ['Revisor automático', '<code>-c approvals_reviewer=auto_review</code>', 'Mesmo sandbox; pedidos elegíveis vão a um agente revisor, o que gasta uso extra'],
            ['Sem barreiras', '<code>--dangerously-bypass-approvals-and-sandbox</code> (<code>--yolo</code>)', 'Sem sandbox e sem aprovação; só em VM descartável']
          ]) +
          '<p>Dentro da sessão, <code>/permissions</code> relaxa ou aperta o modo; <code>/status</code> mostra política, <em>writable roots</em> e uso. Mesmo no <code>workspace-write</code>, quatro pastas dentro da raiz gravável continuam <strong>somente leitura</strong>: <code>.git</code>, <code>.agents</code>, <code>.codex</code> e <code>.aws</code>. Regras de comando (<code>.rules</code>, na aula 2) e hooks complementam o sandbox.</p>' },
        { tipo: 'texto', html:
          '<h3>config.toml e precedência</h3>' +
          '<p>As preferências ficam em <code>~/.codex/config.toml</code>, com sobreposições por projeto em <code>.codex/config.toml</code> (só carregadas quando o projeto é confiável). Ordem de precedência, do mais forte ao mais fraco: flags e <code>-c chave=valor</code>, configuração do projeto (a mais próxima do diretório atual vence), arquivo de perfil escolhido com <code>--profile nome</code> (<code>~/.codex/nome.config.toml</code>), config do usuário, config gerenciada na nuvem, <code>/etc/codex/config.toml</code> e padrões embutidos. Se você marcar o projeto como não confiável, o Codex pula as camadas <code>.codex/</code> dele (config, hooks e regras).</p>' },
        { tipo: 'complete', id: 'cx1-complete-config', titulo: 'Monte o config.toml do preset Auto', obrigatorio: false, linguagem: 'toml',
          enunciado: 'Escreva a configuração equivalente ao preset <strong>Auto</strong>, com a rede dentro do workspace explicitamente desligada.',
          partes: [
            '# ~/.codex/config.toml\napproval_policy = "', { lacuna: 'aprov', opcoes: ['on-request', 'untrusted', 'never'], correta: 'on-request' },
            '"\nsandbox_mode = "', { lacuna: 'sandbox', opcoes: ['workspace-write', 'read-only', 'danger-full-access'], correta: 'workspace-write' },
            '"\n\n[sandbox_workspace_write]\nnetwork_access = ', { lacuna: 'rede', opcoes: ['false', 'true'], correta: 'false' }, '\n'
          ],
          explicacao: '<code>on-request</code> mais <code>workspace-write</code> é o preset Auto. <code>untrusted</code> é uma política <strong>aposentada</strong>: mantê-la na configuração pode impedir o Codex de iniciar (a documentação manda removê-la e usar <code>on-request</code> com <code>read-only</code>, ou marcar o projeto com <code>trust_level = "untrusted"</code> em <code>[projects."/caminho"]</code>). <code>never</code> corta as perguntas, e <code>danger-full-access</code> remove o sandbox. A rede dentro do <code>workspace-write</code> é opção explícita; <code>false</code> deixa o padrão claro.',
          callout: 'config.toml montado: preset Auto, sem rede, sem a política aposentada.' },
        { tipo: 'takeaway', html: 'O <mark>AGENTS.md mais próximo</mark> vence, o <mark>sandbox</mark> é a barreira técnica e a <mark>aprovação</mark> só decide quando perguntar.' }
      ] },

      /* ---------------- Aba 3 ---------------- */
      { rotulo: 'Plano, implementar, revisar', blocos: [
        { tipo: 'texto', html:
          '<h3>O ciclo no Codex CLI</h3>' +
          '<p><strong>Checkpoint.</strong> A documentação recomenda criar checkpoints Git antes e depois de cada tarefa para poder reverter. Não encontrei na documentação consultada um equivalente ao rebobinar de arquivos do Claude Code; o Git é o desfazer.</p>' +
          '<p><strong>Plano.</strong> <code>/plan</code> troca o chat para modo de plano e aceita um prompt na mesma linha (<code>/plan Propor a migração do módulo de preços</code>). Fica indisponível enquanto o Codex já está trabalhando. O modo de plano orienta; para <em>garantir</em> que nada é editado, combine com <code>read-only</code> em <code>/permissions</code>.</p>' +
          '<p><strong>Implementar.</strong> No preset Auto o Codex edita e roda os testes dentro do workspace e para quando precisa de rede ou de escrita fora dele. Enquanto ele trabalha, <kbd>Enter</kbd> injeta uma instrução na rodada atual e <kbd>Tab</kbd> enfileira um prompt, comando ou slash command para a próxima. <code>/goal objetivo</code> prende uma meta persistente ao chat em tarefas longas (até 4.000 caracteres; <code>/goal pause</code>, <code>resume</code> e <code>clear</code> controlam).</p>' +
          '<p><strong>Revisar.</strong> <code>/diff</code> mostra o diff do Git, inclusive arquivos ainda não rastreados. <code>/review</code> pede uma revisão da árvore de trabalho; fora da sessão, <code>codex review --uncommitted</code>, <code>--base BRANCH</code> ou <code>--commit SHA</code> revisam o alvo escolhido e reportam achados priorizados <em>sem modificar</em> a árvore de trabalho.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Atalhos e comandos que pagam o investimento</h3>' +
          tab(['Atalho ou comando', 'O que faz', 'Observação'], [
            ['<code>@</code>', 'Busca arquivo no workspace e coloca o caminho no prompt', 'Também <code>/mention</code>'],
            ['<code>!</code> no início', 'Roda um comando local sob o sandbox e a aprovação atuais', 'Cuidado: mesmas regras de permissão'],
            ['<kbd>Enter</kbd> / <kbd>Tab</kbd> durante o trabalho', 'Injeta instrução / enfileira para o próximo turno', 'Útil para corrigir a rota sem esperar'],
            ['<kbd>Esc</kbd> <kbd>Esc</kbd>', 'Com o compositor vazio, edita a mensagem anterior e faz fork do chat', 'Voltar a um ponto sem perder o original'],
            ['<kbd>Ctrl</kbd>+<kbd>R</kbd>', 'Busca no histórico de prompts', '<kbd>Enter</kbd> usa; <kbd>Esc</kbd> cancela'],
            ['<kbd>Ctrl</kbd>+<kbd>O</kbd> ou <code>/copy</code>', 'Copia a última resposta', '<code>/copy</code> deixa escolher bloco ou citação'],
            ['<code>/status</code>, <code>/compact</code>, <code>/recap</code>', 'Ver ambiente e tokens; resumir o chat; resumo sem compactar', '<code>/compact</code> após execuções longas'],
            ['<code>/new</code>, <code>/clear</code>, <code>/fork</code>', 'Chat novo; limpar e começar; ramificar o chat atual', 'Fork explora outra abordagem'],
            ['<code>codex resume</code>, <code>/resume</code>', 'Reabre um chat salvo do repositório atual', 'Também <code>codex exec resume --last</code> em automação'],
            ['<code>/side</code> ou <code>/btw</code>', 'Pergunta lateral efêmera', 'Não entra no transcript principal'],
            ['<code>/model</code>, <code>/permissions</code>', 'Modelo e esforço; permissões', 'Valem para a sessão']
          ]) },
        { tipo: 'ordene', id: 'cx1-ordene-fluxo', titulo: 'Ponha o fluxo na ordem',
          enunciado: 'Uma mudança no <code>pedidos-api</code> com o Codex CLI, do primeiro passo ao último. Ordene.',
          itens: [
            { id: 'diff', texto: 'Ler <code>/diff</code> e rodar <code>/review</code> sobre o resultado' },
            { id: 'plano', texto: 'Pedir <code>/plan</code> com a tarefa e ler o plano' },
            { id: 'commit', texto: 'Commitar com mensagem de uma linha' },
            { id: 'chk', texto: 'Criar um checkpoint Git (commit ou stash) antes de começar' },
            { id: 'impl', texto: 'Deixar implementar no modo Auto, rodando <code>uv run pytest -q</code> a cada lote' }
          ], solucao: ['chk', 'plano', 'impl', 'diff', 'commit'],
          dica: 'O checkpoint vem antes de qualquer edição; revisão antes do commit.',
          tutorDepois: 'Checkpoint, plano, implementação em lotes, revisão e commit. No Codex o Git faz o papel do desfazer, então o checkpoint é o primeiro passo, não o último.' },
        { tipo: 'transcript', id: 'cx1-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'sessão (exemplo)',
          enunciado: 'Sessão no preset Auto. Uma afirmação do agente contradiz o que a documentação diz sobre o sandbox. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Rode os testes. Se falharem por falta de dependência, instale-a.' },
            { quem: 'ferramenta', texto: '$ uv run pytest -q\nModuleNotFoundError: No module named httpx' },
            { quem: 'agente', texto: 'Vou instalar o httpx. Isso precisa de rede, que vem desligada no sandbox padrão, então preciso da sua aprovação.' },
            { quem: 'voce', texto: 'Aprovado.' },
            { quem: 'agente', texto: 'Instalado. Gravei a decisão em .codex/config.toml do projeto para não perguntar de novo.' },
            { quem: 'ferramenta', texto: '$ uv run pytest -q\n14 passed' }
          ],
          erradas: [4],
          explicacao: { 4: 'no sandbox <code>workspace-write</code> a pasta <code>.codex</code> dentro da raiz gravável é somente leitura (assim como <code>.git</code>, <code>.agents</code> e <code>.aws</code>). O agente não consegue gravar ali: ou a afirmação é falsa, ou algo saiu do sandbox sem você perceber. Configuração persistente do projeto é você que edita.' },
          tutorDepois: 'Rede desligada e pastas de configuração protegidas: duas razões pelas quais "ele salvou a decisão" merece desconfiança.' },
        { tipo: 'takeaway', html: 'No Codex o <mark>checkpoint Git</mark> vem antes, o <mark>/plan orienta</mark> mas só o <mark>sandbox garante</mark>, e <mark>/diff e /review</mark> fecham o ciclo.' }
      ] },

      /* ---------------- Aba 4 ---------------- */
      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'cx1-escolha-cadeia', titulo: 'Confira: qual arquivo vale',
          pergunta: 'A raiz tem <code>AGENTS.md</code>. Em <code>services/payments/</code> existem <code>AGENTS.md</code> e <code>AGENTS.override.md</code>. Você roda o Codex dentro de <code>services/payments/</code>. O que o Codex carrega do projeto?',
          opcoes: [
            opc('a', 'Só o <code>AGENTS.override.md</code> de payments', false, 'a cadeia também traz o arquivo da raiz.'),
            opc('b', 'O <code>AGENTS.md</code> da raiz e o <code>AGENTS.override.md</code> de payments, nessa ordem; o <code>AGENTS.md</code> de payments é ignorado', true, 'no máximo um arquivo por diretório e o override substitui o AGENTS.md do mesmo diretório; o mais próximo vem por último e prevalece.'),
            opc('c', 'Os três, somados', false, 'só um por diretório entra.'),
            opc('d', 'Só o da raiz, porque o Codex ignora subpastas', false, 'ele desce da raiz até o diretório atual.')
          ], tutorDepois: 'Raiz para baixo, um arquivo por pasta, override vence o AGENTS.md irmão e o mais próximo fica por último.' },
        { tipo: 'escolha', id: 'cx1-escolha-readonly', titulo: 'Confira: só ler e propor',
          pergunta: 'Você quer que o Codex leia o repositório e proponha uma refatoração sem editar nada, com garantia técnica. Qual a configuração correta?',
          opcoes: [
            opc('a', '<code>--ask-for-approval never</code>', false, '<code>never</code> corta as perguntas; com <code>workspace-write</code> ele edita sem pedir.'),
            opc('b', 'Escrever "não edite arquivos" no <code>AGENTS.md</code>', false, 'é orientação, não barreira.'),
            opc('c', '<code>--sandbox read-only</code> (ou <code>/permissions</code> para read-only), com <code>/plan</code> se quiser o plano', true, 'o sandbox de leitura é a garantia; o <code>/plan</code> estrutura a resposta.'),
            opc('d', '<code>--yolo</code>, que deixa o Codex mais cuidadoso', false, 'remove sandbox e aprovação.')
          ], tutorDepois: 'Barreira é sandbox. Aprovação e instrução só mudam quando ele pergunta e o que ele tenta.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Equivalente nas outras ferramentas</h3>' +
          '<p class="ta-nota">Codex CLI e Claude Code verificados em 09/11/2026. Para Cursor e OpenCode, a aula "Onde fica cada coisa" da Trilha rápida (12/10/2026; revalide).</p>' +
          tab(['Recurso', 'Codex CLI', 'Claude Code'], [
            ['Instalar', '<code>curl -fsSL https://chatgpt.com/codex/install.sh | sh</code>; npm; Homebrew', '<code>curl -fsSL https://claude.ai/install.sh | bash</code>; Homebrew; WinGet'],
            ['Instruções do projeto', '<code>AGENTS.md</code> da raiz ao diretório atual, com <code>AGENTS.override.md</code>; 32 KiB', '<code>CLAUDE.md</code> (lê <code>AGENTS.md</code> só se não houver CLAUDE.md); <code>.claude/rules/</code>'],
            ['Permissões', '<code>sandbox_mode</code> × <code>approval_policy</code>; <code>/permissions</code>', 'Seis modos + regras allow, ask, deny; <code>/permissions</code>'],
            ['Modo de plano', '<code>/plan</code> (orienta; read-only garante)', '<kbd>Shift</kbd>+<kbd>Tab</kbd> ou <code>/plan</code> (bloqueia edições até aprovar)'],
            ['Revisar', '<code>/diff</code>, <code>/review</code>, <code>codex review --uncommitted</code>', '<code>/diff</code>, <code>/code-review</code>, <code>/security-review</code>'],
            ['Desfazer', 'Git (checkpoints antes e depois)', '<code>/rewind</code> (não vê efeitos de Bash) e Git'],
            ['Retomar', '<code>codex resume</code>, <code>/resume</code>, <code>/fork</code>', '<code>claude -c</code>, <code>claude -r</code>, <code>/resume</code>']
          ]) },
        { tipo: 'takeaway', html: 'Mesmo ciclo, outro <mark>endereço</mark>: <mark>AGENTS.md</mark>, <mark>config.toml</mark> e o par <mark>sandbox + aprovação</mark> substituem CLAUDE.md, settings.json e modos de permissão.' }
      ] }
    ]
  });
})();
