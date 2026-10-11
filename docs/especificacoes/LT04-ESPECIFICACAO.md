# Especificação do LT04 — Release engineering e aprendizado operacional

> Referência de escopo da versão anterior do módulo. A sequência e o estado atuais estão em [CURRICULO.md](../../CURRICULO.md) e [STATUS.md](../../STATUS.md).

**Versão:** 1.1 · **Data-base:** 26/09/2026 · **Estado:** PRÉVIA EDITORIAL TIER 1; extensão v4 com G0 aprovado · **Carga:** 6 blocos

LT04 acontece depois do M12. Na Prévia Editorial v1, seu propósito é transformar “parece pronto” em uma decisão de release comunicável e reversível: versão, gates, rollback e restauração, sinais, comunicação e pós-mortem. Esse é o recorte Tier 1 já produzido no HTML e no laboratório local.

A extensão de certificação v4 aprofunda estratégia de testes, comportamento probabilístico, cadeia de fornecimento, segurança e riscos humanos/organizacionais da IA. Ela permanece especificada nas seções posteriores e não é apresentada como cobertura concluída da prévia.

### Escopo publicado na Prévia Editorial v1

| Bloco | Conteúdo disponível |
|---|---|
| B01 | versionamento, changelog e digest imutável |
| B02 | gates, evidência e GO/CONDITIONAL/NO-GO |
| B03 | rollback, restauração e stop conditions |
| B04 | sinais, cauda, slices e dados ausentes |
| B05 | comunicação, aprovadores e reprodução independente |
| B06 | pós-mortem, ações e waivers com expiração |

## 1. Resultado da extensão de certificação v4

Ao concluir LT04, o aluno consegue:

- escolher testes por risco e detectar defeitos que unit tests convencionais não revelam;
- aplicar contract, property-based, mutation, metamorphic, differential, load e chaos testing;
- medir incerteza, calibrar avaliadores automáticos com humanos e evitar overfitting ao benchmark;
- inventariar dependências, licenças, vulnerabilidades, modelos, dados, prompts e serviços externos;
- gerar/validar SBOM, provenance e assinatura associadas ao mesmo artifact imutável;
- aplicar secure SDLC e políticas sem transformar scanner em oráculo;
- classificar e tratar risco de IA por uso, impacto, atores e contexto regulatório aplicável;
- conduzir shadow/canary, red team, game day e release readiness review;
- emitir `GO`, `CONDITIONAL GO` ou `NO-GO` com claims rastreáveis e risco residual explícito.

## 2. Pré-requisitos e limites

**Pré-requisitos:** M01–M12 e LT01–LT03. M13 consumirá o dossiê como gate final de lançamento.

**Fora de escopo:** certificação ISO; parecer jurídico; compliance por checklist; provar ausência total de vulnerabilidade/viés; usar cobertura como proxy de qualidade; aceitar assinatura sem verificar identidade/policy; promover modelo por leaderboard isolado.

### Regras conceituais inegociáveis

1. Testes selecionam evidência contra riscos; quantidade, cobertura e pass rate isolados não provam qualidade.
2. Mutation score mede força de uma suíte dentro de um universo de mutações, não correção do sistema.
3. Resultado estatístico inclui amostra, definição, intervalo/incerteza e limitações; um número sem proveniência não é evidência.
4. LLM-as-judge é um instrumento a calibrar, versionar e monitorar, não ground truth.
5. SBOM é inventário, não prova de segurança. Assinatura prova vínculo com uma identidade/chave sob uma policy, não benevolência do conteúdo.
6. Provenance só protege quando o consumidor verifica autenticidade e expectativas.
7. Scanner produz sinais com falso positivo/negativo; findings têm triagem, owner, prazo e disposição auditável.
8. Risco de IA depende do uso e impacto, não apenas do modelo. Trocar modelo não elimina responsabilidade do sistema.
9. Governança inclui modelo, dados, prompts, código, tools, memória, avaliações, decisões, operadores e fornecedores.
10. `CONDITIONAL GO` exige condição verificável, owner e expiração; não é nome elegante para aceitar bloqueador.

