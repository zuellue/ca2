// t126: organic-wall metrics (owner 25 Oct analysis) - scripted squeeze drag, per-frame recorder.
// usage: node devtools/t126-organic-walls.js [harnessPath]
const H = require(process.argv[2] ? require('path').resolve(process.argv[2]) : require('path').join(__dirname, 'harness.js'));
// usage: node devtools/t126-organic-walls.js [harnessDir] [seconds]
(async () => {
  const s = await H.serve(8913), c = await H.launch(8912, 'http://127.0.0.1:8913/index.html');
  const wait = async (e, n) => { for (let i = 0; i < (n || 80); i++) { if (await c.ev(e)) return true; await c.sleep(250); } return false; };
  if (!await wait('window.__ca2 && __ca2.cells > 10')) { console.log('BOOT FAIL'); process.exit(1); }
  await c.sleep(2000);
  console.log('boot: cells=' + await c.ev('__ca2.cells') + ' trans=' + await c.ev('__ca2.trans') + ' w=' + await c.ev('__ca2.W'));
  // per-frame recorder: wall left edge, width, edge velocity, near-wall cell count + mean offset + mean |vx|
  await c.ev(`window.__rec=[];(function rc(){var c=__ca2.cont,cs=__ca2.getCells(),n=0,sx=0,sv=0;
for(var i=0;i<cs.length;i++){if(!cs[i].alive)continue;var d=cs[i].x-c.x;if(d<6){n++;sx+=d;sv+=Math.abs(cs[i].vx);}}
__rec.push([c.x,c.w,c.wvx0===undefined?null:c.wvx0,n,n?+(sx/n).toFixed(3):-1,n?+(sv/n).toFixed(3):-1]);requestAnimationFrame(rc);})()`);
  console.log('recorder in'); const rec0 = await c.ev('__rec.length');
  await c.ev(`(function(){var cv=document.querySelector('canvas');
window.__fire=function(t,x,y){cv.dispatchEvent(new MouseEvent(t,{clientX:x,clientY:y,bubbles:true}));};
window.__dragGo=function(x0,y,dx,steps){return new Promise(function(res){__fire('mousedown',x0,y);var i=0;
var iv=setInterval(function(){i++;if(i<=steps){__fire('mousemove',x0+i*dx,y);}else{clearInterval(iv);
setTimeout(function(){var j=steps+1;var iv2=setInterval(function(){j--;if(j>=0){__fire('mousemove',x0+j*dx,y);}else{clearInterval(iv2);__fire('mouseup',x0,y);res(1);}},60);}},400);}},90);});})()`);
  const cx = await c.ev('__ca2.cont.x'), cy = await c.ev('__ca2.cont.y'), ch = await c.ev('__ca2.cont.h');
  const y = Math.round(cy + ch / 2), x0 = Math.round(cx + 2);
  const dragP = c.ev('__dragGo(' + x0 + ',' + y + ',14,15)');
  await c.sleep(2200);
  const recSqueezeEnd = await c.ev('__rec.length');
  console.log('squeeze done');
  await dragP; console.log('drag done');
  await c.sleep(1200);
console.log('reading rec'); const rec = await c.ev('JSON.stringify(__rec.slice(' + rec0 + ',' + (recSqueezeEnd + 2) + '))');
  const rows = JSON.parse(rec);
  // metrics over the squeeze window
  let flips = 0, moves = 0, prev = null, carried = [], velR = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], wx = r[0];
    if (prev !== null) { const d = wx - prev; if (Math.abs(d) > 0.01) { moves++; if (i > 1 && Math.sign(d) !== 0 && Math.sign(rows[i - 1][0] - rows[i - 2][0]) !== 0 && Math.sign(d) !== Math.sign(rows[i - 1][0] - rows[i - 2][0])) flips++; } }
    prev = wx;
    if (r[3] > 0) { carried.push(r[4]); if (r[2] && Math.abs(r[2]) > 0.5 && r[5] >= 0) velR.push(r[5] / Math.abs(r[2])); }
  }
  const offs = carried.filter(o => o >= 0);
  const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : -1;
  const sd = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) * (v - m)))); };
  const oob = await c.ev('(function(){var c=__ca2.cont,n=0;__ca2.getCells().forEach(function(q){if(q.alive&&(q.x<c.x-0.5||q.x>c.x+c.w+0.5||q.y<c.y-0.5||q.y>c.y+c.h+0.5))n++});return n})()');
  console.log(JSON.stringify({
    frames: rows.length, wallMoves: moves, dirFlips: flips,
    nearWallFrames: offs.length, offsetMean: +mean(offs).toFixed(3), offsetSd: +sd(offs).toFixed(3),
    velRatioMean: +mean(velR).toFixed(3), oob: oob, errs: c.errs.length
  }));
  
  c.close(); s.close(); process.exit(0);
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
