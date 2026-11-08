/* M09 · Checkpoint: nove cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada. Fonte: M09.html#checkpoint-m09 (verificado em 14/09/2026). */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm09-checkpoint',
    titulo: 'Checkpoint M09',
    minutos: 50,
    resumo: 'Nove cenários sobre MCP e A2A, sem consulta. Responda com as suas palavras e justifique pelo mecanismo; a P1 é a prova principal e exige o servidor do Capstone rodando.',
    objetivo: 'Verificar, sem consulta, se você defende as decisões de design do seu servidor MCP, explica o modelo sem estado, escolhe o transporte, nomeia os ataques e situa o A2A.',
    revisao: [
      { id: 'm09cp-stdout', pergunta: 'Servidor stdio não conecta, com erro genérico de protocolo. Qual a causa provável e o conserto?',
        opcoes: [
          opc('a', 'Algo escreveu em stdout (print, warning de biblioteca, banner); todo log vai para stderr ou arquivo', true, 'teste na unha com <code>echo \'{...}\' | python servidor.py</code>.'),
          opc('b', 'A porta está ocupada', false, 'em stdio não há porta.'),
          opc('c', 'O token expirou', false, 'não é questão de autenticação.')] },
      { id: 'm09cp-400', pergunta: 'Cliente moderno recusa o servidor com 400. Qual a causa provável?',
        opcoes: [
          opc('a', 'O servidor implementa revisão antiga (espera initialize) ou falta o header MCP-Protocol-Version', true, 'atualize o SDK e confira o corpo do erro (pode ser UnsupportedProtocolVersion) antes de assumir incompatibilidade.'),
          opc('b', 'O cliente não suporta JSON', false, 'não é o motivo.'),
          opc('c', 'Falta um volume no container', false, 'não tem relação com o 400.')] },
      { id: 'm09cp-tenant', pergunta: 'Um usuário viu dado de outro tenant pelo servidor MCP. Qual a causa provável?',
        opcoes: [
          opc('a', 'Confused deputy: escopo veio de argumento, ou o servidor conecta com usuário de banco irrestrito', true, 'conserto: escopo do runtime/token, RLS no banco e verificação de saída.'),
          opc('b', 'Cache do cliente', false, 'o sintoma aponta para escopo, não para cache.'),
          opc('c', 'Tool poisoning', false, 'o sintoma é vazamento entre tenants, não instrução na descrição.')] },
      { id: 'm09cp-container', pergunta: 'O servidor funciona local e falha em container. Qual a causa provável?',
        opcoes: [
          opc('a', 'Volume não montado (não enxerga o código), permissões do usuário não-root ou caminho relativo', true, 'monte o volume read-only e passe o caminho por variável de ambiente.'),
          opc('b', 'O container precisa expor uma porta', false, 'em stdio não há porta.'),
          opc('c', 'O Docker não suporta MCP', false, 'suporta.')] },
      { id: 'm09cp-escolha-errada', pergunta: 'O agente escolhe a ferramenta errada depois de conectar mais um servidor. Qual a causa e o conserto?',
        opcoes: [
          opc('a', 'Catálogo grande demais e sombreamento entre servidores; conectar por tarefa, filtrar ferramentas, namespace, no máximo 8 no total', true, 'o limite de ~8 servidores está na tabela de diagnóstico do módulo.'),
          opc('b', 'O servidor novo é lento', false, 'o sintoma é de seleção, não de latência.'),
          opc('c', 'Falta aumentar o contexto', false, 'a degradação é de seleção de ferramenta.')] },
      { id: 'm09cp-restate', pergunta: 'A retomada de MRTR falha ou é rejeitada. O que isso indica?',
        opcoes: [
          opc('a', 'requestState expirado, adulterado ou apresentado por outro principal: é o comportamento correto; verifique TTL, integridade (HMAC/AEAD) e o vínculo ao principal e à requisição', true, 'o requestState volta pelas mãos do cliente, então replay é a ameaça padrão.'),
          opc('b', 'Bug do cliente que deve ser contornado', false, 'é a defesa funcionando.'),
          opc('c', 'O transporte precisa de sessão', false, 'a revisão atual é sem sessão.')] }
    ],
    abas: [
      { rotulo: 'P1 a P5: design, modelo e estado', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que basta. Reprovar é permitido: volte ao bloco indicado e tente de novo. <strong>A P1 é a prova principal</strong>: demonstrar o seu MCP rodando dentro do cliente e defender cada decisão de design.</p>' },

        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Demonstre e defenda o servidor', obrigatorio: false,
          enunciado: 'Demonstre o servidor do Capstone rodando dentro do Claude Code (ou outro cliente) e justifique: por que essas ferramentas e não outras, por que essa granularidade, por que cada coisa é tool, resource ou prompt, e qual o custo de contexto do seu servidor. <em>Blocos 2 a 5.</em>',
          placeholder: 'Ferramentas escolhidas… Granularidade… Tool, resource, prompt… Custo de contexto…',
          rubrica: [
            'O servidor aparece <strong>rodando no cliente</strong>, descoberto pelos dois clientes.',
            'Cada ferramenta justificada, com a <strong>granularidade</strong> defendida.',
            'Critério das primitivas: <strong>tool</strong> do modelo, <strong>resource</strong> do usuário (por URI), <strong>prompt</strong> do usuário.',
            'O <strong>custo de contexto</strong> medido e publicado no README.'
          ],
          modelo: '<p>O servidor roda no cliente e é descoberto pelos dois clientes. As ferramentas são as poucas que o modelo precisa decidir chamar, com granularidade que evita muitas chamadas pequenas e catálogo grande. O que o modelo decide chamar é tool; o que o usuário anexa por URI é resource; o que o usuário dispara, como um fluxo de análise, é prompt. O custo de contexto foi medido (tokens das definições a cada chamada) e está no README.</p>' + reprova('"todas as funções viraram tool" ou nenhum número de custo de contexto.') },

        { tipo: 'escolha', id: 'cp-esc-p2', titulo: 'P2 · Aquecimento: o que o MCP resolve',
          pergunta: 'Sem protocolo, N aplicações e M sistemas exigem quantas integrações, e o que o MCP é para os agentes?',
          opcoes: [
            { id: 'a', texto: 'N×M integrações; com protocolo, N+M. MCP é o "LSP dos agentes".', correta: true, porque: 'e tool calling continua existindo por baixo: MCP padroniza de onde vêm as ferramentas.' },
            { id: 'b', texto: 'N+M integrações; o MCP substitui o tool calling.', correta: false, porque: 'tool calling é capacidade do modelo; o MCP não o substitui.' },
            { id: 'c', texto: 'N×M com ou sem protocolo.', correta: false, porque: 'o ponto do protocolo é reduzir o produto à soma.' }
          ] },
        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · O problema N×M', obrigatorio: false,
          enunciado: 'Explique o problema N×M e por que MCP não substitui tool calling. Qual é o paralelo com o LSP? <em>Bloco 1.</em>',
          placeholder: 'Sem protocolo… Com protocolo… Tool calling é… O LSP…',
          rubrica: [
            'Sem protocolo, <strong>N×M</strong> integrações; com protocolo, <strong>N+M</strong>.',
            'Tool calling é <strong>capacidade do modelo</strong> (JSON conforme schema); MCP padroniza <strong>de onde vêm</strong> as ferramentas; por baixo ainda há tool calling.',
            'Paralelo: o MCP é o <strong>LSP dos agentes</strong>.'
          ],
          modelo: '<p>Sem protocolo, cada aplicação integra com cada sistema: N×M. Com um protocolo comum, cada um implementa uma vez: N+M. Tool calling é a capacidade do modelo de emitir JSON conforme um schema; o MCP não a substitui, só padroniza de onde as ferramentas vêm, e por baixo ainda há tool calling. É o papel que o LSP cumpriu para editores e linguagens: o MCP é o LSP dos agentes.</p>' + reprova('"MCP substitui o tool calling".') },

        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · As três primitivas', obrigatorio: false,
          enunciado: 'Qual o critério que decide entre as três primitivas? Dê um exemplo do seu produto para cada e diga o que se perde ao transformar tudo em tool. <em>Bloco 2.</em>',
          placeholder: 'O critério é quem controla… Tool: … Resource: … Prompt: …',
          rubrica: [
            'O critério é <strong>quem controla</strong>: modelo (tool), aplicação/usuário anexando por URI (resource), usuário disparando (prompt, que vira slash command).',
            'Um exemplo do produto para <strong>cada</strong> primitiva.',
            'Perda ao transformar tudo em tool: o <strong>controle sai do usuário</strong> e o catálogo e o custo de contexto crescem.'
          ],
          modelo: '<p>O critério é quem controla. Tool é do modelo (por exemplo, buscar chamadores de uma função); resource é anexado pela aplicação ou pelo usuário por URI (um relatório de dependências); prompt é disparado pelo usuário e vira slash command (o método de análise de legado). Se tudo vira tool, o modelo passa a decidir o que o usuário deveria controlar, e o catálogo e o custo de contexto crescem.</p>' + reprova('critério por "tipo de dado" em vez de quem controla.') },

        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · A revisão sem estado', obrigatorio: false,
          enunciado: 'A revisão vigente (2026-07-28, conforme o módulo) eliminou o <code>initialize</code>, as sessões e as requisições iniciadas pelo servidor. Explique o porquê arquitetural de cada mudança e o que o MRTR resolve. <em>Blocos 2 e 3.</em>',
          placeholder: 'Sem initialize… Sem sessão… Servidor não inicia… MRTR…',
          rubrica: [
            'Sem <code>initialize</code> e sem sessão: a negociação ocorre <strong>por requisição</strong> (via <code>_meta</code>), então o servidor não guarda estado de conexão.',
            'O servidor <strong>não inicia requisições</strong>; quando precisa de entrada, usa o MRTR.',
            'MRTR: o servidor responde <code>InputRequiredResult</code> (com <code>requestState</code>) e a requisição termina; o cliente <strong>refaz a chamada</strong> com <code>inputResponses</code> + <code>requestState</code>.'
          ],
          modelo: '<p>A negociação passou a ser por requisição, via <code>_meta</code>, então não há <code>initialize</code> nem sessão para o servidor manter, o que torna cada chamada independente. O servidor também não inicia requisições ao cliente. Quando precisa de entrada do usuário, responde com <code>InputRequiredResult</code> e um <code>requestState</code>, e a requisição termina; o cliente refaz a chamada com <code>inputResponses</code> e o <code>requestState</code>, sem conexão aberta esperando.</p>' + reprova('descrever o MRTR como o servidor chamando o cliente.') },

        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · requestState', obrigatorio: false,
          enunciado: 'Para que serve o <code>requestState</code>, por que precisa ser assinado e quais três coisas devem estar dentro dele (ou vinculadas a ele) contra replay? <em>Bloco 3.</em>',
          placeholder: 'Serve para… Assinado porque… Contra replay: …',
          rubrica: [
            'Carrega o <strong>estado da requisição pausada</strong> de volta pelo cliente.',
            'Volta pelas mãos do cliente, então é <strong>entrada de atacante</strong>: assinar com <strong>HMAC ou AEAD</strong>.',
            'Contra replay: <strong>TTL curto</strong>, vínculo ao <strong>principal</strong> e vínculo à <strong>requisição</strong>.'
          ],
          modelo: '<p>O <code>requestState</code> guarda o necessário para retomar a requisição pausada e volta pelas mãos do cliente; por isso é entrada de atacante e precisa de assinatura (HMAC ou AEAD). Contra replay: TTL curto, vínculo ao principal que o apresenta e vínculo à requisição específica. Um state expirado, adulterado ou apresentado por outro principal deve ser rejeitado, e isso é o comportamento correto.</p>' + reprova('"é só um id de sessão" ou state sem assinatura.') },

        { tipo: 'takeaway', html: 'Responda pelo <mark>mecanismo</mark>: quem controla, o que o servidor <mark>não guarda</mark> e o que volta pelas mãos do <mark>cliente</mark>.' }
      ] },

      { rotulo: 'P6 a P9: transporte, segurança e A2A', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p6', titulo: 'P6 · Aquecimento: transporte é casca',
          pergunta: 'Ao trocar de stdio para Streamable HTTP, o que muda no núcleo do servidor?',
          opcoes: [
            { id: 'a', texto: 'Nada: o mesmo núcleo serve os transportes; muda a casca (autenticação, Origin e bind no HTTP).', correta: true, porque: '"Transporte é casca": teste em stdio, publique em HTTP.' },
            { id: 'b', texto: 'As ferramentas precisam ser reescritas.', correta: false, porque: 'o núcleo não muda.' },
            { id: 'c', texto: 'O servidor passa a guardar sessão.', correta: false, porque: 'a revisão atual é sem sessão.' }
          ] },
        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · stdio × Streamable HTTP', obrigatorio: false,
          enunciado: 'Dê o critério de escolha entre stdio e Streamable HTTP e explique por que o seu produto precisa dos dois. O que muda no núcleo ao trocar de transporte? <em>Bloco 3 e bloco 5.</em>',
          placeholder: 'stdio quando… HTTP quando… O produto precisa dos dois porque… No núcleo…',
          rubrica: [
            'Critério: <strong>local</strong> (cliente inicia o processo, herda o usuário) × <strong>remoto</strong> (serviço, URL e token).',
            'O produto vende os <strong>dois modos</strong>: local com o índice na máquina do cliente (stdio) e serviço HTTP (SaaS).',
            'No núcleo <strong>nada muda</strong>; HTTP exige autenticação, validar <code>Origin</code> e não expor em <code>0.0.0.0</code>.'
          ],
          modelo: '<p>stdio quando o cliente inicia o servidor localmente e ele herda o usuário; HTTP quando é um serviço remoto, que exige URL, token e autenticação. O produto precisa dos dois: modo local, em que o índice fica na máquina do cliente, e modo SaaS. O núcleo é o mesmo; muda a casca. No HTTP é preciso autenticar, validar <code>Origin</code> (403 se inválido) e ligar em 127.0.0.1 quando local, nunca em <code>0.0.0.0</code>.</p>' + reprova('"HTTP é o mais novo, então vale para tudo".') },

        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Os ataques', obrigatorio: false,
          enunciado: 'Cite quatro dos seis ataques do bloco 7 e a mitigação de cada um. Qual deles o seu servidor barrou por design e por quê? <em>Bloco 7.</em>',
          placeholder: 'Tool poisoning… Rug pull… Confused deputy… Injeção indireta… O meu servidor barrou…',
          rubrica: [
            'Quatro ataques corretos entre: <strong>tool poisoning, rug pull, confused deputy, injeção indireta, sombreamento, exfiltração</strong>.',
            'Cada um com mitigação coerente (descrição completa e sandbox; pin e hash; escopo do runtime e RLS; delimitar dado e medir).',
            'O <strong>confused deputy</strong> barrado por design: o escopo vem do runtime/token, nunca de argumento.'
          ],
          modelo: '<p>Tool poisoning: ler a descrição completa antes de instalar, sandbox sem segredos e consentimento com a descrição integral. Rug pull: pin de versão, hash das definições, alerta e reaprovação. Confused deputy: escopo derivado da identidade autenticada, nunca de argumento, com RLS como segunda camada. Injeção indireta: delimitar o dado como não confiável, instruir o modelo a não obedecê-lo e medir. O meu servidor barrou o confused deputy por design, porque o escopo vem do runtime e um tenant_id vindo do modelo é ignorado.</p>' + reprova('citar a mitigação de um ataque no lugar de outro.') },

        { tipo: 'escolha', id: 'cp-esc-p8', titulo: 'P8 · Aquecimento: as annotations',
          pergunta: '"As annotations dizem que a ferramenta é read-only, então é seguro." Qual a correção?',
          opcoes: [
            { id: 'a', texto: 'Annotations vêm do servidor e podem mentir; tratá-las como não confiáveis, salvo de servidor confiável.', correta: true, porque: 'o protocolo não impõe os princípios; a implementação impõe.' },
            { id: 'b', texto: 'Está certa: é garantia do protocolo.', correta: false, porque: 'não é garantia.' },
            { id: 'c', texto: 'Está certa para servidores locais.', correta: false, porque: 'o servidor local também é código de terceiro com as permissões do usuário.' }
          ] },
        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · Quem impõe a segurança', obrigatorio: false,
          enunciado: 'Corrija a frase "as annotations dizem que a ferramenta é read-only, então é seguro" e explique de quem é a responsabilidade de cada princípio de segurança da especificação. <em>Bloco 7.</em>',
          placeholder: 'A frase está errada porque… Consentimento: … Privacidade: … Segurança de ferramentas: …',
          rubrica: [
            'Annotations e descrições vêm do <strong>servidor</strong>, que pode mentir: <strong>não confiáveis</strong>, salvo de servidor confiável.',
            'Consentimento e controle: <strong>host</strong> (UI de autorização), com o servidor dando informação honesta.',
            'Privacidade de dados: <strong>host</strong>, e o servidor no que armazena e loga.',
            'Segurança de ferramentas: <strong>host + você</strong>, ao escolher em quem confiar.',
            'Reconhece que o protocolo <strong>não impõe</strong> os princípios: a implementação impõe.'
          ],
          modelo: '<p>A frase confia em algo que o servidor escreve, e o servidor pode mentir: annotations e descrições são não confiáveis, salvo de servidor confiável. O consentimento e controle do usuário é do host (a UI de autorização), com o servidor fornecendo informação honesta. A privacidade de dados é do host e, no que armazena e loga, do servidor. A segurança de ferramentas é do host e de quem escolhe em quem confiar. O protocolo não consegue impor nada disso; a implementação impõe, em camadas.</p>' + reprova('"annotation read-only é garantia".') },

        { tipo: 'escreva', id: 'cp-p9', titulo: 'P9 · MCP × A2A', obrigatorio: false,
          enunciado: 'Qual a diferença de natureza entre MCP e A2A? Em que situação o A2A passaria a fazer sentido para o Capstone, e por que ele não o implementa agora? <em>Bloco 6.</em>',
          placeholder: 'MCP conecta… A2A conecta… O gatilho é… Não agora porque…',
          rubrica: [
            'MCP: agente ↔ <strong>ferramenta/dado</strong> (chamada curta, sem estado); A2A: agente ↔ <strong>agente</strong> (Task com ciclo de vida, opacidade deliberada, <code>INPUT_REQUIRED</code>).',
            'Gatilho: o <strong>primeiro cliente pedir integração</strong> com o orquestrador dele (fronteira organizacional).',
            'Não agora: seria <strong>construir a ponte antes de existir o outro lado</strong>; adoção incerta, verificar versão vigente.'
          ],
          modelo: '<p>MCP liga um agente a ferramentas e dados, com chamadas curtas e sem estado; A2A liga um agente a outro agente, com Task de ciclo de vida, opacidade deliberada e estados como INPUT_REQUIRED e REJECTED. O A2A passaria a fazer sentido quando o primeiro cliente pedir integração com o orquestrador dele, isto é, quando houver fronteira organizacional. Agora seria construir a ponte antes de existir o outro lado, e a adoção ainda é incerta, então a versão vigente deve ser verificada antes de decidir.</p>' + reprova('"A2A substitui o MCP" ou implementar por antecipação.') },

        { tipo: 'texto', html:
          '<h3>Entregáveis verificados (mostrar rodando)</h3>' +
          '<ul><li>Verificações verdes: <code>ruff</code>, <code>format</code>, <code>mypy --strict</code> e <code>pytest</code> do lab.</li>' +
          '<li>Servidor com tools, resources e prompts, escopo do runtime e erros acionáveis; discovery pelos dois clientes.</li>' +
          '<li>Mesmo núcleo nos três transportes; timeout, replay rejeitado e retomada MRTR demonstrados.</li>' +
          '<li>Negações de segurança (escopo, capability, versão e <code>Origin</code>), cada uma com oráculo.</li>' +
          '<li>Opcional: agente A2A com card sem interior, ciclo até COMPLETED, REJECTED e cancelamento.</li></ul>' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes (MCP specification, JSON-RPC 2.0, A2A specification, OAuth 2.1 draft) verificadas em 14/09/2026. Revisão de protocolo e comportamento de produto são informação de alto risco: revalidar em até 90 dias e conferir a revisão vigente antes de implementar. O lab implementa um subconjunto documentado.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>mecanismo</mark> primeiro e a <mark>mitigação</mark> concreta depois.' }
      ] }
    ]
  });
})();
