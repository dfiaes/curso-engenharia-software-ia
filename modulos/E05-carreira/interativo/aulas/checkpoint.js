/* E05 · Checkpoint: seis cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada + "Reprova". Porta E05.html#checkpoint. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'e05-checkpoint',
    titulo: 'Checkpoint E05',
    minutos: 45,
    resumo: 'Seis cenários sobre mercado, portfólio, entrevistas e evolução contínua, sem consulta, até 10 minutos cada.',
    objetivo: 'Verificar, sem consulta, se você lê uma vaga, torna um README verificável, responde perguntas de AI engineering com mecanismo e número, compara propostas pelo líquido anual e planeja a evolução com artefatos.',
    abas: [
      { rotulo: 'Mercado, portfólio e entrevista', blocos: [
        { tipo: 'texto', html:
          '<p>Responda por escrito, sem consultar, em até 10 minutos cada. Rubrica: <strong>Basta</strong> é o mínimo para considerar o conceito dominado; <strong>Reprova</strong> é o sinal de que ele precisa ser relido. Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: o anúncio',
          pergunta: 'Um anúncio diz "AI engineer sênior, 5+ anos de LLMs, domínio de três frameworks, diferencial: Kubernetes" e não menciona avaliação nem custo. Qual a primeira decisão?',
          opcoes: [
            opc('a', 'Recusar só pelo "5+ anos".', false, 'o requisito literal é irreal, mas isso costuma ser RH copiando texto.'),
            opc('b', 'Tratar a vaga como indefinida e fazer perguntas na triagem: como medem qualidade, quem decide o escopo e quem opera a plataforma.', true, 'decida com base nas respostas.'),
            opc('c', 'Candidatar-se listando as três tecnologias que você domina.', false, 'não responde ao que falta no anúncio: avaliação, custo e dono.')
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Decida e pergunte', obrigatorio: false,
          enunciado: 'O anúncio acima não menciona avaliação nem custo. Decida se você se candidata e que perguntas faz na triagem. <em>Bloco 1.</em>',
          placeholder: 'O requisito de 5+ anos… Eu perguntaria…',
          rubrica: [
            'Reconhece o requisito literal como <strong>irrealista</strong> sem descartar a vaga.',
            'Identifica a <strong>ausência de avaliação</strong> e de dono.',
            'Pergunta <strong>como medem qualidade, quem decide escopo e quem opera a plataforma</strong>.',
            'Decide com base nas respostas.'
          ],
          modelo: '<p>"5+ anos de LLMs" é impossível como especificação literal; leio como "tem algo real em produção, não só demo". O anúncio lista ferramentas e não cita avaliação, custo nem dono, então a vaga é indefinida, não necessariamente ruim. Eu me candidato e, na triagem, pergunto como medem hoje a qualidade, quem decide o escopo da função e quem opera a plataforma, e decido pelas respostas.</p>' + reprova('recusar só pelo "5+ anos", aceitar sem perguntar, ou responder listando as três tecnologias que você domina.') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · README verificável', obrigatorio: false,
          enunciado: 'Seu README diz "pipeline de RAG com ótimo desempenho e baixo custo". Reescreva a seção de avaliação e a de custo para um estranho poder verificar. <em>Bloco 2.</em>',
          placeholder: 'Avaliação: conjunto de… Custo: …',
          rubrica: [
            'Descreve o conjunto (<strong>tamanho, origem</strong>), a <strong>métrica e o valor com linha de base</strong>.',
            'Custo por requisição com <strong>número de execuções</strong> e <strong>data da cotação</strong>.',
            'Latência <strong>p50/p95</strong>.',
            'Declara o <strong>limite do corpus</strong>.'
          ],
          modelo: '<p><strong>Avaliação.</strong> Conjunto de [N] perguntas com fonte rotulada, de origem [X]; recall@5 = [valor] contra [linha de base] sem reranking. Corpus de teste, sem piloto com usuários reais. <strong>Custo.</strong> [valor] por pergunta em [N] execuções, cotação do provedor de [data]; latência p50 [a] ms e p95 [b] ms.</p>' + reprova('trocar adjetivos por outros adjetivos, ou números sem contexto de medição.') },

        { tipo: 'escolha', id: 'cp-esc-p3', titulo: 'P3 · Aquecimento: o agente em laço',
          pergunta: '"Seu agente entra em laço e custa caro. O que você faz?" Qual resposta basta?',
          opcoes: [
            opc('a', 'Colocar um limite de tentativas.', false, 'é só uma parte; falta orçamento de custo, checkpoint e trace.'),
            opc('b', 'Orçamento duro de passos, tokens, tempo e custo; detecção de chamada repetida; checkpoint e retomada; trace para reproduzir; mensagem útil ao usuário.', true, 'orçamento como contrato; cite o orçamento de retry do seu projeto.'),
            opc('c', 'Definir o que é um agente e como ele decide.', false, 'definir em vez de responder.')
          ] },
        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · O agente em laço', obrigatorio: false,
          enunciado: 'Responda em até 2 minutos e aponte onde você usaria o seu projeto como exemplo. <em>Blocos 3 e M08.</em>',
          placeholder: 'Eu começaria por… No meu projeto…',
          rubrica: [
            'Orçamento duro de <strong>passos, tokens, tempo e custo</strong>.',
            '<strong>Detecção de chamada repetida</strong>.',
            '<strong>Checkpoint e retomada</strong>; <strong>trace</strong> para reproduzir.',
            'Cita o <strong>orçamento de retry</strong> do seu gateway ou do agente, e dá <strong>mensagem útil ao usuário</strong>.'
          ],
          modelo: '<p>Trato o orçamento como contrato: limites duros de passos, tokens, tempo e custo por tarefa. Detecto chamada repetida (mesma ferramenta, mesmos argumentos) e interrompo. Gravo checkpoint para retomar sem repetir efeito colateral e mantenho trace para reproduzir o laço. O usuário recebe uma mensagem útil, não um erro mudo. No Cartógrafo, o orçamento de retry do gateway é o exemplo.</p>' + reprova('"colocaria um limite de tentativas" e só; ou definir agente em vez de responder.') }
      ] },

      { rotulo: 'Comportamental, proposta e plano', blocos: [
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Uma falha sua em produção', obrigatorio: false,
          enunciado: '"Conte uma falha sua em produção." Estruture uma resposta STAR <strong>verdadeira</strong>, com a sua parte na causa. <em>Bloco 3.</em>',
          placeholder: 'Situação e impacto… Minha parte… Detecção e correção… Mudança de processo…',
          rubrica: [
            '<strong>Situação e impacto</strong> concretos.',
            'Admite a <strong>própria decisão ou omissão</strong>.',
            'Descreve <strong>detecção, contenção e correção</strong>.',
            'Termina com <strong>mudança duradoura de processo</strong> (teste, alerta, ADR), em 2 a 3 minutos.'
          ],
          modelo: '<p>Em [sistema], um reprocessamento duplicou [N] registros porque a operação não era idempotente. Minha parte: eu tinha aprovado o desenho sem exigir chave de idempotência. Detectei por [alerta/cliente], contive em [tempo], corrigi e adicionei teste e checagem de duplicidade no CI. Hoje todo contrato de operação com efeito colateral no time declara a chave.</p>' + reprova('falha disfarçada de virtude, culpa de terceiros, ou história inventada sem detalhes verificáveis.') },

        { tipo: 'escolha', id: 'cp-esc-p5', titulo: 'P5 · Aquecimento: duas propostas',
          pergunta: 'Você recebe uma proposta CLT em reais com benefícios e um contrato remoto em dólar como contractor. Qual é o primeiro passo da comparação?',
          opcoes: [
            opc('a', 'Converter pelo câmbio do dia e escolher o maior.', false, 'valor nominal ignora encargos, férias, 13º, FGTS e risco.'),
            opc('b', 'Montar o líquido anual dos dois lados.', true, 'CLT: 13º, férias, FGTS, benefícios. Contractor: impostos, contabilidade, reserva, câmbio.'),
            opc('c', 'Pedir o maior bruto aos dois.', false, 'negociar só o número esquece escopo, nível e contrato.')
          ] },
        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · CLT contra contractor em dólar', obrigatorio: false,
          enunciado: 'Monte o método de comparação das duas propostas e liste o que verificar antes de aceitar. <em>Bloco 4.</em>',
          placeholder: 'Eu compararia… Verificaria…',
          rubrica: [
            'Compara <strong>líquido anual</strong>.',
            'CLT: <strong>13º, férias, FGTS, benefícios</strong>. Contractor: <strong>impostos, contabilidade, reserva e câmbio</strong>.',
            'Considera <strong>risco de contratação internacional, propriedade intelectual e rescisão</strong>.',
            'Exige <strong>contrato escrito revisado</strong> e negocia também <strong>escopo e nível</strong>.'
          ],
          modelo: '<p>Refaço as duas propostas em líquido anual: na CLT somo salário líquido com 13º, férias com 1/3, FGTS e benefícios; no contractor desconto impostos, contador, saúde própria, a reserva para meses sem contrato e o risco cambial. Verifico a forma de contratação (contractor direto ou EOR), tributação no Brasil, propriedade intelectual e cláusulas de rescisão, e exijo o contrato por escrito, revisado por profissional. Negocio também escopo, nível e condições, não só o número.</p>' + reprova('comparar valores nominais ou converter pelo câmbio do dia e decidir.') },

        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Três meses, cinco horas por semana', obrigatorio: false,
          enunciado: 'Você tem 5 horas por semana por três meses e a meta de ser referência em avaliação de IA no time. Monte o plano e os artefatos verificáveis. <em>Bloco 4.</em>',
          placeholder: 'Fonte primária… Prática… Revisão… Produção pública… Não vou acompanhar…',
          rubrica: [
            'Divide em <strong>fonte primária, prática no projeto, revisão espaçada e produção pública</strong>.',
            'Define <strong>artefatos</strong> (nota, issue, estudo de caso).',
            'Inclui <strong>o que não vai acompanhar</strong>.',
            'Usa o <strong>banco com Leitner</strong> para manter retenção.'
          ],
          modelo: '<p>Por semana: 1 h de fonte primária (3 linhas sobre o que mudou), 2 h de prática no Cartógrafo (calibrar o juiz contra 40 casos rotulados), 3 x 10 min de Leitner no banco de perguntas e 1 h de produção pública. Artefatos: uma nota com números, um issue bem reportado em projeto de avaliação e o estudo de caso no README. Fora do radar: lançamentos que não tocam avaliação, agentes ou segurança.</p>' + reprova('lista de cursos e livros sem saída verificável.') },

        { tipo: 'escolha', id: 'cp-esc-fim', titulo: 'Fechamento: o que a entrevista mede',
          pergunta: 'Qual combinação separa melhor quem fala de IA de quem a engenheira?',
          opcoes: [
            opc('a', 'Citar muitas ferramentas e versões.', false, 'ferramenta onde se espera princípio.'),
            opc('b', 'Mecanismo, número do próprio projeto, trade-off e modo de falha, com a história escrita no portfólio.', true, 'o código prova que você sabe fazer; o texto prova que você sabe decidir.'),
            opc('c', 'Respostas decoradas do banco de perguntas.', false, 'cai na primeira pergunta de aprofundamento.')
          ] },
        { tipo: 'takeaway', html: 'Para cada cenário: <mark>mecanismo, número, limite</mark>. Se reprovar, volte ao bloco indicado e tente de novo.' }
      ] }
    ],
    revisao: [
      { id: 'r1', pergunta: 'Um anúncio sênior exige "5+ anos de LLMs" e não cita avaliação. Qual a decisão e as perguntas?', opcoes: [
        opc('a', 'Tratar como indefinida e perguntar como medem qualidade, quem decide o escopo e quem opera a plataforma.', true, 'decida pelas respostas.'),
        opc('b', 'Descartar por causa do requisito impossível.', false, 'o requisito literal costuma ser texto copiado.')] },
      { id: 'r2', pergunta: 'O que torna a seção de avaliação de um README verificável?', opcoes: [
        opc('a', 'Tamanho e origem do conjunto, métrica, valor e linha de base.', true, '"ótimo" não é verificável.'),
        opc('b', 'Um adjetivo forte e um gráfico.', false, 'gráfico sem condição de medição não prova nada.')] },
      { id: 'r3', pergunta: 'Qual a estrutura de uma resposta STAR de sênior?', opcoes: [
        opc('a', 'Situação e Tarefa 30 s, Ação 80 s com suas decisões, Resultado com número 30 s, Aprendizado 20 s.', true, 'mais peso na Ação e um quinto elemento, Aprendizado.'),
        opc('b', 'Contextualizar por dois minutos e resumir a ação.', false, 'o peso vai para a Ação.')] },
      { id: 'r4', pergunta: 'Como comparar uma proposta CLT com um contractor em dólar?', opcoes: [
        opc('a', 'Pelo líquido anual, incluindo 13º, férias, FGTS e benefícios de um lado e impostos, contabilidade, reserva e câmbio do outro.', true, 'mais risco de contratação internacional, PI, rescisão e contrato revisado.'),
        opc('b', 'Convertendo pelo câmbio do dia.', false, 'valor nominal engana.')] },
      { id: 'r5', pergunta: 'O que o plano de 5 horas semanais precisa ter além de tempo?', opcoes: [
        opc('a', 'Artefatos verificáveis por bloco e a lista do que não vai acompanhar.', true, 'e Leitner para manter retenção.'),
        opc('b', 'Uma lista de cursos e livros.', false, 'sem saída verificável.')] }
    ]
  });
})();
