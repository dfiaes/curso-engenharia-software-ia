/* M05 · Bloco 6: AI Gateway. Fonte: M05.html#b06. Saídas do exercício "quebre" são exemplo ilustrativo, não execução real. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var CMD = 'await pedir("raciocinio", Analise, system, user)   # fakes locais, sem rede';

  var yamlCfg = [
    '# litellm.config.yaml — o coração do gateway',
    'model_list:',
    '  # ---- alias "rapido": tarefas simples, alto volume (classificar, rotular)',
    '  - model_name: rapido',
    '    litellm_params:',
    '      model: anthropic/claude-haiku-4-5',
    '      api_key: os.environ/ANTHROPIC_API_KEY',
    '  - model_name: rapido            # mesmo alias = pool de load balancing',
    '    litellm_params:',
    '      model: openai/gpt-4o-mini',
    '      api_key: os.environ/OPENAI_API_KEY',
    '  # ---- alias "raciocinio": análise que exige qualidade',
    '  - model_name: raciocinio',
    '    litellm_params:',
    '      model: anthropic/claude-sonnet-5',
    '      api_key: os.environ/ANTHROPIC_API_KEY',
    '  # ---- alias "local": cliente que não deixa o código sair da rede (M11)',
    '  - model_name: local',
    '    litellm_params:',
    '      model: ollama/qwen2.5-coder:14b',
    '      api_base: http://localhost:11434',
    '',
    'litellm_settings:',
    '  num_retries: 2          # retry com backoff dentro do mesmo alias',
    '  request_timeout: 60     # segundos',
    '  allowed_fails: 3        # falhas antes de esfriar o deployment',
    '  cooldown_time: 30       # segundos fora do pool (circuit breaker)',
    '  fallbacks:',
    '    - {"raciocinio": ["rapido"]}   # degradar é melhor que cair',
    '    - {"rapido": ["raciocinio"]}',
    '  context_window_fallbacks:',
    '    - {"rapido": ["raciocinio"]}   # estourou a janela? sobe de modelo',
    '  cache: true',
    '  cache_params:',
    '    type: redis',
    '    ttl: 3600'].join('\n');

  var gatewayPy = [
    '# src/llm_lab/gateway.py',
    '"""Fronteira única com o mundo dos modelos. Nada no domínio importa litellm."""',
    'from __future__ import annotations',
    'from dataclasses import dataclass',
    'from typing import Any, Literal',
    'import litellm',
    'from pydantic import BaseModel',
    '',
    'litellm.enable_json_schema_validation = True',
    'Alias = Literal["rapido", "raciocinio", "local"]',
    '',
    '@dataclass(frozen=True, slots=True)',
    'class Resposta[T]:',
    '    """Resultado + a telemetria que o M06 vai consumir."""',
    '    dados: T',
    '    modelo_usado: str',
    '    input_tokens: int',
    '    output_tokens: int',
    '    cache_read_tokens: int',
    '    custo_usd: float',
    '    latencia_ms: int',
    '',
    'async def pedir[T: BaseModel](',
    '    alias: Alias, schema: type[T], system: str, user: str, max_tokens: int = 1500,',
    ') -> Resposta[T]:',
    '    import time',
    '    inicio = time.perf_counter()',
    '    bruto: Any = await litellm.acompletion(',
    '        model=alias,',
    '        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],',
    '        response_format=schema,   # litellm traduz para o formato do provedor',
    '        temperature=0,',
    '        max_tokens=max_tokens,',
    '    )',
    '    latencia = int((time.perf_counter() - inicio) * 1000)',
    '    conteudo = bruto.choices[0].message.content',
    '    uso = bruto.usage',
    '    return Resposta(',
    '        dados=schema.model_validate_json(conteudo),   # a fronteira, sempre',
    '        modelo_usado=bruto.model,                     # QUAL respondeu de fato',
    '        input_tokens=uso.prompt_tokens,',
    '        output_tokens=uso.completion_tokens,',
    '        cache_read_tokens=getattr(uso, "cache_read_input_tokens", 0) or 0,',
    '        custo_usd=litellm.completion_cost(completion_response=bruto),',
    '        latencia_ms=latencia,',
    '    )'].join('\n');

  var codigoGw = [
    'class ErroProvedor(Exception):',
    '    def __init__(self, status):',
    '        super().__init__(status)',
    '        self.status = status',
    '',
    '',
    'class ContextoEstourado(Exception):',
    '    pass',
    '',
    '',
    'TRANSITORIOS = {429, 500, 502, 503, 504}',
    '',
    '',
    'def chamar(alias, prompt, pools, fallbacks, janela, num_retries=2):',
    '    """pools: alias -> função(prompt) que devolve texto ou levanta erro.',
    '    fallbacks: alias -> lista de aliases (falha transitória esgotada).',
    '    janela: alias -> lista de aliases (contexto estourado: sem retry).',
    '    Devolve {"texto", "modelo_usado", "tentativas"}.',
    '    Regras: retry só em erro transitório, no máximo num_retries por alias;',
    '    400/401 sobem na hora, sem retry e sem fallback; esgotou tudo: relance o último erro."""',
    '    tentativas = 0',
    '    ultimo = None',
    '    return {"texto": "", "modelo_usado": "", "tentativas": tentativas}',
    ''].join('\n');

  var testesGw = [
    'def _pool(falhas, texto="ok"):',
    '    estado = {"n": 0}',
    '    def f(prompt):',
    '        estado["n"] += 1',
    '        if falhas and estado["n"] <= len(falhas):',
    '            raise falhas[estado["n"] - 1]',
    '        return texto',
    '    f.estado = estado',
    '    return f',
    '',
    '',
    'def _sempre(erro):',
    '    estado = {"n": 0}',
    '    def f(prompt):',
    '        estado["n"] += 1',
    '        raise erro',
    '    f.estado = estado',
    '    return f',
    '',
    '',
    'FB = {"raciocinio": ["rapido"]}',
    'JN = {"rapido": ["raciocinio"]}',
    '',
    '',
    'def test_caminho_feliz():',
    '    pools = {"raciocinio": _pool([], "A"), "rapido": _pool([], "B")}',
    '    r = chamar("raciocinio", "x", pools, FB, JN)',
    '    assert r == {"texto": "A", "modelo_usado": "raciocinio", "tentativas": 1}',
    '',
    '',
    'def test_429_transitorio_resolve_com_retry():',
    '    pools = {"raciocinio": _pool([ErroProvedor(429), ErroProvedor(429)], "A"), "rapido": _pool([], "B")}',
    '    r = chamar("raciocinio", "x", pools, FB, JN, num_retries=2)',
    '    assert r["modelo_usado"] == "raciocinio" and r["tentativas"] == 3',
    '',
    '',
    'def test_primario_fora_cai_no_fallback_e_registra_quem_respondeu():',
    '    pools = {"raciocinio": _sempre(ErroProvedor(503)), "rapido": _pool([], "B")}',
    '    r = chamar("raciocinio", "x", pools, FB, JN, num_retries=2)',
    '    assert r["texto"] == "B" and r["modelo_usado"] == "rapido"',
    '    assert pools["raciocinio"].estado["n"] == 3',
    '    assert r["tentativas"] == 4',
    '',
    '',
    'def test_400_nao_faz_retry_nem_fallback():',
    '    pools = {"raciocinio": _sempre(ErroProvedor(400)), "rapido": _pool([], "B")}',
    '    try:',
    '        chamar("raciocinio", "x", pools, FB, JN)',
    '        assert False, "devia levantar"',
    '    except ErroProvedor as e:',
    '        assert e.status == 400',
    '    assert pools["raciocinio"].estado["n"] == 1',
    '    assert pools["rapido"].estado["n"] == 0',
    '',
    '',
    'def test_contexto_estourado_sobe_de_modelo_sem_retry():',
    '    pools = {"rapido": _sempre(ContextoEstourado()), "raciocinio": _pool([], "A")}',
    '    r = chamar("rapido", "x", pools, FB, JN)',
    '    assert r["modelo_usado"] == "raciocinio"',
    '    assert pools["rapido"].estado["n"] == 1',
    '',
    '',
    'def test_retry_tem_teto_quando_tudo_falha():',
    '    pools = {"raciocinio": _sempre(ErroProvedor(500)), "rapido": _sempre(ErroProvedor(500))}',
    '    try:',
    '        chamar("raciocinio", "x", pools, FB, JN, num_retries=2)',
    '        assert False, "devia levantar"',
    '    except ErroProvedor:',
    '        pass',
    '    assert pools["raciocinio"].estado["n"] == 3 and pools["rapido"].estado["n"] == 3',
    ''].join('\n');

  var solucaoGw = [
    'class ErroProvedor(Exception):',
    '    def __init__(self, status):',
    '        super().__init__(status)',
    '        self.status = status',
    '',
    '',
    'class ContextoEstourado(Exception):',
    '    pass',
    '',
    '',
    'TRANSITORIOS = {429, 500, 502, 503, 504}',
    '',
    '',
    'def chamar(alias, prompt, pools, fallbacks, janela, num_retries=2):',
    '    tentativas = 0',
    '    ultimo = None',
    '    cadeia = [alias] + fallbacks.get(alias, [])',
    '    i = 0',
    '    while i < len(cadeia):',
    '        atual = cadeia[i]',
    '        i += 1',
    '        for _ in range(num_retries + 1):',
    '            tentativas += 1',
    '            try:',
    '                texto = pools[atual](prompt)',
    '                return {"texto": texto, "modelo_usado": atual, "tentativas": tentativas}',
    '            except ContextoEstourado as e:',
    '                ultimo = e',
    '                for extra in janela.get(atual, []):',
    '                    if extra not in cadeia:',
    '                        cadeia.insert(i, extra)',
    '                break',
    '            except ErroProvedor as e:',
    '                if e.status not in TRANSITORIOS:',
    '                    raise',
    '                ultimo = e',
    '    raise ultimo',
    ''].join('\n');

  var etapasGw = function () {
    return [
      { id: 'pedido', nome: 'Pedido por alias', descricao: 'O domínio pede "raciocinio", nunca o nome do modelo', tom: 'dns', ms: 1, linhas: [
        L('cmd', CMD),
        L('info', 'alias=raciocinio -> anthropic/claude-sonnet-5 (config), timeout 60 s, num_retries=2')] },
      { id: 'primario', nome: 'Primário', descricao: 'O deployment do alias responde', tom: 'request', ms: 820, linhas: [
        L('in', 'raciocinio respondeu'),
        L('hint', 'sem falha: nenhum retry, nenhum fallback')] },
      { id: 'fallback', nome: 'Fallback', descricao: 'Só entra se o primário esgotar as tentativas', tom: 'response', ms: 0, linhas: [
        L('info', 'não acionado')] },
      { id: 'telemetria', nome: 'Telemetria', descricao: 'A Resposta carrega quem respondeu', tom: 'ink', ms: 1, linhas: [
        L('out', 'modelo_usado=claude-sonnet-5 input_tokens=... output_tokens=... custo_usd=... latencia_ms=...'),
        L('hint', 'exemplo ilustrativo: os números variam por chamada')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm05-b6',
    titulo: 'AI Gateway: múltiplos provedores, governança e resiliência',
    minutos: 40,
    resumo: 'Um AI Gateway é a camada de indireção que torna a queda do provedor, a troca de modelo e o estouro de orçamento uma mudança de configuração. Resiliência vira política central, e o domínio pede aliases.',
    objetivo: 'Configurar aliases com fallback, separar falha transitória de erro determinístico, registrar o modelo que respondeu e saber por que o gateway é um ponto único de falha.',
    revisao: [
      { id: 'm05b6-400', pergunta: 'O gateway recebe 400 por schema inválido. Qual política de retry está correta?',
        opcoes: [
          opc('a', 'Não fazer retry: é erro determinístico; retry só repete e cobra mais', true, 'retry é para erro transitório (429, 5xx), com jitter e limite baixo.'),
          opc('b', 'Retry com backoff até 5 vezes', false, 'retry de erro determinístico é gastar dinheiro mais rápido.'),
          opc('c', 'Aumentar o timeout e tentar de novo', false, 'o problema não é lentidão.')] },
      { id: 'm05b6-alias', pergunta: 'Por que o domínio deve pedir <code>rapido</code> ou <code>raciocinio</code> e não <code>claude-sonnet-5</code>?',
        opcoes: [
          opc('a', 'O alias semântico torna a troca de modelo uma mudança de configuração e facilita o A/B de modelos', true, 'se o nome do modelo aparece no código de domínio, o gateway não está fazendo o trabalho dele.'),
          opc('b', 'Aliases são mais baratos', false, 'o preço é do modelo por trás do alias.'),
          opc('c', 'O provedor exige alias', false, 'é uma decisão de arquitetura sua.')] },
      { id: 'm05b6-janela', pergunta: 'Por que há duas listas: <code>fallbacks</code> e <code>context_window_fallbacks</code>?',
        opcoes: [
          opc('a', 'Estourar a janela não é erro transitório: retry não resolve, só um modelo com janela maior', true, 'fallback por janela e fallback por falha são decisões diferentes.'),
          opc('b', 'Uma é para produção e a outra para teste', false, 'ambas valem em produção.'),
          opc('c', 'Porque o LiteLLM exige duas listas', false, 'a separação reflete a natureza dos erros.')] },
      { id: 'm05b6-modelo-usado', pergunta: 'Por que gravar <code>modelo_usado</code> em toda chamada?',
        opcoes: [
          opc('a', 'Com fallback ativo, só assim você depura qualidade, cobra certo e evita que o eval compare modelos diferentes', true, 'fallback degrada a resposta; sem o registro você depura qualidade sem saber que ele rodou.'),
          opc('b', 'Para o provedor reduzir o preço', false, 'não existe tal efeito.'),
          opc('c', 'É só enfeite de log', false, 'é a telemetria que o M06 consome.')] },
      { id: 'm05b6-jitter', pergunta: 'Por que o retry precisa de jitter?',
        opcoes: [
          opc('a', 'Sem ele, N workers falham juntos e voltam juntos (thundering herd) e derrubam o provedor de novo', true, 'jitter espalha os retornos no tempo.'),
          opc('b', 'Para o retry ficar mais barato', false, 'cada tentativa continua cobrada.'),
          opc('c', 'Para aumentar o timeout', false, 'jitter não muda o timeout.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Até aqui seu código chama a API de um provedor diretamente. Isso funciona até o dia em que uma destas cinco coisas acontece, e todas acontecem: o provedor cai ou fica lento; você precisa de um modelo barato para tarefas simples e um caro para as difíceis; um cliente exige que o dado não saia da infraestrutura dele (Ollama local, M11); você precisa saber quanto cada tenant gastou; ou o preço muda e o concorrente fica 40% mais barato.</p>' +
          '<p>Um <strong>AI Gateway</strong> é a camada de indireção que transforma esses cinco eventos de "reescrever o sistema" em "mudar uma configuração". Ele roteia por custo, capacidade e disponibilidade do modelo, em vez de rotear por rota, e centraliza timeout, retry com backoff, <em>circuit breaker</em> e <em>fallback</em> numa camada só, aplicável a todos os consumidores. Resiliência copiada e colada em cada cliente diverge; centralizada, evolui junto.</p>' +
          '<h3>O que um gateway entrega</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Função</th><th>O problema sem ele</th></tr></thead><tbody>' +
          '<tr><td><strong>Interface única</strong> (formato OpenAI como língua franca)</td><td>cada provedor com SDK e formato próprio espalhados pelo código</td></tr>' +
          '<tr><td><strong>Fallback entre provedores</strong></td><td>provedor cai, seu produto cai</td></tr>' +
          '<tr><td><strong>Roteamento por custo/tarefa</strong></td><td>tudo no modelo caro, ou trocar de modelo exige deploy</td></tr>' +
          '<tr><td><strong>Governança:</strong> chave virtual por time/tenant, orçamento, rate limit</td><td>uma chave para tudo; você descobre o gasto na fatura</td></tr>' +
          '<tr><td><strong>Observabilidade central:</strong> custo, latência e tokens por request</td><td>instrumentação duplicada em cada serviço (M06 sofre)</td></tr>' +
          '<tr><td><strong>Cache de resposta compartilhado</strong></td><td>cada instância com seu cache local, hit rate baixo</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'LiteLLM: proxy e biblioteca', html:
          '<p>LiteLLM é o gateway open-source mais usado do ecossistema Python. Tem dois modos: <strong>biblioteca</strong> (você importa e chama <code>litellm.completion(...)</code> com <code>model="anthropic/claude-sonnet-5"</code>, e ele traduz para o SDK do provedor) e <strong>proxy</strong> (um servidor HTTP que expõe a API no formato OpenAI, para qualquer cliente, inclusive de outras linguagens). O proxy dá governança de verdade: chaves virtuais, orçamento por chave, logging central. No Capstone, comece pela biblioteca (menos infra) e migre para o proxy quando tiver mais de um consumidor. O formato OpenAI virou o "SQL" das APIs de LLM: quase todo provedor e ferramenta o aceita, por isso o gateway o adota como interface interna.</p>' },
        { tipo: 'takeaway', html: 'O gateway troca "<mark>reescrever o sistema</mark>" por "<mark>mudar uma configuração</mark>" e centraliza a <mark>resiliência</mark>.' }
      ] },

      { rotulo: 'Configuração e resiliência', blocos: [
        { tipo: 'texto', html: '<p>O arquivo que vale o módulo é a configuração do gateway. Leia-o de cima para baixo: os aliases, depois a política de resiliência.</p>' },
        { tipo: 'codigo', linguagem: 'yaml', texto: yamlCfg },
        { tipo: 'texto', html:
          '<p>Há três decisões de arquitetura escondidas nesse YAML, e todas são discussão de sênior.</p>' +
          '<ul><li><strong>Alias semântico, não nome de modelo.</strong> O código pede <code>rapido</code> ou <code>raciocinio</code>, nunca <code>claude-sonnet-5</code>. Trocar de modelo vira mudança de configuração e o A/B de modelos (M06) fica trivial. Se o nome do modelo aparece no seu código de domínio, o gateway não está fazendo o trabalho dele.</li>' +
          '<li><strong>Fallback degrada, não replica.</strong> Cair de <code>raciocinio</code> para <code>rapido</code> é aceitar resposta pior em vez de nenhuma resposta: decisão de produto, não de infra. Documente em ADR (M04) e torne visível na resposta qual modelo respondeu; senão você depura qualidade sem saber que rodou o fallback.</li>' +
          '<li><strong>Fallback por janela é diferente de fallback por falha.</strong> Estourar o contexto não é erro transitório: retry não resolve, só um modelo com janela maior. Por isso as duas listas separadas.</li></ul>' },
        { tipo: 'complete', id: 'gw-complete', titulo: 'Complete a política de resiliência', obrigatorio: false,
          enunciado: 'Escolha o valor certo de cada lacuna da configuração do gateway.',
          linguagem: 'yaml',
          partes: [
            'litellm_settings:\n  num_retries: ', { lacuna: 'retries', opcoes: ['2', '10', '0'], correta: '2' },
            '          # retry custa dinheiro: limite baixo\n  allowed_fails: 3        # falhas antes de esfriar o deployment\n  cooldown_time: 30       # segundos fora do pool: ',
            { lacuna: 'breaker', opcoes: ['circuit breaker', 'load balancer', 'cache'], correta: 'circuit breaker' },
            '\n  fallbacks:\n    - {"raciocinio": ["rapido"]}   # ',
            { lacuna: 'fb', opcoes: ['degradar é melhor que cair', 'replicar a qualidade exata', 'apagar o erro'], correta: 'degradar é melhor que cair' },
            '\n  context_window_fallbacks:\n    - {"rapido": ["',
            { lacuna: 'janela', opcoes: ['raciocinio', 'rapido', 'local'], correta: 'raciocinio' },
            '"]}   # estourou a janela? sobe de modelo\n'
          ],
          explicacao: 'O retry é limitado (2) porque cada tentativa já gerada é cobrada. O cooldown é o circuit breaker: tira o deployment do pool antes que ele contamine a latência. O fallback degrada, e a janela estourada sobe para um modelo com janela maior.' },
        { tipo: 'texto', html:
          '<h3>Resiliência com LLM</h3><p>O kit de resiliência é conhecido: timeout, retry, backoff, circuit breaker, <em>bulkhead</em>. O que muda quando a dependência é um LLM:</p>' +
          '<ul><li><strong>Timeout tem de ser generoso e existente.</strong> 5 s derruba chamada legítima; "sem timeout" pendura a conexão para sempre. Calibre pelo p99 medido da sua carga (bloco 4), não por chute. Com streaming, o timeout relevante passa a ser o de inatividade entre chunks.</li>' +
          '<li><strong>Retry só em erro transitório, com jitter.</strong> 429 e 5xx, sim. 400 (schema inválido) e 401, nunca: retry de erro determinístico é só gastar dinheiro mais rápido. O jitter é obrigatório: sem ele, N workers falham juntos e voltam juntos (<em>thundering herd</em>).</li>' +
          '<li><strong>Retry custa dinheiro, diferente do seu banco.</strong> Uma requisição que falhou depois de gerar 3k tokens de saída já foi cobrada. Retry cego triplica a fatura numa incidência; por isso o limite baixo (2) e o circuit breaker curto.</li>' +
          '<li><strong>Circuit breaker é sobre custo e latência, não só disponibilidade.</strong> Provedor lento mas vivo é o pior caso: você paga, espera e entrega tarde. <code>allowed_fails</code> mais <code>cooldown_time</code> tiram o deployment do pool antes que ele contamine a latência agregada.</li>' +
          '<li><strong>Bulkhead.</strong> O pool de conexões da ingestão em lote não pode ser o mesmo da API interativa; senão um job de 5.000 arquivos deixa o usuário do chat esperando. Filas e semáforos separados por classe de tráfego (M02, M03).</li></ul>' },
        { tipo: 'texto', html: '<h3>Ver funcionando</h3><p>Rode o pedido por alias. O percurso do lab é: mesma chamada devolvendo o objeto do bloco 2 agora com telemetria; chave inválida no primário e a chamada sucedendo pelo fallback; e o cooldown tirando o deployment quebrado do pool. Aqui, três falhas possíveis, com saídas ilustrativas.</p>' },
        { tipo: 'quebre', id: 'gw-quebre', titulo: 'Provedor cai, cliente não percebe', terminalTitulo: 'gateway · exemplo ilustrativo', prefixo: '$', entrada: CMD, unidade: 'ms', etapas: etapasGw(),
          enunciado: 'Rode sem falha, escolha uma falha e rode de novo, e volte a "Sem falha". As saídas são ilustrativas (variam por provedor e carga), não vêm de execução real.',
          prever: { pergunta: 'O primário responde 429 (rate limit) nas três tentativas. O que o cliente do gateway vê?', opcoes: [
            { id: 'a', texto: 'Um erro 429, porque o retry se esgotou.', correta: false, porque: 'esgotar o retry do alias aciona o fallback configurado antes de falhar para o cliente.' },
            { id: 'b', texto: 'Uma resposta do alias de fallback, com <code>modelo_usado</code> mostrando qual respondeu.', correta: true, porque: 'o gateway degrada em vez de cair, e a telemetria registra o modelo que respondeu.' },
            { id: 'c', texto: 'Uma resposta do primário, porque o 429 some sozinho.', correta: false, porque: 'o 429 não some; o gateway desiste do alias depois do teto de tentativas.' }
          ] },
          falhas: [
            { id: 'f429', rotulo: 'Primário fora do ar (429 em todas as tentativas)', efeito: { etapaFalha: 'primario', linhasErro: [
              L('out', '429 rate limit (tentativa 1 de 3)'), L('out', '429 rate limit (tentativa 2 de 3, backoff com jitter)'), L('out', '429 rate limit (tentativa 3 de 3, teto do retry)'),
              L('info', 'allowed_fails atingido: deployment esfria por cooldown_time = 30 s'),
              L('in', 'fallback: rapido respondeu'),
              L('out', 'modelo_usado=claude-haiku-4-5 (fallback ativo)'),
              L('hint', 'o cliente recebeu resposta; só a telemetria sabe que foi o fallback')
            ], tutor: 'o teto de 2 retries limita o gasto, o backoff com jitter evita o thundering herd e o cooldown tira o primário do pool. A resposta é pior, mas existe. Sem <code>modelo_usado</code> você depuraria qualidade sem saber que rodou o fallback.' } },
            { id: 'f400', rotulo: 'Schema inválido (400)', efeito: { etapaFalha: 'primario', linhasErro: [
              L('out', '400 invalid_request: schema inválido'),
              L('info', 'erro determinístico: sem retry e sem fallback'),
              L('hint', 'o erro sobe para o chamador')
            ], tutor: 'repetir um 400 só se repete e cobra mais; e o fallback receberia o mesmo pedido inválido. O conserto está no pedido, não na política de retry.' } },
            { id: 'fjanela', rotulo: 'Contexto estourado no alias rapido', efeito: { etapaFalha: 'primario', linhasErro: [
              L('cmd', 'await pedir("rapido", Analise, system, user_gigante)'),
              L('out', 'context_length_exceeded: o pedido não cabe na janela'),
              L('info', 'context_window_fallbacks: rapido -> raciocinio (sem retry)'),
              L('in', 'raciocinio respondeu'),
              L('out', 'modelo_usado=claude-sonnet-5')
            ], tutor: 'estourar a janela não é erro transitório: só um modelo com janela maior resolve. Por isso existe uma lista própria, separada do fallback por falha.' } }
          ],
          tutorAntes: 'Rode sem falha primeiro e leia a linha de telemetria.',
          tutorDepois: 'Nas três falhas a decisão é do gateway e fica na configuração: retry com teto, fallback por falha e fallback por janela. O domínio continua pedindo só o alias.',
          callout: 'Você viu a resiliência acontecer no gateway, sem tocar no código de domínio.' },
        { tipo: 'takeaway', html: 'Retry só em <mark>erro transitório</mark>, com <mark>teto</mark> e <mark>jitter</mark>; erro determinístico sobe na hora.' }
      ] },

      { rotulo: 'Adaptador e prática', blocos: [
        { tipo: 'texto', html: '<p>Mesmo usando gateway, mantenha uma fronteira fina no domínio: o gateway pode mudar, o contrato do seu serviço não. Nada no domínio importa <code>litellm</code>.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: gatewayPy },
        { tipo: 'texto', html:
          '<p>O campo <code>modelo_usado</code> é o detalhe que separa código de produção de tutorial: com fallback ativo, você precisa saber qual modelo respondeu, para depurar qualidade, para cobrar certo e para o eval do M06 não comparar peras com maçãs. Note também <code>litellm.completion_cost</code>: o gateway conhece a tabela de preços e calcula por chamada, o que alimenta o bloco 7 sem preço fixo no seu código.</p>' +
          '<p>Agora implemente a lógica central do gateway sobre provedores fake: retry só em transitório, fallback por falha, fallback por janela e o registro de quem respondeu.</p>' },
        { tipo: 'python', id: 'gw-python', titulo: 'Escreva o laço de retry e fallback', obrigatorio: false,
          enunciado: 'Implemente <code>chamar(alias, prompt, pools, fallbacks, janela, num_retries)</code>. Regras: tente o alias até <code>num_retries + 1</code> vezes, só para erros em <code>TRANSITORIOS</code>; <code>ErroProvedor</code> com outro status (400, 401) sobe na hora; <code>ContextoEstourado</code> pula para o alias de <code>janela</code> sem retry; esgotado o alias, siga a lista de <code>fallbacks</code>; sem sucesso em nada, relance o último erro. Devolva <code>{"texto", "modelo_usado", "tentativas"}</code>.',
          codigo: codigoGw, testes: testesGw,
          dica: 'Monte a cadeia <code>[alias] + fallbacks.get(alias, [])</code>. Em cada alias, um <code>for</code> de <code>num_retries + 1</code> tentativas; <code>except ErroProvedor</code> com status fora de <code>TRANSITORIOS</code> faz <code>raise</code>; <code>except ContextoEstourado</code> insere os aliases de <code>janela</code> logo depois do atual e dá <code>break</code>.',
          solucao: solucaoGw,
          tutorDepois: 'O teto de tentativas está no código, não na esperança: com dois aliases e <code>num_retries=2</code>, o pior caso são 6 chamadas cobradas. Falta o jitter no backoff, que o lab trata com um relógio fake.',
          callout: 'O laço passou nos testes: retry com teto, fallback registrando quem respondeu e erro determinístico sem retry.' },
        { tipo: 'transcript', id: 'gw-transcript', titulo: 'Ache a política de retry errada', obrigatorio: false, terminalTitulo: 'log do gateway',
          enunciado: 'O log abaixo mostra uma sequência do gateway. Uma linha descreve um comportamento que viola a política do bloco. Clique nela e aperte Conferir.',
          linhas: [
            { quem: 'ferramenta', texto: 'alias=raciocinio status=429 tentativa=1 -> backoff com jitter' },
            { quem: 'ferramenta', texto: 'alias=raciocinio status=429 tentativa=2 -> backoff com jitter' },
            { quem: 'ferramenta', texto: 'alias=raciocinio status=400 (schema inválido) tentativa=1 -> retry imediato x5' },
            { quem: 'ferramenta', texto: 'alias=raciocinio allowed_fails=3 -> cooldown 30 s; fallback rapido' },
            { quem: 'ferramenta', texto: 'resposta modelo_usado=claude-haiku-4-5' }
          ],
          erradas: [2],
          explicacao: { 2: 'um 400 por schema inválido é erro determinístico: retry só repete o erro e cobra de novo. Retry vale para 429 e 5xx, com jitter e limite baixo.' },
          tutorDepois: 'As outras linhas estão certas: backoff com jitter no 429, cooldown como circuit breaker e a telemetria com o modelo que respondeu.' },
        { tipo: 'takeaway', html: 'O gateway é um <mark>ponto único de falha</mark> a monitorar; registre <mark>modelo_usado</mark> e a <mark>taxa de fallback</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'gw-esc1', titulo: 'Política de retry no 400',
          pergunta: 'Seu gateway recebe 400 por schema inválido de um provedor. Qual política de retry está correta?',
          opcoes: [
            { id: 'a', texto: 'Retry com backoff até 5 vezes.', correta: false, porque: 'retry de erro determinístico só gasta dinheiro mais rápido.' },
            { id: 'b', texto: 'Não fazer retry: é erro determinístico; retry só se repete e cobra mais.', correta: true, porque: 'retry é para erros transitórios (429, 5xx), com jitter e limite baixo. Uma requisição que falhou depois de gerar 3k tokens de saída já foi cobrada. Sem jitter, N workers voltam juntos.' },
            { id: 'c', texto: 'Trocar imediatamente para o fallback e repetir.', correta: false, porque: 'o fallback receberia o mesmo pedido inválido.' },
            { id: 'd', texto: 'Aumentar o timeout.', correta: false, porque: 'o erro não é de lentidão.' }
          ] },
        { tipo: 'escolha', id: 'gw-esc2', titulo: 'Alias ou nome de modelo',
          pergunta: 'Por que o código de domínio deve pedir <code>rapido</code> ou <code>raciocinio</code> e não <code>claude-sonnet-5</code>?',
          opcoes: [
            { id: 'a', texto: 'Por estética.', correta: false, porque: 'a razão é de arquitetura.' },
            { id: 'b', texto: 'Porque aliases são mais baratos.', correta: false, porque: 'o custo é do modelo por trás do alias.' },
            { id: 'c', texto: 'O alias torna a troca de modelo uma mudança de configuração e facilita o A/B de modelos; se o nome do modelo aparece no domínio, o gateway não faz seu trabalho.', correta: true, porque: 'o alias também separa decisões: fallback por janela e por falha ficam em listas distintas na configuração. Registre qual modelo respondeu.' },
            { id: 'd', texto: 'Porque o provedor exige.', correta: false, porque: 'não há essa exigência.' }
          ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Verificado em ago/2026', html:
          '<p>Nomes de modelos e provedores na configuração (Haiku 4.5, Sonnet 5, gpt-4o-mini, Ollama) são o retrato de ago/2026 do módulo, com revalidação em 90 dias. O exercício do lab usa fakes; a trilha live opcional usa dois provedores (ou dois modelos do mesmo), chaves e crédito.</p>' },
        { tipo: 'takeaway', html: 'Gateway com <mark>aliases</mark>, <mark>fallback que degrada</mark> e <mark>telemetria do modelo usado</mark>: a falha do provedor vira configuração.' }
      ] }
    ]
  });
})();
