const H = require('/tmp/ca2/devtools/harness.js');
const http = require('http'), fs = require('fs');
(async () => {
  const srv = http.createServer((req, rsp) => { let d; try { d = fs.readFileSync('/tmp/grain' + req.url.split('?')[0]); } catch(e) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200); rsp.end(d); }).listen(8470);
  const b = await H.launch(8471, 'http://127.0.0.1:8470/render.html?fs-new', []);
  try {
    for (let i = 0; i < 30; i++) { await b.sleep(500); const d = await b.ev('window.__done || null'); if (d) break; }
    const g = { amount: 1, strength: 5, size: 1, softness: 0.5, chroma: 0.5, development: 0.4, fine: 0.25, crystal: 0.4, cloud: 0.45, dpr: 1 };
    const r = await b.ev(`try { const r = __render(${JSON.stringify(g)}); ({ok: true, n: r.r.length}); } catch (e) { 'THREW: ' + e.message; }`);
    console.log(JSON.stringify(r).slice(0, 300));
  } finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
