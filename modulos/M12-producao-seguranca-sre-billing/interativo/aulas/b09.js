/* M12 · Bloco 9: Hardening e red team. Fonte: M12.html#b9. Severidades, prazos e contagens são exemplo variável, nunca medição. O checkpoint M12 está em checkpoint.js. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoGate = [
    'CAMPOS_P2 = ("owner", "due", "mitigation", "signed_by")', '', '',
    'def bloqueia(achado):',
    '    """True se o achado bloqueia o release.',
    '    P0 e P1 bloqueiam. P2 só é aceito com responsável, prazo,',
    '    compensação e aceite assinado; sem os quatro, continua bloqueando como P1.',
    '    Severidade fora de P0..P2: ValueError (convenção deste lab)."""',
    '    sev = achado["severity"]',
    '    if sev in ("P0", "P1"):',
    '        return True',
    '    if sev == "P2":',
    '        return False',
    '    raise ValueError("severidade desconhecida: %r" % (sev,))', '', '',
    'def decisao_release(achados):',
    '    ids = [a["id"] for a in achados if bloqueia(a)]',
    '    return ("BLOQUEAR", ids) if ids else ("LIBERAR", [])', ''].join('\n');

  var testesGate = [
    'P2_OK = dict(id="RR-07", severity="P2", owner="ana", due="2026-12-01",',
    '             mitigation="WAF + alerta", signed_by="cto")', '', '',
    'def test_sem_achados_libera():',
    '    assert decisao_release([]) == ("LIBERAR", [])', '', '',
    'def test_p0_e_p1_bloqueiam():',
    '    r = decisao_release([dict(id="A", severity="P0"), dict(id="B", severity="P1")])',
    '    assert r == ("BLOQUEAR", ["A", "B"])', '', '',
    'def test_p2_completo_nao_bloqueia():',
    '    assert decisao_release([P2_OK]) == ("LIBERAR", [])', '', '',
    'def test_p2_sem_os_quatro_campos_bloqueia_como_p1():',
    '    for campo in CAMPOS_P2:',
    '        incompleto = dict(P2_OK)',
    '        incompleto.pop(campo)',
    '        assert decisao_release([incompleto]) == ("BLOQUEAR", ["RR-07"]), campo', '', '',
    'def test_campo_vazio_conta_como_ausente():',
    '    vazio = dict(P2_OK, signed_by="")',
    '    assert decisao_release([vazio]) == ("BLOQUEAR", ["RR-07"])', '', '',
    'def test_um_bloqueio_basta():',
    '    r = decisao_release([P2_OK, dict(id="X", severity="P1")])',
    '    assert r == ("BLOQUEAR", ["X"])', '', '',
    'def test_severidade_desconhecida_e_erro():',
    '    try:',
    '        bloqueia(dict(id="Z", severity="P9"))',
    '    except ValueError:',
    '        return',
    '    assert False, "deveria levantar ValueError"', ''].join('\n');

  var solucaoGate = [
    'CAMPOS_P2 = ("owner", "due", "mitigation", "signed_by")', '', '',
    'def bloqueia(achado):',
    '    sev = achado["severity"]',
    '    if sev in ("P0", "P1"):',
    '        return True',
    '    if sev == "P2":',
    '        return not all(achado.get(c) for c in CAMPOS_P2)',
    '    raise ValueError("severidade desconhecida: %r" % (sev,))', '', '',
    'def decisao_release(achados):',
    '    ids = [a["id"] for a in achados if bloqueia(a)]',
    '    return ("BLOQUEAR", ids) if ids else ("LIBERAR", [])', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm12-b9',
    titulo: 'Hardening e red team',
    minutos: 40,
    resumo: 'Fechar o Capstone como serviço operável: superfície mínima, defaults que negam, segredo com ciclo de vida curto, adversário sob regras escritas e risco residual assinado, com números que saem do ledger.',
    objetivo: 'Reduzir a superfície ao mínimo, exercitar um red team dentro de regras de engajamento escritas e decidir um release com P0/P1 zerados e cada P2 aceito com responsável, prazo, compensação e assinatura.',
    revisao: [
      { id: 'm12b9-default', pergunta: 'O que significa "defaults seguros" no hardening?',
        opcoes: [
          opc('a', 'O caminho sem configuração adicional é o caminho seguro: negar por padrão, exigir opt-in para ampliar poder', true, 'defaults seguros invertem o ônus da prova; esquecer uma configuração deixa o sistema fechado, não aberto.'),
          opc('b', 'Ter uma configuração padrão documentada', false, 'documentar não garante que o default negue.'),
          opc('c', 'Desligar logs por padrão', false, 'não tem relação com negação por padrão e remove evidência.')] },
      { id: 'm12b9-p2', pergunta: 'Quando um achado P2 pode ser aceito num release?',
        opcoes: [
          opc('a', 'Com responsável, prazo, compensação e aceite assinado registrados', true, 'sem os quatro campos, o P2 continua bloqueando como P1.'),
          opc('b', 'Quando a equipe concorda por mensagem informal', false, 'aceite verbal evapora na primeira auditoria.'),
          opc('c', 'Sempre, porque P2 é de baixa gravidade', false, 'P2 só é aceito com os quatro campos.')] },
      { id: 'm12b9-roe', pergunta: 'O que invalida um exercício de red team?',
        opcoes: [
          opc('a', 'Ação fora do escopo, exfiltração real ou produção com dado real tocada', true, 'as regras de engajamento escritas delimitam escopo, ambiente, técnicas, janela e parada.'),
          opc('b', 'Não achar nenhuma vulnerabilidade', false, '"o red team não achou nada" não é critério de aceite.'),
          opc('c', 'Registrar tudo em relatório', false, 'o registro completo é parte das regras.')] },
      { id: 'm12b9-backup', pergunta: 'A exclusão de um tenant remove os registros dos stores ativos. O que se declara sobre os backups?',
        opcoes: [
          opc('a', 'O prazo de expiração, os controles de restore e a prevenção de reintrodução indevida', true, '<code>backups_expire_at</code> marca o limite dos backups, não a exclusão neles; apagar backup imutável pode ser incompatível com recuperação.'),
          opc('b', 'Que os backups também foram apagados imediatamente', false, 'exclusão imediata de backup imutável pode ser tecnicamente incompatível com recuperação.'),
          opc('c', 'Nada: backup não faz parte da exclusão', false, 'os limites do backup precisam ser documentados (M12-AT-060).')] },
      { id: 'm12b9-oraculo', pergunta: 'Qual é um critério de aceite melhor para o hardening?',
        opcoes: [
          opc('a', 'Uma suíte que tenta vazar e falha, com oráculo explícito, regras do red team e risco aceito com dono e prazo', true, 'checklist sem oráculo e aceite verbal não são evidência.'),
          opc('b', '"Revisamos o checklist e está tudo certo"', false, 'declara sem provar.'),
          opc('c', '"Nenhum alerta disparou"', false, 'a ausência de alerta não é oráculo.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Este bloco fecha o Capstone como serviço operável. Ele usa autoridade, contenção e aprovação (blocos 1 a 3), isolamento por tenant (bloco 4), idempotência (bloco 5), quotas, orçamento e metering (blocos 6 e 7) e SLOs, alertas e game day (bloco 8). A saída observável é uma suíte adversarial de ponta a ponta com decisão de release: zero falha P0/P1, cada P2 aceito com responsável, prazo, compensação e aceite assinado, exclusão de tenant confirmada nos stores ativos com limites de backup documentados e uma defesa final que reproduz cada número a partir do ledger e dos relatórios.</p>' +
          '<h3>Três perguntas que costumam colapsar numa só</h3>' +
          '<ul><li><strong>Hardening</strong>: a remoção verificável de capacidade desnecessária. Responde "o que o sistema nem sequer oferece ao atacante". Superfície mínima diz o que o serviço expõe; defaults seguros dizem que a ausência de configuração nega em vez de liberar; gestão de segredos diz que nenhuma credencial vive em código, log, trace ou artefato versionado.</li>' +
          '<li><strong>Red team</strong>: o exercício adversarial delimitado por regras de engajamento escritas. Responde "o que um adversário delimitado ainda consegue, e qual controle o deteve".</li>' +
          '<li><strong>Risco residual</strong>: o que resta depois do controle, com responsável, prazo e decisão de aceite ou correção. Responde "o que medimos, o que aceitamos e quem assina".</li></ul>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Conceito: defaults seguros invertem o ônus da prova', html:
          '<p>O caminho sem configuração precisa ser o caminho negado. A falha acontece porque cada camada assume que outra validou, autorizou ou redigiu, e a composição de defaults permissivos abre a boundary sem nenhum erro visível. A consequência: autoridade fechada por sessão, schema fechado por tool, allowlist por destino, negação sem contexto de tenant e redação antes de qualquer sink, cada um verificável pelo próprio oráculo, nunca pela ausência de alerta.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Severidade organiza a decisão</h3>' +
          '<table><thead><tr><th>Severidade</th><th>O que indica</th><th>Efeito no release</th></tr></thead><tbody>' +
          '<tr><td>P0</td><td>exploração ou perda crítica</td><td>bloqueia</td></tr>' +
          '<tr><td>P1</td><td>quebra de propriedade necessária ao release</td><td>bloqueia</td></tr>' +
          '<tr><td>P2</td><td>pode ser aceito</td><td>só com responsável, prazo, mitigação e justificativa registrada; sem isso, bloqueia como P1</td></tr>' +
          '</tbody></table>' +
          '<p>Um teste que substitui a boundary real por simulação não aprova essa boundary. Valores de severidade, prazos e contagens neste bloco são exemplo variável, nunca medição.</p>' },
        { tipo: 'takeaway', html: 'Hardening <mark>remove capacidade</mark>; o default <mark>nega</mark>; o risco residual tem <mark>dono e assinatura</mark>.' }
      ] },

      { rotulo: 'Decidir e ver funcionando', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>Superfície mínima, segredo com ciclo de vida e adversário delimitado</h3>' +
          '<p>Nada exposto sem necessidade declarada, nenhum segredo sem rotação e expiração, nenhum ataque fora de regras escritas, nenhum aceite sem assinatura. Segredos vivem em cofre ou ambiente gerenciado, com escopo mínimo, vida curta, rotação e revogação; código, imagem, log, trace, relatório e evidência nunca os contêm. A proveniência de dependências e artefatos (lockfile, versões fixas, hashes e assinatura quando disponíveis) pertence ao mesmo fechamento que o código próprio.</p>' +
          '<table><thead><tr><th>Pergunta</th><th>Controle</th><th>Negação</th><th>O que não fazer</th></tr></thead><tbody>' +
          '<tr><td>O serviço expõe só o necessário?</td><td>inventário de portas, rotas, tools e permissões com justificativa</td><td>capacidade sem dono é removida ou negada por padrão</td><td>manter endpoint de depuração "temporário" em produção</td></tr>' +
          '<tr><td>O default nega?</td><td>autoridade fechada, schema fechado, allowlist, fail-closed sem tenant</td><td>ausência de configuração não libera efeito nem dado</td><td>opt-out de segurança para "facilitar a integração"</td></tr>' +
          '<tr><td>O segredo tem dono e prazo?</td><td>cofre, escopo mínimo, vida curta, rotação e revogação auditada</td><td>segredo em código, log, trace ou evidência é falha P0/P1</td><td>compartilhar credencial entre ambientes "por enquanto"</td></tr>' +
          '<tr><td>O ataque é legítimo?</td><td>regras de engajamento escritas, ambiente controlado, parada e registro</td><td>ação fora do escopo, exfiltração real ou produção tocada invalida o exercício</td><td>testar técnica ofensiva em dado ou serviço real</td></tr>' +
          '<tr><td>O aceite é defensável?</td><td>risco residual com responsável, prazo, compensação e assinatura</td><td>P2 sem esses quatro campos continua bloqueando como P1</td><td>aceitar risco por mensagem informal sem registro</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Regras de engajamento mínimas do red team', html:
          '<ul><li>Autorização escrita com escopo e janela.</li>' +
          '<li>Somente ambiente controlado, nunca produção com dado real.</li>' +
          '<li>Técnicas listadas; exfiltração real e persistência fora do ambiente são proibidas.</li>' +
          '<li>Canal de parada imediata.</li>' +
          '<li>Todo achado vira ameaça no threat model, com controle, teste e risco residual.</li></ul>' +
          '<p>Segurança ofensiva fora desse ambiente está fora do escopo do módulo.</p>' },
        { tipo: 'texto', html:
          '<p>Uma revisão encontra três achados ilustrativos: uma rota administrativa sem autenticação porque "o gateway cuidaria", um token de longa vida copiado num relatório de incidente e um índice vetorial sem filtro de tenant embora o SQL já isole. O fechamento nega a rota por padrão, troca o token por credencial curta com rotação e registra a exfiltração do relatório como P1, e aplica namespace por tenant ao índice com teste negativo. A exclusão do tenant de exemplo remove registros dos cinco stores ativos e declara expiração e controles de restore dos backups.</p>' },
        { tipo: 'rode', id: 'b9-rode', titulo: 'Excluir um tenant dos stores ativos',
          enunciado: 'Rode a exclusão. As saídas são <strong>exemplo ilustrativo</strong>; identificadores, prazos e contagens são variáveis.',
          prefixo: '$', entrada: 'planes.delete_tenant(context, now=t0, backup_retention=days(30))', unidade: 'etapa', terminalTitulo: 'TenantDataPlanes (exemplo ilustrativo)',
          prever: { pergunta: 'Depois de <code>delete_tenant</code>, o que <code>backups_expire_at</code> informa?', opcoes: [
            { id: 'a', texto: 'Que os backups do tenant já foram apagados.', correta: false, porque: 'apagar backup imutável imediatamente pode ser incompatível com recuperação.' },
            { id: 'b', texto: 'O instante em que os backups expiram (agora mais a retenção): o limite dos backups, não a exclusão neles.', correta: true, porque: 'o contrato devolve <code>backups_expire_at</code> igual ao instante somado à retenção; os controles de restore entram na documentação.' },
            { id: 'c', texto: 'O instante em que o tenant foi excluído dos stores ativos.', correta: false, porque: 'a exclusão ativa é provada por <code>active_records_remaining</code> igual a zero.' }
          ] },
          etapas: [
            { id: 'put', nome: 'Dado do tenant', descricao: 'Há registro ativo', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'planes.cache_put(context, "session", "value")'),
              L('hint', 'o tenant tem dado em cache, objetos, vetores, grafo e fila')] },
            { id: 'delete', nome: 'Exclusão', descricao: 'Cinco stores ativos', tom: 'request', ms: 1, linhas: [
              L('cmd', 'report = planes.delete_tenant(context, now=t0, backup_retention=days(30))'),
              L('out', 'removed_by_store: cache, objetos, vetores, grafo, fila (contagem por store)'),
              L('hint', 'valores variáveis')] },
            { id: 'count', nome: 'Prova de ausência', descricao: 'Nenhum registro restante', tom: 'response', ms: 1, linhas: [
              L('cmd', 'planes.count_tenant_records(context)'),
              L('out', '0'),
              L('out', 'report.active_records_remaining == 0')] },
            { id: 'backup', nome: 'Limite dos backups', descricao: 'Declarado, não apagado', tom: 'tls', ms: 1, linhas: [
              L('cmd', 'report.backups_expire_at'),
              L('out', 't0 + 30 dias'),
              L('hint', 'marca o limite dos backups, não a exclusão neles')] }
          ],
          tutorDepois: 'Documente backups separadamente: prazo de expiração, controles de restore e prevenção de reintrodução indevida.',
          callout: 'Você viu a ausência nos stores ativos e o limite dos backups declarado.' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '# Exemplo ilustrativo: registro de risco residual; valores variáveis',
          '# {"id": "RR-07", "severity": "P2", "owner": "...", "due": "...",',
          '#  "mitigation": "...", "decision": "accept", "signed_by": "..."}'].join('\n') },
        { tipo: 'takeaway', html: 'Ausência nos <mark>stores ativos</mark> é provada por contagem; o <mark>backup</mark> tem limite declarado, não exclusão imediata.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b9-python', titulo: 'Escreva o portão de release', obrigatorio: false,
          enunciado: 'Implemente <code>bloqueia(achado)</code> e <code>decisao_release(achados)</code>: P0 e P1 bloqueiam; P2 só libera com responsável, prazo, mitigação e assinatura (campos <code>owner</code>, <code>due</code>, <code>mitigation</code>, <code>signed_by</code>); sem os quatro, bloqueia como P1.',
          codigo: codigoGate, testes: testesGate,
          dica: 'Para P2, o achado bloqueia se algum dos quatro campos faltar ou vier vazio: <code>not all(achado.get(c) for c in CAMPOS_P2)</code>.',
          solucao: solucaoGate,
          tutorDepois: 'O campo vazio vale como ausente: "aceitar por mensagem informal" não deixa registro, e o portão trata esse caso como P1.',
          callout: 'O portão passou nos testes: P2 só libera com os quatro campos.' },
        { tipo: 'cenario', id: 'b9-cenario', titulo: 'Os três achados da revisão', obrigatorio: false,
          enunciado: 'A revisão de fechamento traz três achados ilustrativos. Decida o conserto de cada um.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Achado 1: uma rota administrativa sem autenticação, porque "o gateway cuidaria". O que você faz?', opcoes: [
              { texto: 'Manter a rota: o gateway já cuida da autenticação.', vai: 'f-gateway', tom: 'ruim', consequencia: 'cada camada assume que a outra validou; a composição abre a boundary sem erro visível.' },
              { texto: 'Negar por padrão: a capacidade sem dono é removida ou fechada, com teste que tenta acessar e falha.', vai: 'token', tom: 'ok', consequencia: 'default que nega e oráculo explícito.' }
            ] },
            token: { texto: 'Achado 2: um token de longa vida foi copiado num relatório de incidente. O que você faz?', opcoes: [
              { texto: 'Apagar o relatório e seguir.', vai: 'f-token', tom: 'ruim', consequencia: 'o segredo já saiu do cofre; apagar o texto não revoga a credencial.' },
              { texto: 'Trocar por credencial curta com rotação, revogar o token e registrar a exfiltração do relatório como P1.', vai: 'vetor', tom: 'ok', consequencia: 'segredo com dono, prazo e revogação auditada; o P1 bloqueia o release até o conserto.' }
            ] },
            vetor: { texto: 'Achado 3: o índice vetorial não filtra por tenant, embora o SQL já isole. O que você faz?', opcoes: [
              { texto: 'Nada: o SQL já isola os tenants.', vai: 'f-vetor', tom: 'ruim', consequencia: 'data plane esquecido: o tenant A aparece na busca vetorial do B.' },
              { texto: 'Aplicar namespace por tenant ao índice e criar um teste negativo A para B.', vai: 'f-bom', tom: 'ok', consequencia: 'cada data plane tem teste negativo (M12-AT-010 a 014).' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Rota negada por padrão, segredo com ciclo de vida curto e data plane com namespace e teste negativo: o fechamento tem oráculo para cada propriedade.' },
            'f-gateway': { bom: false, texto: 'A rota ficou exposta atrás de uma suposição e foi achada pelo adversário real.' },
            'f-token': { bom: false, texto: 'O token vazado continuou válido até alguém abusar dele.' },
            'f-vetor': { bom: false, texto: 'A busca vetorial devolveu dado do tenant errado, com o SQL perfeito e a aplicação sem erro.' }
          },
          callout: 'Você fechou os três achados com default que nega, segredo curto e teste negativo.' },
        { tipo: 'takeaway', html: 'P0/P1 <mark>bloqueiam</mark>; P2 só passa com <mark>responsável, prazo, compensação e assinatura</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>O que prova que o fechamento segurou</h3>' +
          '<p>O oráculo nunca é "nenhum alerta disparou". É "cada ataque, falha e exclusão encontrou o controle correto com evidência reproduzível, e cada número da defesa deriva do ledger".</p>' +
          '<ul><li><strong>M12-AT-001 a 006</strong>: conteúdo hostil, destino proibido, segredo em saída, argumento fora do schema, aprovação adulterada e identidade divergente negam por controle determinístico, com auditoria sem conteúdo.</li>' +
          '<li><strong>M12-AT-010 a 014</strong>: o banco real e cada data plane isolam mesmo com a aplicação errando.</li>' +
          '<li><strong>M12-AT-020 a 023</strong>: contador externo único e reconciliação antes de novo efeito.</li>' +
          '<li><strong>M12-AT-030 a 032</strong>: rejeição sem mutação, convergência por versão e divergência registrada.</li>' +
          '<li><strong>M12-AT-040 e 041</strong>: negação no limite e fechamento reconciliado.</li>' +
          '<li><strong>M12-AT-050 a 052</strong>: alerta normalizado, zero ação do copiloto e game day com postmortem.</li>' +
          '<li><strong>M12-AT-060</strong>: ausência nos stores ativos, com limites de backup declarados.</li></ul>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Diagnóstico: sintoma, hipótese, evidência, correção</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Hipótese</th><th>Evidência</th><th>Correção</th></tr></thead><tbody>' +
          '<tr><td>prompt muda objetivo</td><td>conteúdo ganhou autoridade</td><td>inspeção do PEP e das tools</td><td>policy externa e schema fechado</td></tr>' +
          '<tr><td>scanner passou, segredo vazou</td><td>scanner tratado como garantia</td><td>busca nos sinks e traces</td><td>minimizar dados e bloquear destino</td></tr>' +
          '<tr><td>URL allowlisted alcança IP privado</td><td>DNS rebinding</td><td>comparação entre resolução e conexão</td><td>egress proxy e pin seguro</td></tr>' +
          '<tr><td>aprovação aceita valor maior</td><td>sem intent digest</td><td>comparação do payload canonical</td><td>binding exato e reaprovação</td></tr>' +
          '<tr><td>tenant A aparece em B</td><td>contexto de sessão no pool</td><td>teste A→B na mesma conexão</td><td>transação com contexto local</td></tr>' +
          '<tr><td>RLS não filtra owner</td><td>role privilegiada</td><td>catálogos de roles e tabelas</td><td>role de aplicação separada com RLS forçado</td></tr>' +
          '<tr><td>SQL isolado, vetor vaza</td><td>data plane esquecido</td><td>busca sem filtro de tenant</td><td>namespace e teste negativo</td></tr>' +
          '<tr><td>retry duplica pagamento</td><td>cache local ou chave fraca</td><td>duas instâncias concorrentes</td><td>ledger durável com unicidade e digest</td></tr>' +
          '<tr><td>registro started não termina</td><td>janela ambígua</td><td>consulta ao provedor e ao outbox</td><td>estado desconhecido com reconciliação</td></tr>' +
          '<tr><td>limite dobra com réplicas</td><td>contador por processo</td><td>teste distribuído</td><td>coordenador atômico compartilhado</td></tr>' +
          '<tr><td>cancelamento gera cobrança</td><td>reserva não fechada</td><td>comparação com o uso do provedor</td><td>fechamento e reconciliação garantidos</td></tr>' +
          '<tr><td>webhook reabre entitlement</td><td>evento fora de ordem</td><td>reordenação das fixtures</td><td>máquina de estados e versão</td></tr>' +
          '<tr><td>margem parece constante</td><td>custo fixo arbitrário</td><td>rastreamento da origem dos números</td><td>derivar do usage ledger</td></tr>' +
          '<tr><td>alerta pagina sem ação</td><td>threshold de diagnóstico</td><td>mapeamento de impacto e runbook</td><td>burn rate de SLO e política de page</td></tr>' +
          '<tr><td>copiloto sugere comando do log</td><td>log tratado como controle</td><td>fixture adversarial</td><td>somente-leitura com sanitização e aprovação</td></tr>' +
          '</tbody></table>' +
          '<table><thead><tr><th>Sintoma do bloco</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>exclusão deixa resíduo ativo</td><td>store sem filtro de tenant ou fila derivada esquecida</td><td><code>delete_tenant</code> cobre os cinco stores; <code>count_tenant_records</code> confirma zero</td></tr>' +
          '<tr><td>backup reintroduz dado excluído</td><td>restore sem controle nem expiração declarada</td><td>declarar <code>backups_expire_at</code>, controles de restore e prevenção de reintrodução</td></tr>' +
          '<tr><td>P2 aceito sem rastro</td><td>aceite verbal sem responsável nem prazo</td><td>registro com severidade, responsável, prazo, compensação e assinatura</td></tr>' +
          '<tr><td>defesa não reproduz número</td><td>valor fixo ou origem fora do ledger</td><td>derivar custo, receita e margem do usage ledger com relatórios versionados</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Pacote de evidências e ponte para o laboratório</h3>' +
          '<p>O pacote <code>capstone/evidence/m12/</code> guarda ambiente, resultados de testes, revisão do threat model, relatório red-team, relatório de isolamento por tenant, matriz de crashes de idempotência, economia unitária (e, se você implementou cobrança, a reconciliação de billing), relatório de SLO, timeline do game day, postmortem e registro de riscos residuais. Cada número é rastreável ao ledger ou ao relatório que o produziu, sem resultado fixo arbitrário.</p>' +
          '<p>B09-L reexecuta as superfícies congeladas de B01 a B08 e congela o contrato de exclusão, com os nomes e o comportamento que os testes exercem:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'TenantDataPlanes.delete_tenant(context, *, now, backup_retention)',
          '  # remove o tenant de cache, objetos, vetores, grafo e fila',
          '  # devolve DeletionReport: removed_by_store (por store),',
          '  #   active_records_remaining == 0,',
          '  #   backups_expire_at == now + backup_retention',
          'TenantDataPlanes.count_tenant_records(context)',
          '  # confirma zero registro restante do tenant'].join('\n') },
        { tipo: 'texto', html: '<p>PostgreSQL real com RLS, coordenação distribuída, adapter em test-mode, telemetria do Capstone, game day com timeline e postmortem, além de restore de backup e reintrodução indevida, pertencem às evidências seguintes e não são alegados aqui.</p>' },
        { tipo: 'escolha', id: 'b9-escolha-aceite', titulo: 'Confira: o critério de aceite',
          pergunta: 'Qual destes é um critério de aceite melhor para o hardening?',
          opcoes: [
            { id: 'a', texto: '"Revisamos o checklist e está tudo certo".', correta: false, porque: 'checklist sem oráculo declara sem provar.' },
            { id: 'b', texto: '"O red team não achou nada".', correta: false, porque: 'não prova que o controle segura, só que ninguém achou.' },
            { id: 'c', texto: '"Aceitamos o P2 de palavra".', correta: false, porque: 'aceite verbal evapora na primeira auditoria.' },
            { id: 'd', texto: 'Uma suíte que tenta vazar e falha, com oráculo explícito, regras escritas do red team e risco aceito com dono e prazo.', correta: true, porque: 'a propriedade é verificável quando há teste que tenta violar e falha, com defaults seguros.' }
          ] },
        { tipo: 'escolha', id: 'b9-escolha-default', titulo: 'Confira: defaults seguros',
          pergunta: 'O que significa "defaults seguros" no hardening?',
          opcoes: [
            { id: 'a', texto: 'O caminho sem configuração adicional é o caminho seguro: negar por padrão e exigir opt-in para ampliar poder.', correta: true, porque: 'quem amplia poder precisa pedir e justificar; esquecer uma configuração deixa o sistema fechado.' },
            { id: 'b', texto: 'Ter uma configuração padrão documentada.', correta: false, porque: 'documentar não garante que o padrão negue.' },
            { id: 'c', texto: 'Desligar logs por padrão.', correta: false, porque: 'não tem relação com negar efeito ou dado.' },
            { id: 'd', texto: 'Usar sempre a configuração do fornecedor.', correta: false, porque: 'o padrão do fornecedor pode ser permissivo.' }
          ] },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes do bloco: OWASP ASVS 5.0.0 (defaults seguros, controle de acesso e proteção de segredos), SLSA e Sigstore (panorama de proveniência e assinatura, sem adoção alegada no laboratório), Google SRE Workbook (resposta a incidentes e postmortem), Google SRE (Alerting on SLOs) e OpenTelemetry Specification.</p>' },
        { tipo: 'takeaway', html: 'O oráculo é a <mark>suíte que tenta violar e falha</mark>, não a <mark>ausência de alerta</mark>.' }
      ] }
    ]
  });
})();
