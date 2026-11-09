/* M07 · Bloco 3: pgvector. Fonte: M07.html#b03 (iterative scan: pgvector 0.8 em diante, conforme a fonte). O rode usa o modelo simplificado de valor esperado do simulador do módulo, não uma medição de pgvector. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasOver = function () {
    return [
      { id: 'cfg', nome: 'Configuração', descricao: 'ef_search = 40, LIMIT = 10, tenant com 1% do corpus', tom: 'dns', ms: 3, linhas: [
        L('cmd', 'python over_filtering.py --share 0.01 --ef 40 --limit 10'),
        L('info', 'modelo simplificado (valor esperado): o índice visita ef_search candidatos e o WHERE descarta os que não são do tenant'),
        L('hint', 'estimativa para dar intuição; não é uma medição de pgvector')] },
      { id: 'sem', nome: 'Sem iterative scan', descricao: 'Visita 40 candidatos', tom: 'tcp', ms: 40, linhas: [
        L('out', 'Sem iterative scan: visita 40 candidatos, cerca de 0.4 são do tenant.'),
        L('out', 'Devolve ~0 de 10 linhas pedidas.'),
        L('hint', 'over-filtering: o sistema é seguro e inútil; havendo milhares de linhas do tenant, o índice só viu candidatos de outros')] },
      { id: 'maior', nome: 'Tenant maior (10%)', descricao: 'Mesmo ef_search, fatia maior', tom: 'tls', ms: 40, linhas: [
        L('cmd', 'python over_filtering.py --share 0.10 --ef 40 --limit 10'),
        L('out', 'Sem iterative scan: visita 40 candidatos, cerca de 4.0 são do tenant.'),
        L('out', 'Devolve ~4 de 10 linhas pedidas.'),
        L('hint', 'com tenants pequenos o resultado desaba; só com tenants grandes o filtro não machuca')] },
      { id: 'iter', nome: 'Com iterative scan', descricao: 'hnsw.iterative_scan = relaxed_order', tom: 'request', ms: 1000, linhas: [
        L('cmd', 'python over_filtering.py --share 0.01 --ef 40 --limit 10 --iterative'),
        L('out', 'Com iterative scan: o índice continua buscando até juntar 10 resultados ou bater o teto (20.000 tuplas).'),
        L('out', 'Visita ~1000 candidatos e devolve ~10 de 10.'),
        L('hint', 'custo: latência maior, 25x mais candidatos que o ef_search')] },
      { id: 'teto', nome: 'Teto de max_scan_tuples', descricao: 'Tenant com 0,01% do corpus', tom: 'response', ms: 20000, linhas: [
        L('cmd', 'python over_filtering.py --share 0.0001 --ef 40 --limit 10 --iterative'),
        L('out', 'Visita ~20000 candidatos e devolve ~2 de 10.'),
        L('hint', 'o teto foi atingido: tenant pequeno demais para este índice; considere índice parcial ou partição')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm07-b3',
    titulo: 'pgvector: tipos, operadores, HNSW × IVFFlat e tuning',
    minutos: 40,
    resumo: 'O índice vetorial é aproximado: troca exatidão por velocidade e aplica o WHERE depois de percorrer o índice. Operar o índice é dimensionar memória, escolher HNSW e tratar over-filtering.',
    objetivo: 'Dimensionar memória por tipo de vetor, escolher HNSW ou IVFFlat com seus parâmetros, ajustar hnsw.ef_search e resolver o over-filtering causado pelo filtro de tenant.',
    revisao: [
      { id: 'm07b3-overfilter', pergunta: 'WHERE tenant_id = 42 ORDER BY embedding <=> $1 LIMIT 10 devolve só 2 linhas, havendo milhares do tenant. Qual a causa?',
        opcoes: [
          opc('a', 'O índice ANN percorre candidatos primeiro (ef_search = 40) e aplica o WHERE depois; quase todos eram de outros tenants', true, 'é over-filtering; soluções: iterative scan, índice parcial ou pré-filtro em CTE com busca exata.'),
          opc('b', 'Bug do pgvector: o LIMIT é ignorado quando há WHERE', false, 'não é bug, é a natureza do índice aproximado.'),
          opc('c', 'Falta VACUUM na tabela', false, 'VACUUM não explica o filtro depois do índice.')] },
      { id: 'm07b3-ef', pergunta: 'hnsw.ef_search = 40 e a consulta pede LIMIT 50. O que esperar?',
        opcoes: [
          opc('a', 'O recall despenca: ef_search precisa ser pelo menos o LIMIT (regra prática: 2 a 4 vezes o k)', true, 'o índice não devolve 50 vizinhos de uma lista de 40 candidatos.'),
          opc('b', 'Nada muda: o LIMIT é aplicado depois', false, 'o limite de candidatos vem de ef_search.'),
          opc('c', 'Erro de sintaxe', false, 'a consulta roda; o recall é que cai.')] },
      { id: 'm07b3-hnsw', pergunta: 'Qual a decisão do curso entre HNSW e IVFFlat, e quando o IVFFlat ganha?',
        opcoes: [
          opc('a', 'HNSW, salvo se o build ficar proibitivo; o IVFFlat só ganha quando você reindexa tudo o tempo todo e o build domina o custo', true, 'HNSW incorpora bem dados novos e tem melhor recall × velocidade; IVFFlat degrada e pede REINDEX.'),
          opc('b', 'IVFFlat sempre, porque o build é rápido', false, 'os clusters envelhecem com dados novos.'),
          opc('c', 'Tanto faz: os dois têm os mesmos parâmetros', false, 'HNSW usa m, ef_construction e ef_search; IVFFlat usa lists e probes.')] },
      { id: 'm07b3-memoria', pergunta: 'Quanto ocupam 1 milhão de chunks com 1.536 dimensões em vector, sem índice?',
        opcoes: [
          opc('a', 'Cerca de 6,2 GB (4 × dim + 8 bytes por vetor); em halfvec, cerca de 3,1 GB', true, 'memória é o recurso que limita o pgvector: se o índice não cabe na RAM, a latência despenca.'),
          opc('b', 'Cerca de 1,5 GB', false, 'vector usa float32: 4 bytes por dimensão, mais 8 de cabeçalho.'),
          opc('c', 'Cerca de 62 GB', false, 'é uma ordem de grandeza acima do cálculo 4 × 1.536 + 8 bytes por vetor.')] },
      { id: 'm07b3-ordem', pergunta: 'Qual o primeiro item do tuning de build de índice vetorial?',
        opcoes: [
          opc('a', 'Carregar os dados antes de criar o índice', true, 'build sobre tabela cheia é muito mais rápido que inserção incremental em índice existente.'),
          opc('b', 'Aumentar ef_search globalmente', false, 'ef_search é por consulta, não global.'),
          opc('c', 'Trocar para halfvec', false, 'halfvec entra se a memória apertar, mais adiante na lista.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>A tese do Postgres único</h3>' +
          '<p>No ADR-0001 (M04, bloco 3) a decisão foi um só Postgres, com pgvector e AGE, em vez de banco vetorial dedicado mais banco de grafo. A tese: para o volume de um micro-SaaS, pgvector entrega recall e latência suficientes, e a economia de operar <strong>um</strong> banco (transação única, backup único, RLS único, um container no cliente) supera o ganho marginal de um vetorial dedicado. Passando de certa escala, a conta muda, e você vai saber medir quando. Este bloco é onde a decisão se paga ou se prova errada.</p>' },
        { tipo: 'texto', html:
          '<h3>Um índice que erra de propósito</h3>' +
          '<p>O índice vetorial é <strong>aproximado</strong> (ANN, approximate nearest neighbor). Um índice B-tree sempre encontra a linha; o ANN pode não devolver o vizinho real. Exatidão é trocada por velocidade numa taxa configurável, e isso é a fonte de metade das surpresas do bloco.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Tipos de vetor</h3>' +
          '<table><thead><tr><th>Tipo</th><th>Armazenamento</th><th>Dimensões (máx. armazenar / indexar)</th><th>Quando usar</th></tr></thead><tbody>' +
          '<tr><td><code>vector</code></td><td>float32: 4×dim + 8 bytes</td><td>16.000 / 2.000</td><td>Padrão</td></tr>' +
          '<tr><td><code>halfvec</code></td><td>float16: 2×dim + 8 bytes</td><td>16.000 / 4.000</td><td>Metade da memória com perda pequena de recall; permite indexar dimensões maiores</td></tr>' +
          '<tr><td><code>bit</code></td><td>dim/8 + 8 bytes</td><td>64.000 / 64.000</td><td>Quantização binária: 32x menos espaço, usada como primeiro filtro com rerank exato depois</td></tr>' +
          '<tr><td><code>sparsevec</code></td><td>8×não-zeros + 16 bytes</td><td>16.000 não-zeros</td><td>Vetores esparsos (SPLADE e afins)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Faça a conta antes de escolher a dimensão', html:
          '<p>1 milhão de chunks × 1.536 dimensões em <code>vector</code> são cerca de <strong>6,2 GB</strong> só de vetores, sem índice. Em <code>halfvec</code>, cerca de 3,1 GB. O índice HNSW soma um tanto por cima. Memória é o recurso que limita o pgvector: se o índice não cabe na RAM, a latência despenca.</p>' },
        { tipo: 'takeaway', html: 'O índice é <mark>aproximado</mark> e a <mark>memória</mark> é o limite: calcule bytes por vetor antes de escolher a dimensão.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>O schema do Capstone</h3>' +
          '<p>Extensão, tabela e índices numa migration Alembic (M03, bloco 2). Os campos vêm da tabela de metadados do bloco 2.</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto:
          'CREATE EXTENSION IF NOT EXISTS vector;\n' +
          'CREATE TABLE chunks (\n' +
          '  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n' +
          '  tenant_id bigint NOT NULL REFERENCES tenants(id),\n' +
          '  repo_id bigint NOT NULL REFERENCES repos(id),\n' +
          '  caminho text NOT NULL,\n' +
          '  simbolo text NOT NULL,\n' +
          '  tipo text NOT NULL,            -- classe | metodo | config | doc | teste\n' +
          '  linguagem text NOT NULL,\n' +
          '  linha_ini int NOT NULL,\n' +
          '  linha_fim int NOT NULL,\n' +
          '  conteudo text NOT NULL,        -- já com o contexto prepensado (b2)\n' +
          '  hash_conteudo text NOT NULL,\n' +
          '  embedding_model text NOT NULL, -- b1: nunca omita\n' +
          '  embedding vector(1536),\n' +
          '  tsv tsvector GENERATED ALWAYS AS   -- b4: o lado léxico\n' +
          "    (to_tsvector('simple', coalesce(simbolo,'') || ' ' || conteudo)) STORED,\n" +
          "  visibilidade text NOT NULL DEFAULT 'interna',\n" +
          '  versao_commit text NOT NULL,\n' +
          '  criado_em timestamptz NOT NULL DEFAULT now(),\n' +
          '  UNIQUE (repo_id, caminho, simbolo, versao_commit)\n' +
          ');\n' +
          '-- filtros que SEMPRE acompanham a busca (b6)\n' +
          'CREATE INDEX ix_chunks_tenant_repo ON chunks (tenant_id, repo_id);\n' +
          'CREATE INDEX ix_chunks_tipo ON chunks (tenant_id, tipo);\n' +
          '-- índice léxico (b4)\n' +
          'CREATE INDEX ix_chunks_tsv ON chunks USING gin (tsv);\n' +
          '-- índice vetorial (este bloco)\n' +
          'CREATE INDEX ix_chunks_embedding ON chunks\n' +
          '  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);' },
        { tipo: 'texto', html:
          '<p>Três detalhes que valem code review:</p>' +
          '<ul><li><code>tsvector</code> como <strong>coluna gerada</strong>: o Postgres a mantém sincronizada, e você nunca esquece de atualizar.</li>' +
          '<li><code>\'simple\'</code> em vez de <code>\'portuguese\'</code>: código não tem stemming útil (<code>Calcular</code> não deve virar <code>calcul</code>). Para docs em português, uma segunda coluna com <code>\'portuguese\'</code> faz sentido.</li>' +
          '<li><code>UNIQUE</code> incluindo <code>versao_commit</code>: permite manter versões e torna a reindexação idempotente (M03, bloco 2: constraint como verdade).</li></ul>' },
        { tipo: 'texto', html:
          '<h3>O problema de over-filtering</h3>' +
          '<p>O índice ANN aplica o <code>WHERE</code> <strong>depois</strong> de percorrer o índice, não antes. Então <code>WHERE tenant_id = 42 ORDER BY embedding &lt;=&gt; $1 LIMIT 10</code> pode devolver menos de 10 linhas, ou nenhuma, mesmo havendo milhares do tenant 42: os 40 candidatos que o índice visitou eram todos de outros tenants. Não é bug, é a natureza do índice aproximado.</p>' +
          '<p>A resposta ingênua para "como garanto que não vaza dado entre clientes?" é "coloco WHERE tenant_id". Está certa em segurança e quebra em recall: o sistema fica seguro e inútil. Antes de rodar, preveja o efeito.</p>' },
        { tipo: 'rode', id: 'm07b3-rode', titulo: 'Reproduza o over-filtering', enunciado: 'Rode o modelo simplificado com um tenant de 1% do corpus. Depois clique nas etapas para ver tenant maior, iterative scan e o teto de tuplas.',
          prefixo: '$', entrada: 'python over_filtering.py --share 0.01 --ef 40 --limit 10', unidade: 'candidatos', terminalTitulo: 'over-filtering', etapas: etapasOver(),
          prever: { pergunta: 'Com ef_search = 40, LIMIT = 10 e um tenant que é 1% do corpus, quantas linhas o índice devolve sem iterative scan?', opcoes: [
            { id: 'a', texto: 'As 10 linhas pedidas: o LIMIT garante o tamanho do resultado.', correta: false, porque: 'o LIMIT só corta; quem produz candidatos é o índice, e ele só viu 40.' },
            { id: 'b', texto: 'Cerca de 4 linhas, proporcional à fatia do tenant.', correta: false, porque: '40 candidatos × 1% dá 0,4, não 4; 4 seria um tenant de 10%.' },
            { id: 'c', texto: 'Praticamente nenhuma: dos 40 candidatos visitados, só 0,4 são do tenant.', correta: true, porque: 'o WHERE descarta depois do índice, e a fatia do tenant é pequena.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Clique em cada etapa para ler só as linhas dela.',
          tutorDepois: 'Sem iterative scan, 0,4 candidato do tenant em 40 visitados: o resultado volta vazio. Com iterative scan o índice continua até juntar 10, ao custo de 25 vezes mais candidatos; abaixo de certa fatia bate o teto de max_scan_tuples e só índice parcial ou partição resolvem.',
          callout: 'Você viu o filtro de tenant esvaziar o resultado e o iterative scan recuperá-lo, com custo e com teto.' },
        { tipo: 'takeaway', html: 'O <mark>WHERE vem depois do índice</mark>: filtro de tenant sem tratamento deixa o sistema <mark>seguro e inútil</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>HNSW × IVFFlat</h3>' +
          '<p>Decisão do curso: <strong>HNSW</strong>, salvo se o build ficar proibitivo. O IVFFlat só ganha quando você reindexa o tempo todo do zero e o build domina o custo.</p>' },
        { tipo: 'abas', rotulo: 'Os dois índices', itens: [
          { rotulo: 'HNSW', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Como funciona:</strong> grafo navegável em camadas; começa grosso e desce refinando. Incorpora bem dados novos; o preço é build lento e muita memória. Pode indexar com a tabela vazia.</p>' +
              '<ul><li><code>m</code>: conexões por nó (padrão 16). Maior = grafo mais denso, melhor recall, índice maior e build mais lento. 16 serve à maioria; 32 a 48 para corpora grandes com recall alto.</li>' +
              '<li><code>ef_construction</code>: candidatos considerados ao inserir cada nó (padrão 64). Maior = grafo melhor e build mais lento; 128 a 200 se o build couber na ingestão.</li>' +
              '<li><code>hnsw.ef_search</code>: candidatos da consulta (padrão 40). É o botão de recall em tempo de execução, ajustável por sessão sem reconstruir nada. Precisa ser ≥ o <code>LIMIT</code>; regra prática: <strong>ef_search ≈ 2 a 4 × k</strong>.</li></ul>' },
            { tipo: 'codigo', linguagem: 'sql', texto:
              'CREATE INDEX ix_chunks_embedding ON chunks\n  USING hnsw (embedding vector_cosine_ops)\n  WITH (m = 16, ef_construction = 64);\n-- por sessão/consulta, sem reconstruir nada:\nSET hnsw.ef_search = 100;\nSET hnsw.iterative_scan = relaxed_order;' }] },
          { rotulo: 'IVFFlat', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Como funciona:</strong> divide o espaço em <code>lists</code> clusters e busca só nos mais próximos (<code>probes</code>). Precisa de dados para treinar os clusters: crie o índice depois de carregar a tabela. Build rápido, mas os clusters envelhecem com dados novos e pedem <code>REINDEX</code> periódico.</p>' +
              '<p><strong>Dimensionamento:</strong> <code>lists = linhas/1000</code> até 1M de linhas, <code>lists = √linhas</code> acima disso; comece com <code>probes = √lists</code>. Padrão de <code>ivfflat.probes</code>: 1.</p>' },
            { tipo: 'codigo', linguagem: 'sql', texto:
              '-- ~1M de linhas: lists = linhas / 1000\nCREATE INDEX ix_chunks_ivf ON chunks\n  USING ivfflat (embedding vector_cosine_ops)\n  WITH (lists = 1000);\n-- probes inicial = raiz de lists (~32)\nSET ivfflat.probes = 32;' }] },
          { rotulo: 'Lado a lado', blocos: [
            { tipo: 'texto', largo: true, html:
              '<table><thead><tr><th></th><th>HNSW</th><th>IVFFlat</th></tr></thead><tbody>' +
              '<tr><td>Parâmetros de construção</td><td><code>m</code> (16) · <code>ef_construction</code> (64)</td><td><code>lists</code></td></tr>' +
              '<tr><td>Parâmetro de consulta</td><td><code>hnsw.ef_search</code> (40)</td><td><code>ivfflat.probes</code> (1)</td></tr>' +
              '<tr><td>Build</td><td>Lento, usa muita memória</td><td>Rápido</td></tr>' +
              '<tr><td>Consulta</td><td>Melhor recall × velocidade</td><td>Inferior</td></tr>' +
              '<tr><td>Tabela vazia</td><td>Pode indexar antes de inserir</td><td>Precisa de dados (treina os clusters)</td></tr>' +
              '<tr><td>Dados novos</td><td>Incorpora bem</td><td>Degrada: exige REINDEX periódico</td></tr>' +
              '</tbody></table>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Três saídas para o over-filtering (pgvector 0.8 em diante)</h3>' +
          '<ul><li><strong>Iterative index scans:</strong> o índice continua buscando até juntar resultados suficientes. <code>SET hnsw.iterative_scan = relaxed_order;</code> (melhor recall, ordem levemente imprecisa: reordene depois com CTE materializada) ou <code>strict_order</code> (ordem exata). Limites: <code>hnsw.max_scan_tuples</code> (padrão cerca de 20.000) e <code>hnsw.scan_mem_multiplier</code>. Para IVFFlat: <code>ivfflat.iterative_scan</code> e <code>ivfflat.max_probes</code>.</li>' +
          '<li><strong>Índice parcial por partição lógica:</strong> com poucos tenants grandes, um índice por tenant elimina o problema pela raiz.</li>' +
          '<li><strong>Pré-filtrar numa CTE materializada e buscar exato no subconjunto:</strong> ótimo quando o filtro é muito seletivo (um repositório específico): a varredura exata é barata e o recall é 100%.</li></ul>' },
        { tipo: 'python', id: 'm07b3-python', titulo: 'Memória, IVFFlat e over-filtering em código',
          enunciado: 'Complete três funções. <code>bytes_por_vetor(tipo, dim, nnz)</code> segue a tabela de tipos (<code>vector</code>, <code>halfvec</code>, <code>bit</code>, <code>sparsevec</code>). <code>ivf_lists(linhas)</code>: <code>linhas // 1000</code> (mínimo 1) até 1.000.000 e <code>round(raiz(linhas))</code> acima. <code>over_filtering(share, ef, limit, iterativo, max_scan=20000)</code> devolve <code>(candidatos_visitados, linhas_devolvidas)</code> pelo modelo simplificado: sem iterative scan visita <code>ef</code> e devolve <code>min(limit, floor(ef*share + 0.5))</code>; com iterative scan visita <code>min(max_scan, ceil(limit/share))</code> e devolve <code>min(limit, floor(visitados*share + 0.5))</code>.',
          codigo: `import math


def bytes_por_vetor(tipo, dim=0, nnz=0):
    if tipo == "vector":
        return 4 * dim + 8
    if tipo == "halfvec":
        return 2 * dim + 8
    # 1. bit: dim/8 arredondado para cima + 8
    # 2. sparsevec: 8 * nnz + 16
    raise ValueError("tipo desconhecido: " + tipo)


def memoria_gb(linhas, tipo, dim=0, nnz=0):
    return round(linhas * bytes_por_vetor(tipo, dim, nnz) / 1e9, 1)


def ivf_lists(linhas):
    # até 1_000_000: linhas // 1000 (mínimo 1); acima: round(raiz de linhas)
    return 1


def ivf_probes(lists):
    return round(math.sqrt(lists))


def over_filtering(share, ef, limit, iterativo, max_scan=20000):
    if not iterativo:
        visitados = ef
    else:
        # visitados = menor entre max_scan e ceil(limit / share)
        visitados = ef
    devolvidas = min(limit, math.floor(visitados * share + 0.5))
    return visitados, devolvidas


print(memoria_gb(1_000_000, "vector", 1536), over_filtering(0.01, 40, 10, True))
`,
          testes: `def test_memoria_um_milhao_1536():
    assert memoria_gb(1_000_000, "vector", 1536) == 6.2
    assert memoria_gb(1_000_000, "halfvec", 1536) == 3.1


def test_bit_e_sparsevec():
    assert bytes_por_vetor("bit", 1536) == 1536 // 8 + 8
    assert bytes_por_vetor("bit", 10) == 2 + 8
    assert bytes_por_vetor("sparsevec", nnz=100) == 816


def test_tipo_desconhecido_falha():
    try:
        bytes_por_vetor("int8", 10)
    except ValueError:
        return
    assert False, "deveria levantar ValueError"


def test_ivf_lists_e_probes():
    assert ivf_lists(1_000_000) == 1000
    assert ivf_probes(1000) == 32
    assert ivf_lists(4_000_000) == 2000
    assert ivf_lists(500) == 1


def test_over_filtering_sem_iterative_esvazia():
    assert over_filtering(0.01, 40, 10, False) == (40, 0)
    assert over_filtering(0.10, 40, 10, False) == (40, 4)
    assert over_filtering(0.50, 40, 10, False) == (40, 10)


def test_over_filtering_com_iterative_recupera():
    assert over_filtering(0.01, 40, 10, True) == (1000, 10)
    assert over_filtering(0.001, 40, 10, True) == (10000, 10)


def test_teto_de_tuplas_corta_tenant_minusculo():
    assert over_filtering(0.0001, 40, 10, True) == (20000, 2)
`,
          dica: 'Para o <code>bit</code>: <code>math.ceil(dim / 8) + 8</code>. Para <code>ivf_lists</code>: <code>max(1, linhas // 1000)</code> se <code>linhas &lt;= 1_000_000</code>, senão <code>round(math.sqrt(linhas))</code>. No modo iterativo: <code>visitados = min(max_scan, math.ceil(limit / share))</code>.',
          solucao: `import math


def bytes_por_vetor(tipo, dim=0, nnz=0):
    if tipo == "vector":
        return 4 * dim + 8
    if tipo == "halfvec":
        return 2 * dim + 8
    if tipo == "bit":
        return math.ceil(dim / 8) + 8
    if tipo == "sparsevec":
        return 8 * nnz + 16
    raise ValueError("tipo desconhecido: " + tipo)


def memoria_gb(linhas, tipo, dim=0, nnz=0):
    return round(linhas * bytes_por_vetor(tipo, dim, nnz) / 1e9, 1)


def ivf_lists(linhas):
    if linhas <= 1_000_000:
        return max(1, linhas // 1000)
    return round(math.sqrt(linhas))


def ivf_probes(lists):
    return round(math.sqrt(lists))


def over_filtering(share, ef, limit, iterativo, max_scan=20000):
    if not iterativo:
        visitados = ef
    else:
        visitados = min(max_scan, math.ceil(limit / share))
    devolvidas = min(limit, math.floor(visitados * share + 0.5))
    return visitados, devolvidas
`,
          tutorDepois: 'Os números reproduzem o rode e a tabela do módulo (6,2 GB e 3,1 GB para 1 milhão × 1.536). O <code>max(1, ...)</code> em <code>ivf_lists</code> é uma guarda do exercício para tabelas minúsculas; o módulo não fixa esse caso. O modelo é uma estimativa de intuição, não uma medição de pgvector.',
          callout: 'Memória, dimensionamento de IVFFlat e over-filtering, calculados.' },
        { tipo: 'complete', id: 'm07b3-complete', titulo: 'Monte a sessão de consulta com filtro', obrigatorio: false, linguagem: 'sql',
          enunciado: 'Uma consulta interativa com filtro de tenant pede 10 resultados. Escolha, em cada lacuna, a configuração que evita o over-filtering e o recall baixo.',
          partes: [
            'SET hnsw.ef_search = ', { lacuna: 'ef', opcoes: ['40  -- padrão, vale para qualquer LIMIT', '10  -- igual ao LIMIT', '40  -- pelo menos 2 a 4 vezes o k de 10'], correta: '40  -- pelo menos 2 a 4 vezes o k de 10' },
            ';\nSET hnsw.iterative_scan = ', { lacuna: 'iter', opcoes: ['off  -- o WHERE já filtra por tenant', 'relaxed_order  -- continua buscando; reordene depois', 'relaxed_order  -- e remova o WHERE de tenant'], correta: 'relaxed_order  -- continua buscando; reordene depois' },
            ';\n\nSELECT id FROM chunks\nWHERE tenant_id = 42\nORDER BY embedding <=> $1\nLIMIT 10;\n'
          ],
          explicacao: '<code>ef_search</code> de 40 equivale a 4 vezes o k de 10, dentro da regra prática. Com <code>relaxed_order</code> o índice continua buscando até juntar os 10 resultados do tenant, e a ordem levemente imprecisa se corrige reordenando depois. Remover o <code>WHERE tenant_id</code> nunca é opção: o filtro é a ACL.',
          callout: 'Sessão montada: ef_search dimensionado, iterative scan ligado e o filtro de tenant mantido.' },
        { tipo: 'takeaway', html: '<mark>HNSW por padrão</mark>; <mark>ef_search ≈ 2 a 4 × k</mark> e <mark>iterative scan</mark> mantêm recall com o filtro de tenant.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Tuning: o que ajustar, em ordem</h3>' +
          '<ul><li>Carregue os dados <strong>antes</strong> de criar o índice: build sobre tabela cheia é muito mais rápido.</li>' +
          '<li><code>maintenance_work_mem</code> alto o bastante para o grafo caber na memória durante o build (senão vai a disco e leva horas), e <code>max_parallel_maintenance_workers</code> (até cerca de 7) para paralelizar.</li>' +
          '<li><code>hnsw.ef_search</code> <strong>por consulta</strong>, não global: 40 na consulta interativa; 200 numa análise em lote.</li>' +
          '<li>Se a memória apertar: <code>halfvec</code> (metade do espaço, perda pequena) ou quantização binária com rerank exato (indexa em <code>bit</code>, recupera 10x candidatos e reordena com a distância exata sobre os vetores completos).</li>' +
          '<li>Monitore o tamanho e compare com a RAM (consulta abaixo).</li></ul>' },
        { tipo: 'codigo', linguagem: 'sql', texto: "SELECT pg_size_pretty(pg_relation_size('ix_chunks_embedding'));" },
        { tipo: 'ordene', id: 'm07b3-ordene', titulo: 'Ponha o tuning na ordem', obrigatorio: false,
          enunciado: 'Ordene as ações de tuning do índice vetorial, da primeira à última.',
          itens: [
            { id: 'monitorar', texto: 'Monitorar o tamanho do índice contra a RAM disponível' },
            { id: 'ef', texto: 'Ajustar hnsw.ef_search por consulta, e não globalmente' },
            { id: 'dados', texto: 'Carregar os dados antes de criar o índice' },
            { id: 'mem', texto: 'Dimensionar maintenance_work_mem e os workers paralelos do build' },
            { id: 'half', texto: 'Se a memória apertar: halfvec ou quantização binária com rerank exato' }
          ],
          solucao: ['dados', 'mem', 'ef', 'half', 'monitorar'],
          dica: 'A ordem do módulo vai do build (dados, memória do build) para a consulta (ef_search) e depois para a memória do índice pronto.',
          callout: 'Tuning em ordem: build primeiro, consulta depois, memória por último.' },
        { tipo: 'escolha', id: 'm07b3-escolha-parcial', titulo: 'Confira: poucos tenants grandes',
          pergunta: 'O SaaS tem 3 tenants enormes, cada um com cerca de um terço do corpus, e o iterative scan tem custo de latência. Qual solução ataca o over-filtering pela raiz?',
          opcoes: [
            opc('a', 'Índice parcial por tenant.', true, 'com poucos tenants grandes, um índice por tenant elimina o problema pela raiz.'),
            opc('b', 'Remover o WHERE tenant_id e filtrar na aplicação.', false, 'quebra a ACL: o filtro de tenant é regra de segurança do bloco 6.'),
            opc('c', 'Aumentar m para 64.', false, 'm melhora o grafo, não muda quando o WHERE é aplicado.'),
            opc('d', 'Trocar para IVFFlat com probes = 1.', false, 'IVFFlat também aplica o filtro depois e com probes baixos perde recall.')
          ], tutorDepois: 'Poucos tenants grandes: índice parcial. Milhares de pequenos: iterative scan, com o teto de tuplas em mente.' },
        { tipo: 'escolha', id: 'm07b3-escolha-recall', titulo: 'Confira: o recall que mentiu',
          pergunta: 'O teste de recall sem filtro deu 0,97; em produção, com <code>WHERE tenant_id</code>, o recall real é bem menor. Qual é o erro de medição?',
          opcoes: [
            opc('a', 'Medir o recall do índice sem o filtro e servi-lo com o filtro.', true, 'é o erro clássico: o over-filtering só aparece quando o WHERE entra na consulta.'),
            opc('b', 'Usar cosseno em vez de produto interno.', false, 'a métrica não explica a queda causada pelo filtro.'),
            opc('c', 'Ter criado o índice depois de carregar os dados.', false, 'é a ordem recomendada.'),
            opc('d', 'Usar halfvec.', false, 'halfvec tem perda pequena de recall, não uma queda dessa natureza.')
          ], tutorDepois: 'Meça o recall com o mesmo filtro e o mesmo ef_search da produção.' },
        { tipo: 'takeaway', html: 'Meça o <mark>recall com o filtro</mark> que a produção usa; <mark>poucos tenants grandes</mark> pedem índice parcial, <mark>muitos pequenos</mark> pedem iterative scan.' }
      ] }
    ]
  });
})();
