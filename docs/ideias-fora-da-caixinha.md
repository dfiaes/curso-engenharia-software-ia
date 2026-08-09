# Ideias fora da caixinha

Produtos para depois do curso. As óbvias já estão em [`gaps-e-projetos.md`](gaps-e-projetos.md) — aqui estão as que quase ninguém está olhando.

## O filtro que usei

Descartei tudo que fosse "chatbot para X" ou "assistente de Y". Cada ideia aqui precisa passar em quatro testes:

1. **Não-obviedade** — se dez pessoas pensariam nisso lendo a mesma notícia, está fora.
2. **Vantagem sua** — usa algo que você terá e a maioria não terá: grafo, evals, MCP, .NET corporativo, contexto regulado brasileiro.
3. **Comprador com orçamento** — dor que já tem uma linha no orçamento, ou que gera multa.
4. **Suportável por uma pessoa** — o seu requisito original.

E uma observação que orienta metade da lista: em 2026 as empresas **já** adotaram IA às pressas. O que quase ninguém está construindo é a infraestrutura para essa adoção funcionar de forma confiável — governança, custo, avaliação, segurança. É a jogada de picareta e pá: você não garimpa ouro, vende pá para quem está garimpando. E é onde o seu currículo vai te deixar, porque M06, M09, M10 e M12 são exatamente essa camada.

---

# Tese 1 — Limpar a bagunça que a adoção às pressas deixou

## 1. Auditoria de sistemas de IA para setor regulado 🇧🇷

**A ideia.** Um banco, uma seguradora ou uma operadora de saúde colocou um assistente de IA em produção em 2025. Vem a auditoria interna, o compliance ou o regulador e pergunta: *como vocês sabem que isso funciona? Como sabem que não discrimina? Onde está a evidência?* Hoje a resposta é constrangedora — não existe. Você entrega o relatório de evidência: dataset de avaliação, métricas por segmento, taxa de alucinação, testes adversariais, trilha de auditoria.

**Por que é fora da caixinha.** Todo mundo está vendendo *construção* de IA. Quase ninguém está vendendo *prova de que a IA construída funciona*. E a segunda é obrigatória em setor regulado, enquanto a primeira é opcional.

**Por que você.** É o M06 aplicado, e você fala a língua do compliance de banco porque convive com ela. Um dev indie não consegue nem marcar a reunião.

**Cunha:** um relatório de auditoria, preço fechado, entregue em duas semanas. Depois vira assinatura de monitoramento contínuo — porque a métrica degrada quando o modelo muda, e o cliente descobre isso na segunda vez.

**Risco:** ciclo de venda longo. Mitigação: comece pelo seu próprio empregador, de graça, e transforme em estudo de caso.

## 2. Detecção de IA sombra e FinOps de tokens

**A ideia.** Ninguém na empresa sabe quantos times estão chamando quais APIs de LLM, quanto estão gastando, e se estão mandando dado sensível para fora. Um gateway que fica no meio revela tudo: gasto por time, por feature, por cliente; alerta de dado sensível saindo; política de qual modelo pode ser usado para quê.

**Por que é fora da caixinha.** É o problema clássico de nuvem — gasto descontrolado e recurso não governado — repetindo-se com IA, dez anos depois, e a maioria das empresas ainda não percebeu que está acontecendo. Vai virar um mercado inteiro; hoje está aberto.

**Por que você.** É literalmente o AI Gateway do M05 mais o tracing do M06, empacotado. Você constrói durante o curso.

**Cunha:** relatório gratuito de uma semana mostrando o gasto real. O número choca, e o choque vende o produto.

## 3. Red team de prompt injection como serviço

**A ideia.** A empresa colocou um agente em produção que lê e-mail, documento ou ticket do cliente. Isso significa que texto de terceiro entra no contexto do modelo — o vetor de ataque nº 1 do OWASP para LLM. Você ataca sistematicamente e entrega o relatório com o que passou.

**Por que é fora da caixinha.** Pentest tradicional não cobre isso, e a maioria dos times de segurança ainda não sabe que precisa. Existe uma janela de dois ou três anos em que quem sabe fazer isso é raro.

**Por que você.** M12, e o seu Capstone ingere código de terceiro — ou seja, você vai ter resolvido isso para si mesmo antes de vender.

**Cunha:** um relatório de ataque com prova de conceito. Sempre passa alguma coisa. Sempre.

---

# Tese 2 — Grafo onde busca vetorial nunca vai chegar

Estas são suas por construção: quase ninguém no Brasil vai sair do curso sabendo modelar grafo de conhecimento, e é exatamente o que resolve as perguntas que RAG erra.

## 4. Grafo de normativos para setor regulado 🇧🇷

