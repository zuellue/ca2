const H=require('/home/sandbox/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8807);const b=await H.launch(9547,'http://localhost:8807/index.html?perf=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(8000);
console.log('idle stepTrans:',await b.ev('__ca2.PF["stepTrans"]'));
console.log('trigger:',await b.ev('__ca2.setKey("minRefreshInterval",3);"ok"'));
for(let i=0;i<10;i++){await b.sleep(1500);console.log(i,await b.ev('JSON.stringify({tr:__ca2.trans,st:+__ca2.PF["stepTrans"].toFixed(3),cells:__ca2.cells})'));}
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
