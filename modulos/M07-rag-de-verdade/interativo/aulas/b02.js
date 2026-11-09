/* M07 · Bloco 2: chunking. Fonte: M07.html#b02. Texto de exemplo do rode: o mesmo do simulador do módulo (117 palavras, frase-alvo nas palavras 51 a 65). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasChunk = function () {
    return [
      { id: 'texto', nome: 'Texto', descricao: '117 palavras; a frase-alvo ocupa as palavras 51 a 65', tom: 'dns', ms: 3, linhas: [
        L('info', 'documento: 117 palavras (aproximação de tokens). Frase-alvo: "O timeout de conexão é configurado em Settings.TimeoutSegundos, com valor padrão de 30 segundos."'),
        L('hint', 'a resposta de "como configurar o timeout?" está inteira nessa frase')] },
      { id: 'sem', nome: 'Sem overlap', descricao: 'tamanho 60, overlap 0', tom: 'tcp', ms: 6, linhas: [
        L('cmd', 'python simular_chunks.py --tamanho 60 --overlap 0'),
        L('out', '2 chunks · 117 palavras indexadas para 117 do original (duplicação 0%)'),
        L('out', 'Frase-alvo CORTADA entre os chunks 1 e 2: nenhum chunk contém a resposta completa, e cada metade tem vetor fraco.')] },
      { id: 'com', nome: 'Com overlap', descricao: 'tamanho 60, overlap 20', tom: 'tls', ms: 6, linhas: [
        L('cmd', 'python simular_chunks.py --tamanho 60 --overlap 20'),
        L('out', '3 chunks · 157 palavras indexadas para 117 do original (duplicação 34%)'),
        L('out', 'Frase-alvo INTEIRA em 1 chunk(s): a resposta pode ser recuperada de uma vez.'),
        L('hint', 'o overlap salvou a emenda, mas custou 34% a mais de armazenamento e de embeddings neste texto curto')] },
      { id: 'grande', nome: 'Chunk maior', descricao: 'tamanho 100, overlap 0', tom: 'request', ms: 5, linhas: [
        L('cmd', 'python simular_chunks.py --tamanho 100 --overlap 0'),
        L('out', '2 chunks · 117 palavras indexadas para 117 do original (duplicação 0%)'),
        L('out', 'Frase-alvo INTEIRA em 1 chunk(s): a resposta pode ser recuperada de uma vez.'),
        L('hint', 'inteira, porém dentro de um chunk grande que mistura assuntos: o vetor fica diluído')] },
      { id: 'leitura', nome: 'Leitura', descricao: 'Não existe tamanho mágico', tom: 'ink', ms: 3, linhas: [
        L('in', 'nenhuma combinação resolve tudo: a saída é desacoplar a unidade de busca da unidade de resposta')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm07-b2',
    titulo: 'Chunking é 60% do resultado',
    minutos: 40,
    resumo: 'Nenhum reranker salva um chunk cortado no meio de uma ideia. Chunking é código determinístico, sem custo de token, e define o teto de qualidade do RAG.',
    objetivo: 'Escolher a estratégia de chunking pelo formato do corpus, explicar o dilema do tamanho e o padrão small-to-big, descrever o contextual retrieval e listar os metadados que cada chunk precisa carregar.',
    revisao: [
      { id: 'm07b2-overlap', pergunta: 'No chunking de tamanho fixo, para que serve o overlap e qual é o custo?',
        opcoes: [
          opc('a', 'Para que uma frase cortada na fronteira apareça inteira em pelo menos um chunk; custa cerca de 10 a 15% a mais de armazenamento e embeddings', true, 'sem overlap você perde a informação que estava na emenda; o custo é duplicação.'),
          opc('b', 'Para acelerar a busca; o custo é queda de recall', false, 'overlap não acelera nada.'),
          opc('c', 'Para respeitar o limite de tokens do modelo de embedding', false, 'o limite do modelo não depende do overlap.')] },
      { id: 'm07b2-estrutural', pergunta: 'Qual estratégia é a certa para código-fonte e por quê?',
        opcoes: [
          opc('a', 'Estrutural, com parser de verdade: o método é a granularidade em que as perguntas são feitas', true, 'a fronteira sintática já é a fronteira semântica, e nunca se usa regex em chave.'),
          opc('b', 'Fixa por tamanho, porque código é só texto', false, 'código é o que há de mais estruturado; o corte fixo separa assinatura e corpo.'),
          opc('c', 'Semântica, cortando onde a similaridade entre sentenças cai', false, 'para código é inferior ao estrutural e custa embeddings a mais.')] },
      { id: 'm07b2-small-to-big', pergunta: 'Chunk pequeno casa bem mas não se explica; chunk grande dilui o vetor. Qual é a saída?',
        opcoes: [
          opc('a', 'Indexar pequeno e entregar ao modelo o contexto ampliado ao redor do que casou (small-to-big)', true, 'é desacoplar a unidade de busca da unidade de resposta.'),
          opc('b', 'Achar o tamanho mágico e usar para tudo', false, 'não existe tamanho mágico.'),
          opc('c', 'Subir o k até aparecer', false, 'só traz mais ruído.')] },
      { id: 'm07b2-contextual', pergunta: 'O que o contextual retrieval resolve e onde o custo é diluído?',
        opcoes: [
          opc('a', 'O chunk órfão: um LLM barato prepende 1 a 2 frases de contexto antes de indexar; prompt caching e modelo barato derrubam o custo, pago uma vez na ingestão', true, 'o documento inteiro é o prefixo estável reaproveitado por todos os chunks dele.'),
          opc('b', 'O limite de tokens do embedding, com uma chamada de LLM a cada consulta', false, 'o custo é de ingestão, não de consulta.'),
          opc('c', 'A negação, reescrevendo o chunk', false, 'negação é limite do vetor, tratado fora dele.')] },
      { id: 'm07b2-metadado', pergunta: 'Para que serve hash_conteudo nos metadados do chunk?',
        opcoes: [
          opc('a', 'Para não reindexar o que não mudou (cache de embeddings e ingestão incremental)', true, 'mesmo conteúdo, mesmo hash, nada a reembedar.'),
          opc('b', 'Para controlar o acesso por tenant', false, 'isolamento é tenant_id e visibilidade.'),
          opc('c', 'Para citar a linha exata na resposta', false, 'a citação usa caminho, linha_ini e linha_fim.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>O teto de qualidade</h3>' +
          '<p>Chunking é a etapa mais subestimada e a que mais determina o teto de qualidade: nenhum reranker salva um chunk cortado no meio de uma ideia, e nenhum modelo responde bem a partir de um chunk que não contém a resposta. É também a etapa mais barata de melhorar, porque é código determinístico sem custo de token. A regra: gaste no chunking o esforço que você seria tentado a gastar em prompt.</p>' },
        { tipo: 'texto', html:
          '<h3>Por que dividir o documento</h3>' +
          '<p>Três razões, em ordem de importância:</p>' +
          '<ul><li><strong>Precisão de recuperação.</strong> Um vetor representa um significado; um documento de 40 páginas tem dezenas, e o vetor médio deles não é próximo de nenhum. Chunk pequeno tem vetor específico.</li>' +
          '<li><strong>Orçamento de contexto.</strong> Você vai colocar N trechos no prompt (M05, bloco 1: custo, latência e context rot), então cada trecho precisa ser denso em informação útil.</li>' +
          '<li><strong>Precisão da citação.</strong> O produto precisa apontar onde está a resposta: "arquivo X, linhas 120 a 180" vale mais que "arquivo X".</li></ul>' },
        { tipo: 'texto', largo: true, html:
          '<h3>O dilema do tamanho</h3>' +
          '<table><thead><tr><th></th><th>Chunk pequeno (100 a 300 tokens)</th><th>Chunk grande (800 a 2.000 tokens)</th></tr></thead><tbody>' +
          '<tr><td>Vetor</td><td>Específico, casa bem com perguntas pontuais</td><td>Diluído: mistura vários assuntos</td></tr>' +
          '<tr><td>Contexto para responder</td><td>Insuficiente: o trecho não se explica sozinho</td><td>Suficiente</td></tr>' +
          '<tr><td>Citação</td><td>Precisa</td><td>Vaga</td></tr>' +
          '<tr><td>Custo no prompt</td><td>Baixo por chunk (mas você precisa de mais)</td><td>Alto</td></tr>' +
          '<tr><td>Risco</td><td>Fragmentar a resposta em dois chunks e recuperar só um</td><td>O trecho relevante se perder no meio do irrelevante</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'A saída: unidade de busca diferente da unidade de resposta', html:
          '<p>Não existe tamanho mágico. Indexe <strong>pequeno</strong> (bom para casar) e entregue ao modelo o <strong>contexto ampliado</strong> ao redor do que casou (bom para responder). O padrão tem vários nomes: <strong>small-to-big</strong>, <strong>parent document retrieval</strong>, <strong>sentence-window</strong>. O índice aponta; o fetch traz o resto, e o metadado guardado junto do chunk evita buscar o arquivo original em toda consulta.</p>' +
          '<p>Referência: a pesquisa da Anthropic sobre contextual retrieval trabalhou com chunks de cerca de 800 tokens sobre documentos de cerca de 8k, recuperando 20 chunks. Para código, a unidade natural é outra.</p>' },
        { tipo: 'takeaway', html: 'Chunk é <mark>teto de qualidade</mark>; <mark>indexe pequeno e responda grande</mark> (small-to-big).' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>O texto abaixo tem 117 palavras, e a frase que responde "como configurar o timeout?" ocupa as palavras 51 a 65. Palavras aproximam tokens. Preveja o que o corte fixo faz com ela.</p>' },
        { tipo: 'rode', id: 'm07b2-rode', titulo: 'Onde o corte fixo parte a resposta', enunciado: 'Rode o simulador com tamanho 60 e sem overlap, e depois compare com overlap e com chunk maior clicando nas etapas.',
          prefixo: '$', entrada: 'python simular_chunks.py --tamanho 60 --overlap 0', unidade: 'palavras', terminalTitulo: 'chunking', etapas: etapasChunk(),
          prever: { pergunta: 'Com chunks de 60 palavras e overlap 0, o que acontece com a frase-alvo (palavras 51 a 65)?', opcoes: [
            { id: 'a', texto: 'Fica inteira no primeiro chunk, porque começa antes da palavra 60.', correta: false, porque: 'ela termina na palavra 65, depois da fronteira em 60.' },
            { id: 'b', texto: 'É cortada entre o chunk 1 e o chunk 2: nenhum contém a resposta completa.', correta: true, porque: 'a fronteira em 60 cai no meio da frase, e sem overlap a emenda se perde.' },
            { id: 'c', texto: 'Fica inteira nos dois chunks.', correta: false, porque: 'só o overlap duplica trechos da emenda.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Depois clique em "Com overlap" e em "Chunk maior" para comparar.',
          tutorDepois: 'Sem overlap a frase foi cortada. Com overlap de 20 ela cabe inteira, ao custo de 34% de duplicação neste texto curto (o módulo cita 10 a 15% para overlaps típicos). O chunk de 100 também a protege, mas dilui o vetor. Nenhum parâmetro resolve tudo.',
          callout: 'Você viu a frase-alvo cortada sem overlap e inteira com overlap ou com chunk maior.' },
        { tipo: 'texto', html:
          '<h3>As cinco estratégias</h3>' +
          '<p>Escolha pelo formato do corpus. Cada aba diz quando usar e quando não.</p>' },
        { tipo: 'abas', rotulo: 'Estratégias', itens: [
          { rotulo: '1 · Fixo', blocos: [{ tipo: 'texto', html:
            '<p>O baseline: <code>chunk_size = 800 tokens, overlap = 100 tokens</code>, em janelas <code>[0..800] [700..1500] [1400..2200]</code>.</p>' +
            '<p>O <strong>overlap</strong> existe para que uma frase cortada na fronteira apareça inteira em um dos dois chunks; sem ele você perde exatamente a informação que estava na emenda. Custo: duplicação, de 10 a 15% a mais de armazenamento e de embeddings.</p>' +
            '<p><strong>Quando usar:</strong> texto corrido sem estrutura. <strong>Quando não:</strong> qualquer coisa com estrutura, e código é a coisa mais estruturada que existe.</p>' }] },
          { rotulo: '2 · Estrutural', blocos: [{ tipo: 'texto', html:
            '<p>É o certo para código e markdown. Divide pelas fronteiras naturais do formato: markdown por cabeçalho, código por unidade sintática (classe, método, função).</p>' +
            '<p>Para código, use um <strong>parser de verdade</strong>: tree-sitter (o mesmo que o Capstone usa no M13) ou a árvore sintática da linguagem, e nunca regex em chave. O método é a unidade perfeita: começo e fim óbvios, um propósito, e é a granularidade em que as perguntas são feitas ("onde valida CPF?" aponta para um método).</p>' }] },
          { rotulo: '3 · Semântico', blocos: [{ tipo: 'texto', html:
            '<p>Quebra onde o assunto muda: calcula o embedding de cada sentença e corta quando a similaridade entre sentenças vizinhas cai abaixo de um limiar.</p>' +
            '<p>Custa embeddings a mais na ingestão e ajuda em texto corrido longo (transcrição, relatório). Para código é inferior ao estrutural: a fronteira sintática já é a fronteira semântica, de graça.</p>' }] },
          { rotulo: '4 · Contextual', blocos: [{ tipo: 'texto', html:
            '<p>A técnica que mais melhorou a recuperação nos últimos anos e que se aplica em cima das outras. Antes de indexar, um LLM barato escreve 1 a 2 frases situando o chunk no documento, e esse texto é <strong>prepensado</strong> ao chunk antes de gerar o embedding e o índice léxico. Resolve o <strong>chunk órfão</strong>: o método <code>Processar()</code> que, isolado, não diz que pertence ao serviço de pagamentos.</p>' },
            { tipo: 'codigo', linguagem: 'text', texto:
              '<documento>{documento inteiro, ou o arquivo}</documento>\n' +
              'Aqui está o trecho que queremos situar dentro do documento:\n' +
              '<trecho>{o chunk}</trecho>\n' +
              'Dê um contexto curto e sucinto para situar este trecho no documento,\n' +
              'com o objetivo de melhorar a recuperação em busca. Responda só com o contexto.' },
            { tipo: 'texto', html:
              '<p>Números reportados pela Anthropic, em relação a um baseline de busca vetorial: <strong>-35%</strong> na taxa de falha de recuperação com embeddings contextualizados; <strong>-49%</strong> combinando com BM25 contextualizado; <strong>-67%</strong> adicionando reranking. Contexto, híbrido e rerank compõem, e é por isso que os blocos 4 e 5 vêm depois. <em>O módulo não registra data de verificação desses números: confirme na fonte original antes de citá-los.</em></p>' +
              '<p><strong>Custo:</strong> uma chamada de LLM por chunk na ingestão. Num repositório de 50 mil chunks parece proibitivo, e seria sem duas coisas que você já tem: <strong>prompt caching</strong> (M05, bloco 5: o documento inteiro é o prefixo estável e todos os chunks dele reaproveitam) e <strong>modelo barato</strong> (tarefa simples: alias <code>rapido</code> do M05, bloco 6). É custo de ingestão, pago uma vez, contra ganho em toda consulta. Ainda assim, meça antes de aplicar ao corpus inteiro.</p>' }] },
          { rotulo: '5 · Late chunking', blocos: [{ tipo: 'texto', html:
            '<p>Inverte a ordem: passa o documento inteiro pelo modelo de embedding (modelos de contexto longo), obtém vetores por token já influenciados por todo o documento e só então agrega em chunks. O vetor do chunk "sabe" do documento sem LLM prepondo texto.</p>' +
            '<p>Exige modelo de embedding com janela longa e saída por token. É uma alternativa elegante ao contextual retrieval quando disponível; conheça o nome, e prefira o contextual retrieval se o seu modelo não suportar.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'Código pede <mark>chunking estrutural</mark> com parser; <mark>contexto prepensado</mark> resolve o chunk órfão e o custo é de ingestão.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Primeiro o baseline, para sentir o corte e o custo do overlap. Depois o chunker estrutural, que é o que o corpus de código pede.</p>' },
        { tipo: 'python', id: 'm07b2-python-fixo', titulo: 'Chunker fixo com overlap',
          enunciado: 'Complete <code>chunk_fixo(n_palavras, tamanho, overlap)</code>: devolve a lista de janelas <code>(inicio, fim)</code> sobre <code>n_palavras</code>, avançando <code>tamanho - overlap</code> a cada passo, e a última janela termina em <code>n_palavras</code>. Levante <code>ValueError</code> se <code>overlap &gt;= tamanho</code>. <code>frase_inteira</code> e <code>duplicacao</code> já estão prontas.',
          codigo: `def chunk_fixo(n_palavras, tamanho, overlap):
    if tamanho <= 0 or overlap < 0 or overlap >= tamanho:
        raise ValueError("overlap deve ser menor que o tamanho")
    janelas = []
    inicio = 0
    while True:
        # 1. fim = menor entre n_palavras e inicio + tamanho
        # 2. guarde (inicio, fim)
        # 3. pare se fim >= n_palavras; senão avance tamanho - overlap
        break
    return janelas


def frase_inteira(janelas, ini, fim):
    return any(a <= ini and b >= fim for a, b in janelas)


def duplicacao(janelas, n_palavras):
    guardadas = sum(b - a for a, b in janelas)
    return round((guardadas / n_palavras - 1) * 100)


print(chunk_fixo(117, 60, 20))
`,
          testes: `def test_sem_overlap():
    assert chunk_fixo(117, 60, 0) == [(0, 60), (60, 117)]


def test_com_overlap():
    assert chunk_fixo(117, 60, 20) == [(0, 60), (40, 100), (80, 117)]


def test_frase_cortada_sem_overlap_e_inteira_com_overlap():
    assert not frase_inteira(chunk_fixo(117, 60, 0), 51, 65)
    assert frase_inteira(chunk_fixo(117, 60, 20), 51, 65)


def test_duplicacao():
    assert duplicacao(chunk_fixo(117, 60, 0), 117) == 0
    assert duplicacao(chunk_fixo(117, 60, 20), 117) == 34


def test_borda_texto_menor_que_um_chunk():
    assert chunk_fixo(30, 60, 10) == [(0, 30)]


def test_overlap_invalido_falha():
    try:
        chunk_fixo(117, 60, 60)
    except ValueError:
        return
    assert False, "deveria levantar ValueError"
`,
          dica: 'Use <code>fim = min(n_palavras, inicio + tamanho)</code>, faça <code>janelas.append((inicio, fim))</code>, <code>break</code> se <code>fim &gt;= n_palavras</code> e <code>inicio += tamanho - overlap</code>.',
          solucao: `def chunk_fixo(n_palavras, tamanho, overlap):
    if tamanho <= 0 or overlap < 0 or overlap >= tamanho:
        raise ValueError("overlap deve ser menor que o tamanho")
    janelas = []
    inicio = 0
    while True:
        fim = min(n_palavras, inicio + tamanho)
        janelas.append((inicio, fim))
        if fim >= n_palavras:
            break
        inicio += tamanho - overlap
    return janelas


def frase_inteira(janelas, ini, fim):
    return any(a <= ini and b >= fim for a, b in janelas)


def duplicacao(janelas, n_palavras):
    guardadas = sum(b - a for a, b in janelas)
    return round((guardadas / n_palavras - 1) * 100)
`,
          tutorDepois: 'Os números batem com o rode: 117 palavras, janelas de 60, overlap 20 dão três chunks e 34% de duplicação. O guarda de <code>overlap &gt;= tamanho</code> evita laço infinito.',
          callout: 'Chunker fixo com overlap, e o custo do overlap medido.' },
        { tipo: 'python', id: 'm07b2-python-ast', titulo: 'Chunker estrutural por AST', obrigatorio: false,
          enunciado: 'Complete <code>registrar</code> dentro de <code>chunks_estruturais(fonte, caminho)</code>: cada função de topo ou método de classe vira um chunk com <code>caminho</code>, <code>simbolo</code> (<code>Classe.metodo</code> ou <code>funcao</code>), <code>linha_ini</code>, <code>linha_fim</code>, <code>conteudo</code> (as linhas do método) e <code>hash_conteudo</code> (sha256 do conteúdo, 12 primeiros caracteres hexa). Imports e atribuições não viram chunk.',
          codigo: `import ast
import hashlib


def chunks_estruturais(fonte, caminho):
    linhas = fonte.splitlines()
    saida = []

    def registrar(no, simbolo):
        # 1. linha_ini = no.lineno ; linha_fim = no.end_lineno
        # 2. conteudo = "\\n".join(linhas[linha_ini - 1:linha_fim])
        # 3. saida.append({...}) com as seis chaves do enunciado
        pass

    for no in ast.parse(fonte).body:
        if isinstance(no, ast.ClassDef):
            for filho in no.body:
                if isinstance(filho, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    registrar(filho, no.name + "." + filho.name)
        elif isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef)):
            registrar(no, no.name)
    return saida
`,
          testes: `FONTE = (
    "import os\\n"
    "\\n"
    "class Pagamento:\\n"
    "    def calcular(self, valor):\\n"
    "        return valor * 2\\n"
    "\\n"
    "    def validar(self, cnpj):\\n"
    "        return len(cnpj) == 14\\n"
    "\\n"
    "def helper():\\n"
    "    return 1\\n"
)


def test_simbolos_e_linhas():
    cs = chunks_estruturais(FONTE, "pag.py")
    assert [(c["simbolo"], c["linha_ini"], c["linha_fim"]) for c in cs] == [
        ("Pagamento.calcular", 4, 5),
        ("Pagamento.validar", 7, 8),
        ("helper", 10, 11),
    ]


def test_conteudo_e_caminho():
    c = chunks_estruturais(FONTE, "pag.py")[0]
    assert c["caminho"] == "pag.py"
    assert c["conteudo"].startswith("    def calcular")
    assert "valor * 2" in c["conteudo"]


def test_hash_muda_com_o_corpo():
    outra = FONTE.replace("valor * 2", "valor * 3")
    a = chunks_estruturais(FONTE, "p.py")
    b = chunks_estruturais(outra, "p.py")
    assert a[0]["hash_conteudo"] != b[0]["hash_conteudo"]
    assert a[1]["hash_conteudo"] == b[1]["hash_conteudo"]
    assert len(a[0]["hash_conteudo"]) == 12


def test_borda_sem_funcoes_nao_gera_chunk():
    assert chunks_estruturais("import os\\nX = 1\\n", "a.py") == []


def test_fonte_invalida_falha_alto():
    try:
        chunks_estruturais("def (:\\n", "a.py")
    except SyntaxError:
        return
    assert False, "deveria levantar SyntaxError"
`,
          dica: 'O hash: <code>hashlib.sha256(conteudo.encode("utf-8")).hexdigest()[:12]</code>. As seis chaves: <code>caminho, simbolo, linha_ini, linha_fim, conteudo, hash_conteudo</code>.',
          solucao: `import ast
import hashlib


def chunks_estruturais(fonte, caminho):
    linhas = fonte.splitlines()
    saida = []

    def registrar(no, simbolo):
        linha_ini = no.lineno
        linha_fim = no.end_lineno
        conteudo = "\\n".join(linhas[linha_ini - 1:linha_fim])
        saida.append({
            "caminho": caminho,
            "simbolo": simbolo,
            "linha_ini": linha_ini,
            "linha_fim": linha_fim,
            "conteudo": conteudo,
            "hash_conteudo": hashlib.sha256(conteudo.encode("utf-8")).hexdigest()[:12],
        })

    for no in ast.parse(fonte).body:
        if isinstance(no, ast.ClassDef):
            for filho in no.body:
                if isinstance(filho, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    registrar(filho, no.name + "." + filho.name)
        elif isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef)):
            registrar(no, no.name)
    return saida
`,
          tutorDepois: 'O parser entrega símbolo e linhas corretos, o que sustenta a citação precisa; o hash por chunk permite reindexar só o que mudou. É a versão enxuta do que o laboratório faz sobre o corpus Python.',
          callout: 'Chunker estrutural: símbolo, linhas e hash por método.' },
        { tipo: 'cenario', id: 'm07b2-cenario', titulo: 'Qual chunking para o corpus de código?', obrigatorio: false,
          enunciado: 'O corpus do Capstone é código-fonte Python. Decida o chunking e veja o custo de cada caminho.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Você precisa de um primeiro chunker para o corpus de código. Qual?', opcoes: [
              { texto: 'Tamanho fixo de 800 tokens com overlap de 100, igual ao baseline de texto.', vai: 'f-fixo', tom: 'ruim', consequencia: 'o corte cai no meio de métodos: a assinatura fica separada do corpo.' },
              { texto: 'Estrutural: um chunk por método, com um parser.', vai: 'estrutural', tom: 'ok', consequencia: 'símbolo e linhas corretos, e a fronteira sintática já é a semântica.' },
              { texto: 'Semântico: embedding por sentença e corte quando a similaridade cai.', vai: 'f-semantico', tom: 'ruim', consequencia: 'custa embeddings a mais na ingestão e é inferior ao estrutural em código.' }
            ] },
            estrutural: { texto: 'O método <code>Processar()</code> isolado não diz que pertence ao serviço de pagamentos (chunk órfão). O corpus tem 50 mil chunks. O que fazer?', opcoes: [
              { texto: 'Contexto prepensado por LLM barato com prompt caching sobre o arquivo, medindo numa amostra antes de aplicar ao corpus inteiro.', vai: 'f-bom', tom: 'ok', consequencia: 'o custo é de ingestão, diluído pelo cache, e o ganho vale em toda consulta.' },
              { texto: 'Chamar um LLM caro por chunk, sem cache e sem medir.', vai: 'f-caro', tom: 'ruim', consequencia: 'a conta de ingestão explode sem prova de ganho.' },
              { texto: 'Deixar o reranker resolver depois.', vai: 'f-rerank', tom: 'ruim', consequencia: 'nenhum reranker salva um chunk que o recall nem trouxe.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Chunks por método com contexto prepensado: citação precisa, chunk órfão resolvido e custo medido antes de escalar.' },
            'f-fixo': { bom: false, texto: 'O recall@5 manual mostrou assinaturas sem corpo e corpos sem nome; o teto de qualidade ficou baixo.' },
            'f-semantico': { bom: false, texto: 'Mais custo de embedding na ingestão para um resultado pior que o corte pela sintaxe.' },
            'f-caro': { bom: false, texto: 'O custo de ingestão disparou, e ninguém sabe quanto do ganho veio do contexto.' },
            'f-rerank': { bom: false, texto: 'O chunk órfão nunca chegou ao reranker; o recall continuou baixo.' }
          },
          callout: 'Estrutural, com contexto prepensado e custo medido.' },
        { tipo: 'takeaway', html: '<mark>Parser</mark> dá símbolo e linhas; o <mark>hash por chunk</mark> evita reindexar o que não mudou.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Metadados: o que guardar junto de cada chunk</h3>' +
          '<p>Metadado é o que transforma busca vetorial em sistema. A tabela é o mínimo do Capstone, e quase todo campo existe para atender um bloco posterior.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Campo</th><th>Para quê</th><th>Onde é usado</th></tr></thead><tbody>' +
          '<tr><td><code>tenant_id</code></td><td>Isolamento entre clientes</td><td>Filtro obrigatório (b6), RLS (M12)</td></tr>' +
          '<tr><td><code>repo_id</code>, <code>caminho</code>, <code>linha_ini</code>, <code>linha_fim</code></td><td>Citação precisa e navegação</td><td>Resposta com evidência; grader determinístico do M06</td></tr>' +
          '<tr><td><code>tipo</code> (classe, método, config, doc, teste)</td><td>Roteamento e filtro por intenção</td><td>b5 (query routing), b6</td></tr>' +
          '<tr><td><code>simbolo</code> (nome da classe ou método)</td><td>Casamento exato</td><td>Busca léxica (b4), grafo (M10)</td></tr>' +
          '<tr><td><code>linguagem</code>, <code>versao_commit</code></td><td>Filtro e detecção de obsolescência</td><td>b6, reindexação incremental</td></tr>' +
          '<tr><td><code>embedding_model</code></td><td>Detectar mistura e planejar migração</td><td>b1</td></tr>' +
          '<tr><td><code>hash_conteudo</code></td><td>Não reindexar o que não mudou</td><td>Cache (M05 b5), ingestão incremental</td></tr>' +
          '<tr><td><code>visibilidade</code> / <code>sensivel</code></td><td>ACL e mascaramento</td><td>b6, M12</td></tr>' +
          '</tbody></table>' },
        { tipo: 'escolha', id: 'm07b2-escolha-parser', titulo: 'Confira: regex ou parser',
          pergunta: 'Um colega propõe dividir o código com uma regex que casa <code>def </code> e <code>class </code>. O que responder?',
          opcoes: [
            opc('a', 'Serve: código é texto, e a regex é mais simples.', false, 'a regex não conhece decorators, aninhamento nem fim de bloco, e o fim de cada método é o que dá a citação de linhas.'),
            opc('b', 'Use um parser de verdade (tree-sitter ou a árvore sintática da linguagem): ele dá começo, fim e símbolo de cada unidade.', true, 'o módulo é explícito: nunca regex em chave; o método é a granularidade das perguntas.'),
            opc('c', 'Use chunks semânticos, que descobrem sozinhos onde o assunto muda.', false, 'em código é inferior ao estrutural e custa embeddings a mais.'),
            opc('d', 'Use tamanho fixo e aumente o overlap.', false, 'overlap cobre a emenda, mas não restaura a unidade sintática.')
          ], tutorDepois: 'Parser para código, cabeçalho para markdown.' },
        { tipo: 'escolha', id: 'm07b2-escolha-contexto', titulo: 'Confira: onde o contexto entra',
          pergunta: 'Onde o contexto escrito pelo LLM no contextual retrieval deve ser usado?',
          opcoes: [
            opc('a', 'Prepensado ao chunk antes de gerar o embedding e o índice léxico.', true, 'assim os dois lados da busca (vetorial e léxica) veem o contexto.'),
            opc('b', 'Só no prompt final, depois da recuperação.', false, 'a técnica atua na indexação, não na resposta.'),
            opc('c', 'Só no índice léxico, porque o vetor não aproveita texto.', false, 'o texto prepensado entra também no embedding.'),
            opc('d', 'Em lugar do chunk original, que é descartado.', false, 'o contexto é prepensado ao chunk, não o substitui.')
          ], tutorDepois: 'Contexto prepensado vale para o embedding e para o índice léxico.' },
        { tipo: 'takeaway', html: 'Cada <mark>metadado</mark> existe para um bloco seguinte: <mark>citação, ACL, versão e reindexação</mark> nascem no chunk.' }
      ] }
    ]
  });
})();
