/* M03 · Bloco 7: CI, imagem imutável e contrato de release. Fonte: M03.html#b07. Fontes consultadas em 21/08/2026 (revalidar em até 90 dias). Nada aqui exige conta externa; o SHA da esteira é exemplo. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var b7Codigo = [
    "class ConfigAusente(Exception):",
    "    pass",
    "",
    "",
    "OBRIGATORIAS = (\"APP_DATABASE_URL\", \"APP_SECRET_KEY\")",
    "",
    "",
    "def carregar_config(env):",
    "    \"\"\"Falha cedo e alto se faltar variável (ausente ou vazia). A mensagem cita os NOMES",
    "    que faltam e nunca o valor de nenhuma variável.\"\"\"",
    "    return {nome: env.get(nome) for nome in OBRIGATORIAS}",
    "",
    "",
    "def tags_da_imagem(repo, sha, ref):",
    "    \"\"\"Só a main publica imagem: <repo>:latest e <repo>:<sha>. Pull request e outros branches: nenhuma tag.\"\"\"",
    "    return [f\"{repo}:latest\"]",
    "",
    "",
    "def problemas_do_release(passos):",
    "    \"\"\"Confere a ordem de um release: migrar antes de promover; verificar a saúde depois de promover;",
    "    rollback preparado. Devolve a lista de problemas (vazia = ok).\"\"\"",
    "    return []",
    "",
    "",
    "print(tags_da_imagem(\"ghcr.io/org/app\", \"9f3c2ab\", \"refs/pull/7/merge\"))"
  ].join('\n');
  var b7Testes = [
    "def test_config_completa():",
    "    env = {\"APP_DATABASE_URL\": \"postgresql://u:p@db/x\", \"APP_SECRET_KEY\": \"s3gredo\"}",
    "    assert carregar_config(env)[\"APP_SECRET_KEY\"] == \"s3gredo\"",
    "",
    "",
    "def test_falta_cedo_e_alto_citando_so_o_nome():",
    "    env = {\"APP_DATABASE_URL\": \"postgresql://u:SENHA-DO-BANCO@db/x\"}",
    "    try:",
    "        carregar_config(env)",
    "    except ConfigAusente as exc:",
    "        msg = str(exc)",
    "        assert \"APP_SECRET_KEY\" in msg",
    "        assert \"SENHA-DO-BANCO\" not in msg",
    "        assert \"APP_DATABASE_URL\" not in msg",
    "    else:",
    "        raise AssertionError(\"esperava ConfigAusente\")",
    "",
    "",
    "def test_variavel_vazia_conta_como_ausente():",
    "    try:",
    "        carregar_config({\"APP_DATABASE_URL\": \"x\", \"APP_SECRET_KEY\": \"\"})",
    "    except ConfigAusente as exc:",
    "        assert \"APP_SECRET_KEY\" in str(exc)",
    "    else:",
    "        raise AssertionError(\"vazia deve falhar\")",
    "",
    "",
    "def test_main_publica_latest_e_sha_inteira():",
    "    tags = tags_da_imagem(\"ghcr.io/org/app\", \"9f3c2ab\", \"refs/heads/main\")",
    "    assert tags == [\"ghcr.io/org/app:latest\", \"ghcr.io/org/app:9f3c2ab\"]",
    "",
    "",
    "def test_pr_e_outros_branches_nao_publicam():",
    "    assert tags_da_imagem(\"ghcr.io/org/app\", \"9f3c2ab\", \"refs/pull/7/merge\") == []",
    "    assert tags_da_imagem(\"ghcr.io/org/app\", \"9f3c2ab\", \"refs/heads/feature/x\") == []",
    "",
    "",
    "def test_release_na_ordem_certa():",
    "    passos = [\"gates\", \"build_imagem\", \"migrar\", \"promover\", \"verificar_saude\", \"rollback_preparado\"]",
    "    assert problemas_do_release(passos) == []",
    "",
    "",
    "def test_promover_antes_de_migrar_e_acusado():",
    "    passos = [\"gates\", \"build_imagem\", \"promover\", \"migrar\", \"verificar_saude\", \"rollback_preparado\"]",
    "    problemas = problemas_do_release(passos)",
    "    assert any(\"migrar\" in p and \"promover\" in p for p in problemas)",
    "",
    "",
    "def test_sem_saude_e_sem_rollback_sao_acusados():",
    "    problemas = problemas_do_release([\"gates\", \"build_imagem\", \"migrar\", \"promover\"])",
    "    assert len(problemas) == 2",
    "    assert any(\"verificar_saude\" in p for p in problemas)",
    "    assert any(\"rollback\" in p for p in problemas)",
    "",
    "",
    "def test_sem_migrar_tambem_e_problema():",
    "    problemas = problemas_do_release([\"gates\", \"promover\", \"verificar_saude\", \"rollback_preparado\"])",
    "    assert any(\"migrar\" in p for p in problemas)"
  ].join('\n');
  var b7Solucao = [
    "class ConfigAusente(Exception):",
    "    pass",
    "",
    "",
    "OBRIGATORIAS = (\"APP_DATABASE_URL\", \"APP_SECRET_KEY\")",
    "",
    "",
    "def carregar_config(env):",
    "    faltam = [nome for nome in OBRIGATORIAS if not env.get(nome)]",
    "    if faltam:",
    "        raise ConfigAusente(\"configuração obrigatória ausente: \" + \", \".join(faltam))",
    "    return {nome: env[nome] for nome in OBRIGATORIAS}",
    "",
    "",
    "def tags_da_imagem(repo, sha, ref):",
    "    if ref != \"refs/heads/main\":",
    "        return []",
    "    return [f\"{repo}:latest\", f\"{repo}:{sha}\"]",
    "",
    "",
    "def problemas_do_release(passos):",
    "    problemas = []",
    "    if \"promover\" in passos:",
    "        if \"migrar\" not in passos:",
    "            problemas.append(\"falta migrar antes de promover\")",
    "        elif passos.index(\"migrar\") > passos.index(\"promover\"):",
    "            problemas.append(\"migrar deve rodar antes de promover\")",
    "        if \"verificar_saude\" not in passos:",
    "            problemas.append(\"falta verificar_saude depois de promover\")",
    "        elif passos.index(\"verificar_saude\") < passos.index(\"promover\"):",
    "            problemas.append(\"verificar_saude deve vir depois de promover\")",
    "    if \"rollback_preparado\" not in passos:",
    "        problemas.append(\"falta rollback_preparado (redeploy da SHA anterior e downgrade compatível)\")",
    "    return problemas"
  ].join('\n');

  TrilhaAula.registrar({
    id: 'm03-b7',
    titulo: 'CI, imagem imutável e contrato de release',
    minutos: 40,
    resumo: 'Gates que rodam na máquina de quem lembra de rodá-los não são gates. O CI os promove a lei; a imagem endereçada por SHA e o release com migration antes da promoção fecham o ciclo.',
    objetivo: 'Reproduzir os gates locais em workflow versionado, encadear qualidade e imagem, endereçar a imagem por revisão imutável e responder as três perguntas de release antes de ele existir.',
    revisao: [
      { id: 'm03b7-needs', pergunta: 'Por que o job de build da imagem declara <code>needs: quality</code> e só roda na main?',
        opcoes: [
          opc('a', 'A imagem só existe se a qualidade passou, e PR verifica enquanto a main endereça; nenhum caminho de deploy nem segredo de produção aparece no contexto de pull request', true, 'o <code>check.sh</code> local executa os mesmos comandos: paridade dev e CI.'),
          opc('b', 'Para economizar minutos de CI, sem outro motivo', false, 'o motivo é de contrato, não de custo.'),
          opc('c', 'Porque o GitHub exige', false, 'é uma decisão de desenho do pipeline.')] },
      { id: 'm03b7-sha', pergunta: 'Por que tagear a imagem pela SHA do commit além de <code>latest</code>?',
        opcoes: [
          opc('a', 'Cada commit tem imagem imutável e endereçável, o que torna rollback uma operação (redeployar a SHA anterior), não uma esperança', true, '<code>latest</code> é um ponteiro móvel: não diz o que está rodando nem permite voltar com precisão.'),
          opc('b', 'Porque <code>latest</code> é proibida pelo Docker', false, 'não é proibida; é imprecisa.'),
          opc('c', 'Para que cada pessoa sobrescreva a imagem em produção', false, 'o objetivo é o oposto: imutabilidade.')] },
      { id: 'm03b7-migrar', pergunta: 'Em que ordem a migration roda no release, e por quê?',
        opcoes: [
          opc('a', 'Antes de promover a versão nova, num passo efêmero; se falhar, o release aborta e a versão anterior segue no ar', true, 'depois de promover, o código novo roda sobre schema velho.'),
          opc('b', 'Depois de promover, para não atrasar o deploy', false, 'cria a janela de código novo sobre schema velho.'),
          opc('c', 'No startup, via <code>create_all</code>', false, '<code>create_all</code> não tem histórico nem volta.')] },
      { id: 'm03b7-tres', pergunta: 'Quais são as três perguntas que todo release responde antes de existir?',
        opcoes: [
          opc('a', 'Como sei que quebrou (health check e logs), como volto (redeploy da SHA anterior e downgrade compatível, ensaiado) e o banco volta junto?', true, 'sem as três respostas, não é release: é aposta.'),
          opc('b', 'Quem aprovou, quando foi e qual o ticket', false, 'são metadados de processo, não condições de segurança do release.'),
          opc('c', 'Qual o custo, qual o prazo e quem é o dono', false, 'não respondem a falha.')] },
      { id: 'm03b7-config', pergunta: 'Como tratar configuração e segredos entre dev e produção?',
        opcoes: [
          opc('a', 'Mesma imagem, configuração no ambiente; configuração obrigatória ausente falha cedo e alto, sem revelar o valor; segredo só no cofre da plataforma', true, 'se trocar de ambiente exige rebuildar, o desenho está errado.'),
          opc('b', 'Uma imagem por ambiente, com o segredo dentro', false, 'segredo nunca em código, imagem ou log.'),
          opc('c', 'Defaults silenciosos para tudo', false, 'config ausente deve falhar cedo, não seguir com valor errado.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Até aqui os gates (lint, tipos, testes) rodam na máquina de quem lembra de rodá-los. O <strong>CI</strong> os promove a lei: todo push, todo pull request, sem exceção, numa máquina que não é a sua. O <strong>release</strong> fecha o ciclo: a mesma imagem verificada, endereçada por revisão imutável, com migrations aplicadas antes de promover e rollback ensaiado. Nada aqui exige conta externa: qualidade, imagem e contrato de release são locais e versionados; publicação externa é trilha opcional.</p>' +
          '<h3>GitHub Actions em 90 segundos</h3>' +
          '<p>CI nativo do GitHub. Um <strong>workflow</strong> é um YAML em <code>.github/workflows/</code>; dispara por <strong>evento</strong> (<code>push</code>, <code>pull_request</code>); contém <strong>jobs</strong> (cada um numa máquina efêmera); cada job tem <strong>steps</strong> que rodam shell (<code>run:</code>) ou invocam actions reutilizáveis (<code>uses:</code>). Segredos ficam no cofre do repositório, expostos como <code>${{ secrets.NOME }}</code> e mascarados no log: nunca em código, imagem ou saída.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Pré-requisitos', html: '<p>Blocos 1 a 6 (gates locais e suíte com e sem Docker). Este bloco é leitura; o roteiro executável (workflow, script local equivalente, build do wheel e contrato de release) fica no laboratório guiado.</p>' },
        { tipo: 'texto', html: '<h3>O pipeline do laboratório</h3><p>Exemplo de referência; corresponde a <code>.github/workflows/ci-m03.yml</code> do repositório e a <code>scripts/check.sh</code> do lab (o equivalente local).</p>' },
        { tipo: 'codigo', linguagem: 'yaml', texto: [
          '# .github/workflows/ci-m03.yml (referência)',
          'name: ci-m03',
          'on:',
          '  push:',
          '    paths: ["modulos/M03-fastapi-postgres-docker-ci/**"]',
          '  pull_request:',
          '    paths: ["modulos/M03-fastapi-postgres-docker-ci/**"]',
          'jobs:',
          '  quality:',
          '    runs-on: ubuntu-latest',
          '    steps:',
          '      - uses: actions/checkout@v4',
          '      - uses: astral-sh/setup-uv@v4',
          '      - run: uv sync --frozen',
          '        working-directory: modulos/M03-fastapi-postgres-docker-ci/lab',
          '      - run: uv run ruff check .',
          '      - run: uv run ruff format --check .',
          '      - run: uv run mypy src tests',
          '      - run: uv run pytest -q',
          '      # o runner tem Docker: a suíte postgres executa; sem Docker ela pula BLOCKED',
          '  build-image:',
          '    needs: quality',
          '    runs-on: ubuntu-latest',
          '    if: github.ref == \'refs/heads/main\'',
          '    permissions:',
          '      packages: write',
          '    steps:',
          '      - uses: actions/checkout@v4',
          '      - uses: docker/build-push-action@v6',
          '        with:',
          '          context: modulos/M03-fastapi-postgres-docker-ci/lab',
          '          push: true',
          '          tags: |',
          '            ghcr.io/${{ github.repository }}:latest',
          '            ghcr.io/${{ github.repository }}:${{ github.sha }}'].join('\n') },
        { tipo: 'texto', html: '<p>As decisões que importam:</p>' },
        { tipo: 'abas', rotulo: 'Decisão', itens: [
          { rotulo: 'needs', blocos: [{ tipo: 'texto', html: '<p><code>needs:</code> encadeia gates: a imagem só existe se a qualidade passou. O <code>check.sh</code> local executa os mesmos comandos: <strong>paridade dev e CI</strong>. Divergência entre os dois é onde defeito se esconde.</p>' }] },
          { rotulo: 'PR verifica, main endereça', blocos: [{ tipo: 'texto', html: '<p>O job de build só roda na main (<code>if: github.ref == ...</code>); nenhum caminho de deploy nem segredo de produção aparece no contexto de pull request.</p>' }] },
          { rotulo: 'Tag pela SHA', blocos: [{ tipo: 'texto', html: '<p>Além de <code>latest</code>, cada commit tem imagem imutável endereçável. É isso que torna rollback uma operação (redeployar a SHA anterior), não uma esperança.</p>' }] },
          { rotulo: 'Lock preservado', blocos: [{ tipo: 'texto', html: '<p><code>uv sync --frozen</code> falha se o lock divergir: a imagem sempre corresponde ao lock revisado.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'O CI é o gate local <mark>como lei</mark>: <mark>PR verifica</mark>, <mark>main endereça</mark> e a imagem é tagueada pela <mark>SHA</mark>.' }
      ] },

      { rotulo: 'Release', blocos: [
        { tipo: 'texto', html:
          '<h3>Migrations no release: a decisão que separa deploy de incidente</h3>' +
          '<p>Nunca crie schema com <code>create_all</code> no startup em produção e nunca deixe a migration para "depois". O padrão é o <strong>comando de release</strong>: <code>alembic upgrade head</code> roda num passo efêmero <em>antes</em> de promover a versão nova. Se a migration falha, o release aborta e a versão anterior segue no ar. Combine com a regra do bloco 2 (migration compatível com a versão anterior, expandir e contrair em duas releases) e o banco deixa de ser o ponto sem volta.</p>' +
          '<h3>Configuração, segredos e as três perguntas de release</h3>' +
          '<ul><li><strong>Mesma imagem, configuração no ambiente.</strong> O que muda entre dev e produção é injetado, não rebuildado. Se trocar de ambiente exige rebuildar, o desenho está errado. Configuração obrigatória ausente deve falhar cedo e alto, e a mensagem de falha nunca revela o valor do segredo.</li>' +
          '<li><strong>Segredo nunca em código, imagem ou log.</strong> Só no cofre da plataforma. O <code>.dockerignore</code> do bloco 5 e o mascaramento do CI são as redes; a disciplina é sua.</li></ul>' },
        { tipo: 'callout', tom: 'info', titulo: 'As três perguntas, antes de o release existir', html:
          '<ol><li><strong>Como sei que quebrou?</strong> Health check e logs.</li><li><strong>Como volto?</strong> Redeploy da SHA anterior e downgrade compatível, ensaiado, não teórico.</li><li><strong>O banco volta junto?</strong> Downgrade testado ou expandir e contrair.</li></ol><p>Sem as três respostas, não é release: é aposta.</p>' },
        { tipo: 'esteira', id: 'b7-esteira', titulo: 'Promova um commit da qualidade ao release', obrigatorio: false,
          enunciado: 'Promova o artefato pelos três ambientes do pipeline: qualidade (push e PR), imagem (só na main) e release. Aprove o gate humano, corrija o que falhar e teste o rollback antes de seguir.',
          artefato: '9f3c2ab',
          ambientes: [
            { id: 'quality', nome: 'Qualidade (push/PR)', gates: [
              { id: 'lint', rotulo: 'Lint e formato', tipo: 'auto', comando: 'uv run ruff check . && uv run ruff format --check .', saida: 'exit 0' },
              { id: 'tipos', rotulo: 'Tipos', tipo: 'auto', comando: 'uv run mypy src tests', saida: 'exit 0' },
              { id: 'testes', rotulo: 'Testes (suíte postgres no runner com Docker)', tipo: 'auto', comando: 'uv run pytest -q', saida: 'exit 0' }] },
            { id: 'imagem', nome: 'Imagem (só na main)', gates: [
              { id: 'build', rotulo: 'Build e tag pela SHA', tipo: 'auto', comando: 'docker/build-push-action (latest e SHA)', saida: 'ghcr.io/<repo>:9f3c2ab publicada' }] },
            { id: 'release', nome: 'Release', gates: [
              { id: 'migra', rotulo: 'Migrar antes de promover', tipo: 'auto', comando: 'alembic upgrade head',
                saida: 'migrations aplicadas',
                falhaPossivel: { linhas: ['alembic upgrade head: falhou', 'release abortado: a versão anterior segue no ar'],
                  tutor: 'a migration rodou <em>antes</em> de promover, então a falha abortou o release sem derrubar nada. Se ela rodasse depois, haveria código novo sobre schema velho. Corrija a migration (compatível com a versão anterior) e rode o gate de novo.' } },
              { id: 'contrato', rotulo: 'Contrato de release respondido (RELEASE.md)', tipo: 'aprovacao' },
              { id: 'saude', rotulo: 'Verificar /health e logs depois de promover', tipo: 'auto', comando: 'GET /health', saida: 'saudável' }] }
          ],
          tutorAntes: 'Aperte Promover. A esteira para no gate de aprovação e na migration. Quando chegar ao fim, clique em Rollback uma vez.',
          tutorDepois: 'A mesma SHA passou nos testes, foi tagueada e foi promovida; nada foi rebuildado entre verificação e release. O rollback é redeploy da SHA anterior mais downgrade compatível.',
          callout: 'O artefato chegou ao release pelos três ambientes, com a migration antes da promoção.' },
        { tipo: 'ordene', id: 'b7-ordene-release', titulo: 'Ordene o release seguro', obrigatorio: false,
          enunciado: 'Coloque as etapas do pipeline de um release seguro na ordem correta.',
          itens: [
            { id: 'migrar', texto: 'Aplicar a migration (<code>alembic upgrade head</code>) num passo efêmero' },
            { id: 'saude', texto: 'Verificar <code>/health</code> e logs; se falhar, redeployar a SHA anterior' },
            { id: 'gates', texto: 'Gates verdes no push: lint, formato, tipos, testes' },
            { id: 'promover', texto: 'Promover a nova versão do serviço' },
            { id: 'build', texto: 'Construir a imagem e taguear pela SHA do commit (só na main)' }
          ], solucao: ['gates', 'build', 'migrar', 'promover', 'saude'],
          tutorDepois: 'A migration vem antes da promoção, e a verificação de saúde depois: é ela que dispara o rollback.',
          callout: 'Release na ordem: gates, imagem, migration, promoção e verificação.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Trilha opcional: publicação externa', html: '<p>Publicar o encurtador numa plataforma (PaaS com suporte a container e Postgres, qualquer fornecedor) é trilha opcional e não condiciona a aprovação do módulo. Quem a percorrer registra no contrato de release: ambiente, revisão publicada, método de rollback ensaiado e limite do ensaio. Conta, cartão e URL pública ficam fora do caminho obrigatório.</p>' },
        { tipo: 'takeaway', html: 'A <mark>migration roda antes</mark> de promover; sem as <mark>três perguntas</mark> respondidas, o release é <mark>aposta</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b7-python', titulo: 'Escreva a config, as tags e o validador de release', obrigatorio: false,
          enunciado: 'Implemente <code>carregar_config(env)</code> (falha cedo citando só os <em>nomes</em> que faltam, nunca valores; variável vazia conta como ausente), <code>tags_da_imagem(repo, sha, ref)</code> (só a main publica <code>latest</code> e a SHA) e <code>problemas_do_release(passos)</code> (migrar antes de promover; verificar saúde depois; rollback preparado).',
          codigo: b7Codigo, testes: b7Testes,
          dica: 'Config: <code>faltam = [n for n in OBRIGATORIAS if not env.get(n)]</code> e a mensagem junta só <code>faltam</code>. Tags: <code>if ref != "refs/heads/main": return []</code>. Release: use <code>passos.index(...)</code> para comparar posições, só quando ambos existirem.',
          solucao: b7Solucao,
          tutorDepois: 'Os três mecanismos têm o mesmo desenho: falhar cedo, não vazar segredo, e tornar a ordem do release verificável em vez de combinada.',
          callout: 'Config, tags e ordem de release validadas nos testes.' },
        { tipo: 'complete', id: 'b7-complete-workflow', titulo: 'Complete o job de imagem', obrigatorio: false, linguagem: 'yaml',
          enunciado: 'Escolha, em cada lacuna, a peça que encadeia a imagem à qualidade, a restringe à main, endereça pela SHA e preserva o lock.',
          partes: [
            '  build-image:\n    ', { lacuna: 'needs', opcoes: ['needs: quality', 'needs: []', 'if: always()'], correta: 'needs: quality' },
            '\n    runs-on: ubuntu-latest\n    ', { lacuna: 'cond', opcoes: ['if: github.ref == \'refs/heads/main\'', 'if: github.event_name == \'pull_request\'', 'if: true'], correta: 'if: github.ref == \'refs/heads/main\'' },
            '\n    steps:\n      - run: ', { lacuna: 'lock', opcoes: ['uv sync --frozen', 'uv sync', 'pip install -r requirements.txt'], correta: 'uv sync --frozen' },
            '\n      - uses: docker/build-push-action@v6\n        with:\n          tags: |\n            ghcr.io/${{ github.repository }}:latest\n            ghcr.io/${{ github.repository }}:', { lacuna: 'sha', opcoes: ['${{ github.sha }}', 'latest', '${{ github.run_number }}'], correta: '${{ github.sha }}' },
            '\n'
          ],
          explicacao: '<code>needs: quality</code> garante que a imagem só existe se a qualidade passou; a condição mantém o PR só verificando; <code>--frozen</code> falha se o lock divergir; a SHA liga a imagem ao commit verificado, o que torna o rollback um redeploy preciso.',
          callout: 'Job de imagem montado: encadeado, restrito à main, com lock e SHA.' },
        { tipo: 'escolha', id: 'b7-esc-sha', titulo: 'Confira: main e SHA',
          pergunta: 'Por que o job de build da imagem só roda na branch main e a imagem é tagueada pela SHA do commit além de <code>latest</code>?',
          opcoes: [
            { id: 'a', texto: 'Para economizar minutos de CI, sem outro motivo.', correta: false, porque: 'o motivo é de contrato e de segurança.' },
            { id: 'b', texto: 'PR apenas verifica; main endereça. A tag por SHA dá imagem imutável e endereçável, o que torna rollback uma operação (redeployar a SHA anterior).', correta: true, porque: '<code>latest</code> é um ponteiro móvel e não permite voltar com precisão; segredos e caminhos de deploy ficam fora do contexto de PR.' },
            { id: 'c', texto: 'Porque <code>latest</code> é proibida pelo Docker.', correta: false, porque: 'não é proibida; é imprecisa.' },
            { id: 'd', texto: 'Para que cada pessoa possa sobrescrever a imagem em produção.', correta: false, porque: 'imutabilidade é o objetivo.' }
          ], tutorDepois: 'Rollback é uma operação, não uma esperança.' },
        { tipo: 'escolha', id: 'b7-esc-migrar', titulo: 'Confira: a ordem da migration',
          pergunta: 'Em qual ordem a migration deve rodar no release, e por quê?',
          opcoes: [
            { id: 'a', texto: 'Antes de promover a versão nova, num passo efêmero; se falhar, o release aborta e a versão anterior segue no ar.', correta: true, porque: 'combine com expandir e contrair para compatibilidade durante o rollout.' },
            { id: 'b', texto: 'Depois de promover, para não atrasar o deploy.', correta: false, porque: 'cria uma janela em que o código novo roda sobre o schema velho.' },
            { id: 'c', texto: 'No startup da aplicação via <code>create_all</code>.', correta: false, porque: '<code>create_all</code> em produção não tem histórico nem volta.' },
            { id: 'd', texto: 'Manualmente, quando alguém notar o erro.', correta: false, porque: 'não é um passo de release, é um incidente.' }
          ], tutorDepois: 'O banco deixa de ser o ponto sem volta.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes deste bloco: documentação do GitHub Actions (workflow syntax) e Security hardening for GitHub Actions. Consultadas em 21/08/2026; documentação de plataforma deve ser revalidada em até 90 dias. O SHA mostrado na esteira é só um exemplo.</p>' },
        { tipo: 'takeaway', html: 'Mesma <mark>imagem</mark>, configuração no <mark>ambiente</mark>, falha <mark>cedo</mark> sem vazar segredo, e publicação externa como <mark>trilha opcional</mark>.' }
      ] }
    ]
  });
})();
