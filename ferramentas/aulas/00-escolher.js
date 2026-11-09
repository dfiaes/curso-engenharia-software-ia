/* Ferramentas · abertura da trilha · "Como escolher seu agente de código". Nenhum fato novo: tudo vem de ferramentas/fontes/*.md e das aulas da trilha, verificados em 09/11/2026 (preço, plano e modelo revalidam em 30 dias; comando e arquivo de configuração, em 90). O que as fontes marcam como "não confirmado" aparece aqui como "não confirmado". */
(function () {
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function tab(cab, linhas) {
    return '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<td><strong>' + c + '</strong></td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  var COL = ['Eixo', 'Claude Code', 'Codex CLI', 'Cursor', 'GitHub Copilot', 'OpenCode', 'Gemini CLI / Antigravity'];

  TrilhaAula.registrar({
    id: 'fer-escolher',
    titulo: 'Como escolher seu agente de código',
    minutos: 25,
    resumo: 'O mapa das seis ferramentas por eixo (onde roda, modelos, instruções, permissões, extensão, CI, custo), três cenários de escolha e a regra do curso para não ficar preso a um fornecedor.',
    objetivo: 'Comparar as seis ferramentas da trilha pelos eixos que mudam a decisão, escolher uma para o seu contexto justificando pelos critérios e separar o que você escreve em formato aberto (AGENTS.md, MCP, SKILL.md) do que fica no formato de cada fornecedor.',
    revisao: [
      { id: 'esc-agents-claude', pergunta: 'O repositório do time tem <code>AGENTS.md</code> e <code>CLAUDE.md</code> separados, com conteúdos diferentes. O que o Claude Code lê?',
        opcoes: [
          opc('a', 'Só o <code>CLAUDE.md</code>: o <code>AGENTS.md</code> é lido apenas quando não existe nenhum arquivo CLAUDE', true, 'por isso a fonte única é o <code>AGENTS.md</code> e o <code>CLAUDE.md</code> fica com uma linha <code>@AGENTS.md</code>.'),
          opc('b', 'Os dois, somando o conteúdo', false, 'a documentação só lê o AGENTS.md quando não há CLAUDE.md, .claude/CLAUDE.md nem CLAUDE.local.md.'),
          opc('c', 'Só o <code>AGENTS.md</code>', false, 'o Claude Code procura primeiro os arquivos CLAUDE.')] },
      { id: 'esc-opencode-claude', pergunta: 'Qual destas ferramentas lê apenas <code>AGENTS.md</code>, sem fallback para <code>CLAUDE.md</code>?',
        opcoes: [
          opc('a', 'OpenCode', true, 'a documentação V2 registra só <code>AGENTS.md</code>; o Cursor (CLI) e o Copilot leem também <code>CLAUDE.md</code>.'),
          opc('b', 'Cursor (CLI)', false, 'o CLI lê <code>.cursor/rules</code>, <code>AGENTS.md</code> e <code>CLAUDE.md</code>.'),
          opc('c', 'GitHub Copilot (CLI)', false, 'lê <code>AGENTS.md</code>, <code>CLAUDE.md</code> ou <code>GEMINI.md</code>, além do seu próprio arquivo.')] },
      { id: 'esc-garantia', pergunta: 'Uma regra "nunca edite <code>migrations/</code>" precisa valer sempre. Onde ela deve morar?',
        opcoes: [
          opc('a', 'Escrita no arquivo de instruções (orientação) e imposta por permissão negada, hook ou sandbox no formato da ferramenta (garantia)', true, 'o arquivo de instruções é contexto: reduz a chance. Quem bloqueia é a camada que a ferramenta aplica fora do modelo.'),
          opc('b', 'Só no <code>AGENTS.md</code>, em maiúsculas', false, 'continua sendo contexto.'),
          opc('c', 'Só numa skill', false, 'skill também é instrução que o modelo segue.')] },
      { id: 'esc-gemini-transicao', pergunta: 'Um dev usa a conta gratuita pessoal e pergunta por que o Gemini CLI parou de atendê-lo. Qual é o registro das fontes?',
        opcoes: [
          opc('a', 'Em 18/06/2026 o Gemini CLI deixou de atender gratuitos individuais e Google AI Pro/Ultra; o Antigravity CLI (19/05/2026) é o caminho, e o Gemini CLI segue em Code Assist Standard/Enterprise e chaves pagas', true, 'é uma transição de produto, não um defeito da instalação.'),
          opc('b', 'O pacote npm foi removido', false, 'o registro npm ainda lista versões do <code>@google/gemini-cli</code>.'),
          opc('c', 'O Gemini CLI só roda em Vertex', false, 'também aceita chave de API e licenças Code Assist.')] },
      { id: 'esc-mcp-portavel', pergunta: 'O que é portável entre as ferramentas quando você configura um servidor MCP?',
        opcoes: [
          opc('a', 'O servidor (o processo ou a URL) e o protocolo; o arquivo de configuração muda de dialeto em cada ferramenta', true, 'a chave é <code>mcpServers</code> em umas, <code>[mcp_servers.*]</code> no Codex, <code>mcp.servers</code> no OpenCode, <code>serverUrl</code> no <code>agy</code>.'),
          opc('b', 'O arquivo <code>.mcp.json</code> funciona sem mudança nas seis', false, 'cada uma lê o seu arquivo e o seu esquema.'),
          opc('c', 'Nada: cada ferramenta exige um servidor próprio', false, 'o ponto do protocolo aberto é o mesmo servidor atender vários clientes.')] }
    ],
    abas: [

      /* ---------------- Aba 1 ---------------- */
      { rotulo: 'O mapa das seis', blocos: [
        { tipo: 'texto', html:
          '<p>Seis ferramentas resolvem o mesmo ciclo (ler o repositório, propor um plano, editar, rodar comandos, mostrar o diff) com <strong>endereços diferentes</strong>. Escolher bem é comparar os eixos em que elas realmente divergem, não a lista de recursos. Os eixos abaixo vêm das tabelas de fontes da trilha, verificadas em 09/11/2026 na documentação oficial de cada uma.</p>' +
          '<p class="ta-nota">Gemini CLI e Antigravity são dois produtos do mesmo fornecedor e aparecem juntos porque o segundo substituiu o primeiro para a maioria dos usuários individuais (veja a aba seguinte).</p>' +
          '<h3>Onde roda e com qual modelo</h3>' },
        { tipo: 'texto', largo: true, html: tab(COL, [
          ['Onde roda', 'Terminal (<code>claude</code>). Extensão de IDE: não confirmado nesta trilha', 'CLI; o app do ChatGPT e a extensão de IDE compartilham o <code>config.toml</code>; web e revisão de código na nuvem nos planos', 'Editor (<kbd>Cmd/Ctrl</kbd>+<kbd>I</kbd>), CLI (<code>agent</code>) e Cloud Agents em VM isolada', 'Modo agente no IDE, agente de nuvem (devolve PR) e Copilot CLI', 'TUI <code>opencode</code>, <code>mini</code>, <code>pair</code> e servidor <code>serve</code>', 'Gemini CLI no terminal; Antigravity em App, CLI (<code>agy</code>) e SDK Python'],
          ['Modelos', 'Anthropic por apelido (<code>sonnet</code>, <code>opus</code>, <code>haiku</code>); também Bedrock, Google Cloud, Foundry ou gateway da empresa', 'Modelos da OpenAI (<code>gpt-6.1-sol</code>, <code>gpt-6-luna</code>) com níveis de esforço', 'Modelos do Cursor e de terceiros; modo Auto', 'Escolha por <code>--model</code>, inclui <code>auto</code>; a revisão de código escolhe o modelo', 'Vários provedores, no formato <code>provedor/modelo#variante</code>', 'Por plano: Gemini 4 Argon nos pagos, 3.8 Flash desde o gratuito; Claude Sonnet 5.5 e Opus 5.5 em planos pagos']
        ]) },
        { tipo: 'texto', html: '<h3>Instruções e controle</h3>' },
        { tipo: 'texto', largo: true, html: tab(COL, [
          ['Instruções do projeto', '<code>CLAUDE.md</code> e <code>.claude/rules/</code>; <code>AGENTS.md</code> só se não houver CLAUDE', '<code>AGENTS.md</code> da raiz ao diretório atual, com <code>AGENTS.override.md</code>', '<code>.cursor/rules</code> (<code>.mdc</code>); o CLI lê também <code>AGENTS.md</code> e <code>CLAUDE.md</code>', '<code>.github/copilot-instructions.md</code>, <code>*.instructions.md</code> com <code>applyTo</code>, <code>AGENTS.md</code>, <code>CLAUDE.md</code> ou <code>GEMINI.md</code> (depende da superfície)', 'Só <code>AGENTS.md</code>, global e aninhado', '<code>GEMINI.md</code> (Gemini CLI); <code>AGENTS.md</code>/<code>GEMINI.md</code> e <code>.agents/rules</code> (Antigravity)'],
          ['Permissões e sandbox', 'Modos (default, plan, acceptEdits...) + regras <code>allow</code>/<code>ask</code>/<code>deny</code>; deny vence', '<code>sandbox_mode</code> × <code>approval_policy</code>; regras <code>.rules</code> (experimental)', 'Run modes (Auto-review, Allowlist, Run Everything), <code>permissions.json</code>, sandbox com rede bloqueada por padrão', '<code>--allow-tool</code>/<code>--deny-tool</code> (negar vence), <code>/sandbox</code>, autopilot', '<code>permissions</code> em lista ordenada (a última regra vence; base <code>* * allow</code>) e <code>policies</code> que só restringem', 'Gemini CLI: modos de aprovação e motor de políticas TOML. <code>agy</code>: modos e permissões (Deny &gt; Ask &gt; Allow)']
        ]) },
        { tipo: 'escolha', id: 'esc-escolha-base-allow', titulo: 'Confira: a política-base do OpenCode',
          pergunta: 'No OpenCode V2 você não escreveu nenhuma regra em <code>permissions</code> e o agente executou um comando de shell sem perguntar. Pela documentação registrada na trilha, o que explica isso?',
          opcoes: [
            opc('a', 'A política-base é <code>* * allow</code>: sem regra sua, tudo é permitido (inclusive <code>external_directory</code>); quem restringe é você', true, 'a ordem importa: a última regra que casa vence, e o padrão é permissivo.'),
            opc('b', 'O OpenCode pergunta sempre; o relato está errado', false, 'o padrão documentado é permitir.'),
            opc('c', 'O sandbox do sistema operacional bloqueou a pergunta', false, 'a pergunta vem da camada de permissões, não do sandbox.')
          ], tutorDepois: 'Antes de adotar qualquer ferramenta, descubra o que ela faz quando você não configura nada.' },
        { tipo: 'takeaway', html: 'As ferramentas se parecem no <mark>ciclo</mark> e divergem no <mark>padrão de segurança</mark>, no arquivo de <mark>instruções</mark> e no <mark>provedor de modelos</mark>: compare esses três primeiro.' }
      ] },

      /* ---------------- Aba 2 ---------------- */
      { rotulo: 'Extensão, automação e custo', blocos: [
        { tipo: 'texto', html:
          '<h3>Extensão e uso sem tela</h3>' +
          '<p>O que cada ferramenta aceita para crescer além do prompt e como roda sem ninguém olhando (CI). Os nomes de pasta e de comando são os registrados nas fontes de cada ferramenta.</p>' },
        { tipo: 'texto', largo: true, html: tab(COL, [
          ['MCP', '<code>claude mcp add</code>; escopos local, project e user; <code>.mcp.json</code>', '<code>codex mcp add</code>; <code>[mcp_servers.*]</code> no <code>config.toml</code>', '<code>.cursor/mcp.json</code>; <code>agent mcp list</code>', '<code>~/.copilot/mcp-config.json</code> (CLI), <code>.vscode/mcp.json</code> (VS Code), tela de configuração (nuvem)', '<code>opencode mcp add</code>; <code>mcp.servers</code>', 'Gemini CLI: <code>gemini mcp add</code>. <code>agy</code>: <code>mcp_config.json</code>, só HTTP em streaming'],
          ['Skills', '<code>.claude/skills/&lt;nome&gt;/SKILL.md</code>', '<code>.agents/skills</code>; <code>$nome</code>', '<code>.agents/skills</code> e <code>.cursor/skills</code>; lê também <code>.claude</code> e <code>.codex</code>', '<code>.github/skills</code>, <code>.claude/skills</code>, <code>.agents/skills</code>', '<code>.opencode/skills</code>; lê também <code>.claude</code> e <code>.agents</code>', '<code>.agents/skills</code> nos dois produtos (o Gemini CLI aceita também <code>.gemini/skills</code>)'],
          ['Hooks', 'Settings; exit 2 bloqueia', 'Locais, com confiança por hash em <code>/hooks</code>', '<code>.cursor/hooks.json</code>, <code>"version": 1</code>', '<code>.github/hooks/*.json</code>', 'Pelos plugins V2 (<code>permission.hook</code>)', 'Gemini CLI e <code>agy</code> (<code>hooks.json</code>), contratos de saída diferentes'],
          ['Plugins', '<code>.claude-plugin/plugin.json</code>; <code>claude plugin install</code>', '<code>codex plugin</code>, <code>/plugins</code>', '<code>.cursor-plugin/plugin.json</code>; marketplaces de time', '<code>copilot plugin install PLUGIN@MARKETPLACE</code>', '<code>opencode plugin</code> (V2; plugins V1 não rodam)', 'Gemini CLI: extensões. <code>agy plugin</code>, com <code>agy plugin import gemini</code>'],
          ['Sem tela e CI', '<code>claude -p</code> (<code>--bare</code> no CI); <code>anthropics/claude-code-action@v1</code>', '<code>codex exec</code> (read-only por padrão); <code>openai/codex-action@v1</code>', '<code>agent -p</code>; sem exemplo oficial de GitHub Actions (conflito entre páginas sobre escrita sem <code>--force</code>)', '<code>copilot -p</code>; agente de nuvem e <code>copilot-setup-steps.yml</code>', '<code>opencode run</code>; ação oficial na V2: não confirmado', '<code>gemini -p</code> e <code>agy -p</code> (códigos de saída próprios)']
        ]) },
        { tipo: 'texto', html:
          '<h3>Custo e plano (verificado em 09/11/2026)</h3>' +
          '<p>Preço, plano, modelo e recurso em prévia têm prazo de <strong>30 dias</strong> nas fontes. Trate a tabela como foto datada e abra a página oficial antes de decidir. Moeda: dólar, por mês.</p>' },
        { tipo: 'texto', largo: true, html: tab(['Ferramenta', 'Como se paga', 'O que as fontes registram', 'Não confirmado'], [
          ['Claude Code', 'Assinatura Claude (Pro, Max, Ultra, Team, Enterprise), crédito de API (Console), Bedrock, Google Cloud ou Foundry', 'Por token; com assinatura o uso entra no plano; a documentação de custos citava média de cerca de US$ 13 por desenvolvedor por dia ativo na API', 'Valores de plano: a aula remete à página oficial'],
          ['Codex CLI', 'Plano do ChatGPT ou chave de API (por uso, indicada para CI)', 'Go US$ 8, Plus US$ 20, Pro a partir de US$ 100', 'Lista completa de modelos por plano muda rápido'],
          ['Cursor', 'Plano individual, Teams ou Enterprise', 'Free US$ 0, Plus US$ 8, Premium US$ 30, Super US$ 100, Ultra US$ 200; Teams US$ 30/100/200 por assento; Cloud Agents exigem Premium ou superior', 'Modelo padrão do Cursor'],
          ['GitHub Copilot', 'Plano GitHub, em AI Credits (1 crédito = US$ 0,01)', 'Free US$ 0; Pro US$ 10 (1.500 créditos); Pro+ US$ 39; Max US$ 100; Business US$ 19 por assento; Enterprise US$ 39; CLI incluído em todos os planos', 'Tabela de preço por modelo (existe, não reproduzida)'],
          ['OpenCode', 'Chave do provedor que você escolher, login de conta ChatGPT ou OpenCode Go; software MIT', 'OpenCode Go US$ 10; modelos gratuitos podem ser desligados com <code>OPENCODE_DISABLE_FREE_MODELS=1</code>', 'Custo real: depende do provedor'],
          ['Gemini CLI / Antigravity', 'Gratuito, planos Pro e Ultra, Standard/Plus empresarial, chave de API ou Vertex', 'Antigravity gratuito US$ 0; Standard/Plus empresarial a partir de US$ 30 por assento. Gemini CLI: desde 18/06/2026 não atende gratuitos individuais nem Google AI Pro/Ultra', 'Preços de Google AI Pro e Ultra']
        ]) },
        { tipo: 'callout', tom: 'info', titulo: 'Teto de gasto é recurso da ferramenta', html:
          'Quem automatiza precisa do teto: <code>--max-budget-usd</code> e <code>--max-turns</code> no Claude Code, <code>--max-ai-credits</code> no Copilot (modo programático), <code>opencode stats</code> para acompanhar. Confira a flag na sua versão antes de depender dela.' },
        { tipo: 'takeaway', html: 'Extensão e CI existem nas seis, com <mark>nomes diferentes</mark>; o que muda a decisão é o <mark>custo previsível</mark>, e ele tem <mark>data de validade</mark> de 30 dias.' }
      ] },

      /* ---------------- Aba 3 ---------------- */
      { rotulo: 'Qual escolher', blocos: [
        { tipo: 'texto', html:
          '<p>Não existe a melhor ferramenta; existe a que combina com <strong>onde o seu trabalho já vive</strong>, <strong>para onde o seu dado pode ir</strong> e <strong>quanto você aceita gastar sem teto</strong>. A linguagem do projeto (.NET, Angular, Python) não aparece como critério nas fontes da trilha: as seis operam sobre arquivos e comandos. Decida por contexto, não por stack.</p>' },
        { tipo: 'ordene', id: 'esc-ordene-criterios', titulo: 'Ordem de decisão', obrigatorio: false,
          enunciado: 'Coloque os passos na ordem em que você os usaria para escolher uma ferramenta para um time.',
          itens: [
            { id: 'piloto', texto: 'Rodar um piloto de duas semanas com uma tarefa real e medir custo e retrabalho' },
            { id: 'dados', texto: 'Levantar a política de dados: que código e que segredos podem sair da máquina e para qual provedor' },
            { id: 'onde', texto: 'Descobrir onde o trabalho vive (PR no GitHub, editor, terminal, CI)' },
            { id: 'aberto', texto: 'Escrever as instruções em AGENTS.md e os servidores em MCP, antes de criar arquivos do fornecedor' },
            { id: 'orcamento', texto: 'Definir o teto de gasto e o plano candidato, com a data da consulta de preço' }
          ],
          solucao: ['onde', 'dados', 'orcamento', 'aberto', 'piloto'],
          dica: 'Primeiro as restrições que eliminam opções; por último o que mede a opção que sobrou.',
          tutorDepois: 'Restrições eliminam, formato aberto protege a saída, piloto confirma.' },

        { tipo: 'cenario', id: 'esc-cen-time', titulo: 'Time .NET e Angular, repositórios no GitHub', obrigatorio: true,
          enunciado: 'Um time de oito pessoas mantém uma API .NET e um front Angular em repositórios do GitHub. O fluxo é issue, branch, pull request e revisão. Metade usa editores diferentes e todos querem um agente. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Como você começa?', opcoes: [
              { texto: 'Cada pessoa escolhe a ferramenta que preferir, e cada uma cria o próprio arquivo de instruções.', vai: 'f-fragmentado', tom: 'ruim', consequencia: 'as regras do time viram seis arquivos que divergem.' },
              { texto: 'Partir de onde o trabalho vive: o GitHub. Escrever as regras do time em <code>AGENTS.md</code> na raiz e avaliar primeiro a ferramenta que entrega PR (Copilot, agente de nuvem e CLI), deixando as demais livres para ler o mesmo arquivo.', vai: 'no2', tom: 'ok', consequencia: 'a fonte das regras não depende do fornecedor, e o ponto de integração é o PR.' },
              { texto: 'Escolher pela stack: procurar a ferramenta "melhor para .NET".', vai: 'f-stack', tom: 'ruim', consequencia: 'as fontes da trilha não registram diferença por linguagem.' }
            ] },
            no2: { texto: 'Um colega usa o Claude Code e outro o Cursor. Como as regras chegam a todos?', opcoes: [
              { texto: 'Copiar o conteúdo para <code>CLAUDE.md</code> e <code>.cursor/rules</code> e manter os três.', vai: 'f-fragmentado', tom: 'ruim', consequencia: 'três cópias para sincronizar.' },
              { texto: 'Manter só o <code>AGENTS.md</code> (Cursor e Copilot o leem) e criar um <code>CLAUDE.md</code> de uma linha com <code>@AGENTS.md</code>.', vai: 'f-bom', tom: 'ok', consequencia: 'o Claude Code só lê o AGENTS.md se não houver CLAUDE.md; o import resolve.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Uma fonte de regras, qualquer ferramenta por cima. Diferenças reais ficam para depois: custo por assento (Copilot Business tem preço por assento e pool de créditos; veja a aba anterior) e política da organização.' },
            'f-fragmentado': { bom: false, texto: 'Em dois meses as instruções divergem, e um agente quebra a regra que o outro respeita. Portabilidade começa pelo arquivo de instruções.' },
            'f-stack': { bom: false, texto: 'A decisão foi tomada em um critério sem fonte. O que muda de verdade é o padrão de segurança, o provedor de modelos e o custo.' }
          },
          callout: 'Você partiu de onde o trabalho vive e manteve as regras em formato aberto.' },

        { tipo: 'cenario', id: 'esc-cen-dados', titulo: 'Empresa com política de dados', obrigatorio: false,
          enunciado: 'O banco onde você trabalha proíbe enviar código-fonte a provedores sem contrato corporativo e exige que o time de segurança possa limitar o que o agente executa. A diretoria pediu uma recomendação em uma semana.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O que você faz primeiro?', opcoes: [
              { texto: 'Pedir ao time de segurança o contrato e os termos de retenção do plano candidato, e comparar quem consegue impor política acima do desenvolvedor.', vai: 'no2', tom: 'ok', consequencia: 'a pergunta que decide é de contrato e de controle, não de recurso.' },
              { texto: 'Liberar o plano pessoal gratuito para o time testar com código real.', vai: 'f-vazou', tom: 'ruim', consequencia: 'o código sai antes de qualquer contrato.' },
              { texto: 'Escolher a ferramenta mais barata e confiar na regra de instruções ("não envie segredos").', vai: 'f-instrucao', tom: 'ruim', consequencia: 'instrução é contexto, não controle.' }
            ] },
            no2: { texto: 'Duas ferramentas passam no contrato. Qual critério técnico desempata?', opcoes: [
              { texto: 'A que impõe política em camada que o dev não altera (política de sistema, painel de administração, política da organização), com deny que vence allow e teste de que o bloqueio funciona.', vai: 'f-bom', tom: 'ok', consequencia: 'as fontes registram camadas assim no OpenCode (policies), Cursor (painel e MDM), Copilot (política da organização).' },
              { texto: 'A que tem mais modelos disponíveis.', vai: 'f-modelos', tom: 'ruim', consequencia: 'mais modelos ampliam os provedores que recebem o código.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Contrato primeiro, controle imposto acima do dev depois, e um teste que prova a negação. Retenção e treinamento de dados por plano: <strong>não confirmado nas fontes da trilha</strong>, leia o contrato do fornecedor.' },
            'f-vazou': { bom: false, texto: 'Conta pessoal em código corporativo é o incidente que a política queria evitar.' },
            'f-instrucao': { bom: false, texto: 'Uma frase no AGENTS.md orienta o modelo e não bloqueia nada. Garantia vem de permissão, hook ou sandbox.' },
            'f-modelos': { bom: false, texto: 'O critério decide a quantidade de fornecedores no caminho do dado, que deveria diminuir.' }
          },
          callout: 'Você tratou o contrato e o controle como critérios eliminatórios.' },

        { tipo: 'cenario', id: 'esc-cen-pessoal', titulo: 'Uso pessoal e estudo', obrigatorio: false,
          enunciado: 'Você estuda sozinho no fim de semana, tem um orçamento pequeno e quer aprender o ciclo agente de código sem se prender a um fornecedor.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Por onde começar?', opcoes: [
              { texto: 'Pelo plano gratuito ou de entrada de uma ferramenta, mais uma segunda ferramenta de pontos de vista diferentes, e as duas lendo o mesmo <code>AGENTS.md</code>.', vai: 'no2', tom: 'ok', consequencia: 'você aprende o ciclo, não o produto.' },
              { texto: 'Assinar o plano mais caro para nunca bater em limite.', vai: 'f-caro', tom: 'ruim', consequencia: 'gasto alto antes de saber como você usa.' },
              { texto: 'Contar com o Gemini CLI gratuito individual, que um tutorial antigo recomendava.', vai: 'f-gemini', tom: 'ruim', consequencia: 'desde 18/06/2026 ele não atende esse perfil.' }
            ] },
            no2: { texto: 'Como evitar surpresa de custo?', opcoes: [
              { texto: 'Usar o teto que a ferramenta oferece (por exemplo <code>--max-budget-usd</code> ou <code>--max-ai-credits</code>) e olhar o consumo semanal.', vai: 'f-bom', tom: 'ok', consequencia: 'você mede antes de aumentar o plano.' },
              { texto: 'Deixar o modo sem confirmação ligado e olhar a fatura no fim do mês.', vai: 'f-caro', tom: 'ruim', consequencia: 'sem teto nem confirmação, o custo e o risco crescem juntos.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Plano de entrada, duas ferramentas sobre o mesmo AGENTS.md, teto de gasto. Se uma mudar o preço (30 dias), você troca sem reescrever nada.' },
            'f-caro': { bom: false, texto: 'Você pagou por folga que não media. Comece pequeno e suba com dado.' },
            'f-gemini': { bom: false, texto: 'A fonte registra a transição: o caminho para esse perfil é o Antigravity CLI, e vale conferir o plano atual na página oficial.' }
          },
          callout: 'Você aprendeu o ciclo sem depender de um único fornecedor.' },
        { tipo: 'takeaway', html: 'Escolha pelo <mark>contexto</mark>: onde o trabalho vive, para onde o <mark>dado</mark> pode ir e qual <mark>teto</mark> de gasto você aceita. Stack não decide.' }
      ] },

      /* ---------------- Aba 4 ---------------- */
      { rotulo: 'Portabilidade e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>A regra de portabilidade do curso</h3>' +
          '<p>Três formatos abertos atravessam as seis ferramentas: <strong>AGENTS.md</strong> (instruções), <strong>MCP</strong> (ferramentas e dados externos) e <strong>SKILL.md</strong> (procedimentos reutilizáveis). A regra: <strong>escreva em formato aberto tudo o que puder; deixe no formato do fornecedor só a garantia (permissão, hook, sandbox), pequena, versionada e testada</strong>. Assim, trocar de ferramenta custa uma tarde, não um mês.</p>' },
        { tipo: 'texto', largo: true, html: tab(['Formato', 'Como cada ferramenta lê', 'O que prende você'], [
          ['AGENTS.md', 'Codex, OpenCode (só ele), Cursor, Copilot e Antigravity leem. Claude Code lê só sem arquivo CLAUDE; use <code>CLAUDE.md</code> com <code>@AGENTS.md</code>. Gemini CLI: <code>GEMINI.md</code>, nome configurável em <code>context.fileName</code>', 'Regras condicionais por pasta ou glob: <code>.claude/rules/</code>, <code>.cursor/rules</code> (<code>.mdc</code>), <code>applyTo</code> do Copilot, <code>.agents/rules</code>. Úteis, mas só valem na ferramenta de origem'],
          ['MCP', 'O mesmo servidor serve todas. A configuração muda: <code>mcpServers</code> (Claude Code, Cursor, Copilot CLI), <code>[mcp_servers.*]</code> (Codex), <code>mcp.servers</code> (OpenCode), <code>serverUrl</code> (<code>agy</code>, só HTTP em streaming), <code>servers</code> (VS Code)', 'Escopo e aprovação diferem: servidor de projeto pede aprovação no Claude Code; no agente de nuvem do Copilot, as ferramentas rodam sem pedir. Segredo sempre por variável'],
          ['SKILL.md', 'A pasta <code>.agents/skills</code> é lida por Codex, Cursor, Copilot, OpenCode, Gemini CLI e Antigravity; o Claude Code lê <code>.claude/skills</code>. Mantenha o <code>SKILL.md</code> em uma delas e teste que a outra ferramenta o lista', 'Campos de frontmatter extras (<code>allowed-tools</code>, <code>paths</code>, <code>disable-model-invocation</code>) não são os mesmos em todas. Skill instalada de terceiros é código que o agente segue'],
          ['Não portável', 'Hooks (JSON, TOML e plugins TypeScript, com contratos de saída diferentes), permissões e sandbox, subagentes (Markdown em umas, TOML no Codex), plugins e marketplaces, comandos personalizados, checkpoints (<code>/rewind</code> no Claude Code, checkpoints locais no Cursor, Git no Codex)', 'É onde está a garantia. Documente cada uma em uma tabela do repositório e reescreva ao trocar de ferramenta']
        ]) },
        { tipo: 'callout', tom: 'neutral', titulo: 'O que dá para migrar com um comando', html:
          'O <code>agy plugin import gemini</code> traz extensões do Gemini CLI para o Antigravity; o Codex tem <code>/import</code>; Cursor e OpenCode leem pastas <code>.claude</code> e <code>.agents</code>. Isso reduz o custo de entrar, não elimina a revisão: cada ferramenta ignora em silêncio campos que não conhece.' },
        { tipo: 'escolha', id: 'esc-escolha-fonte-unica', titulo: 'Confira: uma fonte, três ferramentas',
          pergunta: 'Seu time usa Claude Code, Codex e Cursor no mesmo repositório. Qual é a estrutura de instruções que menos diverge ao longo do tempo?',
          opcoes: [
            opc('a', '<code>AGENTS.md</code> como fonte única, com <code>CLAUDE.md</code> contendo <code>@AGENTS.md</code>', true, 'Codex e Cursor leem o AGENTS.md; o import cobre o Claude Code, que só o lê na ausência de arquivo CLAUDE.'),
            opc('b', 'Três arquivos (<code>CLAUDE.md</code>, <code>AGENTS.md</code>, <code>.cursor/rules</code>), com o mesmo texto copiado', false, 'a cópia diverge no primeiro mês.'),
            opc('c', 'Só <code>CLAUDE.md</code>, porque os outros o leem', false, 'o Codex lê AGENTS.md; não há registro nas fontes de que leia CLAUDE.md.')
          ], tutorDepois: 'Fonte única em formato aberto, adaptador de uma linha para quem exige outro nome.' },
        { tipo: 'escolha', id: 'esc-escolha-trava', titulo: 'Confira: o que mais prende',
          pergunta: 'Entre estes ativos do seu repositório, qual é o mais caro de migrar para outra ferramenta?',
          opcoes: [
            opc('a', 'Um conjunto de hooks que bloqueiam comandos, escrito no formato de uma ferramenta', true, 'hooks não são um formato aberto: eventos, campos e códigos de saída mudam entre ferramentas, e é neles que mora a garantia.'),
            opc('b', 'Um servidor MCP que o time usa para consultar o Jira', false, 'o servidor é o mesmo; só o arquivo de configuração muda.'),
            opc('c', 'Um <code>AGENTS.md</code> com as convenções do projeto', false, 'é o formato mais portável da lista.')
          ], tutorDepois: 'Quanto mais perto da garantia, menos portável. Por isso ela é pequena e testada.' },
        { tipo: 'texto', html:
          '<h3>Quando revalidar</h3>' +
          '<p>Tudo nesta aula tem data: <strong>09/11/2026</strong>. Preço, plano, modelo e recurso em prévia: revalide em 30 dias. Comandos e arquivos de configuração: 90 dias. As tabelas de fontes (afirmação, aula, URL, prazo) estão em <code>ferramentas/fontes/</code>, uma por ferramenta, e cada seção "não confirmado" lista o que ficou de fora de propósito.</p>' },
        { tipo: 'takeaway', html: 'Orientação em <mark>formato aberto</mark>, garantia no <mark>formato do fornecedor</mark>, e uma <mark>data</mark> em todo preço: assim a ferramenta é <mark>trocável</mark>.' }
      ] }
    ]
  });
})();
