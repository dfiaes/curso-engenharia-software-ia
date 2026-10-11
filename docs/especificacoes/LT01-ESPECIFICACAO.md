# Especificação do LT01 — Runtime, Linux e redes

> Referência de escopo da versão anterior do módulo. A sequência e o estado atuais estão em [CURRICULO.md](../../CURRICULO.md) e [STATUS.md](../../STATUS.md).

**Versão:** 1.0 · **Data-base:** 14/08/2026 · **Estado:** G0 APROVADO · **Carga:** 6 blocos / 12h

LT01 acontece depois do M03. Seu propósito não é formar administrador Linux ou engenheiro de redes: é tornar o engenheiro Python capaz de explicar, medir e diagnosticar o caminho entre uma requisição e o processo que a atende.

## 1. Resultado do laboratório

Ao concluir LT01, o aluno consegue:

- observar processos, threads, file descriptors, memória e sinais;
- explicar inicialização, shutdown gracioso e processos órfãos/zumbis;
- trabalhar com permissões, filesystem, ambiente e secrets sem depender de “funcionou no meu computador”;
- seguir resolução DNS, conexão TCP ou QUIC, negociação TLS e protocolo HTTP;
- projetar deadlines, timeouts, cancelamento e pools coerentes;
- reconhecer saturação de CPU, memória, FD, conexão, event loop e upstream;
- diagnosticar uma API degradada por hipótese e evidência.

## 2. Pré-requisitos e limites

**Pré-requisitos:** M02 e M03. M06 aprofundará traces; M12 reutilizará isolamento, secrets e operação.

**Fora de escopo:** administração completa de distribuição Linux, roteamento BGP, implementação de TCP/TLS, tuning prematuro de kernel, Kubernetes e cloud networking.

O laboratório roda em containers Linux para ser reproduzível em Windows, macOS e Linux. Ferramentas são exemplos de observação, não o fundamento.

## 3. Ambiente de laboratório

```text
client/load generator
        │ DNS + HTTP/TLS
        ▼
reverse proxy/fault proxy
        │
        ▼
FastAPI/Uvicorn ───► PostgreSQL
        │
        └──────────► fake upstream

OTel Collector ◄── traces/metrics/logs
fault controller ─► latency, reset, DNS, pool, FD, CPU, memory, shutdown
```

Estrutura prevista:

```text
labs/LT01-runtime-linux-redes/
  compose.yaml
  app/
  upstream/
  load/
  faults/
  observability/
  runbooks/
  evidence/
```

Cada falha tem versão guiada e variante inédita de checkpoint. A interface `FaultScenario` permite ativar/restaurar cenários sem comandos destrutivos no host.

## 4. Blocos

## Bloco 1 · Processo, thread, event loop, sinais e shutdown

**IDs:** LT01-B01-C01..06 · **Matriz:** OPS-01, PY-02.

**Conteúdo:** PID/PPID, processo versus thread versus coroutine, scheduler e event loop cooperativo, foreground/background, exit code, stdin/stdout/stderr, SIGINT/SIGTERM/SIGKILL, zombies, PID 1 em container e shutdown gracioso.

**Prática:** instrumentar uma API com endpoint de trabalho longo; observar árvore de processos; enviar SIGTERM durante requests; implementar lifespan, cancelamento e grace period.

**Falhas:** handler que ignora cancelamento, processo que não coleta child, shutdown que aceita trabalho novo e `time.sleep()` no event loop.

**Evidência:** process tree, timeline de shutdown, contagem de requests concluídas/canceladas e teste automatizado.

**Aceitação:** SIGTERM deixa de aceitar tráfego, encerra ou cancela trabalho dentro do prazo e retorna exit code esperado; SIGKILL é explicado como não recuperável.

## Bloco 2 · Filesystem, permissões, ambiente, limites e secrets

**IDs:** LT01-B02-C01..06 · **Matriz:** OPS-01, SEC-03.

**Conteúdo:** path absoluto/relativo, inode/link/symlink, mount e volume, usuário/grupo/mode, umask, ownership, arquivos temporários, atomic rename, environment, `/proc`, file descriptors, `ulimit`/RLIMIT e secret exposure em args/env/logs.

**Prática:** executar como usuário não-root; criar diretório de dados com permissões mínimas; escrita atômica; inspecionar `/proc/<pid>/fd`; provocar e corrigir vazamento de FD.

**Falhas:** symlink escape, volume read-only, permissão incorreta, disco cheio simulado, arquivo temporário previsível e segredo no command line.

**Evidência:** mapa de permissões, gráfico de FD ao longo da carga e teste de cleanup.

**Aceitação:** FD retorna ao baseline, app não requer root, paths externos são negados e segredo não aparece em process args/logs.

## Bloco 3 · DNS, endereços, TCP, TLS e o caminho da conexão

