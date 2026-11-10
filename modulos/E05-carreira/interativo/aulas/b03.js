/* E05 · Bloco 3: entrevistas de AI engineering. Fonte: E05.html#b03. Banco do laboratório: 46 perguntas em 11 temas. */
(function () {
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'e05-b3',
    titulo: 'Entrevistas de AI engineering',
    minutos: 40,
    resumo: 'Etapas, preparação por mecanismos, resposta de sênior em camadas, STAR e perguntas para avaliar a empresa.',
    objetivo: 'Responder perguntas abertas em 2 a 3 minutos com mecanismo, número e limite, e avaliar a empresa tão duramente quanto ela avalia você.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Entrevista é um teste de comunicação sob pressão, com perguntas que o campo ainda não padronizou. Para o sênior há um agravante: espera-se que você conduza a conversa, nomeie trade-offs e diga "depende de X" já listando o X. Responder como júnior, com definição de glossário, é o jeito mais comum de reprovar com 20 anos de experiência.</p>' +
          '<h3>Etapas típicas</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Etapa</th><th>O que avalia</th><th>Como se preparar</th></tr></thead><tbody>' +
          '<tr><td>Triagem com recrutamento</td><td>Escopo, faixa, idioma, disponibilidade</td><td>Pitch de 60 segundos; pergunte escopo e nível antes de falar de valores</td></tr>' +
          '<tr><td>Conversa com gestor</td><td>Motivação, histórico, comunicação, encaixe</td><td>"Por que IA, por que agora" com evidência (<code>comp-why-ai</code>)</td></tr>' +
          '<tr><td>Técnica de código</td><td>Python, estruturas de dados, testes, às vezes API de modelo</td><td>Revisar F03, escrever testes com fake do provedor, saída estruturada</td></tr>' +
          '<tr><td>System design de IA</td><td>Requisitos, desenho, avaliação, custo, falhas</td><td>Método do E01, em voz alta</td></tr>' +
          '<tr><td>Profundidade em IA aplicada</td><td>RAG, agentes, evals, segurança, produção</td><td>Banco de perguntas do laboratório</td></tr>' +
          '<tr><td>Comportamental e liderança</td><td>Falhas, desacordos, mentoria, impacto</td><td>Histórias STAR e E04</td></tr>' +
          '<tr><td>Take-home ou sessão com o time</td><td>Trabalho real, escrita, julgamento sobre escopo</td><td>Negocie o prazo; entregue README no padrão do Bloco 2</td></tr>' +
          '</tbody></table>' +
          '<p>As etapas variam: empresas pequenas reduzem tudo a duas conversas; grandes e internacionais somam comitês. Pergunte o formato na triagem: é legítimo e mostra seriedade.</p>' },
        { tipo: 'texto', html:
          '<h3>Prepare por mecanismos e decisões</h3>' +
          '<p>Para cada tema (evals, RAG, agentes, custo, segurança, adaptação de modelos, produção) tenha prontos: o <strong>mecanismo em três frases</strong>, <strong>um número do seu projeto</strong>, <strong>um trade-off</strong> e <strong>um modo de falha</strong>. O banco do laboratório tem 46 perguntas em 11 temas, cada uma com resposta-modelo curta e critérios. Use assim: leia a pergunta, responda <em>em voz alta</em> em até 2 minutos (grave, se puder), só então compare com a resposta-modelo. A resposta-modelo é o piso; a sua precisa conter o mesmo mecanismo com o seu exemplo.</p>' +
          '<h3>Banco de perguntas: amostra</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Pergunta (módulo)</th><th>Esqueleto da resposta</th></tr></thead><tbody>' +
          '<tr><td>Eval offline verde e usuários reclamam. Hipóteses? (M06)</td><td>Distribuição do conjunto diferente da produção; métrica errada; ajuste excessivo ou contaminação; falha fora do modelo (latência, truncamento, recuperação). Traces e feedback trazem casos reais ao conjunto.</td></tr>' +
          '<tr><td>Base sem a resposta: como se comportar? (M07)</td><td>Abster-se e dizer o que não achou. Sinal de recuperação (score mínimo, contexto vazio) mais instrução; medir com perguntas sem resposta; separar abstenção correta de indevida.</td></tr>' +
          '<tr><td>Agente em laço gastando dinheiro. (M08)</td><td>Limites duros de passos, tokens, tempo e custo; detecção de chamada repetida; checkpoint; trace. Orçamento como contrato.</td></tr>' +
          '<tr><td>Prompt injection indireta. (M12)</td><td>Instrução maliciosa em conteúdo lido pelo modelo. Sem filtro perfeito: privilégio mínimo, separar dados de instruções, aprovação humana em ação sensível, saída validada, sem exfiltração por links.</td></tr>' +
          '<tr><td>Fine-tuning ou RAG? (E02)</td><td>RAG para conhecimento que muda e exige fonte; fine-tuning para comportamento, formato e tarefas estreitas. Esgotar prompt e RAG antes.</td></tr>' +
          '<tr><td>Assistente sobre documentos internos. (E01)</td><td>Requisitos primeiro (volume, atualização, permissões, latência, custo). Ingestão, consulta híbrida com reranking, citação e abstenção, avaliação, observabilidade. Falhas: documentos atualizados, permissões divergentes, PDFs ruins.</td></tr>' +
          '<tr><td>Conte uma falha sua em produção. (comportamental)</td><td>STAR com falha real, a sua parte na causa, detecção, correção e mudança de processo.</td></tr>' +
          '<tr><td>20 anos de .NET: por que migrar para IA? (comportamental)</td><td>O problema de engenharia mudou de lugar; contratos, testes, operação e segurança seguem centrais; evidência pública e o que falta aprender.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'Prepare <mark>mecanismo, número, trade-off e modo de falha</mark> por tema; resposta decorada cai no primeiro "e na prática?".' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Uma resposta de sênior, camada por camada</h3>' +
          '<p>Pergunta: <em>"A conta de tokens dobrou no mês. Por onde você começa?"</em></p>' +
          '<p><strong>Resposta fraca:</strong> "Trocaria para um modelo mais barato e usaria cache." Salta para a solução sem diagnóstico e ignora o risco de piorar a qualidade.</p>' +
          '<p>A resposta de sênior, em cerca de 90 segundos, tem cinco movimentos: <strong>enquadrar, medir, priorizar, proteger a qualidade e dizer o limite</strong>. Antes de ler o detalhe, ordene.</p>' },
        { tipo: 'ordene', id: 'b3-ordene', titulo: 'Ordene a resposta de sênior',
          enunciado: 'Coloque os movimentos na ordem em que a resposta deve ser dada.',
          itens: [
            { id: 'pro', texto: 'Protejo a qualidade: cada corte passa pelo conjunto de avaliação com gate' },
            { id: 'enq', texto: 'Enquadro: o que dobrou, volume, tokens por requisição ou preço do modelo?' },
            { id: 'lim', texto: 'Digo o limite: se o crescimento é uso legítimo, a resposta é orçamento e precificação' },
            { id: 'pri', texto: 'Priorizo o maior item, com hipóteses (prompt inchado, contexto em excesso, modelo grande demais)' },
            { id: 'med', texto: 'Meço: custo por funcionalidade, por cliente e por tipo de token' }
          ],
          solucao: ['enq', 'med', 'pri', 'pro', 'lim'],
          dica: 'Primeiro descubra o que dobrou; só depois corte, e sempre com a qualidade protegida.',
          callout: 'Enquadrar, medir, priorizar, proteger qualidade, dizer o limite: serve para quase toda pergunta aberta de operação.' },
        { tipo: 'texto', html:
          '<p>Na prática, o "meço" soa assim: "quebro custo por funcionalidade, por cliente e por tipo de token (entrada, saída, cache). No Cartógrafo eu registro isso por requisição no gateway; costumo achar que uma ou duas funcionalidades concentram a maior parte." Para system design, a sequência do E01 (requisitos, estimativa, API, dados, desenho, gargalos, trade-offs) cumpre o mesmo papel.</p>' +
          '<h3>STAR sem teatro</h3>' +
          '<p>STAR (Situação, Tarefa, Ação, Resultado) com dois ajustes para sênior: mais peso na <em>Ação</em> (suas decisões, não as do time) e um quinto elemento, <em>Aprendizado</em> (o que mudou no processo). Tenha de cinco a seis histórias reais: falha em produção, desacordo técnico, projeto de maior impacto, mentoria, decisão sob incerteza e uma vez que você mudou de ideia por causa de dados. Tempo (2 a 3 minutos): Situação e Tarefa 30 s; Ação 80 s; Resultado com número 30 s; Aprendizado 20 s.</p>' +
          '<p><strong>Não invente.</strong> Entrevistadores aprofundam ("e o que o time achou?", "quanto tempo levou?"). História inventada desmorona no segundo "e então?".</p>' },
        { tipo: 'transcript', id: 'b3-transcript', titulo: 'Onde esta resposta comportamental falha?',
          enunciado: 'Pergunta: "Conte uma falha sua em produção." Marque as falas que <strong>enfraquecem</strong> a resposta de um sênior.',
          linhas: [
            { quem: 'voce', texto: 'Minha maior falha é ser perfeccionista demais.' },
            { quem: 'voce', texto: 'Um reprocessamento duplicou registros porque a operação não era idempotente.' },
            { quem: 'voce', texto: 'A culpa foi do time de infraestrutura, que não avisou da mudança.' },
            { quem: 'voce', texto: 'Eu tinha aprovado o desenho sem exigir chave de idempotência.' },
            { quem: 'voce', texto: 'Detectei por alerta, contive, corrigi e adicionei teste e checagem de duplicidade no CI.' },
            { quem: 'voce', texto: 'Hoje todo contrato de operação com efeito colateral no time declara a chave.' }
          ],
          erradas: [0, 2],
          explicacao: {
            0: 'falha disfarçada de virtude: não há impacto real, nem ação, nem aprendizado.',
            2: 'culpar terceiros tira a sua parte na causa, que é o que o sênior precisa mostrar.'
          },
          callout: 'A resposta boa assume a decisão, mede o impacto e termina em mudança duradoura de processo.' },
        { tipo: 'takeaway', html: 'Para sênior: <mark>sua parte na causa</mark>, impacto concreto e a <mark>mudança de processo</mark> que sobrou.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Enquadrar: o que dobrou?</h3>' +
          '<p>O primeiro movimento da resposta é enquadrar. O custo mensal é o produto de três fatores: <strong>volume</strong> de requisições, <strong>tokens por requisição</strong> e <strong>preço por milhão de tokens</strong>. Dobrar a conta pode vir de qualquer um, e a ação certa muda conforme o fator. Valores abaixo são fictícios, só do exercício.</p>' },
        { tipo: 'python', id: 'b3-custo', obrigatorio: false, titulo: 'Decomponha a conta que dobrou',
          enunciado: 'Complete <code>decompor(antes, depois)</code>. Cada argumento é um dict com <code>req</code> (requisições), <code>tok</code> (tokens por requisição) e <code>preco</code> (por milhão de tokens). Devolva <code>(fatores, causa)</code>: <code>fatores</code> é um dict com a razão depois/antes de <code>req</code>, <code>tok</code> e <code>preco</code>, e <code>causa</code> é a chave de maior razão. Se todas forem 1.0, a causa é <code>"nenhuma"</code>.',
          codigo: 'def decompor(antes, depois):\n    fatores = {}\n    # razao depois/antes para "req", "tok" e "preco"\n    causa = "nenhuma"\n    # a chave de maior razao (ou "nenhuma" se todas valerem 1.0)\n    return fatores, causa\n\n\nA = {"req": 1000, "tok": 800, "preco": 2.0}\nB = {"req": 2000, "tok": 800, "preco": 2.0}\nprint(decompor(A, B))\n',
          testes: 'A = {"req": 1000, "tok": 800, "preco": 2.0}\n\n\ndef test_volume():\n    f, c = decompor(A, dict(A, req=2000))\n    assert c == "req" and f["req"] == 2.0\n\n\ndef test_contexto_inchado():\n    f, c = decompor(A, dict(A, tok=1600))\n    assert c == "tok" and f["tok"] == 2.0\n\n\ndef test_preco():\n    f, c = decompor(A, dict(A, preco=4.0))\n    assert c == "preco"\n\n\ndef test_sem_mudanca():\n    f, c = decompor(A, dict(A))\n    assert c == "nenhuma" and f == {"req": 1.0, "tok": 1.0, "preco": 1.0}\n\n\ndef test_mistura():\n    f, c = decompor(A, {"req": 1500, "tok": 960, "preco": 2.0})\n    assert c == "req" and f["tok"] == 1.2\n\n\ndef test_controle_negativo_queda():\n    f, c = decompor(A, dict(A, req=500))\n    assert c == "nenhuma" and f["req"] == 0.5\n',
          dica: 'Monte <code>fatores</code> com um laço sobre <code>("req", "tok", "preco")</code>; a causa é <code>max(fatores, key=fatores.get)</code> se o maior valor passar de 1.0.',
          solucao: 'def decompor(antes, depois):\n    fatores = {k: depois[k] / antes[k] for k in ("req", "tok", "preco")}\n    causa = max(fatores, key=fatores.get)\n    if fatores[causa] <= 1.0:\n        causa = "nenhuma"\n    return fatores, causa\n',
          tutorDepois: 'Quando a causa é "req", o limite da resposta é orçamento e precificação, não corte. Quando é "tok", ataque prompt inchado e contexto em excesso, sempre com o gate de avaliação.',
          callout: 'Você transformou "a conta dobrou" em um diagnóstico por fator.' },
        { tipo: 'texto', html:
          '<h3>Inglês técnico e avaliar a empresa</h3>' +
          '<p>Para vagas internacionais, o gargalo é fluência sob pressão. Três práticas: (1) responda o banco <strong>em inglês, em voz alta</strong>, com limite de 2 minutos, e grave; (2) mantenha um glossário curto de frases de trade-off ("it depends on", "the trade-off here is", "I\'d start by measuring", "the failure mode is", "to be explicit about the assumption"); (3) treine <em>pedir esclarecimento</em> e <em>pedir tempo</em> ("Let me think about that for a moment", "Can I check I understood the constraint?"). Entrevista simulada com ferramenta de IA: critérios explícitos (clareza, estrutura, precisão técnica) e leitura cética, porque a ferramenta elogia demais.</p>' +
          '<p>Entrevista é bidirecional. Perguntas que revelam maturidade:</p>' +
          '<ul><li>"Como vocês medem hoje a qualidade das respostas? Posso ver um conjunto de avaliação ou relatório?" (sem resposta, não há engenharia de IA ainda)</li>' +
          '<li>"Qual foi o último incidente com o modelo em produção e o que mudou depois?"</li>' +
          '<li>"Quanto custa por usuário ou requisição, e quem é dono desse número?"</li>' +
          '<li>"Como tratam dados pessoais e segredos nos prompts e nos logs?" (E03)</li>' +
          '<li>"O que acontece se um experimento de IA não passar no critério de sucesso?"</li>' +
          '<li>"Quem decide o escopo desta função e a quem ela se reporta?"</li></ul>' +
          '<p>Leia as respostas pelo que evitam. Resposta vaga a "como medem qualidade" não elimina a vaga, mas muda a negociação: você pode entrar como quem <em>instala</em> a prática de avaliação, e isso deve aparecer no escopo, no nível e na remuneração.</p>' },
        { tipo: 'cenario', id: 'b3-cenario', titulo: 'A empresa não mede qualidade', obrigatorio: false,
          enunciado: 'Na entrevista final, você pergunta como medem a qualidade das respostas do sistema. Escolha como reagir.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A resposta: "Olhamos uns exemplos e a diretoria aprova." Não há conjunto de avaliação. A proposta chega no nível pleno, com escopo vago. O que faz?', opcoes: [
              { texto: 'Desistir: sem avaliação, não é engenharia de IA.', vai: 'f-desiste', tom: 'ruim', consequencia: 'a resposta vaga não elimina a vaga; ela muda a negociação.' },
              { texto: 'Negociar entrar como quem instala a prática de avaliação: escopo, nível e métricas dos primeiros 90 dias por escrito.', vai: 'f-bom', tom: 'ok', consequencia: 'a lacuna vira o escopo da função, e isso aparece em nível e remuneração.' },
              { texto: 'Aceitar sem mudar nada e instalar avaliação por conta própria.', vai: 'f-sem', tom: 'ruim', consequencia: 'sem escopo escrito, o trabalho de avaliação vira atribuição infinita sem reconhecimento.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Você entra com o escopo de instalar a avaliação, com nível e métricas combinados.' },
            'f-desiste': { bom: false, texto: 'Você perdeu uma vaga em que seria o dono da prática de avaliação.' },
            'f-sem': { bom: false, texto: 'Você faz o trabalho de plataforma de avaliação no nível de pleno, sem escopo escrito.' }
          },
          callout: 'Você usou a resposta vaga como argumento de escopo e nível.' },
        { tipo: 'takeaway', html: 'Diagnostique por <mark>fator</mark> antes de agir, e use as perguntas à empresa para <mark>negociar escopo</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b3-esc-tokens', titulo: 'Confira: a conta de tokens',
          pergunta: '"A conta de tokens dobrou no mês. Por onde você começa?" Qual abertura é de sênior?',
          opcoes: [
            opc('a', 'Trocar para um modelo mais barato e ligar cache.', false, 'salta para a solução e arrisca regressão invisível.'),
            opc('b', 'Enquadrar: descobrir o que dobrou (volume, tokens por requisição ou preço) e medir por funcionalidade, cliente e tipo de token antes de cortar.', true, 'depois vêm priorizar, proteger a qualidade com o gate e dizer o limite.'),
            opc('c', 'Pedir mais orçamento imediatamente.', false, 'se o crescimento é legítimo a resposta é orçamento, mas só depois do diagnóstico.')
          ] },
        { tipo: 'escolha', id: 'b3-esc-star', titulo: 'Confira: STAR de sênior',
          pergunta: 'Em perguntas comportamentais, o que muda no STAR para um sênior?',
          opcoes: [
            opc('a', 'Nada: o formato é universal.', false, 'o sênior é avaliado pelo julgamento.'),
            opc('b', 'Mais peso em Situação e Tarefa, para contextualizar.', false, 'o peso vai para a Ação.'),
            opc('c', 'Mais peso na Ação (suas decisões, não as do time) e um quinto elemento, Aprendizado: o que mudou no processo.', true, 'em 2 a 3 minutos: S+T 30 s, Ação 80 s, Resultado com número 30 s, Aprendizado 20 s.')
          ] },
        { tipo: 'escolha', id: 'b3-esc-nivel', titulo: 'Confira: nível de abstração',
          pergunta: 'O entrevistador técnico pergunta como você garantiria governança de uso de IA. Qual resposta desce ao nível certo?',
          opcoes: [
            opc('a', '"Eu colocaria uma camada de governança."', false, 'alto nível demais; soa vago.'),
            opc('b', 'Nomear o número, o contrato ou o modo de falha: qual métrica, qual limite, qual teste.', true, 'desça ao menos um nível; o inverso vale em reunião de liderança: não despeje detalhe onde se pede decisão.')
          ] },
        { tipo: 'takeaway', html: 'Desça <mark>um nível</mark> de abstração: nomeie o número, o contrato ou o <mark>modo de falha</mark>.' }
      ] }
    ],
    revisao: [
      { id: 'r1', pergunta: 'Qual a sequência reutilizável de uma resposta aberta de operação?', opcoes: [
        opc('a', 'Enquadrar, medir, priorizar, proteger a qualidade e dizer o limite.', true, 'para system design, a sequência do E01 cumpre o mesmo papel.'),
        opc('b', 'Definir os termos, citar a ferramenta e propor a solução.', false, 'é o erro comum de definir em vez de decidir.')] },
      { id: 'r2', pergunta: 'Entrevistador pergunta "como você avaliaria isso?" e você diz "testaria bastante". O que faltou?', opcoes: [
        opc('a', 'Conjunto dourado a partir de casos reais, métrica por categoria, separação entre ajuste e bloqueio, e gate de regressão no CI.', true, 'a pergunta quer ver "qualidade" virar procedimento medível.'),
        opc('b', 'Citar o nome de uma biblioteca de testes.', false, 'ferramenta onde se espera princípio.')] },
      { id: 'r3', pergunta: 'Qual o erro que mais derruba o sênior na pergunta "conte uma falha sua"?', opcoes: [
        opc('a', 'Contar falha disfarçada de qualidade ("sou perfeccionista") ou culpar terceiros.', true, 'o sênior precisa mostrar impacto real, sua parte na causa, mudança de processo e como soube que mudou.'),
        opc('b', 'Contar uma falha pequena demais.', false, 'o problema é a ausência de impacto e de parte na causa.')] },
      { id: 'r4', pergunta: 'Como preparar cada tema técnico?', opcoes: [
        opc('a', 'Mecanismo em três frases, um número do projeto, um trade-off e um modo de falha.', true, 'por mecanismos e decisões, não por respostas decoradas.'),
        opc('b', 'Memorizar a resposta-modelo palavra por palavra.', false, 'cai no primeiro "e na prática?".')] },
      { id: 'r5', pergunta: 'Qual pergunta à empresa revela se existe engenharia de IA?', opcoes: [
        opc('a', '"Como vocês medem hoje a qualidade das respostas? Posso ver um conjunto de avaliação ou relatório?"', true, 'sem resposta, não há engenharia de IA ainda; isso muda a negociação.'),
        opc('b', '"Vocês usam o modelo mais novo?"', false, 'fala de ferramenta, não de prática.')] }
    ]
  });
})();
