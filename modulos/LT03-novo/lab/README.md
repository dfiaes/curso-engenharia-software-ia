# Lab LT03-B01 — Cloud, failure domains e artefatos OCI

Folha B01-L da trilha LT03 (Bloco 1). Implementa verbatim os contratos da
seção B01 de `../LT03.html`, sem Docker e sem rede — só stdlib.

## Arquivos (nomes congelados)

| Arquivo | Oráculo | Plataforma |
|---|---|---|
| `validar_dockerfile.py` | LT03-AT-001: Dockerfile non-root, base mínima, digest pinado, sem segredo | qualquer (parse como texto/dados, sem build) |
| `drenagem_grace.py` | LT03-AT-002: sinal fecha a entrada, conclui/cancela no grace, timeline + exit code | sinais com semântica POSIX |
| `sinais_escala.py` | LT03-AT-020–025: reações de probes, QoS, pedido por medida, HPA, PDB/spread, trava de gargalo | qualquer (dados + aritmética, sem cluster) |
| `estado_iac.py` | LT03-AT-030–034: plano/drift/import/move, segredo em state, guarda de destroy | qualquer (dicts, sem binário IaC) |
| `reconciliar_gitops.py` | LT03-AT-040–043: convergência com digest, reversão de manual, break-glass TTL, promoção | qualquer (dicts, sem cluster) |
| `analisar_canary.py` | LT03-AT-050–053/060–061: promover/abortar/inconclusiva, rollback, camada, restauração | qualquer (métricas locais, sem tráfego) |
| `tests/test_at001_dockerfile.py` | AT-001: aprovado + cada defeito isolado | qualquer |
| `tests/test_at002_drenagem.py` | AT-002: carga local, entrada fechada, prazo respeitado | qualquer (handlers reais só POSIX) |
| `tests/test_at003_decisao.py` | AT-003: responsabilidade, failure domains, egress e saída explícitos | qualquer (dados em memória) |

## Regras de execução

- Sem Docker/rede: Dockerfile lido como texto; build/push/run/inspeção de
  manifest pertencem à trilha externa — BLOCKED com registro onde ausentes,
  nunca simulados.
- Checagens estáticas: último `USER` non-root, base final com variante enxuta
  (`slim`/`alpine`/`distroless`), base final com `@sha256:`, sem `ARG`/`ENV`/`COPY`
  com padrão de segredo.
- Números são exemplo variável com seed/amostra: AT-001 sem tempo (texto);
  AT-002 durações 0,05 s (breve) / 30 s (longa, cancelada), prazo 0,5 s,
  margem 2×; AT-003 decisão em memória, semente 20260814, N = 3 serviços.
- Filhos: nenhum; `instalar_handlers` registrado só em teste POSIX com
  restauração em `finally`.

## Comandos

```sh
uv sync
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run pytest
```

Evidência dos gates: `evidence/b01-gates.txt`.
