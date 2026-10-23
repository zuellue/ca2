// t118: real raster wall cost per frame on the SAME FROZEN source array, full-pass vs tiled (page-side __ca2.t118).
// swiftshader = software rasterizer: direction evidence only, NOT real-GPU/Mac speed.
// Usage: node t118-frame-rate.js <tag> [N]
const H=require('./harness.js');
const tag=process.argv[2]||'run', N=+(process.argv[3]||1000);
(async()=>{const s=await H.serve(8843);
const b=await H.launch(9792,'http://localhost:8843/index.html?perf=1&gpu=1',['--gpu-ok','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1300,800']);
for(let i=0;i<60;i++){if(await b.ev('!!(window.__ca2&&window.__ca2.cells>=0)')===true)break;await b.sleep(500);}
await b.ev(`(()=>{const A=window.__ca2;A.setKey('grain',0);A.setKey('audioOn',0);A.setKey('autoQuality',0);A.setKey('minRefreshInterval',60000);A.setKey('maxRefreshInterval',60000);A.setKey('energyConsumptionRate',0.002);A.setKey('selectOn',0);return 1})()`);
await b.ev(`window.__ca2.setKey('UNIVERSE_SIZE',${N})`);
await b.sleep(6000);
console.log('t118',tag,'state',await b.ev('JSON.stringify({n:window.__ca2.cells,res:window.__ca2.res,src:window.__ca2.srcStat(),gpu:window.__ca2.gpuState()})'));
for(const m of [false,true]) console.log('t118',tag,await b.ev(`window.__ca2.t118(${m},12)`));
b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
