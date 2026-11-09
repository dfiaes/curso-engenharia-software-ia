/* P01 · Bloco 2: empacotar. Fonte: P01.html#b02. Verificado nas fontes oficiais em 11/10/2026 (uv 0.11.32, python:3.14-slim-bookworm). O ambiente do módulo não tinha Docker: o build da imagem não foi verificado por execução; as saídas de docker abaixo são o resultado esperado. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var DOCKERFILE_BUILD = [
    '# syntax=docker/dockerfile:1',
    '# Estágio 1: resolve e instala dependências com uv a partir do uv.lock (build reprodutível).',
    'FROM python:3.14-slim-bookworm AS build',
    'COPY --from=ghcr.io/astral-sh/uv:0.11.32 /uv /usr/local/bin/uv',
    'ENV UV_COMPILE_BYTECODE=1 \\',
    '    UV_LINK_MODE=copy \\',
    '    UV_PYTHON_DOWNLOADS=never',
    'WORKDIR /app',
    '# Camada de dependências: só muda quando pyproject.toml/uv.lock mudam.',
    'COPY pyproject.toml uv.lock README.md ./',
    'RUN --mount=type=cache,target=/root/.cache/uv \\',
    '    uv sync --locked --no-dev --no-install-project --extra azure',
    'COPY src ./src',
    'RUN --mount=type=cache,target=/root/.cache/uv \\',
    '    uv sync --locked --no-dev --no-editable --extra azure'
  ].join('\n');

  var DOCKERFILE_RUNTIME = [
    '# Estágio 2: imagem final sem uv, sem compilador, sem cache; roda como usuário sem privilégio.',
    'FROM python:3.14-slim-bookworm AS runtime',
    'RUN groupadd --system --gid 10001 app \\',
    '    && useradd --system --uid 10001 --gid app --no-create-home --shell /usr/sbin/nologin app',
    'WORKDIR /app',
    'COPY --from=build --chown=10001:10001 /app/.venv /app/.venv',
    'ENV PATH="/app/.venv/bin:$PATH" \\',
    '    PYTHONUNBUFFERED=1 \\',
    '    PYTHONDONTWRITEBYTECODE=1 \\',
    '    APP_ENV=prod',
    'USER 10001:10001',
    'EXPOSE 8000',
    'HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\',
    '    CMD ["python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen(\'http://127.0.0.1:8000/healthz\', timeout=2).status == 200 else 1)"]',
    'CMD ["uvicorn", "--factory", "llm_service.app:create_app_from_env", "--host", "0.0.0.0", "--port", "8000"]'
  ].join('\n');

  var NOTA = 'saída esperada, conforme o módulo: o build da imagem não foi executado no ambiente de autoria (sem Docker)';

  var etapasImagem = function () {
    return [
      { id: 'build', nome: 'Build', descricao: 'Imagem linux/amd64', tom: 'dns', ms: 6, linhas: [
        L('info', NOTA),
        L('out', 'imagem llm-service:dev criada para linux/amd64')] },
      { id: 'run', nome: 'Run', descricao: 'Contêiner em segundo plano', tom: 'tcp', ms: 4, linhas: [
        L('cmd', 'docker run --rm -d -p 8000:8000 --name svc llm-service:dev'),
        L('out', '(id do contêiner)')] },
      { id: 'id', nome: 'Usuário', descricao: 'Quem é o processo', tom: 'tls', ms: 3, linhas: [
        L('cmd', 'docker exec svc id'),
        L('out', 'uid=10001(app) gid=10001(app)'),
        L('hint', 'não é root: a checagem de verdade é na imagem construída, não na leitura do Dockerfile')] },
      { id: 'healthz', nome: 'Liveness', descricao: 'Endpoint /healthz', tom: 'request', ms: 3, linhas: [
        L('cmd', 'curl -s localhost:8000/healthz'),
        L('out', '{"status":"ok"}')] },
      { id: 'health', nome: 'HEALTHCHECK', descricao: 'Estado do Docker', tom: 'response', ms: 5, linhas: [
        L('cmd', "docker inspect --format '{{.State.Health.Status}}' svc"),
        L('out', 'healthy'),
        L('hint', 'só depois do start-period; o Container Apps não usa o HEALTHCHECK, e sim probes')] },
      { id: 'stop', nome: 'Parada', descricao: 'SIGTERM chega ao uvicorn', tom: 'ink', ms: 3, linhas: [
        L('cmd', 'docker stop svc'),
        L('out', 'svc'),
        L('in', 'encerrou em segundos: o uvicorn é o PID 1 e recebeu o SIGTERM')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'p01-b2',
    titulo: 'Empacotar: Dockerfile multi-stage com uv, usuário sem privilégio e tags imutáveis',
    minutos: 35,
    resumo: 'A imagem é o contrato entre o seu time e a plataforma: o que foi testado é o que roda, byte a byte. O Dockerfile do lab fecha as quatro fontes de "funciona na minha máquina".',
    objetivo: 'Ler um Dockerfile multi-stage linha a linha, separar HEALTHCHECK de probes, explicar por que liveness não consulta dependências e publicar por tag derivada do commit com o digest como identidade real.',
    revisao: [
      { id: 'p01b2-locked', pergunta: 'O que faz <code>uv sync --locked</code> num Dockerfile?',
        opcoes: [
          opc('a', 'Falha se o uv.lock estiver desatualizado em relação ao pyproject.toml, em vez de re-resolver em silêncio', true, 'é o equivalente de npm ci: o build instala o que foi revisado.'),
          opc('b', 'Atualiza o uv.lock automaticamente durante o build', false, 'atualizar em silêncio reintroduziria a não reprodutibilidade.'),
          opc('c', 'Bloqueia o acesso à rede durante o build', false, '--locked trata do lockfile, não da rede.')] },
      { id: 'p01b2-probes', pergunta: 'No Container Apps, quem decide a saúde do contêiner?',
        opcoes: [
          opc('a', 'As probes declaradas na configuração do app (startup, liveness e readiness)', true, 'o HEALTHCHECK do Dockerfile é do Docker e do Compose; a plataforma não o usa.'),
          opc('b', 'A instrução HEALTHCHECK do Dockerfile', false, 'o Container Apps não a usa.'),
          opc('c', 'O tamanho da imagem', false, 'o tamanho da imagem não é um sinal de saúde.')] },
      { id: 'p01b2-liveness', pergunta: 'Por que o <code>/healthz</code> (liveness) não deve chamar o provedor de modelo?',
        opcoes: [
          opc('a', 'Se o provedor ficar lento, todas as réplicas falham a liveness juntas e são reiniciadas juntas: uma degradação externa vira indisponibilidade total', true, 'a conectividade real com o provedor é papel de um teste sintético externo, com alerta, não de uma probe que reinicia.'),
          opc('b', 'Porque a chamada ao modelo custa tokens', false, 'o custo existe, mas a razão central é a falha em cascata.'),
          opc('c', 'Porque o HTTP não permite chamadas aninhadas', false, 'não há esse limite; é uma decisão de desenho.')] },
      { id: 'p01b2-digest', pergunta: 'Qual referência identifica de forma imutável a imagem realmente implantada?',
        opcoes: [
          opc('a', 'O digest sha256 da imagem', true, 'é derivado do conteúdo e não pode ser reapontado; publique por tag do SHA do commit e registre o digest.'),
          opc('b', 'A tag :latest', false, 'tags são ponteiros mutáveis.'),
          opc('c', 'Uma tag semântica reaproveitada como v1', false, 'pode ser reapontada e fazer dois deploys do mesmo commit se comportarem diferente.')] },
      { id: 'p01b2-exec', pergunta: 'Um <code>CMD uvicorn app:app</code> em forma shell corta streams a cada atualização. Qual a causa?',
        opcoes: [
          opc('a', 'O /bin/sh é o PID 1 e engole o SIGTERM; a plataforma mata o app à força após o prazo', true, 'a forma exec (CMD ["uvicorn", ...]) coloca o uvicorn como PID 1, que recebe o sinal direto.'),
          opc('b', 'A imagem é grande demais', false, 'o tamanho da imagem não afeta o sinal de parada.'),
          opc('c', 'O uv.lock está desatualizado', false, 'o lockfile não influencia o encerramento do processo.')] }
    ],
    abas: [
      { rotulo: 'A imagem como contrato', blocos: [
        { tipo: 'texto', html: [
          '<h3>Quatro fontes de "funciona na minha máquina"</h3>',
          '<p>A <strong>imagem</strong> é o contrato entre o seu time e a plataforma: o que foi testado é o que roda, byte a byte, ou não existe garantia nenhuma. Quase todo incidente de "funciona na minha máquina" em contêiner vem de uma de quatro fontes: dependências resolvidas em momentos diferentes, base que mudou por baixo, processo rodando como root e tag que aponta para outra coisa hoje. O Dockerfile do lab fecha as quatro.</p>',
          '<p>O M03 cobriu imagens e Compose localmente. Aqui o foco é o que muda quando a imagem vai para um registro e para uma plataforma que a executa sem você olhar.</p>',
          '<h3>O Dockerfile do laboratório, em dois estágios</h3>',
          '<p>Primeiro o estágio <code>build</code>, que tem o <code>uv</code> e o cache de pacotes.</p>'
        ].join('') },
        { tipo: 'codigo', linguagem: 'dockerfile', texto: DOCKERFILE_BUILD },
        { tipo: 'texto', html: '<p>Depois o estágio <code>runtime</code>, que só recebe o <code>.venv</code> pronto e roda como usuário sem privilégio.</p>' },
        { tipo: 'codigo', linguagem: 'dockerfile', texto: DOCKERFILE_RUNTIME },
        { tipo: 'texto', html: '<p>O fluxo, em três passos: o builder instala dependências com o lockfile (<code>uv sync --locked</code> falha se <code>pyproject</code> e <code>uv.lock</code> divergirem; compiladores e cache vivem só aqui); só o ambiente virtual pronto é copiado (<code>COPY --from=build</code>); a imagem final é enxuta, sem root e com <code>CMD</code> em forma exec.</p>' },
        { tipo: 'abas', rotulo: 'Linha a linha', itens: [
          { rotulo: 'Dois estágios', blocos: [{ tipo: 'texto', html: '<p>O estágio <code>build</code> tem o <code>uv</code> e o cache de pacotes; o <code>runtime</code> só recebe o <code>.venv</code> pronto. A imagem final não tem gerenciador de pacotes, compilador nem cache, o que reduz tamanho e superfície de ataque e evita que uma ferramenta de build vire ferramenta de invasor.</p>' }] },
          { rotulo: 'uv e lockfile', blocos: [{ tipo: 'texto', html: '<p><strong>O <code>uv</code> vem de uma imagem com versão exata</strong> (<code>COPY --from=ghcr.io/astral-sh/uv:0.11.32</code>): a ferramenta de build também é dependência, e <code>uv:latest</code> reintroduziria a não reprodutibilidade que o lockfile resolve. O padrão está no guia oficial do uv para Docker.</p><p><strong><code>uv sync --locked</code></strong> falha se o <code>uv.lock</code> estiver desatualizado em relação ao <code>pyproject.toml</code>, em vez de re-resolver em silêncio. É o equivalente a <code>npm ci</code>: o build instala <em>o que foi revisado</em>.</p>' }] },
          { rotulo: 'Camadas', blocos: [{ tipo: 'texto', html: '<p>Há duas sincronizações. A primeira instala só as dependências (<code>--no-install-project</code>), numa camada que muda raramente; a segunda instala o projeto depois de copiar <code>src</code>. Sem isso, qualquer edição de código invalida a camada de dependências e o build refaz tudo. <code>--mount=type=cache</code> mantém o cache de downloads entre builds sem que ele entre na imagem.</p>' }] },
          { rotulo: 'Bytecode e venv', blocos: [{ tipo: 'texto', html: '<p><code>UV_COMPILE_BYTECODE=1</code> compila <code>.pyc</code> no build, reduzindo o tempo de partida a frio (que importa ao escalar a partir de zero). <code>UV_LINK_MODE=copy</code> evita hardlinks entre o cache montado e o venv. <code>--no-editable</code> instala o pacote de verdade no venv, para o estágio final não depender de <code>/app/src</code>.</p>' }] },
          { rotulo: 'Usuário', blocos: [{ tipo: 'texto', html: '<p><strong>Usuário numérico e sem shell.</strong> <code>USER 10001:10001</code> usa UID numérico: políticas como <code>runAsNonRoot</code> do Kubernetes não conseguem verificar um nome simbólico. Criar o usuário como sistema, sem home e com <code>nologin</code>, tira do invasor um shell de graça. O venv é copiado com <code>--chown</code> para o processo conseguir ler; ele não precisa <em>escrever</em> em nada da imagem.</p>' }] },
          { rotulo: 'Ambiente', blocos: [{ tipo: 'texto', html: '<p><code>PYTHONUNBUFFERED=1</code> faz os logs saírem na hora (sem isso, buffer pode perder as últimas linhas num crash). <code>PYTHONDONTWRITEBYTECODE=1</code> evita escrita em disco que o usuário não privilegiado nem teria permissão de fazer. Observe o que <em>não</em> está lá: nenhuma credencial, nenhum endpoint de produção. Configuração entra na plataforma (bloco 3).</p>' }] },
          { rotulo: 'CMD em forma exec', blocos: [{ tipo: 'texto', html: '<p>Com o <code>CMD</code> em lista, o uvicorn vira o PID 1 e recebe <code>SIGTERM</code> direto. Em forma de shell (<code>CMD uvicorn ...</code>), o <code>/bin/sh</code> seria o PID 1 e engoliria o sinal, e a plataforma esperaria o fim da janela de término antes de matar à força, cortando streams em andamento.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'Multi-stage com <mark>uv sync --locked</mark> mantém o build reprodutível e a imagem enxuta; <mark>usuário numérico</mark> e <mark>CMD em forma exec</mark> fecham as duas falhas operacionais mais comuns.' }
      ] },

      { rotulo: 'Saúde, registro e tags', blocos: [
        { tipo: 'texto', html: [
          '<h3>HEALTHCHECK de Docker versus probes da plataforma</h3>',
          '<p>A instrução <code>HEALTHCHECK</code> é do Docker e do Compose: o daemon roda o comando e marca o contêiner como <em>healthy</em>. O Container Apps <strong>não a usa</strong>. Ali a saúde vem de <strong>probes</strong> declaradas na configuração do app, com três papéis distintos que o serviço do lab separa de propósito.</p>'
        ].join('') },
        { tipo: 'texto', largo: true, html: [
          '<table><thead><tr><th>Probe</th><th>Pergunta</th><th>Endpoint do lab</th><th>Se falhar</th></tr></thead><tbody>',
          '<tr><td><strong>Startup</strong></td><td>Já terminou de subir?</td><td><code>/healthz</code></td><td>Enquanto não passa, liveness e readiness não rodam; permite partida lenta sem matar o processo.</td></tr>',
          '<tr><td><strong>Liveness</strong></td><td>O processo está vivo (não travado)?</td><td><code>/healthz</code></td><td>Reinício do contêiner.</td></tr>',
          '<tr><td><strong>Readiness</strong></td><td>Pode receber tráfego agora?</td><td><code>/readyz</code></td><td>Sai do balanceamento, sem reiniciar.</td></tr>',
          '</tbody></table>'
        ].join('') },
        { tipo: 'callout', tom: 'info', titulo: 'A regra que evita incidente em cascata', html: '<p><strong>Liveness não consulta dependências.</strong> Se <code>/healthz</code> chamasse o provedor de modelo e ele ficasse lento, todas as réplicas falhariam a liveness ao mesmo tempo, seriam reiniciadas juntas e transformariam uma degradação externa em indisponibilidade total. O <code>/healthz</code> do lab só responde <code>{"status":"ok"}</code>; o <code>/readyz</code> verifica configuração e adapter prontos, também <em>sem chamada de rede</em>. Verificar a conectividade real com o provedor é papel de um teste sintético externo, com alerta, não de uma probe que reinicia.</p>' },
        { tipo: 'texto', html: [
          '<h3>Registro e tags imutáveis</h3>',
          '<p>O <strong>Azure Container Registry</strong> (ACR) guarda as imagens. O Bicep do lab cria o SKU <code>Basic</code> com <code>adminUserEnabled: false</code>: a conta de administrador é uma senha compartilhada de longa vida, exatamente o que o módulo evita. Quem puxa a imagem é a <em>identidade</em> do app, com o papel <code>AcrPull</code> (bloco 4); quem envia é o pipeline, com identidade própria (bloco 6).</p>',
          '<p>Uma tag é um ponteiro mutável: <code>app:v1</code> hoje e <code>app:v1</code> amanhã podem ser imagens diferentes se alguém reenviar. Para que "o que foi testado é o que roda" valha, são três camadas.</p>'
        ].join('') },
        { tipo: 'abas', rotulo: 'Três camadas', itens: [
          { rotulo: 'Tag do commit', blocos: [{ tipo: 'texto', html: '<p>O pipeline publica <code>llm-service:${{ github.sha }}</code>. Um commit, uma imagem, rastreável do pod ao código.</p>' }] },
          { rotulo: 'Nunca :latest', blocos: [{ tipo: 'texto', html: '<p>Nunca <code>:latest</code> em implantação. O <code>deploycheck</code> do lab reprova <code>:latest</code> no Dockerfile, no Bicep e no workflow (regras <code>XR002</code> e <code>XR008</code>).</p>' }] },
          { rotulo: 'Digest', blocos: [{ tipo: 'texto', html: '<p>O <strong>digest</strong> (<code>sha256:...</code>) identifica o conteúdo e não pode ser reapontado. Para impedir sobrescrita da tag, o ACR permite travar o repositório ou a tag (<code>az acr repository update --write-enabled false</code>). Para a base, fixe por digest e deixe uma ferramenta (Dependabot, Renovate) propor a atualização revisável.</p>' }] }
        ] },
        { tipo: 'abas', rotulo: 'Alternativas e trade-offs', itens: [
          { rotulo: 'Imagem base', blocos: [{ tipo: 'texto', html: '<p><code>python:3.14-slim-bookworm</code> (Debian) é o equilíbrio padrão: glibc, wheels binários funcionam, tamanho moderado. <em>Alpine</em> (musl) é menor, mas pacotes com extensões nativas muitas vezes não têm wheel e compilam no build ou quebram. <em>Distroless</em> remove shell e gerenciador de pacotes: ótimo para superfície de ataque, ruim para depurar (você depende de contêiner efêmero de depuração).</p>' }] },
          { rotulo: 'Onde construir', blocos: [{ tipo: 'texto', html: '<p>Construir no runner do CI e enviar com <code>docker push</code> é o caminho mais portável. O ACR Tasks (<code>az acr build</code>) constrói na nuvem sem Docker local, mas está sujeito a restrições de assinatura (algumas ofertas gratuitas o bloqueiam).</p>' }] },
          { rotulo: 'Segredos de build', blocos: [{ tipo: 'texto', html: '<p>Se o build precisa de credencial (índice privado de pacotes), use <code>RUN --mount=type=secret</code>. <code>ARG</code> e <code>ENV</code> ficam gravados no histórico da imagem, e <code>docker history</code> os mostra.</p>' }] }
        ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: "usuário não-root" que não é', html: '<p>Três variações: (1) o <code>USER</code> aparece só no estágio de build e o final continua root (o <code>deploycheck</code> avalia o <em>último</em> estágio, porque <code>USER</code> não herda entre estágios); (2) o processo é não-root, mas o diretório de trabalho é gravável por ele e a aplicação grava arquivos de usuário ali, anulando a vantagem; (3) <code>USER app</code> por nome, que políticas de admissão do Kubernetes não conseguem verificar. A checagem de verdade é <code>docker exec svc id</code> na imagem construída, não a leitura do Dockerfile.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: imagem arm64 em plataforma amd64', html: '<p>O build no notebook com Apple Silicon "funciona", o push funciona, e a revisão fica em <em>Failed</em> com <code>exec format error</code> nos logs do sistema. Fixe <code>--platform linux/amd64</code> no build, ou construa só no CI (que é amd64) e proíba push de máquina de desenvolvedor.</p>' },
        { tipo: 'takeaway', html: 'No Container Apps a saúde vem das <mark>probes</mark> (liveness sem dependências, readiness sem rede), não do <mark>HEALTHCHECK</mark>; publique por <mark>tag do commit</mark>, nunca <mark>:latest</mark>, e trate o <mark>digest</mark> como a identidade real.' }
      ] },

      { rotulo: 'Ver e praticar', blocos: [
        { tipo: 'texto', html: [
          '<p>O ambiente em que o módulo foi escrito não tem Docker, então o Dockerfile foi validado <strong>estaticamente</strong> (<code>deploycheck</code>, regras XR001, XR002, XR003 e XR010) e o serviço foi executado diretamente com o <code>uv</code>, não dentro da imagem. Quando você tiver Docker, a verificação do que importa é curta, e o simulador abaixo mostra o resultado esperado de cada comando. Antes do Enter, preveja o que a checagem de usuário mostra.</p>'
        ].join('') },
        { tipo: 'rode', id: 'p01b2-rode', titulo: 'Valide a imagem que você construiu', enunciado: 'Rode a sequência de verificação da imagem e clique em "Usuário" para ler só essa etapa. Saídas esperadas, não executadas neste ambiente.',
          prefixo: '$', entrada: 'docker build --platform linux/amd64 -t llm-service:dev .', unidade: 'passo', terminalTitulo: 'verificação da imagem', etapas: etapasImagem(),
          prever: { pergunta: 'Na imagem do lab, o que <code>docker exec svc id</code> mostra?', opcoes: [
            { id: 'a', texto: 'uid=0(root): o contêiner sempre começa como root.', correta: false, porque: 'o estágio final declara USER 10001:10001, então o processo não roda como root.' },
            { id: 'b', texto: 'uid=10001(app) gid=10001(app): o usuário de sistema do estágio final.', correta: true, porque: 'o usuário foi criado com UID 10001 e o USER está no último estágio, que é o que vale.' },
            { id: 'c', texto: 'Erro: o usuário app não existe na imagem.', correta: false, porque: 'o RUN com groupadd e useradd cria o usuário no estágio runtime.' }
          ] },
          tutorAntes: 'Escolha a previsão, aperte Enter com o comando já preenchido e depois clique em "Usuário" para isolar a checagem.',
          tutorDepois: 'O processo roda como app (UID 10001), o HEALTHCHECK mostra healthy só depois do start-period, e o docker stop encerra em segundos porque o uvicorn é o PID 1. Cada linha dessas checa uma das quatro fontes de falha.',
          callout: 'Você viu as quatro checagens que a imagem precisa passar: usuário, saúde, parada e plataforma.' },
        { tipo: 'quebre', id: 'p01b2-quebre', titulo: 'Provoque as falhas clássicas da imagem', obrigatorio: false,
          enunciado: 'Escolha uma falha, rode, leia onde ela quebra e depois rode "Sem falha" para fechar o exercício. Saídas esperadas, não executadas neste ambiente (a mensagem do uv é um exemplo variável).',
          prefixo: '$', entrada: 'docker build --platform linux/amd64 -t llm-service:dev .', unidade: 'passo', terminalTitulo: 'verificação da imagem', etapas: etapasImagem(),
          falhas: [
            { id: 'user-build', rotulo: 'USER só no estágio de build', efeito: { etapaFalha: 'id', linhasErro: [
              L('cmd', 'docker exec svc id'),
              L('out', 'uid=0(root) gid=0(root) groups=0(root)'),
              'o estágio final não declara USER: o processo é root'
            ], tutor: 'o <code>USER</code> não herda entre estágios, então o último estágio continua root. A checagem de verdade é <code>docker exec svc id</code>, não a leitura do Dockerfile.' } },
            { id: 'cmd-shell', rotulo: 'CMD em forma shell', efeito: { etapaFalha: 'stop', linhasErro: [
              L('cmd', 'docker stop svc'),
              'docker stop demorou 10 s: o SIGTERM não chegou ao uvicorn'
            ], tutor: 'na forma shell o <code>/bin/sh</code> é o PID 1 e engole o sinal; o app só morre quando a plataforma o mata à força. Se o <code>docker stop</code> demora dez segundos, procure um <code>CMD</code> em forma shell ou um <code>entrypoint.sh</code> sem <code>exec</code>.' } },
            { id: 'arm64', rotulo: 'Imagem arm64 em plataforma amd64', efeito: { etapaFalha: 'run', linhasErro: [
              L('cmd', 'docker run --rm -d -p 8000:8000 --name svc llm-service:dev'),
              'exec format error'
            ], tutor: 'a imagem foi construída para outra arquitetura (por exemplo, num Mac com Apple Silicon, sem <code>--platform</code>). No Container Apps a revisão fica em Failed com esse erro nos logs do sistema. Fixe <code>--platform linux/amd64</code> ou construa só no CI.' } },
            { id: 'lock', rotulo: 'uv.lock desatualizado', efeito: { etapaFalha: 'build', linhasErro: [
              'error: The lockfile at `uv.lock` needs to be updated, but `--locked` was provided. To update the lockfile, run `uv lock`.'
            ], tutor: '<code>uv sync --locked</code> falha em vez de re-resolver em silêncio: o build instala o que foi revisado. A correção é rodar <code>uv lock</code>, revisar o diff do lockfile e commitar.' } }
          ],
          tutorDepois: 'Cada falha aparece em uma etapa diferente da checagem, e todas elas são evitáveis no Dockerfile.',
          callout: 'Você provocou as falhas de build, de usuário, de parada e de plataforma, e viu onde cada uma aparece.' },
        { tipo: 'python', id: 'p01b2-python', titulo: 'Audite um Dockerfile', obrigatorio: false,
          enunciado: 'Complete <code>auditar(dockerfile)</code>: devolva a lista ordenada de problemas. <code>LATEST</code>: imagem de <code>FROM</code> sem tag ou com <code>:latest</code> (digest, alias de estágio anterior e <code>scratch</code> não contam). <code>SYNC_SEM_LOCKED</code>: <code>RUN</code> com <code>uv sync</code> sem <code>--locked</code>. <code>SEM_USER_NUMERICO</code>: o último <code>USER</code> do <strong>último</strong> estágio não é um UID numérico diferente de zero (ou não existe). <code>CMD_SHELL</code>: o último <code>CMD</code> do último estágio não está em forma de lista. O parser de linhas e a leitura dos estágios já estão prontos.',
          codigo: "import re\n\n\ndef linhas_logicas(texto):\n    \"\"\"Junta continuações com barra invertida e descarta comentários.\"\"\"\n    saida, atual = [], \"\"\n    for bruta in texto.splitlines():\n        linha = bruta.strip()\n        if not linha or linha.startswith(\"#\"):\n            continue\n        if linha.endswith(\"\\\\\"):\n            atual += linha[:-1].strip() + \" \"\n            continue\n        saida.append((atual + linha).strip())\n        atual = \"\"\n    return saida\n\n\ndef auditar(dockerfile):\n    problemas = set()\n    estagios = []  # cada estágio é uma lista de (instrução, resto)\n    nomes = set()  # aliases de estágios já declarados\n    for linha in linhas_logicas(dockerfile):\n        instrucao, _, resto = linha.partition(\" \")\n        instrucao = instrucao.upper()\n        if instrucao == \"FROM\":\n            partes = [p for p in resto.split() if not p.startswith(\"--\")]\n            imagem = partes[0]\n            # 1. LATEST: imagem sem tag, com :latest, que não seja digest, alias ou scratch\n            if len(partes) >= 3 and partes[1].upper() == \"AS\":\n                nomes.add(partes[2])\n            estagios.append([])\n        elif estagios:\n            estagios[-1].append((instrucao, resto))\n        # 2. SYNC_SEM_LOCKED: RUN com \"uv sync\" sem --locked\n    ultimo = estagios[-1] if estagios else []\n    # 3. SEM_USER_NUMERICO: o último USER do ÚLTIMO estágio deve ser UID numérico diferente de 0\n    # 4. CMD_SHELL: o último CMD do último estágio deve estar em forma de lista\n    return sorted(problemas)\n",
          testes: "LAB = \"\"\"# syntax=docker/dockerfile:1\nFROM python:3.14-slim-bookworm AS build\nCOPY --from=ghcr.io/astral-sh/uv:0.11.32 /uv /usr/local/bin/uv\nWORKDIR /app\nCOPY pyproject.toml uv.lock README.md ./\nRUN --mount=type=cache,target=/root/.cache/uv \\\\\n    uv sync --locked --no-dev --no-install-project --extra azure\nCOPY src ./src\nRUN uv sync --locked --no-dev --no-editable --extra azure\n\nFROM python:3.14-slim-bookworm AS runtime\nRUN groupadd --system --gid 10001 app \\\\\n    && useradd --system --uid 10001 --gid app --no-create-home --shell /usr/sbin/nologin app\nCOPY --from=build --chown=10001:10001 /app/.venv /app/.venv\nUSER 10001:10001\nCMD [\"uvicorn\", \"--factory\", \"llm_service.app:create_app_from_env\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]\n\"\"\"\n\n\ndef test_dockerfile_do_lab_passa():\n    assert auditar(LAB) == []\n\n\ndef test_latest_cmd_shell_e_sem_user():\n    ruim = \"FROM python:latest\\nCMD uvicorn app:app\\n\"\n    assert auditar(ruim) == [\"CMD_SHELL\", \"LATEST\", \"SEM_USER_NUMERICO\"]\n\n\ndef test_user_so_no_estagio_de_build():\n    texto = \"FROM python:3.14 AS build\\nUSER 10001\\nFROM python:3.14 AS runtime\\nCMD [\\\"x\\\"]\\n\"\n    assert auditar(texto) == [\"SEM_USER_NUMERICO\"]\n\n\ndef test_user_por_nome_nao_serve():\n    texto = \"FROM python:3.14\\nUSER app\\nCMD [\\\"x\\\"]\\n\"\n    assert auditar(texto) == [\"SEM_USER_NUMERICO\"]\n\n\ndef test_sync_sem_locked():\n    texto = \"FROM python:3.14\\nRUN uv sync --no-dev\\nUSER 10001\\nCMD [\\\"x\\\"]\\n\"\n    assert auditar(texto) == [\"SYNC_SEM_LOCKED\"]\n\n\ndef test_borda_sem_tag_e_digest():\n    assert auditar(\"FROM python\\nUSER 10001\\n\") == [\"LATEST\"]\n    digest = \"FROM python@sha256:\" + \"a\" * 64 + \"\\nUSER 10001\\n\"\n    assert auditar(digest) == []\n\n\ndef test_controle_negativo_alias_de_estagio_nao_e_latest():\n    texto = \"FROM python:3.14 AS base\\nFROM base\\nUSER 10001:10001\\nCMD [\\\"x\\\"]\\n\"\n    assert auditar(texto) == []\n",
          dica: 'Para o <code>FROM</code>: <code>nome = imagem.split("/")[-1]</code>; sem tag é <code>":" not in nome</code>. Para o <code>RUN</code>: <code>"uv sync" in resto and "--locked" not in resto</code>. Para o <code>USER</code>: pegue o último de <code>ultimo</code> e use <code>re.fullmatch(r"[1-9]\\d*(:\\d+)?", valor)</code>. Para o <code>CMD</code>: forma exec começa com <code>[</code>.',
          solucao: "import re\n\n\ndef linhas_logicas(texto):\n    \"\"\"Junta continuações com barra invertida e descarta comentários.\"\"\"\n    saida, atual = [], \"\"\n    for bruta in texto.splitlines():\n        linha = bruta.strip()\n        if not linha or linha.startswith(\"#\"):\n            continue\n        if linha.endswith(\"\\\\\"):\n            atual += linha[:-1].strip() + \" \"\n            continue\n        saida.append((atual + linha).strip())\n        atual = \"\"\n    return saida\n\n\ndef auditar(dockerfile):\n    problemas = set()\n    estagios = []  # cada estágio é uma lista de (instrução, resto)\n    nomes = set()  # aliases de estágios já declarados\n    for linha in linhas_logicas(dockerfile):\n        instrucao, _, resto = linha.partition(\" \")\n        instrucao = instrucao.upper()\n        if instrucao == \"FROM\":\n            partes = [p for p in resto.split() if not p.startswith(\"--\")]\n            imagem = partes[0]\n            nome = imagem.split(\"/\")[-1]\n            fixa = \"@sha256:\" in imagem or imagem in nomes or imagem == \"scratch\"\n            if not fixa and (\":\" not in nome or nome.endswith(\":latest\")):\n                problemas.add(\"LATEST\")\n            if len(partes) >= 3 and partes[1].upper() == \"AS\":\n                nomes.add(partes[2])\n            estagios.append([])\n        elif estagios:\n            estagios[-1].append((instrucao, resto))\n        if instrucao == \"RUN\" and \"uv sync\" in resto and \"--locked\" not in resto:\n            problemas.add(\"SYNC_SEM_LOCKED\")\n    ultimo = estagios[-1] if estagios else []\n    users = [r.strip() for i, r in ultimo if i == \"USER\"]\n    if not users or not re.fullmatch(r\"[1-9]\\d*(:\\d+)?\", users[-1]):\n        problemas.add(\"SEM_USER_NUMERICO\")\n    cmds = [r.strip() for i, r in ultimo if i == \"CMD\"]\n    if cmds and not cmds[-1].startswith(\"[\"):\n        problemas.add(\"CMD_SHELL\")\n    return sorted(problemas)\n",
          tutorDepois: 'O controle negativo importa: um alias de estágio (<code>FROM base</code>) não é imagem sem tag, e um digest é a forma mais fixa que existe. Auditar só o que parece ruim gera falso positivo e faz o time ignorar o check.',
          callout: 'Quatro regras do Dockerfile viraram um check testado, avaliando o último estágio.' },
        { tipo: 'transcript', id: 'p01b2-transcript', titulo: 'Ache as afirmações que o Dockerfile não sustenta', obrigatorio: false, terminalTitulo: 'revisão do Dockerfile',
          enunciado: 'Leia a revisão do agente. Três afirmações não têm sustentação. Clique nelas e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Revise o Dockerfile do serviço antes do deploy no Container Apps.' },
            { quem: 'ferramenta', texto: '$ grep -nE "^(USER|HEALTHCHECK|CMD|FROM)" Dockerfile\n3:FROM python:3.14-slim-bookworm AS build\n18:FROM python:3.14-slim-bookworm AS runtime\n27:USER 10001:10001\n29:HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\\n31:CMD ["uvicorn", "--factory", "llm_service.app:create_app_from_env", "--host", "0.0.0.0", "--port", "8000"]' },
            { quem: 'agente', texto: 'O estágio runtime termina com USER 10001:10001 e o CMD está em forma exec, então o uvicorn é o PID 1 e recebe o SIGTERM.' },
            { quem: 'agente', texto: 'Há um HEALTHCHECK no Dockerfile, então a plataforma já sabe se o contêiner está saudável e não preciso declarar probes no Bicep.' },
            { quem: 'agente', texto: 'Confirmei que o processo não roda como root: o Dockerfile mostra USER, então não precisei executar a imagem.' },
            { quem: 'agente', texto: 'O uv vem de uma imagem com versão exata e o sync usa --locked, então o build instala o que foi revisado.' },
            { quem: 'agente', texto: 'Vou publicar como llm-service:latest para o pipeline sempre puxar a imagem mais nova.' },
            { quem: 'agente', texto: 'Sem Docker neste ambiente, validei só estaticamente; build e execução da imagem ficam sem verificar.' }
          ],
          erradas: [3, 4, 6],
          explicacao: {
            3: 'o Container Apps não usa o <code>HEALTHCHECK</code> do Dockerfile; a saúde vem das probes declaradas na configuração do app (startup, liveness e readiness).',
            4: 'ler o <code>USER</code> no Dockerfile não prova nada sobre a imagem construída: a checagem de verdade é <code>docker exec svc id</code>, e o <code>deploycheck</code> só avalia o último estágio de forma estática.',
            6: '<code>:latest</code> é uma tag mutável: o mesmo commit passa a gerar imagens diferentes e "voltar para a versão anterior" perde o referente. Publique por tag do SHA e registre o digest.'
          },
          tutorDepois: 'Leitura estática prova o que o arquivo diz; só a execução prova o que a imagem faz, e o agente acertou ao dizer o que não verificou.' },
        { tipo: 'takeaway', html: 'O Dockerfile prova o que <mark>diz</mark>; a imagem só se prova <mark>executando</mark>: <mark>docker exec id</mark>, saúde, parada e plataforma.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html: '<p>Duas perguntas de cenário, sem consulta. Marque quanto você confia antes de conferir.</p>' },
        { tipo: 'escolha', id: 'p01b2-escolha-digest', titulo: 'Confira: a identidade da imagem',
          pergunta: 'Qual referência identifica de forma imutável a imagem que foi realmente implantada?',
          opcoes: [
            { id: 'a', texto: 'A tag :latest.', correta: false, porque: 'é um ponteiro mutável: dois deploys do "mesmo" commit podem se comportar diferente.' },
            { id: 'b', texto: 'Uma tag semântica reaproveitada como v1.', correta: false, porque: 'também pode ser reapontada.' },
            { id: 'c', texto: 'O digest sha256 da imagem.', correta: true, porque: 'o digest é derivado do conteúdo. Boa prática: publicar por tag do SHA do commit e registrar o digest.' },
            { id: 'd', texto: 'O nome do repositório.', correta: false, porque: 'o repositório agrupa muitas imagens e não identifica nenhuma.' }
          ], tutorDepois: 'Tag aponta, digest identifica.' },
        { tipo: 'escolha', id: 'p01b2-escolha-shell', titulo: 'Confira: o stream que corta na atualização',
          pergunta: 'Num deploy com Dockerfile em forma shell (<code>CMD uvicorn app:app</code>), as requisições em andamento são cortadas a cada atualização. Qual a causa mais provável?',
          opcoes: [
            { id: 'a', texto: 'A imagem é grande demais.', correta: false, porque: 'o tamanho da imagem não afeta o encerramento do processo.' },
            { id: 'b', texto: 'O processo é filho do /bin/sh e não recebe o SIGTERM, então a plataforma o mata à força após o prazo.', correta: true, porque: 'na forma shell o PID 1 é o shell, que não repassa sinais ao app. O app não faz o desligamento gracioso e é morto com SIGKILL; a forma exec coloca o app como PID 1.' },
            { id: 'c', texto: 'O uv.lock está desatualizado.', correta: false, porque: 'um lockfile desatualizado quebra o build, não o encerramento.' },
            { id: 'd', texto: 'A porta exposta está errada.', correta: false, porque: 'uma porta errada impediria o tráfego, não cortaria streams na atualização.' }
          ], tutorDepois: 'Quem recebe o SIGTERM decide se o stream termina com graça.' },
        { tipo: 'takeaway', html: 'A imagem é o <mark>contrato</mark>: reprodutível pelo <mark>lockfile</mark>, sem privilégio pelo <mark>USER numérico</mark>, encerrada com graça pelo <mark>CMD exec</mark> e identificada pelo <mark>digest</mark>.' }
      ] }
    ]
  });
})();
