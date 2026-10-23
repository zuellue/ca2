// t153 combined pointer + glyph circle in ONE live scene (bounded acceptance proof).
// TEST-ONLY fixture scope (explicit): dbg-inject read-only getters; auto-refresh clicked off; plate grown once
// sized once via the app's own user-drag semantics (cont.user=true + rawW/rawH - the identical state a real
// corner pull produces, so any later resize()/clampTargets() re-derives the same 712x412; never frozen - its
// x/y/w/h are sampled every 250 ms and the run is INVALID if they move); cell set reduced to one immobile
// far cell (push neutered = births off); one hostless parasite placed 25 px from a glyph circle inside the
// plate; the far cell is teleported inside the grown plate with selStrength=0 (fixture-only: oob/selection death
// would otherwise remove an immobile cell over 16 s - neither path touches circle/cursor belief);
// parasiteSight narrowed to ~60 so the circle is in sight but the far cell is not (coordinator spec);
// parasite e/hardMs raised so starvation cannot confound. NOT touched: default cursor knobs, default parasiteSight,
// wasm paths, overlay/core order, plate physics during the run.
// markerWindowMs is measured between samples: slow boots quantize it up to ~1.3 s, cap allows that.
// Proof targets: (1) circle belief in the live scene (circ set, parasite glued to the circle, no host);
// (2) with the real pointer parked next to it, the cursor-belief marker engages while the circle ride continues
// (overlay owns motion - core marker runs during the episode); (3) give-up -> cooldown + motion latch at the
// cursor's parked spot; (4) no re-belief while the cursor stays parked; (5) inspected screenshots of all phases.
const H=require('./harness.js'),D=require('./dbg-inject.js');
const port=+process.argv[2]||9730;const T0=Date.now();
const log=(...a)=>console.log(((Date.now()-T0)/1000).toFixed(1)+'s',...a);
(async()=>{const srv=await D.serve(port),b=await H.launch(port+1,'http://127.0.0.1:'+port+'/index.html?simab=1',[]);
let INVALID=null;
try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false}); // dsf 2: sharper pixels for parasite/cursor inspection
 for(let i=0;i<90&&!(await b.ev('!!(window.__ca2&&__ca2.contBox&&__ca2.circleList)'));i++)await b.sleep(500);
 await b.ev(`__ca2.P.grain=0;__ca2.P.parasiteSize=3;__ca2.P.UNIVERSE_SIZE=2;0`); await b.ev('__ca2.setGPU(0);0'); // TEST-ONLY: headless SwiftShader WebGL metaballs cost ~1-8 s/frame ((program) 6.8 s of 4 s profile, JS 0.25 s); CPU metaball path = same scene logic at ~44 fps. Render plumbing is not under test.
 await b.sleep(1500);
 log('boot',await b.ev(`JSON.stringify({cont:[__ca2.contBox.x,__ca2.contBox.y,__ca2.contBox.w,__ca2.contBox.h],circles:__ca2.circleList.length,inPlate:__ca2.circleList.filter(function(c){var B=__ca2.contBox;return Math.hypot(c.x-Math.max(B.x,Math.min(c.x,B.x+B.w)),c.y-Math.max(B.y,Math.min(c.y,B.y+B.h)))<c.r}).length})`));
 // stop the 2-9 s re-roll at the source, VERIFIED (a mid-run randomize recolors the scene and re-deals knobs - run 1 p3)
 let arOff=false;for(let k=0;k<3&&!arOff;k++){
  await b.ev(`(function(){var l=[].slice.call(document.querySelectorAll('label.chk')).filter(function(x){return /auto refresh/i.test(x.textContent)})[0];if(l&&l.querySelector('b').textContent!=='off')l.click();return 1})()`);
  await b.sleep(250);
  arOff=(await b.ev(`(function(){var l=[].slice.call(document.querySelectorAll('label.chk')).filter(function(x){return /auto refresh/i.test(x.textContent)})[0];return l?l.querySelector('b').textContent:'missing'})()`))==='off';}
 log('autoRefresh off',arOff);if(!arOff)INVALID='autoRefresh toggle failed';
 // a refresh tick can land before the toggle and leave a trans running: its population pressure births/kills
 // cells mid-run (run 5 INVALID). Wait for it to settle before touching the world.
 let transClear=false;for(let i=0;i<60&&!transClear;i++){await b.sleep(500);transClear=!(await b.ev('!!__ca2.transTg'));}
 log('trans clear',transClear);if(!transClear)INVALID='boot trans still active after 30s';
 if(INVALID){log('RESULT',JSON.stringify({INVALID}));log('FAIL');b.close();srv.close();process.exit(0);}
 // size the plate once through the app's own user-drag path: identical state to a real corner pull, and any
 // later resize re-derives the same target (deterministic - run 2-4 tw-only sets were reverted by clampTargets)
 await b.ev(`(function(){var c=__ca2.contBox;c.user=true;c.rawW=720;c.rawH=440;c.tw=Math.min(720,window.innerWidth-2*__ca2.P.dragMargin);c.th=Math.min(440,window.innerHeight-2*__ca2.P.dragMargin);return 1})()`);
 // COMMITTED TEST GUARD (coordinator via Main 21:42, fixed before this run): plate stable = |w-tw|<0.5,
 // |h-th|<0.5 and x/y/w/h each constant within 0.5 px across 3 s of rAF-rate samples; circle-in-plate must
 // hold at the end of the window. Tolerance is an explicit TEST GUARD, not a production rule. If the guard
 // fails the run STOPS here (no behavior sampling) and reports the cont series.
 let landed=false;for(let i=0;i<40&&!landed;i++){await b.sleep(500);landed=await b.ev(`(function(){var B=__ca2.contBox;return Math.abs(B.ew-B.tw)<0.5&&Math.abs(B.eh-B.th)<0.5})()`);}
 log('ease landed',landed);
 // liveness: a thawed app's cells move; a rAF-stalled headless boot (run 10) freezes everything - stop early
 const live=await b.ev(`new Promise(function(res){var a=__ca2.cellList.map(function(c){return c.x+','+c.y}).join('|');setTimeout(function(){res(__ca2.cellList.map(function(c){return c.x+','+c.y}).join('|')!==a)},2000)})`);
 log('app live',live);if(!live){INVALID='app rAF stalled at boot (environment)';log('RESULT',JSON.stringify({INVALID}));log('FAIL');b.close();srv.close();process.exit(0);}
 // corrected criterion (coordinator 21:50, boundary-tested in t153-guard-boundary.js): converge on the
 // pre-floor ew/eh (|ew-tw|<0.5) + the floor invariant w===floor(ew); x/y/w/h constant within 0.5 over 3 s.
 const guard=JSON.parse(await b.ev(`new Promise(function(res){var B=__ca2.contBox,xs=[],ys=[],ws=[],hs=[],es=[],fs=[],n=0;var t00=performance.now();
  function f(){xs.push(B.x);ys.push(B.y);ws.push(B.w);hs.push(B.h);es.push(B.ew-B.tw);fs.push(B.eh-B.th);n++;if(performance.now()-t00<3200||n<4)requestAnimationFrame(f);
   else{var mm=function(a){return Math.max.apply(null,a)-Math.min.apply(null,a)},mx=function(a){return Math.max.apply(null,a.map(Math.abs))};
    res(JSON.stringify({stable:mx(es)<0.5&&mx(fs)<0.5&&B.w===Math.floor(B.ew)&&B.h===Math.floor(B.eh)&&mm(xs)<0.5&&mm(ys)<0.5&&mm(ws)<0.5&&mm(hs)<0.5,
     dx:mm(xs),dy:mm(ys),dw:mm(ws),dh:mm(hs),ewTwMax:+mx(es).toFixed(3),ehThMax:+mx(fs).toFixed(3),wFloor:B.w-Math.floor(B.ew),hFloor:B.h-Math.floor(B.eh),
     box:[B.x,B.y,B.w,B.h],tw:+B.tw.toFixed(2),th:+B.th.toFixed(2),ew:+B.ew.toFixed(2),eh:+B.eh.toFixed(2),
     inPlate:__ca2.circleList.filter(function(c){return Math.hypot(c.x-Math.max(B.x,Math.min(c.x,B.x+B.w)),c.y-Math.max(B.y,Math.min(c.y,B.y+B.h)))<c.r}).length}))}}
  f()})`));
 log('plate guard',JSON.stringify(guard));
 if(!landed||!guard.stable||!guard.inPlate){INVALID='plate guard failed: '+JSON.stringify(guard);log('RESULT',JSON.stringify({INVALID}));log('FAIL');b.close();srv.close();process.exit(0);}
 const setup=await b.ev(`(function(){var B=__ca2.contBox,best=null,bd=-1,cells=__ca2.cellList.filter(function(c){return c.alive});
  __ca2.circleList.forEach(function(c){if(Math.hypot(c.x-Math.max(B.x,Math.min(c.x,B.x+B.w)),c.y-Math.max(B.y,Math.min(c.y,B.y+B.h)))>=c.r)return;var m=1e9;cells.forEach(function(q){m=Math.min(m,Math.hypot(q.x-c.x,q.y-c.y))});if(m>bd){bd=m;best=c}});
  if(!best)return 'no circle in plate';
  var far=cells.reduce(function(m,q){return Math.hypot(q.x-best.x,q.y-best.y)>Math.hypot(m.x-best.x,m.y-best.y)?q:m});
  far.x=(best.x<B.x+B.w/2)?B.x+B.w-40:B.x+40;far.y=(best.y<B.y+B.h/2)?B.y+B.h-40:B.y+40; // inside the grown plate: an immobile cell outside it dies oob (run 7)
  far.maxSpeed=0;far.speedModifier=0;far.vx=0;far.vy=0;far.energy=1e9;far.radius=10;far.life=0;far.gene=0;bd=Math.hypot(far.x-best.x,far.y-best.y);
  __ca2.P.selStrength=0; // selection death is the one remaining way an immortal-looking fixture cell dies over 16 s; selection plays no role in circle/cursor belief
  __ca2.cellList.splice(0,__ca2.cellList.length,far);
  __ca2.cellList.push=function(){return __ca2.cellList.length}; // births off (t151 technique): any later birth is dropped
  __ca2.P.reproChance=0;__ca2.P.divideOn=0;__ca2.P.parasiteHardMs=1e9;window.__far=far;
  __ca2.P.parasiteSight=Math.max(20,Math.min(bd*0.8,60)); // circle (25 px) in sight, far cell not (coordinator spec)
  __ca2.parasiteList.length=0;
  var tp={x:best.x+25,y:best.y+25,e:30,host:null,a:0,ph:1,lost:performance.now()};window.__tp=tp;window.__circ=best;__ca2.parasiteList.push(tp);
  window.__mm=null;window.addEventListener('mousemove',function(e){window.__mm=[e.clientX,e.clientY,e.target===document.querySelector('canvas')?1:0]},true);
  return JSON.stringify({key:best.key,r:Math.round(best.r),cx:Math.round(best.x),cy:Math.round(best.y),farDist:Math.round(bd),sight:__ca2.P.parasiteSight,cMs:__ca2.P.parasiteCursorMs,R:__ca2.P.parasiteCursorR,cd:__ca2.P.parasiteCursorCooldown,rearm:__ca2.P.parasiteCursorRearm})})()`);
 log('setup',setup);const SU=String(setup).charAt(0)==='{'?JSON.parse(setup):null;if(!SU)INVALID='no circle in plate at setup';
 if(!SU){log('RESULT',JSON.stringify({INVALID}));log('FAIL');b.close();srv.close();process.exit(0);}
 const rec=()=>b.ev(`(function(){var p=window.__tp,c=p.circ,B=__ca2.contBox;return JSON.stringify({alive:__ca2.parasiteList.indexOf(p)>=0,circ:c?c.key:null,rCirc:c?Math.round(c.r):null,dCirc:c?Math.round(Math.hypot(c.x-p.x,c.y-p.y)):null,st:p.a<=-2e9?'cool':p.a<=-1e9?'bel':'0',host:p.host?1:0,clx:p.clx===undefined?null:Math.round(p.clx),cly:p.cly===undefined?null:Math.round(p.cly),x:Math.round(p.x),y:Math.round(p.y),farAlive:window.__far.alive?1:0,kn:[__ca2.P.parasiteCursorMs,__ca2.P.parasiteCursorR,__ca2.P.parasiteCursorCooldown,__ca2.P.parasiteCursorRearm],nc:__ca2.cellList.length,box:[Math.round(B.x),Math.round(B.y),Math.round(B.w),Math.round(B.h)],fd:Math.round(Math.hypot(window.__far.x-p.x,window.__far.y-p.y))})})()`).then(JSON.parse);
 // phase 1: no cursor - circle belief in the live scene
 const s1=[];const T1=Date.now();
 for(let i=0;i<20;i++){await b.sleep(250);const r=await rec();r.t=((Date.now()-T1)/1000).toFixed(1);s1.push(r);}
 log('phase1',s1.map(r=>r.t+':'+(r.circ||'-')+'/'+r.st+'/d'+(r.dCirc===null?'-':r.dCirc)+(r.host?'H':'')).join(' '));
 await b.shot('/tmp/t153-p1.png');
 if(!s1.every(r=>r.box.join()===s1[0].box.join()))INVALID='plate moved during phase1';
 if(!s1.every(r=>r.kn.join()===s1[0].kn.join()))INVALID='cursor knobs re-dealt during phase1';
 if(!s1.every(r=>r.nc===s1[0].nc))INVALID='cell count changed during phase1';
 if(!s1.every(r=>r.farAlive))INVALID='far cell died during phase1';
 const adopted=(s1.find(r=>r.circ)||{}).circ; // the overlay's own nearest-candidate choice, not the placement pick
 const circHeld=s1.filter(r=>r.circ===adopted).length,noHost=s1.every(r=>!r.host),glued=s1.filter(r=>r.circ===adopted&&r.dCirc!==null&&r.dCirc<=r.rCirc+25).length;
 // phase 2: park the real pointer next to the parasite (in-page dispatch proven to land on the canvas by t149/t151)
 const pp=[s1[s1.length-1].x,s1[s1.length-1].y];
 await b.ev(`(function(){document.querySelector('canvas').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:${pp[0]+15},clientY:${pp[1]}}));return 1})()`);
 await b.sleep(150);const mm=await b.ev('JSON.stringify(window.__mm)');log('cursor parked at',pp[0]+15,pp[1],'capture',mm);
 const s2=[];const T2=Date.now();let shotBel=false;
 for(let i=0;i<44;i++){await b.sleep(250);const r=await rec();r.t=((Date.now()-T2)/1000).toFixed(1);s2.push(r);
  if(!shotBel&&r.st==='bel'){shotBel=true;await b.shot('/tmp/t153-p2-bel.png');}}
 await b.shot('/tmp/t153-p3.png');
 log('phase2',s2.map(r=>r.t+':'+(r.circ||'-')+'/'+r.st+(r.host?'H':'')+'/L'+(r.clx===null?'-':r.clx+','+r.cly)).join(' '));
 if(!s2.every(r=>r.box.join()===s2[0].box.join()))INVALID='plate moved during phase2';
 if(!s2.every(r=>r.kn.join()===s2[0].kn.join()))INVALID='cursor knobs re-dealt during phase2';
 if(!s2.every(r=>r.nc===s2[0].nc))INVALID='cell count changed during phase2';
 if(!s2.every(r=>r.farAlive))INVALID='far cell died during phase2';
 // assertions
 const belIdx=s2.findIndex(r=>r.st==='bel');
 const giveup=s2.find((r,i)=>i>belIdx&&belIdx>=0&&(r.st==='cool'));
 const latchOk=giveup&&Math.abs(giveup.clx-(pp[0]+15))<=2&&Math.abs(giveup.cly-pp[1])<=2;
 const firstCool=s2.findIndex(r=>r.st==='cool');
 const reBel=s2.some((r,i)=>firstCool>=0&&i>firstCool&&r.st==='bel');
 const circKept=s2.filter(r=>r.circ===adopted).length;
 const markerWindowMs=belIdx>=0&&giveup?((+giveup.t)-(+s2[belIdx].t))*1000:null;
 const R={adoptedCircle:adopted,placementPick:SU.key,circHeldP1:circHeld+'/20',gluedP1:glued+'/20',noHostP1:noHost,cursorBelief:belIdx>=0,giveupToCooldown:!!giveup,markerWindowMs:markerWindowMs&&Math.round(markerWindowMs),latchAtCursor:!!latchOk,latch:giveup?[giveup.clx,giveup.cly]:null,cursor:[pp[0]+15,pp[1]],noRebeliefParked:!reBel,circKeptP2:circKept+'/44',errs:b.errs.slice(0,2),INVALID};
 log('RESULT',JSON.stringify(R));
 const pass=!INVALID&&adopted&&circHeld>=18&&glued>=18&&noHost&&belIdx>=0&&giveup&&latchOk&&!reBel&&circKept>=40&&markerWindowMs>1500&&markerWindowMs<9000;
 log(pass?'PASS':'FAIL');
 }catch(e){log('ERROR',String(e&&e.stack||e));}
 b.close();srv.close();process.exit(0)})();
