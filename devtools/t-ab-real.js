// LABEL: real-time seeded A/B (3 seeds, 760x460, FPS about 3 in a CPU-starved sandbox). Shows effect only: not snapshot parity, no valid cost number. See FOOD-TESTS-README.md.
// Real-time A/B: seeded Math.random, default params, sampled every 4 s for 40 s after load; also frames/s from an rAF counter.
// node devtools/t-ab-real.js <seed> <port>   (run once per tree; compare means over seeds. Layout/timing are NOT identical between builds.)
const H=require('./harness.js'),D=require('./dbg-inject.js');
const seed=+(process.argv[2]||1),port=+(process.argv[3]||8900);
const inj=`(function(){var s=${seed}*2654435761>>>0;Math.random=function(){s=(s*1664525+1013904223)>>>0;return s/4294967296};window.__fr=0;var r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=function(cb){return r(function(t){window.__fr++;cb(t)})};})()`;
(async()=>{const srv=await D.serve(port),b=await H.launch(port+1,'http://127.0.0.1:'+port+'/index.html?simab=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false});
 await b.send('Page.addScriptToEvaluateOnNewDocument',{source:inj});await b.send('Page.reload');
 await b.sleep(8000);
 const rows=[];let f0=+await b.ev('window.__fr'),t0=Date.now();
 for(let i=0;i<10;i++){await b.sleep(4000);
  rows.push(JSON.parse(await b.ev(`JSON.stringify((function(){var cs=__ca2.cellList.filter(function(c){return c.alive});var e=0;cs.forEach(function(c){e+=c.energy});var o=0;__ca2.foodList.forEach(function(f){if(__ca2.sepDiskHit(f.x,f.y,Math.max(0.5,__ca2.P.foodSize/2)))o++});return {food:__ca2.foodList.length,onInk:o,cells:cs.length,meanE:cs.length?+(e/cs.length).toFixed(2):0,par:__ca2.parasiteList.length}})())`)));}
 const fps=((+await b.ev('window.__fr')-f0)/((Date.now()-t0)/1000)).toFixed(1);
 const avg=k=>+(rows.reduce((a,r)=>a+r[k],0)/rows.length).toFixed(2);
 console.log(JSON.stringify({seed,fps,food:avg('food'),onInk:avg('onInk'),cells:avg('cells'),meanE:avg('meanE'),par:avg('par')}));
 }finally{b.close();srv.close();process.exit(0);}})();
