// CDP sampling profiler over a live run: self + inclusive ms per ca2.js function. usage: node t71-prof.js "<query>" [seconds] [out]
const H=require('./harness.js');const fs=require('fs');
const q=process.argv[2]||'?perf=1',secs=+process.argv[3]||12;
(async()=>{const s=await H.serve(8791);const b=await H.launch(9531,'http://localhost:8791/index.html'+q,[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(6000);if(process.argv[5]){console.log('PRE',await b.ev(process.argv[5]));await b.sleep(3000);}
await b.send('Profiler.enable');await b.send('Profiler.setSamplingInterval',{interval:200});await b.send('Profiler.start');
const f0=await b.ev('__ca2.cells');await b.sleep(secs*1000);
const {profile}=await b.send('Profiler.stop');
const nodes=new Map();profile.nodes.forEach(n=>nodes.set(n.id,n));
const self=new Map();profile.samples.forEach((id,i)=>{self.set(id,(self.get(id)||0)+(profile.timeDeltas[i]||0));});
const parent=new Map();profile.nodes.forEach(n=>(n.children||[]).forEach(c=>parent.set(c,n.id)));
const selfBy={},incBy={};let total=0;
for(const [id,us] of self){const n=nodes.get(id),cf=n.callFrame;const key=(cf.functionName||'(anon)')+':'+cf.lineNumber;total+=us;
 selfBy[key]=(selfBy[key]||0)+us;const seen=new Set();let cur=id;while(cur){const c=nodes.get(cur).callFrame;const k=(c.functionName||'(anon)')+':'+c.lineNumber;if(!seen.has(k)){seen.add(k);incBy[k]=(incBy[k]||0)+us;}cur=parent.get(cur);}}
const top=(o,n)=>Object.entries(o).sort((a,c)=>c[1]-a[1]).slice(0,n).map(([k,v])=>k+' '+(v/1000/secs).toFixed(2)+'ms/s');
const fr=await b.ev('JSON.stringify({cells:__ca2.cells,simw:__ca2.SIMW,pf:__ca2.PF,food:__ca2.getFood().length,mode:__ca2.P.foodMode,wc:{ok:__ca2.WC.ok,simd:__ca2.WC.simd,simOff:__ca2.WC.simOff}})');
console.log('STATE',fr);console.log('total sampled ms/s',(total/1000/secs).toFixed(1));
console.log('SELF\n '+top(selfBy,28).join('\n '));console.log('INCL\n '+top(incBy,40).join('\n '));
fs.writeFileSync('/tmp/prof-'+(process.argv[4]||'run')+'.json',JSON.stringify({selfBy,incBy,secs,total}));
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
