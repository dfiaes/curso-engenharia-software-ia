/* Aula 8 · Elephant-Goldfish: design primeiro, revisão por agentes sem memória. Fatos: blog do Google Open Source (out/2026) e README de github.com/google/elephant-goldfish-model, verificados em 07/11/2026. Saídas de terminal são exemplo ilustrativo. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };

  var entrada = '/egm-brainstorm fila de reprocessamento para cadastros rejeitados na Durable Function';

  var etapas = function () {
    return [
      { id: 'brainstorm', nome: 'Brainstorm', descricao: 'Elephant entrevista e registra decisões', tom: 'dns', ms: 12, linhas: [
        L('info', 'elephant: sessão longa, sem escrever código'),
        L('in', 'pergunta: reprocessar é manual ou automático? qual o limite de tentativas?'),
        L('in', 'pergunta: o cadastro rejeitado pode ser reenviado duas vezes?'),
        L('body', 'decisão registrada: automático, 3 tentativas, reenvio idempotente'),
        L('out', 'concepts_brief.md criado'),
        L('hint', 'decisão humana: o brief reflete o que você quer?')] },
      { id: 'draft', nome: 'Draft', descricao: 'Design em seções, com pausa em cada uma', tom: 'tcp', ms: 25, linhas: [
        L('cmd', '/egm-draft'),
        L('info', 'seção 1/4: problema (pausa)'),
        L('info', 'seção 2/4: plano técnico (pausa)'),
        L('info', 'seção 3/4: alternativas consideradas (pausa)'),
        L('info', 'seção 4/4: plano de implementação, com os arquivos a alterar (pausa)'),
        L('out', 'design_draft.md criado'),
        L('hint', 'decisão humana: você aprova cada seção antes de seguir')] },
      { id: 'compreensao', nome: 'Goldfish 1: compreensão', descricao: 'Revisor novo resume o plano', tom: 'tls', ms: 4, linhas: [
        L('cmd', '/egm-review design_draft.md'),
        L('info', 'goldfish novo, sem a conversa anterior, lendo só o documento'),
        L('in', 'resumo do goldfish: "reenvia cadastros rejeitados até 3 vezes"'),
        L('out', 'achado: o resumo não menciona o intervalo entre tentativas'),
        L('hint', 'se o goldfish não resume o plano, o documento é ambíguo')] },
      { id: 'antagonica', nome: 'Goldfish 2: antagônica', descricao: 'Casos de borda e dependências ocultas', tom: 'request', ms: 6, linhas: [
        L('info', 'outro goldfish novo, papel de adversário'),
        L('out', 'achado: o que acontece se a Function reiniciar no meio da tentativa 2?'),
        L('out', 'achado: o design supõe que o serviço de cadastro é idempotente; ele não é descrito em lugar nenhum'),
        L('hint', 'premissa não declarada exposta')] },
      { id: 'prontidao', nome: 'Goldfish 3: prontidão', descricao: 'Go ou no-go para implementar', tom: 'response', ms: 5, linhas: [
        L('info', 'goldfish novo conferindo caminhos, estruturas e assinaturas'),
        L('out', 'achado: src/Cadastro/Reprocessar.cs não existe; o plano diz "alterar"'),
        L('body', 'veredito: NO-GO (4 achados abertos)')] },
      { id: 'resolve', nome: 'Resolve', descricao: 'Você decide o que muda no documento', tom: 'ink', ms: 8, linhas: [
        L('cmd', '/egm-resolve'),
        L('in', 'intervalo entre tentativas: backoff de 1, 5 e 30 minutos (adicionado)'),
        L('in', 'reinício da Function: estado da tentativa persistido antes de reenviar'),
        L('in', 'idempotência do serviço de cadastro: premissa registrada com chave de reenvio'),
        L('in', 'plano: Reprocessar.cs passa a "criar"'),
        L('out', 'spec aprovada: docs/designs/reprocessamento-cadastro.md'),
        L('hint', 'só agora a implementação começa')] }
    ];
  };

  function ferramenta(linhas, nota) {
    return { tipo: 'texto', html: '<ul>' + linhas.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>' + (nota ? '<p class="ta-nota">' + nota + '</p>' : '') };
  }

  TrilhaAula.registrar({
    id: 'elephant-goldfish',
    titulo: 'Elephant e goldfish: revisar o design antes do código',
    minutos: 15,
    resumo: 'A IA acelera o código e também os erros. O método elephant-goldfish revisa o design com agentes sem memória, antes de qualquer linha escrita.',
    revisao: [
      {
        "id": "quem-e-elephant",
        "pergunta": "No método, quem é o elephant?",
        "opcoes": [
          {
            "id": "a",
            "texto": "A sessão que lembra e decide o design com você",
            "correta": true,
            "porque": "ele guarda o contexto; os goldfish o revisam sem ele."
          },
          {
            "id": "b",
            "texto": "O revisor sem memória que lê só o documento",
            "correta": false,
            "porque": "esse é o goldfish."
          },
          {
            "id": "c",
            "texto": "O agente que implementa o código",
            "correta": false,
            "porque": "o método revisa o design antes de qualquer implementação."
          }
        ]
      },
      {
        "id": "goldfish-esquece",
        "pergunta": "Por que o goldfish esquece de propósito?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Sem contexto herdado ele expõe o que o documento não diz",
            "correta": true,
            "porque": "o que está só na sua cabeça aparece como pergunta ou erro."
          },
          {
            "id": "b",
            "texto": "Para gastar menos tokens",
            "correta": false,
            "porque": "o motivo é achar lacunas, não economizar."
          },
          {
            "id": "c",
            "texto": "Porque é um modelo menor",
            "correta": false,
            "porque": "o que importa é a ausência de contexto, não o tamanho."
          }
        ]
      },
      {
        "id": "resumo-errado",
        "pergunta": "No comprehension check, o goldfish devolve um resumo errado do plano. O que isso indica?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Que o documento está ambíguo ou incompleto, e o texto precisa mudar",
            "correta": true,
            "porque": "se um leitor sem contexto entende errado, outro leitor também pode."
          },
          {
            "id": "b",
            "texto": "Que o goldfish é fraco e deve ser trocado",
            "correta": false,
            "porque": "o erro dele é o dado que você queria."
          },
          {
            "id": "c",
            "texto": "Que o plano está certo e o goldfish não sabe ler",
            "correta": false,
            "porque": "o plano só é claro se alguém sem contexto o entende."
          }
        ]
      },
      {
        "id": "quando-revisar",
        "pergunta": "Quando fazer a revisão elephant-goldfish?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Antes de qualquer linha de código, sobre o design e a spec",
            "correta": true,
            "porque": "corrigir uma premissa no papel custa pouco; no código, custa um PR."
          },
          {
            "id": "b",
            "texto": "Depois do merge, como auditoria",
            "correta": false,
            "porque": "a revisão serve para evitar o erro, não para descobri-lo em produção."
          },
          {
            "id": "c",
            "texto": "Só quando o PR for grande",
            "correta": false,
            "porque": "o método vale para o design que dá origem ao PR."
          }
        ]
      }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>O problema: erro na velocidade do código</h3>' +
          '<p>Um agente escreve em minutos o que levava dias. A conta inclui o erro: uma premissa errada no desenho também chega pronta em minutos, espalhada por dez arquivos. A frase do projeto resume: <strong>"Design is the new code"</strong>. Se o código ficou barato, o <strong>design</strong> passa a ser a parte cara de errar, e é nele que vale gastar revisão.</p>' +
          '<p>O <strong>EGM</strong> (Elephant-Goldfish Model) é um método, com plugin de código aberto, publicado pelo Google Open Source. Ele divide o trabalho entre três papéis.</p>' +
          '<h3>Os três papéis</h3>' +
          '<p>Pense em um arquiteto que conhece a obra inteira e, ao lado, revisores que chegam hoje sem saber de nada. O arquiteto tem memória e viés. Os revisores têm só a planta na mão, e por isso enxergam o que a planta não diz.</p>' +
          '<ul>' +
          '<li><strong>Elephant</strong>: uma sessão longa que guarda todo o contexto e <em>não escreve código</em>. Entrevista você, debate trade-offs e registra decisões. O elefante não esquece.</li>' +
          '<li><strong>Goldfish</strong>: subagentes novos, sem a conversa anterior, que revisam o documento e expõem <strong>premissas não declaradas</strong>. O peixinho-dourado esquece, e é essa a função dele.</li>' +
          '<li><strong>Você</strong>: decide a arquitetura e aprova a spec antes de implementar.</li></ul>' },
        { tipo: 'texto', largo: true, html:
          '<h3>O fluxo</h3>' +
          '<table><thead><tr><th>Passo</th><th>Comando</th><th>O que acontece</th></tr></thead><tbody>' +
          '<tr><td>1</td><td><code>/egm-brainstorm &lt;ideia&gt;</code></td><td>O elephant entrevista e gera <code>concepts_brief.md</code></td></tr>' +
          '<tr><td>2</td><td><code>/egm-draft</code></td><td>Gera <code>design_draft.md</code>: problema, plano técnico, alternativas consideradas e plano de implementação com os arquivos a alterar. Pausa após cada seção</td></tr>' +
          '<tr><td>3</td><td><code>/egm-review design_draft.md</code></td><td>Revisão em cinco etapas com agentes novos. Inclui o <em>comprehension check</em> (se o goldfish não consegue resumir o plano, o documento é ambíguo), a <em>revisão antagônica</em> (casos de borda, dependências ocultas) e o <em>implementation readiness</em> (go/no-go: caminhos, estruturas, assinaturas)</td></tr>' +
          '<tr><td>4</td><td><code>/egm-resolve</code></td><td>Trata os achados</td></tr>' +
          '<tr><td>5</td><td>implementar</td><td>As specs aprovadas ficam em <code>docs/designs/</code></td></tr>' +
          '</tbody></table>' +
          '<p>Há ainda <code>/egm-review-loop</code> (revisores configurados), <code>/egm-bootstrap</code> (gera documentos de uma codebase existente) e <code>/egm-drift-report</code> (compara documentos e código).</p>' },
        { tipo: 'rode', id: 'egm-rode', titulo: 'Rode o fluxo do design', enunciado: 'Envie a ideia ao elephant e acompanhe o brainstorm, o draft, três checagens goldfish e a resolução. Clique numa etapa para ver só as linhas dela.',
          prefixo: 'Prompt', entrada: entrada, unidade: 'min', etapas: etapas(), terminalTitulo: 'egm',
          tutorAntes: 'Aperte Enter. Repare em quem escreve (o elephant), em quem só lê o documento (os goldfish) e em onde você decide.',
          tutorDepois: 'Três revisores novos acharam quatro problemas no documento, antes de existir código. O terminal é um exemplo ilustrativo; os achados reais dependem do seu design.',
          callout: 'Fluxo completo: ideia, brief, design, revisão sem memória, resolução e spec aprovada.' },
        { tipo: 'takeaway', html: 'O <mark>elephant</mark> lembra e decide com você; os <mark>goldfish</mark> esquecem de propósito e <mark>expõem o que o documento não diz</mark>.' }
      ] },

      { rotulo: 'Quebrar e ordenar', blocos: [
        { tipo: 'texto', html:
          '<p>O valor do goldfish está em <em>não ter</em> o contexto. Um revisor que leu a conversa completa já sabe o que você quis dizer e perdoa o que o texto omite. Rode a falha, depois rode sem falha para fechar o exercício.</p>' },
        { tipo: 'quebre', id: 'egm-quebre', titulo: 'Quebre o goldfish', enunciado: 'Escolha uma falha, envie a mesma ideia e veja onde o problema escapa.',
          prefixo: 'Prompt', entrada: entrada, unidade: 'min', etapas: etapas(), terminalTitulo: 'egm',
          tutorAntes: 'Escolha "Goldfish com contexto herdado", aperte Enter e leia a revisão antagônica. Depois tente a outra falha e rode sem falha.',
          tutorDepois: 'Sem falha, cada revisor lê só o documento, e o que está na sua cabeça precisa estar no papel.',
          callout: 'Você viu as duas falhas e o fluxo correto.',
          falhas: [
            { id: 'herdado', rotulo: 'Goldfish com contexto herdado', efeito: { etapaFalha: 'antagonica', linhasErro: [
              'revisor aberto na mesma sessão do elephant, com a conversa inteira',
              { kind: 'info', text: 'revisor: o serviço de cadastro é idempotente, lembro de você ter dito isso' },
              { kind: 'in', text: 'achados: nenhum' },
              { kind: 'body', text: 'veredito: aprovado' },
              'no ambiente de cert, o serviço de cadastro duplica o registro no reenvio'
            ], tutor: 'a idempotência foi dita na conversa e nunca foi escrita no documento. O revisor que leu a conversa preencheu a lacuna sozinho. Um goldfish de verdade não teria essa informação e teria perguntado.' } },
            { id: 'sem-prontidao', rotulo: 'Pular a checagem de prontidão', efeito: { etapaFalha: 'prontidao', linhasErro: [
              'implementation readiness pulado: "o plano parece claro"',
              { kind: 'info', text: 'agente implementador: alterando src/Cadastro/Reprocessar.cs' },
              { kind: 'out', text: 'erro: arquivo não encontrado' },
              { kind: 'info', text: 'agente cria o arquivo com assinatura própria' },
              { kind: 'in', text: 'build ok, mas a assinatura diverge da que o resto do plano usa' },
              'retrabalho: o documento dizia "alterar" um arquivo que não existia'
            ], tutor: 'a checagem de prontidão existe para pegar caminhos, estruturas e assinaturas que o plano supõe e o código não tem. Pulá-la devolve o erro na implementação, que é onde ele custa mais.' } }
          ] },
        { tipo: 'ordene', id: 'egm-ordene', titulo: 'Ponha o fluxo na ordem',
          enunciado: 'Ordene as etapas do EGM, da primeira à última.',
          itens: [
            { id: 'review', texto: '<code>/egm-review design_draft.md</code>: revisão com agentes novos' },
            { id: 'impl', texto: 'Implementar, com a spec aprovada em <code>docs/designs/</code>' },
            { id: 'brainstorm', texto: '<code>/egm-brainstorm &lt;ideia&gt;</code>: gera <code>concepts_brief.md</code>' },
            { id: 'resolve', texto: '<code>/egm-resolve</code>: trata os achados' },
            { id: 'draft', texto: '<code>/egm-draft</code>: gera <code>design_draft.md</code>' }
          ], solucao: ['brainstorm', 'draft', 'review', 'resolve', 'impl'],
          dica: 'Primeiro a ideia vira brief, depois design; só depois de revisado o design vira código.',
          tutorDepois: 'Quatro etapas antes de uma linha de código: as decisões são revisadas enquanto ainda são baratas.' },
        { tipo: 'takeaway', html: 'Revisor com <mark>contexto herdado</mark> confirma o que você quis dizer; revisor <mark>sem contexto</mark> acha o que você não escreveu.' }
      ] },

      { rotulo: 'Usar no ciclo', blocos: [
        { tipo: 'texto', html:
          '<h3>Instalação por ferramenta</h3>' +
          '<p>Verificado em 07/11/2026 no README do repositório <code>google/elephant-goldfish-model</code>. † marca o que você deve conferir em <code>docs/harnesses.md</code> do repositório, na versão em uso.</p>' },
        { tipo: 'abas', rotulo: 'Ferramenta', itens: [
          { rotulo: 'Claude Code', blocos: [
            { tipo: 'codigo', linguagem: 'bash', texto: 'claude plugin marketplace add google/elephant-goldfish-model\nclaude plugin install egm@egm' },
            { tipo: 'texto', html: '<p>Os comandos ganham o prefixo <code>/egm:</code>, por exemplo <code>/egm:egm-brainstorm</code>.</p>' }] },
          { rotulo: 'Codex', blocos: [
            { tipo: 'codigo', linguagem: 'bash', texto: 'codex plugin marketplace add google/elephant-goldfish-model\ncodex plugin add egm@egm' }] },
          { rotulo: 'Antigravity', blocos: [
            { tipo: 'codigo', linguagem: 'bash', texto: 'agy plugin install https://github.com/google/elephant-goldfish-model' }] },
          { rotulo: 'Sem plugin', blocos: [
            { tipo: 'texto', html:
              '<p>O método é uma ideia, não uma dependência. Dá para fazer o mesmo com qualquer agente que abra uma sessão nova ou um subagente. Duas peças.</p>' +
              '<p><strong>1. Sessão elephant</strong>: uma regra de instrução que proíbe código. Cole numa sessão dedicada ao design:</p>' },
            { tipo: 'codigo', linguagem: 'markdown', texto: '## Modo elephant\nNesta sessão você NÃO escreve nem edita código.\n1. Entreviste-me, uma pergunta por vez, sobre o problema e as restrições.\n2. Debata trade-offs e proponha alternativas.\n3. Registre cada decisão em docs/designs/<ticket>-<slug>.md,\n   com: problema, plano técnico, alternativas consideradas,\n   plano de implementação (arquivos a alterar).\n4. Pare ao fim de cada seção e espere minha aprovação.' },
            { tipo: 'texto', html: '<p><strong>2. Revisor goldfish</strong>: um subagente ou uma sessão nova, que lê <em>só</em> o documento:</p>' },
            { tipo: 'codigo', linguagem: 'markdown', texto: 'Você é um revisor sem contexto. Leia SOMENTE docs/designs/<ticket>-<slug>.md.\n1. Resuma o plano em cinco linhas. Se não conseguir, diga o que está ambíguo.\n2. Liste premissas não declaradas, casos de borda e dependências ocultas.\n3. Confira se os caminhos, estruturas e assinaturas citados existem no repositório.\n4. Termine com GO ou NO-GO e a lista de achados. Não proponha código.' },
            { tipo: 'texto', html: '<p class="ta-nota">Regra de ouro do goldfish: nunca reaproveite a sessão do elephant como revisora. Se não for possível criar um contexto novo, a revisão não vale.</p>' }] }
        ] },
        { tipo: 'texto', html: '<p><strong>Cursor, Gemini, Copilot e OpenCode †:</strong> o repositório traz manifests e adaptadores, mas o suporte e a instalação de cada um estão descritos em <code>docs/harnesses.md</code> †. Confira lá antes de contar com eles.</p>' },
        { tipo: 'texto', html:
          '<h3>Onde isso entra no nosso ciclo</h3>' +
          '<p>O EGM cobre as etapas do começo do ciclo e a revisão no fim, as mesmas que a aula <strong>O mapa do ciclo</strong> mostra:</p>' +
          '<ul><li><strong>Intenção, spec e plano</strong>: o brainstorm e o draft produzem o que o ciclo chama de intenção, spec e plano, com a spec aprovada em <code>docs/designs/</code>. A revisão goldfish é o portão antes da implementação.</li>' +
          '<li><strong>Revisão do PR</strong>: a mesma lógica da aula <strong>Paralelismo e revisão</strong>. Quem revisa não escreveu, e por isso vê o que o autor não vê.</li></ul>' +
          '<h3>Meça, não presuma</h3>' +
          '<p>Um método novo é uma hipótese. Compare o seu fluxo com e sem a revisão goldfish (ou o seu revisor caseiro) usando o kit de evals, no modo <code>--skill-ab</code>, sobre casos do seu repositório. A aula <strong>Avaliar skills e modelos</strong> mostra como.</p>' +
          '<h3>Limites</h3>' +
          '<ul><li>A revisão goldfish exige criar subagentes novos. Se a ferramenta não consegue, o EGM interrompe.</li>' +
          '<li>Não substitui testes nem julgamento humano: o que foi revisado é o documento, não o código.</li>' +
          '<li>Licença Apache-2.0. O repositório diz que <strong>não é um produto oficialmente suportado pelo Google</strong>: fixe a versão e leia o que instala.</li></ul>' },
        { tipo: 'escolha', id: 'egm-escolha1', titulo: 'Confira: quem revisa',
          pergunta: 'Você terminou o design com o agente e quer uma revisão que ache premissas não declaradas. Qual a melhor opção?',
          opcoes: [
            { id: 'a', texto: 'Pedir ao mesmo agente, na mesma conversa: "revise o que acabamos de escrever".', correta: false, porque: 'ele leu a conversa inteira e preenche as lacunas do documento com o que já sabe. É o goldfish com contexto herdado.' },
            { id: 'b', texto: 'Abrir um subagente ou sessão nova que leia só o documento e peça um resumo e as premissas ocultas.', correta: true, porque: 'sem a conversa, o revisor só tem o texto. O que ele não consegue resumir ou supor é exatamente o que o documento deixou ambíguo.' },
            { id: 'c', texto: 'Pular a revisão do design e confiar nos testes depois.', correta: false, porque: 'teste confirma o que foi escrito. Uma premissa errada de design costuma passar nos testes que o mesmo agente escreveu.' }
          ], tutorDepois: 'Revisor novo, só o documento.' },
        { tipo: 'escolha', id: 'egm-escolha2', titulo: 'Confira: o goldfish não resume o plano',
          pergunta: 'No comprehension check, o goldfish devolve um resumo errado do seu plano. O que isso indica?',
          opcoes: [
            { id: 'a', texto: 'O goldfish é um modelo fraco e deve ser trocado.', correta: false, porque: 'pode até ser, mas o sinal do método é outro: se um leitor competente sem contexto entende errado, outros leitores também entenderão.' },
            { id: 'b', texto: 'O documento é ambíguo e precisa ser reescrito antes de seguir.', correta: true, porque: 'é a definição do comprehension check. O resumo errado aponta o trecho que depende de contexto não escrito.' },
            { id: 'c', texto: 'Basta dar a conversa ao goldfish para ele entender.', correta: false, porque: 'isso derrota o método: o goldfish passaria a ter o contexto herdado e deixaria de expor a ambiguidade.' }
          ], tutorDepois: 'Resumo errado é defeito do documento.' },
        { tipo: 'takeaway', html: 'Faça o <mark>design</mark> numa sessão sem código, revise com <mark>agentes sem memória</mark> e só então implemente a spec aprovada.' }
      ] }
    ]
  });
})();
