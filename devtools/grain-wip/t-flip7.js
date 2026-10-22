const H = require('/tmp/ca2/devtools/harness.js');
function parseD(d) { const n = (d.match(/-?\d+\.?\d*/g) || []).map(Number); let xs = [], ys = []; for (let i = 0; i < n.length; i += 2) { xs.push(n[i]); ys.push(n[i + 1]); } const cx = xs.reduce((a, b) => a + b, 0) / xs.length, cy = ys.reduce((a, b) => a + b, 0) / ys.length; return { cx: +cx.toFixed(2), cy: +cy.toFixed(2), minX: +Math.min(...xs).toFixed(2), maxX: +Math.max(...xs).toFixed(2), minY: +Math.min(...ys).toFixed(2), maxY: +Math.max(...ys).toFixed(2), pts: xs.length }; }
(async () => {
  const srv = await H.serve(8470);
  const b = await H.launch(8471, 'http://127.0.0.1:8470/index.html', []);
  const getD = `((document.querySelector('svg[style*="z-index:8"]') || {}).querySelector ? document.querySelector('svg[style*="z-index:8"]').querySelector('path').getAttribute('d') : null)`;
  try {
    await b.sleep(3000);
    await b.ev(`window.__ca2.seedKey('minRefreshInterval', 9999); window.__ca2.seedKey('maxRefreshInterval', 9999)`);
    // reference: mid-page corner icon (bottom-right)
    let r = JSON.parse(await b.ev(`JSON.stringify({x: __ca2.cont.x, y: __ca2.cont.y, w: __ca2.cont.w, h: __ca2.cont.h, dm: __ca2.P.dragMargin, W: __ca2.W, H: __ca2.H})`));
    console.log('mid-page cont:', JSON.stringify(r));
    await b.mouse(r.x + r.w - 4, r.y + r.h - 4, 'mouseMoved');
    await b.sleep(2200);
    let dMid = await b.ev(getD);
    let mid = parseD(dMid || '');
    console.log('mid corner icon:', JSON.stringify(mid), 'corner at', (r.x + r.w) + ',' + (r.y + r.h), 'centroid offset:', +(mid.cx - (r.x + r.w)).toFixed(2) + ',' + +(mid.cy - (r.y + r.h)).toFixed(2));
    // pin the plate at the viewport edge
    await b.ev(`(function(){ var c = __ca2.cont, P = __ca2.P; c.user = true; c.rawW = __ca2.W - 2 * P.dragMargin; c.rawH = __ca2.H - 2 * P.dragMargin; __ca2.clampTargets(); c.ew = c.tw; c.eh = c.th; })()`);
    await b.sleep(2200);
    let e = JSON.parse(await b.ev(`JSON.stringify({x: __ca2.cont.x, y: __ca2.cont.y, w: __ca2.cont.w, h: __ca2.cont.h, user: __ca2.cont.user})`));
    console.log('at-edge cont:', JSON.stringify(e));
    await b.mouse(e.x + e.w - 4, e.y + e.h - 4, 'mouseMoved');
    await b.sleep(2200);
    let dEdge = await b.ev(getD);
    let ed = parseD(dEdge || '');
    console.log('edge corner icon:', JSON.stringify(ed), 'corner at', (e.x + e.w) + ',' + (e.y + e.h), 'centroid offset:', +(ed.cx - (e.x + e.w)).toFixed(2) + ',' + +(ed.cy - (e.y + e.h)).toFixed(2));
    // edge icon on the right side (must still flip: vertex inside the plate)
    await b.mouse(e.x + e.w - 2, e.y + e.h / 2, 'mouseMoved');
    await b.sleep(2200);
    let dSide = await b.ev(getD);
    let sd = parseD(dSide || '');
    console.log('edge side icon:', JSON.stringify(sd), 'right edge at x=' + (e.x + e.w), 'centroid offset x:', +(sd.cx - (e.x + e.w)).toFixed(2));
    console.log('errs:', JSON.stringify(b.errs));
  } finally { await b.close(); srv.close(); }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
