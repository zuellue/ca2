const H = require('/tmp/ca2/devtools/harness.js');
function fft(re) { // radix-2, returns magnitudes
  const n = re.length, im = new Float64Array(n);
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    for (let i = 0; i < n; i += len) {
      for (let j = 0; j < len / 2; j++) {
        const c = Math.cos(ang * j), s = Math.sin(ang * j);
        const ur = re[i+j], ui = im[i+j], vr = re[i+j+len/2]*c - im[i+j+len/2]*s, vi = re[i+j+len/2]*s + im[i+j+len/2]*c;
        re[i+j] = ur + vr; im[i+j] = ui + vi; re[i+j+len/2] = ur - vr; im[i+j+len/2] = ui - vi;
      }
    }
  }
  return re.map((r, i) => Math.hypot(r, im[i]));
}
function analyze(px, W, H) {
  // grain = px - 128; row/col/diag mean profiles -> FFT peaks
  const g = i => px[i] - 128;
  const rowM = new Float64Array(H), colM = new Float64Array(W);
  let sum = 0, sum2 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = g(y*W+x); rowM[y] += v; colM[x] += v; sum += v; sum2 += v*v; }
  for (let y = 0; y < H; y++) rowM[y] /= W;
  for (let x = 0; x < W; x++) colM[x] /= H;
  const mean = sum/(W*H), std = Math.sqrt(sum2/(W*H) - mean*mean);
  // diag profile (45deg): average px where (x+y)%W constant
  const dg = new Float64Array(W), dc = new Float64Array(W);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (x+y)%W; dg[k] += g(y*W+x); dc[k]++; }
  for (let k = 0; k < W; k++) dg[k] /= dc[k];
  function peaks(prof) {
    const mag = fft(Array.from(prof));
    const half = mag.slice(1, prof.length/2);
    const meanMag = half.reduce((a,b)=>a+b,0)/half.length;
    let top = [];
    half.forEach((m, i) => { if (m > meanMag*4) top.push({f: i+1, mag: +(m/meanMag).toFixed(1)}); });
    top.sort((a,b)=>b.mag-a.mag);
    return { noiseFloor: +meanMag.toFixed(2), top: top.slice(0,4) };
  }
  return { mean: +mean.toFixed(2), std: +std.toFixed(2), rows: peaks(rowM), cols: peaks(colM), diag: peaks(dg) };
}
(async () => {
  const http = require('http'), fs = require('fs');
  const srv = http.createServer((req, rsp) => { let d; try { d = fs.readFileSync('/tmp/grain' + req.url.split('?')[0]); } catch(e) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, {'content-type': req.url.split('?')[0].endsWith('.html') ? 'text/html' : 'application/octet-stream'}); rsp.end(d); }).listen(8470);
  const b = await H.launch(8471, 'http://127.0.0.1:8470/render.html?fs-new', []);
  try {
    for (let i = 0; i < 40; i++) { await b.sleep(500); const d = await b.ev('window.__done || null'); if (i % 4 === 0) console.log('wait', i, JSON.stringify(d).slice(0,120)); if (d) { console.log('init:', JSON.stringify(d)); break; } }
    console.log('state:', JSON.stringify(await b.ev('({hasGo: typeof go, hasRender: typeof window.__render, done: window.__done || null})')).slice(0, 300));
    const base = { amount: 1.22, strength: 9.2, size: 0.3, softness: 0.82, chroma: 1, development: 0.23, fine: 0.25, crystal: 0.4, cloud: 0.45, dpr: 2, bucket: 0, overlay: false };
    async function run(label, over) {
      const g = Object.assign({}, base, over);
      const res = await b.ev(`__render(${JSON.stringify(g)})`); const px = res && res.r;
      if (!px) { console.log(label, 'EXC', JSON.stringify(res).slice(0, 500)); return null; }
      const a = analyze(px, 512, 512);
      console.log(label, JSON.stringify(a));
      return px;
    }
    await run('base-composite', {});
    await run('fine-only', { fine: 1, crystal: 0, cloud: 0 });
    await run('crystal-only', { fine: 0, crystal: 1, cloud: 0 });
    await run('cloud-only', { fine: 0, crystal: 0, cloud: 1 });
    await run('size2.4-cloud', { size: 2.4, fine: 0, crystal: 0, cloud: 1 });
    const s0 = await run('soft0', { softness: 0 });
    const s1 = await run('soft1', { softness: 1 });
    if (s0 && s1) { let d = 0, ch = 0; for (let i = 0; i < s0.length; i++) { const dd = Math.abs(s0[i]-s1[i]); d += dd; if (dd > 2) ch++; } console.log('softness 0v1: meanAbsDiff', (d/s0.length).toFixed(3), 'pctChanged', (100*ch/s0.length).toFixed(1)); }
    const compR = await b.ev(`__render(${JSON.stringify(Object.assign({}, base, {overlay:false}))})`);
    const ovlR = await b.ev(`__render(${JSON.stringify(Object.assign({}, base, {overlay:true}))})`);
    if (compR && ovlR && compR.r) { let d = 0, mx = 0; for (let i = 0; i < compR.r.length; i++) { const composited = 128*(255-ovlR.a[i])/255 + ovlR.r[i]; const dd = Math.abs(composited - compR.r[i]); d += dd; if (dd > mx) mx = dd; } console.log('composite vs overlay-COMPOSITED: meanAbsDiff', (d/compR.r.length).toFixed(3), 'maxDiff', mx.toFixed(1)); }
  } finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
