/* M02A · Bloco 12: mudança incremental, entrega e reversibilidade. Fonte: M02A.html#b12. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'def avaliar_mudanca(risco, reversivel, rollback_descrito):', '    # "bloqueada" se irreversível ou sem rollback descrito; "conter" se risco "alto"; senão "liberar"', '    return "liberar"', '', '',
    'def decidir_policy(versao_ativa, v2_saudavel):', '    # flag: v2 defeituosa desativa e a v1 é restaurada', '    return versao_ativa', '', '',
    'def pode_contrair(consumidores):', '    # consumidores: {nome: versao_declarada}. Só contrai (remove o velho) se TODOS declararam "v2"', '    return True', '', '',
    'def registrar_mudanca(manifesto, commit, so, semente, digest):', '    # acrescenta ao manifesto um registro com as quatro chaves; recusa campo vazio (ValueError)', '    return manifesto', ''].join('\n');
  var testes = [
    'def test_gate_por_risco_e_reversibilidade():',
    '    assert avaliar_mudanca("baixo", True, True) == "liberar"', '    assert avaliar_mudanca("alto", True, True) == "conter"',
    '    assert avaliar_mudanca("baixo", False, True) == "bloqueada"', '    assert avaliar_mudanca("alto", True, False) == "bloqueada"', '', '',
    'def test_flag_restaura_v1():',
    '    assert decidir_policy("v2", False) == "v1"', '    assert decidir_policy("v2", True) == "v2"', '    assert decidir_policy("v1", False) == "v1"', '', '',
    'def test_contrair_so_depois_de_todos_os_consumidores():',
    '    assert pode_contrair({"a": "v2", "b": "v2"}) is True', '    assert pode_contrair({"a": "v2", "b": "v1"}) is False', '    assert pode_contrair({}) is True', '', '',
    'def test_manifesto_recusa_campo_vazio():',
    '    m = registrar_mudanca([], "abc123", "linux", 42, "sha256:1")',
    '    assert m == [{"commit": "abc123", "so": "linux", "semente": 42, "digest": "sha256:1"}]',
    '    try:', '        registrar_mudanca([], "", "linux", 42, "sha256:1")', '    except ValueError:', '        return', '    raise AssertionError("campo vazio deveria falhar")', ''].join('\n');
  var solucao = [
    'def avaliar_mudanca(risco, reversivel, rollback_descrito):', '    if not reversivel or not rollback_descrito:', '        return "bloqueada"',
    '    if risco == "alto":', '        return "conter"', '    return "liberar"', '', '',
    'def decidir_policy(versao_ativa, v2_saudavel):', '    if versao_ativa == "v2" and not v2_saudavel:', '        return "v1"', '    return versao_ativa', '', '',
    'def pode_contrair(consumidores):', '    return all(v == "v2" for v in consumidores.values())', '', '',
    'def registrar_mudanca(manifesto, commit, so, semente, digest):', '    if any(v in ("", None) for v in (commit, so, semente, digest)):', '        raise ValueError("campo vazio")',
    '    manifesto.append({"commit": commit, "so": so, "semente": semente, "digest": digest})', '    return manifesto', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b12',
    titulo: 'Mudança incremental, entrega e reversibilidade',
    minutos: 40,
    resumo: 'Qual fatia muda por vez, por qual costura do legado ela passa e qual interruptor a reverte: lote grande mistura causas e reversão improvisada descobre o problema no incidente.',
    objetivo: 'Fatiar mudanças com risco, reversibilidade e rollback declarados, modernizar o legado por costura, strangler e expand-contract e separar build, release, deploy e operação.',
    revisao: [
      { id: 'm02ab12-fatia', pergunta: 'O que a descrição de uma fatia precisa conter para a revisão não opinar só sobre estilo?',
        opcoes: [
          opc('a', 'Risco, reversibilidade e rollback descrito; o gate libera a fatia reversível de risco baixo, contém a de risco alto e bloqueia a irreversível sem rollback.', true, '"Pequena no diff, grande no efeito" é a fatia que mais mente.'),
          opc('b', 'O número de linhas.', false, 'tamanho em linhas não prova nada.'),
          opc('c', 'O nome do autor.', false, 'não informa risco.')] },
      { id: 'm02ab12-expand', pergunta: 'Qual a ordem segura para renomear uma coluna sem downtime?',
        opcoes: [
          opc('a', 'Expandir (coluna nova opcional), migrar (backfill, escrita dupla, consumidores leem a nova) e só então contrair (remover a antiga).', true, 'em nenhum momento há salto sem volta; contrair antes de todo consumidor declarar a v2 é o erro típico.'),
          opc('b', 'Renomear direto na migration.', false, 'quebra a v1 em execução.'),
          opc('c', 'Remover a antiga e criar a nova no mesmo deploy.', false, 'salto sem volta.')] },
      { id: 'm02ab12-seam', pergunta: 'Qual a primeira tarefa ao modernizar legado?',
        opcoes: [
          opc('a', 'Abrir a costura: isolar o trecho atrás de interface e cobri-lo com o corpus golden fixando o antes; só então mexer (strangler desvia o tráfego aos poucos).', true, 'sem costura com teste, modernizar é reescrever.'),
          opc('b', 'Reescrever tudo em paralelo.', false, 'sem oráculo do comportamento vigente.'),
          opc('c', 'Desligar a rota legada.', false, 'antes da nova provar o veredito no corpus.')] },
      { id: 'm02ab12-fases', pergunta: 'Por que separar build, release, deploy e operação?',
        opcoes: [
          opc('a', 'Só a operação muda o comportamento observado; deploy é instalado, não exposto. Flag separa exposição de instalação e reverter vira desligar, com rollback ensaiado.', true, 'flag desliga comportamento, não apaga história: dado escrito pela v2 precisa de plano próprio.'),
          opc('b', 'São sinônimos.', false, '"fiz deploy, logo entreguei" é o erro clássico.'),
          opc('c', 'Flags dispensam testes.', false, 'os dois caminhos precisam estar testados.')] },
      { id: 'm02ab12-dora', pergunta: 'Como ler as métricas DORA?',
        opcoes: [
          opc('a', 'Como sistema de entrega, as quatro juntas (frequência, lead time, falha de mudança, restauração), amarradas a decisões; nunca ranking individual.', true, 'frequência alta com restauração lenta é exposição, não velocidade.'),
          opc('b', 'Para ranquear pessoas.', false, 'cria incentivo a produzir o número.'),
          opc('c', 'Só a frequência de deploy.', false, 'ignora segurança.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O sistema já mede custo e saturação de cada decisão. Falta saber como cada mudança entra em produção sem travar o fluxo e como sai quando dá errado. "Entregar rápido é juntar tudo num lote grande" e "reverter é fazer deploy da versão antiga correndo" são dívidas com juros: o lote mistura causas e impede revisão; a reversão improvisada descobre no incidente que dado migrou, que a flag não existia e que o caminho de volta nunca foi ensaiado.</p>' +
          '<h3>Mudanças pequenas, revisáveis e integráveis</h3>' +
          '<p>Mudança pequena é a fatia que um revisor entende de uma vez: um comportamento, um motivo, um rollback. <strong>Revisável</strong>: a descrição carrega risco, reversibilidade e caminho de volta. <strong>Integrável</strong>: entra no fluxo sem travar os demais. O <strong>gate de mudança</strong> libera a fatia reversível de risco baixo, contém a de risco alto (flag desligada, rollout parcial, observação) e bloqueia a irreversível sem rollback descrito. Risco = objetivo afetado, incerteza e evidência, impacto e detectabilidade (vocabulário do B01).</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def avaliar_mudanca(*, risco, reversivel, rollback_descrito):\n    # gate conceitual: libera, contém ou bloqueia antes de integrar\n    if not reversivel or not rollback_descrito:\n        return "bloqueada"\n    if risco == "alto":\n        return "conter"\n    return "liberar"' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Campo da fatia</th><th>Pergunta</th><th>Fatia típica</th></tr></thead><tbody>' +
          '<tr><td>tamanho e motivo</td><td>o revisor entende por que existe?</td><td>um reason code novo atrás de flag, não a policy inteira</td></tr>' +
          '<tr><td>risco declarado</td><td>objetivo, impacto e detectabilidade escritos?</td><td>"muda veredito P0; detectável no corpus golden"</td></tr>' +
          '<tr><td>reversibilidade</td><td>desfaz sem cirurgia?</td><td>flag desliga; sem migração destrutiva junto</td></tr>' +
          '<tr><td>rollback descrito</td><td>o caminho de volta foi ensaiado?</td><td>desativar v2 restaura v1, com oráculo</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Falha típica: pequena no diff, grande no efeito', html: '<p>Poucas linhas que alteram semântica de veredito, migram dado e mudam contrato ao mesmo tempo. Sem risco, reversibilidade e rollback na descrição, o tamanho em linhas prova nada e a integração cobra o que a revisão não leu.</p>' },
        { tipo: 'takeaway', html: 'Fatia pequena com <mark>risco, reversibilidade e rollback</mark> declarados; o gate <mark>libera, contém ou bloqueia</mark> antes de integrar.' }
      ] },

      { rotulo: 'Legado, deploy e gate', blocos: [
        { tipo: 'texto', html:
          '<h3>Costuras, strangler e expand-contract</h3>' +
          '<p><strong>Costura de mudança</strong> (change seam) é o ponto onde o comportamento pode ser alterado sem reescrever o entorno: uma fronteira com teste que fixa o antes e observa o depois. No legado, a primeira tarefa é abrir a costura (isolar atrás de interface, cobrir com o corpus golden do B04) e só então mexer. <strong>Strangler</strong> desvia o tráfego aos poucos: a rota nova atende parte das chamadas enquanto a legada segue viva, até secar e ser removida. <strong>Expand-contract</strong> (parallel change) evolui o contrato em três tempos: expande (aceita o novo sem quebrar o velho), migra os consumidores e contrai (remove o velho). Nenhum passo é salto sem volta.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Padrão</th><th>Mecanismo no work-intake</th><th>O que invalida</th></tr></thead><tbody>' +
          '<tr><td>costura</td><td>trecho legado atrás de porta com corpus golden fixando o antes</td><td>reescrita sem teste do comportamento vigente</td></tr>' +
          '<tr><td>strangler</td><td>policy nova atende parte das avaliações; a legada é o padrão até secar</td><td>desligar a legada antes da nova provar veredito no corpus</td></tr>' +
          '<tr><td>expand-contract</td><td>campo novo opcional, migra consumidor, remove o velho</td><td>contração antes de todo consumidor declarar a versão nova</td></tr>' +
          '</tbody></table>' },
        { tipo: 'ordene', id: 'b12-ordene', titulo: 'Ordene o expand-contract de uma coluna', obrigatorio: false,
          itens: [{ id: 'c', texto: 'Contrair: remover a coluna antiga' }, { id: 'e', texto: 'Expandir: criar nome_completo (nova, opcional)' }, { id: 'm', texto: 'Migrar: backfill, escrita dupla, consumidores leem a nova' }, { id: 'd', texto: 'Todos os consumidores declaram a v2' }],
          solucao: ['e', 'm', 'd', 'c'], dica: 'A coluna antiga existe e fica atualizada até o último consumidor declarar a v2.' },
        { tipo: 'texto', html:
          '<h3>Build, release, deploy e operação</h3>' +
          '<p><strong>Build</strong> produz o artefato; <strong>release</strong> declara a versão disponível; <strong>deploy</strong> instala num ambiente; <strong>operação</strong> expõe aos usuários, e só ela muda o comportamento observado. Erros: "fiz deploy, logo entreguei" (a versão segue desligada) e "liberei, logo não dá para voltar". <strong>Flag</strong> separa instalação de exposição. <strong>Rollback</strong> é o caminho de volta ensaiado: desativar a policy v2 defeituosa e ver a v1 restaurar o comportamento no corpus, sem reinstalar artefato nem migrar dado às pressas. Migração destrutiva acoplada à ativação invalida o rollback.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def decidir_policy(versao_ativa, v2_saudavel):\n    # flag: v2 defeituosa desativa e v1 restaura\n    if versao_ativa == "v2" and not v2_saudavel:\n        return "v1"\n    return versao_ativa' },
        { tipo: 'callout', tom: 'info', titulo: 'Limite', html: '<p>Flag desliga comportamento, não apaga história: dado escrito pela v2 antes do rollback continua existindo e precisa de plano próprio. Reversibilidade de decisão não é reversão de dado; cada uma tem oráculo separado.</p>' },
        { tipo: 'texto', html:
          '<h3>Gate de mudança e DORA como sistema</h3>' +
          '<p>O gate é a suíte única que toda fatia atravessa: <strong>instalação limpa</strong> (API e CLI executam fora do checkout, sem importar o código-fonte por acidente), <strong>portabilidade</strong> (newline, casing e paths em Windows e Linux), <strong>offline</strong> (sem credencial nem rede) e <strong>manifesto</strong> (commit, SO, runtimes, versões, seeds, digests e durações) mais o rollback observado. As métricas DORA (frequência de deploy, lead time, taxa de falha de mudança, tempo de restauração) leem o sistema de entrega, nunca ranking individual: frequência alta com restauração lenta é exposição; lead time baixo com falha alta é rollback de rotina. Frequência e lead time medem fluxo; falha e restauração medem segurança. Patamares do material são exemplo variável.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def registrar_mudanca(manifesto, *, commit, so, semente, digest):\n    manifesto.append({"commit": commit, "so": so, "semente": semente, "digest": digest})\n    return manifesto' },
        { tipo: 'texto', html: '<p><strong>Fontes</strong> (revalidar por edição ou release): Git Reference Manual; Martin Fowler (Strangler Fig Application, Parallel Change, Feature Toggle); DORA Research Program (revalidar em até 90 dias); Python <code>enum</code> 3.14; PEP 440. Código do laboratório: <code>application/mudanca.py</code>.</p>' },
        { tipo: 'takeaway', html: '<mark>Flag</mark> separa exposição de instalação, mas só o <mark>rollback ensaiado</mark> é reversibilidade.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'rode', id: 'b12-rode', titulo: 'Rollback da policy v2', obrigatorio: false,
          enunciado: 'A v2 defeituosa é desativada e a v1 restaura o comportamento. Saída ilustrativa (exemplo).',
          prefixo: '$', entrada: 'pytest tests/test_mudanca.py  # exemplo', unidade: 'ms', terminalTitulo: 'exemplo (saída variável)',
          prever: { pergunta: 'A v2 fica defeituosa e o budget zera. Qual o primeiro passo do runbook?', opcoes: [
            { id: 'a', texto: 'Desativar a flag da v2 e verificar a restauração da v1 no corpus.', correta: true, porque: 'sem reinstalar artefato nem migrar dado às pressas.' },
            { id: 'b', texto: 'Fazer deploy da versão antiga correndo.', correta: false, porque: 'reversão improvisada descobre o problema no incidente.' }] },
          etapas: [
            { id: 'a', nome: 'v2 ativa', descricao: '', tom: 'dns', ms: 1, linhas: [L('out', 'corpus golden: 3 vereditos divergentes da v1')] },
            { id: 'b', nome: 'flag desativada', descricao: '', tom: 'response', ms: 1, linhas: [L('out', 'decidir_policy("v2", False) == "v1"'), L('out', 'corpus golden: 0 divergências (v1 restaurada)'), L('hint', 'dado escrito pela v2 ainda precisa de plano próprio')] }
          ] },
        { tipo: 'python', id: 'b12-python', titulo: 'Gate, flag, contração e manifesto', obrigatorio: false,
          enunciado: 'Implemente <code>avaliar_mudanca</code>, <code>decidir_policy</code>, <code>pode_contrair</code> e <code>registrar_mudanca</code> (recusa campo vazio).',
          codigo: codigo, testes: testes,
          dica: 'Verifique primeiro a irreversibilidade (bloqueada), depois o risco alto (conter). <code>all(v == "v2" ...)</code> para a contração.',
          solucao: solucao, callout: 'Gate, flag e contração verificados.' },
        { tipo: 'cenario', id: 'b12-cenario', titulo: 'O PR de 40 linhas', obrigatorio: false,
          enunciado: 'Um PR pequeno muda o veredito P0, migra uma coluna e muda um contrato.',
          inicio: 'i',
          nos: { i: { texto: 'O que você faz?', opcoes: [
            { texto: 'Aprovar: são só 40 linhas.', vai: 'f-ruim', tom: 'ruim', consequencia: 'tamanho em linhas não prova nada.' },
            { texto: 'Pedir risco, reversibilidade e rollback, e dividir em fatias.', vai: 'n2', tom: 'ok', consequencia: 'cada fatia tem uma causa e um caminho de volta.' }] },
            n2: { texto: 'Como entregar a fatia de veredito P0?', opcoes: [
              { texto: 'Atrás de flag desligada, rollout parcial e rollback ensaiado.', vai: 'f-bom', tom: 'ok', consequencia: 'risco alto é contido.' },
              { texto: 'Direto para todos, desfazendo com deploy se falhar.', vai: 'f-ruim', tom: 'ruim', consequencia: 'reversão improvisada.' }] } },
          finais: { 'f-bom': { bom: true, texto: 'Fatias reversíveis, com o risco alto contido por flag.' }, 'f-ruim': { bom: false, texto: 'Integração cobrou o que a revisão não leu.' } },
          callout: 'Você dividiu a mudança e conteve o risco alto.' },
        { tipo: 'escolha', id: 'b12-esc1', titulo: 'Confira: gate verde aqui, vermelho lá', pergunta: 'O gate passa na máquina do autor e falha em outra. Hipótese?',
          opcoes: [
            { id: 'a', texto: 'Gates diferentes por plataforma ou com rede; use um gate único cross-platform, offline e sem credencial, com manifesto.', correta: true, porque: 'a evidência precisa ser recalculável.' },
            { id: 'b', texto: 'A outra máquina está errada.', correta: false, porque: 'o gate depende do ambiente.' }] },
        { tipo: 'escolha', id: 'b12-esc2', titulo: 'Confira: flag e reversão', pergunta: 'A equipe diz "temos flag, logo é reversível". O que falta checar?',
          opcoes: [
            { id: 'a', texto: 'Se o rollback foi ensaiado e se há migração destrutiva ou dado da v2 acoplado à ativação.', correta: true, porque: 'flag sem rollback ensaiado não é reversibilidade.' },
            { id: 'b', texto: 'Nada: flag sempre reverte.', correta: false, porque: 'não apaga o dado escrito.' }] },
        { tipo: 'takeaway', html: 'Nenhum passo do modernizar é <mark>salto sem volta</mark>.' }
      ] }
    ]
  });
})();
