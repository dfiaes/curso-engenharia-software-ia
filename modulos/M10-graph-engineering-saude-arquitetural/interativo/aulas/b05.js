/* M10 · Bloco 5: Modelagem do grafo de conhecimento e extração determinística. Fonte: M10.html#b05. O exercício usa ast da stdlib; tree-sitter e networkx são trilha externa. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoAst = `import ast


def extrair(fonte):
    """Extracao deterministica sem LLM, com ast da stdlib.
    Devolve {"chamadas": [(de, para, linha)], "nao_resolvidos": [linha]}.
    - chamada a Name definido no proprio arquivo: aresta CHAMA com a linha
    - chamada a Name nao definido (builtin, externo): ignora
    - qualquer outra forma (obj.metodo(), f()()): nao resolvido (candidato ao LLM)
    Considere so funcoes de nivel superior."""
    arvore = ast.parse(fonte)
    chamadas, nao_resolvidos = [], []
    # percorra arvore.body, depois ast.walk em cada FunctionDef
    return {"chamadas": sorted(chamadas), "nao_resolvidos": sorted(nao_resolvidos)}
`;
  var solucaoAst = `import ast


def extrair(fonte):
    arvore = ast.parse(fonte)
    definidos = {n.name for n in arvore.body if isinstance(n, ast.FunctionDef)}
    chamadas, nao_resolvidos = [], []
    for fn in arvore.body:
        if not isinstance(fn, ast.FunctionDef):
            continue
        for no in ast.walk(fn):
            if not isinstance(no, ast.Call):
                continue
            alvo = no.func
            if isinstance(alvo, ast.Name):
                if alvo.id in definidos:
                    chamadas.append((fn.name, alvo.id, no.lineno))
            else:
                nao_resolvidos.append(no.lineno)
    return {"chamadas": sorted(chamadas), "nao_resolvidos": sorted(nao_resolvidos)}
`;
  var testesAst = `FONTE = "\\n".join([
    "def calcular(x):",
    "    return juros(x) + imposto(x)",
    "def juros(x):",
    "    return arredonda(x * 0.1)",
    "def imposto(x):",
    "    return getattr(x, 'taxa')()",
    "def arredonda(x):",
    "    log.info('ok')",
    "    return round(x, 2)",
])


def test_chamadas_resolvidas_com_linha():
    r = extrair(FONTE)
    assert r["chamadas"] == [("calcular", "imposto", 2), ("calcular", "juros", 2), ("juros", "arredonda", 4)]


def test_nao_resolvidos_viram_candidatos_ao_llm():
    assert extrair(FONTE)["nao_resolvidos"] == [6, 8]


def test_builtin_nao_gera_aresta():
    r = extrair(FONTE)
    assert all(para != "round" for _, para, _ in r["chamadas"])


def test_arquivo_sem_chamadas():
    assert extrair("def a():\\n    return 1\\n") == {"chamadas": [], "nao_resolvidos": []}


def test_reproduzivel():
    assert extrair(FONTE) == extrair(FONTE)
`;

  var codigoMetricas = `def instabilidade(arestas, componente_de):
    """arestas: (u, v) com u dependendo de v. componente_de: {no: componente}.
    I = Ce / (Ca + Ce) por componente. Aresta dentro do mesmo componente nao conta.
    So aparecem componentes com alguma dependencia externa."""
    return {}


def tem_ciclo(arestas, componente_de):
    """Ha ciclo de dependencia entre componentes?"""
    return False
`;
  var solucaoMetricas = `def instabilidade(arestas, componente_de):
    ca, ce = {}, {}
    for u, v in arestas:
        cu, cv = componente_de[u], componente_de[v]
        if cu != cv:
            ce[cu] = ce.get(cu, 0) + 1
            ca[cv] = ca.get(cv, 0) + 1
    return {c: ce.get(c, 0) / (ca.get(c, 0) + ce.get(c, 0)) for c in set(ce) | set(ca)}


def tem_ciclo(arestas, componente_de):
    deps = {}
    for u, v in arestas:
        cu, cv = componente_de[u], componente_de[v]
        if cu != cv:
            deps.setdefault(cu, set()).add(cv)
    estado = {}

    def visita(c):
        estado[c] = 1
        for d in deps.get(c, ()):
            if estado.get(d) == 1:
                return True
            if d not in estado and visita(d):
                return True
        estado[c] = 2
        return False

    return any(c not in estado and visita(c) for c in list(deps))
`;
  var testesMetricas = `COMP = {"ui.a": "UI", "srv.b": "Servico", "srv.d": "Servico", "base.c": "Base"}
ARESTAS = [("ui.a", "srv.b"), ("ui.a", "base.c"), ("srv.b", "base.c"), ("srv.d", "base.c"), ("srv.b", "srv.d")]


def test_instabilidade_por_componente():
    i = instabilidade(ARESTAS, COMP)
    assert i["UI"] == 1.0 and i["Base"] == 0.0
    assert abs(i["Servico"] - 2 / 3) < 1e-9


def test_aresta_interna_nao_conta():
    i = instabilidade([("srv.b", "srv.d")], COMP)
    assert i == {}


def test_sem_ciclo_no_desenho_saudavel():
    assert tem_ciclo(ARESTAS, COMP) is False


def test_ciclo_entre_componentes():
    assert tem_ciclo(ARESTAS + [("base.c", "ui.a")], COMP) is True


def test_ciclo_longo():
    comp = {"a": "A", "b": "B", "c": "C"}
    assert tem_ciclo([("a", "b"), ("b", "c"), ("c", "a")], comp) is True
`;

  TrilhaAula.registrar({
    id: 'm10-b5',
    titulo: 'Modelagem do grafo e extração determinística',
    minutos: 45,
    resumo: 'O que vira nó, aresta e propriedade determina o resultado, e quem extrai, código ou LLM, determina o custo. Modele a partir das perguntas; deixe o parser fazer cerca de 95% do grafo; meça a saúde arquitetural com grau de vértice.',
    objetivo: 'Modelar a ontologia mínima a partir das perguntas, extrair chamadas com parser, declarar confiança e calcular instabilidade e ciclos por componente.',
    revisao: [
      { id: 'm10b5-morto', pergunta: 'Por que o esquema do Cartógrafo precisa do tipo de nó EntryPoint?',
        opcoes: [
          opc('a', 'Código morto são os métodos não alcançáveis a partir de algum entry point; sem esse nó não há ponto de partida', true, 'é o exemplo de "modele a partir da pergunta". O resultado é candidato, nunca veredito.'),
          opc('b', 'O networkx exige um nó de entrada', false, 'não exige.'),
          opc('c', 'Para o LLM saber qual arquivo ler primeiro', false, 'nada a ver com leitura de arquivos.')] },
      { id: 'm10b5-ouro', pergunta: 'Quem extrai as chamadas entre métodos do código do cliente?',
        opcoes: [
          opc('a', 'O parser (AST/tree-sitter): custo ~zero e reprodutível; o LLM só desambigua não resolvidos, rotula módulos e resume comunidades', true, '95% do grafo sai do parser: o que é determinístico fica determinístico.'),
          opc('b', 'Um LLM por arquivo, com temperatura 0', false, 'temperatura 0 não garante determinismo, e é o item mais caro do pipeline.'),
          opc('c', 'Embeddings dos métodos', false, 'não extraem relações.')] },
      { id: 'm10b5-regra', pergunta: 'Qual a pergunta de corte para decidir se um tipo de nó entra no esquema?',
        opcoes: [
          opc('a', 'Que pergunta do usuário deixa de ser respondível se eu remover este tipo de nó?', true, 'sem resposta, remova. Comece com o mínimo e adicione quando uma pergunta real exigir.'),
          opc('b', 'Esse conceito existe no domínio?', false, 'é o erro clássico: modelar o mundo em vez da consulta.'),
          opc('c', 'O LLM consegue extraí-lo?', false, 'a decisão é de consulta, não de extração.')] },
      { id: 'm10b5-i', pergunta: 'O que mede a instabilidade I = Ce / (Ca + Ce)?',
        opcoes: [
          opc('a', 'A facilidade de mudar o componente (0 estável, 1 instável), não defeito; denuncia seta na direção errada e ciclos', true, 'use tendência, declare a fronteira usada e não cobre como meta (Goodhart).'),
          opc('b', 'A taxa de bugs do componente', false, 'não mede defeito.'),
          opc('c', 'A cobertura de testes', false, 'não vem do grafo.')] },
      { id: 'm10b5-conf', pergunta: 'Por que USA_POR_REFLEXAO é declarado de baixa confiança?',
        opcoes: [
          opc('a', 'Reflexão, DI por convenção e chamada por string são os casos que o parser não resolve por completo; o produto deve dizer isso em vez de fingir cobertura total', true, 'confiança é propriedade do dado e deve aparecer na resposta.'),
          opc('b', 'Porque o LLM sempre erra reflexão', false, 'a razão é o limite do parser, não do LLM.'),
          opc('c', 'Para economizar armazenamento', false, 'não é questão de espaço.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Aqui começa o grafo de conhecimento, e a primeira decisão é a que mais determina o resultado: <strong>o que vira nó, o que vira aresta e o que vira propriedade</strong>. Modelagem excessiva produz um grafo bonito que ninguém consulta; escassa produz um que não responde as perguntas. A segunda decisão é de custo: <strong>quem extrai, código ou LLM?</strong></p>' +
          '<h3>Ontologia mínima viável</h3>' +
          '<p>Regra que organiza tudo: <strong>modele a partir das perguntas, não do domínio</strong>. O esquema é a menor estrutura que suporta as três perguntas reescritas no bloco 1.</p>' +
          '<ul><li><strong>Nó</strong> é o que você quer contar, agrupar ou usar como ponto de partida. Se nunca vai perguntar "quantos X?" nem "partindo de X…", X provavelmente é propriedade.</li>' +
          '<li><strong>Aresta</strong> é o que você quer percorrer. "O método está no arquivo Y" pode ser propriedade; "o método chama o método Z" tem que ser aresta.</li>' +
          '<li><strong>Propriedade</strong> é o resto, e é barata: adicionar depois é trivial, enquanto mudar o que é nó exige reindexar.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'O erro clássico: modelar o mundo em vez da consulta', html:
          '<p>A tentação é criar <code>Autor</code>, <code>Commit</code>, <code>Branch</code>, <code>Issue</code>, <code>Sprint</code>, porque "existem no domínio". Cada um aumenta o custo de ingestão, o tamanho do grafo e a manutenção, e nenhum responde as suas três perguntas. <strong>Comece com o mínimo e adicione quando uma pergunta real exigir.</strong> Grafo é como índice de banco (M03 bloco 3): custa escrita e só se paga com consulta. Pergunta de corte: <em>que pergunta do usuário deixa de ser respondível se eu remover este tipo de nó?</em></p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'NÓS',
          '  Repositorio  { id, nome, linguagem_principal, commit }',
          '  Modulo       { nome, caminho }                    <- namespace / projeto / pasta de topo',
          '  Arquivo      { caminho, linhas, gerado: bool }',
          '  Tipo         { nome, fqn, kind: classe|interface|record|enum, abstrato: bool }',
          '  Metodo       { nome, assinatura, fqn, linha_ini, linha_fim, publico: bool }',
          '  Tabela       { schema, nome }                     <- SQL embutido e mapeamento ORM',
          '  EntryPoint   { tipo: http|job|cli|evento, rota }  <- a raiz das travessias',
          '',
          'ARESTAS  (dirigidas, com propriedades quando útil)',
          '  (Repositorio) -[:CONTEM]->        (Modulo)',
          '  (Modulo)      -[:CONTEM]->        (Arquivo)',
          '  (Arquivo)     -[:DECLARA]->       (Tipo)',
          '  (Tipo)        -[:DECLARA]->       (Metodo)',
          '  (Metodo)      -[:CHAMA {linha}]-> (Metodo)        <- a aresta que mais importa',
          '  (Tipo)        -[:IMPLEMENTA]->    (Tipo)',
          '  (Tipo)        -[:HERDA]->         (Tipo)',
          '  (Tipo)        -[:DEPENDE_DE]->    (Tipo)          <- construtor, campo, parâmetro',
          '  (Metodo)      -[:ACESSA {op}]->   (Tabela)        <- op: select|insert|update|delete',
          '  (EntryPoint)  -[:EXPOE]->         (Metodo)',
          '  (Metodo)      -[:USA_POR_REFLEXAO]-> (Tipo)       <- baixa confiança'].join('\n') },
        { tipo: 'texto', html:
          '<p>Três decisões do esquema que valem discussão:</p>' +
          '<ul><li><strong><code>EntryPoint</code> existe só para uma pergunta.</strong> "Que código está morto?" é <em>o conjunto de métodos não alcançáveis a partir de algum EntryPoint</em>. Sem esse nó a pergunta não tem resposta.</li>' +
          '<li><strong><code>CHAMA</code> carrega a linha</strong> como propriedade da aresta: permite citar <em>onde</em> a chamada acontece, e é o que o grader determinístico do M07 bloco 7 verifica.</li>' +
          '<li><strong><code>USA_POR_REFLEXAO</code> é de baixa confiança</strong>, e essa honestidade é conteúdo. Reflexão, DI por convenção e chamada por string são os casos que o M08 marcou como <code>esperado_falhar</code>. O grafo melhora neles, mas não os resolve por completo.</li></ul>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Parser tolerante primeiro', html:
          '<p>A extração ideal resolveria sobrecarga, genéricos e herança com precisão de compilador, mas exige projeto compilando com dependências restauradas, o que em legado nem sempre acontece. Daí a arquitetura em plugin: <strong>parser tolerante como extrator universal</strong> (funciona em qualquer arquivo, mesmo quebrado, com menos precisão) e extrator semântico premium para quem tem build funcionando.</p>' },
        { tipo: 'takeaway', html: 'Modele a partir da <mark>pergunta</mark>: nó é o que se conta ou serve de partida, aresta é o que se <mark>percorre</mark>.' }
      ] },

      { rotulo: 'Extração', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>Determinística × por LLM</h3>' +
          '<p>É <strong>a regra de ouro da arquitetura do Capstone</strong> (<code>projeto-final.md</code>): <em>o que é determinístico fica determinístico</em>. Parse, resolução de referências e travessia são feitos por ferramenta; o modelo entra para explicar, priorizar e conversar.</p>' +
          '<table><thead><tr><th></th><th>Parser</th><th>LLM</th></tr></thead><tbody>' +
          '<tr><td>Custo</td><td>~zero, CPU</td><td><strong>uma ou mais chamadas por arquivo</strong>, o item mais caro de um pipeline de grafo</td></tr>' +
          '<tr><td>Precisão em código</td><td>alta (é gramática)</td><td>média: inventa relação, erra nome, varia entre execuções</td></tr>' +
          '<tr><td>Reprodutibilidade</td><td>total</td><td>não determinística (M05 bloco 1)</td></tr>' +
          '<tr><td>Cobertura</td><td>o que está na sintaxe</td><td>alcança o implícito (reflexão descrita em comentário, convenção)</td></tr>' +
          '<tr><td>Texto não estruturado</td><td>não serve</td><td>é a única opção</td></tr>' +
          '</tbody></table>' +
          '<p>Para o seu corpus, <strong>95% do grafo sai do parser</strong>. O LLM entra em três lugares: <strong>desambiguar</strong> o que o parser não resolve (chamada por string, nome de tabela em concatenação); <strong>rotular</strong> semanticamente ("este módulo é o de faturamento"), barato com o alias <code>rapido</code>; e <strong>resumir comunidades</strong>, o passo caro do GraphRAG (bloco 7).</p>' },
        { tipo: 'rode', id: 'b5-rode', titulo: 'Extrair, sem LLM', enunciado: 'O mesmo extrator do exercício, sobre um arquivo de 9 linhas com uma chamada por <code>getattr</code> e um <code>log.info</code>. A saída vem de executar a solução.',
          prefixo: '$', entrada: 'python3 extrair.py exemplo.py', unidade: 'ms', terminalTitulo: 'ast da stdlib',
          prever: { pergunta: 'O arquivo tem <code>getattr(x, "taxa")()</code> e <code>log.info("ok")</code>. O que o extrator faz com eles?', opcoes: [
            { id: 'a', texto: 'Cria arestas CHAMA para ambos', correta: false, porque: 'o alvo depende de tipos ou de valores em tempo de execução; a sintaxe não resolve.' },
            { id: 'b', texto: 'Registra as duas linhas como não resolvidas, candidatas ao LLM', correta: true, porque: 'o parser vê a chamada, mas não sabe qual método é; esses casos são poucos e de alto valor.' },
            { id: 'c', texto: 'Ignora em silêncio', correta: false, porque: 'ignorar esconderia o teto de cobertura.' }
          ] },
          etapas: [
            { id: 'ext', nome: 'Extração', descricao: 'Arestas CHAMA com linha', tom: 'dns', ms: 3, linhas: [
              L('cmd', 'extrair(FONTE)["chamadas"]'),
              L('out', "[('calcular', 'imposto', 2), ('calcular', 'juros', 2), ('juros', 'arredonda', 4)]"),
              L('hint', 'determinístico: mesma entrada, mesma saída')] },
            { id: 'nr', nome: 'Não resolvidos', descricao: 'Candidatos ao LLM', tom: 'request', ms: 1, linhas: [
              L('cmd', 'extrair(FONTE)["nao_resolvidos"]'),
              L('out', '[6, 8]'),
              L('hint', '2 não resolvidos contra 3 resolvidas: a taxa vira o teto de cobertura anotado')] },
            { id: 'custo', nome: 'Custo', descricao: 'Tokens gastos', tom: 'response', ms: 1, linhas: [
              L('info', 'chamadas ao LLM nesta extração: 0'),
              L('hint', 'o LLM só entraria para as linhas 6 e 8, com confiança menor que 1')] }
          ],
          tutorDepois: 'O parser entrega o que a gramática garante e devolve o resto como lista de pendências. Desambiguar essa lista pequena com LLM é o uso justificável.',
          callout: 'Você viu a extração determinística e a lista de não resolvidos.' },
        { tipo: 'python', id: 'b5-python-ast', titulo: 'Extrator com ast', obrigatorio: false,
          enunciado: 'Implemente <code>extrair(fonte)</code> com <code>ast</code>: arestas <code>(de, para, linha)</code> para chamadas a funções definidas no arquivo, ignore builtins e externos, e devolva a linha de qualquer outra forma de chamada em <code>nao_resolvidos</code>.',
          codigo: codigoAst, testes: testesAst,
          dica: 'Defina <code>definidos</code> com os <code>FunctionDef</code> de <code>arvore.body</code>. Para cada função, <code>ast.walk(fn)</code>; em cada <code>ast.Call</code>, olhe <code>no.func</code>: <code>ast.Name</code> definido vira chamada, <code>ast.Name</code> desconhecido é ignorado, o resto é não resolvido. A linha é <code>no.lineno</code>.',
          solucao: solucaoAst,
          tutorDepois: 'Valide o extrator contra um arquivo cuja resposta você conhece: grafo errado é pior que grafo ausente, porque parece autoritativo.',
          callout: 'O extrator passou nos testes, reprodutível e sem LLM.' },
        { tipo: 'callout', tom: 'info', titulo: 'tree-sitter e networkx', html:
          '<p><strong>tree-sitter</strong> é uma biblioteca de parsing incremental com gramáticas para dezenas de linguagens. É <em>tolerante a erro</em> (árvore útil em arquivo que não compila, essencial em legado) e tem <em>a mesma API para todas as linguagens</em>, o que viabiliza a arquitetura de plugin. Não faz resolução semântica: vê a chamada <code>Calcular(x)</code>, mas não sabe qual sobrecarga nem de qual classe. Daí a lista <code>nao_resolvidos</code>.</p>' +
          '<p><strong>networkx</strong> é a biblioteca padrão de grafos em Python: estrutura em memória e algoritmos prontos (alcançabilidade, ciclos, componentes, centralidade). Estratégia do curso: <strong>construir e analisar em networkx, persistir no banco</strong> (bloco 6). Para dezenas a centenas de milhares de nós, o grafo cabe em memória. O laboratório usa <code>ast</code> da stdlib; tree-sitter é trilha externa.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Esquema é contrato', html:
          '<ul><li><strong>Migrar grafo dói.</strong> Adicionar propriedade é barato; mudar o que é nó ou aresta reprocessa o corpus. Disciplina de migration destrutiva do M03 bloco 2, com o agravante de custar CPU e às vezes tokens.</li>' +
          '<li><strong>Identidade estável.</strong> O <code>fqn</code> (nome totalmente qualificado) é a chave lógica; se mudar quando o arquivo se mover de linha, as arestas apontam para o vazio. É o <code>id_estavel</code> do M07 bloco 2.</li>' +
          '<li><strong>Confiança é propriedade do dado.</strong> Guarde <code>confianca</code> na aresta e exponha: "7 chamadas diretas e 2 usos prováveis por reflexão" é mais honesto que uma lista que finge certeza.</li>' +
          '<li><strong>Garbage in, garbage out vale em dobro.</strong> Lição do context poisoning (M04 bloco 1): valide o extrator contra um arquivo cuja resposta você conhece.</li></ul>' },
        { tipo: 'takeaway', html: 'O parser faz cerca de <mark>95%</mark> do grafo; o LLM resolve só os <mark>não resolvidos</mark>, com confiança menor que 1.' }
      ] },

      { rotulo: 'Saúde arquitetural', blocos: [
        { tipo: 'texto', html:
          '<p>Com o grafo de chamadas e tipos pronto, uma medida clássica sai quase de graça, porque é grau de vértice agregado por componente (namespace, projeto ou pasta). <strong>Ca</strong> (acoplamento aferente) conta quantos tipos de fora dependem de tipos de dentro; <strong>Ce</strong> (eferente) conta de quantos de fora os de dentro dependem. Robert C. Martin os combinou na <strong>instabilidade</strong>:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: 'I = Ce / (Ca + Ce)     0 = estável (muitos dependem, difícil de mudar)   1 = instável (ninguém depende, fácil de mudar)' },
        { tipo: 'texto', html:
          '<p>"Instável" mede facilidade de mudança, não defeito: o projeto de UI deve ficar perto de 1 e a biblioteca de tipos base perto de 0. O que a métrica denuncia é a seta na direção errada (princípio das dependências estáveis): componente estável dependendo de instável. Um <strong>ciclo entre componentes</strong> é o achado mais acionável, e <code>nx.simple_cycles</code> o encontra numa linha.</p>' +
          '<p>Martin acrescenta a abstratividade <strong>A</strong> (interfaces e classes abstratas sobre o total) e a distância <code>D = |A + I − 1|</code> da "sequência principal". Só reporte A se o parser distingue abstrato de concreto; em Python isso raramente é claro, e o laboratório reporta A como <em>indefinido</em> em vez de inventar.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Limites da medida', html:
          '<p>O número muda com a fronteira escolhida (pasta, namespace, comunidade detectada no bloco 7): declare qual usou. I alto ou baixo levanta uma pergunta, não dá veredito; um utilitário estável e concreto, como uma biblioteca de datas, está certo onde está. Pela lei de Goodhart, métrica cobrada como meta é gamificada: use-a para acompanhar tendência (I subindo em seis meses vale mais que um valor isolado) e para priorizar ciclos. Comunidades densas por dentro e fracas por fora são candidatas a extração de serviço.</p>' +
          '<p>Sintoma: métricas que mudam completamente entre execuções. Causa: fronteira instável (comunidades recalculadas com aleatoriedade) ou grafo parcial. Conserto: fixar a semente da detecção de comunidade ou usar fronteira determinística (namespace) para a métrica oficial.</p>' },
        { tipo: 'python', id: 'b5-python-metricas', titulo: 'Instabilidade e ciclos', obrigatorio: false,
          enunciado: 'Implemente <code>instabilidade(arestas, componente_de)</code> (Ca e Ce por componente, ignorando arestas internas) e <code>tem_ciclo(arestas, componente_de)</code> (ciclo de dependência entre componentes).',
          codigo: codigoMetricas, testes: testesMetricas,
          dica: 'Para cada aresta (u, v), se os componentes diferem: <code>ce[cu] += 1</code> e <code>ca[cv] += 1</code>. Para o ciclo, monte um dict componente para conjunto de componentes e faça DFS com três estados (não visitado, em visita, concluído).',
          solucao: solucaoMetricas,
          tutorDepois: 'Aresta dentro do componente não conta: a métrica fala da fronteira, e muda se a fronteira mudar.',
          callout: 'Instabilidade e detecção de ciclo passaram nos testes.' },
        { tipo: 'takeaway', html: '<mark>I</mark> mede facilidade de mudança, não defeito; use <mark>tendência</mark> e declare a fronteira.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'complete', id: 'b5-onto', titulo: 'Nó, aresta ou propriedade', obrigatorio: false,
          enunciado: 'Classifique cada elemento do Cartógrafo a partir das três perguntas.',
          linguagem: 'text',
          partes: [
            '"o método chama o método Z"        -> ',
            { lacuna: 'a', opcoes: ['aresta CHAMA, com a linha como propriedade', 'propriedade do nó Metodo', 'nó novo'], correta: 'aresta CHAMA, com a linha como propriedade' },
            '\n"o método está no arquivo Y"        -> ',
            { lacuna: 'b', opcoes: ['pode ser propriedade; só vira aresta se for percorrido', 'sempre nó', 'sempre LLM'], correta: 'pode ser propriedade; só vira aresta se for percorrido' },
            '\n"que código está morto?"            -> exige ',
            { lacuna: 'c', opcoes: ['o nó EntryPoint, raiz das travessias', 'o nó Autor', 'embeddings'], correta: 'o nó EntryPoint, raiz das travessias' },
            '\nAutor, Commit, Branch, Issue, Sprint -> ',
            { lacuna: 'd', opcoes: ['fora, até uma pergunta real exigir', 'dentro, porque existem no domínio', 'sempre propriedade de Arquivo'], correta: 'fora, até uma pergunta real exigir' }
          ],
          explicacao: 'O esquema é a menor estrutura que sustenta as três perguntas. Cada tipo extra custa ingestão e manutenção sem responder nada.' },
        { tipo: 'cenario', id: 'b5-cenario', titulo: 'LLM em tudo?', obrigatorio: false,
          enunciado: 'Um colega propõe extrair todo o grafo do código do cliente com uma chamada de LLM por arquivo, "porque é mais moderno".',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O repositório tem milhares de arquivos. Qual a sua decisão?', opcoes: [
              { texto: 'Aceitar: LLM é mais flexível.', vai: 'f-caro', tom: 'ruim', consequencia: 'a ingestão vira o item mais caro do pipeline, com relações inventadas e resultado diferente a cada execução.' },
              { texto: 'Parser para as arestas de sintaxe; LLM só para os não resolvidos, os rótulos de módulo e os resumos.', vai: 'reflexao', tom: 'ok', consequencia: 'custo de ingestão cai para ~CPU e o LLM entra onde agrega.' }
            ] },
            reflexao: { texto: 'O cliente usa reflexão e DI por convenção. O parser não vê essas ligações. O que o produto faz?', opcoes: [
              { texto: 'Declarar as arestas como baixa confiança e mostrar isso na resposta.', vai: 'f-bom', tom: 'ok', consequencia: '"7 chamadas diretas e 2 usos prováveis por reflexão" é honesto e útil.' },
              { texto: 'Preencher com o LLM e apresentar tudo como certo.', vai: 'f-finge', tom: 'ruim', consequencia: 'o grafo parece autoritativo e erra de forma invisível.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Regra de ouro respeitada: determinístico fica determinístico, e o limite do parser vira informação.' },
            'f-caro': { bom: false, texto: 'Custo alto, relações inventadas e nenhuma reprodutibilidade.' },
            'f-finge': { bom: false, texto: 'Cobertura fingida: a confiança deixou de ser propriedade do dado.' }
          },
          callout: 'Parser primeiro, LLM nos não resolvidos, confiança declarada.' },
        { tipo: 'escolha', id: 'b5-esc-i', titulo: 'Confira: a métrica',
          pergunta: 'A equipe define como meta "toda biblioteca com I abaixo de 0,3". O que o bloco diz?',
          opcoes: [
            { id: 'a', texto: 'Ótimo: métrica cobrada como meta melhora a arquitetura.', correta: false, porque: 'pela lei de Goodhart, ela passa a ser gamificada.' },
            { id: 'b', texto: 'Use I para acompanhar tendência e priorizar ciclos, declare a fronteira, e trate valor isolado como pergunta, não veredito.', correta: true, porque: 'um utilitário estável e concreto está certo onde está; I subindo em seis meses vale mais que um número isolado.' },
            { id: 'c', texto: 'I alto significa componente com defeito.', correta: false, porque: 'I mede facilidade de mudança.' },
            { id: 'd', texto: 'I independe da fronteira escolhida.', correta: false, porque: 'o número muda com pasta, namespace ou comunidade.' }
          ], tutorDepois: 'Fronteira determinística (namespace) para a métrica oficial evita oscilação entre execuções.' },
        { tipo: 'escolha', id: 'b5-esc-ouro', titulo: 'Confira: a regra de ouro',
          pergunta: 'Quem deve extrair as chamadas entre métodos do corpus de código do cliente?',
          opcoes: [
            { id: 'a', texto: 'Um LLM por arquivo, porque é mais preciso que gramática em código.', correta: false, porque: 'em código o parser é gramática: alta precisão e custo de CPU.' },
            { id: 'b', texto: 'Um LLM com temperatura 0, que o torna determinístico.', correta: false, porque: 'temperatura 0 não garante determinismo.' },
            { id: 'c', texto: 'Embeddings dos métodos, que dispensam a extração.', correta: false, porque: 'similaridade não é relação.' },
            { id: 'd', texto: 'O parser; o LLM entra só para desambiguar, rotular módulos e resumir comunidades.', correta: true, porque: 'o que é determinístico fica determinístico.' }
          ], tutorDepois: 'Compare custo e acertos nos seus números no laboratório.' },
        { tipo: 'takeaway', html: 'Esquema <mark>mínimo</mark>, extração <mark>determinística</mark> e confiança <mark>declarada</mark>.' }
      ] }
    ]
  });
})();
