// t98: live wasm/JS before/after — two full boots (default vs ?nowasm=1), visuals trimmed to dodge the
// 0.7fps sandbox pathology (learning: grain=0, audioOn=0, showAxis=0, metaballStrength=0 -> 15-20fps).
// Reads HUD perf marks (PF EMAs) for every ported stage + real fps from SIMW.frames.
const H=require('/home/sandbox/ca2/devtools/harness.js');
async function boot(port,serve,url){
  const b=await H.launch(port,url,[]);
  for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
  await b.sleep(4000);
  await b.ev('__ca2.setKey("grain",0);__ca2.setKey("audioOn",0);__ca2.setKey("showAxis",0);__ca2.setKey("metaballStrength",0);"trimmed"');
  await b.sleep(3000);
  const f0=await b.ev('__ca2.SIMW.frames||0');const t0=Date.now();
  await b.sleep(30000);
  const f1=await b.ev('__ca2.SIMW.frames||0');const t1=Date.now();
  const pf=await b.ev('JSON.stringify(__ca2.PF)');
  const extra=await b.ev('JSON.stringify({cells:__ca2.cells,food:__ca2.getFood().length,simOn:__ca2.SIMW.on,fw:{sp:__ca2.WC.fwSp||0,wm:__ca2.WC.fwWm||0,pa:__ca2.WC.fwPa||0,tr:__ca2.WC.fwTr||0,fd:__ca2.WC.fwFd||0,bl:__ca2.WC.fwBl||0,kp:__ca2.WC.fwKp||0,bs:__ca2.WC.fwBs||0},errs:0})');
  b.close();
  return {fps:(f1-f0)/((t1-t0)/1000),pf:JSON.parse(pf),extra:JSON.parse(extra)};
}
(async()=>{const s=await H.serve(8817);
const w=await boot(9557,s,'http://localhost:8817/index.html?perf=1');
const j=await boot(9558,s,'http://localhost:8817/index.html?perf=1&nowasm=1');
s.close();
const keys=['food step','foodKeepIn','stepTrans','cluster state','sim loop+parasites','axis+tally','hud text','sim+ui draw'];
console.log('stage,wasm_ms,js_ms');
for(const k of keys)console.log(`"${k}",${(w.pf[k]||0).toFixed(4)},${(j.pf[k]||0).toFixed(4)}`);
console.log('fps wasm',w.fps.toFixed(1),'js',j.fps.toFixed(1));
console.log('wasm extra',JSON.stringify(w.extra));console.log('js extra',JSON.stringify(j.extra));
process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
