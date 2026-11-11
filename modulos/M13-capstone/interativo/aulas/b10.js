/* M13 · Bloco 10: contratos (OpenAPI congelado, Problem Details, MCP e A2A). Fonte: M13.html#h-b10. Saídas do rode são a execução registrada no bloco (evidence/m13/B10). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoFrames = String.raw`import json

def decode_frames(buf):
    # LACUNA: leia cabecalho Content-Length, espere o corpo inteiro,
    # decodifique cada JSON e devolva (mensagens, restante_do_buffer).
    return [], buf
`;
  var solucaoFrames = String.raw`import json

def decode_frames(buf):
    msgs = []
    while True:
        sep = buf.find(b"\r\n\r\n")
        if sep < 0:
            break
        length = None
        for line in buf[:sep].decode("ascii").split("\r\n"):
            k, _, v = line.partition(":")
            if k.strip().lower() == "content-length":
                length = int(v.strip())
        if length is None:
            raise ValueError("Content-Length ausente")
        start = sep + 4
        if len(buf) < start + length:
            break
        msgs.append(json.loads(buf[start:start + length].decode("utf-8")))
        buf = buf[start + length:]
    return msgs, buf
`;
  var testesFrames = String.raw`import json

def frame(obj):
    body = json.dumps(obj).encode("utf-8")
    return b"Content-Length: " + str(len(body)).encode() + b"\r\n\r\n" + body

A = {"jsonrpc": "2.0", "id": 1, "method": "initialize"}
B = {"jsonrpc": "2.0", "id": 2, "method": "tools/list"}

def test_um_frame_completo():
    msgs, rest = decode_frames(frame(A))
    assert msgs == [A] and rest == b""

def test_dois_frames_colados():
    msgs, rest = decode_frames(frame(A) + frame(B))
    assert msgs == [A, B] and rest == b""

def test_frame_parcial_espera_mais_bytes():
    data = frame(B)
    msgs, rest = decode_frames(frame(A) + data[:-5])
    assert msgs == [A] and rest == data[:-5]
    msgs2, rest2 = decode_frames(rest + data[-5:])
    assert msgs2 == [B] and rest2 == b""

def test_corpo_com_acento_usa_bytes():
    msg = {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"q": "ação"}}
    msgs, rest = decode_frames(frame(msg))
    assert msgs == [msg] and rest == b""

def test_sem_content_length_e_erro():
    try:
        decode_frames(b"X-Outro: 1\r\n\r\n{}")
    except ValueError:
        return
    assert False, "deveria levantar ValueError"
`;

  TrilhaAula.registrar({
    id: 'm13-b10',
    titulo: 'Contratos: OpenAPI congelado, Problem Details, MCP e A2A',
    minutos: 30,
    resumo: 'Contrato que muda junto com a implementação é diário. A spec vira dado congelado, o erro segue um padrão e os protocolos de agente rodam em processo, declarados como tal.',
    objetivo: 'Explicar por que o golden congelado supera gerar a spec do código, o que o RFC 9457 padroniza, como o framing do MCP trata bytes parciais e o que separa protocolo em processo de rede simulada.',
    revisao: [
      { id: 'm13b10-golden', pergunta: 'Por que congelar o OpenAPI como golden versionado supera gerar a spec a partir do código?',
        opcoes: [
          opc('a', 'A spec gerada sempre concorda consigo mesma; o golden faz qualquer diferença estrutural virar breaking change detectada por teste', true, 'contrato que muda junto com a implementação é diário, não contrato.'),
          opc('b', 'Gerar a partir do código é proibido', false, 'não é proibição; é falta de um árbitro externo ao código.'),
          opc('c', 'O golden é menor', false, 'tamanho não entra na decisão.')] },
      { id: 'm13b10-9457', pergunta: 'Quais campos o Problem Details (RFC 9457) usa neste bloco?',
        opcoes: [
          opc('a', '<code>type</code>, <code>title</code>, <code>status</code>, <code>detail</code> e <code>instance</code>', true, 'o validador interno checa os campos obrigatórios sem dependência externa; um JSON de erro ad hoc deixa cada cliente adivinhar.'),
          opc('b', 'Só <code>message</code> e <code>code</code>', false, 'é o formato ad hoc que o padrão substitui.'),
          opc('c', '<code>error</code> e <code>stack</code>', false, 'stack em resposta de API também vaza detalhe interno.')] },
      { id: 'm13b10-frame', pergunta: 'Por que <code>decode_frames</code> devolve também o restante do buffer?',
        opcoes: [
          opc('a', 'Framing parcial é caso de teste: um frame incompleto espera mais bytes em vez de quebrar', true, 'o buffer pode trazer frames colados ou cortados; o resto volta para a próxima leitura.'),
          opc('b', 'Para logar os bytes ignorados', false, 'o restante não é descartado, é reaproveitado.'),
          opc('c', 'Porque JSON-RPC exige', false, 'quem exige o comprimento é o framing <code>Content-Length</code>, não o JSON-RPC.')] },
      { id: 'm13b10-a2a', pergunta: 'O que acontece com uma task A2A já processada que chega de novo?',
        opcoes: [
          opc('a', 'É rejeitada na entrada; o ciclo é <code>submitted → working → completed/failed</code>', true, 'reexecutar depois de <code>completed</code> viola o ciclo de vida.'),
          opc('b', 'Roda de novo e sobrescreve o resultado', false, 'violaria o ciclo de vida.'),
          opc('c', 'Volta para <code>submitted</code>', false, 'o ciclo só avança.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Um campo muda e ninguém percebe</h3>' +
          '<p>Um desenvolvedor renomeia um campo da resposta. A spec é gerada do código, então ela acompanha a mudança, os testes passam e o cliente quebra em produção. Uma spec que sempre concorda com a implementação não protege ninguém.</p>' +
          '<h3>Modelo mental</h3>' +
          '<ul><li><strong>OpenAPI como dado congelado:</strong> a spec fica em <code>fixtures/contracts/openapi.v1.golden.json</code>. Uma comparação estrutural com a spec do código transforma qualquer diferença em <strong>breaking change</strong> detectada por teste. A spec declara paginação e Problem Details.</li>' +
          '<li><strong>Problem Details (RFC 9457):</strong> erros com <code>type</code>, <code>title</code>, <code>status</code>, <code>detail</code> e <code>instance</code>, validados por código próprio sem dependência externa. O cliente trata todo erro de modo uniforme.</li>' +
          '<li><strong>MCP local:</strong> JSON-RPC 2.0 com framing <code>Content-Length</code> (estilo LSP) sobre bytes, em processo. Fluxo <code>initialize</code> → <code>tools/list</code> → <code>tools/call</code>; <code>-32600</code> para envelope inválido e <code>-32601</code> para método ou ferramenta desconhecida. <code>decode_frames</code> devolve as mensagens e o <strong>restante do buffer</strong>.</li>' +
          '<li><strong>A2A mínimo:</strong> Agent Card e ciclo de vida de task <code>submitted → working → completed/failed</code>; task já processada é rejeitada na entrada; falha vira estado explícito.</li></ul>' +
          '<p><strong>Limite:</strong> nenhuma rede foi simulada como se fosse remota. Tudo roda em processo e diz isso; o bloco prova o contrato e o framing, não a interoperabilidade com um servidor remoto real.</p>' },
        { tipo: 'ordene', id: 'b10-ordene-mcp', titulo: 'Ponha a sessão MCP na ordem',
          enunciado: 'O servidor MCP mínimo do bloco atende uma sessão completa. Ponha as chamadas na ordem do handshake.',
          itens: [
            { id: 'call', texto: '<code>tools/call</code>: executa uma ferramenta com argumentos' },
            { id: 'init', texto: '<code>initialize</code>: abre a sessão' },
            { id: 'list', texto: '<code>tools/list</code>: descobre as ferramentas disponíveis' }
          ], solucao: ['init', 'list', 'call'],
          dica: 'Só se chama o que já foi descoberto, e só se descobre depois de abrir a sessão.',
          tutorDepois: 'Abrir, listar, chamar. Uma ferramenta ou método desconhecido responde com <code>-32601</code>.' },
        { tipo: 'takeaway', html: 'Spec <mark>congelada</mark>, erro <mark>padronizado</mark> e protocolo <mark>em processo</mark> declarado como tal.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html: '<p>A execução abaixo é a registrada no bloco (<code>evidence/m13/B10/pytest-contracts.txt</code>); a suíte integral do lab tinha 63 testes nesse ponto.</p>' },
        { tipo: 'rode', id: 'b10-rode', titulo: 'Rode os oráculos de contrato', enunciado: 'Aperte Enter e acompanhe. Saída registrada no bloco.',
          prefixo: '$', entrada: 'uv run pytest tests/test_contracts.py -v', unidade: 'testes', terminalTitulo: 'lab M13 (saída registrada)',
          prever: { pergunta: 'O MCP recebe só metade de um frame <code>Content-Length</code>. O que o teste exige?', opcoes: [
            { id: 'a', texto: 'Esperar mais bytes, sem responder e sem quebrar', correta: true, porque: '<code>test_mcp_partial_frame_waits_for_more_bytes</code>: framing parcial é caso de teste, não acidente.' },
            { id: 'b', texto: 'Responder <code>-32600</code> imediatamente', correta: false, porque: 'o envelope ainda nem chegou inteiro; não há o que invalidar.' },
            { id: 'c', texto: 'Descartar os bytes e seguir', correta: false, porque: 'perderia a mensagem; o restante do buffer é reaproveitado.' }
          ] },
          etapas: [
            { id: 'spec', nome: 'Spec e erros', descricao: 'Golden, paginação, Problem Details', tom: 'dns', ms: 4, linhas: [
              L('cmd', 'uv run pytest tests/test_contracts.py -v'),
              L('out', 'test_openapi_spec_matches_frozen_golden PASSED'),
              L('out', 'test_breaking_change_is_detected PASSED'),
              L('out', 'test_spec_declares_pagination_and_problem_details PASSED'),
              L('out', 'test_problem_details_valid_and_invalid PASSED'),
              L('hint', 'o teste de breaking change prova que a diferença estrutural é detectada')] },
            { id: 'mcp', nome: 'MCP por frames', descricao: 'Handshake, envelope inválido, frame parcial', tom: 'request', ms: 3, linhas: [
              L('out', 'test_mcp_full_handshake_via_frames PASSED'),
              L('out', 'test_mcp_rejects_non_jsonrpc_and_unknown_method PASSED'),
              L('out', 'test_mcp_partial_frame_waits_for_more_bytes PASSED'),
              L('hint', 'tudo sobre bytes, em processo')] },
            { id: 'a2a', nome: 'A2A', descricao: 'Agent Card e ciclo de vida', tom: 'response', ms: 2, linhas: [
              L('out', 'test_a2a_agent_card_and_task_lifecycle PASSED'),
              L('out', 'test_a2a_failure_becomes_explicit_state PASSED'),
              L('in', '9 passed'),
              L('hint', 'a falha vira estado <code>failed</code>, não exceção engolida')] }
          ],
          tutorAntes: 'Responda a previsão e aperte Enter.',
          callout: 'Você viu os nove oráculos de contrato passarem.' },
        { tipo: 'cenario', id: 'b10-cenario', titulo: 'O teste do golden falhou', obrigatorio: false,
          enunciado: 'Uma mudança renomeou um campo de resposta e <code>test_openapi_spec_matches_frozen_golden</code> falhou. Decida. Cenário de exemplo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A diferença é estrutural: um campo que clientes leem mudou de nome. O CI está vermelho e o prazo é hoje. O que você faz?', opcoes: [
              { texto: 'Regenerar o golden a partir do código para o teste passar.', vai: 'f-diario', tom: 'ruim', consequencia: 'o golden passa a copiar a implementação; o contrato volta a ser diário.' },
              { texto: 'Tratar como breaking change: reverter o nome ou versionar a mudança de propósito.', vai: 'versao', tom: 'ok', consequencia: 'a diferença virou decisão explícita, não acidente.' }
            ] },
            versao: { texto: 'A equipe decide manter o campo novo. Como o erro dessa rota deve sair para o cliente quando o dado é inválido?', opcoes: [
              { texto: 'Um JSON ad hoc <code>{"erro": "campo inválido"}</code>, mais simples.', vai: 'f-adhoc', tom: 'ruim', consequencia: 'cada cliente passa a tratar esse erro de um jeito próprio.' },
              { texto: 'Problem Details com <code>type</code>, <code>title</code>, <code>status</code>, <code>detail</code> e <code>instance</code>.', vai: 'f-bom', tom: 'ok', consequencia: 'o tratamento de erro é uniforme e validável por código.' }
            ] }
          },
          finais: {
            'f-diario': { texto: 'O teste ficou verde e o cliente quebrou. Um golden regenerado do código nunca detecta nada.', bom: false },
            'f-adhoc': { texto: 'A mudança passou, mas o contrato de erro ficou sem padrão e o cliente trata cada rota de um jeito.', bom: false },
            'f-bom': { texto: 'A mudança entrou como decisão versionada e os erros seguem o RFC 9457.', bom: true }
          } },
        { tipo: 'takeaway', html: 'O teste do golden transforma <mark>mudança estrutural</mark> em <mark>decisão</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b10-python', titulo: 'Decodifique frames com resto de buffer', obrigatorio: false,
          enunciado: 'Implemente <code>decode_frames(buf)</code> para o framing <code>Content-Length</code>: devolva <code>(mensagens, restante)</code>. Frame incompleto fica no restante; falta de <code>Content-Length</code> levanta <code>ValueError</code>. Versão do exercício; a do lab pode diferir em detalhes.',
          codigo: codigoFrames, testes: testesFrames,
          dica: 'Procure <code>b"\\r\\n\\r\\n"</code>. Leia o comprimento do cabeçalho, confira se <code>len(buf)</code> cobre o corpo, decodifique, corte o buffer e repita. O comprimento é em <strong>bytes</strong>.',
          solucao: solucaoFrames,
          tutorDepois: 'O comprimento é medido em bytes, por isso o teste com "ação" existe: contar caracteres quebraria o framing.',
          callout: 'Seu decodificador trata frames colados, parciais e inválidos.' },
        { tipo: 'escolha', id: 'b10-esc1', titulo: 'Protocolo em processo', pergunta: 'O servidor MCP do lab fala por bytes dentro do mesmo processo. Como isso deve ser apresentado?',
          opcoes: [
            opc('a', 'Como integração remota validada', false, 'nenhuma rede foi simulada como remota; dizer isso seria inflar a evidência.'),
            opc('b', 'Como protocolo em processo declarado, que prova contrato e framing', true, 'o bloco diz que tudo roda em processo; a interoperabilidade remota não foi provada.'),
            opc('c', 'Como rede simulada com latência', false, 'não há simulação de rede no bloco.')] },
        { tipo: 'escolha', id: 'b10-esc2', titulo: 'Task repetida', pergunta: 'Uma task A2A em <code>completed</code> recebe o mesmo envio de novo. Onde o bloco manda barrar?',
          opcoes: [
            opc('a', 'Na entrada, rejeitando a task já processada', true, 'reexecutar depois de <code>completed</code> viola o ciclo de vida.'),
            opc('b', 'Depois de executar, descartando o resultado', false, 'o efeito colateral já aconteceu.'),
            opc('c', 'Não barrar; o resultado é idêntico', false, 'o ciclo de vida só avança.')] },
        { tipo: 'takeaway', html: 'Frame parcial <mark>espera bytes</mark>; protocolo em processo é <mark>declarado</mark>, não vendido como remoto.' }
      ] }
    ]
  });
})();
