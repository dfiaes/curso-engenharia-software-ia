# Lab M07 — retrieval_lab

Pipeline RAG local: chunking estrutural via AST, embeddings falsos
determinísticos, híbrida com RRF, rerank com limiar calibrado, ACL
primeiro e eval de recuperação. Python 3.14 canônico, gerenciado com
`uv`. **Sem rede, conta, banco ou modelo real.**

O `sql/reference.sql` documenta o desenho PostgreSQL/pgvector e NÃO é
executado (exige Docker); a execução real contra PG fica bloqueada.

## Comandos de qualidade (oráculos do programa)

    uv sync --frozen
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy src tests
    uv run pytest -q

## O que cada parte prova

| Arquivo | Cenários | Ambiente |
|---|---|---|
| `test_chunking.py` | estrutural vs fixo, id estável (AT-003/004) | sem serviços |
| `test_embeddings.py` | determinismo, limites, migração (AT-001/002/015) | sem serviços |
| `test_hybrid.py` | léxico×vetor×híbrido por tipo (AT-002/006) | sem serviços |
| `test_rerank.py` | ganho, limiar, routing (AT-007..009) | sem serviços |
| `test_acl.py` | tenant obrigatório, leak, abstenção (AT-010..012) | sem serviços |
| `test_eval.py` | recall/MRR/citação, ablação, 3 perguntas (AT-013/014/016) | sem serviços |
| `corpus/legado_demo/` | fixture Python com origem (autoria do curso, MIT) | fixture |

## Cópia de trabalho

Não edite esta referência diretamente:

    python3 create_working_copy.py
