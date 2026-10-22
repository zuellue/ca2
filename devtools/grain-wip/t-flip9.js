const H = require('/tmp/ca2/devtools/harness.js');
(async () => {
  const srv = await H.serve(8470);
  const b = await H.launch(8471, 'http://127.0.0.1:8470/index.html', []);
  const getD = `(function(){ var s = document.querySelectorAll('body > svg'); if (!s.length) return null; return s[s.length-1].querySelector('path').getAttribute('d'); })()`;
  try {
    await b.sleep(3000);
    await b.ev(`window.__ca2.seedKey('minRefreshInterval', 9999); window.__ca2.seedKey('maxRefreshInterval', 9999)`);
    let r = JSON.parse(await b.ev(`JSON.stringify({x: __ca2.cont.x, y: __ca2.cont.y, w: __ca2.cont.w, h: __ca2.cont.h, dm: __ca2.P.dragMargin})`));
    await b.mouse(r.x + r.w - 4, r.y + r.h - 4, 'mouseMoved');
    await b.sleep(2400);
    console.log('MID corner d:', await b.ev(getD));
    const pin = `(function(){ var c = __ca2.cont, P = __ca2.P; c.user = true; c.rawW = __ca2.W - 2 * P.dragMargin; c.rawH = __ca2.H - 2 * P.dragMargin; __ca2.clampTargets(); c.ew = c.tw; c.eh = c.th; })()`;
    await b.ev(pin); await b.sleep(1200); await b.ev(pin);
    let e = JSON.parse(await b.ev(`JSON.stringify({x: __ca2.cont.x, y: __ca2.cont.y, w: __ca2.cont.w, h: __ca2.cont.h})`));
    await b.mouse(e.x + e.w - 4, e.y + e.h - 4, 'mouseMoved');
    await b.sleep(1200); await b.ev(pin); await b.sleep(1400);
    console.log('EDGE corner d:', await b.ev(getD));
    await b.ev(pin);
    await b.mouse(e.x + e.w - 2, e.y + Math.floor(e.h / 2), 'mouseMoved');
    await b.sleep(1400); await b.ev(pin); await b.sleep(1400);
    console.log('EDGE side d:', await b.ev(getD));
    // mid-page side icon reference
    await b.ev(`(function(){ var c = __ca2.cont, P = __ca2.P; c.user = true; c.rawW = 500; c.rawH = 400; __ca2.clampTargets(); c.ew = c.tw; c.eh = c.th; })()`);
    await b.sleep(1400);
    let m = JSON.parse(await b.ev(`JSON.stringify({x: __ca2.cont.x, y: __ca2.cont.y, w: __ca2.cont.w, h: __ca2.cont.h})`));
    await b.mouse(m.x + m.w - 2, m.y + Math.floor(m.h / 2), 'mouseMoved');
    await b.sleep(2400);
    console.log('MID side d:', await b.ev(getD));
    console.log('errs:', JSON.stringify(b.errs));
  } finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
