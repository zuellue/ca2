const H=require('/home/sandbox/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8795);const b=await H.launch(9535,'http://localhost:8795/index.html?perf=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(6000);
async function rd(){return await b.ev('JSON.stringify({mode:__ca2.P.foodMode,food:__ca2.getFood().length,cells:__ca2.cells,simOff:!!__ca2.WC.simOff,f:__ca2.PF["food step"],sp:__ca2.PF["sim loop+parasites"],draw:__ca2.PF["sim+ui draw"]})');}
console.log('BASE wasm:',await rd());
await b.ev('__ca2.WC.simOff=1;"off"');await b.sleep(12000);
console.log('BASE js  :',await rd());
await b.ev('__ca2.WC.simOff=0;"on"');
await b.ev('__ca2.P.foodMode=5;"m5"');await b.sleep(14000);
console.log('M5   wasm:',await rd());
await b.ev('__ca2.WC.simOff=1;"off"');await b.sleep(14000);
console.log('M5   js  :',await rd());
await b.ev('__ca2.WC.simOff=0;"on"');
await b.ev('__ca2.P.foodMode=4;"m4"');await b.sleep(14000);
console.log('M4   wasm:',await rd());
await b.ev('__ca2.WC.simOff=1;"off"');await b.sleep(14000);
console.log('M4   js  :',await rd());
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
