/* M13 · Bloco 18: Production Readiness Review e game day. Fonte: M13.html#h-b18. Saídas do rode: execução registrada no bloco (5 testes) e linhas do prr.py. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = String.raw`def prr_report(checklist, existentes):
    # LACUNA: cada item {"area","evidencia"} so passa se a evidencia existe (conjunto 'existentes').
    # Devolve {"total","aprovados","pendentes","go","itens"}; itens = lista de (area, ok).
    return {"total": len(checklist), "aprovados": len(checklist), "pendentes": 0,
            "go": True, "itens": [(i["area"], True) for i in checklist]}

def registrar(timeline, t, ator, descricao):
    # LACUNA: a timeline so aceita eventos em ordem; t menor que o ultimo -> ValueError.
    timeline.append((t, ator, descricao))

def decide(prr, timeline):
    # LACUNA: GO so com PRR 100% evidenciado E ao menos 5 eventos na timeline.
    # NO-GO devolve plano de desbloqueio item a item.
    return {"veredito": "GO", "motivos": [], "plano": []}
`;
  var solucao = String.raw`def prr_report(checklist, existentes):
    itens = [(i["area"], i["evidencia"] in existentes) for i in checklist]
    aprovados = sum(1 for _, ok in itens if ok)
    return {"total": len(itens), "aprovados": aprovados,
            "pendentes": len(itens) - aprovados,
            "go": aprovados == len(itens), "itens": itens}

def registrar(timeline, t, ator, descricao):
    if timeline and t < timeline[-1][0]:
        raise ValueError("timeline fora de ordem")
    timeline.append((t, ator, descricao))

def decide(prr, timeline):
    pend = [a for a, ok in prr["itens"] if not ok]
    go = prr["go"] and len(timeline) >= 5 and not pend
    return {"veredito": "GO" if go else "NO-GO",
            "motivos": pend or ["PRR completo e game day concluido"],
            "plano": ["produzir evidencia para '" + a + "' e re-rodar PRR" for a in pend]}
`;
  var testes = String.raw`CK = [
    {"area": "arquitetura", "evidencia": "evidence/m13/B06"},
    {"area": "dados", "evidencia": "evidence/m13/B17"},
    {"area": "suporte", "evidencia": "evidence/m13/B15"},
]
TUDO = {"evidence/m13/B06", "evidence/m13/B17", "evidence/m13/B15"}

def timeline5():
    tl = []
    for t, a in ((0, "incident_commander"), (2, "executor"), (5, "executor"), (7, "comunicador"), (10, "escriba")):
        registrar(tl, t, a, "evento")
    return tl

def test_prr_so_com_evidencia_no_disco():
    r = prr_report(CK, TUDO)
    assert r["go"] is True and r["aprovados"] == 3 and r["pendentes"] == 0
    r2 = prr_report(CK, TUDO - {"evidence/m13/B15"})
    assert r2["go"] is False and r2["pendentes"] == 1
    assert ("suporte", False) in r2["itens"]

def test_timeline_rejeita_evento_fora_de_ordem():
    tl = []
    registrar(tl, 5, "executor", "x")
    registrar(tl, 5, "escriba", "mesmo minuto vale")
    try:
        registrar(tl, 3, "escriba", "atrasado")
    except ValueError:
        assert len(tl) == 2
        return
    assert False, "deveria levantar ValueError"

def test_go_com_prr_completo_e_game_day():
    d = decide(prr_report(CK, TUDO), timeline5())
    assert d["veredito"] == "GO" and d["plano"] == []

def test_no_go_e_legitimo_e_traz_plano():
    d = decide(prr_report(CK, TUDO - {"evidence/m13/B17"}), timeline5())
    assert d["veredito"] == "NO-GO"
    assert d["plano"] == ["produzir evidencia para 'dados' e re-rodar PRR"]

def test_controle_negativo_game_day_curto_nao_da_go():
    tl = []
    registrar(tl, 0, "incident_commander", "declarado")
    assert decide(prr_report(CK, TUDO), tl)["veredito"] == "NO-GO"
`;

  TrilhaAula.registrar({
    id: 'm13-b18',
    titulo: 'Production Readiness Review e game day',
    minutos: 35,
    resumo: 'PRR não é reunião: é matriz evidência-obrigatória. O game day injeta uma release ruim de verdade, e o postmortem sai da timeline. NO-GO com plano é resultado legítimo.',
    objetivo: 'Explicar por que o PRR verifica evidência no disco, o que torna um game day real e não teatro, como o postmortem é derivado da timeline e quando o veredito é NO-GO.',
    revisao: [
      { id: 'm13b18-prr', pergunta: 'Como o PRR do laboratório impede uma boa apresentação de aprovar uma área sem evidência?',
        opcoes: [
          opc('a', '<code>prr_report()</code> verifica a existência do arquivo de evidência no disco; não há parâmetro para "confiar em mim"', true, 'item sem evidência não pode ser aprovado.'),
          opc('b', 'Exige dois revisores', false, 'a checagem é executável, não depende de pessoas.'),
          opc('c', 'Usa um juiz de LLM', false, 'a checagem é existência de arquivo.')] },
      { id: 'm13b18-gd', pergunta: 'O que separa um game day real de teatro?',
        opcoes: [
          opc('a', 'A falha é injetada de verdade: o par deploy/rollback do B17 executa dentro do exercício', true, 'os eventos vêm da execução, não de um texto.'),
          opc('b', 'Ter muitos participantes', false, 'sem injeção real continua teatro.'),
          opc('c', 'Gravar a reunião', false, 'registro não prova execução.')] },
      { id: 'm13b18-pm', pergunta: 'Por que o postmortem é derivado da timeline?',
        opcoes: [
          opc('a', 'A timeline só aceita eventos em ordem, e o postmortem é calculado dela: não tem como divergir', true, 'reescrever depois transforma o postmortem em narrativa.'),
          opc('b', 'Para economizar tempo do escriba', false, 'o motivo é fidelidade, não tempo.'),
          opc('c', 'Porque o comunicador decide a causa raiz', false, 'quem registra é o escriba.')] },
      { id: 'm13b18-nogo', pergunta: 'Com uma área pendente, qual é a decisão do lab?',
        opcoes: [
          opc('a', 'NO-GO com plano de desbloqueio item a item; é resultado legítimo e testado', true, 'NO-GO impensável vira GO forçado sob pressão.'),
          opc('b', 'GO com ressalva', false, 'GO exige PRR 100% evidenciado e game day concluído.'),
          opc('c', 'Adiar sem registrar', false, 'o NO-GO e o plano são entrega.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Aprovado pelos slides</h3>' +
          '<p>Uma área é aprovada porque a apresentação foi convincente, e na primeira release ruim ninguém sabe reverter. O <strong>Production Readiness Review</strong> (PRR) existe para trocar a opinião por evidência.</p>' +
          '<h3>Modelo mental</h3>' +
          '<ul><li><strong>Matriz evidência-obrigatória:</strong> 10 áreas (arquitetura → rollback), cada uma com um caminho de evidência. <code>prr_report()</code> confere a existência no disco. Não existe parâmetro para "confiar em mim".</li>' +
          '<li><strong>Game day:</strong> exercício em que uma falha é injetada de verdade. Aqui, uma release ruim: o par deploy/rollback do B17 roda dentro do exercício.</li>' +
          '<li><strong>Papéis fixos:</strong> <code>incident_commander</code> (decide e coordena; único a declarar severidade), <code>executor</code> (executa o runbook, nunca improvisa sem comunicar), <code>comunicador</code> (atualiza stakeholders em cadência declarada) e <code>escriba</code> (registra tudo, na ordem).</li>' +
          '<li><strong>Timeline ordenada por construção:</strong> <code>registrar()</code> levanta <code>ValueError("timeline fora de ordem")</code>. O postmortem é derivado dela.</li>' +
          '<li><strong>Decisão:</strong> GO só com PRR 100% evidenciado e game day concluído (timeline com ao menos 5 eventos). Senão, NO-GO com o plano de desbloqueio item a item.</li></ul>' +
          '<p>As 10 áreas e suas evidências: arquitetura (B06), dependências (B02), capacidade (B16), segurança (B12), dados (B17), observabilidade (B14), operação (B17), acesso (B12), suporte (B15) e rollback (B17).</p>' },
        { tipo: 'ordene', id: 'b18-ordene', titulo: 'Ponha o game day na ordem', obrigatorio: false,
          enunciado: 'Ponha os eventos da timeline do game day na ordem em que o <code>game_day_release_ruim</code> os registra.',
          itens: [
            { id: 'rollback', texto: 't+5: executor registra o rollback executado' },
            { id: 'declara', texto: 't+0: incident_commander declara SEV-2 simulado' },
            { id: 'fecha', texto: 't+10: escriba fecha a timeline e deriva o postmortem' },
            { id: 'gate', texto: 't+2: executor registra que o health gate reprovou a release' },
            { id: 'comunica', texto: 't+7: comunicador informa que o serviço está estável em N-1' }
          ], solucao: ['declara', 'gate', 'rollback', 'comunica', 'fecha'],
          dica: 'Os minutos são 0, 2, 5, 7 e 10; o rollback só acontece depois de o gate reprovar.',
          tutorDepois: 'A ordem é o invariante: a timeline recusa um t menor que o último, e o postmortem herda essa ordem.' },
        { tipo: 'takeaway', html: 'PRR é <mark>evidência no disco</mark>; game day é <mark>falha de verdade</mark>; postmortem sai da <mark>timeline</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html: '<p>Execução registrada no bloco: PRR 10/10 evidenciado, game day SEV-2 simulado com rollback em t+5min, veredito GO, gravado em <code>prr-e-game-day.json</code>. Abaixo, os testes de <code>test_prr.py</code> como o bloco os lista.</p>' },
        { tipo: 'rode', id: 'b18-rode', titulo: 'Os cinco oráculos do PRR', enunciado: 'Aperte Enter. A saída reproduz a execução registrada no bloco.',
          prefixo: '$', entrada: 'uv run pytest tests/test_prr.py -v', unidade: 'testes', terminalTitulo: 'execução registrada no bloco (test_prr.py)',
          prever: { pergunta: 'Qual destes testes mostra que NO-GO não é falha do exercício?', opcoes: [
            { id: 'a', texto: 'test_checklist_cobre_as_dez_areas_exigidas', correta: false, porque: 'esse confere a cobertura das 10 áreas.' },
            { id: 'b', texto: 'test_no_go_e_resultado_legitimo_com_plano', correta: true, porque: 'com qualquer área pendente a decisão devolve NO-GO mais o plano de desbloqueio.' },
            { id: 'c', texto: 'test_timeline_rejeita_evento_fora_de_ordem', correta: false, porque: 'esse protege a ordem da timeline.' }
          ] },
          etapas: [
            { id: 'prr', nome: 'PRR', descricao: 'Matriz no disco', tom: 'request', ms: 2, linhas: [
              L('cmd', 'uv run pytest tests/test_prr.py -v'),
              L('out', 'test_checklist_cobre_as_dez_areas_exigidas PASSED'),
              L('out', 'test_prr_report_evidencia_existe_no_disco PASSED')] },
            { id: 'gd', nome: 'Game day', descricao: 'Injeção real e timeline', tom: 'response', ms: 5, linhas: [
              L('out', 'test_game_day_executa_de_verdade_e_postmortem_derivado PASSED'),
              L('out', 'test_timeline_rejeita_evento_fora_de_ordem PASSED')] },
            { id: 'dec', nome: 'Decisão', descricao: 'GO e NO-GO', tom: 'tcp', ms: 1, linhas: [
              L('out', 'test_no_go_e_resultado_legitimo_com_plano PASSED'),
              L('in', '5 passed'),
              L('hint', 'PRR 10/10 evidenciado, rollback em t+5min, veredito GO')] }
          ],
          tutorAntes: 'Responda a previsão e aperte Enter.',
          callout: 'Você viu os cinco oráculos: cobertura, evidência no disco, game day real, ordem e NO-GO legítimo.' },
        { tipo: 'takeaway', html: 'O veredito vem de <mark>checagem executável</mark>, não de reunião.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b18-python', titulo: 'PRR, timeline e veredito', obrigatorio: false,
          enunciado: 'Implemente <code>prr_report(checklist, existentes)</code>, <code>registrar(timeline, t, ator, descricao)</code> (levanta <code>ValueError</code> fora de ordem) e <code>decide(prr, timeline)</code>: GO só com PRR completo e ao menos 5 eventos; NO-GO devolve o plano por item pendente. Versão reduzida do <code>prr.py</code> do bloco, com um conjunto de caminhos no lugar do disco.',
          codigo: codigo, testes: testes,
          dica: 'A evidência existe quando o caminho está em <code>existentes</code>. O plano é uma frase por área pendente: <code>produzir evidencia para \'area\' e re-rodar PRR</code>.',
          solucao: solucao,
          tutorDepois: 'Não há parâmetro "aprovado": o ok sai da existência da evidência. O game day curto reprova o GO mesmo com o PRR completo.',
          callout: 'Seu PRR não aceita palavra, e seu NO-GO traz o caminho de volta.' },
        { tipo: 'cenario', id: 'b18-cenario', titulo: 'Sexta, 17h: PRR com uma área pendente', obrigatorio: false,
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O PRR deu 9/10: a área "dados" não tem evidência de restore exercitado. O lançamento é segunda cedo e o patrocinador pede o GO. O game day já fechou com rollback em t+5min.',
              opcoes: [
                { texto: 'Aprovar a área "dados" porque o time garante que o backup funciona.', vai: 'palavra', consequencia: 'Não existe parâmetro para "confiar em mim". Você acabou de criar um GO forçado.', tom: 'ruim' },
                { texto: 'Devolver NO-GO com o plano: produzir evidência para "dados" e re-rodar o PRR.', vai: 'plano', consequencia: 'O NO-GO com plano é entrega: diz o que falta e como destravar.', tom: 'ok' },
                { texto: 'Criar um arquivo vazio em <code>evidence/m13/B17</code> para o PRR passar.', vai: 'vazio', consequencia: 'A checagem de existência passa e a evidência não existe: você fraudou o oráculo.', tom: 'ruim' }
              ] },
            palavra: { texto: 'O sistema vai ao ar sem restore exercitado.', opcoes: [{ texto: 'Voltar e decidir de novo', vai: 'inicio', consequencia: 'Sem evidência, a área não aprova.', tom: 'ok' }] },
            vazio: { texto: 'O arquivo existe, o PRR dá 10/10 e o restore nunca foi exercitado.', opcoes: [{ texto: 'Voltar e decidir de novo', vai: 'inicio', consequencia: 'Evidência é artefato de execução, não um arquivo qualquer.', tom: 'ok' }] }
          },
          finais: {
            plano: { texto: 'NO-GO com plano de desbloqueio. Na segunda, o restore é exercitado, a evidência é gravada e o PRR vira 10/10 com GO.', bom: true }
          } },
        { tipo: 'transcript', id: 'b18-transcript', titulo: 'Relato de um game day', obrigatorio: false,
          enunciado: 'Leia o relato do game day e marque as linhas que quebram um invariante do bloco.',
          linhas: [
            { quem: 'agente', texto: 'incident_commander declarou SEV-2 simulado em t+0; o game day iniciou.' },
            { quem: 'agente', texto: 'O executor reescreveu o texto da timeline depois do fim para ficar mais claro.' },
            { quem: 'ferramenta', texto: 'registrar(t=3) após registrar(t=5) -> ValueError: timeline fora de ordem.' },
            { quem: 'agente', texto: 'A falha foi descrita no roteiro, mas nenhum deploy ou rollback foi executado; a timeline foi preenchida a mão.' },
            { quem: 'agente', texto: 'O postmortem foi derivado da timeline fechada pelo escriba.' }
          ],
          erradas: [1, 3],
          explicacao: { 1: 'timeline reescrita transforma o postmortem em narrativa; deriva-se dos eventos registrados em ordem.', 3: 'game day sem injeção real é teatro: a falha tem que executar.' } },
        { tipo: 'takeaway', html: '<mark>NO-GO com plano</mark> é entrega; GO forçado é <mark>dívida escondida</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b18-esc1', titulo: 'Área fácil de fraudar', pergunta: 'Qual é o risco de decidir o PRR por apresentação?',
          opcoes: [
            opc('a', 'Os slides decidem, não a evidência; a checagem tem que olhar o disco', true, 'é o primeiro item da tabela de diagnóstico do bloco.'),
            opc('b', 'A reunião demora demais', false, 'o problema é de correção, não de tempo.'),
            opc('c', 'Slides não podem ter gráficos', false, 'não é o ponto.')] },
        { tipo: 'escolha', id: 'b18-esc2', titulo: 'Papel do escriba', pergunta: 'Qual é a função do escriba no game day?',
          opcoes: [
            opc('a', 'Registrar a timeline: tudo que aconteceu, na ordem', true, 'é dela que o postmortem é derivado.'),
            opc('b', 'Declarar a severidade', false, 'só o incident commander declara.'),
            opc('c', 'Executar o runbook', false, 'é o executor.')] },
        { tipo: 'takeaway', html: 'Decisão com <mark>evidência existente</mark>, papéis fixos e <mark>timeline em ordem</mark>.' }
      ] }
    ]
  });
})();
