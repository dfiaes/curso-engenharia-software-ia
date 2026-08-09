# Projeto final — as 3 opções e minha recomendação

Você pediu para eu decidir depois da pesquisa, sem esquecer as opções dos contextos anteriores. Aqui está o resultado.

## O que a pesquisa mudou na minha cabeça

Três achados que descartam metade das ideias que estavam na mesa:

1. **Wrapper fino morreu.** Investidores pararam de financiar produto que é só interface sobre API de modelo, e o mercado de usuário também percebeu. O que sobrevive em 2026 é **IA vertical com conhecimento de domínio embutido** — e o fundador solo com domínio real + engenharia sólida é justamente o perfil que consegue R$ 1,5-2,5M de ARR em 12-18 meses nesse modelo.
2. **A vantagem tem que ser sua, não do modelo.** Todo mundo tem acesso ao mesmo GPT/Claude. O fosso é dado proprietário, fluxo de trabalho específico ou domínio que você viveu.
3. **Micro-SaaS lucrativo de fundador solo é estreito, recorrente e suportável por uma pessoa.** Média de US$ 5-50k MRR, 95% lucrativos no primeiro ano justamente porque o custo operacional é mínimo.

Cruzando isso com o seu perfil, uma coisa salta: **você trabalha há anos dentro de .NET corporativo em ambiente regulado.** Isso não é um detalhe do seu currículo, é o ativo mais escasso que você tem. Praticamente nenhum indie hacker tem acesso a esse contexto, e é um mercado onde o cliente tem orçamento.

---

## Opção A — Cartógrafo: inteligência sobre bases de código legadas ⭐ **recomendada**

**O que é.** Você aponta a ferramenta para um repositório legado sem documentação e ela devolve: mapa de arquitetura, grafo de dependências, documentação gerada e verificada, pontos de acoplamento perigoso, código morto, e análise de risco de modernização. Depois vira um assistente que responde perguntas sobre o sistema — inclusive dentro do editor, via MCP.

> **Nota sobre linguagem.** O produto é **agnóstico de linguagem** por design — o parser é um plugin. C#/.NET é apenas o **primeiro** parser, porque é o corpus real ao qual você tem acesso hoje para treinar e validar. O segundo parser (Java ou TypeScript, via tree-sitter) entra no M13 e é o que prova a arquitetura. Isto não é um produto .NET, e construí-lo não te ancora no .NET: a ferramenta inteira é escrita em Python.

**Por que é a escolha certa para você:**

- **Domínio que só você tem.** Você não vai pesquisar essa dor, você vive nela.
- **Serve o objetivo nº 1 imediatamente.** Você disse que a prioridade é subir de nível no emprego atual. Uma ferramenta que documenta e mapeia o sistema legado da sua empresa te torna, em semanas, a pessoa que resolve o problema que todo mundo evita. Isso é visibilidade real, não teoria.
- **É o exercício técnico perfeito para o currículo.** Um grafo de dependências de código é o caso canônico de GraphRAG. "O que quebra se eu alterar esta tabela?" é impossível com busca vetorial e trivial com travessia de grafo. Você vai aprender graph engineering onde ele é obviamente superior, não com exemplo de brinquedo.
- **Tem verdade verificável — logo, evals de verdade.** Diferente de resumo de texto, aqui existe resposta certa: ou o método é chamado por aquelas 7 classes, ou não é. Isso te permite construir uma suíte de avaliação séria (M04), que é o principal sinal de contratação de IA em 2026.
- **Já é vendável em três formatos:** consultoria de assessment de legado (ticket alto, começa amanhã), self-serve por repositório (baixo suporte, seu requisito), e servidor MCP corporativo (o item mais pedido em consultoria de IA hoje).
- **É o portfólio mais forte possível.** "Construí um sistema de GraphRAG sobre código-fonte com evals na CI, servidor MCP e orquestração durável" é uma frase que abre porta em entrevista sênior. E você consegue defender cada decisão porque construiu.

