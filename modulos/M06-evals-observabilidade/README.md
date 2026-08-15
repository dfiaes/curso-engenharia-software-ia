# M06 · Evals e observabilidade

## Visão geral

O módulo que separa quem fez demo de quem entregou produção, e o principal sinal de contratação em IA em 2026. A pergunta central: *se eu mudar o prompt amanhã, como sei que não quebrei outra coisa?* A resposta é a suíte que este módulo constrói — datasets por categoria de comportamento, graders em escada, juiz calibrado contra você, prompts versionados, gate na CI e tracing com custo por análise.

O conceito que organiza tudo é **regressão comportamental**: em sistema com LLM, toda mudança é global — você conserta A e quebra B, C e D sem nenhum sinal.

## Conteúdo do módulo

- **Material principal (HTML):** [`M06.html`](M06.html) — abra no navegador
- **Carga:** 6 blocos de 2h (12h)
- **Pré-requisito:** M05 (o extrator, o gateway com telemetria e o registry de custo são o objeto de avaliação)

## Estrutura dos blocos

1. **Bloco 1:** Por que teste unitário não serve — as três propriedades que quebram o teste tradicional; anatomia de um eval (dataset + sistema versionado + grader + limiar); os três níveis (asserções → humano/juiz → A/B); **análise de erro antes da métrica**; estatística mínima (tamanho de amostra, média × cauda, ruído).
2. **Bloco 2:** A taxonomia obrigatória — o cenário completo da regressão comportamental; as seis categorias (golden path, fora de escopo, injection, vazamento, ação destrutiva, bordas) com exemplos do Capstone; quantos casos e de onde vêm; imutabilidade e anonimização.
3. **Bloco 3:** Graders — a escada (determinístico → estatístico → juiz → humano) e a regra de descer até o mais barato; runner completo em código com graders universais e semáforo; os quatro vieses do LLM-as-judge com mitigação; **calibração do juiz contra 30 rótulos seus (≥85%)**.
4. **Bloco 4:** Prompt é código — registry versionado com front matter, imutabilidade, `tag` em todo log; a **matriz prompt × modelo** com acurácia por categoria, custo e p95, e como lê-la; experimento controlado (uma variável, baseline, hipótese antes).
5. **Bloco 5:** Observabilidade — convenções GenAI do OpenTelemetry (estado em ago/2026); o trace como árvore (agente → chamadas → ferramentas); **o que não logar** e o truque do hash do input; os quatro painéis; alertas de taxa de fallback e de abstenção.
6. **Bloco 6:** O gate na CI — os três problemas (custo, lentidão, instabilidade) e as soluções; tolerância relativa em qualidade × piso absoluto em segurança; suíte rápida no PR + completa no nightly; o relatório para gente não-técnica.

## Entregáveis

- `evals/` completo: ~50 casos nas seis categorias com manifesto, runner com graders, juiz calibrado com concordância publicada.
- Registry de prompts versionados + CHANGELOG com números + matriz de comparação salva como baseline.
- Gate no CI reprovando dois PRs (um por queda de qualidade, outro por violar piso de segurança) + nightly.
- Tracing com custo por análise e pelo menos um caso de dataset nascido de um trace real.

## Fundamentos reciclados neste módulo

Estatística aplicada (tamanho de amostra e ruído, média × cauda, p50/p95, significância) · validade e confiabilidade de instrumento de medida (calibração, concordância corrigida por acaso) · experimento controlado (uma variável, baseline, hipótese *a priori*) · observabilidade × monitoramento e os três pilares (com cardinalidade como custo escondido) · quality gate e tolerância relativa.
