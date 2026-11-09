/* LT04 · Bloco 4: Observabilidade de release. Fonte: LT04.html#b04. Saídas executadas com lab/sinais_release.py; números são exemplo variável, não evidência. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var CMD = 'python3 -c "from sinais_release import *; print(resumo([10.0]*95 + [900.0]*5))"';

  var codigoSinal = [
    'import math', '', '',
    'def percentil(amostras, p):',
    '    """Nearest-rank sobre amostras brutas; sem amostra ou p fora de (0, 100], ValueError."""',
    '    # 1. recuse vazio e p invalido  2. ordene  3. posto = teto(n * p / 100), no maximo n',
    '    ordenadas = sorted(amostras)', '    return ordenadas[0]', '', '',
    'def taxa_erro(falhas, total):',
    '    """Fracao de falhas; total zero e dado ausente, nao zero por cento."""',
    '    return 0.0', '', '',
    'def slices_piores(p99_por_slice, teto):',
    '    """Slices com p99 acima do teto, em ordem alfabetica."""',
    '    return []', '',
    'print(percentil([10.0] * 95 + [900.0] * 5, 99))', ''].join('\n');

  var testesSinal = [
    'def _recusa(f, *args):', '    try:', '        f(*args)', '    except ValueError:', '        return True', '    return False', '', '',
    'def test_cauda_aparece_no_p99():', '    a = [10.0] * 95 + [900.0] * 5',
    '    assert percentil(a, 50) == 10.0 and percentil(a, 95) == 10.0 and percentil(a, 99) == 900.0', '', '',
    'def test_nearest_rank_em_amostra_pequena():', '    assert percentil([3.0, 1.0, 2.0], 50) == 2.0', '    assert percentil([5.0], 99) == 5.0',
    '    assert percentil([1.0, 2.0, 3.0, 4.0], 100) == 4.0', '', '',
    'def test_vazio_e_p_invalido_sao_erro():', '    assert _recusa(percentil, [], 99)', '    assert _recusa(percentil, [1.0], 0)', '    assert _recusa(percentil, [1.0], 120)', '', '',
    'def test_total_zero_nao_e_zero_por_cento():', '    assert taxa_erro(1, 4) == 0.25', '    assert taxa_erro(0, 10) == 0.0', '    assert _recusa(taxa_erro, 0, 0)', '', '',
    'def test_slice_vermelho_nao_e_absolvido():', '    assert slices_piores({"busca": 900.0, "login": 100.0, "vazio": 1200.0}, 800.0) == ["busca", "vazio"]', '', '',
    'def test_controle_negativo_todos_abaixo_do_teto():', '    assert slices_piores({"busca": 300.0, "login": 100.0}, 800.0) == []', '    assert slices_piores({}, 800.0) == []', ''].join('\n');

  var solucaoSinal = [
    'import math', '', '',
    'def percentil(amostras, p):',
    '    if not amostras:', '        raise ValueError("sem amostras: percentil de vazio nao existe")',
    '    if not 0.0 < p <= 100.0:', '        raise ValueError(f"percentil invalido: {p}")',
    '    ordenadas = sorted(amostras)', '    posto = min(len(ordenadas), math.ceil(len(ordenadas) * p / 100.0))',
    '    return ordenadas[posto - 1]', '', '',
    'def taxa_erro(falhas, total):', '    if total <= 0:', '        raise ValueError("total precisa ser positivo")', '    return falhas / total', '', '',
    'def slices_piores(p99_por_slice, teto):', '    return sorted(s for s, p99 in p99_por_slice.items() if p99 > teto)', ''].join('\n');

  TrilhaAula.registrar({
    id: 'lt04-b4',
    titulo: 'Observabilidade de release: cauda, ausência e slices',
    minutos: 30,
    resumo: 'Média verde esconde 5% de usuários quebrados. Percentil sobre amostra bruta, erro explícito para dado ausente e leitura por slice fazem o sinal do release valer como evidência.',
    objetivo: 'Calcular p50/p95/p99 por nearest-rank sobre amostras brutas, recusar sinal sem dado em vez de inventar zero e apontar o slice vermelho que o agregado verde esconde.',
    revisao: [
      { id: 'lt04b4-media', pergunta: 'Em 100 requisições, 95 levaram 10 ms e 5 levaram 900 ms. Qual leitura é correta?',
        opcoes: [
          opc('a', 'Média de 54,5 ms esconde 5% quebrado; p99 = 900 ms revela a cauda', true, 'média sem cauda não é evidência: publique média e p50/p95/p99 do mesmo raw, com n.'),
          opc('b', 'O release é "quase 50 ms", logo está saudável', false, 'a média mistura 95% rápido com 5% quebrado e não descreve ninguém.'),
          opc('c', 'p99 = 10 ms, porque 95% estão rápidos', false, 'nearest-rank toma a posição ⌈p% de n⌉: o p99 cai na posição 99, que já está na cauda.')] },
      { id: 'lt04b4-vazio', pergunta: 'O coletor não entregou amostras do intervalo. O que o sinal deve fazer?',
        opcoes: [
          opc('a', 'Levantar erro explícito e registrar a lacuna nomeada', true, 'percentil de vazio e taxa de erro com total zero são erro, nunca 0,0: zero inventado desarma o stop do Bloco 3.'),
          opc('b', 'Publicar 0 ms', false, 'o gate leria "tudo bem" onde deveria ler "sem leitura".'),
          opc('c', 'Repetir o último valor', false, 'também inventa um dado que não foi medido neste intervalo.')] },
      { id: 'lt04b4-slice', pergunta: 'O p99 global é 300 ms (teto 800 ms), mas o slice checkout, com 2% do tráfego, está em 1.200 ms. Qual é a leitura?',
        opcoes: [
          opc('a', 'O oráculo acusa checkout: agregado verde não absolve segmento vermelho', true, 'a regressão que só existe num slice some na média global; peso de tráfego não é desculpa.'),
          opc('b', 'Aprovado, porque 98% do tráfego está saudável', false, 'checkout costuma ser o segmento que paga a conta.'),
          opc('c', 'Reprovar todos os slices', false, 'o oráculo lista exatamente os slices acima do teto; os demais continuam saudáveis.')] },
      { id: 'lt04b4-metodo', pergunta: 'Dois painéis mostram p99 diferentes para o mesmo intervalo. Qual é a causa provável e o conserto?',
        opcoes: [
          opc('a', 'Método de percentil diferente por painel; fixar nearest-rank sobre o raw e publicar o método junto do número', true, 'número sem método não é comparável.'),
          opc('b', 'Um dos painéis está sempre errado e deve ser desligado', false, 'o defeito é de método não declarado, não de painel.'),
          opc('c', 'Usar a média nos dois painéis', false, 'a média esconde a cauda: é o defeito raiz do bloco.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O Bloco 3 deixou um stop que dispara por sinal. Este bloco cuida do sinal em si: o stop e o gate só valem o que a medida vale. Três resultados saem daqui: medir <strong>p50/p95/p99</strong> sobre amostras brutas, acusar dado ausente em vez de inventar zero e detectar regressão <strong>por slice</strong>. Tudo é Python 3.14 só com a biblioteca padrão, e a leitura de <code>lab/sinais_release.py</code> não exige carga real. Pré-requisitos: Bloco 3 e estatística descritiva básica (M06).</p>' +
          '<h3>N1 · Percentis: a cauda tem número</h3>' +
          '<p><strong>Percentil</strong> p é o valor abaixo do qual caem p% das amostras: p99 de 900 ms significa que 1% das requisições está acima disso, e é gente real esperando. O <strong>nearest-rank</strong> ordena as amostras e toma a posição teto(p% de n): cálculo auditável sobre o raw, sem modelo. Média de 54,5 ms com p99 de 900 ms não é "quase 50 ms": é 95% rápido e 5% quebrado.</p>' +
          '<p>O oráculo exige média mais p50/p95/p99 do <em>mesmo</em> raw, com <code>n</code> declarado. Número sem amostra não é evidência.</p>' },
        { tipo: 'texto', html:
          '<h3>N2 · Dado ausente: o zero que não se inventa</h3>' +
          '<p>Sinal sem amostra não vale zero. Percentil de lista vazia e taxa de erro com total zero levantam <strong>erro explícito</strong>, nunca retornam 0,0. Zero inventado desarma o stop do Bloco 3: o gate lê "tudo bem" onde deveria ler "sem leitura". O oráculo cobra as duas recusas, e também recusa <code>p</code> fora de (0, 100], porque percentil 0 ou 120 é pergunta mal feita. No dossiê, dado ausente aparece como <em>lacuna nomeada</em>, não como verde.</p>' +
          '<h3>N3 · Slices: o agregado não absolve o segmento</h3>' +
          '<p><strong>Slice</strong> é o recorte que importa para alguém: checkout, busca, login, ou plano, região, dispositivo. Regressão que só aparece num slice some na média global, então o agregado verde absolve o segmento vermelho se ninguém olhar por recorte. O oráculo lista os slices com p99 acima do teto, em ordem. Lista vazia é saúde segmentada, não sorte. Slice sem amostras cai no N2: ausente, nunca zero.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Defeito raiz do catálogo', html:
          '<p>Média como único sinal: o stop dispara tarde, o gate aprova cedo, e o incidente do Bloco 6 chega sem aviso que já existia no raw.</p>' },
        { tipo: 'takeaway', html: 'Sinal que alimenta stop e gate carrega <mark>raw</mark>, <mark>método</mark> e <mark>limite</mark>; sem isso é opinião.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>O simulador do texto varia a fração de requisições lentas. Aqui você faz o mesmo com a referência executável <code>resumo</code>: 100 amostras, as rápidas a 10 ms e as lentas a 900 ms, com teto de 800 ms para o p99. As saídas foram executadas com <code>lab/sinais_release.py</code>; os números continuam sendo exemplo variável, não evidência.</p>' },
        { tipo: 'rode', id: 'sinal-rode', titulo: 'Quantas lentas o p99 enxerga?', prefixo: '$', entrada: CMD, unidade: 'ms', terminalTitulo: 'lab/',
          enunciado: 'Rode a execução (Enter) e depois clique nas outras etapas. Cada uma troca só a quantidade de requisições lentas em 100.',
          prever: { pergunta: 'Com 5 requisições lentas (900 ms) em 100, o que dizem p95 e p99?', opcoes: [
            { id: 'a', texto: 'p95 = 900 ms e p99 = 900 ms.', correta: false, porque: 'o p95 cai na posição 95, que ainda é uma das 95 rápidas.' },
            { id: 'b', texto: 'p95 = 10 ms e p99 = 900 ms; a média de 54,5 ms esconde a cauda.', correta: true, porque: 'posição 95 ainda é rápida; posição 99 já está nas 5 lentas.' },
            { id: 'c', texto: 'p95 = p99 = 54,5 ms, os percentis seguem a média.', correta: false, porque: 'percentil é um valor observado do raw, nunca uma média.' }
          ] },
          etapas: [
            { id: 'k5', nome: '5 lentas em 100', descricao: '95 × 10 ms + 5 × 900 ms', tom: 'dns', ms: 54, linhas: [
              L('cmd', CMD),
              L('out', "{'n': 100.0, 'media': 54.5, 'p50': 10.0, 'p95': 10.0, 'p99': 900.0}"),
              L('hint', 'p99 = 900 > teto de 800 ms: o stop dispara, mesmo com média que parece boa')] },
            { id: 'k1', nome: '1 lenta em 100', descricao: '99 × 10 ms + 1 × 900 ms', tom: 'request', ms: 19, linhas: [
              L('cmd', 'resumo([10.0]*99 + [900.0]*1)'),
              L('out', "{'n': 100.0, 'media': 18.9, 'p50': 10.0, 'p95': 10.0, 'p99': 10.0}"),
              L('hint', 'com n = 100, o p99 não vê 1 em 100: o p99 só enxerga mais de 1% lento. Declare n e escolha o percentil conforme o tamanho da amostra')] },
            { id: 'k20', nome: '20 lentas em 100', descricao: '80 × 10 ms + 20 × 900 ms', tom: 'response', ms: 188, linhas: [
              L('cmd', 'resumo([10.0]*80 + [900.0]*20)'),
              L('out', "{'n': 100.0, 'media': 188.0, 'p50': 10.0, 'p95': 900.0, 'p99': 900.0}"),
              L('hint', 'agora o p95 também acusa; o p50 continua em 10 ms e continua enganando sozinho')] }
          ],
          tutorDepois: 'A média foi 54,5 ms enquanto o p99 foi 900 ms. Cada percentil responde a uma pergunta diferente, e o raw com n e método tem de viajar junto do número.',
          callout: 'Você viu a média esconder a cauda e o p99 revelá-la.' },
        { tipo: 'texto', html:
          '<p>As recusas do N2 e a leitura por slice do N3, também executadas com a referência:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          '>>> percentil([], 99)',
          'ValueError: sem amostras: percentil de vazio nao existe',
          '>>> percentil([1.0], 0)',
          'ValueError: percentil invalido: 0',
          '>>> taxa_erro(0, 0)',
          'ValueError: total precisa ser positivo',
          '>>> slices_piores({"busca": 900, "vazio": 1200, "login": 100}, 800)',
          "['busca', 'vazio']"].join('\n') },
        { tipo: 'callout', tom: 'neutral', titulo: 'Leitura do resultado', html:
          '<p>Para 95 × 10 ms mais 5 × 900 ms: média 54,5 ms, p50 10 ms, p99 900 ms. <code>slices_piores</code> acusa busca acima de 800 ms e vazio acima de 1000 ms. Formatos ilustrativos; a folha B04-L do laboratório executa os oráculos. Carga e tráfego reais pertencem à trilha externa e ficam BLOCKED com registro.</p>' },
        { tipo: 'takeaway', html: 'A <mark>média</mark> descreve ninguém; <mark>p99</mark> só enxerga o que passa de <mark>1% da amostra</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'sinal-python', titulo: 'Escreva o sinal que não mente', obrigatorio: false,
          enunciado: 'Implemente as três funções do contrato de <code>sinais_release.py</code>: <code>percentil</code> (nearest-rank, erro para vazio e <code>p</code> fora de (0, 100]), <code>taxa_erro</code> (erro para total zero) e <code>slices_piores</code> (slices acima do teto, em ordem).',
          codigo: codigoSinal, testes: testesSinal,
          dica: 'Ordene a cópia, calcule <code>posto = min(n, math.ceil(n * p / 100))</code> e devolva <code>ordenadas[posto - 1]</code>. Lance <code>ValueError</code> antes de calcular. Em <code>slices_piores</code>, filtre <code>p99 > teto</code> e ordene os nomes.',
          solucao: solucaoSinal,
          tutorDepois: 'O teste de controle negativo (todos os slices abaixo do teto devolvem lista vazia) é o que separa "saúde segmentada" de um filtro que acusa tudo.',
          callout: 'O sinal passou nos testes: cauda, ausência explícita e slices.' },
        { tipo: 'escreva', id: 'sinal-escreva', titulo: 'Média 54,5 ms, p99 900 ms', obrigatorio: false,
          enunciado: 'Alguém do time diz que o release está "rápido, 54,5 ms na média". Explique com as suas palavras o que cada número diz e o que falta para isso virar evidência.',
          placeholder: 'A média de 54,5 ms mistura… O p99 de 900 ms diz que… Para virar evidência falta…',
          rubrica: [
            'Nomeia a <strong>cauda</strong>: a média esconde cerca de 5% de requisições quebradas (95% rápido, 5% lento).',
            'Diz que o p99 de 900 ms mostra o que a média apaga e que o stop deve olhar a cauda.',
            'Exige o <strong>raw</strong> com <code>n</code> declarado e o <strong>método</strong> (nearest-rank) junto de média, p50, p95 e p99.'
          ],
          modelo: '<p>A média de 54,5 ms mistura 95% de requisições rápidas (10 ms) com 5% quebradas (900 ms) e não descreve nenhum grupo. O p99 de 900 ms mostra que uma parte real dos usuários espera quase um segundo, e é nele que o stop do Bloco 3 deve olhar. Para virar evidência falta publicar média e p50/p95/p99 calculados sobre o mesmo raw, com n declarado e o método fixado (nearest-rank), para que outro painel chegue ao mesmo número.</p>' },
        { tipo: 'takeaway', html: 'Zero inventado e média solta são o mesmo defeito: <mark>número sem lastro</mark>.' }
      ] },

      { rotulo: 'Julgar e conferir', blocos: [
        { tipo: 'transcript', id: 'sinal-transcript', titulo: 'Ache a leitura que o raw não sustenta', obrigatorio: false, terminalTitulo: 'revisão do release 4.2.0',
          enunciado: 'O agente resume o monitor do release. Uma das afirmações não é sustentada pelo que a sessão mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Resuma o sinal do release 4.2.0 para o gate. Teto de p99: 800 ms.' },
            { quem: 'ferramenta', texto: '$ python3 -c "from sinais_release import *; print(resumo(amostras))"\n{\'n\': 100.0, \'media\': 54.5, \'p50\': 10.0, \'p95\': 10.0, \'p99\': 900.0}' },
            { quem: 'agente', texto: 'A média está em 54,5 ms e o p50 em 10 ms, então o release está saudável e pode passar no gate.' },
            { quem: 'ferramenta', texto: '$ python3 -c "from sinais_release import *; print(taxa_erro(0, 0))"\nValueError: total precisa ser positivo' },
            { quem: 'agente', texto: 'Sem tráfego no intervalo, registro 0% de erro e sigo em frente.' }
          ],
          erradas: [2, 4],
          explicacao: {
            2: 'média e p50 escondem a cauda: o mesmo resumo mostra p99 = 900 ms, acima do teto de 800 ms. O gate deve ler o p99, não a média.',
            4: 'total zero é dado ausente, e a ferramenta recusou com erro. Escrever 0% transforma ausência em saúde; o certo é registrar a lacuna nomeada no dossiê.'
          },
          tutorDepois: 'Duas afirmações caíram no mesmo defeito: ler o que o raw não diz.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Tabela de diagnóstico</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Release "rápido na média" estoura stop no p99</td><td>Média como único sinal: 5% quebrado invisível no agregado</td><td>Publicar média mais p50/p95/p99 do mesmo raw com n</td></tr>' +
          '<tr><td>Monitor marca 0% de erro sem tráfego</td><td>Total zero virou zero por cento: ausência lida como saúde</td><td>Recusar total zero com erro; registrar lacuna nomeada</td></tr>' +
          '<tr><td>Checkout quebra e o painel global segue verde</td><td>Regressão por slice sem leitura segmentada</td><td>Listar slices acima do teto; vazio é saúde, não sorte</td></tr>' +
          '<tr><td>Dois painéis divergem sobre o mesmo p99</td><td>Método de percentil diferente por painel: número sem método</td><td>Fixar nearest-rank sobre raw; método junto do número</td></tr>' +
          '</tbody></table>' },
        { tipo: 'escolha', id: 'sinal-escolha-p99', titulo: 'Confira: a cauda no p99',
          pergunta: 'Em 100 requisições, 95 levaram 10 ms e 5 levaram 900 ms. Com nearest-rank sobre as amostras brutas, o que dizem p95 e p99?',
          opcoes: [
            opc('a', 'p95 = 900 ms e p99 = 900 ms: a cauda aparece já no p95', false, 'o p95 cai na posição 95, que ainda é uma das 95 rápidas.'),
            opc('b', 'p95 = 54,5 ms e p99 = 54,5 ms: percentis são a média', false, 'percentil é um valor observado, não uma média.'),
            opc('c', 'p95 = 10 ms e p99 = 10 ms: 95% estão rápidos', false, 'o p99 cai na posição 99, que já é uma das lentas.'),
            opc('d', 'p95 = 10 ms (posição 95) e p99 = 900 ms (posição 99): a média de 54,5 ms esconde 5% quebrado, que só o p99 revela', true, 'nearest-rank toma a posição ⌈p% de n⌉. Publicar um único percentil sem n e sem método também é meia evidência.')
          ] },
        { tipo: 'escolha', id: 'sinal-escolha-slice', titulo: 'Confira: o slice pequeno',
          pergunta: 'O p99 global é 300 ms (teto 800 ms), mas o slice checkout (2% do tráfego) está em 1.200 ms. Qual é a leitura correta?',
          opcoes: [
            opc('a', 'O oráculo acusa checkout: agregado verde não absolve segmento vermelho', true, 'o oráculo lista exatamente os slices acima do teto; os demais continuam saudáveis.'),
            opc('b', 'Aprovado: 98% do tráfego está saudável', false, 'peso de tráfego não é justificativa: checkout costuma ser o segmento que paga a conta.'),
            opc('c', 'Aprovado, com a nota de que o checkout é pequeno', false, 'nota não bloqueia nem acusa; o oráculo existe para listar o slice.'),
            opc('d', 'Reprovar todos os slices, porque um deles falhou', false, 'só os slices acima do teto entram na lista.')
          ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fontes e versões', html:
          '<ul><li>NIST AI Resource Center, TEVV (SRC-LT04-07): teste e avaliação com incerteza. Risco alto; revalidar em até 90 dias.</li>' +
          '<li>Principles of Chaos Engineering (SRC-LT04-06): steady state e abort por sinal. Risco baixo.</li>' +
          '<li>Contrato de <code>lab/sinais_release.py</code> e números citados: construção desta trilha, exemplo variável; os observados nascem na folha B04-L.</li></ul>' },
        { tipo: 'takeaway', html: 'Percentil no <mark>raw</mark>, ausência como <mark>erro</mark>, segmento sem <mark>absolvição</mark> pelo agregado.' }
      ] }
    ]
  });
})();
