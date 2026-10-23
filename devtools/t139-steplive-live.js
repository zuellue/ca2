// t139: live stepLive check. mode 'wasm' (default), 'js' (?nolivewasm=1), 'fallback' (wasm for 20 s, then WC.liveOff forced: JS must continue with the SAME rank history). Prints in-page PF.stepLive EMA (ms/frame), LIVEW wasm-call EMA and liveInfo.
const {serve,launch}=require('./harness.js');
const mode=process.argv[2]||'wasm',port=+process.argv[3];
(async()=>{const s=await serve(port);const h=await launch(port+1000,'http://127.0.0.1:'+port+'/index.html'+(mode==='js'?'?nolivewasm=1':''),[]);
for(let i=0;i<45&&!(await h.ev('!!window.__ca2'));i++)await h.sleep(1000);
await h.sleep(6000);const rd=async tag=>console.log(mode,tag,await h.ev("JSON.stringify({pf:__ca2.PF.stepLive,w:__ca2.LIVEW,info:__ca2.liveInfo(),err:__ca2.WC.liveErr||null})"));
await h.sleep(14000);await rd('t=20s');
if(mode==='fallback'){const before=JSON.parse(await h.ev("JSON.stringify(__ca2.liveInfo())"));await h.ev("__ca2.WC.liveOff=true;1");await h.sleep(8000);await rd('after liveOff');}
else {await h.sleep(10000);await rd('t=30s');}
console.log(JSON.stringify(h.errs));h.close();s.close();process.exit(0)})();
