/* M08 · Bloco 3: design de ferramentas. Fonte: M08.html#b03. Fontes verificadas em 14/09/2026 (Anthropic, building effective agents; 12-Factor Agents). Saídas de terminal são exemplos ilustrativos com modelo fake. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var CMD = 'python chamar.py repo_ler_arquivo servicos/pagto_svc.py';
  var etapasChamada = function () {
    return [
      { id: 'chamada', nome: 'Chamada', descricao: 'O agente pede um arquivo', tom: 'dns', ms: 1, linhas: [
        L('cmd', CMD),
        L('info', 'agente: preciso ler servicos/pagto_svc.py para achar quem calcula os juros'),
        L('hint', 'o caminho tem um erro de grafia: o arquivo real é services/pagamento_svc.py')] },
      { id: 'retorno', nome: 'Retorno da ferramenta', descricao: 'O que volta para a janela', tom: 'request', ms: 1, linhas: [
        L('out', "ERRO: 'servicos/pagto_svc.py' não existe. Caminhos parecidos: ['services/pagamento_svc.py']. Use repo_buscar_simbolo para localizar."),
        L('hint', 'o que aconteceu, por quê e o que fazer agora')] },
      { id: 'proximo', nome: 'Próxima decisão', descricao: 'O agente corrige no passo seguinte', tom: 'ink', ms: 1, linhas: [
        L('in', 'agente: usando o caminho sugerido, repo_ler_arquivo("services/pagamento_svc.py", formato="conciso")'),
        L('hint', 'um passo para corrigir, sem tentativa e erro')] }
    ];
  };

  var codigoPaginar = [
    'def paginar(itens, pagina=1, tamanho=20):',
    '    """Devolve a página pedida (1 = primeira) com total e tem_mais, ou um erro que ensina."""',
    '    # tamanho acima de 50 -> {"erro": "ERRO: limite máximo é 50 (você pediu N). Refaça com limite=50 ..."}',
    '    # página fora do intervalo -> erro que diz quantas páginas existem',
    '    return {"itens": itens}', '', '',
    'def avisar_truncamento(linhas_total, linhas_vistas, ferramenta="repo_ler_arquivo"):',
    '    """Aviso que ensina o próximo passo, ou None se nada foi cortado."""',
    '    return None', '', '',
    'print(paginar(list(range(340)), 1, 20)["total"], avisar_truncamento(3800, 80))', ''].join('\n');
  var testesPaginar = [
    'def test_primeira_pagina_com_total_e_tem_mais():',
    '    r = paginar(list(range(340)), 1, 20)',
    '    assert r["itens"] == list(range(20))',
    '    assert r["total"] == 340 and r["pagina"] == 1 and r["tem_mais"] is True', '', '',
    'def test_ultima_pagina_nao_tem_mais():',
    '    r = paginar(list(range(45)), 3, 20)',
    '    assert r["itens"] == list(range(40, 45)) and r["tem_mais"] is False', '', '',
    'def test_limite_acima_do_maximo_ensina():',
    '    r = paginar(list(range(10)), 1, 200)',
    '    assert "limite máximo é 50" in r["erro"] and "200" in r["erro"] and "limite=50" in r["erro"]', '', '',
    'def test_pagina_fora_do_intervalo_diz_quantas_existem():',
    '    r = paginar(list(range(45)), 9, 20)',
    '    assert "erro" in r and "3" in r["erro"]', '', '',
    'def test_lista_vazia_nao_devolve_silencio():',
    '    r = paginar([], 1, 20)',
    '    assert r["itens"] == [] and r["total"] == 0 and r["tem_mais"] is False', '', '',
    'def test_aviso_de_truncamento_ensina_o_proximo_passo():',
    '    aviso = avisar_truncamento(3800, 80)',
    '    assert aviso.startswith("[TRUNCADO") and "linha_ini" in aviso and "linha_fim" in aviso and "80" in aviso', '', '',
    'def test_sem_corte_sem_aviso():',
    '    assert avisar_truncamento(60, 60) is None', ''].join('\n');
  var solucaoPaginar = [
    'def paginar(itens, pagina=1, tamanho=20):',
    '    if tamanho > 50:',
    '        return {"erro": "ERRO: limite máximo é 50 (você pediu %d). Refaça com limite=50 e use pagina=2 para os próximos." % tamanho}',
    '    total = len(itens)',
    '    paginas = max(1, -(-total // tamanho))',
    '    if pagina < 1 or pagina > paginas:',
    '        return {"erro": "ERRO: a página %d não existe; há %d página(s) de %d itens." % (pagina, paginas, tamanho)}',
    '    ini = (pagina - 1) * tamanho',
    '    return {"itens": itens[ini:ini + tamanho], "total": total, "pagina": pagina, "tem_mais": ini + tamanho < total}', '', '',
    'def avisar_truncamento(linhas_total, linhas_vistas, ferramenta="repo_ler_arquivo"):',
    '    if linhas_vistas >= linhas_total:', '        return None',
    '    return "[TRUNCADO em %d linhas - peça um trecho com %s(caminho, linha_ini, linha_fim)]" % (linhas_vistas, ferramenta)', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm08-b3',
    titulo: 'Design de ferramentas: API para um leitor literal',
    minutos: 35,
    resumo: 'A qualidade de um agente é limitada pela qualidade das suas ferramentas. Poucas, com namespace, retorno significativo, economia de tokens, descrição como prompt e erro que ensina.',
    objetivo: 'Desenhar e avaliar ferramentas de agente: nomes, descrição "use quando / não use quando", retorno com total e truncamento avisado, erro acionável e escopo vindo do runtime.',
    revisao: [
      { id: 'm08b3-poucas', pergunta: 'Qual é a faixa prática de número de ferramentas, segundo o bloco?',
        opcoes: [
          opc('a', '5 a 8 é confortável; acima de cerca de 15 a precisão de escolha degrada e convém agrupar por domínio ou delegar a subagentes', true, 'mais ferramentas pioram a seleção; construa ferramentas para fluxos de trabalho reais, não para cada endpoint.'),
          opc('b', 'Uma ferramenta por endpoint da API', false, 'é o anti-padrão que o bloco combate.'),
          opc('c', 'Quanto mais ferramentas, melhor o resultado', false, 'mais ferramentas pioram a seleção.')] },
      { id: 'm08b3-id', pergunta: 'Sua ferramenta devolve apenas {"chunk_id": "8f3a-91bc-..."}. Qual é o defeito?',
        opcoes: [
          opc('a', 'Obriga o agente a gastar outro passo para descobrir o que é aquilo: devolva caminho, símbolo, linhas e um trecho (e o id só se for usado numa chamada seguinte)', true, 'ferramenta é API para um leitor literal que não pode fazer perguntas; quando o id é necessário, devolva os dois.'),
          opc('b', 'UUIDs são lentos', false, 'não é questão de velocidade.'),
          opc('c', 'O JSON deveria ser XML', false, 'o formato não é o problema.')] },
      { id: 'm08b3-erro', pergunta: 'Quais são as três partes de um erro que ensina?',
        opcoes: [
          opc('a', 'O que aconteceu, por quê e o que fazer agora', true, 'cada passo de tentativa e erro economizado é token, latência e menos risco de o agente se perder.'),
          opc('b', 'Stack trace, código de erro e timestamp', false, 'o stack trace entra na janela e não diz o próximo passo.'),
          opc('c', 'Pedido de desculpas, causa e nova tentativa automática', false, 'a causa e a ação ajudam; o resto é ruído.')] },
      { id: 'm08b3-trunc', pergunta: 'Como truncar a resposta de uma ferramenta?',
        opcoes: [
          opc('a', 'Com aviso que ensina o próximo passo, nunca em silêncio, e com total e paginação explícitos', true, 'sem total o agente não sabe se viu tudo; o aviso diz como pedir o trecho que falta.'),
          opc('b', 'Em silêncio, para não gastar tokens com o aviso', false, 'o corte silencioso faz o agente concluir sobre dado incompleto.'),
          opc('c', 'Nunca truncar: devolver tudo', false, 'o texto entra na janela e é reenviado a cada passo seguinte.')] },
      { id: 'm08b3-escopo', pergunta: 'De onde deve vir o escopo (tenant, repositório) de uma ferramenta?',
        opcoes: [
          opc('a', 'Do runtime, nunca de um argumento que o modelo preenche', true, 'argumento vindo do modelo é dado não confiável; a ferramenta é a fronteira de capacidade do agente.'),
          opc('b', 'De um argumento tenant que o modelo preenche', false, 'o modelo pode errar ou ser induzido a preencher outro escopo.'),
          opc('c', 'Do prompt de sistema, em texto livre', false, 'texto livre não é fronteira de segurança.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>A qualidade de um agente é limitada pela qualidade das suas ferramentas, mais do que pelo modelo. Um agente com ferramentas bem desenhadas resolve em 3 passos o que um com ferramentas ruins não resolve em 15. E, diferente de prompt, ferramenta é código que você controla inteiramente: é a alavanca de melhoria mais determinística do sistema.</p>' +
          '<h3>API para um consumidor peculiar</h3>' +
          '<p>Você está publicando uma API para um consumidor que lê a documentação inteira toda vez (bom), não pode fazer perguntas (ruim), segue a descrição literalmente (bom e ruim) e paga por token na resposta (novo). Valem todas as regras de API pública (nomes claros, contrato estável, erro acionável, paginação), com pesos diferentes. O teste continua o de sempre: um dev novo, lendo só a assinatura e a descrição, usaria isso corretamente na primeira tentativa?</p>' },
        { tipo: 'abas', rotulo: 'Princípio', itens: [
          { rotulo: '1 · Poucas', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Poucas ferramentas, de alto impacto.</strong> Mais ferramentas não melhoram o resultado: pioram a seleção. Não envolva cada endpoint numa ferramenta; construa ferramentas para fluxos de trabalho reais. Uma <code>buscar_e_ler_contexto(simbolo)</code> que faz o que o agente sempre faz em dois passos vale mais que as duas separadas.</p>' +
              '<p>Regra prática: 5 a 8 ferramentas é confortável; acima de cerca de 15 a precisão de escolha degrada, e é hora de agrupar por domínio ou delegar a subagentes (bloco 6).</p>' }
          ] },
          { rotulo: '2 · Namespace', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Namespacing.</strong> Prefixe por domínio: <code>repo_buscar_simbolo</code>, <code>repo_ler_arquivo</code>, <code>grafo_referencias_de</code>, <code>relatorio_salvar</code>. Quando o catálogo cresce (e cresce quando você conecta MCPs de terceiros, no M09), o prefixo impede o agente de confundir <code>buscar</code> do seu repositório com <code>buscar</code> do Jira. É a mesma razão de existirem namespaces em código.</p>' }
          ] },
          { rotulo: '3 · Retorno', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Retornar contexto significativo, não identificadores.</strong> Devolver <code>{"chunk_id": "8f3a-91bc-..."}</code> obriga o agente a gastar outro passo para descobrir o que é aquilo. Devolva o que é útil para a próxima decisão: caminho, símbolo, linhas, um trecho. Prefira nomes humanos a UUIDs quando o identificador não for necessário numa chamada seguinte, e, quando for, devolva os dois.</p>' }
          ] },
          { rotulo: '4 · Tokens', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Economia de tokens.</strong> Toda resposta de ferramenta entra na janela e é reenviada em todos os passos seguintes (M05, bloco 3, onde você mediu isso). Portanto:</p>' +
              '<ul><li><strong>Truncar com aviso, nunca em silêncio:</strong> <code>[TRUNCADO em 20k chars - peça um trecho específico com ler_arquivo(caminho, linha_ini, linha_fim)]</code>. O aviso ensina o próximo passo.</li>' +
              '<li><strong>Paginação explícita:</strong> <code>{"itens": [...], "total": 340, "pagina": 1, "tem_mais": true}</code>. Sem total, o agente não sabe se viu tudo.</li>' +
              '<li><strong>Filtro na origem:</strong> parâmetros que reduzem o resultado (<code>tipo</code>, <code>limite</code>, <code>apenas_producao</code>) valem mais que devolver tudo.</li>' +
              '<li><strong>Nível de detalhe como parâmetro:</strong> <code>formato: "conciso" | "completo"</code> deixa o agente escolher, e o padrão deve ser conciso.</li></ul>' }
          ] },
          { rotulo: '5 · Descrição', blocos: [
            { tipo: 'texto', html:
              '<p><strong>Descrição é prompt engineering.</strong> A descrição e os nomes dos parâmetros são o único material que o modelo tem para decidir. Escreva-os como explicaria a um colega novo: o que a ferramenta faz, quando usá-la, quando não usá-la e o que devolve. Ambiguidade em nome de parâmetro (<code>id</code>: id de quê?) é a causa mais comum de chamada errada.</p>' }
          ] }
        ] },
        { tipo: 'takeaway', html: 'Ferramenta é <mark>API para um leitor literal</mark> que não pergunta e <mark>paga por token</mark>: poucas, nomeadas, com retorno que serve à próxima decisão.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Uma ferramenta do agente investigador</h3>' +
          '<p>O argumento é validado por Pydantic e a descrição diz quando usar e quando não usar.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '# services/agent/tools/repo.py',
          '"""Ferramentas do agente investigador. Cada uma é API pública para o modelo."""',
          'from __future__ import annotations',
          'from pydantic import BaseModel, Field',
          '',
          'class BuscarSimboloIn(BaseModel):',
          '    """Argumentos de repo_buscar_simbolo."""',
          '    simbolo: str = Field(',
          '        description="Nome EXATO de classe, método, tabela ou constante. "',
          '        "Não use frases nem descrições: para busca conceitual use repo_buscar_conceito.",',
          '        min_length=2,',
          '        max_length=120,',
          '    )',
          '    tipo: str | None = Field(',
          '        default=None,',
          '        description="Filtra por tipo: classe | metodo | tabela | config. Omita para buscar em todos.",',
          '    )',
          '    limite: int = Field(default=20, ge=1, le=50, description="Máximo de ocorrências.")',
          '',
          'DESCRICAO = """Localiza onde um identificador aparece no repositório analisado.',
          'Use quando: você tem o nome exato de uma classe, método, tabela ou constante e',
          'precisa saber onde ele é definido e onde é usado.',
          'NÃO use quando: a pergunta é conceitual ("como funciona a autenticação") -',
          'nesse caso use repo_buscar_conceito, que faz busca semântica.',
          'Devolve: lista de ocorrências com caminho, linha, o trecho da linha e se a',
          'ocorrência é a DEFINIÇÃO ou um USO. Ordenado com definições primeiro."""'].join('\n') },
        { tipo: 'texto', html:
          '<h3>Erros que ensinam</h3>' +
          '<p>Retorno de erro é interface, e é o fator 9 do M01 (erros compactos e acionáveis) aplicado à ferramenta.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Erro ruim</th><th>Erro que ensina</th></tr></thead><tbody>' +
          '<tr><td><code>FileNotFoundError: [Errno 2] ...</code> mais stack trace</td><td><code>ERRO: \'servicos/pagto_svc.py\' não existe. Caminhos parecidos: [\'services/pagamento_svc.py\']. Use repo_buscar_simbolo para localizar.</code></td></tr>' +
          '<tr><td><code>ValidationError: limite &gt; 50</code></td><td><code>ERRO: limite máximo é 50 (você pediu 200). Refaça com limite=50 e use pagina=2 para os próximos.</code></td></tr>' +
          '<tr><td><code>[]</code> (lista vazia, sem explicação)</td><td><code>Nenhuma ocorrência de \'calcula_juros\'. Verifique a grafia ou tente um nome parcial (\'juros\').</code></td></tr>' +
          '</tbody></table>' +
          '<p>Os três da direita têm a mesma estrutura: o que aconteceu, por quê e o que fazer agora. Cada um economiza um ou dois passos de tentativa e erro, e passo economizado é token, latência e menos risco de o agente se perder.</p>' },
        { tipo: 'quebre', id: 'ferramenta-quebre', titulo: 'Troque o retorno da ferramenta',
          enunciado: 'Escolha um retorno pior, rode e compare com o retorno que ensina. Rode "Sem falha" para fechar. Saídas de exemplo ilustrativo, com modelo fake.',
          prefixo: '$', entrada: CMD, unidade: 'passo', terminalTitulo: 'repo_ler_arquivo', etapas: etapasChamada(),
          prever: { pergunta: 'A ferramenta devolve "ERRO: \'servicos/pagto_svc.py\' não existe. Caminhos parecidos: [...]". Quantos passos o agente gasta para corrigir o caminho?', opcoes: [
            { id: 'a', texto: 'Um: o erro já traz o caminho parecido e a ferramenta para localizar.', correta: true, porque: 'erro que ensina diz o que houve, por quê e o que fazer: o agente corrige na chamada seguinte.' },
            { id: 'b', texto: 'Vários: ele precisa adivinhar a grafia.', correta: false, porque: 'isso é o que acontece com o stack trace, não com o erro acionável.' },
            { id: 'c', texto: 'Nenhum: o agente nunca erra caminho.', correta: false, porque: 'o agente erra grafia como qualquer cliente.' }
          ] },
          falhas: [
            { id: 'trace', rotulo: 'Devolver o stack trace', efeito: { etapaFalha: 'retorno', linhasErro: [
              L('out', 'FileNotFoundError: [Errno 2] No such file or directory: \'servicos/pagto_svc.py\''),
              L('out', 'Traceback (most recent call last): ... (28 linhas de pilha interna)'),
              L('hint', 'o texto entra na janela e é reenviado nos passos seguintes, sem dizer o que fazer')
            ], tutor: 'o agente não sabe se errou a grafia ou se o arquivo não existe, e carrega a pilha em cada passo.' } },
            { id: 'vazia', rotulo: 'Devolver lista vazia', efeito: { etapaFalha: 'retorno', linhasErro: [
              L('out', '[]'),
              L('hint', 'sem explicação: ausência de dado ou erro de grafia?')
            ], tutor: 'lista vazia sem explicação é o pior: o modelo pode concluir que o símbolo não existe e responder com base nisso.' } },
            { id: 'tudo', rotulo: 'Devolver o arquivo inteiro', efeito: { etapaFalha: 'retorno', linhasErro: [
              L('out', '# repo_ler_arquivo("services/pagamento_svc.py")'),
              L('out', '[... 3.800 linhas coladas ...]'),
              L('hint', 'custo: ~45.000 tokens por passo, daqui para a frente')
            ], tutor: 'sem total, sem truncamento e sem pista de próximo passo: o agente não sabe se viu tudo e o contexto morre antes da resposta.' } }
          ],
          tutorAntes: 'Aperte Enter com o retorno que ensina, depois escolha cada falha e compare.',
          tutorDepois: 'O retorno bom tem truncamento avisado, total, paginação e nível de detalhe como parâmetro.',
          callout: 'Você comparou três retornos ruins com o que ensina.' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          '# repo_ler_arquivo("services/pagamento_svc.py", formato="conciso")',
          '{',
          '  "itens": ["class PagamentoSvc ... (linhas 1-80)"],',
          '  "total_linhas": 3800,',
          '  "pagina": 1,',
          '  "tem_mais": true,',
          '  "aviso": "[TRUNCADO em 80 linhas - peça um trecho com repo_ler_arquivo(caminho, linha_ini, linha_fim)]"',
          '}'].join('\n') },
        { tipo: 'takeaway', html: 'Erro bom diz <mark>o que aconteceu, por quê e o que fazer agora</mark>; resposta grande vem <mark>truncada com aviso</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'paginar-python', titulo: 'Paginação e truncamento que ensinam', obrigatorio: false,
          enunciado: 'Complete <code>paginar(itens, pagina, tamanho)</code>: devolva <code>itens</code>, <code>total</code>, <code>pagina</code> e <code>tem_mais</code>; se <code>tamanho</code> passar de 50, devolva <code>{"erro": ...}</code> com o texto "ERRO: limite máximo é 50 (você pediu N). Refaça com limite=50 ..."; se a página não existir, o erro diz quantas há. Complete também <code>avisar_truncamento</code>, que devolve o aviso <code>[TRUNCADO em N linhas - peça um trecho com ...(caminho, linha_ini, linha_fim)]</code> ou <code>None</code> quando nada foi cortado.',
          codigo: codigoPaginar, testes: testesPaginar,
          dica: 'Número de páginas = teto de <code>total / tamanho</code> (use <code>-(-total // tamanho)</code>), com mínimo 1 para a lista vazia. <code>tem_mais</code> é <code>ini + tamanho &lt; total</code>.',
          solucao: solucaoPaginar,
          tutorDepois: 'Lista vazia devolve total 0 e tem_mais falso: é uma resposta explícita, não silêncio. E cada erro diz o que fazer em seguida.',
          callout: 'Total, tem_mais, erro acionável e aviso de truncamento: o contrato de um retorno que ensina.' },
        { tipo: 'complete', id: 'desc-complete', titulo: 'Monte a descrição da ferramenta', linguagem: 'python',
          enunciado: 'Escolha, em cada lacuna, o trecho que dá ao modelo o que ele precisa para decidir quando usar a ferramenta.',
          partes: [
            'class LerArquivoIn(BaseModel):\n    caminho: str = Field(description="',
            { lacuna: 'caminho', opcoes: ['Caminho relativo à raiz do repositório analisado, como retornado por repo_buscar_simbolo.', 'id', 'O arquivo.'], correta: 'Caminho relativo à raiz do repositório analisado, como retornado por repo_buscar_simbolo.' },
            '")\n    formato: str = Field(default="',
            { lacuna: 'formato', opcoes: ['conciso', 'completo', 'tudo'], correta: 'conciso' },
            '", description="conciso | completo. Comece pelo conciso.")\n\nDESCRICAO = """Lê um trecho de arquivo do repositório.\nUse quando: você já sabe o caminho. ',
            { lacuna: 'naouse', opcoes: ['NÃO use quando: só tem um nome de símbolo (use repo_buscar_simbolo).', 'Sirva para qualquer busca.', 'Evite usar sempre que possível.'], correta: 'NÃO use quando: só tem um nome de símbolo (use repo_buscar_simbolo).' },
            '\nDevolve: ',
            { lacuna: 'devolve', opcoes: ['itens, total_linhas, pagina, tem_mais e aviso de truncamento.', 'um identificador do trecho.', 'o arquivo inteiro, sempre.'], correta: 'itens, total_linhas, pagina, tem_mais e aviso de truncamento.' },
            '"""\n'
          ],
          explicacao: 'O nome do parâmetro diz de onde vem o caminho; o padrão é conciso; a descrição diz quando usar, quando não usar e o que devolve, que é todo o material que o modelo tem para decidir.',
          callout: 'Descrição escrita como prompt: quando usar, quando não usar e o que devolve.' },
        { tipo: 'transcript', id: 'ferramenta-transcript', titulo: 'Ache a conclusão sem sustentação', obrigatorio: false, terminalTitulo: 'sessão investigadora',
          enunciado: 'Leia a sessão. O agente tira uma conclusão que a ferramenta não sustenta. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Onde é calculado o juros de mora?' },
            { quem: 'agente', texto: 'Vou buscar pelo conceito usando a ferramenta de símbolo.' },
            { quem: 'ferramenta', texto: 'repo_buscar_simbolo("como é calculado o juros de mora")\n[]' },
            { quem: 'agente', texto: 'A lista veio vazia, então o cálculo de juros de mora não existe neste repositório.' },
            { quem: 'voce', texto: 'Confere de novo.' }
          ],
          erradas: [3],
          explicacao: { 3: 'a lista vazia sem explicação não distingue "não existe" de "usei a ferramenta errada": a ferramenta de símbolo exige nome exato, e a pergunta era conceitual (repo_buscar_conceito). Uma ferramenta que devolvesse "Nenhuma ocorrência de ... tente um nome parcial" ou rejeitasse frases evitaria a conclusão errada.' },
          callout: 'Você achou o ponto em que uma ferramenta muda levou a uma conclusão falsa.' },
        { tipo: 'takeaway', html: 'Em <mark>ferramenta de escrita</mark>, pense na chamada <mark>repetida</mark>; em ferramenta de leitura, no <mark>tamanho do retorno</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Contratos, acoplamento e menor espanto</h3>' +
          '<ul><li><strong>Menor espanto.</strong> A ferramenta faz exatamente o que o nome promete, nem mais. Uma <code>ler_arquivo</code> que cria o arquivo se não existir é armadilha para humano e catástrofe para agente, que não desconfia.</li>' +
          '<li><strong>Interface segregation.</strong> Ferramenta que faz cinco coisas conforme um parâmetro <code>modo</code> é cinco ferramentas mal disfarçadas, e o modelo erra o modo.</li>' +
          '<li><strong>Contrato e compatibilidade (M03, bloco 1).</strong> Mudar o formato de retorno é breaking change para o agente como é para um cliente HTTP, só que a quebra aparece como queda de qualidade, não como erro 500. Versione o comportamento e cubra com eval.</li>' +
          '<li><strong>Idempotência e reversibilidade (M01, bloco 3; M12).</strong> Para toda ferramenta que muda estado: o que acontece se o modelo chamar isto duas vezes? Leitura: à vontade. Escrita: chave de idempotência. Irreversível: aprovação humana, sempre.</li>' +
          '<li><strong>Menor privilégio (M07, bloco 6).</strong> A ferramenta é a fronteira de capacidade do agente: recebe o escopo (tenant, repositório) do runtime, nunca de um argumento que o modelo preenche, porque argumento vindo do modelo é dado não confiável.</li></ul>' +
          '<h3>Avaliar ferramentas</h3>' +
          '<p>Ferramentas também têm eval. Crie tarefas inspiradas em uso real, que exijam várias chamadas encadeadas, e meça por execução: acurácia da resposta final, número de chamadas, tokens, tempo e erros de ferramenta. Depois, leia os transcripts com o modelo: peça que ele analise as próprias execuções e aponte onde a descrição foi ambígua ou onde faltou uma ferramenta. O que o agente não fez costuma ser mais informativo que o que ele fez.</p>' },
        { tipo: 'escolha', id: 'conf-chunk', titulo: 'Confira: o identificador opaco',
          pergunta: 'Sua ferramenta devolve {"chunk_id": "8f3a-91bc-..."}. Qual é o defeito de design?',
          opcoes: [
            { id: 'a', texto: 'Obriga o agente a gastar outro passo para descobrir o que é aquilo: devolva caminho, símbolo, linhas e um trecho (e o id só se for usado numa chamada seguinte).', correta: true, porque: 'ferramenta é API para um leitor literal que não pergunta e paga por token; quando o id é necessário, devolva os dois.' },
            { id: 'b', texto: 'UUIDs são lentos.', correta: false, porque: 'a velocidade do id não é o problema.' },
            { id: 'c', texto: 'O JSON deveria ser XML.', correta: false, porque: 'o formato de serialização não muda o defeito.' },
            { id: 'd', texto: 'Nenhum: identificadores estáveis são sempre preferíveis.', correta: false, porque: 'preferíveis só quando necessários para uma chamada seguinte; fora isso, nomes humanos.' }
          ] },
        { tipo: 'escolha', id: 'conf-erro', titulo: 'Confira: qual erro ensina',
          pergunta: 'Qual retorno de erro "ensina" o agente?',
          opcoes: [
            { id: 'a', texto: 'Stack trace completo do FileNotFoundError.', correta: false, porque: 'diz o que aconteceu na pilha, não o que fazer.' },
            { id: 'b', texto: 'Lista vazia, sem explicação.', correta: false, porque: 'o pior caso: não distingue grafia errada de inexistência.' },
            { id: 'c', texto: '"ERRO: \'servicos/pagto_svc.py\' não existe. Caminhos parecidos: [\'services/pagamento_svc.py\']. Use repo_buscar_simbolo para localizar."', correta: true, porque: 'tem as três partes: o que aconteceu, por quê e o que fazer agora.' },
            { id: 'd', texto: '"Erro interno. Tente novamente."', correta: false, porque: 'sem causa nem ação, convida à repetição cega.' }
          ] },
        { tipo: 'takeaway', html: '<mark>Ferramenta também tem eval</mark>: meça chamadas, tokens e erros, e leia o que o agente <mark>não</mark> fez.' }
      ] }
    ]
  });
})();
