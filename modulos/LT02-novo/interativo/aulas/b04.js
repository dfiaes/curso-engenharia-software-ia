/* LT02 · Bloco 4: deadlines, retries, DLQ, sagas e compensação. Fonte: LT02.html#b04. Agenda local de inteiros lógicos; broker real fica em trilha própria. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasSaga = function () {
    return [
      { id: 'reserva', nome: 'Reservar', descricao: 'Passo compensável', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python saga_compensavel.py --semente 3 --falhas 429,timeout-confirmacao'),
        L('out', 'reservar orçamento res-7: ok (compensável: liberar reserva)')] },
      { id: 'executa', nome: 'Executar', descricao: '429 transitório', tom: 'tcp', ms: 3, linhas: [
        L('out', 'executar operação externa: 429 (Retry-After 2)'),
        L('out', 'orçamento: tentativa 2 de 3; espera = max(Retry-After, jitter) = 2'),
        L('out', 'executar operação externa: ok')] },
      { id: 'guarda', nome: 'Guarda de deadline', descricao: 'agora + custo <= deadline?', tom: 'tls', ms: 1, linhas: [
        L('out', 'agora 7 + custo 2 <= deadline 10 -> autorizada')] },
      { id: 'confirma', nome: 'Confirmar uso', descricao: 'O pivot dá timeout', tom: 'request', ms: 2, linhas: [
        L('in', 'confirmar uso: TIMEOUT (ambíguo: a confirmação pode ter persistido)'),
        L('hint', 'confirmação de uso é o pivot: repetir às cegas é proibido')] },
      { id: 'reconcilia', nome: 'Reconciliar', descricao: 'Consulta pelo operation ID', tom: 'response', ms: 1, linhas: [
        L('out', 'consulta res-7/confirmar: indisponível (provedor sem consulta)')] },
      { id: 'humano', nome: 'Caso humano', descricao: 'Ambiguidade irreconciliável', tom: 'ink', ms: 1, linhas: [
        L('in', 'caso humano aberto: chave res-7, message_id, causation_id, attempt 1, motivo "confirmação ambígua"'),
        L('hint', 'nem retry cego, nem compensação às cegas')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'lt02-b4',
    titulo: 'Deadlines, retries, DLQ, sagas e compensação',
    minutos: 35,
    resumo: 'Tentar de novo até passar vira orçamento finito: deadline que barra a tentativa, backoff com jitter, DLQ observável e compensação como nova ação de negócio.',
    objetivo: 'Classificar a falha em transitória, permanente ou ambígua, separar timeout de deadline, aplicar backoff com jitter e três tetos, operar DLQ com replay seguro e desenhar uma saga com pivot e compensação idempotente.',
    revisao: [
      { id: 'lt02b4-destinos', pergunta: 'Como tratar falha transitória, permanente e ambígua?',
        opcoes: [
          opc('a', 'Transitória retenta com orçamento; permanente vai à quarentena com causa; ambígua reconcilia antes de qualquer veredito', true, 'o destino decide o tratamento.'),
          opc('b', 'Todas retentam até passar', false, 'permanente queima orçamento e ambígua duplica.'),
          opc('c', 'Todas vão para a DLQ', false, 'transitória costuma passar sozinha.')] },
      { id: 'lt02b4-deadline', pergunta: 'Qual a diferença entre timeout por tentativa e deadline do job?',
        opcoes: [
          opc('a', 'Timeout limita uma chamada; deadline limita a intenção inteira, e tentativa que não cabe nele jamais começa', true, 'a guarda é agora + custo_estimado <= deadline_em.'),
          opc('b', 'São o mesmo valor', false, 'um é por tentativa, o outro é fim a fim.'),
          opc('c', 'Deadline só vale para a primeira tentativa', false, 'vale para toda tentativa.')] },
      { id: 'lt02b4-jitter', pergunta: 'Por que backoff exponencial precisa de jitter?',
        opcoes: [
          opc('a', 'Porque clientes que falharam juntos retentam juntos; o jitter espalha a onda', true, 'sem jitter, 1x, 2x, 4x recriam picos (thundering herd).'),
          opc('b', 'Para retentar mais rápido', false, 'o objetivo é espalhar, não acelerar.'),
          opc('c', 'Para dispensar o teto de tentativas', false, 'os três tetos continuam.')] },
      { id: 'lt02b4-dlq', pergunta: 'O que o replay seguro da DLQ preserva?',
        opcoes: [
          opc('a', 'Os mesmos IDs e a mesma causalidade, com contagem zerada, só após corrigir a causa', true, 'o resto do sistema deduplica por esses IDs.'),
          opc('b', 'Gera novo message_id para não colidir', false, 'novo ID escapa da dedup e duplica o efeito.'),
          opc('c', 'Nada: a DLQ é descarte', false, 'DLQ é quarentena observável, não cemitério.')] },
      { id: 'lt02b4-saga', pergunta: 'A emissão da nota falhou de forma permanente depois de reservar e cobrar. O que fazer?',
        opcoes: [
          opc('a', 'Compensar em ordem inversa (estornar, depois liberar), cada compensação idempotente', true, 'saga não tem rollback global: os passos locais já são fatos.'),
          opc('b', 'Rollback de transação distribuída', false, 'saga existe justamente por não haver uma.'),
          opc('c', 'Reexecutar tudo do início', false, 'reexecutar duplica cobrança e reserva.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Três destinos para cada falha</h3>' +
          '<ul><li><strong>Transitória</strong>: pode passar sozinha (429 com limite estourado, timeout de rede, 503 durante deploy do provedor). Espera com backoff e tenta de novo dentro do orçamento.</li>' +
          '<li><strong>Permanente</strong>: não passa repetindo (payload inválido, recurso inexistente, permissão negada). Vai direto à quarentena com causa.</li>' +
          '<li><strong>Ambígua</strong>: não se sabe se o efeito aconteceu (timeout na confirmação). Reconcilia antes de qualquer veredito.</li></ul>' +
          '<p>O exemplo condutor é a saga <strong>reservar orçamento → executar operação externa → confirmar uso</strong>.</p>' +
          '<h3>Timeout por tentativa contra deadline do job</h3>' +
          '<p><strong>Timeout por tentativa</strong> é o prazo de uma chamada. <strong>Deadline do job</strong> (<code>deadline_at</code>) é o prazo fim a fim da intenção. A guarda é uma comparação de inteiros lógicos: <code>agora + custo_estimado &lt;= deadline_em</code> autoriza; caso contrário, <code>barrada-deadline</code> com a chave acusada. O custo estimado vem da tentativa anterior observada ou do contrato do provedor.</p>' },
        { tipo: 'texto', html:
          '<h3>Backoff, jitter e três tetos</h3>' +
          '<p><strong>Exponential backoff</strong>: a espera dobra a cada retry até um teto. Sozinho, sincroniza quem falhou junto. <strong>Jitter</strong> sorteia a espera (full jitter: entre 0 e o limite) e espalha a onda.</p>' +
          '<ul><li><strong>Max attempts</strong>: teto por mensagem; depois, quarentena com causa.</li>' +
          '<li><strong>Retry budget</strong>: fração global de retentativas sobre o total numa janela; esgotado, novas retentativas são recusadas.</li>' +
          '<li><strong>Concurrency budget</strong>: quantas tentativas simultâneas podem estar no provedor.</li></ul>' +
          '<p><strong>Retry-After</strong> é o pedido do servidor por pausa mínima: piso da espera, nunca teto do orçamento. <strong>Circuit breaker</strong> abre após taxa de falha sustentada e recusa rápido com a causa. <strong>Load shedding</strong> descarta carga excedente de modo explícito. Nenhum dos três esconde a causa.</p>' },
        { tipo: 'takeaway', html: 'Backoff <mark>espaça</mark>, jitter <mark>espalha</mark>, três tetos <mark>cercam</mark>; tentativa fora do deadline nunca começa.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Saga, pivot e compensação</h3>' +
          '<p><strong>Saga</strong> coordena vários passos sem transação distribuída: cada passo é local e confirmado sozinho; o fracasso posterior dispara compensações dos anteriores. <strong>Orquestrada</strong>: um coordenador central ordena os passos e registra o progresso. <strong>Coreografada</strong>: cada serviço reage a eventos dos outros, sem coordenador.</p>' +
          '<p>Cada passo tem rótulo: <strong>retryável</strong> (pode repetir dentro do orçamento), <strong>pivot</strong> (ponto sem retorno, aqui a confirmação de uso) e <strong>compensável</strong> (tem ação inversa). <strong>Compensação</strong> é nova ação de negócio que desfaz o efeito prático, com rastro e com a mesma identidade do passo. Sob ambiguidade irreconciliável, a saga abre <strong>caso humano</strong>.</p>' },
        { tipo: 'rode', id: 'retry-rode', titulo: 'A saga sob 429 e timeout no pivot', enunciado: 'Rode a saga com 429 na execução e timeout na confirmação de uso, com provedor sem consulta por operation ID.',
          prefixo: '$', entrada: 'python saga_compensavel.py --semente 3 --falhas 429,timeout-confirmacao', unidade: 'passos', terminalTitulo: 'saga (exemplo variável)', etapas: etapasSaga(),
          prever: { pergunta: 'A confirmação de uso deu timeout e o provedor não tem consulta. O que a saga faz?', opcoes: [
            { id: 'a', texto: 'Retenta a confirmação até passar.', correta: false, porque: 'confirmação é o pivot e o resultado é ambíguo: repetir pode confirmar duas vezes.' },
            { id: 'b', texto: 'Compensa liberando a reserva.', correta: false, porque: 'compensar às cegas pode liberar uma reserva já usada.' },
            { id: 'c', texto: 'Abre caso humano com chave, IDs, causalidade, tentativa e motivo.', correta: true, porque: 'ambiguidade irreconciliável não se resolve por retry nem por compensação cega.' }] },
          tutorDepois: 'O 429 entrou no orçamento; o timeout no pivot, não.',
          callout: 'Você viu o 429 tratado como transitório e o pivot ambíguo virar caso humano.' },
        { tipo: 'texto', html:
          '<h3>DLQ como quarentena observável</h3>' +
          '<p><strong>DLQ</strong> guarda a mensagem integral que esgotou tentativas, estourou o deadline ou falhou de modo permanente: <code>message_id</code>, <code>correlation_id</code>, <code>causation_id</code>, chave, hash da intenção, contagem de tentativas e causa, consultável sem consumir. <strong>Replay seguro</strong> devolve cópia com os mesmos IDs e causalidade, contagem zerada e causa limpa, somente após corrigir o motivo original.</p>' },
        { tipo: 'takeaway', html: 'Retryável <mark>antes</mark> do pivot, compensável <mark>depois</mark>; ambiguidade irreconciliável abre <mark>caso humano</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'ordene', id: 'retry-ordene', titulo: 'Ordene a compensação',
          enunciado: 'A saga reservou estoque, cobrou o cartão e falhou de forma permanente ao emitir a nota. Ordene o que acontece.',
          itens: [
            { id: 'libera', texto: 'Liberar o estoque (compensação idempotente)' },
            { id: 'falha', texto: 'Emitir nota falha de forma permanente' },
            { id: 'estorna', texto: 'Estornar a cobrança (compensação idempotente)' },
            { id: 'classifica', texto: 'Classificar a falha como permanente: sem retry' },
            { id: 'registra', texto: 'Registrar a saga como compensada, com rastro' }],
          solucao: ['falha', 'classifica', 'estorna', 'libera', 'registra'],
          dica: 'Compensações seguem a ordem inversa dos passos: o último confirmado é o primeiro desfeito.' },
        { tipo: 'python', id: 'retry-python', titulo: 'Full jitter e guarda de deadline', obrigatorio: false,
          enunciado: 'Implemente <code>espera(tentativa, base, teto, rng)</code> com full jitter (sorteio entre 0 e <code>min(teto, base * 2**tentativa)</code>) e <code>pode_tentar(agora, custo_estimado, deadline_at)</code>. Contratos de <code>lab/orcamento_retry.py</code> e <code>lab/guarda_deadline.py</code>, simplificados.',
          codigo: "import random\n\n\ndef espera(tentativa, base, teto, rng):\n    \"\"\"Full jitter: sorteio entre 0 e min(teto, base * 2**tentativa).\"\"\"\n    # TODO: calcule o limite exponencial com teto e sorteie com rng.randint\n    return 0\n\n\ndef pode_tentar(agora, custo_estimado, deadline_at):\n    \"\"\"Tentativa que nao cabe no prazo jamais comeca.\"\"\"\n    # TODO: agora + custo_estimado <= deadline_at\n    return True\n\n\nprint(espera(3, 100, 1000, random.Random(1)), pode_tentar(95, 10, 100))\n", testes: "import random\n\n\ndef test_espera_dentro_do_limite_exponencial():\n    rng = random.Random(7)\n    for n in range(4):\n        for _ in range(50):\n            assert 0 <= espera(n, 100, 10_000, rng) <= 100 * 2 ** n\n\n\ndef test_teto_vale_para_tentativas_altas():\n    rng = random.Random(3)\n    assert all(espera(20, 100, 1000, rng) <= 1000 for _ in range(100))\n\n\ndef test_jitter_espalha_a_rajada():\n    esperas = {espera(3, 100, 1000, random.Random(s)) for s in range(30)}\n    assert len(esperas) > 10\n\n\ndef test_mesma_semente_reproduz():\n    assert espera(2, 100, 1000, random.Random(5)) == espera(2, 100, 1000, random.Random(5))\n\n\ndef test_deadline_borda_e_estouro():\n    assert pode_tentar(90, 10, 100) is True\n    assert pode_tentar(91, 10, 100) is False\n",
          dica: '<code>rng.randint(0, limite)</code> inclui as duas pontas. A guarda é uma comparação com <code>&lt;=</code>: caber exatamente no prazo é permitido.',
          solucao: "import random\n\n\ndef espera(tentativa, base, teto, rng):\n    limite = min(teto, base * 2 ** tentativa)\n    return rng.randint(0, limite)\n\n\ndef pode_tentar(agora, custo_estimado, deadline_at):\n    return agora + custo_estimado <= deadline_at\n",
          tutorDepois: 'A semente no rng é o que torna a rajada reproduzível no teste: tempo de parede não entra.',
          callout: 'Jitter dentro do limite, reproduzível pela semente, e guarda de deadline na borda.' },
        { tipo: 'takeaway', html: 'Compensação em <mark>ordem inversa</mark>, cada uma <mark>idempotente</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Provedor cai de novo logo após voltar</td><td>Retries sincronizados sem jitter</td><td>Backoff com jitter por semente; concurrency budget</td></tr>' +
          '<tr><td>Orçamento global esgota com poucas mensagens</td><td>Permanentes tratados como transitórios</td><td>Classificar antes de retentar; permanente vai à quarentena</td></tr>' +
          '<tr><td>Tentativa lenta estoura o SLO do chamador</td><td>Retry iniciado sem checar o saldo do deadline</td><td>Guarda <code>agora + custo &lt;= deadline</code>; fora do prazo, quarentena com causa</td></tr></tbody></table>' },
        { tipo: 'escolha', id: 'retry-escolha-herd', titulo: 'Confira: mil clientes sem jitter',
          pergunta: 'Mil clientes falham ao mesmo tempo e usam backoff exponencial sem jitter. O que acontece?',
          opcoes: [
            { id: 'a', texto: 'As retentativas se espalham naturalmente.', correta: false, porque: 'clientes sincronizados continuam sincronizados.' },
            { id: 'b', texto: 'Todos retentam nos mesmos instantes (1x, 2x, 4x), recriando picos que atrapalham a recuperação.', correta: true, porque: 'backoff espaça no tempo; jitter espalha a onda, e os três tetos limitam o total.' },
            { id: 'c', texto: 'O serviço escala sozinho.', correta: false, porque: 'não é o que o backoff promete.' },
            { id: 'd', texto: 'Nada: backoff elimina a carga.', correta: false, porque: 'só a adia.' }] },
        { tipo: 'escolha', id: 'retry-escolha-replay', titulo: 'Confira: o replay da DLQ',
          pergunta: 'A causa da quarentena foi corrigida. Como fazer o replay?',
          opcoes: [
            { id: 'a', texto: 'Republicar com novo message_id para não colidir.', correta: false, porque: 'novo ID escapa da dedup e pode repetir o efeito.' },
            { id: 'b', texto: 'Devolver cópia com os mesmos IDs e causalidade, contagem zerada e causa limpa.', correta: true, porque: 'o sistema deduplica pelos IDs; o replay é volta controlada, não mensagem nova.' },
            { id: 'c', texto: 'Apagar a DLQ e pedir ao cliente que reenvie.', correta: false, porque: 'descarta evidência e intenção.' },
            { id: 'd', texto: 'Fazer replay antes de corrigir, para ver se passa.', correta: false, porque: 'a mensagem volta para a quarentena e queima orçamento.' }] },
        { tipo: 'takeaway', html: 'Orçamento <mark>finito</mark>, DLQ <mark>observável</mark>, replay com os <mark>mesmos IDs</mark>.' }
      ] }
    ]
  });
})();
