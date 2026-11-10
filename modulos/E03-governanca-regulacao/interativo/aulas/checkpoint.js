/* E03 · Checkpoint: cinco cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada. Fonte: E03.html#checkpoint. Datas verificadas em 11/10/2026. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'e03-checkpoint',
    titulo: 'Checkpoint E03',
    minutos: 40,
    resumo: 'Cinco cenários sobre governança, LGPD, EU AI Act e IA responsável, sem consulta. Responda com as suas palavras, citando campos do registro, regras e a data de verificação.',
    objetivo: 'Verificar, sem consulta, se você preenche o registro de um sistema sensível, desenha a eliminação de um titular, responde sobre o alcance e o cronograma do EU AI Act, propõe governança sem comitê paralisante e corrige a leitura de um scanner de PII.',
    revisao: [
      { id: 'e03cp-prontuario', pergunta: 'Um assistente resume prontuários com provedor nos EUA. Qual combinação de lacunas o registro deve evitar?',
        opcoes: [
          opc('a', 'Dado sensível com base do art. 11, RIPD, retenção e eliminação por titular em cada store, mecanismo de transferência, eval e plano de incidente em produção.', true, 'cada item dispara uma regra (AIG-002, 010, 003/004, 006, 013, 012) se faltar.'),
          opc('b', 'Basta o contrato com o provedor.', false, 'o contrato é insumo, não substituto do registro.'),
          opc('c', 'Dado de saúde com legítimo interesse.', false, 'legítimo interesse não está na lista do art. 11.')] },
      { id: 'e03cp-eliminacao', pergunta: 'O que você NÃO pode prometer num pedido de eliminação?',
        opcoes: [
          opc('a', 'A remoção do efeito do dado em pesos de um modelo já treinado.', true, 'não há técnica madura que garanta isso sem re-treinar; por isso se evita treinar com dado identificável.'),
          opc('b', 'A remoção dos chunks por filtro de metadado.', false, 'é a rota normal quando o <code>subject_id</code> está em cada chunk.'),
          opc('c', 'O registro do evento de eliminação.', false, 'é artefato exigido, sem o dado apagado.')] },
      { id: 'e03cp-alcance', pergunta: 'Sobre o diretor que diz "só temos usuários no Brasil, o EU AI Act não é problema e só vale em agosto de 2026":',
        opcoes: [
          opc('a', 'Está certo nas duas afirmações.', false, 'o alcance inclui o uso da saída na UE, e a data de alto risco mudou.'),
          opc('b', 'É preciso verificar exposição real na UE (critério da saída) e a data: alto risco foi adiado (dez/2027 anexo III, ago/2028 anexo I, verificação de 11/10/2026), mas o art. 50 vale desde 2/8/2026 e a LGPD já vale.', true, 'afirmar datas sem fonte ou ignorar a LGPD reprova.'),
          opc('c', 'O EU AI Act vale em tudo e já desde 2024.', false, 'a aplicação é escalonada.')] },
      { id: 'e03cp-comite', pergunta: 'Qual a alternativa ao comitê quinzenal que aprova todo uso de IA?',
        opcoes: [
          opc('a', 'Registro versionado, schema e regras no CI, exceção registrada com dono e prazo, comitê só para alto risco, dado sensível ou exceções, e revisão periódica.', true, 'tira da reunião o que máquina confere e mantém humano onde há julgamento.'),
          opc('b', 'Eliminar toda revisão humana.', false, 'alto risco exige julgamento.'),
          opc('c', 'Tornar tudo aviso.', false, 'aviso demais é ignorado.')] },
      { id: 'e03cp-scanner', pergunta: 'O scanner de PII passou em todos os logs. O que isso permite concluir?',
        opcoes: [
          opc('a', 'Que não há dado pessoal nos logs.', false, 'trata ausência de achados como ausência de dado.'),
          opc('b', 'Que não foram encontrados CPF, e-mail e telefone em formato convencional; nome, endereço e saúde em texto livre não são cobertos, e pseudonimização ainda é dado pessoal.', true, 'o scanner é controle, não prova: reduza a entrada e amostre dados reais.'),
          opc('c', 'Que a redação está certificada.', false, 'redação não é evidência de conformidade sozinha.')] }
    ],
    abas: [
      { rotulo: 'Registro, eliminação e alcance', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que basta. Cite campos do registro, regras (AIG) e, quando houver data regulatória, a data de verificação. Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-c1', titulo: 'Cenário 1 · Aquecimento: a base legal',
          pergunta: 'O assistente resume prontuários (dado de saúde) para médicos. Qual base legal o registro pode declarar?',
          opcoes: [
            opc('a', 'Contrato, porque o médico é cliente.', false, 'contrato é base do art. 7; o art. 11 tem lista própria.'),
            opc('b', 'Legítimo interesse, com teste de balanceamento.', false, 'legítimo interesse não está na lista do art. 11 (AIG-002).'),
            opc('c', 'Uma hipótese do art. 11 (por exemplo, consentimento específico e destacado, ou as do inciso II), escolhida com o jurídico.', true, 'e o sistema precisa sustentar as consequências da base escolhida.')
          ] },
        { tipo: 'escreva', id: 'cp-c1', titulo: 'Cenário 1 · O assistente de prontuários', obrigatorio: false,
          enunciado: 'Seu time lança um assistente que resume prontuários para médicos, com um provedor de LLM nos EUA. Liste os campos do registro que você preenche e as regras que esperaria ver disparar se estiverem incompletos. <em>Blocos 1, 2 e 5.</em>',
          placeholder: 'Dados sensíveis… base legal… RIPD… retenção e eliminação… transferência… eval e incidente…',
          rubrica: [
            'Dado <strong>sensível</strong> (saúde) exigindo base do <strong>art. 11</strong> (não contrato nem legítimo interesse): AIG-002.',
            '<strong>RIPD</strong> (AIG-010).',
            '<strong>Retenção</strong> e <strong>eliminação por titular</strong> em log, cache e vector store (AIG-003, AIG-004).',
            '<strong>Mecanismo de transferência</strong> para o exterior (AIG-006).',
            '<strong>Avaliação de impacto</strong> se houver decisão; <strong>eval</strong> e <strong>plano de incidente</strong> em produção (AIG-009, 013, 012).'
          ],
          modelo: '<p>Declaro dado pessoal sensível (saúde), então a base vem do art. 11 (consentimento específico e destacado ou uma hipótese do inciso II), nunca contrato ou legítimo interesse; sem isso, a AIG-002 reprova. Preciso do RIPD (AIG-010). Cada store que guarda dado pessoal tem <code>retention_days</code> e eliminação por titular (AIG-003 e AIG-004), em log, cache e vector store. O provedor nos EUA exige <code>transfer_mechanism</code> (AIG-006), e verifico se ele treina sobre entradas (AIG-007). Se o assistente alimentar alguma decisão, há avaliação de impacto, revisão humana e, em produção, relatório de eval e plano de incidente (AIG-009, 011, 013, 012).</p>' + reprova('"o provedor é responsável" ou "dado de saúde usa legítimo interesse".') },

        { tipo: 'escreva', id: 'cp-c2', titulo: 'Cenário 2 · O pedido de eliminação', obrigatorio: false,
          enunciado: 'Chega um pedido de eliminação de um titular que conversou com o assistente por seis meses. Descreva o plano técnico e o que você não consegue prometer. <em>Bloco 2.</em>',
          placeholder: 'Localizo por… apago em… registro… limites…',
          rubrica: [
            'Localizar por <strong>identificador ou pseudônimo</strong> em logs, histórico, cache, <strong>vector store (filtro de metadado)</strong> e datasets de eval.',
            '<strong>Registrar o evento</strong> de eliminação, sem o dado.',
            'Explicar a <strong>janela de backup</strong>.',
            'Dizer que <strong>não é viável garantir remoção</strong> de efeito em pesos já treinados e que por isso o treino com dado identificável foi evitado.'
          ],
          modelo: '<p>Verifico a identidade, localizo o <code>subject_id</code> e o pseudônimo, e apago: chunks e embeddings do vector store por filtro de metadado, cache por tag, logs e histórico por pseudônimo; nos datasets de eval gero relatório em vez de remover às cegas. Registro o evento de eliminação sem o dado apagado. Backups esperam o ciclo de rotação, com a janela documentada. Não consigo prometer remover o efeito em pesos de um modelo já treinado; por isso evitamos treinar com dado pessoal identificável e usamos RAG, onde a eliminação é por filtro.</p>' + reprova('"apagamos a linha do banco" ou prometer apagar de um modelo fine-tunado.') },

        { tipo: 'escolha', id: 'cp-esc-c3', titulo: 'Cenário 3 · Aquecimento: onde está a fonte',
          pergunta: 'Você precisa citar a data de aplicação do alto risco no documento interno. Qual a prática?',
          opcoes: [
            opc('a', 'Citar a data do material de 2024, que é de um bom escritório.', false, 'o material ficou desatualizado em julho de 2026.'),
            opc('b', 'Citar a data, a fonte e a data de verificação, conferir o EUR-Lex e escrever "a verificar" quando não for possível confirmar.', true, 'cronograma de regulação é dado de alto risco com meia-vida curta.'),
            opc('c', 'Omitir a data para não envelhecer.', false, 'sem data, o documento não serve para planejar.')
          ] },
        { tipo: 'escreva', id: 'cp-c3', titulo: 'Cenário 3 · O diretor e o EU AI Act', obrigatorio: false,
          enunciado: 'Um diretor diz: "só temos usuários no Brasil, o EU AI Act não é problema, e de toda forma só vale em agosto de 2026". Responda. <em>Bloco 3.</em>',
          placeholder: 'O alcance depende de… A data… O que já vale…',
          rubrica: [
            'O critério de alcance inclui o <strong>uso da saída na UE</strong>; confirmar com dados reais se há exposição (<code>eu_exposure</code>).',
            'A data de alto risco foi <strong>adiada</strong> (dez/2027 anexo III, ago/2028 anexo I), <strong>conforme verificação de 11/10/2026</strong>.',
            'O <strong>art. 50</strong> vale desde 2/8/2026 e a <strong>LGPD</strong> já vale.',
            'Propõe <strong>verificar a fonte primária</strong>.'
          ],
          modelo: '<p>O alcance não depende de filial: o art. 2 inclui provedores e implantadores de país terceiro quando a saída do sistema é usada na UE, então preciso verificar com dados reais se há exposição e levar ao jurídico (<code>eu_exposure</code>). A data também mudou: em 11/10/2026 as fontes consultadas indicavam alto risco adiado para 2/12/2027 (anexo III) e 2/8/2028 (anexo I), mas o art. 50 de transparência vale desde 2/8/2026, os modelos de uso geral desde 2/8/2025, e a LGPD já se aplica hoje. Proponho confirmar o texto no EUR-Lex antes de planejar.</p>' + reprova('afirmar datas sem fonte ou ignorar a LGPD.') },
        { tipo: 'takeaway', html: 'Cite <mark>campos e regras</mark> do registro e sempre a <mark>data de verificação</mark> do que é regulatório.' }
      ] },

      { rotulo: 'Operação e limites', blocos: [
        { tipo: 'escreva', id: 'cp-c4', titulo: 'Cenário 4 · O comitê quinzenal', obrigatorio: false,
          enunciado: 'Um colega propõe um comitê quinzenal que aprova todo uso de IA. Proponha o desenho alternativo. <em>Blocos 1 e 5.</em>',
          placeholder: 'Registro… CI… exceção… comitê só para… revisão…',
          rubrica: [
            '<strong>Registro versionado</strong>, com <strong>schema e regras no CI</strong>.',
            '<strong>Exceção registrada</strong> com dono e prazo.',
            '<strong>Comitê só</strong> para alto risco, dado sensível ou exceções.',
            '<strong>Revisão periódica</strong> com vencimento.'
          ],
          modelo: '<p>Cada sistema tem um registro versionado no repositório, com dono, validado por schema fechado e regras a cada PR (erro bloqueia, aviso informa). Exceção é decisão registrada com dono e prazo, não <code>--no-verify</code>. O comitê só vê o que exige julgamento: alto risco, dado sensível e exceções. O registro vence a cada 365 dias e a avaliação é refeita quando muda modelo, dado, finalidade ou provedor. Assim o chatbot interno e a triagem de sinistros não seguem o mesmo processo.</p>' + reprova('eliminar a revisão humana de alto risco ou tornar tudo aviso.') },

        { tipo: 'escreva', id: 'cp-c5', titulo: 'Cenário 5 · O scanner passou', obrigatorio: false,
          enunciado: 'O scanner de PII passou em todos os logs. O gerente conclui "não há dado pessoal". Corrija. <em>Blocos 2 e 5.</em>',
          placeholder: 'O scanner só acha… Pseudonimização… O que fazer…',
          rubrica: [
            '<strong>Limite do detector</strong>: só CPF, e-mail e telefone convencionais; não nome, endereço, saúde em texto livre.',
            '<strong>Pseudonimização</strong> ainda é dado pessoal.',
            '<strong>Reduzir a entrada</strong> e <strong>amostrar</strong> dados reais.',
            'O scanner é <strong>controle, não prova</strong>.'
          ],
          modelo: '<p>"Passou" significa "não encontrei esses padrões". O scanner acha CPF com dígitos verificadores, e-mail e telefone formatados de modo convencional; não acha nome, endereço, RG, número de processo nem dado de saúde em texto livre. Tokens como <code>[CPF:beb2221b]</code> são pseudonimização e continuam sendo dado pessoal. Além do scanner, reduzo o que entra no log, amostro dados reais periodicamente e uso a AIG-005 para cruzar a declaração do registro. O scanner é um controle, não uma prova.</p>' + reprova('tratar ausência de achados como ausência de dado.') },

        { tipo: 'escolha', id: 'cp-esc-c4', titulo: 'Fechamento · O que bloqueia e o que avisa',
          pergunta: 'Qual regra do laboratório é melhor tratada como erro que bloqueia o merge?',
          opcoes: [
            opc('a', 'AIG-011: decisão automatizada que afeta pessoas sem canal de revisão (LGPD art. 20).', true, 'é objetivamente inaceitável dado o que foi declarado; não depende de contexto.'),
            opc('b', 'AIG-007: provedor que pode treinar sobre entradas com dado pessoal.', false, 'depende do contrato e do contexto; no lab é aviso.'),
            opc('c', 'AIG-015: aviso de IA ausente em sistema generativo voltado ao usuário.', false, 'depende de contexto (é mesmo voltado ao usuário? a saída chega à UE?); no lab é aviso, e <code>--strict</code> o promove a bloqueio.')
          ] },
        { tipo: 'texto', html: '<p class="ta-nota">Estado verificado em 11/10/2026. Datas e fatos regulatórios (EU AI Act e omnibus, PL 2338/2023, ANPD, ISO 42006) têm meia-vida curta e parte vem de fonte secundária: conferir na fonte oficial antes de uso formal.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>campo ou a regra</mark> do registro, o <mark>limite</mark> do que se promete e a <mark>fonte com data</mark>.' }
      ] }
    ]
  });
})();
