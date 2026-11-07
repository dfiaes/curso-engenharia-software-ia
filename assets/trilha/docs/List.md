# List

Lista agrupada com cantos arredondados (`surface-raised`, `radius-lg`, divisórias `line` recuadas): módulos e aulas do curso, configurações, resultados.

**O consumidor fornece:** `title` opcional do grupo (em maiúsculas pequenas, `ink-muted`), `variant="plain"` para lista sem caixa (barra lateral), e filhos `<Trilha.ListRow>` com `title`, `subtitle?`, `detail?` (duração, contagem), `leading?`, `current` (aula aberta: fundo `primary-tint`), `done` (concluída), `expanded` (gira a seta para grupos que abrem), `href` ou `onClick`, `chevron={false}` para esconder a seta.

**Faça:** linhas de no mínimo 44px. **Não faça:** misturar linhas com e sem seta no mesmo grupo.