**IDs:** LT01-B03-C01..07 · **Matriz:** OPS-01.

**Conteúdo:** hostname, resolver, records A/AAAA/CNAME, cache/TTL e negative caching; IP/port/socket; TCP handshake, retransmissão, close/reset e estados; TLS 1.3, SNI, certificado, chain, hostname e validade; QUIC como transporte do HTTP/3.

**Prática:** seguir `nome → IP → conexão → TLS → HTTP` com `dig/getent`, `ss`, `curl -v` e `openssl s_client`; correlacionar tempo de DNS/connect/TLS/TTFB.

**Falhas:** nome inexistente, resposta DNS lenta, porta errada, connection refused, reset, certificado expirado/hostname incorreto e IPv6 sem rota.

**Evidência:** connection breakdown e tabela sintoma → camada → comando → conclusão.

**Aceitação:** aluno distingue falha de resolução, transporte, TLS e aplicação sem usar “erro de rede” como diagnóstico final.

## Bloco 4 · HTTP, proxies, pools, deadlines e cancelamento

**IDs:** LT01-B04-C01..07 · **Matriz:** OPS-01, WEB-01, PY-02.

**Conteúdo:** semântica versus framing; HTTP/1.1 keep-alive/head-of-line, HTTP/2 streams/multiplexação, HTTP/3/QUIC; reverse proxy; connection pool; timeout de connect/read/write/pool; deadline end-to-end; propagação de cancelamento; retry somente quando seguro.

**Prática:** medir reutilização de conexão; esgotar pool; configurar timeouts por fase; propagar deadline para upstream; cancelar client e confirmar cleanup server-side.

**Falhas:** timeout infinito, pool menor que concorrência, retry além do deadline, response body não fechado e proxy timeout menor/maior incoerente.

**Evidência:** waterfall de latência, métricas do pool e testes com relógio controlado.

**Aceitação:** nenhuma operação excede deadline sem justificativa; recursos são liberados após timeout/cancel; retry não amplifica carga.

## Bloco 5 · Saturação, Little's Law e observabilidade do runtime

**IDs:** LT01-B05-C01..07 · **Matriz:** OPS-01, OBS-01.

**Conteúdo:** throughput, latency, concurrency e queue; CPU-bound/I/O-bound; RSS versus virtual memory; leak versus cache; FD/socket/pool exhaustion; load average e throttling; percentis; USE method e golden signals; process/system/HTTP semantic conventions.

**Prática:** aumentar carga por degraus, localizar knee point, comparar sync blocking/async, limitar concorrência e observar fila/backpressure.

**Falhas:** CPU loop, memory growth, connection leak, blocking call, upstream lento e cardinalidade explosiva de métricas.

**Evidência:** gráfico carga → throughput/p95/erro/recursos, hipótese e limite de capacidade declarado.

**Aceitação:** conclusão identifica primeiro recurso saturado e não confunde correlação temporal com causa.

## Bloco 6 · Incidente: diagnosticar a API degradada

**IDs:** LT01-B06-C01..07 · **Matriz:** OPS-01, OBS-01, SRE-02.

**Conteúdo:** triagem, impacto, timeline, hipóteses concorrentes, mudança recente, comparação com baseline, mitigação versus correção, verificação e postmortem curto.

**Prática:** receber cenário sem nome da falha, orçamento de 60 minutos e acesso apenas aos sinais definidos. Registrar cada hipótese antes do comando, evidência que a refuta/confirma e próxima decisão.

**Saída:** `incident.md`, comandos/outputs sanitizados, patch mínimo, teste de regressão e runbook.

**Aceitação:** causa provada, impacto mitigado, regression test falha antes/passa depois e ambiente retorna ao baseline.

## 5. Catálogo de aceitação

| ID | Cenário | Condição |
|---|---|---|
| LT01-AT-001 | `time.sleep` no event loop | degradação reproduzida e corrigida |
| LT01-AT-002 | SIGTERM sob carga | shutdown dentro do grace period |
| LT01-AT-003 | child/zombie | processo coletado e explicado |
| LT01-AT-010 | FD leak | crescimento detectado; baseline restaurado |
| LT01-AT-011 | symlink/path escape | acesso negado antes de I/O sensível |
| LT01-AT-012 | execução non-root/read-only | app inicia e escreve apenas onde permitido |
| LT01-AT-020 | DNS NXDOMAIN/timeout | camada identificada corretamente |
| LT01-AT-021 | refused/reset | estados distinguidos por evidência |
| LT01-AT-022 | TLS hostname/expiry | falha validada; nunca desabilitar verificação como correção |
| LT01-AT-030 | pool exhaustion | fila/timeout observados e dimensionamento defendido |
| LT01-AT-031 | deadline/retry | orçamento respeitado e sem retry storm |
| LT01-AT-032 | client cancellation | trabalho e recursos liberados |
| LT01-AT-040 | CPU saturation | knee point e recurso limitante identificados |
| LT01-AT-041 | memory growth | leak/cache/baseline distinguidos |
| LT01-AT-042 | upstream latency | sintoma separado da causa externa |
| LT01-AT-050 | cardinalidade de métrica | série problemática removida sem perder diagnóstico |
| LT01-AT-060 | incidente inédito | hipótese → evidência → correção → regressão completos |
| LT01-AT-061 | restauração do lab | todos os faults desligados e smoke verde |

