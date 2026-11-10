# Ferramentas das versões interativas

- `gerar_pagina.py modulos/<pasta> <COD> "<nome>"`: gera `<COD>-interativo.html` a partir de `interativo/aulas/*.js` e põe o aviso "Versão interativa" no texto (fora de scripts).
- `validar.js <página>`: percorre todas as abas em 1440/390, claro/escuro (console, overflow, HTML cru) e roda cada exercício `python` no Pyodide 0.26.4 (solução passa, código inicial falha). Baixa o Pyodide para `pyodide/` (ignorado pelo Git) na primeira vez. Saída esperada: só linhas `OK …` e `FIM`.
- `BRIEF-MODULO.md`: instruções para o agente que escreve as aulas de um módulo.
