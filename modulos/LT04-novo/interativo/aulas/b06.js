/* LT04 · Bloco 6: Pós-mortem e aprendizado. Fonte: LT04.html#b06. Saídas executadas com lab/posmortem_release.py; datas e números são exemplo variável, não evidência. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var CMD = "python3 -c \"from posmortem_release import *; print(validar_acao({'descricao': 'alarme de p99 por slice', 'dono': 'ana', 'prazo': '2026-11-07'}, '2026-11-08'))\"";

  var codigoPm = [
    'def validar_registro(inc):',
    '    """Titulo, timeline com fatos e causas; devolve a lista de problemas, cada ausencia pelo nome."""',
    '    problemas = []', '    # titulo ausente / timeline ausente / causas ausentes', '    return problemas', '', '',
    'def validar_acao(acao, hoje):',
    '    """Descricao, dono e prazo ISO futuro (hoje ainda vale); devolve os problemas."""',
    '    problemas = []', '    # descricao ausente / dono ausente / prazo ausente ou vencido', '    return problemas', '', '',
    'def waiver_valida(waiver, hoje):',
    '    """Valida so com motivo, dono e expiracao >= hoje; vencida bloqueia."""',
    '    return True', '',
    'print(waiver_valida({"motivo": "m", "dono": "d", "expiracao": "2026-11-07"}, "2026-11-08"))', ''].join('\n');

  var testesPm = [
    'HOJE = "2026-11-08"', '', '',
    'def test_registro_completo_nao_acusa():',
    '    inc = {"titulo": "p99 estourou", "timeline": ["10:02 alerta"], "causas": ["sem alarme por slice"]}', '    assert validar_registro(inc) == []', '', '',
    'def test_registro_acusa_cada_ausencia_pelo_nome():',
    '    assert validar_registro({"titulo": "x", "timeline": [], "causas": []}) == ["timeline ausente", "causas ausentes"]',
    '    assert validar_registro({"titulo": "  ", "timeline": ["a"], "causas": ["b"]}) == ["titulo ausente"]',
    '    assert validar_registro({}) == ["titulo ausente", "timeline ausente", "causas ausentes"]', '', '',
    'def test_acao_valida():',
    '    ok = {"descricao": "alarme por slice", "dono": "ana", "prazo": "2026-12-01"}', '    assert validar_acao(ok, HOJE) == []',
    '    assert validar_acao({"descricao": "x", "dono": "ana", "prazo": HOJE}, HOJE) == []', '', '',
    'def test_acao_acusa_cada_ausencia():',
    '    assert validar_acao({"descricao": "", "dono": "ana", "prazo": "2026-12-01"}, HOJE) == ["descricao ausente"]',
    '    assert validar_acao({"descricao": "x", "dono": "", "prazo": "2026-12-01"}, HOJE) == ["dono ausente"]',
    '    assert validar_acao({"descricao": "x", "dono": "ana", "prazo": "2026-11-07"}, HOJE) == ["prazo ausente ou vencido"]',
    '    assert validar_acao({"descricao": "x", "dono": "ana"}, HOJE) == ["prazo ausente ou vencido"]', '', '',
    'def test_waiver_valida_e_vencida():',
    '    w = {"motivo": "migracao em curso", "dono": "ana", "expiracao": "2026-11-09"}', '    assert waiver_valida(w, HOJE) is True',
    '    assert waiver_valida(dict(w, expiracao="2026-11-07"), HOJE) is False', '', '',
    'def test_waiver_sem_dono_ou_sem_motivo_veta():',
    '    assert waiver_valida({"motivo": "m", "dono": "", "expiracao": "2026-11-09"}, HOJE) is False',
    '    assert waiver_valida({"motivo": "", "dono": "ana", "expiracao": "2026-11-09"}, HOJE) is False',
    '    assert waiver_valida({"motivo": "m", "dono": "ana"}, HOJE) is False', ''].join('\n');

  var solucaoPm = [
    'def validar_registro(inc):', '    problemas = []', '    if not str(inc.get("titulo", "")).strip():', '        problemas.append("titulo ausente")',
    '    timeline = inc.get("timeline", [])', '    if not isinstance(timeline, list) or not timeline:', '        problemas.append("timeline ausente")',
    '    causas = inc.get("causas", [])', '    if not isinstance(causas, list) or not causas:', '        problemas.append("causas ausentes")', '    return problemas', '', '',
    'def validar_acao(acao, hoje):', '    problemas = []', '    if not str(acao.get("descricao", "")).strip():', '        problemas.append("descricao ausente")',
    '    if not str(acao.get("dono", "")).strip():', '        problemas.append("dono ausente")',
    '    if str(acao.get("prazo", "")) < hoje:', '        problemas.append("prazo ausente ou vencido")', '    return problemas', '', '',
    'def waiver_valida(waiver, hoje):', '    return (', '        bool(str(waiver.get("motivo", "")).strip())', '        and bool(str(waiver.get("dono", "")).strip())',
    '        and str(waiver.get("expiracao", "")) >= hoje', '    )', ''].join('\n');

  TrilhaAula.registrar({
    id: 'lt04-b6',
    titulo: 'Pós-mortem: registro, ação e waiver que expira',
    minutos: 30,
    resumo: '"Não se repete" não é aprendizado. Registro com timeline e causas, ação com dono e prazo futuro e waiver com expiração transformam o incidente em mudança que o próximo release consegue cobrar.',
    objetivo: 'Registrar um incidente com título, timeline e causas, converter cada causa em ação com dono e prazo, e tratar waiver como exceção que vence e bloqueia o release.',
    revisao: [
      { id: 'lt04b6-registro', pergunta: 'O que um registro de pós-mortem precisa ter, e o que produz a falta de cada parte?',
        opcoes: [
          opc('a', 'Título, timeline com fatos e causas; sem timeline vira memória contra memória, sem causas vira lista de sustos', true, 'o oráculo acusa cada ausência pelo nome, e culpa individual entra no máximo como falha de processo.'),
          opc('b', 'Só o título e quem errou', false, 'culpa individual não entra no registro.'),
          opc('c', 'Só a lista de ações', false, 'sem timeline e causas não há o que aprender nem de onde derivar as ações.')] },
      { id: 'lt04b6-acao', pergunta: 'Ação de pós-mortem: "melhorar o monitoramento", prazo em 30 dias, sem responsável. Qual é o veredito?',
        opcoes: [
          opc('a', 'Inválida: falta dono; ação "de todos" não sai do lugar', true, 'ação precisa de descrição, dono nomeado e prazo futuro; cada ausência invalida isoladamente.'),
          opc('b', 'Válida: tem prazo futuro', false, 'prazo sozinho não nomeia quem faz.'),
          opc('c', 'Válida: toda a equipe é dona', false, 'sem dono, todos acham que é com outro.')] },
      { id: 'lt04b6-vencida', pergunta: 'Uma waiver tem motivo e dono, com expiração ontem, e o release de hoje depende dela. O que acontece?',
        opcoes: [
          opc('a', 'Bloqueia o release até haver nova decisão com nova expiração', true, 'prorrogar é decisão nova, não efeito colateral.'),
          opc('b', 'É prorrogada automaticamente por mais 7 dias', false, 'prorrogação automática transforma exceção em regra sem gate.'),
          opc('c', 'Segue valendo, porque o motivo continua verdadeiro', false, 'a validade é a expiração datada, não a opinião sobre o motivo.')] },
      { id: 'lt04b6-aberta', pergunta: 'Uma ação válida do pós-mortem ainda está aberta quando o próximo release chega. Para onde ela vai?',
        opcoes: [
          opc('a', 'Para o gate do Bloco 2 como item condicional, com dono, condição e expiração', true, 'ou entra com dono e expiração, ou não entra no release.'),
          opc('b', 'Fica na ata, esperando alguém lembrar', false, 'é o "documento sem mudança": o próximo incidente cita o mesmo parágrafo.'),
          opc('c', 'É apagada quando o prazo vence', false, 'prazo vencido invalida a ação; a pendência precisa de destino.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Este bloco troca "não se repete" por aprendizado com <strong>dono, prazo e expiração</strong>. Três resultados: registrar o incidente com título, timeline e causas (sem os três, não há o que aprender), converter causa em ação com descrição, dono e prazo futuro (ação sem dono é intenção) e tratar <strong>waiver</strong> como exceção com expiração (vencida, bloqueia o release em vez de prorrogá-lo sozinha). Pré-requisito: Blocos 1 a 5, porque o incidente sempre cita versão, gate, stop, sinal e dono. A referência é <code>lab/posmortem_release.py</code>, só stdlib.</p>' +
          '<h3>N1 · Registro: o fato antes da culpa</h3>' +
          '<p><strong>Pós-mortem</strong> é o registro escrito do incidente: título que nomeia o que doeu, <strong>timeline</strong> com fatos ordenados e causas que explicam sem apontar pessoa. Sem timeline, a discussão vira memória contra memória; sem causas, vira lista de sustos. O oráculo acusa cada ausência pelo nome: título, timeline e causas ausentes aparecem separadas. Culpa individual não entra no registro, só como falha de processo que permitiu o erro humano.</p>' },
        { tipo: 'texto', html:
          '<h3>N2 · Ação: a causa com dono e prazo</h3>' +
          '<p><strong>Ação</strong> é a causa convertida em mudança: descrição do que muda, dono nomeado e prazo futuro em data ISO. Sem descrição, ninguém sabe o que fazer; sem dono, todos acham que é com outro; com prazo vencido ou ausente, a ação já nasceu morta. O oráculo testa cada ausência isoladamente: quatro casos, quatro acusações. Ação ainda aberta vira item condicional do Bloco 2: com dono, condição e expiração, ou não entra no release.</p>' +
          '<h3>N3 · Waiver: a exceção que expira</h3>' +
          '<p><strong>Waiver</strong> é a exceção assinada: motivo escrito, dono nomeado e expiração datada. Exceção sem expiração é regra nova sem gate. Vencida, bloqueia o release automaticamente: não pede prorrogação sozinha, exige nova decisão. O oráculo cobra os três casos: válida com os três campos, vencida que veta e sem dono que veta. No dossiê, a waiver aparece com validade consultável, nunca como "exceção permanente".</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Defeito raiz do catálogo', html:
          '<p>Pós-mortem sem ação com dono: o documento existe, a cerimônia aconteceu e o próximo incidente cita o mesmo parágrafo.</p>' },
        { tipo: 'takeaway', html: 'Aprender é <mark>causa</mark> virar <mark>ação com dono e prazo</mark>, e exceção ter <mark>validade</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'ordene', id: 'pm-ordene', titulo: 'Do incidente ao aprendizado', obrigatorio: false,
          enunciado: 'Ponha o caminho do pós-mortem na ordem: do que aconteceu até o que o próximo release cobra.',
          itens: [
            { id: 'acao', texto: 'Converter cada causa em ação com descrição, dono e prazo futuro' },
            { id: 'timeline', texto: 'Listar a timeline com fatos ordenados no tempo' },
            { id: 'gate', texto: 'Levar a ação ainda aberta ao próximo gate como item condicional com dono e expiração' },
            { id: 'titulo', texto: 'Dar um título que nomeia o que doeu e registrar o incidente' },
            { id: 'causas', texto: 'Separar as causas do sistema, sem apontar pessoas' }
          ],
          solucao: ['timeline', 'causas', 'titulo', 'acao', 'gate'],
          dica: 'Primeiro os fatos (timeline), depois a explicação (causas), depois o registro nomeado; só então as ações, e por último o destino da ação aberta.',
          tutorDepois: 'Fatos antes de causas, causas antes de ações, e a ação aberta só deixa de ser intenção quando chega a um gate.' },
        { tipo: 'texto', html:
          '<p>Agora a referência <code>lab/posmortem_release.py</code> em execução. Datas e nomes são exemplo variável; a folha B06-L executa os oráculos, e o incidente real pertence à trilha externa (BLOCKED com registro).</p>' },
        { tipo: 'rode', id: 'pm-rode', titulo: 'Prazo de ontem, waiver vencida', prefixo: '$', entrada: CMD, unidade: 'ms', terminalTitulo: 'lab/',
          enunciado: 'Rode a primeira etapa (Enter) e depois clique nas outras. Nas três, "hoje" é 2026-11-08.',
          prever: { pergunta: 'A ação tem descrição e dono, mas o prazo é 2026-11-07 (ontem). O que <code>validar_acao</code> devolve?', opcoes: [
            { id: 'a', texto: '[] : descrição e dono bastam.', correta: false, porque: 'prazo vencido invalida a ação, isoladamente.' },
            { id: 'b', texto: "['prazo ausente ou vencido']", correta: true, porque: 'cada ausência é acusada pelo nome; aqui só o prazo falha.' },
            { id: 'c', texto: "['dono ausente']", correta: false, porque: 'o dono está preenchido.' }
          ] },
          etapas: [
            { id: 'acao', nome: 'Ação com prazo vencido', descricao: 'prazo 2026-11-07', tom: 'dns', ms: 14, linhas: [
              L('cmd', CMD),
              L('out', "['prazo ausente ou vencido']"),
              L('hint', 'a ação nasce morta: converta em condicional com dono e expiração, não prorrogue em silêncio')] },
            { id: 'reg', nome: 'Registro incompleto', descricao: 'sem timeline e sem causas', tom: 'request', ms: 9, linhas: [
              L('cmd', "validar_registro({'titulo': 'x', 'timeline': [], 'causas': []})"),
              L('out', "['timeline ausente', 'causas ausentes']"),
              L('hint', 'cada ausência aparece separada, pelo nome')] },
            { id: 'waiver', nome: 'Waiver', descricao: 'vencida ontem × válida até amanhã', tom: 'response', ms: 11, linhas: [
              L('cmd', "waiver_valida({'motivo': 'm', 'dono': 'd', 'expiracao': '2026-11-07'}, '2026-11-08')"),
              L('out', 'False'),
              L('cmd', "waiver_valida({'motivo': 'm', 'dono': 'd', 'expiracao': '2026-11-09'}, '2026-11-08')"),
              L('out', 'True'),
              L('hint', 'vencida bloqueia o release até haver nova decisão')] }
          ],
          tutorDepois: 'Ação com prazo vencido, registro sem timeline e waiver vencida são recusados pelo nome, nunca em silêncio.',
          callout: 'Você viu cada ausência acusada e a waiver vencida bloquear.' },
        { tipo: 'takeaway', html: 'O oráculo acusa <mark>cada ausência</mark> pelo nome e deixa a waiver <mark>vencer</mark> sozinha.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'pm-python', titulo: 'Escreva o validador de aprendizado', obrigatorio: false,
          enunciado: 'Implemente <code>validar_registro</code> (cada ausência pelo nome: <code>titulo ausente</code>, <code>timeline ausente</code>, <code>causas ausentes</code>), <code>validar_acao</code> (<code>descricao ausente</code>, <code>dono ausente</code>, <code>prazo ausente ou vencido</code>; prazo igual a hoje ainda vale) e <code>waiver_valida</code> (motivo, dono e expiração a partir de hoje).',
          codigo: codigoPm, testes: testesPm,
          dica: 'Datas ISO (<code>AAAA-MM-DD</code>) comparam certo como texto: <code>str(acao.get("prazo", "")) &lt; hoje</code>. Prazo ausente vira texto vazio, que é menor que qualquer data. Use <code>str(...).strip()</code> para tratar espaços como vazio.',
          solucao: solucaoPm,
          tutorDepois: 'Os testes cobrem o caminho feliz, a borda (prazo igual a hoje), cada ausência isolada e a waiver vencida, que bloqueia.',
          callout: 'O validador passou nos testes: registro, ação e waiver.' },
        { tipo: 'escreva', id: 'pm-escreva', titulo: '"Melhorar o monitoramento"', obrigatorio: false,
          enunciado: 'O pós-mortem terminou com a ação "melhorar o monitoramento", prazo em 30 dias, sem responsável. Explique por que ela é inválida e como você a reescreveria.',
          placeholder: 'A ação é inválida porque… Eu a reescreveria assim…',
          rubrica: [
            'Diz que falta <strong>dono</strong>: ação "de todos" não sai do lugar, porque cada um acha que é com outro.',
            'Aponta que a <strong>descrição</strong> é vaga e a reescreve em mudança verificável (por exemplo, um alarme de p99 por slice).',
            'Reescreve com descrição, dono nomeado e <strong>prazo futuro</strong> em data ISO, e liga a ação à causa.'
          ],
          modelo: '<p>A ação não tem dono: com "a equipe" como responsável, cada pessoa assume que é com outra e nada acontece. A descrição também é vaga, porque "melhorar" não diz o que muda. Reescrita: "Criar alarme de p99 por slice no monitor do release (causa: sem leitura segmentada). Dono: Ana. Prazo: 2026-12-01". Se a ação ainda estiver aberta no próximo release, ela vira item condicional do gate, com dono e expiração.</p>' },
        { tipo: 'takeaway', html: 'Sem <mark>dono</mark> e sem <mark>data</mark>, a ação é <mark>intenção</mark>.' }
      ] },

      { rotulo: 'Julgar e conferir', blocos: [
        { tipo: 'cenario', id: 'pm-cenario', titulo: 'A waiver venceu ontem', obrigatorio: false,
          enunciado: 'Há três releases, uma waiver liberou a publicação sem o teste de carga da etapa nova. Ela tem motivo e dono, e a expiração era ontem. O release de hoje depende dela, e o time pede "só mais uma semana".',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O gate lê a waiver como vencida. O que você faz?', opcoes: [
              { texto: 'Prorrogar uma semana no próprio gate, porque o motivo continua valendo.', vai: 'f-regra', tom: 'ruim', consequencia: 'a prorrogação sem nova decisão transforma a exceção em regra sem gate.' },
              { texto: 'Deixar o gate bloquear e abrir uma nova decisão.', vai: 'decisao', tom: 'ok', consequencia: 'vencida bloqueia: prorrogar é decisão nova, não efeito colateral.' },
              { texto: 'Apagar a waiver do dossiê para o gate parar de reclamar.', vai: 'f-apagar', tom: 'ruim', consequencia: 'o risco aceito some do registro e ninguém mais sabe que ele existia.' }
            ] },
            decisao: { texto: 'A nova decisão precisa de um registro. Qual?', opcoes: [
              { texto: 'Nova waiver com motivo atualizado, dono nomeado e nova expiração datada, mais uma ação com prazo para fechar a lacuna.', vai: 'f-bom', tom: 'ok', consequencia: 'a exceção continua consultável e tem fim; a ação ataca a causa.' },
              { texto: 'Nova waiver sem expiração, "até resolver".', vai: 'f-regra', tom: 'ruim', consequencia: 'exceção sem expiração é regra nova sem gate.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O release esperou a decisão, a nova waiver tem validade consultável e a ação de carga tem dono e prazo.' },
            'f-regra': { bom: false, texto: 'A exceção virou regra: segue valendo release após release e ninguém lembra por quê.' },
            'f-apagar': { bom: false, texto: 'O próximo incidente veio da etapa sem teste de carga, e o dossiê não mostrava que o risco tinha sido aceito.' }
          },
          callout: 'Você deixou a waiver vencida bloquear e renovou com validade e ação.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Tabela de diagnóstico</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Discussão do incidente vira memória contra memória</td><td>Registro sem timeline: fatos sem ordem nem hora</td><td>Exigir timeline com fatos; acusar ausência pelo nome</td></tr>' +
          '<tr><td>Ação "de todos" não sai do lugar</td><td>Causa sem dono convertido: intenção sem responsável</td><td>Ação com descrição, dono e prazo futuro; cada ausência invalida</td></tr>' +
          '<tr><td>Exceção antiga segue valendo release após release</td><td>Waiver sem expiração: exceção virou regra sem gate</td><td>Expiração datada; vencida bloqueia até nova decisão</td></tr>' +
          '<tr><td>Mesmo incidente se repete com outro título</td><td>Causas sem ação vinculada: documento sem mudança</td><td>Ligar cada causa a ação com dono; pendência vira condicional do gate</td></tr>' +
          '</tbody></table>' },
        { tipo: 'escolha', id: 'pm-escolha-waiver', titulo: 'Confira: a waiver vencida',
          pergunta: 'Caso A: waiver completa, expiração amanhã. Caso B: a mesma waiver, expiração ontem. Qual é o efeito de cada uma no release de hoje?',
          opcoes: [
            opc('a', 'A libera; B bloqueia até nova decisão', true, 'a waiver vale enquanto a expiração é de hoje em diante; vencida bloqueia e exige nova decisão.'),
            opc('b', 'As duas liberam, porque o motivo é o mesmo', false, 'a validade é a expiração datada, não o motivo.'),
            opc('c', 'A libera; B é prorrogada sozinha', false, 'prorrogação automática é o defeito que o bloco chama de waiver sem expiração.'),
            opc('d', 'As duas bloqueiam, por precaução', false, 'a waiver dentro da validade e com os três campos é válida.')
          ] },
        { tipo: 'escolha', id: 'pm-escolha-registro', titulo: 'Confira: registro só com título',
          pergunta: 'Um registro de incidente traz apenas um título bem escrito. Qual é o veredito do oráculo?',
          opcoes: [
            opc('a', 'Aceita: o título nomeia o que doeu', false, 'só o título não permite aprender.'),
            opc('b', 'Acusa "timeline ausente" e "causas ausentes", separadas, pelo nome', true, 'sem timeline vira memória contra memória; sem causas vira lista de sustos.'),
            opc('c', 'Acusa só uma falha genérica de registro', false, 'o oráculo nomeia cada ausência separadamente.'),
            opc('d', 'Aceita se houver ações com dono', false, 'ações sem causas e timeline não têm o que corrigir.')
          ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fontes e versões', html:
          '<ul><li>NIST SSDF SP 800-218 (SRC-LT04-15): resposta a vulnerabilidade e melhoria contínua. Versão final 1.1. Risco médio.</li>' +
          '<li>NIST AI Resource Center, TEVV (SRC-LT04-07): lições de avaliação e incidentes. Risco alto; revalidar em até 90 dias.</li>' +
          '<li>Contrato de <code>lab/posmortem_release.py</code> e números citados: construção desta trilha, exemplo variável; os observados nascem na folha B06-L.</li></ul>' },
        { tipo: 'takeaway', html: 'Registro com <mark>fatos</mark>, ação com <mark>dono</mark>, exceção com <mark>validade</mark>.' }
      ] }
    ]
  });
})();
