/* LT02 · Bloco 3: idempotência durável e transactional outbox/inbox. Fonte: LT02.html#b03. SQLite local ensina; PostgreSQL real fica em trilha própria. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasOutbox = function () {
    return [
      { id: 'tx', nome: 'Transação', descricao: 'Job e outbox no mesmo commit', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python outbox_sqlite.py --kill-producer apos-commit'),
        L('out', 'BEGIN; INSERT job res-7; INSERT outbox (publicada = 0); COMMIT')] },
      { id: 'kill', nome: 'Kill', descricao: 'Producer morre antes do publish', tom: 'tcp', ms: 1, linhas: [
        L('in', 'producer: morto após o commit, antes de publicar')] },
      { id: 'pendente', nome: 'Pendente', descricao: 'A linha sobreviveu', tom: 'tls', ms: 1, linhas: [
        L('out', 'SELECT COUNT(*) FROM outbox WHERE publicada = 0 -> 1')] },
      { id: 'relay', nome: 'Relay', descricao: 'Outro processo publica', tom: 'request', ms: 1, linhas: [
        L('out', 'relay: publica res-7 no broker; confirm recebido'),
        L('out', 'UPDATE outbox SET publicada = 1 (só após o confirm)')] },
      { id: 'inbox', nome: 'Inbox', descricao: 'Consumer deduplica', tom: 'ink', ms: 1, linhas: [
        L('out', 'consumer: message_id novo -> executa e registra na inbox, na mesma transação'),
        L('in', 'ledger: 1 intenção, 1 efeito; pendentes na outbox = 0')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'lt02-b3',
    titulo: 'Idempotência durável e transactional outbox/inbox',
    minutos: 35,
    resumo: 'O transporte duplica, o negócio deduplica: identidade da intenção persistida, outbox no mesmo commit, inbox antes do efeito e reconciliação pelo operation ID.',
    objetivo: 'Separar identidade da requisição da identidade do efeito, aplicar os quatro estados com unique constraint, lease e fencing, gravar outbox atomicamente e reconciliar o desconhecido sem repetir o efeito.',
    revisao: [
      { id: 'lt02b3-identidade', pergunta: 'O que identifica o efeito, e não a tentativa?',
        opcoes: [
          opc('a', 'O par chave de idempotência mais hash canônico da intenção', true, 'message_id identifica a tentativa; a mesma intenção pode chegar com vários message_id.'),
          opc('b', 'O message_id', false, 'cada redelivery ou retry pode trazer outro.'),
          opc('c', 'O horário da requisição', false, 'relógio não identifica intenção.')] },
      { id: 'lt02b3-conflito', pergunta: 'Mesma Idempotency-Key, hash distinto. O que fazer?',
        opcoes: [
          opc('a', 'Recusar como conflito auditado, sem executar nem devolver a resposta antiga', true, 'executar em silêncio quebra a intenção do cliente.'),
          opc('b', 'Reutilizar a resposta anterior', false, 'a resposta é de outra intenção.'),
          opc('c', 'Executar como operação nova', false, 'a chave não é livre para outra intenção.')] },
      { id: 'lt02b3-outbox', pergunta: 'Por que a outbox fica na mesma transação do estado?',
        opcoes: [
          opc('a', 'Para que estado e intenção de publicar existam juntos ou nenhum: sem dual write', true, 'crash após o commit vira pendente que o relay publica, não perda.'),
          opc('b', 'Para que o broker entregue exatamente uma vez', false, 'a outbox troca perda por duplicata; o consumer deduplica.'),
          opc('c', 'Para dispensar o relay', false, 'o relay é quem publica depois.')] },
      { id: 'lt02b3-fencing', pergunta: 'Qual o papel do fencing token?',
        opcoes: [
          opc('a', 'Recusar o efeito do dono antigo cuja lease expirou', true, 'sem fencing, dono antigo e novo executam juntos.'),
          opc('b', 'Acelerar a lease', false, 'o token não muda prazo.'),
          opc('c', 'Cifrar a mensagem', false, 'não é criptografia.')] },
      { id: 'lt02b3-unknown', pergunta: 'Como tratar o estado unknown?',
        opcoes: [
          opc('a', 'Reconciliar pelo operation ID: efeito presente conclui sem reexecutar; ausente libera nova tentativa com a mesma identidade', true, 'recovery nunca depende da memória do processo morto.'),
          opc('b', 'Retentar imediatamente', false, 'é o retry cego que duplica.'),
          opc('c', 'Marcar como failed', false, 'o efeito pode existir no provedor.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Duas identidades</h3>' +
          '<p><strong>Identidade da requisição</strong> responde "qual tentativa chegou": cada HTTP, publish ou redelivery carrega um <code>message_id</code>. <strong>Identidade do efeito</strong> responde "qual intenção deve acontecer uma vez": o par (chave de idempotência, hash canônico da intenção).</p>' +
          '<p>Exemplo condutor: o cliente cria a reserva com chave <code>res-7</code> e intenção "reservar 1 unidade do orçamento X". O primeiro POST cai após o commit; o cliente retenta com outro <code>message_id</code>, mesma chave e mesma intenção. O repositório reconhece o par e devolve a resposta persistida, sem segundo efeito.</p>' +
          '<h3>Chave, hash e os quatro estados</h3>' +
          '<p><strong>Chave de idempotência</strong> é o nome estável que o cliente dá à intenção (cabeçalho <code>Idempotency-Key</code>, campo do envelope ou <code>tenant_id</code> + operação). <strong>Hash canônico</strong> (<code>intent_hash</code>) é o resumo determinístico dos bytes que definem o efeito: operação, parâmetros, versão do schema.</p>' +
          '<ul><li><strong>started</strong>: intenção aceita, dono registrado, efeito não concluído.</li>' +
          '<li><strong>completed</strong>: efeito concluído uma vez, resposta persistida; repetição devolve a resposta.</li>' +
          '<li><strong>failed</strong>: tentativa terminal sem efeito, com causa registrada.</li>' +
          '<li><strong>unknown</strong>: o efeito pode ou não ter ocorrido; só reconciliação fecha.</li></ul>' },
        { tipo: 'texto', html:
          '<h3>Unique constraint, resposta persistida, lock, lease e fencing</h3>' +
          '<p><strong>Unique constraint</strong> recusa dois registros vivos com a mesma chave: a concorrência vira erro tratável. <strong>Resposta persistida</strong> é o corpo da conclusão gravado junto ao estado. <strong>Lock</strong> é a posse exclusiva temporária de uma intenção; <strong>lease</strong> é o lock com prazo. <strong>Fencing token</strong> é o número crescente de cada dono: o provedor recusa token vencido.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Chave em memória não é idempotência', html: '<p>Sem durabilidade e sem identidade canônica da intenção, o processo reinicia, a memória some e o redelivery vira reexecução.</p>' },
        { tipo: 'takeaway', html: '<mark>message_id</mark> identifica a tentativa; <mark>chave mais intenção</mark> identifica o efeito.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Outbox: o crash do producer após o commit</h3>' +
          '<p><strong>Transactional outbox</strong> resolve "gravar o estado e publicar o evento": o producer grava o estado e a linha de outbox na mesma transação local. Um <strong>relay</strong> separado lê as pendentes, publica e marca como publicada só após o confirm.</p>' },
        { tipo: 'rode', id: 'idem-rode', titulo: 'Mate o producer após o commit', enunciado: 'O producer grava job e outbox, confirma e morre antes de publicar.',
          prefixo: '$', entrada: 'python outbox_sqlite.py --kill-producer apos-commit', unidade: 'passos', terminalTitulo: 'outbox SQLite (exemplo variável)', etapas: etapasOutbox(),
          prever: { pergunta: 'O que acontece com o evento?', opcoes: [
            { id: 'a', texto: 'Some: o producer morreu antes de publicar.', correta: false, porque: 'isso acontece no dual write, sem outbox.' },
            { id: 'b', texto: 'Fica pendente na outbox e o relay publica depois.', correta: true, porque: 'o commit já contém a linha pendente; o relay, que pode ser outro processo, a encontra.' },
            { id: 'c', texto: 'O banco desfaz o job.', correta: false, porque: 'a transação já confirmou.' }] },
          tutorDepois: 'Se o relay cair depois de publicar e antes de marcar, a mensagem sai de novo: a inbox deduplica.',
          callout: 'A linha pendente sobreviveu ao kill e foi publicada pelo relay.' },
        { tipo: 'texto', html:
          '<h3>Inbox, tombstone e TTL</h3>' +
          '<p><strong>Inbox</strong> é a tabela do consumer com cada <code>message_id</code> visto e o veredito (processado, em processamento pelo dono vigente, quarentenado). O worker consulta antes do efeito, na mesma transação que reserva a intenção. <strong>Tombstone</strong> marca a intenção encerrada sem apagar o rastro. <strong>TTL</strong> é o prazo de guarda desse rastro: curto demais e a repetição tardia reexecuta; deve cobrir a janela de retry do negócio.</p>' +
          '<h3>Dois workers, um efeito</h3>' +
          '<p>Protocolo em três passos: reservar a intenção sob unique constraint com o fencing token vigente; executar o efeito identificado pelo <strong>operation ID</strong>; concluir só se o token ainda é o do dono. Lease expirada com dono antigo vivo: sem fencing, os dois executam; com fencing, o provedor recusa o token vencido.</p>' +
          '<h3>Reconciliação do desconhecido</h3>' +
          '<p>Worker morto após o efeito e antes de persistir deixa <code>started</code> sem conclusão. <strong>Reconciliação</strong> pergunta ao executor pelo operation ID: efeito presente vira conclusão sem reexecutar; ausente libera nova tentativa com a mesma identidade. Recovery nunca depende de memória do processo morto.</p>' },
        { tipo: 'takeaway', html: 'Estado e <mark>outbox</mark> no mesmo commit; <mark>inbox</mark> antes do efeito; unknown <mark>reconcilia</mark> antes de retentar.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'idem-python', titulo: 'Repositório idempotente', obrigatorio: false,
          enunciado: 'Implemente <code>Repo.reservar(chave, intent_hash)</code>: chave nova grava <code>started</code> e devolve <code>"novo"</code>; mesma chave e mesmo hash devolve <code>("reuso", resposta)</code>; hash distinto levanta <code>ChaveConflito</code>. E <code>concluir</code> grava <code>completed</code> com a resposta. Contrato de <code>lab/repositorio_idempotente.py</code>, em memória.',
          codigo: "class ChaveConflito(RuntimeError):\n    pass\n\n\nclass Repo:\n    def __init__(self):\n        self.linhas = {}  # chave -> {\"hash\", \"estado\", \"resposta\"}\n\n    def reservar(self, chave, intent_hash):\n        \"\"\"'novo' | ('reuso', resposta) | levanta ChaveConflito.\"\"\"\n        # TODO: chave inexistente: grava started e devolve \"novo\"\n        # TODO: mesma chave e mesmo hash: devolva (\"reuso\", resposta persistida)\n        # TODO: mesma chave e hash distinto: ChaveConflito\n        return \"novo\"\n\n    def concluir(self, chave, resposta):\n        # TODO: estado completed e resposta persistida\n        pass\n\n\nr = Repo()\nprint(r.reservar(\"res-7\", \"h1\"))\n", testes: "def test_primeira_reserva_e_nova():\n    r = Repo()\n    assert r.reservar(\"res-7\", \"h1\") == \"novo\"\n    assert r.linhas[\"res-7\"][\"estado\"] == \"started\"\n\n\ndef test_mesma_intencao_reutiliza_resposta():\n    r = Repo()\n    r.reservar(\"res-7\", \"h1\")\n    r.concluir(\"res-7\", \"ok-1\")\n    assert r.reservar(\"res-7\", \"h1\") == (\"reuso\", \"ok-1\")\n    assert r.linhas[\"res-7\"][\"estado\"] == \"completed\"\n\n\ndef test_intencao_distinta_e_conflito():\n    r = Repo()\n    r.reservar(\"res-7\", \"h1\")\n    try:\n        r.reservar(\"res-7\", \"h2\")\n    except ChaveConflito:\n        assert r.linhas[\"res-7\"][\"hash\"] == \"h1\"\n    else:\n        raise AssertionError(\"executou em silencio\")\n\n\ndef test_chaves_diferentes_nao_se_misturam():\n    r = Repo()\n    r.reservar(\"a\", \"h1\")\n    assert r.reservar(\"b\", \"h1\") == \"novo\"\n",
          dica: 'Busque <code>self.linhas.get(chave)</code>. Se for <code>None</code>, grave o dict. Se o hash diferir, levante antes de qualquer outra coisa.',
          solucao: "class ChaveConflito(RuntimeError):\n    pass\n\n\nclass Repo:\n    def __init__(self):\n        self.linhas = {}\n\n    def reservar(self, chave, intent_hash):\n        linha = self.linhas.get(chave)\n        if linha is None:\n            self.linhas[chave] = {\"hash\": intent_hash, \"estado\": \"started\", \"resposta\": \"\"}\n            return \"novo\"\n        if linha[\"hash\"] != intent_hash:\n            raise ChaveConflito(f\"chave {chave!r} com intencao distinta\")\n        return (\"reuso\", linha[\"resposta\"])\n\n    def concluir(self, chave, resposta):\n        self.linhas[chave][\"estado\"] = \"completed\"\n        self.linhas[chave][\"resposta\"] = resposta\n",
          tutorDepois: 'No lab, o "chave inexistente" é garantido pela PRIMARY KEY do SQLite, não por um if: sob concorrência, quem decide é a unique constraint.',
          callout: 'Reuso, conflito e reserva nova passaram nos testes.' },
        { tipo: 'cenario', id: 'idem-cenario', titulo: 'O worker morreu depois do efeito', obrigatorio: false,
          enunciado: 'A intenção <code>res-7</code> está em <code>started</code> há mais que a lease. O dono anterior sumiu. O provedor tem consulta por operation ID.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Você assume a intenção. Qual o primeiro passo?', opcoes: [
              { texto: 'Executar de novo: a lease expirou, então o anterior falhou.', vai: 'f-dup', tom: 'ruim', consequencia: 'o anterior executou; o provedor recebe dois efeitos.' },
              { texto: 'Pegar a lease com novo fencing token e consultar o provedor pelo operation ID.', vai: 'consulta', tom: 'ok', consequencia: 'o token novo veta o dono antigo; a consulta decide sem tocar o mundo.' },
              { texto: 'Marcar como failed e avisar o cliente.', vai: 'f-falso', tom: 'ruim', consequencia: 'declara falha sobre efeito que existe.' }] },
            consulta: { texto: 'O provedor responde: res-7 executada. E agora?', opcoes: [
              { texto: 'Concluir: gravar completed com a resposta, sem reexecutar.', vai: 'f-bom', tom: 'ok', consequencia: 'efeito presente vira conclusão.' },
              { texto: 'Reexecutar para ter a resposta fresca.', vai: 'f-dup', tom: 'ruim', consequencia: 'segundo efeito.' }] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Um efeito no ledger, resposta persistida, dono antigo vetado pelo token.' },
            'f-dup': { bom: false, texto: 'O ledger mostra dois efeitos para uma intenção: cobrança dupla.' },
            'f-falso': { bom: false, texto: 'O cliente recebe "falhou" e retenta com outra chave: segundo efeito, agora com outra identidade.' }
          },
          callout: 'Você reconciliou antes de retentar e concluiu sem reefeito.' },
        { tipo: 'takeaway', html: 'Mesmo hash <mark>reutiliza</mark>, hash distinto é <mark>conflito</mark>, unknown <mark>reconcilia</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'idem-escolha-relay', titulo: 'Confira: o relay que caiu',
          pergunta: 'O relay publicou a mensagem e caiu antes de marcá-la como publicada. O que acontece ao reiniciar e o que protege o negócio?',
          opcoes: [
            { id: 'a', texto: 'A mensagem some; nada protege.', correta: false, porque: 'a linha segue pendente.' },
            { id: 'b', texto: 'É republicada (duplicata) e o consumer deduplica por message_id na inbox.', correta: true, porque: 'a outbox troca perda por duplicata: at-least-once. Marcar só após o confirm faz o crash virar pendente.' },
            { id: 'c', texto: 'O broker entrega exatamente uma vez.', correta: false, porque: 'não é o que a outbox promete.' },
            { id: 'd', texto: 'O banco desfaz a transação original.', correta: false, porque: 'ela já confirmou.' }] },
        { tipo: 'escolha', id: 'idem-escolha-ttl', titulo: 'Confira: o TTL do tombstone',
          pergunta: 'Um retry chega dois dias depois e reexecuta, embora a intenção tivesse concluído. Causa provável?',
          opcoes: [
            { id: 'a', texto: 'TTL do tombstone menor que a janela de retry do negócio: o rastro expirou antes da repetição.', correta: true, porque: 'o TTL precisa cobrir o tempo em que a repetição ainda pode chegar.' },
            { id: 'b', texto: 'Falta de prefetch.', correta: false, porque: 'prefetch é sobre voo, não sobre rastro.' },
            { id: 'c', texto: 'Unique constraint forte demais.', correta: false, porque: 'ela impede, não causa, a duplicata.' },
            { id: 'd', texto: 'O hash canônico mudou com o relógio.', correta: false, porque: 'hash canônico não depende do relógio.' }] },
        { tipo: 'takeaway', html: 'O transporte <mark>duplica</mark>; o negócio <mark>deduplica</mark> com identidade durável.' }
      ] }
    ]
  });
})();
