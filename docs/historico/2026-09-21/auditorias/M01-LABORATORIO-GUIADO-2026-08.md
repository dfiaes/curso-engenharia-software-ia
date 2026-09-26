# M01 — auditoria de laboratório guiado

**Data:** 21/08/2026 · **Escopo:** HTML, laboratório e cópia temporária.

## Problema corrigido

O M01 distribuía comandos, perguntas práticas e alterações de artefatos entre os cinco blocos. A pessoa precisava descobrir qual ambiente usar, quando executar e se o resultado era exercício ou evidência do código.

## Desenho aplicado

- blocos 1–4 passaram a explicar o cenário e o mecanismo; a execução foi retirada;
- bloco 5 mantém os artefatos como referência, com aviso explícito para seguir ao laboratório final;
- `Laboratório guiado M01` aparece após o bloco 5 e antes do checkpoint;
- o roteiro cria cópia de trabalho marcada e reconstrói `drift.py` com código completo;
- a sequência mostra contrato válido/inválido, runner, evidência, controle negativo, timeout, pause/resume e worktrees reais;
- o checkpoint fica depois da prática e é a única etapa avaliativa;
- Git continua obrigatório para o cenário real. Não há mock ou skip que esconda sua ausência.

## Evidência de execução

Na cópia de referência criada em `%TEMP%/tutor-ia-codex-labs/`:

```text
CPython 3.14.7
Ruff format: 34 arquivos formatados
Ruff lint: All checks passed!
mypy strict: Success: no issues found in 21 source files
unittest: Ran 27 tests in 2.446s — OK
```

## Limites

- o laboratório ensina drift pela reconstrução de um núcleo pequeno; parser, runner, workflow e workspace permanecem como referência executável para não transformar o módulo em cópia extensa de arquivos antes do M02;
- `subprocess` continua limitado ao processo filho imediato e não é sandbox do sistema operacional;
- worktrees isolam diretórios, não serviços ou contratos compartilhados;
- o material foi verificado estruturalmente; esta alteração não reabre ou promove G6.
