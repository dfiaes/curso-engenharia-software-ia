# Terminal

O "real" por trás da explicação: um terminal escuro nos dois temas, linhas coloridas por tipo.

**O consumidor fornece:** `lines` — strings (comandos) ou `{kind, text, dim?, prefix?}` com `kind`: `cmd` ($, `terminal-ink`), `info` (*, `terminal-info`), `out` (>, `terminal-out`), `in` (<, `terminal-in`), `body` (sem prefixo), `hint` (dica em `terminal-muted`, ex.: "aperte Enter na barra de endereço"). Opcional: `title` ("terminal"), `accessory` (nó à direita do título), `height` fixa, `caret` (cursor piscando), `live` (anuncia linhas novas), `autoScroll` (padrão ligado).

**Faça:** use `dim` para apagar as linhas que não pertencem à etapa selecionada no `StepTimeline`. **Não faça:** colocar texto de aula dentro do terminal.
