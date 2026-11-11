/* M13 · Bloco 16: performance, capacidade e modo local. Fonte: M13.html#h-b16. Saídas do rode são a execução registrada no bloco (evidence/m13/B16). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoPerf = String.raw`import math

def percentile(samples, p):
    # LACUNA: interpolacao R-7 sobre as amostras ordenadas.
    # Vazio ou p fora de [0, 100] -> ValueError.
    return samples[0]

def saturation_level(curve, tol):
    # LACUNA: curve = [(nivel, throughput), ...]. Devolva o ultimo nivel que
    # ainda escalava (o joelho): o nivel anterior ao primeiro cujo ganho
    # relativo cai abaixo de tol. None se nunca satura.
    return None
`;
  var solucaoPerf = String.raw`import math

def percentile(samples, p):
    if not samples:
        raise ValueError("sem amostras")
    if p < 0 or p > 100:
        raise ValueError("p fora de [0, 100]")
    xs = sorted(samples)
    h = (len(xs) - 1) * p / 100
    lo = math.floor(h)
    hi = min(lo + 1, len(xs) - 1)
    return xs[lo] + (h - lo) * (xs[hi] - xs[lo])

def saturation_level(curve, tol):
    for i in range(1, len(curve)):
        ganho = (curve[i][1] - curve[i - 1][1]) / curve[i - 1][1]
        if ganho < tol:
            return curve[i - 1][0]
    return None
`;
  var testesPerf = String.raw`def test_p50_interpola():
    assert percentile([1, 2, 3, 4], 50) == 2.5

def test_extremos_e_ordem_da_entrada():
    assert percentile([4, 1, 3, 2], 0) == 1
    assert percentile([4, 1, 3, 2], 100) == 4

def test_monotono():
    xs = [5, 1, 9, 3, 7, 2, 8]
    assert percentile(xs, 50) <= percentile(xs, 95) <= percentile(xs, 99)

def test_p95_cauda():
    xs = list(range(1, 101))
    assert abs(percentile(xs, 95) - 95.05) < 1e-9

def test_vazio_e_p_invalido():
    for args in [([], 50), ([1, 2], -1), ([1, 2], 101)]:
        try:
            percentile(*args)
        except ValueError:
            continue
        assert False, args

def test_saturacao_acha_o_joelho():
    curva = [(1, 20000), (2, 39000), (3, 39500), (4, 39600)]
    assert saturation_level(curva, 0.05) == 2

def test_sem_saturacao_devolve_none():
    assert saturation_level([(1, 100), (2, 190), (3, 360)], 0.05) is None
`;

  TrilhaAula.registrar({
    id: 'm13-b16',
    titulo: 'Performance, capacidade e modo local',
    minutos: 30,
    resumo: '"Rápido" não é número ensaiado: é medição real com ambiente registrado, percentis sobre amostras brutas e uma regra testável para saturação.',
    objetivo: 'Explicar por que se reportam percentis com amostra e ambiente, como a saturação é detectada por regra e por que a medição local não se extrapola para a nuvem.',
    revisao: [
      { id: 'm13b16-pct', pergunta: 'Por que reportar p50/p95/p99 com a amostra e não só a média?',
        opcoes: [
          opc('a', 'A média esconde a cauda; percentil é função pura das amostras brutas (interpolação R-7), reprodutível', true, 'média sem percentil esconde a cauda; p99 sem p50 conta menos da metade da história.'),
          opc('b', 'Porque a média é cara de calcular', false, 'o motivo é informação, não custo.'),
          opc('c', 'Porque percentil dispensa o ambiente', false, 'o ambiente viaja junto do relatório.')] },
      { id: 'm13b16-amb', pergunta: 'Por que o ambiente (CPU, OS, Python) é gravado no relatório?',
        opcoes: [
          opc('a', 'Benchmark sem ambiente é irreprodutível; a conclusão vale só para o ambiente registrado', true, 'neste lab: Python 3.14.7, macOS arm64.'),
          opc('b', 'Para o relatório ficar completo', false, 'o motivo é reprodutibilidade e limite de validade.'),
          opc('c', 'Para comparar com a nuvem', false, 'o relatório declara "não extrapolar a cloud (BLOCKED)".')] },
      { id: 'm13b16-sat', pergunta: 'Como a saturação é detectada?',
        opcoes: [
          opc('a', 'Por regra: quando o ganho relativo de throughput entre níveis cai abaixo da tolerância', true, 'saturação "olhada no gráfico" é subjetiva; a regra é testável.'),
          opc('b', 'Olhando o gráfico', false, 'é subjetivo e irreprodutível.'),
          opc('c', 'Quando o p99 passa de 1 s', false, 'o critério é de ganho de throughput, não de latência.')] },
      { id: 'm13b16-cloud', pergunta: 'O benchmark local pode ser usado para prometer capacidade em cloud?',
        opcoes: [
          opc('a', 'Não: a estimativa de capacidade é um modelo com premissas explícitas, e a comparação em cloud é BLOCKED ambiental', true, 'extrapolar local para cloud é marketing, não engenharia.'),
          opc('b', 'Sim, multiplicando pelo número de nós', false, 'a premissa de escala linear não foi medida.'),
          opc('c', 'Sim, se o p99 for baixo', false, 'latência local não diz nada da nuvem.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>O número que não se repete</h3>' +
          '<p>Alguém diz "a busca responde em 12 ms". Em que máquina, com que carga, sobre quantas amostras, em qual percentil? Sem isso, o número é anedota. O bloco trata performance como <strong>medição real com ambiente registrado</strong>.</p>' +
          '<ul><li><strong>Benchmark:</strong> <code>benchmark()</code> mede com <code>time.perf_counter</code> depois de um warm-up e devolve as <strong>amostras brutas</strong>.</li>' +
          '<li><strong>Percentis:</strong> p50, p95 e p99 são função pura das amostras (interpolação R-7); o mesmo conjunto sempre dá o mesmo percentil.</li>' +
          '<li><strong>Saturação:</strong> detectada por regra, quando o ganho relativo de throughput entre níveis cai abaixo da tolerância. Neste ambiente: nível 2, cerca de 39k ops/s (<code>capacity-report.json</code>).</li>' +
          '<li><strong>Capacity estimate:</strong> modelo declarado, com premissas explícitas, não medição fingida. A margem de capacidade (por exemplo, 2,0 contra 1,2) muda a decisão de quanto folgar.</li></ul>' +
          '<p><strong>Limite:</strong> o ambiente medido (Python 3.14.7, macOS arm64) é gravado no relatório, que declara <em>"não extrapolar a cloud (BLOCKED)"</em>. Só existe o modo local; a comparação real em nuvem não foi feita.</p>' },
        { tipo: 'takeaway', html: 'Medição vale para o <mark>ambiente registrado</mark>; capacidade em nuvem é <mark>modelo declarado</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'b16-rode', titulo: 'Rode os oráculos de performance', enunciado: 'Aperte Enter e acompanhe. Saída registrada no bloco (<code>evidence/m13/B16</code>).',
          prefixo: '$', entrada: 'uv run pytest tests/test_perf.py -v', unidade: 'testes', terminalTitulo: 'lab M13 (saída registrada)',
          prever: { pergunta: 'Qual teste impede comparar relatórios de máquinas diferentes como se fossem iguais?', opcoes: [
            { id: 'a', texto: '<code>test_resumo_relatorio_exige_mesmo_ambiente</code>', correta: true, porque: 'o resumo do relatório exige o mesmo ambiente; o ambiente é registrado real, não declarado.' },
            { id: 'b', texto: '<code>test_percentil_puro_e_monotono</code>', correta: false, porque: 'esse garante propriedades do percentil, não a comparabilidade.' },
            { id: 'c', texto: '<code>test_saturacao_detecta_platô</code>', correta: false, porque: 'esse testa a regra de saturação.' }
          ] },
          etapas: [
            { id: 'medicao', nome: 'Medição e percentis', descricao: 'Amostras reais, ambiente', tom: 'dns', ms: 3, linhas: [
              L('cmd', 'uv run pytest tests/test_perf.py -v'),
              L('out', 'test_percentil_puro_e_monotono PASSED'),
              L('out', 'test_ambiente_registrado_real PASSED'),
              L('out', 'test_benchmark_medicao_real_ordem_percentis PASSED')] },
            { id: 'cap', nome: 'Saturação e capacidade', descricao: 'Regra, curva, estimativa', tom: 'request', ms: 3, linhas: [
              L('out', 'test_saturacao_detecta_platô PASSED'),
              L('out', 'test_throughput_curve_medida_real PASSED'),
              L('out', 'test_capacity_estimate_e_slo_budget PASSED')] },
            { id: 'amb', nome: 'Mesmo ambiente', descricao: 'Resumo exige ambiente igual', tom: 'response', ms: 1, linhas: [
              L('out', 'test_resumo_relatorio_exige_mesmo_ambiente PASSED'),
              L('in', '7 passed'),
              L('hint', 'ambiente: Python 3.14.7, macOS arm64 (gravado no relatório)')] }
          ],
          tutorAntes: 'Responda a previsão e aperte Enter.',
          callout: 'Você viu os sete oráculos de performance passarem.' },
        { tipo: 'cenario', id: 'b16-cenario', titulo: 'A promessa de capacidade', obrigatorio: false,
          enunciado: 'O comercial quer prometer a um cliente a capacidade medida no notebook. Decida. Cenário de exemplo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O relatório mostra cerca de 39k ops/s no nível 2, em macOS arm64. O cliente vai rodar em nuvem. O que você responde?', opcoes: [
              { texto: 'Prometer 39k ops/s por nó e multiplicar pelos nós.', vai: 'f-mkt', tom: 'ruim', consequencia: 'extrapolar local para cloud é marketing, não engenharia.' },
              { texto: 'Dizer que a medição vale para o ambiente registrado e apresentar a estimativa como modelo com premissas explícitas.', vai: 'premissas', tom: 'ok', consequencia: 'a promessa fica dentro do que foi medido.' }
            ] },
            premissas: { texto: 'O cliente pergunta quais premissas sustentam a estimativa. O que você faz?', opcoes: [
              { texto: 'Listar as premissas do modelo e declarar a comparação em cloud como BLOCKED até medir.', vai: 'f-bom', tom: 'ok', consequencia: 'as premissas que quebrarem primeiro ficam visíveis.' },
              { texto: 'Dizer que o p99 local é baixo e isso basta.', vai: 'f-p99', tom: 'ruim', consequencia: 'latência local não sustenta premissas de nuvem.' }
            ] }
          },
          finais: {
            'f-mkt': { texto: 'Uma promessa sem medição na nuvem; o primeiro teste do cliente a desmente.', bom: false },
            'f-p99': { texto: 'O argumento não toca as premissas; a estimativa segue sem sustentação.', bom: false },
            'f-bom': { texto: 'Medição local honesta, modelo declarado e nuvem BLOCKED.', bom: true }
          } },
        { tipo: 'takeaway', html: 'O que não foi <mark>medido</mark> no ambiente fica <mark>declarado</mark> como modelo ou BLOCKED.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b16-python', titulo: 'Percentil R-7 e regra de saturação', obrigatorio: false,
          enunciado: 'Implemente <code>percentile(samples, p)</code> (interpolação R-7; vazio ou <code>p</code> fora de [0, 100] levanta <code>ValueError</code>) e <code>saturation_level(curve, tol)</code>, que devolve o último nível que ainda escalava. A convenção do joelho é do exercício; o lab reporta o nível 2 neste ambiente.',
          codigo: codigoPerf, testes: testesPerf,
          dica: 'R-7: <code>h = (n - 1) * p / 100</code>; interpole entre <code>xs[floor(h)]</code> e o vizinho. Saturação: <code>ganho = (t[i] - t[i-1]) / t[i-1]</code>.',
          solucao: solucaoPerf,
          tutorDepois: 'Os dois são funções puras: mesmo conjunto de amostras, mesmo resultado. É isso que torna o relatório auditável.',
          callout: 'Seu percentil e sua regra de saturação passaram nos testes.' },
        { tipo: 'escolha', id: 'b16-esc1', titulo: 'Margem de capacidade', pergunta: 'A margem de capacidade passa de 2,0 para 1,2. O que muda na decisão?',
          opcoes: [
            opc('a', 'Sobra menos folga: a decisão de provisionar fica mais apertada e depende mais das premissas do modelo', true, 'o capacity estimate é modelo declarado; menos margem expõe mais as premissas.'),
            opc('b', 'Nada, a margem é só cosmética', false, 'a margem entra na estimativa de capacidade.'),
            opc('c', 'Passa a valer como medição', false, 'a estimativa continua sendo modelo, não medição.')] },
        { tipo: 'escolha', id: 'b16-esc2', titulo: 'Média sem cauda', pergunta: 'O relatório traz só a latência média. Qual o diagnóstico?',
          opcoes: [
            opc('a', 'Esconde a cauda: faltam p50, p95 e p99 com a amostra registrada', true, 'é o primeiro item do diagnóstico do bloco.'),
            opc('b', 'Está certo, média é a métrica padrão', false, 'esconde justamente os pedidos lentos.'),
            opc('c', 'Falta só o ambiente', false, 'falta também o percentil.')] },
        { tipo: 'takeaway', html: 'Percentil de <mark>amostra real</mark>, saturação por <mark>regra</mark>.' }
      ] }
    ]
  });
})();
