/* A01 · Bloco 7 · Adotar em etapas: dependências, métricas, anti-padrões e roteiro de 90 dias. */
(function () {
  var T = function (cab, linhas) {
    return '<table><thead><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (l) { return '<tr>' + l.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  };

  TrilhaAula.registrar({
    id: 'a01-b7',
    titulo: 'Adotar em etapas: ondas, métricas e 90 dias',
    minutos: 35,
    resumo: 'As 19 plays se adotam por ondas, começando pela que alivia a restrição atual. Métrica líder sempre junto da defasada, e um critério de parada definido de antemão.',
    objetivo: 'Planejar uma adoção incremental das plays do SDLC nativo em IA: ondas e dependências, métricas líder e defasada, anti-padrões e um roteiro de 90 dias com critérios de saída.',
    revisao: [
      { id: 'a01b7-primeira', pergunta: 'Qual play adotar primeiro?', opcoes: [
        { id: 'a', texto: 'A que alivia a restrição atual, respeitando as dependências', correta: true, porque: 'é o que o bloco 1 demonstrou: vazão é a da etapa mais lenta.' },
        { id: 'b', texto: 'Todas de uma vez, para ter o desenho completo', correta: false, porque: 'instalar tudo de uma vez é o erro de adoção mais caro.' },
        { id: 'c', texto: 'A mais nova do mercado', correta: false, porque: 'escolher pela ferramenta antes do invariante gera migração dolorosa.' } ] },
      { id: 'a01b7-tres', pergunta: 'Quais são os três movimentos de custo baixo que tiram a equipe do prompt manual?', opcoes: [
        { id: 'a', texto: 'Capturar intents como arquivos commitados; um <code>AGENTS.md</code> curto com o comando único de verificação; esse comando como check obrigatório no CI', correta: true, porque: 'o CI é a camada que ninguém contorna.' },
        { id: 'b', texto: 'Política gerenciada, agente de plantão e modo autônomo', correta: false, porque: 'são das ondas finais e dependem de hooks, evals e isolamento.' },
        { id: 'c', texto: 'Aumentar sessões paralelas, tokens e skills', correta: false, porque: 'são indicadores de atividade, não de processo melhor.' } ] },
      { id: 'a01b7-metrica', pergunta: 'Mudanças mergeadas por engenheiro subiram 40%. O que olhar antes de declarar sucesso?', opcoes: [
        { id: 'a', texto: 'A defasada correspondente: retrabalho, taxa de falha de mudança e defeitos escapados', correta: true, porque: 'vazão sem qualidade é a armadilha do bloco 1.' },
        { id: 'b', texto: 'O consumo de tokens', correta: false, porque: 'tokens medem atividade.' },
        { id: 'c', texto: 'O número de skills criadas', correta: false, porque: 'também é atividade.' } ] },
      { id: 'a01b7-parada', pergunta: 'Para que serve o critério de parada?', opcoes: [
        { id: 'a', texto: 'Definir de antemão o que significa piorar (por exemplo, retrabalho subindo por duas medições congela a expansão)', correta: true, porque: 'sem ele, o crescimento vira meta em si.' },
        { id: 'b', texto: 'Encerrar o programa de adoção após 90 dias', correta: false, porque: 'o roteiro é um ponto de partida, não prazo contratual.' },
        { id: 'c', texto: 'Impedir que novos engenheiros usem agentes', correta: false, porque: 'ele congela a expansão, não o uso.' } ] },
      { id: 'a01b7-padronizar', pergunta: 'O que padronizar e o que deixar livre entre as equipes?', opcoes: [
        { id: 'a', texto: 'Padronizar os invariantes (segurança, gates, formato dos artefatos); deixar ferramenta e estilo livres', correta: true, porque: 'consistência onde importa, velocidade onde não custa.' },
        { id: 'b', texto: 'Padronizar a ferramenta e deixar os gates livres', correta: false, porque: 'inverte a prioridade.' },
        { id: 'c', texto: 'Deixar tudo livre', correta: false, porque: 'sem invariantes compartilhados não há auditoria.' } ] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O erro mais caro de adoção é tentar instalar o desenho inteiro de uma vez. O playbook avisa que a adoção é incremental: as plays podem ser adotadas em ordens diferentes, existe um grafo de dependências entre elas, e o ponto de partida é o prompt manual, que vira loop quando a atenção humana se concentra nos gates. Este bloco organiza as 19 plays em ondas, junta as métricas, nomeia os anti-padrões e propõe um roteiro de 90 dias.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'O que é do playbook e o que é leitura do curso', html:
          'As plays, as métricas atribuídas ao playbook e o princípio incremental vêm do texto. As <strong>ondas</strong>, os pré-requisitos entre plays, os anti-padrões e o roteiro de 90 dias são <em>interpretação do curso</em> (o playbook publica um grafo de dependências próprio; consulte-o para a versão oficial). Métricas que o playbook não traz estão marcadas como proposta.' },
        { tipo: 'texto', html:
          '<h3>Quatro ondas (leitura do curso)</h3>' +
          '<p>Cada onda assume os controles da anterior; dentro de uma onda, a ordem é livre.</p>' +
          '<ul><li><strong>Onda 1, sem pré-requisito:</strong> capturar <code>intent.md</code>, <code>AGENTS.md</code> enxuto, comando único de verificação, prompt manual com artefato.</li>' +
          '<li><strong>Onda 2, base de controle:</strong> spec a partir do intent, plano antes de editar, skills/regras (1 política), hooks e pre-commit/CI.</li>' +
          '<li><strong>Onda 3, escala segura:</strong> revisão de PR por IA, evals contínuas (20 a 50), sessões paralelas, gates de aprovação.</li>' +
          '<li><strong>Onda 4, autonomia:</strong> modo autônomo, agente em CI/CD, autonomia por ambiente, fechar o laço, varreduras e plantão.</li></ul>' },
        { tipo: 'ordene', id: 'b7-ordene-ondas', titulo: 'Ponha as ondas na ordem',
          enunciado: 'Ordene as entregas da primeira onda à última, pelo que cada uma assume da anterior.',
          itens: [
            { id: 'o4', texto: 'Modo autônomo, agente em CI/CD, autonomia por ambiente, fechar o laço' },
            { id: 'o2', texto: 'Spec a partir do intent, plano antes de editar, uma skill de política, hooks e CI' },
            { id: 'o3', texto: 'Revisão de PR por IA, 20 evals, sessões paralelas, gates de aprovação' },
            { id: 'o1', texto: 'Intent commitado, <code>AGENTS.md</code> enxuto, comando único de verificação' }
          ], solucao: ['o1', 'o2', 'o3', 'o4'],
          dica: 'Hooks e evals precisam existir antes do modo autônomo.',
          tutorDepois: 'Modo autônomo depende de hooks, laço de feedback, evals e isolamento; por isso fica na última onda.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Grafo de dependências (leitura do curso)</h3>' +
          T(['Play', 'Depende de', 'Destrava'], [
            ['Capturar <code>intent.md</code>', 'Nada (só o modelo e a pasta, uma vez)', 'Spec, e a entrada do laço de Maintain'],
            ['Arquivo de instruções (<code>AGENTS.md</code>)', 'Nada', 'Plano, skills, evals'],
            ['Laço de feedback (comando único)', 'Suíte de testes razoável', 'Correção de bug, evals, modo autônomo, revisão com evidência'],
            ['Spec a partir do intent', 'Intent aceito; ao menos uma política', 'Plano, revisão contra spec'],
            ['Plano antes de editar', 'Instruções; spec ou intent', 'Sessões paralelas, revisão contra plano'],
            ['Skills de política', 'Dono da política', 'Spec com políticas; reduz findings'],
            ['Hooks / pre-commit / CI', 'Política declarada (o que é inviolável)', 'Gates, modo autônomo, política gerenciada'],
            ['Sessões paralelas e subagentes', 'Plano; laço de feedback; capacidade de revisão', 'Vazão do Build'],
            ['Revisão de PR por IA', '<code>REVIEW.md</code>; proteção de branch; laço de feedback', 'Menor tempo até a primeira revisão'],
            ['Evals contínuas', 'Laço de feedback; instruções/skills/hooks versionados', 'Mudar configuração com segurança; modo autônomo'],
            ['Modo autônomo', 'Hooks, laço de feedback, evals, isolamento', 'Sessões longas, revisão por artefatos'],
            ['Gates de aprovação', 'Hooks; papéis nomeados', 'Autonomia por ambiente'],
            ['Política gerenciada', 'Hooks de time maduros; apoio de segurança/TI', 'Empresa regulada, agentes em CI'],
            ['Agente em CI/CD', 'Sandbox, tokens curtos, política gerenciada', 'Triagem automática, changelog, base para Maintain'],
            ['Autonomia por ambiente', 'Gates; rollback ensaiado; deploy como ferramenta escopada', 'Release com humano só no portão'],
            ['Fechar o laço', 'Métrica confiável; <code>bands.yaml</code>; casa do intent; evals', 'Backlog alimentado pela produção'],
            ['Varreduras recorrentes', 'Piso determinístico (SAST/dependências); gate de PR', 'Segurança contínua'],
            ['Agente de plantão', 'Fechar o laço; MCP somente leitura; lições versionadas', 'Post-mortems que viram evals'],
            ['Fonte da verdade (legado)', 'Decisão explícita por artefato', 'Integração com Jira/ServiceNow sem divergência']
          ]) },
        { tipo: 'takeaway', html: 'Adote por <mark>ondas</mark>; cada onda assume os <mark>controles</mark> da anterior.' }
      ] },

      { rotulo: 'Métricas e anti-padrões', blocos: [
        { tipo: 'texto', html:
          '<h3>Por onde começar</h3>' +
          '<p>Com três movimentos de custo baixo, uma equipe já sai do prompt manual: (1) <strong>capturar intents</strong> como arquivos commitados (zero pré-requisito); (2) escrever um <strong><code>AGENTS.md</code> curto</strong> com o comando único de verificação; (3) pôr o <strong>mesmo script de verificação como check obrigatório</strong> no CI, a camada que ninguém contorna. Depois, adote o que mais dói: se a fila é de revisão, a revisão por IA; se são regressões de agente, as evals; se é medo de deixar o agente solto, hooks e sandbox. O critério: <em>adote a play que alivia a restrição atual</em>.</p>' +
          '<h3>Métricas: líderes e defasadas, lidas juntas</h3>' +
          '<p>Cada play do playbook traz duas métricas: a <strong>líder</strong> muda cedo e orienta a operação; a <strong>defasada</strong> confirma o resultado depois. Uma não vale sem a outra: sessões simultâneas por engenheiro sobem fácil, e o playbook condiciona a leitura à <em>qualidade de revisão mantida</em>; mudanças mergeadas por engenheiro só fazem sentido ao lado da taxa de retrabalho.</p>' },
        { tipo: 'texto', largo: true, html: T(['Play', 'Líder', 'Defasada', 'Origem'], [
          ['Capturar intent', 'Tempo da 1ª conversa ao intent commitado', '% de intents aceitos em Design; edições após o 1º commit da spec', 'Playbook'],
          ['Spec', 'Tempo do intent à spec commitada', 'Commits em <code>spec.md</code> depois do 1º <code>plan.md</code>', 'Playbook'],
          ['Plano antes de editar', '% de PRs com <code>plan.md</code> aprovado antes do 1º commit de código', 'Commits que divergem do plano sem atualizá-lo', 'Proposta'],
          ['Instruções do projeto', 'Erros repetidos do agente', 'Tempo até o 1º PR mergeado de quem entra', 'Playbook'],
          ['Skills de política', 'Tempo da aprovação da política ao merge da skill', 'Findings de revisão que citam a política (→ 0)', 'Playbook'],
          ['Hooks guardrail', '% de invariantes cobertas por check no CI', 'Incidentes por caminho protegido/segredo (→ 0)', 'Proposta'],
          ['Sessões paralelas', 'Sessões simultâneas por engenheiro com qualidade de revisão mantida', 'Mudanças mergeadas por engenheiro, lidas com o retrabalho', 'Playbook'],
          ['Modo autônomo', '% das tarefas elegíveis executadas sem aprovação por edição', 'Reversões e retrabalho dessas tarefas', 'Proposta'],
          ['Laço de feedback e evals', 'Sucesso do CI na 1ª passada; taxa de aprovação das evals', 'Tempo de revisão por PR; taxa de falha de mudança', 'Playbook'],
          ['Revisão de PR por IA', 'Tempo até a 1ª revisão', 'Defeitos pegos antes do merge × escapados', 'Playbook'],
          ['Gates de aprovação', 'Tempo de aprovação nos gates', 'Mudanças em produção sem aprovação (→ 0)', 'Proposta'],
          ['Política gerenciada', '% de máquinas e runners com a política efetiva', 'Violações de política detectadas', 'Proposta'],
          ['Agente em CI/CD', 'Falhas de pipeline triadas sem acionar plantão', 'Métricas DORA', 'Playbook'],
          ['Autonomia por ambiente', '% de deploys em dev/staging sem humano', 'Incidentes em produção ligados a ação do agente (→ 0)', 'Proposta'],
          ['Fechar o laço', 'Tempo da violação de banda ao intent na fila', '% de achados que viram correções; incidentes repetidos', 'Playbook'],
          ['Varreduras recorrentes', 'Cobertura de repositórios na cadência', 'Achados validados corrigidos dentro do prazo', 'Proposta'],
          ['Agente de plantão', 'Tempo até o 1º diagnóstico no canal', 'Reincidências; lições convertidas em evals', 'Proposta']
        ]) },
        { tipo: 'texto', html: '<h3>Anti-padrões (leitura do curso a partir do playbook)</h3>' },
        { tipo: 'texto', largo: true, html: T(['Anti-padrão', 'Por que falha', 'Em vez disso'], [
          ['Acelerar Build e deixar o resto igual', 'A fila se muda de lugar (bloco 1)', 'Escolher a play da restrição atual'],
          ['Política só em skill ou instrução', 'Consultiva; o modelo pode ignorar', 'Hook + pre-commit + check obrigatório'],
          ['Ligar modo autônomo antes dos guardrails', 'O agente "termina" sem prova', 'Checklist de prontidão do bloco 3'],
          ['Copiar uma política gerenciada de exemplo', 'Bloqueia o que você precisa ou libera o que não deveria', 'Adaptar linha a linha ao seu fluxo'],
          ['O agente autor aprova o próprio PR', 'Erros correlacionados; ninguém responde', 'Revisor separado + code owner humano'],
          ['Arquivo de instruções gigante', 'Custo de contexto; nada é obedecido', 'Menos de uma página; correção no 2º erro'],
          ['Decisão só no chat', 'Estado some com a sessão', 'Artefato versionado por etapa'],
          ['Suíte de evals congelada', 'Deixa de discriminar', 'Renovar com incidentes e com cada modelo novo'],
          ['LLM como detector de anomalia', 'Caro, irreprodutível, injetável', 'Script determinístico; modelo só diagnostica'],
          ['Mais sessões paralelas do que a revisão aguenta', 'Vazão aparente, qualidade real cai', '2–3 sessões, subir com a revisão folgada'],
          ['Rollback nunca ensaiado', 'A autonomia depende dele', 'Um comando, ensaiado'],
          ['Só métricas líderes', 'Mede atividade, não resultado', 'Ler líder com defasada']
        ]) },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: medir a adoção por atividade', html:
          'O painel de adoção mais fácil de montar mostra sessões de agente, PRs abertos e tokens consumidos: indicadores de <em>atividade</em>. Eles sobem na primeira semana e dizem pouco sobre se o processo melhorou. Duas salvaguardas: exigir sempre o par líder/defasada (vazão ao lado de retrabalho e falha de mudança) e definir de antemão o que significaria <em>piorar</em> (por exemplo, retrabalho subindo por duas medições seguidas congela a expansão para mais sessões paralelas). Sem o critério de parada, o crescimento vira meta em si.' },
        { tipo: 'takeaway', html: 'Leia a métrica <mark>líder</mark> junto da <mark>defasada</mark> e defina o <mark>critério de parada</mark> antes de expandir.' }
      ] },

      { rotulo: 'Roteiro de 90 dias', blocos: [
        { tipo: 'texto', html:
          '<p>Um roteiro de partida (leitura do curso), com critérios de saída por janela. Cada janela termina quando o critério vale, não quando o calendário acaba.</p>' },
        { tipo: 'texto', largo: true, html: T(['Janela', 'Entregas', 'Critério de saída'], [
          ['Dias 1–30 · base', 'Casa do intent e modelo; <code>AGENTS.md</code> enxuto com ponteiros; <code>make verify</code> como check obrigatório; <code>CODEOWNERS</code> cobrindo instruções, skills e workflows; 1 skill (a política mais cara); <code>sdlc_kit validate</code> no CI', 'Todo PR novo cita um intent; o CI bloqueia sem verde; medir tempo intent→merge de partida'],
          ['Dias 31–60 · controle', 'Spec gerada de intent aceito (job + PR); plano antes de editar; hooks + pre-commit + CI com a política de caminhos protegidos, testes em <code>fix/</code> e segredos; revisão de PR por IA com <code>REVIEW.md</code> lido da base; primeiras 20 evals', 'Revisor com severidade calibrada; nenhum incidente de segredo ou caminho protegido; eval como portão de mudança de configuração'],
          ['Dias 61–90 · escala', '2–3 sessões paralelas; subagentes de revisão e teste; agente em CI somente leitura; autonomia por ambiente (dev livre, produção com gate); detector de 1 métrica com <code>bands.yaml</code> gerando <code>intent.md</code>; varredura semanal em 1 repositório; ADR registrando as decisões', 'Retrabalho estável ou menor com mais vazão; 1 correção originada na produção atravessou o loop e virou eval']
        ]) },
        { tipo: 'texto', html:
          '<p>Para o nosso sistema .NET + Angular com Durable Functions, "produção" na janela 3 é o ambiente prod depois de dev e cert. Marque o que a sua equipe já tem em cada marco:</p>' +
          '<ul><li>Dia 30: intents commitados, <code>AGENTS.md</code> curto e check obrigatório no CI.</li><li>Dia 30: CODEOWNERS cobre instruções, skills, <code>REVIEW.md</code>, política e workflows.</li><li>Dia 60: revisão de PR por IA lendo a política da branch base.</li><li>Dia 60: política de hooks equivalente em agente, pre-commit e CI.</li><li>Dia 60: 20 evals e portão de mudança de configuração.</li><li>Dia 90: autonomia por ambiente com gate de produção imposto e rollback ensaiado.</li><li>Dia 90: primeiro <code>intent.md</code> de diagnóstico atravessou o loop até a eval.</li><li>Dia 90: ADR de adoção com métricas líderes e defasadas de partida.</li></ul>' },
        { tipo: 'escreva', id: 'b7-escreva-90', titulo: 'Monte os primeiros 90 dias', obrigatorio: false,
          enunciado: 'Equipe de 12 pessoas, a fila de revisão é a restrição e nenhum agente atua em produção. Escreva o que entra nos primeiros 90 dias e em que ordem, e como você saberia se piorou.',
          placeholder: 'Nos primeiros 30 dias… Depois… Medimos… Paramos a expansão se…',
          rubrica: [
            'Onda 1 primeiro (intent, <code>AGENTS.md</code>, comando de verificação no CI) e <strong>revisão por IA</strong> logo, porque a restrição é a fila de revisão.',
            'CODEOWNERS cobrindo instruções, skills, <code>REVIEW.md</code> e workflows.',
            'Métricas <strong>líder e defasada</strong> medidas desde a partida (por exemplo, tempo até a 1ª revisão e defeitos escapados).',
            'Um <strong>critério de parada</strong> para a expansão (retrabalho subindo por duas medições, por exemplo).',
            'ADR registrando as decisões de adoção.'
          ],
          modelo: '<p>Dias 1–30: capturo intents como arquivos, escrevo um <code>AGENTS.md</code> curto com o comando único de verificação e o torno check obrigatório no CI; CODEOWNERS cobre instruções, skills, <code>REVIEW.md</code> e workflows. Como a restrição é a fila de revisão, adoto cedo a revisão de PR por IA com <code>REVIEW.md</code> lido da base, mantendo o code owner como aprovador.</p><p>Dias 31–90: spec e plano antes de editar, hooks e CI para caminhos protegidos, 20 evals, e só então 2–3 sessões paralelas.</p><p>Meço desde o início tempo até a 1ª revisão (líder) e defeitos escapados e retrabalho (defasadas). Se o retrabalho subir por duas medições seguidas, congelo a expansão. Registro as decisões num ADR.</p>' },
        { tipo: 'takeaway', html: 'O roteiro é um <mark>ponto de partida</mark> com <mark>critérios de saída</mark>, não um prazo contratual.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b7-esc-primeira', titulo: 'Confira: por onde começar',
          pergunta: 'A equipe tem boa cobertura de testes, uma fila de PRs esperando revisão há dias e pouco medo de erros de segurança. Qual play adotar primeiro, na lógica do bloco?',
          opcoes: [
            { id: 'a', texto: 'Política gerenciada corporativa completa.', correta: false, porque: 'endereça outra restrição.' },
            { id: 'b', texto: 'Revisão de PR por IA com <code>REVIEW.md</code>, mantendo o code owner como aprovador.', correta: true, porque: 'a restrição atual é a revisão; a play que a alivia é a revisão por IA, respeitando as dependências (REVIEW.md, proteção de branch, laço de feedback).' },
            { id: 'c', texto: 'Agente de plantão no canal de incidentes.', correta: false, porque: 'endereça outra restrição.' },
            { id: 'd', texto: 'Aumentar o número de sessões paralelas por engenheiro.', correta: false, porque: 'agravaria a fila de revisão.' }
          ] },
        { tipo: 'escolha', id: 'b7-esc-metrica', titulo: 'Confira: sucesso da adoção',
          pergunta: 'PRs mergeados por engenheiro subiram 40% após a adoção. O que você precisa olhar antes de declarar sucesso?',
          opcoes: [
            { id: 'a', texto: 'O número de tokens consumidos.', correta: false, porque: 'tokens são atividade.' },
            { id: 'b', texto: 'A satisfação dos desenvolvedores apenas.', correta: false, porque: 'é útil, mas não substitui o par líder/defasada.' },
            { id: 'c', texto: 'A métrica defasada correspondente: retrabalho, taxa de falha de mudança e defeitos escapados.', correta: true, porque: 'mudanças mergeadas só significam algo ao lado do retrabalho e da falha de mudança.' },
            { id: 'd', texto: 'O número de skills criadas.', correta: false, porque: 'também é atividade.' }
          ] },
        { tipo: 'cenario', id: 'b7-cenario', titulo: 'A diretoria quer tudo em um mês', obrigatorio: false,
          enunciado: 'A diretoria pede agentes em produção até o fim do mês. Decida como conduzir a adoção.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A diretoria quer o desenho completo em 30 dias. Qual é a sua resposta?', opcoes: [
              { texto: 'Instalar tudo de uma vez: hooks, evals, modo autônomo e política gerenciada.', vai: 'f-tudo', tom: 'ruim', consequencia: 'o modo autônomo liga antes dos guardrails e das evals.' },
              { texto: 'Propor ondas: começar pela base e pela play que alivia a restrição, com critérios de saída por janela.', vai: 'medir', tom: 'ok', consequencia: 'cada onda assume os controles da anterior.' }
            ] },
            medir: { texto: 'No primeiro painel, PRs mergeados por engenheiro subiram. O que você apresenta?', opcoes: [
              { texto: 'Só sessões de agente, PRs abertos e tokens consumidos.', vai: 'f-atividade', tom: 'ruim', consequencia: 'indicadores de atividade sobem na primeira semana e não provam melhora.' },
              { texto: 'O par líder/defasada (vazão ao lado de retrabalho e falha de mudança) e o critério de parada combinado.', vai: 'f-bom', tom: 'ok', consequencia: 'a expansão só continua com qualidade mantida.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Adoção por ondas, métricas pareadas e critério de parada: a vazão cresceu sem esconder o retrabalho.' },
            'f-tudo': { bom: false, texto: 'O agente "terminou" tarefas sem prova e a política copiada de um exemplo bloqueou o fluxo do time.' },
            'f-atividade': { bom: false, texto: 'O painel mostrou crescimento enquanto o retrabalho subia, sem critério para parar.' }
          },
          callout: 'Você propôs ondas, mediu por pares e definiu quando parar.' },
        { tipo: 'texto', html:
          '<h3>Trade-offs e erros comuns</h3>' +
          '<ul><li><strong>Padronizar × deixar equipes escolherem.</strong> Um <code>AGENTS.md</code> único e checks compartilhados dão consistência; variação por equipe dá velocidade. Padronize os invariantes (segurança, gates, formato dos artefatos) e deixe a ferramenta e o estilo livres.</li>' +
          '<li><strong>Rigor uniforme × proporcional ao risco.</strong> Um ajuste de texto não precisa de spec e de aprovação do tech lead. Escreva a regra de escala (o que exige intent, o que exige spec, o que exige tech lead).</li>' +
          '<li>Erro comum: tratar o roteiro como prazo contratual e pular os critérios de saída.</li>' +
          '<li>Erro comum: escolher a ferramenta antes do invariante; o resultado é migração dolorosa na próxima mudança de mercado.</li>' +
          '<li>Erro comum: não registrar decisões de adoção; ninguém sabe depois por que a política é a que é (ADR).</li></ul>' +
          '<p>Para praticar o vocabulário num projeto de verdade, siga a Trilha rápida. As consequências de produção (ameaças agênticas, contenção, SRE) são aprofundadas no M12, e a governança e a regulação no E03.</p>' },
        { tipo: 'takeaway', html: 'Comece pela <mark>restrição atual</mark>, meça <mark>resultado</mark> e não só atividade, e registre as decisões num <mark>ADR</mark>.' }
      ] }
    ]
  });
})();
