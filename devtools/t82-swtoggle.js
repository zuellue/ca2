const H=require('./harness.js');
(async()=>{const s=await H.serve(8770);const b=await H.launch(9505,'http://localhost:8770/index.html?nosim=1#open',['--user-data-dir=/tmp/cprof-'+Date.now()]);
for(let i=0;i<60;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4000);
await b.ev(`(function(){document.querySelectorAll('#panel .swc')[1].scrollIntoView({block:'center'});return 1})()`);
await b.sleep(800);
const p=JSON.parse(await b.ev(`(function(){var r=document.querySelectorAll('#panel .swc')[1].getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()`));
console.log('at',p,await b.ev(`(function(){var e=document.elementFromPoint(${p.x},${p.y});return e?e.className:'null'})()`));
await b.mouse(p.x,p.y);await b.sleep(250);
console.log('hover',await b.ev("document.querySelectorAll('#panel .swc')[1].style.background"));
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(600);
console.log('on',await b.ev(`(function(){var r=document.querySelectorAll('#panel .swc')[1].parentElement;return JSON.stringify({on:__ca2.P.swLineColor,line:__ca2.P.lineColor,b:r.querySelector('b').textContent,fill:document.querySelectorAll('#panel .swc')[1].style.background})})()`));
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(600);
console.log('off',await b.ev(`(function(){var r=document.querySelectorAll('#panel .swc')[1].parentElement;return JSON.stringify({on:__ca2.P.swLineColor,line:__ca2.P.lineColor,b:r.querySelector('b').textContent,fill:document.querySelectorAll('#panel .swc')[1].style.background})})()`));
await b.shot('/tmp/owner-sw.png');
b.close();s.close();process.exit(0)})();