## 6. Checkpoint LT01

O aluno recebe uma variante inédita. Deve:

1. declarar impacto e baseline;
2. formular no máximo três hipóteses iniciais;
3. escolher cada comando explicando o sinal esperado;
4. localizar a camada da falha;
5. mitigar sem esconder o problema;
6. corrigir e escrever teste de regressão;
7. explicar trade-off e risco residual;
8. restaurar o laboratório.

Perguntas incluem: processo versus coroutine; por que SIGKILL impede cleanup; FD versus conexão; NXDOMAIN versus refused; o que TLS autentica; timeout versus deadline; por que aumentar pool pode piorar; como Little's Law aparece; por que média esconde cauda; como cancelamento se propaga.

## 7. Fontes

| ID | Fonte | Versão/data | Uso | Obsolescência |
|---|---|---|---|---|
| SRC-LT01-01 | [Linux man-pages](https://man7.org/linux/man-pages/) | 6.18+, consultada 14/08/2026 | processos, sinais, proc, FD, limits | média |
| SRC-LT01-02 | [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html) | Linux man-pages | sinais | baixa |
| SRC-LT01-03 | [proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html) | Linux man-pages | observação de processo | média |
| SRC-LT01-04 | [Python asyncio tasks](https://docs.python.org/3.14/library/asyncio-task.html) | Python 3.14.6 | cancelamento, timeout, TaskGroup | média |
| SRC-LT01-05 | [Python signal](https://docs.python.org/3.14/library/signal.html) | Python 3.14 | sinais no runtime | média |
| SRC-LT01-06 | [DNS concepts](https://www.rfc-editor.org/rfc/rfc1034.html) e [implementation](https://www.rfc-editor.org/rfc/rfc1035.html) | RFC 1034/1035 + atualizações aplicáveis | fundamentos DNS | baixa |
| SRC-LT01-07 | [TCP](https://www.rfc-editor.org/rfc/rfc9293.html) | RFC 9293 | transporte TCP | baixa |
| SRC-LT01-08 | [TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html) | RFC 8446 | handshake e segurança | baixa |
| SRC-LT01-09 | [HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) | RFC 9110 | semântica HTTP | baixa |
| SRC-LT01-10 | [HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112.html), [HTTP/2](https://www.rfc-editor.org/rfc/rfc9113.html), [HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html) | RFC 9112–9114 | framing/transporte | baixa |
| SRC-LT01-11 | [QUIC](https://www.rfc-editor.org/rfc/rfc9000.html) | RFC 9000 | base do HTTP/3 | baixa |
| SRC-LT01-12 | [OpenTelemetry system conventions](https://opentelemetry.io/docs/specs/semconv/system/) | vigente na regeneração; partes Development | métricas de sistema/processo | alta |
| SRC-LT01-13 | [OpenTelemetry HTTP conventions](https://opentelemetry.io/docs/specs/semconv/http/) | vigente na regeneração | métricas/traces HTTP | alta |
| SRC-LT01-14 | [Google SRE Monitoring](https://sre.google/workbook/monitoring/) | edição online | sinais e diagnóstico | baixa |
| SRC-LT01-15 | [Google SRE Handling Overload](https://sre.google/sre-book/handling-overload/) | edição online | saturação e load shedding | baixa |

## 8. Critérios editoriais e G0

- 8.000–10.000 palavras visíveis mais lab executável;
- mínimo de 18 resultados esperados e 15 comandos explicados;
- ferramentas apresentadas por sinal que observam, não como lista para decorar;
- toda falha tem restauração automática/idempotente;
- nenhuma ação destrutiva é executada no host;
- variantes de checkpoint não aparecem resolvidas no material;
- exemplos Python 3.14 tipados; Compose fornece o Linux reproduzível.

- [x] seis blocos, competências e dependências definidos;
- [x] ambiente e segurança do laboratório definidos;
- [x] 18 cenários de aceitação definidos;
- [x] evidências e checkpoint definidos;
- [x] fontes primárias selecionadas;
- [x] escopo separado de LT02/LT03.

**Decisão:** LT01 está `ESPECIFICADO` e pode entrar em produção de material após as especificações LT02–LT04. Gate G0 aprovado.

