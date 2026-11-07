/* Aula 12 · Avaliar skills e escolher modelo. Fonte: TR-texto.html, Passo 10. Números: kit/template/evals/exemplos/relatorio-exemplo.md (agente fake, modelos e preços fictícios). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };

  function tab(cab, linhas) {
    return { tipo: 'texto', largo: true, html: '<table><thead><tr><th>' + cab.join('</th><th>') + '</th></tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr><td>' + r.join('</td><td>') + '</td></tr>'; }).join('') + '</tbody></table>' };
  }
  var avisoFake = '<p class="ta-nota">Os números desta aula são saída real do agente fake do kit (8 casos, k = 3; modelos e preços fictícios), de <code>kit/template/evals/exemplos/relatorio-exemplo.md</code>. Servem para ler o formato, não para escolher modelo. Os tempos de parede mostrados nas etapas são ilustrativos.</p>';

  var casoToml = [
    'id = "slugify"',
    'descricao = "Implementar slugify com acentos e pontuação"',
    'tags = ["python", "feature"]',
    'dificuldade = "media"',
    'prompt = "Implemente slugify em texto.py conforme a docstring e faça os testes passarem. Não altere os testes."',
    'fixture = "../fixtures/slugify"      # copiada para uma pasta temporária a cada execução',
    'deve_acionar_skill = false           # caso negativo: a skill de bugfix não deveria disparar',
    '',
    '[verificar]',
    'comando = "\\"$PYTHON\\" -m unittest discover -q"   # exit 0 = passou'
  ].join('\n');

  var cmdModelos = 'python3 evals/run_evals.py --config evals/exemplos/variantes.toml --casos-dir evals/exemplos/casos --variantes modelo-grande,modelo-pequeno --repeticoes 3 --paralelo 4';
  var cmdSkill = 'python3 evals/run_evals.py --config evals/exemplos/variantes.toml --casos-dir evals/exemplos/casos --variantes modelo-grande --skill-ab corrigir-bug --repeticoes 3 --paralelo 4';

  var variantes = {
    claude: [
      '[[variante]]',
      'nome = "claude-sonnet"',
      'modelo = "claude-sonnet"',
      "comando = 'claude -p --model sonnet --permission-mode acceptEdits \"$(cat {prompt_file})\"'",
      'preco_entrada_mtok = 3.00      # confira a tabela de preços vigente',
      'preco_saida_mtok = 15.00',
      "regex_acionamento_skill = '\\[skill:minha-skill\\]'",
      '[variante.com_skill]',
      'env = { CLAUDE_CONFIG_DIR = "$HOME/.claude-com-skill" }',
      '[variante.sem_skill]',
      'env = { CLAUDE_CONFIG_DIR = "$HOME/.claude-sem-skill" }'
    ].join('\n'),
    codex: ['[[variante]]', 'nome = "codex"', 'modelo = "gpt-xx"', "comando = 'codex exec --full-auto \"$(cat {prompt_file})\"'"].join('\n'),
    opencode: ['[[variante]]', 'nome = "opencode-modelo-barato"', 'modelo = "provedor/modelo-barato"', "comando = 'opencode run --model provedor/modelo-barato \"$(cat {prompt_file})\"'"].join('\n'),
    cursor: ['[[variante]]', 'nome = "cursor"', 'modelo = "auto"', "comando = 'cursor-agent -p --force \"$(cat {prompt_file})\"'"].join('\n'),
    proprio: [
      '[[variante]]',
      'nome = "api-propria"',
      'modelo = "meu-modelo"',
      "comando = 'python3 \"$EVALS_DIR/meu_agente.py\" --prompt-file {prompt_file} --workdir {workdir}'",
      'env = { MEU_PROVEDOR_API_KEY = "$MEU_PROVEDOR_API_KEY", MEU_MODELO = "nome-do-modelo" }',
      "regex_tokens = 'usage: in=(?P<entrada>\\d+) out=(?P<saida>\\d+)'"
    ].join('\n')
  };

  TrilhaAula.registrar({
    id: 'avaliar-skills-modelos',
    titulo: 'Avaliar skills e escolher modelo',
    minutos: 25,
    resumo: 'Duas decisões caras, "essa skill ainda ajuda?" e "o modelo barato dá conta?", respondidas do mesmo jeito: tarefas reais, várias repetições e números.',
    revisao: [
      {
        "id": "caso-bom",
        "pergunta": "O que faz um bom caso de avaliação?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Tarefa real com critério verificável por máquina, incluindo bordas e casos negativos",
            "correta": true,
            "porque": "sem critério automático, a avaliação vira opinião."
          },
          {
            "id": "b",
            "texto": "Uma tarefa de brinquedo que o modelo sempre resolve",
            "correta": false,
            "porque": "não separa os modelos nem as skills."
          },
          {
            "id": "c",
            "texto": "Uma tarefa avaliada por impressão do revisor",
            "correta": false,
            "porque": "impressão varia de dia para dia."
          }
        ]
      },
      {
        "id": "pass-k",
        "pergunta": "O que o pass^k mede, diferente do pass@1?",
        "opcoes": [
          {
            "id": "a",
            "texto": "A chance de passar em todas as k repetições, ou seja, a consistência",
            "correta": true,
            "porque": "para uso repetido, uma falha ocasional já custa."
          },
          {
            "id": "b",
            "texto": "A chance de passar em pelo menos uma das k tentativas",
            "correta": false,
            "porque": "isso é o pass@k."
          },
          {
            "id": "c",
            "texto": "A média de tokens por tentativa",
            "correta": false,
            "porque": "custo é outra métrica."
          }
        ]
      },
      {
        "id": "mcnemar",
        "pergunta": "McNemar com p = 0,25 em 8 casos. O que concluir?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Que não há evidência suficiente de diferença, o que não prova equivalência",
            "correta": true,
            "porque": "com poucos casos o teste quase não detecta diferença."
          },
          {
            "id": "b",
            "texto": "Que os modelos são equivalentes",
            "correta": false,
            "porque": "falta de evidência não é evidência de igualdade."
          },
          {
            "id": "c",
            "texto": "Que o modelo grande é melhor, porque ganhou 3 a 0",
            "correta": false,
            "porque": "p = 0,25 não sustenta a afirmação."
          }
        ]
      },
      {
        "id": "regra-antes",
        "pergunta": "Quando escrever a regra de decisão da avaliação?",
        "opcoes": [
          {
            "id": "a",
            "texto": "Antes de ver o resultado",
            "correta": true,
            "porque": "depois do resultado, a regra tende a se ajustar ao que se queria."
          },
          {
            "id": "b",
            "texto": "Depois, olhando os números",
            "correta": false,
            "porque": "fica fácil escolher o corte que favorece a opinião prévia."
          },
          {
            "id": "c",
            "texto": "Não escrever: decidir caso a caso",
            "correta": false,
            "porque": "sem regra, ninguém discorda de ninguém com base em fatos."
          }
        ]
      }
    ],
    abas: [
      { rotulo: 'Montar a avaliação', blocos: [
        { tipo: 'texto', html:
          '<p>Duas decisões caras costumam ser tomadas por impressão. A primeira: "essa skill ainda ajuda?". Uma skill escrita para um modelo fraco pode ter ficado velha quando o modelo melhorou, acionar fora de hora e gastar contexto à toa, ou até atrapalhar. A segunda: "o modelo barato dá conta?". Para trabalho mecânico, às vezes sim; às vezes erra tanto que o custo por entrega sai maior.</p>' +
          '<p>As duas se respondem do mesmo jeito: <strong>rodar as mesmas tarefas reais, mais de uma vez, e comparar números</strong>. É como testar dois fornecedores com o mesmo pedido cinco vezes, em vez de confiar na conversa do vendedor. O kit (<code>kit/template/evals</code>) traz a ferramenta pronta: só Python 3.11+, sem dependências, qualquer agente de linha de comando.</p>' +
          '<h3>1. Monte o conjunto de casos</h3>' +
          '<ul>' +
          '<li><strong>20 a 50 tarefas reais</strong>, tiradas do seu histórico: bugs que você corrigiu, features pequenas que entregou, PRs que revisou. Com menos de 20, o relatório avisa que a decisão é frágil.</li>' +
          '<li><strong>Critério verificável por máquina</strong>: teste que passa, arquivo que existe, saída que casa. Se para julgar você precisa "ler e achar bom", ainda não é um caso.</li>' +
          '<li><strong>Dificuldades misturadas e casos de borda</strong> (entrada vazia, limites, entrada inválida). Só casos fáceis fazem qualquer modelo parecer igual.</li>' +
          '<li><strong>Casos negativos para a skill</strong>: tarefas em que ela <em>não</em> deve ser acionada (<code>deve_acionar_skill = false</code>). Sem eles você nunca enxerga o falso positivo.</li>' +
          '<li>Fixture pequena e hermética (sem rede, sem relógio), e a solução fora do alcance do agente.</li>' +
          '</ul>' +
          '<p>Um caso é um arquivo <code>.toml</code>. Este é real, do próprio kit (<code>exemplos/casos/slugify.toml</code>); o teste que decide está na fixture:</p>' },
        { tipo: 'codigo', linguagem: 'toml', texto: casoToml },
        { tipo: 'texto', html:
          '<h3>2. Descreva as variantes</h3>' +
          '<p>Para o seu agente real, descreva cada <strong>variante</strong> em <code>variantes.toml</code>: o comando que executa a tarefa a partir de <code>{prompt_file}</code> e <code>{workdir}</code>, o modelo, os preços por milhão de tokens e uma <code>regex_tokens</code> para medir o custo. Segredos só por variável de ambiente. Os exemplos vêm do arquivo do kit; <strong>as flags mudam entre versões, confira na ajuda da sua ferramenta</strong>.</p>' },
        { tipo: 'abas', rotulo: 'Ferramenta', itens: [
          { rotulo: 'Cursor', blocos: [{ tipo: 'codigo', linguagem: 'toml', texto: variantes.cursor }] },
          { rotulo: 'Codex', blocos: [{ tipo: 'codigo', linguagem: 'toml', texto: variantes.codex }] },
          { rotulo: 'OpenCode', blocos: [{ tipo: 'codigo', linguagem: 'toml', texto: variantes.opencode }] },
          { rotulo: 'Claude Code', blocos: [{ tipo: 'codigo', linguagem: 'toml', texto: variantes.claude }] }
        ] },
        { tipo: 'texto', html: '<p><strong>Script próprio</strong> (sua API, qualquer provedor):</p>' },
        { tipo: 'codigo', linguagem: 'toml', texto: variantes.proprio },
        { tipo: 'texto', html:
          '<p>Para a Cursor CLI e as demais, sem uma saída de uso de tokens o custo aparece como <code>n/d</code>: procure o modo JSON ou verbose da ferramenta e capture os tokens com <code>regex_tokens</code>. No modo skill, cada variante declara <code>[variante.com_skill]</code> e <code>[variante.sem_skill]</code> (uma pasta de skills diferente, uma variável ou um comando alternativo).</p>' +
          '<p class="ta-nota">Fundamento estatístico e avaliação de agentes em profundidade: módulo M06, Bloco 7.</p>' },
        { tipo: 'takeaway', html: 'Caso bom é <mark>tarefa real</mark> com <mark>critério verificável por máquina</mark>, incluindo bordas e casos negativos.' }
      ] },

      { rotulo: 'Rodar e ler', blocos: [
        { tipo: 'texto', html:
          '<h3>3. Rode o kit e leia o relatório</h3>' +
          '<p>Experimente sem custo: o agente do exemplo é um programa fake e determinístico. A primeira variante é a linha de base; cada caso roda 3 vezes por variante. Rode e depois clique em cada etapa para ler só o trecho dela.</p>' + avisoFake },
        { tipo: 'rode', id: 'av-rode-modelos', titulo: 'Compare modelo-grande e modelo-pequeno', enunciado: 'Rode a comparação e leia cada seção do relatório: resumo, falhas, pareada, McNemar e recomendação.',
          prefixo: '$', entrada: cmdModelos, unidade: 's', terminalTitulo: 'evals',
          etapas: [
            { id: 'exec', nome: 'Executar as tentativas', descricao: '8 casos x 3 repetições x 2 variantes', tom: 'dns', ms: 3, linhas: [
              L('info', 'casos: 8 | repetições (k): 3 | tentativas: 48'),
              L('out', 'executando com 4 em paralelo; cada tentativa em pasta temporária'),
              L('in', 'verificação: o comando do caso decide (exit 0 = passou)')] },
            { id: 'resumo', nome: 'Resumo por variante', descricao: 'pass@1, pass^k, pass@k, custo por sucesso', tom: 'tcp', ms: 1, linhas: [
              L('body', 'variante         pass@1  pass^k  pass@k  custo total  custo/sucesso'),
              L('body', 'modelo-grande     83%     75%    100%    US$ 0.3359   US$ 0.0168'),
              L('body', 'modelo-pequeno    62%     38%     75%    US$ 0.0356   US$ 0.0024'),
              L('hint', 'pass^k = todas as k tentativas acertaram (confiabilidade); pass@k = alguma acertou (capacidade)'),
              L('hint', 'o pequeno sabe fazer (pass@k 75%), mas não de modo confiável (pass^k 38%)')] },
            { id: 'falhas', nome: 'Falhas por motivo', descricao: 'Onde cada variante errou', tom: 'tls', ms: 1, linhas: [
              L('body', 'modelo-grande     verificar.comando   4 ocorrências'),
              L('body', 'modelo-pequeno    verificar.comando   9 ocorrências'),
              L('hint', 'todas as falhas foram o teste do caso reprovar, não erro de infraestrutura')] },
            { id: 'pareada', nome: 'Comparação pareada', descricao: 'Casos que mudaram de resultado', tom: 'request', ms: 1, linhas: [
              L('body', 'caso               A (grande)  B (pequeno)'),
              L('body', 'media-vazia        ok          falha'),
              L('body', 'paginar            ok          falha'),
              L('body', 'parse-duracao      ok          falha'),
              L('out', 'A ok / B falha: 3  |  A falha / B ok: 0')] },
            { id: 'mcnemar', nome: 'McNemar exato', descricao: 'Isso passa do acaso?', tom: 'response', ms: 1, linhas: [
              L('body', 'McNemar exato (pass^k por caso): p = 0.2500'),
              L('in', 'diferença não distinguível de ruído com 8 casos'),
              L('hint', 'não prova que são iguais; prova que 8 casos são poucos')] },
            { id: 'rec', nome: 'Recomendação', descricao: 'Regra fixa, escrita antes', tom: 'ink', ms: 1, linhas: [
              L('body', 'MANTER modelo-grande: modelo-pequeno perde 37.5% de pass^k, acima da tolerância de 5.0%.'),
              L('info', 'Atenção: só 8 casos; com menos de 20 a decisão é frágil.'),
              L('hint', 'regra: troca A por B só se a perda de pass^k <= tolerância E o custo por sucesso de B for menor')] }
          ],
          tutorAntes: 'Aperte Enter e clique em "Resumo por variante". Compare pass@k com pass^k do modelo-pequeno.',
          tutorDepois: 'O pequeno é cerca de 7 vezes mais barato por sucesso (0.0024 contra 0.0168), mas perde 37,5 pontos de confiabilidade. A regra mandou manter o grande.',
          callout: 'Você leu o relatório inteiro: números, evidência e a decisão pela regra escrita antes.' },
        { tipo: 'texto', html:
          '<h3>Como ler cada número</h3>' +
          '<ul>' +
          '<li><strong>pass@1</strong> é o acerto médio por tentativa. <strong>pass@k</strong> é "alguma das k tentativas acertou": o que o modelo consegue com tentativas extras. <strong>pass^k</strong> é "todas as k acertaram": a confiabilidade de um agente que roda sem você olhando.</li>' +
          '<li><strong>Custo por tarefa bem-sucedida</strong> = custo total / sucessos. O pequeno é 7 vezes mais barato por sucesso <em>porque</em> o preço cai mais do que o acerto. Se acertasse pouco, o barato sairia caro. Esse é o número que decide, não o preço por token.</li>' +
          '<li><strong>Comparação pareada</strong> lista os casos que mudaram de resultado: aqui, três em que o grande acertou sempre e o pequeno falhou; nenhum no sentido contrário.</li>' +
          '<li><strong>McNemar exato</strong> pergunta se 3 contra 0 passa do acaso. Resposta: p = 0,25. Isso <em>não</em> prova que são iguais; prova que 8 casos são poucos. Aumente casos e repetições.</li>' +
          '</ul>' +
          '<h3>Modo skill: com e sem a skill</h3>' +
          '<p>Agora a outra pergunta: a skill <code>corrigir-bug</code> ajuda? O kit roda o mesmo agente com e sem a skill, e confere também se ela foi <strong>acionada</strong> nos casos certos.</p>' },
        { tipo: 'rode', id: 'av-rode-skill', titulo: 'Rode o modo --skill-ab', enunciado: 'Compare o modelo-grande com e sem a skill corrigir-bug e leia o acionamento e o veredito.',
          prefixo: '$', entrada: cmdSkill, unidade: 's', terminalTitulo: 'evals',
          etapas: [
            { id: 'ab', nome: 'Duas variantes', descricao: 'Mesmo modelo, com e sem a skill', tom: 'dns', ms: 3, linhas: [
              L('info', 'variantes: modelo-grande+com-skill  e  modelo-grande+sem-skill'),
              L('out', '8 casos x 3 repetições x 2 variantes = 48 tentativas')] },
            { id: 'res', nome: 'Resumo', descricao: 'pass@1 e pass^k de cada lado', tom: 'tcp', ms: 1, linhas: [
              L('body', 'variante                    pass@1  pass^k  pass@k  custo/sucesso'),
              L('body', 'modelo-grande+com-skill      79%     75%     88%    US$ 0.0177'),
              L('body', 'modelo-grande+sem-skill      83%     75%    100%    US$ 0.0168'),
              L('hint', 'pass^k igual dos dois lados; com a skill, pass@1 e pass@k até caem um pouco')] },
            { id: 'acion', nome: 'Acionamento', descricao: 'Disparou quando devia? E quando não devia?', tom: 'tls', ms: 1, linhas: [
              L('body', 'nos casos com deve_acionar_skill (24 tentativas):'),
              L('body', '  corretos: 14   falsos positivos: 10   falsos negativos: 0'),
              L('hint', 'falso positivo = disparou quando não devia (gasta contexto e pode desviar o agente)'),
              L('hint', 'falso negativo = não disparou quando devia (a skill vira letra morta)')] },
            { id: 'ver', nome: 'Veredito', descricao: 'Útil, neutra ou prejudicial', tom: 'ink', ms: 1, linhas: [
              L('body', 'Ganho de pass^k (com - sem): +0 pontos percentuais'),
              L('body', 'Veredito: neutra'),
              L('info', 'sem ganho além da tolerância: candidata a enxugar (menos texto, menos contexto) ou a aposentar'),
              L('hint', 'útil = ganho acima da tolerância; neutra = sem ganho; prejudicial = piora')] }
          ],
          tutorAntes: 'Aperte Enter e leia a etapa "Acionamento": 10 falsos positivos são o sinal.',
          tutorDepois: 'Zero falso negativo e dez falsos positivos: a descrição é ampla demais. Sem ganho de pass^k, o veredito é neutra.',
          callout: 'A skill disparou demais e não melhorou o resultado: o veredito veio dos números, não de impressão.' },
        { tipo: 'takeaway', html: 'Para decidir, olhe <mark>pass^k</mark> e <mark>custo por sucesso</mark>; para saber se a diferença é real, o <mark>McNemar</mark>.' }
      ] },

      { rotulo: 'Decidir', blocos: [
        { tipo: 'texto', html:
          '<h3>4. Decisões típicas</h3>' +
          '<ul>' +
          '<li><strong>Dividir o trabalho.</strong> Se o barato perde confiabilidade só nos casos difíceis, use-o no mecânico (renomear, gerar teste de caso simples, formatar) e o caro no plano e na revisão. É decisão por <em>tipo de caso</em>; as tags do conjunto permitem medir (<code>--casos tag</code>).</li>' +
          '<li><strong>Refinar a descrição da skill</strong> quando há falso positivo; enriquecer o gatilho quando há falso negativo.</li>' +
          '<li><strong>Aposentar a skill neutra.</strong> O modelo melhorou e já faz sem ela? Menos texto, menos contexto, menos manutenção.</li>' +
          '<li><strong>Quando rodar de novo:</strong> ao trocar de modelo, ao criar ou editar uma skill, ao mudar o <code>AGENTS.md</code> e quando o fornecedor atualizar o modelo (o mesmo nome pode mudar de comportamento). Guarde o <code>relatorio.md</code> aprovado como referência.</li>' +
          '<li><strong>Colocar no CI como gate.</strong> Uma suíte rápida agendada (por exemplo semanal, ou ao tocar em <code>.agents/skills/</code> e <code>AGENTS.md</code>) que falha se o pass^k cair mais que a tolerância. O raciocínio do gate está no M06, Bloco 6.</li>' +
          '</ul>' +
          '<p><strong>LLM-as-judge.</strong> Só quando o critério é irredutivelmente subjetivo (clareza, tom). Rubrica escrita, juiz de modelo diferente do avaliado e calibração contra notas humanas (30 ou mais casos rotulados à mão). Se dá para escrever um teste, escreva o teste.</p>' },
        { tipo: 'escolha', id: 'av-oito', titulo: 'Confira: 8 casos bastam?',
          pergunta: 'No relatório, o McNemar deu p = 0,25 com 8 casos (3 contra 0 a favor do modelo-grande). Um colega diz: "então os dois modelos são equivalentes, vamos usar o barato". O que você responde?',
          opcoes: [
            { id: 'a', texto: 'Concordo: sem diferença significativa, vale o mais barato.', correta: false, porque: 'p alto não prova igualdade. Aqui o pequeno perde 37,5 pontos de pass^k, bem acima da tolerância de 5.' },
            { id: 'b', texto: 'Não prova nada ainda: 8 casos são poucos. Aumento para 20 a 50 casos e repetições antes de concluir, e a regra fixa continua mandando manter o grande.', correta: true, porque: 'o relatório mesmo diz "não distinguível de ruído com 8 casos" e "decisão frágil". A saída é mais casos e repetições, não concluir que são iguais.' },
            { id: 'c', texto: 'O McNemar com p = 0,25 prova que o grande é melhor.', correta: false, porque: 'p = 0,25 não passa do limite de 0,05, então o teste não consegue afirmar nem isso.' }
          ], tutorDepois: 'Ausência de evidência com 8 casos não é evidência de ausência de diferença.' },
        { tipo: 'escolha', id: 'av-confiab', titulo: 'Confira: 90% contra 95%',
          pergunta: 'O modelo barato tem pass@1 de 90% e o caro, 95%. O barato custa um décimo por tentativa. Qual número você ainda precisa ver antes de trocar?',
          opcoes: [
            { id: 'a', texto: 'Nenhum: 90% é quase 95% e é dez vezes mais barato.', correta: false, porque: 'pass@1 não mostra a confiabilidade acumulada nem o custo por sucesso real.' },
            { id: 'b', texto: 'O pass^k nas k repetições do seu conjunto de casos e o tipo de falha: se o agente roda sem supervisão, 90% por tentativa pode virar pouco mais de 70% de confiabilidade em k = 3.', correta: true, porque: 'confiabilidade acumula: com tentativas independentes, 0,9 elevado a 3 dá cerca de 73%. Cinco pontos podem separar falha detectável de falha silenciosa; e o custo por sucesso precisa ser medido, não deduzido do preço.' },
            { id: 'c', texto: 'A velocidade de resposta, só.', correta: false, porque: 'velocidade não diz nada sobre acerto nem sobre custo por entrega.' }
          ], tutorDepois: 'Meça pass^k e custo por sucesso antes de trocar.' },
        { tipo: 'escolha', id: 'av-skill', titulo: 'Confira: skill neutra',
          pergunta: 'O relatório de uma skill mostra 0 falsos negativos, 10 falsos positivos e ganho de pass^k de +0. O que fazer?',
          obrigatorio: false,
          opcoes: [
            { id: 'a', texto: 'Manter: nunca deixa de acionar quando deve.', correta: false, porque: 'ela dispara demais e não melhora o resultado: gasta contexto sem retorno.' },
            { id: 'b', texto: 'Aumentar o texto da skill para que ela pareça mais útil.', correta: false, porque: 'mais texto é mais contexto, sem ganho.' },
            { id: 'c', texto: 'Refinar a <code>description</code> para parar de disparar fora do escopo (e adicionar esses casos negativos ao conjunto); se mesmo assim o ganho continuar nulo, aposentar a skill.', correta: true, porque: 'falso positivo é descrição ampla demais. Corrija o gatilho, reavalie e, se continuar neutra, remova: skill é dependência, e dependência sem benefício é custo.' }
          ], tutorDepois: 'Skill que não ajuda se aposenta.' },
        { tipo: 'texto', html:
          '<h3>Antes de trocar de modelo</h3>' +
          '<ul>' +
          '<li>Tenho 20 a 50 casos reais, com critério verificável e casos de borda?</li>' +
          '<li>Há casos negativos para cada skill que quero avaliar?</li>' +
          '<li>Rodei com k de pelo menos 3 repetições e olhei pass^k, não só pass@1?</li>' +
          '<li>Comparei o custo por sucesso, medido com tokens reais, e não o preço por token?</li>' +
          '<li>Defini a tolerância de perda de pass^k antes de ver o resultado?</li>' +
          '<li>Se a diferença é "não distinguível de ruído", aumentei casos ou repetições em vez de concluir?</li>' +
          '<li>Guardei o relatório aprovado e marquei a próxima rodada no calendário ou no CI?</li>' +
          '</ul>' },
        { tipo: 'takeaway', html: 'Meça em vez de opinar: <mark>casos reais</mark>, <mark>k repetições</mark> e uma <mark>regra escrita antes</mark> do resultado.' }
      ] }
    ]
  });
})();
