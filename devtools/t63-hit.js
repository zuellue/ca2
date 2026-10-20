const H=require('./harness.js');
(async()=>{const s=await H.serve(8775);const b=await H.launch(9517,'http://localhost:8775/index.html',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(2500);
await b.ev("document.getElementById('panel').classList.add('open');'ok'");await b.sleep(2000);
const p=JSON.parse(await b.ev("(function(){var r=document.querySelectorAll('#swl .swc')[1].getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()"));
console.log('p',p);
console.log('at',await b.ev(`(function(){var e=document.elementFromPoint(${p.x},${p.y});return e?e.className+'|'+e.tagName:'null'})()`));
console.log('domclick',await b.ev("(function(){document.querySelectorAll('#swl .swc')[1].click();return JSON.stringify({on:__ca2.P.swLineColor,line:__ca2.P.lineColor,lbl:document.querySelectorAll('#swl .swr span')[1].style.opacity})})()"));
b.close();s.close();process.exit(0)})();
