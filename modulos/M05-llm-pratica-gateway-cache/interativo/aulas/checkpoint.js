/* M05 · Checkpoint: sete cenários, avaliação sem consulta. Fonte: M05.html#checkpoint-m05. Rubrica = "Basta"; modelo = resposta esperada. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm05-checkpoint',
    titulo: 'Checkpoint M05',
    minutos: 45,
    resumo: 'Sete cenários sobre LLM em produção (custo, determinismo, forma e verdade, tools, cache, streaming e gateway), sem consulta. Responda com as suas palavras e demonstre com a referência do lab.',
    objetivo: 'Verificar, sem consulta, se você calcula custo com cauda, trata a saída do modelo como entrada não confiável, protege o loop de tools, desenha cache sem fé, escolhe entre streaming e job e prova a resiliência do gateway com telemetria.',
    revisao: [
      { id: 'm05cp-json', pergunta: 'Sintoma: JSON inválido mesmo com structured output. Qual é a causa provável e o conserto?',
        opcoes: [
          opc('a', 'Resposta truncada: <code>max_tokens</code> atingido no meio do objeto. Cheque <code>stop_reason == "max_tokens"</code>, trate como erro explícito e aumente o teto ou reduza o schema', true, 'o truncamento corta o objeto no meio; o schema não o impede.'),
          opc('b', 'O provedor está com defeito; repetir até funcionar', false, 'repetir cobra de novo sem tratar a causa.'),
          opc('c', 'O schema é rígido demais; remover o schema', false, 'sem schema, o parsing volta a ser regex.')] },
      { id: 'm05cp-inventado', pergunta: 'Sintoma: saída válida com conteúdo inventado (linha ou arquivo que não existe). Qual é a causa e o conserto?',
        opcoes: [
          opc('a', 'O schema garante forma, não verdade, e o modelo não tinha saída válida para "não sei". Campo opcional ou lista vazia legítima, verificação determinística do valor e eval (M06)', true, 'a linha existe? A checagem é código, não pedido ao modelo.'),
          opc('b', 'O JSON está mal formatado', false, 'o JSON estava válido; o conteúdo é que foi inventado.'),
          opc('c', 'Falta mais temperatura', false, 'temperatura não cria verdade.')] },
      { id: 'm05cp-stream', pergunta: 'Sintoma: o stream aparece todo de uma vez em produção, mas funciona local. Qual é a causa e o conserto?',
        opcoes: [
          opc('a', 'Buffering no proxy ou PaaS. <code>X-Accel-Buffering: no</code>, desabilitar o buffer de resposta na plataforma e testar com <code>curl -N</code> contra produção', true, 'o proxy segura os chunks até o fim da resposta.'),
          opc('b', 'O modelo gera tudo de uma vez em produção', false, 'o comportamento do modelo é o mesmo local e em produção.'),
          opc('c', 'O TTL do cache está curto', false, 'não tem relação com streaming.')] },
      { id: 'm05cp-429', pergunta: 'Sintoma: erros 429 em rajada, cascateando. Qual é a causa e o conserto?',
        opcoes: [
          opc('a', 'Rate limit por tokens por minuto mais retry sem jitter (thundering herd). Semáforo global alinhado à cota (M02), backoff exponencial com jitter, <code>num_retries</code> baixo e circuit breaker', true, 'sem jitter os workers voltam juntos e repetem a rajada.'),
          opc('b', 'Aumentar o número de retries imediatos', false, 'amplifica a rajada e a fatura.'),
          opc('c', 'Remover o timeout', false, 'pendura as conexões.')] },
      { id: 'm05cp-mudou', pergunta: 'Sintoma: o comportamento mudou sem nenhum deploy. Qual é a causa e o conserto?',
        opcoes: [
          opc('a', 'Alias de modelo "latest" ou não pinado, ou o provedor atualizou o modelo por trás. Pinne o identificador completo e trate o upgrade de modelo como mudança de código, com eval antes (M06)', true, 'o comportamento mudou porque a dependência mudou.'),
          opc('b', 'Cache corrompido do navegador', false, 'não explica mudança no modelo.'),
          opc('c', 'O prompt cache expirou', false, 'o cache muda custo e latência, não o comportamento do modelo.')] },
      { id: 'm05cp-fallback', pergunta: 'Sintoma: o fallback ativa, mas a qualidade despenca sem ninguém notar. Qual é a causa e o conserto?',
        opcoes: [
          opc('a', 'A telemetria não registra qual modelo respondeu. Gravar <code>modelo_usado</code> em toda chamada e alertar quando a taxa de fallback passar de um limiar', true, 'fallback degrada por desenho; invisível, vira regressão de qualidade silenciosa.'),
          opc('b', 'O fallback deveria ser o mesmo modelo do primário', false, 'isso é réplica, não fallback.'),
          opc('c', 'Desligar o fallback', false, 'troca degradação por indisponibilidade.')] }
    ],
    abas: [
      { rotulo: 'Custo, determinismo e forma', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta cobre uma família de cenários; a rubrica diz o que basta e o que reprova. Reprovar é permitido: volte ao bloco indicado e tente de novo. Quem tem o lab à mão pode demonstrar cada resposta com a referência executando.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: a cauda do custo',
          pergunta: 'Você apresenta o custo mensal médio por request e o gestor pergunta se a margem está segura. O que a média esconde?',
          opcoes: [
            { id: 'a', texto: 'Nada: a média resume a distribuição.', correta: false, porque: 'o custo varia com o conteúdo de cada request.' },
            { id: 'b', texto: 'A cauda: o request gigante mata a margem e não aparece na média; meça p50, p95 e máximo.', correta: true, porque: 'um prompt de 2k e um de 50k tokens custam muito diferente.' },
            { id: 'c', texto: 'O preço do plano.', correta: false, porque: 'o preço do plano é dado, não é o que a média esconde.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Custo', obrigatorio: false,
          enunciado: 'Dado um volume mensal, calcule o custo com a fórmula e apresente duas otimizações com impacto em moeda, defendendo a escolha. <em>Blocos 5 a 7.</em>',
          placeholder: 'O volume é… O custo por request é… A otimização 1… A 2… Meço…',
          rubrica: [
            'Conta com <strong>input, output, cache write e cache read separados</strong>, cada um com seu preço.',
            'Duas otimizações com <strong>impacto em moeda</strong> (por exemplo, cache no prefixo e roteamento por alias).',
            '<strong>Ledger</strong> que confirma a estimativa, com erro percentual e causa.',
            'Distribuição com <strong>p50, p95 e máximo</strong>, não só a média.'
          ],
          modelo: '<p>Volume de 100.000 requests por mês no Sonnet 5, com 500 tokens novos, 10.000 de prefixo e 400 de saída por request. Sem cache: entrada de 10.500 tokens a US$ 2/M mais 400 de saída a US$ 10/M, cerca de US$ 0,025 por request. Com prefixo cacheado a leitura de 0,1x: cerca de US$ 0,007. A segunda otimização é o roteamento por alias das tarefas simples para o modelo rápido, com eval do M06 para provar que não piorou, e limite de saída no schema, porque a saída custa 5x a entrada. O ledger por chamada confirma a estimativa; reporto p50, p95 e máximo, porque o request gigante não aparece na média.</p>' + reprova('uma média sem a cauda, ou preço sem separar entrada, saída e cache.') },

        { tipo: 'escolha', id: 'cp-esc-p2', titulo: 'P2 · Aquecimento: temperatura zero',
          pergunta: 'Um teste compara a saída do modelo com uma string exata, com <code>temperature=0</code>. O que está errado?',
          opcoes: [
            { id: 'a', texto: 'Nada: temperatura 0 é determinística.', correta: false, porque: 'temperatura 0 reduz a variação, mas não garante resposta idêntica.' },
            { id: 'b', texto: 'Temperatura 0 não garante determinismo, e o provedor pode atualizar o modelo; teste propriedades da saída e pinne a versão.', correta: true, porque: 'sem string exata em teste e com versão pinada, o teste não quebra por ruído nem por upgrade silencioso.' },
            { id: 'c', texto: 'O teste deveria usar temperatura 1.', correta: false, porque: 'aumentaria a variação.' }
          ] },
        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Determinismo', obrigatorio: false,
          enunciado: 'Explique por que temperatura 0 não garante determinismo e as consequências para testes e dependências. <em>Bloco 1.</em>',
          placeholder: 'Temperatura 0 não garante porque… Nos testes eu… Nas dependências eu…',
          rubrica: [
            'Temperatura 0 <strong>não garante</strong> resposta idêntica.',
            'Testes <strong>sem string exata</strong>: verificam propriedades (schema, invariantes) da saída.',
            '<strong>Versão do modelo pinada</strong>; upgrade tratado como mudança de código, com eval.',
            'Fakes determinísticos nos testes do pipeline, evals para a qualidade.'
          ],
          modelo: '<p>Temperatura 0 reduz a variação de amostragem, mas não garante saída idêntica: o provedor pode mudar o modelo por trás do nome, e há fontes de não determinismo fora da temperatura. Por isso meus testes não comparam string exata; verificam propriedades (o JSON valida no schema, os invariantes valem) e o pipeline roda com um modelo fake determinístico. A qualidade se mede em eval (M06). O identificador do modelo é pinado, e o upgrade é uma mudança de código com eval antes.</p>' + reprova('"temperatura 0 é determinístico".') },

        { tipo: 'escolha', id: 'cp-esc-p3', titulo: 'P3 · Aquecimento: forma e verdade',
          pergunta: 'O modelo devolve JSON válido no schema, mas cita uma linha de arquivo que não existe. O que o schema garante?',
          opcoes: [
            { id: 'a', texto: 'Forma, não verdade: a linha precisa de verificação determinística, e o modelo precisa de uma saída legítima para "não sei".', correta: true, porque: 'schema e abstenção cobrem forma; a checagem do valor é código.' },
            { id: 'b', texto: 'Verdade, porque o JSON é válido.', correta: false, porque: 'validade do JSON não é correção do conteúdo.' },
            { id: 'c', texto: 'Nada: structured output é inútil.', correta: false, porque: 'ele elimina o parsing frágil; só não garante verdade.' }
          ] },
        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Forma versus verdade', obrigatorio: false,
          enunciado: 'O que um schema garante e não garante? Dê um exemplo de cada lado e diga como a abstenção entra. <em>Bloco 2.</em>',
          placeholder: 'O schema garante… Não garante… Exemplo… Abstenção…',
          rubrica: [
            'Garante <strong>forma</strong> (campos, tipos); a <strong>rejeição</strong> de saída inválida vira erro tipado.',
            'Não garante <strong>verdade</strong> (a linha existe? o fato é correto?).',
            '<strong>Abstenção</strong> legítima ("não sei": campo opcional ou lista vazia) para o modelo não inventar.',
            'Verificação determinística do valor e eval para o resto.'
          ],
          modelo: '<p>O schema garante forma: os campos existem e têm o tipo certo, e uma saída fora do schema vira erro tipado que o código rejeita. Não garante verdade: um objeto válido pode citar uma linha que não existe. Por isso o schema precisa de uma saída legítima para "não sei" (campo opcional ou lista vazia), para o modelo não ser forçado a inventar, e o valor é conferido por código (a linha existe no arquivo?). O que código não confere vai para eval (M06).</p>' + reprova('"JSON válido é correto".') },
        { tipo: 'takeaway', html: 'Custo com <mark>cauda</mark>, <mark>nada de string exata</mark> em teste e <mark>forma não é verdade</mark>.' }
      ] },

      { rotulo: 'Tools, cache, streaming e gateway', blocos: [
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Tools', obrigatorio: false,
          enunciado: 'Alguém diz que "o modelo executou a ferramenta". Corrija com precisão de segurança e mostre o guardrail. <em>Bloco 3.</em>',
          placeholder: 'Quem executa de fato é… O guardrail é… O loop tem…',
          rubrica: [
            'O modelo <strong>pede</strong> a ferramenta; o <strong>seu código</strong> executa.',
            'O pedido é <strong>entrada não confiável</strong>: <strong>valida, executa e devolve</strong>.',
            '<strong>Ferramenta desconhecida</strong> e <strong>argumento inválido</strong> viram erro acionável.',
            '<strong>Teto</strong> de iterações: loop infinito vira erro.',
            'Mostra a <strong>recusa</strong> funcionando.'
          ],
          modelo: '<p>O modelo não executa nada: ele emite um pedido de chamada, e quem executa é o meu código. Esse pedido é entrada não confiável. O loop valida o nome da ferramenta e os argumentos contra o schema, executa só o que está na lista, devolve o resultado ao modelo e repete. Ferramenta desconhecida ou argumento inválido voltam como erro acionável, para o modelo corrigir. Um teto de iterações transforma o loop infinito em erro, e eu mostro a recusa nos testes do lab.</p>' + reprova('execução sem validação.') },

        { tipo: 'escolha', id: 'cp-esc-p5', titulo: 'P5 · Aquecimento: onde vai o breakpoint',
          pergunta: 'O system tem as instruções, o arquivo da sessão e, no fim, a pergunta. Onde fica o breakpoint de cache?',
          opcoes: [
            { id: 'a', texto: 'No fim do prompt, depois da pergunta.', correta: false, porque: 'a pergunta varia a cada chamada: escreveria cache novo sempre e nunca leria.' },
            { id: 'b', texto: 'No último bloco estável: o arquivo da sessão, com a pergunta depois dele.', correta: true, porque: 'estável primeiro, variável depois; tools, system, messages.' },
            { id: 'c', texto: 'Não importa onde.', correta: false, porque: 'o prefixo é comparado byte a byte.' }
          ] },
        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Cache', obrigatorio: false,
          enunciado: 'Explique a ordem do prefixo, por que variável no início destrói tudo e a desigualdade em que o cache aumenta o custo. <em>Bloco 5.</em>',
          placeholder: 'A ordem é… Variável no início… O cache sai mais caro quando…',
          rubrica: [
            'Ordem <strong>tools, system, messages</strong>; mudar uma peça invalida o que vem depois.',
            '<strong>Breakpoint no último bloco estável</strong>; variável só depois dele.',
            'Escrita 1,25x e leitura 0,1x: o esperado <code>hit x 0,1 + (1 - hit) x 1,25</code> passa de 1 com hit rate baixo (cerca de 22% é o equilíbrio).',
            '<strong>Hit rate e TTL medidos</strong> por <code>cache_read_input_tokens</code> e <code>cache_creation_input_tokens</code>; mínimo do modelo.'
          ],
          modelo: '<p>O prefixo é tools, depois system, depois messages, comparado byte a byte, então mudar uma peça invalida tudo o que vem depois dela. Um timestamp no começo do system faz toda chamada escrever cache novo a 1,25x e nunca ler. O breakpoint vai no último bloco estável. O cache sai mais caro quando o custo esperado, hit x 0,1 + (1 - hit) x 1,25, passa de 1, o que ocorre com hit rate abaixo de cerca de 22% (chamadas espaçadas além do TTL, prefixo instável, ou prefixo abaixo do mínimo do modelo, que não cacheia e não avisa). Eu demonstro o hit e o TTL pelos campos de <code>usage</code> no lab.</p>' + reprova('"cache por fé", sem medir o hit rate.') },

        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Streaming', obrigatorio: false,
          enunciado: 'Quando streamar e quando responder 202 com um job? O que o assíncrono dá a mais? <em>Bloco 4.</em>',
          placeholder: 'Streamo quando… Uso 202 e job quando… O assíncrono dá…',
          rubrica: [
            'Critério por <strong>tempo de resposta</strong> (latência percebida, tempo total).',
            '<strong>Corte detectado</strong> (stream truncado não é resposta completa).',
            'O assíncrono dá <strong>retomada, fila e resultado persistido</strong>.',
            'Não faz <strong>parse de JSON parcial</strong>: monta e valida ao final.'
          ],
          modelo: '<p>Streamo quando o usuário espera diante da tela e a latência percebida importa; respondo 202 com um job quando o tempo total passa do que uma conexão aguenta. O assíncrono dá fila, retomada e resultado persistido. No stream, detecto o corte (o fim sem o marcador de término é erro) e não faço parse de JSON parcial: monto os chunks em ordem e valido ao final.</p>' + reprova('parse de JSON parcial.') },

        { tipo: 'escolha', id: 'cp-esc-p7', titulo: 'P7 · Aquecimento: o teto do retry',
          pergunta: 'O primário do gateway devolve 503 e o time propõe "retry até dar certo". Qual é a resposta?',
          opcoes: [
            { id: 'a', texto: 'Aceitar: o retry resolve falha transitória.', correta: false, porque: 'sem teto, retry cobra de novo a cada tentativa e o thundering herd derruba o provedor.' },
            { id: 'b', texto: 'Retry com teto baixo e jitter só em erro transitório, depois fallback registrando <code>modelo_usado</code>.', correta: true, porque: 'retry custa dinheiro; o teto limita o gasto e o fallback mantém o serviço no ar.' },
            { id: 'c', texto: 'Nunca fazer retry em nenhum erro.', correta: false, porque: '429 e 5xx são transitórios e merecem retry limitado.' }
          ] },
        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Gateway', obrigatorio: false,
          enunciado: 'Derrube o primário e prove, com telemetria, que o cliente não percebeu. Explique o teto de retry. <em>Bloco 6.</em>',
          placeholder: 'Derrubo o primário com… A telemetria mostra… O teto de retry é…',
          rubrica: [
            'Fallback que responde: a chamada <strong>sucede pelo alias de fallback</strong>.',
            '<code>modelo_usado</code> <strong>registrado</strong> na telemetria, provando quem respondeu.',
            '<strong>Tentativas limitadas</strong>: retry só em transitório, com jitter; cooldown tira o primário do pool.',
            'Reconhece que o gateway é um <strong>ponto único de falha</strong> a monitorar.'
          ],
          modelo: '<p>Forço uma chave inválida (ou um erro 503) no primário. A chamada sucede pelo alias de fallback, o cliente recebe o objeto esperado, e a telemetria mostra <code>modelo_usado</code> do fallback e o número de tentativas. O retry só vale para erro transitório, com jitter e teto baixo (2), porque cada tentativa já gerada é cobrada; depois do <code>allowed_fails</code>, o cooldown tira o deployment quebrado do pool. O ADR registra a consequência incômoda: o gateway é ponto único de falha e precisa de monitoramento, inclusive da taxa de fallback.</p>' + reprova('retry sem teto, ou fallback sem <code>modelo_usado</code>.') },

        { tipo: 'texto', html:
          '<h3>Entregáveis verificados (mostrar rodando)</h3>' +
          '<ul><li>Gates verdes: <code>ruff</code>, <code>format</code>, <code>mypy --strict</code>, <code>pytest</code> (27 passed).</li>' +
          '<li>Dois adapters na mesma suíte de contrato; structured com rejeição e abstenção.</li>' +
          '<li>Tool loop com teto e erro acionável; stream com corte detectado e teto sem perda.</li>' +
          '<li>Cache com hit, TTL e invalidação; gateway com fallback, timeout e ledger com relatório.</li></ul>' },
        { tipo: 'texto', html: '<p class="ta-nota">Preços, mínimos de cache e nomes de modelo seguem o retrato de ago/2026 do módulo (revalidar em 90 dias). A contagem de testes do lab (27 passed) é a da referência versionada.</p>' },
        { tipo: 'takeaway', html: 'O modelo <mark>pede</mark>, seu código <mark>valida e executa</mark>; cache e retry se decidem por <mark>medida</mark> e <mark>teto</mark>.' }
      ] }
    ]
  });
})();
