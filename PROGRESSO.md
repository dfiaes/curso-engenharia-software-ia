# Progresso

Atualize ao fim de **todo** bloco de 2h. Três linhas bastam. Nunca pule — é isso que permite retomar depois de uma pausa sem perder o fio.

Método completo em [`docs/como-estudar.md`](docs/como-estudar.md).

## Estado atual

- **Módulo:** M00 · Ferramental
- **Bloco:** 3 de 5
- **Última sessão:** 2026-08-11
- **Próximo passo:** estudar `modulos/M00-ferramental/bloco-4-mcp-e-hooks.html`, montar o servidor MCP, instalar os dois hooks e rodar os 4 experimentos
- **Travado em:** —

## Placar

| Módulo | Blocos | Checkpoint | Data |
|---|---|---|---|
| M00 Ferramental: as 5 primitivas | 3/5 | ☐ | 2026-08-11 |
| M01 Workflow IA-driven: SDD + Harness | 0/5 | ☐ | |
| M02 Python vindo de C# | 0/6 | ☐ | |
| M03 FastAPI, Postgres, Docker, CI | 0/8 | ☐ | |
| M04 Design Docs com IA | 0/4 | ☐ | |
| M05 LLM: contrato, custo, gateway, cache | 0/7 | ☐ | |
| M06 Evals e observabilidade | 0/6 | ☐ | |
| M07 RAG | 0/8 | ☐ | |
| M08 Agentes | 0/8 | ☐ | |
| M09 Protocolos: MCP e A2A | 0/7 | ☐ | |
| M10 Graph engineering + saúde arquitetural | 0/10 | ☐ | |
| M11 Fundamentos ML/DL + modelos locais | 0/8 | ☐ | |
| M12 Produção: segurança, billing, SRE com IA | 0/9 | ☐ | |
| M13 Capstone | 0/20 | ☐ | |

**Total:** 3 / 135 blocos (270h)
**ADRs escritos:** 0 / 25
**Posts publicados:** 0 / 14

### Avaliações periódicas

| Quando | O quê | Feito |
|---|---|---|
| após M02 | Revisão em espiral 1 | ☐ |
| após M04 | **Defesa técnica — Fase 0+1** | ☐ |
| após M07 | Revisão em espiral 2, **depois** a defesa abaixo | ☐ |
| após M07 | **Defesa técnica — Fase 2** | ☐ |
| após M10 | Revisão em espiral 3 | ☐ |
| após M10 | **Defesa técnica — Fase 3** | ☐ |
| após M12 | **Defesa técnica — Fase 4** | ☐ |

---

## Diário

### 2026-08-11 · M00 · bloco 3
**Fiz:** construí o subagente `cacador-de-gap` e rodei no projeto Polímero (.NET legado). Errei o caminho primeiro — coloquei em pasta, como skill; subagente é arquivo solto em `.claude/agents/nome.md`.
**Entendi:** a linha `tools:` é fronteira de capacidade, não configuração. **Com** a lista restrita, ele pediu permissão só para Read/Grep/Glob. **Sem** a linha, herdou tudo — pediu autorização para ferramentas além das três, inclusive escrita e shell. Confirmado na prática: omitir `tools:` = privilégio total.
**Também vi:** o agente principal sem restrição rodou 10 comandos de shell e escreveu um relatório de 376 linhas em disco. O subagente restrito não conseguiria — e isso é o comportamento correto quando o material lido é de terceiro.
**Travei em:** o subagente não era reconhecido. Causa: convenção de pasta trocada.
**Próximo passo:** bloco 4 — MCP e hooks.

### 2026-08-10 · M00 · bloco 2
**Fiz:** critiquei o `CLAUDE.md`; construí a skill `revisor-dotnet-para-python`; criei `pratica-1.py` como caso de teste proposital; rodei v1, analisei a falha, escrevi a v2.
**Entendi:** instrução em prompt é pedido, não garantia. A v1 mandava "não reescreva" e o agente reescreveu tudo. O que fez a v2 funcionar: dar destino positivo para a ajuda, limite contável, repetir a restrição no final do arquivo, e — o mais forte — mostrar um exemplo do formato certo em vez de proibir o errado.
**Também entendi:** instrução incondicional ("elogie o que estiver bom") em contexto onde a condição não existe **força o modelo a inventar**. Tornei condicional.
**Travei em:** transformar as quatro observações em texto de skill. Destravou com direção sobre mecanismos, não com resposta pronta.
**Resultado da v2:** 4/4 — sem código corrigido, sem elogio fabricado, sem o erro do `range()`, e suficiente para eu corrigir sozinho.
**Próximo passo:** construir `.claude/agents/cacador-de-gap.md` e rodar nos projetos .NET próprios.

### Modelo (copie a cada bloco)

```
### AAAA-MM-DD · M0X · bloco N
**Fiz:**
**Entendi:**
**Travei em:**
**Errei na recuperação ativa:**   ← vai para a revisão do próximo bloco
**Próximo passo:** (imperativo, específico, com nome de arquivo)
**As 3 perguntas de sênior:** (a partir do M03)
  - concorrência:
  - falha da dependência externa:
  - versionamento/rollback:
```

### 2026-08-10 · M00 · bloco 1
**Fiz:** Aprendi sobre o bloco 1: isolamento de contexto nas LLMs
**Entendi:** O isolamento de contexto compra espaço (menos tokens consumidos) e custa a capacidade de ver relações entre as partes isoladas (loss de coerência entre decisões distantes)
**Travei em:** Dinâmica do curso e estrutura dos arquivos markdown — não li o conteúdo das aulas previamente e tive dificuldade de responder questionamentos aqui no chat
**Errei na recuperação ativa:** Falta de leitura prévia dos arquivos README e roteiro dos módulos
**Próximo passo:** Ler integralmente `modulos/M00-ferramental/README.md` antes de começar o bloco 2
**As 3 perguntas de sênior:** (não aplicável para M00)

---

## Lista de revisão

O que você errou na recuperação ativa e ainda não recuperou. Esvaziar é o objetivo.

- [ ] **Mecanismo mais forte para fazer o modelo obedecer** — respondi "negrito / instrução mandatória"; isso era a v1 que falhou. Certo: **mostrar um exemplo do formato correto**. O modelo imita formato melhor do que obedece regra. (bloco 2)
- [ ] **Custo de externalizar** — respondi "não vejo custo". Certo: só ajuda se o agente **decidir buscar** na hora certa. É o modo de falha do RAG. (bloco 1)
- [ ] **Por que `description` é a linha mais importante** — sabia o quê, não o porquê. É o **gatilho**: o modelo compara a tarefa contra ela para decidir carregar. (bloco 2) Importância de ler os arquivos README dos módulos **antes** de iniciar os blocos
- [ ] Dinâmica de navegação entre `CLAUDE.md` → `docs/como-estudar.md` → `modulos/MXX/README.md`
- [ ] Conceito de isolamento de contexto: trade-off entre espaço (tokens) e coerência

---

## Linha de base — antes de começar

Preencha no M00, depois de rodar o `caçador-de-gap` nos seus projetos .NET. Daqui a seis meses vai ser divertido de reler.

**O que eu não sabia em (data):**
-

**O que eu achava que sabia e não sabia:**
-
