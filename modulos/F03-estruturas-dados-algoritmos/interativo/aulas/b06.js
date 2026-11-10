/* F03 · Bloco 6: Grafos. Fonte: F03.html#b06. Saídas: execução real do laboratório em 11/10/2026 (CPython 3.14.7). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var cabeca = [
    'import heapq',
    'from collections import deque',
    '',
    '',
    'def reconstruir(pai, destino):',
    '    caminho = []',
    '    no = destino',
    '    while no is not None:',
    '        caminho.append(no)',
    '        no = pai[no]',
    '    return caminho[::-1]',
    '',
    ''].join('\n');
  var bfsIni = [
    'def bfs_caminho(g, inicio, fim):',
    '    """Menor caminho em arestas. Devolve (caminho ou None, nós enfileirados)."""',
    '    pai = {inicio: None}',
    '    visto = set()',
    '    fila = deque([inicio])',
    '    enfileirados = 1',
    '    while fila:',
    '        no = fila.popleft()',
    '        # CORRIJA: marque como visto ao ENFILEIRAR, não ao desenfileirar',
    '        if no in visto:',
    '            continue',
    '        visto.add(no)',
    '        if no == fim:',
    '            return reconstruir(pai, fim), enfileirados',
    '        for viz in g.get(no, []):',
    '            if viz not in visto:',
    '                pai.setdefault(viz, no)',
    '                fila.append(viz)',
    '                enfileirados += 1',
    '    return None, enfileirados',
    '',
    ''].join('\n');
  var bfsSol = [
    'def bfs_caminho(g, inicio, fim):',
    '    pai = {inicio: None}',
    '    fila = deque([inicio])',
    '    enfileirados = 1',
    '    while fila:',
    '        no = fila.popleft()',
    '        if no == fim:',
    '            return reconstruir(pai, fim), enfileirados',
    '        for viz in g.get(no, []):',
    '            if viz not in pai:',
    '                pai[viz] = no',
    '                fila.append(viz)',
    '                enfileirados += 1',
    '    return None, enfileirados',
    '',
    ''].join('\n');
  var kahnComum = [
    'def _ciclo(deps, restantes):',
    '    """Um ciclo concreto entre os nós que sobraram: u -> v quer dizer "u depende de v"."""',
    '    no = sorted(restantes)[0]',
    '    trilha = [no]',
    '    while True:',
    '        no = sorted(p for p in deps[no] if p in restantes)[0]',
    '        if no in trilha:',
    '            return "ciclo: " + " -> ".join(trilha[trilha.index(no):] + [no])',
    '        trilha.append(no)',
    '',
    '',
    'def ordem_topologica(deps):',
    '    """deps[n] = pré-requisitos de n. Ordem de build (desempate alfabético) ou ValueError com um ciclo."""',
    '    falta = {n: len(set(p)) for n, p in deps.items()}',
    '    dependentes = {n: [] for n in deps}',
    '    for n, ps in deps.items():',
    '        for p in set(ps):',
    '            dependentes[p].append(n)',
    '    ordem = []',
    '    fila = sorted(n for n in deps if falta[n] == 0)',
    '    while fila:',
    '        no = fila.pop(0)',
    '        ordem.append(no)',
    '___LACUNA___',
    '    if len(ordem) < len(deps):',
    '        raise ValueError(_ciclo(deps, set(deps) - set(ordem)))',
    '    return ordem',
    '',
    ''].join('\n');
  var kahnIni = kahnComum.replace('___LACUNA___', '        # CORRIJA: decremente `falta` dos dependentes de `no`; quem chegar a 0 entra na fila (ordenada)');
  var kahnSol = kahnComum.replace('___LACUNA___', ['        for d in dependentes[no]:', '            falta[d] -= 1', '            if falta[d] == 0:', '                fila.append(d)', '                fila.sort()'].join('\n'));
  var dijComum = [
    'def dijkstra(g, origem):',
    '    """g[u] = [(v, peso)]. Devolve (dist, pai). Pesos negativos: ValueError."""',
    '    dist = {origem: 0.0}',
    '    pai = {origem: None}',
    '    heap = [(0.0, 0, origem)]',
    '    contador = 1                      # desempate: o heap nunca compara dois nós',
    '    while heap:',
    '        d, _, u = heapq.heappop(heap)',
    '        if d > dist[u]:',
    '            continue                  # entrada obsoleta (remoção preguiçosa)',
    '        for v, w in g.get(u, []):',
    '            if w < 0:',
    '                raise ValueError("peso negativo: use Bellman-Ford")',
    '            nd = d + w',
    '            # CORRIJA: relaxe quando o novo caminho for MELHOR que o conhecido',
    '            if ___COND___:',
    '                dist[v] = nd',
    '                pai[v] = u',
    '                heapq.heappush(heap, (nd, contador, v))',
    '                contador += 1',
    '    return dist, pai',
    ''].join('\n');
  var dijIni = dijComum.replace('___COND___', 'v not in dist');
  var dijSol = dijComum.replace('___COND___', 'v not in dist or nd < dist[v]').replace('            # CORRIJA: relaxe quando o novo caminho for MELHOR que o conhecido\n', '');
  var testes = [
    'G = {"A": ["B", "C"], "B": ["D"], "C": ["D", "E"], "D": ["F"], "E": [], "F": []}',
    'W = {"A": [("B", 4), ("C", 2)], "C": [("B", 1)], "B": [("D", 5)], "D": []}',
    '',
    '',
    'def test_bfs_menor_caminho_em_arestas():',
    '    assert bfs_caminho(G, "A", "F")[0] == ["A", "B", "D", "F"]',
    '    assert bfs_caminho(G, "A", "A")[0] == ["A"]',
    '    assert bfs_caminho(G, "E", "A")[0] is None',
    '',
    '',
    'def test_bfs_enfileira_cada_no_uma_vez():',
    '    caminho, enf = bfs_caminho(G, "A", "F")',
    '    assert enf == 6',
    '',
    '',
    'def test_topologica_ordem_de_build():',
    '    deps = {"core": [], "lib": ["core"], "util": ["core"], "app": ["lib", "util"], "tests": ["app"]}',
    '    assert ordem_topologica(deps) == ["core", "lib", "util", "app", "tests"]',
    '',
    '',
    'def test_topologica_ciclo_concreto():',
    '    deps = {"core": ["tests"], "lib": ["core"], "app": ["lib"], "tests": ["app"], "x": []}',
    '    try:',
    '        ordem_topologica(deps)',
    '    except ValueError as e:',
    '        nos = str(e).replace("ciclo: ", "").split(" -> ")',
    '        assert nos[0] == nos[-1] and len(nos) >= 3',
    '        assert all(b in deps[a] for a, b in zip(nos, nos[1:]))',
    '        return',
    '    assert False, "deveria detectar o ciclo"',
    '',
    '',
    'def test_dijkstra_caminho_e_distancias():',
    '    dist, pai = dijkstra(W, "A")',
    '    assert dist == {"A": 0.0, "B": 3.0, "C": 2.0, "D": 8.0}',
    '    assert reconstruir(pai, "D") == ["A", "C", "B", "D"]',
    '',
    '',
    'def test_dijkstra_inalcancavel_e_negativo():',
    '    dist, _ = dijkstra({"A": [("B", 1)], "B": [], "Z": []}, "A")',
    '    assert "Z" not in dist',
    '    try:',
    '        dijkstra({"A": [("B", -1)], "B": []}, "A")',
    '    except ValueError:',
    '        return',
    '    assert False, "peso negativo deve ser rejeitado"',
    ''].join('\n');
  var codigo = cabeca + bfsIni + kahnIni + '\n' + dijIni;
  var solucao = cabeca + bfsSol + kahnSol + '\n' + dijSol;

  TrilhaAula.registrar({
    id: 'f03-b6',
    titulo: 'Grafos: representações, BFS, DFS, ordenação topológica e Dijkstra',
    minutos: 55,
    resumo: 'Grafo é a forma de dizer "coisas e relações": dependências de pacotes, chamadas entre funções, passos de um workflow de agente. Muitos problemas ficam simples depois da modelagem.',
    objetivo: 'Modelar um problema como G = (V, E) e medir o custo em V e E; escolher entre BFS, DFS, Kahn e Dijkstra; e implementar BFS, ordenação topológica com ciclo concreto e Dijkstra com heap.',
    revisao: [
      { id: 'f03b6-bfs', pergunta: 'Na BFS, onde marcar o nó como visitado, e por quê?',
        opcoes: [
          opc('a', 'Ao enfileirar: dois vizinhos podem descobrir o mesmo nó antes de ele sair da fila; cada nó entra uma vez, O(V + E)', true, 'marcar só na saída reprocessa nós e pode explodir o custo em grafos densos.'),
          opc('b', 'Só ao desenfileirar: o resultado é idêntico', false, 'o custo e as distâncias podem piorar.'),
          opc('c', 'Não é preciso marcar em grafo não ponderado', false, 'sem marca, ciclos fazem o laço não terminar.')] },
      { id: 'f03b6-dfs', pergunta: 'Por que DFS recursiva é perigosa em Python, e qual a alternativa?',
        opcoes: [
          opc('a', 'A profundidade da recursão é o maior caminho e o limite padrão é ≈1000; use DFS iterativa com pilha explícita (marca ao desempilhar)', true, 'DFS iterativa marca ao desempilhar, aceitando duplicatas na pilha; marcar ao empilhar quebra a ordem de término.'),
          opc('b', 'Ela é sempre mais lenta que a BFS', false, 'as duas são O(V + E).'),
          opc('c', 'Ela não detecta ciclos', false, 'detecta, com cores ou tempos de entrada e saída.')] },
      { id: 'f03b6-kahn', pergunta: 'Como o algoritmo de Kahn detecta um ciclo, e o que uma boa mensagem deve conter?',
        opcoes: [
          opc('a', 'Se ao fim sobraram nós sem processar, há ciclo; a mensagem deve trazer um ciclo concreto entre os restantes', true, 'seguir de cada restante um pré-requisito que também restou tem que repetir um nó. "Remova a dependência de core para tests" é acionável.'),
          opc('b', 'Detecta quando a fila fica vazia no início', false, 'fila inicial vazia é só um caso.'),
          opc('c', 'Não detecta; é preciso uma DFS à parte', false, 'Kahn detecta pelas sobras.')] },
      { id: 'f03b6-dijkstra', pergunta: 'O que Dijkstra exige, e o que acontece com um peso negativo?',
        opcoes: [
          opc('a', 'Pesos não negativos; com um negativo, uma distância já fixada poderia melhorar depois e o resultado pode estar errado (use Bellman–Ford, O(V·E))', true, 'custo com heap binário: O((V + E) log V); remoção preguiçosa no lugar de "diminuir chave".'),
          opc('b', 'Grafo sem ciclos; com negativo, só fica mais lento', false, 'ciclos são permitidos; o requisito é o peso.'),
          opc('c', 'Grafo não direcionado; com negativo, entra em recursão infinita', false, 'funciona em direcionados e não usa recursão.')] },
      { id: 'f03b6-repr', pergunta: 'Para 1 milhão de nós com 5 arestas cada, qual representação e por quê?',
        opcoes: [
          opc('a', 'Lista de adjacência, O(V + E) = ~5 milhões de entradas; a matriz teria um trilhão de células', true, 'grafos esparsos (E ≈ V) são o caso comum; para grafos numéricos grandes, matrizes esparsas (SciPy CSR) ou bibliotecas.'),
          opc('b', 'Matriz de adjacência, porque a aresta é O(1)', false, 'O(V²) de memória é inviável.'),
          opc('c', 'Lista de arestas, porque vizinhos são O(1)', false, 'vizinhos numa lista de arestas custam O(E).')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Um grafo G = (V, E) tem vértices (nós) e arestas (pares de nós), que podem ser <em>direcionadas</em> ou não, e <em>ponderadas</em>. Um <em>caminho</em> é uma sequência de arestas; um <em>ciclo</em> é um caminho que volta ao início; um <strong>DAG</strong> é um grafo direcionado sem ciclos. Mede-se o custo em função de <strong>V e E</strong>, nunca de "n". O grafo é <em>esparso</em> quando E ≈ V (redes viárias, dependências) e <em>denso</em> quando E ≈ V². Como <em>usar</em> grafos para agentes com estado, checkpoint e GraphRAG está no M10, que assume este bloco.</p>' },
        { tipo: 'abas', rotulo: 'Representação', itens: [
          { rotulo: 'Lista de adjacência', blocos: [{ tipo: 'texto', html: '<ul><li>Espaço O(V + E)</li><li>Vizinhos de <em>u</em>: O(grau de u)</li><li>Existe a aresta (u, v)? O(grau de u), ou O(1) com set</li><li>Padrão para grafos esparsos; o <code>Graph</code> do lab é um <code>dict</code> de listas</li></ul>' }] },
          { rotulo: 'Matriz de adjacência', blocos: [{ tipo: 'texto', html: '<ul><li>Espaço O(V²)</li><li>Existe a aresta (u, v)? O(1)</li><li>Vizinhos de <em>u</em>: O(V), varre uma linha</li><li>Vale para grafos densos, V pequeno ou álgebra linear</li></ul>' }] },
          { rotulo: 'Lista de arestas', blocos: [{ tipo: 'texto', html: '<ul><li>Espaço O(E)</li><li>Fácil de ordenar por peso (Kruskal) e boa para entrada e saída</li><li>Vizinhos de <em>u</em>: O(E)</li></ul>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>BFS e DFS</h3>' +
          '<p><strong>BFS</strong> (busca em largura) usa uma fila e visita tudo a distância 1, depois 2, depois 3: O(V + E). Em grafo não ponderado, descobre cada nó pelo caminho com <strong>menos arestas</strong>; guardando o predecessor de cada nó, reconstrói-se o caminho. Aplicações: menor número de saltos, distância em redes, propagação por camadas, BFS multi-origem.</p>' +
          '<p><strong>DFS</strong> (busca em profundidade) usa uma pilha (explícita ou de chamadas), também O(V + E). Não dá caminhos mais curtos, mas dá <em>estrutura</em>: tempos de entrada e saída respondem a ciclos, componentes, pontes e articulações, e a ordem de saída invertida é uma ordenação topológica. A versão recursiva é a mais legível e a mais perigosa: a profundidade é o maior caminho e o limite padrão é 1000 chamadas. Em produção, DFS iterativa com pilha explícita.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: onde marcar "visitado"', html:
          '<p>Em BFS, marque ao <strong>enfileirar</strong> (uma entrada por nó, garante o caminho mais curto). Na DFS iterativa com pilha, a forma simples marca ao <strong>desempilhar</strong>, aceitando duplicatas na pilha (até O(E) entradas). Marcar ao empilhar na DFS muda a ordem de visita e estraga a ordem de término, base do topológico. Copiar um código para o outro quebra.</p>' },
        { tipo: 'takeaway', html: 'Meça em <mark>V e E</mark>; BFS dá o menor número de <mark>arestas</mark>; DFS dá <mark>estrutura</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Ordenação topológica e Dijkstra</h3>' +
          '<p>Em um DAG, a <strong>ordenação topológica</strong> coloca cada nó depois de todos os seus pré-requisitos: "em que ordem compilo, instalo, executo?", a espinha de Airflow, Make, Bazel e de um agente com dependências entre etapas. Só existe se <strong>não há ciclo</strong>. Algoritmo de Kahn: calcule quantos pré-requisitos faltam para cada nó; enfileire os que têm zero; ao processar um nó, decremente os dependentes e enfileire quem chegou a zero; se sobraram nós, há ciclo. O(V + E).</p>' +
          '<p><strong>Dijkstra</strong> mantém a melhor distância conhecida de cada nó e, a cada passo, <em>fixa</em> o nó pendente de menor distância (via heap) e relaxa seus vizinhos: se <code>dist[u] + w &lt; dist[v]</code>, atualiza. Como <code>heapq</code> não tem "diminuir chave", usa remoção preguiçosa (bloco 4), e o contador desempata para o heap nunca comparar dois nós. Com pesos negativos: Bellman–Ford, O(V·E); todos os pares: Floyd–Warshall, O(V³); bom palpite de direção: A*.</p>' },
        { tipo: 'rode', id: 'b6-demo', titulo: 'Ordem de build, ciclo e menor caminho', prefixo: '$', entrada: 'uv run python -m algos.demo graph', unidade: 'x', terminalTitulo: 'saída real do laboratório',
          enunciado: 'A saída do demo de grafos: a ordem de build, o erro de ciclo e o Dijkstra no grafo ponderado.',
          prever: { pergunta: 'A aresta direta A–B custa 4, e A→C→B custa 2 + 1. Qual caminho o Dijkstra devolve de A a D, e o que a BFS escolheria?', opcoes: [
            { id: 'a', texto: 'Dijkstra: A, B, D; BFS: A, C, B, D', correta: false, porque: 'está invertido: o caminho com menos arestas é o direto, não o de menor custo.' },
            { id: 'b', texto: 'Dijkstra: A, C, B, D (custo 8); a BFS escolheria o caminho com menos arestas (A, B, D) e erraria o custo', correta: true, porque: 'BFS conta arestas, não pesos; com pesos, o menor custo exige Dijkstra.' },
            { id: 'c', texto: 'Os dois devolvem o mesmo caminho', correta: false, porque: 'só coincidem quando os pesos são todos iguais.' }
          ] },
          etapas: [
            { id: 'topo', nome: 'Ordem de build e ciclo', descricao: 'Kahn', tom: 'request', ms: 5, linhas: [
              L('out', "build order: ['core', 'lib', 'util', 'app', 'tests']"),
              L('out', 'error: dependency cycle: app -> tests -> core -> lib -> app'),
              L('hint', 'a mensagem traz um ciclo concreto: cada nó que sobrou tem um pré-requisito que também sobrou')] },
            { id: 'dij', nome: 'Dijkstra', descricao: 'menor custo com pesos', tom: 'response', ms: 8, linhas: [
              L('out', "distances from A: {'A': 0.0, 'B': 3.0, 'C': 2.0, 'D': 8.0}"),
              L('out', "path A -> D: ['A', 'C', 'B', 'D']"),
              L('hint', 'o lab rejeita pesos negativos com ValueError: falhar alto é melhor que devolver um número plausível e errado')] }
          ],
          tutorDepois: 'Mais de uma ordem topológica costuma ser válida; desempate por nome dá determinismo, útil para reproduzir builds.',
          callout: 'Você viu a ordem de build, o ciclo concreto e o caminho de menor custo.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Escolha do algoritmo</h3><table><thead><tr><th>Pergunta</th><th>Algoritmo</th><th>Custo</th></tr></thead><tbody>' +
          '<tr><td>menor número de saltos</td><td>BFS</td><td>O(V + E)</td></tr>' +
          '<tr><td>está conectado? quantos componentes?</td><td>BFS/DFS (ou union-find)</td><td>O(V + E)</td></tr>' +
          '<tr><td>há ciclo? qual ordem respeita dependências?</td><td>topológica (Kahn/DFS)</td><td>O(V + E)</td></tr>' +
          '<tr><td>menor custo, pesos ≥ 0</td><td>Dijkstra</td><td>O((V + E) log V)</td></tr>' +
          '<tr><td>menor custo, pesos negativos</td><td>Bellman–Ford</td><td>O(V·E)</td></tr>' +
          '<tr><td>conectar tudo com custo mínimo</td><td>árvore geradora mínima (Kruskal/Prim)</td><td>O(E log V)</td></tr>' +
          '<tr><td>relevância por estrutura de links</td><td>PageRank (iteração de potência)</td><td>O(E) por iteração</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'Kahn devolve a <mark>ordem</mark> ou um <mark>ciclo concreto</mark>; Dijkstra exige <mark>pesos não negativos</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b6-python', titulo: 'BFS, Kahn e Dijkstra: três correções', obrigatorio: false,
          enunciado: 'Três defeitos marcados com <code>CORRIJA</code>: a BFS marca o nó ao desenfileirar (o nó entra na fila várias vezes), o Kahn não decrementa os dependentes e o Dijkstra só relaxa na primeira descoberta do nó.',
          codigo: codigo, testes: testes,
          dica: 'BFS: use <code>pai</code> como conjunto de vistos (<code>if viz not in pai: pai[viz] = no</code>). Kahn: para cada <code>d</code> em <code>dependentes[no]</code>, <code>falta[d] -= 1</code>; se zerou, entre na fila e reordene. Dijkstra: <code>v not in dist or nd &lt; dist[v]</code>.',
          solucao: solucao,
          tutorDepois: 'O primeiro teste da BFS conta nós enfileirados: é o controle negativo da marca no lugar errado.',
          callout: 'BFS enfileirou cada nó uma vez, Kahn devolveu ordem e ciclo concreto, e Dijkstra achou o caminho de menor custo.' },
        { tipo: 'cenario', id: 'b6-cenario', titulo: 'Expandir vizinhança em GraphRAG', obrigatorio: false,
          enunciado: 'Seu pipeline expande, por BFS limitada a 2 saltos, a vizinhança de cada entidade do grafo de conhecimento. Uma consulta ficou 100 vezes mais lenta depois que uma biblioteca importada por todo o projeto entrou no grafo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A entidade consultada é vizinha dessa biblioteca, que tem milhões de arestas. Qual a causa e o primeiro ajuste?', opcoes: [
              { texto: 'É um super-nó: 2 saltos passam por ele e explodem. Limitar o grau ou o orçamento de nós por consulta.', vai: 'ident', tom: 'ok', consequencia: 'o "k saltos" explode em torno de nós com grau enorme.' },
              { texto: 'Trocar a BFS por DFS, que gasta menos memória.', vai: 'f-dfs', tom: 'ruim', consequencia: 'a DFS também visita a vizinhança inteira do super-nó; a explosão continua.' }
            ] },
            ident: { texto: 'Há também duplicação: a mesma entidade aparece com dois nomes e os caminhos "mais curtos" mentem. O que fazer?', opcoes: [
              { texto: 'Normalizar a identidade dos nós antes de modelar, e cachear a expansão por versão do grafo.', vai: 'f-bom', tom: 'ok', consequencia: 'o grafo deixa de se partir em dois e a expansão não se repete a cada consulta.' },
              { texto: 'Ignorar: dois nomes não alteram os caminhos.', vai: 'f-parte', tom: 'ruim', consequencia: 'o grafo se parte em dois e todo caminho mais curto passa a mentir.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Consulta limitada por orçamento, grafo com identidade normalizada e expansão cacheada por versão.' },
            'f-dfs': { bom: false, texto: 'A consulta continuou lenta e agora a ordem dos resultados mudou sem ganho.' },
            'f-parte': { bom: false, texto: 'Respostas de caminho passaram a variar conforme o nome usado na consulta.' }
          },
          callout: 'Você limitou a expansão do super-nó e tratou a identidade dos nós.' },
        { tipo: 'takeaway', html: 'Em grafos reais, limite o <mark>grau</mark>, normalize a <mark>identidade</mark> e cacheie por <mark>versão</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: grafos reais não cabem nas premissas do livro', html:
          '<ul><li><strong>Super-nós</strong>: um nó com milhões de vizinhos faz o "k saltos" explodir; limite o grau ou o orçamento de nós por consulta.</li>' +
          '<li><strong>Identidade de nó</strong>: a mesma entidade com dois nomes parte o grafo em dois; normalize antes de modelar.</li>' +
          '<li><strong>Pesos de naturezas diferentes</strong> (latência + preço) não se somam sem decisão de negócio.</li>' +
          '<li><strong>Grafos que mudam</strong>: recalcular tudo a cada consulta é o O(V + E) que ninguém previu; existem algoritmos incrementais, mas medir primeiro quase sempre mostra que cache por versão do grafo resolve.</li></ul>' },
        { tipo: 'texto', html:
          '<h3>Em sistemas de IA</h3><p>Dependências entre etapas de um pipeline (topológica), alcance de impacto de uma mudança no código (BFS no grafo de chamadas), expansão de vizinhança em GraphRAG (BFS limitada a k saltos), roteamento de custo e latência entre provedores de modelo (Dijkstra) e detecção de ciclos em agentes que se chamam mutuamente (DFS com cores). Tudo reaparece no M10.</p>' },
        { tipo: 'escolha', id: 'b6-esc-neg', titulo: 'Confira: o desconto na aresta',
          pergunta: 'Um grafo de rotas tem uma aresta de peso negativo (um "desconto"). O que acontece com o Dijkstra?',
          opcoes: [
            { id: 'a', texto: 'Funciona normalmente, só um pouco mais lento.', correta: false, porque: 'a correção depende dos pesos não negativos.' },
            { id: 'b', texto: 'Pode devolver caminhos errados: assume que uma distância fixada não melhora; para negativos use Bellman–Ford (O(V·E)), que também detecta ciclos negativos.', correta: true, porque: 'Dijkstra é guloso: ao tirar o nó de menor distância do heap, declara a distância definitiva.' },
            { id: 'c', texto: 'Funciona se o grafo for um DAG.', correta: false, porque: 'a restrição é do peso, não da forma do grafo.' },
            { id: 'd', texto: 'Entra em recursão infinita sempre.', correta: false, porque: 'não usa recursão; o risco é resultado errado.' }
          ], tutorDepois: 'O lab rejeita peso negativo com ValueError: falhar alto.' },
        { tipo: 'escolha', id: 'b6-esc-mod', titulo: 'Confira: BFS contra DFS',
          pergunta: 'BFS e DFS visitam os mesmos nós. Quando a escolha muda a resposta?',
          opcoes: [
            { id: 'a', texto: 'BFS dá o caminho com menos arestas em grafo não ponderado; DFS dá estrutura (ciclos, componentes, ordem de término); com pesos, nenhum dos dois dá menor custo: aí é Dijkstra.', correta: true, porque: 'a DFS não dá caminhos mais curtos, e a BFS conta arestas.' },
            { id: 'b', texto: 'Nunca: o resultado é o mesmo.', correta: false, porque: 'a ordem de visita e as propriedades são diferentes.' },
            { id: 'c', texto: 'A DFS sempre dá o menor caminho porque vai até o fim.', correta: false, porque: 'ela segue um caminho até o fim, sem garantia de ser o menor.' }
          ], tutorDepois: 'Escolha pela pergunta: saltos, estrutura ou custo.' },
        { tipo: 'texto', html: '<p class="ta-nota">Saídas do laboratório (<code>algos.demo graph</code>) de 11/10/2026, CPython 3.14.7. Os algoritmos são independentes de versão; bibliotecas citadas (NetworkX, igraph, graph-tool, SciPy) devem ser revalidadas em até 90 dias.</p>' },
        { tipo: 'takeaway', html: 'Modele como <mark>G = (V, E)</mark> e escolha o algoritmo pela <mark>pergunta</mark>.' }
      ] }
    ]
  });
})();
