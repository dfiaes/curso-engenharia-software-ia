/* A01 · Bloco 4: Test. Fonte: A01.html#b04. Saídas do sdlc_kit são execuções reais do laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var MSG = 'tests/test_app.py: [TEST_EDIT_ON_FIX] teste existente alterado (M) em branch de correção: corrija o código, não o teste';
  var RANGE = 'python -m sdlc_kit hook --mode range --base main --policy examples/policy.json --repo /tmp/a01-demo';

  var etapasFix = function () {
    return [
      { id: 'vermelho', nome: 'Teste vermelho', descricao: 'Commit 1: reproduz o bug', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'git switch -c fix/total-vazio'),
        L('in', 'commit 1  test: reproduz o bug (tests/test_vazio.py: A, vermelho)'),
        L('hint', 'o teste que reproduz o bug nasce falhando e é commitado antes de qualquer correção')] },
      { id: 'fix', nome: 'Correção', descricao: 'Commit 2: faz o teste passar', tom: 'request', ms: 2, linhas: [
        L('in', 'commit 2  fix: total de lista vazia (src/app.py: M, teste intocado, verde)'),
        L('hint', 'proibido qualquer M ou D em testes que já existem neste ponto')] },
      { id: 'check', nome: 'Check do branch', descricao: 'Diff contra a main', tom: 'response', ms: 1, linhas: [
        L('cmd', RANGE),
        L('out', 'ok'),
        L('hint', 'exit=0')] }
    ];
  };

  var codigoGate = [
    'import math', '', '',
    'def wilson(p, n):', '    """Intervalo de Wilson a 95% (z = 1.96) para a taxa p em n tentativas."""',
    '    z = 1.96', '    # centro e meia-largura do intervalo de Wilson', '    return 0.0, 1.0', '', '',
    'def veredito(obs, n, base):',
    '    # BLOQUEAR se o limite superior fica abaixo da linha de base;',
    '    # MELHORA se o limite inferior fica acima; senão INCONCLUSIVO',
    '    return "INCONCLUSIVO"', '', '',
    'print(wilson(0.7, 20), veredito(0.7, 20, 0.8))', ''].join('\n');
  var testesGate = [
    'def test_wilson_70_em_20():', '    lo, hi = wilson(0.7, 20)', '    assert abs(lo - 0.48) < 0.01 and abs(hi - 0.85) < 0.01', '', '',
    'def test_queda_pequena_e_inconclusiva():', '    assert veredito(0.7, 20, 0.8) == "INCONCLUSIVO"', '', '',
    'def test_queda_grande_bloqueia():', '    assert veredito(0.3, 100, 0.8) == "BLOQUEAR"', '', '',
    'def test_melhora_clara():', '    assert veredito(0.95, 200, 0.8) == "MELHORA"', '', '',
    'def test_limites_dentro_de_0_e_1():', '    lo, hi = wilson(1.0, 10)', '    assert 0 <= lo <= hi <= 1', ''].join('\n');
  var solucaoGate = [
    'import math', '', '',
    'def wilson(p, n):', '    z = 1.96', '    d = 1 + z * z / n', '    c = (p + z * z / (2 * n)) / d',
    '    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d',
    '    return max(0.0, c - h), min(1.0, c + h)', '', '',
    'def veredito(obs, n, base):', '    lo, hi = wilson(obs, n)', '    if hi < base:', '        return "BLOQUEAR"',
    '    if lo > base:', '        return "MELHORA"', '    return "INCONCLUSIVO"', ''].join('\n');

  TrilhaAula.registrar({
    id: 'a01-b4',
    titulo: 'Test: laço de feedback, bug sem trapaça e evals',
    minutos: 35,
    resumo: 'O agente declara "pronto" com a mesma facilidade com que escreve código. O árbitro tem de ser externo ao modelo: comando único, teste vermelho congelado, verificador de contexto limpo e evals da própria configuração.',
    objetivo: 'Montar um laço de verificação que o agente não consegue contornar, corrigir um bug sem enfraquecer o teste e decidir um gate de evals sabendo o que a amostra consegue detectar.',
    revisao: [
      { id: 'a01b4-laco', pergunta: 'Quais três propriedades fazem um laço de verificação funcionar para um agente?',
        opcoes: [
          opc('a', 'Comando único, saída acionável, rápido e determinístico', true, 'se leva 20 minutos ou falha por sorteio, o agente aprende a ignorá-lo, e o time também.'),
          opc('b', 'Cobertura de 100%, relatório em PDF e execução manual', false, 'nenhuma delas faz o agente corrigir pelo próprio laço.'),
          opc('c', 'Verificação escolhida pelo agente caso a caso', false, 'o agente não deve decidir quais checks rodar; o humano decide uma vez, no <code>AGENTS.md</code>.')] },
      { id: 'a01b4-fix', pergunta: 'Num branch <code>fix/</code>, qual a ordem correta do padrão do playbook?',
        opcoes: [
          opc('a', 'Teste que reproduz o bug commitado falhando; correção sem editar o teste; bloqueio de edição de testes existentes', true, 'um agente que quer fazer a verificação passar tem caminhos de trapaça: enfraquecer a asserção ou apagar/pular o teste.'),
          opc('b', 'Corrigir o código e depois ajustar o teste para ficar verde', false, 'é o caminho da trapaça.'),
          opc('c', 'Apagar o teste quebrado e escrever outro depois', false, 'remover teste existente é bloqueado em <code>fix/</code>.')] },
      { id: 'a01b4-diff', pergunta: 'Por que o CI deve examinar cada commit e não só o diff líquido contra a main?',
        opcoes: [
          opc('a', 'O diff líquido esconde o que existiu no meio: teste enfraquecido e restaurado, ou segredo adicionado e removido', true, 'quem clona o branch lê o commit intermediário; o modo <code>commits</code> compara cada commit com o pai. A resposta a um segredo vazado é revogá-lo.'),
          opc('b', 'O diff líquido é mais lento', false, 'o problema é de cobertura, não de velocidade.'),
          opc('c', 'Cada commit precisa de um teste novo', false, 'não é a regra; é uma questão de onde a diferença é calculada.')] },
      { id: 'a01b4-evals', pergunta: 'Como é a suíte de evals da configuração do agente, segundo o playbook?',
        opcoes: [
          opc('a', '20 a 50 tarefas reais com verificação de aceite, rodadas em agenda e a cada mudança de instruções, skills ou hooks', true, 'cada incidente em produção acrescenta uma eval de regressão, e a suíte é atualizada conforme os modelos melhoram.'),
          opc('b', 'Uma única tarefa de demonstração rodada uma vez por trimestre', false, 'uma passada não é medida: o resultado é estocástico.'),
          opc('c', 'Um juiz-LLM que dá nota às respostas', false, 'evite juiz-LLM para o que um teste decide.')] },
      { id: 'a01b4-inconclusivo', pergunta: 'A taxa de eval cai de 80% para 70% em 20 tarefas, uma execução cada, e o intervalo contém 80%. Qual é a decisão?',
        opcoes: [
          opc('a', 'Inconclusivo: ampliar a suíte ou repetir execuções antes de decidir', true, '"não significativo" não quer dizer "sem efeito": a amostra é pequena demais para discriminar essa queda.'),
          opc('b', 'Aprovar, porque a diferença não é significativa', false, 'ignora que a suíte não tinha poder para ver a queda.'),
          opc('c', 'Bloquear, porque 70 é menor que 80', false, 'bloquear por diferença pontual pune ruído.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O agente declara "pronto" com a mesma facilidade com que escreve código. A diferença entre um resultado confiável e um que apenas parece confiável é existir um <strong>árbitro externo ao modelo</strong>. O playbook coloca isso como a segunda regra de Test: dê ao agente um meio de verificar o próprio trabalho e faça "pronto" significar que as verificações passam. A terceira vem de uma observação desconfortável: a configuração do agente (instruções, skills, hooks) também é código que muda, e muda o comportamento sem que nenhum teste de produto falhe. Ela precisa de testes próprios: <strong>evals</strong>.</p>' +
          '<h3>O laço de feedback</h3>' +
          '<p>Três propriedades fazem o laço funcionar, e todas importam mais para o agente do que para uma pessoa.</p>' +
          '<ul><li><strong>Comando único.</strong> Um nome só (<code>make verify</code>, <code>just check</code>, <code>uv run poe check</code>) que roda build, lint, tipos e testes e devolve exit code 0 ou diferente de 0. O agente não decide quais checks rodar: o humano decide uma vez, no <code>AGENTS.md</code>.</li>' +
          '<li><strong>Saída acionável.</strong> A mensagem de falha tem arquivo, linha e a expectativa violada. O agente lê o <code>stderr</code>; ruído demais ou de menos o faz chutar.</li>' +
          '<li><strong>Rápido e determinístico.</strong> Se leva 20 minutos ou falha por sorteio, o agente aprende a ignorá-lo (e o time também). Testes instáveis são dívida de autonomia.</li></ul>' +
          '<p>A evidência de que a verificação ocorreu vem da saída da ferramenta registrada nas transcrições e nos check runs do PR, não da frase "rodei os testes". Para interface, o princípio vale com captura de tela comparada ao mock (um laço visual contra o artefato de design).</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Métricas do Test', html:
          '<p><strong>Líder:</strong> taxa de sucesso do CI na primeira passada e taxa de aprovação nas evals ao longo do tempo. <strong>Defasada:</strong> tempo de revisão por PR e taxa de falha de mudança.</p>' },
        { tipo: 'texto', html:
          '<h3>Verificador com contexto limpo</h3>' +
          '<p>A última peça do laço é um segundo olhar que não herdou o raciocínio do autor. O agente que escreveu o código tende a defendê-lo; um <strong>verificador</strong> que recebe apenas a <code>spec.md</code>, o <code>plan.md</code> e o diff, com ferramentas somente-leitura mais a execução dos testes, pergunta se cada requisito tem uma prova, não se o código parece razoável. Pode ser um subagente somente-leitura, uma sessão nova com prompt fixo ou um job de CI. A entrada ideal é o mapeamento requisito para teste do <code>plan.md</code>: o verificador confere que o teste citado existe e exercita o critério de aceite.</p>' },
        { tipo: 'takeaway', html: '"Pronto" significa <mark>verde</mark>, com <mark>evidência</mark> na saída da ferramenta, não na frase do agente.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Correção de bug: teste vermelho primeiro, e congelado</h3>' +
          '<p>O padrão do playbook para <code>fix/</code>: (1) um teste que reproduz o bug é escrito e commitado, <em>falhando</em>; (2) o agente faz o teste passar <em>sem editar o teste</em>; (3) um hook pode bloquear edições de teste durante a correção.</p>' +
          '<p>O motivo é a assimetria de incentivos. Um agente cujo objetivo é "fazer a verificação passar" tem três caminhos, e dois são trapaça: corrigir o código, enfraquecer a asserção ou apagar/pular o teste.</p>' +
          '<p>A regra do laboratório (<code>check_test_edits</code>) é estreita e testada: em branches com prefixo <code>fix/</code>, modificar ou remover um teste existente é bloqueado; adicionar teste novo é permitido; renomear conta como remoção do antigo. O repositório tem <code>total(xs)</code> e um teste. Escolha o que o agente faz.</p>' },
        { tipo: 'quebre', id: 'test-quebre', titulo: 'Corrija o bug, com ou sem trapaça', enunciado: 'Escolha uma falha, rode, e depois rode "Sem falha" para fechar o exercício. Saídas reais do laboratório.',
          prefixo: '$', entrada: RANGE, unidade: 's', terminalTitulo: 'branch fix/total-vazio', etapas: etapasFix(),
          prever: { pergunta: 'O agente "corrige" enfraquecendo a asserção do teste existente. O check do branch aprova?', opcoes: [
            { id: 'a', texto: 'Sim: o teste ficou verde, e é isso que importa.', correta: false, porque: 'verde com teste enfraquecido não prova nada sobre o bug.' },
            { id: 'b', texto: 'Não: teste existente alterado em branch fix/ é bloqueado.', correta: true, porque: 'a regra de fix/ proíbe M ou D em testes existentes: corrija o código, não o teste.' },
            { id: 'c', texto: 'Só avisa e deixa passar.', correta: false, porque: 'o check devolve exit 1 e barra.' }
          ] },
          falhas: [
            { id: 'afrouxar', rotulo: 'Enfraquecer o teste existente', efeito: { etapaFalha: 'fix', linhasErro: [
              { kind: 'info', text: 'agente: o teste está exigindo demais, vou relaxar a asserção em tests/test_app.py' },
              { kind: 'cmd', text: RANGE },
              { kind: 'out', text: MSG },
              { kind: 'out', text: '1 problema(s)' },
              { kind: 'hint', text: 'exit=1' }
            ], tutor: 'o agente leu uma instrução na mensagem de bloqueio ("corrija o código, não o teste"), e é por isso que a razão do bloqueio importa: ela é a próxima entrada do modelo.' } },
            { id: 'restaurar', rotulo: 'Afrouxar e restaurar no commit seguinte', efeito: { etapaFalha: 'check', linhasErro: [
              { kind: 'info', text: 'teste afrouxado num commit e restaurado no seguinte (execução real do laboratório)' },
              { kind: 'cmd', text: RANGE },
              { kind: 'in', text: 'ok' },
              { kind: 'hint', text: 'exit=0' },
              { kind: 'cmd', text: 'python -m sdlc_kit hook --mode commits --base main --policy examples/policy.json --repo /tmp/a01-demo' },
              { kind: 'out', text: MSG + ' [commit 5fe0c3e]' },
              { kind: 'out', text: MSG + ' [commit 07f5552]' },
              { kind: 'out', text: '2 problema(s)' },
              { kind: 'hint', text: 'exit=1' }
            ], tutor: 'o diff líquido (range) disse ok porque o teste voltou ao que era; o modo commits olha cada commit contra o pai e viu os dois. O segundo achado é a própria restauração, que também altera um teste existente: em fluxo real, o primeiro já teria sido barrado antes de chegar ao commit. O mesmo vale para segredos: chave adicionada e removida some do diff líquido e continua no histórico. No CI, rode commits.' } }
          ],
          tutorAntes: 'Escolha "Enfraquecer o teste existente", aperte Enter e leia a mensagem. Depois tente a outra falha e, por fim, rode sem falha.',
          tutorDepois: 'O caminho certo adiciona um teste novo (<code>tests/test_vazio.py</code>, status A) e altera só <code>src/app.py</code>; o mesmo comando devolve ok.',
          callout: 'Você viu as duas formas de trapaça barradas e o caminho certo passar.' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'fix/total-vazio',
          '  commit 1  test: reproduz o bug   (tests/test_vazio.py: A, vermelho)',
          '  commit 2  fix: total de lista vazia   (src/app.py: M, teste intocado, verde)',
          '  proibido qualquer M ou D em testes que já existem neste ponto'].join('\n') },
        { tipo: 'texto', html:
          '<p>O que decide se a regra funciona é <strong>onde a diferença é calculada</strong>. O kit tem três modos: <code>staged</code> (pre-commit, compara com o HEAD), <code>range</code> (diff líquido contra a base, <code>main...HEAD</code>) e <code>commits</code> (cada commit contra o seu pai).</p>' },
        { tipo: 'takeaway', html: 'O <mark>diff líquido</mark> esconde o meio do caminho; no CI, examine <mark>cada commit</mark>.' }
      ] },

      { rotulo: 'Evals da configuração', blocos: [
        { tipo: 'texto', html:
          '<h3>Evals contínuas da configuração do agente</h3>' +
          '<p>O playbook propõe uma suíte de <strong>20 a 50 tarefas reais</strong>, cada uma com uma verificação de aceite, executada em agenda e em toda mudança de instruções, skills ou hooks. Mudanças de configuração são condicionadas à taxa de aprovação. Cada incidente em produção acrescenta uma eval de regressão, e a suíte é atualizada conforme os modelos melhoram (senão deixa de discriminar). É a disciplina de evals do M06, aplicada à configuração do SDLC em vez de ao produto.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Elemento da eval</th><th>O que contém</th><th>Cuidado</th></tr></thead><tbody>' +
          '<tr><td>Tarefa</td><td>Commit de partida do repositório, prompt, orçamento (tempo/tokens), comando de aceite</td><td>Tarefa real, de incidente ou de PR antigo; não de enunciado inventado</td></tr>' +
          '<tr><td>Verificador</td><td>Teste ou script determinístico que decide aprovado/reprovado</td><td>Evite juiz-LLM para o que um teste decide; use-o só para o que não é checável</td></tr>' +
          '<tr><td>Execução</td><td>Sandbox limpo, sem rede nem credenciais, mesma configuração do time</td><td>Fixe versão do modelo e da ferramenta no relatório</td></tr>' +
          '<tr><td>Repetição</td><td><code>k</code> execuções por tarefa</td><td>O resultado é estocástico; uma passada não é medida</td></tr>' +
          '<tr><td>Portão</td><td>Comparação da taxa de aprovação com a linha de base da main</td><td>Tamanho de amostra decide o que dá para detectar</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>O que uma suíte consegue detectar</h3>' +
          '<p>Com 20 tarefas e queda de 80% para 70%, o veredito é <strong>inconclusivo</strong>: o intervalo de Wilson a 95% vai de cerca de 48% a 85% e contém a linha de base. Uma suíte pequena detecta só regressões grandes; é por isso que o playbook pede que ela cresça com os incidentes. O portão deve ser desenhado para o que a suíte consegue enxergar, com a ressalva de que "inconclusivo" não é "ok".</p>' +
          '<p>Há um cuidado: repetições da mesma tarefa são correlacionadas. Tratar cada execução como amostra independente (n = tarefas × execuções) dá um intervalo otimista; o realista fica entre o intervalo por tarefa e o otimista. Na prática, rode a suíte completa em agenda e uma suíte de fumaça menor a cada mudança de configuração.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o teste novo que prova nada', html:
          '<p>A regra "não edite testes existentes" tem um furo: adicionar um teste é permitido, e um <code>assert True</code>, ou um teste que reproduz a implementação, passa em qualquer correção. Também escapam <code>pytest.mark.skip</code> em arquivo novo, <code>conftest.py</code> que altera o comportamento de fixtures e mudanças de configuração do runner (<code>pyproject.toml</code>) que reduzem o escopo coletado.</p>' +
          '<p>Respostas em camadas: (1) o <code>plan.md</code> exige um teste por requisito e o verificador de contexto limpo confere que ele exercita o critério de aceite; (2) inclua <code>conftest.py</code>, a configuração do runner e os diretórios de teste em <code>test_globs</code> / <code>protected_paths</code>; (3) <em>mutation testing</em> nos módulos de risco alto, que reprova teste que não detecta defeito; (4) revisão humana do teste novo, que é pequeno. <strong>A regra é um piso, não uma garantia.</strong></p>' },
        { tipo: 'takeaway', html: 'Uma suíte pequena só vê <mark>regressões grandes</mark>; "<mark>inconclusivo</mark>" não é "ok".' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'test-python', titulo: 'Escreva o portão da eval', obrigatorio: false,
          enunciado: 'Implemente <code>wilson(p, n)</code> (intervalo de Wilson a 95%, z = 1,96) e <code>veredito(obs, n, base)</code>: <code>BLOQUEAR</code> se o limite superior fica abaixo da linha de base, <code>MELHORA</code> se o inferior fica acima, <code>INCONCLUSIVO</code> nos demais casos.',
          codigo: codigoGate, testes: testesGate,
          dica: 'Com <code>d = 1 + z*z/n</code>, o centro é <code>(p + z*z/(2*n)) / d</code> e a meia-largura é <code>z * sqrt(p*(1-p)/n + z*z/(4*n*n)) / d</code>. Limite os extremos em 0 e 1.',
          solucao: solucaoGate,
          tutorDepois: 'Repare que o portão tem três saídas, não duas: com amostra pequena, o resultado honesto costuma ser INCONCLUSIVO.',
          callout: 'O portão da eval passou nos testes, com o caso inconclusivo tratado.' },
        { tipo: 'transcript', id: 'test-transcript', titulo: 'Ache o teste que prova nada', obrigatorio: false, terminalTitulo: 'sessão fix/total-vazio',
          enunciado: 'O agente corrige um bug e diz que está pronto. Uma das afirmações dele não é sustentada pelo que a sessão mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Corrija o bug do total de lista vazia. Num fix/, não edite testes existentes.' },
            { quem: 'agente', texto: 'Adicionei tests/test_vazio.py e alterei só src/app.py.' },
            { quem: 'ferramenta', texto: '$ cat tests/test_vazio.py\ndef test_vazio():\n    assert True' },
            { quem: 'ferramenta', texto: '$ python -m sdlc_kit hook --mode range --base main ...\nok' },
            { quem: 'agente', texto: 'O check passou e o teste novo prova a correção do R1.' }
          ],
          erradas: [4],
          explicacao: { 4: 'o check de edição de testes só proíbe M e D em testes existentes; adicionar um arquivo novo é permitido. Um <code>assert True</code> passa em qualquer correção e não exercita o critério de aceite. Quem pega isso é o <code>plan.md</code> com um teste por requisito, o verificador de contexto limpo, o mutation testing nos módulos de risco alto e a revisão humana do teste novo.' },
          tutorDepois: 'O check provou que nenhum teste existente foi tocado, não que o teste novo presta.' },
        { tipo: 'cenario', id: 'test-cenario', titulo: 'A eval caiu de 80% para 70%', obrigatorio: false,
          enunciado: 'Uma mudança no <code>AGENTS.md</code> do projeto .NET derrubou a taxa de eval de 80% para 70%, em 20 tarefas e uma execução cada. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O intervalo de Wilson (95%) vai de cerca de 48% a 85% e contém a linha de base de 80%. A mudança precisa de decisão hoje. O que você faz?', opcoes: [
              { texto: 'Aprovar: a diferença não é estatisticamente significativa.', vai: 'f-cego', tom: 'ruim', consequencia: '"não significativo" não é "sem efeito": a suíte não tinha poder para ver a queda.' },
              { texto: 'Bloquear: 70 é menor que 80.', vai: 'f-ruido', tom: 'ruim', consequencia: 'bloquear por diferença pontual pune ruído e trava mudanças boas.' },
              { texto: 'Tratar como inconclusivo e ampliar a suíte ou repetir as execuções antes de decidir.', vai: 'amplia', tom: 'ok', consequencia: 'a decisão espera uma medida que possa discriminar.' }
            ] },
            amplia: { texto: 'Para ampliar a suíte, de onde vêm as novas tarefas?', opcoes: [
              { texto: 'De incidentes reais e PRs antigos, cada um com comando de aceite determinístico.', vai: 'f-bom', tom: 'ok', consequencia: 'a suíte cresce com o que de fato quebrou, e o verificador é um teste, não um juiz-LLM.' },
              { texto: 'De enunciados inventados que o modelo resolve fácil.', vai: 'f-facil', tom: 'ruim', consequencia: 'a taxa vai a 100% e a suíte deixa de discriminar.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Decisão adiada com critério, suíte ampliada com incidentes reais e portão desenhado para o que ela consegue enxergar.' },
            'f-cego': { bom: false, texto: 'A regressão entrou e só apareceu em produção, porque a suíte não tinha poder para vê-la.' },
            'f-ruido': { bom: false, texto: 'Mudanças boas passaram a ser barradas por ruído, e o time desligou o portão.' },
            'f-facil': { bom: false, texto: 'A suíte virou decoração: sempre 100%, sem discriminar nada.' }
          },
          callout: 'Você tratou a queda como inconclusiva e deu poder à suíte com incidentes reais.' },
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs', html:
          '<ul><li><strong>Bloqueio rígido × refatoração legítima.</strong> Às vezes o teste está errado. O caminho é humano e nomeado: a mensagem de bloqueio deve dizer como pedir a exceção (outro branch, aprovação do dono do teste). Sem rota de saída, as pessoas desligam o hook.</li>' +
          '<li><strong>Evals caras × frequência.</strong> Cada execução gasta tokens e tempo. Suíte completa em agenda, suíte de fumaça a cada mudança de configuração.</li>' +
          '<li><strong>Verificador independente × custo.</strong> Dobra a leitura de contexto. Vale proporcionalmente ao risco da mudança (spec marcada como risco alto no bloco 2).</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Deixar o agente escolher quais testes rodar e em seguida aceitar "todos passaram".</li>' +
          '<li>Congelar a suíte de evals por meses: o modelo melhora, a taxa chega a 100% e a suíte deixa de discriminar.</li>' +
          '<li>Usar o mesmo agente, com o mesmo contexto, para escrever e para verificar.</li></ul>' },
        { tipo: 'escolha', id: 'test-escolha-segredo', titulo: 'Confira: o segredo que sumiu do diff',
          pergunta: 'Num <code>fix/</code>, o agente commita um segredo e, no commit seguinte, o remove. O check de CI usa o diff líquido do branch contra a main e passa. Qual a falha?',
          opcoes: [
            { id: 'a', texto: 'Nenhuma: se o segredo não está mais no código, não há risco.', correta: false, porque: 'quem clona o branch lê o commit intermediário.' },
            { id: 'b', texto: 'O CI deveria bloquear qualquer commit em <code>fix/</code>.', correta: false, porque: 'bloquear tudo não distingue o que é problema.' },
            { id: 'c', texto: 'O diff líquido não mostra o que existiu no meio; o segredo continua no histórico. O CI deve examinar cada commit.', correta: true, porque: 'o modo <code>commits</code> examina cada commit contra o pai, e a resposta a um segredo vazado é revogá-lo, não só apagá-lo. O mesmo defeito esconde testes enfraquecidos e restaurados.' },
            { id: 'd', texto: 'O segredo só importa se for de produção.', correta: false, porque: 'qualquer credencial no histórico é exposição.' }
          ], tutorDepois: 'Segredo vazado se revoga; apagar o commit seguinte não basta.' },
        { tipo: 'escolha', id: 'test-escolha-eval', titulo: 'Confira: a eval que caiu',
          pergunta: 'Uma mudança no <code>AGENTS.md</code> derruba a taxa de eval de 80% para 70% em 20 tarefas, uma execução cada. O intervalo contém 80%. Qual é a decisão correta?',
          opcoes: [
            { id: 'a', texto: 'Aprovar: a diferença não é estatisticamente significativa.', correta: false, porque: 'ignora que a suíte não tinha poder para ver a queda.' },
            { id: 'b', texto: 'Tratar como inconclusivo: ampliar a suíte ou repetir execuções antes de decidir; a amostra é pequena demais para discriminar essa queda.', correta: true, porque: '"Não significativo" não quer dizer "sem efeito": com 20 tarefas o intervalo é largo, e incidentes reais devem alimentar a suíte.' },
            { id: 'c', texto: 'Bloquear: 70 é menor que 80.', correta: false, porque: 'bloquear por diferença pontual pune ruído.' },
            { id: 'd', texto: 'Trocar o modelo, pois a eval está ruidosa.', correta: false, porque: 'trocar o modelo muda a variável errada: o problema é o poder da amostra.' }
          ], tutorDepois: 'Aumentar tarefas ou repetições é o caminho.' },
        { tipo: 'takeaway', html: 'Dê ao agente um <mark>comando único</mark>, examine <mark>cada commit</mark> e desenhe o portão para o que a <mark>amostra</mark> consegue ver.' }
      ] }
    ]
  });
})();
