/* LT02 · Bloco 1: falha parcial, tempo, ordem e consistência. Fonte: LT02.html#b01. Fontes científicas citadas no bloco: Gilbert e Lynch (CAP) e Abadi (PACELC), consulta 14/08/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasTimeout = function () {
    return [
      { id: 'envia', nome: 'Pedido', descricao: 'O cliente envia e espera', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python timeout_ambiguo.py --semente 7 --historia concluiu-resposta-perdida'),
        L('info', 'cliente: POST /reservas (chave res-7), prazo 2 unidades lógicas')] },
      { id: 'executa', nome: 'Execução', descricao: 'O executor conclui', tom: 'tcp', ms: 1, linhas: [
        L('out', 'executor: efeito aplicado, ledger = 1'),
        L('hint', 'o cliente não vê nada disto: só o executor sabe')] },
      { id: 'resposta', nome: 'Resposta', descricao: 'A resposta se perde', tom: 'tls', ms: 1, linhas: [
        L('out', 'rede: resposta descartada no caminho de volta')] },
      { id: 'prazo', nome: 'Prazo', descricao: 'O cliente observa silêncio', tom: 'request', ms: 2, linhas: [
        L('in', 'cliente: nenhuma resposta até o prazo -> TIMEOUT'),
        L('hint', 'timeout declara "resposta ausente no prazo", nada sobre o efeito')] },
      { id: 'cego', nome: 'Reenvio cego', descricao: 'Mesma chamada, sem identidade', tom: 'response', ms: 1, linhas: [
        L('cmd', 'reenviar igual (sem chave de idempotência)'),
        L('out', 'executor: efeito aplicado de novo, ledger = 2'),
        L('in', 'veredito do ledger: DUPLICATA (1 intenção, 2 efeitos)')] },
      { id: 'certo', nome: 'Caminho sênior', descricao: 'Desconhecido, reconciliar, só então decidir', tom: 'ink', ms: 1, linhas: [
        L('out', 'estado do job: desconhecido (não "não executou")'),
        L('cmd', 'reconciliar: perguntar ao executor pela operação res-7'),
        L('in', 'executor: res-7 concluída -> conclui sem reexecutar; ledger = 1')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'lt02-b1',
    titulo: 'Falha parcial, tempo, ordem e consistência',
    minutos: 35,
    resumo: 'Sem relógio nem estado global instantâneos, timeout é observação ambígua e consistência é um contrato com fronteira, não uma aura.',
    objetivo: 'Tratar timeout como estado desconhecido, nomear os quatro modos de falha da mensagem, separar linearizability de serializability e decidir recusar ou reconciliar por requisito.',
    revisao: [
      { id: 'lt02b1-timeout', pergunta: 'O que um timeout declara?',
        opcoes: [
          opc('a', 'Que não chegou resposta até o prazo; o efeito pode ter acontecido ou não', true, 'quatro histórias são indistinguíveis para quem espera: pedido perdido, execução em curso, concluída com resposta perdida, concluída com resposta ilegível.'),
          opc('b', 'Que a operação não executou', false, 'declarar "não executou" e retentar às cegas converte ambiguidade em duplicata.'),
          opc('c', 'Que o executor está fora do ar', false, 'lentidão e rede ruim produzem o mesmo silêncio.')] },
      { id: 'lt02b1-modos', pergunta: 'Quais são os quatro modos de falha da mensagem?',
        opcoes: [
          opc('a', 'Duplicação, atraso, perda e reordenação', true, 'cada um tem mecanismo típico e pede um desenho: dedup, deadline, ack tardio, ordenação por chave.'),
          opc('b', 'Latência, jitter, throughput e erro', false, 'são métricas, não transformações da mensagem.'),
          opc('c', 'Perda, corrupção, spam e eco', false, 'a lista do bloco são as quatro transformações entre participantes.')] },
      { id: 'lt02b1-lin', pergunta: 'Qual a diferença entre linearizability e serializability?',
        opcoes: [
          opc('a', 'Linearizability fala de operações num objeto, com tempo real; serializability fala de transações, com equivalência a alguma ordem serial', true, 'terminado-antes implica visível-depois só na primeira; a segunda não vincula a ordem ao relógio.'),
          opc('b', 'São sinônimos de consistência forte', false, 'o objeto e a ordem prometida são distintos.'),
          opc('c', 'Serializability exige tempo real; linearizability não', false, 'é o inverso.')] },
      { id: 'lt02b1-cap', pergunta: 'Como decidir sob partição?',
        opcoes: [
          opc('a', 'Por requisito e por operação: recusar preserva a ordem única, aceitar e reconciliar preserva a resposta', true, 'cada escolha tem custo declarado; PACELC acrescenta que fora da partição ainda há latência contra consistência.'),
          opc('b', 'Rotulando o sistema inteiro como CP ou AP', false, 'o rótulo não diz o que acontece com a escrita recusada nem quem reconcilia.'),
          opc('c', 'Escolhendo dois entre consistência, disponibilidade e partição', false, '"escolha dois" sugere uma decisão única; a escolha é por requisito.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Quando a operação sai do processo, ninguém vê o agora</h3>' +
          '<p>O LT01 mostrou o caminho entre a requisição e o processo que a atende e ensinou que deadline é orçamento, não profecia. Este bloco começa onde ele para: a operação lenta, cara ou não determinística sai do processo HTTP e passa a ser executada por vários workers que não compartilham relógio nem memória.</p>' +
          '<p><strong>Sistema distribuído</strong> é um conjunto de participantes que coordenam trabalho trocando mensagens por uma rede que pode atrasar, duplicar, perder e reordenar. A definição é negativa: não existe <strong>relógio global</strong> instantâneo nem <strong>estado global</strong> instantâneo. Cada participante conhece o próprio estado agora e o passado que as mensagens contaram.</p>' +
          '<ul><li>Relógios locais divergem, e a diferença anda. Ordenar eventos de participantes distintos por carimbo local é ordenar por instrumentos que discordam.</li>' +
          '<li>"O estado do sistema" é uma ficção útil apenas dentro de uma fronteira declarada.</li>' +
          '<li>Sintomas da suposição de globalidade: código que compara carimbos de máquinas distintas como um só relógio, teste que presume "todos veem a escrita ao mesmo tempo", runbook que pergunta "qual é o estado atual".</li></ul>' },
        { tipo: 'texto', largo: true, html:
          '<h3>O vocabulário congelado: cinco portas e um envelope</h3>' +
          '<p>A trilha conversa por contratos, não por produtos. <strong>Porta</strong> é o contrato mínimo (um <code>typing.Protocol</code>) que qualquer implementação precisa satisfazer. Se dois adapters passam na mesma suíte, o domínio não os distingue dentro da semântica testada.</p>' +
          '<table><thead><tr><th>Porta</th><th>O que o domínio pede</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td><code>MessageBus</code></td><td>Publicar, entregar e confirmar mensagens, com partição controlável no fake</td><td>Não promete ordem global nem ausência de duplicata, só o que a suíte verifica</td></tr>' +
          '<tr><td><code>JobRepository</code></td><td>Persistir o estado do job (criado, em curso, concluído, desconhecido)</td><td>Estado persistido não é efeito executado</td></tr>' +
          '<tr><td><code>IdempotencyStore</code></td><td>Guardar identidade da intenção e resposta, com concorrência e expiração (Bloco 3)</td><td>Chave em memória não é idempotência</td></tr>' +
          '<tr><td><code>EffectLedger</code></td><td>Contar os efeitos reais no mundo externo simulado</td><td>É o oráculo: acusa duplicata, não a impede</td></tr>' +
          '<tr><td><code>Clock</code></td><td>Tempo e prazos controláveis, com avanço explícito nos testes</td><td>Relógio de teste mede ordem e prazo, nunca latência de produção</td></tr></tbody></table>' +
          '<p><strong>CloudEvents</strong> é o envelope interoperável: <code>message_id</code>, <code>correlation_id</code>, <code>causation_id</code>, <code>tenant_id</code>, <code>intent_hash</code>, <code>attempt</code>, <code>occurred_at</code>, <code>deadline_at</code> e versão do schema, sem dado sensível. <strong>AsyncAPI</strong> é o contrato documentado dos canais.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Invariante, padrão aberto, adapter', html:
          '<p>Portas e campos do envelope são o <strong>invariante</strong>: valem para qualquer transporte. CloudEvents e AsyncAPI são o <strong>padrão aberto</strong>. O fake determinístico e o adapter de produto são <strong>adapters</strong>, intercambiáveis sob a mesma suíte. Nenhum comportamento observado num adapter é atribuído ao domínio.</p>' },
        { tipo: 'takeaway', html: 'Não existe <mark>agora global</mark>: cada participante sabe o próprio estado e o passado que as <mark>mensagens</mark> contaram.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Timeout é observação ambígua, nunca veredito</h3>' +
          '<p><strong>Timeout</strong> é a expiração de um prazo de espera. Entre o pedido e o silêncio cabem pelo menos quatro histórias indistinguíveis para quem espera: o pedido nunca chegou; chegou e a execução ainda está em curso; a execução concluiu e a resposta se perdeu; a execução concluiu e a resposta chegou ilegível. A regra é absoluta: <strong>timeout nunca é classificado automaticamente como "operação não executou"</strong>.</p>' +
          '<p>O caminho sênior tem ordem fixa: registrar o estado como <strong>desconhecido</strong>, reconciliar pela identidade da operação (perguntar ao executor o que aconteceu) e só então decidir. Abaixo, a história "concluiu, resposta perdida", com e sem identidade.</p>' },
        { tipo: 'rode', id: 'dist-rode-timeout', titulo: 'O reenvio que cobra duas vezes', enunciado: 'Rode a simulação com semente 7. Cada etapa mostra o que o cliente vê e o que só o executor sabe.',
          prefixo: '$', entrada: 'python timeout_ambiguo.py --semente 7 --historia concluiu-resposta-perdida', unidade: 'passos', terminalTitulo: 'simulação (exemplo variável)', etapas: etapasTimeout(),
          prever: { pergunta: 'O primeiro pedido concluiu, a resposta se perdeu e o cliente reenvia igual, sem chave. Quantos efeitos o ledger terá?', opcoes: [
            { id: 'a', texto: 'Um: o timeout garante que a primeira tentativa não executou.', correta: false, porque: 'timeout não diz nada sobre o efeito; nesta história o efeito aconteceu.' },
            { id: 'b', texto: 'Dois: a segunda tentativa executa de novo o que já tinha concluído.', correta: true, porque: 'sem identidade da intenção, as quatro histórias parecem uma só e o reenvio vira duplicata (cobrança dupla, reserva dupla, e-mail duplo).' },
            { id: 'c', texto: 'Zero: a rede descartou tudo.', correta: false, porque: 'só a resposta foi descartada; o efeito já estava no ledger.' }] },
          tutorDepois: 'O ledger conta efeitos, não tentativas. Quem conta tentativas acha que está tudo bem.',
          callout: 'Timeout virou estado desconhecido, e o ledger mostrou quando o reenvio cego vira duplicata.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Os quatro modos de falha da mensagem</h3>' +
          '<table><thead><tr><th>Modo</th><th>Mecanismo típico</th><th>O que o desenho precisa prever</th></tr></thead><tbody>' +
          '<tr><td>Duplicação</td><td>Redelivery após crash antes do ack; confirm perdido que provoca republish; retry sobre timeout ambíguo</td><td>Efeito idempotente por identidade da intenção e dedup no consumo (Blocos 2 e 3); contar efeitos no ledger, não tentativas</td></tr>' +
          '<tr><td>Atraso</td><td>Fila profunda, consumidor lento, partição que isola e depois descarrega o acumulado</td><td>Deadline por tentativa e do job; mensagem velha fora do prazo é descartada ou reconciliada, nunca executada às cegas</td></tr>' +
          '<tr><td>Perda</td><td>Crash entre receber e persistir; ack prematuro; descarte silencioso por limite sem quarentena</td><td>Ack somente após processamento e persistência; redelivery ou reconciliação no desenho</td></tr>' +
          '<tr><td>Reordenação</td><td>Partição por chave com consumidores em velocidades distintas; retries que ultrapassam a tentativa original</td><td>Ordenação declarada por chave quando a ordem é requisito, com versão ou sequência que detecte o fora-de-ordem</td></tr></tbody></table>' },
        { tipo: 'takeaway', html: 'Timeout declara <mark>resposta ausente</mark>; o estado vira <mark>desconhecido</mark> e pede reconciliação por identidade, nunca reenvio cego.' }
      ] },

      { rotulo: 'Consistência e decisão', blocos: [
        { tipo: 'texto', html:
          '<h3>Consistência é um contrato de visibilidade com fronteira</h3>' +
          '<p><strong>Consistência</strong> é o contrato entre escrita e leitura: dada uma escrita confirmada, o que cada leitor subsequente vê e a partir de quando. <strong>Consistência forte</strong>: existe um instante a partir do qual toda leitura vê a escrita, como se houvesse uma ordem única; o preço é disponibilidade ou latência. <strong>Consistência eventual</strong>: sem novas escritas, as réplicas convergem, sem prazo prometido.</p>' +
          '<p>Entre os extremos moram garantias centradas no cliente:</p>' +
          '<ul><li><strong>Read-your-writes</strong>: depois de escrever, as leituras do mesmo cliente veem a escrita.</li>' +
          '<li><strong>Monotonic reads</strong>: uma vez lido um valor, o cliente nunca volta a um valor mais antigo.</li></ul>' +
          '<p>"O sistema é consistente" sem dizer qual garantia é frase de marketing interno. A pergunta sênior é a quíntupla: qual escrita, qual leitor, qual atraso máximo, sob qual falha, com que custo.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Pergunta</th><th>Linearizability</th><th>Serializability</th></tr></thead><tbody>' +
          '<tr><td>Sobre o quê?</td><td>Operações isoladas num objeto</td><td>Transações multioperação</td></tr>' +
          '<tr><td>Que ordem promete?</td><td>A do tempo real: terminado-antes implica visível-depois</td><td>Alguma ordem serial equivalente, sem vínculo com o relógio</td></tr>' +
          '<tr><td>O que o teste observa?</td><td>Leitura iniciada após escrita concluída vê a escrita</td><td>Anomalias de isolamento ausentes (Bloco 5)</td></tr>' +
          '<tr><td>Confusão típica</td><td>Cobrar tempo real de lote transacional</td><td>Achar que "serial" é "na ordem em que terminaram"</td></tr></tbody></table>' },
        { tipo: 'texto', html:
          '<h3>CAP sob partição, PACELC fora dela</h3>' +
          '<p><strong>Partição</strong> é a perda, total ou parcial, transitória ou duradoura, da comunicação entre participantes que continuam operando. É o modo de falha que a rede oferece por padrão. O resultado formal de Gilbert e Lynch descreve o que ocorre durante a partição: nenhum sistema é ao mesmo tempo consistente e disponível em todos os participantes. A decisão é por requisito e por operação:</p>' +
          '<ul><li><strong>Recusar</strong> a escrita preserva a ordem única; o custo é indisponibilidade visível do lado isolado.</li>' +
          '<li><strong>Aceitar e reconciliar</strong> preserva a resposta; o custo é divergência temporária e reconciliação testada.</li>' +
          '<li><strong>PACELC</strong> (Abadi) acrescenta o que o slogan esconde: sem partição, ainda há trade-off entre latência e consistência. Responder da réplica próxima serve dado levemente velho; o dado mais novo exige ida e volta ao decisor.</li></ul>' +
          '<p>Fontes científicas consultadas em 14/08/2026.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: '"Somos AP, então sempre respondemos": não', html:
          '<p>Rotular o sistema inteiro com uma letra converte decisão por requisito em identidade tribal. O rótulo não diz o que acontece com a escrita recusada, quem reconcilia, por quanto tempo o leitor vê o velho nem o custo. ADR sério não contém "escolhemos disponibilidade": contém contexto, alternativas, decisão, consequências e o experimento que a sustenta.</p>' },
        { tipo: 'takeaway', html: 'Consistência tem <mark>fronteira</mark>: diga qual escrita, qual leitor, qual atraso e qual falha; sob partição, decida <mark>por requisito</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'escreva', id: 'dist-escreva-linha', titulo: 'Escreva a linha da tabela de decisão',
          enunciado: 'A saída do bloco é a tabela requisito → falha → decisão → garantia → custo. Requisito: "a reserva de orçamento não pode vender o mesmo saldo duas vezes". Escreva a linha.',
          placeholder: 'Falha temida: ...\nDecisão: ...\nGarantia (com fronteira): ...\nCusto: ...',
          rubrica: ['Nomeia a falha concreta: partição entre réplicas durante duas reservas concorrentes.', 'Escolhe <strong>recusar</strong> a escrita no lado que não alcança o decisor e justifica pela ordem única.', 'Declara a fronteira da garantia: vale durante a partição, com erro explícito em vez de promessa.', 'Declara o custo: indisponibilidade visível do lado isolado e fila de nova tentativa com identidade.'],
          modelo: '<p><strong>Falha:</strong> partição entre réplicas durante duas reservas concorrentes. <strong>Decisão:</strong> recusar a escrita no lado que não alcança o decisor. <strong>Garantia:</strong> ordem única das reservas, com erro explícito em vez de promessa, válida durante a partição. <strong>Custo:</strong> indisponibilidade visível do lado isolado e fila de nova tentativa com identidade.</p>' },
        { tipo: 'cenario', id: 'dist-cenario', titulo: 'O autor não vê o que acabou de publicar', obrigatorio: false,
          enunciado: 'Depois de publicar, o autor recarrega e não vê a alteração: a leitura foi roteada a uma réplica atrasada. O contador de visitas, por outro lado, aceita divergência temporária.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Qual garantia você promete ao autor?', opcoes: [
              { texto: 'Consistência forte global em todas as leituras do produto.', vai: 'f-caro', tom: 'ruim', consequencia: 'paga latência e disponibilidade em leituras que não precisam.' },
              { texto: 'Read-your-writes por sessão: o autor lê do lado que confirmou ou espera a convergência da própria escrita.', vai: 'contador', tom: 'ok', consequencia: 'visibilidade própria imediata, sem ordem global, válida por sessão.' },
              { texto: 'Dizer que o sistema é eventualmente consistente e seguir.', vai: 'f-slogan', tom: 'ruim', consequencia: 'sem prazo nem fronteira, o autor continua vendo o próprio passado.' }] },
            contador: { texto: 'E o contador agregado, com incrementos dos dois lados durante a partição?', opcoes: [
              { texto: 'Aceitar dos dois lados e reconciliar por soma na reconexão, com cenário de teste.', vai: 'f-bom', tom: 'ok', consequencia: 'convergência eventual após o fim das escritas; leitores veem valores distintos no intervalo.' },
              { texto: 'Recusar incrementos no lado isolado, como na reserva de saldo.', vai: 'f-caro', tom: 'ruim', consequencia: 'trata um contador tolerante como se fosse saldo, pagando indisponibilidade à toa.' }] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Cada requisito recebeu sua garantia, sua fronteira e seu custo: read-your-writes para o autor, soma reconciliada para o contador.' },
            'f-caro': { bom: false, texto: 'Uma decisão única para tudo: o sistema ficou lento ou indisponível onde não precisava.' },
            'f-slogan': { bom: false, texto: '"Eventualmente consistente" sem prazo nem sessão: o usuário continua vendo o passado.' }
          },
          callout: 'Você decidiu por requisito: garantia de sessão para o autor, reconciliação para o contador.' },
        { tipo: 'python', id: 'dist-python', titulo: 'Leitura monotônica e timeout como desconhecido', obrigatorio: false,
          enunciado: 'Implemente <code>ler_monotonica(vistas, leitor, replica_versao)</code> (o leitor nunca volta no tempo; atualize <code>vistas</code>) e <code>ler_com_prazo</code>, que levanta <code>EstadoDesconhecido</code> quando <code>no_prazo</code> é falso. É o contrato de <code>lab/leituras_consistencia.py</code>, em memória.',
          codigo: "class EstadoDesconhecido(RuntimeError):\n    pass\n\n\ndef ler_monotonica(vistas, leitor, replica_versao):\n    \"\"\"Leitor nunca volta no tempo: guarda e devolve o maximo.\"\"\"\n    # TODO: maximo entre o que o leitor ja viu e a versao da replica; atualize vistas\n    return replica_versao\n\n\ndef ler_com_prazo(vistas, leitor, replica_versao, no_prazo):\n    \"\"\"Sem resposta no prazo: estado desconhecido, nunca 'nao executou'.\"\"\"\n    # TODO: levante EstadoDesconhecido quando no_prazo for False\n    return ler_monotonica(vistas, leitor, replica_versao)\n\n\nv = {}\nprint(ler_monotonica(v, \"ana\", 5), ler_monotonica(v, \"ana\", 3))\n", testes: "def test_nao_volta_no_tempo():\n    v = {}\n    assert ler_monotonica(v, \"ana\", 5) == 5\n    assert ler_monotonica(v, \"ana\", 3) == 5\n\n\ndef test_primeira_leitura_e_avanco():\n    v = {}\n    assert ler_monotonica(v, \"ana\", 2) == 2\n    assert ler_monotonica(v, \"ana\", 7) == 7\n\n\ndef test_timeout_vira_desconhecido():\n    v = {}\n    try:\n        ler_com_prazo(v, \"ana\", 4, False)\n    except EstadoDesconhecido:\n        assert \"ana\" not in v\n    else:\n        raise AssertionError(\"timeout nao pode virar leitura\")\n\n\ndef test_leitores_independentes():\n    v = {}\n    ler_monotonica(v, \"ana\", 9)\n    assert ler_monotonica(v, \"bia\", 2) == 2\n",
          dica: 'Use <code>max(vistas.get(leitor, 0), replica_versao)</code> e grave o resultado em <code>vistas[leitor]</code>. Com o prazo estourado, levante a exceção antes de tocar <code>vistas</code>.',
          solucao: "class EstadoDesconhecido(RuntimeError):\n    pass\n\n\ndef ler_monotonica(vistas, leitor, replica_versao):\n    vista = max(vistas.get(leitor, 0), replica_versao)\n    vistas[leitor] = vista\n    return vista\n\n\ndef ler_com_prazo(vistas, leitor, replica_versao, no_prazo):\n    if not no_prazo:\n        raise EstadoDesconhecido(f\"sem resposta para {leitor!r} dentro do prazo\")\n    return ler_monotonica(vistas, leitor, replica_versao)\n",
          tutorDepois: 'Repare que o timeout não grava nada: o estado do leitor só muda quando há resposta.',
          callout: 'A leitura monotônica e o estado desconhecido passaram nos testes.' },
        { tipo: 'escolha', id: 'dist-escolha-timeout', titulo: 'Confira: o timeout',
          pergunta: 'Um POST de reserva deu timeout. O que o job deve registrar e qual o próximo passo?',
          opcoes: [
            { id: 'a', texto: 'Falhou; reenviar a mesma chamada imediatamente.', correta: false, porque: 'se a primeira concluiu em silêncio, o reenvio executa de novo.' },
            { id: 'b', texto: 'Desconhecido; reconciliar pela identidade da operação antes de qualquer nova tentativa.', correta: true, porque: 'a ordem é desconhecido, reconciliar pela chave e só então decidir.' },
            { id: 'c', texto: 'Concluído; o provedor costuma responder.', correta: false, porque: 'ausência de resposta não prova conclusão.' },
            { id: 'd', texto: 'Não executou; descartar o job.', correta: false, porque: 'descartar perde a intenção se o efeito aconteceu ou ainda acontecerá.' }],
          tutorDepois: 'Timeout é ausência de resposta, não ausência de efeito.' },
        { tipo: 'escolha', id: 'dist-escolha-lin', titulo: 'Confira: linearizability ou serializability',
          pergunta: 'Dois lotes transacionais concorrentes terminam numa ordem serial que contradiz quem terminou primeiro no relógio, mas o resultado equivale a uma execução em série. O que isso viola?',
          opcoes: [
            { id: 'a', texto: 'Serializability, porque a ordem não segue o tempo real.', correta: false, porque: 'serializability promete equivalência a alguma ordem serial, não fidelidade ao relógio.' },
            { id: 'b', texto: 'Nada em serializability; exigir tempo real é contrato de linearizability, que fala de operações num objeto.', correta: true, porque: 'o objeto e a ordem prometida diferem: transações contra operações, equivalência serial contra tempo real.' },
            { id: 'c', texto: 'Read-your-writes.', correta: false, porque: 'é uma garantia por sessão de cliente, outro assunto.' },
            { id: 'd', texto: 'Monotonic reads.', correta: false, porque: 'também é garantia por cliente, não sobre transações.' }],
          tutorDepois: '"Serial" não é "na ordem em que terminaram".' },
        { tipo: 'takeaway', html: 'Timeout é <mark>desconhecido</mark>; consistência é <mark>contrato com fronteira</mark>; decisão é <mark>por requisito</mark>.' }
      ] }
    ]
  });
})();
