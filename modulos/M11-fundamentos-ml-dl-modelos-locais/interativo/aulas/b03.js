/* M11 · Bloco 6 (aula 3): pesos abertos, quantização e o que cabe na máquina. Fonte: M11.html#b06. Saídas de orcamento_vram.py calculadas em CPython com a arquitetura ilustrativa do módulo (32 camadas, 8 cabeças KV, dim. 128, KV a 2 bytes); são exemplo variável, não medida. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasVram = function () {
    return [
      { id: 'demo', nome: 'Demo: 8k × 1', descricao: 'Um usuário, contexto de 8192', tom: 'dns', ms: 6.82, linhas: [
        L('cmd', 'python orcamento_vram.py 8 --quant Q4_K_M --ctx 8192 --batch 1'),
        L('out', 'pesos        4.32 GB'),
        L('out', 'cache KV     1.00 GB   (ctx=8192, batch=1)'),
        L('out', 'overhead     1.50 GB'),
        L('out', 'TOTAL        6.82 GB'),
        L('hint', 'cabe folgado numa GPU de 8 GB: os pesos dominam')] },
      { id: 'prod', nome: 'Produção: 128k × 4', descricao: 'Quatro usuários, contexto de 131072', tom: 'tcp', ms: 69.82, linhas: [
        L('cmd', 'python orcamento_vram.py 8 --quant Q4_K_M --ctx 131072 --batch 4'),
        L('out', 'pesos        4.32 GB'),
        L('out', 'cache KV    64.00 GB   (ctx=131072, batch=4)'),
        L('out', 'overhead     1.50 GB'),
        L('out', 'TOTAL       69.82 GB'),
        L('hint', 'o mesmo peso de 4.32 GB, mas o KV multiplicou por 64 (16 × 4)')] },
      { id: 'leitura', nome: 'Leitura', descricao: 'Quem multiplica e quem fica parado', tom: 'ink', ms: 1, linhas: [
        L('in', 'pesos: fixos por modelo e quant. KV: contexto × concorrência.'),
        L('hint', 'sem aviso, um servidor que não cabe descarrega camadas para a CPU e a vazão cai uma ordem de grandeza')] }
    ];
  };

  var BYTES = '{"FP16": 2.00, "Q8_0": 1.06, "Q6_K": 0.82, "Q5_K_M": 0.70, "Q4_K_M": 0.58, "Q4_K_S": 0.55, "Q3_K_S": 0.44}';
  var codigoVram = [
    'BYTES_POR_PARAM = ' + BYTES, '', '',
    'def estimar(bilhoes, quant, ctx, batch=1, n_camadas=32, n_kv=8, dim_cabeca=128, bytes_valor=2, overhead_gb=1.5):',
    '    """Devolve (pesos_gb, kv_gb, overhead_gb, total_gb)."""',
    '    pesos = 0.0  # bilhoes * 1e9 * bytes por parametro do quant / 1024**3',
    '    kv = 0.0     # 2 * n_camadas * n_kv * dim_cabeca * ctx * batch * bytes_valor / 1024**3',
    '    return pesos, kv, overhead_gb, pesos + kv + overhead_gb', '', '',
    'def cabe(vram_gb, bilhoes, quant, ctx, batch=1):', '    # verdadeiro quando o total estimado cabe na VRAM', '    return False', '', '',
    'print(estimar(8, "Q4_K_M", 8192, 1))', 'print(estimar(8, "Q4_K_M", 131072, 4))', ''].join('\n');
  var testesVram = [
    'def test_demo_8b_q4_8k():', '    p, kv, o, t = estimar(8, "Q4_K_M", 8192, 1)',
    '    assert abs(p - 4.32) < 0.01 and abs(kv - 1.0) < 1e-9 and abs(t - 6.82) < 0.01', '', '',
    'def test_producao_128k_x_4():', '    p, kv, o, t = estimar(8, "Q4_K_M", 131072, 4)',
    '    assert abs(kv - 64.0) < 1e-9 and abs(t - 69.82) < 0.01', '', '',
    'def test_kv_dobra_com_ctx_e_com_batch_e_pesos_nao_se_movem():', '    a = estimar(8, "Q4_K_M", 4096, 1)', '    b = estimar(8, "Q4_K_M", 8192, 1)',
    '    c = estimar(8, "Q4_K_M", 8192, 2)', '    assert abs(b[1] - 2 * a[1]) < 1e-9 and abs(c[1] - 2 * b[1]) < 1e-9',
    '    assert a[0] == b[0] == c[0]', '', '',
    'def test_quant_desconhecido_levanta_keyerror():', '    try:', '        estimar(8, "Q9_X", 8192)', '    except KeyError:', '        return', '    raise AssertionError("esperava KeyError")', '', '',
    'def test_cabe_na_vram():', '    assert cabe(24, 8, "Q4_K_M", 8192, 1) is True', '    assert cabe(24, 8, "Q4_K_M", 131072, 4) is False',
    '    assert cabe(80, 8, "Q4_K_M", 131072, 4) is True', '', '',
    'def test_controle_negativo_quant_menor_cabe_mais():', '    assert estimar(8, "Q3_K_S", 8192)[0] < estimar(8, "Q8_0", 8192)[0]', ''].join('\n');
  var solucaoVram = [
    'BYTES_POR_PARAM = ' + BYTES, '', '',
    'def estimar(bilhoes, quant, ctx, batch=1, n_camadas=32, n_kv=8, dim_cabeca=128, bytes_valor=2, overhead_gb=1.5):',
    '    pesos = bilhoes * 1e9 * BYTES_POR_PARAM[quant] / 1024**3',
    '    kv = (2 * n_camadas * n_kv * dim_cabeca * ctx * batch * bytes_valor) / 1024**3',
    '    return pesos, kv, overhead_gb, pesos + kv + overhead_gb', '', '',
    'def cabe(vram_gb, bilhoes, quant, ctx, batch=1):', '    return estimar(bilhoes, quant, ctx, batch)[3] <= vram_gb', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm11-b3',
    titulo: 'Pesos abertos, quantização e o que cabe na máquina',
    minutos: 35,
    resumo: 'Licença lida antes de prometer, VRAM calculada antes de baixar e quantização validada por tarefa. O cache de KV, e não o peso, decide o hardware.',
    objetivo: 'Classificar uma licença em quatro faixas e decidir uso comercial, calcular VRAM como pesos + overhead + KV, ler GGUF e K-quants letra por letra e explicar por que o raciocínio encadeado quebra primeiro na quantização.',
    revisao: [
      { id: 'm11b3-licenca', pergunta: 'Um peso é publicado como CC-BY-NC. Pode entrar num produto pago?',
        opcoes: [
          opc('a', 'Não: não comercial bloqueia produto pago, sem exceção; peso aberto não é código aberto', true, 'acesso aos números não concede direito comercial. Também bloqueia o destilado cinzento, sem parecer.'),
          opc('b', 'Sim, porque os pesos são públicos', false, 'peso aberto significa acesso aos números; código aberto significa direitos de uso sob licença reconhecida.'),
          opc('c', 'Sim, desde que o cliente rode na própria rede', false, 'a licença independe de onde o modelo roda.')] },
      { id: 'm11b3-vram', pergunta: 'Como se calcula a memória de serving?',
        opcoes: [
          opc('a', 'pesos + overhead (1 a 2 GB) + cache de KV, que cresce com contexto e com concorrência', true, 'KV = 2 · camadas · n_kv · dim_cabeça · ctx · batch · bytes; os pesos não se movem.'),
          opc('b', 'Só o tamanho do arquivo do modelo', false, 'ignora o KV, que transforma demonstração folgada em produção estourada.'),
          opc('c', 'Pesos × número de usuários simultâneos', false, 'os pesos são carregados uma vez; quem multiplica por usuário é o KV.')] },
      { id: 'm11b3-nome', pergunta: 'O que o nome Q4_K_M declara?',
        opcoes: [
          opc('a', '4 bits por peso, esquema K (escalas em dois níveis por bloco) e mix médio; não declara qualidade por tarefa', true, 'o nome é contrato de tamanho e esquema. Qualidade se mede com evals próprios.'),
          opc('b', 'Qualidade equivalente ao FP16 em qualquer tarefa', false, 'o nome não declara qualidade.'),
          opc('c', 'Quatro modelos num só arquivo', false, 'o 4 é bits por peso.')] },
      { id: 'm11b3-quebra', pergunta: 'Por que perplexidade estável não aprova um quant agressivo?',
        opcoes: [
          opc('a', 'Ela mede surpresa média em texto corrido; raciocínio encadeado amplifica o desvio a cada passo e quebra primeiro', true, 'senso comum decide por token isolado e absorve o ruído; a média entre tarefas esconde o que o produto vende.'),
          opc('b', 'Porque a perplexidade sempre sobe com a quantização', false, 'o ponto é o oposto: ela pode ficar quase igual enquanto a cadeia de raciocínio se destrói.'),
          opc('c', 'Porque o imatrix elimina a perda', false, 'imatrix é calibração; sem corpus representativo do uso, o ganho inexiste.')] },
      { id: 'm11b3-moe', pergunta: 'O que um modelo MoE economiza?',
        opcoes: [
          opc('a', 'Computação por token (só a fração ativa é computada); todos os pesos continuam ocupando memória', true, 'MoE reduz computação por token, não VRAM.'),
          opc('b', 'A VRAM, porque só os especialistas ativos são carregados', false, 'todos os pesos ocupam memória.'),
          opc('c', 'O cache de KV', false, 'o KV segue contexto e concorrência.')] }
    ],
    abas: [
      { rotulo: 'Licença: ler antes de prometer', blocos: [
        { tipo: 'texto', html:
          '<h3>A porta comercial que a API não abre</h3>' +
          '<p>Há um cliente que a API não atende: aquele cujo código-fonte não pode sair da rede. Banco, seguradora, órgão público, empresa com confidencialidade rígida. Um produto que roda inteiro no datacenter do cliente tem outro preço e outro comprador. Este bloco torna a promessa verificável: licença, memória, perda medida.</p>' +
          '<p><strong>Peso aberto</strong> significa acesso aos números treinados. <strong>Código aberto</strong> significa direitos de uso, modificação e redistribuição sob licença reconhecida. Confundir os dois assina contrato sobre direito inexistente.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Faixa</th><th>Sinal no cartão</th><th>Efeito comercial</th></tr></thead><tbody>' +
          '<tr><td><strong>OSS real</strong> (Apache 2.0, MIT)</td><td>licença padrão, sem cláusula de uso</td><td>uso comercial, modificação e redistribuição liberados</td></tr>' +
          '<tr><td><strong>Pesos abertos com licença própria</strong></td><td>licença do publicador, atribuição ou política de uso anexada</td><td>condicional: cada cláusula precisa de leitura (limite de escala, atribuição, uso aceitável)</td></tr>' +
          '<tr><td><strong>Não comercial</strong> (CC-BY-NC e similares)</td><td>menção a <em>non-commercial</em></td><td>bloqueado para produto pago, sem exceção</td></tr>' +
          '<tr><td><strong>Destilado cinzento</strong></td><td>treinado a partir de respostas de modelo fechado</td><td>bloqueado sem parecer: os termos do modelo-professor acompanham os pesos</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Checagem no Hub: três perguntas, um item de ADR', html:
          '<p>Antes de propor modelo local, abra o cartão do modelo no Hub e responda por escrito: <strong>(1)</strong> a licença permite uso comercial neste cliente? <strong>(2)</strong> existe teto de escala ou receita que exige negociação? <strong>(3)</strong> existe política de uso aceitável que se propaga ao contrato do produto? As respostas entram no ADR da etapa, com data e versão da licença (o M04 definiu o formato). Cartão sem licença explícita conta como resposta negativa até prova em contrário. A checagem do cartão precede qualquer conta de VRAM.</p>' },
        { tipo: 'texto', html:
          '<h3>Famílias sem placar</h3>' +
          '<p>Exemplos de famílias citadas nesta data: Qwen, Llama, DeepSeek, Mistral, Kimi, gpt-oss. Nenhuma ordem entre elas é afirmada: liderança muda em semanas e placar publicado envelhece antes da leitura. O método permanece: filtrar por faixa de licença, filtrar por tamanho que cabe no hardware, decidir com os evals próprios do M06. Modelos <strong>MoE</strong> (<em>mixture of experts</em>) anunciam o total e a fração ativa por token; todos os pesos ocupam memória, só a fração ativa é computada. MoE reduz computação por token, não VRAM.</p>' },
        { tipo: 'takeaway', html: 'Peso aberto <mark>não é</mark> código aberto: <mark>NC e destilado bloqueiam</mark> produto pago, e licença própria exige leitura.' }
      ] },

      { rotulo: 'A conta de VRAM', blocos: [
        { tipo: 'texto', html:
          '<h3>Três parcelas, feitas antes de qualquer download</h3>' +
          '<p>Os <strong>pesos</strong> são fixos por modelo e quant. O <strong>overhead</strong> cobre ativações e folga do servidor, na ordem de 1 a 2 GB. O <strong>cache de KV</strong> (as matrizes de chave e valor guardadas por token e por sequência) cresce com cada token de contexto e cada requisição simultânea: é ele que transforma demonstração folgada em produção estourada.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: 'memoria_gb = pesos_gb + overhead_gb + kv_gb\npesos_gb   = bilhoes * 1e9 * bytes_por_param / 1024**3\nkv_bytes   = 2 * n_camadas * n_kv * dim_cabeca * ctx * batch * bytes_por_valor\n# o fator 2 inicial: matrizes K e V guardadas por token e por sequência' },
        { tipo: 'texto', html:
          '<p><code>n_camadas</code> é a profundidade; <code>n_kv</code> conta cabeças de chave/valor (igual às de consulta, ou menor com atenção agrupada); <code>dim_cabeca</code> é a dimensão por cabeça; <code>ctx</code> é o contexto configurado; <code>batch</code> é a concorrência simultânea; <code>bytes_por_valor</code> é 2 para KV em 16 bits. <strong>Dobrar <code>ctx</code> dobra o KV; dobrar <code>batch</code> dobra de novo. Os pesos não se movem.</strong></p>' },
        { tipo: 'rode', id: 'm11b3-rode', titulo: 'Mesmo modelo, dois hardwares', enunciado: 'Arquitetura ilustrativa: 32 camadas, 8 cabeças KV, dimensão 128, KV a 2 bytes; modelo de 8B em Q4_K_M (0,58 byte por parâmetro). A barra mostra o total em GB.',
          prefixo: '$', entrada: 'python orcamento_vram.py 8 --quant Q4_K_M --ctx 8192 --batch 1', unidade: 'GB', terminalTitulo: 'orcamento_vram', etapas: etapasVram(),
          prever: { pergunta: 'Passando de 8k × 1 usuário para 128k × 4 usuários, o que acontece com o total?', opcoes: [
            { id: 'a', texto: 'Sobe pouco: os pesos dominam e continuam os mesmos.', correta: false, porque: 'em 8k × 1 os pesos dominam; em 128k × 4 o KV cresce 64 vezes e passa a dominar.' },
            { id: 'b', texto: 'Quadruplica, só pelos 4 usuários.', correta: false, porque: 'o contexto também cresceu 16 vezes (8192 para 131072); o KV multiplica as duas coisas.' },
            { id: 'c', texto: 'Passa de dezenas de GB: o KV multiplica por 64 e chega a 64 GB.', correta: true, porque: 'KV vai de 1,00 GB para 64,00 GB e o total para 69,82 GB; os pesos continuam em 4,32 GB.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em cada etapa para ler só as linhas dela.',
          tutorDepois: 'O mesmo modelo cabe numa GPU de 8 GB num cenário e pede mais de 64 GB no outro. Dimensione sempre com o contexto máximo real e a concorrência real, nunca com o caso de demonstração.',
          callout: 'Você viu o KV decidir o hardware, com os pesos parados.' },
        { tipo: 'callout', tom: 'danger', titulo: 'KV estoura em silêncio', html:
          '<p>Um modelo que serve bem um usuário em 8k pode não caber com quatro simultâneos em 128k. Quando não cabe, o servidor descarrega camadas para a CPU e a vazão cai uma ordem de grandeza <strong>sem mensagem de erro</strong>. No Bloco 7 essa conta vira parâmetro de servidor. Cada token de cada sequência ocupa, nesta arquitetura, 128 KiB de KV; os números do exemplo são calculados pela fórmula e a folha L recalcula com a arquitetura declarada do modelo escolhido.</p>' },
        { tipo: 'takeaway', html: 'Só o <mark>KV</mark> multiplica com <mark>contexto × concorrência</mark>; dimensione pelo caso real de produção.' }
      ] },

      { rotulo: 'Quantização e GGUF', blocos: [
        { tipo: 'texto', html:
          '<h3>O que cada letra declara</h3>' +
          '<p><strong>Quantizar</strong> é guardar cada peso com menos bits e recuperar a faixa com um fator de escala por bloco: compressão com perda, menos memória e carga mais rápida, fidelidade menor por arredondamento. <strong>GGUF</strong> é o formato de arquivo do projeto aberto llama.cpp: um arquivo único com pesos, tokenizador, template e metadados, consumido por servidores locais. <strong>K-quants</strong> são os esquemas desse formato.</p>' +
          '<ul><li><code>Q</code> fixa quantização.</li><li>O número declara os bits por peso (3, 4, 5, 8).</li><li><code>K</code> declara escalas em dois níveis por bloco, contra os <code>_0</code>/<code>_1</code> uniformes mais antigos.</li><li>O sufixo declara o mix: <code>_S</code> pequeno, <code>_M</code> médio, <code>_L</code> grande, isto é, quais tensores ganham bits extras por sensibilidade (atenção e embeddings recebem mais).</li></ul>' +
          '<p><code>Q4_K_M</code> lê-se: 4 bits, esquema K, mix médio. <code>Q3_K_S</code> promete 3 bits com mix pequeno; <code>Q5_0</code>, 5 bits uniforme antigo; <code>Q8_0</code>, 8 bits uniforme. O nome declara tamanho e esquema, <strong>não qualidade por tarefa</strong>: essa se mede.</p>' +
          '<p><strong>imatrix</strong> (<em>importance matrix</em>) é calibração, não compressão: mede num corpus quais pesos mais deslocam a saída e distribui os bits conforme a sensibilidade. Quants agressivos com imatrix preservam mais tarefa no mesmo tamanho; sem corpus de calibração representativo do uso, o ganho inexiste.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Esquema</th><th>Bytes por parâmetro (valor de consulta, não medida)</th></tr></thead><tbody>' +
          '<tr><td>FP16</td><td>2,00</td></tr><tr><td>Q8_0</td><td>1,06</td></tr><tr><td>Q6_K</td><td>0,82</td></tr><tr><td>Q5_K_M</td><td>0,70</td></tr><tr><td>Q4_K_M</td><td>0,58</td></tr><tr><td>Q4_K_S</td><td>0,55</td></tr><tr><td>Q3_K_S</td><td>0,44</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>A perda não é uniforme: raciocínio quebra primeiro</h3>' +
          '<p>A pergunta que decide produto é quanto <em>cada tarefa</em> perde por quant, não quanto a média perde. Cadeia de raciocínio em várias etapas amplifica o erro de arredondamento passo a passo; reconhecimento de senso comum decide por token isolado e absorve o ruído. A média entre tarefas esconde exatamente a capacidade que um agente de código vende.</p>' +
          '<p>O estudo de quantização citado no legado sem autoria (SRC-M11-20) sugere, só como <strong>formato da curva</strong>, Q4 próximo de FP16 e Q3 com queda perceptível em raciocínio matemático e senso comum quase intacto. Esses números são exemplo variável, fonte a confirmar, e não evidência herdada: a folha L mede no hardware local com os evals próprios do M06, com a perplexidade como sinal auxiliar.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: '"Q3 basta porque a perplexidade subiu pouco"', html:
          '<p>Perplexidade mede surpresa média por token em texto corrido. Tarefa encadeada mede acerto após vinte decisões dependentes. Um quant pode manter a primeira quase intacta e destruir a segunda: cada passo desvia um pouco e o desvio se propaga. Defesa: rodar os evals próprios por categoria contra o quant específico (o Bloco 8 executa a matriz). A disciplina é a mesma de qualquer representação barata: ela é aceitável até a operação que amplifica o erro, e é nela que se testa, nunca na média.</p>' },
        { tipo: 'takeaway', html: 'O nome do quant declara <mark>tamanho e esquema</mark>; a <mark>qualidade por tarefa</mark> se mede, e o raciocínio cai primeiro.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Estimador de VRAM</h3>' +
          '<p>A referência <code>lab/orcamento_vram.py</code> soma pesos, KV e overhead e levanta <code>KeyError</code> em quant desconhecido. Implemente o núcleo e a pergunta que o Bloco 7 reaproveita: cabe ou não cabe.</p>' },
        { tipo: 'python', id: 'm11b3-python', titulo: 'Calcule pesos + KV + overhead', obrigatorio: false,
          enunciado: 'Complete <code>estimar</code> (devolve <code>(pesos_gb, kv_gb, overhead_gb, total_gb)</code>) e <code>cabe</code>. Use as duas fórmulas do texto, dividindo bytes por <code>1024**3</code>.',
          codigo: codigoVram, testes: testesVram,
          dica: 'pesos = <code>bilhoes * 1e9 * BYTES_POR_PARAM[quant] / 1024**3</code>; kv = <code>(2 * n_camadas * n_kv * dim_cabeca * ctx * batch * bytes_valor) / 1024**3</code>. <code>cabe</code> compara o quarto item de <code>estimar(...)</code> com <code>vram_gb</code>.',
          solucao: solucaoVram,
          tutorDepois: 'O controle negativo mostra o outro lado: um quant menor reduz só os pesos, e o KV continua igual. É por isso que reduzir o quant não resolve um estouro causado por contexto × concorrência.',
          callout: 'O estimador agora responde se um modelo cabe antes de qualquer download.' },
        { tipo: 'cenario', id: 'm11b3-cenario', titulo: 'O banco quer tudo local', obrigatorio: false,
          enunciado: 'Um banco só aceita o produto se o código nunca sair da rede dele. Você precisa escolher o modelo e prometer um prazo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O melhor modelo no seu eval interno é publicado com licença CC-BY-NC, e a demonstração já está marcada. O que você faz antes de prometer algo?', opcoes: [
              { texto: 'Prometo o modelo: os pesos são públicos, então posso usá-los.', vai: 'f-contrato', tom: 'ruim', consequencia: 'peso aberto não é código aberto; NC bloqueia produto pago.' },
              { texto: 'Abro o cartão no Hub e respondo as três perguntas por escrito.', vai: 'cartao', tom: 'ok', consequencia: 'a resposta (uso comercial negado) aparece antes da promessa.' },
              { texto: 'Pulo a licença e começo pela conta de VRAM, que é mais técnica.', vai: 'f-ordem', tom: 'ruim', consequencia: 'a checagem do cartão precede a VRAM: você dimensionou hardware para um modelo que não pode vender.' }
            ] },
            cartao: { texto: 'O cartão confirma NC. Há um segundo candidato com licença própria, com atribuição e teto de escala. O que decide?', opcoes: [
              { texto: 'Leio cada cláusula, registro no ADR com data e versão da licença e só então dimensiono o hardware.', vai: 'f-bom', tom: 'ok', consequencia: 'licença condicional vira decisão registrada e datada.' },
              { texto: 'Trato como Apache 2.0, porque a licença parece permissiva.', vai: 'f-contrato', tom: 'ruim', consequencia: 'a cláusula de escala ou de uso aceitável se propaga ao contrato do produto.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'A promessa ao banco tem licença lida, ADR datado e hardware calculado nessa ordem.' },
            'f-contrato': { bom: false, texto: 'Você assinou sobre um direito que não tinha, e o contrato caiu na revisão jurídica do cliente.' },
            'f-ordem': { bom: false, texto: 'O hardware foi dimensionado para um modelo vetado, e o trabalho foi refeito.' }
          },
          callout: 'Você leu a licença antes de calcular o hardware.' },
        { tipo: 'escolha', id: 'm11b3-esc-kv', titulo: 'Confira: o que explode',
          pergunta: 'Um modelo serve bem 1 usuário em contexto de 8k. O time passa para 4 simultâneos em 128k (131072). O que explode, e quanto?',
          opcoes: [
            { id: 'a', texto: 'Os pesos, que são recarregados para cada requisição.', correta: false, porque: 'os pesos são carregados uma vez e não mudam.' },
            { id: 'b', texto: 'O cache de KV: cresce linearmente com o contexto e com a concorrência (16 × 4 = 64 vezes aqui); os pesos não mudam.', correta: true, porque: 'memória = pesos + overhead + KV, e só o KV multiplica com ctx e batch. Estourar costuma ser silencioso: camadas vão para a CPU e a vazão despenca.' },
            { id: 'c', texto: 'O overhead, que dobra a cada usuário novo.', correta: false, porque: 'o overhead é folga fixa do servidor, de 1 a 2 GB.' },
            { id: 'd', texto: 'Nada: contexto maior só afeta a latência, não a memória.', correta: false, porque: 'contexto maior é memória de KV direta.' }
          ], tutorDepois: 'Use o contexto máximo real e a concorrência real.' },
        { tipo: 'escolha', id: 'm11b3-esc-nome', titulo: 'Confira: o nome Q4_K_M',
          pergunta: 'O que o nome <code>Q4_K_M</code> declara, e o que ele <em>não</em> declara?',
          opcoes: [
            { id: 'a', texto: 'Declara 4 bits e qualidade equivalente ao FP16 em qualquer tarefa.', correta: false, porque: 'o nome não declara qualidade.' },
            { id: 'b', texto: 'Declara quatro modelos num só arquivo, com mix médio.', correta: false, porque: 'o 4 é bits por peso.' },
            { id: 'c', texto: 'Declara 4 bits, esquema K (escalas em dois níveis por bloco) e mix médio; não declara qualidade por tarefa, que se mede (raciocínio encadeado quebra primeiro).', correta: true, porque: 'o nome é contrato de tamanho e esquema. Perplexidade estável não prova que a cadeia de raciocínio sobreviveu.' },
            { id: 'd', texto: 'Declara o contexto (Q) e o número de cabeças de atenção (4).', correta: false, porque: 'Q fixa quantização; o contexto é configuração do servidor.' }
          ], tutorDepois: 'Meça com os evals próprios, por categoria, no quant específico.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes do bloco: Llama 2 (SRC-M11-06, risco médio), llama.cpp (SRC-M11-15) e Ollama (SRC-M11-16), consulta de 14/09/2026, risco alto, revalidar em até 90 dias. SRC-M11-20 (estudo de quantização citado no legado sem autoria) fica como referência a confirmar, sem URL e sem número herdado. Cartão do modelo no Hub e texto da licença são ato jurídico por versão, risco alto, revalidar em até 90 dias.</p>' },
        { tipo: 'takeaway', html: 'Licença <mark>antes</mark> da VRAM, VRAM <mark>antes</mark> do download, e qualidade <mark>medida por tarefa</mark>.' }
      ] }
    ]
  });
})();
