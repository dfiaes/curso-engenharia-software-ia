/* P01 · Bloco 5: Observabilidade e custo. Fonte: P01.html#b05. Saídas do llm_service.cost são execuções reais do laboratório (preços de exemplo, não tarifa). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var COST = 'uv run python -m llm_service.cost --requests-per-day %N% --input-tokens 1200 --output-tokens 300 --price-in 0.15 --price-out 0.60';
  var C1 = COST.replace('%N%', '2000');
  var C2 = COST.replace('%N%', '20000');

  var etapasCusto = function () {
    return [
      { id: 'base', nome: '2.000 chamadas por dia', descricao: '1.200 tokens de entrada, 300 de saída', tom: 'dns', ms: 1, linhas: [
        L('out', 'por chamada: 0.000360'),
        L('out', 'por mês (30 dias): 21.60'),
        L('hint', 'preços de exemplo: 0,15 por 1M de entrada e 0,60 por 1M de saída')] },
      { id: 'dez', nome: 'A mesma carga vezes dez', descricao: '20.000 chamadas por dia', tom: 'request', ms: 1, linhas: [
        L('cmd', C2),
        L('out', 'por chamada: 0.000360'),
        L('out', 'por mês (30 dias): 216.00'),
        L('hint', 'o custo por chamada não mudou; o volume mudou')] }
    ];
  };

  var codigoCusto = [
    'import math', '', '',
    'def custo_chamada(tok_in, tok_out, preco_in, preco_out):',
    '    """Preços por 1 milhão de tokens."""',
    '    return tok_in * preco_in / 1_000_000   # falta uma parcela', '', '',
    'def custo_mes(req_dia, tok_in, tok_out, preco_in, preco_out, dias=30):',
    '    if min(req_dia, tok_in, tok_out, dias) < 0:',
    '        raise ValueError("quantidades não podem ser negativas")',
    '    return custo_chamada(tok_in, tok_out, preco_in, preco_out) * req_dia * dias', '', '',
    'def replicas(rps, duracao_s, alvo, minimo, maximo):',
    '    """Lei de Little: concorrência = req/s x duração. Réplicas = ceil(concorrência / alvo), entre min e max."""',
    '    return round(rps * duracao_s / alvo)', '', '',
    'def excede_cota(rps, tok_por_req, cota_tpm):',
    '    """Tokens por minuto consumidos passam da cota do modelo?"""',
    '    return False', '',
    'print(custo_chamada(1200, 300, 0.15, 0.60), replicas(20, 8, 10, 0, 10))', ''].join('\n');
  var testesCusto = [
    'def test_custo_por_chamada_com_entrada_e_saida():',
    '    assert abs(custo_chamada(1200, 300, 0.15, 0.60) - 0.00036) < 1e-9', '', '',
    'def test_custo_mensal_do_exemplo():',
    '    assert abs(custo_mes(2000, 1200, 300, 0.15, 0.60) - 21.60) < 1e-6',
    '    assert abs(custo_mes(20000, 1200, 300, 0.15, 0.60) - 216.00) < 1e-6', '', '',
    'def test_custo_negativo_e_erro():',
    '    try:', '        custo_mes(-1, 1200, 300, 0.15, 0.60)', '    except ValueError:', '        return',
    '    assert False, "devia levantar ValueError"', '', '',
    'def test_replicas_arredonda_para_cima():',
    '    assert replicas(1, 1, 10, 0, 10) == 1', '    assert replicas(20, 8, 10, 0, 100) == 16', '', '',
    'def test_replicas_respeita_teto_e_piso():',
    '    assert replicas(20, 8, 10, 0, 10) == 10', '    assert replicas(0, 8, 10, 2, 10) == 2', '    assert replicas(0, 8, 10, 0, 10) == 0', '', '',
    'def test_cota_do_modelo():',
    '    assert excede_cota(20, 1500, 120_000)', '    assert not excede_cota(1, 1500, 120_000)', ''].join('\n');
  var solucaoCusto = [
    'import math', '', '',
    'def custo_chamada(tok_in, tok_out, preco_in, preco_out):',
    '    return (tok_in * preco_in + tok_out * preco_out) / 1_000_000', '', '',
    'def custo_mes(req_dia, tok_in, tok_out, preco_in, preco_out, dias=30):',
    '    if min(req_dia, tok_in, tok_out, dias) < 0:',
    '        raise ValueError("quantidades não podem ser negativas")',
    '    return custo_chamada(tok_in, tok_out, preco_in, preco_out) * req_dia * dias', '', '',
    'def replicas(rps, duracao_s, alvo, minimo, maximo):',
    '    desejadas = math.ceil(rps * duracao_s / alvo)',
    '    return min(max(desejadas, minimo), maximo)', '', '',
    'def excede_cota(rps, tok_por_req, cota_tpm):',
    '    return rps * 60 * tok_por_req > cota_tpm', ''].join('\n');

  TrilhaAula.registrar({
    id: 'p01-b5',
    titulo: 'Observabilidade e custo: OpenTelemetry, alertas, tokens e escala',
    minutos: 40,
    resumo: 'Em produção você depura com o que o serviço emitiu antes de falhar, e há duas contas correndo: latência e erro, de um lado; tokens, do outro. Uma mudança de prompt que dobra os tokens não derruba nada e dobra a fatura.',
    objetivo: 'Escolher os sinais que um serviço com LLM precisa emitir, desenhar alertas com ação seguinte, estimar custo por tokens e computação e explicar por que mais réplicas não resolvem 429 e por que o orçamento só avisa.',
    revisao: [
      { id: 'p01b5-429', pergunta: 'O modelo devolve 429 (cota excedida) sob carga. Aumentar <code>maxReplicas</code> ajuda?',
        opcoes: [
          opc('a', 'Não: a cota é do recurso do modelo, e mais réplicas aumentam a pressão sobre ela', true, 'o remédio é cota, fila, limite por chamador ou gateway com fallback entre implantações (M05, bloco 6).'),
          opc('b', 'Sim: mais réplicas dividem a cota entre si', false, 'réplicas escalam o seu código, não a cota de tokens por minuto da implantação.'),
          opc('c', 'Só se também houver mais memória por réplica', false, 'memória não altera cota de modelo.')] },
      { id: 'p01b5-orcamento', pergunta: 'O que o recurso <code>Microsoft.Consumption/budgets</code> faz quando o gasto passa de 100% da previsão?',
        opcoes: [
          opc('a', 'Notifica, com atraso de horas, depois que o custo já ocorreu; não bloqueia gasto', true, 'o freio real são os tetos configurados antes: <code>maxReplicas</code>, TPM, limite por chamador. Orçamento sem teto é um relatório de dano.'),
          opc('b', 'Escala o app a zero automaticamente', false, 'isso só acontece se você ligar uma ação automática ao aviso.'),
          opc('c', 'Bloqueia novas chamadas ao modelo', false, 'o orçamento não impede consumo.')] },
      { id: 'p01b5-ttft', pergunta: 'Por que o tempo até o primeiro token (<code>ttft_ms</code>) é registrado separado da duração da chamada?',
        opcoes: [
          opc('a', 'Em streaming, a duração total mistura latência do provedor com o tempo de gerar a resposta inteira; o primeiro token é o que o usuário sente', true, 'os dois números contam histórias diferentes e devem ser lidos separadamente.'),
          opc('b', 'Porque o OpenTelemetry não mede duração', false, 'há o histograma <code>gen_ai.client.operation.duration</code>.'),
          opc('c', 'Porque o TTFT é mais barato de ingerir', false, 'a razão é de interpretação, não de custo.')] },
      { id: 'p01b5-cauda', pergunta: 'Um painel mostra latência média de 800 ms e 5% das requisições levam 40 s. Qual a correção?',
        opcoes: [
          opc('a', 'Olhar p95 e p99, por modelo e por rota; identificadores de alta cardinalidade ficam no log, não nos rótulos da métrica', true, 'cardinalidade explode custo: uma série por valor de <code>user_id</code> gera conta de ingestão proporcional.'),
          opc('b', 'Aumentar a janela da média para diluir a cauda', false, 'diluir esconde ainda mais a cauda.'),
          opc('c', 'Remover o histograma e manter só um contador', false, 'sem distribuição você não vê a cauda.')] },
      { id: 'p01b5-semdados', pergunta: 'Você cria um alerta de erro antes de o serviço receber tráfego, e a consulta não retorna linhas. Qual o risco?',
        opcoes: [
          opc('a', '"Nenhum resultado" é lido como "tudo bem"; trate ausência de dados como condição (heartbeat ou volume mínimo) e provoque a falha em homologação', true, 'um alerta sobre coluna renomeada ou tabela vazia continua "verde" em silêncio.'),
          opc('b', 'O alerta dispara em loop', false, 'o problema é o oposto: não dispara nunca.'),
          opc('c', 'Nenhum: sem dados não há erro', false, 'é exatamente o raciocínio que esconde a falha.')] }
    ],
    abas: [
      { rotulo: 'Sinais', blocos: [
        { tipo: 'texto', html:
          '<p>Em produção você não depurará com um depurador; depurará com o que o serviço emitiu antes de falhar. Em um serviço com LLM há <strong>duas contas</strong> correndo ao mesmo tempo: a de latência e erro (a que o SRE vê) e a de tokens (a que o financeiro vê). Uma mudança de prompt que dobra os tokens de entrada não derruba nada, não dispara nenhum alerta clássico e dobra a fatura.</p>' +
          '<p>O <a href="../M06-evals-observabilidade/M06.html">M06</a> trata a observabilidade de qualidade (evals, traces de agentes). Este bloco trata o que o <em>deploy</em> precisa entregar: sinais operacionais e de custo, ligados ao Azure.</p>' +
          '<h3>Três sinais, uma linguagem: OpenTelemetry</h3>' +
          '<p><strong>OpenTelemetry</strong> (OTel) é o padrão aberto para <strong>traces</strong> (a história de uma requisição), <strong>métricas</strong> (números agregados) e <strong>logs</strong>. A vantagem para quem opera em nuvem é separar <em>instrumentar</em> (no código, neutro de fornecedor) de <em>exportar</em> (configuração, trocável).</p>' +
          '<p>O Azure Monitor oferece uma distribuição OTel para Python, o pacote <code>azure-monitor-opentelemetry</code>, que liga a exportação para o <strong>Application Insights</strong> lendo a variável <code>APPLICATIONINSIGHTS_CONNECTION_STRING</code>. O Application Insights atual é <em>baseado em workspace</em>: guarda os dados no mesmo Log Analytics onde ficam os logs de console, e tudo se consulta com uma linguagem só, o <strong>KQL</strong>.</p>' +
          '<p>No laboratório (<code>llm_service/telemetry.py</code>), a ligação é deliberadamente pequena e opcional: uma função chama <code>configure_azure_monitor(connection_string=...)</code> só quando a variável existe. Sem connection string nada é importado (o teste <code>test_telemetry_off_without_<wbr>connection_string_and_never_imports</code> garante); com a string e sem o extra instalado, o erro diz o que fazer (<code>uv sync --extra azure</code>). Em desenvolvimento e nos testes, o serviço roda sem nenhuma dependência de Azure.</p>' +
          '<h3>O que medir em um serviço com LLM</h3>' +
          '<p>O lab emite dois tipos de sinal, escolhidos para responder perguntas específicas.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sinal</th><th>Onde</th><th>Responde a</th></tr></thead><tbody>' +
          '<tr><td>Histograma <code>gen_ai.client.token.usage</code> (tipo <code>input</code>/<code>output</code>, modelo)</td><td>métrica OTel</td><td>Quantos tokens por chamada? Mudou depois do deploy?</td></tr>' +
          '<tr><td>Histograma <code>gen_ai.client.operation.duration</code></td><td>métrica OTel</td><td>Quanto demora a chamada ao modelo (p50/p95/p99)?</td></tr>' +
          '<tr><td>Contador <code>llm_service.upstream.errors</code> (tipo: <code>unavailable</code>/<code>upstream</code>)</td><td>métrica OTel</td><td>Quanto do erro é 429/5xx do provedor?</td></tr>' +
          '<tr><td>Uma linha JSON por requisição: <code>request_id</code>, rota, status, <code>duration_ms</code>, modelo, tokens, <code>ttft_ms</code>, erro</td><td>stdout → Log Analytics</td><td>O que aconteceu <em>nesta</em> requisição? Quem consumiu os tokens?</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Os nomes dos dois primeiros vêm das <strong>convenções semânticas de GenAI</strong> do OpenTelemetry. Elas ainda estão em evolução (atributos e nomes já mudaram entre versões, e o projeto as moveu para um repositório próprio). Use-as como convenção, mas fixe a versão do SDK e trate renomeações como mudança de contrato: alertas e dashboards dependem dos nomes (verificado em 11/10/2026, no índice).</p>' +
          '<p>O <strong>tempo até o primeiro token</strong> (<code>ttft_ms</code>) é medido no serviço e registrado no log da requisição, não na duração da chamada. Em streaming, a duração total mistura a latência do provedor com o tempo que o modelo leva para gerar a resposta inteira, e é o primeiro token que o usuário sente. Os dois números contam histórias diferentes.</p>' +
          '<p>O log por requisição é a fonte de verdade para custo por rota e por cliente, porque carrega tokens e <code>request_id</code>, o mesmo valor devolvido ao cliente no cabeçalho <code>x-request-id</code>. Duas decisões de projeto, testadas em <code>test_access_log_has_tokens_<wbr>and_never_the_prompt</code>:</p>' +
          '<ul><li>O <strong>conteúdo do prompt nunca entra no log</strong> (privacidade, e também custo de ingestão).</li>' +
          '<li>O <code>request_id</code> recebido do cliente só é aceito se casar com um padrão estrito (<code>^[A-Za-z0-9._-]{1,64}$</code>); caso contrário o servidor gera um novo, o que impede injeção de linhas falsas no log por um cabeçalho malicioso.</li></ul>' +
          '<h3>Consultar o que o serviço emitiu</h3>' +
          '<p>Com a configuração de diagnóstico do bloco 3, os logs do contêiner caem em tabelas do workspace (no formato dedicado, <code>ContainerAppConsoleLogs</code> e <code>ContainerAppSystemLogs</code>). Como cada linha é JSON, o KQL abre o campo e agrega por modelo.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'ContainerAppConsoleLogs',
          '| where TimeGenerated > ago(1h)',
          '| extend e = parse_json(Log)   // a coluna do texto da linha pode ter outro nome no seu esquema',
          '| where e.event == "request" and e.path == "/v1/complete"',
          '| summarize chamadas = count(),',
          '            tokens_in = sum(toint(e.input_tokens)),',
          '            tokens_out = sum(toint(e.output_tokens)),',
          '            p95_ms = percentile(todouble(e.duration_ms), 95),',
          '            erros = countif(toint(e.status) >= 500)',
          '  by modelo = tostring(e.model), bin(TimeGenerated, 5m)'].join('\n') },
        { tipo: 'callout', tom: 'info', titulo: 'Limite real', html:
          '<p>O nome exato da coluna e da tabela depende do tipo de destino configurado; confira no seu workspace antes de salvar a consulta em um alerta. É o tipo de coisa que quebra em silêncio: um alerta sobre uma coluna renomeada continua "verde" porque não encontra linhas.</p>' },
        { tipo: 'takeaway', html: 'Instrumente com <mark>OpenTelemetry</mark>, exporte por configuração e registre <mark>tokens</mark>, <mark>TTFT</mark> e erros por requisição, <mark>sem o prompt</mark>.' }
      ] },

      { rotulo: 'Custo', blocos: [
        { tipo: 'texto', html:
          '<h3>Custo: tokens, computação e logs</h3>' +
          '<p>Em um serviço de LLM, a ordem de grandeza costuma ser <strong>tokens ≫ computação ≈ logs</strong>. O lab traz a aritmética em <code>llm_service/cost.py</code>, com todos os preços como <strong>parâmetro</strong>: você informa os valores vigentes da sua região e modelo. Rode o exemplo e veja onde está o custo.</p>' },
        { tipo: 'rode', id: 'obs-rode', titulo: 'Custo por tokens, com preços de exemplo', obrigatorio: true,
          enunciado: 'Saída real do laboratório com preços de exemplo (0,15 e 0,60 por milhão de tokens de entrada e saída). Aperte Enter: a primeira carga e a mesma carga multiplicada por dez rodam em sequência.',
          prefixo: '$', entrada: C1, unidade: 's', terminalTitulo: 'lab/ · llm_service.cost', etapas: etapasCusto(),
          prever: { pergunta: 'Cada chamada tem 1.200 tokens de entrada e 300 de saída, e a saída custa 4 vezes mais por token. Qual parcela domina o custo da chamada?', opcoes: [
            { id: 'a', texto: 'A entrada: são 4 vezes mais tokens.', correta: false, porque: 'ela tem 4 vezes mais tokens, mas cada um custa 4 vezes menos.' },
            { id: 'b', texto: 'A saída: cada token custa 4 vezes mais.', correta: false, porque: 'a saída tem 4 vezes menos tokens; as duas forças se anulam aqui.' },
            { id: 'c', texto: 'As duas pesam igual: 1.200 x 0,15 = 300 x 0,60 = 180 (por milhão), somando 0,000360 por chamada.', correta: true, porque: 'depende dos números; por isso o custo se calcula, não se supõe, e uma mudança de prompt que dobra a entrada mexe direto na fatura.' }
          ] },
          tutorAntes: 'Escolha a previsão, aperte Enter e leia as linhas de saída de cada carga.',
          tutorDepois: 'O custo por chamada não mudou; o mês foi de 21,60 para 216,00 só pelo volume. Esses números ilustram proporção, não orçam nada.',
          callout: 'Você viu o custo escalar linearmente com o volume e dependendo do tamanho de cada chamada.' },
        { tipo: 'texto', html:
          '<h3>E a computação?</h3>' +
          '<p>Para a computação, uma réplica de 0,5 vCPU e 1 GiB, ativa 10% do mês e ociosa nos 90% restantes, com taxas de exemplo na ordem de grandeza das tabelas públicas de consumo (ativa: 0,000024 por vCPU-s e 0,000003 por GiB-s; ociosa: 0,000003 e 0,000003), custa cerca de <strong>14,39 no mês</strong> antes da franquia gratuita. Três revisões ativas com réplica mínima 1 somariam cerca de <strong>43,16</strong>.</p>' +
          '<p><strong>Esses números ilustram proporção, não orçam nada.</strong> O que o exemplo ensina:</p>' +
          '<ol><li>Um mês de tokens pode superar a computação por uma ordem de grandeza ou ser menor que ela, dependendo do volume.</li>' +
          '<li>Réplicas mínimas deixadas em revisões antigas custam sem servir ninguém.</li>' +
          '<li>A franquia mensal de vCPU-segundos é por assinatura, não por app.</li></ol>' +
          '<h3>Logs também custam</h3>' +
          '<p>Logs custam por GB ingerido no Log Analytics. Dois controles simples: nunca logar corpo de prompt ou resposta (privacidade e volume) e manter retenção curta no que não é auditoria (o Bicep usa 30 dias). O Application Insights permite amostragem de traces; amostrar demais esconde exatamente os erros raros que você quer ver. Amostre traces de sucesso e mantenha <strong>100% dos erros e das métricas</strong>.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: média esconde a cauda', html:
          '<p>Um painel com "latência média" de 800 ms convive com 5% das requisições levando 40 s. Em histogramas, olhe p95 e p99, por modelo e por rota. E em métricas, <strong>cardinalidade explode custo</strong>: um atributo como <code>user_id</code> ou o texto do prompt em uma métrica cria uma série por valor e gera uma conta de ingestão proporcional. Identificadores de alta cardinalidade ficam no log por requisição (onde se consulta), não nos rótulos da métrica (onde se agrega).</p>' },
        { tipo: 'takeaway', html: 'Tokens costumam dominar o custo; <mark>réplicas mínimas esquecidas</mark> custam sem servir ninguém; <mark>p95 e p99</mark>, não a média.' }
      ] },

      { rotulo: 'Alertas, escala e orçamento', blocos: [
        { tipo: 'texto', html:
          '<h3>Alertas que valem a pena</h3>' +
          '<p>Alerta é um contrato com uma pessoa acordada. Cada alerta precisa responder "o que eu faço agora?". Para este serviço, um conjunto pequeno cobre quase tudo, ordenado por urgência.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Alerta</th><th>Sinal</th><th>Primeira ação</th></tr></thead><tbody>' +
          '<tr><td>Disponibilidade</td><td>taxa de 5xx &gt; limiar por 5 min, ou teste sintético de <code>/v1/complete</code> falhando</td><td>revisão nova? rollback por tráfego (bloco 6).</td></tr>' +
          '<tr><td>Provedor limitando</td><td>fração de 429/<code>unavailable</code> acima do normal</td><td>cota do modelo (TPM), retentativa em cascata, quem está consumindo.</td></tr>' +
          '<tr><td>Latência percebida</td><td>p95 do <code>ttft_ms</code> acima do SLO</td><td>região do modelo, tamanho do prompt, saturação de réplicas.</td></tr>' +
          '<tr><td>Queima de tokens</td><td>tokens/hora acima de N× a média do mesmo horário</td><td>prompt mudou? cliente em laço? chave de parceiro vazada?</td></tr>' +
          '<tr><td>Saturação</td><td>réplicas no <code>maxReplicas</code> por mais de X min</td><td>aumentar o teto ou reduzir carga; conferir a cota do modelo antes.</td></tr>' +
          '<tr><td>Orçamento</td><td>real ≥ 80%, previsão ≥ 100% (recurso <code>Microsoft.Consumption/budgets</code>)</td><td>revisar o consumo da semana; ver abaixo o que o orçamento <em>não</em> faz.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>No Azure Monitor, alertas de <em>métrica</em> (réplicas, requisições) são baratos e quase em tempo real; alertas de <em>consulta de log</em> (KQL) são mais flexíveis, têm latência e custo por avaliação. Ambos disparam um <em>action group</em> (e-mail, webhook, pager). Alerte sobre sintomas que o usuário sente, não sobre causas prováveis: CPU alta sem impacto não deve acordar ninguém.</p>' +
          '<h3>Escala: o teto é uma decisão de custo e de proteção</h3>' +
          '<p>A regra HTTP do lab (<code>concurrentRequests: \'10\'</code>) adiciona uma réplica quando a média de requisições simultâneas por réplica passa de 10, medida em janelas de 15 segundos. O valor certo vem de medir: quantas conexões uma réplica de 0,5 vCPU sustenta antes de a latência subir?</p>' +
          '<ul><li><strong><code>maxReplicas</code> é um disjuntor financeiro.</strong> Um laço de cliente com mil requisições simultâneas escala até o teto e para. O padrão da plataforma é 10 réplicas e o máximo configurável é 1.000: subir o teto "por segurança" para centenas transforma o próximo incidente de tráfego em incidente de fatura.</li>' +
          '<li><strong>Mais réplicas não criam mais cota de modelo.</strong> A cota (tokens por minuto da implantação, o <code>modelCapacity</code> do Bicep) é do recurso de modelo. Se ela é o gargalo, escalar o serviço aumenta o número de requisições recebendo 429, e as retentativas amplificam a carga. O sintoma é "mais réplicas, mais erros". O remédio é cota, fila, limite por chamador ou um gateway com fallback entre implantações (<a href="../M05-llm-pratica-gateway-cache/M05.html#b06">M05, bloco 6</a>), não mais contêineres.</li>' +
          '<li><strong>Escala a zero versus <code>minReplicas: 1</code></strong> (bloco 1): o custo de uma réplica ociosa contra a latência da primeira requisição.</li>' +
          '<li><strong>Encerramento de réplica com streams em voo.</strong> Ao reduzir réplicas, a plataforma envia <code>SIGTERM</code> e espera a janela de término; streams mais longos que ela são cortados. O cliente precisa saber repetir a requisição: um stream cortado no meio não é uma resposta parcial utilizável.</li></ul>' +
          '<h3>Orçamento: o que ele faz e o que não faz</h3>' +
          '<p>O recurso <code>Microsoft.Consumption/budgets</code> do lab (condicional a <code>budgetAmount &gt; 0</code> e a um e-mail) notifica em 80% do realizado e em 100% da <em>previsão</em>. Ele <strong>não bloqueia gasto</strong>: avisa, com atraso de horas, depois que o custo já ocorreu. O freio real é o conjunto de tetos que você configurou antes: <code>maxReplicas</code>, cota do modelo (TPM), limite por chamador no serviço e, em último caso, uma ação automatizada disparada pelo aviso (escalar para zero, revogar o papel). <strong>Orçamento sem teto é um relatório de dano.</strong></p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: alerta sobre tabela que ainda não tem dados', html:
          '<p>Você cria o alerta de erro antes de o serviço receber tráfego, a consulta não retorna linhas, e "nenhum resultado" é lido como "tudo bem". Configure a regra para tratar ausência de dados como condição (alerta de <em>heartbeat</em> ou volume mínimo de requisições) e teste cada alerta provocando a falha de propósito em homologação, com o procedimento anotado no runbook.</p>' },
        { tipo: 'takeaway', html: 'Alerte sobre <mark>sintomas</mark>, cada um com a <mark>ação seguinte</mark>; <mark>maxReplicas</mark> e a <mark>cota</mark> são os freios reais, e o <mark>orçamento só avisa</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'obs-python', titulo: 'Escreva a aritmética de custo e escala', obrigatorio: false,
          enunciado: 'Complete quatro funções, todas puras e sem rede: <code>custo_chamada</code> (preços por 1 milhão de tokens, entrada <em>e</em> saída), <code>custo_mes</code> (já valida negativos), <code>replicas</code> (Lei de Little: concorrência = req/s x duração; réplicas = teto da divisão pelo alvo, entre mínimo e máximo) e <code>excede_cota</code> (tokens por minuto contra a cota do modelo). Os preços são de exemplo.',
          codigo: codigoCusto, testes: testesCusto,
          dica: 'Custo: <code>(tok_in * preco_in + tok_out * preco_out) / 1_000_000</code>. Réplicas: <code>math.ceil(...)</code> e depois <code>min(max(desejadas, minimo), maximo)</code>. Tokens por minuto: <code>rps * 60 * tok_por_req</code>.',
          solucao: solucaoCusto,
          tutorDepois: 'Repare que <code>excede_cota</code> não recebe número de réplicas: a cota é do modelo, e escalar o serviço não entra na conta.',
          callout: 'O cálculo bateu com a saída real do laboratório (0,000360 por chamada e 21,60 por mês), e a cota ficou fora da escala.' },
        { tipo: 'cenario', id: 'obs-cenario', titulo: 'O custo dobrou e o p95 subiu, sem erro', obrigatorio: false,
          enunciado: 'O custo do dia dobrou e o p95 subiu, mas não há erros nem alertas disparados. Conduza a investigação.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Nenhum 5xx, nenhum 429. Qual é a primeira investigação mais produtiva?', opcoes: [
              { texto: 'Dobrar <code>maxReplicas</code>.', vai: 'f-replicas', tom: 'ruim', consequencia: 'réplicas não reduzem tokens e ainda aumentam a computação.' },
              { texto: 'Separar TTFT de latência total e comparar tokens de contexto e de saída por requisição antes e depois.', vai: 'kql', tom: 'ok', consequencia: 'sem erro, o suspeito é o volume por requisição.' },
              { texto: 'Reiniciar todas as réplicas.', vai: 'f-reinicio', tom: 'ruim', consequencia: 'reinício não muda tokens por chamada nem custo.' }
            ] },
            kql: { texto: 'O KQL por modelo e <code>request_id</code> mostra tokens de entrada por chamada dobrados desde a revisão de ontem. Qual é a ação imediata?', opcoes: [
              { texto: 'Devolver o tráfego à revisão estável pela tabela de tráfego e só então investigar o prompt e o contexto da revisão nova.', vai: 'controles', tom: 'ok', consequencia: 'o custo para de crescer em segundos, sem rebuild.' },
              { texto: 'Esperar o aviso do orçamento para decidir.', vai: 'f-orcamento', tom: 'ruim', consequencia: 'o orçamento avisa com atraso de horas, depois do gasto.' }
            ] },
            controles: { texto: 'Causa achada: um prompt maior e um histórico sem limite. Quais controles permanentes você propõe?', opcoes: [
              { texto: 'Alerta de queima de tokens, teto de <code>maxReplicas</code> e de TPM, limite por chamador e orçamento como aviso.', vai: 'f-bom', tom: 'ok', consequencia: 'cada controle atua antes ou durante o gasto; o orçamento é só o último aviso.' },
              { texto: 'Apenas o orçamento do Azure, com e-mail para o time.', vai: 'f-orcamento', tom: 'ruim', consequencia: 'relatório de dano sem teto.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'A causa saiu do prompt, não da infraestrutura, e a próxima mudança que dobrar tokens dispara o alerta antes da fatura.' },
            'f-replicas': { bom: false, texto: 'A computação também dobrou, os tokens por chamada continuaram iguais e o p95 não melhorou.' },
            'f-reinicio': { bom: false, texto: 'Nada mudou: os tokens por chamada e a fatura seguiram iguais.' },
            'f-orcamento': { bom: false, texto: 'O aviso chegou depois do estouro, sem nenhum teto que tivesse segurado o gasto.' }
          },
          callout: 'Você separou sintoma de causa, agiu por tráfego e fechou com tetos, não só com aviso.' },
        { tipo: 'escolha', id: 'obs-escolha-429', titulo: 'Confira: mais réplicas, mais erros',
          pergunta: 'Sob carga, o serviço recebe 429 do modelo. Alguém propõe subir <code>maxReplicas</code> de 10 para 100. O que acontece e o que você faz?',
          opcoes: [
            { id: 'a', texto: 'Melhora: cada réplica traz uma fatia da cota.', correta: false, porque: 'a cota é do recurso de modelo, não das réplicas.' },
            { id: 'b', texto: 'Piora: mais requisições recebem 429 e as retentativas amplificam a carga. Trate a cota (TPM), fila ou limite por chamador, ou um gateway com fallback entre implantações.', correta: true, porque: '"Mais réplicas, mais erros" é o sintoma de a cota ser o gargalo.' },
            { id: 'c', texto: 'Indiferente: o ingresso limita as requisições por conta própria.', correta: false, porque: 'o ingresso não conhece a cota de tokens do modelo.' },
            { id: 'd', texto: 'Melhora, desde que a memória por réplica aumente junto.', correta: false, porque: 'memória não é a restrição aqui.' }
          ], tutorDepois: 'Antes de aumentar o teto, confira a cota do modelo; o alerta de saturação já pede isso.' },
        { tipo: 'escolha', id: 'obs-escolha-orc', titulo: 'Confira: o orçamento que "protege"',
          pergunta: 'Um colega diz que o orçamento mensal configurado no Azure já protege a empresa de um laço de cliente. Qual a resposta?',
          opcoes: [
            { id: 'a', texto: 'Correto: ao chegar em 100% o Azure bloqueia o consumo.', correta: false, porque: 'o orçamento não bloqueia gasto.' },
            { id: 'b', texto: 'Incorreto: ele notifica com atraso de horas, depois do custo. A proteção vem de tetos prévios (<code>maxReplicas</code>, TPM, limite por chamador) e, no limite, de uma ação automática no aviso.', correta: true, porque: 'orçamento sem teto é um relatório de dano.' },
            { id: 'c', texto: 'Correto, mas só para computação; tokens são bloqueados pela cota.', correta: false, porque: 'a cota limita a vazão por minuto, não um total mensal, e o orçamento não bloqueia nada.' }
          ], tutorDepois: 'Pense no orçamento como alarme de incêndio, não como extintor.' },
        { tipo: 'takeaway', html: 'Sem erro, o suspeito é o <mark>volume por requisição</mark>: meça <mark>tokens</mark> antes e depois; os tetos protegem, o orçamento <mark>avisa</mark>.' }
      ] }
    ]
  });
})();
