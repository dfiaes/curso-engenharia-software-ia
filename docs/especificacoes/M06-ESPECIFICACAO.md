# M06 — especificação de escopo e evidência

**Versão:** 1.0 · **Data-base:** 14/09/2026 · **Estado:** G0 aprovado; G1 em produção

## 1. Decisão curricular

O M06 ensina a medir se a IA funciona: evals offline por categoria de
comportamento, graders na escada certa e avaliação do juiz contra
referências humanas quando disponíveis, com proveniência documentada;
prompt versionado, gate na CI e observabilidade sanitizada. Testes
unitários verificam invariantes determinísticas do runtime, mas não
bastam para caracterizar comportamento variável de modelos. Evals
complementam esses testes com medições por categoria e decisão explícita
sobre amostragem e incerteza.

O laboratório obrigatório roda 100% offline: sistema sob teste falso e
determinístico, juiz roteirizado, tracing em memória, datasets locais.
Chamadas a modelos reais (juiz live, matriz contra provedor) são trilha
opcional com conta e crédito próprios — nunca a única evidência. A fixture
roteirizada só exercita o cálculo de concordância; ela não calibra
probabilidades nem substitui um conjunto humano de referência devidamente
documentado.

## 2. Resultado, limites e integração

| Aspecto | Definição |
|---|---|
| Carga | seis blocos de duas horas, total de 12 h |
| Entrada | M02 (Python, testes), M04 (ADR, docs), M05 (contrato, custo, gateway) |
| Saída | runner de evals, datasets versionados, registry de prompts, gate e relatório |
| Peça do capstone | suíte `evals/`; a integração no Capstone só ocorre após spec própria |
| Não cobre | RAG (M07), agentes (M08), produção multi-tenant (M12) |
| Evidência mínima | comandos, versões e saída executada; acordo de juiz só com conjunto humano |

