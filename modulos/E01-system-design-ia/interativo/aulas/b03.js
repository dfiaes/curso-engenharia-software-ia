/* E01 · Bloco 3: o que muda com LLM. Fonte: E01.html#b03. Preços hipotéticos: grande US$ 3/15 e pequeno US$ 0,25/1,25 por milhão de tokens (entrada/saída). Batch "na faixa de 50%" em vários provedores: confirme na tabela atual do seu provedor. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasCaso1 = function () {
    return [
      { id: 'lat', nome: 'Latência', descricao: 'Fila + TTFT + saída ÷ taxa', tom: 'dns', ms: 7, linhas: [
        L('info', 'Caso 1: 0,4 s (recuperação) + 0,8 s (TTFT), 350 tokens de saída a 60 tokens/s'),
        L('cmd', 'latência = 0,4 + 0,8 + 350 / 60'),
        L('out', '= 7,03 s'),
        L('hint', 'a decodificação é sequencial: cada token de saída custa 1/60 s')] },
      { id: 'cortar', nome: 'Cortar a saída', descricao: 'De 350 para 150 tokens', tom: 'tcp', ms: 4, linhas: [
        L('cmd', 'economia = (350 - 150) / 60'),
        L('out', '≈ 3,3 s a menos, e 20% do custo por requisição'),
        L('hint', 'os tokens de saída custam cinco vezes os de entrada neste preço hipotético')] },
      { id: 'rpm', nome: 'Cota: RPM', descricao: 'QPS de pico x 60 x folga', tom: 'tls', ms: 3, linhas: [
        L('cmd', 'RPM = 4,17 x 60 x 1,3'),
        L('out', '= 325 RPM')] },
      { id: 'tpm', nome: 'Cota: TPM', descricao: 'RPM x tokens por requisição', tom: 'request', ms: 12, linhas: [
        L('cmd', 'TPM = 325 x 3.850'),
        L('out', '= 1.251.250 TPM'),
        L('hint', 'em RAG cada requisição carrega milhares de tokens de contexto: o TPM aperta primeiro')] },
      { id: 'cota', nome: 'Contra a cota', descricao: 'Concedido: 600 RPM e 1.000.000 TPM', tom: 'response', ms: 12, linhas: [
        L('out', 'RPM: 325 de 600 (54%): folga'),
        L('out', 'TPM: 1.251.250 de 1.000.000 (125%): excede'),
        L('in', 'o gargalo é o TPM: vai dar 429 no pico')] },
      { id: 'custo', nome: 'Custo', descricao: 'Por requisição e por mês', tom: 'ink', ms: 8, linhas: [
        L('cmd', 'custo/requisição = (3.500 x 3 + 350 x 15) / 1e6'),
        L('out', '≈ US$ 0,0158'),
        L('cmd', 'custo/mês = 50.000 x 30 x 0,01575'),
        L('out', '≈ US$ 23.625'),
        L('in', 'a unidade de consumo mudou: a conta é em tokens, não em requisições')] }
    ];
  };

  var codigoCalc = [
    'def latencia(fila_ttft_s, tok_out, tps):',
    '    """Fila + TTFT + saída / tokens por segundo (s)."""',
    '    return 0.0',
    '',
    '',
    'def cota_necessaria(qps_pico, tok_in, tok_out, folga=0.3):',
    '    """(RPM, TPM) de pico, com folga."""',
    '    return 0, 0',
    '',
    '',
    'def gargalo(rpm, tpm, cota_rpm, cota_tpm):',
    '    """Lista, em ordem RPM e TPM, quais limites a necessidade excede. Vazio se cabe."""',
    '    return []',
    '',
    '',
    'def custo_requisicao(tok_in, tok_out, preco_in, preco_out):',
    '    """US$ por requisição; preços em US$ por milhão de tokens."""',
    '    return 0.0',
    '',
    '',
    'def custo_mensal(req_dia, custo_req, acerto_cache=0.0, fracao_modelo_pequeno=0.0, custo_req_pequeno=0.0):',
    '    """Custo de 30 dias. O cache evita a chamada; a fração roteada paga o preço do modelo pequeno."""',
    '    return 0.0',
    ''].join('\n');
  var testesCalc = [
    'GRANDE = custo_requisicao(3500, 350, 3, 15)',
    'PEQUENO = custo_requisicao(3500, 350, 0.25, 1.25)',
    '',
    '',
    'def test_caso1_latencia_cota_custo():',
    '    assert abs(latencia(1.2, 350, 60) - 7.0333) < 0.001',
    '    rpm, tpm = cota_necessaria(4.1667, 3500, 350)',
    '    assert abs(rpm - 325) < 0.2 and abs(tpm - 1251250) < 800',
    '    assert abs(GRANDE - 0.01575) < 1e-9',
    '    assert abs(custo_mensal(50000, GRANDE) - 23625) < 0.01',
    '',
    '',
    'def test_alavancas_cache_e_roteamento():',
    '    assert abs(custo_mensal(50000, GRANDE, 0.2) - 18900) < 0.01',
    '    assert abs(custo_mensal(50000, GRANDE, 0.2, 0.5, PEQUENO) - 10237.5) < 0.01',
    '',
    '',
    'def test_borda_tpm_aperta_e_rpm_nao():',
    '    assert gargalo(325, 1251250, 600, 1_000_000) == ["TPM"]',
    '    assert gargalo(325, 900_000, 600, 1_000_000) == []',
    '',
    '',
    'def test_falha_entradas_invalidas():',
    '    for chamada in (lambda: latencia(1, 100, 0), lambda: custo_mensal(100, 0.01, 1.5), lambda: custo_mensal(100, 0.01, 0, -0.1, 0.001)):',
    '        try:',
    '            chamada()',
    '        except ValueError:',
    '            continue',
    '        raise AssertionError("deveria levantar ValueError")',
    '',
    '',
    'def test_controle_negativo_cache_com_5_por_cento_quase_nao_economiza():',
    '    base = custo_mensal(50000, GRANDE)',
    '    economia = base - custo_mensal(50000, GRANDE, 0.05)',
    '    assert abs(economia - 1181.25) < 0.01',
    '    assert economia < 0.3 * (base - custo_mensal(50000, GRANDE, 0.2))',
    ''].join('\n');
  var solucaoCalc = [
    'def latencia(fila_ttft_s, tok_out, tps):',
    '    if tps <= 0:',
    '        raise ValueError("tps deve ser positivo")',
    '    return fila_ttft_s + tok_out / tps',
    '',
    '',
    'def cota_necessaria(qps_pico, tok_in, tok_out, folga=0.3):',
    '    rpm = qps_pico * 60 * (1 + folga)',
    '    return rpm, rpm * (tok_in + tok_out)',
    '',
    '',
    'def gargalo(rpm, tpm, cota_rpm, cota_tpm):',
    '    saida = []',
    '    if rpm > cota_rpm:',
    '        saida.append("RPM")',
    '    if tpm > cota_tpm:',
    '        saida.append("TPM")',
    '    return saida',
    '',
    '',
    'def custo_requisicao(tok_in, tok_out, preco_in, preco_out):',
    '    return (tok_in * preco_in + tok_out * preco_out) / 1e6',
    '',
    '',
    'def custo_mensal(req_dia, custo_req, acerto_cache=0.0, fracao_modelo_pequeno=0.0, custo_req_pequeno=0.0):',
    '    if not 0 <= acerto_cache <= 1 or not 0 <= fracao_modelo_pequeno <= 1:',
    '        raise ValueError("fração fora de [0, 1]")',
    '    misto = (1 - fracao_modelo_pequeno) * custo_req + fracao_modelo_pequeno * custo_req_pequeno',
    '    return req_dia * 30 * misto * (1 - acerto_cache)',
    ''].join('\n');

  TrilhaAula.registrar({
    id: 'e01-b3',
    titulo: 'O que muda com LLM: latência, cota, custo e qualidade',
    minutos: 50,
    resumo: 'Um LLM como serviço tem cinco características que invalidam hábitos de dimensionamento: latência em duas fases, vazão por cota em tokens, custo variável, saída não determinística e qualidade que se degrada em silêncio.',
    objetivo: 'Dimensionar latência, RPM/TPM e custo de um sistema com LLM, escolher entre cache, batch, roteamento e fallback sabendo o que cada um custa e escrever SLOs que incluem TTFT, qualidade e custo.',
    revisao: [
      { id: 'e01b3-lat', pergunta: 'Qual mudança poupa mais tempo de latência total?',
        opcoes: [
          opc('a', 'Cortar a resposta de 350 para 150 tokens: poupa 200 ÷ 60 ≈ 3,3 s', true, 'a decodificação é sequencial; o prefill é paralelo e sublinear, então cortar entrada ajuda menos a latência (embora ajude no custo).'),
          opc('b', 'Cortar 1.000 tokens da entrada', false, 'o prefill processa a entrada em paralelo; o ganho é menor.'),
          opc('c', 'Ligar o streaming', false, 'streaming não encurta o total, só a espera percebida (TTFT).')] },
      { id: 'e01b3-tpm', pergunta: 'RAG com 325 RPM e 1.251.250 TPM no pico; cota de 600 RPM e 1.000.000 TPM. Qual limite aperta?',
        opcoes: [
          opc('a', 'O TPM: precisa de 1,25 M e a cota é 1 M', true, 'em RAG cada requisição carrega milhares de tokens de contexto; olhar só o RPM é o erro de quem dimensiona como CRUD.'),
          opc('b', 'O RPM: 325 está perto de 600', false, '325 de 600 é folga.'),
          opc('c', 'Nenhum: 325 < 600 resolve', false, 'o TPM excede a cota.')] },
      { id: 'e01b3-sli', pergunta: 'A disponibilidade é 99,95% e a satisfação cai há um mês, sem alarme. O que explica?',
        opcoes: [
          opc('a', 'O status code mede transporte, não qualidade: falta um SLI de qualidade com amostra julgada', true, 'uma resposta errada com HTTP 200 conta como sucesso para o health check.'),
          opc('b', 'Os usuários exageram: HTTP 200 prova sucesso', false, 'é a armadilha de quem vem de sistemas determinísticos.'),
          opc('c', 'Basta subir o SLO para 99,99%', false, 'mais noves não medem qualidade.')] },
      { id: 'e01b3-cache', pergunta: 'Quando o cache semântico vale o risco?',
        opcoes: [
          opc('a', 'Quando o hit rate medido em logs justifica, com limiar calibrado, escopo por tenant e auditoria de amostra', true, 'o ganho é hit rate x custo evitado; o risco é falso positivo silencioso e vazamento de escopo.'),
          opc('b', 'Sempre: pega paráfrases', false, 'sem medir o hit rate real, a complexidade pode ficar sem economia.'),
          opc('c', 'Nunca: o cache exato cobre tudo', false, 'o semântico tem uso, mas só com medição e controle.')] },
      { id: 'e01b3-batch', pergunta: 'Para que serve a API de batch?',
        opcoes: [
          opc('a', 'Trabalho que pode esperar horas (classificação de backlog, extração em lote, avaliação offline, embeddings em massa), com desconto', true, 'troca latência por preço e vazão; em vários provedores o desconto está na faixa de 50%, mas confirme na tabela atual.'),
          opc('b', 'Respostas de chat em que o usuário espera', false, 'não serve para nada em que uma pessoa espera.'),
          opc('c', 'Reduzir o TTFT', false, 'o batch aumenta a latência.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Um serviço de resumo passou em todos os testes de carga com um servidor simulado que respondia em 50 ms. Em produção, com o modelo real, cada resposta durou entre 4 e 40 segundos, o pool de conexões esgotou, a cota de tokens por minuto zerou ao meio-dia e a fatura foi calculada pelo comprimento das respostas, não pelo número delas. Nada disso era bug: eram propriedades do componente novo.</p>' +
          '<h3>Latência de geração: TTFT e tokens por segundo</h3>' +
          '<p>Um modelo gera a resposta um token por vez; cada token depende dos anteriores. O tempo total tem duas fases de naturezas diferentes. O <strong>prefill</strong> processa todo o prompt de uma vez, em paralelo na GPU; seu tempo cresce com os tokens de entrada, de forma sublinear em relação a processá-los um a um. O <strong>TTFT</strong> (time to first token) é fila mais prefill. A <strong>decodificação</strong> é sequencial e, em geral, limitada pela leitura de memória, e não por cálculo; sua taxa (tokens por segundo) é uma propriedade do modelo e da carga do provedor.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: 'latência até o último token = fila + TTFT + (tokens de saída ÷ tokens por segundo)\nexemplo do Caso 1:  0,4 (recuperação) + 0,8 (TTFT) + 350 ÷ 60 = 7,03 s' },
        { tipo: 'texto', html:
          '<p>Duas consequências guiam o desenho. A <strong>saída é a alavanca de latência e de custo</strong>: cortar a resposta de 350 para 150 tokens poupa 3,3 s e 20% do custo por requisição. Peça respostas curtas, formato estruturado enxuto e limite <code>max_tokens</code> com critério. E o <strong>streaming não reduz a latência total, mas reduz a percebida</strong>: o usuário começa a ler no TTFT. Por isso o SLO de uma interface de chat é sobre TTFT, e o de um job assíncrono é sobre o tempo total.</p>' +
          '<h3>Vazão limitada por cota: RPM e TPM</h3>' +
          '<p>O provedor limita o que sua conta consome por minuto: <strong>RPM</strong> (requisições) e <strong>TPM</strong> (tokens), em geral por modelo e por nível de uso, às vezes com limites separados para entrada e saída e para requisições concorrentes. Excedê-los devolve <code>429</code>. Calcule os dois e veja qual aperta:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: 'RPM  = QPS de pico x 60 x (1 + folga)\nTPM  = QPS de pico x 60 x (tokens de entrada + saída) x (1 + folga)\nCaso 1: 4,17 x 60 x 1,3 = 325 RPM   ·   325 x 3.850 = 1.251.250 TPM' },
        { tipo: 'texto', html:
          '<p>Em RAG, o TPM aperta primeiro. Em agentes, a conta é pior: cada passo reenvia o histórico, e o consumo cresce de forma quadrática com o número de passos (bloco 5). Dois cuidados de leitura da documentação do provedor, porque variam: como a cota conta os tokens de entrada em cache e como conta a saída (alguns provedores reservam o <code>max_tokens</code> pedido no início da requisição, e um valor generoso demais consome cota que nunca será usada). As cotas crescem por pedido e por histórico de gasto, não instantaneamente: a solicitação de aumento entra no cronograma, com semanas de antecedência.</p>' +
          '<p>O limite precisa ser distribuído internamente (balde por tenant, bloco 2), e o cliente do gateway deve tratar 429 e 5xx com <strong>backoff exponencial com jitter</strong>, respeitando <code>Retry-After</code>, dentro de um <em>deadline</em> total (AWS Builders\' Library). Retry sem limite multiplica a carga justamente quando o provedor está mal.</p>' +
          '<h3>Custo, não determinismo e qualidade</h3>' +
          '<p><strong>Custo por requisição é requisito de primeira classe.</strong> Aqui o custo marginal é real e variável: depende dos tokens de entrada, dos de saída e do modelo. O orçamento entra nos requisitos ("custo médio abaixo de US$ 0,02 por requisição, p99 abaixo de US$ 0,10"); o custo é medido por requisição e atribuído a tenant, funcionalidade e versão de prompt; e há tetos de segurança por requisição, por tarefa, por tenant e por mês, com corte automático, porque um loop ou um prompt malicioso gasta dinheiro à velocidade da API.</p>' +
          '<p><strong>Não determinismo.</strong> A mesma entrada pode produzir saídas diferentes: a amostragem é probabilística e, mesmo com temperatura zero, a ordem de operações em paralelo e as atualizações silenciosas do modelo alteram o resultado. Testes unitários exatos deixam de bastar; a qualidade vira uma <strong>distribuição</strong> medida em evals, com gate na CI antes de cada mudança de prompt, modelo ou índice. A produção precisa de <strong>avaliação contínua</strong>: amostrar uma fração do tráfego real, julgar (humano, regras ou LLM como juiz, com ressalvas conhecidas) e acompanhar a taxa de aprovação como um SLI. Julgar 5% das respostas do Caso 1 custa US$ 1.125 por mês.</p>' },
        { tipo: 'takeaway', html: 'A <mark>saída</mark> domina latência e custo, o <mark>TPM</mark> costuma apertar antes do RPM, e a <mark>qualidade</mark> precisa de medição própria.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Os números abaixo são os do Caso 1 do bloco 4 (preços hipotéticos). Rode a conta e observe qual limite aperta contra uma cota concedida de 600 RPM e 1.000.000 TPM.</p>' },
        { tipo: 'rode', id: 'llm-rode', titulo: 'Latência, cota e custo do Caso 1', enunciado: 'Aperte Enter e clique em cada etapa. A apresentação do terminal é ilustrativa; a aritmética é a do texto-fonte.',
          prefixo: '$', entrada: 'python caso1.py --cota-rpm 600 --cota-tpm 1000000', unidade: 's', terminalTitulo: 'Caso 1 contra a cota', etapas: etapasCaso1(),
          prever: { pergunta: 'O provedor concedeu 600 RPM e 1.000.000 TPM. A necessidade do Caso 1 é 325 RPM e 1.251.250 TPM. Qual limite estoura?', opcoes: [
            { id: 'a', texto: 'O RPM: está perto de 600.', correta: false, porque: '325 de 600 é folga de 46%.' },
            { id: 'b', texto: 'O TPM: precisa de 1,25 M e a cota é 1 M.', correta: true, porque: 'cada requisição de RAG carrega milhares de tokens de contexto; o TPM é o que aperta primeiro.' },
            { id: 'c', texto: 'Nenhum dos dois.', correta: false, porque: 'olhar só o RPM é o erro típico de quem dimensiona como CRUD.' }
          ] },
          tutorAntes: 'Preveja qual limite estoura e aperte Enter.',
          tutorDepois: 'Para sair do 429: negociar cota, reduzir contexto, cachear prefixo, rotear ou distribuir entre tenants.',
          callout: 'Você viu o TPM estourar enquanto o RPM tinha folga.' },
        { tipo: 'texto', html:
          '<h3>As alavancas e o que cada uma custa</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Alavanca</th><th>Ganha</th><th>Paga com</th></tr></thead><tbody>' +
          '<tr><td>Resposta mais curta</td><td>latência e custo</td><td>completude; revisar com avaliação</td></tr>' +
          '<tr><td>Modelo menor / roteamento</td><td>custo e latência</td><td>qualidade em casos difíceis; complexidade do roteador</td></tr>' +
          '<tr><td>Cache semântico</td><td>custo e latência</td><td>risco de resposta errada e de vazamento de escopo</td></tr>' +
          '<tr><td>Batch</td><td>custo (cerca de metade) e vazão</td><td>latência de horas; fluxo assíncrono</td></tr>' +
          '<tr><td>Fallback multi-provedor</td><td>disponibilidade</td><td>manutenção de prompts, avaliação duplicada, dado em mais de um lugar</td></tr>' +
          '<tr><td>Mais contexto recuperado</td><td>chance de conter a resposta</td><td>custo, TTFT e ruído que confunde o modelo</td></tr>' +
          '</tbody></table>' },
        { tipo: 'abas', rotulo: 'Cada alavanca em detalhe', itens: [
          { rotulo: 'Cache', blocos: [
            { tipo: 'texto', largo: true, html:
              '<table><thead><tr><th>Tipo</th><th>Como funciona</th><th>Ganho</th><th>Risco</th></tr></thead><tbody>' +
              '<tr><td><strong>Exato</strong></td><td>chave = hash da entrada normalizada + modelo + parâmetros + versões</td><td>custo e latência da resposta repetida caem a quase zero</td><td>baixo; só repete o idêntico. O hit rate depende de repetição real, muitas vezes abaixo do esperado</td></tr>' +
              '<tr><td><strong>Semântico</strong></td><td>embedding da pergunta; se houver vizinho acima de um limiar, devolve a resposta guardada</td><td>pega paráfrases; hit rate maior</td><td>falso positivo silencioso; exige limiar calibrado, escopo por tenant e permissão, e auditoria de amostra</td></tr>' +
              '<tr><td><strong>De prefixo</strong> (do provedor)</td><td>parte inicial idêntica do prompt (instruções, ferramentas, documentos) é reaproveitada; entrada em cache custa uma fração e reduz a latência</td><td>grande em agentes e RAG com prompt de sistema longo</td><td>exige ordenar o prompt com o estável antes do variável; validade curta (minutos); regras de mínimo de tokens variam</td></tr>' +
              '</tbody></table>' },
            { tipo: 'texto', html:
              '<p>Meça antes de prometer: o ganho é <code>hit rate x custo evitado</code>, e o hit rate real vem de logs, não de intuição. No Caso 1 supomos 20% de acertos, o que corta US$ 23.625 para US$ 18.900 por mês; se o tráfego for 5% repetitivo, a economia some e a complexidade fica.</p>' }] },
          { rotulo: 'Batch e roteamento', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Batch.</strong> APIs de batch aceitam um arquivo com milhares de requisições e as processam de forma assíncrona numa janela (tipicamente até 24 h), com desconto (em vários provedores na faixa de 50% do preço síncrono; confirme na tabela atual) e cota separada da síncrona. Você troca latência por preço e vazão. Serve para classificação de backlog, extração em lote, avaliação offline, embeddings em massa e relatórios noturnos; não serve para nada em que uma pessoa espera.</p>' +
              '<p><strong>Roteamento por complexidade.</strong> A maior parte das requisições é simples, e o modelo grande é caro. O roteamento escolhe o modelo por requisição: uma regra (tipo de tarefa, tamanho), um classificador pequeno ou uma <strong>cascata</strong> (tenta o modelo barato, valida a saída e escala para o caro se falhar). Com 50% das requisições do Caso 1 num modelo pequeno, o custo médio por requisição cai de US$ 0,0158 para US$ 0,0085. O risco é a qualidade: o roteador erra, e o erro cai sempre na ponta barata. O roteamento só entra com avaliação por classe de requisição e com taxa de escalonamento medida; sem esses números, é um corte de custo disfarçado de otimização.</p>' }] },
          { rotulo: 'Fallback', blocos: [
            { tipo: 'texto', html:
              '<p>Provedores têm incidentes, limites e depreciações. A resiliência exige uma cadeia de <strong>fallback</strong>: modelo principal, modelo alternativo (do mesmo provedor ou de outro), resposta degradada (cache, resposta pré-escrita, "não consegui agora, sua solicitação foi registrada"). Mecânica: <em>circuit breaker</em> que abre depois de N falhas e testa a recuperação aos poucos, <em>timeouts</em> por tentativa e um orçamento de tempo total.</p>' +
              '<p>As armadilhas são específicas: prompts não são portáveis entre modelos; formatos de saída estruturada e de tool calling diferem; e o fallback precisa passar pelo mesmo conjunto de avaliação, ou será um caminho de qualidade desconhecida ativado no pior momento. Fallback para provedor diferente também muda onde os dados trafegam, o que pode ferir requisitos de residência e contratos. Teste o fallback de verdade, com injeção de falha, em ambiente controlado.</p>' }] },
          { rotulo: 'Guardrails', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Guardrails</strong> são verificações antes e depois do modelo: filtro de entrada (injeção de prompt, dado sensível, fora de escopo), validação de saída (esquema, citações presentes, política de conteúdo, ausência de dado de outro tenant). Cada guardrail acrescenta latência e, se for um LLM, custo e uma fonte de falso positivo. Aplique os determinísticos e baratos em todas as requisições (esquema, regex, lista de bloqueio, checagem de permissão) e os caros por amostragem ou por risco da ação. No desenho, o guardrail aparece como etapa explícita, com orçamento de latência.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'Toda alavanca tem preço: <mark>cache</mark> custa risco, <mark>roteamento</mark> custa qualidade, <mark>batch</mark> custa latência, <mark>fallback</mark> custa manutenção.' }
      ] },

      { rotulo: 'SLOs e julgamento', blocos: [
        { tipo: 'texto', html:
          '<h3>SLOs para sistemas com LLM</h3>' +
          '<p>Um <strong>SLI</strong> (service level indicator) é uma medida; um <strong>SLO</strong> (service level objective) é a meta para ela num período; o <strong>orçamento de erro</strong> é a fração permitida de descumprimento (Google SRE Book, cap. 4). Para LLM acrescentam-se SLIs que o SRE clássico não tinha:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Dimensão</th><th>SLI</th><th>Exemplo de SLO</th></tr></thead><tbody>' +
          '<tr><td>Disponibilidade</td><td>fração de requisições com resposta útil</td><td>99,5% em 30 dias; definir se a resposta de fallback conta</td></tr>' +
          '<tr><td>Latência percebida</td><td>TTFT p95</td><td>≤ 1,5 s em 95% das requisições</td></tr>' +
          '<tr><td>Latência total</td><td>tempo até o último token, p95 e p99</td><td>p95 ≤ 10 s</td></tr>' +
          '<tr><td>Qualidade</td><td>taxa de aprovação em amostra julgada de tráfego real</td><td>≥ 90% de respostas fundamentadas, janela de 7 dias</td></tr>' +
          '<tr><td>Segurança</td><td>incidentes de vazamento entre tenants</td><td>zero; qualquer ocorrência é incidente</td></tr>' +
          '<tr><td>Custo</td><td>custo por requisição (média e p99) e gasto mensal contra orçamento</td><td>média ≤ US$ 0,011; alerta em 80% do orçamento</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O SLO de qualidade só existe se houver amostragem e julgamento contínuos, e o de custo só existe se o custo for medido por requisição. O orçamento de erro serve para decisão: se a qualidade consome o orçamento, congela-se mudança de prompt e modelo; se o custo ultrapassa 80% do mês, ativam-se roteamento mais agressivo e limites mais apertados. Alertas ficam em consumo de orçamento (<em>burn rate</em>), não em um valor instantâneo ruidoso (SRE Workbook, "Alerting on SLOs").</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          '<p>Escrever um SLO de disponibilidade e tratar uma resposta errada, porém com HTTP 200, como sucesso. O sistema fica "no ar" enquanto entrega respostas ruins por semanas, porque nenhum health check mede qualidade. Aqui o status code mede o transporte; a qualidade precisa de um SLI próprio, com amostra julgada e alerta.</p>' },
        { tipo: 'transcript', id: 'llm-transcript', titulo: 'Design review: ache as afirmações que não se sustentam', obrigatorio: false, terminalTitulo: 'design review do assistente',
          enunciado: 'Num design review, cinco afirmações do autor não se sustentam diante do que o bloco mostra. Clique nas linhas que você reprovaria e aperte Conferir.',
          linhas: [
            { quem: 'agente', texto: 'Testamos carga com um servidor simulado de 50 ms e o serviço aguentou 500 QPS.' },
            { quem: 'voce', texto: 'E com o modelo real?' },
            { quem: 'agente', texto: 'O streaming reduz a latência total, então o SLO de 10 s fica tranquilo.' },
            { quem: 'agente', texto: 'Pedimos 325 RPM e a cota é 600, então a cota está coberta.' },
            { quem: 'agente', texto: 'A saída de 350 tokens a 60 tokens/s dá cerca de 5,8 s, mais 0,4 s de recuperação e 0,8 s de TTFT: 7,03 s.' },
            { quem: 'agente', texto: 'Medimos custo médio por requisição e está dentro do teto; o 1% de contextos enormes não importa.' },
            { quem: 'agente', texto: 'O fallback para o segundo provedor usa o mesmo prompt do principal; não rodamos a avaliação nele, mas deve ficar parecido.' }
          ],
          erradas: [0, 2, 3, 5, 6],
          explicacao: {
            0: 'com o modelo real cada resposta dura de 4 a 40 s: o pool de conexões esgota. O teste de carga com modelo simulado rápido não mede o componente novo.',
            2: 'streaming não reduz a latência total, só a percebida: o usuário começa a ler no TTFT.',
            3: 'o limite que aperta em RAG é o TPM: 1.251.250 contra uma cota que pode não existir. Olhar só o RPM é dimensionar como CRUD.',
            5: 'a cauda decide: 1% das requisições com contexto enorme pode ser 20% do gasto. Meça p99 de custo e ponha tetos de tokens.',
            6: 'prompts não são portáveis entre modelos, e o fallback precisa passar pelo mesmo conjunto de avaliação; senão é um caminho de qualidade desconhecida ativado no pior momento.'
          },
          tutorDepois: 'A linha da latência de 7,03 s está certa: é a única com aritmética que você consegue refazer.' },
        { tipo: 'escreva', id: 'llm-escreva', titulo: 'Escreva os SLIs que o SRE clássico não tinha', obrigatorio: false,
          enunciado: 'Para o assistente de suporte (chat com streaming), escreva SLIs e SLOs de latência percebida, qualidade e custo, e diga o que você faz quando o orçamento de qualidade ou de custo acaba.',
          placeholder: 'TTFT ...; qualidade ...; custo ...; quando o orçamento acaba ...',
          rubrica: [
            'A latência é medida em <strong>TTFT</strong> (percentil), e não só no tempo total.',
            'A qualidade tem uma <strong>amostra julgada de tráfego real</strong> e uma meta numérica.',
            'O custo é medido <strong>por requisição</strong> (média e cauda) com alerta em fração do orçamento.',
            'Há uma <strong>ação</strong> quando o orçamento acaba (congelar mudança, rotear, apertar limites).'],
          modelo: '<ul><li>TTFT p95 ≤ 1,5 s medido no gateway; tempo total p95 ≤ 10 s.</li><li>≥ 90% de respostas fundamentadas em amostra julgada do tráfego real, janela de 7 dias.</li><li>Custo médio ≤ US$ 0,011 por requisição e p99 com teto; alerta em 80% do orçamento mensal.</li><li>Se a qualidade consome o orçamento de erro, congela-se mudança de prompt e modelo; se o custo passa de 80%, roteamento mais agressivo e limites mais apertados. Alertas em burn rate.</li></ul>' },
        { tipo: 'takeaway', html: 'O <mark>status code</mark> mede transporte; <mark>qualidade</mark> e <mark>custo</mark> precisam de SLI próprio, e o orçamento de erro decide a ação.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'llm-python', titulo: 'A calculadora do Caso 1', obrigatorio: false,
          enunciado: 'Implemente as cinco funções: <code>latencia</code>, <code>cota_necessaria</code>, <code>gargalo</code> (quais limites a necessidade excede), <code>custo_requisicao</code> e <code>custo_mensal</code> (com cache e roteamento). Preços em US$ por milhão de tokens; o modelo pequeno custa US$ 0,25 e US$ 1,25.',
          codigo: codigoCalc, testes: testesCalc,
          dica: '<code>custo_mensal = req_dia * 30 * misto * (1 - acerto)</code>, com <code>misto = (1 - f) * grande + f * pequeno</code>. Levante <code>ValueError</code> para frações fora de [0, 1] e <code>tps</code> não positivo.',
          solucao: solucaoCalc,
          tutorDepois: 'Os números fecham com o texto: US$ 23.625 base, US$ 18.900 com cache de 20% e US$ 10.238 com roteamento de 50%.',
          callout: 'A calculadora reproduz o Caso 1 e acusa o TPM como o limite que estoura.' },
        { tipo: 'ordene', id: 'llm-ordene', titulo: 'Ordene a cadeia de fallback', obrigatorio: false, enunciado: 'Do primeiro ao último recurso quando o provedor falha.',
          itens: [
            { id: 'degradado', texto: 'Resposta degradada (cache, texto pré-escrito ou "sua solicitação foi registrada")' },
            { id: 'principal', texto: 'Modelo principal, com timeout por tentativa e backoff com jitter' },
            { id: 'alternativo', texto: 'Modelo alternativo (mesmo provedor ou outro), que passou pelo mesmo conjunto de avaliação' }
          ],
          solucao: ['principal', 'alternativo', 'degradado'],
          dica: 'Do melhor comportamento ao pior aceitável; o circuit breaker decide quando descer de nível.',
          callout: 'Principal, alternativo avaliado e degradado: o produto continua útil quando o modelo cai.' },
        { tipo: 'escolha', id: 'llm-escolha-lat', titulo: 'Confira: o que poupa mais tempo',
          pergunta: 'Latência = fila + TTFT + saída ÷ tokens por segundo. No Caso 1: 0,4 + 0,8 + 350 ÷ 60 = 7,03 s. Qual mudança poupa mais tempo?',
          opcoes: [
            { id: 'a', texto: 'Cortar a resposta de 350 para 150 tokens: poupa 200 ÷ 60 ≈ 3,3 s (e ainda 20% do custo).', correta: true, porque: 'a decodificação é sequencial: cada token de saída custa 1/60 s.' },
            { id: 'b', texto: 'Cortar 1.000 tokens da entrada.', correta: false, porque: 'o prefill é paralelo e sublinear; poupa bem menos.' },
            { id: 'c', texto: 'Trocar HTTP/1.1 por HTTP/2.', correta: false, porque: 'não toca no tempo de geração.' },
            { id: 'd', texto: 'Aumentar o número de réplicas.', correta: false, porque: 'réplicas não encurtam a geração de uma resposta.' }
          ], tutorDepois: 'Streaming encurta a espera percebida, não o total.' },
        { tipo: 'escolha', id: 'llm-escolha-qual', titulo: 'Confira: o mês sem alarme',
          pergunta: 'A plataforma mostra 99,95% de disponibilidade e a satisfação dos usuários cai há um mês, sem alarme. Qual a explicação e o conserto?',
          opcoes: [
            { id: 'a', texto: 'O monitoramento está com bug; basta adicionar logs.', correta: false, porque: 'o monitoramento mede o que foi configurado: transporte.' },
            { id: 'b', texto: 'Os usuários estão exagerando; HTTP 200 é prova de sucesso.', correta: false, porque: 'resposta errada com HTTP 200 conta como sucesso para o health check.' },
            { id: 'c', texto: 'O status code mede transporte, não qualidade: falta SLI de qualidade (amostra julgada de tráfego real), versões registradas e alerta com rollback.', correta: true, porque: 'a regressão só é explicável e reversível se prompt, modelo e índice estiverem versionados e atribuídos às respostas.' },
            { id: 'd', texto: 'Falta apenas subir o SLO para 99,99%.', correta: false, porque: 'mais noves não medem qualidade.' }
          ], tutorDepois: 'Sem amostra julgada, a primeira detecção é a reclamação do cliente.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Testar carga com modelo simulado rápido e concluir que o serviço aguenta.</li><li>Monitorar RPM e esquecer TPM, ou o contrário.</li><li>Prometer "99,9%" de disponibilidade a partir de um provedor cujo SLA é menor, sem fallback.</li><li>Tratar prompt, modelo e índice como configuração sem versão: a regressão fica inexplicável.</li><li>Declarar sucesso com média de custo e ignorar a cauda: 1% das requisições com contexto enorme pode ser 20% do gasto.</li></ul>' },
        { tipo: 'takeaway', html: 'Dimensione em <mark>tokens</mark>, meça <mark>qualidade</mark> como SLI e saiba <mark>o preço</mark> de cada alavanca.' }
      ] }
    ]
  });
})();
