/* M11 · Bloco 1: o fundamento até a camada que muda uma decisão. Fonte: M11.html#b01. A taxa de aprendizado e os logprobs são ilustrativos (exemplo variável); o contrato de metrics.py é o do módulo. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasLogprob = function () {
    return [
      { id: 'tokens', nome: 'Tokens emitidos', descricao: 'Oito tokens, cada um com seu logprob', tom: 'dns', ms: 8, linhas: [
        L('info', 'cwd: lab/ (metrics.py implementado na folha B01-L)'),
        L('info', 'logprobs = [-0.02, -0.05, -0.31, -1.80, -0.04, -2.30, -0.10, -0.01]'),
        L('hint', 'logprob = ln(p): 0.0 é certeza, -1.0 é cerca de 37%, -2.3 é cerca de 10%')] },
      { id: 'medio', nome: 'Média e mínimo', descricao: 'Hesitação média e pior token', tom: 'tcp', ms: 1, linhas: [
        L('out', 'ConfiancaGeracao(medio=-0.57875, minimo=-2.3, incertos=2, total=8)'),
        L('hint', 'a média é baixa em módulo, mas o mínimo mostra um token em que o modelo hesitou muito')] },
      { id: 'incertos', nome: 'Tokens incertos', descricao: 'Quantos ficaram abaixo de -1.0', tom: 'tls', ms: 1, linhas: [
        L('out', 'incertos=2 de total=8  (os logprobs -1.8 e -2.3)'),
        L('hint', 'o limiar -1.0 (~37%) é convenção operacional do módulo, não constante universal')] },
      { id: 'ppl', nome: 'Perplexidade', descricao: 'exp(-média)', tom: 'request', ms: 1, linhas: [
        L('out', '1.7838072774729488   # c.perplexidade = exp(0.57875)'),
        L('hint', '1.0 seria certeza total; o número cresce com a dúvida')] },
      { id: 'uso', nome: 'Como usar', descricao: 'Relativo e agregado, nunca veredito', tom: 'ink', ms: 1, linhas: [
        L('in', 'ordenar a fila de revisão humana: menor lp_medio primeiro'),
        L('hint', 'confiança prioriza olhar humano; quem assina o veredito é o grader do M06')] }
    ];
  };

  var codigoResumir = [
    'from dataclasses import dataclass', 'from math import exp', '', 'LIMIAR_INCERTEZA = -1.0', '', '',
    '@dataclass(frozen=True, slots=True)', 'class ConfiancaGeracao:', '    medio: float', '    minimo: float',
    '    incertos: int', '    total: int', '', '    @property', '    def perplexidade(self):',
    '        return exp(-self.medio)', '', '    @property', '    def fracao_incerta(self):',
    '        if not self.total:', '            return 0.0', '        return self.incertos / self.total', '', '',
    'def resumir(logprobs):', '    # 1. lista vazia: devolva None', '    # 2. médio, mínimo, contagem abaixo do limiar e total',
    '    return None', '', '',
    'print(resumir([-0.02, -0.05, -0.31, -1.8, -0.04, -2.3, -0.1, -0.01]))', ''].join('\n');
  var testesResumir = [
    'def test_lista_vazia_devolve_none():', '    assert resumir([]) is None', '', '',
    'def test_caminho_feliz():', '    c = resumir([-0.02, -0.05, -0.31, -1.8, -0.04, -2.3, -0.1, -0.01])',
    '    assert abs(c.medio - (-0.57875)) < 1e-9', '    assert c.minimo == -2.3', '    assert c.incertos == 2 and c.total == 8',
    '    assert abs(c.perplexidade - 1.7838) < 1e-3', '', '',
    'def test_limiar_e_estrito():', '    # exatamente -1.0 não conta como incerto; só abaixo dele',
    '    c = resumir([-1.0, -1.01, -0.99])', '    assert c.incertos == 1', '', '',
    'def test_controle_negativo_certeza_total():', '    c = resumir([0.0, 0.0, 0.0])',
    '    assert c.incertos == 0 and c.perplexidade == 1.0 and c.fracao_incerta == 0.0', ''].join('\n');
  var solucaoResumir = [
    'from dataclasses import dataclass', 'from math import exp', '', 'LIMIAR_INCERTEZA = -1.0', '', '',
    '@dataclass(frozen=True, slots=True)', 'class ConfiancaGeracao:', '    medio: float', '    minimo: float',
    '    incertos: int', '    total: int', '', '    @property', '    def perplexidade(self):',
    '        return exp(-self.medio)', '', '    @property', '    def fracao_incerta(self):',
    '        if not self.total:', '            return 0.0', '        return self.incertos / self.total', '', '',
    'def resumir(logprobs):', '    if not logprobs:', '        return None', '    return ConfiancaGeracao(',
    '        medio=sum(logprobs) / len(logprobs),', '        minimo=min(logprobs),',
    '        incertos=sum(1 for lp in logprobs if lp < LIMIAR_INCERTEZA),', '        total=len(logprobs),', '    )', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm11-b1',
    titulo: 'Fundamento até a camada que muda uma decisão',
    minutos: 25,
    resumo: 'Estude o modelo até a camada mais rasa que ainda muda uma decisão sua e pare aí. Nove termos viram objetos com definição, mecanismo e limite, e o logprob vira o primeiro instrumento de confiança.',
    objetivo: 'Definir os nove termos estruturais com mecanismo e limite, aplicar o critério do nível certo, recitar o mapa do que não estudar e ler logprob, perplexidade e o limiar -1.0 sem tratar confiança como veredito.',
    revisao: [
      { id: 'm11b1-camada', pergunta: 'Qual é o critério de profundidade do módulo?',
        opcoes: [
          opc('a', 'Estudar até a camada mais rasa que ainda muda uma decisão sua, e parar aí', true, 'passou dessa camada é dispersão, salvo quando uma decisão do produto exigir descer mais.'),
          opc('b', 'Estudar tudo o que existe sobre treino de modelos antes de usar um', false, 'treinar modelo de fronteira custa dezenas de milhões de dólares e nenhuma decisão sua usa isso.'),
          opc('c', 'Não estudar nada abaixo da API, porque o modelo é um serviço', false, 'a abstração vaza em custo, erro e travas em ferramenta; uma camada abaixo explica cada vazamento.')] },
      { id: 'm11b1-logprob', pergunta: 'Um token emitido tem logprob -2,3. O que isso diz?',
        opcoes: [
          opc('a', 'O modelo atribuiu cerca de 10% àquele token; abaixo de -1,0 (~37%) o módulo o conta como incerto', true, 'logprob é ln(p): -2,3 é ln(0,10). O limiar é convenção operacional, não constante universal.'),
          opc('b', 'A resposta tem 2,3% de chance de estar correta', false, 'logprob mede o token emitido segundo o modelo, não a correção da resposta.'),
          opc('c', 'O token é 2,3 vezes mais provável que o segundo colocado', false, 'logprob não é razão entre candidatos.')] },
      { id: 'm11b1-confianca', pergunta: 'Qual é o uso legítimo de logprob e perplexidade?',
        opcoes: [
          opc('a', 'Relativo e agregado: comparar a mesma tarefa, acompanhar deriva e ordenar a fila de revisão humana', true, 'o sinal prioriza olhar humano e nunca decide sozinho; correção continua sendo do grader do M06.'),
          opc('b', 'Aprovar automaticamente toda resposta com logprobs altos', false, 'existe modelo confiante e errado: fluência e logprobs limpos sobre fato inexistente.'),
          opc('c', 'Substituir o eval por tarefa', false, 'perplexidade resume hesitação média; jamais substitui eval.')] },
      { id: 'm11b1-logit', pergunta: 'O que o softmax faz com os logits?',
        opcoes: [
          opc('a', 'Converte em probabilidades que somam 1, preservando a ordem e ampliando as diferenças', true, 'é a exponencial de cada logit dividida pela soma; o favorito continua favorito.'),
          opc('b', 'Remove os tokens improváveis do vocabulário', false, 'quem corta cauda é top-k ou top-p; softmax só normaliza.'),
          opc('c', 'Divide os logits pela temperatura', false, 'a temperatura é o divisor aplicado antes do softmax.')] },
      { id: 'm11b1-lixo', pergunta: 'Qual destes temas o módulo deixa de fora, com critério de retorno?',
        opcoes: [
          opc('a', 'Kernels CUDA/Triton: você consome o efeito (FlashAttention economiza memória) sem escrever kernel; volta ao trabalhar em infra de inferência', true, 'cada tema do mapa tem motivo para ficar de fora e critério objetivo para voltar.'),
          opc('b', 'Tokenização por BPE', false, 'tokenização explica o erro de contagem; entra no módulo.'),
          opc('c', 'Cache de KV', false, 'o KV decide hardware e entra no Bloco 6.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Quatro perguntas corretas e inúteis</h3>' +
          '<p>Nos módulos anteriores, quatro perguntas receberam resposta correta que não muda nenhuma decisão. O padrão se repete: a frase de superfície resume o sintoma, o bloco indicado troca o resumo pelo <strong>mecanismo</strong>, e o mecanismo sugere a próxima ação.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Pergunta aberta</th><th>Onde nasceu</th><th>Resposta de superfície</th><th>Onde este módulo fecha</th></tr></thead><tbody>' +
          '<tr><td>Por que dobrar o contexto custa <em>mais</em> que o dobro em latência?</td><td>M08, Bloco 4 (orçamento de atenção)</td><td>"atenção é quadrática"</td><td>Bloco 3: a matriz n×n implementada e medida</td></tr>' +
          '<tr><td>Por que o extrator erra ao <em>contar</em> e acerta ao <em>descrever</em>?</td><td>M05, Bloco 2 (structured output)</td><td>"LLM não é bom em contas"</td><td>Blocos 4 e 5: tokenização de números e amostragem</td></tr>' +
          '<tr><td>Por que temperatura 0 não elimina alucinação?</td><td>M06, Bloco 3 (graders)</td><td>"reduz, não elimina"</td><td>Bloco 5: o efeito real da temperatura sobre a distribuição</td></tr>' +
          '<tr><td>Por que um modelo bom em código trava em modo agente?</td><td>M09, Bloco 5</td><td>"suporte a tool calling varia"</td><td>Bloco 8: formato, BFCL, modelo ≠ agente ≠ harness</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Por que furar a abstração</h3>' +
          '<p>Até aqui o modelo foi um serviço: entra prompt, sai texto, a conta chega. Esse contrato responde "o que pedir" e quebra diante de "por que custou isso", "por que errou isso", "por que travou na ferramenta". Cada quebra cobra o mesmo preço: decidir no escuro. A defesa é conhecer <strong>uma camada abaixo do uso</strong>. Uma camada explica o custo quadrático, o erro de contagem, a teimosia da temperatura e a trava do agente. Passou dela, dispersão.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Abstrações que vazam', html:
          '<p>Joel Spolsky, 2002: "todas as abstrações não triviais, até certo ponto, vazam". TCP promete entrega confiável e você ainda precisa entender retransmissão quando a latência explode; ORM promete que você não escreve SQL até o N+1 aparecer. O tempo que a abstração economiza é cobrado de volta, com juros, no dia em que ela vaza. Um LLM é a abstração mais vazante que você já usou: promete "entende linguagem natural" e vaza em tokenização, janela de contexto, formato de saída e não-determinismo.</p>' +
          '<p>Alan Cooper separa o <strong>modelo mental</strong> (como o usuário acha que funciona), o <strong>modelo de implementação</strong> (como funciona) e o <strong>modelo representado</strong> (o que a interface sugere). O chat representa um interlocutor que sabe coisas; a implementação é amostragem de uma distribuição condicionada. Quase todo bug de produto de IA mora nessa distância.</p>' },
        { tipo: 'takeaway', html: 'Estude até a <mark>camada mais rasa</mark> que muda uma decisão sua; abaixo disso, <mark>dispersão</mark>.' }
      ] },

      { rotulo: 'Vocabulário e mapa', blocos: [
        { tipo: 'texto', html:
          '<h3>Nove termos, com mecanismo e limite</h3>' +
          '<p>Nos módulos anteriores estes termos tiveram sentido operacional ("token é o que você paga"). Aqui ganham sentido estrutural. Os blocos seguintes manipulam cada um como objeto concreto.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Termo</th><th>Definição e mecanismo</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td><strong>Parâmetro / peso</strong></td><td>Número real guardado no modelo e ajustado no treino. "8B" são 8 bilhões desses números. Na inferência, a saída sai de multiplicações e somas entre entradas e pesos.</td><td>Contar parâmetros não mede acerto por tarefa. Precisão menor (quantização, Bloco 6) troca fidelidade por memória.</td></tr>' +
          '<tr><td><strong>Token</strong></td><td>Símbolo do vocabulário; o texto vira lista de inteiros antes de entrar no modelo. O tokenizador corta em pedaços frequentes (BPE, codificação por pares de bytes; detalhe no Bloco 4).</td><td>O corte ignora palavra, número e sintaxe: dígitos vizinhos podem cair em pedaços distintos.</td></tr>' +
          '<tr><td><strong>Embedding</strong></td><td>Vetor numérico associado a cada token; tabela de vocabulário × dimensão. O modelo lê vetores, não texto; vetores de contextos parecidos tendem a ficar próximos.</td><td>Proximidade é estatística de coocorrência, não equivalência garantida. Busca por similaridade herda esse ruído.</td></tr>' +
          '<tr><td><strong>Logit</strong></td><td>Escore bruto que o modelo atribui a cada token do vocabulário como próximo token. A última camada projeta o estado interno nesse vetor.</td><td>Escore não é probabilidade. Comparar logits entre modelos ou posições distintas engana.</td></tr>' +
          '<tr><td><strong>Softmax</strong></td><td>Converte logits em probabilidades que somam 1, preservando a ordem e ampliando diferenças: exponencial de cada logit dividida pela soma.</td><td>O favorito continua favorito. Intuição não calibra; medição calibra (M06).</td></tr>' +
          '<tr><td><strong>Temperatura</strong></td><td>Divisor T aplicado aos logits antes do softmax. T pequeno concentra a massa no topo; T grande achata.</td><td>T = 0 não cria determinismo bit a bit e não remove erro: o erro se repete com mais constância (Bloco 5).</td></tr>' +
          '<tr><td><strong>Camada</strong></td><td>Transformação parametrizada sobre tensores; o modelo empilha dezenas. Resíduo e normalização (Bloco 4) mantêm o empilhamento treinável.</td><td>Sem ativação, empilhar não adiciona poder: duas camadas lineares colapsam em uma.</td></tr>' +
          '<tr><td><strong>Tensor</strong></td><td>Array multidimensional com forma, tipo e dispositivo. Toda operação do modelo é álgebra sobre tensores.</td><td>Forma certa não garante conta certa: broadcast silencioso muda o resultado sem falhar.</td></tr>' +
          '<tr><td><strong>Inferência × treino</strong></td><td>Inferência usa pesos fixos para gerar saída. Treino ajusta pesos pelo erro: passagem direta, gradiente, atualização, repetição (Bloco 2).</td><td>Custos diferem em ordens de grandeza. Ajustar prompt não é treinar; treinar não conserta dado ruim.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'abas', rotulo: 'Duas ferramentas do módulo', itens: [
          { rotulo: 'PyTorch', blocos: [{ tipo: 'texto', html:
            '<p>Biblioteca Python de computação tensorial com diferenciação automática. Três peças: <code>torch.Tensor</code>, array N-dimensional que roda em CPU ou GPU; <strong>autograd</strong>, que registra as operações e calcula os gradientes; <code>torch.nn</code>, camadas prontas e a base <code>nn.Module</code> para compor as suas. A versão exata é fixada pela folha B01-L do laboratório (fonte SRC-M11-01).</p>' }] },
          { rotulo: 'Hugging Face', blocos: [{ tipo: 'texto', html:
            '<p>Três peças com o mesmo nome. O <strong>Hub</strong> é o repositório público de pesos, datasets e demos, com cartão de modelo declarando licença e limites: a origem dos pesos abertos do Bloco 6. A biblioteca <code>transformers</code> carrega e executa esses modelos sob API uniforme. O entorno traz <code>tokenizers</code>, <code>datasets</code> e <code>peft</code> (Bloco 8). Baixar pesos é trilha externa opcional; o núcleo do módulo roda offline (fontes SRC-M11-13 e SRC-M11-14).</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>O mapa honesto: o que não estudar agora</h3>' +
          '<p>A literatura de ML excede qualquer produto. Cada tema abaixo fica de fora por um motivo e volta por um critério objetivo. Critério cumprido, o estudo continua; antes disso, dispersão.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Tema</th><th>Por que fica de fora</th><th>Critério de retorno</th></tr></thead><tbody>' +
          '<tr><td>Treinar modelo de fronteira do zero</td><td>Custa dezenas de milhões de dólares; nenhuma decisão sua usa isso.</td><td>Só se o produto exigir pré-treino próprio, com orçamento dedicado.</td></tr>' +
          '<tr><td>Treinamento distribuído (FSDP, paralelismo de tensor e pipeline)</td><td>Só decide quem treina em 8 GPUs ou mais.</td><td>No primeiro treino multi-GPU real.</td></tr>' +
          '<tr><td>Kernels CUDA / Triton</td><td>Otimização de baixo nível. FlashAttention economiza memória, não computação (SRC-M11-08).</td><td>Ao trabalhar em infra de inferência.</td></tr>' +
          '<tr><td>Visão computacional, áudio, difusão</td><td>Outro domínio; nada do produto aqui depende disso.</td><td>Se o produto virar multimodal.</td></tr>' +
          '<tr><td>Arquiteturas alternativas (Mamba, SSM, MoE por dentro)</td><td>Você escolhe modelo, não arquitetura.</td><td>Leitura avulsa, sem bloquear nada.</td></tr>' +
          '<tr><td>Teoria de aprendizado estatístico (dimensão VC, PAC)</td><td>Não decide engenharia de produto.</td><td>Ao fazer pesquisa.</td></tr>' +
          '<tr><td>RL do zero (PPO, GRPO)</td><td>O produto exige saber o efeito do RLHF no comportamento (Bloco 5), não implementá-lo.</td><td>Ao fazer pós-treino.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Treinar é repetir peso -= lr · gradiente', html:
          '<p>O simulador do módulo usa a perda <code>(w - 3)²</code>, ótimo em <code>w = 3</code>, com o peso começando em -3. Cada passo multiplica o erro por <code>1 - 2·lr</code>: com lr abaixo de 0,5 converge suave; entre 0,5 e 1 oscila e converge; em 1 oscila para sempre; acima de 1 diverge. Passo grande oscila e diverge, passo pequeno demora: <strong>lr é decisão de engenharia, não propriedade do algoritmo</strong>.</p>' },
        { tipo: 'takeaway', html: 'Nove termos com <mark>definição, mecanismo e limite</mark>; o que fica de fora tem <mark>critério de retorno</mark>.' }
      ] },

      { rotulo: 'Logprobs na prática', blocos: [
        { tipo: 'texto', html:
          '<h3>O instrumento de confiança mais barato</h3>' +
          '<p>O gateway do M05 registra tokens e latência por chamada. Falta a probabilidade que o modelo atribuiu a cada token emitido. O <strong>logprob</strong> é o logaritmo natural dessa probabilidade, <code>lp = ln(p)</code>: probabilidade vive em (0, 1], o log vive em (-infinito, 0]. Referências: <code>0.0</code> é certeza; <code>-0.05</code> ≈ 95%; <code>-0.69</code> ≈ 50%; <code>-1.0</code> ≈ 37%; <code>-2.3</code> ≈ 10%. O log soma onde a probabilidade multiplicaria, e somar evita underflow de ponto flutuante em sequências longas.</p>' +
          '<ul><li><strong>Perplexidade:</strong> <code>exp(-média dos logprobs)</code>. Vale 1.0 em certeza total e cresce com a dúvida. A média normaliza pelo tamanho, então textos de comprimentos distintos ficam comparáveis.</li>' +
          '<li><strong>Limiar -1.0:</strong> token abaixo dele tem menos de ~37% e conta em <code>tokens_incertos</code>. É convenção operacional do módulo, não constante universal.</li></ul>' },
        { tipo: 'rode', id: 'm11b1-rode', titulo: 'Resuma os logprobs de uma geração', enunciado: 'Oito tokens de uma resposta curta, com logprobs fictícios. Preveja quantos o módulo conta como incertos e rode.',
          prefixo: '$', entrada: 'python -c "from metrics import resumir as r; c = r([-0.02, -0.05, -0.31, -1.8, -0.04, -2.3, -0.1, -0.01]); print(c, c.perplexidade)"', unidade: 'ms', terminalTitulo: 'metrics', etapas: etapasLogprob(),
          prever: { pergunta: 'Os logprobs são [-0.02, -0.05, -0.31, -1.80, -0.04, -2.30, -0.10, -0.01]. Quantos tokens ficam abaixo do limiar -1.0?', opcoes: [
            { id: 'a', texto: 'Nenhum: a média (-0.58) está acima de -1.0.', correta: false, porque: 'a contagem olha token a token, não a média; a média esconde os dois tokens em que o modelo hesitou.' },
            { id: 'b', texto: 'Dois: -1.80 e -2.30.', correta: true, porque: 'só esses dois estão abaixo de -1.0 (menos de ~37% de probabilidade).' },
            { id: 'c', texto: 'Três: todos os negativos abaixo de -0.3.', correta: false, porque: 'o limiar é -1.0, não -0.3; -0.31 ainda é cerca de 73%.' }
          ] },
          tutorAntes: 'Aperte Enter no comando já preenchido e depois clique em cada etapa para ler só as linhas dela.',
          tutorDepois: 'A média (-0.58) parece tranquila, mas o mínimo (-2.30) e os 2 tokens incertos mostram onde o modelo hesitou. É por isso que o contrato guarda médio, mínimo e contagem: um número só esconde a cauda.',
          callout: 'Você leu média, mínimo, tokens incertos e perplexidade da mesma geração.' },
        { tipo: 'callout', tom: 'danger', titulo: '"Logprob alto é resposta certa; pode aprovar sozinho"', html:
          '<p>Confiança mede <strong>coerência com o aprendido</strong>, não correspondência com a realidade. Um modelo pode responder com fluência e logprobs limpos sobre um fato inexistente. O grader de correção continua sendo o do M06: determinístico primeiro, juiz calibrado depois. O uso legítimo é <strong>relativo e agregado</strong>: comparar a mesma tarefa entre entradas, acompanhar deriva no tempo, ordenar a fila de revisão humana. Logprob prioriza o olhar humano; não assina veredito.</p>' },
        { tipo: 'takeaway', html: 'Logprob mede <mark>hesitação</mark>, não verdade: serve para <mark>priorizar revisão</mark>, nunca para aprovar sozinho.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>O contrato de metrics.py</h3>' +
          '<p>A folha B01-L do laboratório implementa este contrato verbatim em <code>lab/metrics.py</code>, só com a biblioteca padrão. Você escreve a função <code>resumir</code>; o resto do módulo já está pronto. A consulta SQL que acompanha o contrato, <code>pct_incerto.sql</code>, lê <code>llm_calls</code> (o registro do gateway do M05) e calcula <code>100.0 * tokens_incertos / nullif(tokens_saida, 0)</code> por chamada dos últimos 10 minutos, ordenada por <code>logprob_medio</code> crescente; ela roda só no PostgreSQL do Capstone.</p>' },
        { tipo: 'python', id: 'm11b1-python', titulo: 'Implemente resumir()', obrigatorio: false,
          enunciado: 'Complete <code>resumir(logprobs)</code>: lista vazia devolve <code>None</code>; senão devolve uma <code>ConfiancaGeracao</code> com média, mínimo, contagem de logprobs <em>estritamente abaixo</em> de <code>LIMIAR_INCERTEZA</code> e total.',
          codigo: codigoResumir, testes: testesResumir,
          dica: 'Use <code>sum(1 for lp in logprobs if lp &lt; LIMIAR_INCERTEZA)</code> para contar; o campo <code>medio</code> é <code>sum(...) / len(...)</code>.',
          solucao: solucaoResumir,
          tutorDepois: 'O controle negativo importa: com certeza total (logprob 0.0) a perplexidade é exatamente 1.0 e nenhum token é incerto.',
          callout: 'O contrato de confiança do módulo agora está em código e passa nos testes.' },
        { tipo: 'cenario', id: 'm11b1-cenario', titulo: 'Aprovar pela confiança?', obrigatorio: false,
          enunciado: 'Um colega propõe usar logprobs para decidir o que passa no gate do pipeline. Escolha como reagir e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O extrator do Cartógrafo devolve respostas com <code>lp_medio</code> entre -0,02 e -0,15. O colega quer aprovar tudo acima de -0,2 sem revisão. O que você responde?', opcoes: [
              { texto: 'Concordo: logprob alto significa resposta correta.', vai: 'f-aprovou', tom: 'ruim', consequencia: 'o modelo confiante e errado passa direto, com fluência e logprobs limpos.' },
              { texto: 'Uso o logprob para ordenar a fila de revisão e mantenho o grader do M06 como veredito.', vai: 'ordem', tom: 'ok', consequencia: 'a confiança prioriza o olhar humano sem assinar nada.' },
              { texto: 'Descarto o logprob: não serve para nada.', vai: 'f-descartou', tom: 'ruim', consequencia: 'você joga fora o instrumento mais barato de priorização de revisão.' }
            ] },
            ordem: { texto: 'A fila cresce. Como medir se a ordenação por logprob presta?', opcoes: [
              { texto: 'Comparar, por tarefa, a taxa de erro do grader nos 10% menos confiantes contra o resto, e acompanhar a deriva.', vai: 'f-bom', tom: 'ok', consequencia: 'uso relativo e agregado, validado contra o grader.' },
              { texto: 'Confiar que ordem por logprob já é ordem por erro.', vai: 'f-cego', tom: 'ruim', consequencia: 'sem medir, você não sabe se o sinal se relaciona com o erro da sua tarefa.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'A revisão humana vai primeiro onde o modelo hesitou, e o grader do M06 assina o veredito.' },
            'f-aprovou': { bom: false, texto: 'Respostas confiantes e erradas foram aprovadas sem ninguém olhar.' },
            'f-descartou': { bom: false, texto: 'A fila de revisão ficou sem priorização e custou mais horas humanas.' },
            'f-cego': { bom: false, texto: 'A ordenação ficou sem validação e ninguém sabe quanto ela vale.' }
          },
          callout: 'Você usou a confiança para priorizar e deixou o veredito com o grader.' },
        { tipo: 'escolha', id: 'm11b1-esc-logprob', titulo: 'Confira: ler um logprob',
          pergunta: 'Um token emitido tem logprob -2,3. O que isso significa e como o módulo o trata?',
          opcoes: [
            { id: 'a', texto: 'O token é 2,3 vezes mais provável que o segundo colocado.', correta: false, porque: 'logprob não é razão entre candidatos; é o log da probabilidade do token emitido.' },
            { id: 'b', texto: 'A resposta tem 2,3% de chance de estar correta.', correta: false, porque: 'mede o token emitido segundo o modelo, não a correção da resposta.' },
            { id: 'c', texto: 'O modelo atribuiu cerca de 10% àquele token; abaixo de -1,0 (~37%) o módulo o conta como incerto.', correta: true, porque: 'logprob é ln(p): -2,3 ≈ ln(0,10). O limiar -1,0 é convenção operacional do módulo, não constante universal.' },
            { id: 'd', texto: 'O token foi emitido com 90% de confiança.', correta: false, porque: '90% seria logprob próximo de -0,1.' }
          ], tutorDepois: 'Logprob = ln(p); o limiar -1,0 é convenção.' },
        { tipo: 'escolha', id: 'm11b1-esc-aprovar', titulo: 'Confira: aprovar por logprob',
          pergunta: 'Um colega aprova respostas automaticamente quando os logprobs são altos. Qual é o erro?',
          opcoes: [
            { id: 'a', texto: 'Nenhum: logprob alto equivale a resposta correta.', correta: false, porque: 'confiança não é correção.' },
            { id: 'b', texto: 'Confiança mede coerência com o aprendido, não correspondência com a realidade: existe modelo confiante e errado. Logprob prioriza a fila de revisão, não assina veredito.', correta: true, porque: 'modelo fluente, com logprobs limpos, pode descrever com segurança um fato inexistente. O grader de correção é o do M06.' },
            { id: 'c', texto: 'Logprobs só existem em modelos locais, então o gateway nunca os recebe.', correta: false, porque: 'o adapter pede os logprobs na chamada e resume a lista; o Bloco 7 os propaga atrás da porta do M05.' },
            { id: 'd', texto: 'O erro é usar a média; a perplexidade deveria ser a soma dos logprobs.', correta: false, porque: 'a perplexidade é exp(-média); a média normaliza pelo tamanho do texto.' }
          ], tutorDepois: 'Priorizar revisão sim; assinar veredito não.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes do bloco: Attention Is All You Need (SRC-M11-02), BPE de Sennrich et al. (SRC-M11-09), PyTorch docs (SRC-M11-01, versão a fixar na folha L), FlashAttention (SRC-M11-08), tokenizers e PEFT (SRC-M11-13 e SRC-M11-14); consulta de 14/09/2026. Logprobs, perplexidade e o limiar -1.0 são referência de API a confirmar na folha L. Spolsky (2002) e Cooper são referência canônica geral, com obra e edição a confirmar.</p>' },
        { tipo: 'takeaway', html: 'Implemente o contrato, <mark>meça a hesitação</mark> e deixe o <mark>veredito</mark> com o grader.' }
      ] }
    ]
  });
})();
