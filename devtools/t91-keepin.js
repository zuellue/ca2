const H=require('/home/sandbox/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8811);const b=await H.launch(9551,'http://localhost:8811/index.html?perf=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(5000);
console.log(await b.ev('(()=>{const f=__ca2.getFood();f.push({x:-500,y:-500,r:0.5,vx:1,vy:1});return "stray added, food="+f.length})()'));
await b.sleep(3000);
console.log(await b.ev('JSON.stringify({fwKp:__ca2.WC.fwKp||0,err:(__ca2.WC.fwKpErr||"").slice(0,80),last:__ca2.getFood()[__ca2.getFood().length-1]})'));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
