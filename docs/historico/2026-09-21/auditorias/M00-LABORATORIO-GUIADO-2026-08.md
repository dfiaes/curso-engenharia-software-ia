# M00 — auditoria de laboratório guiado

**Data:** 21/08/2026 · **Escopo:** material HTML, referência executável e cópia de trabalho.

## Problema corrigido

O material pedia prática manual em blocos diferentes e deixava a sequência de ambiente, código, execução e interpretação espalhada. Isso obrigava o aluno a alternar leitura, terminal e arquivos sem uma unidade de experimento clara.

## Desenho aplicado

- blocos 1–5 mantêm explicação, exemplos completos, contraste e diagnóstico; comandos de execução foram retirados deles;
- `Laboratório guiado M00` aparece depois do bloco 5 e antes do checkpoint;
- a prática começa com cópia temporária marcada, criada por `lab/create_working_copy.py`;
- três arquivos centrais são reconstruídos por blocos completos: contrato, seleção de contexto e policy;
- cada etapa informa motivo, arquivo, código, comando, observação e falha provável;
- a validação usa Ruff, mypy e testes como oráculo do código; o checkpoint está separado e posterior;
- MCP Inspector é extensão opcional. A função de domínio e o adapter in-memory continuam no caminho técnico verificado.

## Evidência de execução

Na cópia de referência criada em `%TEMP%/tutor-ia-codex-labs/`:

```text
CPython 3.14.7
Ruff: All checks passed!
mypy: Success: no issues found in 13 source files
unittest: Ran 18 tests in 2.969s — OK
```

## Limites

- a cópia inicial guiada limpa apenas os três arquivos reconstruídos; os demais permanecem como infraestrutura de teste e consulta;
- a integração visual com Inspector MCP depende de ferramenta externa e não é requerida para concluir o laboratório local;
- G6 do M00 permanece parcial: esta auditoria não substitui revisão visual em navegador das alterações HTML.
