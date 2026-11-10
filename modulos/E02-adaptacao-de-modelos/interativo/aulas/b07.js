/* E02 · Bloco 7: operar modelos adaptados. Fonte: E02.html#b07. Tabela do gate: execução real do lab em 11/10/2026 (semente 7). Limites do gate (20%, 10%, margem absoluta) são ilustrativos. S-LoRA e vLLM: documentação não reaberta na revisão da fonte. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  var J = function (a) { return a.join('\n'); };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasGate = function () {
    return [
      { id: 'full', nome: 'Full fine-tuning', descricao: 'Alvo +29,1% · guarda REGRIDE', tom: 'dns', ms: 29.1, linhas: [
        L('cmd', 'uv run python -m adapt_lab.cli demo'),
        L('out', 'tarefa_B  base 0.1535  novo 0.1089  +29.1%      ok'),
        L('out', 'tarefa_A  base 0.0008  novo 0.0558  -6842.1%    REGRIDE'),
        L('in', 'GATE: REPROVADO')] },
      { id: 'lora2', nome: 'LoRA r = 2', descricao: 'Alvo +66,8% · guarda REGRIDE', tom: 'tcp', ms: 66.8, linhas: [
        L('cmd', 'uv run python -m adapt_lab.cli demo   # LoRA vs base'),
        L('out', 'tarefa_B  base 0.1535  novo 0.0510  +66.8%      ok'),
        L('out', 'tarefa_A  base 0.0008  novo 0.1628  -20160.0%   REGRIDE'),
        L('in', 'GATE: REPROVADO'),
        L('hint', 'o melhor ganho no alvo é também a pior regressão na guarda')] },
      { id: 'lora4', nome: 'LoRA r = 4', descricao: 'Alvo +11,1% FALHA · guarda REGRIDE', tom: 'tls', ms: 11.1, linhas: [
        L('cmd', 'uv run python -m adapt_lab.cli demo --rank 4 | tail -6'),
        L('out', 'tarefa_B  base 0.1535  novo 0.1364  +11.1%      FALHA'),
        L('out', 'tarefa_A  base 0.0008  novo 0.1076  -13292.8%   REGRIDE'),
        L('in', 'GATE: REPROVADO'),
        L('hint', 'duas razões distintas, separadas no relatório: o alvo não passou da margem de 20% (FALHA) e a guarda regrediu (REGRIDE)')] },
      { id: 'ctrl', nome: 'Controle negativo', descricao: 'Modelo idêntico ao base', tom: 'ink', ms: 0, linhas: [
        L('cmd', 'python -c "...compare(b, b, experiment.suites_for(t)); print(v.passed, v.target_failures)"'),
        L('out', 'False (\'tarefa_B\',)'),
        L('hint', 'sem melhoria no alvo acima da margem, o gate não pode aprovar: um gate que aprova o modelo idêntico ao base está quebrado')] }
    ];
  };

  var codigoGate = J([
    'import math',
    '',
    '',
    'def avaliar_gate(alvo_base, alvo_novo, guarda_base, guarda_novo, finito=True,',
    '                 melhoria_min=20.0, tol_rel=10.0, margem_abs=0.01):',
    '    """Erros: menor é melhor. Limites em % (melhoria_min, tol_rel) e absoluto (margem_abs).',
    '    - alvo: ganho = (base - novo) / base * 100; "ok" se ganho >= melhoria_min, senão "FALHA"',
    '    - guarda: "REGRIDE" só se a piora relativa passa de tol_rel E a absoluta passa de margem_abs',
    '    - não finito ou execução que não terminou: reprova',
    '    """',
    '    ganho = 0.0',
    '    alvo = "ok"',
    '    guarda = "ok"',
    '    aprovado = True',
    '    return {"ganho_alvo": ganho, "alvo": alvo, "guarda": guarda, "aprovado": aprovado}',
    '',
    '',
    'r = avaliar_gate(0.1535, 0.1089, 0.0008, 0.0558)',
    'print(round(r["ganho_alvo"], 1), r["alvo"], r["guarda"], r["aprovado"])',
    ''
  ]);
  var testesGate = J([
    'def test_full_finetuning_do_lab_reprova_pela_guarda():',
    '    r = avaliar_gate(0.1535, 0.1089, 0.0008, 0.0558)',
    '    assert round(r["ganho_alvo"], 1) == 29.1',
    '    assert (r["alvo"], r["guarda"], r["aprovado"]) == ("ok", "REGRIDE", False)',
    '',
    '',
    'def test_rank_4_reprova_por_duas_razoes():',
    '    r = avaliar_gate(0.1535, 0.1364, 0.0008, 0.1076)',
    '    assert round(r["ganho_alvo"], 1) == 11.1',
    '    assert (r["alvo"], r["guarda"]) == ("FALHA", "REGRIDE")',
    '',
    '',
    'def test_controle_negativo_modelo_identico_reprova():',
    '    r = avaliar_gate(0.1535, 0.1535, 0.0008, 0.0008)',
    '    assert r["alvo"] == "FALHA" and r["guarda"] == "ok" and r["aprovado"] is False',
    '',
    '',
    'def test_candidato_bom_aprova():',
    '    r = avaliar_gate(0.15, 0.10, 0.0800, 0.0820)',
    '    assert r["aprovado"] is True',
    '',
    '',
    'def test_baseline_quase_perfeito_nao_dispara_so_pelo_relativo():',
    '    # 0,0008 -> 0,0012 é +50% relativo, mas só 0,0004 absoluto',
    '    r = avaliar_gate(0.15, 0.10, 0.0008, 0.0012)',
    '    assert r["guarda"] == "ok" and r["aprovado"] is True',
    '',
    '',
    'def test_saida_nao_finita_ou_execucao_incompleta_reprova():',
    '    assert avaliar_gate(0.15, float("nan"), 0.08, 0.08)["aprovado"] is False',
    '    assert avaliar_gate(0.15, 0.10, 0.08, 0.08, finito=False)["aprovado"] is False',
    ''
  ]);
  var solucaoGate = J([
    'import math',
    '',
    '',
    'def avaliar_gate(alvo_base, alvo_novo, guarda_base, guarda_novo, finito=True,',
    '                 melhoria_min=20.0, tol_rel=10.0, margem_abs=0.01):',
    '    valores = (alvo_base, alvo_novo, guarda_base, guarda_novo)',
    '    if not finito or not all(math.isfinite(v) for v in valores):',
    '        return {"ganho_alvo": 0.0, "alvo": "FALHA", "guarda": "REGRIDE", "aprovado": False}',
    '    ganho = (alvo_base - alvo_novo) / alvo_base * 100',
    '    alvo = "ok" if ganho >= melhoria_min else "FALHA"',
    '    piora_abs = guarda_novo - guarda_base',
    '    piora_rel = piora_abs / guarda_base * 100 if guarda_base > 0 else float("inf")',
    '    regride = piora_rel > tol_rel and piora_abs > margem_abs',
    '    guarda = "REGRIDE" if regride else "ok"',
    '    return {"ganho_alvo": ganho, "alvo": alvo, "guarda": guarda,',
    '            "aprovado": alvo == "ok" and guarda == "ok"}',
    ''
  ]);

  var codigoCanario = J([
    'def deve_reverter(f1_prod, f1_canario, taxa_json_invalido,',
    '                  queda_pontos=5.0, janelas_seguidas=2, limite_json=0.5):',
    '    """f1_* são listas (uma entrada por janela horária, em pontos de F1).',
    '    taxa_json_invalido em %. Reverta se:',
    '      - o F1 do canário ficar mais de queda_pontos abaixo do da produção em',
    '        janelas_seguidas janelas SEGUIDAS, ou',
    '      - a taxa de JSON inválido passar de limite_json."""',
    '    return False',
    '',
    '',
    'print(deve_reverter([90, 90], [84, 90], 0.1))',
    ''
  ]);
  var testesCanario = J([
    'def test_uma_janela_ruim_nao_reverte():',
    '    assert deve_reverter([90, 90, 90], [84, 91, 90], 0.1) is False',
    '',
    '',
    'def test_duas_janelas_seguidas_revertem():',
    '    assert deve_reverter([90, 90, 90], [90, 84, 83], 0.1) is True',
    '',
    '',
    'def test_duas_janelas_nao_seguidas_nao_revertem():',
    '    assert deve_reverter([90, 90, 90], [84, 90, 84], 0.1) is False',
    '',
    '',
    'def test_queda_de_exatamente_5_nao_dispara():',
    '    assert deve_reverter([90, 90], [85, 85], 0.1) is False',
    '',
    '',
    'def test_json_invalido_acima_de_meio_por_cento_reverte():',
    '    assert deve_reverter([90], [90], 0.6) is True',
    '    assert deve_reverter([90], [90], 0.5) is False',
    '',
    '',
    'def test_sem_dados_nao_reverte():',
    '    assert deve_reverter([], [], 0.0) is False',
    ''
  ]);
  var solucaoCanario = J([
    'def deve_reverter(f1_prod, f1_canario, taxa_json_invalido,',
    '                  queda_pontos=5.0, janelas_seguidas=2, limite_json=0.5):',
    '    if taxa_json_invalido > limite_json:',
    '        return True',
    '    seguidas = 0',
    '    for p, c in zip(f1_prod, f1_canario):',
    '        if p - c > queda_pontos:',
    '            seguidas += 1',
    '            if seguidas >= janelas_seguidas:',
    '                return True',
    '        else:',
    '            seguidas = 0',
    '    return False',
    ''
  ]);

  TrilhaAula.registrar({
    id: 'e02-b7',
    titulo: 'Operar modelos adaptados: registro, gate, serving e rollback',
    minutos: 40,
    resumo: 'Um modelo adaptado é uma dependência de produção cujo "código-fonte" é um conjunto de dados, uma receita de treino e um modelo-base de terceiros. Operá-lo é aplicar versão, rastreabilidade, gate de regressão, implantação gradual e retorno possível.',
    objetivo: 'Registrar uma versão pelo conjunto que a produz, projetar um gate com suítes de alvo e guarda e controle negativo, escolher entre fundido e multi-adapter e definir gatilhos de rollback ensaiados.',
    revisao: [
      { id: 'e02b7-versao', pergunta: 'O que identifica uma versão de modelo adaptado?',
        opcoes: [
          opc('a', 'Base (hash/revisão) + adapter + dados (hash e regra de split) + receita + relatório de avaliação + aprovadores', true, 'um nome não responde "qual base?" nem "dá para reproduzir?" num incidente.'),
          opc('b', 'O nome do modelo e a data', false, 'duas revisões com o mesmo nome produzem erros silenciosos.'),
          opc('c', 'Só o hash do adapter', false, 'o adapter é um diff que só tem sentido sobre a sua base.')] },
      { id: 'e02b7-gate', pergunta: 'O gate aprova o próprio modelo-base como candidato. O que isso diz?',
        opcoes: [
          opc('a', 'Que o gate está quebrado: sem melhoria no alvo acima da margem ele não poderia aprovar; é o controle negativo que o projeto do gate exige', true, 'o gate ainda deve rodar no artefato real e reprovar por erro de execução ou saída não finita.'),
          opc('b', 'Que o gate é robusto', false, 'um gate que aprova o modelo idêntico ao base não mede nada.'),
          opc('c', 'Que o base é ótimo', false, 'o gate não pode concluir isso sem melhoria no alvo.')] },
      { id: 'e02b7-serving', pergunta: 'Quando preferir adapter separado (multi-LoRA) a fundido?',
        opcoes: [
          opc('a', 'Muitos clientes ou tarefas, canários e experimentos: um base compartilhado, troca por requisição e rollback por ponteiro', true, 'o fundido serve uma variante dominante com latência crítica, sem sobrecarga.'),
          opc('b', 'Quando só há uma variante e a latência é crítica', false, 'esse é o caso do fundido.'),
          opc('c', 'Nunca: o fundido é sempre melhor', false, 'o fundido perde flexibilidade e rollback barato.')] },
      { id: 'e02b7-canario', pergunta: 'Por que o gatilho do canário exige duas janelas seguidas?',
        opcoes: [
          opc('a', 'Com 100 casos por hora o erro-padrão do F1 é de alguns pontos; uma janela ruim pode ser ruído amostral', true, 'a margem e a janela vêm do tamanho da amostra; confirmado, o rollback é por ponteiro.'),
          opc('b', 'Porque o roteador só atualiza de duas em duas horas', false, 'a razão é estatística.'),
          opc('c', 'Para atrasar o rollback e economizar custo', false, 'o objetivo não é atrasar, é evitar falso alarme.')] },
      { id: 'e02b7-dataset', pergunta: 'Qual é o risco do dataset de treino depois do treino?',
        opcoes: [
          opc('a', 'O modelo pode reproduzir exemplos (memorização); com dado pessoal ou segredo ele vira repositório desses dados, e um pedido de eliminação não se cumpre "apagando um fato" dos pesos', true, 'triagem antes do treino, base legal registrada e capacidade de retreinar sem um registro específico.'),
          opc('b', 'Nenhum: os dados somem ao treinar', false, 'a memorização é um risco real.'),
          opc('c', 'O dataset ocupa muito disco', false, 'o risco central não é de disco.')] }
    ],
    abas: [
      { rotulo: 'Versionar e registrar', blocos: [
        { tipo: 'texto', html:
          '<p>Um modelo adaptado é uma dependência de produção com a particularidade de que o seu "código-fonte" é um conjunto de dados, uma receita de treino e um modelo-base de terceiros. Operá-lo é aplicar ao artefato de modelo a disciplina que o curso já aplicou a código, prompts e índices: versão, rastreabilidade, teste de regressão como gate, implantação gradual e retorno possível. Sem isso, no dia em que a qualidade cai ninguém sabe qual combinação de base, dados e hiperparâmetros está no ar.</p>' +
          '<p>Uma versão é identificada pelo <strong>conjunto completo</strong> que a produz, não por um nome:</p>' },
        { tipo: 'codigo', linguagem: 'json', texto: '{\n  "model_id": "tickets-classifier",\n  "version": "2026.10.2",\n  "base": {"name": "provedor/modelo-base", "revision": "sha256:9f2c...", "license": "ver LICENSE"},\n  "adapter": {"sha256": "41ab...", "rank": 16, "alpha": 32, "targets": "all-linear", "size_mb": 33.6},\n  "data": {"train_sha256": "c07e...", "n": 3000, "split_rule": "sha256(customer_id) % 100", "audit_error_rate": 0.04},\n  "training": {"lr": 2e-4, "epochs": 2, "seed": 17, "code_commit": "ab12cd3"},\n  "eval": {"suite": "tickets-eval@v7", "report": "evals/2026-10-02.json",\n           "target": {"f1": 0.91}, "guards": {"refusal_rate": "ok", "json_valid": 1.0}},\n  "approved_by": ["rev-ml", "rev-produto"],\n  "status": "canary"\n}' },
        { tipo: 'texto', html:
          '<p>Cada campo responde a uma pergunta que alguém fará num incidente: "qual base?" (hash, não nome), "com que dados?" (hash do dataset e regra de split), "dá para reproduzir?" (semente, commit do código de treino, hiperparâmetros), "quem aprovou com que evidência?". O <strong>registro de modelos</strong> (<em>model registry</em>) guarda isso e os estados de ciclo de vida: candidato, canário, produção, aposentado.</p>' +
          '<p>O adapter é um arquivo pequeno e barato de guardar; guardar pelo menos o anterior em produção é o que torna o rollback possível. O dataset é versionado por hash e, quando contém dado pessoal, fica sujeito à política de retenção do E03 e da LGPD: a versão congelada precisa de prazo e justificativa.</p>' },
        { tipo: 'complete', id: 'b7-complete-registro', titulo: 'Monte o registro de uma versão',
          enunciado: 'Escolha, em cada lacuna, o valor que responde à pergunta de um incidente.',
          linguagem: 'json',
          partes: [
            '{\n  "base": {"revision": ', { lacuna: 'base', opcoes: ['"modelo-x"', '"sha256:9f2c..."', '"latest"'], correta: '"sha256:9f2c..."' },
            '},\n  "data": {"train_sha256": "c07e...", "split_rule": ', { lacuna: 'split', opcoes: ['"aleatório 80/10/10 por linha"', '"sha256(customer_id) % 100"', '"não registrado"'], correta: '"sha256(customer_id) % 100"' },
            '},\n  "training": {"seed": 17, "code_commit": ', { lacuna: 'commit', opcoes: ['"ab12cd3"', '"main"', '"hoje"'], correta: '"ab12cd3"' },
            '},\n  "eval": {"suite": "tickets-eval@v7", "guards": ', { lacuna: 'guards', opcoes: ['{"refusal_rate": "ok", "json_valid": 1.0}', '"todas ok"', '{}'], correta: '{"refusal_rate": "ok", "json_valid": 1.0}' },
            '},\n  "status": ', { lacuna: 'status', opcoes: ['"canary"', '"melhor"', '"final_v2_agora_vai"'], correta: '"canary"' },
            '\n}'
          ],
          explicacao: 'O nome do base não distingue duas revisões com o mesmo nome; o hash do dataset sozinho não diz como foi dividido; <code>main</code> muda; e o estado é do ciclo de vida (candidato, canário, produção, aposentado). Os valores são ilustrativos, como na fonte.',
          callout: 'Registro montado: base por hash, dados com regra de split, receita reproduzível, guardas e estado.' },
        { tipo: 'escolha', id: 'b7-esc-registro', titulo: 'Confira: o registro incompleto',
          pergunta: 'Incidente: o adapter v7 se comporta diferente do esperado, e o registro só diz "base: modelo-x". O que faltou?',
          opcoes: [
            { id: 'a', texto: 'O hash/revisão exata do modelo-base (e tokenizador/quantização): o adapter é um diff que só faz sentido sobre sua base.', correta: true, porque: 'duas revisões com o mesmo nome produzem erros silenciosos: a forma casa, o comportamento não.' },
            { id: 'b', texto: 'O nome do engenheiro que treinou.', correta: false, porque: 'não ajuda a reproduzir nem a localizar a base.' },
            { id: 'c', texto: 'O tamanho do adapter.', correta: false, porque: 'o tamanho não identifica a base.' }
          ], tutorDepois: 'Versão = base (hash) + adapter + dados (hash e regra de split) + receita + relatório + aprovadores.' },
        { tipo: 'takeaway', html: 'Versão é o <mark>conjunto completo</mark> que a produz, com a base por <mark>hash</mark>, e o adapter anterior fica guardado.' }
      ] },

      { rotulo: 'O gate de regressão', blocos: [
        { tipo: 'texto', html:
          '<p>O M06 B06 montou o gate de CI para prompts. Aqui ele ganha duas suítes por papel, como no harness do lab: <strong>alvo</strong> (precisa melhorar por pelo menos uma margem) e <strong>guarda</strong> (não pode piorar além de uma tolerância). A tabela vem do lab (execução real, semente 7), com limites de 20% no alvo e 10% de piora na guarda. Preveja o resultado do controle negativo.</p>' },
        { tipo: 'rode', id: 'b7-rode', titulo: 'Quatro candidatos, um gate', enunciado: 'Rode a demonstração e abra cada etapa (full, LoRA r=2, LoRA r=4 e o controle negativo, que vêm de comandos do lab desta página). A barra mostra o ganho no alvo em %.',
          prefixo: '$', entrada: 'uv run python -m adapt_lab.cli demo', unidade: '%', terminalTitulo: 'adapt_lab', etapas: etapasGate(),
          prever: { pergunta: 'Se o candidato for o próprio modelo-base (nenhuma mudança), o que o gate deve fazer?', opcoes: [
            { id: 'a', texto: 'Aprovar: nada piorou.', correta: false, porque: 'sem melhoria no alvo acima da margem, não há razão para promover; aprovar mostraria um gate quebrado.' },
            { id: 'b', texto: 'Reprovar: o alvo não passa da margem de melhoria.', correta: true, porque: 'o controle negativo é parte do projeto do gate: False (\'tarefa_B\',).' },
            { id: 'c', texto: 'Dar erro de execução.', correta: false, porque: 'o gate roda normalmente e reprova por FALHA no alvo.' }
          ] },
          tutorAntes: 'Aperte Enter e abra "Controle negativo" por último.',
          tutorDepois: 'Os três candidatos reais reprovam, por motivos diferentes: guarda que regride (full e r=2) ou alvo abaixo da margem mais guarda (r=4). E o modelo idêntico ao base também reprova. Todos os percentuais de guarda são gigantes porque o erro-base de A é 0,0008: por isso combine limite relativo com margem absoluta.',
          callout: 'Você viu um gate reprovar três candidatos e o controle negativo.' },
        { tipo: 'texto', html:
          '<p><strong>Regras de implementação:</strong> o gate roda no artefato que irá ao ar (fundido, quantizado, com o template do servidor), não numa variante de pesquisa; falha de execução, saída não finita ou limite estourado reprova (o lab trata erro não finito como reprovação); o resultado vira relatório anexado ao registro; e a suíte evolui: toda regressão encontrada em produção entra na suíte como caso permanente.</p>' },
        { tipo: 'python', id: 'b7-python-gate', titulo: 'O gate com alvo, guarda e margem absoluta', obrigatorio: false,
          enunciado: 'Implemente <code>avaliar_gate</code>. Alvo: ganho = <code>(base - novo) / base * 100</code>, "ok" se atingir <code>melhoria_min</code>. Guarda: "REGRIDE" <strong>só se</strong> a piora relativa passar de <code>tol_rel</code> <em>e</em> a absoluta passar de <code>margem_abs</code> (a regra "relativo e absoluto combinados" do módulo; os limites são ilustrativos). Saída não finita ou execução incompleta reprova.',
          codigo: codigoGate, testes: testesGate,
          dica: 'Primeiro trate o caso não finito (<code>math.isfinite</code>). Depois: <code>piora_abs = guarda_novo - guarda_base</code>, <code>piora_rel = piora_abs / guarda_base * 100</code>, e <code>regride = piora_rel &gt; tol_rel and piora_abs &gt; margem_abs</code>.',
          solucao: solucaoGate,
          tutorDepois: 'O teste do baseline quase perfeito mostra por que a margem absoluta existe: 0,0008 para 0,0012 é +50% relativo e não deve reprovar sozinho. Já os três candidatos do lab estouram os dois limites.',
          callout: 'O gate do lab agora é uma função com controle negativo e margem absoluta.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Gate que se contorna "só dessa vez" não é gate', html:
          '<p>Escreva a lista de guardas antes do primeiro treino, com limites e donos (quem aceita uma regressão?). Retreino por "melhorar um pouco" sem gate troca um modelo conhecido por um desconhecido.</p>' },
        { tipo: 'escolha', id: 'b7-esc-controle', titulo: 'Confira: o controle negativo',
          pergunta: 'Para testar o gate de regressão, você o roda com o próprio modelo-base como candidato e ele aprova. O que isso diz?',
          opcoes: [
            { id: 'a', texto: 'Que o gate está quebrado: sem melhoria no alvo acima da margem ele não poderia aprovar.', correta: true, porque: 'um gate que aprova o modelo idêntico ao base não mede nada; ele ainda precisa rodar no artefato real e reprovar por erro de execução ou saída não finita.' },
            { id: 'b', texto: 'Que o gate é robusto.', correta: false, porque: 'robusto seria reprovar o idêntico.' },
            { id: 'c', texto: 'Que a suíte é pequena e basta.', correta: false, porque: 'o tamanho da suíte não explica a aprovação do idêntico.' }
          ], tutorDepois: 'O controle negativo é parte do projeto do gate.' },
        { tipo: 'takeaway', html: 'Gate com <mark>alvo e guarda</mark>, margem relativa <mark>e</mark> absoluta, rodando no <mark>artefato real</mark> e reprovando o modelo idêntico.' }
      ] },

      { rotulo: 'Serving e drift', blocos: [
        { tipo: 'texto', html: '<h3>Serving de adapters</h3><p>Duas formas, com consequências opostas:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th></th><th>Fundido (merge)</th><th>Adapter separado (multi-LoRA)</th></tr></thead><tbody>' +
          '<tr><td>Inferência</td><td>Idêntica a modelo comum; sem sobrecarga</td><td>Cálculo extra <code>B·(A·x)</code> por camada adaptada; pequena latência adicional</td></tr>' +
          '<tr><td>Memória</td><td>Um modelo completo por variante (dezenas de GB)</td><td>Um base compartilhado + dezenas de MB por adapter</td></tr>' +
          '<tr><td>Troca por requisição</td><td>Não</td><td>Sim: o servidor roteia pelo identificador do adapter</td></tr>' +
          '<tr><td>Rollback</td><td>Trocar o modelo inteiro</td><td>Trocar o ponteiro do adapter</td></tr>' +
          '<tr><td>Melhor para</td><td>Uma variante dominante, latência crítica</td><td>Muitos clientes ou tarefas, canários, experimentos</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Servidores como o vLLM suportam vários adapters LoRA sobre um base e a seleção por requisição (ver a documentação do recurso de LoRA), e o S-LoRA (Sheng et al., 2023) descreve o serving de milhares de adapters concorrentes com paginação de memória. No lab, <code>forward_decomposed</code> calcula <code>W·x + (α/r)·B·(A·x)</code> sem somar em <code>W</code>, como faz o servidor, e o teste confirma que coincide com o modelo fundido (diferença máxima de 2,0e-15). A documentação do vLLM não foi reaberta na revisão da fonte: confirme antes de depender.</p>' +
          '<p>Cuidados de serving: o limite de adapters residentes na GPU e o custo de carregar um adapter a frio (o primeiro pedido paga a carga); tokenizador e template idênticos aos do treino; e isolamento entre clientes quando cada um tem seu adapter: <strong>o identificador do adapter é um parâmetro de autorização, não só de roteamento</strong>.</p>' +
          '<h3>Drift, monitoramento e rollback</h3>' },
        { tipo: 'abas', rotulo: 'Três drifts', itens: [
          { rotulo: 'De entrada', blocos: [{ tipo: 'texto', html: '<p>A distribuição dos pedidos muda (novo produto, nova campanha, novo idioma). Monitore comprimento, vocabulário, proporção por categoria e a distância entre embeddings da produção e do treino.</p>' }] },
          { rotulo: 'De rótulo ou conceito', blocos: [{ tipo: 'texto', html: '<p>A regra do negócio muda e os exemplos antigos passam a ensinar o antigo. Rotule continuamente uma amostra de produção (M06 B05 cobre a amostragem e o que logar sem vazar) e compare com a decisão do modelo.</p>' }] },
          { rotulo: 'Do base', blocos: [{ tipo: 'texto', html: '<p>O fornecedor descontinua ou altera o modelo-base. Em API, assuma que existirá retreino por calendário do fornecedor; em auto-hospedado, o base é seu e só muda quando você muda.</p>' }] }
        ] },
        { tipo: 'escolha', id: 'b7-esc-serving', titulo: 'Confira: fundido ou separado',
          pergunta: 'Uma plataforma atende 40 clientes, cada um com um adapter, e faz canários frequentes. Qual forma de serving e por quê?',
          opcoes: [
            { id: 'a', texto: 'Fundido: um modelo completo por cliente dá a menor latência.', correta: false, porque: '40 modelos de dezenas de GB e nenhum rollback barato.' },
            { id: 'b', texto: 'Adapter separado (multi-LoRA): um base compartilhado, troca por requisição e rollback por ponteiro; o identificador do adapter é tratado como autorização.', correta: true, porque: 'é o caso de muitos clientes e canários; paga uma pequena latência adicional.' },
            { id: 'c', texto: 'Qualquer forma: não há diferença de memória.', correta: false, porque: 'o fundido ocupa um modelo completo por variante.' }
          ], tutorDepois: 'Fundido para uma variante dominante e latência crítica; separado para multilocação e experimentos.' },
        { tipo: 'takeaway', html: 'Adapter separado dá <mark>multilocação e rollback por ponteiro</mark>; fundido dá simplicidade; o id do adapter é <mark>autorização</mark>.' }
      ] },

      { rotulo: 'Implantar e reverter', blocos: [
        { tipo: 'texto', html:
          '<p>A implantação gradual passa por <strong>sombra</strong> (executa sem afetar) e <strong>canário</strong> com percentual pequeno e métricas comparadas à versão em produção, depois promoção. Defina antes os gatilhos de rollback (queda do F1 amostrado, aumento da taxa de recusa, aumento da latência p95, reclamações). E o <strong>rollback precisa ser ensaiado</strong>: o runbook diz "troque o ponteiro do adapter para a versão anterior" e alguém já o executou em ambiente de teste, com medição do tempo.</p>' },
        { tipo: 'ordene', id: 'b7-ordene', titulo: 'Ordene a implantação gradual',
          enunciado: 'Ponha as etapas na ordem em que acontecem.',
          itens: [
            { id: 'decisao', texto: 'Decisão: promover, ou rollback por ponteiro e incidente aberto' },
            { id: 'canario', texto: 'Canário a 5% do tráfego, com 100 casos por hora rotulados por revisor' },
            { id: 'sombra', texto: 'Sombra: executa sem afetar, compara saídas com a produção e mede latência e formato' },
            { id: 'gatilho', texto: 'Gatilhos definidos de antemão: F1 amostrado 5 pontos abaixo em duas janelas seguidas, ou JSON inválido acima de 0,5%' }
          ], solucao: ['sombra', 'canario', 'gatilho', 'decisao'],
          dica: 'A sombra vem antes de qualquer tráfego real; os gatilhos são avaliados sobre o canário.',
          tutorDepois: 'Sombra (que dobra a inferência durante o período), canário, gatilho e decisão. Se um gatilho dispara, o roteador volta o tráfego a 0% sozinho e abre incidente (E04): ninguém negocia o número na hora. Rollback que depende de retreinar não é rollback.' },
        { tipo: 'python', id: 'b7-python-canario', titulo: 'O gatilho do canário', obrigatorio: false,
          enunciado: 'Implemente <code>deve_reverter</code>: reverte se o F1 amostrado do canário ficar <strong>mais de</strong> 5 pontos abaixo da produção em 2 janelas <strong>seguidas</strong>, ou se a taxa de JSON inválido passar de 0,5%. O exemplo da fonte: 100 casos por hora, 5% do tráfego.',
          codigo: codigoCanario, testes: testesCanario,
          dica: 'Mantenha um contador <code>seguidas</code>: some 1 quando <code>p - c &gt; queda_pontos</code> e zere quando não. Se chegar a <code>janelas_seguidas</code>, retorne <code>True</code>.',
          solucao: solucaoCanario,
          tutorDepois: 'Uma janela ruim não reverte, porque com 100 casos por hora o erro-padrão do F1 é de alguns pontos; a confirmação em duas janelas separa sinal de ruído. Quando confirmado, o rollback é por ponteiro. Os números são os do exemplo da fonte.',
          callout: 'O gatilho de rollback agora é código, com a regra das duas janelas seguidas.' },
        { tipo: 'cenario', id: 'b7-cenario', titulo: 'O canário caiu 6 pontos em uma janela', obrigatorio: false,
          enunciado: 'O canário (5% do tráfego) mostra F1 amostrado 6 pontos abaixo da produção em uma só janela de 100 casos. O que fazer, e o que mudar no desenho?',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Uma janela, 100 casos, 6 pontos abaixo. Qual é a sua reação?', opcoes: [
              { texto: 'Promover mesmo assim: uma janela é pouco.', vai: 'f-promove', tom: 'ruim', consequencia: 'ignorar o sinal sem aguardar a confirmação nem aumentar a amostra é o outro extremo.' },
              { texto: 'Reverter já para a versão anterior.', vai: 'f-sem-ponteiro', tom: 'ruim', consequencia: 'se o rollback depende de retreinar, ele não existe; e uma janela só pode ser ruído.' },
              { texto: 'Exigir a segunda janela seguida, aumentar a amostra e manter pronto o rollback por ponteiro.', vai: 'segunda', tom: 'ok', consequencia: 'você separa sinal de ruído sem abrir mão de reverter rápido.' }
            ] },
            segunda: { texto: 'A segunda janela também mostra o F1 mais de 5 pontos abaixo. O que acontece?', opcoes: [
              { texto: 'O gatilho dispara: o roteador volta o tráfego a 0%, o ponteiro do adapter vai para a versão anterior e um incidente é aberto; o caso entra na suíte como permanente.', vai: 'f-bom', tom: 'ok', consequencia: 'o rollback foi ensaiado e cronometrado, e a regressão vira teste.' },
              { texto: 'Abrir uma discussão para decidir o limite agora.', vai: 'f-discute', tom: 'ruim', consequencia: 'o número devia ter sido definido antes; negociá-lo na hora é a forma de nunca reverter.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Reverteu por ponteiro depois da confirmação em duas janelas, registrou o caso na suíte e manteve o tráfego protegido.' },
            'f-promove': { bom: false, texto: 'Uma versão pior segue para produção sem que ninguém tenha como voltar com calma.' },
            'f-sem-ponteiro': { bom: false, texto: 'A reversão depende de retreino e o incidente dura horas.' },
            'f-discute': { bom: false, texto: 'O canário continua exposto enquanto o time discute o número.' }
          },
          callout: 'Você usou duas janelas para separar ruído de sinal e reverteu por ponteiro.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o dataset envelhece e vaza', html:
          '<p>Exemplos de treino podem ser reproduzidos pelo modelo (memorização). Se contêm dado pessoal, segredo ou texto de cliente, o modelo ajustado passa a ser, ele próprio, um repositório desses dados, com o regime legal correspondente, inclusive pedido de eliminação que você não consegue atender "apagando um fato" dos pesos. Faça a triagem de dados sensíveis antes do treino, registre a base legal e mantenha a capacidade de retreinar sem um registro específico: é a única forma confiável de cumprir uma eliminação.</p>' },
        { tipo: 'takeaway', html: 'Sombra, canário, gatilhos definidos <mark>antes</mark> e <mark>rollback ensaiado</mark>; dados sensíveis triados <mark>antes</mark> do treino.' }
      ] }
    ]
  });
})();
