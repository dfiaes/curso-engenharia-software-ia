# Design doc: <título curto do sistema>

- Autor: <nome> · Revisores: <nomes> · Estado: rascunho | em revisão | aprovado
- Data: <AAAA-MM-DD> · Decisão necessária até: <data>

## 1. Contexto e problema
<Quem sofre, qual é a dor hoje, qual é o custo de não fazer. Máximo 5 linhas.>

## 2. Objetivos e não-objetivos
- Objetivos (verificáveis):
- Não-objetivos (o que fica de fora de propósito):

## 3. Requisitos
### Funcionais
-
### Não funcionais (com número)
| Requisito | Meta | Como medir |
|---|---|---|
| Latência (TTFT p95 / último token p95) | | |
| Disponibilidade | | |
| Qualidade (métrica de eval e limiar) | | |
| Custo por requisição / por mês | | |
| Segurança e isolamento de tenants | | |

## 4. Estimativas de ordem de grandeza
| Grandeza | Premissa | Resultado |
|---|---|---|
| Requisições/dia | | |
| QPS médio e de pico | | |
| Tokens de entrada/saída por requisição | | |
| Concorrência (lei de Little) | | |
| Cota RPM/TPM necessária | | |
| Armazenamento | | |
| Custo mensal (base, com cache, com roteamento) | | |

## 5. API e modelo de dados
<Contratos de entrada e saída, erros, idempotência. Tabelas e chaves principais.>

## 6. Desenho de alto nível
<Diagrama e fluxo de uma requisição do começo ao fim, incluindo o caminho de falha.>

## 7. Aprofundamento nos gargalos
<Os 2 ou 3 pontos que decidem o projeto: cota, custo, qualidade, consistência.>

## 8. Alternativas consideradas
| Opção | Vantagem | Custo | Por que não / por que sim |
|---|---|---|---|

## 9. Avaliação e observabilidade
- Dataset de avaliação e gate de regressão:
- Métricas, logs e traces (o que NÃO logar):
- SLOs e alertas:

## 10. Falhas, segurança e custo máximo
| Falha | Efeito | Detecção | Resposta automática | Resposta humana |
|---|---|---|---|---|
- Teto de gasto (por requisição, por tarefa, por tenant, por mês):

## 11. Plano de entrega e evolução
- V1 (o mínimo que prova a hipótese):
- Gatilhos para V2 (métrica que dispara a mudança):
- Plano de rollback:

## 12. Riscos em aberto e perguntas para a revisão
-