## 3. Laboratório e dossiê de release

```text
release candidate (Python + IA)
       │
       ├─ deterministic verification
       │   contracts / properties / mutations / load / chaos
       ├─ AI verification
       │   datasets / human labels / judge calibration / red team
       ├─ supply-chain evidence
       │   lock / SBOM / vulnerabilities / provenance / signature
       ├─ governance evidence
       │   inventory / lineage / impact / risk / oversight / incidents
       └─ operational evidence
           SLO / shadow / canary / rollback / game day
                         │
                         ▼
                  release decision engine
                  GO | CONDITIONAL GO | NO-GO
```

Estrutura prevista:

```text
labs/LT04-qualidade-supply-chain-governanca/
  candidate/
  test-strategy/
  contracts/
  properties/
  mutations/
  performance/
  chaos/
  evals/
    datasets/
    human/
    calibration/
    red-team/
  supply-chain/
    sbom/
    provenance/
    policy/
  governance/
    inventory/
    lineage/
    risks/
    impact/
  release/
    claims.yaml
    gates.yaml
    decision.md
  evidence/
```

O candidato contém defeitos semeados por variante: quebra de contrato, condição de corrida, teste fraco, regressão de cauda, dependency confusion simulada, provenance divergente, judge enviesado, vazamento cross-tenant e canary com dano de negócio. O aluno conhece a taxonomia, não a localização.

`claims.yaml` liga cada alegação a requisito, artifact digest, comando/método, raw evidence, cálculo, threshold, revisor, validade e limitações. O decision engine apenas calcula gates declarados; não fabrica resultados nem substitui assinatura humana responsável.

## 4. Blocos da extensão de certificação v4

## Bloco 1 · Estratégia de testes por risco e oráculos fortes

**IDs:** LT04-B01-C01..09 · **Matriz:** TEST-01, TEST-02, AIW-03.

**Conteúdo:** risk-based testing e níveis unit/component/integration/e2e; test doubles por fronteira; contract/consumer compatibility; property-based e shrinking; stateful/model-based; mutation; metamorphic relations; differential testing; determinismo, clock/random/I/O controláveis; flaky tests e test impact.

**Prática:** mapear riscos para técnicas; definir schemas e contract tests; gerar sequências concorrentes por propriedades; executar mutantes; criar relação metamórfica para ranking/normalização; comparar adapters pela mesma entrada; eliminar flake sem retries cegos.

**Evidência:** strategy matrix risco → técnica → oracle → evidência, corpus de contraexemplos minimizados, survivors triados e teste que falha antes/passa depois.

**Aceitação:** suíte detecta os defeitos semeados relevantes; surviving mutant crítico gera melhoria ou justificativa; teste não depende de resultado hardcoded do candidato.

## Bloco 2 · Performance, resiliência e avaliação estatística de IA

**IDs:** LT04-B02-C01..10 · **Matriz:** TEST-02, EVAL-01, EVAL-02, GOV-02.

**Conteúdo:** workload model; load/stress/spike/soak; coordinated omission e warm-up; percentis e confidence intervals; capacity versus SLO; chaos hypothesis/steady state/blast radius/abort; dataset slices e leakage; repeated trials; effect size; bootstrap; human rubric/blinding/disagreement; judge calibration; shadow, drift e benchmark overfitting.

**Prática:** executar carga por degraus e soak curto; injetar falha com abort automático; avaliar candidate/baseline em dataset versionado e slices; obter labels humanos cegos; medir concordância/viés do judge; rodar shadow sem efeito; decidir se diferença é material.

**Evidência:** raw samples, seed/config, notebook/script reproduzível, intervals, slice report, confusion/disagreement analysis, chaos report e decisão de capacidade.

**Aceitação:** média não esconde cauda; amostra/intervalo/limitação acompanham claim; judge divergente não é usado sem ajuste/abstenção; chaos para ao ultrapassar blast radius.

