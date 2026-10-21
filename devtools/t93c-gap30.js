const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8815);const b=await H.launch(9555,'http://localhost:8815/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4000);
console.log(await b.ev(`(()=>{const C=__ca2,cs=C.getCells();
  ['eatMergeOn','symbiogenesisOn','symbiosisOn','parasiteOn','divideOn'].forEach(k=>C.setKey(k,0));
  C.setKey('boundGap',30);
  cs.forEach(c=>c.alive=false);
  const mk=r=>{const c=cs.find(c=>!c.alive);c.alive=true;c.radius=r;c.x=C.cont.x+r+40;c.y=C.cont.y+C.cont.h/2;c.vx=-4;c.vy=0;c.energy=3;c.cl=0;c.sym=null;return c;};
  window.__probes=[30,100,200,400].map(r=>mk(r));
  window.__samp=[];window.__zi=setInterval(()=>{__samp.push(__probes.map(c=>Math.round((c.x-c.radius-__ca2.cont.x)*10)/10));if(__samp.length>60)clearInterval(__zi);},50);
  return 'gap30 run';})()`));
await b.sleep(4500);
console.log('gap=30 '+await b.ev(`(()=>{clearInterval(window.__zi);
  const mn=[0,1,2,3].map(i=>Math.min.apply(null,__samp.map(s=>s[i])));
  return JSON.stringify({radii:[30,100,200,400],minTrueEdgeToWall:mn,boundGap:__ca2.P.boundGap});})()`));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
