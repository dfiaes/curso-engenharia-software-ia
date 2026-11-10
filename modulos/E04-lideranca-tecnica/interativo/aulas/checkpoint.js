/* E04 · Checkpoint: sete cenários, avaliação sem consulta. Fonte: E04.html#checkpoint. Rubrica = "Basta"; modelo = resposta esperada + "Reprova". */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'e04-checkpoint',
    titulo: 'Checkpoint E04',
    minutos: 50,
    resumo: 'Sete cenários de liderança técnica, sem consulta. Responda com as suas palavras; a rubrica diz o que basta e o modelo diz o que reprova.',
    objetivo: 'Verificar, sem consulta, se você sai do caminho crítico sem abdicar, fecha desacordos, revisa código de agente, promete prazo por percentil, dá feedback em SBI, conduz um piloto de IA e coordena um incidente.',
    revisao: [
      { id: 'e04cp-heroi', pergunta: 'Qual mecanismo tira o herói do caminho crítico?',
        opcoes: [
          opc('a', 'Listar as decisões que passam por ele, escrever regras de autonomia (reversibilidade e limite) e passar uma iniciativa real a um segundo líder, com métrica observável.', true, '"trabalhar mais" ou "treinar o time" sem mecanismo não mudam nada.'),
          opc('b', 'Trabalhar mais horas.', false, 'soma o rendimento de uma pessoa.'),
          opc('c', 'Treinar o time sem mudar quem decide.', false, 'sem mecanismo, o time continua esperando.')] },
      { id: 'e04cp-teste', pergunta: 'Qual a verificação mais barata num PR de agente com cobertura alta?',
        opcoes: [
          opc('a', 'Rodar o teste novo contra o código antigo: se passa, não prova nada.', true, 'agentes otimizam o sinal do gate.'),
          opc('b', 'Aprovar pela cobertura.', false, 'cobertura mede execução, não verificação.'),
          opc('c', 'Comentar só o estilo.', false, 'estilo é o último item da pilha.')] },
      { id: 'e04cp-prazo', pergunta: 'O gerente quer a soma dos prováveis como prazo. O que você oferece?',
        opcoes: [
          opc('a', 'Um percentil (P85 ou P95) com hipóteses, riscos separados, o limite de independência do modelo e opções de escopo com recomendação.', true, 'a distribuição é assimétrica; prometer a soma dos prováveis falha mais da metade das vezes.'),
          opc('b', '"Não dá."', false, 'um "não" seco encerra a conversa.'),
          opc('c', 'A soma dos prováveis, para agradar.', false, 'é uma promessa bem abaixo de 50% de se cumprir.')] },
      { id: 'e04cp-mandato', pergunta: 'A diretoria exige agentes para todos. Qual o caminho?',
        opcoes: [
          opc('a', 'Piloto com hipótese, grupo, duração, métricas de fluxo mais percepção e critério de parada definido antes; política mínima de dados; nenhuma métrica por pessoa.', true, 'troca oposição por patrocínio de um método.'),
          opc('b', 'Recusar sem alternativa.', false, 'não responde ao mandato.'),
          opc('c', 'Aceitar e medir linhas de código por pessoa.', false, 'com agentes, linhas mede quanto o agente digitou.')] },
      { id: 'e04cp-ic', pergunta: 'Num incidente de 52 minutos, o rascunho diz "erro humano". O que muda?',
        opcoes: [
          opc('a', 'O IC coordena e delega comunicação, mitiga antes de investigar e atualiza em cadência fixa; o postmortem lista causas contribuintes em camadas e ações com @dono, data e verificação.', true, 'se a prevenção depende de atenção humana, o sistema não mudou.'),
          opc('b', 'O IC corrige o sistema pessoalmente.', false, 'o IC coordena; resolvedores executam.'),
          opc('c', 'A ação passa a ser "tomar mais cuidado".', false, 'não tem dono, data nem verificação.')] }
    ],
    abas: [
      { rotulo: 'Pessoas e decisões', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que basta. Reprovar é permitido: volte ao bloco indicado e tente de novo. Esta aba cobre os blocos 1, 2 e 5.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: o diagnóstico',
          pergunta: 'Você é autor de 45% dos commits e o time não decide nada sem você. Qual o primeiro movimento?',
          opcoes: [
            { id: 'a', texto: 'Listar as decisões que passam por você e escrever a regra de autonomia de cada uma.', correta: true, porque: 'é o passo de tirar-se do caminho crítico com critério de reversibilidade e limite.' },
            { id: 'b', texto: 'Trabalhar mais horas.', correta: false, porque: 'soma o rendimento de uma pessoa; o ganho está na multiplicação.' },
            { id: 'c', texto: 'Parar de codar e sumir.', correta: false, porque: 'cair a zero com o time desacelerando é abdicação.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · O herói', obrigatorio: false,
          enunciado: 'Você é tech lead, autor de 45% dos commits, e o time não decide nada sem você. Descreva um plano de 60 dias. <em>Bloco 1.</em>',
          placeholder: 'Eu listaria as decisões que passam por mim… As regras de autonomia… O segundo líder… Mediria…',
          rubrica: [
            'Listar as <strong>decisões que passam por você</strong>.',
            '<strong>Regras de autonomia</strong> por escrito (reversibilidade e limite).',
            'Um <strong>segundo líder</strong> numa iniciativa real.',
            '<strong>Métrica observável</strong>: tempo até a primeira revisão, decisões tomadas sem você.'
          ],
          modelo: '<p>Na primeira quinzena listo as decisões que passam por mim (PR, biblioteca, prioridade de bug). Até o dia 40 escrevo para cada uma a regra: "decide sozinho se reversível em um dia e abaixo de X; me avise depois". Até o dia 60 passo uma iniciativa média a uma pessoa, de ponta a ponta, comigo como patrocinador e checkpoints. Meço o tempo até a primeira revisão e quantas decisões saem sem mim; minha parte dos commits cai para algo como 10 a 20%, com o time entregando.</p>' + reprova('"trabalhar mais" ou "treinar o time" sem mecanismo.') },

        { tipo: 'escolha', id: 'cp-esc-p2', titulo: 'P2 · Aquecimento: o desacordo',
          pergunta: 'Duas pessoas seniores discordam entre fila durável e chamada síncrona. Qual o primeiro passo?',
          opcoes: [
            { id: 'a', texto: 'Votar no grupo.', correta: false, porque: 'o voto dilui a decisão e não trata a origem do desacordo.' },
            { id: 'b', texto: 'Classificar a origem do desacordo (fato, valor ou risco) e verificar quanto custa reverter.', correta: true, porque: 'cada origem tem tratamento próprio, e a reversibilidade calibra o processo.' },
            { id: 'c', texto: 'Marcar mais uma reunião até o consenso.', correta: false, porque: 'review sem decisor termina em "vamos pensar mais".' }
          ] },
        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Desacordo', obrigatorio: false,
          enunciado: 'Duas pessoas seniores discordam sobre fila durável versus chamada síncrona, e a reunião não converge. Conduza até a decisão. <em>Bloco 2.</em>',
          placeholder: 'O desacordo vem de… O decisor é… A decisão é reversível?… Registro…',
          rubrica: [
            '<strong>Classificar</strong> o desacordo (fato, valor ou risco).',
            '<strong>Nomear o decisor</strong> e avaliar a reversibilidade.',
            'Definir um <strong>experimento</strong> ou decidir.',
            'Registrar a <strong>objeção</strong> e o <strong>sinal de revisão</strong>.',
            'Pedir "discordo e apoio" <strong>por escrito</strong>.'
          ],
          modelo: '<p>Pergunto de onde vem: é fato (3 dos 5 timeouts de setembro vieram de extratos grandes) e valor (latência versus robustez). O decisor nomeado ouve as duas posições, classifica a decisão como reversível com custo (um sprint) e decide pela fila durável. A objeção do Rafael fica no ADR com o sinal de revisão: se o p95 do fluxo normal passar de 800 ms, reabrimos. Cada um confirma por escrito até amanhã: "discordo e apoio", "concordo" ou um fato novo.</p>' + reprova('votar, ou decidir sem registrar a objeção.') },

        { tipo: 'escolha', id: 'cp-esc-p5', titulo: 'P5 · Aquecimento: o comportamento',
          pergunta: 'Qual é o melhor Comportamento em SBI para substituir "o Rafael é arrogante nas reviews"?',
          opcoes: [
            { id: 'a', texto: '"Você é arrogante com os colegas."', correta: false, porque: 'é rótulo, não observação.' },
            { id: 'b', texto: '"Na review de quinta, você interrompeu a Marina duas vezes antes de ela terminar o slide 3 e disse \'isso não vai funcionar\' sem citar o cenário."', correta: true, porque: 'é o que uma câmera registraria, sem adjetivo.' },
            { id: 'c', texto: '"Você sempre desqualifica o trabalho dos outros."', correta: false, porque: '"sempre" generaliza.' }
          ] },
        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Feedback', obrigatorio: false,
          enunciado: 'Reescreva "o Rafael é arrogante nas reviews" como SBI com Pedido e diga como entregar. <em>Bloco 5.</em>',
          placeholder: 'Situação… Comportamento… Impacto… Pedido…? Entrega: …',
          rubrica: [
            '<strong>Situação</strong> específica.',
            '<strong>Comportamento</strong> observável, sem adjetivo.',
            '<strong>Impacto</strong> concreto.',
            '<strong>Pedido</strong> verificável, com <strong>pergunta aberta</strong>.',
            'Conversa <strong>privada e logo</strong>.'
          ],
          modelo: '<p>Na design review de quinta, você interrompeu a Marina duas vezes antes de ela terminar o slide 3 e disse "isso não vai funcionar" sem citar o cenário. Ela parou de apresentar, o grupo ficou 10 minutos sem discutir e eu saí sem saber que risco você via. Na próxima, deixe o apresentador terminar e escreva sua objeção no documento um dia antes, com o cenário que falha. Combinamos de rever isso no 1:1 de quinta? Entrego em privado e logo, preparado, sem misturar com elogio.</p>' + reprova('manter o adjetivo ou esperar a avaliação semestral.') },
        { tipo: 'takeaway', html: 'Em cada resposta: <mark>mecanismo</mark> e <mark>registro</mark>, não intenção.' }
      ] },

      { rotulo: 'Código, prazo e IA', blocos: [
        { tipo: 'texto', html: '<p>Esta aba cobre os blocos 3, 4 e 6.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p3', titulo: 'P3 · Aquecimento: o review',
          pergunta: 'PR de 1.200 linhas gerado por agente, cobertura 96%, testes verdes. Qual o primeiro comentário?',
          opcoes: [
            { id: 'a', texto: '"Aprovado: a cobertura está ótima."', correta: false, porque: 'aprovar pela cobertura é o erro clássico.' },
            { id: 'b', texto: '"Bloqueante: descreva a intenção em 3 linhas e divida o PR; depois rodo o teste novo contra o código antigo."', correta: true, porque: 'intenção e tamanho vêm antes; o teste contra o código antigo mostra se o teste serve.' },
            { id: 'c', texto: '"Sugestão: renomeie as variáveis."', correta: false, porque: 'estilo é o último item da pilha.' }
          ] },
        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · PR de agente', obrigatorio: false,
          enunciado: 'PR de 1.200 linhas, cobertura 96%, testes verdes, autor diz "o agente fez". Conduza o review. <em>Bloco 3.</em>',
          placeholder: 'Intenção… Tamanho… Testes… API e dependência… Responsabilidade…',
          rubrica: [
            '<strong>Intenção</strong> primeiro.',
            '<strong>Devolver para dividir</strong>.',
            'Rodar o <strong>teste contra o código antigo</strong>.',
            'Checar <strong>API e dependência</strong>.',
            '<strong>Responsabilizar o autor</strong>; prefixos bloqueante/sugestão.'
          ],
          modelo: '<p>Começo pela intenção: "bloqueante: descreva o comportamento esperado em 3 linhas e o que ficou fora". Depois o tamanho: "bloqueante: divida em partes que caibam numa revisão com atenção". Rodo o teste novo com o código de produção removido; se passar, "bloqueante: este teste passa sem a mudança, preciso de um teste contra o componente real". Confiro se as APIs existem na versão fixada e se há dependência nova (nome, licença). O autor responde pelo PR e explica cada decisão não óbvia sem o agente.</p>' + reprova('aprovar pela cobertura ou comentar só estilo.') },

        { tipo: 'escolha', id: 'cp-esc-p4', titulo: 'P4 · Aquecimento: o prazo',
          pergunta: 'A soma dos prováveis é 41 dias-pessoa e o P85 é 53. Qual resposta ao gerente é a melhor?',
          opcoes: [
            { id: 'a', texto: '"Fechamos em 41."', correta: false, porque: '41 fica bem abaixo de 50% de chance.' },
            { id: 'b', texto: '"85% de confiança em 53 dias-pessoa; os riscos de dependência explicam a cauda; posso reduzir escopo ou mover a data."', correta: true, porque: 'percentil, hipóteses e opções.' },
            { id: 'c', texto: '"Não dá."', correta: false, porque: 'sem alternativas, cria um adversário.' }
          ] },
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Prazo', obrigatorio: false,
          enunciado: 'O gerente quer 41 dias, a soma dos prováveis. Responda com os dados do lab. <em>Bloco 4.</em>',
          placeholder: 'A distribuição é assimétrica… P50, P85, P95… Os riscos… Opções…',
          rubrica: [
            'Distribuição <strong>assimétrica</strong>.',
            'P50 <strong>47</strong>, P85 <strong>53</strong>, P95 <strong>56,5</strong> (ou os números do seu projeto).',
            '<strong>Riscos</strong> separados.',
            'O <strong>limite de independência</strong>.',
            '<strong>Opções de escopo</strong> e recomendação.'
          ],
          modelo: '<p>A soma dos prováveis (41) fica 13% abaixo do P50 (47,0): a cauda direita empurra o total para cima, então 41 tem bem menos de 50% de chance. O P85 é 53,0 e o P95, 56,5 dias-pessoa. Os dois riscos de dependência entram separados e explicam a maior parte da cauda. O modelo supõe tarefas independentes, então o resultado é piso, não teto. Opções: entregar a regra exata primeiro e o resto depois, mover a data para o P85, ou aceitar o risco. Recomendo cortar escopo e peço a decisão até quinta.</p>' + reprova('"não dá" sem alternativas, ou aceitar 41.') },

        { tipo: 'escolha', id: 'cp-esc-p6', titulo: 'P6 · Aquecimento: o mandato',
          pergunta: 'A diretoria exige agentes para todos na segunda. Qual resposta troca oposição por método?',
          opcoes: [
            { id: 'a', texto: '"Concordo com o objetivo; proponho um piloto de quatro semanas com métricas e critério de parada, para decidir com números."', correta: true, porque: 'patrocínio de um método, com hipótese e critério definidos antes.' },
            { id: 'b', texto: '"Não faremos sem evidência."', correta: false, porque: 'recusa sem alternativa.' },
            { id: 'c', texto: '"Todos usam e medimos linhas por pessoa."', correta: false, porque: 'métrica por pessoa cai na lei de Goodhart.' }
          ] },
        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Mandato de IA', obrigatorio: false,
          enunciado: 'A diretoria exige que todos usem agentes na segunda-feira. Proponha o caminho. <em>Bloco 6.</em>',
          placeholder: 'Piloto com hipótese… Grupo… Métricas… Critério de parada… Política…',
          rubrica: [
            '<strong>Piloto</strong> com hipótese, grupo e duração.',
            'Métricas de fluxo (lead time, tamanho de PR, tempo de review, falha, retrabalho) <strong>mais percepção</strong>.',
            '<strong>Critério de parada</strong> definido antes.',
            '<strong>Política mínima</strong> de dados e responsabilidade.',
            '<strong>Nenhuma métrica por pessoa</strong>.'
          ],
          modelo: '<p>Concordo com o objetivo e proponho um piloto de quatro semanas (uma de aprendizado descartada) com 3 de 7 voluntários e a hipótese de lead time mediano 20% menor sem aumento da taxa de falha. Meço lead time (mediana e P85), tamanho de PR, tempo até a primeira revisão, falha de mudança, retrabalho em 7 dias e uma pesquisa de 5 perguntas. Parada definida antes: falha acima de 2x a linha de base por duas semanas ou incidente com dado sensível em prompt. Política de uma página (ferramentas aprovadas, dados proibidos, o autor responde pelo PR) e nenhuma métrica por pessoa. Ao final: expandir, ajustar o harness ou parar, publicando os números.</p>' + reprova('recusar sem alternativa ou aceitar medindo linhas de código.') },
        { tipo: 'takeaway', html: 'Prazo é <mark>percentil com hipóteses</mark>; mandato é <mark>piloto com critério de parada</mark>.' }
      ] },

      { rotulo: 'Incidente e fechamento', blocos: [
        { tipo: 'texto', html: '<p>Esta aba cobre o bloco 7 e o fechamento do módulo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p7', titulo: 'P7 · Aquecimento: a causa',
          pergunta: 'Qual é a melhor reescrita de "causa raiz: erro humano"?',
          opcoes: [
            { id: 'a', texto: '"Causa raiz: falta de atenção do Caio."', correta: false, porque: 'continua atribuindo a uma pessoa.' },
            { id: 'b', texto: '"Contribuíram: runbook sem distinção entre produção e homologação; migração sem verificação de ambiente; sem alerta para o endpoint."', correta: true, porque: 'causas em camadas, no sistema.' },
            { id: 'c', texto: '"Ação: tomar mais cuidado."', correta: false, porque: 'sem dono, data nem verificação.' }
          ] },
        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Incidente e postmortem', obrigatorio: false,
          enunciado: 'Serviço fora por 52 minutos; o rascunho do postmortem diz "erro humano". Descreva o papel do comandante e reescreva a causa. <em>Bloco 7.</em>',
          placeholder: 'O IC… Mitigação… Cadência… Causas contribuintes… Ações…',
          rubrica: [
            'O <strong>IC coordena</strong> e delega comunicação.',
            '<strong>Mitigação antes</strong> de causa.',
            '<strong>Cadência</strong> de atualização.',
            'Causas contribuintes <strong>em camadas</strong>.',
            'Ações com <strong>@dono e data</strong>, e <strong>verificação</strong>.'
          ],
          modelo: '<p>O IC mantém a visão do todo, atribui tarefas, decide o rollback e delega a comunicação; quem mexe no sistema são os resolvedores. Mitiga antes de entender, num canal único, com atualização a cada 20 a 30 minutos mesmo sem novidade e passagem de comando explícita se cansar. No postmortem: "contribuíram: (1) o runbook não distinguia produção de homologação; (2) a migração não tinha verificação de ambiente; (3) não havia alerta de latência para o endpoint". Ação: "exigir confirmação do nome do ambiente em migrações destrutivas. @caio 2026-10-30", com verificação e no mesmo backlog do produto.</p>' + reprova('IC que corrige pessoalmente, ou ação "tomar mais cuidado".') },

        { tipo: 'escolha', id: 'cp-esc-fecho', titulo: 'Fechamento: o fio do módulo',
          pergunta: 'Qual afirmação resume melhor o módulo?',
          opcoes: [
            { id: 'a', texto: 'O líder técnico é medido pelo que o time decide e entrega sem ele; com agentes, o gargalo é decisão e verificação.', correta: true, porque: 'é o fio dos sete blocos.' },
            { id: 'b', texto: 'O líder técnico é medido pelo volume de código que produz.', correta: false, porque: 'a produção individual de código barateou.' },
            { id: 'c', texto: 'O líder técnico é medido por quantas ferramentas de IA o time usa.', correta: false, porque: 'adoção não é resultado; mede-se o sistema com DORA e percepção.' }
          ] },
        { tipo: 'texto', html:
          '<h3>Entregáveis verificados (mostrar rodando)</h3>' +
          '<ul><li>Gates do lab verdes: <code>pytest</code> (51 testes), <code>ruff check</code>, <code>ruff format --check</code>, <code>mypy --strict</code>.</li>' +
          '<li>Previsão do seu projeto com semente fixa: P50, P85, P95 e a soma dos prováveis, com e sem riscos.</li>' +
          '<li>Um RFC seu passando em <code>leadkit check rfc</code>, com ao menos duas alternativas e tipo de decisão.</li>' +
          '<li>Mutação do percentil rejeitada pela suíte, e o template intocado reprovado pelo linter (controle negativo).</li></ul>' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes verificadas em 11/10/2026; números de pesquisa externa, relatórios DORA e achados sobre IA mudam em meses (revalide em até 90 dias). Os valores de P50/P85/P95 e as métricas DORA vêm de execução real do <code>leadkit</code> com dados fictícios; os seus serão outros. A data do relatório DORA de ROI não aparece na página; os números do METR foram conferidos de memória com a divulgação (releia o paper antes de citar). Papéis e faixas de on-call são convenções do mercado, não padrão normativo.</p>' },
        { tipo: 'takeaway', html: 'O líder é medido pelo que o time <mark>decide e entrega sem ele</mark>; o gargalo é <mark>decisão e verificação</mark>.' }
      ] }
    ]
  });
})();
