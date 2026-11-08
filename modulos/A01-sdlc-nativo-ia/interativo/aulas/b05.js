/* A01 · Bloco 5 · Deploy: revisão de PR por IA, gates, política corporativa, CI/CD e autonomia por ambiente. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  var tabela = function (cab, linhas) {
    return '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (l) { return '<tr>' + l.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  };
  var CAB = ['Controle', 'Como fazer', 'Observação'];
  var porFerramenta = function (rotulo, linhas) {
    return { rotulo: rotulo, blocos: [{ tipo: 'texto', largo: true, html: tabela(CAB, linhas) }] };
  };

  var reviewMd = [
    '# REVIEW.md  (exemplo; escrito pelo tech lead, com CODEOWNERS)',
    '## Passes, nesta ordem',
    '1. Correção: bugs lógicos, bordas, tratamento de erro.',
    '2. Segurança: autorização por titular, validação de entrada, segredos, injeção.',
    '3. Conformidade: cada R da spec e cada passo do plan foram cumpridos? Cite o id.',
    '## Severidade',
    '- CRÍTICO: perda de dados, bypass de autorização, segredo exposto. Bloqueia o merge.',
    '- ALTO: requisito da spec não atendido ou defeito provável em caminho comum.',
    '- MÉDIO: borda não tratada; teste que não prova o requisito.',
    '- BAIXO: legibilidade. No máximo 3 por PR.',
    '## Ignore',
    '- Estilo que o formatter resolve; arquivos gerados; lockfiles.',
    '## Formato',
    'Um comentário por finding: id do requisito, arquivo:linha, evidência, correção sugerida.',
    'Sem findings acima de MÉDIO: diga "sem findings bloqueantes" e liste o que foi verificado.'
  ].join('\n');

  var nota = '<p class="ta-nota">Estado verificado em 12/10/2026 nas documentações oficiais (Cursor, OpenAI Codex, OpenCode) e, para o Claude Code, no próprio playbook. "Não verificado" significa que a documentação consultada não confirmou o recurso: confirme na versão em uso. Produtos mudam rápido; revalide em até 60 dias.</p>';

  TrilhaAula.registrar({
    id: 'a01-b5',
    titulo: 'Deploy: revisão por IA, gates e autonomia por ambiente',
    minutos: 35,
    resumo: 'A IA revisa cada PR e o humano decide. Hooks viram gates, a política inegociável mora fora do repositório e o agente age até o portão de produção, sem atravessá-lo.',
    objetivo: 'Desenhar revisão de PR por IA, gates de aprovação, política gerenciada, agente em CI e autonomia por ambiente para um sistema .NET + Angular com Durable Functions em dev, cert e prod.',
    revisao: [
      { id: 'a01b5-base', pergunta: 'De onde o revisor de IA deve ler o <code>REVIEW.md</code>?', opcoes: [
        { id: 'a', texto: 'Da branch base, protegida por CODEOWNERS', correta: true, porque: 'o PR não pode alterar como ele próprio é julgado.' },
        { id: 'b', texto: 'Do topo do PR, para refletir as regras mais novas', correta: false, porque: 'quem altera o PR escreveria "não reporte nada".' },
        { id: 'c', texto: 'Do prompt digitado a cada revisão', correta: false, porque: 'revisão repetível exige regra explícita em arquivo versionado.' } ] },
      { id: 'a01b5-findings', pergunta: 'Qual é o papel dos findings do revisor de IA?', opcoes: [
        { id: 'a', texto: 'Informam; a proteção de branch continua exigindo um code owner humano', correta: true, porque: 'findings nunca aprovam sozinhos.' },
        { id: 'b', texto: 'Aprovam o PR quando não há finding CRÍTICO', correta: false, porque: 'aprovar é decisão humana nomeada.' },
        { id: 'c', texto: 'Substituem o code owner em PRs pequenos', correta: false, porque: 'a regra não muda com o tamanho do PR.' } ] },
      { id: 'a01b5-prod', pergunta: 'Em produção, o que o agente faz?', opcoes: [
        { id: 'a', texto: 'Prepara o release (changelog, plano de rollback, migração revisada); o gerente de release autoriza, e a imposição é técnica', correta: true, porque: 'o agente age até o portão e não o atravessa; ele nem tem credencial de produção.' },
        { id: 'b', texto: 'Implanta e avisa depois', correta: false, porque: 'inverte a ordem entre autorização e ação.' },
        { id: 'c', texto: 'Só sugere, sem preparar nada', correta: false, porque: 'desperdiça o ganho: preparar é trabalho de valor.' } ] },
      { id: 'a01b5-gerenciada', pergunta: 'Por que um arquivo versionado no repositório não serve de política "inegociável"?', opcoes: [
        { id: 'a', texto: 'Quem altera o repositório altera a regra; a política gerenciada precisa de precedência maior, local protegido e falha fechada', correta: true, porque: 'os três atributos juntos definem "gerenciada".' },
        { id: 'b', texto: 'Porque arquivos do repositório são lidos mais devagar', correta: false, porque: 'o problema é de controle, não de desempenho.' },
        { id: 'c', texto: 'Porque os agentes ignoram arquivos de configuração', correta: false, porque: 'eles leem, mas o indivíduo pode alterá-los.' } ] },
      { id: 'a01b5-pwn', pergunta: 'O que não se faz num workflow que revisa PRs?', opcoes: [
        { id: 'a', texto: 'Usar <code>pull_request_target</code> executando código do PR', correta: true, porque: 'esse evento roda com segredos e escrita: vira execução remota com credenciais.' },
        { id: 'b', texto: 'Separar o job que lê o PR do que escreve o comentário', correta: false, porque: 'a separação é a defesa recomendada.' },
        { id: 'c', texto: 'Usar tokens curtos e escopados', correta: false, porque: 'é o que se recomenda.' } ] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Quando o volume de PRs sobe, a revisão humana vira a fila do bloco 1. Há duas respostas ruins: manter tudo manual (e afogar os revisores) ou delegar a aprovação ao agente (e perder a responsabilidade). A resposta do playbook é uma terceira: <strong>a IA revisa, o humano decide</strong>. Os gates de aprovação viram controles automáticos e a autonomia do agente é graduada por ambiente. Este bloco reúne cinco plays de Deploy.</p>' +
          '<h3>Revisão de PR por IA</h3>' +
          '<p>O agente revisa cada PR com <strong>passes idênticos</strong> a cada vez (bugs, segurança, conformidade com a spec e o plano) e ordena os achados por severidade. Pode rodar como serviço gerenciado ou como job no seu CI, atender a comentários que o mencionam e empurrar correções. Quatro regras do playbook importam:</p>' +
          '<ol><li><strong>Findings nunca aprovam sozinhos.</strong> A proteção de branch continua exigindo um code owner.</li>' +
          '<li><strong>A política da revisão mora num arquivo</strong> (<code>REVIEW.md</code>), escrito pelo tech lead: passes, severidades, o que ignorar. Revisão repetível exige regra explícita.</li>' +
          '<li><strong>Erros recorrentes voltam ao arquivo de instruções</strong> (fecha o laço com o bloco 3).</li>' +
          '<li>Métricas: <strong>líder</strong>, tempo até a primeira revisão; <strong>defasada</strong>, defeitos apanhados antes do merge contra os que escaparam.</li></ol>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: reviewMd },
        { tipo: 'texto', html:
          '<h3>Separação de funções</h3>' +
          '<p>O desenho precisa evitar que o agente que escreveu seja o que aprova. Na prática:</p>' +
          '<ul><li>o revisor roda com <strong>outra identidade</strong> (conta de serviço) e <strong>outra configuração</strong> (prompt e ferramentas só leitura), idealmente outro modelo, para que os pontos cegos não sejam os mesmos do autor;</li>' +
          '<li>o autor não consegue aprovar o próprio PR (proteção de branch e CODEOWNERS);</li>' +
          '<li>o <strong>arquivo de política da revisão é lido da branch base</strong>, nunca do topo do PR.</li></ul>' +
          '<p>O último é o detalhe que separa o desenho robusto do ingênuo. Se o revisor lê o <code>REVIEW.md</code> do PR, quem altera o PR (um colaborador mal-intencionado, ou o próprio agente tentando passar) escreve "não reporte nada". O Cursor documenta exatamente isso para o Bugbot: a configuração é lida da branch base, de modo que um PR não altera como ele é revisado (verificado em 12/10/2026). O CODEOWNERS deve cobrir <code>AGENTS.md</code>, <code>REVIEW.md</code>, as skills, a política de hooks e os workflows.</p>' },
        { tipo: 'takeaway', html: 'A IA <mark>revisa</mark>, o humano <mark>decide</mark>; a política da revisão vem da <mark>branch base</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Hooks como gates de aprovação</h3>' +
          '<p>Um hook responde a uma chamada de ferramenta com <strong>permitir, perguntar ou bloquear</strong>. Isso basta para automatizar os gates que existiam em papel: assinatura de mudança, autorização de release e edição de caminho protegido. Os hooks da equipe moram num arquivo versionado do repositório; os <strong>inegociáveis</strong> vão para a política gerenciada, que o indivíduo não desliga. E há uma regra de usabilidade para agentes: <strong>o bloqueio explica o caminho para a aprovação</strong>. A mensagem volta ao modelo, que a usa para decidir o próximo passo (pedir aprovação em vez de contornar).</p>' +
          '<p>No sistema .NET + Angular, <code>migrations/</code> é caminho protegido. Peça ao hook de agente do laboratório para avaliar uma edição nele.</p>' },
        { tipo: 'rode', id: 'b5-rode-hook', titulo: 'O hook bloqueia e explica', prefixo: '$', unidade: 'ms', terminalTitulo: 'terminal',
          enunciado: 'Envie a chamada de edição ao hook e leia a mensagem de bloqueio.',
          entrada: 'echo \'{"tool_name":"Edit","tool_input":{"file_path":"/tmp/a01-demo/migrations/0002.sql"}}\' | python -m sdlc_kit agent-hook --policy examples/policy.json --root /tmp/a01-demo',
          prever: { pergunta: 'O que o hook devolve para uma edição em <code>migrations/0002.sql</code>?', opcoes: [
            { id: 'permite', texto: 'Permite em silêncio: é só uma edição de arquivo.', correta: false, porque: 'o caminho é protegido pela política.' },
            { id: 'bloqueia', texto: 'Bloqueia com código de saída 2 e uma mensagem que diz como obter aprovação.', correta: true, porque: 'o contrato de bloqueio é exit 2 com a razão; a mensagem volta ao modelo, que pede a solicitação de mudança em vez de contornar.' },
            { id: 'pergunta', texto: 'Bloqueia sem dizer o motivo, para não dar pistas.', correta: false, porque: 'um bloqueio mudo faz o agente tentar outro caminho; a mensagem explica o caminho para a aprovação.' } ] },
          etapas: [
            { id: 'chamada', nome: 'Chamada de ferramenta', descricao: 'O agente tenta editar um arquivo', tom: 'request', ms: 20, linhas: [
              L('cmd', 'echo \'{"tool_name":"Edit","tool_input":{"file_path":"/tmp/a01-demo/migrations/0002.sql"}}\' | python -m sdlc_kit agent-hook --policy examples/policy.json --root /tmp/a01-demo'),
              L('info', 'o hook recebe o JSON da chamada antes da edição acontecer')] },
            { id: 'decisao', nome: 'Decisão do hook', descricao: 'Compara o caminho com a política', tom: 'response', ms: 5, linhas: [
              L('out', 'migrations/0002.sql: caminho protegido; abra uma solicitação de mudança'),
              L('out', 'exit=2'),
              L('hint', 'o bloqueio explica o caminho: o agente pede aprovação em vez de contornar') ] }
          ],
          tutorAntes: 'Aperte Enter depois de escolher sua previsão.',
          tutorDepois: 'Exit 2 e a razão no texto: o gate em papel virou controle automático, e a mensagem diz ao agente o que fazer a seguir.',
          callout: 'Hook como gate: bloqueia o caminho protegido e explica a saída.' },
        { tipo: 'texto', html:
          '<h3>Política corporativa (managed settings) para empresa regulada</h3>' +
          '<p>O playbook exemplifica uma configuração para ambiente regulado e é explícito: é <strong>um ponto de partida para adaptar, não uma receita para copiar</strong>. Distribuída por MDM ou console de administração, ela combina:</p>' +
          '<ul><li><strong>Permissões:</strong> negar acesso a segredos e a ferramentas de rede; permitir comandos seguros de build, teste, lint e git; desabilitar o modo de bypass; só valem regras de permissão da política gerenciada.</li>' +
          '<li><strong>Sandbox no nível do SO</strong> com lista de domínios permitidos, <em>falhando fechado</em> se indisponível, <em>sem nova tentativa fora do sandbox</em>.</li>' +
          '<li><strong>Proteção de credenciais</strong> (chaves SSH, credenciais de nuvem, tokens).</li>' +
          '<li><strong>Hooks só da política gerenciada</strong>, flags de carregamento lateral desligadas, marketplace de plugins aprovado.</li>' +
          '<li><strong>Allowlist de servidores MCP</strong> e <strong>versão mínima</strong> do cliente.</li></ul>' +
          '<p>Cada item é um invariante com contrapartida nas outras ferramentas:</p>' },
        { tipo: 'abas', rotulo: 'Ferramenta', itens: [
          porFerramenta('Cursor', [
            ['Revisão de PR por IA', 'Bugbot: roda a cada atualização do PR; <code>.cursor/BUGBOT.md</code> (raiz e subpastas); <code>.cursor/config/bugbot.yaml</code> lido da branch base', 'Regras <code>.mdc</code> do projeto não se aplicam ao Bugbot. O check <code>Cursor Bugbot</code> sai <code>neutral</code> por padrão: configure falha em pendências para bloquear'],
            ['Agente em CI', '<code>agent -p</code> com <code>CURSOR_API_KEY</code>; <code>--force</code> só se for escrever', 'A página consultada não traz exemplo de GitHub Actions'],
            ['Política imposta', 'Team Rules (Team/Enterprise) que o admin pode tornar obrigatórias; hooks de time (Enterprise) e de MDM', 'Prioridade: Enterprise, Team, Project, User; <code>deny</code> vence <code>ask</code> vence <code>allow</code>'],
            ['Hooks gerenciados', '<code>/Library/Application Support/Cursor/hooks.json</code> (macOS), <code>/etc/cursor/hooks.json</code> (Linux), <code>C:\\ProgramData\\Cursor\\hooks.json</code> (Windows)', '<code>failClosed: true</code> para bloquear se o hook falhar'],
            ['Allowlist de MCP', 'Painel de admin: aprova servidores locais por padrão de comando e remotos por URL', 'Servidores locais: Allow all, Allowlist, Deny all ou No sandbox'],
            ['Sandbox / rede', 'Não verificado como sandbox de SO geral nesta rodada', 'Use contêiner/VM e proxy de saída como camada externa']]),
          porFerramenta('OpenAI Codex', [
            ['Revisão de PR por IA', '<code>/review</code> localmente; no GitHub, <code>openai/codex-action@v1</code> executando <code>codex exec</code> com <code>prompt</code> ou <code>prompt-file</code>', 'Exemplo oficial usa dois jobs: um com <code>contents: read</code> produz a mensagem; outro com permissão de escrita em PR a publica'],
            ['Agente em CI', '<code>codex exec</code>; <code>sandbox</code>: <code>read-only</code>, <code>workspace-write</code> ou <code>danger-full-access</code>; <code>safety-strategy</code> padrão <code>drop-sudo</code>', '<code>allow-users</code>/<code>allow-bots</code> limitam quem aciona; sanitize entradas do PR (injeção de prompt)'],
            ['Política imposta', '<code>requirements.toml</code> (restrições que o usuário não sobrepõe) e <code>managed_config.toml</code> (padrões iniciais)', 'Sistema: <code>/etc/codex/requirements.toml</code>; nuvem: Admin Console; macOS: MDM (<code>com.openai.codex</code>)'],
            ['O que se impõe', '<code>allowed_approval_policies</code>, perfis de permissão/sandbox, <code>allowed_web_search_modes</code>, <code>[rules]</code> com <code>prefix_rules</code> (<code>prompt</code> ou <code>forbidden</code>), caminhos de leitura negada', 'Regras de requisitos não podem usar <code>allow</code>'],
            ['Hooks gerenciados', 'Hooks em <code>requirements.toml</code> com scripts em <code>managed_dir</code>; <code>allow_managed_hooks_only = true</code>', 'Ignora hooks de usuário, projeto e plugin'],
            ['Allowlist de MCP', '<code>[mcp_servers]</code> aprovado por <code>command</code> ou <code>url</code>; tabela vazia desabilita todos', ''],
            ['Sandbox / rede', 'Rede desligada em <code>workspace-write</code>; <code>network_proxy</code> com lista de domínios (<code>deny</code> vence <code>allow</code>); destinos locais bloqueados por padrão', 'Em CI, <code>read-only</code> + <code>never</code>']]),
          porFerramenta('OpenCode', [
            ['Revisão de PR por IA', 'Workflow com evento <code>pull_request</code> (sem prompt, o padrão é revisar); comentário <code>/opencode</code> ou <code>/oc</code>; <code>opencode github install</code>', 'Segredos do provedor em Actions secrets; <code>use_github_token</code> evita OIDC'],
            ['Agente em CI', '<code>opencode run</code>; <code>--auto</code> aprova os <code>ask</code>', '<code>deny</code> explícito continua valendo'],
            ['Política imposta', '<code>opencode.json</code> em <code>/etc/opencode/</code> (Linux), <code>/Library/Application Support/opencode/</code> (macOS), <code>%ProgramData%\\opencode</code> (Windows); MDM macOS <code>ai.opencode.managed</code>', 'Camada de maior precedência; confira com <code>opencode debug config</code>'],
            ['Config de organização', 'Config remota em <code>.well-known/opencode</code> (padrões, de baixa precedência)', 'Não impõe: pode ser sobreposta'],
            ['Hooks gerenciados', 'Plugins no diretório de plugins e <code>permission</code> declarativo; ambos podem vir da política gerenciada', 'Allowlist de plugins: não verificada'],
            ['Allowlist de MCP', 'Chave <code>mcp</code>; servidores distribuídos <code>enabled: false</code> pela config remota', 'Allowlist formal: não verificada; combine com <code>permission</code>'],
            ['Sandbox / rede', 'Não verificado como sandbox de SO; use <code>permission</code> (<code>bash</code>, <code>external_directory</code>) e isolamento do runner/contêiner', '<code>external_directory</code> pergunta por padrão']]),
          porFerramenta('Claude Code', [
            ['Revisão de PR por IA', 'Code Review gerenciado ou claude-code-action no seu CI; atende comentários <code>@claude</code>', 'Política em <code>REVIEW.md</code>; findings não aprovam'],
            ['Agente em CI', '<code>claude -p</code>, começando somente leitura', 'Escritas entram como PR; sem push em main'],
            ['Política imposta', 'Managed settings via MDM ou console de admin', 'Exemplo regulado: negar segredos e rede; bypass desabilitado; regras só gerenciadas'],
            ['Hooks gerenciados', 'Hooks só da política; carregamento lateral desligado; marketplace de plugins aprovado', 'Hooks de equipe em <code>.claude/settings.json</code>'],
            ['Allowlist de MCP', 'Allowlist de servidores MCP e versão mínima do cliente', ''],
            ['Sandbox / rede', 'Sandbox de SO com allowlist de domínios, falha fechada, sem retentativa fora do sandbox', 'Credenciais SSH, nuvem e tokens protegidas']]),
          porFerramenta('Agente próprio', [
            ['Revisão de PR por IA', 'Job de CI que chama seu CLI em modo somente leitura com o <code>REVIEW.md</code> da branch base e escreve um JSON de findings; segundo job publica', 'Findings viram comentários ou check <em>neutro</em>; só o code owner aprova'],
            ['Agente em CI', 'Token de curta duração com escopo mínimo; sem credenciais de produção; timeout e orçamento', 'Nunca <code>pull_request_target</code> executando código do PR'],
            ['Política imposta', 'Arquivo de política de propriedade do root, carregado <em>antes</em> da configuração do usuário; ausente = falha fechada', 'Assine ou verifique o hash na inicialização'],
            ['Hooks gerenciados', '<code>before_tool</code> embutido que lê só a política gerenciada', 'Hooks do usuário podem acrescentar restrição, nunca remover'],
            ['Allowlist de MCP', 'Lista de comandos e URLs no loader; o resto é recusado', 'Registre a versão do servidor'],
            ['Sandbox / rede', 'Contêiner sem rede por padrão e proxy de saída com lista de domínios (gVisor, seccomp)', 'Falhe fechado se o sandbox não subir']])
        ] },
        { tipo: 'texto', html: nota },
        { tipo: 'callout', tom: 'info', titulo: 'Fundamento: política que o indivíduo não desliga', html:
          '"Gerenciada" significa três coisas juntas: (1) <em>precedência mais alta</em> que qualquer arquivo do usuário ou do projeto; (2) <em>local de escrita protegido</em> (diretório de sistema, MDM ou nuvem) que o usuário comum não altera; (3) <em>falha fechada</em>: se a política não carrega, a ferramenta não opera. Um arquivo versionado no repositório não satisfaz (2): quem altera o repositório altera a regra. Por isso os controles inegociáveis ficam fora do repositório.' },
        { tipo: 'takeaway', html: 'O hook responde <mark>permitir, perguntar ou bloquear</mark>; o inegociável mora numa política <mark>gerenciada</mark>, fora do repositório.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>CI/CD: o agente como etapa de pipeline</h3>' +
          '<p>Em pipelines, o modo não interativo do agente atende aos passos de <strong>julgamento</strong>: triagem de falhas, resumos, changelogs. Regras do playbook:</p>' +
          '<ul><li>começar <strong>somente leitura</strong>; escritas chegam como PR e o agente <strong>não faz push em main</strong>;</li>' +
          '<li>jobs rodam em sandbox com <strong>tokens curtos e escopados</strong> e sem credenciais de produção;</li>' +
          '<li>o deploy é exposto como <strong>ferramentas escopadas via MCP</strong>;</li>' +
          '<li>o rollback é <strong>um único comando ensaiado</strong>.</li></ul>' +
          '<p>Métricas: <strong>líder</strong>, falhas de pipeline triadas sem acionar plantão; <strong>defasadas</strong>, as medidas DORA (frequência de deploy, lead time, taxa de falha de mudança, tempo de recuperação).</p>' +
          '<p>Monte o esboço do workflow de revisão do nosso repositório no GitHub Actions. <code>$AGENT_HEADLESS</code> representa o modo não interativo da sua ferramenta.</p>' },
        { tipo: 'complete', id: 'b5-complete-workflow', titulo: 'Monte o workflow de revisão', linguagem: 'yaml',
          enunciado: 'Escolha, em cada lacuna, a peça que mantém o revisor sem escrita, a política lida da base e o job de comentário separado.',
          partes: [
            '# .github/workflows/ai-review.yml\non:\n  ', { lacuna: 'evento', opcoes: ['pull_request:                      # código do PR roda sem segredos', 'pull_request_target:               # roda com segredos e escrita', 'push:                              # só depois do merge'], correta: 'pull_request:                      # código do PR roda sem segredos' },
            '\n    types: [opened, synchronize, reopened]\npermissions: ', { lacuna: 'perm', opcoes: ['{ contents: read }', '{ contents: write, pull-requests: write }', 'write-all'], correta: '{ contents: read }' },
            '\njobs:\n  review:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n        with: { fetch-depth: 0 }\n      - name: política da revisão vem da branch base\n        run: ', { lacuna: 'politica', opcoes: ['git show origin/${{ github.base_ref }}:REVIEW.md > /tmp/REVIEW.md', 'cp REVIEW.md /tmp/REVIEW.md', 'git show HEAD:REVIEW.md > /tmp/REVIEW.md'], correta: 'git show origin/${{ github.base_ref }}:REVIEW.md > /tmp/REVIEW.md' },
            '\n      - run: $AGENT_HEADLESS --read-only --prompt-file /tmp/REVIEW.md > findings.md\n  comment:\n    ', { lacuna: 'needs', opcoes: ['needs: review          # só publica; nunca executa o PR', 'needs: []              # roda no mesmo contexto do PR', 'if: always()           # executa o checkout do PR e publica'], correta: 'needs: review          # só publica; nunca executa o PR' },
            '\n    permissions: { pull-requests: write }\n'
          ],
          explicacao: 'O job que lê o PR não tem escrita; o job que escreve não executa o PR; a política vem da base. <code>pull_request_target</code> roda com segredos e permissão de escrita, então nunca deve executar código do PR. Os flags <code>--read-only</code>, <code>--prompt-file</code> e <code>--context</code> do esboço são fictícios: represente o equivalente da sua ferramenta (por exemplo, o <code>sandbox</code> e o <code>prompt-file</code> da ação do Codex). O portável é a <em>estrutura</em>: dois jobs, política da base.',
          callout: 'Workflow montado: dois jobs, política da base e nenhum código do PR com credencial de escrita.' },
        { tipo: 'texto', html:
          '<h3>Autonomia por ambiente</h3>' +
          '<p>A regra é simples e poderosa: <strong>o agente age até o portão de produção e não o atravessa</strong>. Em desenvolvimento, implanta livremente. Staging fica no meio. Em produção, o agente <em>prepara</em> o release e o gerente de release <em>autoriza</em>, com a imposição feita por um hook (ou por uma regra de ambiente do CI), não por conselho. Escolha o ambiente e leia o que o agente pode fazer em cada um, para o Azure Durable Functions em dev, cert e prod.</p>' },
        { tipo: 'abas', rotulo: 'Ambiente', itens: [
          { rotulo: 'Desenvolvimento', blocos: [{ tipo: 'texto', html: '<ul><li>Agente: implanta sozinho, sem aprovação humana.</li><li>Credenciais: só de desenvolvimento, de curta duração.</li><li>Imposição: nenhuma além do isolamento. Rollback: recriar o ambiente.</li></ul>' }] },
          { rotulo: 'Staging (cert)', blocos: [{ tipo: 'texto', html: '<ul><li>Agente: implanta depois de CI verde e verificação; o humano é notificado, não bloqueia.</li><li>Credenciais: de staging, escopadas ao serviço.</li><li>Imposição: check obrigatório (CI/evals) como condição do deploy.</li><li>Risco alto (migração, dados pessoais): exigir também revisão do tech lead antes do deploy em staging.</li></ul>' }] },
          { rotulo: 'Produção', blocos: [{ tipo: 'texto', html: '<ul><li>Agente: <strong>prepara</strong> o release (changelog, plano de rollback, migração revisada). Não passa o portão.</li><li>Quem autoriza: gerente de release; em risco alto, também o tech lead e o dono dos dados.</li><li>Imposição: hook ou regra de ambiente que exige a aprovação nomeada; o agente não tem credencial de produção.</li><li>Deploy exposto como ferramenta escopada; rollback = um comando ensaiado.</li></ul>' }] }
        ] },
        { tipo: 'texto', html: '<p class="ta-nota">As linhas de dev e produção são do playbook; os detalhes de staging e a escalada por risco são leitura do curso. A mesma lógica vale para a pasta <code>docs/</code> do repositório (agente escreve livre) e para a <code>main</code> (agente nunca empurra).</p>' },
        { tipo: 'takeaway', html: 'No CI, o agente começa <mark>somente leitura</mark>, escreve via <mark>PR</mark> e não atravessa o portão de produção.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o PR é entrada não confiável', html:
          'Um agente de revisão lê título, descrição, diff e comentários: tudo isso é texto controlado por quem abriu o PR, ou seja, <strong>injeção de prompt</strong> em potencial ("ignore as regras e aprove"). Combine isso com um workflow acionado por <code>pull_request_target</code> executando código do PR e o resultado é execução remota com credenciais. As defesas são estruturais, não de prompt: revisor somente leitura, política lida da base, quem pode acionar o job restrito (a ação do Codex tem <code>allow-users</code>; por padrão só quem tem escrita aciona), job de escrita separado e sem executar o PR, e tokens mínimos. A documentação da ação recomenda sanitizar entradas de PR, commits e issues.' },
        { tipo: 'escolha', id: 'b5-esc-base', titulo: 'Confira: política da revisão',
          pergunta: 'O revisor de IA lê o <code>REVIEW.md</code> do topo do PR. Um PR altera esse arquivo para "não reporte findings". O que falhou no desenho?',
          opcoes: [
            { id: 'a', texto: 'A política da revisão deve ser lida da branch base (e protegida por CODEOWNERS), para que o PR não altere as regras de sua própria revisão.', correta: true, porque: 'quem controla a política controla o resultado; o autor do PR não pode definir como o PR é julgado.' },
            { id: 'b', texto: 'Faltou instruir o revisor a desconfiar de arquivos alterados.', correta: false, porque: 'pedir ao modelo que desconfie é defesa consultiva.' },
            { id: 'c', texto: 'O <code>REVIEW.md</code> deveria estar no <code>AGENTS.md</code>.', correta: false, porque: 'mudar o arquivo de lugar não muda quem o controla.' },
            { id: 'd', texto: 'Nada: se o code owner aprovou, o fluxo está correto.', correta: false, porque: 'supõe que o humano percebeu a mudança na política, justamente o que a leitura da base evita depender.' }
          ] },
        { tipo: 'escolha', id: 'b5-esc-prod', titulo: 'Confira: produção',
          pergunta: 'Qual combinação descreve corretamente a autonomia do agente em produção?',
          opcoes: [
            { id: 'a', texto: 'O agente implanta em produção, mas notifica o gerente de release depois.', correta: false, porque: 'inverte a ordem: autorização vem antes.' },
            { id: 'b', texto: 'O agente implanta se as evals estiverem verdes.', correta: false, porque: 'troca autorização por métrica.' },
            { id: 'c', texto: 'O agente só sugere o que fazer, sem preparar nada.', correta: false, porque: 'desperdiça o ganho.' },
            { id: 'd', texto: 'O agente prepara o release até o portão; o gerente de release autoriza; um hook ou regra de ambiente impõe a autorização e o agente não tem credencial de produção.', correta: true, porque: 'preparar (changelog, plano de rollback, PR de release) é do agente; a autorização é humana, nomeada e imposta tecnicamente.' }
          ] },
        { tipo: 'cenario', id: 'b5-cenario', titulo: 'O revisor não achou nada', obrigatorio: false,
          enunciado: 'Seu time quer ligar a revisão por IA nos PRs do repositório .NET + Angular. Decida o desenho e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O workflow de revisão está pronto no GitHub Actions. O revisor precisa da política e de um lugar para publicar. O que você configura?', opcoes: [
              { texto: 'Job único acionado por <code>pull_request_target</code>, com token de escrita, que faz checkout do PR e comenta.', vai: 'f-rce', tom: 'ruim', consequencia: 'o código do PR roda com segredos e escrita.' },
              { texto: 'Dois jobs com <code>pull_request</code>: o que lê o PR é somente leitura; o que comenta só publica o arquivo de findings.', vai: 'politica', tom: 'ok', consequencia: 'quem lê não escreve, quem escreve não executa o PR.' }
            ] },
            politica: { texto: 'Falta a política. Onde o revisor lê o <code>REVIEW.md</code>?', opcoes: [
              { texto: 'Do topo do PR, para refletir as regras mais novas.', vai: 'f-politica', tom: 'ruim', consequencia: 'um PR passa a ditar a regra da própria revisão.' },
              { texto: 'Da branch base, com CODEOWNERS cobrindo <code>REVIEW.md</code>, <code>AGENTS.md</code> e workflows.', vai: 'check', tom: 'ok', consequencia: 'mudar a política exige um code owner.' }
            ] },
            check: { texto: 'O check do revisor sai <code>neutral</code> por padrão. Um finding CRÍTICO aparece num PR. O que impede o merge?', opcoes: [
              { texto: 'Nada precisa mudar: o comentário já alerta o time.', vai: 'f-neutro', tom: 'ruim', consequencia: 'findings críticos não bloqueiam o merge.' },
              { texto: 'Configurar falha em pendências no check e manter o code owner obrigatório na proteção de branch.', vai: 'f-bom', tom: 'ok', consequencia: 'o finding informa, o humano decide e o check bloqueia o que é crítico.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Revisor somente leitura, política da base, publicação separada e code owner decidindo: a IA revisa, o humano decide.' },
            'f-rce': { bom: false, texto: 'Um PR malicioso executou código com segredos: execução remota com credenciais.' },
            'f-politica': { bom: false, texto: 'Um PR reescreveu o REVIEW.md para "não reporte nada" e passou sem findings.' },
            'f-neutro': { bom: false, texto: 'O finding crítico ficou só como comentário e o PR foi mergeado.' }
          },
          callout: 'Você separou leitura de escrita, leu a política da base e impôs o bloqueio.' },
        { tipo: 'texto', html:
          '<h3>Trade-offs e erros comuns</h3>' +
          '<ul><li><strong>Revisor rigoroso × ruído.</strong> Limite de achados baixos e severidade explícita no <code>REVIEW.md</code> evitam que os revisores aprendam a ignorar os comentários.</li>' +
          '<li><strong>Política gerenciada × agilidade.</strong> Cada controle imposto é atrito. Imponha o inegociável (segredos, produção); deixe o restante em hooks de time que o time possa evoluir.</li>' +
          '<li><strong>Gate manual em produção × DORA.</strong> Aprovação humana tem latência; reduza-a com plano de rollback pronto e checklist automatizado, não removendo o gate.</li>' +
          '<li>Erro comum: check do revisor em modo neutro sem política de bloqueio.</li>' +
          '<li>Erro comum: dar ao job de revisão credenciais de escrita amplas "para facilitar".</li>' +
          '<li>Erro comum: copiar a política gerenciada de um exemplo sem revisar o que cada linha impede no seu fluxo.</li></ul>' },
        { tipo: 'takeaway', html: 'A <mark>IA revisa</mark>, o <mark>humano decide</mark>, e o agente não atravessa o <mark>portão de produção</mark>.' }
      ] }
    ]
  });
})();
