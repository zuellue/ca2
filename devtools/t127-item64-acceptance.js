// t127: item 64 acceptance harness (owner 25 Oct architect block).
// Script: shrink the plate 50% in 300ms, hold 2s, expand back; separatorOn on/off; fps 12/60.
// iso=1 disables biological radius changers (foodGrow/foodShrink/divide/eatMerge/symbiogenesis/repro)
// so every radius delta is a constraint-path delta (radius-loss proof, main 25 Oct).
// Metrics (computed in-page; CDP evals cost seconds on the janked headless page):
//   maxDisp, maxSameCoord, radiusLoss, sepJitter, viol/frame, reactionSpread (frame sd + direction spread).
// usage: node devtools/t127-item64-acceptance.js [harnessPath] [fps] [sep 0|1] [iso 0|1] [shotPrefix]
const H = require(process.argv[2] ? require('path').resolve(process.argv[2]) : require('path').join(__dirname, 'harness.js'));
const FPS = +(process.argv[3] || 12), SEP = +(process.argv[4] || 0), ISO = +(process.argv[5] || 0), SHOT = process.argv[6] || '', SEED = +(process.argv[7] || 0); // SEED: matched-initial-state control (main 25 Oct) - same seeded Math.random at boot in both trees
const EXTRA = process.argv[8] ? JSON.parse(process.argv[8]) : {}; // extra setKey overrides, e.g. '{"crowdGain":0}' for A/B
const STATE = process.argv[9] || ''; // 'dump:/path.json' captures the post-boot state; 'inject:/path.json' forces it - matched initial state across trees (main 25 Oct)
(async () => {
  const T0 = Date.now(); const el = () => ((Date.now() - T0) / 1000).toFixed(1);
  const s = await H.serve(8913), c = await H.launch(8912, 'http://127.0.0.1:8913/index.html', ['--window-size=900,600']);
  if (SEED) { // reload with a seeded Math.random from the very first script: identical boot populations in both trees
    await c.send('Page.addScriptToEvaluateOnNewDocument', { source: '(function(){var s=' + SEED + '>>>0;Math.random=function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();' });
    await c.send('Page.navigate', { url: 'http://127.0.0.1:8913/index.html' }); }
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
  const inj = STATE.startsWith('inject:') && require('fs').existsSync(STATE.slice(7)) ? JSON.parse(require('fs').readFileSync(STATE.slice(7), 'utf8')) : null;
  const setup = await evG(`(function(){
__ca2.setKey('fps', ${FPS}); __ca2.setKey('separatorOn', ${SEP}); ${Object.entries(EXTRA).map(function (e2) { return "__ca2.setKey('" + e2[0] + "', " + JSON.stringify(e2[1]) + ");"; }).join(' ')}
${ISO ? "__ca2.setKey('foodGrow', 0); __ca2.setKey('foodShrink', 0); __ca2.setKey('divideOn', 0); __ca2.setKey('eatMergeOn', 0); __ca2.setKey('symbiogenesisOn', 0); __ca2.setKey('reproChance', 0);" : ''}
var INJ = ${JSON.stringify(inj)};
if (INJ) { var cs0 = __ca2.getCells();
  while (cs0.length < INJ.cells.length) { var tp0 = cs0[cs0.length - 1], d0 = Object.create(Object.getPrototypeOf(tp0)); Object.assign(d0, tp0); d0.g = JSON.parse(JSON.stringify(tp0.g)); d0.shp = JSON.parse(JSON.stringify(tp0.shp)); cs0.push(d0); }
  INJ.cells.forEach(function (sc, i) { var c = cs0[i]; for (var k in sc) { if (k === 'g' || k === 'shp') c[k] = JSON.parse(JSON.stringify(sc[k])); else c[k] = sc[k]; } });
  cs0.length = INJ.cells.length; // hard truncate: extras never existed - no death-metric pollution
  var fd0 = __ca2.getFood(); fd0.length = 0; INJ.food.forEach(function (f) { fd0.push({ x: f.x, y: f.y, r: f.r }); });
  __ca2.cont.x = INJ.cont.x; __ca2.cont.y = INJ.cont.y; __ca2.cont.w = INJ.cont.w; __ca2.cont.h = INJ.cont.h; __ca2.cont.tw = INJ.cont.w; __ca2.cont.th = INJ.cont.h; __ca2.cont.ew = INJ.cont.w; __ca2.cont.eh = INJ.cont.h; }
var cv = document.querySelector('canvas');
window.__fire = function (t, x, y) { cv.dispatchEvent(new MouseEvent(t, { clientX: x, clientY: y, bubbles: true })); };
window.__fr = []; window.__recOn = 1;
window.__ls = {}; window.__tn = 0;
__ca2.getCells().forEach(function (q) { q.__r0 = q.radius; q.__ti = window.__tn++; q.__rmin = q.radius; }); // identity tags: per-cell radius ledger + dead-cell tracking (main 25 Oct)
var __fp = 0; __ca2.getCells().forEach(function (q) { if (q.alive) __fp = (__fp * 31 + Math.round(q.x * 7 + q.y * 13 + q.radius * 17)) >>> 0; }); window.__initFP = __fp; // initial-state fingerprint: identical across trees iff the seed matched the population
window.__stateDump = JSON.stringify({ cells: __ca2.getCells().map(function (q) { return { x: q.x, y: q.y, vx: q.vx, vy: q.vy, radius: q.radius, energy: q.energy, gene: q.gene, maxSpeed: q.maxSpeed, speedModifier: q.speedModifier, hostility: q.hostility, mutationRate: q.mutationRate, sv: q.sv, cl: q.cl || 0, sq: q.sq || 0, crowd: q.crowd || 0, hab: q.hab || 0, alive: q.alive, g: q.g, shp: q.shp }; }), food: __ca2.getFood().map(function (f) { return { x: f.x, y: f.y, r: f.r }; }), cont: { x: __ca2.cont.x, y: __ca2.cont.y, w: __ca2.cont.w, h: __ca2.cont.h } });
requestAnimationFrame(function rc() { if (!window.__recOn) return; var c = __ca2.cont, cs = __ca2.getCells(), a = new Float32Array(cs.length * 5), j = 0;
  for (var i = 0; i < cs.length; i++) { var q = cs[i]; if (q.alive) { a[j++] = q.x; a[j++] = q.y; a[j++] = q.vx; a[j++] = q.vy; a[j++] = q.radius;
    if (q.__ti !== undefined) { __ls[q.__ti] = [q.x, q.y, q.radius, q.energy, __fr.length, q.__r0]; if (q.radius < q.__rmin) q.__rmin = q.radius;
      var dr = (q.__rprev === undefined ? q.radius : q.__rprev) - q.radius; q.__rprev = q.radius;
      if (dr > (q.__rmaxdrop || 0)) { q.__rmaxdrop = dr; q.__rdropf = __fr.length; var cc = __ca2.cont; q.__rdropwall = Math.min(Math.abs(q.x - cc.x), Math.abs(cc.x + cc.w - q.x), Math.abs(q.y - cc.y), Math.abs(cc.y + cc.h - q.y)) < 30;
        var sgs = (__ca2.axisInfo && __ca2.axisInfo.segs) || []; q.__rdropsep = false;
        for (var si2 = 0; si2 < sgs.length; si2++) { var sg2 = sgs[si2], ex2 = sg2[2] - sg2[0], ey2 = sg2[3] - sg2[1], l2b = ex2 * ex2 + ey2 * ey2; if (!l2b) continue;
          var tt = Math.max(0, Math.min(1, ((q.x - sg2[0]) * ex2 + (q.y - sg2[1]) * ey2) / l2b));
          if (Math.hypot(q.x - (sg2[0] + ex2 * tt), q.y - (sg2[1] + ey2 * tt)) < 30) { q.__rdropsep = true; break; } } } } } }
  var wb = []; for (var wi = 0; wi < cs.length; wi++) { var qw = cs[wi]; if (qw.__ti !== undefined && qw.x - c.x < 3) wb.push([qw.__ti, qw.alive ? 1 : 0, +qw.x.toFixed(2), +qw.vx.toFixed(2), +(qw.crowd || 0).toFixed(3), +(qw.hab || 0).toFixed(3), +qw.energy.toFixed(1)]); } // alive-identity wall roster: locking-vs-corpses discriminator (main 25 Oct)
  __fr.push({ x: c.x, w: c.w, y: c.y, h: c.h, dv: __ca2.divides, bt: __ca2.births, a: a.subarray(0, j), wb: wb }); requestAnimationFrame(rc); });
var c = __ca2.cont; return JSON.stringify({ x: c.x, w: c.w, y: c.y, h: c.h, fr: __fr.length, trans: __ca2.trans });})()`);
  const st = JSON.parse(setup);
  if (STATE.startsWith('dump:')) { const sd = await evG('window.__stateDump'); require('fs').writeFileSync(STATE.slice(5), sd); console.error(el() + 's state dumped: ' + (sd ? sd.length : 0) + ' bytes'); }
  console.error(el() + 's setup', setup.slice(0, 90));
  if (SHOT) await c.shot(SHOT + '-before.png');
  const y = Math.round(st.y + st.h / 2), x0 = Math.round(st.x + 2), half = Math.round(st.w * 0.25);
  const fr0 = st.fr;
  evG(`(function(){__fire('mousedown',${x0},${y});
var steps=5,d=${half}/5,i=0;var iv=setInterval(function(){i++;if(i<=steps){__fire('mousemove',${x0}+Math.round(i*d),${y});}else{clearInterval(iv);
setTimeout(function(){var j=0;var iv2=setInterval(function(){j++;if(j<=steps){__fire('mousemove',${x0}+Math.round((5-j)*d),${y});}else{clearInterval(iv2);__fire('mouseup',${x0},${y});window.__done=1;}},60);}},2000);}},60);})()`);
  console.error(el() + 's drag fired');
  if (SHOT) { await c.sleep(1600); await c.shot(SHOT + '-mid.png'); } // mid-hold: max squeeze, squash state visible
  await wait('window.__done', 25);
  console.error(el() + 's drag done');
  if (SHOT) await c.shot(SHOT + '-after.png');
  const out = await evG(`(function(){window.__recOn = 0; var fr = __fr.slice(${fr0});
var mean = function (a) { return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : 0; };
var maxDisp = 0, maxSame = 0, maxSameTail = 0, viol = 0, violFrames = 0, reacts = {};
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
  var mx = 0; for (var k2 in same) mx = Math.max(mx, same[k2]); if (mx > maxSame) maxSame = mx; if (i >= fr.length - 24 && mx > maxSameTail) maxSameTail = mx; // last ~2s at 12fps: post-expansion steady state - contact vs locking discriminator
  viol += v; if (v) violFrames++;
}
var wt = {};
for (var i9 = Math.max(0, fr.length - 24); i9 < fr.length; i9++) { var wb2 = fr[i9].wb || []; for (var wi2 = 0; wi2 < wb2.length; wi2++) { var e9 = wb2[wi2]; if (!wt[e9[0]]) wt[e9[0]] = { alive: 0, frames: 0, vxSum: 0, crowd: e9[4], hab: e9[5], energy: e9[6], x: e9[2] }; var w9 = wt[e9[0]]; w9.frames++; if (e9[1]) w9.alive = 1; w9.vxSum += Math.abs(e9[3]); } }
var wtIds = Object.keys(wt), liveLocked = 0, deadC = 0, moving = 0;
wtIds.forEach(function (id) { var w = wt[id]; if (!w.alive) deadC++; else if (w.vxSum / w.frames < 0.05) liveLocked++; else moving++; });
var wallTail = { unique: wtIds.length, dead: deadC, liveZeroVx: liveLocked, liveMoving: moving, sample: wtIds.slice(0, 8).map(function (id) { return { ti: +id, alive: wt[id].alive, frames: wt[id].frames, meanAbsVx: +(wt[id].vxSum / wt[id].frames).toFixed(3), crowd: wt[id].crowd, hab: wt[id].hab, energy: wt[id].energy, x: wt[id].x }; }) };
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
var deadRep = [], liveMinLoss = 0, contL = fr[fr.length - 1];
__ca2.getCells().forEach(function (q) { q.__seen = 1; });
for (var ti = 0; ti < __tn; ti++) { var L = __ls[ti]; if (!L) continue;
  var live = false; __ca2.getCells().forEach(function (q) { if (q.__ti === ti) live = true; });
  if (!live) { var atWall = contL ? (Math.min(Math.abs(L[0] - contL.x), Math.abs(L[0] - (contL.x + contL.w)), Math.abs(L[1] - contL.y), Math.abs(L[1] - (contL.y + contL.h))) < 6) : false;
    deadRep.push({ ti: ti, endRLoss: +(1 - L[2] / L[5]).toFixed(3), lastE: +L[3].toFixed(2), atWall: atWall, frAgo: fr.length - L[4] }); } }
__ca2.getCells().forEach(function (q) { if (q.__r0 !== undefined && q.__r0 > 1) liveMinLoss = Math.max(liveMinLoss, 1 - (q.__rmin || q.radius) / q.__r0); });
var ledgerLoss = 0, ledgerN = 0, ledgerGone = 0;
__ca2.getCells().forEach(function (q) { if (q.__r0 === undefined) return; ledgerN++; if (q.__r0 > 1) ledgerLoss = Math.max(ledgerLoss, 1 - q.radius / q.__r0); });
var lossByCell = []; __ca2.getCells().forEach(function (q) { if (q.__r0 !== undefined && q.__r0 > 1) { var d = 1 - q.radius / q.__r0; if (d > 0.001) lossByCell.push(+d.toFixed(3)); } });
lossByCell.sort(function (a, b) { return b - a; });
var shrinkRep = []; __ca2.getCells().forEach(function (q) { if (q.__r0 !== undefined && q.__r0 > 1) { var d = 1 - q.radius / q.__r0;
  var fi = q.__rdropf === undefined ? -1 : q.__rdropf - ${fr0}, dvD = -1, btD = -1;
  if (fi > 0 && fi < fr.length) { dvD = (fr[fi].dv || 0) - (fr[fi - 1].dv || 0); btD = (fr[fi].bt || 0) - (fr[fi - 1].bt || 0); }
  if (d > 0.001) shrinkRep.push({ ti: q.__ti, loss: +d.toFixed(4), maxDrop: +(q.__rmaxdrop || 0).toFixed(4), dropAtWall: !!q.__rdropwall, dropAtSep: !!q.__rdropsep, overCellR: q.__r0 > __ca2.P.CELL_RADIUS, divAtDrop: dvD, birthAtDrop: btD, r0: +q.__r0.toFixed(2), rEnd: +q.radius.toFixed(2) }); } });
shrinkRep.sort(function (a, b) { return b.loss - a.loss; }); // attribution: many tiny drops + overCellR = biological foodShrink; a large single drop at wall = constraint (main 25 Oct)
document.getElementById('panel').classList.remove('hov');
var transEnd = __ca2.trans, cellR = __ca2.P.CELL_RADIUS;
return JSON.stringify({ initFP: window.__initFP, frames: fr.length, transEnd: transEnd, cellR: +cellR.toFixed(2), maxDisp: +maxDisp.toFixed(2), maxSameCoord: maxSame, radiusLoss: +radiusLoss.toFixed(4),
  ledgerLoss: +ledgerLoss.toFixed(4), ledgerN: ledgerN, lossByCell: lossByCell.slice(0, 8), shrinkRep: shrinkRep.slice(0, 8), deaths: __ca2.deaths, deadRep: deadRep.slice(0, 12), liveMinLoss: +liveMinLoss.toFixed(4),
  sepJitter: sepJit, viol: viol, maxSameTail: maxSameTail, wallTail: wallTail, violFrames: violFrames, reactN: rr.length, reactFrameSd: +rfSd.toFixed(2), reactDirSpread: +dirSpread.toFixed(3) });})()`);
  const TREE = (process.argv[2] || '').includes('ca2base') ? 'base' : 'branch';
  console.log(JSON.stringify(Object.assign({ fps: FPS, sep: SEP, iso: ISO, tree: TREE, runs: 'independent-bounded (unmatched populations)', errs: c.errs.length }, JSON.parse(out === 'EV-TIMEOUT' ? '{}' : out))));
  c.close(); s.close(); process.exit(0);
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