## Bloco 3 · Dependências, SBOM, provenance, assinatura e verificação

**IDs:** LT04-B03-C01..10 · **Matriz:** SUP-01, PY-03, GOV-01.

**Conteúdo:** source/build/dependency/package/distribution; lock e hashes; direct/transitive/development dependency; typosquatting/dependency confusion; licença e EOL; SBOM SPDX/CycloneDX; VEX como contexto; SLSA source/build tracks; in-toto attestation; artifact digest; signing/keyless identity/transparency log; verification policy; reproducible builds e rebuildability.

**Prática:** resolver ambiente limpo; gerar SBOM nos formatos escolhidos; comparar com lock e artifact; produzir provenance; assinar artifact OCI; verificar digest, issuer/subject e builder expectation; adulterar artifact/provenance e confirmar rejeição; triar vulnerabilidade por reachability/exposure/fix.

**Evidência:** lock, SBOM validada, license/vulnerability report, provenance, verification transcript, artifact digest e exception record com expiry.

**Aceitação:** SBOM corresponde ao artifact lançado; tampering ou signer/builder inesperado bloqueia; finding crítico não é fechado apenas porque scanner diferente silencia.

## Bloco 4 · Secure SDLC, abuso, policy-as-code e resposta

**IDs:** LT04-B04-C01..10 · **Matriz:** SEC-01..03, TEST-02, SUP-01.

**Conteúdo:** NIST SSDF e secure-by-design; threat model vivo; revisão/branch protection; secret, SAST, dependency, container e IaC scanning; DAST/fuzzing; ASVS; agent goal hijack, tool misuse, privilege abuse, memory/context poisoning e agentic supply chain; policy-as-code; waiver; vulnerability disclosure, patch e incident response.

**Prática:** mapear práticas SSDF; atacar candidato por abuse cases de M12; rodar scanners complementares; confirmar exploitability em sandbox; escrever policies para provenance, severity, privilege e manifest; testar bypass; simular disclosure → triage → patch → advisory.

**Evidência:** threat/abuse suite, findings ledger, policy tests, waiver assinada/expirável, patch SLA e disclosure runbook.

**Aceitação:** controles bloqueiam bypass sem depender de prompt; falso positivo é descartado com evidência; falso negativo semeado é capturado por técnica independente; waiver vencida bloqueia release.

## Bloco 5 · Governança, inventário, lineage e impacto de IA

**IDs:** LT04-B05-C01..11 · **Matriz:** GOV-01, GOV-02, EVAL-02, SEN-01.

**Conteúdo:** govern/map/measure/manage do NIST AI RMF; intended use/misuse e atores afetados; impacto/direitos; risk tier e apetite; system/model/data cards; W3C PROV/OpenLineage; versões de modelo/dataset/prompt/tool/policy; consentimento, origem, retenção e exclusão; explicabilidade apropriada; human oversight e contestação; third-party risk; monitoring/drift/incidente; contexto LGPD, EU AI Act e ISO/IEC 42001.

**Prática:** inventariar componentes e fornecedores; construir lineage do claim à execução; preencher impact assessment proporcional; definir owners/thresholds/oversight/appeal; testar deleção e trace de provenance; simular mudança silenciosa de modelo/termo e incidente de dano.

**Evidência:** AI system inventory, model/system/data cards, lineage graph, impact/risk register, human-control matrix, supplier exit plan e incident record.

**Aceitação:** toda decisão automatizada relevante tem owner, finalidade, dados, versão, controle e canal de contestação; componente sem origem/licença/uso permitido bloqueia; obrigação legal é marcada para revisão especializada, não inventada pelo curso.

## Bloco 6 · Release readiness, red team e decisão go/no-go

**IDs:** LT04-B06-C01..11 · **Matriz:** GOV-02, PLAT-03, SRE-01..02, CAP-02, SEN-01.

**Conteúdo:** release contract; entry/exit criteria; claims-evidence graph; independência de revisão; residual risk; stop conditions; red team versus pentest; shadow/canary; rollback/roll-forward; game day; operational readiness; conditional approval; expiry/revalidation; comunicação técnica e executiva.

