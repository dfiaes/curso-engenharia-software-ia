/* LT02 · Bloco 5: transações, WAL, replicação, backup, PITR e retenção. Fonte: LT02.html#b05. SQLite local ensina; PostgreSQL real fica em trilha própria. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasPitr = function () {
    return [
      { id: 'journal', nome: 'Journal', descricao: 'Sequência numerada de mudanças', tom: 'dns', ms: 3, linhas: [
        L('cmd', 'python pitr_journal.py --excluir job-1 --restaurar-ate 2'),
        L('out', 'seq 1 set job-1 = A'), L('out', 'seq 2 set job-2 = B')] },
      { id: 'exclui', nome: 'Exclusão válida', descricao: 'O banco obedeceu', tom: 'tcp', ms: 1, linhas: [
        L('in', 'seq 3 del job-1 (transação válida, sem erro)')] },
      { id: 'replica', nome: 'Réplica', descricao: 'Repete o erro', tom: 'tls', ms: 1, linhas: [
        L('out', 'réplica: aplicou seq 3, job-1 ausente'),
        L('hint', 'réplica reduz indisponibilidade; não recupera exclusão replicada')] },
      { id: 'valida', nome: 'Validar backup', descricao: 'Manifesto e checksum', tom: 'request', ms: 1, linhas: [
        L('out', 'manifesto presente; sha256 confere; sequência contínua 1..3; destino isolado gravável')] },
      { id: 'restaura', nome: 'PITR isolado', descricao: 'Rejoga até antes da causa', tom: 'response', ms: 2, linhas: [
        L('out', 'instância isolada: base + journal até seq 2'),
        L('out', 'consulta: job-1 = A, job-2 = B')] },
      { id: 'origem', nome: 'Origem intacta', descricao: 'Restore não sobrescreve', tom: 'ink', ms: 1, linhas: [
        L('in', 'origem: job-1 segue ausente; nada sobrescrito'),
        L('hint', 'tempos de restore medidos viram o RTO observado')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'lt02-b5',
    titulo: 'Transações, WAL, replicação, backup, PITR e retenção',
    minutos: 35,
    resumo: 'Réplica não é backup: durabilidade se prova com isolamento declarado, WAL antes do commit, backup verificado e restauração ensaiada em destino isolado.',
    objetivo: 'Explicar ACID e os limites da transação, reconhecer anomalias de isolamento, situar o WAL na durabilidade, tratar stale read por requisito e recuperar exclusão acidental com PITR e backup com checksum.',
    revisao: [
      { id: 'lt02b5-limite', pergunta: 'O que a transação não protege?',
        opcoes: [
          opc('a', 'Efeito externo já emitido e dado apagado por transação posterior válida', true, 'ela protege o que está dentro dela, no banco que a executa, enquanto dura.'),
          opc('b', 'A atomicidade das próprias escritas', false, 'isso ela protege.'),
          opc('c', 'Nada: ACID cobre tudo', false, 'efeito externo e exclusão válida pedem outros mecanismos.')] },
      { id: 'lt02b5-lost', pergunta: 'O saldo some sob concorrência sem erro no log. Qual anomalia?',
        opcoes: [
          opc('a', 'Atualização perdida: duas transações leem a mesma versão e gravam às cegas', true, 'o nível forte verifica versão e aborta com causa.'),
          opc('b', 'Stale read', false, 'stale read é leitura em réplica atrasada.'),
          opc('c', 'Perda de WAL', false, 'o commit existiu; uma soma apagou a outra.')] },
      { id: 'lt02b5-wal', pergunta: 'O banco respondeu "commit ok" e a linha sumiu após o crash. Falha provável?',
        opcoes: [
          opc('a', 'Confirmação dada antes de o WAL ser sincronizado em disco', true, 'durabilidade mora no log confirmado, não na resposta entregue.'),
          opc('b', 'Réplica atrasada', false, 'afeta leituras, não a perda de commit no primário.'),
          opc('c', 'Isolamento forte demais', false, 'isolamento não decide durabilidade.')] },
      { id: 'lt02b5-replica', pergunta: 'Por que réplica não é backup?',
        opcoes: [
          opc('a', 'Porque repete o primário, inclusive a exclusão válida e a corrupção confirmada', true, 'HA mantém no ar; DR reconstrói a partir de base mais diário.'),
          opc('b', 'Porque é sempre síncrona', false, 'síncrona ou não, ela replica o erro.'),
          opc('c', 'Porque fica em outra região', false, 'região não muda o que ela copia.')] },
      { id: 'lt02b5-backup', pergunta: 'Quando um backup existe de fato?',
        opcoes: [
          opc('a', 'Depois de um restore ensaiado com checksum conferido em destino isolado', true, 'backup sem restore ensaiado é arquivo, nunca garantia.'),
          opc('b', 'Quando o job de backup termina sem erro', false, 'terminar não prova que restaura.'),
          opc('c', 'Quando há réplica', false, 'réplica não é backup.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>ACID e os limites da transação</h3>' +
          '<p><strong>Transação</strong> é a unidade de confirmação: leituras e escritas que confirmam juntas ou desfazem juntas. <strong>Atomicidade</strong>: tudo ou nada. <strong>Consistência</strong>: as regras declaradas do banco valem antes e depois. <strong>Isolamento</strong>: o quanto transações concorrentes se enxergam. <strong>Durabilidade</strong>: o confirmado sobrevive a crash.</p>' +
          '<p>Limite: a transação protege o que está dentro dela, no banco que a executa, enquanto dura. Não protege efeito externo já emitido, não ordena workers por si só e não recupera dado apagado por transação posterior válida.</p>' +
          '<h3>Isolamento e anomalias</h3>' +
          '<p><strong>Nível de isolamento</strong> é o contrato sobre quais intermediários concorrentes uma transação pode observar. Mais fraco, mais concorrência e mais anomalias; mais forte, mais espera, aborto ou custo.</p>' +
          '<ul><li><strong>Lost update</strong> (atualização perdida): duas transações leem o mesmo valor, cada uma soma a sua parte e grava; uma soma some.</li>' +
          '<li><strong>Write skew</strong> (viés de escrita): cada transação conclui que a sua escrita é segura; juntas, violam uma regra que cada uma preservava sozinha.</li>' +
          '<li><strong>Leitura não repetível e fantasma</strong>: a mesma consulta devolve valores ou linhas distintas dentro da transação.</li></ul>' +
          '<p>Concorrência <strong>pessimista</strong> trava antes (custo: espera e impasse). <strong>Otimista</strong> verifica a versão na gravação e aborta com causa se mudou (custo: retrabalho sob contenção).</p>' },
        { tipo: 'takeaway', html: 'Transação protege o que está <mark>dentro dela</mark>; o nível de isolamento é escolhido <mark>por operação</mark>.' }
      ] },

      { rotulo: 'Durabilidade e réplicas', blocos: [
        { tipo: 'texto', html:
          '<h3>WAL: o log antes das páginas</h3>' +
          '<p><strong>WAL</strong> (write-ahead log) é o diário que o banco escreve antes de aplicar a mudança nas páginas de dados. Crash no intervalo perde páginas, nunca o log: o banco refaz a partir dele. A falha a nomear é o <strong>commit reconhecido antes da durabilidade esperada</strong>: confirmação do sistema operacional, replicação síncrona pendente ou driver que confirma cedo. Confirmar antes do fsync é promessa sem lastro.</p>' +
          '<h3>Réplicas e stale read por requisito</h3>' +
          '<p><strong>Replicação</strong> copia as confirmações do primário. <strong>Síncrona</strong>: a confirmação só volta após ao menos uma réplica acusar recebimento. <strong>Assíncrona</strong>: confirma antes, e a réplica fica atrás pelo <strong>lag</strong>. <strong>Stale read</strong> é a leitura que devolve versão anterior à última confirmada.</p>' +
          '<ul><li>Caminho que exige o novo (autor lendo o que escreveu, reserva conferindo saldo): ler do primário ou exigir versão mínima.</li>' +
          '<li>Caminho tolerante (relatório): servir da réplica dentro de uma idade declarada.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: '"Tem réplica, então tem backup": não', html:
          '<p>A réplica repete o primário, incluindo o erro: exclusão válida, corrupção confirmada e comando destrutivo chegam pelo mesmo canal das escritas boas. Réplica reduz indisponibilidade (HA); reconstrução (DR) pede base mais diário.</p>' },
        { tipo: 'takeaway', html: 'Durabilidade mora no <mark>log confirmado</mark>; réplica <mark>repete o erro</mark>.' }
      ] },

      { rotulo: 'Ver e praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Exclusão acidental, PITR e backup verificado</h3>' +
          '<p><strong>Exclusão acidental</strong> é a transação válida que apaga o dado errado: sem erro, sem violação, sem sinal. <strong>PITR</strong> (point-in-time recovery) volta a um instante entre backups: base do último backup íntegro mais o diário rejogado até imediatamente antes da exclusão, sempre em instância isolada, nunca sobre a origem, com validação por consulta.</p>' +
          '<p><strong>Base backup</strong> é a fotografia completa; <strong>WAL archive</strong> é a sequência de diários que a leva a qualquer ponto posterior. <strong>RPO</strong> é quanto dado se aceita perder; <strong>RTO</strong> é quanto tempo se aceita para voltar. Todo restore valida antes de promover: manifesto, checksum, sequência contínua e destino isolado gravável. Qualquer violação falha visível, sem promover evidência parcial.</p>' +
          '<p>Retenção, deleção e <strong>legal hold</strong> (bloqueio de deleção por obrigação legal) entram no mesmo desenho: guardar pelo prazo declarado e apagar quando ele vence, salvo hold ativo.</p>' },
        { tipo: 'rode', id: 'dur-rode', titulo: 'Recupere o job excluído', enunciado: 'Uma transação válida apaga job-1. Restaure em instância isolada até a sequência anterior à exclusão.',
          prefixo: '$', entrada: 'python pitr_journal.py --excluir job-1 --restaurar-ate 2', unidade: 'passos', terminalTitulo: 'journal local (exemplo variável)', etapas: etapasPitr(),
          prever: { pergunta: 'A réplica pode devolver o job-1?', opcoes: [
            { id: 'a', texto: 'Sim: a réplica guarda uma cópia.', correta: false, porque: 'a exclusão válida chegou à réplica pelo mesmo canal.' },
            { id: 'b', texto: 'Não: só o PITR a partir de base mais diário, até a sequência 2, em destino isolado.', correta: true, porque: 'exclusão válida não tem desfazer; rejoga-se até antes da causa.' },
            { id: 'c', texto: 'Sim, se for síncrona.', correta: false, porque: 'síncrona replica o erro mais depressa.' }] },
          callout: 'job-1 voltou na instância isolada; a origem não foi tocada.' },
        { tipo: 'python', id: 'dur-python', titulo: 'PITR e checksum', obrigatorio: false,
          enunciado: 'Implemente <code>restaurar_ate(journal, seq_limite)</code>, que rejoga <code>set</code> e <code>del</code> até a sequência limite inclusive, e <code>verificar(conteudo, checksum_manifesto)</code>, que levanta <code>BackupInvalido</code> se o sha256 diverge. Contratos de <code>lab/pitr_journal.py</code> e <code>lab/backup_verificado.py</code>, em memória.',
          codigo: "import hashlib\n\n\nclass BackupInvalido(RuntimeError):\n    pass\n\n\ndef restaurar_ate(journal, seq_limite):\n    \"\"\"journal: [(seq, op, chave, valor)]; devolve o estado ate seq_limite inclusive.\"\"\"\n    estado = {}\n    for seq, op, chave, valor in journal:\n        # TODO: ignore seq > seq_limite; 'set' grava, 'del' remove\n        pass\n    return estado\n\n\ndef verificar(conteudo, checksum_manifesto):\n    # TODO: sha256 do conteudo (bytes) deve bater com o manifesto; senao BackupInvalido\n    return True\n\n\nJ = [(1, \"set\", \"job-1\", \"A\"), (2, \"set\", \"job-2\", \"B\"), (3, \"del\", \"job-1\", \"\")]\nprint(restaurar_ate(J, 2))\n", testes: "import hashlib\n\nJ = [(1, \"set\", \"job-1\", \"A\"), (2, \"set\", \"job-2\", \"B\"), (3, \"del\", \"job-1\", \"\")]\n\n\ndef test_pitr_antes_da_exclusao_recupera_o_job():\n    assert restaurar_ate(J, 2) == {\"job-1\": \"A\", \"job-2\": \"B\"}\n\n\ndef test_ate_a_exclusao_inclusive_reproduz_o_apagado():\n    assert restaurar_ate(J, 3) == {\"job-2\": \"B\"}\n\n\ndef test_ponto_zero_e_vazio():\n    assert restaurar_ate(J, 0) == {}\n\n\ndef test_backup_integro_passa():\n    dado = b\"base\"\n    assert verificar(dado, hashlib.sha256(dado).hexdigest()) is True\n\n\ndef test_backup_corrompido_falha_visivel():\n    try:\n        verificar(b\"base-corrompida\", hashlib.sha256(b\"base\").hexdigest())\n    except BackupInvalido:\n        pass\n    else:\n        raise AssertionError(\"promoveu backup invalido\")\n",
          dica: 'O journal está em ordem: interrompa com <code>break</code> quando <code>seq &gt; seq_limite</code>. Para o checksum, <code>hashlib.sha256(conteudo).hexdigest()</code>.',
          solucao: "import hashlib\n\n\nclass BackupInvalido(RuntimeError):\n    pass\n\n\ndef restaurar_ate(journal, seq_limite):\n    estado = {}\n    for seq, op, chave, valor in journal:\n        if seq > seq_limite:\n            break\n        if op == \"set\":\n            estado[chave] = valor\n        elif op == \"del\":\n            estado.pop(chave, None)\n    return estado\n\n\ndef verificar(conteudo, checksum_manifesto):\n    if hashlib.sha256(conteudo).hexdigest() != checksum_manifesto:\n        raise BackupInvalido(\"checksum diverge do manifesto\")\n    return True\n",
          tutorDepois: 'O teste "até a exclusão inclusive" é o contraste: o ponto escolhido decide se o dado volta.',
          callout: 'PITR antes da causa e backup inválido falhando visível.' },
        { tipo: 'takeaway', html: 'PITR rejoga <mark>base mais diário</mark> até antes da causa, em <mark>instância isolada</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'transcript', id: 'dur-transcript', titulo: 'Ache as afirmações sem lastro',
          enunciado: 'Um relato pós-incidente sobre a exclusão do job-1. Marque as linhas que não se sustentam.',
          linhas: [
            { quem: 'voce', texto: 'Como recuperamos o job-1?' },
            { quem: 'agente', texto: 'Restauramos da réplica, que tinha o dado.' },
            { quem: 'ferramenta', texto: 'réplica: seq 3 aplicada; SELECT job-1 -> 0 linhas' },
            { quem: 'agente', texto: 'Então fizemos PITR até a seq 2 numa instância isolada e conferimos por consulta.' },
            { quem: 'agente', texto: 'Para ganhar tempo, rodamos o restore direto sobre a origem.' },
            { quem: 'agente', texto: 'O backup é confiável porque o job noturno termina sem erro.' }
          ],
          erradas: [1, 4, 5],
          explicacao: { 1: 'a ferramenta mostra que a réplica aplicou a exclusão: réplica repete o erro.', 4: 'restore nunca sobrescreve a origem: destino isolado preserva a evidência e permite validar.', 5: 'backup só existe depois de restore ensaiado com checksum conferido.' } },
        { tipo: 'escolha', id: 'dur-escolha-ryw', titulo: 'Confira: a leitura que não vê a escrita',
          pergunta: 'O usuário grava no primário, recarrega e não vê a alteração: a leitura foi para uma réplica assíncrona. Como corrigir?',
          opcoes: [
            { id: 'a', texto: 'Aumentar o timeout.', correta: false, porque: 'o problema é lag, não prazo.' },
            { id: 'b', texto: 'Ler do primário, ou exigir versão mínima, quando o requisito for ler o que acabou de escrever.', correta: true, porque: 'o requisito decide; relatórios podem tolerar idade declarada.' },
            { id: 'c', texto: 'Desligar a replicação.', correta: false, porque: 'perde disponibilidade de leitura e HA.' },
            { id: 'd', texto: 'Trocar para réplica de outra região.', correta: false, porque: 'continua assíncrona.' }] },
        { tipo: 'takeaway', html: 'Backup só existe <mark>depois do restore</mark>; HA <mark>mantém no ar</mark>, DR <mark>reconstrói</mark>.' }
      ] }
    ]
  });
})();
