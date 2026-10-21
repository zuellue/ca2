const H=require('/home/sandbox/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8814);const b=await H.launch(9554,'http://localhost:8814/index.html?perf=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(5000);
console.log('gap:',await b.ev('__ca2.setKey("boundGap",40);"ok"'));
await b.sleep(8000);
for(let i=0;i<3;i++){await b.sleep(6000);console.log('t'+i,await b.ev('(()=>{const cs=__ca2.getCells(),c=__ca2.cont,g=__ca2.P.boundGap;let bad=0,al=0;for(const cell of cs){if(!cell.alive)continue;al++;const rF=Math.max(8,Math.min(c.w,c.h)/2-g),r=Math.min(cell.radius,rF);if(cell.x<c.x+r+g-0.5||cell.x>c.x+c.w-r-g+0.5||cell.y<c.y+r+g-0.5||cell.y>c.y+c.h-r-g+0.5)bad++;}return bad+"/"+al+" past walls"})()'));}
console.log(await b.ev('JSON.stringify({simOn:__ca2.SIMW.on,oob:__ca2.oob,cells:__ca2.cells,boundGap:__ca2.P.boundGap,fwBs:__ca2.WC.fwBs||0,err:(__ca2.WC.fwBsErr||"").slice(0,60)})'));
// containment probe: every alive cell inside gap-adjusted walls?
console.log(await b.ev('(()=>{const cs=__ca2.getCells(),c=__ca2.cont,g=__ca2.P.boundGap;let bad=0;for(const cell of cs){if(!cell.alive)continue;const rF=Math.max(8,Math.min(c.w,c.h)/2-g),r=Math.min(cell.radius,rF);if(cell.x<c.x+r+g-0.5||cell.x>c.x+c.w-r-g+0.5||cell.y<c.y+r+g-0.5||cell.y>c.y+c.h-r-g+0.5)bad++;}return "cells past gap-adjusted walls: "+bad})()'));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
