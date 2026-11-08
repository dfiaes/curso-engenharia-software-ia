/* M05 · Bloco 3: tool calling, o loop e quem manda nele. Fonte: M05.html#b03. Exemplo condutor: investigar um repositório com ler_arquivo e buscar_simbolo. Saídas de terminal são de um modelo fake determinístico (exemplo ilustrativo). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var PY = function (a) { return a.join('\n') + '\n'; };

  var etapasLoop = function () {
    return [
      { id: 'p0', nome: 'Passo 0: modelo', descricao: 'Pede buscar_simbolo', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python investigar.py "onde o total do pedido é calculado?"'),
        L('info', 'envia: mensagens + definição das tools (nome, descrição e schema de entrada)'),
        L('in', 'stop_reason=tool_use  tool_use: buscar_simbolo {"simbolo": "total", "limite": 20}'),
        L('hint', 'o modelo só emitiu JSON dizendo o que chamaria: nada foi executado ainda')] },
      { id: 'e0', nome: 'Passo 0: seu código', descricao: 'Valida, autoriza, executa', tom: 'tcp', ms: 1, linhas: [
        L('out', 'model_validate(input): ok (BuscarSimboloIn)'),
        L('out', '[passo 0] buscar_simbolo({"simbolo": "total", "limite": 20}) -> 41 chars'),
        L('out', 'tool_result: app/pedido.py:3: total = 0')] },
      { id: 'p1', nome: 'Passo 1: modelo', descricao: 'Pede ler_arquivo', tom: 'tls', ms: 1, linhas: [
        L('in', 'stop_reason=tool_use  tool_use: ler_arquivo {"caminho": "app/pedido.py"}')] },
      { id: 'e1', nome: 'Passo 1: seu código', descricao: 'Sandbox e execução', tom: 'request', ms: 1, linhas: [
        L('out', 'is_relative_to(RAIZ): ok'),
        L('out', '[passo 1] ler_arquivo({"caminho": "app/pedido.py"}) -> 47 chars'),
        L('out', 'tool_result: conteúdo de app/pedido.py')] },
      { id: 'p2', nome: 'Passo 2: modelo', descricao: 'Resposta final', tom: 'response', ms: 1, linhas: [
        L('in', 'stop_reason=end_turn'),
        L('out', 'O total é inicializado em app/pedido.py, linha 3, e recalculado em Pedido.somar().')] },
      { id: 'fim', nome: 'Fim do loop', descricao: 'end_turn encerra', tom: 'ink', ms: 1, linhas: [
        L('hint', 'três chamadas ao modelo, duas execuções do seu código; o histórico foi reenviado a cada passo (o bloco 5 ataca isso)')] }
    ];
  };

  var codigoPy = PY([
    'import posixpath',
    '',
    'ARQUIVOS = {',
    '    "app/pedido.py": "class Pedido:\\n    total = 0\\n",',
    '    "app/db.py": "def conectar():\\n    pass\\n",',
    '}',
    '',
    '',
    'def ler_arquivo(caminho):',
    '    """Sandbox por construcao: nada fora da raiz do repositorio."""',
    '    normal = posixpath.normpath(caminho)',
    '    # 1. recuse caminho absoluto ou que sai da raiz (comeca com ".."):',
    '    #    devolva "ERRO: ..." com instrucao acionavel',
    '    if normal not in ARQUIVOS:',
    '        return "ERRO: " + repr(caminho) + " nao existe. Use buscar_simbolo para localizar."',
    '    return ARQUIVOS[normal]',
    '',
    '',
    'def executar(bloco):',
    '    """Valida e executa UM bloco tool_use; devolve o tool_result."""',
    '    entrada = bloco["input"]',
    '    # 2. input sem "caminho" string e dado nao confiavel: is_error True, sem levantar excecao',
    '    # 3. saida que comeca com "ERRO" tambem vira is_error True',
    '    return {"type": "tool_result", "tool_use_id": bloco["id"], "content": "", "is_error": False}',
    '',
    '',
    'def investigar(pergunta, modelo, max_passos=8):',
    '    mensagens = [{"role": "user", "content": pergunta}]',
    '    for passo in range(max_passos):',
    '        resposta = modelo(mensagens)',
    '        mensagens.append({"role": "assistant", "content": resposta["content"]})',
    '        # 4. se stop_reason != "tool_use": devolva o texto dos blocos "text"',
    '        # 5. senao, execute cada bloco tool_use e adicione UMA mensagem "user"',
    '        #    com a lista de tool_results (o loop recomeca)',
    '    return "PARADO: orcamento de passos esgotado sem resposta final."',
    '',
    '',
    'print(ler_arquivo("app/pedido.py"))'
  ]);
  var solucaoPy = PY([
    'import posixpath',
    '',
    'ARQUIVOS = {',
    '    "app/pedido.py": "class Pedido:\\n    total = 0\\n",',
    '    "app/db.py": "def conectar():\\n    pass\\n",',
    '}',
    '',
    '',
    'def ler_arquivo(caminho):',
    '    """Sandbox por construcao: nada fora da raiz do repositorio."""',
    '    normal = posixpath.normpath(caminho)',
    '    if normal.startswith("/") or normal == ".." or normal.startswith("../"):',
    '        return "ERRO: caminho fora do repositorio. Use caminho relativo a raiz."',
    '    if normal not in ARQUIVOS:',
    '        return "ERRO: " + repr(caminho) + " nao existe. Use buscar_simbolo para localizar."',
    '    return ARQUIVOS[normal]',
    '',
    '',
    'def executar(bloco):',
    '    """Valida e executa UM bloco tool_use; devolve o tool_result."""',
    '    entrada = bloco["input"]',
    '    caminho = entrada.get("caminho") if isinstance(entrada, dict) else None',
    '    if not isinstance(caminho, str):',
    '        saida, erro = "ERRO de argumento: caminho (texto) e obrigatorio", True',
    '    else:',
    '        saida = ler_arquivo(caminho)',
    '        erro = saida.startswith("ERRO")',
    '    return {"type": "tool_result", "tool_use_id": bloco["id"], "content": saida, "is_error": erro}',
    '',
    '',
    'def investigar(pergunta, modelo, max_passos=8):',
    '    mensagens = [{"role": "user", "content": pergunta}]',
    '    for passo in range(max_passos):',
    '        resposta = modelo(mensagens)',
    '        mensagens.append({"role": "assistant", "content": resposta["content"]})',
    '        if resposta["stop_reason"] != "tool_use":',
    '            return "".join(b["text"] for b in resposta["content"] if b["type"] == "text")',
    '        resultados = [executar(b) for b in resposta["content"] if b["type"] == "tool_use"]',
    '        mensagens.append({"role": "user", "content": resultados})',
    '    return "PARADO: orcamento de passos esgotado sem resposta final."',
    '',
    '',
    'print(ler_arquivo("app/pedido.py"))'
  ]);
  var testesPy = PY([
    'def uso(caminho, id="t1"):',
    '    bloco = {"type": "tool_use", "id": id, "name": "ler_arquivo", "input": {"caminho": caminho}}',
    '    return {"stop_reason": "tool_use", "content": [bloco]}',
    '',
    '',
    'def fim(texto):',
    '    return {"stop_reason": "end_turn", "content": [{"type": "text", "text": texto}]}',
    '',
    '',
    'def modelo_roteirizado(*respostas):',
    '    """Modelo fake: devolve as respostas em ordem; a ultima se repete."""',
    '    historico = []',
    '',
    '    def modelo(mensagens):',
    '        historico.append(len(mensagens))',
    '        return respostas[min(len(historico) - 1, len(respostas) - 1)]',
    '',
    '    modelo.historico = historico',
    '    return modelo',
    '',
    '',
    'def test_caminho_feliz():',
    '    m = modelo_roteirizado(uso("app/pedido.py"), fim("Pedido calcula o total"))',
    '    assert investigar("o que Pedido faz?", m) == "Pedido calcula o total"',
    '    assert m.historico == [1, 3]',
    '',
    '',
    'def test_sandbox_recusa_e_modelo_se_corrige():',
    '    assert ler_arquivo("../../etc/passwd").startswith("ERRO")',
    '    assert ler_arquivo("/etc/passwd").startswith("ERRO")',
    '    assert ler_arquivo("app/../../etc/passwd").startswith("ERRO")',
    '    assert ler_arquivo("app/../app/db.py").startswith("def conectar")',
    '',
    '',
    'def test_recusa_vira_is_error_acionavel():',
    '    r = executar({"id": "t9", "name": "ler_arquivo", "input": {"caminho": "../segredo"}})',
    '    assert r["is_error"] is True and r["tool_use_id"] == "t9"',
    '    assert "relativo" in r["content"]',
    '',
    '',
    'def test_argumento_invalido_nao_levanta():',
    '    r = executar({"id": "t2", "name": "ler_arquivo", "input": {}})',
    '    assert r["is_error"] is True',
    '    r = executar({"id": "t3", "name": "ler_arquivo", "input": {"caminho": 42}})',
    '    assert r["is_error"] is True',
    '',
    '',
    'def test_arquivo_inexistente_orienta_a_buscar():',
    '    r = executar({"id": "t4", "name": "ler_arquivo", "input": {"caminho": "app/x.py"}})',
    '    assert r["is_error"] is True and "buscar_simbolo" in r["content"]',
    '',
    '',
    'def test_orcamento_de_passos():',
    '    m = modelo_roteirizado(uso("app/pedido.py"))',
    '    r = investigar("pergunta", m, max_passos=3)',
    '    assert r.startswith("PARADO")',
    '    assert len(m.historico) == 3',
    '',
    '',
    'def test_controle_negativo_leitura_valida_nao_e_erro():',
    '    r = executar({"id": "t5", "name": "ler_arquivo", "input": {"caminho": "app/pedido.py"}})',
    '    assert r["is_error"] is False and "class Pedido" in r["content"]'
  ]);

  TrilhaAula.registrar({
    id: 'm05-b3',
    titulo: 'Tool calling: o loop, e quem manda nele',
    minutos: 35,
    resumo: 'O modelo não executa nada: emite um JSON dizendo que chamaria uma função. Quem valida, autoriza e executa, ou recusa, é o seu código, e é aí que mora a segurança do sistema.',
    objetivo: 'Descrever o loop de tool calling, escrever o seu while com teto de passos, validação na fronteira, erro acionável e sandbox, e desenhar ferramentas como API pública para um consumidor que segue instruções literalmente.',
    revisao: [
      { id: 'm05b3-quem-executa', pergunta: 'Em tool calling, quem executa a função ler_arquivo?',
        opcoes: [
          opc('a', 'O seu código: o modelo só emite o JSON da chamada pretendida; você valida, autoriza e executa ou recusa', true, 'é o fator 4 do 12-Factor Agents: tools são saídas estruturadas.'),
          opc('b', 'O modelo, dentro do provedor', false, 'o modelo só emite JSON.'),
          opc('c', 'O gateway, automaticamente', false, 'o gateway roteia; não decide executar a sua função.')] },
      { id: 'm05b3-traversal', pergunta: 'O modelo pede o arquivo ../../etc/passwd. Qual é a resposta de engenharia correta?',
        opcoes: [
          opc('a', 'Fronteira mecânica no código (is_relative_to(RAIZ)) que recusa e devolve tool_result com is_error e instrução acionável', true, 'instrução no prompt não é barreira; o erro volta compacto e acionável, e o modelo se corrige no próximo passo.'),
          opc('b', 'Adicionar ao prompt "nunca peça arquivos fora do repositório"', false, 'instrução não é barreira.'),
          opc('c', 'Deixar passar e filtrar a resposta depois', false, 'a leitura já terá acontecido.')] },
      { id: 'm05b3-so-vs-tc', pergunta: 'Quando usar structured output e quando usar tool calling?',
        opcoes: [
          opc('a', 'Structured output controla o que o modelo DIZ (resposta final, uma chamada); tool calling controla o que ele PEDE (chamadas intermediárias, com loop). Podem se combinar', true, 'extrair dados de um documento é structured output; investigar um repositório é tool calling.'),
          opc('b', 'Sempre tool calling, porque é mais geral', false, 'a ferramenta falsa para obter JSON é gambiarra pré-structured output.'),
          opc('c', 'São sinônimos em provedores modernos', false, 'resolvem problemas diferentes.')] },
      { id: 'm05b3-teto', pergunta: 'Por que o loop tem max_passos e devolve "parado por orçamento" em vez de travar?',
        opcoes: [
          opc('a', 'Loop de agente sem teto é uma fatura aberta; o retorno explícito vira métrica (M06)', true, 'cada passo reenvia o histórico: o custo cresce com o número de passos.'),
          opc('b', 'Porque o provedor derruba conexões longas', false, 'o motivo é custo e controle, não a conexão.'),
          opc('c', 'Para acelerar a primeira resposta', false, 'o teto não muda o TTFT.')] },
      { id: 'm05b3-descricao', pergunta: 'Qual é a documentação que o modelo usa para escolher uma ferramenta?',
        opcoes: [
          opc('a', 'Só o nome e a descrição (mais o schema de entrada): é por isso que "devolve caminho:linha" é escolhível e "consulta o índice" não', true, 'não há Stack Overflow para ele consultar; a definição é o contrato público.'),
          opc('b', 'O código-fonte da função', false, 'o modelo não vê o corpo da função.'),
          opc('c', 'O histórico de chamadas de outros usuários', false, 'cada chamada é independente do que o catálogo diz.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>O modelo não executa nada</h3>' +
          '<p>"Tool calling" é o mecanismo por trás de tudo que o mercado chama de agente, e é o conceito mais mal explicado do campo. A confusão custa caro em segurança, então vamos matá-la na primeira frase: <strong>o modelo não executa nada</strong>. Ele emite um pedaço de JSON dizendo "eu chamaria a função X com estes argumentos". Quem executa, ou recusa, é o <em>seu</em> código.</p>' +
          '<p>É o fator 4 do 12-Factor Agents (M01, bloco 3: <em>tools are just structured outputs</em>). Entender isso literalmente separa quem constrói agente seguro de quem constrói incidente.</p>' },
        { tipo: 'abas', rotulo: 'O loop em cinco passos', itens: [
          { rotulo: '1. Enviar', blocos: [{ tipo: 'texto', html: '<p>Seu código envia as mensagens e a <strong>definição das tools</strong> (nome, descrição e schema de entrada). A descrição é toda a documentação que o modelo tem.</p>' }] },
          { rotulo: '2. Propor', blocos: [{ tipo: 'texto', html: '<p>O modelo decide se e qual ferramenta usar e responde apenas com JSON: <code>tool_use {name, input}</code> e <code>stop_reason="tool_use"</code>. <strong>Nada foi executado.</strong></p>' }] },
          { rotulo: '3. Decidir', blocos: [{ tipo: 'texto', html: '<p>Seu código valida o input (Pydantic), autoriza (por exemplo, caminho dentro da raiz) e executa ou recusa. <strong>Toda a segurança mora aqui</strong> (M12): o dado do modelo é dado não confiável.</p>' }] },
          { rotulo: '4. Devolver', blocos: [{ tipo: 'texto', html: '<p>O resultado volta como <code>tool_result</code>. Se recusou, vai com <code>is_error</code> e uma mensagem acionável: erro compacto e útil permite autocorreção.</p>' }] },
          { rotulo: '5. Repetir', blocos: [{ tipo: 'texto', html: '<p>O loop recomeça até o modelo parar com <code>end_turn</code> ou o orçamento de passos (<code>max_passos</code>) acabar. Loop sem teto é fatura aberta.</p>' }] }
        ] },
        { tipo: 'callout', tom: 'info', titulo: 'Pedido externo, pipeline seu', html:
          '<p>Pense no modelo como um <strong>cliente que envia um comando serializado</strong> para o seu handler. Você tem o pipeline inteiro no meio: validação, autorização, log de auditoria, rate limit e a decisão de recusar. Ninguém aceitaria um sistema em que o request de um cliente externo executa direto no domínio sem passar pelo pipeline, e é exatamente isso que fazem os tutoriais que executam <code>eval()</code> no que o modelo devolveu. A definição da ferramenta é <strong>o contrato que você publica para esse cliente</strong>: nome, descrição, schema de entrada.</p>' },
        { tipo: 'takeaway', html: 'O modelo <mark>propõe</mark>, o seu código <mark>dispõe</mark>: a segurança mora na validação e na autorização antes de executar.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>O loop completo, em código</h3>' +
          '<p>Sem framework, para você ver a mecânica. <em>Exemplo de adapter; a trilha live é opcional e exige chave de API. O loop com teto executável vive no laboratório.</em> O exemplo condutor investiga um repositório com duas ferramentas.</p>' },
        { tipo: 'abas', rotulo: 'src/llm_lab/tools.py', itens: [
          { rotulo: 'Contratos', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto:
              'RAIZ = Path("./repo-analisado").resolve()      # sandbox: nada fora daqui\n\n\n' +
              '# 1. contratos de entrada das ferramentas (Pydantic, como sempre)\n\n' +
              'class LerArquivoIn(BaseModel):\n' +
              '    caminho: str = Field(description="Caminho relativo à raiz do repositório")\n\n\n' +
              'class BuscarSimboloIn(BaseModel):\n' +
              '    simbolo: str = Field(description="Nome exato de classe, método ou tabela")\n' +
              '    limite: int = Field(default=20, ge=1, le=50)' }] },
          { rotulo: 'Implementações', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto:
              '# 2. implementações: código normal, determinístico, testável\n\n' +
              'def ler_arquivo(entrada: LerArquivoIn) -> str:\n' +
              '    alvo = (RAIZ / entrada.caminho).resolve()\n' +
              '    if not alvo.is_relative_to(RAIZ):          # path traversal: recusa explícita\n' +
              '        return "ERRO: caminho fora do repositório. Use caminho relativo à raiz."\n' +
              '    if not alvo.is_file():\n' +
              '        return f"ERRO: \'{entrada.caminho}\' não existe. Use buscar_simbolo para localizar."\n' +
              '    texto = alvo.read_text(encoding="utf-8", errors="replace")\n' +
              '    if len(texto) > 20_000:                    # resposta econômica em tokens\n' +
              '        return texto[:20_000] + "\\n\\n[TRUNCADO em 20k chars — peça um trecho específico]"\n' +
              '    return texto\n\n\n' +
              'def buscar_simbolo(entrada: BuscarSimboloIn) -> str:\n' +
              '    achados: list[str] = []\n' +
              '    for arquivo in RAIZ.rglob("*.py"):\n' +
              '        for n, linha in enumerate(arquivo.read_text(errors="replace").splitlines(), 1):\n' +
              '            if entrada.simbolo in linha:\n' +
              '                achados.append(f"{arquivo.relative_to(RAIZ)}:{n}: {linha.strip()[:120]}")\n' +
              '                if len(achados) >= entrada.limite:\n' +
              '                    return "\\n".join(achados) + f"\\n[limite de {entrada.limite} atingido]"\n' +
              '    return "\\n".join(achados) if achados else (\n' +
              '        f"Nenhuma ocorrência de \'{entrada.simbolo}\'. "\n' +
              '        "Tente um nome parcial ou verifique a grafia."\n' +
              '    )' }] },
          { rotulo: 'Registro', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto:
              '# 3. registro: schema + implementação juntos\n\n' +
              'FERRAMENTAS: dict[str, tuple[type[BaseModel], Callable[[Any], str]]] = {\n' +
              '    "ler_arquivo": (LerArquivoIn, ler_arquivo),\n' +
              '    "buscar_simbolo": (BuscarSimboloIn, buscar_simbolo),\n' +
              '}\n\n' +
              'DEFINICOES = [\n' +
              '    {\n' +
              '        "name": "ler_arquivo",\n' +
              '        "description": (\n' +
              '            "Lê o conteúdo completo de um arquivo do repositório analisado. "\n' +
              '            "Use depois de localizar o caminho com buscar_simbolo."\n' +
              '        ),\n' +
              '        "input_schema": LerArquivoIn.model_json_schema(),\n' +
              '    },\n' +
              '    {\n' +
              '        "name": "buscar_simbolo",\n' +
              '        "description": (\n' +
              '            "Procura um identificador (classe, função, tabela) nos arquivos "\n' +
              '            "Python do repositório. Devolve caminho:linha das ocorrências."\n' +
              '        ),\n' +
              '        "input_schema": BuscarSimboloIn.model_json_schema(),\n' +
              '    },\n' +
              ']' }] },
          { rotulo: 'O loop', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto:
              '# 4. o loop: quem manda é o seu while\n\n' +
              'def investigar(pergunta: str, max_passos: int = 8) -> str:\n' +
              '    mensagens: list[dict[str, Any]] = [{"role": "user", "content": pergunta}]\n\n' +
              '    for passo in range(max_passos):\n' +
              '        resposta = client.messages.create(\n' +
              '            model="claude-sonnet-5",\n' +
              '            max_tokens=2000,\n' +
              '            temperature=0,\n' +
              '            tools=DEFINICOES,\n' +
              '            messages=mensagens,\n' +
              '        )\n' +
              '        mensagens.append({"role": "assistant", "content": resposta.content})\n\n' +
              '        if resposta.stop_reason != "tool_use":\n' +
              '            return "".join(b.text for b in resposta.content if b.type == "text")\n\n' +
              '        resultados: list[dict[str, Any]] = []\n' +
              '        for bloco in resposta.content:\n' +
              '            if bloco.type != "tool_use":\n' +
              '                continue\n' +
              '            modelo_entrada, funcao = FERRAMENTAS[bloco.name]\n' +
              '            try:\n' +
              '                entrada = modelo_entrada.model_validate(bloco.input)   # a fronteira\n' +
              '                saida = funcao(entrada)\n' +
              '                erro = False\n' +
              '            except Exception as exc:                                   # erro compacto (fator 9)\n' +
              '                saida, erro = f"ERRO de argumento: {exc}", True\n' +
              '            print(f"  [passo {passo}] {bloco.name}({bloco.input}) -> {len(saida)} chars")\n' +
              '            resultados.append(\n' +
              '                {\n' +
              '                    "type": "tool_result",\n' +
              '                    "tool_use_id": bloco.id,\n' +
              '                    "content": saida,\n' +
              '                    "is_error": erro,\n' +
              '                }\n' +
              '            )\n' +
              '        mensagens.append({"role": "user", "content": resultados})\n\n' +
              '    return "PARADO: orçamento de passos esgotado sem resposta final."' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Quatro decisões que valem uma discussão de code review</h3>' +
          '<ul>' +
          '<li><strong>Orçamento de passos (<code>max_passos</code>).</strong> Loop de agente sem teto é uma fatura aberta. O retorno explícito de "parado por orçamento" é melhor que travar, e vira métrica no M06.</li>' +
          '<li><strong>Validação com Pydantic antes de executar.</strong> O <code>input</code> vindo do modelo é dado não confiável. Sem esse passo, um argumento fora do schema vira <code>KeyError</code> no meio da sua função.</li>' +
          '<li><strong>Erro volta como <code>tool_result</code> com <code>is_error</code>, não como exceção.</strong> É o fator 9 (erros compactos no contexto): o modelo lê "ERRO: caminho fora do repositório. Use caminho relativo" e se corrige sozinho no próximo passo. Erro <em>acionável</em> economiza turnos; stack trace de 200 linhas só enche a janela.</li>' +
          '<li><strong>Sandbox por construção.</strong> <code>is_relative_to(RAIZ)</code> não é paranoia: o modelo <em>vai</em> pedir <code>../../etc/passwd</code> se algum arquivo do repositório mandar (prompt injection indireta, M12). Fronteira mecânica, não instrução no prompt.</li></ul>' },
        { tipo: 'rode', id: 'm05b3-rode', titulo: 'Acompanhe o loop passo a passo', enunciado: 'Rode o loop com um modelo fake roteirizado (saída ilustrativa) e clique em cada passo para ler só as linhas dele.',
          prefixo: '$', entrada: 'python investigar.py "onde o total do pedido é calculado?"', unidade: 'etapa', terminalTitulo: 'investigar (modelo fake)', etapas: etapasLoop(),
          prever: { pergunta: 'No passo 0 o modelo responde com stop_reason="tool_use" e um buscar_simbolo. Quem executa a busca?', opcoes: [
            { id: 'a', texto: 'O modelo, dentro do provedor, antes de responder.', correta: false, porque: 'o modelo só emite o JSON da chamada pretendida.' },
            { id: 'b', texto: 'O seu código, depois de validar o input e decidir executar.', correta: true, porque: 'o loop é do seu while: validar, autorizar, executar ou recusar e devolver tool_result.' },
            { id: 'c', texto: 'O SDK do provedor, sem passar pelo seu código.', correta: false, porque: 'o SDK transporta a chamada; a execução da função é sua.' }
          ] },
          tutorAntes: 'Aperte Enter e depois clique em "Passo 0: seu código" para ver a validação antes da execução.',
          tutorDepois: 'Foram três chamadas ao modelo e duas execuções do seu código. Repare que, a cada passo, o histórico inteiro vai de novo na chamada: é o custo que o bloco 5 (cache) ataca.',
          callout: 'Você viu o modelo propor e o seu código dispor, passo a passo.' },
        { tipo: 'takeaway', html: 'Valide o <mark>input</mark>, devolva <mark>erro acionável</mark> e ponha <mark>teto de passos</mark>: o while é seu.' }
      ] },

      { rotulo: 'Design e limites', blocos: [
        { tipo: 'texto', html:
          '<h3>Design de ferramenta é design de API pública</h3>' +
          '<p>Retomando o M03, bloco 1, com um consumidor novo. As regras clássicas valem, com pesos diferentes.</p>' +
          '<ul>' +
          '<li><strong>Nome e descrição são a documentação inteira.</strong> O modelo escolhe a ferramenta lendo nome e descrição. <code>buscar_simbolo</code> com "devolve caminho:linha" é escolhível; <code>query_index</code> com "consulta o índice" não é.</li>' +
          '<li><strong>Poucas ferramentas, bem escolhidas.</strong> A precisão de seleção cai conforme o catálogo cresce: 5 a 8 é confortável, 15 é território de erro. Se precisa de muitas, agrupe por domínio e use subagentes (M08).</li>' +
          '<li><strong>Erro é interface.</strong> Mensagem de erro que diz <em>o que fazer em seguida</em> transforma falha em recuperação. É o ProblemDetails (M03) escrito para um leitor que segue instruções literalmente.</li>' +
          '<li><strong>Resposta econômica em tokens.</strong> Ferramenta que devolve 50 mil tokens de JSON envenena a janela nos próximos turnos. Trunque, pagine e diga que truncou.</li>' +
          '<li><strong>Idempotência e reversibilidade (M01, bloco 3).</strong> Ferramenta de leitura pode ser chamada à vontade; ferramenta que muda estado precisa de chave de idempotência e, se for irreversível, de aprovação humana (M12). A pergunta de design é sempre: "o que acontece se o modelo chamar isto duas vezes?".</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Structured output ou tool calling?', html:
          '<p>Os dois existem nativamente, e a confusão é comum. <strong>Structured output controla o que o modelo DIZ</strong> (o formato da resposta final); <strong>tool calling controla o que o modelo PEDE</strong> (chamadas intermediárias). Extrair dados de um documento é structured output: uma chamada, sem loop. Investigar um repositório é tool calling: várias chamadas, com loop.</p>' +
          '<p>Eles se combinam: um agente pode usar ferramentas por vários turnos e, no último, entregar a resposta final em formato estruturado (na API da Anthropic, os dois parâmetros convivem na mesma requisição; nas ferramentas há ainda <code>strict: true</code> para validar os argumentos com rigor de schema). O antipadrão morto: declarar uma ferramenta falsa chamada <code>responder</code> só para conseguir JSON, gambiarra da era pré-structured output.</p>' },
        { tipo: 'ordene', id: 'm05b3-ordene', titulo: 'Ponha o loop na ordem', obrigatorio: false,
          enunciado: 'Ordene os cinco passos do loop de tool calling, do envio inicial até a parada.',
          itens: [
            { id: 'volta', texto: 'O resultado volta como tool_result (com is_error se foi recusado)' },
            { id: 'enviar', texto: 'Seu código envia as mensagens e as definições das tools' },
            { id: 'repete', texto: 'O loop recomeça até end_turn ou até max_passos acabar' },
            { id: 'decide', texto: 'Seu código valida o input, autoriza e executa ou recusa' },
            { id: 'propoe', texto: 'O modelo emite tool_use {name, input} com stop_reason="tool_use"; nada foi executado' }
          ],
          solucao: ['enviar', 'propoe', 'decide', 'volta', 'repete'],
          dica: 'Quem decide executar vem depois de o modelo propor e antes de o resultado voltar.',
          tutorDepois: 'A seta 3 (valida, autoriza, executa ou recusa) é onde mora toda a segurança do sistema.',
          callout: 'Você pôs o loop na ordem: enviar, propor, decidir, devolver, repetir.' },
        { tipo: 'quebre', id: 'm05b3-quebre', titulo: 'Sabote o loop e veja a defesa', obrigatorio: false,
          enunciado: 'Rode o loop sem falha e depois com cada sabotagem: descrição vaga, caminho fora da raiz e um modelo que nunca para.',
          prefixo: '$', entrada: 'python investigar.py "onde o total do pedido é calculado?"', unidade: 'etapa', terminalTitulo: 'investigar (modelo fake)', etapas: etapasLoop(),
          falhas: [
            { id: 'descricao', rotulo: 'descrição vaga: query_index "consulta o índice"', efeito: { etapaFalha: 'p0', linhasErro: [
              L('info', 'tools: query_index("consulta o índice"), ler_arquivo(...)'),
              L('in', 'tool_use: ler_arquivo {"caminho": "total"}   (o modelo adivinhou: nome e descrição não dizem o que query_index devolve)'),
              L('out', 'tool_result is_error: ERRO: \'total\' não existe. Use buscar_simbolo para localizar.'),
              L('hint', 'sem "devolve caminho:linha" na descrição, a ferramenta certa não é escolhível; erro acionável ainda salva o passo seguinte')], tutor: 'nome e descrição são a documentação inteira: o modelo não tem outro lugar para entender a ferramenta.' } },
            { id: 'caminho', rotulo: 'pedido de ../../etc/passwd', efeito: { etapaFalha: 'e1', linhasErro: [
              L('in', 'tool_use: ler_arquivo {"caminho": "../../etc/passwd"}'),
              L('out', 'is_relative_to(RAIZ): False -> recusado, nada foi lido'),
              L('out', 'tool_result is_error: ERRO: caminho fora do repositório. Use caminho relativo à raiz.'),
              L('in', 'passo seguinte: tool_use: ler_arquivo {"caminho": "app/pedido.py"}   (autocorreção)'),
              L('hint', 'fronteira mecânica, não instrução no prompt: a recusa não depende de o modelo obedecer')], tutor: 'o modelo vai pedir o caminho se algum arquivo do repositório mandar (prompt injection indireta, M12). A recusa é do código.' } },
            { id: 'teto', rotulo: 'modelo que nunca para (max_passos=3)', efeito: { etapaFalha: 'p2', linhasErro: [
              L('in', 'passo 2: tool_use: ler_arquivo {"caminho": "app/pedido.py"}   (de novo)'),
              L('out', 'PARADO: orçamento de passos esgotado sem resposta final.'),
              L('hint', 'o teto transformou uma fatura aberta num resultado explícito, que vira métrica no M06')], tutor: 'loop sem teto é fatura aberta; cada passo reenvia o histórico, e o custo cresce com os passos.' } }
          ],
          tutorAntes: 'Comece por Sem falha. Depois escolha uma sabotagem e rode de novo.',
          tutorDepois: 'Cada defesa está no lugar certo: descrição boa na definição, sandbox no código e teto no loop. Nenhuma depende de o modelo se comportar.',
          callout: 'Você viu as três defesas do loop funcionarem.' },
        { tipo: 'takeaway', html: 'Ferramenta é <mark>API pública</mark> para um consumidor literal: poucas, bem descritas, com <mark>erro acionável</mark> e resposta econômica em tokens.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Escreva o seu while</h3>' +
          '<p>No laboratório guiado o loop roda contra um repositório fake com um modelo roteirizado. Aqui, o modelo fake devolve respostas fixas e você escreve a parte que não pode falhar: sandbox, fronteira de validação e o loop com teto.</p>' },
        { tipo: 'python', id: 'm05b3-python', titulo: 'Loop de tool calling com teto e sandbox', obrigatorio: false,
          enunciado: 'Complete <code>ler_arquivo</code> (recusa caminho absoluto ou que sai da raiz com um <code>ERRO:</code> acionável), <code>executar</code> (input inválido ou saída que começa com <code>ERRO</code> vira <code>is_error True</code>, sem levantar) e <code>investigar</code> (devolve o texto quando o <code>stop_reason</code> não é <code>tool_use</code>; senão devolve os <code>tool_result</code> numa mensagem <code>user</code>; respeita <code>max_passos</code>).',
          codigo: codigoPy, testes: testesPy,
          dica: 'Normalize com <code>posixpath.normpath</code> e recuse o que começa com <code>/</code> ou <code>..</code>. No loop, monte <code>resultados = [executar(b) for b in ... if b["type"] == "tool_use"]</code> e anexe como mensagem <code>user</code>.',
          solucao: solucaoPy,
          tutorDepois: 'O controle negativo importa: leitura válida não é erro. E o teste de orçamento prova que um modelo que nunca para termina em "PARADO", com exatamente max_passos chamadas.',
          callout: 'O loop passou nos testes: sandbox, validação na fronteira e teto de passos.' },
        { tipo: 'cenario', id: 'm05b3-cenario', titulo: 'Duas ferramentas que mudam estado', obrigatorio: false,
          enunciado: 'O time quer dar ao agente <code>apagar_arquivo</code> e <code>aplicar_migracao</code>. O modelo pode repetir a chamada por retry. Decida o desenho e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'As duas ferramentas mudam estado, e uma delas é irreversível. Qual é a pergunta de design e a resposta?', opcoes: [
              { texto: 'Acrescentar ao prompt: "nunca chame a mesma ferramenta duas vezes".', vai: 'f-prompt', tom: 'ruim', consequencia: 'instrução não é barreira; o retry duplica o efeito.' },
              { texto: 'Perguntar "o que acontece se o modelo chamar isto duas vezes?": chave de idempotência e aprovação humana para o que é irreversível.', vai: 'catalogo', tom: 'ok', consequencia: 'a segurança fica no pipeline seu (M12), não na obediência do modelo.' },
              { texto: 'Deixar executar direto: o modelo é confiável com temperature 0.', vai: 'f-direto', tom: 'ruim', consequencia: 'temperatura 0 não é determinismo, e dado do modelo é dado não confiável.' }
            ] },
            catalogo: { texto: 'O catálogo do agente chegou a 15 ferramentas e a escolha do modelo ficou errática. O que fazer?', opcoes: [
              { texto: 'Agrupar por domínio e usar subagentes (M08), mantendo de 5 a 8 ferramentas por contexto.', vai: 'f-bom', tom: 'ok', consequencia: 'a precisão de seleção volta ao território confortável.' },
              { texto: 'Manter as 15 e reforçar as descrições com parágrafos longos.', vai: 'f-longo', tom: 'ruim', consequencia: 'o catálogo grande continua em território de erro, e as descrições longas pesam em toda chamada.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Ferramentas que mudam estado têm idempotência e aprovação; o catálogo ficou pequeno por contexto.' },
            'f-prompt': { bom: false, texto: 'No primeiro retry, a migração rodou duas vezes.' },
            'f-direto': { bom: false, texto: 'Um arquivo foi apagado por um pedido que nenhuma regra mecânica barrou.' },
            'f-longo': { bom: false, texto: 'O modelo continuou errando de ferramenta, e a fatura de entrada subiu.' }
          },
          callout: 'Você aplicou idempotência, aprovação humana e catálogo pequeno.' },
        { tipo: 'escolha', id: 'm05b3-escolha-erro', titulo: 'Confira: erro que ajuda',
          pergunta: 'A ferramenta recusou um caminho fora da raiz. Qual retorno ajuda o modelo a se corrigir sozinho com menos tokens?',
          opcoes: [
            { id: 'a', texto: '<code>tool_result</code> com <code>is_error</code> e a mensagem "ERRO: caminho fora do repositório. Use caminho relativo à raiz."', correta: true, porque: 'erro acionável e compacto economiza turnos e deixa o modelo se corrigir.' },
            { id: 'b', texto: 'O stack trace completo da exceção (200 linhas).', correta: false, porque: 'só enche a janela, sem dizer o que fazer.' },
            { id: 'c', texto: 'Levantar a exceção e encerrar o processo.', correta: false, porque: 'perde-se o loop; erro é interface, e o modelo poderia ter se corrigido.' },
            { id: 'd', texto: 'Devolver a string vazia, sem is_error.', correta: false, porque: 'o modelo não sabe se falhou ou se o arquivo é vazio.' }
          ], tutorDepois: 'Erro é interface: diga o que fazer em seguida.' },
        { tipo: 'escolha', id: 'm05b3-escolha-escolher', titulo: 'Confira: extrair ou investigar',
          pergunta: 'Você precisa extrair os campos de um contrato em PDF numa única chamada e, em outro serviço, investigar um repositório com várias consultas. Qual mecanismo para cada um?',
          opcoes: [
            { id: 'a', texto: 'Contrato: structured output, uma chamada, sem loop. Repositório: tool calling, com loop e teto de passos.', correta: true, porque: 'structured output controla o que o modelo diz; tool calling, o que ele pede.' },
            { id: 'b', texto: 'Os dois com tool calling, usando uma ferramenta "responder" para o contrato.', correta: false, porque: 'a ferramenta falsa é gambiarra pré-structured output.' },
            { id: 'c', texto: 'Os dois com structured output, porque tool calling é legado.', correta: false, porque: 'investigar exige chamadas intermediárias, que é o que tool calling oferece.' },
            { id: 'd', texto: 'Contrato com tool calling e repositório sem loop.', correta: false, porque: 'está invertido: a investigação precisa de loop; a extração, não.' }
          ], tutorDepois: 'Um diz, o outro pede; e eles podem se combinar.' },
        { tipo: 'takeaway', html: 'O <mark>seu while</mark> manda: <mark>teto</mark>, <mark>sandbox</mark> e erro acionável fazem o agente seguro.' }
      ] }
    ]
  });
})();
