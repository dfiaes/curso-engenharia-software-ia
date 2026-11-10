/* M11 · Bloco 7 (aula 4): servir local e preservar a porta do M05. Fonte: M11.html#b07. Comandos de servidor (curl, pull, run, ps) ficam na trilha externa; aqui tudo roda sem servidor. Saídas de dimensionar_local.py e validar_local calculadas em CPython com o contrato do módulo (modelo ilustrativo de 8B); são exemplo variável. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasDimensionar = function () {
    return [
      { id: 'folga', nome: 'VRAM folgada', descricao: '24 GB, ctx 8192, 1 slot', tom: 'dns', ms: 24, linhas: [
        L('cmd', 'python dimensionar_local.py --vram 24 --ctx-max 8192 --parallel 1'),
        L('out', 'Q8_0 ctx=8192 parallel=1'),
        L('hint', 'sobra memória: o maior quant da escada cabe com o contexto pedido')] },
      { id: 'prod', nome: 'Produção: 128k × 4', descricao: '24 GB, ctx 131072, 4 slots', tom: 'tcp', ms: 24, linhas: [
        L('cmd', 'python dimensionar_local.py --vram 24 --ctx-max 131072 --parallel 4'),
        L('out', 'Q8_0 ctx=4096 parallel=4 (reduzido)'),
        L('hint', 'nenhum quant faz 64 GB de KV caber em 24 GB; o contrato reduz o contexto e mantém a concorrência pedida')] },
      { id: 'curta', nome: 'VRAM curta', descricao: '4 GB, ctx 8192, 1 slot', tom: 'tls', ms: 4, linhas: [
        L('cmd', 'python dimensionar_local.py --vram 4 --ctx-max 8192 --parallel 1'),
        L('out', 'API'),
        L('hint', 'nem o menor quant (Q3_K_S) cabe com overhead e KV: a resposta honesta é manter a etapa em API')] }
    ];
  };

  var etapasKnobs = function () {
    return [
      { id: 'host', nome: 'Host', descricao: 'politica_host: localhost por padrão', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python -c "from provedor_local import *; print(politica_host(ConfigOllama()))"'),
        L('out', 'http://127.0.0.1:11434/v1'),
        L('hint', 'host padrão 127.0.0.1: só a própria máquina alcança o servidor')] },
      { id: 'ctx', nome: 'num_ctx', descricao: 'n_ctx contra o prompt estimado', tom: 'tcp', ms: 1, linhas: [
        L('cmd', 'python -c "...print(validar_local(ConfigOllama(n_ctx=8192), 6000))"'),
        L('out', '[]'),
        L('hint', 'lista vazia aprova: o contexto comporta o prompt, system incluído')] },
      { id: 'par', nome: 'parallel × VRAM', descricao: 'cada slot carrega seu KV', tom: 'tls', ms: 1, linhas: [
        L('cmd', 'python -c "...factivel(8, \'Q4_K_M\', 8192, 1)"'),
        L('out', 'True   # 6.82 GB de 8 GB'),
        L('hint', 'com 1 slot cabe; a falha aparece quando você declara mais slots')] },
      { id: 'keep', nome: 'keep_alive', descricao: 'campo explícito por requisição', tom: 'request', ms: 1, linhas: [
        L('cmd', 'python -c "...ConfigOllama(keep_alive=\'-1\')..."'),
        L('out', '[]'),
        L('hint', '-1 retém o modelo carregado; 0 libera; minutos ("5m") descarregam após o intervalo')] }
    ];
  };

  var codigoLocal = [
    'from dataclasses import dataclass', '', '',
    '@dataclass(frozen=True, slots=True)', 'class ConfigOllama:', '    host: str = "127.0.0.1"', '    porta: int = 11434',
    '    n_ctx: int = 8192', '    keep_alive: str = "5m"', '    paralelo: int = 1', '    exige_auth_no_proxy: bool = True', '', '',
    'def politica_host(cfg):', '    # recuse 0.0.0.0 sem proxy autenticado (ValueError); senão devolva a base_url',
    '    return ""', '', '',
    'def validar_local(cfg, prompt_estimado):', '    erros = []',
    '    # n_ctx menor que o prompt -> "num_ctx menor que o prompt: system sera truncado"',
    '    # paralelo < 1 -> "paralelo minimo e 1"',
    '    # keep_alive que nao seja "-1", "0" nem termine em "m" -> "keep_alive deve ser \'-1\', \'0\' ou minutos"',
    '    return erros', '', '',
    'def converter_resposta(bruta):', '    """bruta: dict como o transporte devolve. Retorna (entrada, saida, custo_usd, confianca)."""',
    '    # usage vem de bruta["usage"] com chaves prompt e completion; custo local e sempre 0.0',
    '    # confianca e a media de bruta["logprobs"], ou None se nao houver',
    '    return (0, 0, 1.0, 0.0)', '', '',
    'print(politica_host(ConfigOllama()))', ''].join('\n');
  var testesLocal = [
    'def test_localhost_aprova():', '    assert politica_host(ConfigOllama()) == "http://127.0.0.1:11434/v1"', '', '',
    'def test_0000_sem_proxy_autenticado_levanta():', '    try:', '        politica_host(ConfigOllama(host="0.0.0.0"))', '    except ValueError:', '        return',
    '    raise AssertionError("esperava ValueError")', '', '',
    'def test_0000_atras_de_proxy_autenticado_passa():', '    c = ConfigOllama(host="0.0.0.0", exige_auth_no_proxy=False)', '    assert politica_host(c) == "http://0.0.0.0:11434/v1"', '', '',
    'def test_ctx_curto_acusa_truncamento():', '    erros = validar_local(ConfigOllama(n_ctx=4096), 6000)',
    '    assert erros == ["num_ctx menor que o prompt: system sera truncado"]', '', '',
    'def test_config_boa_aprova_e_borda_exata_passa():', '    assert validar_local(ConfigOllama(n_ctx=8192), 6000) == []', '    assert validar_local(ConfigOllama(n_ctx=6000), 6000) == []', '', '',
    'def test_paralelo_e_keep_alive():', '    assert validar_local(ConfigOllama(paralelo=0), 100) == ["paralelo minimo e 1"]',
    '    assert validar_local(ConfigOllama(keep_alive="30s"), 100) == ["keep_alive deve ser \'-1\', \'0\' ou minutos"]',
    '    assert validar_local(ConfigOllama(keep_alive="-1"), 100) == []', '', '',
    'def test_converter_preserva_usage_custo_zero_e_confianca():',
    '    r = converter_resposta({"text": "ok", "usage": {"prompt": 120, "completion": 30}, "logprobs": [-0.1, -0.3]})',
    '    assert r[0] == 120 and r[1] == 30 and r[2] == 0.0 and abs(r[3] - (-0.2)) < 1e-9', '', '',
    'def test_converter_sem_usage_nem_logprobs():', '    assert converter_resposta({"text": "ok"}) == (0, 0, 0.0, None)', ''].join('\n');
  var solucaoLocal = [
    'from dataclasses import dataclass', '', '',
    '@dataclass(frozen=True, slots=True)', 'class ConfigOllama:', '    host: str = "127.0.0.1"', '    porta: int = 11434',
    '    n_ctx: int = 8192', '    keep_alive: str = "5m"', '    paralelo: int = 1', '    exige_auth_no_proxy: bool = True', '', '',
    'def politica_host(cfg):', '    if cfg.host == "0.0.0.0" and cfg.exige_auth_no_proxy:', '        raise ValueError("0.0.0.0 exige proxy autenticado")',
    '    return f"http://{cfg.host}:{cfg.porta}/v1"', '', '',
    'def validar_local(cfg, prompt_estimado):', '    erros = []', '    if cfg.n_ctx < prompt_estimado:',
    '        erros.append("num_ctx menor que o prompt: system sera truncado")', '    if cfg.paralelo < 1:', '        erros.append("paralelo minimo e 1")',
    '    if cfg.keep_alive not in ("-1", "0") and not cfg.keep_alive.endswith("m"):',
    '        erros.append("keep_alive deve ser \'-1\', \'0\' ou minutos")', '    return erros', '', '',
    'def converter_resposta(bruta):', '    uso = bruta.get("usage", {})', '    lps = bruta.get("logprobs", [])',
    '    conf = (sum(lps) / len(lps)) if lps else None',
    '    return int(uso.get("prompt", 0)), int(uso.get("completion", 0)), 0.0, conf', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm11-b4',
    titulo: 'Servir local: Ollama, vLLM e a porta do M05',
    minutos: 35,
    resumo: 'Trocar o motor custa um arquivo novo e duas linhas se o código de chamada não distingue API de servidor local. Três knobs do servidor e a política de host decidem se o produto funciona ou degrada em silêncio.',
    objetivo: 'Escolher o servidor local pelo critério, validar num_ctx, parallel e keep_alive sem servidor, aplicar a política localhost-por-padrão, plugar o provedor atrás da porta do M05 e dimensionar (quant, ctx, parallel) pela VRAM.',
    revisao: [
      { id: 'm11b4-servidor', pergunta: 'Quando faz sentido vLLM em vez de Ollama?',
        opcoes: [
          opc('a', 'Em GPU com concorrência real de usuários (continuous batching + PagedAttention); com um usuário só a diferença não aparece', true, 'sem concorrência medida, o custo operacional chega antes do ganho. Começar pelo Ollama mantém a troca em configuração.'),
          opc('b', 'Sempre, porque é o servidor de produção', false, 'prova local primeiro, com a mesma porta; vLLM entra quando a fila e a GPU existem.'),
          opc('c', 'Na máquina de desenvolvimento sem GPU', false, 'o vLLM nasceu para GPU e para escala.')] },
      { id: 'm11b4-ctx', pergunta: 'O que acontece quando o prompt excede o contexto padrão de 4096 do Ollama?',
        opcoes: [
          opc('a', 'Trunca em silêncio e descarta o começo, onde mora o system; defesa: forçar num_ctx por requisição e validar n_ctx ≥ prompt estimado', true, 'nenhum erro, só resposta pior. Elevar num_ctx eleva o KV (Bloco 6).'),
          opc('b', 'Erro explícito de contexto excedido', false, 'não há erro; é o que torna a armadilha perigosa.'),
          opc('c', 'O servidor amplia o contexto sozinho', false, 'o contexto é configuração, e ampliar custa KV.')] },
      { id: 'm11b4-host', pergunta: 'Qual é a política de host para o servidor local?',
        opcoes: [
          opc('a', 'localhost por padrão; 0.0.0.0 só atrás de proxy autenticado, na prática a API do M03 com auth, rate limit e auditoria', true, 'sem autenticação, qualquer host com alcance gera texto, lista modelos e consome GPU.'),
          opc('b', '0.0.0.0 facilita a demo e pode ficar aberto', false, 'facilita também o invasor; porta aberta sem identidade reprova o oráculo de exposição.'),
          opc('c', 'Qualquer host, desde que a porta seja alta', false, 'número de porta não é autenticação.')] },
      { id: 'm11b4-adapter', pergunta: 'O que o adapter local faz atrás da porta do M05, além de chamar o servidor?',
        opcoes: [
          opc('a', 'Força num_ctx e keep_alive por chamada, traduz usage para o tipo Uso com custo_usd=0.0 e propaga logprobs', true, 'nenhum arquivo em retrieval, agent ou api muda: um arquivo novo e duas linhas no factory.'),
          opc('b', 'Reescreve o domínio para o formato do Ollama', false, 'o domínio depende da abstração, não do adapter.'),
          opc('c', 'Cobra o custo por token do hardware', false, 'o custo na chamada é 0.0; o custo amortizado entra no Bloco 8.')] },
      { id: 'm11b4-adr', pergunta: 'Como o ADR-0005 trata "onde vale modelo local" no Cartógrafo?',
        opcoes: [
          opc('a', 'Por etapa, cada linha vira item de ADR com contexto, decisão e consequências, e com gatilho de revisão explícito', true, 'a resposta honesta quase nunca é tudo local nem nada local. Exemplo de gatilho: revisar quando um modelo aberto passar de 85% no eval próprio de tool calling.'),
          opc('b', 'Tudo local, para economizar', false, 'redação do relatório final e loop de agente são os pontos mais fracos do local.'),
          opc('c', 'Nada local, porque API é sempre melhor', false, 'embeddings e classificação barata são os melhores candidatos a local.')] }
    ],
    abas: [
      { rotulo: 'Escolher o servidor', blocos: [
        { tipo: 'texto', html:
          '<h3>Por que a porta do M05 decide este bloco</h3>' +
          '<p>Voltamos ao cliente cujo código não pode sair da rede. A condição técnica para atendê-lo é uma só: <strong>o código de chamada não distingue API de servidor local</strong>. O M05 definiu a porta <code>ChatProvider</code>: o domínio depende da abstração e os adapters dependem da mesma abstração. A segunda implementação mede a primeira (DIP, inversão de dependência): trocar o motor inteiro custa <strong>um arquivo novo e duas linhas</strong> no factory e na configuração. Fora de <code>services/llm/providers/</code>, nenhum arquivo muda. A abstração de <em>tool calling</em> vaza entre provedores por formato; o Bloco 8 mostra onde.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Ferramenta</th><th>O que é</th><th>Melhor para</th><th>Não use para</th></tr></thead><tbody>' +
          '<tr><td><strong>Ollama</strong></td><td>Servidor que embrulha o <code>llama.cpp</code> com gerenciamento de modelos, API própria e endpoint compatível com OpenAI</td><td>Desenvolvimento local, provas de conceito, instalação single-box no cliente</td><td>Alta concorrência: o padrão é 1 requisição paralela por modelo</td></tr>' +
          '<tr><td><strong>llama.cpp</strong></td><td>O motor de inferência em C++ por baixo; <code>llama-server</code> expõe HTTP</td><td>Controle fino de flags, hardware exótico, embarcar em outro produto</td><td>Quando você quer conveniência: a gestão de modelos é manual</td></tr>' +
          '<tr><td><strong>LM Studio</strong></td><td>Aplicativo desktop com GUI, catálogo e servidor local</td><td>Explorar modelos, comparar quants visualmente, demonstrar para não técnico</td><td>Servidor headless: é uma app de desktop</td></tr>' +
          '<tr><td><strong>vLLM</strong></td><td>Servidor de inferência de produção, com <em>PagedAttention</em> e <em>continuous batching</em></td><td>Servir muitos usuários em GPU com vazão alta</td><td>Sua máquina de dev sem GPU: nasceu para GPU e para escala</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Continuous batching e PagedAttention', html:
          '<p>Requisições geram quantidades distintas de tokens. O batch tradicional prende o lote na requisição mais longa. O <strong>continuous batching</strong> troca a requisição terminada por uma nova a cada passo de geração. A <strong>PagedAttention</strong> aloca o KV do Bloco 6 em páginas fixas, como memória virtual, em vez de um bloco contíguo por requisição: elimina fragmentação e eleva o número de simultâneas na mesma VRAM. A combinação explica por que o vLLM vence em GPU sob concorrência; com um usuário só, a diferença não aparece. Ganhos citados em material de produto variam por carga e hardware, e nenhum multiplicador aqui é medida.</p>' },
        { tipo: 'texto', html:
          '<p><strong>O critério:</strong> Ollama para desenvolver e para single-box; vLLM com concorrência real e GPU. Comece pelo Ollama mesmo com destino vLLM, porque a API compatível com OpenAI mantém a troca em configuração, não em código. "Começar pelo vLLM porque é produção" é o erro: sem concorrência medida, o custo operacional chega antes do ganho.</p>' },
        { tipo: 'takeaway', html: 'Ollama para <mark>desenvolver e single-box</mark>; vLLM quando há <mark>GPU e concorrência real</mark>; a porta do M05 mantém a troca em <mark>configuração</mark>.' }
      ] },

      { rotulo: 'Armadilhas do Ollama', blocos: [
        { tipo: 'texto', html:
          '<h3>Três knobs e uma política de host</h3>' +
          '<p>Cada armadilha é um knob de <code>ConfigOllama</code> com validação local, sem servidor: <code>validar_local</code> recusa valor perigoso antes de qualquer chamada. Os nomes que importam são <code>host</code>, <code>num_ctx</code>, <code>parallel</code>, <code>keep_alive</code>, <code>max_loaded_models</code> e o diretório de modelos; os valores de ambiente do servidor pertencem à trilha externa opcional, onde Docker, Ollama ou GPU ausentes fazem o oráculo live nascer BLOCKED com registro.</p>' +
          '<ul><li><strong>Armadilha 1, contexto curto.</strong> O padrão de 4096 recebe um prompt maior e corta o começo, onde mora o system. Nenhum erro, só resposta pior. Defesa no adapter: forçar <code>num_ctx</code> por requisição e validar <code>n_ctx &gt;= prompt_estimado</code>. Elevar <code>num_ctx</code> eleva o KV.</li>' +
          '<li><strong>Armadilha 2, paralelismo 1.</strong> A segunda requisição simultânea espera, não falha, e o p95 explode sob concorrência. Medir uma por vez esconde a fila de quatro workers. Defesa: declarar <code>paralelo</code> e validar <code>num_ctx × paralelo</code> contra a VRAM via <code>orcamento_vram</code>, porque cada slot carrega seu KV.</li>' +
          '<li><strong>Armadilha 3, unload em 5 minutos.</strong> A primeira chamada após o intervalo paga a carga dos pesos, e uma medição sem aquecimento mistura carga com inferência. Defesa: <code>keep_alive</code> explícito por requisição (<code>-1</code> retém, <code>0</code> libera); single-box de produção fixa <code>-1</code> e reserva a memória.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: '0.0.0.0 sem auth expõe o servidor', html:
          '<p>Sem autenticação, qualquer host com alcance gera texto, lista modelos e consome GPU. Política congelada: <strong>localhost por padrão; <code>0.0.0.0</code> só atrás de proxy autenticado</strong>, na prática a API do M03, com auth, rate limit e auditoria. "0.0.0.0 facilita a demo" facilita também o invasor: demo em rede usa proxy autenticado ou túnel com identidade. O M12 volta com a checagem completa.</p>' },
        { tipo: 'quebre', id: 'm11b4-quebre', titulo: 'Quebre a configuração de propósito', enunciado: 'Escolha uma falha, rode, e depois rode "Sem falha" para fechar o exercício. Cada falha é um knob real do contrato; a etapa que falha é trocada pela mensagem de <code>validar_local</code> ou <code>politica_host</code>.',
          prefixo: '$', entrada: 'python -c "from provedor_local import *; print(politica_host(ConfigOllama()))"', unidade: 'ms', terminalTitulo: 'provedor_local', etapas: etapasKnobs(),
          prever: { pergunta: 'Você vai provocar uma configuração perigosa (contexto curto, slots demais, keep_alive inválido ou host aberto). O que um servidor sem a validação local faz?', opcoes: [
            { id: 'a', texto: 'Devolve sempre um erro claro, que aponta o knob errado.', correta: false, porque: 'o perigo é justamente a ausência de erro: o servidor degrada ou expõe sem avisar.' },
            { id: 'b', texto: 'Degrada em silêncio: trunca o system, enfileira, cobra a carga de volta ou fica exposto, sem mensagem de erro.', correta: true, porque: 'cada armadilha é silenciosa; a validação local recusa o valor antes da primeira chamada.' },
            { id: 'c', texto: 'Corrige a configuração sozinho para o valor seguro.', correta: false, porque: 'o servidor aceita o valor que você declarou, mesmo perigoso.' }
          ] },
          falhas: [
            { id: 'ctx', rotulo: 'num_ctx menor que o prompt', efeito: { etapaFalha: 'ctx', linhasErro: [
              { kind: 'cmd', text: 'python -c "...print(validar_local(ConfigOllama(n_ctx=4096), 6000))"' },
              { kind: 'out', text: "['num_ctx menor que o prompt: system sera truncado']" },
              { kind: 'hint', text: 'sem a validação, nenhum erro: o começo do prompt some e a resposta piora' }
            ], tutor: 'o começo do prompt é onde mora o system. Forçar num_ctx por requisição e validar n_ctx >= prompt estimado fecha a armadilha; elevar num_ctx custa KV, então a mudança passa pela conta de VRAM.' } },
            { id: 'par', rotulo: 'parallel × contexto não cabe na VRAM', efeito: { etapaFalha: 'par', linhasErro: [
              { kind: 'cmd', text: 'python -c "...factivel(8, \'Q4_K_M\', 8192, 4)"' },
              { kind: 'out', text: 'False   # 9.82 GB estimados contra 8 GB' },
              { kind: 'hint', text: 'pesos 4.32 + KV 4.00 (4 slots de 8192) + overhead 1.50' }
            ], tutor: 'cada slot paralelo carrega seu KV. Com 1 slot são 6.82 GB; com 4 slots o KV sozinho é 4.00 GB e o total passa de 8 GB. Sem a conta, o servidor descarrega camadas para a CPU e a vazão cai sem erro.' } },
            { id: 'keep', rotulo: 'keep_alive em formato inválido', efeito: { etapaFalha: 'keep', linhasErro: [
              { kind: 'cmd', text: 'python -c "...validar_local(ConfigOllama(keep_alive=\'30s\'), 100)"' },
              { kind: 'out', text: "[\"keep_alive deve ser '-1', '0' ou minutos\"]" },
              { kind: 'hint', text: 'o padrão descarrega o modelo após 5 minutos de ociosidade' }
            ], tutor: 'sem keep_alive explícito, a primeira chamada depois do intervalo paga a carga dos pesos e distorce a medição. Single-box de produção fixa -1 e reserva a memória.' } },
            { id: 'host', rotulo: 'host 0.0.0.0 sem proxy autenticado', efeito: { etapaFalha: 'host', linhasErro: [
              { kind: 'cmd', text: 'python -c "...politica_host(ConfigOllama(host=\'0.0.0.0\'))"' },
              { kind: 'out', text: 'ValueError: 0.0.0.0 exige proxy autenticado' },
              { kind: 'hint', text: 'o adapter nem chega a ser construído' }
            ], tutor: 'a política é localhost por padrão. Para expor na rede, o servidor fica atrás de um proxy autenticado (a API do M03), nunca aberto direto.' } }
          ],
          tutorAntes: 'Aperte Enter, escolha uma falha e rode de novo; no fim, rode "Sem falha".',
          tutorDepois: 'Todas as falhas são recusadas antes de qualquer chamada ao servidor, e custam uma linha de validação. É o contrário do comportamento do servidor sozinho, que degrada em silêncio.',
          callout: 'Você viu os quatro defeitos de configuração recusados antes da primeira chamada.' },
        { tipo: 'takeaway', html: 'Contexto curto <mark>trunca o system</mark>, parallel 1 <mark>enfileira</mark>, unload <mark>cobra a carga</mark>; e <mark>0.0.0.0</mark> só atrás de proxy autenticado.' }
      ] },

      { rotulo: 'A porta e o dimensionamento', blocos: [
        { tipo: 'texto', html:
          '<h3>O provedor atrás da porta do M05</h3>' +
          '<p>O servidor local fala o dialeto OpenAI em <code>/v1</code>, inclusive <code>usage</code>. O adapter faz três coisas além de chamar: <strong>força <code>num_ctx</code> e <code>keep_alive</code> por chamada</strong>, <strong>traduz <code>usage</code> para o tipo <code>Uso</code> do gateway com <code>custo_usd=0.0</code></strong> e <strong>propaga <code>logprobs</code></strong> para o <code>resumir</code> do Bloco 1. O registro no factory é um <code>match</code>: um arquivo novo e duas linhas. Nenhum arquivo em retrieval, agent ou api muda. Na referência, o transporte é injetável (uma função que recebe URL e corpo e devolve o JSON), então tudo se testa sem servidor e sem rede.</p>' },
        { tipo: 'texto', html:
          '<h3>Do orçamento ao parâmetro de servidor</h3>' +
          '<p>A referência <code>lab/dimensionar_local.py</code> reaproveita o <code>orcamento_vram</code> do Bloco 6: dada a VRAM, devolve o maior quant da escada (<code>Q8_0</code>, <code>Q6_K</code>, <code>Q5_K_M</code>, <code>Q4_K_M</code>, <code>Q4_K_S</code>, <code>Q3_K_S</code>) que cabe com o contexto e o paralelismo pedidos; senão tenta contexto reduzido (metade, 4096, 2048); senão devolve <code>"API"</code>. Modelo ilustrativo de 8B.</p>' },
        { tipo: 'rode', id: 'm11b4-rode', titulo: 'Dimensione (quant, ctx, parallel) pela VRAM', enunciado: 'Três máquinas, o mesmo modelo ilustrativo de 8B. A barra mostra a VRAM disponível em GB.',
          prefixo: '$', entrada: 'python dimensionar_local.py --vram 24 --ctx-max 8192 --parallel 1', unidade: 'GB', terminalTitulo: 'dimensionar_local', etapas: etapasDimensionar(),
          prever: { pergunta: 'Com 24 GB, contexto máximo 131072 e 4 slots, o que recomendar() devolve?', opcoes: [
            { id: 'a', texto: 'Q8_0 com ctx=131072 e parallel=4: 24 GB bastam.', correta: false, porque: 'o KV de 128k × 4 sozinho é 64 GB (Bloco 6); nenhum quant resolve isso.' },
            { id: 'b', texto: 'Q8_0 ctx=4096 parallel=4 (reduzido): o contexto cai, a concorrência pedida fica.', correta: true, porque: 'o contrato tenta reduzir o contexto antes de desistir; com 4096 o KV é 2 GB e o Q8_0 cabe.' },
            { id: 'c', texto: '"API": nenhuma configuração local cabe.', correta: false, porque: 'com contexto reduzido a configuração cabe; "API" só sai quando nem o menor quant cabe com o contexto mínimo.' }
          ] },
          tutorAntes: 'Aperte Enter e depois clique em cada máquina para ler só a recomendação dela.',
          tutorDepois: 'Repare que a recomendação reduzida muda o produto: 4096 de contexto pode ser menos do que o seu caso exige. Sem folga a resposta honesta é API ou configuração reduzida, e a perda vai para o ADR em vez de ser descoberta na entrega.',
          callout: 'Você transformou a conta de VRAM em recomendação de servidor.' },
        { tipo: 'texto', html:
          '<h3>ADR-0005: onde vale modelo local no Cartógrafo</h3>' +
          '<p>A resposta honesta quase nunca é tudo local nem nada local. Cada etapa tem uma exigência dominante, e cada linha da tabela vira item de ADR com contexto, decisão e consequências, mais um <strong>gatilho de revisão</strong> explícito, como "revisar quando um modelo aberto passar de 85% no eval próprio de tool calling". O modo 100% local é um perfil de implantação separado, com qualidade declaradamente inferior na redação, registrado na proposta e não descoberto na entrega.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Etapa do pipeline</th><th>Exigência dominante</th><th>Local é viável?</th><th>Por quê</th></tr></thead><tbody>' +
          '<tr><td>Parse e construção do grafo (M10)</td><td>Determinismo</td><td><strong>Não usa LLM</strong></td><td>É <code>tree-sitter</code>: já era local, grátis e exato</td></tr>' +
          '<tr><td>Embeddings (M07)</td><td>Vazão, custo por unidade</td><td><strong>Sim, o melhor candidato</strong></td><td>Tarefa fechada, modelos pequenos competitivos, maior volume de chamadas do sistema</td></tr>' +
          '<tr><td>Classificação barata (roteamento, é-teste-ou-não)</td><td>Latência, custo</td><td><strong>Sim</strong></td><td>Saída curta e restrita; um 8B resolve</td></tr>' +
          '<tr><td>Extração estruturada por arquivo (M05)</td><td>Aderência a schema</td><td><strong>Talvez</strong>: meça</td><td>Depende do suporte a structured output; é o experimento do Bloco 8</td></tr>' +
          '<tr><td>Loop de agente com ferramentas (M08)</td><td>Tool calling, estado multi-turno</td><td><strong>Provavelmente não</strong></td><td>É onde modelos abertos mais ficam para trás (Bloco 8)</td></tr>' +
          '<tr><td>Redação do relatório final</td><td>Qualidade de escrita</td><td><strong>Não, se houver escolha</strong></td><td>É o entregável que o cliente lê: não economize aqui</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'Um <mark>arquivo e duas linhas</mark> validam a porta; o ADR-0005 registra <mark>etapa por etapa</mark>, com gatilho de revisão.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Validar o servidor sem servidor</h3>' +
          '<p>A folha B07-L implementa <code>provedor_local.py</code> verbatim. Aqui você escreve o essencial: a política de host, a validação dos knobs e a tradução da resposta do transporte para <code>usage</code>, custo e confiança. O transporte fake devolve um dicionário com <code>text</code>, <code>usage</code> (chaves <code>prompt</code> e <code>completion</code>) e <code>logprobs</code>.</p>' },
        { tipo: 'python', id: 'm11b4-python', titulo: 'Política de host, knobs e tradução de usage', obrigatorio: false,
          enunciado: 'Complete <code>politica_host</code>, <code>validar_local</code> e <code>converter_resposta</code> seguindo o contrato do módulo. Os textos de erro devem ser exatamente os do contrato.',
          codigo: codigoLocal, testes: testesLocal,
          dica: '<code>politica_host</code>: se <code>cfg.host == "0.0.0.0" and cfg.exige_auth_no_proxy</code>, levante <code>ValueError</code>. <code>converter_resposta</code>: use <code>bruta.get("usage", {})</code> e a média de <code>bruta.get("logprobs", [])</code>, ou <code>None</code> se a lista estiver vazia.',
          solucao: solucaoLocal,
          tutorDepois: 'Os testes cobrem a borda (n_ctx igual ao prompt passa), o caso proibido (0.0.0.0 sem proxy levanta) e a ausência de usage e logprobs. O custo é sempre 0.0: o custo do hardware entra no Bloco 8.',
          callout: 'O adapter local recusa configuração perigosa e preserva usage e logprobs atrás da porta.' },
        { tipo: 'escolha', id: 'm11b4-esc-ctx', titulo: 'Confira: o contexto padrão',
          pergunta: 'Você envia a um Ollama com configuração padrão um prompt maior que o contexto de 4096. O que acontece, e qual é a defesa?',
          opcoes: [
            { id: 'a', texto: 'O contexto é truncado em silêncio e o começo (onde mora o system) é descartado; defesa: forçar <code>num_ctx</code> por requisição e validar <code>n_ctx ≥ prompt estimado</code>.', correta: true, porque: 'nenhum erro, só resposta pior. Elevar num_ctx eleva o KV, então a mudança passa pela conta de VRAM.' },
            { id: 'b', texto: 'Erro explícito "context length exceeded", fácil de tratar.', correta: false, porque: 'o problema é justamente a ausência de erro.' },
            { id: 'c', texto: 'O servidor amplia o contexto sozinho, ao custo de VRAM.', correta: false, porque: 'o contexto não cresce sozinho.' },
            { id: 'd', texto: 'O modelo resume o prompt automaticamente antes de responder.', correta: false, porque: 'ninguém resume nada; o começo é cortado.' }
          ], tutorDepois: 'É uma das três armadilhas, junto com paralelismo 1 e unload em 5 minutos.' },
        { tipo: 'escolha', id: 'm11b4-esc-vllm', titulo: 'Confira: vLLM ou Ollama',
          pergunta: 'Quando faz sentido escolher vLLM em vez de Ollama?',
          opcoes: [
            { id: 'a', texto: 'Sempre, porque é o servidor de produção.', correta: false, porque: 'sem concorrência medida, o custo operacional chega antes do ganho.' },
            { id: 'b', texto: 'Na máquina de desenvolvimento sem GPU.', correta: false, porque: 'o vLLM nasceu para GPU e para escala.' },
            { id: 'c', texto: 'Quando se quer gerenciar modelos manualmente, com controle fino de flags.', correta: false, porque: 'esse é o perfil do llama.cpp.' },
            { id: 'd', texto: 'Em GPU com concorrência real de usuários (continuous batching + PagedAttention); com um usuário só a diferença não aparece, e começar pelo Ollama mantém a troca em configuração.', correta: true, porque: 'com a mesma porta do M05, endpoint compatível com OpenAI, a troca é de configuração e não de código de chamada.' }
          ], tutorDepois: 'Prova local primeiro, com a mesma porta.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes do bloco: llama.cpp (SRC-M11-15), Ollama (SRC-M11-16: num_ctx, parallel, keep_alive, host sem auth) e vLLM (SRC-M11-17), consulta de 14/09/2026, risco alto, revalidar em até 90 dias; PagedAttention (SRC-M11-07), risco médio. Valores padrão (contexto de 4096, 1 requisição paralela, unload em 5 minutos) são comportamento de produto a confirmar na folha L contra o servidor instalado. Servidor live e <code>ollama ps</code> pertencem à trilha externa e nascem BLOCKED onde Docker, Ollama ou GPU estiverem ausentes.</p>' },
        { tipo: 'takeaway', html: 'Valide a configuração <mark>antes da primeira chamada</mark> e deixe o <mark>domínio</mark> sem saber qual motor responde.' }
      ] }
    ]
  });
})();
