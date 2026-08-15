# Auditoria do M00 — Ferramental de IA e harness engineering

**Data-base:** 14/08/2026 · **Estado anterior:** material utilizável apenas com ressalvas · **Decisão:** REGENERAR

## 1. Escopo auditado

- `modulos/M00-ferramental/M00.html`;
- `modulos/M00-ferramental/README.md`;
- `modulos/M00-ferramental/bloco-4-mcp-e-hooks.html`;
- coerência com `CURRICULO.md`, `docs/mapa-conceitual.md` e `AIW-01` da matriz;
- atualidade das convenções de Codex, Claude Code, GitHub Copilot, Agent Skills e MCP;
- existência de práticas executáveis, resultados observáveis e gates.

Baseline do HTML principal: 2.968 palavras visíveis, 5 blocos, 10 blocos de código, 0 resultados esperados explícitos e 4 links externos. O complemento de MCP é maior, porém repete parte do módulo e contém instruções incompatíveis com a linha estável atual do SDK.

## 2. O que deve ser preservado

- contexto é recurso finito e deve conter sinal, não volume;
- começar por workflow determinístico e justificar a autonomia;
- instruções sempre carregadas devem ser curtas e específicas;
- skills servem para conhecimento/procedimento sob demanda;
- delegação serve para isolamento de contexto, permissões ou paralelismo;
- hooks são adequados quando o evento e a ação devem ser determinísticos;
- ferramentas que leem conteúdo não confiável devem operar com menor privilégio;
- o aluno precisa observar o que o agente leu, executou e verificou.

## 3. Achados bloqueantes

| ID | Severidade | Achado | Evidência | Tratamento |
|---|---|---|---|---|
| M00-AUD-01 | P0 | SDK MCP desatualizado | complemento afirma `mcp.server.mcpserver`; o SDK Python v2 estável documenta `from mcp.server import MCPServer` | reescrever exemplo e fixar `mcp>=2,<3` |
| M00-AUD-02 | P0 | protocolo MCP antigo | texto ensina handshake e sessão como invariantes; MCP 2026-07-28 tornou o núcleo stateless e retirou `initialize`/`initialized` e `Mcp-Session-Id` | ensinar revisão 2026-07-28 e sinalizar evolução |
| M00-AUD-03 | P0 | prática principal presa ao Claude Code | entregáveis exigem `.claude/*`, `CLAUDE.md` e CLI específica | adotar `AGENTS.md`, Agent Skills e contrato de harness como núcleo; mapas por produto ficam em adapters |
| M00-AUD-04 | P1 | “LLM é método estático puro” é absoluto e incorreto | amostragem pode variar a saída; clientes e serviços podem persistir estado e aplicar cache | manter apenas como modelo mental limitado para a entrada da inferência |
| M00-AUD-05 | P1 | promessa de produtividade não sustentada | README afirma ganho “multiplicativo” e “se paga no primeiro dia” | substituir por evidência DORA: IA amplifica forças e fraquezas do sistema |
| M00-AUD-06 | P1 | ausência de laboratório verificável | HTML não possui suíte local nem resultado reproduzível | criar laboratório Python sem dependência de provedor e testes automatizados |
| M00-AUD-07 | P1 | segurança apresentada como lista, não propriedade | menor privilégio não era testado e o experimento sugeria remover restrições | validar path, capacidade, conteúdo não confiável e comandos por código determinístico |
| M00-AUD-08 | P1 | custo de contexto tratado como universal | “todas as tools ficam em toda mensagem” depende do harness, busca de tools e implementação | ensinar descoberta, catálogo e custo como comportamento mensurável, não axioma |
| M00-AUD-09 | P2 | comando separado de skill como primitiva universal | no Claude Code atual comandos customizados foram incorporados às skills; outros produtos diferem | tratar comando como interface de invocação, não categoria universal |
| M00-AUD-10 | P2 | duplicação editorial | HTML principal, README e complemento divergem em profundidade e versão | README vira guia de execução; HTML vira fonte didática; complemento fica legado sinalizado |

