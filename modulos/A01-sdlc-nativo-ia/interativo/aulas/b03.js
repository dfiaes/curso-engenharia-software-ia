/* A01 · Bloco 3: Build. Fonte: A01.html#b03. Fatos de ferramenta verificados em 12/10/2026 (Cursor, OpenAI Codex; OpenCode V2 e a herança de sandbox dos subagentes do Codex revalidados em 09/11/2026); Claude Code conforme o próprio playbook. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tab(cab, linhas) {
    return { tipo: 'texto', largo: true, html: '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr><td><strong>' + r[0] + '</strong></td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>'; }).join('') + '</tbody></table>' };
  }
  var CAB = ['Conceito', 'Como fazer', 'Observação'];

  var cursor = [
    ['Instruções do projeto', '<code>AGENTS.md</code> na raiz e em subpastas; também <code>.cursor/rules/*.mdc</code> (frontmatter <code>description</code>, <code>globs</code>, <code>alwaysApply</code>) e Team Rules no painel', 'Precedência: Team, Project, User. Regras de projeto não valem para o revisor de PR'],
    ['Skills / políticas', '<code>.cursor/skills/</code> ou <code>.agents/skills/</code> (<code>SKILL.md</code>; <code>paths</code>, <code>disable-model-invocation</code>); lê também <code>.claude/skills</code> e <code>.codex/skills</code>', 'Invocação automática pela descrição ou por <code>/</code>'],
    ['Hooks de bloqueio', '<code>.cursor/hooks.json</code> (<code>version: 1</code>); eventos como <code>preToolUse</code>, <code>beforeShellExecution</code>, <code>afterFileEdit</code>, <code>stop</code>; exit 2 = negar', '<code>failClosed: true</code> bloqueia em falha do próprio hook; sem isso, outros códigos de saída deixam passar'],
    ['Modo de plano / leitura', 'Plan Mode (<kbd>Shift</kbd> + <kbd>Tab</kbd>): perguntas, pesquisa, plano em markdown editável', 'O plano fica no diretório home; "Save to workspace" para versionar. A página não afirma que bloqueia edições: use também permissão'],
    ['Autonomia reduzida', 'CLI em modo <code>-p</code> só propõe alterações; <code>--force</code> permite edição direta', 'Controles de aprovação do editor: não verificados nesta rodada'],
    ['Subagentes', '<code>.cursor/agents/*.md</code> (aceita <code>.claude/agents</code> e <code>.codex/agents</code>); <code>readonly: true</code>; foreground ou background', 'Aninhamento de um nível; isolamento opcional por worktree'],
    ['Sessões isoladas', 'Subagentes em modo de isolamento recebem worktree própria; agentes inteiros podem rodar em worktree', 'Detalhes na página de worktrees do Cursor'],
    ['MCP', '<code>.cursor/mcp.json</code> (projeto) ou <code>~/.cursor/mcp.json</code>; stdio, SSE, HTTP', 'Admin define allowlist de servidores'],
    ['Modo não interativo', '<code>agent -p "..."</code>, saídas <code>text</code>, <code>json</code>, <code>stream-json</code>; <code>CURSOR_API_KEY</code>', 'Sem <code>--force</code> não escreve arquivos']];
  var codex = [
    ['Instruções do projeto', '<code>AGENTS.md</code>: global em <code>~/.codex</code> e, no projeto, da raiz até o diretório atual, concatenados; <code>AGENTS.override.md</code> substitui no mesmo diretório; <code>/init</code> gera o esqueleto', 'Limite padrão de 32 KiB (<code>project_doc_max_bytes</code>); nomes alternativos via <code>project_doc_fallback_filenames</code>'],
    ['Skills / políticas', '<code>.agents/skills</code> (diretório atual até a raiz), <code>~/.agents/skills</code>, <code>/etc/codex/skills</code>; <code>$nome</code> ou <code>/skills</code>', '<code>allow_implicit_invocation: false</code> em <code>agents/openai.yaml</code> desliga o disparo automático'],
    ['Hooks de bloqueio', '<code>hooks.json</code> ou <code>[hooks]</code> em <code>config.toml</code> (usuário ou <code>.codex/</code> do repositório); <code>PreToolUse</code> com <code>permissionDecision: "deny"</code> ou exit 2', 'Hooks não gerenciados precisam ser confiados em <code>/hooks</code>; cobrem shell, <code>apply_patch</code> e MCP; a doc diz que é guardrail, não fronteira completa'],
    ['Modo de plano / leitura', '<code>/plan</code> propõe um plano antes da execução; <code>/permissions</code> alterna para somente leitura', 'Em CI: <code>--sandbox read-only --ask-for-approval never</code>'],
    ['Autonomia reduzida', '<code>approval_policy</code> (<code>on-request</code>, <code>never</code>, <code>granular</code>) e <code>sandbox_mode</code> (<code>read-only</code>, <code>workspace-write</code>, <code>danger-full-access</code>)', 'Preset "Auto" = <code>workspace-write</code> + <code>on-request</code>; rede desligada por padrão; <code>approvals_reviewer = "auto_review"</code> envia pedidos a um agente revisor'],
    ['Subagentes', '<code>.codex/agents/*.toml</code> (<code>name</code>, <code>description</code>, <code>developer_instructions</code>, opcionalmente <code>model</code>; <code>sandbox_mode</code> no arquivo do agente é ignorado); built-ins <code>default</code>, <code>worker</code>, <code>explorer</code>', 'Herdam o sandbox do pai; <code>max_concurrent_threads_per_session</code> limita o paralelismo'],
    ['Sessões isoladas', 'Não verificado como recurso nativo: use <code>git worktree add</code> e uma sessão por pasta', 'Substituto simples e universal'],
    ['MCP', 'Servidores em <code>config.toml</code>; <code>/mcp</code> lista as ferramentas', 'Política corporativa pode restringir por allowlist (bloco 5)'],
    ['Modo não interativo', '<code>codex exec</code>; no GitHub, <code>openai/codex-action@v1</code>', '<code>--output-schema</code> para saída estruturada']];
  var opencode = [
    ['Instruções do projeto', '<code>AGENTS.md</code> (global em <code>~/.config/opencode/</code>); escrito à mão (<code>/init</code> não aparece na documentação da V2); campo <code>instructions</code> do <code>opencode.jsonc</code> aceita caminhos, globs e URLs (ex.: <code>.cursor/rules/*.md</code>)', 'a V2 reconhece só <code>AGENTS.md</code>, sem fallback para <code>CLAUDE.md</code> (migre o conteúdo); <code>@</code> dentro do arquivo não é expandido automaticamente'],
    ['Skills / políticas', '<code>.opencode/skills/</code>, <code>.claude/skills/</code> ou <code>.agents/skills/</code>; ferramenta <code>skill</code> carrega sob demanda', 'ação <code>skill</code> em <code>permissions</code> (<code>allow</code> / <code>ask</code> / <code>deny</code> por padrão de nome); o ID vem do caminho'],
    ['Hooks de bloqueio', 'Plugin JS/TS em <code>.opencode/plugins/</code> com <code>tool.execute.before</code>: lançar erro bloqueia a chamada; além disso, <code>permission</code> declarativo com padrões', 'Mais código que nas outras; em compensação a regra pode ser tão sofisticada quanto um programa'],
    ['Modo de plano / leitura', 'Agente primário <code>plan</code> (nega edição, exceto arquivos de plano; o shell segue as permissões); alterna com <kbd>Shift</kbd> + <kbd>Tab</kbd> (<code>agent.cycle</code>)', 'Agente <code>build</code> é o padrão e a V2 é permissiva por padrão'],
    ['Autonomia reduzida', 'Lista ordenada <code>permissions</code> de <code>{ action, resource, effect }</code> (a última regra que casa vence); a base é <code>* * allow</code>, então nada pergunta até você escrever <code>ask</code> (inclusive para <code>external_directory</code>); <code>--auto</code> aprova o que não está negado explicitamente', '<code>deny</code> explícito continua valendo; leitura de <code>.env</code> pede confirmação (<code>ask</code>) por padrão'],
    ['Subagentes', '<code>.opencode/agents/*.md</code> ou chave <code>agents</code>; built-ins <code>general</code> e <code>explore</code> (a V2 não tem <code>scout</code>); invocação por <code>@nome</code> não confirmada na V2', 'A ação <code>subagent</code> em <code>permissions</code> controla quais subagentes um agente pode chamar'],
    ['Sessões isoladas', 'Não verificado como recurso nativo: <code>git worktree add</code> e uma sessão por pasta', 'Substituto universal'],
    ['MCP', 'Chave <code>mcp.servers</code> do <code>opencode.jsonc</code> (<code>disabled</code> no lugar de <code>enabled</code>)', 'Organização pode distribuir servidores desabilitados por config remota'],
    ['Modo não interativo', '<code>opencode run --standalone</code> (a página da V2 traz um job do GitHub Actions de exemplo)', 'A ação GitHub da V1 (<code>opencode github install</code>, comentário <code>/opencode</code>) não foi confirmada na V2']];
  var claude = [
    ['Instruções do projeto', '<code>CLAUDE.md</code>, gerado por <code>/init</code>; ponteiro <code>@AGENTS.md</code> para a fonte única', 'Manter abaixo de uma página; corrigir no segundo erro repetido'],
    ['Skills / políticas', '<code>.claude/skills/&lt;nome&gt;/SKILL.md</code>', 'Consultivas; política obrigatória precisa de hook ou check de PR'],
    ['Hooks de bloqueio', 'Hooks em <code>.claude/settings.json</code>; podem permitir, perguntar ou bloquear', 'Hooks inegociáveis ficam nas managed settings'],
    ['Modo de plano / leitura', 'Plan mode: bloqueia edições até o plano ser aceito', 'O plano aprovado é commitado como <code>plan.md</code>'],
    ['Autonomia reduzida', 'Auto mode, quando guardrails maduros', 'Revisão passa aos artefatos'],
    ['Subagentes', '<code>.claude/agents/</code>', 'Contexto e ferramentas escopados'],
    ['Sessões isoladas', 'Uma sessão por git worktree', 'Comece com 2 a 3'],
    ['MCP', 'Servidores MCP; deploy exposto como ferramentas escopadas', 'Allowlist em managed settings'],
    ['Modo não interativo', '<code>claude -p</code> em pipelines', 'Comece somente leitura']];
  var propria = [
    ['Instruções do projeto', 'Carregador que concatena <code>AGENTS.md</code> da raiz até o cwd e registra quais arquivos entraram', 'Limite de tamanho e log do que foi carregado (senão ninguém depura)'],
    ['Skills / políticas', 'Índice com <code>name</code> e <code>description</code> no prompt; ferramenta <code>load_skill(name)</code> devolve o corpo', 'Teste de disparo: casos que devem e não devem carregar'],
    ['Hooks de bloqueio', 'Função <code>before_tool(nome, args)</code> que devolve allow / ask / deny + motivo; política em arquivo; reutilize <code>sdlc_kit.policy</code>', 'O motivo volta ao modelo: escreva-o para o modelo agir (qual o caminho de aprovação)'],
    ['Modo de plano / leitura', 'Fase 1 com só ferramentas de leitura e <code>submit_plan</code>; fase 2 só após aprovação humana', 'Persistir o plano em arquivo, não na memória do laço'],
    ['Autonomia reduzida', 'Política por classe de ferramenta + orçamento de passos, tokens e tempo', 'Aborto seguro: nunca meio-aplicado'],
    ['Subagentes', 'Nova instância do laço com prompt, ferramentas e contexto próprios; devolve só um resumo', 'Subagente herda no máximo as permissões do pai'],
    ['Sessões isoladas', '<code>git worktree add</code> por tarefa; um processo do agente por worktree', 'Limpeza de worktrees órfãs'],
    ['MCP', 'Cliente do protocolo aberto (M09)', 'Allowlist de servidores no seu loader'],
    ['Modo não interativo', 'CLI com <code>--json</code>, códigos de saída estáveis e sem prompts interativos', 'Timeout e custo máximo por execução']];

  TrilhaAula.registrar({
    id: 'a01-b3',
    titulo: 'Build: plano, instruções, hooks e paralelismo',
    minutos: 35,
    resumo: 'Build é onde o agente trabalha mais tempo sem olhar para você. Cinco práticas seguram o erro de direção: plano antes de editar, instruções persistentes, skills, guardrails determinísticos e paralelismo controlado.',
    objetivo: 'Conduzir uma tarefa de Build com plano aprovado, manter um AGENTS.md curto como fonte única, escolher a camada certa de controle para cada regra e dizer quando o modo autônomo está merecido.',
    revisao: [
      { id: 'a01b3-plano', pergunta: 'O que o modo de plano garante, em termos de invariante?',
        opcoes: [
          opc('a', 'Uma fase somente-leitura que termina em artefato aprovado antes de qualquer edição', true, 'sem modo de plano nativo, o mesmo efeito vem de permissão de leitura na primeira fase mais um passo humano explícito.'),
          opc('b', 'Que o código gerado nunca terá erro', false, 'o plano reduz erro de direção, não de implementação.'),
          opc('c', 'Que o <code>plan.md</code> fica congelado até o fim', false, 'se a implementação divergir, o <code>plan.md</code> é atualizado.')] },
      { id: 'a01b3-agents', pergunta: 'Qual o arranjo do curso para instruções com várias ferramentas?',
        opcoes: [
          opc('a', '<code>AGENTS.md</code> como fonte única; quem lê outro nome recebe um ponteiro', true, 'Cursor, Codex e OpenCode leem <code>AGENTS.md</code>; o <code>CLAUDE.md</code> importa <code>@AGENTS.md</code>.'),
          opc('b', 'Manter um arquivo por ferramenta e sincronizar à mão', false, 'os arquivos divergem.'),
          opc('c', 'Colocar tudo em <code>.cursor/rules</code>', false, 'essas regras são específicas do Cursor.')] },
      { id: 'a01b3-skill-hook', pergunta: 'Qual a relação entre skill e hook no Build?',
        opcoes: [
          opc('a', 'Skills ensinam (consultivas); hooks garantem, permitindo, perguntando ou bloqueando', true, 'se uma política precisa valer sempre, atrás da skill vai um hook ou um check de PR.'),
          opc('b', 'Skill bloqueia a ação e hook só sugere', false, 'é o contrário.'),
          opc('c', 'São equivalentes; muda só o nome da pasta', false, 'skill é conhecimento sob demanda; hook é programa executado em eventos.')] },
      { id: 'a01b3-camada', pergunta: 'O agente edita um arquivo protegido com <code>sed -i</code> dentro de um comando de shell e o hook só casa ferramentas de edição. O que ainda pega?',
        opcoes: [
          opc('a', 'O check de caminhos protegidos sobre o <code>git diff</code>, no pre-commit e no CI obrigatório', true, 'olha o efeito, qualquer que tenha sido o caminho.'),
          opc('b', 'A instrução no <code>AGENTS.md</code>', false, 'é consultiva e depende de o modelo cumprir.'),
          opc('c', 'Pedir ao agente que confirme se tocou pastas protegidas', false, 'é relato, não verificação.')] },
      { id: 'a01b3-auto', pergunta: 'Quando o modo autônomo pode ser ligado?',
        opcoes: [
          opc('a', 'Depois que os guardrails amadurecem, para trabalho de baixo raio de impacto, com rollback trivial e revisão de PR ainda humana', true, 'modo autônomo é ganho, não ligado.'),
          opc('b', 'Assim que o agente é instalado, para acelerar', false, 'sem comando de verificação confiável o agente "termina" quando acha que terminou.'),
          opc('c', 'Quando a revisão humana de PR deixa de ser necessária', false, 'a revisão de PR obrigatória e humana continua valendo para o merge.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Build é a etapa em que o agente trabalha mais tempo sem olhar para você, e por isso é onde um erro de direção sai mais caro: 40 arquivos alterados na direção errada em vez de uma pergunta. O playbook organiza Build em cinco práticas que se sustentam mutuamente: plano antes de editar, instruções persistentes do projeto, políticas como skills, guardrails determinísticos e paralelismo controlado. Só depois disso, e só quando os guardrails amadurecem, vem o modo autônomo.</p>' +
          '<h3>Plano antes de editar</h3>' +
          '<p>O engenheiro começa a sessão em <strong>modo de plano</strong>, entregando ao agente o <code>intent.md</code> e a <code>spec.md</code>. O agente lê o código e devolve um plano com arquivos a tocar, ordem, riscos e os testes que provam cada requisito. Enquanto o plano não é aceito, nada é editado. O plano aprovado é commitado como <code>plan.md</code>.</p>' +
          '<p>Uma regra que a maioria esquece: se a implementação divergir do plano, <strong>o <code>plan.md</code> é atualizado</strong>. Senão o revisor compara o PR com um documento que já não descreve nada.</p>' +
          '<p>O invariante é uma fase somente-leitura que termina em artefato aprovado. Quando a ferramenta não tem um modo de plano que bloqueie edições, você obtém o mesmo efeito com permissão (só leitura na primeira fase) e com um passo humano explícito antes da segunda.</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          '## Passos', '- S1 (R1, R2): criar o serviço de exportação com validação de período.',
          '- S2 (R3): aplicar a checagem de titularidade no endpoint.', '## Riscos',
          'Extratos grandes em memória: gerar em streaming.', '## Testes que provam',
          '- R1: teste de contrato do CSV.', '- R2: teste de período de 13 meses.', '- R3: teste de acesso cruzado entre titulares.'].join('\n') },
        { tipo: 'texto', html:
          '<h3>Instruções do projeto: um arquivo, vários ponteiros</h3>' +
          '<p>Toda ferramenta tem um arquivo de memória do projeto lido no início da sessão. O playbook o chama <code>CLAUDE.md</code>: comandos de build e teste, convenções, arquitetura e <strong>erros conhecidos</strong>. Recomendações: gerar um rascunho com o comando de inicialização, cortar para o essencial do primeiro dia, versionar, manter abaixo de uma página e acrescentar uma correção toda vez que o agente errar pela segunda vez.</p>' +
          '<p>O problema prático das equipes com mais de uma ferramenta é a duplicação e a divergência dos arquivos. A solução do curso: <strong><code>AGENTS.md</code> é a fonte única</strong> e cada ferramenta que prefere outro nome recebe um ponteiro. Verificado em 12/10/2026:</p>' +
          '<ul><li><strong>Cursor</strong> lê <code>AGENTS.md</code> na raiz e em subpastas (o mais específico prevalece).</li>' +
          '<li><strong>Codex</strong> concatena <code>AGENTS.md</code> da raiz até o diretório atual (limite padrão de 32 KiB combinados).</li>' +
          '<li><strong>OpenCode</strong> V2 lê só <code>AGENTS.md</code> (a V1 recorria ao <code>CLAUDE.md</code>; verificado em 09/11/2026), então um repositório que só tem <code>CLAUDE.md</code> precisa de um <code>AGENTS.md</code>.</li>' +
          '<li><strong>Claude Code</strong> lê <code>CLAUDE.md</code>; o ponteiro é um arquivo de uma linha que importa o outro (<code>@AGENTS.md</code>, sintaxe de importação do Claude Code; confira na sua versão).</li></ul>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          'AGENTS.md          # fonte única, escrita para qualquer agente', 'CLAUDE.md          # ponteiro: @AGENTS.md',
          '.cursor/rules/     # só o que for específico do Cursor (globs)', '',
          '# AGENTS.md (exemplo enxuto)', '## Comandos', '- Verificar tudo: `make verify` (lint + tipos + testes; "pronto" = verde)',
          '- Rodar um teste: `uv run pytest tests/test_x.py -q`', '## Convenções',
          '- Python 3.14, tipos estritos, Pydantic nas fronteiras. Sem `print` em src/.', '## Arquitetura',
          '- docs/intent, docs/specs, docs/plans, docs/adr são lidos antes de editar.', '## Erros conhecidos',
          '- Não edite migrations/ nem .github/workflows/ (protegidos; peça aprovação).',
          '- Em branch fix/, não altere testes existentes: corrija o código.'].join('\n') },
        { tipo: 'callout', tom: 'info', titulo: 'Duas ressalvas técnicas', html:
          '<p>Primeiro, o arquivo entra <em>inteiro</em> no contexto de toda sessão: cada linha custa tokens e atenção, e instruções que só valem para uma pasta vão em <code>AGENTS.md</code> aninhado. Segundo, o Cursor não aplica suas regras de projeto (<code>.cursor/rules</code>) ao seu revisor de PR, que usa outro arquivo (bloco 5): nem toda ferramenta lê todos os arquivos em todos os contextos.</p>' },
        { tipo: 'takeaway', html: 'Plano <mark>aprovado e commitado</mark> antes de editar, e <mark>um</mark> arquivo de instruções curto com ponteiros.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Skills ensinam, hooks garantem</h3>' +
          '<p>O bloco 2 mostrou o formato da skill. No Build, a questão é o que ela <em>não</em> garante: o playbook é direto, skills são <strong>consultivas</strong>. A descrição de cada skill fica sempre no contexto; o corpo só entra quando o agente decide usar. Por isso a descrição precisa dizer quando usar, e a skill deve ser testada com prompts que devem e que não devem dispará-la.</p>' +
          '<p>Um <strong>hook</strong> é um programa que a ferramenta executa em pontos do ciclo (antes de usar uma ferramenta, depois de editar um arquivo, ao terminar o turno) e que pode <strong>permitir, perguntar ou bloquear</strong>. Usos para Build: bloquear edição de caminhos protegidos, rodar formatador e linter após cada edição, impedir credenciais no diff. Regra de projeto: hooks rápidos e de escopo estreito; o pesado fica no commit ou no PR.</p>' +
          '<p>No laboratório, o <code>sdlc_kit</code> aplica a mesma regra em duas camadas. Num branch <code>fix/</code>, o agente tenta editar um teste existente.</p>' },
        { tipo: 'rode', id: 'build-rode', titulo: 'A mesma regra em duas camadas', enunciado: 'Saídas reais do laboratório: primeiro o hook do agente, depois o check de git.',
          prefixo: '$', entrada: 'echo \'{"tool_name":"Edit","tool_input":{"file_path":"tests/test_app.py"}}\' | python -m sdlc_kit agent-hook --policy examples/policy.json --root /tmp/a01-demo', unidade: 's', terminalTitulo: 'sdlc_kit', etapas: [
            { id: 'hook', nome: 'Camada 1: hook do agente', descricao: 'JSON no stdin; exit 2 = bloquear; motivo no stderr', tom: 'tcp', ms: 1, linhas: [
              L('cmd', 'echo \'{"tool_name":"Edit","tool_input":{"file_path":"tests/test_app.py"}}\' | python -m sdlc_kit agent-hook --policy examples/policy.json --root /tmp/a01-demo'),
              L('out', 'tests/test_app.py: teste existente em branch de correção; corrija o código, não o teste'),
              L('hint', 'exit=2')] },
            { id: 'git', nome: 'Camadas 2 e 3: git', descricao: 'staged = pre-commit; range = CI', tom: 'tls', ms: 2, linhas: [
              L('cmd', 'python -m sdlc_kit hook --mode range --base main --policy examples/policy.json --repo /tmp/a01-demo'),
              L('out', 'tests/test_app.py: [TEST_EDIT_ON_FIX] teste existente alterado (M) em branch de correção: corrija o código, não o teste'),
              L('out', '1 problema(s)'),
              L('hint', 'exit=1')] }
          ],
          prever: { pergunta: 'O mesmo teste foi alterado. Qual código de saída o hook do agente devolve para bloquear?', opcoes: [
            { id: 'a', texto: '0: o hook só registra o aviso.', correta: false, porque: 'exit 0 deixa a chamada passar.' },
            { id: 'b', texto: '2, com o motivo em stderr.', correta: true, porque: 'exit 2 com a razão em stderr é o contrato de bloqueio documentado por Cursor e Codex em 12/10/2026 e usado pelo Claude Code.' },
            { id: 'c', texto: '1, como num teste que falha.', correta: false, porque: 'o 1 é o do check de git; no hook do agente, o bloqueio é 2.' }
          ] },
          tutorDepois: 'O hook bloqueou com exit 2 e a razão foi para o modelo agir: "corrija o código, não o teste". O check de git, nas camadas 2 e 3, achou o mesmo problema com exit 1. O nome dos campos do JSON de entrada varia por ferramenta e versão: teste o seu com um comando que deva ser bloqueado.',
          callout: 'Você viu a mesma regra barrada pelo hook do agente e pelo check de git.' },
        { tipo: 'texto', html:
          '<h3>Cinco camadas de controle</h3>' +
          '<p>A pergunta de engenharia é onde colocar cada verificação. A resposta é uma pilha de camadas com o mesmo código por baixo. As três primeiras podem rodar exatamente as mesmas funções (o <code>sdlc_kit</code> usa funções puras em <code>policy.py</code> e três adaptadores: hook do agente, pre-commit do git e passo de CI); muda onde e quem consegue contornar.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Camada</th><th>Característica</th><th>Quem contorna</th></tr></thead><tbody>' +
          '<tr><td>1 · Hook do agente</td><td>Rápido, específico da ferramenta</td><td>O agente: pode editar por um caminho que o hook não vê</td></tr>' +
          '<tr><td>2 · Hook do git (pre-commit)</td><td>Local, universal entre agentes</td><td><code>--no-verify</code> ou clone sem o hook instalado</td></tr>' +
          '<tr><td>3 · Verificação obrigatória no CI</td><td>Mesmo código das camadas 1 e 2</td><td>Não contornável pelo autor: o merge exige o check verde</td></tr>' +
          '<tr><td>4 · Proteção de branch e CODEOWNERS</td><td>Aprovação humana nomeada</td><td>Define quem pode passar o gate; o agente nunca é o aprovador</td></tr>' +
          '<tr><td>5 · Política gerenciada e sandbox impostas pela organização</td><td>O indivíduo não desliga</td><td>Falha fechada se o sandbox faltar</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o hook que não vê o caminho que o agente escolheu', html:
          '<p>Um hook que casa chamadas de edição de arquivo não vê um <code>sed -i</code> dentro de um comando de shell, nem um script Python que reescreve o arquivo. A documentação do Codex admite que hooks são guardrail e não fronteira completa de imposição, e que há caminhos de ferramenta que não passam por eles.</p>' +
          '<p>Duas defesas: (1) a camada seguinte, que olha o <em>resultado</em> (<code>git diff</code>) e não o caminho que o produziu, ou seja, pre-commit e CI; (2) permissões do sistema (sandbox somente-leitura para pastas protegidas). Quem confia só no hook de edição descobre o furo no incidente.</p>' },
        { tipo: 'takeaway', html: 'A mesma regra roda em <mark>camadas</mark>; as que importam olham o <mark>diff</mark>, não o caminho que o agente escolheu.' }
      ] },

      { rotulo: 'Mapa por ferramenta', blocos: [
        { tipo: 'texto', html:
          '<p>Estado verificado em <strong>12/10/2026</strong> nas documentações oficiais (Cursor, OpenAI Codex; OpenCode V2 e a herança de sandbox dos subagentes do Codex revalidados em 09/11/2026) e, para o Claude Code, no próprio playbook. Células "não verificado" significam que a documentação consultada não confirmou o recurso: use o substituto indicado. Escolha a ferramenta que você usa.</p>' },
        { tipo: 'abas', rotulo: 'Ferramenta', itens: [
          { rotulo: 'Cursor', blocos: [tab(CAB, cursor)] },
          { rotulo: 'Codex', blocos: [tab(CAB, codex)] },
          { rotulo: 'OpenCode', blocos: [tab(CAB, opencode)] },
          { rotulo: 'Claude Code', blocos: [tab(['Conceito', 'Como fazer', 'Observação (fonte: playbook)'], claude)] },
          { rotulo: 'Implementar do zero', blocos: [tab(['Conceito', 'Como implementar', 'Cuidado'], propria)] }
        ] },
        { tipo: 'takeaway', html: 'O conceito é o <mark>invariante</mark>; o caminho do arquivo é <mark>adaptador</mark> e muda com a <mark>versão</mark> da ferramenta.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Sessões paralelas e modo autônomo</h3>' +
          '<p>Um engenheiro pode conduzir várias sessões ao mesmo tempo, cada uma em seu próprio checkout isolado (um <code>git worktree</code>), para que nenhuma pise na outra: <code>git worktree add ../app-fix-123 -b fix/123</code>. Tarefas repetidas viram <strong>subagentes</strong>: definições versionadas com contexto limpo e ferramentas restritas (um revisor somente-leitura, um escritor de testes). Comece com <strong>duas ou três sessões</strong> e só suba enquanto a qualidade da revisão se mantiver. O M01 trata a decomposição e a integração por waves.</p>' +
          '<p><strong>Modo autônomo: ganha-se, não se liga.</strong> Quando os guardrails amadureceram, o trabalho rotineiro e de baixo raio de impacto pode rodar sem aprovação a cada edição, e a revisão passa a ser dos artefatos. Pré-condições:</p>' +
          '<ul><li>Existe um comando único de verificação e o time confia nele (sem testes instáveis ignorados).</li>' +
          '<li>Caminhos protegidos e segredos são bloqueados por hook e por check obrigatório no CI.</li>' +
          '<li>O ambiente de execução é isolado (sandbox, sem credenciais de produção).</li>' +
          '<li>O escopo é de baixo raio de impacto (uma pasta, uma classe de tarefa) e há rollback trivial.</li>' +
          '<li>Revisão de PR obrigatória e humana continua valendo para o merge.</li>' +
          '<li>Há uma eval que detecta regressão de comportamento do agente quando algo da configuração muda.</li></ul>' },
        { tipo: 'ordene', id: 'build-ordene', titulo: 'Ordene o ciclo de uma tarefa de Build',
          enunciado: 'Use os botões para pôr os passos na ordem correta e confira.',
          itens: [
            { id: 'aprova', texto: 'Humano aprova o plano e ele é commitado como <code>plan.md</code>' },
            { id: 'ler', texto: 'Ler <code>intent.md</code> e <code>spec.md</code> em modo somente leitura' },
            { id: 'pr', texto: 'Se a implementação divergiu, atualizar o <code>plan.md</code> e abrir o PR citando intent, spec e plan' },
            { id: 'plano', texto: 'Produzir o plano: arquivos, ordem, riscos e testes que provam cada requisito' },
            { id: 'impl', texto: 'Implementar em lotes pequenos, rodando o comando único de verificação a cada lote' }
          ], solucao: ['ler', 'plano', 'aprova', 'impl', 'pr'],
          dica: 'Nada é editado antes de o humano aprovar o plano.',
          tutorDepois: 'Leitura, plano, aprovação, implementação em lotes e só então o PR com o plano em dia.' },
        { tipo: 'transcript', id: 'build-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'sessão fix/123',
          enunciado: 'Leia a sessão. Uma das afirmações do agente é falsa: o hook não protege o que ele diz. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Aplique a correção do PROJ-123. Lembre: não edite migrations/.' },
            { quem: 'agente', texto: 'Vou ajustar a coluna. O hook de edição bloqueia migrations/, então uso um script.' },
            { quem: 'ferramenta', texto: '$ sed -i "s/NULL/NOT NULL/" migrations/0007.sql\n(sem saída)' },
            { quem: 'agente', texto: 'Pronto. O hook de edição protege migrations/, então a migration está segura e intacta.' },
            { quem: 'ferramenta', texto: '$ make verify\nOK' }
          ],
          erradas: [3],
          explicacao: { 3: 'o hook só casa ferramentas de edição de arquivo; o <code>sed -i</code> dentro de um comando de shell passou por fora dele. A migration foi alterada, e só a camada que olha o <code>git diff</code> (pre-commit e CI obrigatório) pega isso.' },
          tutorDepois: 'Hook vê o caminho; o check sobre o diff vê o efeito.' },
        { tipo: 'cenario', id: 'build-cenario', titulo: 'Quantas sessões em paralelo?', obrigatorio: false,
          enunciado: 'Num sistema .NET + Angular com Durable Functions, você conduz sessões de agente em worktrees. Decida como crescer.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Você roda duas sessões e a revisão dos PRs está folgada. Os agentes ficam ociosos esperando você. O que faz?', opcoes: [
              { texto: 'Subir para três sessões, cada uma em seu worktree, e acompanhar a qualidade da revisão.', vai: 'f-bom', tom: 'ok', consequencia: 'a capacidade de revisão é o teto: sobe-se quando ela está folgada.' },
              { texto: 'Subir para dez sessões de uma vez, porque os agentes estão ociosos.', vai: 'f-teto', tom: 'ruim', consequencia: 'os PRs passam a esperar revisão, e a revisão fica rasa.' },
              { texto: 'Rodar as sessões no mesmo checkout para economizar disco.', vai: 'f-pisa', tom: 'ruim', consequencia: 'as sessões pisam nos mesmos arquivos e os diffs se misturam.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Três sessões isoladas, com revisão mantida; mudanças mergeadas por engenheiro lidas junto com a taxa de retrabalho.' },
            'f-teto': { bom: false, texto: 'A fila de PRs cresceu e o retrabalho subiu: a revisão era o teto.' },
            'f-pisa': { bom: false, texto: 'Duas sessões sobrescreveram o mesmo arquivo, e ninguém soube qual mudança era de qual tarefa.' }
          },
          callout: 'Você cresceu o paralelismo pelo teto da revisão, não pela ociosidade do agente.' },
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs', html:
          '<ul><li><strong>Hook em toda parte × latência.</strong> Cada hook roda a cada chamada de ferramenta; um que leva dois segundos multiplica pelo número de edições. Rápido no agente, pesado no commit ou no PR.</li>' +
          '<li><strong>Plano detalhado × deriva.</strong> Quanto mais detalhado, mais cedo diverge; por isso o <code>plan.md</code> é atualizado, e não congelado.</li>' +
          '<li><strong>Muitas sessões × revisão.</strong> A capacidade de revisão é o teto. Sobe-se de duas para três sessões quando a revisão está folgada, não quando o agente está ocioso.</li></ul>' +
          '<p>Métricas das práticas: instruções (líder: erros repetidos; defasada: tempo até o primeiro PR mergeado de um membro novo) e paralelismo (líder: sessões simultâneas por engenheiro com a qualidade de revisão mantida; defasada: mudanças mergeadas por engenheiro lidas junto com a taxa de retrabalho).</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Arquivo de instruções com 600 linhas de tudo que alguém já pensou: o agente passa a obedecer a nada em particular.</li>' +
          '<li>Deixar o <code>AGENTS.md</code> e o <code>CLAUDE.md</code> divergirem. Um é fonte, o outro é ponteiro.</li>' +
          '<li>Ligar o modo autônomo antes de existir um comando de verificação confiável: o agente "termina" quando acha que terminou.</li></ul>' },
        { tipo: 'escolha', id: 'build-escolha-sed', titulo: 'Confira: a camada que olha o efeito',
          pergunta: 'O agente edita <code>migrations/0007.sql</code> com <code>sed -i</code> dentro de um comando de shell, e o hook só casa ferramentas de edição de arquivo. Qual camada ainda pega o problema sem depender do caminho usado?',
          opcoes: [
            { id: 'a', texto: 'Uma skill de política que descreve a regra.', correta: false, porque: 'skill é consultiva: depende de o modelo cumprir.' },
            { id: 'b', texto: 'O check de caminhos protegidos sobre o <code>git diff</code> (pre-commit e, de forma não contornável, CI obrigatório).', correta: true, porque: 'a verificação sobre o diff olha o efeito, qualquer que tenha sido o caminho. A camada que o autor não consegue desligar é o check obrigatório no CI atrás de proteção de branch.' },
            { id: 'c', texto: 'O arquivo <code>AGENTS.md</code>, que já proíbe a edição.', correta: false, porque: 'é consultivo: dependem de o modelo cumprir.' },
            { id: 'd', texto: 'Pedir ao agente, no prompt, que confirme se tocou pastas protegidas.', correta: false, porque: 'é relato do agente, não verificação.' }
          ], tutorDepois: 'Skill, instrução e pedido no prompt orientam; o check sobre o diff garante.' },
        { tipo: 'escolha', id: 'build-escolha-agents', titulo: 'Confira: instruções duplicadas',
          pergunta: 'O time usa Cursor, Codex e Claude Code no mesmo repositório e as instruções estão duplicadas em três arquivos que já divergem. Qual é o arranjo do curso?',
          opcoes: [
            { id: 'a', texto: 'Manter os três arquivos e sincronizá-los manualmente a cada release.', correta: false, porque: 'sincronização manual diverge de novo.' },
            { id: 'b', texto: 'Escolher uma única ferramenta para toda a equipe.', correta: false, porque: 'é decisão de compra, não de arquitetura.' },
            { id: 'c', texto: '<code>AGENTS.md</code> como fonte única; o arquivo da ferramenta que não o lê nativamente vira um ponteiro (por exemplo, <code>CLAUDE.md</code> importando <code>@AGENTS.md</code>).', correta: true, porque: 'Cursor, Codex e OpenCode leem <code>AGENTS.md</code> nativamente (verificado em 12/10/2026); o ponteiro cobre o Claude Code.' },
            { id: 'd', texto: 'Colocar tudo em <code>.cursor/rules</code>, porque as outras ferramentas leem essa pasta.', correta: false, porque: 'as regras do Cursor são específicas dele, embora o OpenCode consiga apontar para elas pelo campo <code>instructions</code>.' }
          ], tutorDepois: 'Uma fonte, vários ponteiros.' },
        { tipo: 'takeaway', html: 'Skills <mark>ensinam</mark>, hooks <mark>garantem</mark>, e o que não pode falhar fica em <mark>camadas que olham o diff</mark>.' }
      ] }
    ]
  });
})();
