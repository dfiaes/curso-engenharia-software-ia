/* M10 · Bloco 2: Execução, estado, reducers e roteamento. Fonte: M10.html#b02. LangGraph real é trilha externa; o exercício usa um motor mínimo local. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoFundir = `import operator


def fundir(estado, parcial, reducers):
    """Funde o pedaco devolvido por um no no estado. Devolve um estado novo.
    reducers: {campo: funcao(atual, novo)}. Campo sem reducer: sobrescreve."""
    novo = dict(estado)
    for campo, valor in parcial.items():
        novo[campo] = valor  # ainda sobrescreve tudo: use o reducer do campo
    return novo


def no_seguro(no):
    """Envolve um no: excecao vira dado no campo erros, nunca mata o grafo."""
    def envelope(estado):
        return no(estado)
    return envelope


def resultado_valido(estado, limite):
    """O consolidador decide: a fracao de falhas passa do limite?"""
    return True
`;
  var solucaoFundir = `import operator


def fundir(estado, parcial, reducers):
    novo = dict(estado)
    for campo, valor in parcial.items():
        if campo in reducers:
            novo[campo] = reducers[campo](novo[campo], valor)
        else:
            novo[campo] = valor
    return novo


def no_seguro(no):
    def envelope(estado):
        try:
            return no(estado)
        except Exception as exc:
            return {"erros": [type(exc).__name__ + ": " + str(exc)]}
    return envelope


def resultado_valido(estado, limite):
    total = len(estado["erros"]) + len(estado["analisados"])
    if total == 0:
        return True
    return len(estado["erros"]) / total <= limite
`;
  var testesFundir = `import operator

INICIAL = {"analisados": [], "erros": [], "custo": 0.0, "fase": "parse"}
SOMA = {"analisados": operator.add, "erros": operator.add, "custo": operator.add}


def test_default_sobrescreve_e_perde_trabalho():
    e = fundir(INICIAL, {"analisados": ["a.cs"]}, {})
    e = fundir(e, {"analisados": ["b.cs"]}, {})
    assert e["analisados"] == ["b.cs"]


def test_add_concatena_nos_paralelos():
    e = INICIAL
    for lote in (["a.cs"], ["b.cs", "c.cs"], ["d.cs"]):
        e = fundir(e, {"analisados": lote}, SOMA)
    assert e["analisados"] == ["a.cs", "b.cs", "c.cs", "d.cs"]


def test_custo_soma_e_fase_sobrescreve():
    e = fundir(INICIAL, {"custo": 0.5, "fase": "analise"}, SOMA)
    e = fundir(e, {"custo": 0.25}, SOMA)
    assert e["custo"] == 0.75 and e["fase"] == "analise"


def test_fundir_nao_muta_o_estado_original():
    fundir(INICIAL, {"analisados": ["x"]}, SOMA)
    assert INICIAL["analisados"] == []


def test_no_seguro_converte_excecao_em_erro():
    def ruim(estado):
        raise ValueError("encoding estranho")
    assert no_seguro(ruim)({}) == {"erros": ["ValueError: encoding estranho"]}


def test_no_seguro_deixa_resultado_bom_passar():
    assert no_seguro(lambda estado: {"custo": 1.0})({}) == {"custo": 1.0}


def test_consolidador_tolera_ou_invalida():
    tolera = {"analisados": ["x"] * 397, "erros": ["e"] * 3}
    quebra = {"analisados": ["x"] * 60, "erros": ["e"] * 40}
    assert resultado_valido(tolera, 0.05) is True
    assert resultado_valido(quebra, 0.05) is False
`;

  var codigoGrafo = [
    'g = StateGraph(EstadoIngestao)',
    'g.add_node("clone", no_clone)',
    'g.add_node("parse", no_parse)',
    'g.add_node("indexar", no_indexar)',
    'g.add_node("grafo", no_construir_grafo)',
    'g.add_node("analisar_arquivo", no_analisar_arquivo)',
    'g.add_node("consolidar", no_consolidar)',
    'g.add_node("revisao_humana", no_revisao_humana)      # bloco 4',
    'g.add_node("relatorio", no_relatorio)',
    '',
    'g.add_edge(START, "clone")',
    'g.add_edge("clone", "parse")',
    'g.add_edge("parse", "indexar")',
    'g.add_edge("indexar", "grafo")',
    '',
    '# fan-out: um "analisar_arquivo" por arquivo, em paralelo',
    'g.add_conditional_edges("grafo", espalhar_arquivos, ["analisar_arquivo"])',
    '# fan-in: quando TODOS terminarem, segue para consolidar',
    'g.add_edge("analisar_arquivo", "consolidar")',
    '',
    'g.add_conditional_edges("consolidar", decidir_revisao, ["revisao_humana", "relatorio"])',
    'g.add_edge("revisao_humana", "relatorio")',
    'g.add_edge("relatorio", END)'].join('\n');

  TrilhaAula.registrar({
    id: 'm10-b2',
    titulo: 'Execução: estado, reducers e roteamento',
    minutos: 35,
    resumo: 'O pipeline de ingestão roda por horas e falha no meio, sempre. O grafo de execução descreve o estado tipado, os nós e o roteamento, e o reducer de cada campo decide se o trabalho paralelo se soma ou se perde em silêncio.',
    objetivo: 'Declarar um estado com reducers explícitos, escolher entre aresta fixa, condicional, Command e Send, e tratar falha parcial como dado do estado.',
    revisao: [
      { id: 'm10b2-reducer', pergunta: 'Dois nós paralelos devolvem {"analisados": [...]} com o reducer padrão. O que acontece?',
        opcoes: [
          opc('a', 'Um sobrescreve o outro e parte do trabalho se perde, sem erro nem log', true, 'o default sobrescreve; todo campo escrito por mais de um nó precisa de reducer explícito (operator.add).'),
          opc('b', 'As listas são concatenadas automaticamente', false, 'só com Annotated[list, operator.add].'),
          opc('c', 'O grafo trava por deadlock', false, 'o dano é silencioso, não um travamento.')] },
      { id: 'm10b2-mec', pergunta: 'Analisar 400 arquivos em paralelo, cada um com o próprio estado, é feito com…',
        opcoes: [
          opc('a', 'Send, que dispara N cópias de um nó (map-reduce)', true, 'add_edge é sequência fixa; conditional_edges escolhe um destino; Command atualiza estado e escolhe o destino.'),
          opc('b', 'add_edge repetido 400 vezes', false, 'aresta fixa não cria N execuções com estados próprios.'),
          opc('c', 'Command(update=..., goto=...)', false, 'Command é decisão de rota dentro do nó.')] },
      { id: 'm10b2-falha', pergunta: '3 dos 400 arquivos falham. Qual é o desenho padrão do curso?',
        opcoes: [
          opc('a', 'O nó captura a exceção e devolve o erro no campo erros (reducer de acúmulo); o consolidador decide se o volume invalida o resultado', true, 'exceção que sobe mata o grafo inteiro por causa de um arquivo.'),
          opc('b', 'Deixar a exceção subir', false, 'um arquivo com encoding estranho derrubaria tudo.'),
          opc('c', 'Ignorar sem registrar', false, 'perde-se a informação de que o resultado é parcial.')] },
      { id: 'm10b2-conc', pergunta: 'Qual é o risco de remover o limite de concorrência de um Send com 400 chamadas ao provedor?',
        opcoes: [
          opc('a', '429 em cascata; configure o limite do grafo e/ou um semáforo dentro do nó', true, 'concorrência real traz de volta as regras do M02 e do M05.'),
          opc('b', 'Nenhum: o provedor absorve qualquer carga', false, 'rate limit existe.'),
          opc('c', 'O reducer deixa de funcionar', false, 'o reducer independe do limite.')] },
      { id: 'm10b2-nos', pergunta: 'Por que os nós são funções comuns, tipadas, sem herdar de nada?',
        opcoes: [
          opc('a', 'Dá para testá-los isolados com pytest: o grafo testa a orquestração, os nós testam a lógica', true, 'mesma disciplina do M02 bloco 6.'),
          opc('b', 'Porque o runtime exige funções síncronas', false, 'os nós do exemplo são async def.'),
          opc('c', 'Para evitar tipos no estado', false, 'o estado é tipado e declarado por você.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>No M08 você escreveu o loop do agente à mão, e foi a coisa certa: agora você sabe o que um framework faria por você. O ADR-0003 registrou o gatilho de revisão: <em>execução que precisa sobreviver a restart</em>. O pipeline de ingestão do Capstone (clonar, parsear, indexar, construir grafo, analisar, revisar, relatar) roda por horas sobre milhares de arquivos e <strong>falha no meio, sempre</strong>: rede, rate limit, OOM, deploy. Reprocessar do zero custa dinheiro real em chamadas já pagas.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'O que é o LangGraph', html:
          '<p>Biblioteca Python (do time do LangChain, usável sem ele) para descrever computação como <strong>grafo de estados</strong>: você declara um objeto de estado tipado, escreve nós como funções que recebem o estado e devolvem um pedaço dele, e liga os nós com arestas fixas ou condicionais. O runtime executa o grafo e <strong>persiste um snapshot do estado a cada passo</strong>, o que dá retomada após falha, inspeção do histórico e pontos de pausa para intervenção humana.</p>' +
          '<p>Imports centrais: <code>from langgraph.graph import StateGraph, START, END</code>, <code>from langgraph.types import Command, Send</code>, <code>from langgraph.checkpoint.postgres import PostgresSaver</code>. A API evoluiu bastante entre versões: <strong>pinne a versão, leia a doc da SUA versão</strong> e trate a atualização como mudança de código, com eval antes (M06). Verificado em 14/09/2026.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Padrão conhecido: orquestrador durável, declarativo', html:
          '<p>Função orquestradora, atividades como nós e log de eventos permitindo retomar depois de crash, com espera por evento externo virando pausa retomável (bloco 4). A restrição central reaparece: <strong>o código pode ser reexecutado, então precisa ser determinístico e idempotente</strong> (bloco 3). Nada de relógio ou aleatoriedade dentro de nó.</p>' },
        { tipo: 'texto', html:
          '<h3>O estado é o coração, e o reducer é a decisão sutil</h3>' +
          '<p>No loop do M08 o estado era uma lista de mensagens. Aqui é um <strong>objeto tipado declarado por você</strong>. Cada nó devolve um <em>pedaço</em> do estado, e o runtime o funde no estado global. Como funde é definido pelo <strong>reducer</strong> de cada campo.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'class EstadoIngestao(TypedDict):',
          '    # --- entrada (não muda durante a execução) ---',
          '    repo_url: str',
          '    tenant_id: int',
          '    repo_id: int',
          '',
          '    # --- reducer DEFAULT: sobrescreve. Valor único e mutável. ---',
          '    fase: Literal["clone", "parse", "index", "grafo", "analise", "revisao", "relatorio"]',
          '    caminho_local: str',
          '    total_arquivos: int',
          '',
          '    # --- reducer de ACÚMULO: cada nó ADICIONA à lista, não substitui ---',
          '    analisados: Annotated[list[ArquivoAnalisado], operator.add]',
          '    erros: Annotated[list[str], operator.add]',
          '',
          '    # --- soma números vindos de nós paralelos ---',
          '    custo_total_usd: Annotated[float, operator.add]',
          '',
          '    # --- saída ---',
          '    relatorio_md: str',
          '    aprovado_por_humano: bool'].join('\n') },
        { tipo: 'callout', tom: 'danger', titulo: 'O reducer padrão sobrescreve: causa nº 1 de bug em execução paralela', html:
          '<p>Se dois nós rodam em paralelo e ambos devolvem <code>{"analisados": [...]}</code> com o reducer padrão, <strong>um sobrescreve o outro silenciosamente</strong> e você perde metade do trabalho, sem erro e sem log. Com <code>Annotated[list[...], operator.add]</code>, os dois são concatenados. Regra: <em>todo campo que mais de um nó escreve precisa de reducer explícito</em>. É o raciocínio de incremento atômico contra ler-somar-gravar (M02 bloco 4), e falha do mesmo jeito: perde atualização, de forma não determinística.</p>' +
          '<p>Algumas versões do framework acusam erro em atualização concorrente sem reducer; em código próprio de merge o dano continua silencioso. Confira a doc da sua versão.</p>' },
        { tipo: 'takeaway', html: 'Todo campo escrito por mais de um nó precisa de <mark>reducer explícito</mark>; o padrão <mark>sobrescreve</mark> em silêncio.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'b2-rode', titulo: 'Três nós paralelos, três reducers', enunciado: 'Cada nó paralelo (<code>Send</code>) analisa 4 arquivos e devolve <code>{"analisados": [...]}</code>. Faça a previsão, rode e clique em cada etapa.',
          prefixo: '$', entrada: 'python3 reducer_paralelo.py', unidade: 'ms', terminalTitulo: '3 nós × 4 arquivos',
          prever: { pergunta: 'Reducer padrão, 3 nós com 4 arquivos cada. Quantos itens sobram em estado["analisados"]?', opcoes: [
            { id: 'a', texto: '12: o runtime concatena sozinho', correta: false, porque: 'concatenar exige operator.add explícito.' },
            { id: 'b', texto: '4: só o último nó que escreve vence', correta: true, porque: 'o default sobrescreve; os outros 8 arquivos somem sem erro.' },
            { id: 'c', texto: '0: o conflito anula tudo', correta: false, porque: 'não há conflito detectado, só sobrescrita.' }
          ] },
          etapas: [
            { id: 'padrao', nome: 'Reducer padrão', descricao: 'Sobrescreve', tom: 'dns', ms: 1, linhas: [
              L('info', 'nó 1 devolve 4, nó 2 devolve 4, nó 3 devolve 4'),
              L('out', 'estado["analisados"]: 4 itens (a3_1.cs ... a3_4.cs)'),
              L('out', 'PERDA SILENCIOSA: 8 arquivo(s) sumiram do estado, sem erro'),
              L('hint', 'último que escreve vence')] },
            { id: 'add', nome: 'operator.add', descricao: 'Concatena', tom: 'request', ms: 1, linhas: [
              L('info', 'mesmos três nós, campo Annotated[list, operator.add]'),
              L('out', 'estado["analisados"]: 12 itens, 12 distintos'),
              L('hint', 'estado completo e sem duplicatas')] },
            { id: 'dup', nome: 'add com arquivo comum', descricao: 'Todos devolvem também comum.cs', tom: 'response', ms: 1, linhas: [
              L('info', 'cada nó devolve seus 4 arquivos mais comum.cs'),
              L('out', 'estado["analisados"]: 15 itens, 13 distintos'),
              L('out', 'nada se perdeu, mas 2 item(ns) ficaram repetidos: contagem e custo inflados'),
              L('hint', 'se a repetição importa, use um reducer de união')] }
          ],
          tutorDepois: 'Sem reducer o paralelismo perde trabalho em silêncio; com <code>operator.add</code> nada se perde, mas duplicatas se acumulam. A decisão de como fundir é do campo, não do nó.',
          callout: 'Você viu a perda silenciosa e as duas formas de fundir.' },
        { tipo: 'texto', html:
          '<h3>Nós: funções normais, tipadas, testáveis</h3>' +
          '<p>Cada nó é uma função quase pura: recebe o estado e devolve o pedaço que mudou. Nós são <code>async def</code> comuns, sem herdar de nada, então você os testa isolados com pytest, sem subir o grafo (M02 bloco 6). O grafo testa a <em>orquestração</em>; os nós testam a <em>lógica</em>.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'async def no_clone(estado: EstadoIngestao) -> dict[str, object]:',
          '    """Clona o repositório. Idempotente: se já existe, reaproveita."""',
          '    caminho = await clonar(estado["repo_url"], estado["repo_id"])',
          '    arquivos = listar_arquivos(caminho)            # o filtro do M07 bloco 8',
          '    return {"caminho_local": caminho, "total_arquivos": len(arquivos), "fase": "parse"}',
          '',
          'async def no_parse(estado: EstadoIngestao) -> dict[str, object]:',
          '    """Parse determinístico com tree-sitter. SEM LLM: regra de ouro (bloco 5)."""',
          '    simbolos = await parsear_arquivo.em_lote(estado["caminho_local"])',
          '    return {"fase": "index", "total_simbolos": len(simbolos)}',
          '',
          'async def no_analisar_arquivo(estado: EstadoIngestao) -> dict[str, object]:',
          '    """Analisa UM arquivo (recebe o caminho via Send)."""',
          '    resultado = await analisar(estado["arquivo"])          # o extrator do M05',
          '    return {',
          '        "analisados": [ArquivoAnalisado(**resultado.model_dump())],  # reducer soma',
          '        "custo_total_usd": resultado.custo_usd,                      # reducer soma',
          '    }'].join('\n') },
        { tipo: 'texto', html:
          '<h3>Roteamento: quatro mecanismos</h3>' +
          '<p>As funções <code>decidir_revisao</code> (devolve o nome do próximo nó) e <code>espalhar_arquivos</code> (devolve uma lista de <code>Send</code>) alimentam o grafo abaixo. Complete as duas arestas que dependem delas.</p>' },
        { tipo: 'complete', id: 'b2-rotas', titulo: 'Fan-out, fan-in e decisão', obrigatorio: false,
          enunciado: 'Escolha a função que alimenta cada aresta condicional.',
          linguagem: 'python',
          partes: [
            'g.add_edge("indexar", "grafo")\n\n# um "analisar_arquivo" por arquivo, em paralelo (map-reduce)\ng.add_conditional_edges("grafo", ',
            { lacuna: 'fan', opcoes: ['espalhar_arquivos', 'decidir_revisao', 'no_relatorio'], correta: 'espalhar_arquivos' },
            ', ["analisar_arquivo"])\n# fan-in: quando TODOS terminarem, segue para consolidar\ng.add_edge("analisar_arquivo", "consolidar")\n\n# ramificação por regra determinística sobre o estado\ng.add_conditional_edges("consolidar", ',
            { lacuna: 'dec', opcoes: ['decidir_revisao', 'espalhar_arquivos', 'no_clone'], correta: 'decidir_revisao' },
            ', ["revisao_humana", "relatorio"])'
          ],
          explicacao: '<code>espalhar_arquivos</code> devolve <code>[Send(...)]</code>: uma execução do mesmo nó por arquivo, cada uma com estado próprio. <code>decidir_revisao</code> devolve o nome do próximo nó pela regra "há achado crítico de risco alto?".' },
        { tipo: 'codigo', linguagem: 'python', texto: codigoGrafo },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Mecanismo</th><th>O que faz</th><th>Quando usar</th></tr></thead><tbody>' +
          '<tr><td><code>add_edge(a, b)</code></td><td>sempre de A para B</td><td>sequência fixa</td></tr>' +
          '<tr><td><code>add_conditional_edges(a, f, [...])</code></td><td>uma função decide o próximo nó pelo estado</td><td>ramificação por regra <strong>determinística</strong> (ou por decisão do LLM guardada no estado)</td></tr>' +
          '<tr><td><code>Command(update=..., goto=...)</code></td><td>o nó atualiza o estado <em>e</em> declara para onde ir, num retorno só</td><td>quando a decisão de rota nasce dentro do nó, sem recalcular no roteador</td></tr>' +
          '<tr><td><code>Send("no", estado_proprio)</code></td><td>dispara N cópias de um nó, cada uma com o próprio estado</td><td><strong>map-reduce</strong>: analisar 400 arquivos em paralelo</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Concorrência de verdade, com as regras do M02', html:
          '<p><code>Send</code> dá paralelismo real e traz de volta o M02 bloco 4 e o M05 bloco 4: <strong>limite de concorrência</strong> (400 chamadas simultâneas ao provedor dão 429 em cascata; configure o limite do grafo e/ou um semáforo dentro do nó), <strong>reducers de acúmulo</strong> em todo campo que os nós paralelos escrevem e <strong>falha parcial</strong>: o que acontece se 3 dos 400 falharem?</p>' +
          '<p>A resposta padrão do curso: o nó captura a exceção, devolve o erro no campo <code>erros</code> (com reducer de acúmulo) e a execução continua; o consolidador decide se o volume de falhas invalida o resultado. Deixar a exceção subir mata o grafo inteiro por causa de um arquivo com encoding estranho.</p>' },
        { tipo: 'takeaway', html: 'O grafo testa a <mark>orquestração</mark>; <mark>Send</mark> paraleliza, e o <mark>limite de concorrência</mark> protege o provedor.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b2-python', titulo: 'Motor mínimo de reducers', obrigatorio: false,
          enunciado: 'Implemente <code>fundir(estado, parcial, reducers)</code> (sem mutar o estado original), <code>no_seguro(no)</code> (exceção vira <code>{"erros": ["Tipo: mensagem"]}</code>) e <code>resultado_valido(estado, limite)</code> (fração de erros sobre o total não passa do limite).',
          codigo: codigoFundir, testes: testesFundir,
          dica: 'Em <code>fundir</code>: se o campo está em <code>reducers</code>, aplique <code>reducers[campo](novo[campo], valor)</code>; senão atribua. Em <code>no_seguro</code>: <code>try/except Exception</code> devolvendo a lista de erros. Total = erros + analisados; total zero é válido.',
          solucao: solucaoFundir,
          tutorDepois: 'O teste "default sobrescreve" é o controle negativo: ele documenta o comportamento perigoso que o reducer evita.',
          callout: 'Reducer, nó seguro e consolidador passaram nos testes.' },
        { tipo: 'cenario', id: 'b2-cenario', titulo: '3 de 400 arquivos falham', obrigatorio: false,
          enunciado: 'A ingestão dispara 400 análises com <code>Send</code>. Três arquivos têm encoding estranho. Decida o desenho.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O nó <code>analisar_arquivo</code> recebe um arquivo ilegível. O que ele faz?', opcoes: [
              { texto: 'Deixa a exceção subir.', vai: 'f-morte', tom: 'ruim', consequencia: 'o grafo inteiro morre por causa de um arquivo.' },
              { texto: 'Captura, devolve o erro no campo <code>erros</code> (reducer de acúmulo) e segue.', vai: 'consolida', tom: 'ok', consequencia: 'a execução continua e a falha vira dado.' },
              { texto: 'Captura e ignora sem registrar.', vai: 'f-silencio', tom: 'ruim', consequencia: 'ninguém sabe que o resultado é parcial.' }
            ] },
            consolida: { texto: 'O consolidador recebe 397 análises e 3 erros. Qual a regra?', opcoes: [
              { texto: 'Aceitar sempre: foram só 3.', vai: 'f-cego', tom: 'ruim', consequencia: 'com 40 em 400 o relatório sairia igualmente "válido".' },
              { texto: 'Comparar a fração de falhas com um limite explícito e registrar os arquivos que faltaram.', vai: 'f-bom', tom: 'ok', consequencia: 'tolerar 3 em 400 e rejeitar 40 em 400 vira decisão declarada.' },
              { texto: 'Reprocessar os 400 do zero.', vai: 'f-caro', tom: 'ruim', consequencia: 'repete chamadas já pagas.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Falha parcial vira dado, e o consolidador decide com um limite que você escreveu antes do incidente.' },
            'f-morte': { bom: false, texto: 'Um arquivo derrubou a ingestão de horas.' },
            'f-silencio': { bom: false, texto: 'O relatório saiu sem 3 arquivos e ninguém soube.' },
            'f-cego': { bom: false, texto: 'O limite implícito é "qualquer coisa": o relatório incompleto passa.' },
            'f-caro': { bom: false, texto: 'A conta de chamadas dobrou por 3 arquivos ruins.' }
          },
          callout: 'Você tratou falha parcial como dado e decidiu o limite no consolidador.' },
        { tipo: 'complete', id: 'b2-estado', titulo: 'Reducers do estado', obrigatorio: false,
          enunciado: 'Escolha o tipo de cada campo do estado, sabendo que os nós de análise rodam em paralelo.',
          linguagem: 'python',
          partes: [
            'class EstadoIngestao(TypedDict):\n    fase: str\n    analisados: ',
            { lacuna: 'an', opcoes: ['list[ArquivoAnalisado]', 'Annotated[list[ArquivoAnalisado], operator.add]', 'Annotated[list[ArquivoAnalisado], max]'], correta: 'Annotated[list[ArquivoAnalisado], operator.add]' },
            '\n    erros: ',
            { lacuna: 'er', opcoes: ['str', 'Annotated[list[str], operator.add]', 'list[str]'], correta: 'Annotated[list[str], operator.add]' },
            '\n    custo_total_usd: ',
            { lacuna: 'cu', opcoes: ['float', 'Annotated[float, operator.add]', 'Annotated[float, operator.mul]'], correta: 'Annotated[float, operator.add]' }
          ],
          explicacao: '<code>fase</code> é valor único e mutável, então o default serve. Os três campos restantes são escritos por vários nós paralelos: lista e custo se acumulam.' },
        { tipo: 'escolha', id: 'b2-esc-reducer', titulo: 'Confira: o reducer',
          pergunta: 'Dois nós paralelos devolvem <code>{"analisados": [...]}</code> para o mesmo campo, com o reducer padrão. Qual é o risco?',
          opcoes: [
            { id: 'a', texto: 'Um valor sobrescreve o outro e parte do trabalho se perde, sem erro nem log; o conserto é reducer explícito, como <code>operator.add</code>.', correta: true, porque: 'é o mesmo raciocínio de ler-somar-gravar sem atomicidade: perde atualização de forma não determinística.' },
            { id: 'b', texto: 'Os dois são concatenados automaticamente.', correta: false, porque: 'só com reducer de acúmulo declarado.' },
            { id: 'c', texto: 'O grafo trava com deadlock e precisa de um semáforo.', correta: false, porque: 'o problema é perda silenciosa, não travamento.' },
            { id: 'd', texto: 'Só existe com <code>Command</code>, nunca com <code>Send</code>.', correta: false, porque: 'o fan-out por Send é justamente o caso típico.' }
          ], tutorDepois: 'Sintoma de campo: "resultados de nós paralelos somem; só o último aparece". Conserto: Annotated[list[...], operator.add] em todo campo que mais de um nó escreve.' },
        { tipo: 'escolha', id: 'b2-esc-topologia', titulo: 'Confira: topologia primeiro',
          pergunta: 'Você vai implementar o pipeline com 8 nós. Qual a ordem de trabalho que o bloco recomenda?',
          opcoes: [
            { id: 'a', texto: 'Escrever toda a lógica real e só depois ligar as arestas.', correta: false, porque: 'um erro de roteamento se esconde atrás de lógica complexa.' },
            { id: 'b', texto: 'Desenhar o diagrama, validar a topologia com nós "burros" e só então ligar a lógica real, testando reducers e tratando erro como campo do estado.', correta: true, porque: 'a topologia é validada primeiro; custo acumulado no fan-out ganha teste do reducer; erro vira dado, nunca exceção que mata o grafo.' },
            { id: 'c', texto: 'Ligar o LLM em todos os nós para o modelo decidir as rotas.', correta: false, porque: 'roteamento por regra determinística é o padrão.' }
          ], tutorDepois: 'Leitura aplicada do laboratório: diagrama comparado com o construído, e a falha parcial provocada de propósito.' },
        { tipo: 'takeaway', html: 'Falha parcial é <mark>dado do estado</mark>, não exceção; o <mark>consolidador</mark> decide pelo volume.' }
      ] }
    ]
  });
})();
