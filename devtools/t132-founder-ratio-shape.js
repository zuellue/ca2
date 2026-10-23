const {serve,launch}=require('./harness.js');
const q=process.argv[2]||'',port=+process.argv[3];
(async()=>{const s=await serve(port);const h=await launch(port+1000,'http://127.0.0.1:'+port+'/index.html?'+q,[]);
for(let i=0;i<45&&!(await h.ev('!!window.__ca2'));i++)await h.sleep(1000);
await h.sleep(2000);await h.ev("__ca2.setKey('autoQuality',0);1");
const f0=await h.ev(`(function(){var c=__ca2.getCells();c.forEach(function(k,i){k.shp={t:i%2?0:2,asp:1,th:1,wig:0,wsp:1,sat:i%2?0:2,ph:1,ph2:2,dir:i};});var t=0;__ca2.getCells().forEach(function(k){if(k.shp.t==0)t++});return c.length+' founders, round after set '+t})()`);
await h.sleep(48000);
console.log(q||'wasm',f0,await h.ev(`(function(){var c=__ca2.getCells(),t=[0,0,0];c.forEach(function(k){if(k.shp)t[k.shp.t]++});return JSON.stringify({n:c.length,round:t[0],lobed:t[2],sim:__ca2.SIMW.on})})()`),JSON.stringify(h.errs));
h.close();s.close();process.exit(0)})();
