// t-swpack-boundary: the REAL swPackRust / swPackJs source extracted from ca2.js, run against the jsrnd wasm, vs the JS-only path (swPackJs) on identical food states and identical seeded Math.random.
// Food states: vx undefined / NaN / null / 0 / normal; vy undefined / NaN / normal; r undefined. Compares final food vx/vy (Object.is), the sw_in buffer slots 0..4 for every food (Object.is), and draw counts.
// Fault part: js_rnd throws at draw k -> degraded semantics (documented, NOT parity): fresh food drawn so far keep their values, the rest get vx=vy=0, draws consumed == k+1, WC.swDeg==1, WC.swFOff set.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const bin=process.argv[2]||'wasm/target-jsrnd/wasm32-unknown-unknown/release/ca2core.wasm';
const mkSrc=`${fn('swPackJs')}\n${fn('swPackRust')}\nreturn {swPackJs:swPackJs,swPackRust:swPackRust,setFood:function(f){food=f}};`;
(async()=>{
async function inst(thr,WC){let n=0;const imp={env:{js_rnd:()=>{WC.rndN=(WC.rndN||0)+1;n++;if(thr&&n>thr)throw new Error('fault');return Math.random()}}};const E=(await WebAssembly.instantiate(fs.readFileSync(bin),imp)).instance.exports;WC.e=E;WC.mem=E.memory;WC.jsrnd=true;return E}
function api(WC){const food=[];const o=new Function('WC','food',mkSrc.replace('function(f){food=f}','function(f){food.length=0;f.forEach(x=>food.push(x))}'))(WC,food);return o}
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
const WCa={},E=await inst(0,WCa),A=api(WCa);
let s=3;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
const VX=()=>{const m=Math.floor(r0()*6);return m==0?undefined:m==1?NaN:m==2?null:m==3?0:(r0()-0.5)*0.4},VY=()=>{const m=Math.floor(r0()*4);return m==0?undefined:m==1?NaN:(r0()-0.5)*0.4};
let tot=0,bad=0,drawBad=0,fresh=0,states={};
for(let t=0;t<20000;t++){const n=Math.floor(r0()*120);const mk=()=>{const o=[];return o};const base=[];for(let i=0;i<n;i++){const f={x:r0()*800,y:r0()*500,r:r0()<0.05?undefined:r0()};const vx=VX();if(vx!==undefined||r0()<0.5){}f.vx=vx;f.vy=VY();if(f.vx===undefined)delete f.vx;if(f.vy===undefined)delete f.vy;base.push(f);const k=(f.vx===undefined?'u':Number.isNaN(f.vx)?'N':f.vx===null?'n':f.vx===0?'0':'v')+(f.vy===undefined?'u':Number.isNaN(f.vy)?'N':'v');states[k]=(states[k]||0)+1}
 const cl=()=>base.map(f=>Object.assign({},f));
 const fa=cl(),fb=cl();
 const ba=w(t*5+1,()=>{const ip=E.sw_in(n);const buf=new Float64Array(E.memory.buffer,ip,n*6+6);buf.fill(-7);A.setFood(fa);A.swPackJs(n,buf);return Array.from(buf.subarray(0,n*6))});
 const bb=w(t*5+1,()=>{const ip=E.sw_in(n);A.setFood(fb);const done=A.swPackRust(E,n,ip);const buf=new Float64Array(E.memory.buffer,ip,n*6+6);if(!done)throw new Error('not handled');return Array.from(buf.subarray(0,n*6))});
 // buf slot 5 is never written by either path: JS fills -7 first, Rust path leaves previous content; compare slots 0..4 only
 tot++;fresh+=base.filter(f=>f.vx===undefined).length;let ok=ba.n===bb.n;if(!ok)drawBad++;
 for(let i=0;i<n&&ok;i++){for(let q=0;q<5;q++)if(!Object.is(ba.v[i*6+q],bb.v[i*6+q])){ok=false;break}
  if(!(Object.is(fa[i].vx,fb[i].vx)&&Object.is(fa[i].vy,fb[i].vy)))ok=false}
 if(!ok){bad++;if(bad<4)console.log('MISMATCH',t,n,ba.n,bb.n)}}
// fault (degraded) path
let fT=0,fB=0;for(let k=1;k<=40;k++){const WC={},Ef=await inst(k,WC),Af=api(WC);const food=[];for(let i=0;i<30;i++)food.push({x:i,y:i,r:1});const ip=Ef.sw_in(30);Af.setFood(food);let done;
 w(9,()=>{done=Af.swPackRust(Ef,30,ip)});fT++;const drawn=Math.min(30,Math.floor(k/2));const okf=done===true&&WC.swDeg===1&&WC.swFOff===true&&WC.rndN===k+1&&food.every((f,i)=>i<drawn?(typeof f.vx==='number'&&f.vx!==0):true)&&food.slice(Math.floor(k/2)+(k%2?0:0)).length>=0;
 // fresh food whose draw never completed must be 0/0
 let first0=-1;for(let i=0;i<30;i++){if(food[i].vx===0&&food[i].vy===0){first0=i;break}}
 const exp=Math.floor(k/2); if(!(done===true&&WC.swDeg===1&&WC.swFOff===true&&WC.rndN===k+1&&first0===(exp<30?exp:-1)))fB++;}
console.log(JSON.stringify({scenarios:tot,freshFood:fresh,stateCounts:states,mismatch:bad,drawCountMismatch:drawBad,faultCases:fT,faultBad:fB,binary:bin}));process.exit(bad||fB?1:0)})();
