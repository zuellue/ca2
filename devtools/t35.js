const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9477,'http://localhost:8765/index.html',[]);await b.sleep(3000);
await b.mouse(5,5);
console.log(await b.ev("(function(){var a=window.__ca2,k=a.cont;a.P.areaMin=1;a.P.areaMax=1;k.rawW=1e5;k.rawH=1e5;a.clampTargets();return JSON.stringify({tw:k.tw,th:k.th})})()"));
await b.sleep(9000);
console.log(await b.ev("(function(){var a=window.__ca2,k=a.cont;return JSON.stringify({W:a.W,H:a.H,plate:[k.x,k.y,k.w,k.h].map(Math.round),topInkBottom:a.topInkBottom,botInkTop:a.botInkTop,margin:a.margin})})()"),b.errs);b.close();process.exit(0)})();
