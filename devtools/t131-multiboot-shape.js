const {serve,launch}=require('./harness.js');
const q=process.argv[2]||'',port=+process.argv[3];
(async()=>{const s=await serve(port);const h=await launch(port+1000,'http://127.0.0.1:'+port+'/index.html?'+q,[]);
for(let i=0;i<45&&!(await h.ev('!!window.__ca2'));i++)await h.sleep(1000);
await h.sleep(2000);await h.ev("__ca2.setKey('autoQuality',0);1");await h.sleep(50000);
console.log(q||'wasm',await h.ev(`(function(){var c=__ca2.getCells(),t=[0,0,0];c.forEach(function(k){if(k.shp)t[k.shp.t]++});return JSON.stringify({n:c.length,round:t[0],lobed:t[2],births:__ca2.births,sim:__ca2.SIMW.on})})()`),JSON.stringify(h.errs));
h.close();s.close();process.exit(0)})();
