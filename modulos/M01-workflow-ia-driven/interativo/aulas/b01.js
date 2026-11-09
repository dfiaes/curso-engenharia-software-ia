/* M01 · Bloco 1: da intenção ao contrato (SDD e drift bidirecional). Fonte: M01.html#b01. Saídas do rode: execução real do lab (validate). Fontes técnicas verificadas em 14/08/2026; panorama industrial (Octoverse 2025) a revalidar até 18/11/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoDrift = String.raw`from dataclasses import dataclass
from enum import StrEnum


class DriftState(StrEnum):
    CONSISTENT = "consistent"
    SPEC_STALE = "spec_stale"
    CODE_INCORRECT = "code_incorrect"
    DECISION_REQUIRED = "decision_required"


@dataclass(frozen=True)
class DriftEvidence:
    spec_accepts_observed: bool
    tests_accept_observed: bool
    production_supports_observed: bool | None
    detail: str


@dataclass(frozen=True)
class DriftReport:
    state: DriftState
    evidence: DriftEvidence
    mutation_allowed: bool = False


def classify_drift(evidence):
    # Padrão conservador: sem evidência suficiente, a decisão é humana.
    state = DriftState.DECISION_REQUIRED
    # 1. spec e testes aceitam o comportamento observado -> CONSISTENT
    # 2. spec NÃO aceita, testes aceitam e produção sustenta (True) -> SPEC_STALE
    # 3. spec aceita e testes NÃO aceitam -> CODE_INCORRECT
    return DriftReport(state=state, evidence=evidence)


ev = DriftEvidence(True, False, None, "agrupamento de segunda a domingo falha")
print(classify_drift(ev).state)
`;
  var testesDrift = String.raw`def E(spec, tests, prod):
    return DriftEvidence(spec, tests, prod, "x")


def test_consistente():
    assert classify_drift(E(True, True, None)).state == DriftState.CONSISTENT


def test_spec_antiga_com_producao_sustentando():
    assert classify_drift(E(False, True, True)).state == DriftState.SPEC_STALE


def test_borda_producao_nao_observada_pede_decisao():
    assert classify_drift(E(False, True, None)).state == DriftState.DECISION_REQUIRED


def test_codigo_incorreto():
    assert classify_drift(E(True, False, None)).state == DriftState.CODE_INCORRECT


def test_nada_concorda_pede_decisao():
    assert classify_drift(E(False, False, False)).state == DriftState.DECISION_REQUIRED


def test_classificar_nunca_autoriza_mutacao():
    for spec in (True, False):
        for tests in (True, False):
            for prod in (True, False, None):
                assert classify_drift(E(spec, tests, prod)).mutation_allowed is False
`;
  var solucaoDrift = String.raw`def classify_drift(evidence):
    if evidence.spec_accepts_observed and evidence.tests_accept_observed:
        state = DriftState.CONSISTENT
    elif (
        not evidence.spec_accepts_observed
        and evidence.tests_accept_observed
        and evidence.production_supports_observed is True
    ):
        state = DriftState.SPEC_STALE
    elif evidence.spec_accepts_observed and not evidence.tests_accept_observed:
        state = DriftState.CODE_INCORRECT
    else:
        state = DriftState.DECISION_REQUIRED
    return DriftReport(state=state, evidence=evidence)
`;

  var etapasValidate = function () {
    return [
      { id: 'valida', nome: 'Contrato válido', descricao: 'feature.valid.json', tom: 'dns', ms: 0, linhas: [
        L('cmd', 'python -m sdd_lab validate examples/feature.valid.json'),
        L('in', 'VALID CAP-001'),
        L('hint', 'exit=0: exemplo e contraexemplo, não-objetivo, tarefa ligada ao requisito e gate declarado')] },
      { id: 'invalida', nome: 'Contrato inválido', descricao: 'feature.invalid.json: 8 achados', tom: 'request', ms: 8, linhas: [
        L('cmd', 'python -m sdd_lab validate examples/feature.invalid.json'),
        L('out', 'missing_non_goals: non_goals: declare ao menos um não-objetivo'),
        L('out', 'vague_requirement: requirements[0].statement: substitua adjetivo vago por limiar, exemplo ou propriedade verificável'),
        L('out', 'missing_verification: requirements[0].verification: oráculo obrigatório'),
        L('out', 'missing_examples: requirements[0]: inclua exemplo e contraexemplo'),
        L('out', 'unsafe_path: tasks[0].write_set: path fora do workspace: ../fora.txt'),
        L('out', 'shell_string: tasks[0].argv: comando deve ser argv tokenizado; string de shell foi recusada'),
        L('out', 'untraced_requirement: tasks: RF-001 não está ligado a tarefa'),
        L('out', 'missing_gates: gates: declare ao menos um gate'),
        L('hint', 'exit=20 (os diagnósticos saem em stderr)')] },
      { id: 'semmut', nome: 'Entrada intacta', descricao: 'O parser não reescreve nada', tom: 'ink', ms: 0, linhas: [
        L('info', 'examples/feature.invalid.json continua byte a byte como estava'),
        L('hint', 'o parser recusa ambiguidade e diz onde; não "conserta" o requisito vago sozinho')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm01-b1',
    titulo: 'Da intenção ao contrato: SDD e drift bidirecional',
    minutos: 35,
    resumo: 'Desenvolvimento chat-driven falha por mecanismo. SDD tira intenção, requisitos e decisões do chat e os põe em artefatos versionados que são confrontados com código, testes e produção.',
    objetivo: 'Explicar por que o chat-driven falha, separar PRD, spec e plan, escrever critério de aceitação verificável, rodar o ciclo pesquisar-planejar-implementar-verificar e classificar drift sem dar soberania automática a nenhuma fonte.',
    revisao: [
      { id: 'm01b1-chat', pergunta: 'Por que o desenvolvimento chat-driven falha de forma previsível em tarefas de várias horas?',
        opcoes: [
          opc('a', 'O requisito mora num lugar volátil (a janela de contexto), degrada quando o harness resume ou trunca, e a tentativa e erro ainda polui o que resta', true, 'a janela é finita, a persistência não é implícita e cada "não era isso" deixa versões erradas no contexto.'),
          opc('b', 'O modelo se recusa a seguir instruções longas', false, 'o mecanismo é estrutural, não de recusa.'),
          opc('c', 'O modelo guarda estado entre chamadas e confunde versões', false, 'o modelo-base não mantém estado entre chamadas; qualquer persistência é capacidade externa do harness.')] },
      { id: 'm01b1-drift', pergunta: 'Decisão de produto registrada: a semana começa no domingo. O código já agrupa assim, mas a spec diz segunda a domingo. Qual a classificação e a ação?',
        opcoes: [
          opc('a', 'spec_stale: atualizar contrato e registro de decisão no mesmo change set', true, 'a decisão existe e o código a segue; quem ficou velho foi o documento.'),
          opc('b', 'code_incorrect: reverter o código para segunda', false, 'seria dar soberania automática à spec.'),
          opc('c', 'consistent: a spec é só documentação', false, 'spec mentirosa gera código que "conserta" o que estava certo (spec-fóssil).')] },
      { id: 'm01b1-criterio', pergunta: 'Qual requisito é um critério de aceitação verificável?',
        opcoes: [
          opc('a', '"p95 < 100 ms medido com k6 em 100 VUs"', true, 'vira comando com saída esperada. Se não dá para virar teste ou comando, é desejo.'),
          opc('b', '"O sistema deve tratar erros adequadamente"', false, 'é spec-telepatia: o agente escolhe uma interpretação, e estatisticamente não é a sua.'),
          opc('c', '"Deve ser rápido"', false, 'sem limiar, carga nem instrumento de medida não há oráculo.')] },
      { id: 'm01b1-niveis', pergunta: 'Qual documento do SDD responde "em que ordem" e quais arquivos cada etapa toca?',
        opcoes: [
          opc('a', 'O plan.md: etapas pequenas com read/write sets, capabilities, gate e evidência esperada', true, 'o plano muda no ritmo da sessão.'),
          opc('b', 'O prd.md: problema, requisitos e não-objetivos', false, 'o PRD responde o quê e por quê, sem nome de tecnologia.'),
          opc('c', 'O spec.md: schemas, contratos e decisões de arquitetura', false, 'a spec responde como, arquiteturalmente.')] },
      { id: 'm01b1-antipadrao', pergunta: 'Um requisito diz "tratar erros adequadamente". Qual anti-padrão é esse e qual o conserto?',
        opcoes: [
          opc('a', 'Spec-telepatia: todo advérbio vago vira critério verificável (qual erro, qual resposta, qual log, qual teste prova)', true, '"Adequadamente" não compila.'),
          opc('b', 'Spec-romance: encurtar a spec para duas páginas', false, 'romance é o excesso de volume, não a vagueza.'),
          opc('c', 'Spec-cascata: especificar em fatias verticais', false, 'cascata é especificar tudo antes de implementar qualquer parte.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>A cena que justifica o módulo</h3>' +
          '<p>Você pediu uma coisa ao agente, ele fez outra, você corrigiu no chat, ele corrigiu e, de quebra, desfez uma parte boa que ele mesmo tinha escrito dois turnos antes. Esse ciclo é o desenvolvimento <strong>chat-driven</strong>, e ele falha por três mecanismos que você já conhece do M00:</p>' +
          '<ul>' +
          '<li><strong>O requisito vive no lugar errado.</strong> Fica espalhado por dezenas de mensagens. A janela de contexto é finita: quando enche, o harness resume ou trunca o histórico, e o que você negociou na mensagem 12 evapora. Não some de uma vez: degrada em silêncio até o agente contradizer o combinado.</li>' +
          '<li><strong>Persistência não é implícita.</strong> O modelo-base não mantém estado de execução entre chamadas. Alguns harnesses guardam histórico, resumo ou checkpoint, mas isso é capacidade externa e precisa de contrato. Se "o que construir" vive só na conversa, a retomada depende de um mecanismo frágil e pouco auditável.</li>' +
          '<li><strong>Descobrir requisito por tentativa e erro custa caro.</strong> Cada "não era isso" gasta tokens e tempo e, pior, polui o contexto com versões erradas do código, das quais o modelo continua se "inspirando".</li></ul>' },
        { tipo: 'texto', html:
          '<h3>A definição: SDD</h3>' +
          '<p><strong>Specification-Driven Development</strong> (SDD) externaliza intenção, requisitos, decisões, tarefas e evidências em artefatos versionados. Isso não torna a especificação infalível: código legado, testes, migrações, telemetria e comportamento observado podem guardar conhecimento que a documentação perdeu. O trabalho profissional é confrontar essas fontes, localizar a divergência e reconciliar contrato, implementação e evidência no mesmo change set.</p>' +
          '<p>Uma especificação declara comportamento e limites. <strong>JSON Schema</strong> descreve a forma dos dados, o parser valida a entrada e testes verificam resultados e falhas. Um documento pode ser ignorado ou mal interpretado, então cada requisito precisa de exemplo, contraexemplo, oráculo e ligação com a evidência produzida.</p>' },
        { tipo: 'abas', rotulo: 'Chat-driven × SDD', itens: [
          { rotulo: 'Chat-driven', blocos: [{ tipo: 'texto', html: '<ul><li><strong>Onde mora o requisito:</strong> espalhado em dezenas de mensagens.</li><li><strong>Retomada:</strong> depende de histórico, resumo ou checkpoint do harness.</li><li><strong>Erro:</strong> descoberto por tentativa; cada "não era isso" polui o contexto com versões erradas.</li><li><strong>Revisão:</strong> um diff enorme no fim.</li></ul>' }] },
          { rotulo: 'SDD', blocos: [{ tipo: 'texto', html: '<ul><li><strong>Onde mora o requisito:</strong> em PRD, spec e plan versionados, com critérios verificáveis.</li><li><strong>Retomada:</strong> uma nova sessão lê os artefatos e o último estado confirmado.</li><li><strong>Erro:</strong> aparece na revisão de duas páginas ou num gate, antes do código.</li><li><strong>Revisão:</strong> por documento e por etapa.</li></ul>' }] }
        ] },
        { tipo: 'callout', tom: 'info', titulo: 'Exemplo condutor: o changelog semanal', html:
          '<p>Uma equipe quer gerar um changelog semanal a partir do histórico Git, para reduzir trabalho manual na retomada de estudo. O <em>requisito</em> diz que cada linha traz data, hash curto e mensagem, sem publicar nada. A <em>spec</em> escolhe leitura local do Git, UTF-8 e uma mensagem clara quando não houver repositório. O <em>plano</em> separa parser, formatação e teste, declarando arquivos e comandos. O <em>código</em> implementa essas decisões e a <em>evidência</em> registra que o teste passou e em qual versão do runtime.</p>' +
          '<p>Agora a semana passa a começar no domingo. Se o requisito mudou e o código ainda agrupa de segunda a domingo, há <code>spec_stale</code> ou implementação atrasada a classificar. Se o contrato continua exigindo segunda a domingo e o teste de comportamento falha, há indício de <code>code_incorrect</code>. Se tickets, telemetria e intenção divergem, a resposta correta é <code>decision_required</code>, não uma "correção" inventada pelo agente.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fundamento de engenharia: requisitos, a reciclagem que a IA tornou urgente', html:
          '<p>Engenharia de requisitos é conteúdo de primeiro semestre que muito sênior atrofiou, porque "o negócio manda o card no Jira". Com IA, ela separa quem entrega o que foi pedido de quem entrega o que a IA achou que era. Recicle quatro conceitos:</p>' +
          '<ul><li><strong>Funcional × qualidade/restrição.</strong> Funcional é o que o sistema faz ("encurta URLs"). Qualidade é condição mensurável: p95 sob carga definida, disponibilidade, privacidade. O agente não infere com segurança limiares, ameaça aceita ou obrigação regulatória ausente: explicite e teste o que importa.</li>' +
          '<li><strong>Critério de aceitação verificável.</strong> "Deve ser rápido" não é critério; "p95 &lt; 100 ms medido com k6 em 100 VUs" é. Se não dá para virar teste automatizado ou comando com saída esperada, é desejo.</li>' +
          '<li><strong>Escopo negativo.</strong> Dizer o que não construir limita scope creep humano e interpretações expansivas do agente. Combine não-objetivos com write set e capabilities: texto sozinho não impede efeitos.</li>' +
          '<li><strong>Rastreabilidade.</strong> Cada item do plano aponta para o requisito, decisão ou obrigação técnica que o justifica. Passo sem origem pede revisão: pode ser gold plating, trabalho habilitador legítimo ou requisito ainda não registrado.</li></ul>' },
        { tipo: 'takeaway', html: 'O chat-driven falha porque o requisito mora num <mark>lugar volátil</mark>; SDD o move para <mark>artefatos versionados</mark> e confronta todas as fontes.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Três níveis, três ritmos de mudança</h3>' +
          '<p>SDD maduro separa a especificação em documentos encadeados, cada um respondendo uma pergunta diferente. A separação não é estética: cada documento muda por um motivo e num ritmo, e misturá-los é o que transforma "a spec" num monólito que ninguém atualiza.</p>' },
        { tipo: 'abas', rotulo: 'Os documentos', itens: [
          { rotulo: 'PRD', blocos: [{ tipo: 'texto', html: '<p><code>prd.md</code> responde <strong>o quê e por quê</strong>: o problema, quem sofre com ele, requisitos funcionais e não-funcionais, regras de negócio invioláveis e, a seção mais importante, os <strong>não-objetivos</strong>. Não contém nome de tecnologia. Muda quando o produto muda.</p>' }] },
          { rotulo: 'Spec técnica', blocos: [{ tipo: 'texto', html: '<p><code>spec.md</code> responde <strong>como, arquiteturalmente</strong>: schemas de dados, contratos de API, decisões de arquitetura com justificativa, restrições de camada ("router não acessa banco diretamente"), estratégia de erro e dependências externas. Muda quando a arquitetura muda.</p>' }] },
          { rotulo: 'Plan', blocos: [{ tipo: 'texto', html: '<p><code>plan.md</code> responde <strong>em que ordem</strong>: etapas pequenas com objetivo, dependências, read/write sets, capabilities, gate e evidência esperada. Muda num ritmo mais curto que o de intent e requisitos, mas cada mudança continua versionada e revisável.</p>' }] },
          { rotulo: 'Código', blocos: [{ tipo: 'texto', html: '<p>O código é o artefato confrontado: verificado por teste e type check, e nem sempre derivável da spec. Quando comportamento e documentação divergem, ele não vence por ser o que roda.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>O que o laboratório torna observável</h3>' +
          '<p>O experimento final atravessa intenção, requisitos, não-objetivos, tarefas, gates e evidência com a feature do changelog. A fixture válida mostra um contrato completo. A inválida traz requisito vago, não-objetivo ausente, path inseguro, string de shell e rastreabilidade quebrada. O ponto não é decorar diagnósticos: é ver o parser recusar ambiguidade sem reescrever a entrada em silêncio. Preveja antes de rodar.</p>' },
        { tipo: 'rode', id: 'm01b1-rode', titulo: 'Valide o contrato bom e o ruim', enunciado: 'Rode a validação da fixture inválida do laboratório. A saída abaixo é a real; clique em cada etapa para ler só as linhas dela.',
          prefixo: '$', entrada: 'python -m sdd_lab validate examples/feature.invalid.json', unidade: 'achados', terminalTitulo: 'lab M01', etapas: etapasValidate(),
          prever: { pergunta: 'O contrato inválido tem um requisito vago ("rápido e robusto"). O que o parser faz?', opcoes: [
            { id: 'a', texto: 'Reescreve o requisito para algo verificável e segue.', correta: false, porque: 'corrigir em silêncio é exatamente o que o contrato proíbe: a decisão sobre o que é "rápido" é de produto.' },
            { id: 'b', texto: 'Recusa com um código por achado, aponta o local do problema e termina com exit 20, sem mexer no arquivo.', correta: true, porque: 'cada achado leva código, local e mensagem; o arquivo não é alterado.' },
            { id: 'c', texto: 'Aceita com um aviso, já que a estrutura JSON está certa.', correta: false, porque: 'JSON Schema valida forma; o parser semântico cobre os invariantes de domínio e bloqueia.' }
          ] },
          tutorAntes: 'Aperte Enter. Depois abra a etapa "Contrato inválido" e conte os achados.',
          tutorDepois: 'Oito achados num contrato de poucas linhas: não-objetivo ausente, requisito vago, sem oráculo, sem exemplo e contraexemplo, path fora do workspace, comando como string de shell, requisito sem tarefa e nenhum gate. A fixture válida passa com <code>VALID CAP-001</code>.',
          callout: 'Você viu o parser recusar ambiguidade sem reescrever a entrada.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Regra de reconciliação: sem soberania automática', html:
          '<p>Quando comportamento e documentação divergem, não escolha a spec nem o código por reflexo. Classifique: <code>consistent</code>, <code>spec_stale</code>, <code>code_incorrect</code> ou <code>decision_required</code>. Mitigue primeiro um incidente urgente; depois atualize contrato, implementação, testes e registro de decisão juntos. Se evidência operacional e intenção não bastarem, pare sem mutar e peça a decisão de produto.</p>' },
        { tipo: 'takeaway', html: 'O parser <mark>recusa e aponta</mark>; quem decide o que é "rápido" é <mark>produto</mark>, não o agente.' }
      ] },

      { rotulo: 'Ciclo, ferramentas e erros de spec', blocos: [
        { tipo: 'texto', html:
          '<h3>O ciclo: pesquisar, planejar, implementar, verificar</h3>' +
          '<p>SDD não é só "escrever documentos antes". É um ciclo de quatro fases, e a primeira é a que quase todo mundo pula.</p>' +
          '<ol><li><strong>Pesquisar.</strong> Antes de especificar, investigue o terreno: que código já existe, que padrões o repositório usa, que restrições reais há. Saída: um resumo de contexto. Pular esta fase produz specs que contradizem o código existente, e o agente obedece à spec e quebra o sistema.</li>' +
          '<li><strong>Planejar.</strong> Escrever ou atualizar PRD, spec e plan, nessa ordem, cada nível derivando do anterior, com revisão antes de avançar. Revisar duas páginas de spec custa 10 minutos; revisar 40 arquivos de diff gerado custa uma tarde, e você só passa o olho.</li>' +
          '<li><strong>Implementar.</strong> O agente executa o <code>plan.md</code> etapa por etapa, uma por vez, com o gate de verificação rodando entre elas.</li>' +
          '<li><strong>Verificar.</strong> Mecanicamente (testes, type check, lint, o harness do bloco 2) e semanticamente (o diff faz o que a spec pede? é revisão sua). Divergência volta ao passo 2, não vira remendo no chat.</li></ol>' },
        { tipo: 'ordene', id: 'm01b1-ordene', titulo: 'Ordene o ciclo do SDD', enunciado: 'Use os botões para pôr as seis ações na ordem do ciclo e confira.',
          itens: [
            { id: 'plan', texto: 'Planejar o <code>plan.md</code>: etapas pequenas, read/write sets, gate e evidência esperada' },
            { id: 'pesq', texto: 'Pesquisar o terreno: código existente, padrões e restrições reais' },
            { id: 'verif', texto: 'Verificar mecânica e semanticamente; divergência volta ao planejamento' },
            { id: 'spec', texto: 'Planejar a spec técnica: schemas, contratos, restrições de camada, decisões' },
            { id: 'prd', texto: 'Planejar o PRD: problema, requisitos, não-objetivos' },
            { id: 'impl', texto: 'Implementar uma etapa por vez, com o gate rodando entre elas' }
          ], solucao: ['pesq', 'prd', 'spec', 'plan', 'impl', 'verif'],
          dica: 'Pesquisa vem antes de especificar; o PRD deriva a spec, que deriva o plano.',
          callout: 'Ciclo na ordem certa: pesquisa antes de spec, e a divergência volta ao planejamento.' },
        { tipo: 'texto', html:
          '<h3>Ferramental: o GitHub Spec Kit e por que você constrói o seu</h3>' +
          '<p>O Spec Kit é uma implementação open source do GitHub, <em>não a norma</em> de SDD. A documentação consultada em julho e agosto de 2026 apresenta Spec, Plan, Tasks, Implement, dezenas de integrações e um fallback genérico. A forma de chamar os recursos varia por adapter. O lab inspeciona snapshots e descobre essas formas sem executá-los; confirme sempre a documentação Agentic SDD da versão usada.</p>' +
          '<p>Vale conhecer o Spec Kit para comparar decisões concretas. Neste curso você constrói um kit pequeno porque isso expõe contratos, políticas e gates que as ferramentas prontas escondem. O kit usa Agent Skills, contrato canônico e adapters mínimos: a regra de domínio vive uma vez no núcleo e cada produto só traduz entrada e apresentação.</p>' },
        { tipo: 'abas', rotulo: 'Como cada adapter invoca', itens: [
          { rotulo: 'Comandos de barra', blocos: [{ tipo: 'texto', html: '<p>Em alguns adapters os recursos do Spec Kit aparecem como comandos <code>/speckit.*</code>. O fluxo apresentado é Spec, Plan, Tasks, Implement.</p>' }] },
          { rotulo: 'Menção de skill', blocos: [{ tipo: 'texto', html: '<p>Em outros adapters a invocação é por menção de skill, <code>$speckit-*</code>. Mesmas fases, outra superfície: o curso não decora a sintaxe, descobre-a na versão instalada.</p>' }] },
          { rotulo: 'Kit do curso', blocos: [{ tipo: 'texto', html: '<p>Contrato canônico, Agent Skills e adapters mínimos. A regra de domínio vive uma vez no núcleo; cada produto traduz só entrada e apresentação. O aluno aprende o contrato primeiro para poder adotar, substituir ou remover a ferramenta sem reaprender a raciocinar sobre mudança.</p>' }] }
        ] },
        { tipo: 'texto', largo: true, html:
          '<h3>Panorama de prática vigente</h3>' +
          '<p>O Octoverse 2025 do GitHub identificou mais de 1,1 milhão de repositórios públicos que importam SDKs de LLM, com crescimento anual de 178% na medição deles. O número não mede vagas, empresas privadas, qualidade de código nem adoção no Brasil. Ele mostra por que contratos revisáveis, gates e handoffs não podem ficar restritos a projetos experimentais. <em>(Panorama industrial: revalidar até 18/11/2026.)</em></p>' +
          '<table><thead><tr><th>Prática atual</th><th>Exemplos</th><th>Invariante ensinado no M01</th></tr></thead><tbody>' +
          '<tr><td>Intenção e tarefas persistidas fora do chat</td><td>Markdown versionado, Spec Kit, ADRs, Agent Skills</td><td>requisito, decisão, tarefa, teste</td></tr>' +
          '<tr><td>Feedback mecânico antes da integração</td><td>Ruff, mypy, unittest/pytest, CI, code review</td><td>gate com oráculo, caso negativo e evidência</td></tr>' +
          '<tr><td>Execução paralela de mudanças isoladas</td><td>Git worktree, branches, runners, workers por wave</td><td>read/write sets, contratos e gate global</td></tr>' +
          '<tr><td>Automação de terceiro dentro do fluxo</td><td>templates, workflows, actions, extensões</td><td>inspeção, hash/allowlist e menor privilégio</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Os quatro jeitos de fazer SDD errado</h3>' +
          '<table><thead><tr><th>Anti-padrão</th><th>Como se parece</th><th>Por que falha</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td><strong>Spec-romance</strong></td><td>40 páginas antes da primeira linha de código</td><td>Ninguém revisa 40 páginas, e a ambiguidade se esconde no volume. Specs longas estouram o contexto do agente, que resume (perde) partes.</td><td>Spec proporcional ao risco: feature de 2 dias = 1 a 2 páginas. O resto vira link para doc separada, buscada sob demanda.</td></tr>' +
          '<tr><td><strong>Spec-fóssil</strong></td><td>Descreve o sistema como era há 3 sprints</td><td>O agente confia na spec mais que no código; spec mentirosa gera código que "conserta" o que estava certo.</td><td>Mudou o comportamento, muda a spec no mesmo PR. O M04 automatiza essa cobrança.</td></tr>' +
          '<tr><td><strong>Spec-telepatia</strong></td><td>"Tratar erros adequadamente"</td><td>"Adequadamente" não compila: o agente escolhe uma interpretação, estatisticamente, não a sua.</td><td>Todo advérbio vago vira critério verificável: qual erro, qual resposta, qual log, qual teste prova.</td></tr>' +
          '<tr><td><strong>Spec-cascata</strong></td><td>Especificar o produto inteiro antes de implementar qualquer parte</td><td>É waterfall com passos extras: você aprende implementando, e o aprendizado invalida a spec das partes futuras.</td><td>Fatias verticais, uma feature ponta a ponta por vez. O PRD é estável; spec e plan são por fatia.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'Pesquise <mark>antes</mark> de especificar; spec <mark>proporcional ao risco</mark>, em fatias, com critérios <mark>verificáveis</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Classifique o drift em código</h3>' +
          '<p>A classificação é conservadora: ela só olha evidência e <em>nunca</em> libera mutação. <code>production_supports_observed</code> é <code>bool | None</code> para distinguir "produção contradiz" de "produção não foi observada". Reconstrua o núcleo de <code>drift.py</code> do laboratório.</p>' },
        { tipo: 'python', id: 'm01b1-python', titulo: 'Reconstrua classify_drift', obrigatorio: false,
          enunciado: 'Complete <code>classify_drift(evidence)</code>. <code>consistent</code>: spec e testes aceitam o observado. <code>spec_stale</code>: a spec não aceita, os testes aceitam e a produção sustenta (<code>True</code>). <code>code_incorrect</code>: a spec aceita e os testes não. Qualquer outro caso é <code>decision_required</code>.',
          codigo: codigoDrift, testes: testesDrift,
          dica: 'Encadeie três condições com <code>if / elif / elif</code> e deixe o <code>else</code> em <code>DECISION_REQUIRED</code>. Para a produção, use <code>is True</code>: <code>None</code> não sustenta nada.',
          solucao: solucaoDrift,
          tutorDepois: 'O valor padrão <code>mutation_allowed=False</code> é a fronteira: classificar não autoriza mudar o sistema. E com a produção não observada (<code>None</code>) o caso cai em <code>decision_required</code>, não em <code>spec_stale</code>.',
          callout: 'Os quatro estados classificados, e nenhum deles libera mutação.' },
        { tipo: 'cenario', id: 'm01b1-cenario', titulo: 'A spec e a telemetria discordam', obrigatorio: false,
          enunciado: 'No changelog, a spec diz segunda a domingo, o código agrupa a partir do domingo e a telemetria mostra clientes dependendo do domingo. Não há decisão registrada. Escolha e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Spec, código e produção divergem. O agente propõe "corrigir" o que ele acha mais óbvio. O que você faz?', opcoes: [
              { texto: 'Atualizar a spec para domingo e seguir.', vai: 'f-spec', tom: 'ruim', consequencia: 'você tomou uma decisão de produto sem registro; a evidência de telemetria não vira intenção.' },
              { texto: 'Reverter o código para segunda a domingo, que é o que a spec diz.', vai: 'f-codigo', tom: 'ruim', consequencia: 'soberania automática da spec: os clientes que dependem do domingo quebram.' },
              { texto: 'Classificar como decision_required: mitigar o que for urgente, parar sem mutar e pedir a decisão de produto.', vai: 'decide', tom: 'ok', consequencia: 'intenção e comportamento aceitável não se inferem com segurança aqui.' }
            ] },
            decide: { texto: 'O produto decide e registra: a semana começa no domingo. O que muda agora?', opcoes: [
              { texto: 'Atualizar contrato, registro de decisão e testes no mesmo change set.', vai: 'f-bom', tom: 'ok', consequencia: 'os artefatos voltam a concordar e a regressão fica executável.' },
              { texto: 'Atualizar só a spec e deixar os testes como estão.', vai: 'f-meio', tom: 'ruim', consequencia: 'o teste continua exigindo segunda e a divergência reaparece na sessão seguinte.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Contrato, código, testes e decisão reconciliados num único change set, com a decisão rastreável.' },
            'f-spec': { bom: false, texto: 'A spec virou "verdade" por reflexo, sem dono: o próximo agente a trata como decisão de produto.' },
            'f-codigo': { bom: false, texto: 'O código voltou ao contrato antigo e os clientes que usavam o domingo foram afetados.' },
            'f-meio': { bom: false, texto: 'A spec ficou nova e os testes antigos: a divergência só mudou de lugar.' }
          },
          callout: 'Você pediu decisão onde a evidência não bastava e reconciliou tudo no mesmo change set.' },
        { tipo: 'escolha', id: 'm01b1-esc-fossil', titulo: 'Confira: a spec que ficou para trás',
          pergunta: 'A semana passou a começar no domingo por decisão de produto registrada. O código já agrupa assim, mas a spec diz segunda a domingo. Qual a classificação e a ação?',
          opcoes: [
            { id: 'a', texto: 'code_incorrect: reverter o código para segunda.', correta: false, porque: 'seria dar soberania automática à spec.' },
            { id: 'b', texto: 'consistent: a spec é só documentação.', correta: false, porque: 'spec mentirosa gera código que "conserta" o que estava certo (spec-fóssil).' },
            { id: 'c', texto: 'spec_stale: atualizar contrato e registro de decisão no mesmo change set.', correta: true, porque: 'há decisão registrada e o código a segue; quem ficou velho foi o documento.' },
            { id: 'd', texto: 'decision_required: apagar a spec e recomeçar.', correta: false, porque: 'a decisão já existe; falta só reconciliar o documento.' }
          ], tutorDepois: 'Mudou o comportamento, muda a spec no mesmo change set.' },
        { tipo: 'escolha', id: 'm01b1-esc-criterio', titulo: 'Confira: o critério que se verifica',
          pergunta: 'Qual requisito é um critério de aceitação verificável?',
          opcoes: [
            { id: 'a', texto: '"O sistema deve tratar erros adequadamente."', correta: false, porque: 'spec-telepatia: o agente escolherá uma interpretação, e não a sua.' },
            { id: 'b', texto: '"Deve ser rápido."', correta: false, porque: 'sem limiar nem instrumento, não há oráculo.' },
            { id: 'c', texto: '"A interface deve ser agradável."', correta: false, porque: 'adjetivo sem teste ou comando com saída esperada é desejo.' },
            { id: 'd', texto: '"p95 < 100 ms medido com k6 em 100 VUs."', correta: true, porque: 'vira comando com saída esperada: se não dá para virar teste ou comando, é desejo.' }
          ], tutorDepois: 'Critério verificável tem limiar, instrumento e carga definidos.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes técnicas verificadas em 14/08/2026; o panorama industrial (Octoverse 2025) deve ser revalidado até 18/11/2026. Documentação de produto, comandos e versões: reconfirmar no máximo a cada 90 dias.</p>' },
        { tipo: 'takeaway', html: 'Classifique <mark>antes de mutar</mark>; sem evidência suficiente, a resposta é <mark>decision_required</mark>.' }
      ] }
    ]
  });
})();
