/* M02 · Bloco 5: asyncio estruturado, cancelamento e backpressure. Fonte: M02.html#b5. Tempos do simulador: do próprio simulador do módulo (A, B, C com 1 ms de CPU, uma espera, 1 ms de CPU). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var py = function (l) { return l.join('\n') + '\n'; };

  var codigo = py([
    'def lotes(itens, limite):',
    '    # Admissao limitada: devolva uma lista de lotes de ate `limite` itens,',
    '    # na ordem original. limite < 1 -> ValueError("limite")',
    '    return []',
    '',
    '',
    'def em_voo_maximo(itens, limite):',
    '    # quantos itens estao em servico ao mesmo tempo, no maximo',
    '    return 0'
  ]);
  var testes = py([
    'def test_lotes_basico():',
    '    assert lotes([1, 2, 3, 4, 5], 2) == [[1, 2], [3, 4], [5]]',
    '',
    '',
    'def test_lotes_borda():',
    '    assert lotes([], 3) == []',
    '    assert lotes([1, 2], 5) == [[1, 2]]',
    '',
    '',
    'def test_em_voo_respeita_limite():',
    '    assert em_voo_maximo(list(range(50)), 8) == 8',
    '    assert em_voo_maximo([1, 2], 8) == 2',
    '    assert em_voo_maximo([], 8) == 0',
    '',
    '',
    'def test_limite_invalido():',
    '    for ruim in (0, -1):',
    '        try:',
    '            lotes([1], ruim)',
    '        except ValueError as e:',
    '            assert "limite" in str(e)',
    '        else:',
    '            assert False, "limite invalido deveria falhar"'
  ]);
  var solucao = py([
    'def lotes(itens, limite):',
    '    if limite < 1:',
    '        raise ValueError("limite")',
    '    return [list(itens[i:i + limite]) for i in range(0, len(itens), limite)]',
    '',
    '',
    'def em_voo_maximo(itens, limite):',
    '    return max((len(l) for l in lotes(itens, limite)), default=0)'
  ]);

  TrilhaAula.registrar({
    id: 'm02-b5',
    titulo: 'asyncio estruturado, cancelamento e backpressure',
    minutos: 40,
    resumo: 'Um event loop executa uma Task por vez em sua thread e alterna quando ela aguarda. Bloqueio síncrono para aquele loop; TaskGroup dá ownership; CancelledError não se engole; fila bounded dá backpressure.',
    objetivo: 'Prever o efeito de time.sleep em async def, usar TaskGroup e timeout sem engolir o cancelamento e explicar como fila bounded e semáforo limitam a admissão.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Scheduling cooperativo e ownership</h3>' +
          '<p>Uma <strong>coroutine</strong> só progride quando é aguardada ou transformada em <strong>Task</strong>. O <strong>event loop</strong> executa uma Task por vez em sua thread e alterna quando ela aguarda um Future ou I/O. Bloqueio síncrono impede as outras Tasks <em>daquele loop</em> de avançar; uma aplicação pode ter vários workers, processos, threads ou interpreters. Diagnostique nomeando a fronteira afetada, não dizendo que "o Python inteiro congelou".</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Necessidade</th><th>Mecanismo</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>Representar a operação</td><td>Objeto coroutine</td><td>Chamar <code>async def</code> não executa o corpo.</td></tr>' +
          '<tr><td>Concorrência com ownership</td><td><code>TaskGroup</code></td><td>Aguarda as tasks e organiza falhas; não limita sozinho a admissão.</td></tr>' +
          '<tr><td>Timeout</td><td><code>asyncio.timeout</code></td><td>Usa cancelamento; a operação precisa preservar o cleanup.</td></tr>' +
          '<tr><td>I/O síncrono</td><td><code>to_thread</code></td><td>Cancelar a espera não encerra automaticamente o código da thread.</td></tr></tbody></table>' +
          '<ul><li><strong>Não bloqueie o loop.</strong> Para API síncrona inevitável, confirme thread safety, imponha limite e use <code>to_thread</code>/executor.</li><li><strong>Verifique o contrato da biblioteca:</strong> prefira API async quando existir; o nome do pacote sozinho não prova o comportamento.</li></ul>' },
        { tipo: 'takeaway', html: 'O loop só alterna quando uma Task <mark>cede num await</mark>; código bloqueante segura a <mark>única thread</mark> daquele loop.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Três tasks A, B e C: 1 ms de CPU, uma espera e mais 1 ms de CPU (esperas de 3, 2 e 1 ms). Veja o cenário cooperativo, em que todas usam <code>await</code>; depois o bloqueante, em que A usa <code>time.sleep</code>. Tempos do simulador do módulo.</p>' },
        { tipo: 'rode', id: 'aio-coop', titulo: 'Todas cooperam', obrigatorio: false,
          enunciado: 'Cada etapa é um evento do loop.',
          prefixo: '$', entrada: 'python loop_coop.py', unidade: 'ms', terminalTitulo: 'simulador · cooperativo',
          etapas: [
            { id: 'a', nome: 'Task A', descricao: 'cede em await sleep(3)', tom: 'dns', ms: 1, linhas: [L('out', 'A executa 1 ms de CPU; await sleep(3): registra timer e cede o controle')] },
            { id: 'b', nome: 'Task B', descricao: 'cede em await sleep(2)', tom: 'tcp', ms: 1, linhas: [L('out', 'B executa 1 ms de CPU; await sleep(2): registra timer e cede o controle')] },
            { id: 'c', nome: 'Task C', descricao: 'cede em await sleep(1)', tom: 'tls', ms: 1, linhas: [L('out', 'C executa 1 ms de CPU; await sleep(1): registra timer e cede o controle'), L('info', 't = 3 ms: fila vazia, o loop dorme até t = 4 ms; os timers vencidos movem A, B, C para a fila pronta')] },
            { id: 'fim', nome: 'Retomadas', descricao: 'A, B e C terminam', tom: 'ink', ms: 3, linhas: [L('out', 'A, B e C executam 1 ms cada e terminam. Fim: 7 ms'), L('hint', 'as esperas se sobrepõem: o total é a maior espera mais o trabalho de CPU, não a soma das esperas')] }
          ], tutorDepois: 'Enquanto A esperava, B e C rodaram: é o que concorrência cooperativa significa.' },
        { tipo: 'rode', id: 'aio-blk', titulo: 'A usa time.sleep', obrigatorio: false,
          enunciado: 'Mesmo cenário, mas A chama <code>time.sleep(3)</code> em vez de <code>await asyncio.sleep(3)</code>. Preveja o total.',
          prefixo: '$', entrada: 'python loop_bloqueante.py', unidade: 'ms', terminalTitulo: 'simulador · bloqueante',
          etapas: [
            { id: 'a', nome: 'Task A', descricao: 'time.sleep(3)', tom: 'dns', ms: 5, linhas: [L('out', 'A executa 1 ms de CPU; chama time.sleep(3): a thread do loop fica PARADA 3 ms, ninguém mais roda; A executa mais 1 ms e termina (t = 5 ms)')] },
            { id: 'b', nome: 'Task B', descricao: 'só agora roda', tom: 'tcp', ms: 1, linhas: [L('out', 'B executa 1 ms de CPU; await sleep(2) (t = 6 ms)')] },
            { id: 'c', nome: 'Task C', descricao: 'idem', tom: 'tls', ms: 1, linhas: [L('out', 'C executa 1 ms de CPU; await sleep(1) (t = 7 ms); fila vazia, o loop dorme até t = 8 ms')] },
            { id: 'fim', nome: 'Retomadas', descricao: 'B e C terminam', tom: 'ink', ms: 2, linhas: [L('out', 'B e C executam 1 ms cada e terminam. Fim: 10 ms'), L('hint', 'as esperas de B e C deixaram de ser concorrentes por causa do bloqueio de A')] }
          ],
          prever: { pergunta: 'Com time.sleep em A, o total fica menor, igual ou maior que os 7 ms do cenário cooperativo?', opcoes: [
            opc('a', 'Igual: sleep é sleep.', false, 'o sleep síncrono segura a thread do loop; as outras tasks não avançam.'),
            opc('b', 'Maior: o bloqueio de A atrasa B e C, e o total soma os bloqueios.', true, 'o simulador termina em 10 ms contra 7 ms.'),
            opc('c', 'Menor: o Python cria uma thread para A.', false, 'não há thread nova; o bloqueio é na thread do loop.')] },
          tutorDepois: 'O bloqueio afeta o loop daquela thread, não "o Python inteiro".',
          callout: 'Você viu o custo do bloqueio no mesmo loop.' },
        { tipo: 'texto', html:
          '<h3>TaskGroup, cancelamento e limites</h3>' +
          '<p><code>async def</code> cria uma corrotina sem executar o corpo; <code>await asyncio.sleep(0)</code> é um ponto cooperativo; <code>TaskGroup()</code> delimita o lifetime das Tasks do bloco: ao sair, elas já concluíram ou falharam segundo a política do grupo.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'async def process_all(items: list[str]) -> list[str]:\n    tasks: list[asyncio.Task[str]] = []\n    try:\n        async with asyncio.timeout(2):\n            async with asyncio.TaskGroup() as group:\n                tasks = [group.create_task(process_one(x), name=x) for x in items]\n    except asyncio.CancelledError:\n        # cleanup local em finally; cancelamento continua sendo sinal de controle\n        raise\n    return [task.result() for task in tasks]' },
        { tipo: 'texto', html:
          '<h3>Três comportamentos que merecem teste</h3><ul>' +
          '<li><strong>Corrotina fria.</strong> <code>resultado = buscar_cotacao(client, "USD")</code> sem <code>await</code> devolve um objeto inerte; o warning <em>coroutine was never awaited</em> denuncia isso.</li>' +
          '<li><strong>Fire-and-forget sem referência.</strong> <code>asyncio.create_task(foo())</code> sem guardar o retorno pode ser coletado pelo GC no meio da execução. Guarde a referência ou use <code>TaskGroup</code>.</li>' +
          '<li><strong><code>gather</code> versus exceções.</strong> Por padrão a primeira exceção é propagada ao await e as demais awaitables <em>não</em> são canceladas. <code>TaskGroup</code> cancela os siblings quando uma falha e reúne as falhas em <code>ExceptionGroup</code>.</li></ul>' +
          '<p>Coroutines usam <code>try/finally</code> para liberar recursos. Engolir <code>CancelledError</code> pode quebrar <code>TaskGroup</code> e <code>asyncio.timeout()</code>. Para backpressure, um semáforo limita uma região e <code>asyncio.Queue(maxsize=N)</code> limita quantos itens esperam e faz o produtor esperar quando o consumidor satura.</p>' },
        { tipo: 'takeaway', html: 'Falha em sibling cancela o grupo; <mark>CancelledError</mark> é sinal de controle: limpe e <mark>relance</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>O lab final usa um servidor HTTP local descartável, com latência e falha controladas, sem internet. Seus testes cobrem exceção em worker, cancelamento externo, timeout e remoção do limite da fila, cada um provando uma propriedade distinta. Um teste de starvation sobe um servidor stdlib em <code>127.0.0.1</code>: o handler bloqueante segura o loop e o heartbeat para; o cooperativo não. Isso prova starvation <em>naquele</em> loop, sem inventar throughput.</p>' +
          '<p>Aqui, o núcleo lógico da admissão limitada, sem asyncio.</p>' },
        { tipo: 'python', id: 'aio-python', titulo: 'Admissão limitada', obrigatorio: false,
          enunciado: 'Implemente <code>lotes(itens, limite)</code> (lotes de no máximo <code>limite</code> itens, na ordem; <code>limite &lt; 1</code> levanta <code>ValueError("limite")</code>) e <code>em_voo_maximo(itens, limite)</code>.',
          codigo: codigo, testes: testes,
          dica: 'Fatie com <code>itens[i:i+limite]</code> para <code>i</code> em <code>range(0, len(itens), limite)</code>. O máximo em voo é o maior lote (0 se não houver).',
          solucao: solucao,
          tutorDepois: 'Um batch fechado de 50 criados não significa 50 em serviço: parte espera na fila. O limite é o que você pode afirmar em voo.',
          callout: 'A admissão ficou limitada e o limite inválido falha de forma explícita.' },
        { tipo: 'transcript', id: 'aio-transcript', titulo: 'Ache a afirmação que o código não sustenta', obrigatorio: false, terminalTitulo: 'revisão de PR',
          enunciado: 'O agente propõe um worker async. Uma das afirmações dele contradiz o que o código mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Revise o worker que consome a fila de cotações.' },
            { quem: 'ferramenta', texto: '$ cat worker.py\nasync def consumir(fila):\n    while True:\n        try:\n            item = await fila.get()\n            time.sleep(0.5)\n            await publicar(item)\n        except BaseException:\n            log.warning("erro")' },
            { quem: 'agente', texto: 'A fila tem maxsize, então há backpressure.' },
            { quem: 'agente', texto: 'O time.sleep(0.5) é seguro: só a coroutine atual espera, as outras seguem.' },
            { quem: 'agente', texto: 'Capturar BaseException só registra o erro e o worker continua.' }
          ],
          erradas: [3],
          explicacao: { 3: 'time.sleep bloqueia a thread do event loop: nenhuma outra Task daquele loop avança nesse tempo. O correto é await asyncio.sleep. Além disso, o except BaseException engole CancelledError, o que quebra TaskGroup e asyncio.timeout(): é preciso limpar e relançar.' },
          tutorDepois: 'Duas falhas no mesmo trecho: o sleep síncrono e a captura que engole o cancelamento.' },
        { tipo: 'takeaway', html: '<mark>Fila bounded</mark> e <mark>semáforo</mark> limitam a admissão; o que você afirma em voo é o <mark>limite</mark>, não o tamanho do lote criado.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'aio-esc-sleep', titulo: 'Confira: sleep dentro de async def',
          pergunta: 'Dentro de uma <code>async def</code> chamada por um servidor, alguém escreve <code>time.sleep(2)</code>. Qual é o efeito?',
          opcoes: [
            { id: 'a', texto: 'Só a coroutine atual espera; as outras seguem normalmente.', correta: false, porque: 'o sleep síncrono segura a thread do loop.' },
            { id: 'b', texto: 'Bloqueia a thread do event loop por 2 s: nenhuma outra Task daquele loop avança. O correto é <code>await asyncio.sleep(2)</code>.', correta: true, porque: 'o loop só alterna quando uma Task cede em um await.' },
            { id: 'c', texto: 'O Python detecta e converte automaticamente em await.', correta: false, porque: 'não há conversão automática.' },
            { id: 'd', texto: 'Cria uma nova thread para aquela coroutine.', correta: false, porque: 'não cria.' }
          ], tutorDepois: 'Cooperação: o bloqueio tem escopo mensurável, o loop daquela thread.' },
        { tipo: 'escolha', id: 'aio-esc-cancel', titulo: 'Confira: cancelamento',
          pergunta: 'Um bloco captura <code>except Exception:</code> ao redor de um <code>await</code> dentro de um <code>TaskGroup</code> com timeout. O que é seguro e o que seria perigoso?',
          opcoes: [
            { id: 'a', texto: 'Seria perigoso, porque CancelledError deriva de Exception e seria engolida.', correta: false, porque: 'CancelledError deriva de BaseException.' },
            { id: 'b', texto: 'Os dois são igualmente seguros: o asyncio ignora exceções capturadas.', correta: false, porque: 'engolir o cancelamento quebra o controle.' },
            { id: 'c', texto: 'O perigo é só de desempenho.', correta: false, porque: 'o perigo é de correção do cancelamento.' },
            { id: 'd', texto: 'CancelledError deriva de BaseException, então except Exception não a engole; perigoso seria except BaseException ou except: sem relançar.', correta: true, porque: 'o cancelamento é implementado com exceção; se precisar capturar para limpar, faça o cleanup e dê raise.' }
          ], tutorDepois: 'Engolir CancelledError faz o timeout e o TaskGroup perderem o controle.' },
        { tipo: 'takeaway', html: 'Diagnóstico de bloqueio: nomeie o <mark>loop afetado</mark>; correção: API <mark>async</mark> ou <mark>thread com limite</mark>.' }
      ] }
    ],
    revisao: [
      { id: 'm02b5-fria', pergunta: 'O que é uma corrotina "fria" e como o runtime avisa?', opcoes: [
        opc('a', 'async def chamada sem await: objeto inerte; warning "coroutine was never awaited"', true, 'corrija com await, create_task guardando a referência ou TaskGroup.'),
        opc('b', 'Corrotina que já terminou', false, 'fria é a que nem começou.'),
        opc('c', 'Corrotina em outra thread', false, 'não tem relação com thread.')] },
      { id: 'm02b5-sleep', pergunta: 'O que time.sleep faz dentro de async def?', opcoes: [
        opc('a', 'Bloqueia a thread do event loop; nenhuma outra Task daquele loop avança', true, 'use await asyncio.sleep ou to_thread.'),
        opc('b', 'Suspende só a coroutine atual', false, 'isso é await asyncio.sleep.'),
        opc('c', 'Cria uma thread nova', false, 'não cria.')] },
      { id: 'm02b5-cancelled', pergunta: 'Como tratar CancelledError?', opcoes: [
        opc('a', 'Não engolir: fazer cleanup em finally e relançar (deriva de BaseException)', true, 'engolir quebra TaskGroup e asyncio.timeout().'),
        opc('b', 'Capturar com except Exception e seguir', false, 'except Exception nem a captura, e seguir seria o erro.'),
        opc('c', 'Ignorar sempre', false, 'o cancelamento é sinal de controle.')] },
      { id: 'm02b5-gather', pergunta: 'O que diferencia gather de TaskGroup diante de uma exceção?', opcoes: [
        opc('a', 'gather propaga a primeira sem cancelar as demais; TaskGroup cancela siblings e reúne falhas em ExceptionGroup', true, 'por isso TaskGroup dá ownership de lifetime.'),
        opc('b', 'São idênticos', false, 'o tratamento de falha difere.'),
        opc('c', 'gather cancela todas e TaskGroup ignora a falha', false, 'é o contrário.')] },
      { id: 'm02b5-queue', pergunta: 'Como asyncio.Queue(maxsize=N) dá backpressure?', opcoes: [
        opc('a', 'Limita quantos itens esperam e faz o produtor esperar quando o consumidor satura', true, 'semáforo limita uma região; fila bounded limita a admissão.'),
        opc('b', 'Descarta itens em silêncio', false, 'o produtor espera.'),
        opc('c', 'Aumenta o tamanho sozinha', false, 'o limite é fixo.')] }
    ]
  });
})();
