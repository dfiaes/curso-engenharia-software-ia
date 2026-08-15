# Plano de estruturação e melhoria do curso — 2026

**Versão:** 1.0 · **Data-base:** 14/08/2026 · **Estado:** aprovado para implementação

Este documento define como concluir a estruturação do curso antes de retomar a regeneração dos módulos. Ele transforma a auditoria em trabalho executável, com dependências, critérios de qualidade e gates de aprovação.

## 1. Resultado pretendido

Formar um engenheiro de software sênior capaz de:

1. construir software com auxílio de agentes de IA sem terceirizar o raciocínio;
2. projetar, implementar, avaliar e operar sistemas que contêm IA;
3. trabalhar em Python moderno com profundidade de produção;
4. aplicar fundamentos de engenharia de software, sistemas distribuídos, segurança, dados e SRE;
5. trocar de modelo, provedor, framework ou infraestrutura sem reescrever o domínio;
6. demonstrar competência por código executável, decisões registradas, métricas medidas e um produto real.

Python é a linguagem canônica. Referências a .NET são somente pontes mentais opcionais para aproveitar experiência prévia; não constituem conteúdo, exercícios ou entregáveis do curso.

## 2. Escopo e carga horária

| Componente | Blocos de 2h | Horas | Observação |
|---|---:|---:|---|
| M00–M13 | 111 | 222h | núcleo já definido no currículo |
| LT01 · Runtime, Linux e redes | 6 | 12h | após M03 |
| LT02 · Sistemas distribuídos, dados e mensageria | 6 | 12h | após M05 |
| LT03 · Cloud-native, IaC, GitOps e plataforma | 6 | 12h | após M10 |
| LT04 · Qualidade avançada, supply chain e governança de IA | 6 | 12h | após M12 |
| **Currículo verificável** | **135** | **270h** | checkpoints e evidências incluídos |

As trilhas paralelas de inglês, ADRs, comunicação e marketing pessoal continuam fora das 270h. Em ritmo irregular, a previsão realista passa a ser de 7 a 10 meses.

## 3. Arquitetura curricular

### Fase 0 · Pilotar IA com controle

M00–M01. Contexto, harnesses, especificações, decomposição, revisão, automação e guardrails mecânicos.

### Fase 1 · Base de engenharia em Python

M02–M04 + LT01. Python, API, banco, testes, containers, CI, Linux, redes, design docs e arquitetura evolutiva.

### Fase 2 · Sistemas com LLM

M05–M07 + LT02. Contratos, gateways, custo, cache, evals, observabilidade, RAG, filas, consistência e resiliência distribuída.

### Fase 3 · Agentes, protocolos e grafos

M08–M10 + LT03. Workflows, agentes, MCP, A2A, máquinas de estado, grafos, Kubernetes, IaC, GitOps e operação de plataforma.

### Fase 4 · Teoria, produção responsável e produto

M11–M13 + LT04. ML/DL, inferência local, segurança agêntica, multi-tenancy, billing, SRE, supply chain, governança e capstone.

## 4. Conteúdo dos laboratórios transversais

### LT01 · Runtime, Linux e redes · 12h

1. processos, threads, sinais, file descriptors e limites;
2. filesystem, permissões, usuários, secrets e variáveis de ambiente;
3. DNS, TCP, TLS, HTTP/1.1, HTTP/2 e HTTP/3;
4. timeouts, cancelamento, connection pools e esgotamento de recursos;
5. diagnóstico com ferramentas de sistema e observabilidade;
6. laboratório de falhas e checkpoint operacional.

**Evidência:** diagnosticar uma API Python degradada a partir de métricas, traces, sockets e logs, corrigindo a causa sem tentativa aleatória.

### LT02 · Sistemas distribuídos, dados e mensageria · 12h

1. relógios, ordem, consistência, CAP e PACELC;
2. filas, streams, produtor-consumidor e backpressure;
3. entrega at-least-once, deduplicação e idempotência durável;
4. outbox/inbox, sagas e compensações;
5. particionamento, replicação, backup, PITR e retenção;
6. laboratório de concorrência, retry storm e recuperação.

**Evidência:** processar jobs de IA de forma recuperável em múltiplas instâncias, sem duplicar efeitos externos.

### LT03 · Cloud-native, IaC, GitOps e plataforma · 12h

1. modelo declarativo, reconciliação, workloads e scheduling;
2. networking, ingress/gateway, storage e configuração;
3. requests/limits, probes, autoscaling e disruption;
4. IaC, ambientes reproduzíveis e gestão de estado;
5. GitOps, progressive delivery, rollback e platform engineering;
6. laboratório de deploy, falha, observação e recuperação.

**Evidência:** promover a aplicação por ambientes com configuração declarativa, telemetria e rollback verificável.

### LT04 · Qualidade, supply chain e governança de IA · 12h

1. contract, property-based, mutation e concurrency testing;
2. carga, caos, shadow, canary e critérios de rollback;
3. SBOM, proveniência, assinatura, pinning e SLSA;
4. threat modeling e riscos do ciclo de vida de IA;
5. model/data/prompt cards, lineage, drift e human evaluation;
6. release readiness review e auditoria final.

