/* M02A · Bloco 1: papel sênior, produto, risco e evidência. Fonte: M02A.html#b1. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'def prioridade(risco):', '    # ordem de triagem: impacto, probabilidade, detectabilidade, reversibilidade',
    '    return (0, 0, 0, 0)', '', '',
    'def ordenar(riscos):', '    # do mais prioritário para o menos', '    return list(riscos)', '', '',
    'CAMPOS_CLAIM = ("claim", "method", "raw_artifact", "digest", "limitation")', '', '',
    'def claim_valido(claim):', '    # rejeita claim sem método, artefato bruto, digest ou limitação', '    return True', ''].join('\n');
  var testes = [
    'R1 = {"id": "R1", "impact": 4, "likelihood": 1, "detectability": 2, "reversibility": 3}',
    'R2 = {"id": "R2", "impact": 3, "likelihood": 4, "detectability": 4, "reversibility": 4}',
    'R3 = {"id": "R3", "impact": 4, "likelihood": 2, "detectability": 1, "reversibility": 1}', '', '',
    'def test_prioridade_e_tupla_na_ordem():', '    assert prioridade(R1) == (4, 1, 2, 3)', '', '',
    'def test_impacto_vem_antes_de_probabilidade():', '    assert [r["id"] for r in ordenar([R2, R1])] == ["R1", "R2"]', '', '',
    'def test_empate_de_impacto_desempata_por_probabilidade():', '    assert [r["id"] for r in ordenar([R1, R3])] == ["R3", "R1"]', '', '',
    'def test_claim_completo_passa():',
    '    c = {"claim": "x", "method": "m", "raw_artifact": "a.json", "digest": "sha256:1", "limitation": "l"}',
    '    assert claim_valido(c)', '', '',
    'def test_claim_sem_limitacao_ou_digest_cai():',
    '    c = {"claim": "x", "method": "m", "raw_artifact": "a.json", "digest": "sha256:1", "limitation": ""}',
    '    assert not claim_valido(c)', '    c["limitation"] = "l"; del c["digest"]', '    assert not claim_valido(c)', ''].join('\n');
  var solucao = [
    'def prioridade(risco):', '    return (risco["impact"], risco["likelihood"], risco["detectability"], risco["reversibility"])', '', '',
    'def ordenar(riscos):', '    return sorted(riscos, key=prioridade, reverse=True)', '', '',
    'CAMPOS_CLAIM = ("claim", "method", "raw_artifact", "digest", "limitation")', '', '',
    'def claim_valido(claim):', '    return all(str(claim.get(c, "")).strip() for c in CAMPOS_CLAIM)', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b1',
    titulo: 'Papel sênior, produto, risco e evidência',
    minutos: 35,
    resumo: 'Entregar código deixa de bastar: sênior reduz incerteza sem esconder risco, deixa opções reversíveis e torna a decisão auditável.',
    objetivo: 'Separar output, outcome, impacto e restrição; descrever um risco como causa, evento e consequência; e escrever um claim com método, evidência e limitação.',
    revisao: [
      { id: 'm02ab1-camadas', pergunta: 'Uma equipe dobrou os PRs integrados e o tempo de resolução de incidentes piorou. O que isso permite concluir?',
        opcoes: [
          opc('a', 'Nada ainda: PR é output; faltam outcome e impacto (lead time, falha de mudança, tempo de restauração).', true, 'volume de mudança sem feedback pode até aumentar risco; a unidade de análise é o sistema de trabalho.'),
          opc('b', 'Que a produtividade dobrou.', false, 'confunde atividade com resultado.'),
          opc('c', 'Que o time piorou.', false, 'também é conclusão sem método.')] },
      { id: 'm02ab1-risco', pergunta: 'Qual descrição é um risco analisável?',
        opcoes: [
          opc('a', '"Segurança."', false, 'é um tema, não um cenário.'),
          opc('b', 'Texto livre atravessa uma fronteira não confiável; uma instrução adversarial altera o advisory e aumenta revisões incorretas.', true, 'causa, evento incerto e consequência permitem controle e oráculo.'),
          opc('c', '"A IA pode errar."', false, 'falta causa, consequência e objetivo afetado.')] },
      { id: 'm02ab1-ordinal', pergunta: 'Por que multiplicar "3 × 4" numa matriz ordinal não vira estatística?',
        opcoes: [
          opc('a', 'Escalas ordinais iniciais são convenção de priorização; o certo é registrar a base e testar a sensibilidade.', true, 'a pergunta útil é se a prioridade muda quando um nível está errado.'),
          opc('b', 'Porque o produto de dois inteiros é impreciso.', false, 'o problema é a base da estimativa, não a aritmética.'),
          opc('c', 'Porque só vale com 4 níveis.', false, 'a quantidade de níveis não cria dado.')] },
      { id: 'm02ab1-claim', pergunta: 'O que torna "no corpus X, o gate Y não achou texto sensível; hashes no manifest; não prova ausência em adapters não exercitados" uma boa frase?',
        opcoes: [
          opc('a', 'Liga claim, método, evidência e limitação.', true, 'a versão fraca é "o sistema é seguro": absoluta, sem escopo nem método.'),
          opc('b', 'É longa.', false, 'tamanho não é critério.'),
          opc('c', 'Evita citar o gate.', false, 'ao contrário: nomeia o oráculo.')] },
      { id: 'm02ab1-reversivel', pergunta: 'Feature flag torna toda mudança reversível?',
        opcoes: [
          opc('a', 'Não: só ajuda se os caminhos foram testados, o estado segue compatível e alguém sabe operar a reversão.', true, 'migração destrutiva ou dado vazado não voltam por flag.'),
          opc('b', 'Sim, desligar a flag desfaz tudo.', false, 'ignora estado e dados.'),
          opc('c', 'Só em produção.', false, 'o ambiente não é o critério.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Senioridade não é uma coleção de APIs memorizadas nem autorização para decidir por gosto. É a capacidade de <strong>reduzir incerteza sem esconder risco</strong>, produzir opções reversíveis, proteger pessoas e sistemas e tornar a decisão auditável. Quem escreve código sofisticado mas otimiza a tarefa local enquanto desloca custo para suporte, segurança, operação ou usuário ainda opera abaixo desse nível.</p>' +
          '<p>Ao final do bloco você produz quatro artefatos para o <code>work-intake</code>: intenção do produto, mapa de stakeholders, registro inicial de riscos e registro de evidência. Eles delimitam o problema que o código poderá resolver e impedem que velocidade de implementação seja confundida com sucesso.</p>' +
          '<h3>Output, outcome, impacto e restrição</h3>' +
          '<p><strong>Output</strong> é o artefato produzido (API, migração, PR, dashboard). <strong>Outcome</strong> é uma mudança observável para alguém (solicitações triadas corretamente, menos espera). <strong>Impacto</strong> é a consequência mais ampla e retardada (custo de oportunidade, dano evitado). <strong>Restrição</strong> delimita as soluções aceitáveis (privacidade, orçamento, prazo, reversibilidade).</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Camada</th><th>No <code>work-intake</code></th><th>Medida possível</th><th>Erro frequente</th></tr></thead><tbody>' +
          '<tr><td>output</td><td>CLI e política de triagem entregues</td><td>artefato instalável, gate verde</td><td>declarar sucesso porque o código existe</td></tr>' +
          '<tr><td>outcome</td><td>solicitações chegam à revisão apropriada</td><td>proporção de encaminhamentos confirmados por humano</td><td>tratar volume processado como qualidade</td></tr>' +
          '<tr><td>impacto</td><td>menor espera sem ampliar risco</td><td>tempo até decisão, dano evitado, retrabalho</td><td>atribuir causalidade sem desenho de medição</td></tr>' +
          '<tr><td>restrição</td><td>advisor nunca revoga proibição determinística</td><td>zero violações no corpus adversarial</td><td>negociar segurança em silêncio para ganhar throughput</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>"Implementar classificação por IA" já escolheu a solução. "Reduzir o tempo de triagem mantendo decisões proibidas sob política determinística e revisão humana" explicita outcome e restrição e deixa abertas soluções mais simples: uma regra, um formulário melhor, outra fila.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Anti-padrão: produtividade por atividade isolada', html:
          '<p>Linhas de código, commits, tickets encerrados e prompts enviados são outputs ou proxies de atividade. O framework SPACE mostra que produtividade de desenvolvimento é multidimensional; uma métrica única perde colaboração, qualidade, satisfação e fluxo. Métricas alteram comportamento: ranking individual incentiva produzir o número, não o outcome.</p>' },
        { tipo: 'takeaway', html: '<mark>Output</mark> entrega uma coisa, <mark>outcome</mark> muda um estado, <mark>impacto</mark> é a consequência e <mark>restrição</mark> limita as soluções.' }
      ] },

      { rotulo: 'Sistema, risco e evidência', blocos: [
        { tipo: 'texto', html:
          '<h3>Software é um sistema sociotécnico</h3>' +
          '<p>O comportamento emerge da interação entre código, ferramentas, dados, incentivos, comunicação, estrutura organizacional e operação. Se só uma pessoa entende a regra crítica, se a aprovação incentiva pressa, se o alerta não chega ao dono ou se o contrato entre equipes é ambíguo, o risco está no sistema mesmo quando cada função passa nos testes.</p>' +
          '<p>Conway observou que organizações tendem a produzir designs que refletem suas estruturas de comunicação. Use isso como <em>hipótese</em> para investigar dependências, não como lei: quais equipes coordenam para uma mudança? Onde há handoffs? Quem tem autoridade sem contexto?</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Lente</th><th>Pergunta</th><th>Sinal no produto</th><th>Intervenção</th></tr></thead><tbody>' +
          '<tr><td>pessoas</td><td>quem decide e quem sofre a consequência?</td><td>analista responde por decisão que não pode contestar</td><td>override explícito, reason codes, escalonamento</td></tr>' +
          '<tr><td>processo</td><td>qual handoff adiciona espera ou perde contexto?</td><td>pedido volta várias vezes por dado ausente</td><td>contrato de entrada e feedback no trust boundary</td></tr>' +
          '<tr><td>tecnologia</td><td>qual dependência concentra poder ou falha?</td><td>provider indisponível bloqueia a triagem</td><td>porta, timeout e fallback declarado</td></tr>' +
          '<tr><td>organização</td><td>ownership e comunicação acompanham a mudança?</td><td>ninguém possui policy e operação juntas</td><td>responsável explícito e condição de revisão</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O relatório DORA 2025 descreve IA como amplificador de forças e fragilidades organizacionais. É evidência industrial contextual, não lei universal. A conclusão segura é estreita: mais velocidade de geração sem feedback, testes, arquitetura e governança pode aumentar também o volume de mudança insegura.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Contraste: confiança do modelo não é autoridade', html:
          '<p><strong>Quase correto:</strong> "o advisor usa um modelo excelente, então confiança acima de 0,9 aprova automaticamente". <strong>Problema:</strong> confiança é saída do adapter, pode ser mal calibrada e não carrega autoridade normativa. <strong>Projeto correto:</strong> o advisor oferece sinais; a política determinística aplica restrições e decide; casos ambíguos vão para revisão humana; versão, recording e digest entram na evidência.</p>' },
        { tipo: 'texto', html:
          '<h3>Risco é incerteza sobre objetivo</h3>' +
          '<p>Um registro útil descreve <strong>causa → evento incerto → consequência</strong>. A resposta pode reduzir probabilidade, limitar impacto, melhorar detecção, transferir parte do risco, evitar a atividade ou aceitar o residual com autoridade explícita. Escalas ordinais no início do produto são convenção de priorização: registre a base da estimativa e faça análise de sensibilidade (a prioridade muda se um nível estiver errado?).</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Campo</th><th>Função</th><th>Exemplo</th></tr></thead><tbody>' +
          '<tr><td>objetivo afetado</td><td>liga o risco ao que importa</td><td>triagem segura e auditável</td></tr>' +
          '<tr><td>causa / evento / consequência</td><td>torna o cenário testável</td><td>saída malformada → parser falha → pedido sem decisão confiável</td></tr>' +
          '<tr><td>exposição</td><td>ordena sem fingir certeza</td><td>probabilidade incerta, impacto alto, baixa detectabilidade</td></tr>' +
          '<tr><td>reversibilidade</td><td>custo de desfazer</td><td>trocar adapter é barato; vazar dado é irreversível</td></tr>' +
          '<tr><td>controle / oráculo</td><td>resposta verificável</td><td>schema fechado + fallback + teste adversarial</td></tr>' +
          '<tr><td>owner / trigger</td><td>impede risco órfão</td><td>owner da policy; revisar quando contrato ou corpus mudar</td></tr>' +
          '<tr><td>residual</td><td>evita promessa absoluta</td><td>schema não prova veracidade nem ausência de manipulação semântica</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p><strong>Reversibilidade</strong> muda a estratégia: decisão pequena, observável e fácil de desfazer pode ser testada para aprender; migração destrutiva, exposição de dado ou compromisso contratual exige mais evidência antes. Feature flag só ajuda se os caminhos foram testados, o estado segue compatível e alguém sabe operar a reversão.</p>' },
        { tipo: 'takeaway', html: 'Risco útil tem <mark>cenário</mark>, <mark>controle</mark>, <mark>owner</mark> e <mark>residual</mark>; <mark>reversibilidade</mark> decide quanto aprender executando e quanto provar antes.' }
      ] },

      { rotulo: 'Claim e prática', blocos: [
        { tipo: 'texto', html:
          '<h3>Claim, método, evidência, limitação</h3>' +
          '<p>Uma alegação profissional sobrevive à pergunta "como você sabe?". <strong>Claim</strong>: afirmação estreita e falsificável. <strong>Método</strong>: procedimento, ambiente, entradas, instrumentos e oráculo. <strong>Evidência</strong>: dado bruto e artefatos derivados com proveniência. <strong>Limitação</strong>: o que não foi coberto e explicações alternativas.</p>' +
          '<p>O <strong>manifest</strong> torna a reconstrução possível: commit ou snapshot, sistema operacional, runtime, versões de ferramentas, comando, duração, seed quando houver aleatoriedade, digest das entradas e local das saídas. Screenshot sem dado bruto e "testado manualmente" não sustentam investigação posterior.</p>' +
          '<p>No laboratório, o <em>claim card</em> persiste <code>claim, scope, method, raw_artifact, environment, digest, result, limitation, valid_until, reviewer</code>, e o teste rejeita ausência de método, artefato bruto, digest ou limitação. SACM é referência avançada de argumentação estruturada; o curso usa só esse subconjunto didático.</p>' },
        { tipo: 'rode', id: 'b1-rode', titulo: 'Ordene os riscos do work-intake', obrigatorio: false,
          enunciado: 'A tupla de prioridade do laboratório é <code>(impacto, probabilidade, detectabilidade, reversibilidade)</code>, ordenada do maior para o menor. Rode o exemplo (valores ilustrativos, rotulados como exemplo).',
          prefixo: '$', entrada: 'python -c "ordena riscos"', unidade: 'ms', terminalTitulo: 'exemplo (valores variam)',
          prever: { pergunta: 'R1 tem impacto 4 e probabilidade 1; R2 tem impacto 3 e probabilidade 4. Quem vem primeiro?', opcoes: [
            { id: 'a', texto: 'R2, porque 3 × 4 é maior que 4 × 1.', correta: false, porque: 'a ordem não multiplica nada: a tupla compara impacto primeiro.' },
            { id: 'b', texto: 'R1, porque impacto vem antes de probabilidade na tupla.', correta: true, porque: 'é uma política explícita e substituível, não um "score científico".' }
          ] },
          etapas: [
            { id: 'l', nome: 'Lê o registro', descricao: 'R1 e R2', tom: 'dns', ms: 1, linhas: [L('info', 'R1: impact=4 likelihood=1 detectability=2 reversibility=3'), L('info', 'R2: impact=3 likelihood=4 detectability=4 reversibility=4')] },
            { id: 'o', nome: 'Ordena', descricao: 'reverse=True', tom: 'response', ms: 1, linhas: [L('out', '1. R1  (4, 1, 2, 3)'), L('out', '2. R2  (3, 4, 4, 4)'), L('hint', 'exemplo: impacto vem antes; outra organização pode escolher outra política, mas ela precisa estar escrita')] }
          ] },
        { tipo: 'python', id: 'b1-python', titulo: 'Prioridade de risco e validação do claim', obrigatorio: false,
          enunciado: 'Implemente <code>prioridade(risco)</code> (tupla impacto, probabilidade, detectabilidade, reversibilidade), <code>ordenar(riscos)</code> (maior prioridade primeiro) e <code>claim_valido(claim)</code>: exige <code>claim, method, raw_artifact, digest, limitation</code> não vazios.',
          codigo: codigo, testes: testes,
          dica: 'Use <code>sorted(..., key=prioridade, reverse=True)</code> e <code>all(...)</code> sobre <code>CAMPOS_CLAIM</code>, tratando campo ausente como vazio.',
          solucao: solucao,
          tutorDepois: 'A tupla deixa a política de ordenação visível e testável; o claim sem limitação é rejeitado por regra, não por boa vontade do revisor.',
          callout: 'Ordenação explícita e claim card validado.' },
        { tipo: 'escreva', id: 'b1-escreva', titulo: 'Reescreva "risco de IA"', obrigatorio: false,
          enunciado: 'Reescreva "risco de IA" no <code>work-intake</code> como causa → evento → consequência e defina controle, oráculo e residual.',
          placeholder: 'Causa: ... Evento: ... Consequência: ... Controle: ... Oráculo: ... Residual: ...',
          rubrica: ['Tem causa, evento incerto e consequência ligados a um objetivo (triagem segura e auditável).', 'O controle é verificável por um oráculo (teste adversarial, schema fechado, fallback).', 'O residual diz o que o controle não prova (por exemplo, manipulação semântica).', 'Tem owner e gatilho de revisão.'],
          modelo: '<p><strong>Causa:</strong> texto livre cruza uma fronteira não confiável. <strong>Evento:</strong> instrução adversarial altera o advisory. <strong>Consequência:</strong> pedido proibido recebe recomendação de aceite e revisões ficam incorretas. <strong>Controle:</strong> policy determinística decide; advisor só sinaliza; schema fechado e fallback. <strong>Oráculo:</strong> corpus adversarial sem violação. <strong>Residual:</strong> schema não prova veracidade. <strong>Owner/trigger:</strong> policy owner; revisar quando contrato ou corpus mudar.</p>' },
        { tipo: 'cenario', id: 'b1-cenario', titulo: 'A modernização que quer "adotar IA"', obrigatorio: false,
          enunciado: 'Um líder pede "migrar o sistema legado para IA". Decida como conduzir.',
          inicio: 'i',
          nos: { i: { texto: 'Qual é o seu primeiro movimento?', opcoes: [
            { texto: 'Começar pela stack e pelo modelo.', vai: 'f-ruim', tom: 'ruim', consequencia: 'a solução foi escolhida antes do problema.' },
            { texto: 'Descrever outcome e restrição, e achar a decisão mais difícil de reverter.', vai: 'n2', tom: 'ok', consequencia: 'o problema ganha medida e limite antes da tecnologia.' }] },
            n2: { texto: 'Qual a próxima proposta?', opcoes: [
              { texto: 'Uma mudança menor que gere evidência (claim, método, limitação).', vai: 'f-bom', tom: 'ok', consequencia: 'aprende-se com custo reversível.' },
              { texto: 'Migrar tudo e medir depois.', vai: 'f-big', tom: 'ruim', consequencia: 'sem baseline não há como saber se melhorou.' }] } },
          finais: { 'f-bom': { bom: true, texto: 'Decisão reversível, com evidência e limite declarados.' }, 'f-ruim': { bom: false, texto: 'Tecnologia primeiro: o resultado não tem como ser avaliado.' }, 'f-big': { bom: false, texto: 'Mudança grande sem baseline: sucesso indemonstrável.' } },
          callout: 'Você começou pelo outcome e escolheu a mudança menor.' },
        { tipo: 'escolha', id: 'b1-esc1', titulo: 'Confira: evidência', pergunta: 'Qual evidência sustenta uma investigação posterior?',
          opcoes: [
            { id: 'a', texto: 'Uma captura de tela do terminal verde.', correta: false, porque: 'sem dado bruto, comando e versão não é reconstruível.' },
            { id: 'b', texto: 'Manifest com comando, versões, digest das entradas, artefato bruto e limitação.', correta: true, porque: 'permite reconstruir e questionar o resultado.' },
            { id: 'c', texto: 'A frase "testado manualmente".', correta: false, porque: 'não permite reexecução.' }] },
        { tipo: 'escolha', id: 'b1-esc2', titulo: 'Confira: advisor', pergunta: 'Pedido proibido chega com advisory de confiança 0,95 recomendando aceitar. O que o oráculo da invariante P0 espera?',
          opcoes: [
            { id: 'a', texto: 'Aceitar: confiança alta.', correta: false, porque: 'confiança não revoga proibição determinística.' },
            { id: 'b', texto: 'Recusar ou escalar: a policy determinística vence o advisory.', correta: true, porque: 'se o teste ficar verde com "confiança ≥ 0,9 aceita", ele só cobre o caminho feliz.' }] },
        { tipo: 'takeaway', html: 'Claim profissional liga <mark>método</mark>, <mark>evidência</mark> e <mark>limitação</mark>; IA não altera esse padrão.' }
      ] }
    ]
  });
})();
