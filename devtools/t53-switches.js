// switches: short labels (<=3 words, no parens), one-word states, hover reaction from a pool
const H=require('./harness.js');
(async()=>{const s=await H.serve(8765);const b=await H.launch(9506,'http://localhost:8765/index.html#open',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(1000);
console.log('audit:',await b.ev(`(function(){var bad=[],rows=[...document.querySelectorAll('#controls .chk')];rows.forEach(function(l){var sp=l.querySelector('span'),bb=l.querySelector('b');if(!sp||!bb)return;var w=sp.textContent.trim().split(/\\s+/).length;if(w>3||/[()]/.test(sp.textContent))bad.push(sp.textContent);});return JSON.stringify({rows:rows.length,bad:bad,onoff:[...document.querySelectorAll('#controls .chk b')].map(function(x){return x.textContent}).filter(function(t){return t==='on'||t==='off'})})})()`));
// hover reaction: park on the 'grain' switch, sample its inline styles
const r=JSON.parse(await b.ev(`(function(){var rows=[...document.querySelectorAll('#controls .chk')];var l=rows.find(function(x){return x.querySelector('span').textContent==='grain'});l.scrollIntoView({block:'center'});var rc=l.getBoundingClientRect();return JSON.stringify({x:rc.left+rc.width/2,y:rc.top+rc.height/2})})()`));
await b.mouse(r.x,r.y);await b.sleep(300);
let changed=0,last='';for(let i=0;i<8;i++){const st=await b.ev(`(function(){var rows=[...document.querySelectorAll('#controls .chk')];var l=rows.find(function(x){return x.querySelector('span').textContent==='grain'});var sp=l.querySelector('span'),bb=l.querySelector('b');return [l.style.color,sp.style.letterSpacing,bb.style.transform,bb.style.opacity].join(';')})()`);if(last&&st!==last)changed++;last=st;await b.sleep(280);}
const word=await b.ev(`(function(){var rows=[...document.querySelectorAll('#controls .chk')];var l=rows.find(function(x){return x.querySelector('span').textContent==='grain'});return l.querySelector('b').textContent})()`);
await b.mouse(2,2);await b.sleep(400);
const restored=await b.ev(`(function(){var rows=[...document.querySelectorAll('#controls .chk')];var l=rows.find(function(x){return x.querySelector('span').textContent==='grain'});var sp=l.querySelector('span'),bb=l.querySelector('b');return [l.style.color,sp.style.letterSpacing,bb.style.transform,bb.style.opacity].join(';')})()`);
// click toggles state word to its pair partner
await b.mouse(r.x,r.y);await b.sleep(200);await b.mouse(r.x,r.y,'mousePressed',{button:'left',clickCount:1});await b.mouse(r.x,r.y,'mouseReleased',{button:'left',clickCount:1});await b.sleep(300);
const word2=await b.ev(`(function(){var rows=[...document.querySelectorAll('#controls .chk')];var l=rows.find(function(x){return x.querySelector('span').textContent==='grain'});return l.querySelector('b').textContent})()`);
console.log('hover samples changed:',changed,'/8; grain word:',word,'->',word2,'; restored after leave:',JSON.stringify(restored));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})();
