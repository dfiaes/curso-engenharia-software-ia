/* M02A · Bloco 11: complexidade, estruturas de dados, performance e custo. Fonte: M02A.html#b11. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'import statistics', '', '',
    'def resumir(amostras, warmup):', '    # descarta as `warmup` primeiras amostras e devolve {"p50", "p95", "n"}',
    '    # p95 = statistics.quantiles(dados, n=100, method="exclusive")[94]', '    return {"p50": 0.0, "p95": 0.0, "n": 0}', '', '',
    'def joelho(pontos):', '    # pontos: [(carga, vazao)] crescentes. O joelho é a carga em que o PRÓXIMO ponto ganha menos de 5% de vazão;',
    '    # se nunca satura, devolve a última carga', '    return pontos[0][0]', '', '',
    'def buscar(cache, chave, versao):', '    # cache: {chave: (valor, versao)}; devolve (valor, True) só se a versão da policy é a vigente', '    return (None, False)', '', '',
    'def guardar(cache, chave, valor, versao, teto):', '    # grava e, se passar do teto, descarta a entrada mais antiga (ordem de inserção)', '    pass', ''].join('\n');
  var testes = [
    'def test_resumo_descarta_warmup_e_deriva_do_bruto():',
    '    dados = [900.0, 800.0] + [float(i) for i in range(1, 101)]',
    '    r = resumir(dados, 2)', '    assert r["n"] == 100 and r["p50"] == 50.5 and 95 < r["p95"] < 96.5', '', '',
    'def test_cauda_pior_que_a_media():',
    '    dados = [10.0] * 95 + [500.0] * 5', '    r = resumir(dados, 0)', '    assert r["p50"] == 10.0 and r["p95"] > 100', '', '',
    'def test_joelho_da_curva():',
    '    pts = [(10, 10), (20, 20), (30, 29), (40, 29.5), (50, 29.5)]', '    assert joelho(pts) == 30', '    assert joelho([(10, 10), (20, 20), (30, 30)]) == 30', '', '',
    'def test_cache_so_vale_na_policy_vigente():',
    '    c = {}', '    guardar(c, "k", "aceitar", 1, 10)', '    assert buscar(c, "k", 1) == ("aceitar", True)', '    assert buscar(c, "k", 2) == (None, False)', '    assert buscar(c, "x", 1) == (None, False)', '', '',
    'def test_teto_impede_crescimento_sem_limite():',
    '    c = {}', '    for i in range(5):', '        guardar(c, "k%d" % i, i, 1, 3)', '    assert len(c) == 3 and "k0" not in c and "k4" in c', ''].join('\n');
  var solucao = [
    'import statistics', '', '',
    'def resumir(amostras, warmup):', '    dados = list(amostras[warmup:])', '    p95 = statistics.quantiles(dados, n=100, method="exclusive")[94]',
    '    return {"p50": statistics.median(dados), "p95": p95, "n": len(dados)}', '', '',
    'def joelho(pontos):', '    for (c, v), (_, prox) in zip(pontos, pontos[1:]):', '        if prox < v * 1.05:', '            return c', '    return pontos[-1][0]', '', '',
    'def buscar(cache, chave, versao):', '    e = cache.get(chave)', '    if e is not None and e[1] == versao:', '        return (e[0], True)', '    return (None, False)', '', '',
    'def guardar(cache, chave, valor, versao, teto):', '    cache.pop(chave, None)', '    cache[chave] = (valor, versao)', '    while len(cache) > teto:', '        del cache[next(iter(cache))]', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b11',
    titulo: 'Complexidade, estruturas de dados, performance e custo',
    minutos: 40,
    resumo: 'Estime pelo padrão de acesso, escreva a hipótese antes do cronômetro e meça um workload real: o joelho da curva, não um número isolado, define a capacidade.',
    objetivo: 'Escolher representação pela operação dominante, ler latência, throughput, utilização e saturação juntas e ligar custo unitário a outcome.',
    revisao: [
      { id: 'm02ab11-lista', pergunta: 'Alguém troca uma lista de 10 códigos por set "porque O(1) vence O(n)", num caminho que roda uma vez por requisição. Qual a crítica?',
        opcoes: [
          opc('a', 'Sem workload escrito (operação dominante, frequência, n) é palpite: com n pequeno a constante e a localidade podem ganhar, e o set cobra memória e construção.', true, 'complexidade descreve crescimento, não segundos; a estimativa termina em hipótese testável.'),
          opc('b', 'Nenhuma: O(1) sempre vence.', false, 'ignora constante e custo de construção.'),
          opc('c', 'Listas sempre ganham.', false, 'para n grande e consulta repetida, o set vence.')] },
      { id: 'm02ab11-quatro', pergunta: 'Média ótima, p95 cinco vezes maior e fila crescendo. Leitura honesta?',
        opcoes: [
          opc('a', 'Há saturação: a média esconde a cauda; leia latência, throughput, utilização e saturação juntas (método USE).', true, 'utilização alta não é saturação; saturação é trabalho enfileirado.'),
          opc('b', 'Está saudável: a média está boa.', false, 'a cauda é o que o usuário sente.'),
          opc('c', 'Compre mais CPU.', false, 'se o problema é fila, recurso sem investigar não resolve.')] },
      { id: 'm02ab11-hipotese', pergunta: 'O que compõe uma hipótese de performance antes do cronômetro?',
        opcoes: [
          opc('a', 'Mudança, caminho, efeito esperado e oráculo que decide.', true, 'medir sem hipótese produz número à procura de história.'),
          opc('b', 'Só o número desejado.', false, 'falta caminho e oráculo.'),
          opc('c', 'Rodar e ver.', false, 'qualquer variação vira melhora ou regressão conforme o humor.')] },
      { id: 'm02ab11-workload', pergunta: 'O que o experimento local não prova e o que o torna reproduzível?',
        opcoes: [
          opc('a', 'Não prova produção nem threshold universal ou ranking entre máquinas; fica reproduzível com warm-up descartado e registrado, amostras brutas com seed, config e digest, e limitações declaradas.', true, 'p50 e p95 derivam do bruto persistido, nunca de anotação.'),
          opc('b', 'Prova o p95 de produção.', false, 'o workload local não mede rede nem concorrência externa.'),
          opc('c', 'É reproduzível se publicar só a média.', false, 'agregado sem bruto não é recalculável.')] },
      { id: 'm02ab11-custo', pergunta: 'Como o cache e o custo unitário devem ser validados?',
        opcoes: [
          opc('a', 'Cache: taxa de acerto no workload real, invalidação amarrada à versão da policy e teto de memória; custo unitário só vale ligado a outcome.', true, 'cache sem invalidação congela decisão; custo sem outcome é vaidade.'),
          opc('b', 'Cache sem teto, porque memória é barata.', false, 'cresce sem limite.'),
          opc('c', 'Custo menor basta.', false, 'a qualidade pode cair junto.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O SLO diz "estamos dentro do alvo". Este bloco diz qual representação sustenta o alvo, a partir de que carga ela satura e quanto custa cada avaliação. "Complexidade menor sempre vence" e "a latência caiu, logo melhorou" são meia conclusão: um O(1) com constante alta e cache frio perde para um O(n) curto no volume real, e média menor com cauda pior quebra o usuário que o SLO protege.</p>' +
          '<h3>Complexidade pelo padrão de acesso</h3>' +
          '<p>Complexidade descreve como o custo cresce com a entrada (tempo e memória em função de n, não segundos de uma máquina). Estimar antes de medir é responder: qual operação domina (procura por chave, varredura ordenada, pertinência, inserção), quantas vezes roda por avaliação e quão grande é n. A tabela de complexidades do CPython é referência de implementação, não lei: pertinência em <code>set</code> custa O(1) médio, em lista O(n); colisão de hash degradada, lista curta com localidade e ordenação mantida à força são os casos em que a notação engana.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def pertinencia_lista(codigos, alvo):\n    # O(n) por consulta: varre até encontrar; barato para poucos itens\n    return alvo in codigos\n\ndef pertinencia_conjunto(codigos, alvo):\n    # O(1) médio por consulta: hash direto; paga memória e construção\n    return alvo in set(codigos)' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Padrão de acesso dominante</th><th>Representação candidata</th><th>Custo a estimar</th></tr></thead><tbody>' +
          '<tr><td>procura por chave e pertinência repetida</td><td>dict / set</td><td>O(1) médio; memória do índice e pior caso de colisão</td></tr>' +
          '<tr><td>varredura ordenada e intervalo</td><td>sequência ordenada</td><td>O(log n) na busca mais custo de manter a ordem na escrita</td></tr>' +
          '<tr><td>ordem de chegada com descarte nas pontas</td><td>fila dedicada</td><td>O(1) nas pontas; varredura no meio continua O(n)</td></tr>' +
          '<tr><td>poucos itens e workload pequeno</td><td>lista simples</td><td>O(n) com constante mínima; trocar só com hipótese e medida</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p>A troca que mais mente é a feita sem workload: trocar lista por índice "porque O(1) vence" num caminho que roda poucas vezes adiciona memória e construção sem mover nenhuma métrica do SLO.</p>' +
          '<h3>Hipótese, antes de medir</h3>' +
          '<p><strong>Hipótese</strong> é a frase escrita antes do cronômetro: qual mudança, em qual caminho, com qual efeito esperado e qual oráculo decide. Quatro medidas andam juntas: <strong>latência</strong> (p50 para o típico, p95 para a cauda), <strong>throughput</strong> (avaliações concluídas por segundo), <strong>utilização</strong> (fração do recurso ocupada) e <strong>saturação</strong> (trabalho enfileirado à espera).</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Medida</th><th>Responde</th><th>Leitura errada comum</th></tr></thead><tbody>' +
          '<tr><td>latência p50/p95</td><td>espera do típico e da cauda</td><td>média baixa "prova" saúde com p95 estourando o SLO</td></tr>' +
          '<tr><td>throughput</td><td>conclusões por segundo</td><td>vazão alta com erro alto contada como capacidade</td></tr>' +
          '<tr><td>utilização</td><td>fração do recurso ocupada</td><td>ocupação alta pede mais recurso sem checar a fila</td></tr>' +
          '<tr><td>saturação</td><td>trabalho esperando em fila</td><td>fila crescente tratada como pico passageiro</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: '<mark>Operação dominante</mark>, frequência e n escolhem a representação; a <mark>hipótese</mark> vem antes do cronômetro.' }
      ] },

      { rotulo: 'Medir, capacidade e custo', blocos: [
        { tipo: 'texto', html:
          '<h3>Workload, warm-up, amostras e limitações</h3>' +
          '<p><strong>Workload</strong> é a carga que representa o uso real: avaliações request→decision sobre o corpus local, com mistura de vereditos e reason codes próxima da operação, não microbenchmark de função isolada. <strong>Warm-up</strong> são as execuções iniciais descartadas (imports, cache frio, alocação). O experimento declara o que não prova: workload local, sem rede nem concorrência externa, compara representações e localiza a saturação do recorte, sem threshold universal ("p95 abaixo de X ms é bom") nem ranking entre máquinas.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def resumir(amostras):\n    # durações brutas em segundos, warm-up já removido;\n    # p50/p95 derivam do bruto persistido, nunca de anotação\n    import statistics\n    p50 = statistics.median(amostras)\n    (p25, p75, p95) = statistics.quantiles(amostras, n=100, method="exclusive")[24::25]\n    return {"p50": p50, "p95": p95, "n": len(amostras)}' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Elemento</th><th>Mecanismo</th><th>O que invalida</th></tr></thead><tbody>' +
          '<tr><td>workload representativo</td><td>avaliações completas sobre o corpus com mistura declarada</td><td>microbenchmark tratado como custo da avaliação</td></tr>' +
          '<tr><td>warm-up descartado</td><td>primeiras execuções fora da estatística, quantidade registrada</td><td>misturar largada fria e quente</td></tr>' +
          '<tr><td>amostras brutas</td><td>durações e resultados persistidos com seed, config e digest</td><td>publicar só o agregado</td></tr>' +
          '<tr><td>limitações declaradas</td><td>hardware, corpus, janela e ausência de rede no registro</td><td>threshold universal ou ranking entre máquinas</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Capacidade, cache e custo unitário</h3>' +
          '<p><strong>Capacidade</strong> é a carga máxima útil: o <em>joelho</em> da curva, ponto da varredura em que o throughput para de crescer e a fila acumula. Antes dele, mais carga vira mais vazão; depois, vira espera. <strong>Backpressure</strong> é a resposta honesta após o joelho. <strong>Cache</strong> troca custo repetido por memória e staleness; as três perguntas: taxa de acerto no workload real, custo da invalidação quando a policy muda e teto de memória. Cache sem invalidação declarada vira decisão congelada.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def buscar_com_cache(chave, versao_policy, cache):\n    # acerto só vale na policy vigente; teto impede crescimento;\n    # invalidação é troca de versão, nunca varredura manual\n    entrada = cache.get(chave)\n    if entrada is not None and entrada["policy"] == versao_policy:\n        return (entrada["valor"], True)\n    return (None, False)' },
        { tipo: 'callout', tom: 'info', titulo: 'Limite', html: '<p>Capacidade medida no recorte local vale para o recorte local: outro hardware, corpus ou tráfego real deslocam o joelho. Custo unitário sem outcome é vaidade: volume ou atividade nunca vira resultado sem cadeia causal. Valores de carga, acerto e custo são exemplo variável. Código do laboratório: <code>application/capacidade.py</code>.</p>' },
        { tipo: 'texto', html: '<p><strong>Fontes</strong> (revalidar por release): CPython Time Complexity (documentação comunitária; estimativa, não garantia); Python 3.14 (Data Structures, <code>time.perf_counter</code>, <code>timeit</code>, <code>statistics.quantiles</code>, <code>functools.lru_cache</code>); Brendan Gregg, USE Method (utilização, saturação e erros por recurso).</p>' },
        { tipo: 'rode', id: 'b11-rode', titulo: 'Utilização, fila e cauda (modelo M/M/1)', obrigatorio: false,
          enunciado: 'Modelo simplificado, não medição: latência média W = S / (1 − ρ), com tempo de serviço S = 10 ms.',
          prefixo: '$', entrada: 'W = S / (1 - rho)  # modelo', unidade: 'ms', terminalTitulo: 'exemplo (modelo, não medição)',
          prever: { pergunta: 'Subir a utilização de 70% para 95% multiplica a latência média por quanto, aproximadamente?', opcoes: [
            { id: 'a', texto: 'Cerca de 1,4 vez (proporcional).', correta: false, porque: 'a curva não é linear perto da saturação.' },
            { id: 'b', texto: 'Cerca de 6 vezes: de 33 ms para 200 ms.', correta: true, porque: '10/(1-0,7) ≈ 33 ms; 10/(1-0,95) = 200 ms.' }] },
          etapas: [
            { id: 'a', nome: 'ρ = 70%', descricao: '', tom: 'dns', ms: 33, linhas: [L('out', 'W = 10 / 0.30 = 33.3 ms   (3.3x o serviço)')] },
            { id: 'b', nome: 'ρ = 95%', descricao: '', tom: 'response', ms: 200, linhas: [L('out', 'W = 10 / 0.05 = 200 ms   (20x o serviço)'), L('hint', 'perto da saturação, pequenos aumentos de carga disparam a cauda; fila crescendo é o sinal')] }
          ] },
        { tipo: 'takeaway', html: 'Capacidade é o <mark>joelho observado</mark>; cache troca recomputação por memória e <mark>staleness</mark>; custo só vale ligado a <mark>outcome</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b11-python', titulo: 'Resumo de amostras, joelho e cache versionado', obrigatorio: false,
          enunciado: 'Implemente <code>resumir</code> (descarta warm-up, p50 e p95 do bruto), <code>joelho</code>, e o cache versionado com teto (<code>buscar</code> e <code>guardar</code>).',
          codigo: codigo, testes: testes,
          dica: 'p95: <code>statistics.quantiles(dados, n=100, method="exclusive")[94]</code>. Joelho: compare <code>prox &lt; v * 1.05</code>. Cache: <code>del cache[next(iter(cache))]</code> remove o mais antigo.',
          solucao: solucao, callout: 'Estatística do bruto, joelho localizado e cache com invalidação por versão e teto.' },
        { tipo: 'cenario', id: 'b11-cenario', titulo: 'A otimização que não moveu o SLO', obrigatorio: false,
          enunciado: 'Um PR troca lista por índice e diz que "otimizou". O SLO não mudou.',
          inicio: 'i',
          nos: { i: { texto: 'O que você pede?', opcoes: [
            { texto: 'Aprovar: O(1) vence O(n).', vai: 'f-ruim', tom: 'ruim', consequencia: 'memória e construção a mais, sem mover métrica.' },
            { texto: 'A hipótese: caminho dominante, frequência por avaliação, n esperado e oráculo.', vai: 'n2', tom: 'ok', consequencia: 'a hipótese revela que o caminho roda uma vez por avaliação.' }] },
            n2: { texto: 'Como medir?', opcoes: [
              { texto: 'Workload real com warm-up descartado e amostras brutas com seed e digest; p50 e p95 do bruto.', vai: 'f-bom', tom: 'ok', consequencia: 'a evidência é reproduzível e a troca é rejeitada ou ajustada com base nela.' },
              { texto: 'Um microbenchmark da função isolada.', vai: 'f-micro', tom: 'ruim', consequencia: 'mede a função, não a avaliação.' }] } },
          finais: { 'f-bom': { bom: true, texto: 'Decisão baseada em amostra própria e oráculo declarado.' }, 'f-ruim': { bom: false, texto: 'Complexidade a mais sem efeito no SLO.' }, 'f-micro': { bom: false, texto: 'Número isolado que não representa o workload.' } },
          callout: 'Você pediu hipótese e workload antes de aceitar a troca.' },
        { tipo: 'escolha', id: 'b11-esc1', titulo: 'Confira: vazão sobe, depois a fila explode', pergunta: 'A vazão sobe e depois a fila explode. Qual a hipótese?',
          opcoes: [
            { id: 'a', texto: 'A operação passou do joelho de capacidade; opere abaixo dele com margem e backpressure explícito.', correta: true, porque: 'a varredura crescente localiza o ponto de dobra.' },
            { id: 'b', texto: 'O hardware é ruim.', correta: false, porque: 'o comportamento é de saturação, não de hardware específico.' }] },
        { tipo: 'escolha', id: 'b11-esc2', titulo: 'Confira: cache que congela decisão', pergunta: 'O cache acelera, mas uma policy revogada continua valendo. Correção?',
          opcoes: [
            { id: 'a', texto: 'Amarrar a validade à versão da policy, com teto de memória.', correta: true, porque: 'invalidação é troca de versão, não varredura manual.' },
            { id: 'b', texto: 'Aumentar o TTL.', correta: false, porque: 'piora a staleness.' }] },
        { tipo: 'takeaway', html: 'Evidência de performance é <mark>amostra bruta</mark> com seed e digest, não o número impresso.' }
      ] }
    ]
  });
})();
