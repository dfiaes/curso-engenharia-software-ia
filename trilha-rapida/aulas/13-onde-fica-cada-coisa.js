/* Aula 13 · Onde fica cada coisa. Fatos: TR-texto.html, Passo 11 (verificado em 12/10/2026). Itens com † não foram lidos em página oficial. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };

  function tabela(linhas) {
    return '<table><thead><tr><th>Recurso</th><th>Onde fica e como usar</th></tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr><td><strong>' + r[0] + '</strong></td><td>' + r[1] + '</td></tr>'; }).join('') +
      '</tbody></table>';
  }

  var nota = '<p class="ta-nota">Verificado em 12/10/2026 contra a documentação oficial de cada ferramenta. † marca o que não foi lido em página oficial nessa verificação: confirme na versão em uso. Produtos mudam rápido; trate a tabela como mapa e a documentação como território.</p>';

  TrilhaAula.registrar({
    id: 'onde-fica-cada-coisa',
    titulo: 'Onde fica cada coisa',
    minutos: 10,
    resumo: 'Os conceitos são os mesmos em todas as ferramentas. Só o endereço muda: instruções, comandos, skills, hooks, MCP e subagentes em cada uma.',
    revisao: [
      {
        "id": "regra-todas",
        "pergunta": "Cursor e Claude Code no mesmo time. Onde escrever a regra \"não alterar <code>deploy.yml</code>\"?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Uma vez no repositório; cada ferramenta só ganha um ponteiro",
            "correta": true,
            "porque": "escreva uma vez, aponte várias."
          },
          {
            "id": "b",
            "texto": "Uma cópia em cada ferramenta, editadas à mão",
            "correta": false,
            "porque": "as cópias divergem."
          },
          {
            "id": "c",
            "texto": "Só na ferramenta que você mais usa",
            "correta": false,
            "porque": "o resto do time fica sem a regra."
          }
        ]
      },
      {
        "id": "claude-le",
        "pergunta": "Qual arquivo de instruções o Claude Code lê?",
        "opcoes": [
          {
            "id": "a",
            "texto": "O <code>CLAUDE.md</code>, que apenas importa o <code>AGENTS.md</code>",
            "correta": true,
            "porque": "o conteúdo fica num lugar só."
          },
          {
            "id": "b",
            "texto": "Só o AGENTS.md, diretamente",
            "correta": false,
            "porque": "Codex e OpenCode leem o AGENTS.md direto; o Claude Code lê o CLAUDE.md."
          },
          {
            "id": "c",
            "texto": "Só o .cursor/rules",
            "correta": false,
            "porque": "é a pasta de regras do Cursor."
          }
        ]
      },
      {
        "id": "muda-fica",
        "pergunta": "Ao trocar de ferramenta, o que muda e o que fica?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Os conceitos ficam; muda o endereço, ou seja, pastas e nomes de arquivo",
            "correta": true,
            "porque": "instruções, comandos, skills, hooks, MCP e subagentes existem em todas."
          },
          {
            "id": "b",
            "texto": "Os conceitos mudam; os endereços são os mesmos",
            "correta": false,
            "porque": "é o contrário."
          },
          {
            "id": "c",
            "texto": "Tudo muda, é preciso reaprender",
            "correta": false,
            "porque": "os conceitos se transferem."
          }
        ]
      }
    ],
    abas: [
      { rotulo: 'Mapa por ferramenta', blocos: [
        { tipo: 'texto', html:
          '<p>Os conceitos são os mesmos em todas as ferramentas; só o endereço muda. Escolha a aba da ferramenta que o seu time usa hoje e veja onde cada recurso mora. Depois compare com a de amanhã: o método não muda.</p>' +
          nota },
        { tipo: 'abas', rotulo: 'Ferramenta', itens: [
          { rotulo: 'Cursor', blocos: [{ tipo: 'texto', largo: true, html: tabela([
            ['Instruções do projeto', '<code>.cursor/rules/*.mdc</code> (tipos: sempre, por glob, pedida pelo agente, manual) e <code>AGENTS.md</code> na raiz'],
            ['Regras por área e skills', 'Regras com <code>globs</code> por pasta; subpastas podem ter o próprio <code>.cursor/rules</code>'],
            ['Comandos reutilizáveis', 'Comandos de projeto em <code>.cursor/commands</code> (veja a aula sobre comandos)'],
            ['Hooks', 'Hooks † (confirme na versão em uso)'],
            ['Modo plano e só-leitura', 'Modo Plan †'],
            ['Subagentes', 'Subagentes †'],
            ['MCP', 'Sim †'],
            ['Permissões', 'Aprovação de comandos †'],
            ['Revisão de PR', 'Revisão automática de PR (Bugbot) †'],
            ['Rodar em CI ou sem tela', 'Agentes em segundo plano †']
          ]) }] },
          { rotulo: 'Codex', blocos: [{ tipo: 'texto', largo: true, html: tabela([
            ['Instruções do projeto', '<code>AGENTS.md</code>: global em <code>~/.codex</code>, depois da raiz do projeto até o diretório atual, concatenados (limite padrão 32 KiB)'],
            ['Regras por área e skills', 'Skills (seção "Skills &amp; Plugins" da documentação)'],
            ['Comandos reutilizáveis', 'Slash commands (documentação "Slash commands")'],
            ['Hooks', 'Hooks (documentação "Hooks")'],
            ['Modo plano e só-leitura', 'Sandbox e modos de aprovação †'],
            ['Subagentes', 'Subagents (documentação "Subagents")'],
            ['MCP', 'Sim (documentação "MCP")'],
            ['Permissões', 'Sandbox e aprovações †'],
            ['Revisão de PR', 'Revisão de código no GitHub; regras na seção <code>## Code Review Rules</code> do <code>AGENTS.md</code> mais próximo do código'],
            ['Rodar em CI ou sem tela', 'Execução não interativa †']
          ]) }] },
          { rotulo: 'OpenCode', blocos: [{ tipo: 'texto', largo: true, html: tabela([
            ['Instruções do projeto', '<code>AGENTS.md</code> na raiz (criado por <code>/init</code>)'],
            ['Regras por área e skills', 'Skills (documentação "skills")'],
            ['Comandos reutilizáveis', 'Commands (documentação "commands")'],
            ['Hooks', 'Plugins (documentação "plugins")'],
            ['Modo plano e só-leitura', 'Modo Plan: alterna com a tecla Tab; desabilita edições e sugere uma abordagem'],
            ['Subagentes', 'Agents e subagents (documentação "agents")'],
            ['MCP', 'Sim (documentação "mcp-servers")'],
            ['Permissões', 'Documentação "permissions"'],
            ['Revisão de PR', 'Integração com GitHub (documentação "github")'],
            ['Rodar em CI ou sem tela', 'Execução não interativa †']
          ]) }] },
          { rotulo: 'Claude', blocos: [{ tipo: 'texto', largo: true, html: tabela([
            ['Instruções do projeto', '<code>CLAUDE.md</code>; pode importar o <code>AGENTS.md</code> com <code>@AGENTS.md</code>'],
            ['Regras por área e skills', 'Skills reutilizáveis (ex.: <code>/review-pr</code>)'],
            ['Comandos reutilizáveis', 'Skills invocáveis por <code>/nome</code>'],
            ['Hooks', 'Comandos antes e depois de ações da ferramenta'],
            ['Modo plano e só-leitura', 'Plan mode (propõe antes de editar)'],
            ['Subagentes', 'Sub-agents: agentes paralelos coordenados por um líder'],
            ['MCP', 'Sim (conexão a Jira, Drive, Slack, etc.)'],
            ['Permissões', 'Regras de permissão em configurações'],
            ['Revisão de PR', 'Revisão de código no GitHub e GitHub Actions'],
            ['Rodar em CI ou sem tela', 'Modo <code>-p</code> (print) e GitHub Actions']
          ]) }] }
        ] },
        { tipo: 'texto', largo: true, html: '<h3>Agente próprio</h3>' + tabela([
            ['Instruções do projeto', 'Carregar <code>AGENTS.md</code> no prompt de sistema ou no primeiro turno'],
            ['Regras por área e skills', 'Carregar instruções por demanda (arquivo lido pela ferramenta <code>read</code>)'],
            ['Comandos reutilizáveis', 'Seus <code>prompts/*.md</code> carregados por uma função'],
            ['Hooks', 'Interceptar a chamada de ferramenta no seu loop'],
            ['Modo plano e só-leitura', 'Conjunto de ferramentas só com leitura nessa fase'],
            ['Subagentes', 'Função que abre um loop com contexto próprio'],
            ['MCP', 'Cliente MCP (SDK) no seu loop'],
            ['Permissões', 'Camada de política antes de executar cada ferramenta'],
            ['Revisão de PR', 'Job de CI que chama seu agente com <code>REVIEW.md</code> e comenta no PR'],
            ['Rodar em CI ou sem tela', 'Seu próprio script']
          ]) +
          '<h3>Agente próprio: o mínimo para ser seguro</h3>' +
          '<p>Se você mesmo montou o agente (um loop que chama o modelo, executa ferramentas e devolve resultados), ele precisa do equivalente de cada linha da tabela: (1) carregar <code>AGENTS.md</code>; (2) fases com conjuntos de ferramentas diferentes (leitura na fase de plano); (3) camada de permissão que nega por padrão comandos destrutivos e caminhos protegidos; (4) limite de passos e de custo por tarefa; (5) log de cada ferramenta chamada; (6) entrada externa (tickets, páginas) tratada como dado.</p>' +
          '<p>O conceito de loop e de limites está em <a href="../modulos/M01-workflow-ia-driven/M01.html">M01</a> e <a href="../modulos/M00-ferramental/M00.html">M00</a>.</p>' },
        { tipo: 'texto', html:
          '<h3>Como usar o mapa na prática</h3>' +
          '<ol>' +
          '<li><strong>Conteúdo no repositório, tradução por ferramenta.</strong> Escreva uma vez: <code>AGENTS.md</code>, <code>REVIEW.md</code>, <code>prompts/</code>, <code>docs/</code>, hooks. Cada ferramenta só ganha um ponteiro (<code>CLAUDE.md</code> com <code>@AGENTS.md</code>, <code>.cursor/rules/projeto.mdc</code>).</li>' +
          '<li><strong>Garantias na esteira, não na ferramenta.</strong> O que precisa valer sempre (bloqueios, aprovações) fica em git hooks, CI, branch protection e environments. Isso funciona para qualquer agente, inclusive o seu.</li>' +
          '<li><strong>Recursos de conveniência por ferramenta.</strong> Skills, comandos e subagentes aceleram, mas não são onde mora a regra. Se a regra só existe como skill de uma ferramenta, ela some quando o time trocar.</li>' +
          '</ol>' },
        { tipo: 'takeaway', html: '<mark>Escreva uma vez</mark> no repositório; cada ferramenta só ganha um <mark>ponteiro</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<p>Antes de qualquer mapa, o endereço mais importante é o do repositório. Um repositório configurado para agentes mostra na raiz os arquivos que cada ferramenta lê. Digite <code>ls -a</code> e observe quem é quem.</p>' },
        { tipo: 'rode', id: 'onde-rode', titulo: 'Leia a raiz de um repositório configurado', enunciado: 'Rode o listador de arquivos ocultos. Clique em cada etapa para ver só os arquivos dela.',
          prefixo: '$', entrada: 'ls -a', terminalTitulo: 'repo', unidade: 'ms',
          etapas: [
            { id: 'instrucoes', nome: 'Instruções', descricao: 'Fonte única das regras do projeto', tom: 'dns', ms: 40, linhas: [
              L('out', 'AGENTS.md'), L('out', 'CLAUDE.md'), L('hint', 'AGENTS.md é a fonte. CLAUDE.md só aponta para ele.')] },
            { id: 'ferramentas', nome: 'Pastas por ferramenta', descricao: 'Um ponteiro ou uma pasta por ferramenta', tom: 'tcp', ms: 60, linhas: [
              L('out', '.agents/'), L('out', '.claude/'), L('out', '.cursor/'), L('info', '.agents/ guarda skills e comandos escritos uma vez; as outras pastas só apontam ou complementam.')] },
            { id: 'configuracao', nome: 'Configuração de ferramentas', descricao: 'Servidores MCP e opções de execução', tom: 'tls', ms: 30, linhas: [
              L('out', 'opencode.json'), L('out', '.mcp.json'), L('hint', 'MCP e permissões ficam em arquivos de configuração. Segredo nunca entra aqui: use variável de ambiente.')] }
          ],
          tutorAntes: 'Digite ls -a e aperte Enter. Depois clique em cada etapa e veja o que ela revela.',
          tutorDepois: 'Um arquivo de instruções, uma pasta por ferramenta e a configuração. O resto é ferramenta específica.',
          callout: 'A raiz mostra quais ferramentas o time usa e onde está a fonte única das regras.' },
        { tipo: 'escolha', id: 'onde-escolha-regra', titulo: 'Confira: a regra que vale para todos',
          pergunta: 'O time usa Cursor e Claude Code. Onde escrever a regra "não alterar deploy.yml"?',
          opcoes: [
            { id: 'a', texto: 'Duplicada em <code>.cursor/rules</code> e em <code>CLAUDE.md</code>.', correta: false, porque: 'duplicar diverge com o tempo. Quando uma cópia for atualizada e a outra não, cada ferramenta vai seguir uma regra diferente.' },
            { id: 'b', texto: 'No <code>AGENTS.md</code>, uma vez, e como proteção no repositório (CODEOWNERS, branch protection ou hook de CI).', correta: true, porque: 'o AGENTS.md dá a orientação às ferramentas. A proteção no repositório bloqueia a alteração de qualquer agente, inclusive o seu. Orientação e bloqueio funcionam juntos.' },
            { id: 'c', texto: 'Somente numa skill do Claude Code.', correta: false, porque: 'regra numa skill não vale para as outras ferramentas e não protege nada: a skill só é carregada quando a descrição casa com a tarefa.' }
          ], tutorDepois: 'Orientação fica no AGENTS.md. Bloqueio fica no repositório.' },
        { tipo: 'escolha', id: 'onde-escolha-plano', titulo: 'Confira: modo de planejamento',
          pergunta: 'No OpenCode, como você põe o agente em modo de planejamento, sem edições de arquivo?',
          opcoes: [
            { id: 'a', texto: 'Alternando o modo Plan com a tecla Tab.', correta: true, porque: 'o modo Plan desabilita edições e sugere uma abordagem. Você alterna com Tab e volta ao modo normal quando aprovar o plano.' },
            { id: 'b', texto: 'Removendo o MCP do <code>opencode.json</code>.', correta: false, porque: 'MCP conecta sistemas externos. Tirá-lo não impede o agente de editar arquivos locais.' },
            { id: 'c', texto: 'Criando um hook que bloqueia qualquer escrita.', correta: false, porque: 'hook é um controle da ferramenta e pode ser montado, mas não é o recurso de modo plano do OpenCode. Confirme a configuração na documentação.' }
          ], tutorDepois: 'Plano primeiro, edição depois. A ferramenta tem um modo para isso.' },
        { tipo: 'escolha', id: 'onde-escolha-revisor', titulo: 'Confira: quem revisa',
          pergunta: 'Por que a revisão de um PR deve ser feita por um agente em sessão separada, e não na mesma sessão que escreveu o código?',
          opcoes: [
            { id: 'a', texto: 'Porque é mais barato rodar duas sessões.', correta: false, porque: 'o custo não é o motivo. O motivo é a independência do contexto.' },
            { id: 'b', texto: 'Porque o revisor em contexto novo não herda as premissas e os pontos cegos do autor.', correta: true, porque: 'na mesma sessão, o revisor lê o código com as mesmas suposições de quem o escreveu. Em sessão separada, ele lê o diff como um revisor de fora.' },
            { id: 'c', texto: 'Porque o agente revisor pode aprovar o PR sozinho.', correta: false, porque: 'o agente auxilia a revisão, mas quem aprova é uma pessoa que não escreveu nem pediu o código.' }
          ], tutorDepois: 'Contexto novo, olhar novo. Aprovação continua humana.' },
        { tipo: 'takeaway', html: 'Cada ferramenta tem o seu <mark>endereço</mark>, e a <mark>regra</mark> que vale para todas mora no repositório.' }
      ] }
    ]
  });
})();
