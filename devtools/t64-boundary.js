// boundary zone=0: in-page rAF sampling of cell edge gap to the plate wall.
const H=require('./harness.js');
(async()=>{const s=await H.serve(8776);const b=await H.launch(9518,'http://localhost:8776/index.html?nosim=1',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4000);
await b.ev("__ca2.P.resolution=0.35;__ca2.P.autoQuality=0;__ca2.P.grain=0;__ca2.setGPU(false);__ca2.P.boundZone=0;__ca2.P.minRefreshInterval=9999;__ca2.P.maxRefreshInterval=9999;'ok'");
const r=await b.ev(`(function(){var t0=performance.now(),mn=1e9,p10s=[],touch=0,frames=0;
return new Promise(function(res){(function tick(){frames++;var c=__ca2.cont,cs=__ca2.getCells(),gs=[];
for(var i=0;i<cs.length;i++){var k=cs[i];if(!k.alive)continue;var r2=Math.min(k.radius,Math.min(c.w,c.h)*0.45);
var g=Math.min(k.x-c.x,c.x+c.w-k.x,k.y-c.y,c.y+c.h-k.y)-r2;gs.push(g);}
gs.sort(function(a,b2){return a-b2});if(gs.length){mn=Math.min(mn,gs[0]);p10s.push(gs[Math.floor(gs.length*0.1)]);if(gs[0]<2)touch++;}
if(performance.now()-t0<12000)requestAnimationFrame(tick);else{p10s.sort(function(a,b2){return a-b2});
res(JSON.stringify({minGap:+mn.toFixed(1),p10med:+p10s[Math.floor(p10s.length/2)].toFixed(1),touchFrames:touch,frames:frames,cells:gs.length,cr:+__ca2.P.CELL_RADIUS.toFixed(0),pw:Math.round(c.w)}))}})()})})()`);
console.log(r);console.log('errs',b.errs.slice(0,2));b.close();s.close();process.exit(0)})();
