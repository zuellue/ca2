const H=require('/home/sandbox/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8805);const b=await H.launch(9545,'http://localhost:8805/index.html',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(6000);
for(const k of ['baseMaxSpeed','audioMod','interactionRadius']){
 console.log(k, await b.ev('(function(){var t0=performance.now();var r=__ca2.liveTest("'+k+'",5000);return JSON.stringify({ms:+(performance.now()-t0).toFixed(1),perGenUs:+((performance.now()-t0)/5000*1000).toFixed(1),cov:r.coverage20})})()'));
}
console.log('cells:',await b.ev('__ca2.cells'));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
