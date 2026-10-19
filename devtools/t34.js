const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9476,'http://localhost:8765/index.html',[]);await b.sleep(3000);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;a.P.areaMin=1;a.P.areaMax=1;a.P.plateOverlap=0.25;a.P.cellMorphMs=800;})()");
await b.mouse(5,5);
for(let i=0;i<3;i++){await b.ev("(function(){var bs=document.querySelectorAll('button');for(var i=0;i<bs.length;i++)if(bs[i].textContent==='respawn'){bs[i].click();return}})()");await b.sleep(5000);
console.log(await b.ev("(function(){var a=window.__ca2,k=a.cont;return JSON.stringify({plate:[Math.round(k.x),Math.round(k.y),Math.round(k.w),Math.round(k.h)],W:a.W,H:a.H,topInkBottom:Math.round(a.topInkBottom),botInkTop:Math.round(a.botInkTop),overTop:Math.round(a.topInkBottom-k.y),overBot:Math.round(k.y+k.h-a.botInkTop),leftEdge:Math.round(k.x),rightGap:Math.round(a.W-k.x-k.w)})})()"))}
console.log(await b.ev("JSON.stringify({sideW:0,textH:window.__ca2.topInkBottom-window.__ca2.margin,margin:window.__ca2.margin})"),b.errs);b.close();process.exit(0)})();
