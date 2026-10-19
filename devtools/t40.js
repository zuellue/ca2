const L=require('/tmp/cdplib.js');const fs=require('fs');
(async()=>{const b=await L.launch(9482,'http://localhost:8765/index.html',[]);await b.sleep(5000);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;a.P.areaMin=0.3;a.P.areaMax=1;a.cont.rawW=500;a.cont.rawH=300;a.clampTargets();})()");await b.sleep(5000);
await b.ev("window.__sp=[];(function f(){var cs=window.__ca2.getCells(),s=0;cs.forEach(function(c){s+=Math.hypot(c.vx,c.vy)});window.__sp.push([window.__ca2.drag()?1:0,s/cs.length]);requestAnimationFrame(f)})()");
const k=JSON.parse(await b.ev("JSON.stringify(window.__ca2.cont)"));const ry=k.y+Math.round(k.h/2);
await b.sleep(5000);
await b.mouse(k.x+k.w,ry,'mousePressed',{button:'left',buttons:1,clickCount:1});
for(let i=1;i<=14;i++){await b.mouse(k.x+k.w+(i%2?i*5:-i*5),ry,'mouseMoved',{buttons:1});await b.sleep(400)}
await b.mouse(k.x+k.w,ry,'mouseReleased',{button:'left'});await b.sleep(3000);
console.log(await b.ev("(function(){var s=window.__sp,m=function(f){var a=s.filter(function(x){return x[0]==f}).map(function(x){return x[1]});return a.length?+(a.reduce(function(p,q){return p+q},0)/a.length).toFixed(2):null};return JSON.stringify({idleAvg:m(0),dragAvg:m(1),nIdle:s.filter(function(x){return !x[0]}).length,nDrag:s.filter(function(x){return x[0]}).length})})()"));
await b.ev("document.getElementById('panel').classList.add('open')");await b.sleep(1500);
const r=await b.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/downloads/panel_fix2.png',Buffer.from(r.data,'base64'));
console.log(await b.ev("JSON.stringify([...document.querySelectorAll('.stats span')].map(e=>[e.textContent,e.scrollWidth>e.clientWidth,Math.round(e.getBoundingClientRect().right)]))"),await b.ev("Math.round(document.getElementById('panel').getBoundingClientRect().right)+' '+innerWidth"),b.errs);b.close();process.exit(0)})();
