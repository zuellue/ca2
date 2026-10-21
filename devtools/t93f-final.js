const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8817);const b=await H.launch(9557,'http://localhost:8817/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4500);
console.log(await b.ev(`(()=>{const C=__ca2,cs=C.getCells();
  ['eatMergeOn','symbiogenesisOn','symbiosisOn','parasiteOn','divideOn'].forEach(k=>C.setKey(k,0));
  cs.forEach(c=>c.alive=false);
  const mk=r=>{const c=cs.find(c=>!c.alive);c.alive=true;c.radius=r;c.x=C.cont.x+r+60;c.y=C.cont.y+C.cont.h/2;c.vx=-5;c.vy=0;c.energy=3;c.cl=0;c.sym=null;return c;};
  window.__probes=[30,100,200,400].map(r=>mk(r));
  window.__place=()=>{__probes.forEach(c=>{c.x=__ca2.cont.x+c.radius+60;c.y=__ca2.cont.y+__ca2.cont.h/2;c.vx=-5;c.vy=0;});};
  window.__s0=[];window.__z0=setInterval(()=>{if(__s0.length<40)__s0.push(__probes.map(c=>Math.round((c.x-c.radius-__ca2.cont.x)*10)/10));},100);
  return 'cont='+JSON.stringify({w:Math.round(C.cont.w),h:Math.round(C.cont.h)});})()`));
await b.sleep(5000);
console.log('gap=0  '+await b.ev(`(()=>{clearInterval(window.__z0);const mn=[0,1,2,3].map(i=>Math.min.apply(null,__s0.map(s=>s[i])));return JSON.stringify({n:__s0.length,radii:[30,100,200,400],minTrueEdge:mn});})()`));
console.log(await b.ev(`(()=>{__ca2.setKey('boundGap',30);window.__s1=[];__place();window.__z1=setInterval(()=>{if(__s1.length<40)__s1.push(__probes.map(c=>Math.round((c.x-c.radius-__ca2.cont.x)*10)/10));},100);return 'gap30';})()`));
await b.sleep(5000);
console.log('gap=30 '+await b.ev(`(()=>{clearInterval(window.__z1);const mn=[0,1,2,3].map(i=>Math.min.apply(null,__s1.map(s=>s[i])));return JSON.stringify({n:__s1.length,radii:[30,100,200,400],minTrueEdge:mn});})()`));
await b.shot('/tmp/owner-squeeze.png');
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
