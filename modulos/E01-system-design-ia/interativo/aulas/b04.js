/* E01 · Bloco 4: Caso 1, assistente de suporte com RAG para 10 mil usuários. Fonte: E01.html#b04. Números do script do lab (python -m capacity 1). Preços hipotéticos (US$ 3/15 por milhão de tokens). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasCaso = function () {
    return [
      { id: 'vol', nome: 'Volume e QPS', descricao: '50 mil por dia, pico 3x', tom: 'dns', ms: 4, linhas: [
        L('cmd', 'python -m capacity 1'),
        L('out', 'requisicoes por dia                             50_000'),
        L('out', 'QPS medio na janela                             1.39 req/s'),
        L('out', 'QPS de pico (3x)                                4.17 req/s'),
        L('hint', 'o tráfego é pequeno: 4 QPS cabe em um processo')] },
      { id: 'voo', nome: 'Em voo (Little)', descricao: 'Latência 7,03 s', tom: 'tcp', ms: 7, linhas: [
        L('out', 'latencia ate o ultimo token                     7.03 s'),
        L('out', 'requisicoes em voo no pico (Little)             29.31'),
        L('hint', '29 streams abertos por ~7 s: é isso que o pool de conexões enxerga')] },
      { id: 'cota', nome: 'Cota', descricao: 'Folga de 30%, 3.850 tokens por requisição', tom: 'tls', ms: 12, linhas: [
        L('out', 'cota RPM com 30% de folga                       325 req/min'),
        L('out', 'cota TPM com 30% de folga                       1_251_250 tokens/min'),
        L('hint', 'o recurso escasso é o TPM, não o QPS')] },
      { id: 'custo', nome: 'Custo', descricao: 'Base e alavancas', tom: 'request', ms: 24, linhas: [
        L('out', 'custo por requisicao, modelo grande             0.0158 USD'),
        L('out', 'custo mensal sem otimizacao                     23_625 USD'),
        L('out', 'custo mensal com 20% de acerto de cache         18_900 USD'),
        L('out', 'custo mensal com cache e 50% no modelo pequeno  10_238 USD'),
        L('out', 'avaliacao online: juiz em 5% das respostas      1_125 USD/mes')] },
      { id: 'dados', nome: 'Dados', descricao: 'Índice vetorial', tom: 'response', ms: 3, linhas: [
        L('out', 'indice vetorial (400 mil chunks, 1024 dim)      2.46 GB'),
        L('hint', '2,5 GB cabe na memória de uma máquina modesta e em um Postgres com pgvector')] },
      { id: 'leitura', nome: 'Leitura', descricao: 'O que decide o desenho', tom: 'ink', ms: 1, linhas: [
        L('in', 'tráfego pequeno, dado pequeno, custo dominado pelo modelo'),
        L('in', 'sem sharding, sem cluster de busca, sem microsserviços: o esforço vai para qualidade, isolamento, custo e degradação')] }
    ];
  };

  var etapasCaminho = function () {
    return [
      { id: 'gateway', nome: 'Gateway', descricao: 'Auth e balde por tenant, em tokens', tom: 'dns', ms: 0.1, linhas: [
        L('info', 'identidade vem do token validado no gateway, não do corpo da requisição'),
        L('out', 'tenant=org-17 grupos=[suporte] balde ok'),
        L('hint', 'rejeita cedo (429 + Retry-After) em vez de gastar cota')] },
      { id: 'recup', nome: 'Recuperação', descricao: 'Filtro de tenant e ACL no índice (≈ 0,4 s)', tom: 'tcp', ms: 0.4, linhas: [
        L('out', 'WHERE tenant_id IN (org-17, publico) AND grupos && {suporte}  -> busca híbrida + rerank'),
        L('out', '5 trechos permitidos'),
        L('hint', 'o filtro vale na consulta, antes da relevância e antes de montar o prompt')] },
      { id: 'prompt', nome: 'Prompt', descricao: 'Estável antes do variável (≈ 3.500 tokens)', tom: 'tls', ms: 0.1, linhas: [
        L('out', 'instruções + ferramentas | trechos | pergunta'),
        L('hint', 'o prefixo estável habilita o cache de prefixo do provedor')] },
      { id: 'geracao', nome: 'Geração', descricao: 'Streaming: TTFT 0,8 s + 350 ÷ 60 s', tom: 'request', ms: 6.63, linhas: [
        L('out', 'TTFT 0,8 s; o usuário começa a ler'),
        L('out', 'saída 350 tokens a 60 tokens/s = 5,83 s'),
        L('hint', 'total do caminho: 0,4 + 0,8 + 5,83 = 7,03 s; o cancelamento chega ao provedor')] },
      { id: 'saida', nome: 'Saída', descricao: 'Guardrails, citações e custo', tom: 'response', ms: 0.1, linhas: [
        L('out', 'esquema ok, citações presentes, sem PII'),
        L('out', 'registro: tokens, custo, versões (prompt, modelo, corpus), chunks usados'),
        L('hint', 'abstém-se se a evidência é insuficiente')] }
    ];
  };

  var codigoCusto = [
    'def indice_gb(chunks, dimensoes, fator=1.5):',
    '    """Tamanho do índice vetorial em GB (10^9 bytes): float32 = 4 bytes, vezes o fator de índice e réplica."""',
    '    return 0.0',
    '',
    '',
    'def custo_juiz_mensal(req_dia, amostra, tok_in, tok_out, preco_in, preco_out):',
    '    """Custo de 30 dias de um juiz sobre uma fração das respostas. Preços em US$ por milhão de tokens."""',
    '    return 0.0',
    '',
    '',
    'def custo_otimizado(base, acerto_cache, fracao_roteada, razao_pequeno):',
    '    """Custo mensal após cache e roteamento. razao_pequeno = custo do modelo pequeno / custo do grande."""',
    '    return 0.0',
    '',
    '',
    'def custo_medio_por_requisicao(custo_mensal, req_dia):',
    '    """Custo médio por requisição em 30 dias."""',
    '    return 0.0',
    ''].join('\n');
  var testesCusto = [
    'def test_caso1_indice_e_juiz():',
    '    assert abs(indice_gb(400_000, 1024) - 2.4576) < 0.001',
    '    assert abs(custo_juiz_mensal(50_000, 0.05, 4000, 200, 3, 15) - 1125) < 0.01',
    '',
    '',
    'def test_caso1_alavancas_e_meta():',
    '    base = 23_625',
    '    assert abs(custo_otimizado(base, 0.2, 0, 1) - 18_900) < 0.01',
    '    assert abs(custo_otimizado(base, 0.2, 0.5, 1 / 12) - 10_237.5) < 0.01',
    '    assert abs(custo_medio_por_requisicao(10_237.5, 50_000) - 0.006825) < 1e-6',
    '',
    '',
    'def test_borda_sem_acerto_e_sem_roteamento_nao_muda():',
    '    assert custo_otimizado(1000, 0, 0, 0.5) == 1000',
    '',
    '',
    'def test_falha_fracoes_invalidas():',
    '    for chamada in (lambda: custo_otimizado(1000, 1.5, 0, 1), lambda: custo_otimizado(1000, 0, -0.1, 1), lambda: custo_medio_por_requisicao(1000, 0)):',
    '        try:',
    '            chamada()',
    '        except ValueError:',
    '            continue',
    '        raise AssertionError("deveria levantar ValueError")',
    '',
    '',
    'def test_controle_negativo_5_por_cento_de_acerto_quase_nao_paga_o_cache():',
    '    base = 23_625',
    '    assert abs(base - custo_otimizado(base, 0.05, 0, 1) - 1181.25) < 0.01',
    ''].join('\n');
  var solucaoCusto = [
    'def indice_gb(chunks, dimensoes, fator=1.5):',
    '    return chunks * dimensoes * 4 * fator / 1e9',
    '',
    '',
    'def custo_juiz_mensal(req_dia, amostra, tok_in, tok_out, preco_in, preco_out):',
    '    por_req = (tok_in * preco_in + tok_out * preco_out) / 1e6',
    '    return req_dia * amostra * 30 * por_req',
    '',
    '',
    'def custo_otimizado(base, acerto_cache, fracao_roteada, razao_pequeno):',
    '    if not 0 <= acerto_cache <= 1 or not 0 <= fracao_roteada <= 1:',
    '        raise ValueError("fração fora de [0, 1]")',
    '    misto = (1 - fracao_roteada) + fracao_roteada * razao_pequeno',
    '    return base * misto * (1 - acerto_cache)',
    '',
    '',
    'def custo_medio_por_requisicao(custo_mensal, req_dia):',
    '    if req_dia <= 0:',
    '        raise ValueError("req_dia deve ser positivo")',
    '    return custo_mensal / (req_dia * 30)',
    ''].join('\n');

  var codigoAcl = [
    'def buscar(chunks, tenant, grupos, k):',
    '    """Ids dos k melhores trechos que o usuário PODE ler, por score decrescente.',
    '    Chunk: {"id", "tenant" (None = público), "grupos" (conjunto; vazio = todos do tenant), "score"}.',
    '    tenant vazio levanta ValueError: a identidade vem do token, nunca ausente."""',
    '    melhores = sorted(chunks, key=lambda c: -c["score"])[:k]',
    '    return [c["id"] for c in melhores if c["tenant"] in (None, tenant)]',
    ''].join('\n');
  var testesAcl = [
    'def corpus():',
    '    return [',
    '        {"id": "b1", "tenant": "B", "grupos": set(), "score": 0.99},',
    '        {"id": "b2", "tenant": "B", "grupos": set(), "score": 0.98},',
    '        {"id": "a-rh", "tenant": "A", "grupos": {"rh"}, "score": 0.97},',
    '        {"id": "a1", "tenant": "A", "grupos": {"suporte"}, "score": 0.90},',
    '        {"id": "pub", "tenant": None, "grupos": set(), "score": 0.80},',
    '        {"id": "a2", "tenant": "A", "grupos": set(), "score": 0.70},',
    '    ]',
    '',
    '',
    'def test_caminho_feliz_devolve_k_permitidos():',
    '    assert buscar(corpus(), "A", {"suporte"}, 3) == ["a1", "pub", "a2"]',
    '',
    '',
    'def test_borda_sem_nenhum_permitido():',
    '    assert buscar([{"id": "x", "tenant": "B", "grupos": set(), "score": 1}], "A", {"suporte"}, 3) == []',
    '    assert buscar([], "A", set(), 3) == []',
    '',
    '',
    'def test_falha_tenant_ausente():',
    '    for t in (None, ""):',
    '        try:',
    '            buscar(corpus(), t, set(), 3)',
    '        except ValueError:',
    '            continue',
    '        raise AssertionError("tenant ausente deveria levantar ValueError")',
    '',
    '',
    'def test_controle_negativo_documento_de_grupo_alheio_nunca_entra():',
    '    ids = buscar(corpus(), "A", {"suporte"}, 10)',
    '    assert "a-rh" not in ids and "b1" not in ids and "b2" not in ids',
    ''].join('\n');
  var solucaoAcl = [
    'def buscar(chunks, tenant, grupos, k):',
    '    if not tenant:',
    '        raise ValueError("tenant ausente")',
    '    permitidos = [c for c in chunks',
    '                  if c["tenant"] in (None, tenant) and (not c["grupos"] or c["grupos"] & grupos)]',
    '    permitidos.sort(key=lambda c: -c["score"])',
    '    return [c["id"] for c in permitidos[:k]]',
    ''].join('\n');

  TrilhaAula.registrar({
    id: 'e01-b4',
    titulo: 'Caso 1: assistente de suporte com RAG para 10 mil usuários',
    minutos: 55,
    resumo: 'Tráfego pequeno, dado pequeno, custo grande. O desenho simples gasta o esforço em permissão aplicada na consulta, cache escopado, roteamento, degradação e avaliação contínua.',
    objetivo: 'Aplicar o método e as peças dos blocos 1 a 3 a um RAG multi-tenant: estimar, desenhar, aprofundar três gargalos e defender os trade-offs com os números do laboratório.',
    revisao: [
      { id: 'e01b4-leitura', pergunta: 'O que a estimativa do Caso 1 decide sobre o desenho?',
        opcoes: [
          opc('a', 'Tráfego (4 QPS) e dados (2,5 GB) são pequenos e o custo é dominado pelo modelo: sem sharding nem microsserviços; esforço em qualidade, isolamento, custo e degradação', true, 'quem desenha 12 serviços para 4 QPS gasta a credibilidade que vai precisar na discussão de custo.'),
          opc('b', 'Que é preciso um cluster vetorial dedicado e sharding', false, '2,5 GB cabem em uma instância de Postgres com pgvector.'),
          opc('c', 'Que o gargalo é o QPS', false, 'o recurso escasso é o TPM e a concorrência de streaming (29 requisições em voo).')] },
      { id: 'e01b4-acl', pergunta: 'Onde entra o filtro de permissão para o documento proibido não influenciar a resposta?',
        opcoes: [
          opc('a', 'Na consulta ao índice, antes da relevância e de montar o prompt, com tenant e grupos vindos do token', true, 'se o trecho proibido chegou ao contexto, o modelo pode parafraseá-lo mesmo sem citar; filtrar depois devolve menos resultados que o necessário e abre brecha por erro.'),
          opc('b', 'No prompt: "não use documentos sem permissão"', false, 'pedir educadamente no prompt não é controle.'),
          opc('c', 'Na interface, escondendo o link', false, 'o conteúdo já contaminou a resposta.')] },
      { id: 'e01b4-custo', pergunta: 'Quais são as três alavancas de custo do Caso 1 e o que cada uma exige?',
        opcoes: [
          opc('a', 'Cache exato (medir o hit rate), roteamento ao modelo pequeno (avaliação e taxa de escalonamento) e redução de tokens de entrada (rerank)', true, 'US$ 23.625 vai a 18.900 com 20% de acerto, e a 10.238 com 50% no modelo pequeno; cortar para 4 chunks reduz a entrada em cerca de 30%.'),
          opc('b', 'Só trocar para um modelo menor', false, 'sem avaliação por classe é corte de custo disfarçado de otimização.'),
          opc('c', 'Adicionar réplicas', false, 'réplicas não reduzem o custo por token.')] },
      { id: 'e01b4-degrada', pergunta: 'O que o assistente faz quando o provedor cai ou a cota esgota?',
        opcoes: [
          opc('a', 'Devolve a busca dos artigos mais relevantes, sem geração; conta como disponível no SLO por decisão explícita', true, 'a mensagem é "não consegui compor a resposta agora; estes artigos podem ajudar". Antes, backoff com jitter dentro do deadline.'),
          opc('b', 'Exibe uma página de erro', false, 'o assistente vira página de erro justo quando o cliente mais precisa.'),
          opc('c', 'Troca silenciosamente por outro provedor com o mesmo prompt', false, 'o fallback precisa passar pela mesma avaliação e pode ferir residência de dados.')] },
      { id: 'e01b4-pgvector', pergunta: 'Por que pgvector no Postgres existente, e quando revisitar?',
        opcoes: [
          opc('a', '2,5 GB e 4 QPS: um sistema a menos, mesma transação da ACL; revisitar acima de ~50 milhões de vetores ou com filtros que o índice não atende', true, 'a escolha vem depois do cálculo que mostrou que o índice cabe.'),
          opc('b', 'Porque bancos vetoriais dedicados não filtram por tenant', false, 'a razão é a escala pequena e a simplicidade.'),
          opc('c', 'Porque sempre é a melhor opção', false, 'é uma decisão com condição de revisão.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>É o sistema que a maioria das empresas constrói primeiro e o que mais tem aparência de pronto antes de estar. Um protótipo responde bem às dez perguntas que o autor testou. Em produção surgem as perguntas do design: um cliente da empresa A pode receber trecho de um contrato da empresa B? O que acontece quando o índice está desatualizado há três dias? Quanto custa por mês, e quem é avisado quando dobrar? Este bloco aplica o método do bloco 1 e as peças dos blocos 2 e 3 a um problema concreto. Os mecanismos internos (embeddings, chunking, busca híbrida, ACL) ficam no M07; aqui interessa a <em>composição</em> e o dimensionamento.</p>' +
          '<h3>Passo 1 · Requisitos e premissas</h3>' +
          '<p>Enunciado: uma empresa de software B2B quer um assistente que responda dúvidas de <strong>10 mil usuários ativos por dia</strong> (clientes finais de 200 organizações) sobre produto e contrato, com base em documentação, artigos de ajuda e histórico de tickets, e que passe o caso a um humano quando não souber. Antes de qualquer caixa, escreva o que você perguntaria e o que assumiu:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Item</th><th>Premissa (a confirmar com o dono do produto)</th></tr></thead><tbody>' +
          '<tr><td>Uso</td><td>5 perguntas por usuário ativo por dia, concentradas em 10 horas, pico de 3x a média</td></tr>' +
          '<tr><td>Corpus</td><td>400 mil chunks (documentação pública + documentos privados por organização), atualização diária, correção urgente em até 1 hora</td></tr>' +
          '<tr><td>Latência</td><td>TTFT p95 ≤ 1,5 s; resposta completa p95 ≤ 10 s (streaming)</td></tr>' +
          '<tr><td>Qualidade</td><td>≥ 90% de respostas fundamentadas em fonte citada; abstenção quando a evidência é insuficiente</td></tr>' +
          '<tr><td>Segurança</td><td>zero vazamento entre organizações; documento que o usuário não pode ler não pode influenciar a resposta</td></tr>' +
          '<tr><td>Custo</td><td>teto de US$ 0,02 por pergunta (média) e orçamento mensal com alerta em 80%</td></tr>' +
          '<tr><td>Disponibilidade</td><td>99,5% em 30 dias, contando como disponível a resposta degradada (busca de artigos sem geração)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Passo 2 · Estimativa</h3>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'requisições/dia   = 10.000 x 5                       = 50.000',
          'QPS médio         = 50.000 ÷ (10 x 3.600)             ≈ 1,39',
          'QPS de pico       = 1,39 x 3                          ≈ 4,17',
          'latência total    = 0,4 (recuperação) + 0,8 (TTFT) + 350 ÷ 60 = 7,03 s',
          'em voo (Little)   = 4,17 x 7,03                       ≈ 29 requisições',
          'cota              = 325 RPM · 1.251.250 TPM (folga de 30%, 3.850 tokens por requisição)',
          'custo/requisição  = (3.500 x 3 + 350 x 15) ÷ 10^6      ≈ US$ 0,0158',
          'custo mensal      = 50.000 x 30 x 0,01575             ≈ US$ 23.625',
          'índice vetorial   = 400.000 x 1.024 x 4 B x 1,5       ≈ 2,46 GB'].join('\n') },
        { tipo: 'texto', html:
          '<p>Leia o resultado como um engenheiro leria: <strong>o tráfego é pequeno</strong> (4 QPS cabe em um processo), <strong>o dado é pequeno</strong> (2,5 GB cabe na memória de uma máquina modesta e em uma instância de Postgres com pgvector), e <strong>o custo é dominado pelo modelo</strong> (US$ 23,6 mil por mês, contra algumas centenas de dólares de infraestrutura). Isso decide o desenho: não há razão para sharding, para um cluster de busca dedicado nem para microsserviços; o esforço vai para <em>qualidade, isolamento, custo e degradação</em>. Quem desenha 12 serviços para 4 QPS gasta a credibilidade que vai precisar na discussão de custo.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          '<p>Dimensionar pelo QPS e esquecer que o recurso escasso é o <strong>TPM</strong> e a <strong>concorrência de streaming</strong>. Quatro QPS não assustam ninguém, mas são 29 conexões abertas por cerca de 7 segundos cada, com 1,25 milhão de tokens por minuto contra uma cota que a conta pode não ter. O sênior de back-end calcula o pool de conexões e a CPU e entrega o desenho; a cota do provedor, que ele não controla, é o que derruba o sistema no primeiro dia de pico. Peça o aumento de cota semanas antes: o provedor aprova por processo, não por sprint.</p>' },
        { tipo: 'takeaway', html: 'Tráfego e dados <mark>pequenos</mark>, custo <mark>grande</mark>: a estimativa decide que o esforço vai para <mark>qualidade, isolamento e custo</mark>, não para escala.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>As saídas abaixo reproduzem o laboratório do módulo (<code>python -m capacity 1</code>), com as colunas encurtadas para caber na tela. Antes de rodar, preveja quantas requisições estão em voo no pico.</p>' },
        { tipo: 'rode', id: 'caso-rode', titulo: 'A conta do Caso 1', enunciado: 'Aperte Enter e clique nas etapas. Os valores são os do script do laboratório.',
          prefixo: '$', entrada: 'python -m capacity 1', unidade: 's', terminalTitulo: 'capacity: Caso 1', etapas: etapasCaso(),
          prever: { pergunta: 'A 4,17 QPS de pico e 7,03 s por resposta, quantas requisições estão em voo ao mesmo tempo (lei de Little)?', opcoes: [
            { id: 'a', texto: 'Cerca de 4: uma por QPS.', correta: false, porque: 'isso ignora o tempo que cada requisição passa no sistema.' },
            { id: 'b', texto: 'Cerca de 29: 4,17 x 7,03.', correta: true, porque: 'L = λ x W. São 29 streams abertos por cerca de 7 s cada, o que o pool de conexões enxerga.' },
            { id: 'c', texto: 'Cerca de 290.', correta: false, porque: 'erra uma ordem de grandeza.' }
          ] },
          tutorAntes: 'Preveja as requisições em voo e aperte Enter.',
          tutorDepois: 'Quatro QPS não assustam ninguém; 29 streams e 1,25 milhão de TPM são o que importa.',
          callout: 'Você viu a estimativa decidir o desenho: pequeno em tráfego e dados, grande em custo.' },
        { tipo: 'texto', html:
          '<h3>Passo 3 · Desenho</h3>' +
          '<p>O caminho síncrono é: <strong>cliente</strong> (SSE, streaming) → <strong>gateway</strong> (autenticação, limite por tenant) → <strong>cache</strong> (exato, escopo por tenant) → <strong>orquestrador</strong> (monta o prompt, controla o orçamento) → <strong>recuperação</strong> (híbrida, com ACL e rerank) → <strong>LLM roteado</strong> (pequeno para grande) → <strong>validação</strong> (citação, esquema, PII). O ramo <strong>degradado</strong> (só busca de artigos) recebe o tráfego quando o provedor falha.</p>' +
          '<p>O caminho assíncrono, fora da requisição, tem duas partes: a <strong>ingestão</strong> (fontes como documentação e tickets, fila, chunking, embedding, escrita no índice pgvector com texto e ACL) e a <strong>avaliação contínua</strong> (5% de amostra julgada). Acompanhe uma pergunta do clique à resposta e provoque uma falha em cada etapa.</p>' },
        { tipo: 'quebre', id: 'caso-quebre', titulo: 'Uma pergunta, do clique à resposta', enunciado: 'Escolha uma falha, rode, e depois rode "Sem falha" para fechar o exercício. As linhas de terminal são ilustrativas do desenho, não saída de ferramenta real.',
          prefixo: 'Prompt', entrada: 'Qual o prazo de cancelamento do meu contrato?', unidade: 's', terminalTitulo: 'caminho da requisição (ilustrativo)', etapas: etapasCaminho(),
          falhas: [
            { id: 'postfilter', rotulo: 'Filtrar por permissão depois da busca', efeito: { etapaFalha: 'recup', linhasErro: [
              { kind: 'out', text: 'busca global: top-5 = [orgB-contrato-12, orgB-contrato-07, orgB-faq-03, orgB-contrato-44, orgB-politica-02]' },
              { kind: 'out', text: 'filtro em código (tenant=org-17): 0 trechos restantes' },
              { kind: 'hint', text: 'o top-5 inteiro era de outro tenant; qualquer erro no filtro é vazamento entre organizações' }
            ], tutor: 'o filtro por organização e grupos entra na cláusula WHERE da busca, nunca depois, em código, sobre os melhores resultados. Cada chunk guarda tenant_id e a lista de grupos permitidos na ingestão.' } },
            { id: 'ordem', rotulo: 'Variável antes do estável no prompt', efeito: { etapaFalha: 'prompt', linhasErro: [
              { kind: 'out', text: 'pergunta | trechos | instruções + ferramentas' },
              { kind: 'out', text: 'prefixo idêntico: 0 tokens; cache de prefixo do provedor não reaproveita nada' },
              { kind: 'hint', text: 'os ≈ 3.500 tokens de entrada voltam ao preço cheio e ao TTFT cheio' }
            ], tutor: 'o cache de prefixo exige ordenar o prompt com o estável antes do variável. A validade é curta (minutos) e as regras de mínimo de tokens variam por provedor: confirme na documentação.' } },
            { id: 'cota', rotulo: 'Provedor devolve 429', efeito: { etapaFalha: 'geracao', linhasErro: [
              { kind: 'out', text: '429 Too Many Requests; Retry-After respeitado; backoff com jitter dentro do deadline' },
              { kind: 'out', text: 'deadline esgotado: ramo degradado' },
              { kind: 'in', text: '"não consegui compor a resposta agora; estes artigos podem ajudar" + busca dos artigos mais relevantes' },
              { kind: 'hint', text: 'conta como disponível no SLO, por decisão explícita' }
            ], tutor: 'a degradação é parte do produto. O TPM de 1,25 milhão tem folga de apenas 30%; sem resposta para "o provedor caiu", o assistente vira página de erro justo quando o cliente mais precisa.' } },
            { id: 'citacao', rotulo: 'Resposta sem citação válida', efeito: { etapaFalha: 'saida', linhasErro: [
              { kind: 'out', text: 'guardrail determinístico: nenhuma citação aponta para um trecho recuperado' },
              { kind: 'in', text: 'abstenção: "não encontrei isso na documentação; vou passar para um humano"' },
              { kind: 'hint', text: 'o caso vai para o humano; o registro guarda versões e chunks para a avaliação' }
            ], tutor: 'os guardrails determinísticos e baratos rodam em todas as requisições (esquema, citações, PII, permissão). A abstenção quando a evidência é insuficiente faz parte do requisito de qualidade.' } }
          ],
          tutorAntes: 'Escolha "Filtrar por permissão depois da busca", aperte Enter e leia a etapa que falhou. Depois tente as outras e, por fim, rode sem falha.',
          tutorDepois: 'No caminho certo, tenant e grupos entram na consulta, o prompt vai do estável ao variável, e as falhas do provedor e da validação têm resposta prevista.',
          callout: 'Você viu cada etapa falhar e o caminho previsto para cada falha.' },
        { tipo: 'takeaway', html: 'Caminho síncrono para a pergunta, <mark>assíncrono</mark> para ingestão e avaliação, e <mark>uma resposta prevista</mark> para cada falha.' }
      ] },

      { rotulo: 'Gargalos e trade-offs', blocos: [
        { tipo: 'texto', html:
          '<h3>Passo 4 · Aprofundamento nos três gargalos</h3>' },
        { tipo: 'abas', rotulo: 'Os três gargalos', itens: [
          { rotulo: '1 · Isolamento e permissão', blocos: [
            { tipo: 'texto', html:
              '<p>O requisito de maior consequência. A permissão é aplicada <em>na consulta ao índice</em>, antes da relevância: o filtro por organização e por grupos de acesso entra na cláusula <code>WHERE</code> da busca (ou no filtro do índice), nunca depois, em código, sobre os melhores resultados, porque isso devolve menos resultados que o necessário e abre brecha por erro. Cada chunk guarda <code>tenant_id</code> e a lista de grupos permitidos na ingestão; a identidade vem do token validado no gateway e não do corpo da requisição.</p>' +
              '<p>O cache usa o mesmo escopo: chave com tenant, grupo, versão do corpus, do prompt e do modelo, senão o primeiro usuário privilegiado "ensina" o cache a vazar.</p>' }] },
          { rotulo: '2 · Custo', blocos: [
            { tipo: 'texto', html:
              '<p>Os US$ 23.625 mensais têm três alavancas, cada uma com preço.</p>' +
              '<ul><li><strong>Cache exato</strong> com 20% de acerto (suposição a medir) leva a US$ 18.900.</li>' +
              '<li><strong>Roteamento</strong> de 50% das perguntas ao modelo pequeno, por classificador de dificuldade ou por cascata com validação, leva a US$ 10.238.</li>' +
              '<li><strong>Reduzir tokens de entrada</strong>, o mais barato de todos: os 3.500 tokens vêm de 5 a 8 chunks de cerca de 400 tokens, mais instruções e histórico; cortar para 4 chunks após reranking reduz a entrada em cerca de 30% e pode melhorar a qualidade, porque contexto irrelevante piora a resposta.</li></ul>' +
              '<p>A avaliação online também custa: julgar 5% das respostas com o modelo grande (premissa do lab: 4.000 tokens de entrada e 200 de saída por julgamento) são US$ 1.125 por mês, ou 4,8% do gasto base. Esse custo entra no orçamento; esquecê-lo é o erro de quem "descobre" que a observabilidade custa.</p>' }] },
          { rotulo: '3 · Degradação e frescor', blocos: [
            { tipo: 'texto', html:
              '<p>Se o provedor cair ou a cota esgotar (TPM de 1,25 milhão é folga de apenas 30%), o orquestrador devolve a busca dos artigos mais relevantes, sem geração, com a mensagem "não consegui compor a resposta agora; estes artigos podem ajudar". Isso conta como disponível no SLO, por decisão explícita.</p>' +
              '<p>O frescor depende da ingestão: um documento alterado entra por evento (webhook ou captura de mudanças) em uma fila, é reprocessado e <em>substitui</em> os chunks antigos por versão; o campo <code>corpus_version</code> invalida o cache. Exclusões de documento precisam apagar chunks e entradas de cache, ou o assistente cita o que a empresa mandou retirar.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Passo 5 · Avaliação, observabilidade e SLOs</h3>' +
          '<p>Sem avaliação, as três alavancas de custo viram jogo de roleta. O conjunto de ouro (100 a 300 perguntas reais anonimizadas, com fonte esperada e casos de abstenção) roda na CI a cada mudança de prompt, modelo, chunking ou índice. Em produção, 5% do tráfego é julgado por um modelo e 0,5% por humano para calibrar o juiz. Cada requisição registra versões (prompt, modelo, corpus), IDs dos chunks recuperados, tokens, custo, TTFT, tempo total, decisão de cache, roteamento e veredito de validação; o texto da pergunta e da resposta fica sujeito a política de retenção e mascaramento.</p>' +
          '<p>Os SLOs são os da tabela do bloco 3: disponibilidade 99,5%, TTFT p95 ≤ 1,5 s, fundamentação ≥ 90%, vazamento zero, custo médio ≤ US$ 0,011 após otimização (a meta usa o custo roteado: US$ 10.238 ÷ 1,5 milhão de requisições mensais ≈ US$ 0,0068, com folga para a cauda).</p>' +
          '<h3>Falhas previstas</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Falha</th><th>Efeito</th><th>Detecção</th><th>Resposta automática</th></tr></thead><tbody>' +
          '<tr><td>429 do provedor</td><td>respostas lentas ou ausentes</td><td>taxa de 429, TPM usado ÷ cota</td><td>backoff com jitter dentro do deadline; depois fallback e degradação</td></tr>' +
          '<tr><td>Índice desatualizado</td><td>resposta cita política antiga</td><td>idade do documento mais recente por fonte; fila de ingestão crescendo</td><td>alerta; resposta indica a data da fonte</td></tr>' +
          '<tr><td>Regressão de qualidade após troca de modelo</td><td>fundamentação cai sem erro HTTP</td><td>amostra julgada, alerta em queda de 3 pontos</td><td>rollback da versão (modelo e prompt estão versionados)</td></tr>' +
          '<tr><td>Injeção de prompt em documento</td><td>instrução do atacante obedecida</td><td>guardrail de saída, teste adversarial na CI</td><td>resposta bloqueada, trecho em quarentena</td></tr>' +
          '<tr><td>Cauda de custo (contexto gigante)</td><td>1% das requisições vira 15% do gasto</td><td>p99 de custo por requisição</td><td>teto de tokens de entrada e de saída por requisição</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Decisões e trade-offs</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Decisão</th><th>Escolha</th><th>Alternativa</th><th>Por que aqui</th></tr></thead><tbody>' +
          '<tr><td>Armazenamento vetorial</td><td>pgvector no Postgres existente</td><td>serviço vetorial dedicado</td><td>2,5 GB e 4 QPS; um sistema a menos, mesma transação da ACL. Revisitar acima de ~50 milhões de vetores ou filtros que o índice não atende</td></tr>' +
          '<tr><td>Cache</td><td>exato por tenant</td><td>semântico</td><td>falso positivo em contrato é incidente; semântico só após medir o falso positivo em amostra</td></tr>' +
          '<tr><td>Streaming</td><td>sim, SSE</td><td>resposta completa</td><td>TTFT de 0,8 s contra 7 s de espera; custo: validação de saída precisa lidar com texto parcial</td></tr>' +
          '<tr><td>Geração</td><td>cascata/roteamento por dificuldade</td><td>um modelo para tudo</td><td>corta cerca de 46% do custo; custo: um classificador a manter e avaliar</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'O esforço vai para <mark>permissão na consulta</mark>, <mark>três alavancas de custo medidas</mark> e <mark>degradação planejada</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'cenario', id: 'caso-cenario', titulo: 'Cortar a fatura de US$ 23,6 mil', obrigatorio: false,
          enunciado: 'A diretoria quer reduzir a fatura do assistente. Você tem o Caso 1 em produção e as três alavancas do bloco.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Qual é o seu primeiro movimento?', opcoes: [
              { texto: 'Ligar cache semântico: pega paráfrases e corta custo.', vai: 'f-semantico', tom: 'ruim', consequencia: 'falso positivo em contrato é incidente, e o escopo por tenant e a calibração não foram feitos.' },
              { texto: 'Mandar tudo ao modelo pequeno.', vai: 'f-cego', tom: 'ruim', consequencia: 'sem avaliação por classe de requisição, o roteador erra na ponta barata e a qualidade cai sem alarme.' },
              { texto: 'Medir o hit rate real nos logs e começar pelo mais barato: reduzir a entrada com rerank (4 chunks).', vai: 'mede', tom: 'ok', consequencia: 'o ganho é hit rate x custo evitado, e o corte de entrada pode até melhorar a resposta.' }
            ] },
            mede: { texto: 'Os logs mostram só 5% de repetição real. O cache exato economizaria cerca de US$ 1.200 por mês. Como seguir?', opcoes: [
              { texto: 'Manter o cache exato por tenant só se o custo de operar for baixo, sem prometer a economia de 20%, e seguir para roteamento com avaliação.', vai: 'rota', tom: 'ok', consequencia: 'a promessa vira o número medido.' },
              { texto: 'Manter a promessa de 20% para a diretoria; os logs de um mês podem ser atípicos.', vai: 'f-promessa', tom: 'ruim', consequencia: 'a economia some e a complexidade fica.' }
            ] },
            rota: { texto: 'Para rotear 50% ao modelo pequeno, o que precisa existir antes?', opcoes: [
              { texto: 'Avaliação por classe de requisição e taxa de escalonamento medida, com cascata que valida a saída.', vai: 'f-bom', tom: 'ok', consequencia: 'o corte de cerca de 46% do custo vem com um classificador mantido e avaliado.' },
              { texto: 'Só um classificador treinado em amostra pequena.', vai: 'f-cego', tom: 'ruim', consequencia: 'o erro do roteador cai sempre na ponta barata, e ninguém mede.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Entrada reduzida, cache pelo hit rate medido e roteamento com avaliação: custo próximo de US$ 10 mil por mês, com qualidade vigiada.' },
            'f-semantico': { bom: false, texto: 'Uma resposta com contrato de outra organização vazou pelo cache semântico, e o incidente custou mais que a economia.' },
            'f-cego': { bom: false, texto: 'O custo caiu e a fundamentação também, sem erro HTTP e sem alarme, até o cliente reclamar.' },
            'f-promessa': { bom: false, texto: 'A economia prometida de US$ 4.725 por mês não apareceu, e a credibilidade da estimativa foi junto.' }
          },
          callout: 'Você começou pelo mais barato, mediu o hit rate e só roteou com avaliação.' },
        { tipo: 'escreva', id: 'caso-escreva', titulo: 'Defenda o monólito com Postgres', obrigatorio: false,
          enunciado: 'Um colega propõe um cluster vetorial dedicado e doze microsserviços para o Caso 1. Escreva a sua resposta em um parágrafo de design doc, com os números do bloco, dizendo o que você escolhe e quando revisitaria.',
          placeholder: 'Para este volume, ... Revisitaríamos se ...',
          rubrica: [
            'Usa os <strong>números</strong>: cerca de 4 QPS de pico, 29 requisições em voo, 2,5 GB de índice.',
            'Escolhe <strong>pgvector no Postgres existente</strong> e explica a vantagem (um sistema a menos, mesma transação da ACL).',
            'Diz para onde o esforço vai: <strong>qualidade, isolamento, custo e degradação</strong>.',
            'Registra a <strong>condição de revisão</strong> (cerca de 50 milhões de vetores ou filtros que o índice não atende).'],
          modelo: '<p>Com cerca de 4 QPS de pico, 29 requisições em voo e um índice de 2,5 GB, o tráfego cabe em um processo e o dado cabe em uma instância de Postgres com pgvector. Um cluster dedicado e doze serviços acrescentam operação sem resolver nenhum gargalo medido; o dinheiro está no modelo (US$ 23,6 mil por mês). Escolhemos pgvector no Postgres existente, com a ACL na mesma transação, e gastamos o esforço em isolamento por tenant na consulta, cache escopado, roteamento com avaliação e degradação para busca de artigos. Revisitamos acima de cerca de 50 milhões de vetores ou se surgirem filtros que o índice não atenda.</p>' },
        { tipo: 'python', id: 'caso-python-custo', titulo: 'O orçamento do Caso 1', obrigatorio: false,
          enunciado: 'Implemente <code>indice_gb</code>, <code>custo_juiz_mensal</code> (avaliação online), <code>custo_otimizado</code> (cache e roteamento sobre o custo base) e <code>custo_medio_por_requisicao</code>. Os valores de teste são os do laboratório.',
          codigo: codigoCusto, testes: testesCusto,
          dica: 'Índice: <code>chunks * dimensoes * 4 * fator / 1e9</code>. Custo roteado: <code>base * ((1 - f) + f * razao) * (1 - acerto)</code>. Valide as frações em [0, 1].',
          solucao: solucaoCusto,
          tutorDepois: 'O controle negativo mostra o ponto do bloco: com 5% de acerto, a economia do cache cai para cerca de US$ 1.181 por mês.',
          callout: 'O orçamento fecha com o laboratório: 2,46 GB, US$ 1.125 de avaliação, US$ 10.238 otimizado e cerca de US$ 0,0068 por requisição.' },
        { tipo: 'python', id: 'caso-python-acl', titulo: 'Permissão na consulta, não depois', obrigatorio: false,
          enunciado: 'A função <code>buscar</code> abaixo filtra depois de ranquear (o erro do passo 4). Reescreva para filtrar <em>antes</em> do corte em <code>k</code>: o chunk vale se o tenant é o do usuário (ou público) e, quando tem grupos, se o usuário tem algum deles. Tenant ausente levanta <code>ValueError</code>.',
          codigo: codigoAcl, testes: testesAcl,
          dica: 'Monte a lista <code>permitidos</code> com a condição, ordene por <code>-score</code> e só então pegue <code>[:k]</code>. Grupos vazios significam "todos do tenant".',
          solucao: solucaoAcl,
          tutorDepois: 'Com o filtro antes do corte, o top-3 volta cheio. Na versão original, os dois melhores eram de outra organização e o resultado encolhia.',
          callout: 'O filtro por tenant e grupos agora vale antes da relevância.' },
        { tipo: 'escolha', id: 'caso-escolha-cache', titulo: 'Confira: o cache de 5%',
          pergunta: 'O Caso 1 supôs 20% de acerto de cache, o que levaria o custo de US$ 23.625 para US$ 18.900. Os logs mostram só 5% de repetição real. Qual a leitura correta?',
          opcoes: [
            { id: 'a', texto: 'A economia cai para cerca de US$ 1.200 por mês e quase não justifica a complexidade (e o risco) do cache; meça antes de prometer.', correta: true, porque: 'ganho do cache = hit rate x custo evitado, e o hit rate vem de logs. A 5%, o custo cai para cerca de US$ 22.444.' },
            { id: 'b', texto: 'Mantém-se a economia prevista de US$ 4.725.', correta: false, porque: 'a previsão supunha 20% de acerto.' },
            { id: 'c', texto: 'O cache vira obrigatório.', correta: false, porque: 'o inverso: a economia some e a complexidade fica.' },
            { id: 'd', texto: 'O hit rate não importa, só o tamanho do cache.', correta: false, porque: 'sem repetição real, cache grande não acerta.' }
          ], tutorDepois: 'Cache semântico traz ainda risco de falso positivo e vazamento de escopo: só vale pagar com economia real.' },
        { tipo: 'escolha', id: 'caso-escolha-acl', titulo: 'Confira: o momento do filtro',
          pergunta: 'Em qual momento deve entrar o filtro de permissão para que "um documento que o usuário não pode ler não influencie a resposta"?',
          opcoes: [
            { id: 'a', texto: 'Depois da geração, removendo citações proibidas.', correta: false, porque: 'o modelo já pode ter parafraseado o conteúdo proibido.' },
            { id: 'b', texto: 'No prompt: "não use documentos sem permissão".', correta: false, porque: 'pedir educadamente no prompt não é controle.' },
            { id: 'c', texto: 'Na interface, escondendo o link.', correta: false, porque: 'a resposta já foi contaminada.' },
            { id: 'd', texto: 'Na recuperação, antes de montar o prompt, com filtro por tenant e ACL no próprio índice.', correta: true, porque: 'segurança vale antes do modelo, em código; se o trecho proibido chegou ao contexto, o modelo pode parafraseá-lo mesmo sem citar.' }
          ], tutorDepois: 'Identidade do token, filtro na consulta, mesmo escopo no cache.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Filtrar por permissão depois da busca (post-filter) e descobrir, no incidente, que o top-5 inteiro era de outro tenant.</li><li>Escolher o banco vetorial antes de calcular que o índice cabe em 2,5 GB.</li><li>Medir qualidade com as 10 perguntas do protótipo e declarar 100%.</li><li>Esquecer a exclusão: o direito de remover um documento precisa chegar ao índice e ao cache.</li><li>Não ter resposta para "o provedor caiu": o assistente vira página de erro justo quando o cliente mais precisa.</li></ul>' },
        { tipo: 'takeaway', html: 'Pequeno em tráfego e dados, grande em custo: a <mark>cota de TPM</mark>, e não o QPS, é o limite que decide.' }
      ] }
    ]
  });
})();
