/* M02A · Bloco 7: falha parcial, entrega e consistência. Fonte: M02A.html#b7. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'class ConflictError(Exception):', '    pass', '', '',
    'def on_send(state):', '    # relógio lógico de Lamport: incrementa e carimba a mensagem', '    return {"clock": 0}', '', '',
    'def on_receive(state, msg):', '    # clock = max(local, recebido) + 1', '    pass', '', '',
    'class Caixa:', '    def __init__(self):', '        self.intencoes = {}   # chave -> intenção', '        self.efeitos = []     # efeitos realmente aplicados', '',
    '    def entregar(self, chave, intencao, evento):',
    '        # repetição (mesma chave e intenção): não aplica de novo, devolve False',
    '        # mesma chave, outra intenção: ConflictError',
    '        # chave nova: aplica o efeito e devolve True', '        return True', '', '',
    'def compensar(log):', '    # log: lista de passos concluídos, na ordem de execução', '    # devolve as compensações na ordem inversa, ex.: ["desfaz:b", "desfaz:a"]', '    return []', ''].join('\n');
  var testes = [
    'def test_lamport_envio_e_recepcao():',
    '    a = {"clock": 0}; b = {"clock": 5}', '    m = on_send(a)', '    assert m["clock"] == 1 and a["clock"] == 1',
    '    on_receive(b, m)', '    assert b["clock"] == 6', '    c = {"clock": 0}; on_receive(c, {"clock": 9})', '    assert c["clock"] == 10', '', '',
    'def test_repeticao_nao_duplica_efeito():',
    '    cx = Caixa()', '    assert cx.entregar("k1", "i1", "e") is True', '    assert cx.entregar("k1", "i1", "e") is False', '    assert cx.efeitos == ["e"]', '', '',
    'def test_colisao_de_intencao_e_conflito():',
    '    cx = Caixa(); cx.entregar("k1", "i1", "e")', '    try:', '        cx.entregar("k1", "i2", "x")', '    except ConflictError:', '        assert cx.efeitos == ["e"]; return',
    '    raise AssertionError("conflito esperado")', '', '',
    'def test_compensacao_em_ordem_inversa():',
    '    assert compensar(["a", "b", "c"]) == ["desfaz:c", "desfaz:b", "desfaz:a"]', '    assert compensar([]) == []', ''].join('\n');
  var solucao = [
    'class ConflictError(Exception):', '    pass', '', '',
    'def on_send(state):', '    state["clock"] += 1', '    return {"clock": state["clock"], "payload": "..."}', '', '',
    'def on_receive(state, msg):', '    state["clock"] = max(state["clock"], msg["clock"]) + 1', '', '',
    'class Caixa:', '    def __init__(self):', '        self.intencoes = {}', '        self.efeitos = []', '',
    '    def entregar(self, chave, intencao, evento):', '        if chave in self.intencoes:',
    '            if self.intencoes[chave] != intencao:', '                raise ConflictError(chave)', '            return False',
    '        self.intencoes[chave] = intencao', '        self.efeitos.append(evento)', '        return True', '', '',
    'def compensar(log):', '    return ["desfaz:" + p for p in reversed(log)]', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b7',
    titulo: 'Falha parcial, entrega e consistência',
    minutos: 40,
    resumo: 'Sem observador comum, relógio não ordena, timeout é palpite e retry só é seguro com chave mais intenção.',
    objetivo: 'Ordenar por causa, ler um timeout como incerteza, declarar o trade-off de consistência e entregar com efeito único observável.',
    revisao: [
      { id: 'm02ab7-relogio', pergunta: 'Ordenar eventos de dois nós pelo timestamp de parede responde "o que veio antes"?',
        opcoes: [
          opc('a', 'Não: relógios derivam e andam para trás; a ordem que importa é causal (happens-before) e o "último timestamp vence" descarta conflito concorrente em silêncio.', true, 'a → b no mesmo processo, ou envio e recepção da mesma mensagem, fechando por transitividade; sem caminho causal são concorrentes.'),
          opc('b', 'Sim, com NTP é exato.', false, 'sincronização corrige para trás e não dá ordem causal.'),
          opc('c', 'Sim, com milissegundos.', false, 'resolução não cria causalidade.')] },
      { id: 'm02ab7-timeout', pergunta: 'O que um timeout permite afirmar?',
        opcoes: [
          opc('a', 'Quase nada: pode não ter chegado, ter chegado e falhado, ou ter sido aplicado com a resposta perdida; é um palpite com prazo.', true, 'a decisão pós-timeout precisa tolerar a resposta tardia; registre o palpite no log.'),
          opc('b', 'Que o nó morreu.', false, 'nó lento não é nó morto.'),
          opc('c', 'Que o retry é seguro.', false, 'só com idempotência.')] },
      { id: 'm02ab7-cap', pergunta: 'Como tratar consistência, disponibilidade e durabilidade?',
        opcoes: [
          opc('a', 'Como trade-offs declarados em perguntas operacionais, não selos; sob partição, consistência forte e disponibilidade total da mesma escrita puxam para lados opostos (CAP).', true, 'o commit SQLite prova durabilidade local, não replicação.'),
          opc('b', 'Como selos que o sistema tem.', false, 'prometer "sempre disponível e consistente sob partição" é vender selo.'),
          opc('c', 'Como detalhes do banco.', false, 'são decisões de produto e operação.')] },
      { id: 'm02ab7-retry', pergunta: 'O que torna o retry seguro?',
        opcoes: [
          opc('a', 'At-least-once mais deduplicação por chave e intenção: efeito único observável; mesma chave com intenção diferente vira conflito. Backoff reduz pressão, não corrige semântica.', true, 'retry sem chave duplica decisão e evento.'),
          opc('b', 'Backoff com jitter.', false, 'não corrige a semântica.'),
          opc('c', 'Timeout curto.', false, 'só transforma lentidão em erro mais rápido.')] },
      { id: 'm02ab7-saga', pergunta: 'O que a saga garante e o que a simulação com seed não prova?',
        opcoes: [
          opc('a', 'Saga: compensações em ordem inversa, eventualidade gerenciada sem atomicidade global; a simulação prova lógica de entrega e compensação, não rede, partição, quorum ou durabilidade reais (M03, LT01, LT02, M12).', true, 'efeitos intermediários foram visíveis; o log de compensação permite auditar.'),
          opc('b', 'Saga garante atomicidade global.', false, 'não garante nem isolamento entre passos.'),
          opc('c', 'A simulação prova consenso.', false, 'sem processos separados não há claim de consenso.')] }
    ],
    abas: [
      { rotulo: 'Tempo e falha', blocos: [
        { tipo: 'texto', html:
          '<p>Do B06 para cá, o problema muda: antes o batch local tinha um dono, uma fila e um relógio. Agora há mais de um participante e <strong>nenhum observador comum</strong>; cada nó vê só a sua fatia. "Retry com backoff resolve falha parcial" e "timeout curto detecta nó morto" são metade de uma decisão: retry sem idempotência duplica efeito, e timeout curto sem política só transforma lentidão em erro mais rápido. O bloco troca cada frase por mecanismo testável: chave mais intenção, caixa de saída, compensação ordenada e simulação com seed.</p>' +
          '<h3>Tempo físico x ordem causal</h3>' +
          '<p>Relógios físicos derivam, são corrigidos para trás por sincronização e têm granularidade distinta: dois timestamps próximos em nós diferentes não dizem quem causou o quê. A ordem que importa é a <strong>causal (happens-before)</strong>: a → b quando ocorrem no mesmo processo nessa ordem, ou quando a é o envio e b a recepção da mesma mensagem, fechando por transitividade. Eventos sem caminho causal são <em>concorrentes</em>.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Pergunta</th><th>Relógio físico</th><th>Ordem causal</th></tr></thead><tbody>' +
          '<tr><td>qual evento veio antes?</td><td>só dentro do mesmo nó, com margem de erro</td><td>"antes" só quando há caminho de causa</td></tr>' +
          '<tr><td>qual escrita vence?</td><td>"último timestamp vence" descarta conflito concorrente em silêncio</td><td>conflito concorrente exige reconciliação explícita</td></tr>' +
          '<tr><td>quanto tempo passou?</td><td>duração local no mesmo relógio</td><td>relógio virtual da simulação: contador que anda por evento</td></tr>' +
          '</tbody></table>' },
        { tipo: 'codigo', linguagem: 'python', texto: '# Carimbo causal mínimo (conceitual; a reconciliação real fica no laboratório B07)\ndef on_send(state):\n    state["clock"] += 1\n    return {"clock": state["clock"], "payload": "..."}\ndef on_receive(state, msg):\n    state["clock"] = max(state["clock"], msg["clock"]) + 1' },
        { tipo: 'texto', html:
          '<p>Falha típica: comparar timestamps de máquinas distintas para decidir quem escreveu por último, sem regra de reconciliação. Na simulação do B07-L o tempo é um contador determinístico com seed: serve para reproduzir a ordem de entrega, não para medir latência real.</p>' +
          '<h3>Falha parcial: nó lento não é nó morto</h3>' +
          '<p>Uma parte funciona enquanto outra não. O observador local não distingue "caiu" de "está lento" nem de "a resposta se perdeu na volta". Timeout é um <strong>palpite com prazo</strong>, não diagnóstico de morte, e toda decisão tomada depois dele precisa continuar correta se a resposta chegar tarde.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sinal</th><th>Leitura apressada</th><th>Leitura exigida</th></tr></thead><tbody>' +
          '<tr><td>resposta não chegou no prazo</td><td>nó morto; refazer</td><td>desconhecido; refazer só se a repetição for segura</td></tr>' +
          '<tr><td>resposta duplicada</td><td>erro raro; ignorar</td><td>comportamento normal de retry; receptor deduplica</td></tr>' +
          '<tr><td>um consumidor lento</td><td>aumentar o timeout</td><td>pressão: limitar admissão (B06) e decidir o que degradar</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p>Defina o timeout pelo custo de esperar errado nos dois sentidos: esperar demais segura capacidade; desistir cedo gera trabalho duplicado. Registre o palpite ("desisti aos X ticks virtuais, resposta tardia será deduplicada") em vez de afirmar que o par caiu. A rede simulada (perda, duplicação e atraso por seed, relógio virtual que anda por evento) é implementada em <code>domain/simulacao.py</code>, sem rede real.</p>' },
        { tipo: 'takeaway', html: 'Relógio físico mede <mark>duração local</mark>; causa se prova por <mark>happens-before</mark>; timeout é <mark>palpite</mark>.' }
      ] },

      { rotulo: 'Trade-offs e entrega', blocos: [
        { tipo: 'texto', html:
          '<h3>Consistência, disponibilidade e durabilidade são trade-offs</h3>' +
          '<p>Não são selos que o sistema "tem": respondem a perguntas operacionais (quais leituras refletem quais escritas e quando; o que continua atendendo quando uma parte falha; o que sobrevive a uma queda após confirmação). Sob partição, consistência forte e disponibilidade total da mesma escrita puxam para lados opostos; o teorema CAP formaliza esse conflito para o recorte de rede com partição.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Escolha no work-intake</th><th>Ganha</th><th>Paga</th></tr></thead><tbody>' +
          '<tr><td>decisão só existe após commit local</td><td>durabilidade local: queda não inventa nem apaga decisão confirmada</td><td>publicação espera o commit; latência por escrita</td></tr>' +
          '<tr><td>evento publicado após commit, com reentrega</td><td>consumidor lento não bloqueia a decisão</td><td>duplicata e atraso; consumidor deduplica</td></tr>' +
          '<tr><td>leitura de réplica sem quorum</td><td>disponibilidade de leitura sob lentidão</td><td>leitura pode estar desatualizada; declare a janela</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Limite', html: '<p>O work-intake é um monólito modular local: o commit em SQLite prova durabilidade local, não replicação. Prometer "sistema sempre disponível e consistente sob partição" para este recorte é vender selo, não mecanismo. A partição real pertence a LT02 e M12; aqui ela é simulada com seed.</p>' },
        { tipo: 'texto', html:
          '<h3>Retry exige idempotência</h3>' +
          '<p>Quem envia sem confirmação não sabe se a mensagem se perdeu, atrasou ou foi aplicada e a resposta é que se perdeu. A saída: repetir até confirmar (<strong>at-least-once</strong>) e fazer o receptor transformar repetição em efeito único por deduplicação com chave de idempotência mais intenção (regra do B05). Mesma chave e mesma intenção reutiliza a decisão; mesma chave com intenção diferente é conflito.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def entregar(caixa, *, chave, intencao, evento):\n    if (chave, intencao) in caixa.entregues:\n        return caixa.entregues[(chave, intencao)]  # repetição: reutiliza\n    if chave in caixa.chaves and caixa.chaves[chave] != intencao:\n        raise ConflictError(chave)  # colisão: intenção divergiu\n    caixa.persistir(chave, intencao, evento)  # mesmo commit da decisão\n    return caixa.publicar(chave, intencao)' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Estratégia</th><th>Efeito sob duplicata</th><th>Quando usar</th></tr></thead><tbody>' +
          '<tr><td>retry sem chave</td><td>duplica decisão e evento</td><td>nunca como política de entrega</td></tr>' +
          '<tr><td>at-least-once + dedup por chave e intenção</td><td>efeito único observável; colisão vira conflito</td><td>padrão para publicação pós-commit</td></tr>' +
          '<tr><td>backoff com teto e orçamento de tentativas</td><td>reduz pressão, não corrige semântica</td><td>complemento, nunca substituto da chave</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p>No laboratório (sem rede nem contêiner), <code>application/entrega.py</code> traz a caixa de saída (chave de idempotência e log de compensação) e <code>domain/simulacao.py</code> a rede determinística. Os trechos acima são conceituais.</p>' },
        { tipo: 'rode', id: 'b7-rode', titulo: 'Retry com e sem idempotência', obrigatorio: false,
          enunciado: '200 pedidos "criar decisão"; a rede pode perder o pedido ou a resposta. Valores ilustrativos (exemplo; o simulador completo está no texto do módulo).',
          prefixo: '$', entrada: 'simulador de retry  # exemplo', unidade: 'ms', terminalTitulo: 'exemplo (saída variável)',
          prever: { pergunta: 'Com retry e sem deduplicação, o que acontece com a resposta perdida?', opcoes: [
            { id: 'a', texto: 'O receptor aplica o efeito de novo: decisão duplicada.', correta: true, porque: 'o cliente não sabe que o efeito foi aplicado.' },
            { id: 'b', texto: 'Nada: o retry é inofensivo.', correta: false, porque: 'sem chave o receptor trata como pedido novo.' }] },
          etapas: [
            { id: 's', nome: 'Retry sem chave', descricao: '', tom: 'dns', ms: 1, linhas: [L('out', 'efeito duplicado (2+): > 0   cliente sem resposta mas efeito aplicado: > 0'), L('hint', 'duplica decisões e eventos')] },
            { id: 'c', nome: 'Retry com chave + intenção', descricao: '', tom: 'response', ms: 1, linhas: [L('out', 'efeito duplicado (2+): 0'), L('hint', 'backoff reduz pressão; quem corrige a semântica é a chave')] }
          ] },
        { tipo: 'texto', html:
          '<h3>Saga, consenso e o que a simulação não prova</h3>' +
          '<p><strong>Saga</strong> executa cada passo como transação local e registra a compensação; se um passo falha, as compensações rodam em ordem inversa. É eventualidade gerenciada, não atomicidade global: efeitos intermediários foram visíveis e o log de compensação permite auditar. <strong>Consenso por quorum</strong> segue a lógica oposta para uma única decisão: ela sobrevive à minoria lenta ou caída, sem prometer progresso sem maioria.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Mecanismo</th><th>Garante</th><th>Não garante neste módulo</th></tr></thead><tbody>' +
          '<tr><td>saga com compensação ordenada</td><td>desfazimento auditável passo a passo</td><td>atomicidade global; isolamento entre passos</td></tr>' +
          '<tr><td>quorum de confirmação</td><td>decisão sobrevive à minoria lenta ou caída</td><td>progresso sem maioria; latência baixa</td></tr>' +
          '<tr><td>simulação local com seed</td><td>fila limitada, overload explícito, cleanup e timeout sem task órfã, de forma reproduzível</td><td>partição real, relógio real, quorum multiprocesso, durabilidade pós-queda, desempenho de rede</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p><strong>Fontes</strong> (verificar antes de citar): Lamport, <em>Time, Clocks, and the Ordering of Events</em> (1978); Gilbert e Lynch, <em>Brewer\'s Conjecture</em> (2002; acesso pode exigir ACM); Ongaro e Ousterhout, Raft; Helland, <em>Life beyond Distributed Transactions</em> (CIDR 2007). São fundamentos, não manuais; sem implementação multiprocesso neste módulo.</p>' },
        { tipo: 'takeaway', html: '<mark>At-least-once</mark> mais <mark>dedup</mark> por chave e intenção dá efeito único observável; <mark>saga</mark> compensa sem atomicidade global.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b7-python', titulo: 'Relógio lógico, caixa de saída e compensação', obrigatorio: false,
          enunciado: 'Implemente o relógio de Lamport (<code>on_send</code>, <code>on_receive</code>), a <code>Caixa.entregar</code> (repetição não duplica; colisão de intenção levanta <code>ConflictError</code>) e <code>compensar</code> (ordem inversa).',
          codigo: codigo, testes: testes,
          dica: 'Lamport: <code>clock = max(local, recebido) + 1</code>. Caixa: consulte <code>self.intencoes[chave]</code> antes de aplicar. Compensar: <code>reversed(log)</code>.',
          solucao: solucao, callout: 'Ordem causal, efeito único e compensação ordenada verificados.' },
        { tipo: 'cenario', id: 'b7-cenario', titulo: 'O timeout depois de chamar o outro serviço', obrigatorio: false,
          enunciado: 'A chamada deu timeout. Decida o que fazer.',
          inicio: 'i',
          nos: { i: { texto: 'O chamador não recebeu resposta. O que faz?', opcoes: [
            { texto: 'Concluir que o serviço está morto e refazer o trabalho sem chave.', vai: 'f-dup', tom: 'ruim', consequencia: 'a resposta tardia aplicou o efeito duas vezes.' },
            { texto: 'Tratar como desconhecido e repetir com chave mais intenção, registrando o palpite.', vai: 'n2', tom: 'ok', consequencia: 'a repetição vira efeito único.' }] },
            n2: { texto: 'A resposta tardia chega. E agora?', opcoes: [
              { texto: 'O receptor deduplica e a resposta é absorvida.', vai: 'f-bom', tom: 'ok', consequencia: 'decisão correta mesmo com resposta tardia.' },
              { texto: 'Aplicar de novo para garantir.', vai: 'f-dup', tom: 'ruim', consequencia: 'duplicou a decisão.' }] } },
          finais: { 'f-bom': { bom: true, texto: 'Efeito único observável, com o palpite registrado em log.' }, 'f-dup': { bom: false, texto: 'Duas decisões para a mesma chave no diário de entregas.' } },
          callout: 'Você tratou o timeout como palpite.' },
        { tipo: 'escolha', id: 'b7-esc1', titulo: 'Confira: simulação verde', pergunta: 'A simulação com seed passa e a produção continua duvidosa. Por quê?',
          opcoes: [
            { id: 'a', texto: 'Seed e relógio virtual foram confundidos com rede real; partição, quorum e disco sob queda não foram exercitados. Declare os limites.', correta: true, porque: 'partição real pertence a LT02 e M12.' },
            { id: 'b', texto: 'A seed estava errada.', correta: false, porque: 'a lógica de entrega no recorte está correta; o problema é a generalização.' }] },
        { tipo: 'escolha', id: 'b7-esc2', titulo: 'Confira: compensação', pergunta: 'A compensação rodou fora de ordem e sem rastro. Qual a correção?',
          opcoes: [
            { id: 'a', texto: 'Log sequenciado e compensação em ordem inversa, auditável passo a passo.', correta: true, porque: 'saga sem log não permite auditar o desfazimento.' },
            { id: 'b', texto: 'Compensar em paralelo para ser mais rápido.', correta: false, porque: 'quebra a ordem inversa.' }] },
        { tipo: 'takeaway', html: 'Simulação com seed prova a <mark>lógica de entrega</mark> no recorte local, não <mark>rede, partição ou consenso</mark> reais.' }
      ] }
    ]
  });
})();
