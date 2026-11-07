/* Aula 14 · Cartão de bolso. Resumo do Passo 12 de TR-texto.html. Sem persistência de checklist: é texto para colar ao lado do monitor. */
(function () {
  function lista(itens) {
    return '<ul>' + itens.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
  }

  TrilhaAula.registrar({
    id: 'cartao-de-bolso',
    titulo: 'Cartão de bolso',
    minutos: 6,
    resumo: 'O ciclo inteiro em blocos curtos para colar ao lado do monitor: antes, durante, PR, deploy e troca de modelo.',
    abas: [
      { rotulo: 'Do ticket ao PR', blocos: [
        { tipo: 'texto', html:
          '<p>Resumo para colar ao lado do monitor. Cada bloco é uma pergunta que você responde com sim ou não. Se a resposta for não, pare e resolva antes de seguir.</p>' +
          '<h3>Antes de começar o trabalho</h3>' +
          lista([
            'Existe ticket com chave (<code>PROJ-123</code>) e critérios de aceite?',
            'O agente leu o <code>AGENTS.md</code> e a spec? Ou eu escrevi a spec primeiro?',
            'Estou em branch ou worktree do ticket (<code>feat/</code> ou <code>fix/</code>)?',
            'Plano feito em modo leitura e aprovado por mim?',
            'Servidores MCP com escopo mínimo, versão fixada e nenhum segredo no repositório?'
          ]) +
          '<h3>Durante</h3>' +
          lista([
            'Passo pequeno, teste primeiro, <code>make check</code> verde, commit <code>PROJ-123: ...</code>',
            'Pedi evidência (saída de teste) e não aceitei só "pronto".',
            'Nada fora do escopo da spec. O que apareceu virou ticket novo.',
            'Em <code>fix/</code>: só adicionei teste, não alterei os existentes.'
          ]) +
          '<h3>Antes do PR e do merge</h3>' +
          lista([
            'Template de PR preenchido: critérios, testes, risco, rollback.',
            'Documentação e CHANGELOG no mesmo PR, ou <code>Docs: não se aplica (motivo)</code>.',
            'Revisão por agente em sessão separada, com <code>REVIEW.md</code>.',
            'Li o diff inteiro. Aprovação de quem não escreveu.',
            'Se houve decisão cara, ADR criada.'
          ]) },
        { tipo: 'takeaway', html: 'Antes de codar, <mark>ticket, spec e plano</mark>. Antes do merge, <mark>evidência e revisão</mark>.' }
      ] },

      { rotulo: 'Deploy, evals e fechamento', blocos: [
        { tipo: 'texto', html:
          '<h3>Deploy e depois</h3>' +
          lista([
            'Dev automático. Cert com aprovação e smoke test. Prod com humano autorizado.',
            'Rollback conhecido (SHA anterior) e ensaiado.',
            'Ticket transicionado pela esteira, com versão e link.',
            'O agente errou duas vezes? Corrigi o <code>AGENTS.md</code> ou criei um hook.'
          ]) +
          '<h3>Ao trocar de modelo ou de skill</h3>' +
          lista([
            'Rodei o kit de evals com k de pelo menos 3, e li pass^k e custo por sucesso, não só o preço do token.',
            'A diferença passou do ruído (McNemar)? Ou aumentei casos e repetições?',
            'Skill neutra ou com falso positivo: refinei a descrição ou aposentei.',
            'Guardei o relatório aprovado como referência para a próxima mudança.',
            'Skill da comunidade: li o <code>SKILL.md</code>, testei em repositório de teste, fixei versão e medi com <code>--skill-ab</code> antes de adotar.'
          ]) },
        { tipo: 'ordene', id: 'bolso-ordene', titulo: 'Ordene o ciclo completo',
          enunciado: 'Ordene as nove etapas do ciclo, da primeira à última.',
          itens: [
            { id: 'cicd', texto: 'CI/CD: dev, cert, prod' },
            { id: 'plano', texto: 'Plano' },
            { id: 'nova', texto: 'Nova intenção (aprendizados viram tickets)' },
            { id: 'intencao', texto: 'Intenção' },
            { id: 'verif', texto: 'Verificação' },
            { id: 'operar', texto: 'Operar' },
            { id: 'spec', texto: 'Spec' },
            { id: 'pr', texto: 'PR e review' },
            { id: 'impl', texto: 'Implementação' }
          ],
          solucao: ['intencao', 'spec', 'plano', 'impl', 'verif', 'pr', 'cicd', 'operar', 'nova'],
          dica: 'Pense no que vem antes do código, depois do código e depois do deploy.',
          tutorDepois: 'Intenção e spec vêm antes do código. Operar e nova intenção fecham o ciclo.' },
        { tipo: 'escolha', id: 'bolso-escolha', titulo: 'Confira: a memória do projeto',
          pergunta: 'A sessão do agente acabou e ele "esqueceu" tudo. O que deveria garantir que a próxima sessão continue de onde parou?',
          opcoes: [
            { id: 'a', texto: 'Colar de novo todo o histórico do chat.', correta: false, porque: 'histórico colado é longo, frágil e some na próxima vez que alguém não colar.' },
            { id: 'b', texto: 'Confiar no resumo que o próprio agente guardou.', correta: false, porque: 'resumo informal não é revisável e pode perder o que importa.' },
            { id: 'c', texto: 'Artefatos versionados: intenção, spec, plano com status, <code>AGENTS.md</code>, commits e PR com ticket.', correta: true, porque: 'o repositório é a memória do projeto. Qualquer pessoa ou agente lê os arquivos e retoma o trabalho.' }
          ], tutorDepois: 'Arquivo versionado é memória. Resumo solto não é.' },
        { tipo: 'takeaway', html: 'O agente não lembra entre sessões. O que fica <mark>no repositório</mark> é o que existe para o próximo.' }
      ] }
    ]
  });
})();
