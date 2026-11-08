/* M05 · Bloco 5: Caching. Fonte: M05.html#b05. Preços: retrato ago/2026 (revalidar em 90 dias). Saídas do exercício "quebre" são exemplo calculado com a fórmula e a tabela, não execução real. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var CMD = 'python cached.py  # 5 perguntas sobre o mesmo arquivo, prefixo de 10.000 tokens (Sonnet 5)';

  var codigoCache = [
    'def custo_prefixo(tokens, n, preco_in, escrita=1.25, minimo=1024):',
    '    """US$ do PREFIXO em n chamadas dentro do TTL. preco_in em US$ por milhão de tokens.',
    '    Abaixo do mínimo do modelo o prefixo não cacheia: todas as chamadas pagam preço cheio.',
    '    Acima: a 1ª chamada paga a escrita (escrita x preço) e as demais leem a 0,10 x."""',
    '    return 0.0',
    '',
    '',
    'def compensa(hit, escrita=1.25):',
    '    """True se o custo esperado do prefixo com cache fica abaixo de 1 (o custo sem cache).',
    '    Esperado = hit x 0,10 + (1 - hit) x escrita."""',
    '    return None',
    '',
    '',
    'def chave_resposta(modelo, params, prompt, tenant=None):',
    '    """Chave do cache de resposta: sha256 hex de modelo, parâmetros, prompt e tenant.',
    '    A ordem das chaves de params não pode mudar a chave."""',
    '    return ""',
    ''].join('\n');

  var testesCache = [
    'def test_cinco_chamadas_dentro_do_ttl():',
    '    # 10.000 tokens a US$ 2/M: escrita 0,025 + 4 leituras de 0,002',
    '    assert abs(custo_prefixo(10000, 5, 2) - 0.033) < 1e-9',
    '',
    '',
    'def test_uma_chamada_custa_mais_que_nao_cachear():',
    '    assert custo_prefixo(10000, 1, 2) > 10000 * 2 / 1_000_000',
    '',
    '',
    'def test_abaixo_do_minimo_nao_cacheia():',
    '    assert abs(custo_prefixo(800, 5, 2, minimo=1024) - 800 * 5 * 2 / 1_000_000) < 1e-12',
    '',
    '',
    'def test_hit_rate_baixo_sai_mais_caro():',
    '    assert compensa(0.2) is False',
    '    assert compensa(0.5) is True',
    '',
    '',
    'def test_ttl_de_1h_exige_hit_maior():',
    '    assert compensa(0.6, escrita=2.0) is True',
    '    assert compensa(0.4, escrita=2.0) is False',
    '',
    '',
    'def test_chave_estavel_e_sem_ordem_de_params():',
    '    a = chave_resposta("m1", {"temperature": 0, "max_tokens": 100}, "oi", "t1")',
    '    b = chave_resposta("m1", {"max_tokens": 100, "temperature": 0}, "oi", "t1")',
    '    assert a == b and len(a) == 64',
    '',
    '',
    'def test_chave_separa_modelo_param_e_tenant():',
    '    base = chave_resposta("m1", {"temperature": 0}, "oi", "t1")',
    '    assert base != chave_resposta("m2", {"temperature": 0}, "oi", "t1")',
    '    assert base != chave_resposta("m1", {"temperature": 1}, "oi", "t1")',
    '    assert base != chave_resposta("m1", {"temperature": 0}, "oi", "t2")',
    ''].join('\n');

  var solucaoCache = [
    'import hashlib',
    'import json',
    '',
    '',
    'def custo_prefixo(tokens, n, preco_in, escrita=1.25, minimo=1024):',
    '    base = tokens * preco_in / 1_000_000',
    '    if tokens < minimo:',
    '        return base * n',
    '    return base * escrita + base * 0.10 * (n - 1)',
    '',
    '',
    'def compensa(hit, escrita=1.25):',
    '    return hit * 0.10 + (1 - hit) * escrita < 1',
    '',
    '',
    'def chave_resposta(modelo, params, prompt, tenant=None):',
    '    bruto = json.dumps([modelo, params, prompt, tenant], sort_keys=True, ensure_ascii=False)',
    '    return hashlib.sha256(bruto.encode("utf-8")).hexdigest()',
    ''].join('\n');

  var cachedPy = [
    '# cached.py (adapter de provedor — trilha live opcional)',
    '"""Chamada com prompt caching: prefixo estável marcado, variável no fim."""',
    'from __future__ import annotations',
    'from pathlib import Path',
    'import anthropic',
    'from llm_lab.settings import settings',
    '',
    'client = anthropic.Anthropic(api_key=settings.anthropic_api_key)',
    '# ESTÁVEL: instruções + guia de estilo + taxonomia de riscos. Muda por deploy.',
    'INSTRUCOES = Path("prompts/analista.md").read_text(encoding="utf-8")',
    '',
    'def analisar_com_cache(codigo_do_arquivo: str, pergunta: str) -> anthropic.types.Message:',
    '    return client.messages.create(',
    '        model="claude-sonnet-5",',
    '        max_tokens=1500,',
    '        temperature=0,',
    '        system=[',
    '            {"type": "text", "text": INSTRUCOES},   # 1) estável entre TODAS as chamadas',
    '            {',
    '                "type": "text",',
    '                "text": f"# Arquivo em análise\\n\\n{codigo_do_arquivo}",',
    '                "cache_control": {"type": "ephemeral"},   # 2) estável na SESSÃO -> breakpoint',
    '            },',
    '        ],',
    '        messages=[{"role": "user", "content": pergunta}],   # 3) varia a cada chamada',
    '    )',
    '',
    'def relatorio_cache(msg: anthropic.types.Message) -> str:',
    '    u = msg.usage',
    '    lidos = u.cache_read_input_tokens or 0',
    '    escritos = u.cache_creation_input_tokens or 0',
    '    novos = u.input_tokens',
    '    total = lidos + escritos + novos',
    '    # preço Sonnet 5 em ago/2026: in $2 / cache write $2.50 / cache read $0.20 por MTok',
    '    custo = (novos * 2 + escritos * 2.5 + lidos * 0.2) / 1_000_000',
    '    sem_cache = (total * 2) / 1_000_000',
    '    return (',
    '        f"lidos={lidos} escritos={escritos} novos={novos} (total in={total})\\n"',
    '        f"custo=${custo:.6f} · sem cache seria ${sem_cache:.6f} "',
    '        f"· economia={100 * (1 - custo / sem_cache):.0f}%"',
    '    )'].join('\n');

  var embedPy = [
    '# embed_cache.py (adapter — trilha live opcional)',
    'import hashlib',
    'import numpy as np',
    'from sqlalchemy import text',
    'from sqlalchemy.ext.asyncio import AsyncSession',
    '',
    'MODELO_EMBED = "voyage-3"   # a chave inclui o modelo: trocar invalida tudo',
    '',
    'def _chave(texto: str) -> str:',
    '    bruto = f"{MODELO_EMBED}::{texto}".encode()',
    '    return hashlib.sha256(bruto).hexdigest()',
    '',
    'async def obter_embedding(session: AsyncSession, texto: str) -> list[float]:',
    '    chave = _chave(texto)',
    '    linha = await session.execute(',
    '        text("SELECT vetor FROM embeddings_cache WHERE hash_texto = :h"),',
    '        {"h": chave},',
    '    )',
    '    if (achado := linha.scalar_one_or_none()) is not None:',
    '        return np.frombuffer(achado, dtype=np.float32).tolist()   # HIT',
    '    vetor = await chamar_api_de_embedding(texto)                  # MISS: paga',
    '    await session.execute(',
    '        text(',
    '            "INSERT INTO embeddings_cache (hash_texto, modelo, vetor, criado_em) "',
    '            "VALUES (:h, :m, :v, now()) ON CONFLICT (hash_texto) DO NOTHING"',
    '        ),',
    '        {"h": chave, "m": MODELO_EMBED, "v": np.array(vetor, dtype=np.float32).tobytes()},',
    '    )',
    '    return vetor'].join('\n');

  var etapasCache = function () {
    return [
      { id: 'p1', nome: 'Pergunta 1 (escrita)', descricao: 'A primeira chamada paga a escrita do prefixo', tom: 'request', ms: 25, linhas: [
        L('cmd', CMD),
        L('out', 'lidos=0 escritos=10000 novos=200'),
        L('info', 'prefixo: 10.000 tokens x US$ 2,50/M (escrita 1,25x) = US$ 0,025'),
        L('hint', 'cache_creation_input_tokens > 0 e cache_read_input_tokens = 0: esperado na primeira')] },
      { id: 'p2', nome: 'Pergunta 2 (leitura)', descricao: 'Mesmo prefixo, dentro do TTL de 5 minutos', tom: 'response', ms: 2, linhas: [
        L('out', 'lidos=10000 escritos=0 novos=200'),
        L('info', 'prefixo: 10.000 tokens x US$ 0,20/M (leitura 0,1x) = US$ 0,002'),
        L('hint', 'cache_read_input_tokens > 0: o prefixo foi reaproveitado e o TTL renovado')] },
      { id: 'p5', nome: 'Perguntas 3 a 5', descricao: 'Três leituras seguidas', tom: 'response', ms: 6, linhas: [
        L('out', 'lidos=10000 escritos=0 novos=200   (x3)'),
        L('info', 'prefixo: 3 x US$ 0,002 = US$ 0,006')] },
      { id: 'total', nome: 'Total do prefixo', descricao: 'Soma das cinco chamadas contra o preço cheio', tom: 'ink', ms: 33, linhas: [
        L('out', 'com cache: US$ 0,033 · sem cache: US$ 0,100 · economia de cerca de 67%'),
        L('hint', 'retrato ago/2026, Sonnet 5; revalide na tabela oficial antes de decidir')] }
    ];
  };

  var erroPrefixo = function (qual, causa, tutor) {
    return { etapaFalha: 'p2', linhasErro: [
      L('info', qual),
      L('cmd', CMD),
      L('out', 'lidos=0 escritos=10000 novos=200'),
      L('out', 'custo do prefixo nesta chamada: US$ 0,025 (escrita de novo)'),
      L('hint', causa)
    ], tutor: tutor };
  };

  TrilhaAula.registrar({
    id: 'm05-b5',
    titulo: 'Caching: o maior redutor de custo que existe',
    minutos: 40,
    resumo: 'O prompt inteiro é reenviado a cada turno. O prompt caching reaproveita o prefixo estável a 10% do preço, mas só se o breakpoint estiver no último bloco estável e se o hit rate pagar a escrita.',
    objetivo: 'Desenhar um prompt em ordem de estabilidade, medir hit rate pelos campos de usage, calcular quando o cache compensa e montar chaves de cache sem vazamento.',
    revisao: [
      { id: 'm05b5-sintoma', pergunta: 'O painel mostra <code>cache_creation_input_tokens</code> alto em toda chamada e <code>cache_read_input_tokens</code> sempre zero. Qual é a causa mais provável?',
        opcoes: [
          opc('a', 'Conteúdo variável (timestamp, id de sessão, pergunta) antes ou dentro do prefixo marcado, ou prefixo abaixo do mínimo do modelo', true, 'marcar um bloco que muda escreve cache novo a cada chamada (1,25x) e nunca lê. Regra: estável primeiro, variável depois; breakpoint no último bloco estável.'),
          opc('b', 'O TTL é longo demais', false, 'TTL longo não zera a leitura; o prefixo instável sim.'),
          opc('c', 'O modelo é grande demais para cachear', false, 'o limite é um mínimo de tokens, e é por modelo (512, 1.024, 4.096).')] },
      { id: 'm05b5-ordem', pergunta: 'Qual é a ordem do prefixo e o que invalida o quê?',
        opcoes: [
          opc('a', 'tools, depois system, depois messages: mudar tools invalida tudo; mudar system invalida system e messages', true, 'o cache é por prefixo byte-a-byte, então a mudança invalida tudo o que vem depois dela.'),
          opc('b', 'messages, system, tools: o histórico vai primeiro', false, 'a ordem é a inversa.'),
          opc('c', 'A ordem não importa, o provedor reordena', false, 'o provedor reaproveita o prefixo idêntico; não reordena.')] },
      { id: 'm05b5-custo', pergunta: 'Com escrita a 1,25x e leitura a 0,1x, a partir de que hit rate o cache deixa de sair mais caro?',
        opcoes: [
          opc('a', 'Cerca de 22%: abaixo disso a escrita não se paga', true, 'o esperado é hit x 0,1 + (1 - hit) x 1,25; igualar a 1 dá (1,25 - 1) / (1,25 - 0,1) = 0,217.'),
          opc('b', 'Qualquer hit rate, cache nunca sai mais caro', false, 'a escrita é mais cara que uma chamada normal.'),
          opc('c', 'Só acima de 90%', false, 'a conta fecha bem antes disso.')] },
      { id: 'm05b5-chave', pergunta: 'O que a chave do cache de resposta precisa incluir?',
        opcoes: [
          opc('a', 'Versão do modelo, parâmetros de amostragem, o prompt inteiro e o tenant quando há dado de cliente', true, 'sem modelo e parâmetros você serve resposta do modelo antigo depois do upgrade; sem tenant, vaza dado entre clientes.'),
          opc('b', 'Só o hash da pergunta', false, 'duas versões de modelo ou dois tenants colidem.'),
          opc('c', 'Só o tenant', false, 'perguntas diferentes do mesmo tenant colidiriam.')] },
      { id: 'm05b5-semantico', pergunta: 'Por que o cache semântico exige muita cautela?',
        opcoes: [
          opc('a', 'Perguntas vizinhas no espaço vetorial podem ter respostas diferentes, e o erro sai com cara de certo', true, '"qual o limite de saque?" e "qual o limite de saque internacional?" são vizinhas e têm respostas diferentes.'),
          opc('b', 'Porque é mais lento que o prompt cache', false, 'o risco é de correção, não de velocidade.'),
          opc('c', 'Porque o provedor cobra o dobro', false, 'não é uma questão de preço.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>No bloco 3 você mediu o custo de um loop de agente e o número assustou. A causa é estrutural: o prompt inteiro é reenviado a cada turno (instruções, definições de ferramentas, todo o histórico). Num loop de 8 passos com um prompt de sistema de 3k tokens e um arquivo de 8k, você paga pelo mesmo conteúdo oito vezes. O <strong>prompt caching</strong> ataca exatamente isso: a leitura de cache custa 10% do preço do token de entrada, uma redução de 90% na parte reaproveitada. É a otimização de maior retorno por linha de código do módulo.</p>' +
          '<h3>Teoria de cache, reciclada</h3>' +
          '<p>Nada aqui é novo; o que muda é onde dói. Cinco conceitos reaparecem com nome diferente neste módulo.</p>' +
          '<ul><li><strong>Localidade</strong> é a premissa. Cache só funciona se o acesso se repetir (temporal ou espacial). Se cada request é único, cache é overhead puro. Pergunte antes: qual é a taxa esperada de reuso?</li>' +
          '<li><strong>Padrões de escrita:</strong> <em>cache-aside</em> (a aplicação consulta o cache e, no miss, busca na origem e popula; cobre 95% dos casos e é o que você implementa), <em>write-through</em> (escreve nos dois, consistente e mais lento) e <em>write-behind</em> (escreve no cache e depois na origem, rápido e arriscado).</li>' +
          '<li><strong>Invalidação</strong> é o problema difícil (a piada de Phil Karlton: duas coisas difíceis, invalidação de cache e nomear coisas). TTL é a resposta preguiçosa e quase sempre certa; invalidação por evento é precisa e frágil; a pior falha é a silenciosa, servir dado velho sem ninguém perceber.</li>' +
          '<li><strong>Políticas de despejo:</strong> LRU (menos usado recentemente, default sensato), LFU (menos frequente, bom com padrões estáveis), FIFO (simples e ingênuo), TTL puro. Em prompt caching a política é do provedor; você só controla o TTL.</li>' +
          '<li><strong>Métricas:</strong> <em>hit rate</em> (fração de acertos), custo do miss (aqui, 1,25x: a escrita é mais cara que uma chamada normal) e a razão entre eles. Hit rate de 20% com escrita 1,25x pode sair mais caro que não cachear. Faça a conta, não a fé.</li></ul>' },
        { tipo: 'texto', html:
          '<h3>Prompt caching: a mecânica</h3><p>O provedor guarda o estado interno de processamento de um <strong>prefixo</strong> do seu prompt. Na chamada seguinte, se o prefixo for byte-a-byte idêntico, ele reaproveita esse estado em vez de reprocessar. Daí saem todas as regras e todas as pegadinhas.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Regras do prompt caching (ago/2026)', html:
          '<p>Retrato de ago/2026; revalidar em 90 dias.</p><ul><li><strong>Ordem do prefixo:</strong> <code>tools</code>, depois <code>system</code>, depois <code>messages</code>. Mudou as ferramentas, invalida tudo; mudou o system, invalida system e messages.</li>' +
          '<li><strong>Marcação:</strong> <code>cache_control</code> com <code>{"type": "ephemeral"}</code> no bloco onde o prefixo termina. Até 4 breakpoints por requisição. Há também o modo automático (marcação no topo da requisição), em que o breakpoint avança sozinho conforme a conversa cresce.</li>' +
          '<li><strong>Mínimo de tokens</strong> para o prefixo ser cacheável, por modelo: 512 (Opus 5), 1.024 (Sonnet 5), 4.096 (Haiku 4.5). Abaixo disso, não cacheia e <strong>não avisa</strong>.</li>' +
          '<li><strong>TTL:</strong> 5 minutos por padrão, renovado a cada uso sem custo extra. Opção de 1 hora, que custa 2x o token de entrada na escrita.</li>' +
          '<li><strong>Preço:</strong> escrita 1,25x (TTL de 5 min) ou 2x (1 h); leitura 0,1x.</li>' +
          '<li><strong>Métricas na resposta:</strong> <code>cache_creation_input_tokens</code> e <code>cache_read_input_tokens</code>, dentro de <code>usage</code>. É assim que você mede o hit rate de verdade.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'O erro nº 1: breakpoint no lugar errado', html:
          '<p>O cache é escrito <strong>no breakpoint</strong>. Se você marca um bloco que muda a cada requisição (o timestamp, a pergunta do usuário, o id da sessão), escreve cache novo toda vez e nunca lê, pagando 1,25x em cada chamada para nada. Pior: a leitura procura o prefixo caminhando para trás por um número limitado de blocos, então marcar no fim não faz o sistema "descobrir" o conteúdo estável lá atrás.</p>' +
          '<p><strong>Regra:</strong> o breakpoint vai no <em>último</em> bloco estável, e tudo o que varia vem depois dele. Sintoma de que você errou: <code>cache_creation_input_tokens</code> alto em toda chamada e <code>cache_read_input_tokens</code> sempre zero.</p>' },
        { tipo: 'texto', html: '<p>A consequência para o desenho do prompt é a regra que você repete em todo projeto: <strong>estável primeiro, variável depois</strong>. No código de <code>cached.py</code> (aba seguinte) há duas camadas de estabilidade: as instruções nunca mudam; o arquivo em análise é estável durante a sessão de perguntas sobre ele (por isso leva o breakpoint); a pergunta varia. Esse escalonamento faz a segunda pergunta sobre o mesmo arquivo custar uma fração da primeira.</p>' },
        { tipo: 'takeaway', html: 'Cache só vale com <mark>reuso</mark>; <mark>estável primeiro</mark>, variável depois, com o breakpoint no <mark>último bloco estável</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'codigo', linguagem: 'python', texto: cachedPy },
        { tipo: 'texto', html:
          '<p>O exercício do bloco é medir um baseline sem cache, repetir com o prefixo marcado e quebrar o cache de propósito de três jeitos. O roteiro executável com fakes está no Laboratório guiado M05 (<code>tests/test_cache.py</code>). Aqui, o mesmo percurso com os números calculados pela fórmula: 5 perguntas sobre o mesmo arquivo, prefixo de 10.000 tokens no Sonnet 5 (US$ 2/M de entrada, retrato ago/2026).</p>' +
          '<p>Rode uma vez sem falha para ver escrita e leituras. Depois escolha uma sabotagem e rode de novo: cada uma zera a leitura, e cada uma existe em produção.</p>' },
        { tipo: 'quebre', id: 'cache-quebre', titulo: 'Rode o cache e depois quebre o prefixo', terminalTitulo: 'cached.py · exemplo calculado', prefixo: '$', entrada: CMD, unidade: 'mUS$', etapas: etapasCache(),
          enunciado: 'Rode sem falha, depois escolha uma falha, rode, e volte a "Sem falha". As saídas são calculadas com a tabela de preços (ago/2026), não vêm de execução real.',
          prever: { pergunta: 'Alguém coloca a data e hora atual no começo do system prompt. O que acontece com <code>cache_read_input_tokens</code> na 2ª chamada?', opcoes: [
            { id: 'a', texto: 'Continua 10.000: o resto do prompt é igual.', correta: false, porque: 'o prefixo é byte-a-byte; mudar o começo invalida tudo o que vem depois.' },
            { id: 'b', texto: 'Vai a zero, e a chamada reescreve o prefixo a 1,25x.', correta: true, porque: 'o prefixo mudou desde o primeiro byte, então não há o que ler e há o que escrever.' },
            { id: 'c', texto: 'Cai pela metade.', correta: false, porque: 'não existe leitura parcial de um prefixo que mudou na origem.' }
          ] },
          falhas: [
            { id: 'timestamp', rotulo: 'Timestamp no system', efeito: erroPrefixo('system = f"Agora são {datetime.now()}.\\n" + INSTRUCOES   # muda a cada chamada',
              'cache_creation alto e cache_read zero em toda chamada',
              'o breakpoint estava certo, mas o prefixo anterior a ele já não era idêntico. Cinco chamadas: 5 x US$ 0,025 = US$ 0,125, mais caro que os US$ 0,100 sem cache. Timestamp, id de sessão e nome do usuário vão depois do breakpoint, na mensagem.') },
            { id: 'caractere', rotulo: 'Um caractere mudou', efeito: erroPrefixo('INSTRUCOES = "...analista." -> "...analista!"   # deploy trocou um caractere',
              'o hash do prefixo é outro: miss, e escrita nova',
              'um deploy que muda o texto do system invalida o cache uma vez, e isso é esperado. O problema é quando o texto muda a cada chamada por montagem dinâmica. Compare o prefixo entre chamadas antes de culpar o provedor.') },
            { id: 'ttl', rotulo: 'Esperar além do TTL', efeito: erroPrefixo('espera de 6 minutos entre a pergunta 1 e a pergunta 2 (TTL padrão: 5 minutos)',
              'o prefixo expirou: renovar o TTL exige novo uso dentro da janela',
              'o TTL se renova a cada uso, não por tempo corrido. Chamadas espaçadas além da janela reescrevem o prefixo toda vez. Agrupe as chamadas, ou use o TTL de 1 hora só se a conta fechar (escrita 2x).') }
          ],
          tutorAntes: 'Rode primeiro sem falha: a pergunta 1 paga a escrita e as outras leem.',
          tutorDepois: 'Nas três sabotagens o sintoma é o mesmo: <code>cache_read_input_tokens</code> zerado. É por isso que você mede o hit rate pelos campos de <code>usage</code>, e não pela fé de que o cache está ligado.',
          callout: 'Você viu a escrita, as leituras e as três formas de zerar a leitura.' },
        { tipo: 'takeaway', html: 'Leitura zerada em <mark>toda chamada</mark> quase sempre é <mark>prefixo instável</mark>, <mark>TTL vencido</mark> ou prefixo abaixo do <mark>mínimo do modelo</mark>.' }
      ] },

      { rotulo: 'Camadas e prática', blocos: [
        { tipo: 'texto', html: '<p>O prompt cache é uma das quatro camadas de um sistema de IA maduro. As outras, em ordem de retorno:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Camada</th><th>O que guarda</th><th>Chave</th><th>Quando compensa</th></tr></thead><tbody>' +
          '<tr><td><strong>Prompt cache</strong> (provedor)</td><td>estado do prefixo</td><td>hash do prefixo (implícito)</td><td>sempre que houver prefixo grande e repetido: agentes, RAG, análise de documento</td></tr>' +
          '<tr><td><strong>Cache de resposta</strong> (seu)</td><td>a saída completa</td><td>hash de modelo + parâmetros + prompt inteiro</td><td>entradas repetidas de verdade (classificação de itens recorrentes, FAQ); exige <code>temperature=0</code> para fazer sentido</td></tr>' +
          '<tr><td><strong>Cache de embeddings</strong> (seu)</td><td>o vetor de um texto</td><td>hash do texto + modelo de embedding</td><td>sempre: texto imutável gera vetor imutável; reindexar um repositório sem isso é queimar dinheiro (M07)</td></tr>' +
          '<tr><td><strong>Cache semântico</strong></td><td>resposta de pergunta parecida</td><td>vizinhança vetorial da pergunta</td><td>com muita cautela: "qual o limite de saque?" e "qual o limite de saque internacional?" são vizinhas e têm respostas diferentes. Alto risco de resposta errada com cara de certa</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Chave de cache sem vazamento', html:
          '<p>O cache de resposta é um cache chave-valor comum, com dois cuidados novos. A chave precisa incluir a <strong>versão do modelo e os parâmetros de amostragem</strong>; senão você serve resposta do modelo antigo depois do upgrade, um bug silencioso clássico. E precisa incluir o <strong>tenant</strong> quando o prompt contém dado do cliente; senão vira vazamento entre tenants (M12). O cache de embeddings é memoização pura de função determinística, guardada numa tabela com o hash como chave primária.</p>' },
        { tipo: 'texto', html:
          '<p>A memoização de embeddings segue o mesmo molde (adapter com chamada real, trilha live opcional). Repare no <code>ON CONFLICT DO NOTHING</code>: dois workers podem calcular o mesmo texto ao mesmo tempo, e a corrida é resolvida por constraint (M03 bloco 2), não por <code>if</code>. E repare no modelo dentro da chave: trocar de modelo de embedding invalida o cache inteiro por construção, em vez de servir vetores incompatíveis.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: embedPy },
        { tipo: 'texto', html: '<h3>Praticar</h3><p>Monte o prompt na ordem certa, calcule o custo do prefixo e escreva a chave de cache. Tudo roda com modelo e cache fakes, sem rede.</p>' },
        { tipo: 'ordene', id: 'cache-ordene', titulo: 'Ordene o prompt por estabilidade', obrigatorio: false,
          enunciado: 'Ponha as peças na ordem em que entram no prefixo: da mais estável (primeira) para a que varia a cada chamada (última). O breakpoint fica no fim do último bloco estável.',
          itens: [
            { id: 'pergunta', texto: 'Pergunta do usuário (varia a cada chamada)' },
            { id: 'documento', texto: 'Documento em análise (estável durante a sessão) — o breakpoint termina aqui' },
            { id: 'tools', texto: 'Definições de tools (raramente mudam)' },
            { id: 'system', texto: 'Instruções de system (estáveis)' }
          ],
          solucao: ['tools', 'system', 'documento', 'pergunta'],
          dica: 'A ordem do prefixo é tools, system, messages. Dentro do system, o que muda menos vem antes.',
          tutorDepois: 'Mudar uma peça invalida tudo o que vem depois dela. Por isso a peça que muda a cada chamada fica por último, fora do prefixo cacheado.' },
        { tipo: 'python', id: 'cache-python', titulo: 'Custo do prefixo, ponto de equilíbrio e chave de resposta', obrigatorio: false,
          enunciado: 'Implemente três funções. <code>custo_prefixo(tokens, n, preco_in)</code>: US$ do prefixo em n chamadas dentro do TTL (abaixo do mínimo do modelo, nada cacheia). <code>compensa(hit, escrita)</code>: o custo esperado <code>hit x 0,10 + (1 - hit) x escrita</code> fica abaixo de 1? <code>chave_resposta(modelo, params, prompt, tenant)</code>: sha256 estável, sem depender da ordem das chaves de <code>params</code>.',
          codigo: codigoCache, testes: testesCache,
          dica: 'Custo: <code>base = tokens * preco_in / 1_000_000</code>; com cache, <code>base * escrita + base * 0.10 * (n - 1)</code>. Chave: <code>json.dumps([modelo, params, prompt, tenant], sort_keys=True)</code> e <code>hashlib.sha256(...).hexdigest()</code>.',
          solucao: solucaoCache,
          tutorDepois: 'Com escrita 1,25x o equilíbrio fica perto de 22% de hit rate; com TTL de 1 hora (2x) sobe para cerca de 53%. A chave sem tenant é o vazamento entre clientes do bloco.',
          callout: 'Custo, equilíbrio e chave passaram nos testes, incluindo o prefixo abaixo do mínimo e o tenant separado.' },
        { tipo: 'cenario', id: 'cache-cenario', titulo: 'O custo subiu depois de ativar o cache', obrigatorio: false,
          enunciado: 'Você ativou prompt caching num caminho de análise. Na semana seguinte a fatura de entrada subiu. Decida o que investigar.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O painel mostra <code>cache_creation_input_tokens</code> alto e <code>cache_read_input_tokens</code> baixo. As chamadas desse caminho chegam espaçadas, uma a cada 8 minutos, sobre o mesmo prefixo de 12.000 tokens. O que você faz primeiro?', opcoes: [
              { texto: 'Calcular o hit rate medido e comparar com o ponto de equilíbrio da escrita.', vai: 'mede', tom: 'ok', consequencia: 'a decisão sai de um número medido, não da fé de que cache sempre economiza.' },
              { texto: 'Trocar para um modelo mais barato e manter o cache como está.', vai: 'f-troca', tom: 'ruim', consequencia: 'o problema é a escrita repetida, e ela continua.' },
              { texto: 'Aumentar o prefixo para cachear mais coisa.', vai: 'f-mais', tom: 'ruim', consequencia: 'um prefixo maior só encarece cada reescrita.' }
            ] },
            mede: { texto: 'O hit rate é perto de zero: cada chamada chega depois dos 5 minutos de TTL e reescreve o prefixo a 1,25x. O que você faz?', opcoes: [
              { texto: 'Agrupar as chamadas dentro da janela, ou desligar o cache nesse caminho; usar TTL de 1 hora só se a conta fechar (escrita 2x).', vai: 'f-bom', tom: 'ok', consequencia: 'a escolha é por conta, com a escrita de cada TTL, e não por padrão.' },
              { texto: 'Manter como está: o cache é sempre vantajoso.', vai: 'f-fe', tom: 'ruim', consequencia: 'sem reuso, você paga 1,25x em cada chamada para nunca ler.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O prefixo deixa de ser reescrito sem proveito. Você registra o hit rate esperado por caminho antes de ligar o cache em outro.' },
            'f-troca': { bom: false, texto: 'A fatura de entrada continua alta: o custo vinha da escrita repetida, não do preço do modelo.' },
            'f-mais': { bom: false, texto: 'Cada reescrita agora custa mais, e a leitura continua zerada.' },
            'f-fe': { bom: false, texto: 'O cache segue custando mais que não cachear. Cache sem hit rate medido é aposta.' }
          } },
        { tipo: 'takeaway', html: 'Cache se decide por <mark>conta</mark> com <mark>hit rate medido</mark>, não por <mark>fé</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'cache-esc1', titulo: 'Quanto custa o prefixo com cache?',
          pergunta: 'Um prefixo de 10.000 tokens no Sonnet 5 (US$ 2/M; escrita 1,25x; leitura 0,1x) é reutilizado em 5 chamadas dentro do TTL. Aproximadamente quanto custa a parte do prefixo com cache, contra US$ 0,10 sem cache?',
          opcoes: [
            { id: 'a', texto: 'US$ 0,10 (igual).', correta: false, porque: 'só a primeira chamada paga preço de escrita; as demais leem a 0,1x.' },
            { id: 'b', texto: 'US$ 0,125.', correta: false, porque: 'seria o custo de cinco escritas, o caso do prefixo instável.' },
            { id: 'c', texto: 'Cerca de US$ 0,033: uma escrita de US$ 0,025 mais quatro leituras de US$ 0,002.', correta: true, porque: 'escrita: 10.000 x 2,5/M = 0,025. Cada leitura: 10.000 x 0,2/M = 0,002, vezes 4 = 0,008. Total de 0,033, economia de cerca de 67% (retrato ago/2026).' },
            { id: 'd', texto: 'US$ 0,010.', correta: false, porque: 'ignora a escrita da primeira chamada.' }
          ] },
        { tipo: 'escolha', id: 'cache-esc2', titulo: 'A chave do cache de resposta',
          pergunta: 'Qual afirmação sobre a chave do cache de resposta (a camada do seu código) está correta?',
          opcoes: [
            { id: 'a', texto: 'Basta o hash do texto da pergunta.', correta: false, porque: 'duas versões de modelo, dois conjuntos de parâmetros ou dois tenants colidiriam.' },
            { id: 'b', texto: 'Basta o hash do prompt, pois o modelo é sempre o mesmo.', correta: false, porque: 'o modelo muda no upgrade, e você passaria a servir resposta do modelo antigo.' },
            { id: 'c', texto: 'Pode ser compartilhada entre tenants para aumentar o hit rate.', correta: false, porque: 'com dado de cliente no prompt, isso é vazamento entre tenants (M12).' },
            { id: 'd', texto: 'Deve incluir versão do modelo, parâmetros de amostragem e, se há dado de cliente no prompt, o tenant.', correta: true, porque: 'sem modelo e parâmetros, serve resposta velha; sem tenant, vaza dado. E o cache semântico exige muita cautela: perguntas vizinhas podem ter respostas diferentes.' }
          ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Verificado em ago/2026', html:
          '<p>Mínimos por modelo (512, 1.024, 4.096), TTL (5 min e 1 h) e preços são o retrato de ago/2026 do módulo; revalide em 90 dias na tabela oficial antes de decidir. A trilha live opcional replica a etapa com provedor real, chave e crédito.</p>' },
        { tipo: 'takeaway', html: 'O prompt cache economiza com <mark>prefixo estável</mark> e <mark>hit rate</mark> acima do equilíbrio; sem isso, a <mark>escrita</mark> encarece.' }
      ] }
    ]
  });
})();
