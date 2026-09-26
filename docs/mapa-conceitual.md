# Mapa conceitual — software e sistemas de IA

Referência curta de vocabulário, não hierarquia obrigatória nem pré-requisito de leitura. O módulo indicado desenvolve mecanismo, exemplo, decisão e falha. O [currículo](../CURRICULO.md) e o [status](STATUS-IMPLEMENTACAO-CURSO.md) definem escopo e prontidão.

| Conceito | Distinção necessária | Onde estudar |
|---|---|---|
| Modelo | transforma entradas segundo parâmetros aprendidos; capacidade depende de dados, objetivo e interface | M05/M11; ML opcional |
| Harness/runtime | software que monta contexto, controla execução, ferramentas, estado e limites | M00/M01/M08 |
| Prompt | entrada/instrução comportamental; não é mecanismo de autorização | M05/M08/M12 |
| Contexto | informação disponível em uma chamada, incluindo instruções, dados e resultados | M00/M05/M08 |
| Saída estruturada | restrição/validação de formato; não garante verdade ou autorização | M05 |
| Tool | operação oferecida pelo runtime; modelo pode solicitar, código valida e executa | M05/M08/M12 |
| Workflow | fluxo de controle explicitamente definido; pode conter passos probabilísticos | M01/M08/M10 |
| Agente | sistema em que decisões de um modelo orientam ações dentro de limites controlados | M08 |
| RAG | recuperação de evidências para compor contexto; exige autorização e avaliação próprias | M07 |
| Grafo de conhecimento | entidades e relações com proveniência e limites de extração | M10 |
| Grafo de execução | estados/transições de um processo; persistência não elimina efeitos duplicados sozinha | M10/LT02 |
| Memória | estado mantido entre chamadas, com origem, validade, acesso e política de descarte | M08/M10 |
| MCP/A2A | contratos de comunicação versionados; adoção de protocolo não concede confiança | M09 |
| Eval | medição do comportamento num conjunto declarado; complementa testes do software | M06 |
| Observabilidade | sinais para investigar estado e comportamento; telemetria precisa respeitar privacidade | M06/M12/LT01 |
| ML/MLOps | aprendizado por dados e seu ciclo de operação; não se resume a LLMs | apêndice ML01–ML07, opcional |

Uma aplicação pode usar modelo sem agente, busca sem geração, workflow sem LLM ou ferramentas sem MCP. Escolher a composição pelo problema e pela evidência. O principal explica toda matemática indispensável no ponto de uso; o apêndice oferece aprofundamento.
