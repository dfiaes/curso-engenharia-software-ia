# StepTimeline

Gráfico em cascata de etapas: cada linha tem nome, descrição, uma barra posicionada no tempo e a duração. Clicar numa etapa a seleciona (para mostrar as linhas do terminal dela).

**O consumidor fornece:** `steps` — `{id?, name, description?, tone, start, duration?}`; sem `duration` a etapa aparece pendente ("—"). `tone`: `dns`, `tcp`, `tls`, `request`, `response` ou `ink`. Opcional: `total` (padrão: fim da última barra), `unit` ("ms"), `selected` + `onSelect` ou `defaultSelected`, `showTotal`.

**Faça:** revele as etapas uma a uma preenchendo `duration`; a barra cresce sozinha. A cor nunca identifica a etapa sozinha — o nome está sempre na linha.
