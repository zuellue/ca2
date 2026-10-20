// respawn morph: per-cell start delay, speed curve, curved path, arrival variance.
// rAF-driven in-page sampling through one morph; reports takeoff spread, path curvature, arrival spread.
const H=require('./harness.js');
(async()=>{const s=await H.serve(8765);const b=await H.launch(9507,'http://localhost:8765/index.html',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3500);
await b.ev("__ca2.P.minRefreshInterval=9999;__ca2.P.maxRefreshInterval=9999;__ca2.P.cellMorphMs=2500;'ok'");
await b.ev("window.__TR=__ca2.getCells().map(function(c){return {x0:c.x,y0:c.y,p:[],dst:null}});document.querySelectorAll('#btns button')[0].click();'ok'");
const smp=`(function(){var t0=performance.now(),TR=window.__TR;
return new Promise(function(res){(function tick(){var t=performance.now()-t0,cs=__ca2.getCells();
TR.forEach(function(tr,i){var c=cs[i];if(!c)return;tr.p.push([t,c.x,c.y]);if(!tr.dst&&c.dst)tr.dst=[c.dst[0],c.dst[1]];});
if(t<6500)requestAnimationFrame(tick);else res('done');})();})})()`;
await b.ev(smp);
const r=await b.ev(`(function(){var T=window.__TR.filter(function(t){return t.dst&&t.p.length>3}),take=[],curv=[],arr=[],resid=[],peak=[];
T.forEach(function(tr){var p=tr.p,moved=false,take0=0,plen=0,mx=0,mxi=0,tot=0;
 var dInit=Math.hypot(tr.dst[0]-tr.x0,tr.dst[1]-tr.y0);
 for(var i=1;i<p.length;i++){var dx=p[i][1]-p[i-1][1],dy=p[i][2]-p[i-1][2],st=Math.hypot(dx,dy);plen+=st;tot+=st;if(st>mx){mx=st;mxi=p[i][0];}if(!moved&&Math.hypot(p[i][1]-tr.dst[0],p[i][2]-tr.dst[1])<dInit-8){moved=true;take0=p[i][0];}}
 if(!moved)return;take.push(take0);var lastT=p[p.length-1][0]||1;peak.push(+(mxi/lastT).toFixed(2));var direct=Math.hypot(tr.dst[0]-tr.x0,tr.dst[1]-tr.y0)||1;curv.push(plen/direct);
 var ai=-1;for(var i2=0;i2<p.length;i2++)if(Math.hypot(p[i2][1]-tr.dst[0],p[i2][2]-tr.dst[1])<25){ai=p[i2][0];break;}
 if(ai>=0)arr.push(ai);var lp=p[p.length-1];resid.push(Math.hypot(lp[1]-tr.dst[0],lp[2]-tr.dst[1]));});
function sd(a){if(a.length<2)return 0;var m=a.reduce(function(x,y){return x+y})/a.length;return Math.sqrt(a.reduce(function(x,y){return x+(y-m)*(y-m)},0)/a.length)}
function mn(a){return a.length?a.reduce(function(x,y){return x+y})/a.length:0}
return JSON.stringify({tracked:T.length,takeoffMean:Math.round(mn(take)),takeoffSd:Math.round(sd(take)),pathLenOverDirect:+mn(curv).toFixed(3),arrived:arr.length,arrivalSd:Math.round(sd(arr)),residSd:Math.round(sd(resid)),speedPeakMean:+mn(peak).toFixed(2),morphActive:__ca2.trans})})()`);
console.log(r);console.log('errs',b.errs);b.close();s.close();process.exit(0)})();
