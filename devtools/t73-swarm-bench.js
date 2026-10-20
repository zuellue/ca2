// swarm step: JS stepSwarm (extracted from ca2.js) vs wasm sw_run on identical food, ms/step + aggregate stats after K steps
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const cont={x:100,y:50,w:900,h:600},P={foodLifeMs:300,foodDensity:0.025};
const mk=()=>new Function('cont','P','clamp','swStat','performance',`var food=[],swT=0;${fn('stepSwarm').replace('if (stepSwarmW()) return;','')};return {step:stepSwarm,get food(){return food},set food(v){food=v},set swT(v){swT=v}};`)(cont,P,(v,a,b)=>v<a?a:v>b?b:v,{born:0,died:0},{now:()=>T});
let T=0;
(async()=>{const E=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..','wasm','target','wasm32-unknown-unknown','release','ca2core.wasm')),{})).instance.exports;
for(const N of [300,1000,3000]){
 const base=[];for(let i=0;i<N;i++)base.push({x:cont.x+Math.random()*cont.w,y:cont.y+Math.random()*cont.h,r:Math.random()});
 const J=mk();J.food=base.map(f=>({...f}));let t0=process.hrtime.bigint();for(let k=0;k<50;k++){T+=16;J.step();}const tj=Number(process.hrtime.bigint()-t0)/1e6/50;
 let food=base.map(f=>({...f,vx:(Math.random()-0.5)*0.4,vy:(Math.random()-0.5)*0.4}));let tw=0;let swT=0;
 for(let k=0;k<50;k++){const n=food.length,ip=E.sw_in(n),buf=new Float64Array(E.memory.buffer,ip,n*6+6);
  const a=process.hrtime.bigint();
  for(let i=0;i<n;i++){const f=food[i],b=i*6;buf[b]=f.x;buf[b+1]=f.y;buf[b+2]=f.vx;buf[b+3]=f.vy;buf[b+4]=f.r;}
  const m=E.sw_run(n,cont.x,cont.x+cont.w,cont.y,cont.y+cont.h,0,1,0,1+k,2+k);
  const o=new Float64Array(E.memory.buffer,E.sw_out(),m*7),out=new Array(m);
  for(let q=0;q<m;q++){const b=q*7,s=o[b+5];const f=food[s];f.x=o[b];f.y=o[b+1];f.vx=o[b+2];f.vy=o[b+3];out[q]=f;}
  food=out;tw+=Number(process.hrtime.bigint()-a)/1e6;}
 console.log('N',N,'JS ms/step',tj.toFixed(3),'wasm ms/step (incl pack+unpack)',(tw/50).toFixed(3),'speedup x'+(tj/(tw/50)).toFixed(1));}
})();
