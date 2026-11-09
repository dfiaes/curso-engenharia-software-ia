/* M07 · Bloco 7: O pipeline de 18 etapas e a avaliação de RAG. Fonte: M07.html#b07. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasDiag = function () {
    return [
      { id: 'recup', nome: 'Recuperação', descricao: 'o chunk certo veio?', tom: 'dns', ms: 1, linhas: [
        L('info', 'resposta errada para a pergunta P (exemplo didático)'),
        L('cmd', 'recall_at_k(recuperados, corretos, k=5)'),
        L('hint', 'se o chunk certo não está nos k primeiros: falha de recuperação (chunking, híbrido, rerank)')] },
      { id: 'injeta', nome: 'Contexto perfeito', descricao: 'injetado à mão', tom: 'request', ms: 1, linhas: [
        L('cmd', 'gerar(pergunta, contexto=chunks_corretos)   # sem passar pela busca'),
        L('hint', 'se ainda erra, é geração (prompt, modelo, formato de saída); se acerta, o problema estava na recuperação')] },
      { id: 'fora', nome: 'Fora do corpus', descricao: 'não havia resposta', tom: 'ink', ms: 1, linhas: [
        L('cmd', 'consulta sem resposta no corpus -> o sistema respondeu algo plausível?'),
        L('hint', 'se inventou: falha de abstenção (limiar e prompt de abstenção, bloco 6)')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm07-b7',
    titulo: 'O pipeline de 18 etapas e a avaliação de RAG',
    minutos: 40,
    resumo: 'Das dezoito etapas do RAG de produção, seis são de segurança, versionamento ou custo, as que nenhum tutorial mostra. Resposta errada tem três causas possíveis, e o contexto perfeito injetado à mão separa recuperação de geração.',
    objetivo: 'Localizar cada etapa e o que quebra sem ela, separar mecanicamente falha de recuperação, de geração e de abstenção, e escrever os graders determinísticos de recall, MRR e citação.',
    revisao: [
      { id: 'm07b7-tres', pergunta: 'Quais são as três causas possíveis de uma resposta ruim de RAG?',
        opcoes: [
          opc('a', 'Recuperação (o chunk certo não veio), geração (veio e a resposta distorceu) e abstenção (não havia resposta e o sistema inventou)', true, 'cada uma tem um teste que isola e um lugar onde consertar.'),
          opc('b', 'Embedding, índice e hardware', false, 'são componentes, não as três categorias de falha.'),
          opc('c', 'Prompt, temperatura e k', false, 'são botões de ajuste, não causas.')] },
      { id: 'm07b7-injecao', pergunta: 'Como separar, em cinco minutos, falha de recuperação de falha de geração?',
        opcoes: [
          opc('a', 'Injetar à mão o contexto perfeito: se ainda erra, é geração; se acerta, é recuperação (confira o recall@k)', true, 'sem separar as metades, você ajusta prompt para consertar chunking, e isso não converge.'),
          opc('b', 'Trocar de modelo e ver se melhora', false, 'não isola nada.'),
          opc('c', 'Aumentar o k e observar', false, 'mais k é ajuste na recuperação, não um teste que separe as metades.')] },
      { id: 'm07b7-citacao', pergunta: 'Qual métrica de RAG se mede sem juiz LLM no domínio de código?',
        opcoes: [
          opc('a', 'Citação válida: a linha citada existe no arquivo e contém o termo afirmado', true, 'código tem verdade verificável; o grader é determinístico, barato e roda em todo PR.'),
          opc('b', 'Faithfulness da resposta', false, 'decompor a resposta e checar cada afirmação exige juiz.'),
          opc('c', 'Relevância da resposta', false, 'exige juiz binário.')] },
      { id: 'm07b7-mrr', pergunta: 'O que o MRR mede e como se calcula?',
        opcoes: [
          opc('a', 'Se o chunk certo vem no topo: a média de 1/posição do primeiro acerto', true, 'com acerto na posição 2, a contribuição é 0,5; sem acerto, 0.'),
          opc('b', 'A fração dos chunks corretos que aparecem nos k primeiros', false, 'isso é recall@k.'),
          opc('c', 'Quantos dos k enviados eram úteis', false, 'isso é precisão de contexto.')] },
      { id: 'm07b7-seis', pergunta: 'O que há de comum nas seis etapas das dezoito que nenhum tutorial mostra?',
        opcoes: [
          opc('a', 'São de segurança, versionamento ou custo, e decidem se o sistema pode ser vendido a uma empresa', true, 'é a distância entre uma consulta num console e um endpoint de produção.'),
          opc('b', 'São todas de geração com LLM', false, 'a maioria é determinística e de engenharia de dados.'),
          opc('c', 'São opcionais', false, 'o que quebra sem elas está na tabela das 18 etapas.')] }
    ],
    abas: [
      { rotulo: 'As 18 etapas', blocos: [
        { tipo: 'texto', html:
          '<p>Você construiu as peças. Este bloco monta o mapa completo, para ver quanto do RAG de produção fica invisível num tutorial, e resolve o problema de medição específico do padrão: quando a resposta sai errada, a culpa é da recuperação ou da geração? Sem separar as duas, você fica ajustando prompt para consertar um problema de chunking, o que não converge nunca.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Ingestão (offline, roda quando o corpus muda)</h3>' +
          '<table><thead><tr><th>#</th><th>Etapa</th><th>Onde foi construída</th><th>O que quebra sem ela</th></tr></thead><tbody>' +
          '<tr><td>1</td><td>Coleta e normalização (clone, encoding, filtro de binários e gerados)</td><td>M03 + b8</td><td>Lixo indexado: <code>bin/</code>, <code>obj/</code>, minificados</td></tr>' +
          '<tr><td>2</td><td>Extração de metadados (caminho, linguagem, commit, símbolo)</td><td>b2</td><td>Impossível filtrar, citar ou versionar</td></tr>' +
          '<tr><td>3</td><td>Classificação de sensibilidade e mascaramento (segredo, PII, connection string)</td><td>M12</td><td>Segredo do cliente indexado e devolvido em resposta</td></tr>' +
          '<tr><td>4</td><td>Chunking estrutural com id estável</td><td>b2</td><td>Chunk cortado no meio; reindexação total a cada commit</td></tr>' +
          '<tr><td>5</td><td>Contextualização do chunk (contextual retrieval)</td><td>b2</td><td>Chunk órfão que não se explica sozinho</td></tr>' +
          '<tr><td>6</td><td>Deduplicação por <code>hash_conteudo</code></td><td>b2/b3</td><td>O mesmo trecho ocupando 5 vagas no top-k</td></tr>' +
          '<tr><td>7</td><td>Embedding com cache</td><td>M05 b5</td><td>Pagar de novo por texto que não mudou</td></tr>' +
          '<tr><td>8</td><td>Indexação vetorial + léxica + metadados</td><td>b3, b4</td><td>Sem busca</td></tr>' +
          '<tr><td>9</td><td>Versionamento e ingestão incremental</td><td>b2/b3</td><td>Reindexar 50k chunks por causa de 3 arquivos alterados</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Consulta (online, por pergunta)</h3>' +
          '<table><thead><tr><th>#</th><th>Etapa</th><th>Onde foi construída</th><th>O que quebra sem ela</th></tr></thead><tbody>' +
          '<tr><td>10</td><td>Detecção de intenção e roteamento</td><td>b5</td><td>Pergunta estrutural indo para busca vetorial (e errando)</td></tr>' +
          '<tr><td>11</td><td>Reescrita e expansão de query</td><td>b5</td><td>Vocabulário do usuário ≠ vocabulário do corpus</td></tr>' +
          '<tr><td>12</td><td>Filtro de permissão e escopo</td><td>b6</td><td>Vazamento entre tenants</td></tr>' +
          '<tr><td>13</td><td>Busca híbrida (léxico + vetorial)</td><td>b4</td><td>Identificador exato perdido</td></tr>' +
          '<tr><td>14</td><td>Fusão de ranking (RRF)</td><td>b4</td><td>Somar escalas incomparáveis</td></tr>' +
          '<tr><td>15</td><td>Reranking</td><td>b5</td><td>8 a 20 pontos de recall@5 na mesa</td></tr>' +
          '<tr><td>16</td><td>Limiar e abstenção</td><td>b6</td><td>Resposta plausível a partir de contexto ruim</td></tr>' +
          '<tr><td>17</td><td>Empacotamento do contexto (ordem, deduplicação, orçamento de tokens, delimitação)</td><td>b6/b8</td><td>Context rot; instrução adversarial tratada como instrução</td></tr>' +
          '<tr><td>18</td><td>Geração com citação obrigatória e verificação da citação</td><td>b8</td><td>Afirmação sem evidência; linha inventada</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Dezoito, não seis', html:
          '<p>Das dezoito, seis são de segurança, versionamento ou custo, exatamente as que nenhum tutorial mostra e que decidem se o sistema pode ser vendido a uma empresa. A distância entre 6 e 18 etapas é a mesma entre uma consulta num console e um endpoint de produção: autenticação, autorização, validação, paginação, cache, transação, log, erro, versionamento. Ninguém estranha dez preocupações além da query num endpoint, mas quase todo mundo acha que RAG é "embedar e buscar". É a mesma engenharia, com nomes novos.</p>' },
        { tipo: 'ordene', id: 'av-ordene', titulo: 'Ponha a consulta na ordem', obrigatorio: false,
          enunciado: 'As etapas 10 a 18 da consulta estão embaralhadas. Ordene-as como o pipeline as executa.',
          itens: [
            { id: 's15', texto: 'Reranking' },
            { id: 's12', texto: 'Filtro de permissão e escopo' },
            { id: 's18', texto: 'Geração com citação obrigatória e verificação da citação' },
            { id: 's10', texto: 'Detecção de intenção e roteamento' },
            { id: 's14', texto: 'Fusão de ranking (RRF)' },
            { id: 's16', texto: 'Limiar e abstenção' },
            { id: 's11', texto: 'Reescrita e expansão de query' },
            { id: 's17', texto: 'Empacotamento do contexto' },
            { id: 's13', texto: 'Busca híbrida (léxico + vetorial)' }
          ],
          solucao: ['s10', 's11', 's12', 's13', 's14', 's15', 's16', 's17', 's18'],
          dica: 'A pergunta é entendida antes de qualquer busca (10, 11); o filtro vem antes de ordenar qualquer coisa; da busca ao rerank o funil estreita; só depois do limiar se monta contexto e se gera.',
          tutorDepois: 'O filtro de permissão é a etapa 12: depois da transformação da query e antes de toda busca.',
          callout: 'Você pôs a consulta na ordem do pipeline, com o filtro antes da busca.' },
        { tipo: 'takeaway', html: 'Seis das dezoito etapas são <mark>segurança, versionamento ou custo</mark>: o que separa demo de <mark>produto vendável</mark>.' }
      ] },

      { rotulo: 'Recuperação ou geração', blocos: [
        { tipo: 'texto', html:
          '<p>Uma resposta ruim de RAG tem exatamente <strong>três causas possíveis</strong>, e elas se distinguem mecanicamente.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Falha</th><th>Sintoma</th><th>Teste que isola</th><th>Onde consertar</th></tr></thead><tbody>' +
          '<tr><td><strong>Recuperação</strong></td><td>O chunk certo não veio</td><td>recall@k contra o ground truth</td><td>Chunking, híbrido, rerank (b2/b4/b5)</td></tr>' +
          '<tr><td><strong>Geração</strong></td><td>O chunk certo veio e a resposta ignorou ou distorceu</td><td>Rode a geração com o contexto correto injetado à mão: se ainda erra, é geração</td><td>Prompt, modelo, formato de saída (M05)</td></tr>' +
          '<tr><td><strong>Abstenção</strong></td><td>Não havia resposta e o sistema inventou</td><td>Consultas fora do corpus (b6)</td><td>Limiar e prompt de abstenção (b6)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'success', titulo: 'O teste do meio', html:
          '<p>Injetar o contexto perfeito à mão é o teste mais útil e o menos usado: separa as duas metades do sistema em cinco minutos e evita semanas ajustando a coisa errada.</p>' },
        { tipo: 'rode', id: 'av-rode', titulo: 'Três testes, três falhas', enunciado: 'Percorra os três testes de isolamento e leia a hipótese que cada um confirma.',
          prefixo: '$', entrada: 'diagnosticar_resposta --pergunta P', unidade: 'min', terminalTitulo: 'diagnóstico de uma resposta errada (exemplo)', etapas: etapasDiag(),
          prever: { pergunta: 'Você injeta à mão o contexto perfeito e a resposta continua errada. Onde está o defeito?', opcoes: [
            { id: 'a', texto: 'Na recuperação: o chunk certo não veio.', correta: false, porque: 'o chunk certo foi entregue por você; a recuperação saiu do teste.' },
            { id: 'b', texto: 'Na geração: prompt, modelo ou formato de saída.', correta: true, porque: 'com contexto perfeito, só a metade de geração sobra.' },
            { id: 'c', texto: 'No filtro de ACL.', correta: false, porque: 'o filtro está antes da recuperação, que você contornou.' }
          ] },
          tutorAntes: 'Aperte Enter e leia, em cada etapa, qual teste isola qual falha.',
          tutorDepois: 'Os três testes são independentes: recall@k para a recuperação, contexto injetado para a geração e consultas fora do corpus para a abstenção. Tipicamente 70 a 80% das falhas são de recuperação, o que diz onde investir.',
          callout: 'Você separou as três falhas pelo teste que isola cada uma.' },
        { tipo: 'takeaway', html: 'Três causas, três testes: <mark>recall@k</mark>, <mark>contexto injetado</mark> e <mark>consulta fora do corpus</mark>.' }
      ] },

      { rotulo: 'Métricas e graders', blocos: [
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Métrica</th><th>O que mede</th><th>Como calcular</th><th>Precisa de LLM?</th></tr></thead><tbody>' +
          '<tr><td><strong>recall@k</strong></td><td>O chunk certo está entre os k?</td><td>Ground truth por consulta (b4)</td><td>Não</td></tr>' +
          '<tr><td><strong>MRR</strong></td><td>O certo vem no topo?</td><td>Média de 1/posição do primeiro acerto</td><td>Não</td></tr>' +
          '<tr><td><strong>Precisão de contexto</strong></td><td>Dos k enviados, quantos eram úteis?</td><td>Rotular a utilidade dos chunks entregues</td><td>Juiz, se em escala</td></tr>' +
          '<tr><td><strong>Faithfulness</strong> (fidelidade)</td><td>A resposta é sustentada pelo contexto?</td><td>Decompor a resposta em afirmações e checar cada uma contra o contexto</td><td>Sim: é o juiz do M06 b3</td></tr>' +
          '<tr><td><strong>Relevância da resposta</strong></td><td>Respondeu o que foi perguntado?</td><td>Juiz binário</td><td>Sim</td></tr>' +
          '<tr><td><strong>Taxa de abstenção correta</strong></td><td>Absteve quando devia; respondeu quando podia</td><td>Duas taxas separadas (b6)</td><td>Não</td></tr>' +
          '<tr><td><strong>Citação válida</strong></td><td>As linhas citadas existem e contêm o afirmado</td><td>Determinístico: a linha está no arquivo? O trecho contém o termo?</td><td>Não</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'success', titulo: 'A vantagem do seu produto sobre um RAG de texto genérico', html:
          '<p>Faithfulness em resumo de contrato exige juiz LLM: não há verdade objetiva barata. No Cartógrafo há: a linha 412 existe ou não existe; o método <code>Processar</code> é chamado por aquelas 7 classes ou não é. Isso permite <strong>graders determinísticos</strong> (M06 bloco 3, degrau 1) para boa parte das métricas, mais baratos, rápidos e confiáveis que qualquer juiz. É o que o <code>projeto-final.md</code> chama de "verdade verificável", e o que torna a sua suíte de evals um diferencial defensável e não um enfeite.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '# evals/graders_rag.py: graders determinísticos de RAG',
          '"""Métricas de recuperação e de citação, sem LLM."""',
          'from __future__ import annotations',
          'from pathlib import Path',
          '',
          'def recall_at_k(recuperados: list[int], corretos: set[int], k: int) -> float:',
          '    """Fração dos chunks corretos que apareceram nos k primeiros."""',
          '    if not corretos:',
          '        return 1.0',
          '    topo = set(recuperados[:k])',
          '    return len(topo & corretos) / len(corretos)',
          '',
          'def mrr(recuperados: list[int], corretos: set[int]) -> float:',
          '    """1/posição do primeiro acerto (0 se nenhum)."""',
          '    for i, cid in enumerate(recuperados, start=1):',
          '        if cid in corretos:',
          '            return 1.0 / i',
          '    return 0.0',
          '',
          'def citacao_valida(citacao: dict[str, object], raiz: Path) -> tuple[bool, str]:',
          '    """A citação aponta para linhas que EXISTEM e contêm o que foi afirmado?"""',
          '    caminho = raiz / str(citacao["caminho"])',
          '    if not caminho.is_file():',
          '        return False, f"arquivo citado não existe: {citacao[\'caminho\']}"',
          '    linhas = caminho.read_text(encoding="utf-8", errors="replace").splitlines()',
          '    ini, fim = int(citacao["linha_ini"]), int(citacao["linha_fim"])',
          '    if not (1 <= ini <= fim <= len(linhas)):',
          '        return False, f"faixa {ini}-{fim} fora do arquivo (1..{len(linhas)})"',
          '',
          '    trecho = "\\n".join(linhas[ini - 1 : fim]).lower()',
          '    termo = str(citacao.get("termo_esperado", "")).lower()',
          '    if termo and termo not in trecho:',
          '        return False, f"trecho citado não contém \'{termo}\'"',
          '    return True, ""'].join('\n') },
        { tipo: 'callout', tom: 'neutral', titulo: 'Frameworks de eval de RAG', html:
          '<p><strong>Ragas</strong> é o mais conhecido: implementa faithfulness, context precision/recall e answer relevancy, quase todos com LLM por trás. <strong>TruLens</strong> e <strong>DeepEval</strong> jogam no mesmo espaço; <strong>promptfoo</strong> (M06) também cobre RAG. Vale conhecer o vocabulário porque aparece em entrevista e em post de blog. A recomendação é a do M06: construa as métricas determinísticas você mesmo e adote framework para as que exigem juiz, se e quando o volume justificar. Métrica com LLM custa tokens <em>a cada rodada da suíte</em>, e a sua suíte roda em todo PR (M06 bloco 6).</p>' },
        { tipo: 'takeaway', html: 'Código tem <mark>verdade verificável</mark>: recall, MRR e citação saem de <mark>graders determinísticos</mark>, sem juiz.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'av-python', titulo: 'Escreva os graders', obrigatorio: false,
          enunciado: 'Implemente <code>recall_at_k</code>, <code>mrr</code> e <code>citacao_valida</code>. Aqui os arquivos vêm de um <code>dict</code> caminho para texto (no lab, de <code>Path</code>), e as mensagens de erro seguem o formato do bloco.',
          codigo: "def recall_at_k(recuperados, corretos, k):\n    \"\"\"Fração dos chunks corretos que apareceram nos k primeiros.\"\"\"\n    # sem chunks corretos esperados, devolva 1.0\n    return 0.0\n\n\ndef mrr(recuperados, corretos):\n    \"\"\"1/posição do primeiro acerto (posição começa em 1); 0.0 se nenhum.\"\"\"\n    return 0.0\n\n\ndef citacao_valida(citacao, arquivos):\n    \"\"\"arquivos: dict caminho -> texto. Devolve (ok, motivo).\"\"\"\n    # 1. o arquivo existe?  2. 1 <= linha_ini <= linha_fim <= nº de linhas?\n    # 3. se há termo_esperado, ele aparece (sem diferenciar maiúsculas) nas linhas citadas?\n    return True, \"\"\n\n\nARQ = {\"app/pedido.py\": \"class Pedido:\\n    def processar(self):\\n        return 1\\n\"}\nprint(citacao_valida({\"caminho\": \"app/x.py\", \"linha_ini\": 1, \"linha_fim\": 2}, ARQ))\n",
          testes: "ARQ = {\"app/pedido.py\": \"class Pedido:\\n    def processar(self):\\n        return 1\\n\"}\n\n\ndef test_recall_parcial_e_completo():\n    assert recall_at_k([7, 3, 9, 1], {3, 1}, 2) == 0.5\n    assert recall_at_k([7, 3, 9, 1], {3, 1}, 4) == 1.0\n\n\ndef test_recall_sem_corretos_e_um():\n    assert recall_at_k([1, 2], set(), 5) == 1.0\n\n\ndef test_mrr_posicao_do_primeiro_acerto():\n    assert mrr([7, 3, 9], {3, 9}) == 0.5\n    assert mrr([3, 7], {3}) == 1.0\n\n\ndef test_mrr_sem_acerto_e_zero():\n    assert mrr([7, 8], {3}) == 0.0\n\n\ndef test_citacao_arquivo_inexistente():\n    ok, motivo = citacao_valida({\"caminho\": \"app/x.py\", \"linha_ini\": 1, \"linha_fim\": 1}, ARQ)\n    assert not ok and motivo == \"arquivo citado não existe: app/x.py\"\n\n\ndef test_citacao_faixa_fora_do_arquivo():\n    ok, motivo = citacao_valida({\"caminho\": \"app/pedido.py\", \"linha_ini\": 2, \"linha_fim\": 9}, ARQ)\n    assert not ok and motivo == \"faixa 2-9 fora do arquivo (1..3)\"\n\n\ndef test_citacao_termo_ausente_e_presente():\n    c = {\"caminho\": \"app/pedido.py\", \"linha_ini\": 2, \"linha_fim\": 3, \"termo_esperado\": \"PROCESSAR\"}\n    assert citacao_valida(c, ARQ) == (True, \"\")\n    c[\"termo_esperado\"] = \"cancelar\"\n    ok, motivo = citacao_valida(c, ARQ)\n    assert not ok and motivo == \"trecho citado não contém 'cancelar'\"\n\n\ndef test_citacao_sem_termo_basta_faixa_valida():\n    assert citacao_valida({\"caminho\": \"app/pedido.py\", \"linha_ini\": 1, \"linha_fim\": 1}, ARQ) == (True, \"\")\n",
          dica: 'No recall, interseccione <code>set(recuperados[:k])</code> com os corretos e divida por <code>len(corretos)</code>. No MRR, <code>enumerate(..., start=1)</code>. Na citação, o fatiamento é <code>linhas[ini - 1 : fim]</code>, e o termo se compara em minúsculas.',
          solucao: "def recall_at_k(recuperados, corretos, k):\n    \"\"\"Fração dos chunks corretos que apareceram nos k primeiros.\"\"\"\n    if not corretos:\n        return 1.0\n    topo = set(recuperados[:k])\n    return len(topo & set(corretos)) / len(corretos)\n\n\ndef mrr(recuperados, corretos):\n    \"\"\"1/posição do primeiro acerto (posição começa em 1); 0.0 se nenhum.\"\"\"\n    for i, cid in enumerate(recuperados, start=1):\n        if cid in corretos:\n            return 1.0 / i\n    return 0.0\n\n\ndef citacao_valida(citacao, arquivos):\n    \"\"\"arquivos: dict caminho -> texto. Devolve (ok, motivo).\"\"\"\n    caminho = citacao[\"caminho\"]\n    if caminho not in arquivos:\n        return False, f\"arquivo citado não existe: {caminho}\"\n    linhas = arquivos[caminho].splitlines()\n    ini, fim = int(citacao[\"linha_ini\"]), int(citacao[\"linha_fim\"])\n    if not (1 <= ini <= fim <= len(linhas)):\n        return False, f\"faixa {ini}-{fim} fora do arquivo (1..{len(linhas)})\"\n    trecho = \"\\n\".join(linhas[ini - 1 : fim]).lower()\n    termo = str(citacao.get(\"termo_esperado\", \"\")).lower()\n    if termo and termo not in trecho:\n        return False, f\"trecho citado não contém '{termo}'\"\n    return True, \"\"\n\n\nARQ = {\"app/pedido.py\": \"class Pedido:\\n    def processar(self):\\n        return 1\\n\"}\nprint(citacao_valida({\"caminho\": \"app/x.py\", \"linha_ini\": 1, \"linha_fim\": 2}, ARQ))\n",
          tutorDepois: 'Os três graders não chamam LLM: rodam em todo PR a custo zero de tokens. Repare no caso sem corretos esperados (recall 1,0) e no sem acerto (MRR 0).',
          callout: 'Recall, MRR e citação válida passaram, com arquivo ausente, faixa fora e termo ausente cobertos.' },
        { tipo: 'escolha', id: 'av-esc-1', titulo: 'Confira: recuperação ou geração',
          pergunta: 'Uma resposta saiu errada. Como decidir em cinco minutos se a culpa é da recuperação ou da geração?',
          opcoes: [
            { id: 'a', texto: 'Injetar à mão o contexto perfeito: se ainda erra, é geração; se acerta, a recuperação falhou (confira o recall@k).', correta: true, porque: 'separa as metades; sem isso o ajuste de prompt não converge.' },
            { id: 'b', texto: 'Trocar de modelo e ver se melhora.', correta: false, porque: 'não isola a causa.' },
            { id: 'c', texto: 'Reescrever o prompt até acertar.', correta: false, porque: 'pode estar consertando chunking com prompt.' },
            { id: 'd', texto: 'Aumentar o k e observar.', correta: false, porque: 'muda a recuperação sem testar a geração.' }
          ] },
        { tipo: 'escolha', id: 'av-esc-2', titulo: 'Confira: sem juiz',
          pergunta: 'Qual métrica de RAG você mede sem juiz LLM no domínio do Cartógrafo?',
          opcoes: [
            { id: 'a', texto: 'Faithfulness da resposta.', correta: false, porque: 'texto livre exige juiz.' },
            { id: 'b', texto: 'Relevância da resposta à pergunta.', correta: false, porque: 'também exige juiz binário.' },
            { id: 'c', texto: 'Nenhuma: tudo exige juiz.', correta: false, porque: 'código tem verdade verificável.' },
            { id: 'd', texto: 'Citação válida: a linha existe e contém o termo afirmado.', correta: true, porque: 'grader determinístico, mais barato, rápido e confiável que um juiz.' }
          ] },
        { tipo: 'texto', html: '<p class="ta-nota">Exercício do laboratório: 40 consultas com categorias e estruturais marcadas <code>esperado_falhar</code>; baseline salva e gate do M06 reutilizado; tabela de ablação mostrando o preço de cada omissão (o argumento contra "embedar e buscar"); e 5 falhas classificadas injetando contexto perfeito, tipicamente 70 a 80% de recuperação.</p>' },
        { tipo: 'takeaway', html: '<mark>Separe</mark> recuperação de geração <mark>antes</mark> de mexer no prompt.' }
      ] }
    ]
  });
})();
