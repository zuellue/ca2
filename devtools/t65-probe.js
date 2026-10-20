// boundary probe: drive one cell straight at the wall with zone=0; record its closest edge approach and resting distance.
const H=require('./harness.js');
(async()=>{const s=await H.serve(8777);const b=await H.launch(9519,'http://localhost:8777/index.html?nosim=1',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.ev("__ca2.P.resolution=0.35;__ca2.P.autoQuality=0;__ca2.P.grain=0;__ca2.setGPU(false);__ca2.P.minRefreshInterval=99999;__ca2.P.maxRefreshInterval=99999;__ca2.P.cellMorph=0;__ca2.P.boundZone=0;__ca2.P.parasiteOn=0;'ok'");
// wait for a steady plate
for(let i=0;i<40;i++){await b.sleep(400);if(await b.ev("!__ca2.trans && Math.abs(__ca2.cont.ew-__ca2.cont.tw)<1"))break;}
await b.sleep(2000);
const out=await b.ev(`(function(){var c=__ca2.cont,cs=__ca2.getCells().filter(function(k){return k.alive});
cs=cs.filter(function(k){return k.radius<__ca2.P.CELL_RADIUS*1.5&&k.maxSpeed>1});var k=cs.slice().sort(function(a,b2){return b2.maxSpeed-a.maxSpeed})[0],r=Math.min(k.radius,Math.min(c.w,c.h)*0.45);
var ms=k.maxSpeed;k.x=c.x+r+30;k.y=c.y+c.h/2;k.vx=-Math.max(1.5,ms);k.vy=0;
var t0=performance.now(),mn=1e9,trace=[];
return new Promise(function(res){(function tick(){var g=(k.x-c.x)-Math.min(k.radius,Math.min(c.w,c.h)*0.45);mn=Math.min(mn,g);
if(trace.length<400)trace.push(+g.toFixed(1));
if(performance.now()-t0<5000&&k.alive)requestAnimationFrame(tick);else res(JSON.stringify({minGap:+mn.toFixed(1),last5:trace.slice(-5),maxSpeed:+ms.toFixed(2),radius:Math.round(k.radius),alive:k.alive}))})()})})()`);
console.log(out);console.log('errs',b.errs.slice(0,2));b.close();s.close();process.exit(0)})();
