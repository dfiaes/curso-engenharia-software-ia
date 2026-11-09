/* M07 · Bloco 8: Mini-projeto, RAG sobre o sistema legado. Fonte: M07.html#b08. O terminal de ingestão é o código do exercício rodado sobre um corpus de brinquedo. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasIngestao = function () {
    return [
      { id: 'r1', nome: '1ª execução', descricao: 'corpus de brinquedo, estado vazio', tom: 'request', ms: 3, linhas: [
        L('cmd', 'ingerir(CORPUS, estado)'),
        L('out', "{'arquivos': 2, 'chunks': 4, 'inalterados': 0, 'deduplicados': 1, 'do_cache': 0, 'novos': 3}"),
        L('hint', 'o parágrafo repetido em b.py foi deduplicado; 3 embeddings novos')] },
      { id: 'r2', nome: '2ª execução', descricao: 'mesmo corpus, mesmo estado', tom: 'response', ms: 0, linhas: [
        L('cmd', 'ingerir(CORPUS, estado)'),
        L('in', "{'arquivos': 2, 'chunks': 4, 'inalterados': 3, 'deduplicados': 1, 'do_cache': 0, 'novos': 0}"),
        L('hint', 'zero embeddings novos: id estável + hash tornam a ingestão incremental')] },
      { id: 'r3', nome: 'Muda 1 chunk', descricao: 'g() vira g2() em a.py', tom: 'ink', ms: 1, linhas: [
        L('cmd', 'ingerir(CORPUS_com_g2, estado)'),
        L('in', "{'arquivos': 2, 'chunks': 4, 'inalterados': 2, 'deduplicados': 1, 'do_cache': 0, 'novos': 1}"),
        L('hint', 'um chunk mudou, um embedding novo')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm07-b8',
    titulo: 'Mini-projeto: RAG sobre o sistema legado',
    minutos: 45,
    resumo: 'O pipeline completo sobre o corpus Python do laboratório: ingestão com filtro sério, ingestão incremental barata, consulta com citação verificada, eval com baseline e três perguntas que o RAG erra de propósito.',
    objetivo: 'Montar e conferir o pipeline ponta a ponta, reconhecer uma ingestão incremental pela segunda execução e identificar as perguntas de relação que pedem o grafo do M10.',
    revisao: [
      { id: 'm07b8-segunda', pergunta: 'Como deve se comportar a segunda execução da ingestão sobre o mesmo corpus?',
        opcoes: [
          opc('a', 'Quase instantânea e quase de graça: dedup por hash, cache de embeddings e ingestão incremental', true, 'se não for, algo do bloco 2 (id estável, hash) ou do M05 (cache) não está ligado.'),
          opc('b', 'Igual à primeira, para garantir consistência', false, 'repetir o custo é o sintoma de que o incremental não está ligado.'),
          opc('c', 'Mais cara, porque o índice é reconstruído', false, 'reconstruir tudo é o que o id estável evita.')] },
      { id: 'm07b8-relacao', pergunta: 'Por que mais k ou um reranker melhor não resolvem as três perguntas que o RAG erra sistematicamente?',
        opcoes: [
          opc('a', 'Elas exigem percorrer relações, e relação está entre chunks, não dentro de nenhum: o problema é de representação, não de recuperação', true, 'aumentar k traz mais texto, não mais relações; o M10 responde com travessia de grafo.'),
          opc('b', 'O corpus é pequeno demais', false, 'não é questão de tamanho.'),
          opc('c', 'O modelo de embedding é ruim para código', false, 'trocar o embedding não cria arestas entre chunks.')] },
      { id: 'm07b8-coleta', pergunta: 'Qual o resultado esperado do passo 1 (coleta com filtro sério)?',
        opcoes: [
          opc('a', 'Um relatório com encontrados, aproveitados e descartados com motivo: o gerado fora, o resto dentro', true, 'cada arquivo descartado é embedding não pago e ruído não indexado.'),
          opc('b', 'Todos os arquivos indexados, para não perder nada', false, 'gerados e binários são ruído.'),
          opc('c', 'Apenas a contagem de arquivos', false, 'o motivo do descarte faz parte do relatório.')] },
      { id: 'm07b8-metricas', pergunta: 'Quais métricas de ingestão o passo 2 imprime no fim?',
        opcoes: [
          opc('a', 'Arquivos processados, chunks gerados, chunks deduplicados, embeddings do cache vs. novos, custo total e tempo total', true, 'são elas que mostram se dedup, cache e incremental estão ligados.'),
          opc('b', 'Só o tempo total', false, 'sem custo e cache não dá para diagnosticar.'),
          opc('c', 'Apenas o recall@5', false, 'recall é do eval do passo 4, não da ingestão.')] }
    ],
    abas: [
      { rotulo: 'O que construir', blocos: [
        { tipo: 'texto', html:
          '<p>O pipeline completo, rodando sobre o corpus Python do laboratório: código com identificadores, ruído, arquivo gerado e segredo de exemplo. Código é o corpus mais difícil e o mais valioso (verdade verificável, perguntas objetivas), e aqui ele vem com origem declarada, sem exigir outra linguagem.</p>' },
        { tipo: 'abas', rotulo: 'Os quatro passos', itens: [
          { rotulo: '1 · Ingestão com filtro', blocos: [{ tipo: 'texto', html:
            '<p><strong>Ingestão com filtro sério.</strong> Percorra o corpus aplicando as etapas 1 e 2 do bloco 7 com o coletor do laboratório (extensões conhecidas, teto de tamanho, marcador de gerado).</p>' +
            '<p><em>Resultado esperado:</em> relatório de coleta com encontrados, aproveitados e descartados com motivo: o gerado fora, o resto dentro. Cada arquivo descartado é embedding não pago e ruído não indexado.</p>' }] },
          { rotulo: '2 · Ingestão completa', blocos: [{ tipo: 'texto', html:
            '<p><strong>Pipeline de ingestão completo</strong> (etapas 3 a 9): chunking estrutural por AST, embedding com cache, indexação com metadados e registro de versão. O mascaramento completo de segredo é trilha do M12.</p>' +
            '<p><em>Resultado esperado:</em> métricas de ingestão impressas no fim: arquivos processados, chunks gerados, chunks deduplicados, embeddings do cache vs. novos, custo total, tempo total. Rode duas vezes: a segunda deve ser quase instantânea e quase de graça (dedup + cache + ingestão incremental). Se não for, algo do bloco 2 ou do M05 não está ligado.</p>' }] },
          { rotulo: '3 · Consulta completa', blocos: [{ tipo: 'texto', html:
            '<p><strong>Consulta completa</strong> (etapas 10 a 18): híbrida com RRF, rerank, limiar com abstenção e verificação de saída, devolvendo contexto, citações verificadas e o campo de encontro.</p>' +
            '<p><em>Resultado esperado:</em> pergunta literal e conceitual respondidas com arquivo e linhas; abra as linhas para conferir. Depois pergunte algo fora do corpus e confirme a abstenção com motivo. Cada chunk citado passa na verificação de tenant.</p>' }] },
          { rotulo: '4 · Eval e baseline', blocos: [{ tipo: 'texto', html:
            '<p><strong>Rode o eval completo</strong> (bloco 7) sobre o corpus real e salve a baseline.</p>' +
            '<p><em>Resultado esperado:</em> recall@5 alto em literais e conceituais, citação válida e abstenção correta, medidos pelo eval do laboratório. Se algum estiver baixo, a tabela de ablação diz onde olhar.</p>' }] }
        ] },
        { tipo: 'ordene', id: 'mp-ordene', titulo: 'Ponha os passos na ordem', obrigatorio: false,
          enunciado: 'Ordene as fases do mini-projeto como o roteiro as executa.',
          itens: [
            { id: 'p3', texto: 'Consulta completa com citações verificadas e abstenção' },
            { id: 'p1', texto: 'Coleta com filtro sério e relatório de descartes' },
            { id: 'p4', texto: 'Eval completo sobre o corpus e baseline salva' },
            { id: 'p2', texto: 'Ingestão completa, rodada duas vezes' }
          ],
          solucao: ['p1', 'p2', 'p3', 'p4'],
          dica: 'Sem corpus filtrado não há o que ingerir; sem índice não há consulta; o eval mede a consulta já pronta.',
          tutorDepois: 'Cada fase alimenta a seguinte, e a baseline do passo 4 é o que o gate do M06 compara nas próximas mudanças.',
          callout: 'Você ordenou o mini-projeto, da coleta à baseline.' },
        { tipo: 'takeaway', html: 'Quatro passos: <mark>coletar</mark>, <mark>ingerir duas vezes</mark>, <mark>consultar com citação</mark> e <mark>medir</mark>.' }
      ] },

      { rotulo: 'Ingestão barata', blocos: [
        { tipo: 'texto', html:
          '<p>A segunda execução é o teste mais barato de que a ingestão está correta. O terminal abaixo roda o código do exercício desta aba sobre um <strong>corpus de brinquedo</strong> (dois arquivos, um parágrafo repetido), não sobre o corpus do laboratório. Um <strong>id estável</strong> (aqui, caminho mais posição) e o <code>hash_conteudo</code> permitem distinguir chunk inalterado, duplicado e novo.</p>' },
        { tipo: 'rode', id: 'mp-rode', titulo: 'Rode a ingestão duas vezes', enunciado: 'Rode as três etapas: a primeira execução, a segunda sobre o mesmo corpus e uma execução com um chunk alterado.',
          prefixo: '$', entrada: 'python ingestao_exemplo.py', unidade: 'embeddings', terminalTitulo: 'ingestão (corpus de brinquedo)', etapas: etapasIngestao(),
          prever: { pergunta: 'Na segunda execução sobre o mesmo corpus, quantos embeddings novos são gerados?', opcoes: [
            { id: 'a', texto: 'Os mesmos 3 da primeira: o índice é reconstruído.', correta: false, porque: 'reconstruir tudo é o que id estável e hash evitam.' },
            { id: 'b', texto: 'Nenhum: todo chunk não duplicado já está no índice com o mesmo hash.', correta: true, porque: 'a ingestão é incremental: nada mudou, nada se paga.' },
            { id: 'c', texto: 'Só 1, por causa do parágrafo repetido.', correta: false, porque: 'o repetido é deduplicado, não reembedado.' }
          ] },
          tutorAntes: 'Aperte Enter e compare os contadores de cada execução.',
          tutorDepois: 'Segunda execução: 0 novos e 3 inalterados. Mudar um chunk custa exatamente um embedding. Se a sua segunda rodada no laboratório for cara, o id estável (bloco 2) ou o cache (M05) não está ligado.',
          callout: 'Você viu a segunda execução custar zero e a alteração de um chunk custar um embedding.' },
        { tipo: 'python', id: 'mp-python', titulo: 'Escreva a ingestão incremental', obrigatorio: false,
          enunciado: 'Complete <code>ingerir</code>. Para cada chunk, nesta ordem: se o índice já tem o <code>cid</code> com o mesmo hash, conte <em>inalterado</em>; senão, se o hash já está no índice sob outro id, conte <em>deduplicado</em>; senão, gere o embedding: se o hash está no cache, conte <em>do_cache</em>; se não, grave no cache e conte <em>novos</em>. Só então registre o chunk no índice.',
          codigo: "import hashlib\n\n\ndef ingerir(arquivos, estado):\n    \"\"\"arquivos: dict caminho -> texto. estado: {\"indice\": {}, \"cache\": {}}.\n    Um chunk é cada parágrafo não vazio (separado por linha em branco).\"\"\"\n    m = {\"arquivos\": 0, \"chunks\": 0, \"inalterados\": 0, \"deduplicados\": 0, \"do_cache\": 0, \"novos\": 0}\n    for caminho, texto in arquivos.items():\n        m[\"arquivos\"] += 1\n        partes = [p.strip() for p in texto.split(\"\\n\\n\") if p.strip()]\n        for n, parte in enumerate(partes):\n            cid = f\"{caminho}#{n}\"          # id estável: caminho + posição\n            h = hashlib.sha256(parte.encode()).hexdigest()\n            m[\"chunks\"] += 1\n            # 1. se estado[\"indice\"].get(cid) == h: inalterado, nada a fazer\n            # 2. senão, se h já está entre os valores do índice: deduplicado\n            # 3. senão, embedding: h em estado[\"cache\"] -> do_cache; caso contrário -> novos (grave no cache)\n            # 4. no fim, estado[\"indice\"][cid] = h (quando não deduplicado)\n            m[\"novos\"] += 1\n    return m\n\n\nCORPUS = {\"a.py\": \"def f(): ...\\n\\ndef g(): ...\", \"b.py\": \"def f(): ...\"}\nprint(ingerir(CORPUS, {\"indice\": {}, \"cache\": {}}))\n",
          testes: "CORPUS = {\"a.py\": \"def f(): ...\\n\\ndef g(): ...\", \"b.py\": \"def f(): ...\\n\\ndef h(): ...\"}\n\n\ndef test_primeira_execucao_deduplica_e_embeda_o_resto():\n    m = ingerir(CORPUS, {\"indice\": {}, \"cache\": {}})\n    assert m[\"arquivos\"] == 2 and m[\"chunks\"] == 4\n    assert m[\"deduplicados\"] == 1 and m[\"novos\"] == 3 and m[\"inalterados\"] == 0\n\n\ndef test_segunda_execucao_nao_gasta_nada():\n    estado = {\"indice\": {}, \"cache\": {}}\n    ingerir(CORPUS, estado)\n    m = ingerir(CORPUS, estado)\n    assert m[\"novos\"] == 0 and m[\"do_cache\"] == 0\n    assert m[\"inalterados\"] == 3 and m[\"deduplicados\"] == 1\n\n\ndef test_mudar_um_chunk_gera_so_um_embedding():\n    estado = {\"indice\": {}, \"cache\": {}}\n    ingerir(CORPUS, estado)\n    mudou = dict(CORPUS, **{\"a.py\": \"def f(): ...\\n\\ndef g2(): ...\"})\n    m = ingerir(mudou, estado)\n    assert m[\"novos\"] == 1 and m[\"inalterados\"] == 2\n\n\ndef test_cache_pre_existente_evita_chamada():\n    import hashlib\n    h = hashlib.sha256(b\"def g(): ...\").hexdigest()\n    estado = {\"indice\": {}, \"cache\": {h: \"vetor-antigo\"}}\n    m = ingerir({\"a.py\": \"def g(): ...\"}, estado)\n    assert m[\"do_cache\"] == 1 and m[\"novos\"] == 0\n\n\ndef test_corpus_vazio():\n    m = ingerir({}, {\"indice\": {}, \"cache\": {}})\n    assert m[\"chunks\"] == 0 and m[\"novos\"] == 0\n",
          dica: 'Use <code>continue</code> nos dois primeiros casos para pular o registro. O teste "dedup" compara com <code>estado["indice"].values()</code>. Lembre de gravar <code>estado["cache"][h]</code> quando o embedding for novo e <code>estado["indice"][cid] = h</code> no fim.',
          solucao: "import hashlib\n\n\ndef ingerir(arquivos, estado):\n    \"\"\"arquivos: dict caminho -> texto. estado: {\"indice\": {}, \"cache\": {}}.\n    Um chunk é cada parágrafo não vazio (separado por linha em branco).\"\"\"\n    m = {\"arquivos\": 0, \"chunks\": 0, \"inalterados\": 0, \"deduplicados\": 0, \"do_cache\": 0, \"novos\": 0}\n    for caminho, texto in arquivos.items():\n        m[\"arquivos\"] += 1\n        partes = [p.strip() for p in texto.split(\"\\n\\n\") if p.strip()]\n        for n, parte in enumerate(partes):\n            cid = f\"{caminho}#{n}\"          # id estável: caminho + posição\n            h = hashlib.sha256(parte.encode()).hexdigest()\n            m[\"chunks\"] += 1\n            if estado[\"indice\"].get(cid) == h:\n                m[\"inalterados\"] += 1\n                continue\n            if h in estado[\"indice\"].values():\n                m[\"deduplicados\"] += 1\n                continue\n            if h in estado[\"cache\"]:\n                m[\"do_cache\"] += 1\n            else:\n                estado[\"cache\"][h] = f\"vetor-{h[:6]}\"\n                m[\"novos\"] += 1\n            estado[\"indice\"][cid] = h\n    return m\n\n\nCORPUS = {\"a.py\": \"def f(): ...\\n\\ndef g(): ...\", \"b.py\": \"def f(): ...\"}\nprint(ingerir(CORPUS, {\"indice\": {}, \"cache\": {}}))\n",
          tutorDepois: 'O chunk deduplicado não entra no índice com o id dele; por isso o repetido continua contado como duplicado na segunda execução, sem custo. O embedding é fake: o ponto é a contabilidade.',
          callout: 'A ingestão contabiliza inalterados, duplicados, cache e novos, e a segunda rodada não gasta nada.' },
        { tipo: 'takeaway', html: '<mark>Id estável</mark> mais <mark>hash</mark> fazem a segunda execução custar <mark>zero</mark>.' }
      ] },

      { rotulo: 'O que o RAG não alcança', blocos: [
        { tipo: 'texto', html:
          '<p>Provar o ganho do rerank com números e encontrar <strong>três perguntas que o RAG erra sistematicamente</strong> é o fecho do mini-projeto. O gabarito vive em <code>queries.jsonl</code> (marcadas <code>esperado_falhar</code> com o diagnóstico). O percurso: a tabela do bloco 5 sobre o corpus, com as consultas, e três perguntas respondíveis a partir do código que a busca por trecho não alcança.</p>' +
          '<p>A forma é a mesma nas três: <strong>exigem percorrer relações</strong>, e relação está <em>entre</em> chunks, não dentro de nenhum. Nenhum k resolve, nenhum reranker resolve. Guarde-as: o M10 responde as três com travessia de grafo. A aplicação ao Capstone (<code>services/retrieval/</code>) é trilha opcional com especificação própria.</p>' },
        { tipo: 'transcript', id: 'mp-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'relato do eval',
          enunciado: 'Um colega relata o resultado do eval. Uma das afirmações não é sustentada pelo que o bloco ensina. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Rodei o eval completo sobre o corpus e salvei a baseline.' },
            { quem: 'agente', texto: 'recall@5 alto em literais e conceituais; citação válida e abstenção corretas.' },
            { quem: 'voce', texto: 'E as perguntas do tipo "quais telas chamam, direta ou indiretamente, este método?"' },
            { quem: 'agente', texto: 'Resolvi subindo o k para 20 e trocando o reranker: agora acertam.' },
            { quem: 'ferramenta', texto: 'queries.jsonl: 3 consultas estruturais marcadas esperado_falhar (diagnóstico: exigem percorrer relações)' }
          ],
          erradas: [3],
          explicacao: { 3: 'nenhum chunk contém "este método é chamado indiretamente por 7 telas": esse fato emerge da travessia de arestas, que é o M10. Aumentar k traz mais texto, não mais relações, e um reranker melhor não cria arestas. O problema é de representação, não de recuperação.' },
          tutorDepois: 'Marcar as três como esperado_falhar e guardar o diagnóstico é o resultado correto do mini-projeto.' },
        { tipo: 'escolha', id: 'mp-esc-1', titulo: 'Confira: a segunda execução',
          pergunta: 'Na ingestão do mini-projeto, como deve se comportar a segunda execução sobre o mesmo corpus?',
          opcoes: [
            { id: 'a', texto: 'Igual à primeira, para garantir consistência.', correta: false, porque: 'repetir o custo mostra que o incremental não está ligado.' },
            { id: 'b', texto: 'Quase instantânea e quase de graça: dedup por hash, cache de embeddings e ingestão incremental.', correta: true, porque: 'o id estável é o que torna a reindexação incremental possível.' },
            { id: 'c', texto: 'Mais cara, pois o índice precisa ser reconstruído.', correta: false, porque: 'reconstruir é o que se evita.' },
            { id: 'd', texto: 'Impossível, pois o id do chunk muda a cada execução.', correta: false, porque: 'é justamente o id estável (bloco 2) que impede isso.' }
          ] },
        { tipo: 'escolha', id: 'mp-esc-2', titulo: 'Confira: as três perguntas',
          pergunta: 'Por que mais k ou um reranker melhor não resolvem as três perguntas que o RAG erra sistematicamente?',
          opcoes: [
            { id: 'a', texto: 'Porque exigem percorrer relações, e relação está entre chunks, não dentro de nenhum.', correta: true, porque: 'é um problema de representação, não de recuperação; o M10 responde com grafo.' },
            { id: 'b', texto: 'Porque o corpus é pequeno demais.', correta: false, porque: 'o tamanho do corpus não cria arestas.' },
            { id: 'c', texto: 'Porque o modelo de embedding é ruim para código.', correta: false, porque: 'outro embedding também não traz relações.' },
            { id: 'd', texto: 'Porque o limiar de abstenção está alto.', correta: false, porque: 'o limiar decide abster, não cria a relação ausente.' }
          ] },
        { tipo: 'takeaway', html: 'Relação está <mark>entre chunks</mark>: nenhum k nem reranker a cria, e o <mark>M10</mark> responde com <mark>grafo</mark>.' }
      ] }
    ]
  });
})();
