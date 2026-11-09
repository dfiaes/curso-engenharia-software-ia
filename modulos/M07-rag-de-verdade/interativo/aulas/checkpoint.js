/* M07 · Checkpoint: nove cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada. Fonte: M07.html#checkpoint-m07. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm07-checkpoint',
    titulo: 'Checkpoint M07',
    minutos: 50,
    resumo: 'Nove cenários sobre RAG de verdade, sem consulta: k e funil, o que o embedding não captura, fusão, over-filtering, vazamento, abstenção, rerank, diagnóstico e as perguntas que o RAG erra.',
    objetivo: 'Verificar, sem consulta, se você explica por que o funil existe, protege o corpus por camadas, mede o ganho de cada etapa e separa recuperação de geração.',
    revisao: [
      { id: 'm07cp-overfilter', pergunta: 'A busca com filtro devolve menos resultados que o <code>LIMIT</code>, às vezes zero. Qual a causa?',
        opcoes: [
          opc('a', 'Over-filtering: o índice ANN aplica o WHERE depois de percorrer; conserto com <code>hnsw.iterative_scan = relaxed_order</code>, índice parcial ou pré-filtro em CTE materializada', true, 'a escolha segue a seletividade do filtro e o número de tenants (b3/b6).'),
          opc('b', 'O banco está sem memória', false, 'o sintoma é de filtro depois do índice, não de memória.'),
          opc('c', 'O <code>LIMIT</code> está mal escrito', false, 'o limite não é o problema.')] },
      { id: 'm07cp-efsearch', pergunta: 'O recall despenca quando você aumenta o <code>LIMIT</code>. Qual a causa provável?',
        opcoes: [
          opc('a', '<code>hnsw.ef_search</code> menor que o k pedido; ajuste para cerca de 2 a 4 vezes o k, por sessão', true, 'ef_search é o botão de recall em tempo de execução.'),
          opc('b', 'Falta de overlap no chunking', false, 'overlap não muda com o LIMIT.'),
          opc('c', 'O limiar de abstenção', false, 'abstenção não depende do LIMIT.')] },
      { id: 'm07cp-rerank', pergunta: 'O rerank não melhorou nada. Qual a causa provável e o conserto?',
        opcoes: [
          opc('a', 'Chunks maiores que a janela do cross-encoder, truncados em silêncio; use reranker de janela maior ou pontue cabeça ou resumo do chunk', true, 'sintoma clássico em chunks longos (b5).'),
          opc('b', 'O RRF está somando scores', false, 'o RRF usa posições, não scores.'),
          opc('c', 'O embedding_model não está na tabela', false, 'é um problema de migração, não do rerank.')] },
      { id: 'm07cp-tenant', pergunta: 'Resultados de um tenant aparecem para outro. Qual o conserto estrutural?',
        opcoes: [
          opc('a', 'Defesa em profundidade: RLS no banco, verificação de saída e auditoria dos chunk ids, além do filtro obrigatório na aplicação', true, 'o filtro só na aplicação falha quando uma consulta o esquece.'),
          opc('b', 'Instruir o modelo no prompt a não misturar clientes', false, 'instrução no prompt é pedido, não mecanismo.'),
          opc('c', 'Reduzir o k', false, 'não impede o vazamento.')] },
      { id: 'm07cp-dedup', pergunta: 'O top-5 está cheio de trechos quase idênticos. O que falta?',
        opcoes: [
          opc('a', 'Deduplicação por <code>hash_conteudo</code> na ingestão e diversificação no empacotamento do contexto (etapa 17)', true, 'o legado repete o mesmo código em vários arquivos (copy-paste).'),
          opc('b', 'Um k maior', false, 'só traz mais repetição.'),
          opc('c', 'Trocar o modelo de embedding', false, 'o problema é de duplicata, não de vetor.')] },
      { id: 'm07cp-reindex', pergunta: 'A reindexação leva horas a cada commit. Qual o conserto?',
        opcoes: [
          opc('a', 'Id estável por símbolo, <code>hash_conteudo</code> e cache de embeddings: só o que mudou é reprocessado', true, 'ingestão incremental (b2/M05).'),
          opc('b', 'Reindexar à noite', false, 'adia o custo, não o remove.'),
          opc('c', 'Aumentar o hardware', false, 'o custo vem de reprocessar tudo.')] }
    ],
    abas: [
      { rotulo: 'Funil, fusão e filtro', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada uma é um cenário; a rubrica diz o que basta. Reprovar é permitido: volte ao bloco indicado e tente de novo. As escolhas de aquecimento ajudam a firmar o vocabulário antes da resposta escrita.</p>' },

        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · O k que degrada', obrigatorio: false,
          enunciado: 'Explique por que aumentar o <code>k</code> da busca degrada a resposta a partir de certo ponto. Cite os três mecanismos e o que o funil faz a respeito. <em>Blocos 1 e 5.</em>',
          placeholder: 'Mais k piora a resposta porque… O funil…',
          rubrica: [
            'Os três mecanismos: <strong>custo</strong>, <strong>latência</strong> e <strong>context rot</strong>.',
            'O funil: filtra barato embaixo (recall) e decide caro em cima (precisão), entregando poucos chunks ao prompt.',
            'Reconhece que <strong>similaridade é candidato barato, não veredito</strong>.'
          ],
          modelo: '<p>Mais k manda mais trechos ao modelo: custa mais tokens, aumenta a latência e, a partir de certo ponto, causa context rot, em que o excesso de contexto piora a resposta. O funil resolve isso por etapas: o índice híbrido barato traz candidatos com recall alto, o RRF funde, o cross-encoder caro reordena só esses e o prompt recebe 5 chunks. Recall se ganha embaixo, precisão em cima; similaridade é candidato barato, não veredito.</p>' + reprova('"mais k sempre ajuda" ou citar só um dos três mecanismos.') },

        { tipo: 'escolha', id: 'cp-esc-p2', titulo: 'P2 · Aquecimento: o que o vetor não captura',
          pergunta: 'Qual destes itens um embedding NÃO captura bem?',
          opcoes: [
            { id: 'a', texto: 'Identificadores exatos, como o nome raro de um método.', correta: true, porque: 'o tokenizador dilui o nome raro; o antídoto é o léxico do híbrido (b4).' },
            { id: 'b', texto: 'Sinônimos e paráfrases do mesmo conceito.', correta: false, porque: 'é onde o embedding é forte.' },
            { id: 'c', texto: 'Proximidade semântica entre pergunta e documento.', correta: false, porque: 'é exatamente o que ele mede.' }
          ] },
        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · O que o embedding não captura', obrigatorio: false,
          enunciado: 'Cite as cinco coisas que um embedding não captura e, para cada uma, a etapa do pipeline que compensa. <em>Blocos 1, 3, 4, 5 e 6.</em>',
          placeholder: 'Negação → … Números e datas → … Identificadores → … Estrutura → … Recência → …',
          rubrica: [
            'As cinco: <strong>negação</strong>, <strong>números e datas</strong>, <strong>identificadores exatos</strong>, <strong>estrutura/relação</strong> e <strong>recência/versão</strong>.',
            'Cada uma com seu antídoto: negação (filtro estruturado, reescrita de query, grafo), números e datas (extrair para metadado e filtrar em SQL), identificadores (léxico do híbrido), estrutura e relação (grafo, M10), recência e versão (metadado de versão/status + filtro).',
            'A ideia de que <strong>nenhuma etapa sozinha cobre tudo</strong>: o pipeline é o remédio.'
          ],
          modelo: '<p>Negação: filtro estruturado, reescrita de query (b5) ou grafo (M10). Números e datas: extrair para metadado e filtrar em SQL. Identificadores exatos: o léxico do híbrido (b4), a principal razão de o híbrido existir. Estrutura e relação: travessia de grafo (M10). Recência e versão: metadado de versão e status com filtro (b6). Cada falha do vetor tem antídoto em outra etapa; por isso o pipeline tem dezoito etapas e não uma.</p>' + reprova('citar menos de cinco ou propor "um embedding melhor" para todas.') },

        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Por que não somar scores', obrigatorio: false,
          enunciado: 'Por que não se pode somar o score léxico com o score vetorial? Escreva a fórmula do RRF e explique por que ela favorece consenso. <em>Bloco 4.</em>',
          placeholder: 'As escalas são… RRF: score(d) = …',
          rubrica: [
            'As escalas são <strong>incomparáveis</strong> (score léxico e distância vetorial não vivem na mesma unidade).',
            'Fórmula: <code>score(d) = Σ 1/(k + posição)</code>, com <code>k ≈ 60</code>.',
            'Usa <strong>só posições</strong>; o documento bem colocado nas duas listas soma duas parcelas, então <strong>consenso vence excelência isolada</strong>.'
          ],
          modelo: '<p>O score do BM25 e a similaridade vetorial têm escalas diferentes, e somá-los mistura unidades. O RRF usa só posições: <code>score(d) = Σ 1/(k + posição)</code> com k perto de 60, somando sobre cada lista em que o documento aparece. Quem aparece bem colocado em ambas acumula duas parcelas e sobe; quem lidera uma lista só fica atrás. É o consenso que vence.</p>' + reprova('"somar os scores com pesos" sem tratar as escalas.') },

        { tipo: 'escolha', id: 'cp-esc-p4', titulo: 'P4 · Aquecimento: o filtro seletivo',
          pergunta: 'Um repositório de 5 mil chunks dentro de 5 milhões, com filtro muito seletivo. Qual solução de over-filtering o critério do bloco indica?',
          opcoes: [
            { id: 'a', texto: 'Pré-filtro em CTE materializada e busca exata no subconjunto.', correta: true, porque: 'varredura exata é ótima em subconjunto pequeno.' },
            { id: 'b', texto: 'Partição de tabela por tenant.', correta: false, porque: 'é para tenants realmente grandes e isolados, com complexidade operacional.' },
            { id: 'c', texto: 'Um índice parcial por tenant, para milhares de tenants.', correta: false, porque: 'inviável em escala de SaaS self-serve.' }
          ] },
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Over-filtering', obrigatorio: false,
          enunciado: 'O que é over-filtering, por que é consequência necessária de índice aproximado e quais são as quatro soluções com o critério de escolha de cada uma? <em>Blocos 3 e 6.</em>',
          placeholder: 'Over-filtering é… Acontece porque… Soluções: …',
          rubrica: [
            'Pedir 10 e receber menos: o índice ANN percorre o grafo e só <strong>depois</strong> aplica o <code>WHERE</code>.',
            'As quatro: <code>iterative_scan = relaxed_order</code> (caso geral), <strong>índice parcial</strong> (poucos tenants grandes), <strong>CTE materializada + busca exata</strong> (filtro muito seletivo), <strong>partição por tenant</strong> (tenants grandes e isolados).',
            'Medir o <strong>recall com o filtro aplicado</strong> e registrar num ADR.'
          ],
          modelo: '<p>Over-filtering é pedir 10 e receber 2 (ou zero): o índice aproximado percorre candidatos e só depois aplica o filtro, então um filtro seletivo derruba quase todos. Soluções: <code>hnsw.iterative_scan = relaxed_order</code> para o caso geral; índice parcial para poucos tenants grandes; pré-filtro em CTE materializada com busca exata quando o filtro é muito seletivo; partição por tenant para tenants realmente grandes e isolados. Escolho medindo o recall com o filtro ligado e registro num ADR.</p>' + reprova('"filtrar na aplicação depois" ou medir recall sem filtro.') },

        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Filtrar depois é vazar', obrigatorio: false,
          enunciado: '"Ordenar por similaridade e filtrar depois é como fazer <code>SELECT *</code> e filtrar na aplicação, só que aqui o vazamento sai numa resposta em linguagem natural." Desenvolva: por que é pior e quais são as quatro camadas de defesa. <em>Bloco 6.</em>',
          placeholder: 'É pior porque… As quatro camadas: …',
          rubrica: [
            'Pior porque o dado proibido <strong>já entrou no contexto</strong> e <strong>não dá para "desler"</strong>; sem rastro de acesso, parafraseado.',
            'As quatro camadas: <strong>aplicação</strong> (tenant obrigatório vindo do token), <strong>RLS no banco</strong>, <strong>isolamento de índice</strong>, <strong>verificação de saída</strong>.',
            'Instrução no prompt é <strong>pedido, não mecanismo</strong>; cada camada deve bastar sozinha (desligar a 1 e provar a 2).'
          ],
          modelo: '<p>No banco, um SELECT indevido deixa rastro; em RAG, o dado proibido entra no contexto, influencia a resposta e sai parafraseado, sem log do registro original, e não há como desler. As camadas: (1) filtro obrigatório na aplicação, com <code>tenant_id</code> sem default vindo do token; (2) RLS no Postgres, que filtra mesmo se a query esquecer; (3) isolamento de índice (parcial ou partição); (4) verificação de saída, checando que todo chunk citado é do tenant do requisitante, o que vira alerta. Provo desligando a 1 e vendo a 2 segurar.</p>' + reprova('"avisar no prompt" ou citar uma camada só.') },
        { tipo: 'takeaway', html: 'Funil por <mark>custo</mark>, fusão por <mark>posição</mark> e filtro <mark>dentro da consulta</mark>, em camadas.' }
      ] },

      { rotulo: 'Abstenção, rerank e diagnóstico', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p6', titulo: 'P6 · Aquecimento: o limiar da abstenção',
          pergunta: 'Qual métrica de produção denuncia que a abstenção regrediu?',
          opcoes: [
            { id: 'a', texto: 'A taxa de abstenção em queda brusca: o sistema parou de dizer "não sei".', correta: true, porque: 'costuma ser efeito colateral de mudança de prompt ou de modelo.' },
            { id: 'b', texto: 'O tamanho médio do chunk.', correta: false, porque: 'não mede abstenção.' },
            { id: 'c', texto: 'A latência do índice.', correta: false, porque: 'não mede abstenção.' }
          ] },
        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Abstenção que funciona', obrigatorio: false,
          enunciado: 'Demonstre a abstenção funcionando e explique os dois erros de calibração do limiar. Qual métrica de produção denuncia que a abstenção regrediu? <em>Bloco 6.</em>',
          placeholder: 'A abstenção funciona assim… Limiar baixo… Limiar alto… Em produção…',
          rubrica: [
            'Mecanismo: abaixo do limiar a resposta é <strong>"não encontrei" com motivo</strong> (melhor candidato e limiar), mais prompt que <strong>autoriza abster</strong>; mostrar com consulta fora do corpus.',
            'Limiar <strong>baixo</strong>: responde com contexto ruim, parece fundamentado e está errado. Limiar <strong>alto</strong>: abstém onde saberia responder.',
            'Calibrar medindo as <strong>duas taxas separadamente</strong> no dataset; em produção, a <strong>taxa de abstenção</strong> em queda brusca.'
          ],
          modelo: '<p>Pergunto algo fora do corpus: nenhum trecho passa do limiar e o sistema devolve "nenhum trecho acima do limiar (0.35); melhor candidato: 0.20", com o prompt autorizando "não encontrei". Limiar baixo demais responde com contexto ruim e citação, parecendo fundamentado e errado; alto demais abstém onde saberia. Calibro no dataset medindo "respondeu quando não devia" e "absteve quando devia" em separado. Em produção, a taxa de abstenção caindo de repente denuncia a regressão.</p>' + reprova('"um limiar bom serve para todo corpus" ou ignorar um dos dois erros.') },

        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · O ganho do rerank, com números', obrigatorio: false,
          enunciado: 'Prove com números que o reranking melhorou o recall no SEU corpus e explique por que um cross-encoder enxerga o que o bi-encoder não enxerga. <em>Bloco 5.</em>',
          placeholder: 'Medi recall@5 sem e com rerank… O cross-encoder enxerga…',
          rubrica: [
            'Evidência: <strong>recall@5 sem e com rerank</strong> sobre o dataset do corpus (salto típico de 8 a 20 pontos), com latência anotada; se der zero, o diagnóstico (truncamento).',
            'Bi-encoder codifica <strong>separado</strong> e compara geometria; cross-encoder lê o <strong>par junto</strong> e vê a relação (sujeito, caso, negação).',
            'Custo: não se pré-computa, então roda <strong>só nos candidatos</strong>; limiar calibrado no corpus, nunca copiado.'
          ],
          modelo: '<p>Rodo o dataset sem rerank e com rerank e comparo o recall@5 (o salto típico é de 8 a 20 pontos), anotando a latência do lote; se o ganho der zero, investigo truncamento da janela. O bi-encoder transforma pergunta e documento em vetores separados e compara distância; o cross-encoder lê o par numa só passagem e vê a relação: quem é o sujeito, se o caso é o mesmo, se há negação. Por isso custa uma inferência por par e só roda nos candidatos. O limiar do score, que não é probabilidade, é calibrado no meu corpus.</p>' + reprova('afirmar ganho sem medir recall@5 antes e depois.') },

        { tipo: 'escolha', id: 'cp-esc-p8', titulo: 'P8 · Aquecimento: o contexto perfeito',
          pergunta: 'Injetando à mão o contexto perfeito, a resposta passa a sair certa. Onde estava a falha?',
          opcoes: [
            { id: 'a', texto: 'Na recuperação: confira o recall@k contra o ground truth.', correta: true, porque: 'com o contexto certo a geração acerta, então o chunk certo não estava vindo.' },
            { id: 'b', texto: 'Na geração: reescreva o prompt.', correta: false, porque: 'a geração acertou quando recebeu o contexto certo.' },
            { id: 'c', texto: 'Na abstenção.', correta: false, porque: 'abstenção é o caso de não haver resposta no corpus.' }
          ] },
        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · Resposta errada: quem falhou', obrigatorio: false,
          enunciado: 'Uma resposta saiu errada. Descreva o procedimento para decidir, em cinco minutos, se a culpa foi da recuperação ou da geração. <em>Bloco 7.</em>',
          placeholder: 'Primeiro… Depois injeto… Se… senão…',
          rubrica: [
            'Mede o <strong>recall@k</strong> contra o ground truth: o chunk certo veio?',
            '<strong>Injeta à mão o contexto perfeito</strong>: se ainda erra, é <strong>geração</strong> (prompt, modelo, formato); se acerta, é <strong>recuperação</strong> (chunking, híbrido, rerank).',
            'Nomeia a <strong>terceira causa</strong>: abstenção que não aconteceu (consulta fora do corpus), consertada com limiar e prompt.'
          ],
          modelo: '<p>Primeiro confiro se o chunk certo estava entre os k recuperados (recall@k contra o ground truth). Depois injeto à mão o contexto perfeito e rodo só a geração: se ainda erra, é geração e mexo em prompt, modelo ou formato de saída; se acerta, é recuperação e mexo em chunking, híbrido ou rerank. Há ainda a terceira causa, a abstenção: se não havia resposta no corpus e o sistema inventou, ajusto limiar e prompt. Isso evita semanas ajustando a metade errada.</p>' + reprova('"trocar de modelo" ou "reescrever o prompt" sem isolar a causa.') },

        { tipo: 'escreva', id: 'cp-p9', titulo: 'P9 · As três perguntas que o RAG erra', obrigatorio: false,
          enunciado: 'Apresente as três perguntas que o seu RAG erra sistematicamente, explique a razão comum entre elas e diga o que seria necessário para respondê-las. <em>Bloco 8.</em>',
          placeholder: 'As três perguntas são… A razão comum… Para responder…',
          rubrica: [
            'Três perguntas <strong>concretas do seu corpus</strong>, marcadas <code>esperado_falhar</code> com o diagnóstico.',
            'Razão comum: <strong>exigem percorrer relações</strong>, e relação está <strong>entre chunks</strong>, não dentro de nenhum.',
            'Nem k nem reranker resolvem (problema de <strong>representação</strong>); a resposta é <strong>travessia de grafo</strong> (M10).'
          ],
          modelo: '<p>As três são perguntas respondíveis a partir do código mas que a busca por trecho não alcança, no estilo "quais telas chamam, direta ou indiretamente, este método?", cada uma das minhas com o diagnóstico em <code>queries.jsonl</code>, marcadas <code>esperado_falhar</code>. A razão comum: todas exigem percorrer relações, e relação está entre chunks, não dentro de nenhum; aumentar k traz mais texto, não mais relações, e um reranker melhor não cria arestas. Responder exige travessia de grafo, o M10.</p>' + reprova('"é só aumentar o k" ou "trocar o embedding".') },

        { tipo: 'texto', html:
          '<h3>Entregáveis verificados (mostrar rodando)</h3>' +
          '<ul><li>Gates verdes: <code>ruff</code>, <code>format</code>, <code>mypy --strict</code>, <code>pytest</code> do lab.</li>' +
          '<li>Chunker estrutural com id estável + filtro com relatório; embeddings com limites sondados e migração incompatível.</li>' +
          '<li>Híbrida RRF por tipo de consulta; rerank com ganho medido e limiar calibrado no corpus.</li>' +
          '<li>Leak test (tenant obrigatório, cross vazio, saída acusada) + abstenção com motivo; SQL de referência para PG real.</li>' +
          '<li>Eval com recall/MRR/citação + tabela de ablação; 3 estruturais com diagnóstico de relação.</li></ul>' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes verificadas em 14/09/2026 (Anthropic, contextual retrieval; pgvector docs; PostgreSQL full text search; Cormack et al., RRF, 2009; Python, <code>ast</code>). Versões de modelo, dimensões, preços e capacidades são informação de alto risco: revalidar em até 90 dias. O SQL do bloco 3 exige PostgreSQL com pgvector (Docker); sem ele, a execução fica bloqueada.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>mecanismo</mark> primeiro e, depois, <mark>onde medir</mark> que ele funciona.' }
      ] }
    ]
  });
})();
