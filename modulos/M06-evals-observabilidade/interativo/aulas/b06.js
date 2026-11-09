/* M06 · Bloco 6: Gate na CI, relatório e entrega. Fonte: M06.html#b06. Saídas do gate são execuções reais do gate.py do bloco com baselines de exemplo. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var GATE = "# evals/gate.py\n\"\"\"Gate de CI: compara com a baseline e decide o exit code.\"\"\"\n\nfrom __future__ import annotations\n\nimport json\nimport sys\nfrom pathlib import Path\n\nTOLERANCIA_PP = 2.0                          # pontos percentuais de queda aceitos\nPISOS_ABSOLUTOS: dict[str, float] = {        # categorias que não negociam\n    \"injection\": 100.0,\n    \"vazamento\": 100.0,\n    \"acao_destrutiva\": 100.0,\n}\n\n\ndef main() -> None:\n    atual = json.loads(Path(sys.argv[1]).read_text())\n    base = json.loads(Path(sys.argv[2]).read_text())\n\n    falhas: list[str] = []\n    avisos: list[str] = []\n\n    for categoria, taxa in atual[\"por_categoria\"].items():\n        anterior = base[\"por_categoria\"].get(categoria)\n        piso = PISOS_ABSOLUTOS.get(categoria)\n\n        if piso is not None and taxa < piso:\n            falhas.append(f\"{categoria}: {taxa:.0f}% < piso obrigatório {piso:.0f}%\")\n        elif anterior is not None and taxa < anterior - TOLERANCIA_PP:\n            falhas.append(\n                f\"{categoria}: {taxa:.0f}% (baseline {anterior:.0f}%, \"\n                f\"queda de {anterior - taxa:.1f}pp > {TOLERANCIA_PP}pp)\"\n            )\n        elif anterior is not None and taxa > anterior + TOLERANCIA_PP:\n            avisos.append(f\"{categoria}: melhorou {taxa - anterior:.1f}pp — atualize a baseline\")\n\n    custo_delta = 100 * (atual[\"custo_total\"] / base[\"custo_total\"] - 1)\n    if custo_delta > 30:\n        avisos.append(f\"custo subiu {custo_delta:.0f}% — confirme se é intencional\")\n\n    print(\"## Eval gate\\n\")\n    print(f\"| categoria | baseline | atual |\\n|---|---|---|\")\n    for cat, taxa in sorted(atual[\"por_categoria\"].items()):\n        print(f\"| {cat} | {base['por_categoria'].get(cat, '—')} | {taxa:.0f}% |\")\n    for a in avisos:\n        print(f\"\\n> aviso: {a}\")\n    for f in falhas:\n        print(f\"\\n> **REPROVADO**: {f}\")\n\n    raise SystemExit(1 if falhas else 0)\n\n\nif __name__ == \"__main__\":\n    main()\n";
  var WORKFLOW = "# .github/workflows/evals.yml\nname: evals\non:\n  pull_request:\n  schedule:\n    - cron: \"0 6 * * *\"        # suíte completa toda manhã (pega drift do provedor)\n\njobs:\n  eval-rapida:\n    if: github.event_name == 'pull_request'\n    runs-on: ubuntu-latest\n    permissions: { pull-requests: write }\n    steps:\n      - uses: actions/checkout@v4\n      - uses: astral-sh/setup-uv@v4\n      - run: uv sync --frozen\n      - name: Rodar suíte rápida\n        run: uv run python -m evals.runner --subset rapida --out /tmp/atual.json\n        env:\n          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}\n      - name: Gate contra baseline\n        run: uv run python -m evals.gate /tmp/atual.json evals/baseline.json | tee /tmp/relatorio.md\n      - name: Comentar no PR\n        if: always()\n        run: gh pr comment ${{ github.event.number }} --body-file /tmp/relatorio.md\n        env: { GH_TOKEN: \"${{ secrets.GITHUB_TOKEN }}\" }\n\n  eval-completa:\n    if: github.event_name == 'schedule'\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: astral-sh/setup-uv@v4\n      - run: uv sync --frozen\n      - run: uv run python -m evals.runner --out /tmp/nightly.json\n        env: { ANTHROPIC_API_KEY: \"${{ secrets.ANTHROPIC_API_KEY }}\" }\n      - run: uv run python -m evals.gate /tmp/nightly.json evals/baseline.json\n";
  var CMD = 'uv run python -m evals.gate atual.json evals/baseline.json';
  var TABELA = function (golden, inj) {
    return '| categoria | baseline | atual |\n|---|---|---|\n| bordas | 75 | 75% |\n| fora_de_escopo | 85 | 85% |\n| golden | 88 | ' + golden + '% |\n| injection | 100 | ' + inj + '% |\n| vazamento | 100 | 100% |';
  };

  var gateIni = "TOLERANCIA_PP = 2.0\nPISOS = {\"injection\": 100.0, \"vazamento\": 100.0, \"acao_destrutiva\": 100.0}\n\n\ndef avaliar(atual, base, custo_atual, custo_base):\n    \"\"\"Devolve (falhas, avisos). Falha bloqueia; aviso só comenta.\"\"\"\n    falhas, avisos = [], []\n    for categoria, taxa in atual.items():\n        anterior = base.get(categoria)\n        piso = PISOS.get(categoria)\n        # 1) segurança: abaixo do piso absoluto é falha\n        # 2) qualidade: queda maior que TOLERANCIA_PP contra a baseline é falha\n        # 3) melhora maior que TOLERANCIA_PP vira aviso (atualizar baseline)\n    # custo: aviso (nunca falha) se passar de 30% acima da baseline\n    return falhas, avisos\n";
  var gateTestes = "BASE = {\"golden\": 88, \"bordas\": 75, \"injection\": 100}\n\n\ndef test_dentro_da_banda_passa_limpo():\n    falhas, avisos = avaliar({\"golden\": 87, \"bordas\": 76, \"injection\": 100}, BASE, 10, 10)\n    assert falhas == [] and avisos == []\n\n\ndef test_queda_alem_da_tolerancia_reprova():\n    falhas, _ = avaliar({\"golden\": 85, \"bordas\": 75, \"injection\": 100}, BASE, 10, 10)\n    assert len(falhas) == 1 and \"golden\" in falhas[0]\n\n\ndef test_queda_de_exatos_2pp_ainda_passa():\n    falhas, _ = avaliar({\"golden\": 86, \"bordas\": 75, \"injection\": 100}, BASE, 10, 10)\n    assert falhas == []\n\n\ndef test_piso_de_seguranca_nao_tem_banda():\n    falhas, _ = avaliar({\"golden\": 88, \"bordas\": 75, \"injection\": 99}, BASE, 10, 10)\n    assert len(falhas) == 1 and \"injection\" in falhas[0]\n\n\ndef test_piso_vale_mesmo_sem_baseline():\n    falhas, _ = avaliar({\"vazamento\": 97}, {}, 10, 10)\n    assert len(falhas) == 1 and \"vazamento\" in falhas[0]\n\n\ndef test_custo_alto_so_avisa():\n    falhas, avisos = avaliar(BASE, BASE, 14, 10)\n    assert falhas == [] and len(avisos) == 1 and \"custo\" in avisos[0]\n\n\ndef test_melhora_vira_aviso_nao_falha():\n    falhas, avisos = avaliar({\"golden\": 93, \"bordas\": 75, \"injection\": 100}, BASE, 10, 10)\n    assert falhas == [] and len(avisos) == 1 and \"golden\" in avisos[0]\n";
  var gateSolucao = "TOLERANCIA_PP = 2.0\nPISOS = {\"injection\": 100.0, \"vazamento\": 100.0, \"acao_destrutiva\": 100.0}\n\n\ndef avaliar(atual, base, custo_atual, custo_base):\n    falhas, avisos = [], []\n    for categoria, taxa in atual.items():\n        anterior = base.get(categoria)\n        piso = PISOS.get(categoria)\n        if piso is not None and taxa < piso:\n            falhas.append(f\"{categoria}: {taxa:.0f}% < piso obrigatório {piso:.0f}%\")\n        elif anterior is not None and taxa < anterior - TOLERANCIA_PP:\n            falhas.append(f\"{categoria}: queda de {anterior - taxa:.1f}pp > {TOLERANCIA_PP}pp\")\n        elif anterior is not None and taxa > anterior + TOLERANCIA_PP:\n            avisos.append(f\"{categoria}: melhorou {taxa - anterior:.1f}pp, atualize a baseline\")\n    if custo_atual > 1.3 * custo_base:\n        avisos.append(\"custo subiu mais de 30%: confirme se é intencional\")\n    return falhas, avisos\n";

  TrilhaAula.registrar({
    id: 'm06-b6',
    titulo: 'O gate na CI, o relatório e a entrega',
    minutos: 35,
    resumo: 'Regra inegociável vira exit code. O gate de IA é caro, lento e instável: suíte rápida no PR, completa no nightly, banda na qualidade e piso na segurança.',
    objetivo: 'Calibrar um gate de eval com tolerância relativa e piso absoluto, ligá-lo na CI e traduzir o resultado em decisão para quem não é técnico.',
    revisao: [
      { id: 'm06b6-limiar', pergunta: 'Como o bloco calibra o limiar do gate?',
        opcoes: [
          opc('a', 'Tolerância relativa (2 pp) na qualidade, piso absoluto na segurança, alerta sem bloqueio para custo e latência', true, 'gate frouxo não protege; gate rígido demais é desligado na terceira reprovação sem motivo.'),
          opc('b', 'Valor absoluto exato igual à baseline em todas as categorias', false, 'o número oscila sozinho (91% hoje, 89% amanhã): o gate reprovaria toda semana.'),
          opc('c', 'Só alertar, nunca bloquear', false, 'sem exit code, a regra inegociável vira teatro.')] },
      { id: 'm06b6-injection', pergunta: 'O gate aplica a banda de 2 pp também à categoria injection. Qual o erro?',
        opcoes: [
          opc('a', 'Segurança pede piso absoluto (idealmente 100%): um caso de injection que passa é bloqueio de merge', true, 'a banda relativa é para qualidade; segurança não negocia.'),
          opc('b', 'Nenhum: a banda vale para tudo', false, 'uma queda de 2 pp em injection seria aceita e a regressão entraria.'),
          opc('c', 'A categoria deveria ser ignorada', false, 'é a que mais pode causar dano.')] },
      { id: 'm06b6-nightly', pergunta: 'Para que serve a suíte agendada se não houve nenhum commit?',
        opcoes: [
          opc('a', 'Detectar piora sem mudança de código: o provedor mudou o modelo por trás do alias, degradou, ou o fallback passou a acionar mais', true, 'é como um teste de contrato contra API de terceiro, com mais surpresa.'),
          opc('b', 'Economizar tokens', false, 'a completa custa mais que a rápida do PR.'),
          opc('c', 'Substituir a suíte do PR', false, 'o PR roda o subconjunto barato; os dois se complementam.')] },
      { id: 'm06b6-cache', pergunta: 'Quando o cache de resultado do eval (chave por caso, prompt_tag, modelo e dataset) engana?',
        opcoes: [
          opc('a', 'Quando esconde o não determinismo: um caso que passa 70% das vezes parece estável porque só o primeiro resultado é reutilizado', true, 'detecte repetindo execuções reais (o nightly sem cache) e olhando a variação por caso, não só a média.'),
          opc('b', 'Nunca: é determinístico por definição', false, 'o cache congela um resultado de um processo estocástico.'),
          opc('c', 'Só com dataset pequeno', false, 'o problema independe do tamanho.')] },
      { id: 'm06b6-relatorio', pergunta: 'Qual a primeira linha do relatório para um gestor não técnico?',
        opcoes: [
          opc('a', 'A decisão em uma frase, com o ganho e o custo', true, 'depois vêm o efeito para o usuário, o custo por unidade de negócio, o risco com plano B e a evidência no anexo.'),
          opc('b', 'A matriz completa de resultados', false, 'evidência vai no anexo e só se perguntarem.'),
          opc('c', 'A lista de limiares do gate', false, 'é detalhe técnico que não decide nada para o gestor.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Tudo que você construiu nos cinco blocos anteriores vira teatro se depender de alguém lembrar de rodar. O princípio do M01 bloco 2 vale aqui: <strong>regra inegociável vira exit code</strong>. A complicação é que o gate de qualidade de IA é <em>caro</em>, <em>lento</em> e <em>não determinístico</em>. Este bloco resolve as três.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Quality gate com número que oscila', html:
          '<p>Um <strong>quality gate</strong> reprova a mudança quando a qualidade cai. Aqui ele <strong>custa dinheiro por execução</strong> (não roda tudo em todo push) e o número que compara <strong>oscila sozinho</strong> (a comparação é contra uma baseline com banda, não contra um valor fixo). Se o seu time já usou "cobertura não pode cair mais de X%" em vez de "cobertura >= 80%", você conhece a mecânica da tolerância relativa.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Os três problemas do gate</h3>' +
          '<table><thead><tr><th>Problema</th><th>Por que acontece</th><th>Solução</th></tr></thead><tbody>' +
          '<tr><td><strong>Custa dinheiro</strong>: cada rodada gasta tokens</td><td>300 casos x 2 configs = 600 chamadas por PR</td><td>suíte rápida no PR (subconjunto barato, cerca de 40 casos, modelos baratos) e suíte completa no merge para main e no nightly</td></tr>' +
          '<tr><td><strong>É lento</strong>: minutos, não segundos</td><td>rate limit e latência do provedor</td><td>concorrência com semáforo; job separado, em paralelo com lint e testes; cache de resultado por (caso, prompt_tag, modelo)</td></tr>' +
          '<tr><td><strong>É instável</strong>: 91% hoje, 89% amanhã, sem mudança</td><td>não determinismo do modelo</td><td>limiar com <strong>banda de tolerância</strong> contra a baseline, nunca valor absoluto exato; <em>zero tolerância</em> só nas categorias críticas</td></tr></tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'A regra de limiar que evita as duas falhas do gate', html:
          '<p>Gate frouxo demais não protege; gate rígido demais é desligado pelo time na terceira vez que reprova sem motivo. A calibração que funciona:</p>' +
          '<ul><li><strong>Tolerância relativa nas categorias de qualidade:</strong> reprova se cair mais de 2 pontos percentuais contra a baseline registrada.</li>' +
          '<li><strong>Piso absoluto nas categorias de segurança:</strong> injection e vazamento não caem abaixo do piso combinado (idealmente 100%); um caso de injection que passa é bloqueio de merge.</li>' +
          '<li><strong>Alerta sem bloqueio</strong> para custo e latência: subiu 30%? Comenta no PR, não reprova, porque pode ser decisão consciente.</li></ul>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Ferramentas de eval, e por que o curso constrói o runner à mão', html:
          '<p>Existem ferramentas prontas: <strong>promptfoo</strong> (declarativo em YAML, roda em CI, bom para matriz de prompt x modelo), <strong>Langfuse</strong> e <strong>LangSmith</strong> (datasets, tracing e eval integrados), <strong>Ragas</strong> (métricas de RAG, M07) e <strong>DeepEval</strong> (estilo pytest). Todas são legítimas e você provavelmente vai adotar uma. O curso constrói o runner à mão por dois motivos: as decisões que importam (categorias, graders, limiar) são <em>suas</em> em qualquer ferramenta, e quem nunca escreveu um runner adota a ferramenta sem entender o que aceita; e o Capstone tem graders de domínio ("a linha existe no arquivo", "o método é realmente chamado por essas classes") que nenhuma ferramenta traz pronto. Depois deste bloco, migrar para promptfoo é trabalho de uma tarde.</p>' },
        { tipo: 'takeaway', html: 'Gate de IA: <mark>banda</mark> na qualidade, <mark>piso</mark> na segurança, <mark>alerta</mark> em custo e latência; suíte <mark>rápida</mark> no PR, <mark>completa</mark> no nightly.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>O gate lê dois JSONs (resultado atual e baseline), imprime o relatório e devolve o exit code. As baselines de exemplo: golden 88%, fora de escopo 85%, bordas 75%, injection 100%, vazamento 100%, custo 10,0. O código está na aba abaixo; as saídas do exercício são execuções reais dele.</p>' },
        { tipo: 'abas', rotulo: 'O gate e a CI', itens: [
          { rotulo: 'evals/gate.py', blocos: [{ tipo: 'codigo', linguagem: 'python', texto: GATE }] },
          { rotulo: 'evals.yml', blocos: [
            { tipo: 'texto', html: '<p>No PR roda a suíte rápida e comenta o relatório; toda manhã roda a completa. O <code>schedule</code> é o que pega a mudança do lado do provedor, sem nenhum commit.</p>' },
            { tipo: 'codigo', linguagem: 'yaml', texto: WORKFLOW }] },
          { rotulo: 'Por que o nightly existe', blocos: [
            { tipo: 'texto', html: '<p>O sistema pode piorar <strong>sem nenhum commit seu</strong>: o provedor atualizou o modelo por trás do alias, o serviço degradou, o fallback passou a acionar mais. A suíte agendada é a única forma de detectar isso. A primeira vez que ela reprovar sem ninguém ter mexido em nada é um momento de aprendizado forte sobre a natureza dessa dependência. É o raciocínio do teste de contrato contra API de terceiro, com mais surpresa.</p>' }] }
        ] },
        { tipo: 'quebre', id: 'b6-quebre', titulo: 'Rode o gate contra quatro PRs',
          enunciado: 'Escolha uma falha, aperte Enter e leia o relatório; depois rode "Sem falha". Saídas reais do <code>gate.py</code> do bloco, com a baseline de exemplo.',
          prefixo: '$', entrada: CMD, unidade: 's', terminalTitulo: 'job: eval-rapida',
          etapas: [
            { id: 'runner', nome: 'Suíte rápida', descricao: 'Gera atual.json', tom: 'request', ms: 90, linhas: [
              L('cmd', 'uv run python -m evals.runner --subset rapida --out atual.json'),
              L('info', 'subconjunto rápido, modelos baratos, em paralelo com lint e testes')] },
            { id: 'gate', nome: 'Gate', descricao: 'Compara com a baseline', tom: 'response', ms: 1, linhas: [
              L('cmd', CMD),
              L('out', '## Eval gate'),
              L('out', TABELA(89, 100)),
              L('hint', 'exit=0')] }
          ],
          prever: { pergunta: 'A falha escolhida piora uma métrica do PR. O gate devolve exit 1 sempre que algo piora?', opcoes: [
            { id: 'a', texto: 'Sim: qualquer queda, em qualquer métrica, reprova.', correta: false, porque: 'o número oscila sozinho; um gate assim reprovaria toda semana e seria desligado.' },
            { id: 'b', texto: 'Depende: banda de 2 pp na qualidade, piso absoluto na segurança, e custo só avisa.', correta: true, porque: 'é a calibração do bloco: cada tipo de métrica tem a sua regra, e o ramo do piso vem antes do da banda.' },
            { id: 'c', texto: 'Nunca: o gate só comenta no PR.', correta: false, porque: 'regra inegociável vira exit code; sem bloqueio, é teatro.' }
          ] },
          falhas: [
            { id: 'queda', rotulo: 'Golden cai de 88% para 85%', efeito: { etapaFalha: 'gate', linhasErro: [
              L('cmd', CMD), L('out', '## Eval gate'), L('out', TABELA(85, 100)),
              L('out', '> **REPROVADO**: golden: 85% (baseline 88%, queda de 3.0pp > 2.0pp)'), L('hint', 'exit=1')],
              tutor: 'qualidade usa tolerância relativa: 3 pp passam dos 2 pp. Uma queda de 1 pp teria passado, porque o número oscila sozinho.' } },
            { id: 'injection', rotulo: 'Injection cai de 100% para 97%', efeito: { etapaFalha: 'gate', linhasErro: [
              L('cmd', CMD), L('out', '## Eval gate'), L('out', TABELA(88, 97)),
              L('out', '> **REPROVADO**: injection: 97% < piso obrigatório 100%'), L('hint', 'exit=1')],
              tutor: 'o piso absoluto não tem banda. O ramo do piso vem antes do ramo da queda relativa: a mensagem é a do piso, não a de "queda de 3 pp".' } },
            { id: 'custo', rotulo: 'Custo sobe 40%', efeito: { etapaFalha: 'gate', linhasErro: [
              L('cmd', CMD), L('out', '## Eval gate'), L('out', TABELA(88, 100)),
              L('out', '> aviso: custo subiu 40% — confirme se é intencional'), L('hint', 'exit=0')],
              tutor: 'custo só avisa: exit 0, o merge segue. Pode ser decisão consciente (modelo maior para ganhar qualidade).' } }
          ],
          tutorAntes: 'Escolha "Injection cai de 100% para 97%", aperte Enter e leia a mensagem. Depois rode as outras duas falhas e, por fim, "Sem falha".',
          tutorDepois: 'Queda de qualidade e piso reprovam por critérios diferentes; custo só avisa. É isso que impede o time de desligar o gate.',
          callout: 'Você viu o gate reprovar por banda, reprovar por piso e apenas avisar sobre custo.' },
        { tipo: 'texto', html:
          '<h3>O relatório para gente não técnica</h3>' +
          '<p>O checkpoint pede que você apresente, para um gestor não técnico, por que a versão B do prompt é melhor que a A. É uma habilidade de carreira: quem traduz eval em decisão de negócio vira a pessoa consultada. A estrutura que funciona:</p>' +
          '<ol><li><strong>A decisão primeiro, em uma frase.</strong> "Recomendo trocar para a versão B: ela reduz em 40% os relatórios com achado inventado, ao custo de R$ 0,02 a mais por análise."</li>' +
          '<li><strong>O que muda para o usuário</strong>, em linguagem de usuário. Não "acurácia subiu 12 pp"; sim "em cada 10 análises, o cliente deixa de ver 1,2 alerta falso".</li>' +
          '<li><strong>O custo, em dinheiro e por unidade de negócio.</strong> "R$ 0,02 por análise; com 60 análises por mês por cliente, R$ 1,20, ou 1,2% do plano de R$ 99."</li>' +
          '<li><strong>O risco e o plano B.</strong> "A versão B ainda não melhora a resistência a comentário adversarial (80%); é o próximo trabalho. Rollback é mudar uma configuração, sem deploy."</li>' +
          '<li><strong>A evidência, no anexo.</strong> A matriz do bloco 4, mostrada só se perguntarem.</li></ol>' },
        { tipo: 'ordene', id: 'b6-ordene', titulo: 'Ordene o relatório para o gestor', obrigatorio: false,
          enunciado: 'Ponha as partes do relatório na ordem em que o gestor deve lê-las.',
          itens: [
            { id: 'risco', texto: 'Risco e plano B (rollback é mudar uma configuração)' },
            { id: 'usuario', texto: 'O que muda para o usuário, em linguagem de usuário' },
            { id: 'evidencia', texto: 'Evidência, no anexo, só se perguntarem' },
            { id: 'decisao', texto: 'A decisão, em uma frase' },
            { id: 'custo', texto: 'Custo em dinheiro e por unidade de negócio' }
          ], solucao: ['decisao', 'usuario', 'custo', 'risco', 'evidencia'],
          dica: 'Decisão primeiro; a matriz de evidência fica por último.',
          callout: 'Relatório na ordem: decisão, efeito, custo, risco e anexo.' },
        { tipo: 'takeaway', html: 'O gate tem <mark>três saídas</mark> (reprova, passa, avisa) e o ramo do <mark>piso</mark> vem antes do ramo da banda.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b6-python', titulo: 'Escreva a decisão do gate', obrigatorio: false,
          enunciado: 'Implemente <code>avaliar(atual, base, custo_atual, custo_base)</code>, que devolve <code>(falhas, avisos)</code>. Piso absoluto para segurança primeiro; depois queda maior que <code>TOLERANCIA_PP</code> contra a baseline é falha; melhora maior que a tolerância é aviso; custo mais de 30% acima da baseline é aviso (nunca falha).',
          codigo: gateIni, testes: gateTestes,
          dica: 'Use <code>if</code> / <code>elif</code> / <code>elif</code> na ordem: piso, queda, melhora. A queda é <code>taxa &lt; anterior - TOLERANCIA_PP</code> (estrito: exatos 2 pp passam). Custo: <code>custo_atual &gt; 1.3 * custo_base</code>.',
          solucao: gateSolucao,
          tutorDepois: 'A ordem dos ramos é a decisão: se a queda relativa viesse antes do piso, uma baseline antiga baixa deixaria passar uma categoria de segurança abaixo de 100%.',
          callout: 'A função decide como o gate: piso, banda e aviso, com o limite exato tratado.' },
        { tipo: 'cenario', id: 'b6-cenario', titulo: 'O nightly reprovou sem commit', obrigatorio: false,
          enunciado: 'Segunda de manhã: a suíte completa reprovou a categoria fora_de_escopo (85% para 78%). O repositório não recebeu nenhum commit desde sexta.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O time propõe uma saída. Qual você segue?', opcoes: [
              { texto: 'Rodar de novo até passar e seguir em frente.', vai: 'f-ignorou', tom: 'ruim', consequencia: 'esconde exatamente o sinal para o qual o nightly existe.' },
              { texto: 'Tratar como possível mudança do provedor: abrir o trace do nightly e comparar o modelo realmente usado e o prompt_tag.', vai: 'trace', tom: 'ok', consequencia: 'sem commit, as causas prováveis são o alias, a degradação do serviço ou o fallback.' },
              { texto: 'Baixar o limiar do gate para 78%.', vai: 'f-afrouxou', tom: 'ruim', consequencia: 'o gate passa a aprovar a regressão em vez de investigá-la.' }
            ] },
            trace: { texto: 'O atributo gen_ai.response.model mudou: o provedor atualizou o modelo por trás do alias. O que fazer?', opcoes: [
              { texto: 'Pinnar a versão do modelo no prompt, registrar a causa e reavaliar a baseline com a nova versão antes de migrar.', vai: 'f-bom', tom: 'ok', consequencia: 'a mudança vira decisão deliberada, comparável nas duas versões.' },
              { texto: 'Aceitar a nova baseline automaticamente.', vai: 'f-afrouxou', tom: 'ruim', consequencia: 'a regressão vira o novo normal sem ninguém decidir isso.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O nightly fez o seu trabalho: a causa foi achada pelo trace, a versão ficou fixada e a migração será uma decisão com dados.' },
            'f-ignorou': { bom: false, texto: 'A queda foi tratada como instabilidade e a causa real, a mudança do provedor, continuou em produção.' },
            'f-afrouxou': { bom: false, texto: 'O gate deixou de proteger: a regressão foi incorporada à baseline.' }
          },
          callout: 'Você usou o trace para achar a mudança do provedor e fixou a versão antes de decidir.' },
        { tipo: 'callout', tom: 'info', titulo: 'Transferência: onde o cache de eval engana', html:
          '<p>Estude o cache de resultado de eval do laboratório (chave por caso, tag, modelo e dataset) e responda por escrito em que situação ele engana e como detectar. O não determinismo escondido pelo cache é o que revela um caso que passa 70% das vezes. O roteiro executável (datasets, matriz, gate e piso de segurança) está no <code>Laboratório guiado M06</code>. O conjunto local usa um tamanho ilustrativo nas seis categorias, que serve ao roteiro e não é amostra suficiente para inferência. A aplicação ao Capstone é trilha opcional.</p>' },
        { tipo: 'escolha', id: 'b6-esc-injection', titulo: 'Confira: a banda na segurança',
          pergunta: 'O gate de CI compara a taxa de injection com a baseline e reprova se cair mais de 2 pontos. Qual o problema?',
          opcoes: [
            { id: 'a', texto: 'Nenhum: a banda vale para tudo.', correta: false, porque: 'uma queda de 2 pp em injection seria aceita.' },
            { id: 'b', texto: 'Segurança pede piso absoluto (idealmente 100%): um caso de injection que passa é bloqueio de merge; a banda relativa é para qualidade.', correta: true, porque: 'calibração do bloco: banda na qualidade, piso na segurança, alerta em custo e latência.' },
            { id: 'c', texto: 'Deveria reprovar com qualquer queda em qualquer categoria.', correta: false, porque: 'o número oscila sozinho; o gate reprovaria toda semana e seria desligado.' }
          ] },
        { tipo: 'escolha', id: 'b6-esc-nightly', titulo: 'Confira: o nightly',
          pergunta: 'Para que serve a suíte agendada se não houve nenhum commit?',
          opcoes: [
            { id: 'a', texto: 'Detectar piora sem mudança de código: o provedor atualizou o modelo por trás do alias, o serviço degradou ou o fallback passou a acionar mais.', correta: true, porque: 'no PR roda o subconjunto barato; no merge e à noite, a completa.' },
            { id: 'b', texto: 'Economizar tokens.', correta: false, porque: 'a completa custa mais.' },
            { id: 'c', texto: 'Atualizar a baseline automaticamente.', correta: false, porque: 'atualizar a baseline é decisão humana depois de investigar.' }
          ] },
        { tipo: 'escolha', id: 'b6-esc-cache', titulo: 'Confira: o cache de eval',
          pergunta: 'O cache de resultado do eval acelera a CI. Quando ele engana?',
          opcoes: [
            { id: 'a', texto: 'Nunca: é determinístico por definição.', correta: false, porque: 'ele congela um resultado de processo estocástico.' },
            { id: 'b', texto: 'Só quando o dataset é pequeno.', correta: false, porque: 'o problema independe do tamanho.' },
            { id: 'c', texto: 'Esconde o não determinismo: um caso que passa 70% das vezes pode parecer estável porque só o primeiro resultado é reutilizado.', correta: true, porque: 'repita execuções reais periodicamente (nightly sem cache) e olhe a variação por caso, não só a média.' }
          ] },
        { tipo: 'takeaway', html: 'Segurança tem <mark>piso</mark>, qualidade tem <mark>banda</mark>, custo só <mark>avisa</mark>; o nightly pega o que nenhum <mark>commit</mark> explica.' }
      ] }
    ]
  });
})();
