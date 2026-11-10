/* E02 · Bloco 5: modelos de raciocínio e computação em tempo de teste. Fonte: E02.html#b05. Preços e acertos do exemplo são hipotéticos; nomes de parâmetros de esforço conforme levantamento de julho de 2026, verificado em 11/10/2026 (revalidar em até 90 dias). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  var J = function (a) { return a.join('\n'); };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasRaciocinio = function () {
    return [
      { id: 'comum', nome: 'Modelo comum', descricao: '72% de acerto, 400 tokens de saída', tom: 'dns', ms: 6, linhas: [
        L('cmd', 'python custo.py --modelo comum --saida-usd-m 15'),
        L('out', '1.000 chamadas x 400 tok = 0,4 M tok x 15 = US$ 6,00'),
        L('out', 'acertos = 720 · custo por acerto = 6,00 / 720 = 0,0083'),
        L('out', 'latência a 60 tok/s = 400 / 60 = 6,7 s')] },
      { id: 'racio', nome: 'Modelo de raciocínio', descricao: '86% de acerto, 3.500 tokens de saída', tom: 'tcp', ms: 52.5, linhas: [
        L('cmd', 'python custo.py --modelo raciocinio --saida-usd-m 15'),
        L('out', '1.000 chamadas x 3.500 tok = 3,5 M tok x 15 = US$ 52,50'),
        L('out', 'acertos = 860 · custo por acerto = 52,50 / 860 = 0,0610'),
        L('out', 'latência a 60 tok/s = 3.500 / 60 = 58 s'),
        L('hint', 'o custo médio por acerto (0,061) já parece alto, mas ainda esconde o preço da melhoria')] },
      { id: 'marg', nome: 'Acerto adicional', descricao: 'Custo adicional da troca', tom: 'tls', ms: 46.5, linhas: [
        L('cmd', 'python custo.py --marginal'),
        L('out', 'diferença de custo = 52,50 - 6,00 = 46,50 · acertos a mais = 860 - 720 = 140'),
        L('out', 'custo por acerto adicional = 46,50 / 140 = 0,332'),
        L('hint', 'cerca de 40 vezes o custo médio por acerto do modelo comum (0,0083) e 5,4 vezes o do modelo de raciocínio (0,061)')] },
      { id: 'voto', nome: 'Voto majoritário, mesmo orçamento', descricao: 'Modelo comum com 5 amostras', tom: 'ink', ms: 30, linhas: [
        L('cmd', 'python voto.py --p 0.72 --n 5'),
        L('out', 'acerto agregado (binomial, erros independentes) = 86,2% · tokens = 5 x 400 = 2.000'),
        L('out', 'custo por 1.000 chamadas = 2.000 tok x 1.000 x 15 / 1e6 = US$ 30,00'),
        L('hint', 'empata em acerto com o modelo de raciocínio por menos tokens; a independência dos erros é otimista, então o ganho real é menor')] }
    ];
  };

  var codigoVoto = J([
    'from math import comb',
    '',
    '',
    'def acerto_voto(p: float, n: int) -> float:',
    '    """Probabilidade de a maioria de n amostras independentes (n ímpar) acertar,',
    '    cada uma com acerto p."""',
    '    return 0.0',
    '',
    '',
    'def custo_1000(tokens_saida: int, usd_por_milhao: float) -> float:',
    '    """Custo em US$ de 1.000 chamadas."""',
    '    return 0.0',
    '',
    '',
    'def custo_por_acerto_adicional(custo_a, acertos_a, custo_b, acertos_b):',
    '    """Quanto custa cada acerto a mais ao trocar de A para B."""',
    '    return 0.0',
    '',
    '',
    'print(round(acerto_voto(0.72, 5), 3), custo_1000(3500, 15))',
    ''
  ]);
  var testesVoto = J([
    'def test_voto_do_bloco():',
    '    assert round(acerto_voto(0.72, 3), 3) == 0.809',
    '    assert round(acerto_voto(0.72, 5), 3) == 0.862',
    '    assert round(acerto_voto(0.72, 9), 3) == 0.924',
    '',
    '',
    'def test_uma_amostra_e_o_proprio_p():',
    '    assert abs(acerto_voto(0.72, 1) - 0.72) < 1e-12',
    '',
    '',
    'def test_custos_do_exemplo():',
    '    assert round(custo_1000(400, 15), 2) == 6.00',
    '    assert round(custo_1000(3500, 15), 2) == 52.50',
    '',
    '',
    'def test_acerto_marginal_custa_8x_o_medio():',
    '    marg = custo_por_acerto_adicional(6.00, 720, 52.50, 860)',
    '    assert round(marg, 3) == 0.332',
    '    medio = 6.00 / 720',
    '    assert 39 < marg / medio < 41',
    '',
    '',
    'def test_controle_negativo_voto_nao_ajuda_quem_erra_mais_que_acerta():',
    '    assert acerto_voto(0.5, 7) == 0.5',
    '    assert acerto_voto(0.4, 5) < 0.4',
    ''
  ]);
  var solucaoVoto = J([
    'from math import comb',
    '',
    '',
    'def acerto_voto(p: float, n: int) -> float:',
    '    minimo = n // 2 + 1',
    '    return sum(comb(n, k) * p**k * (1 - p) ** (n - k) for k in range(minimo, n + 1))',
    '',
    '',
    'def custo_1000(tokens_saida: int, usd_por_milhao: float) -> float:',
    '    return 1000 * tokens_saida * usd_por_milhao / 1e6',
    '',
    '',
    'def custo_por_acerto_adicional(custo_a, acertos_a, custo_b, acertos_b):',
    '    return (custo_b - custo_a) / (acertos_b - acertos_a)',
    ''
  ]);

  TrilhaAula.registrar({
    id: 'e02-b5',
    titulo: 'Modelos de raciocínio e computação em tempo de teste',
    minutos: 35,
    resumo: 'Modelos de raciocínio mudaram a pergunta de "qual modelo é melhor?" para "quantos tokens de pensamento esta tarefa merece?". Esse gasto é uma alavanca de qualidade com preço, latência e variância próprios.',
    objetivo: 'Decidir entre modelo comum, voto/roteamento e modelo de raciocínio pelo custo do acerto marginal, a orçamento igual, e ajustar prompts, limites e agentes para raciocínio.',
    revisao: [
      { id: 'e02b5-mecanismo', pergunta: 'Por que mais tokens de pensamento podem melhorar a resposta?',
        opcoes: [
          opc('a', 'Cada token gerado é computação adicional condicionada nos anteriores; o modelo de raciocínio aprende por RL verificável a explorar, verificar e retroceder antes de responder', true, 'é computação em tempo de teste: gasta-se mais computação por consulta, em vez de só usar um modelo maior.'),
          opc('b', 'Pensar mais cria fatos que o modelo não conhece', false, 'se o fato falta, pensar mais não o cria (RAG, bloco 1).'),
          opc('c', 'O modelo fica mais seguro automaticamente', false, 'raciocinar mais não torna a resposta mais segura.')] },
      { id: 'e02b5-marginal', pergunta: 'Por que olhar o custo do acerto marginal e não o custo médio por acerto?',
        opcoes: [
          opc('a', 'O médio (0,061) subestima o preço da melhoria: cada acerto adicional custa 0,332, bem acima dos dois custos médios (cerca de 40 vezes o do modelo comum e 5,4 vezes o do modelo de raciocínio)', true, 'a decisão é de valor: o erro evitado vale mais que 0,33 e a latência é aceitável?'),
          opc('b', 'São o mesmo número', false, 'não são: o marginal considera só a diferença.'),
          opc('c', 'O médio é sempre maior', false, 'neste exemplo o marginal é maior que o médio.')] },
      { id: 'e02b5-orcamento', pergunta: 'Por que comparar a orçamento igual?',
        opcoes: [
          opc('a', 'Um modelo comum com voto de 5 amostras (≈ 86,2% com 2.000 tokens) pode empatar com o de raciocínio (86% com 3.500); a independência dos erros é otimista', true, 'plote acerto × custo × latência, não acerto só.'),
          opc('b', 'Porque modelos de raciocínio nunca vencem', false, 'podem vencer; o ponto é provar a orçamento igual.'),
          opc('c', 'Para reduzir a latência', false, 'comparar a orçamento igual é uma regra de avaliação, não de latência.')] },
      { id: 'e02b5-maxtokens', pergunta: 'Muitas respostas voltam vazias ou truncadas num modelo de raciocínio. Primeira hipótese?',
        opcoes: [
          opc('a', 'O pensamento consome o orçamento de tokens antes da resposta final; o limite deve cobrir raciocínio e resposta', true, 'tokens de raciocínio são contados e cobrados como saída.'),
          opc('b', 'O modelo ficou menos inteligente', false, 'o sintoma é de orçamento.'),
          opc('c', 'O cache expirou', false, 'não explica resposta vazia.')] }
    ],
    abas: [
      { rotulo: 'O mecanismo', blocos: [
        { tipo: 'texto', html:
          '<h3>Pensar é gastar computação por consulta</h3>' +
          '<p>A observação de partida é a de Wei et al. (2022): pedir passos intermediários (<strong>chain of thought</strong>) melhora tarefas de múltiplos passos, porque cada token gerado é computação adicional condicionada nos anteriores. Um <strong>modelo de raciocínio</strong> internaliza isso pelo treino: após o pré-treino e o SFT, aplica-se RL com recompensa verificável (bloco 4), e o modelo aprende a gerar uma longa cadeia de pensamento (explorar, verificar, retroceder) antes da resposta final.</p>' +
          '<p>Em inferência isso é <strong>computação em tempo de teste</strong> (<em>test-time compute</em>): em vez de só usar um modelo maior, gasta-se mais computação por consulta. Snell et al. (2024) mostram que, para parte dos problemas, dar mais computação ao modelo menor em tempo de teste pode superar um modelo muito maior, e que o ganho depende da dificuldade da instância.</p>' +
          '<p>Há formas externas do mesmo princípio, que valem mesmo sem modelo de raciocínio: <strong>auto-consistência</strong> (amostrar n respostas e votar), <strong>best-of-n</strong> com um verificador ou juiz, e revisão/refinamento em ciclos. Para voto majoritário com respostas independentes e acerto individual p = 0,72, o acerto agregado é 80,9% com n=3, 86,2% com n=5 e 92,4% com n=9 (distribuição binomial). A independência é otimista: erros sistemáticos se correlacionam e o ganho real é menor.</p>' },
        { tipo: 'abas', rotulo: 'Quando ganham', itens: [
          { rotulo: 'Ganham', blocos: [{ tipo: 'texto', html:
            '<ul><li>Tarefas de múltiplos passos com solução verificável: matemática, código, planejamento com restrições, análise de contratos com cláusulas interdependentes.</li>' +
            '<li>Quando a dificuldade é <strong>raciocínio</strong>, não conhecimento: se o fato falta, pensar mais não o cria (RAG, bloco 1).</li>' +
            '<li>Agentes de longo horizonte, em que um erro de planejamento custa muitos passos.</li></ul>' }] },
          { rotulo: 'Não ganham', blocos: [{ tipo: 'texto', html:
            '<p>Extração, classificação simples, reescrita, perguntas factuais curtas, qualquer coisa em que o modelo comum já atinge o teto. Aí você paga mais por tokens que não mudam a resposta, e a latência piora sem benefício.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'Raciocínio compra qualidade com <mark>tokens de pensamento</mark>; só vale onde a dificuldade é <mark>raciocínio verificável</mark>.' }
      ] },

      { rotulo: 'A conta marginal', blocos: [
        { tipo: 'texto', html:
          '<p>Tokens de raciocínio são, em geral, cobrados como tokens de saída, e podem ser resumidos ou ocultos na resposta; o consumo aparece nos metadados de uso. Exemplo (preços de saída iguais, 15 US$/M, <strong>hipotéticos</strong>): modelo comum com 72% de acerto e 400 tokens de saída; modelo de raciocínio com 86% e 3.500 tokens. Preveja o preço de cada acerto adicional.</p>' },
        { tipo: 'rode', id: 'b5-rode', titulo: 'O custo do acerto adicional', enunciado: 'Rode a conta por 1.000 chamadas e abra cada etapa. Os comandos desta tela são um script ilustrativo (a conta é a do módulo, feita à mão), não parte do lab. A barra mostra o custo em US$ por 1.000 chamadas.',
          prefixo: '$', entrada: 'python custo.py --tudo', unidade: 'US$/1.000', terminalTitulo: 'cálculo ilustrativo', etapas: etapasRaciocinio(),
          prever: { pergunta: 'O modelo comum custa 0,0083 por acerto e o de raciocínio, 0,061. Quanto custa cada acerto ADICIONAL ao trocar de um para o outro?', opcoes: [
            { id: 'a', texto: 'Cerca de 0,061, o custo médio do modelo de raciocínio.', correta: false, porque: 'o médio dilui o custo dos 720 acertos que o modelo comum já dava.' },
            { id: 'b', texto: 'Cerca de 0,332, bem acima dos dois custos médios (≈ 40 vezes o do modelo comum).', correta: true, porque: '(52,50 - 6,00) / (860 - 720) = 0,332.' },
            { id: 'c', texto: 'Cerca de 0,0083: o mesmo que o modelo comum.', correta: false, porque: 'o raciocínio gasta quase 9 vezes mais tokens.' }
          ] },
          tutorAntes: 'Aperte Enter e leia as etapas na ordem; a última compara com o voto.',
          tutorDepois: 'O acerto adicional custa 0,332. A decisão é de valor: se um erro evitado vale mais que isso e a latência de quase um minuto é aceitável (lote, sim; atendimento ao vivo, não), o raciocínio paga. Uma política mista costuma dominar: o modelo comum responde, um verificador barato estima a confiança, e só os duvidosos escalam (roteamento, M05 B06).',
          callout: 'Você viu o preço do acerto marginal e o voto empatar com o raciocínio a menos tokens.' },
        { tipo: 'python', id: 'b5-python', titulo: 'Voto majoritário e custo marginal', obrigatorio: false,
          enunciado: 'Implemente <code>acerto_voto(p, n)</code> (soma binomial dos casos em que a maioria acerta; use <code>math.comb</code>), <code>custo_1000</code> e <code>custo_por_acerto_adicional</code>. O último teste é um controle negativo: com p = 0,5 o voto não ajuda, e com p = 0,4 piora.',
          codigo: codigoVoto, testes: testesVoto,
          dica: 'Maioria = <code>n // 2 + 1</code> acertos ou mais: some <code>comb(n, k) * p**k * (1-p)**(n-k)</code> de <code>k</code> até <code>n</code>. O custo marginal é <code>(custo_b - custo_a) / (acertos_b - acertos_a)</code>.',
          solucao: solucaoVoto,
          tutorDepois: 'O voto só ajuda quem acerta mais que erra, e supõe erros independentes: na prática o ganho é menor. Por isso compare a orçamento igual e repita as execuções.',
          callout: 'O voto binomial e o custo marginal estão em código.' },
        { tipo: 'escolha', id: 'b5-esc-orcamento', titulo: 'Confira: a orçamento igual',
          pergunta: 'Modelo comum com 72% custa 400 tokens; voto de 5 amostras chega a ≈ 86,2% com 2.000 tokens; o modelo de raciocínio faz 86% com 3.500 tokens. O que a comparação a orçamento igual sugere?',
          opcoes: [
            { id: 'a', texto: 'O voto empata em acerto por menos tokens: não há prova de que o raciocínio vale o preço (ressalva: a independência dos erros é otimista).', correta: true, porque: 'sem comparar a orçamento igual, "raciocínio ganha do comum" é falso dilema; plote acerto × custo × latência.' },
            { id: 'b', texto: 'O modelo de raciocínio sempre vence.', correta: false, porque: 'a orçamento igual o voto empata, pelo menos na conta ideal.' },
            { id: 'c', texto: 'O voto sempre vence, sem ressalva.', correta: false, porque: 'o ganho do voto supõe erros independentes, e na prática é menor.' }
          ], tutorDepois: 'Latência também entra: o voto pode ser paralelizado; o raciocínio é sequencial.' },
        { tipo: 'takeaway', html: 'Decida pelo <mark>custo do acerto marginal</mark> e pelo valor do erro evitado, a <mark>orçamento igual</mark>.' }
      ] },

      { rotulo: 'Avaliar e operar', blocos: [
        { tipo: 'texto', html:
          '<h3>Quatro regras de avaliação</h3>' +
          '<ul><li><strong>Compare a orçamento igual.</strong> Um modelo comum com voto de 5 amostras que custa o mesmo e empata derruba a tese. Plote acerto × custo (e × latência).</li>' +
          '<li><strong>Varie o esforço.</strong> A curva acerto × tokens de raciocínio tem retornos decrescentes e, em algumas tarefas, platô; o ponto de operação está no joelho.</li>' +
          '<li><strong>Repita.</strong> A saída varia entre execuções mais que em modelos comuns; use várias amostras por caso e reporte intervalo (M06).</li>' +
          '<li><strong>Cheque a cadeia visível com cautela.</strong> Resumos de raciocínio exibidos ao usuário não são necessariamente fiéis ao processo interno; não os use como auditoria.</li></ul>' +
          '<h3>Impacto em prompts e agentes</h3>' +
          '<ul><li><strong>Prompts mais curtos e orientados a objetivo.</strong> "Pense passo a passo" costuma ser redundante e às vezes prejudicial; descreva objetivo, restrições e critério de pronto.</li>' +
          '<li><strong>Amostragem.</strong> Alguns modelos de raciocínio fixam ou restringem temperatura e outros parâmetros; teste antes de assumir o comportamento do modelo comum.</li>' +
          '<li><strong>Agentes (M08).</strong> Raciocínio entre chamadas de ferramenta pode melhorar o planejamento, e o histórico precisa carregar os blocos de raciocínio exigidos pela API entre turnos de ferramenta (ler a documentação do modelo). Cada passo fica mais caro e lento; revise o orçamento de passos e de tokens do loop e ajuste timeouts para não cortar o pensamento no meio.</li>' +
          '<li><strong>Streaming e UX.</strong> A latência até o primeiro token visível cresce: indicadores de progresso ou execução em segundo plano.</li></ul>' },
        { tipo: 'callout', tom: 'info', titulo: 'Parâmetros de esforço · levantamento de julho de 2026, verificado em 11/10/2026', html:
          '<p>O controle de esforço varia por fornecedor e muda. Segundo um levantamento de julho de 2026 (praticante, complemento): <code>reasoning_effort</code> (níveis baixo, médio e alto) na OpenAI; <code>thinking.budget_tokens</code> (mínimo de 1.024 tokens, limitado por <code>max_tokens</code>) em extended thinking da Anthropic; <code>thinkingLevel</code> no Gemini 3. Confirme na documentação do modelo que você usa e esconda a diferença atrás do gateway do M05, com uma noção própria de "esforço". Revalidar em até 90 dias.</p>' },
        { tipo: 'escolha', id: 'b5-esc-max', titulo: 'Confira: respostas vazias',
          pergunta: 'Você limita <code>max_tokens</code> ao tamanho da resposta esperada num modelo de raciocínio e muitas respostas voltam vazias ou truncadas. Por quê?',
          opcoes: [
            { id: 'a', texto: 'O pensamento consome o orçamento de tokens antes da resposta final; o limite deve cobrir raciocínio e resposta.', correta: true, porque: 'tokens de raciocínio são contados e cobrados como saída. Revise também timeouts e orçamento de passos dos agentes.' },
            { id: 'b', texto: 'O modelo ficou mais burro.', correta: false, porque: 'o sintoma é de orçamento, não de capacidade.' },
            { id: 'c', texto: 'O tokenizador mudou.', correta: false, porque: 'não há mudança de tokenizador no cenário.' }
          ], tutorDepois: 'Acumular raciocínio no contexto do agente sem política de poda estoura a janela.' },
        { tipo: 'cenario', id: 'b5-cenario', titulo: 'Atendimento ao vivo com modelo de raciocínio', obrigatorio: false,
          enunciado: 'Atendimento ao vivo, meta de resposta em 3 s. O modelo de raciocínio dá +9 pontos de acerto e 40 s de latência. Escolha a decisão.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O ganho de acerto é real. A latência é de 40 s. O que você faz?', opcoes: [
              { texto: 'Adotar no caminho síncrono: acerto é o que importa.', vai: 'f-adota', tom: 'ruim', consequencia: 'a meta é 3 s; o usuário espera 40 s, e o custo marginal por acerto sobe.' },
              { texto: 'Rotear: o modelo comum responde, um verificador barato estima a confiança e só os duvidosos escalam, em segundo plano.', vai: 'rotear', tom: 'ok', consequencia: 'a maioria sai em 3 s e o raciocínio fica onde o acerto marginal paga.' },
              { texto: 'Manter o modelo comum e nunca olhar para raciocínio.', vai: 'f-ignora', tom: 'ruim', consequencia: 'você deixa de capturar o ganho nos casos em que ele vale.' }
            ] },
            rotear: { texto: 'Antes de implantar a política mista, como você valida?', opcoes: [
              { texto: 'Comparar a orçamento igual com voto de várias amostras, variar o esforço e repetir as execuções.', vai: 'f-bom', tom: 'ok', consequencia: 'você sabe se o raciocínio supera o voto e onde fica o joelho da curva.' },
              { texto: 'Rodar uma vez cada modelo e escolher o de maior acerto.', vai: 'f-uma', tom: 'ruim', consequencia: 'um único run por modelo é ruído: a saída varia mais que em modelos comuns.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Resposta em 3 s para a maioria e raciocínio em segundo plano nos casos duvidosos, com a decisão justificada por latência e custo marginal.' },
            'f-adota': { bom: false, texto: 'A meta de 3 s é violada em todo o tráfego e o custo explode sem que o usuário perceba o ganho.' },
            'f-ignora': { bom: false, texto: 'Os casos difíceis continuam errando e a janela de melhoria passa.' },
            'f-uma': { bom: false, texto: 'A escolha parece certa e não se sustenta na repetição.' }
          },
          callout: 'Você decidiu por latência e custo marginal, e validou antes de implantar.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: raciocinar mais não é mais seguro', html:
          '<p>Mais tokens de pensamento melhoram a competência e o uso estratégico de ferramentas, e também a capacidade de seguir longas instruções injetadas ou de racionalizar uma ação indevida. Um agente de raciocínio com acesso a ações irreversíveis exige as mesmas barreiras do agente comum (bloco 6, M12). E "o modelo pensou e decidiu" não é registro de auditoria: registre a entrada, a decisão e as evidências.</p>' },
        { tipo: 'takeaway', html: 'Prompt de <mark>objetivo</mark>, <mark>max_tokens</mark> cobrindo o pensamento e as mesmas <mark>barreiras</mark> do agente comum.' }
      ] }
    ]
  });
})();
