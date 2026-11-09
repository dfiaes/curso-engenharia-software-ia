/* M12 · Bloco 5: Idempotência durável e efeitos externos de agentes. Fonte: M12.html#b5. Exemplos ilustrativos (valores variáveis); razão durável real e concorrência entre processos moram na trilha seguinte. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var EXEC = 'service.execute_once(tenant, "same-key", request, efeito_pagamento)';
  var CONF = 'IdempotencyConflict: IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN';

  TrilhaAula.registrar({
    id: 'm12-b5',
    titulo: 'Idempotência durável e efeitos externos de agentes',
    minutos: 40,
    resumo: 'Um agente que cobra, envia ou chama um provedor não pode duplicar o efeito quando o retry dispara ou o processo cai. A chave constrói deduplicação, a intenção a vincula ao pedido e a ambiguidade se resolve por consulta, não por repetição.',
    objetivo: 'Projetar um executor que repete a resposta sem repetir o efeito: chave com escopo, hash da intenção, razão de estados com unknown e reconciliação por recibo antes de qualquer novo efeito.',
    revisao: [
      { id: 'm12b5-chave', pergunta: 'O que a idempotency key constrói e o que o intent hash acrescenta?',
        opcoes: [
          opc('a', 'A chave deduplica dentro de um escopo (tenant e operação) e de uma retenção; o hash da intenção (tenant, tool e argumentos canonicalizados) impede que a chave devolva a resposta de um pedido antigo para um pedido diferente', true, 'sem o hash, a chave vira um apelido vazio.'),
          opc('b', 'A chave basta: mesma chave sempre significa o mesmo pedido', false, 'argumentos divergentes na mesma chave precisam negar por conflito.'),
          opc('c', 'O hash substitui a chave e dispensa o razão', false, 'o razão com chave única é quem arbitra a concorrência.')] },
      { id: 'm12b5-estados', pergunta: 'Qual estado do razão marca a janela em que o efeito pode ou não ter ocorrido?',
        opcoes: [
          opc('a', 'unknown', true, 'é a marca da falha ambígua: o retry nega e a reconciliação decide.'),
          opc('b', 'failed', false, 'failed confirma que nenhum efeito ocorreu ou que a compensação terminou.'),
          opc('c', 'received', false, 'received só aceitou a intenção; o efeito ainda não iniciou.')] },
      { id: 'm12b5-retry', pergunta: 'Depois de um timeout que perdeu a resposta, qual a resposta correta ao retry imediato com a mesma chave e a mesma intenção?',
        opcoes: [
          opc('a', 'Negar com IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN e reconciliar por consulta ao provedor', true, 'timeout não prova que nada aconteceu: repetir às cegas pode duplicar o efeito.'),
          opc('b', 'Executar de novo, porque o timeout prova que falhou', false, 'o efeito pode ter ocorrido e só a resposta se perdeu.'),
          opc('c', 'Devolver sucesso, porque a chave já existe', false, 'sucesso só se afirma com recibo.')] },
      { id: 'm12b5-ausencia', pergunta: 'A consulta ao provedor confirma que nada chegou. O que acontece com o registro?',
        opcoes: [
          opc('a', 'É removido e uma nova tentativa segura é liberada; ausência confirmada não é sucesso', true, 'e a projeção de entitlement só consome recibo reconciliado.'),
          opc('b', 'É gravado como succeeded para fechar o caso', false, 'afirmaria um efeito que não existe.'),
          opc('c', 'Fica unknown até alguém olhar', false, 'a reconciliação existe justamente para fechar a janela.')] },
      { id: 'm12b5-orcamento', pergunta: 'Quais erros entram no orçamento de retry?',
        opcoes: [
          opc('a', 'Só erros transitórios, com backoff, jitter e dead-letter; validação, autorização e conflito nunca entram', true, 'repetir o que foi negado por regra é insistência contra a política.'),
          opc('b', 'Todos, com retry infinito', false, 'transforma negação de política em tempestade de repetição.'),
          opc('c', 'Nenhum: retry é sempre perigoso', false, 'erro transitório é a razão de existir do orçamento de retry.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O agente pede a cobrança de 50, o provedor responde com timeout e o código tenta de novo. Se o primeiro pedido tinha passado, o cliente foi cobrado duas vezes. O mesmo vale para um processo que cai no meio da operação. Este bloco dá ao agente o poder de agir sobre o mundo sem duplicar o efeito. Pré-requisitos: identidade, tenant e aprovação vinculada (Bloco 3), que dizem qual intenção pode executar, e o isolamento por tenant (Bloco 4), que compõe a identidade da chave.</p>' +
          '<h3>Operação idempotente, chave e intenção</h3>' +
          '<p><strong>Operação naturalmente idempotente</strong> é aquela cuja repetição produz o mesmo estado observável, como definir explicitamente um recurso para um valor. <strong>Efeito externo</strong> é tudo que escapa ao seu banco (cobrança, envio, chamada a provedor) e em geral não é naturalmente idempotente. <strong>Idempotency key</strong> é o identificador que constrói deduplicação onde a natureza não deu: dentro de um escopo (tenant e operação) e de um período de retenção, a mesma chave representa a mesma intenção. <strong>Intenção</strong> é o conteúdo que a chave resume (tenant, tool e argumentos canonicalizados), registrada como <strong>intent hash</strong>; sem ele, a chave vira um apelido vazio que pode devolver a resposta de uma solicitação antiga para um pedido diferente.</p>' +
          '<h3>O razão durável</h3>' +
          '<p>O modelo mental é um livro-razão com estados explícitos. A chave única do razão arbitra a concorrência entre processos; o hash da intenção arbitra o significado de cada repetição.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Estado</th><th>Significa</th></tr></thead><tbody>' +
          '<tr><td><code>received</code></td><td>Aceitou a intenção</td></tr>' +
          '<tr><td><code>started</code></td><td>Iniciou o efeito</td></tr>' +
          '<tr><td><code>succeeded</code></td><td>Guarda resposta estável</td></tr>' +
          '<tr><td><code>failed</code></td><td>Confirma que nenhum efeito ocorreu ou que a compensação terminou</td></tr>' +
          '<tr><td><code>unknown</code></td><td>Janela ambígua: o efeito pode ou não ter ocorrido</td></tr>' +
          '</tbody></table>' +
          '<p class="ta-nota">Cache em memória prova só o caminho feliz de uma instância: some com o processo, e a deduplicação some junto. Valores de retenção, prazos e contagens são exemplo variável, nunca medição.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Conceito', html:
          '<p>Não existe transação ingênua entre o banco e uma API externa: nenhum commit cobre os dois lados de uma vez. Gravar <em>depois</em> do efeito deixa um crash duplicar o efeito no retry; gravar <em>antes</em> sem estado ambíguo deixa um crash afirmar um resultado que ninguém confirmou. Por isso o razão registra a intenção antes, marca o desconhecido quando a resposta se perde e só afirma sucesso com recibo: o retry cego é substituído por consulta e reconciliação.</p>' },
        { tipo: 'takeaway', html: 'A <mark>chave</mark> deduplica, o <mark>hash da intenção</mark> dá significado à repetição e o estado <mark>unknown</mark> impede o retry cego.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Escopo da chave, concorrência, retry com orçamento e reconciliação</h3>' +
          '<p>A decisão central: chave com escopo e dono definidos, contenção serializada pela chave, retry classificado por erro e estado ambíguo resolvido por evidência, nunca por repetição. Quem gera a chave, seu namespace por tenant e operação, a retenção, a resposta de replay e o tratamento de payload divergente fazem parte do contrato, não de convenção oral. Erros de validação, autorização e conflito nunca entram no orçamento de retry.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Pergunta</th><th>Controle</th><th>Negação</th><th>O que não fazer</th></tr></thead><tbody>' +
          '<tr><td>A repetição é o mesmo pedido?</td><td>Mesma chave com mesmo <code>intent_hash</code> devolve a resposta gravada</td><td>Hash divergente nega por conflito, sem efeito</td><td>Devolver a resposta antiga para argumentos novos</td></tr>' +
          '<tr><td>Duas instâncias correm juntas?</td><td>Chave única serializa; a segunda aguarda ou recebe o resultado único</td><td>Duas execuções do efeito para a mesma chave</td><td>Confiar em trava de processo local contra outro processo</td></tr>' +
          '<tr><td>A resposta se perdeu?</td><td>Marcar <code>unknown</code> e reconciliar por consulta ao provedor</td><td>Repetir o efeito sem saber se o primeiro ocorreu (M12-AT-023)</td><td>Tratar timeout como prova de que nada aconteceu</td></tr>' +
          '<tr><td>Quanto repetir?</td><td>Orçamento de retry com backoff, jitter e dead-letter por erro transitório</td><td>Retry infinito ou sobre erro determinístico</td><td>Repetir negação de política como se fosse indisponibilidade</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>A reconciliação consulta a fonte de verdade do provedor antes de decidir: recibo encontrado vira sucesso sem novo efeito; ausência confirmada libera uma nova tentativa segura; divergência persistente segue para dead-letter ou compensação, nunca para repetição silenciosa. Mensagens sob seu controle viajam por <strong>outbox</strong> (gravadas na mesma transação local e entregues depois); efeitos fora do seu controle exigem idempotência também no provedor, quando disponível. Eventos reconciliados alimentam a projeção de entitlement do Bloco 7, que converge duplicatas e desordem por versão de domínio em vez de confiar na ordem de chegada.</p>' +
          '<p>Siga o exemplo trabalhado, com valores ilustrativos: um agente propõe um pagamento, a resposta se perde por timeout, e você escolhe o que fazer em cada passo.</p>' },
        { tipo: 'quebre', id: 'b5-quebre', titulo: 'Do timeout ambíguo ao efeito único',
          enunciado: 'Rode o caminho correto e depois cada falha. Escolha uma falha, rode, e por fim rode "Sem falha" para fechar o exercício. Saídas ilustrativas (valores variáveis).',
          prefixo: 'Prompt', entrada: EXEC, unidade: 'efeitos', terminalTitulo: 'contador externo do provedor',
          prever: { pergunta: 'O timeout aconteceu depois de o efeito ter ocorrido. Você repete a chamada, com a mesma chave e a mesma intenção. O que o executor faz?', opcoes: [
            { id: 'a', texto: 'Executa o efeito de novo: timeout significa que falhou.', correta: false, porque: 'timeout não prova que nada aconteceu; aqui o efeito já tinha ocorrido.' },
            { id: 'b', texto: 'Devolve sucesso, porque a chave já existe no razão.', correta: false, porque: 'o estado não é succeeded: ninguém confirmou o efeito.' },
            { id: 'c', texto: 'Nega com IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN, sem novo efeito, até a reconciliação.', correta: true, porque: 'o razão marcou unknown; só a consulta ao provedor autoriza afirmar sucesso ou liberar nova tentativa.' }
          ] },
          etapas: [
            { id: 'primeira', nome: 'Primeira execução', descricao: 'Intenção gravada, efeito iniciado, resposta perdida', tom: 'dns', ms: 1, linhas: [
              L('cmd', EXEC),
              L('info', 'razão: received -> started (intent_hash = h1)'),
              L('out', 'efeito externo: cobrança de 50 (contador do provedor = 1)'),
              L('in', 'TIMEOUT: a resposta se perdeu'),
              L('info', 'razão: state = unknown'),
              L('hint', 'efeitos acumulados: 1')] },
            { id: 'retry', nome: 'Retry imediato', descricao: 'Mesma chave, mesma intenção', tom: 'tcp', ms: 1, linhas: [
              L('cmd', EXEC),
              L('out', CONF),
              L('hint', 'nenhum novo efeito (contador do provedor = 1)')] },
            { id: 'reconcilia', nome: 'Reconciliação', descricao: 'Consulta o provedor pelo recibo', tom: 'tls', ms: 1, linhas: [
              L('cmd', 'service.reconcile_unknown(tenant, "same-key", request, lookup)'),
              L('in', 'recibo rec-001 encontrado no provedor'),
              L('info', 'razão: unknown -> succeeded (resposta = rec-001)'),
              L('hint', 'sem novo efeito (contador do provedor = 1)')] },
            { id: 'replay', nome: 'Retry seguinte', descricao: 'Replay da resposta gravada', tom: 'response', ms: 1, linhas: [
              L('cmd', EXEC),
              L('in', 'rec-001  (resposta gravada)'),
              L('hint', 'contador do provedor = 1: um efeito, resposta estável')] }
          ],
          falhas: [
            { id: 'cego', rotulo: 'Retry cego após o timeout', efeito: { etapaFalha: 'retry', linhasErro: [
              L('info', 'cliente: timeout curto, vou repetir'),
              L('cmd', EXEC),
              L('out', 'efeito externo: cobrança de 50 (contador do provedor = 2)'),
              L('hint', 'efeito duplicado')
            ], tutor: 'o retry esperto adivinha pelo erro se o efeito ocorreu e erra no dia em que ocorreu: a informação decisiva, o recibo no provedor, nunca foi consultada. A repetição só é segura depois de marcar unknown e reconciliar.' } },
            { id: 'sem-hash', rotulo: 'Chave sem hash da intenção', efeito: { etapaFalha: 'replay', linhasErro: [
              L('info', 'o agente reutiliza "same-key" para uma cobrança de 80'),
              L('cmd', 'service.execute_once(tenant, "same-key", request_80, efeito_pagamento)'),
              L('in', 'rec-001  (resposta da cobrança de 50)'),
              L('hint', 'pedido novo recebeu resposta antiga; ninguém notou')
            ], tutor: 'sem o intent_hash a chave é só um apelido. Com ele, a mesma chave e argumentos divergentes nega com IDEMPOTENCY_INTENT_MISMATCH, sem efeito.' } },
            { id: 'trava-local', rotulo: 'Trava só em memória, duas instâncias', efeito: { etapaFalha: 'primeira', linhasErro: [
              L('info', 'instâncias 1 e 2 recebem a mesma chave ao mesmo tempo, cada uma com a sua trava local'),
              L('cmd', EXEC + '  # nas duas instâncias'),
              L('out', 'efeito externo: cobrança de 50 (contador do provedor = 2)'),
              L('hint', 'duas execuções para a mesma chave')
            ], tutor: 'trava local de processo não atravessa processos e some com eles. Quem serializa é a chave única do razão durável.' } },
            { id: 'sem-recibo', rotulo: 'Reconciliação sem consultar o provedor', efeito: { etapaFalha: 'reconcilia', linhasErro: [
              L('info', 'o código grava succeeded para fechar o registro, sem consultar'),
              L('cmd', 'razão: unknown -> succeeded  # sem recibo'),
              L('out', 'resposta gravada: (vazia)'),
              L('hint', 'se a primeira chamada nunca chegou, o razão afirma um sucesso que ninguém confirmou')
            ], tutor: 'sucesso exige recibo na consulta. Ausência confirmada libera uma nova tentativa; nunca vira sucesso.' } }
          ],
          tutorAntes: 'Faça a previsão e rode o caminho correto. Depois escolha cada falha, rode, e termine com "Sem falha".',
          tutorDepois: 'A repetição prova, pela chave e pelo hash, que é o mesmo pedido; a concorrência prova, pela chave única, que só um efeito ocorre; a ambiguidade prova, pela consulta, o que aconteceu antes de qualquer novo efeito.',
          callout: 'Você viu o efeito único: unknown nega o retry, o recibo reconcilia e a resposta se repete sem repetir o efeito.' },
        { tipo: 'codigo', linguagem: 'sql', texto: [
          '-- SQL de referência ilustrativo (valores variáveis; ver migração do laboratório)',
          '-- A versão executável vive na migração; aqui, só o formato do razão durável.',
          'CREATE TABLE idempotency_ledger (',
          '  tenant_id        uuid NOT NULL,',
          '  idempotency_key  text NOT NULL,',
          '  intent_hash      text NOT NULL,',
          '  state            text NOT NULL CHECK (',
          "    state IN ('received','started','succeeded','failed','unknown')",
          '  ),',
          '  response         jsonb,',
          '  updated_at       timestamptz NOT NULL DEFAULT now(),',
          '  PRIMARY KEY (tenant_id, idempotency_key)',
          ');'].join('\n') },
        { tipo: 'takeaway', html: 'Nunca <mark>retry cego</mark>: a ambiguidade se resolve por <mark>consulta ao provedor</mark>, e a chave única do razão serializa as instâncias.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'ordene', id: 'b5-ordene', titulo: 'Ponha o caminho do timeout na ordem', obrigatorio: false,
          enunciado: 'Ordene os passos do executor, do primeiro ao último, para uma falha ambígua que termina em recibo encontrado.',
          itens: [
            { id: 'consulta', texto: 'Consultar o provedor pelo recibo da intenção' },
            { id: 'unknown', texto: 'A resposta se perde por timeout e o razão marca <code>unknown</code>' },
            { id: 'fecha', texto: 'Recibo encontrado: gravar <code>succeeded</code> com o recibo, sem novo efeito' },
            { id: 'registra', texto: 'Gravar a intenção no razão (chave, <code>intent_hash</code>) antes de qualquer efeito' },
            { id: 'nega', texto: 'O retry com a mesma chave e a mesma intenção nega com <code>IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN</code>' },
            { id: 'efeito', texto: 'Marcar <code>started</code> e iniciar o efeito externo' }
          ], solucao: ['registra', 'efeito', 'unknown', 'nega', 'consulta', 'fecha'],
          dica: 'A intenção é gravada antes do efeito; a negação do retry vem antes da consulta; o sucesso só depois do recibo.',
          callout: 'Ordem certa: intenção, efeito, unknown, negação, consulta e só então sucesso.' },
        { tipo: 'python', id: 'b5-python', titulo: 'Escreva o executor idempotente', obrigatorio: false,
          enunciado: 'Complete <code>intent_hash</code>, o trecho de repetição de <code>execute_once</code> e <code>reconcile_unknown</code>. O efeito é uma função que o teste conta; o provedor é fake e determinístico, sem rede. As negações carregam os códigos do módulo.',
          codigo: "import hashlib\nimport json\n\n\nclass IdempotencyConflict(Exception):\n    def __init__(self, code):\n        super().__init__(code)\n        self.code = code\n\n\nclass EfeitoAmbiguo(Exception):\n    \"\"\"Timeout: o efeito externo pode ou não ter ocorrido.\"\"\"\n\n\ndef intent_hash(tenant, tool, args):\n    # tenant + tool + argumentos canonicalizados (ordem das chaves não conta)\n    return \"\"\n\n\nclass Servico:\n    def __init__(self):\n        self.razao = {}  # (tenant, chave) -> {\"hash\", \"state\", \"result\"}\n\n    def execute_once(self, tenant, key, tool, args, effect):\n        h = intent_hash(tenant, tool, args)\n        reg = self.razao.get((tenant, key))\n        if reg:\n            # 1. hash diferente -> IDEMPOTENCY_INTENT_MISMATCH\n            # 2. state \"succeeded\" -> devolve reg[\"result\"] sem novo efeito\n            # 3. state \"started\" ou \"unknown\" -> IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN\n            pass\n        reg = {\"hash\": h, \"state\": \"started\", \"result\": None}\n        self.razao[(tenant, key)] = reg\n        try:\n            resultado = effect()\n        except EfeitoAmbiguo:\n            reg[\"state\"] = \"unknown\"\n            raise\n        reg[\"state\"] = \"succeeded\"\n        reg[\"result\"] = resultado\n        return resultado\n\n    def reconcile_unknown(self, tenant, key, lookup):\n        # 4. fora de \"unknown\": IDEMPOTENCY_NOT_UNKNOWN\n        # 5. lookup() devolve o recibo do provedor ou None\n        #    recibo -> succeeded e devolve o recibo; None -> remove o registro e devolve None\n        return None\n", testes: "ARGS = {\"valor\": 50, \"conta\": \"c-1\"}\n\n\ndef _efeito(contador, resultado=\"rec-1\", falha=False):\n    def f():\n        contador.append(1)\n        if falha:\n            raise EfeitoAmbiguo()\n        return resultado\n    return f\n\n\ndef _codigo(fn):\n    try:\n        fn()\n    except IdempotencyConflict as e:\n        return e.code\n    return None\n\n\ndef test_mesma_chave_mesma_intencao_um_efeito():\n    s, n = Servico(), []\n    a = s.execute_once(\"t1\", \"k\", \"pagar\", ARGS, _efeito(n))\n    b = s.execute_once(\"t1\", \"k\", \"pagar\", dict(reversed(list(ARGS.items()))), _efeito(n))\n    assert a == b == \"rec-1\" and len(n) == 1\n\n\ndef test_intencao_divergente_nega_sem_efeito():\n    s, n = Servico(), []\n    s.execute_once(\"t1\", \"k\", \"pagar\", ARGS, _efeito(n))\n    cod = _codigo(lambda: s.execute_once(\"t1\", \"k\", \"pagar\", {\"valor\": 51, \"conta\": \"c-1\"}, _efeito(n)))\n    assert cod == \"IDEMPOTENCY_INTENT_MISMATCH\" and len(n) == 1\n\n\ndef test_timeout_deixa_unknown_e_retry_nega():\n    s, n = Servico(), []\n    try:\n        s.execute_once(\"t1\", \"k\", \"pagar\", ARGS, _efeito(n, falha=True))\n    except EfeitoAmbiguo:\n        pass\n    assert s.razao[(\"t1\", \"k\")][\"state\"] == \"unknown\"\n    cod = _codigo(lambda: s.execute_once(\"t1\", \"k\", \"pagar\", ARGS, _efeito(n)))\n    assert cod == \"IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN\" and len(n) == 1\n\n\ndef test_reconciliacao_com_recibo_nao_repete_efeito():\n    s, n = Servico(), []\n    try:\n        s.execute_once(\"t1\", \"k\", \"pagar\", ARGS, _efeito(n, falha=True))\n    except EfeitoAmbiguo:\n        pass\n    assert s.reconcile_unknown(\"t1\", \"k\", lambda: \"rec-9\") == \"rec-9\"\n    assert s.execute_once(\"t1\", \"k\", \"pagar\", ARGS, _efeito(n)) == \"rec-9\"\n    assert len(n) == 1\n\n\ndef test_ausencia_confirmada_libera_nova_tentativa_sem_afirmar_sucesso():\n    s, n = Servico(), []\n    try:\n        s.execute_once(\"t1\", \"k\", \"pagar\", ARGS, _efeito(n, falha=True))\n    except EfeitoAmbiguo:\n        pass\n    assert s.reconcile_unknown(\"t1\", \"k\", lambda: None) is None\n    assert (\"t1\", \"k\") not in s.razao\n    assert s.execute_once(\"t1\", \"k\", \"pagar\", ARGS, _efeito(n, \"rec-2\")) == \"rec-2\"\n    assert len(n) == 2\n\n\ndef test_reconciliar_fora_de_unknown_nega():\n    s, n = Servico(), []\n    s.execute_once(\"t1\", \"k\", \"pagar\", ARGS, _efeito(n))\n    assert _codigo(lambda: s.reconcile_unknown(\"t1\", \"k\", lambda: \"x\")) == \"IDEMPOTENCY_NOT_UNKNOWN\"\n\n\ndef test_controle_negativo_escopo_por_tenant():\n    s, n = Servico(), []\n    s.execute_once(\"t1\", \"k\", \"pagar\", ARGS, _efeito(n))\n    s.execute_once(\"t2\", \"k\", \"pagar\", ARGS, _efeito(n))\n    assert len(n) == 2\n",
          dica: 'Canonicalize os argumentos com <code>json.dumps(args, sort_keys=True, separators=(",", ":"))</code> e faça o hash de <code>tenant|tool|canônico</code>. Na repetição: hash diferente nega com MISMATCH; <code>succeeded</code> devolve <code>reg["result"]</code>; os demais estados negam com IN_PROGRESS_OR_UNKNOWN. Na reconciliação: recibo grava <code>succeeded</code>; <code>None</code> remove o registro.',
          solucao: "import hashlib\nimport json\n\n\nclass IdempotencyConflict(Exception):\n    def __init__(self, code):\n        super().__init__(code)\n        self.code = code\n\n\nclass EfeitoAmbiguo(Exception):\n    pass\n\n\ndef intent_hash(tenant, tool, args):\n    canon = json.dumps(args, sort_keys=True, separators=(\",\", \":\"))\n    return hashlib.sha256(f\"{tenant}|{tool}|{canon}\".encode()).hexdigest()\n\n\nclass Servico:\n    def __init__(self):\n        self.razao = {}\n\n    def execute_once(self, tenant, key, tool, args, effect):\n        h = intent_hash(tenant, tool, args)\n        reg = self.razao.get((tenant, key))\n        if reg:\n            if reg[\"hash\"] != h:\n                raise IdempotencyConflict(\"IDEMPOTENCY_INTENT_MISMATCH\")\n            if reg[\"state\"] == \"succeeded\":\n                return reg[\"result\"]\n            raise IdempotencyConflict(\"IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN\")\n        reg = {\"hash\": h, \"state\": \"started\", \"result\": None}\n        self.razao[(tenant, key)] = reg\n        try:\n            resultado = effect()\n        except EfeitoAmbiguo:\n            reg[\"state\"] = \"unknown\"\n            raise\n        reg[\"state\"] = \"succeeded\"\n        reg[\"result\"] = resultado\n        return resultado\n\n    def reconcile_unknown(self, tenant, key, lookup):\n        reg = self.razao.get((tenant, key))\n        if reg is None or reg[\"state\"] != \"unknown\":\n            raise IdempotencyConflict(\"IDEMPOTENCY_NOT_UNKNOWN\")\n        recibo = lookup()\n        if recibo is None:\n            del self.razao[(tenant, key)]\n            return None\n        reg[\"state\"] = \"succeeded\"\n        reg[\"result\"] = recibo\n        return recibo\n",
          tutorDepois: 'O controle negativo importa: a mesma chave em outro tenant executa de forma independente, porque o escopo da chave inclui o tenant.',
          callout: 'Um efeito, resposta estável e nenhuma afirmação sem recibo.' },
        { tipo: 'cenario', id: 'b5-cenario', titulo: 'O reembolso que deu timeout', obrigatorio: false,
          enunciado: 'O agente aprovado pediu "reembolsar o pedido 9 por 50" e a chamada ao provedor deu timeout. Decida e veja o custo de cada caminho.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Você não sabe se o reembolso saiu. O razão tem a intenção gravada e o estado não é succeeded. O que faz?', opcoes: [
              { texto: 'Repetir a chamada com um UUID novo como chave, para o provedor não rejeitar.', vai: 'f-dup', tom: 'ruim', consequencia: 'chave nova a cada tentativa derrota a idempotência: o provedor trata como outro pedido.' },
              { texto: 'Marcar unknown, negar novos retries e consultar o provedor pelo recibo da intenção.', vai: 'consulta', tom: 'ok', consequencia: 'a informação decisiva passa a vir da fonte de verdade.' },
              { texto: 'Tratar como falha e relançar o efeito assim que o orçamento de retry permitir.', vai: 'f-dup', tom: 'ruim', consequencia: 'timeout é erro transitório, mas aqui o efeito pode ter ocorrido: repetir sem consultar duplica.' }
            ] },
            consulta: { texto: 'A consulta ao provedor confirma que não há recibo para essa intenção. Qual o próximo passo?', opcoes: [
              { texto: 'Gravar succeeded para fechar o registro e seguir.', vai: 'f-fantasma', tom: 'ruim', consequencia: 'o razão afirma um reembolso que nunca existiu, e o entitlement passa a consumir um evento falso.' },
              { texto: 'Registrar a ausência confirmada, remover o registro e liberar uma nova tentativa segura com a mesma intenção.', vai: 'f-bom', tom: 'ok', consequencia: 'a repetição agora é segura: sabe-se que o primeiro pedido não chegou.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O reembolso sai uma única vez, com a intenção vinculada e a decisão apoiada em evidência do provedor.' },
            'f-dup': { bom: false, texto: 'O cliente foi reembolsado duas vezes, e a duplicata só apareceu na reconciliação do mês.' },
            'f-fantasma': { bom: false, texto: 'O razão registra um sucesso sem recibo; o cliente nunca recebeu e o suporte não achou a causa.' }
          },
          callout: 'Você resolveu a ambiguidade por consulta e tratou ausência confirmada como liberação, não como sucesso.' },
        { tipo: 'takeaway', html: 'O estado <mark>unknown</mark> só fecha com <mark>recibo</mark> (sucesso) ou <mark>ausência confirmada</mark> (nova tentativa segura).' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>O que prova que o efeito foi único</h3>' +
          '<p>O oráculo nunca é “o retry eventualmente passou”; é “o contador externo do provedor registra um efeito e a resposta é estável entre repetições”. <strong>M12-AT-020</strong>: mesma chave e mesma intenção devolvem a mesma resposta com um efeito. <strong>M12-AT-021</strong>: intenção divergente nega por conflito sem efeito. <strong>M12-AT-022</strong>: duas instâncias concorrentes produzem um efeito. <strong>M12-AT-023</strong>: o crash ambíguo deixa unknown e a reconciliação (recibo ou ausência confirmada) precede qualquer novo efeito.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sintoma</th><th>Hipótese</th><th>Evidência</th><th>Correção</th></tr></thead><tbody>' +
          '<tr><td>Efeito duplicado após timeout</td><td>Retry cego sem estado ambíguo</td><td>Segunda execução sem marca <code>unknown</code> nem consulta</td><td>Marcar desconhecido na falha ambígua e reconciliar antes de repetir</td></tr>' +
          '<tr><td>Resposta antiga para pedido novo</td><td>Chave sem hash da intenção</td><td>Argumentos divergentes aceitos na mesma chave</td><td>Comparar <code>intent_hash</code> e negar com <code>IDEMPOTENCY_INTENT_MISMATCH</code></td></tr>' +
          '<tr><td>Concorrência duplica o efeito</td><td>Contenção em memória por processo</td><td>Duas execuções do efeito para a mesma chave</td><td>Serializar pela chave única do razão durável</td></tr>' +
          '<tr><td>Retry repete negação de regra</td><td>Erro determinístico no orçamento de retry</td><td>Validação ou autorização repetida como transitória</td><td>Repetir só erro transitório; conflito e negação não entram no orçamento</td></tr>' +
          '<tr><td>Reconciliação afirma sem prova</td><td>Sucesso gravado sem recibo</td><td>Estado succeeded sem consulta ao provedor</td><td>Exigir recibo na consulta; ausência confirmada libera nova tentativa, não sucesso</td></tr>' +
          '<tr><td>Repetição sobre desconhecido executa</td><td>Reconciliação pulada</td><td>Efeito executado com estado unknown</td><td>Negar com <code>IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN</code> até reconciliar</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Perigo', html:
          '<p>Chave sem hash, trava só em memória e retry sobre qualquer erro não fecham M12-AT-020 a 023: o primeiro troca o pedido sem ninguém notar, o segundo some com o processo, o terceiro transforma negação de política em tempestade de repetição. A fronteira é razão durável com chave única, intenção vinculada e reconciliação por evidência. O fake em memória prova o contrato, nunca o banco real.</p>' },
        { tipo: 'abas', rotulo: 'Ponte para o laboratório (contratos congelados de B05-L)', itens: [
          { rotulo: 'Contratos', blocos: [
            { tipo: 'texto', largo: true, html:
              '<table><thead><tr><th>Contrato</th><th>Comportamento</th></tr></thead><tbody>' +
              '<tr><td><code>ToolRequest(tenant_id, tool_name, arguments)</code></td><td>Com <code>request_id</code> e <code>intent_hash</code> derivado de tenant, tool e argumentos canonicalizados</td></tr>' +
              '<tr><td><code>IdempotencyConflict</code>, <code>ExecutionState</code> (<code>STARTED</code>, <code>SUCCEEDED</code>, <code>UNKNOWN</code>), <code>ExecutionRecord(intent_hash, state, result)</code></td><td>Erro de conflito e negação; linha do razão</td></tr>' +
              '<tr><td><code>IdempotencyService().execute_once(tenant_id, key, request, effect)</code></td><td>Mesma chave e intenção: resposta gravada, um efeito. Intenção divergente: <code>IDEMPOTENCY_INTENT_MISMATCH</code>. Estado iniciado ou desconhecido: <code>IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN</code>. Falha ambígua: marca <code>UNKNOWN</code></td></tr>' +
              '<tr><td><code>IdempotencyService().reconcile_unknown(tenant_id, key, request, lookup)</code></td><td>Recibo: confirma sem novo efeito. Ausência confirmada: remove o registro e devolve vazio. Fora da janela: <code>IDEMPOTENCY_RECONCILIATION_MISMATCH</code> ou <code>IDEMPOTENCY_NOT_UNKNOWN</code></td></tr>' +
              '<tr><td><code>EntitlementProjection().apply(event)</code> e <code>status(tenant_id, subscription_id)</code></td><td>Convergem eventos duplicados e fora de ordem por versão de domínio; consomem só recibos reconciliados</td></tr>' +
              '</tbody></table>' +
              '<p class="ta-nota">O exercício Python desta aula é uma versão reduzida desses contratos, sem <code>ToolRequest</code> e sem <code>IDEMPOTENCY_RECONCILIATION_MISMATCH</code>.</p>' }] },
          { rotulo: 'Limites e fontes', blocos: [
            { tipo: 'callout', tom: 'neutral', html:
              '<p>Não são alegados aqui: o repositório durável em PostgreSQL com unique constraint, a concorrência entre conexões e processos distintos, a matriz de crashes real, o repasse de chave ao provedor e o outbox. Fontes (baseline de 14/08/2026): Stripe, Idempotent requests, usada só como adapter de referência e de risco de obsolescência alto; HTTP Semantics (RFC 9110); Additional HTTP Status Codes (RFC 6585); Google SRE Workbook (orçamento de retry, backoff com jitter).</p>' }] }
        ] },
        { tipo: 'escolha', id: 'b5-esc-chave', titulo: 'Confira: a chave da intenção',
          pergunta: 'Qual deve ser a chave de idempotência de uma intenção como "reembolsar pedido 9 por 50"?',
          opcoes: [
            { id: 'a', texto: 'Um hash estável da intenção (tenant, ação e argumentos canônicos), não um UUID novo a cada tentativa.', correta: true, porque: 'a chave precisa identificar a intenção: a repetição reutiliza o resultado e a divergência de payload vira conflito.' },
            { id: 'b', texto: 'Um UUID gerado a cada retry.', correta: false, porque: 'chave nova a cada tentativa derrota a idempotência.' },
            { id: 'c', texto: 'O horário da requisição.', correta: false, porque: 'cada retry teria um horário diferente.' },
            { id: 'd', texto: 'O ID da conexão HTTP.', correta: false, porque: 'o retry costuma usar outra conexão.' }
          ], tutorDepois: 'Quem gera a chave, o escopo, a retenção e o replay fazem parte do contrato.' },
        { tipo: 'escolha', id: 'b5-esc-queda', titulo: 'Confira: o processo que cai',
          pergunta: 'Um agente chama uma API de pagamento, o processo cai antes de registrar o resultado e, ao reiniciar, retenta. O que evita a cobrança dupla?',
          opcoes: [
            { id: 'a', texto: 'Retentar sempre, com backoff.', correta: false, porque: 'backoff espaça a repetição, não decide se o efeito ocorreu.' },
            { id: 'b', texto: 'Intenção registrada no razão durável antes do efeito, repasse da chave ao provedor quando houver e reconciliação do estado ambíguo antes de repetir.', correta: true, porque: 'não há transação entre o banco e a API externa; o razão guarda o estado em voo e a consulta resolve a ambiguidade.' },
            { id: 'c', texto: 'Um lock em memória no processo.', correta: false, porque: 'o lock some com o processo que caiu.' },
            { id: 'd', texto: 'Confiar no timeout do cliente HTTP.', correta: false, porque: 'timeout não prova que o efeito não ocorreu.' }
          ], tutorDepois: 'Retry cego é substituído por consulta e reconciliação.' },
        { tipo: 'takeaway', html: 'M12-AT-020 a 023 fecham por <mark>contador externo único</mark>, <mark>resposta estável</mark> e <mark>reconciliação observável</mark>.' }
      ] }
    ]
  });
})();
