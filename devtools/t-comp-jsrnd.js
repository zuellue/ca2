// t-comp-jsrnd: Rust post_comp_points (jsrnd binary, draws via env.js_rnd) vs the original JS planComposition point block (reference copy below), same seeded Math.random.
// Compares every point (Object.is) and the draw count. Fault part: js_rnd throws at draw k -> exception propagates out of wasm with exactly k draws consumed.
const fs=require('fs');
const bin=process.argv[2]||'wasm/target-jsrnd/wasm32-unknown-unknown/release/ca2core.wasm';
const clamp=(v,a,b)=>v<a?a:v>b?b:v;const rnd=(a,b)=>{if(b===undefined){b=a;a=0}return a+Math.random()*(b-a)};
function jsRef(gx,gy,tw,th,U){const ctr=[];const nC=2+Math.floor(Math.random()*4);for(let i=0;i<nC;i++)ctr.push([gx+tw*rnd(0.12,0.88),gy+th*rnd(0.12,0.88)]);
 const sg=Math.min(tw,th)*rnd(0.08,0.2),pts=[];
 for(let i=0;i<Math.max(1,U);i++){const cc=ctr[i%nC];let px=0,py=0,okp=false;
  for(let j=0;j<12;j++){px=cc[0]+(Math.random()+Math.random()+Math.random()-1.5)*2*sg;py=cc[1]+(Math.random()+Math.random()+Math.random()-1.5)*2*sg;
   if(px>gx+8&&px<gx+tw-8&&py>gy+8&&py<gy+th-8){okp=true;break}}
  if(!okp){px=clamp(px,gx+8,gx+tw-8);py=clamp(py,gy+8,gy+th-8)}pts.push([px,py])}
 return pts}
(async()=>{
let kind=0;const mk=async(thr)=>{let n=0;const imp={env:{js_rnd:()=>{n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}};const E=(await WebAssembly.instantiate(fs.readFileSync(bin),imp)).instance.exports;return{E,cnt:()=>n}};
const {E,cnt}=await mk(0);
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let s=99;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
let tot=0,bad=0,drawBad=0,pointsTot=0,clampPts=0;
for(let t=0;t<20000;t++){
 const tiny=t%5==0; const tw=tiny?10+r0()*40:80+r0()*900, th=tiny?10+r0()*40:60+r0()*600, gx=r0()*300, gy=r0()*200, U=[0,1,2,5,24,90,200][t%7]+Math.floor(r0()*3);
 const seed=t*131+7;
 const a=w(seed,()=>jsRef(gx,gy,tw,th,U));
 const b=w(seed,()=>{const k=E.post_comp_points(gx,gy,tw,th,Math.max(1,U));const m=new Float64Array(E.memory.buffer,E.post_cp_out(),k*2);const o=[];for(let i=0;i<k;i++)o.push([m[2*i],m[2*i+1]]);return o});
 tot++;pointsTot+=a.v.length;
 let ok=a.n===b.n;if(!ok)drawBad++;
 if(a.v.length!==b.v.length)ok=false;else for(let i=0;i<a.v.length;i++){if(!(Object.is(a.v[i][0],b.v[i][0])&&Object.is(a.v[i][1],b.v[i][1]))){ok=false;break}}
 if(!ok){bad++;if(bad<4)console.log('MISMATCH',t,{tw,th,U},a.n,b.n)}
}
// fault: throw at draw k, draws consumed must equal k, exception must propagate
let fTot=0,fBad=0;
for(let k=1;k<=60;k++){const f=await mk(k);let thrown=false;try{w(5,()=>f.E.post_comp_points(10,10,400,300,30))}catch(e){thrown=true}fTot++;if(!(thrown&&f.cnt()===k+1))fBad++; /* js_rnd counts the throwing call too */}
console.log(JSON.stringify({scenarios:tot,points:pointsTot,mismatch:bad,drawCountMismatch:drawBad,faultCases:fTot,faultBad:fBad,binary:bin}));process.exit(bad||fBad?1:0)})();
