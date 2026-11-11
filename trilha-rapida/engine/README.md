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

## Mecanismos de aprendizagem (engine/trilha-aprender.js)
Tudo é declarativo e opcional; aula sem esses campos funciona como antes. O autor escolhe por aula. Guia de escolha: **a cada fundamento, escolha os que fazem sentido sem cansar**. Padrão sugerido: `prever` no primeiro rode; `complete` ou `escreva` na aba de prática; `escolha` com confiança no Conferir; `revisao` com 3 a 5 itens por aula; `cenario` e `transcript` só onde há julgamento (decidir entre caminhos, desconfiar de relato). Novos exercícios aceitam os campos comuns (`id`, `titulo`, `enunciado`, `obrigatorio`, `tutorAntes`, `tutorDepois`, `callout`); em aulas já existentes prefira `obrigatorio:false`.

- **prever** (em `rode` e `quebre`): `prever:{pergunta, opcoes:[{id, texto, correta, porque}]}`. O Enter só habilita depois da previsão; no fim o tutor diz "Você previu X; o real foi Y porque…". Use no primeiro rode da aula, quando o resultado não é óbvio. Em `quebre`, trocar a falha pede nova previsão.
- **Confiança e calibração** (em `escolha`): ligada por padrão. Antes do Conferir o aluno marca "Chuto · Acho · Tenho certeza". Só a primeira tentativa é gravada em `localStorage["curso.calibracao.v1"]` como `{aula, exercicio, confianca, acertou, data}`. `confianca:false` no exercício, ou `TrilhaAula.config({confianca:false})`, desliga. O painel "Sua calibração" aparece na tela de revisão.
- **complete**: `{enunciado, linguagem, partes:["texto fixo" | {lacuna:id, opcoes:[...], correta}], explicacao}`. Código com selects, sem digitação. Bom para formatos (SKILL.md, workflow, comando) em que o aluno reconhece a peça certa.
- **escreva**: `{enunciado, placeholder, rubrica:[html], modelo:html}`. O aluno escreve, envia, marca a rubrica (conclui quando marca tudo) e pode ver o modelo. "Pedir revisão ao tutor" copia um prompt com o texto dele e a rubrica. Use para explicações com as próprias palavras.
- **cenario**: `{titulo, inicio, nos:{id:{texto, opcoes:[{texto, vai, consequencia, tom:"ok"|"ruim"}]}}, finais:{id:{texto, bom}}}`. Mostra o caminho e o custo de cada decisão; "Tentar outro caminho"; conclui num final `bom`. `vai` aponta para um nó ou um final.
- **transcript**: `{enunciado, linhas:[{quem:"voce"|"agente"|"ferramenta", texto}], erradas:[índices base 0], explicacao:{índice:"por quê"}}`. Lista acessível por teclado; feedback por linha após Conferir.
- **python** (Pyodide 0.26.4, jsDelivr, carregado só no primeiro Rodar, cerca de 10 MB): `{enunciado, codigo, testes, dica, solucao}`. `testes` são funções `test_*` com `assert`; "Testar" mostra ✓/✗ por função e conclui quando todas passam. Sem rede mostra "Python indisponível offline; use o lab local" e o Pular continua disponível. Roda na thread da página: loop infinito trava a aba (sem Web Worker). Aula escondida de demonstração: `#aula=demo-python` (`escondida:true`, fora de `indice.js`).
- **Tutor por prompt**: botão "Perguntar ao tutor" no rodapé de cada aba (e no `escreva`). Copia um prompt socrático em pt-BR (aula, aba, objetivo = `objetivo` ou `resumo` da aula, texto/código do aluno quando houver, regras de não entregar a resposta, uma pergunta por vez, pistas graduais). Futuro: tutor embutido no curso.
- **revisao** (aula): `revisao:[{id, pergunta, opcoes:[{id, texto, correta, porque}]}]`, 3 a 5 itens do conteúdo da própria aula. Ao concluir a aula os itens entram em `localStorage["curso.srs.v1"]` (Leitner, 5 caixas: 1, 3, 7, 16 e 35 dias; acerto sobe, erro volta à caixa 1). A barra lateral tem "Revisão do dia (N)" (`#revisao`): até 10 vencidos, intercalados entre aulas, com confiança; no fim, resumo, calibração e sequência de dias (sem pontos nem ranking). Sem vencidos: "Revisar mesmo assim (5 aleatórios)", que não altera as caixas.
- **window.CursoRevisao** (para o portal): `pendentes(limite=10)`, `registrar(aula, id, acertou, confianca, {treino})`, `total()`, `sequencia()`, `calibracao()`. Funciona sem as aulas carregadas.

## Itens do diário na revisão
`../diario/revisao.js` (gerado por `tools/build_diario.py`; carregado em `TR.html` antes do motor, opcional) define `window.DIARIO_REVISAO`. O motor trata `diario` como pseudo-aula: `itemDe('diario', id)` resolve nesse array (ids de opção `a`, `b`, `c`…, o `porque` vale para todas as opções) e o feedback ganha o link "Ler a edição de DD/MM" (`../` + `url`). Ao abrir o TR e a tela `#revisao`, itens dos últimos 30 dias ainda não matriculados entram na caixa 1 com `prox` = hoje, no máximo 3 por dia (`diarioMatriculaEm` e `diarioMatriculaN` em `curso.srs.v1`; o formato `v:1` não muda). Entram na fila pelo mesmo `intercalar`, com o rótulo "Diário · DD/MM". Item que sumiu do arquivo é ignorado. O portal lê o mesmo estado em `assets/revisao-card.js` (card "Revisão do dia"), que repete as regras de janela e limite: mude os dois juntos.

## Barra lateral e menu
A lateral (desktop) mostra marca, progresso, "Revisão do dia" e a lista de aulas. O menu do módulo (Portal do curso, Modo Interativo/Texto completo, Tema e Recomeçar) abre por um botão `⋯` fixo no canto superior direito, numa Sheet de vidro; no celular o mesmo menu fica no fim da folha "Aulas". O modo "Texto completo" some quando `C.texto` está vazio e leva para a âncora da aula atual.

## Usar o motor em outro módulo

O motor serve qualquer módulo. Antes de registrar as aulas, a página chama `TrilhaAula.curso({...})`:

```js
TrilhaAula.curso({
  chave: 'curso.a01.v1',            // localStorage do progresso deste módulo
  nome: 'A01 · SDLC nativo em IA', subtitulo: 'Versão interativa', unidade: 'módulo',
  texto: 'A01.html',                // versão em texto ("Ler em texto")
  portal: '../../index.html', raiz: '../../',   // caminhos relativos à página
  alias: {}, titulos: {},
  passo: { 'a01-b1': 'b01' }        // aula → âncora em `texto`
});
```

Referência: `modulos/A01-sdlc-nativo-ia/A01-interativo.html`, com as aulas em `interativo/aulas/`. A revisão espaçada (`curso.srs.v1`) é única para o curso todo: na matrícula, cada item grava uma cópia da pergunta e o título da aula, então a Revisão do dia mostra itens de qualquer módulo em qualquer página que use o motor.
