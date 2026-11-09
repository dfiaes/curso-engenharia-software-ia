/* M07 · Bloco 4: busca híbrida. Fonte: M07.html#b04. Constantes k1 = 1.5 e b = 0.75 do BM25 do exercício são valores convencionais, não vêm da fonte. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasRrf = function () {
    return [
      { id: 'listas', nome: 'Duas listas', descricao: 'Posições de X e Y em cada ranking', tom: 'dns', ms: 3, linhas: [
        L('cmd', 'python rrf.py --k 60'),
        L('info', 'X: 1º na lista léxica, ausente da vetorial'),
        L('info', 'Y: 4º na léxica e 4º na vetorial'),
        L('hint', 'o RRF descarta os scores originais e usa só a posição')] },
      { id: 'x', nome: 'Documento X', descricao: '1/(60+1)', tom: 'tcp', ms: 16, linhas: [
        L('out', 'X: 1/(60+1) = 0.0164  (só léxico)')] },
      { id: 'y', nome: 'Documento Y', descricao: '1/(60+4) + 1/(60+4)', tom: 'tls', ms: 31, linhas: [
        L('out', 'Y: 1/(60+4) + 1/(60+4) = 0.0312  (consenso)')] },
      { id: 'rank', nome: 'Ranking fundido', descricao: 'Ordem final', tom: 'request', ms: 31, linhas: [
        L('in', '1º Y  0.0312  consenso'),
        L('in', '2º X  0.0164  só léxico'),
        L('hint', 'consenso entre métodos independentes é sinal mais forte que excelência em um só')] },
      { id: 'varia', nome: 'Seis documentos', descricao: 'O caso de identificador literal', tom: 'ink', ms: 31, linhas: [
        L('cmd', 'python rrf.py --k 60 --caso identificador-literal'),
        L('out', 'F 0.0313 · B 0.0306 · A 0.0164 · D 0.0164 · E 0.0161 · C 0.0159'),
        L('hint', 'com peso do léxico 2.0 a ordem vira B 0.0468 · F 0.0466 · A 0.0328 · C 0.0317 · D 0.0164 · E 0.0161: o peso muda a ordem, e deve ser medido no eval do bloco 7')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm07-b4',
    titulo: 'Busca híbrida: léxico + vetorial + fusão de ranking',
    minutos: 45,
    resumo: 'Léxico e vetorial falham em lugares opostos. A fusão por posição (RRF) combina os dois rankings sem somar scores de escalas incomparáveis.',
    objetivo: 'Explicar o que cada lado acha e perde, montar a consulta híbrida com ACL dentro de cada CTE, calcular o RRF à mão e em código e ler recall@k e MRR para julgar uma mudança na busca.',
    revisao: [
      { id: 'm07b4-soma', pergunta: 'Por que 0.5 × score_vetorial + 0.5 × score_lexico é uma má fusão?',
        opcoes: [
          opc('a', 'As escalas são incomparáveis e mudam por consulta, e a normalização min-max faz o melhor de uma lista ruim virar 1,0', true, 'o RRF descarta os scores e usa só a posição, comparável entre listas de qualquer escala.'),
          opc('b', 'Somar é mais lento que ordenar', false, 'o problema é semântico, não de velocidade.'),
          opc('c', 'O vetorial sempre domina o léxico', false, 'não há dominância fixa: as distribuições mudam por consulta.')] },
      { id: 'm07b4-rrf', pergunta: 'Com k = 60, X é 1º só na lista léxica e Y é 4º nas duas listas. Quem fica à frente?',
        opcoes: [
          opc('a', 'Y: 2 × 1/64 ≈ 0,031 contra 1/61 ≈ 0,016 de X; o consenso supera a excelência em uma lista só', true, 'é o comportamento desejado do RRF.'),
          opc('b', 'X, porque o 1º lugar vale mais que qualquer combinação', false, 'com k = 60 a diferença entre posições iniciais é amortecida.'),
          opc('c', 'Depende da escala dos scores originais', false, 'o RRF não olha os scores.')] },
      { id: 'm07b4-ident', pergunta: 'Por que o híbrido existe em corpus de código?',
        opcoes: [
          opc('a', 'Metade das perguntas de um dev contém um identificador literal, que o vetor dilui e o léxico acha trivialmente', true, 'léxico e vetorial falham em lugares opostos, então a união bate cada um isolado quase sempre.'),
          opc('b', 'Porque o Postgres exige duas buscas por consulta', false, 'é decisão de desenho, não exigência do banco.'),
          opc('c', 'Para dispensar o reranker', false, 'o híbrido alimenta o reranker do bloco 5.')] },
      { id: 'm07b4-tsquery', pergunta: 'Qual função usar para transformar a entrada livre do usuário em tsquery?',
        opcoes: [
          opc('a', 'websearch_to_tsquery (ou plainto_tsquery): não explode com entrada livre', true, 'to_tsquery exige sintaxe válida e levanta erro.'),
          opc('b', 'to_tsquery', false, 'levanta erro com entrada que não seja sintaxe válida.'),
          opc('c', 'ts_rank_cd', false, 'ts_rank_cd pontua, não constrói a consulta.')] },
      { id: 'm07b4-metricas', pergunta: 'Alguém diz "melhorei a busca". Qual é a pergunta certa?',
        opcoes: [
          opc('a', 'Melhorou recall ou precisão, em que k, medido em quantas consultas?', true, 'sem isso é opinião; recall@k decide se o sistema consegue responder.'),
          opc('b', 'Quantas linhas de código mudaram?', false, 'tamanho da mudança não mede qualidade de busca.'),
          opc('c', 'O score médio subiu?', false, 'scores de métodos diferentes não são comparáveis.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Duas buscas que falham em lugares opostos</h3>' +
          '<p>No bloco 1 você provou que o embedding perde o identificador exato: <code>CalcularJurosCompostosV2</code> some no meio de "cálculo de juros". A busca léxica acha isso trivialmente e, em compensação, não acha nada quando a pergunta usa palavras diferentes do documento. Por isso combiná-las quase sempre bate cada uma isolada. Em corpus de código é praticamente sempre, porque metade das perguntas de um dev contém um identificador literal.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th></th><th>Léxico (BM25 / tsvector)</th><th>Vetorial (embedding)</th></tr></thead><tbody>' +
          '<tr><td>Acha</td><td>Termo exato, identificador, sigla, número de erro</td><td>Sinônimo, paráfrase, conceito</td></tr>' +
          '<tr><td>Erra quando</td><td>A pergunta usa outras palavras ("autenticação" × <code>LoginController</code>)</td><td>Identificador raro, negação, número</td></tr>' +
          '<tr><td>Custo</td><td>Zero de API, índice GIN barato</td><td>Embedding por chunk e por consulta</td></tr>' +
          '<tr><td>Explicabilidade</td><td>Alta: dá para ver o termo que casou</td><td>Baixa</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>BM25, TF-IDF e o que o Postgres tem</h3>' +
          '<p><strong>TF-IDF</strong> pontua um documento pela frequência do termo nele (TF) ponderada pela raridade do termo no corpus (IDF): termo raro que aparece muito num documento é forte sinal. <strong>BM25</strong> é o refinamento padrão da indústria: adiciona <em>saturação</em> (a 10ª ocorrência vale menos que a 2ª) e <em>normalização por tamanho</em> (documento longo não ganha só por ser longo). Está por trás de Elasticsearch, Lucene e da maioria dos buscadores.</p>' +
          '<p>O Postgres nativo <strong>não tem BM25</strong>: tem <code>tsvector</code> / <code>tsquery</code> com <code>ts_rank</code> e <code>ts_rank_cd</code>, mais simples (sem IDF real). Para o volume do Capstone basta, e o RRF atenua a diferença porque usa a ordem, não a escala do score. Se um dia precisar de BM25 dentro do Postgres, existem extensões dedicadas (<code>pg_search</code> / ParadeDB, <code>pg_textsearch</code>): troca-se a cláusula de ranking e o resto do desenho continua. Registre a escolha num ADR (M04).</p>' },
        { tipo: 'texto', html:
          '<h3>O lado léxico, na prática</h3>' +
          '<p>Vocabulário: <code>tsvector</code> é o índice de palavras normalizadas, <code>tsquery</code> a consulta, <code>@@</code> o operador de casamento, <code>ts_rank</code> a pontuação. A coluna <code>tsv</code> já é gerada (bloco 3); a consulta:</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto:
          "SELECT id, ts_rank_cd(tsv, query) AS score\nFROM chunks, websearch_to_tsquery('simple', 'validar CNPJ') AS query\nWHERE tsv @@ query\nORDER BY score DESC\nLIMIT 20;" },
        { tipo: 'texto', html:
          '<ul><li><code>websearch_to_tsquery</code> aceita sintaxe de buscador (aspas para frase, <code>-termo</code> para excluir, <code>or</code>) e, o mais importante, <strong>não explode com entrada do usuário</strong>; <code>to_tsquery</code> exige sintaxe válida e levanta erro. Use sempre <code>websearch_to_tsquery</code> ou <code>plainto_tsquery</code> em entrada livre.</li>' +
          '<li><code>ts_rank_cd</code> (cover density) considera a proximidade entre os termos e costuma ser melhor que <code>ts_rank</code> em consultas de várias palavras.</li>' +
          '<li>Dicionário <code>\'simple\'</code> para código (sem stemming, preserva identificadores) e <code>\'portuguese\'</code> para documentação em português; duas colunas <code>tsvector</code> é solução legítima e barata.</li>' +
          '<li>Peso por campo: <code>setweight(to_tsvector(\'simple\', simbolo), \'A\') || setweight(to_tsvector(\'simple\', conteudo), \'B\')</code> faz o nome do símbolo pesar mais que o corpo: ganho grande e gratuito em código.</li></ul>' },
        { tipo: 'takeaway', html: 'Léxico acha o <mark>identificador exato</mark>, vetor acha a <mark>paráfrase</mark>; o Postgres tem <mark>ts_rank_cd</mark>, não BM25 de verdade.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>RRF: por que não dá para somar os scores</h3>' +
          '<p>A tentação é <code>score_final = 0.5 × score_vetorial + 0.5 × score_lexico</code>. Não funciona, por três motivos: as escalas são incomparáveis (cosseno vive em [0,1]; <code>ts_rank</code> não tem teto fixo); as distribuições mudam por consulta (termo raro produz scores léxicos altíssimos, outro produz baixos); e normalizar min-max dentro do resultado faz o melhor de uma lista ruim virar 1,0.</p>' +
          '<p><strong>Reciprocal Rank Fusion</strong> descarta os scores e usa só a <strong>posição</strong>:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: 'RRF(documento) = soma sobre as listas i de 1 / (k + posição_na_lista_i)\nk = 60 (constante padrão da literatura)' },
        { tipo: 'texto', html:
          '<p>Posição é comparável entre listas de qualquer escala. O <code>k</code> amortece a diferença entre as primeiras posições (com k = 60, o 1º vale 1/61 e o 2º 1/62), de modo que um documento nas duas listas, mesmo em posições médias, supera um que é 1º em apenas uma. Antes de rodar: X é 1º só na lista léxica; Y é 4º nas duas. Quem ganha?</p>' },
        { tipo: 'rode', id: 'm07b4-rode', titulo: 'Calcule o RRF de X e Y', enunciado: 'Rode o RRF com k = 60 e clique nas etapas para ler a conta de cada documento e o caso de seis documentos.',
          prefixo: '$', entrada: 'python rrf.py --k 60', unidade: 'milésimos', terminalTitulo: 'rrf', etapas: etapasRrf(),
          prever: { pergunta: 'Com k = 60, X é 1º só na lista léxica e Y é 4º na léxica e 4º na vetorial. Quem fica à frente no RRF?', opcoes: [
            { id: 'a', texto: 'X, porque o 1º lugar vale mais que qualquer combinação.', correta: false, porque: 'com k = 60 o 1º vale 1/61, menos que o dobro de 1/64.' },
            { id: 'b', texto: 'Y: duas contribuições de 1/64 somam mais que uma de 1/61.', correta: true, porque: '2/64 = 0,0312 contra 1/61 = 0,0164: consenso supera campeão único.' },
            { id: 'c', texto: 'Empatam, pois a soma das posições é igual.', correta: false, porque: 'o RRF soma recíprocos, não posições.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Clique em "Seis documentos" para ver o caso com identificador literal.',
          tutorDepois: 'Y venceu com 0,0312 contra 0,0164 de X. No caso de seis documentos o literal só do léxico (A) fica em terceiro; dar peso 2.0 ao léxico reordena, mas não o coloca no topo. Peso por intuição é superstição com números: meça no eval do bloco 7.',
          callout: 'Você viu o consenso superar o campeão de uma lista só.' },
        { tipo: 'takeaway', html: 'O RRF usa só a <mark>posição</mark>: <mark>consenso</mark> entre métodos independentes vale mais que ser o melhor em um só.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Implemente a fusão e as duas métricas que decidem se a mudança melhorou a busca. O BM25 simplificado é opcional e mostra o que o Postgres não tem.</p>' },
        { tipo: 'python', id: 'm07b4-python-rrf', titulo: 'RRF, recall@k e MRR',
          enunciado: 'Complete <code>rrf(listas, k=60, pesos=None)</code>: cada lista é uma ordem de ids (posição começa em 1); a pontuação de um id soma <code>peso / (k + posição)</code> em cada lista onde aparece; devolve <code>[(id, score, aparece_em)]</code> ordenado por score decrescente e, em empate, por id. Levante <code>ValueError</code> se o número de pesos diferir do de listas. <code>recall_at_k</code> e <code>mrr</code> já estão prontos, e os testes os usam para mostrar que o híbrido é a união dos dois lados.',
          codigo: `def rrf(listas, k=60, pesos=None):
    if pesos is None:
        pesos = [1.0] * len(listas)
    if len(pesos) != len(listas):
        raise ValueError("um peso por lista")
    placar = {}
    aparece = {}
    for lista, peso in zip(listas, pesos):
        for pos, doc in enumerate(lista, start=1):
            # 1. placar[doc] = placar.get(doc, 0.0) + peso / (k + pos)
            # 2. aparece[doc] = aparece.get(doc, 0) + 1
            pass
    ordem = sorted(placar, key=lambda d: (-placar[d], d))
    return [(d, placar[d], aparece[d]) for d in ordem]


def recall_at_k(ranking, relevantes, k):
    if not relevantes:
        raise ValueError("sem documentos relevantes")
    achados = set(ranking[:k]) & set(relevantes)
    return len(achados) / len(set(relevantes))


def mrr(rankings, relevantes_por_consulta):
    total = 0.0
    for ranking, relevantes in zip(rankings, relevantes_por_consulta):
        for pos, doc in enumerate(ranking, start=1):
            if doc in relevantes:
                total += 1.0 / pos
                break
    return total / len(rankings)


print(rrf([["X", "A"], ["B", "C", "D", "X"]])[:2])
`,
          testes: `def test_consenso_supera_campeao_unico():
    lex = ["X", "a", "b", "Y"]
    vet = ["c", "d", "e", "Y"]
    topo = rrf([lex, vet])[0]
    assert topo[0] == "Y" and topo[2] == 2
    assert abs(topo[1] - 2 / 64) < 1e-12


def test_so_a_posicao_conta():
    r = rrf([["A", "B"]], k=60)
    assert abs(r[0][1] - 1 / 61) < 1e-12
    assert abs(r[1][1] - 1 / 62) < 1e-12


def test_peso_do_lexico_reordena():
    lex = ["X", "c"]
    vet = ["Y", "d"]
    assert rrf([lex, vet])[0][0] == "X"
    assert rrf([lex, vet], pesos=[1.0, 3.0])[0][0] == "Y"
    assert rrf([lex, vet], pesos=[3.0, 1.0])[0][0] == "X"


def test_empate_desempata_por_id_e_lista_vazia():
    assert [d for d, _, _ in rrf([["B"], ["A"]])] == ["A", "B"]
    assert rrf([]) == []


def test_pesos_incompativeis_falham():
    try:
        rrf([["A"], ["B"]], pesos=[1.0])
    except ValueError:
        return
    assert False, "deveria levantar ValueError"


def test_hibrido_e_a_uniao_dos_dois_lados():
    lex = ["B", "x", "y"]
    vet = ["D", "z", "w"]
    rel = {"B", "D"}
    fundido = [d for d, _, _ in rrf([lex, vet])]
    assert recall_at_k(lex, rel, 1) == 0.5
    assert recall_at_k(vet, rel, 1) == 0.5
    assert recall_at_k(fundido, rel, 2) == 1.0


def test_mrr_e_recall_sem_relevantes():
    assert mrr([["a", "b"], ["x", "y", "b"]], [{"b"}, {"b"}]) == (1 / 2 + 1 / 3) / 2
    assert mrr([["a"]], [{"zzz"}]) == 0.0
    try:
        recall_at_k(["a"], set(), 5)
    except ValueError:
        return
    assert False, "deveria levantar ValueError"
`,
          dica: 'Dentro do laço interno: <code>placar[doc] = placar.get(doc, 0.0) + peso / (k + pos)</code> e <code>aparece[doc] = aparece.get(doc, 0) + 1</code>. O <code>enumerate(..., start=1)</code> já entrega a posição 1-based.',
          solucao: `def rrf(listas, k=60, pesos=None):
    if pesos is None:
        pesos = [1.0] * len(listas)
    if len(pesos) != len(listas):
        raise ValueError("um peso por lista")
    placar = {}
    aparece = {}
    for lista, peso in zip(listas, pesos):
        for pos, doc in enumerate(lista, start=1):
            placar[doc] = placar.get(doc, 0.0) + peso / (k + pos)
            aparece[doc] = aparece.get(doc, 0) + 1
    ordem = sorted(placar, key=lambda d: (-placar[d], d))
    return [(d, placar[d], aparece[d]) for d in ordem]


def recall_at_k(ranking, relevantes, k):
    if not relevantes:
        raise ValueError("sem documentos relevantes")
    achados = set(ranking[:k]) & set(relevantes)
    return len(achados) / len(set(relevantes))


def mrr(rankings, relevantes_por_consulta):
    total = 0.0
    for ranking, relevantes in zip(rankings, relevantes_por_consulta):
        for pos, doc in enumerate(ranking, start=1):
            if doc in relevantes:
                total += 1.0 / pos
                break
    return total / len(rankings)
`,
          tutorDepois: 'O terceiro teste é o bloco inteiro em miniatura: cada lado acha um dos dois relevantes, e a fusão acha os dois. Note que o peso 3.0 no léxico reordena sem mexer nos scores originais, que o RRF nunca vê.',
          callout: 'RRF, recall@k e MRR em código, com o híbrido como união.' },
        { tipo: 'python', id: 'm07b4-python-bm25', titulo: 'BM25 simplificado (opcional)', obrigatorio: false,
          enunciado: 'Complete o IDF e a contribuição de cada termo em <code>pontuar(consulta, docs, k1, b)</code>. IDF: <code>log(1 + (N - n + 0.5) / (n + 0.5))</code>, com <code>n</code> = documentos que contêm o termo. Contribuição: <code>idf * tf * (k1 + 1) / (tf + k1 * (1 - b + b * len(doc) / avgdl))</code>, que traz saturação (<code>k1</code>) e normalização por tamanho (<code>b</code>). Os valores <code>k1 = 1.5</code> e <code>b = 0.75</code> são convenção, não vêm do módulo.',
          codigo: `import math
import re


def tokens(texto):
    return re.findall(r"[a-z0-9]+", texto.lower())


def pontuar(consulta, docs, k1=1.5, b=0.75):
    if not docs:
        raise ValueError("corpus vazio")
    toks = {i: tokens(t) for i, t in docs.items()}
    N = len(docs)
    avgdl = sum(len(t) for t in toks.values()) / N
    pont = {i: 0.0 for i in docs}
    for termo in set(tokens(consulta)):
        n = sum(1 for t in toks.values() if termo in t)
        if n == 0:
            continue
        idf = 0.0  # log(1 + (N - n + 0.5) / (n + 0.5))
        for i, t in toks.items():
            tf = t.count(termo)
            if tf:
                pass  # pont[i] += idf * tf * (k1 + 1) / (tf + k1 * (1 - b + b * len(t) / avgdl))
    return pont


def ranquear(pont):
    return [d for d in sorted(pont, key=lambda d: (-pont[d], d)) if pont[d] > 0]


docs = {"d1": "CalcularJurosCompostosV2 metodo", "d2": "metodo juros", "d3": "metodo geral"}
print(ranquear(pontuar("CalcularJurosCompostosV2 metodo", docs)))
`,
          testes: `DOCS = {
    "d1": "CalcularJurosCompostosV2 metodo",
    "d2": "metodo juros",
    "d3": "metodo geral",
}


def test_termo_raro_pesa_mais():
    r = ranquear(pontuar("CalcularJurosCompostosV2 metodo", DOCS))
    assert r[0] == "d1"


def test_saturacao_decima_ocorrencia_vale_menos():
    docs = {"a": "juros juros x", "b": " ".join(["juros"] * 10) + " x", "c": "outro"}
    p = pontuar("juros", docs, b=0)
    assert p["b"] > p["a"]
    assert p["b"] < 5 * p["a"]


def test_documento_longo_nao_ganha_so_por_ser_longo():
    docs = {"curto": "juros calculo", "longo": "juros calculo " + " ".join(["z"] * 8)}
    p = pontuar("juros calculo", docs)
    assert p["curto"] > p["longo"]


def test_sem_termo_em_comum_pontua_zero_e_fica_fora():
    p = pontuar("timeout", DOCS)
    assert all(v == 0 for v in p.values())
    assert ranquear(p) == []


def test_corpus_vazio_falha():
    try:
        pontuar("x", {})
    except ValueError:
        return
    assert False, "deveria levantar ValueError"
`,
          dica: 'Antes do laço interno: <code>idf = math.log(1 + (N - n + 0.5) / (n + 0.5))</code>. Dentro dele, troque <code>pass</code> pela linha do comentário (sem o <code>#</code>).',
          solucao: `import math
import re


def tokens(texto):
    return re.findall(r"[a-z0-9]+", texto.lower())


def pontuar(consulta, docs, k1=1.5, b=0.75):
    if not docs:
        raise ValueError("corpus vazio")
    toks = {i: tokens(t) for i, t in docs.items()}
    N = len(docs)
    avgdl = sum(len(t) for t in toks.values()) / N
    pont = {i: 0.0 for i in docs}
    for termo in set(tokens(consulta)):
        n = sum(1 for t in toks.values() if termo in t)
        if n == 0:
            continue
        idf = math.log(1 + (N - n + 0.5) / (n + 0.5))
        for i, t in toks.items():
            tf = t.count(termo)
            if tf:
                pont[i] += idf * tf * (k1 + 1) / (tf + k1 * (1 - b + b * len(t) / avgdl))
    return pont


def ranquear(pont):
    return [d for d in sorted(pont, key=lambda d: (-pont[d], d)) if pont[d] > 0]
`,
          tutorDepois: 'O identificador literal, raro no corpus, ganha pelo IDF: é o que o vetor dilui. O Postgres nativo não calcula esse IDF (<code>ts_rank_cd</code> não o tem), e o RRF atenua a diferença porque só usa a ordem.',
          callout: 'IDF, saturação e normalização por tamanho, em código.' },
        { tipo: 'transcript', id: 'm07b4-transcript', titulo: 'Ache as afirmações sem sustentação', obrigatorio: false, terminalTitulo: 'sessão busca-hibrida',
          enunciado: 'O agente diz que "melhorou a busca" ao trocar a fusão. Três afirmações dele contrariam o bloco. Clique nelas e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Troquei a fusão para 0.5 × cosseno + 0.5 × ts_rank. Melhorou a busca?' },
            { quem: 'agente', texto: 'Sim. Normalizei min-max dentro de cada lista, então as escalas ficaram comparáveis.' },
            { quem: 'ferramenta', texto: 'recall@5 em consultas com identificador literal: subiu\nrecall@5 em consultas conceituais: caiu' },
            { quem: 'agente', texto: 'Melhorou no geral: o híbrido sempre bate cada método isolado, então não preciso medir.' },
            { quem: 'agente', texto: 'Fixei peso 0.7 no léxico porque código parece pedir isso.' },
            { quem: 'agente', texto: 'Alternativa: descartar os scores e fundir só pela posição com k = 60 (RRF).' },
            { quem: 'agente', texto: 'Documento que aparece nas duas listas tem consenso; vou expor aparece_em para depurar.' }
          ],
          erradas: [1, 3, 4],
          explicacao: {
            1: 'min-max dentro do resultado faz o melhor de uma lista ruim virar 1,0, e as distribuições mudam por consulta: as escalas não ficaram comparáveis.',
            3: 'o híbrido bate cada método isolado quase sempre, não sempre, e a ferramenta mostrou queda em conceituais. Sem medir é opinião: pergunte qual recall, em que k, em quantas consultas.',
            4: 'peso escolhido por intuição é superstição com números. Meça com o eval do bloco 7 antes de fixar.'
          },
          callout: 'Você achou as três afirmações que o bloco desmente: normalização, "sempre melhora" e peso por intuição.' },
        { tipo: 'takeaway', html: 'Teste o híbrido como <mark>união</mark> dos dois lados e <mark>meça</mark> recall@k e MRR antes de dizer que melhorou.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>A consulta híbrida completa</h3>' +
          '<p>Dois recalls independentes, fundidos por RRF.</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto:
          '-- busca_hibrida.sql\n' +
          'WITH\n' +
          'params AS (\n' +
          '  SELECT $1::vector AS q_vec,   -- embedding da pergunta\n' +
          '         $2::text   AS q_txt,   -- texto da pergunta\n' +
          '         $3::bigint AS p_tenant,\n' +
          '         $4::bigint AS p_repo,\n' +
          '         60 AS k_rrf\n' +
          '),\n' +
          'lexico AS (\n' +
          '  SELECT c.id,\n' +
          '         ROW_NUMBER() OVER (ORDER BY ts_rank_cd(c.tsv, q.query) DESC) AS pos\n' +
          '  FROM chunks c, params p,\n' +
          "       websearch_to_tsquery('simple', (SELECT q_txt FROM params)) AS q(query)\n" +
          '  WHERE c.tenant_id = p.p_tenant      -- ACL SEMPRE primeiro (bloco 6)\n' +
          '    AND c.repo_id = p.p_repo\n' +
          '    AND c.tsv @@ q.query\n' +
          '  LIMIT 50\n' +
          '),\n' +
          'vetorial AS (\n' +
          '  SELECT c.id,\n' +
          '         ROW_NUMBER() OVER (ORDER BY c.embedding <=> p.q_vec) AS pos\n' +
          '  FROM chunks c, params p\n' +
          '  WHERE c.tenant_id = p.p_tenant\n' +
          '    AND c.repo_id = p.p_repo\n' +
          '  ORDER BY c.embedding <=> p.q_vec\n' +
          '  LIMIT 50\n' +
          '),\n' +
          'fusao AS (\n' +
          '  SELECT id, 1.0 / ((SELECT k_rrf FROM params) + pos) AS s FROM lexico\n' +
          '  UNION ALL\n' +
          '  SELECT id, 1.0 / ((SELECT k_rrf FROM params) + pos) AS s FROM vetorial\n' +
          ')\n' +
          'SELECT c.id, c.caminho, c.simbolo, c.linha_ini, c.linha_fim,\n' +
          '       SUM(f.s) AS score_rrf,\n' +
          '       count(*) AS aparece_em          -- 2 = consenso entre os dois métodos\n' +
          'FROM fusao f\n' +
          'JOIN chunks c USING (id)\n' +
          'GROUP BY c.id, c.caminho, c.simbolo, c.linha_ini, c.linha_fim\n' +
          'ORDER BY score_rrf DESC\n' +
          'LIMIT 20;                             -- entra no reranker (bloco 5)' },
        { tipo: 'texto', html:
          '<p>Decisões embutidas, todas defensáveis em review:</p>' +
          '<ul><li><strong>ACL dentro de cada CTE</strong>, antes de qualquer ordenação (regra do bloco 6). Ela reintroduz o over-filtering do bloco 3: rode com <code>hnsw.iterative_scan = relaxed_order</code>.</li>' +
          '<li><strong>50 candidatos por método, 20 na saída.</strong> Recall alto e barato embaixo, precisão em cima. Os 20 vão para o reranker, que devolve 5 para o prompt.</li>' +
          '<li><code>aparece_em</code> é sinal de graça: documento nas duas listas tem consenso; serve para depurar e para o reranker priorizar.</li>' +
          '<li><strong>Ponderação, se precisar:</strong> multiplique cada termo (<code>0.7 * 1.0/(k+pos)</code> no léxico, <code>0.3</code> no vetorial). Em corpus de código um peso maior no léxico costuma ajudar, mas meça com o eval do bloco 7 antes de fixar.</li></ul>' },
        { tipo: 'texto', html:
          '<h3>Métricas de recuperação: o vocabulário que falta</h3>' +
          '<ul><li><strong>Precisão:</strong> dos que trouxe, quantos prestam. <strong>Recall:</strong> dos que prestam, quantos trouxe. Em RAG, <strong>recall@k</strong> (o documento certo está entre os k primeiros?) decide se o sistema consegue responder: se o chunk não veio, nenhum modelo inventa a resposta certa.</li>' +
          '<li><strong>Trade-off:</strong> subir o k sobe o recall e derruba a precisão, e o contexto é caro (M05) e ruído degrada a resposta (context rot). Por isso o funil: recall alto na recuperação (k grande, barato), precisão alta no rerank (k pequeno, caro).</li>' +
          '<li><strong>MRR</strong> (Mean Reciprocal Rank): média de 1/posição do primeiro acerto; mede se o certo vem no topo. <strong>nDCG</strong>: considera relevância graduada e desconta por posição; é a métrica padrão quando há níveis de relevância.</li></ul>' },
        { tipo: 'escolha', id: 'm07b4-escolha-tsquery', titulo: 'Confira: entrada livre do usuário',
          pergunta: 'A API recebe o texto digitado pelo usuário, como <code>validar "CNPJ" -teste</code>, e monta a consulta léxica. Qual é a escolha correta?',
          opcoes: [
            opc('a', '<code>to_tsquery(\'simple\', texto)</code>, que é a forma padrão.', false, 'to_tsquery exige sintaxe válida e levanta erro com entrada livre.'),
            opc('b', '<code>websearch_to_tsquery(\'simple\', texto)</code>, que aceita a sintaxe de buscador e não explode.', true, 'é a função indicada para entrada livre, junto com plainto_tsquery.'),
            opc('c', '<code>ts_rank_cd(tsv, texto)</code>, que já transforma o texto em consulta.', false, 'ts_rank_cd pontua um tsvector contra uma tsquery; não a constrói.'),
            opc('d', 'Concatenar o texto numa string SQL e usar <code>@@</code> direto.', false, 'além de não ser consulta válida, concatenar entrada do usuário em SQL é injeção.')
          ], tutorDepois: 'Entrada livre: websearch_to_tsquery ou plainto_tsquery.' },
        { tipo: 'escolha', id: 'm07b4-escolha-k', titulo: 'Confira: aumentar o k',
          pergunta: 'O recall@5 está baixo e alguém propõe passar o prompt de 5 para 50 chunks. Qual é o raciocínio do funil?',
          opcoes: [
            opc('a', 'Mandar 50 resolve: mais chunks sempre ajudam o modelo.', false, 'subir o k sobe o recall e derruba a precisão; ruído degrada a resposta (context rot).'),
            opc('b', 'Recall alto na recuperação (k grande, barato) e precisão alta no rerank (k pequeno, caro): reordene os 20 do híbrido e mande 5.', true, 'é exatamente o funil: 50 candidatos por método, 20 na saída, 5 para o prompt.'),
            opc('c', 'Trocar RRF por soma de scores para subir o recall.', false, 'a soma de scores de escalas incomparáveis piora a fusão.'),
            opc('d', 'Remover o filtro de tenant para ampliar a busca.', false, 'a ACL é regra de segurança e fica antes da relevância.')
          ], tutorDepois: 'Recall embaixo, precisão em cima.' },
        { tipo: 'takeaway', html: 'Funil: <mark>50 por método, 20 fundidos, 5 no prompt</mark>, com a <mark>ACL em cada CTE</mark> e o peso medido no eval.' }
      ] }
    ]
  });
})();
