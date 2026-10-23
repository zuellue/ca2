// t119: gpuTiles subdivision + overflow gate. cmpGpuPaths under a forced tiny per-tile cap:
// cap=64 -> subdivision engages, no overflow expected -> tiled must stay bit-identical to full.
// cap=8  -> deep subdivision to the 16px floor; pathological tiles clamp with gOv counted
//           (diffs allowed ONLY because clamping drops sources; overflow must be reported >0 then).
// Usage: node t119-subdivision.js <tag> [N]
const H=require('./harness.js');
const tag=process.argv[2]||'run', N=+(process.argv[3]||250);
(async()=>{const s=await H.serve(8844);
const b=await H.launch(9793,'http://localhost:8844/index.html?perf=1&gpu=1',['--gpu-ok','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1300,800']);
for(let i=0;i<60;i++){if(await b.ev('!!(window.__ca2&&window.__ca2.cells>=0)')===true)break;await b.sleep(500);}
await b.ev(`(()=>{const A=window.__ca2;A.setKey('grain',0);A.setKey('audioOn',0);A.setKey('autoQuality',0);A.setKey('minRefreshInterval',60000);A.setKey('maxRefreshInterval',60000);A.setKey('energyConsumptionRate',0.002);A.setKey('selectOn',0);return 1})()`);
await b.ev(`window.__ca2.setKey('UNIVERSE_SIZE',${N})`);
await b.sleep(5000);
console.log('t119',tag,'state',await b.ev('JSON.stringify({n:window.__ca2.cells,res:window.__ca2.res,src:window.__ca2.srcStat()})'));
console.log('t119',tag,'synth64',await b.ev('window.__ca2.t119synth(64,1000)'));
console.log('t119',tag,'synth16',await b.ev('window.__ca2.t119synth(32,1000)'));
await b.ev('window.__ca2.setGmaxTest(32)'); // force overflow in the LIVE path
await b.sleep(1500);
console.log('t119',tag,'liveOverflowGpuOn',await b.ev('JSON.stringify(window.__ca2.gpuState())'));
console.log('t119',tag,'overflowCost',await b.ev('window.__ca2.cmpOverflowCost()')); // same frozen input: baseline GPU full pass vs candidate overflow CPU fallback raster delta
console.log('t119',tag,'overflowBaseline',await b.ev('window.__ca2.cmpOverflowBaseline()')); // same frozen input: candidate overflow frame vs live-baseline renderer at that frame
await b.ev('window.__ca2.setGmaxTest(0)');
b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
