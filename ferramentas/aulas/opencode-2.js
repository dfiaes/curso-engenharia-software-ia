/* Ferramentas · OpenCode 2. Fatos verificados em 09/11/2026 (docs V2 em opencode.ai/docs). Fontes: ferramentas/fontes/opencode.md */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tabela(cab, linhas) {
    return { tipo: 'texto', largo: true, html: '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' };
  }

  TrilhaAula.registrar({
    id: 'fer-opencode-2',
    titulo: 'OpenCode avançado',
    minutos: 35,
    resumo: 'Subagentes, comandos e skills como arquivos; MCP com OAuth; plugins na API nova; políticas que nem o repositório consegue afrouxar; execução em CI e custo. E as armadilhas de quem migra da V1.',
    objetivo: 'Criar um subagente revisor somente-leitura, comandos e skills do projeto, configurar um servidor MCP remoto, decidir entre permissão, plugin e política para cada regra e rodar o OpenCode em CI sem vazar credencial.',
    revisao: [
      { id: 'oc2-sub-perm', pergunta: 'Você nega <code>edit</code> no agente principal. Um subagente personalizado herda esse <code>deny</code>?',
        opcoes: [
          opc('a', 'Não: o subagente usa as próprias <code>permissions</code> (mais as globais), não um subconjunto das do pai', true, 'declare o <code>deny</code> também no arquivo do subagente.'),
          opc('b', 'Sim, sempre herda tudo do pai', false, 'o contrário do que a documentação da V2 descreve.'),
          opc('c', 'Só se o subagente estiver com <code>mode: primary</code>', false, 'o modo define onde o agente aparece, não a herança.')] },
      { id: 'oc2-skill-id', pergunta: 'De onde vem o identificador de uma skill no OpenCode V2?',
        opcoes: [
          opc('a', 'Do caminho da pasta (<code>.opencode/skills/&lt;id&gt;/SKILL.md</code>), não do campo <code>name</code> do frontmatter', true, 'renomear só o <code>name</code> não muda o <code>@id</code>.'),
          opc('b', 'Do campo <code>name</code> do frontmatter', false, 'o frontmatter não define o ID.'),
          opc('c', 'Do primeiro título do arquivo', false, 'não é usado.')] },
      { id: 'oc2-bang', pergunta: 'Num arquivo de comando, um bloco com crase e ponto de exclamação (<code>!`git diff`</code>) passa pelas regras de <code>permissions</code>?',
        opcoes: [
          opc('a', 'Não: roda fora do fluxo de permissão do agente; trate o comando como código de confiança', true, 'por isso comandos de origem externa merecem revisão como qualquer script.'),
          opc('b', 'Sim, como qualquer chamada de shell', false, 'a documentação diz o contrário.'),
          opc('c', 'Só se o agente for o <code>plan</code>', false, 'o agente não muda isso.')] },
      { id: 'oc2-policy', pergunta: 'Qual mecanismo permite que a organização proíba <code>git push</code> sem que o repositório consiga reverter?',
        opcoes: [
          opc('a', '<code>policies</code> no nível de sistema ou gerenciado: bloqueio fixo que prevalece sobre <code>ask</code> e sobre aprovações "sempre"', true, 'a política só restringe e nunca concede; o nível de sistema vence todos.'),
          opc('b', '<code>permissions</code> no <code>opencode.jsonc</code> do projeto', false, 'quem tem o repositório edita o arquivo.'),
          opc('c', 'Uma linha no AGENTS.md', false, 'é consultiva.')] },
      { id: 'oc2-ci', pergunta: 'Por que <code>opencode run</code> em CI leva <code>--standalone</code>?',
        opcoes: [
          opc('a', 'Para subir um servidor privado que recebe as variáveis de ambiente do job, como a chave do provedor', true, 'sem isso a execução poderia usar um serviço compartilhado sem o ambiente do job.'),
          opc('b', 'Para desativar as permissões', false, 'quem aprova sem perguntar é o <code>--auto</code>.'),
          opc('c', 'Para usar modelos gratuitos', false, 'não tem relação.')] }
    ],
    abas: [
      { rotulo: 'Subagentes, comandos, skills', blocos: [
        { tipo: 'texto', html:
          '<p>Os três são arquivos Markdown versionados no projeto (ou globais em <code>~/.config/opencode/</code>). A recarga é automática.</p>' +
          '<h3>Agentes</h3>' +
          '<p>Embutidos: <code>build</code> e <code>plan</code> (primários); <code>general</code> e <code>explore</code> (subagentes). Não existe <code>scout</code> na V2. Um subagente roda numa <strong>sessão filha</strong> com contexto novo; só o resultado volta ao pai. Frontmatter: <code>description</code>, <code>mode</code> (<code>primary</code>, <code>subagent</code>, <code>all</code>), <code>model</code> (<code>provedor/modelo#variante</code>), <code>permissions</code>, <code>steps</code>, <code>hidden</code>, <code>color</code>, <code>disabled</code>. O corpo é o prompt do sistema. Na chave JSON <code>agents</code>, o campo equivalente ao corpo se chama <code>system</code>.</p>' },
        { tipo: 'complete', id: 'oc2-complete-agent', titulo: 'Monte o subagente revisor', obrigatorio: false, linguagem: 'markdown',
          enunciado: 'Arquivo <code>.opencode/agents/revisor.md</code>: revisa o diff sem poder editar nem rodar nada que escreva. Escolha as peças.',
          partes: [
            '---\ndescription: Revisa o diff atual e aponta bugs, riscos e testes ausentes\nmode: ',
            { lacuna: 'modo', opcoes: ['subagent', 'primary', 'readonly'], correta: 'subagent' },
            '\nmodel: anthropic/claude-sonnet-5-5#',
            { lacuna: 'var', opcoes: ['high', 'sonnet', 'fast=true'], correta: 'high' },
            '\n',
            { lacuna: 'chave', opcoes: ['permission', 'permissions', 'tools'], correta: 'permissions' },
            ':\n  - { action: edit, resource: "*", effect: ',
            { lacuna: 'efeito', opcoes: ['deny', 'ask', 'false'], correta: 'deny' },
            ' }\n  - { action: shell, resource: "*", effect: deny }\n  - { action: shell, resource: "git diff*", effect: allow }\n---\nVocê revisa código Python. Leia o diff, aponte correção, tipos, testes que faltam e riscos de segurança. Não proponha reescritas amplas.\n'
          ],
          explicacao: 'O subagente aparece só como chamável (<code>mode: subagent</code>). A variante vem depois de <code>#</code>. A chave é <code>permissions</code>, uma lista; <code>permission</code> é da V1. Note a ordem: <code>shell *</code> deny primeiro e <code>git diff*</code> allow depois, porque a <strong>última regra que casa vence</strong>.' },
        { tipo: 'texto', html:
          '<h3>Comandos</h3>' +
          '<p><code>.opencode/commands/*.md</code>; subpastas viram prefixo (<code>team/review.md</code> é <code>/team/review</code>). Frontmatter: <code>description</code>, <code>agent</code>, <code>model</code>, <code>subagent</code> (alias <code>subtask</code>). O corpo é o modelo do prompt, com <code>$ARGUMENTS</code> ou <code>$1</code>, <code>$2</code>. Um trecho com crase e <code>!</code> executa shell e injeta a saída.</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          '---',
          'description: Revisa a branch atual contra main',
          'agent: revisor',
          'subagent: true',
          '---',
          'Revise as mudanças da branch contra $1 (padrão: main).',
          'Diff:',
          '!`git diff main...HEAD --stat`'].join('\n') },
        { tipo: 'callout', tom: 'danger', titulo: 'O bloco ! roda fora das permissões', html:
          '<p>O comando entre crases dentro do arquivo de comando <strong>não passa</strong> pela lista <code>permissions</code> do agente. Um comando baixado de terceiros com <code>!`...`</code> é código executado na sua máquina quando você digita a barra. Leia antes de instalar, como faria com um script de <code>postinstall</code>.</p>' },
        { tipo: 'texto', html:
          '<h3>Skills</h3>' +
          '<p><code>.opencode/skills/&lt;id&gt;/SKILL.md</code>; lê também <code>.claude/skills</code> e <code>.agents/skills</code>, no projeto e no global. O <strong>ID vem do caminho</strong>, não do <code>name</code>. Sem <code>description</code> a skill não é anunciada ao modelo. <code>metadata.opencode/autoinvoke: false</code> (ou <code>disable-model-invocation</code>) a esconde do disparo automático; <code>@id</code> a carrega à mão. A ação de permissão é <code>skill</code>, e o campo <code>skills</code> do config adiciona diretórios ou catálogos por URL.</p>' },
        { tipo: 'takeaway', html: 'Agente, comando e skill são <mark>arquivos</mark>; o ID da skill é o <mark>caminho</mark> e o <mark>!</mark> do comando escapa das permissões.' }
      ] },

      { rotulo: 'MCP, plugins e políticas', blocos: [
        { tipo: 'texto', html:
          '<h3>MCP</h3>' +
          '<p>Pela CLI: <code>opencode mcp add &lt;nome&gt; --url ... [--global] [--header K=V] [--env K=V] -- comando args</code>, e <code>opencode mcp list|auth|logout</code>. No arquivo, <code>mcp.servers.&lt;nome&gt;</code> com <code>type: "local"</code> (<code>command[]</code>, <code>cwd</code>, <code>environment</code>) ou <code>type: "remote"</code> (<code>url</code>, <code>headers</code>, <code>oauth</code> ou <code>false</code>). Servidores remotos usam <strong>OAuth por padrão</strong> (entre pela TUI em <code>/mcps</code>). As ferramentas aparecem como <code>&lt;servidor&gt;_&lt;ferramenta&gt;</code> e é com esse nome que você escreve a regra de permissão. Tempos: 30 s para iniciar e para listar o catálogo, 12 h para uma execução. Um servidor com o mesmo nome em escopo de maior precedência <strong>substitui</strong> o outro por inteiro, sem mesclar campos.</p>' },
        { tipo: 'rode', id: 'oc2-rode-mcp', titulo: 'Adicionar um servidor remoto', enunciado: 'Exemplo variável (nomes e texto exatos mudam por versão; o servidor <code>docs</code> e a URL são fictícios).',
          prefixo: '$', entrada: 'opencode mcp add docs --url https://mcp.exemplo.dev/mcp', unidade: 's', terminalTitulo: 'opencode mcp (exemplo)', etapas: [
            { id: 'add', nome: 'Registrar', descricao: 'Grava em mcp.servers.docs', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'opencode mcp add docs --url https://mcp.exemplo.dev/mcp'),
              L('out', 'adicionado: docs (remote)')] },
            { id: 'list', nome: 'Listar', descricao: 'Estado dos servidores', tom: 'tls', ms: 1, linhas: [
              L('cmd', 'opencode mcp list'),
              L('out', 'docs   needs authentication')] }
          ],
          prever: { pergunta: 'O servidor foi adicionado. O que <code>opencode mcp list</code> mostra em seguida?', opcoes: [
            { id: 'a', texto: 'Conectado, pronto para uso.', correta: false, porque: 'servidor remoto usa OAuth por padrão: falta autenticar.' },
            { id: 'b', texto: '"needs authentication": é preciso entrar (<code>opencode mcp auth docs</code> ou <code>/mcps</code> na TUI).', correta: true, porque: 'a documentação mostra exatamente esse estado para servidores remotos com OAuth ainda não concluído.' },
            { id: 'c', texto: 'Erro, porque o servidor precisa de uma chave de API em <code>--header</code>.', correta: false, porque: 'cabeçalho só é necessário se o servidor não usar OAuth; aí se declara <code>oauth: false</code>.' }
          ] },
          tutorDepois: 'Registrar não é autenticar. Para servidor com token fixo, use <code>headers</code> com <code>{env:NOME}</code> e <code>oauth: false</code>.' },
        { tipo: 'complete', id: 'oc2-complete-mcp', titulo: 'Complete o mcp do opencode.jsonc', obrigatorio: false, linguagem: 'json',
          enunciado: 'Servidor remoto com token em variável de ambiente e uma regra que pergunta antes de qualquer ferramenta dele.',
          partes: [
            '{\n  "',
            { lacuna: 'raiz', opcoes: ['mcp', 'mcpServers', 'servers'], correta: 'mcp' },
            '": {\n    "servers": {\n      "docs": {\n        "type": "remote",\n        "url": "https://mcp.exemplo.dev/mcp",\n        "headers": { "Authorization": "Bearer ',
            { lacuna: 'seg', opcoes: ['{env:DOCS_TOKEN}', 'sk-abc123', '$DOCS_TOKEN'], correta: '{env:DOCS_TOKEN}' },
            '" },\n        "oauth": false\n      }\n    }\n  },\n  "permissions": [\n    { "action": "',
            { lacuna: 'acao', opcoes: ['docs_*', 'mcp', 'shell'], correta: 'docs_*' },
            '", "resource": "*", "effect": "ask" }\n  ]\n}\n'
          ],
          explicacao: 'A raiz é <code>mcp</code> com <code>servers</code> dentro (não <code>mcpServers</code>, que é de outras ferramentas). O segredo entra por <code>{env:NOME}</code>; um token literal acabaria no Git. A ação de uma ferramenta MCP é <code>&lt;servidor&gt;_&lt;ferramenta&gt;</code>, aqui com curinga.' },
        { tipo: 'texto', html:
          '<h3>Plugins: a API mudou</h3>' +
          '<p>Na V2 um plugin é um módulo <code>import { Plugin } from "@opencode/plugin"; export default Plugin.define({ id, async setup(ctx) { ... } })</code>. Locais em <code>.opencode/plugins/</code> ou na lista <code>plugins</code> do config (objetos <code>{ package, options }</code>); CLI: <code>opencode plugin add|list|check|update|remove</code>. <strong>Plugins da V1 não rodam.</strong> Ganchos documentados: <code>ctx.tool.hook("execute.before" | "execute.after")</code>, que inspeciona ou substitui a entrada (a documentação não afirma que consegue <em>bloquear</em>: não confirmado), <code>ctx.permission.hook("evaluate")</code>, em que o plugin pode definir <code>event.effect</code> (<code>allow</code>, <code>ask</code>, <code>deny</code>) e <code>event.message</code>, e <code>ctx.session.hook(...)</code>.</p>' },
        { tipo: 'codigo', linguagem: 'typescript', texto: [
          '// .opencode/plugins/sem-push.ts  (exemplo: valide o formato do evento na sua versão)',
          'import { Plugin } from "@opencode/plugin"',
          '',
          'export default Plugin.define({',
          '  id: "sem-push",',
          '  async setup(ctx) {',
          '    ctx.permission.hook("evaluate", async (event) => {',
          '      // forma exata dos campos do evento: confira em /docs/build/plugins',
          '      if (String(event.resource ?? "").startsWith("git push")) {',
          '        event.effect = "deny"',
          '        event.message = "git push é feito por humano; abra o PR."',
          '      }',
          '    })',
          '  },',
          '})'].join('\n') },
        { tipo: 'callout', tom: 'info', titulo: 'Limite da regra por plugin', html:
          '<p>O gancho <code>evaluate</code> não é chamado depois de um <code>deny</code> explícito já configurado, e quem controla o repositório controla o plugin. Para uma regra que precisa valer contra o próprio dev, use <code>policies</code>.</p>' },
        { tipo: 'texto', html:
          '<h3>Políticas: o único ponto que o repositório não afrouxa</h3>' +
          '<p>A chave <code>policies</code> tem entradas <code>{ action, resource, effect }</code> com <code>action</code> em <code>provider.use</code>, <code>tool.use</code>, <code>integration.connect</code>, <code>integration.use</code>, <code>mcp.use</code>, <code>skill.use</code>, <code>plugin.use</code> e <code>websearch.use</code>, e <code>effect</code> <code>allow</code> ou <code>deny</code>; vale a última que casa. Em <code>tool.use</code> o recurso tem a forma <code>shell:git push *</code>. Uma política <strong>só restringe, nunca concede</strong>, bloqueia com a mensagem "Blocked by configuration policy" e prevalece sobre <code>ask</code> e sobre aprovações "sempre". As políticas globais ou gerenciadas pelo Console prevalecem sobre o config do projeto, e as de sistema sobre todas.</p>' },
        { tipo: 'codigo', linguagem: 'json', texto: [
          '// /etc/opencode/opencode.jsonc  (nível de sistema)',
          '{',
          '  "policies": [',
          '    { "action": "tool.use", "resource": "shell:git push *", "effect": "deny" },',
          '    { "action": "mcp.use", "resource": "*", "effect": "deny" },',
          '    { "action": "mcp.use", "resource": "docs", "effect": "allow" }',
          '  ]',
          '}'].join('\n') },
        { tipo: 'takeaway', html: 'Permissão <mark>orienta o agente</mark>, plugin <mark>automatiza</mark>, política <mark>impõe</mark> e só vale contra o dev no nível de <mark>sistema</mark>.' }
      ] },

      { rotulo: 'Headless, CI e custo', blocos: [
        { tipo: 'texto', html: '<h3>opencode run</h3>' },
        tabela(['Flag', 'Efeito', 'Uso'], [
          ['<code>--model provedor/modelo#variante</code>', 'Escolhe o modelo', 'Fixe no CI para custo previsível'],
          ['<code>--agent</code>', 'Agente da execução', 'Em CI, um agente restrito'],
          ['<code>--continue</code>, <code>--session</code>', 'Retoma sessão', 'Fluxos em vários passos'],
          ['<code>--file</code>', 'Anexa arquivo', 'Diff ou log como contexto'],
          ['<code>--format json</code>', 'Saída em JSON', 'Forma exata dos campos: não confirmado, inspecione antes de depender'],
          ['<code>--auto</code>', 'Aprova tudo que não estiver em <code>deny</code>', 'Só em ambiente descartável e com <code>deny</code> escrito'],
          ['<code>--standalone</code>', 'Servidor privado só desta execução', 'Necessário em CI para a chave do ambiente chegar'],
          ['<code>-w</code> / <code>--worktree</code>', 'Executa num worktree', 'Isolar a mudança']]),
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# CI (exemplo): ANTHROPIC_API_KEY vem dos secrets do job, nunca do arquivo',
          'npm install -g @opencode/cli',
          'opencode run --standalone --agent revisor \\',
          '  --model anthropic/claude-sonnet-5-5 \\',
          '  "Revise o diff de origin/main e liste riscos"'].join('\n') },
        { tipo: 'texto', html: '<p>Desde a 2.2.6, <code>run</code> espera tarefas em segundo plano terminarem e o SIGTERM resulta em código de saída 143. Para diagnosticar: <code>opencode api get /api/info</code>, <code>opencode debug paths</code> e o log do serviço. A integração oficial com GitHub (<code>opencode github install</code> e a action em <code>anomalyco/opencode/github</code>) aparece em página que parece ser da V1; seu comportamento na V2 é <strong>não confirmado</strong> e fica fora do exercício.</p>' },
        { tipo: 'cenario', id: 'oc2-cenario', titulo: 'Revisão automática de PR', obrigatorio: false,
          enunciado: 'Você quer um comentário automático de revisão em cada PR de um repositório público, usando <code>opencode run</code> num workflow do GitHub Actions.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Como disparar o workflow e entregar a chave do provedor?', opcoes: [
              { texto: 'Evento <code>pull_request</code>, chave em secret, agente de revisão sem permissão de editar nem de shell.', vai: 'agente', tom: 'ok', consequencia: 'PRs de fork recebem token somente leitura e nenhum secret, então a revisão não roda neles; é o desenho seguro.' },
              { texto: 'Evento <code>pull_request_target</code> para que forks também tenham a chave, e <code>--auto</code>.', vai: 'f-pwn', tom: 'ruim', consequencia: 'código de fork controla o prompt e o agente aprova tudo com acesso ao secret.' },
              { texto: 'Chave escrita no <code>opencode.jsonc</code> do repositório para simplificar.', vai: 'f-chave', tom: 'ruim', consequencia: 'a chave vai ao histórico do Git de um repositório público.' }
            ] },
            agente: { texto: 'O agente de revisão precisa existir só para ler. Como o definir?', opcoes: [
              { texto: '<code>mode: primary</code> com <code>permissions</code> negando <code>edit</code> e <code>shell</code>; escolher com <code>--agent</code>.', vai: 'f-bom', tom: 'ok', consequencia: 'o agente só lê, e uma negação explícita vale até com <code>--auto</code>.' },
              { texto: 'Usar o <code>build</code> padrão e pedir no prompt que não edite.', vai: 'f-prompt', tom: 'ruim', consequencia: 'o prompt é consultivo, e o build edita e roda shell sem perguntar.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Revisão somente leitura, chave em secret, sem acesso de fork: o pior caso é um comentário ruim.' },
            'f-pwn': { bom: false, texto: 'Um PR malicioso exfiltrou o secret: o agente com aprovação automática executou o que o PR mandou.' },
            'f-chave': { bom: false, texto: 'A chave vazou e foi revogada pelo provedor em horas.' },
            'f-prompt': { bom: false, texto: 'Uma instrução escondida no diff fez o build alterar arquivos e executar comandos no runner, onde a chave estava no ambiente.' }
          },
          callout: 'Você separou quem pode disparar, onde mora a chave e o que o agente pode fazer.' },
        { tipo: 'texto', html:
          '<h3>Modelos e custo</h3>' +
          '<p>Modelo por execução: <code>--model</code>; por agente: campo <code>model</code>; por comando: idem. A variante (<code>#high</code>) ajusta o esforço de raciocínio quando o modelo a oferece. Acompanhe com <code>opencode stats [--days N --models --cost --json --project .]</code>. O custo real depende do provedor escolhido: assinatura ChatGPT Plus/Pro (cota da assinatura), chave de API (pagamento por token) ou OpenCode Go (assinatura mensal; preços de plano e de modelo são dados de alto risco, revalide em 30 dias). Para limitar o consumo da sessão há a chave <code>compaction</code> (<code>auto</code>, <code>keep.tokens</code>, <code>buffer</code>).</p>' },
        { tipo: 'takeaway', html: 'Em CI: <mark>--standalone</mark>, chave em <mark>secret</mark>, agente <mark>somente leitura</mark> e nunca <mark>pull_request_target</mark> com execução de código do PR.' }
      ] },

      { rotulo: 'Armadilhas e conferir', blocos: [
        { tipo: 'texto', html: '<h3>Tabela de diagnóstico</h3>' },
        tabela(['Sintoma', 'Causa provável', 'Conserto'], [
          ['As regras de permissão parecem não existir', 'Chaves da V1 (<code>permission</code>, <code>bash</code>) ignoradas', 'Migrar para <code>permissions</code> em lista e <code>shell</code>'],
          ['O agente lê e escreve fora do projeto', '<code>external_directory</code> é <code>allow</code> por padrão na V2', 'Regra <code>external_directory * ask</code>'],
          ['As convenções do projeto não aparecem', 'Só existe <code>CLAUDE.md</code>', 'Criar <code>AGENTS.md</code>'],
          ['<code>@minha-skill</code> não acha a skill', 'O ID é o caminho da pasta, não o <code>name</code>', 'Usar o nome da pasta ou renomeá-la'],
          ['Um comando de equipe executou algo inesperado', 'Bloco <code>!`...`</code> roda fora das permissões', 'Revisar o arquivo de comando antes de instalar'],
          ['Meu plugin não carrega', 'Plugin escrito para a API da V1', 'Reescrever com <code>Plugin.define</code>'],
          ['O servidor MCP não responde', 'Faltou OAuth, ou o mesmo nome em outro escopo o substituiu inteiro', '<code>opencode mcp list</code> e <code>/mcps</code>; conferir precedência'],
          ['Instalei e a versão é a antiga', '<code>mise</code> anterior a 2026.10.9 ou pacote da V1 ainda presente', 'Atualizar o mise ou remover a V1 e reinstalar'],
          ['Subagente edita apesar do <code>deny</code> do pai', 'Subagente personalizado usa as próprias permissões', 'Repetir o <code>deny</code> no arquivo do subagente']]),
        { tipo: 'escolha', id: 'oc2-esc-sub', titulo: 'Confira: o deny do agente principal',
          pergunta: 'O agente <code>build</code> tem <code>edit</code> negado. Você chama o subagente <code>helper</code>, sem <code>permissions</code> próprias, e ele altera um arquivo. Por quê?',
          opcoes: [
            { id: 'a', texto: 'Subagentes não herdam o <code>deny</code> do agente que os chamou; valem as globais mais as do próprio arquivo.', correta: true, porque: 'a documentação diz que o subagente personalizado usa as próprias permissões, não um subconjunto das do pai.' },
            { id: 'b', texto: 'É um bug: o <code>deny</code> sempre se propaga.', correta: false, porque: 'é o comportamento descrito, não um defeito.' },
            { id: 'c', texto: 'Porque o <code>deny</code> só vale para <code>write</code>, e o subagente usou <code>patch</code>.', correta: false, porque: '<code>write</code> e <code>patch</code> foram unificados em <code>edit</code> na V2.' },
            { id: 'd', texto: 'Porque o <code>mode</code> do subagente é <code>all</code>.', correta: false, porque: 'o <code>mode</code> não altera permissões.' }
          ], tutorDepois: 'Negue na raiz da lista global ou no arquivo de cada subagente que importa.' },
        { tipo: 'escolha', id: 'oc2-esc-policy', titulo: 'Confira: regra contra o próprio dev',
          pergunta: 'O time de segurança exige que nenhum agente rode <code>git push</code> em máquinas da empresa, mesmo que o dev tente liberar. Onde a regra vai?',
          opcoes: [
            { id: 'a', texto: 'Em <code>policies</code> no nível de sistema (<code>tool.use</code> com <code>shell:git push *</code> e <code>deny</code>).', correta: true, porque: 'bloqueio fixo que prevalece sobre ask, aprovações "sempre" e config do projeto.' },
            { id: 'b', texto: 'Em <code>permissions</code> no <code>opencode.jsonc</code> do repositório.', correta: false, porque: 'qualquer dev com acesso ao repositório edita o arquivo.' },
            { id: 'c', texto: 'No AGENTS.md, com letras maiúsculas.', correta: false, porque: 'é uma instrução, não um controle.' },
            { id: 'd', texto: 'Num plugin do projeto.', correta: false, porque: 'o plugin também vive no repositório.' }
          ], tutorDepois: 'Controle contra o usuário precisa estar onde o usuário não escreve.' },
        { tipo: 'texto', html: '<h3>Equivalente nas outras ferramentas</h3>' },
        tabela(['Recurso', 'OpenCode V2', 'Claude Code', 'Codex', 'Cursor'], [
          ['Subagentes', '<code>.opencode/agents/*.md</code>', '<code>.claude/agents/</code>', '<code>.codex/agents/*.toml</code>', '<code>.cursor/agents/*.md</code>'],
          ['Skills', '<code>.opencode/skills/</code> (lê <code>.claude</code> e <code>.agents</code>)', '<code>.claude/skills/</code>', '<code>.agents/skills</code>', '<code>.cursor/skills/</code>'],
          ['Gancho que bloqueia', 'política; hook de permissão em plugin', 'hooks em settings', 'hooks.json, exit 2', 'hooks.json, exit 2'],
          ['MCP', '<code>mcp.servers</code> no config', 'servidores MCP', '<code>config.toml</code>', '<code>.cursor/mcp.json</code>'],
          ['Não interativo', '<code>opencode run</code>', '<code>claude -p</code>', '<code>codex exec</code>', '<code>agent -p</code>']]),
        { tipo: 'texto', html: '<p class="ta-nota">Colunas das outras ferramentas: verificadas em 12/10/2026 em outras aulas do curso e não revalidadas nesta rodada. A coluna OpenCode: 09/11/2026.</p>' },
        { tipo: 'takeaway', html: 'No OpenCode V2, o que o repositório define o repositório pode <mark>mudar</mark>; só <mark>policies de sistema</mark> ficam fora do alcance do dev.' }
      ] }
    ]
  });
})();
