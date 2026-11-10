/* M04 · Bloco 3: ADR e postmortem. Fonte: M04.html#b03. MADR 4.0 e Google SRE workbook verificados em 14/09/2026 (revalidar em até 90 dias). A saída do linter no "rode" vem da solução do exercício desta aula. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasAdr = function () {
    return [
      { id: 'arquivo', nome: 'O arquivo', descricao: 'docs/adr/0007-banco-de-dados.md', tom: 'dns', ms: 2, linhas: [
        L('cmd', 'python lint_adr.py docs/adr/0007-banco-de-dados.md'),
        L('out', '# ADR 0007: Banco de dados'),
        L('out', 'Status: aceita'),
        L('out', 'Usamos PostgreSQL.'),
        L('out', 'Postgres é robusto, popular e tem boa performance.')] },
      { id: 'estrutura', nome: 'Regra: estrutura', descricao: 'Quatro seções obrigatórias', tom: 'tcp', ms: 4, linhas: [
        L('in', "('adr-estrutura', '## Contexto')"),
        L('in', "('adr-estrutura', '## Opções consideradas')"),
        L('in', "('adr-estrutura', '## Decisão')"),
        L('in', "('adr-estrutura', '## Consequências')")] },
      { id: 'status', nome: 'Regra: status', descricao: 'proposta, aceita ou substituída por', tom: 'tls', ms: 0, linhas: [
        L('out', 'status "aceita" encontrado: sem violação')] },
      { id: 'porque', nome: 'Regra: porque', descricao: 'A seção Decisão precisa justificar', tom: 'request', ms: 0, linhas: [
        L('out', 'não há seção "## Decisão": a regra não chega a rodar'),
        L('hint', 'sem a seção, a pergunta "por quê?" nem tem onde ser respondida')] },
      { id: 'resultado', nome: 'Resultado', descricao: 'Exit code', tom: 'ink', ms: 1, linhas: [
        L('in', '4 violações'),
        L('hint', 'exit=1: título vago, nenhuma opção, nenhum custo, nenhum gatilho de revisão. É anotação, não decisão')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm04-b3',
    titulo: 'ADR e postmortem: registrar decisão e registrar falha',
    minutos: 40,
    resumo: 'O que foi considerado e rejeitado não se recupera lendo o código. O ADR registra a decisão com custo declarado; o postmortem blameless registra o que aconteceu quando a realidade discordou.',
    objetivo: 'Escrever e criticar um ADR (imutável, curto, com custo e gatilho de revisão), decidir quando um ADR vale a pena e estruturar um postmortem blameless com ações que têm dono e prazo.',
    revisao: [
      { id: 'm04b3-imutavel', pergunta: 'Seis meses depois o time troca Pinecone por pgvector. O que fazer com o ADR antigo?',
        opcoes: [
          opc('a', 'Escrever um novo ADR que o substitui e marcar o antigo como "substituída por NNNN"', true, 'o histórico é o produto: mostra como o raciocínio do sistema evoluiu.'),
          opc('b', 'Editar o ADR antigo para refletir a nova decisão', false, 'editar o passado destrói exatamente o que se quer preservar.'),
          opc('c', 'Apagá-lo para ninguém se confundir', false, 'apagar perde o porquê das opções descartadas.')] },
      { id: 'm04b3-bolso', pergunta: 'Qual é o teste de bolso para decidir se algo merece ADR?',
        opcoes: [
          opc('a', 'Reverter custa mais de uma semana de trabalho ou envolve migração de dado', true, 'inclui registrar também "por que NÃO fizemos o óbvio".'),
          opc('b', 'Qualquer decisão técnica que alguém tomou na semana', false, 'ADR demais mata o hábito: ninguém lê, ninguém escreve.'),
          opc('c', 'Só decisões de nomes e estrutura de pastas', false, 'são decisões baratas de reverter.')] },
      { id: 'm04b3-decisao', pergunta: 'Qual é a linha de um ADR que não pode faltar?',
        opcoes: [
          opc('a', '"Escolhi X porque…": a decisão com a razão', true, '"escolhi X" sem o porquê é anotação, não ADR.'),
          opc('b', 'A lista de vantagens de X', false, 'ADR sem custo declarado é peça de marketing.'),
          opc('c', 'O nome do autor', false, 'a autoria não substitui a justificativa.')] },
      { id: 'm04b3-blameless', pergunta: 'Por que o postmortem é blameless e por que os fatores contribuintes ficam no plural?',
        opcoes: [
          opc('a', 'Culpa faz as pessoas omitirem o passo constrangedor da linha do tempo; incidente real quase nunca tem causa única', true, 'a pergunta certa é "o que no sistema tornou isso possível?".'),
          opc('b', 'Por gentileza com o time; o plural é só estilo', false, 'é mecanismo, não gentileza.'),
          opc('c', 'Para dividir a responsabilidade igualmente', false, 'o objetivo é achar o mecanismo, não repartir culpa.')] },
      { id: 'm04b3-acoes', pergunta: 'O que faz do postmortem algo que muda o futuro?',
        opcoes: [
          opc('a', 'Ações com dono e prazo, rastreadas até fecharem', true, 'postmortem sem ação rastreável é redação.'),
          opc('b', 'Um relatório longo com todos os logs', false, 'volume não muda o sistema.'),
          opc('c', 'Um campo com o responsável pelo erro', false, 'esse campo faz as pessoas esconderem informação.')] }
    ],
    abas: [
      { rotulo: 'ADR: por que e quando', blocos: [
        { tipo: 'texto', html:
          '<h3>O que o código nunca conta</h3>' +
          '<p>Existe uma classe de informação que nenhum humano e nenhum agente recupera lendo o código: <strong>o que foi considerado e rejeitado, e por quê</strong>. O código mostra que você usou Postgres; não mostra que avaliou Mongo, que a decisão veio de uma exigência de transação imposta pelo time de compliance, e que ela se torna revisável se a exigência cair. Sem esse registro acontecem três coisas caras: a decisão é reaberta a cada seis meses pelo próximo dev; ninguém sabe se ainda vale quando o contexto muda; e (novidade de 2026) o agente "otimiza" a decisão deliberada, porque só vê o resultado e não a restrição que o produziu.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'ADR, MADR e RFC', html:
          '<p><strong>ADR</strong> (Architecture Decision Record) é um arquivo curto de markdown que registra <em>uma</em> decisão arquitetural: contexto, opções, escolha, consequências. Um por decisão, numerado em sequência (<code>docs/adr/0007-usar-pgvector.md</code>), acumulando um histórico navegável: o "log de commits das decisões". <strong>MADR</strong> (Markdown ADR, versão 4.0 desde 2024) é o template mais adotado, com front matter YAML e seções padronizadas. <strong>RFC</strong> é o parente maior: proposta que circula para comentário antes da decisão, para mudanças grandes que envolvem várias pessoas. Fluxo comum em empresa: RFC para debater, ADR para registrar o que ficou decidido. Estudando solo, ADRs bastam.</p>' +
          '<p>O substituto ruim que o ADR aposenta é a ata de reunião presa num anexo de e-mail, ou o comentário perdido numa classe avisando para não trocar algo "porque quebra o job noturno". O ADR é a versão estruturada e encontrável dos dois: imutável, datado, com justificativa, custando minutos e cabendo num PR.</p>' },
        { tipo: 'texto', html:
          '<h3>Anatomia: por que cada seção existe</h3>' +
          '<p>O repositório já tem <code>docs/adr/0000-template.md</code>, uma variação enxuta do MADR adaptada ao curso.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Seção</th><th>Existe para</th><th>O erro típico</th></tr></thead><tbody>' +
          '<tr><td>Título (<code>NNNN-verbo-objeto</code>)</td><td>ser encontrável por busca daqui a um ano</td><td>título vago ("banco de dados") em vez de decisão ("usar pgvector em vez de Pinecone")</td></tr>' +
          '<tr><td>Status (proposta / aceita / substituída por NNNN)</td><td>dizer se ainda vale, sem apagar o histórico</td><td>editar o ADR velho quando muda de ideia; o certo é um NOVO ADR e marcar o antigo como substituído</td></tr>' +
          '<tr><td>Contexto</td><td>capturar as restrições do momento (prazo, custo, conhecimento, política)</td><td>escrever só a restrição técnica e omitir a política ou o prazo, que costuma ser a razão real</td></tr>' +
          '<tr><td>Opções consideradas</td><td>provar que houve escolha e dar o ponto de partida para reabrir</td><td>listar uma opção só (foi default, não decisão) ou opções-palha que ninguém considerou</td></tr>' +
          '<tr><td>Decisão ("escolhi X porque")</td><td>a única linha que não pode faltar</td><td>"escolhi X" sem o porquê: é anotação, não ADR</td></tr>' +
          '<tr><td>Consequências (ganhei / aceitei como custo / o que me faria mudar)</td><td>honestidade: toda decisão tem preço; e o gatilho de revisão</td><td>listar só vantagens. ADR sem custo declarado é peça de marketing</td></tr>' +
          '<tr><td>Notas de produção (as 3 perguntas de sênior)</td><td>forçar concorrência, falha externa e rollback em toda decisão</td><td>pular, e descobrir na produção</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Duas propriedades mal entendidas', html:
          '<ul><li><strong>É imutável.</strong> ADR registra o que se decidiu <em>naquele contexto</em>. Mudou de ideia? Novo ADR com "Substitui ADR-0007", e o 0007 vira "substituída por ADR-0019". O valor está na sequência histórica.</li>' +
          '<li><strong>É curto.</strong> Uma a duas páginas. Um ADR de dez páginas é um design doc mal etiquetado: o design doc explica <em>como</em> funciona, o ADR registra <em>por que</em> escolhemos assim.</li></ul>' },
        { tipo: 'texto', html:
          '<h3>Quando NÃO escrever ADR</h3>' +
          '<p>A parte que a maioria dos times erra: adota ADR, escreve 40 no primeiro mês, ninguém lê, o hábito morre. O critério é o <strong>custo de reverter</strong>.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Merece ADR</th><th>Não merece</th></tr></thead><tbody>' +
          '<tr><td>Escolha de banco, fila, provedor de LLM</td><td>Escolha de biblioteca de datas</td></tr>' +
          '<tr><td>Fronteira de serviço, modelo de multi-tenancy</td><td>Nome de variável, estrutura de pasta interna</td></tr>' +
          '<tr><td>Formato de contrato público, versionamento de API</td><td>Ordem dos parâmetros de uma função privada</td></tr>' +
          '<tr><td>Estratégia de autenticação, de billing, de retenção de dados</td><td>Qual biblioteca de HTTP client (se são intercambiáveis)</td></tr>' +
          '<tr><td>Rejeitar algo óbvio ("por que NÃO usamos framework de agentes")</td><td>Aplicar o padrão default do time sem exceção</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p><strong>Teste de bolso:</strong> se reverter a decisão custa mais de uma semana de trabalho ou envolve migração de dado, é ADR. A categoria subvalorizada é a última linha: registrar por que você <em>não</em> fez o óbvio. É o ADR que mais economiza tempo depois, porque a pergunta "por que vocês não usam X?" volta sempre, e na era dos agentes é ele que impede o assistente de "corrigir" sua escolha deliberada na próxima refatoração.</p>' },
        { tipo: 'takeaway', html: 'ADR é <mark>imutável</mark>, curto e vale quando reverter custa <mark>mais de uma semana</mark> ou migração de dado.' }
      ] },

      { rotulo: 'Ver um ADR', blocos: [
        { tipo: 'texto', html:
          '<h3>O esqueleto cabe numa tela</h3>' +
          '<p>Este é o formato que a prática do laboratório vai preencher (decisão fictícia do Capstone, Cartógrafo).</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto:
          '# ADR 0001 — Postgres único para vetor e grafo\n\n- **Data:** 2026-08-14   · **Módulo:** M04   · **Status:** aceita\n\n## Contexto\nO Cartógrafo precisa de busca semântica (embeddings de código) E de\ntravessia de grafo (chamadas, referências, dependências). Restrições\nreais: fundador solo, orçamento de infra próximo de zero no lançamento,\ne requisito de venda de "processamento local no cliente" — quanto menos\npeças para instalar, melhor.\n\n## Opções consideradas\n### A — Pinecone/Qdrant + Neo4j\n- A favor: cada peça é a melhor da categoria; escala melhor em volume alto.\n- Contra: três bancos para operar, backupear e instalar no cliente; dois\n  contratos de nuvem; custo fixo antes do primeiro cliente pagante.\n### B — Postgres + pgvector, sem grafo (relacional puro)\n- A favor: uma peça só, familiar.\n- Contra: consulta transitiva ("o que quebra se eu mudar isto?") vira CTE\n  recursiva ilegível e lenta — é a pergunta que MAIS vende o produto.\n### C — Postgres + pgvector + Apache AGE  (escolhida)\n- A favor: uma peça; transação abrangendo grafo e vetor; roda no cliente\n  com um container; RLS multi-tenant vale para tudo (M12).\n- Contra: AGE é menos maduro que Neo4j; Cypher parcial; menos gente sabe.\n\n## Decisão\nEscolhi **C** porque o gargalo do produto no primeiro ano é custo\noperacional e facilidade de instalação no cliente, não escala de vetores.\nUma peça a menos vale mais que 20% de performance de busca.\n\n## Consequências\n**Ganhei:** operação de um banco só; transação única; instalação local trivial.\n**Perdi / aceitei como custo:** teto de escala menor; Cypher limitado no AGE;\ndependência de Postgres gerenciado que aceite extensões.\n**O que me faria mudar de ideia:** passar de ~5M de vetores por tenant, ou\na primeira consulta de grafo que o AGE não expressar em tempo aceitável.\n\n## Notas de produção\n1. Concorrência: pool de 10; ingestão em worker separado, fora do request.\n2. Falha externa: banco fora = API responde 503 com detail claro (M03 b5).\n3. Versionamento: extensão fixada na imagem; migração de índice em\n   release_command, com downgrade escrito.\n' },
        { tipo: 'abas', rotulo: 'Comparação rápida', itens: [
          { rotulo: 'Anotação', blocos: [
            { tipo: 'codigo', linguagem: 'markdown', texto: '# ADR 0007: Banco de dados\n\nStatus: aceita\n\nUsamos PostgreSQL.\n\nPostgres é robusto, popular e tem boa performance.' },
            { tipo: 'texto', html: '<p>Título vago, nenhuma opção considerada, nenhum custo, nenhum gatilho de revisão. É anotação, não decisão: pode ter sido gerado por um agente sem restrições reais.</p>' }] },
          { rotulo: 'Decisão', blocos: [
            { tipo: 'codigo', linguagem: 'markdown', texto: '# ADR 0007: Usar pgvector em vez de Pinecone\n\nStatus: aceita\n\n## Contexto\nEquipe de 3, sem verba para novo fornecedor, dados já no Postgres.\n## Opções\nPinecone, pgvector, Qdrant.\n## Decisão\nEscolhi pgvector porque evita um serviço novo e usa a transação existente.\n## Consequências\nGanhei: um sistema a menos. Aceitei: busca mais lenta acima de ~5M vetores.\nRevisar se passar de 5M vetores.' },
            { tipo: 'texto', html: '<p>O título é uma decisão, há alternativas reais, o custo está declarado e a condição de revisão também. (Para passar no linter desta aula, a seção precisaria se chamar "Opções consideradas".)</p>' }] }
        ] },
        { tipo: 'rode', id: 'm04b3-rode', titulo: 'O linter acusa a anotação', enunciado: 'A saída vem da solução do exercício desta aula, executada sobre o ADR "Anotação" da aba anterior. Preveja antes de rodar.',
          prefixo: '$', entrada: 'python lint_adr.py docs/adr/0007-banco-de-dados.md', unidade: 'violações', terminalTitulo: 'lint de ADR', etapas: etapasAdr(),
          prever: { pergunta: 'O ADR "Anotação" tem Status "aceita" e a frase "Usamos PostgreSQL". Quantas violações o linter acusa?', opcoes: [
            { id: 'a', texto: 'Uma: adr-sem-porque, porque a decisão não se justifica.', correta: false, porque: 'a regra do porquê só olha o conteúdo da seção "## Decisão", e o arquivo nem tem essa seção.' },
            { id: 'b', texto: 'Quatro: as quatro seções obrigatórias ausentes.', correta: true, porque: 'o status é válido e a regra do porquê não chega a rodar sem a seção Decisão.' },
            { id: 'c', texto: 'Cinco: as quatro seções mais o status.', correta: false, porque: 'o status "aceita" está presente e é válido.' }
          ] },
          tutorAntes: 'Aperte Enter. Depois clique em "Regra: porque" para ver por que essa regra não dispara.',
          tutorDepois: 'Quatro violações. Repare que "sem porquê" nem aparece: a estrutura faltando é o problema anterior. Um verificador mecânico cobra a forma; quem cobra se as restrições são reais ainda é você, ou o contraditório do agente.',
          callout: 'Você viu o linter reprovar a anotação por quatro seções ausentes.' },
        { tipo: 'callout', tom: 'success', titulo: 'ADR gerado por IA: o uso certo e o errado', html:
          '<p><strong>Errado:</strong> "escreva um ADR sobre usar Postgres". Sai um texto genérico, com prós e contras de blog, sem nenhuma das suas restrições reais, e como parece um ADR ninguém percebe que está vazio.</p>' +
          '<p><strong>Certo:</strong> você escreve as três coisas que só você sabe (o contexto real, as opções que estavam de fato na mesa e a razão da escolha, em bullets crus) e pede: "transforme em ADR no formato do template, aponte inconsistências no meu raciocínio e liste as consequências negativas que eu não mencionei". O valor do agente aqui é <strong>contraditório e completude</strong>, não redação. A pergunta que mais rende: <em>"que consequência negativa dessa decisão eu não listei?"</em></p>' },
        { tipo: 'takeaway', html: 'Você traz o <mark>contexto real</mark>; o agente traz o <mark>contraditório</mark>. "Escolhi X <mark>porque</mark>…" é a linha que não pode faltar.' }
      ] },

      { rotulo: 'Postmortem blameless', blocos: [
        { tipo: 'texto', html:
          '<h3>O ADR da falha</h3>' +
          '<p>Se o ADR registra a decisão, o postmortem registra o que aconteceu quando a realidade discordou. A prática vem da cultura de SRE do Google, e <strong>blameless</strong> é o mecanismo central, não enfeite de RH: quando a análise busca culpado, as pessoas escondem informação e você perde a causa real. O sistema falhou porque permitia aquela ação, não porque o Fulano a executou. A pergunta certa nunca é "quem fez?", é "o que no sistema tornou isso possível, e o que impede que se repita?".</p>' +
          '<p>A estrutura mínima de um postmortem útil:</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto:
          '# Postmortem — <título do incidente>\n\n- Data / duração / severidade\n- Impacto: quantos usuários, quais operações, quanto dinheiro ou tempo\n\n## Linha do tempo (UTC)\n14:02  deploy da v231 (release_command rodou a migration X)\n14:07  p95 sobe de 120ms para 3s — alerta não disparou (limiar em 5s)\n14:23  cliente abre chamado\n14:31  primeiro engenheiro olha o dashboard\n14:48  rollback para v230; latência normaliza em 2min\n\n## Causa raiz (técnica)\nA migration criou índice sem CONCURRENTLY e travou a tabela sob carga.\n\n## Fatores contribuintes\n- Limiar de alerta de latência calibrado para outra ordem de grandeza\n- Migration não foi testada com volume de produção\n- 24 minutos entre o sintoma e alguém olhar: não havia dono de plantão\n\n## O que funcionou\n- Rollback levou 2 minutos e foi ensaiado antes (M03 bloco 7)\n\n## Ações (com dono e prazo — a única parte que muda o futuro)\n- [ ] CI recusa migration com CREATE INDEX sem CONCURRENTLY — dono: SRE, prazo: 1 sprint\n- [ ] Alerta de p95 acima do SLO por 3min — dono: SRE, prazo: 1 sprint\n- [ ] Rodar migrations contra dump de produção no staging — dono: backend, prazo: 2 sprints\n' },
        { tipo: 'callout', tom: 'info', titulo: 'Blameless contra o relatório com culpado', html:
          '<p>A versão corporativa fraca é o relatório de incidente com campo de "responsável pelo erro" e plano de ação que ninguém acompanha. As diferenças são três e mecânicas:</p>' +
          '<ol><li>Não existe campo de culpado, porque ele faz as pessoas omitirem o passo constrangedor da linha do tempo, justamente onde está a informação.</li>' +
          '<li>O documento mora no repositório, não num sistema de chamados, para ser lido junto com o código (e por agentes).</li>' +
          '<li>A saída obrigatória são ações com dono e prazo, e o postmortem só fecha quando elas fecham.</li></ol>' },
        { tipo: 'texto', html:
          '<p>Três detalhes separam postmortem útil de teatro corporativo. <strong>Linha do tempo com horário</strong>: é ela que revela o tempo de detecção, quase sempre o maior vilão (aqui, 24 minutos entre o sintoma e alguém olhar). <strong>"O que funcionou"</strong>: sem isso o documento vira flagelação e ninguém quer escrever o próximo. <strong>Ações com dono e prazo</strong>: sem ação rastreável é redação. E os <strong>fatores contribuintes</strong> são plural de propósito: incidente real quase nunca tem causa única, e insistir numa causa raiz singular é o jeito mais rápido de consertar a coisa errada.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Cultura de falha, e por que ela vale mais com agentes', html:
          '<ul><li><strong>Human error é sintoma, não causa.</strong> Se a conclusão é "o dev não devia ter feito isso", a análise parou cedo. A pergunta seguinte: por que o sistema deixou? Onde estava o guardrail? (M01, bloco 2: regra inegociável vira exit code.)</li>' +
          '<li><strong>Segurança psicológica é infraestrutura.</strong> Time que pune erro produz relatório limpo e sistema podre. É o fail fast aplicado a pessoas: o problema deve aparecer cedo e barulhento.</li>' +
          '<li><strong>Com agentes</strong> o volume de ações cresce e a atribuição fica difusa: o agente executou, o prompt pediu, o guardrail deixou. Sobra a única pergunta que sempre serviu: <em>que mecanismo permitiu?</em> É onde você descobre que faltava aprovação humana (M12), limite de custo (M05) ou eval de regressão (M06).</li></ul>' },
        { tipo: 'takeaway', html: 'Linha do tempo com <mark>horário</mark>, fatores no <mark>plural</mark>, "o que funcionou" e ações com <mark>dono e prazo</mark>. Nenhum nome no banco dos réus.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'ordene', id: 'm04b3-ordene', titulo: 'Monte um ADR',
          enunciado: 'Coloque as seções do template na ordem em que o leitor as encontra, do topo ao fim.',
          itens: [
            { id: 'decisao', texto: 'Decisão: "escolhi X porque…"' },
            { id: 'titulo', texto: 'Título (<code>NNNN-verbo-objeto</code>)' },
            { id: 'conseq', texto: 'Consequências: o que ganhei, o que aceitei como custo e o que me faria mudar' },
            { id: 'opcoes', texto: 'Opções consideradas' },
            { id: 'contexto', texto: 'Status e Contexto (restrições do momento)' },
            { id: 'notas', texto: 'Notas de produção: concorrência, falha externa e rollback' }
          ],
          solucao: ['titulo', 'contexto', 'opcoes', 'decisao', 'conseq', 'notas'],
          dica: 'O leitor primeiro precisa saber do que se trata, depois em que restrições, depois o que estava na mesa; só então a escolha e o seu preço.',
          callout: 'Ordem do leitor: título, contexto, opções, decisão, consequências e notas de produção.' },
        { tipo: 'python', id: 'm04b3-python', titulo: 'Escreva o linter de ADR', obrigatorio: false,
          enunciado: 'Implemente <code>lint_adr(texto)</code>. Devolva uma lista de tuplas <code>(regra, detalhe)</code>: <code>adr-estrutura</code> para cada seção de <code>SECOES</code> ausente (na ordem), <code>adr-status</code> se nenhum valor de <code>STATUS</code> aparece no texto em minúsculas, e <code>adr-sem-porque</code> se a seção <code>## Decisão</code> existe mas não contém "porque" nem "por que".',
          codigo: [
      'SECOES = ("## Contexto", "## Opções consideradas", "## Decisão", "## Consequências")',
      'STATUS = ("proposta", "aceita", "substituída por")',
      '',
      '',
      'def lint_adr(texto):',
      '    """Devolve lista de (regra, detalhe).',
      '    adr-estrutura: uma por seção obrigatória ausente (na ordem de SECOES);',
      '    adr-status: nenhum status válido no texto (compare em minúsculas);',
      '    adr-sem-porque: seção Decisão sem "porque" nem "por que"."""',
      '    problemas = []',
      '    # 1. seções ausentes',
      '    # 2. status: any(s in texto.lower() for s in STATUS)',
      '    # 3. corpo da Decisão: texto.split("## Decisão", 1)[1].split("##", 1)[0]',
      '    return problemas'
    ].join('\n'), testes: [
      'BOM = """# ADR 0007: Usar pgvector em vez de Pinecone',
      '',
      'Status: aceita',
      '',
      '## Contexto',
      'Equipe de 3, sem verba para novo fornecedor.',
      '## Opções consideradas',
      'Pinecone, pgvector, Qdrant.',
      '## Decisão',
      'Escolhi pgvector porque evita um serviço novo.',
      '## Consequências',
      'Ganhei um sistema a menos. Aceitei busca mais lenta acima de 5M vetores.',
      '"""',
      '',
      '',
      'def regras(texto):',
      '    return [r for r, _ in lint_adr(texto)]',
      '',
      '',
      'def test_adr_completo_passa():',
      '    assert lint_adr(BOM) == []',
      '',
      '',
      'def test_secao_ausente():',
      '    sem = BOM.replace("## Consequências", "## Resultado")',
      '    assert lint_adr(sem) == [("adr-estrutura", "## Consequências")]',
      '',
      '',
      'def test_decisao_sem_porque():',
      '    anotacao = BOM.replace("Escolhi pgvector porque evita um serviço novo.", "Usamos pgvector.")',
      '    assert regras(anotacao) == ["adr-sem-porque"]',
      '',
      '',
      'def test_status_ausente():',
      '    assert regras(BOM.replace("Status: aceita", "Estado: ok")) == ["adr-status"]',
      '',
      '',
      'def test_anotacao_de_uma_linha_acumula_violacoes():',
      '    assert regras("# ADR 0007: Banco de dados\\n\\nUsamos PostgreSQL.") == [',
      '        "adr-estrutura", "adr-estrutura", "adr-estrutura", "adr-estrutura", "adr-status"',
      '    ]',
      '',
      '',
      'def test_por_que_separado_tambem_vale():',
      '    assert lint_adr(BOM.replace("porque", "por que")) == []'
    ].join('\n'),
          dica: 'O corpo da decisão é o trecho entre <code>"## Decisão"</code> e o próximo <code>"##"</code>: <code>texto.split("## Decisão", 1)[1].split("##", 1)[0]</code>. Compare em minúsculas.',
          solucao: [
      'SECOES = ("## Contexto", "## Opções consideradas", "## Decisão", "## Consequências")',
      'STATUS = ("proposta", "aceita", "substituída por")',
      '',
      '',
      'def lint_adr(texto):',
      '    problemas = [("adr-estrutura", s) for s in SECOES if s not in texto]',
      '    if not any(s in texto.lower() for s in STATUS):',
      '        problemas.append(("adr-status", "status ausente ou inválido"))',
      '    if "## Decisão" in texto:',
      '        corpo = texto.split("## Decisão", 1)[1].split("##", 1)[0].lower()',
      '        if "porque" not in corpo and "por que" not in corpo:',
      '            problemas.append(("adr-sem-porque", "Decisão sem justificativa"))',
      '    return problemas'
    ].join('\n'),
          tutorDepois: 'O linter cobra a forma: o ADR gerado sem restrições reais ainda passaria se tivesse um "porque" genérico. Por isso a leitura humana e o contraditório continuam no processo.',
          callout: 'O linter de ADR passou nos testes, inclusive a anotação de uma linha.' },
        { tipo: 'transcript', id: 'm04b3-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'sessão docs/adr',
          enunciado: 'Você pediu um ADR ao agente. Uma das afirmações dele não é sustentada pelo que a sessão mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Escreva um ADR sobre usar Postgres.' },
            { quem: 'agente', texto: 'Criei docs/adr/0007-banco-de-dados.md com status aceita.' },
            { quem: 'ferramenta', texto: '$ sed -n 1,12p docs/adr/0007-banco-de-dados.md\n# ADR 0007: Banco de dados\nStatus: aceita\n## Decisão\nUsamos PostgreSQL.\n## Consequências\nNenhuma relevante.' },
            { quem: 'ferramenta', texto: '$ python lint_adr.py docs/adr/0007-banco-de-dados.md\n("adr-estrutura", "## Contexto")\n("adr-estrutura", "## Opções consideradas")\n("adr-sem-porque", "Decisão sem justificativa")\nexit=1' },
            { quem: 'agente', texto: 'O ADR está completo: registra as restrições do projeto e os custos da decisão.' }
          ],
          erradas: [4],
          explicacao: { 4: 'o arquivo não tem Contexto nem Opções, a Decisão não tem "porque" e a única consequência é "nenhuma relevante": não há restrição real nem custo declarado, e o linter ainda sai com exit 1. Pedir o documento inteiro, sem dar o contexto, gera texto genérico que parece ADR.' },
          tutorDepois: 'O uso certo: você traz o contexto, as opções e a razão em bullets crus; o agente estrutura, critica e pergunta qual consequência negativa ficou de fora.' },
        { tipo: 'escolha', id: 'm04b3-escolha-1', titulo: 'Confira: candidato a ADR',
          pergunta: 'Qual é a melhor candidata a ADR pelo teste de bolso do módulo?',
          opcoes: [
            { id: 'a', texto: 'Escolher a biblioteca de datas.', correta: false, porque: 'bibliotecas intercambiáveis são baratas de reverter.' },
            { id: 'b', texto: 'Renomear uma variável.', correta: false, porque: 'detalhe local.' },
            { id: 'c', texto: 'Decidir o modelo de multi-tenancy do banco.', correta: true, porque: 'reverter custaria mais de uma semana e migração de dados.' },
            { id: 'd', texto: 'A ordem dos parâmetros de uma função privada.', correta: false, porque: 'detalhe local.' }
          ], tutorDepois: 'Registrar "por que NÃO fizemos o óbvio" também vale muito.' },
        { tipo: 'escolha', id: 'm04b3-escolha-2', titulo: 'Confira: postmortem útil',
          pergunta: 'Um rascunho de postmortem termina com "Causa raiz: erro do engenheiro que rodou a migration" e sem seção de ações. Qual é o problema principal?',
          opcoes: [
            { id: 'a', texto: 'Falta só formatar a linha do tempo.', correta: false, porque: 'o problema é de conteúdo, não de formatação.' },
            { id: 'b', texto: 'A análise parou em "human error" e não há ações com dono e prazo; falta perguntar que mecanismo permitiu a migration travar a tabela.', correta: true, porque: 'blameless pergunta o que no sistema tornou isso possível; sem ações rastreáveis, o postmortem é redação.' },
            { id: 'c', texto: 'O documento devia ficar no sistema de chamados, não no repositório.', correta: false, porque: 'ele deve morar no repositório, junto do código.' },
            { id: 'd', texto: 'Falta nomear também quem aprovou o deploy.', correta: false, porque: 'ampliar a culpa não muda o sistema.' }
          ], tutorDepois: 'Com agentes a pergunta que sobra é: que mecanismo permitiu?' },
        { tipo: 'callout', tom: 'info', titulo: 'Leitura aplicada: ADR com custo e postmortem com dono', html:
          '<p>No laboratório você escreve um ADR sobre decisão já tomada, passa-o pelo contraditório do agente e escreve um postmortem blameless de incidente real, com o verificador acusando ADR sem "porque". O ponto central: se a seção de consequências não dói, a decisão não foi analisada; e postmortem sem três fatores contribuintes e três ações com prazo é redação.</p>' },
        { tipo: 'takeaway', html: 'Se a seção de consequências <mark>não dói</mark>, a decisão não foi analisada; sem ação com <mark>dono e prazo</mark>, o postmortem é redação.' }
      ] }
    ]
  });
})();
