/* M02A · Bloco 2: requisitos, atributos de qualidade e decisões revisáveis. Fonte: M02A.html#b2. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'PARTES = ("fonte", "estimulo", "ambiente", "artefato", "resposta", "medida")', '', '',
    'def cenario_incompleto(c):', '    # devolve a lista de partes ausentes ou vazias, na ordem de PARTES', '    return []', '', '',
    'def stale(versao_req, links):', '    # links: {artefato: versao_do_requisito_que_ele_cita}', '    # devolve os artefatos (ordenados) que citam versão diferente do requisito',
    '    return []', ''].join('\n');
  var testes = [
    'def test_cenario_completo():',
    '    c = {p: "x" for p in PARTES}', '    assert cenario_incompleto(c) == []', '', '',
    'def test_cenario_sem_medida_e_ambiente_vazio():',
    '    c = {p: "x" for p in PARTES}', '    del c["medida"]; c["ambiente"] = "  "',
    '    assert cenario_incompleto(c) == ["ambiente", "medida"]', '', '',
    'def test_drift_marca_artefatos_desatualizados():',
    '    assert stale(3, {"adr": 3, "teste": 2, "cenario": 1}) == ["cenario", "teste"]', '', '',
    'def test_sem_drift_devolve_vazio():', '    assert stale(1, {"adr": 1}) == []', ''].join('\n');
  var solucao = [
    'PARTES = ("fonte", "estimulo", "ambiente", "artefato", "resposta", "medida")', '', '',
    'def cenario_incompleto(c):', '    return [p for p in PARTES if not str(c.get(p, "")).strip()]', '', '',
    'def stale(versao_req, links):', '    return sorted(a for a, v in links.items() if v != versao_req)', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b2',
    titulo: 'Requisitos, atributos de qualidade e decisões revisáveis',
    minutos: 35,
    resumo: 'Documento é instrumento de decisão: requisito observável, atributo de qualidade com cenário, RFC que abre e ADR que registra.',
    objetivo: 'Separar necessidade de solução, transformar um atributo de qualidade em cenário de seis partes e registrar uma decisão que falha quando a realidade muda.',
    revisao: [
      { id: 'm02ab2-nec', pergunta: 'Qual teste distingue necessidade de solução?',
        opcoes: [
          opc('a', 'A necessidade continua verdadeira se a stack mudar; a solução não.', true, '"Usar microserviços, Kafka e modelo X" é lista de soluções, não requisito.'),
          opc('b', 'Necessidade é sempre mais curta.', false, 'tamanho não é critério.'),
          opc('c', 'Solução vem do stakeholder, necessidade do dev.', false, 'a origem não define o tipo.')] },
      { id: 'm02ab2-seis', pergunta: 'Quais são as seis partes de um cenário de atributo de qualidade (SEI)?',
        opcoes: [
          opc('a', 'Fonte do estímulo, estímulo, ambiente, artefato afetado, resposta e medida da resposta.', true, 'obriga "performance" a virar uma situação analisável.'),
          opc('b', 'Problema, solução, custo, prazo, dono, risco.', false, 'são campos de planejamento, não o modelo SEI.'),
          opc('c', 'Entrada, processamento, saída, teste, deploy, métrica.', false, 'não é o modelo.')] },
      { id: 'm02ab2-adr', pergunta: 'RFC interna, RFC da IETF e ADR: qual afirmação está certa?',
        opcoes: [
          opc('a', 'RFC interna abre a decisão; ADR registra o que foi decidido; RFC da IETF tem processo e autoridade próprios.', true, 'novo ADR substitui sem reescrever o passado (supersedes / superseded-by).'),
          opc('b', 'ADR é o mesmo que RFC da IETF.', false, 'RFC interna é só convenção de colaboração.'),
          opc('c', 'ADR abre a discussão e a RFC encerra.', false, 'a ordem é inversa.')] },
      { id: 'm02ab2-c4', pergunta: 'O que é "container" no C4 e o que o manifest estruturado prova?',
        opcoes: [
          opc('a', 'Aplicação ou data store executável/deployável, não Docker; o manifest prova só propriedades objetivas, não completude.', true, 'IDs, paths, processos e relações que não contradizem imports; a limitação entra na evidência.'),
          opc('b', 'Um container Docker; o manifest prova a arquitetura inteira.', false, 'ISO 42010 distingue arquitetura de sua descrição.'),
          opc('c', 'Uma classe; o manifest prova que não há acoplamento.', false, 'confunde níveis.')] },
      { id: 'm02ab2-drift', pergunta: 'Por que um gate que só procura a existência de arquivos é decorativo?',
        opcoes: [
          opc('a', 'Documentação antiga continua verde depois de mudança incompatível; é preciso marcar artefatos impactados como stale.', true, 'documentação útil precisa falhar quando a realidade relevante muda.'),
          opc('b', 'Porque arquivos são lentos de ler.', false, 'o problema é coerência.'),
          opc('c', 'Porque exige ADR para cada arquivo.', false, 'não é a regra.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O B01 delimitou outcome, stakeholders e riscos. O B02 os transforma em afirmações que implementação e teste podem contradizer. O objetivo não é "documentação completa": é reduzir ambiguidade cara, registrar alternativas enquanto existem e criar ligações para descobrir <em>drift</em>. PRD extenso, catálogo documental e design assistido por IA em profundidade ficam no M04.</p>' +
          '<h3>Necessidade, requisito, restrição, hipótese e solução</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Elemento</th><th>Pergunta</th><th>Exemplo</th><th>Teste de qualidade</th></tr></thead><tbody>' +
          '<tr><td>necessidade</td><td>qual problema merece mudança?</td><td>analista reconhece pedido proibido sem depender do advisor</td><td>continua verdadeira se a stack mudar?</td></tr>' +
          '<tr><td>requisito</td><td>qual comportamento deve ser satisfeito?</td><td>policy P0 é aplicada antes de qualquer aceite</td><td>existe observação que o refute?</td></tr>' +
          '<tr><td>restrição</td><td>qual limite não é negociável?</td><td>suíte roda offline e sem credencial</td><td>autoridade e razão explícitas?</td></tr>' +
          '<tr><td>hipótese</td><td>o que ainda precisa de evidência?</td><td>reason codes reduzem reabertura</td><td>há método e condição de revisão?</td></tr>' +
          '<tr><td>solução</td><td>qual mecanismo satisfará?</td><td>porta Advisor com fake e record-replay</td><td>alternativas avaliadas?</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Um requisito verificável tem ID estável, fonte, necessidade ou risco relacionado, formulação observável, prioridade justificada, aceite, owner, dependências, status, condição de revisão e links para ADR, teste e evidência. Palavras como "rápido", "robusto", "escalável", "seguro", "intuitivo" e "acessível" expressam intenção, não aceite: acrescente contexto e medida sem inventar precisão.</p>' +
          '<p><strong>REQ-P0-003</strong> (exemplo trabalhado): se o advisor retornar payload inválido, a política determinística continua sendo a única origem de <code>Decision</code>; o caso é auditado com reason code estável, sem persistir o payload inválido. Fonte: risco R-003 e policy owner. Aceite: fallback malformado e proibição preservada. Revisar quando o contrato do advisory mudar.</p>' },
        { tipo: 'takeaway', html: 'Requisito descreve <mark>comportamento verificável</mark>; <mark>solução</mark> é decisão posterior.' }
      ] },

      { rotulo: 'Qualidade e decisão', blocos: [
        { tipo: 'texto', html:
          '<h3>Atributo de qualidade precisa de cenário</h3>' +
          '<p>O SEI estrutura o cenário em seis partes. Exemplo de resiliência local do <code>work-intake</code>:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Parte</th><th>Cenário</th></tr></thead><tbody>' +
          '<tr><td>fonte</td><td>adapter record-replay</td></tr><tr><td>estímulo</td><td>retorna payload malformado</td></tr>' +
          '<tr><td>ambiente</td><td>processamento batch offline, policy v1 ativa</td></tr><tr><td>artefato</td><td>caso de uso de intake e trust boundary</td></tr>' +
          '<tr><td>resposta</td><td>rejeita advisory, aplica fallback e registra reason code sanitizado</td></tr>' +
          '<tr><td>medida</td><td>zero <code>Decision.accept</code> originada do payload; nenhum texto livre no log; teste termina sem tarefa órfã</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Threshold não nasce de estética: "em 100 ms" só é requisito se stakeholder, workload e consequência justificarem. No laboratório local, tempo é evidência do ambiente, não SLA. Para modificabilidade a medida pode ser estrutural: alterar a política sem editar CLI nem fake advisor, provado por diff e testes. <strong>ISO/IEC 25010</strong> dá vocabulário e modelo de qualidade, não requisitos prontos: marcar todas as características sem cenário, prioridade ou stakeholder gera cobertura aparente e nenhuma decisão.</p>' +
          '<h3>RFC interna abre; ADR registra</h3>' +
          '<p><strong>RFC interna</strong> é convenção de colaboração (problema aberto, opções, perguntas, prazo); não é RFC da IETF. <strong>ADR</strong> registra contexto, forças, alternativas viáveis, decisão, consequências, hipóteses e condição de revisão, de modo que a escolha seja contestável. Status comuns: <code>proposed</code>, <code>accepted</code>, <code>deprecated</code>, <code>superseded</code> (vocabulário local); o que importa é preservar histórico e a relação supersedes / superseded-by. Prefira condição concreta (requisito mudou, corpus falhou, custo acima do budget) a "revisar no futuro". Configuração e regras de import aplicam parte da decisão, mas não explicam por que foi tomada.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Artefato</th><th>Momento</th><th>Erro frequente</th></tr></thead><tbody>' +
          '<tr><td>RFC interna</td><td>antes da decisão</td><td>publicar quando a escolha já é irreversível</td></tr>' +
          '<tr><td>ADR</td><td>ao decidir</td><td>registrar só a alternativa vencedora</td></tr>' +
          '<tr><td>novo ADR</td><td>ao substituir</td><td>reescrever o passado e perder contexto</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>C4 é mapa por audiência</h3>' +
          '<p>C4: System Context (pessoas e sistemas), Container (aplicações ou data stores executáveis; <em>não é Docker</em>), Component (responsabilidades internas) e Code (opcional). Para o <code>work-intake</code>, Context e Container bastam; Component entra para explicar módulos e conferir o gate do B03. ISO/IEC/IEEE 42010 distingue arquitetura da sua descrição, então o manifesto estruturado verifica só propriedades objetivas: IDs, paths, processos esperados e relações que não contradizem imports. Passar o gate não prova que o desenho capturou toda decisão relevante.</p>' },
        { tipo: 'codigo', linguagem: 'json', texto: '{\n  "people": [{"id": "analyst", "concerns": ["contestability", "privacy"]}],\n  "containers": [{"id": "cli", "process": "work-intake", "path": "work_intake/adapters/cli.py"}],\n  "components": [\n    {"id": "policy", "path": "work_intake/domain/policy.py"},\n    {"id": "intake", "path": "work_intake/application/intake.py"}\n  ],\n  "allowed_relations": [\n    {"from": "cli", "to": "intake"},\n    {"from": "intake", "to": "policy"}\n  ]\n}' },
        { tipo: 'texto', html: '<p>Fragmento de contrato, não manifest executado. O laboratório valida schema, existência de paths/IDs e relações declaradas.</p>' },
        { tipo: 'takeaway', html: '<mark>RFC</mark> abre a discussão; <mark>ADR</mark> preserva decisão, consequência e revisão; <mark>C4</mark> comunica por audiência.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'rode', id: 'b2-rode', titulo: 'Drift: o requisito mudou e o resto ficou', obrigatorio: false,
          enunciado: 'Falha semeada do laboratório: o requisito passa a proibir persistência de advisory bruto, mas ADR, cenário, manifest e teste não são atualizados. Saída ilustrativa (exemplo).',
          prefixo: '$', entrada: 'gate de rastreabilidade (exemplo)', unidade: 'ms', terminalTitulo: 'exemplo (saída variável)',
          prever: { pergunta: 'O gate só confere se os arquivos existem. O que ele reporta?', opcoes: [
            { id: 'a', texto: 'Verde: todos os arquivos existem.', correta: true, porque: 'por isso o oráculo é decorativo: presença não é coerência.' },
            { id: 'b', texto: 'Vermelho: ele percebe que o requisito mudou.', correta: false, porque: 'só percebe se compara versões e marca stale.' }] },
          etapas: [
            { id: 'e', nome: 'Gate de presença', descricao: 'arquivos existem?', tom: 'dns', ms: 1, linhas: [L('out', 'adr ok · cenario ok · manifest ok · teste ok'), L('hint', 'verde, mas todos citam o requisito v1 e o requisito agora é v2')] },
            { id: 's', nome: 'Gate de staleness', descricao: 'versão citada = versão atual?', tom: 'response', ms: 1, linhas: [L('out', 'STALE adr, cenario, manifest, teste (citam REQ-P0-003 v1; atual v2)'), L('hint', 'agora o oráculo falha quando a realidade relevante muda')] }
          ] },
        { tipo: 'python', id: 'b2-python', titulo: 'Cenário completo e artefatos stale', obrigatorio: false,
          enunciado: 'Implemente <code>cenario_incompleto(c)</code> (partes ausentes ou vazias, na ordem das seis partes) e <code>stale(versao_req, links)</code> (artefatos, ordenados, que citam versão diferente).',
          codigo: codigo, testes: testes,
          dica: 'List comprehension sobre <code>PARTES</code> com <code>strip()</code>; para <code>stale</code>, filtre <code>links.items()</code> e use <code>sorted</code>.',
          solucao: solucao, callout: 'Cenário e rastreabilidade checados por código.' },
        { tipo: 'complete', id: 'b2-complete', titulo: 'Complete o cenário de qualidade', obrigatorio: false,
          enunciado: 'Escolha a peça certa de cada parte do cenário de resiliência.', linguagem: 'text',
          partes: ['fonte: ', { lacuna: 'f', opcoes: ['adapter record-replay', 'o stakeholder', 'o ADR'], correta: 'adapter record-replay' },
            '\nestímulo: ', { lacuna: 's', opcoes: ['retorna payload malformado', 'o sistema deve ser robusto', 'usar Kafka'], correta: 'retorna payload malformado' },
            '\nmedida: ', { lacuna: 'm', opcoes: ['zero Decision.accept originada do payload', 'desempenho excelente', 'respostas rápidas'], correta: 'zero Decision.accept originada do payload' }],
          explicacao: 'Fonte e estímulo são eventos; a medida é observável. Adjetivos ("robusto", "excelente") não são medida.' },
        { tipo: 'escolha', id: 'b2-esc1', titulo: 'Confira: atributo de qualidade', pergunta: 'Qual é utilizável como atributo de qualidade?',
          opcoes: [
            { id: 'a', texto: '"O sistema deve ser rápido."', correta: false, porque: 'sem estímulo, ambiente nem medida.' },
            { id: 'b', texto: '"Com 200 req/s sustentados e cache frio, 95% das avaliações respondem em até 300 ms."', correta: true, porque: 'tem estímulo, ambiente e medida: dá para testar e decidir trade-offs.' },
            { id: 'c', texto: '"Usar a stack mais moderna."', correta: false, porque: 'é solução.' }] },
        { tipo: 'escolha', id: 'b2-esc2', titulo: 'Confira: ADR', pergunta: 'Um ADR sempre aceita a primeira opção. Qual a hipótese?',
          opcoes: [
            { id: 'a', texto: 'O registro virou racionalização; faltam alternativas reais e uma RFC antes.', correta: true, porque: 'ADR sem alternativas viáveis nem consequências não é contestável.' },
            { id: 'b', texto: 'A primeira opção era a melhor por definição.', correta: false, porque: 'nada prova isso sem comparação.' }] },
        { tipo: 'takeaway', html: 'Documentação útil precisa <mark>falhar</mark> quando a realidade relevante muda.' }
      ] }
    ]
  });
})();
