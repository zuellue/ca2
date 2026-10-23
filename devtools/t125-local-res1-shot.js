const H=require('/home/sandbox/ca2/devtools/harness.js');
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
(async()=>{
log('serve start');await H.serve(8853);log('served');
const b=await H.launch(9801,'http://localhost:8853/index.html?perf=1&gpu=1',['--gpu-ok','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=800,500']);
log('launched');
for(let i=0;i<40;i++){const r=await b.ev('!!(window.__ca2&&window.__ca2.cells>=0)').catch(()=>null);if(r===true)break;await b.sleep(500);}
log('ready');
await b.ev(`(()=>{const A=window.__ca2;A.setKey('autoQuality',0);A.setKey('grain',0);return 1})()`).catch(e=>log('setKey err',e.message));
await b.sleep(3000);
log('state',await b.ev('JSON.stringify({n:window.__ca2.cells,gpu:window.__ca2.gpuState(),res:window.__ca2.res})'));
await b.shot('/tmp/t125-local-res1.png');
log('shot saved');
process.exit(0)})().catch(e=>{console.error('ERR',e&&e.message||e);process.exit(1)});
