const H = require('/tmp/ca2/devtools/harness.js');
const http = require('http'), fs = require('fs');
(async () => {
  const srv = http.createServer((req, rsp) => { let d; try { d = fs.readFileSync('/tmp/grain' + req.url.split('?')[0]); } catch(e) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200); rsp.end(d); }).listen(8470);
  const b = await H.launch(8471, 'http://127.0.0.1:8470/render.html?fs-new', []);
  try { for (let i = 0; i < 30; i++) { await b.sleep(500); const d = await b.ev('window.__done || null'); if (d) { console.log(JSON.stringify(d)); break; } } }
  finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
