// t120: FINAL gate suite, single commit. All gates on one page session, order matters:
// adaptive GMAX (2040 here) must stay intact for cmp/synth/cluster/screens; setGmaxTest only in the n>GMAX block, last.
// Usage: node t120-final-gate.js
const H=require('./harness.js');
const commit=require('child_process').execSync('git rev-parse --short HEAD').toString().trim();
(async()=>{const s=await H.serve(8844);
const b=await H.launch(9793,'http://localhost:8844/index.html?perf=1&gpu=1',['--gpu-ok','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1300,800']);
for(let i=0;i<60;i++){if(await b.ev('!!(window.__ca2&&window.__ca2.cells>=0)')===true)break;await b.sleep(500);}
await b.ev(`(()=>{const A=window.__ca2;A.setKey('grain',0);A.setKey('audioOn',0);A.setKey('autoQuality',0);A.setKey('minRefreshInterval',60000);A.setKey('maxRefreshInterval',60000);A.setKey('energyConsumptionRate',0.002);A.setKey('selectOn',0);return 1})()`);
const L=(k,v)=>console.log('t120',commit,k,v);
L('commit',commit);
// scale 1: n~250, normal cap
await b.ev(`window.__ca2.setKey('UNIVERSE_SIZE',250)`);await b.sleep(5000);
await b.ev('delete window.__t118pack');
L('cmp250',await b.ev('window.__ca2.cmpGpuPaths()'));
// scale 2: n~1000, normal cap
await b.ev(`window.__ca2.setKey('UNIVERSE_SIZE',1000)`);await b.sleep(8000);
await b.ev('delete window.__t118pack');
L('cmp1000',await b.ev('window.__ca2.cmpGpuPaths()')); // freezes the shared pack at this scene
// perf: SAME frozen scene (pack from cmp1000), interleaved t/f/f/t, 40s passes, 1px readPixels forced completion
L('perfT1',await b.ev('window.__ca2.t118(true,40)'));
L('perfF1',await b.ev('window.__ca2.t118(false,40)'));
L('perfT2',await b.ev('window.__ca2.t118(true,40)'));
L('perfF2',await b.ev('window.__ca2.t118(false,40)'));
// visual evidence: live page on wip defaults to tiled GPU at this n; then forced full-pass
await b.shot('/tmp/t120-tiled.png');
await b.ev('window.__ca2.setTiled(false)');await b.sleep(2500);
await b.shot('/tmp/t120-full.png');
await b.ev('window.__ca2.setTiled(null)');
// no-clamp subdivision gates
L('synth64',await b.ev('window.__ca2.t119synth(64,1000)'));
L('synth32',await b.ev('window.__ca2.t119synth(32,1000)'));
// real gOv fixture: n=GMAX fully clustered (GMAX still the adaptive 2040)
L('cluster',await b.ev('window.__ca2.t119cluster()'));
// n>GMAX regression: existing CPU path intact (pack bail), renderer + counters + same-input parity
await b.ev('window.__ca2.setGmaxTest(32)');await b.sleep(1500);
L('bailSrc',await b.ev('JSON.stringify(window.__ca2.srcStat())'));
L('bailGpuState',await b.ev('JSON.stringify(window.__ca2.gpuState())'));
L('bailCmp',await b.ev('window.__ca2.cmpOverflowBaseline()'));
await b.ev('window.__ca2.setGmaxTest(0)');
b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
