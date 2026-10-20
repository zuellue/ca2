const H=require('/home/sandbox/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8793);const b=await H.launch(9533,'http://localhost:8793/index.html?perf=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(6000);
console.log('boot wc:',await b.ev('JSON.stringify({ok:__ca2.WC.ok,simd:__ca2.WC.simd})'));
await b.ev('__ca2.P.foodMode=5; "set5"');await b.sleep(9000);
console.log('mode5:',await b.ev('JSON.stringify({food:__ca2.getFood().length,pf:__ca2.PF})'));
await b.ev('__ca2.P.foodMode=4; "set4"');await b.sleep(9000);
console.log('mode4:',await b.ev('JSON.stringify({food:__ca2.getFood().length,pf:__ca2.PF})'));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
