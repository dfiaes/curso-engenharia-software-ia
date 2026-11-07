# TextField

Campo de uma linha com rótulo-prefixo opcional, ação embutida e dica.

**O consumidor fornece:** `prefix` (rótulo curto visível, ex.: "URL") ou `label` (só para leitores de tela), `trailing` (normalmente um `Button size="sm"`), `mono` para URLs e comandos, `shape="pill"` para busca, `hint`, `tone="danger"` para erro, e qualquer atributo de `<input>` (`value`, `onChange`, `onKeyDown`…).

**Faça:** contorno `line-strong` (≥3:1) e anel `focus-ring` no foco. Mensagem de erro começa com palavra clara ("Ainda não:") — nunca só a cor `danger`.
