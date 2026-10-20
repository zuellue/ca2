const H=require('./harness.js');
(async()=>{const s=await H.serve(8779);const b=await H.launch(9521,'http://localhost:8779/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(1500);
for(const k of ['textScale','fps','resolution']){const r=JSON.parse(await b.ev(`JSON.stringify(__ca2.liveTest(${JSON.stringify(k)},600))`));
console.log(k,'meanStep',r.meanStep.toFixed(4),'cov',r.coverage20.toFixed(2),'maxRun',r.maxRunGens);}
b.close();s.close();process.exit(0)})();
