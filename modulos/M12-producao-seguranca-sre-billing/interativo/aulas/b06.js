/* M12 · Bloco 6: Quotas, rate limits, token budgets e circuit breaker financeiro. Fonte: M12.html#b6. Exemplos ilustrativos (valores variáveis); limites distribuídos reais moram na trilha seguinte. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm12-b6',
    titulo: 'Quotas, rate limits, token budgets e circuit breaker financeiro',
    minutos: 45,
    resumo: 'Cinco limites costumam colapsar num só: taxa, simultaneidade, volume, habilitação e exposição monetária. Todo excesso nega antes do efeito, com código estável, regra e prazo; custo variável pede estimar, reservar e confirmar ou liberar.',
    objetivo: 'Separar rate limit, concurrency limit, quota, entitlement e budget; negar antes do efeito com resposta acionável; reservar o custo máximo antes da chamada e fechar toda reserva por confirmação do real ou liberação.',
    revisao: [
      { id: 'm12b6-cinco', pergunta: 'Qual limite responde "quanto do contratado pode ser consumido num período, por tenant e plano"?',
        opcoes: [
          opc('a', 'Quota', true, 'rate limit conta operações por tempo, concurrency limit conta o simultâneo, entitlement decide se o plano habilita a capacidade e budget limita a exposição monetária.'),
          opc('b', 'Concurrency limit', false, 'o limite de simultaneidade protege memória, conexões e slots do provedor, não o volume contratado.'),
          opc('c', 'Entitlement', false, 'entitlement diz se o contrato habilita a capacidade, independentemente do consumo atual.')] },
      { id: 'm12b6-antes', pergunta: 'Quando e como o excesso de quota deve ser negado?',
        opcoes: [
          opc('a', 'Antes de qualquer efeito, com código estável (QUOTA_EXCEEDED), a regra que decidiu e o prazo para repetir', true, 'em HTTP, 429 vem da RFC 6585 e Retry-After da RFC 9110.'),
          opc('b', 'Depois do efeito, com erro genérico', false, 'o efeito já aconteceu e o cliente não sabe quando voltar.'),
          opc('c', 'Em silêncio, descartando o pedido', false, 'a negação precisa ser acionável.')] },
      { id: 'm12b6-reserva', pergunta: 'Qual a sequência correta para um custo variável como uma chamada de modelo?',
        opcoes: [
          opc('a', 'Estimar o máximo, reservar atomicamente contra o teto, executar e então confirmar o real (commit) ou liberar a reserva (release)', true, 'reservar antes impede que chamadas concorrentes vejam "ainda há saldo" ao mesmo tempo.'),
          opc('b', 'Executar e apurar o custo quando a fatura chegar', false, 'o custo só aparece depois do estouro.'),
          opc('c', 'Checar o gasto acumulado já medido e liberar se houver saldo', false, 'sob concorrência, todas passam pelo mesmo "ainda há saldo".')] },
      { id: 'm12b6-replicas', pergunta: 'O limite é 10 req/s e a API roda em 4 réplicas, cada uma com contador local de 10 req/s. Qual o teto efetivo?',
        opcoes: [
          opc('a', 'Até 40 req/s: contadores locais multiplicam o teto; é preciso autoridade compartilhada por escopo ou fração explícita do global', true, 'cada réplica libera o teto cheio.'),
          opc('b', '10 req/s, porque o plano é um só', false, 'o plano é um só, mas a imposição está nas réplicas.'),
          opc('c', '2,5 req/s, o limite dividido', false, 'só vale se a fração for declarada e aplicada em cada réplica.')] },
      { id: 'm12b6-fallback', pergunta: 'Quando o fallback para um modelo mais barato é a resposta correta a uma dependência degradada?',
        opcoes: [
          opc('a', 'Só quando qualidade, residência de dados, segurança e contrato continuam preservados; senão, enfileirar ou abster-se, registrando o caminho tomado', true, 'fallback é política de produto, nunca reação automática universal.'),
          opc('b', 'Sempre, para manter o serviço no ar', false, 'a degradação silenciosa pode violar qualidade, residência ou contrato.'),
          opc('c', 'Nunca: sempre abster-se', false, 'a degradação declarada é válida quando os requisitos se preservam.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Um tenant dispara uma rajada de chamadas de modelo, duas réplicas da API aplicam cada uma o seu contador, e o gasto do mês vai a um múltiplo do contratado. Quatro falhas mostram o desenho que falta: burst que excede o plano, instâncias que dobram o teto com contadores locais, chamada cancelada que vira custo silencioso e fallback para modelo mais barato que viola qualidade, residência ou contrato. Pré-requisitos: identidade, tenant e aprovação (Bloco 3) e idempotência (Bloco 5), que torna a repetição segura; metering e reconciliação (Bloco 7) aparecem só como destino dos custos medidos.</p>' +
          '<h3>Cinco limites que costumam colapsar num só</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Limite</th><th>Pergunta que responde</th><th>Protege</th></tr></thead><tbody>' +
          '<tr><td><strong>Rate limit</strong></td><td>Quantas operações por unidade de tempo um escopo pode iniciar</td><td>A taxa numa janela</td></tr>' +
          '<tr><td><strong>Concurrency limit</strong></td><td>Quantas podem estar abertas ao mesmo tempo</td><td>Memória, conexões e slots do provedor (não a taxa)</td></tr>' +
          '<tr><td><strong>Quota</strong></td><td>Quanto do contratado pode ser consumido num período, por tenant e plano</td><td>O volume contratado</td></tr>' +
          '<tr><td><strong>Entitlement</strong></td><td>Se o contrato habilita a capacidade, independentemente do consumo atual</td><td>O que o plano inclui</td></tr>' +
          '<tr><td><strong>Budget</strong> (de tokens e financeiro)</td><td>Qual exposição máxima uma chamada ou um fluxo pode assumir antes de degradar, enfileirar ou abster-se</td><td>A exposição monetária</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O modelo mental é um funil em camadas com <strong>escopo hierárquico</strong>: tenant, usuário, workload, modelo, tool e operação crítica, cada camada com seu teto e sua janela. A checagem acontece antes de qualquer efeito externo, e a negação carrega a regra identificada e o prazo de repetição. O <strong>token budget</strong> existe em dois níveis: por chamada (o máximo aceitável de uma geração, segundo tokens e preço versionado) e por fluxo (o acumulado de um encadeamento agente antes de exigir degradação).</p>' +
          '<p class="ta-nota">Valores de teto, janela, preço e contagem neste bloco são exemplo variável, nunca medição.</p>' +
          '<h3>Como cada mecanismo conta</h3>' +
          '<ul><li><strong>Token bucket</strong> permite burst controlado até a capacidade do balde.</li>' +
          '<li><strong>Sliding window</strong> aproxima a taxa observada sem fronteiras rígidas de janela.</li>' +
          '<li><strong>Semáforo</strong> limita o simultâneo, não a taxa.</li></ul>' },
        { tipo: 'callout', tom: 'info', titulo: 'A falha distribuída', html:
          '<p>Cada réplica aplica o teto com o seu contador local, de modo que N réplicas liberam N vezes o contratado. A consequência arquitetural: o limite efetivo precisa de <strong>autoridade compartilhada por escopo</strong> ou, quando o fake local prova só o contrato, o teto por instância deve ser declarado como fração explícita do global, nunca como o global inteiro.</p>' },
        { tipo: 'takeaway', html: 'Rate, concorrência, quota, entitlement e budget respondem <mark>perguntas diferentes</mark>, por <mark>escopo hierárquico</mark>, e se verificam em separado.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Negar antes do efeito com resposta acionável</h3>' +
          '<p>A decisão central: todo excesso nega antes do efeito com um código estável, a regra que decidiu e, quando houver repetição legítima, o prazo para voltar. Em HTTP, <code>429 Too Many Requests</code> vem da <strong>RFC 6585</strong> e <code>Retry-After</code> é definido pela <strong>RFC 9110</strong>.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'RateLimit headers ainda são rascunho', html:
          '<p>Os campos <code>RateLimit</code> estão no Internet-Draft <code>draft-ietf-httpapi-ratelimit-headers-11</code> (23/05/2026): work in progress, não um RFC estável. Aparecem como panorama, nunca como contrato prometido. Risco de obsolescência crítico, revisão antes de cada turma.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Pergunta</th><th>Controle</th><th>Negação</th><th>O que não fazer</th></tr></thead><tbody>' +
          '<tr><td>A taxa do escopo estourou?</td><td>Quota por tenant e operação com janela deslizante</td><td><code>QUOTA_EXCEEDED</code> com regra e prazo de repetição</td><td>Responder erro genérico sem dizer quando voltar</td></tr>' +
          '<tr><td>O simultâneo esgotou?</td><td>Semáforo e bulkhead por tenant</td><td>Fila, degrada ou nega antes de abrir nova execução</td><td>Deixar um tenant ruidoso consumir toda a concorrência</td></tr>' +
          '<tr><td>O custo excede o teto?</td><td>Reserva do máximo antes, confirmação do real depois</td><td><code>BUDGET_EXCEEDED</code> antes de executar; <code>ACTUAL_COST_EXCEEDS_RESERVATION</code> se o real supera o reservado</td><td>Executar primeiro e apurar o custo depois</td></tr>' +
          '<tr><td>A dependência degradou?</td><td>Circuit breaker, deadline propagado e orçamento de retry</td><td>Abre o circuito e degrada, enfileira ou abstém-se</td><td>Repetir sem limite e transformar indisponibilidade em tempestade de repetição</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Custo variável pede <strong>estimate, reserve, commit ou release</strong>. Antes da chamada, estime o máximo aceitável segundo tokens, tool e preço versionado; reserve atomicamente contra o teto; durante o streaming, acompanhe o consumo e cancele de modo consistente ao alcançar o limite; depois, confirme o custo medido ou libere a reserva. Uma chamada cancelada pode ter consumido tokens no provedor: “sem resposta” não significa “sem custo”, e a reconciliação decide o fechamento.</p>' +
          '<p>Observe primeiro o efeito dos contadores locais.</p>' },
        { tipo: 'rode', id: 'b6-rode', titulo: 'Quatro réplicas, um limite',
          enunciado: 'Clique em cada etapa e compare o teto efetivo (barra, em req/s). Valores ilustrativos do simulador de token bucket do módulo.',
          prefixo: 'Prompt', entrada: 'limite do plano = 10 req/s por tenant; réplicas = 4', unidade: 'req/s', terminalTitulo: 'teto efetivo',
          prever: { pergunta: 'O limite é 10 req/s e a API roda em 4 instâncias, cada uma com contador local de 10 req/s. Qual o teto efetivo para o tenant?', opcoes: [
            { id: 'a', texto: '10 req/s: o plano é um só.', correta: false, porque: 'o plano é um só, mas quem impõe o limite são as réplicas, cada uma com o seu contador.' },
            { id: 'b', texto: 'Até 40 req/s: contadores locais multiplicam o teto.', correta: true, porque: 'cada instância deixa passar até 10, somando 40.' },
            { id: 'c', texto: '2,5 req/s: o limite é dividido entre as réplicas automaticamente.', correta: false, porque: 'nada divide o limite sozinho; a fração precisa ser declarada.' }
          ] },
          etapas: [
            { id: 'uma', nome: '1 instância', descricao: 'Contador único', tom: 'dns', ms: 10, linhas: [
              L('cmd', 'réplicas = 1; contador local = 10 req/s'),
              L('in', 'teto efetivo: 10 req/s'),
              L('hint', 'um contador, um teto: o desenho que o plano supõe')] },
            { id: 'locais', nome: '4 instâncias, contador local', descricao: 'Cada réplica libera o teto cheio', tom: 'request', ms: 40, linhas: [
              L('cmd', 'réplicas = 4; contador local = 10 req/s em cada uma'),
              L('out', 'teto efetivo: até 40 req/s  (burst também multiplicado)'),
              L('hint', 'N réplicas liberam N vezes o contratado')] },
            { id: 'fracao', nome: 'Fração explícita do global', descricao: 'Cada réplica aplica 1/4', tom: 'tls', ms: 10, linhas: [
              L('cmd', 'réplicas = 4; teto por instância = 10 / 4 = 2,5 req/s'),
              L('in', 'soma dos tetos: 10 req/s'),
              L('hint', 'no fake local, declare o fracionamento: nunca o global inteiro por instância')] },
            { id: 'compartilhada', nome: 'Autoridade compartilhada', descricao: 'Um contador por escopo', tom: 'response', ms: 10, linhas: [
              L('cmd', 'contador único por escopo (tenant e operação), operação atômica'),
              L('in', 'teto efetivo: 10 req/s, em qualquer número de réplicas'),
              L('hint', 'o módulo cita estado compartilhado com operação atômica (por exemplo, Redis com script) como caminho')] }
          ],
          tutorAntes: 'Faça a previsão e clique nas quatro etapas, da primeira à última.',
          tutorDepois: 'O limite do plano não se impõe sozinho nas réplicas: ou há uma autoridade compartilhada por escopo, ou o teto por instância é uma fração declarada do global.',
          callout: 'Você viu o teto efetivo crescer com as réplicas e as duas formas de contê-lo.' },
        { tipo: 'rode', id: 'b6-rode-reserva', titulo: 'Reservar antes ou medir depois', obrigatorio: false,
          enunciado: 'Cinco chamadas chegam ao mesmo tempo contra um orçamento de 10, cada uma com custo máximo estimado de 3. Compare a exposição máxima possível. Cálculo de pior caso com valores ilustrativos.',
          prefixo: 'Prompt', entrada: 'orçamento = 10; custo máximo por chamada = 3; chamadas concorrentes = 5', unidade: 'exposição máx.', terminalTitulo: 'circuit breaker financeiro',
          etapas: [
            { id: 'reserva', nome: 'Reserva o máximo antes', descricao: 'estimate, reserve, commit', tom: 'response', ms: 9, linhas: [
              L('cmd', 'reserve x5  (gasto + exposição aberta + 3 <= 10?)'),
              L('in', 'admitidas: 3 (exposição 9); negadas: 2 com BUDGET_EXCEEDED, antes de executar'),
              L('hint', 'teto garantido mesmo com concorrência: o real é confirmado depois e não passa do reservado')] },
            { id: 'depois', nome: 'Só mede depois', descricao: 'Checa o gasto acumulado já medido', tom: 'dns', ms: 15, linhas: [
              L('cmd', 'gasto medido ainda é 0: "há saldo"  (x5 ao mesmo tempo)'),
              L('out', 'admitidas: 5 (exposição possível: 5 x 3 = 15)'),
              L('hint', 'sem reserva, todas passam pelo mesmo "ainda há saldo" e o custo só aparece depois, acima de 10')] }
          ],
          tutorDepois: 'O custo só é conhecido depois. Sem reserva, a concorrência ultrapassa o teto; com ela, o excesso nega antes da execução.',
          callout: 'A reserva do pior caso é o que dá um teto sob concorrência.' },
        { tipo: 'abas', rotulo: 'Exemplos ilustrativos do guardião (nomes do laboratório; valores variáveis)', itens: [
          { rotulo: 'Quota por tenant', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: [
              'quota = QuotaPolicy(limit=2, window=timedelta(minutes=1))',
              'quota.consume(first_tenant, now=now)    # restante 1',
              'quota.consume(first_tenant, now=now)    # restante 0',
              'quota.consume(second_tenant, now=now)   # isolado: restante 1',
              'quota.consume(first_tenant, now=now)    # LimitExceeded: QUOTA_EXCEEDED',
              'quota.consume(first_tenant, now=now + timedelta(minutes=1))  # janela: restante 1'].join('\n') }] },
          { rotulo: 'Orçamento', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: [
              'ledger = BudgetLedger(Decimal("10.00"))',
              'ledger.reserve("operation-1", Decimal("7.00"))',
              'ledger.reserve("operation-2", Decimal("4.00"))  # LimitExceeded: BUDGET_EXCEEDED',
              'ledger.commit("operation-1", Decimal("2.50"))   # confirma o real; spent soma 2.50',
              'ledger.reserve("operation-2", Decimal("7.50"))  # cabe após a confirmação',
              'ledger.commit("operation", Decimal("3.01"))     # acima do reservado: ACTUAL_COST_EXCEEDS_RESERVATION',
              'ledger.release("cancelled")                     # libera a reserva sem cobrança fantasma'].join('\n') }] }
        ] },
        { tipo: 'takeaway', html: 'Negue <mark>antes do efeito</mark>, com <mark>código, regra e prazo</mark>; sob concorrência, só a <mark>reserva</mark> dá um teto.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Implemente as duas peças que o laboratório exercita: a quota por janela deslizante (M12-AT-040) e o orçamento com reserva (M12-AT-041). Relógio e provedor são controlados e determinísticos.</p>' },
        { tipo: 'python', id: 'b6-python-quota', titulo: 'Quota por tenant com janela deslizante', obrigatorio: false,
          enunciado: 'Complete <code>consume(tenant, *, now)</code>: descarte os consumos que saíram da janela, negue com <code>QUOTA_EXCEEDED</code> e o prazo de repetição (<code>retry_after</code>) ao atingir o limite, ou registre e devolva o restante. O relógio é passado por <code>now</code>.',
          codigo: "from datetime import datetime, timedelta\n\n\nclass LimitExceeded(Exception):\n    def __init__(self, code, retry_after=None):\n        super().__init__(code)\n        self.code = code\n        self.retry_after = retry_after\n\n\nclass QuotaPolicy:\n    def __init__(self, limit, window):\n        self.limit = limit\n        self.window = window\n        self._hist = {}  # tenant -> lista de instantes de consumo\n\n    def consume(self, tenant, *, now):\n        hist = self._hist.setdefault(tenant, [])\n        # 1. descarte consumos que já saíram da janela (instante <= now - window)\n        # 2. se já há `limit` consumos na janela: LimitExceeded(\"QUOTA_EXCEEDED\", retry_after)\n        #    retry_after = quando o consumo mais antigo sai da janela, menos now\n        # 3. senão registre now e devolva quantos consumos ainda restam\n        return self.limit\n\n\nt0 = datetime(2026, 1, 1, 12, 0, 0)\nq = QuotaPolicy(2, timedelta(minutes=1))\nprint(q.consume(\"a\", now=t0))\n", testes: "T0 = datetime(2026, 1, 1, 12, 0, 0)\nMIN = timedelta(minutes=1)\n\n\ndef _estoura(q, tenant, now):\n    try:\n        q.consume(tenant, now=now)\n    except LimitExceeded as e:\n        return e\n    return None\n\n\ndef test_restante_e_negacao_com_regra_e_prazo():\n    q = QuotaPolicy(2, MIN)\n    assert q.consume(\"a\", now=T0) == 1\n    assert q.consume(\"a\", now=T0) == 0\n    e = _estoura(q, \"a\", T0)\n    assert e is not None and e.code == \"QUOTA_EXCEEDED\" and e.retry_after == MIN\n\n\ndef test_isolamento_entre_tenants():\n    q = QuotaPolicy(2, MIN)\n    q.consume(\"a\", now=T0)\n    q.consume(\"a\", now=T0)\n    assert q.consume(\"b\", now=T0) == 1\n\n\ndef test_reset_depois_da_janela():\n    q = QuotaPolicy(2, MIN)\n    q.consume(\"a\", now=T0)\n    q.consume(\"a\", now=T0)\n    assert q.consume(\"a\", now=T0 + MIN) == 1\n\n\ndef test_janela_deslizante_prazo_parcial():\n    q = QuotaPolicy(2, MIN)\n    q.consume(\"a\", now=T0)\n    q.consume(\"a\", now=T0 + timedelta(seconds=30))\n    e = _estoura(q, \"a\", T0 + timedelta(seconds=40))\n    assert e is not None and e.retry_after == timedelta(seconds=20)\n    assert q.consume(\"a\", now=T0 + MIN) == 0\n\n\ndef test_controle_negativo_negado_nao_consome():\n    q = QuotaPolicy(1, MIN)\n    q.consume(\"a\", now=T0)\n    _estoura(q, \"a\", T0)\n    _estoura(q, \"a\", T0)\n    assert q.consume(\"a\", now=T0 + MIN) == 0\n",
          dica: 'Mantenha em <code>hist</code> só os instantes com <code>t &gt; now - window</code>. Se <code>len(hist) &gt;= limit</code>, levante <code>LimitExceeded("QUOTA_EXCEEDED", hist[0] + window - now)</code>. Senão, faça <code>hist.append(now)</code> e devolva <code>limit - len(hist)</code>.',
          solucao: "from datetime import datetime, timedelta\n\n\nclass LimitExceeded(Exception):\n    def __init__(self, code, retry_after=None):\n        super().__init__(code)\n        self.code = code\n        self.retry_after = retry_after\n\n\nclass QuotaPolicy:\n    def __init__(self, limit, window):\n        self.limit = limit\n        self.window = window\n        self._hist = {}\n\n    def consume(self, tenant, *, now):\n        hist = self._hist.setdefault(tenant, [])\n        hist[:] = [t for t in hist if t > now - self.window]\n        if len(hist) >= self.limit:\n            raise LimitExceeded(\"QUOTA_EXCEEDED\", hist[0] + self.window - now)\n        hist.append(now)\n        return self.limit - len(hist)\n",
          tutorDepois: 'O controle negativo importa: uma tentativa negada não consome quota, senão o cliente que insiste nunca sairia do bloqueio.',
          callout: 'A quota nega com a regra e o prazo, isola os tenants e volta depois da janela.' },
        { tipo: 'python', id: 'b6-python-orcamento', titulo: 'Orçamento: reserve, commit, release', obrigatorio: false,
          enunciado: 'Complete <code>BudgetLedger</code>: <code>reserve</code> nega com <code>BUDGET_EXCEEDED</code> quando gasto confirmado, exposição aberta e novo máximo superam o teto; <code>commit</code> nega com <code>ACTUAL_COST_EXCEEDS_RESERVATION</code> quando o real supera o reservado; <code>release</code> fecha a reserva sem custo.',
          codigo: "from decimal import Decimal\n\n\nclass LimitExceeded(Exception):\n    def __init__(self, code):\n        super().__init__(code)\n        self.code = code\n\n\nclass BudgetLedger:\n    def __init__(self, limit):\n        self.limit = limit\n        self.spent = Decimal(0)\n        self._reservas = {}  # chave -> máximo reservado\n\n    def reserve(self, key, maximum):\n        # 1. gasto confirmado + exposição aberta + novo máximo > limite -> BUDGET_EXCEEDED\n        self._reservas[key] = maximum\n\n    def commit(self, key, actual):\n        # 2. real acima do reservado -> ACTUAL_COST_EXCEEDS_RESERVATION (a reserva continua aberta)\n        # 3. senão, some o real a spent e feche a reserva\n        pass\n\n    def release(self, key):\n        # 4. cancelamento: feche a reserva sem custo\n        pass\n\n\nb = BudgetLedger(Decimal(\"10.00\"))\nb.reserve(\"op-1\", Decimal(\"7.00\"))\nprint(b.spent)\n", testes: "D = Decimal\n\n\ndef _codigo(fn):\n    try:\n        fn()\n    except LimitExceeded as e:\n        return e.code\n    return None\n\n\ndef test_segunda_reserva_estoura_antes_de_executar():\n    b = BudgetLedger(D(\"10.00\"))\n    b.reserve(\"op-1\", D(\"7.00\"))\n    assert _codigo(lambda: b.reserve(\"op-2\", D(\"4.00\"))) == \"BUDGET_EXCEEDED\"\n\n\ndef test_commit_libera_espaco_para_a_proxima_reserva():\n    b = BudgetLedger(D(\"10.00\"))\n    b.reserve(\"op-1\", D(\"7.00\"))\n    b.commit(\"op-1\", D(\"2.50\"))\n    assert b.spent == D(\"2.50\")\n    b.reserve(\"op-2\", D(\"7.50\"))\n\n\ndef test_real_acima_do_reservado_nega_e_nao_soma():\n    b = BudgetLedger(D(\"10.00\"))\n    b.reserve(\"op\", D(\"3.00\"))\n    assert _codigo(lambda: b.commit(\"op\", D(\"3.01\"))) == \"ACTUAL_COST_EXCEEDS_RESERVATION\"\n    assert b.spent == D(\"0\")\n\n\ndef test_cancelamento_libera_sem_cobranca_fantasma():\n    b = BudgetLedger(D(\"10.00\"))\n    b.reserve(\"cancelada\", D(\"9.00\"))\n    b.release(\"cancelada\")\n    assert b.spent == D(\"0\")\n    b.reserve(\"nova\", D(\"10.00\"))\n\n\ndef test_controle_negativo_exatamente_no_teto_cabe():\n    b = BudgetLedger(D(\"10.00\"))\n    b.reserve(\"a\", D(\"10.00\"))\n    assert _codigo(lambda: b.reserve(\"b\", D(\"0.01\"))) == \"BUDGET_EXCEEDED\"\n",
          dica: 'Some as reservas abertas com <code>sum(self._reservas.values(), start=Decimal(0))</code>. No <code>commit</code>, compare <code>actual</code> com <code>self._reservas[key]</code> antes de somar a <code>spent</code> e de apagar a reserva. No <code>release</code>, <code>pop(key, None)</code>.',
          solucao: "from decimal import Decimal\n\n\nclass LimitExceeded(Exception):\n    def __init__(self, code):\n        super().__init__(code)\n        self.code = code\n\n\nclass BudgetLedger:\n    def __init__(self, limit):\n        self.limit = limit\n        self.spent = Decimal(0)\n        self._reservas = {}\n\n    def reserve(self, key, maximum):\n        aberta = sum(self._reservas.values(), start=Decimal(0))\n        if self.spent + aberta + maximum > self.limit:\n            raise LimitExceeded(\"BUDGET_EXCEEDED\")\n        self._reservas[key] = maximum\n\n    def commit(self, key, actual):\n        if actual > self._reservas[key]:\n            raise LimitExceeded(\"ACTUAL_COST_EXCEEDS_RESERVATION\")\n        self.spent += actual\n        del self._reservas[key]\n\n    def release(self, key):\n        self._reservas.pop(key, None)\n",
          tutorDepois: 'Toda reserva fecha por confirmação do real ou por liberação, nunca por abandono: reserva aberta depois de cancelamento ou timeout é custo fantasma.',
          callout: 'Reserva antes do efeito, confirmação do real depois e cancelamento sem cobrança fantasma.' },
        { tipo: 'cenario', id: 'b6-cenario', titulo: 'Dependência degradada e chamada cancelada', obrigatorio: false,
          enunciado: 'O orçamento do fluxo está perto do teto, o modelo principal degradou e a fila cresce. Decida e veja o custo de cada caminho.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Chegam chamadas novas e o provedor principal responde devagar, com erros. O que o guardião faz?', opcoes: [
              { texto: 'Trocar automaticamente para o modelo mais barato, em qualquer caso.', vai: 'f-silencioso', tom: 'ruim', consequencia: 'a troca silenciosa pode violar qualidade, residência de dados, segurança ou contrato.' },
              { texto: 'Repetir sem limite até o provedor voltar.', vai: 'f-tempestade', tom: 'ruim', consequencia: 'a indisponibilidade vira tempestade de repetição, e o custo cresce.' },
              { texto: 'Abrir o circuito e degradar só se qualidade, residência, segurança e contrato se preservam; senão enfileirar ou abster-se, registrando o caminho.', vai: 'cancel', tom: 'ok', consequencia: 'a degradação é declarada e verificável.' }
            ] },
            cancel: { texto: 'Uma chamada reservada foi cancelada no meio do streaming, e o provedor não devolveu resposta completa. O que fecha a reserva?', opcoes: [
              { texto: 'Deixar aberta: sem resposta significa sem custo.', vai: 'f-fantasma', tom: 'ruim', consequencia: 'tokens podem ter sido consumidos no provedor: o custo fica escondido e a exposição nunca fecha.' },
              { texto: 'Fechar por confirmação do uso medido e reconciliado; se nada foi consumido, liberar sem cobrança.', vai: 'f-bom', tom: 'ok', consequencia: 'cada reserva termina em commit ou release, com uso medido.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O excesso nega ou degrada de forma declarada, e nenhum custo silencioso sobrevive ao cancelamento.' },
            'f-silencioso': { bom: false, texto: 'Respostas de qualidade menor saíram para um cliente cujo contrato exigia o modelo original.' },
            'f-tempestade': { bom: false, texto: 'A repetição sem limite saturou a dependência e atrasou a recuperação.' },
            'f-fantasma': { bom: false, texto: 'O orçamento parecia saudável, mas o custo real do provedor apareceu na fatura sem reserva correspondente.' }
          },
          callout: 'Você degradou só com requisitos preservados e fechou a reserva com uso medido.' },
        { tipo: 'takeaway', html: 'Toda reserva fecha em <mark>commit</mark> ou <mark>release</mark>, e o fallback barato é <mark>política de produto</mark>, não reflexo.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>O que prova que o limite segurou</h3>' +
          '<p>O oráculo nunca é “o sistema aguentou o pico”; é “o excesso encontrou o limite correto com resposta acionável, e nenhum custo silencioso sobreviveu”. <strong>M12-AT-040</strong> fecha quando excesso de request, token e concorrência nega no limite certo com regra e prazo de repetição. <strong>M12-AT-041</strong> fecha quando o orçamento excedido interrompe ou degrada a operação e o cancelamento fecha a reserva com uso medido e reconciliado.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sintoma</th><th>Hipótese</th><th>Evidência</th><th>Correção</th></tr></thead><tbody>' +
          '<tr><td>Excesso executa sem negação</td><td>Checagem após o efeito ou ausente no caminho</td><td>Consumo além do teto sem <code>QUOTA_EXCEEDED</code></td><td>Consumir a quota antes de qualquer efeito e negar com o código estável</td></tr>' +
          '<tr><td>Duas instâncias dobram o teto</td><td>Contador local por réplica tratado como global</td><td>Cada réplica libera o teto cheio</td><td>Autoridade compartilhada por escopo; no fake, declarar o fracionamento explícito</td></tr>' +
          '<tr><td>Cliente repete sem saber quando voltar</td><td>Negação sem prazo nem regra</td><td>Resposta sem <code>Retry-After</code> nem identificador de regra</td><td>Devolver 429 com <code>Retry-After</code>, regra e corpo acionável</td></tr>' +
          '<tr><td>Cancelada e ainda assim cobrada</td><td>Reserva sem fechamento reconciliado</td><td>Reserva aberta após cancelamento ou timeout</td><td>Fechar toda reserva por confirmação do real ou liberação, nunca por abandono</td></tr>' +
          '<tr><td>Fallback barato degrada o contrato</td><td>Troca automática sem checar requisitos</td><td>Qualidade, residência ou segurança violadas na degradação</td><td>Fallback só com requisitos preservados; senão, fila ou abstenção declarada</td></tr>' +
          '<tr><td>Real acima do reservado é aceito</td><td>Confirmação sem comparar com o máximo</td><td>Gasto confirmado maior que a reserva</td><td><code>commit</code> nega com <code>ACTUAL_COST_EXCEEDS_RESERVATION</code></td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Perigo', html:
          '<p>Contador por instância, negação sem prazo, “sem resposta significa sem custo” e campos <code>RateLimit</code> tratados como RFC estável não fecham M12-AT-040 nem M12-AT-041. O primeiro multiplica o teto pelo número de réplicas, o segundo transforma cliente legítimo em retry cego, o terceiro esconde custo real do provedor e o quarto promete um contrato que ainda é rascunho.</p>' },
        { tipo: 'abas', rotulo: 'Ponte para o laboratório (contratos congelados de B06-L)', itens: [
          { rotulo: 'Contratos', blocos: [
            { tipo: 'texto', largo: true, html:
              '<table><thead><tr><th>Contrato</th><th>Comportamento</th></tr></thead><tbody>' +
              '<tr><td><code>LimitExceeded</code></td><td>Erro de negação de limite</td></tr>' +
              '<tr><td><code>QuotaPolicy(limit, window)</code> com <code>consume(tenant_id, *, now)</code></td><td>Janela deslizante por tenant com relógio controlado; devolve o restante como inteiro; nega com <code>QUOTA_EXCEEDED</code> além do teto; isola tenants; reinicia após a janela</td></tr>' +
              '<tr><td><code>Reservation(maximum, committed)</code></td><td>Linha do orçamento</td></tr>' +
              '<tr><td><code>BudgetLedger(limit)</code>: <code>reserve(key, maximum)</code>, <code>commit(key, actual)</code>, <code>release(key)</code>, <code>spent</code></td><td><code>BUDGET_EXCEEDED</code> quando gasto confirmado + exposição aberta + novo máximo supera o teto; <code>ACTUAL_COST_EXCEEDS_RESERVATION</code> quando o real supera o reservado; <code>release</code> libera sem custo; <code>spent</code> soma os confirmados</td></tr>' +
              '</tbody></table>' +
              '<p class="ta-nota">Os exercícios Python desta aula são versões reduzidas desses contratos; o <code>retry_after</code> do exercício é uma extensão didática do <code>QUOTA_EXCEEDED</code>.</p>' }] },
          { rotulo: 'Limites e fontes', blocos: [
            { tipo: 'callout', tom: 'neutral', html:
              '<p>Não são alegados aqui: limites distribuídos de request, token e concorrência entre processos, token budget por chamada e por fluxo no adapter, circuit breaker, deadline e orçamento de retry (Capstone), cancelamento com uso medido do provedor e reconciliação com o ledger. Fontes (baseline de 14/08/2026): RFC 6585, RFC 9110, Google SRE Workbook e o Internet-Draft de campos RateLimit (draft-11, 23/05/2026), este último marcado como work in progress e de risco de obsolescência crítico.</p>' }] }
        ] },
        { tipo: 'escolha', id: 'b6-esc-http', titulo: 'Confira: o que a resposta de limite promete',
          pergunta: 'Ao negar um excesso de taxa por HTTP, qual combinação está apoiada em padrão estável?',
          opcoes: [
            { id: 'a', texto: '429 (RFC 6585) com Retry-After (RFC 9110), mais regra identificada no corpo.', correta: true, porque: 'são especificações estáveis; o corpo acionável é parte do contrato do seu serviço.' },
            { id: 'b', texto: 'Os campos RateLimit, tratados como padrão vigente.', correta: false, porque: 'estão no Internet-Draft draft-ietf-httpapi-ratelimit-headers-11, trabalho em andamento, não um RFC estável.' },
            { id: 'c', texto: '500 genérico, para o cliente não explorar o limite.', correta: false, porque: 'a negação sem regra nem prazo transforma cliente legítimo em retry cego.' }
          ], tutorDepois: 'Campos RateLimit entram como panorama, nunca como contrato prometido.' },
        { tipo: 'escolha', id: 'b6-esc-cancelada', titulo: 'Confira: cancelada é sem custo?',
          pergunta: 'Uma chamada é cancelada no meio do streaming e nenhuma resposta chega ao cliente. Qual leitura do custo está correta?',
          opcoes: [
            { id: 'a', texto: 'Sem resposta significa sem custo; a reserva pode ser abandonada.', correta: false, porque: 'o provedor pode ter consumido tokens; a reserva abandonada esconde custo real.' },
            { id: 'b', texto: 'Pode ter havido consumo no provedor: a reserva fecha por confirmação do uso medido e reconciliado, ou por liberação se nada foi consumido.', correta: true, porque: 'toda reserva fecha em commit ou release, e a reconciliação decide o fechamento.' },
            { id: 'c', texto: 'Cobrar o máximo reservado do cliente, por segurança.', correta: false, porque: 'a reserva é exposição, não cobrança; o custo afirmado vem da medição.' }
          ], tutorDepois: 'Sem custo silencioso: cada reserva termina com uso medido.' },
        { tipo: 'takeaway', html: 'M12-AT-040 e 041 fecham por <mark>negação</mark> e <mark>fechamento observáveis</mark> em teste, com limites explícitos para a trilha distribuída.' }
      ] }
    ]
  });
})();
