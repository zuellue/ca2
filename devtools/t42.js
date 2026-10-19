const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9484,'http://localhost:8765/index.html',[]);await b.sleep(5000);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;a.cont.rawW=500;a.cont.rawH=300;a.clampTargets();})()");await b.sleep(5000);
const st=()=>b.ev("(function(){var a=window.__ca2,k=a.cont;return JSON.stringify({plate:[k.x,k.y,k.w,k.h],W:innerWidth,H:innerHeight})})()");
console.log('before',await st());
let k=JSON.parse(await b.ev("JSON.stringify(window.__ca2.cont)"));let ry=k.y+Math.round(k.h/2);
await b.mouse(k.x+k.w,ry,'mousePressed',{button:'left',buttons:1,clickCount:1});
for(let i=1;i<=12;i++){await b.mouse(k.x+k.w+i*60,ry,'mouseMoved',{buttons:1});await b.sleep(300)}
await b.mouse(1290,ry,'mouseReleased',{button:'left'});await b.sleep(1500);console.log('after H-drag',await st());
k=JSON.parse(await b.ev("JSON.stringify(window.__ca2.cont)"));let rx=k.x+Math.round(k.w/2);
await b.mouse(rx,k.y+k.h,'mousePressed',{button:'left',buttons:1,clickCount:1});
for(let i=1;i<=8;i++){await b.mouse(rx,k.y+k.h+i*30,'mouseMoved',{buttons:1});await b.sleep(300)}
await b.mouse(rx,650,'mouseReleased',{button:'left'});await b.sleep(1500);console.log('after V-drag',await st(),b.errs);b.close();process.exit(0)})();
