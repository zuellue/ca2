const H=require('./harness.js');
(async()=>{const s=await H.serve(8779);const b=await H.launch(9521,'http://localhost:8779/index.html#open',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
for(let i=0;i<20;i++){await b.sleep(300);var tf=await b.ev("getComputedStyle(document.getElementById('swl')).transform");if(tf==='matrix(1, 0, 0, 1, 0, 0)')break;}
const p=JSON.parse(await b.ev("(function(){var r=document.querySelectorAll('#swl .swc')[1].getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()"));
await b.mouse(p.x,p.y);await b.sleep(150);
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
for(const t of [400,400,400,400]){await b.sleep(t);console.log('comp',await b.ev("getComputedStyle(document.querySelectorAll('#swl .swr span')[1]).opacity"));}
console.log('after2s',await b.ev("getComputedStyle(document.querySelectorAll('#swl .swr span')[1]).opacity"));
await b.sleep(2500);console.log('afterHide',await b.ev("getComputedStyle(document.querySelectorAll('#swl .swr span')[1]).opacity"));
b.close();s.close();process.exit(0)})();
