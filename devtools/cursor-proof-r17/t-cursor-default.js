// DEFAULT-WORLD cursor diagnostic (bounded). Intentional differences from shipped: setGPU(0) (CPU metaballs), preset host blocked (Network.setBlockedURLs), dsf 1.
// Population/P/snapshot untouched. Per run: control window (no mouse event) then treatment window (mouse parked at X), same X, cells within R of X at window start tracked.
// Metric: mean distance to X of that cell set (cells that die are dropped and counted), parasites 'bel'/'cool' counts. One boot per call.
const H=require('./harness.js'),D=require('./dbg-inject.js');
const port=+process.argv[2]||9760,WIN=+process.argv[3]||6000;const T0=Date.now();
const log=(...a)=>console.log(((Date.now()-T0)/1000).toFixed(1)+'s',...a);
(async()=>{const srv=await D.serve(port),b=await H.launch(port+1,'http://127.0.0.1:'+port+'/index.html?simab=1',[]);
try{
 await b.send('Network.enable');await b.send('Network.setBlockedURLs',{urls:['*ca2-presets.middots.workers.dev*']});
 await b.send('Emulation.setDeviceMetricsOverride',{width:1000,height:640,deviceScaleFactor:1,mobile:false});
 await b.send('Page.reload');await b.sleep(6000);
 await b.ev('__ca2.setGPU(0);0');await b.sleep(3000);
 const info=await b.ev(`JSON.stringify({n:__ca2.cellList.filter(c=>c.alive).length,R:__ca2.P.cursorFleeR,on:__ca2.P.cursorFleeOn,push:__ca2.P.cursorFleePush,par:__ca2.parasiteList.length,wc:window.WC?{sim:WC.simOff,post:WC.postOff}:null,hab:__ca2.P.habitatOn})`);log('boot',info);
 const pick=await b.ev(`(function(){var cs=__ca2.cellList.filter(c=>c.alive),R=__ca2.P.cursorFleeR,best=null,bn=-1;cs.forEach(function(c){var k=0;cs.forEach(function(q){if(Math.hypot(q.x-c.x,q.y-c.y)<R)k++});if(k>bn){bn=k;best=c}});window.__X=[best.x,best.y];return JSON.stringify({x:best.x,y:best.y,inR:bn})})()`);log('X',pick);
 const track=async(label)=>{await b.ev(`(function(){var X=window.__X,R=__ca2.P.cursorFleeR;window.__set=__ca2.cellList.filter(c=>c.alive&&Math.hypot(c.x-X[0],c.y-X[1])<R);window.__d0=window.__set.map(c=>Math.hypot(c.x-X[0],c.y-X[1]));return 1})()`);
  const s=[];const t=Date.now();while(Date.now()-t<WIN){await b.sleep(1000);s.push(JSON.parse(await b.ev(`(function(){var X=window.__X,a=window.__set.filter(c=>c.alive),d=a.map(c=>Math.hypot(c.x-X[0],c.y-X[1]));var m=d.reduce((p,q)=>p+q,0)/Math.max(1,d.length),m0=0;var i0=window.__set.map((c,i)=>c.alive?window.__d0[i]:null).filter(v=>v!==null);m0=i0.reduce((p,q)=>p+q,0)/Math.max(1,i0.length);var bel=0,cool=0,hostless=0;__ca2.parasiteList.forEach(function(p){if(p.a<=-2e9)cool++;else if(p.a<=-1e9)bel++});return JSON.stringify({alive:a.length,of:window.__set.length,m:+m.toFixed(2),m0:+m0.toFixed(2),bel:bel,cool:cool,np:__ca2.parasiteList.length,cells:__ca2.cellList.length})})()`)))}
  const L=s[s.length-1];log(label,'drift(mean dist now - at start, same survivors)=',(L.m-L.m0).toFixed(2),'alive',L.alive+'/'+L.of,'bel/cool',s.map(r=>r.bel+'/'+r.cool).join(','),'cells',s.map(r=>r.cells).join(','));return L;};
 const A=await track('CONTROL');
 await b.shot('/tmp/tcd-ctrl.png');
 await b.ev(`(function(){var X=window.__X;document.querySelector('canvas').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:X[0],clientY:X[1]}));return 1})()`);await b.sleep(200);
 const T=await track('TREAT');
 await b.shot('/tmp/tcd-treat.png');
 log('RESULT',JSON.stringify({ctrlDrift:+(A.m-A.m0).toFixed(2),treatDrift:+(T.m-T.m0).toFixed(2),errs:b.errs.length}));
}catch(e){log('ERR',e.message)}
b.close();srv.close();process.exit(0)})();
