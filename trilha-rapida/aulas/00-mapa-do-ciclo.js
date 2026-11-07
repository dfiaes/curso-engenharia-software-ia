/* Aula 0 · O mapa do ciclo. Aula de referência: usa rode, quebre, escolha e ordene. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };

  var etapas = function () {
    return [
      { id: 'intencao', nome: 'Intenção', descricao: 'O problema e o resultado esperado', tom: 'dns', ms: 3, linhas: [
        L('info', 'lendo AGENTS.md e docs/GLOSSARY.md'),
        L('out', 'grep -rn "frete" src/ tests/   (14 arquivos)'),
        L('cmd', 'git switch -c PROJ-482-frete-acima-500'),
        L('in', 'docs/intent/PROJ-482-frete-acima-500.md criado'),
        L('body', 'problema: pedidos acima de R$ 500 cobram o frete errado'),
        L('hint', 'decisão humana: o problema vale a pena? o resultado esperado está certo?')] },
      { id: 'spec', nome: 'Spec', descricao: 'Critérios de aceite e fora do escopo', tom: 'tcp', ms: 6, linhas: [
        L('info', 'redigindo critérios verificáveis'),
        L('in', 'docs/specs/PROJ-482-frete.md criado'),
        L('body', '- pedido de R$ 500,00 exatos: frete da faixa normal'),
        L('body', '- pedido de R$ 500,01 ou mais: aplica a tabela nova'),
        L('body', '- fora do escopo: frete internacional'),
        L('hint', 'decisão humana: você aprova os critérios e o que fica de fora?')] },
      { id: 'plano', nome: 'Plano', descricao: 'Arquivos, passos e rollback', tom: 'tls', ms: 5, linhas: [
        L('info', 'modo leitura: nenhum arquivo será alterado'),
        L('out', 'read src/frete/calculo.py'),
        L('out', 'read tests/test_frete.py'),
        L('in', 'docs/plans/PROJ-482-frete.md criado: 3 passos, 2 arquivos, rollback = reverter o commit'),
        L('hint', 'decisão humana: os arquivos e os passos fazem sentido?')] },
      { id: 'impl', nome: 'Implementação', descricao: 'Teste primeiro, código mínimo', tom: 'request', ms: 18, linhas: [
        L('cmd', 'make test'),
        L('out', '1 failed: test_frete_acima_de_500'),
        L('info', 'edit src/frete/calculo.py (+6 -2)'),
        L('cmd', 'make test'),
        L('in', '12 passed'),
        L('cmd', 'git commit -m "PROJ-482: corrige frete acima de R$ 500"')] },
      { id: 'verif', nome: 'Verificação', descricao: 'Evidência, não relato', tom: 'response', ms: 4, linhas: [
        L('cmd', 'make check'),
        L('out', 'ruff: ok   mypy: ok'),
        L('out', 'pytest: 12 passed'),
        L('out', 'docs: links ok'),
        L('in', 'evidência: saída completa guardada no CI')] },
      { id: 'pr', nome: 'PR e review', descricao: 'Quem não escreveu aprova', tom: 'ink', ms: 2, linhas: [
        L('cmd', 'gh pr create --title "PROJ-482: corrige frete acima de R$ 500" --body-file docs/specs/PROJ-482-frete.md'),
        L('in', 'pull request #231 aberto'),
        L('info', 'agente revisor separado lendo REVIEW.md'),
        L('hint', 'decisão humana: quem não escreveu o código aprova o PR')] }
    ];
  };

  var entrada = 'corrigir o cálculo de frete para pedidos acima de R$ 500';

  TrilhaAula.registrar({
    id: 'mapa-do-ciclo',
    titulo: 'O mapa do ciclo',
    minutos: 12,
    resumo: 'Uma sessão com agente é uma etapa de um ciclo. Cada etapa deixa um arquivo, e um humano decide em pontos precisos.',
    revisao: [
      {
        "id": "spec-artefato",
        "pergunta": "Qual artefato a etapa de spec deixa no repositório?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Um arquivo em <code>docs/specs/</code> com critérios de aceite e o que fica fora do escopo",
            "correta": true,
            "porque": "a spec é um arquivo versionado; é o que o agente lê na sessão seguinte."
          },
          {
            "id": "b",
            "texto": "Uma combinação feita na conversa com o agente",
            "correta": false,
            "porque": "a conversa some quando a sessão fecha; o que não está num arquivo deixa de existir."
          },
          {
            "id": "c",
            "texto": "O código com os testes já passando",
            "correta": false,
            "porque": "o código vem depois do plano; a spec existe para ser aprovada antes dele."
          }
        ]
      },
      {
        "id": "relato-evidencia",
        "pergunta": "Por que o relato \"pronto, tudo passando\" não conta como evidência?",
        "opcoes": [
          {
            "id": "a",
            "texto": "É a descrição que o agente faz do próprio trabalho; evidência é uma saída que você lê sem depender dele",
            "correta": true,
            "porque": "você precisa de um artefato, como a saída do <code>make check</code> ou a execução do CI."
          },
          {
            "id": "b",
            "texto": "Porque o agente costuma mentir de propósito",
            "correta": false,
            "porque": "o problema não é má-fé: ele pode ter rodado menos do que diz ou rodado outra coisa."
          },
          {
            "id": "c",
            "texto": "Porque o modelo não consegue rodar testes",
            "correta": false,
            "porque": "quem roda é o harness, a pedido do modelo; o ponto é conferir a saída."
          }
        ]
      },
      {
        "id": "pular-spec",
        "pergunta": "O que acontece quando a spec é pulada?",
        "opcoes": [
          {
            "id": "a",
            "texto": "O agente decide sozinho o que \"corrigir\" significa, e os testes passam sem cobrir a regra certa",
            "correta": true,
            "porque": "sem critério escrito, o critério vive só na cabeça do agente."
          },
          {
            "id": "b",
            "texto": "O CI barra o PR automaticamente",
            "correta": false,
            "porque": "o CI só barra o que alguém escreveu como teste; sem spec, ninguém escreveu o teste certo."
          },
          {
            "id": "c",
            "texto": "Só a revisão fica um pouco mais lenta",
            "correta": false,
            "porque": "o erro é de conteúdo: o PR resolve outro problema."
          }
        ]
      },
      {
        "id": "quem-aprova-pr",
        "pergunta": "Quem aprova o pull request?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Um humano que não escreveu o código",
            "correta": true,
            "porque": "quem não escreveu enxerga o que o autor não vê."
          },
          {
            "id": "b",
            "texto": "O mesmo agente que implementou, porque conhece o contexto",
            "correta": false,
            "porque": "o contexto herdado confirma o que o autor quis, não o que ficou de fora."
          },
          {
            "id": "c",
            "texto": "Ninguém: com o CI verde basta",
            "correta": false,
            "porque": "CI verde mostra que as regras escritas passaram, não que a decisão está certa."
          }
        ]
      }
    ],
    abas: [
      { rotulo: 'O ciclo', blocos: [
        { tipo: 'texto', html:
          '<p>Quem começa com agentes costuma tratar a sessão como uma conversa: pede, recebe código, cola e torce. Pense em uma obra. Você não diz ao pedreiro "faz uma casa" e vai embora: há <strong>planta</strong>, aprovação da planta, inspeção e só depois a chave.</p>' +
          '<p>Com agentes funciona igual. O agente executa rápido; <strong>você decide</strong> o que vale executar e se o resultado presta. Cada etapa produz um <strong>artefato</strong>, um arquivo versionado no repositório. Isso importa porque o agente não lembra da sessão anterior: o que não está num arquivo deixa de existir quando a sessão fecha.</p>' +
          '<p>Digite uma intenção e aperte Enter. Veja as seis primeiras etapas do ciclo acenderem e leia, no terminal, o que o agente faz em cada uma. As linhas apagadas por <code>decisão humana</code> são os pontos em que ele para e espera você.</p>' },
        { tipo: 'rode', id: 'ciclo-rode', titulo: 'Rode o ciclo', enunciado: 'Envie uma intenção ao agente. Clique numa etapa depois de rodar para ver só as linhas dela.',
          prefixo: 'Prompt', entrada: entrada, unidade: 'min', etapas: etapas(), terminalTitulo: 'agente',
          prever: { pergunta: 'Nas seis etapas que vão rodar, quantas vezes o agente vai parar e esperar uma decisão sua?', opcoes: [
            { id: 'nenhuma', texto: 'Nenhuma: ele roda do começo ao fim sozinho.', correta: false, porque: 'o ciclo existe para que você decida em pontos precisos.' },
            { id: 'quatro', texto: 'Quatro: intenção, spec, plano e review.', correta: true, porque: 'cada uma dessas etapas termina numa linha de decisão humana; implementação e verificação rodam sem parar.' },
            { id: 'seis', texto: 'Seis: uma parada por etapa.', correta: false, porque: 'implementação e verificação não pedem decisão: o teste e o make check respondem por elas.' }
          ] },
          tutorAntes: 'Aperte Enter na caixa de prompt. Depois clique em uma etapa para destacar o que ela fez.',
          tutorDepois: 'Seis etapas, um arquivo por etapa. Em quatro delas o agente parou e esperou uma decisão sua: intenção, spec, plano e review.',
          callout: 'Ciclo completo: da intenção ao pull request, com um artefato por etapa.' },
        { tipo: 'texto', largo: true, html:
          '<h3>As nove etapas do ciclo completo</h3>' +
          '<table><thead><tr><th>Etapa</th><th>Você decide</th><th>Artefato</th></tr></thead><tbody>' +
          '<tr><td>1. Intenção</td><td>O problema vale a pena? Qual o resultado esperado?</td><td><code>docs/intent/PROJ-123-slug.md</code></td></tr>' +
          '<tr><td>2. Spec</td><td>Critérios de aceite e o que fica fora</td><td><code>docs/specs/PROJ-123-slug.md</code></td></tr>' +
          '<tr><td>3. Plano</td><td>Arquivos afetados, passos e rollback</td><td><code>docs/plans/PROJ-123-slug.md</code></td></tr>' +
          '<tr><td>4. Implementação</td><td>Pontos de parada; desvia se o plano estiver errado</td><td>Branch e commits <code>PROJ-123: ...</code></td></tr>' +
          '<tr><td>5. Verificação</td><td>Exige evidência, não afirmação</td><td>Saída do <code>make check</code> ou do CI</td></tr>' +
          '<tr><td>6. PR e review</td><td>Quem não escreveu aprova</td><td>Pull request e parecer</td></tr>' +
          '<tr><td>7. CI/CD dev, cert, prod</td><td>Aprovações em cert e prod são humanas</td><td>Execuções da pipeline, release, tag</td></tr>' +
          '<tr><td>8. Operar</td><td>Rollback, hotfix, severidade</td><td><code>docs/runbooks/</code>, ADR, CHANGELOG</td></tr>' +
          '<tr><td>9. Nova intenção</td><td>Prioriza o que aprendeu</td><td>Novo ticket com link para o aprendizado</td></tr>' +
          '</tbody></table>' +
          '<p class="ta-nota">Encurtar o caminho é legítimo em trabalho pequeno, mas encurtar é escrever menos, não escrever em lugar nenhum: nem que seja uma spec de cinco linhas no corpo do PR.</p>' },
        { tipo: 'takeaway', html: 'Cada etapa deixa <mark>um arquivo</mark>, e uma <mark>decisão humana</mark> marca onde o agente para.' }
      ] },

      { rotulo: 'Quebrar', blocos: [
        { tipo: 'texto', html:
          '<p>A forma mais rápida de entender uma etapa é tirá-la e ver o que acontece. Escolha uma falha, rode, e depois rode sem falha para fechar o exercício.</p>' +
          '<p><strong>Pular a spec</strong> muda <em>o que</em> é construído. <strong>Pular a verificação</strong> esconde <em>o que</em> foi construído.</p>' },
        { tipo: 'quebre', id: 'ciclo-quebre', titulo: 'Quebre o ciclo', enunciado: 'Escolha o que pular, envie a mesma intenção e observe onde a falha aparece.',
          prefixo: 'Prompt', entrada: entrada, unidade: 'min', etapas: etapas(), terminalTitulo: 'agente',
          tutorAntes: 'Escolha "Pular a spec", aperte Enter e leia o terminal. Depois tente a outra falha e, por fim, rode sem falha.',
          tutorDepois: 'Com todas as etapas, cada decisão tem um arquivo para ser revisada antes de o código existir.',
          callout: 'Você viu as duas falhas e o ciclo completo funcionando.',
          falhas: [
            { id: 'pular-spec', rotulo: 'Pular a spec', efeito: { etapaFalha: 'spec', linhasErro: [
              'spec pulada: "pode ir direto para o código"',
              { kind: 'info', text: 'agente: sem critérios, vou assumir que "corrigir" significa frete grátis' },
              { kind: 'cmd', text: 'make test' },
              { kind: 'in', text: '11 passed (nenhum teste cobre a regra nova)' },
              { kind: 'in', text: 'pull request #231 aberto com a coisa errada' },
              'o comercial queria a tabela nova, não frete grátis'
            ], tutor: 'sem spec, o critério vive só na cabeça do agente. Ele entendeu "corrigir" como "frete grátis" e os testes passam porque ninguém escreveu o teste certo. O erro aparece em produção.' } },
            { id: 'pular-verif', rotulo: 'Pular a verificação', efeito: { etapaFalha: 'verif', linhasErro: [
              'verificação pulada: "os testes já passaram antes"',
              { kind: 'body', text: 'agente: implementei e está tudo pronto' },
              { kind: 'cmd', text: 'gh pr create --title "PROJ-482: corrige frete acima de R$ 500"' },
              { kind: 'in', text: 'pull request #231 aberto' },
              { kind: 'out', text: 'CI: pytest 1 failed, test_frete_exato_500' },
              'o relato dizia tudo pronto; a evidência dizia o contrário'
            ], tutor: 'o PR subiu com o teste vermelho. Relato do agente não é evidência: peça a saída do make check antes de abrir o PR.' } }
          ] },
        { tipo: 'takeaway', html: 'Pular a spec <mark>muda o que é construído</mark>; pular a verificação <mark>esconde o que foi construído</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'ciclo-escolha', titulo: 'Confira: evidência',
          pergunta: 'O agente termina e diz "pronto, tudo passando". O que você faz antes de aprovar?',
          opcoes: [
            { id: 'a', texto: 'Aprovo: ele mesmo rodou os testes.', correta: false, porque: 'o relato é a descrição que o agente faz do trabalho dele. Ele pode ter rodado menos do que diz, ou rodado outra coisa.' },
            { id: 'b', texto: 'Peço a saída do <code>make check</code> ou olho a execução do CI.', correta: true, porque: 'a evidência é um artefato que você lê sem depender da versão do agente. É para isso que a etapa de verificação existe.' },
            { id: 'c', texto: 'Peço que ele rode os testes de novo e me confirme.', correta: false, porque: 'rodar de novo e confirmar ainda é relato. O que muda a conversa é você ler a saída, não ouvir outra afirmação.' }
          ], tutorDepois: 'Evidência primeiro, relato depois.' },
        { tipo: 'ordene', id: 'ciclo-ordene', titulo: 'Ponha os artefatos na ordem',
          enunciado: 'Ordene os artefatos na sequência em que o ciclo os produz, do primeiro ao último.',
          itens: [
            { id: 'pr', texto: 'Pull request e parecer do revisor' },
            { id: 'spec', texto: '<code>docs/specs/PROJ-123.md</code>' },
            { id: 'verif', texto: 'Saída do <code>make check</code>' },
            { id: 'intent', texto: '<code>docs/intent/PROJ-123.md</code>' },
            { id: 'commits', texto: 'Branch e commits <code>PROJ-123: ...</code>' },
            { id: 'plan', texto: '<code>docs/plans/PROJ-123.md</code>' }
          ], solucao: ['intent', 'spec', 'plan', 'commits', 'verif', 'pr'],
          dica: 'Pense em quando o código passa a existir.',
          tutorDepois: 'Três arquivos antes do código: dá para revisar a decisão enquanto ela ainda é barata.' },
        { tipo: 'transcript', id: 'ciclo-transcript', titulo: 'Ache o erro na sessão', obrigatorio: false, terminalTitulo: 'sessão PROJ-482',
          enunciado: 'Leia a sessão abaixo. Em uma das linhas, o agente afirma algo que a própria sessão não sustenta. Clique nela e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Corrija o cálculo de frete para pedidos acima de R$ 500 (PROJ-482).' },
            { quem: 'agente', texto: 'Li docs/specs/PROJ-482-frete.md. Vou começar pelo teste que falha.' },
            { quem: 'ferramenta', texto: '$ make test\n1 failed: test_frete_acima_de_500' },
            { quem: 'agente', texto: 'Corrigi src/frete/calculo.py e rodei de novo.' },
            { quem: 'ferramenta', texto: '$ make test\n12 passed' },
            { quem: 'agente', texto: 'Rodei o make check: ruff, mypy e docs estão verdes. Abrindo o PR.' },
            { quem: 'ferramenta', texto: '$ gh pr create --title "PROJ-482: corrige frete acima de R$ 500"\npull request #231 aberto' }
          ],
          erradas: [5],
          explicacao: { 5: 'nenhuma ferramenta rodou <code>make check</code> nesta sessão: a única execução é o <code>make test</code> da linha 5. O agente relatou uma verificação que não aconteceu, e relato não é evidência.' },
          tutorDepois: 'Para cada afirmação do agente, procure a linha de ferramenta que a sustenta. Se não existe, é relato.' },
        { tipo: 'cenario', id: 'ciclo-cenario', titulo: 'Sexta, 18h: a cert quebrou', obrigatorio: false,
          enunciado: 'O PR #231 foi para cert e o smoke test falhou. Escolha o que fazer e veja o custo de cada decisão.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Sexta, 18h. O deploy do PR #231 em cert quebrou o smoke test: o cadastro devolve erro 500. A QA testa em cert na segunda cedo. O que você faz primeiro?', opcoes: [
              { texto: 'Corrigir rápido direto na main e subir de novo.', vai: 'f-palpite', tom: 'ruim', consequencia: 'sem teste que reproduza o erro, a correção é um palpite, e ela fura a esteira.' },
              { texto: 'Reimplantar em cert o SHA anterior estável.', vai: 'depois', tom: 'ok', consequencia: 'cert volta a funcionar em minutos, sem recompilar nada.' },
              { texto: 'Deixar quebrado e ver na segunda.', vai: 'f-parado', tom: 'ruim', consequencia: 'a QA perde a manhã de segunda sem ambiente.' }
            ] },
            depois: { texto: 'Cert está estável no SHA anterior e o smoke test passa. Agora, como tratar o erro do PR #231?', opcoes: [
              { texto: 'Abrir um bug com o log do smoke test e reproduzir com um teste que falha antes de corrigir.', vai: 'f-bom', tom: 'ok', consequencia: 'a causa vira fato, e a correção sai em um PR novo.' },
              { texto: 'Pedir ao agente: "corrija o que quebrou", sem reproduzir.', vai: 'f-palpite', tom: 'ruim', consequencia: 'o agente trata o sintoma que viu primeiro.' },
              { texto: 'Descartar o PR inteiro e recomeçar.', vai: 'f-descarte', tom: 'ruim', consequencia: 'perde-se trabalho que provavelmente estava quase certo.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Cert estável, bug reproduzido por teste e correção em novo PR, pelo mesmo caminho da esteira.' },
            'f-palpite': { bom: false, texto: 'A correção por palpite quebrou outra tela e cert caiu de novo.' },
            'f-parado': { bom: false, texto: 'Cert ficou fora até segunda e a QA começou a semana atrasada.' },
            'f-descarte': { bom: false, texto: 'O trabalho foi jogado fora e o mesmo erro reapareceu no refazer.' }
          },
          callout: 'Você restaurou cert primeiro e só depois diagnosticou, com um teste que falha.' },
        { tipo: 'texto', html: '<p>Fundamentos e variações do ciclo: <a href="../modulos/A01-sdlc-nativo-ia/A01.html">A01 · SDLC nativo em IA</a> e <a href="../modulos/M01-workflow-ia-driven/M01.html">M01 · Workflow IA-driven</a>.</p>' },
        { tipo: 'takeaway', html: 'Se o relato do agente e a <mark>evidência</mark> discordam, vale a <mark>evidência</mark>.' }
      ] }
    ]
  });
})();
