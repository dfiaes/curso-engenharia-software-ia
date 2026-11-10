# Brief — autor das aulas interativas de um módulo

NÃO faça commit/push. NÃO edite `trilha-rapida/`, o `<CÓDIGO>.html` do módulo, portal nem tools. Escreva SOMENTE os arquivos atribuídos em `modulos/<pasta-do-módulo>/interativo/aulas/`. Não rode `pkill`/`killall`; feche só o seu navegador (`browser.close()`); não deixe nada em segundo plano.

## Leia antes
- `CLAUDE.md` (didática: situação/falha → definição → mecanismo → decisão e limites → exemplo → diagnóstico; termo técnico definido no 1º uso; sem enchimento).
- `trilha-rapida/engine/README.md` (mecanismos: rode/prever, quebre, escolha+confiança, ordene, complete, escreva, cenario, transcript, python, revisao; guia de escolha).
- Referência de formato: `modulos/A01-sdlc-nativo-ia/interativo/aulas/b01.js`, `b04.js` e `checkpoint.js`.
- Voz: `assets/trilha/docs/README.md` (pt-BR, "você", frases curtas, termos em <strong> na 1ª menção, <code>, takeaway com <mark>, sem emoji, capitalização de frase).
- Fonte: o bloco atribuído no `<CÓDIGO>.html` (`<h2 id="...">Bloco N` até o próximo h2). Porte TODO o conteúdo técnico relevante (conceitos, fatos, comandos, tabelas, limites, datas "verificado em", marcas de confirmação). Não invente números, comandos ou nomes de script: saídas que não vêm da fonte levam o rótulo "exemplo". Pode condensar prosa, nunca perder fato.

## Cada aula (uma por bloco)
- `TrilhaAula.registrar({ id:'<código minúsculo>-bN', titulo, minutos, resumo, objetivo, abas:[...], revisao:[...] })`. Sem `ordem`/`montar` no arquivo.
- 3–4 abas (ex.: Entender · Ver funcionando · Praticar · Conferir); texto curto entre exercícios; takeaway no fim de cada aba.
- Mecanismos, escolhidos pelo conteúdo: 1 `rode` com `prever`; 1 exercício de mão na massa (`complete`, `escreva`, `ordene`, `quebre`); 1 `cenario` ou `transcript` quando há julgamento; 1–2 `escolha` no Conferir; `revisao` com 4–5 itens fiéis ao bloco.
- `python` onde houver lógica testável, sempre `obrigatorio:false`: só biblioteca padrão (o `sqlite3` é carregado pelo motor), sem rede, SEM THREADS (o Pyodide não tem), modelos/provedores fake e determinísticos. `codigo` inicial com lacuna de LÓGICA (nomes iguais aos da `solucao`), `testes` com caminho feliz, borda e falha, `dica`, `solucao`. Rode em CPython: solução passa, inicial falha.
- Checkpoint (quando pedido): `escreva` com rubrica = critérios "Basta" e modelo = resposta esperada + "Reprova", `obrigatorio:false`; algumas `escolha` de aquecimento; 4–6 `revisao` vindos da Tabela de Diagnóstico.

## Validação (uma passada só)
`node --check` em cada arquivo; página de teste no seu scratchpad copiando os `<script>` de `modulos/A01-sdlc-nativo-ia/A01-interativo.html` (caminhos `file:///…` absolutos), sem as aulas do A01, com `TrilhaAula.curso({chave:'teste'})`, `ordem([seus ids])`, `montar('#raiz')`; Playwright 1440×900 e 390×844, todas as abas: zero erro de console, sem overflow horizontal; resolva os obrigatórios até o Continuar habilitar; olhe 2 screenshots.

## Resposta final (≤ 6 linhas, uma vez, depois pare)
Arquivos, mecanismos, validação, fatos com marca de confirmação ou dúvida.
