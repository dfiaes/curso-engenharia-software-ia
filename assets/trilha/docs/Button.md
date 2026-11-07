# Button

Ação clicável com cinco pesos — use exatamente um `filled` por área de tela.

**Variantes:** `filled` (padrão, `action`): a ação principal ("Continuar →", "Enter ↵"). `brand` (`primary`): concluir/confirmar algo positivo. `tinted` (`primary-tint` + texto `primary`): ação secundária com cor. `gray` (`fill-subtle`): ações neutras e botões só de ícone. `plain`: terciária, sem fundo.

**Tamanhos:** `sm` 28px (barras, atalhos dentro de campos), `md` 36px, `lg` 44px (chamada única de página).

**O consumidor fornece:** `children` (rótulo em capitalização de frase), opcionalmente `leading`/`trailing` (um glifo de texto: → ↵ ✓ ←), `onClick`, `disabled`, `fullWidth`. Botão só de glifo precisa de `aria-label`.

**Faça:** confie no comportamento embutido — o leve encolher ao pressionar (0.97) e o anel `focus-ring` no foco já vêm prontos. **Não faça:** dois `filled` lado a lado; desabilitar sem dizer o porquê perto do botão (ex.: "Aperte Enter na barra de endereço").
