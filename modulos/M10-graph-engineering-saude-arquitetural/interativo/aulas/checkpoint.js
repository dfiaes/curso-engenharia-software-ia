/* M10 · Checkpoint (h2 checkpoint-m10): dez perguntas, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm10-checkpoint',
    titulo: 'Checkpoint M10',
    minutos: 50,
    resumo: 'Dez perguntas sobre graph engineering, sem consulta. A P1 é a prova principal e é prática: mate o processo e prove a retomada com números.',
    objetivo: 'Verificar, sem consulta, se você prova uma retomada sem repetir chamadas pagas, distingue grafo de execução de grafo de conhecimento, defende a regra de ouro com números e fala de código morto com as ressalvas certas.',
    revisao: [
      { id: 'm10cp-retoma', pergunta: 'Matar o processo no meio e retomar do último checkpoint sem repetir chamadas pagas exige…',
        opcoes: [
          opc('a', 'thread_id estável, durability "sync" e nós idempotentes; a soma das chamadas fica próxima de uma execução única', true, 'sem os três, a retomada refaz ou duplica trabalho pago.'),
          opc('b', 'Só um checkpointer ligado', false, 'thread aleatória nunca retoma.'),
          opc('c', 'Aumentar o limite de concorrência', false, 'não tem relação.')] },
      { id: 'm10cp-reducer', pergunta: 'Que classe de bug o reducer padrão produz em execução paralela e por que é difícil de detectar?',
        opcoes: [
          opc('a', 'Perda silenciosa de atualização: o último que escreve vence, sem erro nem log, de forma não determinística', true, 'conserto: reducer explícito, como operator.add.'),
          opc('b', 'Deadlock', false, 'não há travamento.'),
          opc('c', 'Estouro de memória', false, 'não é o sintoma.')] },
      { id: 'm10cp-interrupt', pergunta: 'O que a retomada de um interrupt() faz com o nó?',
        opcoes: [
          opc('a', 'Reexecuta o nó desde o começo; por isso nada de efeito não idempotente antes da pausa', true, 'mais: sem try genérico, sem reordenar, sem while True, com TTL.'),
          opc('b', 'Continua na linha seguinte', false, 'é replay do nó inteiro.'),
          opc('c', 'Descarta o estado', false, 'o estado vive no checkpointer.')] },
      { id: 'm10cp-morto', pergunta: 'O cliente pergunta "que código está morto?". Qual a ressalva obrigatória?',
        opcoes: [
          opc('a', 'É candidato, não veredito: reflexão, DI por convenção e chamada por string geram falso positivo', true, 'a ressalva aumenta a credibilidade do resto.'),
          opc('b', 'Nenhuma: o grafo é exato', false, 'o parser não vê reflexão.'),
          opc('c', 'Só avisar se a lista for grande', false, 'a ressalva vale sempre.')] },
      { id: 'm10cp-graphrag', pergunta: 'Por que o GraphRAG completo pode inviabilizar um produto vendido por análise?',
        opcoes: [
          opc('a', 'O resumo de comunidades por LLM na ingestão é custo fixo por repositório e come a margem; a alternativa é resumir na consulta, com orçamento por pergunta', true, 'custo de consulta é variável e precificável.'),
          opc('b', 'Porque o grafo não cabe em memória', false, 'cabe para os volumes do Capstone.'),
          opc('c', 'Porque o Leiden é não determinístico', false, 'não é o argumento do bloco.')] }
    ],
    abas: [
      { rotulo: 'Execução e persistência', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. A P1 é a prova principal do módulo e é prática: <strong>mate o processo e prove a retomada com números</strong>. Em cada resposta, justifique pelo invariante e use os seus números do laboratório. Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: o que garante a retomada',
          pergunta: 'Uma execução morre antes do 3º de 5 passos pagos. Na retomada, o total de chamadas é 7 em vez de 5. Qual a causa mais provável?',
          opcoes: [
            { id: 'a', texto: 'Durabilidade "exit": nada foi gravado, e a retomada refez tudo.', correta: true, porque: '2 antes + 5 depois = 7. Com "sync" seriam 2 + 3 = 5.' },
            { id: 'b', texto: 'O LLM é não determinístico.', correta: false, porque: 'isso não repete chamadas.' },
            { id: 'c', texto: 'O número de comunidades é grande.', correta: false, porque: 'não tem relação com a retomada.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Mate o processo e prove a retomada', obrigatorio: false,
          enunciado: 'Mate o processo no meio de uma execução e mostre que ela retoma do último checkpoint <strong>sem repetir chamadas pagas</strong>. Apresente os números (chamadas antes, depois e o total de uma execução única) e explique o que garantiu a idempotência. <em>Bloco 3.</em>',
          placeholder: 'Antes da morte: … Depois: … Execução única: … O thread_id foi … A idempotência veio de …',
          rubrica: [
            'Apresenta <strong>os três números</strong>: chamadas antes, depois e total de uma execução única; a soma é <strong>próxima da única, nunca o dobro</strong>.',
            '<strong>thread_id estável</strong>, derivável da entrada, e <code>sync</code> (ou justifica outro modo).',
            'Explica o que garantiu a <strong>idempotência</strong> (guarda "já fiz?", <code>ON CONFLICT</code>, chave) e o <strong>tamanho do nó</strong>.',
            'Reconhece que o nó em andamento <strong>reexecuta desde o começo</strong>.'
          ],
          modelo: '<p>Execução única: 5 chamadas pagas. Matei o processo antes do 3º passo: 2 chamadas antes e 3 depois, total 5, igual à única (com <code>durability="exit"</code> teriam sido 2 + 5 = 7). O <code>thread_id</code> é <code>ingestao-{tenant}-{repo}</code>, derivado da entrada, então outro processo o reconstrói e a entrada <code>None</code> continua de onde parou. Usei <code>sync</code> porque cada passo é pago. A idempotência veio de nós pequenos (um por arquivo via <code>Send</code>) e de uma guarda "já fiz?" no início, já que o nó em andamento reexecuta desde o começo.</p>' + reprova('mostrar só que "funcionou" sem os números, ou um total que é o dobro da execução única.') },

        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Dois grafos', obrigatorio: false,
          enunciado: 'Grafo de execução × grafo de conhecimento: dê a definição de cada um, o que se ganha com cada um e por que ter LangGraph não te dá o segundo. <em>Bloco 1.</em>',
          placeholder: 'Execução: … Conhecimento: … Ortogonais porque…',
          rubrica: [
            'Execução: nós são <strong>passos</strong>, arestas são <strong>transições de controle</strong>, escrito por você; ganha <strong>retomada, previsibilidade e ponto de intervenção</strong>.',
            'Conhecimento: nós são <strong>entidades do domínio</strong>, arestas são relações do mundo, <strong>extraído dos dados</strong>; ganha <strong>resposta que exige relação</strong>.',
            'São <strong>ortogonais</strong>: LangGraph não extrai nem guarda entidades do domínio.'
          ],
          modelo: '<p>O grafo de execução tem passos como nós e transições de controle como arestas; eu o escrevo uma vez e ele me dá retomada, previsibilidade e pontos de pausa. O grafo de conhecimento tem entidades do domínio (classe, método, tabela) e relações do mundo (chama, acessa, herda), é extraído dos dados e cresce; ele responde perguntas que exigem relação. LangGraph orquestra funções, não modela o domínio: dá para ter um sem o outro, e o Capstone precisa dos dois por razões diferentes.</p>' + reprova('"LangGraph é um grafo de conhecimento" ou "é o mesmo grafo com mais nós".') },

        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Reducer de estado', obrigatorio: false,
          enunciado: 'Explique reducer de estado e o que acontece com o default em execução paralela. Que classe de bug isso produz e por que ele é difícil de detectar? <em>Bloco 2.</em>',
          placeholder: 'O reducer define… O default… Isso produz… É difícil de detectar porque…',
          rubrica: [
            'O reducer define <strong>como o pedaço devolvido por um nó é fundido</strong> no estado.',
            'O default <strong>sobrescreve</strong>: com nós paralelos, o último vence e o trabalho dos outros se perde.',
            'Classe de bug: <strong>perda de atualização</strong>, <strong>silenciosa</strong> e não determinística, sem erro nem log.',
            'Conserto: <strong>reducer explícito</strong> (<code>operator.add</code>) em todo campo escrito por mais de um nó; analogia com ler-somar-gravar.'
          ],
          modelo: '<p>O reducer decide como o pedaço que um nó devolve é fundido no estado global. O padrão sobrescreve, então dois nós paralelos que devolvem <code>{"analisados": [...]}</code> deixam só o do último que escreveu, sem erro e sem log. É perda de atualização, como ler-somar-gravar sem atomicidade, e é difícil de detectar porque o resultado parece plausível e varia com a ordem. O conserto é <code>Annotated[list[...], operator.add]</code> em todo campo que mais de um nó escreve.</p>' + reprova('"o framework concatena sozinho" ou "dá erro".') },

        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Durabilidade', obrigatorio: false,
          enunciado: 'Os três modos de durabilidade: o que cada um persiste e quando você escolheria cada um no Capstone. O que se perde em cada caso se o processo morrer? <em>Bloco 3.</em>',
          placeholder: 'exit: … async: … sync: …',
          rubrica: [
            '<code>exit</code>: persiste só no fim; <strong>perde tudo</strong>; execução curta, barata ou teste.',
            '<code>async</code>: a cada passo sem bloquear; <strong>pode perder o último passo</strong>; trabalho longo e tolerante.',
            '<code>sync</code>: a cada passo bloqueando; <strong>não perde nada</strong>, com mais latência; <strong>ingestão paga</strong>.',
            'Liga ao trade-off de <code>synchronous_commit</code> e ao CAP (checkpointer indisponível em <code>sync</code> para a execução).'
          ],
          modelo: '<p><code>exit</code> grava só no fim e, se o processo morrer, perde tudo: serve a consultas curtas e a testes. <code>async</code> grava a cada passo sem bloquear e pode perder o último: meio-termo para trabalho longo e tolerante. <code>sync</code> grava a cada passo bloqueando e não perde nada, ao custo de latência: é o da ingestão, onde cada nó é uma chamada paga. É durabilidade contra latência, como <code>synchronous_commit</code>; e com o Postgres fora do ar, <code>sync</code> para a execução (consistência sobre disponibilidade).</p>' + reprova('"sempre sync" ou "sempre exit" sem justificar pelo custo de repetir.') },

        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · interrupt() e a reexecução', obrigatorio: false,
          enunciado: 'Por que o nó reexecuta desde o começo na retomada de um <code>interrupt()</code>, e quais são as cinco regras que decorrem disso? Dê o exemplo concreto de bug que você provocou na prática. <em>Bloco 4.</em>',
          placeholder: 'O nó reexecuta porque… As regras são… O bug que provoquei…',
          rubrica: [
            'Retomada é <strong>replay</strong>: o nó roda inteiro de novo e <code>interrupt()</code> devolve o valor do <code>resume</code>.',
            'As cinco: <strong>sem try/except genérico</strong>, <strong>sem reordenar</strong> interrupts, <strong>sem while True</strong>, <strong>sem efeito não idempotente antes</strong>, <strong>TTL</strong> para a pausa.',
            'Exemplo concreto: <strong>notificação duplicada</strong> (ou linha duplicada) por efeito antes da pausa, e a correção.',
            'Pré-requisito: <strong>checkpointer</strong>.'
          ],
          modelo: '<p>Como o estado é restaurado do checkpoint e o nó roda do início, <code>interrupt()</code> devolve o valor do <code>resume</code> em vez de pausar, e tudo que vinha antes acontece de novo. Daí as regras: sem <code>except Exception</code> em volta (engole a pausa), sem reordenar interrupts (casam por posição), sem <code>while True</code> (cada retomada replica as iterações; use aresta condicional), sem efeito não idempotente antes, e TTL com job que varre pendências. O bug que provoquei: <code>notificar_cliente</code> antes do interrupt gerou duas notificações; movi o efeito para depois da retomada e passou a ser uma. Tudo isso exige checkpointer.</p>' + reprova('"continua na linha seguinte" ou um exemplo que não é o do laboratório.') },
        { tipo: 'takeaway', html: 'Prove a retomada com <mark>números</mark>: <mark>sync</mark>, thread estável e nó idempotente.' }
      ] },

      { rotulo: 'Grafo de conhecimento', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p2', titulo: 'P2 · Aquecimento: representação',
          pergunta: 'Por que aumentar o <code>k</code> não resolve "o que quebra se eu mudar este método?"',
          opcoes: [
            { id: 'a', texto: 'A resposta está na relação entre documentos, a vários saltos; é problema de representação, não de recuperação.', correta: true, porque: 'nenhum chunk contém o fato; ele emerge de percorrer arestas.' },
            { id: 'b', texto: 'O embedding é fraco.', correta: false, porque: 'um embedding melhor ainda devolve texto isolado.' },
            { id: 'c', texto: 'O chunk é grande.', correta: false, porque: 'chunk menor continua sem arestas.' }
          ] },
        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · As três perguntas', obrigatorio: false,
          enunciado: 'Por que aquelas três perguntas do M07 eram impossíveis para o RAG? Explique em termos de <em>representação</em>, não de recuperação, e mostre os casos de eval que viraram. <em>Bloco 1.</em>',
          placeholder: 'A resposta está… O RAG guarda… Os casos de eval que viraram…',
          rubrica: [
            'A resposta é a <strong>relação entre documentos</strong>, a vários saltos; <strong>nenhum chunk a contém</strong>.',
            'k, rerank e contextualização não criam relações: o problema é <strong>de representação</strong> (texto guardado, estrutura perguntada).',
            'Cada pergunta como <strong>travessia</strong>: impacto (chamadores transitivos), dependência de tabela e código morto (<strong>não alcançável</strong> dos entry points).',
            'Cita os <strong>casos de eval</strong> que passaram de vermelho a verde, com a taxa e o limite declarado (reflexão).'
          ],
          modelo: '<p>As perguntas pedem conjuntos de nós alcançáveis por travessia. O RAG guarda texto e recupera pedaços; nenhum contém "o método X é chamado indiretamente por 7 telas", que só existe percorrendo arestas. Mais k traz mais chunks, não mais relações; rerank ordena o que já veio. Reescritas como travessia (impacto, dependência de tabela, não alcançáveis dos entry points), os casos do eval estrutural passaram de vermelho a verde com grader de caminho; os casos por reflexão ficaram como candidatos de confiança baixa declarada.</p>' + reprova('"aumentar k ou trocar o reranker resolveria".') },

        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · A regra de ouro', obrigatorio: false,
          enunciado: 'Defenda a regra de ouro ("o determinístico fica determinístico") com os <strong>seus</strong> números: custo e precisão do parser contra extração por LLM. Onde você usou LLM no grafo e por quê? <em>Bloco 5.</em>',
          placeholder: 'No meu corpus, o parser… o LLM… Usei LLM em…',
          rubrica: [
            'Parser: custo ~zero (CPU), <strong>reprodutível</strong>, preciso porque é gramática; LLM: <strong>uma ou mais chamadas por arquivo</strong>, inventa relação, varia entre execuções.',
            'Traz <strong>números próprios</strong> (custo, acertos, taxa de não resolução).',
            'LLM só em: <strong>desambiguar não resolvidos</strong>, <strong>rotular</strong> módulos, <strong>resumir comunidades</strong>, com confiança menor que 1.',
            'Reconhece o <strong>limite do parser</strong> (reflexão, DI, string) e que a taxa de não resolução é o teto de cobertura.'
          ],
          modelo: '<p>No meu corpus o parser extraiu tudo em milissegundos, sem API, com o mesmo resultado a cada execução; a extração por LLM custou uma chamada por arquivo, inventou relações e variou entre execuções. Por isso cerca de 95% do grafo sai do parser. Usei LLM só nos não resolvidos (chamada por string, nome de tabela em concatenação), com confiança menor que 1, e para rótulo de módulo. A taxa de não resolução é o teto de cobertura, e reflexão continua como candidato declarado.</p>' + reprova('números inventados, ou LLM como extrator principal.') },

        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · Instabilidade', obrigatorio: false,
          enunciado: 'Escreva a fórmula de I = Ce/(Ca+Ce), explique por que "instável" não é defeito e por que métrica arquitetural serve para tendência e não para meta. (Opcional: A e D.) <em>Bloco 5.</em>',
          placeholder: 'I = … Instável significa… Como meta ela…',
          rubrica: [
            '<strong>I = Ce / (Ca + Ce)</strong>, com Ca aferente (quem de fora depende de dentro) e Ce eferente.',
            '0 é estável (difícil de mudar), 1 é instável (fácil de mudar): <strong>mede facilidade de mudança, não defeito</strong>; UI perto de 1, tipos base perto de 0.',
            'Denuncia <strong>seta na direção errada</strong> e <strong>ciclos</strong>.',
            '<strong>Goodhart</strong>: como meta é gamificada; use <strong>tendência</strong> e <strong>declare a fronteira</strong>. Opcional: A e D = |A + I − 1|, com A indefinido se o parser não distingue abstrato.'
          ],
          modelo: '<p>I = Ce / (Ca + Ce). Instável quer dizer fácil de mudar, porque ninguém depende dele: a UI deve ficar perto de 1 e a biblioteca de tipos base perto de 0. A métrica denuncia dependência de estável para instável e ciclos entre componentes. Como meta, vira alvo de gamificação (Goodhart); serve para acompanhar tendência (I subindo em seis meses) e priorizar ciclos, sempre declarando a fronteira usada. A abstratividade A só entra se o parser distingue abstrato de concreto; senão reporto indefinido.</p>' + reprova('"I alto é componente ruim" ou usar I como meta de qualidade.') },

        { tipo: 'escreva', id: 'cp-p10', titulo: 'P10 · Código morto', obrigatorio: false,
          enunciado: 'Um cliente pergunta "que código está morto?". Você responde com a lista do grafo. Que ressalvas você <strong>tem</strong> que fazer, e por que fazê-las aumenta a sua credibilidade em vez de diminuir? <em>Blocos 5 e 6.</em>',
          placeholder: 'A lista é… Ressalvas… Isso aumenta a credibilidade porque…',
          rubrica: [
            'É <strong>candidato</strong>, nunca veredito: não alcançável dos entry points.',
            'Causas de <strong>falso positivo</strong>: reflexão, DI por convenção, chamada por string, entry points não declarados.',
            'Mostra <strong>confiança</strong> e a contagem de usos prováveis por reflexão, e a taxa de não resolução.',
            'A ressalva <strong>aumenta a credibilidade</strong>: o cliente confia no resto quando o produto diz o que não sabe.'
          ],
          modelo: '<p>Entrego a lista como candidatos a código morto: métodos que nenhum entry point alcança no grafo. Digo que reflexão, injeção de dependência por convenção e chamada por string podem esconder usos, e que entry points não declarados também geram falso positivo; mostro a taxa de não resolução e os usos prováveis por reflexão com confiança menor que 1. A ressalva aumenta a credibilidade porque mostra onde a ferramenta é exata e onde não é, e o cliente confia no resto.</p>' + reprova('"estes métodos estão mortos, pode apagar".') },
        { tipo: 'takeaway', html: 'O determinístico fica <mark>determinístico</mark>, e a <mark>ressalva</mark> é o que faz o cliente confiar no resto.' }
      ] },

      { rotulo: 'Custo e entregáveis', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p9', titulo: 'P9 · Aquecimento: onde está o custo',
          pergunta: 'Qual afirmação sobre o custo do GraphRAG está certa?',
          opcoes: [
            { id: 'a', texto: 'Resumir comunidades na ingestão é custo fixo por repositório; resumir na consulta é custo variável que pode ser precificado.', correta: true, porque: 'a abordagem preguiçosa adia o LLM até alguém perguntar.' },
            { id: 'b', texto: 'O custo de consulta é fixo e o de ingestão é variável.', correta: false, porque: 'é o contrário.' },
            { id: 'c', texto: 'O custo é sempre diluído entre os clientes.', correta: false, porque: 'ele come a margem de todo cliente, pergunte-se ou não.' }
          ] },
        { tipo: 'escreva', id: 'cp-p9', titulo: 'P9 · GraphRAG e o modelo de negócio', obrigatorio: false,
          enunciado: 'Por que GraphRAG completo pode inviabilizar o seu modelo de negócio, e qual é a alternativa? Relacione custo fixo de ingestão com margem por análise. <em>Bloco 7.</em>',
          placeholder: 'O custo de ingestão é… A margem… A alternativa é…',
          rubrica: [
            'Resumir comunidades por LLM na ingestão cresce com o corpus e é <strong>custo fixo por repositório</strong>: <strong>come a margem</strong> de toda análise vendida.',
            'Alternativa: <strong>ingestão determinística e barata</strong>; <strong>LLM na consulta</strong>, com <strong>orçamento por pergunta</strong> (lazy).',
            'Usa a <strong>conta</strong> (comunidades, tokens, reindexações, perguntas) e o <strong>ponto de equilíbrio</strong> Q* = R·C/m.',
            'Cita o LazyGraphRAG (cerca de 0,1% do custo de indexação, fonte do fornecedor) sem tratá-lo como garantia.'
          ],
          modelo: '<p>O GraphRAG completo resume cada comunidade por LLM na ingestão. Esse custo é fixo por repositório e cresce com o corpus, então consome a margem de cada análise vendida por preço fixo, tenha o cliente perguntado ou não. A alternativa é ingestão determinística e barata e LLM na consulta, com orçamento de comunidades por pergunta; o custo vira variável e precificável. A conta decide: com R reindexações, C comunidades e m lidas por pergunta, o pré-cálculo só compensa acima de R·C/m perguntas globais por mês. A Microsoft mediu o LazyGraphRAG em cerca de 0,1% do custo de indexação, com qualidade comparável.</p>' + reprova('"o custo se dilui" ou números sem a conta.') },

        { tipo: 'texto', html:
          '<h3>Entregáveis verificados (mostrar rodando)</h3>' +
          '<ol><li>Verificações verdes: <code>ruff</code>, <code>format</code>, <code>mypy --strict</code> e <code>pytest</code> do lab.</li>' +
          '<li>Kill simulado com efeito uma vez; HITL pausando e retomando em outra instância; fan-out com reducer somando.</li>' +
          '<li>Grafo extraído com censo e <code>fqn</code> estável; 3 perguntas com distância, rota e candidatos.</li>' +
          '<li>Híbrido com orçamento; memória com validade e invalidação idempotente.</li>' +
          '<li>Opcional: instabilidade por componente e ciclos de dependência; A indefinido reportado, não inventado.</li></ol>' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes verificadas em 14/09/2026; versões de framework, extensão e modelo são de alto risco (revalidar em até 90 dias). LangGraph, AGE e modelos reais são trilha externa ao laboratório.</p>' },
        { tipo: 'takeaway', html: 'Custo fixo na <mark>ingestão</mark> come a margem; o custo na <mark>consulta</mark> se precifica.' }
      ] }
    ]
  });
})();
