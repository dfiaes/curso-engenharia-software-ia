/* M01 · Bloco 3: estado, controle e 12-Factor Agents sob crítica. Fonte: M01.html#b03. Traço do rode: execução real de reduce_state/CheckpointStore do lab. 12-Factor Agents (HumanLayer, 2025) é guia de practitioner, não norma. Fontes verificadas em 14/08/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasWorkflow = function () {
    return [
      { id: 'testes', nome: 'Os três testes', descricao: 'unittest do lab', tom: 'dns', ms: 3, linhas: [
        L('cmd', 'python -m unittest tests.test_workflow -v'),
        L('out', 'test_checkpoint_rejects_unsafe_identifier ... ok'),
        L('out', 'test_iteration_budget_escalates_with_handoff_reason ... ok'),
        L('out', 'test_pause_checkpoint_resume_does_not_repeat_effect ... ok'),
        L('in', 'Ran 3 tests: OK'),
        L('hint', 'abaixo, o traço do que o teste de pause e resume faz com reduce_state (funções do lab, workflow_id "wf-1")')] },
      { id: 'a', nome: 'Instância A', descricao: 'start, e-42, pause', tom: 'tcp', ms: 3, linhas: [
        L('cmd', 'reduce_state(WorkflowState("wf-1"), START)'),
        L('out', 'running  iter=0  effects=[]'),
        L('cmd', 'reduce_state(..., STEP_SUCCEEDED "e-42")'),
        L('out', 'running  iter=1  effects=[\'e-42\']'),
        L('cmd', 'reduce_state(..., PAUSE "aguardando aprovação")'),
        L('out', "paused  iter=1  effects=['e-42']  reason='aguardando aprovação'"),
        L('hint', 'a sessão é descartável, o estado não')] },
      { id: 'ledger', nome: 'Checkpoint', descricao: 'save e load em outra instância', tom: 'tls', ms: 2, linhas: [
        L('cmd', 'store.save(state)   # escrita atômica: arquivo .tmp e replace'),
        L('cmd', 'store.load("wf-1")  # instância B, processo novo'),
        L('out', "paused  iter=1  effects=['e-42']  reason='aguardando aprovação'"),
        L('hint', 'o estado voltou idêntico, sem depender de nenhuma conversa')] },
      { id: 'b', nome: 'Instância B', descricao: 'resume e o mesmo effect_id', tom: 'request', ms: 4, linhas: [
        L('cmd', 'reduce_state(..., RESUME)'),
        L('out', "running  iter=1  effects=['e-42']"),
        L('cmd', 'reduce_state(..., STEP_SUCCEEDED "e-42")   # mesmo effect_id'),
        L('in', "running  iter=1  effects=['e-42']   (nenhum efeito novo)"),
        L('cmd', 'reduce_state(..., STEP_SUCCEEDED "e-43")'),
        L('out', "running  iter=2  effects=['e-42', 'e-43']"),
        L('cmd', 'reduce_state(..., COMPLETE)'),
        L('out', "completed  iter=2  effects=['e-42', 'e-43']"),
        L('hint', 'retomada sem repetir efeito')] },
      { id: 'orcamento', nome: 'Orçamento', descricao: 'Três falhas e o handoff', tom: 'response', ms: 3, linhas: [
        L('cmd', 'WorkflowState("wf-2", max_iterations=3), START, depois 3 x STEP_FAILED "teste falhou"'),
        L('out', "running  iter=1  reason='teste falhou'"),
        L('out', "running  iter=2  reason='teste falhou'"),
        L('in', "escalated  iter=3  reason='teste falhou'"),
        L('hint', 'orçamento esgotado vira ESCALATED com a razão do handoff, não um loop sem fim')] }
    ];
  };

  var codigoReducer = String.raw`from dataclasses import dataclass, replace


@dataclass(frozen=True)
class Estado:
    status: str = "pending"      # pending, running, paused, completed, escalated
    iteracao: int = 0
    limite: int = 5
    efeitos: tuple = ()          # effect_ids já aplicados (o ledger)
    razao: str = ""


def reduzir(estado, tipo, effect_id=None, detalhe=""):
    """(estado, evento) -> novo estado. Função pura: nada de I/O, nada de mutação."""
    if estado.status in ("completed", "escalated"):
        return estado
    if tipo == "start" and estado.status == "pending":
        return replace(estado, status="running")
    if tipo == "pause" and estado.status == "running":
        return replace(estado, status="paused", razao=detalhe)
    if tipo == "resume" and estado.status == "paused":
        return replace(estado, status="running", razao="")
    if tipo == "complete" and estado.status == "running":
        return replace(estado, status="completed")
    if tipo == "step_succeeded" and estado.status == "running":
        # 1. sem effect_id, ou effect_id já no ledger: devolva o estado como está
        # 2. senão, some 1 à iteração e acrescente o effect_id aos efeitos
        # 3. se a iteração alcançou o limite: status "escalated", razao "iteration_budget_exhausted"
        return estado
    if tipo == "step_failed" and estado.status == "running":
        # some 1 à iteração, guarde detalhe em razao; ao alcançar o limite, escale com essa razão
        return estado
    return estado


e = reduzir(Estado(), "start")
e = reduzir(e, "step_succeeded", "e-42")
print(e.iteracao, e.efeitos)
`;
  var testesReducer = String.raw`def rodar(*eventos, limite=5):
    e = Estado(limite=limite)
    for ev in eventos:
        e = reduzir(e, *ev)
    return e


def test_efeito_novo_avanca():
    e = rodar(("start",), ("step_succeeded", "e-42"))
    assert e.iteracao == 1 and e.efeitos == ("e-42",)


def test_mesmo_effect_id_nao_repete_o_efeito_apos_retomada():
    e = rodar(("start",), ("step_succeeded", "e-42"), ("pause", None, "aprovação"),
              ("resume",), ("step_succeeded", "e-42"))
    assert e.iteracao == 1 and e.efeitos == ("e-42",) and e.status == "running"


def test_passo_sem_effect_id_e_ignorado():
    e = rodar(("start",), ("step_succeeded",))
    assert e.iteracao == 0 and e.efeitos == ()


def test_orcamento_esgotado_escala_com_razao():
    e = rodar(("start",), ("step_succeeded", "a"), ("step_succeeded", "b"), limite=2)
    assert e.status == "escalated" and e.razao == "iteration_budget_exhausted"


def test_falha_conta_iteracao_e_escala_com_detalhe():
    e = rodar(("start",), ("step_failed", None, "falha 1"), ("step_failed", None, "falha 2"), limite=2)
    assert e.status == "escalated" and e.razao == "falha 2" and e.iteracao == 2


def test_falha_abaixo_do_limite_segue_rodando():
    e = rodar(("start",), ("step_failed", None, "falha 1"), limite=3)
    assert e.status == "running" and e.razao == "falha 1" and e.iteracao == 1


def test_estado_terminal_ignora_eventos():
    e = rodar(("start",), ("complete",), ("step_succeeded", "x"))
    assert e.status == "completed" and e.efeitos == ()


def test_funcao_pura_nao_altera_o_estado_anterior():
    antes = Estado(status="running")
    reduzir(antes, "step_succeeded", "e-1")
    assert antes.iteracao == 0 and antes.efeitos == ()
`;
  var solucaoReducer = String.raw`def reduzir(estado, tipo, effect_id=None, detalhe=""):
    if estado.status in ("completed", "escalated"):
        return estado
    if tipo == "start" and estado.status == "pending":
        return replace(estado, status="running")
    if tipo == "pause" and estado.status == "running":
        return replace(estado, status="paused", razao=detalhe)
    if tipo == "resume" and estado.status == "paused":
        return replace(estado, status="running", razao="")
    if tipo == "complete" and estado.status == "running":
        return replace(estado, status="completed")
    if tipo == "step_succeeded" and estado.status == "running":
        if not effect_id or effect_id in estado.efeitos:
            return estado
        proxima = estado.iteracao + 1
        efeitos = (*estado.efeitos, effect_id)
        if proxima >= estado.limite:
            return replace(estado, status="escalated", iteracao=proxima, efeitos=efeitos,
                           razao="iteration_budget_exhausted")
        return replace(estado, iteracao=proxima, efeitos=efeitos)
    if tipo == "step_failed" and estado.status == "running":
        proxima = estado.iteracao + 1
        if proxima >= estado.limite:
            return replace(estado, status="escalated", iteracao=proxima,
                           razao=detalhe or "iteration_budget_exhausted")
        return replace(estado, iteracao=proxima, razao=detalhe)
    return estado
`;

  TrilhaAula.registrar({
    id: 'm01-b3',
    titulo: 'Estado, controle e 12-Factor Agents sob crítica',
    minutos: 35,
    resumo: 'Os doze fatores são perguntas de auditoria, não dogma. O que importa é estado explícito e externalizado, efeitos idempotentes e um fluxo de controle que é seu.',
    objetivo: 'Usar o 12-Factor Agents como lente crítica, distinguir "stateless" de "sem estado", modelar o agente como reducer (estado, evento) para novo estado e retomar um workflow sem repetir efeito externo.',
    revisao: [
      { id: 'm01b3-reducer', pergunta: 'No 12-Factor Agents, o que significa "stateless reducer" (fator 12)?',
        opcoes: [
          opc('a', 'O estado é explícito e externalizado: o agente é uma função (estado, evento) → novo estado, testável e retomável', true, '"Stateless" aqui não é "sem estado": é estado fora da execução.'),
          opc('b', 'O agente não tem nenhum estado', false, 'sem estado nada seria retomável.'),
          opc('c', 'O agente guarda o estado na janela de contexto para ser mais rápido', false, 'a janela pode truncar, resumir e conter texto não validado; use ledger ou checkpoint próprio.')] },
      { id: 'm01b3-idem', pergunta: 'Um agente repete uma transferência após um timeout. O que torna isso seguro?',
        opcoes: [
          opc('a', 'Idempotência: executar duas vezes tem o efeito de uma, por exemplo via effect_id ou chave de idempotência', true, 'retry é rotina em agentes, então operação com efeito precisa ser idempotente ou registrada num ledger.'),
          opc('b', 'Pedir ao modelo para "não tentar de novo"', false, 'é pedido probabilístico, sem controle.'),
          opc('c', 'Salvar o histórico do chat', false, 'o chat não é ledger confiável.')] },
      { id: 'm01b3-norma', pergunta: 'Qual afirmação sobre o 12-Factor Agents está alinhada ao módulo?',
        opcoes: [
          opc('a', 'É um guia de practitioner: cada fator só é aceito quando houver artefato, teste ou telemetria que o sustente, e contrapontos são registrados', true, 'é lente útil, não norma nem certificação.'),
          opc('b', 'É uma norma de certificação consensual', false, 'foi publicado por Dex Horthy/HumanLayer em 2025, como experiência prática.'),
          opc('c', 'Prova que mais agentes pequenos é sempre melhor', false, 'o fator 10 pode reduzir contexto, mas aumenta coordenação: compare qualidade, retrabalho e tempo total.')] },
      { id: 'm01b3-fatores', pergunta: 'Quais quatro fatores o módulo destaca para esta fase do curso?',
        opcoes: [
          opc('a', '2 (own your prompts), 3 (own your context window), 8 (own your control flow) e 10 (small, focused agents)', true, 'são os que já trabalham no SDD, no M00 e no bloco 4.'),
          opc('b', '1, 5, 9 e 13', false, 'o fator 13 é só honorable mention.'),
          opc('c', 'Todos os doze, na ordem, como checklist de aprovação', false, 'doze é lista demais para reter de uma vez, e os fatores são perguntas de auditoria.')] },
      { id: 'm01b3-ledger', pergunta: 'A queda do processo acontece entre o efeito externo e o registro no ledger. O que ainda pode acontecer na retomada?',
        opcoes: [
          opc('a', 'A repetição do efeito; por isso o efeito também precisa ser idempotente no destino ou o registro precisa ser atômico com ele', true, 'o ledger sozinho não cobre a janela entre efeito e registro.'),
          opc('b', 'Nada: o ledger sempre sabe o que aconteceu', false, 'ele só sabe o que foi registrado.'),
          opc('c', 'O modelo lembra do efeito e evita a repetição', false, 'a sessão é descartável e a memória não é ledger.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Estado, efeitos, retomada e supervisão</h3>' +
          '<p>Os blocos 1 e 2 deram método e controles. Agora o tema é o que acontece <em>entre</em> as chamadas: quem guarda o estado, quem decide o próximo passo e como um workflow volta de onde parou sem repetir um efeito. O <strong>12-Factor Agents</strong>, da HumanLayer, serve para organizar essas perguntas. É um guia de practitioner, não uma norma, certificação nem consenso universal: cada fator só é aceito quando houver artefato, teste ou telemetria que o sustente, e você registra os contrapontos.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'O que é o 12-Factor Agents', html:
          '<p>O repositório foi publicado por Dex Horthy/HumanLayer em 2025 e reúne experiência prática. A tese, combinar software determinístico com passos probabilísticos estreitos, é consistente com o laboratório, mas continua sendo uma posição de engenharia a testar no seu contexto.</p>' +
          '<p>"Stateless" aqui <strong>não</strong> significa "sem estado": significa estado explícito e externalizado. O fator 13, <em>pre-fetch</em>, é só <em>honorable mention</em>: pré-carregar dependência conhecida e pequena pode ajudar, enquanto descoberta incerta deve ficar sob demanda, para reduzir custo e ruído.</p>' },
        { tipo: 'texto', html:
          '<h3>Os doze fatores, um a um</h3>' +
          '<p>Os nomes ficam em inglês porque são o vocabulário da fonte. Não trate os números como prova de senioridade: use cada linha para perguntar qual estado, efeito, contrato ou decisão o sistema precisa tornar explícito.</p>' },
        { tipo: 'abas', rotulo: 'Fatores', itens: [
          { rotulo: '1 a 4: modelo, prompt, contexto', blocos: [{ tipo: 'texto', largo: true, html:
            '<table><thead><tr><th>#</th><th>Fator</th><th>O que significa</th><th>Aplicação no workflow</th></tr></thead><tbody>' +
            '<tr><td>1</td><td>Natural Language to Tool Calls</td><td>O superpoder real do LLM é converter linguagem natural em chamadas estruturadas ("cancele a assinatura do João" → <code>{"tool":"cancel_subscription","user_id":42}</code>). Use-o para traduzir intenção; deixe o código executar.</td><td>O modelo propõe uma chamada estruturada; validação, política e código determinístico decidem se ela pode ser executada.</td></tr>' +
            '<tr><td>2</td><td>Own your prompts</td><td>Prompts são código de primeira classe: no seu repositório, versionados, revisáveis, testáveis; nunca escondidos numa abstração de framework que você não controla.</td><td>Como o SQL crítico que você não deixa o ORM gerar às cegas. Prompt em <code>prompts/*.md</code> com <code>git blame</code>.</td></tr>' +
            '<tr><td>3</td><td>Own your context window</td><td>Você decide o que entra na janela, em que formato e em que ordem, em vez de anexar o histórico inteiro. Contexto é o recurso mais caro e escasso do sistema.</td><td>É a projeção do EF: <code>Select(x =&gt; new {...})</code> em vez de arrastar a entidade com navegações. Buscar tudo "por garantia" é o mesmo erro nos dois mundos.</td></tr>' +
            '<tr><td>4</td><td>Tools are just structured outputs</td><td>"Tool call" não é o modelo executando nada: é o modelo emitindo JSON que o SEU código valida e executa (ou recusa). A fronteira entre decidir e agir é sua.</td><td>O modelo devolve um DTO; seu código é o handler. Como no MediatR, o request não se executa sozinho.</td></tr>' +
            '</tbody></table>' }] },
          { rotulo: '5 a 8: estado, humano, fluxo', blocos: [{ tipo: 'texto', largo: true, html:
            '<table><thead><tr><th>#</th><th>Fator</th><th>O que significa</th><th>Aplicação no workflow</th></tr></thead><tbody>' +
            '<tr><td>5</td><td>Unify execution state and business state</td><td>Evite dois estados paralelos ("onde o agente está" × "onde o pedido está") que dessincronizam. Um estado só, inspecionável, de preferência no banco que você já audita.</td><td>A lição das sagas: o estado do workflow mora no mesmo lugar do estado do negócio, ou você passa a vida reconciliando os dois.</td></tr>' +
            '<tr><td>6</td><td>Launch/Pause/Resume with simple APIs</td><td>Agente de produção é interrompível: lança, pausa (esperando aprovação humana, webhook, madrugada) e retoma do ponto exato, sem perder o meio.</td><td>Durable Functions / Hangfire: checkpoint e retomada. Se o agente não sobrevive a um restart do pod, não é de produção.</td></tr>' +
            '<tr><td>7</td><td>Contact humans with tool calls</td><td>"Perguntar ao humano" é uma ferramenta como qualquer outra (<code>request_approval</code>, <code>ask_clarification</code>): estruturada, roteável, auditável, não texto solto no chat.</td><td>O passo de aprovação manual do release pipeline, como primitiva do sistema. O M12 vira isso em camada de política.</td></tr>' +
            '<tr><td>8</td><td>Own your control flow</td><td>O SEU código decide o que roda a seguir: loops, ifs, máquina de estados. O LLM decide dentro dos pontos que você abriu, não o fluxo inteiro.</td><td>A tese central com número: código determinístico no volante, LLM nas decisões semânticas. É o "Pare." do bloco 1, promovido a arquitetura.</td></tr>' +
            '</tbody></table>' }] },
          { rotulo: '9 a 12: erro, agentes, gatilho, reducer', blocos: [{ tipo: 'texto', largo: true, html:
            '<table><thead><tr><th>#</th><th>Fator</th><th>O que significa</th><th>Aplicação no workflow</th></tr></thead><tbody>' +
            '<tr><td>9</td><td>Compact Errors into Context Window</td><td>O erro de ferramenta volta ao modelo compactado e útil ("timeout após 30s na API X, tente com filtro menor"), não como stack trace de 200 linhas que enche a janela de ruído.</td><td>O padrão ProblemDetails (RFC 7807) da sua API: erro estruturado e acionável, não dump. Mesma disciplina, consumidor diferente.</td></tr>' +
            '<tr><td>10</td><td>Small, Focused Agents</td><td>O guia recomenda unidades focadas. Isso pode reduzir contexto e facilitar o diagnóstico, mas aumenta a coordenação: compare qualidade, retrabalho e tempo total.</td><td>SRP como heurística, sem concluir que mais processos ou agentes é automaticamente melhor.</td></tr>' +
            '<tr><td>11</td><td>Trigger from anywhere, meet users where they are</td><td>Agente é serviço, não interface: dispara por Slack, cron, webhook, e-mail, fila, e responde no canal de origem. Chat é UMA porta, não A porta.</td><td>Seu worker service com vários bindings: HTTP, fila, timer. O agente é o handler; o gatilho é plugável.</td></tr>' +
            '<tr><td>12</td><td>Make your agent a stateless reducer</td><td>O agente ideal é uma função pura: (estado, evento) → novo estado. Todo o estado vem de fora e volta para fora; a execução não guarda nada. Testável, reproduzível, paralelizável.</td><td><code>(state, action) =&gt; newState</code>: o reducer do Redux, ou o fold de event sourcing de um sistema bancário. Mesma matemática.</td></tr>' +
            '</tbody></table>' }] }
        ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fator 13 (apêndice): pre-fetch all the context you might need', html:
          '<p>Se você já sabe que o agente vai precisar de um dado, busque-o antes e ponha na janela, em vez de gastar um turno de LLM para ele "decidir" chamar a ferramenta óbvia. Cada turno economizado é latência e custo a menos. Vale para dependência conhecida e pequena; descoberta incerta fica sob demanda (retrieval).</p>' },
        { tipo: 'texto', html:
          '<h3>Os quatro fatores que mais importam agora</h3>' +
          '<p>Doze é lista demais para reter de uma vez. Quatro já trabalham nesta fase do curso:</p>' +
          '<ul><li><strong>Fator 2 (own your prompts):</strong> suas skills do M00 são prompts versionados no repositório. Mantenha o padrão quando aparecerem frameworks com abstração "mágica" (o M08 volta a isso).</li>' +
          '<li><strong>Fator 3 (own your context window):</strong> é o bloco 1 do M00 com outro nome, e o tema central do M08.</li>' +
          '<li><strong>Fator 8 (own your control flow):</strong> o SDD do bloco 1 é você possuindo o fluxo: o <code>plan.md</code> é o controle, e o agente executa dentro dele.</li>' +
          '<li><strong>Fator 10 (small, focused agents):</strong> seus subagentes do M00 já seguem isso; o bloco 4 escala o princípio para paralelismo.</li></ul>' },
        { tipo: 'takeaway', html: 'Os fatores são <mark>perguntas de auditoria</mark>, não dogma; "stateless" quer dizer estado <mark>externalizado</mark>, não ausente.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'callout', tom: 'neutral', titulo: 'Fundamento de engenharia: função pura, idempotência e event sourcing', html:
          '<p>O fator 12 só parece novidade. Três conceitos clássicos o sustentam:</p>' +
          '<ul><li><strong>Função pura:</strong> a saída depende só da entrada, sem efeito colateral escondido. É o que torna o teste trivial (entrada → saída esperada, sem mock de meio mundo). O agente-reducer é testável do mesmo jeito: dado este estado e este evento, o próximo estado é este.</li>' +
          '<li><strong>Idempotência:</strong> executar duas vezes = executar uma (PUT × POST; a mesma mensagem processada duas vezes pelo consumer não duplica o débito). Agentes tornam isso obrigatório: retry é rotina, e um agente que "tenta de novo" uma transferência não idempotente é o incidente do M12.</li>' +
          '<li><strong>Event sourcing como analogia limitada:</strong> um reducer calcula estado a partir de eventos explícitos; uma janela de contexto não é event store confiável, porque pode truncar, resumir e conter texto não validado. Use ledger ou checkpoint próprio para efeitos e trate o contexto só como entrada da chamada.</li></ul>' },
        { tipo: 'texto', html:
          '<h3>Retomada sem repetir efeito</h3>' +
          '<p>Os fatores 5, 6 e 12 viram um mecanismo concreto. A instância A consulta o <strong>ledger</strong> durável (o estado externo), aplica o efeito <code>e-42</code> e registra. A sessão cai ou pausa; a instância B carrega o estado e, ao ver o mesmo <code>effect_id</code>, não produz efeito novo.</p>' +
          '<p><strong>Cuidado:</strong> se a queda ocorrer <em>entre</em> o efeito e o registro, a repetição é possível. Por isso o efeito também precisa ser idempotente (por exemplo, chave de idempotência no destino) ou o registro precisa ser atômico com ele.</p>' +
          '<p>Um workflow auditável não recebe "conforme" por impressão. O laboratório executa a transição pause → resume numa instância nova e verifica que o mesmo <code>effect_id</code> não volta a produzir efeito; também mostra o orçamento chegando a <code>ESCALATED</code> com a razão do handoff. Preveja o que a instância B vai fazer.</p>' },
        { tipo: 'rode', id: 'm01b3-rode', titulo: 'Pause, retome em outra instância e esgote o orçamento', enunciado: 'Rode a suíte do workflow e depois acompanhe, etapa por etapa, o estado que o reducer produz. Traço obtido com as funções reais do laboratório.',
          prefixo: '$', entrada: 'python -m unittest tests.test_workflow -v', unidade: 'eventos', terminalTitulo: 'lab M01', etapas: etapasWorkflow(),
          prever: { pergunta: 'A instância B retoma e recebe de novo o evento STEP_SUCCEEDED com effect_id "e-42", que já está no ledger. O que acontece?', opcoes: [
            { id: 'a', texto: 'O efeito é aplicado de novo e a iteração sobe para 2.', correta: false, porque: 'seria o efeito duplicado que o ledger existe para impedir.' },
            { id: 'b', texto: 'O estado volta idêntico: iteração continua 1 e os efeitos continuam [e-42].', correta: true, porque: 'o reducer devolve o estado quando o effect_id já foi aplicado.' },
            { id: 'c', texto: 'O workflow vai para ESCALATED por evento duplicado.', correta: false, porque: 'duplicata não é falha; só o orçamento esgotado escala.' }
          ] },
          tutorAntes: 'Aperte Enter e abra "Instância B" para ver o evento repetido.',
          tutorDepois: 'O mesmo <code>effect_id</code> não produz efeito novo; o <code>e-43</code> avança a iteração para 2. Já o orçamento esgotado termina em <code>escalated</code> com a razão guardada para o handoff.',
          callout: 'Você viu a retomada sem repetir efeito e o orçamento virando escalonamento.' },
        { tipo: 'takeaway', html: 'Sessão é <mark>descartável</mark>, estado não: o mesmo <mark>effect_id</mark> nunca produz um efeito novo.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html: '<h3>Ponha o ciclo de retomada na ordem</h3><p>Fatores 5, 6 e 12 juntos: o que acontece, em que ordem, quando um agente pausa e outra instância o retoma.</p>' },
        { tipo: 'ordene', id: 'm01b3-ordene', titulo: 'Ordene a retomada idempotente', enunciado: 'Use os botões para pôr os passos na ordem correta e confira.',
          itens: [
            { id: 'retoma', texto: 'A instância B retoma e vê o mesmo <code>effect_id</code> no ledger: nenhum efeito novo' },
            { id: 'consulta', texto: 'A instância A consulta o ledger antes de agir' },
            { id: 'registra', texto: 'O efeito é aplicado e registrado no ledger' },
            { id: 'carrega', texto: 'Uma instância nova carrega o estado do checkpoint' },
            { id: 'pausa', texto: 'O workflow pausa (aprovação humana, webhook ou queda)' }
          ], solucao: ['consulta', 'registra', 'pausa', 'carrega', 'retoma'],
          dica: 'Primeiro se consulta e se age; só depois a sessão sai de cena e outra instância carrega o estado.',
          callout: 'Ciclo na ordem certa: o estado fica fora da sessão e o ledger decide o que já foi feito.' },
        { tipo: 'python', id: 'm01b3-python', titulo: 'Escreva o reducer idempotente', obrigatorio: false,
          enunciado: 'Complete os ramos <code>step_succeeded</code> e <code>step_failed</code> de <code>reduzir(estado, tipo, effect_id, detalhe)</code>. <code>step_succeeded</code>: sem <code>effect_id</code> ou já no ledger, devolva o estado; senão some 1 à iteração e registre o efeito; no limite, escale com <code>"iteration_budget_exhausted"</code>. <code>step_failed</code>: some 1 à iteração, guarde o detalhe e, no limite, escale com ele. É a mesma lógica de <code>reduce_state</code> do laboratório.',
          codigo: codigoReducer, testes: testesReducer,
          dica: 'Use <code>replace(estado, ...)</code> (dataclass frozen) e nunca mude o estado recebido. Calcule <code>proxima = estado.iteracao + 1</code> e compare com <code>estado.limite</code>.',
          solucao: solucaoReducer,
          tutorDepois: 'A pureza é o que torna o teste trivial: dado este estado e este evento, o próximo estado é este, sem mock. A idempotência vem do ledger (<code>efeitos</code>), e o orçamento transforma o loop infinito em handoff.',
          callout: 'Reducer puro, idempotente e com orçamento: o estado vem de fora e volta para fora.' },
        { tipo: 'transcript', id: 'm01b3-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'sessão retomada P-42',
          enunciado: 'A sessão caiu e um agente retoma o pedido. Uma das afirmações dele não é sustentada pelo que a sessão mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'A sessão caiu no meio do pedido P-42. Retome sem repetir nenhum efeito.' },
            { quem: 'agente', texto: 'Vou ler o checkpoint em vez de confiar no histórico do chat.' },
            { quem: 'ferramenta', texto: '$ cat checkpoints/P-42.json\n{"status": "paused", "iteration": 1, "completed_effects": ["e-42"]}' },
            { quem: 'agente', texto: 'O checkpoint mostra e-42 aplicado, então não repito e-42 e sigo para e-43.' },
            { quem: 'ferramenta', texto: '$ run-step e-43\nok (iteration=2)' },
            { quem: 'agente', texto: 'Pronto. Como o resumo do chat dizia que e-41 também tinha sido aplicado, não precisei reexecutá-lo.' }
          ],
          erradas: [5],
          explicacao: { 5: 'o ledger só registra e-42; "o resumo do chat disse" não é evidência. Uma janela de contexto pode truncar, resumir e conter texto não validado, e e-41 nunca apareceu em <code>completed_effects</code>. A decisão sobre e-41 vem do ledger ou de uma consulta idempotente ao destino, não da memória da conversa.' },
          tutorDepois: 'Ledger é fonte do que foi aplicado; o chat é só entrada da chamada.' },
        { tipo: 'takeaway', html: 'Função <mark>pura</mark>, efeito <mark>idempotente</mark>, ledger fora da conversa: é isso que torna o agente <mark>retomável</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'm01b3-esc-reducer', titulo: 'Confira: o stateless reducer',
          pergunta: 'No 12-Factor Agents, o que significa "stateless reducer" (fator 12)?',
          opcoes: [
            { id: 'a', texto: 'O agente não tem nenhum estado.', correta: false, porque: 'sem estado nada seria retomável.' },
            { id: 'b', texto: 'O agente guarda o estado na janela de contexto para ser mais rápido.', correta: false, porque: 'a janela não é event store confiável: pode truncar, resumir e conter texto não validado.' },
            { id: 'c', texto: 'O estado é explícito e externalizado: o agente é uma função (estado, evento) → novo estado, testável e retomável.', correta: true, porque: '"Stateless" aqui é estado fora da execução; use ledger ou checkpoint próprio.' },
            { id: 'd', texto: 'O agente nunca usa ferramentas.', correta: false, porque: 'nada a ver: o reducer decide o próximo estado, e as ferramentas continuam sendo chamadas pelo seu código.' }
          ], tutorDepois: 'Estado fora da execução: a função só transforma.' },
        { tipo: 'escolha', id: 'm01b3-esc-norma', titulo: 'Confira: como tratar o guia',
          pergunta: 'Qual afirmação sobre o 12-Factor Agents está alinhada ao módulo?',
          opcoes: [
            { id: 'a', texto: 'É uma norma de certificação consensual.', correta: false, porque: 'é experiência de practitioner, não consenso nem certificação.' },
            { id: 'b', texto: 'É um guia de practitioner: cada fator só é aceito quando houver artefato, teste ou telemetria que o sustente, e contrapontos são registrados.', correta: true, porque: 'é lente útil, não norma. O fator 10 pode reduzir contexto, mas aumenta coordenação.' },
            { id: 'c', texto: 'Prova que mais agentes pequenos é sempre melhor.', correta: false, porque: 'compare qualidade, retrabalho e tempo total antes de concluir.' },
            { id: 'd', texto: 'Obriga a usar o fator 13 em todo projeto.', correta: false, porque: 'o fator 13 é honorable mention, e descoberta incerta fica sob demanda.' }
          ], tutorDepois: 'Aceite um fator quando houver artefato, teste ou telemetria que o sustente.' },
        { tipo: 'texto', html: '<p class="ta-nota">12-Factor Agents (HumanLayer, 2025) é practitioner guidance: heurísticas com evidência e contrapontos, não norma. Fontes verificadas em 14/08/2026; revalidar documentação de produto em até 90 dias.</p>' },
        { tipo: 'takeaway', html: 'O guia é <mark>lente</mark>, não norma: cada fator vale quando há <mark>artefato, teste ou telemetria</mark> que o sustente.' }
      ] }
    ]
  });
})();
