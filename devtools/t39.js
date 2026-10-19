const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9481,'http://localhost:8765/index.html',[]);await b.sleep(5000);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;a.P.areaMin=0.3;a.P.areaMax=1;a.cont.rawW=500;a.cont.rawH=300;a.clampTargets();})()");await b.sleep(6000);
const st=()=>b.ev("(function(){var a=window.__ca2,k=a.cont,cs=a.getCells(),sp=0;cs.forEach(function(c){sp+=Math.hypot(c.vx,c.vy)});return JSON.stringify({plate:[k.x,k.y,k.w,k.h],avgSpeed:+(sp/cs.length).toFixed(3),n:cs.length,drag:a.drag()})})()");
console.log('before',await st());
const k=JSON.parse(await b.ev("JSON.stringify(window.__ca2.cont)"));const ry=k.y+Math.round(k.h/2);
await b.mouse(k.x+k.w,ry,'mousePressed',{button:'left',buttons:1,clickCount:1});console.log('down',await st());
for(let i=1;i<=14;i++){await b.mouse(k.x+k.w+i*60,ry,'mouseMoved',{buttons:1});await b.sleep(400)}
console.log('dragging',await st());
await b.mouse(k.x+k.w+840,ry,'mouseReleased',{button:'left'});await b.sleep(1500);
console.log('after',await st(),b.errs);b.close();process.exit(0)})();
