const H=require('./harness.js');
(async()=>{const s=await H.serve(8779);const b=await H.launch(9521,'http://localhost:8779/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(1500);
const keys=['fps','resolution','margin','textScale','cursorLockMs','morphEase','grainAmount','audioVol','audioTone','boundZone','foodDensity','baseMaxSpeed'];
for(const k of keys){const r=JSON.parse(await b.ev(`JSON.stringify(__ca2.liveTest(${JSON.stringify(k)},600))`));
console.log(k,'steps',Math.round((r.max-r.min)/((r.seenMax-r.seenMax)+1)),'meanStep',r.meanStep.toFixed(4),'cov',r.coverage20.toFixed(2),'maxRun',r.maxRunGens);}
b.close();s.close();process.exit(0)})();
