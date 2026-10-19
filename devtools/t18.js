const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9421,'http://localhost:8765/index.html',[]);await b.sleep(2500);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;a.P.UNIVERSE_SIZE=30;})()");
await b.mouse(5,5);await b.sleep(500);
const info=JSON.parse(await b.ev("(function(){var a=window.__ca2,k=a.cont,cs=a.getCells();var big=cs.filter(function(c){return c.alive&&c.x>k.x+30&&c.x<k.x+k.w-30&&c.y>k.y+30&&c.y<k.y+k.h-30}).sort(function(x,y){return y.radius-x.radius})[0];cs.forEach(function(c){c.maxSpeed=0;c.vx=c.vy=0});window.frozen=big;var mx=0;cs.forEach(function(c){if(c.alive&&c.radius>mx)mx=c.radius});return JSON.stringify({x:big.x,y:big.y,r:big.radius,mx:mx})})()"));
await b.ev(`window.mxp=${info.x+info.r*0.6};window.myp=${info.y}`);await b.mouse(info.x+info.r*0.6,info.y);
const S=[];for(let i=0;i<40;i++){await b.sleep(60);S.push(JSON.parse(await b.ev("(function(){var i=window.__ca2.cur,c=window.frozen,e=document.getElementById('cur').getBoundingClientRect();var mx=0;window.__ca2.getCells().forEach(function(q){if(q.alive&&q.radius>mx)mx=q.radius});return JSON.stringify({on:i.on,locked:i.locked,rr:+i.rr.toFixed(1),maxR:+mx.toFixed(1),dRing:+Math.hypot(e.left+e.width/2-i.lx,e.top+e.height/2-i.ly).toFixed(1),dMouse:+Math.hypot(e.left+e.width/2-window.mxp,e.top+e.height/2-window.myp).toFixed(1),ringW:+e.width.toFixed(1)})})()")))}
console.log(JSON.stringify(info));S.forEach(s=>console.log(JSON.stringify(s)));console.log(b.errs);
b.close();process.exit(0)})();
