/* M08 · Bloco 4: context engineering, o orçamento de atenção. Fonte: M08.html#b04. Os números do simulador usam as constantes do simulador da fonte (system 1.500, 180 por ferramenta, 5 chunks de 400, 150 de overhead por passo) e são estimativas para intuição, sem tokenizador real. Fontes verificadas em 14/09/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var CMD = 'python orcamento.py --janela 32000 --ferramentas 12 --saida 2500 --passos 20';
  var etapasOrc = function () {
    return [
      { id: 'sem', nome: 'Sem limite', descricao: 'Saída de ferramenta inteira', tom: 'dns', ms: 59, linhas: [
        L('cmd', CMD),
        L('info', 'fixo: system 1.500 + 12 ferramentas x 180 + 5 chunks x 400 = 5.660 tokens'),
        L('out', 'passo 20: 58.660 tokens (183% da janela). Histórico/saídas = 90% do contexto.'),
        L('out', 'o orçamento estoura no passo 10'),
        L('hint', 'o fixo é 5.660; o resto é histórico: 20 passos x (2.500 + 150) = 53.000')] },
      { id: 'trunca', nome: 'Truncar em 800', descricao: 'Truncar saída de ferramenta', tom: 'tls', ms: 25, linhas: [
        L('cmd', CMD + ' --truncar 800'),
        L('out', 'passo 20: 24.660 tokens (77% da janela). Histórico/saídas = 77% do contexto.'),
        L('out', 'dentro do orçamento em todos os 20 passos'),
        L('hint', 'o histórico ainda cresce linearmente: 20 x (800 + 150) = 19.000')] },
      { id: 'compacta', nome: 'Truncar e compactar', descricao: 'Compactar a cada 10 passos', tom: 'ink', ms: 17, linhas: [
        L('cmd', CMD + ' --truncar 800 --compactar-a-cada 10'),
        L('out', 'passo 20: 16.660 tokens (52% da janela). Histórico/saídas = 66% do contexto.'),
        L('in', 'dentro do orçamento; a compactação deixa o histórico em 1.500 no passo 10'),
        L('hint', 'exemplo com constantes do simulador, não medida real')] }
    ];
  };

  var codigoSim = [
    'SYSTEM = 1500', 'POR_FERRAMENTA = 180', 'CHUNKS = 5 * 400', 'OVERHEAD = 150', 'APOS_COMPACTAR = 1500', '', '',
    'def simular(janela, ferramentas, saida, teto, passos, compactar_cada=None):',
    '    """Estimativa de contexto por passo.',
    '    Devolve {"estoura_no_passo": int|None, "total": int, "historico": int, "pct_janela": int}."""',
    '    fixo = SYSTEM + ferramentas * POR_FERRAMENTA + CHUNKS',
    '    por_passo = saida + OVERHEAD  # falta aplicar o teto de truncamento',
    '    historico = 0',
    '    estoura = None',
    '    for n in range(1, passos + 1):',
    '        historico += por_passo',
    '        # 1. registre o primeiro passo em que fixo + historico passa da janela',
    '        # 2. compacte (historico = APOS_COMPACTAR) a cada N passos, exceto no último',
    '    total = fixo + historico',
    '    return {"estoura_no_passo": estoura, "total": total, "historico": historico, "pct_janela": round(total / janela * 100)}', '', '',
    'print(simular(32000, 12, 2500, None, 20))', ''].join('\n');
  var testesSim = [
    'def test_sem_limite_estoura_no_passo_10():',
    '    r = simular(32000, 12, 2500, None, 20)',
    '    assert r["estoura_no_passo"] == 10 and r["total"] == 58660 and r["historico"] == 53000', '', '',
    'def test_truncar_resolve_nesta_janela():',
    '    r = simular(32000, 12, 2500, 800, 20)',
    '    assert r["estoura_no_passo"] is None and r["total"] == 24660 and r["pct_janela"] == 77', '', '',
    'def test_compactar_reduz_o_historico():',
    '    r = simular(32000, 12, 2500, 800, 20, compactar_cada=10)',
    '    assert r["estoura_no_passo"] is None and r["historico"] == 11000 and r["total"] == 16660', '', '',
    'def test_teto_maior_que_a_saida_nao_aumenta_nada():',
    '    assert simular(32000, 12, 500, 800, 5) == simular(32000, 12, 500, None, 5)', '', '',
    'def test_controle_negativo_janela_pequena_ainda_estoura():',
    '    r = simular(16000, 12, 2500, 800, 20)',
    '    assert r["estoura_no_passo"] == 11', '', '',
    'def test_nao_compacta_no_ultimo_passo():',
    '    r = simular(32000, 12, 2500, 800, 10, compactar_cada=10)',
    '    assert r["historico"] == 9500', ''].join('\n');
  var solucaoSim = [
    'SYSTEM = 1500', 'POR_FERRAMENTA = 180', 'CHUNKS = 5 * 400', 'OVERHEAD = 150', 'APOS_COMPACTAR = 1500', '', '',
    'def simular(janela, ferramentas, saida, teto, passos, compactar_cada=None):',
    '    fixo = SYSTEM + ferramentas * POR_FERRAMENTA + CHUNKS',
    '    por_passo = (min(saida, teto) if teto else saida) + OVERHEAD',
    '    historico = 0',
    '    estoura = None',
    '    for n in range(1, passos + 1):',
    '        historico += por_passo',
    '        if estoura is None and fixo + historico > janela:', '            estoura = n',
    '        if compactar_cada and n % compactar_cada == 0 and n < passos:', '            historico = APOS_COMPACTAR',
    '    total = fixo + historico',
    '    return {"estoura_no_passo": estoura, "total": total, "historico": historico, "pct_janela": round(total / janela * 100)}', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm08-b4',
    titulo: 'Context engineering: o orçamento de atenção',
    minutos: 40,
    resumo: 'O modelo tem um orçamento de atenção finito: mais contexto pode ser menos capacidade de usar o que está lá. Context engineering é escolher, a cada chamada, o conjunto mínimo de tokens de alto sinal, com compactação, notas externas e subagentes para o horizonte longo.',
    objetivo: 'Medir onde o contexto é gasto, escolher a política (truncar, compactar, anotar, delegar) e escrever um system prompt na altitude certa.',
    revisao: [
      { id: 'm08b4-def', pergunta: 'Qual é a definição operacional de context engineering?',
        opcoes: [
          opc('a', 'Decidir, a cada chamada, o conjunto mínimo de tokens de alto sinal que maximiza a chance do comportamento desejado', true, 'é curadoria sob restrição, não "colocar tudo o que pode ser útil".'),
          opc('b', 'Colocar na janela tudo o que pode ser útil, por garantia', false, 'mais contexto não é mais informação: passado certo ponto, é menos capacidade de usar o que está lá.'),
          opc('c', 'Escolher a janela de contexto mais longa disponível', false, 'a janela é o limite, não a estratégia.')] },
      { id: 'm08b4-vilao', pergunta: 'Ao instrumentar a composição do contexto, qual componente costuma ser o vilão silencioso?',
        opcoes: [
          opc('a', 'Saídas de ferramenta, reenviadas em todos os passos seguintes', true, 'por isso: truncar com aviso, paginar, filtrar na origem e oferecer nível de detalhe. Meça antes de otimizar.'),
          opc('b', 'O system prompt', false, 'ocupa 500 a 3.000 tokens e pode ser cacheado como prefixo estável.'),
          opc('c', 'As definições de ferramentas', false, 'pesam (100 a 300 por ferramenta, a cada chamada), mas não crescem a cada passo.')] },
      { id: 'm08b4-compact', pergunta: 'Qual é o erro clássico da compactação?',
        opcoes: [
          opc('a', 'Resumir preservando o que é fácil (as mensagens recentes) em vez do que é valioso (decisões, restrições, símbolos identificados e o que já falhou)', true, 'preserve decisões, restrições, fatos com arquivo:linha e tentativas que falharam; descarte saídas cruas já interpretadas.'),
          opc('b', 'Descartar saídas cruas de ferramenta já processadas', false, 'é o que se deve descartar.'),
          opc('c', 'Gravar o progresso em um NOTAS.md', false, 'é a segunda técnica, não um erro.')] },
      { id: 'm08b4-altitude', pergunta: 'Qual é a altitude certa de um system prompt?',
        opcoes: [
          opc('a', 'Heurísticas fortes e específicas o bastante para guiar, gerais o bastante para transferir', true, 'baixo demais é árvore de if-else em prosa; alto demais ("seja útil e preciso") não guia nada.'),
          opc('b', 'Uma árvore de se o usuário perguntar X, faça Y', false, 'é o erro "baixo demais": frágil e sem fim.'),
          opc('c', 'Uma frase curta e vaga, para o modelo decidir', false, 'é o erro "alto demais".')] },
      { id: 'm08b4-jit', pergunta: 'Qual é o desenho maduro entre recuperação pré-computada e just-in-time?',
        opcoes: [
          opc('a', 'Híbrido: o RAG traz o contexto inicial provável (barato, uma vez) e o agente navega com ferramentas para aprofundar', true, 'just-in-time é mais preciso mas custa passos e depende de boas ferramentas (bloco 3); pré-computada é rápida mas aposta antes de saber.'),
          opc('b', 'Sempre pré-computada, porque é mais rápida', false, 'aposta antes de saber o que o modelo vai precisar.'),
          opc('c', 'Sempre just-in-time, sem RAG', false, 'custa passos e latência sem necessidade para o contexto provável.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Este é o bloco central do módulo. A tese, agora com o mecanismo: o modelo tem um <strong>orçamento de atenção</strong> finito. Não é só que a janela acaba; a qualidade da atenção degrada conforme o contexto cresce, porque a arquitetura transformer relaciona cada token com todos os outros (O(n²), conta que o M11 abre). Mais contexto não é mais informação: passado certo ponto, é menos capacidade de usar a informação que está lá.</p>' +
          '<p>Daí a definição operacional: <strong>context engineering</strong> é a disciplina de decidir, a cada chamada, o conjunto mínimo de tokens de alto sinal que maximiza a chance do comportamento desejado. É curadoria sob restrição.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Duas intuições que você já tem', html:
          '<p>Orçamento de memória: você não carrega tudo porque cabe, carrega o que precisa sabendo o custo de cada byte. Projeção em consulta: traz só os campos necessários, não a entidade inteira com todas as relações. A diferença é que aqui o custo aparece como resposta pior, não como consulta lenta, e por isso é mais difícil de perceber.</p>' },
        { tipo: 'texto', html: '<h3>Onde o contexto é gasto</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Componente</th><th>Tamanho típico</th><th>Como economizar</th></tr></thead><tbody>' +
          '<tr><td>System prompt</td><td>500 a 3.000 tokens</td><td>Altitude certa; prefixo estável e cacheado (M05, bloco 5)</td></tr>' +
          '<tr><td>Definições de ferramentas</td><td>100 a 300 por ferramenta</td><td>Menos ferramentas (bloco 3); descrições enxutas mas completas</td></tr>' +
          '<tr><td>Exemplos (few-shot)</td><td>200 a 2.000</td><td>Poucos e diversos: 3 exemplos canônicos batem 15 casos de borda</td></tr>' +
          '<tr><td>Contexto recuperado</td><td>1.000 a 20.000</td><td>O funil do M07: 5 chunks bons, não 30 medianos</td></tr>' +
          '<tr><td>Histórico da conversa ou do loop</td><td>Cresce a cada passo</td><td>Compactação e notas externas</td></tr>' +
          '<tr><td>Saídas de ferramenta</td><td>O vilão silencioso</td><td>Truncar, paginar, filtrar (bloco 3)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>A altitude certa do system prompt</h3>' +
          '<p>Há duas formas simétricas de errar.</p>' +
          '<ul><li><strong>Baixo demais (lógica hardcoded):</strong> uma árvore de "se o usuário perguntar X, faça Y". Frágil, cresce sem fim e quebra no primeiro caso não previsto: você tenta escrever código em prosa.</li>' +
          '<li><strong>Alto demais (vago):</strong> "seja útil e preciso". Assume contexto compartilhado que não existe e não guia comportamento nenhum.</li></ul>' +
          '<p>A altitude certa: heurísticas fortes e específicas o bastante para guiar, gerais o bastante para transferir. Exemplo: "Ao investigar impacto de mudança, comece pela definição do símbolo, depois liste os usos, e só então avalie o efeito. Cite arquivo e linha em toda afirmação. Se a evidência for insuficiente, diga o que faltou em vez de supor."</p>' +
          '<p>Estrutura que funciona, em seções curtas e marcadas: papel e objetivo, heurísticas de método, ferramentas disponíveis e quando usar cada uma, formato de saída, o que nunca fazer. Marcação (markdown ou tags XML) ajuda o modelo a localizar a seção relevante e ajuda você a revisar.</p>' },
        { tipo: 'takeaway', html: 'Mais contexto pode significar <mark>menos capacidade de usar o contexto</mark>: o objetivo é o <mark>conjunto mínimo de alto sinal</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Simulador: onde o orçamento estoura</h3>' +
          '<p>Os números abaixo vêm das constantes do simulador da fonte (system de 1.500, 180 tokens por ferramenta, 5 chunks recuperados de 400, 150 de overhead por passo). São <strong>estimativas</strong> para intuição, sem tokenizador real. Cenário: janela de 32k, 12 ferramentas, saída média de 2.500 tokens por chamada, 20 passos.</p>' },
        { tipo: 'rode', id: 'orcamento-rode', titulo: 'Estoure o orçamento e depois conserte',
          enunciado: 'Rode o simulador sem limite, com truncamento em 800 tokens e com truncamento mais compactação. Clique nas etapas para ver cada uma.',
          prefixo: '$', entrada: CMD, unidade: 'k tokens', terminalTitulo: 'simulador de orçamento (estimativa)', etapas: etapasOrc(),
          prever: { pergunta: 'Com janela de 32k, 12 ferramentas e saídas de 2.500 tokens por chamada, sem nenhum limite, em que passo o orçamento estoura?', opcoes: [
            { id: 'a', texto: 'Por volta do passo 10: o histórico cresce linearmente com saídas de 2.500 tokens.', correta: true, porque: 'o fixo é 5.660 e cada passo soma 2.650; no passo 10 a soma passa de 32.000.' },
            { id: 'b', texto: 'Só no passo 20, perto do fim.', correta: false, porque: 'no passo 20 já estaria em 183% da janela.' },
            { id: 'c', texto: 'Nunca: 12 ferramentas são poucas.', correta: false, porque: 'as ferramentas pesam 2.160 por chamada, mas o peso real vem das saídas acumuladas.' }
          ] },
          tutorAntes: 'Antes do Enter, escolha o passo em que você acha que estoura.',
          tutorDepois: 'Truncar a saída é a alavanca mais barata; mesmo assim o histórico cresce linearmente, e é aí que entram compactação e notas em disco.',
          callout: 'Você viu a saída de ferramenta dominar o contexto e as duas alavancas que a controlam.' },
        { tipo: 'texto', html:
          '<h3>As três técnicas de horizonte longo</h3>' +
          '<p>Tarefas de dezenas de passos (ingerir um repositório, investigar um sistema) estouram qualquer janela. Três técnicas, combináveis:</p>' },
        { tipo: 'abas', rotulo: 'Técnica', itens: [
          { rotulo: '1 · Compactação', blocos: [
            { tipo: 'texto', html:
              '<p>Quando o contexto se aproxima do limite, resuma a conversa e recomece com o resumo. <strong>Preserve:</strong> decisões tomadas, restrições descobertas, arquivos e símbolos relevantes já identificados, o que já foi tentado e falhou. <strong>Descarte:</strong> saídas cruas de ferramenta já processadas, conteúdo de arquivos já resumidos, passos de raciocínio intermediários. O erro clássico é preservar o que é fácil (as mensagens recentes) em vez do que é valioso (as conclusões antigas).</p>' }
          ] },
          { rotulo: '2 · Notas externas', blocos: [
            { tipo: 'texto', html:
              '<p>O agente escreve o progresso em arquivo (um <code>NOTAS.md</code>, uma lista de tarefas, um JSON de estado) e lê de volta quando precisa. O estado sai da janela e vai para o disco, onde não custa token por passo e sobrevive a qualquer reinício. É o princípio do M01 (bloco 2: estado externalizado, sessão descartável), e o teste é o mesmo: dá para matar a sessão e retomar só dos artefatos?</p>' }
          ] },
          { rotulo: '3 · Subagentes', blocos: [
            { tipo: 'texto', html:
              '<p>Um agente especializado faz a exploração pesada num contexto próprio e devolve ao coordenador só um resumo condensado, tipicamente 1.000 a 2.000 tokens em vez das dezenas de milhares que ele leu. O coordenador mantém a janela limpa para planejar e sintetizar. É o orchestrator-workers do bloco 2 aplicado como técnica de contexto, e é o que você fez à mão no M00 (bloco 3) com o caçador de gap.</p>' }
          ] }
        ] },
        { tipo: 'takeaway', html: 'O vilão quase sempre é <mark>saída de ferramenta</mark>; <mark>instrumente antes de otimizar</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'orcamento-python', titulo: 'Simule o orçamento de contexto', obrigatorio: false,
          enunciado: 'Complete <code>simular</code>: aplique o teto de truncamento à saída (<code>teto</code> pode ser <code>None</code>), registre em <code>estoura</code> o primeiro passo em que <code>fixo + historico</code> passa da janela e, se <code>compactar_cada</code> estiver definido, reduza o histórico a <code>APOS_COMPACTAR</code> a cada N passos, exceto no último.',
          codigo: codigoSim, testes: testesSim,
          dica: 'Saída efetiva = <code>min(saida, teto) if teto else saida</code>. Registre o estouro só uma vez (<code>if estoura is None and ...</code>) e compacte depois de somar o passo, com <code>n % compactar_cada == 0 and n &lt; passos</code>.',
          solucao: solucaoSim,
          tutorDepois: 'O controle negativo importa: numa janela de 16k, truncar em 800 ainda estoura no passo 11, e compactar só adia. Contexto é recurso com orçamento, não um problema que uma técnica resolve sozinha.',
          callout: 'O orçamento de contexto está em código, com truncamento e compactação.' },
        { tipo: 'complete', id: 'compactar-complete', titulo: 'Escreva a política de compactação', linguagem: 'python',
          enunciado: 'Escolha, em cada lacuna, o trecho que faz a compactação preservar o valioso e descartar o resto.',
          partes: [
            'LIMITE_COMPACTAR = ',
            { lacuna: 'limite', opcoes: ['0.6  # fração da janela a partir da qual compacta', '1.0  # só quando estourar', '0.05  # a cada passo'], correta: '0.6  # fração da janela a partir da qual compacta' },
            '\nPROMPT_COMPACTAR = """Resuma a investigação até aqui para continuar em uma\nsessão nova. PRESERVE, em lista: (1) a pergunta original; (2) ',
            { lacuna: 'fatos', opcoes: ['fatos estabelecidos com arquivo:linha', 'as últimas três mensagens', 'o tom da conversa'], correta: 'fatos estabelecidos com arquivo:linha' },
            '; (3) ',
            { lacuna: 'descartadas', opcoes: ['hipóteses descartadas e por quê', 'o conteúdo dos arquivos lidos', 'saídas de ferramenta completas'], correta: 'hipóteses descartadas e por quê' },
            '; (4) o que ainda falta verificar. DESCARTE: ',
            { lacuna: 'descarte', opcoes: ['conteúdo de arquivos já lidos, saídas de ferramenta já interpretadas, raciocínio intermediário', 'as decisões e restrições antigas', 'a pergunta original'], correta: 'conteúdo de arquivos já lidos, saídas de ferramenta já interpretadas, raciocínio intermediário' },
            '.\nMáximo 800 tokens. ',
            { lacuna: 'regra', opcoes: ['Não invente nada que não esteja no histórico.', 'Complete com o que parecer provável.', 'Seja criativo na síntese.'], correta: 'Não invente nada que não esteja no histórico.' },
            '"""\n'
          ],
          explicacao: 'A política é explícita: compacta antes de estourar (0,6 da janela), preserva conclusões e o que já falhou, com a evidência arquivo:linha, descarta saída crua já interpretada e proíbe inventar. A cópia executável vive no laboratório.',
          callout: 'Política de compactação com preservação e descarte explícitos.' },
        { tipo: 'cenario', id: 'horizonte-cenario', titulo: 'A investigação passou de 40 passos', obrigatorio: false,
          enunciado: 'O agente investigador está no passo 42, a janela está em 90% e as respostas pioraram. Escolha como agir e veja o custo de cada decisão.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A instrumentação mostra a composição do contexto: saídas de ferramenta dominam desde o passo 3. O que você faz primeiro?', opcoes: [
              { texto: 'Trocar para um modelo com janela maior e seguir.', vai: 'f-janela', tom: 'ruim', consequencia: 'a atenção degrada com o tamanho; a janela maior só adia o problema e aumenta o custo.' },
              { texto: 'Atacar a fonte: truncar com aviso e paginar as saídas de ferramenta.', vai: 'fonte', tom: 'ok', consequencia: 'o histórico para de crescer em ritmo linear com saídas grandes.' },
              { texto: 'Resumir a conversa guardando as últimas mensagens.', vai: 'f-facil', tom: 'ruim', consequencia: 'você preservou o que é fácil e perdeu as conclusões antigas, o erro clássico.' }
            ] },
            fonte: { texto: 'Mesmo assim o histórico cresce. Qual é o próximo passo?', opcoes: [
              { texto: 'Compactar com política (decisões, fatos com arquivo:linha, o que falhou) e gravar progresso em NOTAS.md.', vai: 'f-bom', tom: 'ok', consequencia: 'o estado sai da janela e a sessão pode ser morta e retomada dos artefatos.' },
              { texto: 'Descartar o histórico e recomeçar do zero.', vai: 'f-zero', tom: 'ruim', consequencia: 'você jogou fora decisões, restrições e hipóteses já descartadas.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Menos contexto, melhor resposta: truncar na fonte, compactar com política e externalizar o estado, como na tabela do laboratório.' },
            'f-janela': { bom: false, texto: 'A conta subiu e a qualidade continuou caindo, porque o problema era sinal por token e não capacidade de janela.' },
            'f-facil': { bom: false, texto: 'O agente refez trabalho e repetiu hipóteses já descartadas, porque o resumo guardou o recente e perdeu o valioso.' },
            'f-zero': { bom: false, texto: 'O agente reinvestigou do início e gastou o orçamento de passos sem avançar.' }
          },
          callout: 'Você atacou a causa, compactou com política e externalizou o estado.' },
        { tipo: 'takeaway', html: 'A ordem é <mark>medir</mark>, <mark>truncar na fonte</mark>, <mark>compactar com política</mark> e <mark>externalizar o estado</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Recuperação just-in-time × pré-computada</h3>' +
          '<p>Na recuperação <strong>pré-computada</strong> (o RAG clássico do M07) você indexa tudo antes e injeta os trechos relevantes no prompt antes de o modelo raciocinar. Na <strong>just-in-time</strong>, você dá ao modelo ferramentas de navegação (listar, buscar, ler) e ele carrega o que precisa durante o raciocínio, como quem não decora o repositório mas sabe usar <code>grep</code> e abrir arquivos.</p>' +
          '<p>Trade-offs: a pré-computada é mais rápida e previsível, mas aposta antes de saber o que o modelo vai precisar; a just-in-time é mais precisa e se adapta, mas custa passos (latência) e depende de boas ferramentas. O desenho maduro é híbrido, e é o do Capstone: o RAG traz o contexto inicial provável e o agente navega a partir dali. Por isso o design de ferramentas é determinante: as ferramentas são a interface de contexto.</p>' +
          '<h3>Contexto como recurso escasso</h3>' +
          '<ul><li><strong>Orçamento explícito:</strong> defina quantos tokens cada parte pode ocupar (por exemplo system 3k, recuperado 8k, histórico 20k) e meça. Sem orçamento declarado, o histórico come tudo.</li>' +
          '<li><strong>Política de despejo:</strong> quando estoura, o que sai primeiro? Saídas de ferramenta antigas saem antes de decisões tomadas. Escolha a política em vez de deixar o truncamento decidir.</li>' +
          '<li><strong>Paginação</strong> em vez de carregar tudo; <strong>externalizar estado</strong> (fator 12 do M01); <strong>medir antes de otimizar</strong>, instrumentando a composição do contexto por chamada.</li></ul>' },
        { tipo: 'escolha', id: 'conf-vilao', titulo: 'Confira: o vilão silencioso',
          pergunta: 'Ao instrumentar a composição do contexto de um agente, qual componente costuma ser o vilão silencioso?',
          opcoes: [
            { id: 'a', texto: 'Saídas de ferramenta, reenviadas em todos os passos seguintes.', correta: true, porque: 'por isso: truncar com aviso, paginar, filtrar na origem e oferecer nível de detalhe. Medir antes de otimizar quase sempre revela o suspeito inesperado.' },
            { id: 'b', texto: 'O system prompt.', correta: false, porque: 'é fixo e cacheável como prefixo estável.' },
            { id: 'c', texto: 'As definições de ferramentas.', correta: false, porque: 'custam a cada chamada, mas não crescem a cada passo.' },
            { id: 'd', texto: 'O histórico de mensagens do usuário.', correta: false, porque: 'mensagens do usuário são curtas perto das saídas de ferramenta.' }
          ] },
        { tipo: 'escolha', id: 'conf-compactacao', titulo: 'Confira: o erro clássico da compactação',
          pergunta: 'Na compactação do contexto, o que é um erro clássico?',
          opcoes: [
            { id: 'a', texto: 'Descartar saídas cruas de ferramenta já processadas.', correta: false, porque: 'é o que se deve descartar.' },
            { id: 'b', texto: 'Resumir preservando o que é fácil (mensagens recentes) em vez do que é valioso: decisões, restrições, símbolos já identificados e o que já falhou.', correta: true, porque: 'o valioso costuma estar nas conclusões antigas, e as notas em disco são a segunda técnica que sobrevive a qualquer reinício.' },
            { id: 'c', texto: 'Preservar as decisões tomadas.', correta: false, porque: 'é o que se deve preservar.' },
            { id: 'd', texto: 'Gravar o progresso em um NOTAS.md.', correta: false, porque: 'é a técnica de notas externas, não um erro.' }
          ] },
        { tipo: 'takeaway', html: 'O desenho maduro é <mark>híbrido</mark> (RAG para o provável, ferramentas para o resto) e todo contexto tem <mark>orçamento e política de despejo</mark>.' }
      ] }
    ]
  });
})();
