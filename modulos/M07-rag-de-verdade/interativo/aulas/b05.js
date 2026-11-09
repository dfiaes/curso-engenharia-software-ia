/* M07 · Bloco 5: Reranking e transformação de query. Fonte: M07.html#b05. Contagens do funil e exemplos de terminal são didáticos (sem modelo real). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasFunil = function () {
    return [
      { id: 'corpus', nome: 'Corpus', descricao: '50k+ chunks indexados', tom: 'dns', ms: 50000, linhas: [
        L('cmd', 'consulta: "onde o login valida o token?"'),
        L('info', 'corpus: 50.000+ chunks'),
        L('hint', 'nada disso pode ir ao prompt: custo, latência e context rot')] },
      { id: 'acl', nome: 'Filtro de ACL', descricao: 'tenant e escopo, antes de ordenar', tom: 'tcp', ms: 50000, linhas: [
        L('info', 'filtro: tenant_id, repo_id, visibilidade, status, versao'),
        L('hint', 'depois deste ponto, nada proibido existe no pipeline (bloco 6)')] },
      { id: 'hibrido', nome: 'Híbrido', descricao: '50 candidatos por método', tom: 'tls', ms: 100, linhas: [
        L('in', 'léxico: 50 candidatos   vetorial: 50 candidatos'),
        L('hint', 'barato e de recall alto: o identificador vem do léxico, o conceito do vetor')] },
      { id: 'rrf', nome: 'Fusão RRF', descricao: 'só posições', tom: 'request', ms: 20, linhas: [
        L('in', 'RRF: 100 posições fundidas em 20 candidatos'),
        L('hint', 'consenso entre métodos sobe; escalas incomparáveis dispensadas')] },
      { id: 'rerank', nome: 'Rerank', descricao: 'cross-encoder lê pergunta + trecho', tom: 'response', ms: 20, linhas: [
        L('out', 'cross-encoder: 20 pares (pergunta, trecho) pontuados, 20 inferências'),
        L('out', 'ordenados por score_rerank, top 5'),
        L('hint', 'caro, mas só nos 20 pares: precisão no topo')] },
      { id: 'limiar', nome: 'Limiar', descricao: 'abstém se nada passa', tom: 'ink', ms: 5, linhas: [
        L('out', 'contexto: 5 chunks acima do limiar'),
        L('hint', 'abaixo do limiar: "não encontrei", com motivo (bloco 6)')] }
    ];
  };

  var CTRL = 'python funil_exemplo.py';

  TrilhaAula.registrar({
    id: 'm07-b5',
    titulo: 'Reranking e transformação de query',
    minutos: 35,
    resumo: 'O reranker lê pergunta e trecho juntos e é o maior ganho por linha de código do pipeline. A transformação de query ataca o formato da pergunta antes da busca; o roteamento por regra é grátis e testável.',
    objetivo: 'Explicar por que o cross-encoder só roda nos candidatos, reconhecer as três armadilhas do reranker e implementar um roteador determinístico de consultas.',
    revisao: [
      { id: 'm07b5-bi-cross', pergunta: 'Qual a diferença entre bi-encoder e cross-encoder, e por que isso desenha o funil?',
        opcoes: [
          opc('a', 'O bi-encoder codifica pergunta e documento separados (vetores pré-computados); o cross-encoder lê o par junto e roda ao vivo, por isso só nos candidatos', true, 'o par é a entrada, então nada se pré-computa: uma inferência por candidato.'),
          opc('b', 'O cross-encoder é uma versão mais rápida do bi-encoder', false, 'é o contrário em custo: o cross-encoder é o caro.'),
          opc('c', 'O bi-encoder só funciona com BM25', false, 'bi-encoder é o modelo de embedding do bloco 1; BM25 é léxico.')] },
      { id: 'm07b5-trunc', pergunta: 'O rerank não melhorou o recall@5 em chunks de cerca de 1.500 tokens. Qual a hipótese mais provável?',
        opcoes: [
          opc('a', 'Truncamento silencioso: a janela do cross-encoder (512 tokens é comum) corta o chunk e ele pontua só o pedaço que sobrou', true, 'soluções: reranker de janela maior ou pontuar o resumo/cabeça do chunk.'),
          opc('b', 'O k do RRF está alto demais', false, 'o k do RRF não explica um rerank que "não faz nada" em chunks longos.'),
          opc('c', 'O score do reranker deveria ser uma probabilidade', false, 'score não é probabilidade; a escala varia por modelo.')] },
      { id: 'm07b5-limiar', pergunta: 'Posso copiar de um blog o limiar de score do reranker?',
        opcoes: [
          opc('a', 'Não: a escala varia por modelo (logits ou [0,1]) e o limiar se calibra no seu corpus', true, 'score não é probabilidade; copiar um número de um blog é o erro.'),
          opc('b', 'Sim, 0,5 vale para qualquer reranker', false, 'não existe valor universal.'),
          opc('c', 'Sim, desde que o modelo seja local', false, 'local ou API, a escala depende do modelo.')] },
      { id: 'm07b5-rota', pergunta: 'Por que o roteamento por regra deve vir antes de uma chamada de LLM que classifica a intenção?',
        opcoes: [
          opc('a', 'A regra é grátis, instantânea e testável; o LLM fica para o que a regra não decide', true, 'é a alavanca de custo do M05 aplicada à consulta.'),
          opc('b', 'LLM não consegue classificar intenção', false, 'consegue, mas custa uma chamada que muitas vezes um if resolve.'),
          opc('c', 'Regra é mais precisa que LLM em qualquer caso', false, 'não é o ponto: é custo, latência e testabilidade.')] },
      { id: 'm07b5-hyde', pergunta: 'Quando o HyDE compensa?',
        opcoes: [
          opc('a', 'Perguntas conceituais em corpus em que pergunta e documento têm vocabulários muito diferentes', true, 'a resposta hipotética "parece" mais com o documento certo que a pergunta parecia.'),
          opc('b', 'Sempre que a pergunta traz um identificador exato', false, 'identificador exato é caso do léxico, via roteamento.'),
          opc('c', 'Para perguntas de várias etapas, no lugar de um agente', false, 'várias etapas é busca iterativa, que já é agente (M08).')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Até aqui, pergunta e documento foram transformados em vetores <strong>separadamente</strong>, e a comparação é geométrica. O <strong>reranker</strong> faz o contrário: coloca pergunta e documento <em>juntos</em> na mesma passagem de um modelo, que avalia a relação entre eles. É a diferença entre comparar dois resumos e ler os dois textos lado a lado. Por isso o reranking é o maior ganho por linha de código de todo o pipeline, e a razão é arquitetural, não mágica.</p>' +
          '<h3>Bi-encoder × cross-encoder</h3>' +
          '<p>O modelo de embedding do bloco 1 é um <strong>bi-encoder</strong>: codifica pergunta e documento independentemente e compara por distância. É isso que permite pré-computar os vetores do corpus inteiro; sem isso não haveria busca vetorial.</p>' +
          '<p>Um <strong>cross-encoder</strong> recebe o par <code>(pergunta, documento)</code> numa única entrada e devolve <em>um número</em>: o quanto aquele documento responde àquela pergunta. Ele enxerga a interação termo a termo: quem é o sujeito da pergunta, se o documento trata do mesmo caso, se há negação. A contrapartida é o custo: <strong>não dá para pré-computar</strong>, porque o resultado depende do par. É preciso rodar o modelo para cada candidato, na hora da consulta.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Filtrar barato, decidir caro', html:
          '<p>Não se aplica a regra cara em todo o corpus: filtra-se barato por índice e decide-se caro só nos candidatos. O bi-encoder (barato, pré-computado) traz candidatos; o cross-encoder (caro, ao vivo) reordena e devolve 5. Cada etapa reduz a quantidade e aumenta o custo unitário. <strong>Recall se ganha embaixo; precisão, em cima.</strong></p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>O funil de consulta, do corpus ao prompt</h3>' +
          '<table><thead><tr><th>#</th><th>Etapa</th><th>Entra e sai</th><th>Por que existe</th></tr></thead><tbody>' +
          '<tr><td>1</td><td>Corpus</td><td>50k+ chunks</td><td>Ponto de partida: dezenas de milhares. Nada disso pode ir ao prompt (custo, latência e context rot)</td></tr>' +
          '<tr><td>2</td><td>Filtro de ACL</td><td>tenant e escopo</td><td>O que o requisitante não pode ver sai aqui; depois deste ponto nada proibido existe no pipeline</td></tr>' +
          '<tr><td>3</td><td>Busca híbrida</td><td>50 por método</td><td>Léxico + vetorial, barato e de recall alto: o identificador exato vem do léxico, o conceito do vetor</td></tr>' +
          '<tr><td>4</td><td>Fusão por RRF</td><td>20 fundidos</td><td>Só posições; consenso entre métodos sobe, escalas incomparáveis dispensadas</td></tr>' +
          '<tr><td>5</td><td>Rerank</td><td>top 5</td><td>O cross-encoder lê pergunta + trecho. Caro, mas só em 20 pares. Cuidado com a janela de 512 tokens e com a latência do lote</td></tr>' +
          '<tr><td>6</td><td>Limiar e abstenção</td><td>abstém?</td><td>Abaixo do limiar: "não encontrei", com motivo. Resposta plausível a partir de contexto ruim é a única inaceitável</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'O <mark>cross-encoder</mark> lê o par junto, por isso não se pré-computa: roda só nos <mark>candidatos</mark> do funil.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Rode o funil abaixo. É uma simulação didática com as contagens do módulo (50 candidatos por método, 20 fundidos pelo RRF, top 5), sem modelo real. A barra de cada etapa mostra quantos itens ela entrega.</p>' },
        { tipo: 'rode', id: 'rr-rode', titulo: 'Percorra o funil de consulta', enunciado: 'Rode a simulação e clique em Rerank para ler só as linhas dele.',
          prefixo: '$', entrada: CTRL, unidade: 'itens', terminalTitulo: 'funil de consulta (exemplo)', etapas: etapasFunil(),
          prever: { pergunta: 'Neste funil, quantas inferências o cross-encoder roda por consulta?', opcoes: [
            { id: 'a', texto: '50.000: uma por chunk do corpus.', correta: false, porque: 'rodar o cross-encoder no corpus todo é exatamente o que o funil evita.' },
            { id: 'b', texto: '20: uma por par (pergunta, candidato fundido pelo RRF).', correta: true, porque: 'ele só roda nos candidatos que sobraram do índice e da fusão.' },
            { id: 'c', texto: '5: só nos que vão ao prompt.', correta: false, porque: 'ele precisa pontuar os 20 para saber quais são os 5 melhores.' }
          ] },
          tutorAntes: 'Aperte Enter, leia a contagem de cada etapa e clique em Rerank.',
          tutorDepois: 'O cross-encoder pontuou 20 pares, não 50.000. Se você tivesse previsto outra coisa, releia: o custo por inferência é alto, então ele fica no topo do funil. Em outros trechos do módulo aparece 50 como tamanho do lote, e reduzir de 50 para 25 candidatos costuma custar pouco recall.',
          callout: 'Você viu o funil reduzir 50.000 chunks a 5 com um reranker pago só em 20 pares.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Três formas de rerankear, em ordem de custo</h3>' +
          '<table><thead><tr><th>Opção</th><th>Como</th><th>Custo e latência</th><th>Quando</th></tr></thead><tbody>' +
          '<tr><td><strong>Cross-encoder local</strong></td><td>Modelo pequeno (por exemplo, a família <code>bge-reranker</code> ou <code>ms-marco-MiniLM</code>) via <code>sentence-transformers</code>, na sua máquina ou servidor</td><td>Zero de API; dezenas a centenas de ms por lote de 20; precisa de CPU ou GPU</td><td>Padrão do curso e obrigatório no modo "não sai da rede do cliente"</td></tr>' +
          '<tr><td><strong>API de rerank</strong></td><td>Serviços dedicados (Cohere Rerank e equivalentes): você manda a query e os documentos e recebe as posições</td><td>Pago por consulta; cerca de 100 a 300 ms</td><td>Quando não quer operar modelo; ótimo para começar</td></tr>' +
          '<tr><td><strong>LLM como reranker</strong></td><td>Pedir ao modelo que ordene ou pontue os candidatos (structured output do M05)</td><td>O mais caro e lento</td><td>Critério específico do domínio que não cabe num reranker genérico ("priorize código de produção sobre teste")</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O código de referência usa um modelo real e é trilha externa; o laboratório usa um rerank falso determinístico. O modelo é carregado uma vez por processo (o load é caro, a inferência não), pontua os pares, ordena e aplica o limiar de elegibilidade: melhor devolver 2 bons que 5 com 3 ruins (bloco 6).</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '# rerank.py (exemplo com modelo real: trilha externa; o laboratório usa rerank falso determinístico)',
          '"""Reranking com cross-encoder local: candidatos -> os 5 melhores."""',
          'from __future__ import annotations',
          'from dataclasses import dataclass, replace',
          'from functools import lru_cache',
          'from sentence_transformers import CrossEncoder',
          'from app.services.retrieval.tipos import ChunkResultado',
          '',
          '@lru_cache(maxsize=1)',
          'def _modelo() -> CrossEncoder:',
          '    """Carrega uma vez por processo (o load é caro; a inferência não)."""',
          '    return CrossEncoder("BAAI/bge-reranker-v2-m3", max_length=512)',
          '',
          'def rerankear(',
          '    pergunta: str, candidatos: list[ChunkResultado], top_k: int = 5, limiar: float = 0.0',
          ') -> list[ChunkResultado]:',
          '    if not candidatos:',
          '        return []',
          '    pares = [(pergunta, c.conteudo) for c in candidatos]',
          '    scores = _modelo().predict(pares)                     # roda o modelo nos pares',
          '    pontuados = [replace(c, score_rerank=float(s)) for c, s in zip(candidatos, scores)]',
          '    pontuados.sort(key=lambda c: c.score_rerank, reverse=True)',
          '    # limiar de elegibilidade: melhor devolver 2 bons que 5 com 3 ruins (bloco 6)',
          '    elegiveis = [c for c in pontuados if c.score_rerank >= limiar]',
          '    return elegiveis[:top_k]'].join('\n') },
        { tipo: 'abas', rotulo: 'Três armadilhas do reranker', itens: [
          { rotulo: 'Truncamento', blocos: [{ tipo: 'texto', html: '<p><strong>Truncamento silencioso.</strong> Cross-encoders têm janela pequena (512 tokens é comum). Chunk maior que isso é cortado, e o modelo pontua o pedaço que sobrou. Se seus chunks são grandes (bloco 2), use um reranker de janela maior ou pontue um resumo ou a cabeça do chunk. <em>Sintoma: rerank não melhora nada em chunks longos.</em></p>' }] },
          { rotulo: 'Latência do lote', blocos: [{ tipo: 'texto', html: '<p><strong>Latência escondida no lote.</strong> Rerankear 50 candidatos são 50 inferências. Local, em CPU, isso pode custar mais que a chamada de LLM que vem depois. Meça e ajuste o tamanho do lote: reduzir de 50 para 25 candidatos costuma custar pouco recall.</p>' }] },
          { rotulo: 'Score', blocos: [{ tipo: 'texto', html: '<p><strong>Score não é probabilidade.</strong> A escala varia por modelo (alguns dão logits, outros valores em [0,1]). O limiar precisa ser calibrado no seu corpus, exatamente como o limiar de similaridade do bloco 1. Nunca copie um número de um blog.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'Três opções por custo (<mark>local, API, LLM</mark>) e três armadilhas: <mark>truncamento</mark>, <mark>latência do lote</mark> e <mark>score que não é probabilidade</mark>.' }
      ] },

      { rotulo: 'Transformar a query', blocos: [
        { tipo: 'texto', html:
          '<p>O pipeline recebe a pergunta do usuário e busca com ela. O problema: a pergunta quase nunca está no formato ideal de busca. É curta demais, ambígua, ou contém várias perguntas em uma. As técnicas abaixo atacam isso <em>antes</em> da recuperação.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Técnica</th><th>O que faz</th><th>Custo</th><th>Quando compensa</th></tr></thead><tbody>' +
          '<tr><td><strong>Reescrita / expansão</strong></td><td>O LLM reescreve a pergunta em termos prováveis do corpus, ou gera 3 variações e você funde os resultados (RRF de novo)</td><td>1 chamada barata</td><td>Quase sempre; ganho consistente em corpus técnico</td></tr>' +
          '<tr><td><strong>HyDE</strong> (Hypothetical Document Embeddings)</td><td>O LLM inventa uma resposta plausível e você busca pelo embedding dela: a resposta hipotética "parece" mais com o documento certo que a pergunta parecia</td><td>1 chamada</td><td>Perguntas conceituais em corpus onde pergunta e documento têm vocabulários muito diferentes</td></tr>' +
          '<tr><td><strong>Decomposição</strong></td><td>Quebra pergunta composta em sub-perguntas, busca cada uma, junta os contextos</td><td>1 chamada + N buscas</td><td>"Compare X e Y", "quais módulos usam A e também B"</td></tr>' +
          '<tr><td><strong>Roteamento</strong></td><td>Classifica a intenção e escolhe o caminho: léxica pura para identificador, vetorial para conceito, grafo para estrutura (M10), SQL para agregação</td><td>1 chamada barata (ou regra determinística)</td><td>Sempre que existir mais de uma fonte; é o padrão que mais evita resposta ruim</td></tr>' +
          '<tr><td><strong>Iterativo</strong> (ITER-RETGEN e afins)</td><td>Busca, resposta parcial, nova busca com o que faltou</td><td>N chamadas</td><td>Investigação de várias etapas, mas isso já é agente (M08)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'success', titulo: 'Roteamento: prefira a regra determinística', html:
          '<p>Antes de gastar uma chamada de LLM classificando a intenção, veja quanto dá para decidir com <code>if</code>: a pergunta contém um identificador em PascalCase ou snake_case? Contém "o que quebra se", "quem chama", "quais dependem" (grafo, M10)? Contém número ou data (filtro estruturado)? Regra determinística é grátis, instantânea e testável, e é a alavanca nº 5 do M05 bloco 7 aplicada aqui. Use o LLM só para o resto.</p>' },
        { tipo: 'takeaway', html: 'Cinco técnicas, uma regra: o <mark>roteamento</mark> começa por <mark>if</mark>, e o LLM fica para o resto.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'rr-python', titulo: 'Escreva o roteador determinístico', obrigatorio: false,
          enunciado: 'Implemente <code>rotear(pergunta)</code> com a prioridade <strong>grafo</strong> (frases "o que quebra se", "quem chama", "quais dependem"), depois <strong>lexical</strong> (identificador PascalCase ou snake_case), depois <strong>estruturado</strong> (qualquer dígito) e, no resto, <strong>vetorial</strong>. Relação entre chunks vence identificador: "quem chama X" precisa do grafo.',
          codigo: "import re\n\n\ndef rotear(pergunta):\n    \"\"\"Devolve \"grafo\", \"lexical\", \"estruturado\" ou \"vetorial\".\"\"\"\n    p = pergunta.lower()\n    # 1. relação entre chunks (\"o que quebra se\", \"quem chama\", \"quais dependem\") -> grafo\n    # 2. identificador PascalCase ou snake_case -> lexical\n    # 3. qualquer número ou data -> estruturado\n    # 4. o resto -> vetorial\n    return \"vetorial\"\n\n\nfor q in [\"Quem chama ProcessarPedido?\", \"Como funciona a autenticação?\"]:\n    print(q, \"->\", rotear(q))\n",
          testes: "def test_relacao_vai_para_grafo():\n    assert rotear(\"Quem chama ProcessarPedido?\") == \"grafo\"\n    assert rotear(\"O que quebra se eu mudar a assinatura?\") == \"grafo\"\n    assert rotear(\"Quais dependem do módulo de pagamento?\") == \"grafo\"\n\n\ndef test_identificador_vai_para_lexical():\n    assert rotear(\"Onde está calcular_total_pedido?\") == \"lexical\"\n    assert rotear(\"Mostre a classe ProcessarPedido\") == \"lexical\"\n\n\ndef test_identificador_com_digito_nao_vira_estruturado():\n    assert rotear(\"Onde está calcular_total_v2?\") == \"lexical\"\n\n\ndef test_numero_ou_data_vai_para_estruturado():\n    assert rotear(\"O que mudou em 2025-03-01?\") == \"estruturado\"\n    assert rotear(\"Arquivos com mais de 500 linhas\") == \"estruturado\"\n\n\ndef test_conceito_vai_para_vetorial():\n    assert rotear(\"Como funciona a autenticação?\") == \"vetorial\"\n\n\ndef test_palavra_capitalizada_simples_nao_e_identificador():\n    assert rotear(\"Onde fica o login?\") == \"vetorial\"\n",
          dica: 'Teste as frases de relação em <code>pergunta.lower()</code>, mas procure PascalCase e snake_case no texto <em>original</em>: a caixa das letras é o sinal. Um identificador como <code>calcular_total_v2</code> tem dígito e ainda assim é lexical, então teste o dígito por último.',
          solucao: "import re\n\nRELACAO = (\"o que quebra se\", \"quem chama\", \"quais dependem\")\nPASCAL = re.compile(r\"\\b[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)+\\b\")\nSNAKE = re.compile(r\"\\b[a-z0-9]+(?:_[a-z0-9]+)+\\b\")\n\n\ndef rotear(pergunta):\n    \"\"\"Devolve \"grafo\", \"lexical\", \"estruturado\" ou \"vetorial\".\"\"\"\n    p = pergunta.lower()\n    if any(frase in p for frase in RELACAO):\n        return \"grafo\"\n    if PASCAL.search(pergunta) or SNAKE.search(pergunta):\n        return \"lexical\"\n    if re.search(r\"\\d\", pergunta):\n        return \"estruturado\"\n    return \"vetorial\"\n\n\nfor q in [\"Quem chama ProcessarPedido?\", \"Como funciona a autenticação?\"]:\n    print(q, \"->\", rotear(q))\n",
          tutorDepois: 'Marque as consultas de estrutura: são as candidatas ao grafo do M10, onde nem k nem reranker resolvem.',
          callout: 'O roteador passou nos testes, com a prioridade (relação, identificador, número) fixada em código.' },
        { tipo: 'cenario', id: 'rr-cenario', titulo: 'O rerank que não ajudou', obrigatorio: false,
          enunciado: 'O reranker foi integrado e o recall@5 do dataset não mudou. Seus chunks têm cerca de 1.500 tokens. Decida o que investigar.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'recall@5 igual com e sem rerank, em chunks de ~1.500 tokens. Por onde começar?', opcoes: [
              { texto: 'Mudar o k do RRF até o número subir.', vai: 'f-chute', tom: 'ruim', consequencia: 'o k do RRF mexe na fusão, não explica um rerank que "não faz nada" em chunks longos.' },
              { texto: 'Conferir a janela do cross-encoder contra o tamanho do chunk.', vai: 'trunc', tom: 'ok', consequencia: 'sintoma clássico: o modelo pontua só o pedaço que coube nos 512 tokens.' }
            ] },
            trunc: { texto: 'Confirmado: a janela é de 512 tokens e o chunk tem 1.500. Como corrigir?', opcoes: [
              { texto: 'Reranker de janela maior, ou pontuar o resumo ou a cabeça do chunk.', vai: 'lat', tom: 'ok', consequencia: 'o modelo passa a ver o que decide a relevância.' },
              { texto: 'Entregar mais candidatos ao reranker.', vai: 'f-mais', tom: 'ruim', consequencia: 'mais candidatos truncados continuam mal pontuados e a latência sobe.' }
            ] },
            lat: { texto: 'O rerank passou a ajudar, mas o lote de 50 em CPU custa mais que a chamada de LLM seguinte. O que fazer?', opcoes: [
              { texto: 'Medir e reduzir o lote (de 50 para 25), conferindo o recall.', vai: 'f-bom', tom: 'ok', consequencia: 'reduzir de 50 para 25 costuma custar pouco recall e corta a latência.' },
              { texto: 'Tirar o rerank: ele é lento.', vai: 'f-tira', tom: 'ruim', consequencia: 'você descarta o maior ganho por linha de código em vez de ajustar o lote.' }
            ] }
          },
          finais: {
            'f-chute': { texto: 'O recall continua igual e você gastou tempo ajustando a peça errada. Volte e leia o sintoma.', bom: false },
            'f-mais': { texto: 'O custo subiu e o ganho não apareceu: o problema era a janela, não a quantidade.', bom: false },
            'f-tira': { texto: 'O pipeline perdeu a etapa que mais ganha precisão. Ajuste o lote, não remova a etapa.', bom: false },
            'f-bom': { texto: 'Rerank ajudando e latência dentro do orçamento, com a medição anotada. Registre o recall@5 sem e com rerank.', bom: true }
          },
          callout: 'Você diagnosticou o truncamento e ajustou o lote medindo, sem remover o reranker.' },
        { tipo: 'escolha', id: 'rr-esc-1', titulo: 'Confira: por que só nos candidatos',
          pergunta: 'Por que o cross-encoder é aplicado só aos candidatos do funil, e não ao corpus inteiro?',
          opcoes: [
            { id: 'a', texto: 'Porque ele não entende português.', correta: false, porque: 'o limite é de custo, não de idioma.' },
            { id: 'b', texto: 'Porque só funciona com BM25.', correta: false, porque: 'ele reordena candidatos de qualquer método.' },
            { id: 'c', texto: 'Porque processa o par (pergunta, documento) junto: nada se pré-computa, é uma inferência por candidato, na hora da consulta.', correta: true, porque: 'o bi-encoder pré-computa o corpus; o cross-encoder paga por par.' },
            { id: 'd', texto: 'Porque a janela dele é infinita e ficaria lento.', correta: false, porque: 'a janela é pequena (512 tokens é comum), e é outra armadilha.' }
          ] },
        { tipo: 'escolha', id: 'rr-esc-2', titulo: 'Confira: rerank que não faz nada',
          pergunta: 'O reranker não melhorou o recall@5 em chunks de ~1.500 tokens. Qual a hipótese mais provável?',
          opcoes: [
            { id: 'a', texto: 'Truncamento silencioso: ~512 tokens de janela, e o modelo pontua só o pedaço que sobrou.', correta: true, porque: 'sintoma clássico; solução: janela maior ou pontuar um resumo ou a cabeça do chunk.' },
            { id: 'b', texto: 'O k do RRF está baixo demais.', correta: false, porque: 'não explica o rerank sem efeito em chunks longos.' },
            { id: 'c', texto: 'O score deveria ser uma probabilidade maior que 0,5.', correta: false, porque: 'score não é probabilidade; o limiar se calibra no corpus.' },
            { id: 'd', texto: 'A busca léxica está desligada.', correta: false, porque: 'afetaria o recall da etapa anterior, não o ganho do rerank.' }
          ] },
        { tipo: 'texto', html: '<p class="ta-nota">Exercício do laboratório (Laboratório guiado M07): recall@5 sem e com rerank, com o salto típico de 8 a 20 pontos (e o diagnóstico quando dá zero), limiar calibrado na distribuição do corpus com o método de obtenção anotado, e 60 a 70% das consultas roteáveis por regra, com as de estrutura marcadas como candidatas ao grafo. Trilha com modelo real opcional: cross-encoder local ou API de rerank, com máquina ou crédito próprios.</p>' },
        { tipo: 'takeaway', html: 'Rerank sem ganho em chunk longo é <mark>truncamento</mark> até prova em contrário; o roteador roda como <mark>teste</mark>, não como opinião.' }
      ] }
    ]
  });
})();