**Riscos e como mitigo:** parsing de C# é trabalhoso — resolvemos com Roslyn via CLI ou tree-sitter, não escrevendo parser. Venda para banco é lenta — por isso o produto self-serve mira desenvolvedores, agências e consultores fazendo assessment de legado, não o departamento de compras do banco. E não subimos código de cliente para lugar nenhum sem opção de processamento local: isso vira feature de venda, não obstáculo.

**Cunha inicial (o MVP que cabe no M11):** "aponte para um repositório .NET, receba um relatório de arquitetura + mapa de dependências + top 10 riscos de modernização". Preço por repositório. Sem onboarding, sem call.

---

## Opção B — Orçamento e proposta com IA para prestadores de serviço

**O que é.** A tese do documento que o GPT te passou: prestador manda áudio, foto ou texto → IA extrai escopo → calcula custo, preço e margem → gera proposta em PDF → link de pagamento. WhatsApp-first.

**A favor:** mercado enorme e mal atendido (só ~5% das PMEs brasileiras usam SaaS; a maioria vive de planilha e WhatsApp), dor perto do dinheiro, fluxo simples de explicar, expansão natural para cobrança e pagamentos.

**Contra, no seu caso específico:** você não tem vantagem de domínio nenhuma aqui — precisaria construí-la do zero conversando com pedreiros, instaladores e agências. É um produto de venda em volume com ticket baixo, o que significa que **distribuição**, não engenharia, é o gargalo. Marketing para PME brasileira é um ofício inteiro que você teria que aprender **em paralelo** ao curso. E tecnicamente ele exercita menos o currículo: usa RAG e agente, mas grafo é forçado.

**Veredito:** é a melhor ideia de negócio da lista **para outra pessoa**. Para você agora, é o produto nº 2 — depois que a formação estiver madura e o Cartógrafo tiver validado o processo de lançamento.

---

## Opção C — Copiloto de journaling e revisão de trades

**O que é.** A ideia que já estava no seu plano antigo: recebe seus trades, detecta o setup automaticamente (liquidity sweep, POI, CVD), gera revisão pós-trade e analisa padrões de acerto/erro. Você já construiu protótipos (POI Extremo + Decisional, NexusScanner).

**A favor:** você é o criador e o usuário mais exigente — validação instantânea. Reaproveita ativo que já existe. E resolve, de quebra, a disciplina de journaling que o seu pilar de trading exige de qualquer forma.

**Contra:** nicho pequeno com público de baixa disposição a pagar recorrência, mercado saturado de "ferramenta para trader", e — o mais importante — você mesmo colocou trading em segundo plano. Construir produto para um domínio que você despriorizou é tocar duas frentes ao mesmo tempo.

**Veredito:** vira **mini-projeto de fim de semana**, não capstone. Se um dia o pilar de trading voltar ao primeiro plano, ele já estará meio construído.

---

## Recomendação final

**Capstone = Opção A (Cartógrafo).**
**Opção B = produto nº 2**, no `docs/gaps-e-projetos.md`, para quando você tiver a formação e quiser um jogo de distribuição em vez de um jogo de domínio.
**Opção C = mini-projeto**, quando quiser um fim de semana leve.

Se você discordar, diga — a estrutura do curso não muda, só as peças que cada módulo entrega. Mas defendo A com convicção: é a única das três em que a sua história profissional vira vantagem competitiva em vez de irrelevância.

---

## Arquitetura do Cartógrafo, e como cada módulo a constrói

