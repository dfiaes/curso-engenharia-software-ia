# Instruções permanentes para agentes

Antes de auditar, criar ou alterar qualquer módulo deste curso, leia integralmente:

1. `CLAUDE.md` — constituição compartilhada do repositório e contrato de qualidade v4;
2. `docs/POLITICA-FONTES-E-AGNOSTICISMO.md` — hierarquia de fontes e neutralidade;
3. `docs/STATUS-IMPLEMENTACAO-CURSO.md` — unidade ativa, gates e bloqueios;
4. `docs/PADRAO-QUALIDADE-TECNICA-DIDATICA.md` — régua composta de autoria e revisão;
5. a especificação e a rastreabilidade do módulo em escopo.

## Regras que nunca podem ser omitidas

- Python 3.14 é a linguagem canônica; .NET é somente ponte comparativa quando reduz carga cognitiva.
- O M00 é referência visual inicial, não autoridade única. O padrão obrigatório é o conjunto formado pela constituição, política de fontes, régua N1–N5, gates G0–G6, especificação/rastreabilidade e `docs/PADRAO-QUALIDADE-TECNICA-DIDATICA.md`. Uma melhoria comprovada em módulo posterior deve elevar o padrão comum e, quando relevante, voltar aos anteriores.
- Aplicar a régua de profundidade N1–N5 e os gates G0–G6 definidos em `CLAUDE.md`.
- Conceito sem decisão, execução, falha e evidência não representa formação sênior.
- Prática descrita sem laboratório executável não comprova N3.
- Código, benchmark, resultado e versão publicados precisam vir de execução real ou ser rotulados explicitamente como exemplo variável.
- Usar primeiro especificações, PEPs/RFCs, documentação oficial e papers originais. Practitioner guidance deve ser rotulada; nenhum fornecedor define sozinho o currículo.
- Separar invariante, padrão aberto e adapter de produto. Revalidar informação de alto risco em até 90 dias.
- Não esconder bloqueio com `skip`, mock irrelevante, saída simulada ou número hardcoded.
- Durante produção editorial, atualizar status/rastreabilidade, nunca `PROGRESSO.md`. Este último registra somente estudo real do aluno.
- Contribuição paralela ou de subagente só altera gate/status após revisão do orquestrador.
- Preservar mudanças do usuário e não executar operação destrutiva fora de sandbox temporário possuído.

## Unidade ativa

Consulte sempre `docs/STATUS-IMPLEMENTACAO-CURSO.md`; não deduza a prioridade pela numeração do módulo. Em 15/08/2026, a unidade ativa combina a correção focal do M00 sobre interfaces de invocação/slash commands com a produção do M02A em G1–G6.
