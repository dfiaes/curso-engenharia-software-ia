/* M06 · Bloco 5: Observabilidade. Fonte: M06.html#b05. Trace e política de conteúdo: exemplos do Capstone; convenções GenAI do OpenTelemetry no estado de ago/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var ARVORE = [
    'analise_repositorio  (trace: 42s, $0.31, tenant=acme)',
    '├── ingest.clone                          1.2s',
    '├── ingest.parse (400 arquivos)           8.4s      [determinístico, sem LLM]',
    '├── invoke_agent: analisar_lote           31s   $0.31',
    '│   ├── chat: analista@v3 / sonnet-5      2.1s  $0.004  in=8.2k(cache_read=7.9k) out=310',
    '│   ├── chat: analista@v3 / sonnet-5      2.4s  $0.004  ...',
    '│   ├── execute_tool: buscar_simbolo      0.1s          [sem custo de modelo]',
    '│   └── ... (x 400)',
    '└── report.render                         0.9s'].join('\n');

  var TRACING = [
    '# src/app/observability/tracing.py',
    '"""Instrumentação com nomes das convenções GenAI."""',
    'from contextlib import contextmanager',
    'from opentelemetry import trace',
    '',
    'tracer = trace.get_tracer("cartografo")',
    '',
    '@contextmanager',
    'def span_chamada_modelo(*, alias, modelo, prompt_tag, tenant_id):',
    '    """Span de uma chamada de modelo, com os atributos que importam."""',
    '    with tracer.start_as_current_span("chat") as span:',
    '        span.set_attribute("gen_ai.operation.name", "chat")',
    '        span.set_attribute("gen_ai.request.model", modelo)',
    '        # atributos próprios do produto, com prefixo próprio para não colidir:',
    '        span.set_attribute("cartografo.alias", alias)',
    '        span.set_attribute("cartografo.prompt_tag", prompt_tag)   # analista@v3',
    '        span.set_attribute("cartografo.tenant_id", tenant_id)     # NUNCA o nome do cliente',
    '        yield span',
    '',
    'def registrar_uso(span, resposta):',
    '    """Fecha o span com tokens, custo e motivo de parada."""',
    '    span.set_attribute("gen_ai.usage.input_tokens", resposta.input_tokens)',
    '    span.set_attribute("gen_ai.usage.output_tokens", resposta.output_tokens)',
    '    span.set_attribute("gen_ai.response.finish_reasons", [resposta.finish_reason])',
    '    span.set_attribute("gen_ai.response.model", resposta.modelo_usado)  # fallback aparece aqui',
    '    span.set_attribute("cartografo.cache_read_tokens", resposta.cache_read_tokens)',
    '    span.set_attribute("cartografo.custo_usd", resposta.custo_usd)'].join('\n');

  var obsIni = "import hashlib\n\nPROIBIDAS = {\"prompt\", \"response\", \"content\", \"messages\", \"codigo\", \"justificativa\"}\n\n\nclass ContentLeakage(ValueError):\n    \"\"\"Tentativa de registrar conteúdo na telemetria.\"\"\"\n\n\ndef input_hash(texto):\n    \"\"\"Hash curto (16 hex) da entrada, para correlacionar sem guardar.\"\"\"\n    return \"\"\n\n\nclass Gravador:\n    def __init__(self):\n        self.spans = []\n\n    def record(self, operation, attributes):\n        # bloqueie chave proibida (sem diferenciar maiúsculas) ANTES de gravar\n        span = {\"operation\": operation, \"attributes\": dict(attributes)}\n        self.spans.append(span)\n        return span\n";
  var obsTestes = "def test_metadados_sao_gravados():\n    g = Gravador()\n    g.record(\"chat\", {\"gen_ai.usage.input_tokens\": 8200, \"cartografo.prompt_tag\": \"analista@v3\"})\n    assert len(g.spans) == 1\n    assert g.spans[0][\"attributes\"][\"cartografo.prompt_tag\"] == \"analista@v3\"\n\n\ndef test_conteudo_e_bloqueado_e_nada_e_gravado():\n    g = Gravador()\n    try:\n        g.record(\"chat\", {\"prompt\": \"def segredo(): ...\"})\n    except ContentLeakage:\n        pass\n    else:\n        raise AssertionError(\"deveria levantar ContentLeakage\")\n    assert g.spans == []\n\n\ndef test_chave_proibida_com_maiuscula():\n    g = Gravador()\n    try:\n        g.record(\"chat\", {\"Prompt\": \"x\"})\n    except ContentLeakage:\n        return\n    raise AssertionError(\"Prompt (maiúsculo) deveria ser bloqueado\")\n\n\ndef test_um_atributo_proibido_barra_o_span_inteiro():\n    g = Gravador()\n    try:\n        g.record(\"chat\", {\"gen_ai.usage.output_tokens\": 310, \"response\": \"texto\"})\n    except ContentLeakage:\n        pass\n    assert len(g.spans) == 0\n\n\ndef test_hash_correlaciona_sem_guardar_entrada():\n    a = input_hash(\"mesmo input\")\n    assert a == input_hash(\"mesmo input\")\n    assert a != input_hash(\"outro input\")\n    assert len(a) == 16 and \"mesmo\" not in a\n";
  var obsSolucao = "import hashlib\n\nPROIBIDAS = {\"prompt\", \"response\", \"content\", \"messages\", \"codigo\", \"justificativa\"}\n\n\nclass ContentLeakage(ValueError):\n    \"\"\"Tentativa de registrar conteúdo na telemetria.\"\"\"\n\n\ndef input_hash(texto):\n    \"\"\"Hash curto (16 hex) da entrada, para correlacionar sem guardar.\"\"\"\n    return hashlib.sha256(texto.encode()).hexdigest()[:16]\n\n\nclass Gravador:\n    def __init__(self):\n        self.spans = []\n\n    def record(self, operation, attributes):\n        vazadas = [k for k in attributes if k.lower() in PROIBIDAS]\n        if vazadas:\n            raise ContentLeakage(f\"conteúdo na telemetria bloqueado: {vazadas}\")\n        span = {\"operation\": operation, \"attributes\": dict(attributes)}\n        self.spans.append(span)\n        return span\n";

  TrilhaAula.registrar({
    id: 'm06-b5',
    titulo: 'Observabilidade: tracing, custo e o que logar sem vazar',
    minutos: 35,
    resumo: 'Evals medem o que você previu; o trace mostra o que aconteceu de verdade. Spans com nomes padronizados, custo como atributo e uma política de conteúdo que não vira passivo.',
    objetivo: 'Instrumentar uma chamada de modelo com as convenções GenAI do OpenTelemetry, ler um trace para achar tempo, dinheiro e cache, e decidir o que logar em cada ambiente sem vazar conteúdo.',
    revisao: [
      { id: 'm06b5-politica', pergunta: 'Qual é a política de log padrão para chamadas de modelo em produção?',
        opcoes: [
          opc('a', 'Metadados sempre (tokens, custo, latência, prompt_tag, modelo, finish_reason, hash do input); conteúdo nunca', true, 'conteúdo só com consentimento explícito por tenant, retenção curta (7 a 30 dias) e mascaramento de PII e segredos.'),
          opc('b', 'Prompt e resposta completos, para depurar melhor', false, 'o prompt contém código do cliente, exatamente o que ele exigiu que não saísse da rede dele.'),
          opc('c', 'Nenhum log: telemetria de IA é proibida', false, 'sem metadados não há como responder onde foi o tempo, o dinheiro ou o cache.')] },
      { id: 'm06b5-hash', pergunta: 'Para que serve o hash do input na telemetria?',
        opcoes: [
          opc('a', 'Correlacionar falhas repetidas ("47 vezes com a mesma entrada") sem armazenar a entrada', true, 'resolve cerca de 80% da depuração sem guardar conteúdo.'),
          opc('b', 'Recuperar o prompt original quando preciso', false, 'hash não é reversível, e esse é o ponto.'),
          opc('c', 'Cifrar o prompt antes de gravar', false, 'hash não é cifra; nada do conteúdo é guardado.')] },
      { id: 'm06b5-card', pergunta: 'Onde deve ficar um atributo de alta cardinalidade, como o id de request ou o hash de prompt?',
        opcoes: [
          opc('a', 'No trace; só baixa cardinalidade (alias, modelo, categoria, tenant) vira métrica', true, 'cardinalidade é o custo escondido do backend de métricas.'),
          opc('b', 'Em métrica, para ter detalhe por request', false, 'explode o custo do backend de métricas.'),
          opc('c', 'Em lugar nenhum', false, 'é justamente o que o trace precisa para correlacionar.')] },
      { id: 'm06b5-fallback', pergunta: 'Quais duas métricas específicas de IA valem alerta desde o primeiro dia?',
        opcoes: [
          opc('a', 'Taxa de fallback e taxa de abstenção', true, 'fallback subindo: o provedor primário degradou e a qualidade caiu sem aviso. Abstenção caindo de repente: o sistema parou de dizer "não sei" e começou a inventar; subindo de repente: ficou inútil.'),
          opc('b', 'CPU e memória do worker', false, 'importam, mas qualquer backend já as monitora.'),
          opc('c', 'Linhas de código e commits', false, 'não dizem nada sobre o comportamento em produção.')] },
      { id: 'm06b5-fronteira', pergunta: 'Onde a telemetria deve ser instrumentada?',
        opcoes: [
          opc('a', 'Na fronteira, uma vez: o gateway do M05', true, 'espalhar <code>span.set_attribute</code> pelo domínio é o mesmo erro de espalhar SQL pelo controller.'),
          opc('b', 'Em cada função de domínio que chama o modelo', false, 'duplica a política de conteúdo e garante que alguma chamada vaze.'),
          opc('c', 'Só no front-end', false, 'não vê tokens, custo nem fallback.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Evals medem qualidade <em>offline</em>, sobre casos que você escolheu. <strong>Observabilidade</strong> mede o que acontece <em>de verdade</em>, com dados que você não previu. As duas se alimentam: é do trace de produção que saem os casos novos do dataset, e é do eval que sai a confiança para agir sobre o que o trace mostrou. Sem observabilidade, o ciclo do M06 fica preso no laboratório e a reclamação de cliente chega como "está estranho", sem nada para investigar.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Telemetria conhecida, três adaptações', html:
          '<p>É o mesmo OpenTelemetry de qualquer backend, com três adaptações:</p><ul>' +
          '<li>O span relevante não é "chamada HTTP", é <strong>chamada de modelo</strong>, e carrega tokens e custo como atributos de primeira classe.</li>' +
          '<li>Uma operação de negócio vira uma <strong>árvore</strong> de spans (agente, várias chamadas de modelo, várias ferramentas). O que importa é o trace inteiro, não o span isolado.</li>' +
          '<li>O payload é útil para depurar (prompt e resposta) <em>e</em> perigoso para logar. Isso cria um problema de privacidade que a telemetria de API nunca teve.</li></ul>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Convenções GenAI do OpenTelemetry (estado em ago/2026)', html:
          '<p>O OpenTelemetry publica <strong>semantic conventions</strong>: nomes padronizados de spans, atributos e métricas, para que qualquer ferramenta entenda a sua telemetria. As de GenAI existem, estão <strong>em uso e ainda em desenvolvimento</strong> (não congeladas).</p>' +
          '<ul><li><strong>Spans:</strong> <code>chat</code>, <code>execute_tool</code> e <code>invoke_agent</code> (o de agente como pai dos outros).</li>' +
          '<li><strong>Atributos:</strong> <code>gen_ai.<wbr>request.model</code>, <code>gen_ai.<wbr>usage.input_tokens</code>, <code>gen_ai.<wbr>usage.output_tokens</code>, <code>gen_ai.<wbr>response.finish_reasons</code>; conteúdo opcional em <code>gen_ai.<wbr>input.messages</code> e <code>gen_ai.<wbr>output.messages</code>.</li>' +
          '<li><strong>Métricas:</strong> <code>gen_ai.<wbr>client.<wbr>operation.duration</code> e <code>gen_ai.<wbr>client.<wbr>token.usage</code>.</li></ul>' +
          '<p><strong>Por que usar mesmo instável:</strong> nomes padronizados hoje significam trocar de ferramenta amanhã sem reinstrumentar. Nome próprio (<code>meu_app.tokens</code>) é dívida garantida.</p>' },
        { tipo: 'texto', html:
          '<h3>O que instrumentar</h3>' +
          '<p>Um trace útil no Capstone tem esta forma. Ele responde perguntas que log de texto não responde.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: ARVORE },
        { tipo: 'texto', html:
          '<p>Com essa árvore você responde na hora: <em>onde foi o tempo?</em> (no parse, não no modelo), <em>onde foi o dinheiro?</em> (nas 400 chamadas), <em>o cache pegou?</em> (7,9k de 8,2k lidos do cache), <em>qual versão de prompt rodou?</em> (v3). Sem ela, você tem "a análise demorou 42 segundos e custou R$ 1,70" e nenhuma pista.</p>' },
        { tipo: 'takeaway', html: 'Uma operação vira uma <mark>árvore de spans</mark>; modelo, tokens, custo e <mark>prompt_tag</mark> são atributos de primeira classe, com nomes <mark>padronizados</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Pergunte ao trace da aba anterior as quatro coisas que o log de texto não responde. Cada etapa devolve a leitura correspondente, com os números do trace de exemplo do Capstone.</p>' },
        { tipo: 'rode', id: 'b5-rode', titulo: 'Interrogue o trace de uma análise',
          enunciado: 'Aperte Enter e depois clique em cada etapa para ler a resposta. Os números são do trace de exemplo do bloco, não de uma execução do laboratório.',
          prefixo: 'Prompt', entrada: 'Por que esta análise custou US$ 0,31 e demorou 42 s?', unidade: 's', terminalTitulo: 'trace: analise_repositorio',
          etapas: [
            { id: 'tempo', nome: 'Onde foi o tempo?', descricao: 'Spans determinísticos', tom: 'dns', ms: 9.6, linhas: [
              L('out', 'ingest.clone   1.2 s'),
              L('out', 'ingest.parse   8.4 s   [sem LLM]'),
              L('hint', 'nem todo segundo é de modelo: 9,6 s dos 42 s são determinísticos')] },
            { id: 'dinheiro', nome: 'Onde foi o dinheiro?', descricao: 'Span do agente', tom: 'request', ms: 31, linhas: [
              L('out', 'invoke_agent: analisar_lote   31 s   US$ 0.31'),
              L('out', 'chat: analista@v3   US$ 0.004  (x 400 chamadas)'),
              L('hint', 'o custo mora nas 400 chamadas de modelo; parse e clone não custam modelo')] },
            { id: 'cache', nome: 'O cache pegou?', descricao: 'Atributos da chamada', tom: 'tls', ms: 2.1, linhas: [
              L('out', 'gen_ai.usage.input_tokens = 8200'),
              L('out', 'cartografo.cache_read_tokens = 7900'),
              L('hint', '7,9k de 8,2k lidos do cache: o prefixo estável está funcionando')] },
            { id: 'versao', nome: 'Qual prompt rodou?', descricao: 'Tag e modelo', tom: 'response', ms: 0.1, linhas: [
              L('out', 'cartografo.prompt_tag = analista@v3'),
              L('out', 'gen_ai.response.model = sonnet-5'),
              L('hint', 'tag + modelo realmente usado: se o fallback atuou, é este atributo que mostra')] }
          ],
          prever: { pergunta: 'A análise levou 42 s e custou US$ 0,31. Onde você espera achar a maior parte do dinheiro e uma parte relevante do tempo que não é de modelo?', opcoes: [
            { id: 'a', texto: 'Dinheiro nas 400 chamadas de modelo; parte do tempo no ingest determinístico (parse).', correta: true, porque: 'o span do agente concentra os US$ 0,31; clone e parse somam 9,6 s sem nenhuma chamada de modelo.' },
            { id: 'b', texto: 'Dinheiro e tempo, os dois, concentrados no parse dos 400 arquivos.', correta: false, porque: 'parse é determinístico e não custa modelo.' },
            { id: 'c', texto: 'Só dá para saber lendo o prompt e a resposta de cada chamada.', correta: false, porque: 'a árvore de spans com atributos responde sem guardar conteúdo.' }
          ] },
          tutorAntes: 'Aperte Enter e clique nas quatro etapas, uma por uma.',
          tutorDepois: 'Nenhuma das quatro respostas precisou de prompt ou resposta: metadados e estrutura bastaram.',
          callout: 'Você leu tempo, dinheiro, cache e versão sem abrir nenhum conteúdo.' },
        { tipo: 'abas', rotulo: 'Detalhes da instrumentação', itens: [
          { rotulo: 'Instrumentação (Python)', blocos: [
            { tipo: 'texto', html: '<p>O contexto manager abre o span <code>chat</code> com os atributos de entrada; <code>registrar_uso</code> o fecha com os de saída. Prefixo próprio (<code>cartografo.</code>) para o que é do produto, nomes <code>gen_ai.<wbr>*</code> para o que a convenção cobre.</p>' },
            { tipo: 'codigo', linguagem: 'python', texto: TRACING },
            { tipo: 'texto', html: '<p><code>UsoResposta</code> é o mínimo que a telemetria exige da resposta do gateway (M05 bloco 6): <code>input_tokens</code>, <code>output_tokens</code>, <code>finish_reason</code>, <code>modelo_usado</code>, <code>cache_read_tokens</code> e <code>custo_usd</code>.</p>' }
          ] },
          { rotulo: 'O que NÃO logar', blocos: [
            { tipo: 'callout', tom: 'danger', titulo: 'Decisão de arquitetura, não de compliance', html:
              '<p>Prompt e resposta completos são <em>ouro</em> para depurar e <em>passivo</em> para guardar. No Capstone, o prompt contém <strong>código-fonte do cliente</strong>, exatamente o que ele exigiu que não saísse da rede dele. Três níveis de política, escolhidos por ambiente:</p>' +
              '<ul><li><strong>Produção (padrão):</strong> metadados sempre. Conteúdo <strong>nunca</strong>.</li>' +
              '<li><strong>Produção com consentimento explícito por tenant:</strong> conteúdo com retenção curta (7 a 30 dias), mascarado por PII e segredos (o mascarador do M12), com o consentimento registrado.</li>' +
              '<li><strong>Desenvolvimento e dataset:</strong> conteúdo à vontade, com dado sintético ou anonimizado.</li></ul>' },
            { tipo: 'texto', html: '<p>O <strong>hash do input</strong> resolve cerca de 80% da depuração sem guardar conteúdo: você diz "esta falha aconteceu 47 vezes com a mesma entrada" e correlaciona sem armazenar a entrada. E o detalhe de LGPD (M12) que já aparece aqui: <code>tenant_id</code> na telemetria, nunca nome ou e-mail. Telemetria é replicada, exportada e frequentemente compartilhada com terceiros.</p>' }
          ] },
          { rotulo: 'Observabilidade e monitoramento', blocos: [
            { tipo: 'texto', html:
              '<ul><li><strong>Monitoramento</strong> responde perguntas formuladas antes ("a CPU passou de 80%?"). <strong>Observabilidade</strong> é conseguir responder perguntas que você <em>não</em> antecipou, com a telemetria que já existe ("por que essas 12 análises de ontem custaram 8x a média?").</li>' +
              '<li><strong>Três pilares:</strong> métricas (agregados baratos, ótimos para alerta, sem detalhe), logs (eventos com detalhe, caros em volume, difíceis de correlacionar) e <strong>traces</strong> (a estrutura causal de uma operação). Em IA o trace é o pilar central: uma operação vira dezenas de chamadas encadeadas, e o log isolado de uma delas não diz nada.</li>' +
              '<li><strong>Cardinalidade é o custo escondido.</strong> Atributo com muitos valores distintos (id de request, hash de prompt) explode o custo do backend de métricas. Alta cardinalidade vai em <em>trace</em>; baixa (alias, modelo, categoria, tenant) vira <em>métrica</em>.</li>' +
              '<li><strong>Instrumente na fronteira, uma vez.</strong> Como validação (M02) e transação (M03), telemetria mora na borda: o gateway do M05. Espalhar <code>span.set_attribute</code> pelo domínio é o mesmo erro de espalhar SQL pelo controller.</li></ul>' }
          ] },
          { rotulo: 'Os quatro painéis', blocos: [
            { tipo: 'texto', largo: true, html:
              '<table><thead><tr><th>Painel</th><th>Métrica</th><th>Decisão que dispara</th></tr></thead><tbody>' +
              '<tr><td><strong>Custo</strong></td><td>USD por dia, por tenant, por prompt_tag; custo por análise (p50/p95)</td><td>ativar cache, trocar alias, cortar contexto e cobrar certo</td></tr>' +
              '<tr><td><strong>Qualidade em produção</strong></td><td>taxa de falha de schema, de <code>finish_reason=max_tokens</code>, de abstenção, de fallback acionado</td><td>é o alarme de regressão que nenhum eval offline pega</td></tr>' +
              '<tr><td><strong>Latência</strong></td><td>p50/p95 por operação, TTFT em streaming, tempo em fila</td><td>dimensionar workers (lei de Little), decidir batch</td></tr>' +
              '<tr><td><strong>Volume e saúde</strong></td><td>chamadas/min, taxa de 429, taxa de erro por provedor</td><td>ajustar semáforo, cota, circuit breaker</td></tr></tbody></table>' +
              '<p>Duas métricas de IA que quase ninguém monitora e valem alerta desde o dia um: <strong>taxa de fallback</strong> (subiu: provedor primário degradado, qualidade caiu sem aviso, M05 bloco 6) e <strong>taxa de abstenção</strong> (caiu de repente: o sistema parou de dizer "não sei" e começou a inventar; subiu de repente: ficou inútil).</p>' }
          ] }
        ] },
        { tipo: 'takeaway', html: 'Metadados <mark>sempre</mark>, conteúdo <mark>nunca</mark> em produção; o <mark>hash do input</mark> correlaciona sem guardar a entrada.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<p>Duas peças para montar: o gravador que <strong>recusa conteúdo</strong> (a política virando código, como em <code>SpanRecorder</code> do laboratório) e os atributos de um span de chamada de modelo.</p>' },
        { tipo: 'python', id: 'b5-python', titulo: 'Escreva o gravador que não deixa conteúdo passar', obrigatorio: false,
          enunciado: 'Implemente <code>input_hash(texto)</code> (SHA-256, 16 primeiros caracteres hexadecimais) e faça <code>Gravador.record</code> levantar <code>ContentLeakage</code> se alguma chave estiver em <code>PROIBIDAS</code>, sem diferenciar maiúsculas e <strong>antes</strong> de gravar qualquer coisa.',
          codigo: obsIni, testes: obsTestes,
          dica: 'Monte <code>vazadas = [k for k in attributes if k.lower() in PROIBIDAS]</code> e levante antes de criar o span. Para o hash: <code>hashlib.sha256(texto.encode()).hexdigest()[:16]</code>.',
          solucao: obsSolucao,
          tutorDepois: 'A política deixou de ser uma regra de wiki: tentar registrar conteúdo é um erro em tempo de execução, e o hash ainda permite dizer "mesma entrada, 47 vezes".',
          callout: 'O gravador barra conteúdo antes de gravar e o hash correlaciona sem guardar a entrada.' },
        { tipo: 'complete', id: 'b5-complete', titulo: 'Complete os atributos do span', obrigatorio: false, linguagem: 'python',
          enunciado: 'Escolha, em cada lacuna, o nome que a convenção ou a política pede.',
          partes: [
            'span.set_attribute("', { lacuna: 'tok', opcoes: ['gen_ai.usage.input_tokens', 'meu_app.tokens', 'tokens_in'], correta: 'gen_ai.usage.input_tokens' },
            '", resposta.input_tokens)\nspan.set_attribute("', { lacuna: 'mod', opcoes: ['gen_ai.response.model', 'cartografo.alias', 'gen_ai.request.model'], correta: 'gen_ai.response.model' },
            '", resposta.modelo_usado)  # o fallback aparece aqui\nspan.set_attribute("cartografo.tenant_id", ', { lacuna: 'ten', opcoes: ['tenant_id', 'cliente.nome', 'usuario.email'], correta: 'tenant_id' },
            ')\n'
          ],
          explicacao: 'Nome padronizado hoje é trocar de ferramenta amanhã sem reinstrumentar. O modelo <em>usado</em> (<code>gen_ai.<wbr>response.model</code>) é o que revela um fallback; o <code>request.model</code> só diz o que foi pedido. E o identificador é o <code>tenant_id</code>: nome ou e-mail na telemetria é dado pessoal replicado e exportado.',
          callout: 'Atributos padronizados, modelo usado e tenant sem dado pessoal.' },
        { tipo: 'cenario', id: 'b5-cenario', titulo: 'A reclamação "está estranho"', obrigatorio: false,
          enunciado: 'Um cliente do plano corporativo diz que as análises de ontem estão "estranhas". O financeiro avisa que o custo desse tenant foi 8x a média. Você só tem a telemetria da política padrão.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O time quer investigar já. Qual o primeiro movimento?', opcoes: [
              { texto: 'Ligar o log de prompt e resposta em produção, para ver o que ele enviou.', vai: 'f-vazou', tom: 'ruim', consequencia: 'o prompt é código do cliente: você passa a guardar exatamente o que ele proibiu que saísse da rede dele.' },
              { texto: 'Filtrar os traces do tenant por dia e comparar custo, tokens, cache e prompt_tag contra a média.', vai: 'achou', tom: 'ok', consequencia: 'metadados bastam para localizar a fatia: onde o custo explodiu e se algo mudou.' }
            ] },
            achou: { texto: 'Os traces mostram 12 análises com input_tokens muito altos, cache_read zerado e a mesma prompt_tag. O hash do input é idêntico em 47 chamadas. Como segue?', opcoes: [
              { texto: 'Transformar a falha repetida em caso de dataset (com a entrada obtida do tenant sob consentimento ou reproduzida em dado sintético) e rodar a suíte.', vai: 'f-bom', tom: 'ok', consequencia: 'o hash correlacionou sem guardar a entrada; o caso novo entra no dataset e o eval passa a medir o que a produção revelou.' },
              { texto: 'Pedir ao cliente que mande os arquivos por e-mail e guardar tudo no log.', vai: 'f-vazou', tom: 'ruim', consequencia: 'guarda conteúdo sem política, sem retenção e sem mascaramento.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Produção revelou, o dataset capturou, o eval mede e a CI protege. Nenhum conteúdo foi retido além da política.' },
            'f-vazou': { bom: false, texto: 'A depuração ficou mais fácil e a empresa ficou com um passivo de privacidade que o contrato do cliente proibia.' }
          },
          callout: 'Você achou a fatia pelo trace e fechou o ciclo eval e produção sem guardar conteúdo.' },
        { tipo: 'callout', tom: 'info', titulo: 'No laboratório', html:
          '<p>O roteiro executável (gravador em memória, spans com tokens, custo e tag, agregação por tag e modelo, e um trace ruim virando caso que falha na suíte atual) está no <code>Laboratório guiado M06</code>, depois do bloco 6. Backend externo (coletor OTLP) é trilha opcional; o laboratório prova a política sem ele.</p>' },
        { tipo: 'escolha', id: 'b5-esc-politica', titulo: 'Confira: a política padrão',
          pergunta: 'Em produção, qual política de log é a padrão para chamadas de modelo?',
          opcoes: [
            { id: 'a', texto: 'Metadados sempre (tokens, custo, latência, prompt_tag, modelo, finish_reason, hash do input); conteúdo nunca, salvo consentimento por tenant com retenção curta e mascaramento.', correta: true, porque: 'o prompt contém código do cliente; o hash resolve cerca de 80% da depuração sem guardar conteúdo.' },
            { id: 'b', texto: 'Prompt e resposta completos, para depurar melhor.', correta: false, porque: 'vira passivo: é exatamente o que o cliente exigiu que não saísse da rede dele.' },
            { id: 'c', texto: 'Conteúdo completo, mas só com o e-mail do usuário.', correta: false, porque: 'e-mail na telemetria é dado pessoal replicado e exportado; use tenant_id.' }
          ] },
        { tipo: 'escolha', id: 'b5-esc-card', titulo: 'Confira: métrica ou trace',
          pergunta: 'Qual atributo vira métrica e qual fica só no trace?',
          opcoes: [
            { id: 'a', texto: 'Tudo em métrica, para ter detalhe.', correta: false, porque: 'cardinalidade alta explode o custo do backend de métricas.' },
            { id: 'b', texto: 'Baixa cardinalidade (alias, modelo, categoria, tenant) vira métrica; alta (id de request, hash de prompt) vai no trace.', correta: true, porque: 'cardinalidade é o custo escondido; o trace é o pilar central em IA, e a instrumentação mora na fronteira, uma vez.' },
            { id: 'c', texto: 'Tudo no log de texto.', correta: false, porque: 'log de texto é difícil de correlacionar e caro em volume.' }
          ] },
        { tipo: 'escolha', id: 'b5-esc-fallback', titulo: 'Confira: o alarme de dia um',
          pergunta: 'A taxa de abstenção caiu bruscamente de uma semana para a outra. O que isso sugere?',
          opcoes: [
            { id: 'a', texto: 'O sistema ficou melhor e passou a acertar tudo.', correta: false, porque: 'queda brusca de abstenção raramente é acerto; checar com amostra.' },
            { id: 'b', texto: 'O sistema parou de dizer "não sei" e pode ter começado a inventar.', correta: true, porque: 'é o alarme de regressão que o eval offline não pega. Subida brusca seria o oposto: sistema inútil.' },
            { id: 'c', texto: 'O provedor primário degradou e o fallback assumiu.', correta: false, porque: 'esse sinal vem da taxa de fallback, outra métrica.' }
          ] },
        { tipo: 'takeaway', html: '<mark>Fallback</mark> e <mark>abstenção</mark> são os alarmes de IA; a política de conteúdo é <mark>código</mark> na fronteira, não regra de wiki.' }
      ] }
    ]
  });
})();
