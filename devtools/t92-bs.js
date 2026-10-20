const H=require('/home/sandbox/ca2/devtools/harness.js');
const flag=process.argv[2]||'';
(async()=>{const s=await H.serve(8812);const b=await H.launch(9552,'http://localhost:8812/index.html?perf=1'+flag,[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(9000);
console.log(await b.ev('JSON.stringify({src:__ca2.srcStat(),fwBs:__ca2.WC.fwBs||0,err:(__ca2.WC.fwBsErr||"").slice(0,90),cells:__ca2.cells,simui:+__ca2.PF["sim+ui draw"].toFixed(3)})'));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
