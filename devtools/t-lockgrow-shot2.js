// t-lockgrow-shot2: ONE bounded same-pin visual capture, v35-fixture-faithful (writer contract 16:38):
//  - v35 setup eval + keeper verbatim (singleton pick r in [30,110], same source pins), plus full-ring-in-viewport margin
//  - frame gate (grown ease needs real frames inside the 4s lock), <=3 launches
//  - grown plateau = locked && rr within 2% of 1.15*lockCell.radius && stable across 2 polls; captured WHILE hovering
//  - returned plateau = !locked && rr within 2% of 0.8*maxR (same sample) && stable; cursor never leaves the cell
//  - every shot bracketed by state polls incl #cur DOM rect/computed style; gates: singleton world, pin intact,
//    config held, pointer real, zero page/mouse errors, |post-pre rr|<=2 (CDP stall freezes frames during capture)
//  - verdict CAPTURED only if all gates pass; INCONCLUSIVE otherwise. No product change.
const {serve,launch}=require('./harness');
const SHOT_A=process.argv[2]||'/tmp/cursor2-grown.png', SHOT_B=process.argv[3]||'/tmp/cursor2-returned.png';
(async()=>{
 const T0=Date.now();function el(){return +((Date.now()-T0)/1000).toFixed(1)}
 const out={assertions:{}};const errs=[];
 function to(p,ms,label){return Promise.race([p,new Promise(function(_,rej){setTimeout(function(){rej(new Error('timeout:'+label))},ms)})]);}
 function bail(why){out.verdict='INCONCLUSIVE';out.errors=errs.concat([why]);console.log(JSON.stringify(out,null,1));process.exit(1);}
 let h=null,srv=null,st=null,fps=0;
 for(let att=0;att<3;att++){
  srv=await serve(18093);
  h=await launch(18094,'http://127.0.0.1:18093/index.html?nowasm=1');
  console.error('T launched',el(),'att',att);
  let booted=false;
  for(let i=0;i<90;i++){const ok=await h.ev("!!(window.__ca2&&__ca2.getCells)").catch(function(){return false});if(ok===true){booted=true;break;}await h.sleep(300);}
  if(!booted){try{await h.close()}catch(e){}srv.close();h=null;continue;}
  let setup=null;
  for(let att2=0;att2<6;att2++){
   setup=await to(h.ev(`(function(){
   __ca2.setKey('grain',0);__ca2.setKey('audioOn',0);__ca2.setKey('resolution',0.3);__ca2.setGPU(0);
   ['foodGrow','divideOn','eatMergeOn','symbiosisOn','symbiogenesisOn','parasiteOn','spawnProtect','cellMorph','respawnMorph','clusterCohesion'].forEach(function(k){__ca2.setKey(k,0)});
   __ca2.setKey('minRefreshInterval',99999);__ca2.setKey('maxRefreshInterval',99999);
   var pr=document.getElementById('panel').getBoundingClientRect(); // pre-open rect; open panel parks at the right edge (l=1300 on 1620w)
   var c=__ca2.cont,cs=__ca2.getCells(),arr=[],VW=window.innerWidth,VH=window.innerHeight;
   for(var i=0;i<cs.length;i++){var k=cs[i];if(!k.alive)continue;
    var m=k.radius*1.5+8; // full ring (max ~1.15r ease + border) must be visible inside cont AND viewport
    if(k.x<c.x+m||k.x>c.x+c.w-m||k.y<c.y+m||k.y>c.y+c.h-m)continue;
    if(k.x-m<2||k.x+m>VW-2||k.y-m<2||k.y+m>VH-2)continue;
    if(k.x+k.radius*1.6>pr.left-8&&k.x-k.radius*1.6<pr.right+8&&k.y+k.radius*1.6>pr.top-8&&k.y-k.radius*1.6<pr.bottom+8)continue; // ring must not slide under the panel
    arr.push(k);}
   arr=arr.filter(function(k){return k.radius>=30&&k.radius<=110});
   arr.sort(function(p,q){return p.radius-q.radius});
   var best=arr[Math.floor(arr.length/2)];if(!best)return JSON.stringify({err:'no cell outside panel',alive:cs.filter(function(k){return k.alive}).length,VW:VW,VH:VH});
   for(var i=0;i<cs.length;i++){var k=cs[i];if(k!==best)k.alive=false;}
   document.getElementById('panel').classList.add('open'); // freeze plate re-deal only AFTER the pick (open panel postpones the refresh that populates the world)
   best.maxSpeed=0;best.vx=0;best.vy=0;if('envVx' in best){best.envVx=0;best.envVy=0;}best.energy=500;var R0=best.radius;
   window.__pin=best;window.__keep=setInterval(function(){try{__ca2.seedKey('cursorSize',0.8);__ca2.seedKey('cursorLockMs',4000);var cs2=__ca2.getCells();for(var j=0;j<cs2.length;j++){var k2=cs2[j];if(k2!==best){k2.alive=false;}else{k2.x=best.x||k2.x;k2.radius=R0;k2.vx=0;k2.vy=0;k2.maxSpeed=0;k2.energy=500;if('age' in k2)k2.age=0;if('born' in k2)k2.born=performance.now();if(!k2.alive)k2.alive=true;}}}catch(e){}},80);
   __ca2.setKey('cursorSize',0.8);__ca2.setKey('cursorLockMs',4000);
   var elc=document.elementFromPoint(Math.round(best.x),Math.round(best.y));
   window.__rec=[];window.__recT0=performance.now();
   window.__recF=function(){try{window.__rec.push(1)}catch(e){}window.__recR=requestAnimationFrame(window.__recF)};
   window.__recF();
   var frz={};['foodGrow','divideOn','eatMergeOn','symbiosisOn','symbiogenesisOn','parasiteOn'].forEach(function(k){frz[k]=__ca2.P[k]});
   return JSON.stringify({ok:1,frz:frz,x:best.x,y:best.y,r:best.radius,panel:{l:Math.round(pr.left),r:Math.round(pr.right)},elt:elc?(elc.id||elc.tagName):null,cont:{x:Math.round(c.x),y:Math.round(c.y),w:Math.round(c.w),h:Math.round(c.h)},VW:VW,VH:VH})})()`),15000,'setup');
   const chk=JSON.parse(setup);
   if(!chk.err)break;
   console.error('T setup retry',att2,setup.slice(0,160));
   await h.sleep(1500);
  }
  st=JSON.parse(setup);
  if(st.err){console.error('T setup failed, relaunch:',setup.slice(0,160));try{await h.close()}catch(e){}srv.close();h=null;continue;}
  const f0=await h.ev("window.__rec.length").catch(function(){return 0});
  await h.sleep(2500);
  const f1=await h.ev("window.__rec.length").catch(function(){return 0});
  fps=+(((f1-f0)/2.5).toFixed(1));
  console.error('T framegate',el(),'fps',fps,'r',st.r);
  if(fps>=4)break;
  try{await h.close()}catch(e){}srv.close();h=null;st=null;
 }
 if(!h||!st)bail('no non-starved launch in 3 attempts');
 out.pick={x:+st.x.toFixed(1),y:+st.y.toFixed(1),r:+st.r.toFixed(2),cursorSize:0.8,lockMs:4000,fps:fps,viewport:{w:st.VW,h:st.VH},panel:st.panel,cont:st.cont,eltAtPick:st.elt};
 const pollSrc="JSON.stringify((function(){var u=__ca2.cur||{},e2=document.getElementById('cur'),rc=e2?e2.getBoundingClientRect():null,cs2=getComputedStyle(e2),al=__ca2.getCells().filter(function(k){return k.alive});return {ms:Math.round(performance.now()-window.__recT0),rr:u.rr||0,ring:!!u.ring,locked:!!u.locked,maxR:u.maxR||0,col:u.col||null,cx:u.cx,cy:u.cy,cs:+((__ca2.P.cursorSize||0).toFixed(3)),lms:__ca2.P.cursorLockMs,pinR:window.__pin?window.__pin.radius:0,pinX:window.__pin?window.__pin.x:0,pinY:window.__pin?window.__pin.y:0,alive:al.length,aliveMaxR:al.reduce(function(m,k){return Math.max(m,k.radius)},0),domRect:rc?{x:+rc.x.toFixed(1),y:+rc.y.toFixed(1),w:+rc.width.toFixed(1),h:+rc.height.toFixed(1)}:null,domDisp:cs2.display,domBorder:cs2.borderColor,domBW:cs2.borderTopWidth,elt:(function(){var q=document.elementFromPoint(Math.round("+st.x+"),Math.round("+st.y+"));return q?(q.id||q.tagName):null})()}})())";
 async function pollCur(){const v=await to(h.ev(pollSrc),4000,'poll').catch(function(){return null});return v?JSON.parse(v):null;}
 await to(h.mouse(Math.round(st.cont.x+8),Math.round(st.cont.y+8)),4000,'mouseOff').catch(function(e){errs.push('mouseOff:'+e.message)});
 await h.sleep(400);
 await to(h.mouse(Math.round(st.x),Math.round(st.y)),4000,'mouseOn').catch(function(e){errs.push('mouseOn:'+e.message)});
 console.error('T entered',el());
 const r=st.r, deadlineA=Date.now()+70000, deadlineB=Date.now()+95000;
 function worldOk(u){return u&&u.alive===1&&Math.abs(u.pinR-r)<=0.6&&Math.abs(u.pinX-st.x)<=0.6&&Math.abs(u.pinY-st.y)<=0.6&&u.cs===0.8&&u.lms===4000&&u.elt==='c';}
 let aPre=null,aPost=null,prev=null;
 while(Date.now()<deadlineA){const u=await pollCur();
  if(u&&u.ring&&u.locked&&worldOk(u)){var targ=1.15*u.pinR;if(Math.abs(u.rr-targ)<=0.02*targ&&prev&&prev.locked&&Math.abs(prev.rr-u.rr)<=0.01*u.rr){aPre=u;break;}prev=u;}
  else prev=u;
  await h.sleep(500);}
 console.error('T plateauA',el(),JSON.stringify(aPre));
 if(aPre){await to(h.shot(SHOT_A),20000,'shotA').catch(function(e){errs.push('shotA:'+e.message)});aPost=await pollCur();}
 console.error('T shotA',el(),JSON.stringify(aPost));
 let bPre=null,bPost=null;prev=null;
 while(Date.now()<deadlineB){const u=await pollCur();
  if(u&&u.ring&&!u.locked&&u.maxR>0&&worldOk(u)){var base=0.8*u.maxR;if(Math.abs(u.rr-base)<=0.02*base&&prev&&!prev.locked&&Math.abs(prev.rr-u.rr)<=0.01*u.rr){bPre=u;break;}prev=u;}
  else prev=u;
  await h.sleep(500);}
 console.error('T plateauB',el(),JSON.stringify(bPre));
 if(bPre){await to(h.shot(SHOT_B),20000,'shotB').catch(function(e){errs.push('shotB:'+e.message)});bPost=await pollCur();}
 console.error('T shotB',el(),JSON.stringify(bPost));
 const brOk=function(pre,post){return !!(pre&&post&&Math.abs(post.rr-pre.rr)<=2&&post.locked===pre.locked&&worldOk(post));};
 out.grown={pre:aPre,post:aPost};out.returned={pre:bPre,post:bPost};out.errors=errs;
 out.assertions={pointerReal:st.elt==='c'&&!errs.length,frameGate:fps>=4,
  grownPlateau:!!aPre,grownBracket:brOk(aPre,aPost),
  returnedPlateau:!!bPre,returnedBracket:brOk(bPre,bPost),
  domRingMatchesGrown:!!(aPre&&aPre.domRect&&Math.abs(aPre.domRect.w-2*aPre.rr)<=1.5&&aPre.domDisp==='block'),
  domRingMatchesReturned:!!(bPre&&bPre.domRect&&Math.abs(bPre.domRect.w-2*bPre.rr)<=1.5&&bPre.domDisp==='block')};
 out.verdict=Object.keys(out.assertions).every(function(k){return out.assertions[k]===true})?'CAPTURED':'INCONCLUSIVE';
 console.log(JSON.stringify(out,null,1));
 await h.close();srv.close();process.exit(out.verdict==='CAPTURED'?0:1);
})().catch(function(e){console.log(JSON.stringify({verdict:'INCONCLUSIVE',errors:['crash:'+e.message]}));process.exit(1);});
