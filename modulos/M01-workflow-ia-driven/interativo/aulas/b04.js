/* M01 · Bloco 4: decomposição, worktrees e integração por waves. Fonte: M01.html#b04. Saídas do rode: execução real do lab (test_workspace, contract_integration_gate, assess_parallelism). Fontes técnicas verificadas em 14/08/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasWorktree = function () {
    return [
      { id: 'testes', nome: 'A suíte do workspace', descricao: 'seis testes no sandbox Git', tom: 'dns', ms: 6, linhas: [
        L('cmd', 'python -m unittest tests.test_workspace -v'),
        L('out', 'test_clean_textual_merge_can_fail_semantic_gate ... ok'),
        L('out', 'test_dirty_worktree_cleanup_is_refused ... ok'),
        L('out', 'test_parallelism_considers_contracts_and_resources ... ok'),
        L('out', 'test_path_escape_is_rejected ... ok'),
        L('out', 'test_real_git_worktrees_merge_cleanly_and_cleanup_safely ... ok'),
        L('out', 'test_write_set_detects_extra_file ... ok'),
        L('in', 'Ran 6 tests: OK'),
        L('hint', 'o repositório e as worktrees reais vivem num TemporaryDirectory marcado como do lab; seu repositório não é tocado')] },
      { id: 'merges', nome: 'Dois workers, dois merges', descricao: 'Arquivos diferentes', tom: 'tcp', ms: 2, linhas: [
        L('info', 'worktree producer: commit de producer.txt  ->  amount=120'),
        L('info', 'worktree consumer: commit de consumer.txt  ->  limit=110'),
        L('cmd', 'sandbox.merge("producer"); sandbox.merge("consumer")'),
        L('in', 'merge textual limpo nas duas vezes (nenhum conflito do Git)'),
        L('hint', 'cada worker passa no gate local contra a base; o Git não vê nenhum problema')] },
      { id: 'gate', nome: 'Gate global', descricao: '120 contra 110', tom: 'request', ms: 1, linhas: [
        L('cmd', 'contract_integration_gate(produced_amount=120, consumer_limit=110)'),
        L('out', "IntegrationResult(textual_merge_clean=True, semantic_gate_passed=False,"),
        L('out', "                  detail='produtor emitiu 120; consumidor aceita no máximo 110')"),
        L('hint', 'merge limpo não é comportamento compatível: só o gate global pega este conflito')] },
      { id: 'paralelismo', nome: 'Pode paralelizar?', descricao: 'Mesmo contrato nos dois', tom: 'tls', ms: 1, linhas: [
        L('cmd', 'assess_parallelism(WorkUnit("a", {"a.py"}, {"api-v1"}, {}), WorkUnit("b", {"b.py"}, {"api-v1"}, {}))'),
        L('out', "ParallelDecision(safe=False, reasons=('shared_contract',))"),
        L('hint', 'write sets disjuntos (a.py, b.py) e mesmo assim não é seguro: ambos tocam o contrato api-v1')] },
      { id: 'limpeza', nome: 'Limpeza recusada', descricao: 'Worktree suja', tom: 'response', ms: 1, linhas: [
        L('info', 'um arquivo não rastreado é criado na worktree "dirty"'),
        L('cmd', 'sandbox.remove(tree)'),
        L('out', 'RuntimeError: cleanup recusado: worktree possui mudanças'),
        L('hint', 'sem git add -A e sem remoção forçada: o sandbox prefere recusar a perder trabalho')] }
    ];
  };

  var codigoPar = String.raw`def avaliar_paralelismo(a, b):
    """a e b: dicts com name, write_set, contracts, resources, depends_on (conjuntos).

    Devolve (seguro, razoes) com as razoes na ordem:
    write_set_overlap, shared_contract, shared_resource, dependency_edge.
    """
    razoes = []
    if a["write_set"] & b["write_set"]:
        razoes.append("write_set_overlap")
    # 1. contratos em comum -> "shared_contract"
    # 2. recursos em comum (banco, porta, lockfile, cache) -> "shared_resource"
    # 3. um depende do outro (pelo name em depends_on) -> "dependency_edge"
    return (not razoes, tuple(razoes))


def gate_global(produzido, limite):
    """Depois de merges textuais limpos: devolve (gate_passou, detalhe)."""
    return True, "contrato compatível"


A = {"name": "a", "write_set": {"a.py"}, "contracts": {"api-v1"}, "resources": set(), "depends_on": set()}
B = {"name": "b", "write_set": {"b.py"}, "contracts": {"api-v1"}, "resources": set(), "depends_on": set()}
print(avaliar_paralelismo(A, B))
print(gate_global(120, 110))
`;
  var testesPar = String.raw`def U(nome, w=(), c=(), r=(), d=()):
    return {"name": nome, "write_set": set(w), "contracts": set(c), "resources": set(r), "depends_on": set(d)}


def test_disjuntos_e_independentes_sao_seguros():
    assert avaliar_paralelismo(U("a", w=["a.py"]), U("b", w=["b.py"])) == (True, ())


def test_write_sets_disjuntos_nao_bastam_contrato_compartilhado():
    ok, razoes = avaliar_paralelismo(U("a", ["a.py"], ["api-v1"]), U("b", ["b.py"], ["api-v1"]))
    assert ok is False and razoes == ("shared_contract",)


def test_recurso_compartilhado_bloqueia():
    ok, razoes = avaliar_paralelismo(U("a", r=["db"]), U("b", r=["db"]))
    assert ok is False and razoes == ("shared_resource",)


def test_dependencia_bloqueia_nos_dois_sentidos():
    assert avaliar_paralelismo(U("a"), U("b", d=["a"])) == (False, ("dependency_edge",))
    assert avaliar_paralelismo(U("a", d=["b"]), U("b")) == (False, ("dependency_edge",))


def test_varias_razoes_na_ordem_do_contrato():
    ok, razoes = avaliar_paralelismo(
        U("a", ["x.py"], ["c"], ["db"], ["b"]), U("b", ["x.py"], ["c"], ["db"]))
    assert razoes == ("write_set_overlap", "shared_contract", "shared_resource", "dependency_edge")


def test_gate_global_pega_120_contra_110():
    ok, detalhe = gate_global(120, 110)
    assert ok is False and "120" in detalhe and "110" in detalhe


def test_gate_global_aceita_compativel_e_o_limite_exato():
    assert gate_global(100, 110) == (True, "contrato compatível")
    assert gate_global(110, 110)[0] is True
`;
  var solucaoPar = String.raw`def avaliar_paralelismo(a, b):
    razoes = []
    if a["write_set"] & b["write_set"]:
        razoes.append("write_set_overlap")
    if a["contracts"] & b["contracts"]:
        razoes.append("shared_contract")
    if a["resources"] & b["resources"]:
        razoes.append("shared_resource")
    if a["name"] in b["depends_on"] or b["name"] in a["depends_on"]:
        razoes.append("dependency_edge")
    return (not razoes, tuple(razoes))


def gate_global(produzido, limite):
    if produzido <= limite:
        return True, "contrato compatível"
    return False, f"produtor emitiu {produzido}; consumidor aceita no máximo {limite}"
`;
  var codigoAmdahl = String.raw`def compensa(n, t, r, c):
    """Modelo didático: n workers implementam em paralelo (t min cada), mas a SUA revisão
    (r min por tarefa) e a integração continuam sequenciais, e cada par de workers
    cria uma fronteira a coordenar (c min por par, n*(n-1)/2 pares).

    Devolve (serial, paralelo, ganho, gargalo); ganho arredondado a 2 casas;
    gargalo é "revisao" se n*r >= t e "implementacao" no caso contrário.
    """
    serial = 0    # n tarefas, uma depois da outra: n * (t + r)
    paralelo = 0  # t + n*r + coordenação
    ganho = 0.0
    gargalo = ""
    return serial, paralelo, ganho, gargalo


print(compensa(3, 60, 20, 5))
`;
  var testesAmdahl = String.raw`def test_tres_workers_cenario_padrao():
    assert compensa(3, 60, 20, 5) == (240, 135, 1.78, "revisao")


def test_um_worker_nao_ganha_nada():
    serial, paralelo, ganho, _ = compensa(1, 60, 20, 5)
    assert serial == paralelo == 80 and ganho == 1.0


def test_paralelizar_pode_piorar():
    serial, paralelo, ganho, gargalo = compensa(8, 10, 60, 20)
    assert serial == 560 and paralelo == 1050 and ganho < 1 and gargalo == "revisao"


def test_implementacao_longa_e_o_gargalo():
    assert compensa(2, 120, 5, 0)[3] == "implementacao"


def test_a_coordenacao_cresce_com_os_pares():
    base = compensa(5, 60, 10, 0)[1]
    com = compensa(5, 60, 10, 5)[1]
    assert com - base == 5 * 10
`;
  var solucaoAmdahl = String.raw`def compensa(n, t, r, c):
    serial = n * (t + r)
    paralelo = t + n * r + c * n * (n - 1) // 2
    ganho = round(serial / paralelo, 2)
    gargalo = "revisao" if n * r >= t else "implementacao"
    return serial, paralelo, ganho, gargalo
`;

  TrilhaAula.registrar({
    id: 'm01-b4',
    titulo: 'Decomposição, worktrees e integração por waves',
    minutos: 35,
    resumo: 'Isolamento de processo não prova independência. Paralelize quando DAG, contratos, recursos e read/write sets mostrarem independência, e confirme no gate global, porque merge limpo não é integração correta.',
    objetivo: 'Decidir com o checklist se duas tarefas podem rodar em paralelo, estimar o ganho com Amdahl e custo de coordenação, desenhar orquestrador, workers e waves e explicar por que worktrees isolam diretórios, não semântica.',
    revisao: [
      { id: 'm01b4-merge', pergunta: 'Duas branches mexem em arquivos diferentes, os merges são limpos e cada gate local passa. Isso garante integração correta?',
        opcoes: [
          opc('a', 'Não: contratos, schema, banco, cache ou portas compartilhados podem tornar o resultado incompatível; só o gate global na integração verifica isso', true, 'write sets disjuntos são necessários em muitos casos, mas não bastam. O caso 120 × 110 do lab é exatamente esse.'),
          opc('b', 'Sim: write sets disjuntos eliminam qualquer conflito', false, 'worktree isola diretório, não banco, porta, lockfile nem comportamento.'),
          opc('c', 'Sim, desde que o Git não reporte conflito', false, 'merge textual limpo não é comportamento compatível.')] },
      { id: 'm01b4-amdahl', pergunta: 'Você coordena 5 agentes, mas é a única pessoa que revisa os diffs. Qual a leitura correta?',
        opcoes: [
          opc('a', 'A fração sequencial (sua revisão e consolidação) limita o ganho; paralelize também a verificação e comece com poucos workers', true, 'Lei de Amdahl com agentes: o gargalo é a revisão; 5 workers = 10 fronteiras a coordenar.'),
          opc('b', 'O tempo total cai quase 5 vezes', false, 'a revisão sequencial limita o ganho.'),
          opc('c', 'Basta usar tmux para observar os agentes', false, 'tmux ajuda a observar, não muda o gargalo.')] },
      { id: 'm01b4-conflito', pergunta: 'Duas features precisam alterar o mesmo router. Qual a estratégia preferida?',
        opcoes: [
          opc('a', 'Re-decompor: extrair a fundação compartilhada para uma wave anterior e manter o restante independente', true, 'a ordem é re-decompor, contrato primeiro, integrar sequencialmente; em todas, o gate global continua obrigatório.'),
          opc('b', 'Deixar os dois workers editarem e confiar no merge textual', false, 'merge textual não preserva semântica.'),
          opc('c', 'Pedir ao agente que "resolva os conflitos com cuidado"', false, 'é pedido probabilístico, sem gate.')] },
      { id: 'm01b4-checklist', pergunta: 'Duas tarefas têm write sets disjuntos. Isso basta para paralelizá-las?',
        opcoes: [
          opc('a', 'Não: compare também read sets, contratos públicos, schema, lockfile, banco, cache, porta, fila e dependências entre as tarefas', true, 'write sets disjuntos são necessários em muitos casos, mas não bastam; o checklist ainda exige contrato, condição de parada, gate de worker mais gate global e custo que compense.'),
          opc('b', 'Sim: se nenhum arquivo é comum, não há como colidir', false, 'conflitos também surgem por contrato e por recurso externo.'),
          opc('c', 'Sim, desde que cada worker tenha a janela de contexto maior possível', false, 'janela maior não corrige objetivo mal definido nem estado compartilhado.')] },
      { id: 'm01b4-worktree', pergunta: 'O que um git worktree isola?',
        opcoes: [
          opc('a', 'Working tree, HEAD e índice; objetos, refs e partes da configuração continuam compartilhados', true, 'isola arquivos, não serviços nem semântica.'),
          opc('b', 'O banco de dados, as portas e o cache do projeto', false, 'isso continua compartilhado se o projeto não isolar explicitamente.'),
          opc('c', 'O contrato entre os módulos que os workers tocam', false, 'o contrato é semântica, que só o gate global verifica.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Mais agentes, mais colisões</h3>' +
          '<p>Um host pode executar uma ou várias unidades de trabalho, mas <strong>isolamento de processo não prova independência</strong>. O ganho aparece quando tarefas, contratos e recursos deixam de competir entre si. Enquanto o worker A implementa uma mudança de autenticação, o B escreve testes de billing e o C atualiza documentação, alguém ainda precisa manter a base estável, integrar e julgar o resultado. Paralelismo mal modelado aumenta colisões e retrabalho. Este bloco constrói o critério para decidir quando a execução simultânea ajuda.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fundamento de engenharia: concorrência decide se isso funciona', html:
          '<p>É teoria clássica de concorrência aplicada a um novo tipo de worker. Quatro peças:</p>' +
          '<ul><li><strong>Concorrência ≠ paralelismo.</strong> Concorrência estrutura tarefas que podem progredir independentemente; paralelismo executa algumas simultaneamente. Decomposição, integração e revisão frequentemente dominam o ganho, por isso precisam ser medidas.</li>' +
          '<li><strong>Estado compartilhado mutável exige coordenação.</strong> Dois agentes editando o mesmo arquivo lembram uma race condition, mas conflitos também surgem por contrato e por recurso externo. As opções: sequenciar, isolar, tornar as alterações aditivas ou estabilizar a interface numa wave anterior.</li>' +
          '<li><strong>Lei de Amdahl.</strong> O ganho do paralelismo é limitado pela fração sequencial. Com agentes, ela é a sua revisão e a consolidação dos merges: cinco agentes gerando código que você revisa sozinho têm você como gargalo. Paralelize também a verificação (testes, gates do bloco 2) ou o paralelismo é ilusão.</li>' +
          '<li><strong>Custo de coordenação cresce com o quadrado dos participantes</strong> (Brooks). 2 workers = 1 fronteira; 5 workers = 10. Comece com 2.</li></ul>' },
        { tipo: 'texto', html:
          '<h3>Quando paralelizar: o checklist honesto</h3>' +
          '<p>Paralelize quando <em>todas</em> estas condições valem:</p>' +
          '<ol><li><strong>As tarefas não compartilham estado relevante.</strong> Write sets disjuntos são necessários em muitos casos, mas não bastam. Compare também read sets, contratos públicos, schema, lockfile, banco, cache, porta, fila, rate limit e dependências entre tarefas.</li>' +
          '<li><strong>Cada tarefa tem contrato suficiente e condição de parada.</strong> Se surgir ambiguidade que altera produto ou contrato compartilhado, o worker pausa e devolve um handoff; não decide sozinho para manter o paralelismo aparente.</li>' +
          '<li><strong>Cada tarefa tem gate de worker e existe gate global.</strong> "Terminou localmente" não significa "integrou": cada branch pode passar contra a base e falhar quando os dois novos comportamentos se encontram.</li>' +
          '<li><strong>O custo compensa.</strong> Paralelizar duas tarefas de 10 minutos é overhead puro. Paralelize blocos de 30 a 60 minutos ou mais de trabalho de agente.</li></ol>' },
        { tipo: 'texto', html:
          '<h3>Orquestrador, workers e waves</h3>' +
          '<p>Um padrão frequente de orquestração tem três papéis. Produtos automatizam isso de formas diferentes; o contrato não depende dessa automação.</p>' },
        { tipo: 'abas', rotulo: 'Os três papéis', itens: [
          { rotulo: 'Orquestrador', blocos: [{ tipo: 'texto', html: '<p>A sessão principal, de contexto caro: decompõe a tarefa, escreve e distribui as specs, dispara os workers e consolida os resultados. <strong>Não implementa nada</strong>: implementar sujaria o contexto que precisa ficar limpo para julgar os resultados.</p>' }] },
          { rotulo: 'Workers', blocos: [{ tipo: 'texto', html: '<p>Subagentes ou sessões paralelas, de contexto descartável: recebem uma spec fechada, implementam, rodam o gate e devolvem um <strong>relatório compacto</strong> (fator 9), não o diff inteiro, que estouraria o contexto do orquestrador.</p>' }] },
          { rotulo: 'Consolidador', blocos: [{ tipo: 'texto', html: '<p>O orquestrador de chapéu trocado, ou você: merge das branches, resolução de conflito e gate final na integração.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<p>Em tarefas grandes, os workers rodam em <strong>waves</strong> (ondas): <strong>wave 1</strong> são as fundações compartilhadas (schemas, contratos), sequenciais porque tudo depende delas; <strong>wave 2</strong> são as features em paralelo sobre a fundação; <strong>wave 3</strong> é integração e polimento. É o raciocínio do grafo de dependências de um build: paraleliza-se o que está no mesmo nível do grafo.</p>' },
        { tipo: 'takeaway', html: 'O ganho do paralelismo é limitado pela <mark>sua revisão</mark> e pela <mark>coordenação</mark>; comece com <mark>dois</mark> workers.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'callout', tom: 'info', titulo: 'O que é git worktree', html:
          '<p><code>git worktree</code> mantém árvores de trabalho ligadas ao mesmo repositório. Cada árvore tem working tree, HEAD e índice próprios, mas objetos, refs e partes da configuração continuam compartilhados. Cada tarefa edita a sua cópia, e a integração acontece por merge e testes. Isso isola <em>arquivos</em>; não isola serviços nem semântica: banco, portas e outros recursos externos continuam compartilhados se o projeto não os isolar explicitamente.</p>' +
          '<p>O laboratório centraliza o Git com argv tokenizado, stage explícito e paths resolvidos sob uma pasta temporária marcada como pertencente ao lab.</p>' },
        { tipo: 'texto', html:
          '<h3>O cenário que o laboratório executa</h3>' +
          '<p>O lab cria um repositório Git real somente dentro de um diretório temporário marcado como próprio. Duas worktrees alteram arquivos diferentes: uma produz <code>amount=120</code>; a outra consome <code>limit=110</code>. Os merges são textualmente limpos. O gate global lê os dois valores e falha porque o contrato compartilhado é incompatível. A limpeza também recusa uma worktree suja. Você observa três distinções: <strong>isolamento de diretório</strong>, <strong>integração textual</strong> e <strong>compatibilidade semântica</strong>.</p>' +
          '<p><strong>Limite:</strong> worktree não isola banco, porta, cache, lockfile nem contrato. O experimento prova a segurança do sandbox Git do lab; não prova que qualquer paralelismo de produção é seguro. Git instalado é pré-requisito; não há substituto simulado.</p>' },
        { tipo: 'rode', id: 'm01b4-rode', titulo: 'Merge limpo, integração quebrada', enunciado: 'Rode a suíte do workspace e leia cada etapa. Saídas reais do laboratório.',
          prefixo: '$', entrada: 'python -m unittest tests.test_workspace -v', unidade: 'testes', terminalTitulo: 'lab M01', etapas: etapasWorktree(),
          prever: { pergunta: 'Os dois merges (amount=120 e limit=110) saem limpos e cada worker passou no gate local. O gate global passa?', opcoes: [
            { id: 'a', texto: 'Sim: se o Git não acusou conflito, a integração está correta.', correta: false, porque: 'o Git só enxerga texto, não o contrato entre produtor e consumidor.' },
            { id: 'b', texto: 'Não: o produtor emite 120 e o consumidor aceita no máximo 110; só o gate global vê isso.', correta: true, porque: 'merge textual limpo é diferente de comportamento compatível.' },
            { id: 'c', texto: 'Depende do número de worktrees.', correta: false, porque: 'duas worktrees bastam para o conflito semântico.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em "Gate global" e depois em "Pode paralelizar?".',
          tutorDepois: 'Isolamento de diretório (as duas worktrees), integração textual (merges limpos) e compatibilidade semântica (120 contra 110) são três coisas distintas. Write sets disjuntos não bastaram: o contrato <code>api-v1</code> compartilhado já tornava o paralelismo inseguro.',
          callout: 'Você viu o merge limpo e o gate global reprovar a mesma integração.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Multi-sessão com tmux: quando você verá isso', html:
          '<p><code>tmux</code> é um multiplexador de terminal: uma tela dividida em painéis, cada um com um shell persistente que sobrevive à desconexão (como várias janelas do Windows Terminal que continuam rodando quando você fecha o notebook). Times que rodam 4 ou mais agentes usam tmux para observá-los lado a lado. Não é pré-requisito do curso, e dois terminais comuns bastam aqui, mas você vai esbarrar no nome em todo post sobre "agent farm". Para experimentar: <code>tmux</code>; <code>Ctrl-b %</code> divide na vertical; <code>Ctrl-b</code> + setas navega; <code>tmux attach</code> reconecta.</p>' },
        { tipo: 'takeaway', html: 'Worktree isola <mark>diretório</mark>, não banco, porta, contrato nem comportamento: <mark>merge limpo</mark> não é <mark>integração correta</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Duas funções do lab, de novo em código</h3>' +
          '<p>Primeiro a decisão de paralelismo, que olha mais que arquivos, e o gate que roda depois do merge. Depois o modelo de custo do simulador do módulo: o que o paralelismo ganha e o que a revisão e a coordenação tiram.</p>' },
        { tipo: 'python', id: 'm01b4-python', titulo: 'Decida se pode paralelizar', obrigatorio: false,
          enunciado: 'Complete <code>avaliar_paralelismo(a, b)</code>: além de write sets, olhe contratos, recursos e dependência entre as unidades (<code>depends_on</code> guarda nomes). Devolva <code>(seguro, razoes)</code>. Complete também <code>gate_global(produzido, limite)</code>: compatível quando o produzido não passa do limite.',
          codigo: codigoPar, testes: testesPar,
          dica: 'Interseção de conjuntos com <code>&amp;</code>. Dependência pode estar em qualquer sentido: o nome de uma unidade em <code>depends_on</code> da outra. No gate, a mensagem de falha cita os dois números.',
          solucao: solucaoPar,
          tutorDepois: 'Repare que o par com write sets disjuntos e o mesmo contrato volta inseguro: "disjunto" é necessário, não suficiente. O gate global aceita o limite exato (110 contra 110) e reprova 120.',
          callout: 'Decisão de paralelismo e gate global implementados: contrato e recurso contam tanto quanto arquivo.' },
        { tipo: 'python', id: 'm01b4-python-amdahl', titulo: 'O paralelismo compensa?', obrigatorio: false,
          enunciado: 'Implemente <code>compensa(n, t, r, c)</code>: sequencial = <code>n·(t + r)</code>; paralelo = <code>t + n·r + c·n(n−1)/2</code> (implementação paralela, revisão e integração sequenciais, mais coordenação por par). Devolva <code>(serial, paralelo, ganho, gargalo)</code>. Modelo didático, não medição.',
          codigo: codigoAmdahl, testes: testesAmdahl,
          dica: 'Número de pares: <code>n * (n - 1) // 2</code>. O gargalo é a revisão quando <code>n * r &gt;= t</code>.',
          solucao: solucaoAmdahl,
          tutorDepois: 'Com 8 workers, implementação de 10 min e revisão de 60, paralelizar leva 1050 min contra 560 em sequência: o ganho fica abaixo de 1. A fração sequencial (você) e as 28 fronteiras comem tudo.',
          callout: 'O modelo de custo mostra quando paralelizar piora: revisão e coordenação dominam.' },
        { tipo: 'texto', html:
          '<h3>Quando as specs não conseguem ser disjuntas</h3>' +
          '<p>Duas features precisam mexer no mesmo <code>router.py</code>. Três estratégias, em ordem de preferência:</p>' +
          '<ol><li><strong>Re-decompor:</strong> extrair a fundação compartilhada para uma wave anterior e manter as partes seguintes independentes quando isso reduzir o risco total.</li>' +
          '<li><strong>Contrato primeiro:</strong> estabilizar assinatura, schema e testes de compatibilidade na wave 1; mudanças aditivas reduzem algumas colisões, mas ainda exigem gate global.</li>' +
          '<li><strong>Integrar sequencialmente:</strong> mergear uma unidade, atualizar a base da seguinte, resolver com as duas specs e executar toda a suíte. O agente pode propor a resolução; o orquestrador revisa sem assumir que o merge textual preservou a semântica.</li></ol>' },
        { tipo: 'cenario', id: 'm01b4-cenario', titulo: 'Dois workers, o mesmo router', obrigatorio: false,
          enunciado: 'As features "extrato" e "limite" precisam alterar o mesmo router. Escolha como organizar o trabalho e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Os write sets se sobrepõem em router.py e os dois workers estão prontos para começar. O que você faz?', opcoes: [
              { texto: 'Deixo os dois editarem e confio no merge textual.', vai: 'f-merge', tom: 'ruim', consequencia: 'o merge pode sair limpo e a semântica quebrar; o problema só aparece tarde.' },
              { texto: 'Rodo tudo em paralelo e descubro os problemas depois.', vai: 'f-depois', tom: 'ruim', consequencia: 'você paga a coordenação e o retrabalho no fim, sem fronteira definida.' },
              { texto: 'Re-decomponho: extraio a fundação do router para a wave 1 e mantenho as features independentes na wave 2.', vai: 'wave', tom: 'ok', consequencia: 'a parte compartilhada passa a ser sequencial e estável.' }
            ] },
            wave: { texto: 'A wave 1 estabilizou o contrato do router e as duas features rodam em paralelo. O que valida a entrega no fim?', opcoes: [
              { texto: 'O gate de cada worker, já que cada um passou.', vai: 'f-local', tom: 'ruim', consequencia: '"Terminou localmente" não significa "integrou".' },
              { texto: 'O gate de cada worker e o gate global na integração, rodando a suíte inteira.', vai: 'f-bom', tom: 'ok', consequencia: 'o conflito semântico, se houver, aparece no gate global, antes de produção.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Fundação estabilizada na wave 1, features em paralelo e gate global na integração: o custo de coordenação foi pago onde compensa.' },
            'f-merge': { bom: false, texto: 'Merge limpo, comportamento incompatível: o 120 contra 110 do laboratório, agora em produção.' },
            'f-depois': { bom: false, texto: 'Colisões em série, retrabalho e nenhum critério de parada.' },
            'f-local': { bom: false, texto: 'Dois gates verdes e uma integração vermelha: o gate global faltou.' }
          },
          callout: 'Você estabilizou a fundação primeiro e validou a integração no gate global.' },
        { tipo: 'takeaway', html: 'Re-decomponha em <mark>waves</mark>, estabilize o <mark>contrato</mark> primeiro e rode o <mark>gate global</mark> na integração.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'm01b4-esc-merge', titulo: 'Confira: merges limpos',
          pergunta: 'Duas branches mexem em arquivos diferentes, os merges são limpos e cada gate local passa. Isso garante integração correta?',
          opcoes: [
            { id: 'a', texto: 'Sim: write sets disjuntos eliminam qualquer conflito.', correta: false, porque: 'disjuntos são necessários em muitos casos, mas não bastam.' },
            { id: 'b', texto: 'Sim, desde que o Git não reporte conflito.', correta: false, porque: 'o Git só enxerga texto.' },
            { id: 'c', texto: 'Não: contratos, schema, banco, cache ou portas compartilhados podem tornar o resultado incompatível; só o gate global na integração verifica isso.', correta: true, porque: 'worktree isola diretório, não banco, porta, lockfile nem comportamento. O 120 × 110 do lab é esse caso.' },
            { id: 'd', texto: 'Não, mas só se houver mais de três worktrees.', correta: false, porque: 'duas worktrees já bastam.' }
          ], tutorDepois: 'Merge textual limpo e comportamento compatível são perguntas diferentes.' },
        { tipo: 'escolha', id: 'm01b4-esc-amdahl', titulo: 'Confira: cinco agentes e um revisor',
          pergunta: 'Você coordena 5 agentes, mas é a única pessoa que revisa os diffs. Qual a leitura correta?',
          opcoes: [
            { id: 'a', texto: 'O tempo total cai quase 5 vezes.', correta: false, porque: 'a parte sequencial limita o ganho.' },
            { id: 'b', texto: 'A fração sequencial (sua revisão e consolidação) limita o ganho; paralelize também a verificação e comece com poucos workers.', correta: true, porque: 'Lei de Amdahl com agentes: o gargalo é a revisão, e 5 workers criam 10 fronteiras a coordenar.' },
            { id: 'c', texto: 'Mais workers sempre reduz o custo de coordenação.', correta: false, porque: 'a coordenação cresce com o número de pares.' },
            { id: 'd', texto: 'Basta usar tmux.', correta: false, porque: 'tmux só ajuda a observar; não muda o gargalo.' }
          ], tutorDepois: 'Paralelize a verificação junto com a implementação, ou o paralelismo é ilusão.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes técnicas (manual do <code>git worktree</code>) verificadas em 14/08/2026; o laboratório exige Git instalado. Os números do simulador são modelo didático, não medição de produtividade.</p>' },
        { tipo: 'takeaway', html: 'O gargalo é a <mark>sua revisão</mark>: <mark>verificação paralela</mark> e poucos workers vêm antes de mais agentes.' }
      ] }
    ]
  });
})();