**Prática:** montar dossiê do mesmo digest; executar red team variante; promover shadow/canary; disparar stop condition; restaurar serviço/dado; fazer revisão cruzada; apresentar decisão em 10 minutos para engenharia, produto, segurança e negócio.

**Saída:** `release-dossier/` com manifest, claims, evidências brutas, cálculos, gaps, riscos, approvals e decisão reproduzível.

**Aceitação:** claim sem evidência falha fechado; P0/P1 aberto produz NO-GO; conditional item expira automaticamente; reviewer independente reproduz a decisão a partir do dossiê.

## 5. Catálogo de aceitação

| ID | Cenário | Condição |
|---|---|---|
| LT04-AT-001 | contract break | incompatibilidade detectada antes do deploy |
| LT04-AT-002 | property counterexample | falha minimizada e persistida como regressão |
| LT04-AT-003 | mutant crítico | morto por oracle relevante ou risco justificado |
| LT04-AT-004 | adapter diferencial | divergência normalizada ou explicitamente suportada |
| LT04-AT-005 | flake | causa removida; retry não mascara defeito |
| LT04-AT-010 | load com cauda | p95/p99, erro e throughput derivados de raw samples |
| LT04-AT-011 | coordinated omission | método detecta/evita medição enganosa |
| LT04-AT-012 | chaos blast radius | experimento aborta e restaura steady state |
| LT04-AT-013 | dataset slice | regressão agregada/segmentada não é ocultada |
| LT04-AT-014 | judge calibration | divergência humana medida; abstenção/threshold aplicados |
| LT04-AT-015 | shadow | nenhuma ação real, billing ou escrita de negócio ocorre |
| LT04-AT-020 | ambiente bloqueado | resolução limpa reproduz dependências/hashes |
| LT04-AT-021 | SBOM | componentes diretos/transitivos correspondem ao artifact |
| LT04-AT-022 | provenance | source, builder, inputs e digest verificam |
| LT04-AT-023 | artifact adulterado | assinatura/provenance falham fechado |
| LT04-AT-024 | identidade inesperada | assinatura válida mas fora da policy é rejeitada |
| LT04-AT-025 | vulnerabilidade | decisão inclui exposure, reachability, fix e expiry |
| LT04-AT-030 | secret/scanner | segredo semeado bloqueado e removido do histórico/evidência |
| LT04-AT-031 | agent abuse | goal/tool/privilege/memory attack contido por controle técnico |
| LT04-AT-032 | policy bypass | teste negativo impede campo/artefato não verificável |
| LT04-AT-033 | waiver expirada | release bloqueada automaticamente |
| LT04-AT-034 | disclosure | triage, patch, advisory e regression test rastreáveis |
| LT04-AT-040 | inventory/lineage | execução liga uso, versões, dados, prompt, tool e owner |
| LT04-AT-041 | uso fora do previsto | bloqueio/oversight/novo assessment acionado |
| LT04-AT-042 | deleção/retention | dado e derivados tratados segundo política verificável |
| LT04-AT-043 | fornecedor muda modelo | drift contratual/técnico detectado antes de promoção |
| LT04-AT-044 | contestação humana | decisão pode ser revista sem loop automatizado opaco |
| LT04-AT-050 | claim sem evidência | gate falha fechado |
| LT04-AT-051 | P0/P1 aberto | decisão obrigatória NO-GO |
| LT04-AT-052 | conditional go | owner, condição, prazo e revalidação presentes |
| LT04-AT-053 | canary ruim | stop condition aborta e rollback/roll-forward é verificado |
| LT04-AT-054 | revisão independente | decisão reproduzida do mesmo digest e raw evidence |
| LT04-AT-060 | variante inédita | defeitos combinados encontrados, tratados e comunicados |
| LT04-AT-061 | restauração | candidate isolado, estado saudável e evidência imutável |

## 6. Gates do dossiê

