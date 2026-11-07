/* Aula 7 · Paralelismo e revisão. Fonte: TR-texto.html, Passo 6 (verificado em 12/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };

  var cmdsWorktree =
'git worktree add ../meu-app-PROJ-123 -b feat/PROJ-123-slug origin/main\n' +
'git worktree add ../meu-app-PROJ-456 -b fix/PROJ-456-slug origin/main\n' +
'git worktree list\n' +
'# terminado e mesclado:\n' +
'git worktree remove ../meu-app-PROJ-123';

  TrilhaAula.registrar({
    id: 'paralelismo-revisao',
    titulo: 'Paralelismo e revisão',
    minutos: 20,
    resumo: 'O ganho real aparece quando você supervisiona mais de uma sessão. O gargalo deixa de ser digitar e passa a ser revisar bem.',
    revisao: [
      {
        "id": "gargalo",
        "pergunta": "Qual o gargalo de quem supervisiona várias sessões de agente?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Revisar bem: o limite é a sua capacidade de revisar",
            "correta": true,
            "porque": "digitar deixou de ser o problema."
          },
          {
            "id": "b",
            "texto": "Escrever os prompts",
            "correta": false,
            "porque": "o gargalo deslocou-se para a leitura do que volta."
          },
          {
            "id": "c",
            "texto": "A velocidade do modelo",
            "correta": false,
            "porque": "mais sessões sem revisão só acumulam PRs parados."
          }
        ]
      },
      {
        "id": "isolar-sessoes",
        "pergunta": "Como isolar duas sessões que trabalham no mesmo repositório?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Com um worktree por sessão",
            "correta": true,
            "porque": "cada sessão tem a própria pasta e branch, sem pisar nos arquivos da outra."
          },
          {
            "id": "b",
            "texto": "As duas na mesma pasta, em branches diferentes, trocando entre elas",
            "correta": false,
            "porque": "trocar de branch com trabalho aberto mistura mudanças."
          },
          {
            "id": "c",
            "texto": "Um clone completo por sessão, sem relação entre eles",
            "correta": false,
            "porque": "funciona, mas worktrees compartilham o histórico e são mais leves."
          }
        ]
      },
      {
        "id": "revisor-novo",
        "pergunta": "Por que o revisor deve ser uma sessão nova, sem o histórico da implementação?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Sem o contexto herdado ele acha o que o texto não diz, em vez de confirmar o que o autor quis",
            "correta": true,
            "porque": "quem leu a conversa já \"sabe\" o que ficou de fora."
          },
          {
            "id": "b",
            "texto": "Porque sessões novas custam menos",
            "correta": false,
            "porque": "o motivo é independência, não custo."
          },
          {
            "id": "c",
            "texto": "Porque o histórico atrapalha o modelo a escrever",
            "correta": false,
            "porque": "o ponto é a revisão, não a escrita."
          }
        ]
      },
      {
        "id": "quem-aprova-pr-2",
        "pergunta": "Quem pode aprovar um PR?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Um humano que não o escreveu e que leu o diff",
            "correta": true,
            "porque": "se você não leu o diff, não revisou."
          },
          {
            "id": "b",
            "texto": "O agente revisor, se o parecer for positivo",
            "correta": false,
            "porque": "o parecer amplia a sua leitura, não a substitui."
          },
          {
            "id": "c",
            "texto": "O autor, depois de rodar o agente revisor",
            "correta": false,
            "porque": "quem escreveu não aprova."
          }
        ]
      }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O ganho de produtividade real com agentes aparece quando você deixa de esperar a sessão terminar e passa a supervisionar mais de uma. O gargalo muda de "digitar código" para <strong>revisar com qualidade</strong>. Esta aula ensina a paralelizar sem criar bagunça e a revisar sem se enganar.</p>' +
          '<h3>Worktrees: uma pasta por trabalho, um só repositório</h3>' +
          '<p>Pense numa oficina com bancadas separadas e um só almoxarifado. Um <strong>worktree</strong> é uma segunda (terceira...) cópia de trabalho do mesmo repositório, com seu próprio branch e arquivos, compartilhando o histórico. Duas sessões de agente no mesmo diretório se atropelam: uma troca de branch e a outra perde o contexto. Em worktrees separados, não.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: cmdsWorktree },
        { tipo: 'texto', html:
          '<p>Cuidados:</p><ul>' +
          '<li>Dependências e <code>bin/obj</code> ou <code>node_modules</code> são por pasta, então o primeiro build é lento.</li>' +
          '<li>Portas e bancos locais precisam ser distintos por worktree (variável de ambiente por pasta).</li>' +
          '<li>Nunca faça checkout do mesmo branch em dois worktrees: o Git recusa.</li></ul>' +
          '<h3>Quantas sessões?</h3><ul>' +
          '<li><strong>Comece com 2.</strong> Uma implementando, outra revisando ou escrevendo a spec do próximo ticket.</li>' +
          '<li><strong>O limite é a sua capacidade de revisar,</strong> não a do agente. Se três PRs esperam por você mais de meio dia, você tem sessões demais.</li>' +
          '<li><strong>Só paralelize trabalhos independentes</strong> (arquivos e módulos distintos). Fatias que mexem nos mesmos arquivos geram conflitos que consomem o que você ganhou.</li>' +
          '<li>Escolha trabalhos de <em>risco diferente</em> em paralelo: um bug difícil (exige sua atenção) e uma feature mecânica (corre sozinha).</li></ul>' },
        { tipo: 'escolha', id: 'par-fila', titulo: 'Confira: sessões demais',
          pergunta: 'Você tem quatro sessões de agente abertas e dois PRs parados esperando revisão há um dia. O que fazer?',
          opcoes: [
            { id: 'a', texto: 'Abrir mais duas sessões para aproveitar o tempo.', correta: false, porque: 'cada sessão nova cria mais código não revisado, e a fila só cresce.' },
            { id: 'b', texto: 'Aprovar os PRs pelo resumo do agente para desafogar.', correta: false, porque: 'o resumo não é o diff. Aprovar sem ler é não revisar.' },
            { id: 'c', texto: 'Parar de iniciar trabalhos e esvaziar a fila de revisão.', correta: true, porque: 'paralelismo sem revisão acumula risco não verificado. O limite é a sua capacidade de revisar.' }
          ] },
        { tipo: 'takeaway', html: '<mark>Worktrees</mark> para isolar, <mark>2 sessões</mark> para começar, e o limite é a sua <mark>capacidade de revisar</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Três tickets independentes, três worktrees, três sessões. O mais difícil, um bug, ganha a sua atenção; os dois mecânicos correm sozinhos. Observe a ordem dos merges e onde o conflito seria possível.</p>' },
        { tipo: 'rode', id: 'par-rode', titulo: 'Rode e observe: três worktrees em paralelo',
          enunciado: 'Crie os worktrees, deixe as sessões trabalharem e veja os merges entrarem na main um a um.',
          prefixo: '$', entrada: 'git worktree add ../meu-app-PROJ-123 -b feat/PROJ-123-slug origin/main', terminalTitulo: 'terminal', unidade: 'min',
          etapas: [
            { id: 'wt', nome: 'Três worktrees', descricao: 'Uma pasta e um branch por ticket', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'git worktree add ../meu-app-PROJ-123 -b feat/PROJ-123-slug origin/main'),
              L('cmd', 'git worktree add ../meu-app-PROJ-456 -b fix/PROJ-456-slug origin/main'),
              L('cmd', 'git worktree add ../meu-app-PROJ-789 -b feat/PROJ-789-slug origin/main'),
              L('cmd', 'git worktree list'),
              L('out', '/work/meu-app            1b7e0aa [main]'),
              L('out', '/work/meu-app-PROJ-123   1b7e0aa [feat/PROJ-123-slug]'),
              L('out', '/work/meu-app-PROJ-456   1b7e0aa [fix/PROJ-456-slug]'),
              L('out', '/work/meu-app-PROJ-789   1b7e0aa [feat/PROJ-789-slug]')] },
            { id: 'amb', nome: 'Isolamento por pasta', descricao: 'Portas e bancos distintos', tom: 'tcp', ms: 3, linhas: [
              L('info', 'PROJ-123: API na porta 5123, banco meuapp_123'),
              L('info', 'PROJ-456: API na porta 5456, banco meuapp_456'),
              L('info', 'PROJ-789: API na porta 5789, banco meuapp_789'),
              L('hint', 'primeiro build de cada pasta é lento: dependências e bin/obj são por worktree')] },
            { id: 'ses', nome: 'Três sessões em paralelo', descricao: 'Risco diferente em cada uma', tom: 'tls', ms: 25, linhas: [
              L('in', 'sessão A (PROJ-456, bug difícil): você acompanha o teste que reproduz a falha'),
              L('in', 'sessão B (PROJ-123, feature): spec aprovada, correndo sozinha'),
              L('in', 'sessão C (PROJ-789, mecânica): renomeia campo em DTOs, correndo sozinha'),
              L('out', 'arquivos tocados: A em src/Cambio, B em src/Cadastro, C em src/Relatorios'),
              L('hint', 'módulos distintos: sem conflito esperado')] },
            { id: 'rev', nome: 'Revisão em fila', descricao: 'Você revisa um PR por vez', tom: 'request', ms: 40, linhas: [
              L('info', 'PR #301 (PROJ-456): revisor em sessão nova, depois você lê o diff'),
              L('info', 'PR #302 (PROJ-123): idem'),
              L('info', 'PR #303 (PROJ-789): idem'),
              L('hint', 'decisão humana: três PRs esperando mais de meio dia é sinal de sessões demais')] },
            { id: 'merge', nome: 'Merge e limpeza', descricao: 'Um a um, rebase antes', tom: 'response', ms: 6, linhas: [
              L('cmd', 'gh pr merge 301 --squash'),
              L('cmd', 'git -C ../meu-app-PROJ-123 rebase origin/main'),
              L('cmd', 'gh pr merge 302 --squash'),
              L('cmd', 'git -C ../meu-app-PROJ-789 rebase origin/main'),
              L('cmd', 'gh pr merge 303 --squash'),
              L('cmd', 'git worktree remove ../meu-app-PROJ-123'),
              L('body', '3 PRs na main, 0 conflitos. Worktrees removidos depois do merge.')] }
          ],
          tutorAntes: 'Aperte Enter. Repare que o tempo gasto está em revisar, não em criar os worktrees.',
          tutorDepois: 'Criar as pastas leva um minuto. O que consumiu tempo foi a revisão, por isso o limite de sessões é a sua capacidade de revisar.',
          callout: 'Você viu o paralelismo funcionar: arquivos distintos, rebase antes de cada merge e revisão em fila.' },
        { tipo: 'texto', html:
          '<h3>Revisão por agente separado</h3>' +
          '<p>Quem escreveu o código revisa mal o próprio código, porque compartilha as mesmas premissas do contexto. É o autor relendo o próprio texto: o erro de digitação continua invisível. Abra uma <strong>sessão nova, sem o histórico da implementação</strong>, entregue só o ticket, a spec, o diff e o <code>REVIEW.md</code>, e peça o parecer (<code>prompts/revisar-pr.md</code>). Melhor ainda: use outro modelo ou outra ferramenta, para não repetir os mesmos pontos cegos.</p>' +
          '<p>Exija achados classificados (<code>[bloqueante]</code>, <code>[importante]</code>, <code>[sugestão]</code>) com <code>arquivo:linha</code>, a verificação critério por critério da spec e um veredito final: APROVAR, PEDIR MUDANÇAS ou BLOQUEAR. O <code>REVIEW.md</code> define a ordem de leitura: ticket e spec, testes, código, segurança, operação, documentação e escopo.</p>' },
        { tipo: 'chat', id: 'par-chat', titulo: 'Revise um PR com o agente revisor',
          enunciado: 'Você conduz uma sessão de revisão do PR #302 (cadastro de investidor, PROJ-123). Em cada rodada, escolha como pedir ou reagir. Só avança com a melhor resposta.',
          rodadas: [
            { agente: 'Sessão nova aberta. Recebi o PR #302. O que você quer que eu use como entrada?', opcoes: [
              { texto: 'Só o ticket, a spec, o diff e o REVIEW.md. Sem o histórico da implementação.', boa: true, resposta: 'Entendido. Vou ler na ordem do REVIEW.md: spec e critérios, testes, código, segurança, operação, documentação e escopo.', porque: 'contexto independente é o que dá independência à revisão.' },
              { texto: 'A conversa inteira da sessão que implementou, para você entender as intenções.', boa: false, resposta: 'Com esse histórico eu herdo as mesmas premissas do autor e tendo a concordar com elas.', porque: 'o contexto da implementação carrega os pontos cegos do autor.' },
              { texto: 'Só o resumo que o agente autor escreveu do PR.', boa: false, resposta: 'Um resumo não me deixa verificar nada: posso apenas repetir o que ele afirma.', porque: 'resumo não é evidência. Revisão lê o diff e os testes.' }
            ] },
            { agente: 'Terminei. Achados: [bloqueante] CadastroController.cs:42, o CNPJ não é validado antes de gravar. [importante] CadastroTests.cs: só há teste do caminho feliz. [sugestão] renomear variável em CadastroService.cs:18. Veredito: PEDIR MUDANÇAS. O que você faz?', opcoes: [
              { texto: 'Leio o diff e os testes eu mesmo, confiro os achados no código e só então decido.', boa: true, resposta: 'Boa. Confirmado: a linha 42 grava antes de validar. Também achei que o critério 3 da spec não tem teste.', porque: 'o agente revisor amplia a sua cobertura, não substitui a sua leitura.' },
              { texto: 'Concordo com o veredito e peço ao autor para aplicar tudo.', boa: false, resposta: 'Posso estar errado em algum achado. Eu também alucino e também deixo passar coisas.', porque: 'sem ler o diff, você aprovou o parecer, não o código.' },
              { texto: 'Ignoro a sugestão e o importante, só o bloqueante importa.', boa: false, resposta: 'Posso ter razão no importante: só o caminho feliz está testado, e o bug do CNPJ ficaria sem rede.', porque: 'classificar não é descartar. O importante pode ser a causa de o bloqueante nascer.' }
            ] },
            { agente: 'O autor corrigiu e pediu aprovação do PR. Quem aprova?', opcoes: [
              { texto: 'Uma pessoa que não escreveu nem pediu o código, como um Code Owner.', boa: true, resposta: 'Registrado. Eu, como agente, não aprovo; o agente autor também não.', porque: 'quem escreveu não aprova, e nenhum agente aprova.' },
              { texto: 'Você mesmo, que conduziu a revisão, e o agente revisor confirma.', boa: false, resposta: 'Se você pediu o código, a separação de funções some. Eu sou auxiliar, não aprovador.', porque: 'em projeto com mais de uma pessoa, o aprovador é outra.' },
              { texto: 'O agente revisor, porque ele leu tudo.', boa: false, resposta: 'Não devo aprovar. Posso opinar, mas a aprovação é de uma pessoa responsável.', porque: 'nenhum agente aprova PR.' }
            ] }
          ],
          tutorDepois: 'Contexto independente, leitura do diff pelo humano e aprovação por quem não escreveu.',
          callout: 'Você conduziu a revisão certa: contexto novo, diff lido por você e aprovador independente.' },
        { tipo: 'takeaway', html: 'Revisor em <mark>sessão separada</mark> com <mark>REVIEW.md</mark>; o parecer do agente amplia a sua leitura, não a substitui.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Separação de funções</h3>' +
          '<table><thead><tr><th>Função</th><th>Quem pode</th><th>Quem não pode</th></tr></thead><tbody>' +
          '<tr><td>Escrever o código</td><td>Agente A, com um humano responsável</td><td>-</td></tr>' +
          '<tr><td>Revisar o diff</td><td>Agente B (sessão separada) como auxiliar</td><td>Agente A; o autor</td></tr>' +
          '<tr><td>Aprovar o PR</td><td>Pessoa que não escreveu nem pediu o código (Code Owner)</td><td>Qualquer agente; o autor</td></tr>' +
          '<tr><td>Aprovar deploy em cert/prod</td><td>Humano autorizado no environment</td><td>Agente; o autor do PR em prod</td></tr>' +
          '<tr><td>Alterar pipeline, permissões, <code>CODEOWNERS</code></td><td>Plataforma/arquitetura, em PR próprio</td><td>Agente no PR de funcionalidade</td></tr>' +
          '</tbody></table>' +
          '<p>Se você é o único humano (projeto solo), a separação ainda vale na medida do possível: revisor-agente separado, você lendo o diff inteiro depois de um intervalo e aprovações de prod com atraso intencional.</p>', largo: true },
        { tipo: 'escolha', id: 'par-sessao-nova', titulo: 'Confira: por que sessão nova',
          pergunta: 'Por que o revisor deve ser uma sessão nova e sem o histórico da implementação?',
          opcoes: [
            { id: 'a', texto: 'Porque o contexto da implementação carrega as mesmas premissas e pontos cegos do autor.', correta: true, porque: 'revisão independente só funciona com contexto independente.' },
            { id: 'b', texto: 'Porque sessões novas são mais baratas.', correta: false, porque: 'o custo não é o motivo. Uma sessão com menos histórico até custa menos, mas isso é efeito colateral.' },
            { id: 'c', texto: 'Porque o agente não consegue ler o diff na mesma sessão.', correta: false, porque: 'ele lê. O problema é ele concordar com as próprias premissas.' }
          ] },
        { tipo: 'escolha', id: 'par-quem-aprova', titulo: 'Confira: quem pode alterar o deploy.yml',
          pergunta: 'O agente que implementa PROJ-123 sugere ajustar o <code>deploy.yml</code> no mesmo PR "para o passo funcionar". O que você faz?',
          opcoes: [
            { id: 'a', texto: 'Aceito: está no mesmo PR e o revisor vai ver.', correta: false, porque: 'quem controla a pipeline controla o gate, e o revisor de funcionalidade não é o dono da pipeline.' },
            { id: 'b', texto: 'Recuso. A mudança de pipeline vai em PR próprio, revisado por quem mantém a plataforma.', correta: true, porque: 'é a separação de funções: o <code>deploy.yml</code> está nos caminhos protegidos e no <code>CODEOWNERS</code>.' },
            { id: 'c', texto: 'Aceito se o agente revisor aprovar a mudança.', correta: false, porque: 'agente revisor é auxiliar, não aprova nem substitui o dono da pipeline.' }
          ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          '"Revisão" em que o humano só lê o resumo do agente revisor. O agente revisor também alucina e também deixa passar. A função dele é ampliar a sua cobertura, não substituir a sua leitura do diff e dos testes. Se você não leu, você não revisou.' },
        { tipo: 'takeaway', html: '<mark>Quem escreveu não aprova</mark>, nenhum agente aprova, e <mark>se você não leu o diff, não revisou</mark>.' }
      ] }
    ]
  });
})();
