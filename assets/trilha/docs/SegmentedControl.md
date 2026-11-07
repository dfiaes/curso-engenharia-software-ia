# SegmentedControl

Escolha entre 2 a 5 visões mutuamente exclusivas do mesmo conteúdo; o botão claro desliza até a opção ativa (`shadow-control` sobre `fill-subtle`).

**O consumidor fornece:** `options` (strings ou `{value, label, disabled}`), `value` + `onChange` (controlado) ou `defaultValue`, e `aria-label`. `fullWidth` estica no contêiner.

**Teclado:** setas ←/→ movem a seleção. **Não use** para navegar entre páginas (use `LessonToolbar`) nem para ações.
