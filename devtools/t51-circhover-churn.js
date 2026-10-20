// section circle hover: pointer stays inside the button and keeps moving - the crowd must not restart.
// metric: crowd size + fill sampled from node while the pointer jitters inside the home box, then after exit.
const H=require('./harness.js');
(async()=>{const s=await H.serve(8765);const b=await H.launch(9503,'http://localhost:8765/index.html#open',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(1200);
const pos=await b.ev("(function(){var it=document.querySelectorAll('#secc .sci')[5];var c=it.querySelector('.sc');var r=c.getBoundingClientRect();return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2,w:r.width})})()");
const p=JSON.parse(pos);
const state="(function(){var it=document.querySelectorAll('#secc .sci')[5];var c=it.querySelector('.sc');return it.querySelectorAll('.sc').length+'|'+(c.style.background?'col':'hol')})()";
await b.mouse(2,2);await b.sleep(400);
await b.mouse(p.x,p.y);await b.sleep(400);
const series=[];const t0=Date.now();
while(Date.now()-t0<5000){
  await b.mouse(p.x+(Math.random()-0.5)*5,p.y+(Math.random()-0.5)*5);
  series.push(await b.ev(state));
  await b.sleep(60);
}
const inside=series.join(',');
const collapses=series.filter(x=>x==='1|hol').length;
await b.mouse(2,2);await b.sleep(250);await b.mouse(4,3);await b.sleep(250);await b.mouse(6,6);await b.sleep(2600);
const after=await b.ev(state);
console.log('circle',pos);
console.log('inside samples',series.length,'hollow-1pc collapses while inside:',collapses);
console.log('series',inside);
console.log('after exit',after);console.log('errs',b.errs);b.close();s.close();process.exit(0)})();
