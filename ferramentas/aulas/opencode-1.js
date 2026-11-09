/* Ferramentas · OpenCode 1. Fatos verificados em 09/11/2026 (docs V2 em opencode.ai/docs, npm @opencode/cli 2.2.6). Fontes: ferramentas/fontes/opencode.md */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tabela(cab, linhas) {
    return { tipo: 'texto', largo: true, html: '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' };
  }

  TrilhaAula.registrar({
    id: 'fer-opencode-1',
    titulo: 'OpenCode do zero ao dia a dia',
    minutos: 35,
    resumo: 'OpenCode é um agente de código aberto, independente de provedor, com cliente e serviço separados. A versão atual (V2) mudou nomes de chaves e deixou o agente build mais permissivo que o esperado: o que você vai configurar primeiro é a permissão.',
    objetivo: 'Instalar o OpenCode V2, conectar um provedor, escrever o AGENTS.md e as permissões de um projeto Python, conduzir plano, build e revisão com os atalhos certos e reconhecer o que mudou da V1 para a V2.',
    revisao: [
      { id: 'oc1-agents', pergunta: 'Um repositório só tem <code>CLAUDE.md</code>. O que o OpenCode V2 carrega como instruções do projeto?',
        opcoes: [
          opc('a', 'Nada do projeto: a V2 reconhece só <code>AGENTS.md</code>', true, 'a V1 caía para o <code>CLAUDE.md</code>; a V2 não tem esse fallback. Crie um <code>AGENTS.md</code> (pode apontar para o outro conteúdo).'),
          opc('b', 'O <code>CLAUDE.md</code>, como fallback', false, 'esse era o comportamento da V1.'),
          opc('c', 'O <code>CLAUDE.md</code>, mas só no modo plan', false, 'o modo não muda a lista de arquivos de instruções.')] },
      { id: 'oc1-allow', pergunta: 'Sem nenhuma configuração sua, o agente <code>build</code> pede aprovação antes de rodar um comando de shell?',
        opcoes: [
          opc('a', 'Não: a política-base da V2 é <code>* * allow</code>, com poucas exceções (leitura de <code>.env</code> pergunta)', true, 'por isso a primeira configuração de um projeto é escrever <code>ask</code> e <code>deny</code> onde importa.'),
          opc('b', 'Sim, sempre, como na maioria das ferramentas', false, 'na V2 o padrão é permitir.'),
          opc('c', 'Só se o comando começar com <code>rm</code>', false, 'não há lista embutida de comandos perigosos que pergunte.')] },
      { id: 'oc1-ordem', pergunta: 'Regras de <code>permissions</code> em ordem: <code>shell * ask</code>, depois <code>shell git push * deny</code>. Qual o efeito sobre <code>git push origin main</code>?',
        opcoes: [
          opc('a', 'Negado: a última regra que casa vence', true, 'a ordem importa; o genérico vem antes, o específico depois.'),
          opc('b', 'Pergunta: a primeira que casa vence', false, 'a primeira é o que você teria no firewall clássico; aqui é a última.'),
          opc('c', 'Permitido: <code>deny</code> só vale para leitura', false, '<code>deny</code> vale para qualquer ação.')] },
      { id: 'oc1-troca', pergunta: 'Como alternar entre o agente <code>plan</code> e o <code>build</code> na TUI da V2?',
        opcoes: [
          opc('a', '<kbd>Shift</kbd>+<kbd>Tab</kbd> percorre os agentes primários; <kbd>Ctrl</kbd>+<kbd>X</kbd> depois <kbd>A</kbd> abre a lista', true, 'a documentação de atalhos da V2 lista as duas formas.'),
          opc('b', 'Só a tecla <kbd>Tab</kbd> sozinha', false, 'era assim na V1; na V2 a tecla Tab não é o atalho documentado.'),
          opc('c', 'Reiniciar o <code>opencode</code> com outra flag', false, 'a troca é dentro da sessão.')] },
      { id: 'oc1-prec', pergunta: 'Duas configurações definem <code>model</code>: a global (<code>~/.config/opencode</code>) e a do projeto. Qual vale?',
        opcoes: [
          opc('a', 'A do projeto; acima dela ainda estão <code>.opencode/opencode.jsonc</code> e a configuração de sistema', true, 'precedência crescente: global, projeto, <code>.opencode/</code>, sistema.'),
          opc('b', 'A global, porque é a do usuário', false, 'o escopo mais próximo do trabalho sobrescreve o global.'),
          opc('c', 'As duas são mescladas e a global vence conflitos', false, 'em conflito vence o escopo de maior precedência.')] }
    ],
    abas: [
      { rotulo: 'Entender e instalar', blocos: [
        { tipo: 'texto', html:
          '<p>Você já conhece os conceitos (AGENTS.md, permissão, subagente, MCP). Aqui está o que é próprio do OpenCode: um <strong>cliente</strong> (TUI, app desktop, web) conversa com um <strong>serviço</strong> em segundo plano que guarda as sessões, de modo que você pode abrir a mesma sessão em outra tela. O código é MIT, o repositório fica em <code>github.com/anomalyco/opencode</code> e o site é <code>opencode.ai</code>. Versão estável verificada em 09/11/2026: <strong>2.2.6</strong> (npm <code>@opencode/cli</code>).</p>' +
          '<p>Superfícies: <code>opencode [dir]</code> (TUI), <code>opencode mini</code>, app desktop, <code>opencode pair</code> (web) e <code>opencode serve</code>. Para ver o serviço: <code>opencode service status|start|stop|restart</code>. <code>--standalone</code> sobe um servidor privado só para aquela execução; <code>--server &lt;url&gt;</code> aponta para um servidor específico. Logs em <code>~/.local/share/opencode/log/opencode.log</code>.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'V1 e V2: não misture documentação', html:
          '<p>A documentação em <code>opencode.ai/docs</code> é a <strong>V2</strong>; a da V1 vive em <code>opencode.ai/v1/docs</code>. Tutoriais, vídeos e partes deste próprio curso escritos antes de novembro de 2026 podem descrever a V1. O que mudou e quebra configuração antiga:</p>' +
          '<ul><li><code>permission</code> virou <code>permissions</code> e é uma <strong>lista ordenada</strong> de regras, não um objeto por ferramenta.</li>' +
          '<li>Ações renomeadas: <code>bash</code> para <code>shell</code>, <code>task</code> para <code>subagent</code>, <code>write</code> e <code>patch</code> para <code>edit</code>.</li>' +
          '<li>Instruções: só <code>AGENTS.md</code>, sem fallback para <code>CLAUDE.md</code>.</li>' +
          '<li>Plugins da V1 não rodam na V2 (API nova, aula 2).</li>' +
          '<li>Troca de agente: <kbd>Shift</kbd>+<kbd>Tab</kbd>.</li></ul>' },
        { tipo: 'texto', html: '<h3>Instalar</h3><p>Uma forma só; remova antes qualquer instalação da V1 feita por gerenciador de pacotes. Verificado em 09/11/2026.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# macOS / Linux: script oficial',
          'curl -fsSL https://opencode.ai/v2/install | bash',
          '',
          '# alternativas',
          'brew install anomalyco/tap/opencode-v2',
          'npm install -g @opencode/cli',
          '',
          '# mise: exige mise >= 2026.10.9, senão instala a V1',
          'mise use -g opencode',
          '',
          '# conferir',
          'opencode --version'].join('\n') },
        { tipo: 'texto', html: '<p>No Windows os gerenciadores de pacotes não são suportados: use os binários independentes da página de instalação. Há também a imagem <code>ghcr.io/anomalyco/opencode:2.0.0</code> para contêiner. <code>bun</code> e <code>pnpm</code> pedem flags de confiança para scripts de instalação; siga a página de instalação.</p>' +
          '<h3>Conectar um provedor e escolher o modelo</h3>' +
          '<p>Dentro da TUI, <code>/connect</code> abre o assistente de login e <code>/models</code> lista o que está disponível; fora dela, <code>opencode auth login|list|logout|switch</code> e <code>opencode models</code>. Dá para entrar com a assinatura ChatGPT Plus/Pro, usar chaves de API de qualquer provedor suportado ou assinar o <strong>OpenCode Go</strong> (US$ 10 por mês, preço da página de introdução em 09/11/2026; revalide). Existem modelos gratuitos do próprio serviço; <code>OPENCODE_DISABLE_FREE_MODELS=1</code> os esconde. O modelo tem o formato <code>provedor/modelo#variante</code>.</p>' },
        { tipo: 'takeaway', html: 'Na V2 a documentação, as chaves e os atalhos são outros: confira se a página que você segue é a <mark>V2</mark>.' }
      ] },

      { rotulo: 'Primeiro uso', blocos: [
        { tipo: 'texto', html:
          '<p>Num repositório Python com <code>uv</code>, abra a TUI na raiz. O agente <code>build</code> é o padrão; <code>plan</code> é o somente-leitura. O que você digita no prompt:</p>' },
        tabela(['Para', 'Como', 'Observação'], [
          ['Referenciar arquivo', '<code>@src/precos.py</code>; <code>@arquivo#20-45</code> para um intervalo', 'Evita colar código no prompt'],
          ['Comando de shell', '<code>!</code> no início de um prompt vazio', 'Entra em modo shell; a saída vai para a conversa'],
          ['Paleta de comandos', '<kbd>Ctrl</kbd>+<kbd>P</kbd>', 'A tecla líder é <kbd>Ctrl</kbd>+<kbd>X</kbd>'],
          ['Trocar de agente', '<kbd>Shift</kbd>+<kbd>Tab</kbd> ou <kbd>Ctrl</kbd>+<kbd>X</kbd> <kbd>A</kbd> (<code>/agents</code>)', 'plan e build são os primários'],
          ['Trocar de modelo', '<code>/models</code>, <kbd>Ctrl</kbd>+<kbd>X</kbd> <kbd>M</kbd>, <kbd>F2</kbd> alterna entre os recentes', 'Formato <code>provedor/modelo#variante</code>'],
          ['Sessões', '<code>/new</code>, <code>/sessions</code> (<kbd>Ctrl</kbd>+<kbd>X</kbd> <kbd>N</kbd> / <kbd>L</kbd>)', 'Sessões ficam no serviço'],
          ['Desfazer', '<code>/undo</code>, <code>/redo</code> (<kbd>Ctrl</kbd>+<kbd>X</kbd> <kbd>U</kbd> / <kbd>R</kbd>)', 'Reverte mensagem e arquivos'],
          ['Durante o trabalho', '<kbd>Enter</kbd> orienta a sessão em curso; <kbd>Ctrl</kbd>+<kbd>X</kbd> e <kbd>Enter</kbd> enfileira; <kbd>Esc</kbd> interrompe', 'Útil para corrigir o rumo sem esperar'],
          ['Editor externo', '<code>/editor</code> (<kbd>Ctrl</kbd>+<kbd>X</kbd> <kbd>E</kbd>)', 'Para prompts longos']]),
        { tipo: 'rode', id: 'oc1-rode', titulo: 'A primeira tarefa no agente build', enunciado: 'Sessão simulada (exemplo variável: o texto do agente muda a cada execução). Observe se aparece algum pedido de aprovação.',
          prefixo: '$', entrada: 'opencode', unidade: 's', terminalTitulo: 'opencode (exemplo)', etapas: [
            { id: 'abrir', nome: 'Abrir na raiz do projeto', descricao: 'TUI com o agente build', tom: 'tcp', ms: 1, linhas: [
              L('cmd', 'opencode'),
              L('info', 'agente: build   modelo: anthropic/claude-sonnet-5-5')] },
            { id: 'pedir', nome: 'Pedir uma mudança com referência a arquivo', descricao: '@ referencia, o agente edita e testa', tom: 'request', ms: 2, linhas: [
              L('in', 'Corrija o arredondamento em @src/precos.py e rode os testes'),
              L('info', 'edit  src/precos.py  (+3 -1)'),
              L('info', 'shell uv run pytest -q'),
              L('out', '14 passed in 0.31s'),
              L('body', 'Ajustei o arredondamento para ROUND_HALF_EVEN e os 14 testes passam.')] }
          ],
          prever: { pergunta: 'Nenhuma configuração sua existe neste projeto. Quando o agente build chamou <code>uv run pytest -q</code>, o que apareceu?', opcoes: [
            { id: 'a', texto: 'Um pedido de aprovação (uma vez / sempre / rejeitar).', correta: false, porque: 'esse é o padrão de outras ferramentas. Na V2 a política-base é permitir.' },
            { id: 'b', texto: 'Nada: o comando e a edição rodaram sem perguntar.', correta: true, porque: 'a política-base da V2 é <code>* * allow</code>, com exceção de leitura de <code>.env</code> (pergunta). Quem quer aprovação precisa escrever <code>ask</code>.' },
            { id: 'c', texto: 'Um erro, porque o OpenCode não executa comandos sem um sandbox ligado.', correta: false, porque: 'o OpenCode não traz sandbox de sistema operacional por padrão; a contenção vem das regras de permissão.' }
          ] },
          tutorDepois: 'Edição e shell passaram direto. Isso é prático em um repositório descartável e arriscado em um repositório com credenciais; a aba seguinte fecha essa porta com poucas linhas.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Permissivo por padrão, inclusive fora do projeto', html:
          '<p>Na V2, <code>external_directory</code> (acessar caminhos fora do projeto) também vem permitido. Para recuperar o comportamento da V1, adicione <code>{ "action": "external_directory", "resource": "*", "effect": "ask" }</code>. Execução de <code>opencode run --auto</code> aprova tudo que não estiver explicitamente em <code>deny</code>.</p>' },
        { tipo: 'takeaway', html: 'Prompt com <mark>@arquivo</mark>, shell com <mark>!</mark>, troca de agente com <mark>Shift+Tab</mark>; e nada pergunta até você escrever <mark>ask</mark>.' }
      ] },

      { rotulo: 'Instruções e permissões', blocos: [
        { tipo: 'texto', html:
          '<h3>AGENTS.md</h3>' +
          '<p>A V2 carrega o <code>~/.config/opencode/AGENTS.md</code> global e os <code>AGENTS.md</code> do diretório atual em direção à raiz do projeto. Arquivos aninhados abaixo da raiz entram quando o agente lê aquela área, e alterações em arquivos ambientais são detectadas durante a sessão. O campo <code>instructions</code> do <code>opencode.jsonc</code> aceita caminhos, globs, <code>~/</code> e URLs <code>http(s)</code> (por exemplo, para reaproveitar <code>.cursor/rules/*.md</code>). O comando <code>/init</code> só aparece na documentação da TUI da V1; na V2 <strong>não confirmado</strong>: escreva o arquivo à mão.</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          '# AGENTS.md',
          '## Comandos',
          '- Verificar tudo: `uv run ruff check . && uv run mypy --strict src && uv run pytest -q`',
          '- Um teste: `uv run pytest tests/test_x.py -q`',
          '## Convenções',
          '- Python 3.14, Pydantic v2 nas fronteiras, sem `print` em src/.',
          '## Não faça',
          '- Não edite migrations/ nem .github/workflows/ sem pedir.',
          '- Não rode `git push`; quem publica sou eu.'].join('\n') },
        { tipo: 'texto', html:
          '<h3>Permissões: lista ordenada, última regra que casa vence</h3>' +
          '<p>Cada regra tem <code>action</code> (<code>read</code>, <code>edit</code>, <code>glob</code>, <code>grep</code>, <code>shell</code>, <code>subagent</code>, <code>skill</code>, <code>question</code>, <code>webfetch</code>, <code>websearch</code>, ou <code>&lt;servidor&gt;_&lt;ferramenta&gt;</code> para MCP), <code>resource</code> com curinga <code>*</code> e <code>?</code>, e <code>effect</code> (<code>allow</code>, <code>ask</code>, <code>deny</code>). Ao aprovar um pedido você escolhe <em>uma vez</em>, <em>sempre</em> (cria regra <code>allow</code> do projeto, nunca sobrepõe um <code>deny</code>) ou <em>rejeitar</em>. O analisador de shell entende Bash, Zsh, sh e PowerShell. Regras de um agente são acrescentadas depois das globais.</p>' },
        { tipo: 'complete', id: 'oc1-complete-perm', titulo: 'Complete o opencode.jsonc do projeto', obrigatorio: false, linguagem: 'json',
          enunciado: 'Queremos: shell sempre pergunta, exceto os comandos do <code>uv</code>; <code>git push</code> negado; edição de <code>migrations/</code> pergunta; caminhos fora do projeto perguntam. Lembre que a <strong>última</strong> regra que casa vence.',
          partes: [
            '{\n  "$schema": "https://opencode.ai/config.json",\n  "',
            { lacuna: 'chave', opcoes: ['permission', 'permissions', 'perms'], correta: 'permissions' },
            '": [\n    { "action": "',
            { lacuna: 'acao', opcoes: ['bash', 'shell', 'command'], correta: 'shell' },
            '", "resource": "*", "effect": "ask" },\n    { "action": "shell", "resource": "uv *", "effect": "allow" },\n    { "action": "shell", "resource": "git push *", "effect": "',
            { lacuna: 'efeito', opcoes: ['deny', 'ask', 'block'], correta: 'deny' },
            '" },\n    { "action": "edit", "resource": "migrations/*", "effect": "ask" },\n    { "action": "',
            { lacuna: 'ext', opcoes: ['external_directory', 'outside', 'path'], correta: 'external_directory' },
            '", "resource": "*", "effect": "ask" }\n  ]\n}\n'
          ],
          explicacao: 'A chave é <code>permissions</code> (plural, lista) e a ação de comandos é <code>shell</code>; <code>permission</code> e <code>bash</code> são da V1 e seriam ignorados sem alarde. O <code>deny</code> de <code>git push *</code> vem <em>depois</em> do <code>shell * ask</code>, senão a regra genérica o sobrescreveria. <code>external_directory</code> com <code>ask</code> devolve o comportamento da V1.' },
        { tipo: 'texto', html: '<p>Onde a configuração mora, do menor para o maior precedência: global (<code>~/.config/opencode/opencode.jsonc</code>), projeto (<code>opencode.jsonc</code>, do mais distante ao mais próximo), <code>.opencode/opencode.jsonc</code> e, por último, o nível de <strong>sistema</strong> (<code>/etc/opencode</code> no Linux, <code>/Library/Application Support/opencode</code> no macOS, <code>%ProgramData%\\opencode</code> no Windows). Variáveis de ambiente entram como <code>{env:NOME}</code>; segredo nunca vai no arquivo.</p>' +
          '<h3>Fluxo plan, build, revisão</h3>' +
          '<p>O agente <code>plan</code> nega edição, exceto nos arquivos de plano; o <code>explore</code> (subagente) é só leitura; o <code>general</code> não faz perguntas nem chama outros subagentes. Use <kbd>Shift</kbd>+<kbd>Tab</kbd> para ir de um a outro. <code>/undo</code> e <code>/redo</code> revertem a mensagem e as mudanças de arquivo daquela rodada. Se a documentação da sua versão exigir git ou a chave <code>snapshots</code> para isso, confirme antes de depender (não confirmado para a V2).</p>' },
        { tipo: 'ordene', id: 'oc1-ordene', titulo: 'Ordene uma tarefa conduzida', obrigatorio: false,
          enunciado: 'Ponha o ciclo na ordem em que você o conduziria.',
          itens: [
            { id: 'plan', texto: 'Mudar para o agente <code>plan</code> e pedir o plano com os arquivos e testes' },
            { id: 'ler', texto: 'Ler o plano, corrigir o que estiver errado e só então mudar para <code>build</code>' },
            { id: 'build', texto: 'Pedir a implementação em lotes pequenos, com o comando de verificação a cada lote' },
            { id: 'diff', texto: 'Ler o diff e rodar a verificação completa você mesmo' },
            { id: 'commit', texto: 'Commitar; o <code>git push</code> continua sendo um passo seu' }
          ], solucao: ['plan', 'ler', 'build', 'diff', 'commit'],
          dica: 'Nada é editado antes de o plano estar aprovado por você.',
          tutorDepois: 'O push fica fora do agente porque está em <code>deny</code> no arquivo de permissões.' },
        { tipo: 'takeaway', html: 'A V2 não se contém sozinha: a contenção é uma lista de <mark>permissions</mark> em que a <mark>última regra que casa</mark> vence.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'transcript', id: 'oc1-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'sessão opencode (exemplo)',
          enunciado: 'Uma das afirmações do agente não é sustentada pelo que a ferramenta mostrou. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Corrija o bug do desconto e garanta que lint, tipos e testes passam.' },
            { quem: 'agente', texto: 'Vou editar src/desconto.py e rodar a verificação.' },
            { quem: 'ferramenta', texto: 'edit src/desconto.py (+2 -2)' },
            { quem: 'ferramenta', texto: '$ uv run pytest -q\n14 passed in 0.31s' },
            { quem: 'agente', texto: 'Pronto: lint, mypy e pytest passaram, tudo verde.' }
          ],
          erradas: [4],
          explicacao: { 4: 'o log mostra só o <code>pytest</code>. Nenhum <code>ruff</code> nem <code>mypy</code> foi executado, então "tudo verde" é uma afirmação sem evidência. Peça o comando completo do AGENTS.md e confira a saída.' },
          tutorDepois: 'Relato do agente não é verificação: o que vale é o comando que aparece no log da sessão.' },
        { tipo: 'escolha', id: 'oc1-esc-claude', titulo: 'Confira: repositório com CLAUDE.md',
          pergunta: 'Seu time migrou de Claude Code para OpenCode V2 e o repositório só tem <code>CLAUDE.md</code>. O agente ignora as convenções. Qual a correção mais simples e durável?',
          opcoes: [
            { id: 'a', texto: 'Criar um <code>AGENTS.md</code> como fonte e, se o Claude Code continuar em uso, fazer o <code>CLAUDE.md</code> apontar para ele.', correta: true, porque: 'a V2 só reconhece <code>AGENTS.md</code>; uma fonte única evita divergência.' },
            { id: 'b', texto: 'Renomear a ferramenta para forçar o fallback para <code>CLAUDE.md</code>.', correta: false, porque: 'o fallback foi removido na V2.' },
            { id: 'c', texto: 'Colar as convenções em todo prompt.', correta: false, porque: 'é o que o arquivo de instruções existe para evitar.' },
            { id: 'd', texto: 'Voltar para a V1 e manter tudo como estava.', correta: false, porque: 'funciona, mas troca um arquivo por uma versão sem a documentação atual.' }
          ], tutorDepois: 'Um arquivo, vários ponteiros.' },
        { tipo: 'escolha', id: 'oc1-esc-ordem', titulo: 'Confira: ordem das regras',
          pergunta: 'Você quer <code>git push</code> negado e o restante do shell perguntando. Qual ordem entrega isso?',
          opcoes: [
            { id: 'a', texto: '<code>shell git push * deny</code> e depois <code>shell * ask</code>', correta: false, porque: 'a última que casa vence: <code>git push</code> cairia em <code>ask</code>.' },
            { id: 'b', texto: '<code>shell * ask</code> e depois <code>shell git push * deny</code>', correta: true, porque: 'o específico vem por último e vence para <code>git push</code>.' },
            { id: 'c', texto: 'A ordem não importa: <code>deny</code> sempre vence', correta: false, porque: 'em <code>permissions</code> quem decide é a ordem, não o efeito. (Em <code>policies</code> a lógica é outra, na aula 2.)' },
            { id: 'd', texto: 'Só <code>shell * ask</code>: o <code>deny</code> é redundante', correta: false, porque: 'o <code>ask</code> deixaria o push passar assim que você aprovasse.' }
          ], tutorDepois: 'Genérico primeiro, específico depois.' },
        { tipo: 'texto', html: '<h3>Equivalente nas outras ferramentas</h3>' },
        tabela(['Recurso', 'OpenCode V2', 'Claude Code', 'Codex', 'Cursor'], [
          ['Instruções', '<code>AGENTS.md</code> (sem fallback)', '<code>CLAUDE.md</code> (pode importar <code>@AGENTS.md</code>)', '<code>AGENTS.md</code>', '<code>AGENTS.md</code> e <code>.cursor/rules</code>'],
          ['Contenção', 'lista <code>permissions</code>, padrão permissivo', 'regras allow/ask/deny', 'sandbox e aprovação', 'aprovação do editor'],
          ['Modo de plano', 'agente <code>plan</code>, <kbd>Shift</kbd>+<kbd>Tab</kbd>', 'plan mode', '<code>/plan</code>', 'Plan Mode'],
          ['Não interativo', '<code>opencode run</code>', '<code>claude -p</code>', '<code>codex exec</code>', '<code>agent -p</code>']]),
        { tipo: 'texto', html: '<p class="ta-nota">Colunas das outras ferramentas: verificadas em 12/10/2026 em outras aulas do curso e não revalidadas nesta rodada. A coluna OpenCode: 09/11/2026.</p>' },
        { tipo: 'takeaway', html: 'O que muda ao trocar de ferramenta é o <mark>endereço</mark>; na V2, o endereço padrão é <mark>aberto</mark> até você fechar.' }
      ] }
    ]
  });
})();
