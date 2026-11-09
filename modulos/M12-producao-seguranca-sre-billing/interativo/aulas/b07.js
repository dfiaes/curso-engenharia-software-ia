/* M12 · Bloco 7: Metering e unit economics. Fonte: M12.html#b7. Valores dos exemplos são variáveis, nunca medição. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoLedger = [
    'from dataclasses import dataclass', '', '',
    '@dataclass(frozen=True)',
    'class UsageEvent:',
    '    event_id: str',
    '    tenant_id: str',
    '    meter: str',
    '    quantity: float',
    '    occurred_at: int',
    '    source_id: str = "app"', '', '',
    'class UsageLedger:',
    '    def __init__(self):',
    '        self._events = {}', '',
    '    def append(self, ev):',
    '        """True no primeiro recebimento; False na duplicata.',
    '        quantity deve ser positiva (ValueError)."""',
    '        return True', '',
    '    def total(self, tenant_id, meter):',
    '        # soma derivada do ledger, nunca um contador mutável',
    '        return 0.0', '',
    '    def unit_margin(self, tenant_id, meter, *, revenue, allocated_cost):',
    '        # receita menos custo direto medido menos custo alocado declarado',
    '        return 0.0', ''].join('\n');

  var testesLedger = [
    'def ev(i, q, tenant="t1", meter="inference_cost_brl", t=0):',
    '    return UsageEvent(i, tenant, meter, q, t)', '', '',
    'def test_soma_dois_eventos():',
    '    led = UsageLedger()',
    '    assert led.append(ev("e1", 0.40, t=1)) is True',
    '    assert led.append(ev("e2", 0.25, t=2)) is True',
    '    assert abs(led.total("t1", "inference_cost_brl") - 0.65) < 1e-9', '', '',
    'def test_duplicata_nao_soma_de_novo():',
    '    led = UsageLedger()',
    '    e = ev("e1", 0.40)',
    '    assert led.append(e) is True',
    '    assert led.append(e) is False',
    '    assert abs(led.total("t1", "inference_cost_brl") - 0.40) < 1e-9', '', '',
    'def test_fora_de_ordem_converge_para_o_mesmo_total():',
    '    a, b = ev("e1", 0.40, t=1), ev("e2", 0.25, t=2)',
    '    em_ordem, invertido = UsageLedger(), UsageLedger()',
    '    em_ordem.append(a); em_ordem.append(b)',
    '    invertido.append(b); invertido.append(a); invertido.append(a)',
    '    m = "inference_cost_brl"',
    '    assert abs(em_ordem.total("t1", m) - invertido.total("t1", m)) < 1e-9', '', '',
    'def test_controle_negativo_mesmo_id_com_outra_quantidade_nao_soma():',
    '    led = UsageLedger()',
    '    led.append(ev("e1", 0.40))',
    '    assert led.append(ev("e1", 9.99)) is False',
    '    assert abs(led.total("t1", "inference_cost_brl") - 0.40) < 1e-9', '', '',
    'def test_borda_quantidade_nao_positiva_e_rejeitada():',
    '    led = UsageLedger()',
    '    for q in (0, -1):',
    '        try:',
    '            led.append(ev("x", q))',
    '        except ValueError:',
    '            continue',
    '        assert False, "deveria levantar ValueError"', '', '',
    'def test_isola_tenant_e_medidor():',
    '    led = UsageLedger()',
    '    led.append(ev("e1", 1.0, tenant="t1"))',
    '    led.append(ev("e2", 5.0, tenant="t2"))',
    '    led.append(ev("e3", 7.0, tenant="t1", meter="tokens"))',
    '    assert led.total("t1", "inference_cost_brl") == 1.0',
    '    assert led.total("t9", "inference_cost_brl") == 0.0', '', '',
    'def test_margem_deriva_do_ledger():',
    '    led = UsageLedger()',
    '    led.append(ev("e1", 0.40)); led.append(ev("e2", 0.25))',
    '    m = led.unit_margin("t1", "inference_cost_brl", revenue=2.0, allocated_cost=0.30)',
    '    assert abs(m - 1.05) < 1e-9', ''].join('\n');

  var solucaoLedger = [
    'from dataclasses import dataclass', '', '',
    '@dataclass(frozen=True)',
    'class UsageEvent:',
    '    event_id: str',
    '    tenant_id: str',
    '    meter: str',
    '    quantity: float',
    '    occurred_at: int',
    '    source_id: str = "app"', '', '',
    'class UsageLedger:',
    '    def __init__(self):',
    '        self._events = {}', '',
    '    def append(self, ev):',
    '        if ev.quantity <= 0:',
    '            raise ValueError("quantity deve ser positiva")',
    '        if ev.event_id in self._events:',
    '            return False',
    '        self._events[ev.event_id] = ev',
    '        return True', '',
    '    def total(self, tenant_id, meter):',
    '        return sum(e.quantity for e in self._events.values()',
    '                   if e.tenant_id == tenant_id and e.meter == meter)', '',
    '    def unit_margin(self, tenant_id, meter, *, revenue, allocated_cost):',
    '        return revenue - self.total(tenant_id, meter) - allocated_cost', ''].join('\n');

  var codigoCusto = [
    'def entrada_efetiva(tin, hit, desconto):',
    '    """Tokens de entrada equivalentes pagos por chamada.',
    '    hit e desconto são frações (0.3 = 30%)."""',
    '    return tin', '', '',
    'def custo_tarefa(*, preco_in, preco_out, hit, desconto, tin, tout, chamadas):',
    '    """Custo em US$ de uma tarefa; preços em US$ por 1M de tokens."""',
    '    ein = entrada_efetiva(tin, hit, desconto)',
    '    return chamadas * (ein * preco_in + tout * preco_out) / 1e6', '', '',
    'def preco_minimo(custo, margem):',
    '    """Preço que entrega a margem-alvo (fração, ex.: 0.6). margem >= 1 é inválida (ValueError)."""',
    '    return custo', ''].join('\n');

  var testesCusto = [
    'BASE = dict(preco_in=3, preco_out=15, hit=0.3, desconto=0.9, tin=6000, tout=800, chamadas=3)', '', '',
    'def test_entrada_efetiva_com_cache():',
    '    assert abs(entrada_efetiva(6000, 0.3, 0.9) - 4380) < 1e-6', '', '',
    'def test_sem_cache_paga_tudo():',
    '    assert entrada_efetiva(6000, 0.0, 0.9) == 6000', '', '',
    'def test_custo_da_tarefa_do_simulador():',
    '    assert abs(custo_tarefa(**BASE) - 0.07542) < 1e-9', '', '',
    'def test_preco_minimo_para_margem_de_60():',
    '    assert abs(preco_minimo(0.07542, 0.6) - 0.18855) < 1e-9', '', '',
    'def test_mais_chamadas_custam_mais():',
    '    d = dict(BASE, chamadas=6)',
    '    assert custo_tarefa(**d) > custo_tarefa(**BASE)', '', '',
    'def test_margem_invalida():',
    '    try:',
    '        preco_minimo(1.0, 1.0)',
    '    except ValueError:',
    '        return',
    '    assert False, "margem 1.0 deveria levantar ValueError"', ''].join('\n');

  var solucaoCusto = [
    'def entrada_efetiva(tin, hit, desconto):',
    '    return tin * ((1 - hit) + hit * (1 - desconto))', '', '',
    'def custo_tarefa(*, preco_in, preco_out, hit, desconto, tin, tout, chamadas):',
    '    ein = entrada_efetiva(tin, hit, desconto)',
    '    return chamadas * (ein * preco_in + tout * preco_out) / 1e6', '', '',
    'def preco_minimo(custo, margem):',
    '    if margem >= 1:',
    '        raise ValueError("margem deve ser menor que 1")',
    '    return custo / (1 - margem)', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm12-b7',
    titulo: 'Metering e unit economics',
    minutos: 35,
    resumo: 'O bloco 6 limita o gasto antes do efeito; o metering mede o gasto depois. Um ledger append-only por event_id dá o total por tenant, o custo por unidade e a margem sem número inventado.',
    objetivo: 'Registrar uso uma única vez por evento, derivar total, custo e margem do ledger medido e decompor um custo por tarefa que subiu sem aumento de tráfego.',
    revisao: [
      { id: 'm12b7-ledger', pergunta: 'Por que o total de uso por tenant e medidor deve ser uma soma sobre o ledger, e não um contador mutável?',
        opcoes: [
          opc('a', 'A mesma realidade medida duas vezes continua sendo uma só: cada evento entra uma vez e o total é derivado', true, 'o ledger é append-only, com <code>event_id</code> estável; o contador mutável soma cada entrega e não deixa rastro de origem.'),
          opc('b', 'O contador mutável é mais lento que a soma', false, 'o problema não é velocidade, é origem rastreável e deduplicação.'),
          opc('c', 'O ledger dispensa identificador de evento', false, 'sem identificador estável não há como reconhecer a duplicata.')] },
      { id: 'm12b7-dup', pergunta: 'A redelivery de um evento de uso já registrado chega ao <code>append</code>. O que acontece?',
        opcoes: [
          opc('a', 'Devolve falso e o total não se move', true, 'a unicidade por <code>event_id</code> faz a duplicata repetir sem somar de novo; evento fora de ordem soma uma vez.'),
          opc('b', 'Soma de novo, porque é uma nova entrega', false, 'entrega não é consumo novo; é o sintoma "custo dobra após redelivery".'),
          opc('c', 'Levanta erro e derruba o consumidor', false, 'a duplicata é esperada em at-least-once e deve ser absorvida sem efeito.')] },
      { id: 'm12b7-margem', pergunta: 'De onde sai a margem unitária de um tenant, de forma defensável?',
        opcoes: [
          opc('a', 'Receita medida menos custo direto medido menos custo alocado com rateio declarado', true, 'tudo deriva do ledger, e o rateio dos custos compartilhados é critério declarado.'),
          opc('b', 'Um custo fixo por requisição acordado entre as áreas', false, 'custo fixo arbitrário deixa a margem aparentemente constante e sem origem.'),
          opc('c', 'O relatório fechou, logo o número está certo', false, '"o relatório fechou" não é oráculo; o oráculo é a derivação do ledger medido.')] },
      { id: 'm12b7-3x', pergunta: 'O custo por tarefa subiu 3x sem aumento de tráfego. Qual a investigação mais produtiva?',
        opcoes: [
          opc('a', 'Decompor por tenant, feature e modelo e comparar tokens por chamada e chamadas por tarefa antes e depois', true, 'um agente em loop repete contexto; a atribuição por dimensão mostra onde o custo entrou.'),
          opc('b', 'Renegociar o preço por token', false, 'não explica um salto de 3x sem mudança de tráfego.'),
          opc('c', 'Desligar o cache', false, 'o cache reduz o custo da entrada; desligá-lo tende a piorar.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Proteger o custo (bloco 6) limita o gasto <em>antes</em> do efeito; este bloco mede o gasto <em>depois</em> dele. <strong>Metering</strong> responde quantas unidades cada tenant consumiu (inferência, tokens, buscas vetoriais, armazenamento, ferramentas externas) e alimenta o custo por tenant e a margem. O que vem depois da medição, transformar uso em preço, fatura e pagamento junto a um gateway, é cobrança do cliente: está na leitura opcional abaixo e não entra no checkpoint.</p>' +
          '<p>Pré-requisitos: identidade e tenant (blocos 3 e 4), idempotência (bloco 5) e quotas (bloco 6).</p>' +
          '<h3>O ledger de uso append-only</h3>' +
          '<p>O modelo mental é um livro-razão. Cada <code>UsageEvent</code> entra <strong>uma vez</strong>, identificado por um <code>event_id</code> estável, com <code>tenant_id</code>, <code>meter</code>, <code>quantity</code> positiva, <code>occurred_at</code> e <code>source_id</code>. O total por tenant e medidor é uma <strong>soma sobre o ledger</strong>, nunca um contador mutável; assim, a mesma realidade medida duas vezes continua sendo uma só.</p>' +
          '<p><strong>Custos diretos</strong> (inferência, embeddings, busca, armazenamento) somam por medição. <strong>Custos compartilhados</strong> (observabilidade, filas, suporte) entram por um critério de rateio declarado. Valores citados neste bloco são exemplo variável, nunca medição.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>O que o ledger responde</h3>' +
          '<table><thead><tr><th>Pergunta</th><th>Controle</th><th>Negação</th><th>O que não fazer</th></tr></thead><tbody>' +
          '<tr><td>O evento já entrou?</td><td>unicidade por <code>event_id</code>; <code>append</code> devolve falso na duplicata</td><td>duplicata repetida sem somar de novo</td><td>somar cada entrega como se fosse consumo novo</td></tr>' +
          '<tr><td>De onde vêm custo e margem?</td><td>soma derivada do ledger, com rateio declarado</td><td>número sem origem rastreável não entra no relatório</td><td>custo fixo arbitrário ou contador mutável</td></tr>' +
          '</tbody></table>' },
        { tipo: 'abas', rotulo: 'Leitura opcional', itens: [
          { rotulo: 'Cobrança do cliente', blocos: [
            { tipo: 'callout', tom: 'neutral', titulo: 'Leitura opcional · não cobrada no checkpoint', html:
              '<p>Leia se o seu produto vai cobrar por uso. Cinco responsabilidades costumam colapsar numa só:</p>' +
              '<ul><li><strong>Metering</strong>: o ledger acima.</li>' +
              '<li><strong>Pricing</strong>: tabela de preços versionada; trocar a tabela não reescreve o passado.</li>' +
              '<li><strong>Invoicing</strong>: a obrigação consolidada do período.</li>' +
              '<li><strong>Payment</strong>: liquidação junto ao provedor; é estado externo a verificar.</li>' +
              '<li><strong>Entitlement</strong>: se a assinatura habilita a capacidade (ativa, em carência, suspensa, cancelada); evolui por versão, nunca pela ordem de chegada.</li></ul>' +
              '<p>O domínio conhece <code>UsageLedger</code>, <code>EntitlementProjection</code> e <code>ReconciliationIssue</code>; o provedor fica atrás do protocolo <code>BillingProvider</code>, com um fake determinístico obrigatório.</p>' }
          ] },
          { rotulo: 'Webhook e entitlement', blocos: [
            { tipo: 'callout', tom: 'neutral', titulo: 'Webhook é entrada não confiável', html:
              '<p>Verifique a assinatura HMAC em tempo constante, sobre os <strong>bytes crus</strong> e dentro de uma <strong>janela de replay</strong> (<code>WEBHOOK_INVALID_SIGNATURE</code>, <code>WEBHOOK_OUTSIDE_REPLAY_WINDOW</code>), antes de qualquer parse ou mutação, e responda rápido enviando o processamento para fila.</p>' +
              '<p>A projeção de entitlement converge por <code>version</code>: a duplicata repete sem efeito e o evento antigo não rebaixa estado novo.</p>' },
            { tipo: 'codigo', linguagem: 'python', texto: [
              '# Exemplo ilustrativo (nomes reais da projeção e da reconciliação)',
              'projection = EntitlementProjection()',
              'projection.apply(cancelled_v3)  # True: versão nova assume o estado',
              'projection.apply(cancelled_v3)  # False: duplicata repete sem efeito',
              'projection.apply(active_v2)     # False: versão antiga não rebaixa',
              'issue = await reconcile_usage(ledger, provider, tenant, meter)',
              '# iguais: None; diferentes: ReconciliationIssue aberta com expected, observed e status "open"'].join('\n') }
          ] },
          { rotulo: 'Reconciliação e portabilidade', blocos: [
            { tipo: 'callout', tom: 'neutral', titulo: 'Divergência vira registro, não ajuste silencioso', html:
              '<p>A reconciliação periódica compara o total interno com o do provedor. Na divergência, abre uma <code>ReconciliationIssue</code> com esperado, observado e responsável.</p>' +
              '<p>Portabilidade se prova exportando o uso medido em formato aberto, com identificadores estáveis. Os contratos exercidos pelos testes do laboratório (<code>UsageEvent</code>, <code>BillingProvider</code>, <code>FakeBillingProvider</code>, <code>EntitlementEvent</code>, <code>reconcile_usage</code>, <code>verify_webhook</code>) estão em <code>lab/src</code>.</p>' +
              '<p>Preço e comportamento de API de cobrança são informação de alto risco: valem na data consultada. Fontes: Stripe (Webhooks, Idempotent requests, Usage-based billing), usadas só no adapter de referência.</p>' }
          ] }
        ] },
        { tipo: 'takeaway', html: 'O ledger é <mark>append-only</mark> e deduplicado por <mark>event_id</mark>; o total é uma <mark>soma derivada</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Um tenant gera dois eventos de custo de inferência. O segundo chega antes do primeiro por reordenação de fila: o ledger aceita os dois, cada um uma vez. A redelivery do primeiro volta em seguida. A margem do tenant sai de receita medida menos custo direto medido menos custo alocado declarado.</p>' },
        { tipo: 'rode', id: 'b7-rode', titulo: 'Fora de ordem e duplicata no ledger',
          enunciado: 'Rode a sequência. As saídas são <strong>exemplo ilustrativo</strong>; os valores são variáveis.',
          prefixo: '$', entrada: 'ledger.append(earlier)', unidade: 'evento', terminalTitulo: 'UsageLedger (exemplo ilustrativo)',
          prever: { pergunta: 'O evento <code>earlier</code> chega pela segunda vez (redelivery). O que o <code>append</code> devolve e o que acontece com o total?', opcoes: [
            { id: 'a', texto: 'Devolve falso; o total não se move.', correta: true, porque: 'o <code>event_id</code> já está no ledger: a duplicata repete sem somar de novo.' },
            { id: 'b', texto: 'Devolve verdadeiro e soma de novo.', correta: false, porque: 'é o sintoma "custo dobra após redelivery".' },
            { id: 'c', texto: 'Devolve falso, mas o total soma assim mesmo.', correta: false, porque: 'a negação significa exatamente que nada foi somado.' }
          ] },
          etapas: [
            { id: 'later', nome: 'Chega o segundo evento', descricao: 'Fora de ordem', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'ledger.append(later)'),
              L('out', 'True'),
              L('hint', 'primeiro recebimento')] },
            { id: 'earlier', nome: 'Chega o primeiro evento', descricao: 'Fora de ordem também soma', tom: 'request', ms: 1, linhas: [
              L('cmd', 'ledger.append(earlier)'),
              L('out', 'True'),
              L('hint', 'a ordem de chegada não muda o total')] },
            { id: 'dup', nome: 'Redelivery do primeiro', descricao: 'Duplicata', tom: 'tls', ms: 1, linhas: [
              L('cmd', 'ledger.append(earlier)'),
              L('out', 'False'),
              L('hint', 'duplicata não soma de novo')] },
            { id: 'total', nome: 'Total e margem', descricao: 'Derivados do ledger', tom: 'response', ms: 1, linhas: [
              L('cmd', 'ledger.total(tenant, "inference_cost_brl")'),
              L('out', 'soma medida dos dois eventos (cada um uma vez)'),
              L('cmd', 'ledger.unit_margin(tenant, "inference_cost_brl", revenue=..., allocated_cost=...)'),
              L('out', 'receita - direto medido - alocado declarado')] }
          ],
          tutorDepois: 'Fora de ordem e duplicata convergem para o mesmo total: é isso que fecha o M12-AT-031.',
          callout: 'Você viu a duplicata ser absorvida e o total ficar estável.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Diagnóstico</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Custo dobra após redelivery</td><td>entrega tratada como consumo novo (o total cresce na repetição do mesmo <code>event_id</code>)</td><td><code>append</code> idempotente por <code>event_id</code>; devolve falso na duplicata</td></tr>' +
          '<tr><td>Margem parece constante / sem origem rastreável</td><td>custo fixo arbitrário ou contador mutável</td><td>derivar do ledger medido e declarar o rateio</td></tr>' +
          '<tr><td>(opcional) webhook inválido muda estado</td><td>verificação após parse ou mutação</td><td>verificar assinatura e janela sobre bytes crus antes de qualquer mutação</td></tr>' +
          '<tr><td>(opcional) estado rebaixa após evento antigo</td><td>ordem de chegada tratada como verdade</td><td>convergir por <code>version</code>; ignorar versão menor ou igual</td></tr>' +
          '</tbody></table>' +
          '<p>O oráculo nunca é "o relatório fechou". É "cada evento duplicado ou atrasado encontrou o controle correto e a margem deriva de números medidos". <strong>M12-AT-031</strong> fecha quando duplicata e evento fora de ordem convergem para o mesmo total. <strong>M12-AT-032</strong> fecha quando custo, receita e margem derivam do ledger medido. M12-AT-030 (cobrança) é opcional.</p>' },
        { tipo: 'takeaway', html: 'Duplicata e fora de ordem <mark>convergem</mark> para o mesmo total; a margem <mark>deriva</mark> do ledger medido.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b7-python-ledger', titulo: 'Escreva o ledger de uso', obrigatorio: false,
          enunciado: 'Complete <code>UsageLedger</code>: <code>append</code> devolve verdadeiro no primeiro recebimento e falso na duplicata (por <code>event_id</code>) e rejeita quantidade não positiva com <code>ValueError</code>; <code>total</code> soma por tenant e medidor; <code>unit_margin</code> é receita menos custo direto medido menos custo alocado.',
          codigo: codigoLedger, testes: testesLedger,
          dica: 'Guarde os eventos em <code>self._events[ev.event_id]</code> e consulte a chave antes de gravar. <code>total</code> é uma soma sobre <code>self._events.values()</code> filtrada por tenant e medidor; <code>unit_margin</code> reaproveita <code>total</code>.',
          solucao: solucaoLedger,
          tutorDepois: 'Repare que a duplicata com outra quantidade também é negada: o identificador manda, não o conteúdo.',
          callout: 'O ledger passou nos testes: duplicata, fora de ordem, borda e isolamento por tenant.' },
        { tipo: 'python', id: 'b7-python-custo', titulo: 'Custo por tarefa e preço mínimo', obrigatorio: false,
          enunciado: 'Reproduza o cálculo do simulador do bloco: entrada efetiva com cache, custo por tarefa (preços em US$ por 1M de tokens) e preço mínimo para a margem-alvo. Os preços são ilustrativos; confira a tabela do seu provedor.',
          codigo: codigoCusto, testes: testesCusto,
          dica: 'Entrada efetiva = <code>tin * ((1 - hit) + hit * (1 - desconto))</code>: a fração sem cache paga cheio e a fração com cache paga com desconto. Preço mínimo = <code>custo / (1 - margem)</code>.',
          solucao: solucaoCusto,
          tutorDepois: 'Com os valores padrão do simulador (preço 3 e 15, 30% de cache com 90% de desconto, 6.000 tokens de entrada, 800 de saída, 3 chamadas), o custo é US$ 0,0754 por tarefa e o preço mínimo para 60% de margem é US$ 0,1886. Saída costuma custar mais por token que a entrada, e reduzir chamadas por tarefa (agente que repete contexto) é, em geral, a alavanca maior.',
          callout: 'Custo e preço mínimo batem com o simulador do bloco.' },
        { tipo: 'cenario', id: 'b7-cenario', titulo: 'O custo por tarefa subiu 3x', obrigatorio: false,
          enunciado: 'O custo por tarefa triplicou sem aumento de tráfego. Decida como investigar.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A fatura do provedor subiu e o volume de tarefas é o mesmo. Qual o primeiro movimento?', opcoes: [
              { texto: 'Renegociar o preço por token.', vai: 'f-preco', tom: 'ruim', consequencia: 'o preço por token não mudou 3x; o salto vem de quantidade, não de tarifa.' },
              { texto: 'Desligar o cache para simplificar.', vai: 'f-cache', tom: 'ruim', consequencia: 'o cache reduz o custo da entrada; desligá-lo piora o custo.' },
              { texto: 'Decompor o custo por tenant, feature e modelo no ledger e comparar tokens por chamada e chamadas por tarefa antes e depois.', vai: 'achado', tom: 'ok', consequencia: 'atribuição por dimensão é o que unit economics pede.' }
            ] },
            achado: { texto: 'A decomposição mostra que as chamadas por tarefa passaram de 3 para 9 em uma feature: um agente em loop repete o contexto a cada passo. O que você faz?', opcoes: [
              { texto: 'Limitar o loop, reduzir o contexto repetido e acompanhar o custo por tarefa derivado do ledger.', vai: 'f-bom', tom: 'ok', consequencia: 'a alavanca é chamadas por tarefa, e o ledger prova o antes e o depois.' },
              { texto: 'Cobrar a diferença do cliente sem medir por tenant.', vai: 'f-sem', tom: 'ruim', consequencia: 'sem medição atribuível ao tenant, não há cobrança nem margem auditável.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O custo caiu onde entrou, e a margem do tenant segue derivada de número medido e rastreável.' },
            'f-preco': { bom: false, texto: 'A negociação não explica o salto de 3x, e o custo continuou subindo.' },
            'f-cache': { bom: false, texto: 'A entrada passou a ser paga cheia e o custo subiu ainda mais.' },
            'f-sem': { bom: false, texto: 'A cobrança não resistiu à primeira contestação: faltava origem rastreável no ledger.' }
          },
          callout: 'Você decompôs o custo por dimensão antes de agir.' },
        { tipo: 'takeaway', html: 'Custo e margem pedem <mark>atribuição por dimensão</mark>: tokens, saída, cache e <mark>chamadas por tarefa</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b7-escolha-idem', titulo: 'Confira: a chave de idempotência do metering',
          pergunta: 'Por que o metering deve ter chave de idempotência por evento de uso?',
          opcoes: [
            { id: 'a', texto: 'Para acelerar a gravação.', correta: false, porque: 'a chave serve a correção, não à velocidade.' },
            { id: 'b', texto: 'Para que retentativas e reentregas não contem o mesmo uso duas vezes na fatura.', correta: true, porque: 'eventos de uso trafegam em at-least-once; sem deduplicação, a duplicata vira cobrança em dobro.' },
            { id: 'c', texto: 'Para criptografar os eventos.', correta: false, porque: 'idempotência e criptografia são propriedades diferentes.' },
            { id: 'd', texto: 'Para reduzir o armazenamento.', correta: false, porque: 'pode reduzir duplicatas, mas esse não é o motivo.' }
          ] },
        { tipo: 'escolha', id: 'b7-escolha-margem', titulo: 'Confira: o que torna a margem defensável',
          pergunta: 'Qual afirmação sobre a margem por tenant está certa?',
          opcoes: [
            { id: 'a', texto: 'Receita, custo direto e custo alocado derivam do ledger medido, com rateio declarado e origem rastreável.', correta: true, porque: 'sem origem no ledger, o número é ficção.' },
            { id: 'b', texto: 'Um custo fixo por requisição basta, desde que seja revisado no fim do ano.', correta: false, porque: 'custo fixo arbitrário deixa a margem constante e sem origem.' },
            { id: 'c', texto: 'Se o relatório fechou, a margem está correta.', correta: false, porque: 'fechar não prova derivação do ledger medido.' }
          ] },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes do bloco: FinOps Framework e FinOps Unit Economics (custo por unidade, margem de contribuição). Preços do simulador são ilustrativos; preço e comportamento de API de cobrança valem na data consultada.</p>' },
        { tipo: 'takeaway', html: 'Medir é <mark>registrar uma vez</mark>; a margem defensável <mark>nasce do ledger</mark>.' }
      ] }
    ]
  });
})();
