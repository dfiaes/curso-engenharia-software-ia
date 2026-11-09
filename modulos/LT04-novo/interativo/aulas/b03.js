/* LT04 · Bloco 3: Rollback e restauração. Fonte: LT04.html#b03. Saídas do terminal vêm de execução local de lab/rollback_release.py (exemplo, não evidência do lab). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoRb = [
    'def stop_disparado(metricas, limites):',
    '    # métricas ACIMA do limite (> e não >=), em ordem alfabética;',
    '    # métrica ausente conta como 0.0; vazio = seguir',
    '    return []',
    '',
    '',
    'def escolher_alvo(historico, atual):',
    '    # o alvo é o release anterior (índice atual - 1);',
    '    # sem anterior (atual <= 0 ou fora do histórico): ValueError',
    '    return historico[atual]',
    '',
    '',
    'def reverter(historico, atual, violacoes):',
    '    # sem violações: manter o atual; com violações: rollback ao alvo',
    '    return {"acao": "manter", "alvo": historico[atual]}',
    '',
    '',
    'def restauracao_ok(alvo, estado):',
    '    # prova nos três eixos: digest igual, dado igual e saudavel is True',
    '    return estado.get("digest") == alvo.get("digest")'
  ].join("\n");
  var testesRb = [
    'HIST = [',
    '    {"versao": "2.0.0", "digest": "sha256:" + "a" * 64, "dado": "esquema-7"},',
    '    {"versao": "2.1.0", "digest": "sha256:" + "b" * 64, "dado": "esquema-8"},',
    ']',
    '',
    '',
    'def test_stop_nomeia_so_o_que_violou():',
    '    lim = {"erro": 5.0, "p99": 800.0}',
    '    assert stop_disparado({"erro": 3.0, "p99": 950.0}, lim) == ["p99"]',
    '    assert stop_disparado({"erro": 6.0, "p99": 950.0}, lim) == ["erro", "p99"]',
    '',
    '',
    'def test_stop_vazio_segue_e_limite_exato_nao_dispara():',
    '    lim = {"erro": 5.0, "p99": 800.0}',
    '    assert stop_disparado({"erro": 5.0, "p99": 800.0}, lim) == []',
    '    assert stop_disparado({}, lim) == []',
    '',
    '',
    'def test_alvo_e_o_anterior():',
    '    assert escolher_alvo(HIST, 1) == HIST[0]',
    '',
    '',
    'def test_sem_anterior_erro_explicito():',
    '    for atual in (0, 2):',
    '        try:',
    '            escolher_alvo(HIST, atual)',
    '        except ValueError:',
    '            continue',
    '        assert False, atual',
    '',
    '',
    'def test_reverter_mantem_sem_stop_e_volta_com_stop():',
    '    assert reverter(HIST, 1, []) == {"acao": "manter", "alvo": HIST[1]}',
    '    assert reverter(HIST, 1, ["p99"]) == {"acao": "rollback", "alvo": HIST[0]}',
    '',
    '',
    'def test_reverter_primeiro_release_com_stop_levanta():',
    '    try:',
    '        reverter(HIST, 0, ["erro"])',
    '    except ValueError:',
    '        return',
    '    assert False',
    '',
    '',
    'def test_restore_exige_tres_eixos():',
    '    alvo = HIST[0]',
    '    ok = {"digest": alvo["digest"], "dado": "esquema-7", "saudavel": True}',
    '    assert restauracao_ok(alvo, ok) is True',
    '    assert restauracao_ok(alvo, dict(ok, digest="sha256:" + "c" * 64)) is False',
    '    assert restauracao_ok(alvo, dict(ok, dado="esquema-8")) is False',
    '    assert restauracao_ok(alvo, dict(ok, saudavel=False)) is False'
  ].join("\n");
  var solucaoRb = [
    'def stop_disparado(metricas, limites):',
    '    return sorted(m for m, teto in limites.items() if metricas.get(m, 0.0) > teto)',
    '',
    '',
    'def escolher_alvo(historico, atual):',
    '    if atual <= 0 or atual >= len(historico):',
    '        raise ValueError(f"sem release anterior para regredir (atual={atual})")',
    '    return historico[atual - 1]',
    '',
    '',
    'def reverter(historico, atual, violacoes):',
    '    if not violacoes:',
    '        return {"acao": "manter", "alvo": historico[atual]}',
    '    return {"acao": "rollback", "alvo": escolher_alvo(historico, atual)}',
    '',
    '',
    'def restauracao_ok(alvo, estado):',
    '    return (',
    '        estado.get("digest") == alvo.get("digest")',
    '        and estado.get("dado") == alvo.get("dado")',
    '        and estado.get("saudavel") is True',
    '    )'
  ].join("\n");

  var CHAMADA = 'reverter(historico, atual=1, violacoes)';
  var HIST = [
    L('info', 'historico[0] = 2.0.0  sha256:aaaa...  dado esquema-7'),
    L('info', 'historico[1] = 2.1.0  sha256:bbbb...  dado esquema-8   (atual = 1)')];

  var etapasRb = function () {
    return [
      { id: 'limites', nome: 'Limites declarados', descricao: 'Escritos antes do rollout', tom: 'dns', ms: 1, linhas: [
        L('info', 'stop condition: erro > 5.0  ou  p99 > 800.0 (ms)')].concat(HIST).concat([
        L('hint', 'sem release anterior registrado não há para onde voltar')]) },
      { id: 'leitura', nome: 'Leitura do canário', descricao: 'Cada limite, de forma independente', tom: 'tcp', ms: 1, linhas: [
        L('cmd', 'stop_disparado({"erro": 3.0, "p99": 950.0}, {"erro": 5.0, "p99": 800.0})'),
        L('out', "['p99']"),
        L('hint', 'o erro está dentro, o p99 não: um verde não absolve o outro')] },
      { id: 'rollback', nome: 'Rollback ao anterior', descricao: 'Alvo = release anterior, por digest', tom: 'tls', ms: 1, linhas: [
        L('cmd', CHAMADA.replace('violacoes', '["p99"]')),
        L('out', "{'acao': 'rollback', 'alvo': {'versao': '2.0.0', 'digest': 'sha256:aaaa...', 'dado': 'esquema-7'}}"),
        L('hint', 'destino = par versão + digest do histórico, nunca "a que funcionava"')] },
      { id: 'restore', nome: 'Restore provado', descricao: 'Digest, dado e saúde', tom: 'response', ms: 1, linhas: [
        L('cmd', 'restauracao_ok(alvo, {"digest": "sha256:aaaa...", "dado": "esquema-7", "saudavel": True})'),
        L('out', 'True'),
        L('hint', 'só os três eixos juntos provam a volta')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'lt04-b3',
    titulo: 'Rollback e restauração',
    minutos: 32,
    resumo: '"Voltamos e torcemos" não é reversão. O limite é declarado antes, o alvo é o digest do release anterior e a volta só existe quando digest, dado e saúde estão provados.',
    objetivo: 'Disparar a stop condition por métrica contra limite, reverter ao release anterior por digest (com erro explícito quando não há anterior) e recusar restore sem prova nos três eixos.',
    revisao: [
      { id: 'lt04b3-stop', pergunta: 'Stops declarados: erro &gt; 5% e p99 &gt; 800 ms. O canário mostra erro de 3% e p99 de 950 ms. O que o oráculo devolve e o que o time faz?',
        opcoes: [
          opc('a', 'Uma violação (p99): o stop dispara e o time reverte ao release anterior por digest, sem reunião', true, 'cada limite é avaliado de forma independente, e o número foi escrito antes do rollout para ser obedecido sem negociação.'),
          opc('b', 'Lista vazia: o erro está dentro do limite', false, 'o erro dentro do limite mascara a violação de cauda.'),
          opc('c', 'Nada, até alguém decidir em reunião se 950 ms é grave', false, 'stop negociado na hora vira opinião.')] },
      { id: 'lt04b3-previo', pergunta: 'Por que o limite do stop é declarado antes do rollout, e o que a lista vazia significa?',
        opcoes: [
          opc('a', 'Para ser obedecido sem negociar na crise; lista vazia é "seguir", um silêncio calculado', true, 'vazio não é ausência de leitura: as métricas foram lidas e estão dentro.'),
          opc('b', 'Para ajustar o limite conforme o susto do dia', false, 'stop que se negocia na hora é enfeite.'),
          opc('c', 'Porque lista vazia significa que faltou métrica', false, 'métrica ausente conta como 0.0 e a lista vazia é decisão de seguir.')] },
      { id: 'lt04b3-sem-anterior', pergunta: 'O stop dispara no primeiro release do histórico. Qual a ação correta?',
        opcoes: [
          opc('a', 'Erro explícito (ValueError); corrigir adiante é uma decisão nova, com gate novo', true, 'sem anterior não há volta, e o contrato não inventa destino.'),
          opc('b', 'Reverter para a tag latest', false, 'inventar destino por apelido é o defeito raiz do bloco.'),
          opc('c', 'Manter o release e ignorar o stop', false, 'o stop disparado não é opcional.')] },
      { id: 'lt04b3-eixos', pergunta: 'Quais são os três eixos da restauração provada?',
        opcoes: [
          opc('a', 'Mesmo digest do alvo, dado compatível com o esquema do alvo e serviço saudável', true, 'cada eixo reprova sozinho: digest certo com dado incompatível é corrupção restaurada; tudo certo sem saúde é promessa.'),
          opc('b', 'Mesma tag, mesma data e mesmo autor', false, 'tag é apelido mutável.'),
          opc('c', 'Só o digest, porque ele identifica o artefato', false, 'o binário certo sobre dado de outro esquema ainda quebra.')] },
      { id: 'lt04b3-rollforward', pergunta: 'Quando o roll-forward (corrigir adiante) entra na conversa?',
        opcoes: [
          opc('a', 'Como decisão nova, com gate novo; nunca como atalho para fugir do stop', true, 'o stop disparado manda reverter; seguir adiante é outro release com a própria barreira.'),
          opc('b', 'Sempre que o time preferir não reverter', false, 'fugir do stop por preferência desmonta o limite prévio.'),
          opc('c', 'Nunca existe', false, 'existe, mas com gate novo.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>"Voltamos e ficou pior." O binário antigo subiu, mas sobre o dado do esquema novo; ou subiu e ninguém checou se estava saudável; ou "o anterior" era uma tag que mudou de dono durante a crise. Este bloco troca "voltamos e torcemos" por <strong>reversão decidida e restauração provada</strong>. Três resultados:</p>' +
          '<ul><li>disparar a <strong>stop condition</strong> por métrica contra limite: violação nomeada, não sensação;</li>' +
          '<li>reverter ao <strong>release anterior conhecido por digest</strong>; sem anterior, erro explícito, nunca improviso;</li>' +
          '<li>provar a <strong>restauração</strong> por digest, dado compatível e saúde: restore sem prova é segunda queda adiada.</li></ul>' +
          '<p>Pré-requisitos: Bloco 1 (digest como identidade) e Bloco 2 (quem veta). Tráfego e dado reais pertencem à trilha externa: BLOCKED com registro.</p>' },
        { tipo: 'texto', html:
          '<h3>Stop condition: o abort com nome e número</h3>' +
          '<p><strong>Stop condition</strong> é o limite pré-declarado que aborta a promoção: erro acima de 5%, p99 acima de 800 ms. É número, não pressentimento. Declarada antes do rollout, lida durante, obedecida sem reunião. O oráculo devolve a lista de violações em ordem; <strong>lista vazia significa seguir</strong>, um silêncio calculado e não ausência de leitura.</p>' +
          '<h3>Rollback: a volta ao conhecido</h3>' +
          '<p><strong>Rollback</strong> é a promoção reversa ao release anterior conhecido, identificado por <strong>digest</strong>: não "a versão que funcionava", mas o par versão mais digest registrado no histórico. O contrato cobra três casos: com stop, rollback ao anterior; sem stop, manter o atual; sem anterior, erro.</p>' +
          '<p><strong>Roll-forward</strong> (corrigir adiante) existe, mas é decisão nova com gate novo, não atalho para fugir do stop.</p>' +
          '<h3>Restore: a prova de que voltou</h3>' +
          '<p><strong>Restore</strong> só existe provado em três eixos, e cada um reprova sozinho:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Eixo</th><th>O que prova</th><th>Se falhar</th></tr></thead><tbody>' +
          '<tr><td>Digest</td><td>o artefato em execução é o do alvo</td><td>conteúdo errado; o rollback mirou um apelido</td></tr>' +
          '<tr><td>Dado</td><td>o dado é compatível com o esquema do alvo</td><td>corrupção restaurada: binário certo, dado de outro esquema</td></tr>' +
          '<tr><td>Saúde</td><td>o serviço responde saudável (health check verde)</td><td>promessa, não prova</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Evidência de restore', html:
          '<p>A prova entra no dossiê como as demais: digest, verificação e quem atestou. Dizer "voltou" antes dela adia a segunda queda.</p>' },
        { tipo: 'takeaway', html: 'O <mark>limite vem antes</mark>, o alvo é o <mark>digest anterior</mark> e a volta só existe <mark>provada em três eixos</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Do stop ao restore</h3>' +
          '<p>Estas quatro etapas são o caminho feliz. A saída veio de uma execução local de <code>lab/rollback_release.py</code> (digests abreviados; valores são exemplo variável, não evidência do lab). Depois do primeiro Enter, troque a falha e veja o que cada eixo barra.</p>' },
        { tipo: 'quebre', id: 'b3-quebre', titulo: 'Reverta, e quebre a reversão',
          enunciado: 'Aperte Enter sem falha para ver o caminho feliz. Depois escolha uma falha, preveja e rode; por fim, rode "Sem falha" para fechar.',
          prefixo: '$', entrada: CHAMADA, unidade: 'chamadas', terminalTitulo: 'lab/rollback_release.py', etapas: etapasRb(),
          prever: { pergunta: 'O canário mostra erro de 3% e p99 de 950 ms, com limites de 5% e 800 ms. O que <code>stop_disparado</code> devolve?', opcoes: [
            { id: 'a', texto: 'Lista vazia: o erro está dentro do limite.', correta: false, porque: 'cada limite é independente; o erro dentro não absolve o p99.' },
            { id: 'b', texto: '<code>["p99"]</code>: só o p99 passou do limite.', correta: true, porque: '950 > 800, e 3 não passa de 5; o oráculo nomeia só o que violou.' },
            { id: 'c', texto: '<code>["erro", "p99"]</code>: perto do limite já conta.', correta: false, porque: 'só conta o que passa do limite, e com ">" estrito.' }
          ] },
          falhas: [
            { id: 'primeiro', rotulo: 'Stop no primeiro release (atual = 0)', efeito: { etapaFalha: 'rollback', linhasErro: [
              L('cmd', 'reverter(historico, atual=0, violacoes=["erro"])'),
              L('out', 'ValueError: sem release anterior para regredir (atual=0)'),
              L('hint', 'erro explícito: sem anterior não há volta')
            ], tutor: 'o contrato não inventa destino. Corrigir adiante é um roll-forward, com decisão nova e gate novo.' } },
            { id: 'digest', rotulo: 'Restore com digest trocado', efeito: { etapaFalha: 'restore', linhasErro: [
              L('cmd', 'restauracao_ok(alvo, {"digest": "sha256:cccc...", "dado": "esquema-7", "saudavel": True})'),
              L('out', 'False'),
              L('hint', 'o artefato em execução não é o do alvo')
            ], tutor: 'dado e saúde certos não compensam o conteúdo errado: o primeiro eixo reprovou sozinho.' } },
            { id: 'dado', rotulo: 'Restore com dado de outro esquema', efeito: { etapaFalha: 'restore', linhasErro: [
              L('cmd', 'restauracao_ok(alvo, {"digest": "sha256:aaaa...", "dado": "esquema-8", "saudavel": True})'),
              L('out', 'False'),
              L('hint', 'o alvo espera esquema-7; o dado está em esquema-8')
            ], tutor: 'digest certo com dado incompatível é corrupção restaurada, e o health check pode até estar verde.' } },
            { id: 'saude', rotulo: 'Restore sem saúde', efeito: { etapaFalha: 'restore', linhasErro: [
              L('cmd', 'restauracao_ok(alvo, {"digest": "sha256:aaaa...", "dado": "esquema-7", "saudavel": False})'),
              L('out', 'False'),
              L('hint', 'tudo certo, mas o serviço não responde saudável')
            ], tutor: 'sem saúde é promessa. Declarar a volta aqui adia a segunda queda.' } }
          ],
          tutorAntes: 'Antes do Enter, escolha o que o canário com erro 3% e p99 950 ms devolve em <code>stop_disparado</code>.',
          tutorDepois: 'Quatro falhas, quatro recusas com nome. O caminho certo passa pelos três eixos do restore, e o primeiro release não tem volta.',
          callout: 'Você viu cada eixo do restore reprovar sozinho e a reversão sem anterior virar erro explícito.' },
        { tipo: 'texto', html:
          '<h3>Os quatro momentos, em resumo</h3>' },
        { tipo: 'abas', rotulo: 'Linha do tempo da reversão', itens: [
          { rotulo: 'Antes', blocos: [
            { tipo: 'codigo', linguagem: 'text', texto: [
              'stop condition (declarada ANTES):  erro > 5%  ou  p99 > 800 ms',
              'release atual     v2.1  sha256:bbbb...',
              'anterior conhecido v2.0  sha256:aaaa...   (histórico)'].join('\n') }] },
          { rotulo: 'Durante', blocos: [
            { tipo: 'codigo', linguagem: 'text', texto: [
              'canário lê:  erro 3%  ·  p99 950 ms',
              'violações: [p99]     erro está dentro, p99 não',
              'o stop dispara sem reunião: o número foi escrito antes'].join('\n') }] },
          { rotulo: 'Rollback', blocos: [
            { tipo: 'codigo', linguagem: 'text', texto: [
              'v2.1  sha256:bbbb...   --rollback por digest-->   v2.0  sha256:aaaa...',
              'destino = par versão + digest do histórico, nunca "a que funcionava"'].join('\n') }] },
          { rotulo: 'Restore', blocos: [
            { tipo: 'codigo', linguagem: 'text', texto: [
              '1. digest igual   ao do alvo',
              '2. dado compatível com o esquema do alvo',
              '3. serviço saudável (health check verde)',
              'cada eixo reprova sozinho; depois, roll-forward é decisão nova com gate novo'].join('\n') }] }
        ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'No laboratório', html:
          '<p>A folha B03-L implementa este contrato verbatim em <code>lab/rollback_release.py</code> (só stdlib, sem imports) e o confere com 1 arquivo de teste (stop, reversão, restore). Rode o comando logo abaixo.</p>' },
        { tipo: 'codigo', linguagem: 'sh', texto: 'uv run pytest -q tests/test_at020_rollback.py' },
        { tipo: 'takeaway', html: 'Cada <mark>eixo do restore</mark> reprova <mark>sozinho</mark>, e o primeiro release <mark>não tem volta</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'transcript', id: 'b3-transcript', titulo: 'Ache o "voltou" que a sessão não sustenta', terminalTitulo: 'sessão de incidente',
          enunciado: 'O erro do canário passou do limite e o agente reverteu. Uma afirmação dele é contradita pelo que a ferramenta mostrou. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'O erro do canário passou de 5%. Reverta.' },
            { quem: 'agente', texto: 'Stop disparado: erro 6% > 5%. Revertendo para o release anterior, 2.0.0, pelo digest do histórico.' },
            { quem: 'ferramenta', texto: 'alvo: 2.0.0 sha256:aaaa... dado esquema-7\nestado: digest sha256:aaaa... (igual) · dado esquema-8 · saudavel True' },
            { quem: 'agente', texto: 'Restaurado: o digest é o do alvo e o health check está verde.' },
            { quem: 'agente', texto: 'Restore reprovado: o dado está em esquema-8 e o alvo espera esquema-7. Mantenho o incidente aberto e trato o roll-forward como decisão nova, com gate novo.' }
          ],
          erradas: [3],
          explicacao: { 3: 'digest e saúde são dois dos três eixos. A linha da ferramenta mostra o dado em <code>esquema-8</code>, incompatível com o <code>esquema-7</code> do alvo: corrupção restaurada, com health check verde. A linha 5 é a leitura certa.' },
          tutorDepois: 'Declarar "restaurado" pelo digest e pela saúde ignora o dado. Os três eixos são independentes.' },
        { tipo: 'python', id: 'b3-python', titulo: 'Implemente stop, reversão e restore', obrigatorio: false,
          enunciado: 'Complete <code>stop_disparado</code>, <code>escolher_alvo</code>, <code>reverter</code> e <code>restauracao_ok</code>. O limite exato não dispara (estritamente acima), métrica ausente conta como <code>0.0</code> e o primeiro release do histórico não tem anterior. Python no navegador, só biblioteca padrão.',
          codigo: codigoRb, testes: testesRb,
          dica: 'Em <code>stop_disparado</code>: <code>sorted(m for m, teto in limites.items() if metricas.get(m, 0.0) &gt; teto)</code>. Em <code>escolher_alvo</code>, se <code>atual &lt;= 0 or atual &gt;= len(historico)</code> levante <code>ValueError</code>; senão <code>historico[atual - 1]</code>. O restore compara <code>digest</code>, <code>dado</code> e <code>saudavel is True</code>.',
          solucao: solucaoRb,
          tutorDepois: 'Repare que o primeiro release com stop levanta erro dentro de <code>reverter</code>, e que sem stop nem o índice anterior é consultado.',
          callout: 'A reversão passou nos testes: stop nomeado, volta ao anterior, erro sem anterior e os três eixos do restore.' },
        { tipo: 'takeaway', html: 'Reverter é <mark>calcular o alvo</mark> no histórico; declarar a volta é <mark>provar os três eixos</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>Diagnóstico B03: erros reais, na ordem em que costumam aparecer</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Canary ruim segue promovendo</td><td>Stop sem limite pré-declarado: violação virou opinião na hora</td><td>Limites escritos antes do rollout; violação aborta sem reunião</td></tr>' +
          '<tr><td>Rollback restaura conteúdo inesperado</td><td>Alvo por tag mutável: o apelido mudou de dono</td><td>Mirar o digest do release anterior registrado no histórico</td></tr>' +
          '<tr><td>Serviço "voltou" e quebrou de outro jeito</td><td>Restore sem prova de dado: esquema incompatível com o binário</td><td>Provar digest, dado compatível e saúde antes de declarar a volta</td></tr>' +
          '<tr><td>Reversão no primeiro release trava sem mensagem</td><td>Índice sem anterior tratado como caso normal</td><td>Erro explícito sem anterior; decidir roll-forward com gate novo</td></tr>' +
          '</tbody></table>' },
        { tipo: 'escolha', id: 'b3-escolha-stop', titulo: 'Confira: o canário de 950 ms',
          pergunta: 'Stops declarados: erro &gt; 5% e p99 &gt; 800 ms. O canário mostra erro de 3% e p99 de 950 ms. O que o oráculo devolve e o que o time faz?',
          opcoes: [
            { id: 'a', texto: 'Lista vazia: a taxa de erro está dentro do limite, então segue.', correta: false, porque: 'o erro dentro do limite mascara a violação de cauda.' },
            { id: 'b', texto: 'Uma violação (p99): o stop dispara e o time reverte ao release anterior por digest, sem reunião.', correta: true, porque: 'cada limite é avaliado de forma independente; um verde não absolve o outro, e o stop foi escrito antes do rollout para ser obedecido.' },
            { id: 'c', texto: 'Duas violações, porque qualquer métrica perto do limite conta.', correta: false, porque: 'só conta o que passa do limite.' },
            { id: 'd', texto: 'Nada, até alguém decidir em reunião se 950 ms é grave.', correta: false, porque: 'o stop vira opinião na hora.' }
          ], tutorDepois: 'Silêncio calculado é lista vazia com todas as métricas lidas; aqui havia uma violação.' },
        { tipo: 'escolha', id: 'b3-escolha-restore', titulo: 'Confira: o health check ainda falha',
          pergunta: 'Rollback feito: o digest é o do alvo, o dado é compatível com o esquema do alvo, mas o health check do serviço ainda falha. Declaramos "restaurado"?',
          opcoes: [
            { id: 'a', texto: 'Sim: digest correto prova que o artefato é o certo.', correta: false, porque: 'o digest é só um dos três eixos.' },
            { id: 'b', texto: 'Sim, e o health check é investigado depois.', correta: false, porque: 'declarar a volta antes da prova adia a segunda queda.' },
            { id: 'c', texto: 'Não: restore exige digest igual, dado compatível e serviço saudável; faltando um eixo, é promessa e não prova.', correta: true, porque: 'os três eixos são independentes e cada um reprova sozinho; tudo certo sem saúde é promessa.' },
            { id: 'd', texto: 'Não, mas só se o dado também fosse incompatível.', correta: false, porque: 'um eixo reprovado já basta.' }
          ], tutorDepois: 'A evidência do restore entra no dossiê: digest, verificação e quem atestou.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fontes e versões', html:
          '<ul><li><strong>Principles of Chaos Engineering</strong> (normativa, SRC-LT04-06): hipótese, blast radius e abort. <code>principlesofchaos.org</code>, princípios canônicos, risco baixo.</li>' +
          '<li><strong>SLSA Specification 1.2</strong> (normativa, SRC-LT04-10): digest e identidade do artefato, risco médio. URLs na especificação §8.</li>' +
          '<li>O contrato de <code>lab/rollback_release.py</code> e os números citados (limites de 5% e 800 ms, p99 de 950 ms) são construção desta trilha e exemplo variável; os valores medidos nascem na folha B03-L. A fonte do módulo não registra data de verificação: confirme as versões antes de citar.</li></ul>' },
        { tipo: 'takeaway', html: 'Limite <mark>escrito antes</mark>, alvo <mark>por digest</mark>, volta <mark>provada</mark>: só então se diz que <mark>voltou</mark>.' }
      ] }
    ]
  });
})();
