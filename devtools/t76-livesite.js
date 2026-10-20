const H=require('./harness.js');
(async()=>{console.log('launching');const b=await H.launch(9521,'https://ca.abdupala.com/index.html?nosim=1#open',[]);
let ok=false;for(let i=0;i<90;i++){await b.sleep(1000);const t=await b.ev('typeof window.__ca2');if(t==='object'){ok=true;break;}if(i%10===9)console.log('waiting',i+1);}
console.log('ca2 ready:',ok);
if(!ok){b.close();process.exit(1);}
await b.sleep(3000);
console.log('swl exists:',await b.ev("!!document.getElementById('swl')"));
for(let i=0;i<25;i++){await b.sleep(400);var tf=await b.ev("getComputedStyle(document.getElementById('swl')).transform");if(tf==='matrix(1, 0, 0, 1, 0, 0)')break;}
console.log('struct',await b.ev("JSON.stringify({laneTf:getComputedStyle(document.getElementById('swl')).transform,circles:document.querySelectorAll('#swl .swc').length,nativeColor:document.querySelectorAll('input[type=color]').length,overlay:document.querySelectorAll('.cswatch').length})"));
const p=JSON.parse(await b.ev("(function(){var r=document.querySelectorAll('#swl .swc')[3].getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()"));
await b.mouse(p.x,p.y);await b.sleep(300);
console.log('hover',await b.ev("document.querySelectorAll('#swl .swc')[3].style.background"));
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(900);
console.log('on',await b.ev("JSON.stringify({on:__ca2.P.swCircColor,circ:__ca2.P.circColor,lbl:document.querySelectorAll('#swl .swr span')[3].style.opacity})"));
await b.shot('/tmp/live-swatch.png');
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(900);
console.log('off',await b.ev("JSON.stringify({on:__ca2.P.swCircColor,circ:__ca2.P.circColor,fill:document.querySelectorAll('#swl .swc')[3].style.background})"));
b.close();process.exit(0)})();
