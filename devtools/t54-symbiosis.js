// symbiosis + symbiogenesis: pair bonds form, co-move, fusions create composites; switches exist with one-word states.
const H=require('./harness.js');
(async()=>{const s=await H.serve(8766);const b=await H.launch(9508,'http://localhost:8766/index.html',[]);
for(let i=0;i<30;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(4000);
const sw=await b.ev(`(function(){var rows=[].slice.call(document.querySelectorAll('.chk')).map(function(r){return r.textContent});var t=rows.filter(function(x){return /symbiosis|symbiogenesis/.test(x)});return JSON.stringify({total:rows.length,found:t})})()`);
console.log('switches',sw);
await b.ev("__ca2.P.mergeChance=0.3;__ca2.P.interactionRadius=60;__ca2.P.eatChance=0;'ok'");
for(let i=0;i<10;i++){await b.sleep(2500);const r=await b.ev("JSON.stringify({pairs:__ca2.pairs,pairings:__ca2.pairings,fusions:__ca2.fusions,composites:__ca2.composites,cells:__ca2.cells})");console.log(i,r);const o=JSON.parse(r);if(o.fusions>0&&o.pairings>0)break;}
// co-movement check: pair members should converge in velocity
const cm=await b.ev(`(function(){var cs=__ca2.getCells(),out=null;for(var i=0;i<cs.length;i++){var c=cs[i];if(c.sym&&c.sym.alive&&c.sym.sym===c){out={dv:Math.hypot(c.vx-c.sym.vx,c.vy-c.sym.vy),d:Math.hypot(c.x-c.sym.x,c.y-c.sym.y),want:(c.radius+c.sym.radius)*1.4};break;}}return JSON.stringify(out)})()`);
console.log('pair kinematics',cm);
// toggling off clears bonds
await b.ev("(function(){var rows=[].slice.call(document.querySelectorAll('.chk'));var r=rows.find(function(x){return /symbiosis/.test(x.textContent)});r.querySelector('input').click();return 'clicked'})()");
await b.sleep(1200);
console.log('after off',await b.ev("JSON.stringify({on:__ca2.P.symbiosisOn,pairs:__ca2.pairs})"));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})();
