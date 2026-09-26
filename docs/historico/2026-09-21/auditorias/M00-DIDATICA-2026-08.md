# Auditoria didática do M00 — Harness engineering

**Data-base:** 20/08/2026 · **Escopo:** `modulos/M00-ferramental/M00.html` · **Natureza:** revisão de autoria e compreensão; não altera a decisão dos gates G0–G6.

## Critério aplicado

Cada conceito novo foi lido contra o contrato editorial de 20/08/2026: situação concreta, definição, mecanismo, decisão ou limite e observação proporcional. A auditoria também verifica se os trechos Python anteriores ao M02 explicam a sintaxe necessária para acompanhá-los.

## Achados

| ID | Severidade | Achado | Impacto no estudo | Correção do lote M00 |
|---|---|---|---|---|
| DID-M00-001 | P1 | O bloco 1 enumera as camadas corretas, mas não percorre uma mudança única passando por elas. | O aluno memoriza nomes sem localizar a origem de uma falha real. | acrescentar exemplo trabalhado que vai do requisito à evidência e distingue falha de modelo, harness e ambiente. |
| DID-M00-002 | P1 | `AGENTS.md`, adapter, frontmatter e seleção de contexto aparecem antes de uma cena de uso que explique por que cada artefato existe. | A prática parece uma lista de arquivos a criar. | inserir fluxo de descoberta de instruções e contraste entre contrato sempre carregado e procedimento sob demanda. |
| DID-M00-003 | P0 | M00 usa Python e comandos PowerShell antes do M02 sem explicar sintaxe e efeito: chamada de função, argumentos nomeados, `frozenset`, `Path.cwd()` e `PYTHONPATH`. | O aluno precisa pesquisar fora do material para executar ou compreender o laboratório. | anotar os trechos Python no ponto de uso e transformar a execução do lab em sequência explicada. |
| DID-M00-004 | P1 | Segurança descreve controles sólidos, porém `capability`, aprovação e identidade são apresentados primeiro como tabela. | A diferença entre “o modelo recebeu uma instrução” e “o processo recebeu autoridade” não se fixa sob pressão. | introduzir cenário de documento hostil, seguir a tentativa de efeito e contrastar regra textual com negação técnica. |
| DID-M00-005 | P1 | MCP introduz revisão, primitivas e SDK quase de uma vez; o custo de começar pelo cliente é dito, mas o fluxo host → schema → função → resposta não é mostrado. | Termos como stateless, tool e adapter viram vocabulário sem mecanismo. | acrescentar trace de uma chamada local e explicar cada linha Python do adapter mínimo. |
| DID-M00-006 | P2 | Diagnósticos e resultados aparecem concentrados nos blocos 3 e 4. Blocos 1 e 2 têm prática, mas poucos sintomas concretos de uma configuração incorreta. | O estudante sabe o alvo, mas não reconhece por que chegou a um resultado diferente. | incluir tabelas sintoma → hipótese → evidência → correção e resultados intermediários nas práticas. |

## Limites preservados

- Os termos `harness`, capability, adapter, MCP, Agent Skills e progressive disclosure permanecem. Eles serão definidos no primeiro uso, não substituídos por apelidos vagos.
- A revisão não transforma exemplos publicados em evidência nova, não altera o laboratório e não promove G6.
- O bloco continua a tratar produtos como adapters datados e mantém Python como linguagem canônica, com explicação proporcional antes do M02.

## Aceite editorial do lote

- cada bloco do M00 contém ao menos um encadeamento situação → mecanismo → decisão ou falha;
- todo código Python pré-M02 possui leitura sintática inline e vínculo explícito ao artefato executável;
- práticas mostram objetivo, passos dependentes, resultado esperado e diagnóstico de desvio relevante;
- a rastreabilidade registra a revisão didática sem reclassificar competência técnica ou resultado de aluno.
