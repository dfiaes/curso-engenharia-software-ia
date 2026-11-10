/* M02A · Bloco 3: modularidade, acoplamento e domínio. Fonte: M02A.html#b3. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'RANK = {"domain": 0, "application": 1, "adapters": 2}', '', '',
    'def violacoes(imports, camada):', '    # imports: {modulo: [modulos importados]}; camada: {modulo: nome da camada}',
    '    # viola quem importa uma camada de rank MAIOR (o domínio apontando para fora)',
    '    # devolve lista ordenada de (origem, destino)', '    return []', '', '',
    'def tem_ciclo(grafo):', '    # True se há ciclo no grafo {no: [vizinhos]}', '    return False', ''].join('\n');
  var testes = [
    'CAM = {"policy": "domain", "intake": "application", "sqlite": "adapters", "cli": "adapters"}', '', '',
    'def test_grafo_correto_nao_viola():',
    '    g = {"cli": ["intake"], "intake": ["policy"], "sqlite": ["intake"], "policy": []}', '    assert violacoes(g, CAM) == []', '', '',
    'def test_dominio_importando_adapter_viola():',
    '    g = {"policy": ["sqlite"], "intake": ["policy"]}', '    assert violacoes(g, CAM) == [("policy", "sqlite")]', '', '',
    'def test_varias_violacoes_ordenadas():',
    '    g = {"policy": ["sqlite"], "intake": ["cli"]}', '    assert violacoes(g, CAM) == [("intake", "cli"), ("policy", "sqlite")]', '', '',
    'def test_ciclo_detectado_e_controle_negativo():',
    '    assert tem_ciclo({"a": ["b"], "b": ["c"], "c": ["a"]})', '    assert not tem_ciclo({"a": ["b"], "b": ["c"], "c": []})', '    assert tem_ciclo({"a": ["a"]})', ''].join('\n');
  var solucao = [
    'RANK = {"domain": 0, "application": 1, "adapters": 2}', '', '',
    'def violacoes(imports, camada):', '    out = []', '    for src, dsts in imports.items():', '        for dst in dsts:',
    '            if RANK[camada[src]] < RANK[camada[dst]]:', '                out.append((src, dst))', '    return sorted(out)', '', '',
    'def tem_ciclo(grafo):', '    estado = {}', '    def visita(n):', '        if estado.get(n) == 1:', '            return True',
    '        if estado.get(n) == 2:', '            return False', '        estado[n] = 1',
    '        if any(visita(m) for m in grafo.get(n, [])):', '            return True', '        estado[n] = 2', '        return False',
    '    return any(visita(n) for n in list(grafo))', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b3',
    titulo: 'Modularidade, acoplamento e domínio',
    minutos: 35,
    resumo: 'Módulo não é pasta e interface não é garantia: coesão e acoplamento perguntam sobre mudança; portas, adapters e composition root fazem a dependência apontar para dentro.',
    objetivo: 'Usar o grafo de imports e a mudança conjunta para julgar fronteiras, nomear o domínio com precisão e decidir quando uma abstração se paga.',
    revisao: [
      { id: 'm02ab3-modulo', pergunta: 'Dois módulos em pastas diferentes mudam juntos em quase todo PR. O que isso indica?',
        opcoes: [
          opc('a', 'Acoplamento real por mudança: a fronteira está no lugar errado, independente das pastas.', true, 'o que muda pelo mesmo motivo deve morar junto.'),
          opc('b', 'Baixo acoplamento, porque as pastas são distintas.', false, 'pasta separa arquivos, não decisões.'),
          opc('c', 'Alta coesão entre os dois.', false, 'coesão está dentro do módulo, não entre pastas que mudam juntas.')] },
      { id: 'm02ab3-bc', pergunta: 'O que é bounded context?',
        opcoes: [
          opc('a', 'O limite onde uma palavra conserva modelo consistente; não implica microserviço.', true, 'compartilhar classe ou tabela sem negociar significado cria acoplamento semântico.'),
          opc('b', 'Um serviço deployável separado.', false, 'este monólito modular tem um único contexto local de triagem.'),
          opc('c', 'Um schema de banco.', false, 'confunde modelo com armazenamento.')] },
      { id: 'm02ab3-protocol', pergunta: 'O que o <code>Protocol</code> verifica e o que não verifica?',
        opcoes: [
          opc('a', 'Compatibilidade estrutural para o checker; não prova substituição comportamental, que exige contract tests.', true, 'um adapter pode fortalecer precondição, omitir erro ou devolver advisory válido com outro significado.'),
          opc('b', 'Que dois adapters se comportam igual.', false, 'forma não é semântica.'),
          opc('c', 'Nada: é só documentação.', false, 'o type checker o usa.')] },
      { id: 'm02ab3-abstr', pergunta: 'Quando uma interface em volta de <code>IntakePolicy</code> se justifica?',
        opcoes: [
          opc('a', 'Só com variação planejada, risco ou mudança esperada explícita (ADR); senão esconde uma regra local.', true, 'Advisor tem fake, record-replay e risco de integração; a policy não.'),
          opc('b', 'Sempre: SOLID manda.', false, 'SOLID é heurística, abstração tem custo.'),
          opc('c', 'Nunca, em nenhum caso.', false, 'depende de variação e risco.')] },
      { id: 'm02ab3-composition', pergunta: 'Onde adapters concretos são escolhidos?',
        opcoes: [
          opc('a', 'No composition root; o domínio permanece importável sem adapters.', true, 'testes usam repositório em memória e advisor determinístico.'),
          opc('b', 'Dentro da policy.', false, 'a policy não instancia client externo.'),
          opc('c', 'Na CLI, junto da regra de negócio.', false, 'a CLI não decide regra.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pasta separa arquivos. Um módulo útil separa <strong>decisões que mudam por motivos diferentes</strong> e esconde o que seus consumidores não precisam conhecer. <strong>Information hiding</strong> é ocultar uma decisão sujeita a mudança atrás de uma fronteira pequena: reduz quem precisa saber da alteração e, com isso, o raio de revisão, teste e rollback. Não promete que a fronteira nunca mude.</p>' +
          '<p>Criar diretórios <code>domain</code>, <code>service</code> e <code>repository</code> não cria isolamento. Se o domínio importa SQLite, se a policy instancia um client externo ou se a CLI decide regra de negócio, o fluxo real continua apontando para dentro. O nome da camada não é o oráculo; imports, contratos e comportamento são.</p>' +
          '<h3>Coesão e acoplamento perguntam sobre mudança</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Termo</th><th>Pergunta operacional</th><th>Sinal no work-intake</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>coesão</td><td>estas partes mudam juntas porque protegem a mesma regra?</td><td><code>IntakePolicy</code> concentra critérios determinísticos</td><td>classe pequena ainda pode misturar razões de mudança</td></tr>' +
          '<tr><td>acoplamento</td><td>quem muda ou conhece detalhe quando isto muda?</td><td>aplicação depende de <code>Advisor</code>, não de replay ou fake</td><td>algum acoplamento é intencional</td></tr>' +
          '<tr><td>ciclo</td><td>dá para testar A sem inicializar B, que retorna a A?</td><td>grafo das camadas acíclico</td><td>acíclico não prova boa modelagem</td></tr>' +
          '<tr><td>estabilidade</td><td>o consumidor depende de abstração estável ou de detalhe volátil?</td><td>domínio importa modelos próprios; composition root liga concretos</td><td>estável não é permanente nem público</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p>Fan-in, fan-out, número de imports e linhas modificadas localizam suspeitas; não decidem arquitetura sozinhos. Use o grafo para perguntar qual regra cruzou a fronteira, por que precisa conhecer esse detalhe e qual teste detectará uma dependência invertida.</p>' },
        { tipo: 'takeaway', html: 'Módulo útil <mark>esconde decisão</mark> e reduz quem <mark>muda junto</mark>.' }
      ] },

      { rotulo: 'Domínio, portas e custo', blocos: [
        { tipo: 'texto', html:
          '<h3>Linguagem do domínio e limite de consistência</h3>' +
          '<p><strong>Ubiquitous language</strong> é o vocabulário compartilhado entre pessoas do problema e software: <code>WorkRequest</code>, <code>Advisory</code>, <code>Decision</code>, policy e reason code têm funções distintas; chamar tudo de <code>data</code> ou <code>manager</code> apaga regras. <strong>Bounded context</strong> é o limite onde uma palavra conserva modelo consistente; não implica microserviço. Em outro contexto, "prioridade" poderia significar outra coisa.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Construto</th><th>No recorte</th><th>Invariante observável</th></tr></thead><tbody>' +
          '<tr><td>entity</td><td>WorkRequest</td><td>chave idempotente reutilizada para intenção diferente é conflito</td></tr>' +
          '<tr><td>value object</td><td>Advisory, Decision</td><td>valor e campos, não identidade mutável</td></tr>' +
          '<tr><td>invariante</td><td>policy P0</td><td>advisory não muda proibição determinística em aceite</td></tr>' +
          '<tr><td>aggregate possível</td><td>avaliação persistida</td><td>request, advisory, decision e auditoria gravam ou revertem juntos</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Aggregate é um limite possível de consistência, não sinônimo de grupo de tabelas nem de transação distribuída. SQLite local demonstra rollback; não prova coordenação entre serviços, bancos ou filas.</p>' +
          '<h3>Portas, adapters e composition root</h3>' +
          '<p>Arquitetura hexagonal separa núcleo de detalhes externos. Domínio: vocabulário e policy. Aplicação: orquestra o caso de uso. <strong>Portas</strong>: capacidades necessárias. <strong>Adapters</strong>: traduzem SQLite, CLI, recording, provider. <strong>Composition root</strong>: escolhe implementações concretas. As setas de código apontam todas para o domínio, nunca o contrário.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: '# Trecho conceitual: a aplicação depende da capacidade, não do adapter.\nclass Advisor(Protocol):\n    def advise(self, request: WorkRequest) -> Advisory: ...\n\nclass EvaluateWorkRequest:\n    def __init__(self, repository: EvaluationRepository, advisor: Advisor) -> None:\n        self._repository = repository\n        self._advisor = advisor\n\n# Adapters concretos entram só na composição.\ndef build_evaluator(database: Path, advisor_kind: str) -> EvaluateWorkRequest:\n    repository = SQLiteEvaluationRepository(database)\n    advisor = FakeAdvisor() if advisor_kind == "fake" else RecordReplayAdvisor(...)\n    return EvaluateWorkRequest(repository=repository, advisor=advisor)' },
        { tipo: 'texto', html:
          '<p><code>Protocol</code> descreve compatibilidade estrutural para o checker; não prova substituição comportamental. Contract tests com os mesmos inputs, erros e pós-condições tratam a diferença. Domínio importável sem adapters e testes com repositório em memória e advisor determinístico são propriedades estreitas: não provam que qualquer provider futuro será substituível.</p>' +
          '<h3>SOLID é heurística; abstração tem custo</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Heurística</th><th>Pergunta útil</th><th>Uso incorreto</th></tr></thead><tbody>' +
          '<tr><td>responsabilidade única</td><td>qual motivo de mudança domina?</td><td>uma classe por verbo, sem coesão</td></tr>' +
          '<tr><td>aberto/fechado</td><td>qual variação prevista merece extensão?</td><td>prever todo futuro com hierarquia</td></tr>' +
          '<tr><td>substituição</td><td>o alternativo preserva pré e pós-condições?</td><td>concluir pelo type check que a semântica equivale</td></tr>' +
          '<tr><td>segregação</td><td>o consumidor precisa dessas operações?</td><td>fragmentar até perder o workflow</td></tr>' +
          '<tr><td>inversão</td><td>policy depende de detalhe ou de capacidade estável?</td><td>interface para toda classe sem variação</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p>Abstração cobra leitura, documentação, teste e governança. <code>Advisor</code> tem fake, record-replay e risco explícito, então se justifica; uma interface em volta de <code>IntakePolicy</code>, sem variação planejada, só esconderia uma regra local (exige ADR ou remoção).</p>' +
          '<p><strong>Panorama (contexto, não fundamento):</strong> o Octoverse 2025 (repositórios públicos do GitHub) relata crescimento de Python e TypeScript e associa tipos a fluxos com IA; não mede vagas, qualidade de arquitetura nem causalidade. O sinal didático: geração mais rápida aumenta a necessidade de contratos legíveis e checks automáticos. FastAPI, Django, SQLAlchemy e mensageria são adapters de ecossistema, não fundamentos (a pesquisa Stack Overflow 2025 registra crescimento de FastAPI, sem torná-lo requisito do domínio).</p>' },
        { tipo: 'takeaway', html: '<mark>Protocol</mark> verifica forma; <mark>contract test</mark> verifica semântica; abstração só se paga com <mark>variação, risco ou mudança esperada</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'rode', id: 'b3-rode', titulo: 'Quando o domínio importa SQLite', obrigatorio: false,
          enunciado: 'Saída ilustrativa (exemplo) de um teste de arquitetura sobre o grafo de imports.',
          prefixo: '$', entrada: 'pytest tests/test_architecture.py  # exemplo', unidade: 'ms', terminalTitulo: 'exemplo (saída variável)',
          prever: { pergunta: 'mypy aceita o código. O teste de arquitetura passa?', opcoes: [
            { id: 'a', texto: 'Passa: o tipo está certo.', correta: false, porque: 'o type checker não vê a direção da dependência.' },
            { id: 'b', texto: 'Falha: domain/policy.py importa adapters.sqlite.', correta: true, porque: 'a camada não é oráculo; o import é.' }] },
          etapas: [
            { id: 'm', nome: 'mypy --strict', descricao: 'tipos', tom: 'dns', ms: 1, linhas: [L('out', 'Success: no issues found')] },
            { id: 'a', nome: 'Teste de arquitetura', descricao: 'grafo de imports', tom: 'response', ms: 1, linhas: [L('out', 'FAILED  domain/policy.py -> adapters/sqlite/repository.py'), L('hint', 'mova a tradução para o adapter e dependa da port')] }
          ] },
        { tipo: 'python', id: 'b3-python', titulo: 'Guardião da direção das dependências', obrigatorio: false,
          enunciado: 'Implemente <code>violacoes(imports, camada)</code> (pares origem, destino em que uma camada interna importa uma externa) e <code>tem_ciclo(grafo)</code>.',
          codigo: codigo, testes: testes,
          dica: 'Compare <code>RANK[camada[src]] &lt; RANK[camada[dst]]</code>. Ciclo: busca em profundidade com estados 1 (em visita) e 2 (concluído).',
          solucao: solucao, callout: 'O guardião acusa a dependência invertida e o ciclo.' },
        { tipo: 'ordene', id: 'b3-ordene', titulo: 'Ordene a dependência de dentro para fora', obrigatorio: false,
          itens: [{ id: 'cli', texto: 'CLI / API (adapter de entrada)' }, { id: 'dom', texto: 'Domínio: policy, vocabulário' }, { id: 'app', texto: 'Aplicação: casos de uso e portas' }, { id: 'sql', texto: 'Adapter SQLite / advisor' }],
          solucao: ['dom', 'app', 'cli', 'sql'], dica: 'O núcleo vem primeiro; os dois adapters ficam por último (entrada e saída).' },
        { tipo: 'escolha', id: 'b3-esc1', titulo: 'Confira: diagnóstico', pergunta: 'mypy aceita dois adapters, mas um quebra em produção. Qual a hipótese?',
          opcoes: [
            { id: 'a', texto: 'Forma foi confundida com semântica; falta contract suite com os mesmos inputs e erros.', correta: true, porque: 'especifique o comportamento e rejeite divergência.' },
            { id: 'b', texto: 'O mypy está desatualizado.', correta: false, porque: 'nenhum checker estrutural vê pré e pós-condições.' }] },
        { tipo: 'escolha', id: 'b3-esc2', titulo: 'Confira: interface ritual', pergunta: 'Há uma interface para cada classe, sem variação planejada. O que fazer?',
          opcoes: [
            { id: 'a', texto: 'Remover ou justificar a fronteira com ADR (variação, risco ou mudança prevista).', correta: true, porque: 'abstração ritual só custa leitura e teste.' },
            { id: 'b', texto: 'Criar mais interfaces para consistência.', correta: false, porque: 'amplia o custo sem ganho.' }] },
        { tipo: 'takeaway', html: 'Bounded context delimita <mark>significado</mark>, não deploy.' }
      ] }
    ]
  });
})();
