/* M10 · Bloco 3: Persistência, checkpoint, threads, retomada e time travel. Fonte: M10.html#b03. PostgresSaver real é trilha externa; o exercício usa checkpointer em memória. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoCk = `class Morte(Exception):
    """Simula o processo morrendo no meio da execucao."""


def thread_id(tenant_id, repo_id, commit=None):
    """Chave estavel, derivavel so dos parametros de entrada."""
    return "ingestao"


def executar(passos, store, thread, chamadas, morrer_antes=None, durabilidade="sync"):
    """passos: lista de (nome, funcao). store: {thread: {nome: resultado}}.
    chamadas: lista onde cada passo PAGO registra seu nome.
    durabilidade "sync": checkpoint a cada passo. "exit": so no fim."""
    feitos = {}
    for nome, fn in passos:
        if nome == morrer_antes:
            raise Morte(nome)
        chamadas.append(nome)
        feitos[nome] = fn()
    return feitos
`;
  var solucaoCk = `class Morte(Exception):
    pass


def thread_id(tenant_id, repo_id, commit=None):
    base = "ingestao-" + str(tenant_id) + "-" + str(repo_id)
    return base if commit is None else base + "-" + str(commit)


def executar(passos, store, thread, chamadas, morrer_antes=None, durabilidade="sync"):
    feitos = store.setdefault(thread, {})
    buffer = {}
    for nome, fn in passos:
        if nome in feitos:
            continue
        if nome == morrer_antes:
            raise Morte(nome)
        chamadas.append(nome)
        resultado = fn()
        if durabilidade == "sync":
            feitos[nome] = resultado
        else:
            buffer[nome] = resultado
    feitos.update(buffer)
    return dict(feitos)
`;
  var testesCk = `NOMES = ["clone", "parse", "analisar", "consolidar", "relatorio"]
PASSOS = [(n, (lambda n=n: n + ":ok")) for n in NOMES]


def test_thread_id_estavel_e_derivavel():
    assert thread_id(42, 7) == thread_id(42, 7)
    assert thread_id(42, 7) != thread_id(42, 8)
    assert thread_id(42, 7) != thread_id(43, 7)
    assert thread_id(42, 7, "abc1") != thread_id(42, 7)
    assert len(thread_id(42, 7, "a" * 40)) < 255


def test_execucao_completa_paga_cada_passo_uma_vez():
    ch = []
    executar(PASSOS, {}, "t", ch)
    assert ch == NOMES


def test_kill_e_retomada_sync_soma_uma_execucao():
    store, ch = {}, []
    try:
        executar(PASSOS, store, "t", ch, morrer_antes="analisar")
    except Morte:
        pass
    assert ch == ["clone", "parse"]
    executar(PASSOS, store, "t", ch)
    assert ch == NOMES


def test_exit_perde_tudo_e_repete():
    store, ch = {}, []
    try:
        executar(PASSOS, store, "t", ch, morrer_antes="analisar", durabilidade="exit")
    except Morte:
        pass
    executar(PASSOS, store, "t", ch, durabilidade="exit")
    assert len(ch) == 2 + 5


def test_thread_desconhecida_nao_herda_estado():
    store, ch = {}, []
    executar(PASSOS, store, "a", ch)
    executar(PASSOS, store, "b", ch)
    assert len(ch) == 10


def test_thread_concluida_nao_repete_nada():
    store, ch = {}, []
    executar(PASSOS, store, "t", ch)
    executar(PASSOS, store, "t", ch)
    assert len(ch) == 5
`;

  TrilhaAula.registrar({
    id: 'm10-b3',
    titulo: 'Persistência: checkpoint, thread e retomada',
    minutos: 40,
    resumo: 'Este é o bloco que justifica o framework: persistência correta não se escreve em algumas centenas de linhas. O thread_id decide o que pode ser retomado, a durabilidade decide o que se perde, e a retomada por replay impõe idempotência.',
    objetivo: 'Escolher thread_id e modo de durabilidade, provar uma retomada com números (soma próxima de uma execução única) e usar time travel para depurar sem reprocessar.',
    revisao: [
      { id: 'm10b3-thread', pergunta: 'Qual thread_id permite retomar a ingestão do repositório R do tenant T depois de perder o processo que a iniciou?',
        opcoes: [
          opc('a', 'Chave estável derivável dos parâmetros de entrada: tenant + repo (e commit, se reindexa a mesma coisa)', true, 'não pode depender de consultar nada nem do processo que o gerou.'),
          opc('b', 'uuid4() por execução', false, 'cada tentativa vira thread nova e nunca retoma.'),
          opc('c', 'Só o tenant_id', false, 'duas ingestões do mesmo cliente colidem.')] },
      { id: 'm10b3-dur', pergunta: 'Cada nó de análise é uma chamada paga. Qual modo de durabilidade?',
        opcoes: [
          opc('a', '"sync": persiste a cada passo bloqueando até gravar; nada se perde', true, 'é a decisão de synchronous_commit: durabilidade contra latência, por caso de uso.'),
          opc('b', '"exit": persiste só no fim', false, 'se o processo morrer, perde tudo.'),
          opc('c', '"async": pode perder o último passo', false, 'aceitável em trabalho tolerante, não quando repetir custa dinheiro.')] },
      { id: 'm10b3-replay', pergunta: 'O que acontece com o nó que estava em andamento quando o processo morreu e a execução é retomada?',
        opcoes: [
          opc('a', 'É reexecutado desde o começo; efeito colateral acontece de novo se o nó não for idempotente', true, 'antídotos: ON CONFLICT DO NOTHING, chave de idempotência, verificação "já fiz?".'),
          opc('b', 'Continua exatamente de onde parou, na linha seguinte', false, 'o checkpoint é por passo, não por linha.'),
          opc('c', 'É pulado', false, 'seria perda de trabalho.')] },
      { id: 'm10b3-gran', pergunta: 'Qual a regra de granularidade do nó?',
        opcoes: [
          opc('a', 'Quebre o nó no ponto em que o trabalho já feito é caro demais para repetir: um nó por arquivo via Send, não 400 arquivos num nó', true, 'nó grande perde mais trabalho; nó pequeno custa mais I/O.'),
          opc('b', 'Sempre um nó só, para ter um checkpoint', false, 'a falha apaga tudo que o nó já fez.'),
          opc('c', 'Um nó por linha de código', false, 'I/O em excesso.')] },
      { id: 'm10b3-tt', pergunta: 'Para que serve o time travel?',
        opcoes: [
          opc('a', 'Depurar ("em que passo o custo explodiu?"), corrigir o estado sem reprocessar e experimentar (outro modelo a partir do mesmo trabalho de preparação)', true, 'o histórico de checkpoints permite voltar e reexecutar dali.'),
          opc('b', 'Desfazer efeitos colaterais já ocorridos', false, 'o replay repete efeitos; não os desfaz.'),
          opc('c', 'Acelerar a primeira execução', false, 'nada tem a ver com velocidade.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Tudo o que você viu no bloco 2 dava para escrever à mão em algumas centenas de linhas; <strong>persistência correta, não</strong>. E o checkpoint do módulo é literalmente o que o currículo cobra: <em>matar o processo no meio de uma execução e mostrar que ela retoma do último ponto sem repetir chamadas pagas</em>.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>O modelo: thread, checkpoint, snapshot</h3>' +
          '<table><thead><tr><th>Conceito</th><th>O que é</th><th>Equivalente mental</th></tr></thead><tbody>' +
          '<tr><td><strong>Checkpointer</strong></td><td>componente que persiste o estado (<code>InMemorySaver</code>, <code>SqliteSaver</code>, <code>PostgresSaver</code>)</td><td>repositório de eventos do Durable Functions</td></tr>' +
          '<tr><td><strong>Thread</strong></td><td>linha de execução isolada, identificada por <code>thread_id</code></td><td>instância do workflow / id da saga</td></tr>' +
          '<tr><td><strong>Checkpoint</strong></td><td>snapshot do estado num ponto da execução</td><td>um <em>save point</em></td></tr>' +
          '<tr><td><strong>Histórico</strong></td><td>sequência de checkpoints de uma thread</td><td>log de eventos; permite time travel</td></tr>' +
          '</tbody></table>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'async def executar_ingestao(repo_id: int, tenant_id: int, repo_url: str) -> dict:',
          '    async with AsyncPostgresSaver.from_conn_string(settings.database_url) as saver:',
          '        await saver.setup()                       # cria as tabelas do checkpointer (1x)',
          '        app = construir().compile(checkpointer=saver)',
          '',
          '        # thread_id ESTÁVEL por unidade de trabalho: é o que permite retomar',
          '        config = {"configurable": {"thread_id": f"ingestao-{tenant_id}-{repo_id}"}}',
          '',
          '        return await app.ainvoke(',
          '            {"repo_url": repo_url, "tenant_id": tenant_id, "repo_id": repo_id, "fase": "clone"},',
          '            config=config,',
          '            durability="sync",',
          '        )',
          '',
          'async def retomar(repo_id: int, tenant_id: int) -> dict:',
          '    """Retomada: MESMO thread_id e entrada None, continua de onde parou."""',
          '    async with AsyncPostgresSaver.from_conn_string(settings.database_url) as saver:',
          '        app = construir().compile(checkpointer=saver)',
          '        config = {"configurable": {"thread_id": f"ingestao-{tenant_id}-{repo_id}"}}',
          '        return await app.ainvoke(None, config=config)     # None = "continue"'].join('\n') },
        { tipo: 'callout', tom: 'danger', titulo: 'O thread_id é a decisão de design mais importante do bloco', html:
          '<p>Ele identifica <em>o que</em> pode ser retomado. <strong>Aleatório por execução</strong> (<code>uuid4()</code>): nunca retoma, e você pagou por um checkpointer que não serve para nada. <strong>Fixo demais</strong> (só <code>tenant_id</code>): duas ingestões do mesmo cliente colidem e uma sobrescreve o estado da outra. <strong>Certo:</strong> uma chave estável da <em>unidade de trabalho</em>, aqui tenant + repositório (e, se reindexa a mesma coisa várias vezes, tenant + repo + commit).</p>' +
          '<p>Regra: o <code>thread_id</code> deve ser derivável dos parâmetros de entrada, sem consultar nada, senão você não retoma depois de perder o processo que o gerou. Fique bem abaixo de 255 caracteres no PostgresSaver.</p>' },
        { tipo: 'cenario', id: 'b3-cenario', titulo: 'Escolha o thread_id', obrigatorio: false,
          enunciado: 'A ingestão do repositório 7 do tenant 42 caiu no meio. Você precisa retomar amanhã, em outro processo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Como você identificou a thread na primeira execução?', opcoes: [
              { texto: '<code>uuid4()</code> gerado na hora.', vai: 'f-novo', tom: 'ruim', consequencia: 'nada no outro processo sabe esse id.' },
              { texto: 'Só o <code>tenant_id</code>.', vai: 'f-colide', tom: 'ruim', consequencia: 'a ingestão do repo 8 do mesmo tenant usa a mesma thread.' },
              { texto: '<code>ingestao-42-7</code>, derivado da entrada.', vai: 'commit', tom: 'ok', consequencia: 'qualquer processo reconstrói o id sem consultar nada.' }
            ] },
            commit: { texto: 'Você reindexa o mesmo repositório toda semana. Um commit novo chega.', opcoes: [
              { texto: 'Mantém <code>ingestao-42-7</code> e reaproveita o estado da semana passada.', vai: 'f-velho', tom: 'ruim', consequencia: 'a thread já terminou com o commit antigo e devolve resultado velho.' },
              { texto: 'Acrescenta o commit: <code>ingestao-42-7-&lt;commit&gt;</code>.', vai: 'f-bom', tom: 'ok', consequencia: 'cada trabalho distinto tem a sua thread, ainda derivável.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Thread por unidade de trabalho: retoma a que caiu e não confunde reindexações.' },
            'f-novo': { bom: false, texto: 'Cada tentativa é uma thread nova: tudo é refeito e pago de novo.' },
            'f-colide': { bom: false, texto: 'Duas ingestões do mesmo cliente se sobrescrevem.' },
            'f-velho': { bom: false, texto: 'A reindexação devolve o resultado do commit antigo.' }
          },
          callout: 'O id saiu da unidade de trabalho, com o commit quando a reindexação se repete.' },
        { tipo: 'takeaway', html: 'O <mark>thread_id</mark> sai dos parâmetros de entrada: estável, derivável e sem <mark>colisão</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>Os três modos de durabilidade</h3>' +
          '<p>Persistir custa I/O, e você escolhe o ponto na curva. Do mais rápido ao mais durável:</p>' +
          '<table><thead><tr><th>Modo</th><th>Quando persiste</th><th>Custo</th><th>Se o processo morrer</th><th>Use quando</th></tr></thead><tbody>' +
          '<tr><td><code>"exit"</code></td><td>só no fim da execução</td><td>mínimo</td><td><strong>perde tudo</strong></td><td>execução curta e barata de repetir; testes</td></tr>' +
          '<tr><td><code>"async"</code></td><td>a cada passo, sem bloquear</td><td>baixo</td><td>pode perder o último passo</td><td>meio-termo para trabalho longo e tolerante</td></tr>' +
          '<tr><td><code>"sync"</code></td><td>a cada passo, bloqueando até gravar</td><td>maior latência</td><td><strong>não perde nada</strong></td><td>repetir um passo custa dinheiro ou tem efeito colateral</td></tr>' +
          '</tbody></table>' +
          '<p>Para o Capstone: <strong><code>sync</code> na ingestão</strong> (cada nó de análise é uma chamada paga) e <code>async</code> ou <code>exit</code> em consultas interativas curtas. É a decisão de <code>synchronous_commit</code> do Postgres: durabilidade contra latência, por caso de uso.</p>' },
        { tipo: 'rode', id: 'b3-rode', titulo: 'Matar o processo e retomar, com números', enunciado: 'Cinco passos pagos (<code>clone, parse, analisar, consolidar, relatorio</code>). O processo morre antes de <code>analisar</code>. Compare três execuções.',
          prefixo: '$', entrada: 'python3 kill_e_retoma.py', unidade: 'ms', terminalTitulo: 'checkpointer em memória',
          prever: { pergunta: 'Modo sync: morre antes de analisar e retoma na mesma thread. Quantas chamadas pagas no total (antes + depois)?', opcoes: [
            { id: 'a', texto: '10: a retomada refaz tudo', correta: false, porque: 'isso é o que acontece com thread nova ou com durabilidade "exit".' },
            { id: 'b', texto: '5: 2 antes da morte e 3 depois, igual a uma execução única', correta: true, porque: 'clone e parse estão no checkpoint; só analisar, consolidar e relatorio rodam.' },
            { id: 'c', texto: '3: só a retomada conta', correta: false, porque: 'as 2 chamadas antes da morte foram pagas.' }
          ] },
          etapas: [
            { id: 'unica', nome: 'Execução única', descricao: 'Sem morte', tom: 'dns', ms: 1, linhas: [
              L('out', 'chamadas pagas: clone, parse, analisar, consolidar, relatorio'),
              L('hint', 'total = 5 (referência)')] },
            { id: 'sync', nome: 'Kill + retomada (sync)', descricao: 'Mesma thread', tom: 'request', ms: 1, linhas: [
              L('out', 'antes da morte: clone, parse'),
              L('out', 'retomada: analisar, consolidar, relatorio'),
              L('hint', 'total = 2 + 3 = 5, igual à execução única')] },
            { id: 'exit', nome: 'Kill + retomada (exit)', descricao: 'Nada foi gravado', tom: 'response', ms: 1, linhas: [
              L('out', 'antes da morte: clone, parse (perdidos: só gravava no fim)'),
              L('out', 'retomada: clone, parse, analisar, consolidar, relatorio'),
              L('hint', 'total = 2 + 5 = 7: o trabalho pago foi jogado fora')] }
          ],
          tutorDepois: 'A prova do módulo em forma local: a soma das chamadas com retomada é igual à de uma execução única, nunca o dobro. O modo "exit" mostra o preço de não gravar a cada passo.',
          callout: 'Você viu 5 chamadas com sync e 7 com exit.' },
        { tipo: 'complete', id: 'b3-runner', titulo: 'Configurar o runner', obrigatorio: false,
          enunciado: 'Complete a execução e a retomada da ingestão.',
          linguagem: 'python',
          partes: [
            'config = {"configurable": {"thread_id": ',
            { lacuna: 'tid', opcoes: ['f"ingestao-{tenant_id}-{repo_id}"', 'str(uuid.uuid4())', 'str(tenant_id)'], correta: 'f"ingestao-{tenant_id}-{repo_id}"' },
            '}}\n\nawait app.ainvoke(entrada, config=config, durability=',
            { lacuna: 'dur', opcoes: ['"sync"', '"exit"', '"async"'], correta: '"sync"' },
            ')\n\n# depois da queda, em outro processo:\nawait app.ainvoke(',
            { lacuna: 'ret', opcoes: ['None', '{"fase": "clone"}', 'entrada'], correta: 'None' },
            ', config=config)'
          ],
          explicacao: 'Id derivado da unidade de trabalho, <code>sync</code> porque cada passo é pago, e entrada <code>None</code> para "continue de onde parou" na mesma thread.' },
        { tipo: 'takeaway', html: 'Com <mark>sync</mark> e a mesma thread, a soma das chamadas é a de <mark>uma execução única</mark>.' }
      ] },

      { rotulo: 'Replay e time travel', blocos: [
        { tipo: 'callout', tom: 'info', titulo: 'Determinismo, idempotência e o preço da retomada', html:
          '<p>Retomada por replay tem um contrato, o mesmo do Durable Functions e do event sourcing:</p>' +
          '<ul><li><strong>Efeito colateral acontece de novo.</strong> Ao retomar, o runtime reexecuta o nó em andamento <em>desde o começo</em>. Se ele já inseriu no banco, mandou e-mail ou chamou o LLM, isso <strong>se repete</strong>. Antídoto: nó idempotente (<code>ON CONFLICT DO NOTHING</code>, chave de idempotência ou verificação "já fiz?").</li>' +
          '<li><strong>Granularidade é escolha de custo.</strong> Quebre o nó onde o trabalho já feito é caro demais para repetir. Analisar 400 arquivos num nó só é o erro clássico; um nó por arquivo (via <code>Send</code>) é o desenho certo.</li>' +
          '<li><strong>Estado precisa ser serializável.</strong> Conexão, socket, cliente HTTP e <em>lock</em> não vão no estado. Vai o que descreve o trabalho (ids, caminhos, resultados), não o que executa.</li>' +
          '<li><strong>Não determinismo vira divergência.</strong> <code>datetime.now()</code>, <code>random</code> e "leia o diretório atual" dentro do nó fazem o replay divergir. Passe o que varia como entrada (M02: injete o relógio) ou grave no estado na primeira passagem.</li>' +
          '<li><strong>CAP:</strong> o checkpointer é um sistema externo. Com o Postgres indisponível em <code>sync</code>, a execução para (consistência sobre disponibilidade, conscientemente); com <code>async</code>, continua e pode perder o último passo.</li></ul>' },
        { tipo: 'texto', html:
          '<h3>Time travel: inspecionar e reescrever o passado</h3>' +
          '<p>Como o histórico de checkpoints fica gravado, dá para listá-lo, voltar a um ponto e <strong>reexecutar dali com o estado alterado</strong>. É a ferramenta de depuração que sistemas não determinísticos exigem.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'config = {"configurable": {"thread_id": "ingestao-42-7"}}',
          '',
          '# 1) onde está agora',
          'snapshot = await app.aget_state(config)',
          'print(snapshot.values["fase"], snapshot.next)      # próximo nó a executar',
          '',
          '# 2) o histórico inteiro, do mais recente ao mais antigo',
          'async for s in app.aget_state_history(config):',
          '    print(s.config["configurable"]["checkpoint_id"], s.values["fase"], s.next)',
          '',
          '# 3) voltar a um checkpoint específico e seguir dali',
          'antigo = {"configurable": {"thread_id": "ingestao-42-7", "checkpoint_id": "1ef8a...-parse"}}',
          'await app.ainvoke(None, config=antigo)',
          '',
          '# 4) corrigir o estado à mão e continuar (ex.: pular um arquivo problemático)',
          'await app.aupdate_state(config, {"arquivos_pendentes": restantes_sem_o_quebrado})',
          'await app.ainvoke(None, config=config)'].join('\n') },
        { tipo: 'texto', html:
          '<p>Três usos no dia a dia: <strong>depurar</strong> ("em que passo o custo explodiu?"), <strong>corrigir sem reprocessar</strong> (ajustar o estado em vez de rodar 3 horas de novo) e <strong>experimentar</strong> (voltar antes da análise e rodar com outro modelo, comparando com o eval do M06: A/B com o mesmo trabalho de preparação pago uma só vez).</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'E se eu não quiser LangGraph? Temporal e as alternativas', html:
          '<p><strong>Temporal</strong> é a referência de <em>durable execution</em> fora do mundo de IA: serviço que executa workflows com retomada garantida, timers duráveis, retry por atividade e visibilidade. Mais robusto e mais pesado (infraestrutura a operar, não biblioteca). Outras vias: <strong>fila com estado no banco</strong> (basta para pipelines simples; o custo é reimplementar retomada e HITL) e <strong>Prefect/Dagster</strong> (orientados a dados, ótimos para ETL, menos naturais para ramificação por decisão de LLM).</p>' +
          '<p>Critério: biblioteca com HITL e progresso nativos (nada a operar) contra serviço dedicado quando os workflows durarem dias. Registre num ADR; a decisão inversa (Temporal) é defensável se o produto crescer para workflows de dias.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Sintomas e conserto', html:
          '<ul><li><strong>Retomar reexecuta tudo do zero:</strong> <code>thread_id</code> diferente a cada tentativa (uuid) ou <code>durability="exit"</code>. Conserto: id derivável da entrada e <code>sync</code> quando o passo custa dinheiro.</li>' +
          '<li><strong>Retomada duplica trabalho pago (2x as chamadas):</strong> nó não idempotente reexecutando desde o começo. Conserto: guarda "já fiz?", <code>ON CONFLICT</code>, chave de idempotência, e quebre nós grandes.</li></ul>' },
        { tipo: 'takeaway', html: 'Retomada é <mark>replay</mark>: nó <mark>idempotente</mark>, determinístico e pequeno o bastante para não doer.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b3-python', titulo: 'Checkpointer mínimo', obrigatorio: false,
          enunciado: 'Implemente <code>thread_id(tenant_id, repo_id, commit=None)</code> e <code>executar(...)</code>: pule passos já gravados na thread, simule a morte antes de <code>morrer_antes</code> e respeite a durabilidade (<code>"sync"</code> grava a cada passo; <code>"exit"</code> só no fim).',
          codigo: codigoCk, testes: testesCk,
          dica: 'Use <code>feitos = store.setdefault(thread, {})</code>. No laço: <code>continue</code> se o nome já está em <code>feitos</code>; levante <code>Morte</code> antes de chamar; em "sync" grave em <code>feitos</code>, em "exit" guarde num buffer e faça <code>feitos.update(buffer)</code> depois do laço. O id: <code>"ingestao-" + tenant + "-" + repo</code>, mais o commit se houver.',
          solucao: solucaoCk,
          tutorDepois: 'O teste do modo "exit" documenta o prejuízo: 7 chamadas pagas contra 5.',
          callout: 'Retomada sem repetir chamadas passou nos testes, com os dois modos.' },
        { tipo: 'escolha', id: 'b3-esc-dur', titulo: 'Confira: durabilidade',
          pergunta: 'Na ingestão do Capstone, cada nó de análise é uma chamada paga. Qual modo o bloco recomenda?',
          opcoes: [
            { id: 'a', texto: '<code>"exit"</code>: persiste só no fim, o mais barato.', correta: false, porque: 'perde tudo se o processo morrer.' },
            { id: 'b', texto: '<code>"sync"</code>: persiste a cada passo e bloqueia até gravar, porque repetir um passo custa dinheiro.', correta: true, porque: 'async pode perder o último passo, aceitável só em trabalho tolerante.' },
            { id: 'c', texto: '<code>"async"</code>: nunca perde nada porque não bloqueia.', correta: false, porque: 'não bloquear é exatamente o que permite perder o último passo.' },
            { id: 'd', texto: 'Qualquer um, se o nó for idempotente.', correta: false, porque: 'idempotência evita efeito duplicado, mas não devolve o dinheiro da chamada já paga.' }
          ], tutorDepois: 'Mesmo trade-off de synchronous_commit.' },
        { tipo: 'escolha', id: 'b3-esc-dup', titulo: 'Confira: a conta dobrou',
          pergunta: 'Depois de uma queda, a retomada fez o dobro de chamadas pagas. A thread é estável e o modo é <code>sync</code>. Qual a causa mais provável?',
          opcoes: [
            { id: 'a', texto: 'Um nó grande e não idempotente reexecutou desde o começo, repetindo chamadas que já tinha feito.', correta: true, porque: 'conserto: quebrar o nó (um por arquivo via Send) e adicionar guarda "já fiz?" ou chave de idempotência.' },
            { id: 'b', texto: 'O checkpointer não foi inicializado.', correta: false, porque: 'sem checkpointer nada retomaria.' },
            { id: 'c', texto: 'O thread_id é muito curto.', correta: false, porque: 'o tamanho não causa repetição.' }
          ], tutorDepois: 'Retomada por replay exige nó pequeno e idempotente.' },
        { tipo: 'takeaway', html: 'Prove a retomada com <mark>números</mark>: a soma deve ser a de <mark>uma execução</mark>.' }
      ] }
    ]
  });
})();
