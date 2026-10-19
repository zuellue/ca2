const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9414,'http://localhost:8765/index.html#open',[]);await b.sleep(2500);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;a.P.grain=0;a.P.cellMorphMs=1500;})()");
await b.mouse(5,5);
async function run(on){
 await b.ev(`window.__ca2.P.respawnMorph=${on}`);
 await b.sleep(1500);
 const s0=JSON.parse(await b.ev("JSON.stringify(window.__ca2.getCells().map(function(c){return [c.x,c.y]}))"));
 const e0=JSON.parse(await b.ev("JSON.stringify([window.__ca2.births,window.__ca2.deaths,window.__ca2.getCells().length])"));
 await b.ev("(function(){var bs=document.querySelectorAll('button,.btn');for(var i=0;i<bs.length;i++)if(/^respawn$/i.test(bs[i].textContent.trim())){bs[i].click();return}})()");
 const out=[];let moved=0;
 for(let i=0;i<20;i++){await b.sleep(400);const r=JSON.parse(await b.ev("JSON.stringify({n:window.__ca2.getCells().length,t:window.__ca2.trans,b:window.__ca2.births,d:window.__ca2.deaths,tgt:window.__ca2.P.UNIVERSE_SIZE})"));out.push([r.n,r.t?1:0]);if(i==0)var first=r;var last=r;}
 const s1=JSON.parse(await b.ev("JSON.stringify(window.__ca2.getCells().map(function(c){return [c.x,c.y]}))"));
 // centroid/spread before/after
 const sp=a=>{const mx=a.reduce((p,c)=>p+c[0],0)/a.length,my=a.reduce((p,c)=>p+c[1],0)/a.length;return [Math.round(mx),Math.round(my),Math.round(Math.sqrt(a.reduce((p,c)=>p+(c[0]-mx)**2+(c[1]-my)**2,0)/a.length))]};
 return {on,before:{n:s0.length,cm:sp(s0)},after:{n:s1.length,cm:sp(s1)},births:last.b-e0[0],deaths:last.d-e0[1],traj:out.map(x=>x.join(':')).join(' ')};
}
const R=[await run(1),await run(1),await run(0)];
console.log(JSON.stringify(R,null,1));console.log('errs',b.errs);b.close();process.exit(0)})();
