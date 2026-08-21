# Auditoria didática do M02 — Python 3.14 profissional

**Data-base:** 20/08/2026 · **Escopo:** `modulos/M02-python-para-dev-dotnet/M02.html` · **Natureza:** autoria e compreensão; não reabre os gates G0–G6 já aprovados.

| ID | Severidade | Achado | Correção do lote |
|---|---|---|---|
| DID-M02-001 | P1 | O módulo explica o ecossistema e o laboratório com precisão, mas não apresenta sinal datado que conecte Python, packaging e controles de qualidade ao trabalho assistido por IA atual. | incluir panorama de prática vigente, com fonte industrial e limite de generalização. |
| DID-M02-002 | P1 | O exemplo central de `asyncio` concentra `async def`, `await`, `TaskGroup`, compreensão de lista e anotação genérica sem leitura guiada logo após o código. | acrescentar leitura linha a linha no ponto de uso e ligar cada construção à propriedade de lifecycle. |
| DID-M02-003 | P2 | O probe de runtime para free-threading mostra uma API de diagnóstico antes de explicar a forma do dicionário e as duas perguntas que o resultado responde. | contextualizar a coleta de capability antes de interpretar o valor. |
| DID-M02-004 | P1 | Dois snippets de teste usam `Decimal` sem importá-lo, embora sejam apresentados como código do material. | completar os imports e preservar a explicação como exemplo executável. |
| DID-M02-005 | P2 | A primeira prática de instalação apresenta pipeline remoto sem explicar que instalação é uma mudança de ambiente e exige inspeção da fonte oficial. | declarar a fronteira, o motivo do comando e a checagem antes de executar. |

## Aceite editorial

- Python continua canônico; a ponte .NET reduz transferência incorreta, sem ocupar o lugar do modelo Python;
- ferramentas aparecem como adapters e cada sinal de mercado registra população e limite;
- exemplos publicados continuam ligados ao laboratório e não substituem resultados executados;
- a revisão não muda fontes normativas, cenários, código do lab, versão do runtime ou estado técnico do módulo.
