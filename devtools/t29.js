const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9471,'http://localhost:8765/index.html',[]);await b.sleep(3000);
await b.ev("(function(){var a=window.__ca2;a.P.showFood=1;a.P.foodMode=2;window.onerror=function(m){window.__e=m};})()");
await b.sleep(5000);
console.log(await b.ev("JSON.stringify({bl:window.__ca2.blobs.length,st:window.__ca2.blobStat,food:window.__ca2.getFood().length,e:window.__e||null,dens:window.__ca2.P.foodDensity,life:window.__ca2.P.foodLifeMs})"),b.errs);
b.close();process.exit(0)})();
