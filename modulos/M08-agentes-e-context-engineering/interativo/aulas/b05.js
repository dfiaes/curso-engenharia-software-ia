/* M08 · Bloco 5: O loop. Fonte: M08.html#b05. Exemplo condutor: o agente investigador do laboratório (modelo falso determinístico). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoLoop = String.raw`def _parcial(fatos, motivo):
    # TODO: sem fatos -> "Não concluído (motivo) e sem fato verificável."
    #       com fatos  -> "RESPOSTA PARCIAL (motivo)." + uma linha "- fato" por fato
    return ""


def investigar(roteiro, max_passos=5, max_repeticoes=2, exige_aprovacao=("repo_escrever",)):
    """roteiro: o que o modelo falso propõe, em ordem.
    ("tool", nome, arg) é uma chamada; ("final", texto) é a resposta final."""
    modelo = iter(roteiro)
    assinaturas = {}
    fatos = []
    passos = 0
    for _ in range(max_passos):
        acao = next(modelo, ("final", ""))
        if acao[0] == "final":
            return {"parada": "sucesso", "resposta": acao[1], "passos": passos, "fatos": fatos}
        _, nome, arg = acao
        passos += 1
        assinatura = (nome, arg)
        assinaturas[assinatura] = assinaturas.get(assinatura, 0) + 1
        # TODO 1: se a assinatura passou de max_repeticoes -> parada "loop_esteril" (com parcial)
        # TODO 2: se o nome exige aprovação -> parada "requer_humano" (a ferramenta NÃO executa)
        if nome == "notas_registrar":
            fatos.append(arg)
    return {"parada": "orcamento_passos", "resposta": _parcial(fatos, "orçamento de passos esgotado"),
            "passos": passos, "fatos": fatos}
`;
  var solucaoLoop = String.raw`def _parcial(fatos, motivo):
    if not fatos:
        return f"Não concluído ({motivo}) e sem fato verificável."
    linhas = "\n".join(f"- {f}" for f in fatos)
    return f"RESPOSTA PARCIAL ({motivo}).\n\nFatos estabelecidos:\n{linhas}"


def investigar(roteiro, max_passos=5, max_repeticoes=2, exige_aprovacao=("repo_escrever",)):
    modelo = iter(roteiro)
    assinaturas = {}
    fatos = []
    passos = 0
    for _ in range(max_passos):
        acao = next(modelo, ("final", ""))
        if acao[0] == "final":
            return {"parada": "sucesso", "resposta": acao[1], "passos": passos, "fatos": fatos}
        _, nome, arg = acao
        passos += 1
        assinatura = (nome, arg)
        assinaturas[assinatura] = assinaturas.get(assinatura, 0) + 1
        if assinaturas[assinatura] > max_repeticoes:
            return {"parada": "loop_esteril",
                    "resposta": _parcial(fatos, f"repetiu {nome} sem progresso"),
                    "passos": passos, "fatos": fatos}
        if nome in exige_aprovacao:
            return {"parada": "requer_humano", "resposta": f"aprovação necessária para {nome}",
                    "passos": passos, "fatos": fatos}
        if nome == "notas_registrar":
            fatos.append(arg)
    return {"parada": "orcamento_passos", "resposta": _parcial(fatos, "orçamento de passos esgotado"),
            "passos": passos, "fatos": fatos}
`;
  var testesLoop = String.raw`def test_sucesso_quando_o_modelo_responde():
    r = investigar([("tool", "repo_buscar_simbolo", "fechar_pedido"), ("final", "ok")])
    assert r["parada"] == "sucesso" and r["passos"] == 1 and r["resposta"] == "ok"


def test_passos_esgotados_devolve_parcial_com_fatos():
    roteiro = [("tool", "notas_registrar", "fechar_pedido chama calcular_total"),
               ("tool", "repo_ler_trecho", "loja.py:1-20"),
               ("tool", "repo_listar_referencias", "calcular_total")]
    r = investigar(roteiro, max_passos=2)
    assert r["parada"] == "orcamento_passos"
    assert r["resposta"].startswith("RESPOSTA PARCIAL")
    assert "- fechar_pedido chama calcular_total" in r["resposta"]


def test_loop_esteril_na_terceira_repeticao():
    chamada = ("tool", "repo_buscar_simbolo", "X")
    r = investigar([chamada] * 5, max_repeticoes=2)
    assert r["parada"] == "loop_esteril" and r["passos"] == 3


def test_escrita_pausa_para_humano_sem_executar():
    r = investigar([("tool", "notas_registrar", "fato A"), ("tool", "repo_escrever", "loja.py")])
    assert r["parada"] == "requer_humano"
    assert r["fatos"] == ["fato A"]


def test_parcial_sem_fatos_diz_que_nao_ha_fato():
    r = investigar([("tool", "repo_buscar_simbolo", "A"), ("tool", "repo_buscar_simbolo", "B")], max_passos=2)
    assert r["parada"] == "orcamento_passos"
    assert "sem fato verificável" in r["resposta"]
`;

  TrilhaAula.registrar({
    id: 'm08-b5',
    titulo: 'O loop: planejar, agir, observar, parar',
    minutos: 40,
    resumo: 'Agente sem critério de parada não é autônomo, é uma fatura aberta com esperança de convergir. O loop de produção tem orçamento em três dimensões, sete critérios de parada, erro que volta como observação e aprovação por política em código.',
    objetivo: 'Montar um loop que termina sempre, devolve resposta parcial honesta quando o orçamento acaba, detecta loop estéril e pausa para um humano antes de qualquer escrita.',
    revisao: [
      { id: 'm08b5-parcial', pergunta: 'O orçamento de passos acabou no meio de uma investigação. O que o loop deve devolver?',
        opcoes: [
          opc('a', 'Resposta parcial honesta: o que foi apurado, marcado como parcial, com o que faltou verificar', true, 'a ordem é completa, parcial honesta, "não encontrei" e, só por último, a inventada, que é a única inaceitável.'),
          opc('b', 'Um erro genérico: "não consegui"', false, 'desperdiça tudo o que foi apurado.'),
          opc('c', 'A melhor suposição, apresentada como resposta final', false, 'resposta inventada é o que o sistema produz quando você não implementa as outras.')] },
      { id: 'm08b5-esteril', pergunta: 'O agente chama <code>buscar_simbolo("X")</code> pela terceira vez com os mesmos argumentos. O que é isso e o que fazer?',
        opcoes: [
          opc('a', 'Loop estéril: detecte a assinatura repetida (nome + argumentos) e interrompa com diagnóstico, devolvendo o parcial', true, 'sem fato novo, repetir é desperdício; o contador de assinaturas é a versão barata de detecção de ciclo.'),
          opc('b', 'Comportamento normal; basta aumentar o limite de passos', false, 'aumentar o limite é o caminho para a fatura aberta.'),
          opc('c', 'Prova de que o modelo está certo e deve continuar', false, 'repetição sem fato novo não é evidência de nada.')] },
      { id: 'm08b5-hitl', pergunta: 'Por que a lista de ferramentas que exigem aprovação deve ser uma allowlist em código (default deny) e não uma instrução no prompt?',
        opcoes: [
          opc('a', 'Instrução no prompt é pedido, não mecanismo: o modelo propõe e o runtime intercepta', true, 'a política de autorização fica determinística e testável; escrita sem aprovação é negada por padrão.'),
          opc('b', 'Porque o código é mais rápido que o prompt', false, 'o motivo não é velocidade.'),
          opc('c', 'Porque modelos não entendem a palavra "aprovação"', false, 'entendem; o problema é que entender não é obedecer.')] },
      { id: 'm08b5-erro', pergunta: 'Uma ferramenta falha. Como o erro entra no loop?',
        opcoes: [
          opc('a', 'Como observação (resultado com <code>is_error</code>), para o modelo corrigir; o mesmo erro repetido com os mesmos argumentos conta como loop estéril', true, 'exceção mata o loop; observação permite correção.'),
          opc('b', 'Como exceção que encerra a execução', false, 'mata o loop sem chance de correção.'),
          opc('c', 'É descartado e o loop segue como se nada tivesse acontecido', false, 'o modelo precisa ver o erro para mudar de caminho.')] },
      { id: 'm08b5-variante', pergunta: 'Por que o loop precisa de passos, custo e tempo impostos por você?',
        opcoes: [
          opc('a', 'São a variante decrescente que garante terminação; "o modelo percebe que terminou" não é prova', true, 'o progresso semântico não é mensurável diretamente, então você impõe variantes artificiais.'),
          opc('b', 'Porque o modelo cobra por passo e só por isso', false, 'custo é uma das três dimensões, não a razão de ter variante.'),
          opc('c', 'Para o modelo saber quanto raciocinar', false, 'o orçamento é do runtime, não uma dica ao modelo.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Você já escreveu um loop de tool calling no M05 (bloco 3). Aqui ele vira algo que sobrevive à produção: com critério de parada explícito, orçamento em três dimensões, tratamento de erro que não envenena o contexto e ponto de intervenção humana. A frase que resume o risco: <strong>agente sem critério de parada não é autônomo, é uma fatura aberta com esperança de convergir</strong>.</p>' +
          '<h3>Anatomia do loop</h3>' +
          '<p>É o ciclo <strong>ReAct</strong> (Reason + Act): enquanto não terminou e dentro do orçamento, o modelo <strong>planeja</strong> (responder ou chamar ferramenta), o <em>seu código</em> <strong>age</strong> (valida, autoriza e executa), o resultado ou o erro acionável <strong>volta ao contexto</strong> (observar) e o runtime <strong>avalia</strong> os critérios de parada.</p>' +
          '<p>Na prática moderna, a parte "Reason" não precisa ser texto solto pedido no prompt: os modelos atuais raciocinam nativamente e emitem a chamada estruturada. O que você controla, e onde mora a diferença entre um agente que funciona e um que queima orçamento, é o passo 2 (autorização e execução) e o passo 4 (parada): os dois são código seu.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'ReAct, chain-of-thought e reasoning models', html:
          '<p><strong>Chain-of-thought (CoT)</strong> é pedir ao modelo que exponha o raciocínio antes da resposta: o texto intermediário vira contexto para ele mesmo. <strong>ReAct</strong> (2022) intercala raciocínio com <em>ações</em>: pensa, chama ferramenta, observa, pensa de novo; estabeleceu o formato de loop que todo agente usa. <strong>Reasoning models</strong> (variantes "thinking") internalizaram o CoT: produzem tokens de raciocínio sem você pedir e cobram por eles como saída.</p>' +
          '<ul><li>Não peça "pense passo a passo" a um modelo que já raciocina: você paga duas vezes.</li>' +
          '<li>O raciocínio consome <code>max_tokens</code>: dimensione o teto com folga.</li>' +
          '<li>O formato ReAct em texto (<code>Thought: … Action: …</code>) foi substituído por tool calling estruturado, mais confiável de parsear; tutorial que pede "Action:" em texto é da era pré-tool-calling.</li></ul>' },
        { tipo: 'texto', html:
          '<h3>Os sete critérios de parada</h3>' +
          '<p>Um agente precisa de todos, não de um.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Critério</th><th>Como detectar</th><th>O que fazer ao disparar</th></tr></thead><tbody>' +
          '<tr><td>Sucesso</td><td>o modelo devolve resposta final (sem <code>tool_use</code>) e ela passa na validação do schema</td><td>retornar</td></tr>' +
          '<tr><td>Orçamento de passos</td><td>contador de iterações</td><td>retornar resposta parcial com o que foi apurado, nunca vazio</td></tr>' +
          '<tr><td>Orçamento de tokens/custo</td><td>soma acumulada por execução</td><td>idem, e registrar como incidente de custo (M05 b7)</td></tr>' +
          '<tr><td>Orçamento de tempo</td><td>relógio desde o início</td><td>idem: o usuário tem limite de paciência e o proxy tem timeout</td></tr>' +
          '<tr><td>Loop estéril</td><td>mesma chamada (nome + argumentos) repetida N vezes, ou nenhum fato novo em N passos</td><td>interromper com diagnóstico: "repetiu buscar_simbolo(\'X\') 3 vezes"</td></tr>' +
          '<tr><td>Erro irrecuperável</td><td>ferramenta crítica falhando de forma consistente</td><td>abortar com erro claro (fail fast, M01 b2)</td></tr>' +
          '<tr><td>Requer humano</td><td>ação irreversível proposta, ou ambiguidade que o agente não resolve</td><td>pausar e pedir aprovação (M12; fator 7 do M01)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'O loop é seu: o modelo <mark>planeja</mark>, o seu código <mark>autoriza, executa e para</mark>. Sem os <mark>sete critérios</mark>, é fatura aberta.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Acompanhe as sete etapas de uma execução do agente investigador. Os números de passo, tokens e tempo são <strong>ilustrativos</strong>, para mostrar o orçamento girando; a execução real com modelo falso está no laboratório guiado.</p>' },
        { tipo: 'rode', id: 'b5-rode-loop', titulo: 'Uma execução, volta a volta',
          enunciado: 'Aperte Enter e depois clique nas etapas, na ordem, para ver o contador de orçamento e o motivo da parada.',
          prefixo: 'Prompt', entrada: 'O que quebra se eu mudar a assinatura de fechar_pedido?', unidade: 's', terminalTitulo: 'investigador · execução ilustrativa',
          prever: { pergunta: 'Na sexta volta, o agente propõe pela terceira vez a mesma chamada, <code>buscar_simbolo("X")</code>, sem fato novo. Qual critério deve disparar?', opcoes: [
            { id: 'a', texto: 'Orçamento de passos: ainda não, o teto é 12.', correta: false, porque: 'o teto não foi atingido; o problema é outro.' },
            { id: 'b', texto: 'Loop estéril: a assinatura repetida interrompe com diagnóstico e devolve o parcial.', correta: true, porque: 'nome + argumentos repetidos sem fato novo é o sinal; esperar o teto de passos gasta orçamento à toa.' },
            { id: 'c', texto: 'Nenhum: o modelo sabe o que faz.', correta: false, porque: '"o modelo percebe" não é prova de terminação.' }
          ] },
          etapas: [
            { id: 'orc', nome: '1 · Orçamento', descricao: 'Teto antes de começar', tom: 'dns', ms: 1, linhas: [
              L('info', 'objetivo e orçamentos definidos antes da primeira chamada'),
              L('hint', 'passo 0/12 · 0/40k tokens · 0/60s: o loop começa com o teto, não com a esperança')] },
            { id: 'planejar', nome: '2 · Planejar', descricao: 'O modelo emite uma chamada', tom: 'request', ms: 2, linhas: [
              L('in', 'tool = repo_buscar_simbolo("fechar_pedido")'),
              L('hint', 'passo 1/12 · 3k/40k tokens · a escolha da ferramenta é do modelo; a execução não será')] },
            { id: 'agir', nome: '3 · Agir', descricao: 'O runtime valida, autoriza e executa', tom: 'tcp', ms: 1, linhas: [
              L('info', 'allowlist em código, timeout por ferramenta, idempotência'),
              L('hint', 'escrita sem aprovação: negada por padrão (default deny)')] },
            { id: 'observar', nome: '4 · Observar', descricao: 'O resultado volta truncado', tom: 'response', ms: 1, linhas: [
              L('out', '+2,4k tokens de observação'),
              L('hint', 'erro de ferramenta volta como observação, não como exceção; saída crua grande é o vilão silencioso do contexto')] },
            { id: 'parar', nome: '5 · Parar?', descricao: 'Sete critérios, não um', tom: 'tls', ms: 1, linhas: [
              L('info', 'sucesso, passos, custo, tempo, loop estéril, erro fatal, precisa de humano'),
              L('hint', 'nenhum disparou: volta ao Planejar com o contexto atualizado')] },
            { id: 'volta', nome: '6 · Segunda volta', descricao: 'A mesma chamada de novo', tom: 'request', ms: 2, linhas: [
              L('in', 'buscar_simbolo("X") pela 3ª vez'),
              L('hint', 'passo 6/12 · repetições da assinatura: 3/3 · contador de assinaturas = loop estéril detectado')] },
            { id: 'parcial', nome: '7 · Parcial honesta', descricao: 'Para com diagnóstico', tom: 'ink', ms: 1, linhas: [
              L('out', 'parou: loop estéril · fatos: 4 · faltou verificar: 2'),
              L('hint', 'parcial > vazia > inventada; as notas em disco (bloco 4) tornam a parcial útil')] }
          ],
          tutorDepois: 'Orçamento e parada ficam <em>fora</em> do modelo: o modelo propõe, o runtime decide se a volta acontece.',
          callout: 'Você acompanhou as sete etapas, da primeira volta à parada com resposta parcial.' },
        { tipo: 'texto', html:
          '<h3>Resposta parcial &gt; vazia &gt; inventada</h3>' +
          '<p>Quando o orçamento acaba, a tentação é devolver erro genérico ("não consegui"). Isso desperdiça tudo o que foi apurado. O correto é devolver o que se sabe, <strong>marcado como parcial</strong>, com o que faltou verificar, e é aqui que as <strong>notas estruturadas</strong> do bloco 4 pagam sozinhas: os fatos já estão registrados. A ordem de preferência é resposta completa, parcial honesta, "não encontrei" e, por último, resposta inventada, a única inaceitável e o lugar para onde o sistema escorrega se você não implementar as outras.</p>' +
          '<h3>O loop robusto, em linhas gerais</h3>' +
          '<ul><li>Os orçamentos (custo e tempo) são verificados <em>antes</em> de gastar mais; o de passos é o próprio <code>for</code>.</li>' +
          '<li>Cada chamada gera uma <strong>assinatura</strong> (nome + argumentos ordenados) contada num <code>Counter</code>; passou do máximo de repetições, encerra como <code>loop_esteril</code>.</li>' +
          '<li>A pergunta "exige aprovação?" é código (<code>_exige_aprovacao</code>), não prompt: o modelo propõe, o runtime intercepta (M12 constrói a camada completa).</li>' +
          '<li>Resultados voltam como <code>tool_result</code> com <code>is_error</code>; a execução devolve <code>Execucao</code> com resposta, motivo de parada, passos, custo, duração, fatos e a lista de chamadas para o trace (M06).</li></ul>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'Parada = Literal[',
          '    "sucesso", "orcamento_passos", "orcamento_custo", "orcamento_tempo",',
          '    "loop_esteril", "erro_irrecuperavel", "requer_humano",',
          ']',
          '',
          '@dataclass(slots=True)',
          'class Orcamento:',
          '    max_passos: int = 12',
          '    max_custo_usd: float = 0.50',
          '    max_segundos: float = 120.0',
          '    max_repeticoes: int = 3   # mesma chamada repetida = loop estéril'].join('\n') },
        { tipo: 'callout', tom: 'info', titulo: 'Confiabilidade: o que separa demo de produção', html:
          '<ul><li><strong>Erro como observação.</strong> Exceção mata o loop; observação permite correção (fator 9 do M01). Erro repetido, na mesma ferramenta e com os mesmos argumentos, é loop estéril: conte.</li>' +
          '<li><strong>Timeout por ferramenta</strong>, não só global: uma busca que trava não pode consumir o orçamento inteiro.</li>' +
          '<li><strong>Idempotência.</strong> O job pode ser reexecutado (fila, retry, restart): chave de idempotência por execução e ferramentas de escrita idempotentes, senão o agente cria o mesmo relatório três vezes.</li>' +
          '<li><strong>HITL como política.</strong> A lista de ferramentas que exigem aprovação é código.</li>' +
          '<li><strong>Tudo no trace:</strong> sequência de ferramentas, motivo de parada, custo, passos (M06 bloco 5). Sem isso você não depura execução não determinística.</li></ul>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fundamento: terminação, invariantes, ciclos', html:
          '<ul><li><strong>Variante decrescente.</strong> Todo loop precisa de uma quantidade que garanta terminação. Como o progresso semântico não é mensurável, você impõe variantes artificiais (passos, custo, tempo). Sem elas não há prova de terminação.</li>' +
          '<li><strong>Invariantes de loop.</strong> A cada volta: o escopo (tenant/repo) não muda, nenhum fato registrado é apagado, o orçamento só diminui. Escrevê-los ajuda a achar o bug quando o agente "faz algo estranho".</li>' +
          '<li><strong>Detecção de ciclo</strong> é problema resolvido: estado repetido é ciclo. O <code>Counter</code> de assinaturas é a versão barata; para agentes complexos, hash do estado (contexto + notas).</li>' +
          '<li><strong>Degradação graciosa.</strong> A parcial é o mesmo princípio do circuit breaker em half-open: entregar o que dá em vez de falhar por inteiro.</li></ul>' },
        { tipo: 'takeaway', html: 'Parar com <mark>parcial honesta</mark> é melhor que erro genérico, e as <mark>notas em disco</mark> é que a tornam possível.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'ordene', id: 'b5-ordene-volta', titulo: 'Ordene uma volta do loop robusto',
          enunciado: 'Monte o ciclo de uma volta, do primeiro ao último passo.',
          itens: [
            { id: 'avalia', texto: 'O runtime avalia os critérios de parada antes da próxima volta' },
            { id: 'exec', texto: 'A ferramenta executa, com timeout próprio' },
            { id: 'propoe', texto: 'O modelo propõe uma chamada de ferramenta (planejar)' },
            { id: 'obs', texto: 'O resultado volta ao contexto, truncado, como observação' },
            { id: 'allow', texto: 'O runtime checa a allowlist e a necessidade de aprovação' }
          ],
          solucao: ['propoe', 'allow', 'exec', 'obs', 'avalia'],
          dica: 'O modelo só propõe; antes de qualquer execução vem a checagem do runtime, e a parada é avaliada por último.',
          tutorDepois: 'Autorizar vem antes de executar, e parar vem depois de observar: os dois passos do meio e do fim são código seu.',
          callout: 'Volta ordenada: proposta, autorização, execução, observação e avaliação de parada.' },
        { tipo: 'python', id: 'b5-python-loop', titulo: 'Escreva as paradas do loop', obrigatorio: false,
          enunciado: 'O modelo é falso: um <code>roteiro</code> de ações. Complete <code>_parcial</code> e os dois <code>TODO</code> de <code>investigar</code>: parar por <code>loop_esteril</code> quando a assinatura (nome + argumento) passa de <code>max_repeticoes</code>, e por <code>requer_humano</code> sem executar a ferramenta que exige aprovação. Tudo na biblioteca padrão, sem rede.',
          codigo: codigoLoop, testes: testesLoop,
          dica: 'Conte assinaturas num dicionário; a (max_repeticoes + 1)-ésima ocorrência dispara. Na parcial, monte "RESPOSTA PARCIAL (motivo)." e uma linha "- fato" por fato; sem fatos, diga "sem fato verificável".',
          solucao: solucaoLoop,
          tutorDepois: 'Repare na ordem: repetição é checada antes da aprovação, e a parcial carrega os fatos apurados em todos os estouros.',
          callout: 'Loop com sucesso, estouro de passos, loop estéril e pausa para humano, todos devolvendo parcial útil.' },
        { tipo: 'transcript', id: 'b5-transcript-parada', titulo: 'Ache a parada mal tratada', obrigatorio: false, terminalTitulo: 'execução do investigador',
          enunciado: 'O orçamento de passos acabou e o agente reportou o resultado. Uma das linhas contradiz o que o loop deveria fazer. Clique nela e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'O que quebra se eu mudar a assinatura de fechar_pedido?' },
            { quem: 'ferramenta', texto: 'notas_registrar("fechar_pedido chama calcular_total") ok\nnotas_registrar("calcular_total: loja.py, DEFINIÇÃO") ok' },
            { quem: 'ferramenta', texto: 'orçamento de passos esgotado (12/12)' },
            { quem: 'agente', texto: 'Não consegui concluir a investigação.' },
            { quem: 'agente', texto: 'Resposta final: o impacto é só em fechar_pedido, com alta confiança.' }
          ],
          erradas: [3, 4],
          explicacao: {
            3: 'erro genérico joga fora os dois fatos já registrados; o correto era devolver a parcial com o que foi apurado e o que faltou verificar.',
            4: 'declarar resposta final com alta confiança depois de estourar o orçamento é a resposta inventada, a única inaceitável: deveria estar marcada como parcial.'
          },
          tutorDepois: 'Completa, parcial honesta, "não encontrei", inventada: o loop tem de cair no degrau certo, e as notas em disco é que dão material à parcial.' },
        { tipo: 'takeaway', html: '<mark>Autorização</mark> antes de executar, <mark>parada</mark> depois de observar: as duas decisões que o modelo não toma.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b5-escolha-parcial', titulo: 'Confira: estourou o orçamento',
          pergunta: 'O agente estourou o orçamento de custo depois de registrar quatro fatos com evidência. O que o loop entrega?',
          opcoes: [
            { id: 'a', texto: 'Resposta parcial marcada como tal, com os quatro fatos e o que faltou verificar; o estouro é registrado como incidente de custo.', correta: true, porque: 'parcial honesta aproveita o que foi apurado; vazio ou genérico é defeito.' },
            { id: 'b', texto: '"Não consegui", para não arriscar uma resposta incompleta.', correta: false, porque: 'desperdiça os fatos que as notas guardaram.' },
            { id: 'c', texto: 'A conclusão mais provável, sem marcar que é parcial.', correta: false, porque: 'sem a marca, a parcial vira resposta inventada aos olhos do usuário.' },
            { id: 'd', texto: 'Nada: o usuário reexecuta com orçamento maior.', correta: false, porque: 'refazer do zero joga fora o trabalho feito.' }
          ], tutorDepois: 'Os fatos já estavam registrados: é a vantagem das notas estruturadas.' },
        { tipo: 'escolha', id: 'b5-escolha-hitl', titulo: 'Confira: quem decide a aprovação',
          pergunta: 'O prompt diz "peça aprovação antes de escrever em arquivos". Numa execução, o modelo chama a ferramenta de escrita direto. Qual é a falha de desenho?',
          opcoes: [
            { id: 'a', texto: 'O prompt deveria ser mais enfático.', correta: false, porque: 'ênfase é pedido; continua sem mecanismo.' },
            { id: 'b', texto: 'A política mora no prompt e não no runtime: o correto é allowlist em código (leitura liberada, escrita negada por padrão) e o runtime interceptar a chamada.', correta: true, porque: 'o modelo propõe; o runtime intercepta, de forma determinística e testável.' },
            { id: 'c', texto: 'O modelo é pequeno demais para seguir instruções.', correta: false, porque: 'modelo maior continua não sendo mecanismo.' }
          ], tutorDepois: 'É o fator 7 do M01 aplicado ao loop.' },
        { tipo: 'takeaway', html: 'Sete <mark>critérios de parada</mark>, três <mark>orçamentos</mark>, aprovação em <mark>código</mark>: é o que o modelo não decide por você.' }
      ] }
    ]
  });
})();
