/* A01 · Checkpoint: sete cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };

  TrilhaAula.registrar({
    id: 'a01-checkpoint',
    titulo: 'Checkpoint A01',
    minutos: 45,
    resumo: 'Sete cenários sobre o SDLC nativo em IA, sem consulta. Responda com as suas palavras, justifique pelo invariante e diga como ficaria em pelo menos duas ferramentas.',
    objetivo: 'Verificar, sem consulta, se você diagnostica a restrição, desenha o loop, projeta controles que valem em várias ferramentas, fecha o laço com a produção e planeja a adoção.',
    abas: [
      { rotulo: 'Restrição, loop e controles', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que basta. Em todas, justifique pelo <strong>invariante</strong> e diga como ficaria em pelo menos duas ferramentas diferentes. Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: o diagnóstico',
          pergunta: 'A equipe dobrou a velocidade de escrita de código com agentes e o tempo de entrega de features não mudou. Qual é o primeiro passo?',
          opcoes: [
            { id: 'a', texto: 'Medir a fila por etapa e agir na restrição (a etapa mais lenta).', correta: true, porque: 'a vazão é a da etapa mais lenta; acelerar fora dela só muda a fila de lugar.' },
            { id: 'b', texto: 'Contratar mais gente para o Build.', correta: false, porque: 'o Build já não é a restrição.' },
            { id: 'c', texto: 'Pedir ao agente que escreva ainda mais rápido.', correta: false, porque: 'aumenta a fila a jusante.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · O Build dobrou e nada chegou antes', obrigatorio: false,
          enunciado: 'A equipe dobrou a velocidade de escrita com agentes e o tempo de entrega de features não mudou. Diagnostique e escolha por onde agir. <em>Bloco 1.</em>',
          placeholder: 'A vazão do sistema é… Eu mediria… Agiria em…',
          rubrica: [
            'A vazão é a da <strong>etapa mais lenta</strong> (a restrição).',
            'Medir a <strong>fila por etapa</strong>.',
            'Agir na restrição (revisão, testes ou deploy), não no Build.',
            'Acompanhar uma <strong>métrica ponta a ponta</strong> e o <strong>retrabalho</strong>.'
          ],
          modelo: '<p>A vazão de um sistema é a da etapa mais lenta. Se o Build dobrou e a entrega não mudou, o gargalo está em outra etapa e a fila apenas mudou de lugar. Eu mediria a fila de cada etapa (revisão, testes, deploy), agiria na restrição (por exemplo, revisão por IA se a fila é de PRs) e acompanharia uma métrica ponta a ponta, como tempo da intenção ao merge, ao lado do retrabalho.</p>' + reprova('"contratar mais gente" ou "pedir ao agente que escreva mais rápido".') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · O loop', obrigatorio: false,
          enunciado: 'Desenhe o loop de seis etapas: o artefato de cada uma, quem o lê e onde o humano decide. <em>Bloco 1.</em>',
          placeholder: 'Intenção: … Spec: … Plano: …',
          rubrica: [
            'Os artefatos: <code>intent.md</code>, <code>spec.md</code>, <code>plan.md</code>, diff e testes, PR com findings, registro de incidente.',
            'A <strong>aceitação</strong> como o merge.',
            'Papéis nomeados: <strong>product owner</strong>, <strong>code owner</strong> e <strong>gerente de release</strong>.',
            'O <strong>histórico versionado</strong> como auditoria.'
          ],
          modelo: '<p>Intenção produz <code>intent.md</code>, decidido pelo product owner. A spec produz <code>spec.md</code>, lida pelo plano. O plano produz <code>plan.md</code>, aprovado antes de editar. O Build produz diff e testes. O Deploy produz o PR com findings da revisão, e o code owner decide o merge, que é a aceitação; o gerente de release autoriza produção. Maintain produz o registro de incidente, que volta como novo <code>intent.md</code>. Cada artefato é versionado, e o histórico é a auditoria.</p>' + reprova('"documentação em wiki" ou etapas sem artefato versionado.') },

        { tipo: 'escolha', id: 'cp-esc-p3', titulo: 'P3 · Aquecimento: onde mora a regra',
          pergunta: 'A empresa proíbe alterar <code>migrations/</code> sem aprovação, e o time usa Cursor, Codex e Claude Code. Qual desenho vale nas três ferramentas?',
          opcoes: [
            { id: 'a', texto: 'Colocar a regra no prompt de cada sessão.', correta: false, porque: 'prompt é consultivo e some com a sessão.' },
            { id: 'b', texto: 'Um hook de agente em cada ferramenta e nada mais.', correta: false, porque: 'um hook não vê tudo (por exemplo, um <code>sed -i</code> no terminal).' },
            { id: 'c', texto: '<code>AGENTS.md</code> como fonte única mais hook por ferramenta, pre-commit e check obrigatório no CI sobre o diff, com CODEOWNERS.', correta: true, porque: 'camadas que olham o diff: o CI pega o que o hook não viu.' }
          ] },
        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Uma regra, três ferramentas', obrigatorio: false,
          enunciado: 'A empresa proíbe alterar <code>migrations/</code> sem aprovação, e o time usa Cursor, Codex e Claude Code. Projete o controle. <em>Bloco 3.</em>',
          placeholder: 'A regra mora em… A skill… O hook… O CI…',
          rubrica: [
            '<code>AGENTS.md</code> como <strong>fonte única</strong>, com ponteiros por ferramenta.',
            'A <strong>skill ensina</strong>; o <strong>hook de agente</strong> garante, por ferramenta (exit 2 ou equivalente).',
            '<strong>Pre-commit</strong> e <strong>check obrigatório no CI</strong> sobre o diff, mais <strong>CODEOWNERS</strong>.',
            'Reconhece que um hook <strong>não vê</strong> um <code>sed -i</code> no terminal.'
          ],
          modelo: '<p>A regra e o motivo moram no <code>AGENTS.md</code> (fonte única, com ponteiro para o Claude Code). Uma skill ensina o procedimento de pedir a mudança. Em cada ferramenta, um hook de agente bloqueia edição em <code>migrations/</code> com exit 2 e a razão. Como um hook não vê um <code>sed -i</code>, pre-commit e um check obrigatório no CI olham o diff, e o CODEOWNERS exige a aprovação nomeada.</p>' + reprova('"colocar no prompt" ou depender só do hook.') },

        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · O teste enfraquecido', obrigatorio: false,
          enunciado: 'O agente corrigiu um bug alterando a asserção do teste. Mostre como o processo impede isso e o que ainda escapa. <em>Bloco 4.</em>',
          placeholder: 'O processo impede… Ainda escapa…',
          rubrica: [
            '<strong>Teste vermelho commitado primeiro</strong>.',
            'Bloquear modificação/remoção de <strong>testes existentes</strong> em <code>fix/</code>.',
            'Verificar <strong>por commit</strong> no CI, não só no diff líquido.',
            'Limites (teste novo trivial, <code>conftest</code>, skip) tratados por <strong>verificador de contexto limpo</strong>, plano com teste por requisito e/ou <strong>mutation testing</strong>.'
          ],
          modelo: '<p>A correção começa por um teste vermelho commitado antes do código. Em branches <code>fix/</code>, um hook e o CI bloqueiam modificar ou remover testes existentes, e o CI verifica commit a commit, não só o diff líquido, para que um enfraquecimento seguido de reversão não passe. Ainda escapam teste novo trivial, mudanças em <code>conftest</code> e skips; isso se trata com um verificador de contexto limpo, plano com um teste por requisito e mutation testing.</p>' + reprova('"pedir ao agente que não faça isso".') },
        { tipo: 'takeaway', html: 'Diagnóstico pela <mark>restrição</mark>, loop com <mark>artefatos</mark> e controles em <mark>camadas</mark> que olham o diff.' }
      ] },

      { rotulo: 'Produção, laço e adoção', blocos: [
        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Revisão e produção num banco', obrigatorio: false,
          enunciado: 'Desenhe a revisão de PR por IA e a autonomia por ambiente para uma empresa regulada. <em>Bloco 5.</em>',
          placeholder: 'Findings… REVIEW.md… Revisor… Jobs… Ambientes… Política gerenciada…',
          rubrica: [
            '<strong>Findings não aprovam</strong>; code owner exigido por proteção de branch.',
            '<code>REVIEW.md</code> lido da <strong>base</strong>; revisor <strong>somente leitura</strong> e separado do autor.',
            'Job que <strong>lê o PR</strong> separado do que <strong>escreve</strong>; tokens curtos.',
            'Dev livre, staging intermediário, produção em que o agente <strong>prepara</strong> e o gerente de release <strong>autoriza</strong> por gate imposto.',
            'Política gerenciada <strong>fora do repositório</strong>, adaptada e não copiada.'
          ],
          modelo: '<p>O revisor de IA roda como conta de serviço, somente leitura, lendo o <code>REVIEW.md</code> da branch base (coberto por CODEOWNERS); os findings informam, mas a proteção de branch exige o code owner. Um job lê o PR sem escrita e outro só publica o comentário, com tokens curtos e sem executar o PR. Por ambiente: dev livre; staging com CI verde como condição; produção, onde o agente prepara o release e o gerente de release autoriza por um gate imposto por hook ou regra de ambiente, sem credencial de produção do agente. Os inegociáveis (segredos, rede, bypass desabilitado) ficam numa política gerenciada fora do repositório, adaptada ao fluxo.</p>' + reprova('o agente aprova ou implanta em produção com credencial ampla.') },

        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Fechar o laço', obrigatorio: false,
          enunciado: 'A taxa de 5xx de um serviço precisa gerar trabalho no backlog sem alarme excessivo. Projete. <em>Bloco 6.</em>',
          placeholder: 'Quem detecta… Que bandas… Que resposta por tier… Como volta ao backlog…',
          rubrica: [
            '<strong>Script determinístico</strong> com base rolante que <strong>precede</strong> a janela recente; regras de Western Electric.',
            '<code>bands.yaml</code>: 1σ registra, 2σ diagnóstico de leitura, 3σ PR/runbook pré-aprovado.',
            'O <strong>modelo só depois</strong> da violação; saída em <code>intent.md</code>; triagem humana.',
            'Descartes <strong>retunam</strong> as bandas; a correção vira <strong>eval</strong>.',
            'Cita <strong>taxa de alarme falso</strong>, <strong>sazonalidade</strong> e <strong>rebaselining</strong>.'
          ],
          modelo: '<p>Um script versionado e testado compara a taxa de 5xx com uma base rolante de 30 pontos que precede a janela recente, usando as regras de Western Electric; nenhum modelo detecta. O <code>bands.yaml</code> mapeia 1σ para registrar, 2σ para diagnóstico somente leitura e 3σ para propor um PR ou um runbook pré-aprovado. Só depois da violação o agente diagnostica e escreve um <code>intent.md</code>; o dono do serviço tria, descartes com razão retunam as bandas e cada correção vira eval. Preciso medir a taxa de alarme falso, tratar sazonalidade por faixa de horário e fazer rebaselining versionado quando uma mudança for legítima.</p>' + reprova('"um LLM lê os logs e decide".') },

        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Adoção', obrigatorio: false,
          enunciado: 'Equipe de 12 pessoas, a fila de revisão é a restrição e nenhum agente atua em produção. Monte os primeiros 90 dias. <em>Bloco 7.</em>',
          placeholder: 'Dias 1–30… Dias 31–60… Dias 61–90… Medimos… Paramos se…',
          rubrica: [
            '<strong>Onda 1</strong> (intent, <code>AGENTS.md</code>, comando de verificação no CI) e <strong>revisão por IA primeiro</strong>.',
            '<strong>CODEOWNERS</strong> cobrindo instruções, skills e workflows.',
            'Métricas <strong>líder e defasada</strong> de partida.',
            '<strong>Critério de parada</strong> para a expansão.',
            '<strong>ADR</strong> das decisões.'
          ],
          modelo: '<p>Nos primeiros 30 dias, capturo intents, escrevo um <code>AGENTS.md</code> enxuto com o comando de verificação e o torno check obrigatório no CI, e ligo cedo a revisão por IA porque a restrição é a fila de revisão; CODEOWNERS cobre instruções, skills e workflows. Depois, spec, plano, hooks e as primeiras evals; só no fim, 2 a 3 sessões paralelas. Meço líder e defasada desde a partida (tempo até a 1ª revisão; defeitos escapados e retrabalho), congelo a expansão se o retrabalho subir por duas medições e registro tudo num ADR.</p>' + reprova('instalar tudo de uma vez ou medir só atividade.') },
        { tipo: 'escolha', id: 'cp-esc-p6', titulo: 'P6 · Fechamento: o que decide a anomalia',
          pergunta: 'Qual afirmação sobre o detector está certa?',
          opcoes: [
            { id: 'a', texto: 'Um script determinístico decide a anomalia; o agente só diagnostica depois da banda violada.', correta: true, porque: 'a detecção fica reprodutível, barata e fora do alcance de injeção por conteúdo de log.' },
            { id: 'b', texto: 'O agente lê os logs e decide; o script só arquiva.', correta: false, porque: 'inverte a ordem que não pode ser invertida.' },
            { id: 'c', texto: 'Com 3σ, o agente escreve código novo direto em produção.', correta: false, porque: 'em 3σ, propor via runbook pré-aprovado é mais seguro, e o humano autoriza.' }
          ] },
        { tipo: 'texto', html: '<p class="ta-nota">Estado verificado em 12/10/2026 (OpenCode V2 revalidado em 09/11/2026); recursos de produto têm alto risco de obsolescência (revalidar em até 60 dias). Células "não verificado" nos blocos indicam recursos que a documentação consultada não confirmou.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>invariante</mark> primeiro e, depois, <mark>pelo menos duas ferramentas</mark>.' }
      ] }
    ]
  });
})();
