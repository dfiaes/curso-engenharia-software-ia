# Motor de aulas da Trilha rápida

Cada aula é um arquivo `aulas/NN-slug.js` que chama `TrilhaAula.registrar({...})`. Depois de criar o arquivo, acrescente um `<script src="aulas/NN-slug.js">` em `TR.html` (abaixo do comentário "Aulas") e confira que o `id` está em `aulas/indice.js`. Aula na ordem sem registro aparece como "em preparo". Veja `aulas/00-mapa-do-ciclo.js` (rode, quebre, escolha, ordene) e `aulas/01-conceitos.js` (chat, abas por ferramenta, tabelas).

```js
TrilhaAula.registrar({
  id: 'mapa-do-ciclo', titulo: 'O mapa do ciclo', minutos: 12, resumo: 'Uma frase.',
  abas: [{ rotulo: 'O ciclo', blocos: [ /* blocos */ ] }]   // 2 a 4 abas
});
```

Rotas: `#aula=<id>&aba=<n>` (n começa em 1). `#passo-0` a `#passo-12` são aliases das aulas antigas. Progresso em `localStorage["trilha.tr.v1"]`.

## Blocos de conteúdo
- `{tipo:"texto", html}`: HTML confiável. `<strong>` nos termos, `<code>` no código, `<h3>`, `<ul>`, `<table>` (rola sozinha no mobile). `largo:true` solta a largura de leitura (use em tabelas).
- `{tipo:"takeaway", html}`: frase-resumo; palavras-chave em `<mark>`. Uma por aba, no fim.
- `{tipo:"callout", tom:"info|success|danger|neutral", titulo?, html}` e `{tipo:"tutor", tom:"neutral|success|danger", html}`.
- `{tipo:"codigo", linguagem, texto}`: bloco com botão Copiar.
- `{tipo:"abas", rotulo?, itens:[{rotulo, blocos}]}`: seletor (por exemplo, por ferramenta). Pode conter qualquer bloco.

## Exercícios
Todos têm `id` (único na aula), `titulo`, `enunciado` (HTML), `obrigatorio` (padrão true), `dica` (texto do Continuar bloqueado), `tutorAntes`, `tutorDepois`, `callout` (HTML do aviso de sucesso). Todos ganham "Pular exercício".

- **rode**: `prefixo:"URL"|"$"|"Prompt"`, `entrada`, `unidade` (padrão "ms"), `terminalTitulo?`, `etapas:[{id, nome, descricao, tom:"dns|tcp|tls|request|response|ink", ms, linhas:[{kind:"cmd|info|out|in|body|hint", text}]}]`. `ms` é a duração mostrada na barra, na `unidade`; o tempo da animação é derivado dela (450 a 1100 ms por etapa) e some com "reduzir movimento". Clicar numa etapa apaga as linhas das outras.
- **quebre**: igual ao `rode`, mais `falhas:[{id, rotulo, efeito:{etapaFalha:"<id da etapa>", linhasErro:["texto"|{kind,text}], tutor:"texto"}}]`. A etapa da falha é trocada por `linhasErro` e as seguintes não acendem. Conclui depois de uma falha vista e de uma execução "Sem falha".
- **escolha**: `pergunta`, `opcoes:[{id, texto, correta:true|false, porque}]`.
- **ordene**: `itens:[{id, texto}]` (já embaralhados), `solucao:[ids]`, `dica?`. Botões ↑ ↓ e "Conferir".
- **chat**: `rodadas:[{agente:"fala do agente", opcoes:[{texto, boa:true|false, resposta:"reação do agente", porque}]}]`. Só avança com a opção `boa`.
- **esteira**: `ambientes:[{id, nome, gates:[{id, rotulo, tipo:"auto"|"aprovacao", falhaPossivel?:true|{linhas:[], tutor}, comando?, saida?}]}]`, `artefato?` (sha mostrado). Promove um ambiente por vez, gates de aprovação pedem "Aprovar", `falhaPossivel` falha na primeira execução, "Rollback" desfaz o último ambiente.

## Regras de escrita
Português do Brasil, "você", frases curtas, analogia antes do termo técnico, sem emoji, capitalização de frase. Erros começam por "Ainda não:" (o motor acrescenta se você usar `porque`/`tutor`). Cores e espaços só pelos tokens do Trilha; o CSS do motor é só layout.
