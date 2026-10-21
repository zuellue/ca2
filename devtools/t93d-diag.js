const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8816);const b=await H.launch(9556,'http://localhost:8816/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4000);
console.log(await b.ev(`(()=>{const C=__ca2,cs=C.getCells();
  ['eatMergeOn','symbiogenesisOn','symbiosisOn','parasiteOn','divideOn'].forEach(k=>C.setKey(k,0));
  C.setKey('boundGap',30);
  cs.forEach(c=>c.alive=false);
  const c=cs.find(c=>!c.alive);c.alive=true;c.radius=200;c.x=C.cont.x+240;c.y=C.cont.y+C.cont.h/2;c.vx=-4;c.vy=0;c.energy=3;c.cl=0;c.sym=null;
  window.__p=c;window.__s=[];
  window.__zi=setInterval(()=>{const t=__ca2.cont;__s.push([Math.round(c.x-c.radius-t.x),Math.round(t.w),Math.round(t.h),Math.round(c.x-t.x),c.alive?1:0]);if(__s.length>50)clearInterval(__zi);},80);
  return 'diag';})()`));
await b.sleep(5000);
console.log(await b.ev(`(()=>{clearInterval(window.__zi);return JSON.stringify({samples:__s.slice(0,50),gap:__ca2.P.boundGap});})()`));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
