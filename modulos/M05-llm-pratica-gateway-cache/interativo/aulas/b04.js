/* M05 · Bloco 4: streaming e latência percebida. Fonte: M05.html#b04. Números do exemplo: TTFT de 0,8 s e 50 tokens por segundo (os do teste rápido do bloco). Streams do laboratório e destas saídas são simulados (modelo fake). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var PY = function (a) { return a.join('\n') + '\n'; };

  var etapasMedir = function () {
    return [
      { id: 'ttft', nome: 'TTFT', descricao: 'Do envio ao primeiro token', tom: 'dns', ms: 0.8, linhas: [
        L('cmd', 'python medir.py --ttft 0.8 --tps 50 --saida 2000 --saida 400'),
        L('out', 'TTFT: 0,8 s (depende do tamanho do input, da fila do provedor e do cache)'),
        L('hint', 'abaixo de 1 s é bom; acima de 3 s parece travado')] },
      { id: 'longa', nome: 'Geração de 2000 tokens', descricao: '2000 / 50 tokens por segundo', tom: 'tcp', ms: 40, linhas: [
        L('out', 'TPOT: 50 tokens por segundo = 0,02 s por token (modelo e carga do provedor: você quase não controla)'),
        L('out', 'total = TTFT + TPOT x tokens = 0,8 + 2000 / 50 = 40,8 s'),
        L('hint', 'a saída domina: 40 dos 40,8 segundos são geração')] },
      { id: 'curta', nome: 'Mesma conta com 400 tokens', descricao: 'Não entra na barra: é a comparação', tom: 'request', ms: 0, linhas: [
        L('out', 'total = 0,8 + 400 / 50 = 8,8 s'),
        L('hint', 'o custo de output cai na mesma proporção; imponha a brevidade no schema (bloco 2), não no pedido')] },
      { id: 'leitura', nome: 'Leitura', descricao: 'Antes de otimizar infraestrutura', tom: 'ink', ms: 0, linhas: [
        L('in', 'pergunte primeiro se você precisa mesmo daquele texto todo')] }
    ];
  };

  var etapasStream = function () {
    return [
      { id: 'abre', nome: 'Abre a conexão', descricao: 'POST /perguntar', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'curl -N -X POST localhost:8000/perguntar -d \'{"texto": "explique este trecho"}\''),
        L('out', 'HTTP/1.1 200 OK'),
        L('out', 'content-type: text/event-stream'),
        L('out', 'cache-control: no-cache   x-accel-buffering: no')] },
      { id: 'primeiro', nome: 'Primeiro token', descricao: 'TTFT', tom: 'tcp', ms: 1, linhas: [
        L('body', 'data: {"delta": "Este trecho"}'),
        L('hint', 'o usuário vê texto aos 0,8 s em vez de uma tela parada por 40 s')] },
      { id: 'deltas', nome: 'Pedaços do texto', descricao: 'Um evento por delta', tom: 'tls', ms: 1, linhas: [
        L('body', 'data: {"delta": " faz"}'),
        L('body', 'data: {"delta": " a validação do pedido..."}'),
        L('hint', 'cada evento é "data: " + JSON + linha em branco')] },
      { id: 'fim', nome: 'Evento final', descricao: 'done e métricas', tom: 'response', ms: 1, linhas: [
        L('body', 'data: {"done": true, "metricas": {"ttft_ms": 800, "total_ms": 40800, "output_tokens": 2000, "input_tokens": 812, "tps": 49.0}}'),
        L('hint', 'métricas vêm de usage; tps = output_tokens / total (exemplo simulado)')] },
      { id: 'cliente', nome: 'Cliente lê', descricao: 'Texto montado, status ok', tom: 'ink', ms: 1, linhas: [
        L('in', 'cliente: status ok, texto completo montado a partir dos deltas')] }
    ];
  };

  var codigoPy = PY([
    'import json',
    '',
    '',
    'def sse_evento(dado):',
    '    """Um evento SSE: a linha "data: <json>" seguida de uma linha em branco."""',
    '    # 1. "data: " + JSON + dois \\n',
    '    return ""',
    '',
    '',
    'def latencia_total(ttft, tps, tokens):',
    '    """Total = TTFT + TPOT x tokens gerados (TPOT = 1 / tps)."""',
    '    # 2. calcule o total em segundos',
    '    return 0.0',
    '',
    '',
    'def padrao(segundos, humano_esperando):',
    '    """"sincrono" (< 2 s), "streaming" (2 a 30 s com humano esperando) ou "assincrono"."""',
    '    # 3. abaixo de 2 s: sincrono; de 2 a 30 s com humano esperando: streaming;',
    '    #    acima de 30 s, ou sem humano na frente: assincrono',
    '    return ""',
    '',
    '',
    'def consumir_sse(corpo):',
    '    """Cliente: devolve (texto, status) com status "ok", "erro" ou "interrompido"."""',
    '    texto = ""',
    '    for bloco in corpo.split("\\n\\n"):',
    '        if not bloco.startswith("data: "):',
    '            continue',
    '        try:',
    '            evento = json.loads(bloco[len("data: "):])',
    '        except json.JSONDecodeError:',
    '            break  # evento cortado no meio: a conexao caiu',
    '        # 4. evento com "error": devolva (texto parcial, "erro");',
    '        #    evento com "done": devolva (texto, "ok"); senao some o "delta"',
    '        texto += evento.get("delta", "")',
    '    return texto, "interrompido"',
    '',
    '',
    'print(repr(sse_evento({"delta": "ola"})))'
  ]);
  var solucaoPy = PY([
    'import json',
    '',
    '',
    'def sse_evento(dado):',
    '    """Um evento SSE: a linha "data: <json>" seguida de uma linha em branco."""',
    '    return "data: " + json.dumps(dado) + "\\n\\n"',
    '',
    '',
    'def latencia_total(ttft, tps, tokens):',
    '    """Total = TTFT + TPOT x tokens gerados (TPOT = 1 / tps)."""',
    '    return ttft + tokens / tps',
    '',
    '',
    'def padrao(segundos, humano_esperando):',
    '    """"sincrono" (< 2 s), "streaming" (2 a 30 s com humano esperando) ou "assincrono"."""',
    '    if segundos < 2:',
    '        return "sincrono"',
    '    if humano_esperando and segundos <= 30:',
    '        return "streaming"',
    '    return "assincrono"',
    '',
    '',
    'def consumir_sse(corpo):',
    '    """Cliente: devolve (texto, status) com status "ok", "erro" ou "interrompido"."""',
    '    texto = ""',
    '    for bloco in corpo.split("\\n\\n"):',
    '        if not bloco.startswith("data: "):',
    '            continue',
    '        try:',
    '            evento = json.loads(bloco[len("data: "):])',
    '        except json.JSONDecodeError:',
    '            break  # evento cortado no meio: a conexao caiu',
    '        if "error" in evento:',
    '            return texto, "erro"',
    '        if evento.get("done"):',
    '            return texto, "ok"',
    '        texto += evento.get("delta", "")',
    '    return texto, "interrompido"',
    '',
    '',
    'print(repr(sse_evento({"delta": "ola"})))'
  ]);
  var testesPy = PY([
    'def test_formato_sse():',
    '    assert sse_evento({"delta": "ola"}) == \'data: {"delta": "ola"}\\n\\n\'',
    '    assert sse_evento({"done": True}).endswith("\\n\\n")',
    '',
    '',
    'def test_saida_domina_a_latencia():',
    '    assert abs(latencia_total(0.8, 50, 2000) - 40.8) < 1e-9',
    '    assert abs(latencia_total(0.8, 50, 400) - 8.8) < 1e-9',
    '',
    '',
    'def test_saida_vazia_so_paga_o_ttft():',
    '    assert latencia_total(0.8, 50, 0) == 0.8',
    '',
    '',
    'def test_padrao_por_tempo_esperado():',
    '    assert padrao(1.5, True) == "sincrono"',
    '    assert padrao(2, True) == "streaming"',
    '    assert padrao(30, True) == "streaming"',
    '    assert padrao(60, True) == "assincrono"',
    '',
    '',
    'def test_sem_humano_vai_para_fila():',
    '    assert padrao(10, False) == "assincrono"',
    '    assert padrao(1, False) == "sincrono"',
    '',
    '',
    'def test_cliente_completo():',
    '    corpo = sse_evento({"delta": "Este"}) + sse_evento({"delta": " trecho"}) + sse_evento({"done": True})',
    '    assert consumir_sse(corpo) == ("Este trecho", "ok")',
    '',
    '',
    'def test_erro_no_meio_do_stream():',
    '    corpo = sse_evento({"delta": "Este"}) + sse_evento({"error": "provedor caiu"})',
    '    assert consumir_sse(corpo) == ("Este", "erro")',
    '',
    '',
    'def test_conexao_cortada_nao_e_sucesso():',
    '    corpo = sse_evento({"delta": "a"}) + \'data: {"del\'',
    '    assert consumir_sse(corpo) == ("a", "interrompido")',
    '    assert consumir_sse(sse_evento({"delta": "a"})) == ("a", "interrompido")'
  ]);

  TrilhaAula.registrar({
    id: 'm05-b4',
    titulo: 'Streaming e latência percebida',
    minutos: 30,
    resumo: 'A saída domina o tempo total. Streaming melhora a percepção; o padrão assíncrono resolve a conexão presa. Escolher entre os dois é decisão de arquitetura, e depende de uma métrica que você precisa medir.',
    objetivo: 'Medir TTFT, TPOT e total, montar um endpoint SSE sabendo o que quebra em produção e escolher entre síncrono, streaming e assíncrono, com fila limitada e backpressure.',
    revisao: [
      { id: 'm05b4-saida', pergunta: 'Qual mudança reduz mais o tempo total de uma resposta de 2.000 tokens (TTFT de 0,8 s e 50 tokens/s)?',
        opcoes: [
          opc('a', 'Limitar a saída a cerca de 400 tokens, no schema: o total passa de cerca de 40,8 s para cerca de 8,8 s', true, 'total = TTFT + TPOT x tokens gerados: a saída domina, e a brevidade se impõe no schema.'),
          opc('b', 'Reduzir o prompt de sistema em 10%', false, 'afeta o TTFT, que aqui é só 0,8 s.'),
          opc('c', 'Trocar HTTP por WebSocket', false, 'o transporte não muda o tempo de geração.')] },
      { id: 'm05b4-assincrono', pergunta: 'Uma análise de repositório leva cerca de 60 s e roda sem humano na frente. Que padrão usar?',
        opcoes: [
          opc('a', 'Assíncrono: 202 Accepted com id, um worker processa, o cliente consulta status ou recebe webhook', true, 'proxies matam conexões em 30 a 60 s; o assíncrono traz retomada, prioridade de fila e sobrevive à morte do processo.'),
          opc('b', 'SSE, porque streaming sempre resolve latência', false, 'streaming melhora a percepção, não encurta o trabalho.'),
          opc('c', 'Síncrono com timeout de 120 s', false, 'ninguém segura uma conexão HTTP por esse tempo de forma confiável.')] },
      { id: 'm05b4-json', pergunta: 'Por que "streamar" uma saída que é um objeto JSON estruturado costuma ser má ideia?',
        opcoes: [
          opc('a', 'JSON parcial não é JSON: você só valida no fim; prefira não streamar (ou streamar um campo de texto do schema)', true, 'o usuário veria chaves e aspas surgindo na tela.'),
          opc('b', 'SSE não transporta JSON', false, 'transporta: cada evento é "data: " mais um JSON.'),
          opc('c', 'O provedor cobra o dobro', false, 'o preço por token não muda com o streaming.')] },
      { id: 'm05b4-erro-stream', pergunta: 'O provedor falha no meio de um stream, depois de o servidor ter enviado 200 OK. O que o contrato precisa prever?',
        opcoes: [
          opc('a', 'Um evento de erro no próprio stream (data: {"error": ...}) que o cliente trata', true, 'não dá para virar 500 depois de enviar 200; falha silenciosa no meio do stream é o bug mais difícil de diagnosticar.'),
          opc('b', 'Responder 500 no meio do stream', false, 'o status já foi enviado.'),
          opc('c', 'Nada: o cliente reconecta sozinho e repete', false, 'sem evento de erro, o cliente nem sabe que falhou, e pode repetir um custo.')] },
      { id: 'm05b4-little', pergunta: 'Cada análise leva W = 40 s e chegam λ = 2 por segundo. Quantas análises simultâneas você precisa sustentar?',
        opcoes: [
          opc('a', 'L = λ x W = 80; sem isso a fila cresce para sempre', true, 'a conta dimensiona workers e o limite de concorrência do provedor (Lei de Little).'),
          opc('b', '2, porque é a taxa de chegada', false, 'a taxa de chegada não considera o tempo de cada trabalho.'),
          opc('c', '40, porque é a duração', false, 'a duração sozinha não dimensiona a concorrência.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Uma resposta de 800 tokens leva vários segundos</h3>' +
          '<p>LLM é lento em escala humana. Se o seu endpoint espera a resposta completa para devolver, o usuário encara uma tela parada, e o seu servidor segura uma conexão por todo esse tempo. <strong>Streaming</strong> resolve o primeiro problema; o <strong>padrão assíncrono</strong> resolve o segundo. Saber qual dos dois aplicar é decisão de arquitetura, não de gosto, e depende de uma métrica que você provavelmente nunca mediu.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>As três métricas de latência de LLM</h3>' +
          '<table><thead><tr><th>Métrica</th><th>O que é</th><th>Do que depende</th><th>Alvo típico</th></tr></thead><tbody>' +
          '<tr><td><strong>TTFT</strong> (time to first token)</td><td>Do envio até o primeiro token chegar</td><td>Tamanho do <em>input</em>, fila do provedor, cache (bloco 5)</td><td>Menos de 1 s é bom; mais de 3 s parece travado</td></tr>' +
          '<tr><td><strong>TPOT</strong> (time per output token)</td><td>Intervalo entre tokens gerados</td><td>Modelo e carga do provedor: você quase não controla</td><td>20 a 100 tokens/s</td></tr>' +
          '<tr><td><strong>Total</strong></td><td>TTFT + (TPOT x tokens gerados)</td><td>Sobretudo o <strong>tamanho da saída</strong></td><td>É o que a fatura e o timeout enxergam</td></tr>' +
          '</tbody></table>' +
          '<p>A consequência prática que muda projeto: <strong>a saída domina o tempo total</strong>. Reduzir a resposta de 2.000 para 400 tokens corta cerca de 5 vezes a latência <em>e</em> o custo de output. Antes de otimizar infraestrutura, pergunte se você precisa mesmo daquele texto todo, e imponha a resposta curta no schema (bloco 2), não no pedido.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'SSE (Server-Sent Events)', html:
          '<p><strong>SSE</strong> é um padrão HTTP para o servidor empurrar eventos ao cliente por uma conexão que fica aberta: a resposta tem <code>Content-Type: text/event-stream</code> e o corpo é uma sequência de linhas <code>data: {...}</code> separadas por linha em branco. É unidirecional (servidor para cliente), roda sobre HTTP comum (atravessa proxy e CDN sem cerimônia) e reconecta sozinho no navegador via <code>EventSource</code>. Comparado a WebSocket é mais simples e sem handshake especial, mas só vai numa direção, o que basta para streaming de LLM, porque o cliente não fala durante a geração. É o transporte que praticamente todos os provedores usam.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Para quem vem de endpoints síncronos', html:
          '<p>Em SSE com FastAPI, o <em>tipo de retorno muda</em>: você não devolve um objeto, devolve um <strong>gerador async</strong> (M02, bloco 5: <code>yield</code> em função assíncrona). Consequência de arquitetura: <strong>cada stream aberto é uma conexão ocupada</strong>, barata em memória no event loop, mas contando no limite de conexões do proxy e do provedor.</p>' },
        { tipo: 'takeaway', html: 'O tempo total é dominado pela <mark>saída</mark>: antes de otimizar infraestrutura, <mark>encurte a resposta</mark> no schema.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Com TTFT de 0,8 s e 50 tokens por segundo, compare duas respostas. Preveja o total da saída curta antes de rodar.</p>' },
        { tipo: 'rode', id: 'm05b4-rode', titulo: 'Meça TTFT, TPOT e total', enunciado: 'Rode a medição simulada. As barras mostram a duração em segundos de cada parte.',
          prefixo: '$', entrada: 'python medir.py --ttft 0.8 --tps 50 --saida 2000 --saida 400', unidade: 's', terminalTitulo: 'medição', etapas: etapasMedir(),
          prever: { pergunta: 'Limitar a saída de 2.000 para 400 tokens (TTFT 0,8 s, 50 tokens/s): quanto passa a durar a resposta?', opcoes: [
            { id: 'a', texto: 'Cerca de 36 s: só 10% menos, porque o TTFT é o que pesa.', correta: false, porque: 'o TTFT é só 0,8 s; quem pesa é a geração dos tokens.' },
            { id: 'b', texto: 'Cerca de 8,8 s: a geração cai de 40 s para 8 s e o TTFT fica igual.', correta: true, porque: 'total = TTFT + TPOT x tokens gerados = 0,8 + 400 / 50.' },
            { id: 'c', texto: 'Cerca de 20,8 s, porque a latência é metade fixa e metade variável.', correta: false, porque: 'só o TTFT é fixo, e ele é pequeno aqui.' }
          ] },
          tutorAntes: 'Aperte Enter. Depois clique em "Mesma conta com 400 tokens" para ler o cálculo.',
          tutorDepois: 'De 40,8 s para 8,8 s: cerca de 5 vezes menos latência e o custo de output cai na mesma proporção. A brevidade se impõe no schema (max_length), não em um pedido no prompt.',
          callout: 'Você viu a saída dominar o tempo total.' },
        { tipo: 'texto', html:
          '<h3>Streaming ponta a ponta</h3>' +
          '<p><em>Exemplo de adapter; a trilha live é opcional e exige chave de API. Montagem e backpressure executáveis vivem no laboratório.</em> O endpoint repassa o stream do modelo ao cliente e mede as métricas.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '# src/llm_lab/stream_api.py\n' +
          'async def gerar(pergunta: str) -> AsyncIterator[str]:\n' +
          '    inicio = time.perf_counter()\n' +
          '    ttft: float | None = None\n' +
          '    tokens = 0\n\n' +
          '    async with client.messages.stream(\n' +
          '        model="claude-sonnet-5",\n' +
          '        max_tokens=1000,\n' +
          '        temperature=0,\n' +
          '        messages=[{"role": "user", "content": pergunta}],\n' +
          '    ) as stream:\n' +
          '        async for texto in stream.text_stream:\n' +
          '            if ttft is None:\n' +
          '                ttft = time.perf_counter() - inicio\n' +
          '            tokens += 1\n' +
          '            # cada evento SSE: "data: <json>\\n\\n"\n' +
          '            yield f"data: {json.dumps({\'delta\': texto})}\\n\\n"\n\n' +
          '        final = await stream.get_final_message()\n\n' +
          '    total = time.perf_counter() - inicio\n' +
          '    metricas = {\n' +
          '        "ttft_ms": round((ttft or 0) * 1000),\n' +
          '        "total_ms": round(total * 1000),\n' +
          '        "output_tokens": final.usage.output_tokens,\n' +
          '        "input_tokens": final.usage.input_tokens,\n' +
          '        "tps": round(final.usage.output_tokens / total, 1),\n' +
          '    }\n' +
          '    yield f"data: {json.dumps({\'done\': True, \'metricas\': metricas})}\\n\\n"\n\n\n' +
          '@app.post("/perguntar")\n' +
          'async def perguntar(p: Pergunta) -> StreamingResponse:\n' +
          '    return StreamingResponse(\n' +
          '        gerar(p.texto),\n' +
          '        media_type="text/event-stream",\n' +
          '        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},\n' +
          '    )' },
        { tipo: 'callout', tom: 'danger', titulo: 'Os quatro detalhes que quebram streaming em produção', html:
          '<ol>' +
          '<li><strong>Buffering do proxy.</strong> Nginx e vários PaaS acumulam a resposta antes de enviar: o stream chega tudo de uma vez no final, anulando o benefício. O header <code>X-Accel-Buffering: no</code> resolve no nginx; em outros, procure a opção equivalente. Sintoma: funciona no <code>curl</code> local, não funciona em produção.</li>' +
          '<li><strong>Erro no meio do stream.</strong> Você já mandou <code>200 OK</code>: não dá para virar 500. O contrato precisa prever um evento de erro (<code>data: {"error": "..."}</code>) e o cliente precisa tratá-lo. Falha silenciosa no meio de um stream é o bug mais difícil de diagnosticar deste bloco.</li>' +
          '<li><strong>Cliente desconectou.</strong> Sem tratamento, você continua pagando tokens para ninguém. O FastAPI cancela o gerador quando a conexão cai (a corrotina recebe <code>CancelledError</code>), <em>desde que</em> você não engula exceção genérica no meio do loop.</li>' +
          '<li><strong>Structured output mais streaming é combinação ruim.</strong> JSON parcial não é JSON: você só pode validar no fim, e o usuário vê chaves e aspas surgindo na tela. Para saída estruturada, prefira não streamar (ou streame apenas um campo de texto do schema).</li></ol>' },
        { tipo: 'quebre', id: 'm05b4-quebre', titulo: 'Quebre o stream em produção', obrigatorio: false,
          enunciado: 'Rode o stream sem falha e depois com cada um dos três problemas de produção (saídas simuladas).',
          prefixo: '$', entrada: 'curl -N -X POST localhost:8000/perguntar', unidade: 'etapa', terminalTitulo: 'curl -N (stream simulado)', etapas: etapasStream(),
          falhas: [
            { id: 'proxy', rotulo: 'proxy que acumula a resposta (buffering)', efeito: { etapaFalha: 'primeiro', linhasErro: [
              L('info', 'ambiente: atrás de um proxy sem X-Accel-Buffering: no'),
              L('out', '(40 s sem nenhuma linha)'),
              L('body', 'data: {"delta": "Este trecho"}   data: {"delta": " faz"}   ...   (tudo de uma vez no final)'),
              L('hint', 'funciona no curl local e não em produção: o TTFT percebido virou o tempo total')], tutor: 'o proxy acumulou a resposta e anulou o benefício. O header X-Accel-Buffering: no resolve no nginx; em outros, procure a opção equivalente.' } },
            { id: 'erro', rotulo: 'provedor falha no meio do stream', efeito: { etapaFalha: 'deltas', linhasErro: [
              L('body', 'data: {"delta": "Este trecho"}'),
              L('body', 'data: {"error": "provedor indisponível"}'),
              L('in', 'cliente: status erro, com o texto parcial "Este trecho" guardado'),
              L('hint', 'o 200 OK já foi enviado: o erro precisa ser um evento do próprio stream')], tutor: 'não dá para virar 500. O contrato prevê o evento de erro e o cliente o trata; sem isso, a falha fica silenciosa.' } },
            { id: 'cliente', rotulo: 'cliente desconectou e o servidor não cancela', efeito: { etapaFalha: 'deltas', linhasErro: [
              L('info', 'o cliente fechou a aba no meio da resposta'),
              L('out', 'sem tratamento: o gerador segue consumindo tokens do provedor para ninguém'),
              L('out', 'com tratamento: o FastAPI cancela o gerador (CancelledError) e o servidor registra o cancelamento'),
              L('hint', 'só funciona se o loop não engolir exceção genérica')], tutor: 'sem cancelamento você continua pagando tokens que ninguém lê.' } }
          ],
          tutorAntes: 'Comece por Sem falha. Depois escolha um problema e rode de novo.',
          tutorDepois: 'Os três são falhas de produção que o curl local não mostra: buffering de proxy, erro depois do 200 e cliente que sai. O quarto detalhe é de projeto: não streame JSON estruturado.',
          callout: 'Você viu três modos de falha do streaming em produção.' },
        { tipo: 'takeaway', html: 'Streaming exige <mark>evento de erro</mark> no contrato, <mark>cancelamento</mark> ao desconectar e proxy sem <mark>buffering</mark>.' }
      ] },

      { rotulo: 'Quando não streamar', blocos: [
        { tipo: 'texto', html:
          '<h3>O padrão assíncrono</h3>' +
          '<p>Streaming melhora a <em>percepção</em>, mas não muda o fato de que o trabalho leva 40 segundos, e ninguém segura uma conexão HTTP por 40 segundos de forma confiável: proxies matam em 30 a 60 s, o celular troca de rede, o usuário fecha a aba. A regra do curso:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Tempo esperado</th><th>Padrão</th><th>Exemplo no Capstone</th></tr></thead><tbody>' +
          '<tr><td>Menos de 2 s</td><td>Síncrono simples</td><td>Classificar um arquivo, responder pergunta curta</td></tr>' +
          '<tr><td>2 a 30 s, com humano esperando</td><td><strong>Streaming SSE</strong></td><td>Explicar um trecho de código no chat</td></tr>' +
          '<tr><td>Mais de 30 s, ou sem humano na frente</td><td><strong>Assíncrono</strong>: 202, job e status ou webhook</td><td>Ingerir e analisar um repositório inteiro</td></tr>' +
          '</tbody></table>' +
          '<p>O padrão assíncrono é o do M03 (bloco 8) e o do Capstone: <code>POST /analises</code> devolve <strong>202 Accepted</strong> com um id, um worker processa, e o cliente acompanha por <code>GET /analises/{id}</code> (ou recebe webhook). Ele traz de brinde o que streaming não dá: <strong>retomada após falha</strong> (M10), controle de concorrência, prioridade de fila e a possibilidade de o processo morrer sem perder o trabalho.</p>' },
        { tipo: 'abas', rotulo: 'Os três padrões', itens: [
          { rotulo: 'Síncrono (menos de 2 s)', blocos: [
            { tipo: 'codigo', linguagem: 'http', texto: 'POST /classificar\n200 OK\n{"categoria": "alto"}' },
            { tipo: 'texto', html: '<p>Resposta curta, sem humano esperando muito. O mais simples que funciona.</p>' }] },
          { rotulo: 'Streaming SSE (2 a 30 s)', blocos: [
            { tipo: 'codigo', linguagem: 'http', texto: '200 OK\nContent-Type: text/event-stream\nX-Accel-Buffering: no\n\ndata: {"texto": "Este trecho"}\n\ndata: {"texto": " faz..."}' },
            { tipo: 'texto', html: '<p>Humano esperando: melhora a percepção (TTFT). Prever o evento de erro no meio do stream.</p>' }] },
          { rotulo: 'Assíncrono (mais de 30 s)', blocos: [
            { tipo: 'codigo', linguagem: 'http', texto: 'POST /analises    -> 202 Accepted {"id": "a1"}\nGET  /analises/a1 -> {"status": "processando"}\nGET  /analises/a1 -> {"status": "pronto", ...}' },
            { tipo: 'texto', html: '<p>Job e status (ou webhook). Dá retomada, controle de concorrência e fila.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Filas, backpressure e produtor-consumidor</h3>' +
          '<p>Assim que você põe uma fila entre a API e o trabalho pesado, herda a teoria clássica, com um consumidor novo.</p>' +
          '<ul>' +
          '<li><strong>Backpressure é obrigatório.</strong> Fila sem limite não é resiliência, é adiamento: ela cresce até estourar memória ou até a latência ficar inaceitável. Fila com limite força uma decisão honesta: recusar (429), degradar (modelo mais barato) ou enfileirar com prazo declarado. <em>Escolher explicitamente</em> é a diferença entre sistema e reza.</li>' +
          '<li><strong>Lei de Little de novo (M02, bloco 4).</strong> <code>L = λ x W</code>. Se cada análise leva W = 40 s e chegam λ = 2 por segundo, você precisa de L = 80 em processamento simultâneo. Não tem? A fila cresce para sempre. Essa conta dimensiona seus workers e o limite de concorrência do provedor.</li>' +
          '<li><strong>O consumidor tem rate limit.</strong> Diferente de CPU, o provedor de LLM te corta (429), às vezes por <em>tokens por minuto</em> e não só por requisições. O pool de workers precisa de um semáforo global (M02) alinhado com a cota, e de retry com backoff exponencial e <em>jitter</em>; senão todos os workers voltam juntos e você se auto-DDoSa (thundering herd).</li>' +
          '<li><strong>Idempotência do job.</strong> O worker morre no meio, a mensagem volta para a fila, o job roda de novo, e você paga a chamada de LLM duas vezes ou, pior, duplica o efeito. Chave de idempotência e checkpoint (M10) não são luxo.</li></ul>' },
        { tipo: 'cenario', id: 'm05b4-cenario', titulo: 'Análise de 60 s, sem usuário esperando', obrigatorio: false,
          enunciado: 'O produto pede a análise de um repositório inteiro: cerca de 60 s, disparada por uma integração. Escolha o padrão e o desenho da fila e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Alguém propõe SSE, "porque streaming melhora a latência". Qual é o padrão?', opcoes: [
              { texto: 'SSE: o cliente vê o progresso.', vai: 'f-sse', tom: 'ruim', consequencia: 'não há humano na frente, e a conexão de 60 s esbarra em proxies que matam em 30 a 60 s.' },
              { texto: 'Síncrono com timeout de 120 s.', vai: 'f-sinc', tom: 'ruim', consequencia: 'a conexão presa cai quando o celular troca de rede ou o proxy corta.' },
              { texto: 'Assíncrono: POST devolve 202 com id; worker processa; o cliente consulta status ou recebe webhook.', vai: 'fila', tom: 'ok', consequencia: 'você ganha retomada, prioridade de fila e sobrevive à morte do processo.' }
            ] },
            fila: { texto: 'Chegam 2 análises por segundo e cada uma leva 40 s. Como desenhar a fila?', opcoes: [
              { texto: 'Fila sem limite: nada é recusado.', vai: 'f-fila', tom: 'ruim', consequencia: 'fila sem limite é adiamento: cresce até a latência ficar inaceitável.' },
              { texto: 'Fila com limite e decisão explícita (429, degradar ou prazo), 80 execuções simultâneas por Little, semáforo alinhado com a cota e backoff com jitter.', vai: 'f-bom', tom: 'ok', consequencia: 'a escolha é explícita, e o provedor não é atingido por um thundering herd.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Sistema, não reza: o limite está declarado, o dimensionamento sai da conta e o job é idempotente.' },
            'f-sse': { bom: false, texto: 'A conexão caiu no meio das análises e ninguém soube que falhou.' },
            'f-sinc': { bom: false, texto: 'Timeouts aleatórios e análises refeitas, pagando tokens duas vezes.' },
            'f-fila': { bom: false, texto: 'A fila cresceu sem parar, e os prazos viraram horas.' }
          },
          callout: 'Você escolheu o padrão assíncrono e deu limite à fila.' },
        { tipo: 'takeaway', html: '<mark>Fila sem limite é adiamento</mark>: declare o <mark>backpressure</mark> e dimensione pela <mark>Lei de Little</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Monte e consuma o stream</h3>' +
          '<p>No laboratório guiado o stream é simulado, e você prova que o input domina o TTFT e a saída domina o total. Aqui, escreva as quatro peças pequenas que decidem se o streaming funciona: o evento SSE, a conta de latência, a escolha do padrão e o cliente que distingue sucesso, erro e conexão cortada.</p>' },
        { tipo: 'python', id: 'm05b4-python', titulo: 'SSE, latência e escolha do padrão', obrigatorio: false,
          enunciado: 'Complete <code>sse_evento</code>, <code>latencia_total(ttft, tps, tokens)</code>, <code>padrao(segundos, humano_esperando)</code> e o ramo de <code>consumir_sse</code> que distingue evento de erro e evento <code>done</code>.',
          codigo: codigoPy, testes: testesPy,
          dica: 'O evento SSE é <code>"data: " + json.dumps(dado) + "\\n\\n"</code>. Na latência, o TPOT é <code>1 / tps</code>, então o total é <code>ttft + tokens / tps</code>. No cliente, só <code>done</code> é sucesso: fim de corpo sem <code>done</code> é "interrompido".',
          solucao: solucaoPy,
          tutorDepois: 'O controle negativo é o importante: um corpo sem o evento done não é sucesso. Conexão cortada e evento de erro são casos diferentes, e o cliente precisa distingui-los.',
          callout: 'As quatro peças passaram: formato, latência, padrão e cliente que não confunde corte com sucesso.' },
        { tipo: 'escolha', id: 'm05b4-escolha-proxy', titulo: 'Confira: funciona no curl, não em produção',
          pergunta: 'O endpoint SSE entrega os pedaços de texto aos poucos no <code>curl</code> local, mas em produção o usuário vê tudo de uma vez no final. Qual é a causa mais provável e o conserto?',
          opcoes: [
            { id: 'a', texto: 'Buffering do proxy (nginx ou PaaS): enviar <code>X-Accel-Buffering: no</code> ou a opção equivalente do proxy.', correta: true, porque: 'o sintoma clássico é funcionar no curl local e não em produção.' },
            { id: 'b', texto: 'O modelo gera tudo antes de enviar; é preciso aumentar o TPOT.', correta: false, porque: 'o TPOT é o ritmo do provedor, que você quase não controla; o problema está entre o servidor e o cliente.' },
            { id: 'c', texto: 'SSE não funciona em produção: troque por WebSocket.', correta: false, porque: 'SSE roda sobre HTTP comum e é o transporte da maioria dos provedores.' },
            { id: 'd', texto: 'Falta streamar o JSON estruturado inteiro.', correta: false, porque: 'JSON parcial não é JSON; isso é uma combinação ruim, não um conserto.' }
          ], tutorDepois: 'Sintoma de buffering: ok no curl local, quebrado em produção.' },
        { tipo: 'escolha', id: 'm05b4-escolha-backpressure', titulo: 'Confira: a fila que cresce',
          pergunta: 'Os jobs de análise não param de chegar e a fila de jobs cresce sem limite. Qual é a decisão correta?',
          opcoes: [
            { id: 'a', texto: 'Dar limite à fila e escolher explicitamente: recusar (429), degradar para um modelo mais barato ou enfileirar com prazo declarado.', correta: true, porque: 'fila sem limite não é resiliência, é adiamento; escolher explicitamente é a diferença entre sistema e reza.' },
            { id: 'b', texto: 'Deixar crescer: memória é barata.', correta: false, porque: 'ela cresce até estourar a memória ou até a latência ficar inaceitável.' },
            { id: 'c', texto: 'Subir workers sem checar a cota: o provedor aguenta.', correta: false, porque: 'o provedor corta por requisições e por tokens por minuto; o pool precisa de semáforo alinhado com a cota.' },
            { id: 'd', texto: 'Mandar todos os workers repetirem juntos ao receber 429.', correta: false, porque: 'sem backoff exponencial e jitter, todos voltam juntos e você se auto-DDoSa (thundering herd).' }
          ], tutorDepois: 'Declare o backpressure e dimensione por L = λ x W.' },
        { tipo: 'takeaway', html: 'Escolha o padrão pelo <mark>tempo esperado</mark> e por haver <mark>humano esperando</mark>; no stream, só o evento <mark>done</mark> é sucesso.' }
      ] }
    ]
  });
})();
