/* M00 · Bloco 1: Sistema de trabalho. Fonte: M00.html#b01. Saídas do harness_lab são execuções reais do laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var OK = 'python -m harness_lab validate examples/harness.safe.json';
  var BAD = 'python -m harness_lab validate examples/harness.invalid.json';

  var codigoDesenho = [
    'def desenho(etapas_conhecidas, efeito_caro, investigacao, tem_criterio):',
    '    """Desenho inicial de uma tarefa, na ordem de risco da tabela do bloco 1.3.',
    '',
    '    Devolve: "nao-automatizar", "workflow+aprovacao", "workflow" ou "agente-limitado".',
    '    """',
    '    # 1. sem critério claro de conclusão, o agente não sabe quando parar',
    '    # 2. efeito caro, irreversível ou regulado: variabilidade aumenta o risco',
    '    # 3. etapas conhecidas e nada a investigar: cabe em código e testes',
    '    # 4. o caminho depende do que for descoberto: autonomia limitada',
    '    return "workflow"',
    '',
    'print(desenho(True, False, False, True), desenho(False, False, True, True))',
    ''].join('\n');
  var testesDesenho = [
    'def test_soma_de_csv_e_workflow():',
    '    assert desenho(True, False, False, True) == "workflow"', '', '',
    'def test_reembolso_por_politica_pede_aprovacao():',
    '    assert desenho(True, True, False, True) == "workflow+aprovacao"', '', '',
    'def test_investigar_teste_que_falha_e_agente_limitado():',
    '    assert desenho(False, False, True, True) == "agente-limitado"', '', '',
    'def test_sem_criterio_nao_automatize():',
    '    assert desenho(False, False, True, False) == "nao-automatizar"', '', '',
    'def test_efeito_caro_vence_investigacao():',
    '    # controle: investigar é incerto, mas o efeito é financeiro',
    '    assert desenho(False, True, True, True) == "workflow+aprovacao"', ''].join('\n');
  var solucaoDesenho = [
    'def desenho(etapas_conhecidas, efeito_caro, investigacao, tem_criterio):',
    '    if not tem_criterio:', '        return "nao-automatizar"',
    '    if efeito_caro:', '        return "workflow+aprovacao"',
    '    if investigacao:', '        return "agente-limitado"',
    '    return "workflow"', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm00-b1',
    titulo: 'Sistema de trabalho: modelo, harness, workflow e agente',
    minutos: 35,
    resumo: 'Quando um arquivo muda por causa de um modelo, seis camadas participam. Diagnosticar a camada certa antes de trocar o modelo é a habilidade que este módulo treina.',
    objetivo: 'Separar modelo, cliente, harness, tool, ambiente e processo de engenharia numa falha concreta, escolher entre workflow e agente pela incerteza e pelo custo do erro e escrever um task contract.',
    revisao: [
      { id: 'm00b1-camadas', pergunta: 'Quais são as seis camadas envolvidas quando um arquivo é alterado com ajuda de um modelo?',
        opcoes: [
          opc('a', 'Modelo, cliente, harness, tool, ambiente e processo de engenharia', true, 'cada uma tem responsabilidade e falha típica própria; diagnosticar a camada vem antes de trocar o modelo.'),
          opc('b', 'Prompt, modelo, GPU, rede, usuário e repositório', false, 'mistura insumos e infraestrutura com camadas de responsabilidade.'),
          opc('c', 'Apenas modelo e prompt', false, 'ignora o harness, as tools, o ambiente e o processo, onde estão muitas das falhas reais.')] },
      { id: 'm00b1-ambiente', pergunta: 'O teste passa no notebook de quem alterou o código e falha no CI porque um pacote não está instalado lá. Qual camada é a causa mais provável?',
        opcoes: [
          opc('a', 'O ambiente: a dependência que faz o teste rodar não existe no CI', true, 'o sintoma (falha só no CI, por pacote ausente) aponta para o ambiente.'),
          opc('b', 'O modelo, que gerou um patch incorreto', false, 'trocar de modelo antes de separar as camadas aumenta custo sem tocar na causa.'),
          opc('c', 'O cliente, que enviou o prompt errado', false, 'o cliente não instala pacotes no CI.')] },
      { id: 'm00b1-workflow', pergunta: 'O que distingue um workflow de um agente?',
        opcoes: [
          opc('a', 'Workflow define no código as etapas e transições; agente delega ao modelo alguma escolha relevante sobre a próxima ação', true, 'não são exclusivos: um workflow pode conter uma chamada de LLM, e um agente pode operar dentro de um workflow com limites.'),
          opc('b', 'Workflow nunca usa modelo; agente sempre usa', false, 'um workflow pode conter chamadas de LLM.'),
          opc('c', 'Agente é sempre mais seguro porque decide sozinho', false, 'a variabilidade aumenta o risco quando o efeito é caro ou irreversível.')] },
      { id: 'm00b1-contrato', pergunta: 'Que campos o task contract fixa para delimitar o espaço de decisão?',
        opcoes: [
          opc('a', 'Objetivo, em escopo, fora de escopo, contexto inicial, capacidades, evidência, quando parar e o que entregar', true, 'o contrato não diz ao modelo como pensar: define o espaço de decisão e o que conta como concluído.'),
          opc('b', 'Só o objetivo, em uma frase', false, 'sem fora de escopo, capacidades, evidência e parada, o agente decide o que não devia.'),
          opc('c', 'O passo a passo de raciocínio que o modelo deve seguir', false, 'o contrato delimita decisões, não instrui o pensamento.')] },
      { id: 'm00b1-estorno', pergunta: 'Um pedido de estorno chega em linguagem livre, e o estorno é financeiro e difícil de reverter. Qual é o desenho inicial mais defensável?',
        opcoes: [
          opc('a', 'Agente resume o pedido e aponta a política; workflow valida a elegibilidade e exige aprovação antes do efeito', true, 'a parte ambígua pode usar o modelo; a parte de alto custo fica em código com aprovação.'),
          opc('b', 'Agente autônomo decide e executa o estorno', false, 'linguagem livre não justifica delegar um efeito financeiro irreversível.'),
          opc('c', 'Dar a ferramenta de estorno ao agente e confiar na instrução “não estorne sem motivo”', false, 'instrução não é capability.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Um teste de validação passa no notebook de quem alterou o código e falha no CI. A reação comum é “pedir para a IA corrigir” ou trocar por um modelo maior. Antes disso, pergunte quais camadas estão envolvidas: quando um arquivo é alterado com ajuda de um modelo, há pelo menos seis, e confundi-las produz diagnósticos ruins. Você troca o modelo quando a permissão falhou, aumenta o prompt quando faltava uma tool, ou cria um agente para um script determinístico.</p>' +
          '<h3>As seis camadas</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Camada</th><th>Responsabilidade</th><th>Falha típica</th></tr></thead><tbody>' +
          '<tr><td><strong>Modelo</strong></td><td>produz uma continuação condicionada à entrada; pode raciocinar, gerar texto e propor tool calls</td><td>saída plausível, porém errada; variação entre execuções</td></tr>' +
          '<tr><td><strong>Cliente</strong></td><td>interface que mantém conversa, renderiza resposta e envia requests</td><td>histórico omitido, truncado ou transformado</td></tr>' +
          '<tr><td><strong>Harness</strong></td><td>envoltório operacional: instruções, contexto, tools, permissões, loop, estado e evidência</td><td>contexto irrelevante, ferramenta perigosa, gate ausente</td></tr>' +
          '<tr><td><strong>Tool</strong></td><td>capability que lê, calcula ou causa efeito</td><td>schema ambíguo, erro não acionável, privilégio excessivo</td></tr>' +
          '<tr><td><strong>Ambiente</strong></td><td>filesystem, processo, runtime, rede, secrets e serviços</td><td>“funciona na minha máquina”, versão errada, egress indevido</td></tr>' +
          '<tr><td><strong>Processo de engenharia</strong></td><td>especificação, revisão, CI, ownership e decisão de release</td><td>produzir mais código sem melhorar entrega</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Exemplo trabalhado: a mesma correção atravessa todas as camadas</h3>' +
          '<ol><li><strong>Processo:</strong> alguém define que a API pública não pode mudar e aponta o teste que serve de critério.</li>' +
          '<li><strong>Cliente:</strong> envia a tarefa ao modelo e decide o que do histórico viaja junto.</li>' +
          '<li><strong>Harness:</strong> escolhe quais instruções, arquivos e tools entram na execução e se o processo pode instalar dependências ou acessar a rede.</li>' +
          '<li><strong>Modelo:</strong> apenas propõe um patch. Não executa nem aprova nada.</li>' +
          '<li><strong>Tool:</strong> executa o teste e devolve evidência (saída e código de saída).</li>' +
          '<li><strong>Ambiente:</strong> fornece a versão de Python, as dependências e as variáveis que fazem o teste rodar de verdade. Se faltar um pacote, a falha é daqui.</li>' +
          '<li><strong>De volta ao processo:</strong> review e CI aceitam ou rejeitam o patch. Só então há entrega.</li></ol>' +
          '<p>Agora o diagnóstico deixa de ser abstrato. Se o patch muda a assinatura pública, a decisão ou o modelo podem estar errados. Se o teste falha porque um pacote não foi instalado, o problema está no ambiente. Se o modelo nunca recebeu o teste que define o comportamento, a seleção de contexto do harness falhou. Trocar de modelo antes dessa separação costuma aumentar custo sem tocar na causa.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'IA como amplificador', html:
          '<p>A pesquisa <strong>DORA 2025</strong> descreve a IA como amplificador das forças e fraquezas do sistema organizacional. Não existe base séria para prometer que uma ferramenta “multiplica produtividade” sozinha: um harness rápido sobre requisitos ruins e testes frágeis apenas acelera retrabalho.</p>' },
        { tipo: 'takeaway', html: 'Diagnostique a <mark>camada</mark> antes de trocar o <mark>modelo</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>“O modelo não tem memória” é um modelo mental, não uma lei física</h3>' +
          '<p>Uma <strong>inferência</strong> é uma execução do modelo que recebe uma entrada e produz uma saída. Para trabalhar com segurança, assuma que essa entrada precisa conter, diretamente ou por recuperação controlada, o estado necessário para a tarefa. O histórico na tela não viaja por magia: o cliente pode reenviá-lo, recuperar uma parte de armazenamento ou representar o estado em outro artefato. Essa hipótese força a pergunta “o que entrou nesta execução?” antes de atribuir intenção ou memória ao modelo.</p>' +
          '<p>Chamar o LLM de “método estático puro” é impreciso, por quatro razões:</p>' +
          '<ul><li>a amostragem pode produzir saídas diferentes para entradas iguais;</li>' +
          '<li>serviços podem persistir conversa, aplicar cache ou resumir histórico;</li>' +
          '<li>o harness pode adicionar instruções, arquivos e resultados de tools sem exibi-los integralmente;</li>' +
          '<li>modelo, ferramenta e aplicação podem manter estados diferentes.</li></ul>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'O modelo dentro da aplicação', html:
          '<p>A aplicação recebe a tarefa, seleciona contexto, aplica políticas e executa ferramentas. O modelo propõe respostas e ações; o restante do sistema decide quais efeitos são permitidos e registra o resultado. Uma falha pode ocorrer em qualquer dessas responsabilidades.</p>' },
        { tipo: 'texto', html:
          '<h3>Task contract: a unidade mínima de trabalho</h3>' +
          '<p>O <strong>task contract</strong> é um arquivo curto que define o espaço de decisão e o que conta como trabalho concluído. Ele não diz ao modelo como pensar. Leia as linhas como fronteiras, não como burocracia: <code>Em escopo</code> limita o diff; <code>Capacidades</code> limita o que o processo consegue fazer, mesmo quando o texto recebido pede outra coisa; <code>Evidência</code> troca a frase “parece corrigido” por comandos que outra pessoa pode repetir; <code>Parar quando</code> evita que o agente invente uma decisão de produto para continuar trabalhando.</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          '# TASK-CONTRACT.md',
          'Objetivo: corrigir a validação de CPF sem alterar a API pública.',
          'Em escopo: src/customer/validation.py e testes associados.',
          'Fora de escopo: migration, dependência nova, refatoração de cadastro.',
          'Contexto inicial: AGENTS.md, design/validation.md, arquivos-alvo.',
          'Capacidades: leitura do repo; escrita no workspace; processo sem rede.',
          'Evidência: ruff check .; mypy; pytest tests/customer -q.',
          'Parar quando: contrato ambíguo, teste exige serviço ausente ou API precisa mudar.',
          'Entregar: diff, comandos executados, resultados e riscos residuais.'].join('\n') },
        { tipo: 'texto', html:
          '<p>O laboratório do módulo carrega um contrato equivalente em JSON e o valida por código, fora do modelo. Rode a validação no contrato seguro e no inválido e observe o que o validador devolve.</p>' },
        { tipo: 'rode', id: 'm00b1-rode', titulo: 'Valide o contrato seguro e o inválido', enunciado: 'Saídas reais do <code>harness_lab</code>. O arquivo <code>harness.invalid.json</code> traz só <code>instruction_files</code> com <code>CLAUDE.md</code>, comandos vazios, orçamento 0 e uma integração sem revisão.',
          prefixo: '$', entrada: BAD, unidade: 'ms', terminalTitulo: 'lab M00',
          prever: { pergunta: 'O contrato inválido tem vários campos ausentes. O que o validador faz?', opcoes: [
            { id: 'a', texto: 'Para no primeiro problema e devolve uma única linha.', correta: false, porque: 'o validador acumula todas as violações antes de sair, para que a correção seja feita de uma vez.' },
            { id: 'b', texto: 'Lista todas as violações com um código e sai com exit 1.', correta: true, porque: 'cada violação tem código (MISSING_*, INVALID_*, UNVERSIONED_*) e o exit 1 impede a tarefa de seguir.' },
            { id: 'c', texto: 'Aprova, porque o JSON é sintaticamente válido.', correta: false, porque: 'sintaxe válida não é contrato válido: o que se valida é o conteúdo.' }
          ] },
          etapas: [
            { id: 'seguro', nome: 'Contrato seguro', descricao: 'harness.safe.json', tom: 'dns', ms: 40, linhas: [
              L('cmd', OK), L('out', 'VALID examples/harness.safe.json'), L('hint', 'exit=0')] },
            { id: 'invalido', nome: 'Contrato inválido', descricao: 'harness.invalid.json', tom: 'request', ms: 55, linhas: [
              L('cmd', BAD),
              L('out', 'MISSING_OBJECTIVE: informe o objetivo da tarefa'),
              L('out', 'MISSING_IN_SCOPE: informe valores não vazios'),
              L('out', 'MISSING_OUT_OF_SCOPE: informe valores não vazios'),
              L('out', 'MISSING_CAPABILITIES: informe valores não vazios'),
              L('out', 'MISSING_STOP_CONDITIONS: informe valores não vazios'),
              L('out', 'MISSING_PORTABLE_INSTRUCTIONS: instruction_files requer AGENTS.md'),
              L('out', 'MISSING_EVIDENCE: informe pelo menos um comando verificável'),
              L('out', 'MISSING_ALLOWLIST: allowed_command_prefixes não pode ser vazio'),
              L('out', 'INVALID_CONTEXT_BUDGET: context_budget deve ser positivo'),
              L('out', 'UNVERSIONED_INTEGRATION: protocolo, revisão e dependência são obrigatórios'),
              L('hint', 'exit=1')] }
          ],
          tutorAntes: 'Aperte Enter e depois clique em “Contrato inválido” para ler só as linhas dele.',
          tutorDepois: 'Dez violações, cada uma com código. Repare em <code>MISSING_PORTABLE_INSTRUCTIONS</code>: o contrato exige o <code>AGENTS.md</code> como núcleo portátil, e o <code>CLAUDE.md</code> sozinho não basta.',
          callout: 'Você viu o contrato ser aprovado e reprovado por código, sem depender do modelo.' },
        { tipo: 'complete', id: 'm00b1-complete', titulo: 'Complete o task contract', obrigatorio: true, linguagem: 'markdown',
          enunciado: 'Escolha, em cada lacuna, a linha que delimita o espaço de decisão da tarefa “corrigir a validação de CPF sem alterar a API pública”.',
          partes: [
            '# TASK-CONTRACT.md\nObjetivo: corrigir a validação de CPF sem alterar a API pública.\nEm escopo: ',
            { lacuna: 'escopo', opcoes: ['src/customer/validation.py e testes associados', 'todo o repositório', 'o que o agente achar necessário'], correta: 'src/customer/validation.py e testes associados' },
            '\nFora de escopo: ',
            { lacuna: 'fora', opcoes: ['migration, dependência nova, refatoração de cadastro', 'nada: o agente decide', 'a API pública, que pode ser mudada se facilitar'], correta: 'migration, dependência nova, refatoração de cadastro' },
            '\nCapacidades: ',
            { lacuna: 'cap', opcoes: ['leitura do repo; escrita no workspace; processo sem rede', 'todas, para não travar o agente', 'somente rede, para consultar documentação'], correta: 'leitura do repo; escrita no workspace; processo sem rede' },
            '\nEvidência: ',
            { lacuna: 'evid', opcoes: ['ruff check .; mypy; pytest tests/customer -q', 'o agente relata que parece corrigido', 'revisão visual do código'], correta: 'ruff check .; mypy; pytest tests/customer -q' },
            '\nParar quando: ',
            { lacuna: 'parar', opcoes: ['contrato ambíguo, teste exige serviço ausente ou API precisa mudar', 'nunca: persistência é virtude', 'só quando o tempo acabar'], correta: 'contrato ambíguo, teste exige serviço ausente ou API precisa mudar' },
            '\n'
          ],
          explicacao: 'Cada lacuna é uma fronteira. O escopo limita o diff, as capacidades limitam o que o processo consegue fazer, a evidência troca “parece corrigido” por comandos repetíveis e a condição de parada impede o agente de inventar uma decisão de produto para continuar. Essa disciplina é expandida no M01, com specification-driven development.',
          callout: 'Contrato completo: escopo, capacidades, evidência e parada declarados.' },
        { tipo: 'takeaway', html: 'O contrato delimita o <mark>espaço de decisão</mark> e troca “parece pronto” por <mark>evidência repetível</mark>.' }
      ] },

      { rotulo: 'Workflow ou agente', blocos: [
        { tipo: 'texto', html:
          '<p><strong>Workflow</strong> define no código quais etapas e transições existem. <strong>Agente</strong> delega ao modelo alguma escolha relevante sobre a próxima ação. Um workflow pode conter uma chamada de LLM; um agente pode operar dentro de um workflow com limites. Não são caixas mutuamente exclusivas, e a escolha depende de cinco perguntas.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Pergunta</th><th>Se a resposta é “sim”</th><th>Decisão inicial</th></tr></thead><tbody>' +
          '<tr><td>As etapas são conhecidas e repetíveis?</td><td>o fluxo cabe em código e testes</td><td>workflow</td></tr>' +
          '<tr><td>A ação tem efeito caro, irreversível ou regulado?</td><td>variabilidade aumenta o risco</td><td>workflow + aprovação</td></tr>' +
          '<tr><td>É necessário investigar caminhos não conhecidos antes?</td><td>a sequência depende do que for descoberto</td><td>delegate/agente limitado</td></tr>' +
          '<tr><td>O resultado pode ser validado mecanicamente?</td><td>há feedback rápido e confiável</td><td>autonomia limitada pode compensar</td></tr>' +
          '<tr><td>Não há critério claro de conclusão?</td><td>o agente não sabe quando parar</td><td>não automatize ainda</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>“Começar por workflow” é uma heurística de gestão de risco, não dogma. O raciocínio sênior explicita incerteza, custo do erro, detectabilidade, reversibilidade e orçamento antes de escolher autonomia.</p>' +
          '<h3>Oito classificações guiadas</h3>' +
          '<p>Em cada linha, separe o que precisa ser descoberto do que já pode ser expresso como regra. As recomendações são exemplos de projeto, não resultados medidos; valide custo e risco com os dados e as políticas do seu contexto.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Tarefa</th><th>Incerteza e custo relevante</th><th>Desenho inicial e justificativa</th></tr></thead><tbody>' +
          '<tr><td>Somar vendas de CSVs com schema publicado</td><td>Baixa incerteza; valor errado é detectável por validação e reconciliação.</td><td>Workflow: validar colunas, somar e reconciliar. Um agente não resolve ambiguidade que não existe.</td></tr>' +
          '<tr><td>Renomear arquivos conforme um manifesto explícito</td><td>Baixa incerteza; sobrescrita pode ser difícil de reverter.</td><td>Workflow com prévia, colisões recusadas e confirmação antes de gravar. A reversibilidade manda mais que a conveniência.</td></tr>' +
          '<tr><td>Classificar mensagens livres em categorias conhecidas</td><td>Há ambiguidade semântica; um rótulo errado tem custo moderado e pode ser amostrado.</td><td>Workflow limita categorias e valida o formato; agente sugere o rótulo, registra justificativa curta e abstém quando incerto.</td></tr>' +
          '<tr><td>Investigar um teste que falha em repositório desconhecido</td><td>O caminho de investigação é incerto; uma hipótese errada custa tempo, mas leitura é reversível.</td><td>Agente limitado a leitura reúne evidências e propõe causa; workflow executa testes permitidos. Parar se não houver reprodução ou evidência suficiente.</td></tr>' +
          '<tr><td>Decidir elegibilidade de reembolso por política escrita</td><td>As condições são explícitas; uma decisão incorreta tem custo financeiro e de conformidade.</td><td>Workflow aplica as regras versionadas e encaminha exceções para aprovação humana; não delegar a decisão ao modelo.</td></tr>' +
          '<tr><td>Diagnosticar lentidão com métricas e logs variáveis</td><td>Os sinais não determinam uma sequência única; uma hipótese ruim é reversível se só gerar proposta.</td><td>Agente de leitura compara hipóteses e cita medições; workflow valida consultas e executa apenas verificações permitidas.</td></tr>' +
          '<tr><td>Gerar changelog de commits com convenção definida</td><td>Baixa incerteza se tipos e formato estão padronizados; omissão é fácil de detectar no diff.</td><td>Workflow determinístico agrupa commits; revisão verifica o texto. Autonomia acrescenta variação sem cobrir uma lacuna real.</td></tr>' +
          '<tr><td>Responder pedido de estorno escrito em linguagem livre</td><td>É preciso interpretar intenção; o estorno tem efeito financeiro e pode ser irreversível.</td><td>Agente pode resumir o pedido e apontar a política; workflow valida elegibilidade e exige aprovação antes de qualquer efeito.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Regra de transferência', html:
          '<p>Para classificar outra tarefa, escreva primeiro a <strong>fonte da incerteza</strong>, o <strong>custo do erro</strong>, o <strong>verificador</strong> e a <strong>condição de parada</strong>. Se as etapas e exceções puderem ser enumeradas, mantenha-as no workflow. Use autonomia só para a parte cuja próxima ação realmente depende do que for descoberto.</p>' },
        { tipo: 'python', id: 'm00b1-python', titulo: 'Escreva o classificador de desenho', obrigatorio: false,
          enunciado: 'Implemente <code>desenho(etapas_conhecidas, efeito_caro, investigacao, tem_criterio)</code> na ordem de risco da tabela: sem critério, <code>nao-automatizar</code>; efeito caro, <code>workflow+aprovacao</code>; investigação necessária, <code>agente-limitado</code>; senão, <code>workflow</code>. É uma heurística de projeto, não uma medição.',
          codigo: codigoDesenho, testes: testesDesenho,
          dica: 'A ordem das condições importa: a falta de critério de conclusão e o efeito caro são checados antes de a investigação justificar autonomia.',
          solucao: solucaoDesenho,
          tutorDepois: 'Repare que o efeito caro vence a investigação: mesmo incerta, uma tarefa com efeito financeiro irreversível passa por aprovação.',
          callout: 'O classificador respeita a ordem de risco, inclusive no caso de controle.' },
        { tipo: 'takeaway', html: 'Escolha o desenho pela <mark>incerteza</mark> e pelo <mark>custo do erro</mark>; “porque a IA consegue” não é justificativa.' }
      ] },

      { rotulo: 'Panorama e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Ferramentas são superfície; o método precisa sobreviver a elas</h3>' +
          '<p>O Octoverse 2025 do GitHub registrou 4,3 milhões de projetos de IA e forte atividade em repositórios públicos. É um sinal de que fluxos assistidos por IA já fazem parte do trabalho visível em open source. Não é uma pesquisa de vagas, não mede empresas privadas nem prova que um produto específico é adequado para o seu domínio. O curso usa esse sinal para justificar uma habilidade transferível: revisar, limitar e verificar trabalho assistido, em vez de apenas aprender a operar uma tela.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Prática observável</th><th>Ferramentas ou padrões que a materializam</th><th>O que o M00 ensina antes do produto</th></tr></thead><tbody>' +
          '<tr><td>instruções versionadas junto do código</td><td><code>AGENTS.md</code>, <code>CLAUDE.md</code> e arquivos de instrução de IDEs</td><td>contrato operacional, descoberta e precedência</td></tr>' +
          '<tr><td>procedimento reutilizável sob demanda</td><td>Agent Skills e mecanismos equivalentes de cada host</td><td>separar conhecimento, gatilho de invocação e authority</td></tr>' +
          '<tr><td>conectar host a capability externa</td><td>MCP, APIs diretas e adapters próprios</td><td>schema, policy, teste da função e teste de contrato antes da UI</td></tr>' +
          '<tr><td>verificar mudança produzida com ajuda de IA</td><td>Git, testes, lint, type checker e CI</td><td>evidência repetível, revisão de diff e condição de parada</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Marca de verificação', html:
          '<p>Os produtos aparecem como adapters relevantes para comparar mecanismos, não como lista de compra. Links e fatos de produto foram revalidados em 15/08/2026, com revalidação da seção em até 90 dias.</p>' },
        { tipo: 'cenario', id: 'm00b1-cenario', titulo: 'Passa no notebook, falha no CI', obrigatorio: false,
          enunciado: 'O teste de validação passa na máquina de quem alterou o código e falha no CI. Decida onde investigar.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A saída do CI diz <code>ModuleNotFoundError</code> para um pacote que o notebook tem instalado. O patch do agente não mudou a API pública. O que você faz primeiro?', opcoes: [
              { texto: 'Trocar por um modelo maior e pedir o patch de novo.', vai: 'f-modelo', tom: 'ruim', consequencia: 'o patch não era o problema: o custo sobe e a causa continua intocada.' },
              { texto: 'Separar as camadas: o que o ambiente do CI tem que o notebook tem?', vai: 'camadas', tom: 'ok', consequencia: 'o sintoma (falha só no CI, por pacote ausente) aponta para o ambiente.' },
              { texto: 'Reforçar o prompt: “garanta que os testes passem em qualquer máquina”.', vai: 'f-prompt', tom: 'ruim', consequencia: 'uma frase no prompt não instala dependência no CI.' }
            ] },
            camadas: { texto: 'O pacote está nas dependências locais mas não no arquivo de dependências do projeto. Qual é o conserto?', opcoes: [
              { texto: 'Declarar a dependência no projeto e registrar o comando de bootstrap no <code>AGENTS.md</code>.', vai: 'f-bom', tom: 'ok', consequencia: 'a precondição deixa de ser implícita e vale para a próxima tarefa.' },
              { texto: 'Instalar o pacote à mão no runner do CI e seguir.', vai: 'f-manual', tom: 'ruim', consequencia: 'o CI passa hoje e quebra na próxima máquina limpa.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Causa isolada no ambiente, dependência declarada e bootstrap documentado, sem tocar no modelo.' },
            'f-modelo': { bom: false, texto: 'O custo subiu, o novo patch falhou do mesmo jeito e ninguém olhou o ambiente.' },
            'f-prompt': { bom: false, texto: 'O agente prometeu e o CI continuou vermelho: instrução não é capability nem ambiente.' },
            'f-manual': { bom: false, texto: 'A precondição continuou implícita: o próximo runner limpo falha de novo.' }
          },
          callout: 'Você isolou a falha no ambiente antes de mexer no modelo.' },
        { tipo: 'escolha', id: 'm00b1-escolha-ambiente', titulo: 'Confira: a camada da falha',
          pergunta: 'O teste de validação passa no notebook de quem alterou o código e falha no CI porque um pacote não está instalado lá. Qual camada é a causa mais provável?',
          opcoes: [
            { id: 'a', texto: 'O modelo, que gerou um patch incorreto: troque por um modelo maior.', correta: false, porque: 'é o erro típico do módulo: trocar de modelo antes de separar as camadas.' },
            { id: 'b', texto: 'O cliente, que enviou o prompt de forma errada.', correta: false, porque: 'o cliente não decide o que está instalado no CI.' },
            { id: 'c', texto: 'O ambiente: a versão ou dependência que faz o teste rodar não existe no CI.', correta: true, porque: 'falha só no CI por pacote ausente aponta para o ambiente.' },
            { id: 'd', texto: 'O harness, que deveria ter desativado o CI.', correta: false, porque: 'desativar o CI esconderia a falha, não a corrigiria.' }
          ], tutorDepois: 'Separe as camadas antes de gastar com modelo.' },
        { tipo: 'escolha', id: 'm00b1-escolha-estorno', titulo: 'Confira: o estorno em linguagem livre',
          pergunta: 'Um pedido de estorno chega em linguagem livre, e o estorno é financeiro e difícil de reverter. Qual é o desenho inicial mais defensável?',
          opcoes: [
            { id: 'a', texto: 'Agente autônomo decide e executa o estorno, pois a linguagem livre exige interpretação.', correta: false, porque: 'delega um efeito financeiro irreversível ao modelo.' },
            { id: 'b', texto: 'Agente resume o pedido e aponta a política; workflow valida a elegibilidade e exige aprovação antes do efeito.', correta: true, porque: 'a parte ambígua (interpretar o texto) pode usar o modelo; a parte de alto custo fica em código com aprovação.' },
            { id: 'c', texto: 'Workflow puro sem LLM, porque qualquer uso de modelo é proibido em finanças.', correta: false, porque: 'é dogma: o curso pede heurística de risco, não proibição.' },
            { id: 'd', texto: 'Dar ao agente a ferramenta de estorno e confiar na instrução “não estorne sem motivo”.', correta: false, porque: 'usa instrução como barreira, e instrução não é capability.' }
          ], tutorDepois: 'O modelo interpreta; o código decide e o humano aprova o efeito.' },
        { tipo: 'takeaway', html: 'Separe as <mark>seis camadas</mark>, escreva o <mark>contrato</mark> e deixe o efeito caro em <mark>workflow com aprovação</mark>.' }
      ] }
    ]
  });
})();
