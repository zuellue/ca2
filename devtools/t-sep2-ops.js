// Per-op bit comparison: V8 Math.hypot/cos/sin vs the Rust ops used by sep2.rs, on realistic inputs.
const fs=require('fs'),path=require('path');
const w=process.argv[2]||path.join(__dirname,'..','wasm/target/wasm32-unknown-unknown/release/ca2core.wasm');
const E=new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(w)),{}).exports;
let seed=7;const rnd=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;
const f=new Float64Array(1),u=new BigInt64Array(f.buffer);const bits=x=>{f[0]=x;return u[0]};
function ulp(a,b){const d=bits(a)-bits(b);return Number(d<0n?-d:d)}
const N=2e6,r={hypotV8:0,hypotPlain:0,cos:0,sin:0},mx={hypotV8:0,hypotPlain:0,cos:0,sin:0};
for(let i=0;i<N;i++){const x=(rnd()-.5)*(i%3?800:2),y=(rnd()-.5)*(i%3?800:2),a=Math.hypot(x,y);
 for(const[k,op,ref]of[['hypotV8',0,a],['hypotPlain',1,a]]){const d=ulp(E.sep2_dbg(op,x,y),ref);if(d){r[k]++;mx[k]=Math.max(mx[k],d)}}
 const ang=(i%24)*Math.PI/12+ (i%5?0:rnd()*6);for(const[k,op,ref]of[['cos',2,Math.cos(ang)],['sin',3,Math.sin(ang)]]){const d=ulp(E.sep2_dbg(op,ang,0),ref);if(d){r[k]++;mx[k]=Math.max(mx[k],d)}}}
console.log({N,mismatchCounts:r,maxUlp:mx});
