/* M07 · Bloco 1: embeddings por dentro. Fonte: M07.html#b01. Sondas do rode usam um embedder de brinquedo (bolsa de conceitos), não um modelo real. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasSondas = function () {
    return [
      { id: 'setup', nome: 'Embedder falso', descricao: 'Vetor de 10 conceitos; palavra fora do léxico some', tom: 'dns', ms: 3, linhas: [
        L('cmd', 'python sondas.py'),
        L('info', 'embedder de brinquedo: cada palavra conhecida soma 1 na sua dimensão; "não", "sem", "com" e "V2" não estão no léxico'),
        L('hint', 'não é um modelo real: serve para tornar observável o que um vetor perde')] },
      { id: 'negacao', nome: 'Negação', descricao: 'Com e sem na mesma consulta', tom: 'tcp', ms: 6, linhas: [
        L('out', 'cos("métodos que validam entrada", "métodos que validam entrada")      = 1.000'),
        L('out', 'cos("métodos que validam entrada", "métodos que não validam entrada")  = 1.000'),
        L('out', 'cos("métodos que validam entrada", "configurar timeout conexão")       = 0.000'),
        L('hint', 'o documento que NÃO valida empata com o que valida: a ordenação não distingue as duas perguntas')] },
      { id: 'ident', nome: 'Identificador exato', descricao: 'CalcularJurosCompostosV2 contra paráfrases', tom: 'tls', ms: 8, linhas: [
        L('out', 'cos("CalcularJurosCompostosV2", "CalcularJurosCompostosV2")     = 1.000'),
        L('out', 'cos("CalcularJurosCompostosV2", "cálculo de juros compostos")   = 1.000'),
        L('out', 'cos("CalcularJurosCompostosV2", "CalcularJurosSimplesV1")        = 0.667'),
        L('out', 'cos("CalcularJurosCompostosV2", "cálculo de juros")             = 0.816'),
        L('hint', 'a paráfrase genérica empata com o identificador literal; só a busca léxica diferencia os dois (bloco 4)')] },
      { id: 'veredito', nome: 'Leitura', descricao: 'O que a similaridade mede', tom: 'ink', ms: 3, linhas: [
        L('in', 'similaridade é proximidade de assunto, não lógica nem identidade'),
        L('hint', 'valores absolutos mudam por modelo; o que importa é a ordenação relativa')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm07-b1',
    titulo: 'Embeddings por dentro: o que o vetor sabe e o que não sabe',
    minutos: 30,
    resumo: 'Embedding casa ideias, não palavras, e por isso erra negação, números, identificadores exatos, relações e versões. Saber a lista permite prever onde o RAG falha.',
    objetivo: 'Calcular similaridade de cosseno, nomear as cinco coisas que o embedding não captura com o antídoto de cada uma, distinguir similaridade de relevância e planejar a migração de modelo sem misturar vetores.',
    revisao: [
      { id: 'm07b1-negacao', pergunta: 'Um usuário busca "métodos que não validam entrada" e o RAG devolve os que validam. Qual limitação explica?',
        opcoes: [
          opc('a', 'Negação: "com" e "sem" ficam próximos no espaço vetorial', true, 'o embedding mede proximidade de assunto, não lógica; a negação precisa de filtro estruturado, reescrita de query ou grafo.'),
          opc('b', 'A dimensão do vetor é pequena demais', false, 'dimensão é parâmetro de configuração; nenhuma dimensão ensina negação ao vetor.'),
          opc('c', 'A métrica deveria ser euclidiana', false, 'trocar de métrica não muda o limite do modelo.')] },
      { id: 'm07b1-simrel', pergunta: 'Qual é a diferença entre similaridade e relevância?',
        opcoes: [
          opc('a', 'Similaridade é geométrica entre dois vetores; relevância é da relação entre documento e necessidade de informação', true, 'por isso a similaridade é candidato barato (funil), não veredito.'),
          opc('b', 'São o mesmo conceito com nomes diferentes', false, 'um documento pode ser muito parecido com a pergunta e inútil, ou pouco parecido e essencial.'),
          opc('c', 'Relevância é o cosseno normalizado', false, 'normalizar muda a escala, não a natureza: o cosseno continua medindo só a geometria.')] },
      { id: 'm07b1-migracao', pergunta: 'Você vai trocar o modelo de embedding. Qual plano evita mistura silenciosa de vetores?',
        opcoes: [
          opc('a', 'Coluna ou tabela nova, reindexação em background com cache, validação com o eval de recuperação e só então trocar a leitura (blue-green)', true, 'vetores de modelos, versões ou dimensões diferentes não são comparáveis.'),
          opc('b', 'Reembedar só os documentos novos com o modelo novo', false, 'mistura dois espaços na mesma coluna: ruído com aparência de busca.'),
          opc('c', 'Truncar ou preencher com zeros os vetores antigos', false, 'gera coordenadas sem significado.')] },
      { id: 'm07b1-metrica', pergunta: 'Qual é o erro de métrica que realmente importa?',
        opcoes: [
          opc('a', 'Indexar com uma métrica e consultar com outra', true, 'o índice é construído para uma métrica; consultar com outra devolve resultado silenciosamente ruim.'),
          opc('b', 'Usar cosseno em vez de euclidiana quando o modelo indica cosseno', false, 'seguir a doc do modelo é a regra prática.'),
          opc('c', 'Normalizar os vetores e usar produto interno', false, 'com vetores normalizados o produto interno equivale ao cosseno e é mais rápido.')] },
      { id: 'm07b1-modelo-col', pergunta: 'Por que gravar embedding_model em cada linha, e não só o vetor?',
        opcoes: [
          opc('a', 'Sem isso não se consegue nem detectar a mistura de modelos na mesma coluna', true, 'a coluna é a primeira defesa da migração blue-green.'),
          opc('b', 'O Postgres exige o nome do modelo para criar o índice', false, 'o índice só conhece o tipo e a métrica do vetor.'),
          opc('c', 'Para o embedding mudar sozinho a cada versão', false, 'o embedding é determinístico: mesmo texto e mesmo modelo dão o mesmo vetor.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>O RAG que falha tem um padrão</h3>' +
          '<p>As falhas mais comuns de RAG em produção saem das propriedades que a frase "transforma texto em vetor e a busca funciona" esconde: o sistema não entende negação, é ruim com números e datas, confunde "parecido" com "relevante" e quebra em silêncio no dia em que você troca o modelo. Saber o que o vetor sabe permite prever onde o RAG vai errar e projetar o híbrido do bloco 4 para cobrir a lacuna.</p>' },
        { tipo: 'texto', html:
          '<h3>O que é um embedding</h3>' +
          '<p>Um <strong>embedding</strong> é a representação de um texto como um vetor de números reais de dimensão fixa (tipicamente de 384 a 3.072), produzido por um modelo treinado para que textos de significado próximo fiquem próximos no espaço. Cada dimensão é uma coordenada aprendida, sem nome nem significado isolado. O modelo é um transformer encoder (o M11 abre a caixa) que roda uma vez por texto.</p>' +
          '<p>É uma função <strong>determinística</strong>: o mesmo texto com o mesmo modelo dá exatamente o mesmo vetor. É por isso que o cache de embeddings do M05 (bloco 5) funciona sem invalidação.</p>' +
          '<p>Duas intuições. Embedding é um <strong>hash semântico e contínuo</strong>: o hash tradicional faz entradas parecidas gerarem saídas muito diferentes (avalanche); o embedding faz o oposto. E a busca full-text casa <em>palavras</em>, enquanto o embedding casa <em>ideias</em>: "como o sistema autentica usuários" encontra um arquivo que só fala em login e validação de credenciais, sem a palavra "autenticação".</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Métricas de distância</h3>' +
          '<p>A escolha quase não importa, mas o detalhe importa. Use a métrica que o fornecedor do modelo indica (quase sempre cosseno); se os vetores já vierem normalizados, prefira produto interno, que é mais rápido.</p>' +
          '<table><thead><tr><th>Métrica</th><th>Operador pgvector</th><th>O que mede</th><th>Quando usar</th></tr></thead><tbody>' +
          '<tr><td>Cosseno</td><td><code>&lt;=&gt;</code></td><td>Ângulo entre os vetores (ignora magnitude)</td><td>Padrão para texto; é o que quase todo modelo espera</td></tr>' +
          '<tr><td>Produto interno (negativo)</td><td><code>&lt;#&gt;</code></td><td>Projeção; equivale ao cosseno se os vetores estiverem normalizados</td><td>Vetores já normalizados: é mais rápido</td></tr>' +
          '<tr><td>Euclidiana (L2)</td><td><code>&lt;-&gt;</code></td><td>Distância em linha reta</td><td>Alguns modelos são treinados para L2; siga a doc do modelo</td></tr>' +
          '<tr><td>L1 / Manhattan</td><td><code>&lt;+&gt;</code></td><td>Soma das diferenças absolutas</td><td>Raro em texto</td></tr>' +
          '<tr><td>Hamming / Jaccard</td><td><code>&lt;~&gt;</code> / <code>&lt;%&gt;</code></td><td>Diferença entre vetores binários</td><td>Quantização binária (bloco 3)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'O erro de métrica que importa', html:
          '<p>Não é escolher a métrica "errada". É <strong>indexar com uma métrica e consultar com outra</strong>: o índice do bloco 3 é construído para uma delas, e o resultado vira ruim sem nenhum erro visível.</p>' },
        { tipo: 'takeaway', html: 'Embedding é <mark>determinístico</mark> e casa <mark>ideias</mark>; indexe e consulte com a <mark>mesma métrica</mark>, a que o modelo indica.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>As cinco coisas que o embedding não captura</h3>' +
          '<p>Esta é a lista mais valiosa do bloco: cada item é uma classe de pergunta que o seu RAG vai errar, e cada um tem um antídoto que os blocos seguintes constroem.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Limitação</th><th>Exemplo no seu corpus</th><th>Antídoto</th></tr></thead><tbody>' +
          '<tr><td>Negação: "com" e "sem" ficam próximos</td><td>"métodos que não validam entrada" traz os que validam</td><td>Filtro estruturado; reescrita de query (b5); grafo (M10)</td></tr>' +
          '<tr><td>Números e datas: "1.000" e "10.000" são vizinhos</td><td>"pagamentos acima de R$ 5.000" não filtra valor</td><td>Extrair para metadado e filtrar em SQL (b3/b6)</td></tr>' +
          '<tr><td>Identificadores exatos: nome raro dilui no vetor</td><td><code>CalcularJurosCompostosV2</code> perde para "cálculo de juros"</td><td>Busca léxica no híbrido (b4): a principal razão de o híbrido existir</td></tr>' +
          '<tr><td>Estrutura e relação: o vetor não sabe quem chama quem</td><td>"O que quebra se eu mudar este método?"</td><td>Grafo (M10); guarde essa pergunta</td></tr>' +
          '<tr><td>Recência e versão: o vetor não tem tempo</td><td>A doc antiga e a nova são igualmente "relevantes"</td><td>Metadado de versão ou status e filtro (b6)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Agora veja duas falhas acontecerem. O embedder abaixo é um brinquedo (cada palavra conhecida soma 1 numa dimensão; palavra fora do léxico some), não um modelo real: ele torna visível o que um vetor perde. Antes de rodar, preveja o que acontece com a negação.</p>' },
        { tipo: 'rode', id: 'm07b1-rode', titulo: 'Provoque a falha de negação e de identificador', enunciado: 'Rode as sondas com o embedder falso. Cada linha mostra o cosseno entre a consulta e um documento.',
          prefixo: '$', entrada: 'python sondas.py', unidade: 'sondas', terminalTitulo: 'sondas', etapas: etapasSondas(),
          prever: { pergunta: 'Consulta "métodos que validam entrada" contra o documento "métodos que não validam entrada": o que o cosseno mostra?', opcoes: [
            { id: 'a', texto: 'Um valor bem baixo, porque o "não" inverte o sentido.', correta: false, porque: 'o vetor não faz lógica; a palavra "não" não inverte coordenada nenhuma.' },
            { id: 'b', texto: 'Um valor idêntico ao do documento que valida: a negação some.', correta: true, porque: 'o embedding mede proximidade de assunto, e o assunto dos dois documentos é o mesmo.' },
            { id: 'c', texto: 'Um valor negativo, que sinaliza oposição.', correta: false, porque: 'cosseno negativo indica direções opostas no espaço, não negação lógica no texto.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Clique em "Identificador exato" para ler só essas linhas.',
          tutorDepois: 'A negação não mudou a ordenação, e a paráfrase "cálculo de juros compostos" empatou com o identificador literal. Em modelo real os valores mudam, mas a classe de erro é a mesma, e é a justificativa do híbrido (bloco 4) e dos filtros estruturados.',
          callout: 'Você viu a negação desaparecer e a paráfrase empatar com o identificador literal.' },
        { tipo: 'takeaway', html: 'O vetor <mark>não faz lógica</mark> e dilui o <mark>identificador exato</mark>: cada limite tem antídoto nos próximos blocos.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Similaridade não é relevância</h3>' +
          '<p><strong>Similaridade</strong> é uma propriedade geométrica entre dois vetores. <strong>Relevância</strong> é uma propriedade da relação entre um documento e uma necessidade de informação. O buscador só mede a primeira. "Como configurar o timeout?" casa perfeitamente com um arquivo que discute timeouts sem dizer como configurá-los; e a resposta pode estar num arquivo de configuração sem uma palavra da pergunta.</p>' +
          '<p>Consequência de projeto: a similaridade é um <strong>candidato barato</strong>, não um veredito. A arquitetura correta é um funil: recuperar muitos candidatos baratos (b4), reordenar poucos com um modelo caro que enxerga a relação pergunta e documento (b5) e cortar o que não passa do limiar (b6).</p>' },
        { tipo: 'python', id: 'm07b1-python', titulo: 'Cosseno com guarda de dimensão',
          enunciado: 'Complete <code>cosseno(a, b)</code> e <code>normalizar(v)</code> com listas, sem numpy. O cosseno é <code>produto / (norma(a) * norma(b))</code> e devolve <code>0.0</code> se alguma norma for zero. A guarda de dimensão (<code>produto</code>) já existe: vetores de dimensões diferentes vêm de modelos diferentes e não são comparáveis.',
          codigo: `import math


def produto(a, b):
    if len(a) != len(b):
        raise ValueError("dimensões diferentes: modelos não comparáveis")
    return sum(x * y for x, y in zip(a, b))


def norma(v):
    return math.sqrt(produto(v, v))


def cosseno(a, b):
    # 1. se norma(a) ou norma(b) for 0, devolva 0.0
    # 2. senão devolva produto(a, b) / (norma(a) * norma(b))
    return 0.0


def normalizar(v):
    # divida cada coordenada pela norma; vetor zero volta igual
    return list(v)


print(cosseno([1, 2, 3], [2, 4, 6]))
`,
          testes: `def aprox(x, y):
    return abs(x - y) < 1e-9


def test_vetores_iguais():
    assert aprox(cosseno([1, 2, 3], [1, 2, 3]), 1.0)


def test_ignora_magnitude():
    assert aprox(cosseno([1, 2], [2, 4]), 1.0)


def test_ortogonais():
    assert aprox(cosseno([1, 0], [0, 1]), 0.0)


def test_vetor_zero_nao_divide():
    assert cosseno([0, 0], [1, 1]) == 0.0


def test_dimensao_diferente_falha():
    try:
        cosseno([1, 2], [1, 2, 3])
    except ValueError:
        return
    assert False, "deveria levantar ValueError"


def test_produto_interno_normalizado_igual_cosseno():
    a, b = [3, 4, 1], [1, 5, 2]
    assert aprox(produto(normalizar(a), normalizar(b)), cosseno(a, b))


def test_normalizar_tem_norma_um_e_zero_fica_zero():
    assert aprox(norma(normalizar([3, 4])), 1.0)
    assert normalizar([0, 0]) == [0, 0]
`,
          dica: 'No <code>normalizar</code>, calcule <code>n = norma(v)</code> e devolva <code>[x / n for x in v]</code>, tratando <code>n == 0</code> antes. Reuse <code>produto</code> e <code>norma</code> no cosseno.',
          solucao: `import math


def produto(a, b):
    if len(a) != len(b):
        raise ValueError("dimensões diferentes: modelos não comparáveis")
    return sum(x * y for x, y in zip(a, b))


def norma(v):
    return math.sqrt(produto(v, v))


def cosseno(a, b):
    na, nb = norma(a), norma(b)
    if na == 0 or nb == 0:
        return 0.0
    return produto(a, b) / (na * nb)


def normalizar(v):
    n = norma(v)
    if n == 0:
        return list(v)
    return [x / n for x in v]
`,
          tutorDepois: 'Com vetores normalizados o produto interno é o cosseno, por isso o pgvector oferece <code>&lt;#&gt;</code> como atalho mais rápido. E a guarda de dimensão é o primeiro sinal barato de mistura de modelos.',
          callout: 'Cosseno, normalização e a guarda contra mistura de dimensões, em código.' },
        { tipo: 'complete', id: 'm07b1-complete', titulo: 'Casar métrica, operador e classe do índice', obrigatorio: false, linguagem: 'sql',
          enunciado: 'O modelo indica cosseno. Escolha, em cada lacuna, a peça que mantém o índice e a consulta na mesma métrica.',
          partes: [
            'CREATE INDEX ix_chunks_embedding ON chunks\n  USING hnsw (embedding ', { lacuna: 'ops', opcoes: ['vector_cosine_ops', 'vector_l2_ops', 'vector_ip_ops'], correta: 'vector_cosine_ops' },
            ');\n\nSELECT id FROM chunks\nORDER BY embedding ', { lacuna: 'op', opcoes: ['<=>', '<->', '<#>'], correta: '<=>' },
            ' $1\nLIMIT 10;\n'
          ],
          explicacao: 'A classe do operador do índice (<code>vector_cosine_ops</code>) e o operador da consulta (<code>&lt;=&gt;</code>) precisam ser a mesma métrica. Indexar com <code>vector_l2_ops</code> e consultar com <code>&lt;=&gt;</code> não dá erro: dá resultado silenciosamente ruim.',
          callout: 'Índice e consulta falam a mesma métrica.' },
        { tipo: 'escolha', id: 'm07b1-escolha-funil', titulo: 'Confira: o papel da similaridade',
          pergunta: 'A pergunta "como configurar o timeout?" traz no topo um arquivo que discute timeouts sem dizer como configurá-los. Qual leitura está correta?',
          opcoes: [
            opc('a', 'Similaridade alta não garante relevância: use a similaridade como candidato barato e reordene com um modelo que vê a relação pergunta e documento.', true, 'é o funil: recuperar muitos candidatos baratos, reordenar poucos com modelo caro e cortar o que não passa do limiar.'),
            opc('b', 'O embedding está quebrado; troque a dimensão do vetor.', false, 'não há defeito: o vetor mediu proximidade de assunto, como projetado.'),
            opc('c', 'Aumente o k até o arquivo certo aparecer, sem mais mudanças.', false, 'subir o k sobe o recall e derruba a precisão; o contexto é caro e o ruído degrada a resposta.'),
            opc('d', 'Use a similaridade como veredito final e pare de reordenar.', false, 'é usar um estimador como decisão.')
          ], tutorDepois: 'Similaridade é candidato, relevância é veredito.' },
        { tipo: 'takeaway', html: 'Similaridade é um <mark>candidato barato</mark>; a decisão fica no <mark>funil</mark> (recuperar muito, reordenar pouco, cortar por limiar).' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Escolher o modelo</h3>' +
          '<p>Critérios, em ordem de peso para o caso do Capstone:</p>' +
          '<ul>' +
          '<li><strong>Qualidade no seu domínio.</strong> Leaderboards públicos como o MTEB dão a média em texto geral; código é outro domínio, e modelos especializados em código costumam ganhar.</li>' +
          '<li><strong>Dimensão.</strong> Mais dimensões custam mais memória e índice maior, com ganho decrescente; alguns modelos suportam truncar o vetor com perda pequena.</li>' +
          '<li><strong>Custo por milhão de tokens.</strong></li>' +
          '<li><strong>Rodar local</strong> (M11), porque o produto vende "o código não sai da rede do cliente".</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'A migração de embedding é o dia mais caro do RAG', html:
          '<p>Vetores de modelos diferentes <strong>não são comparáveis</strong>: nem entre fornecedores, nem entre versões do mesmo modelo, nem entre dimensões do mesmo modelo. Trocar de modelo significa reindexar o corpus inteiro. Três decisões de hoje evitam o sofrimento de depois:</p>' +
          '<ul><li>Grave o modelo e a versão em cada linha (coluna <code>embedding_model</code>), nunca só o vetor.</li>' +
          '<li>Nunca misture vetores de modelos diferentes na mesma coluna ou índice: o resultado é ruído com aparência de busca.</li>' +
          '<li>Planeje como <strong>blue-green</strong>: coluna ou tabela nova, reindexação em background (o cache de embeddings do M05 evita recomputar o que não mudou), validação com o eval de recuperação (b7) e só então a troca do caminho de leitura.</li></ul>' },
        { tipo: 'ordene', id: 'm07b1-ordene', titulo: 'Ponha a migração de modelo na ordem', obrigatorio: false,
          enunciado: 'Ordene os passos da migração blue-green do modelo de embedding, do primeiro ao último.',
          itens: [
            { id: 'troca', texto: 'Trocar o caminho de leitura para a coluna nova' },
            { id: 'valida', texto: 'Validar com o eval de recuperação (recall) sobre a coluna nova' },
            { id: 'nova', texto: 'Criar coluna ou tabela nova com o modelo e a versão gravados em cada linha' },
            { id: 'reindex', texto: 'Reindexar em background, reaproveitando o cache de embeddings do que não mudou' }
          ],
          solucao: ['nova', 'reindex', 'valida', 'troca'],
          dica: 'Antes de trocar a leitura, a coluna nova precisa existir, estar populada e ter sido medida.',
          callout: 'Migração em ordem: nova coluna, reindexação, validação, troca.' },
        { tipo: 'escolha', id: 'm07b1-escolha-metrica', titulo: 'Confira: a consulta na métrica errada',
          pergunta: 'O índice foi criado com <code>vector_l2_ops</code> e a consulta usa <code>&lt;=&gt;</code> (cosseno). O que esperar?',
          opcoes: [
            opc('a', 'Um erro de sintaxe na primeira consulta.', false, 'não há erro: a consulta roda normalmente.'),
            opc('b', 'Resultados silenciosamente ruins, porque o índice foi construído para outra métrica.', true, 'é o erro de métrica que importa: indexar com uma e consultar com outra.'),
            opc('c', 'Resultados idênticos, pois toda métrica ordena igual.', false, 'a escolha quase não importa, mas o detalhe de casar índice e consulta importa.'),
            opc('d', 'O Postgres reconstrói o índice com a métrica da consulta.', false, 'o índice não muda sozinho.')
          ], tutorDepois: 'Mesma métrica na criação do índice e na consulta, sempre a que o modelo indica.' },
        { tipo: 'escolha', id: 'm07b1-escolha-modelo', titulo: 'Confira: reembedar só os novos',
          pergunta: 'A equipe propõe: "trocar o nome do modelo na configuração e reembedar só os documentos novos". O que isso causa?',
          opcoes: [
            opc('a', 'Nada de grave: o índice HNSW reconcilia os espaços.', false, 'o índice não traduz entre espaços vetoriais.'),
            opc('b', 'Mistura de vetores de dois modelos na mesma coluna: ruído com aparência de busca, sem coluna que permita nem detectar.', true, 'por isso grava-se <code>embedding_model</code> em cada linha e a migração é blue-green.'),
            opc('c', 'Só custo extra de armazenamento.', false, 'o problema é a qualidade da busca, não o armazenamento.'),
            opc('d', 'Uma queda de recall que desaparece com um ef_search maior.', false, 'ef_search ajusta o índice, não torna comparáveis vetores de modelos diferentes.')
          ], tutorDepois: 'Sem <code>embedding_model</code> por linha, a mistura é invisível.' },
        { tipo: 'takeaway', html: 'Grave o <mark>modelo em cada linha</mark> e migre em <mark>blue-green</mark>: vetores de modelos diferentes <mark>não se comparam</mark>.' }
      ] }
    ]
  });
})();
