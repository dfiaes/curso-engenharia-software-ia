// Valida uma página de aulas: todas as abas (1440/390 × claro/escuro), console, overflow,
// HTML cru, e roda cada exercício python no Pyodide (solução passa, código inicial falha).
// Uso: node tools/interativo/validar.js <página relativa ao repo> [prefixo-screenshot]
// Sobe o próprio servidor; baixa o Pyodide 0.26.4 para tools/interativo/pyodide/ na 1ª vez.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), https = require('https'), { spawn } = require('child_process');
const REPO = path.resolve(__dirname, '../..'), PYO = path.join(__dirname, 'pyodide'), OUT = path.join(__dirname, 'saida');
const CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
const BASE_FILES = ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
const pagina = process.argv[2], tag = process.argv[3] || 'v';
function baixar(f) { return new Promise((ok, erro) => { const dst = path.join(PYO, f); if (fs.existsSync(dst)) return ok(); fs.mkdirSync(PYO, { recursive: true });
  https.get(CDN + f, r => { if (r.statusCode !== 200) return erro(new Error(f + ' HTTP ' + r.statusCode)); const w = fs.createWriteStream(dst); r.pipe(w); w.on('finish', ok); }).on('error', erro); }); }
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of BASE_FILES) await baixar(f);
  const porta = 8800 + Math.floor(Math.random() * 100);
  const srv = spawn('python3', ['-m', 'http.server', String(porta)], { cwd: REPO, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const base = `http://localhost:${porta}/${pagina}`;
  const b = await chromium.launch(); const out = [];
  try {
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) for (const theme of ['light', 'dark']) {
      const ctx = await b.newContext({ viewport: vp, colorScheme: theme });
      await ctx.route('**/pyodide/v0.26.4/full/**', async r => { const f = r.request().url().split('/').pop().split('?')[0];
        try { await baixar(f); } catch (e) { return r.abort(); }
        const ct = f.endsWith('.wasm') ? 'application/wasm' : f.endsWith('.js') ? 'application/javascript' : f.endsWith('.json') ? 'application/json' : 'application/zip';
        r.fulfill({ body: fs.readFileSync(path.join(PYO, f)), contentType: ct, headers: { 'access-control-allow-origin': '*' } }); });
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      await p.goto(base); await p.waitForTimeout(300);
      const plano = await p.evaluate(() => TrilhaAula._i.ordemIds().map(id => [id, (TrilhaAula._i.aula(id) || { abas: [] }).abas.length]));
      for (const [id, n] of plano) for (let a = 0; a < n; a++) {
        await p.goto(base + '#aula=' + id + '&aba=' + a); await p.waitForTimeout(200);
        const r = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth > innerWidth + 1, prep: /em preparo/i.test(document.body.innerText),
          raw: /&lt;|&amp;|<\/?(code|strong|em)>/.test(document.querySelector('main') ? document.querySelector('main').innerText : '') }));
        if (r.ov || r.prep || r.raw) out.push(`${vp.width} ${theme} ${id} aba${a} overflow=${r.ov} preparo=${r.prep} htmlCru=${r.raw}`);
        if (vp.width === 390 && theme === 'dark' && a === 1) await p.screenshot({ path: `${OUT}/${tag}-${id}-m.png` });
        if (vp.width === 1440 && theme === 'light' && a === 2) await p.screenshot({ path: `${OUT}/${tag}-${id}.png` });
      }
      if (errs.length) out.push(`${vp.width} ${theme} ERROS: ` + [...new Set(errs)].slice(0, 6).join(' | '));
      if (vp.width === 1440 && theme === 'light') {
        const py = await p.evaluate(async () => {
          const exs = []; const walk = (o, id) => { if (Array.isArray(o)) o.forEach(x => walk(x, id)); else if (o && typeof o === 'object') { if (o.tipo === 'python') exs.push([id, o]); Object.values(o).forEach(v => walk(v, id)); } };
          TrilhaAula._i.ordemIds().forEach(id => walk(TrilhaAula._i.aula(id), id));
          if (!exs.length) return ['sem exercícios python'];
          await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
          const pyo = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' });
          const H = '__rr=[]\nfor n in [k for k in list(globals()) if k.startswith("test_")]:\n    f=globals()[n]\n    if not callable(f): continue\n    try:\n        f(); __rr.append(1)\n    except Exception as e:\n        __rr.append(n+": "+type(e).__name__+" "+str(e)[:80])\n__r=__rr';
          const run = (c, t) => { const g = pyo.globals.get('dict')(); g.set('__name__', '__main__'); try { pyo.runPython(c, { globals: g }); pyo.runPython(t, { globals: g }); pyo.runPython(H, { globals: g }); return g.get('__r').toJs(); } catch (e) { return 'ERRO ' + String(e.message).split('\n').filter(Boolean).slice(-1)[0]; } };
          for (const [, e] of exs) { try { await pyo.loadPackagesFromImports((e.solucao || '') + '\n' + (e.codigo || '') + '\n' + (e.testes || '')); } catch (x) {} }
          return exs.map(([id, e]) => { let s = run(e.solucao || '', e.testes || ''); if (!(Array.isArray(s) && s.every(x => x === 1))) s = run((e.codigo || '') + '\n\n' + (e.solucao || ''), e.testes || '');
            const i = run(e.codigo || '', e.testes || ''); const ok = Array.isArray(s) && s.length && s.every(x => x === 1); const falha = !Array.isArray(i) || i.some(x => x !== 1);
            return `${ok && falha ? 'OK ' : 'PROBLEMA '} python ${id}/${e.id}: solução ${Array.isArray(s) ? s.filter(x => x === 1).length + '/' + s.length + ' ' + s.filter(x => x !== 1).join(' | ') : s}; inicial ${Array.isArray(i) ? i.filter(x => x === 1).length + '/' + i.length : i}`; });
        });
        out.push(...py);
      }
      await ctx.close();
    }
  } finally { await b.close(); srv.kill(); }
  console.log(out.join('\n') || 'nada'); console.log('FIM');
})();
