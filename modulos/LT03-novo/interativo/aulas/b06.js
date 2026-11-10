/* LT03 · Bloco 6: Progressive delivery, rollback e incidente de plataforma. Fonte: LT03.html#b06. Saídas de terminal são exemplo variável, não evidência. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'def analisar(erro_stable, erro_canary, p95_stable, p95_canary,',
    '             limiar_erro, limiar_p95, amostras, minimo_amostras):',
    '    # "inconclusiva" se amostras < minimo_amostras (nunca vira sucesso);',
    '    # "abortar" se erro ou p95 do canary passam de stable + limiar; senao "promover"',
    '    return "promover"', '', '',
    'def rollback_compativel(novo_le_antigo, antigo_le_novo):',
    '    # rollback de workload nao reverte schema: exige leitura cruzada provada',
    '    return True', '', '',
    'def localizar_camada(sinais):',
    '    # primeira camada com sinal aceso, na ordem:',
    '    # aplicacao, manifesto, controlador, no, rede, dependencia; senao "indeterminada"',
    '    return "indeterminada"', '', '',
    'def restaurar(falhas_ativas):',
    '    # lab restaurado: sem falhas, reconciliacao ligada, sandbox removivel',
    '    return {"falhas_ativas": [], "reconciliacao": False, "removivel": False}', ''].join('\n');
  var solucao = [
    'def analisar(erro_stable, erro_canary, p95_stable, p95_canary,',
    '             limiar_erro, limiar_p95, amostras, minimo_amostras):',
    '    if amostras < minimo_amostras:',
    '        return "inconclusiva"',
    '    if erro_canary > erro_stable + limiar_erro or p95_canary > p95_stable + limiar_p95:',
    '        return "abortar"',
    '    return "promover"', '', '',
    'def rollback_compativel(novo_le_antigo, antigo_le_novo):',
    '    return novo_le_antigo and antigo_le_novo', '', '',
    'def localizar_camada(sinais):',
    '    for camada in ("aplicacao", "manifesto", "controlador", "no", "rede", "dependencia"):',
    '        if sinais.get(camada):',
    '            return camada',
    '    return "indeterminada"', '', '',
    'def restaurar(falhas_ativas):',
    '    return {',
    '        "falhas_ativas": [f for f in falhas_ativas if f],',
    '        "reconciliacao": not falhas_ativas,',
    '        "removivel": not falhas_ativas,',
    '    }', ''].join('\n');
  var testes = [
    'def test_canary_saudavel_promove():',
    '    assert analisar(0.5, 0.7, 200.0, 210.0, 1.0, 50.0, 800, 500) == "promover"', '', '',
    'def test_regressao_de_erro_aborta():',
    '    assert analisar(0.5, 3.0, 200.0, 210.0, 1.0, 50.0, 800, 500) == "abortar"', '', '',
    'def test_regressao_de_latencia_aborta():',
    '    assert analisar(0.5, 0.6, 200.0, 300.0, 1.0, 50.0, 800, 500) == "abortar"', '', '',
    'def test_amostra_curta_e_inconclusiva_e_nao_promove():',
    '    assert analisar(0.5, 0.6, 200.0, 205.0, 1.0, 50.0, 120, 500) == "inconclusiva"', '', '',
    'def test_exatamente_no_limiar_ainda_promove():',
    '    assert analisar(0.5, 1.5, 200.0, 250.0, 1.0, 50.0, 500, 500) == "promover"', '', '',
    'def test_rollback_exige_leitura_cruzada_nos_dois_sentidos():',
    '    assert rollback_compativel(True, True)',
    '    assert not rollback_compativel(True, False) and not rollback_compativel(False, True)', '', '',
    'def test_camada_na_ordem_aplicacao_a_dependencia():',
    '    assert localizar_camada({"rede": True, "manifesto": True}) == "manifesto"',
    '    assert localizar_camada({"dependencia": True}) == "dependencia"', '', '',
    'def test_sem_sinal_e_indeterminada():',
    '    assert localizar_camada({}) == "indeterminada"', '', '',
    'def test_restaurar_limpo_liga_reconciliacao():',
    '    assert restaurar([]) == {"falhas_ativas": [], "reconciliacao": True, "removivel": True}', '', '',
    'def test_restaurar_com_falha_ativa_nao_libera():',
    '    r = restaurar(["latencia-injetada"])',
    '    assert r["falhas_ativas"] == ["latencia-injetada"] and not r["reconciliacao"] and not r["removivel"]', ''].join('\n');

  TrilhaAula.registrar({
    id: 'lt03-b6',
    titulo: 'Progressive delivery, rollback e incidente de plataforma',
    minutos: 45,
    resumo: 'Versão ruim não pode chegar a 100% por esperança. A promoção é graduada, decidida por dados, e o rollback de código não desfaz schema, dado nem efeito externo.',
    objetivo: 'Escolher rolling, blue/green ou canary pelo que expõem, desenhar análise com threshold e veredito inconclusivo, decidir rollback contra roll-forward, localizar um incidente por camada e restaurar por contrato.',
    revisao: [
      { id: 'lt03b6-inconclusiva', pergunta: 'No canário, erro e p95 estão dentro dos limites, mas só 120 requisições chegaram, abaixo do mínimo de 500. O veredito?',
        opcoes: [
          opc('a', 'Inconclusiva: segurar o passo e coletar mais amostra, sem tratar como sucesso', true, 'sem amostra mínima não há veredito defensável; inconclusiva nunca é convertida em sucesso silencioso.'),
          opc('b', 'Promover, pois nenhum limite foi estourado', false, 'promoção exige amostra, não silêncio.'),
          opc('c', 'Abortar por precaução', false, 'abortar sem dado também é decidir sem evidência.')] },
      { id: 'lt03b6-schema', pergunta: 'Após rollback da aplicação, o erro continua porque uma migração de schema já foi aplicada. O que faltou?',
        opcoes: [
          opc('a', 'Provar leitura cruzada (antigo lê o schema novo e novo lê o antigo) antes de liberar, bloqueando a volta quando não houver', true, 'rollback de código não reverte schema; use expand/migrate/contract compatível com as duas versões.'),
          opc('b', 'Mais réplicas na versão antiga', false, 'réplicas não alteram o schema.'),
          opc('c', 'Aumentar o timeout', false, 'não toca na incompatibilidade.')] },
      { id: 'lt03b6-estrategia', pergunta: 'Qual estratégia mistura versões durante a janela mas não duplica capacidade?',
        opcoes: [
          opc('a', 'Rolling', true, 'troca réplicas aos poucos sob a trava de readiness: barato, com versões misturadas.'),
          opc('b', 'Blue/green', false, 'duplica o ambiente temporariamente em troca de corte limpo.'),
          opc('c', 'Canary', false, 'expõe percentuais graduais com análise entre etapas.')] },
      { id: 'lt03b6-camadas', pergunta: 'Qual a ordem de investigação por camada diante de um incidente inédito?',
        opcoes: [
          opc('a', 'Aplicação, manifesto, controlador, nó, rede, dependência', true, 'eventos e conditions primeiro, depois logs, métricas e traces, até o sinal acender. Pular ordem é adivinhar.'),
          opc('b', 'Começar pelo rollback às cegas', false, 'rollback às cegas não localiza a causa.'),
          opc('c', 'Dependência, rede, nó, controlador, manifesto, aplicação', false, 'a ordem do bloco vai da aplicação à dependência.')] },
      { id: 'lt03b6-restauracao', pergunta: 'O que fecha a restauração depois de um incidente?',
        opcoes: [
          opc('a', 'SLO de volta, Git representando o desejado, controladores saudáveis, faults desligados e sandbox removível, com postmortem escrito', true, 'incidente sem registro é ensaio para repetição.'),
          opc('b', 'Só o SLO voltar ao normal', false, 'o Git e os controladores também precisam voltar ao contrato.'),
          opc('c', 'Deixar o break-glass ativo', false, 'o manual precisa expirar ou virar commit.')] }
    ],
    abas: [
      { rotulo: 'Estratégias e análise', blocos: [
        { tipo: 'texto', html:
          '<p>Cada estratégia de entrega expõe e preserva uma coisa diferente.</p>' +
          '<ul><li><strong>Rolling</strong> troca réplicas aos poucos sob a trava de readiness: barato e sem duplicar capacidade, mas mistura versões durante a janela.</li>' +
          '<li><strong>Blue/green</strong> sobe o ambiente novo inteiro ao lado, vira o tráfego de uma vez e mantém o antigo para a volta rápida: dobra o custo temporário em troca de corte limpo.</li>' +
          '<li><strong>Canary</strong> expõe a nova versão a percentuais graduais com análise entre as etapas: representatividade crescente com blast radius contido.</li></ul>' +
          '<p>O canary só prova o que o tráfego segmentado representa: percentual irrisório ou público enviesado é teatro de análise. <strong>Pause</strong> e <strong>approval</strong> seguram a promoção para decisão humana; <strong>auto-promotion</strong> e <strong>abort</strong> movem sozinhos pelo veredito calculado. Versão ruim não alcança 100%: a trava é o threshold, não a esperança.</p>' +
          '<h3>Análise</h3>' +
          '<p>A análise compara <strong>stable</strong> contra <strong>canary</strong> em janela fixa: taxa de erro, p95 e métrica de negócio, cada uma com threshold declarado. Além do threshold, aborta; dentro, promove; sem amostra mínima, o veredito é <strong>inconclusivo</strong>, e inconclusivo nunca é convertido silenciosamente em sucesso. As métricas vêm de tráfego real do lab, nunca hardcoded: número sem tráfego é cenário, não evidência.</p>' },
        { tipo: 'quebre', id: 'b6-quebre', titulo: 'Canary por etapas',
          enunciado: 'Três etapas de exposição analisadas por <code>analisar</code>. Limiares do exemplo: erro até stable + 1,0 pp, p95 até stable + 50 ms, mínimo de 500 amostras. Resultados calculados com o contrato; números: exemplo.',
          prefixo: '$', entrada: 'analisar(...)', unidade: 'etapa', terminalTitulo: 'rollout (exemplo)',
          prever: { pergunta: 'Com a amostra mínima atingida, o que a análise decide quando o erro ou o p95 do canary passam de stable + limiar?', opcoes: [
            { id: 'a', texto: 'Promover mesmo assim, porque a amostra é suficiente.', correta: false, porque: 'amostra suficiente permite decidir, e a decisão é contrária à promoção.' },
            { id: 'b', texto: 'Abortar: o erro passa de stable + limiar, e o stable fica preservado.', correta: true, porque: 'versão ruim não alcança 100%; a trava é o threshold.' },
            { id: 'c', texto: 'Inconclusiva, porque o erro varia.', correta: false, porque: 'com a amostra mínima atingida há veredito.' }
          ] },
          etapas: [
            { id: 'e5', nome: '5%', descricao: 'Primeira exposição', tom: 'dns', ms: 5, linhas: [
              L('cmd', 'analisar(0.5, 0.6, 200, 205, 1.0, 50, 800, 500)'), L('out', 'promover')] },
            { id: 'e25', nome: '25%', descricao: 'Exposição maior', tom: 'request', ms: 25, linhas: [
              L('cmd', 'analisar(0.5, 0.7, 200, 215, 1.0, 50, 800, 500)'), L('out', 'promover')] },
            { id: 'e100', nome: '100%', descricao: 'Promoção completa', tom: 'response', ms: 100, linhas: [
              L('info', 'canary promovido; stable aposentado'), L('hint', 'exemplo variável')] }
          ],
          falhas: [
            { id: 'regressivo', rotulo: 'Erro do canary dispara na etapa de 25%', efeito: { etapaFalha: 'e25', linhasErro: [
              L('cmd', 'analisar(0.5, 3.0, 200, 215, 1.0, 50, 800, 500)'), L('out', 'abortar'),
              L('hint', 'stable preservado no SLO; promoção interrompida antes de 100%')
            ], tutor: 'erro do canary (3,0) passou de stable + limiar (0,5 + 1,0). O abort é automático, antes de 100%.' } },
            { id: 'amostra', rotulo: 'Só 120 requisições chegam ao canary', efeito: { etapaFalha: 'e5', linhasErro: [
              L('cmd', 'analisar(0.5, 0.6, 200, 205, 1.0, 50, 120, 500)'), L('out', 'inconclusiva'),
              L('hint', 'segura o passo; não promove e não vira sucesso')
            ], tutor: 'sem a amostra mínima, não há veredito defensável. A saída honesta é inconclusiva: coletar mais tráfego, não promover por silêncio.' } }
          ],
          tutorDepois: 'Pause e approval seguram para decisão humana; auto-promotion e abort movem pelo veredito calculado.',
          callout: 'Você viu promover, abortar e o inconclusivo que não vira sucesso.' },
        { tipo: 'escolha', id: 'b6-escolha-amostra', titulo: 'Aquecimento: o horário morto', obrigatorio: false,
          pergunta: 'A análise aprova um canary com tráfego irrisório no horário morto, com erro e p95 dentro dos limites. Qual o defeito?',
          opcoes: [
            opc('a', 'Amostra abaixo do mínimo convertida em sucesso; o certo é inconclusivo.', true, 'promoção exige amostra, não silêncio.'),
            opc('b', 'Os thresholds estão altos demais, apenas.', false, 'o ponto é a amostra, não o limiar.'),
            opc('c', 'Faltou usar blue/green.', false, 'a estratégia não corrige a falta de amostra.')] },
        { tipo: 'takeaway', html: 'Regressiva <mark>aborta antes de 100%</mark>; <mark>inconclusiva</mark> segura e nunca vira sucesso silencioso.' }
      ] },

      { rotulo: 'Rollback e incidente', blocos: [
        { tipo: 'texto', html:
          '<h3>Rollback contra roll-forward</h3>' +
          '<p>Rollback de aplicação não reverte automaticamente schema, mensagem, dado ou efeito externo. Com migração no caminho, a volta exige compatibilidade <strong>expand/migrate/contract</strong> provada nas duas direções (o novo lê o antigo e o antigo lê o novo); sem isso, o rollback é bloqueado e o caminho é seguir adiante (<strong>roll-forward</strong>). <strong>Feature flags</strong> separam deploy de exposição: código novo parado, comportamento novo aceso por chave, e o rollback vira desligar a chave, sem novo deploy.</p>' },
        { tipo: 'cenario', id: 'b6-cenario', titulo: 'A versão com migração precisa voltar', obrigatorio: false,
          enunciado: 'A versão nova trouxe uma migração de schema e apresentou regressão. A equipe quer voltar.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A migração já foi aplicada. Você libera o rollback do workload?', opcoes: [
              { texto: 'Sim: volto o workload e confio que o dado se ajusta.', vai: 'f-reza', tom: 'ruim', consequencia: 'o workload voltou, o contrato de dados não: a leitura quebra.' },
              { texto: 'Só depois de provar leitura cruzada nas duas direções.', vai: 'prova', tom: 'ok', consequencia: 'rollback de código não reverte schema sozinho.' }] },
            prova: { texto: 'A versão antiga não consegue ler o schema novo. O que fazer?', opcoes: [
              { texto: 'Bloquear o rollback e seguir adiante (roll-forward) com a correção.', vai: 'f-bom', tom: 'ok', consequencia: 'o caminho que preserva o contrato é seguir em frente.' },
              { texto: 'Forçar o rollback mesmo assim, para cumprir o SLA.', vai: 'f-forca', tom: 'ruim', consequencia: 'cumprir o SLA de tempo à custa de corromper a leitura do dado.' }] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Rollback bloqueado por incompatibilidade, roll-forward com a correção e flag desligada onde possível.' },
            'f-reza': { bom: false, texto: 'A versão antiga quebrou a leitura do dado e o incidente cresceu.' },
            'f-forca': { bom: false, texto: 'O rollback forçado corrompeu o contrato de dados.' }
          },
          callout: 'Você bloqueou o rollback incompatível e seguiu adiante com segurança.' },
        { tipo: 'texto', html:
          '<h3>Incidente: localizar por camada, restaurar por contrato</h3>' +
          '<p>Diante do inédito, comece por eventos e conditions, depois logs, métricas e traces, passando por <strong>aplicação, manifesto, controlador, nó, rede e dependência</strong>, nessa ordem, até o sinal acender. Cada camada tem sintoma próprio; pular a ordem troca investigação por adivinhação. A <strong>restauração</strong> fecha o ciclo: SLO de volta, Git representando o desejado, controladores saudáveis, faults desligados e recursos de sandbox removíveis. O <strong>postmortem</strong> registra timeline, decisão e compatibilidade: incidente sem registro é ensaio para repetição.</p>' },
        { tipo: 'ordene', id: 'b6-ordene', titulo: 'Ordene as camadas de investigação', obrigatorio: false,
          enunciado: 'A latência estoura após uma promoção parcial, sem erro novo. Ordene as camadas.',
          itens: [
            { id: 'rede', texto: 'Rede' },
            { id: 'aplicacao', texto: 'Aplicação' },
            { id: 'dependencia', texto: 'Dependência' },
            { id: 'controlador', texto: 'Controlador' },
            { id: 'no', texto: 'Nó' },
            { id: 'manifesto', texto: 'Manifesto' }],
          solucao: ['aplicacao', 'manifesto', 'controlador', 'no', 'rede', 'dependencia'],
          dica: 'Da camada mais próxima do código para a mais distante dele.',
          tutorDepois: 'A ordem fixa vem com sinais: a primeira camada acesa decide o diagnóstico.' },
        { tipo: 'transcript', id: 'b6-transcript', titulo: 'Ache a decisão que os dados não sustentam', obrigatorio: false, terminalTitulo: 'canary de api (exemplo)',
          enunciado: 'O agente relata o canary. Uma afirmação não é sustentada pelo que o terminal mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Analise o canary e decida se promove.' },
            { quem: 'ferramenta', texto: '$ analisar-canary (exemplo)\nerro stable 0.5% / canary 0.6%\np95 stable 200ms / canary 205ms\namostras 120 (minimo 500)' },
            { quem: 'agente', texto: 'Erro e p95 do canary estão dentro dos limites.' },
            { quem: 'agente', texto: 'Foram só 120 amostras, abaixo do mínimo de 500.' },
            { quem: 'agente', texto: 'Está comprovado que a versão é saudável, pode promover para 100%.' }
          ],
          erradas: [4],
          explicacao: { 4: 'com 120 amostras abaixo do mínimo de 500, o veredito é <strong>inconclusiva</strong>: não há evidência para promover, e inconclusivo nunca vira sucesso silencioso.' },
          tutorDepois: 'As duas primeiras linhas descrevem os dados com fidelidade. A conclusão pula o mínimo de amostras.' },
        { tipo: 'takeaway', html: 'Rollback de código <mark>não reverte schema</mark>; investigue por <mark>camada, em ordem</mark>, e restaure por <mark>contrato</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b6-python', titulo: 'Decida o canary, o rollback e o incidente', obrigatorio: false,
          enunciado: 'Implemente as quatro funções de <code>lab/analisar_canary.py</code>: <code>analisar</code>, <code>rollback_compativel</code>, <code>localizar_camada</code> e <code>restaurar</code>. Métricas entram como números locais.',
          codigo: codigo, testes: testes,
          dica: 'Em <code>analisar</code>, teste a amostra mínima primeiro; depois compare erro e p95 do canary com stable + limiar (estrito, &gt;). Rollback: os dois sentidos. Camada: percorra a tupla na ordem e devolva a primeira acesa.',
          solucao: solucao,
          tutorDepois: 'A ordem dos testes em <code>analisar</code> importa: a amostra curta é checada antes dos thresholds.',
          callout: 'Promover, abortar, inconclusiva, rollback, camada e restauração passaram nos testes.' },
        { tipo: 'escreva', id: 'b6-escreva', titulo: 'Canary com amostra curta', obrigatorio: false,
          enunciado: 'Canary com erro e p95 dentro dos thresholds, mas com amostra abaixo do mínimo: promova, aborte ou segure? Justifique com janela, threshold e amostra.',
          placeholder: 'Decisão e justificativa.',
          rubrica: [
            'Segura em inconclusiva: sem amostra mínima não há veredito.',
            'Declara que inconclusiva nunca vira sucesso silencioso.',
            'Cita janela, threshold e amostra como entradas da decisão.'],
          modelo: '<p>Seguro o passo: o veredito é inconclusiva. A análise compara stable e canary em janela fixa com threshold por métrica, mas sem a amostra mínima não existe veredito defensável. Erro e p95 dentro dos limites com pouca amostra não são evidência de saúde. Inconclusiva nunca é convertida em sucesso: coleto mais tráfego representativo ou estendo a janela.</p><p><strong>Reprova:</strong> promover pelo threshold parcial.</p>' },
        { tipo: 'escolha', id: 'b6-escolha-flag', titulo: 'Confira: separar deploy de exposição',
          pergunta: 'Qual o ganho de usar uma feature flag em relação ao rollback de uma versão?',
          opcoes: [
            opc('a', 'O código novo fica parado e o comportamento novo é aceso por chave; voltar é desligar, sem novo deploy.', true, 'separa deploy de exposição.'),
            opc('b', 'Elimina a necessidade de análise do canary.', false, 'a análise continua necessária.'),
            opc('c', 'Reverte automaticamente o schema.', false, 'nenhum rollback reverte schema sozinho.')] },
        { tipo: 'escolha', id: 'b6-escolha-ordem', titulo: 'Confira: o incidente sem causa',
          pergunta: 'Um incidente atravessa turnos sem causa localizada. Qual a falha de método mais provável?',
          opcoes: [
            opc('a', 'Diagnóstico fora de ordem, pulando camadas; usar a ordem fixa com sinais.', true, 'a primeira camada acesa, da aplicação à dependência, decide.'),
            opc('b', 'Falta de réplicas.', false, 'não localiza a causa.'),
            opc('c', 'Excesso de logs.', false, 'o método importa mais que o volume.')] },
        { tipo: 'callout', tom: 'info', titulo: 'Fontes e validade', html:
          '<p>Argo Rollouts 1.9.1 na data-base (adapter rotulado, risco alto, revalidar em até 90 dias); Google SRE, Canarying Releases (guia de praticante rotulado, risco baixo: desenho de análise, não define conceito). Tráfego real e incidente com cluster ficam na trilha externa, <strong>BLOCKED</strong> com registro onde ausentes. O contrato de <code>lab/analisar_canary.py</code> e os números são construção da trilha, exemplo variável.</p>' },
        { tipo: 'takeaway', html: 'Decida por <mark>dados calculados</mark>: <mark>aborte</mark> a regressiva, <mark>segure</mark> a inconclusiva e <mark>bloqueie</mark> o rollback incompatível.' }
      ] }
    ]
  });
})();
