/* E02 · Bloco 2: SFT, dados, splits, hiperparâmetros, overfitting, esquecimento e avaliação. Fonte: E02.html#b02. Saída do gate: execução real do lab em 11/10/2026 (semente 7). Estado de fornecedores verificado em 11/10/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  var J = function (a) { return a.join('\n'); };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasGate = function () {
    return [
      { id: 'cmd', nome: 'Adaptar e comparar', descricao: 'Full fine-tuning da tarefa A para a B com 48 exemplos', tom: 'dns', ms: 0, linhas: [
        L('cmd', 'uv run python -m adapt_lab.cli demo; echo "exit=$?"'),
        L('info', 'parametros do modelo base: 2632 · treinaveis full: 2632 (100.0%)'),
        L('hint', 'o laboratório treina na A (pré-treino), adapta à B (posto 2) e mede as duas')] },
      { id: 'alvo', nome: 'Alvo: tarefa_B', descricao: 'O que você queria melhorar', tom: 'tcp', ms: 108.9, linhas: [
        L('out', 'suite     base    novo    ganho    estado'),
        L('out', 'tarefa_B  0.1535  0.1089  +29.1%   ok'),
        L('hint', 'o erro no alvo caiu 29%: o ajuste funcionou onde foi medido')] },
      { id: 'guarda', nome: 'Guarda: tarefa_A', descricao: 'O que o modelo sabia antes', tom: 'tls', ms: 55.8, linhas: [
        L('out', 'tarefa_A  0.0008  0.0558  -6842.1%  REGRIDE'),
        L('hint', 'o erro-base é 0,0008: qualquer desvio vira um percentual gigante (limite só relativo é hipersensível)')] },
      { id: 'gate', nome: 'Gate', descricao: 'Resultado e código de saída', tom: 'ink', ms: 0, linhas: [
        L('in', 'GATE: REPROVADO'),
        L('out', 'exit=1'),
        L('hint', 'o gate transformou "melhorou no alvo" em "reprovado: quebrou a A", antes de ir para produção')] }
    ];
  };

  var codigoSplit = J([
    'import hashlib',
    '',
    '',
    'def bucket(group_id: str, n: int = 100) -> int:',
    '    """Atribuição estável: o mesmo grupo cai sempre no mesmo balde."""',
    '    # SHA-256 do id, convertido em inteiro, módulo n (hash() do Python varia entre execuções)',
    '    return 0',
    '',
    '',
    'def split(example: dict) -> str:',
    '    b = bucket(example["customer_id"])  # unidade de vazamento = cliente',
    '    # 0-79 treino, 80-89 validação, 90-99 teste',
    '    return "train"',
    '',
    '',
    'def preparar(exemplos: list[dict]) -> dict[str, list[dict]]:',
    '    """Deduplica ANTES de dividir (texto normalizado) e depois separa por split."""',
    '    saida = {"train": [], "val": [], "test": []}',
    '    return saida',
    '',
    '',
    'print(preparar([{"customer_id": "c1", "texto": "Cobrança duplicada"}]))',
    ''
  ]);
  var testesSplit = J([
    'def test_bucket_estavel_e_no_intervalo():',
    '    assert bucket("cliente-42") == bucket("cliente-42")',
    '    assert all(0 <= bucket(f"c{i}") < 100 for i in range(200))',
    '',
    '',
    'def test_mesmo_cliente_nunca_cruza_splits():',
    '    exs = [{"customer_id": f"c{i % 50}", "texto": f"t{i}"} for i in range(500)]',
    '    vistos = {}',
    '    for e in exs:',
    '        vistos.setdefault(e["customer_id"], set()).add(split(e))',
    '    assert all(len(s) == 1 for s in vistos.values())',
    '',
    '',
    'def test_acrescentar_dados_nao_move_exemplos_antigos():',
    '    antigos = [{"customer_id": f"c{i}", "texto": f"t{i}"} for i in range(100)]',
    '    antes = {e["customer_id"]: split(e) for e in antigos}',
    '    novos = antigos + [{"customer_id": f"n{i}", "texto": f"x{i}"} for i in range(100)]',
    '    depois = {e["customer_id"]: split(e) for e in novos}',
    '    assert all(depois[k] == v for k, v in antes.items())',
    '',
    '',
    'def test_proporcao_aproximada_80_10_10():',
    '    exs = [{"customer_id": f"c{i}", "texto": f"t{i}"} for i in range(2000)]',
    '    n = {"train": 0, "val": 0, "test": 0}',
    '    for e in exs:',
    '        n[split(e)] += 1',
    '    assert 1450 <= n["train"] <= 1750 and n["val"] > 100 and n["test"] > 100',
    '',
    '',
    'def test_deduplica_antes_de_dividir():',
    '    exs = [',
    '        {"customer_id": "c1", "texto": "Cobrança duplicada"},',
    '        {"customer_id": "c2", "texto": "  cobrança   duplicada "},',
    '        {"customer_id": "c3", "texto": "Boleto vencido"},',
    '    ]',
    '    out = preparar(exs)',
    '    assert sum(len(v) for v in out.values()) == 2',
    ''
  ]);
  var solucaoSplit = J([
    'import hashlib',
    '',
    '',
    'def bucket(group_id: str, n: int = 100) -> int:',
    '    h = hashlib.sha256(group_id.encode("utf-8")).hexdigest()',
    '    return int(h, 16) % n',
    '',
    '',
    'def split(example: dict) -> str:',
    '    b = bucket(example["customer_id"])',
    '    if b < 80:',
    '        return "train"',
    '    if b < 90:',
    '        return "val"',
    '    return "test"',
    '',
    '',
    'def preparar(exemplos: list[dict]) -> dict[str, list[dict]]:',
    '    saida = {"train": [], "val": [], "test": []}',
    '    vistos = set()',
    '    for e in exemplos:',
    '        chave = " ".join(e["texto"].lower().split())',
    '        if chave in vistos:',
    '            continue',
    '        vistos.add(chave)',
    '        saida[split(e)].append(e)',
    '    return saida',
    ''
  ]);

  var codigoZ = J([
    'import math',
    '',
    '',
    'def erro_padrao_dif(p1: float, p2: float, n: int) -> float:',
    '    """Erro-padrão da diferença entre duas proporções (aproximação não pareada, mesmo n)."""',
    '    return 0.0',
    '',
    '',
    'def distinguivel(p1: float, p2: float, n: int) -> bool:',
    '    """True se |z| >= 1,96 (95%)."""',
    '    return True',
    '',
    '',
    'print(round(erro_padrao_dif(0.84, 0.88, 200), 4), distinguivel(0.84, 0.88, 200))',
    ''
  ]);
  var testesZ = J([
    'def test_erro_padrao_do_exemplo():',
    '    assert round(erro_padrao_dif(0.84, 0.88, 200) * 100, 1) == 3.5',
    '',
    '',
    'def test_quatro_pontos_em_200_nao_estao_demonstrados():',
    '    assert distinguivel(0.84, 0.88, 200) is False',
    '',
    '',
    'def test_mesma_diferenca_com_teste_maior_passa():',
    '    assert distinguivel(0.84, 0.88, 2000) is True',
    '',
    '',
    'def test_diferenca_negativa_tambem_conta():',
    '    assert distinguivel(0.88, 0.70, 200) is True',
    ''
  ]);
  var solucaoZ = J([
    'import math',
    '',
    '',
    'def erro_padrao_dif(p1: float, p2: float, n: int) -> float:',
    '    return math.sqrt(p1 * (1 - p1) / n + p2 * (1 - p2) / n)',
    '',
    '',
    'def distinguivel(p1: float, p2: float, n: int) -> bool:',
    '    return abs(p2 - p1) / erro_padrao_dif(p1, p2, n) >= 1.96',
    ''
  ]);

  TrilhaAula.registrar({
    id: 'e02-b2',
    titulo: 'SFT: dados, splits, esquecimento e avaliação honesta',
    minutos: 40,
    resumo: 'O algoritmo do SFT é banal. O resultado depende de três coisas que não são algoritmo: qualidade dos dados, disciplina dos splits e honestidade da comparação com o baseline.',
    objetivo: 'Montar um SFT que não vaza dados entre splits, ler overfitting e esquecimento, e relatar o resultado com baseline de prompt otimizado e uma estatística que sustente a diferença.',
    revisao: [
      { id: 'e02b2-split', pergunta: 'Como evitar vazamento entre treino e teste quando o mesmo cliente aparece em várias linhas?',
        opcoes: [
          opc('a', 'Deduplicar (incluindo quase-duplicatas) e dividir por unidade de vazamento, com hash do grupo', true, 'o hash do grupo é estável: acrescentar dados novos não move exemplos antigos entre splits.'),
          opc('b', 'Embaralhar as linhas e dividir 80/10/10', false, 'o split aleatório por linha põe o mesmo cliente nos dois lados e a métrica mente.'),
          opc('c', 'Dividir primeiro e deduplicar depois', false, 'a mesma frase já terá caído em treino e teste.')] },
      { id: 'e02b2-template', pergunta: 'Qual é a causa mais frequente de "o fine-tuning não funcionou"?',
        opcoes: [
          opc('a', 'Treinar com um template de chat e servir com outro', true, 'o template e o prompt de sistema devem ser os do uso real, e o fim de turno precisa estar na sequência de treino.'),
          opc('b', 'Usar poucas GPUs', false, 'hardware raramente é a causa de um ajuste que não pega.'),
          opc('c', 'Escolher LoRA em vez de full fine-tuning', false, 'o método não é a causa mais frequente.')] },
      { id: 'e02b2-esquece', pergunta: 'O que é a única defesa operacional contra esquecimento catastrófico?',
        opcoes: [
          opc('a', 'Medir: uma suíte-guarda com as capacidades que não podem cair, rodada contra base e candidato', true, 'taxa menor, reprise e baixo posto reduzem o risco, mas nenhuma garante.'),
          opc('b', 'Usar LoRA, que não esquece', false, 'no laboratório do módulo, o LoRA esqueceu mais que o full nas quatro sementes.'),
          opc('c', 'Treinar mais épocas', false, 'mais épocas pioram o esquecimento.')] },
      { id: 'e02b2-ruido', pergunta: 'Com 200 exemplos de teste, baseline 84% e ajustado 88%. A diferença está demonstrada?',
        opcoes: [
          opc('a', 'Não: o erro-padrão da diferença é cerca de 3,5 pontos; use teste pareado, mais exemplos ou aceite que não está provada', true, '4 pontos são pouco mais de um erro-padrão.'),
          opc('b', 'Sim, porque 88 é maior que 84', false, 'maior na amostra não é diferença distinguível do ruído.'),
          opc('c', 'Sim, se a perda de validação caiu', false, 'perda e acurácia da tarefa podem discordar.')] },
      { id: 'e02b2-relatorio', pergunta: 'Quantas linhas tem o relatório honesto de um SFT, e qual é a que não pode faltar?',
        opcoes: [
          opc('a', 'Quatro; a do modelo-base com prompt otimizado, sem a qual qualquer ganho é suspeito', true, 'as quatro são base simples, base otimizado, ajustado com prompt curto e ajustado com prompt otimizado.'),
          opc('b', 'Duas: base e ajustado', false, 'compara o ajustado com o prompt ingênuo.'),
          opc('c', 'Uma: o ajustado no teste', false, 'sem referência não há ganho a demonstrar.')] }
    ],
    abas: [
      { rotulo: 'Dados e splits', blocos: [
        { tipo: 'texto', html:
          '<h3>O algoritmo é banal; os dados decidem</h3>' +
          '<p><strong>SFT</strong> (<em>supervised fine-tuning</em>) é a forma mais simples de adaptar: mostrar ao modelo pares (entrada, saída desejada) e minimizar a entropia cruzada sobre a saída. Pesquisa como LIMA (Zhou et al., 2023) sustenta que poucos exemplos curados bastam para ajustar estilo e formato de um modelo já pré-treinado: o esforço desloca de volume para curadoria.</p>' +
          '<h3>O formato e a máscara de perda</h3>' +
          '<p>Uma amostra de SFT para modelo de chat é uma lista de mensagens com papéis. O modelo é treinado a prever apenas os tokens do <strong>assistente</strong>; os de sistema e de usuário entram como contexto, com a perda <strong>mascarada</strong>. Sem a máscara, o modelo gasta capacidade imitando o usuário e o prompt de sistema.</p>' },
        { tipo: 'codigo', linguagem: 'json', texto: '{"messages": [\n  {"role": "system", "content": "Classifique o ticket. Responda só com o JSON do esquema."},\n  {"role": "user", "content": "Cobrança duplicada no cartão final 4421, pedido 88213."},\n  {"role": "assistant", "content": "{\\"categoria\\":\\"cobranca\\",\\"subtipo\\":\\"duplicidade\\",\\"urgencia\\":\\"alta\\"}"}\n]}' },
        { tipo: 'texto', html:
          '<p>Quatro pontos decidem a qualidade, em ordem de impacto:</p>' +
          '<ul>' +
          '<li><strong>Mesmo template e mesmo prompt de sistema do uso real.</strong> Treinar com um template e servir com outro é a causa mais frequente de "o fine-tuning não funcionou". O tokenizador do modelo-base define o template; o fim de turno precisa estar na sequência de treino, senão o modelo não aprende a parar.</li>' +
          '<li><strong>A distribuição dos dados é a distribuição do comportamento.</strong> Se 80% dos exemplos são de "cobrança", o modelo vira um classificador enviesado. Amostre para a distribuição que você quer em produção, não para a que você tem.</li>' +
          '<li><strong>Inclua recusa e abstenção.</strong> Um dataset só de respostas diretas ensina o modelo a nunca dizer "não sei" (o mesmo problema do RAG sem abstenção, M07 B06).</li>' +
          '<li><strong>Qualidade vence volume.</strong> Centenas a poucos milhares de exemplos auditados superam dezenas de milhares ruidosos para ajuste de formato e política. Rótulo inconsistente entre anotadores é um teto que mais dados não furam: meça a concordância entre dois revisores numa amostra antes de treinar.</li></ul>' +
          '<h3>Splits sem vazamento</h3>' +
          '<p>Um split aleatório por linha vaza quando há estrutura: o mesmo cliente, o mesmo ticket reaberto, a mesma conversa em duas linhas, o mesmo documento-fonte. O modelo memoriza a entidade e a métrica de teste mente. Separe por <strong>unidade de vazamento</strong> (grupo) e deduplique antes de dividir, incluindo quase-duplicatas.</p>' +
          '<p>A atribuição por hash do grupo é estável entre execuções e entre versões do dataset: dados novos não movem exemplos antigos de um split para outro. Os três splits têm funções distintas: <strong>treino</strong> ajusta pesos; <strong>validação</strong> escolhe época, taxa de aprendizado e checkpoint; <strong>teste</strong> é tocado uma vez por candidato final. Quem escolhe hiperparâmetro olhando o teste transformou o teste em validação e perdeu a estimativa não enviesada.</p>' },
        { tipo: 'takeaway', html: 'Divida por <mark>unidade de vazamento</mark> (hash do grupo), deduplique <mark>antes</mark> e toque o teste uma vez.' }
      ] },

      { rotulo: 'Hiperparâmetros e esquecimento', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>Hiperparâmetros que importam</h3>' +
          '<table><thead><tr><th>Parâmetro</th><th>Faixa de partida (ordem de grandeza)</th><th>Efeito de errar</th></tr></thead><tbody>' +
          '<tr><td>Taxa de aprendizado</td><td>~1e-5 a 2e-5 em full fine-tuning; ~1e-4 a 2e-4 em LoRA</td><td>Alta: esquecimento e instabilidade. Baixa: pouco efeito em poucas épocas</td></tr>' +
          '<tr><td>Épocas</td><td>1 a 3 em datasets de milhares</td><td>Muitas: memoriza, perde generalização</td></tr>' +
          '<tr><td>Tamanho efetivo de lote</td><td>16 a 128 sequências (com acumulação de gradiente)</td><td>Pequeno: gradiente ruidoso; grande demais: poucas atualizações</td></tr>' +
          '<tr><td>Aquecimento e decaimento</td><td>3 a 10% de aquecimento; decaimento cosseno ou linear</td><td>Sem aquecimento, os primeiros passos com Adam desestabilizam</td></tr>' +
          '<tr><td>Comprimento máximo e empacotamento</td><td>O do uso real</td><td>Truncar a saída ensina a não terminar</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>São ordens de grandeza de prática comum, não receita: a taxa ideal depende de modelo, tamanho e dados, e a forma de achá-la é uma varredura pequena de 3 a 5 valores sobre a <strong>validação</strong>. Em LoRA a taxa é maior porque os parâmetros treinados partem de um ponto onde o delta é nulo e precisam andar mais.</p>' +
          '<h3>Overfitting e como lê-lo</h3>' +
          '<p>Em dataset pequeno, o modelo memoriza antes de generalizar. O sinal clássico: perda de treino caindo enquanto a de validação sobe. Exemplo ilustrativo (valores variáveis, não evidência):</p>' +
          '<table><thead><tr><th>Época</th><th>Perda treino</th><th>Perda validação</th><th>Acurácia validação</th></tr></thead><tbody>' +
          '<tr><td>1</td><td>1,10</td><td>1,12</td><td>81%</td></tr>' +
          '<tr><td>2</td><td>0,62</td><td>0,78</td><td>88%</td></tr>' +
          '<tr><td>3</td><td>0,31</td><td>0,91</td><td>87%</td></tr></tbody></table>' +
          '<p>O candidato é o checkpoint da época 2: validação mínima e acurácia máxima. Na época 3 a distância entre treino e validação dobrou e a acurácia já recuou. O laboratório automatiza isso com <code>fit(..., keep_best=True)</code>, que guarda o ponto de menor erro de validação e restaura os pesos dele. Duas ressalvas: com validação pequena o mínimo é ruidoso (use avaliação em intervalos e uma janela de tolerância); e perda e métrica de tarefa podem discordar, caso em que a métrica da tarefa decide.</p>' },
        { tipo: 'escolha', id: 'b2-esc-epoca', titulo: 'Confira: que época vira candidato',
          pergunta: 'Na tabela (valores variáveis, não evidência), perda de treino 0,31, validação 0,91 e acurácia 87% na época 3. Qual checkpoint é o candidato e por quê?',
          opcoes: [
            { id: 'a', texto: 'A época 3: a perda de treino é a menor.', correta: false, porque: 'perda de treino baixa com validação subindo é memorização.' },
            { id: 'b', texto: 'A época 2: validação mínima e acurácia máxima (88%); a época 3 já mostra a distância dobrada.', correta: true, porque: 'a validação escolhe o checkpoint; a perda é alarme e, se discordar da métrica de tarefa, a métrica decide.' },
            { id: 'c', texto: 'A época 1: é a mais estável.', correta: false, porque: 'a acurácia de validação é a menor das três.' }
          ], tutorDepois: 'Escolha de época e checkpoint é papel da validação, nunca do teste.' },
        { tipo: 'texto', html:
          '<h3>Esquecimento catastrófico</h3>' +
          '<p>Ao treinar numa tarefa, os mesmos pesos que sustentavam capacidades antigas são deslocados. O modelo melhora no alvo e piora no que <em>não foi mostrado</em>: instruções gerais, outros idiomas, recusas de segurança, formatos. Vale para qualquer método, e é pior com taxa alta, muitas épocas e dados estreitos. Mitigações, em ordem de custo:</p>' +
          '<ol><li>Taxa menor e menos épocas.</li><li>Misturar dados gerais de reprise ao treino.</li>' +
          '<li>Métodos de baixo posto, que restringem a mudança (bloco 3; o artigo "LoRA Learns Less and Forgets Less" mede esse efeito em escala de LLM).</li>' +
          '<li>Regularização para a referência, como o termo de KL dos métodos de preferência.</li></ol>' +
          '<p>Nenhuma garante. A única defesa operacional é medir: uma <strong>suíte-guarda</strong> com as capacidades que não podem cair, executada contra base e candidato.</p>' },
        { tipo: 'takeaway', html: 'Validação escolhe a época; esquecimento é a regra, e só uma <mark>suíte-guarda</mark> o revela.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>O laboratório faz o esquecimento em miniatura: treina um modelo na tarefa A (o "pré-treino"), adapta à tarefa B com 48 exemplos e compara os dois. A saída abaixo é de execução real (semente 7). Preveja o que acontece com a guarda, a tarefa A.</p>' },
        { tipo: 'rode', id: 'b2-rode', titulo: 'O alvo melhora; e a guarda?', enunciado: 'Rode a demonstração de full fine-tuning e leia as linhas de cada etapa. A barra mostra o erro novo vezes 1.000.',
          prefixo: '$', entrada: 'uv run python -m adapt_lab.cli demo; echo "exit=$?"', unidade: 'erro x1000', terminalTitulo: 'adapt_lab', etapas: etapasGate(),
          prever: { pergunta: 'Depois de adaptar o modelo à tarefa B, o erro em B cai 29%. O que o gate vai dizer sobre a tarefa A, que o modelo já dominava?', opcoes: [
            { id: 'a', texto: 'A tarefa A fica igual: o modelo só aprendeu algo novo.', correta: false, porque: 'os pesos que sustentavam A foram deslocados; sem medir A, ninguém veria.' },
            { id: 'b', texto: 'A tarefa A regride muito e o gate reprova (exit 1).', correta: true, porque: 'o erro em A foi de 0,0008 para 0,0558; o gate transforma "melhorou no alvo" em "quebrou a A".' },
            { id: 'c', texto: 'A tarefa A melhora também, por transferência.', correta: false, porque: 'neste desenho as tarefas competem pelos mesmos pesos.' }
          ] },
          tutorAntes: 'Aperte Enter e abra a etapa "Guarda" depois da "Alvo".',
          tutorDepois: 'O alvo melhorou 29% e a guarda piorou setenta vezes. O erro-base de A é 0,0008, por isso qualquer mudança vira percentual gigante: em produção, combine limite relativo com margem absoluta (bloco 7).',
          callout: 'Você viu um ganho no alvo ser reprovado pela guarda.' },
        { tipo: 'takeaway', html: 'O número que melhora é o que você <mark>mediu</mark>; o que piora é o que você <mark>não mediu</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'ordene', id: 'b2-ordene', titulo: 'Ordene o pipeline de SFT sem vazamento',
          enunciado: 'Ponha os passos na ordem correta e confira.',
          itens: [
            { id: 'treinar', texto: 'Treinar com template e prompt de sistema do uso real, perda só nos tokens do assistente' },
            { id: 'teste', texto: 'Tocar o teste uma única vez: alvo, guardas e baseline otimizado' },
            { id: 'dedup', texto: 'Deduplicar, incluindo quase-duplicatas' },
            { id: 'validar', texto: 'Escolher época e checkpoint pela validação' },
            { id: 'dividir', texto: 'Dividir por unidade de vazamento (hash do grupo)' }
          ], solucao: ['dedup', 'dividir', 'treinar', 'validar', 'teste'],
          dica: 'Deduplique antes de dividir; o teste é a última coisa que se toca.',
          tutorDepois: 'Deduplicar, dividir por grupo, treinar com o template real, escolher checkpoint na validação e só então tocar o teste.' },
        { tipo: 'python', id: 'b2-python', titulo: 'Split estável por hash do grupo', obrigatorio: false,
          enunciado: 'Implemente <code>bucket</code> (SHA-256 do <code>group_id</code>, módulo <code>n</code>; o <code>hash()</code> do Python varia entre execuções), <code>split</code> (0-79 treino, 80-89 validação, 90-99 teste) e <code>preparar</code>, que deduplica pelo texto normalizado <em>antes</em> de dividir.',
          codigo: codigoSplit, testes: testesSplit,
          dica: '<code>int(hashlib.sha256(group_id.encode()).hexdigest(), 16) % n</code>. Em <code>preparar</code>, a chave de deduplicação é <code>" ".join(texto.lower().split())</code>.',
          solucao: solucaoSplit,
          tutorDepois: 'O teste de acrescentar dados novos é o que o hash do grupo garante e um embaralhamento aleatório não garante.',
          callout: 'O split agora é estável entre versões e sem cliente nos dois lados.' },
        { tipo: 'python', id: 'b2-python-z', titulo: 'A melhoria é real ou ruído?', obrigatorio: false,
          enunciado: 'Implemente <code>erro_padrao_dif(p1, p2, n)</code>, a raiz de <code>p1(1-p1)/n + p2(1-p2)/n</code>, e <code>distinguivel</code>, que usa <code>|z| &gt;= 1,96</code>. É a aproximação não pareada; com os mesmos exemplos nos dois modelos, McNemar ou bootstrap pareado é mais sensível (M06 B03).',
          codigo: codigoZ, testes: testesZ,
          dica: '<code>z = (p2 - p1) / erro_padrao_dif(...)</code>, com <code>abs()</code>.',
          solucao: solucaoZ,
          tutorDepois: '84% contra 88% com 200 exemplos dá erro-padrão de ≈ 3,5 pontos: não demonstrado. Com 2.000 exemplos a mesma diferença passa. Se os candidatos são avaliados muitas vezes no mesmo teste, ajuste para múltiplas comparações ou reserve um teste final intocado.',
          callout: 'Você transformou "88 é maior que 84" em uma pergunta com resposta.' },
        { tipo: 'cenario', id: 'b2-cenario', titulo: '97% no teste: comemorar?', obrigatorio: false,
          enunciado: 'Um dataset de tickets tem conversas reabertas em várias linhas. O split foi aleatório por linha e o teste mostra 97% de acerto.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O resultado é excelente demais. O que você faz?', opcoes: [
              { texto: 'Comemorar e promover: 97% é excelente.', vai: 'f-promove', tom: 'ruim', consequencia: 'a mesma entidade em treino e teste faz o modelo memorizar e a métrica mentir.' },
              { texto: 'Aumentar as épocas para chegar a 99%.', vai: 'f-epocas', tom: 'ruim', consequencia: 'mais épocas memorizam mais e deixam a métrica ainda mais enganosa.' },
              { texto: 'Desconfiar de vazamento: deduplicar (incluindo quase-duplicatas) e dividir por hash do ticket ou cliente antes de treinar de novo.', vai: 'refaz', tom: 'ok', consequencia: 'você troca uma métrica otimista por uma que mede generalização.' }
            ] },
            refaz: { texto: 'Refeito o split, o teste cai para 86%. Como você reporta?', opcoes: [
              { texto: 'Só o alvo: 86% contra o baseline simples.', vai: 'f-parcial', tom: 'ruim', consequencia: 'sem baseline otimizado e sem guardas, o relatório continua suspeito.' },
              { texto: 'Quatro linhas: base simples, base otimizado, ajustado curto e ajustado otimizado, com guardas e custo por chamada.', vai: 'f-bom', tom: 'ok', consequencia: 'o ganho (ou a falta dele) fica demonstrado contra a alternativa barata.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'A métrica agora é honesta e o ganho, se existir, está medido contra o prompt otimizado.' },
            'f-promove': { bom: false, texto: 'O modelo vai a produção com um número que não generaliza, e o problema aparece em campo.' },
            'f-epocas': { bom: false, texto: 'A acurácia sobe no papel e cai em produção.' },
            'f-parcial': { bom: false, texto: 'O número é honesto, mas ainda não prova que o ajuste vale mais que o prompt otimizado.' }
          },
          callout: 'Você trocou o 97% por uma métrica sem vazamento e relatou contra o baseline certo.' },
        { tipo: 'takeaway', html: 'Resultado bom demais pede <mark>suspeita de vazamento</mark> antes de comemoração.' }
      ] },

      { rotulo: 'Relatório e fornecedor', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>Avaliar antes e depois, contra o baseline de prompt</h3>' +
          '<p>O relatório honesto de um SFT tem quatro linhas, não duas:</p>' +
          '<table><thead><tr><th>Configuração</th><th>Alvo (teste)</th><th>Guardas</th><th>Custo por chamada</th></tr></thead><tbody>' +
          '<tr><td>Modelo-base, prompt simples</td><td>?</td><td>?</td><td>?</td></tr>' +
          '<tr><td>Modelo-base, prompt otimizado (+ few-shot, + saída estruturada)</td><td>?</td><td>?</td><td>?</td></tr>' +
          '<tr><td>Ajustado, prompt curto</td><td>?</td><td>?</td><td>?</td></tr>' +
          '<tr><td>Ajustado, prompt otimizado (às vezes soma, às vezes piora)</td><td>?</td><td>?</td><td>?</td></tr></tbody></table>' +
          '<p>Sem a segunda linha, qualquer ganho é suspeito. Com 200 exemplos de teste, 84% contra 88% tem erro-padrão da diferença de cerca de <code>√(0,84·0,16/200 + 0,88·0,12/200) ≈ 3,5</code> pontos. Quatro pontos são pouco mais de um erro-padrão: <strong>não é diferença demonstrada</strong>.</p>' +
          '<h3>API gerenciada × auto-hospedado</h3>' +
          '<table><thead><tr><th>Critério</th><th>Fine-tuning via API</th><th>Auto-hospedado (pesos abertos + LoRA)</th></tr></thead><tbody>' +
          '<tr><td>Esforço inicial</td><td>Baixo: sobe JSONL, escolhe poucos hiperparâmetros</td><td>Alto: GPU, biblioteca de treino, avaliação, serving</td></tr>' +
          '<tr><td>Controle</td><td>Baixo: o fornecedor decide algoritmo, base e janela de vida</td><td>Total: você escolhe método, rank, alvos, precisão</td></tr>' +
          '<tr><td>Portabilidade do resultado</td><td>Nenhuma: pesos não exportáveis</td><td>Total: o adapter é um arquivo seu</td></tr>' +
          '<tr><td>Dados</td><td>Saem para o fornecedor (política de retenção a ler)</td><td>Ficam na sua infraestrutura</td></tr>' +
          '<tr><td>Custo em escala</td><td>Inferência de modelo ajustado costuma custar mais que a do base; em algumas ofertas, endpoint dedicado cobrado por hora</td><td>GPU ociosa também custa; ganha com volume alto e estável</td></tr>' +
          '<tr><td>Modelos disponíveis</td><td>Subconjunto escolhido pelo fornecedor; muda</td><td>Qualquer um com licença adequada</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Adapter atual · verificado em 11/10/2026 · revalidar em até 90 dias', html:
          '<p>A documentação da OpenAI descreve três métodos (SFT como padrão, DPO para modelos da família GPT-4.1 em versões de abril de 2025, e fine-tuning por reforço para modelos de raciocínio com avaliadores), com o aviso de que a plataforma não aceita novos usuários. Um levantamento de terceiros de junho de 2026 relata fine-tuning de modelos Claude apenas por meio de AWS Bedrock e Google Vertex (SFT, sem DPO público) e SFT de modelos Gemini na Vertex, sem exportação de pesos em nenhum dos três. Trate os preços desse levantamento como <strong>indicativos</strong> e confirme na cotação do fornecedor.</p>' },
        { tipo: 'escolha', id: 'b2-esc-relatorio', titulo: 'Confira: o número que melhora',
          pergunta: 'Um SFT sobe 9 pontos na tarefa-alvo. O que você exige antes de aceitar?',
          opcoes: [
            { id: 'a', texto: 'Nada: 9 pontos é muito.', correta: false, porque: 'o que piora é o que não foi medido: recusas e idiomas secundários podem ter caído sem alarme.' },
            { id: 'b', texto: 'A lista de guardas escrita antes do primeiro treino, com limites e donos (quem aceita uma regressão?), e a linha do baseline otimizado.', correta: true, porque: 'um gate que o time pode contornar "só dessa vez" sem registro não é gate.' },
            { id: 'c', texto: 'Mais épocas de treino.', correta: false, porque: 'não responde se o ganho é real nem se algo quebrou.' }
          ], tutorDepois: 'Guardas com dono, antes do treino.' },
        { tipo: 'takeaway', html: 'Relatório de <mark>quatro linhas</mark>, estatística que sustenta a diferença e guardas com <mark>dono</mark>.' }
      ] }
    ]
  });
})();
