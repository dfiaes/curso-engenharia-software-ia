/* M08 · Checkpoint: nove cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada (com "Reprova"). Fonte: M08.html#checkpoint-m08 e #diagnostico-m08. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm08-checkpoint',
    titulo: 'Checkpoint M08',
    minutos: 60,
    resumo: 'Nove cenários sobre agentes e context engineering, sem consulta. A P1, sobre as ferramentas do seu agente, é a prova principal.',
    objetivo: 'Verificar, sem consulta, se você escolhe workflow ou agente com critério, projeta ferramentas e contexto, para o loop com resposta parcial útil, distingue fato de observação e decide multi-agente e framework com números.',
    revisao: [
      { id: 'm08cp-repete', pergunta: 'O agente repete a mesma busca várias vezes e não avança. Causa e conserto?',
        opcoes: [
          opc('a', 'Loop estéril: a ferramenta devolve algo inútil e ele tenta de novo igual. Contador de assinatura de chamada (b5) + erro acionável que sugira o próximo passo (b3)', true, 'o contador interrompe; o erro que ensina evita a repetição.'),
          opc('b', 'O modelo está com pouca temperatura; aumentar o teto de passos', false, 'aumentar o teto alimenta a fatura aberta.'),
          opc('c', 'Falta de memória episódica', false, 'o sintoma é de dentro de uma execução.')] },
      { id: 'm08cp-custo', pergunta: 'O custo por execução explode em algumas perguntas. Causa e conserto?',
        opcoes: [
          opc('a', 'Histórico crescendo e saídas de ferramenta grandes reenviadas a cada passo: compactação (b4), truncamento com faixa de linhas (b3), prompt caching (M05 b5) e orçamento de custo (b5)', true, 'a saída crua grande é o vilão silencioso do contexto.'),
          opc('b', 'O modelo é caro demais; trocar de provedor', false, 'não ataca o crescimento do contexto.'),
          opc('c', 'Faltam ferramentas; adicionar mais', false, 'mais ferramentas aumentam seleção errada e custo.')] },
      { id: 'm08cp-passos', pergunta: 'O agente estoura o orçamento de passos sempre nas mesmas perguntas. Qual o conserto?',
        opcoes: [
          opc('a', 'Identificar a classe: se for estrutural/transitiva, é o M10; marcar como esperado_falhar em vez de subir o teto', true, 'a classe de pergunta é o que as ferramentas atuais não respondem.'),
          opc('b', 'Subir o teto de passos', false, 'transforma o problema em fatura aberta.'),
          opc('c', 'Trocar o prompt por um mais longo', false, 'não cria a ferramenta que falta.')] },
      { id: 'm08cp-compactou', pergunta: 'Depois de compactar o contexto, a resposta piorou. Qual o conserto?',
        opcoes: [
          opc('a', 'Prompt de compactação explícito sobre o que preservar (b4): fatos + arquivo:linha primeiro', true, 'o resumo descartou fatos com evidência e guardou raciocínio.'),
          opc('b', 'Nunca compactar', false, 'compactação é uma das três técnicas de horizonte longo.'),
          opc('c', 'Aumentar a janela de contexto', false, 'mais contexto também pode piorar: é orçamento de atenção.')] },
      { id: 'm08cp-framework', pergunta: 'Adotou um framework e o cache de prompt parou de funcionar. Qual a causa e o conserto?',
        opcoes: [
          opc('a', 'O framework remonta as mensagens em ordem diferente, quebrando o prefixo byte a byte: capturar o payload real (b7), fixar a ordem ou manter o gateway próprio no caminho crítico', true, 'transparência do prompt final é o que permite achar isso.'),
          opc('b', 'O cache do provedor expira por padrão', false, 'o sintoma surgiu com a adoção.'),
          opc('c', 'O framework usa um modelo diferente', false, 'modelo não quebra o prefixo.')] }
    ],
    abas: [
      { rotulo: 'Ferramentas, padrões e contexto', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. A rubrica diz o que <strong>basta</strong>; o modelo mostra a resposta esperada e o que reprova. A <strong>P1</strong> é a prova principal e usa os números do seu laboratório. Reprovar é permitido: volte ao bloco indicado e refaça.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: a décima ferramenta',
          pergunta: 'O agente tem nove ferramentas e alguém propõe uma décima que se sobrepõe parcialmente a uma existente. O que você espera medir?',
          opcoes: [
            { id: 'a', texto: 'Mais seleção errada, mais passos e mais custo, porque o modelo passa a hesitar entre ferramentas parecidas.', correta: true, porque: 'poucas ferramentas de alto impacto, com namespace e descrição "use quando / não use quando", é o princípio do bloco 3.' },
            { id: 'b', texto: 'Nada: mais ferramentas sempre ajudam.', correta: false, porque: 'ferramentas sobrepostas competem na seleção.' },
            { id: 'c', texto: 'Menos custo, porque cada ferramenta é mais específica.', correta: false, porque: 'o custo sobe com a seleção errada e as descrições no contexto.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Cada ferramenta e a décima redundante', obrigatorio: false,
          enunciado: 'Justifique cada ferramenta do seu agente (por que existe, por que não foi fundida com outra) e demonstre o efeito de adicionar uma décima ferramenta redundante, com números de seleção errada, passos e custo. <em>Bloco 3 e bloco 8.</em>',
          placeholder: 'Ferramenta 1: existe porque… não foi fundida com… A décima: …',
          rubrica: [
            'Cada ferramenta tem <strong>uma razão de existir</strong> e uma razão de <strong>não fundir</strong> com outra.',
            'Cita os princípios: <strong>poucas e de alto impacto</strong>, <strong>namespacing</strong>, descrição "<strong>use quando / não use quando</strong>", erro acionável e truncamento com instrução.',
            'Mostra a décima <strong>redundante</strong> no eval, com <strong>números</strong> de seleção errada, passos e custo, antes e depois.',
            'Conclui consolidando ou removendo, e <strong>não</strong> adicionando mais ferramentas.'
          ],
          modelo: '<p>Cada ferramenta do investigador tem um papel único: <code>repo_buscar_simbolo</code> localiza definição e usos exatos; <code>repo_buscar_conceito</code> cobre a busca híbrida do M07 quando não há identificador; <code>repo_ler_trecho</code> lê só uma faixa de linhas; <code>repo_listar_referencias</code> lista chamadores; <code>notas_registrar</code> grava fatos com evidência. Não foram fundidas porque devolvem formatos e pedem argumentos diferentes, e cada uma tem descrição "use quando / não use quando", schema, erro acionável e truncamento com instrução. Ao adicionar uma décima que repete a busca por símbolo, o eval com os mesmos casos mostra mais seleção errada, mais passos e mais custo (números do meu laboratório, antes e depois). Conclusão: consolidar, não somar.</p>' +
            reprova('descrever as ferramentas sem justificar a não fusão; ou afirmar o efeito da décima sem número medido.') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Workflow × agente', obrigatorio: false,
          enunciado: 'Dê a definição operacional de workflow e de agente, as três perguntas do critério, e classifique três tarefas do Capstone justificando. <em>Bloco 1.</em>',
          placeholder: 'Workflow é… Agente é… As três perguntas são… Tarefa A: …',
          rubrica: [
            'Workflow: o <strong>código</strong> decide o próximo passo (caminho predefinido). Agente: o <strong>modelo</strong> decide, a cada volta, dentro de limites.',
            'As três perguntas: sei quantos passos? sei as ferramentas e a ordem antes de começar? o caminho é o mesmo para toda entrada?',
            'Três "sim" (ou roteamento) = <strong>workflow</strong>.',
            'Classifica as <strong>três tarefas</strong> com justificativa pelas perguntas, e trata agente como escolha de arquitetura com custo.'
          ],
          modelo: '<p>No workflow, o código decide o próximo passo e o caminho é predefinido; no agente, o modelo escolhe o caminho a cada volta, dentro de limites. Perguntas: sei quantos passos haverá? sei ferramentas e ordem de antemão? o caminho é o mesmo para toda entrada? Três "sim", ou roteamento, indicam workflow. Exemplos: extrair campos de um documento com passos fixos é workflow; "o que quebra se eu mudar esta assinatura" tem número de saltos desconhecido e caminho dependente da entrada, então é agente; classificar e rotear a pergunta antes de escolher o caminho é um workflow com roteamento. Agente é escolha de arquitetura com custo, não o topo de uma escala.</p>' +
            reprova('tratar agente como "versão avançada" de workflow, ou classificar sem aplicar as três perguntas.') },

        { tipo: 'escolha', id: 'cp-esc-p3', titulo: 'P3 · Aquecimento: voting',
          pergunta: 'Por que votar com o mesmo prompt em temperatura 0 é ilusório?',
          opcoes: [
            { id: 'a', texto: 'Dá quase sempre a mesma resposta: o consenso não carrega informação nova. Use prompts diferentes e só onde o erro é caro.', correta: true, porque: 'voting só ajuda com diversidade real, e custa N chamadas.' },
            { id: 'b', texto: 'Porque temperatura 0 torna o modelo mais lento.', correta: false, porque: 'não é questão de velocidade.' },
            { id: 'c', texto: 'Porque votar exige multi-agente.', correta: false, porque: 'voting é um padrão do bloco 2, dentro da parallelization.' }
          ] },
        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Os cinco padrões', obrigatorio: false,
          enunciado: 'Cite os cinco padrões compostáveis, quando usar cada um, e o risco específico de voting e de evaluator-optimizer. <em>Bloco 2.</em>',
          placeholder: 'Chaining… Routing… Parallelization… Orchestrator-workers… Evaluator-optimizer…',
          rubrica: [
            'Os cinco: <strong>chaining</strong>, <strong>routing</strong>, <strong>parallelization</strong> (sectioning/voting), <strong>orchestrator-workers</strong>, <strong>evaluator-optimizer</strong>.',
            'Quando usar cada um, em uma frase.',
            'Risco do <strong>voting</strong>: mesmo prompt em temperatura 0 não traz informação nova; custo de N chamadas.',
            'Risco do <strong>evaluator-optimizer</strong>, com critério de parada e <strong>gates determinísticos</strong> entre passos como mitigação.'
          ],
          modelo: '<p>Chaining decompõe em passos fixos; routing classifica a entrada e escolhe o caminho; parallelization roda em paralelo (sectioning para partes independentes, voting para repetir a mesma tarefa); orchestrator-workers deixa um coordenador decompor dinamicamente; evaluator-optimizer gera, avalia e refina. Voting com o mesmo prompt em temperatura 0 dá o mesmo resultado e só custa mais, então deve usar prompts diferentes e só onde o erro é caro. O evaluator-optimizer precisa de critério de parada claro e gates determinísticos, ou refina sem convergir.</p>' +
            reprova('listar nomes sem quando usar, ou omitir o risco específico de voting e de evaluator-optimizer.') },

        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Três simplificações erradas', obrigatorio: false,
          enunciado: 'Corrija as três simplificações ("agente é não determinístico", "framework torna determinístico", "prompt é o código do agente") como você faria numa conversa com um colega.',
          placeholder: '"Agente é não determinístico" é impreciso porque… "Framework torna determinístico" …',
          rubrica: [
            'Não determinismo é do <strong>modelo</strong>; o <strong>loop, as ferramentas, os orçamentos e as paradas</strong> são código determinístico e testável.',
            'Framework <strong>não elimina</strong> a variância do modelo e ainda <strong>esconde o prompt final</strong>.',
            'Prompt é <strong>um</strong> componente: o agente é loop + ferramentas + contexto + política, e a política (aprovação, parada) <strong>não pode morar só no prompt</strong>.',
            'Tom de conversa, com exemplo concreto.'
          ],
          modelo: '<p>"Agente é não determinístico": só a escolha do modelo varia; o loop, o orçamento, a autorização e as condições de parada são código meu, determinístico e testável (inclusive com modelo falso). "Framework torna determinístico": ele não muda o modelo, e ainda pode esconder o prompt final, o que dificulta depurar. "Prompt é o código do agente": o prompt é um dos componentes; o resto é loop, ferramentas, contexto e política, e regras como aprovação humana precisam ser mecanismo no runtime, não pedido no prompt.</p>' +
            reprova('concordar com alguma das três, ou corrigir sem separar o que é modelo do que é código.') },
        { tipo: 'takeaway', html: 'Ferramentas <mark>poucas e justificadas</mark>, padrões com <mark>risco nomeado</mark>, e o que é código <mark>separado</mark> do que é modelo.' }
      ] },

      { rotulo: 'Loop, memória e decisão', blocos: [
        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Contexto é orçamento de atenção', obrigatorio: false,
          enunciado: 'Explique o mecanismo (por que mais contexto pode piorar), onde o seu agente gasta contexto e as três técnicas de horizonte longo. <em>Bloco 4.</em>',
          placeholder: 'Mais contexto piora porque… Meu agente gasta contexto em… As três técnicas são…',
          rubrica: [
            'O mecanismo: atenção é <strong>orçamento finito</strong>; tokens de baixo sinal competem com os de alto sinal e diluem o que importa.',
            'Onde o agente gasta contexto: sobretudo <strong>saída de ferramenta</strong> crua e histórico reenviado a cada passo.',
            'As três técnicas: <strong>compactação</strong> (preservando decisões e fatos), <strong>notas estruturadas</strong> em disco e <strong>subagentes</strong> devolvendo resumo de 1 a 2 mil tokens.',
            'Definição operacional: o <strong>conjunto mínimo de tokens de alto sinal</strong> que maximiza o comportamento desejado.'
          ],
          modelo: '<p>Contexto é curadoria sob restrição: o conjunto mínimo de tokens de alto sinal que maximiza o comportamento desejado. Mais contexto pode piorar porque a atenção do modelo é um orçamento finito e o ruído dilui o que importa. No meu agente, o maior gasto é saída de ferramenta e o histórico reenviado a cada passo. Para horizontes longos uso compactação (preservando fatos com arquivo:linha), notas estruturadas em disco e subagentes que devolvem 1 a 2 mil tokens de resumo.</p>' +
            reprova('dizer que "mais contexto é sempre melhor", ou citar técnicas sem dizer o que cada uma preserva.') },

        { tipo: 'escolha', id: 'cp-esc-p6', titulo: 'P6 · Aquecimento: parcial ou erro',
          pergunta: 'O orçamento de custo acabou depois de quatro fatos com evidência. Qual retorno é correto?',
          opcoes: [
            { id: 'a', texto: 'Resposta parcial marcada como tal, com os fatos e o que faltou verificar.', correta: true, porque: 'parcial honesta > vazia > inventada; as notas do bloco 4 é que a tornam possível.' },
            { id: 'b', texto: '"Não consegui".', correta: false, porque: 'desperdiça os fatos apurados.' },
            { id: 'c', texto: 'A conclusão mais provável, como final.', correta: false, porque: 'é a resposta inventada.' }
          ] },
        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Os sete critérios de parada', obrigatorio: false,
          enunciado: 'Liste os sete critérios de parada do seu loop e o que o sistema devolve em cada um. Por que resposta parcial é melhor que erro genérico, e o que a torna possível? <em>Bloco 5.</em>',
          placeholder: 'Sucesso: … Passos: … Custo: … Tempo: … Loop estéril: … Erro irrecuperável: … Requer humano: …',
          rubrica: [
            'Os sete: <strong>sucesso, passos, custo, tempo, loop estéril, erro irrecuperável, requer humano</strong>.',
            'O que devolve: <strong>parcial</strong> nos três orçamentos e no loop estéril (este com diagnóstico), <strong>erro claro</strong> no irrecuperável, <strong>pausa para aprovação</strong> no humano.',
            'Parcial &gt; vazia &gt; inventada: parcial <strong>aproveita o que foi apurado</strong>.',
            'O que a torna possível: as <strong>notas estruturadas</strong> (fatos com evidência) registradas ao longo da execução.'
          ],
          modelo: '<p>Sucesso: resposta final validada pelo schema. Passos, custo e tempo: resposta parcial com o que foi apurado (custo vira incidente). Loop estéril (mesma chamada repetida N vezes ou sem fato novo): interrompe com diagnóstico e parcial. Erro irrecuperável: aborta com erro claro. Requer humano: pausa e pede aprovação, por política em código. Parcial é melhor que erro genérico porque aproveita tudo o que foi apurado, e só é possível porque os fatos foram registrados em notas durante a execução; a ordem é completa, parcial, "não encontrei", inventada.</p>' +
            reprova('devolver vazio ou erro genérico em algum estouro, ou deixar a aprovação como instrução de prompt.') },

        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Observação × fato durável', obrigatorio: false,
          enunciado: 'Dê um exemplo de observação e um de fato durável no seu produto e explique o que invalida o fato. <em>Bloco 6.</em>',
          placeholder: 'Observação: … Fato durável: … O que invalida: …',
          rubrica: [
            'Observação temporária: vale nesta execução (por exemplo, "a busca devolveu 12 resultados"); <strong>não vira memória</strong>.',
            'Fato durável com <strong>evidência</strong> (arquivo:linha) e <strong>commit de referência</strong>.',
            'O que invalida: <strong>mudança nos arquivos citados</strong> (o commit mudou); a invalidação <strong>marca</strong>, não apaga.',
            'Memória como <strong>cache com política</strong>: servir fato velho gera afirmação confiante e errada.'
          ],
          modelo: '<p>Observação: "o arquivo tem 400 linhas", que só vale nesta execução. Fato durável: "fechar_pedido chama calcular_total", com evidência loja.py:19 e o commit em que foi estabelecido. O fato deixa de valer quando o arquivo citado muda: a ingestão incremental marca <code>invalidado_em</code> (sem apagar, para auditoria). Sem essa política, a memória serve dado velho com confiança, que é pior que erro.</p>' +
            reprova('gravar observação como fato, ou fato sem evidência e sem gatilho de invalidação.') },

        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · Multi-agente', obrigatorio: false,
          enunciado: 'Quais são as duas justificativas legítimas, quais os custos escondidos e o que os seus números disseram na comparação? <em>Bloco 6.</em>',
          placeholder: 'Justificativas: … Custos escondidos: … Meus números: …',
          rubrica: [
            'As duas justificativas: <strong>isolamento de contexto</strong> e <strong>paralelismo real</strong>.',
            'Os custos: <strong>tokens multiplicados</strong>, <strong>perda na fronteira</strong>, <strong>N traces</strong> e <strong>coordenação</strong> (decomposição ruim).',
            'O teste honesto: independentes? o resumo de 1 a 2 mil tokens basta? você <strong>mediu</strong> que o agente único falha por contexto?',
            'Cita os <strong>números do próprio laboratório</strong> (menos pico, mais custo total, por carga).'
          ],
          modelo: '<p>Duas justificativas: isolamento de contexto (o subagente lê dezenas de milhares de tokens e devolve 1 a 2 mil) e paralelismo real de tarefas independentes. Custos escondidos: tokens multiplicados, perda de informação no resumo, vários traces para depurar e coordenação. Antes de adotar, pergunto se as subtarefas são independentes, se o resumo basta e se medi que o agente único falha por contexto. Nos meus números, o subagente reduziu o pico de contexto e aumentou o custo total, e por isso só vale onde o pico justifica.</p>' +
            reprova('defender multi-agente sem medição, ou citar benefícios sem custos.') },

        { tipo: 'escreva', id: 'cp-p9', titulo: 'P9 · Agente × workflow, com números', obrigatorio: false,
          enunciado: 'Apresente a comparação agente × workflow determinístico (custo, latência, acurácia e variância) e defenda qual vai para produção, em quais rotas. <em>Bloco 8.</em>',
          placeholder: 'Nas mesmas perguntas… Custo… Latência… Acurácia… Variância… Produção: …',
          rubrica: [
            'As <strong>mesmas perguntas</strong> nos dois, com <strong>custo, latência, acurácia e variância</strong>.',
            'O padrão: workflow <strong>3 a 8 vezes mais barato</strong>, mais rápido e com variância quase zero onde o caminho é definido (com os <strong>números do próprio laboratório</strong>).',
            'Defende <strong>agente onde a agência é necessária</strong> e workflow no resto, com <strong>roteamento</strong> decidindo.',
            'Reconhece o limite: usos por reflexão ou string ficam como <strong>esperado_falhar</strong> até o grafo (M10).'
          ],
          modelo: '<p>Rodei as mesmas perguntas no agente e num workflow de quatro passos fixos. Onde o caminho é definido, o workflow empata ou ganha em acurácia, custa muito menos (a faixa típica é 3 a 8 vezes), responde mais rápido e tem variância quase zero; o agente só se justifica onde o número de saltos é desconhecido. Em produção, um roteador envia perguntas de caminho conhecido ao workflow e as de investigação ao agente. Usos por reflexão ficam como esperado_falhar até o grafo do M10.</p>' +
            reprova('escolher um dos dois para tudo, ou defender sem números medidos.') },

        { tipo: 'texto', html:
          '<h3>Entregáveis verificados</h3>' +
          '<p>Além das respostas, o checkpoint pede mostrar rodando:</p>' +
          '<ul><li>Gates verdes: <code>ruff</code>, format, <code>mypy --strict</code> e <code>pytest</code> do lab.</li>' +
          '<li>Loop com os sete motivos demonstrados e parcial útil em cada estouro; HITL pausando escrita.</li>' +
          '<li>Ferramentas com recusa, truncamento e erro acionável; compactação preservando fatos; padrões compostos.</li>' +
          '<li>Memória com validade e invalidação; subagente com resumo e orçamento próprio; workflow × agente com números.</li></ul>' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes verificadas em 14/09/2026 (ReAct, Anthropic, 12-Factor Agents, LangGraph); docs de framework e capacidades de modelo têm alto risco de obsolescência, com revalidação em até 90 dias.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>mecanismo</mark> primeiro e, depois, os <mark>números do seu laboratório</mark>.' }
      ] }
    ]
  });
})();