**Evidência:** produzir um pacote de release verificável contendo artefato assinado, SBOM, resultados de eval, risk register e decisão de go/no-go.

## 5. Frentes de implementação

### Frente A · Governança documental

- definir documentos canônicos e eliminar números conflitantes;
- manter changelog das decisões curriculares;
- separar progresso editorial de progresso de aprendizagem;
- exigir IDs estáveis para competências e entregáveis.

### Frente B · Rastreabilidade

- ligar competência a módulo/bloco;
- ligar módulo a prática e evidência em disco;
- ligar checkpoint ao conteúdo que o sustenta;
- ligar afirmações técnicas a fontes versionadas;
- registrar cobertura ausente, parcial, coberta e verificada.

### Frente C · Regeneração e complementação

- regenerar integralmente M12 e M13;
- revisar M00 e os READMEs antigos;
- auditar M01–M11 contra a nova matriz;
- criar LT01–LT04;
- criar `docs/fundamentos-de-engenharia.md` a partir das caixas integradas.

### Frente D · Neutralidade tecnológica

- núcleo baseado em interfaces, contratos e padrões abertos;
- adaptadores de provedores isolados;
- fake determinístico obrigatório;
- suíte de compatibilidade reaproveitada entre adaptadores;
- detalhes proprietários em apêndices datados.

### Frente E · Verificação automática

- validar HTML e links;
- extrair snippets executáveis;
- executar `ruff`, type checker e `pytest` onde aplicável;
- verificar placeholders e código truncado;
- validar cobertura das perguntas de checkpoint;
- registrar versões e data de revisão das fontes.

## 6. Gates de qualidade

Um artefato só muda de estado quando satisfaz o gate correspondente.

| Gate | Condição para aprovação |
|---|---|
| G0 · Escopo | objetivos, pré-requisitos, blocos, entregáveis e fontes definidos |
| G1 · Conteúdo | teoria, trade-offs, anti-padrões e integração curricular completos |
| G2 · Execução | código e comandos executados; resultados esperados confirmados |
| G3 · Avaliação | checkpoint possui cobertura no texto e evidência objetiva |
| G4 · Portabilidade | domínio não depende de um provedor; adapters passam nos mesmos contratos |
| G5 · Produção | segurança, observabilidade, custo, falhas e rollback foram tratados |
| G6 · Editorial | HTML, links, acessibilidade, consistência e referências aprovados |

## 7. Definition of Done de um módulo

Um módulo está **verificado** somente quando:

- todos os blocos prometidos existem e têm tempo/prática compatíveis;
- conceitos novos têm fundamento, limites e quando não usar;
- código canônico é Python moderno, tipado e executável;
- não existem `...`, resultados inventados ou testes que sempre passam;
- toda prática possui resultado esperado observável;
- checkpoint mede explicação, execução, diagnóstico e decisão;
- há uma peça integrada ao capstone ou justificativa explícita;
- riscos de segurança, custo e operação relevantes foram exercitados;
- fontes primárias estão ligadas às afirmações versionáveis;
- a linha correspondente na matriz foi marcada como verificada.

## 8. Sequência recomendada

1. **Fundação documental:** aprovar este plano, matriz, política de fontes e status.
2. **Correções de consistência:** currículo, README, READMEs dos módulos e guia de regeneração.
3. **Especificações dos quatro laboratórios:** roteiros, entregáveis, fontes e checkpoints.
4. **M12:** regeneração completa orientada a ameaças e operação real.
5. **M13:** reconstrução como roteiro executável e integração do produto.
6. **LT01 e LT02:** preencher fundamentos operacionais e distribuídos antes da revisão global.
7. **LT03 e LT04:** completar plataforma, supply chain e governança.
8. **Auditoria M00–M11:** fechar lacunas identificadas sem reescrever conteúdo bom.
9. **Guia de fundamentos:** consolidar referências cruzadas, sem duplicar módulos.
10. **Automação de qualidade:** tornar os gates repetíveis no CI.
11. **Release Candidate do curso:** executar um percurso de validação ponta a ponta.
12. **Congelamento v4.0:** somente após zero bloqueadores P0/P1 abertos.

## 9. Documentos canônicos

| Pergunta | Fonte da verdade |
|---|---|
| O que o aluno deve aprender? | `CURRICULO.md` |
| Como o curso será concluído? | este documento |
| Onde cada competência é ensinada e provada? | `docs/MATRIZ-RASTREABILIDADE.md` |
| Qual é a política de fontes e neutralidade? | `docs/POLITICA-FONTES-E-AGNOSTICISMO.md` |
| O que já foi implementado? | `docs/STATUS-IMPLEMENTACAO-CURSO.md` |
| O que o aluno já estudou? | `PROGRESSO.md` |
| Como regenerar um módulo? | `docs/GUIA-REGENERACAO-MODULOS.md` |

## 10. Controle de mudança

Qualquer alteração de escopo deve atualizar, na mesma mudança:

1. a carga e o mapa em `CURRICULO.md`;
2. as competências afetadas na matriz;
3. o backlog e o changelog do status;
4. o README se a navegação ou os números públicos mudarem.

