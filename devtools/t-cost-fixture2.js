// t-cost-fixture2: random-transport method bench on the captured fixture (t-cost-fixture.json).
// Rows: default (kernel PRNG), jsrnd (per-draw env.js_rnd), jsrndbatch (shared buffer, fill-on-exhaust).
// Measures sim_step us/step (median/p10/p90), boundary crossings per step, and verifies jsrnd vs
// jsrndbatch BYTE equality of world state + identical draw counts over 120 steps (same stream).
const fs=require('fs');const F=JSON.parse(fs.readFileSync(''+__dirname+'/t-cost-fixture.json','utf8'));
const R=__dirname+'/../';
const MULT=+process.env.MULT||1;
if(MULT>1){const n0=F.n,cx=F.p[49],cy=F.p[50],cw=F.p[51],ch=F.p[52];let a=99;const rn=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const cells=F.cells.slice(),shp=F.shp.slice();for(let m=1;m<MULT;m++)for(let i=0;i<n0;i++){const r=F.cells.slice(i*24,i*24+24);r[0]=cx+rn()*cw;r[1]=cy+rn()*ch;r[14]=-1;cells.push(...r);shp.push(...F.shp.slice(i*12,i*12+12));}
 const fx=F.fx.slice(),fy=F.fy.slice();for(let m=1;m<MULT;m++)for(let i=0;i<F.nf;i++){fx.push(cx+rn()*cw);fy.push(cy+rn()*ch);}
 F.cells=cells;F.shp=shp;F.fx=fx;F.fy=fy;F.n=n0*MULT;F.nf=F.nf*MULT;}
const stream=new Float64Array(1<<16);{let a=7;for(let i=0;i<stream.length;i++){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;stream[i]=((t^t>>>14)>>>0)/4294967296;}}
let k=0,calls=0,fills=0;
function inst(path,mode){const H={E:null}; // fill reads H.E at call time (post-instantiate), views re-created per fill (memory may grow)
  const imp={env:{js_rnd:function(ln){calls++;return stream[k++&65535];},
    js_rnd_fill:function(){fills++;const E=H.E;const cap=E.sim_rndcap();const b=new Float64Array(E.memory.buffer,E.sim_rndbuf_ptr(),cap);const m=new Uint32Array(E.memory.buffer,E.sim_rndmeta_ptr(),2);for(let i=0;i<cap;i++)b[i]=stream[k++&65535];m[0]=0;m[1]=cap;}}};
  const ins=new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(path)),mode?imp:{});H.E=ins.exports;return {E:H.E,mode};}
function setup(E,mode){const n=F.n,nf=F.nf,ncm=F.ncm,cap=n+256;
  E.sim_cells(cap);E.sim_food(nf+1);E.sim_cm(ncm+1);
  const b=E.memory.buffer;
  const cf=new Float64Array(b,E.sim_cells(cap),cap*24);cf.fill(0);cf.set(F.cells);
  new Float64Array(b,E.sim_shp_ptr(),cap*12).set(F.shp);
  E.sim_set_n(n);E.sim_set_nf(nf);new Float64Array(b,E.sim_food(nf+1),nf+1).set(F.fx);new Float64Array(b,E.sim_food_y(),nf+1).set(F.fy);
  new Float64Array(b,E.sim_cm(ncm+1),(ncm+1)*5).set(F.cmf);new Float64Array(b,E.sim_cm_ids(),ncm+1).set(F.cid);E.sim_cm_count(ncm);
  const p=new Float64Array(b,E.sim_params(),mode?100:96);p.set(F.p);if(mode){p[96]=240;p[97]=0.3;}}
function step(E,mode){if(mode)E.sim_step(0,0);else E.sim_step(123456789,987654321);}
function resetMeta(E,mode){if(mode===2){const m=new Uint32Array(E.memory.buffer,E.sim_rndmeta_ptr(),2);m[0]=0;m[1]=0;}}
function bench(name,path,mode,K){const {E}=inst(path,mode);const ts=[];let cps=0,totFills=0,totCalls=0;
  // no per-iter META reset for mode 2: a fill covers ~cap/drawsPerStep steps, so steady-state amortizes
  for(let i=0;i<K+200;i++){setup(E,mode);calls=0;fills=0;const t=process.hrtime.bigint();step(E,mode);const d=Number(process.hrtime.bigint()-t);if(i>=200){ts.push(d);cps=calls;totCalls+=calls;totFills+=fills;}}
  ts.sort((a,b)=>a-b);return {name,usMed:+(ts[ts.length>>1]/1000).toFixed(3),usP10:+(ts[ts.length/10|0]/1000).toFixed(3),usP90:+(ts[ts.length*0.9|0]/1000).toFixed(3),jsRndCalls:cps,fillsPerStep:+(totFills/K).toFixed(4),callsPerStep:+(totCalls/K).toFixed(1),n:F.n};}
function parity(pathA,pathB,steps){const a=inst(pathA,1),b=inst(pathB,2);setup(a.E,1);setup(b.E,2);let diff=0,firstDiff=-1;
  for(let s=0;s<steps;s++){k=0;calls=0;step(a.E,1);const ca=calls;k=0;calls=0;fills=0;resetMeta(b.E,2);step(b.E,2);const consumed=new Uint32Array(b.E.memory.buffer,b.E.sim_rndmeta_ptr(),2)[0];
    if(ca!==consumed&&firstDiff<0)firstDiff=s;
    const na=new Float64Array(a.E.memory.buffer,a.E.sim_cells(F.n+256),(F.n+256)*24),nb=new Float64Array(b.E.memory.buffer,b.E.sim_cells(F.n+256),(F.n+256)*24);
    for(let i=0;i<na.length;i++)if(!Object.is(na[i],nb[i])){diff++;if(firstDiff<0)firstDiff=s;break;}
    const oa=new Float64Array(a.E.memory.buffer,a.E.sim_out(),32),ob=new Float64Array(b.E.memory.buffer,b.E.sim_out(),32);
    for(let i=0;i<32;i++)if(!Object.is(oa[i],ob[i])){diff++;break;}}
  return {steps,mismatchSteps:diff,firstDiffStep:firstDiff};}
const K=+process.argv[2]||3000;
const rows=[['default-shipped-nonSIMD',R+'ca2core.wasm',0],['jsrnd-nonSIMD',R+'ca2core-jsrnd.wasm',1],['jsrndbatch-nonSIMD',R+'ca2core-jsrnd2.wasm',2],
 ['default-shipped-SIMD',R+'ca2core-simd.wasm',0],['jsrnd-SIMD',R+'ca2core-jsrnd-simd.wasm',1],['jsrndbatch-SIMD',R+'ca2core-jsrnd2-simd.wasm',2]];
const res=[];for(let rep=0;rep<3;rep++)for(const [nm,pa,md] of rows){try{res.push(Object.assign({rep},bench(nm,pa,md,K)));}catch(e){res.push({rep,name:nm,err:String(e).slice(0,200)});}}
for(const r of res)console.log(JSON.stringify(r));
console.log('PARITY-nonSIMD',JSON.stringify(parity(R+'ca2core-jsrnd.wasm',R+'ca2core-jsrnd2.wasm',120)));
console.log('PARITY-SIMD',JSON.stringify(parity(R+'ca2core-jsrnd-simd.wasm',R+'ca2core-jsrnd2-simd.wasm',120)));
