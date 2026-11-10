/* E03 · Bloco 4: Frameworks e artefatos. Fonte: E03.html#b04. Verificado em 11/10/2026 (itens com * vêm de fonte secundária). Saídas do aigov são execuções reais do laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoVal = [
    'from datetime import date, timedelta', '',
    'OBRIGATORIOS = {"id", "name", "owner", "purpose", "lifecycle", "risk_tier", "risk_rationale"}',
    'PERMITIDOS = OBRIGATORIOS | {"stores", "assessments", "legal_basis", "personal_data", "provider"}',
    'STORE_CAMPOS = {"kind", "holds_personal_data", "retention_days", "erasure_supported"}',
    'LIMITE = timedelta(days=365)', '', '',
    'def validar(reg, hoje):',
    '    """Devolve uma lista ordenada de (regra, caminho)."""',
    '    erros = []',
    '    # 1. campo obrigatorio ausente -> ("SCHEMA", campo)',
    '    # 2. campo fora de PERMITIDOS    -> ("SCHEMA", campo)',
    '    # 3. em cada store, chave fora de STORE_CAMPOS -> ("SCHEMA", "stores.<i>.<campo>")',
    '    if erros:',
    '        return sorted(erros)  # esquema invalido: as regras nem rodam',
    '    # 4. avaliacao com MAIS de 365 dias -> ("AIG-014", "assessments.<i>")',
    '    return []', ''].join('\n');
  var testesVal = [
    'HOJE = date(2026, 10, 11)',
    'BASE = {"id": "x", "name": "X", "owner": "a@example.com", "purpose": "p", "lifecycle": "production",',
    '        "risk_tier": "limited", "risk_rationale": "r",',
    '        "stores": [{"kind": "prompt_log", "holds_personal_data": True, "retention_days": 30, "erasure_supported": True}],',
    '        "assessments": [{"kind": "eval_report", "done_on": date(2026, 9, 15), "reference": "E1"}]}',
    '', '',
    'def test_registro_ok():',
    '    assert validar(BASE, HOJE) == []', '', '',
    'def test_erro_de_digitacao_no_store_e_recusado():',
    '    reg = dict(BASE, stores=[{"kind": "prompt_log", "holds_personal_data": True, "retention_day": 30, "erasure_supported": True}])',
    '    assert validar(reg, HOJE) == [("SCHEMA", "stores.0.retention_day")]', '', '',
    'def test_campo_obrigatorio_ausente():',
    '    reg = {k: v for k, v in BASE.items() if k != "owner"}',
    '    assert validar(reg, HOJE) == [("SCHEMA", "owner")]', '', '',
    'def test_campo_extra_no_topo():',
    '    assert validar(dict(BASE, risco="alto"), HOJE) == [("SCHEMA", "risco")]', '', '',
    'def test_avaliacao_vencida():',
    '    reg = dict(BASE, assessments=[{"kind": "eval_report", "done_on": HOJE - timedelta(days=400), "reference": "E1"}])',
    '    assert validar(reg, HOJE) == [("AIG-014", "assessments.0")]', '', '',
    'def test_borda_exatos_365_dias_nao_vence():',
    '    reg = dict(BASE, assessments=[{"kind": "eval_report", "done_on": HOJE - timedelta(days=365), "reference": "E1"}])',
    '    assert validar(reg, HOJE) == []', '', '',
    'def test_schema_invalido_nao_roda_as_regras():',
    '    reg = dict(BASE, risco="alto", assessments=[{"kind": "eval_report", "done_on": HOJE - timedelta(days=400), "reference": "E1"}])',
    '    assert validar(reg, HOJE) == [("SCHEMA", "risco")]', ''].join('\n');
  var solucaoVal = [
    'from datetime import date, timedelta', '',
    'OBRIGATORIOS = {"id", "name", "owner", "purpose", "lifecycle", "risk_tier", "risk_rationale"}',
    'PERMITIDOS = OBRIGATORIOS | {"stores", "assessments", "legal_basis", "personal_data", "provider"}',
    'STORE_CAMPOS = {"kind", "holds_personal_data", "retention_days", "erasure_supported"}',
    'LIMITE = timedelta(days=365)', '', '',
    'def validar(reg, hoje):',
    '    erros = []',
    '    for campo in OBRIGATORIOS - reg.keys():',
    '        erros.append(("SCHEMA", campo))',
    '    for campo in reg.keys() - PERMITIDOS:',
    '        erros.append(("SCHEMA", campo))',
    '    for i, s in enumerate(reg.get("stores", [])):',
    '        for campo in s.keys() - STORE_CAMPOS:',
    '            erros.append(("SCHEMA", f"stores.{i}.{campo}"))',
    '    if erros:',
    '        return sorted(erros)',
    '    achados = []',
    '    for i, a in enumerate(reg.get("assessments", [])):',
    '        if hoje - a["done_on"] > LIMITE:',
    '            achados.append(("AIG-014", f"assessments.{i}"))',
    '    return achados', ''].join('\n');

  TrilhaAula.registrar({
    id: 'e03-b4',
    titulo: 'Frameworks e artefatos',
    minutos: 40,
    resumo: 'Leis dizem o que deve ser alcançado; frameworks e normas dizem como organizar o trabalho. NIST AI RMF e ISO/IEC 42001 dão vocabulário comum com auditores e clientes, e os artefatos que os sustentam são poucos e checáveis, desde que presos a versão e data.',
    objetivo: 'Dizer o que cada framework é e não é, mapear as funções do NIST ao que o curso já ensinou, listar os artefatos que um auditor pede e entender por que o registro é um esquema fechado.',
    revisao: [
      { id: 'e03b4-nist', pergunta: 'Quais são as quatro funções do NIST AI RMF 1.0?',
        opcoes: [
          opc('a', 'Govern, Map, Measure e Manage.', true, 'Govern cria as condições (transversal); Map, Measure e Manage são o ciclo operacional.'),
          opc('b', 'Plan, Do, Check e Act.', false, 'é o ciclo PDCA, de outra família de normas.'),
          opc('c', 'Identify, Protect, Detect e Respond.', false, 'é o vocabulário de cibersegurança, não o do AI RMF.')] },
      { id: 'e03b4-iso', pergunta: 'O que a certificação ISO/IEC 42001 atesta?',
        opcoes: [
          opc('a', 'Que um modelo específico é seguro, justo e preciso.', false, 'a norma certifica processo, não produto.'),
          opc('b', 'Que a organização tem um sistema de gestão de IA operando para o escopo declarado; verifique escopo e validade do certificado.', true, 'não atesta propriedades de um produto específico nem substitui nenhuma lei.'),
          opc('c', 'Que a empresa cumpre o EU AI Act.', false, 'nenhuma norma voluntária substitui lei.')] },
      { id: 'e03b4-nist-cert', pergunta: 'O NIST AI RMF é certificável?',
        opcoes: [
          opc('a', 'Não: é framework voluntário, independente de setor.', true, 'serve de vocabulário e checklist de risco; o perfil AI 600-1 trata riscos específicos de IA generativa.'),
          opc('b', 'Sim, por organismo acreditado.', false, 'é a ISO/IEC 42001 que é certificável.'),
          opc('c', 'Sim, pelo próprio NIST.', false, 'o NIST não certifica.')] },
      { id: 'e03b4-fechado', pergunta: 'Por que o registro usa um esquema fechado (<code>extra="forbid"</code>)?',
        opcoes: [
          opc('a', 'Para um campo digitado errado (<code>retention_day</code>) ser recusado em vez de ignorado em silêncio e deixar o armazenamento "sem prazo".', true, 'em governança, ignorar um campo é pior do que falhar.'),
          opc('b', 'Para o arquivo ficar menor.', false, 'não é questão de tamanho.'),
          opc('c', 'Para impedir que o jurídico edite o registro.', false, 'o registro é revisado por PR; o fechamento é do schema.')] },
      { id: 'e03b4-versao', pergunta: 'Por que o model card precisa estar vinculado a uma versão?',
        opcoes: [
          opc('a', 'Sem a versão do modelo e do prompt avaliado, vira documento histórico; a regra AIG-014 marca avaliação com mais de 365 dias.', true, 'preencher uma vez e nunca reabrir quando modelo, prompt ou provedor mudam é erro comum.'),
          opc('b', 'Porque a lei exige o número da versão em letras maiúsculas.', false, 'o motivo é de engenharia: o artefato descreve algo específico.'),
          opc('c', 'Porque versão aumenta o score do auditor.', false, 'auditor pede evidência, não cosmética.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Leis dizem <em>o que</em> deve ser alcançado; frameworks e normas dizem <em>como organizar o trabalho</em>. Eles interessam porque oferecem vocabulário comum com auditores, clientes e jurídico, e porque transformam "ter governança" em um conjunto enumerável de artefatos. A condição é saber o que cada um é, para não vender um framework voluntário como certificação.</p>' +
          '<h3>NIST AI RMF 1.0 e o perfil de IA generativa</h3>' +
          '<p>O <em>AI Risk Management Framework</em> do NIST (versão 1.0, 26 de janeiro de 2023) é voluntário, independente de setor e não certificável. Organiza-se em quatro funções:</p>' +
          '<ul><li><strong>Govern</strong>: cultura, papéis, políticas (transversal).</li>' +
          '<li><strong>Map</strong>: contexto, finalidade, partes afetadas, riscos antecipados.</li>' +
          '<li><strong>Measure</strong>: testes, métricas, avaliação de confiabilidade.</li>' +
          '<li><strong>Manage</strong>: priorizar, tratar e monitorar riscos, responder a incidentes.</li></ul>' +
          '<p>Para lembrar: <em>Govern</em> cria as condições; <em>Map, Measure, Manage</em> são o ciclo operacional.</p>' +
          '<p>O <strong>NIST AI 600-1, Generative AI Profile</strong> (26 de julho de 2024) é um perfil específico que lista riscos próprios ou agravados por IA generativa (por exemplo, confabulação, privacidade de dados, conteúdo nocivo, propriedade intelectual, segurança da informação, integração com cadeia de suprimentos) e ações sugeridas mapeadas às funções do framework.</p>' +
          '<p>Em 11/10/2026, a página do NIST indicava que o AI RMF 1.0 está sendo revisado no contexto do Plano de Ação de IA da Casa Branca, sem data nem detalhe; a mesma página registra, em 7 de abril de 2026, uma nota conceitual de perfil para infraestrutura crítica. <strong>Verifique a página do NIST antes de citar a versão vigente.</strong></p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Mapeamento para o que o curso já ensinou', html:
          '<ul><li><strong>Map</strong> é o registro de sistema e a classificação (este módulo).</li>' +
          '<li><strong>Measure</strong> é a suíte de evals e o red team (M06, M12).</li>' +
          '<li><strong>Manage</strong> é monitoramento, plano de incidente e desativação.</li>' +
          '<li><strong>Govern</strong> é quem é dono de quê, o que exige aprovação e o que acontece quando a regra é violada.</li></ul>' },
        { tipo: 'texto', html:
          '<h3>ISO/IEC 42001</h3>' +
          '<p>A ISO/IEC 42001 (publicada em dezembro de 2023) é a norma de <strong>sistema de gestão de IA</strong> (AIMS), no mesmo estilo estrutural de ISO 27001 e 9001: contexto da organização, liderança e política, planejamento (inclui avaliação de risco e de impacto), apoio, operação, avaliação de desempenho (auditoria interna, análise crítica) e melhoria contínua, com controles em anexo. Ela é <strong>certificável</strong>: um organismo de certificação audita a organização. Segundo fonte consultada*, a ISO/IEC 42006, publicada em 7 de julho de 2025, define requisitos adicionais para os organismos que auditam e certificam sistemas de gestão de IA; confirme o estado atual com a ISO.</p>' +
          '<p>O que a certificação atesta é que a organização tem um sistema de gestão operando para o escopo declarado. Ela <em>não</em> atesta que um modelo específico é seguro, justo ou preciso. Ao ler o certificado de um fornecedor, verifique o <strong>escopo</strong> (quais produtos e processos) e a <strong>validade</strong>.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th></th><th>NIST AI RMF / 600-1</th><th>ISO/IEC 42001</th></tr></thead><tbody>' +
          '<tr><td><strong>Natureza</strong></td><td>Framework e perfil voluntários</td><td>Norma de sistema de gestão</td></tr>' +
          '<tr><td><strong>Certificável</strong></td><td>Não</td><td>Sim, por organismo acreditado</td></tr>' +
          '<tr><td><strong>Foco</strong></td><td>Riscos e ações por função</td><td>Processos de gestão auditáveis</td></tr>' +
          '<tr><td><strong>Quando usar</strong></td><td>Vocabulário e checklist de risco</td><td>Sinal de maturidade exigido por clientes; estrutura de auditoria</td></tr>' +
          '<tr><td><strong>Relação com leis</strong></td><td>Não substitui nenhuma</td><td>Não substitui nenhuma; pode apoiar evidências de conformidade</td></tr>' +
          '</tbody></table>' },
        { tipo: 'complete', id: 'fw-complete', titulo: 'Ligue cada função do NIST ao que você já tem',
          linguagem: 'markdown',
          enunciado: 'Escolha, em cada lacuna, o artefato do curso que cumpre a função.',
          partes: [
            '- **Map**: ', { lacuna: 'map', opcoes: ['registro de sistema e classificação de risco', 'suíte de evals e red team', 'plano de incidente e desativação'], correta: 'registro de sistema e classificação de risco' },
            '\n- **Measure**: ', { lacuna: 'measure', opcoes: ['suíte de evals e red team', 'registro de sistema e classificação de risco', 'quem é dono de quê'], correta: 'suíte de evals e red team' },
            '\n- **Manage**: ', { lacuna: 'manage', opcoes: ['monitoramento, plano de incidente e desativação', 'inventário de sistemas', 'model card'], correta: 'monitoramento, plano de incidente e desativação' },
            '\n- **Govern**: ', { lacuna: 'govern', opcoes: ['dono de cada coisa, o que exige aprovação e o que acontece quando a regra é violada', 'o teste de carga do provedor', 'o log de prompts'], correta: 'dono de cada coisa, o que exige aprovação e o que acontece quando a regra é violada' },
            '\n'
          ],
          explicacao: 'Govern é transversal e cria as condições; Map, Measure e Manage formam o ciclo. O NIST dá o vocabulário, e o curso já tinha as peças: registro (este módulo), evals e red team (M06, M12), monitoramento e incidente.',
          callout: 'Mapeamento feito: o framework organiza o que você já constrói.' },
        { tipo: 'takeaway', html: 'NIST é <mark>vocabulário voluntário</mark>; ISO 42001 certifica <mark>processo</mark>, não produto; nenhum dos dois decide o risco.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Os artefatos: o mínimo que o auditor pede</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Artefato</th><th>Responde a</th><th>Conteúdo essencial</th><th>Onde no lab</th></tr></thead><tbody>' +
          '<tr><td><strong>Inventário / registro de sistema</strong></td><td>O que existe e quem é dono?</td><td>Finalidade, dono, ciclo de vida, risco e justificativa, dados, armazenamentos, provedor, avaliações</td><td><code>AISystemRecord</code></td></tr>' +
          '<tr><td><strong>Avaliação de impacto</strong> (algorítmico/direitos fundamentais)</td><td>Quem pode ser prejudicado e como?</td><td>Partes afetadas, danos plausíveis, mitigação, revisão humana, decisão de seguir ou não</td><td><code>AssessmentKind.IMPACT</code></td></tr>' +
          '<tr><td><strong>RIPD</strong> (relatório de impacto à proteção de dados, art. 38 LGPD)</td><td>Que risco o tratamento causa ao titular?</td><td>Dados, finalidade, base, riscos, salvaguardas</td><td><code>AssessmentKind.DPIA</code></td></tr>' +
          '<tr><td><strong>Model card</strong></td><td>O que é este modelo/sistema e onde falha?</td><td>Uso pretendido e não pretendido, versão, dados, métricas por subgrupo, limitações</td><td><code>AssessmentKind.MODEL_CARD</code></td></tr>' +
          '<tr><td><strong>Datasheet do dataset</strong></td><td>De onde vêm os dados e o que contêm?</td><td>Origem, coleta, consentimento/base, composição, vieses conhecidos, usos recomendados</td><td>Procedência do dataset (campo de armazenamento)</td></tr>' +
          '<tr><td><strong>Registro de riscos</strong></td><td>Quais riscos conhecemos, qual o estado?</td><td>Risco, probabilidade, impacto, dono, mitigação, status, data de revisão</td><td>Racional do risco e avaliações datadas</td></tr>' +
          '<tr><td><strong>Relatório de eval e de red team</strong></td><td>Foi testado contra quê?</td><td>Conjuntos, métricas, resultados, versão avaliada</td><td><code>EVAL_REPORT</code>, <code>RED_TEAM</code></td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Model card e datasheet vêm da literatura de pesquisa (Mitchell e coautores para <em>model cards</em>; Gebru e coautores para <em>datasheets for datasets</em>) e hoje são práticas difundidas. O ponto de engenharia: o artefato precisa estar <strong>vinculado a uma versão</strong>. Um model card sem a versão do modelo e do prompt avaliado vira documento histórico, e a regra AIG-014 marca avaliação com mais de 365 dias.</p>' +
          '<h3>Exemplo trabalhado: um registro mínimo em YAML</h3>' },
        { tipo: 'codigo', linguagem: 'yaml', texto:
          'id: assistente-atendimento\n' +
          'name: Assistente de atendimento ao cliente\n' +
          'owner: maria.souza@example.com\n' +
          'purpose: Responder dúvidas de clientes sobre faturas e planos usando a base de ajuda aprovada.\n' +
          'lifecycle: production\n' +
          'risk_tier: limited\n' +
          'risk_rationale: Chatbot que conversa com pessoas e não decide sobre direitos; exige aviso de IA.\n' +
          'personal_data: {processes: true, categories: [nome, cpf, e-mail], sensitive: false}\n' +
          'legal_basis: contract\n' +
          'stores:\n' +
          '  - {kind: prompt_log, holds_personal_data: true, retention_days: 30, erasure_supported: true}\n' +
          'provider: {name: ProvedorExemplo, country: US, trains_on_inputs: false,\n' +
          '           transfer_mechanism: clausulas-padrao-anpd-res-19-2024}\n' +
          'assessments:\n' +
          '  - {kind: dpia, done_on: 2026-06-20, reference: RIPD-2026-014}' },
        { tipo: 'texto', html:
          '<p>O registro é <strong>fechado</strong>: o modelo Pydantic usa <code>extra="forbid"</code>, então um campo com erro de digitação (<code>retention_day</code>) é recusado em vez de ser ignorado em silêncio e deixar o armazenamento "sem prazo". Em governança, ignorar um campo é pior do que falhar. Veja no laboratório.</p>' },
        { tipo: 'rode', id: 'fw-rode', titulo: 'Um campo digitado errado', enunciado: 'Saída real do laboratório (11/10/2026). O <code>sed</code> troca <code>retention_days</code> por <code>retention_day</code> no <code>good.yaml</code>.',
          prefixo: '$', entrada: 'uv run python -m aigov validate /tmp/typo.yaml', unidade: 's', terminalTitulo: 'aigov', etapas: [
            { id: 'typo', nome: 'Esquema fechado', descricao: 'O campo extra é recusado antes de qualquer regra', tom: 'tls', ms: 1, linhas: [
              L('cmd', 'sed \'s/retention_days: 30/retention_day: 30/\' examples/good.yaml > /tmp/typo.yaml'),
              L('cmd', 'uv run python -m aigov validate /tmp/typo.yaml; echo "exit=$?"'),
              L('out', '/tmp/typo.yaml: schema errors'),
              L('out', '  stores.0.retention_day: Extra inputs are not permitted'),
              L('hint', 'exit=2')] }
          ],
          prever: { pergunta: 'Qual código de saída o validador devolve para um erro de schema (campo fora do esquema)?', opcoes: [
            { id: 'a', texto: '0: o campo extra é ignorado.', correta: false, porque: 'ignorar é o comportamento que o esquema fechado existe para impedir.' },
            { id: 'b', texto: '1, o mesmo de uma regra que falha.', correta: false, porque: 'o 1 é achado das regras; misturar os dois esconde que o registro nem foi lido.' },
            { id: 'c', texto: '2: erro de uso ou de carga, distinto de achado das regras.', correta: true, porque: 'o registro não chegou a ser avaliado pelas regras: o schema falhou antes.' }
          ] },
          tutorDepois: 'O erro de digitação virou exit 2 e uma mensagem que aponta o caminho (<code>stores.0.retention_day</code>). Sem o esquema fechado, o armazenamento ficaria sem prazo e a regra AIG-003 poderia disparar por um motivo enganoso, ou nem isso.',
          callout: 'Você viu o esquema fechado recusar o que um YAML tolerante teria engolido.' },
        { tipo: 'takeaway', html: 'O artefato vale pela <mark>versão e data</mark> a que está preso; o registro <mark>fechado</mark> recusa o que não entende.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Duas peças: escreva o validador fechado (esquema antes das regras, e a validade de 365 dias) e depois pratique o julgamento sobre o que um certificado e um framework dizem.</p>' },
        { tipo: 'python', id: 'fw-python', titulo: 'Esquema fechado e avaliação vencida', obrigatorio: false,
          enunciado: 'Complete <code>validar(reg, hoje)</code>. Primeiro o esquema: campo obrigatório ausente, campo fora de <code>PERMITIDOS</code> e chave estranha em cada <code>store</code> viram <code>("SCHEMA", caminho)</code>. Se houver erro de esquema, devolva só eles. Senão, avaliação com <em>mais</em> de 365 dias vira <code>("AIG-014", "assessments.&lt;i&gt;")</code>.',
          codigo: codigoVal, testes: testesVal,
          dica: 'Operações de conjunto em chaves de dict ajudam: <code>OBRIGATORIOS - reg.keys()</code> dá os ausentes e <code>reg.keys() - PERMITIDOS</code> dá os extras. A comparação de validade é <code>hoje - a["done_on"] &gt; LIMITE</code>, e 365 dias exatos não vencem.',
          solucao: solucaoVal,
          tutorDepois: 'O teste de esquema inválido mostra a ordem que o lab usa: esquema primeiro, regras depois. O relógio entra como parâmetro (<code>hoje</code>), o que torna testável a regra de 365 dias sem esperar um ano, como o <code>--today</code> da CLI.',
          callout: 'Esquema fechado primeiro, regras depois, relógio injetado.' },
        { tipo: 'transcript', id: 'fw-transcript', titulo: 'Ache o que o certificado não diz', obrigatorio: false, terminalTitulo: 'questionário do fornecedor',
          enunciado: 'Leia a conversa de due diligence com um fornecedor de IA. Há afirmações que o certificado ou o framework não sustentam. Clique nas linhas erradas e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Vocês têm algum selo de IA responsável?' },
            { quem: 'agente', texto: 'Somos certificados ISO/IEC 42001, para o escopo descrito no certificado.' },
            { quem: 'agente', texto: 'Isso significa que o nosso modelo foi aprovado pelo NIST.' },
            { quem: 'agente', texto: 'O NIST AI RMF é voluntário e não certifica; usamos como vocabulário de risco.' },
            { quem: 'agente', texto: 'Como somos 42001, estamos em conformidade com o EU AI Act.' },
            { quem: 'agente', texto: 'Podemos enviar o model card com a versão do modelo e a data da avaliação.' },
            { quem: 'agente', texto: 'A certificação garante que o modelo é seguro e justo.' }
          ],
          erradas: [2, 4, 6],
          explicacao: {
            2: 'o NIST AI RMF é framework voluntário e não certificável: não existe "aprovação do NIST" de um modelo.',
            4: 'a 42001 certifica o sistema de gestão da organização; não substitui nenhuma lei nem atesta cumprimento do EU AI Act.',
            6: 'a certificação atesta que há um sistema de gestão operando para o escopo declarado, não que um modelo específico é seguro, justo ou preciso.'
          },
          tutorDepois: 'Pergunte pelo escopo e pela validade do certificado, e peça os artefatos presos a versão: model card, relatório de eval e data da avaliação.' },
        { tipo: 'takeaway', html: 'Certificado e framework dão <mark>vocabulário e processo</mark>; a evidência do <mark>produto</mark> é o artefato versionado.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs', html:
          '<ul><li><strong>Certificar ou apenas alinhar.</strong> A certificação ISO 42001 custa tempo e auditoria e vale quando o mercado ou o cliente exige. Alinhar-se sem certificar dá a maior parte do benefício de organização com custo menor.</li>' +
          '<li><strong>Template pesado versus enxuto.</strong> Documentos longos que ninguém lê protegem mal. Prefira poucos campos obrigatórios, checáveis, com texto livre só onde há julgamento.</li>' +
          '<li><strong>Documento versus dado.</strong> Um registro em YAML versionado e validado vale mais que uma planilha solta: tem histórico, revisão por PR e verificação automática.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Declarar "somos 42001" sem escopo, e tratar a norma como prova de modelo seguro.</li>' +
          '<li>Preencher o model card uma vez e nunca reabrir quando o modelo, o prompt ou o provedor mudam.</li>' +
          '<li>Registro de riscos sem dono nem data de revisão: vira lista morta.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: framework como substituto de decisão', html:
          'Mapear controles do NIST ou da ISO a planilhas dá sensação de progresso e pode esconder o essencial: ninguém decidiu o que o sistema <em>não</em> deve fazer, e ninguém tem autoridade para desligá-lo. Pergunta-teste: <strong>quem pode parar este sistema hoje, e com que critério?</strong> Se a resposta não está escrita e testada, o framework está decorando um vazio.' },
        { tipo: 'escolha', id: 'fw-escolha-iso', titulo: 'Confira: "somos certificados 42001"',
          pergunta: 'A empresa anuncia "somos certificados ISO/IEC 42001". O que isso significa?',
          opcoes: [
            opc('a', 'Um organismo auditou o sistema de gestão de IA da organização (processos); não atesta que um modelo específico é seguro ou legal.', true, 'a 42001 é norma de sistema de gestão, certificável por processo.'),
            opc('b', 'Que os modelos da empresa foram aprovados pelo NIST.', false, 'o NIST AI RMF é voluntário e não certifica.'),
            opc('c', 'Que a empresa cumpre o EU AI Act.', false, 'nenhuma das duas substitui lei.')
          ], tutorDepois: 'Escopo e validade do certificado são o que se verifica.' },
        { tipo: 'escolha', id: 'fw-escolha-model-card', titulo: 'Confira: o model card esquecido',
          pergunta: 'O model card do assistente foi escrito em março. Em setembro o time trocou o modelo e reescreveu o prompt de sistema. O que fazer?',
          opcoes: [
            opc('a', 'Nada: o model card descreve o sistema, e o sistema é o mesmo.', false, 'o artefato descreve um modelo e um prompt específicos; ambos mudaram.'),
            opc('b', 'Reabrir: reavaliar, atualizar versão e data do model card e do relatório de eval, e registrar a referência no registro.', true, 'sem versão do modelo e do prompt avaliado, o documento vira histórico; a mudança de modelo reabre o passo 1 do mecanismo.'),
            opc('c', 'Apagar o model card antigo para evitar confusão.', false, 'o histórico versionado é evidência; o que falta é o artefato novo.')
          ], tutorDepois: 'Mudou modelo, dado, finalidade ou provedor: volta à classificação.' },
        { tipo: 'takeaway', html: 'Frameworks <mark>organizam o trabalho</mark>; só <mark>alguém com autoridade para desligar</mark> o sistema decide o risco.' }
      ] }
    ]
  });
})();
