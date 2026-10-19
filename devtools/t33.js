const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9475,'http://localhost:8765/index.html',[]);await b.sleep(3000);
await b.ev("(function(){var a=window.__ca2;a.P.foodMode=1;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;a.P.cellMorphMs=1500;a.P.areaMin=0.1;})()");
await b.mouse(5,5);await b.sleep(3000);
await b.ev("(function(){var bs=document.querySelectorAll('button');for(var i=0;i<bs.length;i++)if(bs[i].textContent==='respawn'){bs[i].click();return}})()");
const r=[];let out=0;for(let i=0;i<14;i++){await b.sleep(900);const x=JSON.parse(await b.ev("(function(){var a=window.__ca2,k=a.cont,f=a.getFood(),o=0;f.forEach(function(d){if(d.x<k.x-.5||d.x>k.x+k.w+.5||d.y<k.y-.5||d.y>k.y+k.h+.5)o++});return JSON.stringify({n:f.length,o:o,w:Math.round(k.w),h:Math.round(k.h)})})()"));out+=x.o;r.push(x.w+'x'+x.h+':'+x.n)}
console.log('outside',out,r.join(' '),b.errs);b.close();process.exit(0)})();
