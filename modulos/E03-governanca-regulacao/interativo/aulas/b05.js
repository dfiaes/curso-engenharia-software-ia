/* E03 · Bloco 5: Governança no dia a dia. Fonte: E03.html#b05. Saídas do aigov são execuções reais do laboratório (11/10/2026; 55 testes). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoReg = [
    'def aig005(r):',
    '    """Declarado x real: algum store guarda dado pessoal mas o registro diz que o',
    '    sistema nao processa dado pessoal -> [("AIG-005", "error")]."""',
    '    return []', '', '',
    'def aig016(r):',
    '    """producao + risk_tier "high" + sem human_review -> [("AIG-016", "error")]."""',
    '    return []', '', '',
    'def saida(achados, strict=False):',
    '    """achados: lista de (regra, severidade) com severidade "error" ou "warn".',
    '    Codigo de saida do CI: 1 se houver erro; com strict, 1 tambem se houver aviso; senao 0."""',
    '    return 0', ''].join('\n');
  var testesReg = [
    'def test_aig016_producao_alto_risco_sem_revisao():',
    '    r = {"lifecycle": "production", "risk_tier": "high", "human_review": False}',
    '    assert aig016(r) == [("AIG-016", "error")]', '', '',
    'def test_aig016_borda_piloto_nao_falha():',
    '    r = {"lifecycle": "pilot", "risk_tier": "high", "human_review": False}',
    '    assert aig016(r) == []', '', '',
    'def test_aig016_controle_negativo_risco_minimo():',
    '    r = {"lifecycle": "production", "risk_tier": "minimal", "human_review": False}',
    '    assert aig016(r) == []', '', '',
    'def test_aig016_com_revisao_humana_passa():',
    '    r = {"lifecycle": "production", "risk_tier": "high", "human_review": True}',
    '    assert aig016(r) == []', '', '',
    'def test_aig005_declaracao_inconsistente():',
    '    r = {"personal_data": {"processes": False}, "stores": [{"holds_personal_data": True}]}',
    '    assert aig005(r) == [("AIG-005", "error")]', '', '',
    'def test_aig005_declaracao_consistente():',
    '    r = {"personal_data": {"processes": True}, "stores": [{"holds_personal_data": True}]}',
    '    assert aig005(r) == []', '', '',
    'def test_saida_erro_bloqueia():',
    '    assert saida([("AIG-003", "error")]) == 1', '', '',
    'def test_saida_aviso_informa():',
    '    assert saida([("AIG-015", "warn")]) == 0', '', '',
    'def test_saida_aviso_com_strict_bloqueia():',
    '    assert saida([("AIG-015", "warn")], strict=True) == 1', '', '',
    'def test_saida_sem_achados():',
    '    assert saida([], strict=True) == 0', ''].join('\n');
  var solucaoReg = [
    'def aig005(r):',
    '    processa = r.get("personal_data", {}).get("processes", False)',
    '    if not processa and any(s.get("holds_personal_data") for s in r.get("stores", [])):',
    '        return [("AIG-005", "error")]',
    '    return []', '', '',
    'def aig016(r):',
    '    if r.get("lifecycle") == "production" and r.get("risk_tier") == "high" and not r.get("human_review"):',
    '        return [("AIG-016", "error")]',
    '    return []', '', '',
    'def saida(achados, strict=False):',
    '    sevs = {s for _, s in achados}',
    '    if "error" in sevs or (strict and "warn" in sevs):',
    '        return 1',
    '    return 0', ''].join('\n');

  TrilhaAula.registrar({
    id: 'e03-b5',
    titulo: 'Governança no dia a dia',
    minutos: 45,
    resumo: 'Governança que depende de reunião mensal morre no primeiro prazo apertado; a que roda no pipeline sobrevive porque custa segundos e falha antes do merge. O desafio sênior é desenhar o menor conjunto de controles que muda comportamento e deixa evidência.',
    objetivo: 'Montar a governança mínima viável, integrá-la ao CI com erro que bloqueia e aviso que informa, conduzir red team e incidente de IA como prática de governança e dialogar com o jurídico por fatos e decisões registradas.',
    revisao: [
      { id: 'e03b5-seis', pergunta: 'Quais são os seis controles da governança mínima viável?',
        opcoes: [
          opc('a', 'Inventário vivo, classificação revisada, checagens automáticas no CI, avaliação datada, plano de incidente com desligamento e revisão com vencimento.', true, 'o resto (comitê, política corporativa, treinamento) é útil, mas só depois destes seis.'),
          opc('b', 'Comitê, política de IA, treinamento, auditoria anual, selo e relatório.', false, 'é a camada que vem depois do piso.'),
          opc('c', 'Apenas um PDF de política assinado.', false, 'sem critério de aceite nem verificação.')] },
      { id: 'e03b5-bloquear', pergunta: 'Qual o critério para uma regra bloquear (erro) ou apenas avisar?',
        opcoes: [
          opc('a', 'Bloqueia o que é objetivamente inaceitável; avisa o que depende de contexto.', true, 'bloqueio demais cria contorno; aviso demais é ignorado.'),
          opc('b', 'Tudo bloqueia, para não haver dúvida.', false, 'o time contorna com <code>--no-verify</code>.'),
          opc('c', 'Tudo avisa, para não atrasar o lançamento.', false, 'aviso que ninguém lê não muda comportamento.')] },
      { id: 'e03b5-excecao', pergunta: 'Como tratar uma exceção a uma regra de governança?',
        opcoes: [
          opc('a', 'Como decisão registrada, com dono e prazo, não como <code>--no-verify</code>.', true, 'exceção sem dono e sem prazo vira regra.'),
          opc('b', 'Desligando o check no CI até o lançamento passar.', false, 'tira a evidência e vira hábito.'),
          opc('c', 'Pedindo ao agente de IA que ajuste o registro.', false, 'ajustar o registro para passar não resolve o risco declarado.')] },
      { id: 'e03b5-ponto-cego', pergunta: 'O validador confia em <code>holds_personal_data: false</code>. Qual mitigação ataca esse ponto cego?',
        opcoes: [
          opc('a', 'Mais campos declarativos no registro.', false, 'herdam o mesmo problema.'),
          opc('b', 'Regras que cruzam campos (AIG-005) mais verificação independente: scanner de PII em fixtures e logs e amostragem periódica dos dados reais.', true, 'declaração sem verificação é só confiança com formato de YAML.'),
          opc('c', 'Bloquear o merge em qualquer aviso.', false, 'cria contorno e não verifica nada.')] },
      { id: 'e03b5-posincidente', pergunta: 'Como deve terminar um incidente de IA?',
        opcoes: [
          opc('a', 'Com o modelo corrigido e o assunto encerrado.', false, 'sem o teste que o teria evitado, o erro volta.'),
          opc('b', 'Com atualização do registro, dos evals e de uma regra de CI, para o mesmo erro virar teste.', true, 'além de análise sem culpados e, quando devido, notificação à ANPD e aos titulares (art. 48).'),
          opc('c', 'Com a remoção do sistema do inventário.', false, 'apagar o registro apaga a evidência.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Governança que depende de reunião mensal morre no primeiro prazo apertado. Governança que roda no pipeline sobrevive porque custa segundos e falha no momento certo: antes do merge. O desafio sênior não é conhecer o framework, é <strong>desenhar o menor conjunto de controles que realmente muda comportamento</strong> e deixa evidência.</p>' +
          '<h3>Governança mínima viável</h3>' +
          '<ol><li><strong>Inventário vivo.</strong> Um arquivo de registro por sistema, no repositório do sistema, com dono nomeado. Sem registro, sem deploy em produção.</li>' +
          '<li><strong>Classificação com revisão.</strong> Quem constrói propõe o <code>risk_tier</code> e o racional; alguém independente confirma. Alto risco e dado sensível sobem para revisão jurídica.</li>' +
          '<li><strong>Checagens automáticas.</strong> Schema fechado e regras de lacuna no CI (o que o lab faz).</li>' +
          '<li><strong>Avaliação antes de produção e a cada mudança relevante</strong> (evals do M06), com data e versão.</li>' +
          '<li><strong>Plano de incidente</strong> e caminho de desligamento (<em>kill switch</em>) para o que está em produção.</li>' +
          '<li><strong>Revisão periódica</strong> com vencimento: o registro marca o que passou de 365 dias.</li></ol>' +
          '<p>Todo o resto (comitê, política de IA corporativa, treinamento) é útil, mas só depois destes seis.</p>' },
        { tipo: 'texto', html:
          '<h3>Integrar ao CI/release sem burocracia</h3>' +
          '<p>Três princípios:</p>' +
          '<ul><li><strong>(a)</strong> falhe pelo que é objetivo (erro) e avise pelo que é julgamento (<em>warning</em>);</li>' +
          '<li><strong>(b)</strong> mostre o problema no PR, na linha certa, com a regra e a correção;</li>' +
          '<li><strong>(c)</strong> permita exceção, mas como <strong>decisão registrada</strong> com dono e prazo, não como <code>--no-verify</code>.</li></ul>' +
          '<p>O lab emite anotações no formato do GitHub Actions com <code>--format github</code>.</p>' },
        { tipo: 'codigo', linguagem: 'yaml', texto:
          '# .github/workflows/ia-governanca.yml (trecho)\n' +
          '- name: Validar registros de sistemas de IA\n' +
          '  run: |\n' +
          '    uv run python -m aigov validate registry/*.yaml --format github\n' +
          '- name: Varrer fixtures e logs de exemplo por PII\n' +
          '  run: |\n' +
          '    uv run python -m aigov scan tests/fixtures/chat.log' },
        { tipo: 'texto', html:
          '<p>Dois cuidados. Primeiro, o <code>scan</code> imprime posição (linha e coluna) e nunca o valor encontrado, para que o resultado do CI não vire mais um lugar com PII. Segundo, o <code>--today</code> existe para tornar a saída reproduzível em teste: relógio injetado é o que permite testar a regra de validade de 365 dias sem esperar um ano.</p>' },
        { tipo: 'abas', rotulo: 'Três práticas operacionais', itens: [
          { rotulo: 'Red teaming', blocos: [
            { tipo: 'texto', html:
              '<p>Red team de IA é teste adversarial dirigido por hipóteses de dano: o que um usuário mal-intencionado, um usuário ingênuo e um dado envenenado conseguiriam provocar? O lado técnico (injeção de prompt, exfiltração, abuso de ferramentas) está no M12. O lado de governança acrescenta três coisas:</p>' +
              '<ol><li>Escopo definido pelos riscos do registro, incluindo danos a terceiros e discriminação, não só vulnerabilidade técnica.</li>' +
              '<li>Quem testa tem independência de quem construiu.</li>' +
              '<li>O resultado vira registro datado (<code>RED_TEAM</code>) com achados, severidade e decisão sobre cada um.</li></ol>' +
              '<p>A regra AIG-013 avisa quando um sistema de alto risco não tem esse registro.</p>' }
          ] },
          { rotulo: 'Incidentes de IA', blocos: [
            { tipo: 'texto', html:
              '<p>Incidente de IA inclui o que o runbook de SRE já cobre (indisponibilidade, custo) e o que ele costuma ignorar: saída danosa ou discriminatória, vazamento de dado pessoal pela saída ou pelo contexto, decisão automatizada errada em escala, uso fora da finalidade e falha de provedor que afeta direitos de alguém. O plano mínimo tem:</p>' +
              '<ul><li>classificação de severidade com critério de dano;</li>' +
              '<li>contenção (desligar recurso, trocar para resposta de segurança, reverter versão de prompt ou modelo);</li>' +
              '<li>preservação de evidência <em>sem</em> multiplicar PII;</li>' +
              '<li>critérios de notificação: ANPD e titulares quando houver risco ou dano relevante (LGPD); autoridade europeia e clientes quando o contrato ou o regime exigirem;</li>' +
              '<li>análise sem culpados e, ao final, atualização de registro, evals e regra de CI para o mesmo erro virar teste.</li></ul>' +
              '<p>O campo <code>incident_plan</code> é obrigatório em produção (AIG-012: erro; em piloto, aviso) e aponta para esse runbook.</p>' }
          ] },
          { rotulo: 'Diálogo com o jurídico', blocos: [
            { tipo: 'texto', html:
              '<p>O jurídico não quer ler código e você não quer ler a lei inteira: o registro é a interface. Combine:</p>' +
              '<ol><li>A engenharia traz sempre <strong>fatos verificáveis</strong> (quais dados, onde ficam, quanto tempo, para onde vão), nunca opiniões.</li>' +
              '<li>O jurídico devolve <strong>decisões</strong> (base legal, risco, texto de aviso) que viram campos e regras.</li>' +
              '<li>Divergência é registrada com data e responsável.</li></ol>' +
              '<p>Perguntas que valem ouro quando feitas cedo: Qual é a base legal desta finalidade? Esta classificação sobe para alto risco? O provedor é operador ou controlador conjunto? O que fazemos com o pedido de eliminação que atinge um modelo já treinado? Quem assina a exceção?</p>' }
          ] }
        ] },
        { tipo: 'takeaway', html: 'O piso são <mark>seis controles</mark> que rodam sem reunião; <mark>erro bloqueia, julgamento avisa</mark>, exceção é decisão registrada.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>O <code>scan</code> do laboratório procura CPF (com dígitos verificadores), e-mail e telefone brasileiro num arquivo de log e mostra <strong>onde</strong> estão, nunca o valor. Isso é o que torna seguro rodar a varredura no CI. Veja a saída sobre o <code>sample.log</code> e o que o código de saída diz ao pipeline.</p>' },
        { tipo: 'rode', id: 'dia-rode', titulo: 'Varrer sem revelar', enunciado: 'Saída real do laboratório (11/10/2026). Faça a previsão e aperte Enter.',
          prefixo: '$', entrada: 'uv run python -m aigov scan examples/sample.log', unidade: 's', terminalTitulo: 'aigov', etapas: [
            { id: 'scan', nome: 'scan', descricao: 'Posição e tipo; o valor nunca é impresso', tom: 'response', ms: 1, linhas: [
              L('cmd', 'uv run python -m aigov scan examples/sample.log; echo "exit=$?"'),
              L('out', 'line 2: CPF (col 51)'),
              L('out', 'line 3: TELEFONE (col 55)'),
              L('out', 'line 3: TELEFONE (col 74)'),
              L('out', 'line 4: EMAIL (col 49)'),
              L('out', 'line 6: CPF (col 69)'),
              L('out', 'total: 5 CPF=2 EMAIL=1 TELEFONE=2'),
              L('hint', 'exit=1')] }
          ],
          prever: { pergunta: 'Para o resultado do CI não virar mais um lugar com PII, o que o <code>scan</code> deve imprimir de cada achado?', opcoes: [
            { id: 'a', texto: 'O valor encontrado, mascarado pela metade.', correta: false, porque: 'metade de um CPF ainda é dado pessoal e já reduz o espaço de busca.' },
            { id: 'b', texto: 'Só o tipo e a posição (linha e coluna), nunca o valor.', correta: true, porque: 'dá o que o desenvolvedor precisa para achar e corrigir, sem copiar o dado para o log do CI.' },
            { id: 'c', texto: 'O valor inteiro, para facilitar a correção.', correta: false, porque: 'o log do CI vira a cópia mais longeva e menos controlada.' }
          ] },
          tutorDepois: 'O scan achou 5 ocorrências e saiu com 1, o que bloqueia o CI. Repare no que não aparece: o <code>id=12345678901</code> da linha 5 não passa nos dígitos verificadores, e nome, endereço e saúde em texto livre não são achados por este tipo de regex. O scanner é controle, não prova.',
          callout: 'Você viu uma verificação independente do que o registro declara, que não vaza o que acha.' },
        { tipo: 'texto', html:
          '<h3>Trade-offs</h3>' +
          '<ul><li><strong>Bloquear versus avisar.</strong> Bloqueio demais cria contorno; aviso demais é ignorado. O laboratório separa as regras de erro das de aviso pelo critério "é objetivamente inaceitável ou depende de contexto?".</li>' +
          '<li><strong>Autonomia do time versus controle central.</strong> Padrão central de schema e regras, decisão local sobre as exceções dentro de limites.</li>' +
          '<li><strong>Velocidade de lançamento versus profundidade de revisão.</strong> Proporcione ao risco: piloto com dados sintéticos passa rápido; produção com dado sensível, não.</li></ul>' },
        { tipo: 'ordene', id: 'dia-ordene', titulo: 'Ordene a resposta a um incidente de IA',
          enunciado: 'Um recurso de LLM começou a devolver dado pessoal de outro titular. Ponha os passos do plano mínimo na ordem.',
          itens: [
            { id: 'teste', texto: 'Atualizar o registro, os evals e uma regra de CI para o mesmo erro virar teste' },
            { id: 'notificar', texto: 'Aplicar os critérios de notificação (ANPD e titulares, quando houver risco ou dano relevante)' },
            { id: 'severidade', texto: 'Classificar a severidade pelo critério de dano' },
            { id: 'evidencia', texto: 'Preservar a evidência sem multiplicar PII' },
            { id: 'conter', texto: 'Conter: desligar o recurso ou reverter a versão de prompt ou modelo' },
            { id: 'analise', texto: 'Fazer a análise sem culpados' }
          ], solucao: ['severidade', 'conter', 'evidencia', 'notificar', 'analise', 'teste'],
          dica: 'Primeiro dimensiona, depois estanca, depois preserva e notifica; a análise e o teste fecham o ciclo.',
          tutorDepois: 'Severidade, contenção, evidência sem PII extra, notificação, análise sem culpados e, por fim, o teste ou a regra que impede a repetição. Pós-incidente que corrige o modelo e não cria o teste é erro comum.' },
        { tipo: 'takeaway', html: 'O scan diz <mark>onde</mark>, nunca <mark>o quê</mark>; o incidente termina em <mark>novo teste ou nova regra</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>O passo 5 do laboratório pede a regra AIG-016: <code>lifecycle: production</code> com <code>risk_tier: high</code> e <code>human_review: false</code> falha. O lab pede teste de caminho feliz, de borda (<code>pilot</code> não falha) e controle negativo (<code>minimal</code> não falha). Aqui você escreve a regra em forma de função pura, mais o cruzamento de campos da AIG-005 (declarado x real) e a política de código de saída do CI.</p>' },
        { tipo: 'python', id: 'dia-python', titulo: 'Duas regras e a política de saída do CI', obrigatorio: false,
          enunciado: 'Complete <code>aig005</code> (algum store guarda dado pessoal mas o registro declara que o sistema não processa), <code>aig016</code> (produção, alto risco, sem revisão humana) e <code>saida</code> (1 se houver erro; com <code>strict</code>, também se houver aviso). Os registros são dicts e as chaves podem faltar.',
          codigo: codigoReg, testes: testesReg,
          dica: 'Use <code>r.get("personal_data", {}).get("processes", False)</code> para ler sem estourar. Em <code>saida</code>, junte as severidades num conjunto: <code>{s for _, s in achados}</code>.',
          solucao: solucaoReg,
          tutorDepois: 'A AIG-005 existe porque o validador confia no que foi declarado: cruzar campos pega a declaração inconsistente. A AIG-016 mostra o teste que importa depois do feliz: a borda (piloto) e o controle negativo (risco mínimo). E o <code>strict</code> é a alavanca para promover aviso a bloqueio sem mudar a regra.',
          callout: 'Você escreveu regras puras com borda e controle negativo, e a política que decide o que bloqueia.' },
        { tipo: 'cenario', id: 'dia-cenario', titulo: 'O CI bloqueou na sexta', obrigatorio: false,
          enunciado: 'Um time quer lançar na segunda um piloto de triagem com dado de saúde. O CI falha com AIG-010: dado sensível sem RIPD. Decida como lidar.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A pressão é alta e o RIPD leva semanas. O que você faz?', opcoes: [
              { texto: 'Desligar o check do CI só para esse PR e mergear.', vai: 'f-bypass', tom: 'ruim', consequencia: 'o contorno tira a evidência e vira hábito.' },
              { texto: 'Abrir uma exceção registrada: dono, prazo, condições (piloto com dados sintéticos até o RIPD existir) e revisão jurídica.', vai: 'excecao', tom: 'ok', consequencia: 'a exceção é decisão registrada, não <code>--no-verify</code>.' },
              { texto: 'Rebaixar a AIG-010 para aviso para todos os sistemas.', vai: 'f-aviso', tom: 'ruim', consequencia: 'o que é objetivamente inaceitável deixa de bloquear em todos os times.' }
            ] },
            excecao: { texto: 'O prazo da exceção vence e o RIPD ainda não saiu. O que acontece?', opcoes: [
              { texto: 'Renovar automaticamente: o piloto "está indo bem".', vai: 'f-renova', tom: 'ruim', consequencia: 'exceção sem dono e sem prazo vira regra.' },
              { texto: 'O check volta a bloquear; o dono da exceção decide em revisão: concluir o RIPD, manter só dados sintéticos ou desligar.', vai: 'f-bom', tom: 'ok', consequencia: 'o prazo é o que mantém a exceção honesta.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O piloto andou com dados sintéticos sob exceção registrada. No vencimento, o CI voltou a bloquear e a decisão ficou com o dono, com histórico no repositório.' },
            'f-bypass': { bom: false, texto: 'O check foi desligado "só uma vez". Três meses depois, dado de saúde real estava no piloto e ninguém lembrava de quem aprovou.' },
            'f-aviso': { bom: false, texto: 'Com a AIG-010 rebaixada, outros times passaram a lançar sem RIPD. O aviso foi ignorado, como aviso demais costuma ser.' },
            'f-renova': { bom: false, texto: 'A exceção foi renovada três vezes. Virou a regra do time, sem dono nem prazo.' }
          },
          callout: 'Você deu uma saída honesta à urgência: exceção registrada, com dono e prazo.' },
        { tipo: 'takeaway', html: 'Regra pura com <mark>borda e controle negativo</mark>; exceção como <mark>decisão com dono e prazo</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Governança como etapa final, descoberta na véspera do lançamento. O registro nasce no design doc.</li>' +
          '<li>Comitê que revisa o que um validador revisaria.</li>' +
          '<li>Exceção sem dono e sem prazo, que vira regra.</li>' +
          '<li>Pós-incidente que corrige o modelo e não cria o teste que o teria evitado.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: a regra checa o que o time declarou, não o que o sistema faz', html:
          'O validador do laboratório confia em <code>holds_personal_data: false</code>. Se o time declarar errado, as regras passam. Por isso a AIG-005 cruza campos (armazenamento com dado pessoal e <code>processes: false</code> é inconsistente) e por isso existe o scanner de PII sobre logs e fixtures: verificação independente do que foi declarado. Em produção, some amostragem periódica e auditoria dos dados reais. Declaração sem verificação é só confiança com formato de YAML.' },
        { tipo: 'escolha', id: 'dia-escolha-comite', titulo: 'Confira: o comitê quinzenal',
          pergunta: 'Um colega propõe um comitê quinzenal que aprove todo uso de IA. Qual desenho é melhor?',
          opcoes: [
            opc('a', 'Registro versionado, schema e regras no CI, exceção registrada com dono e prazo, comitê só para alto risco, dado sensível ou exceções, e revisão periódica com vencimento.', true, 'o que é checável por máquina sai do comitê; o comitê fica só com o que exige julgamento.'),
            opc('b', 'Manter o comitê e acrescentar um segundo para as exceções.', false, 'comitê que revisa o que um validador revisaria é burocracia e atrasa tudo.'),
            opc('c', 'Eliminar a revisão humana de alto risco e tornar tudo aviso.', false, 'aviso demais é ignorado, e alto risco exige julgamento.')
          ], tutorDepois: 'Humanos julgam o que máquina não julga; máquina confere o resto.' },
        { tipo: 'escolha', id: 'dia-escolha-scanner', titulo: 'Confira: o scanner passou',
          pergunta: 'O scanner de PII passou em todos os logs e o gerente conclui "não há dado pessoal". Qual a correção?',
          opcoes: [
            opc('a', 'Concordar: o scanner é a prova de conformidade.', false, 'trata ausência de achados como ausência de dado.'),
            opc('b', 'O scanner acha só CPF, e-mail e telefone em formato convencional; não acha nome, endereço nem saúde em texto livre. Pseudonimização ainda é dado pessoal. Reduza a entrada e amostre dados reais.', true, 'o scanner é controle, não prova.'),
            opc('c', 'Trocar o regex por outro mais restrito.', false, 'mais restrição acha menos, não mais.')
          ], tutorDepois: '"O scanner passou" é "não encontrei esses padrões".' },
        { tipo: 'texto', html:
          '<p class="ta-nota">Verificado em 11/10/2026: Lab Python 3.14, Pydantic 2.12+, PyYAML 6, pytest, ruff, mypy 1.x; 55 testes. Itens regulatórios do módulo marcados com * vêm de fonte secundária (escritório de advocacia, monitor legislativo ou imprensa) e devem ser conferidos na fonte oficial antes de uso formal. Em caso de dúvida sobre prazos e textos, escreva "a verificar".</p>' },
        { tipo: 'takeaway', html: 'Declaração <mark>sem verificação independente</mark> é só confiança com formato de YAML; reduza <mark>o que entra</mark>.' }
      ] }
    ]
  });
})();
