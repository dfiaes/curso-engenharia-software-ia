/* LT04 · Bloco 2: Gates de release. Fonte: LT04.html#b02. Saídas do terminal vêm de execução local de lab/gates_release.py (exemplo, não evidência do lab). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoGate = [
    'BLOQUEANTES = ("p0", "p1")',
    '',
    '',
    'def avaliar_gate(claims):',
    '    # aprova só se TODA claim tem evidencia is True; senão reprova',
    '    # listando os ids em "bloqueadores"',
    '    return {"veredito": "aprovado", "bloqueadores": []}',
    '',
    '',
    'def _invalido(item):',
    '    # condicional exige dono, condicao e expiracao não vazios',
    '    return False',
    '',
    '',
    'def decidir(resultados, claims, condicionais):',
    '    sem_evidencia = [c for c in claims if c.get("evidencia") is not True]',
    '    criticos = [str(c["id"]) for c in sem_evidencia if c.get("severidade") in BLOQUEANTES]',
    '    reprovados = [n for n, r in resultados.items() if r.get("veredito") != "aprovado"]',
    '    # NO-GO se houver crítico, gate reprovado ou claim sem evidência;',
    '    # o motivo é o primeiro grupo não vazio nessa ordem',
    '    # depois: condicional inválido -> NO-GO; condicional completo -> CONDITIONAL GO',
    '    return {"decisao": "GO", "motivo": []}'
  ].join("\n");
  var testesGate = [
    'VERDE = {"Q1": {"veredito": "aprovado"}}',
    '',
    '',
    'def test_gate_aprova_com_toda_evidencia():',
    '    r = avaliar_gate([{"id": "c1", "evidencia": True}, {"id": "c2", "evidencia": True}])',
    '    assert r == {"veredito": "aprovado", "bloqueadores": []}',
    '',
    '',
    'def test_gate_falha_fechado_com_bloqueador_nomeado():',
    '    r = avaliar_gate([{"id": "c1", "evidencia": True}, {"id": "cauda", "evidencia": False}, {"id": "x"}])',
    '    assert r["veredito"] == "reprovado"',
    '    assert r["bloqueadores"] == ["cauda", "x"]',
    '',
    '',
    'def test_p0_veta_com_id_do_critico():',
    '    claims = [{"id": "seg", "evidencia": False, "severidade": "p0"}]',
    '    r = decidir(VERDE, claims, [])',
    '    assert r == {"decisao": "NO-GO", "motivo": ["seg"]}',
    '',
    '',
    'def test_severidade_baixa_sem_evidencia_tambem_veta():',
    '    claims = [{"id": "doc", "evidencia": False, "severidade": "p2"}]',
    '    assert decidir(VERDE, claims, [])["decisao"] == "NO-GO"',
    '',
    '',
    'def test_gate_reprovado_veta():',
    '    r = decidir({"Q2": {"veredito": "reprovado"}}, [{"id": "a", "evidencia": True}], [])',
    '    assert r == {"decisao": "NO-GO", "motivo": ["Q2"]}',
    '',
    '',
    'def test_condicional_incompleto_veta_cada_ausencia():',
    '    base = {"item": "migrar", "dono": "ana", "condicao": "p99 < 800", "expiracao": "2026-12-01"}',
    '    ok = [{"id": "a", "evidencia": True}]',
    '    for campo in ("dono", "condicao", "expiracao"):',
    '        item = dict(base)',
    '        item[campo] = ""',
    '        assert decidir(VERDE, ok, [item]) == {"decisao": "NO-GO", "motivo": ["migrar"]}, campo',
    '',
    '',
    'def test_condicional_completo_e_go_puro():',
    '    ok = [{"id": "a", "evidencia": True}]',
    '    item = {"item": "migrar", "dono": "ana", "condicao": "p99 < 800", "expiracao": "2026-12-01"}',
    '    assert decidir(VERDE, ok, [item]) == {"decisao": "CONDITIONAL GO", "motivo": ["migrar"]}',
    '    assert decidir(VERDE, ok, []) == {"decisao": "GO", "motivo": []}'
  ].join("\n");
  var solucaoGate = [
    'BLOQUEANTES = ("p0", "p1")',
    '',
    '',
    'def avaliar_gate(claims):',
    '    bloqueadores = [str(c["id"]) for c in claims if c.get("evidencia") is not True]',
    '    return {',
    '        "veredito": "aprovado" if not bloqueadores else "reprovado",',
    '        "bloqueadores": bloqueadores,',
    '    }',
    '',
    '',
    'def _invalido(item):',
    '    return (',
    '        not str(item.get("dono", "")).strip()',
    '        or not str(item.get("condicao", "")).strip()',
    '        or not str(item.get("expiracao", "")).strip()',
    '    )',
    '',
    '',
    'def decidir(resultados, claims, condicionais):',
    '    sem_evidencia = [c for c in claims if c.get("evidencia") is not True]',
    '    criticos = [str(c["id"]) for c in sem_evidencia if c.get("severidade") in BLOQUEANTES]',
    '    reprovados = [n for n, r in resultados.items() if r.get("veredito") != "aprovado"]',
    '    if criticos or reprovados or sem_evidencia:',
    '        motivo = criticos or reprovados or [str(c["id"]) for c in sem_evidencia]',
    '        return {"decisao": "NO-GO", "motivo": motivo}',
    '    invalidos = [str(i.get("item")) for i in condicionais if _invalido(i)]',
    '    if invalidos:',
    '        return {"decisao": "NO-GO", "motivo": invalidos}',
    '    if condicionais:',
    '        return {"decisao": "CONDITIONAL GO", "motivo": [str(i.get("item")) for i in condicionais]}',
    '    return {"decisao": "GO", "motivo": []}'
  ].join("\n");

  TrilhaAula.registrar({
    id: 'lt04-b2',
    titulo: 'Gates de release',
    minutos: 32,
    resumo: '"O gate passou" só vale se cada claim tem evidência. A barreira é uma conjunção, P0/P1 veta sem negociação e o talvez só existe com dono, condição e prazo.',
    objetivo: 'Reprovar fechado gate sem evidência, forçar NO-GO com P0/P1 ou gate reprovado e admitir CONDITIONAL GO só com item completo, sempre com o motivo nomeado.',
    revisao: [
      { id: 'lt04b2-conjuncao', pergunta: 'Um gate tem 7 claims: 6 com evidência e 1 sem (severidade P2). Qual o veredito do gate e da decisão?',
        opcoes: [
          opc('a', 'Gate reprovado e decisão NO-GO, com a claim sem evidência listada como bloqueadora', true, 'gate é conjunção: ausência de evidência reprova fechado, qualquer que seja a severidade.'),
          opc('b', 'Aprovado: 6 de 7 é quórum e P2 não bloqueia', false, 'trata ausência como abstenção; não existe aprovação parcial silenciosa.'),
          opc('c', 'CONDITIONAL GO, com a claim virando item condicional', false, 'CONDITIONAL GO só existe com gate verde.')] },
      { id: 'lt04b2-veto', pergunta: 'Q1 a Q6 estão verdes e Q7 tem P0 aberto. Qual é a decisão?',
        opcoes: [
          opc('a', 'NO-GO, com o id do crítico no motivo', true, 'P0/P1 aberto força NO-GO independente de qualquer outro verde; a decisão carrega o nome do que a vetou.'),
          opc('b', 'GO, porque seis de sete gates passaram', false, 'conhecer um P0 e promover é aceitar o dano sem o papel.'),
          opc('c', 'CONDITIONAL GO, com prazo curto', false, 'condicional exige gate verde, e o gate de Q7 não está.')] },
      { id: 'lt04b2-expiracao', pergunta: 'Gate verde, item condicional com dono e condição verificável, mas sem expiração. Qual a decisão?',
        opcoes: [
          opc('a', 'NO-GO, com o item no motivo', true, 'sem prazo, a exceção nunca morre e vira regra sem gate; cada ausência (dono, condição, expiração) veta isoladamente.'),
          opc('b', 'CONDITIONAL GO: a expiração é detalhe', false, 'expiração é um dos três itens exigidos juntos.'),
          opc('c', 'CONDITIONAL GO, se alguém prometer preencher depois', false, 'é a dívida com nome bonito que o contrato proíbe.')] },
      { id: 'lt04b2-go', pergunta: 'O que o GO puro exige?',
        opcoes: [
          opc('a', 'Gate verde e lista vazia de pendências', true, 'qualquer item condicional já muda o veredito para CONDITIONAL GO ou NO-GO.'),
          opc('b', 'Gate verde, ainda que haja pendências registradas', false, 'pendência com dono e prazo é CONDITIONAL GO, não GO.'),
          opc('c', 'Maioria dos gates aprovados', false, 'gate é conjunção, não quorum.')] },
      { id: 'lt04b2-motivo', pergunta: 'Por que toda decisão do oráculo carrega um motivo?',
        opcoes: [
          opc('a', 'Reprovação sem motivo nomeado é reprovação sem conserto, e a comunicação posterior herda o vazio', true, 'o motivo é bloqueador, pendência ou lista vazia no GO.'),
          opc('b', 'Só para enfeitar o relatório', false, 'o motivo é o dado que a comunicação e o pós-mortem consomem.'),
          opc('c', 'Porque o NO-GO precisa ser negociado depois', false, 'o veto não negocia; o motivo diz o que consertar.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>"O gate passou, e quebrou mesmo assim." Quase sempre o gate passou porque ninguém exigiu a evidência: a ausência foi lida como abstenção. Este bloco troca "o gate passou" por uma <strong>barreira calculada com motivo nomeado</strong>. Três resultados:</p>' +
          '<ul><li>avaliar o gate como <strong>conjunção de evidências</strong>: claim sem evidência reprova fechado, sem meio-termo;</li>' +
          '<li>forçar <strong>NO-GO</strong> com P0/P1 aberto ou gate reprovado: bloqueador não negocia com pressa;</li>' +
          '<li>admitir <strong>CONDITIONAL GO</strong> só com gate verde mais item com dono, condição e expiração.</li></ul>' +
          '<p>Pré-requisitos: Bloco 1 (a identidade do que se promove) e dicionários (M02). A assinatura humana responsável pertence à trilha externa: BLOCKED com registro.</p>' },
        { tipo: 'texto', html:
          '<h3>Claim e gate: a conjunção que não negocia</h3>' +
          '<p><strong>Claim</strong> é a alegação verificável ("contrato provado", "cauda medida"). <strong>Gate</strong> é a conjunção: aprova somente se <em>toda</em> claim tem evidência presente. Evidência ausente não é "pendência leve": o gate reprova fechado e lista os <strong>bloqueadores</strong> pelo id. O oráculo devolve o veredito mais a lista, porque reprovação sem motivo nomeado é reprovação sem conserto.</p>' +
          '<h3>P0/P1: o veto automático</h3>' +
          '<p><strong>Severidade</strong> separa o intolerável do negociável. <strong>P0/P1 aberto força NO-GO</strong> independente de qualquer outro verde. Não existe "GO com P0 conhecido": conhecer e promover é aceitar o dano por escrito sem o papel. O motivo leva o id do crítico. Gate reprovado por qualquer claim sem evidência também veta, mesmo em P2: falha fechada não vira GO por severidade baixa.</p>' +
          '<h3>CONDITIONAL GO: o talvez com dono e prazo</h3>' +
          '<p>CONDITIONAL GO só existe com <strong>gate verde</strong> mais item condicional completo: <strong>dono</strong> nomeado, <strong>condição</strong> verificável e <strong>expiração</strong> datada. Falta um dos três e o veredito volta a NO-GO. Condicional sem dono é dívida com nome bonito; sem prazo é aceitação permanente disfarçada. O oráculo testa cada ausência isoladamente.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Situação</th><th>Decisão</th><th>Motivo</th></tr></thead><tbody>' +
          '<tr><td>Claim sem evidência, severidade P0 ou P1</td><td>NO-GO</td><td>id do crítico</td></tr>' +
          '<tr><td>Gate reprovado, ou claim sem evidência em qualquer severidade</td><td>NO-GO</td><td>gate reprovado, ou id da claim</td></tr>' +
          '<tr><td>Gate verde, condicional sem dono, condição ou expiração</td><td>NO-GO</td><td>o item inválido</td></tr>' +
          '<tr><td>Gate verde, condicional completo</td><td>CONDITIONAL GO</td><td>os itens</td></tr>' +
          '<tr><td>Gate verde, zero pendências</td><td>GO</td><td>lista vazia</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'Gate é <mark>conjunção de evidências</mark>: o que falta <mark>reprova fechado</mark>, e toda decisão carrega o <mark>motivo</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>O mapa da decisão</h3>' +
          '<p>Leia de cima para baixo: o primeiro "não" decide, e a falha é sempre fechada. É a ordem em que <code>decidir</code> avalia (<code>lab/gates_release.py</code>).</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'toda claim tem evidência e todo gate está aprovado?',
          '  não -> NO-GO   motivo: crítico (P0/P1), ou gate reprovado, ou claim sem evidência',
          '  sim -> existe item condicional?',
          '           não -> GO               motivo: [] (zero pendências)',
          '           sim -> cada item tem dono, condição verificável e expiração?',
          '                    sim -> CONDITIONAL GO   motivo: os itens',
          '                    não -> NO-GO            motivo: o item inválido'].join('\n') },
        { tipo: 'texto', html:
          '<p>Agora rode cinco chamadas. A saída veio de uma execução local do contrato; os valores são exemplo variável, não evidência do lab.</p>' },
        { tipo: 'rode', id: 'b2-rode', titulo: 'Cinco decisões sobre o mesmo release',
          enunciado: 'Aperte Enter e clique em cada etapa. O release tem o gate Q1 verde em todas as chamadas.',
          prefixo: '$', entrada: 'python3 -c "from gates_release import *"   # dentro de lab/', unidade: 'chamadas', terminalTitulo: 'lab/gates_release.py',
          prever: { pergunta: 'Q1 está verde, mas a claim <code>Q7-cauda</code> não tem evidência e é P0. O que <code>decidir</code> devolve?', opcoes: [
            { id: 'a', texto: 'GO com ressalva: o gate Q1 está verde.', correta: false, porque: 'não existe GO com P0 conhecido; os verdes não negociam com o veto.' },
            { id: 'b', texto: 'NO-GO, com o id <code>Q7-cauda</code> no motivo.', correta: true, porque: 'P0 sem evidência força NO-GO, e o motivo leva o nome do crítico.' },
            { id: 'c', texto: 'CONDITIONAL GO, com a claim como item.', correta: false, porque: 'CONDITIONAL GO só existe com gate verde.' }
          ] },
          etapas: [
            { id: 'gate', nome: 'avaliar_gate', descricao: 'Conjunção: toda evidência, ou reprovado', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'avaliar_gate([{"id": "Q7-cauda", "evidencia": False, "severidade": "p0"},'),
              L('cmd', '             {"id": "Q1-contrato", "evidencia": True}])'),
              L('out', "{'veredito': 'reprovado', 'bloqueadores': ['Q7-cauda']}"),
              L('hint', 'reprovação com o bloqueador nomeado: dá para consertar')] },
            { id: 'veto', nome: 'veto P0', descricao: 'Crítico sem evidência', tom: 'tcp', ms: 1, linhas: [
              L('cmd', 'decidir({"Q1": {"veredito": "aprovado"}}, claims, [])'),
              L('out', "{'decisao': 'NO-GO', 'motivo': ['Q7-cauda']}"),
              L('hint', 'o id do crítico é o motivo')] },
            { id: 'cond', nome: 'CONDITIONAL GO', descricao: 'Gate verde, item completo', tom: 'tls', ms: 1, linhas: [
              L('cmd', 'decidir(verde, [claim_ok], [{"item": "migrar-indice", "dono": "ana",'),
              L('cmd', '    "condicao": "p99 < 800 ms por 7 dias", "expiracao": "2026-12-01"}])'),
              L('out', "{'decisao': 'CONDITIONAL GO', 'motivo': ['migrar-indice']}"),
              L('hint', 'dono, condição verificável e expiração datada, os três juntos')] },
            { id: 'semexp', nome: 'sem expiração', descricao: 'A mesma condicional, sem prazo', tom: 'request', ms: 1, linhas: [
              L('cmd', 'decidir(verde, [claim_ok], [{... "expiracao": ""}])'),
              L('out', "{'decisao': 'NO-GO', 'motivo': ['migrar-indice']}"),
              L('hint', 'sem prazo é aceitação permanente disfarçada: veta sozinha')] },
            { id: 'go', nome: 'GO puro', descricao: 'Gate verde, zero pendências', tom: 'response', ms: 1, linhas: [
              L('cmd', 'decidir(verde, [claim_ok], [])'),
              L('out', "{'decisao': 'GO', 'motivo': []}"),
              L('hint', 'só aqui a lista de motivos é vazia')] }
          ],
          tutorAntes: 'Antes do Enter, escolha a decisão para o release com <code>Q7-cauda</code> P0 sem evidência.',
          tutorDepois: 'Cinco chamadas, três vereditos: o que muda entre eles é o que está faltando, não a pressa.',
          callout: 'Você viu NO-GO, CONDITIONAL GO e GO saírem do mesmo contrato.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'No laboratório', html:
          '<p>A folha B02-L implementa este contrato verbatim em <code>lab/gates_release.py</code> (só stdlib, sem imports) e o confere com 1 arquivo de teste (gate fechado, veto P0/P1, condicional). Rode o comando logo abaixo.</p>' },
        { tipo: 'codigo', linguagem: 'sh', texto: 'uv run pytest -q tests/test_at010_gates.py' },
        { tipo: 'takeaway', html: 'O <mark>primeiro "não"</mark> do mapa decide, e a falha é <mark>sempre fechada</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'ordene', id: 'b2-ordene', titulo: 'Em que ordem decidir avalia',
          enunciado: 'Coloque as verificações na ordem em que o oráculo as aplica, da primeira à última, e aperte Conferir.',
          itens: [
            { id: 'cond_ok', texto: 'Condicional completo: CONDITIONAL GO' },
            { id: 'go', texto: 'Nada pendente: GO' },
            { id: 'sem', texto: 'Claim sem evidência: NO-GO' },
            { id: 'criticos', texto: 'P0/P1 sem evidência: NO-GO' },
            { id: 'cond_inv', texto: 'Condicional inválido: NO-GO' },
            { id: 'reprov', texto: 'Gate reprovado: NO-GO' }
          ],
          solucao: ['criticos', 'reprov', 'sem', 'cond_inv', 'cond_ok', 'go'],
          dica: 'Os três vetos de evidência vêm antes de olhar condicionais: crítico, gate reprovado, claim sem evidência. Depois, condicional inválido, condicional completo e, por último, o GO.',
          tutorDepois: 'O motivo do NO-GO é o primeiro grupo não vazio: críticos, depois gates reprovados, depois as claims sem evidência.',
          callout: 'A ordem é a do código: vetos primeiro, condicional depois, GO por exclusão.' },
        { tipo: 'cenario', id: 'b2-cenario', titulo: 'Sexta, 17h, release com Q7 aberto',
          enunciado: 'Q1 a Q6 estão verdes. Q7 (medição de cauda) não tem evidência e é P1. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O PM pede GO: "seis de sete verdes, a gente corrige segunda". O que você registra?', opcoes: [
              { texto: 'GO, anotando a Q7 como dívida técnica.', vai: 'f-go', tom: 'ruim', consequencia: 'conhecer o P1 e promover é aceitar o dano por escrito sem o papel.' },
              { texto: 'CONDITIONAL GO: "a gente resolve segunda", sem dono nem data.', vai: 'f-nome', tom: 'ruim', consequencia: 'e de qualquer forma o gate não está verde: condicional não existe com claim sem evidência.' },
              { texto: 'NO-GO com motivo Q7-cauda e o que falta para destravar.', vai: 'segunda', tom: 'ok', consequencia: 'a decisão carrega o nome do que a vetou, e o conserto fica claro.' }
            ] },
            segunda: { texto: 'Segunda: a cauda foi medida e a Q7 tem evidência. Falta só migrar um índice, que não bloqueia o uso. Como entra no release?', opcoes: [
              { texto: 'GO puro, sem registrar o índice.', vai: 'f-silencio', tom: 'ruim', consequencia: 'GO puro exige zero pendências; a pendência existe e ficou sem registro.' },
              { texto: 'CONDITIONAL GO com item: dono Ana, condição "p99 abaixo de 800 ms por 7 dias", expiração datada.', vai: 'f-bom', tom: 'ok', consequencia: 'gate verde mais dono, condição verificável e expiração: o talvez tem fim.' },
              { texto: 'CONDITIONAL GO com dono e condição, prazo "quando der".', vai: 'f-perm', tom: 'ruim', consequencia: 'sem expiração datada o contrato devolve NO-GO.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Release liberado com pendência que tem dono, condição e prazo; a decisão nomeou cada passo.' },
            'f-go': { bom: false, texto: 'O P1 foi para produção com a dívida anotada, e a cauda apareceu para o cliente antes de aparecer no relatório.' },
            'f-nome': { bom: false, texto: 'O "talvez" sem dono virou a decisão, e o gate continuou sem evidência.' },
            'f-silencio': { bom: false, texto: 'O índice foi esquecido: ninguém era dono dele, e a pendência voltou como incidente.' },
            'f-perm': { bom: false, texto: 'O "quando der" nunca venceu: a exceção virou regra sem gate.' }
          },
          callout: 'Você vetou com motivo e depois liberou com dono, condição e prazo.' },
        { tipo: 'python', id: 'b2-python', titulo: 'Implemente a barreira e a decisão', obrigatorio: false,
          enunciado: 'Complete <code>avaliar_gate</code>, <code>_invalido</code> e <code>decidir</code>. Severidades vêm em minúsculas (<code>p0</code>, <code>p1</code>). Claim sem a chave <code>evidencia</code> conta como sem evidência: só <code>True</code> aprova. Python no navegador, só biblioteca padrão.',
          codigo: codigoGate, testes: testesGate,
          dica: 'Em <code>avaliar_gate</code>: <code>bloqueadores = [str(c["id"]) for c in claims if c.get("evidencia") is not True]</code>. Em <code>decidir</code>, o motivo do NO-GO é <code>criticos or reprovados or ids das sem_evidencia</code>. Depois valide os condicionais com <code>_invalido</code>.',
          solucao: solucaoGate,
          tutorDepois: 'Repare que "evidencia is not True" trata ausência da chave, None e False do mesmo jeito: falha fechada.',
          callout: 'A barreira passou nos testes: feliz, veto, gate reprovado e cada ausência do condicional.' },
        { tipo: 'takeaway', html: 'Vetos primeiro, <mark>condicional</mark> depois, e o <mark>GO</mark> só <mark>por exclusão</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>Diagnóstico B02: erros reais, na ordem em que costumam aparecer</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Gate aprova com claim sem evidência</td><td>Conjunção trocada por contagem ou quorum: ausência virou abstenção</td><td>Reprovar fechado listando bloqueadores; testar o caso sem evidência</td></tr>' +
          '<tr><td>Release com P0 conhecido é promovido</td><td>Veto de severidade ausente ou negociável na pressa</td><td>P0/P1 aberto força NO-GO com motivo nomeado, sem exceção</td></tr>' +
          '<tr><td>CONDITIONAL GO sem dono nem prazo passa</td><td>Condicional validada só pela presença do item</td><td>Exigir dono, condição e expiração; cada ausência veta isoladamente</td></tr>' +
          '<tr><td>Decisão sem motivo chega à comunicação</td><td>Veredito emitido sem carregar bloqueadores ou pendências</td><td>Decisão sempre com motivo: bloqueador, pendência ou lista vazia no GO</td></tr>' +
          '</tbody></table>' },
        { tipo: 'escolha', id: 'b2-escolha-quorum', titulo: 'Confira: seis de sete',
          pergunta: 'Um gate tem 7 claims: 6 com evidência e 1 sem evidência (severidade P2). Qual o veredito do gate e da decisão?',
          opcoes: [
            { id: 'a', texto: 'Aprovado: 6 de 7 é quórum e P2 não é bloqueante.', correta: false, porque: 'trata ausência como abstenção.' },
            { id: 'b', texto: 'CONDITIONAL GO, com a claim sem evidência virando item condicional.', correta: false, porque: 'CONDITIONAL GO só existe com gate verde.' },
            { id: 'c', texto: 'GO, registrando a claim faltante como dívida técnica.', correta: false, porque: 'também trata ausência como abstenção.' },
            { id: 'd', texto: 'Gate reprovado e decisão NO-GO, com a claim sem evidência listada como bloqueadora.', correta: true, porque: 'o gate é uma conjunção: ausência de evidência reprova fechado, qualquer que seja a severidade. P0/P1 só muda o motivo nomeado, não a existência do veto.' }
          ], tutorDepois: 'Severidade escolhe o motivo; a falta de evidência é que veta.' },
        { tipo: 'escolha', id: 'b2-escolha-expiracao', titulo: 'Confira: a condicional sem prazo',
          pergunta: 'Gate verde, zero P0/P1, e um item condicional com dono e condição verificável, mas sem expiração. Qual a decisão?',
          opcoes: [
            { id: 'a', texto: 'NO-GO: sem expiração o condicional é aceitação permanente disfarçada, e cada ausência veta isoladamente.', correta: true, porque: 'dono, condição verificável e expiração datada são exigidos juntos; sem prazo, a exceção nunca morre e vira regra sem gate.' },
            { id: 'b', texto: 'CONDITIONAL GO: dono e condição bastam, a expiração é detalhe.', correta: false, porque: 'os três são exigidos juntos.' },
            { id: 'c', texto: 'GO: o gate está verde e o item é só informativo.', correta: false, porque: 'GO puro exige lista vazia de pendências.' },
            { id: 'd', texto: 'CONDITIONAL GO, desde que alguém prometa preencher a expiração depois.', correta: false, porque: 'é exatamente a dívida com nome bonito que o contrato proíbe.' }
          ], tutorDepois: 'O contrato testa dono, condição e expiração em três casos distintos.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fontes e versões', html:
          '<ul><li><strong>NIST AI RMF 1.0</strong> (normativa, SRC-LT04-19): govern, map, measure e manage; decisão por risco. Risco alto, revalidar em até 90 dias.</li>' +
          '<li><strong>NIST AI 600-1</strong> (normativa, SRC-LT04-20): riscos e ações para GenAI, versão final de 2024. Risco médio.</li>' +
          '<li>O contrato de <code>lab/gates_release.py</code> e os números citados são construção desta trilha; os valores medidos nascem na folha B02-L. URLs completas na especificação §8. A fonte do módulo não registra data de verificação: confirme as versões antes de citar.</li></ul>' },
        { tipo: 'takeaway', html: 'Sem <mark>evidência</mark>, sem <mark>GO</mark>; sem <mark>prazo</mark>, sem <mark>condicional</mark>.' }
      ] }
    ]
  });
})();
