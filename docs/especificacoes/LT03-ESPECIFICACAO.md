# Especificação do LT03 — Cloud-native, IaC, GitOps e plataforma

> Referência de escopo da versão anterior do módulo. A sequência e o estado atuais estão em [CURRICULO.md](../../CURRICULO.md) e [STATUS.md](../../STATUS.md).

**Versão:** 1.0 · **Data-base:** 14/08/2026 · **Estado:** G0 APROVADO · **Carga:** 6 blocos / 12h

LT03 acontece depois do M10. Seu propósito é levar o serviço Python do artefato OCI a um ambiente declarativo, reconciliado e operável, sem transformar o aluno em operador de um único provedor de nuvem.

## 1. Resultado do laboratório

Ao concluir LT03, o aluno consegue:

- explicar compute, rede, storage, região, zona, failure domain, responsabilidade e custo de cloud;
- construir e distribuir imagem OCI reproduzível, imutável e executada como non-root;
- projetar workloads Kubernetes com configuração, probes, recursos, segurança e shutdown coerentes;
- dimensionar réplicas e autoscaling a partir de carga, fila, SLO e tempo de inicialização;
- provisionar sandbox por IaC com estado, locking, drift, imports e plano revisável;
- operar reconciliação GitOps e entender por que edição manual não é fonte da verdade;
- promover canary por métricas e executar abort/rollback com evidência;
- diagnosticar falha de deploy distinguindo aplicação, manifesto, controlador, nó, rede e dependência.

## 2. Pré-requisitos e limites

**Pré-requisitos:** M03, M04, LT01, LT02 e M10. M12 fornece SLO, segurança e custo; LT04 verificará supply chain e políticas; M13 integra o release.

**Fora de escopo:** certificação de administrador Kubernetes; construir control plane; decorar serviços AWS/Azure/GCP; service mesh obrigatório; multi-cloud como objetivo automático; cluster de produção sem equipe/plataforma; guardar secrets em Git; tratar `kubectl apply` como GitOps.

### Regras conceituais inegociáveis

1. Cloud-native é um modelo operacional e arquitetural, não sinônimo de “rodar Kubernetes”.
2. Container compartilha kernel; não é VM nem fronteira de segurança absoluta.
3. Tag é ponteiro mutável; promoção e rollback referenciam digest OCI imutável.
4. Readiness controla tráfego, liveness reinicia e startup protege inicialização; uma não substitui a outra.
5. Requests influenciam scheduling; limits influenciam enforcement. Valores sem medição são hipótese.
6. PDB limita certas disrupções voluntárias; não protege contra crash, delete direto ou capacity shortage.
7. Autoscaling é control loop atrasado; não cria capacidade instantânea nem corrige dependência saturada.
8. IaC exige state protegido e revisado. `plan` não é prova de segurança nem disponibilidade.
9. GitOps exige estado declarativo, versionado, puxado/reconciliado continuamente; CI fazendo push no cluster não satisfaz sozinho esses princípios.
10. Rollback de aplicação não reverte automaticamente schema, mensagem, dado ou efeito externo.

## 3. Sandbox e arquitetura do laboratório

```text
source + tests
      │ build
      ▼
local OCI registry ── image@sha256:digest
      │
Git desired-state repository
      │ reconciliation
      ▼
Flux adapter ───────────────► Kubernetes 1.36 sandbox (kind)
                              ├─ gateway/service
                              ├─ FastAPI replicas
                              ├─ LT02 workers
                              ├─ PostgreSQL/broker dev dependencies
                              ├─ metrics + OTel
                              └─ policy/RBAC/network boundaries

OpenTofu 1.11 ─► sandbox lifecycle + namespaces + baseline resources
rollout adapter ─► stable/canary + analysis + abort/promotion
fault controller ─► bad image, bad probe, OOM, node drain, dependency latency, drift
```

Estrutura prevista:

```text
labs/LT03-cloud-native-iac-gitops/
  app/
  image/
  infra/
    modules/
    environments/lab/
    .terraform.lock.hcl
  platform/
    base/
    overlays/lab/
    policies/
  gitops/
    clusters/lab/
    apps/
  rollout/
  faults/
  observability/
  runbooks/
  evidence/
```

