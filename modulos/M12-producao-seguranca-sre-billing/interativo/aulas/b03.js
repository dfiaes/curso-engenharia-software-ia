/* M12 · Bloco 3: Identidade, autorização, policy-as-code e aprovação humana. Fonte: M12.html#b3. O ApprovalStore do exercício é um modelo fake em memória; as saídas do quebre vêm de execução real dele. Prazos e quantidades são exemplo variável. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var PEDIDO = 'consume(req-1, ana, t1, refund, ';

  var PY_INI = [
    'import hashlib',
    'import json',
    'from datetime import datetime, timedelta',
    '',
    '',
    'class AuthorizationDenied(Exception):',
    '    def __init__(self, codigo):',
    '        super().__init__(codigo)',
    '        self.codigo = codigo',
    '',
    '',
    'def intent_hash(tenant_id, tool, args):',
    '    """Digest estavel de tenant, tool e argumentos canonicalizados."""',
    '    # TODO: json com chaves ordenadas e sha256',
    '    return ""',
    '',
    '',
    'class ApprovalStore:',
    '    def __init__(self):',
    '        self._itens = {}',
    '',
    '    def issue(self, ator, tenant_id, request_id, tool, args, agora, ttl):',
    '        h = intent_hash(tenant_id, tool, args)',
    '        self._itens[request_id] = {"ator": ator, "tenant": tenant_id, "hash": h,',
    '                                   "expira": agora + ttl, "usada": None}',
    '        return request_id',
    '',
    '    def consume(self, approval_id, ator, tenant_id, tool, args, agora):',
    '        """Nega com APPROVAL_NOT_FOUND, APPROVAL_ALREADY_USED, APPROVAL_EXPIRED',
    '        ou APPROVAL_BINDING_MISMATCH. No sucesso, marca o uso e devolve o evento."""',
    '        a = self._itens.get(approval_id)',
    '        # TODO: confira existencia, uso, prazo e vinculo, nessa ordem',
    '        return {"rule_id": "APPROVAL_EXACT_INTENT", "correlation_id": approval_id}'
  ].join('\n') + '\n';
  var PY_TEST = [
    'T0 = datetime(2026, 1, 1, 12, 0, 0)',
    'ARGS = {"order_id": 9, "valor": 50}',
    '',
    '',
    'def novo():',
    '    s = ApprovalStore()',
    '    s.issue("ana", "t1", "req-1", "refund", ARGS, T0, timedelta(minutes=5))',
    '    return s',
    '',
    '',
    'def cod(s, ator="ana", tenant="t1", args=ARGS, agora=T0 + timedelta(minutes=1), aid="req-1"):',
    '    try:',
    '        s.consume(aid, ator, tenant, "refund", args, agora)',
    '    except AuthorizationDenied as e:',
    '        return e.codigo',
    '    return "OK"',
    '',
    '',
    'def test_intencao_exata_executa_uma_vez():',
    '    s = novo()',
    '    ev = s.consume("req-1", "ana", "t1", "refund", dict(ARGS), T0 + timedelta(minutes=1))',
    '    assert ev["rule_id"] == "APPROVAL_EXACT_INTENT" and ev["correlation_id"] == "req-1"',
    '',
    '',
    'def test_ordem_das_chaves_nao_importa():',
    '    assert cod(novo(), args={"valor": 50, "order_id": 9}) == "OK"',
    '',
    '',
    'def test_replay():',
    '    s = novo()',
    '    assert cod(s) == "OK"',
    '    assert cod(s) == "APPROVAL_ALREADY_USED"',
    '',
    '',
    'def test_argumento_adulterado():',
    '    assert cod(novo(), args={"order_id": 9, "valor": 5000}) == "APPROVAL_BINDING_MISMATCH"',
    '',
    '',
    'def test_expirada_no_instante_do_prazo():',
    '    assert cod(novo(), agora=T0 + timedelta(minutes=5)) == "APPROVAL_EXPIRED"',
    '',
    '',
    'def test_ator_ou_tenant_trocado():',
    '    assert cod(novo(), ator="bruno") == "APPROVAL_BINDING_MISMATCH"',
    '    assert cod(novo(), tenant="t2") == "APPROVAL_BINDING_MISMATCH"',
    '',
    '',
    'def test_inexistente():',
    '    assert cod(novo(), aid="req-x") == "APPROVAL_NOT_FOUND"',
    '',
    '',
    'def test_adulterar_nao_queima_a_aprovacao():',
    '    s = novo()',
    '    assert cod(s, args={"order_id": 9, "valor": 5000}) == "APPROVAL_BINDING_MISMATCH"',
    '    assert cod(s) == "OK"'
  ].join('\n') + '\n';
  var PY_SOL = [
    'import hashlib',
    'import json',
    'from datetime import datetime, timedelta',
    '',
    '',
    'class AuthorizationDenied(Exception):',
    '    def __init__(self, codigo):',
    '        super().__init__(codigo)',
    '        self.codigo = codigo',
    '',
    '',
    'def intent_hash(tenant_id, tool, args):',
    '    bruto = json.dumps({"tenant": tenant_id, "tool": tool, "args": args},',
    '                       sort_keys=True, separators=(",", ":"))',
    '    return hashlib.sha256(bruto.encode()).hexdigest()',
    '',
    '',
    'class ApprovalStore:',
    '    def __init__(self):',
    '        self._itens = {}',
    '',
    '    def issue(self, ator, tenant_id, request_id, tool, args, agora, ttl):',
    '        h = intent_hash(tenant_id, tool, args)',
    '        self._itens[request_id] = {"ator": ator, "tenant": tenant_id, "hash": h,',
    '                                   "expira": agora + ttl, "usada": None}',
    '        return request_id',
    '',
    '    def consume(self, approval_id, ator, tenant_id, tool, args, agora):',
    '        a = self._itens.get(approval_id)',
    '        if a is None:',
    '            raise AuthorizationDenied("APPROVAL_NOT_FOUND")',
    '        if a["usada"] is not None:',
    '            raise AuthorizationDenied("APPROVAL_ALREADY_USED")',
    '        if agora >= a["expira"]:',
    '            raise AuthorizationDenied("APPROVAL_EXPIRED")',
    '        if (a["ator"] != ator or a["tenant"] != tenant_id',
    '                or a["hash"] != intent_hash(tenant_id, tool, args)):',
    '            raise AuthorizationDenied("APPROVAL_BINDING_MISMATCH")',
    '        a["usada"] = agora',
    '        return {"rule_id": "APPROVAL_EXACT_INTENT", "correlation_id": approval_id}'
  ].join('\n') + '\n';

  var etapasAprov = function () {
    return [
      { id: 'emitir', nome: 'Emitir aprovação', descricao: 'ana aprova o digest do pedido', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'issue(ana, t1, req-1, refund, {order_id: 9, valor: 50}, 12:00, ttl=5min)'),
        L('info', 'intent_hash = sha256(tenant, tool, argumentos canonicalizados)'),
        L('hint', 'a aprovação nasce vinculada: ator, tenant, digest, prazo, uso único')] },
      { id: 'consumo', nome: 'Consumir no executor', descricao: 'o executor recalcula e compara cada campo', tom: 'request', ms: 2, linhas: [
        L('cmd', PEDIDO + '{order_id: 9, valor: 50}, 12:01)'),
        L('in', 'ok rule_id=APPROVAL_EXACT_INTENT correlation_id=req-1'),
        L('hint', 'uso marcado: used_at = 12:01')] },
      { id: 'efeito', nome: 'Efeito e auditoria', descricao: 'executa uma vez', tom: 'response', ms: 1, linhas: [
        L('out', 'refund(order_id=9, valor=50) executado uma vez'),
        L('hint', 'o evento de auditoria compartilha o correlation_id do request')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm12-b3',
    titulo: 'Identidade, autorização, policy-as-code e aprovação humana',
    minutos: 45,
    resumo: 'Cinco decisões que costumam colapsar numa só: quem se apresenta, o que pode, o que o contrato habilita, quanto consome e qual efeito exato uma pessoa confirmou. Aprovação como vínculo, não como booleano.',
    objetivo: 'Separar autenticação, autorização, entitlement, quota e aprovação; escrever uma decisão de política explicável por rule_id e uma aprovação amarrada a ação, argumentos, tenant, ator, digest, prazo e uso único.',
    revisao: [
      { id: 'm12b3-cinco', pergunta: 'Que pergunta cada decisão responde?',
        opcoes: [
          opc('a', 'Autenticação: quem se apresenta; autorização: pode executar esta ação neste recurso; entitlement: o contrato habilita; quota: quanto consome numa janela; aprovação: uma pessoa confirmou este efeito exato', true, 'colapsar as cinco numa checagem produz falhas características: conferir a identidade e executar qualquer argumento, ou aprovar um valor e executar outro.'),
          opc('b', 'As cinco são sinônimos de login', false, 'cada uma é verificada em separado.'),
          opc('c', 'Entitlement é o que está dentro do token', false, 'entitlement é a habilitação por contrato ou plano; o token autentica.')] },
      { id: 'm12b3-vinculo', pergunta: 'O que uma aprovação vinculada registra e como o consumo a confere?',
        opcoes: [
          opc('a', 'Ator, tenant, request_id, digest da intenção (tenant, tool e argumentos canonicalizados), expiração e uso único; o consumo compara cada campo com o pedido real e marca o uso de forma atômica', true, 'qualquer divergência (argumento adulterado, ator trocado, prazo vencido, segunda tentativa) nega antes do efeito.'),
          opc('b', 'Um booleano "aprovado" na sessão', false, 'sem vínculo, qualquer replay ou adulteração herda a aprovação.'),
          opc('c', 'O texto que o modelo escreveu descrevendo a ação', false, 'quem aprova precisa ver o efeito e o contexto reais, nunca uma descrição produzida pelo mesmo modelo que pediu a ação.')] },
      { id: 'm12b3-codigos', pergunta: 'A mesma aprovação é consumida duas vezes. Qual código nega a segunda?',
        opcoes: [
          opc('a', 'APPROVAL_ALREADY_USED', true, 'o consumo marca <code>used_at</code> de forma atômica; a repetição nega.'),
          opc('b', 'APPROVAL_BINDING_MISMATCH', false, 'esse é para argumento, ator ou tenant diferentes do aprovado.'),
          opc('c', 'APPROVAL_EXPIRED', false, 'esse é para consumo no instante da expiração ou depois.')] },
      { id: 'm12b3-modelos', pergunta: 'Qual modelo de controle de acesso decide por atributos de ator, recurso, ambiente e ação, e qual é o seu limite?',
        opcoes: [
          opc('a', 'ABAC; a regra sem identificador e sem auditoria vira caixa-preta', true, 'por isso a decisão cita <code>rule_id</code> (<code>AUTH_TENANT_MATCH</code>, <code>AUTH_TOOL_SCOPE</code>, <code>AUTH_ALLOW_SCOPED</code>).'),
          opc('b', 'RBAC; explode em combinações quando o contexto varia por pedido', false, 'RBAC decide por função estável, não por atributos do pedido.'),
          opc('c', 'ReBAC; só funciona sem grafo', false, 'ReBAC expressa relações entre entidades, e o grafo sem revisão acumula autoridade fantasma.')] },
      { id: 'm12b3-ordem', pergunta: 'Qual invariante da ordem de enforcement não varia entre sistemas?',
        opcoes: [
          opc('a', 'Nenhum efeito ocorre antes dos controles que o autorizam', true, 'a ordem exata varia: autenticar, resolver tenant, validar schema, classificar risco, entitlement e autorização, quota e orçamento, consumir aprovação, intento idempotente, adapter, auditar.'),
          opc('b', 'A aprovação sempre vem antes da autenticação', false, 'sem identidade não há quem aprovar.'),
          opc('c', 'A auditoria acontece antes de qualquer decisão', false, 'a auditoria registra o resultado da decisão.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Um agente propõe reembolsar o pedido 9 em 50. Uma pessoa aprova. Quando o executor roda, o valor é 5000. Se a aprovação era um "sim" solto, ela cobre os dois pedidos. Este bloco separa cinco decisões que costumam colapsar numa só e constrói a aprovação que sobrevive a replay e adulteração.</p>' +
          '<p>Pré-requisitos: autoridade de sessão e schemas fechados do Bloco 2. A aprovação vinculada construída aqui será exigida pelo isolamento multi-tenant do Bloco 4 e pela idempotência do Bloco 5. A saída observável é uma decisão de política explicável por identificador de regra e uma aprovação amarrada a ação, argumentos, tenant, ator, digest, prazo e uso único. As falhas de referência: reaproveitar uma aprovação, adulterar argumentos depois da aprovação, usar aprovação expirada e trocar identidade ou tenant entre a aprovação e a execução. Cada negação gera um evento de auditoria sem conteúdo sensível.</p>' },
        { tipo: 'abas', rotulo: 'As cinco perguntas', itens: [
          { rotulo: 'Autenticação', blocos: [{ tipo: 'texto', html: '<p><strong>Quem se apresenta?</strong> No servidor de recursos, um token só autentica depois de validar algoritmo permitido, assinatura, emissor, audiência, expiração e escopos.</p>' }] },
          { rotulo: 'Autorização', blocos: [{ tipo: 'texto', html: '<p><strong>Esta identidade pode executar esta ação neste recurso?</strong> Decisão determinística, com identificador de regra.</p>' }] },
          { rotulo: 'Entitlement', blocos: [{ tipo: 'texto', html: '<p><strong>O contrato ou plano habilita a capacidade?</strong> Um usuário autorizado num plano sem a capacidade continua sem ela.</p>' }] },
          { rotulo: 'Quota', blocos: [{ tipo: 'texto', html: '<p><strong>Quanto pode consumir numa janela?</strong> Aprofundada nos blocos de custo.</p>' }] },
          { rotulo: 'Aprovação', blocos: [{ tipo: 'texto', html: '<p><strong>Uma pessoa confirmou este efeito exato?</strong> Vínculo, não booleano.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Identidades distintas em cada elo</h3>' +
          '<p>Usuário humano, sessão, agente e workload de execução são identidades diferentes, com tempos de vida diferentes. O agente nunca herda silenciosamente toda a permissão do usuário: a delegação é explícita, curta e limitada ao necessário, porque cada privilégio copiado amplia o raio do dano quando uma tool é mal usada. Credenciais curtas e escopos estreitos (um escopo por tool) mantêm o dano contido quando um elo vaza. Prazos e quantidades citados neste bloco são exemplo variável, nunca medição.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Conceito: uma aprovação é um vínculo, não um booleano', html:
          '<p>O mecanismo: registrar ator, tenant, identificador do pedido, <strong>digest</strong> da intenção (tenant, tool e argumentos canonicalizados), expiração e uso único; no consumo, comparar cada campo com o pedido real e marcar o uso de forma atômica. Qualquer divergência nega antes de qualquer efeito. Quem aprova precisa ver o efeito e o contexto reais, nunca uma descrição produzida apenas pelo mesmo modelo que pediu a ação.</p>' },
        { tipo: 'takeaway', html: 'Cinco perguntas, cinco verificações: <mark>quem</mark>, <mark>pode</mark>, <mark>habilita</mark>, <mark>quanto</mark>, <mark>este efeito exato</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Policy-as-code pura antes do engine, enforcement na fronteira</h3>' +
          '<p>Política é código determinístico e auditável, avaliado antes do efeito; o motor externo, quando existir, fica restrito ao papel de adapter. Antes de integrar qualquer engine, a política pura torna invariantes e casos de negação visíveis em teste. Sistemas reais combinam modelos; a escolha depende da estabilidade das funções, da granularidade dos recursos e do custo de auditar cada decisão.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Pergunta</th><th>Modelo</th><th>Quando ajuda</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>funções estáveis bastam?</td><td>RBAC</td><td>poucos papéis, recursos homogêneos</td><td>explode em combinações quando o contexto varia por pedido</td></tr>' +
          '<tr><td>o contexto do pedido importa?</td><td>ABAC</td><td>tenant, risco, janela e atributos decidem junto</td><td>regra sem identificador e sem auditoria vira caixa-preta</td></tr>' +
          '<tr><td>há relações entre entidades?</td><td>ReBAC</td><td>dono, membro, delegação encadeada</td><td>grafo sem revisão periódica acumula autoridade fantasma</td></tr>' +
          '<tr><td>a autoridade precisa viajar?</td><td>capabilities</td><td>delegação estreita e revogável</td><td>credencial portadora vazada carrega a autoridade junto</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O <strong>ponto de decisão</strong> responde de forma determinística com identificador de regra; o <strong>ponto de enforcement</strong> valida na fronteira da tool e nunca deixa o efeito ocorrer antes dos controles necessários. Ordem de enforcement: autenticar, resolver tenant, validar schema, classificar risco, avaliar entitlement e autorização, verificar quota e orçamento, consumir aprovação quando exigida, registrar intento idempotente, executar o adapter e auditar o resultado. A ordem exata pode variar entre sistemas; a invariante não: nenhum efeito ocorre antes dos controles que o autorizam.</p>' +
          '<h3>Exemplo trabalhado: da proposta de pagamento ao efeito único auditado</h3>' +
          '<p>A política local confere identidade, tenant e escopo, autoriza e marca a ação como efeito crítico que exige aprovação. A aprovação é emitida vinculada ao digest exato do pedido; no consumo, cada campo é comparado e o uso é marcado uma única vez. Nomes reais do laboratório (exemplo ilustrativo, valores variáveis):</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'decision = LocalPolicy().decide(principal, request, ActionRisk.CRITICAL_EFFECT)\n# autoriza com approval_required verdadeiro; regra AUTH_ALLOW_SCOPED\nstore = ApprovalStore()\napproval = store.issue(principal, request, timedelta(minutes=5))\nevent = store.consume(approval.approval_id, principal, request)\n# correlation_id igual ao request_id; regra APPROVAL_EXACT_INTENT' },
        { tipo: 'texto', html: '<p>As negações de referência, cada uma com código estável: segundo consumo do mesmo identificador, <code>APPROVAL_ALREADY_USED</code>; argumento adulterado após a emissão, <code>APPROVAL_BINDING_MISMATCH</code>; consumo no instante da expiração ou depois, <code>APPROVAL_EXPIRED</code>; tenant ou escopo divergente na decisão, <code>AUTH_TENANT_MATCH</code> e <code>AUTH_TOOL_SCOPE</code>. Escolha uma falha e rode.</p>' },
        { tipo: 'quebre', id: 'm12b3-quebre', titulo: 'Reembolso aprovado: tente burlar o vínculo', terminalTitulo: 'aprovação req-1',
          enunciado: 'Escolha uma falha, rode, e depois rode "Sem falha" para fechar o exercício. Saídas de execução real do modelo fake do exercício da aba seguinte.',
          prefixo: '$', entrada: 'python reembolso.py', unidade: 's', etapas: etapasAprov(),
          prever: { pergunta: 'A pessoa aprovou refund(pedido 9, valor 50). O agente tenta executar com valor 5000 usando a mesma aprovação. O que acontece?', opcoes: [
            { id: 'a', texto: 'Executa: o pedido tem a aprovação, e o valor é detalhe.', correta: false, porque: 'sem vínculo ao digest dos argumentos, é a falha característica de aprovar um valor e executar outro.' },
            { id: 'b', texto: 'Nega com APPROVAL_BINDING_MISMATCH: o executor recalcula o digest e ele não casa.', correta: true, porque: 'o intent_hash cobre tenant, tool e argumentos canonicalizados; qualquer variação nega antes do efeito.' },
            { id: 'c', texto: 'Nega com APPROVAL_EXPIRED.', correta: false, porque: 'o prazo ainda vale; o que mudou foi o conteúdo.' }
          ] },
          falhas: [
            { id: 'adulterar', rotulo: 'Adulterar o valor (50 para 5000)', efeito: { etapaFalha: 'consumo', linhasErro: [
              L('cmd', PEDIDO + '{order_id: 9, valor: 5000}, 12:01)'),
              L('out', 'Negado: APPROVAL_BINDING_MISMATCH'),
              L('hint', 'nenhum efeito executou; a aprovação segue intacta e utilizável com o pedido exato')
            ], tutor: 'o digest recalculado do pedido real não casa com o digest que a pessoa aprovou. A negação vale antes de qualquer efeito, e a tentativa adulterada não queima a aprovação legítima.' } },
            { id: 'replay', rotulo: 'Reusar a aprovação (replay)', efeito: { etapaFalha: 'efeito', linhasErro: [
              L('info', 'primeiro consumo executado: refund(order_id=9, valor=50)'),
              L('cmd', PEDIDO + '{order_id: 9, valor: 50}, 12:02)'),
              L('out', 'Negado: APPROVAL_ALREADY_USED'),
              L('hint', 'uso único: used_at já estava marcado')
            ], tutor: 'a aprovação vale para um efeito. A marcação do uso precisa ser atômica: sem isso, duas execuções concorrentes passariam pela mesma aprovação.' } },
            { id: 'expirar', rotulo: 'Consumir depois do prazo', efeito: { etapaFalha: 'consumo', linhasErro: [
              L('cmd', PEDIDO + '{order_id: 9, valor: 50}, 12:05)'),
              L('out', 'Negado: APPROVAL_EXPIRED'),
              L('hint', 'o instante da expiração já conta como vencido: agora >= expires_at')
            ], tutor: 'aprovação antiga não pode continuar valendo. A comparação é feita no consumo, não só na emissão.' } }
          ],
          callout: 'Você viu três negações com código estável e a execução única do pedido exato.' },
        { tipo: 'takeaway', html: 'Replay, adulteração e expiração negam por <mark>código estável</mark> e <mark>antes do efeito</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'm12b3-python', titulo: 'Implemente a aprovação vinculada', obrigatorio: false,
          enunciado: 'Implemente <code>intent_hash</code> (sha256 de tenant, tool e argumentos em JSON com chaves ordenadas) e <code>ApprovalStore.consume</code>. A ordem das checagens: inexistente (<code>APPROVAL_NOT_FOUND</code>), já usada (<code>APPROVAL_ALREADY_USED</code>), expirada com <code>agora &gt;= expira</code> (<code>APPROVAL_EXPIRED</code>), e vínculo de ator, tenant e digest (<code>APPROVAL_BINDING_MISMATCH</code>). No sucesso, marque <code>usada</code> e devolva o evento. Uma tentativa negada não consome a aprovação.',
          codigo: PY_INI, testes: PY_TEST,
          dica: 'Digest: <code>json.dumps({"tenant": t, "tool": tool, "args": args}, sort_keys=True, separators=(",", ":"))</code> e <code>hashlib.sha256(...encode()).hexdigest()</code>. No consumo, só escreva <code>a["usada"] = agora</code> depois que todas as checagens passaram.',
          solucao: PY_SOL,
          tutorDepois: 'Chaves ordenadas tornam o digest estável; marcar o uso só no sucesso evita que uma tentativa adulterada queime a aprovação legítima. Num banco real, o consumo é atômico (persistência no Capstone).',
          callout: 'A aprovação agora é um vínculo: ação exata, uma vez, com código estável nas negações.' },
        { tipo: 'cenario', id: 'm12b3-cenario', titulo: 'O token válido de outro tenant', obrigatorio: false,
          enunciado: 'Um token válido do tenant t2 chega à tool de reembolso do tenant t1. Decida o que a política e a auditoria fazem.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O token é autêntico: assinatura, emissor, audiência e expiração conferem. A requisição pede <code>refund</code> no tenant t1, mas o principal pertence a t2. O que decide?', opcoes: [
              { texto: 'Executar: o token é válido, então a identidade está autorizada.', vai: 'f-valido', tom: 'ruim', consequencia: 'autenticação não é autorização: o token provou quem é, não o que pode neste tenant.' },
              { texto: 'A política compara tenants e escopo da tool; nega com <code>AUTH_TENANT_MATCH</code>.', vai: 'audit', tom: 'ok', consequencia: 'a decisão é determinística e cita a regra que negou.' }
            ] },
            audit: { texto: 'A negação precisa ser auditada. O que entra no evento?', opcoes: [
              { texto: 'Tool, regra (<code>AUTH_TENANT_MATCH</code>), correlação, resultado <code>denied</code>; nunca o token nem os argumentos.', vai: 'efeito', tom: 'ok', consequencia: 'investigável sem expor segredo.' },
              { texto: 'O token e os argumentos completos, para reproduzir o problema.', vai: 'f-vaza', tom: 'ruim', consequencia: 'o audit store virou um cofre de credenciais e dados sensíveis.' }
            ] },
            efeito: { texto: 'O pedido era de efeito crítico no tenant correto, com a pessoa certa. Quando a aprovação entra?', opcoes: [
              { texto: 'Em <code>CRITICAL_EFFECT</code>: a decisão devolve <code>approval_required</code> e o consumo vinculado vem antes do efeito. Leitura e escrita reversível autorizadas seguem só a decisão.', vai: 'f-bom', tom: 'ok', consequencia: 'a pessoa aprova onde o dano é irreversível, sem transformar tudo em fila de aprovações.' },
              { texto: 'Toda chamada exige aprovação humana.', vai: 'f-tudo', tom: 'ruim', consequencia: 'a fila vira carimbo automático: a pessoa deixa de ler o que aprova.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Tenant divergente negado e auditado com regra; efeito crítico só com aprovação vinculada; o resto flui pela política.' },
            'f-valido': { bom: false, texto: 'O agente de t2 executou em t1. A checagem de tenant existia só na emissão, ou em lugar nenhum.' },
            'f-vaza': { bom: false, texto: 'O token de t2 agora está legível por quem consulta a auditoria.' },
            'f-tudo': { bom: false, texto: 'A aprovação perdeu valor: virou clique reflexo, e o efeito crítico foi aprovado sem leitura.' }
          },
          callout: 'Você negou por tenant com rule_id, auditou sem conteúdo e reservou a aprovação para o efeito crítico.' },
        { tipo: 'takeaway', html: 'A <mark>decisão</mark> cita a <mark>regra</mark>; a <mark>auditoria</mark> guarda <mark>metadados</mark>, nunca o token.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>O que prova que o vínculo segurou</h3>' +
          '<p>O oráculo nunca é "o aprovador entendeu a intenção"; é "somente o pedido exato aprovado executou uma vez, e qualquer variação negou com auditoria". M12-AT-005 fecha quando replay, adulteração e expiração negam nas três variantes. M12-AT-006 fecha quando identidade ou tenant divergente nega e gera decisão com identificador de regra, sem copiar token ou argumento sensível para o evento.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sintoma</th><th>Hipótese</th><th>Evidência</th><th>Correção</th></tr></thead><tbody>' +
          '<tr><td>mesma aprovação executa duas vezes</td><td>uso marcado fora da transação ou nunca marcado</td><td>segundo consumo permitido</td><td>consumo atômico com <code>APPROVAL_ALREADY_USED</code> na repetição</td></tr>' +
          '<tr><td>valor maior executa com aprovação do valor menor</td><td>vínculo só no identificador, sem digest dos argumentos</td><td>digest divergente aceito</td><td>comparar <code>intent_hash</code> e negar com <code>APPROVAL_BINDING_MISMATCH</code></td></tr>' +
          '<tr><td>aprovação antiga continua valendo</td><td>expiração não comparada no consumo</td><td>consumo após o prazo permitido</td><td>comparar o instante com <code>expires_at</code> e negar com <code>APPROVAL_EXPIRED</code></td></tr>' +
          '<tr><td>agente de outro tenant executa</td><td>tenant conferido só na emissão</td><td>decisão sem checagem no consumo</td><td>negar com <code>AUTH_TENANT_MATCH</code> e auditar com <code>denied</code></td></tr>' +
          '<tr><td>evento de auditoria expõe argumento sensível</td><td>conteúdo copiado para o evento</td><td>valor literal em metadados</td><td>auditoria sem conteúdo: só tool, regra, correlação e resultado</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Perigo', html:
          '<p>"Humano aprovou" como booleano solto não fecha M12-AT-005: sem vínculo a argumentos, tenant, ator, digest, prazo e uso único, qualquer replay ou adulteração herda a aprovação. Conferir escopo sem conferir tenant não fecha M12-AT-006: a divergência precisa negar e auditar, nunca executar parcial.</p>' },
        { tipo: 'texto', html:
          '<h3>Contraste: aprovação vinculada contra carimbo genérico</h3>' +
          '<p>Uma aprovação fraca registra "autorizado pelo responsável" e confia que o pedido não mudou entre a tela e a execução. Cada campo não vinculado é um ataque: trocar o destinatário, inflar o valor, reusar o carimbo adiante. Uma aprovação vinculada inverte o ônus: o consumo prova, campo a campo, que nada mudou, marca uso único e audita o resultado com o mesmo identificador de correlação do pedido. O contraste aparece também na política: regra opaca que responde "negado" sem dizer por quê, contra decisão determinística que cita <code>AUTH_TENANT_MATCH</code>, <code>AUTH_TOOL_SCOPE</code> ou <code>AUTH_ALLOW_SCOPED</code>.</p>' },
        { tipo: 'escolha', id: 'm12b3-escolha-reembolso', titulo: 'Confira: o reembolso de 5000',
          pergunta: 'Um humano aprovou "reembolsar pedido 9". Depois o agente executa o reembolso com valor 5000. Qual desenho teria impedido?',
          opcoes: [
            opc('a', 'Um booleano "aprovado" no estado da sessão.', false, 'booleano solto cobre qualquer argumento.'),
            opc('b', 'Pedir ao modelo para confirmar.', false, 'o modelo é quem propôs a ação; não é um árbitro externo.'),
            opc('c', 'Aprovação vinculada ao digest dos argumentos, tenant, ator, prazo e uso único, verificada pelo executor.', true, 'aprovação é um vínculo, não um booleano. O executor recalcula o digest; se divergir, nega e audita. Reutilização, expiração e troca de tenant caem na mesma verificação.'),
            opc('d', 'Logs mais detalhados.', false, 'log registra o que aconteceu; não impede.')
          ], tutorDepois: 'O executor recalcula o digest na hora de executar.' },
        { tipo: 'escolha', id: 'm12b3-escolha-entitlement', titulo: 'Confira: autorização e entitlement',
          pergunta: 'Qual é a diferença entre autorização e entitlement?',
          opcoes: [
            opc('a', 'Nenhuma, são sinônimos.', false, 'são decisões diferentes.'),
            opc('b', 'Autorização diz se a identidade pode agir sobre o recurso; entitlement diz se o contrato ou plano habilita a capacidade.', true, 'autenticação (quem), autorização (pode?), entitlement (o plano inclui?), quota (quanto?) e aprovação (esta ação exata?). Colapsar as cinco numa checagem só gera brechas.'),
            opc('c', 'Entitlement é o que o token contém.', false, 'o token autentica e carrega escopos; entitlement vem do contrato.'),
            opc('d', 'Autorização é sobre custo.', false, 'custo é quota e orçamento.')
          ], tutorDepois: 'Cinco decisões, verificadas em separado.' },
        { tipo: 'texto', html:
          '<h3>Contratos congelados para o laboratório (B03-L)</h3>' +
          '<p>Sem rede, com arquivos planos. <code>Principal(actor_id, tenant_id, scopes, workload_id)</code>, com escopos por tool. <code>ToolRequest(tenant_id, tool_name, arguments)</code>, com <code>request_id</code> e <code>intent_hash</code> derivado de tenant, tool e argumentos canonicalizados. <code>ActionRisk</code> com <code>READ</code>, <code>REVERSIBLE_WRITE</code> e <code>CRITICAL_EFFECT</code>. <code>PolicyDecision(allowed, approval_required, rule_id, reason)</code>, devolvida por <code>LocalPolicy().decide(principal, request, risk)</code>: nega com <code>AUTH_TENANT_MATCH</code> quando os tenants divergem, nega com <code>AUTH_TOOL_SCOPE</code> quando falta o escopo da tool e autoriza com <code>AUTH_ALLOW_SCOPED</code>, exigindo aprovação em efeito crítico. <code>Approval(actor_id, tenant_id, request_id, intent_hash, expires_at, used_at)</code>, criada por <code>ApprovalStore().issue(principal, request, ttl)</code> e consumida por <code>consume(approval_id, principal, request, *, now)</code>, que nega via <code>AuthorizationDenied</code> com <code>APPROVAL_NOT_FOUND</code>, <code>APPROVAL_ALREADY_USED</code>, <code>APPROVAL_EXPIRED</code> ou <code>APPROVAL_BINDING_MISMATCH</code> e, no sucesso, devolve auditoria de consumo com <code>correlation_id</code> igual ao <code>request_id</code> e regra <code>APPROVAL_EXACT_INTENT</code>. <code>audit_policy_decision(principal, request, decision)</code> registra permissão e negação com o <code>rule_id</code>, o resultado e só o nome da tool, sem conteúdo.</p>' +
          '<p><strong>Limites declarados:</strong> persistência e consumo atômico no Capstone, identidade e audit store do Capstone, além da suíte em PostgreSQL e do ponta a ponta, pertencem às evidências seguintes. O exercício desta aula usa um modelo em memória com assinatura simplificada, não o contrato acima.</p>' +
          '<p><strong>Resultados esperados:</strong> M12-AT-005 nega replay, argumentos adulterados e aprovação expirada; M12-AT-006 nega identidade ou tenant divergente e gera decisão com rule ID e auditoria sem conteúdo; a ação exata aprovada executa uma vez e o audit event compartilha o correlation ID do request.</p>' +
          '<h3>Fontes do bloco</h3>' +
          '<ul><li>OAuth 2.0 Security Best Current Practice (RFC 9700 / BCP 240): validação de tokens no servidor de recursos e credenciais curtas.</li>' +
          '<li>OpenID Connect Core 1.0, com errata vigente: autenticação federada, emissor, audiência e claims.</li></ul>' },
        { tipo: 'takeaway', html: 'Somente o pedido <mark>exato</mark> aprovado executa, <mark>uma vez</mark>; qualquer variação <mark>nega</mark> com <mark>auditoria</mark>.' }
      ] }
    ]
  });
})();
