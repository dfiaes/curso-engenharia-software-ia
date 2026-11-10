/* LT03 · Bloco 4: IaC, estado, módulos, drift e lifecycle seguro. Fonte: LT03.html#b04. Saídas de terminal são exemplo variável, não evidência. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'SANDBOX_AUTORIZADO = "course-lt03"', '', '',
    'def plano(desejado, observado):',
    '    # dicts endereco -> valor. criar: so no desejado; destruir: so no observado;',
    '    # atualizar: nos dois com valor distinto. Listas ordenadas.',
    '    return {"criar": [], "atualizar": [], "destruir": []}', '', '',
    'def vazio(resultado):',
    '    # plano convergido: nada a criar, atualizar ou destruir',
    '    return False', '', '',
    'def detectar_drift(estado_arquivo, real):',
    '    # enderecos do estado arquivado cujo valor real divergiu (ou sumiu), em ordem',
    '    return []', '', '',
    'def mover(estado, origem, destino):',
    '    # reendereca sem recriar: mesmo valor sob a nova chave, origem removida',
    '    return dict(estado)', '', '',
    'def destruir_permitido(alvo, sandbox=SANDBOX_AUTORIZADO):',
    '    # destroy so no sandbox autorizado',
    '    return True', ''].join('\n');

  var solucao = [
    'SANDBOX_AUTORIZADO = "course-lt03"', '', '',
    'def plano(desejado, observado):',
    '    criar = sorted(e for e in desejado if e not in observado)',
    '    destruir = sorted(e for e in observado if e not in desejado)',
    '    atualizar = sorted(e for e in desejado if e in observado and desejado[e] != observado[e])',
    '    return {"criar": criar, "atualizar": atualizar, "destruir": destruir}', '', '',
    'def vazio(resultado):',
    '    return not resultado["criar"] and not resultado["atualizar"] and not resultado["destruir"]', '', '',
    'def detectar_drift(estado_arquivo, real):',
    '    return sorted(e for e in estado_arquivo if real.get(e) != estado_arquivo[e])', '', '',
    'def mover(estado, origem, destino):',
    '    novo = dict(estado)',
    '    novo[destino] = novo.pop(origem)',
    '    return novo', '', '',
    'def destruir_permitido(alvo, sandbox=SANDBOX_AUTORIZADO):',
    '    return alvo == sandbox', ''].join('\n');

  var testes = [
    'def test_plano_separa_criar_atualizar_destruir():',
    '    p = plano({"a": "1", "b": "2", "c": "3"}, {"b": "9", "c": "3", "d": "4"})',
    '    assert p == {"criar": ["a"], "atualizar": ["b"], "destruir": ["d"]}', '', '',
    'def test_plano_igual_e_vazio():',
    '    assert vazio(plano({"a": "1"}, {"a": "1"}))', '', '',
    'def test_plano_com_mudanca_nao_e_vazio():',
    '    assert not vazio(plano({"a": "1"}, {}))', '', '',
    'def test_drift_nomeia_endereco_divergente_e_ausente():',
    '    assert detectar_drift({"a": "1", "b": "2", "c": "3"}, {"a": "1", "b": "X"}) == ["b", "c"]', '', '',
    'def test_mover_preserva_o_valor_e_remove_a_origem():',
    '    novo = mover({"velho": "id-1", "outro": "id-2"}, "velho", "novo")',
    '    assert novo == {"novo": "id-1", "outro": "id-2"}', '', '',
    'def test_mover_nao_altera_o_original():',
    '    estado = {"velho": "id-1"}',
    '    mover(estado, "velho", "novo")',
    '    assert estado == {"velho": "id-1"}', '', '',
    'def test_destroy_so_no_sandbox():',
    '    assert destruir_permitido("course-lt03")', '', '',
    'def test_destroy_fora_do_sandbox_e_recusado():',
    '    assert not destruir_permitido("producao")', ''].join('\n');

  TrilhaAula.registrar({
    id: 'lt03-b4',
    titulo: 'IaC, estado, módulos, drift e lifecycle seguro',
    minutos: 40,
    resumo: 'Clique e script solto não deixam histórico nem convergência. IaC declarativa torna a infraestrutura revisável: o plano é lido antes da mutação, o state é memória sensível e o destroy só passa por uma guarda.',
    objetivo: 'Revisar um plano, exigir o segundo plan vazio, decidir um drift por escrito, adotar com import e reendereçar com move sem recriar, manter segredo fora de state e output e recusar destroy fora do sandbox.',
    revisao: [
      { id: 'lt03b4-plan2', pergunta: 'Depois de um apply verde, o segundo plan ainda lista mudanças. O que isso indica?',
        opcoes: [
          opc('a', 'Que não houve convergência: há diferença entre código e realidade, a ler endereço por endereço', true, 'plan convergido é vazio. A diferença persistente aponta atributo não gerenciado, drift ou dependência.'),
          opc('b', 'Que tudo convergiu, pois plan sempre mostra algo', false, 'após um apply bem-sucedido o plan é vazio.'),
          opc('c', 'Que é preciso rodar apply de novo às cegas', false, 'apply às cegas só depois de entender o diff.')] },
      { id: 'lt03b4-import', pergunta: 'Um recurso crítico foi criado à mão e deve passar para a IaC sem ser recriado. O que usar?',
        opcoes: [
          opc('a', 'import, adotando o recurso existente no state, e conferir o plan vazio', true, 'import associa o recurso real a um endereço sem recriar; recriar causa indisponibilidade ou perda de dados.'),
          opc('b', 'destroy e apply', false, 'recria o recurso crítico.'),
          opc('c', 'Apagar do state e duplicar com outro nome', false, 'cria um segundo recurso, não adota o primeiro.')] },
      { id: 'lt03b4-move', pergunta: 'Para renomear o endereço de um recurso sem perder o dado, o que fazer antes de renomear no código?',
        opcoes: [
          opc('a', 'Mover o endereço no state (move), preservando o valor', true, 'sem move, o rename força replace: o endereço novo nasce, o antigo morre, e o dado junto.'),
          opc('b', 'Apenas renomear e aplicar', false, 'o plano mostraria destroy e create.'),
          opc('c', 'Rodar destroy no ambiente e reaplicar', false, 'destrói o dado.')] },
      { id: 'lt03b4-state', pergunta: 'Por que o state precisa de backend remoto com locking e acesso mínimo?',
        opcoes: [
          opc('a', 'Dois applies simultâneos o corrompem, e ele carrega valores reais, às vezes segredos', true, 'um escritor por vez, histórico protegido, nunca em log ou evidência.'),
          opc('b', 'Porque o plan é mais rápido', false, 'não é questão de velocidade.'),
          opc('c', 'Porque o state é público por desenho', false, 'é dado sensível.')] },
      { id: 'lt03b4-destroy', pergunta: 'Quando a guarda de destroy atua e o que ela compara?',
        opcoes: [
          opc('a', 'Antes de qualquer ação, comparando o alvo com o nome absoluto do sandbox autorizado', true, 'fora do sandbox o destroy é recusado antes da mutação, não no postmortem.'),
          opc('b', 'Depois do destroy, para auditar', false, 'a barreira precisa atuar antes.'),
          opc('c', 'Só em revisão manual posterior', false, 'revisão manual posterior não impede o dano.')] }
    ],
    abas: [
      { rotulo: 'Declarativo e plano', blocos: [
        { tipo: 'texto', html:
          '<p>A <strong>IaC declarativa</strong> registra o estado final desejado da infraestrutura; o motor calcula o caminho. A <strong>procedural</strong> registra passos, e repeti-la é rezar pela mesma ordem no mesmo mundo. O oráculo da diferença: após um apply, o segundo <strong>plan</strong> converge para zero mudanças. O plan não é prova de segurança nem de disponibilidade: é a proposta legível antes da mutação, onde mudança destrutiva é lida, não descoberta.</p>' +
          '<ul><li><strong>Resource graph:</strong> mapa de dependências entre recursos (quem precede quem, o que cai junto).</li>' +
          '<li><strong>Provider:</strong> adapter que traduz a intenção em chamadas de API.</li>' +
          '<li><strong>Módulo:</strong> pacote reutilizável com input e output explícitos.</li>' +
          '<li><strong>Dependency lock:</strong> congela o provider em versão exata. Provider flutuante é rebuild sorteado na infraestrutura, o mesmo defeito da base sem digest do Bloco 1, um nível acima.</li></ul>' },
        { tipo: 'rode', id: 'b4-rode-plano', titulo: 'Plan, apply e o segundo plan',
          enunciado: 'Sequência com o contrato de <code>estado_iac.py</code> (<code>plano</code>, <code>aplicar</code>, <code>vazio</code>). Desejado: <code>a=1, b=2</code>; observado inicial: <code>b=9, d=4</code>. Saídas calculadas à mão, rótulo: exemplo.',
          prefixo: '$', entrada: 'plano(desejado, observado)', unidade: 'passo', terminalTitulo: 'iac (exemplo)',
          prever: { pergunta: 'Depois do apply, o que o segundo plan deve mostrar?', opcoes: [
            { id: 'a', texto: 'As mesmas mudanças do primeiro plan, para confirmar.', correta: false, porque: 'o apply aplicou essas mudanças.' },
            { id: 'b', texto: 'Plano vazio: nada a criar, atualizar ou destruir.', correta: true, porque: 'convergir é o segundo plan vazio; diferença persistente é drift, atributo não gerenciado ou dependência.' },
            { id: 'c', texto: 'Sempre algo, porque o plan nunca é vazio.', correta: false, porque: 'o plano vazio é o sinal de convergência.' }
          ] },
          etapas: [
            { id: 'plan1', nome: 'plan', descricao: 'Proposta legível', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'plano({"a":"1","b":"2"}, {"b":"9","d":"4"})'),
              L('out', '{"criar": ["a"], "atualizar": ["b"], "destruir": ["d"]}'),
              L('hint', 'destruir ["d"]: mudança destrutiva lida antes de executar')] },
            { id: 'apply', nome: 'apply', descricao: 'Intenção executada', tom: 'request', ms: 2, linhas: [
              L('cmd', 'observado = aplicar(desejado, observado)'),
              L('in', '{"a": "1", "b": "2"}')] },
            { id: 'plan2', nome: 'segundo plan', descricao: 'Convergência', tom: 'response', ms: 1, linhas: [
              L('cmd', 'vazio(plano(desejado, observado))'),
              L('out', 'True'), L('hint', 'plan convergido é vazio')] }
          ],
          tutorDepois: 'Se o segundo plan não for vazio, leia o diff endereço por endereço antes de aplicar de novo.',
          callout: 'Você viu a convergência: o segundo plan vazio.' },
        { tipo: 'transcript', id: 'b4-transcript', titulo: 'Ache a leitura que o plano não sustenta', obrigatorio: false, terminalTitulo: 'revisão de plano (exemplo)',
          enunciado: 'O agente resume um plano. Uma afirmação contradiz o que o plano mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Resuma o plano antes do apply.' },
            { quem: 'ferramenta', texto: '$ tofu plan (trecho, exemplo)\n  + criar   modulo.fila.principal\n  ~ atualizar   modulo.api.replicas\n  - destruir   modulo.banco.principal' },
            { quem: 'agente', texto: 'O plano cria a fila e atualiza o número de réplicas da API.' },
            { quem: 'agente', texto: 'O plano também destrói o banco principal, e isso precisa de revisão antes do apply.' },
            { quem: 'agente', texto: 'Plan verde significa que é seguro aplicar, o apply pode seguir.' }
          ],
          erradas: [4],
          explicacao: { 4: 'o plan não é prova de segurança nem de disponibilidade. Ele é a proposta legível, e aqui mostra uma destruição do banco principal que exige decisão humana antes do apply.' },
          tutorDepois: 'As duas primeiras afirmações leem o plano. A terceira trata o plan como aprovação.' },
        { tipo: 'takeaway', html: '<mark>Plan</mark> propõe, <mark>apply</mark> intenciona; o <mark>segundo plan vazio</mark> é a convergência, e o plan nunca é prova de segurança.' }
      ] },

      { rotulo: 'State, drift e lifecycle', blocos: [
        { tipo: 'texto', html:
          '<h3>State</h3>' +
          '<p>O <strong>state</strong> é a memória do último apply: que endereços existem, com que valores. Sem ele, todo plan é palpite; corrompido ou concorrido, deixa dois applies disputando o mesmo mundo. Por isso <strong>backend remoto com locking</strong>: um escritor por vez, histórico protegido. E state é dado sensível: carrega valores reais, às vezes segredos. Acesso mínimo, nunca em log ou evidência. Cada ambiente tem state próprio e cada mudança tem raio de dano (<strong>blast radius</strong>) conhecido.</p>' +
          '<h3>Drift, import e move</h3>' +
          '<p><strong>Drift</strong> é a diferença entre o arquivado e o real: alguém mexeu fora da IaC. Detectar é listar; decidir é registrar: reverter pela IaC ou adotar de forma intencional. <strong>Import</strong> adota o preexistente sob um endereço sem recriar. <strong>Move</strong> reendereça sem recriar. Rename que força replace é o defeito catalogado: o endereço novo nasce, o antigo morre, e o dado junto se ninguém pensou.</p>' },
        { tipo: 'cenario', id: 'b4-cenario', titulo: 'Drift e um recurso à mão', obrigatorio: false,
          enunciado: 'O segundo plan lista mudanças em um recurso crítico que alguém alterou fora da IaC.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O plan mostra drift em <code>modulo.fila.principal</code>: o valor real divergiu do arquivado. O que fazer primeiro?', opcoes: [
              { texto: 'Aplicar de novo às cegas para forçar o estado do código.', vai: 'f-cego', tom: 'ruim', consequencia: 'pode desfazer uma correção de incidente legítima ou recriar o recurso.' },
              { texto: 'Ler o diff endereço por endereço e decidir por escrito: reverter pela IaC ou adotar a mudança.', vai: 'adota', tom: 'ok', consequencia: 'a reconciliação passa a ser intencional, nunca silenciosa.' }] },
            adota: { texto: 'Há também um banco criado à mão que deve passar para a IaC sem ser recriado. O que usar?', opcoes: [
              { texto: 'destroy e apply, para o código criá-lo do zero.', vai: 'f-perda', tom: 'ruim', consequencia: 'recriar um recurso crítico causa indisponibilidade ou perda de dados.' },
              { texto: 'import sob o endereço certo e conferir o plan vazio.', vai: 'f-bom', tom: 'ok', consequencia: 'o recurso é adotado com o valor real, sem recriação.' }] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Drift decidido por escrito, recurso adotado por import e plan vazio confirmado.' },
            'f-cego': { bom: false, texto: 'O apply às cegas sobrescreveu uma mudança que ninguém registrou.' },
            'f-perda': { bom: false, texto: 'O banco foi recriado e o dado se foi.' }
          },
          callout: 'Você decidiu o drift por escrito e adotou com import sem recriar.' },
        { tipo: 'texto', html:
          '<h3>Lifecycle seguro e segredos</h3>' +
          '<p>Quatro verbos: <strong>plan</strong> revisável e salvo, <strong>apply</strong> intencional, <strong>refresh</strong> que atualiza a leitura sem culpar o documento, <strong>destroy</strong> guardado por nome e contexto absolutos do sandbox. Scripts validam contexto, nome e diretório antes do destroy; o restore é idempotente; nenhuma ação alcança outros clusters ou recursos do host. <strong>Segredo</strong> nunca mora em state legível, output, variável literal ou evidência: chega por referência, com vida curta, na execução. Policy e checks convertem a regra em barreira automática: o proibido falha antes da mutação, não no postmortem. <code>target</code> como rotina é defeito catalogado: atalho de hoje é incidente de escopo amanhã.</p>' },
        { tipo: 'ordene', id: 'b4-ordene', titulo: 'O caminho seguro até o destroy', obrigatorio: false,
          enunciado: 'Ordene os passos de um destroy num sandbox, do primeiro ao último.',
          itens: [
            { id: 'destroy', texto: 'Executar o destroy' },
            { id: 'plan', texto: 'Gerar e salvar o plano de destruição para revisão' },
            { id: 'guarda', texto: 'Validar contexto, nome e diretório contra o sandbox autorizado' },
            { id: 'plan2', texto: 'Conferir o resultado e o segundo plan' }],
          solucao: ['guarda', 'plan', 'destroy', 'plan2'],
          dica: 'A guarda atua antes de qualquer ação; o plano é lido antes de executar.',
          tutorDepois: 'Fora do sandbox autorizado, o fluxo nem começa: a recusa vem antes da mutação.' },
        { tipo: 'takeaway', html: 'Drift se <mark>decide por escrito</mark>; <mark>import</mark> adota e <mark>move</mark> reendereça, ambos sem recriar; segredo fica <mark>fora do state legível</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b4-python', titulo: 'IaC como dados: plano, drift, move e guarda', obrigatorio: false,
          enunciado: 'Implemente <code>plano</code>, <code>vazio</code>, <code>detectar_drift</code>, <code>mover</code> e <code>destruir_permitido</code> (recorte de <code>lab/estado_iac.py</code>), com state como dicts endereço para valor.',
          codigo: codigo, testes: testes,
          dica: 'Plano: três conjuntos por endereço, ordenados. Drift: endereços do arquivado cujo <code>real.get(e)</code> difere. Move: <code>novo[destino] = novo.pop(origem)</code> numa cópia. Guarda: igualdade exata com o sandbox.',
          solucao: solucao,
          tutorDepois: 'O move devolve uma cópia: o state original não muda até a decisão ser aplicada.',
          callout: 'Plano, drift, move e guarda passaram nos testes, com o caso fora do sandbox recusado.' },
        { tipo: 'escreva', id: 'b4-escreva', titulo: 'Segundo plan que não zera', obrigatorio: false,
          enunciado: 'Após um apply verde, o segundo plan ainda lista destruições. O que isso prova, onde olhar e qual o estado final exigido?',
          placeholder: 'Diagnóstico, procedimento e estado final.',
          rubrica: [
            'Declara não-convergência: plan convergido é vazio.',
            'Manda ler o diff endereço por endereço (drift, atributo não gerenciado ou dependência).',
            'Exige o segundo plan vazio e recusa novo apply às cegas.'],
          modelo: '<p>Prova que não houve convergência: um plan convergido é vazio. Leio o diff endereço por endereço para achar a causa (drift, atributo não gerenciado, valor calculado à revelia ou dependência), trago o real para o documento ou o documento para o real e repito até o plan vazio. Não aplico de novo às cegas.</p><p><strong>Reprova:</strong> propor novo apply sem ler o diff.</p>' },
        { tipo: 'escolha', id: 'b4-escolha-segredo', titulo: 'Confira: segredo em output',
          pergunta: 'Uma credencial válida aparece em um output versionado. Qual barreira deve ter atuado e quando?',
          opcoes: [
            opc('a', 'State como dado sensível com acesso mínimo e um check de segredo, antes de publicar o output.', true, 'o segredo chega por referência curta na execução; a barreira falha antes da mutação ou da publicação.'),
            opc('b', 'Uma revisão manual depois do merge.', false, 'revisão manual posterior chega tarde: a credencial já está publicada.'),
            opc('c', 'Nenhuma: output não é evidência.', false, 'output versionado é evidência e histórico.')] },
        { tipo: 'escolha', id: 'b4-escolha-destroy', titulo: 'Confira: destroy no contexto errado',
          pergunta: 'Alguém aponta o destroy para o ambiente errado. O que barra a ação e em que momento?',
          opcoes: [
            opc('a', 'A guarda por nome absoluto do sandbox, antes da ação.', true, 'o alvo diferente de <code>course-lt03</code> é recusado antes de qualquer mutação.'),
            opc('b', 'O segundo plan, depois do destroy.', false, 'o segundo plan roda depois: o dano já ocorreu.'),
            opc('c', 'O uso de <code>-target</code> para limitar o dano.', false, 'target como rotina é defeito catalogado.')] },
        { tipo: 'callout', tom: 'info', titulo: 'Fontes e validade', html:
          '<p>OpenTofu 1.11 na data-base: documentação e provisioning workflow (risco alto, revalidar em até 90 dias). O provisionamento real com OpenTofu pertence à trilha externa e fica <strong>BLOCKED</strong> com registro onde o binário estiver ausente. O contrato de <code>lab/estado_iac.py</code> é construção da trilha; números citados são exemplo variável, não evidência.</p>' },
        { tipo: 'takeaway', html: 'Segundo plan <mark>vazio</mark>, segredo <mark>fora do state legível</mark> e destroy <mark>recusado antes</mark> da mutação.' }
      ] }
    ]
  });
})();