O sandbox usa cluster local multi-node chamado `course-lt03`, registry local e contas sem acesso a cloud. Scripts validam contexto, nome e diretório antes de `destroy`. O restore do laboratório é idempotente; nenhuma ação alcança outros clusters ou recursos do host.

As portas pedagógicas são `ArtifactRegistry`, `InfrastructureRunner`, `DesiredStateReconciler`, `RolloutController` e `MetricsReader`. OCI, APIs Kubernetes e OpenGitOps definem os conceitos. `kind`, OpenTofu, Flux e o controlador de rollout são adapters substituíveis, pinados por versão e cercados por testes de comportamento.

## 4. Blocos

## Bloco 1 · Cloud, failure domains e artefatos OCI

**IDs:** LT03-B01-C01..07 · **Matriz:** PLAT-01, PY-03, FIN-01.

**Conteúdo:** IaaS/PaaS/SaaS e responsabilidade compartilhada; região, zona, nó e failure domain; compute, network, block/object storage, managed service, egress e quotas; elasticidade versus capacidade; custo fixo/variável; portabilidade versus menor denominador comum; OCI image/index/layers/config/digest/distribution; PID 1, usuário, filesystem e multi-arch.

**Prática:** construir imagem Python em estágios, dependências bloqueadas, non-root, read-only root filesystem e shutdown por SIGTERM; publicar em registry local; inspecionar manifest/layers; executar pelo digest e comparar tamanho, cold start e superfície instalada.

**Evidência:** threat/cost/portability decision table, digest, manifest OCI, tempos/tamanho medidos e teste de shutdown.

**Aceitação:** rebuild controlado é explicado; runtime não depende de tag mutável, root ou ferramenta de build; escolha de serviço gerenciado explicita responsabilidade, egress e saída.

## Bloco 2 · APIs declarativas, workloads, rede e configuração

**IDs:** LT03-B02-C01..08 · **Matriz:** PLAT-01, SEC-03, OPS-01.

**Conteúdo:** control loop e desired/observed state; Pod versus Deployment/StatefulSet/Job; labels/selectors/owner references; Service, DNS e Gateway/Ingress; ConfigMap versus Secret; volume e persistência; namespace; ServiceAccount/RBAC; security context e Pod Security Standards; NetworkPolicy L3/L4 e dependência do CNI.

**Prática:** modelar API e worker com Kustomize base/overlay; usar Deployment/Job conforme lifecycle; expor apenas API; default-deny com regras DNS/API/banco; service accounts distintas; validar permissões com `auth can-i`.

**Falhas:** selector sem endpoints, config ausente, secret vazado, service account ampla, volume efêmero assumido persistente e default-deny bloqueando DNS.

**Evidência:** manifests renderizados, topology map, permission matrix, network tests positivos/negativos e eventos do controlador.

**Aceitação:** app inicia pelo estado declarativo; worker não recebe credencial/permissão da API; comunicação não autorizada falha; dado que precisa sobreviver não reside apenas no container.

## Bloco 3 · Probes, recursos, scheduling, disrupção e autoscaling

**IDs:** LT03-B03-C01..09 · **Matriz:** PLAT-01, SRE-01, OBS-01.

**Conteúdo:** startup/readiness/liveness; preStop, termination grace e endpoint draining; requests/limits, cgroups, CPU throttling, OOMKill e ephemeral storage; QoS; scheduling, affinity/spread e taints; rollout strategy; PDB; HPA e métricas; capacidade mínima, queue age e cold start; scale-to-zero como trade-off.

**Prática:** medir steady state e startup; definir requests por evidência; provocar CPU throttle/OOM; retirar readiness em dependência crítica sem criar restart loop; drenar nó; configurar spread/PDB; escalar API por sinal adequado e worker por backlog em adapter opcional.

**Falhas:** liveness chama dependência externa, probe custa mais que handler, request ausente, limit arbitrário, HPA oscila, réplicas cabem em um nó e drain encontra PDB impossível.

