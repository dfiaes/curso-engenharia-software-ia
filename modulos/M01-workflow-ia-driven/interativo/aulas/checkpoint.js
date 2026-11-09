/* M01 · Checkpoint: oito cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada; "Reprova" = erro que reprova. Fonte: M01.html#checkpoint-m01. Aprovação: 80% das questões, 100% dos controles de segurança (P3, P4, P5) e demonstração dos resultados reais do lab. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm01-checkpoint',
    titulo: 'Checkpoint M01',
    minutos: 50,
    resumo: 'Oito cenários sobre SDD, drift, harness, estado retomável, paralelismo e integração, sem consulta. A aprovação exige 80% das questões, 100% dos controles de segurança e a demonstração dos resultados reais do lab.',
    objetivo: 'Verificar, sem consulta, se você separa intenção, requisito e evidência, classifica drift sem soberania automática, desenha gates com controle negativo, executa com menor privilégio, retoma sem repetir efeito e decide paralelismo e integração.',
    revisao: [
      { id: 'm01cp-drift', pergunta: 'Spec, testes e produção divergem e não há decisão registrada. O que o agente deve fazer?',
        opcoes: [
          opc('a', 'Classificar como decision_required: mitigar o que for urgente, parar sem mutar e pedir a decisão de produto', true, 'intenção e comportamento aceitável não se inferem com segurança; nenhuma fonte vence por reflexo.'),
          opc('b', 'Atualizar a spec para o que a produção faz', false, 'seria dar soberania automática à produção e tomar decisão de produto sem registro.'),
          opc('c', 'Corrigir o código até o teste passar', false, 'sem evidência de qual fonte está errada, a "correção" é inventada.')] },
      { id: 'm01cp-exit0', pergunta: 'Um gate sai com exit code 0. O que isso prova?',
        opcoes: [
          opc('a', 'Que o oráculo aceitou; só vale se o oráculo for forte, e o controle negativo mostra que o gate reprova um defeito conhecido', true, 'exit code é sinal de protocolo, não prova semântica.'),
          opc('b', 'Que o requisito foi atendido', false, 'um oráculo fraco aceita qualquer coisa.'),
          opc('c', 'Que todos os testes foram coletados', false, 'no pytest, nenhum teste coletado dá exit 5, não 0; cada ferramenta define os seus códigos.')] },
      { id: 'm01cp-argv', pergunta: 'Por que o runner usa lista de argumentos e shell=False?',
        opcoes: [
          opc('a', 'Para não pedir ao shell que interprete uma string: saída de agente interpolada num comando vira injeção; a policy ainda limita executável, diretório e timeout', true, 'menor privilégio: o executável é permitido explicitamente, e o resto é negado (126).'),
          opc('b', 'Porque listas são mais rápidas que strings', false, 'a razão é segurança, não desempenho.'),
          opc('c', 'Porque o Windows não tem shell', false, 'o runner é multiplataforma justamente por não depender de um shell.')] },
      { id: 'm01cp-effect', pergunta: 'Como retomar RUNNING → PAUSED → RUNNING numa instância nova sem repetir o efeito externo?',
        opcoes: [
          opc('a', 'Carregar o checkpoint e consultar o ledger: o mesmo effect_id não produz efeito novo; o destino também deve ser idempotente', true, 'a janela entre efeito e registro pede idempotência no destino ou registro atômico.'),
          opc('b', 'Reler o histórico do chat para saber o que já foi feito', false, 'o contexto pode truncar, resumir e conter texto não validado.'),
          opc('c', 'Repetir tudo desde o início, já que o efeito é raro', false, 'retry é rotina em agentes; operação com efeito precisa ser idempotente.')] },
      { id: 'm01cp-wave', pergunta: 'Em que wave o contrato compartilhado entre duas features deve ser estabilizado?',
        opcoes: [
          opc('a', 'Na wave 1, sequencial, antes das features em paralelo; a integração final ainda roda o gate global', true, 'wave 1 = fundações (schemas, contratos); wave 2 = features em paralelo; wave 3 = integração e polimento.'),
          opc('b', 'Na wave 3, durante a integração', false, 'aí o conflito semântico já foi produzido em paralelo.'),
          opc('c', 'Em nenhuma: merge limpo basta', false, 'merge limpo não é comportamento compatível (120 × 110).')] },
      { id: 'm01cp-niveis', pergunta: 'No contrato pedagógico do módulo, o que é o "adapter"?',
        opcoes: [
          opc('a', 'Como uma ferramenta específica implementa o padrão na versão atual (por exemplo, /speckit.* ou $speckit-*)', true, 'invariante é o problema de engenharia; padrão é o contrato ou mecanismo verificável; adapter é a implementação da ferramenta.'),
          opc('b', 'O problema de engenharia que continua existindo quando o produto muda', false, 'isso é o invariante.'),
          opc('c', 'O contrato verificável que reduz ambiguidade e aprisionamento', false, 'isso é o padrão.')] }
    ],
    abas: [
      { rotulo: 'Intenção, drift, gate e execução', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que basta. <strong>A aprovação exige 80% nas questões, 100% dos controles de segurança (P3, P4 e P5) e a demonstração dos resultados reais do lab.</strong> Texto de LLM sem gate não conta como evidência. Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escreva', id: 'm01cp-p1', titulo: 'P1 · Seis palavras, um caso', obrigatorio: false,
          enunciado: 'Uma equipe quer gerar um changelog semanal a partir do histórico Git, para reduzir trabalho manual na retomada de estudo. Cada linha deve ter data, hash curto e mensagem, sem publicar nada. Diferencie problema, outcome, requisito, decisão técnica, tarefa e evidência. <em>Bloco 1.</em>',
          placeholder: 'O problema é… O outcome… O requisito… A decisão técnica… A tarefa… A evidência…',
          rubrica: [
            '<strong>Problema</strong>: o trabalho manual de retomar o estudo, não a tecnologia.',
            '<strong>Outcome</strong> observável e <strong>requisito</strong> verificável (data, hash curto e mensagem por linha; nada é publicado).',
            '<strong>Decisão técnica</strong> separada do requisito (leitura local do Git, UTF-8, mensagem clara sem repositório).',
            '<strong>Tarefa</strong> ligada a um requisito (parser, formatação, teste, com arquivos e comandos declarados).',
            '<strong>Evidência</strong> que não é opinião: o teste passou e qual versão do runtime o executou.'
          ],
          modelo: '<p>O problema é o trabalho manual de retomar o estudo. O outcome é um changelog semanal gerado sem esforço. O requisito diz o que cada linha contém (data, hash curto, mensagem) e que nada é publicado, e é verificável por teste. A decisão técnica é como cumprir isso: ler o Git local, UTF-8 e mensagem clara quando não houver repositório. A tarefa é a unidade do plano (parser, formatação, teste), com arquivos e comando declarados e ligada ao requisito. A evidência é o registro de que o teste passou e em qual versão do runtime.</p>' + reprova('tratar "usar Git" como requisito, ou aceitar "o agente disse que funcionou" como evidência.') },

        { tipo: 'escolha', id: 'm01cp-esc-p2', titulo: 'P2 · Aquecimento: tudo concorda',
          pergunta: 'Spec, requisitos, código e testes concordam, e a evidência da última execução está registrada. Qual a classificação?',
          opcoes: [
            { id: 'a', texto: 'consistent: não há divergência, e não se inventa correção.', correta: true, porque: 'ausência de drift também é um resultado válido.' },
            { id: 'b', texto: 'spec_stale: toda spec está sempre um pouco atrasada.', correta: false, porque: 'sem divergência observada não há o que classificar como atrasado.' },
            { id: 'c', texto: 'decision_required: sempre peça confirmação humana.', correta: false, porque: 'decisão humana é para quando intenção e comportamento aceitável não se inferem; aqui há concordância.' }
          ] },
        { tipo: 'escreva', id: 'm01cp-p2', titulo: 'P2 · A semana do changelog', obrigatorio: false,
          enunciado: 'A spec exige semana de segunda a domingo; o teste de comportamento do agrupamento falha; a telemetria mostra clientes dependendo do domingo; não há decisão de produto registrada. Classifique a divergência em um dos quatro estados e diga qual evidência ainda falta. <em>Bloco 1.</em>',
          placeholder: 'Classifico como… porque… Falta evidência de… Agiria assim…',
          rubrica: [
            'Nomeia os quatro estados: <code>consistent</code>, <code>spec_stale</code>, <code>code_incorrect</code>, <code>decision_required</code>.',
            'Escolhe <strong>decision_required</strong>: intenção e comportamento aceitável não se inferem com segurança.',
            '<strong>Nenhuma fonte vence por reflexo</strong> (spec, teste, código e telemetria podem estar errados).',
            'Diz a evidência que falta: <strong>decisão de produto registrada</strong> e se o teste tem <strong>oráculo válido</strong>.',
            'Mitiga o urgente, <strong>para sem mutar</strong> e depois reconcilia contrato, implementação, testes e registro de decisão <strong>no mesmo change set</strong>.'
          ],
          modelo: '<p>É <code>decision_required</code>. A spec, o teste e a telemetria apontam para lados diferentes e não há decisão registrada, então intenção e comportamento aceitável não se inferem com segurança; nenhuma fonte vence por reflexo. Falta a decisão de produto, e eu confirmaria que o teste tem um oráculo válido. Mitigo só o que for urgente, paro sem mutar e peço a decisão. Com ela registrada, atualizo contrato, implementação, testes e registro de decisão no mesmo change set.</p>' + reprova('escolher spec ou código por reflexo, ou "corrigir" sem decisão registrada.') },

        { tipo: 'escolha', id: 'm01cp-esc-p3', titulo: 'P3 · Aquecimento: o gate verde',
          pergunta: 'Um gate termina com exit code 0. Qual leitura está de acordo com o módulo?',
          opcoes: [
            { id: 'a', texto: 'O requisito foi atendido: exit 0 é a prova.', correta: false, porque: 'exit code é sinal de protocolo; não prova que o oráculo representa a necessidade real.' },
            { id: 'b', texto: 'O oráculo aceitou; para confiar no gate é preciso um caso negativo que ele reprove e evidência persistida.', correta: true, porque: 'oráculo, caso negativo, política e evidência, não apenas exit code.' },
            { id: 'c', texto: 'Nenhum teste foi coletado, como no pytest.', correta: false, porque: 'nenhum teste coletado no pytest é exit 5 e deve bloquear.' }
          ] },
        { tipo: 'escreva', id: 'm01cp-p3', titulo: 'P3 · Exit code zero não prova', obrigatorio: false,
          enunciado: 'Explique por que exit code zero não prova atendimento do requisito e desenhe um controle negativo para o gate. <em>Bloco 2 · controle de segurança.</em>',
          placeholder: 'Exit code é… O oráculo… O controle negativo… A evidência…',
          rubrica: [
            'Exit code é <strong>sinal de protocolo</strong>, e cada ferramenta define os seus (pytest: 0 aprovado, <strong>5 nenhum teste coletado</strong>, que deve bloquear).',
            'Zero depende do <strong>oráculo</strong>: um oráculo fraco aceita qualquer coisa.',
            '<strong>Controle negativo</strong>: um defeito conhecido (mutante) que o gate precisa <strong>rejeitar</strong>, com o baseline passando.',
            '<strong>Evidência persistida</strong>: argv, versão, duração, saída e exit code (timeout 124 e policy 126 distintos).'
          ],
          modelo: '<p>Exit code é só um sinal de protocolo e cada ferramenta define os seus: no pytest, 0 é aprovado e 5 é "nenhum teste coletado", que deve bloquear. Zero também depende do oráculo: se o teste não exercita o requisito, ele passa de qualquer jeito. Por isso desenho um controle negativo: um mutante conhecido (por exemplo, trocar <code>x*2</code> por <code>x+2</code>) que o gate precisa rejeitar enquanto o baseline passa; se ninguém é rejeitado, o oráculo é fraco. O runner registra argv, versão, duração, saída e exit code, com 124 para timeout e 126 para policy.</p>' + reprova('"exit 0 é prova suficiente" ou tratar exit 5 como aviso.') },

        { tipo: 'escreva', id: 'm01cp-p4', titulo: 'P4 · Saída de agente num shell step', obrigatorio: false,
          enunciado: 'Um passo de workflow interpola a saída do agente numa string de shell. Identifique a vulnerabilidade e proponha uma execução com menor privilégio. <em>Bloco 2 e bloco 5 · controle de segurança.</em>',
          placeholder: 'A vulnerabilidade é… Eu executaria assim…',
          rubrica: [
            'Saída do agente é <strong>entrada não confiável</strong>; interpolada numa string de shell, o shell a interpreta (aspas, <code>;</code>, substituição de comando).',
            'Execução por <strong>lista de argumentos</strong> com <code>shell=False</code>, sem string de shell.',
            '<strong>Allowlist</strong> de executáveis e <strong>diretório</strong> restrito ao workspace, com <strong>timeout</strong>.',
            'Terceiros como supply chain: <strong>revisão do conteúdo exato</strong>, SHA-256 e comandos em allowlist; <code>requires</code> não é contenção.',
            'Reconhece que ainda faltam <strong>sandbox de SO</strong>, identidade e proveniência de build.'
          ],
          modelo: '<p>A saída do agente é entrada não confiável: se eu a interpolo numa string de shell, quem a interpreta é o shell, e um <code>;</code> ou uma substituição de comando vira execução arbitrária com os meus privilégios. Executo por lista de argumentos com <code>shell=False</code>, com policy que permite só executáveis em allowlist, diretório dentro do workspace e timeout, e nego o resto (126). Se o passo vem de um workflow de terceiro, o trato como supply chain: reviso o conteúdo, calculo o SHA-256, libero só comandos em allowlist e exijo nova revisão a cada byte alterado. Isso ainda não substitui sandbox de SO, identidade e proveniência de build.</p>' + reprova('"validar a saída com uma regex e manter o shell", ou confiar em <code>requires</code> como contenção.') },
        { tipo: 'takeaway', html: 'Em cada resposta: <mark>nenhuma fonte vence por reflexo</mark> e <mark>exit code</mark> só vale com oráculo e <mark>controle negativo</mark>.' }
      ] },

      { rotulo: 'Estado, paralelismo e comparação', blocos: [
        { tipo: 'escolha', id: 'm01cp-esc-p5', titulo: 'P5 · Aquecimento: o efeito repetido',
          pergunta: 'Depois de uma pausa, a instância nova recebe de novo o passo do effect_id "e-42", que já foi aplicado. O que mantém o efeito de acontecer uma vez só?',
          opcoes: [
            { id: 'a', texto: 'O ledger no checkpoint registra "e-42" e o reducer devolve o estado sem efeito novo.', correta: true, porque: 'estado externalizado e idempotência por effect_id.' },
            { id: 'b', texto: 'O modelo lembra, pelo histórico do chat, que já fez isso.', correta: false, porque: 'o contexto pode truncar, resumir e conter texto não validado.' },
            { id: 'c', texto: 'Um prompt dizendo "não repita ações".', correta: false, porque: 'é um pedido probabilístico, sem evidência quando ignorado.' }
          ] },
        { tipo: 'escreva', id: 'm01cp-p5', titulo: 'P5 · Pausar e retomar', obrigatorio: false,
          enunciado: 'Modele <code>RUNNING → PAUSED → RUNNING</code> sem repetir um efeito externo após a retomada. <em>Bloco 3 · controle de segurança.</em>',
          placeholder: 'O estado fica em… O efeito é identificado por… Na retomada…',
          rubrica: [
            '<strong>Estado externalizado</strong>: checkpoint e ledger fora da sessão; a sessão é descartável.',
            'Agente como <strong>reducer puro</strong> (estado, evento) para novo estado.',
            '<strong><code>effect_id</code> idempotente</strong>: consulta o ledger antes de agir e registra; o mesmo id não produz efeito novo.',
            'A janela <strong>entre efeito e registro</strong>: idempotência no destino ou registro atômico.',
            '<strong>Orçamento de iteração</strong> que escala para ESCALATED com a razão do handoff.'
          ],
          modelo: '<p>O estado vive num checkpoint e num ledger fora da sessão, e o agente é um reducer puro: (estado, evento) vira novo estado. Cada efeito tem um <code>effect_id</code>: antes de agir consulto o ledger e, depois, registro. Ao pausar gravo o checkpoint; a instância nova o carrega, vai de PAUSED para RUNNING e, se receber o mesmo <code>effect_id</code>, não produz efeito novo. A queda entre o efeito e o registro ainda permite repetição, então o destino também precisa ser idempotente ou o registro precisa ser atômico com o efeito. Um orçamento de iterações escala para ESCALATED com a razão do handoff.</p>' + reprova('confiar no histórico do chat ou em "o modelo lembra" como ledger.') },

        { tipo: 'escreva', id: 'm01cp-p6', titulo: 'P6 · Duas tarefas em paralelo?', obrigatorio: false,
          enunciado: 'A tarefa A altera o endpoint <code>/extrato</code> e adiciona uma dependência ao lockfile. A tarefa B escreve testes de billing, usa o mesmo banco de teste e também mexe no lockfile. Podem rodar em paralelo? <em>Bloco 4.</em>',
          placeholder: 'Decido… Porque… Para paralelizar eu…',
          rubrica: [
            '<strong>Write sets disjuntos não bastam</strong>: compara read sets, contratos, schema, lockfile, banco, cache, porta, fila e dependências.',
            'Identifica o <strong>lockfile</strong> e o <strong>banco</strong> compartilhados como colisão.',
            'Propõe <strong>sequenciar, isolar ou estabilizar numa wave anterior</strong>.',
            'Exige <strong>gate de worker e gate global</strong>, contrato e condição de parada.',
            'Cita o custo: <strong>sua revisão</strong> é a fração sequencial (Amdahl) e começar com poucos workers.'
          ],
          modelo: '<p>Não, não como estão. Write sets disjuntos não bastam: as duas tarefas tocam o lockfile e usam o mesmo banco de teste, então colidem por recurso e por dependência. Eu sequenciaria o lockfile (por exemplo, a dependência numa wave anterior) ou isolaria o banco por tarefa; só então paralelizaria, cada worker com contrato, condição de parada e gate local, e um gate global na integração. Também conto o custo: a minha revisão é a parte sequencial pela Lei de Amdahl, e a coordenação cresce com os pares, então começo com dois workers.</p>' + reprova('"os arquivos são diferentes, então pode" ou confiar no merge textual.') },

        { tipo: 'escolha', id: 'm01cp-esc-p7', titulo: 'P7 · Aquecimento: a fundação compartilhada',
          pergunta: 'Duas features compartilham um contrato de dados. Em que wave estabilizá-lo?',
          opcoes: [
            { id: 'a', texto: 'Na wave 1, sequencial, antes das features em paralelo.', correta: true, porque: 'wave 1 = fundações compartilhadas; tudo depende delas.' },
            { id: 'b', texto: 'Na wave 3, junto da integração.', correta: false, porque: 'o conflito semântico já foi produzido em paralelo.' },
            { id: 'c', texto: 'Em nenhuma: o Git avisa se houver incompatibilidade.', correta: false, porque: 'o Git só enxerga texto.' }
          ] },
        { tipo: 'escreva', id: 'm01cp-p7', titulo: 'P7 · Merge limpo, gate vermelho', obrigatorio: false,
          enunciado: 'Dois merges Git saem limpos e cada worker passou no gate local, mas a integração falha. Explique por quê e em que wave o contrato compartilhado deve ser estabilizado. <em>Bloco 4.</em>',
          placeholder: 'O Git vê… O gate global vê… Estabilizo na wave…',
          rubrica: [
            'Worktree isola <strong>diretório</strong>, não banco, porta, lockfile, nem <strong>semântica</strong>.',
            'Merge <strong>textual</strong> limpo ≠ comportamento <strong>compatível</strong>; exemplo do lab: produtor <code>amount=120</code>, consumidor <code>limit=110</code>.',
            'Só o <strong>gate global</strong> na integração detecta o conflito.',
            'O contrato é estabilizado na <strong>wave 1</strong> (fundações sequenciais), antes das features em paralelo (wave 2) e da integração (wave 3).'
          ],
          modelo: '<p>O Git só enxerga texto: dois arquivos diferentes mesclam sem conflito, e cada gate local passa contra a base. Mas a worktree isola diretório, não semântica: se o produtor emite <code>amount=120</code> e o consumidor aceita <code>limit=110</code>, o comportamento integrado é incompatível, e só o gate global na integração vê isso. Por isso o contrato compartilhado é estabilizado na wave 1, sequencial, antes das features em paralelo na wave 2; a wave 3 integra e roda o gate global.</p>' + reprova('"se o merge saiu limpo, está integrado".') },

        { tipo: 'escreva', id: 'm01cp-p8', titulo: 'P8 · Kit, Spec Kit e 12-Factor', obrigatorio: false,
          enunciado: 'Compare o kit portátil do curso com o Spec Kit e com o 12-Factor Agents, sem transformar implementação ou practitioner guidance em norma. <em>Blocos 1, 3 e 5.</em>',
          placeholder: 'O kit… O Spec Kit… O 12-Factor… O invariante é…',
          rubrica: [
            'Separa <strong>invariante, padrão e adapter</strong>.',
            'O <strong>Spec Kit</strong> é uma implementação open source, não a norma de SDD; a forma de invocar varia por adapter (<code>/speckit.*</code> ou <code>$speckit-*</code>) e se descobre na versão instalada.',
            'O <strong>kit do curso</strong>: contrato canônico, Agent Skills e adapters mínimos com o mesmo fingerprint.',
            'O <strong>12-Factor Agents</strong> é guia de practitioner (HumanLayer, 2025): cada fator exige artefato, teste ou telemetria e contrapontos (fator 10 aumenta a coordenação).',
            'Data de verificação e janela de revalidação das fontes de alto risco.'
          ],
          modelo: '<p>O invariante é o problema de engenharia (requisito, decisão, tarefa, teste e evidência fora do chat); o padrão é o contrato verificável (o contrato canônico do kit, Agent Skills); o adapter é como cada ferramenta o implementa. O Spec Kit é uma implementação open source e uma referência para comparar decisões, não a norma de SDD: a forma de chamar (<code>/speckit.*</code> ou <code>$speckit-*</code>) varia por adapter e eu a descubro na versão instalada. O kit do curso mantém a regra de domínio num contrato canônico e dois adapters mínimos com o mesmo fingerprint, para eu poder adotar, trocar ou remover a ferramenta. O 12-Factor Agents é guia de practitioner: aceito cada fator quando houver artefato, teste ou telemetria que o sustente e registro contrapontos, como o custo de coordenação do fator 10. Em fontes de alto risco, registro a data de verificação e revalido a cada 90 dias.</p>' + reprova('chamar o Spec Kit de "o padrão de SDD" ou o 12-Factor de norma.') },

        { tipo: 'callout', tom: 'success', titulo: 'Entregáveis verificados: mostre rodando', html:
          '<ul><li><code>validate</code> aceita a fixture válida e retorna 20 com diagnósticos na inválida, sem mutá-la.</li>' +
          '<li>Ruff, mypy estrito e a suíte (27 testes na baseline registrada) passam; o type error e o mutante conhecido falham como planejado.</li>' +
          '<li><code>evidence/run.json</code> contém argv, versão real, duração, código e saída UTF-8.</li>' +
          '<li>Pause e resume preservam o <code>effect_id</code>; orçamento esgotado produz escalonamento com handoff.</li>' +
          '<li>A fixture Git demonstra merges textualmente limpos, a falha 120/110 e a recusa de cleanup com worktree suja.</li>' +
          '<li>As skills e os dois adapters compartilham o mesmo contrato; o Capstone tem trace e handoff reproduzível.</li></ul>' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes técnicas verificadas em 14/08/2026; panorama industrial (Octoverse 2025) a revalidar até 18/11/2026; documentação de produto, comandos e versões no máximo a cada 90 dias.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: <mark>invariante</mark> primeiro, <mark>evidência</mark> real depois, e nenhuma implementação transformada em <mark>norma</mark>.' }
      ] }
    ]
  });
})();
