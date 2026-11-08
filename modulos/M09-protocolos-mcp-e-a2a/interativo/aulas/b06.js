/* M09 · Bloco 6: panorama de A2A. Fonte: M09.html#b06 (verificado em 14/09/2026; adoção incerta, revalidar). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    '# Modelo SIMPLIFICADO do ciclo de uma Task (subconjunto didático, não a spec completa).',
    'TERMINAIS = {"COMPLETED", "REJECTED", "CANCELED"}', '',
    '# (estado, evento) -> próximo estado',
    'TRANSICOES = {',
    '    ("WORKING", "concluir"): "COMPLETED",',
    '    # FALTA: WORKING + faltou_info -> INPUT_REQUIRED',
    '    # FALTA: INPUT_REQUIRED + resposta -> WORKING',
    '    # FALTA: cancelar em WORKING e em INPUT_REQUIRED -> CANCELED',
    '}', '', '',
    'def abrir(no_escopo):',
    '    """Recusa explícita de escopo em vez de tentar adivinhar."""',
    '    return "WORKING" if no_escopo else "REJECTED"', '', '',
    'def transicao(estado, evento):',
    '    if estado in TERMINAIS:',
    '        raise ValueError("Task terminada: " + estado)',
    '    return TRANSICOES[(estado, evento)]', '',
    'print(transicao("WORKING", "concluir"))', ''].join('\n');

  var solucao = [
    'TERMINAIS = {"COMPLETED", "REJECTED", "CANCELED"}', '',
    'TRANSICOES = {',
    '    ("WORKING", "concluir"): "COMPLETED",',
    '    ("WORKING", "faltou_info"): "INPUT_REQUIRED",',
    '    ("INPUT_REQUIRED", "resposta"): "WORKING",',
    '    ("WORKING", "cancelar"): "CANCELED",',
    '    ("INPUT_REQUIRED", "cancelar"): "CANCELED",',
    '}', '', '',
    'def abrir(no_escopo):',
    '    return "WORKING" if no_escopo else "REJECTED"', '', '',
    'def transicao(estado, evento):',
    '    if estado in TERMINAIS:',
    '        raise ValueError("Task terminada: " + estado)',
    '    return TRANSICOES[(estado, evento)]', ''].join('\n');

  var testes = [
    'def test_fora_do_escopo_e_rejeitada():', '    assert abrir(False) == "REJECTED"', '', '',
    'def test_pedir_info_em_vez_de_adivinhar():',
    '    e = abrir(True)', '    e = transicao(e, "faltou_info")', '    assert e == "INPUT_REQUIRED"', '',
    '    e = transicao(e, "resposta")', '    assert e == "WORKING"', '    assert transicao(e, "concluir") == "COMPLETED"', '', '',
    'def test_cancelar_de_dois_estados():',
    '    assert transicao("WORKING", "cancelar") == "CANCELED"',
    '    assert transicao("INPUT_REQUIRED", "cancelar") == "CANCELED"', '', '',
    'def test_estado_terminal_nao_aceita_evento():',
    '    try:', '        transicao("COMPLETED", "cancelar")', '    except ValueError:', '        return',
    '    assert False, "deveria levantar ValueError"', '', '',
    'def test_evento_invalido_falha_alto():',
    '    try:', '        transicao("INPUT_REQUIRED", "concluir")', '    except KeyError:', '        return',
    '    assert False, "deveria levantar KeyError"', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm09-b6',
    titulo: 'Panorama de A2A: agentes conversando com agentes',
    minutos: 25,
    resumo: 'MCP resolve agente e ferramenta. O A2A (Agent2Agent) propõe resolver agente e agente: o outro lado é um par com raciocínio próprio, que pode planejar, pedir mais informação e levar minutos ou dias.',
    objetivo: 'Reconhecer o A2A, separar sua natureza da do MCP, ler o ciclo de vida de uma Task e decidir, com o gatilho certo, quando adotá-lo.',
    revisao: [
      { id: 'm09b6-natureza', pergunta: 'Qual a diferença de natureza entre MCP e A2A?',
        opcoes: [
          opc('a', 'MCP liga agente a ferramenta/dado (chamada curta, sem estado); A2A liga agente a agente (Task com ciclo de vida, opacidade deliberada)', true, 'os dois são complementares: MCP para as ferramentas do seu agente, A2A para falar com o agente do outro.'),
          opc('b', 'A2A substitui o MCP', false, 'resolvem problemas diferentes.'),
          opc('c', 'A2A só serve para autenticação', false, 'o Agent Card informa como autenticar, mas o protocolo é de delegação.')] },
      { id: 'm09b6-quando', pergunta: 'Quando o A2A faz sentido, comparado a uma chamada de função ou fila?',
        opcoes: [
          opc('a', 'Quando há fronteira organizacional e o outro agente é um par com raciocínio próprio', true, 'se os dois lados são seus, no mesmo sistema, função ou fila resolvem com menos protocolo, latência e superfície de ataque.'),
          opc('b', 'Sempre que existem dois agentes no mesmo sistema', false, 'dentro do mesmo sistema é protocolo demais.'),
          opc('c', 'Para expor ferramentas a um assistente', false, 'isso é MCP.')] },
      { id: 'm09b6-input', pergunta: 'O que INPUT_REQUIRED, o InputRequiredResult do MCP e o interrupt() do M10 têm em comum?',
        opcoes: [
          opc('a', 'A mesma forma: trabalho que precisa de entrada externa no meio, sem manter conexão aberta', true, 'três mecanismos convergiram para a mesma ideia porque o problema é o mesmo.'),
          opc('b', 'São o mesmo protocolo', false, 'são mecanismos diferentes.'),
          opc('c', 'Todos exigem WebSocket', false, 'não exigem.')] },
      { id: 'm09b6-card', pergunta: 'O que é o Agent Card?',
        opcoes: [
          opc('a', 'Um JSON em URI bem-conhecida com o que o agente faz e como autenticar', true, 'é a vitrine do agente, sem expor o interior (ferramentas, prompt, modelo).'),
          opc('b', 'O prompt de sistema do agente', false, 'a opacidade é deliberada: o prompt não é publicado.'),
          opc('c', 'O schema completo das ferramentas', false, 'isso é MCP; no A2A cada lado esconde as suas.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>MCP resolve <strong>agente e ferramenta/dado</strong>. O <strong>A2A (Agent2Agent)</strong> propõe resolver outro problema, <strong>agente e agente</strong>: o outro lado deixa de ser uma função (entra argumento, sai resultado) e passa a ser um par com raciocínio próprio, que pode planejar, pedir mais informação e levar minutos ou dias. Este bloco é um panorama para reconhecer o protocolo; o módulo não exige que você o implemente.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th></th><th>MCP</th><th>A2A</th></tr></thead><tbody>' +
          '<tr><td>Conecta</td><td>um agente a ferramentas, dados e prompts</td><td>um agente a outro agente</td></tr>' +
          '<tr><td>Unidade</td><td>chamada de ferramenta, segundos, sem estado</td><td>Task com identidade e ciclo de vida, possivelmente longa</td></tr>' +
          '<tr><td>Visibilidade</td><td>o cliente vê o schema completo da ferramenta</td><td>opacidade deliberada: cada lado esconde ferramentas, prompt e modelo</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'MCP é <mark>agente e ferramenta</mark>; A2A é <mark>agente e agente</mark>, com <mark>opacidade deliberada</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>O que é, em cinco linhas</h3>' +
          '<ul><li>Cada agente publica um <strong>Agent Card</strong>, JSON em URI bem-conhecida, com o que faz e como autenticar.</li>' +
          '<li>O cliente abre uma <strong>Task</strong> e troca <strong>Messages</strong> compostas de <strong>Parts</strong> (texto, arquivo, dado estruturado); a saída vem como <strong>Artifact</strong>.</li>' +
          '<li>O ciclo de vida inclui <code>INPUT_REQUIRED</code> (o outro agente precisa de mais informação, em vez de adivinhar) e <code>REJECTED</code> (recusa explícita de escopo). É o mesmo princípio do MRTR do MCP (bloco 3) e da abstenção do RAG (M07 bloco 6).</li>' +
          '<li>O acompanhamento é por polling, streaming ou push (webhook), conforme as capabilities do card.</li>' +
          '<li>Foi criado no Google em 2025 e doado à Linux Foundation; existe em bindings JSON-RPC, gRPC e REST.</li></ul>' },
        { tipo: 'rode', id: 'm09b6-rode', titulo: 'Uma Task do começo ao fim', obrigatorio: false,
          enunciado: 'Ilustração didática do ciclo (saída de exemplo, não de um servidor A2A real; o agente A2A local do Laboratório guiado M09 mostra COMPLETED, REJECTED e cancelamento).',
          prefixo: 'Prompt', entrada: 'Analise o risco de migração do módulo de pagamentos', unidade: 's', terminalTitulo: 'cliente de um orquestrador',
          prever: { pergunta: 'O agente remoto não tem o nome do banco de dados alvo. O que o ciclo prevê?', opcoes: [
            { id: 'a', texto: 'Adivinhar o banco mais provável e seguir.', correta: false, porque: 'adivinhar é o que o INPUT_REQUIRED existe para evitar.' },
            { id: 'b', texto: 'Passar a Task para INPUT_REQUIRED e pedir a informação.', correta: true, porque: 'o outro agente pede mais informação em vez de adivinhar, sem manter a conexão aberta.' },
            { id: 'c', texto: 'Falhar com erro de transporte.', correta: false, porque: 'faltar informação é estado do ciclo, não erro de transporte.' }
          ] },
          etapas: [
            { id: 'card', nome: 'Agent Card', descricao: 'descoberta', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'GET <URI bem-conhecida do agente remoto>'),
              L('out', '{ "nome": "...", "o que faz": "...", "autenticação": "..." }'),
              L('hint', 'o cartão diz o que o agente faz e como autenticar, não o que há dentro dele')] },
            { id: 'task', nome: 'Task aberta', descricao: 'Messages e Parts', tom: 'request', ms: 1, linhas: [
              L('in', 'Task criada, com identidade; Message com Part de texto'),
              L('info', 'estado: em andamento')] },
            { id: 'input', nome: 'INPUT_REQUIRED', descricao: 'pede em vez de adivinhar', tom: 'tls', ms: 1, linhas: [
              L('out', 'estado: INPUT_REQUIRED (qual banco é o alvo?)'),
              L('in', 'cliente responde com nova Message'),
              L('hint', 'mesmo princípio do MRTR do MCP e da abstenção do RAG')] },
            { id: 'fim', nome: 'Artifact', descricao: 'saída', tom: 'response', ms: 1, linhas: [
              L('out', 'estado: COMPLETED'),
              L('body', 'Artifact: relatório de risco de migração'),
              L('hint', 'o acompanhamento poderia ser por polling, streaming ou push (webhook), conforme as capabilities do card')] }
          ],
          tutorDepois: 'Task tem identidade e ciclo de vida; a saída vem como Artifact; INPUT_REQUIRED e REJECTED são estados, não exceções.',
          callout: 'Você percorreu o ciclo de uma Task.' },
        { tipo: 'takeaway', html: 'Agent Card, <mark>Task</mark>, Messages e Parts, <mark>Artifact</mark>; o outro lado <mark>pede ou recusa</mark> em vez de adivinhar.' }
      ] },

      { rotulo: 'Quando adotar', blocos: [
        { tipo: 'texto', html:
          '<h3>Quando faria sentido</h3>' +
          '<p>O A2A faz sentido quando há <strong>fronteira organizacional</strong>: o orquestrador do cliente quer chamar o seu agente como mais um item do catálogo dele, ou um agente de outro fornecedor precisa consultar o seu. Se os dois lados são seus, no mesmo sistema, chamada de função ou fila resolvem com menos protocolo, latência e superfície de ataque.</p>' +
          '<h3>Estado de adoção</h3>' },
        { tipo: 'callout', tom: 'danger', titulo: 'A adoção é incerta', html:
          '<p>MCP tem adoção muito maior porque resolve o problema mais frequente (dar ferramentas a um assistente); A2A atende um caso mais raro, e não está claro se vira padrão de fato, se converge com extensões do MCP ou se fica restrito a plataformas específicas. <strong>Verifique a versão e a adoção vigentes antes de decidir</strong>. Fonte do módulo verificada em 14/09/2026; revalidar em até 90 dias.</p>' },
        { tipo: 'texto', html:
          '<p>As duas peças são <strong>complementares</strong>: MCP para as ferramentas do seu agente, A2A para falar com o agente do outro. O Capstone usa só MCP. Adotar A2A agora seria construir a ponte antes de existir o outro lado, e o <strong>gatilho</strong> razoável para revisitar é o primeiro cliente pedir integração com o orquestrador dele.</p>' +
          '<p>Opcional: escreva um Agent Card que um humano de outra empresa entenda sem explicação e um ADR de não implementar agora, com o gatilho acima.</p>' },
        { tipo: 'takeaway', html: 'Sem <mark>fronteira organizacional</mark>, função ou fila bastam; o <mark>gatilho</mark> é o primeiro cliente pedir.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'm09b6-python', titulo: 'Escreva o ciclo da Task', obrigatorio: false,
          enunciado: 'Modelo simplificado do ciclo (subconjunto didático, não a spec completa). Complete <code>TRANSICOES</code>: <code>faltou_info</code> leva <code>WORKING</code> a <code>INPUT_REQUIRED</code>; <code>resposta</code> volta a <code>WORKING</code>; <code>cancelar</code> vale nos dois estados ativos.',
          codigo: codigo, testes: testes,
          dica: 'Cada entrada é <code>("ESTADO", "evento"): "PROXIMO"</code>. Cancelar precisa de duas entradas, uma por estado ativo.',
          solucao: solucao,
          tutorDepois: 'Estados terminais não aceitam evento: Task concluída, rejeitada ou cancelada não volta.',
          callout: 'O ciclo passou nos testes, com recusa de escopo, pedido de informação, cancelamento e estado terminal.' },
        { tipo: 'cenario', id: 'm09b6-cenario', titulo: 'O cliente pede integração com o orquestrador dele', obrigatorio: false,
          enunciado: 'O Capstone usa só MCP. Um cliente grande pergunta se o seu agente pode ser chamado pelo orquestrador dele. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Qual a decisão?', opcoes: [
              { texto: 'Adotar A2A já, mesmo sem cliente pedindo.', vai: 'f-ponte', tom: 'ruim', consequencia: 'é construir a ponte antes de existir o outro lado.' },
              { texto: 'Recusar: MCP basta para tudo.', vai: 'f-cego', tom: 'ruim', consequencia: 'MCP liga agente a ferramenta; delegar a um agente de outra organização é outro problema.' },
              { texto: 'Esse é o gatilho: verificar versão e adoção vigentes e registrar a decisão num ADR.', vai: 'f-bom', tom: 'ok', consequencia: 'a adoção é incerta e deve ser conferida na hora de decidir.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Decisão registrada com gatilho, sobre versão e adoção verificadas.' },
            'f-ponte': { bom: false, texto: 'Protocolo, latência e superfície de ataque a mais, sem outro lado.' },
            'f-cego': { bom: false, texto: 'O cliente com fronteira organizacional ficou sem caminho de integração.' }
          },
          callout: 'Você tratou o pedido do cliente como o gatilho e verificou a adoção antes.' },
        { tipo: 'escolha', id: 'm09b6-escolha', titulo: 'Confira: dois agentes, um sistema',
          pergunta: 'Seu orquestrador e seu agente de análise rodam no mesmo sistema, ambos seus. Devem falar por A2A?',
          opcoes: [
            { id: 'a', texto: 'Sim, sempre que existem dois agentes.', correta: false, porque: 'sem fronteira organizacional, é protocolo demais.' },
            { id: 'b', texto: 'Não necessariamente: chamada de função ou fila resolvem com menos protocolo, latência e superfície de ataque.', correta: true, porque: 'A2A faz sentido com fronteira organizacional.' },
            { id: 'c', texto: 'Sim, para substituir o MCP.', correta: false, porque: 'são complementares, não substitutos.' }
          ], tutorDepois: 'Fonte verificada em 14/09/2026; a adoção do A2A é incerta, revalide antes de decidir.' },
        { tipo: 'takeaway', html: 'MCP e A2A são <mark>complementares</mark>; o A2A entra quando existe o <mark>outro lado</mark>.' }
      ] }
    ]
  });
})();
