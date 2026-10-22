const H = require('/tmp/ca2/devtools/harness.js');
(async () => {
  const srv = await H.serve(8470);
  const b = await H.launch(8471, 'http://127.0.0.1:8470/index.html', []);
  try {
    await b.sleep(3000);
    const probe = `(function(){
      var g = document.getElementById('g');
      var gl = g.getContext('webgl2');
      var src = document.createElement('canvas'); src.width = 128; src.height = 128;
      var x = src.getContext('2d'); x.fillStyle = 'rgb(128,128,128)'; x.fillRect(0, 0, 128, 128);
      function run(p, bucket) {
        CA2Grain.render(src, p, bucket, 1, 0);
        var px = new Uint8Array(4 * 128 * 128);
        gl.readPixels(0, 0, 128, 128, gl.RGBA, gl.UNSIGNED_BYTE, px);
        return px;
      }
      function stats(px) { var s = 0, s2 = 0, n = 0, m = 0; for (var i = 0; i < px.length; i += 4) { var v = px[i]; s += v; s2 += v * v; n++; if (Math.abs(v - 128) > m) m = Math.abs(v - 128); } s /= n; s2 /= n; return { mean: +s.toFixed(2), std: +Math.sqrt(Math.max(0, s2 - s * s)).toFixed(2), maxDev: m }; }
      function diff(a, c) { var s = 0, n = 0; for (var i = 0; i < a.length; i += 4) { s += Math.abs(a[i] - c[i]); n++; } return +(s / n).toFixed(2); }
      var base = { amount: 1.2, strength: 9.2, size: 0.8, softness: 0.82, chroma: 1, development: 0.23, fine: 0.25, crystal: 0.4, cloud: 0.45 };
      var out = {};
      var off = run({ ...base, amount: 0 }, 0);
      var on0 = run(base, 0), on1 = run(base, 1);
      out.grainOn = stats(on0); out.grainOff = stats(off);
      out.temporalDiff = diff(on0, on1); // grain animates between buckets
      out.staticCheck = diff(run(base, 0), run(base, 0)); // same bucket = identical
      var mono = run({ ...base, mono: 1 }, 0);
      var mm = 0; for (var i = 0; i < mono.length; i += 4) mm = Math.max(mm, Math.abs(mono[i] - mono[i+1]), Math.abs(mono[i] - mono[i+2]));
      out.monoMaxChromaDev = mm; // mono: r=g=b everywhere
      out.stockDiff = diff(run({ ...base, stock: [1.10, 0.80, 1.20] }, 0), run({ ...base, stock: [1.00, 0.95, 1.00] }, 0));
      out.debugDiff = diff(run({ ...base, debug: 1 }, 0), on0);
      out.sensDiff = diff(run({ ...base, shadow: 4, mid: 4, high: 4 }, 0), on0);
      out.ratioDiff = diff(run({ ...base, fineRatio: 1.5, cloudRatio: 1.2 }, 0), on0);
      out.skewDiff = diff(run({ ...base, skew: 0.9 }, 0), on0);
      // overlay branch: alpha > 0 where grain
      CA2Grain.render(src, base, 0, 1, 1);
      var ov = new Uint8Array(4 * 128 * 128); gl.readPixels(0, 0, 128, 128, gl.RGBA, gl.UNSIGNED_BYTE, ov);
      var aLit = 0; for (var i = 3; i < ov.length; i += 4) if (ov[i] > 4) aLit++;
      out.overlayAlphaLit = aLit + '/' + (128 * 128);
      return JSON.stringify(out);
    })()`;
    console.log(await b.ev(probe));
    console.log('errs:', JSON.stringify(b.errs));
  } finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
