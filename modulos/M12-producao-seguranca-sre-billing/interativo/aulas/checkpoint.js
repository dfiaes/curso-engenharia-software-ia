/* M12 · Checkpoint: 14 perguntas do bloco 9, sem consulta. Rubrica = "Basta"; modelo = resposta esperada. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm12-checkpoint',
    titulo: 'Checkpoint M12',
    minutos: 60,
    resumo: 'Quatorze perguntas sobre segurança, isolamento, idempotência, economia e operação de um sistema de IA em produção, sem consulta. Responda com as suas palavras e cite o oráculo que prova cada resposta.',
    objetivo: 'Verificar, sem consulta, se você nega por controle determinístico, isola por tenant, trata efeito externo ambíguo, deriva custo do ledger e opera por SLO com um copiloto sem autoridade.',
    revisao: [
      { id: 'm12cp-regex', pergunta: 'Por que prompt injection não se resolve identificando frases suspeitas?',
        opcoes: [
          opc('a', 'Porque o detector não é autorização: a autoridade vem de sessão, schema fechado e policy externa ao conteúdo, com negação determinística e auditoria', true, 'conteúdo hostil muda de forma; o controle precisa negar mesmo quando o detector erra.'),
          opc('b', 'Porque regex é lenta demais', false, 'o problema é de autoridade, não de velocidade.'),
          opc('c', 'Porque o modelo sempre reconhece a injeção', false, 'o modelo não é um controle determinístico.')] },
      { id: 'm12cp-digest', pergunta: 'Por que a aprovação humana deve estar ligada aos argumentos exatos da ação?',
        opcoes: [
          opc('a', 'Para que um valor maior, reenviado depois da aprovação, seja negado: o binding por digest da intenção falha e exige reaprovação', true, 'sem intent digest, "aprovação aceita valor maior".'),
          opc('b', 'Para registrar quem clicou', false, 'o registro não impede a troca de argumentos.'),
          opc('c', 'Porque aprovar qualquer pagamento vale para todos', false, 'a aprovação vale para a ação exata.')] },
      { id: 'm12cp-unknown', pergunta: 'A API externa concluiu o efeito, mas a resposta se perdeu. O que se faz?',
        opcoes: [
          opc('a', 'Marcar o estado como desconhecido, negar o retry cego e reconciliar consultando o provedor e o outbox', true, 'retry cego duplica o efeito; a janela ambígua exige consulta.'),
          opc('b', 'Repetir até passar', false, '"repetir até passar" é o retry cego que duplica pagamento.'),
          opc('c', 'Gravar sucesso por precaução', false, 'ausência de resposta não é sucesso confirmado.')] },
      { id: 'm12cp-ledger', pergunta: 'De onde vem uma margem unitária defensável?',
        opcoes: [
          opc('a', 'Do ledger de uso medido, com custo alocado por rateio declarado e origem rastreável', true, 'sem origem no ledger, o número é ficção.'),
          opc('b', 'De um custo fixo por requisição', false, 'deixa a margem aparentemente constante e sem origem.'),
          opc('c', 'Do dashboard que ficou verde', false, '"dashboard verde" não é oráculo.')] },
      { id: 'm12cp-page', pergunta: 'Quando um alerta deve paginar uma pessoa?',
        opcoes: [
          opc('a', 'Quando a queima normalizada pelo budget é rápida na janela curta e confirmada pela longa, com impacto e ação imediata', true, 'queima lenta ou sem ação vira ticket.'),
          opc('b', 'Sempre que a taxa de erro passa de 1%', false, 'threshold absoluto ignora o SLO.'),
          opc('c', 'Quando o volume de erros é alto', false, 'volume cru dispara para o serviço tolerante e dorme para o exigente.')] }
    ],
    abas: [
      { rotulo: 'Autoridade, isolamento e efeito', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. A rubrica diz o que basta. Em cada resposta, nomeie o <strong>controle determinístico</strong> e o <strong>oráculo</strong> (o teste ou a evidência que prova), não só a intenção. Reprovar é permitido: volte ao bloco indicado e tente de novo. As perguntas 9 e 10 tocam a parte opcional de cobrança; responda a 9 se implementou cobrança.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'Aquecimento: o detector não é autorização',
          pergunta: 'Um README ingerido manda exfiltrar um segredo por uma tool legítima. Qual desenho impede, e por que um detector de frases não basta?',
          opcoes: [
            { id: 'a', texto: 'Um detector de frases suspeitas na entrada barra a injeção.', correta: false, porque: 'conteúdo hostil muda de forma; detector tratado como autorização é a resposta que reprova.' },
            { id: 'b', texto: 'Autoridade vem da sessão, fora do conteúdo: schema fechado por tool, policy externa e auditoria, com negação determinística antes do efeito.', correta: true, porque: 'o controle nega mesmo que o detector erre; a auditoria registra sem conteúdo.' },
            { id: 'c', texto: 'Pedir ao modelo que ignore instruções do README.', correta: false, porque: 'a instrução ao modelo não é um controle determinístico.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Prompt injection e frases suspeitas', obrigatorio: false,
          enunciado: 'Por que prompt injection não é resolvida por identificar frases suspeitas? <em>Bloco 1.</em>',
          placeholder: 'O detector não resolve porque… A autoridade vem de… Negação…',
          rubrica: [
            'A <strong>autoridade fica fora do conteúdo</strong>: o conteúdo hostil nunca cria sessão nem autoridade.',
            '<strong>Schema fechado</strong> por tool, <strong>policy externa</strong> e auditoria, com <strong>negação determinística</strong>.',
            'Detector é um sinal, <strong>não é autorização</strong>: o controle precisa valer mesmo quando ele erra.'
          ],
          modelo: '<p>Frases suspeitas mudam de forma e o detector erra; tratá-lo como autorização entrega a decisão ao conteúdo. O desenho certo tira a autoridade do texto: a sessão aprovada define quais tools existem, cada tool tem schema fechado, uma policy externa decide, e a negação é determinística e auditada sem guardar o conteúdo. O detector pode alertar, mas o controle vale quando ele falha.</p>' + reprova('"um detector bom o suficiente resolve".') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Trust boundaries do Capstone', obrigatorio: false,
          enunciado: 'Onde estão as trust boundaries do seu Capstone e qual tem maior blast radius? <em>Bloco 1.</em>',
          placeholder: 'As boundaries são… A de maior raio de impacto é… porque…',
          rubrica: [
            'Nomeia as <strong>boundaries</strong> pelas quais dado ou autoridade cruza (conteúdo não confiável para o modelo, modelo para tool, tool para efeito externo, aplicação para banco, telemetria).',
            'Justifica a de <strong>maior blast radius</strong> pelo que um erro alcança, não por palpite.',
            'Cada boundary tem <strong>controle, teste executável, responsável e risco residual</strong>.'
          ],
          modelo: '<p>As boundaries do Capstone são: conteúdo não confiável entrando no contexto do modelo; a decisão do modelo chegando à tool; a tool produzindo efeito externo; a aplicação falando com o banco e os data planes; e o dado saindo para telemetria. A de maior blast radius é a que combina autoridade e efeito irreversível, como a tool de pagamento, porque um erro ali alcança dinheiro de outros tenants. Para cada uma, registro o controle, o teste que tenta violá-la, o responsável e o risco residual.</p>' + reprova('"mais itens no catálogo" ou boundary sem teste.') },

        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Cinco conceitos que colapsam', obrigatorio: false,
          enunciado: 'Qual a diferença entre autenticação, autorização, entitlement, quota e aprovação? <em>Blocos 3, 6 e 7.</em>',
          placeholder: 'Autenticação… Autorização… Entitlement… Quota… Aprovação…',
          rubrica: [
            '<strong>Autenticação</strong> estabelece quem chama; <strong>autorização</strong> decide se esta ação é permitida pela policy.',
            '<strong>Entitlement</strong> é se a assinatura habilita a capacidade (evolui por versão).',
            '<strong>Quota</strong> limita o quanto, por tenant e janela; <strong>aprovação</strong> é decisão humana ligada à ação exata.',
            'Mostra que <strong>nenhuma substitui as outras</strong>.'
          ],
          modelo: '<p>Autenticação diz quem está chamando. Autorização diz se aquela ação, com aqueles argumentos, é permitida pela policy. Entitlement diz se o plano do tenant habilita a capacidade, e evolui por versão. Quota diz quanto o tenant pode consumir numa janela. Aprovação é a decisão humana, ligada à ação exata, para efeitos críticos. Um token válido (autenticação) não prova que o plano habilita a ação, nem que há quota, nem que um humano aprovou.</p>' + reprova('tratar um token válido como autorização total.') },

        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Aprovação ligada aos argumentos', obrigatorio: false,
          enunciado: 'Por que uma aprovação deve estar ligada aos argumentos exatos da ação? <em>Bloco 3.</em>',
          placeholder: 'Sem o vínculo… Com o intent digest… O uso é…',
          rubrica: [
            'Sem vínculo, a aprovação <strong>aceita valor maior</strong> ou argumento trocado.',
            'Binding por <strong>digest da intenção</strong>: divergência nega e exige reaprovação.',
            'Aprovação de <strong>uso único</strong>; negação <strong>antes do efeito</strong>.'
          ],
          modelo: '<p>Se a aprovação vale "para a ação", um agente pode reenviar o mesmo pedido com um valor maior e ser aceito. Ligando a aprovação ao digest canônico dos argumentos, qualquer divergência nega antes do efeito e exige reaprovação. Além disso, a aprovação é de uso único, para que não seja reutilizada.</p>' + reprova('"o humano aprovou, então pode executar".') },

        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Dono da tabela e BYPASSRLS', obrigatorio: false,
          enunciado: 'Como owner da tabela e <code>BYPASSRLS</code> invalidam a promessa de isolamento? <em>Bloco 4.</em>',
          placeholder: 'A role privilegiada… A correção é… A prova é…',
          rubrica: [
            'Uma <strong>role privilegiada</strong> (dona da tabela ou com <code>BYPASSRLS</code>) ignora a policy de RLS.',
            'Correção: <strong>role de aplicação separada</strong> com RLS <strong>forçado</strong>.',
            'Prova: <strong>catálogos de roles e tabelas</strong> e teste que nega mesmo quando a aplicação erra, no banco real.'
          ],
          modelo: '<p>A RLS só filtra quem está sujeito a ela. O dono da tabela e uma role com <code>BYPASSRLS</code> passam por cima da policy, então a promessa de isolamento é vazia se a aplicação conecta com uma delas. A correção é uma role de aplicação separada, com RLS forçado. A prova é inspecionar os catálogos de roles e tabelas e rodar a suíte cross-tenant no banco real, que nega mesmo com a aplicação errando.</p>' + reprova('"a aplicação sempre filtra por tenant".') },

        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · O pool não carrega o tenant anterior', obrigatorio: false,
          enunciado: 'Como provar que a reutilização do pool não carrega o tenant anterior? <em>Bloco 4.</em>',
          placeholder: 'O teste é… O contexto fica… O resultado esperado é…',
          rubrica: [
            'Teste <strong>A para B na mesma conexão</strong>: a conexão atende A e depois B, e B não enxerga linhas de A.',
            'O contexto do tenant é <strong>local à transação</strong>, não da sessão do pool.',
            'Inclui o <strong>rollback</strong> e um teste negativo por data plane.'
          ],
          modelo: '<p>Forço a mesma conexão a atender o tenant A e em seguida o B, e verifico que B não enxerga nenhuma linha de A, inclusive depois de um rollback. Isso só se garante com o contexto do tenant definido localmente na transação, nunca na sessão que o pool reaproveita. Repito um teste negativo equivalente em cada data plane.</p>' + reprova('culpar o filtro da consulta.') }
      ] },

      { rotulo: 'Efeito, economia e operação', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p7', titulo: 'Aquecimento: a resposta se perdeu',
          pergunta: 'A API externa concluiu o efeito, mas a resposta se perdeu por timeout. O que o desenho faz?',
          opcoes: [
            { id: 'a', texto: 'Repete a chamada até receber resposta.', correta: false, porque: 'retry cego duplica o efeito.' },
            { id: 'b', texto: 'Mantém o estado desconhecido, nega o retry imediato e reconcilia consultando o provedor, sem novo efeito.', correta: true, porque: 'a janela é ambígua; só a consulta ao provedor e ao outbox resolve.' },
            { id: 'c', texto: 'Grava sucesso, porque o efeito provavelmente ocorreu.', correta: false, porque: 'provável não é confirmado.' }
          ] },
        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · O efeito concluiu e a resposta sumiu', obrigatorio: false,
          enunciado: 'O que fazer quando uma API externa conclui o efeito, mas a resposta se perde? <em>Bloco 5.</em>',
          placeholder: 'O estado fica… O retry… A reconciliação…',
          rubrica: [
            'O registro fica em estado <strong>desconhecido</strong> (a janela é ambígua).',
            '<strong>Nunca retry cego</strong>: o retry imediato é negado.',
            '<strong>Reconciliar</strong> consultando provedor e outbox, recebendo um recibo, <strong>sem novo efeito</strong>.',
            'Ausência confirmada <strong>não é sucesso</strong>: libera nova tentativa segura.'
          ],
          modelo: '<p>O registro permanece em estado desconhecido, porque a janela entre efeito e resposta é ambígua. O retry imediato é negado: repetir às cegas pode pagar duas vezes. Uma consulta de reconciliação ao provedor e ao outbox traz o recibo, e só então o registro avança, sem novo efeito. Se a consulta confirma que nada chegou ao provedor, o registro é removido e uma nova tentativa segura fica liberada; ausência confirmada não é sucesso.</p>' + reprova('"repetir até passar".') },

        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · Chave de idempotência sem hash da intenção', obrigatorio: false,
          enunciado: 'Por que idempotency key sem hash do intent pode esconder um bug grave? <em>Bloco 5.</em>',
          placeholder: 'A mesma chave com outro valor… O hash da intenção…',
          rubrica: [
            'A mesma chave pode chegar com <strong>argumentos diferentes</strong> e devolver a resposta antiga como se fosse a nova.',
            'O <strong>hash da intenção</strong> faz a divergência <strong>negar sem efeito</strong>.',
            'Para ser confiável, a unicidade é <strong>durável</strong> (não cache local) e vale sob <strong>concorrência</strong>.'
          ],
          modelo: '<p>Sem o hash da intenção, a chave só diz que o pedido já foi visto, não que é o mesmo pedido. Um retry com valor diferente receberia a resposta do pedido antigo, e o bug (valor errado, efeito errado) passaria despercebido. Com o hash, a divergência nega sem efeito. A unicidade precisa ser durável e valer entre instâncias concorrentes; cache local ou chave fraca duplica o pagamento.</p>' + reprova('"a chave resolve sozinha".') },

        { tipo: 'escreva', id: 'cp-p9', titulo: 'P9 · Webhook duplicado e fora de ordem (opcional)', obrigatorio: false,
          enunciado: '(Opcional) Como webhook duplicado e fora de ordem afeta entitlement e faturamento? <em>Bloco 7, leitura opcional.</em>',
          placeholder: 'A assinatura… A projeção converge por… A reconciliação…',
          rubrica: [
            'Assinatura HMAC e janela de replay verificadas <strong>antes de qualquer parse ou mutação</strong>.',
            'Entitlement converge por <strong>version</strong>: duplicata repete sem efeito e evento antigo <strong>não rebaixa</strong> estado novo.',
            'Reconciliação compara o total interno com o do provedor e abre <strong>issue</strong>, não ajuste silencioso.'
          ],
          modelo: '<p>O webhook é entrada não confiável: verifico a assinatura sobre os bytes crus e a janela de replay antes de qualquer parse. A projeção de entitlement converge por versão, então uma duplicata repete sem efeito e um evento antigo não reabre nem rebaixa um estado novo. Para o faturamento, a reconciliação periódica compara o uso interno com o do provedor e, na divergência, abre uma issue com esperado, observado e responsável.</p>' + reprova('"processar na ordem de chegada".') },

        { tipo: 'escreva', id: 'cp-p10', titulo: 'P10 · A unidade econômica', obrigatorio: false,
          enunciado: 'Qual é a unidade econômica do Capstone e quais custos entram nela? <em>Bloco 7.</em>',
          placeholder: 'A unidade é… Custos diretos… Custos alocados… A origem é…',
          rubrica: [
            'Declara a <strong>unidade</strong> (por exemplo, custo por análise válida ou por tarefa).',
            '<strong>Custos diretos</strong> medidos (inferência, embeddings, busca, armazenamento) e <strong>compartilhados por rateio declarado</strong>.',
            'Tudo <strong>derivado do ledger</strong> medido, com origem rastreável.'
          ],
          modelo: '<p>A unidade é o custo por tarefa concluída com sucesso (por exemplo, por análise válida). Entram os custos diretos medidos no ledger: inferência, embeddings, busca vetorial, armazenamento e ferramentas externas. Os custos compartilhados, como observabilidade e filas, entram por rateio declarado. A margem sai de receita medida menos custo direto menos custo alocado, e cada número tem origem rastreável no ledger.</p>' + reprova('"custo fixo por requisição".') },

        { tipo: 'escreva', id: 'cp-p11', titulo: 'P11 · SLI, SLO, SLA e error budget', obrigatorio: false,
          enunciado: 'Qual a diferença entre SLI, SLO, SLA e error budget? <em>Bloco 8.</em>',
          placeholder: 'SLI… SLO… SLA… Error budget… Burn rate…',
          rubrica: [
            '<strong>SLI</strong> mede a experiência; <strong>SLO</strong> é o objetivo interno numa janela explícita.',
            '<strong>SLA</strong> é o compromisso externo com consequências, protegido pelo SLO com margem.',
            '<strong>Error budget</strong> é a fração complementar do SLO; o <strong>burn rate</strong> é erro observado dividido pelo permitido.'
          ],
          modelo: '<p>O SLI é a medida observável da experiência, como a fração de análises válidas. O SLO é o objetivo interno para esse SLI numa janela explícita. O SLA é o compromisso externo, com consequências, e o SLO o protege com margem. O error budget é a fração complementar do SLO, o quanto pode falhar sem violá-lo, e o burn rate é a velocidade de consumo: erro observado dividido pelo erro permitido.</p>' + reprova('usar HTTP 200 ou um KPI de negócio como SLI.') },

        { tipo: 'escreva', id: 'cp-p12', titulo: 'P12 · Page ou ticket', obrigatorio: false,
          enunciado: 'A janela curta queima a 10x e a longa a 0,1x do budget. Pagina ou abre ticket, com que regra, e por quê? <em>Bloco 8.</em>',
          placeholder: 'Decisão… Regra… Por quê…',
          rubrica: [
            '<strong>Não pagina sem a confirmação da janela longa</strong>; <code>should_page</code> exige os dois limiares.',
            'Cita o <strong>burn normalizado</strong> pelo mesmo objetivo.',
            'Queima lenta ou sem ação imediata vira <strong>ticket</strong>; page só com impacto e ação.'
          ],
          modelo: '<p>Não pago nem acordo ninguém ainda: a janela curta a 10x sugere queima rápida, mas a longa a 0,1x não confirma uma degradação sustentada. A regra é multiwindow, com ambas as janelas normalizadas pelo mesmo objetivo e os dois limiares superados. Enquanto a longa não confirma, observo e, se persistir sem ação imediata, abro ticket com runbook; page é só para impacto com ação imediata.</p>' + reprova('"volume alto pagina".') },

        { tipo: 'escreva', id: 'cp-p13', titulo: 'P13 · Ler logs não é executar', obrigatorio: false,
          enunciado: 'Por que permitir que um copiloto leia logs não autoriza executar ações? Um log com instrução de exclusão e endereço sensível chega ao copiloto: o que o resumo contém, o que nunca contém e quantas ações executam? <em>Bloco 8.</em>',
          placeholder: 'O resumo contém… Nunca contém… Ações executadas…',
          rubrica: [
            'Log é <strong>dado não confiável</strong>: não altera autoridade nem dispara tool.',
            'Resumo com evidência <strong>redigida</strong>, prefixo <code>Untrusted operational evidence; no action executed</code>, e <strong>zero ações</strong>.',
            'Copiloto <strong>somente-leitura</strong>; ação só por workflow aprovado fora do contexto adversarial.'
          ],
          modelo: '<p>Ler é uma capacidade e executar é outra, com autoridade diferente. O log é dado não confiável: uma instrução nele é evidência, nunca comando. O resumo começa com <code>Untrusted operational evidence; no action executed</code>, preserva o texto operacional, redige o endereço sensível e executa zero ações. O copiloto é somente-leitura; qualquer ação de produção passa por identidade, política, aprovação e auditoria, fora do contexto que leu o log.</p>' + reprova('"executa se parecer urgente".') },

        { tipo: 'escreva', id: 'cp-p14', titulo: 'P14 · O que nunca entra num trace', obrigatorio: false,
          enunciado: 'Quais dados nunca devem entrar em traces por padrão, e como a telemetria continua útil? <em>Blocos 8 e 9.</em>',
          placeholder: 'Nunca entram… A telemetria mínima é…',
          rubrica: [
            'Nunca: <strong>prompt, documento, token, código, e-mail ou segredo</strong>.',
            'Telemetria mínima por <strong>allowlist de atributos</strong>, <strong>tenant opaco</strong> e <strong>redação antes do exporter</strong>.',
            'Registrar conteúdo "para depurar" é a falha a evitar.'
          ],
          modelo: '<p>Prompt, documento, token, código, e-mail e segredo não entram em span nenhum por padrão. A telemetria continua útil com uma allowlist de atributos (categorias, contagens, durações, códigos de regra), tenant opaco e redação antes do exporter. "Registrar o conteúdo para depurar depois" é a falha clássica: vira vazamento por observabilidade.</p>' + reprova('"registrar tudo para investigar depois".') }
      ] },

      { rotulo: 'Demonstração e fechamento', blocos: [
        { tipo: 'texto', html:
          '<h3>Demonstração obrigatória</h3>' +
          '<p>As quatorze perguntas valem de 0 a 2 cada; a demonstração exige <strong>evidência executada</strong>, nunca relato. Não há exercício a executar aqui: o roteiro vive no laboratório final e no pacote <code>capstone/evidence/m12/</code>.</p>' +
          '<ul><li>Executar cinco ataques agentic e mostrar controles em camadas.</li>' +
          '<li>Executar a suíte cross-tenant em PostgreSQL real.</li>' +
          '<li>Provocar concorrência e crash no efeito idempotente.</li>' +
          '<li>(Opcional) Processar webhooks inválido, duplicado e fora de ordem.</li>' +
          '<li>Mostrar custo e margem derivados do ledger.</li>' +
          '<li>Provocar burn rate e seguir o runbook.</li>' +
          '<li>Apresentar um risco residual não corrigido e defender a decisão.</li></ul>' },
        { tipo: 'escolha', id: 'cp-esc-final', titulo: 'Fechamento: o que decide o release',
          pergunta: 'Qual afirmação sobre a decisão de release do M12 está certa?',
          opcoes: [
            { id: 'a', texto: 'Zero falha P0/P1; cada P2 aceito com responsável, prazo, compensação e aceite assinado; números da defesa derivados do ledger e dos relatórios.', correta: true, porque: 'é o resultado esperado da suíte final: sem resultado hardcoded.' },
            { id: 'b', texto: 'O release sai se nenhum alerta disparou nos últimos dias.', correta: false, porque: '"nenhum alerta" não é oráculo.' },
            { id: 'c', texto: 'Um P2 pode ser aceito por mensagem, desde que o time concorde.', correta: false, porque: 'sem os quatro campos, o P2 continua bloqueando como P1.' }
          ] },
        { tipo: 'texto', html: '<p class="ta-nota">Valores, prazos e severidades dos exemplos do módulo são variáveis, nunca medição. Preço e comportamento de API de cobrança são informação de alto risco e valem na data consultada; a cobrança do cliente é leitura opcional e não é cobrada nesta avaliação.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>controle determinístico</mark> primeiro e, depois, o <mark>oráculo</mark> que o prova.' }
      ] }
    ]
  });
})();
