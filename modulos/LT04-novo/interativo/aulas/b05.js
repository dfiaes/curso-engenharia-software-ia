/* LT04 · Bloco 5: Comunicação e stakeholders. Fonte: LT04.html#b05. Saídas executadas com lab/comunicar_release.py; números são exemplo variável, não evidência. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var CMD = 'python3 -c "from comunicar_release import *; print(aprovacao_ok([\'engenharia\', \'seguranca\'], \'critico\'))"';

  var codigoCom = [
    'EXIGIDOS = {',
    '    "medio": ["engenharia"],',
    '    "alto": ["engenharia"],',
    '    "critico": ["engenharia"],',
    '}', '', '',
    'def exigidos(risco):',
    '    """Aprovadores do tier; tier desconhecido e erro, nao palpite."""',
    '    return list(EXIGIDOS.get(risco, []))', '', '',
    'def aprovacao_ok(presentes, risco):',
    '    """Publica so com todos os exigidos presentes."""',
    '    return True', '', '',
    'def reproducao_ok(registro, digest, brutos):',
    '    """Mesmo digest, claims nao vazias e cada claim ligada a um bruto."""',
    '    return registro.get("digest") == digest', '',
    'print(aprovacao_ok(["engenharia", "seguranca"], "critico"))', ''].join('\n');

  var testesCom = [
    'def _recusa(f, *args):', '    try:', '        f(*args)', '    except ValueError:', '        return True', '    return False', '', '',
    'def test_matriz_por_tier():',
    '    assert exigidos("medio") == ["engenharia"]', '    assert exigidos("alto") == ["engenharia", "seguranca"]',
    '    assert exigidos("critico") == ["engenharia", "seguranca", "negocio"]', '', '',
    'def test_tier_desconhecido_e_erro():', '    assert _recusa(exigidos, "apocaliptico")', '    assert _recusa(aprovacao_ok, ["engenharia"], "apocaliptico")', '', '',
    'def test_sala_completa_aprova():', '    assert aprovacao_ok(["engenharia", "seguranca", "negocio"], "critico") is True',
    '    assert aprovacao_ok(["engenharia"], "medio") is True', '', '',
    'def test_ausencia_veta_e_um_papel_nao_cobre_outro():',
    '    assert aprovacao_ok(["engenharia", "seguranca"], "critico") is False',
    '    assert aprovacao_ok(["engenharia", "negocio"], "alto") is False',
    '    assert aprovacao_ok([], "medio") is False', '', '',
    'def test_reproducao_do_mesmo_digest():', '    reg = {"digest": "sha256:ab12", "claims": ["p99", "taxa"]}',
    '    assert reproducao_ok(reg, "sha256:ab12", {"p99": 1, "taxa": 2}) is True', '', '',
    'def test_reproducao_negada():', '    reg = {"digest": "sha256:ab12", "claims": ["p99", "taxa"]}',
    '    assert reproducao_ok(reg, "sha256:ab12", {"p99": 1}) is False',
    '    assert reproducao_ok(reg, "sha256:zz", {"p99": 1, "taxa": 2}) is False',
    '    assert reproducao_ok({"digest": "sha256:ab12", "claims": []}, "sha256:ab12", {}) is False', ''].join('\n');

  var solucaoCom = [
    'EXIGIDOS = {', '    "medio": ["engenharia"],', '    "alto": ["engenharia", "seguranca"],', '    "critico": ["engenharia", "seguranca", "negocio"],', '}', '', '',
    'def exigidos(risco):', '    if risco not in EXIGIDOS:', '        raise ValueError(f"tier de risco desconhecido: {risco!r}")', '    return list(EXIGIDOS[risco])', '', '',
    'def aprovacao_ok(presentes, risco):', '    return all(p in presentes for p in exigidos(risco))', '', '',
    'def reproducao_ok(registro, digest, brutos):', '    claims = registro.get("claims", [])',
    '    return (', '        registro.get("digest") == digest', '        and isinstance(claims, list)', '        and bool(claims)',
    '        and all(str(c) in brutos for c in claims)', '    )', ''].join('\n');

  TrilhaAula.registrar({
    id: 'lt04-b5',
    titulo: 'Comunicação: quem aprova e quem reproduz',
    minutos: 30,
    resumo: '"Todo mundo foi avisado" não é aprovação. A matriz de aprovadores por tier de risco, o veto por falta e a reprodução independente do mesmo digest tornam a decisão do release verificável por quem não estava na sala.',
    objetivo: 'Dizer quem precisa aprovar cada tier de risco, vetar comunicado sem os donos e entregar um dossiê que um revisor fora da sala refaz a partir do mesmo digest.',
    revisao: [
      { id: 'lt04b5-matriz', pergunta: 'Qual é a matriz pré-declarada de aprovadores por tier?',
        opcoes: [
          opc('a', 'Médio: engenharia. Alto: engenharia e segurança. Crítico: engenharia, segurança e negócio', true, 'a matriz é escrita antes da decisão, não negociada depois dela.'),
          opc('b', 'Todo tier exige a sala inteira', false, 'a matriz é curta e proporcional ao impacto: três tiers, cada um somando um papel.'),
          opc('c', 'Cada release define seus aprovadores na reunião', false, 'quem aprova qual risco está escrito antes da decisão.')] },
      { id: 'lt04b5-desconhecido', pergunta: 'Alguém cria o tier "apocalíptico" na véspera do release. O que o oráculo faz?',
        opcoes: [
          opc('a', 'Levanta erro: tier desconhecido não aprova nada; reclassifique com critério escrito', true, 'aprovar risco sem categoria é aprovar sem critério.'),
          opc('b', 'Assume o tier mais alto por segurança', false, 'é palpite de aprovador; o oráculo recusa em vez de adivinhar.'),
          opc('c', 'Aceita e exige só a engenharia', false, 'categoria improvisada para caber a pressa é o defeito do catálogo.')] },
      { id: 'lt04b5-veto', pergunta: 'Risco crítico, engenharia e segurança presentes, negócio ausente. O que acontece?',
        opcoes: [
          opc('a', 'Veto por falta, com a ausência registrada pelo nome de quem faltou', true, 'ausente não é abstenção; o comunicado é de pendência, não de GO.'),
          opc('b', 'Publica pelos presentes, porque dois de três é maioria', false, 'o sim só vale completo.'),
          opc('c', 'Publica e o negócio revisa depois', false, 'comunicar decisão sem os donos é o que o pós-mortem sempre encontra depois.')] },
      { id: 'lt04b5-repro', pergunta: 'Qual destas situações reproduz a decisão para um revisor fora da sala?',
        opcoes: [
          opc('a', 'Mesmo digest e cada claim ligada ao seu bruto', true, 'é o único dos quatro casos que reproduz.'),
          opc('b', 'Mesmo digest, mas uma claim sem evidência bruta', false, 'claim sem bruto é alegação sem lastro.'),
          opc('c', 'Digest trocado, com brutos completos', false, 'digest trocado é outro release.'),
          opc('d', 'Mesmo digest e registro sem claims', false, 'registro sem claims é veredito sem conta.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Este bloco troca "todo mundo foi avisado" por <strong>aprovação vinculada</strong> e decisão reproduzível. Três resultados: exigir aprovadores por tier de risco (quem pode dizer não, antes do sim), bloquear publicação sem os exigidos (risco sem dono não comunica, veta) e permitir que um revisor refaça claims e cálculos do mesmo digest sem a sala original. Pré-requisitos: Bloco 2 (vereditos com motivo) e Bloco 4 (números com proveniência). A referência é <code>lab/comunicar_release.py</code>, só stdlib.</p>' +
          '<h3>N1 · Tiers: o risco diz quem precisa estar na sala</h3>' +
          '<p><strong>Tier</strong> classifica o risco pelo impacto: médio exige engenharia, alto soma segurança, crítico soma negócio. A matriz é pré-declarada e curta, com três tiers e sem "apocalíptico" inventado na hora: tier desconhecido levanta erro, porque aprovar risco sem categoria é aprovar sem critério. Quem aprova qual risco está escrito antes da decisão, não negociado depois dela.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Tier de risco</th><th>Aprovadores exigidos</th></tr></thead><tbody>' +
          '<tr><td>médio</td><td>engenharia</td></tr>' +
          '<tr><td>alto</td><td>engenharia, segurança</td></tr>' +
          '<tr><td>crítico</td><td>engenharia, segurança, negócio</td></tr></tbody></table>' },
        { tipo: 'texto', html:
          '<h3>N2 · Aprovação: o sim que só vale completo</h3>' +
          '<p>A <strong>aprovação</strong> só publica com todos os exigidos presentes. Crítico sem negócio na sala não comunica GO, comunica pendência. <strong>Ausente não é abstenção</strong>: é veto por falta, registrado com o nome de quem faltou, e um papel presente não cobre outro ausente. O oráculo testa o bloqueio: matriz completa aprova, uma ausência veta, sala vazia veta.</p>' +
          '<h3>N3 · Reprodução: o revisor fora da sala</h3>' +
          '<p><strong>Reprodução independente</strong> é o teste da comunicação: um revisor que não estava na sala refaz a decisão do mesmo <strong>digest</strong> (identificador do conteúdo do release), com cada <strong>claim</strong> (afirmação do dossiê) ligada à evidência bruta. Digest trocado não reproduz, porque é outro release. Claim sem bruto não reproduz: é alegação sem lastro. Registro sem claims não reproduz: é veredito sem conta. O oráculo cobra os quatro casos: um reproduz, três não.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Defeito raiz do catálogo', html:
          '<p>Comunicado sem aprovador vinculado: quando o incidente chega, ninguém sabe quem aceitou qual risco, e o Bloco 6 começa sem dono. Dossiê que só a sala original entende é segredo, não comunicação.</p>' },
        { tipo: 'takeaway', html: 'O sim só vale <mark>completo</mark>, e a decisão só vale se um revisor de fora a <mark>reproduz</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Execução da referência <code>lab/comunicar_release.py</code> sobre quatro situações. Os números e nomes são exemplo variável; a folha B05-L do laboratório executa os oráculos. Reunião e aprovação reais pertencem à trilha externa e ficam BLOCKED com registro.</p>' },
        { tipo: 'rode', id: 'com-rode', titulo: 'A sala incompleta veta', prefixo: '$', entrada: CMD, unidade: 'ms', terminalTitulo: 'lab/',
          enunciado: 'Rode a primeira etapa (Enter) e depois clique nas outras.',
          prever: { pergunta: 'Risco crítico, engenharia e segurança presentes, negócio ausente. O que <code>aprovacao_ok</code> devolve?', opcoes: [
            { id: 'a', texto: 'True: dois dos três exigidos já são maioria.', correta: false, porque: 'a matriz não conta maioria; todos os exigidos precisam estar presentes.' },
            { id: 'b', texto: 'False: a ausência do negócio é veto por falta.', correta: true, porque: 'crítico exige engenharia, segurança e negócio; qualquer ausência veta.' },
            { id: 'c', texto: 'ValueError: o tier crítico não existe.', correta: false, porque: 'crítico é um dos três tiers da matriz; o erro é para tier desconhecido.' }
          ] },
          etapas: [
            { id: 'sala', nome: 'Sala incompleta', descricao: 'crítico sem negócio', tom: 'dns', ms: 12, linhas: [
              L('cmd', CMD),
              L('out', 'False'),
              L('hint', 'veto por falta: registre "negocio ausente" pelo nome')] },
            { id: 'tier', nome: 'Tier desconhecido', descricao: '"apocaliptico"', tom: 'request', ms: 8, linhas: [
              L('cmd', 'exigidos("apocaliptico")'),
              L('out', "ValueError: tier de risco desconhecido: 'apocaliptico'"),
              L('hint', 'erro, não palpite: reclassifique com critério escrito')] },
            { id: 'repro', nome: 'Reprodução', descricao: 'mesmo digest, brutos completos', tom: 'response', ms: 15, linhas: [
              L('cmd', "reproducao_ok({'digest': 'sha256:ab12', 'claims': ['p99', 'taxa']}, 'sha256:ab12', {'p99': 1, 'taxa': 2})"),
              L('out', 'True'),
              L('info', 'o mesmo registro com bruto faltando, digest trocado ou claims vazias devolve False nos três casos')] }
          ],
          tutorDepois: 'Nas três etapas o oráculo recusa em vez de adivinhar: sala incompleta veta, tier desconhecido é erro e reprodução exige digest e brutos.',
          callout: 'Você viu o veto por falta, a recusa do tier desconhecido e a reprodução do mesmo digest.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Leitura do resultado', html:
          '<p><code>exigidos</code> devolve a matriz por tier e recusa tier desconhecido. <code>aprovacao_ok</code> aprova sala completa e veta qualquer ausência. <code>reproducao_ok</code> confirma com mesmo digest e brutos completos e nega com digest trocado, claim sem bruto ou registro sem claims.</p>' },
        { tipo: 'takeaway', html: 'Ausência é <mark>veto por falta</mark>; tier fora da matriz é <mark>erro</mark>, não palpite.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'com-python', titulo: 'Escreva a matriz e a reprodução', obrigatorio: false,
          enunciado: 'Complete o contrato de <code>comunicar_release.py</code>: a matriz <code>EXIGIDOS</code> (alto soma segurança, crítico soma negócio), <code>exigidos</code> (erro para tier desconhecido), <code>aprovacao_ok</code> (todos os exigidos presentes) e <code>reproducao_ok</code> (mesmo digest, claims não vazias, cada claim com bruto).',
          codigo: codigoCom, testes: testesCom,
          dica: 'Em <code>aprovacao_ok</code>, use <code>all(p in presentes for p in exigidos(risco))</code>: o erro do tier desconhecido sai de <code>exigidos</code>. Em <code>reproducao_ok</code>, verifique digest, <code>bool(claims)</code> e <code>str(c) in brutos</code> para cada claim.',
          solucao: solucaoCom,
          tutorDepois: 'Os testes cobrem o caminho feliz, a sala vazia, o papel que não substitui outro, o tier desconhecido e os três modos de não reprodução.',
          callout: 'A matriz e a reprodução passaram nos testes.' },
        { tipo: 'cenario', id: 'com-cenario', titulo: 'Sexta, 17h, risco crítico', obrigatorio: false,
          enunciado: 'O release da sexta toca o cadastro de clientes e foi classificado como crítico. Engenharia e segurança aprovaram. O responsável pelo negócio está em viagem, sem resposta. A data está marcada.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A pressa de data aperta. O que você comunica?', opcoes: [
              { texto: 'Publicar GO e avisar o negócio depois.', vai: 'f-sem-dono', tom: 'ruim', consequencia: 'o crítico foi decidido sem um dos donos exigidos; a decisão não tem aprovador vinculado.' },
              { texto: 'Rebaixar o risco para alto, onde a matriz fecha.', vai: 'f-tier', tom: 'ruim', consequencia: 'tier improvisado para caber a pressa; a reclassificação exige critério escrito, não conveniência.' },
              { texto: 'Vetar por falta, registrando "negócio ausente" pelo nome, e comunicar pendência.', vai: 'registro', tom: 'ok', consequencia: 'o comunicado diz o que falta e quem falta, sem inventar um sim.' }
            ] },
            registro: { texto: 'O negócio responde na segunda. Como o dossiê fica pronto para a decisão?', opcoes: [
              { texto: 'Anexar as claims e os brutos do mesmo digest, para o aprovador (e qualquer revisor) refazer a conta.', vai: 'f-bom', tom: 'ok', consequencia: 'a decisão fica reproduzível por quem não estava na sala.' },
              { texto: 'Resumir em uma mensagem: "tudo verde, pode aprovar".', vai: 'f-segredo', tom: 'ruim', consequencia: 'veredito sem conta: só quem estava na sala entende.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Release adiado com pendência registrada. Na segunda, o negócio aprova (ou não) sobre um dossiê que qualquer revisor reproduz.' },
            'f-sem-dono': { bom: false, texto: 'O incidente veio e ninguém sabia quem tinha aceitado o risco. O Bloco 6 começou sem dono.' },
            'f-tier': { bom: false, texto: 'O tier mudou na véspera e a matriz perdeu o sentido: o próximo crítico também será rebaixado.' },
            'f-segredo': { bom: false, texto: 'O aprovador disse sim sem ver nada, e nenhum revisor conseguiu refazer a decisão depois.' }
          },
          callout: 'Você vetou por falta e deixou um dossiê reproduzível.' },
        { tipo: 'takeaway', html: 'Prazo apertado muda a <mark>data</mark>, não a <mark>matriz</mark>.' }
      ] },

      { rotulo: 'Julgar e conferir', blocos: [
        { tipo: 'transcript', id: 'com-transcript', titulo: 'Ache a conclusão sem lastro', obrigatorio: false, terminalTitulo: 'dossiê do release 4.2.0',
          enunciado: 'Um revisor fora da sala tenta reproduzir a decisão. Uma das conclusões não é sustentada pelo que as ferramentas mostram. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Reproduza a decisão do release 4.2.0 a partir do dossiê. Digest esperado: sha256:ab12.' },
            { quem: 'ferramenta', texto: "$ python3 -c \"...print(reproducao_ok(reg, 'sha256:ab12', brutos))\"\n# reg['claims'] = ['p99', 'taxa']; brutos = {'p99': ...}\nFalse" },
            { quem: 'agente', texto: 'O digest confere, e a engenharia confirmou a taxa de erro por mensagem. Então a decisão reproduz.' },
            { quem: 'ferramenta', texto: "$ python3 -c \"from comunicar_release import *; print(aprovacao_ok(['engenharia', 'negocio'], 'alto'))\"\nFalse" },
            { quem: 'agente', texto: 'O alto foi aprovado: negócio presente cobre a ausência da segurança.' }
          ],
          erradas: [2, 4],
          explicacao: {
            2: 'a ferramenta devolveu False: a claim <code>taxa</code> não tem bruto. A confirmação por mensagem não é evidência bruta, então a claim é alegação sem lastro.',
            4: 'a ferramenta também devolveu False. Alto exige engenharia e segurança; um papel não substitui outro, e a ausência da segurança é veto por falta.'
          },
          tutorDepois: 'Nas duas linhas, a conclusão do agente contradizia o que a própria ferramenta acabara de devolver.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Tabela de diagnóstico</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Crítico aprovado só pela engenharia</td><td>Matriz de aprovadores ausente ou consultiva</td><td>Exigir matriz por tier; publicar só com todos presentes</td></tr>' +
          '<tr><td>Risco "aceito" sem nome de quem aceitou</td><td>Aceite verbal sem dono vinculado ao tier</td><td>Bloquear sem os exigidos; registrar presentes e faltas</td></tr>' +
          '<tr><td>Revisor não refaz a decisão do dossiê</td><td>Digest trocado ou claim sem bruto: conta sem lastro</td><td>Vincular cada claim à evidência bruta sob o mesmo digest</td></tr>' +
          '<tr><td>Novo tier criado na véspera do release</td><td>Categoria improvisada para caber a pressa</td><td>Recusar tier desconhecido; reclassificar com critério escrito</td></tr>' +
          '</tbody></table>' },
        { tipo: 'escolha', id: 'com-escolha-tier', titulo: 'Confira: um papel não cobre outro',
          pergunta: 'Risco de tier alto (matriz: engenharia e segurança). Estão presentes engenharia e negócio; a segurança faltou. Publica?',
          opcoes: [
            opc('a', 'Sim: o negócio presente cobre a ausência da segurança', false, 'o negócio só é exigido no tier crítico e não compensa a falta de segurança.'),
            opc('b', 'Não: a ausência da segurança é veto por falta, registrada nominalmente', true, 'a matriz é pré-declarada e o sim só vale completo. Ausente não é abstenção.'),
            opc('c', 'Sim, com a nota de que a segurança revisa depois', false, 'revisão posterior não substitui a aprovação exigida antes de publicar.'),
            opc('d', 'Depende do humor da sala', false, 'decisão negociada na hora é o que a matriz pré-declarada evita.')
          ] },
        { tipo: 'escolha', id: 'com-escolha-repro', titulo: 'Confira: o verbal não reproduz',
          pergunta: 'Um revisor fora da sala tenta reproduzir a decisão. O digest é o mesmo, mas uma claim aponta para "evidência: verbal". O que ele conclui?',
          opcoes: [
            opc('a', 'Reproduz: o digest igual é o que importa', false, 'digest igual é necessário, não suficiente: cada claim precisa do bruto.'),
            opc('b', 'Não reproduz: claim sem evidência bruta é alegação sem lastro, mesmo com o digest certo', true, 'reprodução exige mesmo digest e cada claim ligada ao bruto.'),
            opc('c', 'Reproduz parcialmente, e isso basta para publicar', false, 'o oráculo é binário; reprodução parcial não publica.'),
            opc('d', 'Reproduz se o autor confirmar por mensagem', false, 'confirmação do autor não é evidência bruta.')
          ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fontes e versões', html:
          '<ul><li>NIST AI RMF 1.0 (SRC-LT04-19): governança, oversight e comunicação de risco. Risco alto; revalidar em até 90 dias.</li>' +
          '<li>Model Cards, Mitchell et al., 2019 (SRC-LT04-08): documentação e comunicação de modelo. Risco baixo.</li>' +
          '<li>Contrato de <code>lab/comunicar_release.py</code> e números citados: construção desta trilha, exemplo variável; os observados nascem na folha B05-L.</li></ul>' },
        { tipo: 'takeaway', html: 'Matriz <mark>pré-declarada</mark>, veto por <mark>falta</mark>, dossiê que o revisor de fora <mark>reproduz</mark>.' }
      ] }
    ]
  });
})();
