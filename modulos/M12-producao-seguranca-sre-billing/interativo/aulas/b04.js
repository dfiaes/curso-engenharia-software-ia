/* M12 · Bloco 4: Multi-tenancy e RLS como propriedade verificável. Fonte: M12.html#b4. Exemplos ilustrativos (valores variáveis); a prova em PostgreSQL real mora no laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var SQL = 'SELECT * FROM projects;  -- sem WHERE';

  TrilhaAula.registrar({
    id: 'm12-b4',
    titulo: 'Multi-tenancy e RLS como propriedade verificável',
    minutos: 40,
    resumo: 'Isolamento entre clientes não é a promessa de que a aplicação lembra de filtrar: é um teste que tenta vazar e falha. O banco nega por padrão, o tenant vem da transação e cada data plane carrega o tenant na chave.',
    objetivo: 'Decidir onde mora a fronteira de isolamento (política no banco com negação padrão), distinguir USING de WITH CHECK, propagar o tenant por transação e provar o isolamento em cada data plane com teste negativo.',
    revisao: [
      { id: 'm12b4-prop', pergunta: 'O que torna o isolamento entre tenants uma propriedade verificável?',
        opcoes: [
          opc('a', 'Uma asserção executável: nenhuma linha, objeto ou mensagem de outro tenant é visível ou gravável, provada por teste que tenta vazar e falha', true, 'a alternativa é a promessa de que a aplicação "lembra de filtrar", que não se testa.'),
          opc('b', 'Um WHERE tenant_id = ? em todas as consultas existentes', false, 'basta uma consulta nova sem o filtro para vazar tudo.'),
          opc('c', 'Um schema por tenant, em qualquer cenário', false, 'a topologia muda custo e blast radius; o invariante é o mesmo nas quatro.')] },
      { id: 'm12b4-using', pergunta: 'Qual a diferença entre USING e WITH CHECK numa política de RLS?',
        opcoes: [
          opc('a', 'USING decide quais linhas existentes são visíveis (leitura, atualização, exclusão); WITH CHECK decide quais linhas novas ou alteradas podem ser gravadas', true, 'tabela que filtra leitura mas aceita qualquer escrita continua vazando por inserção.'),
          opc('b', 'USING vale só para SELECT e WITH CHECK só para DELETE', false, 'WITH CHECK trata a gravação de linhas novas ou alteradas.'),
          opc('c', 'São sinônimos; basta declarar um deles', false, 'sem WITH CHECK, a inserção com tenant alheio passa.')] },
      { id: 'm12b4-papel', pergunta: 'Por que o papel da aplicação não pode ser dono da tabela nem ter BYPASSRLS?',
        opcoes: [
          opc('a', 'Dono da tabela e superusuário escapam da política; a aplicação usa um papel sem propriedade e sem bypass, e a tabela usa FORCE ROW LEVEL SECURITY', true, 'a migração usa papel separado.'),
          opc('b', 'Porque o dono não consegue ler a própria tabela', false, 'o problema é o oposto: o dono ignora a política e lê tudo.'),
          opc('c', 'Porque BYPASSRLS torna as consultas mais lentas', false, 'não é desempenho: é a política deixando de se aplicar.')] },
      { id: 'm12b4-pool', pergunta: 'Como evitar que o tenant A vaze para o B quando a mesma conexão do pool atende os dois?',
        opcoes: [
          opc('a', 'Fixar o tenant com escopo local à transação e provar com uma suíte de reutilização A→B com rollback', true, 'o contexto nasce e morre dentro da transação do pedido; configuração de sessão sobrevive à devolução ao pool.'),
          opc('b', 'Fixar o tenant uma vez por conexão, na abertura do pool', false, 'a sessão é reaproveitada entre tenants e contamina o próximo uso.'),
          opc('c', 'Ler o tenant de um argumento do pedido', false, 'argumento controlado pelo chamador pode ser adulterado; o tenant vem do contexto.')] },
      { id: 'm12b4-fake', pergunta: 'O fake em memória dos data planes passa todos os testes cross-tenant. Isso aprova o provedor real de busca vetorial?',
        opcoes: [
          opc('a', 'Não: o fake prova o contrato; o provedor exige filtro nativo e a trilha com serviço real, com teste negativo por data plane', true, 'um fake que isola por construção não prova que o serviço real tem filtro.'),
          opc('b', 'Sim, porque o contrato é o mesmo', false, 'o contrato testável sem rede não substitui o filtro nativo do serviço.'),
          opc('c', 'Só se o fake tiver cobertura de 100%', false, 'cobertura não prova isolamento no provedor.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Um desenvolvedor esquece o <code>WHERE tenant_id = ?</code> numa consulta nova, e o cliente A passa a ver contratos do cliente B. A causa não é descuido isolado: é um desenho em que o isolamento depende de que <em>toda</em> consulta futura lembre de filtrar. Este bloco troca essa promessa por uma propriedade que se testa. Pré-requisitos: identidade e tenant resolvidos na fronteira (Bloco 3) e o invariante de que conteúdo recuperado nunca amplia autoridade (Bloco 2).</p>' +
          '<h3>Isolamento como negação observável</h3>' +
          '<p><strong>Multi-tenancy</strong> é o compartilhamento de infraestrutura entre clientes isolados por identidade. <strong>Tenant</strong> é a identidade de isolamento: tudo que pertence a um cliente carrega esse identificador. <strong>Propriedade verificável</strong> quer dizer que o isolamento é uma asserção executável (“nenhuma linha, objeto ou mensagem de outro tenant é visível ou gravável”) e não uma promessa. <strong>Row Level Security (RLS)</strong> é o mecanismo do PostgreSQL que anexa essa asserção à tabela: cada acesso passa por uma política antes de tocar nas linhas.</p>' +
          '<p>O modelo mental tem quatro topologias com o mesmo invariante e custos diferentes:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Topologia</th><th>O que ganha</th><th>O que cobra</th></tr></thead><tbody>' +
          '<tr><td>Linha compartilhada com coluna de tenant</td><td>Menor custo operacional</td><td>Disciplina total de tenant em cada data plane</td></tr>' +
          '<tr><td>Schema por tenant</td><td>Mais isolamento</td><td>Custo de migração, backup e operação</td></tr>' +
          '<tr><td>Banco por tenant</td><td>Mais isolamento</td><td>Custo de migração, backup e operação</td></tr>' +
          '<tr><td>Conta ou projeto separado</td><td>Atende requisito regulatório ou reduz blast radius</td><td>Operar N ambientes</td></tr>' +
          '</tbody></table>' +
          '<p class="ta-nota">Valores de custo, latência ou escala neste bloco são exemplo variável, nunca medição. A decisão depende de risco, escala, capacidade operacional e recuperação; porte do contrato nunca determina sozinho a topologia.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Conceito', html:
          '<p>Sem política aplicável, o acesso com RLS <strong>nega por padrão</strong>: nenhuma linha passa. O mecanismo da falha é confiar só no filtro escrito pela aplicação, onde um <code>WHERE</code> esquecido vaza tudo. A consequência arquitetural: a fronteira decisiva fica no banco, que nega mesmo quando a aplicação erra, e o tenant chega pelo <strong>contexto da transação</strong>, não pelo argumento do pedido.</p>' },
        { tipo: 'takeaway', html: 'Multi-tenancy é <mark>propriedade verificável</mark>: o banco <mark>nega por padrão</mark>, e a prova é um teste que tenta vazar.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>USING, WITH CHECK, papéis e contexto por transação</h3>' +
          '<p>A decisão central: política no banco com negação padrão, papéis sem privilégio de fuga e tenant propagado por transação. <code>USING</code> controla quais linhas <em>existentes</em> são visíveis para leitura, atualização e exclusão; <code>WITH CHECK</code> controla quais linhas <em>novas ou alteradas</em> podem ser gravadas. Políticas podem ser permissivas (qualquer uma que permita libera) ou restritivas (todas precisam permitir); o padrão do módulo é uma política permissiva por tabela para o papel da aplicação, mantendo a negação padrão para todo o resto.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Pergunta</th><th>Controle</th><th>Negação</th><th>O que não fazer</th></tr></thead><tbody>' +
          '<tr><td>Quem pode furar a política?</td><td>Papel da aplicação sem propriedade e sem <code>BYPASSRLS</code>; tabela com <code>FORCE ROW LEVEL SECURITY</code></td><td>Dono da tabela e superusuário escapam; migração usa papel separado</td><td>Entregar à aplicação o papel dono das tabelas</td></tr>' +
          '<tr><td>De onde vem o tenant?</td><td><code>set_config(\'app.tenant_id\', valor, true)</code>, escopo local à transação</td><td>Configuração de sessão sobrevive à devolução ao pool e contamina o próximo uso</td><td>Ler o tenant de argumento do pedido ou de variável global</td></tr>' +
          '<tr><td>Leitura sem filtro vaza?</td><td><code>USING</code> compara o tenant da linha com o contexto</td><td>Sem contexto, nenhuma linha é visível (M12-AT-010)</td><td>Confiar no <code>WHERE</code> da aplicação como única barreira</td></tr>' +
          '<tr><td>Escrita cruzada passa?</td><td><code>WITH CHECK</code> compara o tenant da nova linha com o contexto</td><td>Inserção com tenant alheio é negada pelo banco (M12-AT-011)</td><td>Validar tenant só na camada Python e gravar direto</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Observe o mesmo <code>SELECT</code> sem <code>WHERE</code> em cinco configurações. As linhas visíveis seguem o simulador do módulo: a tabela tem duas linhas do tenant A e duas do B.</p>' },
        { tipo: 'rode', id: 'b4-rode', titulo: 'Um SELECT sem filtro, cinco configurações',
          enunciado: 'Clique em cada etapa para ver quantas linhas a consulta devolve. A barra mostra as linhas visíveis (de 4). Saída ilustrativa, derivada do simulador do módulo.',
          prefixo: 'Prompt', entrada: SQL, unidade: 'linhas', terminalTitulo: 'projects (A-1, A-2, B-1, B-2)',
          prever: { pergunta: 'Com RLS ativo, papel da aplicação sem bypass e nenhum tenant definido na transação, quantas linhas esse SELECT devolve?', opcoes: [
            { id: 'a', texto: 'As 4 linhas: sem tenant, a política não filtra.', correta: false, porque: 'sem contexto não há tenant para comparar; a regra é negar.' },
            { id: 'b', texto: 'As 2 linhas do tenant A, o primeiro da tabela.', correta: false, porque: 'o banco não adivinha tenant: não há contexto fixado.' },
            { id: 'c', texto: 'Nenhuma: sem contexto, a política nega tudo (falha segura).', correta: true, porque: 'a comparação com um contexto vazio nunca é verdadeira, e sem política aplicável o RLS nega por padrão.' }
          ] },
          etapas: [
            { id: 'sem-rls', nome: 'Sem RLS e sem filtro', descricao: 'Vazamento total', tom: 'request', ms: 4, linhas: [
              L('cmd', SQL),
              L('out', 'A-1  A-2  B-1  B-2'),
              L('hint', 'sem RLS e sem filtro: vazamento total (4 linhas, 2 de outro tenant)')] },
            { id: 'esqueceu', nome: 'Aplicação esqueceu o WHERE', descricao: 'Só filtro na aplicação', tom: 'tcp', ms: 4, linhas: [
              L('info', 'o filtro vive no código; a consulta nova não o tem'),
              L('cmd', SQL),
              L('out', 'A-1  A-2  B-1  B-2'),
              L('hint', 'funciona até alguém esquecer o WHERE em uma consulta nova')] },
            { id: 'rls-a', nome: 'RLS, contexto = A', descricao: 'Política filtra no banco', tom: 'response', ms: 2, linhas: [
              L('info', "set_config('app.tenant_id', 'A', true)  -- dentro da transação"),
              L('cmd', SQL),
              L('in', 'A-1  A-2'),
              L('hint', 'USING: tenant_id = contexto; B-1 e B-2 ficam ocultas mesmo sem WHERE')] },
            { id: 'sem-ctx', nome: 'RLS, sem contexto', descricao: 'Falha segura', tom: 'tls', ms: 0, linhas: [
              L('cmd', SQL),
              L('in', '(0 linhas)'),
              L('hint', 'contexto vazio: a política nega tudo (M12-AT-010)')] },
            { id: 'bypass', nome: 'Papel dono ou BYPASSRLS', descricao: 'A política é ignorada', tom: 'dns', ms: 4, linhas: [
              L('info', 'o papel é dono da tabela (ou tem BYPASSRLS)'),
              L('cmd', SQL),
              L('out', 'A-1  A-2  B-1  B-2'),
              L('hint', 'solução: FORCE ROW LEVEL SECURITY e papel de aplicação sem bypass e sem propriedade')] }
          ],
          tutorAntes: 'Faça a previsão, aperte Enter e depois clique nas outras etapas.',
          tutorDepois: 'Só duas configurações isolam por conta própria: RLS com contexto e RLS sem contexto (que nega tudo). Filtro na aplicação e papel com fuga vazam do mesmo jeito que não ter nada.',
          callout: 'Você viu que a barreira que não depende da aplicação lembrar é a política no banco, aplicada a um papel sem fuga.' },
        { tipo: 'texto', html:
          '<h3>O exemplo trabalhado</h3>' +
          '<p>Uma aplicação defeituosa emite uma consulta sem filtro e, em seguida, tenta gravar um registro com o tenant alheio. O fluxo correto nega duas vezes, em camadas independentes: a leitura devolve só as linhas do tenant corrente porque o <code>USING</code> filtra no banco; a escrita é recusada porque o <code>WITH CHECK</code> compara o tenant da nova linha com o contexto. O SQL é referência ilustrativa (valores variáveis); a versão executável vive na migração do laboratório e só roda na trilha com PostgreSQL real.</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto: [
          '-- SQL de referência ilustrativo (valores variáveis; ver migração do laboratório)',
          'ALTER TABLE projects ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE projects FORCE ROW LEVEL SECURITY;',
          '',
          'CREATE POLICY projects_tenant_isolation ON projects',
          '  FOR ALL TO course_m12_app',
          "  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)",
          "  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);"].join('\n') },
        { tipo: 'takeaway', html: '<mark>USING</mark> limita o que se lê, <mark>WITH CHECK</mark> limita o que se grava, e o papel da aplicação <mark>não escapa</mark> da política.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Contexto por transação e demais data planes</h3>' +
          '<p>O contexto precisa nascer e morrer dentro da transação do pedido ou do trabalho: ao abrir a transação, fixa-se o tenant com escopo local; ao confirmar ou reverter, o contexto desaparece. Conexão de pool é reutilizada entre tenants, então a prova obrigatória é a <strong>reutilização A→B</strong>: a mesma conexão servindo o tenant B depois do A, sem resíduo de linhas, configuração ou estado do anterior.</p>' +
          '<p>RLS cobre apenas SQL. Vetor, cache, objetos, grafo, fila e telemetria exigem <strong>namespacing</strong> próprio com a mesma regra: o tenant compõe a chave, o filtro ou o prefixo, e a ausência dele nega em vez de listar tudo.</p>' },
        { tipo: 'complete', id: 'b4-complete', titulo: 'Monte a política e a propagação do tenant', linguagem: 'sql', obrigatorio: false,
          enunciado: 'Escolha, em cada lacuna, a peça que faz o banco negar mesmo quando a aplicação erra.',
          partes: [
            'ALTER TABLE projects ENABLE ROW LEVEL SECURITY;\nALTER TABLE projects ', { lacuna: 'force', opcoes: ['FORCE ROW LEVEL SECURITY', 'DISABLE ROW LEVEL SECURITY', 'NO FORCE ROW LEVEL SECURITY'], correta: 'FORCE ROW LEVEL SECURITY' },
            ';\n\nCREATE POLICY projects_tenant_isolation ON projects\n  FOR ALL TO ', { lacuna: 'papel', opcoes: ['course_m12_app', 'postgres', 'PUBLIC'], correta: 'course_m12_app' },
            '\n  USING (tenant_id = ', { lacuna: 'using', opcoes: ["current_setting('app.tenant_id', true)::uuid", 'tenant_id_do_argumento', 'tenant_id'], correta: "current_setting('app.tenant_id', true)::uuid" },
            ')\n  WITH CHECK (', { lacuna: 'check', opcoes: ["tenant_id = current_setting('app.tenant_id', true)::uuid", 'true', 'tenant_id IS NOT NULL'], correta: "tenant_id = current_setting('app.tenant_id', true)::uuid" },
            ');\n\n-- ao abrir a transação do pedido:\nSELECT set_config(\'app.tenant_id\', $1, ', { lacuna: 'escopo', opcoes: ['true', 'false'], correta: 'true' },
            ');'
          ],
          explicacao: 'O papel da aplicação é o alvo da política e não tem propriedade nem <code>BYPASSRLS</code>; <code>FORCE</code> faz a política valer também para o dono. <code>USING</code> e <code>WITH CHECK</code> comparam com o contexto, e o terceiro argumento <code>true</code> de <code>set_config</code> dá escopo local à transação: o valor some no commit ou rollback e não contamina a conexão devolvida ao pool.',
          callout: 'Política montada: negação padrão, papel sem fuga e tenant com escopo de transação.' },
        { tipo: 'python', id: 'b4-python', titulo: 'Isole cache e busca vetorial por tenant', obrigatorio: false,
          enunciado: 'Complete as quatro lacunas de <code>TenantPlanes</code>, um fake determinístico dos data planes: o tenant compõe a chave do cache, a ausência de tenant nega, a busca vetorial só lista documentos do tenant do contexto e <code>delete_tenant</code> preserva o outro. Sem rede e só com a biblioteca padrão.',
          codigo: "class TenantNegado(Exception):\n    pass\n\n\nclass TenantPlanes:\n    def __init__(self):\n        self._cache = {}\n        self._docs = []  # (tenant, doc_id, texto)\n\n    def _exigir(self, tenant):\n        # 1. sem tenant no contexto, a operação nega (nunca lista tudo)\n        return tenant\n\n    def _chave(self, tenant, key):\n        # 2. o tenant compõe a chave do cache\n        return key\n\n    def cache_put(self, tenant, key, value):\n        self._cache[self._chave(self._exigir(tenant), key)] = value\n\n    def cache_get(self, tenant, key):\n        return self._cache.get(self._chave(self._exigir(tenant), key))\n\n    def vector_add(self, tenant, doc_id, texto):\n        self._docs.append((self._exigir(tenant), doc_id, texto))\n\n    def vector_search(self, tenant, consulta):\n        self._exigir(tenant)\n        # 3. só documentos do tenant do contexto\n        return [d for (_, d, t) in self._docs if consulta in t]\n\n    def delete_tenant(self, tenant):\n        self._exigir(tenant)\n        # 4. remova cache e documentos do tenant; devolva quantos registros saíram\n        return 0\n\n\np = TenantPlanes()\np.cache_put(\"a\", \"k\", \"cache-A\")\np.cache_put(\"b\", \"k\", \"cache-B\")\nprint(p.cache_get(\"a\", \"k\"))\n", testes: "def _montar():\n    p = TenantPlanes()\n    p.cache_put(\"a\", \"same-key\", \"cache-A\")\n    p.cache_put(\"b\", \"same-key\", \"cache-B\")\n    p.vector_add(\"a\", \"doc-a\", \"contrato de a\")\n    p.vector_add(\"b\", \"doc-b\", \"contrato de b\")\n    return p\n\n\ndef _nega(fn):\n    try:\n        fn()\n    except TenantNegado:\n        return True\n    return False\n\n\ndef test_mesma_chave_em_tenants_diferentes():\n    p = _montar()\n    assert p.cache_get(\"a\", \"same-key\") == \"cache-A\"\n    assert p.cache_get(\"b\", \"same-key\") == \"cache-B\"\n\n\ndef test_busca_vetorial_nao_lista_outro_tenant():\n    p = _montar()\n    assert p.vector_search(\"a\", \"contrato\") == [\"doc-a\"]\n    assert p.vector_search(\"b\", \"contrato\") == [\"doc-b\"]\n\n\ndef test_sem_tenant_nega_em_vez_de_listar_tudo():\n    p = _montar()\n    assert _nega(lambda: p.vector_search(\"\", \"contrato\"))\n    assert _nega(lambda: p.cache_get(None, \"same-key\"))\n    assert _nega(lambda: p.cache_put(\"\", \"k\", \"v\"))\n\n\ndef test_delete_tenant_preserva_o_outro():\n    p = _montar()\n    assert p.delete_tenant(\"a\") == 2\n    assert p.cache_get(\"a\", \"same-key\") is None\n    assert p.vector_search(\"a\", \"contrato\") == []\n    assert p.cache_get(\"b\", \"same-key\") == \"cache-B\"\n    assert p.vector_search(\"b\", \"contrato\") == [\"doc-b\"]\n\n\ndef test_controle_negativo_chave_ausente():\n    p = _montar()\n    assert p.cache_get(\"a\", \"outra\") is None\n",
          dica: 'Levante <code>TenantNegado</code> em <code>_exigir</code> quando <code>tenant</code> for falso; use a tupla <code>(tenant, key)</code> como chave; na busca compare o tenant do documento; em <code>delete_tenant</code> some as chaves do cache com <code>k[0] == tenant</code> e os documentos removidos.',
          solucao: "class TenantNegado(Exception):\n    pass\n\n\nclass TenantPlanes:\n    def __init__(self):\n        self._cache = {}\n        self._docs = []\n\n    def _exigir(self, tenant):\n        if not tenant:\n            raise TenantNegado(\"sem tenant no contexto\")\n        return tenant\n\n    def _chave(self, tenant, key):\n        return (tenant, key)\n\n    def cache_put(self, tenant, key, value):\n        self._cache[self._chave(self._exigir(tenant), key)] = value\n\n    def cache_get(self, tenant, key):\n        return self._cache.get(self._chave(self._exigir(tenant), key))\n\n    def vector_add(self, tenant, doc_id, texto):\n        self._docs.append((self._exigir(tenant), doc_id, texto))\n\n    def vector_search(self, tenant, consulta):\n        self._exigir(tenant)\n        return [d for (ten, d, t) in self._docs if ten == tenant and consulta in t]\n\n    def delete_tenant(self, tenant):\n        self._exigir(tenant)\n        chaves = [k for k in self._cache if k[0] == tenant]\n        for k in chaves:\n            del self._cache[k]\n        antes = len(self._docs)\n        self._docs = [d for d in self._docs if d[0] != tenant]\n        return len(chaves) + (antes - len(self._docs))\n",
          tutorDepois: 'O fake prova o contrato, não o provedor: o serviço real de vetores ou cache precisa do mesmo teste negativo, com o filtro nativo dele.',
          callout: 'Cada data plane negou o cruzamento e a ausência de tenant em vez de listar tudo.' },
        { tipo: 'transcript', id: 'b4-transcript', titulo: 'Ache a afirmação sem sustentação', obrigatorio: false, terminalTitulo: 'revisão do pool',
          enunciado: 'A conexão 7 do pool atendeu o tenant A e depois o B. Uma das afirmações do agente é contrariada pelo que a ferramenta mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Revise o isolamento: a conexão 7 atendeu o tenant A e, depois, o tenant B.' },
            { quem: 'agente', texto: "A aplicação abre a transação e executa set_config('app.tenant_id', 'uuid-a', false) antes das consultas do A." },
            { quem: 'ferramenta', texto: "-- tenant B recebe a conexão 7, antes de fixar o próprio contexto\nSELECT current_setting('app.tenant_id', true);\n'uuid-a'" },
            { quem: 'agente', texto: 'Isso é esperado: o contexto some no COMMIT, então o tenant B nunca enxerga estado do A.' },
            { quem: 'ferramenta', texto: 'SELECT count(*) FROM projects;  -- sessão do tenant B\n2   (linhas do tenant A)' },
            { quem: 'agente', texto: 'Correção: usar escopo local à transação (terceiro argumento true) e cobrir a reutilização A→B com uma suíte que faz rollback.' }
          ],
          erradas: [3],
          explicacao: { 3: 'o terceiro argumento <code>false</code> deu escopo de <em>sessão</em>, que sobrevive ao COMMIT e à devolução ao pool; a própria saída da ferramenta mostra <code>uuid-a</code> na conexão do tenant B. Só o escopo local (<code>true</code>) some com a transação.' },
          tutorDepois: 'A evidência é a saída da ferramenta, não a explicação do agente.' },
        { tipo: 'takeaway', html: 'O <mark>tenant compõe a chave</mark> de cada data plane, e a ausência dele <mark>nega</mark> em vez de listar tudo.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>O que prova que o isolamento segurou</h3>' +
          '<p>O oráculo nunca é “a aplicação filtrou corretamente”; é “o banco e cada data plane negaram o acesso cruzado mesmo com a aplicação errando”. <strong>M12-AT-010</strong> fecha quando a consulta sem filtro retorna só o tenant corrente (e zero linhas sem contexto). <strong>M12-AT-011</strong> fecha quando inserção ou atualização com tenant alheio é negada pelo <code>WITH CHECK</code>.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sintoma</th><th>Hipótese</th><th>Evidência</th><th>Correção</th></tr></thead><tbody>' +
          '<tr><td>Consulta sem filtro lista todos os tenants</td><td>RLS ausente ou papel com fuga</td><td>Política não aplicada; papel dono ou com <code>BYPASSRLS</code></td><td>Papel sem bypass, sem propriedade, tabela com <code>FORCE ROW LEVEL SECURITY</code></td></tr>' +
          '<tr><td>Escrita com tenant alheio passa</td><td><code>WITH CHECK</code> ausente ou tenant vindo do argumento</td><td>Linha gravada com tenant divergente do contexto</td><td>Comparar o tenant da linha com o contexto da transação e negar</td></tr>' +
          '<tr><td>Tenant B enxerga dados do A</td><td>Contexto de sessão vazou no pool</td><td>Mesma conexão servindo A→B sem redefinir contexto</td><td>Contexto local à transação; suíte de reutilização A→B com rollback</td></tr>' +
          '<tr><td>Cache ou busca vetorial mistura tenants</td><td>Chave ou filtro sem tenant</td><td>Mesma chave devolve valor do outro tenant</td><td>Tenant compõe chave, metadado, prefixo e fila; busca sem filtro nega</td></tr>' +
          '<tr><td>Telemetria identifica o tenant errado</td><td>Atributo com dado sensível ou sem escopo</td><td>Identificador real ou ausente no span</td><td>Identificador opaco por tenant e controle de acesso ao backend</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Perigo', html:
          '<p>Filtro apenas na aplicação e tenant lido do argumento não fecham M12-AT-010 nem M12-AT-011: um <code>WHERE</code> esquecido ou um identificador adulterado vaza ou grava no tenant alheio. A fronteira é política no banco com negação padrão mais contexto por transação. O fake em memória prova o contrato, nunca o banco real.</p>' },
        { tipo: 'abas', rotulo: 'Ponte para o laboratório (contratos congelados de B04-L)', itens: [
          { rotulo: 'Contratos', blocos: [
            { tipo: 'texto', largo: true, html:
              '<table><thead><tr><th>Contrato</th><th>O que os testes exercem</th></tr></thead><tbody>' +
              '<tr><td><code>TenantContext(tenant_id)</code>, <code>VectorDocument(document_id, text)</code>, <code>DeletionReport(tenant_id, removed_by_store, active_records_remaining, backups_expire_at)</code></td><td>Contexto criado pela aplicação; relatório de exclusão</td></tr>' +
              '<tr><td><code>TenantDataPlanes</code>: <code>cache_put/get</code>, <code>object_put/get</code>, <code>vector_add/search</code>, <code>graph_add_edge/graph_edges</code>, <code>enqueue/dequeue</code>, <code>delete_tenant(context, *, now, backup_retention)</code>, <code>count_tenant_records</code></td><td>Cada operação só enxerga o tenant do contexto; a exclusão limpa os cinco stores ativos sem tocar no outro tenant</td></tr>' +
              '<tr><td>SQL RLS de referência na migração do laboratório</td><td>Papéis sem bypass; <code>USING</code> e <code>WITH CHECK</code> comparando com o contexto da transação</td></tr>' +
              '</tbody></table>' +
              '<p class="ta-nota">Contagens e prazos dos exemplos são variáveis.</p>' }] },
          { rotulo: 'Limites declarados', blocos: [
            { tipo: 'callout', tom: 'neutral', html:
              '<p>Pertencem à trilha com banco real e não são alegados aqui: a prova em PostgreSQL real, a asserção de catálogos de papéis e tabelas (M12-AT-012), a reutilização A→B em pool e nos demais planes (M12-AT-013 e M12-AT-014) e os filtros nativos de cada provedor. Fontes (baseline de 14/08/2026): PostgreSQL 18, Row Security Policies e System Administration Functions (<code>set_config</code>, <code>current_setting</code>); risco de obsolescência médio.</p>' }] }
        ] },
        { tipo: 'escolha', id: 'b4-esc-where', titulo: 'Confira: o WHERE que todos lembram',
          pergunta: 'A aplicação filtra tenant com WHERE em todas as consultas existentes. Por que isso ainda não fecha o isolamento?',
          opcoes: [
            { id: 'a', texto: 'Porque WHERE é lento demais em tabelas grandes.', correta: false, porque: 'o problema não é desempenho.' },
            { id: 'b', texto: 'Porque basta uma consulta nova sem o filtro, ou um tenant lido de argumento do chamador, para vazar; RLS no banco torna a negação padrão.', correta: true, porque: 'filtro na aplicação depende de lembrar sempre; RLS anexa a regra à tabela e o tenant vem do contexto da transação.' },
            { id: 'c', texto: 'Porque o PostgreSQL ignora o WHERE quando há RLS.', correta: false, porque: 'o WHERE continua valendo; ele só não é a barreira que impede o vazamento.' },
            { id: 'd', texto: 'Porque o tenant não pode ser uma string.', correta: false, porque: 'o tipo não é a questão; é de onde o valor vem.' }
          ], tutorDepois: 'Se o isolamento depende de lembrar, cada caminho novo é um vazamento futuro.' },
        { tipo: 'escolha', id: 'b4-esc-pool', titulo: 'Confira: a conexão que volta ao pool',
          pergunta: 'A conexão usada para o tenant A volta ao pool e é usada para o tenant B. Qual o risco e o conserto?',
          opcoes: [
            { id: 'a', texto: 'Nenhum: o RLS reaplica o tenant sozinho.', correta: false, porque: 'o RLS compara com o contexto que existir; se o contexto da sessão sobrou, a política o usa.' },
            { id: 'b', texto: 'O contexto do tenant anterior pode vazar; defina o tenant com escopo local à transação e teste a reutilização A→B.', correta: true, porque: 'estado de sessão persiste na conexão; configuração local some no commit ou rollback.' },
            { id: 'c', texto: 'Só desempenho: evite o pool.', correta: false, porque: 'o risco é de isolamento, e abrir mão do pool não é o conserto do projeto.' }
          ], tutorDepois: 'Cache e busca vetorial também precisam do tenant na chave ou no filtro.' },
        { tipo: 'takeaway', html: 'M12-AT-010 e M12-AT-011 fecham <mark>no banco</mark>; o fake prova o contrato, e só a <mark>trilha real</mark> prova o provedor.' }
      ] }
    ]
  });
})();
