/* M10 · Bloco 1: A dualidade, e por que aquelas três perguntas exigem grafo. Fonte: M10.html#b01. Saídas do rode vêm de execução real do mesmo código da solução. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoImpacto = `from collections import deque


def impacto(chamadas, alvo, prof):
    """chamadas: lista de (chamador, chamado). Devolve {fqn: distancia}
    com os chamadores transitivos de alvo, ate prof saltos."""
    quem_chama = {}
    for chamador, chamado in chamadas:
        quem_chama.setdefault(chamado, []).append(chamador)
    dist = {alvo: 0}
    fila = deque([alvo])
    # BFS reversa: parta do alvo, suba pelos chamadores, respeite prof
    # e nunca visite um no duas vezes (ciclos existem)
    dist.pop(alvo)
    return dist


def candidatos_mortos(chamadas, entradas, metodos):
    """Metodos que nenhum entry point alcanca (candidatos, nao veredito)."""
    chama = {}
    for chamador, chamado in chamadas:
        chama.setdefault(chamador, []).append(chamado)
    # DFS a partir das entradas, seguindo chamador -> chamado
    return []
`;
  var solucaoImpacto = `from collections import deque


def impacto(chamadas, alvo, prof):
    quem_chama = {}
    for chamador, chamado in chamadas:
        quem_chama.setdefault(chamado, []).append(chamador)
    dist = {alvo: 0}
    fila = deque([alvo])
    while fila:
        no = fila.popleft()
        if dist[no] >= prof:
            continue
        for c in quem_chama.get(no, []):
            if c not in dist:
                dist[c] = dist[no] + 1
                fila.append(c)
    dist.pop(alvo)
    return dist


def candidatos_mortos(chamadas, entradas, metodos):
    chama = {}
    for chamador, chamado in chamadas:
        chama.setdefault(chamador, []).append(chamado)
    vistos = set(entradas)
    pilha = list(entradas)
    while pilha:
        no = pilha.pop()
        for c in chama.get(no, []):
            if c not in vistos:
                vistos.add(c)
                pilha.append(c)
    return sorted(m for m in metodos if m not in vistos)
`;
  var testesImpacto = `G = [
    ("Tela.Pagar", "Pagamento.Processar"), ("Api.Fatura", "Fatura.Gerar"),
    ("Pagamento.Processar", "Juros.Calcular"), ("Pagamento.Processar", "Desconto.Aplicar"),
    ("Fatura.Gerar", "Juros.Calcular"), ("Fatura.Gerar", "Imposto.Somar"),
    ("Juros.Calcular", "Arredonda.Moeda"), ("Desconto.Aplicar", "Arredonda.Moeda"),
    ("Imposto.Somar", "Arredonda.Moeda"), ("Pagamento.Processar", "Util.Log"),
    ("Fatura.Gerar", "Util.Log"), ("Legado.Relatorio", "Juros.Calcular"),
    ("Legado.Relatorio", "Util.Log"),
]
METODOS = sorted({x for par in G for x in par})


def test_um_salto():
    assert impacto(G, "Juros.Calcular", 1) == {
        "Pagamento.Processar": 1, "Fatura.Gerar": 1, "Legado.Relatorio": 1}


def test_dois_saltos_com_distancia():
    r = impacto(G, "Juros.Calcular", 2)
    assert r["Tela.Pagar"] == 2 and r["Api.Fatura"] == 2 and len(r) == 5


def test_alvo_sem_chamadores():
    assert impacto(G, "Tela.Pagar", 3) == {}


def test_ciclo_termina():
    ciclo = [("a", "b"), ("b", "a")]
    assert impacto(ciclo, "a", 10) == {"b": 1}


def test_candidatos_mortos():
    assert candidatos_mortos(G, ["Tela.Pagar", "Api.Fatura"], METODOS) == ["Legado.Relatorio"]


def test_entrada_nao_e_morta():
    assert "Tela.Pagar" not in candidatos_mortos(G, ["Tela.Pagar", "Api.Fatura"], METODOS)
`;

  TrilhaAula.registrar({
    id: 'm10-b1',
    titulo: 'A dualidade: por que três perguntas exigem grafo',
    minutos: 30,
    resumo: 'Aumentar o k, rerankear e contextualizar não respondem "o que quebra se eu mudar este método?". A resposta está na relação entre documentos, a vários saltos: o problema é de representação, não de recuperação.',
    objetivo: 'Reescrever uma pergunta como travessia (partida, aresta, direção, profundidade), separar grafo de execução de grafo de conhecimento e saber quando grafo não é a ferramenta.',
    revisao: [
      { id: 'm10b1-repr', pergunta: 'Por que melhorar o RAG (mais k, rerank, contextualização) não resolve "o que quebra se eu mudar este método?"',
        opcoes: [
          opc('a', 'A resposta está na relação entre documentos, a vários saltos, e nenhum chunk a contém: é problema de representação', true, 'k traz mais chunks, não mais relações; rerank ordena o que já veio.'),
          opc('b', 'Falta um modelo de embeddings maior', false, 'um embedding melhor ainda devolve pedaços de texto isolados.'),
          opc('c', 'O chunking está grande demais', false, 'chunk menor continua sendo texto isolado, sem arestas.')] },
      { id: 'm10b1-dual', pergunta: 'Qual é a diferença entre grafo de execução e grafo de conhecimento?',
        opcoes: [
          opc('a', 'Execução: nós são passos e arestas são transições, escrito por você. Conhecimento: nós são entidades do domínio, extraído dos dados. São ortogonais', true, 'ter LangGraph não dá grafo de conhecimento, e ter Neo4j não dá orquestração.'),
          opc('b', 'São o mesmo grafo, com mais nós no de conhecimento', false, 'respondem perguntas diferentes: durabilidade e ponto de intervenção contra resposta que exige relação.'),
          opc('c', 'O de execução só existe dentro do Neo4j', false, 'os dois independem um do outro.')] },
      { id: 'm10b1-morto', pergunta: 'Como se define código morto numa travessia?',
        opcoes: [
          opc('a', 'Nós não alcançáveis a partir dos entry points (e o resultado é candidato, não veredito)', true, 'alcançabilidade (fecho transitivo) é a operação das três perguntas.'),
          opc('b', 'Métodos com menos de 5 linhas', false, 'tamanho não diz nada sobre alcançabilidade.'),
          opc('c', 'Métodos sem comentário', false, 'comentário não é aresta.')] },
      { id: 'm10b1-sql', pergunta: 'Pergunta: "quantos arquivos existem por linguagem?" Qual ferramenta?',
        opcoes: [
          opc('a', 'SQL: é uma agregação, nem grafo nem LLM', true, 'grafo é ruim em contar; relação rasa e conhecida também é JOIN.'),
          opc('b', 'Travessia de grafo', false, 'não há relação a percorrer.'),
          opc('c', 'GraphRAG global', false, 'caro e desnecessário para uma contagem.')] },
      { id: 'm10b1-grau', pergunta: 'In-degree e out-degree de um nó correspondem a quê na seção de saúde arquitetural?',
        opcoes: [
          opc('a', 'Acoplamento aferente (Ca) e eferente (Ce)', true, 'a métrica arquitetural é grau de vértice com outro nome.'),
          opc('b', 'Complexidade ciclomática e linhas de código', false, 'não vêm de grau de vértice.'),
          opc('c', 'Cobertura de testes e dívida técnica', false, 'não vêm do grafo de dependências.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Abra o seu <code>docs/tres-perguntas-para-o-grafo.md</code>. As perguntas provavelmente se parecem com estas:</p>' +
          '<ul><li>"O que quebra se eu alterar a assinatura deste método?"</li><li>"Quais telas dependem, direta ou indiretamente, desta tabela?"</li><li>"Que código está morto, sem nenhum caminho de chamada a partir de um entry point?"</li></ul>' +
          '<p>Elas têm a mesma forma: <strong>a resposta não está dentro de nenhum documento, está na relação entre documentos, e frequentemente a vários saltos de distância</strong>. Nenhum chunk contém "o método X é chamado indiretamente por 7 telas". Esse fato <em>emerge</em> de percorrer arestas.</p>' +
          '<p>Por isso nenhuma melhoria do M07 resolve. Aumentar o <code>k</code> traz mais chunks, não mais relações. <em>Reranking</em> ordena melhor o que já veio. Contextualização enriquece o chunk, mas ele continua sendo um pedaço de texto isolado. <strong>O problema não é de recuperação, é de representação</strong>: você guarda texto e pergunta sobre estrutura.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'O IDE já faz isso há vinte anos', html:
          '<p>"Localizar referências" e "hierarquia de chamadas" são travessias de grafo: símbolos como nós, referências como arestas. É por isso que renomear por refactoring é seguro e "buscar e substituir" não é. A onda de RAG fez todo mundo tratar código como texto. Código é texto <strong>e</strong> estrutura, e a estrutura é a parte que dá resposta exata.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Que ferramenta para que pergunta</h3>' +
          '<table><thead><tr><th>Tipo de pergunta</th><th>Estrutura da resposta</th><th>Ferramenta certa</th></tr></thead><tbody>' +
          '<tr><td>"Onde está a regra de cálculo de juros?"</td><td>está <em>em</em> um documento</td><td>busca (M07), vetorial ou léxica</td></tr>' +
          '<tr><td>"Como funciona a autenticação?"</td><td>está espalhada em alguns documentos</td><td>busca + síntese (M07 + M05)</td></tr>' +
          '<tr><td>"O que quebra se eu mudar este método?"</td><td><strong>conjunto de nós alcançáveis por travessia</strong></td><td><strong>grafo</strong> (este módulo)</td></tr>' +
          '<tr><td>"Qual a fronteira de menor acoplamento para extrair um microsserviço?"</td><td>propriedade da <em>topologia</em></td><td><strong>grafo + métrica</strong> (bloco 5)</td></tr>' +
          '<tr><td>"Quantos arquivos por linguagem?"</td><td>uma agregação</td><td>SQL, nem grafo nem LLM</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'Quando a resposta é uma <mark>relação a vários saltos</mark>, o defeito é de <mark>representação</mark>: mais k não cria arestas.' }
      ] },

      { rotulo: 'Vocabulário e duas disciplinas', blocos: [
        { tipo: 'texto', html:
          '<p>Teoria dos grafos é conteúdo de segundo ano que quase todo sênior atrofia. O subconjunto que importa aqui:</p>' +
          '<ul><li><strong>Grafo</strong>: conjunto de <em>nós</em> (vértices) e <em>arestas</em> que os ligam. É <strong>dirigido</strong> quando a aresta tem sentido (A chama B não é B chama A), o nosso caso sempre, e <strong>rotulado</strong> quando nós e arestas têm tipo (<code>Classe</code>, <code>Metodo</code>; <code>CHAMA</code>, <code>ACESSA</code>).</li>' +
          '<li><strong>Grau</strong> de um nó: quantas arestas o tocam. <em>In-degree</em> (quantos dependem dele) e <em>out-degree</em> (de quantos ele depende) são exatamente o acoplamento aferente e eferente do bloco 5.</li>' +
          '<li><strong>Travessia</strong>: <em>BFS</em> (largura: acha o caminho mais curto, bom para "quem chama diretamente") e <em>DFS</em> (profundidade: bom para "tudo que é alcançável"). O custo é O(V+E), então percorrer um grafo inteiro é barato.</li>' +
          '<li><strong>Alcançabilidade</strong> (fecho transitivo): nós atingíveis a partir de um. É a operação das suas três perguntas. Código morto são os nós <strong>não</strong> alcançáveis a partir dos entry points.</li>' +
          '<li><strong>DAG</strong>: grafo dirigido acíclico. Dependências deveriam formar um DAG; quando não formam, há <strong>ciclo</strong>, detectável mecanicamente (componentes fortemente conexos, uma linha em networkx).</li>' +
          '<li><strong>Componentes conexos</strong> e <strong>comunidades</strong>: agrupamentos naturais. O GraphRAG os usa para resumir (bloco 7) e eles sugerem fronteiras de microsserviço (bloco 5).</li></ul>' +
          '<p>Nada disso é novo. O novo é aplicar como <em>fonte de contexto para um LLM</em>, e não só como análise estática isolada.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>As duas disciplinas, lado a lado</h3>' +
          '<table><thead><tr><th></th><th>Grafo de execução (LangGraph)</th><th>Grafo de conhecimento (AGE/Neo4j)</th></tr></thead><tbody>' +
          '<tr><td>Os nós são</td><td>passos de computação (funções)</td><td>entidades do domínio (classe, método, tabela)</td></tr>' +
          '<tr><td>As arestas são</td><td>transições de controle</td><td>relações do mundo (chama, acessa, herda)</td></tr>' +
          '<tr><td>O grafo é</td><td>escrito por você, uma vez</td><td>extraído dos dados, e cresce</td></tr>' +
          '<tr><td>Percorre-se</td><td>uma vez por execução, do início ao fim</td><td>a cada consulta, de um ponto qualquer</td></tr>' +
          '<tr><td>O que se ganha</td><td>previsibilidade, retomada, ponto de intervenção</td><td>respostas que exigem relação</td></tr>' +
          '<tr><td>Analogia</td><td>máquina de estados / saga</td><td>grafo de símbolos do IDE</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>A confusão frequente é achar que "usar LangGraph" dá grafo de conhecimento, ou que "ter um Neo4j" dá orquestração. São <strong>ortogonais</strong>: dá para ter um sem o outro, e o Capstone precisa dos dois por razões diferentes.</p>' +
          '<h3>Onde grafo não é a resposta</h3>' +
          '<ul><li><strong>Pergunta conceitual</strong> ("como funciona X?"): busca híbrida. Grafo não tem semântica.</li>' +
          '<li><strong>Agregação</strong> ("quantos", "qual a média"): SQL. Grafo é ruim em contar.</li>' +
          '<li><strong>Relação rasa e conhecida</strong> ("os itens deste pedido"): chave estrangeira e <code>JOIN</code>. Grafo compensa quando a profundidade é <em>variável</em> ou <em>desconhecida</em>, e é aí que o SQL vira CTE recursiva ilegível.</li>' +
          '<li><strong>Corpus sem estrutura</strong> (texto solto, transcrições): extrair grafo por LLM é caro e ruidoso (bloco 5). Código é o caso feliz, porque a estrutura já está lá, explícita e determinística.</li></ul>' },
        { tipo: 'takeaway', html: 'LangGraph e grafo de conhecimento são <mark>ortogonais</mark>; grafo compensa na <mark>profundidade variável</mark>, não na contagem nem no conceito.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>O grafo abaixo é o mesmo do simulador do módulo: dez métodos, treze arestas <code>CHAMA</code>, dois entry points (<code>Tela.Pagar</code> e <code>Api.Fatura</code>). Rode as três perguntas como travessia. A saída vem de executar o código da solução do exercício da próxima aba.</p>' },
        { tipo: 'rode', id: 'b1-rode', titulo: 'Três perguntas, três travessias', enunciado: 'Escolha a previsão, aperte Enter e clique em cada etapa para ver a saída.',
          prefixo: '$', entrada: 'python3 travessia.py', unidade: 'ms', terminalTitulo: 'grafo de chamadas de exemplo',
          prever: { pergunta: 'Mudar Juros.Calcular: quantos métodos podem ser afetados a até 2 saltos?', opcoes: [
            { id: 'a', texto: '3, só os chamadores diretos', correta: false, porque: 'o segundo salto sobe até quem chama os chamadores.' },
            { id: 'b', texto: '5: três diretos e dois a dois saltos', correta: true, porque: 'Pagamento.Processar, Fatura.Gerar e Legado.Relatorio a 1 salto; Tela.Pagar e Api.Fatura a 2.' },
            { id: 'c', texto: '9, o grafo inteiro menos o alvo', correta: false, porque: 'o limite de profundidade existe justamente para a vizinhança não virar o repositório.' }
          ] },
          etapas: [
            { id: 'um', nome: 'Impacto, 1 salto', descricao: 'Chamadores diretos', tom: 'dns', ms: 2, linhas: [
              L('cmd', 'impacto(G, "Juros.Calcular", 1)'),
              L('out', "{'Pagamento.Processar': 1, 'Fatura.Gerar': 1, 'Legado.Relatorio': 1}"),
              L('hint', 'BFS reversa: parte do alvo e sobe pelas arestas CHAMA')] },
            { id: 'dois', nome: 'Impacto, 2 saltos', descricao: 'Chamadores transitivos', tom: 'tcp', ms: 3, linhas: [
              L('cmd', 'impacto(G, "Juros.Calcular", 2)'),
              L('out', "{'Pagamento.Processar': 1, 'Fatura.Gerar': 1, 'Legado.Relatorio': 1, 'Tela.Pagar': 2, 'Api.Fatura': 2}"),
              L('hint', '5 métodos; a distância é o número de saltos')] },
            { id: 'morto', nome: 'Código morto', descricao: 'Não alcançável dos entry points', tom: 'request', ms: 2, linhas: [
              L('cmd', 'candidatos_mortos(G, ["Tela.Pagar", "Api.Fatura"], METODOS)'),
              L('out', "['Legado.Relatorio']"),
              L('hint', 'candidato, não veredito: reflexão e DI por convenção geram falso positivo')] },
            { id: 'sql', nome: 'Agregação', descricao: 'Não é pergunta de grafo', tom: 'response', ms: 1, linhas: [
              L('cmd', 'SELECT linguagem, COUNT(*) FROM arquivos GROUP BY linguagem;'),
              L('info', 'contagem por categoria: SQL, sem travessia e sem LLM'),
              L('hint', 'grafo é ruim em contar')] }
          ],
          tutorDepois: 'Impacto e código morto são o mesmo mecanismo (alcançabilidade) em direções opostas: um sobe pelos chamadores, o outro desce a partir das entradas. A contagem por linguagem continua sendo SQL.',
          callout: 'Você viu as três perguntas virarem travessias e a quarta continuar em SQL.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Leitura aplicada', html:
          '<p>No laboratório guiado você reescreve as três perguntas como travessias e prova o custo da alternativa em SQL. O percurso: nó de partida, tipos de aresta, direção, profundidade e forma da resposta por pergunta (80% da modelagem); a CTE recursiva de 20+ linhas como argumento documentado; e a distribuição busca/grafo/SQL/híbrido que especifica o roteador.</p>' },
        { tipo: 'takeaway', html: 'Impacto e código morto são <mark>alcançabilidade</mark> em sentidos opostos; <mark>candidato</mark>, nunca veredito.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'complete', id: 'b1-plano', titulo: 'Pergunta como travessia', obrigatorio: false,
          enunciado: 'Reescreva "O que quebra se eu alterar a assinatura deste método?" como plano de travessia. Escolha a peça certa em cada lacuna.',
          linguagem: 'python',
          partes: [
            'pergunta = "O que quebra se eu alterar a assinatura deste método?"\nplano = {\n    "partida": ',
            { lacuna: 'partida', opcoes: ['"o método alvo (um nó Metodo)"', '"todos os arquivos do repositório"', '"o chunk mais parecido com a pergunta"'], correta: '"o método alvo (um nó Metodo)"' },
            ',\n    "aresta": ',
            { lacuna: 'aresta', opcoes: ['"CHAMA"', '"CONTEM"', '"DECLARA"'], correta: '"CHAMA"' },
            ',\n    "direcao": ',
            { lacuna: 'direcao', opcoes: ['"inversa: de quem chama para quem é chamado"', '"a favor da seta: do alvo para o que ele chama"', '"não importa"'], correta: '"inversa: de quem chama para quem é chamado"' },
            ',\n    "profundidade": ',
            { lacuna: 'prof', opcoes: ['"limitada (por exemplo, 4 saltos)"', '"ilimitada, sempre"', '"zero: só o nó"'], correta: '"limitada (por exemplo, 4 saltos)"' },
            ',\n    "resposta": ',
            { lacuna: 'resp', opcoes: ['"conjunto de métodos com distância"', '"um parágrafo gerado pelo modelo"', '"um número só"'], correta: '"conjunto de métodos com distância"' },
            ',\n}'
          ],
          explicacao: 'Quem muda é quem <em>chama</em> o alvo, então a travessia vai contra a seta de <code>CHAMA</code>. A profundidade fica limitada porque um método muito chamado, sem limite, devolve o repositório inteiro. A resposta é um conjunto com distância, que dá para citar.' },
        { tipo: 'python', id: 'b1-python', titulo: 'Impacto e código morto', obrigatorio: false,
          enunciado: 'Implemente <code>impacto(chamadas, alvo, prof)</code>, uma BFS reversa com limite de profundidade que devolve <code>{fqn: distância}</code>, e <code>candidatos_mortos(chamadas, entradas, metodos)</code>, que devolve ordenados os métodos que nenhum entry point alcança.',
          codigo: codigoImpacto, testes: testesImpacto,
          dica: 'Em <code>impacto</code>: <code>while fila</code>, pare de expandir quando <code>dist[no] &gt;= prof</code> e só enfileire quem ainda não está em <code>dist</code>. Em <code>candidatos_mortos</code>: pilha começando nas entradas, conjunto de vistos, seguindo <code>chama[no]</code>.',
          solucao: solucaoImpacto,
          tutorDepois: 'O conjunto de vistos é o que impede o ciclo de travar a travessia; o limite de profundidade é o que impede o hub de devolver o repositório.',
          callout: 'Travessia com limite e anti-ciclo passou nos testes.' },
        { tipo: 'escolha', id: 'b1-esc-rag', titulo: 'Confira: o k não resolve',
          pergunta: 'O time dobra o <code>k</code> do RAG e adiciona reranking, mas "quais telas dependem desta tabela?" continua errando. Qual é o diagnóstico?',
          opcoes: [
            { id: 'a', texto: 'Falta ajustar o tamanho do chunk.', correta: false, porque: 'chunk menor ainda é texto isolado.' },
            { id: 'b', texto: 'Problema de representação: a resposta está nas relações a vários saltos, e nenhum chunk a contém.', correta: true, porque: 'k traz mais chunks, não mais relações; a estrutura precisa ser guardada como grafo.' },
            { id: 'c', texto: 'O reranker é fraco; um maior resolveria.', correta: false, porque: 'rerank só ordena o que já veio.' },
            { id: 'd', texto: 'É uma agregação: basta um <code>GROUP BY</code>.', correta: false, porque: 'dependência transitiva não é contagem.' }
          ], tutorDepois: 'Antes de otimizar a recuperação, pergunte se a resposta está em um documento ou entre eles.' },
        { tipo: 'escolha', id: 'b1-esc-ferramenta', titulo: 'Confira: grafo ou não',
          pergunta: 'Qual destas perguntas <strong>exige</strong> grafo, e não busca vetorial nem SQL?',
          opcoes: [
            { id: 'a', texto: 'Onde está a regra de cálculo de juros?', correta: false, porque: 'está em um documento: busca.' },
            { id: 'b', texto: 'Quais telas dependem, direta ou indiretamente, desta tabela?', correta: true, porque: 'é o conjunto de nós alcançáveis por travessia, a profundidade variável.' },
            { id: 'c', texto: 'Como funciona a autenticação?', correta: false, porque: 'conceitual: busca mais síntese.' },
            { id: 'd', texto: 'Quantos arquivos existem por linguagem?', correta: false, porque: 'agregação: SQL.' }
          ], tutorDepois: 'Profundidade variável ou desconhecida é o sinal.' },
        { tipo: 'takeaway', html: 'Ferramenta pela <mark>forma da resposta</mark>: documento, relação ou agregação.' }
      ] }
    ]
  });
})();
