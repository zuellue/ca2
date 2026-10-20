// final swatch verification on the real open path (#open), local latest code.
const H=require('./harness.js');
(async()=>{const s=await H.serve(8778);const b=await H.launch(9520,'http://localhost:8778/index.html#open',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3500);
for(let i=0;i<20;i++){await b.sleep(300);var tf=await b.ev("getComputedStyle(document.getElementById('swl')).transform");if(tf==='matrix(1, 0, 0, 1, 0, 0)')break;}
console.log('laneTf',tf);
console.log('struct',await b.ev(`(function(){var cs=document.querySelectorAll('#swl .swc'),iw=innerWidth,onscreen=0,csx=[];
cs.forEach(function(c){var r=c.getBoundingClientRect();if(r.x>0&&r.x+r.width<iw)onscreen++;csx.push(Math.round(r.x))});return JSON.stringify({n:cs.length,onscreen:onscreen,x:csx,native:document.querySelectorAll('input[type=color]').length,overlay:document.querySelectorAll('.cswatch').length})})()`));
const p=JSON.parse(await b.ev("(function(){var r=document.querySelectorAll('#swl .swc')[1].getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()"));
const rect=`(function(){var r=document.querySelectorAll('#swl .swc')[1].getBoundingClientRect();return r.x.toFixed(1)+','+r.y.toFixed(1)})()`;
const r0=await b.ev(rect);
await b.mouse(p.x,p.y);await b.sleep(400);
console.log('hoverFill',await b.ev("document.querySelectorAll('#swl .swc')[1].style.background"),'rectStable',r0===(await b.ev(rect)));
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});await b.sleep(350);
console.log('on',await b.ev("JSON.stringify({on:__ca2.P.swLineColor,line:__ca2.P.lineColor,fill:document.querySelectorAll('#swl .swc')[1].style.background,label:getComputedStyle(document.querySelectorAll('#swl .swr span')[1]).opacity})"));
await b.sleep(1800);console.log('labelAfter',await b.ev("getComputedStyle(document.querySelectorAll('#swl .swr span')[1]).opacity"));
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});await b.sleep(300);
console.log('off',await b.ev("JSON.stringify({on:__ca2.P.swLineColor,line:__ca2.P.lineColor,fill:document.querySelectorAll('#swl .swc')[1].style.background||'none'})"));
await b.shot('/tmp/swfinal.png');
console.log('errs',b.errs.slice(0,2));b.close();s.close();process.exit(0)})();
