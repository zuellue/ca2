const H=require('./harness.js');
(async()=>{const s=await H.serve(8779);const b=await H.launch(9521,'http://localhost:8779/index.html?nosim=1#open',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(2500);
for(let i=0;i<20;i++){await b.sleep(300);var tf=await b.ev("getComputedStyle(document.getElementById('swl')).transform");if(tf==='matrix(1, 0, 0, 1, 0, 0)')break;}
// structural assertions
console.log('struct',await b.ev("JSON.stringify({laneTf:getComputedStyle(document.getElementById('swl')).transform,circles:document.querySelectorAll('#swl .swc').length,nativeColor:document.querySelectorAll('input[type=color]').length,overlay:document.querySelectorAll('.cswatch').length,swInPanel:document.querySelectorAll('#panel .swc').length})"));
const p=JSON.parse(await b.ev("(function(){var r=document.querySelectorAll('#swl .swc')[1].getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()"));
// hover
await b.mouse(p.x,p.y);await b.sleep(250);
const hov=await b.ev("(function(){var c=document.querySelectorAll('#swl .swc')[1];var r=c.getBoundingClientRect();return JSON.stringify({bg:c.style.background,rect:[Math.round(r.x),Math.round(r.width)]})})()");
console.log('hover',hov);
// click
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(700);
console.log('on',await b.ev("JSON.stringify({on:__ca2.P.swLineColor,line:__ca2.P.lineColor,inlineLbl:document.querySelectorAll('#swl .swr span')[1].style.opacity,compLbl:getComputedStyle(document.querySelectorAll('#swl .swr span')[1]).opacity})"));
await b.shot('/tmp/swatch-on.png');
await b.sleep(2200);
console.log('afterHide',await b.ev("getComputedStyle(document.querySelectorAll('#swl .swr span')[1]).opacity"));
// toggle off
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});
await b.sleep(700);
console.log('off',await b.ev("JSON.stringify({on:__ca2.P.swLineColor,line:__ca2.P.lineColor,fill:document.querySelectorAll('#swl .swc')[1].style.background})"));
b.close();s.close();process.exit(0)})();
