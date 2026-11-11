/* M13 · Bloco 9: agente com estado tipado, budget e retomada. Fonte: M13.html#h-b9. Saídas do rode são a execução registrada no bloco (evidence/m13/B09). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoRun = String.raw`def run(state, plan, tools, max_steps):
    # LACUNA: valide o budget, retome de state["done"], pare no budget
    # e falhe alto em tool desconhecida.
    for step in plan:
        name, _, arg = step.partition(":")
        state["calls"] += 1
        state["results"][step] = tools[name](arg)
        state["done"] += 1
    state["status"] = "done"
    return state
`;
  var solucaoRun = String.raw`def run(state, plan, tools, max_steps):
    if max_steps <= 0:
        raise ValueError("budget de passos deve ser positivo")
    state["status"] = "running"
    while state["status"] == "running":
        if state["done"] >= len(plan):
            state["status"] = "done"
            break
        if state["done"] >= max_steps:
            state["status"] = "budget_exceeded"
            break
        step = plan[state["done"]]
        name, _, arg = step.partition(":")
        if name not in tools:
            raise KeyError("tool desconhecida: " + name)
        state["calls"] += 1
        state["results"][step] = tools[name](arg)
        state["done"] += 1
    return state
`;
  var testesRun = String.raw`import json

def novo():
    return {"done": 0, "calls": 0, "results": {}, "status": "running"}

TOOLS = {"search": lambda a: "hits:" + a, "callers": lambda a: "callers:" + a}
PLAN = ["search:ingestao", "callers:parse", "search:acl"]

def test_execucao_completa():
    s = run(novo(), PLAN, TOOLS, 5)
    assert s["status"] == "done" and s["done"] == 3 and s["calls"] == 3

def test_budget_para_a_execucao():
    s = run(novo(), PLAN, TOOLS, 2)
    assert s["status"] == "budget_exceeded" and s["done"] == 2

def test_resume_nao_repete_passo_concluido():
    s = run(novo(), PLAN, TOOLS, 2)
    s = json.loads(json.dumps(s))          # checkpoint em JSON e volta
    s = run(s, PLAN, TOOLS, 5)             # budget novo
    assert s["status"] == "done" and s["calls"] == 3

def test_tool_desconhecida_falha_alto():
    try:
        run(novo(), ["rm:tudo"], TOOLS, 5)
    except KeyError:
        return
    assert False, "deveria levantar KeyError"

def test_budget_zero_e_rejeitado():
    try:
        run(novo(), PLAN, TOOLS, 0)
    except ValueError:
        return
    assert False, "deveria levantar ValueError"
`;

  TrilhaAula.registrar({
    id: 'm13-b9',
    titulo: 'Agente com estado tipado, budget e retomada',
    minutos: 30,
    resumo: 'Um agente sem estado serializável morre no primeiro crash; sem budget, roda até o cartão de crédito. O estado vira JSON, o checkpoint é atômico e o resume continua de onde parou.',
    objetivo: 'Explicar por que o estado do agente é JSON, o que torna o resume idempotente e o que o teste de kill/resume mede, e por que o budget de passos é mecanismo de segurança.',
    revisao: [
      { id: 'm13b9-json', pergunta: 'Por que o <code>AgentState</code> é um dataclass serializável a JSON e não um objeto vivo?',
        opcoes: [
          opc('a', 'Para o checkpoint sobreviver a um kill e outro runner retomar do arquivo', true, 'objeto vivo morre com o processo; o estado em JSON (goal, plan, done, results, status, trace) é o que o resume lê.'),
          opc('b', 'Porque JSON é mais rápido que memória', false, 'o motivo é durabilidade, não velocidade.'),
          opc('c', 'Para o modelo ler o estado no prompt', false, 'o planner aqui é um script; o estado existe para retomada.')] },
      { id: 'm13b9-idem', pergunta: 'O que torna o resume idempotente e como o teste prova?',
        opcoes: [
          opc('a', '<code>state.done</code> persistido no checkpoint; o teste conta as invocações de tool do runner novo e exige zero repetição', true, 'o runner retoma de <code>state.done</code>; passos concluídos não rodam de novo.'),
          opc('b', 'O planner ser determinístico', false, 'determinismo do planner não impede reexecução de tool.'),
          opc('c', 'O budget de passos', false, 'o budget limita custo, não repetição.')] },
      { id: 'm13b9-budget', pergunta: 'Por que o budget de passos é mecanismo de segurança?',
        opcoes: [
          opc('a', 'Sem ele o run não tem fim; budget ≤ 0 é rejeitado e estourar vira <code>budget_exceeded</code> retomável', true, 'um agente sem budget roda até o cartão de crédito.'),
          opc('b', 'Porque deixa o agente mais rápido', false, 'o budget só corta; não acelera.'),
          opc('c', 'Porque substitui o checkpoint', false, 'são mecanismos distintos: um limita custo, o outro dá durabilidade.')] },
      { id: 'm13b9-rotulo', pergunta: 'Por que cada linha do trace carrega o rótulo do planner (<code>scripted-simulated (sem LLM real)</code>)?',
        opcoes: [
          opc('a', 'Para um planner simulado não circular como se fosse LLM; o que está sob teste são os mecanismos', true, 'cada passo executa uma tool real do pacote (busca do B6, grafo do B7), mas a decisão é script.'),
          opc('b', 'Para o log ficar mais bonito', false, 'o rótulo é honestidade de evidência.'),
          opc('c', 'Para o resume saber qual planner usar', false, 'o rótulo não controla o resume.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>O agente que morre e cobra o recomeço</h3>' +
          '<p>Um agente roda sete passos de busca e consulta ao grafo; no passo cinco o processo é morto. Se o estado vivia só na memória, o usuário recomeça do zero e paga os cinco passos de novo. Se o agente não tem limite, um laço defeituoso roda até esgotar o orçamento. Os dois problemas têm a mesma raiz: o estado e o custo não são dados explícitos.</p>' +
          '<h3>O modelo mental</h3>' +
          '<p>O <code>AgentState</code> é um <strong>dataclass</strong> serializável a JSON com <code>goal</code>, <code>plan</code>, <code>done</code>, <code>results</code>, <code>status</code> (<code>running</code>, <code>done</code>, <code>budget_exceeded</code>, <code>stopped</code>) e <code>trace</code>. O <strong>checkpoint</strong> é uma escrita atômica (grava em arquivo temporário e renomeia, o mesmo padrão do B3). O <code>resume</code> relê o JSON e continua a partir de <code>state.done</code>: passos concluídos <strong>não se repetem</strong>, o que torna o efeito <strong>idempotente</strong>.</p>' +
          '<ul><li><strong>Budget:</strong> o runner recusa <code>max_steps</code> menor ou igual a zero e, quando <code>state.done</code> alcança o budget, marca <code>budget_exceeded</code>. No resume, esse status volta a <code>running</code> com budget novo.</li>' +
          '<li><strong>Tool desconhecida:</strong> levanta <code>KeyError</code>. Ignorar em silêncio esconderia uma falha de contrato.</li>' +
          '<li><strong>Planner rotulado:</strong> sem LLM neste ambiente, a política é o <code>ScriptedPlanner</code>, que executa o plano na ordem. Cada linha do trace leva o rótulo <code>scripted-simulated (sem LLM real)</code>. Cada passo executa uma tool real do pacote; nenhum <code>sleep()</code> nem resposta hardcoded posa de trabalho.</li></ul>' +
          '<p><strong>Limite:</strong> o bloco prova os mecanismos (estado, budget, stop, checkpoint, retomada), não a qualidade de decisão de um LLM. Pela forma do código, o checkpoint é chamado por quem usa o runner: um passo cuja tool já rodou mas que não chegou ao checkpoint volta a rodar no resume (consequência do desenho, não testada no bloco).</p>' },
        { tipo: 'ordene', id: 'b9-ordene-passo', titulo: 'Ponha o passo do runner na ordem',
          enunciado: 'O laço do <code>AgentRunner.run</code> executa um passo por volta. Ponha as etapas na ordem em que o código as faz.',
          itens: [
            { id: 'tool', texto: 'Invocar a tool com o argumento e contar a invocação' },
            { id: 'budget', texto: 'Checar o budget: se <code>state.done</code> alcançou o limite, marcar <code>budget_exceeded</code>' },
            { id: 'grava', texto: 'Gravar o resultado em <code>state.results</code> e no <code>trace</code> (com o rótulo do planner) e incrementar <code>done</code>' },
            { id: 'plan', texto: 'Pedir o próximo passo ao planner; se não houver, marcar <code>done</code>' },
            { id: 'resolve', texto: 'Resolver a tool pelo nome; se não existir, levantar <code>KeyError</code>' }
          ], solucao: ['budget', 'plan', 'resolve', 'tool', 'grava'],
          dica: 'O custo é checado antes de qualquer trabalho; a tool só roda depois de existir.',
          tutorDepois: 'Budget, planner, resolução da tool, invocação e gravação. Falhar alto antes de invocar evita efeito colateral de um passo inválido.' },
        { tipo: 'takeaway', html: 'Estado em <mark>JSON</mark>, checkpoint <mark>atômico</mark>, resume por <mark>state.done</mark> e <mark>budget</mark> que corta.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html: '<p>A execução abaixo é a registrada no bloco (<code>evidence/m13/B09/pytest-agent.txt</code>). O teste de kill/resume grava o checkpoint no meio do plano, sobe um runner novo e conta as invocações de tool.</p>' },
        { tipo: 'rode', id: 'b9-rode', titulo: 'Rode a suíte do agente', enunciado: 'Aperte Enter e acompanhe os grupos de teste. Saída registrada no bloco.',
          prefixo: '$', entrada: 'uv run pytest tests/test_agent.py -v', unidade: 'testes', terminalTitulo: 'lab M13 (saída registrada)',
          prever: { pergunta: 'No teste de kill/resume, depois de gravar o checkpoint no meio do plano e subir um runner novo, quantas invocações de tool o runner novo faz para os passos já concluídos?', opcoes: [
            { id: 'a', texto: 'Zero: ele continua de <code>state.done</code>', correta: true, porque: 'o teste conta as tool invocations e exige zero repetição dos passos concluídos.' },
            { id: 'b', texto: 'Uma: relê o último passo por segurança', correta: false, porque: 'reexecutar o último passo quebraria a idempotência medida pelo teste.' },
            { id: 'c', texto: 'Todas: o runner novo não conhece o estado', correta: false, porque: 'o runner novo carrega o JSON do checkpoint, que traz <code>done</code>.' }
          ] },
          etapas: [
            { id: 'run', nome: 'Execução e checkpoint', descricao: 'Trace real e estado em JSON', tom: 'dns', ms: 2, linhas: [
              L('cmd', 'uv run pytest tests/test_agent.py -v'),
              L('out', 'test_full_run_records_real_trace_and_finishes PASSED'),
              L('out', 'test_checkpoint_file_is_json_typed_state PASSED'),
              L('hint', 'o trace registra o passo real executado; o checkpoint é JSON tipado')] },
            { id: 'limites', nome: 'Budget e falha alta', descricao: 'Parar, rejeitar, não ignorar', tom: 'request', ms: 3, linhas: [
              L('out', 'test_step_budget_stops_execution PASSED'),
              L('out', 'test_unknown_tool_fails_loudly PASSED'),
              L('out', 'test_zero_budget_is_rejected PASSED'),
              L('hint', 'budget estourado vira status; tool desconhecida e budget zero viram erro')] },
            { id: 'resume', nome: 'Kill e resume', descricao: 'Zero repetição', tom: 'response', ms: 2, linhas: [
              L('out', 'test_kill_and_resume_does_not_repeat_completed_steps PASSED'),
              L('out', 'test_idempotent_resume_is_safe_to_replay PASSED'),
              L('in', '7 passed'),
              L('hint', 'o runner novo contou zero invocações para os passos concluídos')] }
          ],
          tutorAntes: 'Responda a previsão, aperte Enter e depois clique nas etapas para reler cada grupo.',
          callout: 'Você viu os sete oráculos do agente passarem, inclusive kill/resume.' },
        { tipo: 'transcript', id: 'b9-transcript', titulo: 'Ache a prova que não prova', obrigatorio: false, terminalTitulo: 'sessão de retomada (exemplo)',
          enunciado: 'O agente afirma que o resume foi idempotente. Uma afirmação não é sustentada pelo que a sessão mostra. Clique na linha e aperte Conferir. Valores de exemplo, para o plano de cinco passos com checkpoint em <code>done = 3</code>.',
          linhas: [
            { quem: 'voce', texto: 'Mate o processo depois do passo 3 de 5, retome do checkpoint e prove que nada foi repetido.' },
            { quem: 'agente', texto: 'Subi um runner novo e chamei resume() sobre o arquivo de checkpoint.' },
            { quem: 'ferramenta', texto: '$ python -c "import json;print(json.load(open(\'agent.ckpt.json\'))[\'done\'])"\n3' },
            { quem: 'ferramenta', texto: 'runner.tool_invocations = 5' },
            { quem: 'agente', texto: 'Resume idempotente: os passos concluídos não rodaram de novo.' }
          ],
          erradas: [4],
          explicacao: { 4: 'o runner novo deveria ter feito 2 invocações (passos 4 e 5). O contador mostra 5: os três passos concluídos rodaram de novo. As causas prováveis são <code>done</code> não persistido ou não carregado, ou um resume que recomeça do zero. O teste de kill/resume existe para barrar exatamente isso.' },
          tutorDepois: 'A frase do agente contradiz o contador; confie na evidência da ferramenta.' },
        { tipo: 'takeaway', html: '<mark>Zero invocações repetidas</mark> é o que o teste de kill/resume mede; a frase "idempotente" não conta.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b9-python', titulo: 'Escreva o runner com budget e retomada', obrigatorio: false,
          enunciado: 'Implemente <code>run(state, plan, tools, max_steps)</code> sobre um estado em dict (<code>done</code>, <code>calls</code>, <code>results</code>, <code>status</code>). Retome de <code>state["done"]</code>, pare em <code>budget_exceeded</code>, falhe com <code>KeyError</code> para tool desconhecida e <code>ValueError</code> para budget ≤ 0. Versão reduzida do <code>AgentRunner</code> do bloco, sem planner nem arquivo.',
          codigo: codigoRun, testes: testesRun,
          dica: 'Use <code>while state["status"] == "running"</code>. Dentro: plano esgotado → <code>done</code>; <code>done &gt;= max_steps</code> → <code>budget_exceeded</code>; senão execute <code>plan[state["done"]]</code>.',
          solucao: solucaoRun,
          tutorDepois: 'Repare que o resume não tem código próprio: retomar é só chamar <code>run</code> sobre o estado persistido.',
          callout: 'Seu runner para no budget, retoma sem repetir e falha alto.' },
        { tipo: 'escolha', id: 'b9-esc1', titulo: 'Tool desconhecida', pergunta: 'O plano manda chamar uma tool que não existe no registro. O que o contrato exige?',
          opcoes: [
            opc('a', 'Pular o passo e seguir', false, 'falha silenciosa: o plano parece concluído sem ter sido executado.'),
            opc('b', 'Levantar <code>KeyError</code>, nunca ignorar', true, 'tool desconhecida falha alto; é uma violação de contrato, não um caso a contornar.'),
            opc('c', 'Marcar o status como <code>done</code>', false, 'marcaria concluído um plano que não rodou.')] },
        { tipo: 'escolha', id: 'b9-esc2', titulo: 'Run infinito', pergunta: 'Um agente rodou a noite inteira em laço. Qual é o diagnóstico do bloco?',
          opcoes: [
            opc('a', 'Ausência de budget, ou budget ≤ 0 aceito', true, 'o runner exige budget positivo e para ao alcançá-lo.'),
            opc('b', 'Checkpoint não atômico', false, 'checkpoint não atômico corrompe estado; não prolonga o run.'),
            opc('c', 'Trace sem rótulo de planner', false, 'o rótulo trata de honestidade de evidência, não de parada.')] },
        { tipo: 'takeaway', html: 'Budget é <mark>segurança</mark>, resume é <mark>idempotente</mark> e o planner simulado é <mark>rotulado</mark>.' }
      ] }
    ]
  });
})();