**A ideia.** BACEN, CVM, ANS, ANVISA e Receita publicam normativos sem parar, e eles se referenciam, se revogam e se alteram uns aos outros em cadeia. A pergunta que ninguém consegue responder hoje é: *"a Resolução X mudou — quais dos nossos processos e sistemas são afetados, direta e indiretamente?"* Isso é travessia de grafo. Busca vetorial não tem chance: ela acha o texto parecido, não a cadeia de dependência.

**Por que é fora da caixinha.** Todo mundo tentou resolver isso com "chatbot que responde sobre a norma". O produto certo não é um chat — é um **grafo de normas conectado ao mapa dos seus sistemas**, com detecção de mudança e análise de impacto.

**Por que você.** Você vai ter as duas metades: grafo de normas (M10) e grafo de sistemas (o Capstone). A intersecção é a coisa mais defensável desta lista inteira.

**Cunha:** um só regulador, um só setor, monitoramento de mudança com alerta de impacto. Cobrança por assinatura.

**Risco:** exige curadoria de ontologia por um especialista de domínio. Mitigação: comece pelo setor que você conhece de dentro.

## 5. Grafo de conhecimento organizacional — o fator ônibus com número

**A ideia.** Derivar do histórico do Git, dos documentos e dos tickets um grafo de *quem sabe o quê*. Saída: mapa de conhecimento, cálculo de fator ônibus por módulo, e alerta quando alguém que é o único dono de uma área crítica pede demissão.

**Por que é fora da caixinha.** As empresas tratam risco de conhecimento como sensação (*"se o Fulano sair, a gente se ferra"*), não como número. Transformar sensação em métrica é o que faz um gestor comprar.

**Por que você.** É o mesmo grafo do Capstone com uma dimensão a mais: autoria. Custo marginal de construção quase zero.

**Cunha:** relatório de fator ônibus. É uma frase que qualquer CTO entende em três segundos.

## 6. Prova de equivalência em migração de sistema

**A ideia.** Uma empresa está migrando um sistema legado para uma stack nova. A pergunta que mantém o projeto parado por meses é: *"o novo faz exatamente o que o velho fazia?"* Você entrega o mapeamento de comportamento do velho (grafo + extração de regra de negócio) e uma suíte de equivalência que roda contra os dois.

**Por que é fora da caixinha.** O mercado de modernização vende **reescrita**. Quase ninguém vende **garantia**. E a garantia é o que trava a decisão de migrar.

**Por que você.** É o Capstone levado à conclusão natural, e é exatamente o tipo de projeto que a sua empresa atual tem parado em algum lugar.

**Cunha:** um módulo, um relatório de equivalência. Ticket alto, entrega curta.

---

# Tese 3 — Infraestrutura para a era dos agentes

## 7. Registro e gateway corporativo de MCP

**A ideia.** Conforme os times adotam MCP, aparece o problema clássico de governança: quais servidores estão aprovados, quem pode usar qual ferramenta, e existe log de auditoria de cada chamada? Hoje isso é o oeste selvagem. Você vende o catálogo interno, o controle de permissão e a trilha de auditoria.

**Por que é fora da caixinha.** Todo mundo está construindo servidores MCP. Quase ninguém está construindo o **controle** sobre eles. É a mesma curva do "todo mundo tem microsserviço, agora precisa de service mesh".

**Por que você.** M09 mais M12. E o timing é agressivo — daqui a dois anos isso é produto de plataforma; agora é território aberto.

**Cunha:** trilha de auditoria de chamadas de ferramenta. É o que o pessoal de segurança pede na primeira reunião.

## 8. Atestado de proveniência de código gerado por IA

**A ideia.** Registrar, por trecho de código, o que foi gerado por IA, com qual modelo, sob qual prompt, revisado por quem. Sai um atestado auditável.

**Por que é fora da caixinha.** Parece burocracia hoje. Vai deixar de parecer no primeiro incidente sério de propriedade intelectual ou de responsabilidade em setor regulado — e em ambiente de banco esse tipo de exigência aparece antes do que se imagina. É uma aposta de timing: chegar antes da regra, não depois.

**Por que você.** Trabalha em ambiente regulado e vai entender de harness e workflow de agente (M01) melhor do que o time de compliance jamais vai.

**Risco:** o mais alto da lista — pode ser cedo demais. Mantenha como opção observada, não como aposta principal.

## 9. Memória de agente como infraestrutura

**A ideia.** Todo time que constrói agente reconstrói a mesma memória mal feita: um vetor com histórico. Memória boa distingue conhecimento durável de observação temporária, tem validade temporal e é consultável por relação. Vender isso pronto, como serviço ou biblioteca.

