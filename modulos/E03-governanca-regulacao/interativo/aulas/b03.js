/* E03 · Bloco 3: EU AI Act. Fonte: E03.html#b03. Cronograma verificado em 11/10/2026; itens com * vêm de fonte secundária (escritórios de advocacia): conferir no EUR-Lex. Saídas do aigov são execuções reais do laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoCron = [
    'from datetime import date', '',
    '# Datas de aplicacao verificadas em 11/10/2026 (conferir no EUR-Lex antes de usar)',
    'DATAS = {',
    '    "proibido": date(2025, 2, 2),',
    '    "gpai": date(2025, 8, 2),',
    '    "transparencia": date(2026, 8, 2),',
    '    "alto_anexo_iii": date(2027, 12, 2),',
    '    "alto_anexo_i": date(2028, 8, 2),',
    '}',
    'ANEXO_III = {"emprego", "credito", "educacao", "infra"}', '', '',
    'def nivel(uso):',
    '    # "social" e "manipulacao" -> "proibido"; usos do ANEXO_III -> "alto_anexo_iii";',
    '    # "chatbot" e "gerador" -> "transparencia"; o resto -> "minimo"',
    '    return "minimo"', '', '',
    'def situacao(uso, eu_exposure, hoje):',
    '    """Devolve (nivel, status). status: "fora_do_alcance", "sem_obrigacao",',
    '    "vigente" ou "a_partir_de_AAAA-MM-DD"."""',
    '    n = nivel(uso)',
    '    # sem uso da saida na UE -> fora_do_alcance; nivel minimo -> sem_obrigacao',
    '    # senao compare hoje com DATAS[n]',
    '    return (n, "sem_obrigacao")', '',
    'print(situacao("credito", True, date(2026, 10, 11)))', ''].join('\n');
  var testesCron = [
    'def test_credito_adiado_para_dez_2027():',
    '    assert situacao("credito", True, date(2026, 10, 11)) == ("alto_anexo_iii", "a_partir_de_2027-12-02")', '', '',
    'def test_chatbot_transparencia_ja_vigente():',
    '    assert situacao("chatbot", True, date(2026, 10, 11)) == ("transparencia", "vigente")', '', '',
    'def test_chatbot_antes_de_agosto_de_2026():',
    '    assert situacao("chatbot", True, date(2026, 7, 1)) == ("transparencia", "a_partir_de_2026-08-02")', '', '',
    'def test_proibicao_vigente():',
    '    assert situacao("social", True, date(2026, 10, 11)) == ("proibido", "vigente")', '', '',
    'def test_borda_no_proprio_dia():',
    '    assert situacao("emprego", True, date(2027, 12, 2)) == ("alto_anexo_iii", "vigente")', '', '',
    'def test_sem_saida_na_ue_fora_do_alcance():',
    '    assert situacao("emprego", False, date(2026, 10, 11)) == ("alto_anexo_iii", "fora_do_alcance")', '', '',
    'def test_controle_negativo_risco_minimo():',
    '    assert situacao("spam", True, date(2026, 10, 11)) == ("minimo", "sem_obrigacao")', ''].join('\n');
  var solucaoCron = [
    'from datetime import date', '',
    'DATAS = {',
    '    "proibido": date(2025, 2, 2),',
    '    "gpai": date(2025, 8, 2),',
    '    "transparencia": date(2026, 8, 2),',
    '    "alto_anexo_iii": date(2027, 12, 2),',
    '    "alto_anexo_i": date(2028, 8, 2),',
    '}',
    'ANEXO_III = {"emprego", "credito", "educacao", "infra"}', '', '',
    'def nivel(uso):',
    '    if uso in ("social", "manipulacao"):',
    '        return "proibido"',
    '    if uso in ANEXO_III:',
    '        return "alto_anexo_iii"',
    '    if uso in ("chatbot", "gerador"):',
    '        return "transparencia"',
    '    return "minimo"', '', '',
    'def situacao(uso, eu_exposure, hoje):',
    '    n = nivel(uso)',
    '    if not eu_exposure:',
    '        return (n, "fora_do_alcance")',
    '    if n == "minimo":',
    '        return (n, "sem_obrigacao")',
    '    data = DATAS[n]',
    '    if hoje >= data:',
    '        return (n, "vigente")',
    '    return (n, "a_partir_de_" + data.isoformat())', ''].join('\n');

  TrilhaAula.registrar({
    id: 'e03-b3',
    titulo: 'EU AI Act',
    minutos: 40,
    resumo: 'O Regulamento (UE) 2024/1689 é a primeira lei horizontal de IA em vigor. Pode alcançar uma empresa brasileira sem filial na Europa, e a taxonomia dele (proibido, alto risco, transparência, uso geral) é o vocabulário que auditores e clientes grandes já usam. O cronograma mudou em 2026.',
    objetivo: 'Classificar um uso nos níveis do EU AI Act, dizer quando o regulamento alcança uma empresa brasileira, citar o cronograma com a data de verificação e não confundir o calendário europeu com o da LGPD.',
    revisao: [
      { id: 'e03b3-niveis', pergunta: 'Quais são os níveis de risco do EU AI Act?',
        opcoes: [
          opc('a', 'Proibido (art. 5), alto risco (art. 6, anexos I e III), transparência (art. 50) e risco mínimo; modelos de uso geral têm regime próprio (arts. 51 a 55).', true, 'o laboratório modela o subconjunto que um registro consegue conferir (<code>risk_tier</code>, <code>ai_disclosure</code>).'),
          opc('b', 'Baixo, médio e alto.', false, 'não é a taxonomia do regulamento.'),
          opc('c', 'Apenas proibido e permitido.', false, 'ignora alto risco e transparência.')] },
      { id: 'e03b3-alcance', pergunta: 'Uma empresa brasileira sem filial na UE e com cliente europeu que consome a saída do modelo. O EU AI Act pode alcançá-la?',
        opcoes: [
          opc('a', 'Não: sem filial, não se aplica.', false, 'ignora o critério da saída.'),
          opc('b', 'Pode: além de quem coloca sistemas no mercado da UE, abrange fornecedores e implantadores de país terceiro quando a saída do sistema é usada na União (art. 2).', true, 'o campo <code>eu_exposure</code> existe para forçar a pergunta cedo; a análise final é jurídica.'),
          opc('c', 'Só se vender hardware.', false, 'o regulamento cobre sistemas de IA e modelos de uso geral.')] },
      { id: 'e03b3-datas', pergunta: 'Em 11/10/2026, qual a data de aplicação das obrigações de alto risco do anexo III?',
        opcoes: [
          opc('a', '2/8/2026, como dizem materiais de 2024.', false, 'a data foi alterada pelo omnibus e esse material ficou desatualizado em julho de 2026.'),
          opc('b', '2/12/2027 (anexo III); 2/8/2028 para o anexo I.', true, 'conforme escritórios consultados em 11/10/2026 (*): confira no EUR-Lex e registre a data de verificação.'),
          opc('c', 'Já aplicam desde 2025.', false, 'em 2025 entraram as proibições e as obrigações de GPAI.')] },
      { id: 'e03b3-lgpd', pergunta: 'O adiamento europeu do alto risco suspende os deveres da LGPD sobre o mesmo sistema?',
        opcoes: [
          opc('a', 'Sim: com o prazo adiado, a LGPD também espera.', false, 'os regimes são independentes.'),
          opc('b', 'Não: a data de um regime não adia o outro; a LGPD já vale hoje.', true, 'a triagem de currículos, por exemplo, tem hoje dado sensível, art. 20 e RIPD sob a LGPD.'),
          opc('c', 'Só para sistemas com usuários na UE.', false, 'a LGPD não depende do EU AI Act.')] },
      { id: 'e03b3-art50', pergunta: 'O que o art. 50 exige de um chatbot de atendimento ao público?',
        opcoes: [
          opc('a', 'Avisar que a pessoa interage com IA; marcar conteúdo sintético em formato legível por máquina; rotular deepfakes.', true, 'aplicação desde 2/8/2026; para a marcação (art. 50(2)), sistemas já no mercado antes têm até 2/12/2026 (*).'),
          opc('b', 'Avaliação de conformidade e registro como alto risco.', false, 'é o regime do alto risco, não o de transparência.'),
          opc('c', 'Nada: é risco mínimo.', false, 'chatbot que conversa com pessoas cai em transparência.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O Regulamento (UE) 2024/1689 é a primeira lei horizontal abrangente de IA em vigor e serve de referência para o debate brasileiro e para contratos de clientes europeus. Para um engenheiro brasileiro ele importa por dois motivos práticos: pode alcançar a sua empresa mesmo sem filial na Europa, e a sua taxonomia (proibido, alto risco, transparência, uso geral) é o vocabulário que auditores e clientes grandes já usam.</p>' +
          '<h3>Estrutura por níveis de risco</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Nível</th><th>O que é</th><th>Consequência</th></tr></thead><tbody>' +
          '<tr><td><strong>Proibido</strong> (art. 5)</td><td>Práticas como manipulação subliminar prejudicial, exploração de vulnerabilidades, pontuação social, certos usos de identificação biométrica e de inferência de emoções no trabalho e na escola</td><td>Não pode ser colocado no mercado nem usado. Multas máximas da lei: até 35 milhões de euros ou 7% do faturamento mundial, o que for maior</td></tr>' +
          '<tr><td><strong>Alto risco</strong> (art. 6, anexos I e III)</td><td>Componentes de segurança de produtos regulados (anexo I) e usos listados no anexo III: biometria, infraestrutura crítica, educação, <strong>emprego e gestão de trabalhadores</strong>, acesso a serviços essenciais (inclui <strong>avaliação de crédito</strong>), aplicação da lei, migração, justiça e processos democráticos</td><td>Sistema de gestão de risco, qualidade e governança de dados, documentação técnica, registro de eventos (logs), transparência ao implantador, supervisão humana, acurácia/robustez/cibersegurança, avaliação de conformidade</td></tr>' +
          '<tr><td><strong>Transparência</strong> (art. 50)</td><td>Sistemas que interagem com pessoas, geram conteúdo sintético (texto, áudio, imagem, vídeo) ou deepfakes, reconhecem emoções</td><td>Avisar que é IA; marcar conteúdo sintético em formato legível por máquina; rotular deepfakes</td></tr>' +
          '<tr><td><strong>Risco mínimo</strong></td><td>O restante (filtro de spam, IA em jogos)</td><td>Sem obrigação específica; códigos de conduta voluntários</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O que o lab modelou: <code>user_facing_generative</code> + <code>ai_disclosure</code> (regra AIG-015 sobre o aviso de IA) e <code>risk_tier</code> com valor <code>high</code> exigindo avaliação de impacto (AIG-009) e registro de red team (AIG-013). A lista de artefatos de alto risco do regulamento é maior; o laboratório implementa o subconjunto que um registro consegue conferir.</p>' +
          '<h3>Modelos de uso geral (GPAI)</h3>' +
          '<p>LLMs de fundação são tratados à parte (arts. 51 a 55). Todo provedor de modelo de uso geral deve manter documentação técnica, fornecer informações a quem integra o modelo, ter política de respeito a direitos autorais e publicar um resumo do conteúdo de treinamento. Modelos com <strong>risco sistêmico</strong> (presumidos acima de 10<sup>25</sup> FLOPs de computação de treinamento, entre outros critérios) têm deveres adicionais: avaliação de modelo, teste adversarial, relato de incidentes graves e cibersegurança reforçada. Um código de práticas voluntário para GPAI foi publicado em 2025.</p>' +
          '<p>Para quem <em>consome</em> o modelo por API, a documentação do provedor passa a ser insumo obrigatório do seu dossiê. Para quem faz fine-tuning substancial de um modelo alheio, pode haver mudança de papel para provedor. A fronteira exata é questão jurídica e das orientações da Comissão Europeia.</p>' },
        { tipo: 'texto', html:
          '<h3>Alcance sobre empresas brasileiras</h3>' +
          '<p>O art. 2 define o alcance. A empresa brasileira entra no escopo quando:</p>' +
          '<ul><li><strong>(a)</strong> coloca no mercado da UE um sistema de IA ou modelo de uso geral, seja onde for estabelecida;</li>' +
          '<li><strong>(b)</strong> é <em>implantadora</em> com sede ou operação na UE;</li>' +
          '<li><strong>(c)</strong> é provedora ou implantadora num país terceiro e a <strong>saída</strong> do sistema é usada na União.</li></ul>' +
          '<p>Provedor de país terceiro de sistema de alto risco normalmente precisa nomear representante autorizado na UE. Casos típicos: SaaS de RH com clientes europeus (emprego é anexo III); fintech que pontua crédito de pessoas na UE; empresa que revende, sob marca própria, um chatbot a clientes europeus (aviso de IA e marcação de conteúdo). Um produto cujo único mercado é o Brasil, sem saída consumida na UE, em regra não entra. O campo <code>eu_exposure</code> existe para forçar a pergunta cedo: ele não decide, sinaliza que o jurídico precisa decidir.</p>' },
        { tipo: 'takeaway', html: 'O alcance é por <mark>uso da saída na UE</mark>, não por filial; o nível de risco vem do <mark>uso</mark>, não do modelo.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Cronograma verificado em 11/10/2026</h3>' +
          '<p>O regulamento entrou em vigor em 1º de agosto de 2024, com aplicação escalonada. Em 2026 o cronograma foi alterado por um pacote de simplificação conhecido como <em>Digital Omnibus</em>. Segundo escritórios de advocacia consultados em 11/10/2026*, o acordo político ocorreu em 6 de maio de 2026, o ato de alteração foi adotado em 8 de julho e publicado no Jornal Oficial em 24 de julho de 2026, entrando em vigor três dias depois. Os escritórios divergem em detalhes: <strong>confira o número e o texto no EUR-Lex</strong>.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Obrigação</th><th>Data de aplicação</th><th>Situação em 11/10/2026</th></tr></thead><tbody>' +
          '<tr><td>Proibições (art. 5)</td><td>2 de fevereiro de 2025</td><td>Em vigor. O omnibus acrescenta nova proibição (sistemas que geram imagens íntimas sintéticas sem consentimento e material de abuso sexual infantil), com transição relatada até 2 de dezembro de 2026*</td></tr>' +
          '<tr><td>Modelos de uso geral (arts. 51 a 55)</td><td>2 de agosto de 2025</td><td>Em vigor. Modelos já no mercado antes dessa data têm transição mais longa; o poder sancionatório da Comissão sobre GPAI está previsto para agosto de 2026 (confirme)</td></tr>' +
          '<tr><td>Transparência (art. 50)</td><td>2 de agosto de 2026</td><td>Mantida; para a marcação de conteúdo sintético (art. 50(2)), sistemas já no mercado antes de 2/8/2026 têm até 2 de dezembro de 2026*</td></tr>' +
          '<tr><td>Alto risco do anexo III (autônomos)</td><td>2 de dezembro de 2027 (antes: 2/8/2026)</td><td>Adiado pelo omnibus*</td></tr>' +
          '<tr><td>Alto risco do anexo I (embutidos em produtos regulados)</td><td>2 de agosto de 2028 (antes: 2/8/2027)</td><td>Adiado pelo omnibus*</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: cronograma de regulação é dado de alto risco com meia-vida curta', html:
          'Material de 2024 e do início de 2025, inclusive de bons escritórios, ainda diz "alto risco em agosto de 2026". Essa afirmação ficou desatualizada em julho de 2026. Registre a data de verificação ao lado de qualquer data que citar em documento interno e releia a fonte primária antes de planejar roadmap em cima dela. Se você não conseguir confirmar uma data, escreva "a verificar" em vez de inventar.' },
        { tipo: 'texto', html:
          '<h3>O aviso de IA no laboratório</h3>' +
          '<p>O art. 50 virou, no registro, a regra AIG-015: sistema generativo voltado ao usuário sem <code>ai_disclosure</code> gera um <strong>aviso</strong>, não um erro. A diferença aparece no código de saída, e é uma decisão de política do bloco 5. Rode o mesmo registro (o <code>good.yaml</code> com o aviso desligado) sem e com <code>--strict</code>.</p>' },
        { tipo: 'rode', id: 'ai-rode', titulo: 'Aviso de IA ausente: erro ou aviso?', enunciado: 'Saídas reais do laboratório (11/10/2026). O registro é o <code>good.yaml</code> com <code>ai_disclosure: false</code>. Faça a previsão, aperte Enter e depois clique na segunda etapa.',
          prefixo: '$', entrada: 'uv run python -m aigov validate /tmp/semaviso.yaml --today 2026-10-11', unidade: 's', terminalTitulo: 'aigov', etapas: [
            { id: 'sem-strict', nome: 'Sem --strict', descricao: 'Aviso informa', tom: 'tcp', ms: 1, linhas: [
              L('cmd', 'sed \'s/ai_disclosure: true/ai_disclosure: false/\' examples/good.yaml > /tmp/semaviso.yaml'),
              L('cmd', 'uv run python -m aigov validate /tmp/semaviso.yaml --today 2026-10-11; echo "exit=$?"'),
              L('out', 'semaviso.yaml: 0 error(s), 1 warning(s)'),
              L('out', '  WARN  AIG-015 ai_disclosure: users talk to a generative system without being told (EU AI Act art. 50)'),
              L('hint', 'exit=0')] },
            { id: 'strict', nome: 'Com --strict', descricao: 'Aviso bloqueia', tom: 'tls', ms: 2, linhas: [
              L('cmd', 'uv run python -m aigov validate /tmp/semaviso.yaml --today 2026-10-11 --strict; echo "exit=$?"'),
              L('out', 'semaviso.yaml: 0 error(s), 1 warning(s)'),
              L('out', '  WARN  AIG-015 ai_disclosure: users talk to a generative system without being told (EU AI Act art. 50)'),
              L('hint', 'exit=1')] }
          ],
          prever: { pergunta: 'Sem a flag <code>--strict</code>, qual o código de saída quando só há um aviso (WARN) e nenhum erro?', opcoes: [
            { id: 'a', texto: '0: aviso informa, erro bloqueia.', correta: true, porque: 'é a política "erro bloqueia, aviso informa" do bloco 5; o <code>--strict</code> promove o aviso a bloqueio.' },
            { id: 'b', texto: '1: qualquer achado bloqueia.', correta: false, porque: 'então não haveria diferença entre erro e aviso, e o time contornaria a regra.' },
            { id: 'c', texto: '2: aviso é erro de uso.', correta: false, porque: 'o 2 é erro de uso ou de carga, como um campo digitado errado no schema.' }
          ] },
          tutorDepois: 'O art. 50 é obrigação de transparência já aplicável, e mesmo assim a regra é um aviso no lab: depende de contexto (o sistema é mesmo voltado ao usuário? a saída chega à UE?). Quem quer tratá-lo como bloqueio liga <code>--strict</code> no CI.',
          callout: 'Você viu o mesmo achado informar ou bloquear conforme a política do CI.' },
        { tipo: 'ordene', id: 'ai-ordene-datas', titulo: 'Ponha o cronograma em ordem',
          enunciado: 'Ordene as obrigações da mais antiga para a mais distante, segundo a verificação de 11/10/2026.',
          itens: [
            { id: 'anexoi', texto: 'Alto risco do anexo I (produtos regulados)' },
            { id: 'transp', texto: 'Transparência (art. 50)' },
            { id: 'prib', texto: 'Proibições (art. 5)' },
            { id: 'anexoiii', texto: 'Alto risco do anexo III (autônomos)' },
            { id: 'gpai', texto: 'Modelos de uso geral (arts. 51 a 55)' }
          ], solucao: ['prib', 'gpai', 'transp', 'anexoiii', 'anexoi'],
          dica: 'Fevereiro de 2025, agosto de 2025, agosto de 2026, dezembro de 2027, agosto de 2028.',
          tutorDepois: 'Proibições (2/2/2025), GPAI (2/8/2025), transparência (2/8/2026), anexo III (2/12/2027) e anexo I (2/8/2028). Os dois últimos foram adiados pelo omnibus, segundo as fontes secundárias consultadas*.' },
        { tipo: 'takeaway', html: 'Toda data de regulação leva a <mark>data de verificação</mark> ao lado; o calendário europeu <mark>não adia a LGPD</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Exemplo trabalhado: a triagem de currículos do <code>bad.yaml</code></h3>' +
          '<p>A "Triagem automática de currículos" ordena candidatos e descarta os de menor pontuação. Sob o EU AI Act, emprego e seleção de trabalhadores estão no anexo III, portanto alto risco. Com <code>eu_exposure: true</code> e vagas com candidatos na UE, os deveres de alto risco, hoje com aplicação prevista para dezembro de 2027, serão exigidos. Sob a LGPD, o mesmo sistema já tem hoje deveres plenos: dado sensível, art. 20 de revisão, RIPD. A lição: <strong>a data de um regime não adia o outro</strong>.</p>' +
          '<p>Agora transforme a tabela de cronograma em código: uma função que, dado o uso, a exposição à UE e a data de hoje, diz em que pé está a obrigação.</p>' },
        { tipo: 'python', id: 'ai-python', titulo: 'Em que pé está a obrigação hoje?', obrigatorio: false,
          enunciado: 'Complete <code>nivel(uso)</code> e <code>situacao(uso, eu_exposure, hoje)</code>. Sem uso da saída na UE, o status é <code>fora_do_alcance</code>; nível mínimo é <code>sem_obrigacao</code>; nos demais, compare <code>hoje</code> com a data do nível (o próprio dia já conta como vigente). A tabela <code>DATAS</code> é a verificada em 11/10/2026.',
          codigo: codigoCron, testes: testesCron,
          dica: 'Em <code>nivel</code>, teste a pertinência com <code>in</code> em tuplas e no conjunto <code>ANEXO_III</code>. Em <code>situacao</code>, a ordem das checagens importa: alcance primeiro, depois mínimo, depois a data com <code>hoje &gt;= data</code>.',
          solucao: solucaoCron,
          tutorDepois: 'O teste da borda (no próprio dia) e o do chatbot antes de agosto de 2026 impedem o erro clássico de comparação. A tabela é dado de alto risco: no código real, a data de verificação mora junto dela e o prazo de revalidação também.',
          callout: 'O calendário virou dado com data de verificação e comportamento testado nas bordas.' },
        { tipo: 'cenario', id: 'ai-cenario', titulo: 'O roadmap diz agosto de 2026', obrigatorio: false,
          enunciado: 'Hoje é 11/10/2026. Seu SaaS de triagem de currículos tem clientes na UE e um roadmap de conformidade que mira "alto risco em agosto de 2026", copiado de um material de 2024. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A data do roadmap já passou e ninguém reclamou. Qual o primeiro passo?', opcoes: [
              { texto: 'Seguir o roadmap: ele veio de um escritório conhecido.', vai: 'f-velho', tom: 'ruim', consequencia: 'o material é anterior à alteração de julho de 2026; a data é dado de meia-vida curta.' },
              { texto: 'Ler a fonte primária (EUR-Lex), registrar a data de verificação e anotar o que ficou "a verificar".', vai: 'verificado', tom: 'ok', consequencia: 'você descobre que o anexo III foi adiado para 2/12/2027, segundo os escritórios*.' },
              { texto: 'Concluir "não temos filial na UE, logo não se aplica".', vai: 'f-filial', tom: 'ruim', consequencia: 'o critério é o uso da saída na UE, não a filial.' }
            ] },
            verificado: { texto: 'O alto risco foi adiado, mas o aviso de IA (art. 50) vale desde 2/8/2026 e a LGPD já vale. O que fazer com o trabalho de conformidade?', opcoes: [
              { texto: 'Congelar tudo até 2027: sem data, sem urgência.', vai: 'f-congelar', tom: 'ruim', consequencia: 'o custo de criar inventário, classificação e documentação é baixo agora e alto sob pressão; e a LGPD não esperou.' },
              { texto: 'Continuar: inventário, classificação, avaliação de impacto e RIPD servem à LGPD, a clientes que já pedem questionário de IA e à data futura.', vai: 'f-bom', tom: 'ok', consequencia: 'o mesmo trabalho atende três pressões; a data mudou, os artefatos não.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Data verificada e registrada com a fonte, artefatos construídos agora, aviso de IA em dia. O próximo adiamento ou antecipação vira revisão de uma linha na tabela.' },
            'f-velho': { bom: false, texto: 'O time correu para uma data que já não existia e deixou de olhar o que vale hoje: o aviso de IA e a LGPD.' },
            'f-filial': { bom: false, texto: 'Um cliente europeu pediu o dossiê de alto risco. A saída do sistema era consumida na UE, e o jurídico não tinha sido consultado.' },
            'f-congelar': { bom: false, texto: 'O trabalho parou. Seis meses depois, um questionário de cliente e uma solicitação de titular cobraram artefatos que já eram exigíveis.' }
          },
          callout: 'Você verificou a data, separou o que vale hoje do que foi adiado e manteve os artefatos.' },
        { tipo: 'takeaway', html: 'A data é <mark>dado com validade</mark>; o artefato que ela exige serve a <mark>vários regimes</mark> ao mesmo tempo.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs', html:
          '<ul><li><strong>Preparar-se cedo versus esperar a data.</strong> Com o adiamento, a tentação é congelar. O custo de criar inventário, classificação e documentação é baixo agora e alto sob pressão; o mesmo trabalho serve à LGPD e a clientes que já pedem questionário de IA.</li>' +
          '<li><strong>Classificar-se como provedor ou implantador.</strong> Ser implantador tem menos deveres, mas customizar demais o modelo ou colocar nome próprio no sistema pode torná-lo provedor.</li>' +
          '<li><strong>Implementação "UE-first" versus específica por mercado.</strong> Aplicar o mesmo padrão em todos os mercados simplifica a operação; é decisão de produto e custo.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Concluir "não temos filial na UE, logo não se aplica", ignorando o critério da saída.</li>' +
          '<li>Assumir que usar modelo de terceiro "herda" a conformidade do fabricante.</li>' +
          '<li>Tratar o art. 50 como opcional por ser "só transparência": o aviso e a marcação valem já desde agosto de 2026, com a transição relatada para a marcação de sistemas já existentes.</li>' +
          '<li>Citar penalidade de memória. Os tetos variam por tipo de infração e há regras específicas para PMEs: leia o artigo.</li></ul>' },
        { tipo: 'escolha', id: 'ai-escolha-saas', titulo: 'Confira: SaaS de currículos na UE',
          pergunta: '11/10/2026. Uma empresa brasileira vende SaaS de triagem de currículos a clientes na UE. Qual leitura está correta?',
          opcoes: [
            opc('a', 'O EU AI Act não alcança: ela não tem filial na Europa.', false, 'ignora o critério de uso da saída na UE (art. 2).'),
            opc('b', 'É alto risco (emprego, anexo III) e alcança pelo uso da saída na UE; a aplicação foi adiada para 2/12/2027, mas a LGPD já se aplica hoje.', true, 'o alcance é extraterritorial; o omnibus de 2026 adiou o anexo III*.'),
            opc('c', 'Alto risco já é exigível desde 2/8/2026, como dizem materiais de 2024.', false, 'material desatualizado desde julho de 2026.')
          ], tutorDepois: 'Alcance pela saída, nível pelo uso, data com verificação.' },
        { tipo: 'escolha', id: 'ai-escolha-gpai', titulo: 'Confira: modelo por API',
          pergunta: 'Seu produto consome um LLM de fundação por API, sem modificá-lo. Qual a consequência prática do regime de modelos de uso geral para você?',
          opcoes: [
            opc('a', 'Nenhuma: o regime é só do fabricante.', false, 'a documentação do provedor passa a ser insumo obrigatório do seu dossiê.'),
            opc('b', 'A documentação do provedor vira insumo do seu dossiê; fine-tuning substancial pode mudar o seu papel para provedor, questão jurídica e das orientações da Comissão.', true, 'o regime de GPAI (arts. 51 a 55) recai sobre o provedor do modelo, mas alimenta quem integra.'),
            opc('c', 'Você herda a conformidade do fabricante.', false, 'usar modelo de terceiro não herda conformidade.')
          ], tutorDepois: 'Consumir não é herdar: o dossiê é seu, o insumo é do provedor.' },
        { tipo: 'takeaway', html: 'Alcance pela <mark>saída na UE</mark>, nível pelo <mark>uso</mark>, e cada data com sua <mark>verificação</mark>.' }
      ] }
    ]
  });
})();