| Gate | Pergunta fechada | Falha obrigatória |
|---|---|---|
| Q1 · Contratos e propriedades | invariantes e compatibilidade foram provados? | quebra P0/P1 ou oracle inválido |
| Q2 · Capacidade e resiliência | SLO/capacidade sobrevivem ao workload e falhas? | stop condition, dado ausente ou teste enganoso |
| Q3 · IA e humanos | qualidade/segurança por slice e calibração são aceitáveis? | dano crítico, judge não calibrado ou dataset sem provenance |
| Q4 · Supply chain | artifact, SBOM, provenance e identidade verificam? | digest/identity/builder/policy divergente |
| Q5 · Segurança e governança | abuso, dados, impacto, oversight e owners estão tratados? | risco proibido/P0/P1 ou obrigação desconhecida |
| Q6 · Operação e reversão | shadow/canary/runbook/restore/rollback foram exercitados? | não recuperável dentro do objetivo |
| Q7 · Claims e decisão | terceiro reproduz claims e cálculos? | hardcode, evidência ausente/expirada ou conflito não explicado |

`GO` exige Q1–Q7 aprovados. `CONDITIONAL GO` só admite itens não bloqueantes explicitamente permitidos por policy. Qualquer stop condition ou P0/P1 aberto resulta em `NO-GO`.

## 7. Checkpoint LT04

O aluno recebe candidato e defeitos inéditos. Deve:

1. congelar digest, escopo, claims e stop conditions;
2. selecionar técnicas por risco e justificar o que não será testado;
3. produzir raw evidence e cálculos reproduzíveis;
4. verificar SBOM, provenance, assinatura e policy como consumidor;
5. calibrar avaliação de IA contra labels humanos;
6. atualizar inventory, lineage, impact e risk register;
7. executar red team, shadow/canary e cenário de recuperação;
8. emitir/defender decisão e comunicar limitações sem suavizá-las.

Perguntas incluem: cobertura versus adequação; o que mutation score não prova; por que média/leaderboard enganam; assinatura versus confiança; SBOM versus VEX; provenance versus reprodutibilidade; risco do builder; modelo versus sistema de IA; quando revisão humana é controle falso; diferença entre GO condicionado e dívida sem owner; quem pode aceitar qual risco.

## 8. Fontes

