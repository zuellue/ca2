const H=require('./harness.js');
(async()=>{const s=await H.serve(8774);const b=await H.launch(9516,'http://localhost:8774/index.html',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(2500);
await b.ev("document.getElementById('panel').classList.add('open');'ok'");await b.sleep(2500);
const p=JSON.parse(await b.ev("(function(){var r=document.querySelectorAll('#swl .swc')[1].getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()"));
await b.mouse(p.x,p.y);await b.sleep(200);await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
console.log(await b.ev("JSON.stringify({tf:getComputedStyle(document.getElementById('swl')).transform,on:__ca2.P.swLineColor,line:__ca2.P.lineColor})"));for(let i=0;i<4;i++){await b.sleep(150);console.log(await b.ev("(function(){var sp=document.querySelectorAll('#swl .swr span')[1];return JSON.stringify({inline:sp.style.opacity,comp:getComputedStyle(sp).opacity,txt:sp.textContent})})()"));}
console.log('errs',b.errs.slice(0,2));b.close();s.close();process.exit(0)})();
