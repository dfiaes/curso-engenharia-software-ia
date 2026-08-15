# Defeitos deliberados

Arquivos deste diretório são material de revisão e ficam fora do gate do mypy. Eles
representam sugestões plausíveis de IA que não podem ser promovidas sem type check,
caso negativo e revisão de contrato.

- `any_leak.py`: `Any` atravessa a fronteira e transforma uma promessa em mentira;
- `unbounded_async.py`: cria todas as tasks sem ownership/backpressure;
- `tautological_test.py`: o oráculo repete a implementação.

`catalog.json` registra para cada defeito o problema de tipo, a falha semântica,
o risco operacional e o oráculo que deve detectá-lo. Assim, a revisão não depende
apenas de julgamento textual ou de outra resposta de IA.
