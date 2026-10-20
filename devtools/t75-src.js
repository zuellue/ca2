const H=require('./harness.js');
(async()=>{const s=await H.serve(8779);const b=await H.launch(9521,'http://localhost:8779/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
console.log('servedHasNewSpeed',await b.ev(`fetch('ca2.js').then(r=>r.text()).then(t=>t.includes('1.8 / Math.sqrt'))`));
const r=JSON.parse(await b.ev(`JSON.stringify(__ca2.liveTest('textScale',600))`));
console.log('textScale','meanStep',r.meanStep.toFixed(4),'cov',r.coverage20.toFixed(2));
b.close();s.close();process.exit(0)})();
