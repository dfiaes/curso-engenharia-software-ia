/* E01 · Bloco 2: blocos de construção revisitados. Fonte: E01.html#b02. Exemplo verificado de token bucket: 120.000 TPM, rajada de 10 s. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasBalde = function () {
    return [
      { id: 'cheio', nome: 'Balde cheio', descricao: 'Capacidade 20.000, reposição 2.000/s', tom: 'dns', ms: 1, linhas: [
        L('info', 'limite: 120.000 tokens/min, rajada de 10 s'),
        L('cmd', 'b = TokenBucket(capacity=20_000, refill_per_s=2_000, level=20_000)'),
        L('out', 'balde: 20.000 / 20.000 tokens'),
        L('hint', 'capacidade = rajada tolerada; reposição = ritmo sustentado')] },
      { id: 'rajada', nome: 'Cinco pedidos', descricao: '5 x 3.850 tokens em t = 0', tom: 'tcp', ms: 1, linhas: [
        L('cmd', 'b.try_spend(3_850, now=0)  # cinco vezes'),
        L('out', '[0.0, 0.0, 0.0, 0.0, 0.0]'),
        L('out', '5 x 3.850 = 19.250 retirados; sobram 750'),
        L('hint', 'a rajada coube no balde')] },
      { id: 'sexta', nome: 'A sexta', descricao: 'Um segundo depois: 750 + 2.000 = 2.750', tom: 'request', ms: 1, linhas: [
        L('cmd', 'b.try_spend(3_850, now=1)'),
        L('out', 'balde: 2.750 / 20.000; pede 3.850; faltam 1.100'),
        L('out', '0.55')] },
      { id: 'retry', nome: '429 com Retry-After', descricao: '1.100 ÷ 2.000 = 0,55 s', tom: 'response', ms: 1, linhas: [
        L('in', 'HTTP/1.1 429 Too Many Requests'),
        L('in', 'Retry-After: 0.55'),
        L('hint', 'o cliente bem-comportado espera em vez de martelar')] }
    ];
  };

  var codigoBalde = [
    'from dataclasses import dataclass',
    '',
    '',
    '@dataclass',
    'class TokenBucket:',
    '    capacity: float        # rajada: máximo de tokens gastos de uma vez',
    '    refill_per_s: float    # ritmo sustentado (tokens/s)',
    '    level: float = 0.0',
    '    last: float = 0.0',
    '',
    '    def try_spend(self, cost, now):',
    '        """0.0 se permitido; senão, segundos a esperar (vira Retry-After).',
    '        cost maior que a capacidade nunca passa: ValueError."""',
    '        # 1) repor: nível + tempo decorrido x ritmo, limitado à capacidade',
    '        # 2) registrar o instante',
    '        # 3) se couber, retirar e devolver 0.0; senão, devolver (cost - nível) / ritmo',
    '        return 0.0',
    ''].join('\n');
  var testesBalde = [
    'def novo():',
    '    tpm = 120_000',
    '    return TokenBucket(capacity=tpm / 6, refill_per_s=tpm / 60, level=tpm / 6)',
    '',
    '',
    'def test_caminho_feliz_sequencia_do_texto():',
    '    b = novo()',
    '    r = [b.try_spend(3_850, t) for t in (0, 0, 0, 0, 0, 1)]',
    '    assert r[:5] == [0.0] * 5',
    '    assert abs(r[5] - 0.55) < 1e-9',
    '',
    '',
    'def test_borda_reposicao_limitada_pela_capacidade():',
    '    b = novo()',
    '    b.try_spend(20_000, 0)',
    '    assert b.try_spend(20_000, 3600) == 0.0',
    '    assert abs(b.level) < 1e-9',
    '',
    '',
    'def test_falha_pedido_maior_que_a_capacidade():',
    '    b = novo()',
    '    try:',
    '        b.try_spend(20_001, 0)',
    '    except ValueError:',
    '        return',
    '    raise AssertionError("deveria levantar ValueError")',
    '',
    '',
    'def test_controle_negativo_negado_nao_consome():',
    '    b = novo()',
    '    for t in (0, 0, 0, 0, 0):',
    '        b.try_spend(3_850, t)',
    '    antes = b.level',
    '    assert b.try_spend(3_850, 0) > 0',
    '    assert b.level == antes',
    ''].join('\n');
  var solucaoBalde = [
    'from dataclasses import dataclass',
    '',
    '',
    '@dataclass',
    'class TokenBucket:',
    '    capacity: float',
    '    refill_per_s: float',
    '    level: float = 0.0',
    '    last: float = 0.0',
    '',
    '    def try_spend(self, cost, now):',
    '        if cost > self.capacity:',
    '            raise ValueError("pedido maior que a capacidade do balde")',
    '        self.level = min(self.capacity, self.level + (now - self.last) * self.refill_per_s)',
    '        self.last = now',
    '        if cost <= self.level:',
    '            self.level -= cost',
    '            return 0.0',
    '        return (cost - self.level) / self.refill_per_s',
    ''].join('\n');

  var codigoLittle = [
    'import math',
    '',
    '',
    'def em_voo(lam, w):',
    '    """Lei de Little: L = λ x W."""',
    '    return 0',
    '',
    '',
    'def unidades(lam, w, capacidade, utilizacao=0.7):',
    '    """Quantas unidades (pods, workers) para a meta de utilização; sempre inteiro para cima."""',
    '    return 0',
    '',
    '',
    'def tempo_mm1(servico_s, rho):',
    '    """Tempo no sistema numa fila M/M/1: S / (1 - ρ). ValueError se ρ não estiver em [0, 1)."""',
    '    return 0.0',
    ''].join('\n');
  var testesLittle = [
    'def test_streams_6_por_segundo_8_s():',
    '    assert em_voo(6, 8) == 48',
    '    assert unidades(6, 8, 50, 0.7) == 2',
    '',
    '',
    'def test_workers_de_fila_a_70_por_cento():',
    '    assert unidades(1.39, 110, 1, 0.7) == 219',
    '',
    '',
    'def test_borda_um_pod_a_96_por_cento_nao_basta():',
    '    assert unidades(6, 8, 50, 1.0) == 1',
    '    assert unidades(6, 8, 50, 0.7) > unidades(6, 8, 50, 1.0)',
    '',
    '',
    'def test_mm1_tabela_do_texto():',
    '    for rho, mult in ((0.5, 2), (0.7, 3.33), (0.9, 10), (0.95, 20)):',
    '        assert abs(tempo_mm1(1, rho) - mult) < 0.01',
    '',
    '',
    'def test_falha_saturacao_total():',
    '    for rho in (1.0, 1.2, -0.1):',
    '        try:',
    '            tempo_mm1(1, rho)',
    '        except ValueError:',
    '            continue',
    '        raise AssertionError("rho " + str(rho) + " deveria levantar ValueError")',
    ''].join('\n');
  var solucaoLittle = [
    'import math',
    '',
    '',
    'def em_voo(lam, w):',
    '    return lam * w',
    '',
    '',
    'def unidades(lam, w, capacidade, utilizacao=0.7):',
    '    return math.ceil(em_voo(lam, w) / (capacidade * utilizacao))',
    '',
    '',
    'def tempo_mm1(servico_s, rho):',
    '    if not 0 <= rho < 1:',
    '        raise ValueError("rho deve estar em [0, 1)")',
    '    return servico_s / (1 - rho)',
    ''].join('\n');

  TrilhaAula.registrar({
    id: 'e01-b2',
    titulo: 'Blocos de construção com a lente do LLM',
    minutos: 45,
    resumo: 'Os blocos são os de sempre; muda o que cada um garante quando a unidade de trabalho é lenta, cara e limitada por um terceiro. A lei de Little une as peças.',
    objetivo: 'Escolher algoritmo de balanceamento, estratégia de cache, fila, chave de partição e limitador para cargas com LLM, e converter QPS e latência em conexões e workers com a lei de Little.',
    revisao: [
      { id: 'e01b2-lb', pergunta: 'Por que least outstanding requests é preferível a round-robin para LLM?',
        opcoes: [
          opc('a', 'Uma requisição dura 800 ms e outra 40 s; round-robin empilha as longas numa réplica por acaso', true, 'round-robin supõe que todas custam parecido. O timeout do balanceador também precisa cobrir o stream completo (o padrão de 60 s corta respostas longas).'),
          opc('b', 'Porque é a única camada que lê o conteúdo HTTP', false, 'quem lê HTTP é a camada 7, independente do algoritmo.'),
          opc('c', 'Porque elimina a necessidade de health check', false, 'o health check continua necessário, e deve testar dependências leves, não uma chamada de LLM a cada 5 s.')] },
      { id: 'e01b2-cache', pergunta: 'Qual é a chave de um cache que contém conteúdo derivado de dados?',
        opcoes: [
          opc('a', '(tenant, política de acesso, versão do corpus, versão do prompt, modelo, parâmetros, pergunta normalizada)', true, 'sem tenant e permissões, o usuário B recebe a resposta construída com os documentos do usuário A.'),
          opc('b', 'Só o hash da pergunta', false, 'vaza resposta entre escopos e não invalida quando o corpus muda.'),
          opc('c', 'O identificador da sessão do usuário', false, 'quase nunca repete, então não há acerto.')] },
      { id: 'e01b2-bucket', pergunta: 'Num token bucket medido em tokens de modelo, o que são a capacidade e a reposição?',
        opcoes: [
          opc('a', 'Capacidade é a rajada tolerada; reposição é o ritmo sustentado', true, 'o exemplo: 120.000 TPM com rajada de 10 s dá capacidade 20.000 e reposição 2.000 tokens/s. A espera calculada vira o <code>Retry-After</code> de um 429.'),
          opc('b', 'Capacidade é o ritmo sustentado; reposição é a rajada', false, 'é o inverso.'),
          opc('c', 'Ambas medem requisições por segundo', false, 'a adaptação essencial para LLM é medir em tokens, porque uma requisição de 200 tokens e outra de 30.000 pesam em ordens diferentes.')] },
      { id: 'e01b2-little', pergunta: 'A 90% de utilização, quanto vale o tempo no sistema de uma fila M/M/1 em relação ao tempo de serviço?',
        opcoes: [
          opc('a', '10 vezes (W = S/(1 − ρ))', true, 'a 50% vale 2 S, a 70% vale 3,3 S, a 95% vale 20 S. Por isso o alvo de 60 a 70% de utilização.'),
          opc('b', '1,1 vez: sobra 10% de folga', false, 'o comportamento perto da saturação é não linear.'),
          opc('c', '2 vezes, como a 50%', false, 'a 50% é 2 S; a 90% é 10 S.')] },
      { id: 'e01b2-429', pergunta: 'Chegam 429 do provedor às 10h e o time dobra os pods dos workers. O que acontece?',
        opcoes: [
          opc('a', 'Mais tentativas contra a mesma cota fixa: mais 429, retries e custo de requisições que falham depois de gastar entrada', true, 'a cota do provedor não escala com a sua infraestrutura; antes de escalar, compare o TPM necessário com a cota concedida.'),
          opc('b', 'Os 429 caem pela metade', false, 'a carga contra o provedor não diminui; aumenta.'),
          opc('c', 'O custo cai, porque cada pod gasta menos', false, 'cada tentativa que falha depois de enviar a entrada ainda custa.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Num design review, alguém pergunta "e se o tráfego dobrar?" e a resposta "colocamos mais pods atrás do load balancer" é verdadeira para um serviço CRUD e falsa para um serviço que mantém 30 streams de 7 segundos por pod, depende de uma cota externa que não escala com pods e gasta dinheiro a cada requisição. Os blocos de construção são os mesmos de sempre; o que muda é o que cada um precisa garantir quando a unidade de trabalho é lenta, cara e limitada por um terceiro.</p>' },
        { tipo: 'abas', rotulo: 'Peça por peça', itens: [
          { rotulo: 'Load balancer', blocos: [
            { tipo: 'texto', html:
              '<p>Um <strong>load balancer</strong> distribui conexões ou requisições entre réplicas. Opera na camada 4 (conexões TCP, sem ler o conteúdo) ou na 7 (HTTP, com roteamento por caminho, cabeçalho ou tenant). O algoritmo importa mais com LLM do que em CRUD: round-robin supõe que todas as requisições custam parecido, e aqui uma dura 800 ms e outra 40 s.</p>' +
              '<ul><li>Prefira <strong>least outstanding requests</strong>: a réplica com menos requisições em voo recebe a próxima.</li>' +
              '<li>Ajuste os <em>timeouts</em> do balanceador para o tempo de um stream completo: o padrão de 60 s corta respostas longas no meio.</li>' +
              '<li>Faça <strong>connection draining</strong> no deploy, esperando os streams terminarem em vez de derrubá-los.</li>' +
              '<li>Use health checks que testem dependências leves (o pod está de pé e consegue falar com o gateway), nunca uma chamada de LLM real a cada 5 segundos.</li></ul>' }] },
          { rotulo: 'Cache', blocos: [
            { tipo: 'texto', html:
              '<p>Cache troca correção imediata por velocidade e custo. Cada camada serve a um fim: <strong>cliente</strong> (evita a requisição), <strong>CDN/borda</strong> (conteúdo público e estático), <strong>gateway</strong> (respostas de LLM repetidas), <strong>aplicação</strong> (resultados de recuperação, permissões, configuração) e <strong>banco</strong> (páginas e planos). Quanto mais perto do cliente, maior o ganho e mais difícil invalidar.</p>' +
              '<p>A invalidação tem quatro estratégias:</p>' +
              '<ul><li><strong>TTL</strong> (time to live): simples, tolera dado velho por até o TTL.</li>' +
              '<li><strong>Invalidação por evento</strong>: apaga a chave quando o dado muda; exige que toda escrita publique o evento e falha quando alguém esquece um caminho de escrita.</li>' +
              '<li><strong>Chave versionada</strong>: inclui na chave a versão do dado (hash do documento, versão do prompt, versão do índice), de modo que o dado novo é outra chave e o antigo expira sozinho. É a mais robusta e a que mais combina com LLM.</li>' +
              '<li><strong>Write-through</strong>: atualiza cache e fonte juntos e paga o custo na escrita.</li></ul>' +
              '<p>Dois defeitos pegam sistemas com LLM com força especial. O <strong>cache stampede</strong>: a chave quente expira, cem requisições idênticas perdem o cache ao mesmo tempo e disparam cem chamadas caras ao modelo; a defesa é <em>single-flight</em> (a primeira requisição busca, as demais esperam) mais TTL com <em>jitter</em> (variação aleatória para as chaves não expirarem juntas). E o <strong>vazamento entre escopos</strong>: se a chave não inclui tenant e permissões, o usuário B recebe a resposta construída com os documentos do usuário A.</p>' },
            { tipo: 'callout', tom: 'info', titulo: 'Chave de qualquer cache com conteúdo derivado de dados', html:
              '<p><code>(tenant, política de acesso, versão do corpus, versão do prompt, modelo, parâmetros, pergunta normalizada)</code></p>' }] },
          { rotulo: 'Filas', blocos: [
            { tipo: 'texto', html:
              '<p>Uma <strong>fila</strong> desacopla quem produz trabalho de quem o executa, absorve picos e permite repetir o que falhou. Quando a resposta leva mais tempo que o usuário espera, ou quando o trabalho tem efeito externo, o desenho é: a API grava a tarefa e devolve um identificador; workers processam; o cliente consulta o estado ou recebe uma notificação. Entrega pelo menos uma vez, <em>visibility timeout</em>, ordenação, DLQ (dead-letter queue, fila de mensagens que falharam repetidamente), idempotência e outbox estão no LT02; o que este módulo exige é a decisão: <strong>qual trabalho vai para a fila e qual fica no caminho síncrono</strong>.</p>' +
              '<p>Regra prática: síncrono (com stream) quando uma pessoa olha para a tela e a resposta cabe em poucos segundos; assíncrono quando dura mais que um minuto, causa efeito externo, ou pode esperar (batch, bloco 6).</p>' }] },
          { rotulo: 'Partição e consistência', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Particionamento</strong> (<em>sharding</em>) divide os dados entre nós por uma chave; <strong>replicação</strong> copia os dados para tolerar falha e escalar leitura. A chave de partição é a decisão de maior consequência. Em produtos multi-tenant a escolha natural é o tenant: isola vizinhos barulhentos, facilita residência de dados e exclusão, e simplifica a segurança por linha. O risco é a <strong>partição quente</strong>: um tenant grande concentra carga. Mitigações: sub-particionar tenants grandes, usar chave composta e limitar a concorrência por tenant.</p>' +
              '<p>Na replicação com líder e seguidores há <em>replication lag</em>. Para o índice de um RAG, minutos de atraso entre a edição de um documento e sua busca são aceitáveis; para permissões, não: um acesso revogado que continua valendo por 10 minutos é incidente de segurança. O desenho separa <strong>dados de relevância</strong> (consistência eventual, barata) de <strong>dados de autorização</strong> (consultados na fonte ou com TTL de segundos).</p>' +
              '<p>Em vez de escolher "forte" ou "eventual" em abstrato, pergunte por dado: o que acontece se o leitor vir uma versão velha? Para um catálogo de FAQ, nada. Para o saldo de créditos, cobrança errada. Para o estado de uma tarefa de agente, uma ação repetida ou perdida. Em IA há o dado mais perigoso: <strong>o que o modelo "sabe"</strong>. Um documento removido do índice por pedido de exclusão (LGPD) que continua em caches, embeddings antigos e respostas gravadas ainda é recuperável. Defina a cadeia de exclusão: fonte, chunks, vetores, cache, logs e conjuntos de avaliação.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'Os blocos são os mesmos, mas <mark>balanceie por requisições em voo</mark>, <mark>versione a chave</mark> do cache e separe <mark>relevância</mark> de <mark>autorização</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Rate limiting: o token bucket medido em tokens</h3>' +
          '<p>O <strong>rate limit</strong> protege o sistema e o orçamento contra excesso e distribui a cota do provedor entre tenants. O algoritmo clássico é o <strong>token bucket</strong>: um balde com capacidade (a rajada tolerada) que enche a uma taxa constante (o ritmo sustentado); cada requisição retira do balde e é negada se faltar. A adaptação essencial para LLM é medir o balde em <strong>tokens de modelo</strong>, não em requisições. O exemplo (verificado no texto-fonte) limita a 120.000 tokens por minuto com rajada de 10 segundos.</p>' },
        { tipo: 'rode', id: 'bb-rode', titulo: 'Cinco pedidos passam, a sexta espera', enunciado: 'Aperte Enter e clique nas etapas. Os valores vêm do exemplo verificado do bloco; a apresentação do terminal é ilustrativa.',
          prefixo: '$', entrada: 'python bucket.py', unidade: 's', terminalTitulo: 'token bucket de 120.000 TPM', etapas: etapasBalde(),
          prever: { pergunta: 'Cinco requisições de 3.850 tokens chegam juntas e a sexta chega um segundo depois. O que o limitador responde à sexta?', opcoes: [
            { id: 'a', texto: 'Permite: a taxa média está abaixo de 120.000 por minuto.', correta: false, porque: 'o balde tem 750 + 2.000 = 2.750 tokens e a sexta pede 3.850.' },
            { id: 'b', texto: 'Nega e manda esperar 0,55 s.', correta: true, porque: 'faltam 1.100 tokens; 1.100 ÷ 2.000 = 0,55 s, que vira o Retry-After do 429.' },
            { id: 'c', texto: 'Nega e manda esperar 1 minuto.', correta: false, porque: 'o balde repõe 2.000 tokens por segundo; a espera é a que falta, não a janela inteira.' }
          ] },
          tutorAntes: 'Preveja a resposta à sexta requisição e aperte Enter.',
          tutorDepois: 'O limitador calcula a espera exata; o cliente bem-comportado espera em vez de martelar.',
          callout: 'Você viu a rajada passar e a sexta receber um Retry-After calculado.' },
        { tipo: 'texto', html:
          '<p>Em produção o balde fica em Redis ou no gateway, com operação atômica, e existem baldes <strong>aninhados</strong>: por usuário, por tenant e global, este último refletindo a cota real do provedor. A resposta é <code>429 Too Many Requests</code> (RFC 6585) com o cabeçalho <code>Retry-After</code>.</p>' +
          '<h3>Backpressure e load shedding</h3>' +
          '<p><strong>Backpressure</strong> é o mecanismo pelo qual um componente lento sinaliza aos produtores que devem desacelerar. Sem ele, a fila cresce sem limite, a latência explode (uma requisição aceita agora só termina depois de todas as anteriores) e o sistema morre de memória depois de ter atendido ninguém dentro do prazo. As ferramentas: filas <strong>limitadas</strong> (tamanho máximo, com rejeição explícita), concorrência máxima por componente (semáforo), <em>timeouts</em> em todas as chamadas e <strong>load shedding</strong>, que é recusar trabalho cedo e barato (HTTP 429 ou 503 com <code>Retry-After</code>) para proteger o que já foi aceito. Rejeitar 10% das requisições com rapidez é melhor que aceitar todas e responder todas depois do timeout do cliente, quando o trabalho já é inútil mas ainda foi pago.</p>' +
          '<p>Com LLM há uma variante cara: a requisição abandonada pelo cliente continua gerando tokens no provedor, e você paga. Propague o cancelamento até o provedor (fechar o stream interrompe a geração em quem o suporta) e dê às tarefas assíncronas um <em>deadline</em> após o qual são descartadas.</p>' },
        { tipo: 'takeaway', html: 'Limite em <mark>tokens</mark>, não em requisições, e <mark>rejeite cedo</mark> com <mark>Retry-After</mark> em vez de aceitar tudo e responder tarde.' }
      ] },

      { rotulo: 'Lei de Little', blocos: [
        { tipo: 'texto', html:
          '<h3>O dimensionador universal</h3>' +
          '<p>A <strong>lei de Little</strong> (J. D. C. Little, 1961) afirma que, num sistema estável, o número médio de itens dentro dele é <code>L = λ x W</code>, com λ a taxa média de chegada e W o tempo médio que cada item passa no sistema. Não depende da distribuição das chegadas nem da ordem de atendimento. Converte QPS e latência em tamanhos concretos:</p>' +
          '<ul><li><strong>Streams abertos:</strong> 4,17 req/s x 7 s ≈ 29 conexões simultâneas. Se cada pod sustenta 50, um pod basta em teoria e três em prática.</li>' +
          '<li><strong>Workers de uma fila:</strong> 1,39 tarefas/s x 110 s = 153 tarefas em execução; se cada worker faz uma por vez e queremos 70% de utilização, 153 ÷ 0,7 = 219 workers.</li>' +
          '<li><strong>Pool de conexões ao banco, threads, slots no provedor:</strong> mesma conta, com W sendo o tempo de ocupação do recurso.</li></ul>' +
          '<p>Duas ressalvas. A lei dá o <em>valor médio</em>; a variação em torno dele (a cauda) exige folga, por isso dimensionamos para 60 a 70% de utilização, não 100%. E o comportamento perto da saturação é não linear: numa fila simples (M/M/1), o tempo no sistema é <code>W = S/(1 − ρ)</code>, com S o tempo de serviço e ρ a utilização.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Utilização ρ</th><th>Tempo no sistema</th></tr></thead><tbody>' +
          '<tr><td>50%</td><td>2 S</td></tr><tr><td>70%</td><td>3,3 S</td></tr><tr><td>90%</td><td>10 S</td></tr><tr><td>95%</td><td>20 S</td></tr></tbody></table>' },
        { tipo: 'texto', html:
          '<p>Um sistema "com 90% de CPU" não está com 10% de folga; está a um pequeno aumento de carga de colapso. É a razão matemática do alvo de 70%, e da recomendação de <em>The Tail at Scale</em> (Dean e Barroso, 2013) de projetar para a cauda e não para a média.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          '<p>Escalar horizontalmente os workers quando o gargalo é a <strong>cota do provedor</strong>. Dobrar os pods dobra a taxa de tentativas e, com cota fixa, só aumenta o volume de 429, os retries e o custo de requisições que falham depois de gastar entrada. Antes de escalar, calcule o TPM necessário e compare com a cota concedida; o limite que importa é o que não escala com a sua infraestrutura.</p>' },
        { tipo: 'takeaway', html: 'Little converte <mark>QPS x latência</mark> em conexões e workers; projete para <mark>60 a 70%</mark> de utilização, porque a saturação é <mark>não linear</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'cenario', id: 'bb-cenario', titulo: '429 do provedor às 10h', obrigatorio: false,
          enunciado: 'O assistente de suporte começa a receber 429 do provedor todo dia às 10h, quando os usuários chegam juntos.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O time propõe uma correção rápida. Qual você defende?', opcoes: [
              { texto: 'Dobrar o número de pods dos workers para absorver o pico.', vai: 'f-pods', tom: 'ruim', consequencia: 'a cota é fixa: dobrar pods dobra a taxa de tentativas contra ela.' },
              { texto: 'Calcular o TPM de pico, compará-lo com a cota concedida e só então decidir.', vai: 'conta', tom: 'ok', consequencia: 'o limite que importa não escala com a sua infraestrutura.' },
              { texto: 'Aumentar o número de retries para as requisições passarem eventualmente.', vai: 'f-retry', tom: 'ruim', consequencia: 'retry sem backoff nem jitter transforma uma falha curta em tempestade que a prolonga.' }
            ] },
            conta: { texto: 'A conta mostra que o TPM necessário excede a cota. Como você protege os tenants e o orçamento?', opcoes: [
              { texto: 'Um balde global por tenant em tokens, mais backoff exponencial com jitter respeitando Retry-After, dentro de um deadline total.', vai: 'sobra', tom: 'ok', consequencia: 'cada cliente consome só a sua parte e o excesso é rejeitado cedo.' },
              { texto: 'Um limite global único em requisições por minuto.', vai: 'f-global', tom: 'ruim', consequencia: 'um cliente consome a cota de todos, e requisições de 30.000 tokens passam como se pesassem 200.' }
            ] },
            sobra: { texto: 'Ainda falta capacidade no pico. O que entra no cronograma do projeto?', opcoes: [
              { texto: 'Solicitar aumento de cota com semanas de antecedência e preparar a resposta degradada enquanto isso.', vai: 'f-bom', tom: 'ok', consequencia: 'cotas crescem por pedido e por histórico de gasto, não instantaneamente.' },
              { texto: 'Esperar o provedor aumentar a cota quando o uso crescer.', vai: 'f-espera', tom: 'ruim', consequencia: 'o provedor aprova por processo, não por sprint; o sistema cai no pico seguinte.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Baldes aninhados em tokens, retries com limite, rejeição cedo e um pedido de cota feito com antecedência. O pico das 10h deixa de ser incidente.' },
            'f-pods': { bom: false, texto: 'Mais pods, mais tentativas, mais 429 e mais custo de requisições que falham depois de gastar entrada.' },
            'f-retry': { bom: false, texto: 'Os retries prolongaram a falha exatamente quando o provedor estava mal.' },
            'f-global': { bom: false, texto: 'O cliente maior consumiu a cota de todos, e os menores passaram a receber 429.' },
            'f-espera': { bom: false, texto: 'A cota não veio a tempo. O assistente virou página de erro justo no pico.' }
          },
          callout: 'Você calculou antes de escalar, limitou em tokens por tenant e planejou o aumento de cota.' },
        { tipo: 'python', id: 'bb-python-balde', titulo: 'Implemente o token bucket', obrigatorio: false,
          enunciado: 'Complete <code>try_spend</code>: repõe até a capacidade, registra o instante, retira se couber e devolve <code>0.0</code>; senão devolve os segundos a esperar (o <code>Retry-After</code>). Acréscimo deste exercício: pedido maior que a capacidade nunca passa, então levante <code>ValueError</code>.',
          codigo: codigoBalde, testes: testesBalde,
          dica: 'Nível = <code>min(capacity, level + (now - last) * refill_per_s)</code>. Negar não consome nada. A espera é <code>(cost - level) / refill_per_s</code>.',
          solucao: solucaoBalde,
          tutorDepois: 'O controle negativo importa: um pedido negado não pode gastar o balde, senão o cliente que espera é punido duas vezes.',
          callout: 'O limitador reproduz a sequência do texto: cinco permitidos e a sexta com 0,55 s.' },
        { tipo: 'python', id: 'bb-python-little', titulo: 'Dimensione com Little e M/M/1', obrigatorio: false,
          enunciado: 'Implemente <code>em_voo</code> (L = λ x W), <code>unidades</code> (arredonda para cima conforme a utilização-alvo) e <code>tempo_mm1</code> (S / (1 − ρ), com <code>ValueError</code> fora de [0, 1)).',
          codigo: codigoLittle, testes: testesLittle,
          dica: '<code>unidades = ceil(L / (capacidade * utilizacao))</code>. Em M/M/1, ρ igual a 1 significa tempo infinito: recuse.',
          solucao: solucaoLittle,
          tutorDepois: 'A 100% de utilização um pod "basta" na média e colapsa na cauda; a 70% você precisa de dois.',
          callout: 'Little e M/M/1 reproduzem os números do texto: 48 conexões, 2 pods, 219 workers.' },
        { tipo: 'complete', id: 'bb-complete', titulo: 'Monte a chave do cache de respostas', obrigatorio: false, linguagem: 'python',
          enunciado: 'Escolha o valor certo de cada lacuna para que a chave não vaze entre tenants e invalide sozinha quando o corpus ou o prompt mudar.',
          partes: [
            'def chave(req):\n    return (\n        req.',
            { lacuna: 'a', opcoes: ['tenant_id', 'session_id', 'timestamp'], correta: 'tenant_id' },
            ',\n        req.',
            { lacuna: 'b', opcoes: ['grupos_de_acesso', 'ip', 'idioma_do_navegador'], correta: 'grupos_de_acesso' },
            ',\n        corpus.',
            { lacuna: 'c', opcoes: ['versao', 'tamanho', 'nome'], correta: 'versao' },
            ',\n        prompt.',
            { lacuna: 'd', opcoes: ['versao', 'tamanho', 'autor'], correta: 'versao' },
            ',\n        req.modelo, req.parametros,\n        normalizar(req.',
            { lacuna: 'e', opcoes: ['pergunta', 'cabecalhos', 'cookies'], correta: 'pergunta' },
            '),\n    )\n'
          ],
          explicacao: 'Tenant e grupos de acesso impedem que o usuário B receba a resposta construída com os documentos do usuário A. Versões de corpus e de prompt fazem o dado novo ser outra chave: o antigo expira sozinho, sem invalidação por evento.',
          callout: 'Chave com escopo e versões: sem vazamento entre tenants e sem invalidação manual.' },
        { tipo: 'escolha', id: 'bb-escolha-pods', titulo: 'Confira: quantos pods para 6 req/s',
          pergunta: 'Streams de resposta: 6 req/s chegando, cada uma ocupa a conexão por 8 s. Um pod sustenta 50 conexões simultâneas e a meta é 70% de utilização. Quantos pods?',
          opcoes: [
            { id: 'a', texto: '1 pod: 48 conexões cabem nas 50.', correta: false, porque: 'a utilização seria 96%, e perto da saturação o tempo no sistema explode.' },
            { id: 'b', texto: '2 pods: L = 6 x 8 = 48; a 70% cada pod entrega 35, logo 48 ÷ 35 ≈ 1,4, arredonda para 2.', correta: true, porque: 'a lei dá o valor médio; a cauda pede folga, por isso 60 a 70% de utilização.' },
            { id: 'c', texto: '48 pods: um por conexão.', correta: false, porque: 'cada pod sustenta 50 conexões.' },
            { id: 'd', texto: '6 pods: um por requisição por segundo.', correta: false, porque: 'o que importa é o tempo de ocupação, não a taxa isolada.' }
          ], tutorDepois: 'λ x W primeiro, depois a capacidade e a meta de utilização.' },
        { tipo: 'escolha', id: 'bb-escolha-cache', titulo: 'Confira: a chave quente que expirou',
          pergunta: 'Uma chave quente de cache expira e cem requisições idênticas chegam no mesmo instante, todas indo ao modelo. Qual a defesa combinada?',
          opcoes: [
            { id: 'a', texto: 'Aumentar o número de réplicas do gateway.', correta: false, porque: 'mais réplicas disparam ainda mais chamadas caras.' },
            { id: 'b', texto: 'Single-flight (a primeira busca, as demais esperam) e TTL com jitter.', correta: true, porque: 'evita o stampede e impede que as chaves expirem juntas.' },
            { id: 'c', texto: 'Remover o TTL e nunca invalidar.', correta: false, porque: 'o dado velho passa a valer para sempre.' },
            { id: 'd', texto: 'Trocar para round-robin.', correta: false, porque: 'balanceamento não tem relação com expiração de chave.' }
          ], tutorDepois: 'Stampede é o defeito do cache quente; jitter e single-flight são o remédio.' },
        { tipo: 'callout', tom: 'info', titulo: 'Decisões', html:
          '<ul><li><strong>Balanceamento:</strong> round-robin é simples; least outstanding equilibra durações desiguais. Com LLM, a segunda.</li>' +
          '<li><strong>Invalidação:</strong> TTL é trivial e deixa dado velho; chave versionada não invalida e gera mais chaves. Para corpus e prompt, a segunda.</li>' +
          '<li><strong>Síncrono ou assíncrono:</strong> stream dá UX direta; fila absorve pico e permite retry. Decide a duração, o efeito externo e o prazo.</li>' +
          '<li><strong>Chave de partição:</strong> tenant isola e simplifica segurança; hash do item distribui uniforme. Decide o tamanho relativo dos tenants.</li>' +
          '<li><strong>Rate limit:</strong> em requisições é simples; em tokens reflete custo e cota. Com LLM, em tokens.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Fila sem limite e sem deadline, que transforma sobrecarga em latência infinita.</li><li>Timeout do load balancer menor que a duração do stream.</li><li>Rate limit global sem divisão por tenant: um cliente consome a cota de todos.</li><li>Retry sem backoff e sem jitter: uma falha curta vira tempestade de requisições que a prolonga.</li><li>Cache de resposta sem tenant na chave.</li></ul>' },
        { tipo: 'takeaway', html: 'Antes de escalar, compare o <mark>TPM necessário</mark> com a <mark>cota concedida</mark>; o limite que importa não escala com a sua infraestrutura.' }
      ] }
    ]
  });
})();
