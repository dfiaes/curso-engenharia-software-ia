# Card

Superfície que agrupa conteúdo relacionado. Três níveis de profundidade:

- `panel` — `surface-200`, `radius-xl`, padding `space-6`: o contêiner do exercício interativo.
- `raised` (padrão) — `surface-raised` com borda `line`, `radius-lg`: cartões dentro do painel.
- `elevated` — `surface-raised` com `shadow-card`, `radius-2xl`: destaque solto na página (resumo do módulo, conclusão).

**O consumidor fornece:** `children`, opcionalmente `title` (em `heading`) e `subtitle` (em `caption`), `as` para a tag. **Não faça:** aninhar `elevated` dentro de `panel`, ou mais de dois níveis.
