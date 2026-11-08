/* M08 · Bloco 8: Mini-projeto, o agente investigador de código. Fonte: M08.html#b08. Exemplo condutor: fixture_repo/loja.py do laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoMet = String.raw`def metricas(previstos, esperados):
    """previstos e esperados: coleções de itens "caminho:linha".
    Devolve (precisao, recall).
    precisao = acertos / previstos; recall = acertos / esperados.
    Borda: sem previstos, precisão 0.0; sem esperados, recall 1.0.
    Se os dois estão vazios, (1.0, 1.0)."""
    # TODO: use conjuntos
    return 0.0, 0.0


def regressoes(casos):
    """casos: lista de dicts {"nome", "previstos", "esperados", "esperado_falhar"}.
    Devolve os nomes dos casos que falharam (precisão ou recall < 1.0)
    e NÃO estavam marcados como esperado_falhar."""
    # TODO
    return []
`;
  var solucaoMet = String.raw`def metricas(previstos, esperados):
    p, e = set(previstos), set(esperados)
    if not p and not e:
        return 1.0, 1.0
    acertos = len(p & e)
    precisao = acertos / len(p) if p else 0.0
    recall = acertos / len(e) if e else 1.0
    return precisao, recall


def regressoes(casos):
    falhos = []
    for c in casos:
        precisao, recall = metricas(c["previstos"], c["esperados"])
        if (precisao < 1.0 or recall < 1.0) and not c.get("esperado_falhar", False):
            falhos.append(c["nome"])
    return falhos
`;
  var testesMet = String.raw`def test_acerto_total():
    assert metricas({"loja.py:19"}, {"loja.py:19"}) == (1.0, 1.0)


def test_item_a_mais_derruba_precisao():
    p, r = metricas({"loja.py:19", "loja.py:8"}, {"loja.py:19"})
    assert p == 0.5 and r == 1.0


def test_item_faltando_derruba_recall():
    p, r = metricas({"loja.py:19"}, {"loja.py:19", "app.py:3"})
    assert p == 1.0 and r == 0.5


def test_sem_previstos_zera_precisao_e_vazio_com_vazio_e_perfeito():
    assert metricas(set(), {"loja.py:19"}) == (0.0, 0.0)
    assert metricas(set(), set()) == (1.0, 1.0)


def test_regressao_ignora_esperado_falhar():
    casos = [
        {"nome": "chamada_direta", "previstos": {"loja.py:19"}, "esperados": {"loja.py:19"}, "esperado_falhar": False},
        {"nome": "reflexao", "previstos": set(), "esperados": {"cfg.py:7"}, "esperado_falhar": True},
        {"nome": "regrediu", "previstos": {"x.py:1"}, "esperados": {"y.py:2"}, "esperado_falhar": False},
    ]
    assert regressoes(casos) == ["regrediu"]
`;

  var PROMPT = [
    '---', 'id: investigador', 'versao: 1', 'modelo_alvo: raciocinio', 'temperatura: 0', '---',
    'Você investiga um repositório de código legado para responder perguntas de',
    'impacto de mudança. Você não tem conhecimento prévio deste sistema: tudo o',
    'que afirmar precisa vir das ferramentas.',
    '', 'MÉTODO',
    '1. Localize a DEFINIÇÃO do símbolo antes de qualquer outra coisa.',
    '2. Liste os USOS. Para cada uso relevante, leia o trecho ao redor.',
    '3. Avalie o impacto por tipo: chamada direta, implementação de interface,',
    '   reflexão/serialização (procure o nome como string), teste.',
    '4. Registre cada fato estabelecido com notas_registrar, incluindo evidência.',
    '', 'REGRAS',
    '- Toda afirmação cita arquivo e linhas. Sem citação, não afirme.',
    '- Se a evidência for insuficiente, diga o que faltou verificar. Não suponha.',
    '- Não leia arquivo inteiro quando uma faixa de linhas basta.',
    '- Pare quando tiver a resposta. Não continue investigando por completude.',
    '', 'SAÍDA',
    'Objeto com: impacto_resumo, itens_afetados[] (caminho, linhas, tipo_de_uso,',
    'severidade), riscos_nao_verificados[], e confianca (alta|media|baixa).'].join('\n');

  TrilhaAula.registrar({
    id: 'm08-b8',
    titulo: 'Mini-projeto: o agente investigador de código',
    minutos: 45,
    resumo: 'Juntar tudo: cinco ferramentas com namespace, system prompt na altitude certa, loop com orçamento e parada, compactação, memória de fatos, saída estruturada e telemetria. A pergunta: o que quebra se eu mudar a assinatura deste método?',
    objetivo: 'Montar o agente investigador sobre o repositório fixture do laboratório, medi-lo com precisão e recall e comparar agente com workflow determinístico com números.',
    revisao: [
      { id: 'm08b8-agente', pergunta: '"O que quebra se eu mudar a assinatura deste método?" é um caso para agente. Por quê?',
        opcoes: [
          opc('a', 'O número de saltos depende de quantas classes chamam o método, e isso só se descobre investigando: não dá para enumerar os passos antes', true, 'número de passos desconhecido, ferramentas e ordem não previsíveis, caminho diferente por entrada: as três perguntas do bloco 1.'),
          opc('b', 'Porque exige um modelo maior', false, 'tamanho de modelo não define se o problema é agêntico.'),
          opc('c', 'Porque todo problema de impacto é agêntico', false, 'o que decide são as três perguntas, não o tema.')] },
      { id: 'm08b8-p95', pergunta: 'No eval do agente investigador, o p95 de passos está encostado no teto. O que isso sugere?',
        opcoes: [
          opc('a', 'Uma classe de pergunta que o agente não resolve com as ferramentas atuais (tipicamente estrutural, que pede grafo no M10)', true, 'p95 no teto é diagnóstico: aponta onde investir (ferramenta melhor, grafo, decomposição).'),
          opc('b', 'Que o teto de passos deve ser removido', false, 'remover o teto transforma o problema em fatura aberta.'),
          opc('c', 'Que o modelo precisa de mais temperatura', false, 'temperatura não cria uma ferramenta que falta.')] },
      { id: 'm08b8-reflexao', pergunta: 'Usos por reflexão ou por string não aparecem na busca textual do agente. O que fazer no eval?',
        opcoes: [
          opc('a', 'Marcar esses casos como <code>esperado_falhar</code>: são a evidência que motiva o grafo do M10', true, 'a falha documentada vira motivação, e não esconde a baseline.'),
          opc('b', 'Remover esses casos da suíte', false, 'esconde a limitação real.'),
          opc('c', 'Subir o teto de passos até aparecerem', false, 'busca textual não encontra o que não é texto do símbolo.')] },
      { id: 'm08b8-prompt', pergunta: 'O que o system prompt do investigador deliberadamente <em>não</em> faz?',
        opcoes: [
          opc('a', 'Não lista os arquivos do projeto (isso é ferramenta), não tenta prever casos (isso é heurística) e não pede raciocínio verboso', true, 'altitude certa do bloco 4; e inclui "pare quando tiver a resposta", porque modelos com ferramentas tendem a super-investigar.'),
          opc('b', 'Não exige citação de arquivo e linhas', false, 'exige: "sem citação, não afirme".'),
          opc('c', 'Não define o formato de saída', false, 'define um objeto com itens afetados, riscos não verificados e confiança.')] },
      { id: 'm08b8-workflow', pergunta: 'No padrão típico da comparação agente × workflow determinístico de 4 passos, o que costuma aparecer?',
        opcoes: [
          opc('a', 'Workflow 3 a 8 vezes mais barato, mais rápido e com variância quase zero, empatando ou ganhando onde o caminho é definido', true, 'conclusão com números: agente onde a agência é necessária, workflow no resto, com roteamento decidindo.'),
          opc('b', 'O agente sempre ganha em acurácia e custo', false, 'o agente só ganha onde o caminho não é definido.'),
          opc('c', 'Os dois custam o mesmo', false, 'a diferença de custo é o ponto da comparação.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O <strong>agente investigador</strong> responde <em>"o que quebra se eu mudar a assinatura deste método?"</em> investigando sozinho, com ferramentas, orçamento, memória e citação de evidência, sobre o repositório fixture do laboratório (<code>fixture_repo/loja.py</code>).</p>' +
          '<h3>As cinco ferramentas, com namespace</h3>' +
          '<p>Aplicação do bloco 3. Cada uma tem descrição "use quando / não use quando", schema Pydantic, erro acionável e truncamento com instrução, verificados pelo guardrail do laboratório.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Ferramenta</th><th>Faz</th><th>Devolve</th></tr></thead><tbody>' +
          '<tr><td><code>repo_buscar_simbolo</code></td><td>ocorrências exatas de um identificador</td><td>caminho:linha, trecho, e se é DEFINIÇÃO ou USO</td></tr>' +
          '<tr><td><code>repo_buscar_conceito</code></td><td>busca híbrida do M07</td><td>top-5 trechos com caminho e linhas</td></tr>' +
          '<tr><td><code>repo_ler_trecho</code></td><td>lê faixa de linhas de um arquivo</td><td>o trecho, com aviso se truncou</td></tr>' +
          '<tr><td><code>repo_listar_referencias</code></td><td>quem chama/usa um símbolo (por enquanto, por busca textual)</td><td>lista de chamadores com caminho:linha</td></tr>' +
          '<tr><td><code>notas_registrar</code></td><td>grava um fato com evidência</td><td>confirmação curta</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>O system prompt na altitude certa</h3>' +
          '<p>Versionado como no registry do M06 (bloco 4 explica a altitude). Repare no que ele <strong>não</strong> faz: não lista os arquivos do projeto (isso é ferramenta), não tenta prever casos (isso é heurística) e não pede raciocínio verboso. E note a instrução "pare quando tiver a resposta": modelos tendem a super-investigar quando têm ferramentas.</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: PROMPT },
        { tipo: 'texto', html:
          '<h3>Juntando tudo</h3>' +
          '<ul><li>Loop do bloco 5: orçamento triplo, parada, HITL.</li><li>Compactação do bloco 4.</li><li>Memória de fatos do bloco 6.</li><li>Saída estruturada do M05 (bloco 2).</li><li>Telemetria do M06 (bloco 5).</li></ul>' },
        { tipo: 'takeaway', html: 'Cinco ferramentas, um <mark>prompt na altitude certa</mark> e o <mark>loop do bloco 5</mark>: o agente é a soma dos blocos anteriores.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Uma investigação sobre o fixture. Para manter o exemplo verificável, a pergunta é sobre <code>calcular_total</code>, que <em>tem</em> chamador em <code>loja.py</code>; já <code>fechar_pedido</code> não é chamado por ninguém no fixture. O formato das linhas é <strong>ilustrativo</strong>; a execução real, com modelo falso determinístico, está no laboratório guiado.</p>' },
        { tipo: 'rode', id: 'b8-rode-investigacao', titulo: 'Investigar o impacto de mudar calcular_total',
          enunciado: 'Aperte Enter e clique nas etapas, na ordem. Cada afirmação vem com arquivo e linha, e o resultado se confere item por item contra o fixture.',
          prefixo: 'Prompt', entrada: 'O que quebra se eu mudar a assinatura de calcular_total?', unidade: 's', terminalTitulo: 'investigador · fixture_repo/loja.py',
          prever: { pergunta: 'Qual deve ser a primeira ferramenta chamada, segundo o método do prompt?', opcoes: [
            { id: 'a', texto: '<code>repo_ler_trecho</code>, lendo o arquivo inteiro para ter contexto.', correta: false, porque: 'o prompt manda não ler arquivo inteiro quando uma faixa basta.' },
            { id: 'b', texto: '<code>repo_buscar_simbolo</code>, para localizar a DEFINIÇÃO antes de qualquer outra coisa.', correta: true, porque: 'passo 1 do método: definição primeiro, depois usos, depois trecho ao redor.' },
            { id: 'c', texto: '<code>notas_registrar</code>, para anotar a hipótese.', correta: false, porque: 'só se registra fato estabelecido, com evidência.' }
          ] },
          etapas: [
            { id: 'def', nome: '1 · Definição', descricao: 'buscar_simbolo', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'repo_buscar_simbolo("calcular_total")'),
              L('out', 'loja.py:11  DEFINIÇÃO  def calcular_total(itens, desconto=0.0)'),
              L('out', 'loja.py:19  USO        total = calcular_total(itens)')] },
            { id: 'trecho', nome: '2 · Trecho ao redor', descricao: 'ler_trecho', tom: 'request', ms: 1, linhas: [
              L('cmd', 'repo_ler_trecho("loja.py", 17, 20)'),
              L('out', 'def fechar_pedido(itens): ... total = calcular_total(itens) ...'),
              L('hint', 'faixa de linhas, não o arquivo inteiro')] },
            { id: 'nota', nome: '3 · Registrar', descricao: 'notas_registrar', tom: 'response', ms: 1, linhas: [
              L('cmd', 'notas_registrar(fato="fechar_pedido chama calcular_total", evidencia=loja.py:19)'),
              L('out', 'ok'),
              L('hint', 'fato com evidência; é o que torna a parcial útil se o orçamento acabar')] },
            { id: 'saida', nome: '4 · Saída estruturada', descricao: 'impacto_resumo e itens', tom: 'ink', ms: 1, linhas: [
              L('out', 'itens_afetados: [{caminho: loja.py, linhas: 19, tipo_de_uso: chamada direta}]'),
              L('out', 'riscos_nao_verificados: [uso por reflexão ou string]'),
              L('out', 'confianca: media'),
              L('hint', 'toda afirmação cita arquivo e linhas; o que faltou verificar é dito, não suposto')] }
          ],
          tutorDepois: 'Confira: a definição está na linha 11 e o único uso, na linha 19. É assim que o agente é medido: precisão e recall dos itens afetados.',
          callout: 'Você viu a investigação completa: definição, uso, trecho, fato registrado e saída com evidência.' },
        { tipo: 'texto', html:
          '<h3>Ligando nos evals (M06)</h3>' +
          '<p>Uma categoria <code>agente_impacto</code>, com casos de resposta conhecida, medindo <strong>precisão, recall, passos, custo e citação válida</strong>. O resultado esperado é a baseline do agente com precisão e recall por caso.</p>' +
          '<p>Usos por <strong>reflexão ou string</strong> não aparecem na busca textual. Isso é evidência que motiva o grafo do M10: marque esses casos como <code>esperado_falhar</code> em vez de esconder ou de subir o teto.</p>' +
          '<h3>Workflow contra agente, com números</h3>' +
          '<p>Transforme o problema em workflow determinístico de 4 passos fixos, sem decisão do modelo, e rode as mesmas perguntas nos dois. O padrão típico: workflow <strong>3 a 8 vezes mais barato</strong>, mais rápido, com variância quase zero, empatando ou ganhando onde o caminho é definido. A conclusão de engenharia, com números: <strong>agente onde a agência é necessária, workflow no resto, com roteamento decidindo</strong>.</p>' +
          '<p>A aplicação ao Capstone (<code>services/agent/</code>) é trilha opcional com especificação própria.</p>' },
        { tipo: 'takeaway', html: 'Meça com <mark>precisão e recall</mark>, marque o que a busca textual não alcança como <mark>esperado_falhar</mark> e decida <mark>agente × workflow com números</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b8-python-metricas', titulo: 'Meça o agente: precisão e recall', obrigatorio: false,
          enunciado: 'Cada item afetado é uma string <code>caminho:linha</code>. Implemente <code>metricas</code> (precisão e recall de um caso) e <code>regressoes</code> (nomes dos casos que falharam sem estar marcados como <code>esperado_falhar</code>). Biblioteca padrão.',
          codigo: codigoMet, testes: testesMet,
          dica: 'Com conjuntos, acertos = len(p & e). Cuide das bordas: sem previstos, a precisão é 0.0 (a menos que também não haja esperados); sem esperados, o recall é 1.0.',
          solucao: solucaoMet,
          tutorDepois: 'O esperado_falhar documenta o limite sem poluir a regressão: o caso de reflexão aponta para o grafo do M10, não para um bug.',
          callout: 'Métricas e filtro de regressão prontos, com o limite conhecido documentado.' },
        { tipo: 'cenario', id: 'b8-cenario-p95', titulo: 'O p95 de passos encostou no teto', obrigatorio: false,
          enunciado: 'No eval do investigador, as perguntas sobre "todos os chamadores transitivos" estouram o orçamento de passos sempre.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O p95 de passos está no teto e o parcial sai com poucos fatos. O que você faz?', opcoes: [
              { texto: 'Subir o teto de passos até a pergunta passar.', vai: 'f-aberta', tom: 'ruim', consequencia: 'sobe o custo de todas as perguntas e a fatura fica aberta.' },
              { texto: 'Identificar a classe de pergunta: se for estrutural/transitiva, as ferramentas atuais (busca textual) não resolvem.', vai: 'classe', tom: 'ok', consequencia: 'o teto no p95 é diagnóstico, não castigo.' }
            ] },
            classe: { texto: 'É a classe estrutural/transitiva. Qual o registro correto?', opcoes: [
              { texto: 'Marcar os casos como esperado_falhar e apontar para o grafo do M10.', vai: 'f-bom', tom: 'ok', consequencia: 'a baseline continua honesta e a limitação vira motivação.' },
              { texto: 'Tirar os casos da suíte para o relatório ficar verde.', vai: 'f-escondida', tom: 'ruim', consequencia: 'o relatório mente: a limitação continua em produção.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Teto preservado, limite documentado e a próxima ferramenta (grafo) justificada por dados.' },
            'f-aberta': { bom: false, texto: 'Custo por execução subiu para todos e a classe estrutural continuou sem resposta.' },
            'f-escondida': { bom: false, texto: 'Suíte verde, produto limitado: ninguém sabe onde o agente falha.' }
          },
          callout: 'Você tratou o p95 no teto como diagnóstico e registrou o limite como esperado_falhar.' },
        { tipo: 'callout', tom: 'info', titulo: 'Percurso do laboratório', html:
          '<p>O roteiro executável fica no laboratório guiado M08: execução completa com motivo <code>sucesso</code>; três estouros com parcial útil; memória com invalidação; subagente com orçamento próprio; e a comparação agente × workflow de 4 passos fixos com as mesmas perguntas, com custo, latência, acurácia e variância.</p>' },
        { tipo: 'takeaway', html: 'O que a busca textual não vê é <mark>dado para o M10</mark>, não motivo para <mark>subir o teto</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b8-escolha-agente', titulo: 'Confira: agente ou workflow',
          pergunta: 'Uma rota do produto sempre faz as mesmas quatro etapas, na mesma ordem, para toda entrada. Qual arquitetura vai para produção nela?',
          opcoes: [
            { id: 'a', texto: 'Agente, porque é mais flexível.', correta: false, porque: 'flexibilidade sem necessidade custa de 3 a 8 vezes mais, com variância.' },
            { id: 'b', texto: 'Workflow determinístico: o caminho é definido, o custo é menor e a variância é quase zero.', correta: true, porque: 'agente onde a agência é necessária, workflow no resto.' },
            { id: 'c', texto: 'Multi-agente, para dividir as quatro etapas.', correta: false, porque: 'etapas em ordem fixa são um workflow com agentes nos nós, no máximo.' }
          ], tutorDepois: 'O roteamento decide qual caminho cada pergunta segue.' },
        { tipo: 'escolha', id: 'b8-escolha-metrica', titulo: 'Confira: a métrica certa',
          pergunta: 'O agente listou três itens afetados; dois estão corretos, e o fixture tem quatro itens esperados. Qual o diagnóstico?',
          opcoes: [
            { id: 'a', texto: 'Precisão 2/3 e recall 2/4: acerta o que diz, mas deixa passar metade do que importa.', correta: true, porque: 'precisão = acertos / previstos; recall = acertos / esperados.' },
            { id: 'b', texto: 'Precisão 2/4 e recall 2/3.', correta: false, porque: 'os denominadores estão trocados.' },
            { id: 'c', texto: 'Perfeito: os dois itens citados estão certos.', correta: false, porque: 'ignora o recall: faltaram dois itens.' }
          ], tutorDepois: 'Por isso o eval mede precisão, recall, passos, custo e citação válida, não uma nota única.' },
        { tipo: 'takeaway', html: 'Agente onde a <mark>agência é necessária</mark>, workflow no resto, e <mark>números</mark> decidindo.' }
      ] }
    ]
  });
})();
