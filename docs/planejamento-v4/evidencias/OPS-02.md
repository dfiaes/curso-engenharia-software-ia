# OPS-02 — fonte por afirmação e semântica correta

**Estado:** REVISADO
**Sessão de autoria:** 01a0d696-83dc-77b0-89b8-cf0e6394992f
**Sessão de revisão:** 01a0d6ad-6777-73f0-8ebd-0122a237fe6d
**Modelo/esforço:** gpt-6-luna / high; configuração do agendador
**Data:** 25/09/2026
**Trilha:** principal · **Escopo focal:** M05/M06
**ATs/gates:** nenhum AT ou gate promovido; revisão independente pendente.

## Objetivo e baseline

Registrar claims focais com relação explícita entre frase, seção, unidade, contexto, URL primária, versão/referência, data real de consulta e risco; separar padrão aberto, adapter de produto e guidance do fornecedor.

Baseline antes das alterações, cwd raiz do repositório:

```text
python3 tools/check_course.py
Checked 105 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.
No lab execution, external-source verification or visual certification performed.

python3 tools/validate_backlog.py
699 tasks: 532 core + 167 optional ML; 26 units / 200 planned blocks; 0 errors.
Planning validation only: no source, lab, learning outcome or release certified.
```

## Fontes consultadas em 25/09/2026

- Anthropic Claude Platform Docs, Prompt caching, seções “Cache limitations”, “Pricing” e “TTL support”: a documentação identifica limites de prefixo cacheável por modelo e diz que prompts abaixo do mínimo não são cacheados mesmo com `cache_control`, sem erro; a resposta permite conferir os campos de uso. Regras de TTL/preço têm exceções por modelo. Referência viva: `https://platform.claude.com/docs/en/build-with-claude/prompt-caching`.
- Anthropic Engineering, “Introducing Contextual Retrieval”, publicado em 19/09/2024: define contextualização por chunk antes de embeddings e BM25; descreve prompt caching como forma de reduzir custo quando reutiliza documento longo. É guidance/prática e resultado experimental do fornecedor, não padrão aberto. `https://www.anthropic.com/engineering/contextual-retrieval`.
- OpenTelemetry GenAI Semantic Conventions, repositório dedicado; arquivos de spans e métricas consultados na branch `main`. O URL anterior em opentelemetry.io informa que o conteúdo GenAI foi movido. `main` não fixa versão: a fonte foi localizada, mas os nomes/status do HTML ainda precisam ser conferidos contra release ou commit antes de serem declarados atuais. `https://github.com/open-telemetry/semantic-conventions-genai`.

## Entregas focais

- Criado `docs/planejamento-v4/fontes.json` com quatro registros estruturados: mínimos de cache por modelo; TTL/preços com exceções; distinção entre prompt caching e contextual retrieval; estado/versionamento de GenAI semconv. Cada registro contém caminho/seção/claim, contexto, fonte primária, referência de versão, data, tipo, risco, estado e correção pendente.
- M05: atualizada a referência SRC-M05-03 para o destino atual das docs oficiais e esclarecido na especificação que mínimo cacheável, contexto e teto de saída são grandezas distintas. A lista dos três modelos do HTML é parcial. Leitura/cache atuais também têm exceções por modelo; HTML não foi editado nesta tarefa.
- M06: atualizada SRC-M06-02 para o repositório dedicado e registrado que a referência `main` é móvel. Claims e nomes no HTML ficaram explicitamente pendentes de revisão contra uma versão fixada; HTML não foi editado nesta tarefa.
- Controle negativo contextual: a documentação de prompt caching sustenta prefixo, TTL e custo; o post separado de contextual retrieval sustenta contextualização de chunk/retrieval. A amostra focal M05/M06 não contém uma frase local que defina cache como algoritmo de retrieval; a fila registra como evitar esse uso indevido de fonte.

## Verificações após as alterações

```text
python3 -m json.tool docs/planejamento-v4/fontes.json
JSON válido

python3 tools/check_course.py
Checked 105 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.
No lab execution, external-source verification or visual certification performed.

python3 tools/validate_backlog.py
699 tasks: 532 core + 167 optional ML; 26 units / 200 planned blocks; 0 errors.
Planning validation only: no source, lab, learning outcome or release certified.
```

## Limites e próxima ação

- A configuração verificada foi `gpt-6-luna / high` em `automation.toml`; isso registra configuração do agendador, não introspecção de runtime.
- Este cartão não corrigiu o HTML nem declarou atuais os números de preço, os mínimos para todos os modelos ou a versão das convenções; esses são itens de correção por unidade registrados no ledger.
- O padrão OTel consultado em branch móvel precisa ser fixado em release/commit durante a tarefa S/M06 antes de aprovar os nomes atuais. Fontes de preços e capacidades continuam sujeitas à validade de 90 dias.
- Nenhum AT/gate foi promovido e `PROGRESSO.md` não foi alterado. Próxima etapa: revisão independente do ledger, claims e validações.

## Revisão independente — 25/09/2026

**Resultado:** REVISADO. RUN revisor: `01a0d6ad-6777-73f0-8ebd-0122a237fe6d`. Configuração consultada em `automation.toml`: `gpt-6-luna / high`, origem agendador; sem alegar introspecção do runtime.

### Conferência de fonte e escopo

- A documentação oficial de prompt caching consultada nesta revisão distingue o prefixo cacheável dos limites de contexto e de saída; confirma 512, 1.024 e 4.096 tokens nos três exemplos registrados e documenta exceções por modelo nos preços de leitura. O ledger preserva a tabela como parcial e específica do adapter, com revalidação em 90 dias.
- O artigo de engenharia sobre Contextual Retrieval define a contextualização por chunk antes de embedding e BM25. Prompt caching aparece como otimização de custo para esse processamento, não como mecanismo de retrieval. O controle negativo está refletido no registro cross-check.
- O repositório dedicado de GenAI semconv está no caminho atualizado, mas a referência é a branch móvel `main`; o ledger não declara versão fixa nem certifica os nomes atuais do HTML. A correção ficou na fila da tarefa editorial M06, conforme o write set.
- M05/M06 specs registram a localização atual das fontes e distinguem claims revalidados de conteúdo HTML ainda pendente. Não há data de consulta inventada nem promoção de AT/gate.

Fontes primárias abertas em 25/09/2026: [Claude Platform Docs — Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Anthropic Engineering — Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval) e [OpenTelemetry GenAI Semantic Conventions](https://github.com/open-telemetry/semantic-conventions-genai).

Verificação independente na raiz do repositório:

```text
python3 tools/check_course.py
Checked 106 documents: 0 structural/link errors; 14 legacy references/clocks for contextual review.
No lab execution, external-source verification or visual certification performed.

python3 tools/validate_backlog.py
699 tasks: 532 core + 167 optional ML; 26 units / 200 planned blocks; 0 errors.
Planning validation only: no source, lab, learning outcome or release certified.
```

Sem achados pendentes no escopo focal. OPS-02 fica `REVISADO`; isso não certifica os HTMLs M05/M06 nem promove AT/gate. `PROGRESSO.md` permanece intocado.
