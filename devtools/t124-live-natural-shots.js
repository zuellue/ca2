const H=require('/home/sandbox/ca2/devtools/harness.js');
(async()=>{const s=await H.serve(8851);
const b=await H.launch(9799,'https://ca.abdupala.com/index.html?perf=1&gpu=1',['--gpu-ok','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=800,500']);
let ready=false;
for(let i=0;i<60;i++){const r=await b.ev('!!(window.__ca2&&window.__ca2.cells>=0)');if(r===true){ready=true;break;}await b.sleep(400);}
console.log('ready',ready);
if(!ready)process.exit(2);
await b.sleep(3000); // settle into steady animation
await b.shot('/tmp/t124-natural.png'); console.log('A natural done');
console.log('state',await b.ev('JSON.stringify({n:window.__ca2.cells,gpu:window.__ca2.gpuState(),res:window.__ca2.res})'));
await b.ev('window.__ca2.setTiled(true)'); await b.sleep(7000);
await b.shot('/tmp/t124-tiled.png'); console.log('B tiled done');
await b.ev('window.__ca2.setTiled(false)'); await b.sleep(7000);
await b.shot('/tmp/t124-full.png'); console.log('C full done');
await b.ev('window.__ca2.setTiled(null)');
process.exit(0)})().catch(e=>{console.error('ERR',e&&e.message||e);process.exit(1)});
