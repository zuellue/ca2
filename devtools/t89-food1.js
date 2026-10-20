// t89: live engagement + perf of the wasm mode-1 food step (stepFoodW / fd1.rs).
const H=require('/home/sandbox/ca2/devtools/harness.js');
const flag=process.argv[2]||'';
(async()=>{const s=await H.serve(8809);const b=await H.launch(9549,'http://localhost:8809/index.html?perf=1'+flag,[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(5000);
console.log('switch:',await b.ev('__ca2.setKey("foodMode",1);"ok"'));
for(let i=0;i<12;i++){await b.sleep(1500);
  console.log(i,await b.ev('JSON.stringify({food:__ca2.getFood().length,foodStep:+__ca2.PF["food step"].toFixed(4),steps:__ca2.foodStat.steps,born:__ca2.foodStat.born,died:__ca2.foodStat.died,inflow:__ca2.foodStat.inflow,fwFd:__ca2.WC.fwFd||0,err:(__ca2.WC.fwFdErr||"").slice(0,80)})'));}
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
