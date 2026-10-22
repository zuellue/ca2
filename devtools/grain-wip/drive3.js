const H = require('/tmp/ca2/devtools/harness.js');
(async () => {
  const fsName = process.argv[2];
  const http = require('http'), fs = require('fs');
  const srv = http.createServer((req, rsp) => { let d; try { d = fs.readFileSync('/tmp/grain' + req.url.split('?')[0]); } catch(e) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, {'content-type': req.url.split('?')[0].endsWith('.html') ? 'text/html' : 'application/octet-stream'}); rsp.end(d); }).listen(8470);
  const b = await H.launch(8471, 'http://127.0.0.1:8470/render.html?' + fsName, []);
  try {
    for (let i = 0; i < 40; i++) { await b.sleep(500); const d = await b.ev('window.__done || null'); if (d) break; }
    const base = { amount: 1.22, strength: 9.2, size: 2.4, softness: 0, chroma: 0, development: 0.23, fine: 0, crystal: 0, cloud: 1, dpr: 2, bucket: 0, overlay: false };
    async function rowProf(bucket) { const g = Object.assign({}, base, { bucket: bucket }); const res = await b.ev(`__render(${JSON.stringify(g)})`); const px = res.r; const rm = []; for (let y = 0; y < 512; y++) { let s = 0; for (let x = 0; x < 512; x++) s += px[y*512+x]; rm.push(s/512); } return rm; }
    const r0 = await rowProf(0), r1 = await rowProf(1), r2 = await rowProf(2);
    function corr(a, b) { let ma = 0, mb = 0; a.forEach(v => ma += v); b.forEach(v => mb += v); ma /= a.length; mb /= b.length; let num = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { num += (a[i]-ma)*(b[i]-mb); da += (a[i]-ma)*(a[i]-ma); db += (b[i]-mb)*(b[i]-mb); } return +(num / Math.sqrt(da * db)).toFixed(3); }
    function bestShift(a, b) { let best = { s: 0, c: -2 }; for (let s = -40; s <= 40; s++) { let num = 0, da = 0, db = 0, n = 0; for (let i = 40; i < a.length - 40; i++) { const j = i + s; const va = a[i] - 128, vb = b[j] - 128; num += va * vb; da += va * va; db += vb * vb; n++; } const c = num / Math.sqrt(da * db); if (c > best.c) best = { s: s, c: +c.toFixed(3) }; } return best; }
    console.log(fsName, 'row-profile corr bucket0v1:', corr(r0, r1), 'bucket1v2:', corr(r1, r2), 'bestShift0v1:', JSON.stringify(bestShift(r0, r1)));
  } finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
