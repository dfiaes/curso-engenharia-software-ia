/* M04 · Bloco 1: taxonomia e docs como contexto de agente. Fonte: M04.html#b01. Fontes verificadas em 14/09/2026 (Diátaxis); revalidar em até 90 dias. Tamanhos em tokens são os da fonte (aproximados). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasJanela = function () {
    return [
      { id: 'tarefa', nome: 'Carga da tarefa', descricao: 'Spec + ADR da área + C4 do container', tom: 'dns', ms: 4.5, linhas: [
        L('cmd', 'python janela.py --janela 32k --modo jit'),
        L('out', 'spec da feature       3.000 tokens'),
        L('out', 'ADR da área tocada       900 tokens'),
        L('out', 'C4 do container          600 tokens'),
        L('in', 'carregado: 4.500 de 32.000 (14%) -> sobram 27.500 para trabalhar')] },
      { id: 'tudo', nome: 'Carregar tudo', descricao: '+ 30 ADRs, 8 postmortems, docs de produto', tom: 'tcp', ms: 66.5, linhas: [
        L('cmd', 'python janela.py --janela 32k --modo tudo'),
        L('out', 'todos os 30 ADRs         27.000 tokens'),
        L('out', '8 postmortems antigos    20.000 tokens'),
        L('out', 'docs de produto          15.000 tokens'),
        L('out', 'total: 4.500 + 62.000 = 66.500 tokens'),
        L('hint', 'nem cabe: 66.500 > 32.000, faltam 34.500. Em 128k cabe (52%), mas o espaço de trabalho encolhe de 123.500 para 61.500')] },
      { id: 'jit', nome: 'Just-in-time', descricao: 'O histórico fica consultável, fora do contexto', tom: 'tls', ms: 4.5, linhas: [
        L('cmd', 'python janela.py --janela 128k --modo jit'),
        L('in', 'carregado: 4.500 de 128.000 (3,5%) -> sobram 123.500'),
        L('hint', 'o histórico continua no repositório: o agente busca quando a tarefa pede')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm04-b1',
    titulo: 'Taxonomia: qual documento serve para quê',
    minutos: 30,
    resumo: 'Existe um leitor que lê tudo, obedece e não tem colega para perguntar. Doc ausente vira invenção; doc velha vira erro confiante. Cinco categorias de documento, Diátaxis e três camadas de contexto.',
    objetivo: 'Explicar por que doc desatualizada é pior que ausente para um agente, classificar um documento nas cinco categorias e em Diátaxis, e decidir o que entra na janela do agente.',
    revisao: [
      { id: 'm04b1-poison', pergunta: 'Por que doc desatualizada é pior que doc ausente para um agente de código?',
        opcoes: [
          opc('a', 'Doc ausente vira premissa inventada (verificável); doc velha vira erro confiante, porque o agente obedece sem desconfiar', true, 'é o context poisoning: o código gerado faz sentido para um sistema que não existe mais.'),
          opc('b', 'O agente desconfia de doc velha e gasta tokens conferindo tudo', false, 'quem desconfia é o humano; o agente obedece com confiança.'),
          opc('c', 'Doc velha é ignorada, então o efeito é o mesmo de doc ausente', false, 'ele não ignora: trata como verdade.')] },
      { id: 'm04b1-categorias', pergunta: 'Quais são as cinco categorias da taxonomia de documentos do módulo?',
        opcoes: [
          opc('a', 'Produto, decisão, guidelines, arquitetura e operação', true, 'cada uma responde a uma pergunta e tem vida útil própria; decisão e postmortem são eternos.'),
          opc('b', 'Tutorial, how-to, reference e explanation', false, 'esses são os quatro tipos do Diátaxis, um eixo ortogonal à taxonomia.'),
          opc('c', 'README, wiki, ata, slide e e-mail', false, 'são suportes, não categorias; o módulo defende doc no repositório, junto do código.')] },
      { id: 'm04b1-camadas', pergunta: 'O AGENTS.md chegou a 900 linhas. Qual é a ação coerente com as três camadas de contexto?',
        opcoes: [
          opc('a', 'Manter só invariantes e comandos (menos de 200 linhas) e mover o resto para docs específicas, com ponteiros', true, 'o arquivo sempre carregado custa em toda sessão; o específico de tarefa é buscado quando preciso.'),
          opc('b', 'Deixar como está: a janela de contexto é grande', false, 'a regra importante se dilui e o custo se repete em toda sessão.'),
          opc('c', 'Dividir em dois arquivos, ambos sempre carregados', false, 'o total carregado continua o mesmo.')] },
      { id: 'm04b1-verdade', pergunta: 'Qual é a hierarquia da verdade quando doc e código divergem?',
        opcoes: [
          opc('a', 'Teste que roda > código > doc gerada > doc escrita à mão; a doc é o bug', true, 'o que se executa ou se deriva do código pesa mais que prosa escrita à mão.'),
          opc('b', 'Doc escrita à mão > doc gerada > código > teste', false, 'inverte a ordem de confiabilidade.'),
          opc('c', 'Vale a mais recente, seja qual for', false, 'data não é critério; execução e derivação são.')] },
      { id: 'm04b1-diataxis', pergunta: 'Um documento está confuso: começa como tutorial e vira referência no meio. O que o Diátaxis diz?',
        opcoes: [
          opc('a', 'Quase sempre misturou dois tipos; separe em dois documentos, cada um bom no seu tipo', true, 'tutorial, how-to, reference e explanation têm funções diferentes.'),
          opc('b', 'É preciso acrescentar mais exemplos ao documento', false, 'mais conteúdo não resolve a mistura.'),
          opc('c', 'Mover o documento para uma wiki externa', false, 'a wiki é o destino que o módulo desaconselha para docs que o agente precisa ler.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>O documento que ninguém lê, até agora</h3>' +
          '<p>Existe um ciclo conhecido: alguém escreve um documento longo, ele é lido uma vez na reunião inicial, envelhece em poucas semanas, e quem precisa da informação passa a perguntar a quem estava lá. O documento não foi inútil por ser documento: o custo de lê-lo era maior que o custo de perguntar. Essa era a economia.</p>' +
          '<p>Um segundo consumidor entrou na equação, com outra função de custo.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th></th><th>Leitor humano</th><th>Leitor agente</th></tr></thead><tbody>' +
          '<tr><td>Custo de ler 30 páginas</td><td>alto: vai pular, escanear, perguntar ao colega</td><td>baixo: lê tudo, sempre, em segundos</td></tr>' +
          '<tr><td>Custo de perguntar ao colega</td><td>baixo (e social)</td><td>impossível: não tem colega</td></tr>' +
          '<tr><td>Reação a doc desatualizada</td><td>desconfia ("isso aqui está velho")</td><td>obedece com confiança</td></tr>' +
          '<tr><td>Reação a doc ausente</td><td>pergunta</td><td>inventa uma premissa plausível</td></tr>' +
          '<tr><td>Memória entre sessões</td><td>lembra do projeto</td><td>zero (M00, bloco 1)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Leia a coluna da direita como especificação de requisito. Ela diz três coisas: <strong>doc ausente vira invenção</strong>; <strong>doc desatualizada vira erro confiante</strong> (pior que a ausente, porque não dispara desconfiança); e <strong>doc correta se paga</strong> toda vez que uma sessão nova começa. É a inversão econômica: a documentação virou o único mecanismo de memória de longo prazo de um colaborador que trabalha muito rápido e esquece tudo entre um dia e outro.</p>' +
          '<p>O paralelo mais próximo é um arquivo de configuração versionado que muda o comportamento de quem abre o repositório: quando está errado, a ferramenta engana ativamente em vez de apenas omitir. Doc de agente é configuração executável em prosa. Por isso o destino físico muda: sai da wiki externa e entra em <code>docs/</code>, versionado no mesmo commit do código que descreve. Doc fora do repositório é doc que o agente não lê e que o PR não obriga a atualizar.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Context poisoning: o modo de falha deste módulo', html:
          '<p>Doc desatualizada não é neutra, é ativamente danosa: o agente a trata como verdade e produz código coerente com um sistema que não existe mais. O erro é difícil de diagnosticar: o código "faz sentido", passa em review superficial e só quebra na integração.</p>' +
          '<p>A hierarquia de confiabilidade que você deve ensinar ao agente explicitamente, e que vale para você: <strong>teste que roda &gt; código &gt; doc gerada &gt; doc escrita à mão</strong>. Quando doc e código divergem, o código é a verdade e a doc é o bug. O bloco 4 automatiza essa cobrança.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'O critério do módulo inteiro', html:
          '<p>Este módulo não é "escreva mais documentação". Cada página que existe é uma página que pode envelhecer, mentir e envenenar o contexto do agente. O critério é a <strong>densidade de decisão por página</strong>: doc que registra decisão e restrição vale ouro; doc que descreve o que o código já diz é dívida com aparência de organização.</p>' },
        { tipo: 'takeaway', html: 'Doc ausente vira <mark>invenção</mark>; doc velha vira <mark>erro confiante</mark>. A velha é a pior.' }
      ] },

      { rotulo: 'Taxonomia e Diátaxis', blocos: [
        { tipo: 'texto', html:
          '<h3>O mapa dos formatos</h3>' +
          '<p>Há uma sopa de siglas e a maioria dos times inventa templates por não conhecer os que já existem. Decore as cinco categorias, não os quinze nomes.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Categoria</th><th>Documentos</th><th>Pergunta que responde</th><th>Vida útil</th></tr></thead><tbody>' +
          '<tr><td>Produto</td><td>PRD, user story, epic (TRD/FRD em empresas mais formais)</td><td>o quê e por quê, para quem</td><td>longa; muda com o produto</td></tr>' +
          '<tr><td>Decisão</td><td>ADR (MADR), RFC</td><td>por que escolhemos X em vez de Y</td><td>eterna: é registro histórico, nunca se edita o passado</td></tr>' +
          '<tr><td>Guidelines</td><td><code>CLAUDE.md</code>/<code>AGENTS.md</code>, coding standards, contributing, testing policy</td><td>como se trabalha aqui</td><td>viva; muda por convenção</td></tr>' +
          '<tr><td>Arquitetura</td><td>High Level Design, Feature Design Doc, C4</td><td>como o sistema é montado</td><td>média; morre rápido se não for gerada</td></tr>' +
          '<tr><td>Operação</td><td>runbook, playbook, postmortem</td><td>o que fazer quando quebrar / o que aprendemos</td><td>runbook: viva. postmortem: eterna</td></tr>' +
          '</tbody></table>' },
        { tipo: 'abas', rotulo: 'Dois eixos para decidir onde escrever', itens: [
          { rotulo: 'Diátaxis', blocos: [{ tipo: 'texto', html:
            '<p><strong>Diátaxis</strong> (diataxis.fr) separa o material em quatro tipos por dois eixos: estudo × trabalho e prático × teórico.</p>' +
            '<ul><li><strong>Tutorial:</strong> aprender fazendo (este material).</li><li><strong>How-to:</strong> resolver uma tarefa específica (o runbook).</li><li><strong>Reference:</strong> consultar o fato exato (OpenAPI, schema).</li><li><strong>Explanation:</strong> entender o porquê (ADR, design doc).</li></ul>' +
            '<p>Quando um documento está confuso, quase sempre é porque misturou dois tipos: o tutorial que vira referência no meio, o how-to que tenta explicar a teoria. Separe e os dois ficam bons. Para agentes, o tipo mais valioso é <em>reference</em> (fatos exatos, baratos de verificar), seguido de <em>explanation</em> (o porquê, que impede o agente de "otimizar" uma decisão deliberada).</p>' }] },
          { rotulo: 'Escrever é pensar', blocos: [{ tipo: 'texto', html:
            '<p>"Writing is thinking" costuma ser dito de modo vago. A versão mecânica:</p>' +
            '<ul><li><strong>Prosa não aceita hand-waving.</strong> Numa conversa você diz "aí a gente sincroniza os dois lados" e todo mundo assente. Ao escrever, é forçado a dizer quem sincroniza, quando e o que acontece se falhar no meio. A Amazon trocou slides por memorandos de 6 páginas: slide permite bullet vago, frase completa não.</li>' +
            '<li><strong>Escrever é o teste de compreensão mais barato.</strong> Se você não consegue escrever a decisão em cinco frases, não a entendeu, e descobriu isso por R$ 0 em vez de depois de duas semanas de implementação.</li>' +
            '<li><strong>O leitor certo é o "você daqui a um ano"</strong> e, agora, o agente de amanhã. Ambos chegam sem o contexto que está óbvio na sua cabeça. Escreva o pressuposto que parece bobo demais; é sempre ele que falta.</li></ul>' +
            '<p>Corolário: pedir ao agente que escreva o documento e aceitar sem ler pula a parte que gera o valor. O uso correto é o inverso: <strong>você escreve o esqueleto do raciocínio</strong> (decisões, restrições, não-objetivos) e o agente expande, formata, procura inconsistência e escreve as partes mecânicas. Pensamento é seu; datilografia é dele.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'Cinco categorias; <mark>Diátaxis</mark> resolve "onde escrevo isso?"; <mark>o pensamento é seu</mark>, a datilografia é do agente.' }
      ] },

      { rotulo: 'Contexto do agente', blocos: [
        { tipo: 'texto', html:
          '<h3>O que entra na janela do agente</h3>' +
          '<p>Nem toda documentação deve estar no contexto o tempo todo: a janela é recurso escasso e caro (fator 3 do 12-Factor Agents, M01). A regra de <strong>três camadas</strong> do curso:</p>' +
          '<ul><li><strong>Sempre carregado</strong> (o "system prompt do repositório"): <code>CLAUDE.md</code>/<code>AGENTS.md</code>, com convenções, comandos e restrições invioláveis. Alvo: menos de 200 linhas. Se passou disso, você está usando o arquivo errado: extraia para docs específicas e deixe ponteiros.</li>' +
          '<li><strong>Carregado por tarefa</strong> (just-in-time): a spec da feature (M01), o ADR da área tocada, o C4 do container em questão. O agente busca quando precisa, e só acha se os nomes de arquivo forem previsíveis (por isso a convenção <code>NNN-nome/</code> do M01).</li>' +
          '<li><strong>Nunca carregado, mas indispensável:</strong> histórico completo de ADRs, postmortems antigos, docs de produto. Vivem no repositório para consulta humana e busca do agente; não entram por padrão.</li></ul>' },
        { tipo: 'rode', id: 'm04b1-rode', titulo: 'Quanto da janela sobra para trabalhar', enunciado: 'Os tamanhos são os da fonte (aproximados). Rode a carga por tarefa, depois a carga de tudo, depois o just-in-time numa janela maior. A barra mostra milhares de tokens.',
          prefixo: '$', entrada: 'python janela.py --janela 32k --modo jit', unidade: 'k tokens', terminalTitulo: 'simulador de janela', etapas: etapasJanela(),
          prever: { pergunta: 'Numa janela de 32k tokens, o que acontece se você carregar spec, ADR da área e C4 mais todos os 30 ADRs, 8 postmortems e os docs de produto?', opcoes: [
            { id: 'a', texto: 'Cabe com folga: 32k é suficiente para documentação.', correta: false, porque: 'só o histórico soma 62.000 tokens.' },
            { id: 'b', texto: 'Estoura a janela: 66.500 tokens contra 32.000.', correta: true, porque: '4.500 da tarefa mais 62.000 de histórico; mesmo numa janela de 128k o espaço de trabalho cairia pela metade.' },
            { id: 'c', texto: 'Cabe, mas o modelo ignora o que sobrar.', correta: false, porque: 'o que não cabe simplesmente não é carregado; não há "ignorar parcial".' }
          ] },
          tutorAntes: 'Aperte Enter com o comando já preenchido; depois clique em "Carregar tudo" para ler a conta.',
          tutorDepois: 'Cada linha do arquivo sempre carregado custa em toda sessão. O resto é busca sob demanda: por isso nomes de arquivo previsíveis importam.',
          callout: 'Você viu o histórico completo estourar a janela enquanto a carga por tarefa ocupa 14%.' },
        { tipo: 'texto', html:
          '<h3>Um AGENTS.md que funciona</h3>' +
          '<p>Em 2025–2026 o ecossistema convergiu para <code>AGENTS.md</code> como nome padrão do arquivo de instruções do repositório: um markdown na raiz com comandos de build/teste, convenções, estilo e restrições. Vários agentes o leem nativamente; o Claude Code usa <code>CLAUDE.md</code> com o mesmo papel. Padrão prático e agnóstico: o conteúdo mora no <code>AGENTS.md</code> e o <code>CLAUDE.md</code> aponta para ele (uma linha: <code>Siga AGENTS.md</code>). Assim você não duplica regra, e trocar de harness (OpenCode, Codex, Cursor) custa zero. O que mais pesa é o começo do arquivo: abra com as restrições invioláveis, não com a descrição do projeto.</p>' +
          '<p>Um arquivo curto, ordenado por gravidade (invariantes primeiro, contexto depois):</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto:
          '# AGENTS.md — Cartógrafo\n\n## Invariantes (violar = PR reprovado)\n- Toda tarefa termina com `bash check.sh` em código 0.\n- Nenhuma alteração fora dos arquivos declarados na etapa do plan.md.\n- Dinheiro em centavos (int) ou Decimal. Nunca float.\n- Segredo nunca em código, imagem ou log. Só em variável de ambiente.\n- Comportamento mudou => spec e doc mudam no MESMO commit.\n\n## Comandos\n- instalar: `uv sync --frozen`   · testes: `uv run pytest -q`\n- gate completo: `bash check.sh` · migração: `uv run alembic upgrade head`\n\n## Convenções\n- Python 3.14, tipado, `mypy --strict`. Pydantic na fronteira, dataclass dentro.\n- Camadas: api -> services -> repositories (cobrado por teste de guardrail).\n- Commits em inglês, imperativo: `M05: add per-request cost counter`.\n\n## Onde procurar contexto (NÃO carregue tudo; busque sob demanda)\n- decisões: docs/adr/            · arquitetura: capstone/docs/architecture.md\n- specs de feature: docs/spec/NNN-nome/   · o que o produto gera: capstone/docs/output-spec.md\n\n## Hierarquia da verdade\nteste que roda > código > doc gerada > doc escrita à mão.\nSe doc e código divergem, o código é a verdade e a doc é o bug.\n' },
        { tipo: 'callout', tom: 'info', titulo: 'Leitura aplicada: auditoria de docs', html:
          '<p>No Laboratório guiado M04 você audita a documentação existente com critério objetivo: classifica cada documento nas cinco categorias com a data da última mudança <em>real</em> de conteúdo; mede a densidade de decisão do maior documento (parágrafos que registram decisão ou restrição contra parágrafos que descrevem o que o código já diz); e enxuga as instruções do agente para invariantes com menos de 200 linhas.</p>' +
          '<p>O resultado típico é 10–20% de decisão e o resto de descrição. A parte descritiva é a que envelhece e mente; a parte de decisão é a que não se recupera lendo o código, porque ninguém lê um código e descobre o que foi considerado e rejeitado. Essa proporção é o argumento para escrever menos e melhor.</p>' },
        { tipo: 'takeaway', html: 'Três camadas: <mark>sempre carregado (&lt; 200 linhas)</mark>, <mark>just-in-time</mark> por tarefa e <mark>consultável</mark> fora do contexto.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<p>Primeiro a peça: complete o começo de um <code>AGENTS.md</code> e do ponteiro do <code>CLAUDE.md</code>. Depois a lógica por trás da hierarquia da verdade, em código.</p>' },
        { tipo: 'complete', id: 'm04b1-complete', titulo: 'Monte o AGENTS.md e o ponteiro', linguagem: 'markdown',
          enunciado: 'Escolha, em cada lacuna, o trecho coerente com as três camadas de contexto e com a hierarquia da verdade.',
          partes: [
            '# AGENTS.md\n\n## ', { lacuna: 'primeira', opcoes: ['Invariantes (violar = PR reprovado)', 'Visão geral e história do projeto', 'Lista de todos os ADRs'], correta: 'Invariantes (violar = PR reprovado)' },
            '\n- Toda tarefa termina com `bash check.sh` em código 0.\n\n## Onde procurar contexto\n- decisões: docs/adr/ (',
            { lacuna: 'carga', opcoes: ['NÃO carregue tudo; busque sob demanda', 'carregue todos os ADRs no início de cada sessão', 'cole os ADRs aqui dentro'], correta: 'NÃO carregue tudo; busque sob demanda' },
            ')\n\n## Hierarquia da verdade\nteste que roda > código > ', { lacuna: 'meio', opcoes: ['doc gerada', 'wiki', 'ata de reunião'], correta: 'doc gerada' },
            ' > doc escrita à mão.\nSe doc e código divergem, ', { lacuna: 'bug', opcoes: ['o código é a verdade e a doc é o bug', 'a doc é a verdade e o código é o bug', 'vale a mais recente'], correta: 'o código é a verdade e a doc é o bug' },
            '.\n\n<!-- CLAUDE.md -->\n', { lacuna: 'ponteiro', opcoes: ['Siga AGENTS.md', 'Copie aqui todas as regras do AGENTS.md', 'Ignore AGENTS.md'], correta: 'Siga AGENTS.md' },
            '\n'
          ],
          explicacao: 'Invariantes primeiro, porque o começo do arquivo é o que mais pesa. O contexto de referência vira ponteiro com busca sob demanda. A hierarquia (teste, código, doc gerada, doc à mão) diz ao agente em quem confiar quando as fontes divergem. O CLAUDE.md de uma linha evita duplicar regra e troca de harness sem custo.',
          callout: 'Arquivo curto, invariantes primeiro e uma única fonte de regra.' },
        { tipo: 'python', id: 'm04b1-python', titulo: 'Resolva a divergência entre fontes', obrigatorio: false,
          enunciado: 'Implemente <code>fonte_da_verdade(evidencias)</code>. <code>evidencias</code> é um dict fonte para valor afirmado (por exemplo <code>{"codigo": 500, "doc_manual": 100}</code>). Devolva <code>(valor, fonte, divergentes)</code> usando a hierarquia <code>ORDEM</code>; levante <code>ValueError</code> se nenhuma fonte for conhecida.',
          codigo: [
      'ORDEM = ["teste", "codigo", "doc_gerada", "doc_manual"]',
      '',
      '',
      'def fonte_da_verdade(evidencias):',
      '    """evidencias: dict fonte -> valor afirmado.',
      '    Devolve (valor, fonte, divergentes): o valor da fonte mais confiável',
      '    presente, essa fonte e as fontes presentes que afirmam outra coisa."""',
      '    # 1. percorra ORDEM e pare na primeira fonte presente em evidencias',
      '    # 2. divergentes = fontes presentes com valor diferente do vencedor',
      '    # 3. sem nenhuma fonte conhecida: levante ValueError',
      '    return None, "", []',
      '',
      '',
      'print(fonte_da_verdade({"codigo": 500, "doc_manual": 100}))'
    ].join('\n'), testes: [
      'def test_codigo_vence_doc_escrita_a_mao():',
      '    assert fonte_da_verdade({"codigo": 500, "doc_manual": 100}) == (500, "codigo", ["doc_manual"])',
      '',
      '',
      'def test_teste_vence_codigo():',
      '    v, f, d = fonte_da_verdade({"teste": 500, "codigo": 100, "doc_manual": 100})',
      '    assert (v, f) == (500, "teste")',
      '    assert d == ["codigo", "doc_manual"]',
      '',
      '',
      'def test_doc_gerada_vence_doc_manual():',
      '    assert fonte_da_verdade({"doc_manual": 7, "doc_gerada": 9}) == (9, "doc_gerada", ["doc_manual"])',
      '',
      '',
      'def test_sem_divergencia():',
      '    assert fonte_da_verdade({"codigo": 500, "doc_gerada": 500}) == (500, "codigo", [])',
      '',
      '',
      'def test_so_a_doc_manual_ainda_responde():',
      '    assert fonte_da_verdade({"doc_manual": 100}) == (100, "doc_manual", [])',
      '',
      '',
      'def test_sem_evidencia_conhecida_falha():',
      '    for entrada in ({}, {"wiki": 1}):',
      '        try:',
      '            fonte_da_verdade(entrada)',
      '        except ValueError:',
      '            continue',
      '        assert False, "deveria levantar ValueError"'
    ].join('\n'),
          dica: 'Percorra <code>ORDEM</code> e pare na primeira fonte que esteja em <code>evidencias</code>. As divergentes são as fontes presentes cujo valor difere do vencedor.',
          solucao: [
      'ORDEM = ["teste", "codigo", "doc_gerada", "doc_manual"]',
      '',
      '',
      'def fonte_da_verdade(evidencias):',
      '    for fonte in ORDEM:',
      '        if fonte in evidencias:',
      '            valor = evidencias[fonte]',
      '            divergentes = [',
      '                f for f in ORDEM if f in evidencias and evidencias[f] != valor',
      '            ]',
      '            return valor, fonte, divergentes',
      '    raise ValueError("nenhuma evidência reconhecida")',
      '',
      '',
      'print(fonte_da_verdade({"codigo": 500, "doc_manual": 100}))'
    ].join('\n'),
          tutorDepois: 'Note o controle: quando a doc gerada concorda com o código, a lista de divergentes é vazia. Doc divergente não é erro do código; é o bug a consertar.',
          callout: 'A hierarquia da verdade agora é código: o vencedor e quem discorda dele.' },
        { tipo: 'cenario', id: 'm04b1-cenario', titulo: 'O ARCHITECTURE.md diz 100, o código usa 500', obrigatorio: false,
          enunciado: 'Um agente vai alterar o worker de ingestão. O <code>ARCHITECTURE.md</code> diz "o worker processa em lote de 100", mas o código usa 500. Decida como tratar a situação.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Você descobre a divergência antes de pedir a mudança ao agente. O que faz?', opcoes: [
              { texto: 'Deixar como está: o agente vai ler o código e perceber.', vai: 'f-poison', tom: 'ruim', consequencia: 'o agente lê a doc e obedece com confiança; o código gerado é coerente com um sistema que não existe mais.' },
              { texto: 'Tratar o código como verdade e corrigir a doc no mesmo commit da mudança.', vai: 'sinal', tom: 'ok', consequencia: 'a hierarquia da verdade diz que a doc é o bug.' },
              { texto: 'Apagar o ARCHITECTURE.md inteiro, para não enganar.', vai: 'f-invencao', tom: 'ruim', consequencia: 'sem doc, o agente inventa uma premissa plausível: troca erro confiante por invenção.' }
            ] },
            sinal: { texto: 'Mais tarde, outra doc cita um número que o código mudou de novo. Como evitar depender de lembrar?', opcoes: [
              { texto: 'Pôr a hierarquia da verdade no AGENTS.md e uma checagem de doc drift no CI (bloco 4).', vai: 'f-bom', tom: 'ok', consequencia: 'a cobrança vira mecanismo com exit code, não boa vontade.' },
              { texto: 'Pedir ao time que revise as docs a cada trimestre.', vai: 'f-boavontade', tom: 'ruim', consequencia: 'sem gatilho no PR, a revisão trimestral vira a primeira coisa a ser adiada.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Doc corrigida junto do código, hierarquia explícita para o agente e cobrança automática no PR.' },
            'f-poison': { bom: false, texto: 'O agente implementou contra lote de 100 e a integração quebrou semanas depois: context poisoning.' },
            'f-invencao': { bom: false, texto: 'O agente inventou uma premissa de lote e o time perdeu o único registro de arquitetura.' },
            'f-boavontade': { bom: false, texto: 'A revisão trimestral foi adiada duas vezes e a doc voltou a mentir.' }
          },
          callout: 'Você corrigiu a doc, ensinou a hierarquia ao agente e transformou a cobrança em mecanismo.' },
        { tipo: 'escolha', id: 'm04b1-escolha-1', titulo: 'Confira: leitor agente',
          pergunta: 'Um agente de código lê um <code>ARCHITECTURE.md</code> que ainda diz "o worker processa em lote de 100", mas o código usa 500. Qual é o comportamento esperado e por que é pior que não ter doc?',
          opcoes: [
            { id: 'a', texto: 'Ele desconfia, como um humano, e confere o código antes de agir.', correta: false, porque: 'o leitor agente não tem faro de "isso está velho".' },
            { id: 'b', texto: 'Ele obedece com confiança; doc ausente ao menos dispararia a pergunta ou a verificação.', correta: true, porque: 'doc ausente leva a premissa inventada (verificável); doc velha vira erro confiante, o context poisoning.' },
            { id: 'c', texto: 'Ele ignora o documento por ser antigo.', correta: false, porque: 'ele trata o texto como verdade.' },
            { id: 'd', texto: 'Ele atualiza o documento sozinho antes de continuar.', correta: false, porque: 'nada o obriga a isso; e escrever doc sem revisão seria outro problema.' }
          ], tutorDepois: 'Por isso a hierarquia: teste &gt; código &gt; doc gerada &gt; doc escrita à mão.' },
        { tipo: 'escolha', id: 'm04b1-escolha-2', titulo: 'Confira: onde mora a regra',
          pergunta: 'Qual destes pertence à camada "carregado por tarefa" (just-in-time), e não à "sempre carregado"?',
          opcoes: [
            { id: 'a', texto: 'Comandos de build e teste do projeto.', correta: false, porque: 'comandos valem para toda sessão: ficam no arquivo sempre carregado.' },
            { id: 'b', texto: 'O ADR da área tocada pela tarefa.', correta: true, porque: 'spec da feature, ADR da área e C4 do container são buscados quando a tarefa pede.' },
            { id: 'c', texto: 'As restrições invioláveis do repositório.', correta: false, porque: 'invariantes abrem o arquivo sempre carregado.' },
            { id: 'd', texto: 'O histórico completo de postmortems.', correta: false, porque: 'esse é o "nunca carregado, mas consultável".' }
          ], tutorDepois: 'Se o agente precisa achar sozinho, o nome do arquivo precisa ser previsível.' },
        { tipo: 'takeaway', html: 'Registre o que o código <mark>não conta</mark>; o resto é dívida que <mark>envelhece e mente</mark>.' }
      ] }
    ]
  });
})();
