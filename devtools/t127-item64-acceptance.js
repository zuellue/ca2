// t127: item 64 acceptance harness (owner 25 Oct architect block).
// Script: shrink the plate 50% in 300ms, hold 2s, expand back; separatorOn on/off; fps 12/60.
// iso=1 disables biological radius changers (foodGrow/foodShrink/divide/eatMerge/symbiogenesis/repro)
// so every radius delta is a constraint-path delta (radius-loss proof, main 25 Oct).
// Metrics (computed in-page; CDP evals cost seconds on the janked headless page):
//   maxDisp, maxSameCoord, radiusLoss, sepJitter, viol/frame, reactionSpread (frame sd + direction spread).
// usage: node devtools/t127-item64-acceptance.js [harnessPath] [fps] [sep 0|1] [iso 0|1] [shotPrefix]
const H = require(process.argv[2] ? require('path').resolve(process.argv[2]) : require('path').join(__dirname, 'harness.js'));
const FPS = +(process.argv[3] || 12), SEP = +(process.argv[4] || 0), ISO = +(process.argv[5] || 0), SHOT = process.argv[6] || '';
(async () => {
  const T0 = Date.now(); const el = () => ((Date.now() - T0) / 1000).toFixed(1);
  const s = await H.serve(8913), c = await H.launch(8912, 'http://127.0.0.1:8913/index.html', ['--window-size=900,600']);
  const evG = async e => { const r = await Promise.race([c.ev(e), new Promise(r2 => setTimeout(() => r2('EV-TIMEOUT'), 15000))]); if (r === 'EV-TIMEOUT') console.error(el() + 's EV STALL on:', e.slice(0, 50)); return r; };
  const wait = async (e, n) => { for (let i = 0; i < (n || 40); i++) { if (await evG(e)) return true; await c.sleep(500); } return false; };
  if (!await wait('window.__ca2 && __ca2.cells > 10')) { console.log('BOOT FAIL'); process.exit(1); }
  console.error(el() + 's booted');
  await evG(`document.getElementById('panel').classList.add('hov')`); // freeze auto-refresh re-deals FIRST (its own postpone path), else a 2-9s re-deal keeps morphing radii and the drain below never ends
  // morph drain: the worker preset apply right after boot can start a morph that eases cell radii
  // (stepTrans) - measuring through it reads biology as constraint loss. Wait it out, bounded.
  let transLeft = true;
  for (let i = 0; i < 25; i++) { if (!await evG('__ca2.trans')) { transLeft = false; break; } await c.sleep(1000); }
  console.error(el() + 's trans drained:', !transLeft);
  if (transLeft) { console.log(JSON.stringify({ abort: 'trans-active' })); c.close(); s.close(); process.exit(0); }
  await c.sleep(1000);
  const setup = await evG(`(function(){
__ca2.setKey('fps', ${FPS}); __ca2.setKey('separatorOn', ${SEP});
${ISO ? "__ca2.setKey('foodGrow', 0); __ca2.setKey('foodShrink', 0); __ca2.setKey('divideOn', 0); __ca2.setKey('eatMergeOn', 0); __ca2.setKey('symbiogenesisOn', 0); __ca2.setKey('reproChance', 0);" : ''}
var cv = document.querySelector('canvas');
window.__fire = function (t, x, y) { cv.dispatchEvent(new MouseEvent(t, { clientX: x, clientY: y, bubbles: true })); };
window.__fr = []; window.__recOn = 1;
__ca2.getCells().forEach(function (q) { q.__r0 = q.radius; }); // identity tag: per-cell radius ledger start (main 25 Oct)
requestAnimationFrame(function rc() { if (!window.__recOn) return; var c = __ca2.cont, cs = __ca2.getCells(), a = new Float32Array(cs.length * 5), j = 0;
  for (var i = 0; i < cs.length; i++) { var q = cs[i]; if (q.alive) { a[j++] = q.x; a[j++] = q.y; a[j++] = q.vx; a[j++] = q.vy; a[j++] = q.radius; } }
  __fr.push({ x: c.x, w: c.w, y: c.y, h: c.h, a: a.subarray(0, j) }); requestAnimationFrame(rc); });
var c = __ca2.cont; return JSON.stringify({ x: c.x, w: c.w, y: c.y, h: c.h, fr: __fr.length, trans: __ca2.trans });})()`);
  const st = JSON.parse(setup);
  console.error(el() + 's setup', setup.slice(0, 90));
  if (SHOT) await c.shot(SHOT + '-before.png');
  const y = Math.round(st.y + st.h / 2), x0 = Math.round(st.x + 2), half = Math.round(st.w * 0.25);
  const fr0 = st.fr;
  evG(`(function(){__fire('mousedown',${x0},${y});
var steps=5,d=${half}/5,i=0;var iv=setInterval(function(){i++;if(i<=steps){__fire('mousemove',${x0}+Math.round(i*d),${y});}else{clearInterval(iv);
setTimeout(function(){var j=0;var iv2=setInterval(function(){j++;if(j<=steps){__fire('mousemove',${x0}+Math.round((5-j)*d),${y});}else{clearInterval(iv2);__fire('mouseup',${x0},${y});window.__done=1;}},60);}},2000);}},60);})()`);
  console.error(el() + 's drag fired');
  await wait('window.__done', 25);
  console.error(el() + 's drag done');
  if (SHOT) await c.shot(SHOT + '-after.png');
  const out = await evG(`(function(){window.__recOn = 0; var fr = __fr.slice(${fr0});
var mean = function (a) { return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : 0; };
var maxDisp = 0, maxSame = 0, viol = 0, violFrames = 0, reacts = {};
for (var i = 0; i < fr.length; i++) {
  var f = fr[i], p = fr[Math.max(0, i - 1)], same = {}, v = 0, na = f.a.length / 5;
  for (var j = 0; j < na; j++) {
    var X = f.a[j * 5], Y = f.a[j * 5 + 1];
    var off = X - f.x; if (off < 3) { var k = Math.round(off * 10) / 10; same[k] = (same[k] || 0) + 1; }
    if (X < f.x - 0.01 || X > f.x + f.w + 0.01 || Y < f.y - 0.01 || Y > f.y + f.h + 0.01) v++;
    if (i > 0) { var bd = 1e9, np = p.a.length / 5;
      for (var q = 0; q < np; q++) { var d = Math.hypot(X - p.a[q * 5], Y - p.a[q * 5 + 1]); if (d < bd) bd = d; }
      if (bd < 1e9 && bd > maxDisp && bd < 400) maxDisp = bd;
      if (i < 40 && X - f.x < 40 && !reacts[j]) { var dvx = f.a[j * 5 + 2] - p.a[Math.min(j, np - 1) * 5 + 2], dvy = f.a[j * 5 + 3] - p.a[Math.min(j, np - 1) * 5 + 3];
        if (Math.hypot(dvx, dvy) > 0.5) reacts[j] = { f: i, dir: Math.atan2(f.a[j * 5 + 3], f.a[j * 5 + 2]) }; } }
  }
  var mx = 0; for (var k2 in same) mx = Math.max(mx, same[k2]); if (mx > maxSame) maxSame = mx;
  viol += v; if (v) violFrames++;
}
var rr = [], rk; for (rk in reacts) rr.push(reacts[rk]);
var rf = rr.map(function (r) { return r.f; }), rfm = mean(rf), rfSd = Math.sqrt(mean(rf.map(function (v2) { return (v2 - rfm) * (v2 - rfm); })));
var sx = 0, sy = 0; rr.forEach(function (r) { sx += Math.cos(r.dir); sy += Math.sin(r.dir); });
var dirSpread = rr.length ? 1 - Math.hypot(sx, sy) / rr.length : 0;
var radiusLoss = 0, f0 = fr[0], fl = fr[fr.length - 1];
if (f0 && fl) { var n0 = f0.a.length / 5, nl = fl.a.length / 5;
  for (var j2 = 0; j2 < nl; j2++) { var bd2 = 1e9, bi = -1;
    for (var q2 = 0; q2 < n0; q2++) { var d2 = Math.hypot(fl.a[j2 * 5] - f0.a[q2 * 5], fl.a[j2 * 5 + 1] - f0.a[q2 * 5 + 1]); if (d2 < bd2) { bd2 = d2; bi = q2; } }
    if (bi >= 0 && f0.a[bi * 5 + 4] > 1) radiusLoss = Math.max(radiusLoss, 1 - fl.a[j2 * 5 + 4] / f0.a[bi * 5 + 4]); } }
var sepJit = -1;
if (${SEP}) { var segs = (__ca2.axisInfo.segs || []).slice(0, 20), flips = 0, nn = 0;
  for (var i2 = 2; i2 < fr.length; i2++) { var na2 = fr[i2].a.length / 5;
    for (var j3 = 0; j3 < na2; j3++) {
      var ax = fr[i2].a[j3 * 5], ay = fr[i2].a[j3 * 5 + 1], avx = fr[i2].a[j3 * 5 + 2], avy = fr[i2].a[j3 * 5 + 3];
      for (var g = 0; g < segs.length; g++) { var sg = segs[g], ex = sg[2] - sg[0], ey = sg[3] - sg[1], el2 = Math.hypot(ex, ey); if (!el2) continue;
        var nx = -ey / el2, ny = ex / el2, dd = (ax - sg[0]) * nx + (ay - sg[1]) * ny;
        if (Math.abs(dd) < 12) { var pb = fr[i2 - 1].a, pb0 = fr[i2 - 2].a, m1 = Math.min(j3, pb.length / 5 - 1) * 5, m0 = Math.min(j3, pb0.length / 5 - 1) * 5;
          var vn = avx * nx + avy * ny, vp = pb[m1 + 2] * nx + pb[m1 + 3] * ny, vq = pb0[m0 + 2] * nx + pb0[m0 + 3] * ny;
          nn++; if (Math.sign(vn) !== Math.sign(vp) && Math.sign(vp) === Math.sign(vq) && Math.abs(vn) > 0.05) flips++; break; } } } }
  sepJit = nn ? +(flips / nn).toFixed(4) : 0; }
var ledgerLoss = 0, ledgerN = 0, ledgerGone = 0;
__ca2.getCells().forEach(function (q) { if (q.__r0 === undefined) return; ledgerN++; if (q.__r0 > 1) ledgerLoss = Math.max(ledgerLoss, 1 - q.radius / q.__r0); });
var lossByCell = []; __ca2.getCells().forEach(function (q) { if (q.__r0 !== undefined && q.__r0 > 1) { var d = 1 - q.radius / q.__r0; if (d > 0.001) lossByCell.push(+d.toFixed(3)); } });
lossByCell.sort(function (a, b) { return b - a; });
document.getElementById('panel').classList.remove('hov');
var transEnd = __ca2.trans, cellR = __ca2.P.CELL_RADIUS;
return JSON.stringify({ frames: fr.length, transEnd: transEnd, cellR: +cellR.toFixed(2), maxDisp: +maxDisp.toFixed(2), maxSameCoord: maxSame, radiusLoss: +radiusLoss.toFixed(4),
  ledgerLoss: +ledgerLoss.toFixed(4), ledgerN: ledgerN, lossByCell: lossByCell.slice(0, 8), deaths: __ca2.deaths,
  sepJitter: sepJit, viol: viol, violFrames: violFrames, reactN: rr.length, reactFrameSd: +rfSd.toFixed(2), reactDirSpread: +dirSpread.toFixed(3) });})()`);
  console.log(JSON.stringify(Object.assign({ fps: FPS, sep: SEP, iso: ISO, tree: 'unknown', errs: c.errs.length }, JSON.parse(out === 'EV-TIMEOUT' ? '{}' : out))));
  c.close(); s.close(); process.exit(0);
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
