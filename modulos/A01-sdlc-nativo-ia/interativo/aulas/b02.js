/* A01 · Bloco 2: Plan e Design. Fonte: A01.html#b02. Verificado em 12/10/2026 (caminhos de skills por ferramenta, orçamento de descrições do Codex). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var intentMd = [
    '---', 'id: INT-001', 'status: accepted', 'author: ana.po', '---',
    '# Exportar extrato em CSV', '## Problema',
    'Clientes pedem o extrato por e-mail ao suporte porque a tela só mostra os últimos 30 dias.',
    '## Resultado esperado', 'O cliente baixa o extrato de até 12 meses em CSV, sem acionar o suporte.',
    '## Usuários e sistemas', 'Clientes pessoa física; serviço de contas; fila de e-mails.',
    '## Restrições', 'Dados pessoais só do próprio titular; arquivo gerado em até 10 s para 12 meses.',
    '## Questões em aberto', 'Nenhuma.'].join('\n');

  var specMd = [
    '---', 'id: SPEC-001', 'status: accepted', 'intent: INT-001', '---',
    '## Requisitos',
    '- R1: o endpoint devolve CSV com data, descrição e valor das transações do período pedido.',
    '- R2: períodos acima de 12 meses são recusados com erro 422.',
    '- R3: um cliente nunca baixa o extrato de outro titular.',
    '## Critérios de aceite',
    '- AC1 (R1): dado um período válido, o CSV tem cabeçalho e uma linha por transação.',
    '- AC2 (R2): dado um período de 13 meses, a resposta é 422 e nenhum arquivo é gerado.',
    '- AC3 (R3): dado o token do cliente A e a conta do cliente B, a resposta é 403.',
    '## Políticas aplicadas', '- Segurança: autorização por titular (skill de segurança v3).',
    '## Fora de escopo', 'Exportar em PDF.'].join('\n');

  var workflow = [
    '# .github/workflows/spec-from-intent.yml (esboço)',
    'on:', '  push:', '    branches: [main]', '    paths: ["docs/intent/**"]',
    'jobs:', '  draft-spec:', '    runs-on: ubuntu-latest',
    '    permissions: { contents: write, pull-requests: write }',
    '    steps:', '      - uses: actions/checkout@v4', '      - run: |',
    '          for f in $(git diff --name-only HEAD~1 -- docs/intent); do',
    '            grep -q \'^status: accepted\' "$f" || continue',
    '            $AGENT_HEADLESS "Escreva a spec de $f em docs/specs/ no formato do modelo. Aplique as skills de política e sinalize preocupações; não as resolva."',
    '          done',
    '      - run: python -m sdlc_kit validate --root .   # o rascunho já nasce validado',
    '      # abrir o PR com a spec (ação de sua escolha); o humano revisa como código'].join('\n');

  TrilhaAula.registrar({
    id: 'a01-b2',
    titulo: 'Plan e Design: do intent.md à spec.md',
    minutos: 30,
    resumo: 'Dois arquivos pequenos de estrutura fixa substituem a ideia de reunião e a política de 40 páginas: o intent captura o problema e a spec o torna verificável, com políticas aplicadas durante a escrita.',
    objetivo: 'Redigir intent e spec com ids rastreáveis, decidir entre skill, instrução, hook e linter para cada regra e nomear um sistema de registro por artefato.',
    revisao: [
      { id: 'a01b2-intent-aceito', pergunta: 'Um intent com <code>status: accepted</code> traz duas perguntas em "Questões em aberto". O que o processo deve fazer?',
        opcoes: [
          opc('a', 'Tratar como inválido: aceitar significa que o problema está claro; resolva as questões ou volte o status para rascunho', true, 'questões empurradas adiante reaparecem como retrabalho na spec; o validador do laboratório devolve INTENT_OPEN_QUESTIONS.'),
          opc('b', 'Seguir para a spec e resolver as dúvidas durante o Build', false, 'o erro vira retrabalho: a spec muda depois do primeiro plano.'),
          opc('c', 'Rejeitar o intent definitivamente', false, 'é exagero: o remédio é responder as questões ou manter o rascunho.')] },
      { id: 'a01b2-sinalizar', pergunta: 'O agente encontra, ao escrever a spec, uma preocupação de política. O que ele faz?',
        opcoes: [
          opc('a', 'Sinaliza a preocupação; o product owner a encaminha ao dono da política', true, 'o agente não resolve preocupação de política, a decisão é do dono.'),
          opc('b', 'Ajusta o texto da spec até a política passar', false, 'tira a decisão de quem a possui.'),
          opc('c', 'Ignora, porque a skill já foi carregada', false, 'skill carregada não prova que a política foi aplicada.')] },
      { id: 'a01b2-mecanismo', pergunta: 'Uma invariante que nunca pode falhar, como segredo no diff, deve ficar em qual mecanismo?',
        opcoes: [
          opc('a', 'Hook, pre-commit e check obrigatório no CI', true, 'instrução é consultiva; verificação é determinística.'),
          opc('b', 'Uma skill com descrição de disparo', false, 'skill orienta e pode ser ignorada.'),
          opc('c', 'Um parágrafo no arquivo de instruções', false, 'gasta contexto e continua sendo texto que o modelo pode não cumprir.')] },
      { id: 'a01b2-fonte', pergunta: 'Requisitos no Jira e <code>spec.md</code> no repositório, cada um com status "aprovado". Qual o problema central?',
        opcoes: [
          opc('a', 'Duas fontes da verdade para o mesmo artefato: não está definido qual status dispara a automação nem qual vence na divergência', true, 'o playbook pede um sistema de registro por artefato e uma regra de precedência escrita antes de automatizar.'),
          opc('b', 'O Jira não pode coexistir com markdown', false, 'coexistir é possível, pelo arranjo de ligação.'),
          opc('c', 'Ferramentas legadas são mais seguras, então a spec deveria ficar só no Jira', false, 'nenhuma fonte é intrinsecamente mais segura; importam regra, permissão e auditoria.')] },
      { id: 'a01b2-rastreio', pergunta: 'O que o formato com ids (<code>R1</code>, <code>AC1</code>) permite?',
        opcoes: [
          opc('a', 'Rastreio mecânico: todo requisito tem critério, nenhum critério cita requisito inexistente e o plano cobre cada requisito com um teste', true, 'é o validador conferindo a cadeia intent, spec e plano.'),
          opc('b', 'Dispensar a revisão humana da spec', false, 'o gate continua sendo humano.'),
          opc('c', 'Gerar o código automaticamente a partir dos ids', false, 'os ids rastreiam; não geram código.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Dois defeitos de processo que custam mais que um bug</h3>' +
          '<p>O primeiro: a ideia nasce numa reunião, vira um ticket de três linhas e o agente (ou a pessoa) preenche as lacunas com suposições. O segundo: a equipe de segurança tem uma política de 40 páginas que ninguém consulta enquanto escreve o código, e a violação só aparece na revisão, quando consertar custa dez vezes mais. As duas primeiras etapas do loop atacam isso com dois arquivos pequenos e um mecanismo para aplicar políticas durante a escrita da spec.</p>' +
          '<h3>Plan: capturar a ideia como <code>intent.md</code></h3>' +
          '<ol><li>O originador conversa com o agente sobre a ideia (brainstorm). A conversa é descartável.</li>' +
          '<li>O agente redige o <code>intent.md</code> a partir de um <strong>modelo da organização</strong>, para que todo intent responda às mesmas perguntas.</li>' +
          '<li>O originador corrige o rascunho: quem tem o problema valida a descrição dele.</li>' +
          '<li>O arquivo é commitado na <strong>casa do intent</strong>: uma pasta no repositório do produto ou, quando a ideia atravessa vários repositórios, um repositório dedicado a intents.</li>' +
          '<li>Quem não é engenheiro commita por um conector (por exemplo, a interface web do GitHub), sem usar git na linha de comando.</li>' +
          '<li>O product owner aceita (merge) ou rejeita (PR fechado). A decisão fica no histórico.</li></ol>' +
          '<p>Pré-requisito: nenhum além de uma configuração única (o modelo e a pasta), feita pela plataforma. Governança: o git já registra autor, hora e revisões.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Métricas do Plan', html:
          '<p><strong>Líder:</strong> tempo entre a primeira conversa e o intent commitado. <strong>Defasada:</strong> parcela dos intents aceitos que seguem para Design e quantas edições ocorrem depois do primeiro commit da spec.</p>' },
        { tipo: 'texto', html:
          '<h3>Design: do intent aceito à <code>spec.md</code></h3>' +
          '<p>O product owner pede ao agente que transforme o intent aceito em <code>spec.md</code>, aplicando as políticas de marca, segurança, conformidade e UX. O agente não resolve as preocupações que encontra: ele as <strong>sinaliza</strong>, e o product owner as encaminha aos donos de política. Para interface, um mock pode ser construído numa ferramenta de protótipo; no vocabulário do curso, o mock é mais um artefato (arquivo ou link versionado) que a spec cita.</p>' +
          '<p>Há uma automação natural: quando um intent é aceito (merge), um job não interativo gera a spec e abre um PR. O humano revisa a spec como revisaria código. Governança: registre a spec, o prompt usado e as versões das skills aplicadas, para que um auditor reconstrua por que a spec diz o que diz. A decisão final é humana; em risco alto entra também o tech lead.</p>' +
          '<p><strong>Métricas.</strong> Líder: tempo entre o commit do intent e o da spec. Defasada: número de commits em <code>spec.md</code> depois do primeiro <code>plan.md</code> (retrabalho: a spec estava incompleta).</p>' },
        { tipo: 'takeaway', html: 'O intent descreve o <mark>problema</mark>; a spec o torna <mark>verificável</mark>, com preocupações <mark>sinalizadas</mark>, não resolvidas pelo agente.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>O modelo de intent do curso tem cinco seções obrigatórias e é validado pelo <code>sdlc_kit</code> do laboratório. Este é o exemplo dele.</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: intentMd },
        { tipo: 'texto', html:
          '<p>Duas regras mecânicas do validador valem ser entendidas. Um intent com <code>status: accepted</code> <strong>não pode ter questões em aberto</strong>: aceitar é declarar que o problema está claro. E o <code>id</code> segue um padrão fixo (<code>INT-001</code>), porque os artefatos seguintes vão referenciá-lo.</p>' +
          '<p>A spec correspondente usa ids em requisitos e critérios, e é isso que permite o rastreio.</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: specMd },
        { tipo: 'texto', html:
          '<p>O validador confere que todo requisito tem pelo menos um critério de aceite, que nenhum critério cita requisito inexistente e, depois, que o <strong>plano</strong> cobre todos os requisitos e nomeia um teste que prova cada um. É o spec-driven development do M01 usado como contrato entre etapas. Agora rode o validador sobre um plano sem o teste que prova o R3.</p>' },
        { tipo: 'rode', id: 'plan-rode', titulo: 'Rode o validador numa cadeia quebrada', enunciado: 'Saída real do laboratório, com o plano do exemplo sem o teste que prova o R3.',
          prefixo: '$', entrada: 'uv run python -m sdlc_kit validate --root /tmp/a01-ex', unidade: 's', terminalTitulo: 'sdlc_kit', etapas: [
            { id: 'arvore', nome: 'Árvore lida', descricao: 'docs/intent, docs/specs, docs/plans', tom: 'dns', ms: 1, linhas: [
              L('info', 'o sdlc_kit valida a árvore docs/intent, docs/specs e docs/plans')] },
            { id: 'validar', nome: 'Validação', descricao: 'Cadeia intent, spec e plano', tom: 'tcp', ms: 1, linhas: [
              L('cmd', 'uv run python -m sdlc_kit validate --root /tmp/a01-ex'),
              L('out', 'docs/plans/PLAN-001-exportar-extrato.md: [PLAN_UNPROVEN_REQUIREMENT] R3 não tem teste que prove'),
              L('out', '1 problema(s)'),
              L('hint', 'exit=1')] }
          ],
          prever: { pergunta: 'O plano cobre R1 e R2 com testes, mas não nomeia nenhum teste para R3. O que o validador faz?', opcoes: [
            { id: 'a', texto: 'Aprova: dois de três requisitos cobertos bastam.', correta: false, porque: 'o validador exige um teste que prove cada requisito.' },
            { id: 'b', texto: 'Reprova com exit 1 e aponta o requisito R3 sem prova.', correta: true, porque: 'a cadeia quebrada vira um problema com código (PLAN_UNPROVEN_REQUIREMENT) e exit diferente de 0.' },
            { id: 'c', texto: 'Escreve o teste que falta sozinho.', correta: false, porque: 'o validador só confere; escrever o teste é trabalho de Build, sob o plano.' }
          ] },
          tutorDepois: 'O validador apontou o requisito sem prova e saiu com exit 1. É assim que a cadeia intent, spec e plano deixa de ser promessa e vira checagem.',
          callout: 'Você viu a cadeia quebrada ser barrada por script, não por memória de revisor.' },
        { tipo: 'texto', html:
          '<h3>Gerar a spec quando o intent é aceito</h3>' +
          '<p>Em esboço, agnóstico de ferramenta: <code>$AGENT_HEADLESS</code> é o modo não interativo da sua ferramenta (a tabela do bloco 5 lista os comandos).</p>' },
        { tipo: 'codigo', linguagem: 'yaml', texto: workflow },
        { tipo: 'takeaway', html: 'Ids <mark>R1 e AC1</mark> tornam a cadeia <mark>verificável por script</mark>, e a spec gerada nasce validada.' }
      ] },

      { rotulo: 'Políticas e fonte da verdade', blocos: [
        { tipo: 'texto', html:
          '<h3>Políticas como skills ou regras</h3>' +
          '<p>Uma <strong>skill</strong> é uma pasta com um <code>SKILL.md</code> (nome, descrição de quando usar e instruções), carregada pelo agente sob demanda. O formato se tornou comum entre ferramentas. Na prática, <code>.agents/skills/</code> é o denominador comum, e uma política escrita uma vez serve às três ferramentas abaixo.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Ferramenta</th><th>Onde lê skills</th></tr></thead><tbody>' +
          '<tr><td>Cursor</td><td><code>.cursor/skills/</code> e <code>.agents/skills/</code> (e também <code>.claude/skills/</code> e <code>.codex/skills/</code>)</td></tr>' +
          '<tr><td>Codex</td><td>Varre <code>.agents/skills</code> do diretório atual até a raiz do repositório, além de <code>~/.agents/skills</code> e <code>/etc/codex/skills</code></td></tr>' +
          '<tr><td>OpenCode</td><td><code>.opencode/skills/</code>, <code>.claude/skills/</code> e <code>.agents/skills/</code></td></tr>' +
          '</tbody></table>' +
          '<p class="ta-nota">Verificado em 12/10/2026 contra a documentação de cada ferramenta. Produtos mudam rápido: confirme na versão em uso.</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          '.agents/skills/seguranca-api/SKILL.md', '---', 'name: seguranca-api',
          'description: Use ao escrever ou alterar endpoints HTTP, autenticação ou acesso a dados de clientes.', '---',
          '# Política de segurança de API (v3, dono: AppSec)',
          '- Todo endpoint que devolve dados de cliente autoriza por titular (nunca só por papel).',
          '- Entrada externa é validada por schema antes de qualquer uso.',
          '- Nenhuma credencial em código; leia de variável de ambiente.',
          'Se a spec pedir algo que viole estas regras, SINALIZE a preocupação em vez de resolvê-la.'].join('\n') },
        { tipo: 'texto', html:
          '<p>O playbook recomenda <strong>uma política por vez</strong>, testada quanto ao disparo (a skill carrega quando deveria e só então) e alterada apenas com aprovação do dono da política. Métrica líder: tempo entre a aprovação da política e o merge da skill. Defasada: achados de revisão que citam aquela política, que devem tender a zero.</p>' +
          '<h3>Qual mecanismo para qual regra</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Natureza da regra</th><th>Mecanismo adequado</th><th>Por quê</th></tr></thead><tbody>' +
          '<tr><td>Conhecimento: "como fazemos X aqui"</td><td>Arquivo de instruções ou skill</td><td>O agente precisa saber; pode haver nuance</td></tr>' +
          '<tr><td>Política com contexto condicional</td><td>Skill/regra com descrição de disparo + dono</td><td>Carregada só quando relevante; auditável por versão</td></tr>' +
          '<tr><td>Invariante que nunca pode falhar (caminho protegido, segredo no diff)</td><td>Hook + pre-commit + check obrigatório no CI</td><td>Instrução é consultiva; verificação é determinística</td></tr>' +
          '<tr><td>Formatação e estilo</td><td>Formatter/linter automático</td><td>Não gasta contexto nem atenção do modelo</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: "aplicamos a política" sem prova', html:
          '<p>Uma skill de segurança carregada pode influenciar a spec; não prova que influenciou. Quando o auditor perguntar como você demonstra que a política foi aplicada, "o modelo leu a skill" não é evidência. Registre a versão da skill e o prompt e ponha um check determinístico atrás das regras que precisam valer: o bloco 3 mostra a hierarquia. <strong>A skill reduz a chance de erro; o check limita o dano.</strong></p>' },
        { tipo: 'texto', html:
          '<h3>Fonte da verdade quando há sistemas legados</h3>' +
          '<p>A maioria das empresas já tem Jira, ServiceNow ou uma ferramenta de requisitos, e o agente não vai aposentá-los na segunda-feira. O playbook trata isso como decisão explícita: <strong>nomeie um sistema de registro para cada artefato</strong>. Três arranjos:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Arranjo</th><th>Como funciona</th><th>Ganha</th><th>Custo / risco</th></tr></thead><tbody>' +
          '<tr><td>O repositório manda</td><td>O markdown é autoritativo; o legado, se existir, é projeção</td><td>Um só lugar; diff, revisão e auditoria nativos</td><td>Quem vive no Jira precisa de um caminho para ler e comentar</td></tr>' +
          '<tr><td>O legado manda</td><td>Jira/ServiceNow guarda o artefato; o agente lê e escreve de volta por um servidor MCP</td><td>Respeita processos e relatórios existentes</td><td>Permissão de escrita do agente no sistema corporativo; limites de API; o repositório perde o histórico das versões</td></tr>' +
          '<tr><td>Ligação</td><td>Cada registro cita o ID ou o SHA do outro; duas fontes convivem</td><td>Adoção sem migração</td><td>Divergência silenciosa; ponto de partida, não destino</td></tr>' +
          '</tbody></table>' +
          '<p>O arranjo de ligação se materializa em duas linhas de front matter e um check que as valida: <code>external: JIRA-1234</code> no intent, e o SHA do commit citado de volta no ticket. A regra de ouro é <strong>uma fonte por artefato</strong>: se o status "aceito" existe no Jira e no <code>intent.md</code>, qual dos dois dispara a spec? Responda por escrito antes de automatizar. Para o visual, o Figma é o registro do desenho: a spec cita o frame e os tokens, e o agente os lê por um servidor MCP quando houver um disponível e aprovado (verifique disponibilidade e permissões na sua organização).</p>' },
        { tipo: 'takeaway', html: 'A skill <mark>reduz a chance</mark> de erro, o check <mark>limita o dano</mark>; e cada artefato tem <mark>uma fonte da verdade</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<p>Hora de montar a peça. Complete a skill de segurança do exemplo: o que faz o agente carregá-la na hora certa e o que ela manda fazer diante de um conflito.</p>' },
        { tipo: 'complete', id: 'plan-complete-skill', titulo: 'Monte a skill de segurança', linguagem: 'markdown',
          enunciado: 'Escolha, em cada lacuna, o trecho que faz a skill carregar quando deve e tratar o conflito como o playbook pede.',
          partes: [
            '---\nname: ', { lacuna: 'nome', opcoes: ['seguranca-api', 'Segurança API', 'politica_geral'], correta: 'seguranca-api' },
            '\ndescription: ', { lacuna: 'desc', opcoes: ['Política de segurança.', 'Use ao escrever ou alterar endpoints HTTP, autenticação ou acesso a dados de clientes.', 'Skill útil para todo o repositório, sempre.'], correta: 'Use ao escrever ou alterar endpoints HTTP, autenticação ou acesso a dados de clientes.' },
            '\n---\n# Política de segurança de API (v3, dono: AppSec)\n- Todo endpoint que devolve dados de cliente autoriza ', { lacuna: 'auth', opcoes: ['por titular, nunca só por papel', 'só por papel', 'por IP de origem'], correta: 'por titular, nunca só por papel' },
            '.\n- Entrada externa é validada por ', { lacuna: 'val', opcoes: ['schema antes de qualquer uso', 'regex no front-end', 'revisão manual depois'], correta: 'schema antes de qualquer uso' },
            '.\nSe a spec pedir algo que viole estas regras, ', { lacuna: 'conflito', opcoes: ['SINALIZE a preocupação em vez de resolvê-la', 'ajuste a spec até passar', 'ignore e siga'], correta: 'SINALIZE a preocupação em vez de resolvê-la' },
            '.\n'
          ],
          explicacao: 'A <code>description</code> diz <em>quando usar</em>: é o que o agente lê para decidir se abre a skill, e descrições vagas competem entre si e gastam contexto. A autorização é por titular porque papel sozinho deixaria um cliente ler o extrato de outro (o R3 da spec). O dono da política é quem decide o conflito; o agente só sinaliza.',
          callout: 'Skill montada: disparo claro, regra concreta e conflito sinalizado.' },
        { tipo: 'cenario', id: 'plan-cenario', titulo: 'Jira ou repositório: quem manda?', obrigatorio: false,
          enunciado: 'O banco mantém requisitos no Jira, e o time quer gerar a spec automaticamente quando o intent for aceito. Escolha o desenho e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O status "aceito" existe no Jira e vai existir no <code>intent.md</code>. O job de geração de spec precisa de um gatilho. O que você define antes de automatizar?', opcoes: [
              { texto: 'Nada: o job dispara quando qualquer um dos dois ficar "aceito".', vai: 'f-diverge', tom: 'ruim', consequencia: 'duas fontes disparam o mesmo job e ninguém sabe qual vence na divergência.' },
              { texto: 'Escolho um sistema de registro por artefato e escrevo a regra de precedência.', vai: 'arranjo', tom: 'ok', consequencia: 'o gatilho passa a ter uma única fonte.' },
              { texto: 'Migro tudo do Jira para markdown antes de começar.', vai: 'f-migracao', tom: 'ruim', consequencia: 'a adoção trava esperando uma migração que ninguém pediu.' }
            ] },
            arranjo: { texto: 'A equipe de negócio vive no Jira e não quer abrir o repositório. Qual arranjo?', opcoes: [
              { texto: 'Ligação: o intent traz <code>external: JIRA-1234</code>, o SHA volta ao ticket e um check valida as duas linhas; o repositório manda no status.', vai: 'f-bom', tom: 'ok', consequencia: 'adoção sem migração, com precedência escrita e verificada.' },
              { texto: 'O legado manda: o agente escreve a spec direto no Jira, com permissão total.', vai: 'f-permissao', tom: 'ruim', consequencia: 'o agente ganha escrita ampla no sistema corporativo e o repositório perde o histórico de versões.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Uma fonte por artefato, ligação validada por check e o job disparando só do merge do intent.' },
            'f-diverge': { bom: false, texto: 'A spec foi gerada duas vezes a partir de versões diferentes do intent, e ninguém soube qual valia.' },
            'f-migracao': { bom: false, texto: 'A migração atrasou a adoção em meses, sem ganho para o time.' },
            'f-permissao': { bom: false, texto: 'A auditoria barrou a permissão de escrita do agente no Jira, e o fluxo parou.' }
          },
          callout: 'Você nomeou um sistema de registro por artefato e escolheu a ligação com precedência escrita.' },
        { tipo: 'escreva', id: 'plan-escreva', titulo: 'Intent ou spec, com as suas palavras', obrigatorio: false,
          enunciado: 'Alguém escreveu no intent: "use Redis para cachear o extrato". Explique o que está fora do lugar e para onde isso deve ir.',
          placeholder: 'O intent descreve… A decisão de usar Redis pertence a…',
          rubrica: [
            'Diz que o intent descreve o <strong>problema e o resultado esperado</strong>, não a solução.',
            'Diz que a decisão de arquitetura (Redis) vai para a <strong>spec</strong> ou para um <strong>ADR</strong> em <code>docs/adr/</code>.',
            'Liga ao custo: solução no intent trava o Design e esconde o problema real.'
          ],
          modelo: '<p>O intent responde "qual o problema e que resultado queremos". Usar Redis é uma escolha de solução, então não pertence ali. Ela vai para a spec ou, se for uma decisão de arquitetura que merece registro, para um ADR em <code>docs/adr/</code>. Misturar os dois faz o Design partir de uma solução já escolhida e esconde se o problema (clientes pedindo extrato por e-mail) pode ser resolvido de outro jeito.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Trade-offs', html:
          '<ul><li><strong>Spec rígida × exploração.</strong> Em trabalho exploratório o intent pode ficar como rascunho (<code>draft</code>) por semanas. O que não pode é seguir para Build com questões em aberto.</li>' +
          '<li><strong>Muitas skills × contexto.</strong> Cada descrição de skill ocupa contexto; o Codex, por exemplo, limita o orçamento de descrições a uma fração da janela (verificado em 12/10/2026). Políticas demais com descrições vagas competem entre si.</li>' +
          '<li><strong>Geração automática × qualidade.</strong> Uma spec gerada sem revisão cuidadosa vira texto plausível e errado. O automatismo gera o rascunho; o gate é humano.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Erros comuns', html:
          '<ul><li>Misturar solução no intent ("use Redis para...") e problema na spec.</li>' +
          '<li>Aceitar intent com questões em aberto "para ganhar tempo": elas reaparecem como retrabalho na spec.</li>' +
          '<li>Escrever a política em prosa longa dentro do arquivo de instruções, em vez de uma skill com dono e versão.</li></ul>' },
        { tipo: 'escolha', id: 'plan-escolha-aberto', titulo: 'Confira: questões em aberto',
          pergunta: 'O <code>intent.md</code> foi aceito com a seção "Questões em aberto" contendo duas perguntas. O que o processo deve fazer?',
          opcoes: [
            { id: 'a', texto: 'Seguir para a spec; as dúvidas se resolvem durante o Build.', correta: false, porque: 'questões empurradas adiante reaparecem como retrabalho: spec alterada depois do primeiro plano.' },
            { id: 'b', texto: 'Seguir, mas copiar as dúvidas para o <code>plan.md</code>.', correta: false, porque: 'só muda o endereço das dúvidas; o problema continua sem resposta.' },
            { id: 'c', texto: 'Rejeitar o intent definitivamente.', correta: false, porque: 'é exagero: o remédio é responder as questões ou manter o rascunho.' },
            { id: 'd', texto: 'Tratar como inválido: aceitar significa que o problema está claro; resolva as questões ou volte o status para rascunho.', correta: true, porque: 'o validador do laboratório devolve INTENT_OPEN_QUESTIONS para exatamente este caso.' }
          ], tutorDepois: 'Aceitar é declarar que o problema está claro.' },
        { tipo: 'escolha', id: 'plan-escolha-fontes', titulo: 'Confira: duas fontes da verdade',
          pergunta: 'A equipe mantém requisitos no Jira e <code>spec.md</code> no repositório, cada um com seu campo de status "aprovado". Qual o problema central?',
          opcoes: [
            { id: 'a', texto: 'Duas fontes da verdade para o mesmo artefato: não está definido qual status dispara a automação nem qual vence em caso de divergência.', correta: true, porque: 'o playbook pede um sistema de registro por artefato; o arranjo de ligação serve como ponto de partida, mas exige regra explícita de precedência.' },
            { id: 'b', texto: 'O Jira não pode coexistir com markdown.', correta: false, porque: 'coexistir é possível, pelo arranjo de ligação.' },
            { id: 'c', texto: 'Falta um modelo de intent.', correta: false, porque: 'o modelo não resolve a disputa entre dois status "aprovado".' },
            { id: 'd', texto: 'A spec deveria ficar só no Jira, porque ferramentas legadas são mais seguras.', correta: false, porque: 'nenhuma fonte é intrinsecamente mais segura; importam a regra, a permissão e a auditoria.' }
          ], tutorDepois: 'Antes de automatizar, escreva qual fonte vence.' },
        { tipo: 'takeaway', html: 'Skills <mark>reduzem a chance</mark> de erro; o que precisa valer sempre ganha <mark>verificação determinística</mark>.' }
      ] }
    ]
  });
})();
