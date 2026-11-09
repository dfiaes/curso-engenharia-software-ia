/* E01 · Bloco 5: Caso 2, plataforma de agentes que agem em sistemas de terceiros. Fonte: E01.html#b05.
   Saídas do capacity vêm da execução real do laboratório (11/10/2026). O traço do executor é ilustrativo (identificadores inventados). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoCusto = [
    'PRECO_IN = 3.0      # US$ por milhão de tokens de entrada (hipotético, como no módulo)',
    'PRECO_OUT = 15.0    # US$ por milhão de tokens de saída',
    'PRECO_CACHE = 0.3   # prefixo em cache: lê a 10% do preço de entrada', '', '',
    'def tokens_entrada(passos, base, crescimento):',
    '    """Soma do contexto reenviado: no passo i vão base + i*crescimento tokens."""',
    '    return 0', '', '',
    'def custo_usd(passos, base, crescimento, saida_passo, cache=0.0):',
    '    """Custo da tarefa. cache é a fração (0 a 1) da entrada que vem do prefixo em cache."""',
    '    if not 0 <= cache <= 1:',
    '        raise ValueError("cache fora de 0..1")',
    '    entrada = tokens_entrada(passos, base, crescimento)',
    '    saida = passos * saida_passo',
    '    return 0.0', '', '',
    'def passos_maximos(teto_usd, base, crescimento, saida_passo, cache=0.0, limite=200):',
    '    """Maior número de passos cujo custo total cabe no teto (0 se nem um passo cabe)."""',
    '    return 0', '',
    'print(tokens_entrada(10, 3000, 800), round(custo_usd(10, 3000, 800, 300), 4))', ''].join('\n');
  var testesCusto = [
    'def test_dez_passos():', '    assert tokens_entrada(10, 3000, 800) == 66000', '', '',
    'def test_custo_quadratico_nao_linear():',
    '    assert tokens_entrada(20, 3000, 800) == 212000', '    assert tokens_entrada(25, 3000, 800) == 315000', '', '',
    'def test_borda_zero_e_um_passo():',
    '    assert tokens_entrada(0, 3000, 800) == 0', '    assert tokens_entrada(1, 3000, 800) == 3000', '', '',
    'def test_custo_sem_cache():', '    assert abs(custo_usd(10, 3000, 800, 300) - 0.243) < 1e-6', '', '',
    'def test_custo_com_cache_e_tarefa_longa():',
    '    assert abs(custo_usd(10, 3000, 800, 300, cache=0.85) - 0.09153) < 1e-5',
    '    assert abs(custo_usd(25, 3000, 800, 300, cache=0.85) - 0.334575) < 1e-5', '', '',
    'def test_teto_por_tarefa():',
    '    assert passos_maximos(0.10, 3000, 800, 300, cache=0.85) == 10', '', '',
    'def test_teto_menor_que_um_passo():',
    '    assert passos_maximos(0.001, 3000, 800, 300) == 0', '', '',
    'def test_cache_invalido_levanta():',
    '    try:', '        custo_usd(10, 3000, 800, 300, cache=1.4)', '    except ValueError:', '        return',
    '    assert False, "cache 140% deveria levantar ValueError"', ''].join('\n');
  var solucaoCusto = [
    'PRECO_IN = 3.0', 'PRECO_OUT = 15.0', 'PRECO_CACHE = 0.3', '', '',
    'def tokens_entrada(passos, base, crescimento):',
    '    return passos * base + crescimento * passos * (passos - 1) // 2', '', '',
    'def custo_usd(passos, base, crescimento, saida_passo, cache=0.0):',
    '    if not 0 <= cache <= 1:', '        raise ValueError("cache fora de 0..1")',
    '    entrada = tokens_entrada(passos, base, crescimento)', '    saida = passos * saida_passo',
    '    return (entrada * (1 - cache) * PRECO_IN + entrada * cache * PRECO_CACHE + saida * PRECO_OUT) / 1e6', '', '',
    'def passos_maximos(teto_usd, base, crescimento, saida_passo, cache=0.0, limite=200):',
    '    melhor = 0', '    for k in range(1, limite + 1):',
    '        if custo_usd(k, base, crescimento, saida_passo, cache) > teto_usd:', '            break',
    '        melhor = k', '    return melhor', ''].join('\n');

  TrilhaAula.registrar({
    id: 'e01-b5',
    titulo: 'Caso 2: plataforma de agentes que agem em sistemas de terceiros',
    minutos: 45,
    resumo: 'No Caso 1 o pior erro é uma resposta ruim; aqui o agente faz coisas, e o pior erro é um efeito colateral duplicado, não autorizado ou irreversível. O desenho vira "no máximo uma vez, com permissão, dentro de um orçamento e com rastro".',
    objetivo: 'Dimensionar uma plataforma de agentes (Little, RPM por chamada, custo quadrático) e desenhar o executor de ações: política em código, aprovação humana, idempotência de efeitos, orçamento, sandbox e auditoria.',
    revisao: [
      { id: 'e01b5-rpm', pergunta: 'Plataforma de agentes: 1,39 tarefa/s, 10 chamadas ao modelo por tarefa, folga de 30%. Qual RPM você pede ao provedor?',
        opcoes: [
          opc('a', 'Cerca de 1.084 RPM: RPM conta chamadas ao modelo, não tarefas (1,39 × 10 × 60 × 1,3)', true, 'quem pede cota por tarefa pede dez vezes menos que o necessário e descobre em produção, com 429.'),
          opc('b', 'Cerca de 108 RPM (tarefas por minuto × 1,3)', false, 'conta tarefas, não chamadas ao modelo.'),
          opc('c', 'Cerca de 7,5 milhões de RPM', false, 'esse número é o TPM, outra unidade.')] },
      { id: 'e01b5-timeout', pergunta: 'O terceiro devolveu timeout depois do POST de pagamento e a fila vai repetir a tarefa. Qual é o protocolo?',
        opcoes: [
          opc('a', 'Chave determinística gravada antes (pendente) e enviada como Idempotency-Key; sem suporte do terceiro, verificar por leitura e, se incerto, aprovação humana', true, 'timeout depois de um POST não diz se o efeito ocorreu; a fila entrega pelo menos uma vez, e a idempotência do efeito é do executor.'),
          opc('b', 'Repetir o POST: a fila garante exatamente uma vez', false, 'não garante, e o efeito duplicaria.'),
          opc('c', 'Perguntar ao modelo se a ação funcionou', false, 'o modelo não tem como saber; a decisão de repetir é do executor determinístico.')] },
      { id: 'e01b5-politica', pergunta: 'Onde deve morar a regra "reembolso acima de R$ 500 exige aprovação humana"?',
        opcoes: [
          opc('a', 'No executor, como política em código versionado, avaliada antes de cada ação', true, 'prompt não é controle: pode ser ignorado, injetado ou degradar com o contexto.'),
          opc('b', 'No prompt do agente, em letras maiúsculas', false, 'pedir ao modelo que "tenha cuidado" não é controle.'),
          opc('c', 'No front-end, com um aviso ao usuário', false, 'o agente não passa pelo front-end.')] },
      { id: 'e01b5-quadratico', pergunta: 'Com base de 3.000 tokens e crescimento de 800 por passo, 10 passos reenviam 66.000 tokens de entrada. Quanto reenviam 20 passos?',
        opcoes: [
          opc('a', '212.000: n × base + crescimento × n(n−1)/2, mais de 3× para o dobro de passos', true, '3.000 × 20 + 800 × 190 = 212.000.'),
          opc('b', '132.000: o dobro de passos, o dobro de tokens', false, 'isso seria o custo linear; o histórico reenviado cresce a cada iteração.'),
          opc('c', '66.000: o cache de prefixo elimina o crescimento', false, 'o cache reduz o preço da parte repetida, não o volume reenviado.')] },
      { id: 'e01b5-cache', pergunta: 'Por que uma tarefa que espera aprovação humana por horas custa mais ao retomar?',
        opcoes: [
          opc('a', 'O cache de prefixo dura minutos: ao retomar, a entrada é paga cheia', true, 'considere isso no orçamento das tarefas com aprovação.'),
          opc('b', 'O worker precisa de mais memória', false, 'o estado é persistido a cada passo; o custo extra é de tokens.'),
          opc('c', 'O provedor cobra por hora de espera', false, 'a espera humana não é cobrada pelo provedor.')] }
    ],
    abas: [
      { rotulo: 'O caso e a estimativa', blocos: [
        { tipo: 'texto', html:
          '<h3>Por que esse caso muda o desenho</h3>' +
          '<p>No Caso 1 o pior erro é uma resposta ruim. No Caso 2 o agente <em>faz coisas</em>: reembolsa, reagenda, cria ticket, altera cadastro em sistemas que a sua empresa não controla. O pior erro passa a ser um <strong>efeito colateral</strong> duplicado, não autorizado ou irreversível, e a fatura deixa de ser proporcional ao número de usuários, porque um agente em loop gasta sozinho. A pergunta de desenho muda de "como respondo" para "como garanto que cada ação aconteça no máximo uma vez, com permissão, dentro de um orçamento e com rastro".</p>' +
          '<p>O comportamento do agente em si (loop, ferramentas, contexto) está no M08; a teoria de segurança e identidade, no M12; a garantia de entrega, no LT02. Este bloco as <strong>compõe e dimensiona</strong> (<code>python -m capacity 2</code>).</p>' },
        { tipo: 'texto', html:
          '<h3>Passo 1 · Requisitos e premissas</h3>' +
          '<p>Enunciado: uma plataforma em que clientes (organizações) configuram agentes que executam tarefas como "conciliar este extrato" ou "responder este e-mail e abrir chamado no sistema X", chamando APIs de terceiros com credenciais do cliente.</p>' +
          '<ul><li><strong>2 mil usuários ativos</strong>, 10 tarefas por usuário por dia, em 12 horas, pico de 3×.</li>' +
          '<li>Cada tarefa tem em média <strong>10 passos</strong> (uma chamada ao modelo e uma ferramenta por passo), 8 s de modelo e 3 s de ferramenta por passo.</li></ul>' +
          '<p>Requisitos que o enunciado esconde e que você deve extrair:</p>' +
          '<ul><li>Quais ações são <em>reversíveis</em>?</li><li>Quais exigem aprovação humana?</li><li>Qual o teto de gasto por tarefa e por tenant?</li><li>Quem responde por uma ação indevida (auditoria)?</li><li>As tarefas de um cliente podem atrasar as de outro?</li></ul>' },
        { tipo: 'texto', html:
          '<h3>Passo 2 · Estimativa</h3>' +
          '<p>Lei de Little (<code>L = λ × W</code>): itens simultâneos são a taxa de chegada vezes o tempo no sistema.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'tarefas/dia        = 2.000 × 10                       = 20.000',
          'pico               = 20.000 ÷ (12 × 3.600) × 3         ≈ 1,39 tarefas/s',
          'duração da tarefa  = 10 passos × (8 s modelo + 3 s ferramenta) = 110 s',
          'em voo (Little)    = 1,39 × 110                        ≈ 153 tarefas simultâneas',
          'workers a 70%      = 153 ÷ 0,7                         = 219',
          'tokens por tarefa  = entrada 10 × 3.000 + 800 × (0+1+…+9) = 66.000 · saída 10 × 300 = 3.000',
          'RPM (chamadas)     = 1,39 × 10 chamadas × 60 × 1,3     = 1.084',
          'TPM                = 1,39 × 60 × 69.000 × 1,3          ≈ 7,5 milhões'].join('\n') },
        { tipo: 'texto', html:
          '<p>Três números mudam a conversa.</p>' +
          '<ul><li><strong>153 tarefas simultâneas.</strong> O 1,39 tarefa/s parecia pequeno, mas cada tarefa dura quase dois minutos, e a lei de Little cobra isso em workers, conexões e estado em memória.</li>' +
          '<li><strong>RPM conta chamadas ao modelo, não tarefas.</strong> 1,39 tarefa/s são 14 chamadas/s; quem pede cota por tarefa pede dez vezes menos que o necessário.</li>' +
          '<li><strong>66 mil tokens de entrada</strong> para uma tarefa cuja saída são 3 mil: o agente relê o histórico a cada passo, e o contexto cresce em cada iteração.</li></ul>' },
        { tipo: 'callout', tom: 'info', titulo: 'Fundamento · por que o custo de um agente é quadrático', html:
          '<p>No passo <em>i</em> (começando em zero) o agente reenvia o contexto base mais tudo o que acumulou: <code>entrada_i = base + i × crescimento</code>. A soma em <em>n</em> passos é <code>n × base + crescimento × n(n−1)/2</code>.</p>' +
          '<p>Com base 3.000 e crescimento 800: 10 passos dão 66.000; 20 passos dão 3.000 × 20 + 800 × 190 = 212.000, mais de três vezes para o dobro de passos; 25 passos dão 315.000. A tarefa longa (25 passos) custa US$ 0,33 contra US$ 0,09 da média de 10, com cache de prefixo. Por isso o teto de passos e de tokens por tarefa não é capricho: é o que impede que uma tarefa patológica custe quanto cem normais.</p>' },
        { tipo: 'takeaway', html: 'Dimensione pelas <mark>chamadas</mark>, não pelas tarefas: Little dá <mark>153 simultâneas</mark> e o custo cresce com o <mark>quadrado dos passos</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>A calculadora do laboratório reproduz as contas da aba anterior. Os preços são números redondos hipotéticos (US$ 3,00 por milhão de tokens de entrada e 15,00 de saída; prefixo em cache lido a 10% do preço de entrada); troque pelos do seu provedor antes de decidir algo. A saída abaixo vem de execução real do laboratório em 11/10/2026.</p>' },
        { tipo: 'rode', id: 'b5-capacity', titulo: 'Rode a calculadora do Caso 2', enunciado: 'Clique em cada etapa depois de rodar e compare com a estimativa que você acabou de ler.',
          prefixo: '$', entrada: 'uv run python -m capacity 2', unidade: 's', terminalTitulo: 'lab E01 · capacity 2',
          prever: { pergunta: 'A calculadora vai imprimir a cota de RPM com 30% de folga. Qual valor você espera?', opcoes: [
            { id: 'a', texto: 'Perto de 108 req/min (tarefas por minuto com folga)', correta: false, porque: 'isso conta tarefas; o RPM conta chamadas ao modelo, dez por tarefa.' },
            { id: 'b', texto: 'Perto de 1.084 req/min (chamadas ao modelo com folga)', correta: true, porque: '1,39 × 10 chamadas × 60 × 1,3 ≈ 1.084.' },
            { id: 'c', texto: 'Perto de 7,5 milhões', correta: false, porque: 'é o TPM, em tokens por minuto.' }
          ] },
          etapas: [
            { id: 'volume', nome: 'Volume e duração', descricao: 'Tarefas, tokens e tempo', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'uv run python -m capacity 2'),
              L('out', '== Caso 2: plataforma de agentes =='),
              L('out', 'tarefas por dia                                 20_000'),
              L('out', 'tarefas por segundo no pico (3x)                1.39 tarefas/s'),
              L('out', 'tokens de entrada por tarefa (10 passos)        66_000 tokens'),
              L('out', 'tokens de saida por tarefa                      3_000 tokens'),
              L('out', 'duracao de uma tarefa                           110 s'),
              L('hint', 'os 66 mil tokens de entrada são o histórico reenviado a cada passo')] },
            { id: 'capacidade', nome: 'Capacidade', descricao: 'Little, workers, RPM e TPM', tom: 'tcp', ms: 1, linhas: [
              L('out', 'tarefas simultaneas no pico (Little)            153'),
              L('out', 'workers a 70% de utilizacao                     219'),
              L('out', 'cota RPM (chamadas ao modelo) com 30% de folga  1_084 req/min'),
              L('out', 'cota TPM com 30% de folga                       7_475_000 tokens/min'),
              L('hint', 'RPM de 1.084 conta chamadas ao modelo, não tarefas')] },
            { id: 'custo', nome: 'Custo', descricao: 'Cache, compactação e tarefa longa', tom: 'response', ms: 1, linhas: [
              L('out', 'custo por tarefa, sem cache de prefixo          0.2430 USD'),
              L('out', 'custo por tarefa, 85% do prefixo em cache       0.0915 USD'),
              L('out', 'custo mensal sem cache                          145_800 USD'),
              L('out', 'custo mensal com cache de prefixo               54_918 USD'),
              L('out', 'custo por tarefa com contexto compactado        0.0788 USD'),
              L('out', 'custo de uma tarefa longa (25 passos)           0.3346 USD'),
              L('hint', 'a tarefa longa custa mais que três tarefas médias com cache')] }
          ],
          tutorDepois: 'Experimento do laboratório: em <code>case2_agent_platform</code>, troque <code>steps=10</code> por <code>steps=20</code> nos dois lugares e preveja os tokens de entrada antes de rodar (212.000).',
          callout: 'Você conferiu as 153 tarefas simultâneas, o RPM por chamada e o custo por tarefa.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Custo e alavancas</h3>' +
          '<table><thead><tr><th>Cenário</th><th>Por tarefa</th><th>Por mês (20 mil tarefas/dia)</th></tr></thead><tbody>' +
          '<tr><td>10 passos, sem cache de prefixo</td><td>US$ 0,243</td><td>US$ 145.800</td></tr>' +
          '<tr><td>10 passos, 85% do prefixo em cache</td><td>US$ 0,0915</td><td>US$ 54.918</td></tr>' +
          '<tr><td>10 passos, contexto compactado (crescimento 400) + cache</td><td>US$ 0,0788</td><td>≈ US$ 47.300</td></tr>' +
          '<tr><td>25 passos (tarefa longa), com cache</td><td>US$ 0,3346</td><td>— (por tarefa)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O <strong>cache de prefixo</strong> do provedor reduz o custo em 62% e é <em>a</em> otimização desta plataforma, porque o histórico reenviado é quase todo prefixo idêntico. Ele exige disciplina de ordem no prompt: instruções e ferramentas primeiro, histórico em modo apenas de acréscimo, nada variável no começo.</p>' +
          '<p>A <strong>compactação</strong> do contexto (resumir resultados antigos de ferramentas, descartar saídas já usadas) reduz o crescimento por passo e corta mais 14% sobre o já cacheado, ao risco de perder um detalhe de que o agente precisaria.</p>' +
          '<p>Como o cache dura minutos, um agente que espera uma aprovação humana por horas perde o prefixo e paga a entrada cheia ao retomar: considere isso no orçamento das tarefas com aprovação.</p>' },
        { tipo: 'takeaway', html: 'O <mark>cache de prefixo</mark> é a maior alavanca (<mark>−62%</mark>), mas só vale se a ordem do prompt for estável e a espera humana for curta.' }
      ] },

      { rotulo: 'Desenho do executor', blocos: [
        { tipo: 'texto', html:
          '<h3>Passo 3 · Desenho</h3>' +
          '<p>O fluxo, da esquerda para a direita: o cliente faz <code>POST /tarefas</code>; a <strong>API</strong> grava a tarefa e devolve o id; uma <strong>fila por tenant</strong> cuida de justiça e prioridade; o <strong>worker</strong> executa o loop com orçamento de passos e de dólares e chama o modelo (com cota por tenant). Cada ação que o modelo pede passa pelo <strong>executor de ações</strong>, que aplica política e idempotência, consulta a <strong>aprovação humana</strong> para ações de risco e escreve no <strong>log de auditoria</strong> (append-only, por ação) antes de chamar o <strong>sistema de terceiros</strong> dentro de um <strong>sandbox de ferramentas</strong> com rede e credencial mínimas. O <strong>estado da tarefa</strong> tem checkpoint por passo, e o cliente consulta por <code>GET /tarefas/id</code>.</p>' +
          '<p>O worker executa o loop com orçamento; toda ação passa pelo executor, que aplica política, exige aprovação quando necessário, reserva a chave de idempotência, escreve na auditoria e só então chama o sistema externo.</p>' },
        { tipo: 'texto', html: '<h3>Passo 4 · Aprofundamento</h3><p>Escolha o ponto que quer ler. Cada um é uma decisão do executor.</p>' },
        { tipo: 'abas', rotulo: 'Decisões do executor', itens: [
          { rotulo: 'Filas e justiça', blocos: [{ tipo: 'texto', html:
            '<p>A API é assíncrona (o bloco 2 explicou por quê): grava a tarefa, devolve <code>202</code> com um identificador, e o cliente consulta ou recebe um callback. A fila é <em>por tenant</em> (ou com chave de partição por tenant e escalonamento justo, round-robin ponderado), de modo que a organização que enviou 5 mil tarefas às 9h não atrase a que enviou duas.</p>' +
            '<p>A cota de tokens do provedor é um recurso compartilhado: cada tenant tem seu balde de TPM, e a soma dos baldes não ultrapassa a cota contratada. Tarefas longas têm <em>deadline</em> e são retomáveis: o estado (histórico, passo atual, resultados das ferramentas) é persistido a cada passo, e um worker que morre deixa a tarefa visível de novo para outro assumir.</p>' }] },
          { rotulo: 'Idempotência de efeitos', blocos: [{ tipo: 'texto', html:
            '<p>A fila entrega <em>pelo menos uma vez</em>; um worker pode executar a ação e morrer antes de confirmar. Se a retentativa repete "reembolsar R$ 500", o cliente perde dinheiro. O padrão:</p>' +
            '<ul><li>Antes de chamar o terceiro, o executor calcula uma chave determinística <code>hash(tenant, tarefa, passo, ação, parâmetros)</code> e a grava no <strong>log de efeitos</strong> com estado <em>pendente</em>.</li>' +
            '<li>Repassa a chave no cabeçalho <code>Idempotency-Key</code> quando o terceiro a suporta (convenção popularizada pela Stripe).</li>' +
            '<li>Na retentativa, o log diz se o efeito foi concluído, e o executor reutiliza o resultado em vez de repetir.</li>' +
            '<li>Quando o terceiro não suporta chave, a ação precisa ser verificada por leitura antes de reexecutar ("o reembolso X já existe?"), e o que não pode ser verificado deve cair em aprovação humana.</li></ul>' +
            '<p>Teoria e testes de falha estão no LT02, bloco 3, e no M12, bloco 5.</p>' }] },
          { rotulo: 'Aprovação e política', blocos: [{ tipo: 'texto', html:
            '<p>Nem toda ação merece o mesmo controle. Classifique por <strong>reversibilidade</strong> e impacto:</p>' +
            '<ul><li>leitura: automática;</li><li>escrita reversível de baixo valor: automática com auditoria;</li><li>escrita irreversível ou acima de limite: aprovação humana;</li><li>ação destrutiva ou de dinheiro novo: bloqueada ou dois aprovadores.</li></ul>' +
            '<p>A política é código versionado, avaliado no executor e não no prompt: pedir ao modelo que "tenha cuidado" não é controle. A aprovação é um estado da tarefa (<code>aguardando_aprovação</code>) com prazo, que libera o worker e retoma depois; a decisão do humano é registrada com identidade e hora. A fila de aprovação tem seu próprio SLO, porque um agente que espera dois dias não serve a ninguém.</p>' }] },
          { rotulo: 'Orçamento', blocos: [{ tipo: 'texto', html:
            '<p>Três tetos em camadas: <strong>por tarefa</strong> (máximo de passos, tokens e dólares), <strong>por tenant</strong> (cota mensal) e <strong>global</strong> (disjuntor financeiro). Estourar o teto da tarefa a encerra com resultado parcial e motivo explícito, e não a continua em silêncio. O orçamento é verificado <em>antes</em> de cada chamada ao modelo, com o custo estimado do próximo passo. A implementação do disjuntor financeiro está no M12, bloco 6.</p>' }] },
          { rotulo: 'Sandbox e credenciais', blocos: [{ tipo: 'texto', html:
            '<p>Ferramentas que executam código ou acessam rede rodam isoladas, com egresso restrito a destinos permitidos e credenciais de escopo mínimo emitidas por tarefa, com expiração curta; nunca o token de longa duração do cliente no contexto do modelo.</p>' +
            '<p>Conteúdo vindo de terceiros (e-mails, páginas, respostas de API) é dado não confiável que pode conter instruções: a política decide o que o agente pode fazer, não o que o texto lido pede (M12, bloco 1).</p>' }] },
          { rotulo: 'Auditoria', blocos: [{ tipo: 'texto', html:
            '<p>Um log <em>append-only</em> por ação com tenant, tarefa, passo, ação, parâmetros (mascarados quando sensíveis), decisão da política, aprovador, chave de idempotência, resposta do terceiro e versão de prompt, modelo e ferramentas. A pergunta que ele precisa responder em minutos: "por que o agente fez isso, com a autorização de quem, e o que mais ele fez nesta tarefa?".</p>' }] }
        ] },
        { tipo: 'quebre', id: 'b5-idempotencia', titulo: 'Timeout depois do POST', obrigatorio: false,
          enunciado: 'Escolha uma falha, rode, e depois rode "Sem falha" para fechar o exercício. O traço é ilustrativo (modelo fake, identificadores inventados): mostra o protocolo, não a saída de uma ferramenta.',
          prefixo: '$', entrada: 'executor.executar(tarefa="t-42", passo=3, acao="reembolsar R$ 500")', unidade: 's', terminalTitulo: 'traço ilustrativo · executor',
          prever: { pergunta: 'O terceiro vai dar timeout depois do POST. O que o executor precisa ter feito ANTES de chamá-lo?', opcoes: [
            { id: 'a', texto: 'Gravar no log de efeitos uma chave determinística em estado pendente.', correta: true, porque: 'se o worker morrer depois do POST, a retentativa reencontra a chave e sabe que houve tentativa.' },
            { id: 'b', texto: 'Nada: a fila garante exatamente uma vez.', correta: false, porque: 'a fila entrega pelo menos uma vez.' },
            { id: 'c', texto: 'Marcar a ação como concluída, para não repetir.', correta: false, porque: 'marcar sucesso sem saber é perder a ação ou mentir ao cliente.' }
          ] },
          etapas: [
            { id: 'pendente', nome: 'Grava a chave', descricao: 'Log de efeitos, estado pendente', tom: 'dns', ms: 1, linhas: [
              L('info', 'chave = hash(tenant, tarefa, passo, ação, parâmetros) = k-7f3a'),
              L('in', 'log de efeitos: k-7f3a  estado=pendente'),
              L('hint', 'se o worker morrer agora, a retentativa reencontra a chave')] },
            { id: 'post', nome: 'Chama o terceiro', descricao: 'POST com Idempotency-Key', tom: 'request', ms: 1, linhas: [
              L('cmd', 'POST /reembolsos  Idempotency-Key: k-7f3a'),
              L('info', 'timeout: sem resposta'),
              L('hint', 'timeout depois de um POST não diz se o efeito aconteceu')] },
            { id: 'retry', nome: 'Retentativa', descricao: 'Mesma chave', tom: 'response', ms: 1, linhas: [
              L('cmd', 'POST /reembolsos  Idempotency-Key: k-7f3a  (mesma chave)'),
              L('in', 'resultado original: reembolso r-901, R$ 500'),
              L('hint', 'sem cobrar de novo')] },
            { id: 'conclui', nome: 'Marca concluído', descricao: 'Reaproveita o resultado', tom: 'ink', ms: 1, linhas: [
              L('in', 'log de efeitos: k-7f3a  estado=concluído'),
              L('hint', 'a próxima retentativa reutiliza o resultado em vez de repetir')] }
          ],
          falhas: [
            { id: 'cego', rotulo: 'Repetir às cegas, sem chave', efeito: { etapaFalha: 'retry', linhasErro: [
              L('info', 'executor: timeout, vou repetir o POST'),
              L('cmd', 'POST /reembolsos  (sem Idempotency-Key)'),
              L('out', 'reembolso r-901 R$ 500 (original)  e  r-902 R$ 500 (repetido)'),
              L('out', 'cliente reembolsado duas vezes'),
              L('hint', 'efeito duplicado')
            ], tutor: 'o timeout escondeu que o primeiro POST tinha dado certo; sem chave, o terceiro não tem como reconhecer a repetição.' } },
            { id: 'modelo', rotulo: 'Perguntar ao modelo se funcionou', efeito: { etapaFalha: 'retry', linhasErro: [
              L('info', 'modelo: deu certo, pode seguir'),
              L('out', 'o modelo não tem como saber: o estado do efeito é desconhecido'),
              L('hint', 'a decisão de repetir é do executor determinístico, não do modelo')
            ], tutor: 'o erro apareceu no contexto e o modelo quer ser útil: ele "resolve" dizendo que deu certo, ou reexecuta a ferramenta por conta própria. É a tentação própria do agente.' } },
            { id: 'sem-suporte', rotulo: 'Terceiro sem chave e sem resposta à consulta', efeito: { etapaFalha: 'retry', linhasErro: [
              L('info', 'terceiro não suporta Idempotency-Key: consultar antes de repetir'),
              L('cmd', 'GET /reembolsos?tarefa=t-42&passo=3'),
              L('out', 'timeout'),
              L('info', 'estado marcado como incerto'),
              L('in', 'tarefa -> aguardando_aprovação (um humano confirma no terceiro)'),
              L('hint', 'o que não pode ser verificado cai em aprovação humana')
            ], tutor: 'sem chave e sem leitura, nem repetir nem marcar sucesso é seguro; o último recurso é uma pessoa, registrada na auditoria.' } }
          ],
          tutorAntes: 'Escolha "Repetir às cegas, sem chave", aperte Enter e veja o efeito. Depois tente as outras e, por fim, rode sem falha.',
          tutorDepois: 'O caminho certo tem três peças: chave gravada antes, mesma chave na retentativa e log de efeitos para reaproveitar o resultado.',
          callout: 'Você viu os dois jeitos de errar um timeout e o protocolo que funciona.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Falhas previstas</h3>' +
          '<table><thead><tr><th>Falha</th><th>Efeito</th><th>Resposta</th></tr></thead><tbody>' +
          '<tr><td>Worker morre depois de executar a ação</td><td>retentativa repete o efeito</td><td>chave de idempotência + log de efeitos; verificação por leitura</td></tr>' +
          '<tr><td>Terceiro devolve 5xx ou excede o tempo</td><td>estado do efeito desconhecido</td><td>marcar "incerto", verificar por leitura antes de repetir; se não der, aprovação humana</td></tr>' +
          '<tr><td>Loop sem progresso</td><td>gasto e chamadas repetidas</td><td>teto de passos, detector de ação repetida, encerramento com parcial</td></tr>' +
          '<tr><td>Tenant ruidoso</td><td>fila e cota consumidas</td><td>fila e balde por tenant; limite de tarefas simultâneas</td></tr>' +
          '<tr><td>Injeção em conteúdo de terceiro</td><td>agente tenta ação não pedida</td><td>política no executor, escopo mínimo de credencial, aprovação para escrita irreversível</td></tr>' +
          '<tr><td>Provedor de modelo indisponível</td><td>tarefas param</td><td>fallback de modelo; senão, pausa das tarefas com estado salvo e retomada, sem perder passos</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Decisões e trade-offs</h3>' +
          '<table><thead><tr><th>Decisão</th><th>Escolha</th><th>Alternativa</th><th>Por que aqui</th></tr></thead><tbody>' +
          '<tr><td>Execução</td><td>fila durável + workers com checkpoint</td><td>processo em memória por requisição</td><td>110 s por tarefa e efeitos externos exigem retomada; custo: persistência a cada passo</td></tr>' +
          '<tr><td>Orquestração</td><td>máquina de estados explícita em código</td><td>deixar o modelo decidir todo o fluxo</td><td>passos de alto risco fixos e auditáveis; flexibilidade só onde o ganho justifica (M08, bloco 1)</td></tr>' +
          '<tr><td>Aprovação</td><td>por classe de ação</td><td>aprovar tudo / nada</td><td>tudo trava a vazão; nada transfere o risco para o cliente</td></tr>' +
          '<tr><td>Multi-tenant</td><td>fila e cota por tenant, isolamento lógico no banco</td><td>infraestrutura dedicada por cliente</td><td>dedicado só para quem pagar e exigir; custo operacional alto</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'A segurança vem do <mark>executor</mark>: política em código, <mark>chave de idempotência</mark> gravada antes e retentativa decidida por quem é determinístico.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b5-python', titulo: 'Custo da tarefa e teto por tarefa', obrigatorio: false,
          enunciado: 'Implemente <code>tokens_entrada</code> (contexto reenviado a cada passo), <code>custo_usd</code> (com a fração de entrada em cache, que é lida a 10% do preço) e <code>passos_maximos</code>, que devolve quantos passos cabem num teto em dólares, a conta que o orçamento faz <em>antes</em> de cada chamada. Preços hipotéticos, como no módulo.',
          codigo: codigoCusto, testes: testesCusto,
          dica: 'A soma de 0 a n−1 é <code>n*(n-1)//2</code>. Em <code>custo_usd</code>, a entrada em cache paga <code>PRECO_CACHE</code> e o resto paga <code>PRECO_IN</code>; divida por 1e6. Em <code>passos_maximos</code>, o custo só cresce com k: pare no primeiro k que estoura o teto.',
          solucao: solucaoCusto,
          tutorDepois: 'Repare que <code>passos_maximos</code> responde com 0 quando nem um passo cabe: a tarefa encerra com resultado parcial e motivo, em vez de continuar em silêncio.',
          callout: 'A calculadora de custo e o teto por tarefa passaram nos testes, com borda e entrada inválida.' },
        { tipo: 'ordene', id: 'b5-ordene', titulo: 'A ordem dentro do executor', obrigatorio: false,
          enunciado: 'Toda ação pedida pelo modelo passa pelo executor. Ordene o que ele faz, do primeiro passo ao último.',
          itens: [
            { id: 'e', texto: 'Chama o sistema de terceiros dentro do sandbox' },
            { id: 'c', texto: 'Reserva a chave de idempotência no log de efeitos' },
            { id: 'a', texto: 'Aplica a política (classifica a ação por reversibilidade e impacto)' },
            { id: 'd', texto: 'Escreve a decisão no log de auditoria' },
            { id: 'b', texto: 'Exige aprovação humana quando a política mandar' }
          ],
          solucao: ['a', 'b', 'c', 'd', 'e'],
          dica: 'A chamada externa é o último passo: tudo o que a protege (política, aprovação, chave, auditoria) vem antes.',
          tutorDepois: 'Nada do que protege a ação pode estar depois dela.' },
        { tipo: 'cenario', id: 'b5-cenario', titulo: 'O reembolso que deu timeout', obrigatorio: false,
          enunciado: 'O worker chamou a API de pagamento para reembolsar R$ 500, o terceiro devolveu timeout e a fila vai repetir a tarefa. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O log de efeitos tem a chave k-7f3a em estado pendente. Nada confirma que o reembolso aconteceu. O que o executor faz?', opcoes: [
              { texto: 'Repetir o POST: a fila garante exatamente uma vez.', vai: 'f-duplo', tom: 'ruim', consequencia: 'a fila entrega pelo menos uma vez; sem chave, o terceiro não reconhece a repetição.' },
              { texto: 'Perguntar ao modelo se a ação funcionou.', vai: 'f-modelo', tom: 'ruim', consequencia: 'o modelo não tem como saber e tende a dizer que deu certo.' },
              { texto: 'Olhar a chave pendente no log e decidir pelo que o terceiro suporta.', vai: 'chave', tom: 'ok', consequencia: 'a decisão de repetir é do executor determinístico, com o log como fonte.' }
            ] },
            chave: { texto: 'O terceiro suporta o cabeçalho Idempotency-Key?', opcoes: [
              { texto: 'Sim: reenviar o POST com a mesma chave e reaproveitar o resultado original.', vai: 'f-chave', tom: 'ok', consequencia: 'mesma chave, mesmo resultado, sem cobrar de novo; o log passa a concluído.' },
              { texto: 'Não: consultar o terceiro por leitura ("o reembolso X já existe?") antes de reexecutar.', vai: 'leitura', tom: 'ok', consequencia: 'sem chave, a verificação por leitura substitui a idempotência.' }
            ] },
            leitura: { texto: 'A consulta também deu timeout. O estado do efeito é incerto. E agora?', opcoes: [
              { texto: 'Marcar sucesso para não cobrar de novo.', vai: 'f-perdeu', tom: 'ruim', consequencia: 'se o reembolso não ocorreu, a ação foi perdida e o cliente foi enganado.' },
              { texto: 'Repetir o POST: um reembolso a mais é melhor que nenhum.', vai: 'f-duplo', tom: 'ruim', consequencia: 'dinheiro novo sem verificação é o pior efeito.' },
              { texto: 'Marcar "incerto" e mandar para aprovação humana, com tudo registrado na auditoria.', vai: 'f-humano', tom: 'ok', consequencia: 'o que não pode ser verificado cai em aprovação humana.' }
            ] }
          },
          finais: {
            'f-chave': { bom: true, texto: 'Terceiro com chave: a retentativa devolveu o resultado original, o efeito aconteceu uma vez e o log marca concluído.' },
            'f-humano': { bom: true, texto: 'Efeito incerto sem como verificar: a tarefa aguarda aprovação humana com prazo, o worker foi liberado e a decisão ficou na auditoria.' },
            'f-duplo': { bom: false, texto: 'O cliente foi reembolsado duas vezes e a plataforma pagou a diferença.' },
            'f-modelo': { bom: false, texto: 'O modelo afirmou sucesso sem saber; o efeito pode nem ter acontecido e ninguém foi avisado.' },
            'f-perdeu': { bom: false, texto: 'O reembolso nunca ocorreu e a plataforma registrou sucesso: o cliente descobriu pelo extrato.' }
          },
          callout: 'Você chegou a um final seguro: chave quando há suporte, aprovação humana quando não há como verificar.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: tratar a falha do terceiro como "tente de novo"', html:
          '<p>Um timeout depois de um POST não diz se o efeito aconteceu; repetir sem chave de idempotência cobra duas vezes, e não repetir perde a ação. O sênior de sistemas distribuídos sabe isso em teoria, mas num agente a tentação é maior: o modelo "resolve" a falha dizendo ao usuário que deu certo, ou reexecutando a ferramenta por conta própria, porque o erro apareceu no contexto e ele quer ser útil. <strong>A decisão de repetir é do executor determinístico, não do modelo.</strong></p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Dimensionar o RPM por tarefa (108 em vez de 1.084 chamadas) e o pool de workers pela taxa de chegada, sem a lei de Little.</li>' +
          '<li>Confiar na entrega "exatamente uma vez" da fila em vez de construir a idempotência do efeito.</li>' +
          '<li>Colocar a regra de aprovação no prompt do agente.</li>' +
          '<li>Guardar a credencial de longa duração do cliente no contexto do modelo ou no log.</li>' +
          '<li>Deixar o orçamento como alerta de fim de mês, sem corte por tarefa.</li></ul>' },
        { tipo: 'escolha', id: 'b5-esc-rpm', titulo: 'Confira: o RPM da plataforma',
          pergunta: 'Plataforma de agentes: 1,39 tarefa/s, 10 chamadas ao modelo por tarefa, folga de 30%. Qual RPM você pede ao provedor?',
          opcoes: [
            { id: 'a', texto: 'Cerca de 108 RPM (tarefas por minuto × 1,3)', correta: false, porque: 'conta tarefas; o RPM conta chamadas ao modelo.' },
            { id: 'b', texto: 'Cerca de 83 RPM (sem folga)', correta: false, porque: 'também conta tarefas, e ainda ignora a folga.' },
            { id: 'c', texto: 'Cerca de 1.084 RPM: RPM conta chamadas ao modelo, não tarefas (1,39 × 10 × 60 × 1,3)', correta: true, porque: 'quem pede cota por tarefa pede dez vezes menos que o necessário e descobre em produção, com 429.' },
            { id: 'd', texto: 'Cerca de 7,5 milhões de RPM', correta: false, porque: 'os 7,5 milhões são o TPM, outra unidade.' }
          ], tutorDepois: 'Calcule RPM e TPM e compare os dois com a cota.' },
        { tipo: 'escolha', id: 'b5-esc-politica', titulo: 'Confira: onde mora a regra de aprovação',
          pergunta: 'Onde deve morar a regra "reembolso acima de R$ 500 exige aprovação humana"?',
          opcoes: [
            { id: 'a', texto: 'No executor, como política em código versionado, avaliada antes de cada ação', correta: true, porque: 'a política é avaliada no ponto onde a ação acontece, com a decisão registrada na auditoria.' },
            { id: 'b', texto: 'No prompt do agente, em letras maiúsculas', correta: false, porque: 'prompt não é controle: pode ser ignorado, injetado ou degradar com o contexto.' },
            { id: 'c', texto: 'No front-end, com um aviso ao usuário', correta: false, porque: 'o agente age sem passar pelo front-end.' },
            { id: 'd', texto: 'Em um runbook para o time de suporte', correta: false, porque: 'documentação não impede a ação.' }
          ], tutorDepois: 'Regra no prompt é consultiva; regra no executor é imposta.' },
        { tipo: 'takeaway', html: 'Agente que age exige <mark>efeito no máximo uma vez</mark>, <mark>política no executor</mark> e <mark>teto por tarefa</mark> antes de cada chamada.' }
      ] }
    ]
  });
})();
