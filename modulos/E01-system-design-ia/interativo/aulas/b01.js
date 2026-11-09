/* E01 · Bloco 1: o método de system design. Fonte: E01.html#b01. Preços do resumidor são hipotéticos (US$ 3 e US$ 15 por milhão de tokens). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasResumidor = function () {
    return [
      { id: 'premissas', nome: 'Premissas', descricao: 'O que foi assumido, por escrito', tom: 'dns', ms: 1, linhas: [
        L('info', '2.000 usuários ativos/dia, 2 resumos por usuário, uso em 8 h, pico 4x a média'),
        L('info', 'transcrição 12.000 tokens, resumo 600 tokens, TTFT 2 s, 60 tokens/s, folga de cota 30%'),
        L('info', 'preço hipotético: US$ 3/M de entrada, US$ 15/M de saída'),
        L('hint', 'cada premissa escrita é um ponto que o revisor pode atacar sem atacar a conta')] },
      { id: 'qps', nome: 'Volume e QPS', descricao: 'Requisições por dia, médio e pico', tom: 'tcp', ms: 2, linhas: [
        L('cmd', 'requisições/dia = 2.000 x 2'),
        L('out', '= 4.000'),
        L('cmd', 'QPS médio = 4.000 / (8 x 3.600)'),
        L('out', '= 0,14'),
        L('cmd', 'QPS de pico = 0,14 x 4'),
        L('out', '= 0,56')] },
      { id: 'little', nome: 'Latência e Little', descricao: 'Tempo em voo e conexões abertas', tom: 'tls', ms: 3, linhas: [
        L('cmd', 'latência = TTFT 2 s + 600 / 60 tok/s'),
        L('out', '= 12 s'),
        L('cmd', 'em voo (Little) = 0,56 x 12'),
        L('out', '= 6,7 conexões'),
        L('hint', 'menos de 1 QPS e 7 conexões: o volume é ridículo para a infraestrutura')] },
      { id: 'cota', nome: 'Cota', descricao: 'TPM de pico com folga', tom: 'request', ms: 3, linhas: [
        L('cmd', 'TPM de pico = 0,56 x 60 x 12.600 x 1,3'),
        L('out', '≈ 546 mil tokens por minuto')] },
      { id: 'custo', nome: 'Custo', descricao: 'Por requisição e por mês', tom: 'response', ms: 3, linhas: [
        L('cmd', 'custo/requisição = (12.000 x 3 + 600 x 15) / 1e6'),
        L('out', '= US$ 0,045'),
        L('cmd', 'custo/mês = 4.000 x 30 x 0,045'),
        L('out', '= US$ 5.400')] },
      { id: 'leitura', nome: 'Leitura', descricao: 'O que a conta decide', tom: 'ink', ms: 1, linhas: [
        L('in', 'gargalo = custo, não escala: os 12.000 tokens de entrada dominam o gasto'),
        L('in', 'prazo "até o fim do dia": a API de batch (bloco 3) cortaria o gasto à metade sem tocar na arquitetura')] }
    ];
  };

  var codigoEst = [
    'def qps_medio(requisicoes_dia, janela_h):',
    '    """QPS médio dentro da janela de uso (não sobre 24 h). ValueError se a janela não estiver entre 0 (exclusive) e 24 h."""',
    '    return 0.0',
    '',
    '',
    'def estimar(usuarios, req_por_usuario, janela_h, pico, tok_in, tok_out, ttft_s, tps, preco_in, preco_out, folga=0.3):',
    '    """Estimativa de Fermi do bloco 1. Preços em US$ por milhão de tokens."""',
    '    req_dia = usuarios * req_por_usuario',
    '    qps_pico = 0.0          # QPS médio x fator de pico',
    '    latencia = 0.0          # TTFT + saída / tokens por segundo',
    '    em_voo = 0.0            # lei de Little: λ x W',
    '    tpm = 0.0               # qps_pico x 60 x (entrada + saída) x (1 + folga)',
    '    custo_req = 0.0         # (entrada x preço_in + saída x preço_out) / 1e6',
    '    custo_mes = 0.0         # req_dia x 30 x custo_req',
    '    return {"req_dia": req_dia, "qps_pico": qps_pico, "latencia": latencia, "em_voo": em_voo,',
    '            "tpm": tpm, "custo_req": custo_req, "custo_mes": custo_mes}',
    ''].join('\n');
  var testesEst = [
    'def r():',
    '    return estimar(2000, 2, 8, 4, 12000, 600, 2, 60, 3, 15)',
    '',
    '',
    'def test_resumidor_caminho_feliz():',
    '    x = r()',
    '    assert x["req_dia"] == 4000',
    '    assert abs(x["qps_pico"] - 0.5556) < 0.001',
    '    assert x["latencia"] == 12',
    '    assert abs(x["em_voo"] - 6.67) < 0.01',
    '    assert abs(x["tpm"] - 546000) < 100',
    '    assert abs(x["custo_req"] - 0.045) < 1e-9',
    '    assert abs(x["custo_mes"] - 5400) < 0.01',
    '',
    '',
    'def test_borda_janela_de_10h():',
    '    assert abs(qps_medio(100000, 10) - 2.7778) < 0.001',
    '',
    '',
    'def test_falha_janela_invalida():',
    '    for j in (0, -1, 25):',
    '        try:',
    '            qps_medio(1000, j)',
    '        except ValueError:',
    '            continue',
    '        raise AssertionError("janela " + str(j) + " deveria levantar ValueError")',
    '',
    '',
    'def test_controle_negativo_divisao_ingenua_subestima():',
    '    ingenuo = 100000 / 86400',
    '    assert qps_medio(100000, 10) > 2 * ingenuo',
    ''].join('\n');
  var solucaoEst = [
    'def qps_medio(requisicoes_dia, janela_h):',
    '    if not 0 < janela_h <= 24:',
    '        raise ValueError("janela_h deve estar em (0, 24]")',
    '    return requisicoes_dia / (janela_h * 3600)',
    '',
    '',
    'def estimar(usuarios, req_por_usuario, janela_h, pico, tok_in, tok_out, ttft_s, tps, preco_in, preco_out, folga=0.3):',
    '    req_dia = usuarios * req_por_usuario',
    '    qps_pico = qps_medio(req_dia, janela_h) * pico',
    '    latencia = ttft_s + tok_out / tps',
    '    em_voo = qps_pico * latencia',
    '    tpm = qps_pico * 60 * (tok_in + tok_out) * (1 + folga)',
    '    custo_req = (tok_in * preco_in + tok_out * preco_out) / 1e6',
    '    custo_mes = req_dia * 30 * custo_req',
    '    return {"req_dia": req_dia, "qps_pico": qps_pico, "latencia": latencia, "em_voo": em_voo,',
    '            "tpm": tpm, "custo_req": custo_req, "custo_mes": custo_mes}',
    ''].join('\n');

  TrilhaAula.registrar({
    id: 'e01-b1',
    titulo: 'O método: requisitos, estimativa, API, dados, desenho e trade-offs',
    minutos: 40,
    resumo: 'Pular para o diagrama de caixas é o erro mais comum. O método tem sete passos em ordem, e a estimativa decide o que aprofundar.',
    objetivo: 'Conduzir os sete passos, escrever NFR com número e medição, estimar QPS, cota e custo com premissas à vista e usar o resultado para escolher onde aprofundar.',
    revisao: [
      { id: 'e01b1-ordem', pergunta: 'Qual é a ordem do método de system design?',
        opcoes: [
          opc('a', 'Requisitos, estimativa, API, dados, desenho de alto nível, gargalos, trade-offs', true, 'cada passo fornece o insumo do seguinte; o método é um ciclo, e uma estimativa que contradiz um requisito obriga a renegociá-lo.'),
          opc('b', 'Desenho de alto nível, escolha de tecnologia, estimativa, requisitos', false, 'as caixas parecem arquitetura, mas ainda não têm nada que as justifique.'),
          opc('c', 'API, dados, desenho, e só então requisitos', false, 'sem requisitos com número não há como julgar nenhum desenho.')] },
      { id: 'e01b1-nfr', pergunta: 'Qual destes é um requisito não funcional bem escrito?',
        opcoes: [
          opc('a', 'TTFT p95 abaixo de 1,5 s, medido no gateway', true, 'um NFR só vale com número e forma de medição.'),
          opc('b', 'O sistema deve ser rápido', false, '"rápido" não é requisito: ninguém consegue reprovar ou aprovar.'),
          opc('c', 'O sistema deve usar streaming', false, 'é uma escolha de solução, não uma qualidade a atingir.')] },
      { id: 'e01b1-qps', pergunta: 'Produto B2B com janela de uso de 10 h e 100.000 requisições por dia. Qual QPS médio usar?',
        opcoes: [
          opc('a', '≈ 2,78 (100.000 ÷ 36.000 s): o uso se concentra na janela', true, 'dividir por 24 h subestima o QPS médio em 2,4x antes do fator de pico.'),
          opc('b', '≈ 1,16 (100.000 ÷ 86.400 s)', false, 'estima o sistema de um produto 24x7 que não é o seu.'),
          opc('c', '≈ 27,8, que já inclui o pico', false, 'confunde média com pico.')] },
      { id: 'e01b1-gargalo', pergunta: 'A conta do resumidor deu menos de 1 QPS, 7 conexões e US$ 5.400 por mês. Onde aprofundar?',
        opcoes: [
          opc('a', 'Custo: o prazo é "até o fim do dia", então batch e redução de entrada atacam o gargalo real', true, 'com menos de 1 QPS não há problema de escala; o dinheiro está nos 12.000 tokens de entrada.'),
          opc('b', 'Escala horizontal: filas, sharding e autoscaling', false, 'complexidade sem número é o erro clássico que reprova um design.'),
          opc('c', 'Latência entre regiões', false, 'nada na estimativa aponta para isso.')] },
      { id: 'e01b1-armadilha', pergunta: 'Qual é a armadilha de estimar um sistema com LLM com a experiência de CRUD?',
        opcoes: [
          opc('a', 'Esquecer que a unidade de consumo mudou: a requisição custa centavos, dura segundos, ocupa conexão e consome cota em tokens', true, 'dimensionar "pelo QPS" acerta o tráfego e erra a conta e o limite por duas ordens de grandeza.'),
          opc('b', 'Usar números redondos na estimativa', false, 'números redondos servem: a estimativa de Fermi tolera erro de ±2x.'),
          opc('c', 'Escrever as premissas', false, 'escrever as premissas é a disciplina que torna a estimativa atacável.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Um time recebe o pedido "coloque um assistente com IA no portal de suporte". Três semanas depois há um protótipo que impressiona. No primeiro mês de produção aparecem três contas que ninguém fez: a cota do provedor estoura às 10h porque todos chegam juntos, a fatura é dez vezes a prevista e as respostas erradas só são descobertas por reclamação de cliente. Nenhuma exigia talento raro. Exigia um método aplicado <em>antes</em> do código.</p>' +
          '<p><strong>System design</strong> é a disciplina de decompor um problema aberto em requisitos, estimativas, interfaces, dados e componentes, e de registrar por que cada escolha foi feita diante das alternativas. Não existe desenho correto fora de um conjunto de requisitos; existe desenho cujas escolhas se sustentam contra os números e as restrições declarados.</p>' +
          '<h3>Os sete passos, em ordem</h3>' +
          '<p>A ordem importa porque cada passo fornece o insumo do seguinte. O método é um ciclo: cada gargalo ou número surpreendente reabre requisitos e estimativas.</p>' +
          '<ol><li><strong>Requisitos</strong> funcionais e não funcionais.</li><li><strong>Estimativa</strong> de QPS, tokens e custo.</li><li><strong>API</strong>: contratos e erros.</li><li><strong>Dados</strong>: entidades e chaves.</li><li><strong>Desenho de alto nível</strong>: caixas e fluxo.</li><li><strong>Gargalos</strong>: aprofundar dois ou três.</li><li><strong>Trade-offs</strong>: registrar o que foi cedido.</li></ol>' },
        { tipo: 'abas', rotulo: 'Passo a passo', itens: [
          { rotulo: '1 · Requisitos', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Requisitos funcionais</strong> dizem o que o sistema faz ("responde perguntas citando a fonte"). <strong>Requisitos não funcionais</strong> (NFR) dizem com que qualidade: latência, disponibilidade, durabilidade, segurança, custo, qualidade da resposta. São os NFR que determinam a arquitetura. Um NFR só vale se tiver número e forma de medição: "rápido" não é requisito; "TTFT p95 abaixo de 1,5 s medido no gateway" é.</p>' +
              '<p>Em sistemas com IA, acrescente quatro perguntas que o desenho clássico não faz:</p>' +
              '<ul><li>Qual o custo máximo por requisição e por mês?</li><li>Que taxa de resposta errada é tolerável e como será medida?</li><li>Que dados podem sair do perímetro para o provedor do modelo?</li><li>O que o sistema faz quando o modelo está lento, indisponível ou incerto? Isso define o comportamento degradado, que é parte do produto.</li></ul>' }] },
          { rotulo: '2 · Estimativa', blocos: [
            { tipo: 'texto', html:
              '<p>Estimar não é prever; é descobrir se o problema cabe em uma máquina ou em cem, em R$ 500 ou em R$ 50 mil por mês, antes de investir. A técnica é a de Fermi: decomponha em fatores que você consegue chutar com ±2x de erro e multiplique.</p>' +
              '<ul><li><strong>Volume:</strong> usuários ativos x ações por dia = requisições por dia.</li>' +
              '<li><strong>Taxa média e de pico:</strong> requisições por dia ÷ segundos da janela de uso = <strong>QPS</strong> médio (queries per second); x fator de pico = QPS de pico. Um produto B2B com janela de 10 h tem QPS médio 2,4 vezes o de uma divisão ingênua por 24 h.</li>' +
              '<li><strong>Tamanho:</strong> tokens de entrada e de saída por requisição, bytes por registro, vetores por documento.</li>' +
              '<li><strong>Tempo em voo:</strong> latência até o último token, que alimenta a lei de Little (bloco 2).</li>' +
              '<li><strong>Cota:</strong> tokens por minuto (TPM) e requisições por minuto (RPM) que o provedor precisa liberar.</li>' +
              '<li><strong>Armazenamento:</strong> bytes por item x itens x fator de réplica e de índice.</li>' +
              '<li><strong>Custo por mês:</strong> requisições x custo por requisição, antes e depois das otimizações.</li></ul>' +
              '<p>Duas disciplinas evitam estimativas inúteis. Escreva cada premissa (a janela de 10 h, o fator de pico 3, os 3.500 tokens de entrada) para que o revisor ataque a premissa, não o resultado. E calcule intervalos quando a incerteza é grande: se o fator de pico pode ser 2 ou 5, o QPS de pico varia 2,5 vezes, e isso muda o plano de cota mais do que qualquer escolha de biblioteca.</p>' },
            { tipo: 'callout', tom: 'info', titulo: 'Números que valem decorar', html:
              '<p>Um dia tem 86.400 s (≈ 10<sup>5</sup>); um mês de 30 dias tem 2,6 milhões de s; 1 milhão de requisições por dia dá 11,6 QPS médio em 24 h. Um float de 32 bits ocupa 4 bytes, então um vetor de 1.024 dimensões ocupa 4 KB. Um token em português equivale a algo como 3 a 4 caracteres; use 1 página de texto ≈ 600 a 900 tokens como ordem de grandeza e meça o seu tokenizador. Latências típicas: memória ≈ 100 ns, SSD ≈ 100 µs, rede no mesmo datacenter ≈ 0,5 ms, entre regiões ≈ 50 a 150 ms, primeira palavra de um LLM ≈ 0,3 a 2 s. Os valores exatos mudam com a geração do hardware; a hierarquia de ordens de grandeza, não.</p>' }] },
          { rotulo: '3 e 4 · API e dados', blocos: [
            { tipo: 'texto', html:
              '<p><strong>API.</strong> Defina os contratos antes dos componentes: recursos, operações, entrada e saída, erros, paginação, idempotência, autenticação. Em sistemas com LLM, a API decide três coisas que a clássica ignora: se a resposta é <strong>síncrona, em streaming ou assíncrona com polling</strong> (o tempo de geração decide); como o cliente recebe <strong>erros parciais</strong> (o stream pode falhar na metade); e como expor <strong>custo e confiança</strong> (tokens consumidos, citações usadas). Operações com efeito externo exigem chave de idempotência desde o primeiro contrato; acrescentá-la depois quebra clientes.</p>' +
              '<p><strong>Modelo de dados.</strong> Liste entidades, relações, chaves de partição e padrões de acesso. O que cresce sem limite (mensagens, traces, eventos de auditoria) pede retenção e particionamento desde o início. Em IA, dois itens ganham tabela própria: <strong>o que foi enviado ao modelo e o que voltou</strong> (auditoria, reprodução, avaliação) e <strong>versões</strong> de prompt, modelo, índice e corpus, porque sem elas nenhuma regressão de qualidade é explicável.</p>' }] },
          { rotulo: '5 a 7 · Caixas, gargalos, trade-offs', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Alto nível.</strong> Agora, sim, as caixas: clientes, borda, serviços, filas, armazenamento, provedores externos. Percorra uma requisição inteira, do clique à resposta, e depois o caminho de falha: o que acontece se cada caixa estiver lenta ou fora. Um desenho que só mostra o caminho feliz é um esboço.</p>' +
              '<p><strong>Gargalos.</strong> Escolha dois ou três pontos que decidem o projeto e desça neles: onde a cota do provedor é o limite, onde o custo domina, onde a consistência importa, onde um componente é ponto único de falha. As estimativas do passo 2 indicam quais são. Aprofundar tudo por igual é sinal de que a estimativa não foi feita.</p>' +
              '<p><strong>Trade-offs.</strong> Toda escolha cede algo. Registre o que foi cedido: "cache semântico reduz custo em 20% e introduz risco de resposta errada; mitigamos com limiar alto, escopo por tenant e amostragem de acertos para auditoria". O leitor deve conseguir discordar com precisão.</p>' }] }
        ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          '<p>Estimar com a experiência de sistemas clássicos e esquecer que a <strong>unidade de consumo mudou</strong>. Em um CRUD, a requisição custa microcentavos e o limite é CPU ou banco. Num sistema com LLM, uma requisição custa centavos, dura segundos, ocupa uma conexão aberta e consome uma cota medida em tokens. O sênior que dimensiona "pelo QPS" acerta a ordem de grandeza do tráfego e erra por duas ordens a conta e o limite.</p>' },
        { tipo: 'takeaway', html: 'Primeiro <mark>requisitos com número</mark> e <mark>estimativa</mark>, depois as caixas; o diagrama sem conta é um esboço.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Exemplo trabalhado: resumidor de reuniões</h3>' +
          '<p>Pedido: "resumir a transcrição de cada reunião e enviar ação por e-mail", para 2.000 usuários. Perguntas de esclarecimento: usuário ativo é diário? Quantas reuniões por dia? O resumo precisa estar pronto antes da reunião seguinte (minutos) ou até o fim do dia? Respostas assumidas: 2.000 usuários ativos por dia, 2 resumos por usuário, uso em 8 h, pico 4 vezes a média, transcrição de 12.000 tokens, resumo de 600 tokens, modelo grande ao preço hipotético de US$ 3 por milhão de tokens de entrada e US$ 15 por milhão de saída. Os preços do módulo são hipotéticos e redondos; não representam nenhum fornecedor.</p>' +
          '<p>Rode a conta etapa por etapa. Antes de apertar Enter, preveja o que ela vai revelar.</p>' },
        { tipo: 'rode', id: 'met-rode', titulo: 'A conta de três minutos', enunciado: 'Clique em Enter e depois em cada etapa para ver a aritmética. Qualquer pessoa deve conseguir refazê-la.',
          prefixo: '$', entrada: 'python estimar_resumidor.py', unidade: 's', terminalTitulo: 'estimativa do resumidor (exemplo ilustrativo)', etapas: etapasResumidor(),
          prever: { pergunta: 'Com 2.000 usuários e 2 resumos por dia, onde você espera que o projeto doa mais?', opcoes: [
            { id: 'a', texto: 'Na escala: filas, sharding e autoscaling.', correta: false, porque: 'menos de 1 QPS e 7 conexões simultâneas não pedem nada disso.' },
            { id: 'b', texto: 'No custo: os 12.000 tokens de entrada dominam a fatura.', correta: true, porque: 'US$ 5.400 por mês, quase todo da entrada; o volume é ridículo para a infraestrutura e relevante para o orçamento.' },
            { id: 'c', texto: 'Na latência: 12 s por resumo.', correta: false, porque: 'o prazo é "até o fim do dia"; ninguém está olhando para a tela.' }
          ] },
          tutorAntes: 'Aperte Enter e depois clique nas etapas. A leitura final diz o que a conta decidiu.',
          tutorDepois: 'Em três minutos de conta, o desenho deixou de ser "como escalar" e virou "como não gastar demais". Essa é a função da estimativa.',
          callout: 'A estimativa mostrou que o gargalo era custo, e o prazo folgado abriu a porta do batch.' },
        { tipo: 'texto', html:
          '<h3>O mesmo método num design doc e numa entrevista</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Aspecto</th><th>Design doc real</th><th>Entrevista de system design</th></tr></thead><tbody>' +
          '<tr><td>Tempo</td><td>dias; revisão assíncrona e iterativa</td><td>35 a 45 minutos, síncrono</td></tr>' +
          '<tr><td>Requisitos</td><td>vêm de usuários, dados e contratos; você investiga</td><td>vêm do entrevistador; você pergunta e fixa premissas em voz alta</td></tr>' +
          '<tr><td>Estimativa</td><td>com dados reais de tráfego, medições e tabela de preços atual</td><td>com números redondos, 2 a 3 minutos, para escolher o que aprofundar</td></tr>' +
          '<tr><td>Profundidade</td><td>cobre migração, operação, segurança, plano de rollback e prazos</td><td>cobre desenho e dois gargalos; operação em poucas frases</td></tr>' +
          '<tr><td>Alternativas</td><td>documento escrito com critérios, custos e quem decide</td><td>menciona uma ou duas e explica a escolha</td></tr>' +
          '<tr><td>Sucesso</td><td>decisão tomada, risco registrado, trabalho que cabe em semanas</td><td>raciocínio estruturado, trade-offs claros, reação boa a objeções</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O método é o mesmo; muda a fonte dos números e o orçamento de tempo. Quem aprendeu só a versão de entrevista tende a desenhar sem dados; quem só escreve docs tende a perder o ritmo de pensar em voz alta. O bloco 7 trata da escrita e da defesa.</p>' },
        { tipo: 'takeaway', html: 'A estimativa existe para decidir <mark>o que aprofundar</mark>: aqui, <mark>custo</mark> e não escala.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Decisões do método</h3>' +
          '<ul><li><strong>Quanto esclarecer antes de desenhar:</strong> o suficiente para que a próxima decisão mude conforme a resposta. Pergunta cuja resposta não altera o desenho é adiável.</li>' +
          '<li><strong>Precisão da estimativa:</strong> pare quando o resultado deixar de mudar a decisão. Entre US$ 5 mil e US$ 7 mil por mês a arquitetura é a mesma; entre US$ 5 mil e US$ 500 mil não é.</li>' +
          '<li><strong>Largura contra profundidade:</strong> desenhe largo uma vez e desça só onde os números doem.</li></ul>' },
        { tipo: 'ordene', id: 'met-ordene', titulo: 'Ponha os sete passos na ordem', enunciado: 'Use os botões para ordenar do primeiro ao último passo. A estimativa vem antes do diagrama.',
          itens: [
            { id: 'dados', texto: 'Modelo de dados' },
            { id: 'trade', texto: 'Trade-offs explícitos' },
            { id: 'est', texto: 'Estimativas de ordem de grandeza' },
            { id: 'gargalos', texto: 'Aprofundamento nos gargalos' },
            { id: 'req', texto: 'Requisitos funcionais e não funcionais' },
            { id: 'alto', texto: 'Desenho de alto nível' },
            { id: 'api', texto: 'API' }
          ],
          solucao: ['req', 'est', 'api', 'dados', 'alto', 'gargalos', 'trade'],
          dica: 'A estimativa fornece os números que justificam as caixas; o aprofundamento só vem depois do desenho.',
          callout: 'Sete passos, nessa ordem, e o ciclo de volta aos requisitos quando um número surpreende.' },
        { tipo: 'cenario', id: 'met-cenario', titulo: 'O pedido "coloque IA no portal"', obrigatorio: false,
          enunciado: 'Reunião de kickoff. O pedido chega sem números e o time quer abrir o editor de diagramas.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A diretora de produto diz: "coloque um assistente com IA no portal de suporte". O que você faz primeiro?', opcoes: [
              { texto: 'Abrir o diagrama e propor gateway, fila, banco vetorial e cluster de busca.', vai: 'f-caixas', tom: 'ruim', consequencia: 'as caixas parecem arquitetura, mas nada as justifica ainda.' },
              { texto: 'Perguntar as quatro coisas do LLM (custo máximo, taxa de erro tolerável, dados que saem do perímetro, comportamento degradado) e fixar premissas com número.', vai: 'estima', tom: 'ok', consequencia: 'as respostas mudam o desenho; as que não mudam, você adia.' },
              { texto: 'Escolher o provedor e o framework de orquestração e começar um protótipo.', vai: 'f-proto', tom: 'ruim', consequencia: 'o protótipo impressiona na demo e esconde as três contas que ninguém fez.' }
            ] },
            estima: { texto: 'Premissas fixadas: 10 mil usuários, 5 perguntas por dia, janela de 10 h, pico 3x. Você calcula e dá menos de 5 QPS de pico, 3 GB de índice e US$ 23 mil por mês. Onde aprofunda?', opcoes: [
              { texto: 'Em escala: sharding, cluster dedicado e autoscaling, porque o sucesso futuro exige.', vai: 'f-escala', tom: 'ruim', consequencia: 'o tráfego cabe em um processo; a complexidade gasta a credibilidade que você vai precisar para discutir custo.' },
              { texto: 'Em custo, isolamento e degradação: onde os números doem.', vai: 'tradeoff', tom: 'ok', consequencia: 'a estimativa apontou o caminho; o esforço vai para o que decide o projeto.' }
            ] },
            tradeoff: { texto: 'Você propõe cache semântico para reduzir custo em 20%. Como registra?', opcoes: [
              { texto: 'Como ganho líquido: economiza 20%.', vai: 'f-cego', tom: 'ruim', consequencia: 'sem o custo da escolha, o revisor não consegue discordar com precisão.' },
              { texto: 'Com o que se cede: risco de resposta errada, mitigado por limiar alto, escopo por tenant e amostragem de acertos.', vai: 'f-bom', tom: 'ok', consequencia: 'o leitor pode discordar do limiar, não do raciocínio.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Requisitos com número, estimativa com premissas à vista, aprofundamento onde dói e trade-off registrado. O design doc aguenta a revisão.' },
            'f-caixas': { bom: false, texto: 'Doze caixas depois, ninguém sabe se o problema é escala, custo ou qualidade. O diagrama virou o requisito.' },
            'f-proto': { bom: false, texto: 'A demo impressionou. No primeiro mês: cota estourada às 10h, fatura dez vezes a prevista e erros descobertos por reclamação.' },
            'f-escala': { bom: false, texto: 'A infraestrutura aguentaria cem vezes o tráfego, e a fatura de modelo continuou sendo o problema que ninguém tinha desenhado.' },
            'f-cego': { bom: false, texto: 'O cache entrou como vitória, vazou resposta de outro escopo e ninguém tinha registrado o risco.' }
          },
          callout: 'Você esclareceu antes de desenhar, aprofundou onde os números doem e registrou o que cedeu.' },
        { tipo: 'escreva', id: 'met-escreva', titulo: 'Troque "rápido e barato" por NFR', obrigatorio: false,
          enunciado: 'O dono do produto pediu um assistente de suporte "rápido, barato e que não erre". Reescreva em três a cinco requisitos não funcionais com número e forma de medição, e inclua o que o sistema faz quando o modelo está indisponível.',
          placeholder: 'Ex.: TTFT p95 ...; custo médio por pergunta ...; fundamentação ...; quando o provedor cair ...',
          rubrica: [
            'Cada requisito tem um <strong>número</strong> (limite) e uma <strong>forma de medição</strong> (onde e sobre o quê).',
            'Há um requisito de <strong>custo</strong> por requisição ou por mês, com alerta.',
            'Há um requisito de <strong>qualidade</strong> da resposta medido em amostra, e não "não errar".',
            'O <strong>comportamento degradado</strong> está descrito (o que o usuário recebe quando o modelo falha).'],
          modelo: '<ul><li>TTFT p95 ≤ 1,5 s e resposta completa p95 ≤ 10 s, medidos no gateway.</li><li>Custo médio ≤ US$ 0,02 por pergunta e orçamento mensal com alerta em 80%.</li><li>≥ 90% das respostas fundamentadas em fonte citada, medido em amostra julgada de tráfego real; abstenção quando a evidência é insuficiente.</li><li>Disponibilidade de 99,5% em 30 dias, contando como disponível a resposta degradada (busca de artigos sem geração).</li></ul>' },
        { tipo: 'python', id: 'met-python', titulo: 'Escreva a calculadora de Fermi', obrigatorio: false,
          enunciado: 'Implemente <code>qps_medio</code> (divide pela janela de uso, e não por 24 h; levanta <code>ValueError</code> fora de 0 a 24 h) e complete <code>estimar</code> com QPS de pico, latência, requisições em voo (lei de Little), TPM com folga e custo. O teste usa o resumidor de reuniões.',
          codigo: codigoEst, testes: testesEst,
          dica: '<code>qps_medio = req_dia / (janela_h * 3600)</code>; latência = <code>ttft_s + tok_out / tps</code>; em voo = <code>qps_pico * latencia</code>; TPM = <code>qps_pico * 60 * (tok_in + tok_out) * (1 + folga)</code>.',
          solucao: solucaoEst,
          tutorDepois: 'O teste de controle negativo mostra o que a divisão por 24 h faz: subestima o QPS em mais de 2x.',
          callout: 'A calculadora reproduz o resumidor: 0,56 QPS de pico, 546 mil TPM e US$ 5.400 por mês.' },
        { tipo: 'takeaway', html: 'Esclareça <mark>o que muda o desenho</mark>, estime <mark>até a decisão parar de mudar</mark> e registre <mark>o que cedeu</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Começar pelo diagrama ou pela tecnologia ("vamos usar Kafka e Kubernetes") e só depois procurar o problema.</li>' +
          '<li>NFR sem número, e número sem método de medição.</li>' +
          '<li>Tratar o provedor de LLM como infinito: ele tem cota, latência e preço, e os três entram na conta.</li>' +
          '<li>Esquecer o pico: a média esconde o instante em que o sistema falha.</li></ul>' },
        { tipo: 'escolha', id: 'met-escolha-qps', titulo: 'Confira: o QPS da janela',
          pergunta: 'Produto B2B com janela de uso de 10 h e 100.000 requisições por dia. Dividir por 86.400 s dá ≈ 1,16 QPS. Qual é o QPS médio que o dimensionamento deve usar, antes do fator de pico?',
          opcoes: [
            { id: 'a', texto: '≈ 1,16 QPS: o dia tem 86.400 s e ponto final.', correta: false, porque: 'estima o sistema de um produto 24x7 que não é o seu.' },
            { id: 'b', texto: '≈ 0,28 QPS: divide-se também pelo número de réplicas.', correta: false, porque: 'réplicas não entram no QPS médio de entrada.' },
            { id: 'c', texto: '≈ 2,78 QPS (100.000 ÷ 36.000 s): o uso se concentra na janela, 2,4x a divisão ingênua.', correta: true, porque: 'o tráfego real só existe dentro da janela de uso, então o divisor é 10 x 3.600 s.' },
            { id: 'd', texto: '≈ 27,8 QPS: já inclui o pico.', correta: false, porque: 'confunde média com pico.' }
          ], tutorDepois: 'Janela de uso é premissa; escreva-a.' },
        { tipo: 'escolha', id: 'met-escolha-gargalo', titulo: 'Confira: para onde vai o aprofundamento',
          pergunta: 'No resumidor, a conta deu menos de 1 QPS, 7 conexões simultâneas e US$ 5.400 por mês, dominados pelos 12.000 tokens de entrada. Para onde vai o aprofundamento do design?',
          opcoes: [
            { id: 'a', texto: 'Escala horizontal: filas, sharding e autoscaling.', correta: false, porque: 'complexidade sem número é o erro clássico que reprova um design.' },
            { id: 'b', texto: 'Custo: o prazo é "até o fim do dia", então batch e redução de entrada atacam o gargalo real.', correta: true, porque: 'o dinheiro está nos tokens de entrada, e o prazo folgado permite batch (cerca de metade do preço) sem tocar na arquitetura.' },
            { id: 'c', texto: 'Latência de rede entre regiões.', correta: false, porque: 'nada na estimativa aponta para isso.' },
            { id: 'd', texto: 'Troca do framework de orquestração.', correta: false, porque: 'não ataca nem custo nem escala.' }
          ], tutorDepois: 'A estimativa existe para decidir o que aprofundar.' },
        { tipo: 'takeaway', html: 'Requisitos, estimativa, API, dados, caixas, <mark>dois gargalos</mark> e <mark>trade-offs</mark>: nessa ordem, e a conta manda.' }
      ] }
    ]
  });
})();
