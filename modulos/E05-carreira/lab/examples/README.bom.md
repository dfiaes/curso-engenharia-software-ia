# Cartógrafo

Responde perguntas sobre um repositório de código com citação de fonte ou abstenção.

## Problema

Equipes novas perdem dias para entender um repositório legado. Perguntas simples ("onde a autorização é verificada?") exigem ler dezenas de arquivos, e uma resposta sem fonte não pode ser confiada.

## Arquitetura

Ingestão assíncrona (fila e workers), índice híbrido (BM25 e vetores) com ACL por tenant, gateway de modelos com fallback e um agente com orçamento de passos.

```
# diagrama simplificado
cliente -> API -> fila -> workers -> índice
```

## Decisões e trade-offs

- PostgreSQL com pgvector em vez de um banco vetorial dedicado: uma peça a menos para operar, ao custo de menos recursos de ajuste fino.
- Reranking só nas 20 melhores candidatas: +180 ms no p95, +9 pontos de recall@5 no conjunto de avaliação.

## Avaliação

Conjunto de 120 perguntas com fonte rotulada. recall@5 = 0,86; fidelidade medida por juiz calibrado (kappa 0,71 contra 40 casos humanos); abstenção correta em 17 de 20 perguntas sem resposta.

## Custo e latência

Custo médio de US$ 0,011 por pergunta com o modelo pequeno (cotação de 11/10/2026); p50 de 1,4 s e p95 de 3,8 s em 200 execuções locais.

## Falhas e o que faria diferente

O chunking por tamanho fixo quebrava funções longas e derrubou o recall em 14 pontos antes da troca por chunking por símbolo. Faria o conjunto de avaliação antes do primeiro índice, não depois.

## Como rodar

    uv sync --frozen
    uv run pytest -q
    uv run python -m cartografo.demo

## Demo

Gravação de 2 minutos em `docs/demo.mp4` mostrando a jornada: ingestão, pergunta, resposta citada e uma abstenção.