```
                     ┌─────────────────────────────────────┐
   repositório  ───▶ │  Ingestão (M02)                     │
   .NET             │  clone, walk, filtro, fila           │
                     └────────────────┬────────────────────┘
                                      ▼
                     ┌─────────────────────────────────────┐
                     │  Parse determinístico (M08)         │
                     │  Roslyn/tree-sitter → símbolos,     │
                     │  referências, SQL embutido           │
                     └────────┬───────────────────┬────────┘
                              ▼                   ▼
              ┌──────────────────────┐  ┌────────────────────────┐
              │ Grafo (M08)          │  │ Índice híbrido (M05)   │
              │ Postgres+AGE ou Neo4j│  │ pgvector + BM25 + rerank│
              └──────────┬───────────┘  └───────────┬────────────┘
                         └────────────┬─────────────┘
                                      ▼
                     ┌─────────────────────────────────────┐
                     │  Agente investigador (M06)          │
                     │  ferramentas: buscar, ler,          │
                     │  travessia de grafo, perguntar      │
                     └────────────────┬────────────────────┘
                                      ▼
                     ┌─────────────────────────────────────┐
                     │  Orquestrador durável (M08)         │
                     │  LangGraph + checkpoint + HITL      │
                     └────────────────┬────────────────────┘
                    ┌─────────────────┼──────────────────┐
                    ▼                 ▼                  ▼
         ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
         │ Relatório    │   │ Servidor MCP │   │ API + UI (M02)   │
         │ (M03)        │   │ (M07)        │   │                  │
         └──────────────┘   └──────────────┘   └──────────────────┘

    Transversal:  Evals na CI (M04) · Custo e tracing (M03/M04)
                  Multi-tenant, RLS, billing, segurança (M10)
```

**Regra de ouro da arquitetura:** o que é determinístico fica determinístico. Parse de código, resolução de referências e travessia de grafo são feitos por ferramenta, **não** por LLM. O modelo entra para explicar, priorizar e conversar. Isso derruba custo, elimina alucinação estrutural e é exatamente o julgamento arquitetural que separa engenheiro de IA sênior de quem só chama API.

---

## As sete versões — o produto cresce, você não recomeça

Não construa dez protótipos pequenos. Construa **um sistema que evolui**, uma camada por vez, cada uma amarrada a um módulo. É assim que se aprende arquitetura: vendo o que quebra quando você adiciona a camada seguinte.

| v | O que entra | Módulo | O que você aprende quando quebra |
|---|---|---|---|
| **v1** | RAG simples sobre o código: pergunta → busca → resposta | M07 | que busca vetorial não responde pergunta estrutural |
| **v2** | tools reais: buscar símbolo, ler arquivo, listar referências | M08 | que design de ferramenta é design de API, e que dez ferramentas é demais |
| **v3** | agente com loop, orçamento de passos e critério de parada | M08 | que agente sem critério de parada queima orçamento |
| **v4** | grafo de conhecimento + métricas de acoplamento | M10 | que travessia de grafo responde o que o vetor nunca respondeu |
| **v5** | workflow durável: checkpoint, retomada, human-in-the-loop | M10 | que ingestão de repositório grande falha no meio, sempre |
| **v6** | memória: estado curto, histórico de sessão, conhecimento durável | M10 | a diferença entre observação temporária e fato |
| **v7** | os seis datasets de eval + tracing + custo por análise | M06, M12 | que você não sabia se estava funcionando |

Note que o M06 (evals) aparece cedo no currículo e tarde nesta tabela **de propósito**: você constrói a suíte no M06 sobre um componente pequeno, e ela cresce junto com o produto. Evals que chegam no fim viram teatro. Evals que nascem junto viram gate.

---

## Perguntas que o produto tem que responder (e que definem "pronto")

Nível 1 — busca (RAG resolve, M05):
- "Onde está a regra de cálculo de juros?"
- "Como funciona a autenticação neste sistema?"

Nível 2 — estrutura (só grafo resolve, M08):
- "O que quebra se eu alterar a assinatura deste método?"
- "Quais telas dependem, direta ou indiretamente, desta tabela?"
- "Que código está morto — sem nenhum caminho de chamada a partir de um entry point?"
- "Onde estão os ciclos de dependência entre módulos?"

Nível 3 — julgamento (agente + grafo + LLM, M06+M08):
- "Se eu for extrair um microsserviço deste monólito, qual é a fronteira de menor acoplamento?"
- "Qual a ordem de menor risco para modernizar estes 40 arquivos?"

Se o produto responde bem o nível 2, ele já é vendável. O nível 3 é o que faz ele valer preço de consultoria.
