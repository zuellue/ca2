// t123: one bounded screenshot of the live deployed page, animation frozen.
const H=require('./harness.js');
(async()=>{const s=await H.serve(8847);
const b=await H.launch(9796,'https://ca.abdupala.com/index.html?perf=1&gpu=1',['--gpu-ok','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1300,800']);
for(let i=0;i<90;i++){if(await b.ev('!!(window.__ca2&&window.__ca2.cells>=0)')===true)break;await b.sleep(500);}
await b.sleep(3000); // let the field settle into a representative frame
await b.ev('window.requestAnimationFrame=function(){return 0};1'); // freeze the loop
await b.sleep(1200);
console.log('t123 state',await b.ev('JSON.stringify({n:window.__ca2.cells,gpu:window.__ca2.gpuState()})'));
await b.shot('/tmp/t123-live.png');
console.log('t123 shot saved');
b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
