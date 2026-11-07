# TutorBubble

A voz do tutor: um balão com avatar que orienta antes da ação e reage depois dela.

**Tons:** `neutral` (`tutor`): instrução. `success` (`primary`): acerto. `danger` (`danger`): erro — comece com uma palavra clara em `lead` ("Ainda não.").

**O consumidor fornece:** `children` (1–2 frases, "você", imperativo), `lead` opcional em negrito, `avatar` (nó de 32px; `null` esconde; padrão "T"). Reações usam `role="status"` para serem anunciadas.

**Não faça:** mais de um balão visível por exercício; o novo substitui o anterior.
