# Lab LT04-T1 — Release: versão, gates, rollback, sinais, comunicação e pós-mortem

Folhas B01-L a B06-L da trilha LT04-T1. Implementam verbatim os contratos das
seções B01–B06 de `../LT04.html`, sem registry/deploy/carga real — só stdlib.

## Arquivos (nomes congelados)

| Arquivo | Oráculo | Plataforma |
|---|---|---|
| `versao_release.py` | LT04-T1-AT-001..003: SemVer, changelog, vínculo com digest | qualquer (strings/dicts, sem rede) |
| `gates_release.py` | LT04-T1-AT-010..012: gate fechado, veto P0/P1, condicional com dono | qualquer (dicts, sem assinatura real) |
| `rollback_release.py` | LT04-T1-AT-020..022: stop, rollback ao anterior, restore provado | qualquer (dicts, sem tráfego real) |
| `sinais_release.py` | LT04-T1-AT-030..032: cauda de raw, erro explícito, slices | qualquer (listas, sem carga real) |
| `comunicar_release.py` | LT04-T1-AT-040..042: tiers, bloqueio, reprodução | qualquer (dicts, sem reunião real) |
| `posmortem_release.py` | LT04-T1-AT-050..052: registro, ação, waiver | qualquer (dicts, sem incidente real) |
| `tests/test_at001_versao.py` | AT-001..003: parse/ordem, changelog, digest | qualquer |
| `tests/test_at010_gates.py` | AT-010..012: gate fechado, veto, condicional | qualquer |
| `tests/test_at020_rollback.py` | AT-020..022: stop, reversão, restore | qualquer |
| `tests/test_at030_sinais.py` | AT-030..032: cauda, ausência, slices | qualquer |
| `tests/test_at040_comunicar.py` | AT-040..042: tiers, bloqueio, reprodução | qualquer |
| `tests/test_at050_posmortem.py` | AT-050..052: registro, ação, waiver | qualquer |

## Regras de execução

- Sem registry/deploy/carga: versão, gates, rollback, sinais, comunicação e
  pós-mortem como dados e cálculo; produção real pertence à trilha externa —
  BLOCKED com registro onde ausente, nunca simulada.
- SemVer estrito `X.Y.Z` sem zeros à esquerda; changelog com versão+data+resumo
  em ordem decrescente; vínculo só com `sha256:` + 64 hex.
- Gate é conjunção (claim sem evidência reprova); P0/P1 aberto veta NO-GO;
  CONDITIONAL exige dono+condição+expiração; stop pré-declarado aborta;
  rollback mira digest anterior; restore prova digest+dado+saúde.
- Sinais derivam de raw (p50/p95/p99+n); vazio é erro, nunca zero; slices
  acusam o segmento. Tiers exigem aprovadores; reprodução exige mesmo digest
  com brutos. Ação exige dono+prazo; waiver vencida bloqueia.
- Números são exemplo variável: 28 oráculos; SemVer com 6 recusas; changelog
  de 2 entradas; cauda 95×10 + 5×900; tiers médio/alto/crítico; hoje 2026-09-21.

## Comandos

```sh
uv sync
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run pytest -q
```
