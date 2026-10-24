// t-bench-sw-jsrnd: per-step wall time of the default food mode (mode 3 swarm), three routes on identical food:
// A = real JS stepSwarm body (extracted from ca2.js, kernel call stripped), B = shipped default wasm (ca2core.wasm, seeded), C = jsrnd wasm (ca2core-jsrnd.wasm, draws via env.js_rnd).
// Wasm timing INCLUDES the JS-side marshalling (the stepSwarmW glue cost), js_rnd import implemented with the real Math.random. node v22.23.3. This is kernel+glue time, NOT page FPS (render stays JS, unmeasured).
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const cont={x:100,y:50,w:900,h:600},P={foodLifeMs:300,foodDensity:0.025};
const mkJS=()=>new Function('cont','P','clamp','swStat','performance',`var food=[],swT=0;${fn('stepSwarm').replace('if (stepSwarmW()) return;','')};return {step:stepSwarm,get food(){return food},set food(v){food=v},set swT(v){swT=v}};`)(cont,P,(v,a,b)=>v<a?a:v>b?b:v,{born:0,died:0},{now:()=>T});
let T=0;
(async()=>{
const D=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..','ca2core.wasm')),{})).instance.exports;
const J=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..','ca2core-jsrnd.wasm')),{env:{js_rnd:()=>{WCj.rndN=(WCj.rndN||0)+1;return Math.random()}}})).instance.exports;
const WCd={e:D,mem:D.memory,ok:true,off:false,simOff:false},WCj={e:J,mem:J.memory,ok:true,off:false,simOff:false,jsrnd:true,rndN:0};
const mkW=(WC)=>new Function('cont','P','WC','location','clamp','swStat','performance',`var food=[],swT=0;${fn('swPackJs')};${fn('swPackRust')};${fn('stepSwarmW')};return {step:function(){stepSwarmW();},get food(){return food},set food(v){food=v},set swT(v){swT=v}};`)(cont,P,WC,{search:''},(v,a,b)=>v<a?a:v>b?b:v,{born:0,died:0},{now:()=>T});
const out=[];
for(const N of [300,1000,3000]){
 const base=[];for(let i=0;i<N;i++)base.push({x:cont.x+Math.random()*cont.w,y:cont.y+Math.random()*cont.h,r:Math.random()});
 const A=mkJS();A.food=base.map(f=>({...f}));A.swT=-1e9;let t0=process.hrtime.bigint();for(let k=0;k<200;k++){T+=16;A.step();}const tj=Number(process.hrtime.bigint()-t0)/1e6/200;
 const rows={N,jsMs:+tj.toFixed(4)};
 for(const [nm,WC] of [['wasmDefault',WCd],['wasmJsrnd',WCj]]){
  const W=mkW(WC);W.food=base.map(f=>({...f,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4}));W.swT=-1e9;
  for(let k=0;k<30;k++){T+=16;W.step();} // warm JIT + wasm
  const tw=process.hrtime.bigint();for(let k=0;k<200;k++){T+=16;W.step();}rows[nm]=+(Number(process.hrtime.bigint()-tw)/1e6/200).toFixed(4);}
 rows.speedupDefault=+(rows.jsMs/rows.wasmDefault).toFixed(2);rows.speedupJsrnd=+(rows.jsMs/rows.wasmJsrnd).toFixed(2);rows.jsrndVsDefault=+(rows.wasmJsrnd/rows.wasmDefault).toFixed(3);
 out.push(rows);}
console.log(JSON.stringify({env:'node v22.23.3',stepsPerRoute:50,note:'kernel+glue per-step ms; render JS unmeasured; not page FPS'},null,0));out.forEach(r=>console.log(JSON.stringify(r)));})();
