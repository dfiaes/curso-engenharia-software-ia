/* Aula 6 · Documentação sempre atualizada. Fonte: TR-texto.html, Passo 5 (verificado em 12/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };

  var etapas = function () {
    return [
      { id: 'pr', nome: 'PR muda a API', descricao: 'Código em src/ alterado', tom: 'dns', ms: 4, linhas: [
        L('cmd', 'git diff --stat origin/main'),
        L('out', 'src/Api/Investidores/CadastroController.cs  | 18 +++---'),
        L('out', 'src/Api/Investidores/CadastroRequest.cs     |  6 ++'),
        L('info', 'o campo "cnpj" passa a ser obrigatório em POST /api/investidores')] },
      { id: 'fechar', nome: 'Fechamento: /atualizar-docs', descricao: 'O agente compara diff e doc', tom: 'tcp', ms: 3, linhas: [
        L('info', 'prompts/atualizar-docs.md: comparando o diff com a documentação'),
        L('out', 'docs/specs/PROJ-123-cadastro.md: afirma que "cnpj" é opcional (falso agora)'),
        L('out', 'docs/runbooks/cadastro.md: exemplo de request sem "cnpj"'),
        L('in', 'edições propostas em 2 arquivos; CHANGELOG: PROJ-123 em Alterado')] },
      { id: 'drift', nome: 'Check de drift no CI', descricao: 'make docs-check', tom: 'tls', ms: 2, linhas: [
        L('cmd', 'python3 scripts/hooks/check_docs.py --base origin/main'),
        L('in', 'código mudou e a documentação também: ok')] },
      { id: 'rev', nome: 'Revisão', descricao: 'Item de doc no REVIEW.md', tom: 'request', ms: 12, linhas: [
        L('info', 'REVIEW.md, item 6: o texto novo da spec está certo?'),
        L('hint', 'decisão humana: o drift check vê a edição, só você vê se ela é verdadeira'),
        L('in', 'aprovado')] },
      { id: 'merge', nome: 'Merge', descricao: 'Código e doc entram juntos', tom: 'response', ms: 1, linhas: [
        L('body', 'main atualizada: o próximo agente lê uma spec que diz a verdade')] }
    ];
  };

  var checklistPR =
'## Checklist\n' +
'- [ ] Spec/runbook/README/CHANGELOG atualizados\n' +
'      ou a frase exata: Docs: não se aplica (motivo)\n' +
'- [ ] make check verde';

  var changelog =
'## [1.8.0] - 2026-10-12\n' +
'### Adicionado\n' +
'- PROJ-123: validação de CNPJ no cadastro de investidor.\n' +
'### Corrigido\n' +
'- PROJ-456: arredondamento duplicado na conversão de moeda.';

  TrilhaAula.registrar({
    id: 'docs-atualizados',
    titulo: 'Documentação sempre atualizada',
    minutos: 18,
    resumo: 'Com agentes, doc velha deixa de ser incômodo e vira defeito operacional: o agente lê, confia e escreve código coerente com a doc errada. Aqui você a trata como parte do Done.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Documentação desatualizada sempre existiu. Com agentes ela fica pior: é como um mapa velho entregue a um motorista que o segue à risca. Ele não desconfia, chega ao lugar errado com confiança. <strong>Doc viva é infraestrutura de contexto.</strong> E agentes também são a melhor ferramenta já criada para mantê-la, desde que o processo obrigue.</p>' +
          '<h3>Regra 1: o mesmo PR atualiza a doc</h3>' +
          '<p>Mudança de comportamento e mudança de documentação entram juntas ou não entram. Três apoios mecânicos, do mais barato ao mais forte:</p>' +
          '<ol><li><strong>Checklist no template de PR</strong> (já no kit): "Spec/runbook/README/CHANGELOG atualizados" ou a frase exata <code>Docs: não se aplica (motivo)</code>.</li>' +
          '<li><strong>Checagem de drift no CI</strong> (<code>scripts/hooks/check_docs.py</code>, chamado por <code>make docs-check</code>): se arquivos de código mudaram e nenhum arquivo de documentação mudou, o PR falha, a menos que o corpo traga a frase de dispensa com motivo.</li>' +
          '<li><strong>Prompt de fechamento</strong> (<code>prompts/atualizar-docs.md</code>), rodado pelo agente antes de abrir o PR: compara o diff com a doc, lista afirmações que ficaram falsas e comportamentos novos não documentados, e propõe as edições exatas.</li></ol>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: checklistPR },
        { tipo: 'callout', tom: 'info', titulo: 'Limite do drift check', html:
          'Ele detecta <em>ausência</em> de edição, não <em>correção</em> da edição. Quem garante que o texto novo está certo é a revisão (item de doc no <code>REVIEW.md</code>) e a regra de que critérios de aceite viram teste: a spec que tem teste não mente por muito tempo.' },
        { tipo: 'escolha', id: 'doc-limite', titulo: 'Confira: o que o drift check garante',
          pergunta: 'O CI passou no check de drift. O que isso diz sobre a documentação do PR?',
          opcoes: [
            { id: 'a', texto: 'Que a documentação nova está correta.', correta: false, porque: 'o check só olha se algum arquivo de doc mudou. Um parágrafo errado também conta como mudança.' },
            { id: 'b', texto: 'Que alguma doc foi editada junto com o código, ou que o PR trouxe a dispensa com motivo. A correção continua sendo da revisão.', correta: true, porque: 'ausência de edição é detectável por máquina; verdade do texto exige leitura humana e teste.' },
            { id: 'c', texto: 'Que o agente rodou <code>/atualizar-docs</code>.', correta: false, porque: 'o check não sabe se o prompt rodou. Ele só compara os arquivos alterados.' }
          ] },
        { tipo: 'takeaway', html: '<mark>Doc e código no mesmo PR</mark>: checklist, <mark>check de drift</mark> e prompt de fechamento, com a revisão conferindo a verdade.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>O exemplo: um PR torna o campo <code>cnpj</code> obrigatório em <code>POST /api/investidores</code>. Primeiro você tenta passar sem tocar na documentação e vê o CI barrar. Depois roda o caminho certo, com o fechamento <code>/atualizar-docs</code>.</p>' },
        { tipo: 'quebre', id: 'doc-quebre', titulo: 'Quebre o PR: mude a API e esqueça a doc',
          enunciado: 'Escolha o que fazer com a documentação, envie o PR e observe quem barra. Depois rode o fluxo sem falha.',
          prefixo: '$', entrada: 'gh pr create --title "PROJ-123: cnpj obrigatório no cadastro"', unidade: 'min', terminalTitulo: 'ci', etapas: etapas(),
          tutorAntes: 'Escolha "Não atualizar a doc", aperte Enter e leia o terminal. Depois tente a outra falha e, por fim, rode sem falha.',
          tutorDepois: 'Com a doc no mesmo PR, o check passa e a revisão ainda confere se o texto novo é verdadeiro.',
          callout: 'Você viu o check barrar o drift, viu o que acontece sem ele e viu o fluxo completo.',
          falhas: [
            { id: 'sem-doc', rotulo: 'Não atualizar a doc', efeito: { etapaFalha: 'drift', linhasErro: [
              { kind: 'cmd', text: 'python3 scripts/hooks/check_docs.py --base origin/main' },
              'ERRO: checagem de documentação',
              '  - código mudou sem nenhuma doc; atualize a doc no mesmo PR ou',
              "    escreva 'Docs: não se aplica (motivo)' no PR",
              'CI vermelho: merge bloqueado'
            ], tutor: 'o check viu arquivos em <code>src/</code> mudarem e nenhum em <code>docs/</code>, <code>README</code> ou <code>CHANGELOG</code>. O PR não entra. Corrija atualizando a spec e o runbook no mesmo PR, ou, se de fato nada na doc muda, escreva a frase com o motivo.' } },
            { id: 'sem-check', rotulo: 'Desligar o check "só desta vez"', efeito: { etapaFalha: 'merge', linhasErro: [
              { kind: 'info', text: 'drift check pulado: "é só um campo obrigatório"' },
              { kind: 'in', text: 'merge feito: main com código novo e spec antiga' },
              { kind: 'info', text: 'duas semanas depois, outra sessão de agente lê docs/specs/PROJ-123-cadastro.md' },
              { kind: 'body', text: 'agente: a spec diz que "cnpj" é opcional; vou gerar o teste e o front sem ele' },
              'o formulário Angular novo manda o cadastro sem CNPJ e a API responde 400'
            ], tutor: 'o agente fez o que a doc mandou. A falha não foi dele: a doc virou uma instrução falsa. Doc velha com agente é erro de produção com atraso de duas semanas.' } }
          ] },
        { tipo: 'takeaway', html: 'Sem o check, a doc errada <mark>vira instrução</mark> para o próximo agente.' },

        { tipo: 'texto', html:
          '<h3>O comando de fechamento, por ferramenta</h3>' +
          '<p>O conteúdo mora uma vez no repositório, em <code>prompts/atualizar-docs.md</code>. Cada ferramenta só ganha o ponteiro que a deixa chamar o prompt pelo nome. Rode o fechamento antes de abrir o PR e leia a lista de afirmações que ficaram falsas.</p>' },
        { tipo: 'abas', rotulo: 'Ferramenta', itens: [
          { rotulo: 'Cursor', blocos: [{ tipo: 'texto', html: 'Copie para <code>.cursor/commands/atualizar-docs.md</code> e chame <code>/atualizar-docs</code> no chat.' }] },
          { rotulo: 'Codex', blocos: [{ tipo: 'texto', html: 'Sem pasta de comandos de projeto: use uma skill (<code>.agents/skills</code>, chamada por <code>$atualizar-docs</code>) ou cole o conteúdo de <code>prompts/atualizar-docs.md</code> na sessão. Os prompts personalizados em <code>~/.codex/prompts/</code> estão obsoletos.' }] },
          { rotulo: 'OpenCode', blocos: [{ tipo: 'texto', html: 'Copie para <code>.opencode/commands/atualizar-docs.md</code> e chame <code>/atualizar-docs</code>.' }] },
          { rotulo: 'Claude Code', blocos: [{ tipo: 'texto', html: 'Copie para <code>.claude/commands/atualizar-docs.md</code> (ou crie a skill equivalente) e chame <code>/atualizar-docs</code>.' }] },
          { rotulo: 'Agente próprio', blocos: [{ tipo: 'texto', html: 'Carregue <code>prompts/atualizar-docs.md</code> como mensagem de sistema ou de usuário no passo final do seu loop, com o diff e a lista de arquivos de doc como entrada.' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Regra 2: ADR para decisões caras de reverter</h3>' +
          '<p>Crie <strong>ADR</strong> (registro de decisão de arquitetura) quando a decisão (a) é estrutural (banco, fila, fronteira de serviço, biblioteca central), (b) tem alternativas reais, ou (c) alguém perguntará "por que fizemos assim?" daqui a um ano. Formato curto: contexto, opções com prós e contras, decisão, consequências. O agente rascunha; o humano decide e assina. ADR aceito nunca é editado: ele é <em>substituído</em> por outro que o referencia (<code>Status: substituída por ADR-014</code>). Aprofunde no <a href="../modulos/M04-design-docs-com-ia/M04.html">M04</a>.</p>' +
          '<h3>Regra 3: CHANGELOG com a chave do ticket</h3>' +
          '<p>Uma linha por mudança, agrupada em Adicionado, Alterado, Corrigido e Removido, com a chave (<code>PROJ-123</code>). É a ponte entre PR e nota de release e o que o suporte lê. O agente escreve a entrada no fechamento; a revisão confere se é verdadeira.</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: changelog },
        { tipo: 'takeaway', html: 'O <mark>/atualizar-docs</mark> propõe, a <mark>revisão</mark> confirma, o <mark>CHANGELOG</mark> leva a chave do ticket.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Regra 4: o agente errou duas vezes? Atualize o AGENTS.md</h3>' +
          '<p>Primeira vez é acidente; segunda é falta de instrução. A correção não vai para o chat (some), vai para o repositório, na forma <em>mais forte possível</em>.</p>' +
          '<table><thead><tr><th>Tipo de erro</th><th>Onde corrigir</th><th>Força</th></tr></thead><tbody>' +
          '<tr><td>Usou comando errado, ignorou convenção</td><td>Seção correspondente do <code>AGENTS.md</code>, ou "Armadilhas conhecidas" com data</td><td>Instrução (probabilística)</td></tr>' +
          '<tr><td>Editou arquivo que não devia</td><td>Hook de caminho protegido e <code>CODEOWNERS</code></td><td>Bloqueio (determinístico)</td></tr>' +
          '<tr><td>Gerou código fora do padrão que o linter pode detectar</td><td>Regra de lint/analisador no <code>make check</code></td><td>Bloqueio (determinístico)</td></tr>' +
          '<tr><td>Fluxo repetitivo que ele refaz diferente toda vez</td><td>Prompt-modelo em <code>prompts/</code> ou comando/skill da ferramenta</td><td>Procedimento reutilizável</td></tr>' +
          '</tbody></table>' +
          '<p>Se uma regra exige cuidado constante, transforme-a em verificação automática. Instrução pede boa vontade; hook não pede.</p>', largo: true },
        { tipo: 'escolha', id: 'doc-bin', titulo: 'Confira: a pasta apagada duas vezes',
          pergunta: 'O agente apagou a pasta <code>bin/</code> versionada duas vezes. Qual é a correção mais forte?',
          opcoes: [
            { id: 'a', texto: 'Hook ou regra que bloqueia o caminho (e, se aplicável, <code>.gitignore</code>), mais uma linha no <code>AGENTS.md</code>.', correta: true, porque: 'bloqueio determinístico vence instrução, e a linha no AGENTS.md explica o motivo.' },
            { id: 'b', texto: 'Escrever "NUNCA APAGUE bin/" em maiúsculas no prompt.', correta: false, porque: 'a ênfase não dá garantia e some quando a sessão fecha.' },
            { id: 'c', texto: 'Trocar de ferramenta.', correta: false, porque: 'o problema é falta de guarda no repositório, e ela continua faltando em qualquer ferramenta.' }
          ] },
        { tipo: 'escolha', id: 'doc-adr', titulo: 'Confira: quando fazer ADR',
          pergunta: 'Quando uma decisão merece ADR?',
          opcoes: [
            { id: 'a', texto: 'Toda mudança de código.', correta: false, porque: 'ADR em tudo vira burocracia ignorada.' },
            { id: 'b', texto: 'Quando é cara de reverter, tem alternativas reais ou alguém vai perguntar o porquê no futuro.', correta: true, porque: 'são os três critérios que separam decisão estrutural de detalhe.' },
            { id: 'c', texto: 'Somente quando o agente pede.', correta: false, porque: 'transfere a decisão para quem não decide.' }
          ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          'Deixar o <code>AGENTS.md</code> crescer sem poda. Um arquivo de 600 linhas dilui as regras importantes e consome contexto em toda sessão. Revise a cada mês: apague o que o linter já cobre, o que virou hook e o que ficou obsoleto. Mantenha o arquivo curto e verificável.' },
        { tipo: 'takeaway', html: 'Erro repetido do agente vira <mark>regra</mark>, de preferência <mark>executável</mark>; e o AGENTS.md precisa de poda.' }
      ] }
    ]
  });
})();
