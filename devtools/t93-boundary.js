const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8813);const b=await H.launch(9553,'http://localhost:8813/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4000);
console.log(await b.ev(`(()=>{const C=__ca2,P=C.P,cont=C.cont,cs=C.getCells();
  ['eatMergeOn','symbiogenesisOn','symbiosisOn','parasiteOn','divideOn'].forEach(k=>C.setKey(k,0));
  cs.forEach(c=>c.alive=false);
  const mk=r=>{const c=cs.find(c=>!c.alive);c.alive=true;c.radius=r;c.x=cont.x+r+40;c.y=cont.y+cont.h/2;c.vx=-4;c.vy=0;c.energy=3;c.cl=0;c.sym=null;return c;};
  window.__probes=[30,100,200,400].map(r=>mk(r));
  window.__samp=[];window.__zi=setInterval(()=>{__samp.push(__probes.map(c=>Math.round((c.x-c.radius-cont.x)*10)/10));if(__samp.length>60)clearInterval(__zi);},50);
  return 'bnd genes='+cs.filter(c=>c.alive).map(c=>c.g.bnd.toFixed(2)).join(',')+' boundZone='+P.boundZone+' genomeOn='+P.genomeOn+' cont='+JSON.stringify({x:cont.x,y:cont.y,w:cont.w,h:cont.h});
})()`));
await b.sleep(4500);
console.log(await b.ev(`(()=>{clearInterval(window.__zi);
  const mn=[0,1,2,3].map(i=>Math.min.apply(null,__samp.map(s=>s[i])));
  const zEff=__ca2.getCells().filter(c=>c.alive).map(c=>Math.round(__ca2.P.boundZone*c.g.bnd));
  return JSON.stringify({radii:[30,100,200,400],minEdgeToLeftWall:mn,cap045:Math.round(Math.min(__ca2.cont.w,__ca2.cont.h)*0.45),zoneSet:__ca2.P.boundZone,zoneEffectivePerCell:zEff});})()`));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
