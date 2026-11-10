/* LT02 · Bloco 2: filas, streams, entrega, ordenação e backpressure. Fonte: LT02.html#b02. RabbitMQ só como demo externa (fontes de fornecedor consultadas em 14/08/2026, risco alto, revalidar em até 90 dias). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasCrash = function () {
    return [
      { id: 'publica', nome: 'Publicar', descricao: 'Três jobs, confirm do broker', tom: 'dns', ms: 3, linhas: [
        L('cmd', 'python fila_limitada.py --capacidade 4 --prefetch 3 --crash-antes-do-ack'),
        L('out', 'producer: job-1, job-2, job-3 publicados; confirm recebido para os três'),
        L('hint', 'confirm prova chegada ao broker, nada além')] },
      { id: 'entrega', nome: 'Entregar', descricao: 'Worker segura três em voo', tom: 'tcp', ms: 3, linhas: [
        L('out', 'worker-a: recebeu job-1, job-2, job-3 (em voo = 3, pendentes = 0)')] },
      { id: 'processa', nome: 'Processar', descricao: 'Um efeito executado, sem ack', tom: 'tls', ms: 1, linhas: [
        L('out', 'worker-a: job-1 efeito aplicado no ledger; ack ainda não enviado')] },
      { id: 'crash', nome: 'Crash', descricao: 'O worker morre antes do ack', tom: 'request', ms: 1, linhas: [
        L('in', 'worker-a: morto (kill) com 3 mensagens em voo sem ack')] },
      { id: 'redelivery', nome: 'Redelivery', descricao: 'O voo volta à fila', tom: 'response', ms: 3, linhas: [
        L('out', 'broker: 3 mensagens devolvidas, attempt = 1 em cada; perda no transporte = 0'),
        L('hint', 'job-1 volta mesmo já tendo efeito: é a duplicata esperada do at-least-once')] },
      { id: 'dedup', nome: 'Dedup', descricao: 'Worker-b consulta antes de executar', tom: 'ink', ms: 3, linhas: [
        L('out', 'worker-b: job-1 já tem efeito -> dedup, ack sem segundo efeito'),
        L('out', 'worker-b: job-2, job-3 processados e confirmados'),
        L('in', 'ledger: 3 intenções, 3 efeitos')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'lt02-b2',
    titulo: 'Filas, streams, entrega, ordenação e backpressure',
    minutos: 35,
    resumo: 'A fila não "garante": cada canal declara retenção, entrega e ordem, e paga o preço disso em duplicata, quarentena e pressão ao produtor.',
    objetivo: 'Distinguir chamada síncrona, work queue e stream; separar ack de confirm; escolher at-most-once ou at-least-once; ordenar por chave; limitar a fila com backpressure e versionar o schema.',
    revisao: [
      { id: 'lt02b2-confirm', pergunta: 'O broker devolveu publisher confirm. O que isso prova?',
        opcoes: [
          opc('a', 'Que a mensagem chegou ao broker, conforme a durabilidade configurada', true, 'confirm é fronteira producer–broker; o efeito acontece na fronteira consumer–mundo.'),
          opc('b', 'Que o consumer processou', false, 'quem prova processamento é o ack do consumer.'),
          opc('c', 'Que não haverá duplicata', false, 'confirm perdido provoca republish, e daí a duplicata.')] },
      { id: 'lt02b2-ack', pergunta: 'Quando o consumer deve dar ack?',
        opcoes: [
          opc('a', 'Somente após processamento e persistência da conclusão', true, 'ack prematuro converte crash em perda silenciosa.'),
          opc('b', 'Ao receber, para liberar a fila', false, 'é o desenho que perde jobs no crash.'),
          opc('c', 'Antes de processar, se o prefetch for baixo', false, 'prefetch não muda a regra do ack.')] },
      { id: 'lt02b2-semantica', pergunta: 'O que at-least-once admite e o que exige?',
        opcoes: [
          opc('a', 'Admite duplicata e exige dedup por identidade', true, 'redelivery após crash é o preço da não-perda.'),
          opc('b', 'Admite perda e proíbe duplicata', false, 'isso é at-most-once.'),
          opc('c', 'Nada: entrega exatamente uma vez', false, 'a matriz honesta tem duas linhas.')] },
      { id: 'lt02b2-ordem', pergunta: 'Como preservar a ordem dos eventos de cada pedido com 8 partições?',
        opcoes: [
          opc('a', 'Particionar pelo identificador do pedido', true, 'ordem só existe dentro de uma partição, com um dono por vez.'),
          opc('b', 'Chave aleatória', false, 'embaralha a sequência do mesmo pedido.'),
          opc('c', 'Pelo timestamp', false, 'carimbo não define partição estável por pedido.')] },
      { id: 'lt02b2-poison', pergunta: 'O que acontece com a mensagem venenosa no teto de tentativas?',
        opcoes: [
          opc('a', 'Vai para quarentena com causa e replay seguro', true, 'quarentena nunca é descarte silencioso; o replay preserva a identidade.'),
          opc('b', 'É descartada', false, 'descarte sem quarentena observável é perda.'),
          opc('c', 'Continua sendo redeliverada', false, 'redelivery sem limite trava os jobs saudáveis atrás dela.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Três formas de entregar trabalho</h3>' +
          '<p><strong>Chamada síncrona</strong>: pedido com resposta no mesmo canal; quem chama espera, com prazo. O acoplamento é temporal. <strong>Work queue</strong> (fila de trabalho): o <strong>producer</strong> publica, a fila guarda e um <strong>consumer</strong> retira quando pode. <strong>Stream só de acréscimo</strong>: log ordenado em que o evento fica até a retenção expirar, mesmo depois de consumido; cada consumer guarda a própria posição.</p>' +
          '<p>O que organiza a decisão é a <strong>retenção</strong>.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Pergunta</th><th>Chamada síncrona</th><th>Work queue</th><th>Stream</th></tr></thead><tbody>' +
          '<tr><td>O que fica guardado, até quando?</td><td>Nada: resposta ou timeout</td><td>A mensagem, até o ack</td><td>O evento, até a retenção expirar</td></tr>' +
          '<tr><td>Quem precisa estar vivo junto?</td><td>Chamador e executor</td><td>Ninguém: a fila desacopla</td><td>Ninguém: a posição desacopla</td></tr>' +
          '<tr><td>Replay do passado?</td><td>Não existe</td><td>Só do pendente via redelivery</td><td>Sim, por posição, dentro da retenção</td></tr>' +
          '<tr><td>Custo que sempre volta</td><td>Acoplamento temporal e deadline ambíguo</td><td>Duplicata esperada e quarentena de veneno</td><td>Disco, retenção e posição por consumer</td></tr></tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Channel, partition, consumer group</h3>' +
          '<p><strong>Channel</strong> é o caminho nomeado (fila, tópico ou troca com roteamento). <strong>Partition</strong> é a subdivisão ordenada de um channel: dentro dela, ordem de publicação é ordem de leitura; entre partições, não há ordem. <strong>Consumer group</strong> divide as partições entre consumers, um dono por partição de cada vez.</p>' +
          '<p>Com dois workers na mesma fila, a ordem de conclusão segue a velocidade de cada worker. Ordem só existe onde há sequência única com um dono por vez.</p>' },
        { tipo: 'takeaway', html: 'A <mark>retenção</mark> decide o mecanismo; a <mark>partição</mark> é o único lugar onde existe ordem.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Ack e confirm: duas fronteiras</h3>' +
          '<p><strong>Acknowledgement</strong> (ack) é o consumer dizendo ao broker "processado e persistido, pode descartar". Regra de ouro: <strong>ack somente após processamento e persistência</strong>. <strong>Publisher confirm</strong> é o broker dizendo ao producer "recebi e persisti". Confirm não prova entrega, processamento nem efeito.</p>' +
          '<p><strong>Redelivery</strong> é a reentrega de mensagem sem ack (consumer morreu, conexão caiu, prazo de visibilidade expirou), com a contagem de tentativas incrementada.</p>' },
        { tipo: 'rode', id: 'fila-rode', titulo: 'Crash antes do ack', enunciado: 'O worker segura três mensagens em voo, executa o efeito de uma e morre antes de qualquer ack.',
          prefixo: '$', entrada: 'python fila_limitada.py --capacidade 4 --prefetch 3 --crash-antes-do-ack', unidade: 'msgs', terminalTitulo: 'fila fake (exemplo variável)', etapas: etapasCrash(),
          prever: { pergunta: 'O que volta para a fila depois do crash?', opcoes: [
            { id: 'a', texto: 'Só job-2 e job-3: job-1 já teve efeito.', correta: false, porque: 'o broker não sabe do efeito; sem ack, o voo inteiro volta.' },
            { id: 'b', texto: 'As três, com tentativa incrementada; job-1 pode duplicar se não houver dedup.', correta: true, porque: 'perda zero no transporte e duplicata possível: é o contrato do at-least-once.' },
            { id: 'c', texto: 'Nenhuma: o confirm já garantiu a execução.', correta: false, porque: 'confirm prova chegada ao broker, não processamento.' }] },
          tutorDepois: 'Quem impede o segundo efeito não é a fila, é o consumer que consulta antes de executar.',
          callout: 'Você viu o voo voltar inteiro e o dedup evitar o segundo efeito.' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Semântica</th><th>Admite</th><th>Mecanismo</th><th>Quando cabe</th></tr></thead><tbody>' +
          '<tr><td>At-most-once</td><td>Perda</td><td>Sem redelivery, ou ack no recebimento</td><td>Sinal descartável: perder custa menos que repetir</td></tr>' +
          '<tr><td>At-least-once</td><td>Duplicata</td><td>Ack após processamento, redelivery e dedup por identidade</td><td>Job: perder custa mais que deduplicar</td></tr></tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: '"Confirmado, então executado": não', html:
          '<p>Marcar o job como concluído no confirm conta como executado o que só foi enfileirado. Entre o confirm e o efeito moram fila, crash antes do ack, veneno e schema incompatível.</p>' },
        { tipo: 'takeaway', html: '<mark>Confirm</mark> prova chegada ao broker; <mark>ack</mark> depois do processamento prova conclusão. Redelivery é o preço da não-perda.' }
      ] },

      { rotulo: 'Pressão e schema', blocos: [
        { tipo: 'texto', html:
          '<h3>Ordem global, prefetch e concorrência</h3>' +
          '<p><strong>Ordenação global</strong> exige um funil único: um produtor ordenado, uma partição, um consumer por vez. Qualquer paralelismo real quebra a promessa. A saída é <strong>ordem por chave</strong>: mesma chave, mesma partição.</p>' +
          '<p><strong>Prefetch</strong> é quantas mensagens um consumer segura em voo sem ack. Alto esconde latência e aumenta o lote que volta num crash; baixo distribui melhor entre workers rápidos e lentos.</p>' +
          '<h3>Bounded queue e backpressure</h3>' +
          '<p><strong>Bounded queue</strong> é a fila com capacidade declarada: acima dela, publicar falha de modo explícito. <strong>Backpressure</strong> é essa pressão chegando ao produtor como sinal (Reactive Streams 1.0.4 define demanda assíncrona). Sem teto, o producer rápido converte memória do broker em dívida invisível.</p>' +
          '<p>Três sinais: <strong>profundidade</strong> (quantas aguardam), <strong>idade</strong> da mais velha e <strong>trabalho em voo</strong> (sem ack). Profundidade crescente com idade estável indica pico absorvível; idade crescente indica consumer lento ou parado.</p>' +
          '<h3>Evolução de schema</h3>' +
          '<p><strong>Schema</strong> é o contrato da mensagem: nomes, tipos, obrigatoriedade e versão. Adicionar campo opcional é compatível; remover campo, mudar tipo ou reinterpretar valor sem nova versão é ruptura. Um <strong>gate de schema</strong> na entrada aceita versões suportadas e recusa as outras com causa. CloudEvents 1.0.2 dá o envelope; AsyncAPI 3.0.0 documenta canais e mensagens (ambos risco médio, revalidar em até 90 dias).</p>' },
        { tipo: 'transcript', id: 'fila-transcript', titulo: 'Ache as afirmações sem lastro', obrigatorio: false,
          enunciado: 'Um colega relata um pico de carga. Marque as linhas que não se sustentam pelo que o bloco ensina.',
          linhas: [
            { quem: 'voce', texto: 'O que aconteceu no pico de ontem?' },
            { quem: 'agente', texto: 'O producer publicou o triplo da capacidade; a fila limitada recusou com FilaCheia e a profundidade estacionou no teto.' },
            { quem: 'agente', texto: 'Recebemos confirm de todas as publicações aceitas, então todos os jobs foram executados.' },
            { quem: 'ferramenta', texto: 'sinais: profundidade = teto, idade da mais velha subindo, em voo = 6' },
            { quem: 'agente', texto: 'A idade subindo indica que os consumers estão lentos ou parados.' },
            { quem: 'agente', texto: 'Para evitar recusas, vou remover o limite da fila.' }
          ],
          erradas: [2, 5],
          explicacao: { 2: 'confirm prova chegada ao broker; execução só se prova por ack após processamento e pelo ledger.', 5: 'tirar o teto troca recusa explícita por dívida de memória invisível; o conserto é o producer tratar a recusa e dimensionar consumers.' },
          tutorDepois: 'Recusa explícita é o sistema funcionando, não falhando.' },
        { tipo: 'takeaway', html: 'Fila sem teto vira <mark>dívida de memória</mark>; schema sem versão vira <mark>ruptura silenciosa</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'fila-python', titulo: 'Fila limitada com redelivery', obrigatorio: false,
          enunciado: 'Complete a classe <code>Fila</code>: <code>publicar</code> recusa com <code>FilaCheia</code> quando pendentes mais em voo atingem a capacidade; <code>ack</code> tira do voo; <code>crash</code> devolve o voo inteiro com tentativa + 1 e retorna quantas voltaram. Versão reduzida de <code>lab/fila_limitada.py</code>.',
          codigo: "class FilaCheia(RuntimeError):\n    pass\n\n\nclass Fila:\n    def __init__(self, capacidade):\n        self.capacidade = capacidade\n        self.pendentes = []\n        self.em_voo = {}\n\n    def publicar(self, msg_id):\n        # TODO: recuse com FilaCheia quando pendentes + em_voo atingir a capacidade\n        self.pendentes.append((msg_id, 0))\n\n    def entregar(self):\n        msg_id, tentativa = self.pendentes.pop(0)\n        self.em_voo[msg_id] = tentativa\n        return msg_id\n\n    def ack(self, msg_id):\n        # TODO: ack so depois de processar: tira do voo\n        pass\n\n    def crash(self):\n        # TODO: devolva o voo inteiro a fila com tentativa + 1; retorne quantas voltaram\n        return 0\n\n\nf = Fila(2)\nf.publicar(\"a\")\nprint(f.entregar(), f.crash())\n", testes: "def test_recusa_acima_da_capacidade():\n    f = Fila(2)\n    f.publicar(\"a\")\n    f.publicar(\"b\")\n    try:\n        f.publicar(\"c\")\n    except FilaCheia:\n        assert len(f.pendentes) == 2\n    else:\n        raise AssertionError(\"fila sem teto\")\n\n\ndef test_em_voo_ocupa_capacidade():\n    f = Fila(1)\n    f.publicar(\"a\")\n    f.entregar()\n    try:\n        f.publicar(\"b\")\n    except FilaCheia:\n        pass\n    else:\n        raise AssertionError(\"em voo tambem conta\")\n\n\ndef test_crash_antes_do_ack_redelivera_sem_perda():\n    f = Fila(3)\n    f.publicar(\"a\")\n    f.publicar(\"b\")\n    f.entregar()\n    f.entregar()\n    assert f.crash() == 2\n    assert sorted(f.pendentes) == [(\"a\", 1), (\"b\", 1)]\n\n\ndef test_ack_apos_processar_nao_volta():\n    f = Fila(3)\n    f.publicar(\"a\")\n    f.entregar()\n    f.ack(\"a\")\n    assert f.crash() == 0 and f.pendentes == []\n",
          dica: 'A capacidade conta <code>len(self.pendentes) + len(self.em_voo)</code>. No crash, percorra <code>list(self.em_voo.items())</code>, reenfileire com <code>tentativa + 1</code> e limpe o voo.',
          solucao: "class FilaCheia(RuntimeError):\n    pass\n\n\nclass Fila:\n    def __init__(self, capacidade):\n        self.capacidade = capacidade\n        self.pendentes = []\n        self.em_voo = {}\n\n    def publicar(self, msg_id):\n        if len(self.pendentes) + len(self.em_voo) >= self.capacidade:\n            raise FilaCheia(f\"capacidade {self.capacidade} atingida\")\n        self.pendentes.append((msg_id, 0))\n\n    def entregar(self):\n        msg_id, tentativa = self.pendentes.pop(0)\n        self.em_voo[msg_id] = tentativa\n        return msg_id\n\n    def ack(self, msg_id):\n        self.em_voo.pop(msg_id, None)\n\n    def crash(self):\n        voltaram = 0\n        for msg_id, tentativa in list(self.em_voo.items()):\n            self.pendentes.append((msg_id, tentativa + 1))\n            voltaram += 1\n        self.em_voo.clear()\n        return voltaram\n",
          tutorDepois: 'O teste do ack é o controle negativo: mensagem confirmada não volta.',
          callout: 'Teto, ack e redelivery passaram nos testes.' },
        { tipo: 'ordene', id: 'fila-ordene', titulo: 'Ordene o processamento seguro', obrigatorio: false,
          enunciado: 'Coloque em ordem o que o consumer faz com cada mensagem.',
          itens: [
            { id: 'ack', texto: 'Enviar ack ao broker' },
            { id: 'gate', texto: 'Validar o schema no gate (recusar versão sem suporte)' },
            { id: 'recebe', texto: 'Receber a mensagem (entra em voo)' },
            { id: 'persiste', texto: 'Persistir a conclusão' },
            { id: 'dedup', texto: 'Consultar se o message_id já tem efeito' },
            { id: 'efeito', texto: 'Executar o efeito' }],
          solucao: ['recebe', 'gate', 'dedup', 'efeito', 'persiste', 'ack'],
          dica: 'O ack é sempre o último: só depois do processamento e da persistência.' },
        { tipo: 'escolha', id: 'fila-escolha-poison', titulo: 'Confira: a mensagem venenosa',
          pergunta: 'Uma mensagem com payload inválido é redeliverada sem parar e os jobs saudáveis enfileiram atrás dela. O que fazer?',
          opcoes: [
            { id: 'a', texto: 'Aumentar o prefetch para passar por cima dela.', correta: false, porque: 'prefetch maior aumenta o lote perdido no crash e não trata a causa.' },
            { id: 'b', texto: 'Contar falhas por mensagem com teto finito; no teto, quarentena com causa e replay seguro que preserva a identidade.', correta: true, porque: 'é o desenho do <code>lab/quarentena_schema.py</code>: quarentena nunca é descarte silencioso.' },
            { id: 'c', texto: 'Descartá-la na primeira falha.', correta: false, porque: 'descarte sem quarentena observável é perda.' },
            { id: 'd', texto: 'Reiniciar o broker.', correta: false, porque: 'a mensagem volta igual.' }],
          tutorDepois: 'Teto finito protege os saudáveis; a quarentena protege a evidência.' },
        { tipo: 'escolha', id: 'fila-escolha-ordem', titulo: 'Confira: a ordem com dois workers',
          pergunta: 'Dois workers consomem a mesma fila e o job publicado depois conclui antes do anterior. Por quê?',
          opcoes: [
            { id: 'a', texto: 'Bug do broker.', correta: false, porque: 'é o comportamento esperado da concorrência.' },
            { id: 'b', texto: 'A conclusão segue a velocidade de cada worker; ordem só existe com sequência única e um dono por vez, como na partição por chave.', correta: true, porque: 'ordem global exige funil único; por chave, a mesma chave sai em ordem e chaves distintas intercalam.' },
            { id: 'c', texto: 'O prefetch estava baixo demais.', correta: false, porque: 'prefetch não cria ordem entre workers.' },
            { id: 'd', texto: 'Faltou publisher confirm.', correta: false, porque: 'confirm é fronteira producer–broker.' }] },
        { tipo: 'takeaway', html: 'Recebe, valida, <mark>deduplica</mark>, executa, persiste e só então <mark>ack</mark>.' }
      ] }
    ]
  });
})();
