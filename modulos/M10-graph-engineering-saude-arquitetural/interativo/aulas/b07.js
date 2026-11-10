/* M10 · Bloco 7: GraphRAG, busca local, global e o custo real. Fonte: M10.html#b07. Números dos exercícios são de exemplo, não medidas. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoCusto = `import math


def custo_pre(comunidades, tokens, preco_milhao, reindexacoes):
    """Pre-computado: paga TODA comunidade a cada reindexacao."""
    return 0.0


def custo_lazy(perguntas, por_pergunta, comunidades, tokens, preco_milhao):
    """Preguicoso: paga so as comunidades lidas em cada pergunta
    (nunca mais do que existem)."""
    return 0.0


def equilibrio(reindexacoes, comunidades, por_pergunta):
    """Perguntas globais por mes a partir das quais o pre-calculo compensa:
    Q* = R * C / m, arredondado para cima."""
    return 0
`;
  var solucaoCusto = `import math


def custo_pre(comunidades, tokens, preco_milhao, reindexacoes):
    return reindexacoes * comunidades * tokens / 1e6 * preco_milhao


def custo_lazy(perguntas, por_pergunta, comunidades, tokens, preco_milhao):
    m = min(por_pergunta, comunidades)
    return perguntas * m * tokens / 1e6 * preco_milhao


def equilibrio(reindexacoes, comunidades, por_pergunta):
    if por_pergunta <= 0:
        raise ValueError("por_pergunta deve ser positivo")
    return math.ceil(reindexacoes * comunidades / por_pergunta)
`;
  var testesCusto = `def aprox(a, b):
    return abs(a - b) < 1e-9


def test_pre_computado():
    assert aprox(custo_pre(400, 6000, 1.0, 4), 9.6)


def test_preguicoso():
    assert aprox(custo_lazy(30, 12, 400, 6000, 1.0), 2.16)


def test_preguicoso_nao_le_mais_que_existe():
    assert aprox(custo_lazy(10, 999, 20, 1000, 1.0), 10 * 20 * 1000 / 1e6)


def test_ponto_de_equilibrio():
    assert equilibrio(4, 400, 12) == 134


def test_equilibrio_exato_nao_arredonda_para_mais():
    assert equilibrio(4, 300, 12) == 100


def test_por_pergunta_zero_e_erro():
    try:
        equilibrio(4, 400, 0)
    except ValueError:
        return
    raise AssertionError("deveria falhar")
`;

  var codigoHib = `STOP = {"o", "a", "os", "as", "de", "do", "da", "que", "e", "em"}


def ancoras(pergunta, docs, k=3):
    """Busca 'semantica' de brinquedo: palavras em comum (sem stopwords).
    Ordem: mais palavras primeiro, empate pelo fqn. So quem tem 1+ palavra."""
    return []


def expandir(dependentes, ancora, saltos):
    """BFS pelos dependentes (quem depende de X). Devolve {fqn: rota} em que
    rota vai do vizinho ate a ancora. Nao inclui a ancora, respeita saltos."""
    return {}


def recuperar(pergunta, docs, dependentes, max_ancoras=3, saltos=2):
    """Hibrido vetor -> grafo, com orcamento (max_ancoras x saltos).
    Sem ancora: RAG puro (nada de vizinhos)."""
    return {"ancoras": [], "vizinhos": {}, "caminhos": []}
`;
  var solucaoHib = `STOP = {"o", "a", "os", "as", "de", "do", "da", "que", "e", "em"}


def ancoras(pergunta, docs, k=3):
    palavras = set(pergunta.lower().split()) - STOP
    pontuados = []
    for fqn, texto in docs.items():
        n = len(palavras & set(texto.lower().split()))
        if n > 0:
            pontuados.append((-n, fqn))
    return [fqn for _, fqn in sorted(pontuados)[:k]]


def expandir(dependentes, ancora, saltos):
    rotas = {ancora: [ancora]}
    fronteira = [ancora]
    for _ in range(saltos):
        proxima = []
        for no in fronteira:
            for d in dependentes.get(no, []):
                if d not in rotas:
                    rotas[d] = [d] + rotas[no]
                    proxima.append(d)
        fronteira = proxima
    del rotas[ancora]
    return rotas


def recuperar(pergunta, docs, dependentes, max_ancoras=3, saltos=2):
    achadas = ancoras(pergunta, docs, max_ancoras)
    vizinhos = {}
    for a in achadas:
        for fqn, rota in expandir(dependentes, a, saltos).items():
            vizinhos.setdefault(fqn, rota)
    return {"ancoras": achadas, "vizinhos": vizinhos, "caminhos": sorted(vizinhos.values())}
`;
  var testesHib = `DOCS = {
    "FinanceiroLegadoHelper.CalcJuros": "calcula juros compostos do contrato",
    "Juros.Calcular": "calcula juros simples",
    "Tela.Extrato": "mostra o extrato do cliente",
    "Util.Log": "escreve log",
}
DEP = {
    "FinanceiroLegadoHelper.CalcJuros": ["Pagamento.Processar"],
    "Pagamento.Processar": ["Tela.Pagar", "Api.Pagamento"],
    "Juros.Calcular": ["Fatura.Gerar"],
    "Fatura.Gerar": ["Api.Fatura"],
    "Api.Fatura": ["Hub.Tudo"],
}
P = "o que depende do calculo de juros"


def test_ancoras_semanticas_sem_stopwords():
    assert ancoras(P, DOCS, 3) == ["FinanceiroLegadoHelper.CalcJuros", "Juros.Calcular"]


def test_expansao_respeita_saltos_e_guarda_a_rota():
    r = expandir(DEP, "FinanceiroLegadoHelper.CalcJuros", 2)
    assert set(r) == {"Pagamento.Processar", "Tela.Pagar", "Api.Pagamento"}
    assert r["Tela.Pagar"] == ["Tela.Pagar", "Pagamento.Processar", "FinanceiroLegadoHelper.CalcJuros"]


def test_hub_nao_vira_o_repositorio():
    r = recuperar(P, DOCS, DEP, 3, 2)
    assert "Hub.Tudo" not in r["vizinhos"]
    assert "Api.Fatura" in r["vizinhos"]


def test_orcamento_de_ancoras():
    r = recuperar(P, DOCS, DEP, 1, 2)
    assert r["ancoras"] == ["FinanceiroLegadoHelper.CalcJuros"]
    assert "Fatura.Gerar" not in r["vizinhos"]


def test_sem_ancora_e_rag_puro():
    r = recuperar("zzz qqq", DOCS, DEP)
    assert r == {"ancoras": [], "vizinhos": {}, "caminhos": []}


def test_caminhos_sao_evidencia_verificavel():
    r = recuperar(P, DOCS, DEP)
    for rota in r["caminhos"]:
        for de, para in zip(rota, rota[1:]):
            assert de in DEP.get(para, [])
`;

  TrilhaAula.registrar({
    id: 'm10-b7',
    titulo: 'GraphRAG: busca local, global e o custo real',
    minutos: 40,
    resumo: 'GraphRAG é o nome do campo para usar busca e grafo juntos, com custos que diferem em ordens de grandeza. A pergunta local se resolve com vetor mais travessia; a global exige comunidades e resumos, e a conta da ingestão decide se o produto fecha.',
    objetivo: 'Distinguir pergunta local de global, montar o híbrido vetor para grafo com orçamento de expansão e decidir entre resumir na ingestão ou na consulta com a conta na mão.',
    revisao: [
      { id: 'm10b7-global', pergunta: '"Quais são os principais temas de risco deste sistema?" Por que o top-k vetorial falha e o que resolve?',
        opcoes: [
          opc('a', 'Não existe um trecho com a resposta: é visão agregada do corpus todo e o top-k vê só uma amostra. Resolvem comunidades + resumos (GraphRAG global)', true, 'é a diferença entre buscar um registro e produzir uma visão que não existe em nenhuma linha.'),
          opc('b', 'Falta aumentar o k e adicionar reranker', false, 'mais k traz mais amostra, não o todo.'),
          opc('c', 'É um GROUP BY', false, 'não é contagem por categoria.')] },
      { id: 'm10b7-custo', pergunta: 'Qual é a lição de custo transferível do GraphRAG?',
        opcoes: [
          opc('a', 'Ingestão determinística e barata; LLM na consulta, com orçamento por pergunta', true, 'custo de ingestão é fixo por repositório e come a margem; o de consulta é variável e precificável.'),
          opc('b', 'Resumir todas as comunidades na ingestão, porque o custo se dilui', false, 'a maioria das comunidades nunca será perguntada.'),
          opc('c', 'Usar sempre o padrão global', false, 'o global é o mais caro e só serve a perguntas de síntese.')] },
      { id: 'm10b7-hib', pergunta: 'Como funciona o híbrido vetor para grafo (padrão 3)?',
        opcoes: [
          opc('a', 'A busca vetorial acha o ponto de entrada; a travessia expande a vizinhança; o contexto final leva texto e caminhos', true, 'cada um cobre a fraqueza do outro: o grafo não tem semântica, o vetor não enxerga relações.'),
          opc('b', 'O grafo acha os chunks e o vetor percorre as arestas', false, 'inverte os papéis.'),
          opc('c', 'Os dois rodam e o LLM escolhe qual vale', false, 'não há escolha: um ancora, o outro expande.')] },
      { id: 'm10b7-orc', pergunta: 'Por que o híbrido tem orçamento de expansão (3 âncoras × 2 saltos)?',
        opcoes: [
          opc('a', 'Sem limite, a vizinhança de um método muito chamado é o repositório inteiro e enche a janela de ruído', true, 'M08 bloco 4; e os caminhos A para B para C vão como evidência estrutural.'),
          opc('b', 'Porque o Postgres não suporta mais que 3 âncoras', false, 'é decisão de projeto.'),
          opc('c', 'Para o modelo não ver as rotas', false, 'as rotas são citadas na resposta.')] },
      { id: 'm10b7-lazy', pergunta: 'Qual a vantagem da abordagem preguiçosa (lazy)?',
        opcoes: [
          opc('a', 'Adia o trabalho de LLM para a consulta e paga só as comunidades perguntadas; o LazyGraphRAG foi medido em cerca de 0,1% do custo de indexação do GraphRAG completo', true, 'a própria Microsoft descreve a indexação completa como cara.'),
          opc('b', 'Elimina a necessidade de grafo', false, 'ainda usa comunidades.'),
          opc('c', 'Garante qualidade melhor sempre', false, 'a qualidade medida é comparável, não superior.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Você já tem os dois lados: busca híbrida (M07) e grafo (blocos 5 e 6). <strong>GraphRAG</strong> é o nome do campo para usá-los juntos, e há mais de uma forma, com custos que diferem em ordens de grandeza.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>As duas perguntas que o RAG clássico não responde</h3>' +
          '<table><thead><tr><th>Tipo</th><th>Exemplo no Capstone</th><th>Por que o RAG falha</th><th>O que resolve</th></tr></thead><tbody>' +
          '<tr><td><strong>Relacional / multi-salto</strong></td><td>"o que quebra se eu mudar este método?"</td><td>a resposta é a relação, não o texto (bloco 1)</td><td><strong>travessia</strong> (blocos 5 e 6)</td></tr>' +
          '<tr><td><strong>Global / de síntese</strong></td><td>"quais são os principais temas de risco deste sistema?"</td><td>nenhum trecho contém a resposta; exige <em>abrangência</em> sobre o corpus, e o top-k vê só uma amostra</td><td><strong>comunidades + resumo hierárquico</strong> (este bloco)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>A distinção <strong>local × global</strong> é a chave. Pergunta <strong>local</strong> tem resposta concentrada em poucos lugares ("onde está a validação de CPF?"): busca por similaridade é ótima. Pergunta <strong>global</strong> exige olhar o conjunto ("que padrões arquiteturais problemáticos este sistema repete?"): a similaridade traz os 5 trechos mais parecidos com a pergunta, não uma visão do todo.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Registro × visão agregada', html:
          '<p>É a diferença entre buscar um registro por chave e produzir uma visão que <em>não existe</em> em nenhuma linha (contagem por categoria). Pedir a segunda a um índice de similaridade devolve linhas plausíveis e conclusão errada sobre o todo. GraphRAG global é essencialmente <strong>pré-agregação</strong>: os agrupamentos possíveis, calculados na ingestão para responder na consulta.</p>' },
        { tipo: 'texto', html:
          '<h3>Como o GraphRAG global funciona</h3>' +
          '<p>O pipeline canônico (pesquisa da Microsoft) tem quatro passos: extrair entidades e relações (por LLM em texto livre; <strong>por parser no seu caso</strong>, bloco 5); detectar comunidades com um algoritmo de clusterização como Leiden (em código tendem a coincidir com módulos reais, e quando não coincidem a organização de pastas está mentindo); resumir cada comunidade por LLM, formando uma hierarquia; e, na consulta, responder percorrendo os resumos. Os três primeiros são ingestão, e dois deles são chamadas de LLM proporcionais ao corpus.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'O custo real', html:
          '<p>Resumir comunidades na ingestão encarece com o tamanho do corpus a ponto de inviabilizar produto vendido por análise. A própria Microsoft descreve a indexação do GraphRAG completo como cara e mediu o LazyGraphRAG, que adia o trabalho de LLM para a consulta, em cerca de 0,1% desse custo de indexação, com qualidade comparável (fonte do fornecedor, verificada em 14/09/2026).</p>' +
          '<p>Regra transferível: <strong>ingestão determinística e barata; LLM na consulta, com orçamento por pergunta</strong>. Custo de ingestão é fixo por repositório e come a margem de todo cliente; custo de consulta é variável e pode ser precificado (M05 bloco 7).</p>' },
        { tipo: 'takeaway', html: 'Pergunta <mark>local</mark> pede vetor e grafo; pergunta <mark>global</mark> pede visão agregada, e o <mark>custo</mark> decide quando calculá-la.' }
      ] },

      { rotulo: 'Os quatro padrões', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>Quatro padrões de recuperação</h3>' +
          '<table><thead><tr><th>Padrão</th><th>Como funciona</th><th>Custo</th><th>Bom para</th></tr></thead><tbody>' +
          '<tr><td><strong>1. Vetorial puro</strong> (M07)</td><td>embedding da pergunta, top-k chunks</td><td>baixo</td><td>pergunta local e conceitual</td></tr>' +
          '<tr><td><strong>2. Grafo puro</strong> (blocos 5 e 6)</td><td>travessia a partir de um nó identificado</td><td>~zero (é SQL)</td><td>pergunta estrutural com entidade conhecida</td></tr>' +
          '<tr><td><strong>3. Híbrido vetor para grafo</strong></td><td>o vetor acha o ponto de entrada; a travessia expande a vizinhança; o contexto leva os dois</td><td>baixo</td><td><strong>o padrão que mais funciona</strong>: a pergunta não nomeia o símbolo exato, mas é estrutural</td></tr>' +
          '<tr><td><strong>4. Global por comunidade</strong></td><td>map-reduce sobre resumos de comunidade</td><td>alto (médio na versão preguiçosa)</td><td>síntese sobre o corpus todo</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O padrão 3 é o que você vai construir. O usuário pergunta <em>"o que depende do cálculo de juros?"</em> sem saber que a classe se chama <code>FinanceiroLegadoHelper</code>. O vetor acha o ponto de entrada (o que o grafo sozinho não faz, porque não tem semântica); o grafo expande a partir dele (o que o vetor sozinho não faz). <strong>Cada um cobre a fraqueza do outro</strong>, a mesma lógica do híbrido léxico+vetorial do M07 bloco 4, agora em outro eixo.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'async def recuperar(pergunta: str, escopo: Escopo, saltos: int = 2) -> ContextoGrafo:',
          '    # 1) semântica: onde começar? (M07: híbrido léxico + vetorial + rerank)',
          '    candidatos = await buscar_hibrido(pergunta, escopo, top_k=5)',
          '    ancoras = [c.simbolo for c in candidatos if c.simbolo]',
          '',
          '    if not ancoras:',
          '        return ContextoGrafo([], [], candidatos, [])       # sem âncora: RAG puro',
          '',
          '    # 2) estrutura: expandir a vizinhança de cada âncora (barato, é SQL)',
          '    vizinhos, caminhos = [], []',
          '    for fqn in ancoras[:3]:                                 # orçamento de expansão',
          '        for linha in await vizinhanca(escopo, fqn, saltos=saltos):',
          '            vizinhos.append(linha)',
          '            caminhos.append(linha["rota"])',
          '',
          '    # 3) hidratar: buscar o texto dos vizinhos mais relevantes',
          '    trechos = candidatos + await carregar_trechos(escopo, _top_por_grau(vizinhos, 5))',
          '    return ContextoGrafo(ancoras, vizinhos, trechos, caminhos)'].join('\n') },
        { tipo: 'texto', html:
          '<p>Duas decisões de projeto: <strong>orçamento de expansão</strong> (3 âncoras × 2 saltos; sem limite, a vizinhança de um método muito chamado é o repositório inteiro e você enche a janela de ruído, M08 bloco 4) e <strong>caminhos como evidência</strong>: a rota <code>A → B → C</code> vai para a resposta e o usuário verifica o raciocínio. É a citação estrutural, o análogo da citação de linha do M07, verificável mecanicamente pelo grader do bloco 9.</p>' +
          '<p><strong>Pré-computar × computar sob demanda.</strong> Resumos pré-computados trocam custo de escrita por latência de leitura e só valem quando a leitura é frequente. Em linguagem natural o espaço de perguntas é grande e imprevisível, e a maioria das comunidades nunca será perguntada; a abordagem preguiçosa ganha pelo mesmo motivo de não indexar toda combinação de colunas (M03 bloco 3).</p>' },
        { tipo: 'ordene', id: 'b7-ordene', titulo: 'Montar o contexto híbrido', obrigatorio: false,
          enunciado: 'Ordene os passos da recuperação híbrida vetor para grafo.',
          itens: [
            { id: 'ctx', texto: 'Montar o contexto final: trechos mais caminhos como evidência' },
            { id: 'trav', texto: 'Expandir a vizinhança das âncoras na travessia, dentro do orçamento (3 × 2 saltos)' },
            { id: 'perg', texto: 'Receber a pergunta, que não nomeia o símbolo' },
            { id: 'vet', texto: 'Busca vetorial: top âncoras (pontos de entrada)' }
          ],
          solucao: ['perg', 'vet', 'trav', 'ctx'],
          dica: 'A semântica vem antes da estrutura: o grafo precisa de um nó de partida.',
          tutorDepois: 'Sem âncora, o fluxo cai em RAG puro.',
          callout: 'Pergunta, vetor, travessia, contexto.' },
        { tipo: 'takeaway', html: 'O vetor dá o <mark>ponto de entrada</mark>, o grafo dá a <mark>vizinhança</mark>, e o orçamento evita o <mark>ruído</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Números de exemplo, para você trocar pelos seus (<strong>não são medidas</strong>): 400 comunidades, 6.000 tokens por resumo, US$ 1 por 1M de tokens, 4 reindexações por mês, 30 perguntas globais por mês, 12 comunidades lidas por pergunta. O pré-computado paga <em>toda</em> comunidade a cada reindexação; o preguiçoso paga só as consultadas.</p>' },
        { tipo: 'rode', id: 'b7-rode', titulo: 'A conta antes do resumo', enunciado: 'Cenário de exemplo da conta de resumos. A saída vem de executar a solução do exercício.',
          prefixo: '$', entrada: 'python3 conta_resumos.py', unidade: 'ms', terminalTitulo: 'exemplo, não medida',
          prever: { pergunta: 'Neste cenário (4 reindexações, 400 comunidades; 30 perguntas × 12 comunidades), qual abordagem custa menos por mês?', opcoes: [
            { id: 'a', texto: 'Pré-computado: paga uma vez e responde de graça', correta: false, porque: 'ele paga toda comunidade a cada reindexação, tenha pergunta ou não.' },
            { id: 'b', texto: 'Preguiçoso, em torno de 4 vezes mais barato', correta: true, porque: 'US$ 2,16 contra US$ 9,60: poucas perguntas leem poucas comunidades.' },
            { id: 'c', texto: 'Custam o mesmo', correta: false, porque: 'as fórmulas dependem de variáveis diferentes.' }
          ] },
          etapas: [
            { id: 'pre', nome: 'Pré-computado', descricao: 'R × C × tokens', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'custo_pre(400, 6000, 1.0, 4)'),
              L('out', '4 reindexações × 400 comunidades × 6000 tokens = US$ 9.60')] },
            { id: 'lazy', nome: 'Preguiçoso', descricao: 'Q × m × tokens', tom: 'request', ms: 1, linhas: [
              L('cmd', 'custo_lazy(30, 12, 400, 6000, 1.0)'),
              L('out', '30 perguntas × 12 comunidades × 6000 tokens = US$ 2.16'),
              L('hint', 'preguiçoso é 4,4 vezes mais barato aqui')] },
            { id: 'eq', nome: 'Ponto de equilíbrio', descricao: 'Q* = R·C / m', tom: 'response', ms: 1, linhas: [
              L('cmd', 'equilibrio(4, 400, 12)'),
              L('out', '134'),
              L('hint', 'só acima de 134 perguntas globais por mês o pré-cálculo passa a compensar')] }
          ],
          tutorDepois: 'Se a ingestão é fixa por repositório e você cobra por análise, o custo de ingestão come a margem de todo cliente. Troque as variáveis pelas suas antes de decidir.',
          callout: 'Você viu a conta e o ponto de equilíbrio.' },
        { tipo: 'python', id: 'b7-python-custo', titulo: 'A conta dos resumos', obrigatorio: false,
          enunciado: 'Implemente <code>custo_pre</code>, <code>custo_lazy</code> (nunca lê mais comunidades do que existem) e <code>equilibrio</code> (Q* = R · C / m, arredondado para cima; <code>m</code> zero é erro).',
          codigo: codigoCusto, testes: testesCusto,
          dica: 'Custo = chamadas × tokens / 1e6 × preço. Para o preguiçoso use <code>min(por_pergunta, comunidades)</code>. O equilíbrio usa <code>math.ceil</code>.',
          solucao: solucaoCusto,
          tutorDepois: 'A conta cabe numa função de três linhas, e ela decide uma arquitetura. Registre a decisão em ADR.',
          callout: 'A conta passou nos testes, com a borda do arredondamento.' },
        { tipo: 'takeaway', html: 'Faça a <mark>conta</mark> antes do resumo: o ponto de equilíbrio diz se compensa <mark>ingerir</mark> ou <mark>consultar</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b7-python-hib', titulo: 'Híbrido com orçamento', obrigatorio: false,
          enunciado: 'Implemente <code>ancoras</code> (busca de brinquedo por palavras em comum), <code>expandir</code> (BFS pelos dependentes com rota até a âncora, respeitando saltos) e <code>recuperar</code> (orçamento de âncoras, sem âncora cai em RAG puro).',
          codigo: codigoHib, testes: testesHib,
          dica: 'Em <code>expandir</code>: guarde <code>rotas = {ancora: [ancora]}</code> e avance por fronteira, <code>saltos</code> vezes; ao achar um dependente novo, <code>rotas[d] = [d] + rotas[no]</code>. Remova a âncora no fim. Em <code>recuperar</code>, junte os vizinhos de cada âncora.',
          solucao: solucaoHib,
          tutorDepois: 'O último teste verifica cada caminho contra o grafo: é a citação estrutural verificável mecanicamente.',
          callout: 'Âncora semântica, expansão orçada e caminhos verificáveis passaram nos testes.' },
        { tipo: 'cenario', id: 'b7-cenario', titulo: 'Resumir na ingestão ou na consulta?', obrigatorio: false,
          enunciado: 'Você vende análise de repositório por preço fixo por análise e quer oferecer perguntas globais.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O desenho proposto resume todas as comunidades na ingestão (GraphRAG completo). Faça a conta primeiro. O que ela mostra?', opcoes: [
              { texto: 'O custo de ingestão é fixo por repositório e come a margem de todo cliente, pergunte-se ou não.', vai: 'alt', tom: 'ok', consequencia: 'o custo precisa ser variável para poder ser precificado.' },
              { texto: 'O custo é diluído e não preocupa.', vai: 'f-margem', tom: 'ruim', consequencia: 'a maioria das comunidades nunca é perguntada, mas todas foram pagas.' }
            ] },
            alt: { texto: 'Qual a alternativa?', opcoes: [
              { texto: 'Ingestão determinística e barata; resumir na consulta, com orçamento de comunidades por pergunta.', vai: 'f-bom', tom: 'ok', consequencia: 'custo variável, precificável, e registrado em ADR com a conta do M05.' },
              { texto: 'Cortar o grafo e responder só com vetor.', vai: 'f-perde', tom: 'ruim', consequencia: 'a pergunta global fica sem resposta honesta.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Pergunta global atendida, margem preservada, custo por pergunta controlado.' },
            'f-margem': { bom: false, texto: 'O preço fixo não cobre o custo de ingestão dos clientes que nunca perguntam.' },
            'f-perde': { bom: false, texto: 'Sem síntese, o produto responde errado sobre o todo.' }
          },
          callout: 'Você levou o custo para a consulta, onde ele é variável e precificável.' },
        { tipo: 'escolha', id: 'b7-esc-padrao', titulo: 'Confira: qual padrão',
          pergunta: 'O usuário pergunta "o que depende do cálculo de juros?" e não sabe que a classe se chama <code>FinanceiroLegadoHelper</code>. Qual padrão resolve?',
          opcoes: [
            { id: 'a', texto: 'Grafo puro: percorrer a partir do nome digitado.', correta: false, porque: 'o grafo precisa de um nó de partida e não tem semântica.' },
            { id: 'b', texto: 'Vetorial puro com k maior.', correta: false, porque: 'o vetor não enxerga relações.' },
            { id: 'c', texto: 'Híbrido vetor para grafo: o vetor acha a âncora, a travessia expande a vizinhança.', correta: true, porque: 'cada um cobre a fraqueza do outro.' },
            { id: 'd', texto: 'Global por comunidade.', correta: false, porque: 'é para síntese do corpus todo e é o mais caro.' }
          ], tutorDepois: 'Local e estrutural: híbrido. Global: comunidades.' },
        { tipo: 'escolha', id: 'b7-esc-custo', titulo: 'Confira: a lição de custo',
          pergunta: 'Qual é a lição de custo transferível do GraphRAG segundo o bloco?',
          opcoes: [
            { id: 'a', texto: 'Resumir todas as comunidades na ingestão, porque o custo é diluído entre os clientes.', correta: false, porque: 'é fixo por repositório e come a margem.' },
            { id: 'b', texto: 'Ingestão determinística e barata; LLM na consulta, com orçamento por pergunta.', correta: true, porque: 'custo de consulta é variável e pode ser precificado.' },
            { id: 'c', texto: 'Custo de consulta é fixo e custo de ingestão é variável.', correta: false, porque: 'é o contrário.' },
            { id: 'd', texto: 'Usar o padrão global para qualquer pergunta, por segurança.', correta: false, porque: 'é o mais caro e desnecessário para perguntas locais.' }
          ], tutorDepois: 'Comunidades divergindo das pastas são achado gratuito: a organização de pastas está mentindo.' },
        { tipo: 'takeaway', html: 'Ingestão <mark>barata e determinística</mark>; LLM <mark>na consulta</mark>, com orçamento.' }
      ] }
    ]
  });
})();
