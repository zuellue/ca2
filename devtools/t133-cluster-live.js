const {serve,launch}=require('./harness.js');
const q=process.argv[2]||'',port=+process.argv[3];
(async()=>{const s=await serve(port);const h=await launch(port+1000,'http://127.0.0.1:'+port+'/index.html?'+q,[]);
for(let i=0;i<45&&!(await h.ev('!!window.__ca2'));i++)await h.sleep(1000);
await h.sleep(3000);await h.ev("__ca2.setKey('autoQuality',0);1");
let r;for(let k=0;k<6;k++){await h.sleep(5000);r=await h.ev(`JSON.stringify({n:__ca2.getCells().length,cl:__ca2.getCells().filter(c=>c.cl).length,ids:new Set(__ca2.getCells().filter(c=>c.cl).map(c=>c.cl)).size,sim:__ca2.SIMW.on,off:__ca2.WC.simOff,err:__ca2.WC.simErr,cs:__ca2.PF['cluster state'],tr:__ca2.PF['stepTrans']})`);console.log(r)}
console.log(q||'default',h.errs);h.close();s.close();process.exit(0)})();
