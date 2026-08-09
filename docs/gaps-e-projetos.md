# Gaps de mercado e projetos monetizáveis

Dois grupos: o que dá dinheiro **durante** o curso, e o que dá dinheiro **depois**.

Seu alvo é triplicar o líquido: de ~R$ 8,5k para ~R$ 25k. Isso não sai de uma fonte só, e é importante ser honesto sobre isso. Sai da soma de: salário melhor no emprego atual (ou em outro), um fio de consultoria, e um produto crescendo devagar.

---

# Grupo 1 — Monetizável durante o curso

Ordenado por quando fica possível. Todos aproveitam o que você já é: sênior .NET em ambiente corporativo.

### 1. Servidor MCP corporativo · a partir do M07 (~mês 3) · R$ 3-15k por projeto

**O gap:** empresas querem que os desenvolvedores usem Copilot/Claude/Cursor com contexto dos sistemas internos — Azure DevOps, wiki, base de conhecimento, banco de dados. Quase ninguém sabe construir o servidor MCP que faz a ponte. É o item mais pedido em consultoria de IA hoje, e a barreira técnica é baixa **depois** que você entende o protocolo.

**Por que você:** já está dentro de uma empresa com essa dor. O primeiro cliente é o seu próprio empregador, e não precisa ser um contrato — pode ser o projeto que te promove.

**Como começa:** o exercício do M07 é literalmente isso. Você entrega, mede o tempo economizado pelo time, e escreve o caso.

### 2. Assessment de sistema legado · a partir do M08 (~mês 4) · R$ 8-30k por assessment

**O gap:** toda empresa média tem um sistema que ninguém entende e todos têm medo de mexer. Hoje, isso é resolvido com consultoria cara de semanas de leitura manual. Com o Cartógrafo, vira dias.

**Por que você:** é exatamente o mundo em que trabalha. Você fala a língua do cliente.

**Como começa:** faça o assessment do sistema da sua própria empresa primeiro, de graça. Ele vira o estudo de caso que vende o segundo.

### 3. Suíte de avaliação de IA para times que já colocaram IA em produção · a partir do M04 (~mês 2) · R$ 5-20k

**O gap:** muita empresa colocou chatbot ou assistente em produção em 2024-2025 e não faz ideia se está funcionando. Não têm eval, não têm tracing, não sabem o custo por conversa. É um gap constrangedor e caro, e quem sabe resolver é raro — "eval literacy" é o principal sinal de contratação de IA em 2026 justamente porque falta gente.

**Por que você:** é o módulo mais subestimado do curso e o mais vendável cedo.

### 4. Conteúdo técnico em português · a partir do M03, contínuo · R$ 0 no começo, composto depois

**O gap:** conteúdo de engenharia de IA em português é 90% superficial — "como fazer um chatbot com LangChain". Não existe quase nada sério sobre evals, GraphRAG, context engineering ou custo em produção.

**Por que fazer mesmo sem receita direta:** é o que gera inbound para os itens 1, 2 e 3, e é o que faz você virar nome conhecido sem precisar falar inglês em call. Um post por módulo, contando o que construiu e mostrando números. Onze posts em seis meses.

---

# Grupo 2 — Produtos para depois da formação

### A. Cartógrafo self-serve — o capstone virando produto

Cunha: relatório de arquitetura por repositório, sem cadastro complicado, sem call.
Público: desenvolvedores herdando sistema legado, agências fazendo due diligence técnica, consultores de modernização.
Modelo: por repositório analisado, ou assinatura por repositório monitorado.
Fosso: o grafo acumulado e as heurísticas de risco que só se aprende olhando muitos sistemas reais.

### B. Orçamento e proposta com IA para prestadores de serviço

A tese completa está no anexo do GPT e no `projeto-final.md`. Continua sendo a maior oportunidade **de mercado** da lista — mercado enorme, dor perto do dinheiro, expansão natural para cobrança e pagamento. O que falta é você: nenhuma vantagem de domínio, e o gargalo é distribuição para PME brasileira, não engenharia.

**Quando faz sentido:** depois do M11, quando você quiser aprender o jogo de distribuição. Ou nunca, se preferir jogar onde tem vantagem.

### C. Recuperação de recebíveis com IA (dunning)

Régua de cobrança inteligente: lembrete por WhatsApp/e-mail, promessa de pagamento, reenvio de link, painel de atraso. Margem de 70-90% e receita atrelada à receita do cliente — quando funciona, o cliente não cancela. É a expansão natural do produto B, e um dos nichos mais consistentemente lucrativos para fundador solo.

### D. Copiloto de journaling de trades

Detalhado no `projeto-final.md`. Fim de semana, não capstone. Só volta ao radar se o pilar de trading voltar ao primeiro plano.

### E. Gerador de documentação viva para times .NET

Irmão menor do Cartógrafo, mais fácil de vender self-serve: conecta no repo, mantém a documentação de arquitetura atualizada a cada PR, e comenta no PR quando uma mudança contradiz a documentação. Assinatura por repositório. Dor pequena mas eterna, e o produto se vende sozinho depois do primeiro PR comentado.

---

## Como escolher, quando chegar a hora

Antes de escrever uma linha de código de qualquer produto:

1. Escreva a dor em uma frase, do ponto de vista do cliente, sem mencionar IA.
2. Converse com 10 pessoas que têm essa dor. Não pitch — pergunta. "Como você resolve isso hoje? Quanto tempo leva? O que já tentou?"
3. Landing page com uma promessa específica. Se não conseguir 50 e-mails ou 5 pré-vendas, o problema é a ideia, não o marketing.
4. Só então construa — e cobre desde o primeiro cliente, mesmo que pouco. Produto de graça não dá sinal nenhum.

Quem valida com pelo menos 10 potenciais usuários antes de construir tem 3 a 5x mais chance de sobreviver. É a etapa que dev pula porque construir é mais divertido que conversar.

---

## Referência de esforço vs. retorno

| Projeto | Quando | Esforço | Retorno provável | Risco |
|---|---|---|---|---|
| Servidor MCP corporativo | mês 3 | baixo | médio, rápido | baixo |
| Suíte de evals para terceiros | mês 2-3 | médio | médio-alto | baixo |
| Assessment de legado | mês 4 | médio | alto por projeto | médio |
| Conteúdo técnico em PT | contínuo | baixo, constante | indireto, composto | nenhum |
| Cartógrafo self-serve | mês 6+ | alto | alto se pegar | médio |
| Orçamento com IA | mês 8+ | alto | alto se distribuir | alto |
| Dunning | mês 10+ | médio | alto, recorrente | médio |

**O caminho de menor risco para o seu 3x:** MCP corporativo e evals dentro da empresa → visibilidade e promoção → assessment de legado como consultoria pontual → Cartógrafo como produto. Nessa ordem, cada etapa financia e valida a seguinte, e nenhuma exige que você largue o emprego ou fale inglês em call.
