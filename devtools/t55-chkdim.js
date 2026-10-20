// switch hover: ONLY the right-hand state value dims; no other effect. (owner 21 Oct)
const H=require('./harness.js');
(async()=>{const s=await H.serve(8767);const b=await H.launch(9509,'http://localhost:8767/index.html',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
await b.ev("document.getElementById('panel').classList.add('open');'ok'");await b.sleep(900);
const read=`(function(){var l=document.querySelectorAll('.chk')[2],sp=l.querySelector('span'),bb=l.querySelector('b'),cs=getComputedStyle(l),csb=getComputedStyle(bb),cssp=getComputedStyle(sp);
return JSON.stringify({rowColor:cs.color,bOp:csb.opacity,bTf:csb.transform,spLs:cssp.letterSpacing,spOp:cssp.opacity,inline:l.style.cssText+'|'+bb.style.cssText+'|'+sp.style.cssText})})()`;
console.log('before',await b.ev(read));
await b.ev("document.querySelectorAll('.chk')[2].scrollIntoView({block:'center'});'ok'");await b.sleep(400);
const box=await b.ev("(function(){var r=document.querySelectorAll('.chk')[2].getBoundingClientRect();return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height})})()");
console.log('rect',box);
const p=JSON.parse(box);
await b.mouse(Math.round(p.x),Math.round(p.y));await b.sleep(300);
await b.mouse(Math.round(p.x)+3,Math.round(p.y)+2);await b.sleep(300);
console.log('dbg',await b.ev("(function(){var l=document.querySelectorAll('.chk')[2],r=l.getBoundingClientRect(),e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return JSON.stringify({iw:innerWidth,ih:innerHeight,hov:l.matches(':hover'),at:e?(e.className||e.tagName):null})})()"));
console.log('during',await b.ev(read));
await b.mouse(30,30);await b.sleep(400);
console.log('after ',await b.ev(read));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})();
