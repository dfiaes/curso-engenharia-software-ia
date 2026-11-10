/* M02 · Checkpoint: dez cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada + "Reprova". */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function P(id, titulo, enunciado, placeholder, rubrica, modelo, rep) {
    return { tipo: 'escreva', id: id, titulo: titulo, obrigatorio: false, enunciado: enunciado, placeholder: placeholder, rubrica: rubrica, modelo: modelo + reprova(rep) };
  }

  TrilhaAula.registrar({
    id: 'm02-checkpoint',
    titulo: 'Checkpoint M02',
    minutos: 60,
    resumo: 'Dez perguntas de cenário sobre Python profissional, sem consulta. Responda com as suas palavras e justifique pelo mecanismo.',
    objetivo: 'Verificar, sem consulta, se você explica event loop e bloqueio, separa mypy de Pydantic, aplica Protocol, referência, free-threading, Lei de Little e prova a entrega fora do checkout.',
    abas: [
      { rotulo: 'Async, tipos e fronteiras', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. A rubrica diz o que basta. Reprovar é permitido: volte ao bloco indicado e tente de novo. Os entregáveis do lab (csv-cleaner instalado, gates verdes, relatórios, <code>evidence/run.json</code>) são verificados rodando, não aqui.</p>' },
        { tipo: 'escolha', id: 'cp-esc-aq1', titulo: 'Aquecimento · o que nasce frio',
          pergunta: '<code>resultado = buscar_cotacao(client, "USD")</code>, sem <code>await</code>, numa <code>async def</code>. O que acontece?',
          opcoes: [
            { id: 'a', texto: 'Busca a cotação e guarda o resultado.', correta: false, porque: 'chamar async def só cria o objeto coroutine.' },
            { id: 'b', texto: 'Devolve uma corrotina inerte e o runtime avisa "coroutine was never awaited".', correta: true, porque: 'corrija com await, create_task guardando a referência ou TaskGroup.' },
            { id: 'c', texto: 'Levanta TypeError na hora.', correta: false, porque: 'não levanta: avisa depois.' }
          ] },
        P('cp-p1', 'P1 · time.sleep dentro de async def',
          'Explique, com event loop, cooperação e fila, qual escopo é afetado por <code>time.sleep(1)</code> dentro de <code>async def</code>. Diferencie bloquear o loop de executar trabalho numa thread. Apresente sua evidência local. <em>Bloco 5.</em>',
          'O loop executa… time.sleep… to_thread…',
          ['O loop executa <strong>uma Task por vez</strong> na sua thread e só alterna em <code>await</code>.', 'O sleep síncrono <strong>bloqueia a thread do loop</strong>: as outras Tasks <strong>daquele loop</strong> não avançam (não "o Python inteiro").', '<code>to_thread</code>/executor roda a função em outra thread: exige <strong>thread safety e limite</strong>, e cancelar o await <strong>não interrompe</strong> a função.', 'Evidência: simulador ou teste de starvation com heartbeat (para sob handler bloqueante, progride sob o cooperativo).'],
          '<p>time.sleep(1) segura a única thread do event loop por 1 s; nenhuma outra Task daquele loop avança, e a fila de prontas espera. Com await asyncio.sleep a Task cede e as outras rodam. Com to_thread o bloqueio sai do loop, mas exige thread safety, limite do pool e o cancelamento do await não mata a função. A evidência é o teste local com servidor em 127.0.0.1: o heartbeat para no handler bloqueante e progride no cooperativo.</p>',
          'dizer que "o Python inteiro congela", ou que to_thread cancela a função ao cancelar o await.'),
        P('cp-p2', 'P2 · mypy e Pydantic',
          'mypy e Pydantic: qual protege qual fronteira? Dê um bug que só o primeiro pega e um que só o segundo pega. <em>Blocos 3 e 4.</em>',
          'O mypy olha… o Pydantic olha…',
          ['mypy: <strong>código que você escreve</strong>, estático, sem rodar (ex.: typo de método, <code>return None</code> em função que promete <code>Decimal</code>).', 'Pydantic: <strong>dados que chegam em runtime</strong> (JSON, CSV, saída de LLM), só nos caminhos que executam a validação (ex.: valor negativo, campo extra, moeda "reais").', 'Nenhum dos dois cobre <strong>valor de domínio</strong> (média de lista vazia): teste.'],
          '<p>O mypy verifica compatibilidade estática do código visível: pega o typo .uper() antes de rodar, mas nunca viu o JSON que chega. O Pydantic valida os valores em runtime na fronteira: pega amount negativo ou o campo admin extra, que o mypy não enxerga. Invariantes de domínio e a lista vazia ficam com testes.</p>',
          'achar que hints validam em runtime, ou que o Pydantic substitui o checker.'),
        P('cp-p3', 'P3 · Corrotina fria',
          'O que significa "corrotina é fria" e qual warning do runtime denuncia o erro? Qual mudança faz a coroutine ser aguardada? <em>Bloco 5.</em>',
          'Chamar async def… o warning… corrijo com…',
          ['Chamar <code>async def</code> cria um objeto coroutine e <strong>não executa o corpo</strong>.', 'O warning é <code>coroutine \'x\' was never awaited</code>.', 'Correção: <code>await f()</code>, ou <code>create_task</code> <strong>guardando a referência</strong>, ou <code>TaskGroup</code>.'],
          '<p>Corrotina fria é o objeto devolvido por uma chamada a async def sem await: o corpo nunca rodou. O runtime avisa "coroutine was never awaited". Corrijo com await f(), ou create_task guardando a referência (senão o GC pode coletá-la), ou, melhor, TaskGroup.</p>',
          'achar que a chamada já executou o corpo, ou criar a task sem guardar a referência.'),
        P('cp-p4', 'P4 · Nominal e estrutural',
          'Explique compatibilidade nominal e estrutural. Mostre como dois adapters atendem a um <code>Protocol</code> e por que os testes comportamentais continuam necessários. <em>Bloco 3.</em>',
          'Nominal depende de… estrutural depende de…',
          ['Nominal: identidade <strong>declarada</strong> (herança); estrutural: <strong>membros e assinaturas</strong> compatíveis.', 'Dois adapters (ex.: e-mail e fake) com <code>enviar(destino, mensagem) -> bool</code> servem ao <code>Protocol</code> <strong>sem herdar</strong>; o consumidor define o menor contrato.', 'O checker prova a forma; <strong>testes provam a semântica</strong>. <code>runtime_checkable</code> só confere nomes.'],
          '<p>Nominal exige o tipo declarado; estrutural aceita quem tem a forma. EmailNotificador e um FakeNotificador, ambos com enviar(destino, mensagem) -> bool, atendem a Notificador sem herdar. O mypy confere a forma; que o fake devolva o que o real devolveria só um teste comportamental prova, e isinstance com runtime_checkable confere apenas nomes.</p>',
          'dizer que o Protocol exige herança ou que a forma prova a semântica.'),
        P('cp-p5', 'P5 · O default mutável',
          'Por que <code>def f(itens=[])</code> é bug e não estilo? O que acontece na segunda chamada e por quê (semântica de referência)? <em>Bloco 2.</em>',
          'O default é avaliado… a segunda chamada…',
          ['O default é avaliado <strong>uma vez, na definição</strong>.', 'A segunda chamada recebe <strong>o mesmo objeto</strong> já mutado: nomes ligados a objetos, sem cópia.', 'Correção: <code>None</code> como sentinela ou <code>default_factory</code>.'],
          '<p>A expressão [] roda quando a função é definida e o mesmo objeto lista serve a todas as chamadas. Na segunda chamada o item da primeira ainda está lá, porque o nome itens liga ao mesmo objeto. Uso itens=None e crio a lista dentro, ou default_factory em dataclass e Pydantic.</p>',
          'tratar como estilo, ou achar que a lista é recriada a cada chamada.')
      ] },

      { rotulo: 'Concorrência, testes e entrega', blocos: [
        P('cp-p6', 'P6 · Free-threading',
          'O que o build free-threaded do 3.14 muda, como detectar o GIL efetivo e por que compatibilidade e sincronização ainda precisam de prova? <em>Bloco 6.</em>',
          'No build free-threaded… detecto com… ainda preciso provar…',
          ['Threads de Python <strong>podem rodar em paralelo</strong>, mas código não vira automaticamente seguro nem mais rápido.', 'Detectar as duas dimensões: <code>sysconfig.get_config_var("Py_GIL_DISABLED")</code> (build) e <code>sys._is_gil_enabled()</code> (efetivo agora).', 'Provar: <strong>corridas reais</strong> (locks ou message passing), <strong>extensões</strong> que reabilitam o GIL e <strong>regressão single-thread</strong>.'],
          '<p>O build free-threaded, suportado no 3.14, permite threads de Python em paralelo, mas tira a proteção implícita do GIL. Registro Py_GIL_DISABLED (build) e sys._is_gil_enabled() (nesta execução), porque suporte no build não prova GIL desligado. Preciso provar com testes: lost update num contador sem lock, compatibilidade das extensões, que podem reabilitar o GIL, e a regressão single-thread.</p>',
          'dizer que free-threading é "mais rápido" por padrão, ou presumir o GIL desligado sem checar.'),
        P('cp-p7', 'P7 · Teste como especificação',
          'Na era de código gerado por IA, por que teste vira especificação executável? Cite uma propriedade, um caso negativo e um controle de mutação. <em>Bloco 8.</em>',
          'O agente otimiza para… propriedade… negativo… mutação…',
          ['O agente <strong>otimiza para testes verdes</strong>; teste fraco aprova código fraco.', 'Propriedade: aceito, serializado e lido de novo <strong>preserva o valor</strong> (ou rejeitada nunca aparece na saída).', 'Caso negativo (campo extra, valor negativo, arquivo inexistente) e <strong>mutação</strong> (trocar sinal ou remover regra: a suíte deve falhar).', 'Oráculo <strong>independente</strong> da implementação.'],
          '<p>Como o agente otimiza para teste verde, o teste passa a ser a especificação. Propriedade: toda decimal aceita, escrita e relida preserva o valor. Negativo: o fixture com campo extra deve sair com exit code 2. Mutação: troco o sinal de uma comparação; se a suíte seguir verde, o oráculo é fraco. E o esperado nunca copia a fórmula da implementação.</p>',
          'achar que verde significa correto, ou usar a mesma fórmula da implementação como esperado.'),
        P('cp-p8', 'P8 · Lei de Little',
          'Com W = 2 s por chamada de LLM e meta de 100 req/s, quantas requisições em voo o sistema carrega, e que mecanismos do curso administram esse número? <em>Blocos 5 e 6.</em>',
          'L = λW = … administro com…',
          ['<code>L = λ · W = 100 × 2 = <strong>200</strong></code> em voo.', 'Vale para sistema <strong>estável</strong>, com λ, W e L medidos na <strong>mesma fronteira e janela</strong>.', 'Mecanismos: <strong>Semaphore</strong>, <strong>fila bounded</strong> (<code>maxsize</code>), rate limit, recusa (backpressure).'],
          '<p>L = λW = 100 × 2 = 200 requisições em voo. Só vale em sistema estável e com as medidas na mesma fronteira e janela. Administro com semáforo, fila bounded, rate limit e recusa: com limite c, a vazão máxima é c/W, e se λ passa disso a fila de admissão cresce sem parar.</p>',
          'responder 50 ou 102, ou usar a lei sem dizer a fronteira e a janela.'),
        P('cp-p9', 'P9 · Três nomes e o wheel',
          'Diferencie a distribuição <code>csv-cleaner</code>, o import package <code>python_senior_lab</code> e o command entry point. Como provar que o wheel funciona fora do checkout? <em>Blocos 1 e 8.</em>',
          'A distribuição é… o import package… o comando…',
          ['<strong>Distribuição</strong> (nome no pyproject e no PyPI), <strong>import package</strong> (<code>import python_senior_lab</code>) e <strong>comando</strong> (<code>[project.scripts]</code>) são <strong>contratos distintos</strong>.', 'Prova: <code>uv build</code>, inspecionar o wheel e instalá-lo em <strong>ambiente temporário fora do repositório</strong> (<code>uv run --isolated --no-project --with ./dist/....whl csv-cleaner --help</code>).', 'Confirmar em <code>module.__file__</code> que o import veio de <strong>site-packages</strong>; nunca <code>sys.path.append()</code>.'],
          '<p>csv-cleaner é o nome da distribuição; python_senior_lab é o pacote que se importa; o comando csv-cleaner vem de [project.scripts] apontando para python_senior_lab.cli:main. Para provar: uv build, inspeciono o wheel, instalo num ambiente isolado com cwd fora do repositório, rodo o comando e confiro que __file__ está em site-packages.</p>',
          'validar só no source tree, ou corrigir import com sys.path.append().'),
        P('cp-p10', 'P10 · Passou no schema, quebrou depois',
          'Um modelo Pydantic passou no schema, mas viola uma regra de domínio depois de mutação. Quais caminhos permitem isso e em que camada cada invariante deve ser garantida? <em>Blocos 2 e 4.</em>',
          'Os caminhos são… a invariante de domínio fica em…',
          ['Caminhos: <code>model_construct()</code>, <strong>atribuição sem</strong> <code>validate_assignment</code>, e <strong>mutação de objeto interno</strong> (<code>frozen</code> é raso).', 'Mitigações: <code>validate_assignment=True</code>, <code>frozen=True</code> com coleções imutáveis (<code>tuple</code>), validar na fronteira.', 'Invariantes que dependem de <strong>banco, serviço ou outros registros</strong> pertencem ao domínio/repositório, não ao schema.'],
          '<p>Por model_construct, que não valida; por atribuição direta, já que validate_assignment é opt-in; e por mutação de um objeto interno, porque frozen só impede religar o campo. Fecho com validate_assignment, frozen e tuple, e validação na fronteira. Mas unicidade, saldo e consistência entre registros são do domínio e do banco: o Pydantic só garantiu as regras que executou naquele momento.</p>',
          'achar que passar no schema garante a invariante para sempre.')
      ] },

      { rotulo: 'Diagnóstico', blocos: [
        { tipo: 'texto', html: '<p>Da Tabela de Diagnóstico do módulo: sintoma, causa provável e conserto. Responda sem olhar a tabela.</p>' },
        { tipo: 'escolha', id: 'cp-esc-mnf', titulo: 'ModuleNotFoundError num pacote instalado',
          pergunta: 'Você instalou um pacote e o import falha com <code>ModuleNotFoundError</code>. Qual é a primeira evidência e o conserto?',
          opcoes: [
            { id: 'a', texto: 'Confirmar o interpretador (<code>sys.executable</code>, deve apontar para <code>.venv</code>) e executar com <code>uv run</code>, instalando com <code>uv add</code>.', correta: true, porque: 'rodar python/pip fora do ambiente do projeto é a causa provável; não misture instalação global e projeto.' },
            { id: 'b', texto: 'Acrescentar o diretório a <code>sys.path</code>.', correta: false, porque: 'esconde o erro de ambiente, instalação, nome ou artefato.' },
            { id: 'c', texto: 'Editar o <code>uv.lock</code> à mão.', correta: false, porque: 'o lock é gerado.' }
          ] },
        { tipo: 'escolha', id: 'cp-esc-decimal', titulo: 'Decimal e float',
          pergunta: '<code>Decimal</code> somado a <code>float</code> dá erro ou resultado estranho. Qual a regra de conserto?',
          opcoes: [
            { id: 'a', texto: 'Dinheiro nasce <code>Decimal(str)</code> ou inteiro em centavos e nunca encosta em float; <code>Decimal("0.1")</code>, não <code>Decimal(0.1)</code>.', correta: true, porque: 'float binário não representa 0.1 exatamente.' },
            { id: 'b', texto: 'Converter tudo para float no fim.', correta: false, porque: 'perde exatidão.' },
            { id: 'c', texto: 'Aumentar o timeout.', correta: false, porque: 'não tem relação.' }
          ] },
        { tipo: 'escolha', id: 'cp-esc-asyncflaky', titulo: 'Teste assíncrono intermitente',
          pergunta: 'Um teste assíncrono falha de forma intermitente. Qual é o primeiro passo?',
          opcoes: [
            { id: 'a', texto: 'Aumentar o timeout.', correta: false, porque: 'não é a primeira resposta.' },
            { id: 'b', texto: 'Olhar ownership de tasks, cancelamento e limite da fila, começando pelo teste específico e pelo diagnóstico.', correta: true, porque: 'a causa costuma estar em task órfã, cancelamento ou fila sem limite.' },
            { id: 'c', texto: 'Marcar como xfail.', correta: false, porque: 'esconde o defeito.' }
          ] },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>mecanismo</mark> primeiro e a <mark>evidência</mark> que você mostraria rodando.' }
      ] }
    ],
    revisao: [
      { id: 'm02cp-mnf', pergunta: 'ModuleNotFoundError num pacote instalado: qual a causa provável e o conserto?', opcoes: [
        opc('a', 'Rodou python/pip fora do ambiente do projeto; use uv run, instale com uv add e confirme sys.executable', true, 'deve apontar para .venv.'),
        opc('b', 'O pacote não existe no PyPI', false, 'a causa provável é de ambiente.'),
        opc('c', 'Falta sys.path.append', false, 'esconde o problema.')] },
      { id: 'm02cp-loop', pergunta: 'Tarefas daquele loop deixam de progredir sob carga: causa provável?', opcoes: [
        opc('a', 'Chamada bloqueante na thread do event loop (time.sleep, cliente ou driver síncrono)', true, 'prefira API async; se a síncrona for inevitável e thread-safe, use thread com limite.'),
        opc('b', 'O PyPI está lento', false, 'sem relação.'),
        opc('c', 'Falta de type hints', false, 'hints não afetam isso.')] },
      { id: 'm02cp-extra', pergunta: 'Campo extra malicioso passou em silêncio pelo modelo: conserto?', opcoes: [
        opc('a', 'model_config = ConfigDict(extra="forbid") nos contratos', true, 'o default do Pydantic ignora extras.'),
        opc('b', 'strict=True resolve sozinho', false, 'strict muda coerção, não extras.'),
        opc('c', 'Mais um validator no campo', false, 'o campo extra nem é declarado.')] },
      { id: 'm02cp-lista', pergunta: 'Todas as instâncias "compartilham" a mesma lista: causa e conserto?', opcoes: [
        opc('a', 'Default mutável: um objeto para todas; use default_factory=list, ou None + criar dentro da função', true, 'dataclass e Pydantic aceitam factory.'),
        opc('b', 'Bug do garbage collector', false, 'é semântica de referência.'),
        opc('c', 'Falta de slots', false, 'slots não corrige default.')] },
      { id: 'm02cp-gerador', pergunta: 'A segunda iteração do gerador vem vazia, sem erro: conserto?', opcoes: [
        opc('a', 'Gerador é de uma passada: materialize com list() para duas passadas ou reconstrua o gerador', true, 'é o contrato de lifetime da preguiça.'),
        opc('b', 'Reiniciar o interpretador', false, 'não resolve.'),
        opc('c', 'Usar is em vez de ==', false, 'sem relação.')] },
      { id: 'm02cp-mypy', pergunta: 'mypy passa, mas produção explode com dado inválido: causa?', opcoes: [
        opc('a', 'Hint não valida runtime e a fronteira não tem porteiro: model_validate em toda entrada externa', true, 'inclui request, arquivo e resposta de LLM.'),
        opc('b', 'O mypy está desatualizado', false, 'o checker nunca viu o dado.'),
        opc('c', 'Faltou Any', false, 'Any reduz a prova estática.')] }
    ]
  });
})();
