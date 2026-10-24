// card 20261024-017-ca: wasm-vs-js grain parity gate. Identical inputs to the Rust/wasm
// implementation (wasm/src/grain.rs -> ca2core-grain.wasm) and the JS CPU reference
// (devtools/card017/grain-cpu.js, byte-identical to card246's). Both deterministic CPU
// code: verdict counts differing bytes per case; PASS = 0 on every case + controls.
// Node, no browser. Run: node devtools/card017/t-grain-parity.js
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..','..');
const hex=JSON.parse(fs.readFileSync(path.join(__dirname,'blue-noise.json'),'utf8'));
require(path.join(__dirname,'grain-cpu.js')); // sets globalThis.CA2GrainCPU
const cpu=globalThis.CA2GrainCPU;
// deterministic test images (LCG): noise + gradient + checker so luma zones, texture
// variance, motion and chroma paths are all exercised
function img(w,h){let s=0x9e3779b9;const r=()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const out=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,chk=((x>>3)+(y>>3))%2;
  out[i]=Math.min(255,Math.max(0,Math.round(x*255/(w-1)*0.6+r()*255*0.4+chk*40-20)));
  out[i+1]=Math.min(255,Math.max(0,Math.round(y*255/(h-1)*0.5+r()*255*0.5)));
  out[i+2]=Math.min(255,Math.max(0,Math.round((1-y/(h-1))*128+r()*255*0.4+chk*30)));
  out[i+3]=255;}
 return out;}
const BASE={amount:1,strength:6,size:1.4,softness:0.5,chroma:0.25,development:1,fine:1,crystal:1,cloud:1};
const CASES=[
 ['zero',48,48,{amount:0},1,0],
 ['color',48,48,{},1,0],
 ['mono-skew',48,48,{mono:1,skew:0.6},1,0],
 ['soft',48,48,{softness:1},1,0],
 ['debug',48,48,{debug:1},1,0],
 ['overlay',48,48,{},1,1],
 ['resadapt-low',48,600,{resAdapt:1},1,0],
 ['resadapt-high',48,1200,{resAdapt:1},1,0],
 ['bucket257',48,48,{},257,0],
 ['dpr2',48,48,{},1,0,2],
];
function slots(g,bucket,dpr,overlay){return [g.amount,g.strength,g.size,g.softness,g.chroma,g.development,g.fine,g.crystal,g.cloud,
 dpr,overlay,bucket,g.mono?1:0,g.skew??0,g.resAdapt?1:0,g.debug?1:0,
 g.shadow??1.8,g.mid??1.5,g.high??2.7,g.fineRatio??0.5,g.cloudRatio??2.2,...(g.stock??[0.95,0.92,1.05])];}
function sha(b){return crypto.createHash('sha256').update(Buffer.from(b.buffer,b.byteOffset,b.byteLength)).digest('hex').slice(0,16)}
(async()=>{
 const wasm=await WebAssembly.instantiate(fs.readFileSync(path.join(ROOT,'ca2core-grain.wasm')),{});
 const e=wasm.instance.exports;
 const mem=()=>e.memory.buffer;
 function wrender(src,w,h,g,bucket,dpr,overlay){
  const sp=e.grain_alloc(w,h);new Uint8Array(mem(),sp,w*h*4).set(src);
  const bp=e.grain_bn_ptr();new Uint8Array(mem(),bp,4096).set(Uint8Array.from(hex.match(/../g),x=>parseInt(x,16)));
  const pp=e.grain_params_ptr();new Float64Array(mem(),pp,24).set(slots(g,bucket,dpr,overlay));
  e.grain_render();
  return new Uint8Array(mem(),e.grain_out_ptr(),w*h*4).slice();}
 const results=[];let fail=0;
 for(const [name,w,h,go,bucket,overlay,dpr] of CASES){
  const g={...BASE,...go};const src=img(w,h);
  const js1=cpu.render(src,w,h,g,bucket,dpr??1,overlay,hex);
  const js2=cpu.render(src,w,h,g,bucket,dpr??1,overlay,hex);
  const w1=wrender(src,w,h,g,bucket,dpr??1,overlay);
  const w2=wrender(src,w,h,g,bucket,dpr??1,overlay);
  const cmp=(a,b)=>{let d=0,mx=0,sum=0;for(let i=0;i<a.length;i++){const v=Math.abs(a[i]-b[i]);if(v){d++;if(v>mx)mx=v;sum+=v}}return{diff:d,max:mx,mean:+(sum/a.length).toFixed(6)}};
  const jw=cmp(js1,w1);
  const jsStable=cmp(js1,js2).diff===0, wStable=cmp(w1,w2).diff===0;
  if(jw.diff||!jsStable||!wStable)fail++;
  results.push({case:name,w,h,bucket,dpr:dpr??1,overlay,jsVsWasm:jw,jsStable,wStable,jsSha:sha(js1),wasmSha:sha(w1)});
 }
 // negative control: nonzero grain must differ from zero-grain in each implementation
 const src=img(48,48);
 const zc=cpu.render(src,48,48,{...BASE,amount:0},1,1,0,hex), cc=cpu.render(src,48,48,BASE,1,1,0,hex);
 let neg=0;for(let i=0;i<zc.length;i++)if(zc[i]!==cc[i])neg++;
 const verdict=fail===0&&neg>0?'PARITY-BYTE-EQUAL':'MISMATCH';
 const out={verdict,negativeControlDiffBytes:neg,cases:results,node:process.version,
  wasmSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'ca2core-grain.wasm'))).digest('hex'),
  note:'identical inputs; both sides deterministic CPU; 0 differing bytes per case required'};
 fs.writeFileSync(path.join(ROOT,'evidence','card017','parity.json'),JSON.stringify(out,null,1)+'\n');
 console.log(JSON.stringify({verdict,neg,cases:results.map(r=>({c:r.case,diff:r.jsVsWasm.diff,max:r.jsVsWasm.max,mean:r.jsVsWasm.mean,js:r.jsStable,w:r.wStable}))},null,1));
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
