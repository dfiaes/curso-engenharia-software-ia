/* E03 · Bloco 1: Governança como problema de engenharia. Fonte: E03.html#b01. Saídas do aigov são execuções reais do laboratório (11/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoArt = [
    'def artefatos_exigidos(s):',
    '    """s: dict com chaves opcionais personal_data, sensitive, risk_tier,',
    '    automated_decision, user_facing_generative, lifecycle."""',
    '    req = {"registro", "dono"}',
    '    # dado pessoal -> base_legal e retencao',
    '    # dado sensivel -> ripd',
    '    # risk_tier "high" -> avaliacao_impacto e red_team',
    '    # decisao automatizada -> revisao_humana',
    '    # generativo voltado ao usuario -> aviso_ia',
    '    # lifecycle "production" -> plano_incidente',
    '    return req',
    '', '',
    'A = {"personal_data": True, "user_facing_generative": True, "lifecycle": "production"}',
    'print(sorted(artefatos_exigidos(A)))', ''].join('\n');
  var testesArt = [
    'A = {"personal_data": True, "user_facing_generative": True, "lifecycle": "production"}',
    'B = {"personal_data": True, "sensitive": True, "risk_tier": "high", "automated_decision": True, "lifecycle": "production"}',
    '', '',
    'def test_assistente_de_apolices():',
    '    assert artefatos_exigidos(A) == {"registro", "dono", "base_legal", "retencao", "aviso_ia", "plano_incidente"}',
    '', '',
    'def test_triagem_de_sinistros_tem_tudo_de_A_e_mais():',
    '    r = artefatos_exigidos(B)',
    '    assert {"ripd", "avaliacao_impacto", "red_team", "revisao_humana", "plano_incidente"} <= r',
    '', '',
    'def test_borda_piloto_nao_exige_plano_de_incidente():',
    '    assert "plano_incidente" not in artefatos_exigidos({"personal_data": True, "lifecycle": "pilot"})',
    '', '',
    'def test_controle_negativo_minimo_so_registro_e_dono():',
    '    assert artefatos_exigidos({"risk_tier": "minimal"}) == {"registro", "dono"}',
    '', '',
    'def test_dado_comum_nao_exige_ripd():',
    '    assert "ripd" not in artefatos_exigidos({"personal_data": True})',
    ''].join('\n');
  var solucaoArt = [
    'def artefatos_exigidos(s):',
    '    req = {"registro", "dono"}',
    '    if s.get("personal_data"):',
    '        req |= {"base_legal", "retencao"}',
    '        if s.get("sensitive"):',
    '            req.add("ripd")',
    '    if s.get("risk_tier") == "high":',
    '        req |= {"avaliacao_impacto", "red_team"}',
    '    if s.get("automated_decision"):',
    '        req.add("revisao_humana")',
    '    if s.get("user_facing_generative"):',
    '        req.add("aviso_ia")',
    '    if s.get("lifecycle") == "production":',
    '        req.add("plano_incidente")',
    '    return req', ''].join('\n');

  TrilhaAula.registrar({
    id: 'e03-b1',
    titulo: 'Governança como problema de engenharia',
    minutos: 35,
    resumo: 'Governança de IA chega à engenharia como PDF de política sem critério de aceite. A saída é tratar obrigações como requisitos com dono, evidência e verificação: a classificação decide, por pessoas, quais artefatos precisam existir; a máquina confere se existem.',
    objetivo: 'Separar os três eixos de risco, nomear quem responde por quê em cada cadeia, derivar a lista de artefatos de uma classificação e saber o que um validador verde prova e o que não prova.',
    revisao: [
      { id: 'e03b1-mecanismo', pergunta: 'Qual é o mecanismo que organiza o módulo inteiro?',
        opcoes: [
          opc('a', 'Classificar o sistema (risco, dados, papel) determina quais artefatos precisam existir; cada artefato tem dono, validade e forma de verificação.', true, 'a classificação é humana; a checagem de que os artefatos existem é automatizável.'),
          opc('b', 'Um comitê revisa todo uso de IA e emite um parecer.', false, 'é a burocracia que o módulo quer evitar: humano conferindo o que máquina confere.'),
          opc('c', 'Um validador automático decide o enquadramento jurídico.', false, 'enquadramento é decisão humana, com apoio jurídico.')] },
      { id: 'e03b1-eixos', pergunta: 'Quais são os três eixos independentes que a palavra "risco" esconde?',
        opcoes: [
          opc('a', 'Probabilidade, impacto e custo.', false, 'são dimensões de um único eixo; os eixos de IA responsável são outros.'),
          opc('b', 'Risco regulatório do uso, risco de dados e risco técnico/operacional.', true, 'cada um tem quem define e artefatos próprios (<code>risk_tier</code>, <code>personal_data</code>/<code>stores</code>, <code>assessments</code>).'),
          opc('c', 'Risco jurídico, financeiro e reputacional.', false, 'são consequências, não eixos de classificação do sistema.')] },
      { id: 'e03b1-papeis', pergunta: 'Usar a API de um provedor de LLM transfere a responsabilidade pelo tratamento de dados?',
        opcoes: [
          opc('a', 'Sim, o provedor é o operador e responde por tudo.', false, 'o operador trata sob instruções; não decide finalidade nem meios.'),
          opc('b', 'Não: o controlador decide finalidade e meios e responde (art. 42); o contrato reparte obrigações operacionais, não o dever de ter base legal e avaliar risco.', true, 'o contrato do provedor é insumo do seu registro, não substituto dele.'),
          opc('c', 'Só se houver contrato com cláusulas-padrão.', false, 'a cláusula cobre transferência internacional, não transfere o dever do controlador.')] },
      { id: 'e03b1-validador', pergunta: 'O validador do registro passou em todo o inventário. O que isso prova?',
        opcoes: [
          opc('a', 'Que os sistemas estão em conformidade legal.', false, 'a máquina confere lacunas, não conformidade.'),
          opc('b', 'Que, dada a classificação declarada, os artefatos exigidos existem e são consistentes entre si.', true, 'não prova que a classificação está certa nem que a declaração corresponde ao que o sistema faz.'),
          opc('c', 'Que nenhum sistema trata dado pessoal.', false, 'o validador confia no que foi declarado.')] },
      { id: 'e03b1-granularidade', pergunta: 'Qual a granularidade defensável do registro?',
        opcoes: [
          opc('a', 'Um por sistema com finalidade própria; mudança de finalidade, provedor ou categoria de dado reabre o registro.', true, 'um por produto esconde mudanças; um por prompt é impossível de manter à mão.'),
          opc('b', 'Um por empresa.', false, 'esconde tudo o que importa.'),
          opc('c', 'Um por prompt e por modelo.', false, 'preciso, mas inviável de manter.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Governança de IA costuma chegar à engenharia como um PDF de política: princípios bonitos, nenhum critério de aceite. O resultado é previsível. Ou o time ignora o PDF, ou cria um comitê que revisa tudo e atrasa tudo. Há uma terceira saída, e ela é de engenharia: tratar obrigações como <strong>requisitos com dono, evidência e verificação</strong>, do mesmo modo que tratamos latência ou disponibilidade.</p>' +
          '<p>Um requisito sem teste é desejo. Uma obrigação sem evidência é, na prática, uma obrigação descumprida na hora da auditoria. Por isso governança não é uma camada sobre o sistema: é uma <em>propriedade</em> dele, como segurança. Ela se <strong>projeta</strong> (quais dados entram, onde ficam, quanto tempo), se <strong>mede</strong> (existe avaliação, está atual?) e se <strong>opera</strong> (quem é acionado quando o modelo causa dano?).</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'O que este módulo não é', html:
          'Não é curso de direito. Não decide base legal nem enquadramento de risco por você, e passar nas regras do laboratório não equivale a conformidade: as regras checam que o risco <em>declarado</em> tem os artefatos que ele implica. Segurança técnica (injeção, secrets, isolamento) está no M12; métricas, graders e o gate de evals estão no M06. Aqui você os usa como evidência.' },
        { tipo: 'texto', html:
          '<h3>O mecanismo: risco declarado implica artefatos</h3>' +
          '<p>O modelo mental do módulo inteiro cabe numa frase: <strong>classificar o sistema (risco, dados, papel da organização) determina quais artefatos precisam existir; cada artefato tem dono, prazo de validade e forma de verificação</strong>. São quatro passos:</p>' +
          '<ol><li><strong>Classificar</strong> risco, dados e papel. Pessoas decidem, com apoio jurídico.</li>' +
          '<li><strong>Derivar</strong> os artefatos exigidos. Máquina.</li>' +
          '<li><strong>Verificar</strong> schema e regras no CI. Máquina.</li>' +
          '<li><strong>Operar e revisar</strong>: incidente, validade, mudança. Se mudou modelo, dado, finalidade ou provedor, volta ao passo 1.</li></ol>' +
          '<p>Separar o passo 1 dos passos 2 e 3 evita as duas falhas simétricas: a burocracia (humanos conferindo o que máquina confere) e a falsa segurança (máquina "decidindo" o que é decisão jurídica).</p>' },
        { tipo: 'texto', html:
          '<h3>Categorias de risco: três eixos, não um</h3>' +
          '<p>"Risco" em IA responsável esconde pelo menos três eixos independentes. Confundi-los é o erro de classificação mais comum.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Eixo</th><th>Pergunta</th><th>Quem define</th><th>Exemplo de efeito</th></tr></thead><tbody>' +
          '<tr><td><strong>Risco regulatório do uso</strong></td><td>A finalidade cai numa categoria que a lei trata de forma especial (proibida, alto risco, transparência)?</td><td>Lei (EU AI Act, futuro marco brasileiro)</td><td>Triagem de currículos é alto risco; chatbot exige aviso de que é IA.</td></tr>' +
          '<tr><td><strong>Risco de dados</strong></td><td>Há dado pessoal, sensível, de criança? Para onde vai?</td><td>LGPD e, se aplicável, GDPR</td><td>RIPD, base legal, transferência internacional.</td></tr>' +
          '<tr><td><strong>Risco técnico/operacional</strong></td><td>O modelo pode errar, vazar, ser manipulado ou derivar?</td><td>Engenharia, com M06 e M12</td><td>Eval, red team, monitoramento, plano de incidente.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Um chatbot interno de TI pode ser mínimo nos três. Um gerador de resumos de prontuário é baixo no primeiro eixo se não decide nada, altíssimo no segundo (dado de saúde é sensível) e médio no terceiro. O registro do laboratório separa os eixos de propósito: <code>risk_tier</code> e <code>risk_rationale</code> para o primeiro, o bloco <code>personal_data</code> e <code>stores</code> para o segundo, <code>assessments</code> para o terceiro. Um campo só chamado "risco" perderia a informação que as regras precisam.</p>' +
          '<p>O <code>RiskTier</code> do lab (<code>prohibited</code>, <code>high</code>, <code>limited</code>, <code>minimal</code>) é <em>modelado</em> nos níveis do EU AI Act por ser a taxonomia mais conhecida. É um rótulo interno: escrever "limited" não torna o sistema legalmente de risco limitado. Daí o campo obrigatório <code>risk_rationale</code>. Quem classificou escreve o porquê, e a revisão discute o porquê, não o rótulo.</p>' },
        { tipo: 'takeaway', html: 'Governança é <mark>propriedade do sistema</mark>: a classificação decide quais <mark>artefatos</mark> existem, e a máquina confere.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Quem responde por quê: papéis</h3>' +
          '<p>Antes de qualquer artefato, é preciso saber quem é quem em cada cadeia. As leis usam vocabulários diferentes para papéis parecidos.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Papel</th><th>LGPD</th><th>EU AI Act</th><th>Num produto com LLM de terceiro</th></tr></thead><tbody>' +
          '<tr><td>Decide finalidade e meios</td><td>Controlador</td><td>Implantador (<em>deployer</em>) ou, se desenvolve e coloca no mercado, provedor</td><td>Sua empresa, que faz o produto.</td></tr>' +
          '<tr><td>Trata em nome de outro</td><td>Operador</td><td>-</td><td>O provedor de API, quando só processa seus dados sob suas instruções.</td></tr>' +
          '<tr><td>Desenvolve ou coloca o sistema/modelo no mercado</td><td>-</td><td>Provedor (<em>provider</em>); provedor de modelo de uso geral é categoria própria</td><td>O fabricante do modelo; você também, se empacota um sistema próprio.</td></tr>' +
          '<tr><td>Contato com titulares e ANPD</td><td>Encarregado (DPO)</td><td>-</td><td>Quem recebe pedidos de acesso e apagamento.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Duas consequências práticas. Primeira: a mesma empresa pode ser controladora de dados de clientes, <em>implantadora</em> do modelo de um terceiro e <em>provedora</em> de um sistema que revende a outro, tudo num produto só, com obrigações diferentes em cada papel. Segunda: o provedor pode, dependendo do contrato e do uso, deixar de ser mero operador, por exemplo quando treina o próprio modelo com seus dados para finalidade própria. É o que a regra AIG-007 sinaliza com <code>provider.trains_on_inputs</code>.</p>' +
          '<h3>Exemplo trabalhado: três sistemas de uma seguradora fictícia</h3>' +
          '<p>O objetivo não é acertar o enquadramento jurídico. É ver que a classificação produz uma lista de artefatos diferente em cada caso.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sistema</th><th>Uso</th><th>Dados</th><th>Artefatos que a classificação implica</th></tr></thead><tbody>' +
          '<tr><td><strong>A.</strong> Assistente de dúvidas sobre apólices (RAG)</td><td>Responde cliente; não decide</td><td>Nome, CPF, e-mail em prompts</td><td>Registro; base legal (execução de contrato); retenção do log de prompts; aviso de que é IA; eval de fidelidade; plano de incidente.</td></tr>' +
          '<tr><td><strong>B.</strong> Triagem de sinistros que sugere recusa automática</td><td>Afeta direito do titular</td><td>Dado financeiro, possivelmente de saúde (sensível)</td><td>Tudo de A, mais RIPD, revisão humana efetiva (LGPD art. 20), avaliação de impacto, teste de viés, trilha de auditoria, possivelmente alto risco onde a jurisdição o define assim.</td></tr>' +
          '<tr><td><strong>C.</strong> Resumo interno de reuniões de engenharia</td><td>Produtividade</td><td>Nomes de colegas</td><td>Registro enxuto; retenção definida; verificar se o fornecedor treina com os dados. Pouco mais.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Se A, B e C seguissem o mesmo processo, ou C seria sufocado ou B seria negligenciado. <strong>Governança proporcional ao risco</strong> é o que torna o sistema sustentável.</p>' +
          '<p>O laboratório <code>aigov</code> dá um par de registros para ver a diferença: <code>good.yaml</code> (assistente de atendimento resolvido) e <code>bad.yaml</code> (triagem de currículos, feita para falhar). Cada regra do resultado vem de um bloco deste módulo.</p>' },
        { tipo: 'rode', id: 'gov-rode', titulo: 'O mesmo validador em dois registros', enunciado: 'Saída real do laboratório (11/10/2026). <code>--today</code> fixa o relógio para a saída ser reproduzível. Aperte Enter e associe cada regra a um bloco.',
          prefixo: '$', entrada: 'uv run python -m aigov validate examples/good.yaml --today 2026-10-11', unidade: 's', terminalTitulo: 'aigov', etapas: [
            { id: 'good', nome: 'good.yaml', descricao: 'Assistente de atendimento: tudo que o risco declarado implica existe', tom: 'tcp', ms: 1, linhas: [
              L('cmd', 'uv run python -m aigov validate examples/good.yaml --today 2026-10-11; echo "exit=$?"'),
              L('out', 'good.yaml: 0 error(s), 0 warning(s)'),
              L('hint', 'exit=0')] },
            { id: 'bad', nome: 'bad.yaml', descricao: 'Triagem de currículos: dado sensível, três armazenamentos sem eliminação, provedor sem mecanismo de transferência', tom: 'tls', ms: 2, linhas: [
              L('cmd', 'uv run python -m aigov validate examples/bad.yaml --today 2026-10-11; echo "exit=$?"'),
              L('out', 'bad.yaml: 10 error(s), 3 warning(s)'),
              L('out', '  ERROR AIG-002 legal_basis: \'legitimate_interest\' is not a valid basis for sensitive data (LGPD art. 11)'),
              L('out', '  ERROR AIG-003 stores[0].retention_days: prompt_log holds personal data without a retention period'),
              L('out', '  ERROR AIG-004 stores[0].erasure_supported: prompt_log holds personal data but cannot erase one data subject (LGPD art. 18)'),
              L('out', '  ERROR AIG-004 stores[1].erasure_supported: vector_store holds personal data but cannot erase one data subject (LGPD art. 18)'),
              L('out', '  ERROR AIG-004 stores[2].erasure_supported: finetune_dataset holds personal data but cannot erase one data subject (LGPD art. 18)'),
              L('out', '  ERROR AIG-006 provider.transfer_mechanism: provider in US receives personal data without a documented transfer mechanism (LGPD arts. 33-36)'),
              L('out', '  WARN  AIG-007 provider.trains_on_inputs: provider may train on inputs that contain personal data; confirm purpose compatibility or disable it by contract'),
              L('out', '  ERROR AIG-009 assessments: high risk without an impact assessment'),
              L('out', '  ERROR AIG-010 assessments: sensitive or children\'s data without a data protection impact report (RIPD)'),
              L('out', '  ERROR AIG-011 human_review: automated decision affecting people without a review path (LGPD art. 20)'),
              L('out', '  ERROR AIG-012 incident_plan: production system without an incident plan'),
              L('out', '  WARN  AIG-013 assessments: high risk without a red team record'),
              L('out', '  WARN  AIG-014 assessments[0]: eval_report is 589 days old (limit 365)'),
              L('hint', 'exit=1')] }
          ],
          prever: { pergunta: 'O validador roda nos dois registros. Qual par de códigos de saída você espera (good, bad)?', opcoes: [
            { id: 'a', texto: '0 e 0: o validador só informa e nunca bloqueia.', correta: false, porque: 'achado de erro precisa bloquear o merge; senão a regra é decoração.' },
            { id: 'b', texto: '0 e 1: sem achados passa; com erros, falha.', correta: true, porque: 'é o contrato que o CI usa no bloco 5. O exit 2 fica reservado a erro de uso ou de carga (schema).' },
            { id: 'c', texto: '1 e 1: avisos também bloqueiam sempre.', correta: false, porque: 'sem <code>--strict</code>, aviso informa e sai com 0; o bloco 5 explica a política.' }
          ] },
          tutorDepois: 'O mesmo código leu dois registros e a diferença saiu como lista de lacunas com regra, campo e artigo. Repare no que o validador não faz: não diz se "high" é o risco certo para a triagem de currículos. Isso foi declarado por gente.',
          callout: 'Você viu a classificação declarada virar uma lista verificável de artefatos que faltam.' },
        { tipo: 'takeaway', html: 'Papel define <mark>quem deve o quê</mark>; a classificação define <mark>quais artefatos</mark>; a proporção ao risco é o que evita a burocracia.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Duas peças. Primeiro você escreve a derivação do passo 2 (classificação entra, lista de artefatos sai). Depois decide, num cenário, o que fazer com a frase "o provedor é responsável".</p>' },
        { tipo: 'python', id: 'gov-python', titulo: 'Derive os artefatos da classificação', obrigatorio: false,
          enunciado: 'Complete <code>artefatos_exigidos(s)</code>: devolva o <em>conjunto</em> de artefatos que a classificação <code>s</code> implica, seguindo o comentário de cada regra. <code>registro</code> e <code>dono</code> valem sempre. Dado sensível só conta se também houver dado pessoal.',
          codigo: codigoArt, testes: testesArt,
          dica: 'Use <code>req |= {"base_legal", "retencao"}</code> dentro de <code>if s.get("personal_data"):</code>; o RIPD fica aninhado nesse mesmo if, porque dado sensível pressupõe dado pessoal.',
          solucao: solucaoArt,
          tutorDepois: 'Os testes incluem o controle negativo: um sistema mínimo exige só registro e dono. A proporcionalidade é isto em código, e o mesmo desenho (dict entra, conjunto sai) é o que as regras AIG do laboratório fazem com o registro Pydantic.',
          callout: 'A classificação virou uma função pura e testável: dá para rodar no CI.' },
        { tipo: 'cenario', id: 'gov-cenario', titulo: 'O provedor é responsável?', obrigatorio: false,
          enunciado: 'Num design review, um colega diz: "usamos API de terceiro, então a responsabilidade é do provedor". O assistente envia CPF e e-mail nos prompts. Decida o que fazer.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O produto vai para produção em duas semanas. O que você faz?', opcoes: [
              { texto: 'Concordar e registrar o provedor como responsável pelo tratamento.', vai: 'f-escudo', tom: 'ruim', consequencia: 'quem decidiu enviar dado pessoal e para quê é o controlador; o registro fica com a base legal em branco.' },
              { texto: 'Ler o DPA e os termos de retenção e treino do provedor e usá-los como insumo do seu registro.', vai: 'contrato', tom: 'ok', consequencia: 'o contrato do provedor é insumo, não substituto do seu registro.' },
              { texto: 'Bloquear o lançamento até haver um comitê de IA.', vai: 'f-comite', tom: 'ruim', consequencia: 'você trocou uma verificação objetiva por reunião e atrasou tudo.' }
            ] },
            contrato: { texto: 'O termo diz que o provedor retém prompts por 30 dias e pode usá-los para melhorar o modelo, salvo desativação por contrato. O que o registro passa a dizer?', opcoes: [
              { texto: '<code>trains_on_inputs: true</code> e retenção do provedor declarada; tentar desativar o treino por contrato e minimizar o que vai no prompt.', vai: 'f-bom', tom: 'ok', consequencia: 'o ponto cego vira campo com dono e a regra AIG-007 passa a avisar enquanto o contrato não muda.' },
              { texto: 'Escrever "não guardamos nada" para o pitch ficar limpo.', vai: 'f-mentira', tom: 'ruim', consequencia: 'declaração sem verificação: o primeiro questionário de cliente ou a ANPD desmonta a frase.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O registro diz o que o provedor retém e se treina, o treino é negociado, e a minimização do prompt reduz o que cruza a rede. A responsabilidade continua sua, agora com evidência.' },
            'f-escudo': { bom: false, texto: 'Na primeira solicitação de um titular, ninguém sabia onde estava o dado nem em qual base legal. O contrato do provedor não respondia a nenhuma das duas perguntas.' },
            'f-comite': { bom: false, texto: 'O comitê virou fila. O time contornou o processo com um piloto "informal" (shadow AI), onde costuma estar o maior vazamento.' },
            'f-mentira': { bom: false, texto: 'A frase entrou na apresentação e no questionário. Quando o termo do provedor foi lido por outra pessoa, o registro e o contrato divergiam.' }
          },
          callout: 'Você tratou o contrato do provedor como insumo do registro e não como escudo.' },
        { tipo: 'takeaway', html: 'O provedor é <mark>insumo</mark> do registro, não <mark>escudo</mark>: quem decide finalidade e meios responde.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs', html:
          '<ul><li><strong>Granularidade do registro.</strong> Um por produto é fácil de manter e esconde mudanças; um por modelo/prompt/fluxo é preciso e impossível de manter à mão. Regra prática: um registro por <em>sistema com finalidade própria</em>; mudança de finalidade, de provedor ou de categoria de dado reabre o registro.</li>' +
          '<li><strong>Classificar para cima ou para baixo.</strong> Alto demais gera trabalho; baixo demais gera exposição. Na dúvida, registre a classificação conservadora provisória, com o motivo, e peça revisão jurídica. Revisar uma classificação alta custa pouco perto de explicar uma baixa a um regulador.</li>' +
          '<li><strong>Centralizado versus federado.</strong> Um time central de governança escala mal; times de produto sem padrão comum divergem. O arranjo que costuma funcionar: padrão central (schema e regras), dono do registro no time do produto, revisão central só para o que o schema marca como alto risco.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Confundir <em>inventário</em> com <em>conformidade</em>: ter lista de sistemas não prova nada sobre eles.</li>' +
          '<li>Registrar só o que o time considera "IA" e esquecer o recurso de LLM embutido em ferramenta SaaS contratada. Uso informal (<em>shadow AI</em>) é onde costuma estar o maior vazamento.</li>' +
          '<li>Deixar a classificação de risco com o time que quer lançar o produto, sem revisão independente.</li>' +
          '<li>Registro que nasce correto e nunca é atualizado: a avaliação tem data e vence (regra AIG-014).</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: tratar o provedor de API como escudo', html:
          'O instinto de arquiteto é delegar: "o dado vai para o provedor, ele é o especialista". Juridicamente, quem decidiu enviar dado pessoal e para quê é o controlador. O contrato do provedor (DPA, termos de retenção, treinamento sobre entradas, subprocessadores) é <em>insumo</em> do seu registro, não substituto dele. Leia o que o provedor retém por padrão e por quanto tempo antes de dizer, em reunião, que "não guardamos nada".' },
        { tipo: 'escolha', id: 'gov-escolha-validador', titulo: 'Confira: o validador verde',
          pergunta: 'O validador do registro passou em todos os sistemas do inventário. O que isso prova?',
          opcoes: [
            opc('a', 'Que os sistemas estão em conformidade legal.', false, 'confunde checagem de lacunas com conformidade.'),
            opc('b', 'Que, dada a classificação declarada, os artefatos exigidos existem e são consistentes entre si; não que a classificação está certa.', true, 'a máquina confere artefatos; a classificação é decisão humana, com apoio jurídico.'),
            opc('c', 'Que nenhum sistema trata dado pessoal.', false, 'esquece que o validador confia no que foi declarado.')
          ], tutorDepois: 'Verde significa "os artefatos que a classificação declarada implica existem".' },
        { tipo: 'escolha', id: 'gov-escolha-gerador', titulo: 'Confira: três eixos',
          pergunta: 'Um gerador de resumos de prontuário não decide nada sobre o paciente. Como ele se classifica nos três eixos?',
          opcoes: [
            opc('a', 'Baixo no uso regulatório se não decide; altíssimo em dados (saúde é sensível); médio no técnico.', true, 'cada eixo responde a uma pergunta e a um responsável diferente; um campo único de "risco" perderia isso.'),
            opc('b', 'Mínimo nos três: sem decisão, não há risco.', false, 'ignora que o eixo de dados independe de o sistema decidir.'),
            opc('c', 'Alto nos três, por precaução.', false, 'classificar tudo no máximo sufoca o que é proporcionalmente simples.')
          ], tutorDepois: 'Os eixos são independentes: o artefato certo vem da combinação.' },
        { tipo: 'takeaway', html: 'Humanos <mark>julgam a classificação</mark>; a máquina confere os <mark>artefatos</mark>; o provedor não é escudo.' }
      ] }
    ]
  });
})();
