/* M02A · Bloco 6: runtime, concorrência e backpressure. Fonte: M02A.html#b6. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'def simular(chegada, consumo, capacidade, ticks):', '    # por tick: chegam `chegada` itens; cabem só até `capacidade` na fila (0 = ilimitada);',
    '    # o excesso é REJEITADO (admissão sem espera); depois a consumidora processa até `consumo` itens.',
    '    # devolve {"processados": n, "rejeitados": n, "esperando": n, "max_fila": n}',
    '    return {"processados": 0, "rejeitados": 0, "esperando": 0, "max_fila": 0}', ''].join('\n');
  var testes = [
    'def test_carga_que_cabe_nao_rejeita():',
    '    r = simular(2, 3, 5, 20)', '    assert r["rejeitados"] == 0 and r["esperando"] == 0 and r["processados"] == 40', '', '',
    'def test_sem_limite_a_fila_so_cresce():',
    '    r = simular(5, 2, 0, 10)', '    assert r["rejeitados"] == 0 and r["esperando"] == 30 and r["max_fila"] == 32', '', '',
    'def test_fila_limitada_rejeita_o_excesso_e_protege_o_teto():',
    '    r = simular(5, 2, 4, 10)', '    assert r["max_fila"] <= 4 and r["rejeitados"] > 0', '    assert r["processados"] + r["rejeitados"] + r["esperando"] == 50', '', '',
    'def test_conservacao_de_itens():',
    '    for a, s, c in [(1, 1, 1), (3, 1, 2), (4, 4, 0)]:',
    '        r = simular(a, s, c, 7)', '        assert r["processados"] + r["rejeitados"] + r["esperando"] == a * 7', ''].join('\n');
  var solucao = [
    'def simular(chegada, consumo, capacidade, ticks):', '    fila = proc = rej = mx = 0', '    for _ in range(ticks):',
    '        for _ in range(chegada):', '            if capacidade == 0 or fila < capacidade:', '                fila += 1', '            else:', '                rej += 1',
    '        mx = max(mx, fila)', '        n = min(consumo, fila)', '        fila -= n', '        proc += n',
    '    return {"processados": proc, "rejeitados": rej, "esperando": fila, "max_fila": mx}', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b6',
    titulo: 'Runtime, concorrência e backpressure',
    minutos: 30,
    resumo: 'Concorrência é gestão de capacidade e lifecycle: toda task tem dono, toda fila tem limite e overload precisa de resultado explícito.',
    objetivo: 'Escolher o runtime pelo workload e pelo recurso, dar ownership às tasks e usar fila limitada, timeout e cancelamento com cleanup.',
    revisao: [
      { id: 'm02ab6-async', pergunta: 'O que async, thread e mais workers não garantem?',
        opcoes: [
          opc('a', 'Async não paraleliza sozinho; cancelar um await não mata a função na thread; mais workers não criam capacidade do recurso lento.', true, 'a pergunta inicial é qual trabalho espera I/O, bloqueia, consome CPU e qual recurso externo precisa de limite.'),
          opc('b', 'Async paraleliza CPU.', false, 'não: código síncrono ainda bloqueia o event loop.'),
          opc('c', 'Mais workers sempre reduzem latência.', false, 'o gargalo downstream pode piorar.')] },
      { id: 'm02ab6-taskgroup', pergunta: 'Para que serve <code>asyncio.TaskGroup</code> e o que ele não faz?',
        opcoes: [
          opc('a', 'Dá ownership: tasks filhas pertencem ao bloco, são aguardadas e têm política de falha conjunta; não limita dados (isso é a fila).', true, 'quem cria, limita, aguarda, cancela e observa o trabalho são perguntas distintas.'),
          opc('b', 'Limita a memória.', false, 'quem limita itens é a fila bounded.'),
          opc('c', 'Substitui timeouts.', false, 'timeout é <code>asyncio.timeout</code>.')] },
      { id: 'm02ab6-bp', pergunta: 'A consumidora satura. Qual desenho é mais saudável?',
        opcoes: [
          opc('a', 'Fila com capacidade, timeout de admissão e rejeição explícita: overload vira sinal observável.', true, 'fila ilimitada troca memória e latência sem teto por "não perder nada".'),
          opc('b', 'Fila ilimitada.', false, 'memória e latência crescem sem teto.'),
          opc('c', 'Descartar em silêncio.', false, 'esconde o overload.')] },
      { id: 'm02ab6-cap', pergunta: 'Capacidade da fila é throughput?',
        opcoes: [
          opc('a', 'Não: fila pequena protege memória e ainda pode entregar taxa insuficiente; fila grande pode esconder indisponibilidade. Ligue profundidade e rejeições a SLO.', true, 'não há threshold universal.'),
          opc('b', 'Sim: quanto maior a fila, maior a vazão.', false, 'a vazão é da consumidora.')] },
      { id: 'm02ab6-cancel', pergunta: 'Como tratar <code>CancelledError</code> e timeout?',
        opcoes: [
          opc('a', 'Limpar em <code>finally</code> e propagar; timeout não desfaz efeito já enviado a API, banco ou thread (exige idempotência e reconciliação).', true, 'engolir o cancelamento o transforma em sucesso aparente.'),
          opc('b', 'Engolir e retornar None.', false, 'cancelamento vira sucesso.'),
          opc('c', 'Timeout desfaz tudo.', false, 'só cancela o await local.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Async não torna o trabalho automaticamente paralelo; thread não torna a operação cancelável; mais workers não criam capacidade do recurso lento. A pergunta inicial: qual trabalho espera I/O, qual bloqueia uma thread, qual consome CPU e qual recurso externo precisa de limite? A resposta define o runtime e também ownership, timeout, cancelamento e evidência.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Forma</th><th>Boa candidata</th><th>Risco que permanece</th></tr></thead><tbody>' +
          '<tr><td>sync</td><td>fluxo curto, bloqueio aceitável</td><td>thread ocupada durante I/O</td></tr>' +
          '<tr><td>asyncio</td><td>muitas esperas cooperativas com API async</td><td>código síncrono bloqueia o event loop</td></tr>' +
          '<tr><td>thread</td><td>API síncrona inevitável ou I/O bloqueante</td><td>cancelar o await não mata a função na thread</td></tr>' +
          '<tr><td>processo</td><td>CPU-bound grande o bastante</td><td>startup, serialização e IPC</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O B06 usa asyncio para demonstrar espera cooperativa local; não recomenda asyncio para todo serviço. Threads, processos e builds free-threaded têm custos próprios (M02): o critério é workload e contrato do recurso, não preferência de linguagem.</p>' +
          '<h3>Ownership: toda task precisa de dono</h3>' +
          '<p>Uma coroutine só avança quando alguém a aguarda ou cria uma <code>Task</code>. Task sem owner pode terminar com exceção não observada ou continuar depois que o pedido já morreu. <code>asyncio.TaskGroup</code> cria um escopo: tasks filhas pertencem ao bloco, são aguardadas e têm política de falha conjunta. O grupo organiza o ciclo de vida; a fila transporta e limita dados.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'async with asyncio.TaskGroup() as group:\n    group.create_task(consume(), name="bounded-batch-consumer")\n    # produtor admite itens; o grupo só sai quando a consumidora termina' },
        { tipo: 'takeaway', html: '<mark>TaskGroup</mark> dá ownership; <mark>fila bounded</mark> dá limite de admissão.' }
      ] },

      { rotulo: 'Backpressure e cancelamento', blocos: [
        { tipo: 'texto', html:
          '<h3>Backpressure: recusar é melhor que crescer sem limite</h3>' +
          '<p>Uma fila <strong>bounded</strong> limita itens aguardando. Com a consumidora saturada, o produtor espera até o timeout de admissão; se expira, o batch registra rejeição explícita. Overload vira sinal observável, em vez de memória ilimitada e latência crescente. <strong>Capacidade não é throughput</strong>: fila de tamanho um protege memória e pode entregar taxa insuficiente; fila grande absorve burst e pode esconder indisponibilidade. O laboratório registra profundidade máxima e rejeições, sem threshold universal; produção liga esses sinais a SLO, budget, recurso externo e política de shed/queue/retry.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'queue: asyncio.Queue[int | None] = asyncio.Queue(maxsize=capacity)\ntry:\n    await asyncio.wait_for(queue.put(item), timeout=admission_timeout)\nexcept TimeoutError:\n    rejected += 1' },
        { tipo: 'rode', id: 'b6-rode', titulo: 'Simulador: fila ilimitada x limitada', obrigatorio: false,
          enunciado: 'Chegada de 5 itens/tick contra consumo de 2/tick, por 10 ticks (simulação ilustrativa; o simulador completo está no texto do módulo).',
          prefixo: '$', entrada: 'simular(chegada=5, consumo=2, capacidade=?)  # exemplo', unidade: 'ms', terminalTitulo: 'exemplo (modelo simplificado)',
          prever: { pergunta: 'Sem limite de fila, o que acontece com a espera?', opcoes: [
            { id: 'a', texto: 'Estabiliza: a fila se ajusta.', correta: false, porque: 'chegada maior que consumo faz a fila crescer sem teto.' },
            { id: 'b', texto: 'Cresce a cada tick, junto com memória e latência.', correta: true, porque: 'sem limite não há sinal de overload.' }] },
          etapas: [
            { id: 'i', nome: 'Capacidade 0 (ilimitada)', descricao: '', tom: 'dns', ms: 1, linhas: [L('out', 'processados=20 rejeitados=0 esperando=30 max_fila=30'), L('hint', 'a espera só cresce')] },
            { id: 'l', nome: 'Capacidade 4', descricao: '', tom: 'response', ms: 1, linhas: [L('out', 'max_fila<=4 rejeitados>0 (excesso vira sinal explícito)'), L('hint', 'escalar, reduzir carga ou degradar')] }
          ] },
        { tipo: 'texto', html:
          '<h3>Cancelamento, timeout e cleanup</h3>' +
          '<p>Cancelamento é sinal de controle, não exceção a engolir. O consumidor libera estado em <code>finally</code>; o teste cancela o batch de fora e confirma que o cleanup ocorreu e que <code>CancelledError</code> chegou ao chamador. <code>asyncio.timeout</code> delimita o await do advisor local; se expira, a operação recebe cancelamento e o <code>finally</code> confirma que não sobrou task órfã. Timeout <em>não desfaz</em> efeito que já passou para API, banco ou thread: nesse caso o contrato precisa de idempotência, estado de operação e reconciliação. O teste do B06 prova só ownership e cleanup da coroutine local.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'async def call_with_deadline(operation, *, seconds):\n    async with asyncio.timeout(seconds):\n        return await operation()' },
        { tipo: 'takeaway', html: 'Overload precisa de <mark>resultado explícito</mark>; timeout exige <mark>cleanup</mark>, não promessa de desfazer o mundo externo.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b6-python', titulo: 'Simule a fila limitada', obrigatorio: false,
          enunciado: 'Implemente <code>simular</code> como modelo por ticks (determinístico, sem threads): a admissão rejeita o excesso quando a fila está cheia; depois a consumidora processa até <code>consumo</code> itens.',
          codigo: codigo, testes: testes,
          dica: 'Para cada item que chega: se <code>capacidade == 0 or fila &lt; capacidade</code>, incremente a fila; senão, rejeite. Depois <code>n = min(consumo, fila)</code>.',
          solucao: solucao, callout: 'Modelo de backpressure com conservação de itens.' },
        { tipo: 'transcript', id: 'b6-transcript', titulo: 'Qual afirmação do relato não se sustenta?', obrigatorio: false, terminalTitulo: 'revisão de incidente',
          enunciado: 'Um colega relata uma correção de memória. Clique na afirmação que o fato não sustenta e confira.',
          linhas: [
            { quem: 'voce', texto: 'A memória cresce sob carga. O que você mudou?' },
            { quem: 'agente', texto: 'Troquei a fila para maxsize=1000.' },
            { quem: 'ferramenta', texto: 'profundidade máxima: 1000; rejeições: 0; p99 de espera: 41 s' },
            { quem: 'agente', texto: 'Resolvido: a fila de 1000 garante a vazão e a latência.' }
          ],
          erradas: [3], explicacao: { 3: 'capacidade da fila não é throughput: o p99 de 41 s mostra que a fila grande só escondeu a saturação. É preciso ligar profundidade e rejeições a SLO e política de shed.' } },
        { tipo: 'escolha', id: 'b6-esc1', titulo: 'Confira: timeout que volta e trabalho que continua', pergunta: 'O timeout retorna, mas o trabalho continua. Qual a hipótese?',
          opcoes: [
            { id: 'a', texto: 'A operação escapou do escopo ou bloqueia fora do loop; mantenha a task no grupo e adapte o I/O bloqueante.', correta: true, porque: 'evidência: ownership da task e o estado no finally.' },
            { id: 'b', texto: 'O timeout é curto demais; aumente-o.', correta: false, porque: 'não resolve a task sem dono.' }] },
        { tipo: 'escolha', id: 'b6-esc2', titulo: 'Confira: mais tasks, pior latência', pergunta: 'Aumentar o número de tasks piorou a latência. Hipótese?',
          opcoes: [
            { id: 'a', texto: 'O recurso downstream é o gargalo; reduza a admissão ou aumente capacidade comprovada.', correta: true, porque: 'mais workers não criam capacidade do recurso lento.' },
            { id: 'b', texto: 'Faltam mais tasks.', correta: false, porque: 'amplia a contenção.' }] },
        { tipo: 'takeaway', html: 'Runtime é escolha de <mark>workload e recurso</mark>, não identidade do projeto.' }
      ] }
    ]
  });
})();
