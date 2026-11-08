/* M05 · Bloco 7: FinOps de IA. Fonte: M05.html#b07. Preços: retrato ago/2026 (revalidar em 90 dias). Exemplos de custo são calculados com a fórmula e a tabela, não medidos. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoFin = [
    'from decimal import Decimal',
    '',
    'ESCRITA = Decimal("1.25")   # TTL de 5 min',
    'LEITURA = Decimal("0.10")',
    '',
    '',
    'def custo_request(uso, preco_in, preco_out):',
    '    """uso: dict com novos, escritos, lidos, saida (tokens). Preços em US$ por milhão.',
    '    custo = novos x in + escritos x in x 1,25 + lidos x in x 0,10 + saida x out."""',
    '    return Decimal(0)',
    '',
    '',
    'def percentil(valores, p):',
    '    """Percentil por posto mais próximo: o valor na posição ceil(p/100 x n) da lista ordenada.',
    '    p=100 é o máximo."""',
    '    return None',
    '',
    '',
    'def decidir(gasto, orcamento, estimado):',
    '    """Circuit breaker de custo por tenant, ANTES da chamada.',
    '    gasto + estimado > orcamento -> "402"; >= 80% do orçamento -> "alerta"; senão "ok"."""',
    '    return "ok"',
    ''].join('\n');

  var testesFin = [
    'def test_custo_de_um_request_com_cache():',
    '    uso = {"novos": 500, "escritos": 0, "lidos": 10000, "saida": 400}',
    '    # 500x2 + 10000x2x0,10 + 400x10 = 1000 + 2000 + 4000 = 7000 / 1e6',
    '    assert custo_request(uso, Decimal("2"), Decimal("10")) == Decimal("0.007")',
    '',
    '',
    'def test_escrita_custa_125():',
    '    uso = {"novos": 0, "escritos": 10000, "lidos": 0, "saida": 0}',
    '    assert custo_request(uso, Decimal("2"), Decimal("10")) == Decimal("0.025")',
    '',
    '',
    'def test_saida_pesa_cinco_vezes_a_entrada():',
    '    ent = {"novos": 1000, "escritos": 0, "lidos": 0, "saida": 0}',
    '    sai = {"novos": 0, "escritos": 0, "lidos": 0, "saida": 1000}',
    '    assert custo_request(sai, Decimal("2"), Decimal("10")) == 5 * custo_request(ent, Decimal("2"), Decimal("10"))',
    '',
    '',
    'def test_a_cauda_nao_aparece_na_media():',
    '    custos = [Decimal("0.01")] * 19 + [Decimal("1.00")]',
    '    assert percentil(custos, 50) == Decimal("0.01")',
    '    assert percentil(custos, 100) == Decimal("1.00")',
    '    assert sum(custos) / len(custos) > Decimal("0.05")',
    '',
    '',
    'def test_percentil_com_um_valor():',
    '    assert percentil([Decimal("5")], 95) == Decimal("5")',
    '',
    '',
    'def test_circuit_breaker_por_tenant():',
    '    assert decidir(Decimal("10"), Decimal("100"), Decimal("1")) == "ok"',
    '    assert decidir(Decimal("80"), Decimal("100"), Decimal("1")) == "alerta"',
    '    assert decidir(Decimal("99.5"), Decimal("100"), Decimal("1")) == "402"',
    ''].join('\n');

  var solucaoFin = [
    'from decimal import Decimal',
    'from math import ceil',
    '',
    'ESCRITA = Decimal("1.25")',
    'LEITURA = Decimal("0.10")',
    '',
    '',
    'def custo_request(uso, preco_in, preco_out):',
    '    total = (uso["novos"] * preco_in',
    '             + uso["escritos"] * preco_in * ESCRITA',
    '             + uso["lidos"] * preco_in * LEITURA',
    '             + uso["saida"] * preco_out)',
    '    return total / Decimal(1_000_000)',
    '',
    '',
    'def percentil(valores, p):',
    '    ordenados = sorted(valores)',
    '    posto = max(1, ceil(p / 100 * len(ordenados)))',
    '    return ordenados[posto - 1]',
    '',
    '',
    'def decidir(gasto, orcamento, estimado):',
    '    total = gasto + estimado',
    '    if total > orcamento:',
    '        return "402"',
    '    if total >= orcamento * Decimal("0.8"):',
    '        return "alerta"',
    '    return "ok"',
    ''].join('\n');

  var etapasFin = function () {
    return [
      { id: 'uso', nome: 'Uso do request', descricao: 'Tokens que o provedor cobrou', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'custo_request(uso, in=2, out=10)   # Sonnet 5, US$ por milhão (ago/2026)'),
        L('info', 'uso: novos=500, escritos=0, lidos=10.000, saida=400')] },
      { id: 'entrada', nome: 'Entrada', descricao: 'Tokens novos e lidos do cache', tom: 'request', ms: 3, linhas: [
        L('out', 'novos:  500 x 2 / 1e6        = US$ 0,001'),
        L('out', 'lidos:  10.000 x 2 x 0,10 / 1e6 = US$ 0,002')] },
      { id: 'saida', nome: 'Saída', descricao: 'O token caro: 5x o de entrada', tom: 'response', ms: 4, linhas: [
        L('out', 'saida:  400 x 10 / 1e6       = US$ 0,004'),
        L('hint', 'a saída (400 tokens) custa mais que os 10.500 tokens de entrada somados')] },
      { id: 'mes', nome: 'Custo mensal', descricao: 'custo médio por request x requests por mês', tom: 'ink', ms: 7, linhas: [
        L('out', 'request: US$ 0,007 · 100.000 requests/mês = US$ 700'),
        L('hint', 'exemplo calculado com a tabela ago/2026; a média esconde a cauda: meça p50, p95 e máximo')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm05-b7',
    titulo: 'FinOps de IA: medir, prever e otimizar custo',
    minutos: 35,
    resumo: 'Em IA cada chamada tem custo unitário visível, e isso exige contabilidade por operação. A fórmula é simples; o difícil é ter os números, medir a cauda e escolher a alavanca certa, que muitas vezes é não chamar o modelo.',
    objetivo: 'Calcular o custo por request com cache e saída, medir p50, p95 e máximo, aplicar um circuit breaker de custo por tenant e ordenar as sete alavancas de redução.',
    revisao: [
      { id: 'm05b7-subestimada', pergunta: 'Qual alavanca de custo costuma ser a mais subestimada?',
        opcoes: [
          opc('a', 'Não chamar o modelo: regra determinística, regex, cache de resposta', true, 'detectar a linguagem pela extensão custa zero e acerta mais; o que é determinístico fica determinístico, e o modelo entra para explicar, priorizar e conversar.'),
          opc('b', 'Trocar para o modelo mais caro em tudo', false, 'aumenta o custo sem ganho em tarefa simples.'),
          opc('c', 'Aumentar o prompt de sistema com mais exemplos', false, 'mais entrada, mais custo.')] },
      { id: 'm05b7-percentis', pergunta: 'Por que medir p50, p95 e máximo do custo por request, e não só o total mensal?',
        opcoes: [
          opc('a', 'O custo varia com o conteúdo de cada request; o request gigante mata a margem e não aparece na média', true, 'um prompt de 2k e um de 50k tokens custam muito diferente; meça a distribuição e use circuit breaker por tenant.'),
          opc('b', 'O provedor cobra por percentil', false, 'não há essa cobrança.'),
          opc('c', 'A média mensal é sempre zero', false, 'sem sentido.')] },
      { id: 'm05b7-saida', pergunta: 'Qual é a relação entre preço de entrada e de saída na tabela e a consequência prática?',
        opcoes: [
          opc('a', 'A saída custa 5x a entrada em toda a linha: resposta prolixa é o item mais caro; limite a saída no schema', true, 'Sonnet 5: 2 vs 10; Opus 5: 5 vs 25; Haiku 4.5: 1 vs 5 (retrato ago/2026, revalide).'),
          opc('b', 'Saída e entrada custam o mesmo', false, 'a tabela mostra 5x.'),
          opc('c', 'A saída é mais barata, então respostas longas são baratas', false, 'é o contrário.')] },
      { id: 'm05b7-formula', pergunta: 'Quais termos entram no custo de um request com cache?',
        opcoes: [
          opc('a', 'Entrada nova x preço_in, escrita x preço_in x 1,25, leitura x preço_in x 0,10 e saída x preço_out', true, 'cada parte tem seu multiplicador; a margem bruta sai de (preço do plano - custo mensal por cliente) / preço do plano.'),
          opc('b', 'Só os tokens de saída', false, 'a entrada também é cobrada, inclusive a escrita de cache.'),
          opc('c', 'Só o total de tokens vezes um preço único', false, 'entrada, saída, escrita e leitura têm preços diferentes.')] },
      { id: 'm05b7-tenant', pergunta: 'Um tenant consumiu o orçamento do mês em dois dias. O que faltava?',
        opcoes: [
          opc('a', 'Checagem de gasto acumulado antes da chamada (402 ou degradação), quota por tenant e alerta em 80%', true, 'circuit breaker de custo por tenant: o gasto é decidido antes de a chamada ser feita, não na fatura.'),
          opc('b', 'Um modelo mais caro', false, 'agrava o problema.'),
          opc('c', 'Mais retries', false, 'retry cobra de novo.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Em software tradicional, o custo marginal de um request é aproximadamente zero, e por isso você nunca precisou pensar nele por request. Em IA, cada chamada tem <strong>custo unitário visível</strong>, e isso reintroduz uma disciplina que nossa geração de engenheiros nunca precisou ter: contabilidade por operação. É o que separa o protótipo do produto: qualquer um faz uma demo bonita queimando o modelo mais caro em tudo, e produto exige margem. É também a pergunta que seu gestor (e seu futuro cliente) faz primeiro: "quanto custa rodar isso?".</p>' +
          '<h3>A conta</h3>' +
          '<p>A fórmula é simples; o difícil é ter os números, e é por isso que os blocos anteriores instrumentaram tudo.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'custo_request = (input_novo × preço_in)',
          '              + (cache_write × preço_in × 1.25)',
          '              + (cache_read  × preço_in × 0.10)',
          '              + (output      × preço_out)',
          'custo_mensal  = custo_request_médio × requests_mês',
          'margem_bruta  = (preço_do_plano − custo_mensal_por_cliente) / preço_do_plano'].join('\n') },
        { tipo: 'callout', tom: 'info', titulo: 'Preços de referência (ago/2026)', html:
          '<p>Retrato de ago/2026, revalidar em 90 dias; US$ por milhão de tokens.</p><table><thead><tr><th>Modelo</th><th>Input</th><th>Output</th><th>Cache write (5 min)</th><th>Cache read</th></tr></thead><tbody>' +
          '<tr><td>Claude Opus 5</td><td>$5</td><td>$25</td><td>$6,25</td><td>$0,50</td></tr>' +
          '<tr><td>Claude Sonnet 5</td><td>$2</td><td>$10</td><td>$2,50</td><td>$0,20</td></tr>' +
          '<tr><td>Claude Haiku 4.5</td><td>$1</td><td>$5</td><td>$1,25</td><td>$0,10</td></tr>' +
          '</tbody></table>' +
          '<p>Grave duas coisas mais que os números. (1) A saída custa 5x a entrada em toda a linha; logo, resposta prolixa é o item mais caro do sistema. (2) A razão entre o tier caro e o barato é de 5x, o que torna o roteamento por alias (bloco 6) uma alavanca de primeira ordem. A Batch API dá 50% de desconto para trabalho que tolera espera (janela de horas); no Capstone, a ingestão de repositório inteiro é candidata óbvia. Confirme na tabela oficial antes de decidir qualquer coisa: preços mudam.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Custo por conteúdo, não por quantidade', html:
          '<p>O custo aqui varia com o <em>conteúdo</em> de cada request (prompt de 2k contra um de 50k tokens), não só com a quantidade, então a média esconde a cauda. Meça <strong>p50, p95 e máximo</strong> do custo por request, e não só o total: é o request gigante que mata a margem, e ele não aparece na média.</p>' },
        { tipo: 'takeaway', html: 'Contabilidade <mark>por operação</mark>: meça <mark>p50, p95 e máximo</mark>, porque a <mark>cauda</mark> mata a margem.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html: '<p>Calcule o custo de um request real de análise: 500 tokens novos, 10.000 lidos do cache e 400 de saída, no Sonnet 5. Os valores vêm da fórmula e da tabela (ago/2026), não de medição.</p>' },
        { tipo: 'rode', id: 'fin-rode', titulo: 'Do uso ao custo mensal', terminalTitulo: 'custo_request · exemplo calculado', prefixo: '$', entrada: 'custo_request(uso, in=2, out=10)', unidade: 'mUS$', etapas: etapasFin(),
          enunciado: 'Aperte Enter e acompanhe a conta por etapa. Os números vêm da fórmula e da tabela de preços (ago/2026).',
          prever: { pergunta: 'Neste request, qual parte pesa mais no custo: os 10.500 tokens de entrada ou os 400 de saída?', opcoes: [
            { id: 'a', texto: 'A entrada: são 26 vezes mais tokens.', correta: false, porque: 'a leitura de cache custa 0,1x e a saída custa 5x a entrada: o número de tokens engana.' },
            { id: 'b', texto: 'A saída: 400 tokens a US$ 10/M custam US$ 0,004, mais que os US$ 0,003 de toda a entrada.', correta: true, porque: 'saída custa 5x a entrada e a maior parte da entrada vem do cache a 0,1x.' },
            { id: 'c', texto: 'Empatam.', correta: false, porque: 'US$ 0,004 contra US$ 0,003.' }
          ] },
          tutorDepois: 'Por isso o cache ataca o input e o schema com limites ataca o output: duas alavancas diferentes para duas partes diferentes da conta.',
          callout: 'Você viu que a saída pesa mais que a entrada cacheada neste request.' },
        { tipo: 'texto', html: '<h3>As sete alavancas, em ordem de retorno</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>#</th><th>Alavanca</th><th>Impacto típico</th><th>Custo de implementar</th></tr></thead><tbody>' +
          '<tr><td>1</td><td>Prompt caching em prefixo grande e repetido</td><td>-50 a -90% do input reaproveitado</td><td>baixo (bloco 5)</td></tr>' +
          '<tr><td>2</td><td>Modelo certo por tarefa (roteamento por alias)</td><td>-60 a -80% nas tarefas simples</td><td>baixo, mas exige eval para provar que não piorou (M06)</td></tr>' +
          '<tr><td>3</td><td>Encurtar a saída (schema com limites, "seja conciso" no schema)</td><td>-30 a -70% do output, que é o token caro</td><td>baixo</td></tr>' +
          '<tr><td>4</td><td>Batch API para trabalho tolerante a espera</td><td>-50% de tudo</td><td>médio (fluxo assíncrono, você já tem, bloco 4)</td></tr>' +
          '<tr><td>5</td><td><strong>Não chamar o modelo</strong>: regra determinística, regex, cache de resposta</td><td>-100% no que for eliminado</td><td>variável, e é a alavanca mais subestimada</td></tr>' +
          '<tr><td>6</td><td>Enxugar o contexto: recuperar 5 chunks bons em vez de 30 medianos (M07)</td><td>-40 a -80% do input médio</td><td>é o M07 inteiro</td></tr>' +
          '<tr><td>7</td><td>Modelo local para volume alto e tarefa simples (M11)</td><td>-100% de API, mais infra</td><td>alto: só compensa em escala ou por exigência de privacidade</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'success', titulo: 'A alavanca nº 5 merece um parágrafo', html:
          '<p>A pergunta mais lucrativa da engenharia de IA é: <strong>"isto precisa mesmo de um LLM?"</strong>. Detectar a linguagem de um arquivo pela extensão custa zero e acerta mais que o modelo. Contar linhas, extrair imports, achar TODOs, calcular métricas de acoplamento (M10): tudo é determinístico. A regra de ouro da arquitetura do Capstone (<code>docs/projeto-final.md</code>) é exatamente esta: o que é determinístico fica determinístico; o modelo entra para <em>explicar, priorizar e conversar</em>. Além de derrubar o custo, isso elimina uma classe inteira de alucinação e é o julgamento arquitetural que separa o engenheiro sênior de IA de quem só chama API.</p>' },
        { tipo: 'takeaway', html: 'Antes de otimizar o modelo, pergunte "<mark>isto precisa de um LLM?</mark>"; depois, <mark>cache</mark>, <mark>modelo certo</mark> e <mark>saída curta</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html: '<p>Implemente a contabilidade: o custo de um request em tipo decimal, o percentil que revela a cauda e o circuit breaker de custo por tenant. Dinheiro em <code>Decimal</code>, não em <code>float</code>, desde a primeira migration do ledger.</p>' },
        { tipo: 'python', id: 'fin-python', titulo: 'Custo, cauda e orçamento por tenant', obrigatorio: false,
          enunciado: 'Implemente três funções com <code>Decimal</code>. <code>custo_request(uso, preco_in, preco_out)</code> aplica a fórmula do bloco. <code>percentil(valores, p)</code> usa o posto mais próximo (<code>ceil(p/100 x n)</code>); <code>p=100</code> é o máximo. <code>decidir(gasto, orcamento, estimado)</code> devolve <code>"402"</code> se <code>gasto + estimado</code> passa do orçamento, <code>"alerta"</code> a partir de 80% e <code>"ok"</code> no resto.',
          codigo: codigoFin, testes: testesFin,
          dica: 'Some os quatro termos e divida por <code>Decimal(1_000_000)</code>. Percentil: ordene, calcule <code>max(1, ceil(p / 100 * n))</code> e indexe em <code>posto - 1</code>. No breaker, compare <code>total</code> com <code>orcamento</code> e depois com <code>orcamento * Decimal("0.8")</code>.',
          solucao: solucaoFin,
          tutorDepois: 'Repare no teste da cauda: 19 requests de US$ 0,01 e um de US$ 1,00 têm p50 de US$ 0,01 e média acima de US$ 0,05. A média esconde o request que mata a margem, e o breaker decide antes da chamada, não na fatura.',
          callout: 'Custo, percentil e breaker passaram nos testes, com a cauda visível.' },
        { tipo: 'escreva', id: 'fin-escreva', titulo: 'Isto precisa mesmo de um LLM?', obrigatorio: false,
          enunciado: 'O Capstone analisa repositórios. Escolha três tarefas e diga, para cada uma, se ela fica determinística ou vai para o modelo, e qual alavanca de custo cada decisão aciona.',
          placeholder: 'Detectar a linguagem do arquivo: … Explicar um risco de acoplamento: … Resumir 5.000 arquivos na ingestão: …',
          rubrica: [
            'Pelo menos uma tarefa <strong>determinística</strong> (extensão, contagem de linhas, imports, TODOs, métricas) com custo zero.',
            'O modelo reservado para <strong>explicar, priorizar ou conversar</strong>.',
            'Cita a alavanca acionada (não chamar o modelo, modelo certo por alias, cache, batch).',
            'Menciona que determinismo <strong>elimina alucinação</strong> naquela tarefa.'
          ],
          modelo: '<p>Detectar a linguagem pela extensão fica determinístico: custo zero e acerto maior que o do modelo (alavanca 5). Contar linhas e extrair imports também. Explicar por que um módulo tem acoplamento alto vai para o modelo, no alias <code>raciocinio</code> com prefixo cacheado (alavancas 1 e 2). A ingestão de 5.000 arquivos é trabalho tolerante a espera: Batch API, com 50% de desconto (alavanca 4). O que é determinístico não alucina, e o modelo entra só onde há o que explicar.</p><p><strong>Reprova:</strong> mandar tudo ao modelo "porque é mais simples".</p>' },
        { tipo: 'cenario', id: 'fin-cenario', titulo: 'A estimativa errou e a margem sumiu', obrigatorio: false,
          enunciado: 'Você estimou o custo por cliente com a média de tokens e apresentou margem de 70%. No primeiro mês, a fatura real veio 2,5 vezes maior. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O ledger por chamada existe. Qual é o primeiro passo?', opcoes: [
              { texto: 'Abrir a distribuição de custo por request (p50, p95, máximo) e por tenant.', vai: 'dist', tom: 'ok', consequencia: 'a diferença entre estimativa e realidade quase sempre está na cauda, não na média.' },
              { texto: 'Subir o preço do plano em 2,5x.', vai: 'f-preco', tom: 'ruim', consequencia: 'esconde o problema sem entendê-lo, e perde o cliente.' },
              { texto: 'Trocar tudo para o modelo mais barato.', vai: 'f-barato', tom: 'ruim', consequencia: 'sem eval, a qualidade cai e você não sabe quanto.' }
            ] },
            dist: { texto: 'O p95 é 12 vezes o p50, e um tenant concentra os requests gigantes. O que você faz?', opcoes: [
              { texto: 'Circuit breaker de custo por tenant (402 ou degradação), saída limitada no schema e roteamento por alias com eval.', vai: 'f-bom', tom: 'ok', consequencia: 'a cauda ganha teto, e a mudança de modelo é provada por eval (M06).' },
              { texto: 'Aceitar: a média está dentro do esperado.', vai: 'f-media', tom: 'ruim', consequencia: 'a média nunca foi o problema; a cauda continua queimando a margem.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Você documenta o erro percentual da estimativa e a razão da diferença. Errar a estimativa é normal; não saber por que errou é o problema.' },
            'f-preco': { bom: false, texto: 'O custo real continua o mesmo, e a margem só existe no papel.' },
            'f-barato': { bom: false, texto: 'A conta cai, mas a qualidade também, sem medida que mostre quanto.' },
            'f-media': { bom: false, texto: 'A fatura do mês seguinte repete o susto.' }
          } },
        { tipo: 'takeaway', html: 'Estime em <mark>moeda</mark>, valide contra <mark>execução real</mark> e documente o <mark>erro percentual</mark> e a causa.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<p>Juntar os sete blocos numa camada de produção é o exercício do bloco: gateway com aliases e telemetria, prompts versionados, schemas, contabilidade persistida, circuit breaker de custo por tenant e endpoint de custo legível por não técnicos. O percurso passa por uma fronteira única que só ela conhece o SDK (trocar de gateway não toca o domínio), telemetria por chamada com dinheiro em tipo decimal e tenant desde a primeira migration, e recusa 402 ou degradação quando o tenant estoura o orçamento.</p>' +
          '<p>Como conta de guardanapo, estime três cenários: tudo no modelo forte sem cache; com cache no prefixo; roteando a maioria para o modelo rápido, com lote na ingestão. Apresente em moeda, com a margem sobre o plano, e valide contra execução real. A aplicação ao Capstone é trilha opcional com especificação própria; o lab entrega gateway, ledger e relatório sobre fakes.</p>' },
        { tipo: 'escolha', id: 'fin-esc1', titulo: 'Entrada contra saída',
          pergunta: 'Com a tabela de preços de referência, qual é a relação entre preço de entrada e de saída e a consequência prática?',
          opcoes: [
            { id: 'a', texto: 'Saída custa o mesmo que entrada.', correta: false, porque: 'a tabela mostra 2 contra 10 no Sonnet 5.' },
            { id: 'b', texto: 'Saída custa menos que entrada, então respostas longas são baratas.', correta: false, porque: 'é o contrário.' },
            { id: 'c', texto: 'Saída custa 5x a entrada em toda a linha: resposta prolixa é o item mais caro; limite a saída no schema.', correta: true, porque: 'Sonnet 5: 2 vs 10; Opus 5: 5 vs 25; Haiku 4.5: 1 vs 5 (retrato ago/2026, revalide). Encurtar a saída e rotear por alias são alavancas de primeira ordem.' },
            { id: 'd', texto: 'Saída só custa mais no Haiku.', correta: false, porque: 'a razão é 5x nos três modelos da tabela.' }
          ] },
        { tipo: 'escolha', id: 'fin-esc2', titulo: 'A cauda do custo',
          pergunta: 'Por que medir p50, p95 e máximo do custo por request, e não só o total mensal?',
          opcoes: [
            { id: 'a', texto: 'O custo varia com o conteúdo de cada request; a cauda (o request gigante) mata a margem e não aparece na média.', correta: true, porque: 'prompt de 2k tokens e de 50k têm custos muito diferentes. Meça a distribuição e use circuit breaker de custo por tenant.' },
            { id: 'b', texto: 'Porque o provedor cobra por percentil.', correta: false, porque: 'o provedor cobra por token.' },
            { id: 'c', texto: 'Porque a média mensal é sempre zero.', correta: false, porque: 'sem sentido.' },
            { id: 'd', texto: 'Porque p95 é exigido por lei.', correta: false, porque: 'não há essa exigência.' }
          ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Verificado em ago/2026', html:
          '<p>Preços, o desconto de 50% da Batch API e os impactos típicos das alavancas são o retrato de ago/2026 do módulo; revalide em 90 dias na tabela oficial antes de decidir qualquer coisa.</p>' },
        { tipo: 'takeaway', html: 'Custo é <mark>dado</mark>: entrada, saída, cache e <mark>cauda</mark> medidos por chamada; a otimização começa por <mark>não chamar o modelo</mark>.' }
      ] }
    ]
  });
})();
