/* M11 · Bloco 8 (aula 5): modelo ≠ agente ≠ harness, avaliar com honestidade e quando fine-tuning é a resposta errada. Fonte: M11.html#b08. Números de custo são calculados em CPython com valores de exemplo (hardware de US$ 3.000, 36 meses, 350 W, US$ 0,15/kWh, 12 tok/s; API hipotética de US$ 10 por Mtok); exemplo variável, não medida. Detalhes do BFCL seguem a confirmar (SRC-M11-18). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var CUSTO = 'python custo_local.py --preco-hw 3000 --vida-meses 36 --watts 350 --kwh 0.15 --tok-s 12 --util 0.05';
  var etapasCusto = function () {
    return [
      { id: 'baixa', nome: 'Utilização 5%', descricao: 'Hardware parado quase o tempo todo', tom: 'dns', ms: 54.8, linhas: [
        L('cmd', CUSTO),
        L('out', 'energia    US$    1.22 / Mtok'),
        L('out', 'hardware   US$   53.58 / Mtok'),
        L('out', 'TOTAL      US$   54.80 / Mtok'),
        L('hint', 'o hardware amortizado domina; a energia é uma fração pequena')] },
      { id: 'alta', nome: 'Utilização 50%', descricao: 'O mesmo hardware, dez vezes mais usado', tom: 'tcp', ms: 6.57, linhas: [
        L('cmd', 'python custo_local.py --preco-hw 3000 --vida-meses 36 --watts 350 --kwh 0.15 --tok-s 12 --util 0.5'),
        L('out', 'energia    US$    1.22 / Mtok'),
        L('out', 'hardware   US$    5.36 / Mtok'),
        L('out', 'TOTAL      US$    6.57 / Mtok'),
        L('hint', 'a energia não mudou; o hardware diluiu por dez porque a utilização subiu por dez')] },
      { id: 'api', nome: 'Contra a API', descricao: 'Preço hipotético de US$ 10 por Mtok', tom: 'ink', ms: 10, linhas: [
        L('in', 'util 5%: US$ 54.80 contra US$ 10.00 hipotéticos da API  ->  local perde'),
        L('in', 'util 50%: US$ 6.57 contra US$ 10.00  ->  local ganha'),
        L('hint', 'sem a utilização declarada o número não significa nada; "grátis" nunca é a conclusão')] }
    ];
  };

  var codigoCusto = [
    'def custo_por_mtok(preco_hw, vida_meses, watts, kwh, tok_s, util=0.25):',
    '    """Devolve (energia, hardware, total) em USD por milhao de tokens de saida."""',
    '    horas = 1_000_000 / tok_s / 3600  # horas de geracao para emitir 1 Mtok',
    '    energia = 0.0    # horas * (watts / 1000) * kwh',
    '    hardware = 0.0   # horas * (preco_hw / horas_uteis), com horas_uteis = vida_meses * 30 * 24 * util',
    '    return energia, hardware, energia + hardware', '', '',
    'def break_even(relatorios_mes, tokens_relatorio, custo_api_mtok, custo_local_mtok, fixo_mensal):',
    '    """Devolve (custo_api, custo_local, veredito) no volume declarado."""',
    '    mtok = relatorios_mes * tokens_relatorio / 1_000_000',
    '    api = 0.0    # mtok * custo_api_mtok',
    '    local = 0.0  # fixo_mensal + mtok * custo_local_mtok',
    '    return api, local, "api"', '', '',
    'print(custo_por_mtok(3000, 36, 350, 0.15, 12, 0.05))', ''].join('\n');
  var testesCusto = [
    'def test_custo_util_baixa():', '    e, h, t = custo_por_mtok(3000, 36, 350, 0.15, 12, 0.05)',
    '    assert abs(e - 1.22) < 0.01 and abs(h - 53.58) < 0.01 and abs(t - 54.80) < 0.01', '', '',
    'def test_util_maior_dilui_o_hardware_e_nao_a_energia():', '    e1, h1, _ = custo_por_mtok(3000, 36, 350, 0.15, 12, 0.05)',
    '    e2, h2, _ = custo_por_mtok(3000, 36, 350, 0.15, 12, 0.5)', '    assert abs(e1 - e2) < 1e-9 and abs(h2 - h1 / 10) < 1e-6', '', '',
    'def test_util_padrao_e_025():', '    a = custo_por_mtok(3000, 36, 350, 0.15, 12)', '    b = custo_por_mtok(3000, 36, 350, 0.15, 12, 0.25)', '    assert a == b', '', '',
    'def test_break_even_volume_baixo_perde_da_api():', '    api, local, v = break_even(200, 20000, 10.0, 1.22, 3000 / 36)',
    '    assert abs(api - 40.0) < 1e-9 and abs(local - 88.2) < 0.1 and v == "api"', '', '',
    'def test_break_even_volume_alto_vira_local():', '    api, local, v = break_even(1000, 20000, 10.0, 1.22, 3000 / 36)',
    '    assert abs(api - 200.0) < 1e-9 and abs(local - 107.7) < 0.2 and v == "local"', '', '',
    'def test_controle_negativo_empate_nao_e_local():', '    # com custos iguais, local nao ganha: o veredito exige local < api',
    '    api, local, v = break_even(1000, 1_000_000, 5.0, 5.0, 0.0)', '    assert api == local and v == "api"', ''].join('\n');
  var solucaoCusto = [
    'def custo_por_mtok(preco_hw, vida_meses, watts, kwh, tok_s, util=0.25):',
    '    horas = 1_000_000 / tok_s / 3600', '    energia = horas * (watts / 1000) * kwh',
    '    horas_uteis = vida_meses * 30 * 24 * util', '    hardware = horas * (preco_hw / horas_uteis)',
    '    return energia, hardware, energia + hardware', '', '',
    'def break_even(relatorios_mes, tokens_relatorio, custo_api_mtok, custo_local_mtok, fixo_mensal):',
    '    mtok = relatorios_mes * tokens_relatorio / 1_000_000', '    api = mtok * custo_api_mtok', '    local = fixo_mensal + mtok * custo_local_mtok',
    '    veredito = "local" if local < api else "api"', '    return api, local, veredito', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm11-b5',
    titulo: 'Modelo, agente e harness: avaliar com honestidade',
    minutos: 40,
    resumo: 'O modelo local que quase funciona em modo agente raramente é um modelo ruim. Desça a escada de diagnóstico, meça o par (modelo, formato), calcule o custo local honesto e trate fine-tuning como o degrau 6 de 6.',
    objetivo: 'Separar modelo, harness e agente, descer a escada de oito degraus antes de trocar de modelo, medir com benchmark honesto, calcular custo local com hardware amortizado e break-even, e explicar por que LoRA/QLoRA não insere fatos.',
    revisao: [
      { id: 'm11b5-tres', pergunta: 'Qual é a diferença entre modelo, harness e agente?',
        opcoes: [
          opc('a', 'O modelo gera tokens; o harness monta o prompt, serializa schemas, faz parse, executa a ferramenta e controla o laço; o agente é o comportamento que emerge dos dois', true, 'empilhar harness sobre um modelo que não cumpre o protocolo não gera agente, só mais lugares onde falhar.'),
          opc('b', 'São sinônimos', false, 'cada um tem um culpado diferente quando algo falha.'),
          opc('c', 'O agente é o modelo com mais parâmetros', false, 'tamanho não define agente.')] },
      { id: 'm11b5-escada', pergunta: 'O modelo local "quase funciona" em modo agente. Qual é a primeira ação?',
        opcoes: [
          opc('a', 'Descer a escada de diagnóstico: template e contexto truncado antes de culpar o modelo ou pensar em fine-tuning', true, 'a escada vai do mais barato e provável para o mais caro e improvável, o inverso da intuição; "o modelo é ruim" é o degrau 8, depois de 1 a 7 com número.'),
          opc('b', 'Fazer fine-tuning LoRA com exemplos de tool calling', false, 'fine-tuning é o degrau 6 de 6 da outra escada, e a primeira coisa a testar é a integração.'),
          opc('c', 'Trocar imediatamente por um modelo maior', false, 'só depois de 1 a 7, com número.')] },
      { id: 'm11b5-formato', pergunta: 'O que o BFCL V4 recomenda sobre o formato das tools, e o que isso implica para o seu eval?',
        opcoes: [
          opc('a', 'Documentar as tools em JSON Schema e pedir retorno em JSON (a tendência observada é JSON > XML > Python na documentação); um eval com um único formato mede o par (modelo, formato), não o modelo', true, 'parte do que parece "modelo ruim" é a integração. Detalhes de versão e contagens seguem a confirmar (SRC-M11-18).'),
          opc('b', 'Usar XML verboso, porque modelos pequenos o preferem', false, 'XML teve queda significativa, em modelos menores e na família Claude, quando pedido como retorno.'),
          opc('c', 'O formato não importa: a acurácia é a mesma', false, 'a acurácia do mesmo modelo muda conforme o formato de apresentação.')] },
      { id: 'm11b5-custo', pergunta: 'Quando o modelo local sai mais caro que a API, e por que escolhê-lo mesmo assim?',
        opcoes: [
          opc('a', 'Em baixo volume e baixa utilização, com hardware amortizado; escolhe-se por dados que não podem sair, volume alto o bastante para diluir o hardware e custo previsível', true, 'nunca por ser "de graça"; o break-even em relatórios por mês decide.'),
          opc('b', 'Nunca: local é sempre mais barato', false, 'a energia é pequena, mas o hardware amortizado domina em baixa utilização.'),
          opc('c', 'Sempre, e por isso evite local', false, 'há três motivos legítimos para escolher local.')] },
      { id: 'm11b5-lora', pergunta: 'O cliente pede fine-tuning para o modelo "aprender a nossa base de conhecimento". Qual é a resposta?',
        opcoes: [
          opc('a', 'Ferramenta errada: fine-tuning ajusta distribuição e comportamento, não insere fatos de forma confiável; conhecimento novo entra por RAG (degrau 3 da escada)', true, 'o risco é um modelo que alucina com o estilo dos seus dados; LoRA serve a comportamento e formato em altíssimo volume.'),
          opc('b', 'Certo: LoRA é a forma mais barata de inserir conhecimento', false, 'o mecanismo é ajuste de distribuição, não inserção em base de dados.'),
          opc('c', 'Certo, desde que o posto r seja 64 ou mais', false, 'maior posto não é melhor e não muda o tipo de problema que ele resolve.')] }
    ],
    abas: [
      { rotulo: 'Modelo, harness e agente', blocos: [
        { tipo: 'texto', html:
          '<h3>Três coisas, três culpados</h3>' +
          '<p>Você vai viver esta cena: pluga um modelo local bem avaliado em código dentro do seu harness de agente (o loop do M08, o servidor MCP do M09 ou uma ferramenta de linha de comando) e ele responde bem em conversa. Em modo agente ele <em>quase</em> funciona: chama a ferramenta com um argumento a menos, repete a mesma chamada três vezes ou escreve a chamada como texto no meio da resposta em vez de emitir a estrutura. O diagnóstico da internet é "põe um agente melhor em cima". Está errado, e custa semanas.</p>' +
          '<p>O <strong>modelo</strong> gera tokens. O <strong>harness</strong> é a máquina em volta: monta o prompt, serializa os schemas, faz o parse da saída, executa a ferramenta, devolve o resultado e controla o laço. O <strong>agente</strong> é o comportamento que emerge dos dois juntos. Empilhar mais harness sobre um modelo que não cumpre o protocolo não gera agente: gera mais lugares onde falhar.</p>' },
        { tipo: 'texto', html:
          '<h3>As sete competências que o modo agente exige</h3>' +
          '<p>Benchmark de código mede uma coisa: dado um enunciado, sai código correto. O modo agente exige outro conjunto, e a correlação entre os dois é mais fraca do que a intuição sugere.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Competência</th><th>O que é</th><th>Como falha na prática</th></tr></thead><tbody>' +
          '<tr><td><strong>Instruction following</strong></td><td>Obedecer restrições explícitas do system prompt</td><td>Ignora "responda só com JSON" e escreve um parágrafo antes</td></tr>' +
          '<tr><td><strong>Tool calling</strong></td><td>Emitir a chamada no formato estrutural que o harness espera</td><td>Escreve a chamada como texto em vez de emitir a estrutura</td></tr>' +
          '<tr><td><strong>Structured output</strong></td><td>Produzir JSON válido</td><td>Vírgula sobrando, aspas simples, markdown em volta</td></tr>' +
          '<tr><td><strong>Aderência a schema</strong></td><td>Respeitar campos obrigatórios, tipos e enums</td><td>JSON válido mas com campo faltando ou enum inventado</td></tr>' +
          '<tr><td><strong>Estado multi-turno</strong></td><td>Lembrar o que já foi feito ao longo de 10+ turnos</td><td>Repete a mesma chamada que já executou dois turnos atrás</td></tr>' +
          '<tr><td><strong>Contexto longo</strong></td><td>Usar informação no meio de um contexto grande</td><td>Usa o começo e o fim, perde o meio</td></tr>' +
          '<tr><td><strong>Planejamento e seleção de ferramenta</strong></td><td>Escolher a ferramenta e a ordem certas; parar quando terminou</td><td>Chama <code>buscar</code> quando deveria chamar <code>ler</code>; não sabe parar</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'O que é o Berkeley Function Calling Leaderboard', html:
          '<p>Benchmark público do grupo Gorilla, em Berkeley, dedicado a medir <em>chamada de função</em>, não código. Evoluiu em quatro gerações: a <strong>V1</strong> introduziu avaliação por AST (compara a árvore sintática da chamada gerada com a esperada, em vez de casar strings); a <strong>V2</strong> trouxe funções reais contribuídas por empresas; a <strong>V3</strong> adicionou interações multi-turno; a <strong>V4</strong> (abril de 2026) passou a avaliação agêntica holística, com busca na web, memória e sensibilidade a formato. Reporta acurácia, <strong>custo</strong> em dólares e <strong>latência</strong> em segundos, e separa modelos com suporte nativo a function calling (FC) dos induzidos por prompt. Detalhes de versão e contagens seguem a confirmar contra o repositório do benchmark (SRC-M11-18).</p>' },
        { tipo: 'texto', html:
          '<h3>Sensibilidade a formato: a descoberta que muda o diagnóstico</h3>' +
          '<p>A pergunta é enganosamente simples: o mesmo modelo, na mesma tarefa, com a mesma informação apresentada em formato diferente, muda a acurácia? Deveria ser não. É sim. O BFCL V4 testa cinco dimensões em 26 configurações de prompt (formato de retorno, formato da documentação das funções, tags de tool call, texto puro ou Markdown, enunciado original ou reformulado). Os achados:</p>' +
          '<ul><li><strong>Formato de retorno:</strong> Python e JSON produzem acurácia mais alta que qualquer variante XML; modelos menores e a família Claude caíram de forma significativa quando o retorno era pedido em XML.</li>' +
          '<li><strong>Formato da documentação:</strong> tendência consistente em quase todos os modelos, <strong>JSON &gt; XML &gt; Python</strong>. Documentar as ferramentas em JSON Schema é escolha mensurável, não estética.</li>' +
          '<li><strong>Tags de tool call:</strong> impacto pequeno na média, mas modelos pequenos (faixa de 8B) sofreram queda significativa.</li>' +
          '<li><strong>Markdown contra texto puro e reformulação do enunciado:</strong> comportamento robusto, sem tendência geral.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'A consequência que reorganiza o diagnóstico', html:
          '<p>Se a acurácia do mesmo modelo muda conforme o formato, <strong>uma fração do que você atribuiria a "modelo ruim" é a sua integração</strong>. Antes de trocar de modelo, troque de formato: documente as tools em JSON Schema, peça retorno em JSON e não em XML, e evite envelopes exóticos com modelos pequenos. É barato, reversível e frequentemente resolve. E há um corolário: <strong>um eval de tool calling que testa um único formato mede o par (modelo, formato), não o modelo.</strong> O mecanismo de avaliação por AST ignora a ordem das chaves e compara nome, chaves e tipos da chamada, não a string.</p>' },
        { tipo: 'takeaway', html: 'Modelo, harness e agente têm <mark>culpados diferentes</mark>; um eval de um formato só mede o <mark>par (modelo, formato)</mark>.' }
      ] },

      { rotulo: 'A escada de diagnóstico', blocos: [
        { tipo: 'texto', html:
          '<h3>Do mais barato e provável ao mais caro e improvável</h3>' +
          '<p>Quando o modelo local "não funciona em modo agente", desça esta escada na ordem. É a ordem oposta à que a intuição sugere.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>#</th><th>Hipótese</th><th>Como verificar</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>1</td><td>Chat template errado ou ausente</td><td>Inspecionar o template declarado pelo servidor e comparar com o cartão no Hub</td><td>Usar a tag <em>instruct</em> correta, não a <em>base</em></td></tr>' +
          '<tr><td>2</td><td>Contexto truncado em silêncio</td><td>Contar tokens do prompt e comparar com <code>num_ctx</code></td><td><code>num_ctx</code> do servidor (Bloco 7)</td></tr>' +
          '<tr><td>3</td><td>Modelo sem suporte nativo a tools</td><td>Ver o cartão; testar uma chamada trivial com <code>tools</code></td><td>Trocar por variante que suporte; não emular por prompt se puder evitar</td></tr>' +
          '<tr><td>4</td><td>Formato da documentação das tools</td><td>Trocar a doc de Python/XML para JSON Schema e reexecutar o eval</td><td>Padronizar em JSON Schema (achado do BFCL V4)</td></tr>' +
          '<tr><td>5</td><td>Stop tokens errados: gera além do fim</td><td>Olhar a saída crua: ele continua e simula o turno do usuário?</td><td>Corrigir o template e o stop no Modelfile</td></tr>' +
          '<tr><td>6</td><td>Quantização agressiva demais</td><td>Rodar o mesmo eval em Q8_0 e comparar</td><td>Subir o quant (Bloco 6: raciocínio cai primeiro)</td></tr>' +
          '<tr><td>7</td><td>Prompt e schemas grandes demais para um modelo pequeno</td><td>Reduzir de 12 tools para 4 e reexecutar</td><td>Menos ferramentas, nomes melhores, descrições curtas</td></tr>' +
          '<tr><td>8</td><td>O modelo é ruim nisto mesmo</td><td>Só depois de 1 a 7, com número</td><td>Trocar de modelo, ou manter esta etapa em API</td></tr>' +
          '</tbody></table>' },
        { tipo: 'ordene', id: 'm11b5-ordene', titulo: 'Monte a escada de diagnóstico', obrigatorio: false,
          enunciado: 'Ponha os oito degraus na ordem em que você os testa, do mais barato e provável ao mais caro e improvável.',
          itens: [
            { id: 'd', texto: 'Formato da documentação das tools: trocar Python/XML por JSON Schema e rerrodar o eval' },
            { id: 'g', texto: 'Prompt e schemas grandes demais para um modelo pequeno: reduzir de 12 para 4 tools' },
            { id: 'a', texto: 'Chat template errado ou ausente: comparar com o cartão do modelo' },
            { id: 'h', texto: 'Só então, com número: o modelo é ruim nisto, trocar de modelo ou manter a etapa em API' },
            { id: 'c', texto: 'Modelo sem suporte nativo a tools: testar uma chamada trivial' },
            { id: 'f', texto: 'Quantização agressiva demais: rodar o mesmo eval em Q8_0' },
            { id: 'b', texto: 'Contexto truncado em silêncio: contar tokens do prompt contra o num_ctx' },
            { id: 'e', texto: 'Stop tokens errados: olhar a saída crua e ver se ele simula o turno do usuário' }
          ],
          solucao: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          dica: 'Comece pelo que não custa nada e é mais provável: serialização (template, contexto), depois suporte e formato. Trocar de modelo é o último.',
          tutorDepois: 'Os quatro primeiros são de integração, não de modelo. "O modelo é ruim" só vale com número, depois de 1 a 7.',
          callout: 'Escada na ordem certa: integração primeiro, troca de modelo por último.' },
        { tipo: 'callout', tom: 'info', titulo: 'Benchmark honesto: quatro regras', html:
          '<p><strong>(1) Mesma carga:</strong> mesmos prompts, mesmo contexto, mesma ordem; comparar local com prompt curto contra API com prompt longo não compara nada. <strong>(2) Aquecimento e repetição:</strong> descarte a primeira execução (carga do modelo, cache frio), rode N vezes e reporte p50 <em>e</em> p95, porque a média esconde a cauda que o usuário sente. <strong>(3) Dispersão:</strong> "45 tok/s" sem intervalo é propaganda; "45 ± 6 tok/s em 20 execuções" é medição. <strong>(4) Fronteira:</strong> declare hardware exato, quantização, contexto, concorrência e versão do servidor, ou o número não é reproduzível nem por você daqui a um mês. É a disciplina de um teste de carga de API.</p>' },
        { tipo: 'texto', html:
          '<h3>A matriz API × local</h3>' +
          '<p>O runner de evals do M06 é parametrizado por provedor e grava um <code>ResultadoExec</code> por combinação (provedor, modelo, quant, aprovados, total, p50, p95, custo), que a referência <code>lab/matriz_local.py</code> imprime como tabela Markdown. A matriz cruza três configurações (API, local-Q4, local-Q8) com sete categorias: as seis do M06 mais a abstenção do Bloco 5. O padrão que quase sempre aparece é <strong>extração estruturada</strong> com queda pequena no local, <strong>tool calling multi-turno</strong> com queda grande, <strong>abstenção</strong> imprevisível e <strong>latência p95</strong> pior no local. Números aqui são exemplo variável: o valor do exercício está no número real da <em>sua</em> tarefa no <em>seu</em> hardware.</p>' +
          '<p>Para isolar o formato, rode o experimento do BFCL em escala reduzida: o mesmo modelo local, a mesma categoria de tool calling, duas documentações (JSON Schema contra assinatura Python). Se houver diferença, parte do que parecia "modelo ruim" era formato, e o delta justifica padronizar as descrições de tool do M08 e do M09 em JSON Schema.</p>' },
        { tipo: 'takeaway', html: 'Desça a escada <mark>na ordem</mark>, meça com <mark>mesma carga, p50/p95, dispersão e fronteira</mark>; trocar de modelo é o degrau 8.' }
      ] },

      { rotulo: 'Custo local honesto', blocos: [
        { tipo: 'texto', html:
          '<h3>Hardware amortizado mais energia</h3>' +
          '<p>O custo local honesto é <strong>hardware amortizado mais energia, por milhão de tokens de saída</strong>, com a vazão medida e a utilização declarada. Na referência <code>lab/custo_local.py</code>: <code>horas = 1_000_000 / tok_s / 3600</code>; <code>energia = horas · kW · preço do kWh</code>; <code>hardware = horas · preço_hw / (vida_meses · 30 · 24 · util)</code>. A utilização padrão é 0,25. Sem declarar a utilização o número não significa nada. Os valores abaixo são de exemplo: hardware de US$ 3.000, 36 meses, 350 W, US$ 0,15 por kWh e 12 tokens por segundo.</p>' },
        { tipo: 'rode', id: 'm11b5-rode', titulo: 'Quanto custa um milhão de tokens locais', enunciado: 'O mesmo hardware com duas utilizações. A barra mostra o total em US$ por milhão de tokens (Mtok). A API de comparação é hipotética: US$ 10 por Mtok.',
          prefixo: '$', entrada: CUSTO, unidade: 'US$/Mtok', terminalTitulo: 'custo_local', etapas: etapasCusto(),
          prever: { pergunta: 'Com utilização de 5% o hardware fica parado quase todo o tempo. Quanto pesa o hardware amortizado no total?', opcoes: [
            { id: 'a', texto: 'Quase nada: a energia domina.', correta: false, porque: 'a energia é a mesma nas duas utilizações (US$ 1,22 por Mtok); o que muda é o hardware.' },
            { id: 'b', texto: 'Metade e metade.', correta: false, porque: 'com 5% de utilização o hardware amortizado é muito maior que a energia.' },
            { id: 'c', texto: 'Quase tudo: dezenas de dólares por Mtok, bem acima da API hipotética de US$ 10.', correta: true, porque: 'US$ 53,58 de hardware contra US$ 1,22 de energia: em baixo volume, local é mais caro que API.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em cada etapa; compare o campo "hardware" nas duas utilizações.',
          tutorDepois: 'A energia ficou parada em US$ 1,22 e o hardware caiu de 53,58 para 5,36 quando a utilização subiu dez vezes. A conclusão desconforta e é a correta: em volume baixo, local é mais caro que API. Local ganha por três outros motivos, nunca por ser "de graça".',
          callout: 'Você viu a utilização decidir se local custa mais ou menos que a API.' },
        { tipo: 'callout', tom: 'info', titulo: 'Três motivos legítimos para escolher local', html:
          '<ul><li><strong>Dados que não podem sair</strong> da rede do cliente.</li><li><strong>Volume alto</strong> o bastante para diluir o hardware.</li><li><strong>Custo previsível</strong>, em vez de fatura proporcional ao uso.</li></ul>' +
          '<p>O ponto de equilíbrio (<code>break_even</code>) compara, no volume declarado em relatórios por mês, o custo da API com o fixo mensal do local mais o custo marginal por Mtok. O veredito é <code>local</code> só quando o local custa estritamente menos; o resultado fecha o ADR-0005 e é material de proposta comercial.</p>' },
        { tipo: 'takeaway', html: 'Local custa <mark>hardware amortizado + energia</mark>; perde em baixo volume e vence por <mark>confidencialidade, volume e previsibilidade</mark>.' }
      ] },

      { rotulo: 'Fine-tuning e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>LoRA, QLoRA e por que o degrau 6 quase nunca é o certo</h3>' +
          '<p>Fine-tuning é continuar treinando um modelo pronto com dados seus. Com todos os pesos, exige memória para pesos, gradientes e estados do otimizador: na prática, algo como <strong>12 a 16 bytes por parâmetro</strong>, mais de 100 GB para um 8B. <strong>LoRA</strong> (<em>Low-Rank Adaptation</em>) congela os pesos e treina, ao lado de cada matriz <code>W</code> (<code>d×k</code>), duas pequenas <code>A</code> (<code>d×r</code>) e <code>B</code> (<code>r×k</code>), com <code>r</code> tipicamente 8, 16 ou 32. A saída vira <code>W·x + (α/r)·B·A·x</code>; os parâmetros treináveis caem para tipicamente menos de 1% e o adaptador ocupa dezenas de MB. <strong>QLoRA</strong> carrega o modelo-base já quantizado em 4 bits (congelado) e treina adaptadores LoRA por cima, o que faz um 8B caber numa GPU de consumo. A hipótese por trás: a <em>atualização</em> necessária para adaptar a uma tarefa tem posto baixo.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: '# Ilustrativo, com a biblioteca peft; sem treino, sem GPU, sem rede\nfrom peft import LoraConfig, get_peft_model\nfrom transformers import AutoModelForCausalLM\n\nbase = AutoModelForCausalLM.from_pretrained("modelo/base")   # + quantizacao 4-bit no QLoRA\n\ncfg = LoraConfig(\n    r=16,                        # posto. 8-32 cobre quase tudo; maior nao e melhor\n    lora_alpha=32,               # escala = alpha/r; convencao comum e alpha = 2r\n    lora_dropout=0.05,\n    target_modules="all-linear", # estilo QLoRA; o default atinge so q_proj e v_proj\n    bias="none",\n    task_type="CAUSAL_LM",\n    use_rslora=False,            # True troca a escala para alpha/sqrt(r)\n)\nmodelo = get_peft_model(base, cfg)\nmodelo.print_trainable_parameters()\n# exemplo variavel: trainable% abaixo de 1%\n# depois de treinar, para servir sem overhead: modelo.merge_and_unload()' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>#</th><th>Degrau</th><th>Resolve</th><th>Custo</th><th>Reversível?</th></tr></thead><tbody>' +
          '<tr><td>1</td><td>Melhorar o prompt e os exemplos (few-shot)</td><td>Formato, tom, estrutura da saída</td><td>Horas</td><td>Sim, na hora</td></tr>' +
          '<tr><td>2</td><td>Structured output / grammar</td><td>Aderência a schema</td><td>Horas</td><td>Sim</td></tr>' +
          '<tr><td>3</td><td><strong>RAG</strong> (M07)</td><td><strong>Conhecimento que o modelo não tem</strong></td><td>Dias</td><td>Sim: troca o índice</td></tr>' +
          '<tr><td>4</td><td>Ferramenta / código determinístico</td><td>Exatidão: contas, contagens, consultas</td><td>Dias</td><td>Sim</td></tr>' +
          '<tr><td>5</td><td>Modelo maior ou melhor</td><td>Raciocínio insuficiente</td><td>Dinheiro por chamada</td><td>Sim</td></tr>' +
          '<tr><td>6</td><td><strong>Fine-tuning (LoRA)</strong></td><td><strong>Comportamento e formato muito específicos, repetidos em altíssimo volume</strong></td><td>Semanas + dados + manutenção perpétua</td><td>Não de graça</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Os quatro motivos pelos quais o degrau 6 quase nunca é o certo', html:
          '<ul><li><strong>Não ensina fatos de forma confiável.</strong> O mecanismo é ajuste de distribuição, não inserção em base de dados. Conhecimento novo entra por RAG; forçá-lo por fine-tuning produz um modelo que alucina com o <em>estilo</em> dos seus dados, pior que antes.</li>' +
          '<li><strong>Esquecimento catastrófico.</strong> Ao especializar, o modelo piora no que fazia bem, e só os evals abrangentes do M06 mostram o que quebrou.</li>' +
          '<li><strong>O custo real é a manutenção.</strong> O adaptador é acoplado a uma versão do modelo-base; quando sai a próxima, você retreina, revalida e possivelmente rotula de novo. É dívida recorrente, não artefato.</li>' +
          '<li><strong>Dados são o gargalo.</strong> LoRA precisa de milhares de exemplos consistentes e de alta qualidade; 200 exemplos rendem mais como few-shot ou como conjunto de eval.</li></ul>' +
          '<p><strong>Quando é o certo:</strong> três sinais juntos. Você subiu os cinco degraus anteriores e mediu; o volume é alto o bastante para a economia por chamada pagar o retreino; e o que se quer é comportamento ou formato consistente, não conhecimento. Exemplo legítimo no Cartógrafo: relatório final com formato rígido e proprietário, dezenas de milhares por mês; um LoRA pequeno de formatação pode valer, e o conhecimento continua vindo do grafo e do RAG.</p>' },
        { tipo: 'python', id: 'm11b5-python', titulo: 'Custo por Mtok e ponto de equilíbrio', obrigatorio: false,
          enunciado: 'Complete <code>custo_por_mtok</code> (devolve <code>(energia, hardware, total)</code>) e <code>break_even</code> (devolve <code>(custo_api, custo_local, veredito)</code>). O veredito é <code>"local"</code> só se o local for estritamente mais barato.',
          codigo: codigoCusto, testes: testesCusto,
          dica: 'energia = <code>horas * (watts / 1000) * kwh</code>; hardware = <code>horas * (preco_hw / horas_uteis)</code> com <code>horas_uteis = vida_meses * 30 * 24 * util</code>. No equilíbrio: api = <code>mtok * custo_api_mtok</code>, local = <code>fixo_mensal + mtok * custo_local_mtok</code>.',
          solucao: solucaoCusto,
          tutorDepois: 'Com os valores de exemplo, 200 relatórios por mês de 20 mil tokens dão veredito api (US$ 40 contra US$ 88); com 1000 por mês o veredito vira local (US$ 200 contra US$ 108). O controle negativo mostra que empate não é vitória do local.',
          callout: 'O custo local honesto e o break-even agora estão em código.' },
        { tipo: 'cenario', id: 'm11b5-cenario', titulo: 'O cliente pede fine-tuning', obrigatorio: false,
          enunciado: 'Um cliente quer que o modelo "aprenda a nossa base de conhecimento" e pede fine-tuning. Responda como consultor.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O modelo não conhece a API interna do cliente e erra os nomes dos métodos. O cliente já tem o orçamento aprovado para treinar. O que você propõe?', opcoes: [
              { texto: 'Treinar um LoRA com a documentação da API.', vai: 'f-estilo', tom: 'ruim', consequencia: 'o modelo passa a alucinar com o estilo dos dados do cliente.' },
              { texto: 'Indexar a documentação com RAG e medir antes de qualquer treino.', vai: 'rag', tom: 'ok', consequencia: 'conhecimento novo entra por recuperação, reversível em dias.' },
              { texto: 'Trocar por um modelo maior e esperar que ele já conheça a API.', vai: 'f-maior', tom: 'ruim', consequencia: 'pagou por chamada e o modelo continua sem conhecer a API interna.' }
            ] },
            rag: { texto: 'O RAG resolveu os nomes de método. O relatório final, porém, precisa de um formato proprietário rígido e é gerado em dezenas de milhares por mês. O que decide?', opcoes: [
              { texto: 'Subir os degraus 1 a 5 e medir; se o formato ainda falhar e o volume pagar o retreino, avaliar um LoRA de formatação.', vai: 'f-bom', tom: 'ok', consequencia: 'o degrau 6 só entra com os três sinais juntos e o conhecimento continua no RAG.' },
              { texto: 'Treinar já um LoRA, sem medir os degraus anteriores.', vai: 'f-divida', tom: 'ruim', consequencia: 'você assinou uma dívida de manutenção que um prompt com exemplos talvez resolvesse em horas.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Conhecimento por RAG, formato por prompt ou, se medido e justificado, por um LoRA pequeno de formatação.' },
            'f-estilo': { bom: false, texto: 'O modelo respondeu com confiança sobre métodos que não existem, no estilo da documentação.' },
            'f-maior': { bom: false, texto: 'A fatura subiu e a API interna continuou desconhecida.' },
            'f-divida': { bom: false, texto: 'Na próxima versão do modelo-base o adaptador precisou ser retreinado e revalidado do zero.' }
          },
          callout: 'Você separou conhecimento (RAG) de comportamento (fine-tuning).' },
        { tipo: 'escolha', id: 'm11b5-esc-escada', titulo: 'Confira: a primeira ação',
          pergunta: 'O modelo local "quase funciona" em modo agente. Qual é a primeira ação segundo o bloco?',
          opcoes: [
            { id: 'a', texto: 'Fazer fine-tuning LoRA com exemplos de tool calling.', correta: false, porque: 'é o degrau 6 de 6 da escada de decisão e ataca a categoria errada de problema.' },
            { id: 'b', texto: 'Descer a escada de diagnóstico: chat template e contexto truncado antes de culpar o modelo ou pensar em fine-tuning.', correta: true, porque: 'a escada vai do mais barato e provável ao mais caro e improvável. "O modelo é ruim nisto mesmo" é o degrau 8, depois de 1 a 7 com número.' },
            { id: 'c', texto: 'Trocar imediatamente por um modelo maior.', correta: false, porque: 'só depois dos degraus de integração, com número.' },
            { id: 'd', texto: 'Aumentar a temperatura para variar as chamadas.', correta: false, porque: 'a variação não conserta serialização, contexto ou formato.' }
          ], tutorDepois: 'Integração primeiro; modelo por último.' },
        { tipo: 'escolha', id: 'm11b5-esc-lora', titulo: 'Confira: LoRA e conhecimento',
          pergunta: '"O modelo não conhece a nossa API interna." Fine-tuning com LoRA é a resposta certa?',
          opcoes: [
            { id: 'a', texto: 'Não: fine-tuning ajusta distribuição e comportamento, não insere fatos de forma confiável; conhecimento novo entra por RAG (degrau 3 da escada).', correta: true, porque: 'fine-tuning é o degrau 6 de 6: semanas, dados e manutenção perpétua, e não é reversível de graça. Serve a comportamento e formato muito específicos em altíssimo volume.' },
            { id: 'b', texto: 'Sim: LoRA é a forma mais barata de inserir conhecimento.', correta: false, porque: 'o mecanismo é ajuste de distribuição, não inserção em base de dados.' },
            { id: 'c', texto: 'Sim, desde que o posto r seja 64 ou mais.', correta: false, porque: 'maior posto não é melhor e não muda o tipo de problema resolvido.' },
            { id: 'd', texto: 'Sim, porque RAG não funciona com modelos locais.', correta: false, porque: 'RAG independe de o modelo ser local.' }
          ], tutorDepois: 'Fato novo entra por RAG ou ferramenta, não por fine-tuning.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes do bloco: BFCL/gorilla (SRC-M11-18), com detalhes de versão e contagens a confirmar contra o repositório e sem número herdado como evidência, risco alto, revalidar em até 90 dias; LoRA (SRC-M11-12), risco baixo; PEFT da Hugging Face (SRC-M11-14), risco médio. Consulta de 14/09/2026. Valores de custo e fração treinável são exemplo variável; servidor, pesos e API de comparação pertencem à trilha externa, onde nascem BLOCKED se ausentes.</p>' },
        { tipo: 'takeaway', html: 'Fine-tuning é o <mark>degrau 6 de 6</mark>: ajusta <mark>comportamento e formato</mark>; fato novo entra por <mark>RAG ou ferramenta</mark>.' }
      ] }
    ]
  });
})();
