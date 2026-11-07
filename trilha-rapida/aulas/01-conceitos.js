/* Aula 1 · Conceitos: vocabulário agnóstico de ferramenta. Fatos de caminhos: TR-texto.html, passos 7, 8, 9 e 11 (verificado em 12/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };

  function tabela(linhas) {
    return '<table><thead><tr><th>Recurso</th><th>Onde fica</th><th>Como chamar ou observação</th></tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr><td><strong>' + r[0] + '</strong></td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>'; }).join('') +
      '</tbody></table>';
  }
  var nota = '<p class="ta-nota">Verificado em 12/10/2026 contra a documentação oficial de cada ferramenta. † marca o que não foi lido em página oficial nessa verificação: confirme na versão em uso. Produtos mudam rápido; trate a tabela como mapa e a documentação como território.</p>';

  TrilhaAula.registrar({
    id: 'conceitos',
    titulo: 'Conceitos e vocabulário',
    minutos: 15,
    resumo: 'Nove palavras que aparecem em toda ferramenta de agente, com o mesmo significado em todas. Primeiro a ideia, depois o endereço.',
    revisao: [
      {
        "id": "quem-le-arquivo",
        "pergunta": "O agente pede para ler um arquivo. Quem executa a leitura?",
        "opcoes": [
          {
            "id": "a",
            "texto": "O harness executa a ferramenta; o modelo só pede e lê o resultado",
            "correta": true,
            "porque": "o modelo só produz texto; ferramentas, permissões e instruções vêm do harness."
          },
          {
            "id": "b",
            "texto": "O modelo, que lê o disco diretamente",
            "correta": false,
            "porque": "o modelo não tem acesso ao disco sem uma ferramenta entregue pelo harness."
          },
          {
            "id": "c",
            "texto": "O subagente, sempre",
            "correta": false,
            "porque": "subagente é outro agente com contexto isolado; não é quem executa ferramentas."
          }
        ]
      },
      {
        "id": "subagente-ganho",
        "pergunta": "Qual o ganho principal de delegar a um subagente?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Contexto isolado: a conversa principal fica limpa e a revisão é mais independente",
            "correta": true,
            "porque": "ele volta com um resumo, sem carregar a pesquisa inteira."
          },
          {
            "id": "b",
            "texto": "Ele usa um modelo mais inteligente",
            "correta": false,
            "porque": "o ganho vem do isolamento, não do modelo."
          },
          {
            "id": "c",
            "texto": "Ele dispensa o AGENTS.md",
            "correta": false,
            "porque": "as instruções persistentes continuam valendo em toda sessão."
          }
        ]
      },
      {
        "id": "garantir-regra",
        "pergunta": "Você quer garantir que o agente nunca apague a pasta <code>bin/</code>. Qual mecanismo serve?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Um hook, porque ele impede a ação em vez de pedir",
            "correta": true,
            "porque": "regra e skill orientam; o hook garante."
          },
          {
            "id": "b",
            "texto": "Uma skill que explica por que a pasta importa",
            "correta": false,
            "porque": "skill ensina, mas o agente ainda pode ignorá-la."
          },
          {
            "id": "c",
            "texto": "Um comando que você chama quando lembrar",
            "correta": false,
            "porque": "comando só roda quando você o inicia."
          }
        ]
      },
      {
        "id": "comando-skill",
        "pergunta": "Qual a diferença entre comando e skill?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Comando você inicia pelo nome; a skill o agente carrega quando a tarefa casa com a descrição",
            "correta": true,
            "porque": "a skill fica na lombada (nome e descrição) até ser necessária."
          },
          {
            "id": "b",
            "texto": "Comando é carregado em toda sessão; skill só quando você chama",
            "correta": false,
            "porque": "é o contrário: quem entra em toda sessão são as instruções persistentes."
          },
          {
            "id": "c",
            "texto": "São o mesmo recurso com nomes diferentes por ferramenta",
            "correta": false,
            "porque": "são recursos distintos, com gatilhos distintos."
          }
        ]
      },
      {
        "id": "bot-definicao",
        "pergunta": "O que distingue um bot de um assistente de chat?",
        "opcoes": [
          {
            "id": "a",
            "texto": "O gatilho é um evento ou um horário, sem você abrir uma conversa",
            "correta": true,
            "porque": "é o funcionário de plantão, em contraste com o assistente ao seu lado."
          },
          {
            "id": "b",
            "texto": "O bot usa um modelo menor",
            "correta": false,
            "porque": "o tamanho do modelo não define o que é um bot."
          },
          {
            "id": "c",
            "texto": "O bot é um subagente com mais ferramentas",
            "correta": false,
            "porque": "subagente é delegação dentro de uma sessão; bot roda sem sessão sua."
          }
        ]
      }
    ],
    abas: [
      { rotulo: 'Vocabulário', blocos: [
        { tipo: 'texto', html:
          '<h3>Modelo, agente e harness</h3>' +
          '<p>O <strong>modelo</strong> é o motor: recebe texto e devolve texto. Sozinho, não lê arquivo nem roda comando. O <strong>harness</strong> é o carro em volta do motor: volante, freio e painel. É o programa que entrega ferramentas ao modelo (ler arquivo, rodar comando, editar), carrega as instruções, pede a sua permissão e repete o ciclo. O <strong>agente</strong> é o conjunto em movimento: modelo e harness num <strong>loop</strong> até a tarefa acabar.</p>' +
          '<p>Cursor, Codex, OpenCode e Claude Code são harnesses. O mesmo modelo se comporta de um jeito em cada um, porque ferramentas, instruções e permissões mudam.</p>' },
        { tipo: 'rode', id: 'conc-loop', titulo: 'Veja o loop por dentro', enunciado: 'Faça uma pergunta simples ao agente e acompanhe quem faz o quê: o harness monta e executa, o modelo decide e lê.',
          prefixo: 'Prompt', entrada: 'qual é o comando de teste deste repositório?', terminalTitulo: 'agente', unidade: 'ms',
          etapas: [
            { id: 'ctx', nome: 'Harness monta o contexto', descricao: 'Instruções, pergunta e ferramentas', tom: 'dns', ms: 20, linhas: [
              L('info', 'lendo AGENTS.md (28 linhas)'), L('info', 'ferramentas: read, grep, bash, edit'), L('out', 'enviando ao modelo: instruções, pergunta e ferramentas')] },
            { id: 'dec', nome: 'Modelo decide', descricao: 'Responde ou pede uma ferramenta', tom: 'tcp', ms: 900, linhas: [
              L('in', 'modelo: vou procurar no AGENTS.md'), L('out', 'pedido de ferramenta: grep "test" AGENTS.md')] },
            { id: 'exe', nome: 'Harness executa', descricao: 'Roda a ferramenta pedida', tom: 'tls', ms: 60, linhas: [
              L('cmd', 'grep -n "test" AGENTS.md'), L('out', '12: make check   # lint + tipos + testes')] },
            { id: 'ler', nome: 'Modelo lê o resultado', descricao: 'Decide se já pode responder', tom: 'request', ms: 700, linhas: [
              L('in', 'modelo: encontrei, o comando é make check')] },
            { id: 'res', nome: 'Resposta ao usuário', descricao: 'O loop termina', tom: 'response', ms: 10, linhas: [
              L('body', 'Rode make check. Ele executa lint, tipos e testes.')] }
          ],
          tutorAntes: 'Aperte Enter. Repare que o modelo nunca roda nada: ele pede, e o harness executa.',
          tutorDepois: 'Duas idas e voltas entre modelo e harness. Isso é o loop: pedir ferramenta, ler resultado, decidir de novo.',
          callout: 'O agente é o loop entre o modelo e o harness.' },
        { tipo: 'texto', html:
          '<h3>Bot</h3>' +
          '<p>Um <strong>bot</strong> é um assistente que roda num canal ou numa automação, sem você abrir um chat. O gatilho é um evento ou um horário, não a sua digitação. Exemplos: um <em>PR bot</em> que comenta em todo pull request, um bot de chat que responde no canal do time, um <em>agente agendado</em> que toda segunda abre issues de dependências velhas. É o funcionário de plantão, em contraste com o assistente que senta ao seu lado.</p>' +
          '<h3>Subagente</h3>' +
          '<p>Um <strong>subagente</strong> é um agente com <strong>contexto isolado</strong> a quem o agente principal delega uma tarefa. Como pedir a um colega que vá à biblioteca e volte com uma página de resumo: você não carrega os quarenta livros. Ganhos: a conversa principal continua limpa, tarefas rodam em paralelo e uma revisão feita por quem não escreveu o código é mais independente.</p>' +
          '<h3>Regra ou instruções persistentes</h3>' +
          '<p>As <strong>instruções persistentes</strong> (o <code>AGENTS.md</code> é o formato aberto) são carregadas em toda sessão, como o manual de integração do funcionário novo. Servem para comandos de verificação, limites e convenções. Devem ser curtas. São orientação: o modelo pode errar.</p>' +
          '<h3>Comando</h3>' +
          '<p>Um <strong>comando</strong> é um prompt reutilizável que <em>você</em> chama pelo nome, com argumentos: <code>/nova-feature PROJ-123</code>. É a receita anotada no caderno: roda quando você decide. Troca o texto de 20 linhas colado de cada jeito por uma versão única.</p>' +
          '<h3>Skill</h3>' +
          '<p>Uma <strong>skill</strong> é um pacote de instruções e recursos (arquivo <code>SKILL.md</code>, referências, scripts) que o agente carrega <em>quando a tarefa casa</em> com a descrição. É o manual de procedimentos na estante: na lombada só o nome e uma linha de descrição; ele só abre o livro quando o assunto aparece. Por isso a descrição precisa dizer o que a skill faz e quando usá-la.</p>' +
          '<h3>Hook</h3>' +
          '<p>Um <strong>hook</strong> é um controle <strong>determinístico</strong> antes ou depois de uma ação: bloqueia, valida ou registra, não importa o que o modelo "lembrou". É a catraca do prédio, não o aviso na parede. É o lugar do que não pode acontecer: caminho protegido, segredo no diff.</p>' +
          '<h3>MCP</h3>' +
          '<p><strong>MCP</strong> (Model Context Protocol) é o conector padrão entre o agente e ferramentas ou dados: Jira, GitHub, um navegador, um banco. Como a tomada padronizada: você escreve a integração uma vez e qualquer agente compatível a usa.</p>' +
          '<h3>Plugin</h3>' +
          '<p>Um <strong>plugin</strong> é o pacote que distribui tudo isso junto: comandos, skills, hooks e conexões MCP, instalados num passo só. É o kit de instalação da empresa.</p>' },
        { tipo: 'escolha', id: 'conc-harness', titulo: 'Confira: modelo e harness',
          pergunta: 'O agente editou um arquivo errado porque o modelo não "viu" o caminho certo. Qual parte decide quais arquivos o modelo consegue ler?',
          opcoes: [
            { id: 'a', texto: 'O modelo: ele lê o que quiser do disco.', correta: false, porque: 'o modelo só produz texto. Quem lê o disco é uma ferramenta, e quem entrega a ferramenta é o harness.' },
            { id: 'b', texto: 'O harness: ele define as ferramentas, as permissões e o que entra no contexto.', correta: true, porque: 'o modelo pede "ler tal arquivo" e o harness decide se executa. Por isso ajustar instruções e permissões no harness muda o resultado sem trocar de modelo.' },
            { id: 'c', texto: 'O MCP, sempre: nada é lido sem ele.', correta: false, porque: 'MCP conecta sistemas externos. Ler o repositório local é ferramenta nativa do harness.' }
          ], tutorDepois: 'Modelo pede, harness executa.' },
        { tipo: 'takeaway', html: 'O <mark>modelo</mark> pensa, o <mark>harness</mark> age, e o <mark>agente</mark> é os dois em loop.' }
      ] },

      { rotulo: 'Onde fica', blocos: [
        { tipo: 'texto', html:
          '<p>Os conceitos são os mesmos em todas as ferramentas; só o endereço muda. Escolha a ferramenta do seu time para ver onde cada coisa mora.</p>' },
        { tipo: 'abas', rotulo: 'Ferramenta', itens: [
          { rotulo: 'Cursor', blocos: [{ tipo: 'texto', largo: true, html: tabela([
            ['Instruções do projeto', '<code>.cursor/rules/*.mdc</code> (sempre, por glob, pedida pelo agente ou manual) e <code>AGENTS.md</code> na raiz', 'Regras com <code>globs</code> valem por pasta'],
            ['Comando', '<code>.cursor/commands/nome.md</code>', '<code>/nome</code> no chat; Markdown simples'],
            ['Skill', '<code>.agents/skills/</code> e <code>.cursor/skills/</code>; também lê <code>.claude/skills/</code>', '<code>/nome</code>'],
            ['Hook', 'Hooks †', 'Confirme na versão em uso'],
            ['Subagente', 'Subagentes †', 'Confirme na versão em uso'],
            ['MCP', '<code>.cursor/mcp.json</code> (ou <code>~/.cursor/mcp.json</code>)', 'Chave <code>mcpServers</code>']
          ]) + nota }] },
          { rotulo: 'Codex', blocos: [{ tipo: 'texto', largo: true, html: tabela([
            ['Instruções do projeto', '<code>AGENTS.md</code>: global em <code>~/.codex</code>, depois da raiz do projeto até o diretório atual, concatenados', 'Limite padrão de 32 KiB'],
            ['Comando', 'Sem pasta de projeto: prompts personalizados em <code>~/.codex/prompts/</code> (obsoletos)', '<code>/prompts:nome</code>; a recomendação oficial é usar skills'],
            ['Skill', '<code>.agents/skills</code> do diretório atual até a raiz; usuário em <code>$HOME/.agents/skills</code>', '<code>$nome</code> ou <code>/skills</code>'],
            ['Hook', 'Hooks (documentação "Hooks")', ''],
            ['Subagente', 'Subagents (documentação "Subagents")', ''],
            ['MCP', '<code>~/.codex/config.toml</code> (ou <code>.codex/config.toml</code> em projeto confiável)', 'Uma tabela <code>[mcp_servers.nome]</code> por servidor']
          ]) + nota }] },
          { rotulo: 'OpenCode', blocos: [{ tipo: 'texto', largo: true, html: tabela([
            ['Instruções do projeto', '<code>AGENTS.md</code> na raiz (criado por <code>/init</code>)', ''],
            ['Comando', '<code>.opencode/commands/nome.md</code>', '<code>/nome args</code>; também na chave <code>command</code> do <code>opencode.json</code>'],
            ['Skill', '<code>.opencode/skills/</code>, <code>.claude/skills/</code> e <code>.agents/skills/</code>', 'Pela ferramenta de skills do agente'],
            ['Hook', 'Plugins (documentação "plugins")', ''],
            ['Subagente', 'Agents e subagents (documentação "agents")', ''],
            ['MCP', '<code>opencode.json</code>, chave <code>mcp</code>', '<code>type</code> <code>"local"</code> ou <code>"remote"</code>']
          ]) + nota }] },
          { rotulo: 'Claude Code', blocos: [{ tipo: 'texto', largo: true, html: tabela([
            ['Instruções do projeto', '<code>CLAUDE.md</code>', 'Pode importar o <code>AGENTS.md</code> com <code>@AGENTS.md</code>'],
            ['Comando', '<code>.claude/commands/nome.md</code>', '<code>/nome args</code>; unificado com skills'],
            ['Skill', '<code>.claude/skills/&lt;nome&gt;/SKILL.md</code> (e <code>~/.claude/skills</code>)', '<code>/nome</code>'],
            ['Hook', 'Hooks: comandos antes e depois de ações da ferramenta', 'Configurados nas configurações do projeto'],
            ['Subagente', 'Sub-agents: agentes paralelos coordenados por um líder', ''],
            ['MCP', '<code>.mcp.json</code> na raiz (escopo <code>project</code>)', 'Também por linha de comando']
          ]) + nota }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Como usar o mapa</h3>' +
          '<ol><li><strong>Conteúdo no repositório, ponteiro por ferramenta.</strong> Escreva uma vez (<code>AGENTS.md</code>, <code>.agents/commands/</code>, <code>.agents/skills/</code>). Cada ferramenta ganha só um ponteiro, como <code>CLAUDE.md</code> com <code>@AGENTS.md</code>.</li>' +
          '<li><strong>Garantias na esteira, não na ferramenta.</strong> O que precisa valer sempre fica em git hooks, CI, branch protection e CODEOWNERS, que valem para qualquer agente.</li>' +
          '<li><strong>Conveniência por ferramenta.</strong> Skills, comandos e subagentes aceleram, mas não são onde mora a regra.</li></ol>' },
        { tipo: 'takeaway', html: '<mark>Escreva uma vez</mark> no repositório; cada ferramenta só ganha um <mark>ponteiro</mark>.' }
      ] },

      { rotulo: 'Na prática', blocos: [
        { tipo: 'chat', id: 'conc-chat', titulo: 'O que usar aqui?',
          enunciado: 'Você conversa com um agente num repositório. Para cada situação, diga que mecanismo ele deve criar. Só avança com a escolha certa.',
          rodadas: [
            { agente: 'Todo dia o time abre uma feature com os mesmos oito passos, e cada pessoa cola uma versão diferente do prompt. O que eu crio?', opcoes: [
              { texto: 'Crie um comando <code>/nova-feature</code> com esses passos.', boa: true, resposta: 'Criei <code>.agents/commands/nova-feature.md</code>. Agora o time digita <code>/nova-feature PROJ-123</code> e todo mundo roda o mesmo texto.', porque: 'um comando é prompt versionado que você chama pelo nome, exatamente para o fluxo que você inicia.' },
              { texto: 'Crie um hook que escreva o prompt para as pessoas.', boa: false, resposta: 'Hooks rodam em eventos de ferramenta (antes de editar, depois de um comando). Não consigo usar um para montar prompt.', porque: 'hook é controle em eventos, não texto de prompt.' },
              { texto: 'Crie um subagente para cada pessoa do time.', boa: false, resposta: 'Posso, mas subagente isola contexto de uma tarefa. Ele não resolve o problema de cada um colar um texto diferente.', porque: 'subagente resolve contexto e paralelismo, não padronização de prompt.' }
            ] },
            { agente: 'Ninguém pode editar o <code>deploy.yml</code>, nem o agente com boa intenção. Como garanto isso?', opcoes: [
              { texto: 'Escreva "nunca edite o deploy.yml" numa skill.', boa: false, resposta: 'Escrevi na skill. Mas ela só é carregada quando a tarefa casa com a descrição, e é texto: se eu errar, nada me impede.', porque: 'skill e regra são orientação que o modelo pode ignorar. Skill ensina; não impede.' },
              { texto: 'Crie um hook (e um CODEOWNERS) que bloqueie a edição desse arquivo.', boa: true, resposta: 'Criei um hook que recusa edições em <code>deploy.yml</code> e um CODEOWNERS que exige a equipe de plataforma no PR. Testei: a tentativa foi bloqueada.', porque: 'hook e CODEOWNERS são controles duros, valem mesmo que o modelo erre e para qualquer agente.' },
              { texto: 'Crie um comando <code>/nao-edite-deploy</code>.', boa: false, resposta: 'Criei. Só funciona se alguém lembrar de chamar antes de cada tarefa.', porque: 'comando roda só quando você chama. Uma garantia não pode depender de lembrar.' }
            ] },
            { agente: 'Quero que o time gere testes E2E sempre do mesmo jeito, mas só de vez em quando. O procedimento tem um script e uma referência longa. O que eu crio?', opcoes: [
              { texto: 'Crie uma skill <code>gerar-teste-e2e</code> com o script e a referência.', boa: true, resposta: 'Criei <code>.agents/skills/gerar-teste-e2e/SKILL.md</code> com referência e script ao lado. No contexto fica só nome e descrição; o corpo carrega quando alguém pede um teste E2E.', porque: 'skill carrega conhecimento longo sob demanda sem inchar toda sessão.' },
              { texto: 'Coloque tudo no <code>AGENTS.md</code>.', boa: false, resposta: 'Coloquei: são 400 linhas. Agora elas entram em toda sessão, inclusive nas que não têm nada a ver com E2E.', porque: 'instrução persistente deve ser curta; conhecimento raro e longo vira skill.' }
            ] },
            { agente: 'Quero revisar o diff sem a influência de como o código foi escrito, e sem encher o contexto desta conversa. O que eu faço?', opcoes: [
              { texto: 'Abra um subagente de revisão com contexto próprio.', boa: true, resposta: 'Abri um subagente que lê só o diff e o <code>REVIEW.md</code>, em contexto isolado. Voltou com um parecer de 12 linhas; nada do resto entrou aqui.', porque: 'subagente isola contexto e entrega só o resumo, e quem não escreveu o código revisa melhor.' },
              { texto: 'Revise você mesmo, nesta conversa, com o mesmo contexto.', boa: false, resposta: 'Revisei. Concordei com quase tudo, porque eu mesmo tinha tomado aquelas decisões ainda há pouco.', porque: 'quem escreveu tende a confirmar o próprio trabalho; a revisão pede contexto separado.' }
            ] }
          ] },
        { tipo: 'escolha', id: 'conc-plugin', titulo: 'Confira: empacotar',
          pergunta: 'O time quer levar a 20 repositórios o mesmo conjunto: 3 comandos, 2 skills, 1 hook e a conexão com o Jira. O que empacotar?',
          opcoes: [
            { id: 'a', texto: 'Um servidor MCP.', correta: false, porque: 'MCP cobre só a conexão com o Jira. Comandos, skills e hook ficariam de fora.' },
            { id: 'b', texto: 'Um plugin.', correta: true, porque: 'plugin é o pacote que distribui comandos, skills, hooks e MCP de uma vez, com um passo de instalação.' },
            { id: 'c', texto: 'Uma skill grande com tudo dentro.', correta: false, porque: 'skill é conhecimento carregado sob demanda. Ela não instala hook nem configura conexão.' }
          ], tutorDepois: 'Plugin é o que distribui o conjunto; cada peça continua sendo o que é.' },
        { tipo: 'complete', id: 'conc-complete-skill', titulo: 'Monte um SKILL.md', obrigatorio: false, linguagem: 'markdown',
          enunciado: 'Complete o cabeçalho e o corpo de uma skill. Escolha, em cada lacuna, o trecho que faz o agente carregar a skill na hora certa e achar o script.',
          partes: [
            '---\nname: ', { lacuna: 'nome', opcoes: ['gerar-teste-e2e', 'Gerar Teste E2E', 'gerar_teste_e2e.md'], correta: 'gerar-teste-e2e' },
            '\ndescription: ', { lacuna: 'desc', opcoes: ['Skill muito útil para tudo que envolve qualidade.', 'Gera testes E2E com Playwright. Use ao cobrir login, cadastro ou checkout.', 'Testes.'], correta: 'Gera testes E2E com Playwright. Use ao cobrir login, cadastro ou checkout.' },
            '\n---\n\n# Gerar teste E2E\n\nRode `', { lacuna: 'script', opcoes: ['/home/ana/projetos/scripts/novo_teste.py', 'scripts/novo_teste.py', 'o script que usei ontem'], correta: 'scripts/novo_teste.py' },
            '` para criar o esqueleto e depois preencha os passos do fluxo.\n'
          ],
          explicacao: 'O <code>name</code> casa com o nome da pasta, em minúsculas e com hífen. A <code>description</code> é o que fica na lombada: diz o que a skill faz e quando usá-la, e é por ela que o agente decide abrir o livro. O script vai por caminho relativo à pasta da skill, para funcionar em qualquer máquina.',
          callout: 'SKILL.md montado: nome da pasta, descrição com "o quê" e "quando", caminho relativo.' },
        { tipo: 'escreva', id: 'conc-escreva-skill-hook', titulo: 'Skill ou hook, com as suas palavras', obrigatorio: false,
          enunciado: 'Explique com suas palavras a diferença entre <strong>skill</strong> e <strong>hook</strong>. Dê um exemplo do que cada um resolve.',
          placeholder: 'Uma skill é… Um hook é… Por exemplo…',
          rubrica: [
            'Diz que a skill <strong>ensina</strong>: conhecimento que o agente carrega quando a tarefa casa e que ele pode seguir ou deixar de seguir.',
            'Diz que o hook é <strong>determinístico</strong>: roda num evento e bloqueia, valida ou registra, não importa o que o modelo lembrou.',
            'Dá um exemplo de skill (um procedimento, como gerar um teste E2E).',
            'Dá um exemplo de hook (caminho protegido, segredo no diff, comando perigoso).',
            'Conclui que o que não pode acontecer não mora em texto: mora no hook.'
          ],
          modelo: '<p>Uma skill é um manual na estante: o agente lê a descrição e, quando a tarefa casa, abre o procedimento e tenta segui-lo. Serve para ensinar, por exemplo, como gerar um teste E2E com o nosso script. Mas ele pode se desviar.</p><p>Um hook é a catraca: roda sempre que um evento acontece, como "antes de editar um arquivo", e bloqueia ou valida sem depender do que o modelo lembrou. Serve para impedir, por exemplo, que alguém edite <code>deploy.yml</code> ou que um segredo vá no diff. O que não pode acontecer vira hook.</p>' },
        { tipo: 'takeaway', html: '<mark>Skill ensina</mark>, <mark>hook impede</mark>, comando você chama, subagente isola.' }
      ] }
    ]
  });
})();