| ID | Fonte | Versão/data | Uso | Obsolescência |
|---|---|---|---|---|
| SRC-LT04-01 | [pytest documentation](https://docs.pytest.org/en/stable/) | stable na regeneração | fundamentos do runner/fixtures | média |
| SRC-LT04-02 | [Hypothesis documentation](https://hypothesis.readthedocs.io/en/latest/) e [QuickCheck paper](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf) | vigente + Claessen/Hughes 2000 | property-based/shrinking | média/baixa |
| SRC-LT04-03 | [Pact Specification](https://github.com/pact-foundation/pact-specification) | vigente na regeneração | consumer contract | média |
| SRC-LT04-04 | [mutmut documentation](https://mutmut.readthedocs.io/en/latest/) | vigente na regeneração | adapter de mutation testing Python | alta |
| SRC-LT04-05 | [k6 documentation](https://grafana.com/docs/k6/latest/) | vigente na regeneração | adapter de load testing | alta |
| SRC-LT04-06 | [Principles of Chaos Engineering](https://principlesofchaos.org/) | princípios canônicos | hipótese/blast radius | baixa |
| SRC-LT04-07 | [NIST AI Resource Center — TEVV](https://airc.nist.gov/) | consultado 14/08/2026 | testing/evaluation/verification/validation de IA | alta |
| SRC-LT04-08 | [Model Cards for Model Reporting](https://dl.acm.org/doi/10.1145/3287560.3287596) | Mitchell et al., 2019 | documentação de modelo | baixa |
| SRC-LT04-09 | [Datasheets for Datasets](https://dl.acm.org/doi/10.1145/3458723) | Gebru et al., 2021 | documentação de dados | baixa |
| SRC-LT04-10 | [SLSA Specification](https://slsa.dev/spec/v1.2/) | 1.2 approved | source/build/provenance/verification | média |
| SRC-LT04-11 | [SPDX Specification](https://spdx.github.io/spdx-spec/) | 3.0.1 | SBOM/licenças | média |
| SRC-LT04-12 | [CycloneDX Specification](https://cyclonedx.org/specification/overview/) | 1.7 / ECMA-424 | SBOM/ML-BOM/VEX | média |
| SRC-LT04-13 | [in-toto Specification](https://github.com/in-toto/attestation) | v1 model | attestation envelope/model | média |
| SRC-LT04-14 | [Sigstore/Cosign signing overview](https://docs.sigstore.dev/cosign/signing/overview/) | vigente na regeneração | adapter de assinatura/identidade | alta |
| SRC-LT04-15 | [NIST SSDF SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final) | final 1.1; revisão 1.2 ainda draft na data-base | secure SDLC | média |
| SRC-LT04-16 | [NIST SP 800-218A](https://csrc.nist.gov/pubs/sp/800/218/a/final) | final, 2024 | secure development de GenAI/foundation models | média |
| SRC-LT04-17 | [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) | 5.0 | requisitos verificáveis de aplicação | média |
| SRC-LT04-18 | [OWASP Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) | 2026 | abuse cases agênticos | alta |
| SRC-LT04-19 | [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) | 1.0; em revisão na data-base | govern/map/measure/manage | alta |
| SRC-LT04-20 | [NIST AI 600-1 — Generative AI Profile](https://doi.org/10.6028/NIST.AI.600-1) | final, 2024 | riscos e ações para GenAI | média |
| SRC-LT04-21 | [W3C PROV Overview](https://www.w3.org/TR/prov-overview/) | W3C Recommendation | lineage/provenance interoperável | baixa |
| SRC-LT04-22 | [OpenLineage Specification](https://openlineage.io/docs/spec/) | vigente na regeneração | adapter de lineage operacional | alta |
| SRC-LT04-23 | [ISO/IEC 42001 overview](https://www.iso.org/standard/81230.html) | 2023 | sistema de gestão de IA; referência, não certificação | baixa |
| SRC-LT04-24 | [Regulation (EU) 2024/1689](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) | texto oficial consolidável | contexto regulatório UE | alta |
| SRC-LT04-25 | [Lei Geral de Proteção de Dados](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) | Lei 13.709/2018 e alterações aplicáveis | contexto brasileiro de dados pessoais | alta |

O material informa que normas e leis mudam e que aplicabilidade exige análise especializada. Ferramentas são adapters; formatos e decisões permanecem portáveis.

## 9. Critérios editoriais e G0

- 10.000–12.000 palavras visíveis mais laboratório/dossiê executável;
- no mínimo 34 cenários de aceitação com raw evidence persistida;
- variante de checkpoint contém defeitos não revelados na apostila;
- toda métrica possui dataset/workload, versão, seed quando aplicável, cálculo e limitação;
- SBOM/provenance/signature referenciam o mesmo digest;
- verificação testa identidade/expectation, não apenas validade criptográfica;
- decisões regulatórias são rotuladas como contexto e encaminhadas a especialista;
- nenhum scanner/judge pode aprovar sozinho um gate crítico;
- claims hardcoded, evidence ausente ou conflito não explicado geram NO-GO;
- dossiê é reproduzível por revisor independente.

- [x] seis blocos, competências e dependências definidos;
- [x] laboratório e dossiê de release definidos;
- [x] 34 cenários e sete gates definidos;
- [x] stop conditions e semântica GO/CONDITIONAL/NO-GO definidos;
- [x] fontes primárias/canônicas atuais selecionadas;
- [x] governança agnóstica e contexto regulatório delimitados;
- [x] escopo separado de M12 e M13.

**Decisão:** LT04 está `ESPECIFICADO`. As seis unidades críticas de R1 possuem G0 aprovado; o curso pode iniciar R2 pela regeneração integral de M12. Gate G0 aprovado.
