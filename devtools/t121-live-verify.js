// t121: post-deploy live verification. Loads the LIVE site and runs the same readback gates.
// Usage: node t121-live-verify.js [baseUrl]
const H=require('./harness.js');
const {execSync}=require('child_process');
const base=process.argv[2]||'https://ca.abdupala.com';
const localMd5=execSync('md5sum ca2.js').toString().split(' ')[0];
const servedMd5=execSync('curl -sL "'+base+'/ca2.js?t='+Date.now()+'" | md5sum').toString().split(' ')[0];
console.log('t121 md5 local',localMd5,'served',servedMd5,servedMd5===localMd5?'MATCH':'MISMATCH');
(async()=>{const s=await H.serve(8845); // local server unused for page load, but harness expects a browser; serve not needed
const b=await H.launch(9794,base+'/index.html?perf=1&gpu=1',['--gpu-ok','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1300,800']);
for(let i=0;i<90;i++){if(await b.ev('!!(window.__ca2&&window.__ca2.cells>=0)')===true)break;await b.sleep(500);}
const L=(k,v)=>console.log('t121',k,v);
L('gpuState',await b.ev('JSON.stringify(window.__ca2.gpuState())'));
L('cmpGmax384',await b.ev('window.__ca2.cmpGmax384()'));
L('cmpGpuPaths',await b.ev('window.__ca2.cmpGpuPaths()'));
L('cluster',await b.ev('window.__ca2.t119cluster()'));
await b.shot('/tmp/t121-live.png');
b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
