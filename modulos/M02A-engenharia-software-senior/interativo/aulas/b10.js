/* M02A · Bloco 10: observabilidade, confiabilidade e incidentes. Fonte: M02A.html#b10. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'def sli(amostras):', '    # fração de amostras boas (True)', '    return 0.0', '', '',
    'def budget_restante(sli_observado, slo_alvo):', '    # (permitido - consumido) / permitido, com permitido = 1 - slo; 0.0 se permitido == 0', '    return 0.0', '', '',
    'def budget_minutos(slo_pct, janela_dias):', '    # minutos de indisponibilidade equivalente tolerados na janela', '    return 0.0', '', '',
    'def burn_rate(consumido_pct, decorrido_pct):', '    # consumido% / janela decorrida%', '    return 0.0', '', '',
    'def rotulo_valido(rotulos):', '    # métrica só aceita labels do vocabulário fechado: veredito e motivo; qualquer outra chave reprova', '    return True', ''].join('\n');
  var testes = [
    'def test_sli_e_budget():',
    '    assert sli([True, True, True, False]) == 0.75',
    '    assert abs(budget_restante(0.999, 0.99) - 0.9) < 1e-9', '    assert budget_restante(0.98, 0.99) < 0', '    assert budget_restante(1.0, 1.0) == 0.0', '', '',
    'def test_budget_em_minutos():', '    assert abs(budget_minutos(99.9, 30) - 43.2) < 0.01', '    assert abs(budget_minutos(99.0, 30) - 432.0) < 0.01', '', '',
    'def test_burn_rate_acima_de_um_pede_acao():',
    '    assert burn_rate(30, 40) == 0.75', '    assert burn_rate(60, 40) == 1.5', '', '',
    'def test_cardinalidade_label_com_id_reprova():',
    '    assert rotulo_valido({"veredito": "review", "motivo": "FALLBACK"}) is True',
    '    assert rotulo_valido({"veredito": "review", "correlation_id": "abc"}) is False',
    '    assert rotulo_valido({"tenant": "t1"}) is False', ''].join('\n');
  var solucao = [
    'def sli(amostras):', '    return sum(1 for a in amostras if a) / len(amostras)', '', '',
    'def budget_restante(sli_observado, slo_alvo):', '    permitido = 1.0 - slo_alvo', '    consumido = 1.0 - sli_observado',
    '    return (permitido - consumido) / permitido if permitido else 0.0', '', '',
    'def budget_minutos(slo_pct, janela_dias):', '    return (1 - slo_pct / 100) * janela_dias * 24 * 60', '', '',
    'def burn_rate(consumido_pct, decorrido_pct):', '    return consumido_pct / decorrido_pct', '', '',
    'def rotulo_valido(rotulos):', '    return set(rotulos) <= {"veredito", "motivo"}', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b10',
    titulo: 'Observabilidade, confiabilidade e incidentes',
    minutos: 40,
    resumo: 'Log sem correlação vira pilha ilegível; SLO sem consequência vira cartaz. Reconstrua o caminho sem expor segredo e decida a partir do error budget.',
    objetivo: 'Correlacionar log, métrica e trace por ID opaco, calcular SLI, SLO e budget a partir de amostras e exercitar um runbook com postmortem sem culpa.',
    revisao: [
      { id: 'm02ab10-corr', pergunta: 'Como se liga request, advisory, decision e evento sem ler conteúdo sensível?',
        opcoes: [
          opc('a', 'Correlation ID opaco mais tenant validado nos quatro elos; ligar por timestamp ou texto livre é palpite e expõe intenção.', true, 'log carrega detalhe com retenção, métrica contagem sem identificar quem, trace o encadeamento (trace_id propagado).'),
          opc('b', 'Por timestamp próximo.', false, 'dois trabalhos próximos viram um.'),
          opc('c', 'Pelo texto da intenção.', false, 'expõe dado sensível.')] },
      { id: 'm02ab10-slo', pergunta: 'Diferencie SLI, SLO e error budget.',
        opcoes: [
          opc('a', 'SLI: medida observada de amostras brutas; SLO: alvo declarado com janela e owner; budget: o quanto pode falhar antes da decisão operacional (conter, reverter, degradar).', true, 'SLO sem amostra medida e sem consequência para o budget esgotado é cartaz.'),
          opc('b', 'São sinônimos.', false, 'cada um tem papel distinto.'),
          opc('c', 'SLO é a medida e SLI o alvo.', false, 'inverte os papéis.')] },
      { id: 'm02ab10-budget', pergunta: 'Qual o error budget de um SLO de 99,9% em 30 dias?',
        opcoes: [
          opc('a', 'Cerca de 43 minutos: (1 − SLO) × 30 × 24 × 60 = 43,2 min.', true, '99% daria cerca de 7,2 h; 99,99% cerca de 4,3 min. O número só significa algo com SLI medido e decisão ligada.'),
          opc('b', 'Cerca de 7 horas.', false, 'é o de 99%.'),
          opc('c', 'Zero.', false, '99,9% ainda tolera falha.')] },
      { id: 'm02ab10-card', pergunta: 'Por que <code>user_id</code> como label de métrica é um problema?',
        opcoes: [
          opc('a', 'Cada valor distinto cria uma série (explosão de cardinalidade) e pode vazar PII; identificadores vivem em log e trace com retenção.', true, 'métrica agrega com vocabulário pequeno e estável.'),
          opc('b', 'Métricas não aceitam texto.', false, 'aceitam; o problema é a cardinalidade.'),
          opc('c', 'Não é problema.', false, 'cobra custo e privacidade.')] },
      { id: 'm02ab10-runbook', pergunta: 'O que significa "runbook exercitado" e o que o recorte local não prova?',
        opcoes: [
          opc('a', 'Cada caminho foi percorrido contra o sistema com falha injetada e oráculo; não prova operação de produção (sem tráfego, paginação real, dependência externa nem janela de SLO real).', true, 'postmortem sem culpa registra condição, barreira e ação com dono e prazo.'),
          opc('b', 'Foi lido em voz alta.', false, 'não é exercício.'),
          opc('c', 'Prova prontidão operacional.', false, 'o recorte é local, sem rede e sem carga.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O sistema já nega abuso na fronteira, mas é mudo quando degrada. Observabilidade pergunta: quando a decisão atrasa, erra ou trava, conseguimos reconstruir o caminho sem expor segredo e decidir o que fazer? "Mais logs resolvem incidente" e "SLO alto prova qualidade" são meia decisão: log sem correlação vira pilha ilegível e SLO sem consequência declarada vira cartaz.</p>' +
          '<h3>Correlação por IDs</h3>' +
          '<p>Correlacionar é responder "estes quatro rastros falam do mesmo trabalho?" sem ler conteúdo sensível. Cada avaliação recebe um <strong>correlation ID opaco</strong> gerado na entrada e um tenant validado no domínio; os quatro elos (request, advisory, decision, evento publicado) carregam o par.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sinal</th><th>Responde</th><th>Onde o ID mora</th></tr></thead><tbody>' +
          '<tr><td>log</td><td>o que aconteceu neste passo, com causa preservada dentro</td><td>campo estruturado com retenção declarada</td></tr>' +
          '<tr><td>métrica</td><td>quantos e quão lentos, sem identificar quem</td><td>fora de nomes e labels; contadores e histogramas</td></tr>' +
          '<tr><td>trace</td><td>qual passo causou qual, de ponta a ponta</td><td>span com <code>trace_id</code> propagado entre os quatro elos</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>SLI, SLO e error budget</h3>' +
          '<p><strong>SLI</strong>: a medida observada (proporção de avaliações boas sobre o total de amostras do workload). <strong>SLO</strong>: o alvo declarado sobre o SLI, com janela e owner. <strong>Error budget</strong>: a diferença tolerada antes de a decisão operacional disparar. Sem SLI de amostras brutas persistidas, SLO é desejo; sem budget com consequência, é cartaz.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def sli(amostras):\n    boas = sum(1 for amostra in amostras if amostra)\n    return boas / len(amostras)\n\ndef budget_restante(sli_observado, slo_alvo):\n    permitido = 1.0 - slo_alvo\n    consumido = 1.0 - sli_observado\n    return (permitido - consumido) / permitido if permitido else 0.0' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Elemento</th><th>Mecanismo</th><th>Decisão que aciona</th></tr></thead><tbody>' +
          '<tr><td>SLI do workload</td><td>fração de boas em amostras persistidas com seed e digest</td><td>nenhuma sem cálculo reproduzível</td></tr>' +
          '<tr><td>SLO declarado</td><td>alvo e janela na política, com owner</td><td>budget esgotado congela mudança arriscada e prioriza confiabilidade</td></tr>' +
          '<tr><td>error budget</td><td>consumo acumulado; projeção, não soma solta</td><td>saudável libera entrega; zerado exige conter, reverter ou degradar</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p>Declare alvo, janela, fonte das amostras e consequência do budget esgotado <em>antes</em> de medir. Patamares e contagens do material são exemplo variável. <strong>Burn rate</strong> = budget consumido% / janela decorrida%: acima de 1, o budget acaba antes do fim da janela (com 30% consumidos e 40% da janela decorrida, é 0,75: saudável).</p>' },
        { tipo: 'takeaway', html: 'Correlation ID <mark>opaco</mark> mais tenant liga os quatro elos; <mark>SLO</mark> sem amostra e sem consequência é cartaz.' }
      ] },

      { rotulo: 'Diagnóstico e incidentes', blocos: [
        { tipo: 'texto', html:
          '<h3>Diagnóstico sem cardinalidade nem PII</h3>' +
          '<p>Métrica <em>agrega</em>: nome e labels vêm de um vocabulário pequeno e estável (veredito, reason code, caminho de fallback). Log <em>investiga</em>: carrega correlation ID, tenant e detalhe redigido, com retenção. <strong>Cardinalidade</strong> é o número de séries distintas que uma métrica gera; cada ID, tenant ou texto num label multiplica séries e pode vazar dado.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def rotular_para_metrica(veredito, reason_code):\n    # vocabulário fechado: só valores de baixa cardinalidade\n    return {"veredito": veredito, "motivo": reason_code}\n\ndef campo_para_log(correlation_id, tenant, detalhe_redigido):\n    # identificadores e detalhe vivem no log com retenção\n    return {"correlation_id": correlation_id, "tenant": tenant, "detalhe": detalhe_redigido}' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Requisito</th><th>Oráculo</th><th>Confusão a evitar</th></tr></thead><tbody>' +
          '<tr><td>sem cardinalidade</td><td>varredura reprova nome ou label com correlation ID, tenant ou texto</td><td>"só um label a mais por tenant" sem contar as séries</td></tr>' +
          '<tr><td>sem PII nem segredo</td><td>canário ausente em métrica, span e erro externo</td><td>redigir só no caminho feliz</td></tr>' +
          '<tr><td>causa preservada dentro</td><td>log interno guarda a causa; externo só motivo seguro</td><td>devolver stack "para depurar"</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Runbook exercitado e postmortem sem culpa</h3>' +
          '<p><strong>Runbook</strong> transforma sintoma em ação sem improvisar sob pressão: sinal, hipótese, comando lógico e critério para escalar, conter ou reverter. <em>Exercitado</em> é percorrido contra o sistema local com falha injetada e oráculo, não lido em voz alta. O <strong>postmortem sem culpa</strong> pergunta que condição permitiu a falha e que barreira falta, e produz ação com dono e prazo.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Incidente</th><th>Sinal</th><th>Ação do runbook</th><th>Critério de saída</th></tr></thead><tbody>' +
          '<tr><td>overload</td><td>rejeições bounded e profundidade no teto</td><td>conter admissão, priorizar revisão, registrar o shed</td><td>fila drena sem crescimento ilimitado; SLI volta à janela</td></tr>' +
          '<tr><td>DB locked</td><td>conflito de escrita com vencedor observável</td><td>retry limitado com orçamento, depois degradação declarada</td><td>nenhuma avaliação parcial; conflito vira resultado explícito</td></tr>' +
          '<tr><td>provider indisponível</td><td>timeout do advisor com cleanup</td><td>fallback com reason code; sem task órfã</td><td>decisão determinística auditada; advisory ausente não vira aceite</td></tr>' +
          '<tr><td>rollback de policy</td><td>budget zerado após policy defeituosa</td><td>desativar a versão defeituosa e restaurar a anterior com evidência</td><td>comportamento anterior reproduzido no corpus; causa no postmortem</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Limite', html: '<p>O runbook exercitado localmente prova a resposta aos quatro incidentes do recorte, sem rede nem carga real. Não prova prontidão operacional: sem tráfego, paginação real, dependência externa e janela de SLO de produção, não há esse claim. Durações, volumes e limiares são exemplo variável. Código do laboratório: <code>application/slo.py</code> e <code>tests/test_slo.py</code>.</p>' },
        { tipo: 'texto', html: '<p><strong>Fontes</strong> (revalidar por edição): Google SRE (Service-Level Objectives) e SRE Workbook (Alerting on SLOs); OpenTelemetry Specification; W3C Trace Context; guias de métricas DORA (métricas de entrega como sistema, nunca ranking individual).</p>' },
        { tipo: 'takeaway', html: 'Métrica tem <mark>vocabulário fechado</mark>; o ID mora no <mark>log</mark> com retenção; runbook só vale <mark>exercitado</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'rode', id: 'b10-rode', titulo: 'Burn rate do budget', obrigatorio: false,
          enunciado: 'SLO de 99,9% em 30 dias (cerca de 43,2 min de budget). Valores ilustrativos (exemplo).',
          prefixo: '$', entrada: 'burn_rate(consumido, decorrido)  # exemplo', unidade: 'ms', terminalTitulo: 'exemplo',
          prever: { pergunta: 'Com 60% do budget consumido e 40% da janela decorrida, o burn rate é?', opcoes: [
            { id: 'a', texto: '0,67: ainda saudável.', correta: false, porque: 'inverteu a razão.' },
            { id: 'b', texto: '1,5: no ritmo atual o budget acaba antes do fim da janela.', correta: true, porque: 'burn = consumido% / decorrido% = 60/40.' }] },
          etapas: [
            { id: 'a', nome: '30% / 40%', descricao: '', tom: 'dns', ms: 1, linhas: [L('out', 'burn=0.75  budget saudável, entrega segue')] },
            { id: 'b', nome: '60% / 40%', descricao: '', tom: 'response', ms: 1, linhas: [L('out', 'burn=1.50  acaba antes do fim da janela'), L('hint', 'hora de agir: conter, reverter ou degradar')] }
          ] },
        { tipo: 'python', id: 'b10-python', titulo: 'SLI, budget e cardinalidade', obrigatorio: false,
          enunciado: 'Implemente <code>sli</code>, <code>budget_restante</code>, <code>budget_minutos</code>, <code>burn_rate</code> e <code>rotulo_valido</code> (labels só <code>veredito</code> e <code>motivo</code>).',
          codigo: codigo, testes: testes,
          dica: 'budget_minutos: <code>(1 - slo_pct/100) * dias * 24 * 60</code>. Labels: <code>set(rotulos) &lt;= {"veredito", "motivo"}</code>.',
          solucao: solucao, callout: 'SLI, budget e varredura de cardinalidade calculados e testados.' },
        { tipo: 'ordene', id: 'b10-ordene', titulo: 'Ordene o fechamento do legado', obrigatorio: false,
          itens: [{ id: 'r', texto: 'Runbook exercitado com falha injetada' }, { id: 'i', texto: 'Propagar correlation ID opaco e tenant' }, { id: 'm', texto: 'Sanitizar métricas (vocabulário fechado)' }, { id: 's', texto: 'SLI de amostras com janela e dono' }],
          solucao: ['i', 's', 'm', 'r'], dica: 'Religue os elos antes de medir, meça antes de sanitizar o dashboard, e exercite por último.' },
        { tipo: 'escolha', id: 'b10-esc1', titulo: 'Confira: SLO verde, usuário degradado', pergunta: 'O SLO está verde e os usuários reclamam. Hipótese?',
          opcoes: [
            { id: 'a', texto: 'SLI sem amostra representativa ou janela declarada; recalcular de amostras brutas com seed, digest e janela.', correta: true, porque: 'sem amostra bruta persistida o número é cartaz.' },
            { id: 'b', texto: 'Os usuários estão errados.', correta: false, porque: 'o SLI não mede o que importa.' }] },
        { tipo: 'escolha', id: 'b10-esc2', titulo: 'Confira: incidente repetido', pergunta: 'O mesmo incidente se repete. O postmortem registrou o culpado. O que falta?',
          opcoes: [
            { id: 'a', texto: 'Condição, barreira e ação verificável com dono e prazo, e mudança no runbook.', correta: true, porque: 'postmortem com culpa e sem barreira não muda o sistema.' },
            { id: 'b', texto: 'Trocar a pessoa.', correta: false, porque: 'a condição permanece.' }] },
        { tipo: 'takeaway', html: 'Budget esgotado <mark>contém, reverte ou degrada</mark>; SLO sem dono é métrica decorativa.' }
      ] }
    ]
  });
})();
