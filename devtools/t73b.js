const H=require('./harness.js');
(async()=>{const s=await H.serve(8779);const b=await H.launch(9521,'http://localhost:8779/index.html?nosim=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
const r=await b.ev(`(function(){try{return JSON.stringify(__ca2.liveTest('fps',50))}catch(e){return 'ERR '+e.message+' | '+e.stack.split('\\n')[1]}})()`);
console.log(r);
b.close();s.close();process.exit(0)})();
