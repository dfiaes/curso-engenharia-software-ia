/* M03 · Bloco 4: fronteiras internas, camadas e guardrails. Fonte: M03.html#b04. Fontes consultadas em 13/09/2026 (revalidar em até 90 dias). Esboço do Protocol/fake é ilustrativo; o código real está no lab. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var b4Codigo = [
    "import ast",
    "",
    "PROIBIDOS = {",
    "    \"api\": (\"link_shortener.repositories\", \"link_shortener.models\", \"sqlalchemy\"),",
    "    \"services\": (\"fastapi\", \"sqlalchemy\", \"link_shortener.models\"),",
    "    \"repositories\": (\"fastapi\",),",
    "    \"domain\": (\"fastapi\", \"sqlalchemy\", \"starlette\"),",
    "}",
    "",
    "",
    "def imports_de(fonte):",
    "    \"\"\"Devolve [(linha, modulo)] de cada import da árvore sintática.",
    "    'from a.b import c' conta como 'a.b' e também como 'a.b.c' (c pode ser um submódulo).\"\"\"",
    "    achados = []",
    "    return achados",
    "",
    "",
    "def violacoes(camada, fonte):",
    "    \"\"\"Imports que a camada não pode ter: o módulo proibido ou qualquer submódulo dele.",
    "    Uma entrada (linha, modulo) por linha de import, a do módulo mais curto, em ordem de linha.\"\"\"",
    "    return []",
    "",
    "",
    "print(violacoes(\"api\", \"from link_shortener.repositories import LinkRepository\"))"
  ].join('\n');
  var b4Testes = [
    "MUTANTE = \"from link_shortener.models import Link\\n\"",
    "",
    "",
    "def test_import_limpo_nao_acusa():",
    "    fonte = \"from link_shortener.services import criar\\nimport json\\n\"",
    "    assert violacoes(\"api\", fonte) == []",
    "",
    "",
    "def test_api_importando_repositorio_acusa_a_linha():",
    "    fonte = \"import json\\nfrom link_shortener.repositories.links import LinkRepository\\n\"",
    "    assert violacoes(\"api\", fonte) == [(2, \"link_shortener.repositories.links\")]",
    "",
    "",
    "def test_submodulo_de_pacote_proibido_tambem_acusa():",
    "    assert violacoes(\"services\", \"import sqlalchemy.orm\\n\") == [(1, \"sqlalchemy.orm\")]",
    "    assert violacoes(\"domain\", \"from fastapi import HTTPException\\n\") == [(1, \"fastapi\")]",
    "",
    "",
    "def test_from_pacote_import_submodulo_proibido_acusa():",
    "    assert violacoes(\"api\", \"from link_shortener import models\\n\") == [(1, \"link_shortener.models\")]",
    "",
    "",
    "def test_texto_em_string_ou_comentario_nao_e_import():",
    "    fonte = '\"\"\"nunca faça import sqlalchemy aqui\"\"\"\\n# from fastapi import FastAPI\\nx = \"import fastapi\"\\n'",
    "    assert violacoes(\"domain\", fonte) == []",
    "",
    "",
    "def test_camada_sem_regra_aceita_tudo():",
    "    assert violacoes(\"composition\", \"import sqlalchemy\\n\") == []",
    "",
    "",
    "def test_controle_negativo_o_mutante_e_acusado():",
    "    assert violacoes(\"api\", MUTANTE) != []"
  ].join('\n');
  var b4Solucao = [
    "import ast",
    "",
    "PROIBIDOS = {",
    "    \"api\": (\"link_shortener.repositories\", \"link_shortener.models\", \"sqlalchemy\"),",
    "    \"services\": (\"fastapi\", \"sqlalchemy\", \"link_shortener.models\"),",
    "    \"repositories\": (\"fastapi\",),",
    "    \"domain\": (\"fastapi\", \"sqlalchemy\", \"starlette\"),",
    "}",
    "",
    "",
    "def imports_de(fonte):",
    "    achados = []",
    "    for no in ast.walk(ast.parse(fonte)):",
    "        if isinstance(no, ast.Import):",
    "            for alias in no.names:",
    "                achados.append((no.lineno, alias.name))",
    "        elif isinstance(no, ast.ImportFrom) and no.module:",
    "            achados.append((no.lineno, no.module))",
    "            for alias in no.names:",
    "                achados.append((no.lineno, f\"{no.module}.{alias.name}\"))",
    "    return achados",
    "",
    "",
    "def violacoes(camada, fonte):",
    "    proibidos = PROIBIDOS.get(camada, ())",
    "    achados = []",
    "    for linha, modulo in imports_de(fonte):",
    "        for p in proibidos:",
    "            if modulo == p or modulo.startswith(p + \".\"):",
    "                achados.append((linha, modulo))",
    "                break",
    "    # um 'from x import y' proibido gera dois achados na mesma linha: fica o mais curto",
    "    por_linha = {}",
    "    for linha, modulo in sorted(achados):",
    "        por_linha.setdefault(linha, modulo)",
    "    return sorted(por_linha.items())"
  ].join('\n');

  var etapasCriacao = function () {
    return [
      { id: 'api', nome: 'api', descricao: 'Extrai slug e URL; chama o service', tom: 'dns', ms: 1, linhas: [
        L('info', 'a rota extrai slug e URL e chama o service'),
        L('hint', 'nenhum SQL existe neste nível')] },
      { id: 'service', nome: 'services', descricao: 'Valida, pede ao repositório, decide', tom: 'tcp', ms: 2, linhas: [
        L('info', 'valida pelo domain (422 se inválido)'),
        L('info', 'pede ao repositório via protocolo'),
        L('info', 'traduz violação de unicidade em conflito (409)'),
        L('hint', 'a decisão "criar" e o mapeamento de erro moram aqui')] },
      { id: 'repo', nome: 'repositories', descricao: 'select/add na sessão da dependência', tom: 'tls', ms: 2, linhas: [
        L('info', 'executa select/add na sessão que a dependência abriu'),
        L('info', 'se a constraint rejeita, o erro sobe já traduzido por errors'),
        L('hint', 'query e persistência, zero regra')] },
      { id: 'saida', nome: 'Resposta', descricao: 'Contrato de saída', tom: 'response', ms: 1, linhas: [
        L('out', '201 Created'),
        L('body', '{"slug": "abc", "url": "https://exemplo.dev"}'),
        L('hint', 'a entidade do banco nunca cruza a fronteira; trocar o repositório SQLAlchemy pelo fake não altera nenhuma dessas linhas, só a construção')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm03-b4',
    titulo: 'Fronteiras internas: camadas e guardrails',
    minutos: 40,
    resumo: 'Módulos planos bastam para aprender e racham no primeiro prazo apertado. Camadas com direção de import explícita só valem se a direção virar teste com exit code.',
    objetivo: 'Enunciar o que cada camada pode importar, trocar a infraestrutura sem tocar na regra, e transformar a regra de arquitetura em verificação executável com controle negativo.',
    revisao: [
      { id: 'm03b4-seta', pergunta: 'Qual é o contrato de imports entre as camadas do encurtador?',
        opcoes: [
          opc('a', 'A seta só aponta para baixo: <code>api</code> importa services/domain/errors; services importa repositories (via protocolo); repositories importa models', true, 'a raiz de composição é a única exceção documentada: liga a sessão ao repositório concreto.'),
          opc('b', 'Qualquer camada pode importar qualquer outra', false, 'sem direção, a regra foge para a rota e a persistência vaza para HTTP.'),
          opc('c', 'Os repositories importam services', false, 'inverte a seta: a base passaria a depender de quem muda sempre.')] },
      { id: 'm03b4-rota', pergunta: 'Uma rota em <code>api</code> importa <code>LinkRepository</code> "porque é só um CRUD". Qual é o problema real?',
        opcoes: [
          opc('a', 'No dia em que o CRUD ganhar regra, ela não terá lugar; o guardrail com AST rejeita o import com exit code', true, 'regra fugida para a rota duplica decisão a cada endpoint.'),
          opc('b', 'É só estilo', false, 'o custo é estrutural, não estético.'),
          opc('c', 'Repositórios são lentos', false, 'o problema não é de performance.')] },
      { id: 'm03b4-override', pergunta: 'Como se prova que a regra não depende da infraestrutura?',
        opcoes: [
          opc('a', 'Mesma regra, duas infraestruturas (repositório real e fake com o mesmo protocolo; <code>dependency_overrides</code> no app), mesmos resultados', true, 'a construção escolhe o objeto; a lógica só usa o contrato.'),
          opc('b', 'Mockando o SQLAlchemy dentro do service', false, 'o service nem deveria importar SQLAlchemy.'),
          opc('c', 'Com um comentário no código', false, 'convenção oral decai.')] },
      { id: 'm03b4-controle', pergunta: 'Por que o teste de camadas inclui um trecho violador sintético?',
        opcoes: [
          opc('a', 'É o controle negativo: prova que o verificador acusa a violação, em vez de aprovar tudo por acidente', true, 'um oráculo que nunca falha não verifica nada.'),
          opc('b', 'Para testar o Python', false, 'não tem relação com a linguagem.'),
          opc('c', 'Para medir cobertura', false, 'cobertura é outra métrica.')] },
      { id: 'm03b4-adr', pergunta: 'Onde a decisão de fronteiras se registra, e o que o registro precisa conter?',
        opcoes: [
          opc('a', 'Em um ADR, com o custo e a condição de revisão explícitos', true, 'a regra vale o custo enquanto a troca de adapter, provada em teste, continuar possível.'),
          opc('b', 'Na memória do time', false, 'convenção oral decai.'),
          opc('c', 'No nome do commit', false, 'não é o lugar nem o formato.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Até aqui o encurtador vive em módulos planos: suficiente para aprender, frágil para crescer. Quando a regra de negócio mora na rota, cada endpoint novo duplica decisão; quando a rota importa o banco diretamente, trocar persistência exige reescrever HTTP; quando nada verifica a estrutura, ela decai no primeiro prazo apertado. Esta aula define as fronteiras que o laboratório usa daqui em diante: o que cada camada pode importar, como a aplicação troca a infraestrutura sem mudar de regra e como uma regra de arquitetura vira verificação executável em vez de convenção oral.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Pré-requisitos', html: '<p>Blocos 1 a 3 (contrato HTTP, sessão por request, constraints e índices). Este bloco é leitura; a execução (service, repositório, app com override e guardrail verde) fica no laboratório guiado.</p>' },
        { tipo: 'texto', html: '<h3>A estrutura e o contrato de cada pacote</h3>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'src/link_shortener/',
          '├── api/                # HTTP: app, rotas, tradução erro de domínio → status',
          '├── services/           # regra: valida, orquestra repositório, decide',
          '├── repositories/       # acesso a dados: queries, NADA de regra',
          '├── composition.py      # raiz de composição: liga sessão → repositório',
          '├── domain.py           # contratos e validações puras da fronteira',
          '├── errors.py           # tradução erro de persistência → erro de domínio',
          '├── counters.py         # políticas de incremento (ingênuo vs. atômico)',
          '├── models.py           # entidades SQLAlchemy (o schema do banco)',
          '└── db.py               # engine, sessões, fronteira transacional'].join('\n') },
        { tipo: 'texto', html: '<p>O contrato inteiro é a <strong>direção dos imports</strong>: a seta só aponta para baixo. Escolha uma camada.</p>' },
        { tipo: 'abas', rotulo: 'Camada', itens: [
          { rotulo: 'api', blocos: [{ tipo: 'texto', html: '<p>Importa <code>services</code>, <code>domain</code> e <code>errors</code>. <strong>Nunca</strong> <code>repositories</code> (a tentação aparece no CRUD simples; no dia em que o CRUD ganha regra, ela já tem lugar) e <strong>nunca</strong> <code>models</code> nem SQLAlchemy: entidade de banco não vaza para HTTP, e um campo interno exposto por preguiça vira vazamento no M12.</p>' }] },
          { rotulo: 'services', blocos: [{ tipo: 'texto', html: '<p>Importa <code>repositories</code> (via protocolo), <code>domain</code> e <code>errors</code>. É o único lugar com decisão; recebe e devolve tipos de domínio, não Request/Response. Service que importa FastAPI vazou HTTP para dentro.</p>' }] },
          { rotulo: 'repositories', blocos: [{ tipo: 'texto', html: '<p>Importa <code>models</code> e o necessário de SQLAlchemy. Query e persistência, zero regra: "se status for X então..." em repository é regra fugida de casa.</p>' }] },
          { rotulo: 'composition', blocos: [{ tipo: 'texto', html: '<p>A <strong>raiz de composição</strong> é a única exceção documentada: liga a sessão ao repositório concreto para a rota. Todo o resto só conhece contratos.</p>' }] },
          { rotulo: 'domain e errors', blocos: [{ tipo: 'texto', html: '<p>Não importam framework nenhum. São a base da pirâmide: testáveis sem banco, sem HTTP, sem container.</p>' }] }
        ] },
        { tipo: 'callout', tom: 'info', titulo: 'Referência do conceito', html: '<p>Em Python, os imports tornam as dependências entre módulos observáveis: o sistema de imports resolve nomes a partir de pacotes, e qualquer import proibido aparece como texto no fonte. Uma regra executável pode varrer a árvore sintática e rejeitar import de infraestrutura no domínio. <code>Protocol</code> descreve o contrato necessário ao consumidor sem herdar implementação; a composição escolhe qual objeto atende ao protocolo. Testes demonstram que substituir o adapter preserva o comportamento.</p>' },
        { tipo: 'texto', html:
          '<h3>Coesão, acoplamento e direção de dependência</h3>' +
          '<ul><li><strong>Coesão alta:</strong> o que muda junto, mora junto. <strong>Acoplamento baixo:</strong> o que muda separado, depende pouco. Camadas são essa ideia operacionalizada: cada pacote tem um motivo para mudar.</li>' +
          '<li><strong>Direção para dentro.</strong> Dependências apontam das bordas (HTTP, banco) para o centro (domínio, regras). O domínio não conhece HTTP nem banco; a versão pragmática admite o service conhecer o <em>protocolo</em> do repositório, nunca a implementação. A regra vale o custo quando a troca de adapter, provada em teste, continua possível.</li>' +
          '<li><strong>Dependência estável.</strong> Dependa na direção do que muda pouco: <code>domain</code> muda raramente e todos dependem dele; <code>api</code> muda sempre e ninguém depende dela. Inverter a seta faz cada mudança de rota sacudir a base.</li></ul>' },
        { tipo: 'takeaway', html: 'A <mark>seta só aponta para baixo</mark>: <mark>api</mark> traduz HTTP, <mark>services</mark> decide, <mark>repositories</mark> só consulta, e <mark>domain</mark> não conhece framework.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Override: trocar a infraestrutura sem tocar na regra</h3>' +
          '<p>O service recebe um repositório que atende ao protocolo: no laboratório, a implementação SQLAlchemy; no teste, um fake em memória com o mesmo comportamento. Nada na regra muda entre os dois, porque a construção escolhe o objeto e a lógica só usa o contrato. No nível HTTP, o mesmo princípio aparece como <code>dependency_overrides</code>: a aplicação real atende requests com a sessão de teste injetada, sem startup alternativo e sem condicional de ambiente. É assim que se prova: mesma regra, duas infraestruturas, mesmos resultados.</p>' +
          '<p>Esboço ilustrativo do protocolo (não é o código do lab):</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'from typing import Protocol',
          '',
          'class LinkRepository(Protocol):',
          '    async def add(self, slug: str, url: str) -> None: ...',
          '    async def get(self, slug: str) -> str | None: ...',
          '',
          '# real: usa a sessão SQLAlchemy da dependência (repositories/)',
          '# fake: guarda num dict e levanta o mesmo erro de domínio na duplicata (testes)',
          '# o service só vê LinkRepository; composition.py decide qual objeto entregar'].join('\n') },
        { tipo: 'texto', html:
          '<h3>Guardrail: arquitetura com exit code</h3>' +
          '<p>Convenção oral decai; verificação executável permanece. O laboratório varre a árvore sintática dos pacotes e rejeita imports proibidos: <code>api</code> não toca <code>repositories</code> nem <code>models</code> (a sessão atravessa como valor opaco da dependência); <code>services</code> não toca FastAPI, SQLAlchemy nem <code>models</code>; <code>repositories</code> não toca FastAPI; o núcleo não toca framework nenhum. Um import ilegal quebra a suíte com a violação apontada. O teste inclui seu próprio <strong>controle negativo</strong>, um trecho violador sintético que o verificador deve acusar, para que o oráculo não aprove tudo por acidente.</p>' },
        { tipo: 'rode', id: 'b4-rode-criacao', titulo: 'Siga uma criação de ponta a ponta',
          enunciado: 'Rode e clique em cada camada. As linhas descrevem o percurso do <code>POST /links</code> (não são saída de ferramenta).',
          prefixo: '$', entrada: 'POST /links {"slug": "abc", "url": "https://exemplo.dev"}', unidade: 'u', terminalTitulo: 'percurso por camadas', etapas: etapasCriacao(),
          prever: { pergunta: 'Para trocar o repositório SQLAlchemy por um fake em memória nos testes, o que precisa mudar?', opcoes: [
            { id: 'a', texto: 'Só a construção (o que a composição ou o override entrega); a regra do service não muda.', correta: true, porque: 'o service depende do protocolo, não da implementação.' },
            { id: 'b', texto: 'O service, para importar o fake no lugar do real.', correta: false, porque: 'se o service importa a implementação, a fronteira já está furada.' },
            { id: 'c', texto: 'A rota, para chamar o fake diretamente.', correta: false, porque: 'a rota nunca conhece repositório.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em services e em Resposta.',
          tutorDepois: 'Cada camada tem um verbo: a api traduz, o service decide, o repository consulta, e o contrato de saída fecha. Trocar a infraestrutura mexe só na construção.',
          callout: 'Você seguiu uma criação pelas três camadas e viu onde a troca de adapter acontece.' },
        { tipo: 'texto', html: '<p>A decisão de fronteiras, com custo e condição de revisão, fica registrada no <strong>ADR</strong> do laboratório: é a resposta a "por que isto está assim e quando muda".</p>' },
        { tipo: 'takeaway', html: 'Troque o <mark>adapter</mark>, não a <mark>regra</mark>; e deixe um <mark>teste com exit code</mark> guardando a seta.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b4-python', titulo: 'Escreva o guardrail de imports', obrigatorio: false,
          enunciado: 'Implemente <code>imports_de(fonte)</code> e <code>violacoes(camada, fonte)</code> com <code>ast</code>. Texto em docstring, comentário ou string <em>não</em> é import. O último teste é o controle negativo: o mutante tem de ser acusado.',
          codigo: b4Codigo, testes: b4Testes,
          dica: 'Percorra <code>ast.walk(ast.parse(fonte))</code>. Em <code>ast.Import</code>, cada <code>alias.name</code>. Em <code>ast.ImportFrom</code>, <code>no.module</code> e também <code>f"{no.module}.{alias.name}"</code>. Compare com <code>modulo == p or modulo.startswith(p + ".")</code>, e guarde o mais curto por linha.',
          solucao: b4Solucao,
          tutorDepois: 'Por AST o verificador não se confunde com texto: um comentário que cita "import sqlalchemy" não quebra o build, e um <code>from pacote import submodulo</code> não escapa.',
          callout: 'O guardrail acusou as violações e o mutante, e ignorou o texto que só parecia import.' },
        { tipo: 'transcript', id: 'b4-transcript', titulo: 'Ache o que fura a fronteira', obrigatorio: false, terminalTitulo: 'revisão do PR',
          enunciado: 'O agente revisa um PR que adiciona <code>GET /links/{slug}/stats</code>. Três afirmações dele violam o contrato de camadas do bloco. Clique e confira.',
          linhas: [
            { quem: 'voce', texto: 'Revise o PR que adiciona GET /links/{slug}/stats.' },
            { quem: 'agente', texto: 'A rota em api/app.py importa LinkRepository direto: é só um CRUD, e economiza uma indireção.' },
            { quem: 'agente', texto: 'O service recebe o repositório pelo protocolo e traduz a violação de unicidade em conflito (409).' },
            { quem: 'agente', texto: 'No repository coloquei if link.status == "blocked": return None, para centralizar a regra num lugar só.' },
            { quem: 'agente', texto: 'O teste de camadas varre a AST e inclui um trecho violador sintético que deve ser acusado.' },
            { quem: 'agente', texto: 'A rota devolve a entidade Link do SQLAlchemy; o response_model já filtra os campos.' }
          ],
          erradas: [1, 3, 5],
          explicacao: {
            1: 'a seta aponta para baixo: <code>api</code> importa <code>services</code>, nunca <code>repositories</code>. No dia em que o CRUD ganhar regra, ela não terá lugar.',
            3: 'repository é query pura. "Se status for X então..." é regra fugida de casa e pertence ao service.',
            5: '<code>api</code> não importa <code>models</code>: entidade de banco não vaza para HTTP. A rota devolve o contrato de saída, e um campo interno exposto por preguiça vira vazamento (M12).'
          },
          tutorDepois: 'As linhas certas são as que respeitam a direção: service via protocolo, teste com controle negativo.' },
        { tipo: 'escolha', id: 'b4-esc-rota', titulo: 'Confira: o import "inofensivo"',
          pergunta: 'Uma rota em <code>api</code> importa <code>repositories.LinkRepository</code> "porque é só um CRUD". Qual é o problema real e como o módulo o previne?',
          opcoes: [
            { id: 'a', texto: 'A dependência aponta para a camada errada: no dia em que o CRUD ganhar regra, ela não terá lugar; o guardrail com AST rejeita o import com exit code.', correta: true, porque: 'regra fugida para a rota duplica decisão a cada endpoint; o controle negativo prova que o teste pega.' },
            { id: 'b', texto: 'Nenhum: repositórios podem ser importados por qualquer camada.', correta: false, porque: 'a seta só aponta para baixo.' },
            { id: 'c', texto: 'O problema é só de estilo; o guardrail serve para formatar imports.', correta: false, porque: 'o guardrail verifica estrutura, não formatação.' },
            { id: 'd', texto: 'O problema é de performance, pois repositórios são lentos.', correta: false, porque: 'o custo é de direção de dependência.' }
          ], tutorDepois: 'Convenção oral decai; o teste que quebra o build permanece.' },
        { tipo: 'escolha', id: 'b4-esc-status', titulo: 'Confira: quem traduz para status',
          pergunta: 'Dentro do contrato de camadas, quem converte um erro de domínio em um status HTTP?',
          opcoes: [
            { id: 'a', texto: 'O repository, ao capturar o erro do banco.', correta: false, porque: 'repository só consulta e persiste; o erro sobe já traduzido por <code>errors</code>.' },
            { id: 'b', texto: 'A camada <code>api</code>, que traduz erro de domínio em status.', correta: true, porque: 'o service decide e levanta o erro de domínio (por exemplo, conflito); a tradução para HTTP é transporte.' },
            { id: 'c', texto: 'O <code>domain</code>, que conhece os códigos HTTP.', correta: false, porque: 'domain não importa framework nenhum.' }
          ], tutorDepois: 'Decisão no service, transporte na api.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes deste bloco: documentação do Python (the import system, typing Protocol) e do FastAPI (dependencies). Consultadas em 13/09/2026; documentação de framework deve ser revalidada em até 90 dias.</p>' },
        { tipo: 'takeaway', html: 'Registre a fronteira num <mark>ADR</mark>, com <mark>custo</mark> e <mark>condição de revisão</mark>, e proteja-a com um teste que <mark>sabe falhar</mark>.' }
      ] }
    ]
  });
})();
