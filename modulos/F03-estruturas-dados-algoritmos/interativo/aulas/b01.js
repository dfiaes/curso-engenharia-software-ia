/* F03 · Bloco 1: Complexidade. Fonte: F03.html#b01. Medições: execução real do laboratório em 11/10/2026 (Linux aarch64, CPython 3.14.7), valores absolutos variam; a razão é o conteúdo. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'def simular_appends(n, fator=2):',
    '    """n appends numa lista de capacidade inicial 1.',
    '    Devolve (copias_total, pico): elementos copiados no total e na pior chamada."""',
    '    cap, tam, copias, pico = 1, 0, 0, 0',
    '    for _ in range(n):',
    '        custo = 0',
    '        if tam == cap:',
    '            # LACUNA: a lista encheu. Realocar custa copiar os tam elementos',
    '            # atuais e multiplica a capacidade por fator.',
    '            pass',
    '        copias += custo',
    '        pico = max(pico, custo)',
    '        tam += 1',
    '    return copias, pico',
    '',
    '',
    'def classificar_razao(r):',
    '    """r = tempo(2n) / tempo(n). Devolve a hipótese de classe."""',
    '    return "O(n)"',
    ''].join('\n');
  var testes = [
    'def test_oito_appends():',
    '    assert simular_appends(8) == (7, 4)',
    '',
    '',
    'def test_total_menor_que_2n_mas_pico_linear():',
    '    c, p = simular_appends(1025)',
    '    assert c < 2 * 1025 and p == 1024',
    '',
    '',
    'def test_dobrar_n_dobra_o_total():',
    '    a, _ = simular_appends(10_000)',
    '    b, _ = simular_appends(20_000)',
    '    assert 1.5 < b / a < 2.5',
    '',
    '',
    'def test_fator_maior_copia_menos():',
    '    assert simular_appends(10_000, 4)[0] < simular_appends(10_000, 2)[0]',
    '',
    '',
    'def test_razoes():',
    '    assert classificar_razao(1.0) == "O(1) ou O(log n)"',
    '    assert classificar_razao(2.1) == "O(n) ou O(n log n)"',
    '    assert classificar_razao(4.1) == "O(n^2)"',
    '    assert classificar_razao(8.3) == "O(n^3) ou pior"',
    ''].join('\n');
  var solucao = [
    'def simular_appends(n, fator=2):',
    '    cap, tam, copias, pico = 1, 0, 0, 0',
    '    for _ in range(n):',
    '        custo = 0',
    '        if tam == cap:',
    '            custo = tam',
    '            cap *= fator',
    '        copias += custo',
    '        pico = max(pico, custo)',
    '        tam += 1',
    '    return copias, pico',
    '',
    '',
    'def classificar_razao(r):',
    '    if r < 1.5:',
    '        return "O(1) ou O(log n)"',
    '    if r < 2.6:',
    '        return "O(n) ou O(n log n)"',
    '    if r < 5:',
    '        return "O(n^2)"',
    '    return "O(n^3) ou pior"',
    ''].join('\n');

  TrilhaAula.registrar({
    id: 'f03-b1',
    titulo: 'Complexidade: o vocabulário de custo',
    minutos: 35,
    resumo: 'Quando alguém diz "isso é quadrático", afirma que dobrar a entrada quadruplica o tempo. Você aprende a notação, os três tipos de caso, o custo amortizado e a medir a razão entre tamanhos.',
    objetivo: 'Estimar o custo de um trecho, distinguir pior caso, caso médio e amortizado, e confirmar a hipótese com medição honesta (vários n, mínimo de repetições).',
    revisao: [
      { id: 'f03b1-notacao', pergunta: 'O que distingue O/Ω/Θ de "pior/melhor/médio caso"?',
        opcoes: [
          opc('a', 'O, Ω e Θ são tipos de limite de uma função; pior, melhor e médio dizem qual entrada se analisa', true, 'dá para dizer "o pior caso do quicksort é Θ(n²)" e "o caso médio é Θ(n log n)": são dois eixos.'),
          opc('b', 'São sinônimos: O é pior caso, Ω é melhor caso, Θ é caso médio', false, 'é o erro de vocabulário mais comum; O, Ω e Θ não são casos.'),
          opc('c', 'Θ só vale para algoritmos recursivos', false, 'Θ é o limite superior e inferior ao mesmo tempo, para qualquer função de custo.')] },
      { id: 'f03b1-amort', pergunta: '<code>list.append</code> é O(1) amortizado. O que isso garante?',
        opcoes: [
          opc('a', 'n appends custam O(n) no total, ainda que uma chamada isolada (a que realoca) custe O(n)', true, 'é uma garantia sobre a soma de uma sequência no pior caso, sem probabilidade.'),
          opc('b', 'Toda chamada leva tempo constante', false, 'a chamada que redimensiona é O(n); isso pesa no p99.'),
          opc('c', 'O append nunca copia elementos', false, 'copia na realocação.')] },
      { id: 'f03b1-razao', pergunta: 'Ao dobrar n, o tempo medido foi de 2 s para 8 s. Qual a hipótese?',
        opcoes: [
          opc('a', 'Quadrático: dobrar n multiplicou o tempo por 4', true, '×2 sugere O(n) ou O(n log n); ×4, O(n²); ×8, O(n³).'),
          opc('b', 'Linear', false, 'linear daria ≈4 s.'),
          opc('c', 'Constante com ruído', false, 'constante não cresce com n.')] },
      { id: 'f03b1-cache', pergunta: 'Por que o mesmo número de leituras custa até cerca de 10x mais em ordem embaralhada?',
        opcoes: [
          opc('a', 'Localidade: a CPU lê linhas de cache e prefetcha sequências previsíveis; saltos aleatórios vão à memória principal', true, 'medido: 3,03x em 250 mil elementos, 9,77x em 4 milhões.'),
          opc('b', 'Porque embaralhar muda a ordem de crescimento para O(n²)', false, 'a ordem de crescimento é a mesma; a constante muda.'),
          opc('c', 'Porque o Python recompila o laço', false, 'o efeito é de hardware.')] },
      { id: 'f03b1-timeit', pergunta: 'Qual das regras de medição com <code>timeit</code> está correta?',
        opcoes: [
          opc('a', 'Reinicializar o estado a cada repetição, reportar o mínimo e variar n', true, 'o ruído só soma tempo; a razão entre tamanhos revela a ordem.'),
          opc('b', 'Rodar uma vez e reportar a média', false, 'uma execução não distingue classes.'),
          opc('c', 'Medir sempre com n pequeno para reduzir o ruído', false, 'com n pequeno a constante domina e a curva some.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Complexidade é a linguagem em que se discute desempenho antes de existir perfil. Quando um revisor diz "isso é <strong>quadrático</strong>", ele afirma que o custo cresce com o quadrado do tamanho da entrada: dobrar a entrada quadruplica o tempo. Num pipeline de RAG que compara cada trecho novo com todos os já indexados, ou num agente que reavalia todo o histórico a cada passo, essa frase separa "funciona no demo" de "funciona com 10 milhões de documentos". O custo de ignorá-la aparece como conta de nuvem, não como erro.</p>' +
          '<h3>O que a notação diz</h3>' +
          '<p>Seja <code>T(n)</code> o número de operações elementares para entrada de tamanho n. As três notações são afirmações sobre <em>limites</em> de uma função:</p>' +
          '<ul><li><strong>O(f)</strong>: limite superior assintótico. <code>T(n) ≤ c·f(n)</code> para algum c &gt; 0 e todo n ≥ n₀.</li>' +
          '<li><strong>Ω(f)</strong>: limite inferior. <code>T(n) ≥ c·f(n)</code> a partir de algum n₀.</li>' +
          '<li><strong>Θ(f)</strong>: os dois ao mesmo tempo; a ordem de crescimento exata.</li></ul>' +
          '<p>O erro de vocabulário mais comum é misturar essas notações com os casos. "Pior caso", "melhor caso" e "caso médio" descrevem <em>qual entrada</em> você analisa; O, Ω e Θ descrevem <em>que tipo de limite</em> você afirma sobre aquela análise. Dá para dizer "o pior caso do quicksort é Θ(n²)" e "o caso médio é Θ(n log n)". Dizer só "o quicksort é O(n log n)" fala do caso médio e omite o pior, e é por isso que a escolha do pivô aparece como defeito de segurança em entradas adversariais.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Ordem</th><th>Nome</th><th>Exemplo em Python</th><th>n dobra: tempo multiplica por</th></tr></thead><tbody>' +
          '<tr><td>O(1)</td><td>constante</td><td><code>d[k]</code>, <code>lista[i]</code>, <code>pilha.append(x)</code> (amortizado)</td><td>1</td></tr>' +
          '<tr><td>O(log n)</td><td>logarítmica</td><td><code>bisect_left</code>, operações de heap</td><td>soma de uma constante</td></tr>' +
          '<tr><td>O(n)</td><td>linear</td><td><code>x in lista</code>, <code>sum(lista)</code></td><td>2</td></tr>' +
          '<tr><td>O(n log n)</td><td>quase linear</td><td><code>sorted(lista)</code></td><td>pouco mais de 2</td></tr>' +
          '<tr><td>O(n²)</td><td>quadrática</td><td>laços aninhados, <code>pop(0)</code> repetido, concatenar string em laço (ingênuo)</td><td>4</td></tr>' +
          '<tr><td>O(2ⁿ), O(n!)</td><td>exponencial, fatorial</td><td>subconjuntos, permutações, backtracking sem poda</td><td>inviável a partir de n ≈ 25–30</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'O, Ω e Θ são <mark>limites</mark> de uma função; pior, médio e amortizado dizem <mark>qual entrada</mark> você analisa.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Três perguntas que se confundem</h3>' +
          '<ul><li><strong>Pior caso</strong>: a entrada mais cruel de tamanho n. É a garantia. Importa quando a entrada é controlada por terceiros (um serviço exposto) ou há SLA de latência.</li>' +
          '<li><strong>Caso médio / esperado</strong>: a média sobre uma distribuição de entradas <em>ou</em> sobre as escolhas aleatórias do próprio algoritmo. O quicksort com pivô aleatório é O(n log n) <em>esperado</em> para qualquer entrada, porque a aleatoriedade está no algoritmo, não nos dados.</li>' +
          '<li><strong>Amortizado</strong>: o custo médio por operação numa <em>sequência</em>, no pior caso da sequência. Não há probabilidade. <code>list.append</code> é O(1) amortizado: algumas chamadas custam O(n) (realocação), mas n chamadas custam O(n) no total.</li></ul>' +
          '<p>Argumento do array dinâmico: se a capacidade dobra ao encher, as cópias custam 1 + 2 + 4 + … + n/2 &lt; n; somadas às n escritas, o total é &lt; 3n, menos de 3 operações por inserção. No CPython a lista cresce cerca de 12,5% mais uma constante (<code>list_resize</code>) e o argumento vale para qualquer fator &gt; 1; só muda a constante. O <em>pico</em> de uma única chamada continua O(n).</p>' },
        { tipo: 'rode', id: 'b1-medir', titulo: 'Rode o bench e leia as razões', prefixo: '$', entrada: 'uv run python -m algos.bench', unidade: 'x', terminalTitulo: 'medido nesta máquina',
          enunciado: 'Três trechos da saída do <code>bench</code> do laboratório. O conteúdo é a razão entre linhas, não o valor absoluto.',
          prever: { pergunta: 'Na busca de uma chave perto do fim, <code>x in lista</code> custa 4,2 µs com n = 10³. Com n = 10⁶, o que esperar?', opcoes: [
            { id: 'a', texto: 'Cerca de 4,2 µs: busca é O(1)', correta: false, porque: 'x in lista varre a lista inteira.' },
            { id: 'b', texto: 'Cerca de 4.500 µs: cresce 10x a cada 10x de n (linear)', correta: true, porque: 'medido: 4,2 → 45 → 465 → 4.545 µs para n = 10³…10⁶.' },
            { id: 'c', texto: 'Cerca de 4,2 milhões de µs: quadrático', correta: false, porque: 'dobrar n dobra o tempo; não quadruplica.' }
          ] },
          etapas: [
            { id: 'busca', nome: 'Busca de chave perto do fim', descricao: 'µs por busca, n = 10³ a 10⁶', tom: 'request', ms: 10, linhas: [
              L('out', 'x in lista     4,2 → 45 → 465 → 4.545 µs   (10x por 10x de n: linear)'),
              L('out', 'bisect_left    0,05 → 0,09 µs              (quase constante: logarítmico)'),
              L('out', 'x in set       0,01 µs                     (constante)'),
              L('hint', 'mesmo problema, quatro ordens de grandeza de diferença em n = 10⁶')] },
            { id: 'cache', nome: 'Localidade de memória', descricao: 'sequencial × embaralhado', tom: 'response', ms: 9.77, linhas: [
              L('out', 'n=250.000    sequencial  3,92 ms   embaralhada  11,90 ms   3,03x'),
              L('out', 'n=1.000.000  sequencial 16,73 ms   embaralhada 155,54 ms   9,30x'),
              L('out', 'n=4.000.000  sequencial 68,06 ms   embaralhada 664,86 ms   9,77x'),
              L('hint', 'mesma aritmética e mesmo número de leituras; só a ordem muda')] },
            { id: 'cresc', nome: 'Pontos de realocação da lista', descricao: 'sys.getsizeof a cada realocação', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'uv run python -m algos.bench --growth | head -8'),
              L('out', 'len  bytes   (0: 56)  (1: 88)  (5: 120)  (9: 184)  (17: 248)  (25: 312)  (33: 376)'),
              L('hint', 'lista vazia = 56 bytes; a primeira realocação reserva 4 ponteiros de 8 bytes (88 = 56 + 32)')] }
          ],
          tutorDepois: 'Os saltos de realocação mudam entre versões do CPython; o padrão "poucas realocações, espaçadas por fator" não.',
          callout: 'Você leu a ordem de crescimento pela razão entre tamanhos, não pelo valor absoluto.' },
        { tipo: 'texto', html:
          '<h3>Espaço e constantes</h3>' +
          '<p>Complexidade de espaço conta memória <em>auxiliar</em> além da entrada. Três armadilhas: (a) a <strong>pilha de chamadas</strong> é memória: recursão de profundidade n é O(n) de espaço sem alocar nada explícito; (b) <strong>fatiar cria cópia</strong> (<code>a[:mid]</code> custa O(mid) em tempo e espaço); (c) em Python o "elemento" é um ponteiro de 8 bytes para um objeto com cabeçalho próprio, então uma lista de um milhão de <code>int</code> fora do intervalo interned (−5 a 256) ocupa muito mais que 8 MB. Para dados numéricos densos, <code>array.array</code> ou NumPy mudam a constante em uma ordem de grandeza (mais no M11).</p>' +
          '<p>A notação joga fora constantes porque elas não afetam a <em>forma</em> da curva, mas você paga por elas. Duas fontes dominam: <strong>quem executa</strong> (trabalho em C, como <code>sorted</code>, <code>bisect</code> e <code>in</code> sobre <code>set</code>, roda dezenas de vezes mais rápido que o mesmo trabalho em bytecode; um merge sort em Python é O(n log n) e ainda de 14 a 18 vezes mais lento que <code>sorted</code>) e a <strong>localidade de memória</strong> (CPUs leem linhas de cache de cerca de 64 bytes e prefetcham sequências previsíveis). Consequência: estruturas contíguas (array, <code>list</code>, <code>array.array</code>) vencem estruturas com ponteiros por uma constante grande, mesmo quando a assintótica empata; é um dos motivos de o heap usar um array e de bancos usarem árvores de nós largos (bloco 4).</p>' },
        { tipo: 'takeaway', html: 'A ordem de crescimento aparece na <mark>razão entre tamanhos</mark>; a constante vem de <mark>quem executa</mark> e da <mark>localidade</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Medir com <code>timeit</code>: o mínimo de rigor</h3>' +
          '<p>Perfil responde "onde está o tempo"; micro-medição responde "qual alternativa é mais rápida aqui". Três regras: (1) <strong>reinicialize o estado</strong> a cada repetição, senão você mede a segunda execução sobre dados já alterados; (2) <strong>reporte o mínimo</strong> de várias repetições, não a média, porque o ruído só soma tempo (<code>timeit.repeat</code> e <code>min</code>); (3) <strong>varie n</strong> e olhe a razão entre tamanhos consecutivos.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'import timeit',
          '',
          'def custo(stmt, setup, n_exec=200, repeticoes=5):',
          '    """melhor tempo por execução, em microssegundos"""',
          '    melhor = min(timeit.repeat(stmt, setup, number=n_exec, repeat=repeticoes))',
          '    return melhor / n_exec * 1e6',
          '',
          'for n in (1_000, 10_000, 100_000):',
          '    setup = f"a = list(range({n})); alvo = {n - 1}"',
          '    print(n, f"{custo(\'alvo in a\', setup):.1f} us")   # dobrar n ≈ dobrar o tempo → O(n)'].join('\n') },
        { tipo: 'python', id: 'b1-python', titulo: 'Simule o array dinâmico e classifique a razão', obrigatorio: false,
          enunciado: 'Medir tempo é ruidoso; contar cópias é exato. Complete <code>simular_appends</code> (a realocação copia <code>tam</code> elementos e multiplica a capacidade por <code>fator</code>) e <code>classificar_razao</code> (hipótese de classe a partir de <code>tempo(2n)/tempo(n)</code>).',
          codigo: codigo, testes: testes,
          dica: 'Na realocação: <code>custo = tam</code> e <code>cap *= fator</code>. Para a razão, use os cortes 1,5, 2,6 e 5.',
          solucao: solucao,
          tutorDepois: 'O total fica abaixo de 2n (amortizado), mas o pico é linear: é isso que pesa no p99.',
          callout: 'A simulação mostrou o O(1) amortizado e o pico O(n) lado a lado.' },
        { tipo: 'escolha', id: 'b1-esc-amort', titulo: 'O que a garantia amortizada cobre',
          pergunta: 'Um serviço tem p99 de 5 ms e usa uma estrutura com inserção "O(1) amortizada". Qual o risco?',
          opcoes: [
            { id: 'a', texto: 'Nenhum: amortizado significa que toda chamada é rápida.', correta: false, porque: 'a garantia é sobre a soma da sequência, não sobre cada chamada.' },
            { id: 'b', texto: 'Uma chamada rara custa O(n) (por exemplo, a reconstrução com 50 milhões de entradas) e congela aquela requisição.', correta: true, porque: 'remédios: pré-dimensionar, reconstruir de forma incremental (como o rehash gradual do Redis) ou usar estrutura de pior caso limitado.' },
            { id: 'c', texto: 'A estrutura usa mais memória que a média.', correta: false, porque: 'o problema aqui é latência de cauda, não memória.' }
          ], tutorDepois: 'Amortizado protege a vazão total, não a cauda de latência.' },
        { tipo: 'takeaway', html: '<mark>Conte operações</mark> quando puder e <mark>meça</mark> com mínimo de repetições e vários n quando precisar.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'cenario', id: 'b1-cenario', titulo: 'Revisão de uma função gerada por IA', obrigatorio: false,
          enunciado: 'Um agente gerou uma função que remove documentos repetidos com <code>for d in docs: if d not in vistos_lista: vistos_lista.append(d)</code>, com testes de 10 itens. Em produção são 200 mil documentos.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Os testes passam. Qual é o seu primeiro movimento de revisor?', opcoes: [
              { texto: 'Aprovar: está correta e os testes estão verdes.', vai: 'f-aprova', tom: 'ruim', consequencia: 'o <code>in</code> sobre lista é O(n) escondido dentro de um laço: o total é O(n²).' },
              { texto: 'Declarar o custo (≈ 2·10¹⁰ comparações para n = 200 mil) e procurar o operador de custo linear dentro do laço.', vai: 'medir', tom: 'ok', consequencia: 'é o O(n²) que ninguém declarou.' },
              { texto: 'Trocar a lista por um array NumPy.', vai: 'f-numpy', tom: 'ruim', consequencia: 'muda a constante, não a ordem de crescimento.' }
            ] },
            medir: { texto: 'Você propõe um <code>set</code> de vistos. Como confirma que melhorou?', opcoes: [
              { texto: 'Cronometrar uma vez com n = 200 mil e comparar.', vai: 'f-ruido', tom: 'ruim', consequencia: 'uma única execução não distingue classes e o ruído confunde.' },
              { texto: 'Medir n, 2n e 4n com repetições e mínimo, e ver a razão cair de ≈4 para ≈2.', vai: 'f-bom', tom: 'ok', consequencia: 'a razão entre tamanhos confirma a ordem de crescimento.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Custo declarado, causa localizada e melhoria confirmada pela razão entre tamanhos.' },
            'f-aprova': { bom: false, texto: 'A função foi para produção e derreteu com dados reais; o teste de 10 itens nunca poderia mostrar isso.' },
            'f-numpy': { bom: false, texto: 'A constante caiu um pouco e a conta de nuvem continuou crescendo ao quadrado.' },
            'f-ruido': { bom: false, texto: 'A medição única levou a uma conclusão sem base: não houve como saber se a ordem mudou.' }
          },
          callout: 'Você declarou o custo antes de aprovar e confirmou pela razão.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: complexidade da operação não é complexidade do uso', html:
          '<p><code>s += "x"</code> é "O(1)" por linha, mas dentro de um laço pode copiar a string toda a cada passo (o CPython às vezes otimiza <code>+=</code> de string com contagem de referência 1, o que depende de implementação; <code>"".join(partes)</code> é a forma garantida). Também são O(n) escondidos numa linha curta: <code>lista.insert(0, x)</code>, <code>x in lista</code>, <code>lista.index(x)</code>, <code>a + b</code> (concatenação de listas) e fatias. Na revisão, procure o <strong>operador de custo linear dentro de um laço</strong>.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Declarar "O(n log n)" sem dizer em quê: n são elementos, bytes, linhas, arestas? Num grafo, o custo é função de V e E.</li>' +
          '<li>Otimizar a ordem de crescimento de algo que roda 10 vezes: importa onde n é grande <em>e</em> o trecho é quente.</li>' +
          '<li>Comparar tempos de uma única execução, ou com o coletor de lixo ligado só de um lado.</li>' +
          '<li>Tratar o hash de strings longas como O(1) (na primeira vez é O(comprimento)).</li></ul>' },
        { tipo: 'escolha', id: 'b1-esc-razao', titulo: 'Confira: a razão entre tamanhos',
          pergunta: 'Você mediu 1,0 s com n = 50 mil e 4,1 s com n = 100 mil, usando o mínimo de cinco repetições. Qual a hipótese mais razoável e o próximo passo?',
          opcoes: [
            { id: 'a', texto: 'Linear; está bom.', correta: false, porque: 'linear daria perto de 2 s.' },
            { id: 'b', texto: 'Quadrático; medir um terceiro tamanho (200 mil) e procurar o operador linear dentro de um laço.', correta: true, porque: 'a razão ≈4 aponta para O(n²), e pelo menos três tamanhos confirmam a tendência.' },
            { id: 'c', texto: 'Logarítmico, porque o tempo não dobrou exatamente.', correta: false, porque: 'logarítmico mal mudaria o tempo ao dobrar n.' },
            { id: 'd', texto: 'Inconclusivo até ligar o perfil.', correta: false, porque: 'o perfil diz onde está o tempo; a razão já informa a classe.' }
          ], tutorDepois: 'Razão ≈2: linear ou n log n. Razão ≈4: quadrático. Razão ≈8: cúbico.' },
        { tipo: 'escolha', id: 'b1-esc-ordem', titulo: 'Confira: quando a ordem não decide',
          pergunta: 'Um algoritmo O(n log n) pode perder para um O(n²) em dados reais? Qual motivo, além de "n pequeno"?',
          opcoes: [
            { id: 'a', texto: 'Não: a ordem de crescimento sempre decide.', correta: false, porque: 'a notação esconde a constante e o padrão de acesso à memória.' },
            { id: 'b', texto: 'Sim: a constante e a localidade de memória (por exemplo, trabalho em C contra bytecode, ou acesso sequencial contra saltos).', correta: true, porque: 'o merge sort em Python é 14–18x mais lento que <code>sorted</code>, e o acesso embaralhado chegou a ~10x o sequencial.' },
            { id: 'c', texto: 'Só se o algoritmo O(n²) for recursivo.', correta: false, porque: 'recursão não tem relação com a constante aqui.' }
          ], tutorDepois: 'Meça quando as ordens empatam ou n é moderado.' },
        { tipo: 'texto', html: '<p class="ta-nota">Medições do laboratório (<code>python -m algos.bench</code>), uma execução em 11/10/2026: Linux aarch64, 4 núcleos, CPython 3.14.7. Os valores absolutos mudam na sua máquina; as razões não. Revalidar em até 90 dias ou ao trocar a versão do interpretador.</p>' },
        { tipo: 'takeaway', html: 'Procure o <mark>operador linear dentro de um laço</mark>, declare o custo e confirme pela <mark>razão</mark>.' }
      ] }
    ]
  });
})();
