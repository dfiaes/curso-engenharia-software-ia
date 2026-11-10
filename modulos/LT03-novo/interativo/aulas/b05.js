/* LT03 · Bloco 5: GitOps, reconciliação, promoção e configuração por ambiente. Fonte: LT03.html#b05. Saídas de terminal são exemplo variável, não evidência. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'def reverter_manual(desejado, observado, break_glass):',
    '    # edicao manual e revertida: observado volta ao desejado.',
    '    # com break_glass ativo, o observado fica como esta.',
    '    return dict(observado)', '', '',
    'def break_glass_expirado(emitido_em, ttl, agora):',
    '    # passado o TTL (estritamente), a reversao volta a valer',
    '    return False', '', '',
    'def aplicar_config(saudavel, proposta):',
    '    # proposta sem a marca "valida" falha visivel e preserva o ultimo saudavel',
    '    return dict(proposta)', '', '',
    'def promover(digest, ambientes):',
    '    # o MESMO digest atravessa todos os ambientes',
    '    return {}', ''].join('\n');
  var solucao = [
    'def reverter_manual(desejado, observado, break_glass):',
    '    if break_glass:',
    '        return dict(observado)',
    '    resultado = dict(observado)',
    '    resultado.update(desejado)',
    '    return resultado', '', '',
    'def break_glass_expirado(emitido_em, ttl, agora):',
    '    return agora - emitido_em > ttl', '', '',
    'def aplicar_config(saudavel, proposta):',
    '    if not proposta.get("valida"):',
    '        return dict(saudavel)',
    '    return dict(proposta)', '', '',
    'def promover(digest, ambientes):',
    '    return {ambiente: digest for ambiente in ambientes}', ''].join('\n');
  var testes = [
    'def test_manual_e_revertido_ao_desejado():',
    '    r = reverter_manual({"replicas": "3"}, {"replicas": "9", "extra": "x"}, False)',
    '    assert r["replicas"] == "3" and r["extra"] == "x"', '', '',
    'def test_break_glass_preserva_o_manual():',
    '    assert reverter_manual({"replicas": "3"}, {"replicas": "9"}, True) == {"replicas": "9"}', '', '',
    'def test_break_glass_expira_so_depois_do_ttl():',
    '    assert not break_glass_expirado(100.0, 60.0, 160.0) and break_glass_expirado(100.0, 60.0, 160.1)', '', '',
    'def test_config_invalida_preserva_o_saudavel():',
    '    saudavel = {"timeout": "5", "valida": True}',
    '    assert aplicar_config(saudavel, {"timeout": "abc"}) == saudavel', '', '',
    'def test_config_valida_substitui():',
    '    nova = {"timeout": "10", "valida": True}',
    '    assert aplicar_config({"timeout": "5", "valida": True}, nova) == nova', '', '',
    'def test_promocao_replica_o_mesmo_digest():',
    '    r = promover("sha256:aaa", ["dev", "homolog", "prod"])',
    '    assert r == {"dev": "sha256:aaa", "homolog": "sha256:aaa", "prod": "sha256:aaa"}', '', '',
    'def test_promocao_sem_ambientes_e_vazia():',
    '    assert promover("sha256:aaa", []) == {}', ''].join('\n');

  TrilhaAula.registrar({
    id: 'lt03-b5',
    titulo: 'GitOps, reconciliação, promoção e configuração por ambiente',
    minutos: 35,
    resumo: 'Push no cluster não é GitOps. O cluster puxa e reconcilia o que está no Git; o que não foi commitado não persiste, e o que atravessa os ambientes é o mesmo digest.',
    objetivo: 'Enunciar os quatro princípios do OpenGitOps, explicar por que CI com push não basta, reverter ou conter uma edição manual com break-glass, falhar visível com config inválida e promover o mesmo digest entre ambientes.',
    revisao: [
      { id: 'lt03b5-manual', pergunta: 'Um engenheiro corrige um incidente com kubectl edit e a correção some em minutos. Por quê, e qual o caminho certo?',
        opcoes: [
          opc('a', 'O reconciliador restaurou o desejado do Git; a correção deve entrar por commit revisado (ou break-glass com TTL)', true, 'Git é a fonte da verdade e o controlador reverte o drift. A exceção legítima é break-glass: manual, com motivo e prazo, seguido de commit.'),
          opc('b', 'O cluster é instável; repetir o comando', false, 'repetir só repete a reversão.'),
          opc('c', 'O kubectl não persiste alterações', false, 'persistiria; foi a reconciliação que desfez.')] },
      { id: 'lt03b5-promo', pergunta: 'Promover de homologação a produção em GitOps significa:',
        opcoes: [
          opc('a', 'Mover o digest validado para a configuração do ambiente de produção, via commit', true, 'o que foi testado é o artefato; a promoção só muda a referência no ambiente.'),
          opc('b', 'Reconstruir a imagem para produção', false, 'testaria uma coisa e promoveria outra.'),
          opc('c', 'Rodar kubectl apply a partir do notebook', false, 'push manual não reconcilia.')] },
      { id: 'lt03b5-quatro', pergunta: 'Quais são os quatro princípios do OpenGitOps usados no bloco?',
        opcoes: [
          opc('a', 'Declarativo, versionado e imutável, puxado, continuamente reconciliado', true, 'CI que só empurra manifestos não satisfaz puxado nem reconciliado.'),
          opc('b', 'Empurrado, manual, versionado e privado', false, 'push e manual contradizem os princípios.'),
          opc('c', 'Procedural, efêmero, empurrado e agendado', false, 'GitOps é declarativo e puxado.')] },
      { id: 'lt03b5-invalida', pergunta: 'Um commit com config inválida chega ao ambiente. O comportamento correto é:',
        opcoes: [
          opc('a', 'Falhar de modo visível e preservar o último estado saudável', true, 'commit ruim é commit visível, nunca sumiço silencioso do que funcionava.'),
          opc('b', 'Aplicar assim mesmo e corrigir depois', false, 'derruba o que funcionava.'),
          opc('c', 'Apagar o estado anterior', false, 'o último saudável precisa ser preservado.')] },
      { id: 'lt03b5-briga', pergunta: 'Duas automações brigam pelo mesmo campo em loop. Qual a causa e o conserto?',
        opcoes: [
          opc('a', 'Ownership duplicado; um campo, um dono: remover o escritor excedente e registrar a decisão', true, 'campo sem dono, ou com dois, é campo em disputa.'),
          opc('b', 'Falta de réplicas do controlador', false, 'mais controladores aumentam a briga.'),
          opc('c', 'A tag mutável', false, 'não é o caso.')] }
    ],
    abas: [
      { rotulo: 'Princípios e fonte da verdade', blocos: [
        { tipo: 'texto', html:
          '<p><strong>GitOps</strong> opera pelo Git como única fonte da verdade, com quatro princípios (OpenGitOps): estado <strong>declarativo</strong> (o quê, não o como), <strong>versionado e imutável</strong> (histórico que não se reescreve), <strong>puxado</strong> (o cluster busca; nada empurra de fora para dentro) e <strong>continuamente reconciliado</strong> (o controlador persegue o declarado sem parar). CI que faz push no cluster não satisfaz esses princípios sozinho: empurra sem reconciliar, e o que não é reconciliado diverge em silêncio.</p>' +
          '<p>A separação que sustenta tudo: <strong>source</strong> é o código versionado; <strong>build artifact</strong> é a imagem imutável identificada por digest (Bloco 1); <strong>environment config</strong> é o que varia por ambiente (réplicas, endpoints, flags). A <strong>promoção</strong> move o mesmo digest entre ambientes e troca só a config. Branch, diretório ou repositório por ambiente é decisão de ownership: diz quem aprova o quê. Duas automações editando o mesmo campo é o defeito da briga de controladores.</p>' },
        { tipo: 'escolha', id: 'b5-escolha-push', titulo: 'Aquecimento: o pipeline que empurra', obrigatorio: false,
          pergunta: 'Um pipeline empurra manifestos ao cluster a cada merge e se declara GitOps. Qual a avaliação?',
          opcoes: [
            opc('a', 'É GitOps: o merge dispara o deploy.', false, 'falta puxado e reconciliado continuamente.'),
            opc('b', 'Não é: push sem reconciliação diverge em silêncio; faltam os princípios puxado e continuamente reconciliado.', true, 'o que ninguém reconcilia deriva sem que ninguém perceba.'),
            opc('c', 'É GitOps, se o repositório for privado.', false, 'visibilidade do repositório não é princípio.'),
            opc('d', 'É GitOps, se usar tag mutável.', false, 'tag mutável contradiz a identidade por digest.')] },
        { tipo: 'texto', html:
          '<h3>Reconciliação, drift e break-glass</h3>' +
          '<p><strong>Reconciliação</strong> é o control loop do GitOps: ler o declarado no Git, comparar ao observado, convergir e registrar revisão e digest no status. Mudança sem commit não persiste: o drift manual (patch à mão) é revertido pelo reconciler, e o evento entra na trilha de auditoria. A exceção é o <strong>break-glass</strong>: quebrar o vidro em incidente com motivo registrado, escopo mínimo e <strong>TTL</strong> que expira, depois do qual a reversão volta a valer. Sem motivo, sem prazo ou sem reversão posterior, é edição manual com outro nome.</p>' },
        { tipo: 'quebre', id: 'b5-quebre', titulo: 'O cluster persegue o Git',
          enunciado: 'Ciclo com o contrato de <code>reconciliar_gitops.py</code>. Escolha uma falha, rode e depois rode &ldquo;Sem falha&rdquo;. Linhas calculadas à mão; rótulo: exemplo.',
          prefixo: '$', entrada: 'reconciliar(desejado, observado)', unidade: 'passo', terminalTitulo: 'controlador (exemplo)',
          prever: { pergunta: 'Quando o estado do cluster diverge do Git sem commit nem break-glass, o que a reconciliação faz?', opcoes: [
            { id: 'a', texto: 'O patch persiste, pois o cluster é a fonte da verdade.', correta: false, porque: 'a fonte da verdade é o Git.' },
            { id: 'b', texto: 'O observado volta ao declarado no Git, e o evento entra na auditoria.', correta: true, porque: 'mudança sem commit não persiste; o drift manual é revertido.' },
            { id: 'c', texto: 'O controlador para de reconciliar até alguém aprovar.', correta: false, porque: 'o loop é contínuo.' }
          ] },
          etapas: [
            { id: 'merge', nome: 'Merge', descricao: 'PR aprovado muda o Git', tom: 'dns', ms: 1, linhas: [L('cmd', 'git log -1'), L('info', 'revisao=r42, digest=sha256:aaa (exemplo)')] },
            { id: 'recon', nome: 'Reconcilia', descricao: 'Controlador puxa e compara', tom: 'request', ms: 2, linhas: [L('out', 'desejado != observado: diferença detectada'), L('in', 'aplica o desejado')] },
            { id: 'conv', nome: 'Convergiu', descricao: 'Status com revisão e digest', tom: 'response', ms: 1, linhas: [L('body', '{"convergiu": true, "revisao": "r42", "digest": "sha256:aaa"}')] }
          ],
          falhas: [
            { id: 'manual', rotulo: 'Patch manual sem commit', efeito: { etapaFalha: 'conv', linhasErro: [
              L('info', 'alguém: kubectl edit  replicas=9 (sem commit)'),
              L('out', 'reconciliação: observado replicas=9 != desejado replicas=3'),
              L('in', 'reverter_manual(...) => replicas=3'),
              L('hint', 'evento de drift registrado na auditoria')
            ], tutor: 'mudança sem commit não persiste. O caminho é commit revisado, ou break-glass com motivo e TTL.' } },
            { id: 'invalida', rotulo: 'Commit com config inválida', efeito: { etapaFalha: 'recon', linhasErro: [
              L('out', 'config proposta sem a marca valida: falha visível'),
              L('in', 'aplicar_config(saudavel, proposta) => preserva o último saudável'),
              L('hint', 'commit ruim é commit visível')
            ], tutor: 'o último estado saudável continua rodando enquanto a falha fica à vista de quem fez o commit.' } }
          ],
          tutorDepois: 'Em break-glass, o manual fica até o TTL expirar; depois a reversão volta a valer.',
          callout: 'Você viu a reversão do manual e a config inválida contida.' },
        { tipo: 'takeaway', html: 'Mudança <mark>sem commit não persiste</mark>; só o <mark>break-glass</mark> (motivo, escopo, <mark>TTL</mark>) abre exceção.' }
      ] },

      { rotulo: 'Promoção e segredos', blocos: [
        { tipo: 'texto', html:
          '<p><strong>Promoção por digest</strong> é a prova de identidade da trilha: dev, homolog e prod rodam o mesmo conteúdo exato, citado pelo hash, com diff revisável antes de cada passo. <strong>Overlays</strong> aplicam a diferença por ambiente sobre a base comum, sem copy/paste: mesma base, patches declarados, nada duplicado para divergir.</p>' +
          '<p><strong>Segredos:</strong> guardar secret em Git é fora de escopo da trilha; segredo versionado é segredo publicado. O Git declara a referência (onde buscar, com que permissão), e o valor chega na execução por cofre ou controlador externo. <strong>Ownership:</strong> cada campo tem um dono automatizado, e campo sem dono é campo em disputa.</p>' },
        { tipo: 'python', id: 'b5-python', titulo: 'Reverter, expirar, preservar e promover', obrigatorio: false,
          enunciado: 'Implemente as quatro funções de <code>lab/reconciliar_gitops.py</code>: <code>reverter_manual</code>, <code>break_glass_expirado</code>, <code>aplicar_config</code> e <code>promover</code>.',
          codigo: codigo, testes: testes,
          dica: 'Sem break-glass, copie o observado e aplique <code>update(desejado)</code>. O TTL expira com <code>agora - emitido_em &gt; ttl</code> (estrito). Config sem <code>valida</code> devolve cópia do saudável. Promover é um dict ambiente para o mesmo digest.',
          solucao: solucao,
          tutorDepois: 'Promover repete o mesmo hash por ambiente: nada é reconstruído no caminho.',
          callout: 'Reversão, TTL, config inválida e promoção por digest passaram nos testes.' },
        { tipo: 'transcript', id: 'b5-transcript', titulo: 'Ache o relato que a trilha não sustenta', obrigatorio: false, terminalTitulo: 'promoção em andamento (exemplo)',
          enunciado: 'O agente relata a promoção para produção. Uma afirmação contradiz o que o terminal mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Promova a versão validada em homologação para produção.' },
            { quem: 'ferramenta', texto: '$ git diff overlays/\n- homolog: imagem api@sha256:aaa\n+ prod:    imagem api:1.4' },
            { quem: 'ferramenta', texto: '$ flux get kustomization prod (exemplo)\nREVISION r43   READY True' },
            { quem: 'agente', texto: 'A produção converge para a revisão r43 do Git.' },
            { quem: 'agente', texto: 'A promoção moveu o mesmo digest validado em homologação para produção.' }
          ],
          erradas: [4],
          explicacao: { 4: 'o diff mostra <code>api:1.4</code> em prod: uma tag mutável, não o digest <code>sha256:aaa</code>. A promoção deve mover o digest; tag pode apontar para outro conteúdo.' },
          tutorDepois: 'A convergência para r43 é sustentada pelo status. A identidade do artefato não é.' },
        { tipo: 'cenario', id: 'b5-cenario', titulo: 'Incidente às 3h, com GitOps ligado', obrigatorio: false,
          enunciado: 'Uma correção urgente precisa entrar no cluster agora, e o reconciliador desfaz edições manuais.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O que você faz para aplicar a correção hoje?', opcoes: [
              { texto: 'Desligar a reconciliação e editar à mão.', vai: 'f-desliga', tom: 'ruim', consequencia: 'sem reconciliação, tudo o mais diverge em silêncio e ninguém religa.' },
              { texto: 'Abrir break-glass com motivo, escopo mínimo e TTL, e aplicar a correção.', vai: 'commit', tom: 'ok', consequencia: 'a exceção fica registrada e expira.' }] },
            commit: { texto: 'O incidente foi contido. O TTL está perto de expirar. O que falta?', opcoes: [
              { texto: 'Nada: o break-glass resolve em definitivo.', vai: 'f-sombra', tom: 'ruim', consequencia: 'passado o TTL, a reversão volta e a correção some, ou vira edição manual permanente.' },
              { texto: 'Transformar a correção em commit revisado antes do TTL expirar.', vai: 'f-bom', tom: 'ok', consequencia: 'o Git volta a representar o desejado.' }] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Correção em break-glass, depois em commit revisado: o Git continua a fonte da verdade.' },
            'f-desliga': { bom: false, texto: 'A reconciliação ficou desligada e o cluster derivou do Git.' },
            'f-sombra': { bom: false, texto: 'A correção virou uma sombra manual, revertida no pior momento.' }
          },
          callout: 'Você usou o break-glass com TTL e fechou o ciclo em commit.' },
        { tipo: 'takeaway', html: 'Promova o <mark>mesmo digest</mark>; guarde só a <mark>referência</mark> do segredo no Git; cada campo tem <mark>um dono</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'ordene', id: 'b5-ordene', titulo: 'Ordene o ciclo de reconciliação', obrigatorio: false,
          enunciado: 'Do merge até a convergência, ordene os passos do ciclo GitOps.',
          itens: [
            { id: 'convergir', texto: 'Aplicar a diferença até desejado igual a observado e registrar revisão e digest' },
            { id: 'merge', texto: 'Pull request aprovado e merge no Git' },
            { id: 'comparar', texto: 'Controlador puxa o desejado, lê o vivo e detecta a diferença' }],
          solucao: ['merge', 'comparar', 'convergir'],
          dica: 'O Git muda primeiro; o controlador puxa depois; a convergência fecha o ciclo.',
          tutorDepois: 'Quem empurra no lugar do controlador pula o passo do meio: o puxado e o reconciliado.' },
        { tipo: 'escreva', id: 'b5-escreva', titulo: 'Explique a correção que sumiu', obrigatorio: false,
          enunciado: 'Uma correção urgente aplicada à mão no cluster some após minutos. Explique pelo loop, diga o destino correto da correção e a exceção legítima.',
          placeholder: 'Mecanismo, destino da correção e a exceção.',
          rubrica: [
            'Declara a reversão pelo reconciler: mudança sem commit não persiste.',
            'Prescreve commit revisado como destino da correção.',
            'Admite o break-glass com motivo e TTL como exceção, sem desabilitar a reconciliação.'],
          modelo: '<p>O reconciliador lê o Git, compara com o observado e reverte o que diverge: mudança sem commit não persiste. O destino da correção é um commit revisado. A exceção legítima é o break-glass, com motivo registrado, escopo mínimo e TTL, seguido do commit. Desligar a reconciliação deixaria o cluster divergir em silêncio.</p><p><strong>Reprova:</strong> propor desabilitar a reconciliação.</p>' },
        { tipo: 'escolha', id: 'b5-escolha-briga', titulo: 'Confira: a briga de automações',
          pergunta: 'Duas automações editam o mesmo campo e se sobrescrevem em loop. Qual o conserto?',
          opcoes: [
            opc('a', 'Um campo, um dono: remover o escritor excedente e registrar a decisão.', true, 'ownership duplicado é a causa; campo sem dono é campo em disputa.'),
            opc('b', 'Aumentar a frequência da reconciliação.', false, 'a briga fica mais rápida, não menos.'),
            opc('c', 'Usar tag mutável no campo.', false, 'tag mutável não resolve ownership.')] },
        { tipo: 'escolha', id: 'b5-escolha-diverge', titulo: 'Confira: produção diferente da homologação',
          pergunta: 'Produção roda conteúdo distinto do homologado, sem mudança de código. Causa provável e conserto?',
          opcoes: [
            opc('a', 'Promoção por tag mutável: promover por digest, que replica o mesmo hash; tag só como leitura.', true, 'o apelido moveu entre ambientes.'),
            opc('b', 'O controlador está lento; aumentar o intervalo.', false, 'lentidão não muda o conteúdo.'),
            opc('c', 'Faltam overlays por ambiente.', false, 'overlays aplicam diferença de config, não trocam o artefato.')] },
        { tipo: 'callout', tom: 'info', titulo: 'Fontes e validade', html:
          '<p>OpenGitOps Principles 1.0.0 (canônica, risco baixo); Flux core concepts, baseline 2.8.8 (adapter rotulado, risco alto, revalidar em até 90 dias). O bootstrap do adapter e a reconciliação real pertencem à trilha externa, <strong>BLOCKED</strong> com registro onde o cluster estiver ausente. O contrato de <code>lab/reconciliar_gitops.py</code> e os números são construção da trilha, exemplo variável.</p>' },
        { tipo: 'takeaway', html: 'GitOps é <mark>puxado e reconciliado</mark>; o manual <mark>expira</mark> ou vira commit, e o que atravessa é o <mark>digest</mark>.' }
      ] }
    ]
  });
})();
