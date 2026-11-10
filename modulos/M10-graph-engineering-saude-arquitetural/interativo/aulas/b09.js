/* M10 · Bloco 9: Mini-projeto, as três perguntas respondidas. Fonte: M10.html#b09, laboratório guiado, fontes e conclusão. Números do rode são de um eval de brinquedo, não do laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoEval = `def caminho_valido(arestas, rota):
    """Grader de caminho: a rota citada na resposta existe no grafo?
    arestas: conjunto de (chamador, chamado). rota: [A, B, C] em ordem de chamada.
    Precisa de pelo menos 2 nos e de toda aresta consecutiva presente."""
    return True


def divergencias(relatorio, gabarito):
    """Reconcilia o relatorio com o gabarito (conjuntos).
    {"faltando": [no gabarito, nao no relatorio], "extras": [no relatorio, nao no gabarito]}"""
    return {"faltando": [], "extras": []}


def reprodutivel(fn, entrada, n=3):
    """Grader de reprodutibilidade: n execucoes, mesma saida?"""
    return True


def taxa(casos):
    """casos: lista de (passou, esperado_falhar). Os esperado_falhar (reflexao,
    DI por convencao) ficam fora da taxa e sao declarados a parte.
    Sem casos contaveis: 0.0."""
    return 0.0
`;
  var solucaoEval = `def caminho_valido(arestas, rota):
    if len(rota) < 2:
        return False
    return all((a, b) in arestas for a, b in zip(rota, rota[1:]))


def divergencias(relatorio, gabarito):
    relatorio, gabarito = set(relatorio), set(gabarito)
    return {"faltando": sorted(gabarito - relatorio), "extras": sorted(relatorio - gabarito)}


def reprodutivel(fn, entrada, n=3):
    return len({repr(fn(entrada)) for _ in range(n)}) == 1


def taxa(casos):
    contaveis = [passou for passou, esperado_falhar in casos if not esperado_falhar]
    if not contaveis:
        return 0.0
    return sum(1 for p in contaveis if p) / len(contaveis)
`;
  var testesEval = `ARESTAS = {("Tela.Pagar", "Pagamento.Processar"), ("Pagamento.Processar", "Juros.Calcular")}


def test_caminho_valido():
    assert caminho_valido(ARESTAS, ["Tela.Pagar", "Pagamento.Processar", "Juros.Calcular"]) is True


def test_caminho_com_salto_inventado():
    assert caminho_valido(ARESTAS, ["Tela.Pagar", "Juros.Calcular"]) is False


def test_caminho_na_direcao_errada_ou_curto():
    assert caminho_valido(ARESTAS, ["Juros.Calcular", "Pagamento.Processar"]) is False
    assert caminho_valido(ARESTAS, ["Tela.Pagar"]) is False


def test_divergencias_apontam_os_dois_lados():
    r = divergencias({"a", "b", "x"}, {"a", "b", "c"})
    assert r == {"faltando": ["c"], "extras": ["x"]}
    assert divergencias({"a"}, {"a"}) == {"faltando": [], "extras": []}


def test_reprodutibilidade():
    assert reprodutivel(lambda e: sorted(e), [3, 1, 2]) is True
    contador = {"n": 0}

    def instavel(e):
        contador["n"] += 1
        return contador["n"]

    assert reprodutivel(instavel, None) is False


def test_taxa_exclui_esperado_falhar():
    casos = [(True, False), (True, False), (False, False), (False, True)]
    assert abs(taxa(casos) - 2 / 3) < 1e-9


def test_taxa_sem_casos_contaveis():
    assert taxa([]) == 0.0
    assert taxa([(False, True)]) == 0.0
`;

  TrilhaAula.registrar({
    id: 'm10-b9',
    titulo: 'Mini-projeto: as três perguntas respondidas',
    minutos: 45,
    resumo: 'Três peças do Capstone de uma vez (orchestration/, graph/ e metrics/, versões v4, v5 e v6) e uma prova que não é "está bonito": um eval que estava vermelho ficando verde, com graders de caminho e reprodutibilidade.',
    objetivo: 'Percorrer o laboratório guiado, montar a prova de que o mini-projeto funcionou com graders determinísticos e reconciliar relatório e gabarito sem fingir cobertura.',
    revisao: [
      { id: 'm10b9-prova', pergunta: 'Qual é a prova de que o mini-projeto funcionou?',
        opcoes: [
          opc('a', 'Um eval que estava vermelho (as perguntas estruturais) ficando verde, com graders de caminho e reprodutibilidade no CI', true, 'casos impossíveis passam com taxa documentada; reflexão vira confiança baixa declarada, não cobertura fingida.'),
          opc('b', 'Uma demo visual do grafo no navegador', false, 'bonito não é prova.'),
          opc('c', 'O número de nós e arestas extraídos', false, 'volume não mede resposta correta.')] },
      { id: 'm10b9-div', pergunta: 'O relatório diverge do gabarito. O que fazer?',
        opcoes: [
          opc('a', 'Reconciliar: investigar qual dos dois está errado e atualizar um deles', true, 'o laboratório pede relatório reconciliado com o gabarito, atualizando um dos dois quando divergem.'),
          opc('b', 'Ajustar o gabarito para o relatório sempre passar', false, 'enfraquece a medida.'),
          opc('c', 'Ignorar as divergências pequenas', false, 'divergência pequena pode ser o extrator errado.')] },
      { id: 'm10b9-grader', pergunta: 'Por que o grader de caminho é determinístico?',
        opcoes: [
          opc('a', 'Cada aresta citada na rota A para B para C é conferida contra o grafo, mecanicamente; é a citação estrutural verificável', true, 'não depende de juiz-LLM.'),
          opc('b', 'Um LLM lê a rota e dá nota', false, 'seria não determinístico.'),
          opc('c', 'Ele só conta quantas rotas há', false, 'não verifica a validade.')] },
      { id: 'm10b9-ordem', pergunta: 'Em que ordem o laboratório guiado percorre o módulo?',
        opcoes: [
          opc('a', 'Workflow e reducers (blocos 1 e 2); kill, HITL e grafo (3 a 6); métricas e memória (7 e 8); validação técnica com ruff, format, mypy e testes', true, 'cada etapa termina retomável; lint, tipos e testes são o oráculo do programa.'),
          opc('b', 'Validação técnica primeiro, depois tudo o mais', false, 'o checkpoint do módulo vem depois.'),
          opc('c', 'Só o bloco 9', false, 'o lab reúne a prática de todos os blocos.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Este bloco entrega três peças do Capstone de uma vez: <code>orchestration/</code>, <code>graph/</code> e <code>metrics/</code>. Elas correspondem às versões <strong>v4, v5 e v6</strong> da tabela de evolução do produto (<code>projeto-final.md</code>): grafo de conhecimento com métricas, workflow durável com checkpoint e HITL, e memória com fatos duráveis.</p>' +
          '<p>A prova de que funcionou não é "está bonito": é <strong>um eval que estava vermelho ficando verde</strong>.</p>' +
          '<h3>Leitura aplicada: eval vermelho ficando verde</h3>' +
          '<ul><li>Execução completa com thread estável e contagem de efeitos.</li>' +
          '<li>Distribuição de rotas, com as perguntas estruturais indo para a rota nova do grafo.</li>' +
          '<li>Casos "impossíveis" passando com taxa documentada; reflexão vira confiança baixa declarada, não fingimento.</li>' +
          '<li>Graders de caminho e de reprodutibilidade no CI.</li>' +
          '<li>Relatório reconciliado com o gabarito, atualizando um dos dois quando divergem.</li></ul>' +
          '<p>A aplicação ao Capstone é trilha opcional, com especificação própria.</p>' },
        { tipo: 'takeaway', html: 'A prova é um <mark>eval vermelho que fica verde</mark>, não uma demo bonita.' }
      ] },

      { rotulo: 'Laboratório guiado', blocos: [
        { tipo: 'texto', html:
          '<p>A prática do módulo é reunida e executável sem dependências externas: workflow com checkpoint em arquivo, grafo extraído por AST, memória temporal e métricas. Pode atravessar várias sessões, e cada etapa termina retomável. Lint, tipos e testes são oráculos do programa; o checkpoint vem depois, separado. LangGraph, AGE e modelos reais são trilha externa.</p>' +
          '<h3>Pré-requisitos e cópia de trabalho</h3>' +
          '<p>Exigido: Python 3.14 e <code>uv</code>. Nunca edite a referência em <code>modulos/M10-graph-engineering-saude-arquitetural/lab/</code>.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          'cd modulos/M10-graph-engineering-saude-arquitetural/lab',
          'python3 create_working_copy.py',
          'cd /tmp/m10-xxxx   # o caminho impresso',
          'uv sync --frozen'].join('\n') },
        { tipo: 'texto', html: '<p><strong>Resultado esperado:</strong> ambiente sincronizado. A cópia pode ser descartada e refeita; nada fora dela é tocado.</p>' },
        { tipo: 'abas', rotulo: 'Etapa do laboratório', itens: [
          { rotulo: '1 · Workflow e reducers', blocos: [
            { tipo: 'texto', html: '<p>Blocos 1 e 2.</p>' },
            { tipo: 'codigo', linguagem: 'bash', texto: 'uv run pytest -q tests/test_workflow.py -k "executa or thread or fanout"' },
            { tipo: 'texto', html: '<p><strong>Resultado esperado:</strong> checkpoint por passo, thread desconhecida sem herança, <code>add</code> somando e o default perdendo.</p>' }] },
          { rotulo: '2 · Kill, HITL e grafo', blocos: [
            { tipo: 'texto', html: '<p>Blocos 3 a 6. Rode o restante de <code>tests/test_workflow.py</code> e <code>tests/test_graph.py</code>.</p>' },
            { tipo: 'codigo', linguagem: 'bash', texto: 'uv run pytest -q tests/test_workflow.py tests/test_graph.py' },
            { tipo: 'texto', html: '<p><strong>Resultado esperado:</strong> efeito uma vez após kill, pausa retomada em outra instância, impacto com rota, mortos candidatos, híbrido com orçamento.</p>' }] },
          { rotulo: '3 · Métricas e memória', blocos: [
            { tipo: 'texto', html: '<p>Blocos 7 e 8. As métricas são opcionais (seção de saúde arquitetural do bloco 5).</p>' },
            { tipo: 'codigo', linguagem: 'bash', texto: 'uv run pytest -q tests/test_metrics.py' },
            { tipo: 'texto', html: '<p><strong>Resultado esperado:</strong> zona de dor apontada, ciclo detectado, A indefinido não inventado, validade com idempotência, 3 perguntas com evidência.</p>' }] },
          { rotulo: '4 · Validação técnica', blocos: [
            { tipo: 'codigo', linguagem: 'bash', texto: ['uv run ruff check .', 'uv run ruff format --check .', 'uv run mypy src tests', 'uv run pytest -q'].join('\n') },
            { tipo: 'texto', html: '<p><strong>Resultado esperado:</strong> tudo verde. Qualquer vermelho é defeito do programa.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Limpeza e retomada</h3>' +
          '<p>Apague a cópia se quiser. Para retomar, crie uma nova e volte à etapa: cada uma só precisa da cópia sincronizada. Rode os labs com <code>UV_PROJECT_ENVIRONMENT</code> fora da pasta do curso, ou apague a <code>.venv</code> depois.</p>' },
        { tipo: 'takeaway', html: 'Cada etapa é <mark>retomável</mark>; lint, tipos e testes são o <mark>oráculo</mark> do programa.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Um eval de brinquedo para ver a mecânica: 10 casos contáveis (4 conceituais e 6 estruturais) mais 2 casos de reflexão marcados <code>esperado_falhar</code>. Os números são do exemplo, <strong>não do laboratório</strong>.</p>' },
        { tipo: 'rode', id: 'b9-rode', titulo: 'Vermelho para verde', enunciado: 'Compare a rota só vetorial com a rota que usa o grafo para as perguntas estruturais.',
          prefixo: '$', entrada: 'python3 eval_m10.py --rota grafo', unidade: 'ms', terminalTitulo: 'eval de brinquedo (exemplo)',
          prever: { pergunta: 'Com a rota do grafo ligada, as 6 perguntas estruturais passam. O que acontece com os 2 casos de reflexão?', opcoes: [
            { id: 'a', texto: 'Passam também, porque o grafo resolve tudo', correta: false, porque: 'reflexão e DI por convenção são limites do parser.' },
            { id: 'b', texto: 'Continuam falhando, são declarados esperado_falhar com confiança baixa e ficam fora da taxa', correta: true, porque: 'cobertura fingida destrói a credibilidade do resto.' },
            { id: 'c', texto: 'Somem do eval', correta: false, porque: 'ocultar também é fingir.' }
          ] },
          etapas: [
            { id: 'antes', nome: 'Antes: só vetor', descricao: 'Vermelho', tom: 'response', ms: 1, linhas: [
              L('out', 'conceituais: 4/4 passam'),
              L('out', 'estruturais: 0/6 passam'),
              L('out', 'taxa = 4/10 = 0.40'),
              L('hint', 'as três perguntas continuam erradas')] },
            { id: 'depois', nome: 'Depois: rota do grafo', descricao: 'Verde', tom: 'request', ms: 1, linhas: [
              L('out', 'conceituais: 4/4 passam (rota de busca)'),
              L('out', 'estruturais: 6/6 passam (rota do grafo; grader de caminho valida cada rota)'),
              L('out', 'taxa = 10/10 = 1.00'),
              L('hint', 'reprodutível: 3 execuções, mesma saída')] },
            { id: 'ref', nome: 'Reflexão', descricao: 'Declarada', tom: 'ink', ms: 1, linhas: [
              L('out', 'esperado_falhar: 2 casos (uso por reflexão), fora da taxa'),
              L('hint', 'o produto diz "2 usos prováveis por reflexão", não finge cobertura total')] }
          ],
          tutorDepois: 'O eval vermelho ficando verde, com o limite declarado, é a prova do módulo.',
          callout: 'Você viu a prova: vermelho para verde com o limite declarado.' },
        { tipo: 'ordene', id: 'b9-ordene', titulo: 'A ordem do mini-projeto', obrigatorio: false,
          enunciado: 'Ordene as cinco entregas da leitura aplicada.',
          itens: [
            { id: 'rel', texto: 'Relatório reconciliado com o gabarito' },
            { id: 'graders', texto: 'Graders de caminho e reprodutibilidade rodando no CI' },
            { id: 'pipe', texto: 'Execução completa do pipeline, com thread estável e contagem de efeitos' },
            { id: 'casos', texto: 'Casos "impossíveis" virados, com taxa documentada' },
            { id: 'rota', texto: 'Rota do grafo ligada: perguntas estruturais vão para ela' }
          ],
          solucao: ['pipe', 'rota', 'casos', 'graders', 'rel'],
          dica: 'Primeiro o pipeline roda, depois a rota nova, depois os casos, e só então a medição e o relatório.',
          tutorDepois: 'O relatório final fecha a prova com o gabarito.',
          callout: 'Pipeline, rota, casos, graders, relatório.' },
        { tipo: 'takeaway', html: 'Reflexão é <mark>confiança baixa declarada</mark>, não cobertura fingida.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b9-python', titulo: 'Graders do mini-projeto', obrigatorio: false,
          enunciado: 'Implemente <code>caminho_valido</code> (cada aresta da rota existe, ao menos 2 nós), <code>divergencias</code> (faltando e extras), <code>reprodutivel</code> (n execuções, mesma saída) e <code>taxa</code> (casos <code>esperado_falhar</code> ficam fora).',
          codigo: codigoEval, testes: testesEval,
          dica: 'Rota: <code>zip(rota, rota[1:])</code> dá os pares consecutivos. Divergências: diferença de conjuntos nos dois sentidos, ordenada. Reprodutibilidade: conjunto dos <code>repr</code> das saídas com um só elemento. Taxa: filtre os contáveis antes de dividir.',
          solucao: solucaoEval,
          tutorDepois: 'Graders determinísticos substituem juiz-LLM para o que um teste decide. A taxa honesta exclui os casos que você já sabe que o parser não resolve, e os declara à parte.',
          callout: 'Os graders passaram nos testes, com borda e falha.' },
        { tipo: 'cenario', id: 'b9-cenario', titulo: 'O relatório diverge do gabarito', obrigatorio: false,
          enunciado: 'O relatório final lista 3 métodos como código morto que o gabarito não tem, e o gabarito lista 1 que o relatório não achou.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O que você faz primeiro?', opcoes: [
              { texto: 'Editar o gabarito até o relatório passar.', vai: 'f-trapaca', tom: 'ruim', consequencia: 'a medida deixou de medir.' },
              { texto: 'Investigar cada divergência para ver se o erro é do extrator, do gabarito ou do caso por reflexão.', vai: 'causa', tom: 'ok', consequencia: 'cada divergência vira um achado.' }
            ] },
            causa: { texto: 'Dois dos três extras são usados por reflexão; o terceiro é um erro real do extrator; o faltante era um gabarito antigo. O que registra?', opcoes: [
              { texto: 'Marcar os dois como candidatos de baixa confiança, corrigir o extrator e atualizar o gabarito.', vai: 'f-bom', tom: 'ok', consequencia: 'atualiza um dos dois onde divergem, e declara o limite.' },
              { texto: 'Declarar tudo "morto" com certeza.', vai: 'f-veredito', tom: 'ruim', consequencia: 'código morto é sempre candidato, nunca veredito.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Relatório reconciliado: erro do extrator corrigido, gabarito atualizado, reflexão declarada.' },
            'f-trapaca': { bom: false, texto: 'O verde não significa mais nada.' },
            'f-veredito': { bom: false, texto: 'O cliente apaga um método que a reflexão usa.' }
          },
          callout: 'Você reconciliou relatório e gabarito sem enfraquecer a medida.' },
        { tipo: 'escolha', id: 'b9-esc-prova', titulo: 'Confira: a prova',
          pergunta: 'Qual é a prova de que o mini-projeto funcionou?',
          opcoes: [
            { id: 'a', texto: 'Uma demo visual do grafo no navegador, com bom aspecto.', correta: false, porque: 'bonito não é prova.' },
            { id: 'b', texto: 'Um eval que estava vermelho (as perguntas estruturais) ficando verde, com graders de caminho e reprodutibilidade no CI.', correta: true, porque: 'mudança mensurável num eval que falhava; casos impossíveis com taxa documentada.' },
            { id: 'c', texto: 'O número de nós e arestas extraídos.', correta: false, porque: 'volume não é correção.' },
            { id: 'd', texto: 'Ausência de erros no log da última execução.', correta: false, porque: 'ausência de erro não prova resposta certa.' }
          ], tutorDepois: 'Reflexão vira confiança baixa declarada.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Fontes e versões</h3>' +
          '<table><thead><tr><th>Fonte</th><th>Uso</th><th>Tipo</th><th>Verificada em</th></tr></thead><tbody>' +
          '<tr><td>LangGraph docs (docs.langchain.com)</td><td>execução e checkpoint (blocos 2 a 4)</td><td>oficial</td><td>14/09/2026</td></tr>' +
          '<tr><td>Martin, Clean Architecture (métricas)</td><td>I/A/D e sequência principal (bloco 5)</td><td>canônica</td><td>14/09/2026</td></tr>' +
          '<tr><td>Apache AGE docs (age.apache.org)</td><td>grafo no Postgres (bloco 6)</td><td>oficial</td><td>14/09/2026</td></tr>' +
          '<tr><td>Microsoft, GraphRAG</td><td>local/global e custo (bloco 7)</td><td>fornecedor</td><td>14/09/2026</td></tr>' +
          '<tr><td>Python, módulo ast (docs.python.org)</td><td>extração determinística (bloco 5)</td><td>normativa</td><td>14/09/2026</td></tr>' +
          '</tbody></table>' +
          '<p>Versões de framework, extensão e modelo são informação de alto risco: revalidar em até 90 dias. O SQL de persistência exige PostgreSQL com AGE (Docker); sem ele, a execução real fica bloqueada, e por isso os exercícios desta trilha usam sqlite3 e motores mínimos locais.</p>' },
        { tipo: 'callout', tom: 'success', titulo: 'O essencial em 8 linhas', html:
          '<ul><li>O que o vetor nunca alcança é relação, e relação está entre os documentos, não dentro deles.</li>' +
          '<li>Grafo de execução dá durabilidade; grafo de conhecimento dá resposta. São ortogonais.</li>' +
          '<li>Reducer explícito em todo campo compartilhado, ou o paralelismo perde trabalho em silêncio.</li>' +
          '<li>Retomada é replay: nó idempotente, determinístico e pequeno o bastante para não doer.</li>' +
          '<li>O nó reexecuta desde o começo: nada de efeito colateral antes do interrupt.</li>' +
          '<li>O determinístico fica determinístico: o parser faz 95% do grafo por ~zero.</li>' +
          '<li>Métrica é instrumento, não veredito: declare a fronteira, mostre a tendência, respeite o julgamento humano.</li>' +
          '<li>Código morto é sempre <em>candidato</em>: a ressalva é o que faz o cliente confiar no resto.</li></ul>' },
        { tipo: 'takeaway', html: 'A <mark>ressalva</mark> honesta é o que faz o cliente <mark>confiar</mark> no resto.' }
      ] }
    ]
  });
})();
