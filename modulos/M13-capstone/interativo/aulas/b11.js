/* M13 · Bloco 11: evals, métricas e gate de regressão. Fonte: M13.html#h-b11. Saídas do rode são a execução registrada no bloco (evidence/m13/B11). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoGate = String.raw`REGRESSION_BUDGET = 0.05

def gate(current, baseline, budget=REGRESSION_BUDGET):
    # LACUNA: devolva a lista de violacoes (vazia = PASS).
    # Compare so as metricas; o campo "passed" do relatorio NAO conta.
    return [] if current.get("passed") else ["reprovado"]
`;
  var solucaoGate = String.raw`REGRESSION_BUDGET = 0.05

def gate(current, baseline, budget=REGRESSION_BUDGET):
    violations = []
    for name, base in baseline["metrics"].items():
        if name not in current["metrics"]:
            violations.append(name + ": metrica ausente")
            continue
        drop = base - current["metrics"][name]
        if drop > budget + 1e-12:
            violations.append(name + ": caiu " + format(drop, ".2f") + " (budget " + format(budget, ".2f") + ")")
    return violations
`;
  var testesGate = String.raw`BASE = {"metrics": {"golden_f1": 0.80, "abstention_acc": 1.0, "injection_resist": 1.0}}

def test_igual_ao_baseline_passa():
    assert gate({"metrics": dict(BASE["metrics"])}, BASE) == []

def test_queda_dentro_do_budget_passa():
    cur = {"metrics": {"golden_f1": 0.76, "abstention_acc": 1.0, "injection_resist": 1.0}}
    assert gate(cur, BASE) == []

def test_regressao_semeada_reprova():
    cur = {"metrics": {"golden_f1": 0.60, "abstention_acc": 1.0, "injection_resist": 1.0}}
    v = gate(cur, BASE)
    assert len(v) == 1 and v[0].startswith("golden_f1")

def test_veredito_derivado_ignora_flag_passed():
    forjado = {"passed": True, "metrics": {"golden_f1": 0.0, "abstention_acc": 0.0, "injection_resist": 0.0}}
    assert len(gate(forjado, BASE)) == 3

def test_metrica_ausente_reprova():
    cur = {"metrics": {"golden_f1": 0.80, "abstention_acc": 1.0}}
    assert gate(cur, BASE) == ["injection_resist: metrica ausente"]
`;

  TrilhaAula.registrar({
    id: 'm13-b11',
    titulo: 'Evals: datasets versionados, métricas e gate de regressão',
    minutos: 30,
    resumo: 'Avaliar uma vez e anunciar "funcionou" é anedota. Eval sério tem dataset versionado, métrica derivada da execução e um gate que compara com um baseline e lista as violações.',
    objetivo: 'Explicar as três partes duras de um eval, por que o veredito é derivado das métricas e nunca lido de um campo <code>passed</code>, e por que o baseline é artefato versionado.',
    revisao: [
      { id: 'm13b11-partes', pergunta: 'Quais são as três partes duras de um eval sério neste bloco?',
        opcoes: [
          opc('a', 'Dataset versionado como dado, métrica derivada da execução e gate de regressão contra baseline', true, 'cada dataset tem <code>name</code>, <code>version</code> e <code>kind</code> validados na carga; o gate devolve a lista de violações.'),
          opc('b', 'Um juiz de LLM, um prompt e um relatório', false, 'o bloco não usa juiz de LLM: a rubrica é função pura.'),
          opc('c', 'Uma planilha, uma reunião e uma aprovação', false, 'nenhuma delas é reproduzível.')] },
      { id: 'm13b11-passed', pergunta: 'Um relatório traz <code>"passed": true</code> com métricas zeradas. O que o gate faz?',
        opcoes: [
          opc('a', 'Reprova: o veredito vem das métricas contra o baseline; o campo <code>passed</code> é ignorado de propósito', true, 'um gate que lê <code>passed</code> do arquivo aprova qualquer edição manual.'),
          opc('b', 'Aprova e avisa', false, 'o aviso não impede o merge.'),
          opc('c', 'Aprova, respeitando a flag', false, 'é o desenho que o teste de flag forjada proíbe.')] },
      { id: 'm13b11-baseline', pergunta: 'Por que o baseline de regressão precisa ser artefato versionado?',
        opcoes: [
          opc('a', 'Regressão é queda além do budget contra um baseline; memória do time não é comparável entre commits', true, 'sem versão e kind, não dá para comparar commits.'),
          opc('b', 'Para o relatório ficar mais bonito', false, 'o motivo é comparabilidade.'),
          opc('c', 'Porque o CI exige um arquivo', false, 'o CI falha com causa explícita porque há um baseline para comparar.')] },
      { id: 'm13b11-abst', pergunta: 'Por que abstenção tem métrica própria (acurácia de abstenção no fora-de-escopo)?',
        opcoes: [
          opc('a', 'Sem ela o sistema erra fora de escopo em silêncio', true, 'o golden mede F1 de tokens; só a métrica própria vê se ele se absteve quando devia.'),
          opc('b', 'Porque abstenção é mais barata', false, 'custo não entra.'),
          opc('c', 'Porque o F1 não existe fora do escopo', false, 'a razão é cobrir um comportamento distinto, não a ausência de F1.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>"Funcionou" dito uma vez</h3>' +
          '<p>O time roda cinco perguntas à mão, vê boas respostas e anuncia que o retrieval funciona. Duas semanas depois uma mudança derruba a qualidade e ninguém sabe quando, porque não havia número nem baseline.</p>' +
          '<h3>As três partes duras</h3>' +
          '<ul><li><strong>Dataset versionado como dado:</strong> golden path, fora de escopo e injection em <code>fixtures/evals/*.json</code>, cada um com <code>name</code>, <code>version</code> e <code>kind</code> (<code>golden</code>, <code>out_of_scope</code>, <code>injection</code>) validados na carga. Arquivo fora do esquema é erro, não warning.</li>' +
          '<li><strong>Métrica derivada da execução:</strong> F1 de tokens no golden (piso pré-registrado <code>ANSWER_FLOOR = 0.5</code>), acurácia de abstenção no fora-de-escopo e resistência a injection.</li>' +
          '<li><strong>Gate de regressão:</strong> compara o relatório atual com um baseline versionado; queda além do budget (<code>REGRESSION_BUDGET = 0.05</code> por métrica) vira violação. O gate devolve a <strong>lista</strong> de violações; vazia significa PASS, não um booleano.</li></ul>' +
          '<h3>Veredito derivado, não declarado</h3>' +
          '<p>O gate ignora qualquer campo <code>passed</code> do JSON. O teste forja um relatório com <code>"passed": true</code> e métrica zerada, e o gate reprova mesmo assim. Injection é controle de pipeline: chunk marcado <code>poisoned</code> nem entra no índice, e a métrica mede se o marcador vazou na resposta real do respondedor extrativo. Sem juiz de LLM: a rubrica é função pura, e a variância zero é comprovada por <code>test_execucao_deterministica</code>.</p>' +
          '<p><strong>Limite:</strong> um juiz de LLM só se justificaria para o que um teste não decide, e então seria preciso medir a concordância dele com humanos. Aqui não há esse juiz.</p>' },
        { tipo: 'takeaway', html: 'Dataset <mark>versionado</mark>, métrica da <mark>execução</mark> e veredito <mark>derivado</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html: '<p>A execução abaixo é a registrada no bloco (<code>evidence/m13/B11/pytest-evals.txt</code>).</p>' },
        { tipo: 'rode', id: 'b11-rode', titulo: 'Rode a suíte de evals', enunciado: 'Aperte Enter e acompanhe. Saída registrada no bloco.',
          prefixo: '$', entrada: 'uv run pytest tests/test_evals.py -v', unidade: 'testes', terminalTitulo: 'lab M13 (saída registrada)',
          prever: { pergunta: 'O teste forja um relatório com <code>"passed": true</code> e todas as métricas em zero. O gate aprova?', opcoes: [
            { id: 'a', texto: 'Não: reprova, porque ignora o <code>passed</code> e compara as métricas', correta: true, porque: '<code>test_veredito_derivado_ignora_flag_passed</code> exige a reprovação.' },
            { id: 'b', texto: 'Sim, a flag manda', correta: false, porque: 'seria um gate que qualquer edição manual aprova.' },
            { id: 'c', texto: 'Depende do tamanho do dataset', correta: false, porque: 'o veredito não depende do tamanho; deriva das métricas.' }
          ] },
          etapas: [
            { id: 'dados', nome: 'Datasets e métricas', descricao: 'Carga validada, F1, abstenção, injection', tom: 'dns', ms: 5, linhas: [
              L('cmd', 'uv run pytest tests/test_evals.py -v'),
              L('out', 'test_datasets_versionados_carregam_e_validam PASSED'),
              L('out', 'test_token_f1_extremos_e_parcial PASSED'),
              L('out', 'test_golden_f1_e_structural_no_piso PASSED'),
              L('out', 'test_out_of_scope_abstem_sempre PASSED'),
              L('out', 'test_injection_nao_vaza_marcador PASSED')] },
            { id: 'gate', nome: 'Gate', descricao: 'Regressão semeada e flag forjada', tom: 'request', ms: 2, linhas: [
              L('out', 'test_gate_reprova_regressao_semeada PASSED'),
              L('out', 'test_veredito_derivado_ignora_flag_passed PASSED'),
              L('hint', 'a regressão foi semeada de verdade, não simulada')] },
            { id: 'det', nome: 'Determinismo', descricao: 'Variância zero', tom: 'response', ms: 1, linhas: [
              L('out', 'test_execucao_deterministica PASSED'),
              L('in', '8 passed'),
              L('hint', 'a rubrica é função pura: mesma entrada, mesmo veredito')] }
          ],
          tutorAntes: 'Responda a previsão e aperte Enter.',
          callout: 'Você viu os oito oráculos de eval passarem, inclusive a flag forjada.' },
        { tipo: 'transcript', id: 'b11-transcript', titulo: 'Ache o relatório que aprova sem medir', obrigatorio: false, terminalTitulo: 'revisão de PR (exemplo)',
          enunciado: 'Alguém propõe aprovar a mudança com base num relatório. Uma afirmação não é sustentada. Clique na linha e aperte Conferir. Valores de exemplo.',
          linhas: [
            { quem: 'voce', texto: 'Posso mergear? O gate de evals passou?' },
            { quem: 'ferramenta', texto: '$ cat report.json\n{"passed": true, "metrics": {"golden_f1": 0.0, "abstention_acc": 0.0, "injection_resist": 0.0}}' },
            { quem: 'agente', texto: 'O relatório diz passed: true, então o gate aprovou.' },
            { quem: 'ferramenta', texto: 'baseline: golden_f1=0.80 abstention_acc=1.00 injection_resist=1.00' }
          ],
          erradas: [2],
          explicacao: { 2: 'o veredito não pode vir do campo <code>passed</code>: o gate deriva das métricas contra o baseline versionado. Com as três métricas zeradas, as três caem além do budget e o gate devolve três violações.' },
          tutorDepois: 'Um relatório editado à mão aprova qualquer mudança se o gate acreditar na flag.' },
        { tipo: 'takeaway', html: 'O <mark>veredito</mark> sai das <mark>métricas</mark> contra o baseline, nunca de uma flag.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b11-python', titulo: 'Escreva o gate de regressão', obrigatorio: false,
          enunciado: 'Implemente <code>gate(current, baseline, budget)</code>: devolva a lista de violações (vazia = PASS). Uma métrica viola se cair mais que <code>budget</code> contra o baseline ou estiver ausente. Ignore o campo <code>passed</code>. Versão reduzida do gate do bloco.',
          codigo: codigoGate, testes: testesGate,
          dica: 'Percorra <code>baseline["metrics"]</code>. Métrica ausente em <code>current["metrics"]</code> vira violação; senão compare <code>base - atual</code> com o budget.',
          solucao: solucaoGate,
          tutorDepois: 'Queda igual ao budget passa; só acima dele reprova. A métrica ausente reprova porque sumir não pode ser um jeito de passar.',
          callout: 'Seu gate deriva o veredito das métricas e lista a causa de cada violação.' },
        { tipo: 'escolha', id: 'b11-esc1', titulo: 'Dataset sem versão', pergunta: 'Um dataset de eval chega sem <code>version</code> nem <code>kind</code>. O que o bloco manda fazer?',
          opcoes: [
            opc('a', 'Carregar com um aviso', false, 'o bloco trata arquivo fora do esquema como erro, não warning.'),
            opc('b', 'Rejeitar na carga: sem versão não dá para comparar commits', true, 'a validação de <code>name</code>, <code>version</code> e <code>kind</code> é feita na carga.'),
            opc('c', 'Assumir <code>kind = golden</code>', false, 'assumir esconderia a falta.')] },
        { tipo: 'escolha', id: 'b11-esc2', titulo: 'Juiz não determinístico', pergunta: 'Um time troca a rubrica por um juiz de LLM e não reporta variância. O que acontece com a regressão?',
          opcoes: [
            opc('a', 'Vira sorte: a oscilação do juiz se confunde com regressão real', true, 'juiz não determinístico sem variância reportada não separa sinal de ruído.'),
            opc('b', 'Fica mais precisa', false, 'sem variância medida não há precisão demonstrada.'),
            opc('c', 'Não muda nada', false, 'o gate passa a depender de um número que oscila.')] },
        { tipo: 'takeaway', html: 'Gate <mark>vazio = PASS</mark>; baseline <mark>versionado</mark>; sem juiz não medido.' }
      ] }
    ]
  });
})();
