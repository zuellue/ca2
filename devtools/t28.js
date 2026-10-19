const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9470,'http://localhost:8765/index.html',[]);await b.sleep(3000);
await b.ev("(function(){var a=window.__ca2;a.P.showFood=1;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;a.P.cellMorphMs=1500;a.P.areaMin=0.1;})()");
await b.mouse(5,5);
const q=async()=>JSON.parse(await b.ev("(function(){var a=window.__ca2,k=a.cont,f=a.getFood(),o=0,mx=0,my=0;f.forEach(function(d){if(d.x<k.x-0.5||d.x>k.x+k.w+0.5||d.y<k.y-0.5||d.y>k.y+k.h+0.5)o++;mx+=d.x;my+=d.y});mx/=f.length||1;my/=f.length||1;var s=0;f.forEach(function(d){s+=Math.hypot(d.x-mx,d.y-my)});var e=0;f.forEach(function(d){if(Math.min(d.x-k.x,k.x+k.w-d.x,d.y-k.y,k.y+k.h-d.y)<6)e++});return JSON.stringify({n:f.length,out:o,w:Math.round(k.w),h:Math.round(k.h),disp:Math.round(s/(f.length||1)),edgeFrac:+(e/(f.length||1)).toFixed(2),bl:a.blobs.length})})()"));
for(const m of [0,1,2,3]){
 await b.ev(`window.__ca2.P.foodMode=${m}`);await b.sleep(4000);
 const r=[];let bad=0;
 await b.ev("(function(){var bs=document.querySelectorAll('button');for(var i=0;i<bs.length;i++)if(bs[i].textContent==='respawn'){bs[i].click();return}})()");
 for(let i=0;i<8;i++){await b.sleep(700);const x=await q();bad+=x.out;r.push(x.w+'x'+x.h+':n'+x.n+',edge'+x.edgeFrac);}
 console.log('mode',m,'outsideTotal',bad,r.join(' | '));
}
await b.ev("window.__ca2.P.foodMode=2;window.__ca2.P.foodAlpha=1;window.__ca2.P.foodColor='#c86400'");await b.sleep(3000);
const shot=await b.send('Page.captureScreenshot',{format:'png'});require('fs').writeFileSync('/tmp/food_blobs.png',Buffer.from(shot.data,'base64'));
console.log(JSON.stringify(await q()),b.errs);b.close();process.exit(0)})();
