const H = require('/tmp/ca2/devtools/harness.js');
function parseD(d) { if (!d) return null; const n = (d.match(/-?\d+\.?\d*/g) || []).map(Number); let xs = [], ys = []; for (let i = 0; i < n.length; i += 2) { xs.push(n[i]); ys.push(n[i + 1]); } if (!xs.length) return null; const cx = xs.reduce((a, b) => a + b, 0) / xs.length, cy = ys.reduce((a, b) => a + b, 0) / ys.length; return { cx: +cx.toFixed(2), cy: +cy.toFixed(2), minX: +Math.min(...xs).toFixed(2), maxX: +Math.max(...xs).toFixed(2), minY: +Math.min(...ys).toFixed(2), maxY: +Math.max(...ys).toFixed(2) }; }
(async () => {
  const srv = await H.serve(8470);
  const b = await H.launch(8471, 'http://127.0.0.1:8470/index.html', []);
  const getD = `(function(){ var s = document.querySelectorAll('body > svg'); if (!s.length) return null; return s[s.length-1].querySelector('path').getAttribute('d'); })()`;
  try {
    await b.sleep(3000);
    await b.ev(`window.__ca2.seedKey('minRefreshInterval', 9999); window.__ca2.seedKey('maxRefreshInterval', 9999)`);
    let r = JSON.parse(await b.ev(`JSON.stringify({x: __ca2.cont.x, y: __ca2.cont.y, w: __ca2.cont.w, h: __ca2.cont.h, dm: __ca2.P.dragMargin, W: __ca2.W, H: __ca2.H})`));
    // mid-page corner reference
    await b.mouse(r.x + r.w - 4, r.y + r.h - 4, 'mouseMoved');
    await b.sleep(2400);
    let mid = parseD(await b.ev(getD));
    console.log('mid corner at', (r.x + r.w) + ',' + (r.y + r.h), JSON.stringify(mid), mid ? 'offset ' + (mid.cx - (r.x + r.w)).toFixed(2) + ',' + (mid.cy - (r.y + r.h)).toFixed(2) : 'NO PATH');
    // pin at edge
    await b.ev(`(function(){ var c = __ca2.cont, P = __ca2.P; c.user = true; c.rawW = __ca2.W - 2 * P.dragMargin; c.rawH = __ca2.H - 2 * P.dragMargin; __ca2.clampTargets(); c.ew = c.tw; c.eh = c.th; })()`);
    await b.sleep(1200);
    await b.ev(`(function(){ var c = __ca2.cont, P = __ca2.P; c.user = true; c.rawW = __ca2.W - 2 * P.dragMargin; c.rawH = __ca2.H - 2 * P.dragMargin; __ca2.clampTargets(); c.ew = c.tw; c.eh = c.th; })()`);
    let e = JSON.parse(await b.ev(`JSON.stringify({x: __ca2.cont.x, y: __ca2.cont.y, w: __ca2.cont.w, h: __ca2.cont.h})`));
    console.log('at-edge cont:', JSON.stringify(e));
    await b.mouse(e.x + e.w - 4, e.y + e.h - 4, 'mouseMoved');
    await b.sleep(1200);
    await b.ev(`(function(){ var c = __ca2.cont; c.ew = c.tw = ${e.w}; c.eh = c.th = ${e.h}; })()`); // hold through the render frame
    await b.sleep(1400);
    let ed = parseD(await b.ev(getD));
    console.log('edge corner at', (e.x + e.w) + ',' + (e.y + e.h), JSON.stringify(ed), ed ? 'offset ' + (ed.cx - (e.x + e.w)).toFixed(2) + ',' + (ed.cy - (e.y + e.h)).toFixed(2) : 'NO PATH');
    // side edge icon (must still flip inward at the cap)
    await b.ev(`(function(){ var c = __ca2.cont, P = __ca2.P; c.user = true; c.rawW = __ca2.W - 2 * P.dragMargin; c.rawH = __ca2.H - 2 * P.dragMargin; __ca2.clampTargets(); c.ew = c.tw; c.eh = c.th; })()`);
    await b.mouse(e.x + e.w - 2, e.y + Math.floor(e.h / 2), 'mouseMoved');
    await b.sleep(1400);
    await b.ev(`(function(){ var c = __ca2.cont; c.ew = c.tw = ${e.w}; c.eh = c.th = ${e.h}; })()`);
    await b.sleep(1400);
    let sd = parseD(await b.ev(getD));
    console.log('side icon, edge x=' + (e.x + e.w), JSON.stringify(sd), sd ? 'offset x ' + (sd.cx - (e.x + e.w)).toFixed(2) : 'NO PATH');
    console.log('errs:', JSON.stringify(b.errs));
  } finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
