/* M09 · Bloco 4: Construindo o servidor. Fonte: M09.html#b04. Especificação MCP revisão 2026-07-28, verificada em 14/09/2026 (revalidar em até 90 dias). Exemplos FastMCP são trilha externa; o exercício usa só dicts. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = String.raw`class ToolError(Exception):
    """Erro que volta ao modelo como observação, sem stack trace."""


INDICE = {
    "acme": {
        "PagamentoService": [
            {"caminho": "src/api/checkout.py", "linha": 44, "papel": "uso"},
            {"caminho": "src/pagamento.py", "linha": 10, "papel": "definicao"},
            {"caminho": "src/jobs/fatura.py", "linha": 7, "papel": "uso"},
        ],
        "CalcularJuros": [{"caminho": "services/juros.py", "linha": 42, "papel": "definicao"}],
    },
    "beta": {"Fatura": [{"caminho": "app/fatura.py", "linha": 3, "papel": "definicao"}]},
}


def validar_args(args):
    """None se válido; senão a mensagem. simbolo: str de 2 a 120; limite: int de 1 a 50 (padrão 20); nenhum outro campo."""
    return None


def buscar_simbolo(args, ctx):
    """Texto 'caminho:linha papel' por linha, definições primeiro, no máximo "limite".

    O índice vem de ctx["tenant"] (runtime), nunca do argumento.
    ToolError acionável se o tenant faltar ou se não houver ocorrência.
    """
    return ""


TOOLS = {
    "repo_buscar_simbolo": {
        "description": "Localiza onde um identificador aparece. Use quando tiver o nome exato.",
        "inputSchema": {"type": "object", "required": ["simbolo"], "properties": {
            "simbolo": {"type": "string", "minLength": 2, "maxLength": 120},
            "limite": {"type": "integer", "minimum": 1, "maximum": 50, "default": 20}}},
        "annotations": {"readOnlyHint": True, "openWorldHint": False},
        "fn": buscar_simbolo,
    }
}


def resposta(mid, result):
    return {"jsonrpc": "2.0", "id": mid, "result": result}


def erro(mid, code, msg):
    return {"jsonrpc": "2.0", "id": mid, "error": {"code": code, "message": msg}}


def despachar(msg, ctx):
    mid, metodo, params = msg.get("id"), msg.get("method"), msg.get("params", {})
    if metodo == "tools/list":
        lista = [{"name": n, "description": t["description"], "inputSchema": t["inputSchema"],
                  "annotations": t["annotations"]} for n, t in TOOLS.items()]
        return resposta(mid, {"tools": lista})
    if metodo != "tools/call":
        return erro(mid, -32601, "método desconhecido: " + str(metodo))
    tool = TOOLS.get(params.get("name"))
    if tool is None:
        return erro(mid, -32601, "tool desconhecida")
    args = params.get("arguments", {})
    problema = validar_args(args)
    if problema:
        return erro(mid, -32602, problema)
    try:
        texto = tool["fn"](args, ctx)
    except ToolError as e:
        texto = "ERRO: " + str(e)
    return resposta(mid, {"content": [{"type": "text", "text": texto}]})


def chamar(args, ctx, mid=1):
    return despachar({"jsonrpc": "2.0", "id": mid, "method": "tools/call",
                      "params": {"name": "repo_buscar_simbolo", "arguments": args}}, ctx)


print(chamar({"simbolo": "PagamentoService"}, {"tenant": "acme"}))
`;
  var testes = String.raw`ACME = {"tenant": "acme"}


def texto(r):
    return r["result"]["content"][0]["text"]


def test_lista_expoe_annotations_e_schema():
    r = despachar({"jsonrpc": "2.0", "id": 1, "method": "tools/list"}, ACME)
    t = r["result"]["tools"][0]
    assert t["name"] == "repo_buscar_simbolo" and t["annotations"]["readOnlyHint"] is True
    assert t["inputSchema"]["properties"]["limite"]["maximum"] == 50


def test_definicao_vem_primeiro():
    linhas = texto(chamar({"simbolo": "PagamentoService"}, ACME)).splitlines()
    assert linhas[0] == "src/pagamento.py:10 definicao" and len(linhas) == 3


def test_limite_corta_o_resultado():
    linhas = texto(chamar({"simbolo": "PagamentoService", "limite": 1}, ACME)).splitlines()
    assert linhas == ["src/pagamento.py:10 definicao"]


def test_inexistente_da_erro_que_ensina():
    r = chamar({"simbolo": "NaoExiste"}, ACME)
    assert "error" not in r
    t = texto(r)
    assert t.startswith("ERRO:") and "verifique a grafia" in t.lower() and "2 símbolos" in t
    assert "Traceback" not in t


def test_limite_acima_do_maximo_e_rejeitado_pelo_schema():
    assert chamar({"simbolo": "X1", "limite": 100000}, ACME)["error"]["code"] == -32602
    assert chamar({"simbolo": "X1", "limite": True}, ACME)["error"]["code"] == -32602
    assert chamar({"simbolo": "X"}, ACME)["error"]["code"] == -32602
    assert chamar({}, ACME)["error"]["code"] == -32602


def test_escopo_nao_vem_do_argumento():
    r = chamar({"simbolo": "Fatura", "tenant_id": "beta"}, ACME)
    assert r["error"]["code"] == -32602 and "tenant_id" in r["error"]["message"]
    assert texto(chamar({"simbolo": "Fatura"}, ACME)).startswith("ERRO:")


def test_escopo_vem_do_contexto():
    assert texto(chamar({"simbolo": "Fatura"}, {"tenant": "beta"})) == "app/fatura.py:3 definicao"


def test_sem_tenant_no_contexto_e_erro_de_configuracao():
    assert "mal configurado" in texto(chamar({"simbolo": "CalcularJuros"}, {})).lower()
`;
  var solucao = String.raw`class ToolError(Exception):
    """Erro que volta ao modelo como observação, sem stack trace."""


INDICE = {
    "acme": {
        "PagamentoService": [
            {"caminho": "src/api/checkout.py", "linha": 44, "papel": "uso"},
            {"caminho": "src/pagamento.py", "linha": 10, "papel": "definicao"},
            {"caminho": "src/jobs/fatura.py", "linha": 7, "papel": "uso"},
        ],
        "CalcularJuros": [{"caminho": "services/juros.py", "linha": 42, "papel": "definicao"}],
    },
    "beta": {"Fatura": [{"caminho": "app/fatura.py", "linha": 3, "papel": "definicao"}]},
}


def validar_args(args):
    if not isinstance(args, dict):
        return "argumentos devem ser objeto"
    extra = set(args) - {"simbolo", "limite"}
    if extra:
        return "argumento não permitido: " + ", ".join(sorted(extra))
    simbolo = args.get("simbolo")
    if not isinstance(simbolo, str) or not 2 <= len(simbolo) <= 120:
        return "simbolo deve ser string de 2 a 120 caracteres"
    limite = args.get("limite", 20)
    if isinstance(limite, bool) or not isinstance(limite, int) or not 1 <= limite <= 50:
        return "limite deve ser inteiro de 1 a 50"
    return None


def buscar_simbolo(args, ctx):
    """Texto 'caminho:linha papel' por linha, definições primeiro, no máximo "limite".

    O índice vem de ctx["tenant"] (runtime), nunca do argumento.
    ToolError acionável se o tenant faltar ou se não houver ocorrência.
    """
    tenant = ctx.get("tenant")
    if tenant not in INDICE:
        raise ToolError("Servidor mal configurado: defina o tenant na configuração do cliente MCP.")
    indice = INDICE[tenant]
    simbolo = args["simbolo"]
    achados = indice.get(simbolo, [])
    if not achados:
        raise ToolError(
            f"Nenhuma ocorrência de '{simbolo}'. Verifique a grafia ou tente um nome parcial. "
            f"O repositório tem {len(indice)} símbolos indexados."
        )
    achados = sorted(achados, key=lambda o: o["papel"] != "definicao")
    limite = args.get("limite", 20)
    return "\n".join(f"{o['caminho']}:{o['linha']} {o['papel']}" for o in achados[:limite])


TOOLS = {
    "repo_buscar_simbolo": {
        "description": "Localiza onde um identificador aparece. Use quando tiver o nome exato.",
        "inputSchema": {"type": "object", "required": ["simbolo"], "properties": {
            "simbolo": {"type": "string", "minLength": 2, "maxLength": 120},
            "limite": {"type": "integer", "minimum": 1, "maximum": 50, "default": 20}}},
        "annotations": {"readOnlyHint": True, "openWorldHint": False},
        "fn": buscar_simbolo,
    }
}


def resposta(mid, result):
    return {"jsonrpc": "2.0", "id": mid, "result": result}


def erro(mid, code, msg):
    return {"jsonrpc": "2.0", "id": mid, "error": {"code": code, "message": msg}}


def despachar(msg, ctx):
    mid, metodo, params = msg.get("id"), msg.get("method"), msg.get("params", {})
    if metodo == "tools/list":
        lista = [{"name": n, "description": t["description"], "inputSchema": t["inputSchema"],
                  "annotations": t["annotations"]} for n, t in TOOLS.items()]
        return resposta(mid, {"tools": lista})
    if metodo != "tools/call":
        return erro(mid, -32601, "método desconhecido: " + str(metodo))
    tool = TOOLS.get(params.get("name"))
    if tool is None:
        return erro(mid, -32601, "tool desconhecida")
    args = params.get("arguments", {})
    problema = validar_args(args)
    if problema:
        return erro(mid, -32602, problema)
    try:
        texto = tool["fn"](args, ctx)
    except ToolError as e:
        texto = "ERRO: " + str(e)
    return resposta(mid, {"content": [{"type": "text", "text": texto}]})


def chamar(args, ctx, mid=1):
    return despachar({"jsonrpc": "2.0", "id": mid, "method": "tools/call",
                      "params": {"name": "repo_buscar_simbolo", "arguments": args}}, ctx)
`;

  var serverPy = [
    '@mcp.tool(annotations={"readOnlyHint": True, "idempotentHint": True, "openWorldHint": False})',
    'async def repo_buscar_simbolo(',
    '    simbolo: Annotated[str, Field(',
    '        description="Nome EXATO de classe, método, tabela ou constante. "',
    '                    "Para busca conceitual use repo_buscar_conceito.",',
    '        min_length=2, max_length=120)],',
    '    tipo: Annotated[Literal["classe", "metodo", "tabela", "config"] | None, Field(',
    '        description="Filtra por tipo. Omita para buscar em todos.")] = None,',
    '    limite: Annotated[int, Field(ge=1, le=50, description="Máximo de ocorrências.")] = 20,',
    '    ctx: Context = None,          # injetado pelo FastMCP: logging, progresso, elicitação',
    ') -> list[Ocorrencia]:',
    '    """Localiza onde um identificador aparece no repositório.',
    '',
    '    Use quando: você tem o nome exato de um símbolo e precisa saber onde ele é',
    '    definido e onde é usado.',
    '    NÃO use quando: a pergunta é conceitual ("como funciona a autenticação") —',
    '    use repo_buscar_conceito.',
    '    Devolve: ocorrências com caminho, linhas, papel (definição/uso) e o trecho.',
    '    Definições vêm primeiro.',
    '    """',
    '    escopo = _escopo_da_requisicao(ctx)        # tenant/repo do RUNTIME, não do modelo',
    '    achados = await buscar_lexico(simbolo, escopo, tipo=tipo, limite=limite)',
    '    if not achados:',
    '        await ctx.info(f"nenhuma ocorrência de {simbolo!r}")',
    '        raise ToolError(',
    '            f"Nenhuma ocorrência de \'{simbolo}\'. Verifique a grafia ou tente um nome "',
    '            f"parcial. O repositório tem {escopo.total_simbolos} símbolos indexados."',
    '        )',
    '    return achados'].join('\n');

  var outrosPy = [
    '# --- tool de fluxo: faz busca + leitura + travessia por dentro',
    '@mcp.tool(annotations={"readOnlyHint": True, "openWorldHint": False})',
    'async def repo_impacto_de_mudanca(simbolo: str, ctx: Context = None) -> dict[str, object]:',
    '    """Analisa o que quebra se um símbolo mudar de assinatura ou comportamento.',
    '    Use quando: a pergunta é sobre impacto, dependências ou risco de alterar algo.',
    '    Devolve: resumo, itens afetados (caminho/linhas/tipo/severidade) e o que NÃO',
    '    foi possível verificar."""',
    '    escopo = _escopo_da_requisicao(ctx)',
    '    await ctx.report_progress(0, 3, "localizando definição")',
    '    resultado = await impacto_de_mudanca(simbolo, escopo, progresso=ctx.report_progress)',
    '    return resultado.model_dump()',
    '',
    '# --- resources: o usuário anexa; não gastam tokens quando não usados',
    '@mcp.resource("repo://{repo}/arquitetura", mime_type="text/markdown")',
    'async def arquitetura(repo: str) -> str: ...',
    '@mcp.resource("repo://{repo}/metricas", mime_type="application/json")',
    'async def metricas(repo: str) -> str: ...',
    '',
    '# --- prompt: vira slash command no cliente',
    '@mcp.prompt(name="analisar-impacto")',
    'def analisar_impacto(simbolo: str) -> str: ...',
    '',
    'if __name__ == "__main__":',
    '    mcp.run()          # stdio por padrão; mcp.run(transport="http", port=8080) para HTTP'].join('\n');

  var escopoPy = [
    '@dataclass(frozen=True, slots=True)',
    'class Escopo:',
    '    tenant_id: int',
    '    repo_id: int',
    '    total_simbolos: int',
    '',
    'def _escopo_da_requisicao(ctx: Context) -> Escopo:',
    '    """stdio: vem da configuração do processo. HTTP: vem do token autenticado."""',
    '    if (token := _token_do_request(ctx)) is not None:          # transporte HTTP',
    '        claims = verificar_jwt(token)                          # assinatura + expiração',
    '        return _carregar_escopo(int(claims["tenant_id"]), int(claims["repo_id"]))',
    '    tenant = os.environ.get("CARTOGRAFO_TENANT_ID")            # transporte stdio',
    '    repo = os.environ.get("CARTOGRAFO_REPO_ID")',
    '    if not tenant or not repo:',
    '        raise ToolError(',
    '            "Servidor mal configurado: defina CARTOGRAFO_TENANT_ID e CARTOGRAFO_REPO_ID "',
    '            "na configuração do cliente MCP."',
    '        )',
    '    return _carregar_escopo(int(tenant), int(repo))'].join('\n');

  var testePy = [
    '@pytest.mark.asyncio',
    'async def test_lista_ferramentas_esperadas() -> None:',
    '    async with Client(mcp) as cliente:                 # conecta em memória',
    '        ferramentas = {t.name for t in await cliente.list_tools()}',
    '    assert ferramentas == {"repo_buscar_simbolo", "repo_buscar_conceito", "repo_impacto_de_mudanca"}',
    '',
    '@pytest.mark.asyncio',
    'async def test_simbolo_inexistente_da_erro_que_ensina() -> None:',
    '    async with Client(mcp) as cliente:',
    '        with pytest.raises(Exception) as exc:',
    '            await cliente.call_tool("repo_buscar_simbolo", {"simbolo": "NaoExiste"})',
    '    assert "verifique a grafia" in str(exc.value).lower()      # erro acionável (M08 b3)',
    '',
    '@pytest.mark.asyncio',
    'async def test_limite_acima_do_maximo_e_rejeitado_pelo_schema() -> None:',
    '    async with Client(mcp) as cliente:',
    '        with pytest.raises(Exception):',
    '            await cliente.call_tool("repo_buscar_simbolo", {"simbolo": "X", "limite": 100_000})'].join('\n');

  TrilhaAula.registrar({
    id: 'm09-b4',
    titulo: 'Construindo o servidor: granularidade, escopo e erro',
    minutos: 45,
    resumo: 'Poucas tools de alto impacto, resources para o que o usuário anexa e prompts para fluxos prontos. O escopo vem do runtime (nunca de argumento), o erro ensina o modelo e o servidor se testa sem cliente.',
    objetivo: 'Decidir a granularidade do servidor, derivar o escopo do runtime, devolver erros acionáveis, limitar parâmetros pelo schema e testar o servidor sem assistente aberto.',
    revisao: [
      { id: 'm09b4-tenant', pergunta: 'Uma ferramenta recebe tenant_id como parâmetro preenchido pelo modelo. Qual é o risco?',
        opcoes: [
          opc('a', 'Confused deputy: o modelo (ou um documento malicioso que o instrua) pode trocar o tenant e ler dados de outro cliente; o escopo deve vir do runtime/token', true, 'argumento vindo do modelo é dado não confiável; em stdio o escopo vem da configuração do processo e em HTTP, do token autenticado.'),
          opc('b', 'Nenhum, se o schema validar o tipo', false, 'o tipo válido não torna o valor autorizado.'),
          opc('c', 'Apenas custo de tokens', false, 'o risco é de acesso, não de custo.')] },
      { id: 'm09b4-gran', pergunta: 'Qual desenho de servidor é melhor para um assistente que investiga legado?',
        opcoes: [
          opc('a', 'Poucas ferramentas de alto impacto, uma delas (repo_impacto_de_mudanca) fazendo busca + leitura + travessia internamente', true, 'construa para fluxos, não para endpoints: menos passos para o modelo e controle do algoritmo para você.'),
          opc('b', '12 ferramentas, uma por endpoint, para dar liberdade ao modelo', false, 'cada ferramenta custa tokens em toda chamada.'),
          opc('c', 'Uma única ferramenta executar(comando) genérica', false, 'superfície enorme e nenhum contrato.')] },
      { id: 'm09b4-erro', pergunta: 'Qual é o cuidado com o erro devolvido por uma ferramenta?',
        opcoes: [
          opc('a', 'Texto acionável que volta ao modelo como observação (ToolError), sem stack trace e sem detalhe interno', true, 'exceção comum pode vazar caminho absoluto ou string de conexão; use o tipo próprio e controle a mensagem.'),
          opc('b', 'Deixar a exceção subir com o stack trace para ajudar a depurar', false, 'vaza detalhe interno para o cliente.'),
          opc('c', 'Devolver lista vazia sem explicação', false, 'o modelo não sabe o que tentar em seguida.')] },
      { id: 'm09b4-schema', pergunta: 'Por que declarar limites nos parâmetros (le=50, max_length=500)?',
        opcoes: [
          opc('a', 'O schema é a validação e roda antes do seu código; sem ele, limite=100000 vira consumo de contexto e de banco', true, 'o limite é parte do contrato da ferramenta.'),
          opc('b', 'Para o modelo escrever argumentos mais bonitos', false, 'o efeito é de validação e proteção de recursos.'),
          opc('c', 'Não é necessário se houver rate limit', false, 'rate limit não impede uma única chamada enorme.')] },
      { id: 'm09b4-testar', pergunta: 'O que a suíte de testes em memória do servidor MCP cobre?',
        opcoes: [
          opc('a', 'O contrato (lista de ferramentas), o comportamento (definição primeiro) e as fronteiras (erro útil, limite imposto), sem processo, rede ou chave de API', true, 'é a pirâmide do M02 bloco 6 aplicada à superfície do protocolo.'),
          opc('b', 'Só se o Claude Code estiver aberto', false, 'servidor MCP é testável como qualquer código.'),
          opc('c', 'Apenas o transporte HTTP', false, 'o núcleo é testado sem transporte.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Agora o servidor de verdade: o que expõe o índice e o grafo do sistema legado, usável pelo Claude Code, por outro assistente e pelo seu próprio agente. A versão genérica dele (expor um sistema corporativo a assistentes de IA) é serviço com demanda real.</p>' +
          '<p><strong>FastMCP</strong> é o framework Python de fato para servidores MCP; o nome ecoa o FastAPI e a ergonomia é a mesma: você decora funções e ele cuida do schema a partir dos type hints, da validação, do transporte, da autenticação e da compatibilidade de protocolo. Cobre <strong>servidores</strong>, <strong>clientes</strong> (úteis em testes) e <strong>apps</strong> (UI na conversa). Diferente do caso dos agentes (M08 bloco 7), aqui o framework vale: <strong>protocolo é commodity e muda rápido</strong>, então deixar a conformidade com a revisão para a biblioteca é a divisão de trabalho certa. Mantenha-o atualizado e leia o changelog. Os exemplos FastMCP desta aula são trilha externa; o laboratório implementa o mesmo princípio sem SDK, com registros, schema e descrição.</p>' +
          '<p>Em frameworks de servidor MCP, decoradores e assinatura tipada geram o contrato, e a <strong>docstring é parte funcional da API</strong>, porque quem a lê é um modelo.</p>' +
          '<h3>Granularidade, antes da primeira linha</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Capacidade</th><th>Primitiva</th><th>Por quê</th></tr></thead><tbody>' +
          '<tr><td>buscar símbolo, buscar conceito, ler trecho, impacto de mudança</td><td><strong>tool</strong></td><td>o modelo decide quando precisa</td></tr>' +
          '<tr><td>mapa de arquitetura, métricas de acoplamento, README gerado</td><td><strong>resource</strong></td><td>o usuário anexa quando quer; não gasta tokens quando não usa</td></tr>' +
          '<tr><td>"analisar impacto de mudança", "revisar plano de modernização"</td><td><strong>prompt</strong></td><td>fluxo pronto que o usuário dispara (slash command no cliente)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Poucas tools, não doze', html:
          '<p>A decisão que mais economiza contexto. Uma <code>repo_impacto_de_mudanca</code> que faz internamente busca + leitura + travessia vale mais que expor as três operações separadas: o modelo gasta menos passos e você controla o algoritmo (M08 bloco 3: construa para fluxos, não para endpoints). A fonte fala em "quatro tools" (as quatro operações da primeira linha da tabela); o código-exemplo implementa três delas, e a lista esperada nos testes tem três nomes. O ponto é a ordem de grandeza.</p>' },
        { tipo: 'texto', html: '<h3>O servidor (exemplo com framework)</h3>' },
        { tipo: 'codigo', linguagem: 'python', texto: serverPy },
        { tipo: 'codigo', linguagem: 'python', texto: outrosPy },
        { tipo: 'takeaway', html: 'Tools <mark>poucas e de fluxo</mark>, resources e prompts para o que o <mark>usuário</mark> controla; a <mark>docstring</mark> é API.' }
      ] },

      { rotulo: 'Escopo e erro', blocos: [
        { tipo: 'texto', html: '<p><code>_escopo_da_requisicao</code> é a peça de segurança do servidor e é curta de propósito.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: escopoPy },
        { tipo: 'texto', html:
          '<p>Note o que <strong>não</strong> existe aqui: nenhum caminho pelo qual um argumento de ferramenta influencie o escopo. Essa ausência é a defesa contra o <strong>confused deputy</strong> do bloco 7, e só é barata se decidida no primeiro desenho.</p>' +
          '<h3>Quatro detalhes que são decisão de segurança, não estilo</h3>' +
          '<ul><li><strong>O escopo vem do runtime, nunca de argumento.</strong> Se <code>tenant_id</code> fosse parâmetro, o modelo (ou um documento malicioso que o instrua) poderia trocá-lo. Em stdio vem da configuração do processo; em HTTP, do token autenticado. É o M07 bloco 6 na fronteira do protocolo.</li>' +
          '<li><strong>Erro como <code>ToolError</code> com texto acionável.</strong> Vai ao modelo como observação, não como stack trace (M08 bloco 3). No sentido inverso: exceção comum pode vazar detalhe interno (caminho absoluto, string de conexão); use o tipo próprio e controle a mensagem.</li>' +
          '<li><strong><code>readOnlyHint</code> e <code>openWorldHint</code> declarados.</strong> Ajudam o host a decidir o consentimento, mas são dicas: a garantia é o seu código não escrever numa ferramenta marcada como leitura.</li>' +
          '<li><strong>Limites nos parâmetros</strong> (<code>le=50</code>, <code>max_length=500</code>). O schema é a validação e roda antes do seu código; sem isso, <code>limite=100000</code> vira consumo de contexto e de banco.</li></ul>' },
        { tipo: 'rode', id: 'srv-rode', titulo: 'Quatro chamadas ao servidor', terminalTitulo: 'servidor do exercício',
          enunciado: 'Rode o servidor mínimo do exercício da próxima aba (saída da solução, executada em CPython; tenant <code>acme</code> no contexto de runtime). Clique em cada chamada.',
          prefixo: '$', entrada: 'python chamar_servidor.py', unidade: 'chamadas',
          etapas: [
            { id: 'ok', nome: 'Busca válida', descricao: 'PagamentoService', tom: 'response', ms: 1, linhas: [
              L('in', 'tools/call repo_buscar_simbolo {"simbolo": "PagamentoService"}'),
              L('out', 'src/pagamento.py:10 definicao'),
              L('out', 'src/api/checkout.py:44 uso'),
              L('out', 'src/jobs/fatura.py:7 uso'),
              L('hint', 'definição primeiro, mesmo que o índice guarde um uso antes')] },
            { id: 'nao', nome: 'Símbolo inexistente', descricao: 'erro que ensina', tom: 'request', ms: 1, linhas: [
              L('in', 'tools/call repo_buscar_simbolo {"simbolo": "NaoExiste"}'),
              L('out', "ERRO: Nenhuma ocorrência de 'NaoExiste'. Verifique a grafia ou tente um nome parcial. O repositório tem 2 símbolos indexados."),
              L('hint', 'resultado normal com texto acionável, não um stack trace')] },
            { id: 'forja', nome: 'tenant_id forjado', descricao: 'o modelo tenta trocar o escopo', tom: 'tls', ms: 1, linhas: [
              L('in', 'tools/call repo_buscar_simbolo {"simbolo": "Fatura", "tenant_id": "beta"}'),
              L('out', 'error -32602: argumento não permitido: tenant_id'),
              L('hint', 'o schema não tem esse campo: o escopo só vem do contexto')] },
            { id: 'lim', nome: 'Limite absurdo', descricao: 'limite=100000', tom: 'tcp', ms: 1, linhas: [
              L('in', 'tools/call repo_buscar_simbolo {"simbolo": "X1", "limite": 100000}'),
              L('out', 'error -32602: limite deve ser inteiro de 1 a 50'),
              L('hint', 'rejeitado pelo schema antes de tocar o índice')] }
          ],
          prever: { pergunta: 'O modelo chama a ferramenta com tenant_id: "beta" no argumento, mas o contexto do runtime é o tenant acme. O que acontece?', opcoes: [
            { id: 'a', texto: 'Devolve os dados do tenant beta, porque o argumento é mais específico.', correta: false, porque: 'seria o confused deputy: o modelo escolheria de quem é o dado.' },
            { id: 'b', texto: 'A chamada é rejeitada pelo schema (-32602): o campo não existe e o escopo só vem do runtime.', correta: true, porque: 'nenhum argumento influencia o escopo.' },
            { id: 'c', texto: 'O argumento é aceito e ignorado em silêncio.', correta: false, porque: 'aceitar e ignorar esconde a tentativa; aqui ela é recusada de forma explícita.' }
          ] },
          tutorAntes: 'Aperte Enter, faça a previsão e clique em "tenant_id forjado".',
          tutorDepois: 'O escopo (acme) veio do contexto. O que o modelo escreve nunca decide de quem é o dado.',
          callout: 'Você viu o escopo travado no runtime, o erro que ensina e o limite imposto pelo schema.' },
        { tipo: 'takeaway', html: 'O <mark>escopo vem do runtime</mark>, o <mark>erro ensina</mark> o modelo e o <mark>schema limita</mark> antes do seu código.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Servidor MCP é testável como qualquer código, sem assistente aberto. O teste em memória do exemplo com SDK (trilha externa) cobre três coisas: contrato, comportamento e fronteiras.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: testePy },
        { tipo: 'python', id: 'srv-python', titulo: 'Construa o núcleo do servidor, sem SDK', obrigatorio: false,
          enunciado: 'O <code>despachar</code> já está pronto (<code>tools/list</code>, <code>tools/call</code>, erros JSON-RPC). Complete <code>validar_args</code> (schema: <code>simbolo</code> string de 2 a 120, <code>limite</code> inteiro de 1 a 50, <strong>nenhum outro campo</strong>) e <code>buscar_simbolo</code> (índice do tenant em <code>ctx</code>, definições primeiro, <code>ToolError</code> acionável). Convenção do exercício: o <code>ToolError</code> volta como texto iniciado por <code>ERRO:</code> dentro do resultado; falha de schema é erro JSON-RPC <code>-32602</code>.',
          codigo: codigo, testes: testes,
          dica: 'Em <code>validar_args</code>, <code>set(args) - {"simbolo", "limite"}</code> pega o <code>tenant_id</code> forjado; exclua <code>bool</code> (que é <code>int</code> em Python). Em <code>buscar_simbolo</code>, use <code>INDICE[ctx["tenant"]]</code> e <code>sorted(..., key=lambda o: o["papel"] != "definicao")</code>, que mantém a ordem dos demais.',
          solucao: solucao,
          tutorDepois: 'Contrato, comportamento e fronteiras testados em milissegundos: sem container, sem rede, sem chave de API.',
          callout: 'O núcleo passou nos testes: definição primeiro, erro que ensina, limite no schema e escopo do runtime.' },
        { tipo: 'cenario', id: 'srv-cenario', titulo: 'O erro vaza demais ou de menos?', obrigatorio: false,
          enunciado: 'A busca de símbolo não achou nada. O modelo precisa de uma observação útil, e o servidor não pode vazar detalhe interno. Decida a resposta.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A consulta ao banco levantou uma exceção comum com o caminho do arquivo de índice e a string de conexão. O que o servidor devolve ao modelo?', opcoes: [
              { texto: 'A exceção original, para o modelo "entender o problema".', vai: 'f-vaza', tom: 'ruim', consequencia: 'caminho absoluto e string de conexão chegam ao cliente e ao contexto do modelo.' },
              { texto: 'Um ToolError próprio, com mensagem controlada e acionável.', vai: 'msg', tom: 'ok', consequencia: 'o modelo recebe uma observação sem detalhe interno.' }
            ] },
            msg: { texto: 'E o conteúdo da mensagem de "nenhuma ocorrência"?', opcoes: [
              { texto: '"Erro".', vai: 'f-mudo', tom: 'ruim', consequencia: 'o modelo não sabe o que tentar em seguida e repete a chamada.' },
              { texto: '"Nenhuma ocorrência de X. Verifique a grafia ou tente um nome parcial. O repositório tem N símbolos indexados."', vai: 'f-bom', tom: 'ok', consequencia: 'o modelo sabe o que fazer: corrigir a grafia ou tentar busca conceitual.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Erro controlado e acionável: o modelo corrige a rota sem receber detalhe interno.' },
            'f-vaza': { bom: false, texto: 'Vazamento de caminho e credencial pelo canal de erro.' },
            'f-mudo': { bom: false, texto: 'Erro mudo: o modelo chuta e repete a chamada.' }
          },
          callout: 'Você devolveu um erro controlado e acionável, sem detalhe interno.' },
        { tipo: 'takeaway', html: 'Teste o servidor <mark>em memória</mark>: <mark>contrato</mark>, <mark>comportamento</mark> e <mark>fronteiras</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs', html:
          '<ul><li><strong>Framework × SDK mínimo.</strong> Aqui o framework compensa porque o protocolo muda rápido; o domínio fica no núcleo (casca fina sobre os serviços).</li>' +
          '<li><strong>Tool de fluxo × tools granulares.</strong> A tool de fluxo gasta menos passos e dá controle do algoritmo, mas esconde etapas; devolva o que não foi possível verificar.</li></ul>' },
        { tipo: 'escolha', id: 'srv-escolha-tenant', titulo: 'Confira: de onde vem o escopo',
          pergunta: 'No transporte HTTP, de onde o servidor deve derivar o tenant e o repositório?',
          opcoes: [
            opc('a', 'Do token autenticado (claims verificadas), nunca de argumento da ferramenta.', true, 'em stdio vem da configuração do processo; em HTTP, do token. Some com RLS no banco para ter duas camadas (M07 b6).'),
            opc('b', 'De um parâmetro tenant_id preenchido pelo modelo.', false, 'argumento do modelo é dado não confiável.'),
            opc('c', 'Do primeiro texto da conversa.', false, 'texto de conversa ou de documento pode ser injetado.'),
            opc('d', 'Do header Origin.', false, 'Origin protege contra páginas maliciosas, não define o escopo de dados.')],
          tutorDepois: 'O escopo é do runtime; descrição e annotation podem mentir.' },
        { tipo: 'escolha', id: 'srv-escolha-gran', titulo: 'Confira: o mapa de arquitetura e a busca',
          pergunta: 'Qual divisão de primitivas está certa para o Cartógrafo?',
          opcoes: [
            opc('a', 'Busca de símbolo e impacto como tools; mapa e métricas como resources; /analisar-impacto como prompt.', true, 'cada uma pela regra do controle: modelo, usuário/aplicação anexando, usuário disparando.'),
            opc('b', 'Tudo como tool, para o modelo decidir.', false, 'custa tokens em toda chamada e joga fora a semântica.'),
            opc('c', 'Tudo como resource, para não gastar tokens.', false, 'o modelo não decide chamar um resource; a busca precisa ser tool.')],
          tutorDepois: 'Uma tool de fluxo (impacto de mudança) vale mais que as três operações soltas.' },
        { tipo: 'takeaway', html: 'Servidor bom: <mark>poucas tools</mark>, <mark>escopo do runtime</mark>, <mark>erro acionável</mark> e <mark>teste em memória</mark>.' }
      ] }
    ]
  });
})();
