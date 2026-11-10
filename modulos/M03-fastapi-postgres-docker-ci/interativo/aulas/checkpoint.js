/* M03 · Checkpoint: oito cenários, avaliação sem consulta. Fonte: M03.html#checkpoint-m03. Rubrica = "Basta"; modelo = resposta esperada + "Reprova". */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm03-checkpoint',
    titulo: 'Checkpoint M03',
    minutos: 50,
    resumo: 'Oito cenários sobre API, banco, camadas, embalagem, integração e release, sem consulta. Responda com as suas palavras, justificando pelo mecanismo.',
    objetivo: 'Verificar, sem consulta, se você sustenta o contrato HTTP, a sessão e a migration, o plano e o JSONB, a concorrência, as fronteiras, a embalagem, a integração e o release do encurtador.',
    revisao: [
      { id: 'm03cp-constraint', pergunta: 'O que fecha a corrida de slug duplicado, e como a API responde?',
        opcoes: [
          opc('a', 'A constraint UNIQUE, verificada dentro da escrita; o <code>IntegrityError</code> é traduzido em 409', true, 'um <code>if exists</code> prévio tem janela entre checar e inserir.'),
          opc('b', 'Um SELECT antes do INSERT', false, 'duas transações em READ COMMITTED passam pela checagem.'),
          opc('c', 'Um lock global no Python', false, 'não vale entre processos nem entre workers.')] },
      { id: 'm03cp-transacao', pergunta: 'Qual regra evita esgotar o pool quando a rota chama um modelo lento?',
        opcoes: [
          opc('a', 'Transação curta: chamar o modelo fora da transação e transacionar só a gravação', true, 'transacione o banco, nunca o workflow.'),
          opc('b', 'Aumentar sempre o <code>max_connections</code>', false, 'só adia a falha.'),
          opc('c', 'Compartilhar uma sessão global', false, 'corrompe a unidade de trabalho.')] },
      { id: 'm03cp-plano', pergunta: 'O que se lê no plano como prova de que o índice resolve o predicado crítico?',
        opcoes: [
          opc('a', 'O nó certo (Index Scan) sobre o índice certo, não o cronômetro', true, 'o tempo absoluto varia por máquina, volume e estatística.'),
          opc('b', 'Um tempo menor que o anterior na sua máquina', false, 'cronômetro não é prova.'),
          opc('c', 'Um custo estimado qualquer', false, 'custo é unidade abstrata.')] },
      { id: 'm03cp-camadas', pergunta: 'O que impede uma regra de arquitetura de decair como convenção oral?',
        opcoes: [
          opc('a', 'Um teste com exit code que varre a AST dos imports, com controle negativo próprio', true, 'o mutante sintético prova que o verificador realmente acusa.'),
          opc('b', 'Uma reunião mensal', false, 'convenção oral decai.'),
          opc('c', 'Um comentário no topo do arquivo', false, 'comentário não quebra o build.')] },
      { id: 'm03cp-release', pergunta: 'Qual é a ordem segura de um release e a condição para existir?',
        opcoes: [
          opc('a', 'Gates, imagem por SHA, migration, promoção e verificação; com as três perguntas respondidas (como sei que quebrou, como volto, o banco volta?)', true, 'sem as três respostas, não é release: é aposta.'),
          opc('b', 'Promover primeiro e migrar depois', false, 'código novo sobre schema velho.'),
          opc('c', 'Rebuildar a imagem em cada ambiente', false, 'a mesma imagem vale em todo ambiente; muda a configuração.')] }
    ],
    abas: [
      { rotulo: 'Contrato, sessão e plano', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta cobre uma família de cenários; a rubrica diz o que <strong>basta</strong> e o modelo mostra o que <strong>reprova</strong>. Na avaliação completa, a demonstração com a referência do laboratório executa junto (veja os entregáveis na última aba). Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: o header hostil',
          pergunta: 'Um cliente envia <code>x-request-id</code> com um valor que não é UUID e traz uma quebra de linha. O que o middleware do bloco 1 faz?',
          opcoes: [
            { id: 'a', texto: 'Gera um UUID novo e devolve esse no header da resposta; o valor do cliente não chega ao log.', correta: true, porque: 'só um UUID válido é preservado; confiar em qualquer header deixaria o cliente escrever conteúdo arbitrário no log.' },
            { id: 'b', texto: 'Repassa o valor ao log para o rastreio ficar fiel.', correta: false, porque: 'é entrada não confiável.' },
            { id: 'c', texto: 'Responde 400 e recusa a requisição.', correta: false, porque: 'o id é metadado de correlação, não parte do contrato de negócio; a política do exemplo é gerar outro.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Contrato HTTP', obrigatorio: false,
          enunciado: 'Mostre, pela API, a criação, o inválido, o inexistente e o correlation id. Diga o status e o corpo de cada situação. <em>Bloco 1.</em>',
          placeholder: 'Criação: … Inválido: … Inexistente: … Colisão: … Correlation id: …',
          rubrica: [
            'Status e corpo <strong>deliberados por situação</strong>: <code>201</code> na criação, <code>422</code> para schema inválido, <code>404</code> para slug inexistente, <code>409</code> para colisão.',
            '<strong>Não vaza entidade</strong>: o <code>response_model</code> entrega só o contrato de saída.',
            'Erros num <strong>formato só</strong>, documentado (Problem Details, RFC 9457, se adotado explicitamente).',
            '<strong>Correlation id</strong>: preserva um UUID válido, gera outro nos demais casos e o devolve no header, sem alterar semântica.'
          ],
          modelo: '<p>Criação devolve 201 com slug e url, só o contrato de saída. JSON bem-formado que viola o schema devolve 422 com corpo estruturado antes de a rota rodar. Slug inexistente devolve 404 com um erro no mesmo formato dos demais. Slug repetido devolve 409, vindo da constraint do banco (bloco 2). O middleware preserva o <code>x-request-id</code> se for UUID válido e gera outro se não for, e o devolve no header; a mesma entrada do cliente nunca chega crua ao log.</p>' + reprova('erro inconsistente entre endpoints, entidade do banco exposta, ou header que altera semântica.') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Sessão e migration', obrigatorio: false,
          enunciado: 'O service levanta uma exceção no meio de um request. Descreva o ciclo da sessão e mostre como a revision sobe e desce. <em>Bloco 2.</em>',
          placeholder: 'A sessão é aberta… Se o service levanta… O upgrade… O downgrade…',
          rubrica: [
            '<strong>Uma sessão por request</strong>, aberta pela dependência com <code>yield</code>; engine e pool do processo; nunca compartilhada entre tarefas.',
            '<strong>Rollback na borda</strong>: commit no sucesso, rollback no erro, e a rota nunca chama commit.',
            'Migration com <strong>upgrade e downgrade</strong> testados; destrutiva em duas releases; autogenerate é rascunho revisado.',
            'Schema <strong>só de migration</strong>, nunca <code>create_all</code> no startup.'
          ],
          modelo: '<p>A dependência abre uma <code>AsyncSession</code> por request sobre o pool do engine. Se o service levanta exceção, o <code>except</code> da dependência faz rollback e a exceção continua subindo; no sucesso, faz commit. A rota só declara a intenção. A revision tem <code>upgrade</code> e <code>downgrade</code>: subo com <code>alembic upgrade head</code>, desço e subo de novo para provar a volta; uma remoção de coluna com dados fica em duas releases. O schema nasce sempre de migration.</p>' + reprova('<code>create_all</code> no startup ou sessão compartilhada entre tarefas.') },

        { tipo: 'escolha', id: 'cp-esc-p3', titulo: 'P3 · Aquecimento: o índice que não serve',
          pergunta: 'Existe um B-tree em <code>email</code>, mas a consulta usa <code>WHERE lower(email) = $1</code> e o plano mostra Seq Scan numa tabela grande. Qual é a leitura?',
          opcoes: [
            { id: 'a', texto: 'O predicado usa uma expressão; falta um índice de expressão (<code>ON lower(email)</code>), que indexa exatamente o que se consulta.', correta: true, porque: 'índice de expressão indexa só o que se consulta e se mantém pequeno.' },
            { id: 'b', texto: 'Estatística velha: rodar <code>ANALYZE</code> resolve sozinho.', correta: false, porque: 'a divergência de estimativa é outro sintoma; aqui o índice não corresponde ao predicado.' },
            { id: 'c', texto: 'Trocar o B-tree por GIN.', correta: false, porque: 'GIN é para o conteúdo dentro da coluna (arrays, texto integral, JSONB).' }
          ] },
        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Plano e JSONB', obrigatorio: false,
          enunciado: 'Dado um plano, identifique o nó problemático e diga se o conserto é índice ou estatística. Depois, justifique coluna relacional contra documento pelos dois custos de errar. <em>Bloco 3.</em>',
          placeholder: 'O nó problemático é… Estimativa contra realidade… Coluna quando… JSONB quando…',
          rubrica: [
            'Nó alarmante: <code>Seq Scan</code> (com <code>Sort</code>) em tabela grande leva a <strong>índice no predicado</strong>; <strong>estimativa muito distante da realidade</strong> leva a <code>ANALYZE</code>.',
            'O <strong>invariante</strong> é o nó certo sobre o índice certo, não o tempo absoluto; consulta nova passa por <code>EXPLAIN</code> antes do deploy.',
            'O que se consulta sempre vira <strong>coluna</strong>; a cauda variável vai em <strong>JSONB</strong> com schema validado no Pydantic e índice <strong>GIN</strong>.',
            'Os <strong>dois custos de errar</strong>: coluna demais é uma migration por semana; JSONB sem schema e sem GIN dá consultas sem plano estável.'
          ],
          modelo: '<p>Seq Scan com Sort numa tabela grande para devolver 20 linhas é o alarme: falta um índice que sirva ao predicado, por exemplo <code>(created_at DESC)</code>, e o ganho se prova no nó Index Scan do plano, não no cronômetro. Se a estimativa é de 1 linha e a realidade é de 80.000, o planejador está com estatística velha: <code>ANALYZE</code> primeiro. Para o formato variável, o que consulto sempre vira coluna; a cauda vai em JSONB, validada no Pydantic e com GIN para a consulta por contenção. Errar para um lado custa uma migration por semana; errar para o outro custa consultas sem plano estável.</p>' + reprova('usar o cronômetro como prova, ou aceitar JSONB sem schema.') },
        { tipo: 'takeaway', html: 'Responda pelo <mark>mecanismo</mark>: status <mark>deliberado</mark>, rollback na <mark>borda</mark> e prova no <mark>nó do plano</mark>.' }
      ] },

      { rotulo: 'Concorrência, camadas e embalagem', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p4', titulo: 'P4 · Aquecimento: ordem de custo',
          pergunta: 'Qual lista ordena as correções do lost update do contador, da mais simples à mais forte?',
          opcoes: [
            { id: 'a', texto: 'Update atômico no banco (<code>hits = hits + 1</code>), <code>SELECT ... FOR UPDATE</code>, coluna de versão.', correta: true, porque: 'o atômico não tem janela; o FOR UPDATE serializa e arrisca deadlock; a versão exige retry.' },
            { id: 'b', texto: 'Ler, somar em Python e gravar; depois repetir mais rápido.', correta: false, porque: 'é o próprio defeito.' },
            { id: 'c', texto: 'Aumentar o pool; depois aumentar os workers.', correta: false, porque: 'mais concorrência sobre a mesma linha piora.' }
          ] },
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Concorrência', obrigatorio: false,
          enunciado: 'Explique por que só a constraint fecha a corrida de slug, descreva o teste do lost update e as correções em ordem de custo. <em>Blocos 2, 3 e 6.</em>',
          placeholder: 'A janela do if exists… A constraint… O teste concorrente… As correções…',
          rubrica: [
            'O <code>if exists</code> tem <strong>janela</strong> entre o SELECT e o INSERT; a constraint <code>UNIQUE</code> é verificada <strong>dentro da escrita</strong>.',
            'O <code>IntegrityError</code> é traduzido em <strong>409</strong>.',
            'Lost update em READ COMMITTED: duas transações leem o mesmo valor e perdem incrementos <strong>sem erro algum</strong>; o teste usa <strong>sessões próprias</strong> e exige o <strong>total exato N</strong>.',
            'Correções em ordem de custo: <strong>update atômico</strong>, <strong>FOR UPDATE</strong> (espera, deadlock se a ordem de travas variar), <strong>coluna de versão</strong> (retry, baixa contenção).'
          ],
          modelo: '<p>Com um <code>if exists</code>, dois requests passam pela checagem antes de qualquer escrita; a constraint UNIQUE é verificada dentro da escrita, e a rota traduz o <code>IntegrityError</code> em 409. O contador sob READ COMMITTED perde incrementos sem nenhum erro quando duas transações leem o mesmo valor. O teste dispara N incrementos concorrentes, cada um com sessão própria, e exige o total exatamente N: o ingênuo falha, o atômico fecha. Do mais simples ao mais forte: <code>UPDATE hits = hits + 1</code>, <code>SELECT ... FOR UPDATE</code> e coluna de versão com retry.</p>' + reprova('<code>if exists</code> como proteção.') },

        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Fronteiras e override', obrigatorio: false,
          enunciado: 'Enuncie o que cada camada pode importar, mostre como trocar a infraestrutura sem tocar na regra e apresente a decisão registrada. <em>Bloco 4.</em>',
          placeholder: 'api importa… services… repositories… domain… A troca… O guardrail… O ADR…',
          rubrica: [
            '<code>api</code> importa services, domain e errors (nunca repositories nem models); <code>services</code> importa repositories via <strong>protocolo</strong>, sem FastAPI nem SQLAlchemy; <code>repositories</code> sem regra; <code>domain</code> e <code>errors</code> sem framework; a <strong>composição</strong> é a exceção documentada.',
            '<strong>Override</strong>: o fake com o mesmo protocolo e o <code>dependency_overrides</code> trocam a infraestrutura sem alterar a regra.',
            '<strong>Guardrail</strong> por varredura da árvore sintática, com <strong>controle negativo</strong> (mutante acusado e revertido).',
            '<strong>ADR</strong> com custo e condição de revisão.'
          ],
          modelo: '<p>A seta só aponta para baixo. A <code>api</code> importa services, domain e errors e nunca toca repositories nem models; o service recebe o repositório por protocolo e decide; o repository é query pura; domain e errors não conhecem framework; só a composição liga a sessão ao repositório concreto. Provo a troca de infraestrutura com um fake de mesmo protocolo e com <code>dependency_overrides</code>: mesma regra, duas infraestruturas, mesmos resultados. O guardrail varre a AST e rejeita import proibido, com um trecho violador sintético que ele precisa acusar. A decisão fica no ADR, com custo e condição de revisão.</p>' + reprova('rota importando persistência.') },

        { tipo: 'escolha', id: 'cp-esc-p6', titulo: 'P6 · Aquecimento: segredo e rede',
          pergunta: 'Qual par de erros é o que mais prejudica uma imagem e um Compose?',
          opcoes: [
            { id: 'a', texto: '<code>.env</code> entrando na imagem (sem <code>.dockerignore</code>) e a API apontando para <code>localhost</code> em vez do nome do serviço.', correta: true, porque: 'imagem é arquivável e frequentemente pública, e localhost dentro do container é o próprio container.' },
            { id: 'b', texto: 'Usar multi-stage e rodar como usuário <code>app</code>.', correta: false, porque: 'são boas práticas, não erros.' },
            { id: 'c', texto: 'Tagear a imagem pela SHA e usar healthcheck.', correta: false, porque: 'também são boas práticas.' }
          ] },
        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Embalagem', obrigatorio: false,
          enunciado: 'Explique o Dockerfile linha a linha e o Compose (saúde, rede, volume, limpeza). <em>Bloco 5.</em>',
          placeholder: 'Estágio 1… Estágio 2… O Compose… A rede… O volume… A saúde…',
          rubrica: [
            '<strong>Multi-stage</strong>, <strong>manifests antes do código</strong> (cache por camada, de cima para baixo) e <code>--frozen</code>.',
            '<strong>Não-root</strong> (<code>USER app</code>), <code>PYTHONUNBUFFERED</code> com log em stdout e <code>HEALTHCHECK</code> de aplicação.',
            '<code>.dockerignore</code> mantém o <strong>contexto sem segredo</strong>.',
            'Compose: <strong>serviço é hostname</strong> (<code>@db</code>), <strong>volume nomeado</strong>, <code>depends_on</code> com <code>service_healthy</code> (API após o banco saudável) e limpeza só dos recursos nomeados.'
          ],
          modelo: '<p>O estágio builder instala dependências com <code>uv sync --frozen</code>, copiando os manifests antes do código para que a instalação venha do cache; o runtime leva só o necessário, roda como usuário <code>app</code>, com log sem buffer em stdout e um HEALTHCHECK que consulta o <code>/health</code>. O <code>.dockerignore</code> impede o <code>.env</code> de entrar no contexto. No Compose, a API usa <code>@db:5432</code> porque o serviço é hostname na rede, o dado do Postgres vive no volume nomeado <code>pgdata</code>, e <code>service_healthy</code> faz a API subir só depois do banco saudável. A limpeza atinge apenas os recursos nomeados.</p>' + reprova('segredo na imagem ou <code>localhost</code> como host entre containers.') },
        { tipo: 'takeaway', html: 'A <mark>constraint</mark> fecha a corrida, a <mark>seta</mark> protege as camadas e o <mark>segredo</mark> fica fora da imagem.' }
      ] },

      { rotulo: 'Integração e release', blocos: [
        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Integração', obrigatorio: false,
          enunciado: 'Prove o isolamento (mesmo slug, em qualquer ordem) e descreva a degradação com o banco parado. <em>Blocos 6 e 8.</em>',
          placeholder: 'O isolamento… O determinismo… Com o banco parado…',
          rubrica: [
            '<strong>Rollback do envelope</strong>: cada teste roda em transação desfeita no teardown, sobre PostgreSQL descartável com <strong>schema vindo de migration</strong>.',
            '<strong>Não depende de ordem</strong>: o mesmo slug fixo passa nos dois testes.',
            '<strong>Determinismo</strong>: entradas explícitas, sem relógio nem aleatoriedade no caminho.',
            'Degradação: <strong>503 estruturado</strong> com sinal e cleanup, em vez de travar.'
          ],
          modelo: '<p>Cada teste roda dentro de uma transação-envelope que sofre rollback no teardown, sobre um PostgreSQL descartável cujo schema vem de <code>alembic upgrade head</code>; por isso o mesmo slug fixo passa em dois testes seguidos, em qualquer ordem. O slug é entrada explícita e nenhum teste depende da hora atual. Com o banco parado, a API responde 503 estruturado, com sinal observável e a sessão limpa, em vez de travar.</p>' + reprova('teste que depende de ordem ou que trava com o banco parado.') },

        { tipo: 'escolha', id: 'cp-esc-p8', titulo: 'P8 · Aquecimento: o que é requisito',
          pergunta: 'Qual afirmação sobre a publicação externa do encurtador está certa?',
          opcoes: [
            { id: 'a', texto: 'É trilha opcional: não condiciona a aprovação, e quem a percorre registra ambiente, revisão publicada, rollback ensaiado e limite do ensaio.', correta: true, porque: 'conta, cartão e URL pública ficam fora do caminho obrigatório.' },
            { id: 'b', texto: 'É requisito: sem publicar numa plataforma, o módulo não fecha.', correta: false, porque: 'o laboratório nunca exige conta externa.' },
            { id: 'c', texto: 'É requisito só para quem usa Docker.', correta: false, porque: 'não há essa condição.' }
          ] },
        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · Release', obrigatorio: false,
          enunciado: 'Responda as três perguntas de release (como sei que quebrou, como volto, e o banco?) com os mecanismos do pipeline, e diga o que é trilha opcional. <em>Bloco 7.</em>',
          placeholder: 'Como sei que quebrou… Como volto… O banco… O que é opcional…',
          rubrica: [
            '<strong>Gates paritários</strong>: o <code>check.sh</code> local roda os mesmos comandos do CI (lint, formato, tipos, testes).',
            '<strong>Imagem imutável por SHA</strong>, só na main, encadeada à qualidade por <code>needs</code>.',
            '<strong>Migration antes de promover</strong>, num passo efêmero; se falhar, o release aborta e a anterior segue no ar.',
            'As três respostas: <strong>health check e logs</strong>; <strong>redeploy da SHA anterior</strong> mais downgrade compatível, ensaiado; <strong>banco que volta junto</strong> (downgrade testado ou expandir e contrair). Publicação externa é <strong>trilha opcional</strong>.'
          ],
          modelo: '<p>Como sei que quebrou: o <code>/health</code> e os logs, verificados depois de promover. Como volto: redeploy da SHA anterior, que é imutável, mais downgrade compatível, com o tempo ensaiado no contrato. O banco volta junto porque a migration é compatível com a versão anterior (expandir e contrair em duas releases) e o downgrade é testado. O pipeline reproduz os gates do <code>check.sh</code>, só a main constrói a imagem, e a migration roda antes de promover; se falhar, o release aborta. Publicar numa plataforma externa é trilha opcional e não condiciona a aprovação.</p>' + reprova('segredo no PR ou publicação externa tratada como requisito.') },

        { tipo: 'callout', tom: 'info', titulo: 'Entregáveis verificados (mostrar rodando)', html:
          '<ul><li>Gates locais verdes: <code>scripts/check.sh</code> (lint, formato, tipos, suíte) e wheel em <code>dist/</code>.</li>' +
          '<li>Guardrail com mutante rejeitado e revertido; ADR 0001 apresentado.</li>' +
          '<li>Fluxo final pela API: criação, consulta, 409, 404, 422, <code>/health</code> 200 e 503 degradado, correlation id.</li>' +
          '<li>Suíte postgres como contrato: verde com Docker, BLOCKED sem ele.</li>' +
          '<li>Contrato de release (<code>RELEASE.md</code>) com gates, SHA, migrations, segredos e trilha opcional registrada.</li></ul>' },
        { tipo: 'texto', html: '<p class="ta-nota">Estado verificado conforme as fontes dos blocos (consultas de 21/08/2026 e 13/09/2026); documentação de framework, banco e ferramenta deve ser revalidada em até 90 dias. Os comandos executáveis e a demonstração com a referência do lab estão no laboratório guiado do módulo.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>mecanismo</mark> primeiro e, depois, o que <mark>reprova</mark>.' }
      ] }
    ]
  });
})();
