/* M00 · Bloco 5: Loop operacional e critérios de evidência. Fonte: M00.html#b05. Saídas do harness_lab são execuções reais do laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var OK = 'python -m harness_lab validate examples/harness.safe.json';
  var BAD = 'python -m harness_lab validate examples/harness.invalid.json';

  var etapasLoop = function () {
    return [
      { id: 'inspect', nome: 'Inspect', descricao: 'Instruções, git, testes próximos', tom: 'dns', ms: 20, linhas: [
        L('info', 'lê AGENTS.md, git status e os testes próximos ao parser'),
        L('hint', 'sem editar nada ainda')] },
      { id: 'plan', nome: 'Plan', descricao: 'Mudança mínima, riscos, verificadores', tom: 'tcp', ms: 15, linhas: [
        L('info', 'mudança mínima: contrato de harness; verificador: validate no JSON seguro'),
        L('hint', 'riscos e arquivos declarados antes de mudar')] },
      { id: 'change', nome: 'Change', descricao: 'Patch pequeno, trabalho alheio preservado', tom: 'tls', ms: 30, linhas: [
        L('info', 'aplica o patch no arquivo do contrato, sem tocar em arquivos de outras pessoas'),
        L('hint', 'diff pequeno e atribuível')] },
      { id: 'verify', nome: 'Verify', descricao: 'Checks proporcionais ao risco', tom: 'request', ms: 40, linhas: [
        L('out', 'VALID examples/harness.safe.json'), L('hint', 'exit=0')] },
      { id: 'review', nome: 'Review', descricao: 'Diff lido como revisor adversarial', tom: 'response', ms: 25, linhas: [
        L('info', 'lê o diff procurando escopo acidental: nenhum arquivo fora do contrato'),
        L('hint', 'busca ativa por mudança lateral')] },
      { id: 'evidence', nome: 'Evidence', descricao: 'Comandos, saídas, limitações, riscos', tom: 'ink', ms: 10, linhas: [
        L('info', 'relato: comando validate, exit=0, 1 arquivo alterado, risco residual: contrato não cobre o host'),
        L('hint', 'o que foi rodado, o que saiu e o que não foi coberto')] }
    ];
  };

  var codigoScore = [
    'def scorecard(linhas):', '    """Por configuração: execucoes, passou, taxa, intervencoes_medias e violacoes.',
    '', '    Cada linha: {"tarefa", "config", "repeticao", "passou", "intervencoes", "violacoes"}.', '    """',
    '    out = {}', '    for l in linhas:',
    '        c = out.setdefault(l["config"], {"execucoes": 0, "passou": 0, "intv": 0, "violacoes": 0})',
    '        c["execucoes"] += 1', '        c["passou"] += 1 if l["passou"] else 0',
    '        c["intv"] += l["intervencoes"]', '        c["violacoes"] += l["violacoes"]',
    '    for c in out.values():',
    '        # taxa de aprovação e média de intervenções humanas por execução',
    '        c["taxa"] = 0.0', '        c["intervencoes_medias"] = 0.0', '        del c["intv"]',
    '    return out', '', '',
    'def comparavel(linhas):',
    '    """True só se há >= 3 tarefas, exatamente 2 configurações e >= 3 repetições por tarefa e configuração."""',
    '    return True', '',
    'print(scorecard([{"tarefa": "t1", "config": "A", "repeticao": 1, "passou": True, "intervencoes": 1, "violacoes": 0}]))', ''].join('\n');
  var testesScore = [
    'def linha(t, c, r, p, i=0, v=0):',
    '    return {"tarefa": t, "config": c, "repeticao": r, "passou": p, "intervencoes": i, "violacoes": v}', '', '',
    'def completo():',
    '    return [linha(t, c, r, p=(c == "A" or r > 1), i=(1 if c == "A" else 2), v=(0 if c == "A" else 1))',
    '            for t in ("t1", "t2", "t3") for c in ("A", "B") for r in (1, 2, 3)]', '', '',
    'def test_scorecard_taxa_e_media():',
    '    s = scorecard(completo())', '    assert s["A"]["execucoes"] == 9 and s["A"]["taxa"] == 1.0',
    '    assert abs(s["B"]["taxa"] - 6 / 9) < 1e-9 and s["B"]["intervencoes_medias"] == 2 and s["B"]["violacoes"] == 9', '', '',
    'def test_comparacao_completa_vale():',
    '    assert comparavel(completo()) is True', '', '',
    'def test_uma_execucao_e_anedota():',
    '    assert comparavel([linha("t1", "A", 1, True), linha("t1", "B", 1, False)]) is False', '', '',
    'def test_borda_duas_repeticoes_nao_bastam():',
    '    assert comparavel([l for l in completo() if l["repeticao"] != 3]) is False', '', '',
    'def test_controle_negativo_tres_configuracoes():',
    '    extra = [linha(t, "C", r, True) for t in ("t1", "t2", "t3") for r in (1, 2, 3)]',
    '    assert comparavel(completo() + extra) is False', ''].join('\n');
  var solucaoScore = [
    'def scorecard(linhas):', '    out = {}', '    for l in linhas:',
    '        c = out.setdefault(l["config"], {"execucoes": 0, "passou": 0, "intv": 0, "violacoes": 0})',
    '        c["execucoes"] += 1', '        c["passou"] += 1 if l["passou"] else 0',
    '        c["intv"] += l["intervencoes"]', '        c["violacoes"] += l["violacoes"]',
    '    for c in out.values():',
    '        c["taxa"] = c["passou"] / c["execucoes"]', '        c["intervencoes_medias"] = c["intv"] / c["execucoes"]', '        del c["intv"]',
    '    return out', '', '',
    'def comparavel(linhas):',
    '    configs = {l["config"] for l in linhas}', '    tarefas = {l["tarefa"] for l in linhas}',
    '    if len(configs) != 2 or len(tarefas) < 3:', '        return False',
    '    reps = {}', '    for l in linhas:', '        k = (l["tarefa"], l["config"])', '        reps[k] = reps.get(k, 0) + 1',
    '    return all(reps.get((t, c), 0) >= 3 for t in tarefas for c in configs)', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm00-b5',
    titulo: 'Loop operacional e critérios de evidência',
    minutos: 35,
    resumo: 'O loop é mais importante que a marca do agente. Se o harness não mostra diff, comando e resultado, a velocidade aparente é dívida de verificação transferida ao humano.',
    objetivo: 'Executar e ordenar o loop Inspect, Plan, Change, Verify, Review e Evidence, saber quando parar e comparar dois harnesses sem confundir modelo, tarefa e ambiente.',
    revisao: [
      { id: 'm00b5-loop', pergunta: 'Qual é a ordem do loop de um engenheiro assistido por IA?',
        opcoes: [
          opc('a', 'Inspect, Plan, Change, Verify, Review, Evidence', true, 'inspeciona antes de planejar, verifica antes de revisar e só então relata a evidência.'),
          opc('b', 'Change, Verify, Plan, Evidence, Inspect, Review', false, 'mudar antes de inspecionar e planejar é o caminho do escopo acidental.'),
          opc('c', 'Plan, Change, Evidence, Verify, Review, Inspect', false, 'a evidência vem depois da verificação e da revisão.')] },
      { id: 'm00b5-parar', pergunta: 'Qual destes casos exige que o agente PARE e peça decisão?',
        opcoes: [
          opc('a', 'Há duas interpretações do pedido que mudam o produto', true, 'pare quando faltar autoridade, houver ambiguidade de produto, segredo ou dado regulado, ambiente indisponível ou conflito com trabalho do usuário.'),
          opc('b', 'Um teste falha e dá para reproduzir com um comando reversível', false, 'dúvida que se resolve por teste reversível é para continuar sozinho.'),
          opc('c', 'Falta um import e a convenção do projeto é conhecida', false, 'convenção conhecida dentro do contrato: continue.')] },
      { id: 'm00b5-anedota', pergunta: 'Você roda a mesma tarefa uma vez com o harness A (passou) e uma vez com o B (falhou). Que conclusão é válida?',
        opcoes: [
          opc('a', 'Nenhuma comparação séria: uma execução é anedota; repita cada tarefa várias vezes em configurações isoladas e registre ameaças à validade', true, '“B é melhor” não se conclui com uma amostra; estatística de evals fica para o M06.'),
          opc('b', 'A é melhor que B', false, 'uma execução não sustenta a conclusão.'),
          opc('c', 'A diferença prova que o modelo é não determinístico, logo medir não adianta', false, 'a resposta não é desistir de medir, e sim repetir e registrar a validade.')] },
      { id: 'm00b5-metodo', pergunta: 'Para comparar dois harnesses, o que se preserva?',
        opcoes: [
          opc('a', 'Modelo e tarefa ao comparar harness; harness ao comparar modelo', true, 'senão a diferença observada não pode ser atribuída ao que se quer comparar.'),
          opc('b', 'Apenas o nome da ferramenta', false, 'o nome não isola nenhuma variável.'),
          opc('c', 'Nada: cada execução usa o que estiver disponível', false, 'sem isolamento, a comparação é ruído.')] },
      { id: 'm00b5-evidencia', pergunta: 'O que o loop deve ser capaz de mostrar para que a velocidade não vire dívida de verificação?',
        opcoes: [
          opc('a', 'Diff, comando e resultado', true, 'se o harness não mostra os três, o humano precisa reconstruir o que aconteceu.'),
          opc('b', 'Só a mensagem final do agente', false, '“parece corrigido” não é evidência repetível.'),
          opc('c', 'Apenas o tempo gasto', false, 'tempo sem evidência verde é parar quando “parece pronto”.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O módulo fecha com o loop de um <strong>engenheiro</strong>, não de um gerador de código. São seis passos, e a ordem é parte do método:</p>' +
          '<ol><li><strong>Inspect:</strong> localizar instruções, estado do git, arquitetura e testes próximos.</li>' +
          '<li><strong>Plan:</strong> declarar mudança mínima, riscos, arquivos e verificadores.</li>' +
          '<li><strong>Change:</strong> aplicar patches pequenos, preservando trabalho alheio.</li>' +
          '<li><strong>Verify:</strong> executar checks proporcionais ao risco; não inventar resultado.</li>' +
          '<li><strong>Review:</strong> ler o diff como revisor adversarial e buscar escopo acidental.</li>' +
          '<li><strong>Evidence:</strong> relatar comandos, saídas, limitações e próximos riscos.</li></ol>' +
          '<p>O loop é mais importante que a marca do agente. Se o harness não consegue mostrar diff, comando e resultado, a velocidade aparente é dívida de verificação transferida ao humano.</p>' },
        { tipo: 'texto', html:
          '<h3>Quando parar</h3>' +
          '<p>Persistência não é autonomia ilimitada. <strong>Pare e peça decisão</strong> quando:</p>' +
          '<ul><li>faltar autoridade para efeito externo;</li><li>houver duas interpretações que mudam o produto;</li><li>aparecer segredo ou dado regulado;</li><li>a verificação exigir ambiente indisponível;</li><li>o diff revelar trabalho do usuário em conflito.</li></ul>' +
          '<p><strong>Continue sozinho</strong> quando a dúvida puder ser resolvida por leitura, por teste reversível ou por escolha convencional dentro do contrato.</p>' },
        { tipo: 'ordene', id: 'm00b5-ordene', titulo: 'Ponha o loop na ordem',
          enunciado: 'Use os botões para pôr os seis passos do loop na ordem correta e confira.',
          itens: [
            { id: 'verify', texto: 'Verify: executar checks proporcionais ao risco' },
            { id: 'inspect', texto: 'Inspect: instruções, estado do git, arquitetura e testes próximos' },
            { id: 'evidence', texto: 'Evidence: relatar comandos, saídas e limitações' },
            { id: 'change', texto: 'Change: aplicar patches pequenos' },
            { id: 'review', texto: 'Review: ler o diff como revisor adversarial' },
            { id: 'plan', texto: 'Plan: mudança mínima, riscos e verificadores' }
          ], solucao: ['inspect', 'plan', 'change', 'verify', 'review', 'evidence'],
          tutorDepois: 'Inspect e Plan vêm antes de qualquer mudança; Verify vem antes de Review porque o revisor adversarial lê um diff que já passou pelos checks; Evidence fecha, com o que foi rodado e o que ficou sem cobertura.',
          callout: 'Loop na ordem: inspecionar, planejar, mudar, verificar, revisar e relatar.' },
        { tipo: 'takeaway', html: 'O <mark>loop</mark> vale mais que a marca do agente: <mark>diff, comando e resultado</mark> têm de aparecer.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Percorra o loop numa tarefa pequena do laboratório: ajustar o contrato de harness. O passo Verify roda o validador real; as demais etapas descrevem o que o agente faz. Depois injete as falhas e veja o que o loop exige em cada uma.</p>' },
        { tipo: 'quebre', id: 'm00b5-quebre', titulo: 'O loop quando a verificação falha ou a decisão não é do agente', enunciado: 'Escolha uma falha, rode, e depois rode “Sem falha”. O Verify usa a saída real do <code>harness_lab</code>; na falha de verificação, são mostradas as três primeiras das dez linhas reais.',
          prefixo: '$', entrada: OK, unidade: 'ms', terminalTitulo: 'loop do engenheiro', etapas: etapasLoop(),
          prever: { pergunta: 'No Verify, o validador devolve exit 1. O que o relato de Evidence pode dizer?', opcoes: [
            { id: 'a', texto: 'Que a tarefa está pronta, porque o patch foi aplicado.', correta: false, porque: 'verificação vermelha não permite declarar pronto.' },
            { id: 'b', texto: 'Que a verificação falhou, com o comando, a saída e o que falta corrigir.', correta: true, porque: 'Evidence relata comandos, saídas e limitações, e a verificação não pode ser inventada.' },
            { id: 'c', texto: 'Nada: a Evidence só existe quando passa.', correta: false, porque: 'o relato de uma falha é evidência tão importante quanto o de um sucesso.' }
          ] },
          falhas: [
            { id: 'vermelho', rotulo: 'Verify falha (exit 1)', efeito: { etapaFalha: 'verify', linhasErro: [
              { kind: 'cmd', text: BAD },
              { kind: 'out', text: 'MISSING_OBJECTIVE: informe o objetivo da tarefa' },
              { kind: 'out', text: 'MISSING_IN_SCOPE: informe valores não vazios' },
              { kind: 'out', text: 'MISSING_OUT_OF_SCOPE: informe valores não vazios' },
              { kind: 'hint', text: '(7 linhas omitidas) exit=1' }
            ], tutor: 'o loop não segue para Review como se nada tivesse acontecido: volta para Change, ou relata a falha em Evidence com o comando, a saída e o que não foi coberto. Inventar “passou” é o erro que o passo Verify existe para impedir.' } },
            { id: 'ambiguo', rotulo: 'Duas interpretações que mudam o produto', efeito: { etapaFalha: 'plan', linhasErro: [
              { kind: 'info', text: 'o pedido admite duas leituras: relaxar a validação de CPF ou rejeitar CPF formatado com pontuação' },
              { kind: 'info', text: 'PARAR: pedir decisão sobre o comportamento esperado' },
              { kind: 'hint', text: 'nenhuma mudança foi feita; a pergunta é uma decisão de produto' }
            ], tutor: 'a dúvida não se resolve por leitura nem por teste reversível: muda o produto. Continuar sozinho seria inventar a decisão para não parar. A condição de parada do task contract existe para este caso.' } }
          ],
          tutorAntes: 'Aperte Enter para ver o loop passar; depois escolha cada falha, rode e leia o que o loop exige.',
          tutorDepois: 'Sem falha, o loop termina com um relato verificável. Com verificação vermelha, o relato descreve a falha. Com ambiguidade de produto, o agente para e pergunta.',
          callout: 'Você viu o loop passar, relatar uma falha e parar diante de uma decisão que não era dele.' },
        { tipo: 'transcript', id: 'm00b5-transcript', titulo: 'Ache o relato sem evidência', obrigatorio: false, terminalTitulo: 'sessão: ajuste do contrato',
          enunciado: 'O agente fecha a tarefa dizendo que está tudo verificado. Uma das afirmações dele não é sustentada pela sessão. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Ajuste o contrato do harness. Entregue diff, comandos e resultados.' },
            { quem: 'agente', texto: 'Alterei só examples/harness.safe.json.' },
            { quem: 'ferramenta', texto: '$ git diff --stat\n examples/harness.safe.json | 2 +-' },
            { quem: 'agente', texto: 'Verifiquei o contrato e está VALID; os testes do projeto também passam.' },
            { quem: 'ferramenta', texto: '$ python -m harness_lab validate examples/harness.safe.json\nVALID examples/harness.safe.json' }
          ],
          erradas: [3],
          explicacao: { 3: 'a sessão mostra o <code>validate</code> do contrato, mas nenhum teste do projeto foi executado. “Os testes também passam” é uma afirmação sem comando nem saída: inventar resultado é exatamente o que o passo Verify proíbe. Em Evidence, relate o que foi rodado e liste o que ficou sem cobertura.' },
          tutorDepois: 'Cada afirmação de resultado precisa de um comando e de uma saída na sessão.' },
        { tipo: 'takeaway', html: 'A falha <mark>relatada</mark> é evidência; o resultado <mark>inventado</mark> é o que o Verify existe para impedir.' }
      ] },

      { rotulo: 'Avaliar o harness', blocos: [
        { tipo: 'texto', html:
          '<p>Uma demonstração bem-sucedida é anedota. Para avaliar um harness como sistema, monte <strong>três tarefas pequenas</strong> e repita cada uma <strong>pelo menos três vezes em duas configurações isoladas</strong>. Preserve modelo e tarefa quando comparar harness; preserve harness quando comparar modelo.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Métrica</th><th>Como observar</th><th>Armadilha</th></tr></thead><tbody>' +
          '<tr><td>correção</td><td>testes e critérios de aceitação</td><td>cobertura sem valor</td></tr>' +
          '<tr><td>intervenções</td><td>quantas correções humanas foram necessárias</td><td>contar aprovação prevista como falha</td></tr>' +
          '<tr><td>escopo</td><td>arquivos/linhas fora do necessário</td><td>premiar diff grande</td></tr>' +
          '<tr><td>segurança</td><td>tentativas e violações de capability</td><td>ignorar ação bloqueada</td></tr>' +
          '<tr><td>tempo</td><td>wall-clock até evidência verde</td><td>parar quando “parece pronto”</td></tr>' +
          '<tr><td>custo</td><td>tokens/API/compute quando disponíveis</td><td>comparar planos e caches diferentes</td></tr>' +
          '</tbody></table>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          '| tarefa | config | repetição | passou | intervenções | violações | tempo_s | notas |',
          '|---|---|---:|---|---:|---:|---:|---|',
          '| corrigir parser | A | 1 | sim | 1 | 0 | 94 | pediu arquivo ausente |',
          '| corrigir parser | B | 1 | não | 2 | 1 | 130 | alterou API pública |'].join('\n') },
        { tipo: 'texto', html:
          '<p>O scorecard acima é um formato de registro, com valores de exemplo. Você não concluirá “B é melhor” com uma amostra: o objetivo do M00 é adquirir a disciplina de medir e registrar as <em>ameaças à validade</em>. Evals estatísticas e datasets maiores são tema do M06.</p>' },
        { tipo: 'python', id: 'm00b5-python', titulo: 'Escreva o scorecard e o critério de comparação', obrigatorio: false,
          enunciado: 'Complete <code>scorecard(linhas)</code> (taxa de aprovação e média de intervenções por configuração) e <code>comparavel(linhas)</code>, que só aceita a comparação com pelo menos 3 tarefas, exatamente 2 configurações e pelo menos 3 repetições por tarefa e configuração. Os dados dos testes são sintéticos.',
          codigo: codigoScore, testes: testesScore,
          dica: 'Taxa é <code>passou / execucoes</code>; a média é <code>intv / execucoes</code>. Em <code>comparavel</code>, conte repetições por <code>(tarefa, config)</code> e exija o mínimo em todas as combinações, não só na média.',
          solucao: solucaoScore,
          tutorDepois: 'O critério exige o mínimo em cada combinação tarefa e configuração, e rejeita três configurações: sem isolamento, a diferença não é atribuível.',
          callout: 'O critério recusa a anedota e aceita só a comparação com repetições suficientes.' },
        { tipo: 'takeaway', html: 'Uma execução é <mark>anedota</mark>; compare com <mark>repetições</mark>, configurações isoladas e <mark>ameaças à validade</mark> registradas.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Antes de executar o laboratório</h3>' +
          '<p>O laboratório do módulo não introduz conceito novo: ele torna as decisões acima observáveis. O roteiro usa PowerShell no Windows, cria uma cópia temporária e só depois instala dependências ou executa comandos. Se uma validação falhar, o próprio passo informa qual arquivo ou fronteira investigar. O checkpoint fica depois do laboratório e cobra decisão e diagnóstico, não a memorização da sequência de comandos.</p>' },
        { tipo: 'escolha', id: 'm00b5-escolha-anedota', titulo: 'Confira: uma execução de cada',
          pergunta: 'Você repete a mesma tarefa uma vez com o harness A (passou) e uma vez com o B (falhou). Que conclusão é válida?',
          opcoes: [
            { id: 'a', texto: 'A é melhor que B.', correta: false, porque: 'uma execução não sustenta a conclusão.' },
            { id: 'b', texto: 'Nenhuma comparação séria: uma execução é anedota; repita cada tarefa várias vezes em configurações isoladas e registre ameaças à validade.', correta: true, porque: 'o módulo é explícito: “B é melhor” não se conclui com uma amostra.' },
            { id: 'c', texto: 'B está quebrado e deve ser descartado.', correta: false, porque: 'descartar por uma execução é ruído tratado como sinal.' },
            { id: 'd', texto: 'A diferença prova que o modelo é não determinístico, logo medir não adianta.', correta: false, porque: 'a resposta não é desistir de medir, e sim repetir (pelo menos 3 vezes por tarefa) e preservar as demais variáveis.' }
          ], tutorDepois: 'Repetir e registrar a validade é a disciplina; a estatística de evals vem no M06.' },
        { tipo: 'escolha', id: 'm00b5-escolha-parar', titulo: 'Confira: quando parar',
          pergunta: 'Qual destes casos exige que o agente PARE e peça decisão?',
          opcoes: [
            { id: 'a', texto: 'Há duas interpretações do pedido que mudam o produto.', correta: true, porque: 'pare quando faltar autoridade, houver ambiguidade de produto, segredo ou dado regulado, ambiente indisponível ou conflito com trabalho do usuário.' },
            { id: 'b', texto: 'Um teste falha e dá para reproduzir com um comando reversível.', correta: false, porque: 'resolve-se por teste reversível: continue sozinho.' },
            { id: 'c', texto: 'Falta um import e a convenção do projeto é conhecida.', correta: false, porque: 'convenção conhecida dentro do contrato: continue.' },
            { id: 'd', texto: 'O diff precisa de uma pequena refatoração dentro do escopo do contrato.', correta: false, porque: 'está dentro do contrato.' }
          ], tutorDepois: 'Dúvida de produto é decisão humana; dúvida técnica reversível, o agente resolve.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Marca de verificação', html:
          '<p>O loop e os critérios deste bloco são método do curso, sem dependência de produto. Os valores do scorecard são exemplos de formato, não medições.</p>' },
        { tipo: 'takeaway', html: 'Inspecione, planeje, mude, <mark>verifique</mark>, revise e <mark>relate com evidência</mark>; pare quando a decisão não for sua.' }
      ] }
    ]
  });
})();
