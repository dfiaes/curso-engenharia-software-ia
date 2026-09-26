# M02 — auditoria de laboratório guiado

**Data:** 21/08/2026 · **Escopo:** M02 HTML, referência executável e cópia temporária.

## Desenho aplicado

- o bloco 8 preserva a arquitetura, os artefatos e os oráculos como referência de leitura;
- `Laboratório guiado M02` fica depois do diagnóstico e antes do checkpoint;
- a prática cria uma cópia marcada e reconstrói `models.py`, a trust boundary do `csv-cleaner`;
- o roteiro percorre caminho feliz, campo extra recusado, evidência JSON, Ruff, mypy, pytest, build e CLI;
- diretórios de ambientes de wheel gerados por verificações anteriores são excluídos da cópia para não contaminar o lint;
- checkpoint permanece separado e posterior à montagem.
- blocos 1–7 usam leitura aplicada: exemplos, cenários, contraste e diagnósticos permanecem no corpo, mas nenhuma ação manual ocorre antes da âncora `#lab`.

## Evidência de execução

```text
CPython 3.14.7
Ruff format: 36 files already formatted
Ruff lint: All checks passed!
mypy strict: Success: no issues found in 29 source files
pytest: 51 passed in 6.39s
```

Verificação estrutural após a limpeza editorial: zero `<div class="step">` e zero títulos `Prática guiada` antes de `#lab`; 13 seções e 58 `div`s abertos/fechados; laboratório antes do checkpoint.

## Limites

- a prática reconstrói a boundary Pydantic; parsing, concorrência e distribuição continuam como referência executável para manter um experimento coeso;
- uma cópia limpa não inclui caches ou ambientes criados por builds anteriores;
- a exibição de caracteres depende da codificação do terminal, enquanto CLI/testes mantêm UTF-8 como contrato;
- a alteração não reclassifica G0–G6.
