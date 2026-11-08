/* A01 · Bloco 1: o gargalo mudou de lugar. Fonte: A01.html#b01. Capacidades do simulador (itens/semana): Plan 12, Design 10, Build 8, Test 9, Deploy 6, Maintain 10. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasVazao = function () {
    return [
      { id: 'caps', nome: 'Capacidades', descricao: 'Itens por semana de cada etapa', tom: 'dns', ms: 6, linhas: [
        L('info', 'capacidades: Plan 12, Design 10, Build 8 (base), Test 9, Deploy 6, Maintain 10'),
        L('cmd', 'python vazao.py --ganho-build 2'),
        L('out', 'Build com agente: 8 x 2 = 16 itens/semana'),
        L('hint', 'repare: o Build ficou duas vezes mais rápido; as outras etapas não mudaram')] },
      { id: 'design', nome: 'Design', descricao: 'Chegam 12, processa 10', tom: 'tcp', ms: 10, linhas: [
        L('out', 'Design: chegam 12.0/sem, processa 10.0/sem -> fila cresce 2.0/sem (16 itens em 8 semanas)')] },
      { id: 'build', nome: 'Build', descricao: 'Chegam 10, processa 16', tom: 'tls', ms: 16, linhas: [
        L('out', 'Build: chegam 10.0/sem, processa 16.0/sem -> sem fila'),
        L('hint', 'a etapa acelerada ficou ociosa: não era ela que limitava')] },
      { id: 'test', nome: 'Test', descricao: 'Chegam 10, processa 9', tom: 'request', ms: 9, linhas: [
        L('out', 'Test: chegam 10.0/sem, processa 9.0/sem -> fila cresce 1.0/sem (8 itens em 8 semanas)')] },
      { id: 'deploy', nome: 'Deploy', descricao: 'Chegam 9, processa 6', tom: 'response', ms: 6, linhas: [
        L('out', 'Deploy: chegam 9.0/sem, processa 6.0/sem -> fila cresce 3.0/sem (24 itens em 8 semanas)')] },
      { id: 'sistema', nome: 'Vazão do sistema', descricao: 'O mínimo das capacidades', tom: 'ink', ms: 6, linhas: [
        L('in', 'Vazão do sistema: 6.0 itens/semana (restrição: Deploy)'),
        L('hint', 'com ganho 1x a vazão também era 6: o Deploy já era a restrição, e o agente a expôs')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'a01-b1',
    titulo: 'O gargalo mudou de lugar: o loop e os papéis',
    minutos: 25,
    resumo: 'Escrever código deixou de ser o gargalo. O ciclo se reconstrói como um loop em que cada etapa termina num artefato versionado e cada gate tem um dono humano.',
    objetivo: 'Explicar por que acelerar o Build não acelera a entrega, descrever o loop de seis etapas com o artefato de cada uma e nomear o papel humano de cada gate.',
    revisao: [
      { id: 'a01b1-restricao', pergunta: 'Num pipeline de etapas em série, o que define a vazão sustentável?',
        opcoes: [
          opc('a', 'O mínimo das capacidades das etapas; o excedente vira trabalho em andamento', true, 'é a Teoria das Restrições: acima da capacidade da etapa mais lenta, a taxa de chegada só aumenta a fila e o tempo de espera.'),
          opc('b', 'A capacidade da etapa mais rápida', false, 'a etapa mais rápida fica ociosa esperando a lenta.'),
          opc('c', 'A média das capacidades', false, 'a média não existe como limite: a etapa mais lenta trava o fluxo inteiro.')] },
      { id: 'a01b1-estado', pergunta: 'O que significa "o estado mora no artefato, não na conversa"?',
        opcoes: [
          opc('a', 'Quem retoma o trabalho, humano ou agente, começa pelo arquivo versionado; a sessão é efêmera', true, 'a sessão fecha e tem janela de contexto finita; só o que foi commitado existe para a etapa seguinte.'),
          opc('b', 'O chat do agente é arquivado como prova de auditoria', false, 'a trilha de auditoria é o histórico de commits, não a conversa.'),
          opc('c', 'O agente guarda a decisão na memória até o fim do projeto', false, 'a memória da sessão some quando ela termina.')] },
      { id: 'a01b1-aceitacao', pergunta: 'No loop, como se registra que um intent foi aceito?',
        opcoes: [
          opc('a', 'Com um merge (aceito) ou um PR fechado (rejeitado)', true, 'a aceitação é um evento versionado, e isso permite automação disparada por evento.'),
          opc('b', 'Com uma frase na reunião semanal', false, 'uma frase em reunião não dispara automação nem fica na trilha de auditoria.'),
          opc('c', 'Com uma mensagem do agente dizendo que está claro', false, 'quem aceita é o product owner, não o agente.')] },
      { id: 'a01b1-metrica', pergunta: 'Qual par de medidas evita o erro de otimizar a etapa errada com métrica local?',
        opcoes: [
          opc('a', 'Tempo de ciclo ponta a ponta junto com taxa de retrabalho e taxa de falha de mudança', true, 'mede vazão do sistema e qualidade juntas; PRs por engenheiro sozinho é a lei de Goodhart na versão atual.'),
          opc('b', 'PRs abertos por semana e linhas geradas', false, 'são métricas locais do Build: sobem mesmo quando a entrega não melhora.'),
          opc('c', 'Número de sessões de agente por dia', false, 'mede uso, não fluxo nem qualidade.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Uma equipe triplica os PRs e não entrega mais rápido</h3>' +
          '<p>A equipe adota um agente de código. Em dois meses o número de PRs abertos por semana triplica. O comitê de mudança continua semanal, a revisão continua feita por três pessoas e o QA continua manual. O resultado não é entrega três vezes mais rápida: é uma fila de PRs esperando revisão e um backlog de testes pendentes. O ganho foi real e foi absorvido por uma etapa que não mudou.</p>' +
          '<p>Essa é a tese central do playbook: <strong>escrever código deixou de ser o gargalo</strong>. Planejar, revisar, testar e implantar ainda andam em velocidade humana, e os controles que existem foram desenhados para código escrito por pessoas, em ritmo de pessoas. Comitê semanal ou mensal vira latência pura. A conclusão não é "tire os humanos": é reconstruir o ciclo para que o julgamento humano se concentre onde ele é insubstituível.</p>' },
        { tipo: 'texto', html:
          '<h3>O mecanismo: vazão é a da etapa mais lenta</h3>' +
          '<p>Isto é <strong>Teoria das Restrições</strong> (Goldratt, <em>A Meta</em>) e <strong>Lei de Little</strong>: <code>L = λ · W</code>, o trabalho em andamento é a taxa de chegada vezes o tempo de espera. Num pipeline de etapas em série, a vazão sustentável é o <em>mínimo</em> das capacidades. Qualquer taxa de chegada acima disso só aumenta o trabalho em andamento e, portanto, o tempo de espera.</p>' +
          '<p>Acelerar uma etapa que não é a restrição melhora uma métrica local (PRs abertos) e piora a global: lead time e qualidade, porque revisores sobrecarregados aprovam rápido demais.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: otimizar a etapa errada com métrica local', html:
          '<p>Quem vem de engenharia de plataforma conhece a lição: melhoria local fora da restrição é desperdício e ainda desloca o problema. A versão nova é sutil porque o ganho de Build aparece no painel (PRs por engenheiro sobem) e a degradação aparece depois, em revisão rasa, defeitos escapando e fadiga dos revisores.</p>' +
          '<p>Meça a vazão do sistema e a qualidade juntas: <strong>tempo de ciclo ponta a ponta, taxa de retrabalho e taxa de falha de mudança</strong>. Subir PRs por engenheiro sem olhar o retrabalho é a forma atual da lei de Goodhart.</p>' },
        { tipo: 'takeaway', html: 'A vazão é a da <mark>etapa mais lenta</mark>: o ganho do Build só vira entrega se as etapas ao redor forem <mark>redesenhadas</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Capacidades fictícias, em itens por semana: Plan 12, Design 10, Build 8, Test 9, Deploy 6, Maintain 10. O agente dobra o Build. Antes de rodar, preveja a vazão do sistema.</p>' },
        { tipo: 'rode', id: 'gar-rode', titulo: 'Dobre o Build e veja a fila', enunciado: 'Rode o simulador com ganho 2x no Build. A barra de cada etapa mostra a capacidade dela em itens por semana.',
          prefixo: '$', entrada: 'python vazao.py --ganho-build 2', unidade: 'itens/sem', terminalTitulo: 'simulador', etapas: etapasVazao(),
          prever: { pergunta: 'Com o Build em 16 itens por semana, qual será a vazão do sistema?', opcoes: [
            { id: 'a', texto: '16 itens por semana: a vazão acompanha a etapa que melhorou.', correta: false, porque: 'em série, a vazão é o mínimo das capacidades, não a da etapa que melhorou.' },
            { id: 'b', texto: '8 itens por semana: a capacidade original do Build.', correta: false, porque: 'o 8 era só a capacidade original do Build; o limite do sistema está em outra etapa.' },
            { id: 'c', texto: '6 itens por semana: o Deploy continua limitando, e o ganho vira fila.', correta: true, porque: 'o Deploy processa 6 por semana e nada acima disso sai do sistema.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Depois clique em Deploy para ler só as linhas dele.',
          tutorDepois: 'Dobrar o Build não mudou a vazão (6 por semana) e só fabricou fila: 16 itens em Design, 8 em Test e 24 em Deploy em oito semanas. Com ganho 1x o Build (8) já era mais rápido que o Deploy (6): o sistema já tinha uma restrição, e o agente a expôs.',
          callout: 'Você viu a vazão ficar em 6 itens por semana, com a restrição no Deploy.' },
        { tipo: 'takeaway', html: 'O agente não criou o gargalo: <mark>expôs</mark> o que já limitava a entrega.' }
      ] },

      { rotulo: 'O loop e os papéis', blocos: [
        { tipo: 'texto', html:
          '<h3>O modelo em loop</h3>' +
          '<p>No SDLC linear, as etapas conversam por documentos, tickets e assinaturas. No modelo do playbook elas formam um <strong>loop</strong> com uma regra: cada etapa termina fazendo commit de um <strong>artefato versionado</strong>, e a etapa seguinte lê esse artefato. Aceitar o artefato (um merge) dispara a etapa seguinte, que pode ser automática. O histórico de commits vira a trilha de auditoria: quem pediu o quê, o que o agente produziu e quem aprovou.</p>' },
        { tipo: 'abas', rotulo: 'As seis etapas', itens: [
          { rotulo: 'Plan', blocos: [{ tipo: 'texto', html: '<p><strong>Termina com:</strong> <code>intent.md</code>.</p><ul><li><strong>Lê:</strong> conversa do originador e o modelo de intent da organização.</li><li><strong>Produz:</strong> <code>intent.md</code> (problema, resultado, usuários e sistemas, restrições, dúvidas).</li><li><strong>Humano:</strong> o product owner aceita (merge) ou rejeita (PR fechado).</li></ul>' }] },
          { rotulo: 'Design', blocos: [{ tipo: 'texto', html: '<p><strong>Termina com:</strong> <code>spec.md</code>.</p><ul><li><strong>Lê:</strong> <code>intent.md</code> aceito e as políticas (marca, segurança, conformidade, UX).</li><li><strong>Produz:</strong> <code>spec.md</code> com requisitos, critérios de aceite e preocupações sinalizadas.</li><li><strong>Humano:</strong> o product owner revisa; o dono da política resolve; o tech lead entra se o risco é alto.</li></ul>' }] },
          { rotulo: 'Build', blocos: [{ tipo: 'texto', html: '<p><strong>Termina com:</strong> <code>plan.md</code> e o diff.</p><ul><li><strong>Lê:</strong> <code>intent.md</code>, <code>spec.md</code> e o arquivo de instruções do projeto.</li><li><strong>Produz:</strong> <code>plan.md</code> aprovado antes de editar; depois diff e testes.</li><li><strong>Humano:</strong> o engenheiro aprova o plano e revisa artefatos, não cada tecla.</li></ul>' }] },
          { rotulo: 'Test', blocos: [{ tipo: 'texto', html: '<p><strong>Termina com:</strong> verificação.</p><ul><li><strong>Lê:</strong> <code>spec.md</code>, <code>plan.md</code> e o diff.</li><li><strong>Produz:</strong> evidência de checks (testes, lint, build) e resultado das evals.</li><li><strong>Humano:</strong> lê a evidência; não refaz à mão o que um comando já provou.</li></ul>' }] },
          { rotulo: 'Deploy', blocos: [{ tipo: 'texto', html: '<p><strong>Termina com:</strong> PR com findings.</p><ul><li><strong>Lê:</strong> <code>spec.md</code>, <code>plan.md</code>, o diff e o <code>REVIEW.md</code>.</li><li><strong>Produz:</strong> PR com findings por severidade; release preparado.</li><li><strong>Humano:</strong> o code owner aprova; o release manager autoriza produção.</li></ul>' }] },
          { rotulo: 'Maintain', blocos: [{ tipo: 'texto', html: '<p><strong>Termina com:</strong> incidente.</p><ul><li><strong>Lê:</strong> métricas contra <code>bands.yaml</code>, logs e deploys recentes.</li><li><strong>Produz:</strong> registro de incidente ou <code>intent.md</code> de diagnóstico, que reabre o loop.</li><li><strong>Humano:</strong> o dono do serviço tria: corrigir agora, agendar ou descartar.</li></ul>' }] }
        ] },
        { tipo: 'texto', largo: true, html:
          '<h3>Os artefatos e quem os lê</h3>' +
          '<table><thead><tr><th>Artefato</th><th>Etapa que produz</th><th>Conteúdo</th><th>Quem lê em seguida</th></tr></thead><tbody>' +
          '<tr><td><code>intent.md</code></td><td>Plan</td><td>Problema, resultado esperado, usuários e sistemas, restrições, questões em aberto</td><td>Design (e Maintain, quando um incidente reabre o loop)</td></tr>' +
          '<tr><td><code>spec.md</code></td><td>Design</td><td>Requisitos, critérios de aceite, políticas aplicadas, preocupações sinalizadas</td><td>Build, Test e a revisão de PR</td></tr>' +
          '<tr><td><code>plan.md</code></td><td>Build (modo de plano)</td><td>Arquivos a tocar, ordem, riscos, testes que provam cada requisito</td><td>O próprio Build, a revisão de PR</td></tr>' +
          '<tr><td>Diff + testes</td><td>Build / Test</td><td>A mudança e a prova automatizada de que ela funciona</td><td>Revisão, CI, evals</td></tr>' +
          '<tr><td>PR com findings</td><td>Deploy</td><td>Achados ordenados por severidade contra spec e plano</td><td>Code owner, release manager</td></tr>' +
          '<tr><td>Registro de incidente / <code>intent.md</code> de diagnóstico</td><td>Maintain</td><td>Evidência, causa provável, recomendação</td><td>Dono do serviço; depois, de novo, Design</td></tr>' +
          '<tr><td>Instruções do projeto, skills, <code>REVIEW.md</code>, <code>bands.yaml</code></td><td>Configuração (transversal)</td><td>Conhecimento persistente, políticas, regras de revisão e limites de monitoramento</td><td>Todo agente que opera no repositório</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Quatro propriedades que o loop precisa preservar</h3>' +
          '<p>São elas, e não o nome dos arquivos, que fazem o loop funcionar.</p>' +
          '<ul>' +
          '<li><strong>O estado mora no artefato, não na conversa.</strong> Uma sessão de agente é efêmera e tem janela de contexto finita (M08). Quem retoma o trabalho, humano ou agente, começa pelo arquivo.</li>' +
          '<li><strong>A aceitação é um evento versionado.</strong> "Aprovado" é um merge ou um PR fechado, não uma frase em reunião. Isso permite automação disparada por evento.</li>' +
          '<li><strong>A trilha de auditoria é subproduto.</strong> Ninguém preenche formulário depois; o histórico já responde quem pediu, quem aprovou e com quais versões de política.</li>' +
          '<li><strong>O humano fica nos pontos de julgamento:</strong> aceitar um problema, resolver uma preocupação de política, aprovar um PR, autorizar um release. O resto é laço automatizável.</li></ul>' },
        { tipo: 'takeaway', html: 'Cada etapa termina num <mark>artefato versionado</mark> que a próxima lê; o <mark>histórico</mark> é a auditoria.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Cada gate tem um dono</h3>' +
          '<p>O playbook não é um organograma, mas os papéis ficam claros na leitura. Nomeie-os antes de qualquer ferramenta, porque cada gate tem um dono.</p>' },
        { tipo: 'abas', rotulo: 'Papéis', itens: [
          { rotulo: 'Produto e política', blocos: [{ tipo: 'texto', largo: true, html: '<table><thead><tr><th>Papel</th><th>Decide ou faz</th><th>Onde aparece</th></tr></thead><tbody>' +
            '<tr><td>Originador</td><td>Tem a ideia, conversa com o agente e corrige o rascunho</td><td><code>intent.md</code></td></tr>' +
            '<tr><td>Product owner</td><td>Aceita ou rejeita o intent; revisa a spec; encaminha preocupações aos donos de política</td><td>Plan, Design</td></tr>' +
            '<tr><td>Donos de política (segurança, marca, conformidade, UX)</td><td>São a fonte da verdade das skills e regras e aprovam mudanças nelas</td><td>Design, Build</td></tr>' +
            '</tbody></table>' }] },
          { rotulo: 'Engenharia', blocos: [{ tipo: 'texto', largo: true, html: '<table><thead><tr><th>Papel</th><th>Decide ou faz</th><th>Onde aparece</th></tr></thead><tbody>' +
            '<tr><td>Engenheiro</td><td>Conduz sessões em modo de plano, dirige sessões paralelas, revisa artefatos</td><td>Build, Test</td></tr>' +
            '<tr><td>Tech lead / arquiteto</td><td>Escreve o <code>REVIEW.md</code>, define limiares de revisão, aprova mudanças de risco alto</td><td>Design, Deploy</td></tr>' +
            '<tr><td>Code owner</td><td>Aprova PRs e mudanças no arquivo de instruções</td><td>Deploy</td></tr>' +
            '<tr><td>Engenharia de plataforma</td><td>Monta a casa do intent, o CI, os servidores MCP, a política gerenciada e as suítes de eval</td><td>Todas (uma vez, com manutenção)</td></tr>' +
            '</tbody></table>' }] },
          { rotulo: 'Release e operação', blocos: [{ tipo: 'texto', largo: true, html: '<table><thead><tr><th>Papel</th><th>Decide ou faz</th><th>Onde aparece</th></tr></thead><tbody>' +
            '<tr><td>Líder de segurança</td><td>Conecta repositórios e organiza as varreduras recorrentes</td><td>Maintain</td></tr>' +
            '<tr><td>Dono do serviço / plantonista</td><td>Tria a fila de achados de monitoramento</td><td>Maintain</td></tr>' +
            '<tr><td>Gerente de release</td><td>Autoriza o que vai a produção</td><td>Deploy</td></tr>' +
            '<tr><td>Gestão de mudanças e conformidade</td><td>Definem os gates de aprovação que precisam sobreviver à automação</td><td>Deploy</td></tr>' +
            '</tbody></table>' }] }
        ] },
        { tipo: 'chat', id: 'gar-chat', titulo: 'Quem decide em cada gate?',
          enunciado: 'Num sistema .NET Web API + Angular com Azure Durable Functions, o agente pergunta quem decide cada gate. Só avança com a escolha certa.',
          rodadas: [
            { agente: 'O intent do novo endpoint de extrato está commitado em um PR. Quem o aceita ou rejeita?', opcoes: [
              { texto: 'O product owner, com merge ou PR fechado.', boa: true, resposta: 'Aguardo o merge do product owner. A decisão fica no histórico e dispara a geração da spec.', porque: 'aceitar um problema é julgamento do product owner, e o evento versionado dispara a etapa seguinte.' },
              { texto: 'Eu mesmo, porque conheço o contexto.', boa: false, resposta: 'Posso dizer que o intent está claro, mas escrevi o rascunho: eu confirmaria o que eu mesmo quis.', porque: 'o gate de aceitação é humano; o agente não é o aprovador.' },
              { texto: 'Ninguém: basta o CI estar verde.', boa: false, resposta: 'O CI valida as regras escritas, e neste ponto nem existe código. Nada confirmaria que o problema vale a pena.', porque: 'CI verde mostra regras passando, não decisão correta.' }
            ] },
            { agente: 'A spec sinaliza uma preocupação de segurança: o extrato precisa autorizar por titular. Quem resolve?', opcoes: [
              { texto: 'O dono da política de segurança, encaminhado pelo product owner.', boa: true, resposta: 'Registrei a preocupação na spec como sinalizada e deixo para o dono da política responder.', porque: 'o agente sinaliza, não resolve; o dono da política é a fonte da verdade.' },
              { texto: 'Eu resolvo, ajustando a spec para passar na política.', boa: false, resposta: 'Ajustei o texto e a preocupação sumiu. Ninguém com autoridade sobre a política viu.', porque: 'resolver preocupação de política sem o dono tira a decisão de quem a possui.' }
            ] },
            { agente: 'O PR do extrato está pronto e a pipeline de cert passou. Quem autoriza ir para produção?', opcoes: [
              { texto: 'O gerente de release; o code owner já aprovou o PR.', boa: true, resposta: 'Preparei o release e aguardo a autorização do gerente de release. O code owner aprovou o PR antes.', porque: 'são dois gates diferentes: aprovar o PR (code owner) e autorizar produção (release manager).' },
              { texto: 'O engenheiro que dirigiu a sessão, ao dar merge.', boa: false, resposta: 'Fiz o merge, mas ele só cobriu o PR. Produção ficou sem a autorização nomeada.', porque: 'o merge não substitui a autorização do gerente de release.' }
            ] }
          ] },
        { tipo: 'cenario', id: 'gar-cenario', titulo: 'O painel diz que o time triplicou', obrigatorio: false,
          enunciado: 'Dois meses depois de adotar o agente, os PRs por semana triplicaram. Escolha como reagir e veja o custo de cada decisão.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O painel mostra PRs por engenheiro em alta, e a fila de revisão cresce. O comitê de mudança segue semanal e o QA segue manual. O que você faz primeiro?', opcoes: [
              { texto: 'Comemorar a produtividade e pedir mais sessões por engenheiro.', vai: 'f-fila', tom: 'ruim', consequencia: 'mais chegada numa etapa que já não dá conta só aumenta o trabalho em andamento.' },
              { texto: 'Medir a vazão ponta a ponta e achar a etapa mais lenta.', vai: 'medir', tom: 'ok', consequencia: 'você descobre que a restrição está depois do Build.' },
              { texto: 'Remover a revisão, já que o agente testa o próprio código.', vai: 'f-risco', tom: 'ruim', consequencia: 'troca um gargalo por risco: sem revisão, nada pega o que o agente não vê.' }
            ] },
            medir: { texto: 'A restrição está em revisão e deploy. Como aliviar sem tirar o julgamento humano?', opcoes: [
              { texto: 'Tornar a revisão mais eficiente: revisor de IA, REVIEW.md e evidência de testes, mantendo a aprovação humana.', vai: 'f-bom', tom: 'ok', consequencia: 'o humano passa a decidir sobre findings e evidência, não a ler diff cru.' },
              { texto: 'Pedir que os revisores aprovem mais rápido.', vai: 'f-rasa', tom: 'ruim', consequencia: 'revisores sobrecarregados aprovam rápido demais, e a qualidade cai.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'A vazão sobe onde estava a restrição, com tempo de ciclo, retrabalho e falha de mudança acompanhados juntos.' },
            'f-fila': { bom: false, texto: 'A fila cresceu e o lead time piorou, enquanto o painel de PRs continuava verde.' },
            'f-risco': { bom: false, texto: 'A fila sumiu e os defeitos escaparam: o gargalo virou risco em produção.' },
            'f-rasa': { bom: false, texto: 'A revisão ficou rasa, e o retrabalho apareceu semanas depois.' }
          },
          callout: 'Você mediu a restrição e a aliviou sem remover o gate humano.' },
        { tipo: 'python', id: 'gar-python', titulo: 'Calcule a restrição', obrigatorio: false,
          enunciado: 'Complete <code>vazao(capacidades, ganho_build)</code>: <code>capacidades</code> é um dict etapa para itens por semana. Multiplique a capacidade de <code>"Build"</code> pelo ganho e devolva a tupla <code>(vazao, etapa_restricao)</code>, com a menor capacidade.',
          codigo: 'def vazao(capacidades, ganho_build):\n    caps = dict(capacidades)\n    # 1. multiplique caps["Build"] pelo ganho\n    # 2. ache a etapa de menor capacidade\n    return 0, ""\n\n\nbase = {"Plan": 12, "Design": 10, "Build": 8, "Test": 9, "Deploy": 6, "Maintain": 10}\nprint(vazao(base, 2))\n',
          testes: 'BASE = {"Plan": 12, "Design": 10, "Build": 8, "Test": 9, "Deploy": 6, "Maintain": 10}\n\n\ndef test_ganho_um():\n    assert vazao(BASE, 1) == (6, "Deploy")\n\n\ndef test_dobrar_build_nao_muda():\n    assert vazao(BASE, 2) == (6, "Deploy")\n\n\ndef test_nao_altera_entrada():\n    vazao(BASE, 2)\n    assert BASE["Build"] == 8\n\n\ndef test_controle_negativo_build_vira_restricao():\n    caps = dict(BASE, Deploy=20)\n    assert vazao(caps, 1) == (8, "Build")\n',
          dica: 'Use <code>min(caps, key=caps.get)</code> para achar a etapa de menor capacidade e leia o valor em <code>caps[etapa]</code>.',
          solucao: 'def vazao(capacidades, ganho_build):\n    caps = dict(capacidades)\n    caps["Build"] = caps["Build"] * ganho_build\n    etapa = min(caps, key=caps.get)\n    return caps[etapa], etapa\n',
          tutorDepois: 'O controle negativo importa: com o Deploy folgado, a restrição passa a ser o Build, e acelerá-lo passa a valer.',
          callout: 'A restrição é o mínimo das capacidades, e agora ela está em código.' },
        { tipo: 'texto', html:
          '<h3>Como ler este módulo sem ficar refém de uma ferramenta</h3>' +
          '<p>O playbook usa os nomes do Claude Code. O curso separa <strong>invariante</strong> (o que você precisa ter) de <strong>adaptador</strong> (o nome na ferramenta). Esta é a tradução do vocabulário que vai aparecer.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Nome no playbook</th><th>Invariante (o que você precisa ter)</th></tr></thead><tbody>' +
          '<tr><td><code>CLAUDE.md</code></td><td>Arquivo de instruções do projeto, versionado, lido no início de toda sessão. Neste curso: <code>AGENTS.md</code> como fonte única</td></tr>' +
          '<tr><td>Skills</td><td>Pacotes de conhecimento versionados (pasta com <code>SKILL.md</code>), carregados sob demanda, com dono</td></tr>' +
          '<tr><td>Hooks</td><td>Interceptadores determinísticos no ciclo de chamadas de ferramenta (permitir, perguntar, bloquear)</td></tr>' +
          '<tr><td>Plan mode</td><td>Fase somente-leitura que termina num plano a ser aprovado antes de qualquer edição</td></tr>' +
          '<tr><td>Auto mode</td><td>Aprovação reduzida dentro de limites, concedida quando os guardrails amadurecem</td></tr>' +
          '<tr><td>Subagentes</td><td>Laços aninhados com contexto limpo e ferramentas restritas, para tarefas repetidas</td></tr>' +
          '<tr><td>Worktrees</td><td>Cópias de trabalho isoladas do mesmo repositório, uma por sessão paralela</td></tr>' +
          '<tr><td>Managed settings</td><td>Política da organização que o indivíduo não consegue desligar</td></tr>' +
          '<tr><td><code>claude-code-action</code>, Code Review</td><td>Agente de revisão executado em CI ou como serviço, que comenta o PR</td></tr>' +
          '<tr><td>Claude Tag, Claude Security</td><td>Agente de plantão num canal de incidentes; varredura de segurança agendada com validação de achados</td></tr>' +
          '</tbody></table>' +
          '<p class="ta-nota">A tabela completa, ferramenta por ferramenta, aparece onde cada conceito é usado (blocos 3, 5 e 6). Na trilha rápida o mesmo vocabulário vira prática: <code>AGENTS.md</code> na raiz, intents em <code>docs/intent/</code>, specs em <code>docs/specs/</code>, planos em <code>docs/plans/</code>, decisões em <code>docs/adr/</code> e <code>REVIEW.md</code> na raiz.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs e erros comuns', html:
          '<ul><li><strong>Artefatos têm custo.</strong> Cada arquivo é manutenção e um lugar onde a verdade pode divergir. Compense com artefatos curtos, de estrutura fixa e validados por script.</li>' +
          '<li><strong>Loop não é cascata em markdown.</strong> Se o intent vira um documento de 30 páginas aprovado em três semanas, você reconstruiu o comitê mensal com extensão <code>.md</code>. O critério é o tempo entre a primeira conversa e o intent commitado.</li>' +
          '<li><strong>Nem toda mudança precisa das seis etapas.</strong> Um ajuste de texto não precisa de spec; o rigor escala com o risco, e isso precisa estar escrito (bloco 7).</li>' +
          '<li><strong>Erro:</strong> medir a adoção por PRs abertos ou linhas geradas. Meça o fluxo ponta a ponta e o retrabalho.</li>' +
          '<li><strong>Erro:</strong> guardar a decisão no chat do agente. Só o que foi commitado existe para a etapa seguinte.</li>' +
          '<li><strong>Erro:</strong> tratar o loop como substituto do julgamento. Os gates humanos são o desenho, não uma concessão.</li></ul>' },
        { tipo: 'escolha', id: 'gar-escolha-fila', titulo: 'Confira: a fila que cresce',
          pergunta: 'O time dobrou a velocidade do Build com agentes. A vazão do sistema não mudou e a fila de revisão cresce. Qual leitura está correta?',
          opcoes: [
            { id: 'a', texto: 'O agente gera código de baixa qualidade e por isso a revisão demora.', correta: false, porque: 'pode haver problema de qualidade, mas o sintoma descrito (vazão igual, fila crescendo) é o de restrição deslocada.' },
            { id: 'b', texto: 'A restrição está numa etapa posterior ao Build; acelerar fora da restrição só aumenta a fila.', correta: true, porque: 'em série, a vazão é o mínimo das capacidades, e o excedente vira trabalho em andamento.' },
            { id: 'c', texto: 'Falta contratar mais engenheiros para escrever código.', correta: false, porque: 'escrever código já não é o limite; contratar para o Build repete o erro.' },
            { id: 'd', texto: 'A revisão precisa ser removida, já que o agente testa o próprio código.', correta: false, porque: 'remover a revisão troca um gargalo por risco. O caminho do playbook é torná-la mais eficiente (revisor de IA, REVIEW.md, evidência de testes) preservando a decisão humana.' }
          ], tutorDepois: 'Meça a vazão do sistema antes de acelerar qualquer etapa.' },
        { tipo: 'escolha', id: 'gar-escolha-estado', titulo: 'Confira: o estado no artefato',
          pergunta: 'Qual destas práticas viola a propriedade "o estado mora no artefato, não na conversa"?',
          opcoes: [
            { id: 'a', texto: 'Commitar o <code>intent.md</code> aceito antes de iniciar a spec.', correta: false, porque: 'é o padrão do loop: a etapa termina em artefato commitado.' },
            { id: 'b', texto: 'Iniciar a etapa Build numa sessão nova que só lê <code>intent.md</code> e <code>spec.md</code>.', correta: false, porque: 'é o padrão do loop: o artefato é a memória compartilhada.' },
            { id: 'c', texto: 'Decidir no chat do agente que o limite será 12 meses e seguir implementando sem registrar.', correta: true, porque: 'a decisão existe só na sessão. Quando ela fechar, o agente seguinte ou a revisão de PR não saberão que ela foi tomada, por quem e por quê.' },
            { id: 'd', texto: 'Registrar o plano aprovado em <code>plan.md</code> e atualizá-lo quando a implementação divergir.', correta: false, porque: 'é exatamente o que mantém o plano fiel ao que foi feito.' }
          ], tutorDepois: 'Se não foi commitado, para a próxima etapa não existe.' },
        { tipo: 'takeaway', html: 'Meça a <mark>vazão do sistema</mark> e a <mark>qualidade</mark> juntas; decisão que não está num <mark>artefato</mark> não existe para a etapa seguinte.' }
      ] }
    ]
  });
})();
