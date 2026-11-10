/* E02 · Bloco 1: a decisão entre prompt, RAG, ferramenta, fine-tuning e treino. Fonte: E02.html#b01. Preços do exemplo são hipotéticos; estado de fornecedor verificado em 11/10/2026 (revalidar em até 90 dias). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  var J = function (a) { return a.join('\n'); };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasConta = function () {
    return [
      { id: 'a', nome: 'A · prompt longo, sem cache', descricao: '1.800 tokens de entrada por chamada', tom: 'dns', ms: 11400, linhas: [
        L('cmd', 'python conta.py --cenario A'),
        L('info', '2.000.000 chamadas/mês · entrada 1.800 tok a US$ 3,00/M · saída 20 tok a US$ 15,00/M'),
        L('out', 'entrada: 3,6 B x 3,00 = 10.800 · saída: 40 M x 15,00 = 600'),
        L('out', 'custo mensal A = US$ 11.400'),
        L('hint', 'este é o prompt ingênuo: o baseline errado')] },
      { id: 'b', nome: 'B · mesmo modelo, prefixo em cache', descricao: '1.700 dos 1.800 tokens em cache a 10% do preço', tom: 'tcp', ms: 2220, linhas: [
        L('cmd', 'python conta.py --cenario B'),
        L('out', 'cache: 3,4 B x 0,30 = 1.020 · novos: 0,2 B x 3,00 = 600 · saída: 600'),
        L('out', 'custo mensal B = US$ 2.220'),
        L('hint', 'o baseline correto: melhor prompt com cache e modelo adequado')] },
      { id: 'c', nome: 'C · modelo pequeno ajustado', descricao: '150 tokens de entrada; preço do ajustado = 2x o base pequeno', tom: 'tls', ms: 368, linhas: [
        L('cmd', 'python conta.py --cenario C'),
        L('out', 'entrada: 0,3 B x 0,80 = 240 · saída: 40 M x 3,20 = 128'),
        L('out', 'custo mensal C = US$ 368')] },
      { id: 'build', nome: 'Custo único de construir C', descricao: 'Dados, treino e engenharia', tom: 'request', ms: 12427, linhas: [
        L('cmd', 'python conta.py --construcao'),
        L('out', 'dados: 3.000 exemplos x 3 min a US$ 40/h = 6.000'),
        L('out', 'treino: 3.000 x 300 tok x 3 épocas = 2,7 M tok a US$ 10/M = 27'),
        L('out', 'engenharia e avaliação: 80 h x US$ 80/h = 6.400'),
        L('out', 'total = US$ 12.427'),
        L('hint', 'o maior item é a hora de especialista, não a GPU')] },
      { id: 'eq', nome: 'Ponto de equilíbrio', descricao: 'Economia mensal contra B (US$ 1.852) e meses até pagar', tom: 'ink', ms: 1852, linhas: [
        L('cmd', 'python conta.py --equilibrio'),
        L('out', 'contra A: economia 11.032/mês -> 12.427 / 11.032 = 1,1 mês'),
        L('out', 'contra B: economia 1.852/mês -> 12.427 / 1.852 = 6,7 meses'),
        L('hint', 'com troca do modelo-base em seis meses e retreino a metade do investimento, o projeto não se paga em um ano')] }
    ];
  };

  var codigoConta = J([
    'def custo_mensal(chamadas, tok_novos, tok_cache, tok_saida, p_in, p_cache, p_out):',
    '    """Preços em US$ por milhão de tokens."""',
    '    entrada = chamadas * tok_novos * p_in + chamadas * tok_cache * p_cache',
    '    saida = chamadas * tok_saida * p_out',
    '    return (entrada + saida) / 1e6',
    '',
    '',
    'def retreino_mensal(investimento, pct, a_cada_meses):',
    '    # custo do retreino = pct% do investimento inicial, rateado por mês',
    '    return 0.0',
    '',
    '',
    'def equilibrio_meses(investimento, custo_base, custo_ajustado, retreino=0.0):',
    '    # economia líquida = (base - ajustado) - retreino mensal',
    '    # sem economia líquida positiva, devolva None',
    '    return 0.0',
    '',
    '',
    'B = custo_mensal(2_000_000, 100, 1700, 20, 3.0, 0.30, 15.0)',
    'C = custo_mensal(2_000_000, 150, 0, 20, 0.80, 0.0, 3.20)',
    'print(round(B), round(C), equilibrio_meses(12_427, B, C))',
    ''
  ]);
  var testesConta = J([
    'def test_custos_do_exemplo():',
    '    assert round(custo_mensal(2_000_000, 1800, 0, 20, 3.0, 0.30, 15.0)) == 11400',
    '    assert round(custo_mensal(2_000_000, 100, 1700, 20, 3.0, 0.30, 15.0)) == 2220',
    '    assert round(custo_mensal(2_000_000, 150, 0, 20, 0.80, 0.0, 3.20)) == 368',
    '',
    '',
    'def test_equilibrio_contra_a_e_contra_b():',
    '    assert round(equilibrio_meses(12_427, 11_400, 368), 1) == 1.1',
    '    assert round(equilibrio_meses(12_427, 2_220, 368), 1) == 6.7',
    '',
    '',
    'def test_retreino_rateado():',
    '    assert round(retreino_mensal(12_427, 50, 6), 1) == 1035.6',
    '',
    '',
    'def test_retreino_empurra_equilibrio_acima_de_12_meses():',
    '    r = retreino_mensal(12_427, 50, 6)',
    '    assert equilibrio_meses(12_427, 2_220, 368, r) > 12',
    '',
    '',
    'def test_sem_economia_nao_se_paga():',
    '    assert equilibrio_meses(12_427, 300, 368) is None',
    '    assert equilibrio_meses(12_427, 2_220, 368, retreino=2_000) is None',
    ''
  ]);
  var solucaoConta = J([
    'def custo_mensal(chamadas, tok_novos, tok_cache, tok_saida, p_in, p_cache, p_out):',
    '    entrada = chamadas * tok_novos * p_in + chamadas * tok_cache * p_cache',
    '    saida = chamadas * tok_saida * p_out',
    '    return (entrada + saida) / 1e6',
    '',
    '',
    'def retreino_mensal(investimento, pct, a_cada_meses):',
    '    return investimento * pct / 100 / a_cada_meses',
    '',
    '',
    'def equilibrio_meses(investimento, custo_base, custo_ajustado, retreino=0.0):',
    '    economia = (custo_base - custo_ajustado) - retreino',
    '    if economia <= 0:',
    '        return None',
    '    return investimento / economia',
    ''
  ]);

  TrilhaAula.registrar({
    id: 'e02-b1',
    titulo: 'A decisão: prompt, RAG, fine-tuning ou treino',
    minutos: 30,
    resumo: 'Fine-tuning raramente morre por falha técnica: morre por resolver com pesos um problema que outra alavanca resolvia mais barato, ou por não medir o ponto de partida. A conta de custo total e o baseline certo decidem.',
    objetivo: 'Dizer o que cada alavanca muda, classificar uma falha como contexto, ferramenta, raciocínio ou comportamento, e calcular o ponto de equilíbrio de um fine-tuning contra o baseline correto.',
    revisao: [
      { id: 'e02b1-regra', pergunta: 'Qual é a regra operacional entre contexto e pesos?',
        opcoes: [
          opc('a', 'Fato que muda ou precisa de fonte vai por contexto; comportamento estável e repetido vai por pesos', true, 'no contexto o conhecimento é consultável, atualizável por linha e auditável; nos pesos é difuso, sem endereço para apagar um fato.'),
          opc('b', 'Todo conhecimento de domínio vai por pesos, porque fica mais rápido', false, 'fato nos pesos não tem citação nem correção por linha.'),
          opc('c', 'Tudo vai por contexto, nunca por pesos', false, 'formato, tom e política estáveis em alto volume são o caso legítimo de fine-tuning.')] },
      { id: 'e02b1-baseline', pergunta: 'Contra qual baseline um fine-tuning deve competir?',
        opcoes: [
          opc('a', 'O melhor prompt com cache, saída estruturada e modelo adequado', true, 'contra o prompt do primeiro dia o ganho parece óbvio (1,1 mês); contra o baseline certo, o equilíbrio foi a 6,7 meses.'),
          opc('b', 'O prompt que a empresa roda hoje, seja qual for', false, 'se o prompt é ingênuo, o ganho do ajuste é inflado.'),
          opc('c', 'O próprio modelo ajustado de uma rodada anterior', false, 'isso mede consistência, não valor sobre a alternativa barata.')] },
      { id: 'e02b1-custo', pergunta: 'Qual item costuma ser o maior do custo total de um modelo adaptado?',
        opcoes: [
          opc('a', 'Dados: coleta, rotulagem ou revisão, deduplicação e auditoria', true, 'hora de especialista pesa mais que hora de GPU; em LoRA sobre modelo pequeno o treino é o menor item.'),
          opc('b', 'GPU de treino', false, 'em LoRA sobre modelo pequeno, é o menor item.'),
          opc('c', 'Tokens do dataset', false, 'o custo é a hora de quem rotula e de quem audita a rotulagem.')] },
      { id: 'e02b1-ativo', pergunta: 'O que é o ativo portável quando o fine-tuning é feito por API de fornecedor?',
        opcoes: [
          opc('a', 'O dataset versionado e a suíte de avaliação; o modelo ajustado é consumível', true, 'pesos ajustados por API não são exportáveis, e o ciclo de vida da oferta é decisão do fornecedor.'),
          opc('b', 'O modelo ajustado, que você pode baixar', false, 'pesos ajustados por API não são exportáveis.'),
          opc('c', 'O endpoint dedicado', false, 'o endpoint morre com o modelo-base descontinuado.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Projetos de fine-tuning morrem pelo motivo errado</h3>' +
          '<p>Raramente é falha técnica. O time resolveu com pesos um problema que outra alavanca resolvia por uma fração do custo, ou ninguém mediu o ponto de partida e o ganho não pôde ser demonstrado. O M11 deu a escada resumida (prompt, structured output, RAG, ferramenta, modelo maior, fine-tuning). Este bloco refaz a decisão com o que a escada omite: o que cada alavanca muda por dentro e a conta de custo total, que costuma inverter a conclusão.</p>' +
          '<h3>O que cada alavanca muda</h3>' +
          '<p>Um modelo é uma função <code>f(x; θ)</code>: a entrada <code>x</code> (prompt, contexto, imagens) e os pesos <code>θ</code>. Toda adaptação mexe em um dos dois, ou em algo que decide o que entra em <code>x</code>.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Alavanca</th><th>O que muda</th><th>Onde mora a mudança</th><th>Ciclo para testar</th><th>Reverter</th></tr></thead><tbody>' +
          '<tr><td>Prompt / few-shot</td><td>A parte de <code>x</code> que você controla: instruções e exemplos</td><td>Texto versionado (M06 B04)</td><td>Minutos</td><td>Trocar o texto</td></tr>' +
          '<tr><td>RAG</td><td>O conhecimento em <code>x</code>: busca fatos e os injeta</td><td>Índice, chunking, reranker (M07)</td><td>Horas a dias</td><td>Trocar o índice; fonte rastreável</td></tr>' +
          '<tr><td>Ferramentas</td><td>Capacidade exata: cálculo, consulta, ação</td><td>Código determinístico (M08)</td><td>Dias</td><td>Versionar a ferramenta</td></tr>' +
          '<tr><td>Fine-tuning (SFT, LoRA)</td><td>A distribuição de comportamento em <code>θ</code>: formato, tom, política de decisão, destreza num domínio de linguagem</td><td>Pesos ou adapter</td><td>Dias a semanas</td><td>Voltar ao artefato anterior, se você o guardou</td></tr>' +
          '<tr><td>Preferência (DPO, RLHF)</td><td>Qual entre várias respostas plausíveis o modelo favorece</td><td>Pesos</td><td>Semanas</td><td>Idem</td></tr>' +
          '<tr><td>Treino do zero / pré-treino contínuo</td><td>Tudo, inclusive vocabulário e conhecimento</td><td>Pesos, tokenizador</td><td>Meses; ordem de milhões de dólares em escala de fronteira</td><td>Praticamente nunca</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>A linha que separa as alavancas é <strong>onde o conhecimento fica</strong>. No contexto ele é consultável, atualizável por linha, auditável e controlável por ACL. Nos pesos ele é difuso: não há endereço para apagar um fato, não há citação, e tudo que o modelo viu no treino pode reaparecer em qualquer resposta.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'A regra operacional', html: '<p><strong>Fato que muda ou precisa de fonte vai por contexto; comportamento estável e repetido vai por pesos.</strong></p>' },
        { tipo: 'takeaway', html: 'A pergunta é <mark>onde o conhecimento deve ficar</mark>: fato volátil no contexto, comportamento estável nos pesos.' }
      ] },

      { rotulo: 'Quando vale', blocos: [
        { tipo: 'abas', rotulo: 'Fine-tuning é a alavanca certa?', itens: [
          { rotulo: 'Quando é', blocos: [{ tipo: 'texto', html:
            '<ul>' +
            '<li><strong>Formato ou política que o prompt não segura de forma barata.</strong> Um classificador de 40 categorias com regras de desempate que ocupam 1.800 tokens de prompt em cada chamada: comportamento estável, volume alto, e um modelo menor adaptado pode substituir um maior com prompt longo.</li>' +
            '<li><strong>Latência ou custo por chamada em escala.</strong> Modelo pequeno adaptado no lugar de modelo grande instruído, desde que o baseline de prompt tenha sido medido <em>com cache</em>.</li>' +
            '<li><strong>Estilo e voz</strong> difíceis de descrever, fáceis de exemplificar, com milhares de exemplos aprovados.</li>' +
            '<li><strong>Dialeto de domínio:</strong> nomenclatura clínica, jargão jurídico de uma jurisdição, notação interna. A mistura com RAG é legítima: o fine-tuning ensina a ler e escrever o dialeto; o RAG traz os fatos.</li>' +
            '<li><strong>Dado que não pode sair da infraestrutura</strong>, combinado com pesos abertos (M11 B06 e B07).</li></ul>' }] },
          { rotulo: 'Quando não é', blocos: [{ tipo: 'texto', html:
            '<ul>' +
            '<li>Conhecimento novo ou volátil.</li>' +
            '<li>Tarefa em que o modelo falha por raciocínio insuficiente: modelo melhor ou de raciocínio (bloco 5) resolve mais barato.</li>' +
            '<li>Exatidão numérica: ferramenta.</li>' +
            '<li>Qualquer caso sem ao menos algumas centenas de exemplos de qualidade e sem como medir o resultado.</li></ul>' }] }
        ] },
        { tipo: 'ordene', id: 'b1-ordene-arvore', titulo: 'Ordene as perguntas da árvore de decisão', obrigatorio: false,
          enunciado: 'A árvore faz uma pergunta por vez e para na primeira que responde "sim". Ponha as perguntas na ordem em que o módulo as faz.',
          itens: [
            { id: 'ft', texto: 'Comportamento estável, volume alto, centenas de exemplos e suíte? Então SFT/LoRA; preferência ou destilação conforme o caso' },
            { id: 'rag', texto: 'Falta conhecimento volátil ou que exige fonte? Então contexto/RAG (M07)' },
            { id: 'base', texto: 'Ainda não medi o melhor prompt com cache? Então meça antes: esse é o baseline' },
            { id: 'rac', texto: 'Falta raciocínio em tarefa de vários passos? Então modelo melhor ou de raciocínio (bloco 5)' },
            { id: 'tool', texto: 'Falta exatidão: conta, consulta ou ação? Então ferramenta determinística (M08)' }
          ], solucao: ['rag', 'tool', 'rac', 'base', 'ft'],
          dica: 'O ajuste de pesos é a última alavanca: só entra depois de descartar contexto, ferramenta e raciocínio, e de medir o baseline.',
          tutorDepois: 'Contexto, ferramenta, raciocínio, baseline e só então pesos. Se a última resposta for "não", fique em prompt + RAG e reavalie.' },
        { tipo: 'takeaway', html: 'Pesos entram <mark>por último</mark>: depois de contexto, ferramenta, raciocínio e de um <mark>baseline medido</mark>.' }
      ] },

      { rotulo: 'A conta de custo total', blocos: [
        { tipo: 'texto', html:
          '<p>Custo por token é a parte visível. O custo total de um modelo adaptado soma sete itens, e três deles raramente aparecem na planilha inicial.</p>' +
          '<ul><li><strong>Dados:</strong> coleta, rotulagem ou revisão, deduplicação, auditoria. Quase sempre o maior item.</li>' +
          '<li><strong>Treino:</strong> GPU ou tokens de treino na API. Em LoRA sobre modelo pequeno, é o menor item.</li>' +
          '<li><strong>Avaliação:</strong> construir e manter a suíte, incluindo guardas (M06).</li>' +
          '<li><strong>Serving:</strong> endpoint dedicado, capacidade provisionada por hora ou GPU própria (M11 B07). Em baixo volume, o ocioso pode custar mais que o treino.</li>' +
          '<li><strong>Retreino</strong> a cada troca do modelo-base. O adapter é acoplado à versão exata do base e, em API, o modelo ajustado vive enquanto o base não for descontinuado.</li>' +
          '<li><strong>Operação:</strong> versionamento, monitoramento de drift, plantão (bloco 7).</li>' +
          '<li><strong>Custo de oportunidade:</strong> o que a equipe não fez enquanto isso.</li></ul>' +
          '<p>Exemplo condutor: classificar tickets em categorias, saída de 20 tokens, 2.000.000 de chamadas por mês. Os preços são <strong>hipotéticos</strong>, escolhidos para ilustrar a estrutura da conta (use os da sua cotação). Preveja o ponto de equilíbrio antes de rodar.</p>' },
        { tipo: 'rode', id: 'b1-rode', titulo: 'Três cenários e o equilíbrio', enunciado: 'Rode a conta e clique em cada etapa para ler só as linhas dela. Os comandos desta tela são um script ilustrativo (a conta é a do módulo, feita à mão), não parte do lab. A barra mostra valores em US$ (custo mensal dos cenários, custo único e, na última etapa, a economia mensal contra B).',
          prefixo: '$', entrada: 'python conta.py --tudo', unidade: 'US$', terminalTitulo: 'cálculo ilustrativo', etapas: etapasConta(),
          prever: { pergunta: 'O fine-tuning custa US$ 12.427 para construir e economiza muito contra o cenário A. Contra o cenário B (mesmo modelo, prefixo em cache), qual será o ponto de equilíbrio?', opcoes: [
            { id: 'a', texto: 'Cerca de 1,1 mês, como contra o A.', correta: false, porque: 'o 1,1 mês é contra o prompt ingênuo; o baseline correto já tem cache e custa muito menos.' },
            { id: 'b', texto: 'Cerca de 6,7 meses: a economia mensal cai de 11.032 para 1.852.', correta: true, porque: 'B custa 2.220 e C custa 368; 12.427 / 1.852 é 6,7.' },
            { id: 'c', texto: 'Nunca: o ajustado custa mais por chamada.', correta: false, porque: 'C custa 368 por mês, menos que B; o equilíbrio existe, só é longo.' }
          ] },
          tutorAntes: 'Aperte Enter e depois clique em "Ponto de equilíbrio".',
          tutorDepois: 'Contra A o equilíbrio é 1,1 mês e "parece óbvio". Contra B, o baseline correto, são 6,7 meses; se o base trocar em seis meses e o retreino custar metade do investimento, o projeto não se paga em um ano. A decisão não é "não faça": volume maior, prefixo menos cacheável, latência que o modelo grande não cumpre ou ganho de qualidade que o prompt não alcança mudam a conta.',
          callout: 'Você viu o equilíbrio saltar de 1,1 para 6,7 meses só trocando o baseline.' },
        { tipo: 'takeaway', html: 'A lição é a ordem de operações: o baseline é o <mark>melhor prompt com cache</mark>, nunca o prompt ingênuo.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b1-python', titulo: 'A conta em código', obrigatorio: false,
          enunciado: 'Implemente <code>retreino_mensal(investimento, pct, a_cada_meses)</code> (o retreino custa <code>pct</code>% do investimento a cada <code>a_cada_meses</code>, rateado por mês) e <code>equilibrio_meses(investimento, custo_base, custo_ajustado, retreino)</code>. Sem economia líquida positiva, devolva <code>None</code>: o projeto não se paga. <code>custo_mensal</code> já está pronta.',
          codigo: codigoConta, testes: testesConta,
          dica: 'Economia líquida = <code>(custo_base - custo_ajustado) - retreino</code>. Se for <code>&lt;= 0</code>, <code>return None</code>; senão <code>investimento / economia</code>. O retreino rateado é <code>investimento * pct / 100 / a_cada_meses</code>.',
          solucao: solucaoConta,
          tutorDepois: 'Com retreino a cada 6 meses a 50% do investimento, o equilíbrio contra B passa de 12 meses. O controle negativo (ajustado mais caro que o base) devolve None.',
          callout: 'A conta de equilíbrio agora está em código, com o retreino dentro.' },
        { tipo: 'cenario', id: 'b1-cenario', titulo: 'A diretoria quer que o assistente conheça as políticas', obrigatorio: false,
          enunciado: 'A diretoria pede fine-tuning para que o assistente "conheça as políticas internas, que mudam todo mês". Escolha o desenho e veja o custo de cada decisão.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O pedido é treinar o modelo com o manual de políticas, todo mês. Qual é a sua primeira resposta?', opcoes: [
              { texto: 'Aceitar e agendar um fine-tuning mensal com o manual novo.', vai: 'f-pesos', tom: 'ruim', consequencia: 'a política muda por linha e precisa de fonte; nos pesos o conhecimento é difuso, sem citação e sem como apagar uma regra revogada.' },
              { texto: 'Separar: política volátil com fonte vai por contexto; só o jeito de responder pode justificar pesos.', vai: 'separar', tom: 'ok', consequencia: 'você aplica a regra do módulo e abre espaço para medir.' },
              { texto: 'Recusar tudo: fine-tuning não serve para nada aqui.', vai: 'f-recusa', tom: 'ruim', consequencia: 'recusar sem alternativa não resolve o problema da diretoria.' }
            ] },
            separar: { texto: 'Como você desenha a solução e o que mede antes de falar em treino?', opcoes: [
              { texto: 'RAG sobre o manual, com fonte e ACL; baseline do melhor prompt com cache; decidir pesos só se formato ou tom continuarem falhando.', vai: 'f-bom', tom: 'ok', consequencia: 'cada política muda por linha no índice, com proveniência, e o baseline dá a régua de qualquer ajuste futuro.' },
              { texto: 'Prompt gigante com todo o histórico de políticas, sem índice.', vai: 'f-prompt', tom: 'ruim', consequencia: 'sem busca, o contexto incha, custa a cada chamada e mistura versões antigas e novas.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Política volátil no contexto, auditável e atualizável por linha; pesos só se um comportamento estável provar que precisa deles.' },
            'f-pesos': { bom: false, texto: 'O modelo cita regras antigas com confiança, ninguém sabe de onde, e cada correção vira um retreino.' },
            'f-recusa': { bom: false, texto: 'A diretoria insiste e o time perde a chance de propor a solução certa.' },
            'f-prompt': { bom: false, texto: 'O custo por chamada sobe e o modelo mistura versões de política.' }
          },
          callout: 'Você separou conhecimento volátil de comportamento estável e propôs medir primeiro.' },
        { tipo: 'escolha', id: 'b1-esc-base', titulo: 'Confira: o baseline',
          pergunta: 'No exemplo, o equilíbrio é 1,1 mês contra o cenário A e 6,7 meses contra o B. Qual é o baseline correto, e por quê?',
          opcoes: [
            { id: 'a', texto: 'A, porque é o que a empresa roda hoje.', correta: false, porque: 'o que roda hoje pode ser um prompt ingênuo; isso infla o ganho.' },
            { id: 'b', texto: 'B: o fine-tuning compete com o melhor prompt com cache e modelo adequado, nunca com o prompt ingênuo.', correta: true, porque: 'contra B a economia mensal cai de 11.032 para 1.852 e o equilíbrio vai para 6,7 meses.' },
            { id: 'c', texto: 'Tanto faz: o equilíbrio depende só do preço por token.', correta: false, porque: 'o preço por token é só uma parte; o baseline define a economia.' }
          ], tutorDepois: 'Antes de justificar pesos, reescreva o prompt com exemplos bons, saída estruturada e cache.' },
        { tipo: 'escolha', id: 'b1-esc-vendor', titulo: 'Confira: fine-tuning como recurso de fornecedor',
          pergunta: 'Na verificação de 11/10/2026, a documentação de DPO da OpenAI informava que a plataforma de fine-tuning "não está mais acessível a novos usuários", com modelos já ajustados servindo até o base ser descontinuado. O que isso pede da arquitetura?',
          opcoes: [
            { id: 'a', texto: 'Tratar o modelo ajustado como ativo nosso e exportar os pesos quando precisar.', correta: false, porque: 'pesos ajustados por API não são exportáveis.' },
            { id: 'b', texto: 'Guardar o dataset versionado e o harness de avaliação: o modelo é consumível, e migrar de base vira retreino, não reconstrução.', correta: true, porque: 'o ativo portável são os dados e a suíte; assumir o contrário é construir em terreno alugado.' },
            { id: 'c', texto: 'Evitar qualquer fine-tuning por API.', correta: false, porque: 'a mitigação é arquitetural, não proibir a alavanca.' }
          ], tutorDepois: 'Estado da oferta de fornecedor muda em meses: verificado em 11/10/2026, revalidar em até 90 dias.' },
        { tipo: 'takeaway', html: 'Dados e suíte de avaliação são o <mark>ativo portável</mark>; o modelo ajustado é <mark>consumível</mark>.' }
      ] }
    ]
  });
})();
