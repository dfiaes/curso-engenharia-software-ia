/* Aula 3 · Fluxos por tipo de trabalho. Fonte: TR-texto.html, Passo 2. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };

  var bugEtapas = function () {
    return [
      { id: 'ticket', nome: 'Ticket', descricao: 'Sintoma e reprodução descritos', tom: 'dns', ms: 2, linhas: [
        L('info', 'lendo PROJ-456: pedido some da lista após filtrar por data'),
        L('out', 'ambiente: cert, v2.14.1; passos e esperado x obtido presentes'),
        L('cmd', 'git switch -c fix/PROJ-456-filtro-data'),
        L('hint', 'sem reprodução descrita, devolva ao reporter')] },
      { id: 'repro', nome: 'Teste que falha', descricao: 'Reproduz pelo motivo do ticket', tom: 'tcp', ms: 8, linhas: [
        L('info', 'escrevendo o teste mais baixo possível'),
        L('in', 'tests/test_filtro.py::test_pedido_no_ultimo_dia criado'),
        L('cmd', 'make test'),
        L('out', '1 failed: test_pedido_no_ultimo_dia  (esperado 3 itens, obtido 2)'),
        L('hint', 'falha pelo motivo do ticket? Se for por outro motivo, é falso positivo')] },
      { id: 'diag', nome: 'Causa raiz', descricao: 'Hipóteses com evidência', tom: 'tls', ms: 10, linhas: [
        L('out', 'git log -S"data_fim" -- src/filtro.py'),
        L('body', 'H1: comparação usa < em vez de <=  (evidência: linha 41, blame de 3 meses)'),
        L('body', 'H2: fuso horário truncado  (evidência fraca: logs sem deslocamento)'),
        L('hint', 'decisão humana: qual hipótese vale testar?')] },
      { id: 'fix', nome: 'Correção', descricao: 'Menor mudança que resolve a causa', tom: 'request', ms: 6, linhas: [
        L('info', 'edit src/filtro.py (+1 -1)'),
        L('cmd', 'make check'),
        L('in', '13 passed, ruff: ok, mypy: ok'),
        L('out', 'busca de irmãos: mesmo padrão em src/relatorio.py:77 (listado, não corrigido)')] },
      { id: 'pr', nome: 'PR com causa raiz', descricao: 'Risco, validação e rollback', tom: 'ink', ms: 3, linhas: [
        L('cmd', 'git commit -m "PROJ-456: corrige limite de data no filtro"'),
        L('in', 'PR aberto: causa raiz, correção, risco, validação em cert, rollback'),
        L('hint', 'o teste novo falha antes e passa depois; nenhum teste antigo foi tocado')] }
    ];
  };

  var perguntas = function () {
    return [
      { id: 'q', nome: 'Perguntas', descricao: 'Até 7, antes da spec', tom: 'dns', ms: 3, linhas: [
        L('info', 'modo leitura: lendo PROJ-123, AGENTS.md e docs/specs/ relevantes'),
        L('body', '1. CNPJ com ou sem máscara na entrada? Normalizamos na API?'),
        L('body', '2. Validar só dígitos verificadores ou consultar a Receita?'),
        L('body', '3. CNPJ alfanumérico entra nesta entrega?'),
        L('body', '4. Investidor estrangeiro sem CNPJ segue por qual caminho?'),
        L('body', '5. Mensagem de erro: texto fixo ou por código?'),
        L('body', '6. O front valida também ou só a API?'),
        L('body', '7. O que acontece com cadastros antigos já inválidos?'),
        L('hint', 'cada pergunta é uma ambiguidade que viraria suposição do agente')] },
      { id: 'resp', nome: 'Suas respostas', descricao: 'Decisões humanas', tom: 'tcp', ms: 5, linhas: [
        L('in', 'você: 1 normaliza na API; 2 só dígitos; 3 fora do escopo; 4 caminho atual'),
        L('in', 'você: 5 código de erro; 6 front só formata; 7 não migra, marca para revisão')] },
      { id: 'spec', nome: 'Spec', descricao: 'Dado/Quando/Então e fora do escopo', tom: 'response', ms: 6, linhas: [
        L('in', 'docs/specs/PROJ-123-validar-cnpj.md criado (status: rascunho)'),
        L('body', 'Dado um CNPJ com dígito verificador inválido, quando o cadastro é enviado, então a API responde 422 com código CNPJ_INVALIDO'),
        L('body', 'fora do escopo: CNPJ alfanumérico, consulta à Receita'),
        L('hint', 'decisão humana: você muda o status para aprovada. Sem isso, não há código')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'fluxos-por-tipo',
    titulo: 'Fluxos por tipo de trabalho',
    minutos: 22,
    resumo: 'O ciclo é o mesmo, a proporção entre as etapas muda. Feature, bug, módulo grande e upgrade pedem prompts diferentes.',
    revisao: [
      {
        "id": "bug-sem-spec",
        "pergunta": "Num bug, o que ocupa o lugar da spec?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Um teste que falha pelo motivo do ticket",
            "correta": true,
            "porque": "sem teste que falha primeiro, não existe correção, existe palpite."
          },
          {
            "id": "b",
            "texto": "Uma descrição longa da causa provável",
            "correta": false,
            "porque": "a causa provável é hipótese; o teste que falha a transforma em fato."
          },
          {
            "id": "c",
            "texto": "Nada: bug é pequeno demais para etapas",
            "correta": false,
            "porque": "o ciclo encurta, mas o teste vermelho continua sendo a prova."
          }
        ]
      },
      {
        "id": "esqueleto-andante",
        "pergunta": "O que é o esqueleto andante num módulo grande?",
        "opcoes": [
          {
            "id": "a",
            "texto": "A primeira fatia, que atravessa todas as camadas com o mínimo e valida a premissa mais perigosa",
            "correta": true,
            "porque": "ela atrás de uma flag mostra cedo se o desenho se sustenta."
          },
          {
            "id": "b",
            "texto": "Um protótipo descartável, sem testes",
            "correta": false,
            "porque": "a fatia fica; ela é o começo do módulo, não um rascunho."
          },
          {
            "id": "c",
            "texto": "A documentação completa antes de qualquer código",
            "correta": false,
            "porque": "o esqueleto existe para validar com código o que a doc só supõe."
          }
        ]
      },
      {
        "id": "upgrade-seguro",
        "pergunta": "Qual abordagem é a mais segura para atualizar a versão de um framework?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Um PR só de atualização, com testes de caracterização que passam antes e depois",
            "correta": true,
            "porque": "o invariante é o comportamento atual; sem misturar com feature, qualquer quebra tem uma causa só."
          },
          {
            "id": "b",
            "texto": "Atualizar junto com features novas, para aproveitar a revisão",
            "correta": false,
            "porque": "se algo quebrar, não há como saber se foi a versão ou a feature."
          },
          {
            "id": "c",
            "texto": "Atualizar tudo e corrigir o que o CI acusar",
            "correta": false,
            "porque": "o CI só acusa o que tem teste; a caracterização cobre o que não tem."
          }
        ]
      },
      {
        "id": "bugs-irmaos",
        "pergunta": "Depois de corrigir um bug, o que o agente faz com bugs irmãos que encontrou?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Lista, e só corrige se você pedir",
            "correta": true,
            "porque": "corrigir sem pedir amplia o escopo do PR e a revisão."
          },
          {
            "id": "b",
            "texto": "Corrige todos no mesmo PR",
            "correta": false,
            "porque": "o PR fica grande e mistura causas, o que dificulta o review e o rollback."
          },
          {
            "id": "c",
            "texto": "Ignora, porque são outro assunto",
            "correta": false,
            "porque": "a lista é útil; o que se evita é corrigir sem decisão sua."
          }
        ]
      }
    ],
    abas: [
      { rotulo: 'Feature e bug', blocos: [
        { tipo: 'texto', html:
          '<p>Uma reforma de banheiro e a construção de um prédio usam os mesmos ofícios, mas ninguém contrata engenheiro estrutural para trocar um azulejo. Aqui é igual: o ciclo é o mesmo, a <strong>proporção</strong> entre as etapas muda. Aplicar o fluxo de módulo grande a um ajuste de texto desperdiça o dia; aplicar o de feature pequena a uma integração nova gera retrabalho.</p>' +
          '<h3>Feature pequena (cabe em um PR, horas)</h3>' +
          '<ol>' +
          '<li><strong>Jira:</strong> história com critérios Dado/Quando/Então (<code>jira/historia.md</code>), por exemplo <code>PROJ-123</code>.</li>' +
          '<li><strong>Intenção e spec:</strong> em modo leitura, o agente faz até 7 perguntas e depois escreve <code>docs/specs/PROJ-123-slug.md</code>. A intenção pode ser o primeiro parágrafo da spec.</li>' +
          '<li><strong>Você aprova a spec</strong> (<code>status: aprovada</code>). Sem isso, não há código.</li>' +
          '<li><strong>Plano em modo leitura:</strong> arquivos, passos, rollback. Em algo pequeno, 5 a 8 linhas na própria spec.</li>' +
          '<li><strong>Implementar em branch</strong> <code>feat/PROJ-123-slug</code> (ou worktree): teste primeiro, código mínimo, <code>make check</code>, commit <code>PROJ-123: ...</code>.</li>' +
          '<li><strong>Verificação:</strong> <code>make check</code> verde, critérios cobertos por teste, teste manual em dev quando houver interface.</li>' +
          '<li><strong>PR</strong> com o template; revisão por agente separado (<code>REVIEW.md</code>) e por uma pessoa. Depois, merge e deploy dev, cert, prod pela esteira.</li>' +
          '</ol>' +
          '<p>O passo que mais evita retrabalho é o das <strong>perguntas de esclarecimento</strong>: o agente expõe as ambiguidades antes de decidi-las sozinho. Veja o questionário anti-ambiguidade rodando.</p>' },
        { tipo: 'rode', id: 'fluxo-perguntas', titulo: 'Rode o questionário anti-ambiguidade', enunciado: 'Peça ao agente a spec de uma validação de CNPJ. Ele para nas perguntas, espera você e só então escreve.',
          prefixo: 'Prompt', entrada: 'PROJ-123: validar o CNPJ no cadastro de investidor. Siga prompts/nova-feature.md, etapa 1', unidade: 'min', terminalTitulo: 'agente (modo leitura)', etapas: perguntas(),
          tutorAntes: 'Aperte Enter e conte as perguntas. Cada uma é uma decisão que, sem ela, o agente tomaria por você.',
          tutorDepois: 'Sete perguntas, sete respostas suas, uma spec. Com as respostas no arquivo, a sessão seguinte não refaz a decisão diferente.',
          callout: 'Spec escrita a partir de respostas humanas, não de suposições.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Pode encurtar e não pode', html:
          '<strong>Pode encurtar:</strong> fundir intenção e spec; dispensar ADR; plano de poucas linhas; um único PR. <strong>Não encurte:</strong> critérios verificáveis, teste, <code>make check</code>, revisão por outra pessoa. <strong>Pronto quando:</strong> todos os critérios têm teste verde, o CI está verde, a spec está com <code>status: implementada</code> e o PR foi aprovado por quem não escreveu.' },
        { tipo: 'texto', html:
          '<h3>Bug: do sintoma à causa raiz</h3>' +
          '<ol>' +
          '<li><strong>Jira:</strong> ambiente, versão, passos, esperado x obtido, impacto, severidade (<code>jira/bug.md</code>).</li>' +
          '<li><strong>Branch</strong> <code>fix/PROJ-456-slug</code>. Os hooks passam a proibir alteração de testes existentes: só se <em>adiciona</em> o teste novo.</li>' +
          '<li><strong>Reproduzir:</strong> o agente escreve o teste mais baixo possível que falha <em>pelo motivo do ticket</em> e mostra a saída. Falha por outro motivo é falso positivo.</li>' +
          '<li><strong>Diagnosticar:</strong> 2 a 3 hipóteses de causa raiz, com evidência a favor e contra (<code>git log -S</code>, <code>git blame</code>, logs). Você escolhe; o agente tende a tratar o sintoma.</li>' +
          '<li><strong>Corrigir</strong> com a menor mudança; <code>make check</code>. Depois, <strong>procurar irmãos</strong>: o agente lista, não corrige sem pedir.</li>' +
          '<li><strong>PR</strong> com causa raiz, correção, risco, validação em cert e rollback. Em S1, hotfix pela esteira normal com aprovação acelerada, nunca por fora dela.</li>' +
          '<li><strong>Aprendizado:</strong> se a causa foi regra implícita, vira linha na spec, no runbook ou no <code>AGENTS.md</code>.</li>' +
          '</ol>' +
          '<p>Não há spec nem plano formais: o teste de reprodução <em>é</em> a spec. Corrigir sem reproduzir é chute com aparência de trabalho.</p>' },
        { tipo: 'takeaway', html: 'Feature funde <mark>intenção e spec</mark> e começa pelas perguntas; bug troca a spec por um <mark>teste que falha</mark>.' }
      ] },

      { rotulo: 'Módulo grande e upgrade', blocos: [
        { tipo: 'texto', html:
          '<h3>Módulo grande (semanas, vários PRs)</h3>' +
          '<p>Um prédio não se constrói num dia só: faz-se o andar-modelo primeiro. Aqui, o equivalente é o <strong>esqueleto andante</strong>: a primeira fatia atravessa todas as camadas com o mínimo e valida a premissa mais perigosa. Uma forma prática de nomear o corte é V1 (o esqueleto andante, funcionando atrás de flag) e V2 (o resto das fatias, com valor testável cada uma).</p>' +
          '<ol>' +
          '<li><strong>Jira:</strong> épico <code>PROJ-200</code>, com histórias filhas criadas <em>depois</em> do fatiamento.</li>' +
          '<li><strong>Intenção completa</strong> em <code>docs/intent/PROJ-200-slug.md</code>: problema, resultado, restrições (janela de mudança, on-premise, compliance), riscos. Você escreve o núcleo; o agente pergunta e completa.</li>' +
          '<li><strong>Alternativas de desenho:</strong> 2 a 3, com trade-offs. Você decide e registra em <code>docs/adr/ADR-NNN-slug.md</code>. É o ponto de maior alavancagem humana.</li>' +
          '<li><strong>Fatiamento vertical:</strong> cada fatia entrega valor testável e cabe em um PR revisável (cerca de 400 linhas).</li>' +
          '<li><strong>Por fatia:</strong> o ciclo da feature pequena, com branch ou worktree próprio.</li>' +
          '<li><strong>Flags</strong> para integrar cedo sem expor: código incompleto entra na <code>main</code> desligado.</li>' +
          '<li><strong>Plano mestre</strong> em <code>docs/plans/PROJ-200-mestre.md</code> com o checklist das fatias e as decisões pendentes; <code>docs/architecture.md</code> é atualizado a cada fatia.</li>' +
          '<li><strong>Prontidão operacional:</strong> runbook, métricas e rollback ensaiado em cert antes da última fatia.</li>' +
          '</ol>' +
          '<p>Pouco se encurta: otimiza-se o <em>tamanho</em> de cada PR, não a presença das etapas. Não encurte ADR, esqueleto andante e plano mestre.</p>' +
          '<h3>Manutenção, upgrade de versão, refatoração</h3>' +
          '<p>O comportamento externo <em>não pode mudar</em>. O artefato central é o <strong>invariante</strong>: a frase que diz o que deve permanecer igual (por exemplo, "nenhuma mudança de contrato HTTP nem de saída dos relatórios").</p>' +
          '<ol>' +
          '<li>Ticket com objetivo (.NET 6 para 8, trocar biblioteca, quebrar classe gigante) e o invariante escrito.</li>' +
          '<li><strong>Rede de segurança:</strong> testes de caracterização do que será tocado. Sem eles, não comece.</li>' +
          '<li><strong>Passos reversíveis:</strong> um <em>tipo</em> de mudança por PR (primeiro o SDK, depois APIs obsoletas, depois funcionalidades novas). Nunca misture refatoração com mudança de comportamento.</li>' +
          '<li><strong>Por lote:</strong> transformação mecânica em grupo de arquivos, <code>make check</code> a cada lote, commits pequenos para permitir <code>git bisect</code>.</li>' +
          '<li><strong>Comparar antes x depois:</strong> testes, saídas de relatórios, desempenho, diff de contratos de API. Cert com carga representativa, prod gradual e rollback pronto.</li>' +
          '</ol>' },
        { tipo: 'abas', rotulo: 'Prompt-modelo', itens: [
          { rotulo: 'Feature pequena', blocos: [{ tipo: 'codigo', linguagem: 'text', texto: 'Ticket: PROJ-123 (texto abaixo). Leia AGENTS.md e docs/ relevantes.\nTrabalhe em etapas e PARE ao fim de cada uma.\n1) Modo leitura: faça até 7 perguntas de esclarecimento; depois escreva\n   docs/specs/PROJ-123-slug.md (critérios Dado/Quando/Então, bordas, fora do escopo).\n2) Após minha aprovação: plano curto (arquivos, passos, rollback).\n3) Após aprovação do plano: branch feat/PROJ-123-slug; por passo: teste, código mínimo,\n   make check, commit "PROJ-123: ...".\n4) Feche: atualize docs/CHANGELOG e descreva o PR citando cada critério e seu teste.\nNão faça nada fora do escopo da spec.' }] },
          { rotulo: 'Bug', blocos: [{ tipo: 'codigo', linguagem: 'text', texto: 'Bug PROJ-456 (sintoma, ambiente, passos, logs abaixo). Branch fix/PROJ-456-slug.\nRegra: NÃO altere testes existentes; só adicione.\n1) Escreva o teste que FALHA pelo motivo descrito e mostre a saída. Não conseguiu? Pare e diga o que falta.\n2) Liste 2-3 hipóteses de causa raiz com evidência. Aguarde minha escolha.\n3) Corrija a causa com a menor mudança. Rode make check.\n4) Busque o mesmo padrão em outros lugares; liste, não corrija.\n5) Escreva a nota do PR: causa raiz, correção, risco, validação em cert, rollback.' }] },
          { rotulo: 'Módulo grande', blocos: [{ tipo: 'codigo', linguagem: 'text', texto: 'Épico PROJ-200. Leia AGENTS.md, docs/architecture.md, ADRs existentes.\nFase A (leitura, sem código): escreva docs/intent/PROJ-200-slug.md; proponha 2-3 desenhos com\ntrade-offs e recomende um; após minha decisão, registre o ADR.\nFase B: fatie em entregas verticais (valor testável, ~400 linhas, ordenadas por risco),\ncom história Jira para cada uma.\nFase C: por fatia, repita o ciclo de nova-feature.md. Atualize architecture.md e o plano mestre.\nPare ao fim de cada fase.' }] },
          { rotulo: 'Upgrade', blocos: [{ tipo: 'codigo', linguagem: 'text', texto: 'Objetivo: [ex. migrar para .NET 8]. Invariante: nenhuma mudança de contrato HTTP nem de saída dos relatórios.\n1) Em leitura: liste o que será afetado (projetos, pacotes, APIs obsoletas) e proponha uma sequência\n   de PRs, cada um de UM tipo de mudança, reversível.\n2) Antes de mudar: confirme que existem testes que protegem o invariante; se faltar, proponha os de caracterização.\n3) Execute um PR por vez; make check a cada lote; pare ao fim de cada PR.\n4) Entregue a comparação antes x depois e a lista de riscos residuais.' }] }
        ] },
        { tipo: 'chat', id: 'fluxo-chat', titulo: 'Qual prompt para qual trabalho?',
          enunciado: 'Quatro pedidos chegam ao agente. Em cada um, escolha o prompt que o conduz do jeito certo. Só avança com a escolha boa.',
          rodadas: [
            { agente: 'Pedido 1: adicionar um campo "observação" ao cadastro, cabe num PR. Como você quer que eu comece?', opcoes: [
              { texto: 'Faça até 7 perguntas de esclarecimento em modo leitura, escreva a spec com Dado/Quando/Então e pare para eu aprovar.', boa: true, resposta: 'Fiz 5 perguntas, escrevi a spec em docs/specs e estou parado esperando você mudar o status para aprovada.', porque: 'em feature pequena, a spec curta com critérios verificáveis e a parada de aprovação é o que não se encurta.' },
              { texto: 'Implemente direto, é simples.', boa: false, resposta: 'Implementei. Assumi que a observação é opcional e tem 255 caracteres. Está certo?', porque: 'sem critérios, as suposições do agente viram requisito sem ninguém ter decidido.' },
              { texto: 'Proponha três desenhos de arquitetura com ADR.', boa: false, resposta: 'Escrevi o ADR. Para um campo de texto, o documento ficou maior que o código.', porque: 'ADR e alternativas são do módulo grande. Aqui seria desperdício de um dia.' }
            ] },
            { agente: 'Pedido 2: o ticket PROJ-456 diz que um pedido do último dia some do filtro por data. Qual o seu prompt?', opcoes: [
              { texto: 'Escreva o teste que falha pelo motivo do ticket, mostre a falha, liste hipóteses de causa raiz e espere minha escolha. Não altere testes existentes.', boa: true, resposta: 'Teste criado, falha com "esperado 3, obtido 2". Duas hipóteses com evidência. Aguardo você escolher.', porque: 'o teste de reprodução é a spec do bug, e escolher a causa evita o agente tratar o sintoma.' },
              { texto: 'Corrija o filtro; a causa é óbvia.', boa: false, resposta: 'Troquei o operador e fiz o teste existente passar editando o valor esperado.', porque: 'sem reprodução você não sabe se corrigiu a causa, e editar teste existente apaga a evidência.' },
              { texto: 'Escreva uma spec completa e um plano antes de olhar o código.', boa: false, resposta: 'Escrevi uma spec de um comportamento que ainda não reproduzi.', porque: 'em bug não há spec nem plano formais. O teste de reprodução é a spec.' }
            ] },
            { agente: 'Pedido 3: um módulo novo de conciliação, várias semanas, com Durable Functions e API. Por onde começo?', opcoes: [
              { texto: 'Fase A em leitura: intenção, 2 a 3 desenhos com trade-offs e ADR. Fase B: fatias verticais de cerca de 400 linhas, a primeira como esqueleto andante. Pare ao fim de cada fase.', boa: true, resposta: 'Fase A pronta: intenção e 3 desenhos. Aguardo sua decisão para registrar o ADR antes de fatiar.', porque: 'o erro de desenho custa mais quanto maior o módulo; é lá que a atenção humana rende mais.' },
              { texto: 'Gere o módulo inteiro numa sessão e revise no fim.', boa: false, resposta: 'Gerei 6.000 linhas. O PR é irrevisável e o desenho já está cristalizado.', porque: 'PR gigante não se revisa, e o desenho errado só aparece depois de tudo pronto.' },
              { texto: 'Comece pela tela; o back-end a gente vê depois.', boa: false, resposta: 'A tela ficou pronta, mas a premissa mais perigosa (a integração) ainda não foi testada.', porque: 'a primeira fatia deve atravessar todas as camadas e validar a premissa de maior risco.' }
            ] },
            { agente: 'Pedido 4: subir o backend de .NET 6 para 8 sem mudar o comportamento. O que peço?', opcoes: [
              { texto: 'Declare o invariante, confirme os testes de caracterização e faça um PR por tipo de mudança, reversível, com make check por lote.', boa: true, resposta: 'Invariante: contrato HTTP e saída dos relatórios idênticos. Faltam testes em 2 áreas; proponho os de caracterização antes do primeiro PR.', porque: 'o invariante e a cerca de testes tornam cada passo reversível e comparável antes x depois.' },
              { texto: 'Faça o upgrade e aproveite para refatorar e corrigir o que encontrar.', boa: false, resposta: 'Fiz tudo num PR. Um relatório mudou de valor e não sei qual das três mudanças causou.', porque: 'misturar tipos de mudança destrói a capacidade de reverter e isolar regressões.' },
              { texto: 'Escreva uma spec funcional do que muda para o usuário.', boa: false, resposta: 'Não há nada que mude para o usuário, então a spec ficou vazia.', porque: 'em upgrade não há comportamento novo. Vale o invariante, não a spec funcional.' }
            ] }
          ],
          tutorDepois: 'Mesmo ciclo, pesos diferentes: feature pelas perguntas, bug pelo teste, módulo pelo desenho, upgrade pelo invariante.' },
        { tipo: 'takeaway', html: 'Módulo grande investe em <mark>desenho e fatiamento</mark>; upgrade vive do <mark>invariante</mark> e da caracterização.' }
      ] },

      { rotulo: 'Quebrar e conferir', blocos: [
        { tipo: 'texto', html:
          '<p>A regra do bug em uma frase: <strong>sem teste que falha primeiro, não existe correção, existe palpite</strong>. Escolha uma falha, rode, e depois rode sem falha para fechar o exercício.</p>' },
        { tipo: 'quebre', id: 'fluxo-quebre', titulo: 'Corrija o bug sem teste que falha primeiro', enunciado: 'Escolha o atalho, envie o ticket e observe onde o problema aparece.',
          prefixo: 'Prompt', entrada: 'PROJ-456: pedido do último dia some do filtro por data. Corrija', unidade: 'min', terminalTitulo: 'agente', etapas: bugEtapas(),
          tutorAntes: 'Escolha "Pular o teste que falha", aperte Enter e leia o terminal. Depois tente a outra falha e, por fim, rode sem falha.',
          tutorDepois: 'Com o teste primeiro, o ticket tem prova de que foi resolvido: o teste falha antes e passa depois, sem tocar nos antigos.',
          callout: 'Você viu os dois atalhos falharem e o fluxo completo funcionar.',
          falhas: [
            { id: 'sem-teste', rotulo: 'Pular o teste que falha', efeito: { etapaFalha: 'repro', linhasErro: [
              'teste de reprodução pulado: "a causa é óbvia"',
              { kind: 'info', text: 'agente: o problema deve ser o fuso horário; vou ajustar a conversão' },
              { kind: 'info', text: 'edit src/filtro.py (+4 -1)' },
              { kind: 'cmd', text: 'make test' },
              { kind: 'in', text: '12 passed' },
              { kind: 'in', text: 'PR aberto: "corrige fuso horário no filtro"' },
              'em cert, o pedido do último dia continua sumindo'
            ], tutor: 'sem um teste que falhe pelo motivo do ticket, o agente corrigiu a hipótese errada (fuso) e os testes antigos passaram porque nunca cobriram o caso. O bug volta e o PR leva o nome de uma causa que não existia.' } },
            { id: 'editar-teste', rotulo: 'Editar teste existente para passar', efeito: { etapaFalha: 'fix', linhasErro: [
              { kind: 'cmd', text: 'make test' },
              { kind: 'out', text: '1 failed: test_filtro_intervalo (esperado 3, obtido 2)' },
              { kind: 'info', text: 'agente: o teste antigo está desatualizado; vou ajustar o valor esperado' },
              { kind: 'info', text: 'edit tests/test_filtro.py (+1 -1)' },
              { kind: 'in', text: '13 passed' },
              'scripts/hooks/block_test_edits_in_fix.py: edição de teste existente bloqueada em fix/'
            ], tutor: 'o teste antigo era a evidência do comportamento. Editá-lo para ficar verde apaga a prova do bug. Em branch fix/, o hook recusa: só se adiciona teste novo.' } }
          ] },
        { tipo: 'escolha', id: 'fluxo-bug', titulo: 'Confira: a causa é "óbvia"',
          pergunta: 'No bug, o agente propõe corrigir direto porque "a causa é óbvia". O que você faz?',
          opcoes: [
            { id: 'a', texto: 'Aceito: bug óbvio dispensa teste.', correta: false, porque: 'sem reprodução você não sabe se corrigiu a causa ou outra coisa, e o bug volta.' },
            { id: 'b', texto: 'Exijo primeiro o teste que falha pelo motivo do ticket, depois a correção e a prova de que ele passa.', correta: true, porque: 'o teste que falha antes e passa depois é a evidência de que a causa certa foi tratada.' },
            { id: 'c', texto: 'Peço que reescreva o teste existente para refletir o novo comportamento.', correta: false, porque: 'é o erro clássico: alterar teste existente para "passar" apaga a evidência. Por isso o hook bloqueia isso em fix/.' }
          ], tutorDepois: 'Reproduza primeiro, corrija depois.' },
        { tipo: 'escolha', id: 'fluxo-upgrade', titulo: 'Confira: o PR de upgrade',
          pergunta: 'Numa atualização de versão do framework, qual PR é o mais seguro?',
          opcoes: [
            { id: 'a', texto: 'Um PR gigante com upgrade, refatoração e funcionalidades novas, revisado numa tarde.', correta: false, porque: 'revisar isso numa tarde é revisar nada, e não há como reverter só uma parte.' },
            { id: 'b', texto: 'Vários PRs que misturam upgrade e correção de bugs encontrados no caminho.', correta: false, porque: 'misturar tipos de mudança isola mal as regressões. Bugs achados no caminho viram tickets próprios.' },
            { id: 'c', texto: 'PRs separados por tipo de mudança, cada um reversível e coberto por testes de caracterização.', correta: true, porque: 'um tipo de mudança por PR preserva a capacidade de reverter e de isolar regressões.' }
          ], tutorDepois: 'Um tipo de mudança por PR.' },
        { tipo: 'escolha', id: 'fluxo-modulo', titulo: 'Confira: o que não se encurta',
          pergunta: 'Qual etapa de um módulo grande NÃO se encurta, mesmo com pressa?',
          opcoes: [
            { id: 'a', texto: 'A decisão de desenho registrada em ADR e o esqueleto andante.', correta: true, porque: 'o erro de desenho custa mais quanto maior o módulo; é lá que a atenção humana rende mais.' },
            { id: 'b', texto: 'O nome da branch.', correta: false, porque: 'o nome da branch é convenção barata, não decisão cara.' },
            { id: 'c', texto: 'A formatação da spec.', correta: false, porque: 'formato é detalhe. O conteúdo verificável é o que importa.' }
          ], tutorDepois: 'Pressa corta formato, nunca desenho.' },
        { tipo: 'ordene', id: 'fluxo-ordene', titulo: 'Ordene o ciclo de uma feature',
          enunciado: 'Coloque as ações na ordem em que acontecem num fluxo bem conduzido.',
          itens: [
            { id: 'd', texto: 'Implementar passo a passo, <code>make check</code> a cada passo' },
            { id: 'a', texto: 'Abrir o ticket no Jira com critérios de aceite' },
            { id: 'f', texto: 'Revisão por agente separado e por humano, depois merge' },
            { id: 'c', texto: 'Plano em modo leitura aprovado' },
            { id: 'b', texto: 'Spec escrita e aprovada' },
            { id: 'e', texto: 'PR com template preenchido e documentação no mesmo PR' }
          ], solucao: ['a', 'b', 'c', 'd', 'e', 'f'], dica: 'O código só passa a existir depois de spec e plano aprovados.',
          tutorDepois: 'Ticket, spec, plano, código, PR, revisão: a decisão fica barata de revisar antes de o código existir.' },
        { tipo: 'takeaway', html: 'Em qualquer fluxo o agente <mark>trabalha em etapas com parada</mark> e o humano aprova <mark>spec, plano e PR</mark>.' }
      ] }
    ]
  });
})();
