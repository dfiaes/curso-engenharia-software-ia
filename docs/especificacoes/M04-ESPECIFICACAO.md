# M04 — especificação de escopo e evidência

**Versão:** 1.0 · **Data-base:** 14/09/2026 · **Estado:** G0 aprovado; G1 em produção

## 1. Decisão curricular

O M04 ensina documentação como artefato de engenharia com dois leitores:
humano e agente. O agente lê tudo, obedece com confiança e não tem colega
para perguntar — por isso doc ausente vira invenção e doc desatualizada vira
erro confiante. O módulo cobre taxonomia e contexto, diagrama como código,
ADR/postmortem e manutenção automatizada com verificação executável.

Python 3.14 é a linguagem canônica. O laboratório é um verificador de
documentação (`design_guard`) com fixtures locais: ADR lint, checagem de
diagramas, detecção de drift e fitness functions de estrutura. Nenhum
serviço externo, conta ou rede é requisito. A integração no Capstone
(`capstone/docs/`) ocorre somente após especificação própria do Capstone;
neste módulo, o produto é o gabarito + o verificador, exercitados sobre um
diretório de demonstração local.

## 2. Resultado, limites e integração

| Aspecto | Definição |
|---|---|
| Carga | quatro blocos de duas horas, total de 8 h |
| Entrada | M01 (specs, guardrails), M02 (Python, testes), M03 (CI, check.sh) |
| Saída | gabarito de docs (PRD/arquitetura/ADR/runbook/output-spec) + verificador com exit code + prompt de revisor versionado |
| Peça do capstone | gabarito e verificador reutilizáveis; a aplicação em `capstone/` só ocorre após spec própria |
| Não cobre | evals de LLM (M06), RAG/grafos (M07/M10), billing/segurança (M12) |
| Evidência mínima | comandos, versões e saída executada; nenhum número universal sem método |

## 3. Arquitetura do laboratório

```text
docs de demonstração (demo_docs/)
        │
        ▼
design_guard ──► ADR lint (seções, status, "porque")
             ──► referências (caminhos citados existem)
             ──► mermaid (cerca, tipo conhecido)
             ──► obsolescência (git: doc parada, código andou)
             ──► fitness (cobertura de decisão por área)
        │
        ▼
exit code (0 limpo / 1 violação) + relatório
```

A referência fica em `modulos/M04-design-docs-com-ia/lab/`. O roteiro
`Laboratório guiado M04`, no final do HTML, cria cópia de trabalho em
diretório temporário possuído pelo laboratório.

## 4. Blocos, competências e evidência

| Bloco | Competências observáveis | Evidência planejada |
|---|---|---|
| B01 · taxonomia e contexto | classificar docs; separar Diátaxis; aplicar 3 camadas de contexto; hierarquia da verdade | auditoria de docs + AGENTS enxuto |
| B02 · diagrama como código | escolher nível C4; escrever 5 tipos Mermaid; alternativa textual; distinguir gerado vs. escrito | C4 L1/L2 + sequence com erro |
| B03 · ADR e postmortem | anatomia do ADR; critério de custo de reversão; imutabilidade; postmortem blameless | ADR com custo + postmortem com ações |
| B04 · manutenção | 4 classes de drift; linter com exit code; revisor com restrições; runbook/front matter | `design_guard` verde + mutante rejeitado |

## 5. Cenários de aceitação

| ID | Oráculo e caso relevante | Bloco |
|---|---|---|
| M04-AT-001 | classificar 5 documentos nas categorias sem misturar tipos Diátaxis | B01 |
| M04-AT-002 | auditoria aponta doc desatualizada como bug (hierarquia da verdade) | B01 |
| M04-AT-003 | AGENTS com <200 linhas, só invariantes, sem duplicar CLAUDE | B01 |
| M04-AT-004 | C4 L1/L2 com ≤7 elementos, uma pergunta por diagrama | B02 |
| M04-AT-005 | sequence com caminho de erro; state para coluna `status` | B02 |
| M04-AT-006 | diagrama tem alternativa textual/legenda equivalente | B02 |
| M04-AT-007 | ADR com todas as seções, status válido e "porque" na Decisão | B03 |
| M04-AT-008 | classificar merece/não-merece ADR pelo custo de reversão | B03 |
| M04-AT-009 | postmortem com linha do tempo, fatores plurais, ações com dono | B03 |
| M04-AT-010 | linter acusa ref quebrada, ADR sem porque, mermaid inválido e obsoleta | B04 |
| M04-AT-011 | mutante (ref quebrada inserida) é rejeitado com exit 1; revertido, verde | B04 |
| M04-AT-012 | runbook sintoma→comando; front matter `documenta:` liga doc a código | B04 |

## 6. Fontes e versões

| ID | Fonte e uso | Tipo | Risco |
|---|---|---|---|
| SRC-M04-01 | [Diátaxis](https://diataxis.fr/) — os quatro tipos de doc | canônica | baixo |
| SRC-M04-02 | [C4 model (Simon Brown)](https://c4model.com/) — níveis de abstração | canônica | baixo |
| SRC-M04-03 | [MADR 4.0](https://adr.github.io/madr/) — template e seções de ADR | canônica | baixo |
| SRC-M04-04 | [Google SRE workbook — postmortem](https://sre.google/workbook/table-of-contents/) — cultura blameless | canônica | baixo |
| SRC-M04-05 | [Mermaid docs](https://mermaid.js.org/) — sintaxe dos diagramas | documentação oficial | alto |
| SRC-M04-06 | [Structurizr DSL](https://structurizr.com/) — alternativa com layout automático | documentação oficial | médio |

Consultadas em 14/09/2026. Ferramenta e sintaxe (Mermaid) revalidar em até
90 dias. Sinais de mercado (adoção de `AGENTS.md`) são contextuais e não
fundamentam regras.

## 7. Panorama de prática vigente

Arquivos de instruções de repositório (`AGENTS.md`/`CLAUDE.md`) e diagramas
Mermaid renderizados no GitHub são prática observável em 2026 — sustentam a
decisão didática de ensinar esses formatos. Não provam qualidade de doc nem
autorizam recomendação universal de ferramenta.

## 8. Gates e decisão G0

| Gate | Estado | Critério |
|---|---|---|
| G0 · escopo | **APROVADO** | quatro blocos, 12 cenários, fontes classificadas, lab local e limites definidos |
| G1–G6 | EM PRODUÇÃO/PENDENTE | HTML legado em revisão; lab e avaliação em construção neste ciclo |

**Decisão de G0:** aprovada em 14/09/2026 pelo orquestrador. Define o
trabalho; não certifica HTML legado ou lab inexistente.
