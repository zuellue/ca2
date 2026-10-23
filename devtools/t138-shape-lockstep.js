// t138: EXACT-sequence check of JS newShape/mixShape vs wasm new_shape/mix_shape under the same RNG stream (xorshift as sim.rs seed_for_test). Any field difference = draw-order/consumption difference. node devtools/t138-shape-lockstep.js [N]
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
const i0=src.indexOf('function newShape(par)'),j0=src.indexOf('// fitness against the current environment');
const M=(1n<<64n)-1n;let s0,s1,draws=0;
function seed(sd){s0=((BigInt(sd)*0x9E3779B97F4A7C15n)&M)|1n;s1=BigInt(sd)^0xD1B54A32D192ED03n;for(let k=0;k<4;k++)rn();draws=0;}
function rn(){draws++;let x=s0;const y=s1;s0=y;x=(x^(x<<23n))&M;s1=(x^y^(x>>17n)^(y>>26n))&M;return Number(((s1+y)&M)>>11n)/9007199254740992;}
const P={genomeMut:0.5};const rnd=(a,b)=>{if(b===undefined){b=a;a=0}return a+rn()*(b-a)};const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const js=new Function('P','rnd','clamp','Math2',src.slice(i0,j0).replace(/Math\.random\(\)/g,'Math2.r()')+';return {newShape:newShape,mixShape:mixShape}')(P,rnd,clamp,{r:rn});
const F=['t','asp','th','wig','wsp','sat','ph','ph2','dir'];const arr=o=>F.map(k=>o[k]);const obj=a=>{const o={};F.forEach((k,x)=>o[k]=a[x]);return o};
(async()=>{const N=+process.argv[2]||20000;const E=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..','ca2core.wasm')),{})).instance.exports;
const pp=E.sim_params();const p=new Float64Array(E.memory.buffer,pp,96);p[36]=P.genomeMut;
const kinds=[[0,'new(None)'],[1,'new(par)'],[2,'mix(a,b)']];let tot=0,bad=0;const per={};
let rs=77;const r=()=>{rs=(Math.imul(rs,1103515245)+12345)>>>0;return rs/4294967296;};
for(const [kind,name] of kinds){per[name]=0;for(let k=0;k<N;k++){
 const A=[r()<0.5?0:2,1+r()*5,0.3+r()*0.7,r(),0.3+r()*2,r()<0.3?0:2,r()*6,r()*6,r()*6],B=[r()<0.5?0:2,1+r()*5,0.3+r()*0.7,r(),0.3+r()*2,r()<0.3?0:3,r()*6,r()*6,r()*6];
 if(r()<0.1)A[0]=1;if(r()<0.1)B[0]=1;
 const sd=k+1+kind*1000003;seed(sd);const o=kind===0?js.newShape(null):kind===1?js.newShape(obj(A)):js.mixShape(obj(A),obj(B));const jd=draws;
 const tp=E.sh_buf();let t=new Float64Array(E.memory.buffer,tp,28);t.set(A,0);t.set(B,9);E.sh_run(kind,sd);const w=Array.from(new Float64Array(E.memory.buffer,tp,28).slice(18,27));
 const ja=arr(o);let d=0;for(let x=0;x<9;x++)if(!Object.is(ja[x],w[x])&&!(Math.abs(ja[x]-w[x])<1e-12))d=1;tot++;if(d){bad++;per[name]++;if(bad<4)console.log('DIFF',name,sd,'js',ja.map(v=>+v.toFixed(6)).join(','),'wasm',w.map(v=>+v.toFixed(6)).join(','));}}}
console.log('shape exact-sequence: trials',tot,'mismatch',bad,JSON.stringify(per));})();
