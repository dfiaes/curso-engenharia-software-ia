/* M03 · Bloco 5: imagens, Compose e ambiente reproduzível. Fonte: M03.html#b05. Fontes consultadas em 21/08/2026 (revalidar em até 90 dias). Execução real exige Docker Engine; esta aula não executa Docker, o python modela o cache de camadas. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var b5Codigo = [
    "from fnmatch import fnmatch",
    "",
    "",
    "def afeta(entradas, alterados):",
    "    \"\"\"True se algum arquivo alterado cai nas entradas de uma instrução ('.' = tudo; 'src/' = a pasta).\"\"\"",
    "    for entrada in entradas:",
    "        for arquivo in alterados:",
    "            if entrada == \".\" or arquivo == entrada or arquivo.startswith(entrada.rstrip(\"/\") + \"/\"):",
    "                return True",
    "    return False",
    "",
    "",
    "def camadas_refeitas(dockerfile, alterados):",
    "    \"\"\"dockerfile: lista de (instrucao, entradas). O cache vale de cima para baixo:",
    "    a primeira camada afetada e TODAS as seguintes são refeitas. Devolve as instruções refeitas.\"\"\"",
    "    return []",
    "",
    "",
    "def segredos_no_contexto(arquivos, dockerignore):",
    "    \"\"\"Arquivos .env* (exceto .env.example) que entrariam no contexto de build.\"\"\"",
    "    return []",
    "",
    "",
    "BOM = [",
    "    (\"FROM python:3.14-slim\", []),",
    "    (\"COPY pyproject.toml uv.lock ./\", [\"pyproject.toml\", \"uv.lock\"]),",
    "    (\"RUN uv sync --frozen --no-install-project\", []),",
    "    (\"COPY src/ src/\", [\"src/\"]),",
    "    (\"RUN uv sync --frozen\", []),",
    "]",
    "RUIM = [",
    "    (\"FROM python:3.14-slim\", []),",
    "    (\"COPY . .\", [\".\"]),",
    "    (\"RUN uv sync --frozen\", []),",
    "]",
    "print(camadas_refeitas(BOM, [\"src/app.py\"]))"
  ].join('\n');
  var b5Testes = [
    "def test_ordem_boa_mexer_no_codigo_preserva_a_instalacao():",
    "    refeitas = camadas_refeitas(BOM, [\"src/app.py\"])",
    "    assert refeitas == [\"COPY src/ src/\", \"RUN uv sync --frozen\"]",
    "",
    "",
    "def test_mexer_no_lock_refaz_a_instalacao_inteira():",
    "    refeitas = camadas_refeitas(BOM, [\"uv.lock\"])",
    "    assert refeitas[0].startswith(\"COPY pyproject.toml\")",
    "    assert len(refeitas) == 4",
    "",
    "",
    "def test_copy_tudo_primeiro_reinstala_a_cada_linha_de_codigo():",
    "    refeitas = camadas_refeitas(RUIM, [\"src/app.py\"])",
    "    assert refeitas == [\"COPY . .\", \"RUN uv sync --frozen\"]",
    "",
    "",
    "def test_nada_alterado_nada_refeito():",
    "    assert camadas_refeitas(BOM, []) == []",
    "",
    "",
    "def test_arquivo_fora_de_qualquer_copy_nao_invalida_nada():",
    "    assert camadas_refeitas(BOM, [\"README.md\"]) == []",
    "",
    "",
    "def test_env_entra_no_contexto_sem_dockerignore():",
    "    arquivos = [\"src/app.py\", \".env\", \".env.example\", \".env.local\"]",
    "    assert segredos_no_contexto(arquivos, []) == [\".env\", \".env.local\"]",
    "",
    "",
    "def test_dockerignore_barra_o_segredo():",
    "    arquivos = [\"src/app.py\", \".env\", \".env.local\"]",
    "    assert segredos_no_contexto(arquivos, [\".env\", \".env.*\"]) == []"
  ].join('\n');
  var b5Solucao = [
    "from fnmatch import fnmatch",
    "",
    "",
    "def afeta(entradas, alterados):",
    "    for entrada in entradas:",
    "        for arquivo in alterados:",
    "            if entrada == \".\" or arquivo == entrada or arquivo.startswith(entrada.rstrip(\"/\") + \"/\"):",
    "                return True",
    "    return False",
    "",
    "",
    "def camadas_refeitas(dockerfile, alterados):",
    "    refeitas = []",
    "    invalidado = False",
    "    for instrucao, entradas in dockerfile:",
    "        if invalidado or afeta(entradas, alterados):",
    "            invalidado = True",
    "            refeitas.append(instrucao)",
    "    return refeitas",
    "",
    "",
    "def segredos_no_contexto(arquivos, dockerignore):",
    "    achados = []",
    "    for arquivo in arquivos:",
    "        eh_env = arquivo == \".env\" or (arquivo.startswith(\".env.\") and arquivo != \".env.example\")",
    "        ignorado = any(fnmatch(arquivo, padrao) for padrao in dockerignore)",
    "        if eh_env and not ignorado:",
    "            achados.append(arquivo)",
    "    return achados",
    "",
    "",
    "BOM = [",
    "    (\"FROM python:3.14-slim\", []),",
    "    (\"COPY pyproject.toml uv.lock ./\", [\"pyproject.toml\", \"uv.lock\"]),",
    "    (\"RUN uv sync --frozen --no-install-project\", []),",
    "    (\"COPY src/ src/\", [\"src/\"]),",
    "    (\"RUN uv sync --frozen\", []),",
    "]",
    "RUIM = [",
    "    (\"FROM python:3.14-slim\", []),",
    "    (\"COPY . .\", [\".\"]),",
    "    (\"RUN uv sync --frozen\", []),",
    "]"
  ].join('\n');

  /* Modelo do bloco (cache por camada, de cima para baixo): [cache] = reaproveitada, [refeita] = reconstruída. Não é saída do Docker. */
  var etapasCache = function () {
    return [
      { id: 'codigo', nome: 'Muda src/app.py', descricao: 'Manifests antes do código', tom: 'dns', ms: 2, linhas: [
        L('out', '[cache]  FROM python:3.14-slim'),
        L('out', '[cache]  COPY pyproject.toml uv.lock ./'),
        L('out', '[cache]  RUN uv sync --frozen --no-install-project'),
        L('out', '[refeita] COPY src/ src/'),
        L('out', '[refeita] RUN uv sync --frozen'),
        L('hint', 'a instalação de dependências inteira vem do cache; só o código rebuilda')] },
      { id: 'lock', nome: 'Muda uv.lock', descricao: 'Dependência nova', tom: 'tcp', ms: 4, linhas: [
        L('cmd', 'alterado: uv.lock'),
        L('out', '[cache]  FROM python:3.14-slim'),
        L('out', '[refeita] COPY pyproject.toml uv.lock ./'),
        L('out', '[refeita] RUN uv sync --frozen --no-install-project'),
        L('out', '[refeita] COPY src/ src/'),
        L('out', '[refeita] RUN uv sync --frozen'),
        L('hint', 'mudou uma camada, tudo abaixo rebuilda; dependências mudam por semana, e isso é esperado')] },
      { id: 'ruim', nome: 'COPY . . primeiro', descricao: 'Ordem invertida', tom: 'tls', ms: 3, linhas: [
        L('cmd', 'alterado: src/app.py (Dockerfile com COPY . . antes da instalação)'),
        L('out', '[cache]  FROM python:3.14-slim'),
        L('out', '[refeita] COPY . .'),
        L('out', '[refeita] RUN uv sync --frozen'),
        L('hint', 'toda linha de código reinstala todas as dependências: a causa da maioria dos builds lentos')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm03-b5',
    titulo: 'Imagens, Compose e ambiente reproduzível',
    minutos: 40,
    resumo: 'Teste que passa só na máquina de quem escreveu custa caro. Imagem imutável embala a aplicação; o Compose versiona o ambiente inteiro: API, banco, rede e volume.',
    objetivo: 'Explicar cada estágio e instrução do Dockerfile, a ordem de camadas pela frequência de mudança, e o papel de rede, volume, healthcheck e .dockerignore no Compose.',
    revisao: [
      { id: 'm03b5-cache', pergunta: 'Por que os manifests (<code>pyproject.toml</code>, <code>uv.lock</code>) são copiados antes do código?',
        opcoes: [
          opc('a', 'O cache de build é por camada, de cima para baixo; dependências mudam por semana e código por hora, então a instalação fica em cache', true, 'inverter a ordem reinstala tudo a cada build.'),
          opc('b', 'Porque o <code>uv</code> exige', false, 'é uma decisão de cache, não do <code>uv</code>.'),
          opc('c', 'Para o código ficar mais seguro', false, 'a ordem das camadas não é controle de segurança.')] },
      { id: 'm03b5-multistage', pergunta: 'O que o multi-stage (<code>AS builder</code> e <code>AS runtime</code>) entrega?',
        opcoes: [
          opc('a', 'Compiladores, headers e o próprio <code>uv</code> não viajam para produção: imagem menor, deploy mais rápido, menos superfície de ataque', true, 'as ferramentas de build ficam no builder e morrem ali.'),
          opc('b', 'Duas imagens rodando juntas em produção', false, 'só o estágio runtime vira a imagem final.'),
          opc('c', 'Build mais lento de propósito', false, 'o objetivo é a imagem final enxuta.')] },
      { id: 'm03b5-dns', pergunta: 'No Compose, a API usa <code>@localhost:5432</code> e falha com connection refused com o banco saudável. Qual é a correção?',
        opcoes: [
          opc('a', 'Usar o nome do serviço (<code>@db:5432</code>): dentro da rede do Compose, localhost é o próprio container da API', true, 'cada serviço é um hostname na rede interna.'),
          opc('b', 'Publicar a porta 5432 no host e manter localhost', false, 'publicar porta serve ao seu navegador, não à comunicação entre containers.'),
          opc('c', 'Trocar o healthcheck por <code>sleep 10</code>', false, 'a corrida de boot é outro problema.')] },
      { id: 'm03b5-health', pergunta: 'O que <code>depends_on</code> com <code>condition: service_healthy</code> resolve?',
        opcoes: [
          opc('a', 'A API só sobe depois que o healthcheck do Postgres acusa saudável, eliminando o ConnectionRefused da corrida de inicialização', true, '"depois de" não é "pronto".'),
          opc('b', 'Garante que o banco nunca cai', false, 'só ordena a subida.'),
          opc('c', 'Cria o volume do banco', false, 'volume é declarado à parte.')] },
      { id: 'm03b5-segredo', pergunta: 'Por que o <code>.dockerignore</code> é obrigatório, junto do Dockerfile?',
        opcoes: [
          opc('a', 'Sem ele um <code>.env</code> com segredos entra na imagem, que é arquivável, inspecionável e frequentemente pública', true, 'o <code>.dockerignore</code> lista <code>.git</code>, <code>.venv</code>, <code>.env</code>, <code>__pycache__</code> e <code>tests/</code>.'),
          opc('b', 'Só para a imagem ficar menor', false, 'o ganho de tamanho é secundário; o ponto é o segredo.'),
          opc('c', 'Porque o Compose exige', false, 'o controle é do contexto de build.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Testes que passam na máquina de quem escreveu e quebram em qualquer outro lugar custam caro, e banco de desenvolvimento instalado à mão, com versão e configuração desconhecidas, é uma fonte clássica dessa divergência. O Docker resolve a embalagem: aplicação, runtime e dependências do sistema viajam numa <strong>imagem</strong> imutável, e o ambiente inteiro (API, banco, rede, volume) viaja num arquivo <strong>Compose</strong> versionado. O laboratório usa os dois para que PostgreSQL, migrations e suíte executem no mesmo ambiente em qualquer máquina com Docker Engine.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Pré-requisitos e limite', html: '<p>Blocos 1 a 4 (app HTTP em camadas). A construção e a execução de containers exigem Docker Engine; sem ele, os oráculos estáticos do lab verificam os artefatos e a execução fica marcada como bloqueada. Esta aula não executa Docker.</p>' },
        { tipo: 'texto', html: '<h3>Vocabulário: imagem, camada, container, registry</h3>' },
        { tipo: 'abas', rotulo: 'Termo', itens: [
          { rotulo: 'Imagem', blocos: [{ tipo: 'texto', html: '<p>O pacote <strong>imutável</strong> com aplicação, bibliotecas e arquivos necessários à execução, identificada por tag (<code>postgres:16</code>).</p>' }] },
          { rotulo: 'Camada', blocos: [{ tipo: 'texto', html: '<p>Cada instrução do Dockerfile gera uma fatia somente leitura, com hash. Imagens compartilham camadas. O <strong>cache de build funciona por camada, de cima para baixo: mudou uma linha, tudo abaixo rebuilda.</strong> Essa frase explica a maioria dos builds lentos.</p>' }] },
          { rotulo: 'Container', blocos: [{ tipo: 'texto', html: '<p>Uma instância em execução da imagem: processo isolado pelo kernel, não máquina virtual, por isso inicia em fração de segundo. Imagem está para container como classe está para objeto.</p>' }] },
          { rotulo: 'Registry', blocos: [{ tipo: 'texto', html: '<p>O repositório de imagens (Docker Hub, GHCR). <code>docker push</code> e <code>docker pull</code> publicam e baixam.</p>' }] }
        ] },
        { tipo: 'texto', html: '<h3>O Dockerfile, linha a linha</h3><p>Exemplo de referência completo; corresponde ao Dockerfile do laboratório. Cada linha tem um porquê.</p>' },
        { tipo: 'codigo', linguagem: 'dockerfile', texto: [
          '# ---------- estágio 1: builder (ferramentas de build ficam AQUI e morrem aqui)',
          'FROM python:3.14-slim AS builder',
          'COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv',
          'WORKDIR /app',
          'ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy',
          '',
          '# 1º: SÓ os manifests. Enquanto pyproject/uv.lock não mudarem,',
          '# esta camada (a instalação inteira de dependências) vem do cache.',
          'COPY pyproject.toml uv.lock ./',
          'RUN uv sync --frozen --no-install-project --no-dev',
          '',
          '# 2º: o código (muda toda hora, por isso vem DEPOIS das dependências)',
          'COPY src/ src/',
          'RUN uv sync --frozen --no-dev',
          '',
          '# ---------- estágio 2: runtime (só o necessário para RODAR)',
          'FROM python:3.14-slim AS runtime',
          'WORKDIR /app',
          '# usuário não-root: um processo comprometido não opera como root',
          'RUN groupadd -r app && useradd -r -g app app',
          'COPY --from=builder --chown=app:app /app/.venv /app/.venv',
          'COPY --from=builder --chown=app:app /app/src /app/src',
          'ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1',
          'USER app',
          'EXPOSE 8000',
          'HEALTHCHECK --interval=15s --timeout=3s --retries=3 \\',
          '  CMD python -c "import urllib.request as u; u.urlopen(\'http://localhost:8000/health\')"',
          'CMD ["uvicorn", "link_shortener.serve:app", "--host", "0.0.0.0", "--port", "8000"]'].join('\n') },
        { tipo: 'texto', html: '<p>Os porquês que o checkpoint cobra:</p>' },
        { tipo: 'abas', rotulo: 'Instrução', itens: [
          { rotulo: 'Multi-stage', blocos: [{ tipo: 'texto', html: '<p><code>AS builder</code> e <code>AS runtime</code>: compiladores, headers e o próprio <code>uv</code> não viajam para produção. Imagem menor significa deploy mais rápido e superfície de ataque menor.</p>' }] },
          { rotulo: 'Manifests antes do código', blocos: [{ tipo: 'texto', html: '<p>A ordem das camadas segue a frequência de mudança: dependências mudam por semana, código por hora. Inverter a ordem reinstala tudo a cada build.</p>' }] },
          { rotulo: '--frozen', blocos: [{ tipo: 'texto', html: '<p>Usa o <code>uv.lock</code> exato e falha se estiver desatualizado: determinismo do build.</p>' }] },
          { rotulo: 'USER app', blocos: [{ tipo: 'texto', html: '<p>O processo não roda como root. Custa duas linhas e remove uma classe inteira de impacto em caso de invasão.</p>' }] },
          { rotulo: 'PYTHONUNBUFFERED', blocos: [{ tipo: 'texto', html: '<p>Logs saem sem buffer, porque em container o log é <code>stdout</code> e quem captura é a plataforma. Arquivo de log dentro do container morre com ele.</p>' }] },
          { rotulo: 'HEALTHCHECK', blocos: [{ tipo: 'texto', html: '<p>O orquestrador precisa distinguir "processo vivo" de "app saudável"; o endpoint <code>/health</code> responde isso (os testes do laboratório o verificam).</p>' }] },
          { rotulo: '.dockerignore', blocos: [{ tipo: 'texto', html: '<p>Sempre, junto: <code>.git</code>, <code>.venv</code>, <code>.env</code>, <code>__pycache__</code>, <code>tests/</code>. Sem ele, um <code>.env</code> com segredos entra na imagem, e imagem é arquivável, inspecionável e frequentemente pública.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'Ordene as camadas pela <mark>frequência de mudança</mark>, deixe as ferramentas de build no <mark>builder</mark> e mantenha o segredo fora do <mark>contexto</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Compose: o ambiente inteiro, declarado</h3>' +
          '<p>Exemplo de referência; corresponde ao <code>compose.yml</code> do laboratório.</p>' },
        { tipo: 'codigo', linguagem: 'yaml', texto: [
          '# compose.yml',
          'services:',
          '  db:',
          '    image: postgres:16',
          '    environment:',
          '      POSTGRES_PASSWORD: dev',
          '      POSTGRES_DB: shortener',
          '    ports: ["5432:5432"]',
          '    volumes:',
          '      - pgdata:/var/lib/postgresql/data      # dados sobrevivem ao container',
          '    networks: [shortnet]',
          '    healthcheck:',
          '      test: ["CMD-SHELL", "pg_isready -U postgres"]',
          '      interval: 5s',
          '      timeout: 3s',
          '      retries: 5',
          '  api:',
          '    build: .',
          '    ports: ["8000:8000"]',
          '    environment:',
          '      APP_DATABASE_URL: postgresql+asyncpg://postgres:dev@db:5432/shortener',
          '    depends_on:',
          '      db:',
          '        condition: service_healthy           # espera SAUDÁVEL, não só "subiu"',
          '    networks: [shortnet]',
          'volumes:',
          '  pgdata:',
          'networks:',
          '  shortnet:'].join('\n') },
        { tipo: 'texto', html: '<p>Três mecânicas para entender de verdade:</p>' },
        { tipo: 'abas', rotulo: 'Mecânica', itens: [
          { rotulo: 'Rede e DNS', blocos: [{ tipo: 'texto', html: '<p>O Compose cria uma rede em que cada serviço é um hostname. Repare na URL: <code>@db:5432</code>, não <code>@localhost</code>. Dentro da rede o nome do serviço resolve; <code>localhost</code> dentro do container é o próprio container.</p>' }] },
          { rotulo: 'Volume e rede nomeados', blocos: [{ tipo: 'texto', html: '<p>Container é descartável; o volume <code>pgdata</code> é onde o dado persiste. Sem ele, cada <code>down</code> apaga o banco. A rede <code>shortnet</code> declara o isolamento, e a limpeza do laboratório só atinge esses recursos nomeados.</p>' }] },
          { rotulo: 'depends_on + service_healthy', blocos: [{ tipo: 'texto', html: '<p>"Depois de" não é "pronto". A API esperar o healthcheck do Postgres elimina o <code>ConnectionRefused</code> da corrida de inicialização.</p>' }] }
        ] },
        { tipo: 'rode', id: 'b5-rode-cache', titulo: 'Quais camadas voltam do cache?',
          enunciado: 'Modelo do bloco (não é a saída do Docker): <code>[cache]</code> é camada reaproveitada, <code>[refeita]</code> é camada reconstruída. Rode e clique nos três cenários.',
          prefixo: '$', entrada: 'alterado: src/app.py', unidade: 'u', terminalTitulo: 'cache de camadas', etapas: etapasCache(),
          prever: { pergunta: 'Com os manifests copiados antes do código, você altera uma linha de <code>src/app.py</code>. O que acontece com a instalação das dependências?', opcoes: [
            { id: 'a', texto: 'Vem do cache; só o código e o <code>uv sync</code> final são refeitos.', correta: true, porque: 'o cache vale de cima para baixo, e a camada dos manifests não mudou.' },
            { id: 'b', texto: 'É refeita inteira, porque o código mudou.', correta: false, porque: 'isso só acontece se o <code>COPY</code> do código vier <em>antes</em> da instalação.' },
            { id: 'c', texto: 'O build falha por causa do <code>--frozen</code>.', correta: false, porque: '<code>--frozen</code> só falha se o lock estiver desatualizado.' }
          ] },
          tutorAntes: 'Aperte Enter para o cenário base e depois clique em "Muda uv.lock" e em "COPY . . primeiro".',
          tutorDepois: 'O cache invalida do ponto de mudança para baixo. Por isso a ordem segue a frequência de mudança, e por isso o "COPY . . primeiro" reinstala as dependências a cada linha de código.',
          callout: 'Você viu a ordem das camadas decidir o que o build reaproveita.' },
        { tipo: 'texto', html:
          '<h3>Do build à degradação</h3>' +
          '<ul><li>A imagem final não contém ferramentas de build, roda como usuário <code>app</code> e não contém <code>.env</code>: três fatos verificáveis por inspeção, e o laboratório os verifica sem precisar executar nada.</li>' +
          '<li><code>compose up</code> sobe o Postgres primeiro; só quando o healthcheck acusa <em>healthy</em> a API sobe e aplica <code>alembic upgrade head</code>. <code>GET /health</code> responde o estado; com o banco parado, a API degrada com erro claro em vez de travar.</li></ul>' },
        { tipo: 'takeaway', html: 'O cache invalida <mark>de cima para baixo</mark>; no Compose, o serviço é <mark>hostname</mark> e a API espera o banco <mark>saudável</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b5-python', titulo: 'Modele o cache de camadas e o contexto de build', obrigatorio: false,
          enunciado: 'Implemente <code>camadas_refeitas(dockerfile, alterados)</code>: a primeira camada afetada e todas as seguintes são refeitas (<code>afeta</code> já está pronta) e <code>segredos_no_contexto(arquivos, dockerignore)</code>: arquivos <code>.env*</code> (menos <code>.env.example</code>) que entrariam no contexto de build, sem os ignorados. Modelo do bloco, não o Docker real.',
          codigo: b5Codigo, testes: b5Testes,
          dica: 'Uma flag <code>invalidado</code> começa falsa; ao achar a primeira camada afetada, vira verdadeira e fica. Para o contexto: <code>fnmatch(arquivo, padrao)</code> contra cada linha do dockerignore.',
          solucao: b5Solucao,
          tutorDepois: 'Na ordem boa, mexer no código refaz só o <code>COPY src/</code> e o sync final, que não baixa dependências; na ordem ruim, refaz o <code>COPY . .</code> e a instalação inteira. O cache só olha <em>onde</em> cai a primeira mudança, de cima para baixo.',
          callout: 'Cache de camadas e contexto de build modelados nos testes.' },
        { tipo: 'transcript', id: 'b5-transcript', titulo: 'Audite a imagem e o Compose', obrigatorio: false, terminalTitulo: 'auditoria de embalagem',
          enunciado: 'O agente audita o Dockerfile e o Compose do encurtador. Duas afirmações dele contradizem o bloco. Clique e confira.',
          linhas: [
            { quem: 'voce', texto: 'Audite a imagem e o Compose do encurtador.' },
            { quem: 'agente', texto: 'O Dockerfile tem dois estágios: compiladores e o próprio uv ficam no builder e não viajam para produção.' },
            { quem: 'agente', texto: 'O COPY de src/ vem depois do uv sync das dependências; mexer em código não reinstala nada.' },
            { quem: 'ferramenta', texto: '$ cat .dockerignore\n.git\n.venv\n.env\n__pycache__\ntests/' },
            { quem: 'agente', texto: 'Sem .dockerignore o .env só entraria no contexto, mas imagens são descartáveis, então o risco é baixo.' },
            { quem: 'agente', texto: 'No Compose a API usa postgresql+asyncpg://postgres:dev@localhost:5432/shortener; funciona porque a porta 5432 está publicada.' },
            { quem: 'agente', texto: 'depends_on com condition: service_healthy faz a API esperar o Postgres estar saudável, não só iniciado.' }
          ],
          erradas: [4, 5],
          explicacao: {
            4: 'imagem é arquivável, inspecionável e frequentemente pública: um <code>.env</code> dentro dela é segredo exposto. O <code>.dockerignore</code> é sempre obrigatório.',
            5: 'dentro da rede do Compose o nome do serviço resolve (<code>@db:5432</code>); <code>localhost</code> é o próprio container da API. Publicar a porta serve ao seu navegador, não à comunicação entre containers.'
          },
          tutorDepois: 'Os dois erros são suposições de ambiente: o que existe dentro da imagem e o que "localhost" significa dentro da rede.' },
        { tipo: 'escolha', id: 'b5-esc-copy', titulo: 'Confira: COPY . . antes de instalar',
          pergunta: 'Um Dockerfile faz <code>COPY . .</code> antes de instalar dependências. O que acontece a cada alteração de uma linha de código?',
          opcoes: [
            { id: 'a', texto: 'Nada: o Docker detecta que só o código mudou.', correta: false, porque: 'o cache é por camada, não por conteúdo semântico.' },
            { id: 'b', texto: 'O build falha, pois o código precisa vir depois do lock.', correta: false, porque: 'o build funciona; só fica lento.' },
            { id: 'c', texto: 'O cache é invalidado dali para baixo e todas as dependências são reinstaladas a cada build.', correta: true, porque: 'o cache funciona por camada, de cima para baixo; por isso os manifests vêm antes do código.' },
            { id: 'd', texto: 'Apenas a última camada é refeita, sempre.', correta: false, porque: 'refaz-se do ponto da mudança para baixo, e o <code>COPY . .</code> está acima da instalação.' }
          ], tutorDepois: 'Dependências mudam por semana; código por hora.' },
        { tipo: 'escolha', id: 'b5-esc-localhost', titulo: 'Confira: localhost dentro do container',
          pergunta: 'No Compose, a API usa <code>postgresql://...@localhost:5432/app</code> e falha com connection refused mesmo com o banco saudável. Qual é a correção?',
          opcoes: [
            { id: 'a', texto: 'Expor a porta 5432 no host e manter localhost.', correta: false, porque: 'publicar a porta serve ao seu navegador, não à comunicação entre containers.' },
            { id: 'b', texto: 'Usar o nome do serviço (<code>@db:5432</code>): dentro da rede do Compose, localhost é o próprio container da API.', correta: true, porque: 'cada serviço do Compose é um hostname na rede interna.' },
            { id: 'c', texto: 'Trocar o healthcheck por um <code>sleep 10</code>.', correta: false, porque: 'o problema é o host, não a espera.' },
            { id: 'd', texto: 'Rodar a API como root.', correta: false, porque: 'não tem relação com resolução de nomes.' }
          ], tutorDepois: 'Serviço é hostname.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes deste bloco: documentação do Docker (multi-stage builds, build context, Compose startup order). Consultadas em 21/08/2026; documentação de ferramenta deve ser revalidada em até 90 dias.</p>' },
        { tipo: 'takeaway', html: 'O ambiente inteiro é um <mark>arquivo versionado</mark>: mesma API, mesmo banco, mesma rede em qualquer máquina com Docker, e <mark>segredo nunca entra na imagem</mark>.' }
      ] }
    ]
  });
})();
