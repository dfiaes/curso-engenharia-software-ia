# Lab LT01-B01/B02/B03/B04/B05/B06 — Processo, filesystem, redes, pools, deadlines, cancelamento, saturação, cardinalidade, incidente e restauração

Folha B01-L + B02-L + B03-L + B04-L + B05-L + B06-L da trilha LT01 (Blocos 1, 2, 3, 4, 5 e 6). Implementa verbatim os
contratos das seções B01, B02, B03, B04, B05 e B06 de `../LT01.html`, sem rede externa e sem Docker —
só stdlib.

## Arquivos (nomes congelados)

| Arquivo | Oráculo | Plataforma |
|---|---|---|
| `bloqueio_event_loop.py` | LT01-AT-001: degradação reproduzida e corrigida | qualquer |
| `shutdown_gracioso.py` | LT01-AT-002: shutdown dentro do grace period | sinais com semântica POSIX |
| `coleta_zumbis.py` | LT01-AT-003: processo coletado e explicado | **POSIX exclusivo** (`os.fork`) |
| `vazamento_fd.py` | LT01-AT-010: crescimento detectado, baseline restaurado | qualquer (`/proc` com fallback) |
| `caminho_seguro.py` | LT01-AT-011: escape negado antes de I/O sensível | qualquer |
| `execucao_confinada.py` | LT01-AT-012: non-root, escrita confinada, segredo do ambiente | root só POSIX (`geteuid` ausente = falso honesto) |
| `resolucao_local.py` | LT01-AT-020: NXDOMAIN local e timeout por atraso local | qualquer (só `localhost`/`.invalid`, sem DNS externo) |
| `conexao_tcp.py` | LT01-AT-021: refused no connect, reset na leitura, EOF limpo | qualquer (só `127.0.0.1`, porta efêmera) |
| `tls_local.py` | LT01-AT-022: hostname e validade verificados, verificação ligada | qualquer; handshake real com cadeia = BLOCKED sem material (openssl externo) |
| `pool_local.py` | LT01-AT-030: fila e timeout de aquisição observados, esgotamento distinguido de destino lento | qualquer (fábrica contratada, sem socket no módulo) |
| `deadline_fases.py` | LT01-AT-031: orçamento por fase respeitado, retry só com a tripla junta | qualquer (relógio injetado; teste com relógio controlado) |
| `cancelamento_cooperativo.py` | LT01-AT-032: sinal propagado, trabalho interrompido nos limites, recursos liberados | qualquer (nunca interrompe thread à força) |
| `carga_tempo.py` | LT01-AT-040/042: dois relógios, vazão, Little, breakdown local/upstream | qualquer (só `time`, trabalho injetado) |
| `memoria_rss.py` | LT01-AT-041: leak, cache e baseline distinguidos nas três leituras | **POSIX** (`resource`; fora dele, indisponibilidade registrada) |
| `percentis_cardinalidade.py` | LT01-AT-040/050: p50/p95/máximo e guarda com teto e recusa explícita | qualquer (só `threading` na guarda) |
| `registro_incidente.py` | LT01-AT-060: hipótese antes da leitura, incident.md em seções fixas | qualquer (só `dataclasses`) |
| `exercicio_runbook.py` | LT01-AT-060: runbook exercitado contra degradação local por modo | qualquer (só `dataclasses`, `collections.abc`) |
| `restauracao_baseline.py` | LT01-AT-061: faults desligados + verificação verde, lado a lado | qualquer (só `collections.abc`, sondas injetadas) |

## Nota de plataforma (honesta)

`os.fork`/`os.waitpid` não existem no Windows e `SIGTERM` não tem lá o
mesmo significado. `coleta_zumbis.py` levanta `RuntimeError` fora de POSIX
em vez de simular; os testes AT-003 fazem `skip` com `BLOCKED` registrado
nesse caso. Caminho reproduzível no Windows: Linux real (container ou WSL).
macOS e Linux têm POSIX: a suíte roda integralmente. B02: `listar_fd_visiveis`
rende `[]` onde não há `/proc` (fallback honesto); `rodando_como_root`
rende `False` onde não há `geteuid`, sem simular root fora de POSIX.

## Regras de execução

- Subprocessos/filhos: só filhos possuídos (`os.fork` direto), sempre
  recolhidos por `waitpid` em `finally`. Nenhum teste toca em processo alheio.
- Números de tempo são medição local (exemplo variável): durações fixas de
  0,2 s, n = 2 tarefas; asserções com margem (fator 2×), sem sleep-dependent
  frágil além do necessário ao mecanismo.
- B02: arquivos temporários em `tmp_path` com cleanup do pytest; números de
  FD/contagem são exemplo variável com amostra fixa (N = 8 aberturas,
  ondas 3 + 2); segredo só via ambiente no boot, nunca persistido nem logado.
- B03: stdlib `socket`/`ssl` só contra `localhost`/`127.0.0.1`, sem rede externa;
  servidores de teste em thread com shutdown, join e porta efêmera, sockets do
   chamador fechados em `finally`; TLS sem certificado gerado em runtime (sem
   openssl externo): handshake real com cadeia é BLOCKED honesto, verificadores
   de hostname/validade testados contra estrutura; QUIC sem oráculo de execução
   (stdlib não implementa); tempos e portas são exemplo variável.
- B04: só stdlib (`http.server`/`urllib`/`threading`, mais `queue`/`time` nos
  módulos); só `localhost`/`127.0.0.1` com porta efêmera, sem rede externa;
  servidores de teste em thread com shutdown, join e porta efêmera, respostas
  urllib sempre fechadas em `finally`; relógio controlado nos testes
  (fake `agora` no determinístico; `monotonic` com margem larga no trecho
  localhost, sem assert de tempo exato); números de latência/estatísticas são
  exemplo variável com amostra fixa (N = 8 aquisições, 4 fases, fluxo
  ilimitado com cadência 0.04 s e teto de 1 MB — sem corrida de relógio).

- B05: só stdlib (`time`, `os`/`resource`, `threading`), sem rede e sem
  servidor de teste; relógio monotônico com margem larga (espera >=
  atraso, teto 2–5 s, sem assert de tempo exato); RSS com baseline +
  tolerância (ru_maxrss é pico: vereditos com números injetados);
  cardinalidade com teto declarado; números de latência/contagens são
  exemplo variável com semente/amostra declaradas (040: semente
  20260920, N = 200 por degrau; 050: semente 20260707, N = 500;
  explosão N = 200 contra teto 16).

- B06: só stdlib (`dataclasses`, `collections.abc`), sem rede e sem
  container; alvo local por modo declarado (saudável p95 80.0 ms/erro
  0.001, latência_alta 900.0/0.01, erros_altos 120.0/0.25 — exemplo
  variável); mitigação contém sem apagar o sinal; restauração com
  sondas injetadas; números exemplo variável com semente/amostra
  declaradas (060/061: semente 20260601, N = 50 observações/sondagens).

## Comandos

```sh
uv sync
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run pytest
```

Evidência dos gates: `evidence/b01-gates.txt` (B01), `evidence/b02-gates.txt` (B02),
`evidence/b03-gates.txt` (B03), `evidence/b04-gates.txt` (B04), `evidence/b05-gates.txt` (B05),
`evidence/b06-gates.txt` (B06).