**Por que é fora da caixinha.** Memória é tratada como detalhe de implementação. É, na verdade, o problema central de agente de longa duração — e um dos poucos temas de infraestrutura de agente ainda sem vencedor claro.

**Por que você.** M10, parte 2. É onde grafo temporal aparece.

**Cunha:** biblioteca open-source primeiro, serviço gerenciado depois. Aqui a reputação vale mais que a receita inicial — e é o caminho que menos exige inglês falado, porque tudo acontece por escrito.

---

# Tese 4 — Traduzir o que só existe na cabeça das pessoas

## 10. Seguro contra saída de especialista

**A ideia.** O sênior que domina o sistema crítico vai sair. Você entrevista essa pessoa — por áudio, ao longo de algumas sessões — e o produto transforma a conversa em especificação, documentação e diagrama, cruzando com o código real e apontando onde o que ela disse **não bate** com o que o sistema faz.

**Por que é fora da caixinha.** Ferramenta de documentação lê código. Esta lê **pessoa**, e usa o código para checar. O valor está justamente na divergência: onde a memória do especialista discorda do sistema, mora ou um bug ou uma regra de negócio não documentada. As duas coisas são caras.

**Por que você.** Capstone (código) + transcrição multimodal (M05) + evals de consistência (M06). E o gatilho de compra é uma data concreta: o aviso prévio.

**Cunha:** pacote de offboarding — quatro sessões de duas horas, entrega de documentação verificada. Ticket alto, urgência real, sem concorrente óbvio.

## 11. Compilador de conhecimento tácito para skill de agente

**A ideia.** Uma empresa tem procedimento que ninguém escreveu — como precificar, como aprovar exceção, como escalar caso. O produto observa (transcrições, tickets, decisões passadas), destila a regra implícita e emite uma skill de agente pronta, com casos de teste.

**Por que é fora da caixinha.** Todo mundo vende agente. Ninguém vende **a extração da regra que o agente deveria seguir** — e é aí que os projetos de agente morrem: não por falta de modelo, por falta de especificação.

**Por que você.** M01 (SDD) é literalmente isso, aplicado a processo de negócio em vez de software.

## 12. Diagnóstico técnico para fusão e aquisição

**A ideia.** Quando um fundo ou uma empresa compra outra, alguém precisa avaliar o ativo de software: qualidade, acoplamento, risco, dívida técnica, dependência de pessoa. Hoje isso é feito por consultor lendo código por duas semanas e escrevendo impressões. Você entrega um relatório com número — distância da sequência principal, ciclos de dependência, fator ônibus, superfície de risco.

**Por que é fora da caixinha.** É o mesmo produto do Capstone, com outra embalagem e um comprador com dez vezes mais dinheiro e cem vezes mais urgência. O prazo de *due diligence* é fixo e curto; velocidade vale preço.

**Por que você.** É o Capstone com as métricas de saúde arquitetural do M10. Zero desenvolvimento adicional — só posicionamento e uma rede de contatos diferente.

**Risco:** vender para fundo exige rede de relacionamento que você não tem. Mitigação: comece pelas boutiques de M&A e pelas consultorias que já fazem isso manualmente — venda **para** elas, não contra elas.

---

## Se eu tivesse que apostar em três

1. **Nº 10, seguro contra saída de especialista** — urgência com data marcada, ticket alto, sem concorrente óbvio, e reaproveita o Capstone quase inteiro.
2. **Nº 4, grafo de normativos** — o mais defensável, porque exige as duas metades que quase ninguém tem juntas, e é assinatura em vez de projeto.
3. **Nº 2, FinOps de tokens** — o mais fácil de começar e o que produz o número que abre porta na primeira reunião.

E todas as três se apoiam no mesmo alicerce: o grafo, os evals e o MCP que você vai construir de qualquer jeito entre o M06 e o M10. Nenhuma exige que você comece do zero depois do curso — exige que você reembale.

---

## Como testar qualquer uma delas sem escrever código

Antes de construir, sempre:

1. Escreva a dor em uma frase, do ponto de vista do cliente, **sem mencionar IA**. Se não couber em uma frase, você não entendeu a dor.
2. Converse com 10 pessoas que têm essa dor. Pergunta, não pitch: "como você resolve isso hoje? quanto tempo leva? o que já tentou?"
3. Landing page com uma promessa específica e um preço. Preço visível filtra curioso.
4. Se não conseguir 5 conversas de venda em quatro semanas, o problema é a ideia — não o marketing.

Quem valida com pelo menos 10 potenciais usuários antes de construir tem de 3 a 5 vezes mais chance de sobreviver. É a etapa que dev pula porque construir é mais divertido que conversar.
