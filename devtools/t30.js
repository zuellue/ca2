const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9472,'http://localhost:8765/index.html',[]);await b.sleep(3000);
await b.ev("(function(){var a=window.__ca2;a.P.showFood=1;a.P.foodMode=2;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;a.P.cellMorphMs=1500;})()");
await b.mouse(5,5);await b.sleep(4000);
const q=async()=>JSON.parse(await b.ev("(function(){var a=window.__ca2,k=a.cont,f=a.getFood(),o=0;f.forEach(function(d){if(d.x<k.x-0.5||d.x>k.x+k.w+0.5||d.y<k.y-0.5||d.y>k.y+k.h+0.5)o++});return JSON.stringify({n:f.length,out:o,bl:a.blobs.length,w:Math.round(k.w),h:Math.round(k.h),cells:a.cells})})()"));
console.log('pre',JSON.stringify(await q()));
await b.ev("(function(){var bs=document.querySelectorAll('button');for(var i=0;i<bs.length;i++)if(bs[i].textContent==='respawn'){bs[i].click();return}})()");
let bad=0;const r=[];for(let i=0;i<8;i++){await b.sleep(700);const x=await q();bad+=x.out;r.push(x.w+'x'+x.h+':n'+x.n+'/b'+x.bl+'/c'+x.cells)}
console.log('respawn out',bad,r.join(' | '));
await b.sleep(2500);
const shot=await b.send('Page.captureScreenshot',{format:'png'});require('fs').writeFileSync('/tmp/food_blobs.png',Buffer.from(shot.data,'base64'));
console.log(JSON.stringify(await q()),b.errs);b.close();process.exit(0)})();
