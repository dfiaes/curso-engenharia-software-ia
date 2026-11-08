/* M08 · Bloco 7: Frameworks. Fonte: M08.html#b07. Panorama de frameworks verificado em 14/09/2026 (revalidar em até 90 dias, política da seção Fontes). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoDec = String.raw`def decidir(problema, ve_prompt_final, fronteira_fina, prende_provedor):
    """As quatro perguntas, na ordem. Convenção do exercício:
    problema: o que você não resolve bem sozinho (str) ou None
    ve_prompt_final: dá para ver e editar o prompt que ele envia? (bool)
    fronteira_fina: o domínio fica atrás de uma interface sua, sem importar o framework? (bool)
    prende_provedor: ele te prende a um provedor? (bool)"""
    # TODO: devolva a PRIMEIRA que valer, nesta ordem:
    #   sem problema nomeado                -> "nao_adotar"
    #   não vê o prompt final               -> "eliminar"
    #   sem fronteira fina (custo de sair)  -> "escrever_fronteira_antes"
    #   prende a um provedor                -> "pesar_agnosticismo"
    #   senão                               -> "adotar_com_gatilho"
    return "adotar_com_gatilho"
`;
  var solucaoDec = String.raw`def decidir(problema, ve_prompt_final, fronteira_fina, prende_provedor):
    if not problema:
        return "nao_adotar"
    if not ve_prompt_final:
        return "eliminar"
    if not fronteira_fina:
        return "escrever_fronteira_antes"
    if prende_provedor:
        return "pesar_agnosticismo"
    return "adotar_com_gatilho"
`;
  var testesDec = String.raw`def test_sem_problema_nao_adota():
    assert decidir(None, True, True, False) == "nao_adotar"
    assert decidir("", True, True, False) == "nao_adotar"


def test_prompt_opaco_e_eliminatorio():
    assert decidir("retomada durável", False, True, False) == "eliminar"


def test_eliminatorio_vem_antes_do_resto():
    assert decidir("retomada durável", False, False, True) == "eliminar"


def test_sem_fronteira_escreve_a_fronteira_primeiro():
    assert decidir("retomada durável", True, False, False) == "escrever_fronteira_antes"


def test_gravidade_de_provedor_pesa_contra_a_tese_de_agnosticismo():
    assert decidir("retomada durável", True, True, True) == "pesar_agnosticismo"


def test_caminho_feliz_adota_com_gatilho():
    assert decidir("retomada durável", True, True, False) == "adotar_com_gatilho"


def test_problema_tem_precedencia_sobre_transparencia():
    assert decidir(None, False, False, True) == "nao_adotar"
`;

  TrilhaAula.registrar({
    id: 'm08-b7',
    titulo: 'Frameworks: panorama honesto e critério de escolha',
    minutos: 30,
    resumo: 'Você chega ao bloco 7 tendo construído loop, ferramentas, contexto, memória e subagente à mão. A pergunta deixa de ser "qual framework aprender?" e vira "que parte do que eu já tenho vale a pena delegar, e a que custo?".',
    objetivo: 'Aplicar as quatro perguntas de escolha de framework, separar o que ele entrega do que você já tem e escrever a decisão com gatilho.',
    revisao: [
      { id: 'm08b7-valor', pergunta: 'Dado que você já escreveu loop, gateway de provedor e observabilidade, qual valor real um framework ainda entrega neste curso?',
        opcoes: [
          opc('a', 'Orquestração com estado durável: checkpointing/retomada e human-in-the-loop com pausa (por isso o LangGraph aparece no M10)', true, 'o que sobra é o que é chato de implementar direito.'),
          opc('b', 'O loop de tool calling', false, 'são cerca de 80 linhas, e as suas já têm orçamento triplo.'),
          opc('c', 'A abstração de provedor', false, 'é o gateway do M05.'),
          opc('d', 'Observabilidade', false, 'você já tem, com OTel (M06).')] },
      { id: 'm08b7-eliminatorio', pergunta: 'Qual é o critério eliminatório para um framework no caminho crítico?',
        opcoes: [
          opc('a', 'Conseguir ver e editar o prompt final enviado ao modelo (teste: ligar o log de requisições HTTP e ler o payload real)', true, 'o framework esconde justamente o material necessário para depurar qualidade e controlar custo.'),
          opc('b', 'Ter muitas estrelas no GitHub', false, 'popularidade não diz nada sobre o seu caso.'),
          opc('c', 'Ser do mesmo fornecedor do modelo', false, 'isso aumenta a gravidade de plataforma.'),
          opc('d', 'Ter uma metáfora fácil, como "equipe de agentes"', false, 'a metáfora de papéis induz multi-agente onde não precisa.')] },
      { id: 'm08b7-saida', pergunta: 'Qual a estratégia de menor arrependimento ao adotar um framework?',
        opcoes: [
          opc('a', 'Escrever a fronteira primeiro (interface do domínio), implementar à mão e trocar a implementação por framework quando compensar', true, 'o contrato fica; a implementação é trocável, como o gateway do M05 isola o LiteLLM.'),
          opc('b', 'Adotar o framework como espinha dorsal desde o início', false, 'sair vira reescrever.'),
          opc('c', 'Nunca adotar framework', false, 'a resposta é por caso, com gatilho, não ideológica.')] },
      { id: 'm08b7-cache', pergunta: 'Depois de adotar um framework, o cache de prompt parou de funcionar. Causa mais provável?',
        opcoes: [
          opc('a', 'O framework remonta as mensagens em ordem diferente, quebrando o prefixo byte a byte', true, 'capture o payload real, fixe a ordem ou mantenha o gateway próprio no caminho crítico.'),
          opc('b', 'O provedor desativou o cache', false, 'o sintoma aparece com a adoção, o que aponta para a montagem das mensagens.'),
          opc('c', 'O modelo ficou mais caro', false, 'preço não quebra o prefixo.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Você chega aqui tendo construído tudo à mão, e é exatamente a posição certa para avaliar frameworks: você sabe o que eles fazem porque fez. A resposta madura nunca foi ideológica. É <strong>o que o framework resolve que eu resolveria pior, e o que ele esconde que eu preciso ver?</strong></p>' +
          '<p>A camada escondida é o <strong>prompt e o contexto exatos enviados ao modelo</strong>, justamente o material para depurar qualidade (M06) e controlar custo (M05). Framework que não deixa ver e editar o prompt final é inaceitável no caminho crítico.</p>' +
          '<h3>O que um framework entrega, e o que você já tem</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Entrega</th><th>Valor real</th><th>Você já tem?</th></tr></thead><tbody>' +
          '<tr><td>Loop de tool calling</td><td>baixo: são cerca de 80 linhas</td><td>sim (bloco 5, e melhor: com orçamento triplo)</td></tr>' +
          '<tr><td>Abstração de provedor</td><td>médio</td><td>sim: é o gateway do M05 b6</td></tr>' +
          '<tr><td>Grafo de estados / orquestração</td><td>alto, se você precisa de ramificação complexa</td><td>não (é o M10)</td></tr>' +
          '<tr><td>Checkpointing e retomada durável</td><td>alto: é chato de implementar direito</td><td>não (é o M10)</td></tr>' +
          '<tr><td>Human-in-the-loop com pausa/retomada</td><td>alto</td><td>parcial: gancho no bloco 5; completo no M10/M12</td></tr>' +
          '<tr><td>Observabilidade integrada</td><td>médio</td><td>sim (M06 b5, com OTel padrão)</td></tr>' +
          '<tr><td>Integrações prontas (conectores)</td><td>variável</td><td>MCP resolve melhor e de forma agnóstica (M09)</td></tr>' +
          '</tbody></table>' +
          '<p>Leia a coluna da direita: o que sobra de valor real hoje é <strong>orquestração com estado durável</strong>, e por isso o LangGraph aparece no M10 e não aqui. Adotar um framework agora, para ganhar o que você já tem, é trocar código seu por dependência alheia sem contrapartida.</p>' },
        { tipo: 'takeaway', html: 'Delegue ao framework o que é <mark>chato de implementar direito</mark> (estado durável), não o que você <mark>já tem</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>O panorama</h3>' +
          '<p>Verificado em 14/09/2026; docs de framework são informação de alto risco e devem ser revalidadas em até 90 dias. Frameworks são <em>adapters</em>: nenhum define o currículo.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Framework</th><th>Modelo mental</th><th>Forte em</th><th>Cuidado</th></tr></thead><tbody>' +
          '<tr><td>LangGraph (LangChain)</td><td>grafo de estados explícito: nós, arestas condicionais, estado tipado</td><td>checkpointing, retomada, human-in-the-loop, ramificação complexa; é o que o curso adota no M10</td><td>API mudou bastante entre versões: pinne e leia a doc da SUA versão; o ecossistema LangChain traz peso que você pode não querer</td></tr>' +
          '<tr><td>Pydantic AI</td><td>agente tipado, no espírito do FastAPI: dependências injetadas, saída validada</td><td>alinhamento com este curso (Pydantic, tipagem, mypy); ótimo para agente único bem tipado</td><td>menos maduro em orquestração durável de grafo</td></tr>' +
          '<tr><td>CrewAI</td><td>"equipe" de agentes com papéis e tarefas</td><td>prototipagem rápida de multi-agente; metáfora fácil de explicar</td><td>a metáfora de papéis induz multi-agente onde não precisa (bloco 6); menos controle fino</td></tr>' +
          '<tr><td>OpenAI Agents SDK</td><td>agentes com handoffs e guardrails</td><td>simplicidade; bom com o ecossistema do provedor</td><td>gravidade para um provedor: pesar contra a tese de agnosticismo do curso</td></tr>' +
          '<tr><td>Google ADK</td><td>agentes e workflows com forte integração ao ecossistema Google/A2A</td><td>quem está em GCP; suporte de primeira classe a A2A (M09)</td><td>mesma observação de gravidade de plataforma</td></tr>' +
          '<tr><td>Microsoft Agent Framework</td><td>SDK unificado para agentes e workflows em grafo, com MCP e A2A</td><td>ambientes corporativos Microsoft</td><td>fora do caminho deste curso (Python); avaliar pelo mesmo critério</td></tr>' +
          '</tbody></table>' },
        { tipo: 'rode', id: 'b7-rode-criterio', titulo: 'As quatro perguntas, aplicadas',
          enunciado: 'Aplique o critério a um candidato: um framework que oferece retomada durável, mas monta o prompt internamente. Os resultados são <strong>ilustrativos</strong>, para fixar a ordem das perguntas.',
          prefixo: 'Prompt', entrada: 'Devo adotar o framework X no caminho crítico do investigador?', unidade: 's', terminalTitulo: 'critério de escolha · ilustrativo',
          prever: { pergunta: 'O framework entrega retomada durável (um problema real), mas não permite ver nem editar o prompt final. Qual a decisão?', opcoes: [
            { id: 'a', texto: 'Adotar: retomada durável compensa qualquer opacidade.', correta: false, porque: 'ver o prompt final é eliminatório no caminho crítico.' },
            { id: 'b', texto: 'Eliminar do caminho crítico: sem ver e editar o prompt final, não dá para depurar qualidade nem controlar custo.', correta: true, porque: 'a pergunta 2 elimina, e não é compensada por valor em outra.' },
            { id: 'c', texto: 'Adotar e confiar nos logs do próprio framework.', correta: false, porque: 'o log do framework é a visão dele; o teste é o payload HTTP real.' }
          ] },
          etapas: [
            { id: 'p1', nome: '1 · Que problema?', descricao: 'O que eu não resolvo bem sozinho', tom: 'dns', ms: 1, linhas: [
              L('out', 'retomada durável de execução longa: candidato claro (M10)'),
              L('hint', 'se a resposta fosse "nenhum", a conversa acabava aqui: não adote')] },
            { id: 'p2', nome: '2 · Vejo o prompt?', descricao: 'Ver e editar o prompt final', tom: 'tls', ms: 1, linhas: [
              L('info', 'teste prático: ligar o log de requisições HTTP e ler o payload real'),
              L('out', 'prompt montado dentro do framework, sem acesso ao payload final'),
              L('hint', 'eliminatório para o caminho crítico')] },
            { id: 'p3', nome: '3 · Custo de sair', descricao: 'O que custa trocar depois', tom: 'request', ms: 1, linhas: [
              L('info', 'fronteira fina: o domínio não importa o framework (como o services/llm/gateway.py isola o LiteLLM)'),
              L('hint', 'se o framework é a espinha dorsal, sair é reescrever')] },
            { id: 'p4', nome: '4 · Me prende?', descricao: 'Gravidade de provedor', tom: 'response', ms: 1, linhas: [
              L('info', 'contra a tese de agnosticismo do currículo e contra o modelo local (M11)'),
              L('hint', 'decisão sem gatilho escrito é dogma')] }
          ],
          tutorDepois: 'As perguntas têm ordem: a segunda elimina, e nenhuma vantagem em outra a compensa.',
          callout: 'Você aplicou as quatro perguntas na ordem e viu a transparência eliminar o candidato.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fundamento: build × buy e o custo de abstração', html:
          '<ul><li>A pergunta certa não é "é bom?", é "é bom <em>para o meu caso</em>?". Framework brilha onde o problema é genérico e o tempo é curto; atrapalha onde o problema é o seu diferencial.</li>' +
          '<li>Abstração cobra <strong>pedágio de compreensão</strong>: toda camada que você não escreveu é uma que você não sabe depurar às 3h da manhã. Aceitável em commodity (HTTP, serialização), caro no caminho crítico.</li>' +
          '<li><strong>Lei de Hyrum</strong>: com o tempo, você depende de comportamentos não documentados (a ordem em que ele monta as mensagens, o formato exato do prompt), e atualizar a versão vira regressão de qualidade. O eval do M06 é a rede de segurança de qualquer adoção.</li>' +
          '<li><strong>Menor arrependimento</strong>: escreva a fronteira primeiro, implemente à mão e troque a implementação se compensar.</li></ul>' },
        { tipo: 'takeaway', html: '<mark>Ver e editar o prompt final</mark> é eliminatório; o resto é <mark>pesar</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b7-python-criterio', titulo: 'Codifique o critério de escolha', obrigatorio: false,
          enunciado: 'As quatro perguntas, na ordem do bloco, viram uma função: <code>decidir</code> devolve a primeira decisão que valer. A convenção dos rótulos é do exercício; a ordem e o caráter eliminatório da pergunta 2 vêm do bloco.',
          codigo: codigoDec, testes: testesDec,
          dica: 'Quatro ifs em sequência, cada um devolvendo o rótulo correspondente; o último caso é o retorno final.',
          solucao: solucaoDec,
          tutorDepois: 'A ordem importa: um candidato sem problema nomeado nem chega a ser avaliado por transparência.',
          callout: 'Critério codificado: problema primeiro, transparência como eliminatória, depois custo de sair e gravidade de provedor.' },
        { tipo: 'complete', id: 'b7-complete-adr', titulo: 'Complete o ADR com gatilho', linguagem: 'markdown',
          enunciado: 'Monte a decisão do investigador. Escolha, em cada lacuna, a peça que faz da decisão uma decisão com gatilho, não um dogma.',
          partes: [
            '# ADR: orquestração do agente investigador\n**Decisão:** ',
            { lacuna: 'dec', opcoes: ['implementação manual agora, com a fronteira do domínio escrita à parte', 'adotar o framework mais popular em todo o produto', 'nunca usar framework'], correta: 'implementação manual agora, com a fronteira do domínio escrita à parte' },
            '\n**Gatilho:** ',
            { lacuna: 'gat', opcoes: ['quando precisarmos de retomada durável e HITL com pausa, adotar LangGraph (M10) atrás da mesma fronteira', 'quando o time achar que está na hora', 'quando outro time adotar'], correta: 'quando precisarmos de retomada durável e HITL com pausa, adotar LangGraph (M10) atrás da mesma fronteira' },
            '\n**Segurança:** ',
            { lacuna: 'seg', opcoes: ['o eval do M06 compara manual × framework antes de qualquer troca', 'confiar na documentação do framework', 'testar só em produção'], correta: 'o eval do M06 compara manual × framework antes de qualquer troca' },
            '\n'
          ],
          explicacao: 'Decisão com gatilho é madura; sem gatilho é dogma. O eval é a rede de segurança contra a regressão silenciosa que a Lei de Hyrum antecipa.',
          callout: 'ADR completo: manual agora, LangGraph com gatilho de durabilidade e eval como rede de segurança.' },
        { tipo: 'cenario', id: 'b7-cenario-time', titulo: 'O time quer adotar um framework', obrigatorio: false,
          enunciado: 'Um colega propõe adotar um framework de "equipe de agentes" para o investigador, porque a demo é bonita.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O investigador já tem loop, ferramentas, gateway e traces à mão. Qual a primeira resposta?', opcoes: [
              { texto: 'Perguntar que problema específico o framework resolve que o nosso código não resolve bem.', vai: 'problema', tom: 'ok', consequencia: 'a pergunta 1 filtra a maioria das adoções por moda.' },
              { texto: 'Aceitar: a metáfora de papéis facilita explicar para a diretoria.', vai: 'f-moda', tom: 'ruim', consequencia: 'a metáfora de papéis induz multi-agente onde não precisa.' }
            ] },
            problema: { texto: 'A resposta é "prototipar multi-agente mais rápido". O que falta checar antes de decidir?', opcoes: [
              { texto: 'Se dá para ver o payload HTTP real, o custo de sair e se há gatilho escrito; senão, ficar no manual.', vai: 'f-bom', tom: 'ok', consequencia: 'transparência, custo de sair e gatilho transformam opinião em decisão.' },
              { texto: 'Nada: protótipo não precisa de critério.', vai: 'f-protipo', tom: 'ruim', consequencia: 'protótipo que vira produção leva a dependência junto.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Decisão registrada com critério e gatilho, e a fronteira do domínio segue sua.' },
            'f-moda': { bom: false, texto: 'Dependência alheia no caminho crítico, sem problema nomeado e com multi-agente que ninguém mediu.' },
            'f-protipo': { bom: false, texto: 'O protótipo virou produção e trocá-lo agora é reescrever.' }
          },
          callout: 'Você pediu o problema, a transparência e o gatilho antes de aceitar a dependência.' },
        { tipo: 'takeaway', html: 'Decisão <mark>com gatilho</mark> é madura; sem gatilho é <mark>dogma</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b7-escolha-valor', titulo: 'Confira: o que o framework entrega',
          pergunta: 'Para um agente com loop, gateway de provedor e OTel já escritos, qual necessidade justifica olhar um framework?',
          opcoes: [
            { id: 'a', texto: 'Substituir o loop de tool calling por uma versão pronta.', correta: false, porque: 'são cerca de 80 linhas, e as suas já têm orçamento triplo.' },
            { id: 'b', texto: 'Execuções longas que precisam de checkpointing, retomada e HITL com pausa.', correta: true, porque: 'é o valor que não se tem e é difícil de implementar direito: o M10.' },
            { id: 'c', texto: 'Ganhar abstração de provedor.', correta: false, porque: 'é o gateway do M05.' },
            { id: 'd', texto: 'Ter observabilidade.', correta: false, porque: 'OTel padrão já cobre (M06 b5).' }
          ], tutorDepois: 'Leia a coluna "você já tem?" antes de qualquer adoção.' },
        { tipo: 'escolha', id: 'b7-escolha-teste', titulo: 'Confira: o teste do prompt final',
          pergunta: 'Como você verifica, na prática, se um framework deixa ver o prompt que ele envia?',
          opcoes: [
            { id: 'a', texto: 'Ler a seção de recursos do site do framework.', correta: false, porque: 'marketing não é payload.' },
            { id: 'b', texto: 'Rodar com o log de requisições HTTP ligado e ler o payload real.', correta: true, porque: 'é o teste prático do bloco: mostra prompt final, ordem das mensagens e o que quebra o cache.' },
            { id: 'c', texto: 'Perguntar ao próprio modelo qual foi o prompt.', correta: false, porque: 'o modelo não é fonte confiável do que foi enviado.' }
          ], tutorDepois: 'A diferença entre manual e framework costuma estar na ordem das mensagens e no cache.' },
        { tipo: 'takeaway', html: 'Antes de adotar: <mark>que problema</mark>, <mark>vejo o prompt</mark>, <mark>custo de sair</mark>, <mark>me prende</mark>.' }
      ] }
    ]
  });
})();
