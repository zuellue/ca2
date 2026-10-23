// t117: GPU-field path engagement + pixel fidelity vs CPU field, on the real GPU code path
// (swiftshader = software rasterizer: engagement+diff evidence, NOT real-GPU speed).
// Usage: node t117-gpu-tile.js <tag>   — run before AND after the tiled-draw patch, diff must match.
const H=require('./harness.js');
const tag=process.argv[2]||'run';
(async()=>{const s=await H.serve(8842);
const b=await H.launch(9791,'http://localhost:8842/index.html?perf=1&gpu=1',['--gpu-ok','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1300,800']);
for(let i=0;i<60;i++){if(await b.ev('!!(window.__ca2&&window.__ca2.cells>=0)')===true)break;await b.sleep(500);}
await b.ev(`(()=>{const A=window.__ca2;A.setKey('grain',0);A.setKey('audioOn',0);A.setKey('autoQuality',0);A.setKey('minRefreshInterval',600);A.setKey('maxRefreshInterval',900);A.setKey('energyConsumptionRate',0.002);A.setKey('selectOn',0);return 1})()`);
console.log(tag,'backend',await b.ev('JSON.stringify({gpu:window.__ca2.gpuState(),wcOff:window.__ca2.WC.off})'));
for(const N of [250,1000]){
  await b.ev(`window.__ca2.setKey('UNIVERSE_SIZE',${N})`);
  await b.sleep(4000);
  console.log(tag,'N='+N,'state',await b.ev('JSON.stringify({n:window.__ca2.cells,res:window.__ca2.res,src:window.__ca2.srcStat()})'));
  console.log(tag,'N='+N,'gmaxAB',await b.ev('window.__ca2.cmpGmax384?window.__ca2.cmpGmax384():"nohook"'));
  console.log(tag,'N='+N,'gpuOn',await b.ev('JSON.stringify(window.__ca2.gpuState())'));
  console.log(tag,'N='+N,'cmp',await b.ev('window.__ca2.cmp()'));
  console.log(tag,'N='+N,'gpuPF',await b.ev(`JSON.stringify({d:+(window.__ca2.PF['gpu:draw+field']||0).toFixed(1),i:+(window.__ca2.PF['gpu:drawImage']||0).toFixed(1),mf:+(window.__ca2.PF['mb:field']||0).toFixed(1)})`));
}
b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
