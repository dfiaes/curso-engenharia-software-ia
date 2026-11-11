/* M13 · Bloco 13: metering, entitlement e reconciliação de billing. Fonte: M13.html#h-b13. O rode calcula o exemplo do simulador do bloco (cinco eventos, dois duplicados). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoBill = String.raw`def add_usage(ledger, key, units):
    # LACUNA: ledger append-only, dedup por idempotency_key.
    # Devolve True se gravou, False se a chave ja existia.
    ledger.append({"key": key, "units": units})
    return True

def reconcile(events):
    # LACUNA: deduplique por id, ordene por (created, id) e some.
    # Tipos validos: "paid", "refund". Outro tipo -> ValueError.
    return {"balance": sum(e["amt"] for e in events), "order": [e["id"] for e in events]}
`;
  var solucaoBill = String.raw`def add_usage(ledger, key, units):
    if any(e["key"] == key for e in ledger):
        return False
    ledger.append({"key": key, "units": units})
    return True

def reconcile(events):
    vistos = {}
    for e in events:
        if e["type"] not in ("paid", "refund"):
            raise ValueError("evento desconhecido: " + e["type"])
        vistos.setdefault(e["id"], e)
    ordem = sorted(vistos.values(), key=lambda e: (e["created"], e["id"]))
    return {"balance": sum(e["amt"] for e in ordem), "order": [e["id"] for e in ordem]}
`;
  var testesBill = String.raw`import random

EV = [
    {"id": "e1", "type": "paid", "created": 1, "amt": 100},
    {"id": "e3", "type": "paid", "created": 2, "amt": 50},
    {"id": "e2", "type": "refund", "created": 3, "amt": -30},
    {"id": "e1", "type": "paid", "created": 1, "amt": 100},
    {"id": "e2", "type": "refund", "created": 3, "amt": -30},
]

def test_ledger_dedup_por_chave():
    led = []
    assert add_usage(led, "k1", 5) is True
    assert add_usage(led, "k1", 5) is False
    assert add_usage(led, "k2", 3) is True
    assert sum(e["units"] for e in led) == 8

def test_saldo_e_ordem():
    r = reconcile(EV)
    assert r["balance"] == 120 and r["order"] == ["e1", "e3", "e2"]

def test_converge_sob_embaralhamento():
    base = reconcile(EV)
    for seed in (1, 2, 3, 4, 5):
        copia = EV[:]
        random.Random(seed).shuffle(copia)
        assert reconcile(copia) == base

def test_reexecucao_nao_muda_nada():
    assert reconcile(EV) == reconcile(EV)

def test_tipo_desconhecido_e_rejeitado():
    try:
        reconcile([{"id": "x", "type": "chargeback", "created": 1, "amt": -5}])
    except ValueError:
        return
    assert False, "deveria levantar ValueError"
`;

  TrilhaAula.registrar({
    id: 'm13-b13',
    titulo: 'Metering, entitlement e reconciliação de billing',
    minutos: 30,
    resumo: 'Billing é onde evento duplicado vira cobrança dupla e evento perdido vira receita perdida. O ledger é append-only, a margem é derivada e os webhooks convergem sob caos.',
    objetivo: 'Explicar a idempotência em duas camadas, o que significa convergir na reconciliação, por que todo número publicado é derivado do ledger e quando um fake provider é evidência válida.',
    revisao: [
      { id: 'm13b13-ledger', pergunta: 'Qual é a regra do usage ledger?',
        opcoes: [
          opc('a', 'Append-only, com dedup por <code>idempotency_key</code>; custo, receita e margem são derivados dele', true, 'repetir a gravação não duplica, e nenhum número é digitado.'),
          opc('b', 'Um contador mutável por cliente', false, 'contador mutável perde auditoria e dobra com retry.'),
          opc('c', 'Uma tabela editada à mão no fechamento', false, 'número digitado não reconcilia com o ledger.')] },
      { id: 'm13b13-duas', pergunta: 'Por que idempotência precisa existir no ledger e também no consumidor de webhook?',
        opcoes: [
          opc('a', 'Retry de cliente duplica uso (chave de uso); o provedor reenvia eventos (id do evento). São duas fontes de duplicata', true, 'cada camada protege uma entrada diferente.'),
          opc('b', 'Uma delas basta, a outra é redundância', false, 'as duas entradas têm chaves diferentes.'),
          opc('c', 'Porque o Stripe exige', false, 'a razão é de correção, não do provedor.')] },
      { id: 'm13b13-conv', pergunta: 'Como a reconciliação converge para o mesmo saldo com eventos duplicados e fora de ordem?',
        opcoes: [
          opc('a', 'Ordena por <code>(created, id)</code> e deduplica por <code>id</code>; o teste embaralha com cinco sementes e confere o mesmo resultado', true, 'processar na ordem de chegada permite refund antes de paid e saldo explodido.'),
          opc('b', 'Descarta todo evento que aparece duas vezes', false, 'descartaria também o primeiro e perderia receita.'),
          opc('c', 'Confia na ordem de chegada do provedor', false, 'a chegada não é a ordem de criação.')] },
      { id: 'm13b13-fake', pergunta: 'Quando o <code>FakeProvider</code> é evidência válida?',
        opcoes: [
          opc('a', 'Quando é explicitamente rotulado como fake; o Stripe real está BLOCKED ambiental (sem credenciais nem rede)', true, 'o rótulo está no código e no docstring; sem ele seria simulação disfarçada.'),
          opc('b', 'Sempre, porque o contrato é igual', false, 'ele prova a lógica de reconciliação, não a integração real.'),
          opc('c', 'Nunca', false, 'prova o que está declarado provar: convergência e idempotência.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Cobrar duas vezes, ou nenhuma</h3>' +
          '<p>O cliente repete uma requisição por timeout e o uso é contado em dobro. O provedor reenvia um webhook e o saldo é creditado duas vezes. Um refund chega antes do pagamento e o saldo fica negativo. Billing é onde evento duplicado vira cobrança dupla e evento perdido vira receita perdida.</p>' +
          '<h3>Modelo mental</h3>' +
          '<ul><li><strong>Usage ledger:</strong> append-only, com dedup por <code>idempotency_key</code>. É a única fonte de verdade de consumo.</li>' +
          '<li><strong>Entitlement e quota:</strong> funções puras do plano mais o ledger, nunca flags gravadas à mão.</li>' +
          '<li><strong>Custo e margem:</strong> derivados do ledger. O teste de margem confere centavo a centavo a partir dos eventos, e o plano free sai com margem negativa real, não maquiada.</li>' +
          '<li><strong>Webhooks:</strong> a reconciliação ordena por <code>(created, id)</code> e deduplica por <code>id</code>; evento de tipo desconhecido é rejeitado com erro, não engolido.</li></ul>' +
          '<p><strong>Convergir</strong> significa que qualquer permutação da mesma entrada produz o mesmo saldo final, e reexecutar sobre o mesmo provedor não muda nada. O teste embaralha a entrada com cinco sementes.</p>' +
          '<p><strong>Limite:</strong> Stripe real ou test-mode é <strong>BLOCKED ambiental</strong> (sem credenciais nem rede). O <code>FakeProvider</code> é rotulado no código e no docstring: prova a lógica de reconciliação, não a integração real.</p>' },
        { tipo: 'ordene', id: 'b13-ordene', titulo: 'Ponha a reconciliação na ordem',
          enunciado: 'Ponha as etapas da reconciliação de webhooks na ordem em que o bloco as descreve.',
          itens: [
            { id: 'soma', texto: 'Aplicar os eventos e derivar o saldo' },
            { id: 'ordena', texto: 'Ordenar por <code>(created, id)</code>' },
            { id: 'valida', texto: 'Rejeitar evento de tipo desconhecido' },
            { id: 'dedup', texto: 'Deduplicar por <code>id</code> do evento' }
          ], solucao: ['valida', 'dedup', 'ordena', 'soma'],
          dica: 'Primeiro valide o que entra, depois limpe duplicatas, depois ordene, e só então some.',
          tutorDepois: 'A ordem de aplicação vem do tempo de criação, não da chegada. A validação antes de tudo impede que um tipo desconhecido seja engolido.' },
        { tipo: 'takeaway', html: 'Ledger <mark>append-only</mark>, número <mark>derivado</mark> e webhook que <mark>converge</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>O bloco traz um simulador com cinco eventos de exemplo, dois deles duplicados: <code>e1</code> paid +100, <code>e3</code> paid +50, <code>e2</code> refund −30, <code>e1</code> de novo e <code>e2</code> de novo. O saldo correto é 120. Abaixo, uma chegada embaralhada de exemplo, calculada à mão no mesmo critério do simulador.</p>' +
          '<p>Execução registrada no bloco (<code>test_billing.py</code>, 7 testes): <code>ledger_dedup_por_chave</code>, <code>quota_e_entitlement_derivados_do_plano</code>, <code>reconciliacao_converge_com_duplicados_e_desordem</code>, <code>reconciliacao_idempotente_na_reexecucao</code>, <code>webhook_desconhecido_e_rejeitado</code>, <code>custo_por_analise_derivado_do_ledger</code> e <code>margem_por_plano_derivada</code>.</p>' },
        { tipo: 'rode', id: 'b13-rode', titulo: 'Ingênuo contra reconciliado', enunciado: 'Aperte Enter. Os saldos são o cálculo do exemplo (chegada: e2, e1, e3, e1, e2).',
          prefixo: '$', entrada: 'python reconcilia_exemplo.py --chegada e2,e1,e3,e1,e2', unidade: 'eventos', terminalTitulo: 'exemplo (cálculo do simulador do bloco)',
          prever: { pergunta: 'Processando na ordem de chegada, sem dedup, qual é o saldo final dos cinco eventos?', opcoes: [
            { id: 'a', texto: '120', correta: false, porque: '120 é o saldo correto, que só sai depois de deduplicar.' },
            { id: 'b', texto: '190', correta: true, porque: '100 + 50 − 30 + 100 − 30 = 190: os duplicados entram duas vezes.' },
            { id: 'c', texto: '70', correta: false, porque: '70 é o saldo parcial depois do segundo evento, não o final.' }
          ] },
          etapas: [
            { id: 'ing', nome: 'Ingênuo', descricao: 'Ordem de chegada, sem dedup', tom: 'dns', ms: 5, linhas: [
              L('cmd', 'python reconcilia_exemplo.py --chegada e2,e1,e3,e1,e2'),
              L('out', 'e2 refund -30 -> saldo -30  (negativo!)'),
              L('out', 'e1 paid +100 -> saldo 70'),
              L('out', 'e3 paid +50 -> saldo 120'),
              L('out', 'e1 paid +100 -> saldo 220  (duplicado)'),
              L('out', 'e2 refund -30 -> saldo 190  (duplicado)'),
              L('hint', 'o refund chegou antes do paid e os duplicados foram contados duas vezes')] },
            { id: 'rec', nome: 'Reconciliado', descricao: 'Dedup por id, ordem (created, id)', tom: 'request', ms: 3, linhas: [
              L('out', 'ordem aplicada: e1, e3, e2'),
              L('in', 'saldo reconciliado: 120'),
              L('hint', 'nenhum saldo intermediário negativo')] },
            { id: 'conv', nome: 'Convergência', descricao: 'Qualquer permutação, mesmo saldo', tom: 'response', ms: 2, linhas: [
              L('info', 'cinco embaralhamentos diferentes -> 120, 120, 120, 120, 120'),
              L('hint', 'é o que <code>test_reconciliacao_converge_com_duplicados_e_desordem</code> verifica com cinco sementes')] }
          ],
          tutorAntes: 'Responda a previsão e aperte Enter.',
          callout: 'Você viu o saldo ingênuo divergir e o reconciliado convergir para 120.' },
        { tipo: 'takeaway', html: 'O que importa é o <mark>saldo</mark> ser o mesmo em <mark>qualquer ordem</mark> de chegada.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b13-python', titulo: 'Ledger idempotente e reconciliação', obrigatorio: false,
          enunciado: 'Implemente <code>add_usage(ledger, key, units)</code> (devolve <code>False</code> se a chave já existe) e <code>reconcile(events)</code>: deduplique por <code>id</code>, ordene por <code>(created, id)</code>, rejeite tipo fora de <code>paid</code>/<code>refund</code> com <code>ValueError</code> e devolva <code>{"balance", "order"}</code>. Versão reduzida do <code>billing.py</code> do bloco.',
          codigo: codigoBill, testes: testesBill,
          dica: 'Use um dict <code>id → evento</code> com <code>setdefault</code> para ficar com a primeira ocorrência, depois <code>sorted(..., key=lambda e: (e["created"], e["id"]))</code>.',
          solucao: solucaoBill,
          tutorDepois: 'A convergência vem de a função ser pura sobre o <em>conjunto</em> de eventos: a ordem de chegada deixa de ser entrada.',
          callout: 'Seu ledger não duplica e sua reconciliação converge sob embaralhamento.' },
        { tipo: 'escolha', id: 'b13-esc1', titulo: 'Margem digitada', pergunta: 'O README publica "margem do plano pro: 62%" digitada à mão. Qual é a leitura do bloco?',
          opcoes: [
            opc('a', 'Aceitável se estiver atualizada', false, 'número digitado não reconcilia com o ledger.'),
            opc('b', 'Derivar do ledger ou não publicar', true, 'o teste de margem confere centavo a centavo a partir dos eventos.'),
            opc('c', 'Arredondar para parecer mais honesto', false, 'o plano free sai com margem negativa real, não maquiada.')] },
        { tipo: 'escolha', id: 'b13-esc2', titulo: 'Evento desconhecido', pergunta: 'Chega um webhook de um tipo que o consumidor não conhece. O que o bloco manda fazer?',
          opcoes: [
            opc('a', 'Ignorar para não quebrar o fluxo', false, 'divergência silenciosa: o saldo deixa de bater sem aviso.'),
            opc('b', 'Rejeitar com erro', true, 'engolir evento desconhecido esconde divergência; <code>test_webhook_desconhecido_e_rejeitado</code> exige a rejeição.'),
            opc('c', 'Tratar como <code>paid</code>', false, 'inventaria receita.')] },
        { tipo: 'takeaway', html: 'Duas camadas de <mark>idempotência</mark>: chave de uso no ledger, <mark>id de evento</mark> no webhook.' }
      ] }
    ]
  });
})();
