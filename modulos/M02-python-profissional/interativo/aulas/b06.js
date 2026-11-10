/* M02 · Bloco 6: threads, processos, subinterpreters e free-threading. Fonte: M02.html#b6. Python 3.14. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var py = function (l) { return l.join('\n') + '\n'; };

  var codigo = py([
    'def little(lam, w, limite):',
    '    # L = lam * w (em voo); vazao maxima com limite = limite / w',
    '    # devolva (em_voo, vazao_max, estavel); estavel = lam <= vazao_max',
    '    # valores nao positivos -> ValueError("positivos")',
    '    return (0.0, 0.0, False)'
  ]);
  var testes = py([
    'def test_p8_do_checkpoint():',
    '    em_voo, vmax, estavel = little(100, 2, 50)',
    '    assert em_voo == 200',
    '    assert vmax == 25',
    '    assert estavel is False',
    '',
    '',
    'def test_limite_cobre_a_demanda():',
    '    em_voo, vmax, estavel = little(10, 2, 40)',
    '    assert (em_voo, vmax, estavel) == (20, 20, True)',
    '',
    '',
    'def test_borda_igualdade_e_estavel():',
    '    assert little(20, 2, 40)[2] is True',
    '',
    '',
    'def test_valores_invalidos():',
    '    for args in ((0, 1, 1), (1, -1, 1), (1, 1, 0)):',
    '        try:',
    '            little(*args)',
    '        except ValueError as e:',
    '            assert "positivos" in str(e)',
    '        else:',
    '            assert False, "deveria falhar"'
  ]);
  var solucao = py([
    'def little(lam, w, limite):',
    '    if not (lam > 0 and w > 0 and limite > 0):',
    '        raise ValueError("positivos")',
    '    em_voo = lam * w',
    '    vmax = limite / w',
    '    return (em_voo, vmax, lam <= vmax)'
  ]);

  TrilhaAula.registrar({
    id: 'm02-b6',
    titulo: 'Threads, processos, subinterpreters e free-threading',
    minutos: 35,
    resumo: 'O GIL é parte da decisão, não a decisão inteira. Cada executor tem custo próprio, e a capacidade só faz sentido dentro de uma fronteira de sistema e uma janela de medida.',
    objetivo: 'Escolher o executor pela carga e pelo build, detectar o GIL efetivo em runtime e aplicar a Lei de Little sem inventar throughput.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>O GIL é parte da decisão</h3>' +
          '<p>No CPython padrão, o <strong>GIL</strong> impede que várias threads executem bytecode Python ao mesmo tempo no mesmo interpretador, embora I/O e extensões nativas possam liberar o lock. O build <strong>free-threaded</strong> é suportado no Python 3.14, mas isso não torna código automaticamente seguro nem mais rápido: extensões podem reabilitar o GIL, estado compartilhado ainda exige sincronização e o desempenho single-thread precisa ser medido.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'def runtime_capabilities() -> dict[str, object]:\n    is_free_threaded_build = bool(sysconfig.get_config_var("Py_GIL_DISABLED"))\n    is_gil_enabled = sys._is_gil_enabled()  # Python 3.14 / CPython\n    return {\n        "free_threaded_build": is_free_threaded_build,\n        "gil_enabled_now": is_gil_enabled,\n    }' },
        { tipo: 'texto', html:
          '<p>É um probe, não uma recomendação. A primeira chave pergunta ao <em>build</em> se foi compilado com suporte a free-threading; a segunda, se o GIL está ligado <em>nesta execução</em>. Registre as duas dimensões: suporte no build não prova que o GIL permaneça desabilitado. A capability é dado de observação, não feature flag presumida. A anotação <code>dict[str, object]</code> existe porque as chaves são texto e os valores têm tipos diferentes.</p>' +
          '<h3>Quatro executores, quatro custos</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Opção</th><th>Boa candidata quando</th><th>Custo/risco a medir</th></tr></thead><tbody>' +
          '<tr><td><code>asyncio</code></td><td>I/O com API assíncrona e muitas operações aguardando</td><td>Cooperação; código bloqueante ocupa a thread do loop; efeitos precisam de ownership.</td></tr>' +
          '<tr><td><code>ThreadPoolExecutor</code> / <code>to_thread</code></td><td>API síncrona inevitável ou trabalho nativo que libera o GIL</td><td>Thread safety, limite do pool; cancelar o await não interrompe a função.</td></tr>' +
          '<tr><td><code>ProcessPoolExecutor</code></td><td>CPU-bound serializável e suficientemente grande</td><td>Startup, IPC, serialização, memória e regras de entrada do processo.</td></tr>' +
          '<tr><td><code>InterpreterPoolExecutor</code></td><td>Isolamento por interpretador compatível com dados e dependências</td><td>Isolamento de estado, serialização e compatibilidade das extensões.</td></tr>' +
          '<tr><td>Threads em build free-threaded</td><td>Carga e dependências testadas sem GIL efetivo</td><td>Corridas reais, locks, compatibilidade e regressão single-thread.</td></tr></tbody></table>' +
          '<p>Coroutine, Task, thread e processo têm ciclos de vida e custos diferentes: escolha pela forma de execução, isolamento, cancelamento e responsabilidade pelo encerramento.</p>' },
        { tipo: 'takeaway', html: 'Registre <mark>build</mark> e <mark>GIL efetivo</mark> como observação; a escolha do executor é decisão de <mark>workload</mark>, não slogan.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>O simulador do módulo escolhe o executor por carga e build. Percorra as quatro cargas; preveja primeiro a de CPU em Python puro no build padrão.</p>' },
        { tipo: 'rode', id: 'exe-rode', titulo: 'Qual executor para esta carga', obrigatorio: false,
          enunciado: 'Cada etapa é uma carga; o texto reproduz a recomendação do módulo.',
          prefixo: '$', entrada: 'escolher-executor --build padrao', unidade: 'carga', terminalTitulo: 'simulador · executor',
          etapas: [
            { id: 'ioa', nome: 'I/O com API async', descricao: 'muitas esperas baratas', tom: 'dns', ms: 1, linhas: [
              L('out', 'asyncio com TaskGroup e limite de admissão (Semaphore ou fila bounded)'),
              L('hint', 'por quê: muitas esperas baratas na mesma thread; não precisa de outro executor')] },
            { id: 'iob', nome: 'I/O bloqueante sem API async', descricao: 'espera libera o GIL', tom: 'tcp', ms: 1, linhas: [
              L('out', 'asyncio.to_thread / ThreadPoolExecutor com limite de workers'),
              L('hint', 'confirme thread safety; cancelar o await não interrompe a função na thread')] },
            { id: 'cpup', nome: 'CPU em Python puro', descricao: 'GIL ligado', tom: 'tls', ms: 1, linhas: [
              L('out', 'ProcessPoolExecutor (ou InterpreterPoolExecutor se dados e extensões forem compatíveis)'),
              L('hint', 'threads de Python puro disputam o GIL; custos: startup, serialização e memória. No free-threaded, threads podem escalar só depois de testar dependências e travar estado; processos continuam sendo a opção de menor risco')] },
            { id: 'cpun', nome: 'CPU em extensão nativa', descricao: 'libera o GIL', tom: 'request', ms: 1, linhas: [
              L('out', 'ThreadPoolExecutor'),
              L('hint', 'extensões nativas que liberam o GIL rodam em paralelo; confira na documentação da biblioteca que ela realmente libera. Em todos os casos: meça com a carga real antes de decidir')] }
          ],
          prever: { pergunta: 'Python padrão (com GIL), tarefa em Python puro que gasta CPU em cálculos grandes e serializáveis. O que tende a escalar entre núcleos?', opcoes: [
            opc('a', 'ThreadPoolExecutor: mais threads sempre usam mais núcleos.', false, 'threads de Python puro disputam o GIL.'),
            opc('b', 'asyncio.gather com muitas coroutines.', false, 'coroutines rodam numa thread; não paralelizam CPU.'),
            opc('c', 'ProcessPoolExecutor: cada processo tem seu próprio interpretador e GIL.', true, 'o custo é startup, IPC e serialização, por isso o trabalho precisa ser suficientemente grande.'),
            opc('d', 'Nenhum: Python nunca usa mais de um núcleo.', false, 'processos usam.')] },
          tutorDepois: 'Meça. Nenhuma linha dessa tabela é ranking universal.',
          callout: 'Você mapeou carga para executor.' },
        { tipo: 'takeaway', html: '<mark>Processos</mark> para CPU puro com GIL; <mark>threads</mark> para I/O ou extensões que liberam o GIL; <mark>asyncio</mark> quando a API é async.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Capacidade não é um número fora da fronteira</h3>' +
          '<p>A <strong>Lei de Little</strong>, <code>L = λW</code>, vale para sistema estável quando as três medidas usam a mesma fronteira e janela. Num batch fechado de 50 itens, "50 criados" não significa 50 em serviço simultâneo: parte está na fila. Meça separadamente itens admitidos, executando e aguardando; use a lei para verificar coerência, não para inventar throughput. Filas bounded, semáforos e rate limits administram esse número.</p>' +
          '<p>Com o limite (semáforo) <code>c</code>, a vazão máxima é <code>c / W</code>. Se <code>λ</code> excede isso, a fila de admissão cresce sem parar: recuse (backpressure) ou aumente o limite ou reduza W.</p>' },
        { tipo: 'python', id: 'lit-python', titulo: 'Calcule a Lei de Little', obrigatorio: false,
          enunciado: 'Implemente <code>little(lam, w, limite)</code>: devolva <code>(em_voo, vazao_max, estavel)</code>. O caso dos testes é a pergunta P8 do checkpoint (W = 2 s, 100 req/s) com um limite de 50.',
          codigo: codigo, testes: testes,
          dica: '<code>em_voo = lam * w</code>, <code>vmax = limite / w</code> e estável quando <code>lam &lt;= vmax</code>. Valide antes que os três valores são positivos.',
          solucao: solucao,
          tutorDepois: 'Com W = 2 s e 100 req/s há 200 requisições em voo; um limite de 50 só sustenta 25 req/s, então o excedente precisa ser recusado ou enfileirado de forma bounded.',
          callout: 'A capacidade agora é uma conta, com a fronteira explícita.' },
        { tipo: 'texto', html:
          '<h3>O benchmark versionado</h3><ul>' +
          '<li>A mesma transformação determinística é comparada em loop, thread, processo e, quando disponível, interpreter.</li>' +
          '<li>A evidência registra Python/build/GIL, SO, CPU, tamanho do payload, workers, warm-up e várias amostras.</li>' +
          '<li>Mediana e percentis incluem startup e serialização; todas as variantes preservam o mesmo hash de saída.</li>' +
          '<li>O cenário free-threaded opcional remove o lock de um contador compartilhado para revelar perda ou duplicação; lock e message passing são os controles.</li></ul>' +
          '<p><code>compare_cpu_executors()</code> registra hashes de entrada e resultado, capabilities, amostras e mediana, e dá estado e razão às estratégias ausentes. <code>demonstrate_shared_counter()</code> força read, barrier, write, demonstra o lost update e prova as correções por lock e message passing. Não há ranking universal.</p>' },
        { tipo: 'takeaway', html: '<mark>L = λW</mark> só vale com a <mark>mesma fronteira e janela</mark>; fila bounded e semáforo administram o número em voo.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'ft-esc-free', titulo: 'Confira: o build free-threaded',
          pergunta: 'No build free-threaded do Python 3.14, o que muda para o seu código multithread?',
          opcoes: [
            { id: 'a', texto: 'Threads de Python podem rodar em paralelo, mas corridas de dados ficam reais: locks, compatibilidade das extensões e regressão single-thread precisam ser testados.', correta: true, porque: 'remover o GIL tira uma proteção implícita que muito código usava sem perceber.' },
            { id: 'b', texto: 'Nada: o GIL continua obrigatório em todo build.', correta: false, porque: 'o build free-threaded é suportado no 3.14.' },
            { id: 'c', texto: 'Todo código thread-unsafe vira thread-safe.', correta: false, porque: 'o contrário: as corridas ficam reais.' },
            { id: 'd', texto: 'Processos deixam de existir e viram threads.', correta: false, porque: 'processos continuam existindo.' }
          ], tutorDepois: 'Decisão de workload e de ecossistema; detecte o GIL efetivo em runtime em vez de presumir.' },
        { tipo: 'escolha', id: 'ft-esc-little', titulo: 'Confira: Little e o batch',
          pergunta: 'Um batch fechado de 50 itens foi criado de uma vez, com limite de 10. O que a Lei de Little permite afirmar sobre quantos estão em serviço?',
          opcoes: [
            { id: 'a', texto: '50: todos os criados estão em serviço.', correta: false, porque: 'parte está na fila.' },
            { id: 'b', texto: 'Nada sem medir: admitidos, executando e aguardando são medidas separadas na mesma fronteira e janela; o limite de 10 restringe as que executam.', correta: true, porque: 'a lei verifica coerência e não inventa throughput.' },
            { id: 'c', texto: 'Zero, porque o sistema não é estável.', correta: false, porque: 'estabilidade é premissa da lei, não conclusão do batch.' }
          ], tutorDepois: 'Capacidade não é um número fora da fronteira do sistema.' },
        { tipo: 'takeaway', html: 'Threads não resolvem CPU puro com GIL: <mark>meça</mark> com a carga real antes de decidir.' }
      ] }
    ],
    revisao: [
      { id: 'm02b6-gil', pergunta: 'O que o GIL impede no CPython padrão?', opcoes: [
        opc('a', 'Execução simultânea de bytecode Python por várias threads no mesmo interpretador (I/O e extensões nativas podem liberá-lo)', true, 'por isso threads ajudam em I/O e em extensões que liberam o GIL.'),
        opc('b', 'Qualquer uso de threads', false, 'threads funcionam; só não paralelizam bytecode puro.'),
        opc('c', 'Uso de processos', false, 'processos têm GIL próprio.')] },
      { id: 'm02b6-probe', pergunta: 'Quais duas dimensões registrar no probe de capabilities?', opcoes: [
        opc('a', 'Se o build é free-threaded e se o GIL está ligado nesta execução', true, 'suporte no build não prova GIL desabilitado.'),
        opc('b', 'Só a versão do Python', false, 'não distingue build e GIL efetivo.'),
        opc('c', 'O número de núcleos', false, 'é dado do ambiente, não do GIL.')] },
      { id: 'm02b6-cpu', pergunta: 'CPU em Python puro com GIL: o que usar?', opcoes: [
        opc('a', 'ProcessPoolExecutor (ou InterpreterPoolExecutor se compatível), medindo startup, IPC e serialização', true, 'threads de Python puro disputam o GIL.'),
        opc('b', 'ThreadPoolExecutor com muitas threads', false, 'não escala bytecode puro.'),
        opc('c', 'asyncio.gather', false, 'não paraleliza CPU.')] },
      { id: 'm02b6-to-thread', pergunta: 'Cancelar o await de uma função em to_thread encerra a função?', opcoes: [
        opc('a', 'Não automaticamente: o trabalho na thread continua; exige thread safety e limite do pool', true, 'cancelar a espera não mata a thread.'),
        opc('b', 'Sim, imediatamente', false, 'a thread não é interrompida.'),
        opc('c', 'Sim, mas só no free-threaded', false, 'vale em qualquer build.')] },
      { id: 'm02b6-little', pergunta: 'Com W = 2 s e λ = 100 req/s, quantas requisições em voo (L = λW)?', opcoes: [
        opc('a', '200, em sistema estável e mesma fronteira e janela', true, 'L = 100 × 2; semáforo, fila bounded e rate limit administram esse número.'),
        opc('b', '50', false, 'é λ/W, não λW.'),
        opc('c', '102', false, 'não se soma.')] }
    ]
  });
})();