**Evidência:** capacity worksheet, eventos/metrics, curva carga → réplicas → p95/queue age, shutdown timeline e disruption report.

**Aceitação:** deploy mantém capacidade mínima; autoscaling estabiliza sem thrash; pod termina sem request truncado; aluno demonstra os limites de PDB e HPA.

## Bloco 4 · IaC, estado, módulos, drift e lifecycle seguro

**IDs:** LT03-B04-C01..08 · **Matriz:** PLAT-02, SEC-03.

**Conteúdo:** declarativo versus procedural; resource graph; provider/module/input/output; dependency lock; plan/apply/destroy; state como dado sensível; backend/locking; drift, refresh e import; replace/move; environment separation; policy/checks; secrets e credenciais curtas; blast radius.

**Prática:** provisionar sandbox e baseline com OpenTofu; salvar plan binário; revisar mudanças destrutivas; alterar recurso fora da IaC e detectar drift; importar recurso preexistente; mover endereço sem recriar; destruir apenas sandbox validado.

**Falhas:** state concorrente, provider flutuante, secret em state/output, target usado como rotina, rename que força replace e contexto errado.

**Evidência:** plan sanitizado, lockfile, state security note, drift/import/move transcript e teste pós-destroy.

**Aceitação:** `plan` converge para zero após apply; drift é reconciliado intencionalmente; secret não aparece em evidência; tentativa contra target/contexto não autorizado é bloqueada antes da mutação.

## Bloco 5 · GitOps, reconciliação, promoção e configuração por ambiente

**IDs:** LT03-B05-C01..08 · **Matriz:** PLAT-03, GOV-01.

**Conteúdo:** princípios OpenGitOps; desired state declarativo, versionado/imutável, puxado e continuamente reconciliado; source versus build artifact versus environment config; branch versus directory/repository; promotion por digest; overlays sem copy/paste; drift; ownership; secrets criptografados/externos; break-glass e trilha de auditoria.

**Prática:** bootstrap do adapter Flux em repositório local; reconciliar overlay; promover digest por commit; aplicar patch manual e observar reversão; pausar com motivo/TTL para incidente; reverter pelo histórico; comparar estado Git, artifact e observed state.

**Falhas:** Git aponta tag mutável, controlador sem acesso à source, configuração inválida, dependência fora de ordem, drift manual e duas automações editando o mesmo campo.

**Evidência:** commit → artifact → reconciliation → workload trace, diff antes da promoção, drift event e break-glass record.

**Aceitação:** mudança sem commit não persiste; commit ruim falha de modo visível sem apagar último estado saudável quando configurado; promoção preserva identidade do artefato.

## Bloco 6 · Progressive delivery, rollback e incidente de plataforma

**IDs:** LT03-B06-C01..09 · **Matriz:** PLAT-03, SRE-01, SRE-02, SEN-01.

**Conteúdo:** rolling, blue/green e canary; segmentação e representatividade; análise por erro, latência e métrica de negócio; janela, threshold e inconclusive; pause/approval; auto-promotion/abort; rollback de workload versus roll-forward; compatibilidade expand/migrate/contract; feature flags; diagnóstico por eventos, conditions, logs, metrics e traces.

**Prática:** promover versão com regressão de p95 e erro em percentuais graduais; abortar automaticamente; confirmar que stable mantém SLO; executar versão compatível com schema anterior/posterior; conduzir incidente combinando bad probe, node drain e dependência lenta.

**Saída:** rollout policy, analysis run, dashboard, rollback/roll-forward decision, migration compatibility tests, incident timeline e postmortem.

**Aceitação:** versão ruim não alcança 100%; decisão deriva de dados calculados; rollback não corrompe contrato/dado; serviço retorna ao SLO e Git volta a representar o estado desejado.

## 5. Catálogo de aceitação

