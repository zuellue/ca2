// MATCHED within-run ABAB cursor diagnostic. Same world, same cells. Intentional diffs: setGPU(0), preset host blocked, births off (cellList.push neutered), selStrength 0, P.grain=0 (software-GL grain was the frame-time bottleneck: (program) 3985 of 4000 ms), no parasites touched.
// Metric: radial velocity (v . unit(cell-X)) of every cell currently within R of X, sampled every 100 ms; mean per window; windows alternate OFF/ON (mouse.over via real event).
const H=require('./harness.js'),D=require('./dbg-inject.js');
const PUSH=process.argv[5]?+process.argv[5]:null;const port=+process.argv[2]||9780,WIN=+process.argv[3]||3000,CYC=+process.argv[4]||4;const T0=Date.now();
const log=(...a)=>console.log(((Date.now()-T0)/1000).toFixed(1)+'s',...a);
(async()=>{const srv=await D.serve(port),b=await H.launch(port+1,'http://127.0.0.1:'+port+'/index.html?simab=1',[]);
try{
 await b.send('Network.enable');await b.send('Network.setBlockedURLs',{urls:['*ca2-presets.middots.workers.dev*']});
 await b.send('Emulation.setDeviceMetricsOverride',{width:1000,height:640,deviceScaleFactor:1,mobile:false});
 await b.send('Page.reload');await b.sleep(6000);
 await b.ev('__ca2.setGPU(0);__ca2.P.grain=0;0');await b.sleep(4000);for(let i=0;i<20&&+(await b.ev('__ca2.cellList.filter(c=>c.alive).length'))<20;i++)await b.sleep(1000);
 log('boot',await b.ev(`(function(){__ca2.P.selStrength=0;__ca2.P.grain=0;__ca2.cellList.push=function(){return __ca2.cellList.length};var cs=__ca2.cellList.filter(c=>c.alive),R=__ca2.P.cursorFleeR,best=null,bn=-1;cs.forEach(function(c){var k=0;cs.forEach(function(q){if(Math.hypot(q.x-c.x,q.y-c.y)<R)k++});if(k>bn){bn=k;best=c}});window.__X=[best.x,best.y];${PUSH!==null?'__ca2.P.cursorFleePush='+PUSH+';__ca2.P.cursorFleeWob=0;':''}window.__acc=[];window.__fix=function(){window.__ids=new Set();__ca2.cellList.forEach(function(c){if(c.alive&&Math.hypot(c.x-__X[0],c.y-__X[1])<__ca2.P.cursorFleeR)__ids.add(c)})};window.__col=function(){var X=__X,R=__ca2.P.cursorFleeR,s=0,n=0;__ca2.cellList.forEach(function(c){if(!c.alive||!window.__ids.has(c))return;var dx=c.x-X[0],dy=c.y-X[1],d=Math.hypot(dx,dy);if(d<R&&d>1){s+=(c.vx*dx+c.vy*dy)/d;n++}});return [s,n]};return JSON.stringify({n:cs.length,X:__X,inR:bn,R:R,push:__ca2.P.cursorFleePush})})()`));
 const res={OFF:[],ON:[]};
 for(let cyc=0;cyc<CYC;cyc++)for(const st of ['OFF','ON']){
  if(st==='ON')await b.ev(`document.querySelector('canvas').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:__X[0],clientY:__X[1]}));1`);
  else await b.ev(`document.dispatchEvent(new Event('mouseleave'));1`);
  await b.sleep(300);await b.ev('__fix();1');const cur=await b.ev(`(function(){var e=document.getElementById('cur');return e.style.display+'|'+e.style.transform})()`);log(st,'cur element readback',cur);
  let S=0,N=0,K=0;const tw=Date.now();while(Date.now()-tw<WIN){const r=JSON.parse(await b.ev('JSON.stringify(__col())'));S+=r[0];N+=r[1];K++;await b.sleep(80);}
  const r=[S,N,K];
  res[st].push(+(r[0]/Math.max(1,r[1])).toFixed(4));log(st,'meanRadialV',res[st][res[st].length-1],'cell-samples',r[1],'polls',r[2]);
 }
 const m=a=>a.reduce((p,q)=>p+q,0)/a.length;
 log('RESULT',JSON.stringify({OFF:res.OFF,ON:res.ON,meanOFF:+m(res.OFF).toFixed(4),meanON:+m(res.ON).toFixed(4),errs:b.errs.length}));
}catch(e){log('ERR',e.message)}
b.close();srv.close();process.exit(0)})();
