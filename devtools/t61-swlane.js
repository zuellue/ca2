// swatch lane: 6 circle switches; off=hollow, on=random RGB applied, hover=black, name flashes on toggle, no motion on hover.
const H=require('./harness.js');
(async()=>{const s=await H.serve(8773);const b=await H.launch(9515,'http://localhost:8773/index.html',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
await b.ev("document.getElementById('panel').classList.add('open');'ok'");await b.sleep(1500);
console.log('struct',await b.ev(`(function(){var cs=document.querySelectorAll('#swl .swc');return JSON.stringify({n:cs.length,native:document.querySelectorAll('input[type=color]').length,overlay:document.querySelectorAll('.cswatch').length,fills:[].slice.call(cs).map(function(c){return c.style.background||'none'})})})()`));
const pos=await b.ev("(function(){var r=document.querySelectorAll('#swl .swc')[1].getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:+r.width.toFixed(1)})})()");
console.log('pos',pos);const p=JSON.parse(pos);
// hover: fill black, rect unchanged
const rect=`(function(){var r=document.querySelectorAll('#swl .swc')[1].getBoundingClientRect();return r.x.toFixed(1)+','+r.y.toFixed(1)})()`;
const r0=await b.ev(rect);
await b.mouse(p.x,p.y);await b.sleep(400);
const r1=await b.ev(rect);
console.log('hover',await b.ev("document.querySelectorAll('#swl .swc')[1].style.background"),'rectStable',r0===r1);
// toggle on
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});await b.sleep(300);
console.log('on   ',await b.ev("JSON.stringify({on:__ca2.P.swLineColor,line:__ca2.P.lineColor,fill:document.querySelectorAll('#swl .swc')[1].style.background,label:+getComputedStyle(document.querySelectorAll('#swl .swr span')[1]).opacity})"));
await b.sleep(1800);
console.log('labelAfter',await b.ev("getComputedStyle(document.querySelectorAll('#swl .swr span')[1]).opacity"));
// toggle off
await b.mouse(p.x,p.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(p.x,p.y,'mouseReleased',{button:'left',clickCount:1});await b.sleep(300);
console.log('off  ',await b.ev("JSON.stringify({on:__ca2.P.swLineColor,line:__ca2.P.lineColor,fill:document.querySelectorAll('#swl .swc')[1].style.background||'none'})"));
await b.shot('/tmp/swlane.png');
console.log('errs',b.errs.slice(0,3));b.close();s.close();process.exit(0)})();
