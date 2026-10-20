// t88: live engagement + perf of the wasm transition pass (transPassW / tr.rs).
// Boots ?perf=1, forces morph transitions, checks WC.fwTr>0 and no fwTrErr, reads stepTrans EMA.
// Then the same with ?nowasm=1 for the before/after.
const H=require('/home/sandbox/ca2/devtools/harness.js');
const flag=process.argv[2]||'';
(async()=>{const s=await H.serve(8808);const b=await H.launch(9548,'http://localhost:8808/index.html?perf=1'+flag,[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(6000);
console.log('idle stepTrans EMA:',await b.ev('__ca2.PF["stepTrans"]'));
console.log('trigger:',await b.ev('__ca2.setKey("minRefreshInterval",3);"ok"'));
for(let i=0;i<12;i++){await b.sleep(1500);
  console.log(i,await b.ev('JSON.stringify({tr:!!__ca2.trans,st:+__ca2.PF["stepTrans"].toFixed(4),cells:__ca2.cells,fwTr:__ca2.WC.fwTr||0,err:(__ca2.WC.fwTrErr||"").slice(0,80)})'));}
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
