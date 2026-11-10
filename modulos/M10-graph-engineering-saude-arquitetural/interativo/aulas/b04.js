/* M10 · Bloco 4: Human-in-the-loop, interrupt() e a armadilha da reexecução. Fonte: M10.html#b04. O exercício simula o replay com um motor mínimo local. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoHitl = `class Pausa(Exception):
    def __init__(self, payload):
        super().__init__("pausa")
        self.payload = payload


def interrupt(payload, ctx):
    """Sem "resume" no ctx: pausa (levanta Pausa com o payload).
    Com "resume": devolve o valor da retomada, sem pausar."""
    return None


def rodar(no, ctx, efeitos):
    try:
        return {"fim": no(ctx, efeitos)}
    except Pausa as p:
        return {"__interrupt__": p.payload}


def no_ruim(ctx, efeitos):
    efeitos.append("notificar_cliente")          # efeito ANTES da pausa
    decisao = interrupt({"criticos": 12}, ctx)
    efeitos.append("gravar:" + decisao)
    return decisao


def no_bom(ctx, efeitos):
    # reescreva: nenhum efeito nao idempotente antes da pausa
    efeitos.append("notificar_cliente")
    decisao = interrupt({"criticos": 12}, ctx)
    efeitos.append("gravar:" + decisao)
    return decisao


def expirou(criada_em, agora, ttl):
    """Pausa sem TTL e vazamento: o relogio entra como parametro."""
    return False
`;
  var solucaoHitl = `class Pausa(Exception):
    def __init__(self, payload):
        super().__init__("pausa")
        self.payload = payload


def interrupt(payload, ctx):
    if "resume" in ctx:
        return ctx["resume"]
    raise Pausa(payload)


def rodar(no, ctx, efeitos):
    try:
        return {"fim": no(ctx, efeitos)}
    except Pausa as p:
        return {"__interrupt__": p.payload}


def no_ruim(ctx, efeitos):
    efeitos.append("notificar_cliente")
    decisao = interrupt({"criticos": 12}, ctx)
    efeitos.append("gravar:" + decisao)
    return decisao


def no_bom(ctx, efeitos):
    decisao = interrupt({"criticos": 12}, ctx)
    efeitos.append("notificar_cliente")
    efeitos.append("gravar:" + decisao)
    return decisao


def expirou(criada_em, agora, ttl):
    return agora - criada_em > ttl
`;
  var testesHitl = `def test_sem_resume_pausa_com_payload():
    ef = []
    r = rodar(no_bom, {}, ef)
    assert r == {"__interrupt__": {"criticos": 12}}


def test_com_resume_devolve_o_valor():
    assert interrupt({"x": 1}, {"resume": "aprovar"}) == "aprovar"


def test_resume_falsy_ainda_e_resume():
    assert interrupt({"x": 1}, {"resume": ""}) == ""


def test_controle_negativo_no_ruim_notifica_duas_vezes():
    ef = []
    rodar(no_ruim, {}, ef)
    rodar(no_ruim, {"resume": "aprovar"}, ef)
    assert ef.count("notificar_cliente") == 2


def test_no_bom_notifica_uma_vez_e_nada_antes_da_pausa():
    ef = []
    rodar(no_bom, {}, ef)
    assert ef == []
    r = rodar(no_bom, {"resume": "aprovar"}, ef)
    assert ef == ["notificar_cliente", "gravar:aprovar"]
    assert r == {"fim": "aprovar"}


def test_ttl_na_borda():
    assert expirou(100, 160, 60) is False
    assert expirou(100, 161, 60) is True
`;

  TrilhaAula.registrar({
    id: 'm10-b4',
    titulo: 'Human-in-the-loop: interrupt() e a reexecução',
    minutos: 40,
    resumo: 'interrupt() pausa a execução e a retoma horas depois, em outro processo. O preço é que o nó reexecuta desde o começo na retomada: tudo que vinha antes da pausa acontece duas vezes.',
    objetivo: 'Usar interrupt() sem efeito colateral duplicado, aplicar as cinco regras, escolher o padrão de HITL e tratar aprovação como dado auditável.',
    revisao: [
      { id: 'm10b4-replay', pergunta: 'Um nó faz await notificar_cliente(...) e depois chama interrupt(). O humano responde horas depois. O que acontece?',
        opcoes: [
          opc('a', 'O nó reexecuta desde o começo; sem idempotência o cliente recebe duas notificações. Mova o efeito para depois da pausa ou torne-o idempotente', true, 'na retomada interrupt() devolve o valor do resume em vez de pausar, mas tudo antes dele roda de novo.'),
          opc('b', 'O nó continua na linha seguinte; a notificação sai uma vez', false, 'não há continuação de linha: há replay do nó.'),
          opc('c', 'O checkpoint desfaz o efeito da primeira execução', false, 'checkpoint guarda estado, não desfaz efeitos.')] },
      { id: 'm10b4-regra', pergunta: 'Qual uso de interrupt() é um bug segundo as cinco regras?',
        opcoes: [
          opc('a', 'Dentro de while True repetindo a validação até o revisor aprovar', true, 'cada retomada replica as iterações anteriores; use aresta condicional voltando ao nó.'),
          opc('b', 'Num nó de aprovação com TTL e job que varre pendências', false, 'é a regra 5.'),
          opc('c', 'Num nó que captura só uma exceção específica, fora da linha do interrupt', false, 'segue a regra 1.')] },
      { id: 'm10b4-try', pergunta: 'Por que não envolver interrupt() em try/except Exception?',
        opcoes: [
          opc('a', 'A pausa é sinalizada por exceção; o except genérico a engole e o nó segue com estado inconsistente', true, 'capture exceções específicas, nunca em volta do interrupt.'),
          opc('b', 'Porque try/except é lento', false, 'o problema é semântico.'),
          opc('c', 'Porque o checkpointer proíbe', false, 'nada proíbe: o resultado é que quebra.')] },
      { id: 'm10b4-ck', pergunta: 'O interrupt() funciona sem checkpointer?',
        opcoes: [
          opc('a', 'Não: o checkpointer é pré-requisito, o estado dorme no banco indexado pelo thread_id', true, 'sem ele não há onde congelar a execução.'),
          opc('b', 'Sim, mantendo o processo vivo', false, 'não é uma combinação possível.'),
          opc('c', 'Sim, mas só em memória do cliente', false, 'o runtime não suporta.')] },
      { id: 'm10b4-carimbo', pergunta: 'O humano aprova 100% das vezes há meses. Qual a leitura?',
        opcoes: [
          opc('a', 'Ou o sistema é ótimo (e dá para automatizar com limiar) ou ninguém está lendo; as duas conclusões pedem ação', true, 'métrica de saúde: taxa de rejeição/edição.'),
          opc('b', 'A camada funciona perfeitamente', false, 'aprovação-carimbo é teatro e custa latência.'),
          opc('c', 'Remover o registro de quem aprovou', false, 'aprovação é dado auditável.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Você já tem o gancho de HITL (<em>human-in-the-loop</em>) desde o M08 bloco 5, a allowlist que pausa o loop, e a promessa do M12 de transformá-lo em camada de política. Este bloco entrega o mecanismo <em>durável</em>: pausar, devolver o controle e retomar <strong>horas ou dias depois, possivelmente em outro processo</strong>, porque o humano não responde em 30 segundos e nenhuma conexão HTTP espera por ele.</p>' +
          '<p>No Capstone: a análise encontrou 12 riscos altos num sistema de pagamentos. Antes do relatório ir para o cliente, um humano confirma, edita ou descarta. Sem persistência, isso obriga a manter o processo vivo esperando; com <code>interrupt()</code>, o estado dorme no Postgres e acorda quando a resposta chegar.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Padrão conhecido: pausa que sobrevive ao processo', html:
          '<p>Passo de aprovação com registro em tabela e endpoint que retoma depois. A ergonomia aqui é escrever a pausa no meio do nó, como chamada bloqueante, e o runtime congela e descongela. <strong>O preço é a regra da reexecução</strong>: o nó roda de novo desde o começo na retomada.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'from langgraph.types import interrupt',
          '',
          'async def no_revisao_humana(estado: EstadoIngestao) -> dict[str, object]:',
          '    criticos = [a for a in estado["analisados"] if a.risco == "alto"]',
          '',
          '    decisao = interrupt({                     # <- congela aqui; o payload vai ao chamador',
          '        "tipo": "revisao_de_riscos",',
          '        "repo": estado["repo_url"],',
          '        "criticos": [c.model_dump() for c in criticos],',
          '        "instrucao": "Aprove, edite ou descarte cada achado antes do relatório.",',
          '    })',
          '    # ... só executa quando alguém retomar com Command(resume=...)',
          '',
          '    return {',
          '        "analisados": decisao["achados_confirmados"],',
          '        "aprovado_por_humano": True,',
          '        "revisor": decisao["revisor"],',
          '    }'].join('\n') },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '# quem chama: a API (M03) faz o papel do "humano"',
          '# 1) inicia: a execução para no interrupt e devolve o payload',
          'resultado = await app.ainvoke(entrada, config=config)',
          'if "__interrupt__" in resultado:',
          '    payload = resultado["__interrupt__"][0].value',
          '    await criar_pendencia(thread_id, payload)   # tabela de pendências; responde 202',
          '',
          '# 2) horas depois, o revisor decide via endpoint; OUTRO processo retoma:',
          'await app.ainvoke(',
          '    Command(resume={"achados_confirmados": [...], "revisor": "denisson"}),',
          '    config=config,          # MESMO thread_id',
          ')'].join('\n') },
        { tipo: 'texto', html:
          '<p>Entre os passos 1 e 2 o processo pode morrer, o pod ser reciclado, o deploy acontecer: o estado está no Postgres, indexado pelo <code>thread_id</code>. <strong>Sem checkpointer, <code>interrupt()</code> não funciona</strong>; não é recomendação, é pré-requisito.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'A armadilha central: o nó reexecuta desde o começo', html:
          '<p>Ao retomar, o runtime <strong>não continua da linha seguinte ao <code>interrupt()</code></strong>: roda o nó inteiro de novo, e desta vez a chamada devolve o valor do <code>resume</code> em vez de pausar. Tudo que estava antes dela <em>acontece duas vezes</em>.</p>' +
          '<p>Se o nó fizesse <code>await notificar_cliente(...)</code> antes do <code>interrupt()</code>, o cliente receberia <strong>duas</strong> notificações; se inserisse uma linha no banco, seriam duas. Regra: <strong>nada de efeito colateral não idempotente antes do <code>interrupt()</code></strong>. Coloque os efeitos <em>depois</em> da retomada ou torne-os idempotentes (é a terceira vez que a idempotência aparece no módulo: é o custo de qualquer sistema que retoma por replay).</p>' },
        { tipo: 'takeaway', html: 'O nó <mark>reexecuta desde o começo</mark>; efeito antes do interrupt acontece <mark>duas vezes</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'b4-rode', titulo: 'A notificação que sai duas vezes', enunciado: 'Um motor mínimo simula pausa e retomada. Compare o nó com efeito antes da pausa e o nó com o efeito movido para depois.',
          prefixo: '$', entrada: 'python3 replay.py', unidade: 'ms', terminalTitulo: 'simulação local de interrupt()',
          prever: { pergunta: 'No_ruim notifica antes do interrupt(). Pausa e retomada com "aprovar". Quantas vezes "notificar_cliente" aparece nos efeitos?', opcoes: [
            { id: 'a', texto: 'Uma vez: a retomada continua depois do interrupt', correta: false, porque: 'não há continuação: o nó roda de novo desde a primeira linha.' },
            { id: 'b', texto: 'Duas vezes: uma na primeira execução, outra no replay', correta: true, porque: 'o efeito antes da pausa se repete porque o nó reexecuta inteiro.' },
            { id: 'c', texto: 'Zero: o interrupt cancela efeitos anteriores', correta: false, porque: 'checkpoint não desfaz efeito.' }
          ] },
          etapas: [
            { id: 'ruim1', nome: 'no_ruim, 1ª execução', descricao: 'Pausa', tom: 'request', ms: 1, linhas: [
              L('out', "rodar(no_ruim, {}) -> {'__interrupt__': {'criticos': 12}}"),
              L('out', "efeitos: ['notificar_cliente']"),
              L('hint', 'o cliente já foi notificado, e a decisão ainda nem chegou')] },
            { id: 'ruim2', nome: 'no_ruim, retomada', descricao: 'Replay', tom: 'response', ms: 1, linhas: [
              L('out', "rodar(no_ruim, {'resume': 'aprovar'}) -> {'fim': 'aprovar'}"),
              L('out', "efeitos: ['notificar_cliente', 'notificar_cliente', 'gravar:aprovar']"),
              L('hint', 'duas notificações')] },
            { id: 'bom', nome: 'no_bom', descricao: 'Efeito depois da retomada', tom: 'ink', ms: 1, linhas: [
              L('out', "1ª execução: efeitos = []"),
              L('out', "retomada: efeitos = ['notificar_cliente', 'gravar:aprovar']"),
              L('hint', 'um efeito de cada, depois da decisão')] }
          ],
          tutorDepois: 'Mover o efeito para depois da retomada (ou torná-lo idempotente) resolve. O replay é o contrato do mecanismo, não um defeito dele.',
          callout: 'Você viu a duplicação e a correção.' },
        { tipo: 'ordene', id: 'b4-ordene', titulo: 'Checkpoint, pausa e retomada em outro processo', obrigatorio: false,
          enunciado: 'Ordene os seis momentos da execução do pipeline com revisão humana.',
          itens: [
            { id: 'ret', texto: 'Outro processo chama Command(resume=...) com o mesmo thread_id; o nó revisar reexecuta desde a primeira linha' },
            { id: 'cp2', texto: 'analisar termina: checkpoint #2' },
            { id: 'rel', texto: 'revisar conclui e relatar roda, sem refazer parse nem analisar' },
            { id: 'cp1', texto: 'parse roda e o runtime grava o checkpoint #1 na thread' },
            { id: 'morte', texto: 'O processo morre ou o pod é reciclado: tudo no banco, nada em memória' },
            { id: 'int', texto: 'revisar chama interrupt(payload): o grafo pausa e devolve o controle (checkpoint #3)' }
          ],
          solucao: ['cp1', 'cp2', 'int', 'morte', 'ret', 'rel'],
          dica: 'A pausa vem depois de dois checkpoints; a retomada só existe depois que o processo original some.',
          tutorDepois: 'A trilha de auditoria guarda o payload exato aprovado.',
          callout: 'Sequência correta: parse, analisar, pausa, morte, retomada, relatório.' },
        { tipo: 'takeaway', html: 'Entre a pausa e a retomada o processo pode <mark>não existir</mark>: o estado vive no <mark>checkpointer</mark>.' }
      ] },

      { rotulo: 'Regras e padrões', blocos: [
        { tipo: 'texto', html:
          '<h3>As cinco regras que evitam bug</h3>' +
          '<ol><li><strong>Não envolva o <code>interrupt()</code> em <code>try/except</code> genérico.</strong> A pausa é sinalizada por exceção; um <code>except Exception</code> a engole e o nó "continua" com estado inconsistente. Capture exceções <em>específicas</em>, nunca em volta da linha do interrupt.</li>' +
          '<li><strong>Não reordene chamadas de <code>interrupt()</code> num mesmo nó.</strong> Os valores de retomada casam por <em>posição</em>; mudar a ordem entre a pausa e a retomada entrega a resposta errada para a pergunta errada, em silêncio.</li>' +
          '<li><strong>Não coloque <code>interrupt()</code> dentro de <code>while True</code>.</strong> A primeira retomada replica 1 iteração, a segunda 2, e o custo cresce. Para "o revisor rejeitou, peça de novo", use <strong>aresta condicional voltando ao nó</strong>: cada volta é um passo do grafo, com checkpoint próprio.</li>' +
          '<li><strong>Nada de operação não idempotente antes da pausa.</strong></li>' +
          '<li><strong>Sempre haverá um humano que não volta.</strong> Toda pausa precisa de política de expiração: um job varre pendências antigas e decide (cancelar, escalar ou seguir com o default seguro). Pausa sem TTL é vazamento de recurso e de expectativa.</li></ol>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Os quatro padrões de HITL</h3>' +
          '<table><thead><tr><th>Padrão</th><th>O que o humano faz</th><th>No Capstone</th></tr></thead><tbody>' +
          '<tr><td><strong>Aprovar / rejeitar</strong></td><td>decide se o fluxo continua</td><td>liberar o relatório para o cliente</td></tr>' +
          '<tr><td><strong>Editar estado</strong></td><td>corrige o conteúdo antes de seguir</td><td>remover achados falso-positivos</td></tr>' +
          '<tr><td><strong>Revisar chamada de ferramenta</strong></td><td>aprova a ação que o agente propôs</td><td>autorizar uma ferramenta de escrita (M12)</td></tr>' +
          '<tr><td><strong>Fornecer informação</strong></td><td>responde o que o sistema não sabe</td><td>credencial de repositório privado; qual é o entry point real</td></tr>' +
          '</tbody></table>' +
          '<p>Há simetria com o <strong>MRTR do MCP</strong> (M09 bloco 3: o servidor devolve <code>InputRequiredResult</code> e o cliente retoma) e com o <strong><code>INPUT_REQUIRED</code> do A2A</strong> (M09 bloco 6). Três protocolos convergiram para a mesma forma: <em>trabalho de longa duração que precisa de entrada externa no meio, sem manter conexão aberta</em>. Reconhecer isso como <em>um</em> conceito, e não três, é a síntese que o curso quer produzir.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Processos de longa duração e a assimetria humano-máquina', html:
          '<ul><li><strong>A escala de tempo humana quebra pressupostos.</strong> Timeout de HTTP: segundos. Vida de um pod: horas. Resposta de um revisor: dias. Qualquer desenho que mantenha recurso alocado esperando humano falha; a solução é persistir e desalocar.</li>' +
          '<li><strong>Toda espera precisa de compensação e de expiração.</strong> Se o passo seguinte nunca vem, o que desfaz o que já foi feito? No Capstone é barato (descartar a análise); em sistema financeiro, não.</li>' +
          '<li><strong>Aprovação é dado auditável.</strong> Registre <em>quem</em>, <em>quando</em> e <em>o quê</em>: o payload exato mostrado na hora. "Foi aprovado" sem o snapshot não sustenta auditoria.</li>' +
          '<li><strong>Cuidado com a aprovação-carimbo.</strong> Se o humano aprova 100% das vezes sem ler, a camada é teatro e custa latência. Métrica de saúde: <em>taxa de rejeição/edição</em>. Zero por meses significa sistema ótimo (automatize com limiar) ou ninguém lendo; ambos pedem ação.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Sintomas e conserto', html:
          '<ul><li><strong>Notificação ou registro duplicado no HITL:</strong> efeito antes do <code>interrupt()</code>. Mova-o para depois da retomada ou torne-o idempotente.</li>' +
          '<li><strong><code>interrupt()</code> não pausa; o fluxo segue:</strong> um <code>try/except Exception</code> engoliu o sinal.</li>' +
          '<li><strong>Custo explode com HITL repetido:</strong> <code>interrupt()</code> em <code>while True</code>. Use aresta condicional voltando ao nó.</li></ul>' },
        { tipo: 'takeaway', html: 'Cinco regras: <mark>sem try genérico</mark>, sem reordenar, sem <mark>while True</mark>, sem efeito antes, com TTL.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b4-python', titulo: 'interrupt() e o nó seguro', obrigatorio: false,
          enunciado: 'Implemente <code>interrupt(payload, ctx)</code> (sem <code>"resume"</code> no ctx levanta <code>Pausa</code>; com <code>"resume"</code> devolve o valor, mesmo vazio), reescreva <code>no_bom</code> sem efeito antes da pausa e implemente <code>expirou(criada_em, agora, ttl)</code>.',
          codigo: codigoHitl, testes: testesHitl,
          dica: 'Use <code>"resume" in ctx</code>, não <code>ctx.get("resume")</code>: uma resposta vazia é resposta. Em <code>no_bom</code>, a primeira linha é o interrupt. <code>expirou</code> é <code>agora - criada_em &gt; ttl</code>.',
          solucao: solucaoHitl,
          tutorDepois: 'O teste de <code>no_ruim</code> é o controle negativo: prova que a duplicação existe e que o <code>no_bom</code> a evita.',
          callout: 'A pausa, o replay e o TTL passaram nos testes.' },
        { tipo: 'transcript', id: 'b4-transcript', titulo: 'Duas afirmações que a revisão não sustenta', obrigatorio: false, terminalTitulo: 'revisão do nó de aprovação',
          enunciado: 'O agente revisa o código abaixo antes do merge. Duas afirmações dele estão erradas. Clique nas linhas e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Revise o nó de revisão humana antes do merge.' },
            { quem: 'ferramenta', texto: '$ cat nodes.py\nasync def no_revisao(estado):\n    await notificar_cliente(estado)\n    try:\n        while True:\n            d = interrupt({"criticos": estado["criticos"]})\n            if d["ok"]:\n                break\n    except Exception:\n        pass\n    return {"aprovado_por_humano": True}' },
            { quem: 'agente', texto: 'O try/except Exception é seguro: só registra o erro e deixa o nó continuar.' },
            { quem: 'agente', texto: 'A notificação antes do interrupt vai sair duas vezes na retomada; devemos movê-la para depois.' },
            { quem: 'agente', texto: 'O while True com interrupt é seguro, porque cada iteração tem seu próprio checkpoint.' },
            { quem: 'agente', texto: 'O interrupt exige checkpointer; vou confirmar que o grafo é compilado com um.' }
          ],
          erradas: [2, 4],
          explicacao: { 2: 'a pausa é sinalizada por exceção: o except genérico a engole e o nó segue com estado inconsistente. Capture exceções específicas, fora da linha do interrupt.', 4: 'dentro do while True o nó reexecuta desde o início: cada retomada replica as iterações anteriores e o custo cresce. Use aresta condicional voltando ao nó, um passo com checkpoint por volta.' },
          tutorDepois: 'As afirmações sobre a notificação e o checkpointer estão certas.' },
        { tipo: 'escolha', id: 'b4-esc-padrao', titulo: 'Confira: o padrão de HITL',
          pergunta: 'O agente propôs rodar uma ferramenta de escrita em produção e um humano precisa autorizar essa ação específica. Qual padrão?',
          opcoes: [
            { id: 'a', texto: 'Aprovar ou rejeitar o fluxo inteiro.', correta: false, porque: 'o humano decide sobre uma ação, não sobre continuar o fluxo.' },
            { id: 'b', texto: 'Revisar chamada de ferramenta.', correta: true, porque: 'o humano aprova a ação que o agente propôs; é a base da camada de política do M12.' },
            { id: 'c', texto: 'Fornecer informação.', correta: false, porque: 'o sistema não está perguntando algo que desconhece.' },
            { id: 'd', texto: 'Editar estado.', correta: false, porque: 'não há conteúdo a corrigir.' }
          ], tutorDepois: 'Registre quem aprovou, quando e o payload exato mostrado.' },
        { tipo: 'escolha', id: 'b4-esc-bug', titulo: 'Confira: qual uso é bug',
          pergunta: 'Qual destes usos de <code>interrupt()</code> é um bug segundo as cinco regras?',
          opcoes: [
            { id: 'a', texto: 'Dentro de um <code>while True</code> que repete a validação até o revisor aprovar.', correta: true, porque: 'cada retomada replica as iterações anteriores; o custo cresce.' },
            { id: 'b', texto: 'Num nó de aprovação com TTL e job que varre pendências antigas.', correta: false, porque: 'segue a regra 5.' },
            { id: 'c', texto: 'Num nó que captura apenas uma exceção específica, fora da linha do interrupt.', correta: false, porque: 'segue a regra 1.' },
            { id: 'd', texto: 'Em um grafo compilado com checkpointer em Postgres.', correta: false, porque: 'é o pré-requisito.' }
          ], tutorDepois: 'Para repetir, use aresta condicional voltando ao nó.' },
        { tipo: 'takeaway', html: 'HITL durável é <mark>checkpoint + interrupt</mark>, com <mark>idempotência</mark> antes e <mark>TTL</mark> depois.' }
      ] }
    ]
  });
})();