Referência interna de matemática e dependências do principal: [ponte do M06](../planejamento-v4/pontes-principal.md#proporções-e-incerteza-no-m06). A interpretação de proporções e incerteza deve permanecer autossuficiente em B01; ML01 é somente aprofundamento opcional.
## 3. Arquitetura do laboratório

```text
datasets/*.jsonl ──► runner ──► SUT falso (v1/v2) ──► graders determinísticos
     │                              │                      │
     │                              ▼                      ▼
     │                         juiz roteirizado      universais por caso
     │                              │
     └──── registry (prompt@v) ─────┴──► relatório JSON ──► gate vs baseline
```

Tracing sanitizado em memória valida a política de conteúdo. A referência
fica em `modulos/M06-evals-observabilidade/lab/`. O roteiro `Laboratório
guiado M06`, no final do HTML, cria cópia de trabalho em diretório
temporário possuído pelo laboratório.

## 4. Blocos, competências e evidência

| Bloco | Competências observáveis | Evidência planejada |
|---|---|---|
| B01 · complementaridade entre testes unitários e evals | 3 propriedades, anatomia, níveis, análise de erro | 20 casos rotulados |
| B02 · datasets | 6 categorias, regressão comportamental, versionamento | 6 arquivos + manifesto |
| B03 · graders | escada, runner, vieses do juiz, calibração | runner + acordo medido |
| B04 · prompt como código | registry, imutabilidade, matriz, experimento | matriz + baseline |
| B05 · observabilidade | tracing GenAI, sanitização, painéis | spans sem vazamento |
| B06 · gate e entrega | tolerância, pisos, relatório, nightly | gate com exit code |

## 5. Cenários de aceitação

| ID | Oráculo e caso relevante | Bloco |
|---|---|---|
| M06-AT-001 | eval tem dataset + SUT versionado + grader + limiar (anatomia) | B01 |
| M06-AT-002 | análise de erro agrupa falhas antes de qualquer métrica | B01 |
| M06-AT-003 | seis categorias presentes com casos que falham hoje | B02 |
| M06-AT-004 | caso corrigido vira `deprecated` + novo, nunca edição | B02 |
| M06-AT-005 | grader determinístico aprova/reprova; mutante enfraquecido é pego | B03 |
| M06-AT-006 | juiz mede acordo contra conjunto humano rotulado com proveniência e rubrica documentadas; ≥85% é apenas o corte local da fixture, não validade universal | B03; a fixture roteirizada não verifica este AT |
| M06-AT-007 | juiz desalinhado é rejeitado antes de uso | B03 |
| M06-AT-008 | prompt imutável após uso; tag em todo resultado | B04 |
| M06-AT-009 | matriz mostra regressão comportamental (v2 piora categoria) | B04 |
| M06-AT-010 | gate reprova queda > tolerância; piso de segurança bloqueia | B06 |
| M06-AT-011 | custo/latência geram aviso, não reprovação | B06 |
| M06-AT-012 | tracing registra metadados e acusa vazamento de conteúdo | B05 |
| M06-AT-013 | hash do input permite correlacionar sem guardar conteúdo | B05 |
| M06-AT-014 | relatório em linguagem de negócio com decisão, custo e risco | B06 |

## 6. Fontes e versões

| ID | Fonte e uso | Tipo | Risco |
|---|---|---|---|
| SRC-M06-01 | [Zheng et al. — Judging LLM-as-a-Judge (2023)](https://arxiv.org/abs/2306.05685) — vieses do juiz | científica | baixo |
| SRC-M06-02 | [OpenTelemetry GenAI semantic conventions](https://github.com/open-telemetry/semantic-conventions-genai) — spans, atributos e métricas | padrão aberto | alto |
| SRC-M06-03 | [Google SRE workbook](https://sre.google/workbook/table-of-contents/) — postmortem e operação | canônica | baixo |
| SRC-M06-04 | [Diátaxis](https://diataxis.fr/) — tipos de doc do relatório | canônica | baixo |
| SRC-M06-05 | [NIST/SEMATECH e-Handbook, Wilson intervals](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm) — intervalo de proporção binomial | referência técnica pública | médio |
| SRC-M06-06 | [NIST/SEMATECH e-Handbook, sample-size planning](https://www.itl.nist.gov/div898/handbook/prc/section2/prc242.htm) — amostra em função de diferença, α e poder | referência técnica pública | médio |
| SRC-M06-07 | [NIST/SEMATECH e-Handbook, tests of hypotheses](https://www.itl.nist.gov/div898/handbook/prc/section1/prc13.htm) — hipóteses, α e β | referência técnica pública | médio |
| SRC-M06-08 | [McNemar (1947)](https://pubmed.ncbi.nlm.nih.gov/20254758/) — diferença entre proporções correlacionadas | artigo original | baixo |
| SRC-M06-09 | [Cohen (1960)](https://journals.sagepub.com/doi/10.1177/001316446002000104) — concordância nominal corrigida por acaso (kappa) | artigo original | baixo |
| SRC-M06-10 | [Guo et al. (2017)](https://proceedings.mlr.press/v70/guo17a.html) — calibração de probabilidades prevista versus frequência de acerto | artigo original | baixo |

Fontes 01–04 consultadas em 14/09/2026; SRC-M06-02 revalidada em
25/09/2026. Foi consultada a branch `main`, não uma versão imutável;
fixar release/commit e revalidar nomes/estabilidade antes de atualizar as
afirmações no HTML. SRC-M06-05–08 consultadas em 25/09/2026 para os
fundamentos estatísticos. O limiar de concordância de 85% no AT-006 é
política local do cenário roteirizado deste laboratório, não evidência
universal de validade; tamanho e composição do conjunto, incerteza e
consequências de erro precisam acompanhar uma aplicação real.
No B03, diferenciar concordância observada total e por classe, medidas
corrigidas por chance e calibração probabilística. A fixture determinística
não contém rótulos humanos nem probabilidades; os resultados do laboratório
não demonstram concordância humana ou calibração de confiança. Duas
configurações podem empatar na acurácia e errar classes diferentes, então
limiares reais dependem da prevalência e do custo de falsos positivos e
negativos; abstenção e revisão humana são resultados válidos. SRC-M06-09–10
consultadas em 26/09/2026. O helper local `medir_acordo` aceita apenas rótulos
de referência sem inferir proveniência, exige limiar explícito por chamada e
rejeita conjunto vazio/limiar fora de [0, 1]. Ele mede concordância observada;
não calibra probabilidades. Para alegar referência humana, o processo externo
precisa registrar anotadores, rubrica e resolução de desacordos; o helper não
certifica isso.
`LLM-as-judge` nunca substitui calibração humana; concordância não é a
margem de erro da acurácia do produto. O ledger focal e as correções
pendentes estão em [`docs/planejamento-v4/fontes.json`](../planejamento-v4/fontes.json).

O exemplo de planejamento do B01 usa a aproximação de uma proporção do
NIST com `p₀=0,90`, `p₁=0,95`, `α=0,05` bilateral e poder `0,80`. A
fórmula sem correção de continuidade resulta em aproximadamente 238
observações (`n′` na notação do NIST); a correção de continuidade que o NIST/SEMATECH relata como recomendada por Fleiss, Levin e Paik
usa `n = n′ + 1/δ` e resulta em 258. Com alvo `0,85`, os valores correspondentes são 316 e 336 pela
mudança de variância. São contas didáticas sob aproximação normal e
independência, não um dimensionamento universal nem fórmula para A/B pareado. O HTML também
marca `12/15 → 13/15` como caso de borda: uma mudança de um caso pode
produzir 80% → 86,7%, mas a decisão permanece inconclusiva sem desenho,
discordâncias e incerteza apropriados.

## 7. Panorama de prática vigente

Ferramentas de eval (promptfoo, Langfuse, LangSmith, Ragas, DeepEval) são
prática observável — o curso constrói o runner à mão para ensinar as
decisões (categorias, graders, limiar) e declara a migração como trabalho
de uma tarde, sem recomendar produto.

## 8. Gates e decisão G0

| Gate | Estado | Critério |
|---|---|---|
| G0 · escopo | **APROVADO** | seis blocos, 14 cenários, fontes classificadas, lab local e limites definidos |
| G1–G6 | EM PRODUÇÃO/PENDENTE | HTML legado em revisão; lab e avaliação em construção neste ciclo |

**Decisão de G0:** aprovada em 14/09/2026 pelo orquestrador. Define o
trabalho; não certifica HTML legado ou lab inexistente.