| ID | Cenário | Condição |
|---|---|---|
| LT03-AT-001 | build OCI | imagem non-root, mínima e identificada por digest |
| LT03-AT-002 | SIGTERM no container | tráfego drenado e processo termina no grace period |
| LT03-AT-003 | portability/cost ADR | failure domains, egress, responsabilidade e saída explícitos |
| LT03-AT-010 | apply declarativo | observed state converge ao manifesto |
| LT03-AT-011 | selector incorreto | ausência de endpoints diagnosticada por condition/event |
| LT03-AT-012 | RBAC | service account só executa verbos/recursos necessários |
| LT03-AT-013 | NetworkPolicy | default-deny e allowlist passam testes positivos/negativos |
| LT03-AT-014 | storage efêmero | reinício não é confundido com persistência |
| LT03-AT-020 | startup/readiness/liveness | cada probe produz somente a reação pretendida |
| LT03-AT-021 | OOM/throttle | causa identificada e recursos recalculados por medida |
| LT03-AT-022 | node drain | capacidade respeita spread e PDB dentro de seu escopo |
| LT03-AT-023 | shutdown sob carga | nenhuma requisição nova; in-flight termina/cancela corretamente |
| LT03-AT-024 | HPA sob degraus | escala estabiliza e mantém métrica/SLO-alvo |
| LT03-AT-025 | upstream saturado | autoscaling não amplifica dependência; limite aplicado |
| LT03-AT-030 | `tofu plan/apply` | segundo plan não contém mudança inesperada |
| LT03-AT-031 | drift | diferença detectada e decisão registrada |
| LT03-AT-032 | import/move | recurso adotado/reendereçado sem recriação indevida |
| LT03-AT-033 | state sensível | acesso mínimo; nenhum secret em log/evidence |
| LT03-AT-034 | destroy guard | target fora do sandbox é recusado antes da ação |
| LT03-AT-040 | reconciliação GitOps | commit converge e status registra revision/digest |
| LT03-AT-041 | edição manual | drift é revertido ou exceção break-glass expira |
| LT03-AT-042 | config inválida | falha visível preserva último workload saudável |
| LT03-AT-043 | promoção | mesmo digest atravessa ambientes |
| LT03-AT-050 | canary saudável | etapas e análise promovem até 100% |
| LT03-AT-051 | canary regressiva | threshold aborta antes de 100% |
| LT03-AT-052 | análise inconclusiva | não é convertida silenciosamente em sucesso |
| LT03-AT-053 | rollback com migration | compatibilidade provada ou rollback bloqueado |
| LT03-AT-060 | incidente inédito | causa localizada por camada; SLO e desired state restaurados |
| LT03-AT-061 | restauração do lab | controllers saudáveis, faults off e recursos sandbox removíveis |

## 6. Checkpoint LT03

O aluno recebe versão, manifesto e condição de plataforma inéditos. Deve:

1. declarar SLO, capacidade mínima e failure domains;
2. produzir artifact OCI e manifest renderizado com digest;
3. revisar plan IaC e diff GitOps;
4. demonstrar RBAC/rede por testes negativos;
5. promover canary com análise reproduzível;
6. diagnosticar falha sem editar permanentemente o cluster;
7. abortar, reverter ou avançar com justificativa de dados/schema;
8. restaurar reconciliação e destruir apenas o sandbox autorizado.

Perguntas incluem: container versus VM; tag versus digest; readiness versus liveness; request versus limit; por que HPA depende de requests; o que PDB não cobre; state versus desired/observed state; por que CI push não basta para GitOps; quando rollback é impossível; como evitar que autoscaling amplifique uma fila/upstream saturado; qual custo real da portabilidade.

## 7. Fontes

