// t151 host-free variant of t149 (TEST-ONLY: one far cell, births off, parasiteSight=1 (no host acquisition possible), parasiteHardMs huge; verifies no host in every sample). Origin t149 (TEST-ONLY state fixture: stable plate; cells cut to 1 far cell; one parasite teleported OUTSIDE the plate hostless; cursor 40px beyond it via an in-page mousemove). Origin t147 (TEST-ONLY manipulation: all cells but the one farthest from the cursor are removed in-page so a hostless parasite can find the cursor nearest). t146 base: bounded live cursor test, 760x460. Stages each have their own timeout and timing. Real Input.dispatchMouseEvent.
// A cells flee. B parasites: pursuit (p.a<-1e9 believing) -> give up -> boundary. C stationary cursor: reacquisition count.
const H=require('./harness.js');const port=+process.argv[2]||9601;
const T0=Date.now();const log=(...a)=>console.log(((Date.now()-T0)/1000).toFixed(1)+'s',...a);
const to=(p,ms,n)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('stage timeout '+n)),ms))]);
(async()=>{const s=await H.serve(port);const b=await H.launch(port+1000,'http://127.0.0.1:'+port+'/index.html?grain=0&audio=0&axis=0&mb=0'+(process.argv[3]||''),['--window-size=760,460']);
try{
await to((async()=>{for(let i=0;i<60&&!(await b.ev('!!(window.__ca2&&__ca2.getCells&&__ca2.getCells().length)'));i++)await b.sleep(500);})(),40000,'boot');await b.ev('__ca2.P.grain=0;0');log('booted');
await b.sleep(3000);
const rect=JSON.parse(await b.ev(`(function(){var r=document.querySelector('canvas').getBoundingClientRect();return JSON.stringify({l:r.left,t:r.top,w:r.width,h:r.height})})()`));
const snap=()=>b.ev(`JSON.stringify({c:__ca2.getCells().map(c=>[c.x,c.y]),p:__ca2.getParasites().map(p=>({x:p.x,y:p.y,a:p.a,e:p.e,circ:!!p.circ,h:!!p.host}))})`).then(JSON.parse);
const st0=await snap();log('cells',st0.c.length,'parasites',st0.p.length,JSON.stringify(rect));
// A
let tgt=st0.c.reduce((m,c)=>Math.hypot(c[0]-380,c[1]-230)<Math.hypot(m[0]-380,m[1]-230)?c:m);
await to((async()=>{await b.mouse(Math.round(tgt[0]),Math.round(tgt[1]));await b.sleep(100);})(),30000,'A-hold');
const A=await snap();let near=0,fled=0;for(let i=0;i<st0.c.length&&i<A.c.length;i++){const d0=Math.hypot(st0.c[i][0]-tgt[0],st0.c[i][1]-tgt[1]);if(d0<90){near++;if(Math.hypot(A.c[i][0]-tgt[0],A.c[i][1]-tgt[1])>d0+3)fled++;}}
log('A near',near,'fled',fled);
await b.shot('/tmp/t146-A.png');
// B/C v2: in-page 100ms recorder (no CDP latency in the series). Drop cursor on a hostless parasite, hold still, record 14 s.
// plate animates forever (measured: cont changes every ~3 s), so FREEZE it (test-only): x,y,w,h become getters with no-op setters.
await to((async()=>{for(let i=0;i<40&&!(await b.ev('__ca2.getParasites().length>=0&&!!__ca2.getCont'));i++)await b.sleep(500);})(),30000,'ready');
const tg=await b.ev(`(function(){var all=[].slice.call(document.querySelectorAll('*')).filter(function(e){return e.children.length===0&&/auto refresh/i.test(e.textContent||'')});var out=all.map(function(e){return e.tagName+'.'+e.className});all.forEach(function(e){var t=e.parentElement||e;t.click();});return JSON.stringify(out)})()`);log('auto-refresh toggle clicked on',tg);await b.sleep(500);
const fx=await b.ev(`(function(){var cn=__ca2.getCont(),fz={x:cn.x,y:cn.y,w:cn.w,h:cn.h};['x','y','w','h'].forEach(function(k){var v=fz[k];Object.defineProperty(cn,k,{get:function(){return v},set:function(){},configurable:true})});
 var ps=__ca2.getParasites(),cs=__ca2.getCells(),cv=document.querySelector('canvas');
 var px=Math.round(fz.x-60),py=Math.round(fz.y+fz.h/2);if(!ps.length)ps.push({x:px,y:py,e:6,host:null,a:0});var p=ps[0];p.x=px;p.y=py;p.host=null;p.a=0;p.e=6;p.lost=0;
 var far=cs.reduce(function(m,c){return Math.hypot(c.x-px,c.y-py)>Math.hypot(m.x-px,m.y-py)?c:m});far.maxSpeed=0;far.speedModifier=0;far.vx=0;far.vy=0;far.energy=1e9;far.radius=10;cs.splice(0,cs.length,far);window.__far=far;cs.push=function(){return cs.length};__ca2.P.reproChance=0;__ca2.P.divideOn=0;__ca2.P.parasiteSight=1;__ca2.P.parasiteHardMs=1e9;
 cv.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:px-40,clientY:py}));
 window.__cx0=px-40;window.__mm=null;window.addEventListener('mousemove',function(e){window.__mm=[e.clientX,e.clientY,e.target===document.querySelector('canvas')?1:0,e.target.tagName]},true);window.__tr=[];window.__trT=setInterval(function(){var c2=__ca2.getCont(),q=__ca2.getParasites()[0];window.__tr.push({t:performance.now(),x:q?Math.round(q.x):null,y:q?Math.round(q.y):null,a:q?q.a:null,h:q&&q.host?1:0,nc:__ca2.getCells().length,fd:q?Math.round(Math.hypot(window.__far.x-q.x,window.__far.y-q.y)):null,raw:(function(){try{var W=__ca2.WC;return Array.prototype.slice.call(new Float64Array(W.mem.buffer,W.e.pa_out(),10)).map(function(v){return Math.round(v*100)/100})}catch(e){return String(e).slice(0,40)}})(),clx:q&&q.clx,cly:q&&q.cly,pe:q&&q.e,mm:window.__mm,cx:Math.round(c2.x),cy:Math.round(c2.y),cw:Math.round(c2.w),ch:Math.round(c2.h)})},100);
 return JSON.stringify({frozen:fz,parasite:[px,py],cursor:[px-40,py],cells:cs.length,pars:ps.length,parasiteCursorMs:__ca2.P.parasiteCursorMs,R:__ca2.P.parasiteCursorR,cd:__ca2.P.parasiteCursorCooldown})})()`);
log('fixture',fx);
await b.sleep(1500);await b.shot('/tmp/t149-0.png');
await b.sleep(10000);await b.shot('/tmp/t149-1.png');
await b.sleep(10000);await b.shot('/tmp/t149-2.png');await b.sleep(12000);await b.ev(`(function(){window.__moveAt=performance.now();document.querySelector('canvas').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:window.__cx0+90,clientY:159}));return 1})()`);await b.sleep(9000);
const tr=JSON.parse(await b.ev('JSON.stringify(window.__tr)'));const mvAt=+(await b.ev('window.__moveAt'));log('cursor moved +90px from its start (single jump) (TEST-ONLY synthetic mousemove) at series t',((mvAt-tr[0].t)/1000).toFixed(1));
const st=a=>a===null?'-':a<=-2e9?'cool':a<=-1e9?'bel':'0';
const inside=r=>r.x>r.cx&&r.x<r.cx+r.cw&&r.y>r.cy&&r.y<r.cy+r.ch;
log('far cell dist min/max',Math.min(...tr.map(r=>r.fd).filter(v=>v!==null)),Math.max(...tr.map(r=>r.fd).filter(v=>v!==null)));log('latch',JSON.stringify(tr.filter((r,i)=>i%2==0).map(r=>[((r.t-tr[0].t)/1000).toFixed(0),r.raw,r.mm])));log('series t:x,y,state,host,inside', tr.map(r=>((r.t-tr[0].t)/1000).toFixed(1)+':'+r.x+','+r.y+','+st(r.a)+(r.h?'H':'')+(inside(r)?'IN':'out')).join(' '));
log('HOST-FREE check: cells per sample min/max',Math.min(...tr.map(r=>r.nc)),Math.max(...tr.map(r=>r.nc)),'host ever',tr.some(r=>r.h));log('plate unchanged during run',tr.every(r=>r.cx===tr[0].cx&&r.cw===tr[0].cw&&r.cy===tr[0].cy&&r.ch===tr[0].ch));
log('errs',JSON.stringify(b.errs.slice(0,3)));}catch(e){log('FAIL',String(e));}
b.close();s.close();process.exit(0)})();
