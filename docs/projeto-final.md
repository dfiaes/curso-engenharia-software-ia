# Projeto final — Cartógrafo

Produto integrador pequeno para analisar um corpus autorizado de código: ingestão, extração de símbolos, consulta e resposta com evidência. Python é canônico; corpus de outra linguagem é dado de teste explicado, não pré-requisito do aluno.

A unidade de valor é uma jornada verificável: fornecer uma fixture → acompanhar um job → fazer uma pergunta → receber referências ou abstenção → diagnosticar uma falha. A superfície pode ser pequena; contratos, autorização, persistência, recuperação e limites precisam ser reais no escopo declarado.

## Responsabilidades por fase

| Fase | Peça | Módulos | Prova esperada |
|---|---|---|---|
| 0–1 | Contratos, dados e API | F04, F05, M02, M02A, M03, M04 | entrada validada, transação e migration verificadas, ADR das fronteiras |
| 2 | Gateway, avaliação, recuperação e agentes | M05–M10 | provider substituível, regressão detectada, consulta autorizada com proveniência e orçamento |
| 3 | Segurança, operação e deploy | M12, LT02–LT04, P01 | isolamento, idempotência, falha, telemetria, recuperação e deploy reproduzível |
| 4 | System design, adaptação de modelo (opcional), governança e defesa | E01, M11, E02, E03, M13 | decisão de modelo/serving com limites e medidas, análise de risco, jornada completa e decisão go/no-go |

As escolhas de framework são adapters, não currículo obrigatório. Não criar plataforma empresarial para demonstrar uma propriedade. Mecanismo em memória é evidência local; PostgreSQL, protocolo ou processo real são necessários quando a alegação depende deles. API paga e modelo grande não são requisitos do núcleo.

## Escopo e entrega

O [M13](../modulos/M13-capstone/M13.html) integra as peças e conduz a defesa; o escopo detalhado da versão anterior está em [M13-ESPECIFICACAO.md](especificacoes/M13-ESPECIFICACAO.md). O diretório [capstone](../capstone/README.md) contém o trabalho existente e não deve ser migrado ou reescrito durante a edição de um módulo.

Piloto com pessoas exige consentimento e dados reais coletados; exemplo sintético nunca comprova valor de mercado. Publicação e deploy não são automáticos.
