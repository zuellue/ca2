// t-food-contrast-compare: food-dot contrast vs live background, measured AT THE DOT POSITIONS.
// Replaces the earlier whole-canvas light/dark pixel count (t-food-ink-verify 3b6fc54), which
// counted UI text, cells and grain as "food visibility" - a 232 light-px number over the full
// canvas says nothing about whether a food dot is distinguishable from its background.
// Metric here: for every live food dot (positions from __ca2.getFood()), median colour inside
// the dot vs median colour of a ring just outside it -> per-channel max delta + WCAG relative
// luminance contrast ratio. One scenario per process (driver loops + retries on INVALID).
// usage: node t-food-contrast-compare.js <name> '<P-overrides json>' '<bgTarget json>' <grain 0|1>
const {serve,launch}=require('./harness.js');
const name=process.argv[2]||'default';
const Pov=JSON.parse(process.argv[3]||'{}');
const bgT=JSON.parse(process.argv[4]||'[233,233,233]');
const grain=+(process.argv[5]||0);
const port=8700+((+process.env.PO||0)*10);
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
  var or2=[med(ro),med(go),med(bo)]; // local background = ring median (robust to cells/grain at the edge)
  var best=null,dm=-1; // dot pixel = inner pixel most different from the local bg (a 1px dot is 1 of ~4 inner pixels; a median would erase it)
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
  worst:out.slice().sort(function(a,b){return a.cr-b.cr}).slice(0,5),
  canvas:[cv.width,cv.height],WH:[W,H],foodColor:P.foodColor,foodSize:fs});
})()`;
(async()=>{
 const srv=await serve(port);
 let h=null,tag='';
 try{
  h=await launch(port+1,'http://127.0.0.1:'+port+'/index.html?nosim=1',['--host-resolver-rules=MAP ca2-presets.middots.workers.dev 127.0.0.1']); // nosim: force the JS food step so the seeded foodLifeMs gate applies (the wasm swarm runs its own life cadence); block the live global preset (async applyG overrides seeded P)
  const seed={v:6,P:Object.assign({grain:grain?1.22:0,pixelRatio:1,autoQuality:0},Pov),bgTarget:bgT,bgIndex:0,autoRefresh:false}; // re-roll off: population is refilled deterministically below instead
  await h.send('Page.addScriptToEvaluateOnNewDocument',{source:"try{localStorage.removeItem('ca2.global');localStorage.setItem('ca2.config',"+JSON.stringify(JSON.stringify(seed))+");localStorage.setItem('ca2.config.m',"+JSON.stringify(JSON.stringify(seed))+")}catch(e){} // both stores: headless can boot in mobile store mode (pointer:coarse)"});
  await h.send('Page.reload');await h.sleep(1500);
  let up=false;
  for(let i=0;i<45&&!up;i++){up=await h.ev('!!window.__ca2');if(!up)await h.sleep(1000);}
  if(!up){console.log(JSON.stringify({scenario:name,status:'INVALID',why:'boot timeout (no __ca2 in 45s)'}));process.exit(3);}
  await h.sleep(10000); // intro + spawn settle (bg is seeded directly: bg=bgTarget at load)
  await h.ev('window.__ca2.setKey("foodDensity",window.__ca2.P.foodDensity)'); // deterministic full refill: applyKey('foodDensity') tops food up to the density target NOW that the ink mask is ready (the boot refill runs before it and yields ~0 dots). Eating stays live; sampling finishes before grazing matters.
  await h.sleep(800);

  const intro=await h.ev('window.__ca2.INTRO');
  const frames=[];
  // 6 frames over 3s: the accelerated re-roll (1-2s) guarantees a just-refilled full-population frame; the boot refill runs before the ink mask exists and yields ~0 dots
  for(let f=0;f<6;f++){if(f)await h.sleep(600);const r=await h.ev(MEAS);frames.push(JSON.parse(r));}
   
  const bgInfo=await h.ev('JSON.stringify({errs:window.__ca2?0:1})');
  const shot=require('path').join(__dirname,'evidence','food-contrast',name+'.png');await h.shot(shot);
  console.log(JSON.stringify({scenario:name,status:'OK',seed:{P:Pov,bgTarget:bgT,grain:grain},introMs:intro,frames:frames,pageErrs:h.errs.length,shot:shot}));
 }finally{try{h&&h.close()}catch(e){}srv.close();}
 process.exit(0);
})();
