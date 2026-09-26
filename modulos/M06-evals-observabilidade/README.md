**Status:** G0 approved; B01–B06 in didactic review with offline executable lab. G1–G6 pending orchestrator review.

# M06 · Evals e observabilidade

## Visão geral

O módulo que separa demo de produção: *se eu mudar o prompt amanhã, como sei que não quebrei outra coisa?* A resposta é a suíte que este módulo constrói — datasets por categoria de comportamento, graders em escada, juiz comparado com rótulos de referência cuja proveniência precisa ser registrada, prompts versionados, gate e tracing sanitizado. A fixture local é roteirizada e não representa coleta humana.

O conceito que organiza tudo é **regressão comportamental**: em sistema com LLM, toda mudança é global — você conserta A e quebra B, C e D sem nenhum sinal.

## Conteúdo do módulo

- **Material principal (HTML):** [`M06.html`](M06.html) — abra no navegador
- **Especificação:** [`docs/especificacoes/M06-ESPECIFICACAO.md`](../../docs/especificacoes/M06-ESPECIFICACAO.md) — G0 aprovado
- **Rastreabilidade:** [`RASTREABILIDADE.md`](RASTREABILIDADE.md)
- **Laboratório:** [`lab/`](lab/) — runner offline com sistema e juiz falsos, sem rede/conta/crédito
- **Carga:** 6 blocos de conteúdo (12h)
- **Pré-requisito:** M05

## Estrutura dos blocos

1. **Bloco 1:** Por que teste unitário não serve — as três propriedades que quebram o teste tradicional; anatomia de um eval (dataset + sistema versionado + grader + limiar); os três níveis (asserções → humano/juiz → A/B); **análise de erro antes da métrica**; estatística mínima (tamanho de amostra, média × cauda, ruído).
2. **Bloco 2:** A taxonomia obrigatória — o cenário completo da regressão comportamental; as seis categorias (golden path, fora de escopo, injection, vazamento, ação destrutiva, bordas) com exemplos do Capstone; quantos casos e de onde vêm; imutabilidade e anonimização.
3. **Bloco 3:** Graders — a escada (determinístico → estatístico → juiz → humano) e a regra de descer até o mais barato; runner completo em código com graders universais e semáforo; os quatro vieses do LLM-as-judge com mitigação; **calibração do juiz contra 30 rótulos seus (≥85%)**.
4. **Bloco 4:** Prompt é código — registry versionado com front matter, imutabilidade, `tag` em todo log; a **matriz prompt × modelo** com acurácia por categoria, custo e p95, e como lê-la; experimento controlado (uma variável, baseline, hipótese antes).
5. **Bloco 5:** Observabilidade — convenções GenAI do OpenTelemetry (estado em ago/2026); o trace como árvore (agente → chamadas → ferramentas); **o que não logar** e o truque do hash do input; os quatro painéis; alertas de taxa de fallback e de abstenção.
6. **Bloco 6:** O gate na CI — os três problemas (custo, lentidão, instabilidade) e as soluções; tolerância relativa em qualidade × piso absoluto em segurança; suíte rápida no PR + completa no nightly; o relatório para gente não-técnica.

## Entregáveis

- Runner com graders determinísticos + universais, datasets nas seis categorias, juiz com acordo medido.
- Registry de prompts versionados + CHANGELOG; gate com tolerância e pisos; tracing sem vazamento.
- Chamadas a modelos reais (juiz live, matriz contra provedor) são trilha opcional.

A aplicação ao Capstone (`evals/`) é trilha opcional com especificação própria.

## Fundamentos reciclados neste módulo

Estatística aplicada (tamanho de amostra e ruído, média × cauda, p50/p95, significância) · validade e confiabilidade de instrumento de medida (calibração, concordância corrigida por acaso) · experimento controlado (uma variável, baseline, hipótese *a priori*) · observabilidade × monitoramento e os três pilares (com cardinalidade como custo escondido) · quality gate e tolerância relativa.
