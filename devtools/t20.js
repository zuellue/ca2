const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9423,'http://localhost:8765/index.html',[]);await b.sleep(2500);
await b.ev("(function(){var a=window.__ca2;a.P.showFood=1;a.P.minRefreshInterval=9999;a.P.maxRefreshInterval=9999;a.P.cellMorphMs=1500;})()");
await b.mouse(5,5);
const q=async()=>JSON.parse(await b.ev("(function(){var a=window.__ca2,k=a.cont,f=a.getFood(),o=0;f.forEach(function(d){if(d.x<k.x-1||d.x>k.x+k.w+1||d.y<k.y-1||d.y>k.y+k.h+1)o++});return JSON.stringify({food:f.length,outside:o,born:a.foodStat.born,died:a.foodStat.died,steps:a.foodStat.steps,plate:[Math.round(k.w),Math.round(k.h)],ate:0})})()"));
console.log('t0',JSON.stringify(await q()));
await b.sleep(6000);console.log('4s',JSON.stringify(await q()));
// morph: shrink/grow plate via respawn, sample outside
for(const life of [1,0]){
 await b.ev(`window.__ca2.P.foodLife=${life}`);
 const mx=[];await b.ev("(function(){var bs=document.querySelectorAll('button');for(var i=0;i<bs.length;i++)if(bs[i].textContent==='respawn'){bs[i].click();return}})()");
 for(let i=0;i<12;i++){await b.sleep(250);const r=await q();mx.push(r.outside+'/'+r.food+'@'+r.plate.join('x'));}
 console.log('life',life,mx.join(' '));
}
console.log(b.errs);b.close();process.exit(0)})();
