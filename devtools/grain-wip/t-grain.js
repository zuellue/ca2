const H = require('/tmp/ca2/devtools/harness.js');
(async () => {
  const srv = await H.serve(8470);
  const b = await H.launch(8471, 'http://127.0.0.1:8470/index.html', []);
  try {
    await b.sleep(2500);
    // grain must be rendering EARLY (landing fix): sample the grain canvas
    const early = await b.ev(`(function(){ var g = document.getElementById('g'); if (!g.width) return 'nocanvas'; var t = document.createElement('canvas'); t.width = 64; t.height = 40; var x = t.getContext('2d'); x.drawImage(g, 0, 0, 64, 40); var d = x.getImageData(0, 0, 64, 40).data, lit = 0; for (var i = 3; i < d.length; i += 4) if (d[i] > 4) lit++; return { lit: lit, ok: window.CA2Grain && CA2Grain.ok, err: window.CA2Grain && CA2Grain.error || null }; })()`);
    console.log('grain at ~2.5s:', JSON.stringify(early));
    await b.sleep(4000);
    const late = await b.ev(`(function(){ var g = document.getElementById('g'); var t = document.createElement('canvas'); t.width = 64; t.height = 40; var x = t.getContext('2d'); x.drawImage(g, 0, 0, 64, 40); var d = x.getImageData(0, 0, 64, 40).data, lit = 0; for (var i = 3; i < d.length; i += 4) if (d[i] > 4) lit++; return { lit: lit }; })()`);
    console.log('grain at ~6.5s:', JSON.stringify(late));
    // new panel rows present
    console.log('panel rows:', await b.ev(`(function(){ var labels = ['stock 0-5', 'mono grain', 'skew', 'resolution adapt', 'shadow sensitivity', 'midtone sensitivity', 'highlight sensitivity', 'fine size ratio', 'cloud size ratio', 'debug visualize']; var txt = document.getElementById('controls').textContent; return labels.filter(function (l) { return txt.indexOf(l) >= 0; }).length + '/' + labels.length; })()`));
    // defaults present
    console.log('P keys:', await b.ev(`(function(){ var ks = ['grainStock', 'grainMono', 'grainSkew', 'grainResAdapt', 'grainShadow', 'grainMid', 'grainHigh', 'grainFineRatio', 'grainCloudRatio', 'grainDebug']; return ks.map(function (k) { return k + '=' + window.__ca2.P[k]; }).join(' '); })()`));
    // debug visualize renders (shader path live)
    await b.ev(`window.__ca2.setKey('grainDebug', 1)`); await b.sleep(600);
    const dbg = await b.ev(`(function(){ var g = document.getElementById('g'); var t = document.createElement('canvas'); t.width = 64; t.height = 40; var x = t.getContext('2d'); x.drawImage(g, 0, 0, 64, 40); var d = x.getImageData(0, 0, 64, 40).data, r = 0, n = 0; for (var i = 0; i < d.length; i += 4) { if (d[i+3] > 4) { n++; if (d[i] > d[i+1] + 40) r++; } } return { lit: n, redish: r }; })()`);
    console.log('debug visualize:', JSON.stringify(dbg));
    await b.ev(`window.__ca2.setKey('grainDebug', 0)`); await b.sleep(400);
    // mono path
    await b.ev(`window.__ca2.setKey('grainMono', 1); window.__ca2.setKey('grainStock', 4)`); await b.sleep(600);
    const mono = await b.ev(`(function(){ var g = document.getElementById('g'); var t = document.createElement('canvas'); t.width = 64; t.height = 40; var x = t.getContext('2d'); x.drawImage(g, 0, 0, 64, 40); var d = x.getImageData(0, 0, 64, 40).data, lit = 0; for (var i = 3; i < d.length; i += 4) if (d[i] > 4) lit++; return { lit: lit }; })()`);
    console.log('mono+stock4:', JSON.stringify(mono));
    await b.ev(`window.__ca2.setKey('grainMono', 0); window.__ca2.setKey('grainStock', 0)`);
    await b.shot('/tmp/sweep/grain-live.png');
    console.log('errs:', JSON.stringify(b.errs));
  } finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
