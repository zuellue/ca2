const H = require('/tmp/ca2/devtools/harness.js');
function fft(re) { const n = re.length, im = new Float64Array(n);
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const ang = -2 * Math.PI / len;
    for (let i = 0; i < n; i += len) { for (let j = 0; j < len / 2; j++) {
      const c = Math.cos(ang * j), s = Math.sin(ang * j);
      const ur = re[i+j], ui = im[i+j], vr = re[i+j+len/2]*c - im[i+j+len/2]*s, vi = re[i+j+len/2]*s + im[i+j+len/2]*c;
      re[i+j] = ur + vr; im[i+j] = ui + vi; re[i+j+len/2] = ur - vr; im[i+j+len/2] = ui - vi; } } }
  return re.map((r, i) => Math.hypot(r, im[i])); }
function analyze(px, W, H2) {
  const g = i => px[i] - 128;
  const rowM = new Float64Array(H2), colM = new Float64Array(W);
  let sum = 0, sum2 = 0;
  for (let y = 0; y < H2; y++) for (let x = 0; x < W; x++) { const v = g(y*W+x); rowM[y] += v; colM[x] += v; sum += v; sum2 += v*v; }
  for (let y = 0; y < H2; y++) rowM[y] /= W;
  for (let x = 0; x < W; x++) colM[x] /= H2;
  const mean = sum/(W*H2), std = Math.sqrt(sum2/(W*H2) - mean*mean);
  const dg = new Float64Array(W), dc = new Float64Array(W);
  for (let y = 0; y < H2; y++) for (let x = 0; x < W; x++) { const k = (x+y)%W; dg[k] += g(y*W+x); dc[k]++; }
  for (let k = 0; k < W; k++) dg[k] /= dc[k];
  function peaks(prof) { const mag = fft(Array.from(prof)); const half = mag.slice(1, prof.length/2);
    const sorted = half.slice().sort((a,b)=>a-b); const median = sorted[half.length>>1];
    let top = [];
    half.forEach((m, i) => { const lo = Math.max(0, i-4), hi = Math.min(half.length, i+5);
      let ls = 0, ln = 0; for (let k = lo; k < hi; k++) { if (k !== i) { ls += half[k]; ln++; } }
      const local = ls / Math.max(ln, 1);
      if (m > local*3 && m > median*3) top.push({f: i+1, local: +(m/Math.max(local,1e-9)).toFixed(1), med: +(m/Math.max(median,1e-9)).toFixed(1)}); });
    top.sort((a,b)=>b.local-a.local); return { median: +median.toFixed(2), top: top.slice(0,4) }; }
  return { mean: +mean.toFixed(2), std: +std.toFixed(2), rows: peaks(rowM), cols: peaks(colM), diag: peaks(dg) };
}
(async () => {
  const fsName = process.argv[2];
  const http = require('http'), fs = require('fs');
  const srv = http.createServer((req, rsp) => { let d; try { d = fs.readFileSync('/tmp/grain' + req.url.split('?')[0]); } catch(e) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, {'content-type': req.url.split('?')[0].endsWith('.html') ? 'text/html' : 'application/octet-stream'}); rsp.end(d); }).listen(8470);
  const b = await H.launch(8471, 'http://127.0.0.1:8470/render.html?' + fsName, []);
  try {
    for (let i = 0; i < 40; i++) { await b.sleep(500); const d = await b.ev('window.__done || null'); if (d) { if (!d.ok) { console.log('INIT FAIL', JSON.stringify(d)); process.exit(1); } break; } }
    const base = { amount: 1.22, strength: 9.2, size: 2.4, softness: 0, chroma: 0, development: 0.23, fine: 0, crystal: 0, cloud: 1, dpr: 2, bucket: 0, overlay: false };
    async function run(label, over) { const g = Object.assign({}, base, over);
      const res = await b.ev(`__render(${JSON.stringify(g)})`); const px = res && res.r;
      if (!px) { console.log(label, 'EXC', JSON.stringify(res).slice(0, 300)); return null; }
      console.log(label, JSON.stringify(analyze(px, 512, 512)));
      const fs2 = require('fs'); const hdr = Buffer.from('P5\n512 512\n255\n'); const body = Buffer.from(px.map(v => Math.max(0, Math.min(255, Math.round(v)))));
      fs2.writeFileSync('/tmp/grain/out-' + label.replace(/[^a-z0-9.-]+/gi,'_') + '.pgm', Buffer.concat([hdr, body]));
      return px; }
    await run(process.argv[2] + ' size2.4-cloud', {});
    await run(process.argv[2] + ' base-composite', { size: 0.3, softness: 0.82, chroma: 1, fine: 0.25, crystal: 0.4, cloud: 0.45 });
  } finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
