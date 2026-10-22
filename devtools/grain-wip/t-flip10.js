const H = require('/tmp/ca2/devtools/harness.js');
(async () => {
  const srv = await H.serve(8470);
  const b = await H.launch(8471, 'http://127.0.0.1:8470/index.html', []);
  const getD = `(function(){ var s = document.querySelectorAll('body > svg'); if (!s.length) return null; return s[s.length-1].querySelector('path').getAttribute('d'); })()`;
  try {
    await b.sleep(3000);
    await b.ev(`window.__ca2.seedKey('minRefreshInterval', 9999); window.__ca2.seedKey('maxRefreshInterval', 9999)`);
    let r = JSON.parse(await b.ev(`JSON.stringify({x: __ca2.cont.x, y: __ca2.cont.y, w: __ca2.cont.w, h: __ca2.cont.h})`));
    console.log('cont:', JSON.stringify(r), 'corner:', r.x + r.w, r.y + r.h);
    await b.mouse(r.x + r.w - 4, r.y + r.h - 4, 'mouseMoved');
    await b.sleep(2000);
    console.log('corner d (t+2s):', await b.ev(getD));
    await b.mouse(r.x + r.w - 5, r.y + r.h - 5, 'mouseMoved');
    await b.sleep(2000);
    console.log('corner d (t+4s):', await b.ev(getD));
    console.log('cur:', await b.ev(`JSON.stringify(__ca2.cur)`));
  } finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
