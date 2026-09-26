# Projeto final — Cartógrafo

Produto integrador pequeno para analisar um corpus autorizado de código: ingestão, extração de símbolos, consulta e resposta com evidência. Python é canônico; corpus de outra linguagem é dado de teste explicado, não pré-requisito do aluno.

A unidade de valor é uma jornada verificável: fornecer uma fixture → acompanhar um job → fazer uma pergunta → receber referências ou abstenção → diagnosticar uma falha. A superfície pode ser pequena; contratos, autorização, persistência, recuperação e limites precisam ser reais no escopo declarado.

## Responsabilidades

| Peça | Origem curricular | Prova esperada |
|---|---|---|
| Contratos, estrutura, API e dados | M01–M04 | entrada validada, transação e migration verificadas |
| Gateway e avaliação | M05/M06 | provider substituível e regressão detectada |
| Recuperação e investigação | M07–M10 | consulta autorizada, proveniência e orçamento |
| Fundamentos e modo local | M11 | decisão de modelo/serving com limites e medidas |
| Segurança, custo e operação | M12/LTs | isolamento, idempotência, falha, telemetria e recuperação |
| Integração e defesa | M13 | evidência de jornada completa e decisão go/no-go |

As escolhas de framework são adapters, não currículo obrigatório. Não criar plataforma empresarial para demonstrar uma propriedade. Mecanismo em memória é evidência local; PostgreSQL, protocolo ou processo real são necessários quando a alegação depende deles. API paga e modelo grande não são requisitos do núcleo.

## Autoridade e prontidão

A [especificação M13](especificacoes/M13-ESPECIFICACAO.md) detalha competências/CAP-*; a tarefa M13-S reconcilia o escopo herdado com o laboratório mínimo da [especificação transversal](especificacoes/FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md). Nenhum critério obrigatório é removido silenciosamente para obter aprovação.

O [status](STATUS-IMPLEMENTACAO-CURSO.md) e a [rastreabilidade M13](../modulos/M13-capstone/RASTREABILIDADE.md) distinguem existente, parcial e comprovado. O diretório [capstone](../capstone/README.md) é trabalho existente; não migrar nem reescrever implicitamente durante uma tarefa de módulo.

ML07 é um projeto tabular opcional e independente. Pode compartilhar contratos/telemetria ou uma porta com o Cartógrafo, mas sua execução não bloqueia este produto. Piloto com pessoas exige consentimento e dados reais coletados; exemplo sintético nunca comprova valor de mercado. Publicação e deploy não são automáticos.
