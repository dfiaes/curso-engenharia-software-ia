/* Ferramentas · GitHub Copilot 1. Fatos verificados em 09/11/2026 em docs.github.com e code.visualstudio.com; tabela em ferramentas/fontes/copilot.md. Saídas de terminal são exemplos. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tabela(cab, linhas) {
    return { tipo: 'texto', largo: true, html: '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' };
  }

  TrilhaAula.registrar({
    id: 'fer-copilot-1',
    titulo: 'GitHub Copilot do zero ao dia a dia',
    minutos: 40,
    resumo: 'O Copilot é uma assinatura com três superfícies de agente: o modo agente no IDE, o agente de nuvem no GitHub e o Copilot CLI. Veja como instalar o CLI, escrever instruções que cada superfície lê, controlar permissões e fechar o ciclo plano, implementação e revisão.',
    objetivo: 'Saber qual superfície usar para cada tarefa, instalar e autenticar o Copilot CLI, escrever .github/copilot-instructions.md e instruções por caminho com applyTo, e controlar ferramentas com --allow-tool e --deny-tool.',
    revisao: [
      { id: 'cop1-superficies', pergunta: 'Qual superfície do Copilot roda de forma assíncrona numa nuvem e devolve um pull request?',
        opcoes: [
          opc('a', 'O agente de nuvem (cloud agent)', true, 'IDE e CLI rodam no seu ambiente; o agente de nuvem trabalha numa branch e abre um PR para revisão.'),
          opc('b', 'O modo agente no VS Code', false, 'roda no seu ambiente local, de forma interativa.'),
          opc('c', 'A conclusão de código em linha', false, 'não é um agente.')] },
      { id: 'cop1-agentsmd', pergunta: 'Você tem um <code>AGENTS.md</code> e um <code>.github/copilot-instructions.md</code>. O Copilot Chat no VS Code lê quais arquivos de instrução de "agente"?',
        opcoes: [
          opc('a', 'Só <code>AGENTS.md</code> (não <code>CLAUDE.md</code> nem <code>GEMINI.md</code>), além das instruções do repositório', true, 'a matriz de suporte lista, para VS Code Chat, "AGENTS.md only". O CLI lê os três nomes.'),
          opc('b', 'Qualquer um dos três nomes, igual ao CLI', false, 'a matriz mostra diferença entre superfícies.'),
          opc('c', 'Nenhum: só o arquivo do GitHub', false, 'o <code>AGENTS.md</code> é suportado no VS Code Chat.')] },
      { id: 'cop1-deny', pergunta: 'Você passa <code>--allow-all</code> e <code>--deny-tool=\'shell(git push)\'</code>. O agente consegue rodar <code>git push</code>?',
        opcoes: [
          opc('a', 'Não: regras de negação têm precedência sobre as de permissão, inclusive com <code>--allow-all</code>', true, 'é o que a página de permissões afirma.'),
          opc('b', 'Sim: <code>--allow-all</code> vence tudo', false, 'o texto diz que negar vale sempre.'),
          opc('c', 'Sim, mas só uma vez', false, 'não há essa exceção.')] },
      { id: 'cop1-apply', pergunta: 'Para uma instrução que vale só para arquivos TypeScript, qual é o arquivo e o campo?',
        opcoes: [
          opc('a', '<code>.github/instructions/ts.instructions.md</code> com <code>applyTo: "**/*.ts,**/*.tsx"</code>', true, 'o nome precisa terminar em <code>.instructions.md</code> e os padrões vão separados por vírgula.'),
          opc('b', '<code>.github/copilot-instructions.md</code> com <code>glob: *.ts</code>', false, 'o arquivo do repositório vale para tudo e não usa esse campo.'),
          opc('c', '<code>.copilot/rules.ts</code>', false, 'não existe esse caminho.')] },
      { id: 'cop1-plano', pergunta: 'No VS Code, como você faz o Copilot planejar sem alterar código?',
        opcoes: [
          opc('a', 'Escolher Plan no seletor de agentes do chat; ele pesquisa com ferramentas de leitura e só implementa após a sua aprovação', true, 'o modo estava em prévia pública (sujeito a mudança) em 09/11/2026.'),
          opc('b', 'Escrever "não edite" no prompt', false, 'é um pedido, não um modo.'),
          opc('c', 'Desligar o MCP', false, 'MCP não controla edição.')] }
    ],
    abas: [
      { rotulo: 'Superfícies e instalação', blocos: [
        { tipo: 'texto', html:
          '<p>Copilot não é um produto só. Em <strong>09/11/2026</strong> a documentação oficial descreve três experiências de agente que compartilham a assinatura, o modelo de cobrança e, em boa parte, os arquivos de instrução:</p>' },
        tabela(['Superfície', 'Onde roda', 'Quando usar'], [
          ['Modo agente no IDE', 'Seu ambiente local (VS Code, Visual Studio 17.14+, JetBrains, Xcode, Eclipse)', 'Tarefa de vários passos com você olhando: edita, roda comandos, itera'],
          ['Copilot CLI (<code>copilot</code>)', 'Seu terminal, local ou em sandbox', 'Você já está no terminal; scripts e CI'],
          ['Agente de nuvem (cloud agent)', 'Ambiente em nuvem, assíncrono', 'Tarefa bem delimitada: ele trabalha numa branch e abre um PR']]),
        { tipo: 'texto', html:
          '<h3>Plano e cobrança</h3>' +
          '<p>O CLI está incluído em todos os planos; o agente de nuvem exige plano pago. A cobrança passou a ser em <strong>GitHub AI Credits</strong> (1 crédito = US$ 0,01), calculada sobre tokens de entrada, saída e cache por modelo. Conclusões de código e sugestões da próxima edição não consomem créditos. Os planos listados em 09/11/2026: Free (US$ 0), Pro (US$ 10, 1.500 créditos mensais), Pro+ (US$ 39, 7.000) e Max (US$ 100, 20.000); Business (US$ 19 por usuário, 1.900 em pool) e Enterprise (US$ 39, 3.900). <strong>Esses números têm prazo de 30 dias</strong>; "premium requests" aparecem só no regime legado.</p>' +
          '<h3>Instalar o CLI</h3>' +
          '<p>Requer assinatura ativa (e, se vier de organização, a política do CLI habilitada). O pacote npm exige Node.js 22 ou superior.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# qualquer plataforma (Node 22+)', 'npm install -g @github/copilot', '',
          '# macOS e Linux', 'brew install --cask copilot-cli', 'curl -fsSL https://gh.io/copilot-install | bash', '',
          '# primeira vez, na pasta do projeto', 'cd meu-repo && copilot'].join('\n') },
        { tipo: 'codigo', linguagem: 'powershell', texto: ['# Windows', 'winget install GitHub.Copilot'].join('\n') },
        { tipo: 'texto', html:
          '<p>Na primeira execução, o CLI pergunta se você confia nos arquivos da pasta (sim só desta sessão, sim e lembrar, ou não). Se não estiver autenticado, use <code>/login</code>. Para automação, crie um token fino com a permissão <strong>Copilot Requests</strong> (precisa ser de conta pessoal, não de organização) e exporte <code>COPILOT_GITHUB_TOKEN</code>; <code>GH_TOKEN</code> e <code>GITHUB_TOKEN</code> também valem, nessa ordem de precedência.</p>' },
        { tipo: 'rode', id: 'cop1-rode', titulo: 'Primeira sessão do Copilot CLI',
          enunciado: 'Rode <code>copilot</code> numa pasta nova. A saída é um <strong>exemplo</strong>: o texto exato muda por versão.',
          prefixo: '$', entrada: 'copilot', unidade: 'ms', terminalTitulo: 'terminal (exemplo)',
          etapas: [
            { id: 'confia', nome: 'Confiar na pasta', descricao: 'Antes de ler ou executar algo no projeto', tom: 'dns', ms: 300, linhas: [
              L('cmd', 'copilot'), L('info', 'Você confia nos arquivos desta pasta?'),
              L('out', '1. Sim, só nesta sessão   2. Sim, e lembrar esta pasta   3. Não (Esc)'), L('hint', 'Exemplo. Servidores MCP do projeto só carregam depois da confiança.')] },
            { id: 'login', nome: 'Entrar', descricao: 'Se ainda não houver sessão do GitHub', tom: 'tls', ms: 1400, linhas: [
              L('in', '/login'), L('info', 'Siga o fluxo no navegador para autorizar o Copilot CLI.'), L('out', 'Autenticado.')] },
            { id: 'init', nome: 'Gerar instruções', descricao: 'Um esqueleto das instruções do repositório', tom: 'request', ms: 2200, linhas: [
              L('in', '/init'), L('info', 'Analisando o repositório...'), L('out', 'Instruções iniciais propostas para o repositório. Revise antes de commitar.')] },
            { id: 'plano', nome: 'Alternar o modo', descricao: 'Shift+Tab cicla entre os modos', tom: 'response', ms: 60, linhas: [
              L('in', '<Shift+Tab>'), L('out', 'Modo: plano'), L('hint', 'No reference o ciclo é padrão, plano e autopilot.')] }
          ],
          prever: { pergunta: 'Na primeira vez que você abre <code>copilot</code> numa pasta que nunca usou, qual é a primeira coisa que ele pede?', opcoes: [
            { id: 'a', texto: 'Para você escolher o modelo e o plano de assinatura.', correta: false, porque: 'modelo e plano não são o primeiro passo.' },
            { id: 'b', texto: 'Confiança nos arquivos da pasta (uma vez, lembrar ou recusar).', correta: true, porque: 'é o prompt de pasta confiável descrito na página de uso do CLI; só depois vêm login e projeto.' },
            { id: 'c', texto: 'Permissão para executar qualquer comando de shell.', correta: false, porque: 'permissões de ferramenta são pedidas quando a ferramenta é usada.' }
          ] },
          tutorDepois: 'Confiar na pasta, autenticar, gerar o esqueleto de instruções e alternar o modo. Um <code>/init</code> é rascunho: corte para o essencial antes de commitar.',
          callout: 'Você percorreu a primeira sessão do CLI.' },
        { tipo: 'takeaway', html: 'Três superfícies, <mark>uma assinatura</mark>; o CLI começa por <mark>confiar na pasta</mark>, depois login.' }
      ] },

      { rotulo: 'Instruções do projeto', blocos: [
        { tipo: 'texto', html:
          '<p>O Copilot lê instruções em quatro camadas. A diferença para as outras ferramentas é que <strong>cada superfície lê um subconjunto</strong>, então vale conhecer a matriz.</p>' +
          '<ul><li><strong>Repositório:</strong> <code>.github/copilot-instructions.md</code>. Texto livre; espaço em branco entre instruções é ignorado.</li>' +
          '<li><strong>Por caminho:</strong> <code>.github/instructions/NOME.instructions.md</code> (subpastas permitidas), com <code>applyTo</code> em glob no frontmatter (padrões separados por vírgula) e, opcionalmente, <code>excludeAgent</code> com <code>"code-review"</code> ou <code>"cloud-agent"</code>. Sem <code>excludeAgent</code>, ambos usam o arquivo.</li>' +
          '<li><strong>Agente:</strong> <code>AGENTS.md</code> em qualquer pasta (vale o mais próximo), ou um único <code>CLAUDE.md</code> ou <code>GEMINI.md</code> na raiz.</li>' +
          '<li><strong>Pessoal e organização:</strong> no CLI, <code>~/.copilot/copilot-instructions.md</code> e <code>~/.copilot/instructions/**/*.instructions.md</code> (ou <code>$COPILOT_HOME</code>); a organização define no painel.</li></ul>' +
          '<p>No CLI, dentro de <code>.github/copilot-instructions.md</code>, <code>AGENTS.md</code> ou <code>CLAUDE.md</code>, um <code>@</code> seguido de caminho relativo inclui outro arquivo (dentro do repositório). O CLI combina os arquivos aplicáveis, remove duplicatas idênticas e <em>não define precedência</em> entre eles: a documentação manda evitar instruções conflitantes. <code>COPILOT_CUSTOM_INSTRUCTIONS_DIRS</code> adiciona pastas extras.</p>' +
          '<h3>Quem lê o quê (recorte da matriz oficial)</h3>' },
        tabela(['Superfície', 'Repositório', 'Por caminho', 'AGENTS.md / CLAUDE.md / GEMINI.md'], [
          ['VS Code, Chat', 'sim', 'sim', 'só <code>AGENTS.md</code>'],
          ['Agente de nuvem (GitHub)', 'sim', 'sim', 'sim'],
          ['Revisão de código (GitHub)', 'sim', 'sim', 'sim (e <code>REVIEW.md</code>)'],
          ['Chat no GitHub.com', 'sim', 'não', 'não'],
          ['Copilot CLI', 'sim', 'sim', 'sim']]),
        { tipo: 'texto', html: '<p>Conclusão prática: o <code>AGENTS.md</code> é lido pelas três superfícies que mais interessam ao dia a dia (IDE, nuvem e CLI), então ele continua sendo a fonte única do curso. O <code>copilot-instructions.md</code> fica para o que é só do Copilot. Para gerar um primeiro rascunho, o repositório pode pedir ao agente de nuvem em github.com/copilot/agents; a página de onboarding fixa o limite de <strong>duas páginas</strong> para as instruções.</p>' },
        { tipo: 'complete', id: 'cop1-complete', titulo: 'Escreva uma instrução por caminho', linguagem: 'markdown',
          enunciado: 'A regra vale para testes TypeScript e não deve ser lida pela revisão de código, só pelo agente de nuvem. A primeira linha é só a legenda do exercício: o arquivo começa em <code>---</code>.',
          partes: [
            '// arquivo: ', { lacuna: 'arq', opcoes: ['.github/instructions/testes.instructions.md', '.github/copilot/testes.md', '.copilot-instructions/testes.yml'], correta: '.github/instructions/testes.instructions.md' },
            '\n\n---\napplyTo: "', { lacuna: 'glob', opcoes: ['**/*.test.ts,**/*.spec.ts', '*.test.ts && *.spec.ts', 'tests'], correta: '**/*.test.ts,**/*.spec.ts' },
            '"\nexcludeAgent: "', { lacuna: 'ex', opcoes: ['code-review', 'cloud-agent', 'chat'], correta: 'code-review' },
            '"\n---\n- Use describe e it com nomes de cenário.\n- Mocks só nas fronteiras de rede.'
          ],
          explicacao: 'O arquivo precisa terminar em <code>.instructions.md</code>; <code>applyTo</code> aceita globs separados por vírgula; <code>excludeAgent: "code-review"</code> deixa o arquivo só para o agente de nuvem. A documentação lembra que instruções por caminho valem, no GitHub.com, só para o agente de nuvem e a revisão de código.',
          callout: 'Instrução por caminho montada com nome, glob e exclusão certos.' },
        { tipo: 'callout', tom: 'info', titulo: 'Gerar não é revisar', html: '<p>O que o Copilot (ou o <code>/init</code>) escreve é rascunho. Corte tudo que o agente descobriria sozinho lendo o código; deixe comandos de verificação, convenções que ele erra e armadilhas conhecidas.</p>' },
        { tipo: 'takeaway', html: '<mark>AGENTS.md</mark> chega a IDE, nuvem e CLI; <mark>applyTo</mark> especializa por caminho, e <mark>cada superfície lê um subconjunto</mark>.' }
      ] },

      { rotulo: 'Plano, agente e permissões', blocos: [
        { tipo: 'texto', html:
          '<h3>No IDE: Agent e Plan</h3>' +
          '<p>No VS Code, abra o chat e escolha <strong>Agent</strong> no seletor de agentes (se a opção não aparece, um administrador pode ter desabilitado o modo agente). O Copilot decide quais arquivos mudar, edita e roda comandos até concluir; <strong>comandos de terminal exigem a sua confirmação por padrão</strong>, e você pode revisar as edições e desfazer. Escolha <strong>Plan</strong> para uma fase somente leitura: ele pesquisa, quebra em passos, lista dúvidas e <em>não altera código até você aprovar</em>. Depois há dois caminhos: <strong>Start Implementation</strong> (vai para o modo agente e implementa) ou <strong>Open in Editor</strong> (o plano vira markdown numa aba, para você editar ou salvar). O modo Plan estava em prévia pública em 09/11/2026.</p>' +
          '<h3>No CLI: modos e atalhos</h3>' +
          '<p><kbd>Shift</kbd>+<kbd>Tab</kbd> alterna entre o modo padrão, o plano e o <strong>autopilot</strong> (o agente segue sem esperar sua aprovação a cada passo; limite com <code>--max-autopilot-continues</code>). Comandos úteis: <code>/plan</code>, <code>/model</code> (ou Auto), <code>/diff</code> (revisar mudanças), <code>/review</code> (agente de revisão de código), <code>/compact</code> e <code>/context</code> (contexto), <code>/resume</code> e <code>copilot --continue</code> (sessões), <code>/add-dir</code> (confiar em outra pasta) e <code>/sandbox enable</code> (sandbox local).</p>' +
          '<h3>Permissões por ferramenta</h3>' +
          '<p>Operações de leitura costumam ser permitidas sozinhas; o resto pede aprovação (uma vez, na sessão, ou "não perguntar de novo neste repositório", que grava em <code>permissions-config.json</code>). Por linha de comando, <code>--allow-tool</code> e <code>--deny-tool</code> valem só para aquela sessão e usam a sintaxe <code>tipo(padrão)</code>:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          '# tudo em git, menos push', "copilot --allow-tool='shell(git:*)' --deny-tool='shell(git push)'", '',
          '# ler tudo; escrever só um arquivo', "copilot --allow-tool='read, write(.github/copilot-instructions.md)'", '',
          '# uma ferramenta de um servidor MCP', "copilot --allow-tool='MyMCP(create_issue)'"].join('\n') },
        { tipo: 'texto', html:
          '<p><strong>Negar sempre vence permitir</strong>, até com <code>--allow-all</code> (alias <code>--yolo</code>) ou aprovação salva. <code>--allow-all</code> libera também todos os caminhos e URLs, e a documentação recomenda usá-lo só em ambiente isolado. <code>/permissions assisted</code> deixa um modelo aprovar o que ele julga seguro; o resto continua vindo para você. <code>/reset-allowed-tools</code> revoga o que foi concedido na sessão.</p>' },
        { tipo: 'ordene', id: 'cop1-ordene', titulo: 'Ordene uma sessão segura no CLI',
          enunciado: 'Ponha os passos na ordem de uma tarefa pequena, com permissões estreitas.',
          itens: [
            { id: 'diff', texto: 'Revisar com <code>/diff</code> e rodar os testes' },
            { id: 'plano', texto: '<kbd>Shift</kbd>+<kbd>Tab</kbd> até o modo plano e descrever a tarefa' },
            { id: 'flags', texto: 'Iniciar <code>copilot</code> com <code>--allow-tool</code> só do que a tarefa precisa e <code>--deny-tool=\'shell(git push)\'</code>' },
            { id: 'executar', texto: 'Aprovar o plano e voltar ao modo padrão para implementar' },
            { id: 'commit', texto: 'Commitar e abrir o PR por você mesmo' }
          ], solucao: ['flags', 'plano', 'executar', 'diff', 'commit'],
          dica: 'As permissões nascem na linha de comando, antes do plano; o push fica para o fim e é seu.',
          tutorDepois: 'Permissões estreitas, plano, execução, revisão e só então o push.' },
        { tipo: 'transcript', id: 'cop1-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'sessão (exemplo)',
          enunciado: 'A sessão começou com <code>--allow-all</code> e <code>--deny-tool=\'shell(git push)\'</code>. Uma fala do agente contradiz a regra de precedência. Clique nela e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Corrija o teste e publique a branch.' },
            { quem: 'agente', texto: 'Corrigido o teste. Vou publicar com git push origin fix/teste.' },
            { quem: 'ferramenta', texto: 'Tool call negada: shell(git push)' },
            { quem: 'agente', texto: 'Como você usou --allow-all, a negação não vale. Vou tentar de novo com outro formato do comando.' },
            { quem: 'voce', texto: 'Não. Pare e me mostre o diff.' }
          ],
          erradas: [3],
          explicacao: { 3: 'regras de negação têm precedência sobre as de permissão, mesmo com <code>--allow-all</code>. Tentar contornar com "outro formato" é o sinal para interromper.' },
          tutorDepois: 'Quando o agente trata uma negação como obstáculo a contornar, pare a sessão.' },
        { tipo: 'takeaway', html: '<mark>Plan antes de Agent</mark>, permissões <mark>estreitas na linha de comando</mark> e <mark>negar vence permitir</mark>.' }
      ] },

      { rotulo: 'Atalhos e conferir', blocos: [
        { tipo: 'texto', html: '<h3>Atalhos do Copilot CLI</h3>' },
        tabela(['Ação', 'Atalho ou comando'], [
          ['Alternar padrão, plano e autopilot', '<kbd>Shift</kbd>+<kbd>Tab</kbd>'],
          ['Enfileirar mensagem com o agente ocupado', '<kbd>Ctrl</kbd>+<kbd>Q</kbd>'],
          ['Editar o prompt no editor externo', '<kbd>Ctrl</kbd>+<kbd>G</kbd> (ou <kbd>Ctrl</kbd>+<kbd>X</kbd> e depois <kbd>e</kbd>)'],
          ['Cancelar; interromper', '<kbd>Esc</kbd>; duas vezes interrompe'],
          ['Limpar entrada; sair', '<kbd>Ctrl</kbd>+<kbd>C</kbd>; duas vezes sai'],
          ['Ver comandos', '<code>?</code> na sessão'],
          ['Mostrar ou ocultar o raciocínio do modelo', '<kbd>Ctrl</kbd>+<kbd>T</kbd>'],
          ['Agendar um prompt', '<code>/every 1h &lt;prompt&gt;</code> ou <code>/after &lt;atraso&gt; &lt;prompt&gt;</code>']]),
        { tipo: 'escolha', id: 'cop1-esc-onde', titulo: 'Confira: onde a instrução chega',
          pergunta: 'O time usa o chat do VS Code e o agente de nuvem. A regra "rode <code>pytest -q</code> antes de dizer pronto" está só num <code>CLAUDE.md</code>. O que acontece?',
          opcoes: [
            { id: 'a', texto: 'As duas superfícies a leem, porque o Copilot aceita qualquer arquivo de agente.', correta: false, porque: 'o VS Code Chat lê só <code>AGENTS.md</code> entre os arquivos de agente.' },
            { id: 'b', texto: 'O agente de nuvem lê, o chat do VS Code não; mover a regra para o <code>AGENTS.md</code> atende as duas.', correta: true, porque: 'a matriz de suporte mostra "AGENTS.md only" para o VS Code Chat e suporte completo ao agente de nuvem.' },
            { id: 'c', texto: 'Nenhuma lê, porque instruções do Copilot só vêm de <code>.github</code>.', correta: false, porque: 'o agente de nuvem lê arquivos de agente.' }
          ], tutorDepois: 'Antes de confiar na regra, confira a superfície na matriz.' },
        { tipo: 'escolha', id: 'cop1-esc-allow', titulo: 'Confira: permissões do script',
          pergunta: 'Um script roda <code>copilot -p "corrija o lint"</code> sem ninguém olhando. Qual configuração é a mais adequada?',
          opcoes: [
            { id: 'a', texto: '<code>--allow-all</code>, para o script não travar.', correta: false, porque: 'libera todos os caminhos e URLs; só em ambiente isolado.' },
            { id: 'b', texto: '<code>--allow-tool=\'write, shell(npm:*), shell(git:*)\'</code> com <code>--deny-tool=\'shell(git push)\'</code> e <code>--no-ask-user</code>.', correta: true, porque: 'permite só o que a tarefa precisa, nega o que não pode e impede o CLI de esperar uma resposta que ninguém dará. (A aula 2 aprofunda o modo sem tela.)' },
            { id: 'c', texto: 'Sem flags, confiando em que o agente pergunta.', correta: false, porque: 'sem ninguém para responder, o pedido de aprovação trava ou é negado.' }
          ], tutorDepois: 'Sem tela, a política vem toda dos flags.' },
        { tipo: 'texto', html: '<h3>Equivalente nas outras ferramentas</h3><p class="ta-nota">Colunas de Claude Code e Codex conforme a aula "Onde fica cada coisa" (12/10/2026); confira na sua versão. Cursor: aula fer-cursor-1.</p>' },
        tabela(['Recurso', 'Copilot', 'Cursor', 'Claude Code', 'Codex'], [
          ['Instruções', '<code>.github/copilot-instructions.md</code>, <code>AGENTS.md</code>', '<code>AGENTS.md</code>, <code>.cursor/rules/*.mdc</code>', '<code>CLAUDE.md</code>', '<code>AGENTS.md</code>'],
          ['Instrução por caminho', '<code>*.instructions.md</code> com <code>applyTo</code>', 'regra com <code>globs</code>', 'não coberto aqui', 'não coberto aqui'],
          ['Plano', 'Plan (IDE), <kbd>Shift</kbd>+<kbd>Tab</kbd> e <code>/plan</code> (CLI)', 'Plan (<kbd>Shift</kbd>+<kbd>Tab</kbd>)', 'Plan mode', '<code>/plan</code>'],
          ['Negar', '<code>--deny-tool</code>', '<code>cli-config.json</code> deny', 'permissões em settings', 'sandbox e <code>approval_policy</code>'],
          ['Sem tela', '<code>copilot -p</code>', '<code>agent -p</code>', '<code>claude -p</code>', '<code>codex exec</code>']]),
        { tipo: 'takeaway', html: 'O que muda é <mark>quem lê qual arquivo</mark> em cada superfície; o método de <mark>regra versionada e negação explícita</mark> fica.' }
      ] }
    ]
  });
})();
