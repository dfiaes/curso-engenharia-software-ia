/* M05 · Bloco 1: o contrato da chamada (tokens, janela, amostragem). Fonte: M05.html#b01. Números de preço conferidos na documentação oficial em agosto de 2026 (Sonnet 5: US$ 2 por milhão de tokens de entrada, retrato ago/2026). Provedor e modelo, aqui, são sempre fakes determinísticos. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var PY = function (a) { return a.join('\n') + '\n'; };

  var TEXTO = 'Toda decisão de engenharia deste módulo (custo, latência, cache, escolha de modelo) se reduz a tokens. Estimar antes de enviar evita surpresa na fatura.';

  var etapasEstimativa = function () {
    return [
      { id: 'entrada', nome: 'Texto', descricao: '152 caracteres em português', tom: 'dns', ms: 152, linhas: [
        L('cmd', 'python estimar.py --tipo pt --texto "Toda decisão de engenharia deste módulo ... evita surpresa na fatura."'),
        L('info', 'texto: 152 caracteres; tipo: pt (regra de bolso: 3 a 3,5 caracteres por token)')] },
      { id: 'pt', nome: 'Português', descricao: 'Faixa e ponto médio', tom: 'tcp', ms: 48, linhas: [
        L('out', 'pt: faixa 44 a 51 tokens; ponto médio 48'),
        L('hint', 'a faixa existe porque a razão caracteres por token varia com o texto: acentos e flexões custam mais')] },
      { id: 'en', nome: 'Inglês', descricao: 'Mesmo conteúdo, menos tokens', tom: 'tls', ms: 38, linhas: [
        L('out', 'en: faixa 37 a 40 tokens; ponto médio 38 (regra de bolso: 4 caracteres por token)'),
        L('hint', 'a ordem de grandeza do bloco: o mesmo conteúdo em português custa cerca de 20% mais tokens')] },
      { id: 'codigo', nome: 'Código', descricao: 'Símbolos e identificadores fragmentam', tom: 'request', ms: 52, linhas: [
        L('out', 'code: faixa 48 a 55 tokens; ponto médio 52 (regra de bolso: cerca de 3 caracteres por token)'),
        L('hint', 'indentação, símbolos e identificadores longos fragmentam em mais tokens')] },
      { id: 'custo', nome: 'Custo de entrada', descricao: 'Só o input, só uma chamada', tom: 'response', ms: 1, linhas: [
        L('out', 'entrada pt: 48 tokens x US$ 2 por milhão = US$ 0,000096 por envio (preço do retrato ago/2026)'),
        L('hint', 'o output é cobrado à parte, e mais caro: a estimativa de entrada é só metade da conta')] },
      { id: 'exato', nome: 'Contagem exata', descricao: 'Vem do campo usage', tom: 'ink', ms: 1, linhas: [
        L('in', 'estimativa serve para orçar antes de enviar; o número oficial é resposta.usage.input_tokens e output_tokens'),
        L('hint', 'para ver tokens de verdade, cole um texto seu num visualizador de tokenização (tiktokenizer.vercel.app)')] }
    ];
  };

  var etapasChamada = function () {
    return [
      { id: 'montar', nome: 'Montar a chamada', descricao: 'Modelo pinado, teto de saída, temperature', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python chamar.py --modelo modelo-fake-2026-08-01 --max-tokens 400 --temperature 0'),
        L('info', 'modelo pinado com o identificador completo; max_tokens é o teto da SAÍDA, não da janela')] },
      { id: 'chamar', nome: 'Chamar o modelo', descricao: 'Modelo fake, determinístico', tom: 'tcp', ms: 1, linhas: [
        L('out', 'usage: input_tokens=812 output_tokens=187'),
        L('out', 'stop_reason: end_turn')] },
      { id: 'parada', nome: 'Tratar stop_reason', descricao: 'Motivo da parada', tom: 'tls', ms: 1, linhas: [
        L('out', 'end_turn: o modelo terminou sozinho; a saída está completa'),
        L('hint', 'os valores possíveis: end_turn, max_tokens, tool_use, stop_sequence')] },
      { id: 'validar', nome: 'Validar a saída', descricao: 'JSON inteiro e estável', tom: 'request', ms: 1, linhas: [
        L('out', 'json.loads ok: {"risco": "alto", "linha_inicial": 12}')] },
      { id: 'repetir', nome: 'Repetir a chamada', descricao: 'Mesma entrada, mesma versão', tom: 'response', ms: 1, linhas: [
        L('out', 'segunda chamada: saída igual à primeira'),
        L('hint', 'alta reprodutibilidade com temperature 0, não garantia: por isso o teste não compara string exata')] }
    ];
  };

  var codigoPy = PY([
    'import math',
    '',
    'RAZAO = {"pt": (3.5, 3.0), "en": (4.2, 3.8), "code": (3.2, 2.8)}  # caracteres por token (limite baixo, alto)',
    '',
    '',
    'def estimar_tokens(texto, tipo):',
    '    """Devolve (minimo, maximo) de tokens estimados. Estimativa, nao contagem exata."""',
    '    razao_min, razao_max = RAZAO[tipo]',
    '    # 1. minimo: tamanho / razao_min; maximo: tamanho / razao_max, ambos arredondados para cima',
    '    return 0, 0',
    '',
    '',
    'def entrada_por_tarefa(tokens_contexto, turnos):',
    '    """Sem cache, o contexto fixo e reenviado como entrada em TODO turno."""',
    '    # 2. quantos tokens de entrada a tarefa inteira consome?',
    '    return 0',
    '',
    '',
    'def cabe_na_janela(janela, entrada, max_tokens):',
    '    """Tudo conta na janela: entrada + resposta que sera gerada."""',
    '    # 3. devolva (cabe, sobra); sobra pode ficar negativa',
    '    return False, 0',
    '',
    '',
    'print(estimar_tokens("Estimar antes de enviar evita surpresa.", "pt"))'
  ]);
  var solucaoPy = PY([
    'import math',
    '',
    'RAZAO = {"pt": (3.5, 3.0), "en": (4.2, 3.8), "code": (3.2, 2.8)}  # caracteres por token (limite baixo, alto)',
    '',
    '',
    'def estimar_tokens(texto, tipo):',
    '    """Devolve (minimo, maximo) de tokens estimados. Estimativa, nao contagem exata."""',
    '    razao_min, razao_max = RAZAO[tipo]',
    '    n = len(texto)',
    '    return math.ceil(n / razao_min), math.ceil(n / razao_max)',
    '',
    '',
    'def entrada_por_tarefa(tokens_contexto, turnos):',
    '    """Sem cache, o contexto fixo e reenviado como entrada em TODO turno."""',
    '    return tokens_contexto * turnos',
    '',
    '',
    'def cabe_na_janela(janela, entrada, max_tokens):',
    '    """Tudo conta na janela: entrada + resposta que sera gerada."""',
    '    sobra = janela - (entrada + max_tokens)',
    '    return sobra >= 0, sobra',
    '',
    '',
    'print(estimar_tokens("Estimar antes de enviar evita surpresa.", "pt"))'
  ]);
  var testesPy = PY([
    'def test_estimativa_pt():',
    '    texto = "a" * 152',
    '    assert estimar_tokens(texto, "pt") == (44, 51)',
    '',
    '',
    'def test_ingles_custa_menos_que_portugues():',
    '    texto = "a" * 152',
    '    assert estimar_tokens(texto, "en") == (37, 40)',
    '    assert estimar_tokens(texto, "en")[1] < estimar_tokens(texto, "pt")[0]',
    '',
    '',
    'def test_texto_vazio():',
    '    assert estimar_tokens("", "code") == (0, 0)',
    '',
    '',
    'def test_agente_de_20_turnos():',
    '    assert entrada_por_tarefa(50_000, 20) == 1_000_000',
    '',
    '',
    'def test_janela_conta_a_resposta():',
    '    assert cabe_na_janela(1000, 900, 100) == (True, 0)',
    '    assert cabe_na_janela(1000, 900, 101) == (False, -1)',
    '',
    '',
    'def test_controle_negativo_tipo_desconhecido():',
    '    try:',
    '        estimar_tokens("x", "klingon")',
    '    except KeyError:',
    '        return',
    '    assert False, "tipo desconhecido deveria falhar"'
  ]);

  TrilhaAula.registrar({
    id: 'm05-b1',
    titulo: 'O contrato da chamada: tokens, janela, amostragem',
    minutos: 30,
    resumo: 'Tokens são a unidade de cobrança, de limite e de tempo. Os parâmetros de amostragem decidem se a mesma pergunta devolve a mesma resposta, e isso decide se você consegue testar o sistema.',
    objetivo: 'Estimar tokens antes de enviar, orçar a janela de contexto contando a resposta, escolher temperature ou top_p (nunca os dois) e tratar stop_reason e a versão do modelo como parte do contrato.',
    revisao: [
      { id: 'm05b1-tres-custos', pergunta: 'Um agente faz 20 turnos reenviando um documento de 50 mil tokens, sem cache. A janela comporta, então "não é problema". Qual a resposta mais completa?',
        opcoes: [
          opc('a', 'Há três custos: dinheiro (cerca de 1 milhão de tokens de entrada por tarefa), latência (o TTFT cresce com a entrada) e atenção (context rot)', true, 'janela grande é folga de engenharia, não licença. As três palavras do bloco são custo, latência, atenção.'),
          opc('b', 'Se cabe na janela, o custo é irrelevante', false, 'o input é pago em toda chamada; 50 mil tokens x 20 turnos são 1 milhão de tokens por tarefa.'),
          opc('c', 'Só a latência piora; o custo é fixo por chamada', false, 'o custo de entrada cresce com o tamanho do prompt em toda chamada.')] },
      { id: 'm05b1-temp0', pergunta: 'Seu teste compara a saída exata de uma chamada com temperature=0 e falha esporadicamente. Qual o diagnóstico e a correção?',
        opcoes: [
          opc('a', 'Temperatura 0 dá alta reprodutibilidade, não garantia de string idêntica; use graders adequados (M06) e pinne a versão completa do modelo', true, 'ponto flutuante em GPU, batching, roteamento entre réplicas e atualização silenciosa fazem a distribuição variar minimamente.'),
          opc('b', 'O modelo está quebrado: aumente a temperatura', false, 'aumentar a temperatura piora a repetibilidade.'),
          opc('c', 'Trocar para top_k resolve', false, 'top_k só reformula o sorteio; não elimina a variação do servidor.')] },
      { id: 'm05b1-temp-top-p', pergunta: 'O que acontece ao ajustar ao mesmo tempo temperature e top_p?',
        opcoes: [
          opc('a', 'A interação é imprevisível: mexa em um OU no outro', true, 'temperature reescala a distribuição; top_p corta a cauda. Combinados, fica difícil saber qual produziu o resultado.'),
          opc('b', 'Os efeitos se somam de forma previsível', false, 'a interação entre os dois não é aditiva nem previsível.'),
          opc('c', 'O top_p anula a temperatura', false, 'nenhum anula o outro: os dois moldam o sorteio de formas diferentes.')] },
      { id: 'm05b1-max-tokens', pergunta: 'A resposta veio com stop_reason "max_tokens". O que isso significa para o seu código?',
        opcoes: [
          opc('a', 'A saída foi cortada no meio, provavelmente inválida: trate como erro, não como detalhe', true, 'atingido o teto, não há aviso educado; a resposta é truncada.'),
          opc('b', 'O modelo terminou normalmente', false, 'o término normal vem como end_turn.'),
          opc('c', 'A janela de contexto estourou', false, 'max_tokens é o teto da saída, não da janela.')] },
      { id: 'm05b1-idioma', pergunta: 'O mesmo texto, em português e em inglês, custa quantos tokens, em ordem de grandeza?',
        opcoes: [
          opc('a', 'O português custa cerca de 20% mais, porque acentos e flexões fragmentam mais', true, 'regras de bolso do bloco: inglês perto de 4 caracteres por token; português de 3 a 3,5.'),
          opc('b', 'O mesmo número, porque o tokenizador é independente do idioma', false, 'o BPE foi treinado com mais inglês; palavras raras e flexões quebram em mais pedaços.'),
          opc('c', 'O português custa metade', false, 'é o contrário: custa mais, não menos.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Tudo se reduz a tokens</h3>' +
          '<p>Custo, latência, cache, escolha de modelo e o tamanho de chunk do M07 se reduzem a <strong>tokens</strong>. É a unidade de cobrança, de limite e de tempo. Quem não sabe estimar tokens de cabeça descobre o problema na fatura. Os parâmetros de amostragem são a outra metade do contrato: eles determinam se a mesma pergunta devolve a mesma resposta, e isso decide se você consegue testar o sistema (M06).</p>' },
        { tipo: 'texto', html:
          '<h3>O que é um token</h3>' +
          '<p>Modelos não leem letras nem palavras: leem <strong>tokens</strong>, pedaços de texto de tamanho variável produzidos por um algoritmo de subpalavras, o <strong>BPE</strong> (Byte Pair Encoding). Palavras comuns em inglês costumam ser 1 token; palavras raras, nomes próprios e código quebram em vários.</p>' +
          '<ul>' +
          '<li><strong>Inglês:</strong> cerca de 4 caracteres por token (cerca de 0,75 palavra).</li>' +
          '<li><strong>Português:</strong> de 3 a 3,5 caracteres por token. Acentos e flexões custam mais: o mesmo texto em português custa cerca de 20% mais caro que em inglês.</li>' +
          '<li><strong>Código:</strong> cerca de 3 caracteres por token. Indentação, símbolos e identificadores longos fragmentam.</li></ul>' +
          '<p>Para ver isso concretamente, cole um texto seu num visualizador de tokenização (tiktokenizer.vercel.app): vale mais que qualquer explicação.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Para quem vem de integração com API paga por payload', html:
          '<p>Pense em token como unidade de cobrança com preço por payload: você aprende rápido a contar antes de mandar. A diferença que quebra a intuição é que o <strong>output também é cobrado</strong> (tipicamente bem mais caro que o input) e você não controla quantos tokens serão gerados, só o teto (<code>max_tokens</code>). Orçar sem medir a saída é chutar metade da conta.</p>' },
        { tipo: 'texto', html:
          '<h3>Janela de contexto: o orçamento por chamada</h3>' +
          '<p>A <strong>janela de contexto</strong> é o total de tokens que cabem numa chamada, e <em>tudo</em> conta: instruções de sistema, definições de ferramentas, histórico, documentos anexados e a resposta que será gerada. Modelos de 2026 oferecem janelas grandes (centenas de milhares de tokens), e daí vem a armadilha mais cara do campo: achar que janela grande dispensa engenharia de contexto.</p>' +
          '<p>Três motivos, em ordem de importância prática, para não encher a janela só porque cabe:</p>' +
          '<ol>' +
          '<li><strong>Custo linear.</strong> Você paga por token de entrada em <em>toda</em> chamada. Um documento de 50 mil tokens no prompt de um agente que faz 20 turnos custa 1 milhão de tokens de entrada por tarefa. Sem cache, é dinheiro real (o bloco 5 resolve; o bloco 7 faz a conta).</li>' +
          '<li><strong>Latência.</strong> O tempo até o primeiro token cresce com o tamanho da entrada. Prompt inchado é UX ruim antes de ser fatura ruim.</li>' +
          '<li><strong>Context rot.</strong> A qualidade da atenção do modelo <em>degrada</em> conforme o contexto cresce. A pesquisa da Chroma popularizou o termo em 2025, e a conclusão é consistente: o desempenho em recuperação e raciocínio cai à medida que a janela enche, mesmo bem abaixo do limite anunciado. Informação relevante enterrada em 100 mil tokens de ruído é pior que um contexto pequeno e bem escolhido.</li></ol>' },
        { tipo: 'callout', tom: 'danger', titulo: 'A regra que vale o módulo inteiro', html:
          '<p><strong>Janela grande é uma folga de engenharia, não uma licença para preguiça.</strong> O objetivo continua sendo colocar o mínimo suficiente de contexto relevante: é o fator 3 do 12-Factor Agents (M01, bloco 3: <em>own your context window</em>) e o assunto central do M08. Quando alguém disser "com janela de 1M isso deixa de ser problema", a resposta correta tem três palavras: <strong>custo, latência, atenção</strong>.</p>' },
        { tipo: 'takeaway', html: 'Janela grande é <mark>folga de engenharia</mark>, não licença: cabe não quer dizer que compensa, por <mark>custo, latência e atenção</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Antes de qualquer chamada, estime. O estimador abaixo aplica as regras de bolso do bloco a um texto de 152 caracteres. É uma <strong>estimativa</strong>: a contagem exata vem do campo <code>usage</code> da resposta.</p>' },
        { tipo: 'rode', id: 'm05b1-rode', titulo: 'Estime tokens por idioma', enunciado: 'Rode o estimador e compare a faixa de cada tipo de texto. As barras mostram o ponto médio de tokens.',
          prefixo: '$', entrada: 'python estimar.py --tipo pt --texto "..."', unidade: 'tokens', terminalTitulo: 'estimador', etapas: etapasEstimativa(),
          prever: { pergunta: 'O mesmo conteúdo, de 152 caracteres em português, num tokenizador típico: como se compara em tokens com a versão em inglês?', opcoes: [
            { id: 'a', texto: 'Igual: o tokenizador não distingue idioma.', correta: false, porque: 'o BPE fragmenta mais as palavras menos frequentes no vocabulário; acentos e flexões do português custam mais.' },
            { id: 'b', texto: 'Cerca de 20% mais tokens em português.', correta: true, porque: 'regra do bloco: inglês perto de 4 caracteres por token, português de 3 a 3,5.' },
            { id: 'c', texto: 'Menos tokens em português, porque as palavras são mais longas.', correta: false, porque: 'palavra longa e flexionada quebra em mais pedaços, não em menos.' }
          ] },
          tutorAntes: 'Aperte Enter no comando já preenchido. Depois clique em Inglês e em Código para ler só as linhas de cada um.',
          tutorDepois: 'Português: 48 tokens no ponto médio; inglês: 38. A diferença é de ordem de grandeza (cerca de 20%), não uma conta exata: a contagem oficial vem do campo usage da resposta. O custo de entrada de uma chamada pequena é desprezível; o problema aparece quando o prompt é grande e se repete a cada turno.',
          callout: 'Você viu a estimativa por tipo de texto e o custo de entrada de uma chamada.' },
        { tipo: 'takeaway', html: 'Estime antes de enviar; <mark>a contagem exata</mark> vem de <mark>usage</mark>, e o output é cobrado à parte e mais caro.' }
      ] },

      { rotulo: 'Amostragem e parada', blocos: [
        { tipo: 'texto', html:
          '<h3>Os parâmetros de amostragem</h3>' +
          '<p>Um LLM não "escolhe" a próxima palavra: produz uma <strong>distribuição de probabilidade</strong> sobre todos os tokens possíveis, e um algoritmo de amostragem escolhe um. Os parâmetros controlam esse sorteio.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Parâmetro</th><th>O que faz de verdade</th><th>Quando mexer</th></tr></thead><tbody>' +
          '<tr><td><code>temperature</code></td><td>Reescala a distribuição antes do sorteio. Perto de 0: quase sempre o token mais provável (saída repetível). Alto: achata a curva e dá chance a tokens improváveis (variedade, e mais erro).</td><td><strong>0 para extração, classificação, código.</strong> 0.7 a 1.0 para redação criativa. Não existe "temperatura de precisão" acima de 0.</td></tr>' +
          '<tr><td><code>top_p</code> (nucleus)</td><td>Corta a cauda: considera só os tokens que somam <em>p</em> de probabilidade acumulada.</td><td>Alternativa à temperatura. <strong>Mexa em um OU no outro</strong>, nunca nos dois: a interação é imprevisível.</td></tr>' +
          '<tr><td><code>top_k</code></td><td>Considera só os <em>k</em> tokens mais prováveis.</td><td>Raramente. Mais grosseiro que top_p.</td></tr>' +
          '<tr><td><code>max_tokens</code></td><td>Teto de tokens gerados. Atingido o teto, a resposta é <strong>cortada no meio</strong>, sem aviso educado.</td><td>Sempre defina. E trate o motivo de parada: se veio <code>max_tokens</code>, a saída está truncada e provavelmente inválida.</td></tr>' +
          '<tr><td><code>stop_sequences</code></td><td>Strings que interrompem a geração.</td><td>Útil em formatos delimitados; quase desnecessário com structured output (bloco 2).</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Uma chamada completa, com o contrato nomeado</h3>' +
          '<p>Este é o esqueleto de tudo que você vai escrever no módulo. <em>Exemplo de adapter; a trilha live é opcional e exige chave de API. O laboratório obrigatório prova os mesmos mecanismos com fakes locais.</em></p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'resposta = client.messages.create(\n' +
          '    model="claude-sonnet-5",        # PINE a versão: é dependência de produção\n' +
          '    max_tokens=1000,                # teto da SAÍDA (não da janela); sempre defina\n' +
          '    temperature=0,                  # extração/classificação/código: 0\n' +
          '    system=[                        # instruções: prefixo estável (bloco 5 cacheia aqui)\n' +
          '        {"type": "text", "text": "You are a senior software archaeologist..."}\n' +
          '    ],\n' +
          '    messages=[                      # o histórico; TUDO aqui conta na janela\n' +
          '        {"role": "user", "content": "..."},\n' +
          '    ],\n' +
          '    stop_sequences=[],              # raramente necessário com structured output\n' +
          ')\n\n' +
          'resposta.stop_reason      # "end_turn" | "max_tokens" | "tool_use" | "stop_sequence"\n' +
          'resposta.usage.input_tokens\n' +
          'resposta.usage.output_tokens\n' +
          'resposta.content[0].text' },
        { tipo: 'callout', tom: 'danger', titulo: 'Temperatura 0 não é determinismo', html:
          '<p>Erro de quem monta a primeira suíte de testes: assumir que <code>temperature=0</code> devolve sempre a mesma string. Com temperatura 0 o sorteio vira "pegue o mais provável", mas <strong>a distribuição em si pode variar minimamente</strong>: ordem de operações de ponto flutuante em GPU, batching de outras requisições no servidor, roteamento entre réplicas, atualização silenciosa do modelo. Você tem <em>alta</em> reprodutibilidade, não garantia.</p>' +
          '<p>Duas consequências diretas: (1) teste de LLM não compara string exata (o M06 mostra os graders certos); (2) <em>a versão do modelo é uma dependência</em>: pinne o identificador completo, nunca um alias tipo "latest", ou o sistema muda de comportamento sem um único commit seu.</p>' },
        { tipo: 'quebre', id: 'm05b1-quebre', titulo: 'Provoque o truncamento e o alias que muda', obrigatorio: false,
          enunciado: 'Rode a chamada fake sem falha. Depois escolha uma falha e rode de novo: o que o <code>stop_reason</code> e a versão do modelo fazem com a sua saída?',
          prefixo: '$', entrada: 'python chamar.py --modelo modelo-fake-2026-08-01 --max-tokens 400 --temperature 0', unidade: 'etapa', terminalTitulo: 'chamada fake', etapas: etapasChamada(),
          falhas: [
            { id: 'max', rotulo: 'max_tokens curto demais (20)', efeito: { etapaFalha: 'parada', linhasErro: [
              L('cmd', 'python chamar.py --max-tokens 20'),
              L('out', 'stop_reason: max_tokens   output_tokens=20'),
              L('body', '{"risco": "alto", "linha_inic'),
              L('hint', 'JSON cortado no meio: json.loads falha. Truncamento é erro explícito, não detalhe')], tutor: 'o teto de saída foi atingido, e a resposta é cortada sem aviso. Quem não confere stop_reason descobre o JSON quebrado só no parser.' } },
            { id: 'alias', rotulo: 'alias "latest" em vez da versão pinada', efeito: { etapaFalha: 'repetir', linhasErro: [
              L('cmd', 'python chamar.py --modelo latest'),
              L('out', 'segunda chamada (semanas depois, o alias aponta para outro modelo): saída diferente da primeira'),
              L('hint', 'o teste que compara string exata falhou sem nenhum commit seu')], tutor: 'a versão do modelo é dependência de produção. Alias muda o comportamento do sistema por baixo; pinne o identificador completo.' } }
          ],
          tutorAntes: 'Comece por Sem falha. Depois escolha uma falha e rode de novo.',
          tutorDepois: 'Dois reflexos: confira stop_reason antes de validar a saída e nunca use alias no lugar da versão do modelo. A repetibilidade com temperature 0 é alta, mas o teste de LLM precisa de grader, não de igualdade de string.',
          callout: 'Você viu o truncamento e o alias quebrarem a saída.' },
        { tipo: 'takeaway', html: 'Para extração, <mark>temperature 0</mark>, <mark>max_tokens</mark> sempre definido e <mark>stop_reason</mark> sempre lido; versão do modelo pinada.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Estime, orce, confira</h3>' +
          '<p>O laboratório guiado repete isto com contagem de <code>usage</code> de uma chamada fake. Aqui, escreva as três contas que um engenheiro faz antes de enviar: estimar tokens, somar a entrada de uma tarefa e checar se tudo cabe na janela, contando a resposta.</p>' },
        { tipo: 'python', id: 'm05b1-python', titulo: 'Estimar tokens e orçar a janela', obrigatorio: false,
          enunciado: 'Complete <code>estimar_tokens(texto, tipo)</code>, que devolve a faixa <code>(minimo, maximo)</code> usando as razões de <code>RAZAO</code> e <code>math.ceil</code>; <code>entrada_por_tarefa(tokens_contexto, turnos)</code>; e <code>cabe_na_janela(janela, entrada, max_tokens)</code>, que devolve <code>(cabe, sobra)</code> contando a resposta. As razões são as do simulador do módulo (retrato ago/2026), não uma medida exata.',
          codigo: codigoPy, testes: testesPy,
          dica: 'A faixa mínima divide o tamanho pela razão maior de caracteres por token; use <code>razao_min</code> no primeiro valor e <code>razao_max</code> no segundo. Na janela, a sobra é <code>janela - (entrada + max_tokens)</code>.',
          solucao: solucaoPy,
          tutorDepois: 'O controle negativo importa: um tipo desconhecido deve falhar alto, não devolver zero. E a janela conta a resposta: 900 de entrada com teto de 101 estoura uma janela de 1000.',
          callout: 'As três contas passaram nos testes: estimar, somar a entrada e orçar a janela.' },
        { tipo: 'cenario', id: 'm05b1-cenario', titulo: 'Janela de 1M resolve tudo?', obrigatorio: false,
          enunciado: 'Seu agente de revisão reenvia o documento de arquitetura inteiro (50 mil tokens) em cada um dos 20 turnos. Um colega diz que a janela é enorme e que "isso deixa de ser problema". Escolha a resposta e veja o custo de cada decisão.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A fatura do mês chega acima do previsto e o tempo até a primeira palavra cresceu. Qual é a sua primeira ação?', opcoes: [
              { texto: 'Aceitar o argumento da janela grande e seguir como está.', vai: 'f-folga', tom: 'ruim', consequencia: 'você ignora que o input é pago em toda chamada.' },
              { texto: 'Contar a entrada por tarefa: 50 mil tokens x 20 turnos.', vai: 'contar', tom: 'ok', consequencia: 'são 1 milhão de tokens de entrada por tarefa, sem cache.' },
              { texto: 'Aumentar max_tokens para acelerar a resposta.', vai: 'f-teto', tom: 'ruim', consequencia: 'max_tokens é teto de saída: não reduz a entrada nem o TTFT.' }
            ] },
            contar: { texto: 'A conta mostra 1 milhão de tokens de entrada por tarefa, e a qualidade da resposta também caiu. Como reduzir o custo sem perder o que o agente precisa?', opcoes: [
              { texto: 'Colocar o mínimo suficiente de contexto relevante (engenharia de contexto) e, nos trechos que se repetem, usar cache (bloco 5).', vai: 'f-bom', tom: 'ok', consequencia: 'ataca custo, latência e atenção ao mesmo tempo.' },
              { texto: 'Dobrar a janela para o contexto caber com folga.', vai: 'f-rot', tom: 'ruim', consequencia: 'mais contexto piora o context rot: a atenção degrada mesmo abaixo do limite anunciado.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O prompt ficou menor e mais relevante: o custo, o TTFT e a atenção melhoraram juntos.' },
            'f-folga': { bom: false, texto: 'A fatura continuou crescendo, e a latência foi para o usuário.' },
            'f-teto': { bom: false, texto: 'Nada mudou na entrada; o ajuste só arriscou respostas mais longas e mais caras.' },
            'f-rot': { bom: false, texto: 'O custo subiu e a qualidade das respostas caiu: a informação relevante ficou enterrada no ruído.' }
          },
          callout: 'Você respondeu às três palavras do bloco: custo, latência e atenção.' },
        { tipo: 'escolha', id: 'm05b1-escolha-temp', titulo: 'Confira: o teste que falha às vezes',
          pergunta: 'Sua suíte compara, com igualdade de string, a saída de uma chamada com <code>temperature=0</code> contra um valor salvo, e falha de vez em quando. Qual a decisão correta?',
          opcoes: [
            { id: 'a', texto: 'Trocar a igualdade de string por um grader adequado (M06) e pinnar o identificador completo do modelo.', correta: true, porque: 'temperature=0 dá alta reprodutibilidade, não garantia; a versão do modelo é uma dependência.' },
            { id: 'b', texto: 'Subir temperature para 0.3, para o modelo "se estabilizar".', correta: false, porque: 'aumentar a temperatura aumenta a variação, não a reduz.' },
            { id: 'c', texto: 'Ajustar top_p e temperature ao mesmo tempo até a falha sumir.', correta: false, porque: 'a interação entre os dois é imprevisível; a regra é mexer em um OU no outro.' },
            { id: 'd', texto: 'Rodar duas vezes e ficar com a saída maior.', correta: false, porque: 'isso não trata a causa: o servidor pode variar minimamente a distribuição.' }
          ], tutorDepois: 'Teste de LLM não compara string exata; a versão do modelo é dependência.' },
        { tipo: 'escolha', id: 'm05b1-escolha-janela', titulo: 'Confira: orçar a janela',
          pergunta: 'Uma chamada tem 900 tokens de entrada, <code>max_tokens=200</code> e o modelo tem janela de 1000. Como você deve ler esse orçamento?',
          opcoes: [
            { id: 'a', texto: 'Cabe: a janela só conta a entrada, e 900 é menor que 1000.', correta: false, porque: 'a resposta que será gerada também conta na janela.' },
            { id: 'b', texto: 'Não fecha: entrada mais teto de saída somam 1100, acima de 1000; reduza a entrada ou o max_tokens.', correta: true, porque: 'tudo conta na janela: instruções, ferramentas, histórico, documentos e a resposta a ser gerada.' },
            { id: 'c', texto: 'Cabe: max_tokens é um teto e quase nunca é atingido.', correta: false, porque: 'orçamento se faz pelo pior caso do teto; confiar que a resposta será curta é chutar metade da conta.' },
            { id: 'd', texto: 'Cabe: o histórico das mensagens anteriores não entra na janela.', correta: false, porque: 'o histórico é reenviado em cada chamada e conta na janela e no custo.' }
          ], tutorDepois: 'Orce entrada mais teto de saída contra a janela.' },
        { tipo: 'takeaway', html: 'Janela, custo e latência crescem com os <mark>tokens de entrada</mark>; a <mark>temperatura 0</mark> reduz a variação, mas não a elimina.' }
      ] }
    ]
  });
})();
