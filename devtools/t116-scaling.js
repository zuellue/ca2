// t116: workload scaling profile with explicit backend recording.
// Per (boot, N): real frame deltas (median/p90 over 31 rAF), PF stage ms, res, gpu state,
// WC field backend, plus a one-shot __ca2.cmp() (GPU-vs-CPU field cost on the same scene).
// Backends: 'cpu' = --disable-gpu (CPU metaball path), 'gpu' = swiftshader WebGL (real GPU code path, software rasterizer - path engagement evidence, NOT representative of real-GPU speed).
const H=require('./harness.js');
async function waitBoot(b){for(let i=0;i<60;i++){if(await b.ev('!!(window.__ca2&&window.__ca2.cells>=0)')===true)return true;await b.sleep(500);}return false;}
const FRAMES=`new Promise(res=>{let ts=[],n=0;function f(t){ts.push(t);if(++n<31)requestAnimationFrame(f);else{const d=[];for(let i=1;i<ts.length;i++)d.push(ts[i]-ts[i-1]);d.sort((a,b)=>a-b);res(JSON.stringify({med:+d[15].toFixed(1),p90:+d[27].toFixed(1)}));}}requestAnimationFrame(f);})`;
async function run(url,tag,extra){
  const b=await H.launch(9750+Math.floor(Math.random()*200),url,extra);
  if(!await waitBoot(b)){console.log(tag,'BOOT FAIL');b.close();return;}
  await b.ev(`(()=>{const A=window.__ca2;A.setKey('grain',0);A.setKey('audioOn',0);A.setKey('autoQuality',0);A.setKey('minRefreshInterval',600);A.setKey('maxRefreshInterval',900);A.setKey('energyConsumptionRate',0.002);A.setKey('selectOn',0);return 1})()`);
  console.log(tag,'backend',await b.ev('JSON.stringify({gpu:window.__ca2.gpuState(),wcOff:window.__ca2.WC.off})'));
  for(const N of [100,250,500,1000,2000]){
    await b.ev(`window.__ca2.setKey('UNIVERSE_SIZE',${N})`);
    await b.sleep(4000);
    const ft=await b.ev(FRAMES);
    const pf=await b.ev('JSON.stringify(window.__ca2.PF)');
    const st=await b.ev('JSON.stringify({n:window.__ca2.cells,res:window.__ca2.res,tr:window.__ca2.trans?1:0})');
    const p=JSON.parse(pf);
    console.log(tag,'N='+N,'frame',ft,'state',st,
      'sim:',+(p['sim loop+parasites']||0).toFixed(2),'food:',+(p['food step']||0).toFixed(2),
      'mbfield:',+(p['mb:field']||0).toFixed(1),'mbpix:',+(p['mb:pixel loop']||0).toFixed(1),
      'draw:',+(p['sim+ui draw']||0).toFixed(2));
    if(N===500)console.log(tag,'cmp@500',await b.ev('window.__ca2.cmp()'));
  }
  b.close();
}
(async()=>{const s=await H.serve(8841);
  await run('http://localhost:8841/index.html?perf=1','wasm-cpu',['--window-size=1300,800']);
  await run('http://localhost:8841/index.html?perf=1&nowasm=1','js-cpu',[]);
  await run('http://localhost:8841/index.html?perf=1','wasm-gpu',['--gpu-ok','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1300,800']);
  s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
