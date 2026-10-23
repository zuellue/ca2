// live check: plate grown over the title, hostless parasite placed beside a glyph circle believes it. node devtools/t-circle-live.js
const H=require('./harness.js'),D=require('./dbg-inject.js'),fs=require('fs');
(async()=>{const srv=await D.serve(8810),b=await H.launch(8811,'http://127.0.0.1:8810/index.html?simab=1',[]);try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:760,height:460,deviceScaleFactor:1,mobile:false});
 await b.sleep(8000);
 await b.ev(`__ca2.P.grain=0;__ca2.P.parasiteSize=3;__ca2.P.UNIVERSE_SIZE=2;__ca2.P.parasiteHardMs=1500;__ca2.P.parasiteHard=0.05;0`);
 await b.sleep(2000);
 console.log('before',await b.ev(`JSON.stringify({cont:[__ca2.contBox.x,__ca2.contBox.y,__ca2.contBox.w,__ca2.contBox.h,__ca2.contBox.tw,__ca2.contBox.th],inPlate:__ca2.circleList.filter(function(c){var b=__ca2.contBox;return Math.hypot(c.x-Math.max(b.x,Math.min(c.x,b.x+b.w)),c.y-Math.max(b.y,Math.min(c.y,b.y+b.h)))<c.r}).length,circles:__ca2.circleList.length})`));
 await b.ev(`(function(){var c=__ca2.contBox;c.tw=720;c.th=440;return 1})()`);
 await b.sleep(4000);
 console.log('after grow',await b.ev(`JSON.stringify({cont:[__ca2.contBox.x,__ca2.contBox.y,__ca2.contBox.w,__ca2.contBox.h],inPlate:__ca2.circleList.filter(function(c){var b=__ca2.contBox;return Math.hypot(c.x-Math.max(b.x,Math.min(c.x,b.x+b.w)),c.y-Math.max(b.y,Math.min(c.y,b.y+b.h)))<c.r}).length})`));
 console.log('setup',await b.ev(`(function(){var B=__ca2.contBox,best=null,bd=-1,cells=__ca2.cellList.filter(function(c){return c.alive});
  __ca2.circleList.forEach(function(c){if(Math.hypot(c.x-Math.max(B.x,Math.min(c.x,B.x+B.w)),c.y-Math.max(B.y,Math.min(c.y,B.y+B.h)))>=c.r)return;var m=1e9;cells.forEach(function(q){m=Math.min(m,Math.hypot(q.x-c.x,q.y-c.y))});if(m>bd){bd=m;best=c}});
  if(!best)return 'no circle in plate'; cells.forEach(function(c){c.maxSpeed=0.02;c.vx=0;c.vy=0});
  __ca2.P.parasiteSight=Math.max(20,Math.min(bd*0.8,60));__ca2.parasiteList.length=0;
  var tp={x:best.x+25,y:best.y+25,e:8,host:null,a:0,ph:1,lost:performance.now()};window.__tp=tp;__ca2.parasiteList.push(tp);
  return JSON.stringify({key:best.key,r:Math.round(best.r),nearestCell:Math.round(bd),sight:__ca2.P.parasiteSight})})()`));
 for(let i=0;i<48;i++){await b.sleep(250);console.log(i,await b.ev(`(function(){var p=window.__tp,alive=__ca2.parasiteList.indexOf(p)>=0,c=p.circ;return JSON.stringify({alive:alive,circ:c?c.key:null,d:c?Math.round(Math.hypot(c.x-p.x,c.y-p.y)):null,host:!!p.host,e:+p.e.toFixed(2),sp:+(p.sp||0).toFixed(2),fp:+(p.fp||0).toFixed(1)})})()`));
  if(i==6){const r=await b.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/downloads/circle-live.png',Buffer.from(r.data,'base64'));}}
 console.log('errs',b.errs.length);
 }finally{b.close();srv.close();process.exit(0);}})();
