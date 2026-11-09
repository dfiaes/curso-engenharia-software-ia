/* E01 · Bloco 6: Caso 3, pipeline de documentos em lote. Fonte: E01.html#b06.
   Saídas do capacity vêm da execução real do laboratório (11/10/2026). Preços hipotéticos e redondos, como no módulo. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoCalc = [
    'import math', '', '',
    'def custo_pagina(entrada, saida, preco_in, preco_out):',
    '    """Custo em US$ de uma página; preços em US$ por milhão de tokens."""',
    '    return 0.0', '', '',
    'def custo_cascata(pequeno, grande, taxa_escalonamento):',
    '    """Todas as páginas passam pelo modelo pequeno; a fração escalonada repete no grande."""',
    '    if not 0 <= taxa_escalonamento <= 1:',
    '        raise ValueError("taxa fora de 0..1")',
    '    return 0.0', '', '',
    'def amostra_qa(p, margem, z=1.96):',
    '    """Páginas a revisar por lote: n = z² · p(1-p) ÷ margem², arredondado para cima."""',
    '    if margem <= 0:', '        raise ValueError("margem deve ser positiva")',
    '    return 0', '',
    'print(round(custo_pagina(2200, 600, 0.25, 1.25), 4), amostra_qa(0.05, 0.01))', ''].join('\n');
  var testesCalc = [
    'def test_custo_modelo_pequeno_e_grande():',
    '    assert abs(custo_pagina(2200, 600, 0.25, 1.25) - 0.0013) < 1e-9',
    '    assert abs(custo_pagina(2200, 600, 3.0, 15.0) - 0.0156) < 1e-9', '', '',
    'def test_cascata_12_por_cento():',
    '    p, g = custo_pagina(2200, 600, 0.25, 1.25), custo_pagina(2200, 600, 3.0, 15.0)',
    '    assert abs(custo_cascata(p, g, 0.12) - 0.003172) < 1e-9',
    '    assert abs(1_200_000 * custo_cascata(p, g, 0.12) * 0.5 - 1903.2) < 0.01', '', '',
    'def test_cascata_30_por_cento_ainda_compensa():',
    '    p, g = custo_pagina(2200, 600, 0.25, 1.25), custo_pagina(2200, 600, 3.0, 15.0)',
    '    assert abs(custo_cascata(p, g, 0.30) - 0.00598) < 1e-9', '    assert custo_cascata(p, g, 0.30) < g', '', '',
    'def test_cascata_borda_sem_escalonamento():',
    '    assert custo_cascata(0.0013, 0.0156, 0) == 0.0013', '', '',
    'def test_amostra_qa_um_e_dois_pontos():',
    '    assert amostra_qa(0.05, 0.01) == 1825', '    assert amostra_qa(0.05, 0.02) == 457',
    '    assert amostra_qa(0.05, 0.01) * 12 == 21900', '', '',
    'def test_entradas_invalidas():',
    '    for chamada in (lambda: amostra_qa(0.05, 0), lambda: custo_cascata(0.001, 0.01, 1.4)):',
    '        try:', '            chamada()', '        except ValueError:', '            continue',
    '        assert False, "entrada absurda deveria levantar ValueError"', ''].join('\n');
  var solucaoCalc = [
    'import math', '', '',
    'def custo_pagina(entrada, saida, preco_in, preco_out):',
    '    return (entrada * preco_in + saida * preco_out) / 1e6', '', '',
    'def custo_cascata(pequeno, grande, taxa_escalonamento):',
    '    if not 0 <= taxa_escalonamento <= 1:', '        raise ValueError("taxa fora de 0..1")',
    '    return pequeno + taxa_escalonamento * grande', '', '',
    'def amostra_qa(p, margem, z=1.96):',
    '    if margem <= 0:', '        raise ValueError("margem deve ser positiva")',
    '    return math.ceil(z * z * p * (1 - p) / (margem * margem))', ''].join('\n');

  var codigoRec = [
    'def reconciliar(esperados, resultados, tentativas=None, max_tentativas=3):',
    '    """Reconcilia o lote por custom_id.',
    '',
    '    esperados: lista de custom_id enviados.',
    '    resultados: lista de (custom_id, ok) em qualquer ordem, possivelmente incompleta ou duplicada.',
    '    tentativas: dict custom_id -> tentativas já feitas (padrão 0).',
    '    Devolve {"ok": [...], "reenviar": [...], "dlq": [...], "desconhecidos": [...]} (listas ordenadas).',
    '    Ausente ou com erro: reenviar, e dlq quando já atingiu max_tentativas.',
    '    """',
    '    tentativas = tentativas or {}',
    '    ok = set()',
    '    for cid, deu_certo in resultados:',
    '        if deu_certo and cid in esperados:',
    '            ok.add(cid)',
    '    desconhecidos = sorted({cid for cid, _ in resultados if cid not in esperados})',
    '    reenviar, dlq = [], []',
    '    # lacuna: classifique cada esperado que não está em ok',
    '    return {"ok": sorted(ok), "reenviar": reenviar, "dlq": dlq, "desconhecidos": desconhecidos}', '',
    'print(reconciliar(["a", "b", "c"], [("c", True), ("a", False)]))', ''].join('\n');
  var testesRec = [
    'def test_tudo_ok_fora_de_ordem():',
    '    r = reconciliar(["a", "b", "c"], [("c", True), ("a", True), ("b", True)])',
    '    assert r["ok"] == ["a", "b", "c"] and r["reenviar"] == [] and r["dlq"] == []', '', '',
    'def test_ausente_e_com_erro_voltam_para_reenvio():',
    '    r = reconciliar(["a", "b", "c"], [("c", True), ("a", False)])',
    '    assert r["ok"] == ["c"] and r["reenviar"] == ["a", "b"]', '', '',
    'def test_terceira_falha_vai_para_a_dlq():',
    '    r = reconciliar(["a", "b"], [("a", False)], tentativas={"a": 3, "b": 1})',
    '    assert r["dlq"] == ["a"] and r["reenviar"] == ["b"]', '', '',
    'def test_duplicado_vale_se_algum_ok():',
    '    r = reconciliar(["a"], [("a", False), ("a", True)])',
    '    assert r["ok"] == ["a"] and r["reenviar"] == []', '', '',
    'def test_id_desconhecido_e_so_reportado():',
    '    r = reconciliar(["a"], [("a", True), ("zzz", True)])',
    '    assert r["ok"] == ["a"] and r["desconhecidos"] == ["zzz"]', '', '',
    'def test_lote_vazio_reenvia_tudo():',
    '    r = reconciliar(["a", "b"], [])', '    assert r["reenviar"] == ["a", "b"] and r["ok"] == []', ''].join('\n');
  var solucaoRec = [
    'def reconciliar(esperados, resultados, tentativas=None, max_tentativas=3):',
    '    tentativas = tentativas or {}',
    '    ok = set()',
    '    for cid, deu_certo in resultados:',
    '        if deu_certo and cid in esperados:',
    '            ok.add(cid)',
    '    desconhecidos = sorted({cid for cid, _ in resultados if cid not in esperados})',
    '    reenviar, dlq = [], []',
    '    for cid in sorted(esperados):',
    '        if cid in ok:',
    '            continue',
    '        if tentativas.get(cid, 0) >= max_tentativas:',
    '            dlq.append(cid)',
    '        else:',
    '            reenviar.append(cid)',
    '    return {"ok": sorted(ok), "reenviar": reenviar, "dlq": dlq, "desconhecidos": desconhecidos}', ''].join('\n');

  TrilhaAula.registrar({
    id: 'e01-b6',
    titulo: 'Caso 3: pipeline de documentos em lote',
    minutos: 45,
    resumo: 'Quando ninguém espera cada item, a latência deixa de importar: vazão, custo por item e confiabilidade em escala passam a ser tudo. O desenho torna o trabalho retomável, auditável e barato, e o gargalo muda de máquina para pessoa.',
    objetivo: 'Dimensionar um pipeline em lote (cascata, batch, TPM para o prazo), desenhar o manifesto com reconciliação por custom_id e escolher o tamanho da amostra de QA pelo custo de achar o erro.',
    revisao: [
      { id: 'e01b6-gargalo', pergunta: 'Para 1,2 milhão de páginas, tudo no modelo grande custa US$ 18.720 e a cascata em batch, US$ 1.903. Revisão humana de ±1 ponto: 365 h. Qual é o gargalo real?',
        opcoes: [
          opc('a', 'A verificação humana: o gasto de API caiu 90% e o gargalo mudou de máquina para pessoa', true, 'os 373 mil TPM para fechar em 7 dias cabem folgadamente; o custo de achar o erro domina.'),
          opc('b', 'A cota de TPM do provedor', false, 'o pipeline cabe no prazo mesmo sem batch.'),
          opc('c', 'A latência de cada chamada', false, 'ninguém espera o resultado de cada item.')] },
      { id: 'e01b6-custom', pergunta: 'Um lote em batch volta fora de ordem e com parte das linhas em erro. Como evitar perder páginas sem perceber?',
        opcoes: [
          opc('a', 'Reconciliar por custom_id único contra o manifesto, reprocessando falhas transitórias e mandando as repetidas para a DLQ', true, 'o manifesto é a fonte da verdade, com estado por página.'),
          opc('b', 'Confiar na ordem das linhas do arquivo de resposta', false, 'os resultados chegam fora de ordem.'),
          opc('c', 'Reenviar o lote inteiro sempre', false, 'gasta de novo o que já deu certo; reenvie só as faltantes.')] },
      { id: 'e01b6-amostra', pergunta: 'Qual a fórmula do tamanho da amostra de QA para uma proporção?',
        opcoes: [
          opc('a', 'n = z² · p(1−p) ÷ margem²; com 5% de erro, ±1 ponto e 95% de confiança, 1.825 páginas por lote de 100 mil', true, 'relaxar a margem para ±2 pontos reduz para 457 por lote.'),
          opc('b', 'n = 1% do lote, sempre', false, 'o tamanho vem da estatística da proporção, não de uma fração fixa.'),
          opc('c', 'n = p ÷ margem', false, 'a fórmula usa z², p(1−p) e o quadrado da margem.')] },
      { id: 'e01b6-validador', pergunta: 'Por que a cascata só funciona com validadores?',
        opcoes: [
          opc('a', 'Ela precisa de um critério automático de "esta saída é confiável?" para decidir o que escala ao modelo grande', true, 'esquema, formato, soma cruzada e confiança declarada: o que falha escala; o que falha de novo vai à revisão humana.'),
          opc('b', 'Validadores deixam o modelo pequeno mais inteligente', false, 'eles só decidem o que escalar.'),
          opc('c', 'Para dispensar o piloto de 200 páginas', false, 'o piloto mede a taxa de escalonamento e se a validação pega o erro.')] },
      { id: 'e01b6-estratifica', pergunta: 'Por que amostrar sem estratificar é arriscado?',
        opcoes: [
          opc('a', 'Dá para declarar 97% de acerto com um tipo de documento em 60%', true, 'o erro sistemático de um tipo escapa de uma amostra que não olha por tipo.'),
          opc('b', 'Estratificar é mais barato', false, 'não é uma questão de preço.'),
          opc('c', 'A amostra fica maior que o lote', false, 'o tamanho independe disso.')] }
    ],
    abas: [
      { rotulo: 'O caso e a estimativa', blocos: [
        { tipo: 'texto', html:
          '<h3>Por que esse caso é o que mais economiza</h3>' +
          '<p>É o caso que menos aparece em entrevistas e o que mais economiza dinheiro real. Quando ninguém espera a resposta de cada item, a <strong>latência</strong> deixa de importar, e a vazão e o custo por item passam a ser tudo. O problema central vira <em>confiabilidade em escala</em>: o que fazer com 1,2 milhão de itens quando 3% falham de formas diferentes, o provedor muda o modelo no meio e a auditoria pergunta como você sabe que a extração está certa.</p>' +
          '<p>Os fundamentos de entrega, DLQ e reprocessamento estão no LT02, blocos 2 e 4; a avaliação, no M06. Este bloco dimensiona o pipeline (<code>python -m capacity 3</code>).</p>' },
        { tipo: 'texto', html:
          '<h3>Passo 1 · Requisitos e premissas</h3>' +
          '<p>Enunciado: uma seguradora tem um passivo de <strong>1,2 milhão de páginas</strong> (apólices, laudos, notas fiscais digitalizadas) e precisa extrair campos estruturados (partes, valores, datas, cláusulas) para um banco de dados <strong>em até 7 dias</strong>, com taxa de erro de campo abaixo de 5% e rastro de qual modelo e prompt extraiu cada valor. Depois do passivo haverá fluxo contínuo de ~20 mil páginas por dia, com o mesmo desenho.</p>' +
          '<p>Perguntas que valem ouro:</p>' +
          '<ul><li>O documento tem texto nativo ou é imagem (OCR ou modelo com visão)?</li><li>Qual o custo de um campo errado, e existe validação cruzada (soma de itens contra total, CPF com dígito verificador)?</li><li>O dado é pessoal (retenção, localização do processamento)?</li><li>A extração pode ser refeita quando o esquema mudar?</li></ul>' },
        { tipo: 'texto', html: '<h3>Passo 2 · Estimativa</h3><p>Preços hipotéticos e redondos do módulo, em US$ por milhão de tokens: modelo pequeno 0,25 de entrada e 1,25 de saída; modelo grande 3,00 e 15,00. Troque pelos do seu provedor.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'por página        = 2.200 tokens de entrada (imagem + instrução) · 600 de saída (JSON)',
          'modelo pequeno    = (2.200 × 0,25 + 600 × 1,25) ÷ 10⁶ = US$ 0,0013',
          'modelo grande     = (2.200 × 3,00 + 600 × 15,00) ÷ 10⁶ = US$ 0,0156',
          'cascata (12%)     = 0,0013 + 0,12 × 0,0156           ≈ US$ 0,0032 por página',
          '',
          'tudo no grande, síncrono   1,2 M × 0,0156 = US$ 18.720',
          'cascata, síncrono          1,2 M × 0,0032 = US$  3.806',
          'cascata em batch (−50%)                   = US$  1.903',
          '',
          'tokens totais     = 1,2 M × 2.800 × 1,12             ≈ 3,76 bilhões',
          'a 1 M TPM         = 3,76 bi ÷ 1 M ÷ 60               ≈ 62,7 h',
          'para 7 dias       = 3,76 bi ÷ 10.080 min             ≈ 373 mil TPM'].join('\n') },
        { tipo: 'texto', html:
          '<p>Duas leituras.</p>' +
          '<ul><li><strong>O pipeline cabe no prazo mesmo sem batch.</strong> São 62,7 horas a 1 milhão de TPM, ou só 373 mil TPM sustentados para fechar em sete dias. O gargalo não é a cota, mas a robustez do processamento.</li>' +
          '<li><strong>O custo é de milhares de dólares, não de dezenas de milhares.</strong> A decisão de arquitetura (cascata e batch) vale cerca de 90% da conta: de US$ 18.720 para US$ 1.903. A cascata paga US$ 0,0013 por página em todas e repete 12% com o modelo grande; o batch aproveita que ninguém espera.</li></ul>' },
        { tipo: 'takeaway', html: 'Sem ninguém esperando, <mark>cascata e batch</mark> valem <mark>~90%</mark> da conta e o prazo de 7 dias exige só <mark>373 mil TPM</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html: '<p>A calculadora do laboratório reproduz as contas. A saída abaixo vem de execução real em 11/10/2026.</p>' },
        { tipo: 'rode', id: 'b6-capacity', titulo: 'Rode a calculadora do Caso 3', enunciado: 'Rode e compare as três linhas de total com o que você estimou.',
          prefixo: '$', entrada: 'uv run python -m capacity 3', unidade: 's', terminalTitulo: 'lab E01 · capacity 3',
          prever: { pergunta: 'Tudo no modelo grande, síncrono, custa US$ 18.720. Quanto você espera para a cascata (12% escalonado) em batch com 50% de desconto?', opcoes: [
            { id: 'a', texto: 'Cerca de US$ 9.400 (só o desconto de batch)', correta: false, porque: 'ignora a cascata, que sozinha já leva a conta a US$ 3.806.' },
            { id: 'b', texto: 'Cerca de US$ 1.900', correta: true, porque: '1,2 M × 0,0032 × 0,5 ≈ 1.903: cascata e batch se multiplicam.' },
            { id: 'c', texto: 'Cerca de US$ 190', correta: false, porque: 'dez vezes menos que a conta real.' }
          ] },
          etapas: [
            { id: 'custo', nome: 'Custo por página e totais', descricao: 'Pequeno, grande, cascata, batch', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'uv run python -m capacity 3'),
              L('out', '== Caso 3: pipeline de documentos em lote =='),
              L('out', 'paginas no backlog                                        1_200_000'),
              L('out', 'custo por pagina, modelo pequeno                          0.0013 USD'),
              L('out', 'custo por pagina, modelo grande                           0.0156 USD'),
              L('out', 'custo medio por pagina, cascata com 12% de escalonamento  0.0032 USD'),
              L('out', 'total: tudo no modelo grande, sincrono                    18_720 USD'),
              L('out', 'total: cascata, sincrono                                  3_806 USD'),
              L('out', 'total: cascata, batch com 50% de desconto                 1_903 USD'),
              L('hint', 'a decisão de arquitetura vale cerca de 90% da conta')] },
            { id: 'prazo', nome: 'Prazo', descricao: 'Tokens e TPM para 7 dias', tom: 'tcp', ms: 1, linhas: [
              L('out', 'tokens totais (com reprocessamento)                       3_763_200_000 tokens'),
              L('out', 'tempo a 1M TPM (modo sincrono)                            62.72 h'),
              L('out', 'TPM minimo para terminar em 7 dias                        373_333 tokens/min'),
              L('hint', 'a cota não é o gargalo')] },
            { id: 'qa', nome: 'Revisão humana', descricao: 'Amostra de QA por lote', tom: 'response', ms: 1, linhas: [
              L('out', 'amostra por lote de 100 mil paginas (5% +-1pp)            1_825 paginas'),
              L('out', 'paginas revisadas por humanos (12 lotes)                  21_900 paginas'),
              L('out', 'horas de revisao a 60 paginas/h                           365 h'),
              L('hint', '365 horas humanas contra US$ 1.903 de API: o gargalo mudou de máquina para pessoa')] }
          ],
          tutorDepois: 'Sensibilidade do laboratório: margem de ±2 pontos reduz a revisão a 5.484 páginas (91 horas); com 30% de escalonamento a cascata passa de US$ 0,0032 para US$ 0,0060 por página, ainda abaixo do modelo grande.',
          callout: 'Você viu a conta de API cair 90% e a revisão humana virar o gargalo.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Decisões e trade-offs</h3>' +
          '<table><thead><tr><th>Decisão</th><th>Escolha</th><th>Alternativa</th><th>Por que aqui</th></tr></thead><tbody>' +
          '<tr><td>Modo de chamada</td><td>batch</td><td>síncrono com paralelismo</td><td>−50% e cota separada; custo: janela de até 24 h e reconciliação. Síncrono só para o fluxo urgente e para o piloto</td></tr>' +
          '<tr><td>Modelo</td><td>cascata pequeno → grande</td><td>só o grande</td><td>US$ 1.903 contra US$ 18.720; custo: validadores e piloto para medir os 12%</td></tr>' +
          '<tr><td>Orquestração</td><td>manifesto em banco + workers simples</td><td>engine de workflow completa</td><td>um estado por página basta; adote uma engine se aparecerem dependências entre etapas</td></tr>' +
          '<tr><td>Revisão</td><td>amostra estratificada + fila de exceções</td><td>revisar tudo / nada</td><td>tudo não cabe no orçamento; nada não entrega garantia</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'Cada decisão tem um <mark>custo</mark> declarado: batch troca <mark>janela de 24 h</mark> por −50%; cascata troca <mark>validadores e piloto</mark> por −80%.' }
      ] },

      { rotulo: 'Desenho do pipeline', blocos: [
        { tipo: 'texto', html:
          '<h3>Passo 3 · Desenho</h3>' +
          '<p>Os documentos ficam em armazenamento de objetos, com hash. O <strong>manifesto</strong> guarda o estado de cada página (pendente, enviada, extraída, validada, gravada, revisão, falha) e é a fonte da verdade. O pré-processamento faz OCR, renderização e deduplicação; a extração em lote usa o modelo pequeno com um <code>custom_id</code> por requisição; a conciliação lê o resultado por <code>custom_id</code>. Os validadores checam esquema, regras e somas; o que falha escala a 12% para o modelo grande; a gravação é um upsert idempotente no banco final, com a versão da extração. Falhas e baixa confiança vão à fila de revisão, a amostra de QA é estratificada por lote (1.825 páginas por 100 mil) e a DLQ com relatório garante que nada some em silêncio.</p>' +
          '<p>A extração e a gravação são idempotentes, então qualquer etapa pode ser repetida sem duplicar nem perder.</p>' },
        { tipo: 'abas', rotulo: 'Passo 4 · Aprofundamento', itens: [
          { rotulo: 'Extração com LLM ou visão', blocos: [{ tipo: 'texto', html:
            '<p>Documento com texto nativo vai por parser de texto (barato, determinístico); digitalizado vai por OCR clássico ou por modelo com visão. A escolha é de custo e de qualidade medida, não de preferência: meça os dois numa amostra de 200 páginas rotuladas.</p>' +
            '<p>Saída em esquema estruturado, com campos opcionais explícitos e <em>valor nulo permitido</em> (o modelo que é obrigado a preencher inventa). Peça, quando a precisão importa, a citação do trecho de origem do campo: um valor sem âncora no documento não passa na validação.</p>' }] },
          { rotulo: 'Batch API', blocos: [{ tipo: 'texto', html:
            '<p>A mecânica difere entre provedores, mas o desenho é estável: o pipeline monta arquivos de requisições, cada uma com um <code>custom_id</code> único (por exemplo <code>doc-84213-p07-v3</code>, incluindo a versão do prompt), envia, espera e recebe resultados <em>fora de ordem</em>, parte com erro. Quem não reconcilia por <code>custom_id</code> e por manifesto perde páginas sem perceber.</p>' +
            '<p>Respeite os limites de requisições e de tamanho por lote do provedor, divida o backlog em lotes de tamanho controlável (por exemplo 10 mil requisições) e acompanhe cada lote como unidade de retomada. A janela de conclusão é de até 24 horas por lote: com a conta de 62,7 horas de processamento total, mesmo um provedor lento fecha no prazo se houver lotes suficientes em paralelo.</p>' }] },
          { rotulo: 'Reprocessamento e idempotência', blocos: [{ tipo: 'texto', html:
            '<p>A chave de gravação é <code>(documento, página, versão_do_extrator)</code>. Repetir um lote reescreve os mesmos registros; trocar o prompt gera uma <em>nova versão</em>, sem apagar a anterior até a comparação. O manifesto responde a perguntas operacionais: quantas páginas estão em cada estado? quais falharam mais de três vezes? quais usaram o prompt v2 e precisam refazer?</p>' +
            '<p>Falhas se classificam:</p>' +
            '<ul><li><strong>transitórias</strong> (429, 5xx): repetir com backoff;</li><li><strong>determinísticas</strong> (documento corrompido, saída que nunca valida): DLQ após N tentativas e revisão;</li><li><strong>sistemáticas</strong> (30% dos erros num mesmo tipo de documento): parar, corrigir o prompt e reprocessar só aquele tipo.</li></ul>' }] },
          { rotulo: 'Validadores e cascata', blocos: [{ tipo: 'texto', html:
            '<p>A cascata só funciona com um critério automático de "esta saída é confiável?". Validação barata e determinística primeiro: esquema, tipos, formato (data real, CPF com dígito verificador, valor positivo) e consistência cruzada (soma dos itens igual ao total, vigência com início antes do fim). Páginas que falham, ou cuja confiança declarada é baixa, escalam para o modelo grande; as que falham de novo vão à revisão humana.</p>' +
            '<p>A taxa de 12% de escalonamento é uma premissa medida em <strong>amostra piloto</strong>. Se for 30%, o custo médio por página sobe de US$ 0,0032 para US$ 0,0060 e a decisão ainda vale a pena; se o modelo pequeno acertar tanto quanto o grande, 0% e menos custo; se acertar menos do que parece, a validação não pega e o erro passa. O piloto mede exatamente isso.</p>' }] },
          { rotulo: 'QA amostral', blocos: [{ tipo: 'texto', html:
            '<p>Nenhuma validação cobre o erro plausível (nome trocado por outro nome válido). O controle é uma amostra aleatória <strong>estratificada</strong> por tipo de documento e revisada por humanos. O tamanho vem da estatística de uma proporção:</p>' +
            '<p><code>n = z² · p(1−p) ÷ margem²</code></p>' +
            '<p>Para taxa esperada de 5% de erro e margem de ±1 ponto percentual a 95% de confiança: 1,96² × 0,05 × 0,95 ÷ 0,01² ≈ <strong>1.825 páginas por lote de 100 mil</strong>; em 12 lotes, 21.900 páginas, ou 365 horas de revisão a 60 páginas por hora, um custo humano maior que o de API. Relaxando a margem para ±2 pontos (n = 457 por lote), o total cai para 5.484 páginas e cerca de 91 horas.</p>' +
            '<p>É o trade-off clássico: precisão da estimativa × custo de revisão, e a escolha depende de quanto custa um erro não detectado. O critério de aceite do lote é objetivo: limite superior do intervalo de confiança do erro abaixo de 5%; senão o lote é reprocessado ou revisado por inteiro.</p>' }] }
        ] },
        { tipo: 'texto', largo: true, html:
          '<h3>Falhas previstas</h3>' +
          '<table><thead><tr><th>Falha</th><th>Efeito</th><th>Resposta</th></tr></thead><tbody>' +
          '<tr><td>Lote devolvido com 8% de erros por item</td><td>páginas ausentes</td><td>reconciliar por <code>custom_id</code>; reenviar só as faltantes em novo lote</td></tr>' +
          '<tr><td>Provedor atualiza o modelo no meio do projeto</td><td>mudança de comportamento entre lotes</td><td>fixar versão do modelo; registrar no manifesto; comparar lotes na amostra</td></tr>' +
          '<tr><td>Erro sistemático em um tipo de documento</td><td>milhares de páginas ruins, validação passa</td><td>QA estratificado por tipo; pausa do tipo; reprocessamento seletivo</td></tr>' +
          '<tr><td>Orquestrador reinicia</td><td>trabalho em andamento perdido?</td><td>manifesto durável; retomada a partir do estado, lotes enviados são consultados, não reenviados</td></tr>' +
          '<tr><td>Documento com dado pessoal sensível</td><td>retenção e vazamento</td><td>mascaramento nos logs, retenção mínima do arquivo no provedor, política de exclusão</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'O <mark>manifesto</mark> é a fonte da verdade e a gravação por <mark>(documento, página, versão)</mark> deixa repetir qualquer etapa.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b6-python-calc', titulo: 'Custo da cascata e tamanho da amostra de QA', obrigatorio: false,
          enunciado: 'Implemente <code>custo_pagina</code> (preços em US$ por milhão de tokens), <code>custo_cascata</code> (todas passam pelo modelo pequeno; a fração escalonada repete no grande) e <code>amostra_qa</code> (<code>n = z² · p(1−p) ÷ margem²</code>, arredondado para cima). Entradas absurdas levantam <code>ValueError</code>.',
          codigo: codigoCalc, testes: testesCalc,
          dica: '<code>custo_pagina</code> é <code>(entrada*preco_in + saida*preco_out) / 1e6</code>. A cascata é <code>pequeno + taxa * grande</code>. Para <code>amostra_qa</code> use <code>math.ceil</code>.',
          solucao: solucaoCalc,
          tutorDepois: 'Mude a margem de 0,01 para 0,02 e veja a revisão cair de 1.825 para 457 páginas por lote: é o trade-off entre precisão da estimativa e custo humano.',
          callout: 'A conta do Caso 3 saiu do seu código: cascata, batch e amostra de QA.' },
        { tipo: 'python', id: 'b6-python-rec', titulo: 'Reconcilie o lote por custom_id', obrigatorio: false,
          enunciado: 'Um lote voltou fora de ordem, com linhas em erro, ausentes e duplicadas. Complete <code>reconciliar</code> para classificar cada página esperada: <code>ok</code>, <code>reenviar</code> (ausente ou com erro) ou <code>dlq</code> (já atingiu o máximo de tentativas). IDs que ninguém enviou entram só em <code>desconhecidos</code>. Modelo de processamento fake; sem rede.',
          codigo: codigoRec, testes: testesRec,
          dica: 'Percorra <code>sorted(esperados)</code>. O que não está em <code>ok</code> vai para <code>dlq</code> se <code>tentativas.get(cid, 0) &gt;= max_tentativas</code>; senão para <code>reenviar</code>.',
          solucao: solucaoRec,
          tutorDepois: 'Quem reconcilia pela ordem das linhas perde páginas sem perceber; o <code>custom_id</code> contra o manifesto não perde.',
          callout: 'A reconciliação trata ausentes, erros, duplicados e a DLQ.' },
        { tipo: 'cenario', id: 'b6-cenario', titulo: '30% dos erros num tipo de documento', obrigatorio: false,
          enunciado: 'No piloto de 200 páginas a validação passou, mas a amostra de QA do primeiro lote mostra erro concentrado nas notas fiscais digitalizadas (30% dos erros num único tipo). O restante está dentro da meta. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Há 11 lotes ainda por enviar e o prazo é de 7 dias. A taxa global de erro está abaixo de 5%. O que você faz?', opcoes: [
              { texto: 'Seguir: o erro global está dentro da meta.', vai: 'f-segue', tom: 'ruim', consequencia: 'a média esconde o tipo ruim: milhares de páginas erradas com a validação passando.' },
              { texto: 'Reenviar o lote inteiro com o modelo grande.', vai: 'f-caro', tom: 'ruim', consequencia: 'gasta de novo o que estava certo e não corrige a causa.' },
              { texto: 'Classificar como falha sistemática: pausar o tipo, corrigir o prompt e reprocessar só ele.', vai: 'versao', tom: 'ok', consequencia: 'parar, corrigir e reprocessar seletivamente é a resposta a erro sistemático.' }
            ] },
            versao: { texto: 'O prompt corrigido gera resultados novos. Como gravar sem perder a capacidade de comparar?', opcoes: [
              { texto: 'Sobrescrever os registros antigos.', vai: 'f-perdeu', tom: 'ruim', consequencia: 'sem a versão anterior não há como comparar prompts nem auditar.' },
              { texto: 'Gravar por (documento, página, versão do extrator), mantendo a anterior até a comparação, e estratificar a QA por tipo.', vai: 'f-bom', tom: 'ok', consequencia: 'nova versão sem apagar a anterior; a amostra por tipo mostra se a correção funcionou.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Tipo pausado, prompt corrigido, reprocessamento seletivo gravado como nova versão, e a QA estratificada confirma a melhora antes de retomar.' },
            'f-segue': { bom: false, texto: 'O lote seguiu; a auditoria encontrou um tipo de documento com a maioria dos campos errados.' },
            'f-caro': { bom: false, texto: 'A conta de API subiu sem resolver a causa, e o erro voltou nos lotes seguintes.' },
            'f-perdeu': { bom: false, texto: 'Sem a versão anterior, ninguém consegue dizer se o novo prompt melhorou ou piorou.' }
          },
          callout: 'Você tratou o erro como sistemático e preservou a comparação entre versões.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: otimizar o preço por token e ignorar o custo de achar o erro', html:
          '<p>A conta de API do Caso 3 é US$ 1.903; a revisão humana a ±1 ponto são 365 horas. Um sênior de plataforma celebra o desconto de 50% do batch e não recalcula o gargalo, que mudou de máquina para pessoa. A pergunta que recoloca o foco: <strong>"qual o custo de um campo errado que ninguém viu?"</strong>. Se for baixo, relaxe a margem da amostra; se for alto (dado financeiro ou jurídico), invista em validação cruzada automática, que é mais barata que revisão e roda em 100% das páginas.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Rodar os 1,2 milhão de uma vez, sem piloto de 200 páginas rotuladas; descobrir o problema do prompt depois de gastar o orçamento.</li>' +
          '<li>Não ter manifesto: o orquestrador cai e ninguém sabe o que foi processado.</li>' +
          '<li>Gravar sem chave de versão e perder a capacidade de comparar prompts.</li>' +
          '<li>Amostrar sem estratificar e declarar 97% de acerto com um tipo de documento em 60%.</li>' +
          '<li>Esquecer que a cota de batch e a síncrona são diferentes, e que limites de tamanho do arquivo valem por lote.</li></ul>' },
        { tipo: 'escolha', id: 'b6-esc-gargalo', titulo: 'Confira: o gargalo do projeto',
          pergunta: 'Tudo no modelo grande custa US$ 18.720; cascata em batch, US$ 1.903. Revisão humana de ±1 ponto: 1.825 páginas por lote de 100 mil, 365 h no total. Qual é o gargalo real?',
          opcoes: [
            { id: 'a', texto: 'A cota de TPM do provedor', correta: false, porque: 'os 373 mil TPM para fechar em 7 dias cabem folgadamente.' },
            { id: 'b', texto: 'O preço por token', correta: false, porque: 'já caiu 90% com cascata e batch.' },
            { id: 'c', texto: 'A latência de cada chamada', correta: false, porque: 'ninguém espera cada item.' },
            { id: 'd', texto: 'A verificação humana: o gasto de API caiu 90% e o gargalo mudou de máquina para pessoa', correta: true, porque: 'a pergunta certa passa a ser "qual o custo de um campo errado que ninguém viu?".' }
          ], tutorDepois: 'Achar o erro custa mais que extrair.' },
        { tipo: 'escolha', id: 'b6-esc-reconcilia', titulo: 'Confira: o lote fora de ordem',
          pergunta: 'Um lote em batch volta fora de ordem, com parte das linhas em erro. Como evitar perder páginas sem perceber?',
          opcoes: [
            { id: 'a', texto: 'Confiar na ordem das linhas do arquivo de resposta', correta: false, porque: 'os resultados chegam fora de ordem.' },
            { id: 'b', texto: 'Reconciliar por <code>custom_id</code> único (incluindo a versão do prompt) contra o manifesto, reprocessando falhas transitórias e mandando as repetidas para a DLQ', correta: true, porque: 'o manifesto é a fonte da verdade; a gravação por (documento, página, versão do extrator) permite repetir qualquer etapa sem duplicar nem perder.' },
            { id: 'c', texto: 'Ignorar os erros: 3% é pouco', correta: false, porque: '3% de 1,2 milhão são 36 mil páginas sem dado.' },
            { id: 'd', texto: 'Reenviar o lote inteiro sempre', correta: false, porque: 'reenvie só as faltantes, em novo lote.' }
          ], tutorDepois: 'Nada some em silêncio: o que falha vai para reenvio ou para a DLQ com relatório.' },
        { tipo: 'takeaway', html: 'Em lote, o desenho vale pela <mark>retomada</mark> e pela <mark>reconciliação</mark>, e o dinheiro está em <mark>achar o erro</mark>, não em extrair.' }
      ] }
    ]
  });
})();