## 4. Lacunas em relação ao currículo e ao mercado de 2026

1. Separação explícita entre **modelo, harness, agente, workflow, tool, protocolo e produto**.
2. Contrato de trabalho com escopo, autoridade, orçamento, critérios de conclusão e evidência.
3. Portabilidade real entre Codex, Claude Code e GitHub Copilot, sem afirmar equivalência total.
4. Agent Skills como padrão aberto, com progressive disclosure e validação estrutural.
5. MCP 2026-07-28, SDK Python v2, diferença entre tool/resource/prompt e risco de interoperabilidade.
6. Sandbox, aprovação, allowlist de rede, segredo e conteúdo não confiável como fronteiras independentes.
7. Ciclo sênior: orientar → inspecionar → planejar → alterar → verificar → revisar diff → registrar evidência.
8. Avaliação do harness por tarefas repetíveis, não pela impressão de uma conversa bem-sucedida.
9. Diagnóstico de falhas por camada: instrução, seleção de contexto, permissão, ferramenta, ambiente, modelo ou critério de aceitação.
10. Política para dados que não podem sair do ambiente e para dependências baixadas por comandos gerados.

## 5. Decisão editorial

- `M00.html`: regenerar integralmente em cinco blocos/10h.
- `README.md`: reduzir a guia de execução e navegação; eliminar repetição teórica.
- `bloco-4-mcp-e-hooks.html`: marcar como material legado substituído; não apagar porque há PDF e histórico associados.
- `lab/`: adicionar contrato de harness agnóstico, seleção determinística de contexto, política de menor privilégio e suíte de testes.
- checkpoint: exigir explicação, execução dos testes, negação de casos inseguros e comparação entre dois harnesses.

## 6. Fontes usadas na decisão

- [Agent Skills Specification](https://agentskills.io/specification), formato aberto consultado em 14/08/2026;
- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28), fonte normativa;
- [MCP Python SDK v2](https://github.com/modelcontextprotocol/python-sdk), linha estável atual;
- [Codex — AGENTS.md](https://developers.openai.com/codex/guides/agents-md), mapeamento específico do produto;
- [Codex — Skills](https://developers.openai.com/codex/skills), mapeamento específico do produto;
- [Codex — MCP](https://developers.openai.com/codex/mcp), mapeamento específico do produto;
- [Codex — approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security), sandbox e aprovação;
- [Claude Code — project memory](https://code.claude.com/docs/en/memory), `CLAUDE.md` e compatibilidade documentada;
- [Claude Code — extension model](https://code.claude.com/docs/en/features-overview), skills, subagentes, MCP e hooks;
- [GitHub Copilot — repository instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions), `AGENTS.md` e instruções específicas;
- [OWASP LLM01:2025](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), conteúdo não confiável e menor privilégio;
- [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework), governança de risco;
- [DORA 2025](https://dora.dev/research/2025/dora-report/), IA como amplificador do sistema organizacional.

## 7. Follow-up de 15/08/2026 — interface de invocação

O tratamento do `M00-AUD-09` removeu corretamente slash command como primitiva universal, mas também eliminou a camada de invocação que deveria ter sido reclassificada. O follow-up corrigiu a lacuna:

- slash é ensinado como affordance de UI, não como fundamento;
- built-in command, skill, prompt file, hook, tool e prompt MCP são separados por mecanismo e autoridade;
- Claude Code, Codex e Copilot aparecem somente como adapters datados;
- formatos `.claude/commands` e Codex custom prompts são rotulados legado/deprecated;
- `finish-study-block` recupera o caso de uso do antigo `/bloco` por contrato agnóstico;
- escrita de diário, stage e commit são efeitos separados e exigem aprovação;
- os cenários M00-AT-016..020 cobrem contrato, dois adapters, argumentos/fontes ausentes, efeitos e taxonomia.

**Estado:** `M00-AUD-09` resolvido em G0/G1/G4. G6 continua parcial até revisão visual da alteração.
