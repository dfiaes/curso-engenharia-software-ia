/* LT02 · Bloco 6: incidente multiworker e defesa das garantias. Fonte: LT02.html#b06. Degradação simulada local; broker e container reais ficam em trilha própria. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasIncidente = function () {
    return [
      { id: 'sinal', nome: 'Sinais', descricao: 'Ler antes de tocar', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python runbook_degradacao.py --semente 42'),
        L('out', 'queue age subindo; in-flight = 4; redelivery de m-17 = 3; DLQ = 0'),
        L('out', 'ledger: 2 efeitos para a intenção res-9')] },
      { id: 'hipotese', nome: 'Hipótese', descricao: 'Com sinal que confirma e que refuta', tom: 'tcp', ms: 1, linhas: [
        L('in', 'hipótese: confirm perdido gerou republish de res-9'),
        L('out', 'confirma se: confirmadas tem res-9 com 2 publicações do mesmo message_id'),
        L('out', 'refuta se: os 2 efeitos têm message_id distintos')] },
      { id: 'conter', nome: 'Conter', descricao: 'Congelar a amplificação', tom: 'tls', ms: 1, linhas: [
        L('out', 'producer pausado acima do orçamento; concorrência limitada; m-17 isolada com causa')] },
      { id: 'reconciliar', nome: 'Reconciliar', descricao: 'Fechar cada unknown', tom: 'request', ms: 2, linhas: [
        L('out', 'started sem conclusão: 2 -> consulta pelo operation ID'),
        L('out', 'efeito presente: concluir sem reefeito; ausente: liberar com a mesma identidade')] },
      { id: 'drenar', nome: 'Drenar', descricao: 'Passadas limitadas', tom: 'response', ms: 3, linhas: [
        L('out', 'drenagem: passadas de no máximo 10, com budget e jitter; backlog 0')] },
      { id: 'provar', nome: 'Provar', descricao: 'Três condições conjuntas', tom: 'ink', ms: 1, linhas: [
        L('out', 'faults desligados: sim; smoke: verde; backlog: 0'),
        L('in', 'veredito: GO (cada intenção com exatamente um efeito no ledger)')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'lt02-b6',
    titulo: 'Incidente multiworker e defesa das garantias',
    minutos: 35,
    resumo: 'Garantia assumida vira garantia provada: hipótese antes do toque, diagnóstico por eliminação, contenção, reconciliação, drenagem sem tempestade e postmortem sem culpa.',
    objetivo: 'Conduzir um incidente com três falhas combinadas (confirm perdido, worker morto em ponto sorteado, upstream ambíguo) até provar os invariantes, e separar garantia projetada, verificada e assumida.',
    revisao: [
      { id: 'lt02b6-hipotese', pergunta: 'Qual a primeira ação diante de duplicatas em produção?',
        opcoes: [
          opc('a', 'Escrever a hipótese com o sinal que confirmaria e o que refutaria, antes de qualquer comando', true, 'comando sem hipótese destrói evidência.'),
          opc('b', 'Reiniciar todos os workers', false, 'converte confirm perdido em duplicata e apaga o in-flight.'),
          opc('c', 'Limpar a fila', false, 'perde mensagens e evidência.')] },
      { id: 'lt02b6-garantias', pergunta: 'Qual garantia sustenta uma afirmação no postmortem?',
        opcoes: [
          opc('a', 'A verificada: passou pelo experimento com semente e contagem externa', true, 'projetada promete; assumida nunca passou.'),
          opc('b', 'A projetada', false, 'é promessa do desenho, não prova.'),
          opc('c', 'A assumida pela equipe', false, 'nunca passou por experimento.')] },
      { id: 'lt02b6-sinais', pergunta: 'Que sinal denuncia mensagem venenosa em formação?',
        opcoes: [
          opc('a', 'Redelivery crescente da mesma mensagem', true, 'queue age denuncia consumer parado; in-flight, crash; DLQ com causa, o destino.'),
          opc('b', 'Queue age estável', false, 'idade estável indica pico absorvível.'),
          opc('c', 'DLQ vazia', false, 'vazia não denuncia nada.')] },
      { id: 'lt02b6-restauracao', pergunta: 'Quais são as três condições da restauração?',
        opcoes: [
          opc('a', 'Faults desligados, smoke verde e backlog drenado sem tempestade, duplicata ou perda', true, 'falta uma, e o veredito é NO-GO com motivo.'),
          opc('b', 'Smoke verde basta', false, 'smoke verde com faults ativos não prova nada.'),
          opc('c', 'Backlog zerado basta', false, 'drenar com duplicata não é restaurar.')] },
      { id: 'lt02b6-rastro', pergunta: 'O que entra no trace context da mensagem?',
        opcoes: [
          opc('a', 'Identidades e contadores do envelope; nunca payload sensível', true, 'atributo sensível deve levantar antes de registrar.'),
          opc('b', 'O payload inteiro, para depurar', false, 'vaza conteúdo e cria alta cardinalidade.'),
          opc('c', 'Só o horário', false, 'sem IDs não há correlação entre saltos.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Incidente, invariante e hipótese antes do toque</h3>' +
          '<p><strong>Incidente</strong> é o desvio observável de uma garantia declarada: fila que envelhece além do contratado, efeito duas vezes no ledger, mensagem que some sem quarentena. <strong>Invariante</strong> é a frase que o incidente tenta quebrar: "cada intenção produz no máximo um efeito lógico", "toda mensagem tem destino observável". A <strong>failure matrix</strong> lista, para cada falha, o invariante ameaçado e o sinal que a denuncia.</p>' +
          '<p>Regra: <strong>hipótese antes de qualquer toque</strong>. Antes de reiniciar, reenviar ou limpar, escreva o que suspeita, o sinal que confirmaria e o sinal que refutaria. Hipótese sem os dois sinais é palpite; comando sem hipótese é destruição de evidência.</p>' +
          '<h3>Três falhas, três assinaturas</h3>' +
          '<ul><li><strong>Confirm perdido</strong>: o broker persistiu e o producer não sabe; republicação com o mesmo <code>message_id</code> encontra confirmada e efeito consultável, e o dedup decide (Bloco 2).</li>' +
          '<li><strong>Worker morto em ponto sorteado</strong>: deixa voo sem ack ou <code>started</code> sem conclusão; redelivery mais reconciliação fecham (Bloco 3).</li>' +
          '<li><strong>Upstream ambíguo</strong>: timeout sem consulta possível; guarda de deadline, orçamento e caso humano (Bloco 4).</li></ul>' +
          '<p>Elimine do mais barato ao mais destrutivo: ler sinais, consultar estados, reconciliar identidades, e só então conter e reparar.</p>' },
        { tipo: 'texto', html:
          '<h3>Observabilidade sem dado sensível</h3>' +
          '<p><strong>Trace context</strong> é a identidade que atravessa producer, broker e consumer: <code>message_id</code>, <code>correlation_id</code>, <code>causation_id</code>, <code>tenant_id</code>, <code>intent_hash</code>, <code>attempt</code> e versão do schema, repassados intactos em cada salto. Quatro sinais operam a fila: <strong>queue age</strong> (consumer parado), <strong>in-flight</strong> (crash com voo devolvido), <strong>redelivery</strong> por mensagem (veneno em formação) e <strong>DLQ</strong> com causa (destino de cada quarentenada). Payload sensível nunca entra em log ou atributo.</p>' },
        { tipo: 'takeaway', html: '<mark>Hipótese</mark> com dois sinais antes do toque; diagnóstico por <mark>assinatura</mark>, do barato ao destrutivo.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'inc-rode', titulo: 'O runbook em ordem fixa', enunciado: 'A semente 42 combina as três falhas. O runbook conduz do sinal ao veredito.',
          prefixo: '$', entrada: 'python runbook_degradacao.py --semente 42', unidade: 'passos', terminalTitulo: 'degradação simulada (exemplo variável)', etapas: etapasIncidente(),
          prever: { pergunta: 'O runbook do lab levanta OrdemViolada se um passo sai de ordem. Qual vem antes da drenagem?', opcoes: [
            { id: 'a', texto: 'Drenar primeiro, para aliviar a fila.', correta: false, porque: 'drenar antes de reconciliar reexecuta started cujo efeito existe.' },
            { id: 'b', texto: 'Conter e depois reconciliar.', correta: true, porque: 'conter antes de reconciliar, reconciliar antes de drenar.' },
            { id: 'c', texto: 'Restaurar o banco.', correta: false, porque: 'restore só entra quando há dado a recuperar, e não substitui a reconciliação.' }] },
          callout: 'Sinais, hipótese, contenção, reconciliação, drenagem e prova, nessa ordem.' },
        { tipo: 'texto', html:
          '<h3>Conter, reconciliar, mitigar</h3>' +
          '<p><strong>Conter</strong> é impedir que o incidente cresça: pausar o producer acima do orçamento, limitar concorrentes, isolar a partição venenosa. <strong>Reconciliar</strong> fecha cada unknown pelo operation ID. <strong>Mitigar</strong> é reduzir o dano enquanto a causa é tratada.</p>' +
          '<p><strong>Patch mínimo</strong> é a menor mudança que fecha a causa sem trocar o desenho; trocar o desenho no meio do incidente cria o segundo incidente. <strong>Regressão que prova</strong> falha antes do patch e passa depois, com semente e ponto declarados.</p>' +
          '<p><strong>Restauração</strong> tem três condições conjuntas: faults desligados no controlador, smoke verde no caminho feliz (publicar, consumir, concluir, consultar o efeito) e backlog drenado até zero sem tempestade, duplicata ou perda. Drenar em passadas limitadas, com budget e jitter.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Projetada, verificada, assumida', html:
          '<p><strong>Projetada</strong> é o que o desenho promete (ack tardio, dedup, orçamento finito). <strong>Verificada</strong> é a projetada que passou pelo experimento com semente e contagem externa. <strong>Assumida</strong> nunca passou. Só a verificada sustenta claim.</p>' },
        { tipo: 'takeaway', html: 'Conter, <mark>reconciliar</mark>, drenar com limite e só então declarar <mark>GO</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'escreva', id: 'inc-escreva', titulo: 'Escreva a hipótese e o incident.md curto',
          enunciado: 'O ledger mostra dois efeitos para <code>res-9</code> logo após um worker morrer. Escreva a hipótese com os dois sinais e os campos mínimos do <code>incident.md</code>.',
          placeholder: 'Hipótese: ...\nConfirma se: ...\nRefuta se: ...\nTimeline / causa / patch / regressão / risco residual: ...',
          rubrica: ['A hipótese nomeia um mecanismo (por exemplo, started sem reconciliação retentado após a morte do worker).', 'Declara o sinal que confirmaria e o que refutaria, consultáveis (ledger, in-flight, confirmadas por message_id).', 'Inclui semente e combinação, timeline por eliminação e causa pelo mecanismo, sem nomear culpado.', 'Inclui patch mínimo, regressão que falha antes e passa depois e risco residual com condição de NO-GO.'],
          modelo: '<p><strong>Hipótese:</strong> o worker morreu após o efeito e antes de persistir; o novo dono retentou sem reconciliar. <strong>Confirma se:</strong> os dois efeitos têm o mesmo operation ID e a intenção estava <code>started</code>. <strong>Refuta se:</strong> os efeitos vêm de message_id distintos com chave diferente. <strong>incident.md:</strong> semente e combinação, invariante ameaçado, timeline, causa pelo mecanismo, patch mínimo (reconciliar antes de retentar), regressão com semente e ponto de falha, risco residual e condição de NO-GO.</p>' },
        { tipo: 'python', id: 'inc-python', titulo: 'O veredito da restauração', obrigatorio: false,
          enunciado: 'Implemente <code>veredito(faults_ligados, smoke_verde, backlog, efeitos_por_chave)</code>: <code>("GO", [])</code> só com as três condições e exatamente um efeito por chave; senão <code>("NO-GO", motivos)</code>. Versão reduzida de <code>lab/prova_restauracao.py</code>.',
          codigo: "def veredito(faults_ligados, smoke_verde, backlog, efeitos_por_chave):\n    \"\"\"GO so com as tres condicoes e sem duplicata/perda. Devolve (veredito, motivos).\"\"\"\n    motivos = []\n    # TODO: faults ligados, smoke vermelho, backlog > 0 -> motivos\n    # TODO: efeito com contagem != 1 (duplicata ou perda) -> motivo\n    return (\"GO\", motivos)\n\n\nprint(veredito(False, True, 0, {\"j1\": 1, \"j2\": 1}))\n", testes: "OK = {\"j1\": 1, \"j2\": 1}\n\n\ndef test_tres_condicoes_e_um_efeito_cada_e_go():\n    assert veredito(False, True, 0, OK) == (\"GO\", [])\n\n\ndef test_falta_uma_condicao_e_no_go_com_motivo():\n    v, m = veredito(True, True, 0, OK)\n    assert v == \"NO-GO\" and m == [\"faults ligados\"]\n    assert veredito(False, False, 0, OK)[0] == \"NO-GO\"\n    assert veredito(False, True, 3, OK)[0] == \"NO-GO\"\n\n\ndef test_duplicata_acusa():\n    assert veredito(False, True, 0, {\"j1\": 2}) == (\"NO-GO\", [\"duplicata em j1\"])\n\n\ndef test_perda_silenciosa_acusa():\n    assert veredito(False, True, 0, {\"j1\": 1, \"j2\": 0}) == (\"NO-GO\", [\"perda em j2\"])\n",
          dica: 'Acumule os motivos numa lista e decida no fim. Percorra <code>sorted(efeitos_por_chave.items())</code>: <code>n &gt; 1</code> é duplicata, <code>n &lt; 1</code> é perda.',
          solucao: "def veredito(faults_ligados, smoke_verde, backlog, efeitos_por_chave):\n    motivos = []\n    if faults_ligados:\n        motivos.append(\"faults ligados\")\n    if not smoke_verde:\n        motivos.append(\"smoke vermelho\")\n    if backlog > 0:\n        motivos.append(\"backlog nao drenado\")\n    for chave, n in sorted(efeitos_por_chave.items()):\n        if n > 1:\n            motivos.append(f\"duplicata em {chave}\")\n        elif n < 1:\n            motivos.append(f\"perda em {chave}\")\n    return (\"NO-GO\" if motivos else \"GO\", motivos)\n",
          tutorDepois: 'O ledger externo decide duplicata e perda; o contador do worker não.',
          callout: 'O veredito exige as três condições e o ledger limpo.' },
        { tipo: 'takeaway', html: 'Postmortem pergunta o que o sistema <mark>permitiu</mark>, nunca quem errou.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'cenario', id: 'inc-cenario', titulo: 'O provedor caiu de novo depois do recovery', obrigatorio: false,
          enunciado: 'A contenção funcionou e os unknowns foram reconciliados. Há 5.000 mensagens no backlog.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Como você drena?', opcoes: [
              { texto: 'Liberar todos os workers de uma vez para zerar rápido.', vai: 'f-tempestade', tom: 'ruim', consequencia: 'passadas ilimitadas viram tempestade e o provedor cai de novo.' },
              { texto: 'Passadas limitadas com budget e jitter, acompanhando erro e idade da fila.', vai: 'prova', tom: 'ok', consequencia: 'a fila cai com erro dentro do contratado.' }] },
            prova: { texto: 'Backlog zerado e smoke verde. Um fault de teste ainda está ligado no controlador. Declara GO?', opcoes: [
              { texto: 'Sim: o smoke passou.', vai: 'f-falso', tom: 'ruim', consequencia: 'smoke com fault ativo não prova o caminho real.' },
              { texto: 'Não: desligar o fault, rodar o smoke de novo e conferir o ledger.', vai: 'f-bom', tom: 'ok', consequencia: 'as três condições conjuntas e um efeito por intenção.' }] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'GO com as três condições provadas e o ledger com um efeito por intenção.' },
            'f-tempestade': { bom: false, texto: 'O provedor caiu de novo e o incidente reabriu.' },
            'f-falso': { bom: false, texto: '"Restaurado" com fault ativo: a garantia era assumida, não verificada.' }
          } },
        { tipo: 'escolha', id: 'inc-escolha-dup', titulo: 'Confira: duplicata após republicar',
          pergunta: 'Logo após republicar "para garantir", aparece uma duplicata. Causa provável e conserto?',
          opcoes: [
            { id: 'a', texto: 'Confirm perdido tratado como perda; consultar confirmadas e efeitos por message_id antes de reenfileirar.', correta: true, porque: 'a duplicata vira dedup quando a consulta precede o republish.' },
            { id: 'b', texto: 'Broker lento; aumentar o prefetch.', correta: false, porque: 'prefetch não decide republish.' },
            { id: 'c', texto: 'Jitter de menos.', correta: false, porque: 'jitter espalha retries, não deduplica.' },
            { id: 'd', texto: 'Schema incompatível.', correta: false, porque: 'schema incompatível é recusado, não duplicado.' }] },
        { tipo: 'takeaway', html: 'Só a garantia <mark>verificada</mark> sustenta claim; restauração exige as <mark>três condições</mark>.' }
      ] }
    ]
  });
})();
