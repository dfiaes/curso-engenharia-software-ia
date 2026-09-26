# REL-03 — G6 integrado (a11y e visual)

**Data:** 21/09/2026 · **Estado:** PARCIAL — automatizado verde; visual em device pendente.

## Verificação automatizada (executada)

- `python3 tools/check_course.py` sobre 110 HTMLs: **0 erros estruturais/links**; 14 referências/contextos legados sinalizadas para revisão contextual (não bloqueantes).
- Critérios a11y do checker: âncoras/TOC, `:focus-visible`, tabelas responsivas, `@media print`, labels de formulário — verdes em todo o corpus.
- Verbatins HTML↔lab conferidos por script nos módulos novos (LT03 8/8, LT04 6/6, M13 100%).

## Pendência declarada (não fingida)

- **QA visual em device real** (viewport, contraste perceptual, navegação por teclado): exige humano/Astra em dispositivo. Sem simulação: item aberto até REL-06.
- **REL-06** (revisão terminal Astra): reservada por política — executar depois desta pendência visual, com todos os aceites Terra/Sol já concluídos.

## Veredito

Automatizado: **PASS**. Visual em device: **PENDENTE**. Release não declarada pronta até fechar ambos.