| ID | Fonte | Versão/data | Uso | Obsolescência |
|---|---|---|---|---|
| SRC-LT03-01 | [NIST SP 800-145 — Definition of Cloud Computing](https://csrc.nist.gov/pubs/sp/800/145/final) | publicação final | características e modelos de cloud | baixa |
| SRC-LT03-02 | [CNCF Cloud Native Definition](https://github.com/cncf/toc/blob/main/DEFINITION.md) | repositório canônico | modelo cloud-native | média |
| SRC-LT03-03 | [OCI Image Specification](https://github.com/opencontainers/image-spec) | 1.1.1 | imagem, manifest, layers e digest | média |
| SRC-LT03-04 | [OCI Runtime Specification](https://github.com/opencontainers/runtime-spec) | 1.3.0 | runtime bundle/processo | média |
| SRC-LT03-05 | [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec) | 1.1 | registry e distribuição | média |
| SRC-LT03-06 | [Kubernetes releases](https://kubernetes.io/releases/) | 1.36.2 na data-base | baseline e version skew | alta |
| SRC-LT03-07 | [Kubernetes workload controllers](https://kubernetes.io/docs/concepts/workloads/controllers/) | docs 1.36 | APIs declarativas | alta |
| SRC-LT03-08 | [Kubernetes probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/) | docs 1.36 | startup/readiness/liveness | alta |
| SRC-LT03-09 | [Kubernetes resource management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) | docs 1.36 | requests, limits, cgroups | alta |
| SRC-LT03-10 | [Kubernetes disruptions](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) | docs 1.36 | PDB e failure domains | alta |
| SRC-LT03-11 | [Kubernetes HPA](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) | autoscaling/v2, docs 1.36 | control loop de escala | alta |
| SRC-LT03-12 | [Kubernetes NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/) | networking.k8s.io/v1, docs 1.36 | isolamento L3/L4 | alta |
| SRC-LT03-13 | [Kubernetes RBAC good practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/) | docs 1.36 | least privilege | alta |
| SRC-LT03-14 | [OpenTofu documentation](https://opentofu.org/docs/) | 1.11 | linguagem, state e lifecycle IaC | alta |
| SRC-LT03-15 | [OpenTofu provisioning workflow](https://opentofu.org/docs/cli/run/) | 1.11 | plan/apply/destroy | alta |
| SRC-LT03-16 | [OpenGitOps Principles](https://opengitops.dev/) | 1.0.0 | fundamento vendor-neutral de GitOps | baixa |
| SRC-LT03-17 | [Flux core concepts](https://fluxcd.io/flux/concepts/) | 2.8.8 baseline | adapter de reconciliação | alta |
| SRC-LT03-18 | [Argo Rollouts canary](https://argo-rollouts.readthedocs.io/en/stable/features/canary/) e [analysis](https://argo-rollouts.readthedocs.io/en/stable/features/analysis/) | 1.9.1 | adapter de progressive delivery | alta |
| SRC-LT03-19 | [FinOps Framework](https://www.finops.org/framework/) | vigente na regeneração | custo, accountability e decisão | média |
| SRC-LT03-20 | [Google SRE — Canarying Releases](https://sre.google/workbook/canarying-releases/) | edição online | desenho de análise e rollout | baixa |

Implementações são usadas para tornar mecanismos observáveis. A avaliação cobra OCI/Kubernetes/OpenGitOps/IaC e comportamento operacional, não comandos exclusivos de `kind`, Flux ou Argo.

## 8. Critérios editoriais e G0

- 9.000–11.000 palavras visíveis mais laboratório executável;
- versões de Kubernetes, OpenTofu, controllers e providers pinadas;
- manifests renderizados e validados antes de apply;
- imagem referenciada por digest em promoção e evidência;
- pelo menos 29 cenários de aceitação, incluindo negativos;
- métricas de canary calculadas de tráfego real do lab, nunca hardcoded;
- nenhuma credencial real de cloud e nenhum requisito de conta paga;
- qualquer ação destrutiva valida nome/contexto absoluto do sandbox;
- comandos manuais de incidente viram commit, expiram ou são revertidos pelo reconciler;
- conteúdo diferencia padrão, API, controlador, provider e decisão local.

- [x] seis blocos, competências e dependências definidos;
- [x] sandbox local seguro e adapters definidos;
- [x] lifecycle OCI → IaC → GitOps → rollout definido;
- [x] 29 cenários de aceitação definidos;
- [x] falhas, evidências e checkpoint definidos;
- [x] fontes primárias/canônicas atuais selecionadas;
- [x] escopo separado de LT02, LT04 e M12.

**Decisão:** LT03 está `ESPECIFICADO` e pode entrar em produção de material após a especificação LT04. Gate G0 aprovado.
