// swatch hover: overlay follows wrapper every rAF; find what moves on hover.
const H=require('./harness.js');
(async()=>{const s=await H.serve(8769);const b=await H.launch(9511,'https://ca.abdupala.com/',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(3000);
await b.ev("document.getElementById('panel').classList.add('open');'ok'");await b.sleep(900);
const loc=await b.ev(`(function(){var sw=document.querySelector('.cswatch');var inp=[].slice.call(document.querySelectorAll('input[type=color]')).find(function(i){return i.dataset.sw});
if(!inp)return 'nosw'; inp.scrollIntoView({block:'center'});var r=inp.parentNode.getBoundingClientRect();return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height})})()`);
console.log('swatch',loc);if(loc==='nosw'){process.exit(1)}
const p=JSON.parse(loc);
const read=`(function(){var sw=[].slice.call(document.querySelectorAll('.cswatch')).find(function(d){return d.style.display!=='none'});if(!sw)return 'hidden';
var r=sw.getBoundingClientRect();return JSON.stringify({x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1)})})()`;
console.log('before ',await b.ev(read));
await b.mouse(Math.round(p.x),Math.round(p.y));
for(let i=0;i<6;i++){await b.sleep(180);console.log('hover'+i,await b.ev(read));}
// where is the pointer actually hovering?
console.log('at',await b.ev(`(function(){var e=document.elementFromPoint(${p.x},${p.y});return e?(e.tagName+'.'+e.className):'null'})()`));
console.log('errs',b.errs.slice(0,3));b.close();s.close();process.exit(0)})();
