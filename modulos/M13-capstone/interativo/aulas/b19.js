/* M13 · Bloco 19: piloto com usuário e validação do problema, BLOCKED honesto. Fonte: M13.html#h-b19. Dados do python são exemplo didático, nunca piloto. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = String.raw`class PilotBlocked(RuntimeError):
    pass

def registrar(sessoes, s):
    # LACUNA: sem consentimento -> ValueError; tarefa_real vazia -> ValueError.
    sessoes.append(s)

def validacao(sessoes):
    # LACUNA: sem sessoes -> PilotBlocked. Com sessoes: n, ganho_medio_min (baseline - produto),
    # repetiriam e hipotese: "apoiada" se ganho > 0 e repetiriam >= n/2, senao "rejeitada".
    return {"n": len(sessoes), "hipotese": "apoiada"}

def decision_statement(sessoes):
    # LACUNA: BLOCKED honesto quando nao ha dado; "VALIDADO: ..." so com dado.
    return "VALIDADO"
`;
  var solucao = String.raw`class PilotBlocked(RuntimeError):
    pass

def registrar(sessoes, s):
    if not s["consentimento"]:
        raise ValueError("sessao sem consentimento nao e registrada")
    if not s["tarefa_real"].strip():
        raise ValueError("tarefa real obrigatoria")
    sessoes.append(s)

def validacao(sessoes):
    if not sessoes:
        raise PilotBlocked("BLOCKED: sem sessao humana real consentida")
    n = len(sessoes)
    delta = sum(s["baseline_min"] - s["produto_min"] for s in sessoes) / n
    rep = sum(1 for s in sessoes if s["repetir"])
    return {"n": n, "ganho_medio_min": round(delta, 2), "repetiriam": rep,
            "hipotese": "apoiada" if delta > 0 and rep >= n / 2 else "rejeitada"}

def decision_statement(sessoes):
    try:
        rel = validacao(sessoes)
    except PilotBlocked as exc:
        return str(exc)
    return "VALIDADO: " + str(rel)
`;
  var testes = String.raw`def sessao(base, prod, repetir, consent=True, tarefa="achar quem chama a funcao"):
    return {"consentimento": consent, "tarefa_real": tarefa, "baseline_min": base,
            "produto_min": prod, "repetir": repetir}

def test_sem_humano_e_blocked_estrutural():
    try:
        validacao([])
    except PilotBlocked:
        assert decision_statement([]).startswith("BLOCKED")
        return
    assert False, "deveria levantar PilotBlocked"

def test_sessao_sem_consentimento_e_recusada():
    log = []
    for ruim in (sessao(10, 5, True, consent=False), sessao(10, 5, True, tarefa="  ")):
        try:
            registrar(log, ruim)
        except ValueError:
            continue
        assert False, "deveria recusar"
    assert log == []

def test_hipotese_apoiada_com_dados_de_exemplo():
    log = []
    for s in (sessao(10, 6, True), sessao(12, 8, True), sessao(9, 9, False)):
        registrar(log, s)
    r = validacao(log)
    assert r["n"] == 3 and r["ganho_medio_min"] == 2.67 and r["hipotese"] == "apoiada"
    assert decision_statement(log).startswith("VALIDADO")

def test_hipotese_rejeitada_e_ramo_legitimo():
    log = []
    registrar(log, sessao(5, 9, False))
    registrar(log, sessao(6, 8, False))
    assert validacao(log)["hipotese"] == "rejeitada"

def test_controle_negativo_ganho_sem_vontade_de_repetir():
    log = []
    registrar(log, sessao(10, 4, False))
    registrar(log, sessao(10, 4, False))
    assert validacao(log)["hipotese"] == "rejeitada"
`;

  TrilhaAula.registrar({
    id: 'm13-b19',
    titulo: 'Piloto com usuário e validação do problema (BLOCKED honesto)',
    minutos: 25,
    resumo: 'Sem humano real neste ambiente, validar o problema é impossível. O bloco torna isso estrutural: sem sessão consentida, a validação levanta exceção e o VALIDADO fabricado não existe.',
    objetivo: 'Explicar o BLOCKED como tipo de dado e exceção, o papel do consentimento e do baseline, e por que hipótese rejeitada é resultado legítimo.',
    revisao: [
      { id: 'm13b19-blocked', pergunta: 'Como o BLOCKED do piloto é garantido?',
        opcoes: [
          opc('a', 'Estruturalmente: <code>PilotLog.validacao()</code> levanta <code>PilotBlocked</code> quando não há sessão consentida', true, 'o BLOCKED é um tipo de dado e uma exceção, não um texto no markdown.'),
          opc('b', 'Por uma nota no README', false, 'texto não impede a validação fabricada.'),
          opc('c', 'Por revisão humana antes do release', false, 'a garantia é do código.')] },
      { id: 'm13b19-consent', pergunta: 'O que acontece com uma sessão sem consentimento?',
        opcoes: [
          opc('a', 'É recusada no registro (<code>ValueError</code>); o dado seria inválido e antiético', true, 'consentimento é pré-requisito de esquema.'),
          opc('b', 'É registrada com um aviso', false, 'sessão sem consentimento não é registrada.'),
          opc('c', 'Entra só no agregado', false, 'não entra em lugar nenhum.')] },
      { id: 'm13b19-exemplo', pergunta: 'Os testes calculam um scorecard com dados de exemplo. Isso valida o problema?',
        opcoes: [
          opc('a', 'Não: o dado de exemplo é didático, rotulado como exemplo, nunca piloto', true, 'o scorecard está testado; o problema segue sem validação.'),
          opc('b', 'Sim, se o n for maior que 5', false, 'o n não troca dado real por dado de exemplo.'),
          opc('c', 'Sim, o scorecard calculou o resultado', false, 'calcular não é observar humanos.')] },
      { id: 'm13b19-rej', pergunta: 'Por que o scorecard precisa do ramo "rejeitada"?',
        opcoes: [
          opc('a', 'Hipótese que nunca pode ser rejeitada não é ciência; rejeitar é resultado legítimo', true, 'a hipótese só é "apoiada" com ganho positivo e repetição em ao menos metade das sessões.'),
          opc('b', 'Para ter dois estados na tela', false, 'a razão é de método.'),
          opc('c', 'Para desencorajar pilotos', false, 'o objetivo é decidir com dados.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>O depoimento que ninguém deu</h3>' +
          '<p>O prazo aperta, o scorecard já funciona, e a tentação é registrar o problema como validado. <strong>BLOCKED</strong> é o estado honesto de um bloco que depende de algo que o ambiente não tem: aqui, um humano real.</p>' +
          '<h3>Modelo mental</h3>' +
          '<ul><li><strong>BLOCKED estrutural:</strong> <code>PilotLog.validacao()</code> levanta <code>PilotBlocked</code> sem sessão consentida. Impossível obter um "VALIDADO" fabricado por acidente ou pressa.</li>' +
          '<li><strong>Consentimento no esquema:</strong> a sessão sem consentimento é recusada no registro, e a tarefa real é obrigatória. O participante é pseudonimizado, nunca nome real.</li>' +
          '<li><strong>Baseline:</strong> o tempo medido antes, sem o produto. Sem ele o scorecard não mede ganho.</li>' +
          '<li><strong>Hipótese:</strong> "apoiada" se o ganho médio é positivo e ao menos metade repetiria; senão "rejeitada".</li>' +
          '<li><strong>Kit de recrutamento:</strong> roteiro de observação em 5 passos, texto de consentimento, canais, recompensa e critérios (usa repositórios Python no dia a dia, não é o autor, assinou consentimento). Está pronto para o dia em que houver humano e é validado por oráculo estrutural.</li></ul>' +
          '<p><strong>Limite:</strong> o scorecard foi exercitado só com dados <strong>rotulados como exemplo didático</strong>. A decisão do bloco, gravada em <code>decision-statement.txt</code>, é BLOCKED com a frase exata.</p>' },
        { tipo: 'ordene', id: 'b19-ordene', titulo: 'Ponha o roteiro de observação na ordem', obrigatorio: false,
          enunciado: 'Ponha os cinco passos do roteiro de observação do kit na ordem do <code>DEFAULT_KIT</code>.',
          itens: [
            { id: 'score', texto: 'Aplicar o scorecard de feedback ao final' },
            { id: 'contexto', texto: 'Apresentar o contexto sem instrução de uso' },
            { id: 'pergunta', texto: 'Observar a primeira pergunta e a leitura do relatório' },
            { id: 'dif', texto: 'Coletar dificuldades, confusões e abandonos em tempo real' },
            { id: 'cadastro', texto: 'Observar cadastro e ingestão sem intervenção do autor' }
          ], solucao: ['contexto', 'cadastro', 'pergunta', 'dif', 'score'],
          dica: 'Começa sem instrução e termina com o scorecard; a coleta de dificuldades vem antes dele.',
          tutorDepois: 'O autor não intervém durante a observação: instrução prévia ou ajuda contaminam o que se mede.' },
        { tipo: 'takeaway', html: 'O <mark>BLOCKED</mark> é um tipo de dado, não uma <mark>frase no README</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html: '<p>Execução registrada no bloco: 6 testes de <code>test_pilot.py</code> passam, e a decisão gravada é BLOCKED. A saída abaixo reproduz essa lista.</p>' },
        { tipo: 'rode', id: 'b19-rode', titulo: 'Seis oráculos e uma decisão', enunciado: 'Aperte Enter. A saída reproduz a execução registrada no bloco.',
          prefixo: '$', entrada: 'uv run pytest tests/test_pilot.py -v', unidade: 'testes', terminalTitulo: 'execução registrada no bloco (test_pilot.py)',
          prever: { pergunta: 'Qual é a decisão final do bloco, sem humano real no ambiente?', opcoes: [
            { id: 'a', texto: 'VALIDADO, com o kit de recrutamento como prova', correta: false, porque: 'o kit é preparação, não observação.' },
            { id: 'b', texto: 'BLOCKED, com a frase exata gravada em decision-statement.txt', correta: true, porque: 'sem sessão consentida a validação levanta PilotBlocked.' },
            { id: 'c', texto: 'Hipótese rejeitada', correta: false, porque: 'rejeitar também exige dados; sem humano não há decisão.' }
          ] },
          etapas: [
            { id: 'ger', nome: 'Oráculos', descricao: 'Testes do piloto', tom: 'request', ms: 3, linhas: [
              L('cmd', 'uv run pytest tests/test_pilot.py -v'),
              L('out', 'test_blocked_estrutural_sem_humano PASSED'),
              L('out', 'test_kit_recrutamento_pronto_e_validavel PASSED'),
              L('out', 'test_kit_incompleto_e_denunciado PASSED'),
              L('out', 'test_sessao_sem_consentimento_e_recusada PASSED'),
              L('out', 'test_validacao_com_sessao_hipotetica_marca_decisao PASSED'),
              L('out', 'test_decisao_statement_reflete_estado_real PASSED'),
              L('in', '6 passed')] },
            { id: 'dec', nome: 'Decisão', descricao: 'decision-statement.txt', tom: 'response', ms: 1, linhas: [
              L('info', 'decisão do bloco: BLOCKED (sem sessão humana real consentida)'),
              L('hint', 'os dados dos testes são exemplo didático, nunca piloto')] }
          ],
          tutorAntes: 'Responda a previsão e aperte Enter.',
          callout: 'Você viu o BLOCKED como decisão testada, não como pendência escondida.' },
        { tipo: 'takeaway', html: 'Kit <mark>pronto</mark> e scorecard <mark>testado</mark>: falta o humano, e o código <mark>sabe disso</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b19-python', titulo: 'Piloto que não valida sem humano', obrigatorio: false,
          enunciado: 'Implemente <code>registrar</code>, <code>validacao</code> e <code>decision_statement</code> sobre uma lista de sessões (dicts). Dados dos testes são <strong>exemplo didático</strong>, nunca piloto. Versão reduzida do <code>pilot.py</code> do bloco.',
          codigo: codigo, testes: testes,
          dica: 'Sem sessões, levante <code>PilotBlocked</code> em <code>validacao</code> e capture-a em <code>decision_statement</code>. Apoiada: <code>delta &gt; 0 and rep &gt;= n / 2</code>.',
          solucao: solucao,
          tutorDepois: 'O estado "validado" só é alcançável passando por sessões consentidas: não existe atalho.',
          callout: 'Sua função se recusa a validar sem humano e ainda sabe rejeitar a hipótese.' },
        { tipo: 'cenario', id: 'b19-cenario', titulo: 'O investidor quer a frase "validado com usuários"', obrigatorio: false,
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Faltam dois dias para a demo. O scorecard roda com 3 sessões de exemplo e mostra "hipótese apoiada". O README pede uma linha sobre o piloto.',
              opcoes: [
                { texto: 'Escrever "validado com usuários" citando o resultado do scorecard.', vai: 'fraude', consequencia: 'Dado de exemplo apresentado como piloto é fraude. O BLOCKED estrutural existe para impedir isso.', tom: 'ruim' },
                { texto: 'Declarar "piloto BLOCKED: sem sessão humana real; kit de recrutamento e scorecard prontos" e rotular os dados como exemplo.', vai: 'honesto', consequencia: 'A frase é verificável: o código levanta PilotBlocked sem sessão consentida.', tom: 'ok' },
                { texto: 'Pedir a três colegas que "testem" sem consentimento nem baseline.', vai: 'sem', consequencia: 'Sessão sem consentimento é recusada no esquema, e sem baseline não há ganho medido.', tom: 'ruim' }
              ] },
            fraude: { texto: 'Alguém na defesa pergunta quantas sessões consentidas existem. A resposta é zero.', opcoes: [{ texto: 'Voltar e decidir de novo', vai: 'inicio', consequencia: 'Depoimento fabricado destrói a credibilidade do dossier inteiro.', tom: 'ok' }] },
            sem: { texto: 'Os dados saem inválidos e antiéticos: nenhum entra no scorecard.', opcoes: [{ texto: 'Voltar e decidir de novo', vai: 'inicio', consequencia: 'O consentimento é pré-requisito de esquema, não formalidade.', tom: 'ok' }] }
          },
          finais: {
            honesto: { texto: 'A defesa recebe a pergunta sobre o piloto e responde com BLOCKED, o motivo e o kit pronto. É uma resposta que se sustenta.', bom: true }
          } },
        { tipo: 'takeaway', html: 'Prazo apertado não vira <mark>VALIDADO</mark>: vira <mark>BLOCKED declarado</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b19-esc1', titulo: 'Scorecard sem baseline', pergunta: 'O scorecard registra o tempo com o produto, mas não o tempo antes. O que falta?',
          opcoes: [
            opc('a', 'A baseline manual, medida sem o produto: sem ela o scorecard não mede ganho', true, 'ganho é <code>baseline_min - produto_min</code>.'),
            opc('b', 'Mais participantes', false, 'sem baseline, mais n não mede ganho.'),
            opc('c', 'Nada, o tempo com produto basta', false, 'sem comparação não há ganho.')] },
        { tipo: 'escolha', id: 'b19-esc2', titulo: 'Depoimento', pergunta: 'Qual é a "vacina" do bloco contra o depoimento fabricado?',
          opcoes: [
            opc('a', 'O BLOCKED estrutural: sem sessão consentida, nenhuma função devolve validação', true, 'a honestidade é garantida pelo tipo de dado e pela exceção.'),
            opc('b', 'Pedir ao time para não exagerar', false, 'confiança não é controle.'),
            opc('c', 'Revisar o texto do README', false, 'a garantia está no código.')] },
        { tipo: 'takeaway', html: 'Consentimento no <mark>esquema</mark>, baseline obrigatória e <mark>rejeitar</mark> como ramo legítimo.' }
      ] }
    ]
  });
})();
