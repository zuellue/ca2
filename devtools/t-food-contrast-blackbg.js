// t-food-contrast-blackbg: REGRESSION TEST for the user-reported bug "food invisible on black background".
// Card 20261024-370-ca. Metric + stable-population isolation identical to t-food-contrast-compare
// (evidence: devtools/evidence/food-contrast/RESULTS.md, s2-*.json stable-config pass):
// per-dot most-different-inner-pixel vs ring-median local background -> per-channel max delta (dm)
// + WCAG relative-luminance contrast ratio (cr). Isolation: ?nosim=1 JS food step, foodLife 0,
// foodLifeMs 3600000 (swarm life tick never fires), foodEatRate 0 (no grazing), autoRefresh false,
// deterministic post-mask foodDensity refill; live admin global preset blocked via host-resolver-rules.
// Assertions from the measured numbers (RESULTS.md 24 Oct stable-config pass):
//   bug config  #000000 on black: dm med 0,   cr med 1.000, 96-99% dots below thresholds (INVISIBLE)
//   fallback    #f0f0f0 on black: dm med 240, cr med 18.43, ~1% dots below thresholds (VISIBLE)
// Visible bar: dm.med >= 8 AND cr.med >= 1.2 AND below-threshold dot fraction <= 50%.
// Expected outcome while the bug is live: LIVE CONFIG -> FAIL (bug reproduced), FALLBACK -> PASS.
// Exit 0 only if every scenario is VISIBLE; exit 1 if any scenario fails; exit 3 if a scenario
// cannot produce a valid measurement after retries (boot stall - see RESULTS.md known limits).
// usage: node t-food-contrast-blackbg.js
const {serve,launch}=require('./harness.js');
const port=8700+((+process.env.PO||0)*10);
const BAR={dmMed:8,crMed:1.2,maxBelowFrac:0.5};
const STABLE={foodMode:3,foodShow:0.93,foodSize:1,foodLife:0,foodLifeMs:3600000,foodEatRate:0,foodDensity:0.02};
const SCEN=[
 {name:'live-config_blackfood-on-blackbg', foodColor:'#000000', expect:'FAIL (bug reproduced: shipped ink == bg)'},
 {name:'fallback_f0f0f0-on-blackbg',       foodColor:'#f0f0f0', expect:'PASS (measured visible pick, dm 240 / cr 18.43)'}
];
const MEAS=`
(function(){
 var U=window.__ca2,P=U.P,W=U.W,H=U.H,fl=U.getFood();
 var cs=document.querySelectorAll('canvas'),cv=null,big=0;
 for(var i=0;i<cs.length;i++){var c=cs[i];try{var x=c.getContext('2d');if(x&&c.width*c.height>big){big=c.width*c.height;cv=c}}catch(e){}}
 if(!cv)return JSON.stringify({err:'NOCANVAS'});
 var x=cv.getContext('2d'),d=x.getImageData(0,0,cv.width,cv.height).data;
 var sx=cv.width/W,sy=cv.height/H;
 function med(a){a=a.slice().sort(function(p,q){return p-q});return a[Math.floor(a.length/2)];}
 function lum(r,g,b){function f(c){c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)}return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)}
 var fs=P.foodSize,out=[],skipped=0;
 for(var i=0;i<fl.length;i++){var fd=fl[i];if(fd.r>=P.foodShow)continue;
  var fs2=fd.fed>0&&P.habitatFedShow>0?fs*(1+Math.min(3,fd.fed*P.habitatFedShow)):fs;
  var cx=fd.x*sx,cy=fd.y*sy,half=fs2*sx/2,ir=Math.max(1,half*0.6),r0=half+2,r1=half+5;
  if(cx-r1<0||cy-r1<0||cx+r1>=cv.width||cy+r1>=cv.height){skipped++;continue}
  var ro=[],go=[],bo=[],inner=[];
  for(var dy=-Math.ceil(r1);dy<=Math.ceil(r1);dy++)for(var dx=-Math.ceil(r1);dx<=Math.ceil(r1);dx++){
   var ch=Math.max(Math.abs(dx),Math.abs(dy)),q=(Math.round(cy+dy)*cv.width+Math.round(cx+dx))*4;
   if(ch<=ir){inner.push(q)}else if(ch>=r0&&ch<=r1){ro.push(d[q]);go.push(d[q+1]);bo.push(d[q+2])}}
  if(!ro.length||!inner.length){skipped++;continue}
  var or2=[med(ro),med(go),med(bo)];
  var best=null,dm=-1;
  for(var k=0;k<inner.length;k++){var q2=inner[k],dd=Math.max(Math.abs(d[q2]-or2[0]),Math.abs(d[q2+1]-or2[1]),Math.abs(d[q2+2]-or2[2]));if(dd>dm){dm=dd;best=[d[q2],d[q2+1],d[q2+2]]}}
  var li=lum(best[0],best[1],best[2]),lo=lum(or2[0],or2[1],or2[2]);
  var ratio=li>lo?(li+0.05)/(lo+0.05):(lo+0.05)/(li+0.05);
  out.push({x:+fd.x.toFixed(1),y:+fd.y.toFixed(1),dm:dm,cr:+ratio.toFixed(3)})}
 function st(k){var v=out.map(function(o){return o[k]}).sort(function(a,b){return a-b});if(!v.length)return null;
  function pct(p){return v[Math.min(v.length-1,Math.floor(v.length*p))]}
  return {min:v[0],p25:pct(0.25),med:pct(0.5),p75:pct(0.75),max:v[v.length-1]}}
 return JSON.stringify({n:out.length,skipped:skipped,foodTotal:fl.length,
  dm:st('dm'),cr:st('cr'),
  belowDm8:out.filter(function(o){return o.dm<8}).length,
  belowCr12:out.filter(function(o){return o.cr<1.2}).length,
  canvas:[cv.width,cv.height],WH:[W,H],foodColor:P.foodColor,foodSize:fs});
})()`;
async function run1(srv,sc){
 const Pov=Object.assign({foodColor:sc.foodColor},STABLE);
 for(let att=1;att<=3;att++){
  let h=null;
  try{
   h=await launch(port+1,'http://127.0.0.1:'+port+'/index.html?nosim=1',['--host-resolver-rules=MAP ca2-presets.middots.workers.dev 127.0.0.1']); // block live global preset; nosim: JS food step so the seeded foodLifeMs gate applies
   const seed={v:6,P:Object.assign({grain:0,pixelRatio:1,autoQuality:0},Pov),bgTarget:[0,0,0],bgIndex:0,autoRefresh:false};
   await h.send('Page.addScriptToEvaluateOnNewDocument',{source:"try{localStorage.removeItem('ca2.global');localStorage.setItem('ca2.config',"+JSON.stringify(JSON.stringify(seed))+");localStorage.setItem('ca2.config.m',"+JSON.stringify(JSON.stringify(seed))+")}catch(e){} // both stores: headless can boot in mobile store mode"});
   await h.send('Page.reload');await h.sleep(1500);
   let up=false;
   for(let i=0;i<45&&!up;i++){up=await h.ev('!!window.__ca2');if(!up)await h.sleep(1000);}
   if(!up){console.log(JSON.stringify({scenario:sc.name,status:'INVALID',why:'boot timeout (no __ca2 in 45s)',attempt:att}));continue;}
   await h.sleep(10000); // intro + spawn settle (bg seeded directly at load)
   await h.ev('window.__ca2.setKey("foodDensity",window.__ca2.P.foodDensity)'); // deterministic post-mask refill to the density target (boot refill runs pre-mask and yields ~0 dots)
   await h.sleep(800);
   const frames=[];
   for(let f=0;f<6;f++){if(f)await h.sleep(600);const r=await h.ev(MEAS);const fr=JSON.parse(r);if(fr.err){console.log(JSON.stringify({scenario:sc.name,status:'INVALID',why:fr.err,attempt:att}));fr=null;if(fr===null)break;}frames.push(fr);}
   if(!frames.length)continue;
   const best=frames.slice().sort((a,b)=>b.n-a.n)[0]; // highest-n frame, same reporting rule as the compare pass
   if(!best||best.n<100){console.log(JSON.stringify({scenario:sc.name,status:'INVALID',why:'food population too low to assert (n='+(best?best.n:0)+')',attempt:att}));continue;}
   return {scenario:sc.name,seed:{P:Pov,bgTarget:[0,0,0],grain:0},frame:best,pageErrs:h.errs.length};
  }finally{try{h&&h.close()}catch(e){}}
 }
 return {scenario:sc.name,status:'INVALID',why:'no valid measurement after 3 attempts'};
}
function judge(r){
 if(r.status==='INVALID')return {verdict:'INVALID',why:r.why};
 const f=r.frame,belowFrac=Math.max(f.belowDm8,f.belowCr12)/f.n;
 const fails=[];
 if(!(f.dm.med>=BAR.dmMed))fails.push('dm.med '+f.dm.med+' < '+BAR.dmMed);
 if(!(f.cr.med>=BAR.crMed))fails.push('cr.med '+f.cr.med+' < '+BAR.crMed);
 if(!(belowFrac<=BAR.maxBelowFrac))fails.push('below-threshold dots '+(belowFrac*100).toFixed(0)+'% > '+(BAR.maxBelowFrac*100)+'%');
 return {verdict:fails.length?'FAIL':'PASS',fails:fails,
  measured:{n:f.n,dmMed:f.dm.med,crMed:f.cr.med,belowDm8Pct:+(100*f.belowDm8/f.n).toFixed(1),belowCr12Pct:+(100*f.belowCr12/f.n).toFixed(1)}};
}
(async()=>{
 const srv=await serve(port);
 let anyFail=false,anyInvalid=false;
 try{
  for(const sc of SCEN){
   const r=await run1(srv,sc);
   const j=judge(r);
   if(j.verdict==='FAIL')anyFail=true;
   if(j.verdict==='INVALID')anyInvalid=true;
   console.log(JSON.stringify({test:'food-contrast-blackbg',scenario:sc.name,expected:sc.expect,
    verdict:j.verdict,why:j.why,assertionFails:j.fails,measured:j.measured,
    bar:{dmMedMin:BAR.dmMed,crMedMin:BAR.crMed,maxBelowThresholdFrac:BAR.maxBelowFrac}}));
  }
 }finally{srv.close();}
 if(anyInvalid)process.exit(3);
 process.exit(anyFail?1:0);
})();
