/* M00 · Checkpoint: quatorze perguntas, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada. Fonte: M00.html#checkpoint-m00. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm00-checkpoint',
    titulo: 'Checkpoint M00',
    minutos: 50,
    resumo: 'Quatorze perguntas sobre o sistema de trabalho com IA, sem consulta. Responda depois de concluir o laboratório e demonstre quando a pergunta pedir uma evidência.',
    objetivo: 'Verificar, sem consulta, se você diagnostica a camada de uma falha, separa instrução de capability, explica uma fronteira de segurança, escolhe a peça certa por responsabilidade e compara harnesses sem confundir variáveis.',
    revisao: [
      { id: 'm00cp-camadas', pergunta: 'Um teste passa no notebook e falha no CI por pacote ausente. Qual é a primeira atitude correta?',
        opcoes: [
          opc('a', 'Diagnosticar a camada (aqui, o ambiente) antes de trocar o modelo', true, 'trocar de modelo antes de separar as camadas aumenta custo sem tocar na causa.'),
          opc('b', 'Trocar por um modelo maior', false, 'o patch não era o problema.'),
          opc('c', 'Reforçar o prompt', false, 'instrução não instala dependência.')] },
      { id: 'm00cp-env', pergunta: 'Por que a instrução “não leia .env” não é controle suficiente?',
        opcoes: [
          opc('a', 'Porque instrução diz o que gostaríamos; só a capability limita o que é tecnicamente possível', true, 'se o modelo trata dado como instrução, só a ausência da capability impede o vazamento.'),
          opc('b', 'Porque o modelo nunca lê instruções', false, 'lê, mas pode ser enganado por dado externo.'),
          opc('c', 'Porque o .env é grande demais', false, 'o tamanho não tem relação.')] },
      { id: 'm00cp-skill', pergunta: 'Instrução, skill, hook, delegate e MCP: qual é a responsabilidade do hook?',
        opcoes: [
          opc('a', 'Reação determinística a evento, como lint após edição ou bloqueio antes da tool', true, 'é a peça de enforcement; a skill ensina, o MCP dá acesso, o delegate separa a fronteira.'),
          opc('b', 'Conhecimento sob demanda', false, 'isso é a skill.'),
          opc('c', 'Protocolo entre host e capabilities', false, 'isso é o MCP.')] },
      { id: 'm00cp-mcp', pergunta: 'Que mudança da revisão MCP 2026-07-28 torna um tutorial antigo perigoso?',
        opcoes: [
          opc('a', 'O núcleo ficou stateless: sem handshake initialize/initialized nem header de sessão', true, 'material de 2024/2025 pode ensinar arquitetura que deixou de ser invariável.'),
          opc('b', 'O MCP passou a autorizar tools automaticamente', false, 'o MCP não cria autorização.'),
          opc('c', 'As tools passaram a ser escolhidas pelo usuário', false, 'quem controla a tool é o modelo, sujeito ao host e à policy.')] },
      { id: 'm00cp-comparar', pergunta: 'Como comparar dois harnesses sem confundir modelo, tarefa e ambiente?',
        opcoes: [
          opc('a', 'Fixar modelo e tarefa, variar só o harness, repetir cada tarefa pelo menos 3 vezes em configurações isoladas e registrar ameaças à validade', true, 'uma execução é anedota; estatística de evals fica para o M06.'),
          opc('b', 'Rodar uma vez cada e escolher o que passou', false, 'é anedota.'),
          opc('c', 'Variar modelo e harness ao mesmo tempo para ganhar tempo', false, 'não dá para atribuir a diferença a nenhum dos dois.')] }
    ],
    abas: [
      { rotulo: 'Sistema, workflow e contexto', blocos: [
        { tipo: 'texto', html:
          '<p>Faça esta avaliação depois de concluir o laboratório. Responda sem consultar e demonstre quando a pergunta pedir uma evidência. Cada pergunta traz a rubrica do que basta. Uma resposta decorada não compensa uma fronteira de segurança mal explicada. Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Quatro termos, uma falha', obrigatorio: false,
          enunciado: 'Diferencie modelo, cliente, harness e agente usando uma falha concreta. <em>Bloco 1.</em>',
          placeholder: 'A falha é… O modelo… O cliente… O harness… O agente…',
          rubrica: [
            'O <strong>modelo</strong> produz a saída e propõe; não executa nem aprova.',
            'O <strong>cliente</strong> mantém a conversa e envia requests (histórico).',
            'O <strong>harness</strong> escolhe instruções, contexto, tools, permissões, loop e evidência.',
            'O <strong>agente</strong> é o arranjo em que o modelo escolhe parte da próxima ação.',
            'Usa uma falha concreta e localiza a camada, em vez de “trocar o modelo”.'
          ],
          modelo: '<p>Um teste passa no notebook e falha no CI por falta de um pacote. O modelo apenas propôs o patch. O cliente enviou a tarefa e o histórico. O harness selecionou instruções, arquivos e tools e decidiu se havia instalação de dependência ou rede. O agente é o arranjo em que o modelo escolhe parte da próxima ação dentro desse harness. A falha está no ambiente, não no modelo: eu separaria as camadas antes de gastar com um modelo maior.</p>' + reprova('tratar tudo como “a IA errou” ou responder com definições sem uma falha concreta.') },

        { tipo: 'escolha', id: 'cp-esc-p2', titulo: 'P2 · “LLM é método puro”',
          pergunta: 'Por que “o LLM é um método puro” ajuda e em que ponto engana? <em>Bloco 1.</em>',
          opcoes: [
            { id: 'a', texto: 'Ajuda a perguntar “o que entrou nesta execução?” antes de atribuir memória ao modelo; engana porque a amostragem varia, serviços podem persistir ou resumir conversa e o harness pode acrescentar contexto sem exibi-lo.', correta: true, porque: 'é um modelo mental, não uma lei física: força a pergunta certa sem negar a variação e o estado fora do modelo.' },
            { id: 'b', texto: 'É literalmente verdade: o modelo é uma função pura e a mesma entrada dá sempre a mesma saída.', correta: false, porque: 'a amostragem pode produzir saídas diferentes para entradas iguais.' },
            { id: 'c', texto: 'É falso e deve ser abandonado, porque o modelo sempre guarda memória entre chamadas.', correta: false, porque: 'a hipótese é útil: o estado precisa viajar na entrada ou ser recuperado de forma controlada.' }
          ], tutorDepois: 'Use o modelo mental para auditar a entrada, sem esquecer a amostragem e o estado do harness.' },

        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Workflow e autonomia limitada', obrigatorio: false,
          enunciado: 'Dê um caso que exige workflow e outro que justifica autonomia limitada. <em>Bloco 1.</em>',
          placeholder: 'Workflow: … porque … Autonomia limitada: … com limite …',
          rubrica: [
            'Caso de <strong>workflow</strong> com etapas conhecidas ou efeito caro (por exemplo, elegibilidade de reembolso por política escrita).',
            'Justifica pela <strong>incerteza</strong> e pelo <strong>custo do erro</strong>, não por “a IA consegue”.',
            'Caso de <strong>autonomia limitada</strong> com caminho incerto e ação reversível (por exemplo, investigar um teste que falha, só leitura).',
            'Nomeia o <strong>verificador</strong> e a <strong>condição de parada</strong>.'
          ],
          modelo: '<p>Elegibilidade de reembolso por política escrita exige workflow: as condições são explícitas e o efeito é financeiro, então o código aplica as regras versionadas e encaminha exceções para aprovação humana. Investigar um teste que falha em repositório desconhecido justifica autonomia limitada: o caminho é incerto, mas leitura é reversível; o agente reúne evidências e propõe a causa, o workflow executa só os testes permitidos, o verificador é a reprodução do erro e a parada é a falta de evidência suficiente.</p>' + reprova('justificar com “porque a IA consegue”.') },

        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · AGENTS.md ou skill', obrigatorio: false,
          enunciado: 'O que pertence ao <code>AGENTS.md</code> e o que deve virar skill? <em>Bloco 2.</em>',
          placeholder: 'No AGENTS.md: … Na skill: … Porque…',
          rubrica: [
            '<code>AGENTS.md</code>: o que <strong>quase toda tarefa</strong> precisa (comandos verificados, restrições não óbvias, critérios de conclusão, onde estão docs e ADRs).',
            'Skill: procedimento <strong>pontual</strong>, carregado <strong>sob demanda</strong> (por exemplo, revisão de concorrência).',
            'Comandos <strong>executados e confirmados</strong>: instrução sem verificação vira boato automatizado.',
            'Não é autobiografia nem tutorial genérico.'
          ],
          modelo: '<p>No <code>AGENTS.md</code> ficam fatos de que quase toda tarefa precisa: o que o sistema faz e suas fronteiras, comandos de bootstrap, teste, lint e tipos já executados e confirmados, restrições não óbvias (“não editar migration publicada”), critérios de conclusão e onde estão os ADRs. Procedimentos pontuais, como revisão de concorrência, viram uma skill carregada sob demanda. Assim o contrato fica curto, cada regra tem origem rastreável e o arquivo não vira tutorial nem boato.</p>' + reprova('colocar o procedimento de concorrência em todo contexto, ou comandos que ninguém executou.') },

        { tipo: 'escolha', id: 'cp-esc-p5', titulo: 'P5 · Progressive disclosure',
          pergunta: 'Qual afirmação sobre progressive disclosure e custo residual de catálogo está correta? <em>Bloco 2.</em>',
          opcoes: [
            { id: 'a', texto: 'Metadados ficam no catálogo; as instruções da skill entram ao ativá-la; referências e scripts só quando necessários. O custo residual é o catálogo, que continua ocupando contexto.', correta: true, porque: 'separa o sempre necessário do sob demanda, sem fingir que o catálogo é grátis.' },
            { id: 'b', texto: 'A skill inteira, com referências e scripts, é carregada em toda sessão, e por isso não há custo residual.', correta: false, porque: 'é o oposto da divulgação progressiva.' },
            { id: 'c', texto: 'Uma skill com boa descrição dispara sempre, então o catálogo pode ser ignorado.', correta: false, porque: 'disparo automático nunca é garantia sem teste: produtos podem truncar catálogos ou exigir invocação explícita.' }
          ], tutorDepois: 'A descrição decide a candidatura da skill; o catálogo custa contexto mesmo quando nenhuma skill é ativada.' },
        { tipo: 'takeaway', html: 'Diagnostique a <mark>camada</mark>, escolha o desenho pelo <mark>custo do erro</mark> e mantenha o contrato <mark>curto e verificado</mark>.' }
      ] },

      { rotulo: 'Segurança e peças', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p6', titulo: 'P6 · “Não leia .env”',
          pergunta: 'Por que a instrução “não leia .env” não é controle suficiente? <em>Bloco 3.</em>',
          opcoes: [
            { id: 'a', texto: 'Instrução diz o que gostaríamos; se o modelo tratar dado como instrução, só a capability (sem leitura desse path nem rede) impede o vazamento.', correta: true, porque: 'a OWASP LLM01:2025 recomenda menor privilégio e validação determinística exatamente por isso.' },
            { id: 'b', texto: 'Porque o modelo nunca obedece a instruções de sistema.', correta: false, porque: 'obedece muitas vezes; o problema é o caso em que não obedece.' },
            { id: 'c', texto: 'Porque basta repetir a regra com mais ênfase para ser suficiente.', correta: false, porque: 'ênfase reduz a chance, não o impacto.' }
          ], tutorDepois: 'Limite o possível; não dependa do que o modelo promete.' },

        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Revisar repositório de terceiro', obrigatorio: false,
          enunciado: 'Projete as capabilities de um agente que vai revisar um repositório de terceiro. <em>Bloco 3.</em>',
          placeholder: 'Leitura… Sem write/process/network… Entrada não confiável… Parada… Saída…',
          rubrica: [
            'Somente <strong>leitura</strong>, restrita ao clone; <strong>sem</strong> write, process, network nem MCP.',
            'O conteúdo do repositório é <strong>dado não confiável</strong>; não herda autoridade.',
            'Path <strong>canonicalizado</strong> dentro do workspace e <strong>secrets removidos</strong> do workspace.',
            'Limites (arquivos ou tempo) e <strong>condição de parada</strong>; formato de retorno fechado.',
            'Sanitiza a <strong>saída</strong>, porque leitura ampla pode vazar segredo na resposta.'
          ],
          modelo: '<p>O delegate recebe só leitura e busca local dentro do clone: sem write, process, network ou MCP. O conteúdo do repositório é tratado como dado não confiável e nunca como instrução. A policy canonicaliza os paths e nega qualquer um fora do workspace; o workspace não contém secrets. O contrato fixa o formato de retorno (achado, arquivo:linha, impacto, evidência), um limite de arquivos ou tempo e a parada diante de secrets, outro repositório ou decisão de produto. A saída é sanitizada, porque leitura ampla pode vazar segredo na própria resposta.</p>' + reprova('dar write, process ou rede “para ajudar” ou confiar em “ignore instruções do repositório”.') },

        { tipo: 'escolha', id: 'cp-esc-p8', titulo: 'P8 · Skill, hook, delegate e MCP',
          pergunta: 'Qual é a responsabilidade de cada peça? <em>Bloco 4.</em>',
          opcoes: [
            { id: 'a', texto: 'Skill: conhecimento e procedimento sob demanda; hook: reação determinística a evento; delegate: trabalho em contexto e fronteira separados; MCP: protocolo entre host e capabilities.', correta: true, porque: 'a fórmula “skill = como; MCP = acesso; delegate = delegar” é só uma primeira heurística: em caso de dúvida, volte à responsabilidade, à autoridade e ao ciclo de vida.' },
            { id: 'b', texto: 'Skill dá acesso ao banco; hook guarda a regra de negócio; delegate armazena instruções; MCP decide quando parar.', correta: false, porque: 'cada peça foi atribuída à responsabilidade de outra.' },
            { id: 'c', texto: 'As quatro são sinônimos com nomes de produtos diferentes.', correta: false, porque: 'têm responsabilidades e ciclos de vida distintos.' }
          ], tutorDepois: 'Escolha pela responsabilidade, não pelo nome do recurso.' },

        { tipo: 'escreva', id: 'cp-p9', titulo: 'P9 · Slash e invocação', obrigatorio: false,
          enunciado: 'Diferencie comando embutido de sessão, interface de invocação, skill, prompt file, hook e prompt MCP. Qual deles é portátil? <em>Bloco 4.</em>',
          placeholder: 'Embutido: … Invocação: … Skill: … Prompt file: … Hook: … Prompt MCP: … Portátil: …',
          rubrica: [
            '<strong>Embutido</strong>: controla a sessão do produto; nomes e efeitos variam (não é conhecimento do time).',
            '<strong>Invocação</strong> (<code>/nome</code>, <code>$nome</code>, menu): affordance de interface, sem semântica universal.',
            '<strong>Skill</strong>: procedimento compartilhável, núcleo Agent Skills.',
            '<strong>Prompt file</strong>: formato legado e específico do produto (baixa portabilidade).',
            '<strong>Hook</strong>: reação determinística a evento, específica do host.',
            '<strong>Prompt MCP</strong>: contrato MCP; a exposição na UI é decisão do host.',
            'O <strong>portátil</strong> é o contrato escrito como Agent Skill; o slash é adapter.'
          ],
          modelo: '<p>O comando embutido controla a sessão do produto e varia de cliente para cliente. A interface de invocação (<code>/nome</code>, <code>$nome</code>, menu) é só uma affordance, sem semântica universal. A skill é o procedimento compartilhável, com núcleo no padrão Agent Skills. O prompt file é um formato legado e específico do produto. O hook é uma reação determinística a evento, dependente do host. O prompt MCP segue o contrato MCP, mas a UI decide como expô-lo. O portátil é o workflow escrito como contrato e Agent Skill; o slash é um adapter de invocação.</p>' + reprova('dizer que “/review faz o mesmo em qualquer ferramenta”.') },

        { tipo: 'escreva', id: 'cp-p10', titulo: 'P10 · O diário que só propõe', obrigatorio: false,
          enunciado: 'Defenda por que <code>finish-study-block</code> propõe um patch de diário, mas não deve escrevê-lo nem criar commit sem aprovação. <em>Bloco 4.</em>',
          placeholder: 'O workflow lê… Escrita e commit são… O risco é…',
          rubrica: [
            'O workflow só <strong>lê e sintetiza</strong>; saída é <code>proposed_diary_patch</code>, com <code>writes: []</code>.',
            'Escrita no diário e operações Git são <strong>efeitos separados</strong> que exigem <strong>aprovação</strong>.',
            'Nenhuma automação deve registrar <strong>aprendizado que não ocorreu</strong>.',
            'Regeneração editorial nunca altera progresso de estudo; invocação <strong>só pelo usuário</strong>.'
          ],
          modelo: '<p>O contrato lê o progresso, o git log e o diff e produz só propostas: um patch de diário, uma mensagem de commit e o próximo passo, com <code>writes: []</code>. Escrever o progresso, fazer stage e commitar são efeitos separados, e o contrato exige aprovação antes de cada um. Isso preserva a regra do curso: o progresso de estudo registra aprendizado real, e nenhuma automação pode registrar o que não ocorreu. Por isso a invocação é só do usuário e a execução para se o <code>block_id</code> ou a fonte de progresso faltarem.</p>' + reprova('deixar o agente escrever e commitar porque “é só o diário”.') },
        { tipo: 'takeaway', html: 'Segurança é <mark>capability</mark> e <mark>aprovação</mark>; o workflow portátil <mark>propõe</mark>, e o slash é adapter.' }
      ] },

      { rotulo: 'MCP, laboratório e avaliação', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p11', titulo: 'P11 · Quem controla prompt, resource e tool',
          pergunta: 'No MCP, quem controla o uso de prompt, resource e tool? <em>Bloco 4.</em>',
          opcoes: [
            { id: 'a', texto: 'Prompt: o usuário. Resource: a aplicação ou host. Tool: o modelo, sujeito ao host e à policy.', correta: true, porque: 'é a tabela das três primitivas: cada uma tem um controlador diferente.' },
            { id: 'b', texto: 'O modelo controla as três, sem restrição do host.', correta: false, porque: 'a tool fica sujeita ao host e à policy; prompt e resource não são do modelo.' },
            { id: 'c', texto: 'O servidor decide sozinho, porque é ele que as expõe.', correta: false, porque: 'expor uma primitiva não é decidir quem a usa.' }
          ], tutorDepois: 'Controlador diferente por primitiva: usuário, host e modelo (com policy).' },
        { tipo: 'escolha', id: 'cp-esc-p12', titulo: 'P12 · A revisão MCP 2026-07-28',
          pergunta: 'Que mudança da revisão MCP 2026-07-28 torna um tutorial antigo perigoso? <em>Bloco 4.</em>',
          opcoes: [
            { id: 'a', texto: 'O núcleo ficou stateless: sem handshake initialize/initialized nem header de sessão; cada requisição carrega o necessário. Tutoriais de 2024/2025 podem ensinar arquitetura que deixou de valer.', correta: true, porque: 'a revisão também introduziu descoberta opcional e mecanismos para múltiplos round-trips.' },
            { id: 'b', texto: 'O MCP passou a autenticar e autorizar cada tool.', correta: false, porque: 'o MCP não cria autorização.' },
            { id: 'c', texto: 'As tools deixaram de ter schema.', correta: false, porque: 'o protocolo continua padronizando mensagens e schemas.' }
          ], tutorDepois: 'Revalide especificação, SDK e documentação do host antes de executar material antigo.' },

        { tipo: 'escreva', id: 'cp-p13', titulo: 'P13 · Interpretar um DENY', obrigatorio: false,
          enunciado: 'A policy do laboratório devolveu <code>DENY_PATH_ESCAPE</code> para uma leitura legítima do usuário. Interprete o código sem propor afrouxar a policy. <em>Bloco 3 e laboratório.</em>',
          placeholder: 'O código diz… A regra que o gerou… Eu investigaria… Não afrouxaria porque…',
          rubrica: [
            'O código nomeia a <strong>regra de fronteira</strong>: o alvo <strong>resolve fora do workspace</strong>.',
            'Verifica o <strong>path canonicalizado</strong> e o workspace configurado (por exemplo, <code>..</code>, link simbólico ou raiz errada).',
            'Corrige o <strong>pedido, o path ou o escopo</strong>; se o acesso for legítimo, amplia o workspace por <strong>decisão explícita e registrada</strong>.',
            'Não afrouxa a policy nem adiciona exceção para “fazer passar”.',
            'Registra o código de decisão como <strong>evidência</strong>.'
          ],
          modelo: '<p><code>DENY_PATH_ESCAPE</code> diz que o alvo, depois de canonicalizado, resolve fora do workspace. Eu olharia o path resolvido e o workspace configurado: um <code>..</code>, um link simbólico ou a raiz errada. Se o arquivo é mesmo necessário, corrijo o pedido ou o escopo, ou amplio o workspace por uma decisão explícita e registrada, nunca abrindo uma exceção na policy para passar. O código de decisão entra no relato como evidência da fronteira funcionando.</p>' + reprova('“adicione uma exceção” ou “desligue a policy”.') },

        { tipo: 'escreva', id: 'cp-p14', titulo: 'P14 · Comparar dois harnesses', obrigatorio: false,
          enunciado: 'Mostre como compararia dois harnesses sem confundir modelo, tarefa e ambiente. <em>Bloco 5.</em>',
          placeholder: 'Fixo… Varia… Tarefas e repetições… Métricas… Ameaças à validade…',
          rubrica: [
            'Fixa <strong>modelo</strong> e <strong>tarefa</strong> ao comparar harness (e o inverso ao comparar modelo).',
            'Pelo menos <strong>3 tarefas</strong>, <strong>3 repetições</strong> cada, em <strong>duas configurações isoladas</strong>.',
            'Métricas: correção, intervenções, escopo, segurança, tempo e custo, citando as armadilhas.',
            'Registra <strong>ameaças à validade</strong> e não conclui “B é melhor” com uma amostra.',
            'Remete a evals estatísticas e datasets maiores ao <strong>M06</strong>.'
          ],
          modelo: '<p>Fixo modelo e tarefa e vario só o harness, em dois ambientes isolados. Monto três tarefas pequenas e repito cada uma pelo menos três vezes por configuração. Registro correção (testes e critérios de aceite), intervenções humanas, escopo do diff, violações de capability, tempo até a evidência verde e custo quando disponível, cuidando das armadilhas de cada métrica. Anoto as ameaças à validade, como amostra pequena e caches diferentes, e não concluo “B é melhor” com poucas execuções; estatística de evals fica para o M06.</p>' + reprova('uma execução por configuração ou trocar modelo e harness ao mesmo tempo.') },

        { tipo: 'texto', html:
          '<h3>Entregáveis para o checkpoint</h3>' +
          '<ul><li>contrato, contexto e policy reconstruídos na cópia de trabalho e validados;</li>' +
          '<li>três casos negativos interpretados pela regra que os bloqueia;</li>' +
          '<li><code>AGENTS.md</code>, skill e task contract de uma mudança pequena;</li>' +
          '<li>dois adapters mínimos sem duplicação do núcleo, quando dois hosts estiverem disponíveis;</li>' +
          '<li>scorecard de duas configurações com três repetições e um ADR datado.</li></ul>' },
        { tipo: 'texto', html: '<p class="ta-nota">Estado verificado em 15/08/2026; fatos de produto têm alto risco de obsolescência (revalidar em até 90 dias). Antes de executar MCP ou instruções de produto após esse prazo, confira a revisão da especificação, a linha estável do SDK e a documentação do host.</p>' },
        { tipo: 'takeaway', html: 'Interprete o <mark>código de decisão</mark> sem afrouxar a policy e compare harnesses com <mark>repetições e isolamento</mark>.' }
      ] }
    ]
  });
})();
