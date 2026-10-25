// t127: item 64 acceptance harness (owner 25 Oct architect block).
// Script: shrink the plate 50% in 300ms, hold 2s, expand back; separatorOn on/off; fps 12 and 60.
// Metrics per config: maxDisp, maxSameCoord, radiusLoss, sepJitter, violations/frame, reactionSpread.
// usage: node devtools/t127-item64-acceptance.js [harnessPath] [fps] [sep 0|1]
const H = require(process.argv[2] ? require('path').resolve(process.argv[2]) : require('path').join(__dirname, 'harness.js'));
const FPS = +(process.argv[3] || 12), SEP = +(process.argv[4] || 0);
(async () => {
  console.error('serving');const s = await H.serve(8913);console.error('launching');const c = await H.launch(8912, 'http://127.0.0.1:8913/index.html');console.error('launched');
  const wait = async (e, n) => { for (let i = 0; i < (n || 120); i++) { if (await c.ev(e)) return true; await c.sleep(250); } return false; };
  if (!await wait('window.__ca2 && __ca2.cells > 10')) { console.log('BOOT FAIL'); process.exit(1); } console.error('booted');
  console.error('trans wait'); await wait('!__ca2.trans', 60); console.error('trans done');
  await c.ev(`__ca2.setKey('fps', ${FPS}); __ca2.setKey('separatorOn', ${SEP});`);
  await c.sleep(800);
  // per-frame full-state recorder
  await c.ev(`window.__fr=[];(function rc(){var c=__ca2.cont,cs=__ca2.getCells(),a=[];
for(var i=0;i<cs.length;i++){var q=cs[i];if(q.alive)a.push([+q.x.toFixed(2),+q.y.toFixed(2),+q.vx.toFixed(3),+q.vy.toFixed(3),+q.radius.toFixed(2)]);}
__fr.push({x:c.x,w:c.w,y:c.y,h:c.h,a:a});requestAnimationFrame(rc);})()`);
  // in-page drag driver: shrink to 50% width over 300ms, hold 2s, expand back over 300ms
  await c.ev(`(function(){var cv=document.querySelector('canvas');
window.__fire=function(t,x,y){cv.dispatchEvent(new MouseEvent(t,{clientX:x,clientY:y,bubbles:true}));};})()`);
  const cx = await c.ev('__ca2.cont.x'), cw = await c.ev('__ca2.cont.w'), cy = await c.ev('__ca2.cont.y'), ch = await c.ev('__ca2.cont.h');
  const y = Math.round(cy + ch / 2), x0 = Math.round(cx + 2), half = Math.round(cw * 0.25); // 50% shrink => left wall moves right by w/4
  const fr0 = await c.ev('__fr.length');
  await c.ev(`(function(){__fire('mousedown',${x0},${y});
var steps=5,d=${half}/5,i=0;var iv=setInterval(function(){i++;if(i<=steps){__fire('mousemove',${x0}+Math.round(i*d),${y});}else{clearInterval(iv);
setTimeout(function(){var j=0;var iv2=setInterval(function(){j++;if(j<=steps){__fire('mousemove',${x0}+Math.round((5-j)*d),${y});}else{clearInterval(iv2);__fire('mouseup',${x0},${y});window.__done=1;}},60);}},2000);}},60);})()`);
  console.error('drag started'); await wait('window.__done', 40); console.error('drag done');
  await c.sleep(1200);
  console.error('fetching frames'); const fr = JSON.parse(await c.ev('JSON.stringify(__fr.slice(' + fr0 + '))')); console.error('frames', fr.length);
  // --- metrics ---
  const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
  let maxDisp = 0, maxSame = 0, viol = 0, violFrames = 0, reacts = [];
  const r0 = {}; fr[0].a.forEach(a => { r0[a[0] + ',' + a[1]] = a[4]; });
  for (let i = 0; i < fr.length; i++) {
    const f = fr[i], p = fr[Math.max(0, i - 1)], same = {};
    let v = 0;
    f.a.forEach(a => {
      const off = a[0] - f.x; if (off < 3) { const k = Math.round(off * 10) / 10; same[k] = (same[k] || 0) + 1; }
      if (a[0] < f.x - 0.01 || a[0] > f.x + f.w + 0.01 || a[1] < f.y - 0.01 || a[1] > f.y + f.h + 0.01) v++;
      if (i > 0) { const b = p.a[i < p.a.length ? i : 0]; }
    });
    if (i > 0) {
      // max displacement: match by index (cells keep order within a frame slice unless deaths; approximate by nearest)
      f.a.forEach(a => { let bd = 1e9; p.a.forEach(b => { const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < bd) bd = d; }); if (bd < 1e9 && bd > maxDisp && bd < 400) maxDisp = bd; });
    }
    const mx = Math.max(0, ...Object.values(same)); if (mx > maxSame) maxSame = mx;
    viol += v; if (v) violFrames++;
    // reaction: during shrink (first ~1s), cells within 40px of left wall - frame of first velocity response
    if (i > 0 && i < 40) f.a.forEach((a, j) => { const b = p.a[j]; if (!b) return; if (a[0] - f.x < 40) { const dv = Math.hypot(a[2] - b[2], a[3] - b[3]); if (dv > 0.5 && !reacts[j]) reacts[j] = { f: i, dir: Math.atan2(a[3], a[2]) }; } });
  }
  const rr = Object.values(reacts), rframes = rr.map(r => r.f);
  const rfMean = mean(rframes), rfSd = Math.sqrt(mean(rframes.map(v => (v - rfMean) * (v - rfMean))));
  // direction spread: mean resultant length (0 = fully spread directions, 1 = uniform)
  let sx = 0, sy = 0; rr.forEach(r => { sx += Math.cos(r.dir); sy += Math.sin(r.dir); });
  const dirSpread = rr.length ? 1 - Math.hypot(sx, sy) / rr.length : 0;
  // permanent radius loss: compare last frame radii vs first frame (nearest-match by position)
  let radiusLoss = 0;
  const last = fr[fr.length - 1];
  last.a.forEach(a => { let best = null, bd = 1e9; fr[0].a.forEach(b => { const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < bd) { bd = d; best = b; } }); if (best && best[4] > 1) radiusLoss = Math.max(radiusLoss, 1 - a[4] / best[4]); });
  // separator jitter: normal-velocity sign flips for cells near a separator segment (only when SEP=1)
  let sepJit = -1;
  if (SEP) {
    const segs = await c.ev('JSON.stringify((__ca2.axisInfo.segs||[]).slice(0,20))');
    const sg = JSON.parse(segs); let flips = 0, n = 0;
    for (let i = 2; i < fr.length; i++) fr[i].a.forEach((a, j) => {
      const b = fr[i - 1].a[j], b0 = fr[i - 2].a[j]; if (!b || !b0) return;
      for (const g of sg) { const ex = g[2] - g[0], ey = g[3] - g[1], el = Math.hypot(ex, ey); if (!el) continue;
        const nx = -ey / el, ny = ex / el, d = (a[0] - g[0]) * nx + (a[1] - g[1]) * ny;
        if (Math.abs(d) < 12) { const vn = a[2] * nx + a[3] * ny, vp = b[2] * nx + b[3] * ny, vq = b0[2] * nx + b0[3] * ny; n++; if (Math.sign(vn) !== Math.sign(vp) && Math.sign(vp) === Math.sign(vq) && Math.abs(vn) > 0.05) flips++; break; } }
    });
    sepJit = n ? +(flips / n).toFixed(4) : 0;
  }
  console.log(JSON.stringify({ fps: FPS, sep: SEP, frames: fr.length, maxDisp: +maxDisp.toFixed(2), maxSameCoord: maxSame,
    radiusLoss: +radiusLoss.toFixed(4), sepJitter: sepJit, viol: viol, violFrames: violFrames,
    reactN: rr.length, reactFrameSd: +rfSd.toFixed(2), reactDirSpread: +dirSpread.toFixed(3), errs: c.errs.length }));
  c.close(); s.close(); process.exit(0);
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
