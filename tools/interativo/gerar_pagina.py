"""Gera modulos/<pasta>/<COD>-interativo.html e o aviso no <COD>.html.

Uso: python3 tools/interativo/gerar_pagina.py modulos/<pasta> <COD> "<nome curto>"
Lê as aulas em <pasta>/interativo/aulas/b*.js (+ checkpoint.js) e liga cada aula
à âncora real do "Bloco N" no texto. Não insere o aviso dentro de <script>.
"""
import json, pathlib, re, sys

pasta, cod, nome = sys.argv[1:4]
d = pathlib.Path(pasta); low = cod.lower()
fonte = (d / f'{cod}.html').read_text()
aulas = sorted(p.name for p in (d / 'interativo' / 'aulas').glob('b*.js'))
ids = [f"{low}-b{int(a[1:3])}" for a in aulas]
anc = {int(n): i for i, n in re.findall(r'<h2 id="([^"]+)">\s*Bloco (\d+)', fonte)}
ordem_blocos = sorted(anc)
passo = {}
for i, a in zip(ids, aulas):
    n = int(a[1:3])
    passo[i] = anc.get(n) or (anc[ordem_blocos[n - 1]] if n - 1 < len(ordem_blocos) else '')
files = aulas[:]
if (d / 'interativo' / 'aulas' / 'checkpoint.js').exists():
    ids.append(f"{low}-checkpoint"); files.append('checkpoint.js')
    ck = re.search(r'<h2 id="([^"]+)">\s*Checkpoint', fonte)
    passo[f"{low}-checkpoint"] = ck.group(1) if ck else ''
scripts = "\n".join(f'<script src="interativo/aulas/{f}"></script>' for f in files)
html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{cod} · {nome} · versão interativa</title>
<meta name="color-scheme" content="light dark">
<script>try{{var t=localStorage.getItem("curso.theme");if(t==="light"||t==="dark"||t==="paper")document.documentElement.dataset.theme=t}}catch(e){{}}</script>
<link rel="stylesheet" href="../../assets/trilha/tokens.css">
<link rel="stylesheet" href="../../assets/trilha/bundle.css">
<link rel="stylesheet" href="../../trilha-rapida/engine/trilha-aula.css">
</head>
<body>
<div id="raiz"></div>
<noscript><p style="padding:24px">A versão interativa precisa de JavaScript. O módulo completo em texto está em <a href="{cod}.html">{cod}.html</a>.</p></noscript>
<script src="../../assets/trilha/vendor/react.production.min.js"></script>
<script src="../../assets/trilha/vendor/react-dom.production.min.js"></script>
<script src="../../assets/trilha/bundle.js"></script>
<script src="../../diario/revisao.js" onerror="void 0"></script>
<script src="../../trilha-rapida/engine/trilha-aula.js"></script>
<script src="../../trilha-rapida/engine/trilha-aprender.js"></script>
<script>
TrilhaAula.curso({{
  chave: 'curso.{low}.v1', nome: '{cod} · {nome}', subtitulo: 'Versão interativa', unidade: 'módulo',
  texto: '{cod}.html', portal: '../../index.html', raiz: '../../',
  alias: {{}}, titulos: {{}},
  passo: {json.dumps(passo, ensure_ascii=False)}
}});
</script>
<!-- Uma aula por bloco do {cod}.html; o texto completo continua em {cod}.html ("Ler em texto"). -->
{scripts}
<script>
TrilhaAula.ordem({json.dumps(ids)});
TrilhaAula.montar('#raiz');
</script>
</body>
</html>
'''
(d / f'{cod}-interativo.html').write_text(html)
if f'{cod}-interativo.html' not in fonte:
    scr = [(a.start(), a.end()) for a in re.finditer(r'<script(?![^>]*src)[^>]*>.*?</script>', fonte, re.S)]
    m = [x for x in re.finditer(r'<p class="meta">.*?</p>', fonte, re.S) if not any(a <= x.start() < b for a, b in scr)]
    assert m, 'sem .meta fora de script'
    tem_ck = 'checkpoint.js' in files
    box = (f'\n<div class="box ok"><strong>Versão interativa:</strong> os {len(aulas)} blocos'
           f'{" e o checkpoint" if tem_ck else ""} também existem como aulas com exercícios, previsão antes de rodar, '
           f'Python no navegador e revisão espaçada: <a href="{cod}-interativo.html">abrir {cod} interativo</a>. '
           'Este texto continua sendo a referência completa.</div>')
    e = m[0].end(); fonte = fonte[:e] + box + fonte[e:]
    (d / f'{cod}.html').write_text(fonte)
print(json.dumps(passo, ensure_ascii=False))
