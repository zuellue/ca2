// t152 combined pointer+circle (TEST-ONLY debug build, cells frozen near-zero speed, one hostless parasite beside a glyph circle; then synthetic cursor next to it). Origin t-circle-live. live check: plate grown over the title, hostless parasite placed beside a glyph circle believes it. node devtools/t-circle-live.js
const H=require('./harness.js'),D=require('./dbg-inject.js'),fs=require('fs');
(async()=>{const srv=await D.serve(8820),b=await H.launch(8821,'http://127.0.0.1:8820/index.html?simab=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false});
 await b.sleep(8000);
 await b.ev(`__ca2.P.grain=0;__ca2.P.parasiteSize=3;__ca2.P.UNIVERSE_SIZE=2;0`);
 await b.sleep(2000);
 console.log('before',await b.ev(`JSON.stringify({cont:[__ca2.contBox.x,__ca2.contBox.y,__ca2.contBox.w,__ca2.contBox.h,__ca2.contBox.tw,__ca2.contBox.th],inPlate:__ca2.circleList.filter(function(c){var b=__ca2.contBox;return Math.hypot(c.x-Math.max(b.x,Math.min(c.x,b.x+b.w)),c.y-Math.max(b.y,Math.min(c.y,b.y+b.h)))<c.r}).length,circles:__ca2.circleList.length})`));
 await b.ev(`(function(){[].slice.call(document.querySelectorAll('*')).filter(function(e){return e.children.length===0&&/auto refresh/i.test(e.textContent||'')}).forEach(function(e){(e.parentElement||e).click()});return 1})()`);
 await b.ev(`(function(){var c=__ca2.contBox;c.tw=720;c.th=440;return 1})()`);
 await b.sleep(4000);
 console.log('after grow',await b.ev(`JSON.stringify({cont:[__ca2.contBox.x,__ca2.contBox.y,__ca2.contBox.w,__ca2.contBox.h],inPlate:__ca2.circleList.filter(function(c){var b=__ca2.contBox;return Math.hypot(c.x-Math.max(b.x,Math.min(c.x,b.x+b.w)),c.y-Math.max(b.y,Math.min(c.y,b.y+b.h)))<c.r}).length})`));
 console.log('setup',await b.ev(`(function(){var B=__ca2.contBox,best=null,bd=-1,cells=__ca2.cellList.filter(function(c){return c.alive});
  __ca2.circleList.forEach(function(c){if(Math.hypot(c.x-Math.max(B.x,Math.min(c.x,B.x+B.w)),c.y-Math.max(B.y,Math.min(c.y,B.y+B.h)))>=c.r)return;var m=1e9;cells.forEach(function(q){m=Math.min(m,Math.hypot(q.x-c.x,q.y-c.y))});if(m>bd){bd=m;best=c}});
  if(!best)return 'no circle in plate'; var far=cells.reduce(function(m,q){return Math.hypot(q.x-best.x,q.y-best.y)>Math.hypot(m.x-best.x,m.y-best.y)?q:m});far.maxSpeed=0;far.speedModifier=0;far.vx=0;far.vy=0;far.energy=1e9;far.radius=10;bd=Math.hypot(far.x-best.x,far.y-best.y);__ca2.cellList.splice(0,__ca2.cellList.length,far);__ca2.cellList.push=function(){return __ca2.cellList.length};__ca2.P.reproChance=0;__ca2.P.divideOn=0;__ca2.P.parasiteHardMs=1e9;window.__far=far;
  __ca2.P.parasiteSight=Math.max(20,Math.min(bd*0.8,60));__ca2.parasiteList.length=0;
  var tp={x:best.x+25,y:best.y+25,e:8,host:null,a:0,ph:1,lost:performance.now()};window.__tp=tp;__ca2.parasiteList.push(tp);
  return JSON.stringify({key:best.key,r:Math.round(best.r),nearestCell:Math.round(bd),sight:__ca2.P.parasiteSight})})()`));

 const rec=()=>b.ev(`(function(){var p=window.__tp,alive=__ca2.parasiteList.indexOf(p)>=0,c=p.circ,B=__ca2.contBox;return JSON.stringify({alive:alive,circ:c?c.key:null,a:p.a<=-2e9?'cool':p.a<=-1e9?'cur':'0',host:p.host?1:0,x:Math.round(p.x),y:Math.round(p.y),box:[Math.round(B.x),Math.round(B.y),Math.round(B.w),Math.round(B.h)],cells:__ca2.cellList.length,fd:Math.round(Math.hypot(window.__far.x-p.x,window.__far.y-p.y))})})()`).then(JSON.parse);
 const ser=[];const T=Date.now();
 for(let i=0;i<24;i++){await b.sleep(250);const r=await rec();r.t=((Date.now()-T)/1000).toFixed(1);ser.push(r);}
 console.log('phase1 (no cursor) circle belief series',ser.map(r=>r.t+':'+(r.circ||'-')+'/'+r.a+(r.host?'H':'')+(r.alive?'':'DEAD')).join(' '));
 const pos=await b.ev(`JSON.stringify([Math.round(window.__tp.x),Math.round(window.__tp.y)])`);const pp=JSON.parse(pos);
 await b.ev(`(function(){window.__mm=null;window.addEventListener('mousemove',function(e){window.__mm=[e.clientX,e.clientY,e.target===document.querySelector('canvas')?1:0]},true);document.querySelector('canvas').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:${pp[0]+12},clientY:${pp[1]}}));return 1})()`);
 console.log('cursor placed next to parasite',pp,await b.ev('JSON.stringify(window.__mm)'));
 const s2=[];const T2=Date.now();
 for(let i=0;i<48;i++){await b.sleep(250);const r=await rec();r.t=((Date.now()-T2)/1000).toFixed(1);s2.push(r);}
 console.log('phase2 (cursor beside parasite) series',s2.map(r=>r.t+':'+(r.circ||'-')+'/'+r.a+(r.alive?'':'DEAD')+(r.host?'H':'')).join(' '));
 console.log('far cell dist min/max',Math.min(...ser.concat(s2).map(r=>r.fd)),Math.max(...ser.concat(s2).map(r=>r.fd)));console.log('cells min/max',Math.min(...ser.concat(s2).map(r=>r.cells)),Math.max(...ser.concat(s2).map(r=>r.cells)),'errs',b.errs.length);
 }finally{b.close();srv.close();process.exit(0);}})();
