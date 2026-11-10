/* E02 · Bloco 3: PEFT e LoRA. Fonte: E02.html#b03. Números do lab: execução real em 11/10/2026 (numpy, float64, semente 7). Dimensões do exemplo de 8B são hipotéticas. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  var J = function (a) { return a.join('\n'); };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasSweep = function () {
    return [
      { id: 'cmd', nome: 'Varredura de rank', descricao: '48 exemplos; a mudança verdadeira tem posto 2', tom: 'dns', ms: 0, linhas: [
        L('cmd', 'uv run python -m adapt_lab.cli sweep'),
        L('info', 'n_adapt=48 (a mudanca verdadeira tem posto 2)'),
        L('out', 'rank  treinaveis  erro B  erro A')] },
      { id: 'r1', nome: 'r = 1', descricao: '168 parâmetros treináveis', tom: 'tcp', ms: 168, linhas: [
        L('out', '   1         168  0.1200  0.0947'),
        L('hint', 'capacidade abaixo do posto real: não alcança o deslocamento')] },
      { id: 'r2', nome: 'r = 2', descricao: '336 parâmetros treináveis', tom: 'tls', ms: 336, linhas: [
        L('out', '   2         336  0.0510  0.1628'),
        L('hint', 'o mínimo do erro em B: r = posto real do deslocamento')] },
      { id: 'r4', nome: 'r = 4', descricao: '672 parâmetros treináveis', tom: 'request', ms: 672, linhas: [
        L('out', '   4         672  0.1364  0.1076'),
        L('hint', 'capacidade extra que se ajusta ao ruído de 48 exemplos')] },
      { id: 'r8', nome: 'r = 8', descricao: '1344 parâmetros treináveis', tom: 'response', ms: 1344, linhas: [
        L('out', '   8        1344  0.1284  0.0989')] },
      { id: 'leitura', nome: 'Leitura honesta', descricao: 'Uma semente, 48 exemplos', tom: 'ink', ms: 0, linhas: [
        L('in', 'a curva não é monotônica nem suave: é uma semente e 48 exemplos'),
        L('hint', 'não conclua "rank = posto verdadeiro é ótimo" de uma tabela; rank alto sem dados suficientes não ajuda, e o resultado precisa de várias sementes')] }
    ];
  };

  var codigoParams = J([
    'def params_lora(d: int, k: int, r: int) -> int:',
    '    """Treináveis por matriz: A (r x k) + B (d x r)."""',
    '    return 0',
    '',
    '',
    'def params_atencao(camadas: int, projecoes: int, d: int, k: int, r: int) -> int:',
    '    return 0',
    '',
    '',
    'def escala(alpha: float, r: int) -> float:',
    '    """Fator que multiplica o delta B.A."""',
    '    return 0.0',
    '',
    '',
    'def mb_adapter(params: int, bytes_por_param: int = 2) -> float:',
    '    """Tamanho em MB (1 MB = 1e6 bytes)."""',
    '    return 0.0',
    '',
    '',
    'print(params_atencao(32, 4, 4096, 4096, 16), escala(16, 64))',
    ''
  ]);
  var testesParams = J([
    'def test_por_matriz_do_exemplo():',
    '    assert params_lora(4096, 4096, 16) == 131_072',
    '    assert params_lora(4096, 4096, 16) / 4096**2 < 0.0079',
    '',
    '',
    'def test_total_de_atencao_do_modelo_de_8b():',
    '    assert params_atencao(32, 4, 4096, 4096, 16) == 16_777_216',
    '    assert round(mb_adapter(16_777_216), 1) == 33.6',
    '',
    '',
    'def test_linear_em_r_nao_quadratico():',
    '    assert params_lora(4096, 4096, 32) == 2 * params_lora(4096, 4096, 16)',
    '',
    '',
    'def test_checkpoint_r8_e_r64():',
    '    assert params_atencao(32, 4, 4096, 4096, 8) == 8_388_608',
    '    assert params_atencao(32, 4, 4096, 4096, 64) == 67_108_864',
    '',
    '',
    'def test_escala_efetiva():',
    '    assert escala(16, 8) == 2.0',
    '    assert escala(16, 64) == 0.25',
    '    assert escala(2 * 16, 16) == 2.0',
    '',
    '',
    'def test_matriz_nao_quadrada_do_lab():',
    '    # MLP 32->64->8: r*(32+64) + r*(64+8) = 168*r',
    '    assert params_lora(64, 32, 2) + params_lora(8, 64, 2) == 336',
    ''
  ]);
  var solucaoParams = J([
    'def params_lora(d: int, k: int, r: int) -> int:',
    '    return r * (d + k)',
    '',
    '',
    'def params_atencao(camadas: int, projecoes: int, d: int, k: int, r: int) -> int:',
    '    return camadas * projecoes * params_lora(d, k, r)',
    '',
    '',
    'def escala(alpha: float, r: int) -> float:',
    '    return alpha / r',
    '',
    '',
    'def mb_adapter(params: int, bytes_por_param: int = 2) -> float:',
    '    return params * bytes_por_param / 1e6',
    ''
  ]);

  var codigoMerge = J([
    'def matvec(M, x):',
    '    return [sum(m * v for m, v in zip(linha, x)) for linha in M]',
    '',
    '',
    'def forward_separado(W, A, B, alpha, x):',
    '    """y = W x + (alpha/r) * B (A x). Nunca monta a matriz d x k do delta."""',
    '    r = len(A)',
    '    base = matvec(W, x)',
    '    # 1. calcule A x (tamanho r) e depois B sobre ele',
    '    # 2. some base + (alpha / r) * o resultado, elemento a elemento',
    '    return base',
    '',
    '',
    'def fundir(W, A, B, alpha):',
    '    """W\' = W + (alpha/r) * B A, devolvendo uma matriz nova (não altera W)."""',
    '    return [linha[:] for linha in W]',
    '',
    '',
    'W = [[1.0, 0.0, 2.0], [0.0, 1.0, -1.0]]',
    'A = [[0.5, -0.5, 0.0]]',
    'B = [[1.0], [2.0]]',
    'print(forward_separado(W, A, B, 2.0, [1.0, 2.0, 3.0]))',
    ''
  ]);
  var testesMerge = J([
    'W = [[1.0, 0.0, 2.0], [0.0, 1.0, -1.0], [2.0, 1.0, 0.5]]',
    'A = [[0.5, -0.5, 0.0], [0.1, 0.2, 0.3]]',
    'B = [[1.0, 0.0], [2.0, -1.0], [0.0, 0.5]]',
    'X = [1.0, 2.0, 3.0]',
    '',
    '',
    'def test_b_zero_nao_muda_a_saida():',
    '    B0 = [[0.0, 0.0] for _ in range(3)]',
    '    assert forward_separado(W, A, B0, 4.0, X) == matvec(W, X)',
    '',
    '',
    'def test_forward_separado_com_delta():',
    '    # A x = [-0.5, 1.4]; B(A x) = [-0.5, -2.4, 0.7]; escala 4/2 = 2',
    '    y = forward_separado(W, A, B, 4.0, X)',
    '    base = matvec(W, X)',
    '    esperado = [base[0] - 1.0, base[1] - 4.8, base[2] + 1.4]',
    '    assert all(abs(a - b) < 1e-12 for a, b in zip(y, esperado))',
    '',
    '',
    'def test_merge_igual_ao_adapter_separado():',
    '    y1 = forward_separado(W, A, B, 4.0, X)',
    '    y2 = matvec(fundir(W, A, B, 4.0), X)',
    '    assert max(abs(a - b) for a, b in zip(y1, y2)) < 1e-12',
    '',
    '',
    'def test_fundir_nao_altera_a_base():',
    '    copia = [linha[:] for linha in W]',
    '    fundir(W, A, B, 4.0)',
    '    assert W == copia',
    '',
    '',
    'def test_controle_negativo_escala_errada_diverge():',
    '    y1 = forward_separado(W, A, B, 4.0, X)',
    '    y2 = matvec(fundir(W, A, B, 2.0), X)',
    '    assert max(abs(a - b) for a, b in zip(y1, y2)) > 0.1',
    ''
  ]);
  var solucaoMerge = J([
    'def matvec(M, x):',
    '    return [sum(m * v for m, v in zip(linha, x)) for linha in M]',
    '',
    '',
    'def forward_separado(W, A, B, alpha, x):',
    '    r = len(A)',
    '    base = matvec(W, x)',
    '    ax = matvec(A, x)',
    '    delta = matvec(B, ax)',
    '    return [b + (alpha / r) * d for b, d in zip(base, delta)]',
    '',
    '',
    'def fundir(W, A, B, alpha):',
    '    r = len(A)',
    '    saida = []',
    '    for i, linha in enumerate(W):',
    '        nova = []',
    '        for j, w in enumerate(linha):',
    '            ba = sum(B[i][t] * A[t][j] for t in range(r))',
    '            nova.append(w + (alpha / r) * ba)',
    '        saida.append(nova)',
    '    return saida',
    ''
  ]);

  TrilhaAula.registrar({
    id: 'e02-b3',
    titulo: 'PEFT e LoRA: a álgebra, o rank e o merge',
    minutos: 40,
    resumo: 'LoRA aprende um delta de baixo posto com o modelo-base congelado. Quem opera adaptadores precisa da álgebra, do papel de rank e alpha, das camadas-alvo, do que o QLoRA troca por memória e de quando fundir.',
    objetivo: 'Explicar W + (α/r)·B·A, contar parâmetros treináveis, escolher alvos e escala, decidir entre fundir e servir separado, e desconfiar de "LoRA esquece menos" sem medir.',
    revisao: [
      { id: 'e02b3-formula', pergunta: 'Qual é a fórmula do LoRA e por que B começa em zero?',
        opcoes: [
          opc('a', 'W\' = W + (α/r)·B·A; com B = 0 o modelo adaptado começa idêntico ao base, e o gradiente de B já é não nulo no primeiro passo', true, 'se A e B fossem ambos zero, os gradientes seriam nulos e nada se moveria; A é aleatório.'),
          opc('b', 'W\' = W·B·A, com tudo inicializado em 1', false, 'o delta é aditivo e começa nulo.'),
          opc('c', 'W\' = A + B, sem o termo W', false, 'o peso base fica congelado e continua somando.')] },
      { id: 'e02b3-contagem', pergunta: 'Quantos parâmetros treináveis tem uma matriz d×k adaptada por LoRA de rank r?',
        opcoes: [
          opc('a', 'r·(d + k): linear em r', true, 'A tem r×k e B tem d×r.'),
          opc('b', 'd·k', false, 'isso é a matriz inteira, o que o LoRA evita.'),
          opc('c', 'r²', false, 'não depende de r ao quadrado nem de d e k.')] },
      { id: 'e02b3-escala', pergunta: 'Um tutorial usa r = 64 e α = 16. A convenção do módulo é α = 2r. Qual a diferença?',
        opcoes: [
          opc('a', 'A escala efetiva α/r é 0,25 no tutorial e 2 na convenção: oito vezes menor, o que muda a taxa de aprendizado adequada', true, 'trate (α, lr) como um botão só.'),
          opc('b', 'Nenhuma: só o rank importa', false, 'α/r multiplica o delta B·A.'),
          opc('c', 'α só importa no merge', false, 'α/r vale no forward desde o treino.')] },
      { id: 'e02b3-merge', pergunta: 'Qual o procedimento correto para entregar um adapter fundido treinado sobre base em 4 bits?',
        opcoes: [
          opc('a', 'Fundir em bf16/fp16 sobre o base de precisão alta, avaliar o fundido, só então quantizar e reavaliar', true, 'o fundido é o que vai a produção; em 4 bits o erro de re-quantização pode apagar parte do delta.'),
          opc('b', 'Somar o delta direto nos pesos de 4 bits e entregar', false, 'o arredondamento pode apagar o delta.'),
          opc('c', 'Avaliar só o adapter separado e entregar o fundido', false, 'o artefato que vai ao ar tem de ser o avaliado.')] },
      { id: 'e02b3-base', pergunta: 'Por que registrar o hash do base junto do adapter?',
        opcoes: [
          opc('a', 'O adapter é um diff que só tem sentido sobre a sua base; outra revisão com o mesmo nome produz erros silenciosos (dimensões casam, comportamento não)', true, 'recuse carregar em desacordo.'),
          opc('b', 'Para o adapter ocupar menos espaço', false, 'o hash não muda o tamanho.'),
          opc('c', 'Só para auditoria jurídica', false, 'o motivo principal é técnico: erro silencioso.')] }
    ],
    abas: [
      { rotulo: 'A álgebra', blocos: [
        { tipo: 'texto', html:
          '<h3>De "o que é LoRA" a "como opero um"</h3>' +
          '<p>O M11 mostrou LoRA em duas frases e um trecho de <code>peft</code>. Quem opera adaptadores precisa do resto: a álgebra que explica por que funciona e onde falha, o que rank e alpha controlam, quais camadas adaptar, o que o QLoRA troca por memória e quando fundir. Sem isso, os hiperparâmetros viram folclore copiado de notebooks.</p>' +
          '<p><strong>PEFT</strong> (<em>parameter-efficient fine-tuning</em>) é a família de métodos que treina uma fração pequena de parâmetros. <strong>LoRA</strong> (Hu et al., 2021) parte da hipótese de que a atualização necessária a uma matriz de pesos pré-treinada tem <strong>posto intrínseco baixo</strong>. Em vez de aprender o ΔW inteiro (<code>d×k</code>), aprende dois fatores:</p>' },
        { tipo: 'codigo', linguagem: 'texto', texto: "W' = W + (α / r) · B · A\nA ∈ R^(r×k)   B ∈ R^(d×r)   r ≪ min(d, k)\n\nforward:  y = W·x + (α/r)·B·(A·x)" },
        { tipo: 'texto', html:
          '<p>O termo de adapter nunca materializa a matriz <code>d×k</code>: calcula-se <code>A·x</code> (tamanho <code>r</code>) e depois <code>B</code> sobre ele. Os gradientes só existem para <code>A</code> e <code>B</code>; <code>W</code> fica <strong>congelada</strong>, o que elimina os estados do otimizador e os gradientes dos pesos originais.</p>' +
          '<h3>Por que B = 0, e o papel de alpha</h3>' +
          '<p>Com <code>B = 0</code> o produto é nulo: o modelo adaptado começa idêntico ao base (o lab testa isso em <code>test_b_zero_at_init_does_not_change_output</code>). Se ambos fossem zero, os gradientes de ambos seriam nulos e nada se moveria; com <code>A</code> aleatório (gaussiano pequeno, escala <code>1/√k</code>), o gradiente de <code>B</code> é não nulo já no primeiro passo e <code>A</code> começa a receber gradiente assim que <code>B</code> deixa de ser zero.</p>' +
          '<p><code>α/r</code> é um fator de escala fixo. Existe para que, ao variar o rank, a magnitude do delta continue comparável sem retunar a taxa de aprendizado. Com <code>α = 2r</code> (convenção comum, usada no lab) a escala é sempre 2; um <code>α</code> fixo com <code>r</code> variável muda a escala. A variante <strong>rsLoRA</strong> usa <code>α/√r</code> e relata melhor comportamento em ranks altos (Kalajdzievski, 2023). Na prática: escolha o α pela escala efetiva e ajuste a taxa de aprendizado com ela; trate a dupla (α, lr) como um só botão.</p>' },
        { tipo: 'takeaway', html: 'O adapter é um <mark>delta de baixo posto</mark> sobre um base congelado, com <mark>B = 0</mark> para começar idêntico ao base.' }
      ] },

      { rotulo: 'Contar e escolher', blocos: [
        { tipo: 'texto', html:
          '<h3>Contagem de parâmetros</h3>' +
          '<p>Por camada, <code>r·(d + k)</code> parâmetros no lugar de <code>d·k</code>. Exemplo hipotético com dimensões de um modelo de 8 bilhões: 32 camadas, 4 projeções de atenção 4096×4096 por camada, r = 16.</p>' +
          '<ul><li>Por matriz: <code>16 × (4096 + 4096) = 131.072</code>, contra <code>4096² = 16.777.216</code> (0,78%).</li>' +
          '<li>Total das projeções de atenção: <code>4 × 32 × 131.072 = 16.777.216</code> treináveis; em 16 bits, ≈ 33,6 MB de adapter.</li>' +
          '<li>Memória de treino do full fine-tuning com Adam em precisão mista: ordem de 16 bytes por parâmetro (pesos, gradientes, cópia mestra e dois momentos), 8 B × 16 = 128 GB.</li>' +
          '<li>Com LoRA, os pesos base ocupam 8 B × 2 bytes = 16 GB e só o adapter carrega gradiente e estados, mais as ativações.</li>' +
          '<li>Com QLoRA, o base cai para ≈ 0,5 byte por parâmetro (≈ 4 GB, mais constantes de quantização).</li></ul>' +
          '<p>No lab (MLP 32→64→8, 2.632 parâmetros) a fórmula dá <code>r·(32+64) + r·(64+8) = 168·r</code>: 168 com r=1, 336 com r=2, 12,8% do total. A fração é alta porque o modelo é minúsculo; em LLM a mesma conta dá menos de 1%.</p>' },
        { tipo: 'python', id: 'b3-python-params', titulo: 'Parâmetros, escala e tamanho do adapter', obrigatorio: false,
          enunciado: 'Implemente <code>params_lora</code>, <code>params_atencao</code>, <code>escala</code> e <code>mb_adapter</code> (1 MB = 1e6 bytes). Os testes cobrem o exemplo de 8B, o rank 8 contra 64 e o caso não quadrado do lab.',
          codigo: codigoParams, testes: testesParams,
          dica: 'Por matriz, <code>r * (d + k)</code>. O total é <code>camadas * projecoes * params_lora(...)</code>. A escala é <code>alpha / r</code>; o tamanho em MB, <code>params * bytes / 1e6</code>.',
          solucao: solucaoParams,
          tutorDepois: 'Dobrar o rank dobra os parâmetros (linear em r), não os quadruplica. Com α fixo em 16, a escala vai de 2 (r=8) a 0,25 (r=64): o delta efetivo encolhe e a taxa precisa ser reajustada, ou use α proporcional a r.',
          callout: 'A contagem de parâmetros e a escala efetiva estão em código.' },
        { tipo: 'texto', html:
          '<h3>Onde aplicar</h3>' +
          '<p>O artigo original adaptou apenas as projeções de atenção (<code>q</code> e <code>v</code>), e o <code>peft</code> usa esse padrão em muitos modelos. O trabalho do QLoRA (Dettmers et al., 2023) mostrou que adaptar <strong>todas as camadas lineares</strong> (atenção e MLP) é o que aproxima a qualidade de full fine-tuning. Regra operacional: comece com todas as lineares e rank moderado (8 a 32); só reduza alvos se memória ou tamanho do adapter obrigarem, e prove com a suíte que a qualidade se manteve. Embedding e cabeça de saída só entram se você alterou vocabulário ou template com tokens novos. Mais rank não é "melhor" automaticamente: aumenta a capacidade de memorizar os dados de treino, e com 48 exemplos o excesso vira ruído.</p>' },
        { tipo: 'escolha', id: 'b3-esc-rank', titulo: 'Confira: dobrar o rank',
          pergunta: 'Num LoRA com d = k = 4096, você dobra o rank de 16 para 32. O que acontece com os parâmetros treináveis por matriz?',
          opcoes: [
            { id: 'a', texto: 'Dobram (131.072 para 262.144): crescem linearmente em r.', correta: true, porque: 'A tem r×k e B tem d×r, então o total é r·(d + k). Mesmo com r = 32, cada matriz treina ≈ 1,6% de 4096².' },
            { id: 'b', texto: 'Quadruplicam, porque A e B têm r cada.', correta: false, porque: 'a contagem é linear em r.' },
            { id: 'c', texto: 'Permanecem iguais: dependem só de d e k.', correta: false, porque: 'r entra diretamente na fórmula.' }
          ], tutorDepois: 'Aumentar rank não é de graça em memória do otimizador e, sem mais dados, costuma ajustar ruído.' },
        { tipo: 'takeaway', html: 'Parâmetros treináveis: <mark>r·(d + k)</mark> por matriz; comece com <mark>todas as lineares</mark> e rank 8 a 32.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>No lab, a mudança verdadeira entre as tarefas A e B tem <strong>posto 2</strong> por construção. A varredura de rank usa semente 7 e 48 exemplos (saída real). Preveja onde o erro em B é mínimo.</p>' },
        { tipo: 'rode', id: 'b3-rode', titulo: 'Varredura de rank', enunciado: 'Rode a varredura e clique em cada rank para ler a linha dele. A barra mostra os parâmetros treináveis.',
          prefixo: '$', entrada: 'uv run python -m adapt_lab.cli sweep', unidade: 'params', terminalTitulo: 'adapt_lab', etapas: etapasSweep(),
          prever: { pergunta: 'A mudança verdadeira tem posto 2. Com 48 exemplos e ranks 1, 2, 4 e 8, onde o erro na tarefa B deve ser menor?', opcoes: [
            { id: 'a', texto: 'No rank 8: mais capacidade sempre ajuda.', correta: false, porque: 'com 48 exemplos o excesso de capacidade se ajusta ao ruído.' },
            { id: 'b', texto: 'No rank 2, o posto real do deslocamento.', correta: true, porque: 'o mínimo é 0,0510 em r=2; r=4 e r=8 ficam em 0,13, mais altos.' },
            { id: 'c', texto: 'Em todos igual: o rank não importa.', correta: false, porque: 'os erros variam de 0,05 a 0,14.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em r = 2 e depois em "Leitura honesta".',
          tutorDepois: 'O mínimo cai em r=2, mas a curva não é monotônica nem suave: é uma semente e 48 exemplos. Rode com <code>--n-adapt 400</code> e veja o que muda com mais dados. Pergunta aberta: o que acontece com r=4 e r=8 quando os dados aumentam? (Hipótese a testar: o excesso de capacidade deixa de se ajustar ao ruído.)',
          callout: 'Você viu o mínimo em r=2 e, ao lado, a razão para não generalizar de uma semente.' },
        { tipo: 'callout', tom: 'danger', titulo: '"LoRA aprende menos e esquece menos": só com medição', html:
          '<p>Variância entre sementes (lab, execução real de 11/10/2026): em B, o LoRA (r=2) vence o full fine-tuning em 3 das 4 sementes, com 12,8% dos parâmetros treináveis. Mas em A, o LoRA esquece <strong>mais</strong> que o full nas quatro sementes. O que a evidência do lab sustenta é estreito: neste modelo minúsculo, com taxa de 3e-3 sobre 48 exemplos e adapter em todas as camadas, o baixo posto não protegeu a tarefa antiga.</p>' +
          '<p>Hipóteses não testadas aqui: o adapter na camada de saída permite alterar o mapeamento final livremente; a taxa de LoRA é dez vezes a do full. O resultado em LLM reais (Biderman et al., 2024) é outro. A afirmação depende de escala, taxa e dados: meça no seu caso.</p>' },
        { tipo: 'takeaway', html: '"LoRA esquece menos" é <mark>hipótese a medir</mark>, e uma semente não sustenta afirmação.' }
      ] },

      { rotulo: 'QLoRA, adapters e merge', blocos: [
        { tipo: 'abas', rotulo: 'Três decisões de operação', itens: [
          { rotulo: 'QLoRA', blocos: [{ tipo: 'texto', html:
            '<p>O <strong>QLoRA</strong> carrega o base em 4 bits (formato NF4, com dupla quantização das constantes e otimizadores paginados para absorver picos de memória) e treina adapters em 16 bits por cima, propagando o gradiente através dos pesos dequantizados em tempo de uso. Troca memória por tempo (a dequantização custa) e por uma pequena perda de fidelidade do base. Quando a GPU cabe com o base em 16 bits, LoRA simples é mais rápido.</p>' }] },
          { rotulo: 'Vários adapters', blocos: [{ tipo: 'texto', html:
            '<p>Um adapter por tarefa, cliente ou idioma é o padrão de multilocação: o base é compartilhado e carregado uma vez; os adapters (dezenas de MB) são trocados por requisição. Servidores como o vLLM suportam isso (ver bloco 7). Combinar adapters por soma ponderada (<code>ΔW₁ + ΔW₂</code>) é possível, mas interferências não são garantidas de se cancelar: avalie a combinação como um artefato novo.</p>' }] },
          { rotulo: 'Merge', blocos: [{ tipo: 'texto', html:
            '<p>Fundir é uma operação exata em precisão infinita: <code>W\' = W + (α/r)·B·A</code>, e o resultado é um modelo comum, sem custo extra de inferência. O lab verifica: a diferença máxima entre o forward com adapter separado e o do modelo fundido, na tarefa B, é de <code>2,00e-15</code> (ruído de ponto flutuante em float64). Em 16 bits o arredondamento é maior, e sobre base quantizada em 4 bits o erro de re-quantização pode apagar parte do delta.</p>' +
            '<p><strong>Regra:</strong> funda em bf16/fp16 sobre o base de precisão alta e avalie o <em>fundido</em>, não o adapter, porque o fundido é o que irá a produção. Fundir mata a flexibilidade (trocar de adapter por requisição) e a reversibilidade barata: o adapter separado é um arquivo; o fundido é outro modelo inteiro de dezenas de GB.</p>' }] }
        ] },
        { tipo: 'python', id: 'b3-python-merge', titulo: 'Forward separado × modelo fundido', obrigatorio: false,
          enunciado: 'Com listas de listas (sem pacotes), implemente <code>forward_separado</code> (<code>W·x + (α/r)·B·(A·x)</code>, sem montar o delta) e <code>fundir</code> (<code>W + (α/r)·B·A</code>, devolvendo matriz nova). Os testes cobrem B = 0, a equivalência entre os dois caminhos e um controle negativo: fundir com a escala errada diverge.',
          codigo: codigoMerge, testes: testesMerge,
          dica: 'Em <code>forward_separado</code>: <code>ax = matvec(A, x)</code>, <code>delta = matvec(B, ax)</code> e some <code>(alpha / r) * d</code> à base. Em <code>fundir</code>, o elemento (i, j) de B·A é <code>sum(B[i][t] * A[t][j] for t in range(r))</code>.',
          solucao: solucaoMerge,
          tutorDepois: 'O forward separado é o que o servidor multi-adapter faz; o fundido é um modelo comum. A diferença é só arredondamento, e é por isso que o fundido, não o adapter, precisa ser reavaliado.',
          callout: 'Você viu o merge ser exato na álgebra e entendeu por que ele ainda precisa de reavaliação.' },
        { tipo: 'ordene', id: 'b3-ordene-merge', titulo: 'Ordene a entrega de um adapter treinado sobre base em 4 bits',
          enunciado: 'O adapter foi treinado com QLoRA e vai ser entregue fundido. Ponha os passos na ordem correta.',
          itens: [
            { id: 'quant', texto: 'Quantizar o fundido, se a entrega exigir, e reavaliar o artefato quantizado' },
            { id: 'avalia', texto: 'Avaliar o fundido na suíte (alvo e guardas)' },
            { id: 'funde', texto: 'Fundir o adapter em bf16/fp16 sobre o base de precisão alta' },
            { id: 'hash', texto: 'Verificar que o hash do base é o mesmo com que o adapter foi treinado' }
          ], solucao: ['hash', 'funde', 'avalia', 'quant'],
          dica: 'O artefato que vai ao ar é o que precisa ter sido avaliado.',
          tutorDepois: 'Hash do base, merge em precisão alta, avaliação do fundido e só então quantização com nova avaliação. Somar o delta direto em pesos de 4 bits e entregar sem reavaliar é a falha.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o adapter é um diff', html:
          '<p>O adapter só tem sentido sobre a sua base. Dois checkpoints com o mesmo nome e revisões diferentes (um retreino do fornecedor, uma quantização distinta, um tokenizador atualizado) produzem erros silenciosos: nenhuma falha de forma, só respostas piores. Registre o <strong>hash do base</strong> junto do adapter e recuse carregar em desacordo. E lembre que "pequeno" é falso conforto: um adapter de 30 MB pode reescrever a política de recusa do modelo inteiro.</p>' },
        { tipo: 'escolha', id: 'b3-esc-escala', titulo: 'Confira: a escala do tutorial',
          pergunta: 'Seu LoRA "não aprende" com r = 64 e α = 16 copiados de um tutorial. Qual a primeira hipótese?',
          opcoes: [
            { id: 'a', texto: 'A escala efetiva α/r é 0,25, oito vezes menor que a convenção α = 2r; revisar α e a taxa de aprendizado como um botão só.', correta: true, porque: 'copiar (r, α) sem notar a escala efetiva é fonte clássica de "meu LoRA não aprende".' },
            { id: 'b', texto: 'O LoRA não funciona em modelos grandes.', correta: false, porque: 'o método funciona; o que mudou foi a escala do delta.' },
            { id: 'c', texto: 'Falta aumentar o rank para 128.', correta: false, porque: 'mais rank não corrige uma escala pequena e aumenta o risco de memorizar.' }
          ], tutorDepois: 'Trate (α, lr) como um botão só.' },
        { tipo: 'takeaway', html: 'Funda em <mark>precisão alta</mark>, avalie o <mark>fundido</mark> e registre o hash do base.' }
      ] }
    ]
  });
})();
