const H=require('/home/sandbox/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8799);const b=await H.launch(9539,'http://localhost:8799/index.html?perf=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(7000);
const rd=async()=>await b.ev('JSON.stringify({mode:__ca2.P.foodMode,food:__ca2.getFood().length,fwSp:__ca2.WC.fwSp||0,fwWm:__ca2.WC.fwWm||0,fwPa:__ca2.WC.fwPa||0,spE:(__ca2.WC.fwSpErr||"").slice(0,200),wmE:(__ca2.WC.fwWmErr||"").slice(0,200),paE:(__ca2.WC.fwPaErr||"").slice(0,200),f:+__ca2.PF["food step"].toFixed(3)})');
console.log('M3:',await rd());
await b.ev('__ca2.P.foodMode=4;"m4"');await b.sleep(15000);
console.log('M4:',await rd());
await b.ev('__ca2.P.foodMode=5;"m5"');await b.sleep(15000);
console.log('M5:',await rd());
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
