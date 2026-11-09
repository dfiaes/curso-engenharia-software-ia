/* E01 · Checkpoint: oito cenários, avaliação sem consulta. Fonte: E01.html#checkpoint. Rubrica = "Basta"; modelo = resposta esperada + "Reprova". */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoEstimativa = [
    'def estimativa(usuarios, interacoes_dia, horas, pico, resposta_s,',
    '               tokens_in, tokens_out, preco_in, preco_out, dias_mes):',
    '    """Devolve {"qps_pico", "concorrencia", "tpm", "custo_mensal"}.',
    '',
    '    qps_pico: média na janela de `horas`, vezes o fator `pico`.',
    '    concorrencia: lei de Little (qps_pico × resposta_s).',
    '    tpm: tokens por minuto no pico (entrada + saída por interação).',
    '    custo_mensal: US$, com entrada e saída em preços separados (por milhão de tokens).',
    '    Parâmetro não positivo levanta ValueError."""',
    '    if min(usuarios, interacoes_dia, horas, pico, resposta_s) <= 0:',
    '        raise ValueError("parâmetro deve ser positivo")',
    '    qps_pico = 0.0', '    concorrencia = 0.0', '    tpm = 0.0', '    custo_mensal = 0.0',
    '    return {"qps_pico": qps_pico, "concorrencia": concorrencia, "tpm": tpm, "custo_mensal": custo_mensal}', '',
    'print(estimativa(3000, 40, 8, 3, 6, 5000, 1000, 3.0, 15.0, 22))', ''].join('\n');
  var testesEstimativa = [
    'def caso():', '    return estimativa(3000, 40, 8, 3, 6, 5000, 1000, 3.0, 15.0, 22)', '', '',
    'def test_qps_de_pico():', '    assert abs(caso()["qps_pico"] - 12.5) < 1e-9', '', '',
    'def test_concorrencia_por_little():', '    assert abs(caso()["concorrencia"] - 75) < 1e-9', '', '',
    'def test_tpm_e_nao_so_rpm():', '    assert abs(caso()["tpm"] - 4_500_000) < 1', '', '',
    'def test_custo_com_entrada_e_saida_separadas():', '    assert abs(caso()["custo_mensal"] - 79_200) < 0.5', '', '',
    'def test_borda_um_usuario_uma_interacao():',
    '    r = estimativa(1, 1, 1, 1, 1, 1000, 0, 1.0, 1.0, 1)',
    '    assert abs(r["qps_pico"] - 1 / 3600) < 1e-12', '    assert abs(r["custo_mensal"] - 0.001) < 1e-12', '', '',
    'def test_parametro_invalido_levanta():',
    '    try:', '        estimativa(3000, 40, 0, 3, 6, 5000, 1000, 3.0, 15.0, 22)', '    except ValueError:', '        return',
    '    assert False, "horas zero deveria levantar ValueError"', ''].join('\n');
  var solucaoEstimativa = [
    'def estimativa(usuarios, interacoes_dia, horas, pico, resposta_s,',
    '               tokens_in, tokens_out, preco_in, preco_out, dias_mes):',
    '    if min(usuarios, interacoes_dia, horas, pico, resposta_s) <= 0:',
    '        raise ValueError("parâmetro deve ser positivo")',
    '    por_dia = usuarios * interacoes_dia',
    '    qps_pico = por_dia / (horas * 3600) * pico',
    '    concorrencia = qps_pico * resposta_s',
    '    tpm = qps_pico * 60 * (tokens_in + tokens_out)',
    '    custo_interacao = (tokens_in * preco_in + tokens_out * preco_out) / 1e6',
    '    custo_mensal = por_dia * dias_mes * custo_interacao',
    '    return {"qps_pico": qps_pico, "concorrencia": concorrencia, "tpm": tpm, "custo_mensal": custo_mensal}', ''].join('\n');

  TrilhaAula.registrar({
    id: 'e01-checkpoint',
    titulo: 'Checkpoint E01',
    minutos: 60,
    resumo: 'Oito cenários de system design de IA, sem consulta: estimativa, gargalo, custo de agente, efeito duplicado, batch ou síncrono, qualidade silenciosa, defesa e design doc.',
    objetivo: 'Verificar, sem consulta, se você estima com premissa, localiza gargalos específicos de LLM, controla custo e efeito de agentes, escolhe o modo de chamada com números e defende e escreve um design.',
    revisao: [
      { id: 'e01cp-pico', pergunta: 'O que uma estimativa de capacidade de LLM precisa trazer além do QPS?',
        opcoes: [
          opc('a', 'Pico com premissas escritas, concorrência por Little, TPM (não só RPM) e custo com entrada e saída separadas', true, 'número sem premissa não é refazível; QPS sozinho esconde a cota que aperta primeiro.'),
          opc('b', 'Apenas o QPS médio do dia', false, 'a média esconde o pico e a concorrência.'),
          opc('c', 'O número de servidores', false, 'o gargalo de LLM costuma ser TPM e concorrência de streaming, não servidor.')] },
      { id: 'e01cp-agente', pergunta: 'Um agente de 10 passos custa US$ 0,09 e uma tarefa custou US$ 1,20. Qual explicação e qual controle?',
        opcoes: [
          opc('a', 'Custo quadrático no histórico, cauda de passos e perda do cache de prefixo; teto por tarefa, detector de repetição e compactação', true, 'cada passo reenvia o histórico acumulado: o custo cresce com o quadrado dos passos.'),
          opc('b', 'O modelo está caro; trocar de provedor', false, 'não explica a diferença de mais de dez vezes entre tarefas.'),
          opc('c', 'Cobrar a mais do cliente', false, 'não é um controle de custo.')] },
      { id: 'e01cp-efeito', pergunta: 'O terceiro devolveu timeout depois do POST de pagamento. O que impede pagar duas vezes?',
        opcoes: [
          opc('a', 'Chave determinística gravada antes (pendente), Idempotency-Key, log de efeitos, verificação por leitura e aprovação humana como último recurso', true, 'a fila entrega pelo menos uma vez; a idempotência do efeito é do executor.'),
          opc('b', 'A garantia de "exatamente uma vez" da fila', false, 'a fila não garante o efeito externo.'),
          opc('c', 'Perguntar ao modelo se funcionou', false, 'o modelo não sabe o estado do efeito.')] },
      { id: 'e01cp-lote', pergunta: 'Para 20 mil páginas por dia com resposta em 1 hora, a Batch API (janela de até 24 h) serve?',
        opcoes: [
          opc('a', 'Não para esse fluxo: a janela de 24 h não cumpre 1 hora; batch fica para o passivo e para o que tolera atraso, em desenho híbrido', true, 'o batch troca janela por −50%; quem tem SLA de 1 hora paga o síncrono.'),
          opc('b', 'Sim: batch é sempre mais barato', false, 'o desconto não compensa um SLA descumprido.'),
          opc('c', 'Sim, se o lote tiver 100 páginas', false, 'o tamanho do lote não muda a janela de conclusão.')] },
      { id: 'e01cp-qualidade', pergunta: 'A disponibilidade é 99,95% e a satisfação cai há um mês. Por que nenhum alarme tocou?',
        opcoes: [
          opc('a', 'HTTP 200 mede transporte; falta SLI de qualidade (amostra julgada), versões registradas, alerta e rollback', true, 'a qualidade precisa de métrica própria.'),
          opc('b', 'Faltam mais logs', false, 'log sem métrica de qualidade não gera alarme.'),
          opc('c', 'O provedor mascara os erros', false, 'o problema é o que se mede, não o provedor.')] }
    ],
    abas: [
      { rotulo: 'Estimativa, gargalo e agentes', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que <strong>basta</strong> e o modelo mostra o que reprova. Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: o que a estimativa precisa',
          pergunta: 'Um copiloto de código para 3 mil engenheiros, 40 interações por dia em 8 horas. Que conjunto de números a estimativa precisa entregar?',
          opcoes: [
            { id: 'a', texto: 'QPS de pico com a definição de pico escrita, concorrência por Little, TPM e custo com entrada e saída separadas', correta: true, porque: 'cada número tem a sua premissa, e o TPM costuma apertar antes do RPM.' },
            { id: 'b', texto: 'Só o QPS médio', correta: false, porque: 'a média esconde pico e concorrência.' },
            { id: 'c', texto: 'Só o custo por requisição', correta: false, porque: 'sem pico e concorrência não há dimensionamento.' }
          ] },
        { tipo: 'python', id: 'cp-p1-python', titulo: 'P1 · A estimativa em código', obrigatorio: false,
          enunciado: 'Pico de 3×, resposta de 6 s, 5.000 tokens de entrada e 1.000 de saída por interação, preços hipotéticos de US$ 3,00 e 15,00 por milhão, 22 dias úteis. Implemente <code>estimativa</code> e confira os números antes de escrever a resposta. <em>Bloco 1.</em>',
          codigo: codigoEstimativa, testes: testesEstimativa,
          dica: '<code>qps_pico = usuarios*interacoes_dia / (horas*3600) * pico</code>; concorrência é Little (<code>qps_pico * resposta_s</code>); TPM usa <code>qps_pico * 60</code> vezes os tokens totais; o custo separa entrada e saída.',
          solucao: solucaoEstimativa,
          tutorDepois: 'Com os números prontos, escreva a resposta de P1 declarando as premissas.',
          callout: 'A estimativa do copiloto fechou: pico, concorrência, TPM e custo.' },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Estimativa em 10 minutos', obrigatorio: false,
          enunciado: 'Um copiloto de código para 3 mil engenheiros, 40 interações por dia, 8 horas. Calcule QPS de pico, concorrência com resposta de 6 s, TPM com 6 mil tokens por interação e custo mensal com preço hipotético que você declare. <em>Bloco 1.</em>',
          placeholder: 'Premissas… Pico… Concorrência… TPM… Custo…',
          rubrica: [
            'Definição de <strong>pico</strong> e <strong>premissas escritas</strong>.',
            '<strong>Little</strong> para a concorrência.',
            '<strong>TPM</strong> em vez de só RPM.',
            'Custo com <strong>entrada e saída separadas</strong>.',
            'Resultado como <strong>intervalo</strong>.'
          ],
          modelo: '<p>Premissas: 3 mil engenheiros, 40 interações por dia em 8 horas, pico de 3× a média. São 120 mil interações por dia, 4,17 por segundo na média e 12,5 no pico. Com resposta de 6 s, Little dá 75 requisições simultâneas. Com 6 mil tokens por interação, o TPM de pico é 12,5 × 60 × 6.000 = 4,5 milhões (cerca de 5,9 milhões com folga de 30%); o RPM, 750, é só uma das duas cotas. Com preços hipotéticos de US$ 3 por milhão na entrada e US$ 15 na saída e 5 mil tokens de entrada para 1 mil de saída, cada interação custa US$ 0,03: cerca de US$ 79 mil por mês em 22 dias úteis, e algo como US$ 54 mil se 70% da entrada vier de prefixo em cache. O resultado é um intervalo, e a premissa que mais o move é o tamanho do contexto.</p>' + reprova('número sem premissa; só QPS.') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Onde está o gargalo', obrigatorio: false,
          enunciado: 'O assistente RAG (4 QPS) responde bem no teste e cai no primeiro pico. Liste, em ordem de probabilidade, três causas específicas de LLM e como cada uma é detectada. <em>Blocos 3 e 4.</em>',
          placeholder: 'Causa 1 e como detecto… Causa 2… Causa 3…',
          rubrica: [
            '<strong>TPM e 429</strong> do provedor (cota de tokens, não de requisições).',
            '<strong>Concorrência de streaming</strong> ou pool de conexões esgotado.',
            '<strong>Fila no provedor</strong> ou <strong>TTFT alto</strong> por contexto grande.',
            'A <strong>métrica</strong> que detecta cada uma.'
          ],
          modelo: '<p>Em ordem de probabilidade: (1) o TPM estourou. Cada requisição carrega milhares de tokens de contexto e a cota de tokens acaba antes da de requisições; detecto por 429 com Retry-After e por tokens por minuto contra a cota. (2) A concorrência de streaming esgotou o pool de conexões ou de workers: cada resposta segura a conexão por segundos, então Little cobra; detecto por conexões em uso e por fila de espera local. (3) Fila no provedor ou TTFT alto por contexto grande; detecto por tempo até o primeiro token em percentis e por tamanho do prompt. Escalar servidores sem olhar o TPM não resolve nenhuma das três.</p>' + reprova('"escalar horizontalmente os servidores".') },

        { tipo: 'escolha', id: 'cp-esc-p3', titulo: 'P3 · Aquecimento: a tarefa de US$ 1,20',
          pergunta: 'Um agente de 10 passos custa US$ 0,09 e uma tarefa custou US$ 1,20. Qual é a explicação mais provável?',
          opcoes: [
            { id: 'a', texto: 'O modelo está caro.', correta: false, porque: 'o preço é o mesmo para todas as tarefas; não explica a cauda.' },
            { id: 'b', texto: 'O histórico é reenviado a cada passo, o custo é quadrático e a tarefa teve muito mais passos (ou perdeu o cache de prefixo).', correta: true, porque: 'n × base + crescimento × n(n−1)/2: 25 passos custam mais de três tarefas médias.' },
            { id: 'c', texto: 'O cliente usou mais tokens de saída por vontade própria.', correta: false, porque: 'a saída é uma fração pequena do custo; o que domina é a entrada reenviada.' }
          ] },
        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Custo de um agente', obrigatorio: false,
          enunciado: 'Um agente de 10 passos custa US$ 0,09; um cliente reclama que uma tarefa custou US$ 1,20. Explique como é possível e que controles evitam. <em>Bloco 5.</em>',
          placeholder: 'É possível porque… Os controles são…',
          rubrica: [
            '<strong>Custo quadrático</strong> no histórico reenviado.',
            '<strong>Cauda de passos</strong>, loop sem progresso, <strong>perda do cache</strong> de prefixo.',
            '<strong>Teto</strong> por tarefa (passos, tokens, dólares), verificado antes de cada chamada.',
            '<strong>Detector de repetição</strong> e <strong>compactação</strong> do contexto.'
          ],
          modelo: '<p>Cada passo reenvia o contexto base mais tudo o que acumulou, então a entrada em n passos é n × base + crescimento × n(n−1)/2: 25 passos custam mais de três tarefas médias, e uma tarefa em loop sem progresso, ou que perdeu o cache de prefixo ao esperar uma aprovação, vai mais longe. Os controles: teto de passos, tokens e dólares por tarefa, verificado antes de cada chamada com o custo estimado do próximo passo, encerrando com resultado parcial e motivo; detector de ação repetida; compactação do contexto; e ordem estável no prompt para manter o cache de prefixo.</p>' + reprova('"o modelo está caro".') },

        { tipo: 'ordene', id: 'cp-ordene-p4', titulo: 'P4 · O protocolo do efeito duplicado', obrigatorio: false,
          enunciado: 'O worker chamou a API de pagamento, o terceiro devolveu timeout e a tarefa será repetida. Ordene o protocolo do executor, do primeiro passo ao último.',
          itens: [
            { id: 'd', texto: 'Se o terceiro não suporta chave: verificar por leitura se o efeito já existe' },
            { id: 'b', texto: 'Chamar o terceiro repassando a chave como Idempotency-Key' },
            { id: 'e', texto: 'Se o estado continuar incerto: aprovação humana' },
            { id: 'a', texto: 'Gravar a chave determinística no log de efeitos, em estado pendente' },
            { id: 'c', texto: 'No timeout, marcar o estado como incerto e, com suporte, retentar com a mesma chave' }
          ],
          solucao: ['a', 'b', 'c', 'd', 'e'],
          dica: 'A chave é gravada antes de qualquer chamada; a aprovação humana é o último recurso.',
          tutorDepois: 'Cada passo restringe o seguinte: sem a chave gravada antes, nenhum dos outros funciona.' },
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Efeito duplicado', obrigatorio: false,
          enunciado: 'O worker chama a API de pagamento, o terceiro devolve timeout, a tarefa é repetida. Desenhe o protocolo que evita pagar duas vezes e diga o que fazer se o terceiro não suportar chave de idempotência. <em>Bloco 5.</em>',
          placeholder: 'Antes da chamada… No timeout… Sem suporte…',
          rubrica: [
            '<strong>Chave determinística</strong> gravada antes, com <code>hash(tenant, tarefa, passo, ação, parâmetros)</code>.',
            '<strong>Log de efeitos</strong> com estado pendente e concluído.',
            '<strong>Verificação por leitura</strong> quando o terceiro não suporta chave.',
            'Estado <strong>"incerto"</strong> e <strong>aprovação humana</strong> como último recurso.'
          ],
          modelo: '<p>Antes de chamar, o executor calcula a chave hash(tenant, tarefa, passo, ação, parâmetros), grava no log de efeitos como pendente e a envia como Idempotency-Key. No timeout, o efeito é desconhecido: a retentativa reusa a mesma chave e o log diz se o efeito foi concluído, reaproveitando o resultado. Se o terceiro não suporta chave, o executor verifica por leitura ("o reembolso já existe?") antes de reexecutar; se a leitura também falha, o estado fica "incerto" e a tarefa vai para aprovação humana, registrada na auditoria. A decisão de repetir é do executor, nunca do modelo.</p>' + reprova('"a fila garante exatamente uma vez".') },
        { tipo: 'takeaway', html: 'Estime com <mark>premissa</mark>, ache o gargalo no <mark>TPM</mark> antes do servidor e proteja o efeito com <mark>chave gravada antes</mark>.' }
      ] },

      { rotulo: 'Lote, qualidade e defesa', blocos: [
        { tipo: 'cenario', id: 'cp-cen-p5', titulo: 'P5 · Batch ou síncrono', obrigatorio: false,
          enunciado: 'Dois trabalhos: um passivo de 1,2 milhão de páginas em 7 dias, e depois 20 mil páginas por dia contínuas, com resposta em 1 hora. Escolha o modo de chamada para cada um. <em>Bloco 6.</em>',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Para o passivo de 1,2 milhão de páginas em 7 dias (tudo no modelo grande, síncrono, custaria US$ 18.720), o que você escolhe?', opcoes: [
              { texto: 'Síncrono com o modelo grande: mais simples.', vai: 'f-caro', tom: 'ruim', consequencia: 'paga US$ 18.720 por simplicidade, quando ninguém espera cada página.' },
              { texto: 'Cascata em batch: −50%, janela de até 24 h, reconciliação por custom_id, cerca de US$ 1,9 mil.', vai: 'fluxo', tom: 'ok', consequencia: 'cabe nos 7 dias (373 mil TPM sustentados) e corta cerca de 90% da conta.' }
            ] },
            fluxo: { texto: 'Para as 20 mil páginas por dia com resposta em 1 hora, a janela do batch (até 24 h) serve?', opcoes: [
              { texto: 'Sim: batch para tudo, é mais barato.', vai: 'f-sla', tom: 'ruim', consequencia: 'a janela de 24 h não cumpre 1 hora; o desconto não compensa um SLA descumprido.' },
              { texto: 'Não: síncrono para o fluxo com SLA de 1 hora e batch para o que tolera atraso (híbrido).', vai: 'falha', tom: 'ok', consequencia: 'cada modo no seu caso: o híbrido paga o síncrono só onde a latência importa.' }
            ] },
            falha: { texto: 'Em qualquer dos modos, 3% dos itens falham de formas diferentes. O que o desenho precisa ter?', opcoes: [
              { texto: 'Ignorar: 3% é pouco.', vai: 'f-ignora', tom: 'ruim', consequencia: '3% de 1,2 milhão são 36 mil páginas sem dado.' },
              { texto: 'Manifesto por página, reconciliação por custom_id, falhas transitórias com backoff, DLQ e fila de revisão; e recalcular o gargalo, que passou para a revisão humana.', vai: 'f-bom', tom: 'ok', consequencia: 'nada some em silêncio, e a conta de revisão (365 h a ±1 ponto) entra na decisão.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Híbrido justificado com números: batch para o passivo, síncrono para o SLA de 1 hora, falha por item tratada e o gargalo recalculado na revisão.' },
            'f-caro': { bom: false, texto: 'O passivo fechou no prazo, mas pela conta mais cara possível.' },
            'f-sla': { bom: false, texto: 'O fluxo contínuo estourou o SLA de 1 hora em todo dia em que o lote demorou.' },
            'f-ignora': { bom: false, texto: 'Milhares de páginas ficaram sem extração, e ninguém soube quais.' }
          },
          callout: 'Você escolheu cada modo com número, tratou a falha por item e viu o gargalo ir para a revisão.' },
        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Batch ou síncrono, por escrito', obrigatorio: false,
          enunciado: 'Para 1,2 milhão de páginas em 7 dias e para 20 mil por dia contínuas com resposta em 1 hora, escolha o modo de chamada e justifique com números. <em>Bloco 6.</em>',
          placeholder: 'Passivo… Fluxo contínuo… Híbrido… Falha por item… Gargalo…',
          rubrica: [
            '<strong>Batch</strong> para o passivo (−50%, janela de 24 h, reconciliação).',
            'Análise da <strong>janela de 1 hora</strong> do fluxo contínuo.',
            'Alternativa <strong>híbrida</strong>.',
            '<strong>Falha por item</strong> tratada (custom_id, manifesto, DLQ).',
            'O gargalo muda para a <strong>revisão</strong>.'
          ],
          modelo: '<p>Para o passivo: cascata em batch, cerca de US$ 1,9 mil contra US$ 18,7 mil de tudo no modelo grande síncrono; 373 mil TPM sustentados fecham em 7 dias, o que cabe na janela de até 24 h por lote com lotes em paralelo. Para o fluxo contínuo com resposta em 1 hora, a janela do batch não garante o SLA: uso síncrono (também em cascata) para o que tem prazo e batch para o excedente que tolera atraso, o híbrido. Em ambos, manifesto com estado por página, reconciliação por custom_id e DLQ para as falhas por item. O gargalo passa a ser a revisão: ±1 ponto são 1.825 páginas por lote e 365 horas, mais caras que a API.</p>' + reprova('escolha sem custo ou sem tratar falha por item.') },

        { tipo: 'escolha', id: 'cp-esc-p6', titulo: 'P6 · Fechamento: a qualidade silenciosa',
          pergunta: 'A disponibilidade é 99,95% e a satisfação cai há um mês. Qual afirmação explica por que nenhum alarme tocou?',
          opcoes: [
            { id: 'a', texto: 'HTTP 200 mede transporte, não qualidade: faltava um SLI de qualidade, medido por amostra julgada.', correta: true, porque: 'a resposta pode chegar íntegra e estar pior; sem SLI de qualidade, versões registradas e rollback, a queda é silenciosa.' },
            { id: 'b', texto: 'O provedor esconde os erros do cliente.', correta: false, porque: 'o problema é o que se mede, não o provedor.' },
            { id: 'c', texto: 'Faltaram logs.', correta: false, porque: 'log sem métrica de qualidade não aciona alerta.' }
          ] },
        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Qualidade silenciosa', obrigatorio: false,
          enunciado: 'Disponibilidade 99,95% e satisfação caindo há um mês. Explique por que nenhum alarme tocou e como projetar o monitoramento. <em>Bloco 3.</em>',
          placeholder: 'Nenhum alarme tocou porque… Eu mediria… Alertaria e reverteria…',
          rubrica: [
            '<strong>HTTP 200</strong> mede transporte, não qualidade.',
            '<strong>SLI de qualidade</strong> por amostra julgada em produção.',
            '<strong>Versões</strong> de prompt, modelo e índice registradas.',
            '<strong>Alerta</strong> no SLI e <strong>rollback</strong>.'
          ],
          modelo: '<p>A disponibilidade mede se a requisição voltou com 200, e a resposta pode voltar íntegra e pior: uma mudança de prompt, de modelo do provedor ou de índice degrada a qualidade sem derrubar um único health check. Eu definiria um SLI de qualidade medido por amostra julgada em produção (conjunto de ouro mais amostragem de tráfego), registraria versão de prompt, modelo e índice em cada resposta, alertaria quando o SLI cruzasse o orçamento de erro e deixaria o rollback de prompt e de modelo a um comando.</p>' + reprova('"adicionar mais logs".') },

        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Defesa', obrigatorio: false,
          enunciado: 'Um staff pergunta: "por que não resolver isso com regras e um modelo pequeno?". Responda em 90 segundos. <em>Bloco 7.</em>',
          placeholder: 'Medi um baseline sem LLM… As regras deixam de cobrir… Comparando… Eu reconsideraria se…',
          rubrica: [
            '<strong>Baseline sem LLM</strong>, medido em amostra.',
            'O ponto em que as <strong>regras deixam de cobrir</strong>.',
            '<strong>Custo e qualidade comparados</strong>.',
            '<strong>Gatilho</strong> para reconsiderar.'
          ],
          modelo: '<p>Medi esse baseline numa amostra rotulada: as regras com um modelo pequeno cobrem os casos de formulação fixa, mas deixam de cobrir a variação de linguagem, que é a maior parte do volume. Comparando custo e qualidade nessa amostra, o LLM entrega a qualidade que o requisito pede pelo custo por requisição do doc, e o baseline fica como fallback e como termo de comparação nas evals. Se uma nova amostra mostrar o baseline perto da qualidade do LLM, ou se o custo por usuário passar do teto, reconsidero o desenho.</p>' + reprova('defesa da escolha por preferência, ou tom defensivo sem dado.') },

        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · Design doc', obrigatorio: false,
          enunciado: 'Entregue o design doc do enunciado do passo 6 do laboratório (classificação automática de e-mails de um SAC: 20 mil por dia, resposta em até 1 hora, 40 categorias, encaminhar a um humano ou responder com modelo pronto) e autoavalie com a rubrica. Aqui, escreva o roteiro: o que cada seção traria e a sua nota esperada. <em>Bloco 7 e laboratório.</em>',
          placeholder: 'Seções 1–2… Estimativas (calculadora)… Alternativas… Falhas e teto de gasto… Autoavaliação por critério…',
          rubrica: [
            'As <strong>12 seções</strong> do template.',
            '<strong>Estimativas reproduzíveis</strong> na calculadora (<code>case4</code> com teste).',
            '<strong>Alternativas reais</strong>.',
            '<strong>Tabela de falhas</strong> e <strong>teto de gasto</strong>.',
            'Nota <strong>≥ 2 em todos os critérios eliminatórios</strong> (requisitos, estimativa, falhas e custo).'
          ],
          modelo: '<p>Preencho as 12 seções do template. Requisitos com número: 20 mil e-mails por dia, resposta em até 1 hora, 40 categorias, taxa de erro máxima. Estimativas na calculadora (um <code>case4</code> com teste dos números esperados): pico, concorrência, TPM e custo mensal, com premissas escritas. Alternativas reais: regras e palavras-chave, modelo pequeno com validação, cascata para o modelo maior. Tabela de falhas (429, saída inválida, categoria nova, provedor fora) e teto de gasto por dia. Avaliação com conjunto de ouro e SLI de qualidade. Autoavaliação pela rubrica de oito critérios, com nota 2 ou mais em requisitos, estimativa, falhas e custo.</p>' + reprova('lista de tecnologias sem números.') },
        { tipo: 'callout', tom: 'info', titulo: 'Entregáveis verificados (mostrar rodando)', html:
          '<ol><li>Gates do lab verdes: <code>pytest</code> (36 testes), <code>ruff check</code>, <code>ruff format --check</code>, <code>mypy --strict</code>.</li>' +
          '<li>Mutação de <code>workers_needed</code> (<code>ceil</code> para <code>int</code>) rejeitada pela suíte e revertida.</li>' +
          '<li>Os três casos reproduzindo os números dos blocos 4 a 6, mais a análise de sensibilidade do passo 4.</li>' +
          '<li>Design doc do quarto sistema, preenchido com o template e autoavaliado.</li></ol>' +
          '<p>Estes quatro são feitos no laboratório, não aqui; peça "Checkpoint E01" ao tutor para a avaliação oral.</p>' },
        { tipo: 'texto', html: '<p class="ta-nota">Os preços do módulo são hipotéticos e redondos; as saídas do laboratório vêm de execução real em 11/10/2026. Preço, cotas, desconto de batch e regras de cache de prefixo mudam com frequência: revalide na documentação do seu provedor antes de decidir.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: <mark>número com premissa</mark>, o <mark>mecanismo</mark> e o <mark>gatilho</mark> para mudar de ideia.' }
      ] }
    ]
  });
})();
