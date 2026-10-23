// LABEL: FAILURE HARNESS / NOT A PASSING TEST. The virtual-clock A/B hung after warm-up (also on the baseline), so it produced no result. Kept as failure evidence only. See FOOD-TESTS-README.md.
// Controlled A/B on a virtual clock. Same seed + same virtual frame timing for both builds; they differ only where the code differs
// (food spawns/motion on ink, so RNG draws diverge: compare means over seeds, effect not identity).
// node devtools/t-ab-virtual.js <seed> <port> [warmFrames] [measureFrames]
const H=require('./harness.js'),D=require('./dbg-inject.js');
const seed=+(process.argv[2]||1),port=+(process.argv[3]||8900),warm=+(process.argv[4]||600),meas=+(process.argv[5]||1800);
const inj=`(function(){var s=${seed}*2654435761>>>0;Math.random=function(){s=(s*1664525+1013904223)>>>0;return s/4294967296};
var q=[],vt=0,rn=performance.now.bind(performance);var k=0;performance.now=function(){return vt+(k++)*0.002};
window.requestAnimationFrame=function(cb){q.push(cb);return q.length};window.cancelAnimationFrame=function(){};
window.__step=function(n){var t0=rn();for(var i=0;i<n;i++){vt+=1000/60;k=0;var c=q;q=[];for(var j=0;j<c.length;j++)c[j](vt);}return rn()-t0;};})()`;
(async()=>{const srv=await D.serve(port),b=await H.launch(port+1,'http://127.0.0.1:'+port+'/index.html?simab=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false});
 await b.send('Page.addScriptToEvaluateOnNewDocument',{source:inj});
 await b.send('Page.reload');
 await b.sleep(8000); // wasm/font load on real time; rAF is held until stepped
 console.log('loaded');const w0=await b.ev(`window.__step(${warm})`);console.log('warm ms',w0);
 const rows=[];let cost=0;
 const chunk=300;
 for(let i=0;i<meas/chunk;i++){
  for(let z=0;z<chunk;z+=20){const t=await Promise.race([b.ev('window.__step(20)'),new Promise(r=>setTimeout(()=>r('HANG'),20000))]);if(t==='HANG'){console.log('HANG at chunk',i,'z',z);process.exit(2);}cost+=+t;}
  rows.push(JSON.parse(await b.ev(`JSON.stringify((function(){var cs=__ca2.cellList.filter(function(c){return c.alive});var e=0;cs.forEach(function(c){e+=c.energy});var o=0;__ca2.foodList.forEach(function(f){if(__ca2.sepDiskHit(f.x,f.y,Math.max(0.5,__ca2.P.foodSize/2)))o++});return {food:__ca2.foodList.length,onInk:o,cells:cs.length,meanE:cs.length?+(e/cs.length).toFixed(2):0,par:__ca2.parasiteList.length}})())`)));
 }
 const avg=k=>(rows.reduce((a,r)=>a+r[k],0)/rows.length).toFixed(2);
 console.log(JSON.stringify({seed,warm,meas,msPerFrame:+(cost/meas).toFixed(2),food:avg('food'),onInk:avg('onInk'),cells:avg('cells'),meanE:avg('meanE'),par:avg('par'),rows:rows.map(r=>r.food+'/'+r.onInk+'/'+r.cells+'/'+r.meanE)}));
 }finally{b.close();srv.close();process.exit(0);}})();
