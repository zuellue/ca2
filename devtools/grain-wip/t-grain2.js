const H = require('/tmp/ca2/devtools/harness.js');
const fs = require('fs');
const zlib = require('zlib');
function pngStats(path) { // minimal PNG decode (truecolor/rgba 8-bit)
  const buf = fs.readFileSync(path);
  let pos = 8, w = 0, h = 0, bit = 0, ct = 0, idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') { w = buf.readUInt32BE(pos + 8); h = buf.readUInt32BE(pos + 12); bit = buf[pos + 16]; ct = buf[pos + 17]; }
    if (type === 'IDAT') idat.push(buf.slice(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = ct === 6 ? 4 : ct === 2 ? 3 : 0; if (!ch) return { err: 'ct' + ct };
  const stride = w * ch + 1;
  let lit = 0, redish = 0, prev = Buffer.alloc(w * ch);
  const rows = [];
  for (let y = 0; y < h; y++) {
    const f = raw[y * stride]; const cur = Buffer.alloc(w * ch);
    for (let x = 0; x < w * ch; x++) {
      const v = raw[y * stride + 1 + x], a = x >= ch ? cur[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let p = v;
      if (f === 1) p = (v + a) & 255; else if (f === 2) p = (v + b) & 255; else if (f === 3) p = (v + ((a + b) >> 1)) & 255;
      else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); p = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255; }
      cur[x] = p;
    }
    rows.push(cur); prev = cur;
  }
  // sample a central band where the plate content lives
  for (let y = Math.floor(h * 0.3); y < h * 0.7; y += 3) for (let x = Math.floor(w * 0.3); x < w * 0.7; x += 3) {
    const r = rows[y][x * ch], g = rows[y][x * ch + 1], bl = rows[y][x * ch + 2];
    if (r + g + bl > 30) lit++;
    if (r > g + 40 && r > bl + 40) redish++;
  }
  return { lit, redish, w, h };
}
(async () => {
  const srv = await H.serve(8470);
  const b = await H.launch(8471, 'http://127.0.0.1:8470/index.html', []);
  try {
    await b.sleep(1800); // early: intro just started
    await b.shot('/tmp/sweep/gr-early.png');
    await b.sleep(5000);
    await b.shot('/tmp/sweep/gr-late.png');
    await b.ev(`window.__ca2.setKey('grainDebug', 1)`); await b.sleep(700);
    await b.shot('/tmp/sweep/gr-debug.png');
    await b.ev(`window.__ca2.setKey('grainDebug', 0); window.__ca2.setKey('grainMono', 1)`); await b.sleep(700);
    await b.shot('/tmp/sweep/gr-mono.png');
    console.log('early:', JSON.stringify(pngStats('/tmp/sweep/gr-early.png')));
    console.log('late:', JSON.stringify(pngStats('/tmp/sweep/gr-late.png')));
    console.log('debug:', JSON.stringify(pngStats('/tmp/sweep/gr-debug.png')));
    console.log('mono:', JSON.stringify(pngStats('/tmp/sweep/gr-mono.png')));
    console.log('errs:', JSON.stringify(b.errs));
  } finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
