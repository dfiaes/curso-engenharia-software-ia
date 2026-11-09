/* M06 · Checkpoint: nove cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada. Fonte: M06.html#checkpoint-m06. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm06-checkpoint',
    titulo: 'Checkpoint M06',
    minutos: 50,
    resumo: 'Nove cenários sobre evals e observabilidade, sem consulta. A P1 é a prova principal: apresente para um gestor não técnico, que vai perguntar "e daí?" até chegar em dinheiro ou risco.',
    objetivo: 'Verificar, sem consulta, se você explica regressão comportamental, escolhe graders, decide com estatística honesta, calibra o gate, investiga um nightly sem commit e define o que logar sem vazar.',
    revisao: [
      { id: 'm06cp-suite', pergunta: 'A suíte passa em tudo desde o primeiro dia. Qual a causa provável e o conserto?',
        opcoes: [
          opc('a', 'Casos fáceis demais (sintéticos gerados pelo próprio modelo) ou graders frouxos; use casos de produção e análise de erro, e grader que verifica fato (a linha existe), não formato', true, 'uma suíte que nunca falha não mede nada.'),
          opc('b', 'O modelo é perfeito; aposente a suíte', false, 'a suíte não discrimina: isso é sintoma, não prova de qualidade.'),
          opc('c', 'Aumentar o limiar do gate', false, 'o problema é a capacidade de discriminar, não o limiar.')] },
      { id: 'm06cp-oscila', pergunta: 'A acurácia oscila 5 a 10 pp entre execuções sem mudança. O que fazer?',
        opcoes: [
          opc('a', 'Repetir com desenho controlado, manter pares e versão, quantificar a incerteza e escolher n pelo efeito mínimo relevante; se não resolver a decisão, registrar inconclusivo', true, 'a oscilação vem da amostragem do modelo, da composição dos casos ou do ambiente.'),
          opc('b', 'Usar a execução mais alta como resultado', false, 'seleção enviesada do melhor resultado.'),
          opc('c', 'Ignorar: o modelo é assim', false, 'sem quantificar, o gate vira loteria.')] },
      { id: 'm06cp-gate', pergunta: 'O gate reprova toda semana sem motivo e o time começa a ignorar. Qual o conserto?',
        opcoes: [
          opc('a', 'Tolerância relativa (2 pp) para qualidade, piso absoluto só em segurança, custo e latência apenas avisam', true, 'o limiar absoluto e apertado era a causa: o sistema não é determinístico.'),
          opc('b', 'Desligar o gate', false, 'regra inegociável vira exit code, não some.'),
          opc('c', 'Exigir exatamente a baseline em tudo', false, 'é o limiar que causou o problema.')] },
      { id: 'm06cp-registry', pergunta: 'Resultados de eval de meses atrás não são comparáveis. Qual o conserto?',
        opcoes: [
          opc('a', 'Registry imutável, e prompt_tag e gen_ai.response.model gravados em todo resultado', true, 'prompt editado no lugar ou versão de modelo não registrada tornam a comparação impossível.'),
          opc('b', 'Reexecutar tudo todo dia', false, 'caro e não resolve a falta de registro.'),
          opc('c', 'Guardar o prompt no wiki', false, 'sem versão imutável ligada ao resultado, continua incomparável.')] },
      { id: 'm06cp-barato', pergunta: 'Trocamos para o modelo barato "porque o teste deu igual" e a qualidade caiu. Qual a causa e o conserto?',
        opcoes: [
          opc('a', 'Poucos casos e uma execução por caso: diferença não distinguível de ruído lida como empate; use 20 a 50 casos, k = 3 a 5, pass^k, custo por sucesso, McNemar e regra de decisão escrita antes', true, 'pass@1 esconde a instabilidade.'),
          opc('b', 'O modelo barato é sempre pior', false, 'com verificação automática o barato com retry costuma ganhar.'),
          opc('c', 'Faltou um juiz-LLM', false, 'o problema é amostra e desenho, não falta de juiz.')] }
    ],
    abas: [
      { rotulo: 'Datasets, graders e decisão', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que basta. Reprovar é permitido: volte ao bloco indicado e tente de novo. A <strong>P1</strong> é a prova principal: apresente como se eu fosse um gestor não técnico, e eu vou perguntar "e daí?" até chegar em dinheiro ou risco.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: a primeira frase',
          pergunta: 'Você vai apresentar a versão B do prompt para um gestor não técnico. Qual é a primeira frase?',
          opcoes: [
            { id: 'a', texto: '"Recomendo trocar para a versão B: reduz em 40% os relatórios com achado inventado, a R$ 0,02 a mais por análise."', correta: true, porque: 'decisão primeiro, em uma frase, com ganho e custo.' },
            { id: 'b', texto: '"Rodei 300 casos em seis categorias com um juiz calibrado contra rótulos humanos."', correta: false, porque: 'é evidência; vai no anexo e só se perguntarem.' },
            { id: 'c', texto: '"A acurácia subiu 12 pp."', correta: false, porque: 'não é linguagem de usuário nem de negócio.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · A versão B para um gestor', obrigatorio: false,
          enunciado: 'Apresente, para um gestor não técnico, por que a versão B do seu prompt é melhor que a A. Com números, em linguagem de negócio, com o custo e o risco declarados. <em>Bloco 6.</em>',
          placeholder: 'Recomendo… Para o usuário muda… Custa… O risco é… A evidência está…',
          rubrica: [
            '<strong>Decisão primeiro</strong>, em uma frase.',
            'Efeito em <strong>linguagem de usuário</strong> ("em cada 10 análises, deixa de ver 1,2 alerta falso"), não em pontos de acurácia.',
            '<strong>Custo em dinheiro e por unidade de negócio</strong> (por análise, por cliente, como fração do plano).',
            '<strong>Risco e plano B</strong>, incluindo o que a B ainda não resolve e o rollback.',
            '<strong>Evidência no anexo</strong>, só se perguntarem.'
          ],
          modelo: '<p>Recomendo trocar para a versão B: ela reduz em 40% os relatórios com achado inventado, ao custo de R$ 0,02 a mais por análise. Para o cliente, em cada 10 análises, deixa de ver 1,2 alerta falso. Com 60 análises por mês por cliente, são R$ 1,20, ou 1,2% do plano de R$ 99. O risco: a B ainda não melhora a resistência a comentário adversarial (80%), que é o próximo trabalho; o rollback é mudar uma configuração, sem deploy. A matriz de resultados está no anexo, se quiserem ver.</p>' + reprova('começar pela metodologia, ou falar "a acurácia subiu 12 pp" sem traduzir em usuário e dinheiro.') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Regressão comportamental', obrigatorio: false,
          enunciado: 'Explique regressão comportamental com o cenário completo e diga por que um dataset único não a detecta. Cite as seis categorias e o que cada uma protege. <em>Blocos 1, 2 e 4.</em>',
          placeholder: 'A regressão comportamental é… O cenário… Um dataset único não vê porque… As categorias…',
          rubrica: [
            'Conta o <strong>cenário completo</strong>: um ajuste de prompt conserta o caso reclamado e <strong>degrada comportamentos que ninguém testou</strong> (perde a abstenção, classifica tudo como risco alto, cita linhas inexistentes).',
            'Explica a causa: <strong>mudança é global</strong>, e o teste do caso consertado não vê o resto; um dataset único também esconde a queda localizada numa média.',
            'Cita as <strong>seis categorias</strong> e o que cada uma protege: golden path (a tarefa central), fora de escopo (recusar o que deve), prompt injection (não obedecer dado de terceiro), segurança/vazamento (não revelar dado de outro tenant), ação destrutiva (pedir aprovação) e casos de borda (o que já quebrou).',
            'Liga ao <strong>relatório por categoria</strong> e à baseline.'
          ],
          modelo: '<p>Seu extrator está na v14, um cliente reclama de SQL embutido e você ajusta o prompt. O caso que falhava passa e você faz o deploy. Semanas depois, o extrator lista achados em DTOs triviais, classifica quase tudo como risco alto e cita linhas inexistentes. Nada disso tem relação óbvia com a mudança, e nenhum teste do caso consertado pegaria: mudança é global. Isso é regressão comportamental, e um dataset único não a vê porque a média esconde a queda localizada. A defesa são as seis categorias: golden path (a tarefa central), fora de escopo (continuar recusando), prompt injection (não obedecer dado de terceiro), segurança e vazamento (não revelar dado de outro tenant), ação destrutiva (pedir aprovação) e casos de borda (o que já quebrou), com relatório por categoria contra a baseline.</p>' + reprova('"um dataset grande resolve" ou listar categorias sem dizer o que cada uma protege.') },

        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Testes unitários não bastam', obrigatorio: false,
          enunciado: 'Em que situações testes unitários são insuficientes para avaliar o comportamento variável de um LLM? Cite as três propriedades do sistema e explique como evals complementam os testes unitários sem substituir os invariantes determinísticos do runtime. <em>Bloco 1.</em>',
          placeholder: 'As três propriedades são… Testes unitários falham quando… Evals complementam…',
          rubrica: [
            'Nomeia as <strong>três propriedades</strong>: a saída não é única, não é determinística (nem com <code>temperature=0</code>) e a mudança é global.',
            'Mostra o que cada uma quebra: <code>assertEqual</code> em texto, a reprodutibilidade exata e o isolamento da pirâmide de testes.',
            'Evals medem <strong>distribuição de comportamento</strong>; testes unitários continuam para os <strong>invariantes determinísticos</strong> (schema, limites, roteamento, guardrails).',
            'Diz que um <strong>não substitui o outro</strong>.'
          ],
          modelo: '<p>Três propriedades quebram o instinto do teste unitário. A saída não é única: "valida CPF" e "faz validação de CPF" são igualmente corretos, então <code>assertEqual</code> em texto falha. Não é determinística, nem com <code>temperature=0</code>, então a premissa de reprodutibilidade exata cai e se mede uma <em>taxa</em> sobre um conjunto. E a mudança é global: uma frase do prompt afeta todos os comportamentos, o que quebra o isolamento e pede uma suíte por categoria rodada inteira a cada mudança. Evals medem essa distribuição; os testes unitários continuam necessários para os invariantes determinísticos do runtime (schema, limites, roteamento, guardrails). Um complementa o outro.</p>' + reprova('"evals substituem os testes unitários".') },

        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · A escada de graders', obrigatorio: false,
          enunciado: 'A escada de graders: dê um exemplo do SEU produto para cada degrau e justifique por que não subiu um degrau a mais em cada caso. <em>Bloco 3.</em>',
          placeholder: 'Determinístico: … Estatístico: … LLM-as-judge: …',
          rubrica: [
            'Um exemplo <strong>concreto</strong> para cada degrau: determinístico, estatístico/semântico, LLM-as-judge (e humano, quando couber).',
            'A regra: <strong>só suba um degrau quando o inferior não consegue decidir</strong>.',
            'Justifica por que não subiu: custo, não determinismo e necessidade de calibração do degrau seguinte.',
            'Para o grader de fato ("a linha existe no arquivo"), usa o <strong>determinístico</strong>.'
          ],
          modelo: '<p>No meu produto, "a linha citada existe no arquivo" é determinístico: uma busca decide, então não preciso de modelo. "O resumo se parece com o de referência" é estatístico/semântico: similaridade de embedding ou sobreposição de palavras-chave sobre um limiar, barato, mas que mede parecença e não correção. "A explicação do achado é útil para quem vai corrigir" é LLM-as-judge, porque é subjetivo e não dá para escrever um teste; usaria rubrica binária, de outro modelo que o avaliado, calibrada contra rótulos humanos. Em cada caso, não subi porque o degrau seguinte custa mais, varia e exige calibração.</p>' + reprova('usar juiz-LLM para o que uma busca decide.') },

        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Vieses do juiz e proveniência', obrigatorio: false,
          enunciado: 'Cite três vieses do LLM-as-judge e a mitigação de cada um. Se houver referências humanas disponíveis, como você registraria sua proveniência, composição, concordância total e por classe, e por que publicaria esses limites? <em>Bloco 3.</em>',
          placeholder: 'Vieses e mitigações… Proveniência… Concordância…',
          rubrica: [
            'Três <strong>vieses</strong> com a <strong>mitigação</strong> de cada um: posição (rodar nas duas ordens), verbosidade (rubrica que penaliza texto sem evidência), auto-preferência (juiz de família diferente) ou raciocínio limitado (conta é grader determinístico).',
            'Registra a <strong>proveniência</strong> (quem rotulou, quando, com que instrução) e a <strong>composição</strong> do conjunto.',
            'Mede <strong>concordância total e por classe</strong>, não só a média.',
            'Publica os limites: o conjunto roteirizado do laboratório verifica o <strong>comportamento do laboratório</strong>, não certifica juiz real.'
          ],
          modelo: '<p>Três vieses: de posição (rodo nas duas ordens e só conto vitória consistente), de verbosidade (rubrica que penaliza texto sem evidência) e de auto-preferência (juiz de família diferente do avaliado, nunca o mesmo modelo). Com referências humanas, registro quem rotulou, quando, com que instrução e a composição por classe; meço a concordância total e por classe, porque a média esconde uma classe em que o juiz erra. Publico esses limites: o limiar local de 85% do laboratório prova o comportamento do laboratório, não certifica um juiz real.</p>' + reprova('"o juiz é imparcial" ou reportar só a concordância média.') },
        { tipo: 'takeaway', html: 'Datasets em <mark>seis categorias</mark>, graders no <mark>menor degrau</mark> que decide e decisão por <mark>categoria</mark>, não por média.' }
      ] },

      { rotulo: 'Gate, estatística e produção', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p6', titulo: 'P6 · Aquecimento: o que cada limiar protege',
          pergunta: 'Qual combinação de limiares o bloco 6 recomenda?',
          opcoes: [
            { id: 'a', texto: 'Tolerância relativa em qualidade, piso absoluto em segurança, alerta sem bloqueio em custo e latência.', correta: true, porque: 'qualidade oscila; segurança não negocia; custo pode ser decisão consciente.' },
            { id: 'b', texto: 'Piso absoluto em tudo.', correta: false, porque: 'o time desliga o gate na terceira reprovação sem motivo.' },
            { id: 'c', texto: 'Tolerância relativa em tudo, inclusive segurança.', correta: false, porque: 'um caso de injection que passa viraria dano aceito.' }
          ] },
        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Banda na qualidade, piso na segurança', obrigatorio: false,
          enunciado: 'Por que o gate usa tolerância relativa em qualidade e piso absoluto em segurança? O que aconteceria com cada um dos dois se invertesse? <em>Bloco 6.</em>',
          placeholder: 'Qualidade usa banda porque… Segurança usa piso porque… Se invertesse…',
          rubrica: [
            'Qualidade <strong>oscila sozinha</strong> (91% hoje, 89% amanhã), então pede <strong>banda contra a baseline</strong> (2 pp).',
            'Segurança <strong>não negocia</strong>: piso absoluto, idealmente 100%; um caso que passa é bloqueio de merge.',
            'Invertido: piso em qualidade reprova toda semana e o <strong>time desliga o gate</strong>; banda em segurança deixa uma regressão de injection <strong>entrar</strong>.',
            'Custo e latência apenas <strong>avisam</strong>.'
          ],
          modelo: '<p>A taxa de qualidade oscila sozinha por causa do não determinismo, então reprovar por valor exato faria o gate cair toda semana; a banda de 2 pp contra a baseline absorve o ruído. Segurança não tem esse luxo: injection ou vazamento que passa é dano, então o piso é absoluto, idealmente 100%. Se invertesse, o piso em qualidade faria o time desligar o gate, e a banda em segurança deixaria uma queda de 2 pp em injection entrar. Custo e latência só avisam, porque a subida pode ser decisão consciente.</p>' + reprova('"limiar igual para todas as categorias".') },

        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · 80% para 87% em 15 casos', obrigatorio: false,
          enunciado: 'Sua suíte tem 15 casos numa categoria e a acurácia observada foi de 80% para 87%. Declare que informações faltam (contagens, pareamento, amostragem, aleatoriedade, efeito relevante, alfa e poder); classifique a decisão como sustentada, rejeitada ou inconclusiva pelo método que escolher. Explique que nova evidência mudaria a decisão e por que não detectar diferença não prova equivalência. <em>Blocos 1 e 7.</em>',
          placeholder: 'Faltam… O método que escolho é… A decisão é… Mudaria se…',
          rubrica: [
            'Pede as <strong>contagens</strong> (12 de 15 contra 13 de 15: uma diferença de <strong>um caso</strong>) e se os casos são <strong>pareados</strong>.',
            'Pergunta pela <strong>amostragem</strong> dos casos, pela <strong>aleatoriedade</strong> do modelo (repetições), pelo <strong>efeito mínimo relevante</strong>, pelo <strong>alfa</strong> e pelo <strong>poder</strong>.',
            'Classifica como <strong>inconclusiva</strong> (um caso a mais está dentro do ruído; o intervalo de 15 casos é largo).',
            'Diz que <strong>mais casos, mais repetições ou mais discordâncias pareadas</strong> mudariam a decisão.',
            '<strong>Não detectar diferença não prova equivalência</strong>: é falta de poder, "ainda não sei".'
          ],
          modelo: '<p>80% e 87% em 15 casos são 12 e 13 acertos: a diferença é um único caso. Preciso saber se os casos são os mesmos nas duas versões (pareados), como foram escolhidos, quantas repetições por caso (aleatoriedade do modelo), qual o menor efeito que importa, o alfa e o poder desejados. Com o que há, a decisão é inconclusiva: o intervalo de 15 casos é largo e um caso cabe inteiro no ruído; no pareado, um placar de poucas discordâncias dá p alto. Mudaria com mais casos (20 a 50), repetições (k = 3 a 5) ou mais discordâncias pareadas. E não detectar diferença não prova que as versões são equivalentes: a suíte não tinha poder para ver.</p>' + reprova('"subiu 7 pontos, aprovado" ou "não deu significativo, então são iguais".') },

        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · O nightly reprovou sem commit', obrigatorio: false,
          enunciado: 'O nightly reprovou sem nenhum commit no repositório. Liste as causas possíveis, em ordem de probabilidade, e como você investiga cada uma. <em>Blocos 4, 5 e 6.</em>',
          placeholder: 'Causas em ordem… Como investigo cada uma…',
          rubrica: [
            '<strong>O provedor mudou o modelo por trás do alias</strong>: confere <code>gen_ai.response.model</code> no trace; pinna a versão.',
            '<strong>Degradação do serviço ou fallback acionando mais</strong>: taxa de fallback, 429 e erro por provedor no painel.',
            '<strong>Não determinismo</strong> (a oscilação normal): repete sem cache e olha a variação por caso.',
            'Dado ou ambiente mudou (dataset, dependência, cache de eval escondendo variação).',
            'Registra a causa e <strong>só depois decide</strong> sobre a baseline.'
          ],
          modelo: '<p>Em ordem de probabilidade: (1) o provedor atualizou o modelo por trás do alias: olho o <code>gen_ai.response.model</code> do trace do nightly, comparo com o da última execução e pinno a versão; (2) degradação do serviço ou fallback acionando mais: painel de taxa de fallback, 429 e erro por provedor; (3) o ruído normal do não determinismo: repito sem cache e comparo a variação por caso; (4) mudança de ambiente ou de dados, ou o cache escondendo variação. Registro a causa e só então decido se reavalio a baseline.</p>' + reprova('"rodar de novo até passar" ou baixar o limiar.') },

        { tipo: 'escreva', id: 'cp-p9', titulo: 'P9 · O que logar em produção', obrigatorio: false,
          enunciado: 'O que você loga e o que não loga em produção, e por quê? Como depura uma falha sem ter o conteúdo do prompt? <em>Bloco 5.</em>',
          placeholder: 'Loga… Não loga… Depuro com…',
          rubrica: [
            '<strong>Metadados sempre</strong>: tokens, custo, latência, prompt_tag, modelo, finish_reason, hash do input.',
            '<strong>Conteúdo nunca</strong> em produção: o prompt contém código do cliente. Exceção: consentimento por tenant, retenção curta (7 a 30 dias) e mascaramento.',
            '<strong>Hash do input</strong> para correlacionar falhas repetidas sem guardar a entrada; trace para a estrutura causal.',
            '<strong>tenant_id</strong>, nunca nome ou e-mail; instrumentação na fronteira (gateway).',
            'Traz a falha para o dataset (dado sintético ou anonimizado).'
          ],
          modelo: '<p>Em produção loga metadados sempre: tokens, custo, latência, prompt_tag, modelo realmente usado, finish_reason e o hash do input. Conteúdo, nunca, porque o prompt carrega código do cliente; a exceção é consentimento explícito por tenant, com retenção curta, mascaramento e consentimento registrado. Sem o conteúdo, depuro pelo trace (onde foi o tempo, o dinheiro, o cache, qual versão) e pelo hash, que mostra "47 falhas com a mesma entrada" sem guardar a entrada. A identidade é o tenant_id, nunca nome ou e-mail. A falha vira caso de dataset com dado sintético ou anonimizado.</p>' + reprova('"logar tudo e mascarar depois".') },

        { tipo: 'texto', html:
          '<h3>Entregáveis verificados (mostrar rodando)</h3>' +
          '<ol><li>Gates verdes: <code>ruff</code>, <code>format</code>, <code>mypy --strict</code>, <code>pytest</code> do laboratório.</li>' +
          '<li>Datasets nas seis categorias com caso deprecated excluído; todo tipo com grader; mutante pego.</li>' +
          '<li>Juiz do laboratório supera o limiar local de 85% contra rótulos roteirizados; juiz sempre-sim rejeitado antes do uso.</li>' +
          '<li>Runner com regressão v1 para v2 visível por categoria; relatório salvo como baseline.</li>' +
          '<li>Registry com 2 versões e CHANGELOG; gate reprovando queda e piso, avisando custo; tracing sem vazamento.</li></ol>' },
        { tipo: 'takeaway', html: 'Em cada resposta: a <mark>decisão</mark> primeiro, o número com sua <mark>incerteza</mark> e o <mark>risco</mark> declarado.' }
      ] }
    ]
  });
})();
