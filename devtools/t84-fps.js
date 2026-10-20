const H=require('/home/sandbox/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8801);const b=await H.launch(9541,'http://localhost:8801/index.html?perf=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(7000);
await b.ev('window.__fc=0;(function c(){window.__fc++;requestAnimationFrame(c)})();"ok"');
await b.ev('__ca2.P.foodMode=4;"m4"');await b.sleep(8000);
const a=await b.ev('JSON.stringify({fc:window.__fc,wm:__ca2.WC.fwWm||0,pa:__ca2.WC.fwPa||0,food:__ca2.getFood().length,worms:(__ca2.getWorms?__ca2.getWorms().length:-1)})');
await b.sleep(6000);
const z=await b.ev('JSON.stringify({fc:window.__fc,wm:__ca2.WC.fwWm||0,pa:__ca2.WC.fwPa||0,food:__ca2.getFood().length})');
console.log('t0',a);console.log('t1',z);
const A=JSON.parse(a),Z=JSON.parse(z);
console.log('fps',((Z.fc-A.fc)/6).toFixed(1),'wm/s',((Z.wm-A.wm)/6).toFixed(1),'pa/s',((Z.pa-A.pa)/6).toFixed(1));
console.log('pf:',await b.ev('JSON.stringify(__ca2.PF)'));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
