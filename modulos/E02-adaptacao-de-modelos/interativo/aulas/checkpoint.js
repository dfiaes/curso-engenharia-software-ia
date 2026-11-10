/* E02 · Checkpoint: onze cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada. Portado de E02.html#checkpoint. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'e02-checkpoint',
    titulo: 'Checkpoint E02',
    minutos: 60,
    resumo: 'Onze cenários sobre adaptação de modelos, sem consulta. Responda por escrito, com números onde houver; "Basta" é o mínimo para passar e "Reprova" indica o bloco a reler.',
    objetivo: 'Verificar, sem consulta, se você decide a alavanca com a conta de custo total, monta um SFT sem vazamento, dimensiona LoRA, lê preferência e dado sintético, escolhe raciocínio pelo custo marginal, projeta barreiras multimodais e opera o modelo adaptado.',
    revisao: [
      { id: 'e02cp-regra', pergunta: 'A diretoria quer que o assistente "conheça as políticas internas, que mudam todo mês". Qual é o desenho?',
        opcoes: [
          opc('a', 'Política volátil e com fonte por contexto (RAG com fonte e ACL); só comportamento estável (formato, tom) pode justificar SFT, depois de medir um baseline', true, 'fato que muda ou precisa de fonte vai por contexto; comportamento estável vai por pesos.'),
          opc('b', 'Fine-tuning mensal com o manual novo', false, 'nos pesos o conhecimento é difuso, sem citação e sem como apagar uma regra revogada.'),
          opc('c', 'Treino do zero com os dados novos', false, 'meses de trabalho e custo desproporcional para um fato volátil.')] },
      { id: 'e02cp-split', pergunta: 'Um conjunto de 5.000 conversas tem 800 clientes, dividido 80/10/10 aleatoriamente por conversa. Qual o risco e a correção?',
        opcoes: [
          opc('a', 'Vazamento do mesmo cliente entre splits e métrica otimista; dividir por hash do customer_id e deduplicar antes', true, 'o hash do grupo é estável entre versões do dataset.'),
          opc('b', 'Nenhum: 5.000 conversas bastam', false, 'o volume não corrige o vazamento.'),
          opc('c', 'Só falta mais dado', false, 'mais dado com o mesmo split mantém o vazamento.')] },
      { id: 'e02cp-lora', pergunta: 'LoRA r = 8 contra r = 64 nas 4 projeções de 4096×4096 de 32 camadas, com α fixo em 16: qual o efeito?',
        opcoes: [
          opc('a', 'Parâmetros: 8.388.608 contra 67.108.864 (8×); a escala α/r vai de 2 para 0,25, então o delta efetivo encolhe e a taxa precisa ser reajustada', true, 'r·(d+k) é linear em r; α/r é a escala do delta.'),
          opc('b', 'Parâmetros quadruplicam e a escala não muda', false, 'a contagem é linear em r e α/r muda.'),
          opc('c', 'Nada muda além da memória', false, 'a escala efetiva do delta também muda.')] },
      { id: 'e02cp-vivo', pergunta: 'Atendimento ao vivo (meta de 3 s) com modelo de raciocínio que dá +9 pontos de acerto e 40 s de latência. Decisão?',
        opcoes: [
          opc('a', 'Não no caminho síncrono: rotear casos duvidosos para escalar em segundo plano, ou menor esforço, justificando por latência e custo marginal', true, 'adotar só pelo acerto ignora a meta de latência.'),
          opc('b', 'Adotar em todo o tráfego pelo ganho de acerto', false, 'viola a meta de 3 s.'),
          opc('c', 'Descartar sempre o raciocínio', false, 'em segundo plano ele pode pagar.')] },
      { id: 'e02cp-canario', pergunta: 'Canário com 5% do tráfego: F1 amostrado 6 pontos abaixo em uma só janela de 100 casos. O que fazer?',
        opcoes: [
          opc('a', 'Exigir duas janelas seguidas por causa do ruído amostral, aumentar a amostra, reverter por ponteiro se confirmado e registrar o caso na suíte', true, 'rollback que depende de retreinar não é rollback.'),
          opc('b', 'Promover ignorando a janela', false, 'ignora o sinal.'),
          opc('c', 'Reverter retreinando a versão anterior', false, 'sem ponteiro, o rollback demora horas.')] }
    ],
    abas: [
      { rotulo: 'Decidir e medir (B1 e B2)', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário: responda por escrito, com números onde houver, e depois compare com a rubrica "Basta". Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: onde mora a política',
          pergunta: 'As políticas internas mudam todo mês e precisam de fonte. Qual alavanca?',
          opcoes: [
            { id: 'a', texto: 'Contexto (RAG ou tabela consultada por ferramenta).', correta: true, porque: 'no contexto o conhecimento é consultável, atualizável por linha e auditável.' },
            { id: 'b', texto: 'Fine-tuning mensal.', correta: false, porque: 'nos pesos não há citação nem como apagar uma regra revogada.' },
            { id: 'c', texto: 'Treino do zero.', correta: false, porque: 'custo e prazo desproporcionais.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · As políticas que mudam todo mês', obrigatorio: false,
          enunciado: 'A diretoria pede fine-tuning para que o assistente "conheça as políticas internas, que mudam todo mês". Responda em um parágrafo e proponha o desenho. <em>Bloco 1.</em>',
          placeholder: 'Separo… A política vai por… Mediria primeiro…',
          rubrica: [
            'Separa <strong>conhecimento volátil</strong> (RAG com fonte e ACL) de <strong>comportamento estável</strong> (formato/tom, que pode ou não justificar SFT).',
            'Propõe <strong>medir primeiro</strong> com um baseline.'
          ],
          modelo: '<p>Política que muda todo mês e precisa de fonte vai por contexto: RAG sobre o manual, com fonte, versão e ACL, atualizável por linha e auditável. Fine-tuning só entraria para o jeito de responder (formato, tom), se um baseline de prompt otimizado e com cache ainda falhar, e com uma suíte de avaliação para provar o ganho.</p>' + reprova('aceita treinar as políticas nos pesos, ou recusa tudo sem propor alternativa.') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · A conta com 10 vezes menos volume', obrigatorio: false,
          enunciado: 'Refaça a conta do exemplo com volume de 200.000 chamadas por mês e o mesmo investimento de 12.427. Qual o ponto de equilíbrio contra o prompt com cache e o que você recomenda? <em>Bloco 1.</em>',
          placeholder: 'Custo B… custo C… economia… equilíbrio… recomendo…',
          rubrica: [
            'Escala os custos por 1/10: <strong>B = 222</strong>, <strong>C = 36,8</strong>, economia de <strong>185,2/mês</strong>.',
            'Obtém cerca de <strong>67 meses</strong> de equilíbrio.',
            'Recomenda <strong>não ajustar</strong> (ou rever gatilhos: qualidade, latência).',
            'Cita o <strong>retreino</strong>.'
          ],
          modelo: '<p>Com 200.000 chamadas o baseline B custa 222 por mês e o ajustado C, 36,8; a economia é 185,2 por mês e 12.427 / 185,2 ≈ 67 meses. Antes disso o modelo-base já terá trocado e o retreino consumiria a economia. Recomendo não ajustar por custo; só reabriria se qualidade ou latência que o prompt não alcança justificassem.</p>' + reprova('usa o cenário A como baseline, ou ignora o custo de retreino.') },

        { tipo: 'escolha', id: 'cp-esc-p3', titulo: 'P3 · Aquecimento: o split',
          pergunta: 'Qual divisão evita o vazamento quando o mesmo cliente aparece em várias linhas?',
          opcoes: [
            { id: 'a', texto: 'Aleatória por linha, 80/10/10.', correta: false, porque: 'o mesmo cliente cai nos dois lados.' },
            { id: 'b', texto: 'Por hash do identificador do cliente, depois de deduplicar.', correta: true, porque: 'o hash do grupo é estável: dados novos não movem exemplos antigos.' },
            { id: 'c', texto: 'Sem teste, só treino e validação.', correta: false, porque: 'sem teste não há estimativa não enviesada.' }
          ] },
        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · 800 clientes, 5.000 conversas', obrigatorio: false,
          enunciado: 'Um conjunto de 5.000 conversas tem 800 clientes; a equipe divide 80/10/10 aleatoriamente por conversa. Qual o risco e a correção? <em>Bloco 2.</em>',
          placeholder: 'O risco é… A correção…',
          rubrica: [
            '<strong>Vazamento</strong> do mesmo cliente entre splits, com métrica otimista.',
            'Dividir por <strong>hash do <code>customer_id</code></strong>.',
            '<strong>Deduplicar antes</strong> de dividir.'
          ],
          modelo: '<p>O mesmo cliente aparece em treino e teste, o modelo memoriza a entidade e a métrica de teste mente. Corrijo dividindo por hash do <code>customer_id</code> (estável entre versões do dataset) e deduplicando, incluindo quase-duplicatas, antes de dividir.</p>' + reprova('propõe só "mais dados".') },

        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · 88% contra 84%', obrigatorio: false,
          enunciado: 'O candidato tem 88% contra 84% do baseline em 200 exemplos. Pode ser promovido? <em>Bloco 2.</em>',
          placeholder: 'A diferença é… Eu pediria…',
          rubrica: [
            'A diferença está em cerca de <strong>1,2 erro-padrão</strong> (≈ 3,5 pontos).',
            'Pede <strong>teste pareado</strong>, mais dados ou intervalo.',
            'Verifica as <strong>guardas</strong>.'
          ],
          modelo: '<p>Não está demonstrado: o erro-padrão da diferença é cerca de 3,5 pontos e 4 pontos são pouco mais de um erro-padrão. Pediria teste pareado (McNemar ou bootstrap pareado), mais exemplos ou um intervalo, e olharia as guardas e a linha do baseline otimizado antes de promover.</p>' + reprova('promove por ser maior, ou ignora a incerteza.') },
        { tipo: 'takeaway', html: 'Fato volátil por <mark>contexto</mark>, conta com o <mark>baseline certo</mark>, split por <mark>grupo</mark> e diferença com <mark>erro-padrão</mark>.' }
      ] },

      { rotulo: 'LoRA, preferência e dados (B3 e B4)', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p5', titulo: 'P5 · Aquecimento: a escala',
          pergunta: 'Com α fixo em 16, o que acontece com a escala do delta quando o rank vai de 8 para 64?',
          opcoes: [
            { id: 'a', texto: 'Cai de 2 para 0,25.', correta: true, porque: 'a escala é α/r.' },
            { id: 'b', texto: 'Sobe de 2 para 8.', correta: false, porque: 'dividir por um r maior reduz a escala.' },
            { id: 'c', texto: 'Não muda: a escala depende só de α.', correta: false, porque: 'α/r depende também do rank.' }
          ] },
        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Contar parâmetros e a escala', obrigatorio: false,
          enunciado: 'Calcule os parâmetros treináveis de LoRA r=8 em todas as projeções 4096×4096 de uma atenção com 4 projeções e 32 camadas, e compare com r=64. Depois diga o que acontece com a escala efetiva se α ficar fixo em 16. <em>Bloco 3.</em>',
          placeholder: 'r=8: 4 × 32 × 8 × 8192 = … r=64: … a escala…',
          rubrica: [
            'r=8: <strong>4 × 32 × 8 × 8192 = 8.388.608</strong>; r=64: <strong>67.108.864</strong> (8×).',
            'Com α=16 a escala α/r vai de <strong>2</strong> (r=8) a <strong>0,25</strong> (r=64): o delta efetivo encolhe e a taxa precisa ser reajustada (ou α proporcional a r).'
          ],
          modelo: '<p>Por matriz o adapter tem r·(d+k) = r × 8192 parâmetros. Para r=8: 4 × 32 × 8 × 8192 = 8.388.608. Para r=64: 67.108.864, oito vezes mais. Com α fixo em 16, a escala α/r cai de 2 para 0,25, então o delta efetivo encolhe e é preciso reajustar a taxa de aprendizado, ou manter α proporcional a r.</p>' + reprova('esquece que o parâmetro é r·(d+k), ou ignora o efeito de α/r.') },

        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Entregar o adapter fundido', obrigatorio: false,
          enunciado: 'Seu adapter treinado sobre base em 4 bits vai ser entregue fundido. Descreva o procedimento correto. <em>Bloco 3.</em>',
          placeholder: 'Primeiro… depois… só então…',
          rubrica: [
            'Fundir em <strong>bf16/fp16</strong> sobre o base de precisão alta.',
            '<strong>Avaliar o fundido</strong> na suíte.',
            'Só então <strong>quantizar</strong> e reavaliar.'
          ],
          modelo: '<p>Confiro o hash do base, fundo o adapter em bf16/fp16 sobre o base de precisão alta, avalio o fundido na suíte de alvo e guardas e só então quantizo, reavaliando o artefato quantizado, porque o que vai a produção é o que precisa ter sido avaliado.</p>' + reprova('soma o delta direto nos pesos de 4 bits e entrega sem reavaliar.') },

        { tipo: 'escolha', id: 'cp-esc-p7', titulo: 'P7 · Aquecimento: a perda do DPO',
          pergunta: 'A perda do DPO caiu de 0,69 para 0,50. O que isso garante?',
          opcoes: [
            { id: 'a', texto: 'Que as respostas melhoraram.', correta: false, porque: 'a perda mede só a razão contra a referência.' },
            { id: 'b', texto: 'Nada sobre a qualidade absoluta: a probabilidade da preferida pode ter caído e as respostas ficado mais longas.', correta: true, porque: 'monitore a log-probabilidade da preferida e o comprimento.' },
            { id: 'c', texto: 'Que β está correto.', correta: false, porque: 'β é varrido, não deduzido da perda.' }
          ] },
        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · DPO: perda cai e a qualidade cai', obrigatorio: false,
          enunciado: 'Um DPO reduz a perda de 0,69 para 0,50 e os avaliadores acham as respostas piores e mais longas. Diagnóstico e ação. <em>Bloco 4.</em>',
          placeholder: 'Suspeito de… Verificaria… Faria…',
          rubrica: [
            '<strong>Viés de comprimento</strong> e/ou queda da probabilidade da preferida.',
            'Checar <strong>comprimento</strong> e <strong>log-probabilidade</strong>.',
            '<strong>SFT prévio</strong>, pares amostrados do modelo, β maior.'
          ],
          modelo: '<p>A perda só exige a razão entre preferida e rejeitada contra a referência, então pode cair com a probabilidade absoluta da preferida caindo, e pares em que a preferida é mais longa ensinam "longo = bom". Checaria a log-probabilidade da preferida e o comprimento médio, faria SFT antes, usaria pares amostrados do próprio modelo, controlaria o comprimento e varreria β (maior mantém a política perto da referência).</p>' + reprova('trata a queda de perda como sucesso.') },

        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · O funil sintético', obrigatorio: false,
          enunciado: 'Dataset sintético: 30.000 gerados, 55% únicos após deduplicação, 80% aprovados pelo verificador, auditoria de 300 amostras com 9 erros. Quantos exemplos, quantos errados prováveis, e aceita? <em>Bloco 4.</em>',
          placeholder: 'Únicos… aprovados… taxa de erro… errados… decisão…',
          rubrica: [
            '<strong>16.500</strong> únicos; <strong>13.200</strong> aprovados.',
            'Erro de <strong>3%</strong>, cerca de <strong>396</strong> exemplos errados.',
            'Aceita conforme a <strong>tolerância da tarefa</strong>; mantém o <strong>teste isolado</strong>.'
          ],
          modelo: '<p>30.000 × 0,55 = 16.500 únicos; × 0,80 = 13.200 aprovados. A auditoria acha 9/300 = 3% de erro, o que implica cerca de 396 exemplos errados. Aceito se a tarefa tolerar 3% de rótulo errado (classificação de muitas categorias, talvez; extração de valores monetários, não), mantendo o teste isolado da geração.</p>' + reprova('reporta só o volume.') },
        { tipo: 'takeaway', html: 'Contas com <mark>r·(d + k)</mark> e <mark>α/r</mark>; perda de preferência <mark>não é qualidade</mark>; o funil decide pela <mark>taxa de erro auditada</mark>.' }
      ] },

      { rotulo: 'Raciocínio, multimodal e operação (B5 a B7)', blocos: [
        { tipo: 'escreva', id: 'cp-p9', titulo: 'P9 · Atendimento ao vivo com raciocínio', obrigatorio: false,
          enunciado: 'Atendimento ao vivo (meta de resposta em 3 s) com um modelo de raciocínio que dá +9 pontos de acerto e 40 s de latência. Decisão? <em>Bloco 5.</em>',
          placeholder: 'No caminho síncrono… Em segundo plano… Justifico por…',
          rubrica: [
            '<strong>Não</strong> no caminho síncrono.',
            '<strong>Roteamento</strong> para escalar casos duvidosos em segundo plano, ou <strong>menor esforço</strong>.',
            'Justifica por <strong>latência</strong> e <strong>custo marginal</strong>.'
          ],
          modelo: '<p>Não no caminho síncrono: 40 s violam a meta de 3 s. O modelo comum responde, um verificador barato estima a confiança e só os casos duvidosos escalam ao modelo de raciocínio em segundo plano, ou uso um esforço menor. Justifico pela latência e pelo custo do acerto marginal, e antes de implantar comparo a orçamento igual com voto de várias amostras.</p>' + reprova('adota só pelo acerto.') },

        { tipo: 'escolha', id: 'cp-esc-p10', titulo: 'P10 · Aquecimento: o portão',
          pergunta: 'Uma ação que nenhuma regra do portão reconhece chega ao classificador. Qual o padrão?',
          opcoes: [
            { id: 'a', texto: 'Permitir e revisar depois.', correta: false, porque: '"desconhecido" não é "seguro".' },
            { id: 'b', texto: 'O caso mais restritivo, com log gravado antes da decisão.', correta: true, porque: 'a recusa também fica registrada; a aprovação mostra o efeito.' },
            { id: 'c', texto: 'Perguntar ao modelo se é segura.', correta: false, porque: 'o modelo é a fonte da proposta possivelmente injetada.' }
          ] },
        { tipo: 'escreva', id: 'cp-p10', titulo: 'P10 · O agente do portal do fornecedor', obrigatorio: false,
          enunciado: 'Projete as barreiras de um agente que preenche formulários num portal de fornecedor, o qual exibe mensagens de terceiros. <em>Bloco 6.</em>',
          placeholder: 'Ambiente… Entrada não confiável… Aprovação… Log…',
          rubrica: [
            '<strong>VM isolada</strong> sem credenciais reais; <strong>lista de domínios</strong>.',
            'Texto da tela como <strong>entrada não confiável</strong>.',
            '<strong>Aprovação com efeito visível</strong> antes de enviar.',
            '<strong>Log</strong> e <strong>orçamento de passos</strong>.'
          ],
          modelo: '<p>O agente roda em VM ou contêiner dedicado, sem credenciais reais nem dados sensíveis, com rede limitada a uma lista de domínios. O texto do portal, inclusive as mensagens de terceiros, é entrada não confiável (injeção indireta). Ações irreversíveis, como enviar, exigem aprovação que mostra destinatário, valor e arquivo, por um canal que a página não forje; o portão falha fechado, registra tudo antes de decidir e há orçamento de passos, tokens e tempo, com poda das capturas antigas.</p>' + reprova('confia em "instruções de segurança" no prompt.') },

        { tipo: 'escreva', id: 'cp-p11', titulo: 'P11 · O canário caiu 6 pontos', obrigatorio: false,
          enunciado: 'O canário (5% do tráfego) mostra F1 amostrado 6 pontos abaixo, em uma só janela de 100 casos. O que fazer, e o que mudar no desenho? <em>Bloco 7.</em>',
          placeholder: 'Uma janela… Confirmaria… Rollback… Mudaria…',
          rubrica: [
            'Exige <strong>duas janelas seguidas</strong> por causa do ruído amostral.',
            '<strong>Rollback por ponteiro</strong> se confirmado.',
            '<strong>Aumentar a amostra</strong>; registrar o caso na suíte.'
          ],
          modelo: '<p>Com 100 casos por hora o erro-padrão do F1 é de alguns pontos, então uma janela só pode ser ruído. Mantenho o canário, aumento a amostra e espero a segunda janela seguida; se confirmar, o roteador volta o tráfego a 0% e o ponteiro do adapter volta à versão anterior, que guardei, num rollback já ensaiado. Registro o caso na suíte e deixo os gatilhos definidos antes, não negociados na hora.</p>' + reprova('promove ignorando, ou reverte sem ter como.') },

        { tipo: 'texto', html: '<p class="ta-nota">Estado verificado em 11/10/2026: ofertas de fine-tuning por API, nomes de parâmetros de raciocínio, versões de ferramentas de uso de computador e preços são de alto risco (revalidar em até 90 dias). Preços e volumes dos exemplos de custo são hipotéticos; os números do laboratório são de execução real em 11/10/2026.</p>' },
        { tipo: 'takeaway', html: 'Latência e <mark>custo marginal</mark> decidem o raciocínio; barreiras na <mark>arquitetura</mark>; rollback por <mark>ponteiro</mark> depois de duas janelas.' }
      ] }
    ]
  });
})();
