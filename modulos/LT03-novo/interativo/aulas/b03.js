/* LT03 · Bloco 3: Probes, recursos, scheduling, disrupção e autoscaling. Fonte: LT03.html#b03. Números são exemplo variável, não evidência. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoQos = [
    'def classificar_qos(pedido, teto):',
    '    # pedido e teto: {"cpu": bool, "memoria": bool}',
    '    # garantida: cpu e memoria declaradas nos dois; intermediaria: ha algum pedido;',
    '    # oportunista: nada declarado',
    '    return "oportunista"', '', '',
    'def pedido_por_medicao(medicao, margem):',
    '    # request recalculado por medida mais margem, nunca copiado de outro servico',
    '    return medicao', ''].join('\n');
  var solucaoQos = [
    'def classificar_qos(pedido, teto):',
    '    chaves = ("cpu", "memoria")',
    '    iguais = sum(1 for c in chaves if pedido.get(c) and teto.get(c))',
    '    pedidos = sum(1 for c in chaves if pedido.get(c))',
    '    if iguais == 2:',
    '        return "garantida"',
    '    if pedidos >= 1:',
    '        return "intermediaria"',
    '    return "oportunista"', '', '',
    'def pedido_por_medicao(medicao, margem):',
    '    return medicao * (1.0 + margem)', ''].join('\n');
  var testesQos = [
    'def test_garantida_quando_pedido_e_teto_cobrem_cpu_e_memoria():',
    '    p = {"cpu": True, "memoria": True}',
    '    assert classificar_qos(p, p) == "garantida"', '', '',
    'def test_intermediaria_com_pedido_parcial():',
    '    assert classificar_qos({"cpu": True}, {"cpu": True}) == "intermediaria"', '', '',
    'def test_intermediaria_so_com_pedido_sem_teto():',
    '    assert classificar_qos({"cpu": True, "memoria": True}, {}) == "intermediaria"', '', '',
    'def test_oportunista_sem_nada():',
    '    assert classificar_qos({}, {}) == "oportunista"', '', '',
    'def test_pedido_por_medicao_com_margem():',
    '    assert abs(pedido_por_medicao(200.0, 0.25) - 250.0) < 1e-9', '', '',
    'def test_margem_zero_mantem_a_medida():',
    '    assert pedido_por_medicao(120.0, 0.0) == 120.0', ''].join('\n');

  var codigoHpa = [
    'import math', '', '',
    'def replicas_desejadas(atuais, metrica, alvo):',
    '    # teto de atuais * metrica / alvo; entrada invalida (atuais < 1 ou alvo <= 0) devolve 1',
    '    return 1', '', '',
    'def estabilizar(desejadas, minimo, maximo):',
    '    # prende a saida do loop na faixa contratada',
    '    return desejadas', '', '',
    'def disrupcao_permitida(replicas, removendo, minimo_pdb):',
    '    # a sobra apos a remocao respeita o minimo do PDB',
    '    return True', '', '',
    'def escala_permitida(upstream_saturado):',
    '    # upstream saturado nega escala',
    '    return True', ''].join('\n');
  var solucaoHpa = [
    'import math', '', '',
    'def replicas_desejadas(atuais, metrica, alvo):',
    '    if atuais < 1 or alvo <= 0.0:',
    '        return 1',
    '    return max(1, math.ceil(atuais * metrica / alvo))', '', '',
    'def estabilizar(desejadas, minimo, maximo):',
    '    return min(max(desejadas, minimo), maximo)', '', '',
    'def disrupcao_permitida(replicas, removendo, minimo_pdb):',
    '    return replicas - removendo >= minimo_pdb', '', '',
    'def escala_permitida(upstream_saturado):',
    '    return not upstream_saturado', ''].join('\n');
  var testesHpa = [
    'def test_hpa_sobe_pelo_teto_da_razao():',
    '    assert replicas_desejadas(4, 90.0, 60.0) == 6', '', '',
    'def test_hpa_desce_quando_metrica_cai():',
    '    assert replicas_desejadas(4, 30.0, 60.0) == 2', '', '',
    'def test_hpa_arredonda_para_cima():',
    '    assert replicas_desejadas(3, 70.0, 60.0) == 4', '', '',
    'def test_hpa_entrada_invalida_devolve_um():',
    '    assert replicas_desejadas(0, 90.0, 60.0) == 1 and replicas_desejadas(4, 90.0, 0.0) == 1', '', '',
    'def test_estabilizar_prende_na_faixa():',
    '    assert estabilizar(10, 2, 8) == 8 and estabilizar(1, 2, 8) == 2 and estabilizar(5, 2, 8) == 5', '', '',
    'def test_pdb_permite_com_sobra():',
    '    assert disrupcao_permitida(3, 1, 2)', '', '',
    'def test_pdb_impossivel_e_negado():',
    '    assert not disrupcao_permitida(3, 2, 2)', '', '',
    'def test_upstream_saturado_nega_escala():',
    '    assert not escala_permitida(True) and escala_permitida(False)', ''].join('\n');

  TrilhaAula.registrar({
    id: 'lt03-b3',
    titulo: 'Probes, recursos, scheduling, disrupção e autoscaling',
    minutos: 45,
    resumo: 'Cada campo do manifesto contrata uma reação. Número copiado é hipótese; capacidade é o que se mede, e o autoscaling nunca corrige um gargalo que está fora do serviço.',
    objetivo: 'Prescrever a probe pela reação desejada, encadear preStop, grace e drenagem, recalcular request por medição, espalhar réplicas e conter disrupção com PDB, e negar a escala contra dependência saturada.',
    revisao: [
      { id: 'lt03b3-live', pergunta: 'O serviço reinicia em loop sempre que o banco fica lento, com o processo saudável. Qual o conserto?',
        opcoes: [
          opc('a', 'Tirar a dependência externa da liveness e deixá-la na readiness', true, 'liveness reinicia, e reiniciar não conserta o banco. Dependência externa é motivo para sair do tráfego, não para reiniciar.'),
          opc('b', 'Aumentar o limit de memória', false, 'não há OOMKill nesse sintoma.'),
          opc('c', 'Aumentar o máximo do HPA', false, 'mais réplicas contra um banco lento pioram a pressão.')] },
      { id: 'lt03b3-upstream', pergunta: 'O HPA está no teto de maxReplicas e a latência continua alta porque o banco está saturado. Subir maxReplicas ajuda?',
        opcoes: [
          opc('a', 'Provavelmente não: mais Pods geram mais conexões contra o upstream saturado e podem piorar', true, 'autoscaling não amplifica dependência saturada; limite o gargalo (pool, backpressure, rate limit) antes de réplicas.'),
          opc('b', 'Sim, sempre', false, 'o gargalo está fora do serviço.'),
          opc('c', 'Sim, se reduzir o request de CPU', false, 'request mexe no agendamento, não no banco.')] },
      { id: 'lt03b3-throttle', pergunta: 'Cauda de latência longa, CPU presa no teto sob carga, nenhum container morto. Diagnóstico?',
        opcoes: [
          opc('a', 'Throttling por limit apertado sem medição; medir o steady state e recalcular o pedido com margem', true, 'CPU além do limite é estrangulada: alonga a cauda sem matar. Memória além do limite é que causa OOMKill.'),
          opc('b', 'OOMKill, pois a memória estourou', false, 'OOMKill mataria o container.'),
          opc('c', 'Faltam réplicas, escalar sempre resolve', false, 'contenção confundida com falta de réplicas.')] },
      { id: 'lt03b3-pdb', pergunta: 'Um drain de nó fica travado. Com 3 réplicas e PDB de mínimo 3, o que acontece?',
        opcoes: [
          opc('a', 'A disrupção voluntária é negada: o mínimo é maior que a sobra, e o contrato trava upgrade e drain', true, 'revise o mínimo contra a capacidade real; o PDB só cobre disrupção voluntária.'),
          opc('b', 'O PDB protege também contra crash e delete direto', false, 'não protege contra crash, delete direto nem falta de capacidade.'),
          opc('c', 'O drain ignora o PDB', false, 'o PDB é exatamente o limite do drain.')] },
      { id: 'lt03b3-hpa', pergunta: 'Qual regra o HPA aplica e por que ele precisa de requests?',
        opcoes: [
          opc('a', 'Teto de atuais x métrica / alvo, preso entre mínimo e máximo; sem request não há denominador da utilização', true, 'é um control loop atrasado: leva tempo de imagem, inicialização e aquecimento.'),
          opc('b', 'Cria capacidade instantânea ao detectar carga', false, 'não é instantâneo.'),
          opc('c', 'Corrige dependência saturada', false, 'jamais corrige o upstream.')] }
    ],
    abas: [
      { rotulo: 'Probes e término', blocos: [
        { tipo: 'texto', html:
          '<p><strong>Probe</strong> é a pergunta periódica do runtime ao container, e cada tipo contrata exatamente uma reação. Uma nunca substitui a outra.</p>' +
          '<ul><li><strong>Startup</strong> (&ldquo;terminaste de inicializar?&rdquo;): enquanto falha, suspende as demais. Protege subida lenta contra veredito precoce.</li>' +
          '<li><strong>Readiness</strong> (&ldquo;aceitas tráfego?&rdquo;): falha remove o Pod dos endpoints sem matar o processo.</li>' +
          '<li><strong>Liveness</strong> (&ldquo;estás vivo ou travado?&rdquo;): falha reinicia o container; é o último recurso contra deadlock interno.</li></ul>' +
          '<p>Dois defeitos decidem o diagnóstico. Liveness que consulta dependência externa converte lentidão alheia em suicídio próprio, o mais caro do bloco. Readiness que chama dependência crítica tira do ar quem está saudável por culpa do vizinho. <strong>Dependência externa pertence à readiness, nunca ao reinício.</strong> E probe que custa mais que o handler é monitoramento que virou carga.</p>' },
        { tipo: 'complete', id: 'b3-complete-reacao', titulo: 'Reação contratada de cada probe', obrigatorio: false,
          enunciado: 'Complete o mapa de <code>lab/sinais_escala.py</code> com a reação de cada probe.',
          linguagem: 'python',
          partes: [
            'REACOES = {\n    "inicializacao": "',
            { lacuna: 'ini', opcoes: ['suspende-as-demais', 'remove-dos-endpoints', 'reinicia-container'], correta: 'suspende-as-demais' },
            '",\n    "prontidao": "',
            { lacuna: 'pro', opcoes: ['reinicia-container', 'remove-dos-endpoints', 'suspende-as-demais'], correta: 'remove-dos-endpoints' },
            '",\n    "vivacidade": "',
            { lacuna: 'viv', opcoes: ['remove-dos-endpoints', 'suspende-as-demais', 'reinicia-container'], correta: 'reinicia-container' },
            '",\n}'],
          explicacao: 'Startup suspende, readiness drena tráfego, liveness reinicia. Tipo desconhecido é defeito (<code>tipo-desconhecido</code>).' },
        { tipo: 'texto', html:
          '<h3>preStop, grace e draining</h3>' +
          '<p>O <strong>preStop</strong> é o gancho executado antes do SIGTERM: avisa a dependência, fecha a entrada, inicia a drenagem. O <strong>grace period</strong> é o prazo entre SIGTERM e SIGKILL (ponte com o B01). <strong>Draining</strong> é retirar os endpoints antes de tocar no trabalho: nenhuma requisição nova após o sinal, e o que está em curso conclui ou cancela no prazo. Pod que termina sem request truncado é pod que drenou primeiro.</p>' },
        { tipo: 'ordene', id: 'b3-ordene-termino', titulo: 'Ordene o término sem truncar requisição', obrigatorio: false,
          enunciado: 'O Pod vai sair. Ordene do gancho inicial até a saída.',
          itens: [
            { id: 'sigterm', texto: 'SIGTERM ao PID 1 e início do grace' },
            { id: 'saida', texto: 'Sair com o exit code antes do SIGKILL' },
            { id: 'prestop', texto: 'preStop: avisar a dependência e fechar a entrada' },
            { id: 'drenar', texto: 'Drenar os endpoints e concluir ou cancelar o que está em curso' }],
          solucao: ['prestop', 'sigterm', 'drenar', 'saida'],
          dica: 'O preStop roda antes do SIGTERM; a saída é sempre o último passo.',
          tutorDepois: 'O grace é o prazo desse caminho inteiro; trabalho incancelável o desperdiça.' },
        { tipo: 'takeaway', html: 'Startup <mark>suspende</mark>, readiness <mark>drena</mark>, liveness <mark>reinicia</mark>; liveness jamais consulta <mark>dependência externa</mark>.' }
      ] },

      { rotulo: 'Recursos e QoS', blocos: [
        { tipo: 'texto', html:
          '<p><strong>Request</strong> é a reserva que o agendador usa para escolher o nó; <strong>limit</strong> é o teto imposto na execução via cgroups. CPU além do limite é <strong>throttling</strong>: estrangulamento que alonga a cauda sem matar. Memória além do limite é <strong>OOMKill</strong>: o container morre. Ephemeral storage segue a lógica, com despejo em vez de morte elegante.</p>' +
          '<p>Valor sem medição é hipótese: o pedido nasce da medição do steady state mais margem, nunca de outro serviço. A combinação define a <strong>QoS</strong>: garantida (pedido e teto coincidem, última a sofrer sob pressão), intermediária (só parte garantida) e oportunista (nada declarado, primeira a morrer). Request ausente é pior que limite copiado: sem pedido, o HPA perde o denominador da porcentagem-alvo.</p>' },
        { tipo: 'python', id: 'b3-python-qos', titulo: 'QoS e pedido por medição', obrigatorio: false,
          enunciado: 'Implemente <code>classificar_qos(pedido, teto)</code> e <code>pedido_por_medicao(medicao, margem)</code> de <code>lab/sinais_escala.py</code>. Os dicts guardam, por recurso, se foi declarado.',
          codigo: codigoQos, testes: testesQos,
          dica: 'Conte quantos recursos (cpu, memoria) têm pedido E teto; dois, garantida. Com ao menos um pedido, intermediária. O pedido é <code>medicao * (1 + margem)</code>.',
          solucao: solucaoQos,
          tutorDepois: 'Pedido sem teto já sai de oportunista: o agendador passa a ter uma reserva.',
          callout: 'QoS sai da comparação entre pedido e teto, e o pedido nasce da medição.' },
        { tipo: 'callout', tom: 'info', titulo: 'Fora do que a folha local prova', html:
          '<p>Throttle, OOMKill e a curva carga contra réplicas com p95 pertencem à trilha externa com cluster, e ficam <strong>BLOCKED</strong> com registro onde ausentes. O valor numérico de um pedido só vira decisão quando medido.</p>' },
        { tipo: 'escolha', id: 'b3-escolha-throttle', titulo: 'Aquecimento: cauda longa sem morte', obrigatorio: false,
          pergunta: 'A cauda de latência cresce, a CPU está presa no limit e nenhum container reinicia. O que é?',
          opcoes: [
            opc('a', 'Throttling.', true, 'o limite de CPU estrangula sem matar; recalcule o pedido por medição.'),
            opc('b', 'OOMKill.', false, 'OOMKill mata o container.'),
            opc('c', 'Liveness com falso positivo.', false, 'liveness reiniciaria o container.')] },
        { tipo: 'takeaway', html: 'Request <mark>agenda</mark>, limit <mark>contém</mark>: throttle alonga a cauda, <mark>OOMKill</mark> mata, e o pedido vem de <mark>medição</mark> com margem.' }
      ] },

      { rotulo: 'Spread, PDB e HPA', blocos: [
        { tipo: 'texto', html:
          '<p><strong>Scheduling</strong> escolhe o nó por recursos, afinidade e restrições: affinity e spread espalham réplicas entre nós e zonas; <strong>taints</strong> repelem o que não foi tolerado. Réplicas que cabem num nó só não são alta disponibilidade. O <strong>PDB</strong> (PodDisruptionBudget) limita disrupções voluntárias (drain, upgrade) ao mínimo contratado; não protege contra crash, delete direto nem falta de capacidade.</p>' +
          '<p>O <strong>HPA</strong> é um control loop atrasado: lê a métrica, compara ao alvo, ajusta réplicas e espera imagem, inicialização e aquecimento. A regra é <code>ceil(atuais x métrica / alvo)</code>, presa entre mínimo e máximo; dentro da faixa não há thrash. Não cria capacidade instantânea, oscila sem estabilização e jamais corrige dependência saturada: escalar contra upstream esgotado multiplica a pressão sobre o gargalo, então a escala é negada. Capacidade mínima, queue age e cold start entram no desenho; scale-to-zero troca custo zero parado pela primeira requisição fria.</p>' },
        { tipo: 'python', id: 'b3-python-hpa', titulo: 'A regra do HPA e as travas', obrigatorio: false,
          enunciado: 'Implemente a regra do HPA, a estabilização, a permissão de disrupção do PDB e a trava contra upstream saturado (recorte de <code>lab/sinais_escala.py</code>).',
          codigo: codigoHpa, testes: testesHpa,
          dica: '<code>math.ceil(atuais * metrica / alvo)</code>, devolvendo 1 se <code>atuais &lt; 1</code> ou <code>alvo &lt;= 0</code>. Estabilizar é <code>min(max(d, minimo), maximo)</code>. PDB: <code>replicas - removendo &gt;= minimo_pdb</code>.',
          solucao: solucaoHpa,
          tutorDepois: 'As quatro funções são travas independentes: a escala emitida passa por todas.',
          callout: 'O loop calcula, a faixa prende, o PDB contém e o gargalo saturado nega a escala.' },
        { tipo: 'cenario', id: 'b3-cenario', titulo: 'A fila cresce e o banco está saturado', obrigatorio: false,
          enunciado: 'O HPA quer subir réplicas contra uma fila crescente cujo consumidor é um banco saturado.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O HPA calcula 12 réplicas (exemplo) e o banco já está no limite de conexões. Emitir a escala?', opcoes: [
              { texto: 'Sim: mais réplicas drenam a fila mais rápido.', vai: 'f-pior', tom: 'ruim', consequencia: 'mais Pods abrem mais conexões contra o banco saturado e pioram o gargalo.' },
              { texto: 'Não: o upstream saturado nega a escala; limitar o gargalo antes.', vai: 'limite', tom: 'ok', consequencia: 'o loop atrasado não cria capacidade que o banco não tem.' }] },
            limite: { texto: 'O que entra no lugar?', opcoes: [
              { texto: 'Limite contra o gargalo (pool, backpressure, rate limit) e saída do loop presa à faixa.', vai: 'f-bom', tom: 'ok', consequencia: 'a pressão sobre o banco fica contida e o HPA não oscila.' },
              { texto: 'Subir o maxReplicas para o HPA ter folga.', vai: 'f-max', tom: 'ruim', consequencia: 'a folga aumenta o potencial de dano ao upstream.' }] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Escala negada contra o gargalo, limite no upstream e saída presa à faixa.' },
            'f-pior': { bom: false, texto: 'As réplicas subiram e o gargalo piorou: o incidente cresceu.' },
            'f-max': { bom: false, texto: 'O teto maior só aumentou a pressão possível sobre o banco.' }
          },
          callout: 'Você negou a escala contra o gargalo e prendeu a saída do loop à faixa.' },
        { tipo: 'takeaway', html: 'O <mark>HPA</mark> é um loop atrasado preso à <mark>faixa</mark>; contra <mark>upstream saturado</mark> a escala é negada, não emitida.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'transcript', id: 'b3-transcript', titulo: 'Ache o diagnóstico que não se sustenta', obrigatorio: false, terminalTitulo: 'incidente de capacidade (exemplo)',
          enunciado: 'O agente investiga restarts do serviço. Uma conclusão não é sustentada pelo que as ferramentas mostram. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'O serviço reinicia toda vez que o banco lentifica. Investigue.' },
            { quem: 'ferramenta', texto: '$ describe pod api (trecho, exemplo)\nLiveness: GET /saude/completa  (consulta o banco)\nUltimo estado: Terminated, motivo: Liveness probe failed\nOOMKilled: false' },
            { quem: 'agente', texto: 'A liveness consulta o banco, então a lentidão dele reinicia containers saudáveis.' },
            { quem: 'agente', texto: 'Não é OOMKill: o último estado não indica OOMKilled.' },
            { quem: 'agente', texto: 'O conserto é aumentar o limit de memória, que acaba com os restarts.' }
          ],
          erradas: [4],
          explicacao: { 4: 'a causa é a liveness com dependência externa, não a memória (<code>OOMKilled: false</code>). O conserto é liveness só sobre estado interno e a dependência na readiness.' },
          tutorDepois: 'As duas primeiras conclusões saem das linhas da ferramenta. A terceira propõe um conserto para outra falha.' },
        { tipo: 'escreva', id: 'b3-escreva', titulo: 'Explique o HPA contra o upstream', obrigatorio: false,
          enunciado: 'O HPA sobe réplicas contra fila crescente cujo consumidor é um banco saturado. A escala deve ser emitida? Justifique com o loop, a faixa e o gargalo.',
          placeholder: 'Decisão, mecanismo do loop e o que entra no lugar da escala.',
          rubrica: [
            'Nega a escala: o loop atrasado não cria capacidade instantânea nem corrige a dependência.',
            'Declara que autoscaling não amplifica dependência saturada: mais Pods, mais pressão sobre o banco.',
            'Prescreve limite contra o gargalo e a saída do loop presa à faixa.'],
          modelo: '<p>Não emito a escala. O HPA é um loop atrasado: lê a métrica, ajusta e espera imagem, inicialização e aquecimento, então não cria capacidade instantânea; e o gargalo está no banco, que as réplicas não resolvem. Mais Pods abrem mais conexões e amplificam a pressão sobre o upstream. Ponho limite contra o gargalo (pool, backpressure, rate limit) e prendo a saída do loop na faixa contratada.</p><p><strong>Reprova:</strong> aprovar a escala.</p>' },
        { tipo: 'escolha', id: 'b3-escolha-pdb', titulo: 'Confira: o drain travado',
          pergunta: 'Um drain de nó é negado antes de qualquer mutação, com 3 réplicas e um PDB de mínimo 3. Qual a causa e o conserto?',
          opcoes: [
            opc('a', 'O mínimo do PDB é maior que a sobra após a remoção; revisar o mínimo contra a capacidade real.', true, 'é a disrupção voluntária negada pelo próprio contrato; a função acusa antes da mutação.'),
            opc('b', 'Faltam probes de liveness.', false, 'probes não entram no cálculo do PDB.'),
            opc('c', 'O HPA deve escalar para zero.', false, 'escalar não é o conserto de um mínimo impossível.')] },
        { tipo: 'escolha', id: 'b3-escolha-pedido', titulo: 'Confira: de onde vem o pedido',
          pergunta: 'Um serviço novo copia o request e o limit de outro serviço que funciona bem. Qual a avaliação?',
          opcoes: [
            opc('a', 'Hipótese vestida de decisão: medir o steady state e recalcular o pedido com margem.', true, 'valor sem medição é hipótese; limite copiado é decisão alheia.'),
            opc('b', 'Boa prática, porque o outro serviço já foi validado.', false, 'a carga e o perfil dos serviços diferem.'),
            opc('c', 'Aceitável, desde que a QoS seja oportunista.', false, 'oportunista é a primeira a morrer sob pressão.')] },
        { tipo: 'callout', tom: 'info', titulo: 'Fontes e validade', html:
          '<p>Kubernetes probes, resource management, disruptions e HPA (risco alto, revalidar em até 90 dias). O contrato de <code>lab/sinais_escala.py</code> e qualquer número citado aqui são construção da trilha, medidos na folha B03-L e na trilha externa; são exemplo variável, não evidência.</p>' },
        { tipo: 'takeaway', html: 'Meça o <mark>pedido</mark>, deixe <mark>dependência</mark> fora da liveness e <mark>negue a escala</mark> contra gargalo saturado.' }
      ] }
    ]
  });
})();
