# Ferramentas das versões interativas

- `gerar_pagina.py modulos/<pasta> <COD> "<nome>"`: gera `<COD>-interativo.html` a partir de `interativo/aulas/*.js` e marca o `<COD>.html` para o alternador Interativo/Texto (o interativo é o padrão; o texto é a referência completa).
- `marcar_modo.py` (sem argumentos): idempotente. Põe `data-interativo` em `<html>` das páginas em texto que têm interativo e remove a caixa antiga "Versão interativa". Não escreve dentro de `<script>`.
- `validar.js <página>`: percorre todas as abas em 1440/390, claro/escuro (console, overflow, HTML cru) e roda cada exercício `python` no Pyodide 0.26.4 (solução passa, código inicial falha). Baixa o Pyodide para `pyodide/` (ignorado pelo Git) na primeira vez. Saída esperada: só linhas `OK …` e `FIM`.
- `BRIEF-MODULO.md`: instruções para o agente que escreve as aulas de um módulo.
