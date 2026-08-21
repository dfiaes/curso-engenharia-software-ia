# Auditoria didática do M01 — SDD, harness e execução paralela

**Data-base:** 20/08/2026 · **Escopo:** `modulos/M01-workflow-ia-driven/M01.html` · **Natureza:** autoria e compreensão; os gates G0–G6 permanecem independentes.

| ID | Severidade | Achado | Correção do lote |
|---|---|---|---|
| DID-M01-001 | P1 | O início retoma M00 pela experiência anterior do aluno, mas não reconstrói um exemplo único que atravesse intenção, requisito, spec, plano, código e evidência. | inserir um caso trabalhado de mudança de comportamento e usar seus artefatos para explicar drift. |
| DID-M01-002 | P1 | “Context anxiety” é apresentado como mecanismo observável sem delimitar a evidência que permitiria distingui-lo de outras causas. | substituir atribuição de intenção por sinais mensuráveis: passos longos, checks omitidos, compactação, truncamento e perda de requisito. |
| DID-M01-003 | P2 | Alguns trechos tratam números de um guia practitioner como linguagem esperada de entrevista. | preservar os nomes em inglês e tornar a tabela um instrumento de decisão, não uma lista a decorar. |
| DID-M01-004 | P1 | SDD, gates, worktrees e ferramentas verificadas são bem ensinados, mas falta conexão datada com práticas atuais de times assistidos por IA. | adicionar panorama de prática vigente com fonte, limite metodológico e mapeamento para os invariantes do módulo. |
| DID-M01-005 | P2 | A abertura sobre paralelismo começa com uma afirmação excessiva sobre agentes, em vez de delimitar execução, isolamento e coordenação. | reescrever a premissa e reforçar que a unidade de execução depende do host e do contrato. |

## Aceite editorial

- termos técnicos continuam em inglês quando são o vocabulário profissional, definidos no primeiro uso;
- o exemplo de SDD mostra decisão, mecanismo e limite, sem prometer que documentação substitui descoberta;
- dados de mercado permanecem fonte industrial datada, não justificativa para escolher um fornecedor;
- o laboratório, a carga de 10 horas e os estados dos gates não são alterados.
