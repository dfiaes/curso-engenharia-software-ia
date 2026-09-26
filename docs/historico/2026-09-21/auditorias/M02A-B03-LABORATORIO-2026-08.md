# M02A — lote B03 e laboratório guiado

**Data:** 21/08/2026 · **Escopo:** B03, recorte B01–B03, laboratório local `work-intake`.

## Mudanças aplicadas

- B03 explica modularidade por mudança, information hiding, linguagem de domínio, bounded context, entities, value objects, invariantes, aggregate, ports/adapters, composition root e custo de abstração;
- `Protocol` foi separado de substituição comportamental; o contract test trata a semântica e rejeita um adapter que fortalece precondição;
- o panorama datado distingue sinal industrial de fundamento, ferramentas de ecossistema e decisão didática;
- ações antes espalhadas em B01 e B02 passaram a leitura aplicada;
- `Laboratório guiado M02A · lote B01–B03` reúne cópia temporária, leitura de fronteira, oráculos de arquitetura e policy, CLI com evidência e gate completo;
- `create_working_copy.py` cria cópia marcada sob `%TEMP%\tutor-ia-codex-labs` e exclui ambientes e caches.

## Evidência

```text
HTML: 0 passos e 0 títulos de prática antes de #lab; âncoras internas válidas;
30 arquivos formatados; Ruff sem achados;
mypy strict: 29 arquivos de código-fonte sem issues;
pytest: 35 passed em 3,14 s;
wheel: CLI, marker de tipagem, migração e entry point presentes.
```

A cópia temporária foi criada com marcador `M02A`, sem `.venv`, contendo o código-fonte da referência; foi removida após a validação.

## Limites

- o laboratório ainda cobre somente B01–B03 e não promove G2 além de parcial;
- SQLite, fake e record-replay não provam comportamento de provider, rede, broker, PostgreSQL ou sistema distribuído;
- AT-059 permanece pendente, e AT-060 permanece parcial; G3–G6 não foram promovidos.
