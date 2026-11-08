/* M08 · Bloco 1: workflow × agente. Fonte: M08.html#b01. Fontes verificadas em 14/09/2026 (Anthropic, building effective agents; 12-Factor Agents). Saídas de terminal são exemplos ilustrativos com modelo fake. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var TAREFA = 'responda o que quebra se eu mudar este método';
  var etapasClassificar = function () {
    return [
      { id: 'q1', nome: 'Quantos passos?', descricao: 'Dá para contar de antemão?', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python classificar.py "' + TAREFA + '"'),
        L('info', 'tarefa: ' + TAREFA),
        L('out', 'Q1 sabe quantos passos? NÃO (depende de quantas classes chamam o método)'),
        L('hint', 'isso só se descobre investigando: o número de saltos é resultado, não dado de entrada')] },
      { id: 'q2', nome: 'Quais ferramentas?', descricao: 'Dá para fixar ferramentas e ordem?', tom: 'tcp', ms: 1, linhas: [
        L('out', 'Q2 sabe quais ferramentas e em que ordem? NÃO (busca, leitura, grafo: depende do achado anterior)')] },
      { id: 'q3', nome: 'Mesmo caminho?', descricao: 'O caminho é igual para toda entrada?', tom: 'tls', ms: 1, linhas: [
        L('out', 'Q3 o caminho é o mesmo para toda entrada? NÃO (cada método tem um grafo de chamadas diferente)')] },
      { id: 'veredito', nome: 'Veredito', descricao: 'Três "não" = agente', tom: 'ink', ms: 1, linhas: [
        L('in', 'veredito: AGENTE (três respostas "não")'),
        L('hint', 'contraste: "analise este arquivo e devolva os riscos" tem passos conhecidos: workflow, uma chamada com saída estruturada')] }
    ];
  };

  var codigoDecidir = [
    'import math', '', '',
    'def decidir(sabe_passos, sabe_ferramentas, caminho_igual):',
    '    """Devolve "agente" só se as três respostas forem não; senão "workflow"."""',
    '    # uma única resposta "sim" já permite escrever o caminho no código',
    '    return "agente"', '', '',
    'def percentil(valores, p):',
    '    """Percentil por posto mais próximo: ordene e pegue o item ceil(p/100*n)."""',
    '    # valores vazios -> ValueError',
    '    return 0.0', '',
    '',
    'custos = [0.05] * 19 + [0.80]',
    'print(decidir(True, True, True), percentil(custos, 50), percentil(custos, 99))', ''].join('\n');
  var testesDecidir = [
    'def test_doze_passos_fixos_continua_workflow():',
    '    assert decidir(True, True, True) == "workflow"', '', '',
    'def test_uma_resposta_sim_basta_para_workflow():',
    '    assert decidir(False, True, False) == "workflow"',
    '    assert decidir(False, False, True) == "workflow"', '', '',
    'def test_tres_nao_e_agente():',
    '    assert decidir(False, False, False) == "agente"', '', '',
    'def test_percentil_mediana_e_cauda():',
    '    custos = [0.05] * 19 + [0.80]',
    '    assert percentil(custos, 50) == 0.05',
    '    assert percentil(custos, 99) == 0.80', '', '',
    'def test_percentil_nao_altera_entrada():',
    '    v = [3, 1, 2]',
    '    assert percentil(v, 100) == 3',
    '    assert v == [3, 1, 2]', '', '',
    'def test_percentil_vazio_falha():',
    '    try:', '        percentil([], 50)', '    except ValueError:', '        return',
    '    raise AssertionError("esperava ValueError")', ''].join('\n');
  var solucaoDecidir = [
    'import math', '', '',
    'def decidir(sabe_passos, sabe_ferramentas, caminho_igual):',
    '    if sabe_passos or sabe_ferramentas or caminho_igual:', '        return "workflow"',
    '    return "agente"', '', '',
    'def percentil(valores, p):',
    '    if not valores:', '        raise ValueError("sem valores")',
    '    ordenados = sorted(valores)',
    '    k = math.ceil(p / 100 * len(ordenados))',
    '    return ordenados[max(k, 1) - 1]', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm08-b1',
    titulo: 'Workflow × agente: quem escolhe o próximo passo',
    minutos: 30,
    resumo: 'Workflow é caminho decidido no código; agente é caminho decidido pelo modelo a cada volta. Três perguntas dizem qual você precisa, e o custo do não determinismo diz por que não escolher agente por reflexo.',
    objetivo: 'Classificar uma tarefa como workflow ou agente pelas três perguntas e explicar o que o não determinismo no fluxo de controle faz com teste, custo, depuração e idempotência.',
    revisao: [
      { id: 'm08b1-def', pergunta: 'Qual é a diferença operacional entre workflow e agente?',
        opcoes: [
          opc('a', 'No workflow o caminho está no código; no agente o modelo decide o próximo passo e o uso de ferramentas, dentro dos limites que você deu', true, 'a diferença não é sofisticação nem número de chamadas de LLM: é quem escolhe o próximo passo.'),
          opc('b', 'Workflow não usa LLM; agente usa', false, 'workflows também orquestram LLMs; só que por caminhos predefinidos.'),
          opc('c', 'Agente é sempre a versão mais avançada do workflow', false, 'agente é escolha de arquitetura com custo, não topo de uma escala.')] },
      { id: 'm08b1-tres', pergunta: 'Uma tarefa tem 12 passos fixos, sempre na mesma ordem, com três chamadas de LLM. O que ela é?',
        opcoes: [
          opc('a', 'Workflow: o critério é conseguir enumerar passos e ferramentas antes de começar, não quantos passos existem', true, 'se a resposta a qualquer das três perguntas é sim, é workflow, mesmo longo.'),
          opc('b', 'Agente, porque 12 passos são complexos demais para código', false, 'complexidade não decide; previsibilidade do caminho decide.'),
          opc('c', 'Agente, sempre que há LLM no meio', false, 'LLM no meio não transfere o controle do fluxo ao modelo.')] },
      { id: 'm08b1-custo', pergunta: 'Por que a mediana de US$ 0,05 por execução não basta para dimensionar o orçamento de um agente?',
        opcoes: [
          opc('a', 'Custo vira distribuição: no p99, quando o agente se perde, pode ser dezenas de vezes maior; o teto é requisito funcional', true, 'a fonte dá o exemplo de US$ 0,05 na mediana e US$ 0,80 no p99; sem teto de passos, tokens e tempo a fatura fica aberta.'),
          opc('b', 'Porque o preço por token muda toda semana', false, 'pode mudar, mas não é a razão: o problema é a cauda da distribuição.'),
          opc('c', 'Porque agentes não têm custo limitável', false, 'têm: impondo tetos de passos, tokens e tempo e medindo p50 e p95.')] },
      { id: 'm08b1-idem', pergunta: 'Por que ferramentas que mudam estado precisam de chave de idempotência num agente?',
        opcoes: [
          opc('a', 'O agente repete chamadas, por retry, confusão ou reexecução do job', true, 'sem a chave, a repetição vira efeito duplicado (o incidente das duas transferências, do M12).'),
          opc('b', 'Porque o modelo não sabe ler JSON', false, 'não é questão de formato.'),
          opc('c', 'Porque agentes só executam uma vez', false, 'é o contrário: repetem.')] },
      { id: 'm08b1-minimizar', pergunta: 'Qual é a conclusão de projeto do bloco sobre a superfície não determinística?',
        opcoes: [
          opc('a', 'Minimizar: cada decisão que sai do modelo e vira código elimina uma classe de falha', true, 'é o oposto do instinto "deixa o agente resolver".'),
          opc('b', 'Maximizar, para o agente se adaptar a tudo', false, 'mais liberdade, mais variância de custo e de caminho.'),
          opc('c', 'Ignorar, porque trace resolve tudo', false, 'trace ajuda a depurar; não remove a causa.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>A confusão de vocabulário custa dinheiro: times constroem agente autônomo para um problema que um <code>if</code> resolveria, pagam cerca de 10x mais, entregam menos confiabilidade e concluem que "IA não funciona". A distinção a que a indústria convergiu (e que o curso adota) é operacional.</p>' +
          '<p>Um <strong>workflow</strong> é um sistema em que LLMs e ferramentas são orquestrados por caminhos de código predefinidos. Um <strong>agente</strong> é um sistema em que o LLM decide dinamicamente o próprio processo e o uso de ferramentas.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th></th><th>Workflow</th><th>Agente</th></tr></thead><tbody>' +
          '<tr><td>Quem decide o próximo passo</td><td>Você, no código</td><td>O modelo, dentro dos limites que você deu</td></tr>' +
          '<tr><td>Custo e latência</td><td>Previsíveis</td><td>Variáveis (e a variância é grande)</td></tr>' +
          '<tr><td>Depuração</td><td>Direta: o caminho é código</td><td>Por <strong>trace</strong>: cada execução é diferente</td></tr>' +
          '<tr><td>Quando brilha</td><td>O problema tem passos conhecidos</td><td>O número de passos e as ferramentas necessárias não podem ser previstos</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Regra de projeto', html:
          '<p>Comece com o prompt mais simples, otimize com avaliação e só adicione complexidade agêntica quando o simples comprovadamente não resolver. Agente não é o topo de uma escala de sofisticação: é uma escolha de arquitetura com custo, e a maioria dos problemas de produção não precisa dela e fica pior com ela.</p>' },
        { tipo: 'texto', html:
          '<h3>Caminho escrito × caminho escolhido</h3>' +
          '<p>Workflow é pipeline com transições escritas: estão no código, e o log mostra por onde passou. Agente é um resolvedor com <em>backtracking</em>: tenta, observa, ajusta. Use o resolvedor quando o trabalho exige julgamento a cada passo, não quando é o mesmo relatório de sempre. O que decide o resultado é a qualidade das ferramentas, dos limites e da revisão, não a inteligência bruta.</p>' +
          '<h3>O bloco básico: o LLM aumentado</h3>' +
          '<p>Todos os padrões do módulo são feitos de uma peça: o <strong>LLM aumentado</strong>, o modelo com três capacidades acopladas, e você já construiu as três.</p>' +
          '<ul><li><strong>Recuperação</strong>: buscar informação sob demanda (M07). O modelo decide o que buscar.</li>' +
          '<li><strong>Ferramentas</strong>: agir sobre o mundo por chamadas estruturadas que o seu código executa (M05, bloco 3). O modelo decide qual usar.</li>' +
          '<li><strong>Memória</strong>: reter algo entre passos e entre sessões (bloco 6). O modelo (ou você) decide o que guardar.</li></ul>' +
          '<p>Em cada uma, o modelo faz a escolha semântica e o seu código faz a execução determinística. Essa divisão é o fator 8 do M01 ("own your control flow") e mantém o sistema depurável.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'WORKFLOW: o caminho está no código',
          '  entrada -> LLM: extrai -> código: valida -> LLM: resume -> saída      (3 passos, sempre)',
          '',
          'AGENTE: o caminho é decidido a cada volta',
          '  objetivo -> LOOP[ planejar -> agir -> observar ] -> saída             (2 a N passos)',
          '              o modelo escolhe a ferramenta; o critério de parada é o orçamento de passos'].join('\n') },
        { tipo: 'takeaway', html: 'A diferença não é sofisticação: é <mark>quem escolhe o próximo passo</mark>, e isso muda <mark>custo, previsibilidade e depuração</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>O critério de decisão</h3>' +
          '<p>Use workflow quando você consegue enumerar os passos. Só é agente quando a resposta às três perguntas abaixo é "não".</p>' +
          '<ol><li>Você sabe quantos passos a tarefa leva? Se sim, é workflow, mesmo que sejam 12 passos.</li>' +
          '<li>Você sabe, antes de começar, quais ferramentas serão necessárias e em que ordem? Se sim, é workflow.</li>' +
          '<li>O caminho é o mesmo para toda entrada? Se sim, é workflow (com roteamento, se houver poucas variantes conhecidas).</li></ol>' +
          '<p>No Capstone: "analise este arquivo e devolva os riscos" é workflow (M05: uma chamada com saída estruturada). "Responda o que quebra se eu mudar este método" é agente: o número de saltos depende de quantas classes chamam o método. Por isso o produto tem os dois, e o mini-projeto do módulo é justamente a pergunta que exige agente.</p>' },
        { tipo: 'rode', id: 'classificar-rode', titulo: 'Aplique as três perguntas à tarefa do agente investigador',
          enunciado: 'Rode o classificador na pergunta do mini-projeto e leia a resposta de cada pergunta. Saída de exemplo ilustrativo, com modelo fake.',
          prefixo: '$', entrada: 'python classificar.py "' + TAREFA + '"', unidade: 'passo', terminalTitulo: 'classificar a tarefa', etapas: etapasClassificar(),
          prever: { pergunta: 'A tarefa é "responda o que quebra se eu mudar este método". Quantas das três perguntas respondem "sim" (permitem escrever o caminho)?', opcoes: [
            { id: 'a', texto: 'Nenhuma: nem o número de passos, nem as ferramentas, nem o caminho são conhecidos de antemão.', correta: true, porque: 'o número de saltos depende de quantas classes chamam o método, e isso só se descobre investigando.' },
            { id: 'b', texto: 'Todas: é sempre buscar o símbolo e ler os usos.', correta: false, porque: 'quantos usos existem e o que ler depois variam por método.' },
            { id: 'c', texto: 'Uma: as ferramentas são sempre as mesmas.', correta: false, porque: 'o conjunto pode ser fixo, mas a pergunta é se você sabe quais serão usadas e em que ordem.' }
          ] },
          tutorAntes: 'Antes do Enter, escolha a previsão: quantos "sim" a tarefa tem?',
          tutorDepois: 'Três "não": só aqui a flexibilidade do agente paga o custo da variância.',
          callout: 'Você aplicou as três perguntas e viu por que o investigador de código é agente.' },
        { tipo: 'texto', html:
          '<h3>O custo do não determinismo</h3>' +
          '<p>Você já pagou esse imposto em concorrência e em sistemas distribuídos. O que muda quando o não determinismo é o fluxo de controle:</p>' +
          '<ul><li><strong>Teste vira amostragem.</strong> Não existe "o" caminho; existe uma distribuição de caminhos. Por isso a suíte do M06 mede taxa sobre N casos em vez de asserção por caso.</li>' +
          '<li><strong>Custo vira distribuição.</strong> O agente que gasta US$ 0,05 na mediana pode gastar US$ 0,80 no p99, o caso em que ele se perde. Orçamento é requisito funcional; sem teto, você tem uma fatura aberta.</li>' +
          '<li><strong>Depuração exige trace, não log.</strong> Reproduzir "o bug" pode ser impossível; resta a árvore de spans do M06 (bloco 5), com a sequência de ferramentas e o estado em cada passo.</li>' +
          '<li><strong>Idempotência deixa de ser recomendação.</strong> O agente vai repetir chamadas (retry, confusão, reexecução do job). Ferramenta que muda estado precisa de chave de idempotência.</li></ul>' +
          '<p>Conclusão de projeto: <strong>minimize a superfície não determinística</strong>. Cada decisão que sai do modelo e vira código é uma classe de falha eliminada.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'As três simplificações que estão erradas', html:
          '<ul><li>"Agente é software não determinístico": é um runtime predominantemente determinístico com ilhas probabilísticas.</li>' +
          '<li>"O framework X torna tudo determinístico": ele controla onde a incerteza pode existir; não a elimina.</li>' +
          '<li>"Prompt é o código do agente": o comportamento é código, prompt, modelo, schemas, tools, estado, políticas e evals. Trocar o prompt achando que o resto se ajusta é a causa nº 1 de regressão silenciosa (M06).</li></ul>' },
        { tipo: 'takeaway', html: 'Com o caminho no modelo, o <mark>teste vira amostragem</mark>, o <mark>custo vira distribuição</mark> e a depuração exige <mark>trace</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Duas peças viram código: a decisão pelas três perguntas e a leitura de custo por percentil, que mostra por que a mediana engana.</p>' },
        { tipo: 'python', id: 'decidir-python', titulo: 'Decida e meça a cauda', obrigatorio: false,
          enunciado: 'Complete <code>decidir(sabe_passos, sabe_ferramentas, caminho_igual)</code>: devolva <code>"agente"</code> só quando as três respostas são <code>False</code>. Depois complete <code>percentil(valores, p)</code> por posto mais próximo (ordene, pegue o item de posição <code>ceil(p/100 * n)</code>, sem alterar a lista) e levante <code>ValueError</code> para lista vazia.',
          codigo: codigoDecidir, testes: testesDecidir,
          dica: 'Em <code>decidir</code>, um <code>or</code> entre as três respostas já basta. Em <code>percentil</code>, use <code>sorted(valores)</code> (que cria cópia) e <code>math.ceil</code>; com p = 0 o índice não pode ficar negativo.',
          solucao: solucaoDecidir,
          tutorDepois: 'Com 19 execuções a US$ 0,05 e uma a US$ 0,80, a mediana diz 0,05 e o p99 diz 0,80: o teto de custo se dimensiona pela cauda.',
          callout: 'O critério e a cauda de custo estão em código.' },
        { tipo: 'cenario', id: 'relatorio-cenario', titulo: 'Pediram um agente para o relatório mensal', obrigatorio: false,
          enunciado: 'A diretoria quer "um agente" que gere todo mês o mesmo relatório de riscos dos repositórios. Escolha como reagir e veja o custo de cada decisão.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O relatório tem sempre as mesmas seções: resumo por arquivo, agregação por módulo, priorização de riscos. O que você faz primeiro?', opcoes: [
              { texto: 'Construir o agente autônomo, porque "agente" é o que a diretoria pediu.', vai: 'f-fatura', tom: 'ruim', consequencia: 'você troca um caminho conhecido por um resolvedor caro e variável.' },
              { texto: 'Aplicar as três perguntas à tarefa.', vai: 'perguntas', tom: 'ok', consequencia: 'passos, ferramentas e caminho são conhecidos: três "sim".' },
              { texto: 'Prometer agente e entregar um único prompt enorme, sem medir nada.', vai: 'f-prompt', tom: 'ruim', consequencia: 'sem avaliação você não sabe se o simples bastava.' }
            ] },
            perguntas: { texto: 'É workflow. Como entregar sem perder a promessa de qualidade?', opcoes: [
              { texto: 'Escrever o pipeline com gates determinísticos entre os passos, medir com eval e só então avaliar se algo exige agência.', vai: 'f-bom', tom: 'ok', consequencia: 'custo previsível, depuração direta e uma linha de base para comparar.' },
              { texto: 'Escrever o pipeline e deixar o último passo escolher livremente as ferramentas.', vai: 'f-fatura', tom: 'ruim', consequencia: 'você reintroduziu não determinismo sem necessidade.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Workflow com gates e eval: previsível, barato e depurável. Agência só entra se a medição mostrar um ponto em que o caminho escrito falha.' },
            'f-fatura': { bom: false, texto: 'A fatura virou distribuição: mediana razoável, cauda cara, e cada execução é diferente de qualquer outra.' },
            'f-prompt': { bom: false, texto: 'O resultado piorou sem que ninguém soubesse por quê: faltou a linha de base medida.' }
          },
          callout: 'Você escolheu workflow, mediu e deixou a agência para onde ela for provada.' },
        { tipo: 'takeaway', html: 'Em dúvida, <mark>três perguntas</mark>; entre dois desenhos, o que tem <mark>menos superfície não determinística</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'conf-doze-passos', titulo: 'Confira: doze passos fixos',
          pergunta: 'Uma tarefa tem 12 passos fixos, sempre na mesma ordem, e envolve três chamadas de LLM. Workflow ou agente?',
          opcoes: [
            { id: 'a', texto: 'Workflow: o critério é conseguir enumerar os passos e as ferramentas antes de começar, não quantos passos existem.', correta: true, porque: 'workflow é caminho decidido no código; o viés do "tudo é agente" custa cerca de 10x mais e entrega menos confiabilidade.' },
            { id: 'b', texto: 'Agente: 12 passos são complexos demais para um caminho escrito em código.', correta: false, porque: 'complexidade não decide; previsibilidade do caminho decide.' },
            { id: 'c', texto: 'Agente: sempre que há LLM no meio, o modelo decide o caminho.', correta: false, porque: 'o modelo pode estar em passos escritos por você, sem controlar o fluxo.' },
            { id: 'd', texto: 'Depende da temperatura configurada.', correta: false, porque: 'temperatura muda a variação das respostas, não quem decide o próximo passo.' }
          ] },
        { tipo: 'escolha', id: 'conf-mediana', titulo: 'Confira: a mediana de custo',
          pergunta: 'O agente custa US$ 0,05 na mediana. Por que isso não basta para dimensionar o orçamento?',
          opcoes: [
            { id: 'a', texto: 'Porque custo vira distribuição: no p99 (o caso em que o agente se perde) pode ser 10x ou mais, e o teto de custo é requisito funcional.', correta: true, porque: 'a resposta de projeto é impor tetos (passos, tokens, tempo) e medir p50 e p95.' },
            { id: 'b', texto: 'Porque a mediana de custo de LLM é sempre enganosa.', correta: false, porque: 'ela é útil; só não descreve a cauda.' },
            { id: 'c', texto: 'Porque o preço por token muda toda semana.', correta: false, porque: 'é um risco à parte; o problema aqui é a variância do caminho.' },
            { id: 'd', texto: 'Porque agentes não têm custo previsível, então não se pode limitá-los.', correta: false, porque: 'dá para limitar: o teto é desenho, não tentativa.' }
          ] },
        { tipo: 'takeaway', html: 'Workflow = <mark>caminho no código</mark>; agente = <mark>caminho escolhido pelo modelo</mark>. Sem teto, agente é <mark>fatura aberta</mark>.' }
      ] }
    ]
  });
})();
