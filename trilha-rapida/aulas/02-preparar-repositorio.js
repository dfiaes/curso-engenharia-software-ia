/* Aula 2 · Preparar o repositório. Fonte: TR-texto.html, Passo 1. A saída do dry-run vem de execução real do kit/bootstrap.py (101 arquivos). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };

  var bootstrap = function () {
    return [
      { id: 'instr', nome: 'Instruções', descricao: 'AGENTS.md e os ponteiros', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python3 kit/bootstrap.py . --dry-run'),
        L('out', 'criaria: AGENTS.md'),
        L('out', 'criaria: CLAUDE.md'),
        L('out', 'criaria: .cursor/rules/projeto.mdc'),
        L('out', 'criaria: REVIEW.md'),
        L('hint', 'uma fonte (AGENTS.md); Claude Code e Cursor só apontam para ela')] },
      { id: 'docs', nome: 'Docs por etapa', descricao: 'Uma pasta por etapa do ciclo', tom: 'tcp', ms: 1, linhas: [
        L('out', 'criaria: docs/intent/_modelo.md'),
        L('out', 'criaria: docs/specs/_modelo.md'),
        L('out', 'criaria: docs/plans/_modelo.md'),
        L('out', 'criaria: docs/adr/_modelo.md'),
        L('out', 'criaria: docs/runbooks/_modelo.md'),
        L('hint', 'intenção, spec, plano, decisão e operação: cada uma com modelo')] },
      { id: 'cmd', nome: 'Um comando só', descricao: 'make check e os hooks', tom: 'tls', ms: 1, linhas: [
        L('out', 'criaria: Makefile'),
        L('out', 'criaria: .pre-commit-config.yaml'),
        L('out', 'criaria: scripts/hooks/block_protected_paths.py'),
        L('out', 'criaria: scripts/hooks/block_test_edits_in_fix.py'),
        L('out', 'criaria: scripts/hooks/scan_secrets.py'),
        L('out', 'criaria: scripts/hooks/check_docs.py'),
        L('hint', 'humano, agente, pre-commit e CI chamam o mesmo alvo')] },
      { id: 'gh', nome: 'GitHub', descricao: 'CI, donos e template de PR', tom: 'request', ms: 1, linhas: [
        L('out', 'criaria: .github/workflows/ci.yml'),
        L('out', 'criaria: .github/workflows/deploy.yml'),
        L('out', 'criaria: .github/CODEOWNERS'),
        L('out', 'criaria: .github/pull_request_template.md'),
        L('out', 'criaria: azure-pipelines.yml'),
        L('hint', 'o ci.yml repete os hooks: o local é conveniência, o CI é a garantia')] },
      { id: 'fluxo', nome: 'Fluxo', descricao: 'Prompts, comandos, skill, Jira', tom: 'response', ms: 1, linhas: [
        L('out', 'criaria: prompts/nova-feature.md'),
        L('out', 'criaria: prompts/onboarding-repo-existente.md'),
        L('out', 'criaria: .agents/commands/nova-feature.md'),
        L('out', 'criaria: .agents/skills/gerar-teste-playwright/SKILL.md'),
        L('out', 'criaria: jira/historia.md'),
        L('out', 'criaria: jira/bug.md'),
        L('out', 'criaria: .mcp.json   (e .cursor/mcp.json)'),
        L('hint', 'prompts, comandos e modelos de ticket prontos para usar')] },
      { id: 'fim', nome: 'Resumo', descricao: 'Nada é gravado no dry-run', tom: 'ink', ms: 1, linhas: [
        L('in', 'resumo: 101 criaria(s), 0 mantido(s), 0 ignorado(s), 0 por ferramenta'),
        L('info', 'a lista acima está abreviada; o comando imprime os 101 caminhos'),
        L('hint', 'sem --dry-run ele copia; nunca sobrescreve arquivo existente')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'preparar-repositorio',
    titulo: 'Preparar o repositório',
    minutos: 18,
    resumo: 'O agente rende o que o ambiente deixa. Uma preparação feita uma vez, que serve a todas as ferramentas, num projeto novo ou herdado.',
    abas: [
      { rotulo: 'Projeto novo', blocos: [
        { tipo: 'texto', html:
          '<p>Um piloto bom num avião sem painel adivinha a altitude. Um piloto mediano num avião com painel e checklist voa bem. O agente é igual: <strong>o repositório é o painel</strong>. Com um comando único de verificação, instruções curtas e documentação organizada, um agente mediano rende como um bom. Sem isso, o melhor agente adivinha.</p>' +
          '<p>A preparação é feita <em>uma vez</em> e serve a todas as ferramentas. Para automatizar quase tudo, use o kit: <code>python kit/bootstrap.py &lt;destino&gt; [--existing] [--dry-run]</code>. Rode primeiro o <code>--dry-run</code>, que só lista o que seria criado.</p>' },
        { tipo: 'rode', id: 'prep-rode', titulo: 'Rode o bootstrap em modo de ensaio', enunciado: 'Execute o kit num diretório vazio com <code>--dry-run</code> e veja o que ele criaria, grupo por grupo.',
          prefixo: '$', entrada: 'python3 kit/bootstrap.py . --dry-run', unidade: 's', etapas: bootstrap(), terminalTitulo: 'terminal',
          tutorAntes: 'Aperte Enter. Depois clique numa etapa para ver só os arquivos dela.',
          tutorDepois: 'Cinco grupos, uma ideia: instruções num lugar, docs por etapa, um comando, hooks e CI, fluxo pronto. Com --dry-run nada foi gravado.',
          callout: 'Você viu tudo que o kit cria sem alterar nenhum arquivo.' },
        { tipo: 'texto', html:
          '<h3>Seis movimentos num projeto novo</h3>' +
          '<ol>' +
          '<li><strong>Instruções em um só lugar.</strong> <code>AGENTS.md</code> na raiz é a fonte única. Codex e OpenCode o leem; Cursor lê <code>AGENTS.md</code> e também <code>.cursor/rules/*.mdc</code>; Claude Code lê <code>CLAUDE.md</code>, que apenas importa o arquivo único. Uma edição, todas as ferramentas.</li>' +
          '<li><strong>Documentação por etapa do ciclo.</strong> Uma pasta por etapa, com <code>_modelo.md</code> em cada. Nome do arquivo: <code>PROJ-123-slug.md</code>, a chave do Jira primeiro.</li>' +
          '<li><strong>Um comando só.</strong> <code>make check</code> faz lint, testes, checagem de documentação e hooks. Humano, agente, pre-commit e CI chamam <em>o mesmo</em> alvo, então "passou na minha máquina" e "passou no CI" significam a mesma coisa. Em .NET: <code>dotnet format --verify-no-changes</code> e <code>dotnet test</code> dentro do alvo.</li>' +
          '<li><strong>Hooks que impedem o erro</strong> em vez de pedir cuidado. Três bloqueios valem mais que dez linhas de instrução: caminhos protegidos (workflows de deploy, infra, <code>.env</code>), testes existentes intocáveis em branch <code>fix/</code> e segredos no diff. <code>pre-commit install</code> liga localmente e o <code>ci.yml</code> repete no servidor.</li>' +
          '<li><strong>Proteção do ramo principal.</strong> Sem ela, qualquer regra é sugestão. Veja o exercício da aba Conferir.</li>' +
          '<li><strong>Donos e template de PR.</strong> <code>.github/CODEOWNERS</code> exige revisão de quem entende de pipeline, infra e do próprio <code>AGENTS.md</code>; <code>.github/pull_request_template.md</code> impõe o checklist (ticket, critérios, doc, risco, rollback, uso de agente).</li>' +
          '</ol>' },
        { tipo: 'abas', rotulo: 'Ponteiros para AGENTS.md', itens: [
          { rotulo: 'Claude Code', blocos: [{ tipo: 'codigo', linguagem: 'markdown', texto: '# CLAUDE.md\n@AGENTS.md' }] },
          { rotulo: 'Cursor', blocos: [{ tipo: 'codigo', linguagem: 'markdown', texto: '# .cursor/rules/projeto.mdc\n---\ndescription: Regras do projeto (ponteiro para AGENTS.md)\nalwaysApply: true\n---\nLeia e siga AGENTS.md na raiz. Para revisão, siga REVIEW.md.' }] },
          { rotulo: 'Codex · OpenCode', blocos: [{ tipo: 'texto', html: '<p>Leem <code>AGENTS.md</code> na raiz direto. Não há ponteiro a criar.</p>' }] },
          { rotulo: 'Agente próprio', blocos: [{ tipo: 'texto', html: '<p>Carregue <code>AGENTS.md</code> no início de toda sessão, como instrução do sistema.</p>' }] }
        ] },
        { tipo: 'texto', largo: true, html:
          '<h3>A estrutura de docs e o Makefile mínimo</h3>' },
        { tipo: 'codigo', linguagem: 'text', texto: 'docs/\n  intent/     # por quê: o problema e o resultado esperado\n  specs/      # o quê: critérios de aceite verificáveis\n  plans/      # como: passos, arquivos, rollback\n  adr/        # decisões caras de reverter\n  runbooks/   # operar, diagnosticar, desfazer\nREVIEW.md     # roteiro do revisor (humano ou agente)' },
        { tipo: 'codigo', linguagem: 'makefile', texto: 'check: lint test docs-check hooks-check\nlint:   ; dotnet format --verify-no-changes\ntest:   ; dotnet test --nologo\ndocs-check: ; python3 scripts/hooks/check_docs.py --base $(BASE)' },
        { tipo: 'callout', tom: 'info', titulo: 'Como é um bom AGENTS.md', html:
          'Curto (menos de 150 linhas), com comandos exatos e <strong>apenas o que o agente não descobriria lendo o código</strong>: como verificar, estrutura de pastas, fluxo (ticket, branch, commit), limites ("não edita <code>deploy.yml</code>, não roda migração em banco compartilhado"), convenções que o linter não cobre e uma seção "Armadilhas conhecidas" que cresce com o tempo. Modelo comentado em <code>kit/template/AGENTS.md</code>.' },
        { tipo: 'takeaway', html: 'Instruções <mark>num arquivo só</mark>, docs <mark>por etapa</mark> e um <mark>comando único</mark> de verificação.' }
      ] },

      { rotulo: 'Projeto existente', blocos: [
        { tipo: 'texto', html:
          '<p>Entrar numa casa velha e começar a derrubar parede sem planta é como o erro caro dos sistemas herdados: pedir mudança a um agente que não conhece o sistema nem tem rede de testes. Troque a ordem: <strong>1)</strong> o agente lê e documenta; <strong>2)</strong> vocês criam <strong>testes de caracterização</strong>; <strong>3)</strong> só então vem o trabalho funcional.</p>' +
          '<p>O <strong>onboarding</strong> é uma sessão em modo plano/leitura (ou sem permissão de escrita) que usa o prompt <code>prompts/onboarding-repo-existente.md</code>. Ele só escreve arquivos depois que você disser "aprovado".</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: 'Você é um engenheiro entrando neste repositório. NÃO altere nenhum arquivo agora.\n1. Mapeie estrutura, entradas, dependências externas, build/teste/deploy.\n2. Descubra e EXECUTE (somente leitura/seguro) os comandos reais; liste os que falham e por quê.\n3. Aponte áreas sem teste, código morto aparente, pontos frágeis, convenções implícitas.\n4. Proponha: docs/architecture.md, AGENTS.md e lista priorizada de testes de caracterização.\n5. Liste dúvidas e suposições. Só escreva arquivos depois que eu disser "aprovado".' },
        { tipo: 'rode', id: 'prep-onboarding', titulo: 'Rode o onboarding só-leitura', enunciado: 'Envie o pedido ao agente num sistema .NET + Angular herdado e veja o que ele descobre antes de escrever qualquer arquivo.',
          prefixo: 'Prompt', entrada: 'faça o onboarding deste repositório, sem alterar nenhum arquivo', unidade: 'min', terminalTitulo: 'agente (modo leitura)',
          etapas: [
            { id: 'mapa', nome: 'Mapear', descricao: 'Projetos, entradas, dependências', tom: 'dns', ms: 4, linhas: [
              L('info', 'modo leitura: escrita desabilitada'),
              L('out', 'ls src/ ; ls web/ ; ls functions/'),
              L('in', '3 projetos: Api (.NET), Web (Angular), Functions (Durable Functions)'),
              L('body', 'dependências externas: SQL Server, Service Bus, Jira, API do parceiro'),
              L('hint', 'o mapa já mostra o que o código não diz: de quem depende')] },
            { id: 'cmds', nome: 'Executar comandos', descricao: 'Build e teste de verdade', tom: 'tcp', ms: 12, linhas: [
              L('cmd', 'dotnet build'), L('in', 'build ok (2 avisos)'),
              L('cmd', 'dotnet test --nologo'), L('out', '212 passed, 3 failed (Functions.Tests, precisa de emulador de storage)'),
              L('cmd', 'npm --prefix web test'), L('out', 'falha: ChromeHeadless não encontrado'),
              L('hint', 'comando que falha é achado, não erro: vai para o AGENTS.md')] },
            { id: 'riscos', nome: 'Riscos e lacunas', descricao: 'Sem teste, frágil, implícito', tom: 'tls', ms: 6, linhas: [
              L('out', 'sem teste: src/Api/Pagamentos/Servico.cs, functions/Orquestracao/'),
              L('body', 'convenção implícita: toda orquestração termina em evento de auditoria'),
              L('body', 'suposição: tabela Legado_Conta ainda é lida pelo relatório mensal'),
              L('hint', 'decisão humana: a suposição está certa?')] },
            { id: 'prop', nome: 'Propor rascunhos', descricao: 'Nada gravado até o "aprovado"', tom: 'response', ms: 5, linhas: [
              L('in', 'rascunho: docs/architecture.md, AGENTS.md'),
              L('in', 'testes de caracterização sugeridos: Servico.cs (3), Orquestracao (2)'),
              L('info', 'aguardando "aprovado" para gravar os arquivos'),
              L('hint', 'esta é a revisão de maior retorno do projeto inteiro')] }
          ],
          tutorAntes: 'Aperte Enter e leia como o agente descobre falhas de build antes de escrever qualquer coisa.',
          tutorDepois: 'Nenhum arquivo foi gravado. O que ele errar aqui é conhecimento tácito: cabe a você corrigir antes de aprovar.',
          callout: 'Onboarding feito: o agente entendeu o sistema sem tocar nele.' },
        { tipo: 'texto', html:
          '<h3>Depois do rascunho</h3>' +
          '<ol>' +
          '<li><strong>Você revisa.</strong> O agente acerta o óbvio e erra o que é conhecimento tácito (por que existe aquela tabela, qual cliente depende daquele comportamento). Corrija, complete e aprove; só então ele grava os dois arquivos.</li>' +
          '<li><strong>Mapa de comandos.</strong> Transforme o que funcionou num <code>Makefile</code> com <code>make check</code>. Se o build leva 40 minutos, crie alvos menores (<code>make test-unit</code>) e diga no <code>AGENTS.md</code> qual rodar em cada passo e qual fica para o CI.</li>' +
          '<li><strong>Testes de caracterização.</strong> Registram o comportamento <em>atual</em>, mesmo estranho: chame a função com entradas reais e fixe a saída (<em>golden master</em>, snapshot). Só para a área que você vai tocar. Não é cobertura geral; é uma cerca ao redor do trecho que vai mudar.</li>' +
          '<li><strong>Adote o resto por camadas.</strong> <code>bootstrap.py --existing</code> copia o que falta sem sobrescrever nada e não traz <code>deploy.yml</code> nem <code>azure-pipelines.yml</code> (compare com a sua esteira e adote por partes). Primeiro hooks e template de PR; depois proteção de branch; por último, autonomia do agente na esteira.</li>' +
          '</ol>' +
          '<p>No kit, o modo existente é exatamente isso: <code>python3 kit/bootstrap.py . --existing --dry-run</code> imprime <code>ignorado (--existing): .github/workflows/deploy.yml</code> e <code>ignorado (--existing): azure-pipelines.yml</code>, e o resto continua sem sobrescrever o que já existe.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          'Aceitar o <code>architecture.md</code> gerado porque "parece certo". Documentação plausível e errada é pior que nenhuma: o agente passa a confiar nela. Verifique três afirmações por amostragem contra o código e exija que cada seção cite arquivos (<code>src/Pagamentos/Servico.cs</code>): assim ela é falsificável.' },
        { tipo: 'takeaway', html: 'Em sistema herdado: <mark>entender e cercar</mark> antes de mudar. Plausível e errado é pior que <mark>nenhuma documentação</mark>.' }
      ] },

      { rotulo: 'Proteger a main', blocos: [
        { tipo: 'texto', html:
          '<p>Hook local pode ser pulado com <code>--no-verify</code>, e há ferramenta sem hooks. A garantia vem de checagem obrigatória no servidor. Num repositório GitHub, isso é a <strong>proteção do ramo principal</strong> (<em>Settings → Branches/Rulesets</em>): PR obrigatório, aprovações mínimas, status check <code>check</code> obrigatório, <em>Require review from Code Owners</em>, bloqueio de push direto e force-push, e "dismiss stale approvals" quando houver novo commit.</p>' +
          '<p>A ordem importa: um status check só pode ser exigido depois de existir. Ponha os passos na sequência em que dá para fazê-los.</p>' },
        { tipo: 'ordene', id: 'prep-ordene', titulo: 'Ordene a preparação da main',
          enunciado: 'Ordene os passos para deixar a <code>main</code> blindada, do primeiro ao último.',
          itens: [
            { id: 'regra', texto: 'Criar o ruleset da <code>main</code>: PR obrigatório, status check <code>check</code>, Code Owners, sem push direto nem force-push, dispensar aprovações antigas' },
            { id: 'env', texto: 'Criar os <em>environments</em> cert e prod com aprovadores obrigatórios, com uma identidade por ambiente' },
            { id: 'ci', texto: 'Commitar o <code>ci.yml</code> que roda <code>make check</code> e repete os hooks' },
            { id: 'teste', texto: 'Testar: tentar um push direto na <code>main</code> e confirmar que foi recusado' },
            { id: 'donos', texto: 'Commitar <code>CODEOWNERS</code> e o template de PR' },
            { id: 'make', texto: 'Garantir que <code>make check</code> passa localmente na máquina limpa' }
          ], solucao: ['make', 'ci', 'donos', 'regra', 'env', 'teste'],
          dica: 'O que a regra exige precisa existir antes de a regra existir. E a prova vem por último.',
          tutorDepois: 'Comando, CI e donos entram primeiro; só então a regra os exige. Environments seguram cert e prod. O teste de push direto prova que nada é sugestão.' },
        { tipo: 'escolha', id: 'prep-legado', titulo: 'Confira: sistema legado sem testes',
          pergunta: 'Num sistema legado sem testes, qual é a primeira coisa a pedir ao agente?',
          opcoes: [
            { id: 'a', texto: 'Que refatore o módulo para ficar testável.', correta: false, porque: 'refatorar sem rede troca um risco por outro.' },
            { id: 'b', texto: 'Que escreva testes unitários para 100% do código.', correta: false, porque: 'cobertura total é cara e testa o que ninguém vai mexer.' },
            { id: 'c', texto: 'Que leia e documente em modo só-leitura e proponha testes de caracterização da área que será alterada.', correta: true, porque: 'caracterização localizada dá a cerca mínima, e o onboarding só-leitura evita que o agente "conserte" o que não entendeu.' }
          ], tutorDepois: 'Entender, cercar, só então mudar.' },
        { tipo: 'escolha', id: 'prep-ci', titulo: 'Confira: hook e CI',
          pergunta: 'Por que o <code>ci.yml</code> repete os hooks que já rodam no pre-commit?',
          opcoes: [
            { id: 'a', texto: 'Porque hook local pode ser pulado; só o CI com branch protection é garantia.', correta: true, porque: 'o hook local é feedback rápido; qualquer pessoa ou agente pode contorná-lo. A garantia é a checagem obrigatória no servidor.' },
            { id: 'b', texto: 'Porque o pre-commit é mais lento.', correta: false, porque: 'a velocidade não é o motivo. O motivo é a garantia.' },
            { id: 'c', texto: 'Por redundância estética.', correta: false, porque: 'a repetição tem função: fechar a brecha de quem pula o hook.' }
          ], tutorDepois: 'O local é conveniência, o CI é a garantia.' },
        { tipo: 'texto', html: '<h3>Checklist da aula</h3><ul>' +
          '<li><code>AGENTS.md</code> preenchido; <code>CLAUDE.md</code> e <code>.cursor/rules/projeto.mdc</code> apontando para ele</li>' +
          '<li><code>docs/{intent,specs,plans,adr,runbooks}/</code> com modelos</li>' +
          '<li><code>make check</code> roda local e no CI com o mesmo resultado</li>' +
          '<li>Hooks instalados (<code>pre-commit install</code>) e repetidos no CI</li>' +
          '<li>Proteção da main: PR, status check, Code Owners, sem force-push</li>' +
          '<li><code>CODEOWNERS</code> e template de PR commitados</li>' +
          '<li>Projeto existente: onboarding só-leitura feito, <code>architecture.md</code> revisado por humano, caracterização da área-alvo pronta</li></ul>' +
          '<p>Ferramental aprofundado em <a href="../modulos/M00-ferramental/M00.html">M00</a>.</p>' },
        { tipo: 'takeaway', html: 'Regra que não é <mark>obrigada no servidor</mark> é sugestão. A <mark>proteção da main</mark> transforma convenção em garantia.' }
      ] }
    ]
  });
})();
