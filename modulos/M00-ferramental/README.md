# M00 · Ferramental de IA como aluno e como dev

**3 blocos de 2h** · Pré-requisito: nenhum · Comece por aqui, hoje.

---

## Por que este módulo existe

Você usa Copilot em modo chat no Visual Studio. Isso significa que hoje sua interação com IA é: você pergunta, ela responde, você copia. Um ciclo por vez, contexto que morre a cada aba.

O que mudou é o **agente**: uma IA que lê o repositório inteiro, edita múltiplos arquivos, roda os testes, vê que quebrou, e conserta — sem você no meio de cada passo. A diferença de produtividade não é 20%, é multiplicativa. Mas ela só aparece se você souber configurar o contexto. Agente mal configurado é pior que chat, porque erra mais rápido e em mais arquivos.

Este módulo é meta: você aprende a ferramenta que vai usar nos outros onze módulos. É o único módulo que se paga já no primeiro dia.

---

## Bloco 1 · O conceito que ninguém explica: contexto é recurso escasso

### Leitura (15 min)

Leia estes dois textos da Anthropic. Estão em inglês — parte da trilha paralela.

1. [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)
2. [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

### O que você precisa tirar deles

**Context engineering** é a disciplina de achar o menor conjunto de tokens de alto sinal que produz o resultado desejado.

A analogia que funciona vindo de .NET: **contexto é memória gerenciada.** Você não aloca tudo que existe — você carrega o que precisa, quando precisa, e libera o resto. "Jogar o repositório inteiro no prompt" é o equivalente a carregar um dataset de 10 GB em memória para ler três linhas. Funciona no exemplo pequeno e explode em produção.

Duas consequências práticas:

- **Context rot.** Quanto mais tokens irrelevantes no contexto, pior o desempenho do modelo — mesmo estando dentro da janela. Contexto maior não é contexto melhor.
- **Just-in-time > pré-carregar.** O agente bom busca informação quando descobre que precisa, em vez de receber tudo antecipadamente. É lazy loading.

**Workflow vs. agente** — a distinção mais importante do primeiro texto:

| | Workflow | Agente |
|---|---|---|
| Caminho | você define no código | o modelo decide |
| Previsível | sim | não |
| Custo | conhecido | variável |
| Depuração | fácil | difícil |
| Quando usar | tarefa conhecida e repetível | tarefa aberta, número de passos desconhecido |

**A regra:** comece sempre por workflow. Só vá para agente quando o workflow não der conta. A maioria dos sistemas de produção que se dizem "agênticos" seria mais barata, mais rápida e mais confiável como workflow. Isso vai ser cobrado de você no M06.

---

## Bloco 2 · As cinco primitivas, e quando usar cada uma

Instale o Claude Code (ou Codex, se preferir — os conceitos são os mesmos) e trabalhe **neste repositório**.

### O mapa mental

| Primitiva | Serve para | Equivalente mental em .NET | Custo de contexto |
|---|---|---|---|
| `CLAUDE.md` | constituição do repo, lida toda sessão | guia de arquitetura executável | sempre carregado — mantenha curto |
| **Skill** (`SKILL.md`) | **como fazer** algo com lógica de domínio | classe de serviço carregada sob demanda | carregada só quando relevante |
| **Subagente** | **delegar** trabalho isolado ou paralelo | processo separado com escopo próprio | contexto próprio, não polui o seu |
| **MCP** | **acessar** sistema externo | cliente de API padronizado | descrições das ferramentas ficam sempre no contexto |
| **Hook / slash command** | automação determinística e template | build event / script | mínimo |

**A regra de três palavras, decore:**
> **Skill = como fazer · MCP = acesso a · Subagente = delegar para**

O erro mais comum de quem começa é fazer tudo virar MCP. MCP custa contexto permanente — cada ferramenta registrada ocupa espaço em toda mensagem. Cinco MCPs pesados e você já degradou o agente antes de escrever a primeira instrução.

### Prática

Leia o `CLAUDE.md` da raiz deste repositório. Depois:

1. **Critique-o.** O que está genérico demais? O que falta sobre você que eu não sei? Edite. Este arquivo é seu, não meu.
2. Rode o agente neste repositório e peça algo simples. Observe **o que ele leu** antes de responder. Isso é o mais instrutivo do módulo.

---

## Bloco 3 · Construir suas primeiras extensões

### Mini-projeto: skill `revisor-dotnet-para-python`

Crie `.claude/skills/revisor-dotnet-para-python/SKILL.md`. Ela deve fazer qualquer agente revisar seu código Python caçando os vícios que você vai trazer do C#:

- classe onde uma função bastava
- `getters`/`setters` em vez de atributo público
- laço `for i in range(len(x))` em vez de iterar direto
- `try/except` genérico como fluxo de controle
- código bloqueante dentro de `async def` ← o mais caro de todos
- ausência de type hints
- interface abstrata onde `Protocol` resolve

Comece com um esqueleto assim:

```markdown
---
name: revisor-dotnet-para-python
description: Revisa código Python escrito por dev vindo de C#/.NET, apontando padrões que são idiomáticos em C# mas errados ou não-idiomáticos em Python. Use ao revisar qualquer arquivo .py deste repositório.
---

# Revisor .NET → Python

Você está revisando código de um dev sênior .NET aprendendo Python.
Ele escreve código correto, mas com sotaque de C#.

## Como revisar
Para cada problema encontrado, produza:
- **Onde:** arquivo e linha
- **O sotaque:** que padrão de C# está sendo transplantado
- **O idiomático:** como um sênior de Python escreveria
- **Por quê:** a razão técnica, não "é a convenção"

Não reescreva o arquivo. Aponte, explique, e deixe ele corrigir.
Elogie o que estiver idiomático — ele precisa saber o que já acertou.

## Catálogo de sotaques
[...preencha conforme for descobrindo os seus...]
```

Esse catálogo vai crescer o curso inteiro. É o seu registro pessoal de aprendizado.

### Exercício (sem pista até você pedir)

Crie um subagente `caçador-de-gap` que:
- recebe um caminho de repositório,
- percorre os arquivos,
- e devolve uma lista do que um engenheiro sênior de 2026 acharia desatualizado ou frágil.

Rode nos **seus próprios projetos .NET**. Não para consertá-los — para você ver, com olhos externos, onde está o seu gap real. O resultado disso é a sua linha de base pessoal: guarde em `PROGRESSO.md`.

Dica de escopo: o subagente precisa de contexto próprio e ferramentas só de leitura. Pense por que **só de leitura** importa aqui — isso volta no M10, quando falarmos de segurança de agentes.

---

## Checkpoint

Só avance para o M01 depois de responder isto **sem consultar**:

1. Por que "gerar relatório de arquitetura no formato da empresa" é uma **skill** e não um **MCP**?
2. Por que "revisar 40 arquivos" é um **subagente** e não uma **skill**?
3. Você tem um agente que precisa consultar o Jira. Skill, MCP ou subagente? Por quê?
4. Explique, com a analogia de memória gerenciada, por que registrar 8 servidores MCP pode piorar o desempenho do agente mesmo que você nunca use 7 deles.
5. Cite uma tarefa do seu trabalho atual que você achava que precisava de agente e que, depois deste módulo, você percebeu que é workflow.

No chat: `Checkpoint M00`. Eu aplico e digo se libera.

---

## Entregáveis deste módulo

- [ ] `CLAUDE.md` da raiz editado por você, com as suas informações
- [ ] `.claude/skills/revisor-dotnet-para-python/SKILL.md` funcionando
- [ ] Subagente `caçador-de-gap` funcionando
- [ ] Linha de base pessoal registrada no `PROGRESSO.md`
- [ ] ADR `0001-escolha-do-agente-de-codificacao.md` — por que Claude Code, Codex ou Cursor
- [ ] Checkpoint aprovado
