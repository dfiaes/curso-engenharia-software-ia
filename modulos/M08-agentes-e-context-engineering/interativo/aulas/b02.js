/* M08 · Bloco 2: os cinco padrões compostáveis. Fonte: M08.html#b02. Fontes verificadas em 14/09/2026 (Anthropic, building effective agents). Saídas de terminal são exemplos ilustrativos com modelo fake. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasRota = function (q, rota, motivo) {
    return [
      { id: 'regra', nome: 'Regras', descricao: 'Regra primeiro, sem LLM', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python rotear.py "' + q + '"'),
        L('info', 'pergunta: ' + q)] },
      { id: 'rota', nome: 'Rota', descricao: 'Despacho para o tratamento', tom: 'request', ms: 1, linhas: [
        L('in', 'rota: ' + rota),
        L('hint', motivo)] }
    ];
  };

  var etapasLoop = function () {
    return [
      { id: 'gerar', nome: 'Gerador', descricao: 'Rascunho do relatório', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python evaluator_optimizer.py --max-voltas 2'),
        L('out', 'volta 1: rascunho com 5 afirmações, 4 com citação arquivo:linha')] },
      { id: 'avaliar', nome: 'Avaliador', descricao: 'Rubrica: toda afirmação tem citação verificável', tom: 'tcp', ms: 1, linhas: [
        L('out', 'avaliador (determinístico): REPROVADO, afirmação 3 sem citação'),
        L('hint', 'o avaliador é o grader de citação do M07, sem LLM')] },
      { id: 'revisar', nome: 'Revisão', descricao: 'Volta ao gerador com o feedback', tom: 'tls', ms: 1, linhas: [
        L('out', 'volta 2: gerador corrige a afirmação 3 e cita src/pagamento.py:88')] },
      { id: 'saida', nome: 'Saída', descricao: 'Aprovado dentro do teto', tom: 'ink', ms: 1, linhas: [
        L('in', 'avaliador: APROVADO na volta 2 de no máximo 2'),
        L('hint', 'teto de voltas respeitado, custo = 2 chamadas de geração + 2 verificações baratas')] }
    ];
  };

  var codigoRotear = [
    'import re', '', '',
    'def rotear(pergunta):',
    '    """Regra primeiro; o que a regra não cobre vai para a rota segura "fallback"."""',
    '    p = pergunta.strip()',
    '    # identificador exato (snake_case, CamelCase ou com ponto) -> "lexica"',
    '    # agregação ("quantos", "média") -> "sql"',
    '    # conceito ("como funciona", "o que é") -> "rag"',
    '    # estrutura ("quem chama", "depende de") -> "grafo"',
    '    return "rag"', '', '',
    'def votar(respostas):',
    '    """Devolve (resposta, revisar_humano). Discordância é sinal de caso ambíguo."""',
    '    return respostas[0], False', '', '',
    'print(rotear("PagamentoSvc"), votar(["alto", "alto", "baixo"]))', ''].join('\n');
  var testesRotear = [
    'def test_identificador_vai_para_busca_lexica():',
    '    assert rotear("PagamentoSvc") == "lexica"',
    '    assert rotear("calcula_juros") == "lexica"', '', '',
    'def test_agregacao_vai_para_sql():',
    '    assert rotear("quantos arquivos têm mais de 500 linhas?") == "sql"', '', '',
    'def test_conceito_vai_para_rag():',
    '    assert rotear("como funciona a autenticação?") == "rag"', '', '',
    'def test_estrutura_vai_para_grafo():',
    '    assert rotear("quem chama calcula_juros?") == "grafo"', '', '',
    'def test_fallback_seguro_para_o_que_nao_se_sabe():',
    '    assert rotear("") == "fallback"',
    '    assert rotear("bom dia, tudo bem?") == "fallback"', '', '',
    'def test_voting_consenso_nao_chama_humano():',
    '    assert votar(["alto", "alto", "alto"]) == ("alto", False)', '', '',
    'def test_voting_discordancia_pede_revisao():',
    '    resposta, revisar = votar(["alto", "alto", "baixo"])',
    '    assert revisar is True and resposta == "alto"', '', '',
    'def test_voting_vazio_falha():',
    '    try:', '        votar([])', '    except ValueError:', '        return',
    '    raise AssertionError("esperava ValueError")', ''].join('\n');
  var solucaoRotear = [
    'import re', '', '',
    'def rotear(pergunta):',
    '    p = pergunta.strip()',
    '    if not p:', '        return "fallback"',
    '    baixo = p.lower()',
    '    if re.fullmatch(r"[A-Za-z_][\\w.]*", p) and ("_" in p or "." in p or re.search(r"[a-z][A-Z]", p) or p[0].isupper()):',
    '        return "lexica"',
    '    if any(k in baixo for k in ("quantos", "média", "media", "total de")):', '        return "sql"',
    '    if any(k in baixo for k in ("quem chama", "depende de", "chamadores")):', '        return "grafo"',
    '    if any(k in baixo for k in ("como funciona", "o que é", "por que")):', '        return "rag"',
    '    return "fallback"', '', '',
    'def votar(respostas):',
    '    if not respostas:', '        raise ValueError("sem respostas")',
    '    contagem = {}',
    '    for r in respostas:', '        contagem[r] = contagem.get(r, 0) + 1',
    '    vencedora = max(contagem, key=contagem.get)',
    '    return vencedora, len(contagem) > 1', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm08-b2',
    titulo: 'Os cinco padrões compostáveis',
    minutos: 35,
    resumo: 'Entre uma chamada de LLM e um agente autônomo existem cinco padrões de workflow que resolvem a maior parte dos problemas reais, com custo previsível: chaining, routing, parallelization, orchestrator-workers e evaluator-optimizer.',
    objetivo: 'Reconhecer cada padrão pelo nome, dizer quando usar e qual o cuidado, e compor dois ou três deles para uma etapa real do Capstone.',
    revisao: [
      { id: 'm08b2-routing', pergunta: 'Por que o padrão routing precisa de uma rota de fallback?',
        opcoes: [
          opc('a', 'Porque sempre haverá entrada que o classificador não sabe classificar, e o destino dela tem de ser seguro', true, 'o "não sei classificar" é uma rota explícita; no lab, a rota ainda não implementada responde que não está implementada.'),
          opc('b', 'Porque o fallback reduz o custo do classificador', false, 'o fallback é segurança, não economia.'),
          opc('c', 'Porque o roteador nunca erra sem ele', false, 'o fallback não impede o erro, só dá destino a ele.')] },
      { id: 'm08b2-voting', pergunta: 'Qual é o problema de rodar o mesmo prompt três vezes em temperatura 0 para ganhar confiança (voting)?',
        opcoes: [
          opc('a', 'O consenso é ilusório: o mesmo prompt em temperatura 0 dá quase sempre a mesma resposta; prefira prompts diferentes e só onde o erro é caro', true, 'voting multiplica o custo por N e só agrega informação quando as execuções são realmente diferentes.'),
          opc('b', 'O custo cai pela metade', false, 'o custo é multiplicado por N.'),
          opc('c', 'Voting não funciona com LLMs', false, 'funciona com prompts distintos, em decisões de erro caro.')] },
      { id: 'm08b2-orq', pergunta: 'Qual é a diferença crucial entre sectioning e orchestrator-workers?',
        opcoes: [
          opc('a', 'No orchestrator-workers as subtarefas não são conhecidas de antemão: quem as define é o orquestrador, olhando o problema', true, 'em sectioning você já sabe as partes (400 arquivos independentes) e ganha latência.'),
          opc('b', 'Sectioning usa LLM e orchestrator-workers não', false, 'ambos usam LLM.'),
          opc('c', 'Orchestrator-workers é sempre mais barato', false, 'o custo depende do problema; o que muda é quem define as subtarefas.')] },
      { id: 'm08b2-chain', pergunta: 'Para que servem os gates determinísticos entre os passos do prompt chaining?',
        opcoes: [
          opc('a', 'Abortar cedo quando um passo saiu errado, porque o erro no passo 1 contamina todos os seguintes', true, 'cada passo tem uma tarefa só (menos erro por chamada), mas sem o gate o erro se propaga.'),
          opc('b', 'Reduzir a latência da cadeia', false, 'gates acrescentam uma verificação, não removem passos.'),
          opc('c', 'Substituir o LLM do segundo passo', false, 'o gate valida; o passo seguinte continua existindo.')] },
      { id: 'm08b2-eo', pergunta: 'Quando o evaluator-optimizer compensa?',
        opcoes: [
          opc('a', 'Quando há critério de avaliação claro e o feedback comprovadamente melhora o resultado, com teto de voltas', true, 'teste honesto: um revisor humano melhoraria isso com feedback escrito? Sem teto e com avaliador frouxo, é gasto sem ganho.'),
          opc('b', 'Sempre que o gerador errar uma vez', false, 'sem critério claro o ciclo só gasta.'),
          opc('c', 'Quando gerador e avaliador são o mesmo modelo, para economizar', false, 'avaliador da mesma família herda os vieses do gerador.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Entre "uma chamada de LLM" e "agente autônomo" existem cinco padrões de workflow que resolvem a maior parte dos problemas reais, com custo previsível e depuração fácil. Conhecê-los pelo nome é vocabulário de mercado; saber qual escolher é engenharia. Eles são <strong>compostáveis</strong>: sistemas de produção combinam dois ou três, e o Capstone usa quatro. Clique em cada padrão.</p>' },
        { tipo: 'abas', rotulo: 'Padrão', itens: [
          { rotulo: '1 · Chaining', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Prompt chaining</strong> (encadeamento) decompõe a tarefa em passos fixos, cada chamada processando a saída da anterior. Entre os passos você pode colocar <strong>gates</strong> determinísticos que abortam se algo saiu errado.</p>' },
            { tipo: 'codigo', linguagem: 'text', texto: 'entrada -> [LLM: extrair estrutura] -> (gate: schema válido?) -> [LLM: classificar risco] -> saída' },
            { tipo: 'texto', html:
              '<p><strong>Quando usar:</strong> a tarefa se decompõe em subtarefas fixas e você aceita mais latência em troca de mais acurácia (cada chamada tem uma tarefa só, e modelo com tarefa única erra menos). <strong>No Capstone:</strong> o relatório final (resumir por arquivo, agregar por módulo, priorizar riscos). <strong>Cuidado:</strong> erro no passo 1 contamina tudo; por isso o gate entre passos (M01, bloco 2).</p>' }
          ] },
          { rotulo: '2 · Routing', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Routing</strong> (roteamento) classifica a entrada e despacha para um tratamento especializado. É o padrão de maior retorno por simplicidade, e você já o usou no M07 (bloco 5).</p>' },
            { tipo: 'codigo', linguagem: 'text', texto: [
              'pergunta -> [classificador] -+-> identificador? -> busca léxica pura',
              '                             +-> conceito?      -> RAG híbrido',
              '                             +-> estrutura?     -> grafo (M10)',
              '                             +-> agregação?     -> SQL determinístico'].join('\n') },
            { tipo: 'texto', html:
              '<p><strong>Quando usar:</strong> categorias distintas exigem tratamentos distintos, e misturá-las num prompt só piora todas. Ganho colateral: dá para usar modelo barato onde couber (M05, bloco 6), e o classificador costuma caber num modelo pequeno ou, melhor, numa regra. <strong>Cuidado:</strong> a rota de fallback ("não sei classificar") tem de existir e ser segura.</p>' }
          ] },
          { rotulo: '3 · Parallelization', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Parallelization</strong> (paralelização) tem duas variantes que resolvem problemas diferentes.</p>' +
              '<ul><li><strong>Sectioning</strong>: quebra a tarefa em subtarefas independentes e roda em paralelo. Ganho: latência. No Capstone, analisar 400 arquivos com <code>asyncio.gather</code> e semáforo (M02, bloco 4; M05, bloco 4).</li>' +
              '<li><strong>Voting</strong>: roda a MESMA tarefa N vezes (ou com N prompts diferentes) e agrega por consenso. Ganho: confiança. No Capstone, classificar risco alto: se três execuções discordam, é sinal de caso ambíguo que merece revisão humana, e isso é informação, não ruído.</li></ul>' +
              '<p><strong>Cuidado com voting:</strong> multiplica o custo por N. Use só onde o erro é caro e prefira prompts diferentes a repetições idênticas: repetir o mesmo prompt em temperatura 0 dá quase sempre a mesma resposta (M05, bloco 1), então o "consenso" é ilusório.</p>' }
          ] },
          { rotulo: '4 · Orchestrator-workers', blocos: [
            { tipo: 'texto', html:
              '<p>No <strong>orchestrator-workers</strong> (orquestrador-trabalhadores), um LLM central decompõe a tarefa dinamicamente e delega a trabalhadores; depois sintetiza os resultados. A diferença crucial para o sectioning: as subtarefas não são conhecidas antes, e quem as define é o orquestrador, olhando o problema.</p>' },
            { tipo: 'codigo', linguagem: 'text', texto: [
              'tarefa -> [orquestrador: decompõe] -+-> [worker 1] -+',
              '                                    +-> [worker 2] -+-> [orquestrador: sintetiza] -> saída',
              '                                    +-> [worker N] -+'].join('\n') },
            { tipo: 'texto', html:
              '<p><strong>Quando usar:</strong> mudanças em vários arquivos, pesquisa que abre em várias frentes, análise cujo escopo depende do que se encontra. É o padrão que você executou à mão com worktrees (M01, bloco 4) e o que sustenta os subagentes do bloco 6. <strong>Cuidado:</strong> o orquestrador precisa manter o contexto limpo; se ele ler tudo que os workers produziram, perde a vantagem (bloco 4).</p>' }
          ] },
          { rotulo: '5 · Evaluator-optimizer', blocos: [
            { tipo: 'texto', html:
              '<p>No <strong>evaluator-optimizer</strong> (avaliador-otimizador), um LLM gera, outro critica com uma rubrica e o primeiro revisa. Repete até passar ou até o orçamento acabar.</p>' },
            { tipo: 'codigo', linguagem: 'text', texto: [
              '[gerador] -> rascunho -> [avaliador: rubrica] -- reprovado --> volta com feedback',
              '                                            \\-- aprovado  --> saída'].join('\n') },
            { tipo: 'texto', html:
              '<p><strong>Quando usar:</strong> existe critério de avaliação claro e o feedback comprovadamente melhora o resultado. O teste honesto: um revisor humano melhoraria isso com feedback escrito? <strong>No Capstone:</strong> o relatório final passa por um avaliador que checa "toda afirmação tem citação verificável" (o grader determinístico do M07, bloco 7; o avaliador nem precisa ser LLM). <strong>Cuidado:</strong> loop sem teto e avaliador frouxo produzem gasto sem ganho, e avaliador do mesmo modelo ou família herda os vieses do gerador (M06, bloco 3).</p>' }
          ] }
        ] },
        { tipo: 'takeaway', html: 'Cinco padrões cobrem quase tudo: <mark>chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer</mark>, e cada um tem um <mark>cuidado</mark> que precisa virar código.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Roteamento: regra primeiro, LLM no resto</h3>' +
          '<p>O roteador do Capstone tenta regras antes de qualquer modelo. Se nenhuma serve, a pergunta vai para o fallback, que é uma rota com tratamento seguro. Saída de exemplo ilustrativo.</p>' },
        { tipo: 'rode', id: 'rota-rode', titulo: 'Despache uma pergunta',
          enunciado: 'Rode o roteador numa pergunta que cita uma classe pelo nome exato e veja a rota escolhida.',
          prefixo: '$', entrada: 'python rotear.py "PagamentoSvc"', unidade: 'passo', terminalTitulo: 'roteador com fallback',
          etapas: etapasRota('PagamentoSvc', 'busca léxica pura', 'identificador exato: busca léxica resolve sem LLM, de graça e de forma determinística'),
          prever: { pergunta: 'A pergunta é só o nome exato de uma classe: "PagamentoSvc". Para onde ela deve ir?', opcoes: [
            { id: 'a', texto: 'Busca léxica pura: identificador exato não precisa de semântica.', correta: true, porque: 'a tabela de roteamento manda identificador para busca léxica; RAG híbrido é para conceito.' },
            { id: 'b', texto: 'RAG híbrido: tudo que é pergunta vai para o RAG.', correta: false, porque: 'misturar categorias num tratamento só piora todas.' },
            { id: 'c', texto: 'SQL determinístico: é uma consulta.', correta: false, porque: 'SQL é para agregação; aqui a pergunta é localizar um nome.' }
          ] },
          tutorDepois: 'Regra primeiro: o classificador mais barato é o que não chama modelo.',
          callout: 'Você viu o padrão de maior retorno por simplicidade funcionando.' },
        { tipo: 'texto', html:
          '<h3>Evaluator-optimizer com teto</h3>' +
          '<p>O ciclo abaixo usa o avaliador determinístico de citação. Escolha uma falha para ver o que acontece quando o teto ou o avaliador falham.</p>' },
        { tipo: 'quebre', id: 'eo-quebre', titulo: 'Quebre o ciclo de revisão',
          enunciado: 'Escolha uma falha, rode, e depois rode "Sem falha" para fechar o exercício. Saídas de exemplo ilustrativo, com modelo fake.',
          prefixo: '$', entrada: 'python evaluator_optimizer.py --max-voltas 2', unidade: 'volta', terminalTitulo: 'relatório com citações', etapas: etapasLoop(),
          falhas: [
            { id: 'sem-teto', rotulo: 'Remover o teto de voltas', efeito: { etapaFalha: 'revisar', linhasErro: [
              L('info', 'sem --max-voltas: o avaliador reprova a afirmação 3 em toda volta'),
              L('out', 'volta 2, 3, 4, ... 9: REPROVADO, mesma afirmação sem citação'),
              L('out', 'orçamento de tokens esgotado na volta 9, nenhuma versão aprovada'),
              L('hint', 'exit=1')
            ], tutor: 'loop sem teto e avaliador que não converge produzem gasto sem ganho: o teto de voltas é parte do padrão, não um refinamento.' } },
            { id: 'frouxo', rotulo: 'Avaliador frouxo', efeito: { etapaFalha: 'avaliar', linhasErro: [
              L('info', 'avaliador trocado por "a resposta parece completa?" (LLM da mesma família do gerador)'),
              L('out', 'avaliador: APROVADO na volta 1'),
              L('out', 'afirmação 3 segue sem citação verificável'),
              L('hint', 'exit=0, e é esse o problema')
            ], tutor: 'avaliador sem rubrica verificável aprova o que o gerador quis dizer, e avaliador da mesma família herda os vieses do gerador. Prefira o grader determinístico quando um teste decide.' } }
          ],
          tutorAntes: 'Escolha uma falha, aperte Enter e leia a saída. Depois tente a outra e, por fim, rode sem falha.',
          tutorDepois: 'O ciclo saudável tem rubrica verificável, teto de voltas e, quando possível, avaliador sem LLM.',
          callout: 'Você viu as duas formas de o evaluator-optimizer virar gasto sem ganho.' },
        { tipo: 'callout', tom: 'info', titulo: 'Padrões conhecidos, nós probabilísticos', html:
          '<p>Os cinco têm parentes em engenharia: chaining é pipeline; routing é strategy mais factory; sectioning é execução paralela agregada; voting é quórum por consenso; orchestrator-workers é coordenador com trabalhadores; evaluator-optimizer é o ciclo de revisão automatizado. Nenhum é novo. O novo é que os nós agora são probabilísticos, o que muda o tratamento de erro: em vez de exceção, saída ruim. Por isso os gates determinísticos entre passos importam tanto.</p>' },
        { tipo: 'takeaway', html: 'Todo padrão precisa de um <mark>teto</mark> e de uma <mark>verificação determinística</mark> onde for possível.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Sobre frameworks: a recomendação da fonte primária</h3>' +
          '<p>Comece usando a API do modelo diretamente. Os cinco padrões são dezenas de linhas cada, e o loop completo você já escreveu no M05 (bloco 3). Frameworks (bloco 7) escondem o prompt real, adicionam camadas que dificultam a depuração e induzem complexidade que o problema não pedia. Adote framework quando souber exatamente o que ele faz por você, e o único jeito de saber é ter escrito sem ele antes.</p>' },
        { tipo: 'python', id: 'rotear-python', titulo: 'Roteador com fallback e voting', obrigatorio: false,
          enunciado: 'Complete <code>rotear(pergunta)</code> com regras, na ordem: vazio vai para <code>"fallback"</code>; identificador exato (snake_case, CamelCase ou com ponto) vai para <code>"lexica"</code>; "quantos" ou "média" vão para <code>"sql"</code>; "quem chama" ou "depende de" vão para <code>"grafo"</code>; "como funciona" ou "o que é" vão para <code>"rag"</code>; o resto vai para <code>"fallback"</code>. Depois complete <code>votar(respostas)</code>: devolve <code>(resposta_mais_comum, revisar_humano)</code>, com <code>revisar_humano</code> verdadeiro quando houver discordância.',
          codigo: codigoRotear, testes: testesRotear,
          dica: 'Teste primeiro o vazio. Para o identificador use <code>re.fullmatch(r"[A-Za-z_][\\w.]*", p)</code> e exija <code>_</code>, <code>.</code> ou maiúscula, senão "bom" viraria identificador. Em <code>votar</code>, conte com um dict e compare <code>len(contagem)</code> com 1.',
          solucao: solucaoRotear,
          tutorDepois: 'O fallback é rota de verdade: "bom dia" não vira busca nem RAG. E a discordância no voting saiu como sinal para humano, não como ruído.',
          callout: 'Regra primeiro, fallback seguro e voting que sinaliza ambiguidade.' },
        { tipo: 'complete', id: 'eo-complete', titulo: 'Esqueleto do avaliador-otimizador', linguagem: 'python',
          enunciado: 'Escolha, em cada lacuna, a peça que faz o ciclo terminar com custo limitado e com uma verificação que não depende de opinião.',
          partes: [
            'def revisar_relatorio(gerar, avaliar, ',
            { lacuna: 'teto', opcoes: ['max_voltas=2', 'max_voltas=None', 'ate_agradar=True'], correta: 'max_voltas=2' },
            '):\n    feedback = None\n    for volta in range(1, max_voltas + 1):\n        rascunho = gerar(feedback)\n        achados = avaliar(rascunho)   # grader de citação, ',
            { lacuna: 'grader', opcoes: ['determinístico, sem LLM', 'o mesmo LLM do gerador', 'um humano a cada volta'], correta: 'determinístico, sem LLM' },
            '\n        if not achados:\n            return rascunho, volta\n        feedback = achados\n    ',
            { lacuna: 'fim', opcoes: ['return rascunho, None  # reprovado: devolve o que há, sinalizado', 'return "aprovado", max_voltas', 'continue  # tenta até passar'], correta: 'return rascunho, None  # reprovado: devolve o que há, sinalizado' },
            '\n'
          ],
          explicacao: 'O teto de voltas limita o gasto; o grader de citação decide por regra o que um teste decide; e, esgotado o teto, a função sinaliza a reprovação em vez de fingir aprovação.',
          callout: 'Ciclo com teto, avaliador verificável e fim honesto.' },
        { tipo: 'cenario', id: 'mapa-cenario', titulo: 'Qual padrão para cada etapa do relatório', obrigatorio: false,
          enunciado: 'Você precisa analisar 400 arquivos e produzir o relatório final com citações. Escolha o padrão de cada decisão e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Primeiro, analisar os 400 arquivos, todos independentes entre si. Qual padrão?', opcoes: [
              { texto: 'Sectioning: as partes são conhecidas, rodam em paralelo com semáforo.', vai: 'relatorio', tom: 'ok', consequencia: 'ganho de latência com custo igual ao serial.' },
              { texto: 'Orchestrator-workers, deixando o orquestrador decidir as partes.', vai: 'f-caro', tom: 'ruim', consequencia: 'as subtarefas já eram conhecidas; você pagou um LLM para redescobri-las.' },
              { texto: 'Voting em cada arquivo, por segurança.', vai: 'f-caro', tom: 'ruim', consequencia: 'o custo foi multiplicado por N em tudo, e não só onde o erro é caro.' }
            ] },
            relatorio: { texto: 'Agora o relatório final, em que toda afirmação precisa de citação verificável. Qual composição?', opcoes: [
              { texto: 'Chaining (por arquivo, por módulo, riscos) mais evaluator-optimizer com grader determinístico e no máximo 2 voltas.', vai: 'f-bom', tom: 'ok', consequencia: 'cada passo tem uma tarefa e o avaliador decide por regra, com teto.' },
              { texto: 'Um único prompt gigante e confiar que cita.', vai: 'f-solto', tom: 'ruim', consequencia: 'sem gate nem avaliador, afirmação sem citação passa.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Composição de padrões simples, com custo previsível e verificação determinística: só uma etapa do produto exige agência real.' },
            'f-caro': { bom: false, texto: 'Funciona, mas gasta mais e fica mais difícil de depurar do que a versão com o padrão certo.' },
            'f-solto': { bom: false, texto: 'O relatório sai bonito e com afirmações sem evidência, justo o que a rubrica existia para barrar.' }
          },
          callout: 'Você compôs sectioning, chaining e evaluator-optimizer com teto.' },
        { tipo: 'takeaway', html: 'Compor dois ou três padrões simples, com <mark>fallback</mark>, <mark>teto</mark> e <mark>avaliador determinístico</mark>, vence o agente por reflexo.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'conf-voting', titulo: 'Confira: voting em temperatura 0',
          pergunta: 'Voting rodando o mesmo prompt 3 vezes em temperatura 0 para "ganhar confiança". Qual o problema?',
          opcoes: [
            { id: 'a', texto: 'O consenso é ilusório: o mesmo prompt em temperatura 0 dá quase sempre a mesma resposta; prefira prompts diferentes, e só onde o erro é caro.', correta: true, porque: 'voting multiplica o custo por N e só agrega informação quando as execuções são realmente diferentes.' },
            { id: 'b', texto: 'Voting nunca funciona com LLMs.', correta: false, porque: 'funciona quando as execuções diferem e a discordância vira sinal.' },
            { id: 'c', texto: 'O custo cai pela metade.', correta: false, porque: 'o custo é multiplicado por N.' },
            { id: 'd', texto: 'A latência aumenta, mas a confiança também, na mesma proporção.', correta: false, porque: 'sem diversidade entre as execuções, a confiança não sobe.' }
          ] },
        { tipo: 'escolha', id: 'conf-sectioning', titulo: 'Confira: sectioning × orchestrator-workers',
          pergunta: 'Qual é a diferença crucial entre sectioning e orchestrator-workers?',
          opcoes: [
            { id: 'a', texto: 'No orchestrator-workers as subtarefas não são conhecidas de antemão: quem as define é o orquestrador, olhando o problema.', correta: true, porque: 'em sectioning você sabe as partes e roda em paralelo para ganhar latência.' },
            { id: 'b', texto: 'Sectioning usa LLM e orchestrator-workers não.', correta: false, porque: 'ambos usam LLM; a diferença é quem define as subtarefas.' },
            { id: 'c', texto: 'Orchestrator-workers é sempre mais barato.', correta: false, porque: 'não: há um LLM extra decompondo e sintetizando.' },
            { id: 'd', texto: 'Não há diferença; são nomes para a mesma coisa.', correta: false, porque: 'o escopo conhecido antes ou descoberto durante é exatamente a diferença.' }
          ] },
        { tipo: 'takeaway', html: 'Em <mark>sectioning</mark> você sabe as partes; no <mark>orchestrator-workers</mark> quem descobre as partes é o orquestrador.' }
      ] }
    ]
  });
})();
