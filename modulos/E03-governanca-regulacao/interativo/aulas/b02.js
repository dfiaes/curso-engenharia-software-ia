/* E03 · Bloco 2: LGPD aplicada a LLM. Fonte: E03.html#b02. Saídas do aigov são execuções reais do laboratório; fatos regulatórios verificados em 11/10/2026 (itens com * vêm de fonte secundária). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoPii = [
    'import re', '',
    'CPF = re.compile(r"(?<!\\d)(?:\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}|\\d{11})(?!\\d)")',
    'EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)+")', '', '',
    'def cpf_valido(digitos):',
    '    # 11 digitos, nao todos iguais, e os dois digitos verificadores (modulo 11)',
    '    return False', '', '',
    'def redigir(texto):',
    '    def troca(m):',
    '        # "[CPF]" se for um CPF valido; senao devolva o texto original',
    '        return m.group()',
    '    texto = CPF.sub(troca, texto)',
    '    return EMAIL.sub("[EMAIL]", texto)', '',
    'print(redigir("CPF 529.982.247-25, pedido 123.456.789-00"))', ''].join('\n');
  var testesPii = [
    'def test_cpf_formatado():',
    '    assert redigir("CPF 529.982.247-25 ok") == "CPF [CPF] ok"', '', '',
    'def test_cpf_sem_pontuacao():',
    '    assert redigir("meu cpf 52998224725") == "meu cpf [CPF]"', '', '',
    'def test_digitos_verificadores_errados_nao_mascara():',
    '    assert redigir("Pedido 123.456.789-00") == "Pedido 123.456.789-00"', '', '',
    'def test_digitos_repetidos_nao_mascara():',
    '    assert redigir("id 11111111111") == "id 11111111111"', '', '',
    'def test_sequencia_maior_que_11_nao_casa():',
    '    assert redigir("ref 529982247251") == "ref 529982247251"', '', '',
    'def test_falso_positivo_deliberado():',
    '    assert redigir("order=52998224725") == "order=[CPF]"', '', '',
    'def test_email():',
    '    assert redigir("fale com maria.santos@example.com hoje") == "fale com [EMAIL] hoje"', '', '',
    'def test_controle_negativo_texto_sem_pii():',
    '    t = "Cliente quer a segunda via da fatura"',
    '    assert redigir(t) == t', ''].join('\n');
  var solucaoPii = [
    'import re', '',
    'CPF = re.compile(r"(?<!\\d)(?:\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}|\\d{11})(?!\\d)")',
    'EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)+")', '', '',
    'def cpf_valido(digitos):',
    '    if len(digitos) != 11 or not digitos.isdigit() or digitos == digitos[0] * 11:',
    '        return False',
    '    for n in (9, 10):',
    '        total = sum(int(d) * p for d, p in zip(digitos[:n], range(n + 1, 1, -1)))',
    '        if (total * 10) % 11 % 10 != int(digitos[n]):',
    '            return False',
    '    return True', '', '',
    'def redigir(texto):',
    '    def troca(m):',
    '        d = re.sub(r"\\D", "", m.group())',
    '        return "[CPF]" if cpf_valido(d) else m.group()',
    '    texto = CPF.sub(troca, texto)',
    '    return EMAIL.sub("[EMAIL]", texto)', ''].join('\n');

  var codigoEra = [
    'import sqlite3', '', '',
    'def criar():',
    '    db = sqlite3.connect(":memory:")',
    '    db.execute("create table chunks (id integer primary key, doc_id text, subject_id text, texto text)")',
    '    db.execute("create table cache (chave text, tag text, valor text)")',
    '    return db', '', '',
    'def eliminar_titular(db, subject_id):',
    '    """Apaga os chunks e as entradas de cache do titular.',
    '    Devolve um relatorio com contagens; o relatorio nao pode conter o texto apagado.',
    '    Chunks sem subject_id (NULL) nao tem como ser achados por filtro: conte-os em "orfaos"."""',
    '    chunks = 0  # delete from chunks where subject_id = ?',
    '    cache = 0   # delete from cache where tag = "subject:<id>"',
    '    orfaos = 0  # select count(*) from chunks where subject_id is null',
    '    return {"evento": "erasure", "chunks": chunks, "cache": cache, "orfaos": orfaos}', ''].join('\n');
  var testesEra = [
    'def montar():',
    '    db = criar()',
    '    db.executemany("insert into chunks (doc_id, subject_id, texto) values (?, ?, ?)", [',
    '        ("d1", "s1", "Maria mora em Salvador"), ("d1", "s1", "Maria pediu segunda via"),',
    '        ("d2", "s2", "Joao mora em Recife"), ("d3", None, "chunk ingerido sem titular")])',
    '    db.executemany("insert into cache values (?, ?, ?)", [("k1", "subject:s1", "resp1"), ("k2", "subject:s2", "resp2")])',
    '    return db', '', '',
    'def test_apaga_so_o_titular():',
    '    db = montar()',
    '    eliminar_titular(db, "s1")',
    '    assert db.execute("select count(*) from chunks where subject_id = \'s1\'").fetchone()[0] == 0',
    '    assert db.execute("select count(*) from chunks where subject_id = \'s2\'").fetchone()[0] == 1',
    '    assert db.execute("select count(*) from cache").fetchone()[0] == 1', '', '',
    'def test_relatorio_com_contagens():',
    '    r = eliminar_titular(montar(), "s1")',
    '    assert (r["chunks"], r["cache"], r["evento"]) == (2, 1, "erasure")', '', '',
    'def test_orfaos_sao_sinalizados():',
    '    assert eliminar_titular(montar(), "s1")["orfaos"] == 1', '', '',
    'def test_titular_inexistente_zero_e_nada_apagado():',
    '    db = montar()',
    '    r = eliminar_titular(db, "s9")',
    '    assert (r["chunks"], r["cache"]) == (0, 0)',
    '    assert db.execute("select count(*) from chunks").fetchone()[0] == 4', '', '',
    'def test_relatorio_nao_vaza_o_dado():',
    '    r = eliminar_titular(montar(), "s1")',
    '    assert "Maria" not in str(r) and "Salvador" not in str(r)', ''].join('\n');
  var solucaoEra = [
    'import sqlite3', '', '',
    'def criar():',
    '    db = sqlite3.connect(":memory:")',
    '    db.execute("create table chunks (id integer primary key, doc_id text, subject_id text, texto text)")',
    '    db.execute("create table cache (chave text, tag text, valor text)")',
    '    return db', '', '',
    'def eliminar_titular(db, subject_id):',
    '    chunks = db.execute("delete from chunks where subject_id = ?", (subject_id,)).rowcount',
    '    cache = db.execute("delete from cache where tag = ?", ("subject:" + subject_id,)).rowcount',
    '    orfaos = db.execute("select count(*) from chunks where subject_id is null").fetchone()[0]',
    '    return {"evento": "erasure", "chunks": chunks, "cache": cache, "orfaos": orfaos}', ''].join('\n');

  TrilhaAula.registrar({
    id: 'e03-b2',
    titulo: 'LGPD aplicada a LLM',
    minutos: 55,
    resumo: 'A LGPD não menciona LLM e não precisa: um sistema com LLM é uma máquina de copiar texto para lugares inesperados. A pergunta útil é onde cada dado pessoal é coletado, copiado, enviado ou retido, e com que justificativa em cada ponto.',
    objetivo: 'Mapear as cópias do dado pessoal num sistema com LLM, escolher base legal compatível com a categoria do dado, redigir PII sem fingir que isso prova ausência e projetar a eliminação de um titular até o vector store.',
    revisao: [
      { id: 'e03b2-copias', pergunta: 'Onde está a maior parte do risco de dado pessoal num sistema com LLM?',
        opcoes: [
          opc('a', 'Nas cópias secundárias: logs, tracing, cache, chunks e embeddings, datasets de eval.', true, 'quem audita só o fluxo "usuário pergunta, modelo responde" audita a parte menos perigosa.'),
          opc('b', 'Apenas no prompt do usuário.', false, 'o prompt é o tratamento principal; as cópias vivem mais e são menos controladas.'),
          opc('c', 'Apenas no provedor do modelo.', false, 'o provedor é um ponto do mapa, não o único.')] },
      { id: 'e03b2-sensivel', pergunta: 'Qual base legal NÃO cobre dado sensível por si só?',
        opcoes: [
          opc('a', 'Consentimento específico e destacado.', false, 'está na lista do art. 11.'),
          opc('b', 'Legítimo interesse (e execução de contrato).', true, 'são bases do art. 7 e não aparecem no art. 11; a regra AIG-002 recusa <code>legitimate_interest</code> com <code>sensitive: true</code>.'),
          opc('c', 'As hipóteses do inciso II do art. 11.', false, 'são as hipóteses próprias de dado sensível.')] },
      { id: 'e03b2-pseudo', pergunta: 'O token <code>[CPF:beb2221b]</code> (HMAC com chave) nos logs é, para a LGPD:',
        opcoes: [
          opc('a', 'Dado anonimizado, porque o número não aparece.', false, 'anonimização exige impossibilidade razoável de reidentificar (art. 12).'),
          opc('b', 'Dado pessoal pseudonimizado: a chave permite reidentificar, então retenção, acesso e eliminação continuam valendo.', true, 'por isso a chave fica fora dos logs e é rotacionada com plano.'),
          opc('c', 'Fora do escopo da lei, por ser um hash.', false, 'hash com chave é pseudonimização; hash sem chave de espaço pequeno (CPF) é reversível por força bruta.')] },
      { id: 'e03b2-vector', pergunta: 'O que torna barata a eliminação de um titular no vector store?',
        opcoes: [
          opc('a', 'Guardar o <code>subject_id</code> e o id do documento como metadado de cada chunk antes de ingerir.', true, 'apagar vira delete por filtro; sem isso a única saída é reconstruir o índice.'),
          opc('b', 'Reindexar tudo a cada pedido.', false, 'é a rota de último recurso, não a normal.'),
          opc('c', 'Fazer fine-tuning com os dados do titular.', false, 'pesos não têm "linha por titular"; apagar o dataset não remove o que foi memorizado.')] },
      { id: 'e03b2-plenario', pergunta: 'Em 11/10/2026, qual a situação do PL 2338/2023 (marco legal de IA)?',
        opcoes: [
          opc('a', 'Em vigor desde 2025.', false, 'não é lei.'),
          opc('b', 'Aprovado no Senado em 10/12/2024, em tramitação na Câmara aguardando parecer do relator; não projete datas de vigência.', true, 'fonte secundária (monitor legislativo e imprensa): confirme na ficha da Câmara. A postura é construir já os artefatos que qualquer versão provável exigirá.'),
          opc('c', 'Sancionado, com vigência prevista para 2027.', false, 'sem sanção e sem data.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>A Lei Geral de Proteção de Dados (Lei 13.709/2018) não menciona LLM e não precisa. Ela se aplica a qualquer operação de tratamento de dado pessoal, e um sistema com LLM é, entre outras coisas, uma máquina de copiar texto para lugares inesperados. A pergunta útil para a engenharia não é "a LGPD permite IA?", e sim: <strong>em quais pontos do sistema um dado pessoal é coletado, copiado, transformado, enviado ou retido, e com que justificativa em cada ponto?</strong> Este bloco percorre esses pontos na ordem em que o dado viaja.</p>' +
          '<h3>Mapa: onde o dado pessoal vive</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Ponto</th><th>O que acontece</th><th>Risco típico</th><th>Controle de engenharia</th></tr></thead><tbody>' +
          '<tr><td><strong>Entrada (prompt)</strong></td><td>Usuário digita CPF, saúde, processo judicial; ou o sistema injeta dados do CRM</td><td>Coleta além do necessário; dado sensível sem base</td><td>Minimizar o contexto montado; redação antes do envio quando possível; separar campos estruturados</td></tr>' +
          '<tr><td><strong>Provedor do modelo</strong></td><td>Dado cruza a rede e é processado fora</td><td>Transferência internacional; retenção; treino sobre entradas</td><td>Contrato, cláusulas-padrão, opção de zero-retention, região; campo <code>provider</code> no registro</td></tr>' +
          '<tr><td><strong>Logs e tracing</strong></td><td>Prompt e resposta gravados para depuração (M06)</td><td>Cópia mais longeva e menos controlada do dado</td><td>Redação no ponto de log, retenção curta, acesso restrito</td></tr>' +
          '<tr><td><strong>Cache (inclusive semântico)</strong></td><td>Resposta guardada por similaridade</td><td>Resposta de um titular servida a outro; retenção esquecida</td><td>Chave com escopo de tenant/usuário; TTL; não cachear conteúdo com PII</td></tr>' +
          '<tr><td><strong>RAG: chunks e embeddings</strong></td><td>Documentos viram vetores no índice</td><td>Dado pessoal persistente e difícil de localizar; inversão de embedding</td><td>Metadado de titular em cada chunk; deleção por filtro; reindexação planejada</td></tr>' +
          '<tr><td><strong>Fine-tuning</strong></td><td>Exemplos viram pesos</td><td>Memorização; apagamento praticamente inviável</td><td>Não treinar com dado identificável; anonimizar/sintetizar; guardar procedência do dataset</td></tr>' +
          '<tr><td><strong>Datasets de eval e de red team</strong></td><td>Casos reais copiados para teste</td><td>Dado de produção vivendo em repositório de teste</td><td>Sintetizar ou anonimizar; mesmo regime de retenção</td></tr>' +
          '<tr><td><strong>Saída do modelo</strong></td><td>Pode revelar dado do contexto de outro titular ou "inventar" dado pessoal</td><td>Vazamento entre titulares; dado inexato (princípio da qualidade)</td><td>Isolamento por tenant (M12), filtros de saída, citação da fonte</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Observe que a maior parte do risco está em cópias <strong>secundárias</strong> (logs, cache, evals), não no tratamento principal. Quem só audita o fluxo "usuário pergunta, modelo responde" audita a parte menos perigosa.</p>' +
          '<h3>Princípios que viram requisito (art. 6)</h3>' +
          '<p>Os princípios do art. 6 são o que um regulador usa para julgar um caso concreto. Três dominam o desenho de sistemas com LLM:</p>' +
          '<ul><li><strong>Finalidade e adequação.</strong> O dado foi coletado para um propósito informado ao titular; usá-lo para outro incompatível exige nova justificativa. Reaproveitar o histórico de atendimento para treinar um modelo de marketing é o caso clássico. No registro: <code>purpose</code> com texto verificável, não "melhorar a experiência".</li>' +
          '<li><strong>Necessidade (minimização).</strong> Tratar o mínimo para a finalidade. O contexto do prompt não deveria incluir o CPF se a resposta não depende dele. É requisito de <em>montagem de contexto</em>, não só de política.</li>' +
          '<li><strong>Segurança, prevenção e responsabilização.</strong> Medidas técnicas e administrativas, e capacidade de <em>demonstrar</em> que foram adotadas. O registro, os logs de auditoria e os relatórios são a demonstração.</li></ul>' +
          '<p>Os demais (livre acesso, qualidade, transparência, não discriminação) aparecem nos direitos do titular e na seção de decisões automatizadas.</p>' },
        { tipo: 'texto', html:
          '<h3>Bases legais: o que cabe e o que não cabe</h3>' +
          '<p>O art. 7 lista as bases para dado pessoal comum: consentimento, obrigação legal, políticas públicas, estudos por órgão de pesquisa, execução de contrato, exercício regular de direitos em processo, proteção da vida, tutela da saúde, legítimo interesse e proteção do crédito. O art. 11 trata do dado <strong>sensível</strong> (origem racial ou étnica, convicção religiosa, opinião política, filiação sindical, saúde, vida sexual, dado genético ou biométrico) com lista própria: consentimento específico e destacado, ou as hipóteses do inciso II.</p>' +
          '<p>O ponto técnico: <strong>legítimo interesse e execução de contrato não estão na lista do art. 11</strong>. Por isso o registro do laboratório mantém um conjunto <code>SENSITIVE_BASES</code>, e a regra AIG-002 recusa, por exemplo, <code>legitimate_interest</code> quando <code>sensitive: true</code>.</p>' +
          '<p>Duas bases pedem cuidado em IA:</p>' +
          '<ul><li><strong>Consentimento</strong> precisa ser livre, informado e inequívoco, e pode ser revogado. Se é a única base, revogar significa parar de tratar e, em regra, eliminar. O desenho precisa suportar isso: apagar de logs, cache e vector store.</li>' +
          '<li><strong>Legítimo interesse</strong> exige teste de balanceamento documentado (finalidade legítima, necessidade, expectativa razoável do titular, salvaguardas). Na consulta pública da ANPD sobre IA e decisões automatizadas (resultados em 2025), o legítimo interesse sob teste de balanceamento foi um ponto de convergência entre os participantes, mas a autoridade não fixou posição definitiva. Quem usa essa base para treinar ou refinar modelo precisa do teste por escrito.</li></ul>' +
          '<p>Quem escolhe a base é o controlador, com assessoria jurídica. A engenharia garante que a escolha esteja registrada (<code>legal_basis</code>), seja compatível com a categoria do dado e que o sistema sustente as consequências dela (revogação, oposição).</p>' },
        { tipo: 'texto', html:
          '<h3>Minimização e retenção como código</h3>' +
          '<p>Retenção que não está no código é retenção que não existe. Duas decisões concretas:</p>' +
          '<ul><li><strong>Redigir antes de gravar.</strong> Aplique a redação de PII no ponto em que o log é produzido, não num job posterior. O lab oferece um <code>RedactingFilter</code> para o módulo <code>logging</code> exatamente para isso. Limite que o próprio código documenta: texto de exceção e <em>traceback</em> são formatados depois, pelo <em>handler</em>, e não passam pelo filtro. Em produção, acrescente um <code>Formatter</code> que também redija.</li>' +
          '<li><strong>Todo armazenamento tem prazo.</strong> No registro, cada <code>DataStore</code> que guarda dado pessoal precisa de <code>retention_days</code> (AIG-003) e de um mecanismo de eliminação por titular, <code>erasure_supported</code> (AIG-004). O art. 16 manda eliminar o dado ao término do tratamento, com exceções legais; o prazo é decisão de negócio e jurídica, e o cumprimento é uma tarefa agendada com teste.</li></ul>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '# Esboço: retenção como job idempotente (o nome da coleção e do campo são ilustrativos)\n' +
          'def purge_expired(store, now, retention_days):\n' +
          '    cutoff = now - timedelta(days=retention_days)\n' +
          '    deleted = store.delete(where={"created_at": {"lt": cutoff}})\n' +
          '    audit.log("purge", store=store.name, deleted=deleted, cutoff=cutoff.isoformat())\n' +
          '    return deleted' },
        { tipo: 'texto', html:
          '<p>O ponto não é a API, é o <code>audit.log</code>: a evidência de que a eliminação ocorreu também é um artefato, e ela própria não pode conter o dado apagado.</p>' },
        { tipo: 'abas', rotulo: 'Quatro obrigações e marcos', itens: [
          { rotulo: 'Decisões automatizadas', blocos: [
            { tipo: 'texto', html:
              '<p>O <strong>art. 20</strong> garante ao titular o direito de solicitar a revisão de decisões tomadas unicamente com base em tratamento automatizado que afetem seus interesses (perfil pessoal, profissional, de consumo e de crédito, ou aspectos da personalidade), e de receber informações claras sobre os critérios e procedimentos usados, observado o segredo comercial e industrial. Se o controlador negar a informação por segredo, a ANPD pode auditar aspectos discriminatórios.</p>' +
              '<p>A redação atual não exige que a revisão seja feita por pessoa natural; a regulamentação e o debate sobre revisão humana seguem em aberto. A ANPD publicou em maio de 2025 a Nota Técnica nº 12/2025, consolidando as contribuições de uma tomada de subsídios sobre IA e revisão de decisões automatizadas; verifique se já existe regulamento posterior.</p>' +
              '<p>Em engenharia, um sistema que <em>decide</em> (recusa crédito, descarta candidato, bloqueia conta) precisa de: (a) trilha explicável do que foi considerado; (b) canal de revisão com prazo; (c) pessoa com autoridade para reverter, não só para carimbar. A regra AIG-011 reprova <code>automated_decision: true</code> com <code>human_review: false</code>.</p>' }
          ] },
          { rotulo: 'Transferência internacional', blocos: [
            { tipo: 'texto', html:
              '<p>Mandar prompt com dado pessoal para API hospedada fora do Brasil é <strong>transferência internacional</strong> (arts. 33 a 36). A LGPD a admite em hipóteses como país com grau de proteção adequado, cláusulas contratuais específicas ou padrão, normas corporativas globais, selos e certificados, consentimento específico, entre outras. A ANPD regulamentou o tema em 2024 (Resolução CD/ANPD nº 19/2024, que inclui as cláusulas-padrão contratuais); confira o texto vigente com o jurídico.</p>' +
              '<p>No registro, <code>provider.country</code> diferente de <code>BR</code> com tratamento de dado pessoal exige <code>transfer_mechanism</code> preenchido (AIG-006). No <code>good.yaml</code> o campo cita as cláusulas-padrão; no <code>bad.yaml</code> está vazio, e a regra reprova.</p>' +
              '<p>Mitigações técnicas que reduzem, sem eliminar, a superfície: região de processamento no Brasil quando o provedor oferece; redação de identificadores antes do envio; opção contratual de não retenção e não treinamento; e preferência por modelo auto-hospedado (M11) quando o dado for sensível e o volume justificar.</p>' }
          ] },
          { rotulo: 'ANPD e incidentes', blocos: [
            { tipo: 'callout', tom: 'info', titulo: 'Verificado em 11/10/2026', html:
              'A ANPD é a autoridade que fiscaliza e regulamenta a LGPD. Sinais verificados: tomada de subsídios sobre IA e decisões automatizadas (nov. a dez. de 2024, com 124 contribuições, conforme noticiado*); Nota Técnica 12/2025 (maio de 2025); projeto-piloto de <em>sandbox</em> regulatório em IA e proteção de dados, com testes práticos previstos até dezembro de 2026*; "inteligência artificial e tecnologias emergentes" no mapa de temas prioritários 2026-2027*; e medidas fiscalizatórias de repercussão, como a suspensão preventiva do uso de dados para treinar IA por uma grande plataforma e a suspensão da coleta de dados biométricos de íris por outra*. Um projeto de lei complementar enviado pelo Executivo em dezembro de 2025 posicionaria a ANPD como coordenadora de um Sistema Nacional de IA, segundo fonte secundária: trate como informação a confirmar.' },
            { tipo: 'texto', html:
              '<p>Para o dia a dia: incidente de segurança com risco ou dano relevante exige comunicação à ANPD e aos titulares (art. 48). A regulamentação específica (Resolução CD/ANPD nº 15/2024) fixa prazo curto, da ordem de três dias úteis; <strong>confirme o prazo no texto vigente</strong>.</p>' }
          ] },
          { rotulo: 'PL 2338/2023', blocos: [
            { tipo: 'callout', tom: 'info', titulo: 'Verificado em 11/10/2026', html:
              'O PL 2338/2023 foi aprovado pelo Senado em 10/12/2024 e tramita na Câmara dos Deputados, em Comissão Especial instalada em maio de 2025, relatada pelo deputado Aguinaldo Ribeiro. Na consulta de 11/10/2026, a ficha apontava "Aguardando parecer do relator", sem votação em plenário; datas previstas para maio e junho de 2026 não se cumpriram, e o relator declarou em 24/08/2026 que o trabalho só volta com força total depois das eleições de outubro. <strong>Não é lei.</strong> Fontes: monitor legislativo de terceiros e reportagens*, não a ficha oficial; confirme na página da proposição no site da Câmara.' },
            { tipo: 'texto', html:
              '<p>O texto aprovado no Senado propõe, em linhas gerais e sujeito a mudança na Câmara: classificação por risco, com usos vedados e sistemas de alto risco sujeitos a avaliação de impacto algorítmico; direitos das pessoas afetadas (informação, explicação, contestação, revisão humana em certos casos); governança e sanções administrativas elevadas; e arranjo institucional com a ANPD na coordenação. Como a Câmara pode alterar o texto e o Senado precisa se pronunciar de novo, <strong>não projete datas de vigência</strong>.</p>' +
              '<p>A postura de engenharia: construir agora os artefatos que qualquer versão provável exigirá (inventário, classificação de risco, avaliação de impacto, explicabilidade, revisão humana), porque a LGPD já exige parte deles e o EU AI Act, o modelo mais próximo, já está em vigor.</p>' }
          ] }
        ] },
        { tipo: 'takeaway', html: 'Mapeie cada <mark>cópia</mark> do dado pessoal e dê a cada uma <mark>base, retenção e caminho de eliminação</mark>; legítimo interesse não vale para dado sensível.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Pseudonimização não é anonimização</h3>' +
          '<p>O laboratório redige com tags como <code>[CPF]</code> ou, com chave, <code>[CPF:beb2221b]</code> (HMAC-SHA256 truncado). O segundo formato é <strong>pseudonimização</strong>: o mesmo CPF gera sempre o mesmo token dentro da mesma chave, o que permite correlacionar linhas de log de uma mesma pessoa sem expor o número.</p>' +
          '<p>A LGPD distingue. Dado <em>anonimizado</em> (sem possibilidade razoável de reidentificação) deixa de ser dado pessoal (art. 12). Dado <em>pseudonimizado</em> continua sendo dado pessoal, porque existe informação adicional, aqui a chave, que permite reidentificar. Consequências: o token ainda está sujeito a retenção e a pedidos de eliminação; a chave fica fora dos logs e é rotacionada com plano; e hash sem chave de um identificador de espaço pequeno, como o CPF (cerca de 10<sup>9</sup> combinações de nove dígitos), é reversível por força bruta. Por isso o lab usa HMAC com chave e não SHA-256 puro.</p>' },
        { tipo: 'rode', id: 'lgpd-rode', titulo: 'Redigir o log com chave', enunciado: 'Saída real do laboratório (11/10/2026), linhas 2 a 6 do <code>sample.log</code>. Aperte Enter e compare a linha 2 com a linha 6.',
          prefixo: '$', entrada: 'AIGOV_PII_KEY=chave-do-lab uv run python -m aigov redact < examples/sample.log | sed -n 2,6p', unidade: 's', terminalTitulo: 'aigov', etapas: [
            { id: 'redact', nome: 'redact com chave', descricao: 'CPF, telefone e e-mail viram tokens; id e timestamp ficam', tom: 'tls', ms: 1, linhas: [
              L('cmd', 'AIGOV_PII_KEY=chave-do-lab uv run python -m aigov redact < examples/sample.log | sed -n 2,6p'),
              L('out', '2026-10-11T09:14:09Z INFO  chat.prompt "meu cpf e [CPF:beb2221b], preciso da segunda via"'),
              L('out', '2026-10-11T09:14:11Z INFO  chat.prompt "pode ligar em [TELEFONE:1f94f6fd] ou [TELEFONE:f6a78f7b]?"'),
              L('out', '2026-10-11T09:14:15Z WARN  crm.sync falhou para [EMAIL:18c5ed21] status=502'),
              L('out', '2026-10-11T09:14:20Z INFO  order.created id=12345678901 total=R$ 1.234,56 ts=1760174060000'),
              L('out', '2026-10-11T09:14:21Z INFO  chat.prompt "meu cpf de novo sem pontos: [CPF:beb2221b]"')] }
          ],
          prever: { pergunta: 'Na linha 2 o CPF veio formatado; na linha 6, sem pontuação. O que você espera dos dois tokens?', opcoes: [
            { id: 'a', texto: 'Tokens diferentes, porque o texto original difere.', correta: false, porque: 'o token é calculado sobre os dígitos canônicos, não sobre a formatação.' },
            { id: 'b', texto: 'O mesmo token: o HMAC usa os dígitos, então a pessoa é correlacionável entre linhas.', correta: true, porque: 'é pseudonimização: correlaciona sem expor o número, e por isso o token continua sendo dado pessoal.' },
            { id: 'c', texto: 'Nenhum token, porque o CPF sem pontuação não é detectado.', correta: false, porque: 'a linha 6 foi detectada; o que não é detectado é a sequência de 11 dígitos que falha nos dígitos verificadores.' }
          ] },
          tutorDepois: 'O CPF formatado e o sem pontuação geram o mesmo token. O <code>id=12345678901</code> e o timestamp não são mascarados porque o id não passa nos dígitos verificadores. Exercício local: troque o id por <code>52998224725</code> e veja o falso positivo deliberado (<code>order=[CPF]</code>). O detector prefere mascarar um pedido a deixar vazar um CPF.',
          callout: 'Você viu a pseudonimização correlacionar a mesma pessoa e o detector errar de propósito para o lado seguro.' },
        { tipo: 'texto', html:
          '<h3>Direitos do titular e a eliminação no vector store</h3>' +
          '<p>O art. 18 dá ao titular os direitos de confirmação e acesso, correção, anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade, portabilidade, eliminação dos dados tratados com consentimento, informação sobre compartilhamento e revogação do consentimento. Cada um precisa de um caminho técnico, e o que falha em IA é quase sempre o mesmo: <strong>não saber onde está o dado do titular</strong>.</p>' +
          '<p>O projeto que torna a eliminação barata tem três decisões tomadas <em>antes</em> da ingestão:</p>' +
          '<ol><li>Todo chunk carrega, como metadado, o identificador do titular (ou da entidade) de origem e o do documento. Sem isso, a única opção é reconstruir o índice.</li>' +
          '<li>A fonte da verdade é o documento original em armazenamento com eliminação por titular; o índice é <em>derivado</em> e pode ser reconstruído. Apagar na fonte e reindexar é a rota de último recurso; apagar por filtro de metadado é a normal.</li>' +
          '<li>A eliminação é um evento: gera registro auditável, atinge réplicas, snapshots e caches derivados, e tem prazo máximo de propagação conhecido (backups podem esperar o ciclo de rotação, desde que documentado).</li></ol>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '# Esboço: eliminar um titular do índice vetorial e dos derivados\n' +
          'def erase_subject(subject_id: str) -> ErasureReport:\n' +
          '    chunks = index.delete(filter={"subject_id": subject_id})      # embeddings + texto do chunk\n' +
          '    cache.invalidate(tag=f"subject:{subject_id}")                  # cache semântico por tag\n' +
          '    logs = log_store.delete(where={"subject_pseudonym": pseudo(subject_id)})\n' +
          '    eval_hits = scan_eval_datasets(subject_id)                     # relatório, não remoção cega\n' +
          '    return ErasureReport(chunks=chunks, cache=True, logs=logs, eval_hits=eval_hits)' },
        { tipo: 'texto', html:
          '<p>Dois pontos finos. (1) <strong>Embedding não é anônimo por natureza</strong>: pesquisa mostra que é possível recuperar texto aproximado a partir de vetores, então trate-o como o dado que o originou. (2) <strong>Fine-tuning é o caso difícil</strong>: pesos não têm "linha por titular", e não existe hoje técnica madura que garanta remover o efeito de um exemplo sem re-treinar. A conclusão de engenharia é evitar treinar com dado pessoal identificável; preferir RAG (eliminação por filtro) para conhecimento que muda ou envolve titulares; e, quando for inevitável, documentar a procedência do dataset para poder re-treinar. A consulta da ANPD registrou divergência sobre a viabilidade técnica de excluir dados depois do treinamento: não presuma o tema resolvido.</p>' },
        { tipo: 'ordene', id: 'lgpd-ordene', titulo: 'Atender um pedido de eliminação num sistema com RAG',
          enunciado: 'Ponha os passos na ordem em que o plano técnico deve rodar.',
          itens: [
            { id: 'evento', texto: 'Registrar o evento de eliminação, sem o dado apagado' },
            { id: 'derivados', texto: 'Invalidar o cache por tag e purgar logs e histórico pelo pseudônimo' },
            { id: 'limites', texto: 'Declarar a janela de propagação dos backups e o que não é removível (efeito em pesos já treinados)' },
            { id: 'localizar', texto: 'Verificar a identidade do titular e localizar o <code>subject_id</code>' },
            { id: 'vetor', texto: 'Apagar do vector store por filtro de metadado (embeddings e texto do chunk)' },
            { id: 'evals', texto: 'Varrer os datasets de eval e reportar os achados, sem remoção cega' }
          ], solucao: ['localizar', 'vetor', 'derivados', 'evals', 'evento', 'limites'],
          dica: 'Sem identificar o titular nada se apaga; o registro do evento e os limites vêm depois de saber o que foi e o que não foi atingido.',
          tutorDepois: 'Identificar, apagar em cada cópia (índice, cache, logs, datasets), registrar o evento e declarar os limites. Sem <code>subject_id</code> em cada chunk, o passo 2 vira reconstruir o índice.' },
        { tipo: 'takeaway', html: 'Pseudonimizar <mark>continua sendo tratar dado pessoal</mark>; apagar do vector store é <mark>delete por filtro</mark>, decidido antes da ingestão.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Três peças: o detector de CPF com dígitos verificadores, a eliminação de um titular sobre uma base real (SQLite em memória) e uma decisão de projeto entre RAG e fine-tuning.</p>' },
        { tipo: 'python', id: 'lgpd-python-pii', titulo: 'Detector de CPF e e-mail com redação', obrigatorio: false,
          enunciado: 'Complete <code>cpf_valido</code> (11 dígitos, não todos iguais, dois dígitos verificadores módulo 11) e o callback <code>troca</code>, que só mascara o que passa na validação. O módulo <code>re</code> e as expressões já estão no código.',
          codigo: codigoPii, testes: testesPii,
          dica: 'Para o dígito de posição n (9 ou 10), some <code>int(d) * peso</code> com pesos de n+1 até 2; o esperado é <code>(soma * 10) % 11 % 10</code>. No callback, tire a pontuação com <code>re.sub(r"\\D", "", m.group())</code> antes de validar.',
          solucao: solucaoPii,
          tutorDepois: 'O teste "falso positivo deliberado" documenta uma decisão de projeto: um número que passa nos dígitos verificadores é mascarado mesmo que seja um pedido, porque deixar vazar custa mais. E o detector só acha esses padrões: nome, endereço e saúde em texto livre continuam passando.',
          callout: 'Você escreveu o detector com validação e o limite dele ficou explícito nos testes.' },
        { tipo: 'python', id: 'lgpd-python-erasure', titulo: 'Eliminar um titular, com relatório sem o dado', obrigatorio: false,
          enunciado: 'Complete <code>eliminar_titular(db, subject_id)</code> sobre duas tabelas (<code>chunks</code> com <code>subject_id</code>; <code>cache</code> com <code>tag</code> <code>subject:&lt;id&gt;</code>). Use SQL parametrizado, devolva as contagens e sinalize os chunks <em>órfãos</em> (sem titular), que o filtro nunca alcança.',
          codigo: codigoEra, testes: testesEra,
          dica: '<code>db.execute("delete from chunks where subject_id = ?", (subject_id,)).rowcount</code> dá o número de linhas apagadas. A tag do cache é <code>"subject:" + subject_id</code>. Os órfãos saem de um <code>select count(*)</code> com <code>is null</code>.',
          solucao: solucaoEra,
          tutorDepois: 'O chunk órfão é o buraco do desenho: sem <code>subject_id</code> na ingestão, o pedido de eliminação não o encontra. O relatório devolve contagens e nunca o texto: a evidência da eliminação não pode virar mais um lugar com o dado.',
          callout: 'A eliminação virou um delete por filtro com evidência e com o buraco dos órfãos à vista.' },
        { tipo: 'cenario', id: 'lgpd-cenario', titulo: 'Fine-tuning com o histórico de atendimento', obrigatorio: false,
          enunciado: 'O time quer fazer fine-tuning com dois anos de conversas de atendimento, que trazem CPF e e-mail no texto, para o assistente "falar como a empresa". Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A proposta é treinar direto com o histórico, porque é rápido. O que você faz?', opcoes: [
              { texto: 'Aprovar: depois, se alguém pedir eliminação, apagamos o dataset.', vai: 'f-pesos', tom: 'ruim', consequencia: 'apagar o dataset não remove o que o modelo memorizou; pesos não têm linha por titular.' },
              { texto: 'Perguntar o que o treino precisa ensinar: conhecimento que muda ou envolve titulares vai para RAG com <code>subject_id</code> nos chunks.', vai: 'estilo', tom: 'ok', consequencia: 'a eliminação passa a ser delete por filtro.' },
              { texto: 'Mandar o histórico bruto a um provedor de fine-tuning no exterior.', vai: 'f-transf', tom: 'ruim', consequencia: 'é transferência internacional de dado pessoal sem mecanismo registrado (AIG-006) e com cópia nova no provedor.' }
            ] },
            estilo: { texto: 'O conhecimento ficou no RAG, mas o time ainda quer ajustar tom e latência com fine-tuning. Como proceder?', opcoes: [
              { texto: 'Anonimizar ou sintetizar o dataset, guardar a procedência e registrar a base legal e o teste de balanceamento, se for legítimo interesse.', vai: 'f-bom', tom: 'ok', consequencia: 'sem dado identificável nos pesos, e com procedência para re-treinar se preciso.' },
              { texto: 'Aplicar regex de CPF e declarar o dataset "anonimizado".', vai: 'f-regex', tom: 'ruim', consequencia: 'regex produz redação; nome, endereço e contexto ainda reidentificam, e a qualificação jurídica de anonimização é outra conversa.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Conhecimento no RAG (eliminável por filtro), estilo no fine-tuning com dados sintéticos ou anonimizados e procedência documentada. O pedido de eliminação tem caminho em cada cópia.' },
            'f-pesos': { bom: false, texto: 'Meses depois, um titular pediu a eliminação. O dataset foi apagado, o modelo continuou igual, e o time não pôde prometer nada nem re-treinar sem saber de onde vieram os dados.' },
            'f-transf': { bom: false, texto: 'O registro passou a ter um provedor no exterior sem mecanismo de transferência e um dataset sem eliminação por titular: duas regras de erro.' },
            'f-regex': { bom: false, texto: 'O dataset "anonimizado" ainda continha nomes e endereços. Uma revisão por amostragem achou dado pessoal em texto livre.' }
          },
          callout: 'Você deixou o dado de titulares onde a eliminação é operável e tirou o dado identificável dos pesos.' },
        { tipo: 'takeaway', html: 'Detector <mark>valida o que acha</mark> e não prova o que não acha; eliminação sem <mark>identificador na ingestão</mark> vira reindexação.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs', html:
          '<ul><li><strong>Redação antes do envio ao modelo.</strong> Protege contra transferência e retenção, mas pode degradar a resposta se o modelo precisava do dado (por exemplo, para saudar pelo nome). Meio-termo: substituir por token consistente no prompt e re-hidratar na saída, mantendo o mapa só em memória do seu serviço.</li>' +
          '<li><strong>Log completo versus log redigido.</strong> O completo facilita depuração e é a cópia mais perigosa. Padrão defensável: log redigido por padrão, acesso excepcional e auditado ao bruto, retenção curta.</li>' +
          '<li><strong>RAG versus fine-tuning para dado de titulares.</strong> RAG torna a eliminação operável; fine-tuning pode dar melhor estilo ou latência, ao custo de eliminação praticamente inviável.</li>' +
          '<li><strong>Detector com viés para falso positivo.</strong> Mascarar um pedido que parece CPF custa pouco; deixar vazar um CPF custa muito. O lab mascara qualquer sequência de 11 dígitos que passe nos dígitos verificadores.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Achar que "dado público" dispensa base legal. Dado tornado manifestamente público pelo titular tem tratamento próprio (art. 7 §4), mas finalidade e boa-fé continuam exigidas. Raspar a web para treinar é uma das questões que a consulta da ANPD listou como divergente.</li>' +
          '<li>Anonimizar com regex e declarar "anonimizado": o que a regex produz é redação.</li>' +
          '<li>Esquecer o <em>backup</em> e o <em>tracing</em> de terceiros na lista de armazenamentos.</li>' +
          '<li>Esquecer que dado do funcionário e do candidato também é dado pessoal.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o detector de PII como prova de ausência', html:
          'Regex mais dígito verificador acha CPF, e-mail e telefone formatados de modo convencional. Não acha nome próprio, endereço, RG, número de processo, dado de saúde em texto livre, nem um CPF escrito por extenso ou com separadores incomuns. "O scanner passou" significa "não encontrei esses padrões", não "não há dado pessoal". Para classes sem formato fixo, use NER treinado, revisão amostral e, principalmente, <em>reduza o que entra</em> em vez de confiar em filtro de saída. O M12 trata a redação como defesa em camadas; aqui acrescenta-se que ela não é evidência de conformidade sozinha.' },
        { tipo: 'escolha', id: 'lgpd-escolha-base', titulo: 'Confira: a base do prontuário',
          pergunta: 'Um assistente resume prontuários (dado de saúde). Qual base legal o time pode escolher?',
          opcoes: [
            opc('a', 'Legítimo interesse, com teste de balanceamento.', false, 'é base do art. 7; dado sensível tem lista própria no art. 11.'),
            opc('b', 'Uma hipótese do art. 11 (por exemplo, consentimento específico e destacado, ou as do inciso II); o controlador escolhe com o jurídico.', true, 'a engenharia registra a escolha e garante que o sistema sustente suas consequências.'),
            opc('c', 'Execução de contrato, porque o médico é cliente.', false, 'contrato também não está na lista do art. 11.')
          ], tutorDepois: 'Categoria do dado primeiro, base legal depois.' },
        { tipo: 'escolha', id: 'lgpd-escolha-cadeia', titulo: 'Confira: apagar a linha basta?',
          pergunta: 'O titular pede eliminação. Basta apagar a linha dele no Postgres?',
          opcoes: [
            opc('a', 'Sim: o banco relacional é a fonte da verdade.', false, 'a fonte é verdade, mas as cópias derivadas continuam existindo.'),
            opc('b', 'Não: os trechos dele podem estar em chunks, embeddings, índices, caches e logs; sem identificador de titular nos metadados de cada chunk, vira reindexação total.', true, 'em fine-tuning, apagar o dataset não remove o que o modelo memorizou: o conserto real é re-treinar ou não treinar com dado identificável.'),
            opc('c', 'Só se o provedor também apagar o modelo.', false, 'o provedor de API não resolve o que está nas suas cópias.')
          ], tutorDepois: 'Governança de dado pessoal em LLM é, antes de política, um problema de mapeamento de cópias.' },
        { tipo: 'takeaway', html: 'Cada cópia precisa de <mark>base, retenção e eliminação</mark>; o PL 2338/2023 <mark>não é lei</mark> em 11/10/2026: construa os artefatos, não aposte em datas.' }
      ] }
    ]
  });
})();
