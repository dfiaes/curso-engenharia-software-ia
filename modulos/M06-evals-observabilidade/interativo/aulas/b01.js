/* M06 · Bloco 1: como testes unitários e evals se complementam. Fonte: M06.html#b01. Saídas do rode vêm de execução real em CPython; contas do bloco conferidas em Python. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var PY_b01 = {
  codigo: [
    "import math",
    "",
    "",
    "def wilson(x, n, z=1.96):",
    "    \"\"\"Intervalo de Wilson para x acertos em n casos (z = 1.96 dá 95%).\"\"\"",
    "    p = x / n",
    "    # centro = (p + z²/(2n)) / (1 + z²/n); meia-largura = z·√(p(1-p)/n + z²/(4n²)) / (1 + z²/n)",
    "    return 0.0, 1.0",
    "",
    "",
    "def decisao(lo, hi, limiar):",
    "    \"\"\"APROVA se o intervalo inteiro está no limiar ou acima; REPROVA se inteiro abaixo; senão INCONCLUSIVO.\"\"\"",
    "    return \"INCONCLUSIVO\"",
    "",
    "",
    "def n_planejamento(p0, p1, za=1.96, zb=0.84, corrigido=False):",
    "    \"\"\"n' = ((za·√(p0(1-p0)) + zb·√(p1(1-p1))) / δ)², arredondado para cima. Com correção: n' + 1/δ.\"\"\"",
    "    return 0",
    "",
    "",
    "print(wilson(45, 50), decisao(0.786, 0.957, 0.85))"
  ].join("\n"),
  testes: [
    "def test_wilson_45_de_50():",
    "    lo, hi = wilson(45, 50)",
    "    assert abs(lo - 0.786) < 0.002 and abs(hi - 0.957) < 0.002",
    "",
    "",
    "def test_mais_casos_estreitam_o_intervalo():",
    "    lo1, hi1 = wilson(45, 50)",
    "    lo2, hi2 = wilson(180, 200)",
    "    assert abs(lo2 - 0.851) < 0.002 and abs(hi2 - 0.934) < 0.002",
    "    assert (hi2 - lo2) < (hi1 - lo1)",
    "",
    "",
    "def test_borda_zero_e_todos_dentro_de_0_e_1():",
    "    lo, hi = wilson(0, 10)",
    "    assert lo == 0.0 and 0 < hi < 0.35",
    "    lo, hi = wilson(10, 10)",
    "    assert 0.65 < lo < 1.0 and hi <= 1.0",
    "",
    "",
    "def test_decisao_tem_tres_saidas():",
    "    assert decisao(0.786, 0.957, 0.85) == \"INCONCLUSIVO\"",
    "    assert decisao(0.851, 0.934, 0.85) == \"APROVA\"",
    "    assert decisao(0.50, 0.70, 0.85) == \"REPROVA\"",
    "",
    "",
    "def test_tamanho_de_planejamento():",
    "    assert n_planejamento(0.90, 0.95) == 238",
    "    assert n_planejamento(0.90, 0.95, corrigido=True) == 258",
    "",
    "",
    "def test_efeito_zero_e_recusado():",
    "    try:",
    "        n_planejamento(0.90, 0.90)",
    "    except ValueError:",
    "        return",
    "    assert False, \"efeito mínimo zero precisa levantar ValueError\""
  ].join("\n"),
  solucao: [
    "import math",
    "",
    "",
    "def wilson(x, n, z=1.96):",
    "    p = x / n",
    "    d = 1 + z * z / n",
    "    c = (p + z * z / (2 * n)) / d",
    "    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d",
    "    return max(0.0, c - h), min(1.0, c + h)",
    "",
    "",
    "def decisao(lo, hi, limiar):",
    "    if lo >= limiar:",
    "        return \"APROVA\"",
    "    if hi < limiar:",
    "        return \"REPROVA\"",
    "    return \"INCONCLUSIVO\"",
    "",
    "",
    "def n_planejamento(p0, p1, za=1.96, zb=0.84, corrigido=False):",
    "    delta = abs(p1 - p0)",
    "    if delta == 0:",
    "        raise ValueError(\"declare um efeito mínimo relevante diferente de zero\")",
    "    n = ((za * math.sqrt(p0 * (1 - p0)) + zb * math.sqrt(p1 * (1 - p1))) / delta) ** 2",
    "    if corrigido:",
    "        n += 1 / delta",
    "    return math.ceil(n)"
  ].join("\n")
  };

  var etapasWilson = function () {
    return [
      { id: 'codigo', nome: 'Duas medições', descricao: '45 de 50 e 180 de 200', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python wilson.py'),
        L('info', 'mesma taxa observada (90%), tamanhos diferentes: n = 50 e n = 200'),
        L('hint', 'o ponto estimado é idêntico; a incerteza não')] },
      { id: 'n50', nome: 'n = 50', descricao: '45 acertos', tom: 'tcp', ms: 2, linhas: [
        L('out', '45/50: p=90.0% ep=4.24pp wilson=78.6%-95.7%'),
        L('hint', 'o intervalo vai de 78,6% a 95,7%: 17 pontos de largura')] },
      { id: 'n200', nome: 'n = 200', descricao: '180 acertos', tom: 'tls', ms: 2, linhas: [
        L('out', '180/200: p=90.0% ep=2.12pp wilson=85.1%-93.4%'),
        L('hint', 'quadruplicar n reduziu o erro padrão pela metade: 4,24 para 2,12 pontos')] },
      { id: 'borda', nome: 'Os 15 casos do checkpoint', descricao: '12/15 contra 13/15', tom: 'request', ms: 2, linhas: [
        L('out', '12/15: p=80.0% ep=10.33pp wilson=54.8%-93.0%'),
        L('out', '13/15: p=86.7% ep=8.78pp wilson=62.1%-96.3%'),
        L('hint', 'um caso de diferença e intervalos que se sobrepõem quase por inteiro: nada aqui sustenta promoção')] },
      { id: 'leitura', nome: 'Leitura', descricao: 'O que decide a regra', tom: 'ink', ms: 1, linhas: [
        L('in', 'o intervalo contém o limiar? então o resultado é inconclusivo'),
        L('hint', 'limiar, população e custo dos erros são definidos antes de olhar o número')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm06-b1',
    titulo: 'Testes unitários e evals: quem faz o quê',
    minutos: 35,
    resumo: 'assertEqual falha em saída de LLM por três propriedades do sistema. Um eval tem quatro partes, uma escada de três níveis e vem depois da análise de erro; a estatística mínima evita ler ruído como efeito.',
    objetivo: 'Explicar por que evals complementam testes unitários, montar a anatomia de um eval e calcular o que uma taxa de acerto consegue (e não consegue) dizer.',
    revisao: [
      { id: 'm06b1-props', pergunta: 'Quais três propriedades de um sistema com LLM tornam <code>assertEqual</code> sobre o texto a ferramenta errada?',
        opcoes: [
          opc('a', 'Saída não única, não determinística (nem com <code>temperature=0</code>) e mudança global (um prompt afeta todos os comportamentos)', true, 'por isso se mede <strong>taxa</strong> sobre um conjunto, por categoria, e se roda a suíte inteira a cada mudança.'),
          opc('b', 'Lentidão, custo por token e limite de contexto', false, 'são restrições reais, mas não explicam por que a comparação exata de texto falha.'),
          opc('c', 'Falta de tipagem, de logs e de versionamento', false, 'o problema é a natureza da saída, não a infraestrutura.')] },
      { id: 'm06b1-anatomia', pergunta: 'Quais são as quatro partes de um eval?',
        opcoes: [
          opc('a', 'Dataset, sistema sob teste (com prompt e modelo declarados), grader e agregação com limiar', true, 'sem uma delas não é eval; sem limiar declarado vira relatório que ninguém age sobre.'),
          opc('b', 'Prompt, modelo, temperatura e custo', false, 'são configuração do sistema, não a anatomia da medição.'),
          opc('c', 'Teste unitário, teste de integração, A/B e juiz', false, 'misturam níveis e tipos de grader; não descrevem o eval.')] },
      { id: 'm06b1-wilson', pergunta: 'Duas versões têm 90% de acerto, uma em 50 casos e outra em 200. Qual leitura é correta?',
        opcoes: [
          opc('a', 'O Wilson de 95% é ≈ 78,6–95,7% contra 85,1–93,4%: o ponto estimado esconde a incerteza e a regra de decisão vem antes', true, 'quadruplicar n reduz o erro padrão pela metade, mas nenhum intervalo sozinho decide.'),
          opc('b', 'São equivalentes, porque a taxa é a mesma', false, 'o ponto estimado esconde a diferença de incerteza.'),
          opc('c', 'A de 200 casos atende ao limiar', false, 'depende do limiar, definido antes de olhar o resultado.')] },
      { id: 'm06b1-inconclusivo', pergunta: 'A versão A acerta 12/15 e a B acerta 13/15 nos mesmos casos. O que reportar?',
        opcoes: [
          opc('a', 'Inconclusivo, com o método e a próxima evidência declarados', true, 'um caso de diferença, intervalo largo e, no desenho pareado, faltam os resultados discordantes; nem promoção nem equivalência.'),
          opc('b', 'B é melhor: 87% contra 80%', false, 'a diferença observada é de um caso.'),
          opc('c', 'As duas são equivalentes', false, 'não rejeitar diferença não prova igualdade; equivalência exige margem prévia e evidência.')] },
      { id: 'm06b1-erro', pergunta: 'Qual é o primeiro passo ao avaliar um extrator que ninguém mediu?',
        opcoes: [
          opc('a', 'Análise de erro: ler cerca de 30 execuções reais, anotar o que errou e deixar os grupos virarem categorias e graders', true, 'métrica escolhida antes mede o que é fácil medir, não o que quebra o produto.'),
          opc('b', 'Escolher a métrica ideal e implementá-la', false, 'a métrica certa emerge da análise de erro.'),
          opc('c', 'Montar um teste A/B em produção', false, 'o A/B é o nível 3 da escada, depois de asserções e avaliação humana ou por modelo.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O instinto de quem testa software é escrever um teste que compara a saída esperada com a obtida. Aqui ele falha por três propriedades do sistema, e saber <em>quais</em> evita forçar a ferramenta errada.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Propriedade</th><th>O que quebra</th><th>O que substitui</th></tr></thead><tbody>' +
          '<tr><td><strong>Saída não é única</strong></td><td>"O método valida CPF" e "Este método faz validação de CPF" são igualmente corretos</td><td><code>assertEqual</code> em texto cede a graders semânticos, ou a testar <em>propriedades</em> da saída</td></tr>' +
          '<tr><td><strong>Não é determinístico</strong></td><td>Nem com <code>temperature=0</code> (M05, bloco 1)</td><td>A premissa de reprodutibilidade exata cede a medir <strong>taxa</strong> sobre um conjunto, não passa/falha por caso</td></tr>' +
          '<tr><td><strong>Mudança é global</strong></td><td>Alterar uma frase do prompt afeta todos os comportamentos, não só o que você mirou</td><td>O isolamento (base da pirâmide de testes) cede a uma suíte por categoria de comportamento, rodada inteira a cada mudança</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>O parente próximo</h3>' +
          '<p>Não é o teste unitário. É o <strong>teste de regressão de um modelo estatístico</strong> ou, mais familiar, o <strong>teste de performance</strong>: você não afirma "esta requisição levou exatamente 87 ms", mede uma distribuição e cobra um limiar. Eval aplica a ideia à qualidade. Um requisito típico: "alcançar a meta de acurácia definida sobre um conjunto rotulado e limitar a queda contra a baseline". O conjunto e a regra de decisão precisam de desenho e evidência próprios; o número de casos escolhido não os valida.</p>' +
          '<p>Os testes unitários continuam necessários: verificam invariantes determinísticas, schema, tratamento de erros e mecânica do runtime. Evals complementam esses testes para o comportamento variável; não os substituem.</p>' },
        { tipo: 'takeaway', html: 'Saída não única, não determinística e <mark>mudança global</mark>: meça <mark>taxa por categoria</mark>, e mantenha o teste unitário para as invariantes.' }
      ] },

      { rotulo: 'Anatomia e escada', blocos: [
        { tipo: 'texto', html:
          '<h3>As quatro partes de um eval</h3>' +
          '<p>Um eval tem exatamente quatro partes. Se falta uma, não é eval.</p>' +
          '<ul><li><strong>Dataset</strong>: lista de casos. Cada caso é <em>entrada</em> mais <em>expectativa</em>, que pode ser a resposta certa, uma propriedade a satisfazer ou o comportamento esperado ("deve recusar").</li>' +
          '<li><strong>Sistema sob teste</strong>: a sua função, com a versão de prompt e de modelo <em>declaradas</em>. Sem isso o resultado não é comparável.</li>' +
          '<li><strong>Grader</strong>: a função que decide se uma saída atende à expectativa (bloco 3 inteiro).</li>' +
          '<li><strong>Agregação e limiar</strong>: a métrica por categoria e a regra de aprovação. Sem limiar declarado, o eval vira relatório que ninguém age sobre.</li></ul>' +
          '<p>No exemplo condutor do módulo, o extrator do Capstone: um caso é "arquivo DTO trivial, expectativa <code>achados == []</code>"; o sistema é <code>analista@v3</code> via alias <code>raciocinio</code>; o grader do primeiro degrau pergunta "lista vazia?"; e a agregação é o acerto de <code>fora_escopo</code> contra um limiar definido <em>antes</em> de olhar o resultado.</p>' },
        { tipo: 'texto', html:
          '<h3>Os três níveis de avaliação</h3>' +
          '<p>A referência do campo (Hamel Husain) organiza o trabalho em três níveis, e a ordem importa: quase todo time começa pelo errado.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Nível</th><th>O que é</th><th>Custo</th><th>Quando roda</th></tr></thead><tbody>' +
          '<tr><td><strong>1. Asserções e testes de unidade</strong></td><td>Verificações baratas e determinísticas: schema válido, campo presente, formato de CNPJ, ausência de PII, tamanho máximo, "não contém desculpa"</td><td>~zero, milissegundos</td><td>A cada execução, em desenvolvimento e na CI</td></tr>' +
          '<tr><td><strong>2. Avaliação humana e por modelo</strong></td><td>Revisores humanos aplicam rubrica documentada; um juiz LLM pode ser comparado a referências humanas registradas em uma amostra de traces</td><td>Caro em tempo humano; moderado em tokens</td><td>Por iteração de prompt; e continuamente sobre amostra de produção</td></tr>' +
          '<tr><td><strong>3. Teste A/B</strong></td><td>Duas versões em produção, medindo comportamento real do usuário</td><td>Alto (tráfego, tempo, infra)</td><td>Quando a métrica offline não captura o valor (o usuário aceita mais a sugestão?)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Dois erros comuns: pular o nível 1 (a fonte atribui a ele cerca de 70% do retorno por 5% do esforço) e tentar o nível 3 sem os anteriores, quando você faz A/B de duas versões igualmente ruins e conclui que "não fez diferença". Para o Capstone, os níveis 1 e 2 bastam por muito tempo.</p>' +
          '<h3>Análise de erro vem antes de qualquer métrica</h3>' +
          '<p>O reflexo errado é procurar a métrica ideal. O certo é <strong>olhar as saídas erradas, uma a uma, e agrupá-las por tipo de falha</strong>: a <strong>análise de erro</strong>, a atividade de maior retorno do módulo. Pegue 30 execuções reais do extrator, leia todas e escreva ao lado de cada erro <em>o que exatamente aconteceu</em> ("inventou número de linha", "classificou risco alto onde era baixo", "listou o mesmo achado duas vezes"). Os grupos que emergirem são as suas categorias de eval e os seus graders. O percurso: salvar entrada, saída e versão de cada execução; julgar as saídas deixando os tipos de erro emergirem; escrever a expectativa em formato verificável (propriedade, proibição ou comportamento). O achado típico, segundo a fonte: 3 a 6 tipos recorrentes e uma taxa de acerto menor que a impressão. O roteiro executável (com sistema falso) está no Laboratório guiado do módulo, depois do bloco 6.</p>' },
        { tipo: 'ordene', id: 'b1-ordene', titulo: 'Ordene a escada de avaliação', obrigatorio: false,
          enunciado: 'Ponha o trabalho de avaliação de um extrator novo na ordem em que ele deve acontecer.',
          itens: [
            { id: 'ab', texto: 'Teste A/B em produção, quando a métrica offline não captura o valor' },
            { id: 'humano', texto: 'Avaliação humana e por modelo, com rubrica documentada' },
            { id: 'erro', texto: 'Análise de erro: ler 30 execuções reais e agrupar as falhas' },
            { id: 'asserc', texto: 'Asserções determinísticas: schema, campo presente, ausência de PII' }
          ], solucao: ['erro', 'asserc', 'humano', 'ab'],
          dica: 'Primeiro entender o que quebra; depois o mais barato; o mais caro por último.',
          tutorDepois: 'Análise de erro dá as categorias; o nível 1 as automatiza a custo ~zero; o nível 2 cobre o que regra não decide; o A/B só vale com os anteriores.' },
        { tipo: 'takeaway', html: 'Dataset, sistema declarado, grader e <mark>limiar</mark>: sem um deles não é eval. A ordem é <mark>análise de erro</mark>, asserções, humano ou modelo, A/B.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Estatística mínima para não se enganar sozinho</h3>' +
          '<p>Um eval observa resultados em um conjunto de casos. Para inferir sobre outros casos, esse conjunto precisa representar a população de interesse segundo um desenho declarado. Um corpus fixo escrito à mão descreve esse corpus: um intervalo binomial, sozinho, não mede cobertura, viés de seleção, mudança de distribuição nem variação entre execuções do modelo. Decisão, população, confiança e custo dos erros se definem <em>antes</em> de olhar o resultado.</p>' +
          '<p>Rode o código que calcula o que o bloco mostra: duas medições com a mesma taxa, e os 15 casos do checkpoint.</p>' },
        { tipo: 'rode', id: 'b1-rode', titulo: 'Mesmo 90%, incerteza diferente', enunciado: 'Saída real de um script em CPython. Rode e leia cada medição.',
          prefixo: '$', entrada: 'python wilson.py', unidade: 's', terminalTitulo: 'wilson.py', etapas: etapasWilson(),
          prever: { pergunta: 'Duas versões acertam 90%: 45 de 50 e 180 de 200. O que o intervalo de Wilson a 95% mostra?', opcoes: [
            { id: 'a', texto: 'O mesmo intervalo: a taxa é a mesma.', correta: false, porque: 'o intervalo depende de n, não só da taxa.' },
            { id: 'b', texto: 'Um intervalo bem mais estreito para n = 200.', correta: true, porque: 'o erro padrão cai de 4,24 para 2,12 pontos e o Wilson passa de 78,6–95,7% para 85,1–93,4%.' },
            { id: 'c', texto: 'Intervalo mais estreito para n = 50, porque terminou mais rápido.', correta: false, porque: 'velocidade não entra na conta; o tamanho da amostra entra.' }
          ] },
          tutorAntes: 'Aperte Enter e leia as quatro saídas, uma por etapa.',
          tutorDepois: 'Os dois intervalos de 90% não dizem a mesma coisa, e nenhum deles, sozinho, decide se a versão atende a um limiar.',
          callout: 'Você viu que o ponto estimado esconde a incerteza e que n pequeno deixa o intervalo largo.' },
        { tipo: 'abas', rotulo: 'Cinco ideias para não exagerar o que os dados dizem', itens: [
          { rotulo: 'Proporção e erro padrão', blocos: [{ tipo: 'texto', html:
            '<p>Para resultado binário, <code>p̂ = x/n</code> (acertos sobre casos avaliados). O erro padrão aproximado é <code>√(p̂(1−p̂)/n)</code>; ele descreve variação de amostragem sob as hipóteses do modelo binomial, não uma garantia de que diferenças menores sejam invisíveis. Em <code>p̂ = 0,90</code> dá cerca de 4,24 pontos com n = 50 e 2,12 com n = 200. Quadruplicar n reduz o erro pela metade, e isso, por si só, não escolhe tamanho suficiente.</p>' }] },
          { rotulo: 'Intervalo de Wilson', blocos: [{ tipo: 'texto', html:
            '<p>Um ponto estimado não mostra a própria incerteza. O intervalo de <strong>Wilson</strong> evita limitações do intervalo normal simples, sobretudo perto de 0 ou 1. A 95% (<code>z = 1,96</code>): centro <code>(p̂ + z²/(2n)) / (1 + z²/n)</code>, semi-amplitude <code>z·√(p̂(1−p̂)/n + z²/(4n²)) / (1 + z²/n)</code>. Com 45/50: ≈ 78,6%–95,7%. Com 180/200: ≈ 85,1%–93,4%. O segundo é mais estreito; nenhum dos dois, isoladamente, decide se uma versão atende a um limiar.</p>' }] },
          { rotulo: 'Média esconde a cauda', blocos: [{ tipo: 'texto', html:
            '<p>Acurácia global de 92% pode ser 99% no caminho feliz e 40% em prompt injection. Reporte sempre <strong>por categoria</strong>; é por isso que o bloco 2 existe. O mesmo vale para custo e latência: reporte <strong>p50 e p95</strong>, porque a média de custo é dominada pelos requests pequenos e a fatura é dominada pela cauda (M05, bloco 7).</p>' }] },
          { rotulo: 'Efeito, poder e inconclusivo', blocos: [{ tipo: 'texto', html:
            '<p>Antes de comparar versões, declare o <strong>efeito mínimo relevante</strong> (por exemplo, melhoria de 5 pontos), a taxa de base, o risco de falso positivo <code>α</code>, o poder desejado <code>1−β</code>, o desenho e o método. <strong>Poder</strong> é a chance de detectar um efeito especificado se ele existir, dadas essas escolhas. Não há regra universal de 50 ou 200 casos.</p>' +
            '<p>"Não rejeitar diferença" significa que os dados e o método não deram evidência suficiente; não prova igualdade. Equivalência exige margem prática <code>±δ</code> escolhida antes e evidência de que a diferença inteira cabe nela (por exemplo, teste TOST). Se o intervalo ainda permite tanto uma regressão relevante quanto uma melhoria relevante, reporte <strong>inconclusivo</strong> e planeje novos dados; não force promoção nem declare empate.</p>' }] },
          { rotulo: 'Conta de planejamento', blocos: [{ tipo: 'texto', html:
            '<p>Taxa de base <code>p₀ = 0,90</code>, melhoria mínima até <code>p₁ = 0,95</code> (<code>δ = 0,05</code>), <code>α = 0,05</code> bilateral, poder 0,80. Com <code>z₁₋α/₂ ≈ 1,96</code> e <code>z₁₋β ≈ 0,84</code>, a fórmula sem correção de continuidade dá <code>n′ ≈ ((1,96·√(0,90·0,10) + 0,84·√(0,95·0,05)) / 0,05)² ≈ 237,82</code>, ou seja, <strong>238 observações</strong>. O NIST/SEMATECH relata a correção de continuidade de Fleiss, Levin e Paik: <code>n = n′ + 1/δ</code>, que dá 258. É uma aproximação de planejamento para uma proporção, com observações independentes.</p>' }] },
          { rotulo: 'Comparação pareada', blocos: [{ tipo: 'texto', html:
            '<p>Quando A e B rodam sobre os <em>mesmos</em> casos, preserve o par. Em 50 casos: ambas acertam 43, só A acerta 2, só B acerta 4, ambas erram 1. A marca 45/50 (90%), B marca 47/50 (94%), diferença observada de +4 pontos. A informação está nos <strong>seis casos discordantes</strong> (2 contra 4), não em fingir 100 observações independentes. Para binário pareado, McNemar é um método possível; para métricas graduadas, um bootstrap pareado pode servir. Com aleatoriedade entre chamadas do modelo, repita execuções e respeite o agrupamento por caso.</p>' }] }
        ] },
        { tipo: 'callout', tom: 'info', titulo: 'Caso de borda do checkpoint', html:
          '<p>Os mesmos 15 casos dão 12/15 (80%) na versão A e 13/15 (86,7%) na B: a diferença observada é um caso, cerca de 6,7 pontos. O intervalo é largo e, no desenho pareado, faltam os resultados discordantes. Esse cenário não sustenta promoção nem equivalência por si só; a resposta correta pode ser <strong>inconclusivo</strong>, com método e próxima evidência declarados.</p>' },
        { tipo: 'takeaway', html: 'Um <mark>ponto estimado</mark> esconde a incerteza; declare <mark>efeito mínimo, limiar e método</mark> antes e aceite <mark>inconclusivo</mark> quando o intervalo permitir os dois lados.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<p>Hora de implementar o instrumento. Três funções: o intervalo, a decisão com três saídas e o tamanho de amostra de planejamento.</p>' },
        { tipo: 'python', id: 'b1-python', titulo: 'Intervalo, decisão e tamanho de amostra', obrigatorio: false,
          enunciado: 'Implemente <code>wilson(x, n)</code> (95%, <code>z = 1,96</code>, extremos limitados a 0 e 1), <code>decisao(lo, hi, limiar)</code> (<code>APROVA</code>, <code>REPROVA</code> ou <code>INCONCLUSIVO</code>) e <code>n_planejamento(p0, p1)</code> (arredondado para cima; com <code>corrigido=True</code> soma <code>1/δ</code>; efeito zero levanta <code>ValueError</code>).',
          codigo: PY_b01.codigo, testes: PY_b01.testes,
          dica: 'Com <code>d = 1 + z*z/n</code>: centro <code>(p + z*z/(2*n)) / d</code>, meia-largura <code>z*sqrt(p*(1-p)/n + z*z/(4*n*n)) / d</code>. Em <code>decisao</code>, o intervalo inteiro acima do limiar aprova e inteiro abaixo reprova; qualquer outro caso é inconclusivo. Em <code>n_planejamento</code>, <code>δ = abs(p1 - p0)</code>.',
          solucao: PY_b01.solucao,
          tutorDepois: 'Repare que a decisão tem três saídas. Com amostra pequena, INCONCLUSIVO é o resultado honesto, e a conta de 238 casos mostra por que a suíte de 15 casos por categoria quase nunca decide sozinha.',
          callout: 'O instrumento passou nos testes, com a borda e a recusa de efeito zero tratadas.' },
        { tipo: 'cenario', id: 'b1-cenario', titulo: '12 de 15 contra 13 de 15', obrigatorio: false,
          enunciado: 'A versão A acerta 12/15 e a B acerta 13/15 nos mesmos casos. Um colega quer promover a B. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A diferença observada é um caso, cerca de 6,7 pontos. Os intervalos de Wilson (≈ 54,8–93,0% e 62,1–96,3%) se sobrepõem quase por inteiro. O que você faz?', opcoes: [
              { texto: 'Promover a B: 87% é maior que 80%.', vai: 'f-promove', tom: 'ruim', consequencia: 'um caso de diferença é compatível com ruído; a promoção se apoia num número, não em evidência.' },
              { texto: 'Declarar as duas equivalentes: a diferença é pequena.', vai: 'f-equiv', tom: 'ruim', consequencia: 'não rejeitar diferença não prova igualdade; equivalência exige margem prévia e evidência.' },
              { texto: 'Reportar inconclusivo e declarar método e próxima evidência.', vai: 'plano', tom: 'ok', consequencia: 'a decisão espera uma medida que consiga discriminar.' }
            ] },
            plano: { texto: 'Qual é a próxima evidência a planejar?', opcoes: [
              { texto: 'Preservar o par por caso, registrar os discordantes (McNemar é um método possível), declarar o efeito mínimo e o tamanho antes e ampliar o conjunto ou repetir execuções.', vai: 'f-bom', tom: 'ok', consequencia: 'o planejamento nasce do efeito que importa, não do número de casos que já existia.' },
              { texto: 'Tratar cada execução como observação independente e dobrar o n sem olhar o pareamento.', vai: 'f-indep', tom: 'ruim', consequencia: 'repetições do mesmo caso são correlacionadas: o intervalo sai otimista.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Resultado inconclusivo declarado, com efeito mínimo, método pareado e tamanho definidos antes da próxima rodada.' },
            'f-promove': { bom: false, texto: 'A B entrou em produção por ruído; a próxima rodada pode inverter o resultado.' },
            'f-equiv': { bom: false, texto: 'O empate foi declarado sem margem nem teste; o relatório afirma o que os dados não mostram.' },
            'f-indep': { bom: false, texto: 'O intervalo ficou artificialmente estreito e a decisão parece mais segura do que é.' }
          },
          callout: 'Você tratou o caso como inconclusivo e planejou a próxima evidência com método declarado.' },
        { tipo: 'escolha', id: 'b1-escolha-assert', titulo: 'Confira: a ferramenta errada',
          pergunta: 'Por que <code>assertEqual(saida, esperado)</code> sobre o texto de um LLM é a ferramenta errada?',
          opcoes: [
            { id: 'a', texto: 'Porque LLM não aceita testes.', correta: false, porque: 'testes unitários continuam necessários para invariantes, schema e erros.' },
            { id: 'b', texto: 'Porque a saída não é única, não é determinística nem com <code>temperature=0</code> e uma mudança de prompt afeta todos os comportamentos; mede-se taxa sobre um conjunto, por categoria.', correta: true, porque: 'são as três propriedades do bloco. Evals complementam os testes unitários; não os substituem.' },
            { id: 'c', texto: 'Porque <code>assertEqual</code> é lento.', correta: false, porque: 'velocidade não é o problema.' },
            { id: 'd', texto: 'Porque o teste unitário foi substituído por evals.', correta: false, porque: 'o teste unitário segue verificando invariantes determinísticas.' }
          ], tutorDepois: 'Saída não única, não determinística, mudança global.' },
        { tipo: 'escolha', id: 'b1-escolha-primeiro', titulo: 'Confira: por onde começar',
          pergunta: 'Ninguém mediu o desempenho do extrator. Qual deve ser o primeiro passo?',
          opcoes: [
            { id: 'a', texto: 'Escolher a métrica ideal (F1) e implementá-la.', correta: false, porque: 'métrica escolhida antes da análise de erro mede o que é fácil medir.' },
            { id: 'b', texto: 'Análise de erro: ler 30 execuções reais, anotar o que errou e deixar os grupos de falha virarem categorias e graders.', correta: true, porque: 'é a atividade de maior retorno do módulo; a escada segue em asserções, humano ou modelo, A/B.' },
            { id: 'c', texto: 'Montar um teste A/B em produção.', correta: false, porque: 'A/B sem os níveis anteriores compara duas versões igualmente ruins.' },
            { id: 'd', texto: 'Pedir a um juiz LLM uma nota de 1 a 5.', correta: false, porque: 'nota de 1 a 5 não é reprodutível e o juiz precisa ser validado antes.' }
          ], tutorDepois: 'Primeiro olhe as saídas erradas.' },
        { tipo: 'takeaway', html: 'Um eval decide com <mark>intervalo, limiar prévio e método</mark>; o <mark>inconclusivo</mark> também é um resultado.' }
      ] }
    ]
  });
})();
