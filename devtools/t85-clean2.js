const H=require('/home/sandbox/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8803);const b=await H.launch(9543,'http://localhost:8803/index.html?perf=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(7000);
console.log('trim:',await b.ev('__ca2.P.grain=0;__ca2.P.audioOn=0;__ca2.P.showAxis=0;__ca2.P.metaballStrength=0;"ok"'));
await b.ev('window.__fc=0;(function c(){window.__fc++;requestAnimationFrame(c)})();"ok"');
const rd=async()=>await b.ev('JSON.stringify({fc:window.__fc,food:__ca2.getFood().length,fwWm:__ca2.WC.fwWm||0,fwSp:__ca2.WC.fwSp||0,f:+__ca2.PF["food step"].toFixed(3),sp:+__ca2.PF["sim loop+parasites"].toFixed(3),draw:+__ca2.PF["sim+ui draw"].toFixed(3)})');
const flag=async on=>await b.ev('history.replaceState(null,"","?perf=1'+(on?'&nofoodwasm=1':'')+'");"ok"');
async function meas(label,secs){const a=JSON.parse(await rd());await b.sleep(secs*1000);const z=JSON.parse(await rd());console.log(label,'fps='+((z.fc-a.fc)/secs).toFixed(1),'food='+z.food,'f='+z.f,'sp='+z.sp,'draw='+z.draw,'fwWm/s='+((z.fwWm-a.fwWm)/secs).toFixed(1),'fwSp/s='+((z.fwSp-a.fwSp)/secs).toFixed(1));}
await b.ev('__ca2.P.foodMode=4;"m4"');await b.sleep(4000);await flag(true);await b.sleep(10000);await meas('M4 js  ',10);
await flag(false);await b.sleep(10000);await meas('M4 wasm',10);
await b.ev('__ca2.P.foodMode=5;"m5"');await b.sleep(4000);await flag(true);await b.sleep(10000);await meas('M5 js  ',10);
await flag(false);await b.sleep(10000);await meas('M5 wasm',10);
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
