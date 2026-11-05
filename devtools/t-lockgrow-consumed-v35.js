// t-lockgrow v2 (writer-diagnosed flow): real-render test of owner 26 Oct cursor behavior - while auto-locked on a
// cell the ring eases from the configured size to slightly larger than that cell; when the lock passes it eases back.
// Single batched in-page setup; rAF recorder armed BEFORE pointer entry; REAL CDP pointer (target chosen outside the
// open panel's rect so the plate freeze never intercepts the pointer); natural lock expiry drives the return phase;
// one final read. TEST-ONLY in-memory world freeze (pinned target, others alive=false, reproduction off); no product change.
const {serve,launch}=require('./harness');
(async()=>{
 const T0=Date.now();function el(){return +((Date.now()-T0)/1000).toFixed(1)}
 const out={assertions:{},samples:null};const errs=[];
 function to(p,ms,label){return Promise.race([p,new Promise(function(_,rej){setTimeout(function(){rej(new Error('timeout:'+label))},ms)})]);}
 function bail(why){out.verdict='INCONCLUSIVE';out.errors=errs.concat([why]);console.log(JSON.stringify(out,null,1));process.exit(1);}
 const srv=await serve(18093);
 const h=await launch(18094,'http://127.0.0.1:18093/index.html?nowasm=1');
 console.error('T launched',el());
 for(let i=0;i<90;i++){const ok=await h.ev("!!(window.__ca2&&__ca2.getCells)").catch(function(){return false});if(ok===true)break;await h.sleep(300);if(i===89)bail('no __ca2');}
 console.error('T boot',el());
 // ONE batched setup ev: trim, freeze world, open panel (postpones plate re-deal, ca2.js:2467), kill all but the
 // median-radius cell in the NON-PANEL region, pin it, set cursor keys, arm the rAF recorder BEFORE pointer entry.
 let setup=null;
 for(let att=0;att<6;att++){
  setup=await to(h.ev(`(function(){
  __ca2.setKey('grain',0);__ca2.setKey('audioOn',0);__ca2.setKey('resolution',0.3);__ca2.setGPU(0);
  ['foodGrow','divideOn','eatMergeOn','symbiosisOn','symbiogenesisOn','parasiteOn','spawnProtect','cellMorph','respawnMorph','clusterCohesion'].forEach(function(k){__ca2.setKey(k,0)});
  __ca2.setKey('minRefreshInterval',99999);__ca2.setKey('maxRefreshInterval',99999);
  var pr=document.getElementById('panel').getBoundingClientRect(); // pre-open rect; open panel parks at the right edge (l=1300 on 1620w)
  var c=__ca2.cont,cs=__ca2.getCells(),arr=[];
  for(var i=0;i<cs.length;i++){var k=cs[i];if(!k.alive)continue;if(k.x<c.x+40||k.x>c.x+c.w-40||k.y<c.y+40||k.y>c.y+c.h-40)continue;
   if(k.x+k.radius*1.6>pr.left-8&&k.x-k.radius*1.6<pr.right+8&&k.y+k.radius*1.6>pr.top-8&&k.y-k.radius*1.6<pr.bottom+8)continue; // ring must not slide under the panel
   arr.push(k);}
  arr=arr.filter(function(k){return k.radius>=30&&k.radius<=110});
  arr.sort(function(p,q){return p.radius-q.radius});
  var best=arr[Math.floor(arr.length/2)];if(!best)return JSON.stringify({err:'no cell outside panel',panel:{l:pr.left,r:pr.right},cont:{x:c.x,y:c.y,w:c.w,h:c.h},alive:cs.filter(function(k){return k.alive}).length});
  for(var i=0;i<cs.length;i++){var k=cs[i];if(k!==best)k.alive=false;}
  document.getElementById('panel').classList.add('open'); // freeze plate re-deal only AFTER the pick (open panel postpones the refresh that populates the world)
  best.maxSpeed=0;best.vx=0;best.vy=0;if('envVx' in best){best.envVx=0;best.envVy=0;}best.energy=500;var R0=best.radius;
  window.__pin=best;window.__keep=setInterval(function(){try{__ca2.seedKey('cursorSize',0.8);__ca2.seedKey('cursorLockMs',4000);var cs2=__ca2.getCells();for(var j=0;j<cs2.length;j++){var k2=cs2[j];if(k2!==best){k2.alive=false;}else{k2.x=best.x||k2.x;k2.radius=R0;k2.vx=0;k2.vy=0;k2.maxSpeed=0;k2.energy=500;if('age' in k2)k2.age=0;if('born' in k2)k2.born=performance.now();if(!k2.alive)k2.alive=true;}}}catch(e){}},80);
  __ca2.setKey('cursorSize',0.8);__ca2.setKey('cursorLockMs',4000);
  var elc=document.elementFromPoint(Math.round(best.x),Math.round(best.y));
  window.__rec=[];window.__recT0=performance.now();
  window.__recF=function(){try{var u=__ca2.cur,e2=document.getElementById('cur');window.__rec.push({ms:Math.round(performance.now()-window.__recT0),rr:+((u.rr||0).toFixed(2)),on:!!u.on,ring:!!u.ring,locked:!!u.locked,maxR:+((u.maxR||0).toFixed(2)),cs:+((__ca2.P.cursorSize||0).toFixed(3)),lms:__ca2.P.cursorLockMs,domW:e2?e2.style.width:null,cx:u.cx,cy:u.cy})}catch(e){}window.__recR=requestAnimationFrame(window.__recF)};
  window.__recF();
  var frz={};['foodGrow','divideOn','eatMergeOn','symbiosisOn','symbiogenesisOn','parasiteOn'].forEach(function(k){frz[k]=__ca2.P[k]});
  return JSON.stringify({ok:1,frz:frz,x:best.x,y:best.y,r:best.radius,panel:{l:Math.round(pr.left),r:Math.round(pr.right)},elt:elc?(elc.id||elc.tagName):null,cont:{x:Math.round(c.x),y:Math.round(c.y),w:Math.round(c.w),h:Math.round(c.h)}})})()`),15000,'setup');
  const chk=JSON.parse(setup);
  if(!chk.err)break;
  console.error('T setup retry',att,setup.slice(0,160));
  if(att===5){console.error('T setup',el(),setup.slice(0,220));}
  await h.sleep(1500);
 }
 const st=JSON.parse(setup);console.error('T setup',el(),setup.slice(0,220));
 if(st.err)bail('setup: '+setup);
 out.pick={x:+st.x.toFixed(1),y:+st.y.toFixed(1),r:+st.r.toFixed(2),cursorSize:0.8,lockMs:4000,panel:st.panel,cont:st.cont,eltAtPick:st.elt};
 // REAL pointer entry only (elementFromPoint proven above): park off-plate, then move onto the pinned cell.
 await to(h.mouse(Math.round(st.cont.x+8),Math.round(st.cont.y+8)),4000,'mouseOff').catch(function(e){errs.push('mouseOff:'+e.message)});
 await h.sleep(400);
 await to(h.mouse(Math.round(st.x),Math.round(st.y)),4000,'mouseOn').catch(function(e){errs.push('mouseOn:'+e.message)});
 console.error('T entered',el());
 // grown-plateau screenshot inside the 2.5s lock window, return screenshot after it passes; single read at the end.
 await h.sleep(3300);
 if(!process.env.NOSHOT)await to(h.shot('/tmp/cursor-locked.png'),6000,'shotA').catch(function(e){errs.push('shotA:'+e.message)});
 console.error('T shotA',el());
 await h.sleep(4200);
 if(!process.env.NOSHOT)await to(h.shot('/tmp/cursor-return.png'),6000,'shotB').catch(function(e){errs.push('shotB:'+e.message)});
 console.error('T shotB',el());
 const world=await h.ev("JSON.stringify((function(){clearInterval(window.__keep);var c=__ca2.cont,n=0,mx=0,cs=__ca2.getCells();for(var i=0;i<cs.length;i++){var k=cs[i];if(!k.alive)continue;if(k.x<c.x||k.x>c.x+c.w||k.y<c.y||k.y>c.y+c.h)continue;n++;if(k.radius>mx)mx=k.radius;}return {aliveInCont:n,maxR:mx,pinAlive:!!window.__pin.alive,pinR:window.__pin.radius,pinX:window.__pin.x,pinY:window.__pin.y}})())").catch(function(){return null});
 if(world)out.worldEnd=JSON.parse(world);
 const smp0=await to(h.ev("cancelAnimationFrame(window.__recR);JSON.stringify(window.__rec)"),8000,'fetchrec').catch(function(){return null});
 if(smp0===null)bail('fetchrec timeout');
 out.samples=JSON.parse(smp0||'[]');out.errors=errs;
 console.error('T rec',out.samples.length,el());
 const r=st.r;
 const mouseOK=!errs.some(function(e){return e.indexOf('mouse')===0});
 const smpAll=out.samples.filter(function(x){return x.ring});
 const e0=smpAll.length?smpAll[0]:null; // first engaged sample (EMA may still be converging; baseline compares same-sample)
 // dynamic-maxR window: converged once curMaxR EMA reaches >=0.95r (radius is keeper-pinned at R0=r); world change = leave [0.5r,1.3r]
 let vi=0;while(vi<smpAll.length&&!(smpAll[vi].maxR>=0.95*r&&smpAll[vi].maxR<=1.3*r))vi++;
 const smp=[];for(let k=vi;k<smpAll.length;k++){const x=smpAll[k];if(x.maxR<0.5*r||x.maxR>1.3*r)break;smp.push(x);}
 let mmn=0,mmx=0;if(smp.length){mmn=Math.min.apply(null,smp.map(function(x){return x.maxR}));mmx=Math.max.apply(null,smp.map(function(x){return x.maxR}));}
 const lockedS=smp.filter(function(x){return x.locked});
 const post=smp.filter(function(x){return !x.locked&&lockedS.length&&x.ms>lockedS[lockedS.length-1].ms});
 const rr0=e0?e0.rr:0, base0=e0?Math.max(3,e0.maxR*0.8):0;
 const rrMax=Math.max.apply(null,lockedS.map(function(x){return x.rr}).concat([0]));
 const late=post.length?post[post.length-1]:null;
 const rrLate=late?late.rr:0, baseL=late?Math.max(3,late.maxR*0.8):0;
 const rising=lockedS.filter(function(x,k){return k>0&&x.rr>lockedS[k-1].rr+0.3}).length;
 const falling=post.filter(function(x,k){return k>0&&x.rr<post[k-1].rr-0.3}).length;
 const domSamples=smpAll.filter(function(x){return x.domW&&String(x.domW).indexOf('px')>0});
 const domOK=domSamples.length>=10&&domSamples.every(function(x){return Math.abs(parseFloat(x.domW)-2*x.rr)<1.5});
 out.phases={rrFirstEngaged:rr0,base0:+base0.toFixed(2),rrMaxLocked:rrMax,rrLate:rrLate,baseLate:+baseL.toFixed(2),growTarget:+(r*1.15).toFixed(2),lockedN:lockedS.length,postN:post.length,rising:rising,falling:falling,convergedN:smp.length,totalN:smpAll.length,maxRWindow:[+mmn.toFixed(2),+mmx.toFixed(2)],domSamples:domSamples.length,mouseErrs:errs.filter(function(e){return e.indexOf('mouse')===0})};
 out.assertions={
  pointerReal:st.elt==='c'&&mouseOK,
  hoverEngaged:smpAll.length>0,
  lockObserved:lockedS.length>3,
  baselineMatchesConfigured:rr0>0&&Math.abs(rr0-base0)<=Math.max(1.5,0.25*base0),
  growsToCellScaled:rrMax>=r*1.08&&rrMax<=r*1.45,
  easedGrow:rising>=2,
  easedReturn:falling>=2,
  returnToConfigured:post.length>3&&Math.abs(rrLate-baseL)<=0.15*baseL,
  maxRStableInWindow:smp.length>=10&&(mmx-mmn)<=0.08*r,
  domRingMatchesState:domOK,
  keyConfigHeld:smpAll.length>0&&smpAll.every(function(x){return x.cs===0.8&&x.lms===4000}),
  noPageErrors:h.errs.length===0};
 out.pageErrors=h.errs.slice(0,5);
 const evidenceMissing=smpAll.length===0||lockedS.length===0||post.length===0||smp.length===0;
 const pass=Object.keys(out.assertions).every(function(k){return out.assertions[k]===true});
 out.verdict=evidenceMissing?'INCONCLUSIVE':(pass?'PASS':'FAIL'); // measured assertion failure = FAIL; missing evidence = INCONCLUSIVE (writer rule)
 console.log(JSON.stringify(out,null,1));
 await h.close();srv.close();process.exit(pass?0:1);
})().catch(function(e){console.log(JSON.stringify({verdict:'INCONCLUSIVE',errors:['crash:'+e.message]}));process.exit(1);});
